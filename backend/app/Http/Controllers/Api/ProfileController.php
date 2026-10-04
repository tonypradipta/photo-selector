<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Get authenticated user's profile.
     */
    public function show(Request $request): JsonResponse
    {
        $user    = $request->user();
        $profile = $user->profile;

        return response()->json([
            'data' => [
                'email'          => $user->email,
                'studio_name'    => $profile?->studio_name ?? '',
                'full_name'      => $profile?->full_name ?? '',
                'location'       => $profile?->location ?? '',
                'bio'            => $profile?->bio ?? '',
                'whatsapp'       => $profile?->whatsapp ?? '',
                'website'        => $profile?->website ?? '',
                'show_branding'  => $profile?->show_branding ?? true,
                'allow_notes'    => $profile?->allow_notes ?? true,
                'send_reminders' => $profile?->send_reminders ?? false,
            ],
        ]);
    }

    /**
     * Update authenticated user's profile.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'studio_name' => ['nullable', 'string', 'max:255'],
            'full_name'   => ['nullable', 'string', 'max:255'],
            'location'    => ['nullable', 'string', 'max:255'],
            'bio'         => ['nullable', 'string', 'max:500'],
            'whatsapp'    => ['nullable', 'string', 'max:20'],
            'website'     => ['nullable', 'url', 'max:255'],
        ]);

        $user = $request->user();

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $data
        );

        return response()->json([
            'data'    => $user->fresh()->profile,
            'message' => 'Profile updated successfully.',
        ]);
    }

    /**
     * Update app settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'show_branding'  => ['boolean'],
            'allow_notes'    => ['boolean'],
            'send_reminders' => ['boolean'],
        ]);

        $user = $request->user();

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $data
        );

        return response()->json(['message' => 'Settings updated.']);
    }
}
