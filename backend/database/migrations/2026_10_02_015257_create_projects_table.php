<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('client_name');
            $table->string('status')->default('draft'); // draft, active, locked, completed
            $table->string('client_token')->unique();
            $table->string('drive_folder_url');
            $table->string('drive_folder_id');
            $table->string('whatsapp_number')->nullable();
            $table->unsignedInteger('max_photos')->default(20);
            $table->boolean('selection_locked')->default(false);
            $table->string('gallery_password_hash')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
