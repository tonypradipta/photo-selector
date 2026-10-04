<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'drive_file_id', 'file_name', 'photo_code',
        'mime_type', 'preview_path', 'drive_thumbnail_url',
        'drive_modified_time', 'width', 'height', 'sort_order', 'active',
    ];

    protected $casts = [
        'active' => 'boolean',
        'sort_order' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function selections()
    {
        return $this->hasMany(Selection::class);
    }
}
