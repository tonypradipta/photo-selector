<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('edited_folder_id')->nullable()->after('drive_folder_id');
            $table->string('edited_folder_url')->nullable()->after('edited_folder_id');
            $table->timestamp('editing_started_at')->nullable()->after('completed_at');
            $table->timestamp('delivered_at')->nullable()->after('editing_started_at');
        });

        Schema::table('selections', function (Blueprint $table) {
            $table->string('edit_status')->default('pending')->after('client_note'); // pending, editing, ready, delivered
        });

        // Migrate existing completed projects to selected status
        DB::table('projects')->where('status', 'completed')->update(['status' => 'selected']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('selections', function (Blueprint $table) {
            $table->dropColumn('edit_status');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'edited_folder_id',
                'edited_folder_url',
                'editing_started_at',
                'delivered_at',
            ]);
        });
    }
};
