<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained()->onDelete('cascade');
            $table->foreignId('renter_id')->constrained('users')->onDelete('cascade');
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->decimal('total_price', 10, 2);
            $table->enum('status', ['pending_owner_approval', 'pending_payment', 'confirmed', 'completed', 'cancelled'])->default('pending_owner_approval');
            $table->string('delivery_method')->nullable();
            $table->string('delivery_location')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};