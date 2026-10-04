<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE photos MODIFY drive_thumbnail_url TEXT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE photos ALTER COLUMN drive_thumbnail_url TYPE TEXT');
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE photos MODIFY drive_thumbnail_url VARCHAR(255) NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE photos ALTER COLUMN drive_thumbnail_url TYPE VARCHAR(255)');
        }
    }
};
