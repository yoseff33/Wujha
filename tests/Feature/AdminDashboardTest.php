<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_create_another_admin(): void
    {
        $user = User::factory()->create([
            'phone' => '0500000000',
            'password' => bcrypt('password123'),
            'role' => 'user',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/admins/create', [
            'name' => 'New Admin',
            'phone' => '0500000001',
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_create_another_admin(): void
    {
        $admin = User::factory()->create([
            'phone' => '0500000002',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admins/create', [
            'name' => 'New Admin',
            'phone' => '0500000003',
            'password' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user.role', 'admin');

        $this->assertDatabaseHas('users', [
            'phone' => '0500000003',
            'role' => 'admin',
        ]);
    }
}
