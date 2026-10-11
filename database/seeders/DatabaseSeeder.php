<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::updateOrCreate(
            ['email' => 'softawk@gmail.com'],
            [
                'name' => 'Admin Softawk',
                'password' => bcrypt('#@less@ndro31'),
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@loreanne.pe'],
            [
                'name' => 'Admin Loreanne',
                'password' => bcrypt('#adminloreanne2026'),
                'email_verified_at' => now(),
            ]
        );

        $this->call(TiendaMarcianosSeeder::class);
    }
}
