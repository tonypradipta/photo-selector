<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SelectedPhotoController extends Controller
{
    /**
     * List all projects that have selections or are in selected/editing/delivered/completed stages.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = $request->query('search');

        $query = $request->user()
            ->projects()
            ->has('selections')
            ->withCount(['photos as photo_count' => fn($q) => $q->where('active', true)])
            ->withCount('selections as selected_count')
            ->withCount(['editedPhotos as edited_count'])
            ->withCount(['editedPhotos as matched_count' => fn($q) => $q->where('match_status', 'matched')])
            ->orderByDesc('completed_at')
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
            $project->append('preview_thumbnails');
            // If project has selections and is not completed, display status as editing
            if ($project->status !== Project::STATUS_COMPLETED && $project->selected_count > 0) {
                $project->status = Project::STATUS_EDITING;
            }
        });

        // Summary stats for tabs/badges: all, editing, completed
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
     * Get selected photos and details for a specific project.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $project = $request->user()
            ->projects()
            ->withCount(['photos as photo_count' => fn($q) => $q->where('active', true)])
            ->withCount('selections as selected_count')
            ->withCount(['editedPhotos as edited_count'])
            ->withCount(['editedPhotos as matched_count' => fn($q) => $q->where('match_status', 'matched')])
            ->findOrFail($id);

        $selections = $project->selections()
            ->with(['photo', 'editedPhoto'])
            ->orderBy('created_at')
            ->get()
            ->map(function ($selection) {
                return [
                    'id' => $selection->id,
                    'photo_id' => $selection->photo_id,
                    'client_note' => $selection->client_note,
                    'edit_status' => $selection->edit_status,
                    'created_at' => $selection->created_at->toIso8601String(),
                    'photo' => $selection->photo ? [
                        'id' => $selection->photo->id,
                        'file_name' => $selection->photo->file_name,
                        'photo_code' => $selection->photo->photo_code,
                        'drive_thumbnail_url' => $selection->photo->drive_thumbnail_url,
                        'drive_file_id' => $selection->photo->drive_file_id,
                    ] : null,
                    'edited_photo' => $selection->editedPhoto ? [
                        'id' => $selection->editedPhoto->id,
                        'file_name' => $selection->editedPhoto->file_name,
                        'drive_thumbnail_url' => $selection->editedPhoto->drive_thumbnail_url,
                        'drive_file_id' => $selection->editedPhoto->drive_file_id,
                    ] : null,
                ];
            });

        return response()->json([
            'project' => $project,
            'selections' => $selections,
            'total_selected' => $selections->count(),
            'total_with_notes' => $selections->filter(fn($s) => !empty($s['client_note']))->count(),
        ]);
    }

    /**
     * Transition project to 'editing' status.
     */
    public function startEditing(Request $request, int $id): JsonResponse
    {
        $project = $request->user()->projects()->findOrFail($id);

        $project->update([
            'status' => Project::STATUS_EDITING,
            'editing_started_at' => $project->editing_started_at ?? now(),
        ]);

        $project->selections()
            ->where('edit_status', 'pending')
            ->update(['edit_status' => 'editing']);

        return response()->json([
            'message' => 'Status project berhasil diubah ke tahap Editing.',
            'project' => $project,
        ]);
    }

    /**
     * Export selected filenames to TXT (for Lightroom / Bridge / Finder) or CSV.
     */
    public function export(Request $request, int $id)
    {
        $project = $request->user()->projects()->findOrFail($id);
        $format = $request->query('format', 'txt'); // 'txt' | 'csv' | 'json'
        $delimiter = $request->query('delimiter', 'comma'); // 'comma' | 'space' | 'newline'

        $selections = $project->selections()->with('photo')->get();

        if ($format === 'csv') {
            $csvLines = [];
            // UTF-8 BOM for Excel
            $csvLines[] = "\xEF\xBB\xBFFile Name,Photo Code,Client Note,Edit Status,Selected At";

            foreach ($selections as $sel) {
                $rawFileName = str_replace('"', '""', $sel->photo?->file_name ?? '');
                $photoCode = str_replace('"', '""', $sel->photo?->photo_code ?? '');
                $clientNote = str_replace('"', '""', $sel->client_note ?? '');
                $editStatus = str_replace('"', '""', $sel->edit_status ?? 'pending');
                $selectedAt = $sel->created_at->format('Y-m-d H:i:s');

                $csvLines[] = "\"{$rawFileName}\",\"{$photoCode}\",\"{$clientNote}\",\"{$editStatus}\",\"{$selectedAt}\"";
            }

            $content = implode("\r\n", $csvLines);

            return response($content, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"selected_photos_{$project->client_token}.csv\"",
            ]);
        }

        if ($format === 'json') {
            return response()->json([
                'project' => $project->name,
                'client' => $project->client_name,
                'total' => $selections->count(),
                'files' => $selections->map(fn($s) => [
                    'file_name' => $s->photo?->file_name,
                    'photo_code' => $s->photo?->photo_code,
                    'client_note' => $s->client_note,
                ]),
            ]);
        }

        // Default TXT export (Lightroom search string)
        $fileNames = $selections->map(fn($s) => $s->photo?->file_name)->filter()->values()->toArray();

        $separator = match ($delimiter) {
            'space' => ' ',
            'newline' => "\n",
            default => ', ',
        };

        $content = implode($separator, $fileNames);

        $headers = [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"selected_photos_{$project->client_token}.txt\"",
        ];

        return response($content, 200, $headers);
    }
}
