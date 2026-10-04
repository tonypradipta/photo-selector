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
        Schema::create('edited_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('selection_id')->nullable()->constrained()->onDelete('set null');
            $table->string('drive_file_id');
            $table->string('file_name');
            $table->string('normalized_name');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->text('drive_thumbnail_url')->nullable();
            $table->text('web_content_link')->nullable();
            $table->string('drive_modified_time')->nullable();
            $table->string('match_status')->default('matched'); // matched, extra
            $table->timestamps();

            $table->unique(['project_id', 'drive_file_id']);
        });

        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('delivery_token')->unique();
            $table->string('pin_hash')->nullable();
            $table->string('status')->default('active'); // active, expired, revoked
            $table->unsignedInteger('download_count')->default(0);
            $table->timestamp('last_downloaded_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_id')->constrained()->onDelete('cascade');
            $table->foreignId('edited_photo_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('download_count')->default(0);
            $table->timestamps();

            $table->unique(['delivery_id', 'edited_photo_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_photos');
        Schema::dropIfExists('deliveries');
        Schema::dropIfExists('edited_photos');
    }
};
