<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'delivery_token',
        'pin_hash',
        'status',
        'download_count',
        'last_downloaded_at',
        'expires_at',
        'notes',
    ];

    protected $casts = [
        'download_count' => 'integer',
        'last_downloaded_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected $hidden = [
        'pin_hash',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function editedPhotos()
    {
        return $this->belongsToMany(EditedPhoto::class, 'delivery_photos')
            ->withPivot('download_count')
            ->withTimestamps();
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isAccessible(): bool
    {
        return $this->status === 'active' && !$this->isExpired();
    }
}
