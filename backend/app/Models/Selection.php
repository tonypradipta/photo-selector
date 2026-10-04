<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Selection extends Model
{
    use HasFactory;

    public const EDIT_STATUS_PENDING = 'pending';
    public const EDIT_STATUS_EDITING = 'editing';
    public const EDIT_STATUS_READY = 'ready';
    public const EDIT_STATUS_DELIVERED = 'delivered';

    protected $fillable = [
        'project_id',
        'photo_id',
        'client_note',
        'edit_status',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function photo()
    {
        return $this->belongsTo(Photo::class);
    }

    public function editedPhoto()
    {
        return $this->hasOne(EditedPhoto::class);
    }
}
