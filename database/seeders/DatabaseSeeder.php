<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database. Demo data is for local development only.
     */
    public function run(): void
    {
        if (! app()->environment('local')) {
            return;
        }

        User::factory()->create([
            'name' => 'محاسب تجريبي',
            'email' => 'test@example.com',
        ]);

        $this->call(DemoSeeder::class);
    }
}
