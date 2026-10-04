<?php

namespace App\Services;

use App\Models\EditedPhoto;
use App\Models\Project;
use App\Models\Selection;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class EditedFolderSyncService
{
    public function __construct(
        private GoogleDriveService $driveService,
        private FileNameMatcherService $matcherService
    ) {}

    /**
     * Sync edited folder photos and match them against project selections.
     */
    public function sync(Project $project): array
    {
        if (empty($project->edited_folder_id)) {
            throw new Exception('Folder hasil edit Google Drive belum diatur untuk project ini.');
        }

        // 1. Fetch files from Google Drive
        $files = $this->driveService->listPhotos($project->edited_folder_id);

        // 2. Load selections with photos
        $selections = $project->selections()->with('photo')->get();

        // 3. Match
        $matchResult = $this->matcherService->match($selections, $files);

        // 4. Save to Database inside transaction
        DB::transaction(function () use ($project, $matchResult, $selections) {
            // Delete existing edited_photos for this project to ensure a clean sync state
            $project->editedPhotos()->delete();

            // Insert matched photos
            $matchedSelectionIds = [];
            foreach ($matchResult['matched'] as $m) {
                EditedPhoto::create([
                    'project_id' => $project->id,
                    'selection_id' => $m['selection_id'],
                    'drive_file_id' => $m['drive_file_id'],
                    'file_name' => $m['edited_name'],
                    'normalized_name' => $m['normalized_name'],
                    'mime_type' => $m['mime_type'],
                    'size_bytes' => $m['size_bytes'],
                    'drive_thumbnail_url' => $m['thumbnail_url'],
                    'drive_modified_time' => $m['modified_time'],
                    'match_status' => 'matched',
                ]);
                $matchedSelectionIds[] = $m['selection_id'];
            }

            // Insert extra photos
            foreach ($matchResult['extra'] as $e) {
                EditedPhoto::create([
                    'project_id' => $project->id,
                    'selection_id' => null,
                    'drive_file_id' => $e['drive_file_id'],
                    'file_name' => $e['edited_name'],
                    'normalized_name' => $e['normalized_name'],
                    'mime_type' => $e['mime_type'],
                    'size_bytes' => $e['size_bytes'],
                    'drive_thumbnail_url' => $e['thumbnail_url'],
                    'drive_modified_time' => $e['modified_time'],
                    'match_status' => 'extra',
                ]);
            }

            // Update Selection edit_status
            if (!empty($matchedSelectionIds)) {
                $project->selections()
                    ->whereIn('id', $matchedSelectionIds)
                    ->update(['edit_status' => Selection::EDIT_STATUS_READY]);
            }

            $unmatchedSelectionIds = $selections->pluck('id')->diff($matchedSelectionIds)->toArray();
            if (!empty($unmatchedSelectionIds)) {
                $project->selections()
                    ->whereIn('id', $unmatchedSelectionIds)
                    ->update(['edit_status' => Selection::EDIT_STATUS_EDITING]);
            }

            // Update project status if currently selected or draft
            if ($project->status === Project::STATUS_SELECTED && count($matchResult['matched']) > 0) {
                $project->update([
                    'status' => Project::STATUS_EDITING,
                    'editing_started_at' => $project->editing_started_at ?? now(),
                ]);
            }
        });

        // Cache summary for quick queries
        $summary = [
            'project_id' => $project->id,
            'synced_at' => now()->toIso8601String(),
            'total_selected' => $matchResult['total_selected'],
            'total_edited' => $matchResult['total_edited'],
            'matched_count' => count($matchResult['matched']),
            'missing_count' => count($matchResult['missing']),
            'extra_count' => count($matchResult['extra']),
            'match_rate' => $matchResult['match_rate'],
            'matched' => $matchResult['matched'],
            'missing' => $matchResult['missing'],
            'extra' => $matchResult['extra'],
        ];

        Cache::put("project_edited_sync_{$project->id}", $summary, now()->addDays(7));

        return $summary;
    }

    /**
     * Get cached sync summary or compute from database.
     */
    public function getSyncStatus(Project $project): array
    {
        $cached = Cache::get("project_edited_sync_{$project->id}");
        if ($cached) {
            return $cached;
        }

        $selections = $project->selections()->with('photo')->get();
        $editedPhotos = $project->editedPhotos()->get();

        $matched = [];
        $extra = [];
        $matchedSelectionIds = [];

        foreach ($editedPhotos as $ep) {
            if ($ep->match_status === 'matched' && $ep->selection_id) {
                $sel = $selections->firstWhere('id', $ep->selection_id);
                $matched[] = [
                    'selection_id' => $ep->selection_id,
                    'photo_id' => $sel?->photo_id,
                    'raw_name' => $sel?->photo?->file_name ?? '',
                    'edited_name' => $ep->file_name,
                    'normalized_name' => $ep->normalized_name,
                    'drive_file_id' => $ep->drive_file_id,
                    'mime_type' => $ep->mime_type,
                    'thumbnail_url' => $ep->drive_thumbnail_url,
                    'modified_time' => $ep->drive_modified_time,
                    'size_bytes' => $ep->size_bytes,
                    'client_note' => $sel?->client_note,
                ];
                $matchedSelectionIds[] = $ep->selection_id;
            } else {
                $extra[] = [
                    'drive_file_id' => $ep->drive_file_id,
                    'edited_name' => $ep->file_name,
                    'normalized_name' => $ep->normalized_name,
                    'mime_type' => $ep->mime_type,
                    'thumbnail_url' => $ep->drive_thumbnail_url,
                    'modified_time' => $ep->drive_modified_time,
                    'size_bytes' => $ep->size_bytes,
                ];
            }
        }

        $missing = [];
        foreach ($selections as $sel) {
            if (!in_array($sel->id, $matchedSelectionIds)) {
                $missing[] = [
                    'selection_id' => $sel->id,
                    'photo_id' => $sel->photo_id,
                    'raw_name' => $sel->photo?->file_name ?? '',
                    'normalized_name' => $sel->photo ? $this->matcherService->normalize($sel->photo->file_name) : '',
                    'thumbnail_url' => $sel->photo?->drive_thumbnail_url,
                    'client_note' => $sel->client_note,
                ];
            }
        }

        $totalSelected = $selections->count();
        $matchRate = $totalSelected > 0 ? round((count($matched) / $totalSelected) * 100, 1) : 0;

        return [
            'project_id' => $project->id,
            'synced_at' => $editedPhotos->max('updated_at')?->toIso8601String(),
            'total_selected' => $totalSelected,
            'total_edited' => $editedPhotos->count(),
            'matched_count' => count($matched),
            'missing_count' => count($missing),
            'extra_count' => count($extra),
            'match_rate' => $matchRate,
            'matched' => $matched,
            'missing' => $missing,
            'extra' => $extra,
        ];
    }
}
