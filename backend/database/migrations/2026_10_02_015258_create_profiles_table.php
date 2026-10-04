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
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('studio_name')->nullable();
            $table->string('full_name')->nullable();
            $table->string('location')->nullable();
            $table->text('bio')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('website')->nullable();
            $table->boolean('show_branding')->default(true);
            $table->boolean('allow_notes')->default(true);
            $table->boolean('send_reminders')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
