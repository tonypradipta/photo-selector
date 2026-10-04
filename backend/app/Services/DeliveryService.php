<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Project;
use App\Models\Selection;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DeliveryService
{
    /**
     * Create or update a delivery for a project.
     *
     * @param Project $project
     * @param array{
     *     pin?: string|null,
     *     expires_in_days?: int|null,
     *     notes?: string|null,
     *     force?: bool
     * } $data
     * @return Delivery
     */
    public function createDelivery(Project $project, array $data = []): Delivery
    {
        $matchedEditedPhotos = $project->editedPhotos()->where('match_status', 'matched')->get();

        if ($matchedEditedPhotos->isEmpty()) {
            throw new Exception('Belum ada foto edit yang cocok (matched) untuk dikirimkan. Silakan sync folder Google Drive terlebih dahulu.');
        }

        $totalSelections = $project->selections()->count();
        $matchedCount = $matchedEditedPhotos->count();
        $isForce = !empty($data['force']);

        if ($matchedCount < $totalSelections && !$isForce) {
            $missingCount = $totalSelections - $matchedCount;
            throw new Exception("Masih ada {$missingCount} foto terpilih yang belum ditemukan di folder edit. Berikan konfirmasi pengiriman parsial jika ingin tetap mengirim.");
        }

        return DB::transaction(function () use ($project, $data, $matchedEditedPhotos) {
            $pin = !empty($data['pin']) ? trim($data['pin']) : null;
            $pinHash = $pin ? Hash::make($pin) : null;

            $expiresAt = null;
            $expiryDays = isset($data['expires_in_days']) ? (int) $data['expires_in_days'] : (int) config('photo_delivery.default_expiry_days', 30);
            if ($expiryDays > 0) {
                $expiresAt = now()->addDays($expiryDays);
            }

            // Find existing active delivery or generate new
            $delivery = Delivery::create([
                'project_id' => $project->id,
                'delivery_token' => Str::random(40),
                'pin_hash' => $pinHash,
                'status' => 'active',
                'expires_at' => $expiresAt,
                'notes' => $data['notes'] ?? null,
            ]);

            // Sync delivery photos
            $delivery->editedPhotos()->sync($matchedEditedPhotos->pluck('id'));

            // Update selections edit_status
            $project->selections()->update(['edit_status' => Selection::EDIT_STATUS_DELIVERED]);

            // Update project status to completed once sent via delivery
            $project->update([
                'status' => Project::STATUS_COMPLETED,
                'delivered_at' => now(),
                'completed_at' => $project->completed_at ?? now(),
            ]);

            return $delivery->load(['editedPhotos', 'project']);
        });
    }

    /**
     * Generate friendly WhatsApp message template for client.
     */
    public function generateWhatsAppMessage(Project $project, Delivery $delivery, ?string $rawPin = null): string
    {
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
        $deliveryUrl = "{$frontendUrl}/delivery/{$delivery->delivery_token}";

        $message = "Halo Kak *{$project->client_name}*! 👋\n\n";
        $message .= "Hasil foto edit untuk project *\"{$project->name}\"* sudah selesai dan siap didownload! 📸✨\n\n";
        $message .= "🔗 *Link Download:*\n{$deliveryUrl}\n";

        if (!empty($rawPin)) {
            $message .= "🔑 *PIN Akses:* `{$rawPin}`\n";
        }

        if ($delivery->expires_at) {
            $message .= "⏳ *Berlaku Hingga:* " . $delivery->expires_at->translatedFormat('d F Y') . "\n";
        }

        $message .= "\nSilakan klik link di atas untuk melihat & mendownload foto resolusi penuh (tersedia tombol Download Semua format ZIP atau download per foto).\n\n";
        $message .= "Terima kasih banyak atas kerjasamanya! 🙏✨";

        return $message;
    }

    /**
     * Verify PIN for a delivery.
     */
    public function verifyPin(Delivery $delivery, string $pin): bool
    {
        if (empty($delivery->pin_hash)) {
            return true;
        }

        return Hash::check($pin, $delivery->pin_hash);
    }
}
