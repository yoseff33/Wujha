<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

// اختبار السيرفر
Route::get('/test', function () {
    return response()->json([
        'status' => 'السيرفر شغال ومسار API سليم 100%'
    ]);
});

// تسجيل الدخول
Route::post('/login', function (Request $request) {

    try {

        $request->validate([
            'phone' => 'required',
            'password' => 'required',
        ]);

        // البحث بواسطة رقم الجوال
        $user = User::where('phone', $request->phone)->first();

        if (!$user) {
            return response()->json([
                'message' => 'رقم الجوال غير موجود'
            ], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'كلمة المرور غير صحيحة'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $user
        ]);

    } catch (ValidationException $e) {

        return response()->json([
            'errors' => $e->errors()
        ], 422);

    } catch (\Exception $e) {

        return response()->json([
            'error' => $e->getMessage()
        ], 500);

    }

});

// إنشاء حساب
Route::post('/register', function (Request $request) {

    try {

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:users,phone',
            'password' => 'required|min:6',
            'email' => 'nullable|email|unique:users,email',
        ]);

        $user = User::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $user
        ], 201);

    } catch (ValidationException $e) {

        return response()->json([
            'errors' => $e->errors()
        ], 422);

    } catch (\Exception $e) {

        return response()->json([
            'error' => $e->getMessage()
        ], 500);

    }

});