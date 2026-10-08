<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SYNCING = 'syncing';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SELECTED = 'selected';
    public const STATUS_EDITING = 'editing';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'user_id', 'name', 'client_name', 'status', 'client_token',
        'drive_folder_url', 'drive_folder_id', 'edited_folder_id', 'edited_folder_url',
        'whatsapp_number', 'max_photos', 'selection_locked', 'gallery_password_hash',
        'last_synced_at', 'completed_at', 'editing_started_at', 'delivered_at',
    ];

    protected $casts = [
        'selection_locked' => 'boolean',
        'max_photos' => 'integer',
        'last_synced_at' => 'datetime',
        'completed_at' => 'datetime',
        'editing_started_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    protected $hidden = ['gallery_password_hash'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function photos()
    {
        return $this->hasMany(Photo::class);
    }

    public function selections()
    {
        return $this->hasMany(Selection::class);
    }

    public function editedPhotos()
    {
        return $this->hasMany(EditedPhoto::class);
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }

    public function latestDelivery()
    {
        return $this->hasOne(Delivery::class)->latestOfMany();
    }

    public function getPhotoCountAttribute(): int
    {
        return $this->photos()->where('active', true)->count();
    }

    public function getSelectedCountAttribute(): int
    {
        return $this->selections()->count();
    }

    public function getEditedCountAttribute(): int
    {
        return $this->editedPhotos()->count();
    }

    public function getMatchedEditedCountAttribute(): int
    {
        return $this->editedPhotos()->where('match_status', 'matched')->count();
    }

    public function getEditedPreviewThumbnailsAttribute(): array
    {
        $edited = $this->editedPhotos()
            ->limit(4)
            ->get();

        $urls = [];
        foreach ($edited as $ep) {
            $urls[] = url("/api/photos/{$ep->id}/preview?type=edited");
        }

        return array_slice($urls, 0, 4);
    }

    public function getPreviewThumbnailsAttribute(): array
    {
        // 1. Check edited photos first
        $edited = $this->editedPhotos()
            ->limit(4)
            ->get();

        $urls = [];
        if ($edited->isNotEmpty()) {
            foreach ($edited as $ep) {
                $urls[] = url("/api/photos/{$ep->id}/preview?type=edited");
            }
            return array_slice($urls, 0, 4);
        }

        // 2. Check selections next
        $selections = $this->selections()
            ->with('photo')
            ->limit(4)
            ->get();

        foreach ($selections as $sel) {
            if ($sel->photo) {
                $urls[] = url("/api/photos/{$sel->photo->id}/preview");
            }
        }

        if (count($urls) > 0) {
            return array_slice($urls, 0, 4);
        }

        // 3. Fall back to all project photos
        $photos = $this->photos()
            ->where('active', true)
            ->orderBy('sort_order')
            ->limit(4)
            ->get();

        foreach ($photos as $photo) {
            $urls[] = url("/api/photos/{$photo->id}/preview");
        }

        return array_slice($urls, 0, 4);
    }

    public function canStartEditing(): bool
    {
        return in_array($this->status, [self::STATUS_SELECTED, self::STATUS_EDITING, self::STATUS_COMPLETED]);
    }

    public function canDeliver(): bool
    {
        return in_array($this->status, [self::STATUS_EDITING, self::STATUS_DELIVERED, self::STATUS_COMPLETED]);
    }
}
