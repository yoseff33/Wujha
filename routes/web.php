<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

Route::get('/', function () {
    // تعديل: عرض ملف index.html من مجلد public
    if (File::exists(public_path('index.html'))) {
        return File::get(public_path('index.html'));
    } else {
        return response('الصفحة الرئيسية غير موجودة', 404);
    }
});