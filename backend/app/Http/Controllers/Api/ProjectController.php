<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use App\Models\Project;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * List all projects for authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $projects = $request->user()
            ->projects()
            ->withCount(['photos as photo_count' => fn($q) => $q->where('active', true)])
            ->withCount('selections as selected_count')
            ->orderByDesc('created_at')
            ->get();

        $projects->each(function ($project) {
            $project->append('preview_thumbnails');
        });

        return response()->json(['data' => $projects]);
    }

    /**
     * Create a new project.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'client_name'      => ['required', 'string', 'max:255'],
            'drive_folder_url' => ['required', 'url'],
            'whatsapp_number'  => ['nullable', 'string', 'max:20'],
            'max_photos'       => ['required', 'integer', 'min:1', 'max:1000'],
            'protect'          => ['boolean'],
            'password'         => ['nullable', 'string', 'min:6'],
        ]);

        $driveFolderId = $this->extractDriveFolderId($data['drive_folder_url']);
        if (! $driveFolderId) {
            return response()->json(['message' => 'Invalid Google Drive folder URL.'], 422);
        }

        $passwordHash = null;
        if (! empty($data['protect']) && ! empty($data['password'])) {
            $passwordHash = bcrypt($data['password']);
        }

        $project = $request->user()->projects()->create([
            'name'                 => $data['name'],
            'client_name'          => $data['client_name'],
            'drive_folder_url'     => $data['drive_folder_url'],
            'drive_folder_id'      => $driveFolderId,
            'whatsapp_number'      => $data['whatsapp_number'] ?? null,
            'max_photos'           => $data['max_photos'],
            'client_token'         => Str::random(22),
            'gallery_password_hash'=> $passwordHash,
            'status'               => 'draft',
        ]);

        return response()->json(['data' => $project, 'message' => 'Project created.'], 201);
    }

    /**
     * Get a single project.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $project = $request->user()->projects()
            ->withCount(['photos as photo_count' => fn($q) => $q->where('active', true)])
            ->withCount('selections as selected_count')
            ->findOrFail($id);

        $project->append('preview_thumbnails');

        return response()->json(['data' => $project]);
    }

    /**
     * Update a project.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $project = $request->user()->projects()->findOrFail($id);

        $data = $request->validate([
            'name'             => ['sometimes', 'string', 'max:255'],
            'client_name'      => ['sometimes', 'string', 'max:255'],
            'drive_folder_url' => ['sometimes', 'url'],
            'whatsapp_number'  => ['nullable', 'string', 'max:20'],
            'max_photos'       => ['sometimes', 'integer', 'min:1'],
            'protect'          => ['boolean'],
            'password'         => ['nullable', 'string', 'min:6'],
        ]);

        $updateData = [];
        if (isset($data['name']))             $updateData['name']             = $data['name'];
        if (isset($data['client_name']))      $updateData['client_name']      = $data['client_name'];
        if (isset($data['whatsapp_number']))  $updateData['whatsapp_number']  = $data['whatsapp_number'];
        if (isset($data['max_photos']))       $updateData['max_photos']       = $data['max_photos'];

        if (isset($data['drive_folder_url'])) {
            $folderId = $this->extractDriveFolderId($data['drive_folder_url']);
            if ($folderId) {
                $updateData['drive_folder_url'] = $data['drive_folder_url'];
                $updateData['drive_folder_id']  = $folderId;
            }
        }

        if (isset($data['protect'])) {
            if ($data['protect'] && ! empty($data['password'])) {
                $updateData['gallery_password_hash'] = bcrypt($data['password']);
            } elseif (! $data['protect']) {
                $updateData['gallery_password_hash'] = null;
            }
        }

        $project->update($updateData);

        return response()->json(['data' => $project->fresh(), 'message' => 'Project updated.']);
    }

    /**
     * Delete a project.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $project = $request->user()->projects()->findOrFail($id);
        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    /**
     * Lock or unlock a project's selection.
     */
    public function lock(Request $request, int $id): JsonResponse
    {
        $project = $request->user()->projects()->findOrFail($id);

        $data = $request->validate(['locked' => ['required', 'boolean']]);

        $project->update([
            'selection_locked' => $data['locked'],
            'status'           => $data['locked'] ? 'locked' : 'active',
        ]);

        return response()->json(['message' => 'Project lock updated.']);
    }

    /**
     * Get photos for a project (dashboard view).
     */
    public function photos(Request $request, int $id): JsonResponse
    {
        $project = $request->user()->projects()
            ->withCount(['photos as photo_count' => fn($q) => $q->where('active', true)])
            ->withCount('selections as selected_count')
            ->findOrFail($id);

        $photos = $project->photos()
            ->where('active', true)
            ->orderBy('sort_order')
            ->get();

        $selectedIds = $project->selections()->pluck('photo_id')->all();

        $mapped = $photos->map(function ($photo) use ($selectedIds) {
            $isSelected = in_array($photo->id, $selectedIds, true);

            return [
                'id'          => $photo->id,
                'file_name'   => $photo->file_name,
                'fileName'    => $photo->file_name,
                'photo_code'  => $photo->photo_code,
                'photoCode'   => $photo->photo_code,
                'preview_url' => $photo->drive_thumbnail_url,
                'previewUrl'  => $photo->drive_thumbnail_url,
                'sort_order'  => $photo->sort_order,
                'sortOrder'   => $photo->sort_order,
                'is_selected' => $isSelected,
                'isSelected'  => $isSelected,
            ];
        });

        return response()->json([
            'project'       => $project,
            'photos'        => $mapped,
            'totalCount'    => $mapped->count(),
            'selectedCount' => $project->selected_count,
        ]);
    }

    /**
     * Sync photos from Google Drive.
     */
    public function sync(Request $request, int $id): JsonResponse
    {
        $project = $request->user()->projects()->findOrFail($id);

        try {
            if (! $project->drive_folder_id) {
                return response()->json([
                    'error'   => 'Project tidak memiliki folder Google Drive yang valid.',
                    'message' => 'Project tidak memiliki folder Google Drive yang valid.',
                ], 422);
            }

            $driveService = new GoogleDriveService();

            if (! $driveService->hasCredentials()) {
                return response()->json([
                    'error'   => 'Kredensial Google Drive belum dikonfigurasi di backend/.env (GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY).',
                    'message' => 'Kredensial Google Drive belum dikonfigurasi di backend/.env (GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY).',
                ], 422);
            }

            $drivePhotos = $driveService->listPhotos($project->drive_folder_id);

            if (empty($drivePhotos)) {
                $access = $driveService->checkFolderAccess($project->drive_folder_id);
                $hint = $access['accessible']
                    ? 'Folder bisa diakses, tetapi tidak ada file gambar di dalamnya (bukan di subfolder).'
                    : ($access['error'] ?? 'Folder tidak bisa diakses.');

                return response()->json([
                    'error'   => $hint,
                    'message' => $hint,
                ], 422);
            }

            $driveFileIds = collect($drivePhotos)->pluck('id')->toArray();

            // Deactivate photos removed from Drive
            $deactivated = $project->photos()
                ->whereNotIn('drive_file_id', $driveFileIds)
                ->update(['active' => false]);

            $synced = 0;
            foreach ($drivePhotos as $i => $drivePhoto) {
                $photoCode = $this->derivePhotoCode($drivePhoto['name']);

                Photo::updateOrCreate(
                    [
                        'project_id'    => $project->id,
                        'drive_file_id' => $drivePhoto['id'],
                    ],
                    [
                        'file_name'           => $drivePhoto['name'],
                        'photo_code'          => $photoCode,
                        'mime_type'           => $drivePhoto['mimeType'] ?? null,
                        'drive_thumbnail_url' => $drivePhoto['thumbnailLink'] ?? null,
                        'drive_modified_time' => $drivePhoto['modifiedTime'] ?? null,
                        'width'               => $drivePhoto['width'] ?? null,
                        'height'              => $drivePhoto['height'] ?? null,
                        'sort_order'          => $i,
                        'active'              => true,
                    ]
                );
                $synced++;
            }

            $newStatus = $project->status === 'draft' ? 'active' : $project->status;
            $project->update([
                'last_synced_at' => now(),
                'status'         => $newStatus,
            ]);

            return response()->json([
                'success'     => true,
                'synced'      => $synced,
                'deactivated' => $deactivated,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => $e->getMessage(),
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private function extractDriveFolderId(string $url): ?string
    {
        $trimmed = trim($url);

        if (preg_match('/\/folders\/([a-zA-Z0-9_-]+)/', $trimmed, $m)) {
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

    private function derivePhotoCode(string $filename): string
    {
        $name = pathinfo($filename, PATHINFO_FILENAME);
        if (preg_match('/([A-Za-z]+[_-]?\d+)/', $name, $m)) {
            return strtoupper($m[1]);
        }
        return strtoupper(Str::limit($name, 20, ''));
    }

    public function previewPhoto(Request $request, string $id, GoogleDriveService $driveService)
    {
        $type = $request->query('type');
        $photo = null;

        if ($type === 'edited') {
            $photo = \App\Models\EditedPhoto::find($id);
        } else {
            $photo = Photo::find($id) ?? \App\Models\EditedPhoto::find($id);
        }

        if (! $photo) {
            return response('Photo not found', 404);
        }

        if (! empty($photo->drive_file_id)) {
            $cacheKey = "photo_preview_{$photo->drive_file_id}";
            $cached = Cache::remember($cacheKey, now()->addHours(24), function () use ($driveService, $photo) {
                return $driveService->streamPhoto($photo->drive_file_id);
            });

            if ($cached && ! empty($cached['content'])) {
                return response($cached['content'], 200, [
                    'Content-Type'                => $cached['mime'] ?? 'image/jpeg',
                    'Cache-Control'               => 'public, max-age=86400, immutable',
                    'Access-Control-Allow-Origin' => '*',
                ]);
            }
        }

        if ($photo->drive_thumbnail_url) {
            try {
                $response = Http::withoutVerifying()->timeout(5)->get($photo->drive_thumbnail_url);
                if ($response->successful() && strlen($response->body()) > 0) {
                    return response($response->body(), 200, [
                        'Content-Type'  => $response->header('Content-Type') ?? 'image/jpeg',
                        'Cache-Control' => 'public, max-age=86400',
                    ]);
                }
            } catch (\Throwable $e) {
                // Ignore and fall back to redirect
            }

            return redirect($photo->drive_thumbnail_url);
        }

        return response('Preview not available', 404);
    }
}
