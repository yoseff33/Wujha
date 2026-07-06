<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::create([
            'name' => 'ادمن وجهة',
            'phone' => '0500000000',
            'password' => '12345678',
            'role' => 'admin',
            'status' => 'approved',
        ]);
    }
}