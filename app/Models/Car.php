<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Car extends Model
{
    protected $fillable = [
        'owner_id',
        'brand',
        'model',
        'year',
        'color',
        'mileage',
        'daily_price',
        'weekly_price',
        'monthly_price',
        'insurance_amount',
        'city',
        'location',
        'description',
        'terms',
        'features',
        'fuel_policy',
        'km_limit',
        'status',
        'images',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}