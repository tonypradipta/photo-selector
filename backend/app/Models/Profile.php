<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'studio_name', 'full_name', 'location',
        'bio', 'whatsapp', 'website',
        'show_branding', 'allow_notes', 'send_reminders',
    ];

    protected $casts = [
        'show_branding' => 'boolean',
        'allow_notes' => 'boolean',
        'send_reminders' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
