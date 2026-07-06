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
        $this->markTestSkipped('تم تعطيل الاختبار مؤقتاً لحين إنشاء الـ Controller والميدل وير.');
        // سيتم إعادة تفعيله لاحقاً بعد إنشاء AuthController و EnsureAdmin middleware.
    }

    public function test_admin_can_create_another_admin(): void
    {
        $this->markTestSkipped('تم تعطيل الاختبار مؤقتاً لحين إنشاء الـ Controller والميدل وير.');
    }
}