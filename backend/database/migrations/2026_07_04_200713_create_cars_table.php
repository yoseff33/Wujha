<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('brand');
            $table->string('model');
            $table->integer('year');
            $table->string('color')->nullable();
            $table->integer('mileage')->nullable();
            $table->decimal('daily_price', 8, 2);
            $table->decimal('weekly_price', 8, 2)->nullable();
            $table->decimal('monthly_price', 8, 2)->nullable();
            $table->decimal('insurance_amount', 8, 2)->default(0);
            $table->string('city');
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->text('terms')->nullable();
            $table->text('features')->nullable();
            $table->string('fuel_policy')->nullable();
            $table->integer('km_limit')->nullable();
            $table->enum('status', ['active', 'maintenance', 'rented', 'pending'])->default('pending');
            $table->json('images')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};