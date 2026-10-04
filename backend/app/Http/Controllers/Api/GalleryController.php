<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Selection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;

class GalleryController extends Controller
{
    /**
     * Get gallery data by client token.
     */
    public function show(Request $request, string $token): JsonResponse
    {
        $project = Project::where('client_token', $token)->firstOrFail();

        // If password protected, verify cookie access
        if ($project->gallery_password_hash) {
            $accessCookie = $request->cookie('gallery_access_' . $token);
            if (! $accessCookie || $accessCookie !== hash('sha256', $token . config('app.key'))) {
                return response()->json([
                    'project' => [
                        'id'                    => $project->id,
                        'name'                  => $project->name,
                        'client_name'           => $project->client_name,
                        'is_password_protected' => true,
                        'status'                => $project->status,
                        'selection_locked'      => $project->selection_locked,
                        'max_photos'            => $project->max_photos,
                        'whatsapp_number'       => $project->whatsapp_number ?: ($project->user?->profile?->whatsapp ?: null),
                        'studio_name'           => $project->user?->profile?->studio_name ?: ($project->user?->name ?: null),
                    ],
                    'locked' => true,
                ], 403);
            }
        }

        $selectedIds = $project->selections()->pluck('photo_id')->toArray();

        $photos = $project->photos()
            ->where('active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn($photo) => [
                'id'          => $photo->id,
                'file_name'   => $photo->file_name,
                'photo_code'  => $photo->photo_code,
                'preview_url' => $photo->drive_thumbnail_url,
                'sort_order'  => $photo->sort_order,
                'is_selected' => in_array($photo->id, $selectedIds),
            ]);

        $whatsappNumber = $project->whatsapp_number ?: ($project->user?->profile?->whatsapp ?: null);
        $studioName = $project->user?->profile?->studio_name ?: ($project->user?->name ?: null);

        return response()->json([
            'project' => [
                'id'                    => $project->id,
                'name'                  => $project->name,
                'client_name'           => $project->client_name,
                'max_photos'            => $project->max_photos,
                'status'                => $project->status,
                'selection_locked'      => $project->selection_locked,
                'is_password_protected' => (bool) $project->gallery_password_hash,
                'whatsapp_number'       => $whatsappNumber,
                'studio_name'           => $studioName,
            ],
            'photos'        => $photos,
            'totalCount'    => $photos->count(),
            'selectedCount' => count($selectedIds),
        ]);
    }

    /**
     * Unlock a password-protected gallery.
     */
    public function unlock(Request $request, string $token): JsonResponse
    {
        $request->validate(['password' => ['required', 'string']]);

        $project = Project::where('client_token', $token)->firstOrFail();

        if (! $project->gallery_password_hash) {
            return response()->json(['message' => 'Gallery is not password protected.'], 400);
        }

        if (! Hash::check($request->password, $project->gallery_password_hash)) {
            return response()->json(['message' => 'Password salah.'], 401);
        }

        $cookieValue = hash('sha256', $token . config('app.key'));
        $cookie = Cookie::make(
            'gallery_access_' . $token,
            $cookieValue,
            60 * 24 * 7, // 7 days
            '/',
            null,
            false, // secure - set true in production
            true,  // httpOnly
            false,
            'Lax'
        );

        return response()->json(['message' => 'Access granted.'])->withCookie($cookie);
    }

    /**
     * Toggle photo selection (select or deselect).
     */
    public function toggleSelection(Request $request, string $token): JsonResponse
    {
        $request->validate([
            'photo_id' => ['required', 'integer'],
            'selected' => ['required', 'boolean'],
        ]);

        $project = Project::where('client_token', $token)->firstOrFail();

        // Check locked
        if ($project->selection_locked || in_array($project->status, ['completed', 'locked'])) {
            return response()->json(['error' => 'Pilihan foto sudah dikunci dan tidak dapat diubah.'], 423);
        }

        // Verify password access if protected
        if ($project->gallery_password_hash) {
            $accessCookie = $request->cookie('gallery_access_' . $token);
            if (! $accessCookie || $accessCookie !== hash('sha256', $token . config('app.key'))) {
                return response()->json(['error' => 'Gallery is password protected.'], 403);
            }
        }

        // Verify photo belongs to project
        $photo = $project->photos()->where('id', $request->photo_id)->where('active', true)->first();
        if (! $photo) {
            return response()->json(['error' => 'Foto tidak ditemukan atau tidak aktif.'], 404);
        }

        if ($request->selected) {
            $currentCount = $project->selections()->count();
            if ($currentCount >= $project->max_photos) {
                return response()->json([
                    'error' => "Anda sudah mencapai batas maksimal {$project->max_photos} foto.",
                ], 422);
            }

            Selection::firstOrCreate([
                'project_id' => $project->id,
                'photo_id'   => $photo->id,
            ]);
        } else {
            $project->selections()->where('photo_id', $photo->id)->delete();
        }

        $newCount = $project->selections()->count();

        return response()->json(['success' => true, 'selectionCount' => $newCount]);
    }

    /**
     * Submit final photo selection.
     */
    public function submit(Request $request, string $token): JsonResponse
    {
        $request->validate([
            'selected_photo_ids'   => ['nullable', 'array'],
            'selected_photo_ids.*' => ['integer'],
            'client_note'          => ['nullable', 'string', 'max:1000'],
        ]);

        $project = Project::where('client_token', $token)->firstOrFail();

        if ($project->selection_locked || in_array($project->status, ['completed', 'locked'])) {
            return response()->json(['error' => 'Pilihan sudah dikunci.'], 423);
        }

        $photoIds = $request->input('selected_photo_ids');
        if (empty($photoIds)) {
            $photoIds = $project->selections()->pluck('photo_id')->toArray();
        }

        if (empty($photoIds)) {
            return response()->json(['error' => 'Pilih setidaknya 1 foto sebelum mengonfirmasi.'], 422);
        }

        if (count($photoIds) > $project->max_photos) {
            return response()->json([
                'error' => "Maksimal {$project->max_photos} foto yang dapat dipilih.",
            ], 422);
        }

        // Update selections
        $project->selections()->delete();
        foreach ($photoIds as $photoId) {
            Selection::create([
                'project_id'  => $project->id,
                'photo_id'    => $photoId,
                'client_note' => $request->client_note ?? null,
            ]);
        }

        $project->update([
            'status'             => 'editing',
            'selection_locked'   => true,
            'editing_started_at' => now(),
        ]);

        return response()->json(['message' => 'Pilihan foto berhasil dikirim! Status project masuk ke tahap Sedang Diedit.']);
    }
}
