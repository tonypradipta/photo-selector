<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Project;
use App\Services\DeliveryService;
use App\Services\EditedFolderSyncService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    /**
     * List all projects for delivery management.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = $request->query('search');

        $query = $request->user()
            ->projects()
            ->has('selections')
            ->withCount('selections as selected_count')
            ->withCount('editedPhotos as edited_count')
            ->withCount(['editedPhotos as matched_count' => fn($q) => $q->where('match_status', 'matched')])
            ->with(['latestDelivery'])
            ->orderByDesc('updated_at');

        if ($status === 'editing') {
            $query->where('status', '!=', Project::STATUS_COMPLETED);
        } elseif ($status === 'completed') {
            $query->where('status', Project::STATUS_COMPLETED);
        } elseif ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%");
            });
        }

        $projects = $query->get();

        $projects->each(function ($project) {
            $project->append(['preview_thumbnails', 'edited_preview_thumbnails']);
            // If project is not completed, normalize display status to editing
            if ($project->status !== Project::STATUS_COMPLETED) {
                $project->status = Project::STATUS_EDITING;
            }
        });

        $allCount = $request->user()->projects()->has('selections')->count();
        $completedCount = $request->user()->projects()->has('selections')->where('status', Project::STATUS_COMPLETED)->count();
        $editingCount = $allCount - $completedCount;

        $counts = [
            'all' => $allCount,
            'editing' => max(0, $editingCount),
            'completed' => $completedCount,
        ];

        return response()->json([
            'data' => $projects,
            'counts' => $counts,
        ]);
    }

    /**
     * Show project delivery workspace info.
     */
    public function show(Request $request, int $id, EditedFolderSyncService $syncService, DeliveryService $deliveryService): JsonResponse
    {
        $project = $request->user()
            ->projects()
            ->withCount('selections as selected_count')
            ->withCount('editedPhotos as edited_count')
            ->with(['deliveries' => fn($q) => $q->orderByDesc('created_at')])
            ->findOrFail($id);

        $syncStatus = null;
        if ($project->edited_folder_id) {
            $syncStatus = $syncService->getSyncStatus($project);
        }

        $latestDelivery = $project->deliveries->firstWhere('status', 'active');
        $whatsappMessage = null;
        if ($latestDelivery) {
            $whatsappMessage = $deliveryService->generateWhatsAppMessage($project, $latestDelivery);
        }

        return response()->json([
            'project' => $project,
            'sync_status' => $syncStatus,
            'active_delivery' => $latestDelivery,
            'deliveries' => $project->deliveries,
            'whatsapp_message' => $whatsappMessage,
        ]);
    }

    /**
     * Update project edited folder URL / ID.
     */
    public function updateFolder(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'edited_folder_url' => ['required', 'url'],
        ]);

        $project = $request->user()->projects()->findOrFail($id);
        $url = $request->input('edited_folder_url');
        $folderId = $this->extractDriveFolderId($url);

        if (!$folderId) {
            return response()->json(['message' => 'URL Google Drive Folder tidak valid.'], 422);
        }

        $project->update([
            'edited_folder_url' => $url,
            'edited_folder_id' => $folderId,
        ]);

        return response()->json([
            'message' => 'Folder hasil edit berhasil disimpan.',
            'project' => $project,
        ]);
    }

    /**
     * Trigger sync & match for edited folder.
     */
    public function sync(Request $request, int $id, EditedFolderSyncService $syncService): JsonResponse
    {
        $project = $request->user()->projects()->findOrFail($id);

        try {
            $result = $syncService->sync($project);

            return response()->json([
                'message' => 'Sync folder hasil edit berhasil.',
                'data' => $result,
                'project' => $project->fresh(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Gagal melakukan sinkronisasi: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get sync and match status.
     */
    public function getSyncStatus(Request $request, int $id, EditedFolderSyncService $syncService): JsonResponse
    {
        $project = $request->user()->projects()->findOrFail($id);

        if (!$project->edited_folder_id) {
            return response()->json(['message' => 'Folder edit belum dihubungkan.'], 400);
        }

        $status = $syncService->getSyncStatus($project);
        return response()->json(['data' => $status]);
    }

    /**
     * Create delivery link and generate WhatsApp template.
     */
    public function send(Request $request, int $id, DeliveryService $deliveryService): JsonResponse
    {
        $request->validate([
            'pin' => ['nullable', 'string', 'min:4', 'max:12'],
            'expires_in_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'force' => ['boolean'],
        ]);

        $project = $request->user()->projects()->findOrFail($id);

        try {
            $rawPin = $request->input('pin');
            $delivery = $deliveryService->createDelivery($project, [
                'pin' => $rawPin,
                'expires_in_days' => $request->input('expires_in_days'),
                'notes' => $request->input('notes'),
                'force' => $request->boolean('force'),
            ]);

            $whatsappMessage = $deliveryService->generateWhatsAppMessage($project, $delivery, $rawPin);
            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');

            return response()->json([
                'message' => 'Link delivery berhasil dibuat.',
                'delivery' => $delivery,
                'delivery_url' => "{$frontendUrl}/delivery/{$delivery->delivery_token}",
                'whatsapp_message' => $whatsappMessage,
                'project' => $project->fresh(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Revoke a delivery link.
     */
    public function revoke(Request $request, int $id, int $deliveryId): JsonResponse
    {
        $project = $request->user()->projects()->findOrFail($id);
        $delivery = $project->deliveries()->findOrFail($deliveryId);

        $delivery->update(['status' => 'revoked']);

        return response()->json([
            'message' => 'Link delivery telah dinonaktifkan.',
            'delivery' => $delivery,
        ]);
    }

    /**
     * Mark project as Completed.
     */
    public function complete(Request $request, int $id): JsonResponse
    {
        $project = $request->user()->projects()->findOrFail($id);

        $project->update([
            'status' => Project::STATUS_COMPLETED,
            'completed_at' => $project->completed_at ?? now(),
        ]);

        return response()->json([
            'message' => 'Project berhasil ditandai Selesai (Completed).',
            'project' => $project,
        ]);
    }

    private function extractDriveFolderId(string $url): ?string
    {
        $trimmed = trim($url);
        if (preg_match('/folders\/([a-zA-Z0-9_-]+)/', $trimmed, $m)) {
            return $m[1];
        }
        if (preg_match('/[?&]id=([a-zA-Z0-9_-]+)/', $trimmed, $m)) {
            return $m[1];
        }
        if (preg_match('/^[a-zA-Z0-9_-]{10,100}$/', $trimmed)) {
            return $trimmed;
        }

        return null;
    }
}
