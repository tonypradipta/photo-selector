<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\PublicDeliveryController;
use App\Http\Controllers\Api\SelectedPhotoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ──────────────────────────────────────────────
// PUBLIC: Auth routes (no authentication needed)
// ──────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register',        [AuthController::class, 'register']);
    Route::post('/login',           [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
});

// ──────────────────────────────────────────────
// PUBLIC: Gallery routes (client-facing, no auth required)
// ──────────────────────────────────────────────
Route::prefix('gallery/{token}')->group(function () {
    Route::get('/',           [GalleryController::class, 'show']);
    Route::post('/unlock',    [GalleryController::class, 'unlock']);
    Route::post('/selection', [GalleryController::class, 'toggleSelection']);
    Route::post('/submit',    [GalleryController::class, 'submit']);
});

// ──────────────────────────────────────────────
// PUBLIC: Delivery routes (client-facing download portal)
// ──────────────────────────────────────────────
Route::prefix('delivery/{token}')->group(function () {
    Route::get('/',                                  [PublicDeliveryController::class, 'show']);
    Route::post('/pin',                              [PublicDeliveryController::class, 'verifyPin']);
    Route::get('/photos/{photoId}/download',         [PublicDeliveryController::class, 'downloadPhoto']);
    Route::get('/zip',                               [PublicDeliveryController::class, 'downloadZip']);
});

// Photo preview streaming
Route::get('/photos/{id}/preview', [ProjectController::class, 'previewPhoto']);

// ──────────────────────────────────────────────
// PROTECTED: Requires authentication (Sanctum session)
// ──────────────────────────────────────────────
Route::middleware(['auth:sanctum'])->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout',          [AuthController::class, 'logout']);
        Route::get('/user',             [AuthController::class, 'user']);
        Route::put('/update-password',  [AuthController::class, 'updatePassword']);
    });

    // Profile
    Route::prefix('profile')->group(function () {
        Route::get('/',          [ProfileController::class, 'show']);
        Route::put('/',          [ProfileController::class, 'update']);
        Route::put('/settings',  [ProfileController::class, 'updateSettings']);
    });

    // Projects
    Route::prefix('projects')->group(function () {
        Route::get('/',           [ProjectController::class, 'index']);
        Route::post('/',          [ProjectController::class, 'store']);
        Route::get('/{id}',       [ProjectController::class, 'show']);
        Route::put('/{id}',       [ProjectController::class, 'update']);
        Route::delete('/{id}',    [ProjectController::class, 'destroy']);
        Route::post('/{id}/lock', [ProjectController::class, 'lock']);
        Route::post('/{id}/sync', [ProjectController::class, 'sync']);
        Route::get('/{id}/photos',[ProjectController::class, 'photos']);
    });

    // Selected Photos Workflow
    Route::prefix('selected-photos')->group(function () {
        Route::get('/',                   [SelectedPhotoController::class, 'index']);
        Route::get('/{id}',               [SelectedPhotoController::class, 'show']);
        Route::post('/{id}/start-editing', [SelectedPhotoController::class, 'startEditing']);
        Route::get('/{id}/export',        [SelectedPhotoController::class, 'export']);
    });

    // Delivery Workflow
    Route::prefix('deliveries')->group(function () {
        Route::get('/',                    [DeliveryController::class, 'index']);
        Route::get('/{id}',                [DeliveryController::class, 'show']);
        Route::put('/{id}/folder',         [DeliveryController::class, 'updateFolder']);
        Route::post('/{id}/sync',          [DeliveryController::class, 'sync']);
        Route::get('/{id}/sync-status',    [DeliveryController::class, 'getSyncStatus']);
        Route::post('/{id}/send',          [DeliveryController::class, 'send']);
        Route::post('/{id}/revoke/{deliveryId}', [DeliveryController::class, 'revoke']);
        Route::post('/{id}/complete',      [DeliveryController::class, 'complete']);
    });
});
