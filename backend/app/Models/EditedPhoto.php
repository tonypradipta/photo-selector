<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EditedPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'selection_id',
        'drive_file_id',
        'file_name',
        'normalized_name',
        'mime_type',
        'size_bytes',
        'drive_thumbnail_url',
        'web_content_link',
        'drive_modified_time',
        'match_status',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function selection()
    {
        return $this->belongsTo(Selection::class);
    }

    public function deliveries()
    {
        return $this->belongsToMany(Delivery::class, 'delivery_photos')
            ->withPivot('download_count')
            ->withTimestamps();
    }
}
