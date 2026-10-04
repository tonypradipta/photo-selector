<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = \App\Models\User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin Studio',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );

        \App\Models\Profile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'studio_name' => 'Perumda Photography',
                'full_name' => 'Admin Studio',
                'location' => 'Indonesia',
                'show_branding' => true,
                'allow_notes' => true,
            ]
        );
    }
}
