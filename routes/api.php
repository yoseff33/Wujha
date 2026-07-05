<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// مسار اختبار عشان نتأكد إن السيرفر يتنفس
Route::get('/test', function() {
    return response()->json(['status' => 'السيرفر شغال ومسار الـ API سليم 100%']);
});

Route::post('/login', function (Request $request) {
    try {
        $user = User::where('email', $request->phone)->first();
        
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'بيانات الدخول غلط'], 401);
        }
        
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json(['token' => $token, 'user' => $user]);
    } catch (\Exception $e) {
        // هنا نصيد الخطأ الداخلي ونرجعه للمتصفح عشان نفهمه
        return response()->json(['error' => 'خطأ داخلي في السيرفر: ' . $e->getMessage()], 500);
    }
});

Route::post('/register', function (Request $request) {
    try {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->phone,
            'password' => Hash::make($request->password),
        ]);
        
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json(['token' => $token, 'user' => $user]);
    } catch (\Exception $e) {
        return response()->json(['error' => 'خطأ في إنشاء الحساب: ' . $e->getMessage()], 500);
    }
});