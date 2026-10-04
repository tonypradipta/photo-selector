<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\EditedPhoto;
use App\Services\DeliveryService;
use App\Services\GoogleDriveService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class PublicDeliveryController extends Controller
{
    /**
     * Get public delivery details for client portal.
     */
    public function show(Request $request, string $token): JsonResponse
    {
        $delivery = Delivery::where('delivery_token', $token)->first();

        if (!$delivery) {
            return response()->json(['message' => 'Link delivery tidak ditemukan.'], 404);
        }

        if ($delivery->status === 'revoked') {
            return response()->json(['message' => 'Link delivery ini telah dinonaktifkan oleh fotografer.'], 410);
        }

        if ($delivery->isExpired()) {
            return response()->json([
                'message' => 'Link delivery ini telah kedaluwarsa.',
                'expired_at' => $delivery->expires_at?->toIso8601String(),
            ], 410);
        }

        $project = $delivery->project;
        $whatsappNumber = $project->whatsapp_number ?: ($project->user?->profile?->whatsapp ?: null);
        $studioName = $project->user?->profile?->studio_name ?: ($project->user?->name ?: 'Studio Foto');

        // Check PIN protection
        if (!empty($delivery->pin_hash)) {
            $isUnlocked = $this->isPinUnlocked($request, $delivery);
            if (!$isUnlocked) {
                return response()->json([
                    'delivery' => [
                        'token' => $delivery->delivery_token,
                        'is_pin_protected' => true,
                        'unlocked' => false,
                        'expires_at' => $delivery->expires_at?->toIso8601String(),
                        'notes' => $delivery->notes,
                    ],
                    'project' => [
                        'name' => $project->name,
                        'client_name' => $project->client_name,
                        'studio_name' => $studioName,
                        'whatsapp_number' => $whatsappNumber,
                    ],
                ], 200, ['X-Robots-Tag' => 'noindex, nofollow']);
            }
        }

        $photos = $delivery->editedPhotos()
            ->get()
            ->map(function (EditedPhoto $photo) use ($delivery) {
                return [
                    'id' => $photo->id,
                    'file_name' => $photo->file_name,
                    'thumbnail_url' => $photo->drive_thumbnail_url,
                    'mime_type' => $photo->mime_type,
                    'size_bytes' => $photo->size_bytes,
                    'download_url' => url("/api/delivery/{$delivery->delivery_token}/photos/{$photo->id}/download"),
                ];
            });

        return response()->json([
            'delivery' => [
                'token' => $delivery->delivery_token,
                'is_pin_protected' => !empty($delivery->pin_hash),
                'unlocked' => true,
                'download_count' => $delivery->download_count,
                'last_downloaded_at' => $delivery->last_downloaded_at?->toIso8601String(),
                'expires_at' => $delivery->expires_at?->toIso8601String(),
                'notes' => $delivery->notes,
                'zip_download_url' => url("/api/delivery/{$delivery->delivery_token}/zip"),
            ],
            'project' => [
                'name' => $project->name,
                'client_name' => $project->client_name,
                'studio_name' => $studioName,
                'whatsapp_number' => $whatsappNumber,
            ],
            'photos' => $photos,
            'total_photos' => $photos->count(),
        ], 200, ['X-Robots-Tag' => 'noindex, nofollow']);
    }

    /**
     * Unlock a PIN-protected delivery.
     */
    public function verifyPin(Request $request, string $token): JsonResponse
    {
        $request->validate([
            'pin' => ['required', 'string'],
        ]);

        $delivery = Delivery::where('delivery_token', $token)->first();
        if (!$delivery || !$delivery->isAccessible()) {
            return response()->json(['message' => 'Delivery tidak valid atau sudah kedaluwarsa.'], 404);
        }

        if (empty($delivery->pin_hash)) {
            return response()->json(['message' => 'Delivery ini tidak memerlukan PIN.']);
        }

        if (!Hash::check($request->input('pin'), $delivery->pin_hash)) {
            return response()->json(['message' => 'PIN yang Anda masukkan salah.'], 401);
        }

        $cookieValue = hash('sha256', $token . config('app.key'));
        $cookie = Cookie::make(
            'delivery_pin_' . $token,
            $cookieValue,
            60 * 24 * 14, // 14 days
            '/',
            null,
            false,
            true, // HttpOnly
            false,
            'Lax'
        );

        return response()->json([
            'message' => 'PIN berhasil diverifikasi.',
            'unlocked' => true,
        ])->withCookie($cookie);
    }

    /**
     * Download a single photo.
     */
    public function downloadPhoto(Request $request, string $token, int $photoId, GoogleDriveService $driveService)
    {
        $delivery = Delivery::where('delivery_token', $token)->first();
        if (!$delivery || !$delivery->isAccessible()) {
            return response()->json(['message' => 'Delivery tidak valid atau sudah kedaluwarsa.'], 404);
        }

        if (!empty($delivery->pin_hash) && !$this->isPinUnlocked($request, $delivery)) {
            return response()->json(['message' => 'Akses ditolak. Masukkan PIN terlebih dahulu.'], 403);
        }

        $photo = $delivery->editedPhotos()->findOrFail($photoId);

        // Update statistics
        $delivery->increment('download_count');
        $delivery->update(['last_downloaded_at' => now()]);
        $delivery->editedPhotos()->updateExistingPivot($photoId, [
            'download_count' => ($photo->pivot->download_count ?? 0) + 1,
        ]);

        // Stream file directly from drive
        if ($driveService->hasServiceAccount()) {
            $stream = $driveService->streamPhoto($photo->drive_file_id);
            if ($stream && !empty($stream['content'])) {
                return response($stream['content'], 200, [
                    'Content-Type' => $photo->mime_type ?: ($stream['mime'] ?? 'image/jpeg'),
                    'Content-Disposition' => 'attachment; filename="' . addslashes($photo->file_name) . '"',
                    'X-Robots-Tag' => 'noindex, nofollow',
                ]);
            }
        }

        // Fallback to thumbnail URL redirect with download disposition if stream is unavailable
        if ($photo->drive_thumbnail_url) {
            $downloadUrl = preg_replace('/=s\d+.*$/', '=s0', $photo->drive_thumbnail_url);
            return redirect($downloadUrl);
        }

        return response()->json(['message' => 'Foto tidak dapat diunduh.'], 500);
    }

    /**
     * Download all delivery photos as a ZIP file.
     */
    public function downloadZip(Request $request, string $token, GoogleDriveService $driveService)
    {
        $delivery = Delivery::where('delivery_token', $token)->first();
        if (!$delivery || !$delivery->isAccessible()) {
            return response()->json(['message' => 'Delivery tidak valid atau sudah kedaluwarsa.'], 404);
        }

        if (!empty($delivery->pin_hash) && !$this->isPinUnlocked($request, $delivery)) {
            return response()->json(['message' => 'Akses ditolak. Masukkan PIN terlebih dahulu.'], 403);
        }

        $photos = $delivery->editedPhotos()->get();
        if ($photos->isEmpty()) {
            return response()->json(['message' => 'Tidak ada foto untuk diunduh.'], 404);
        }

        // Increment stats
        $delivery->increment('download_count');
        $delivery->update(['last_downloaded_at' => now()]);

        $project = $delivery->project;
        $safeProjectName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $project->name);
        $zipFileName = "{$safeProjectName}_edited_photos.zip";
        $tempZipPath = storage_path('app/temp_' . uniqid('zip_', true) . '.zip');

        // Create ZIP archive
        $zip = new ZipArchive();
        if ($zip->open($tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return response()->json(['message' => 'Gagal membuat file arsip ZIP.'], 500);
        }

        foreach ($photos as $photo) {
            $content = null;
            if ($driveService->hasServiceAccount()) {
                $stream = $driveService->streamPhoto($photo->drive_file_id);
                if ($stream && !empty($stream['content'])) {
                    $content = $stream['content'];
                }
            }

            // Fallback download if drive stream was not returned
            if (!$content && $photo->drive_thumbnail_url) {
                try {
                    $thumbUrl = preg_replace('/=s\d+.*$/', '=s0', $photo->drive_thumbnail_url);
                    $res = \Illuminate\Support\Facades\Http::timeout(30)->get($thumbUrl);
                    if ($res->successful()) {
                        $content = $res->body();
                    }
                } catch (Exception $e) {}
            }

            if ($content) {
                $zip->addFromString($photo->file_name, $content);
            }
        }

        $zip->close();

        if (!file_exists($tempZipPath) || filesize($tempZipPath) === 0) {
            if (file_exists($tempZipPath)) {
                @unlink($tempZipPath);
            }
            return response()->json(['message' => 'Gagal memproses file foto untuk ZIP.'], 500);
        }

        return response()->download($tempZipPath, $zipFileName, [
            'Content-Type' => 'application/zip',
            'X-Robots-Tag' => 'noindex, nofollow',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Check if client PIN is verified.
     */
    private function isPinUnlocked(Request $request, Delivery $delivery): bool
    {
        $expectedHash = hash('sha256', $delivery->delivery_token . config('app.key'));

        // 1. Check Cookie
        $cookie = $request->cookie('delivery_pin_' . $delivery->delivery_token);
        if ($cookie && hash_equals($expectedHash, $cookie)) {
            return true;
        }

        // 2. Check Header
        $headerPin = $request->header('X-Delivery-PIN');
        if ($headerPin && Hash::check($headerPin, $delivery->pin_hash)) {
            return true;
        }

        // 3. Check Query Param (for direct download links)
        $queryPin = $request->query('pin');
        if ($queryPin && Hash::check($queryPin, $delivery->pin_hash)) {
            return true;
        }

        return false;
    }
}
