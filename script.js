// ============================================================
//  الملف: script.js - النسخة المعدلة للعمل مع Supabase مباشرة
//  باستخدام window.supabaseClient لتجنب التعارضات
//  تم إصلاح مشاكل إضافة السيارة وعرض الروابط حسب الصلاحية
// ============================================================

// ============================================================
// 1. دوال المصادقة وإدارة الجلسة (Supabase)
// ============================================================

// التأكد من وجود عميل Supabase
if (typeof window.supabaseClient === 'undefined') {
    console.error('❌ window.supabaseClient غير معرف. تأكد من تحميل supabase-config.js قبل هذا الملف.');
}

/**
 * تسجيل مستخدم جديد
 * @param {string} email
 * @param {string} password
 * @param {string} role - 'user', 'renter', 'owner', 'admin'
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<{success: boolean, user?: any, error?: string}>}
 */
async function signUpUser(email, password, role, name, phone) {
    try {
        const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    phone: phone,
                    role: role || 'user',
                    status: role === 'owner' ? 'pending' : 'approved'
                }
            }
        });
        if (authError) throw authError;

        // إضافة سجل في جدول users
        const { error: insertError } = await window.supabaseClient
            .from('users')
            .insert([{
                id: authData.user.id,
                name: name,
                phone: phone,
                email: email,
                role: role || 'user',
                status: role === 'owner' ? 'pending' : 'approved'
            }]);
        if (insertError) console.warn('فشل إدراج المستخدم في جدول users:', insertError);

        // حفظ الجلسة في localStorage
        const session = authData.session;
        if (session) {
            localStorage.setItem('supabase_token', session.access_token);
            localStorage.setItem('supabase_refresh_token', session.refresh_token);
            localStorage.setItem('user', JSON.stringify(authData.user));
            localStorage.setItem('userRole', role || 'user');
            localStorage.setItem('isLoggedIn', 'true');
        }

        return { success: true, user: authData.user };
    } catch (error) {
        console.error('خطأ في التسجيل:', error);
        return { success: false, error: error.message };
    }
}

/**
 * تسجيل الدخول
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, user?: any, role?: string, error?: string}>}
 */
async function signInUser(email, password) {
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) throw error;

        const session = data.session;
        const user = data.user;
        const role = user.user_metadata?.role || 'user';

        localStorage.setItem('supabase_token', session.access_token);
        localStorage.setItem('supabase_refresh_token', session.refresh_token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', role);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', user.user_metadata?.name || user.email || 'مستخدم');

        return { success: true, user: user, role: role };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return { success: false, error: error.message };
    }
}

/**
 * تسجيل الخروج
 */
function signOutUser() {
    window.supabaseClient.auth.signOut();
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('supabase_refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    window.location.href = '/index.html';
}

/**
 * الحصول على المستخدم الحالي من localStorage
 * @returns {object|null}
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

/**
 * الحصول على دور المستخدم
 * @returns {string}
 */
function getUserRole() {
    return localStorage.getItem('userRole') || 'user';
}

/**
 * التحقق من صلاحية الأدمن (لحماية لوحة التحكم)
 * @returns {Promise<boolean>} - true إذا كان أدمن، وإلا يوجه إلى landing.html ويعيد false
 */
async function checkAdminAccess() {
    const token = localStorage.getItem('supabase_token');
    if (!token) {
        window.location.href = '/landing.html';
        return false;
    }

    const { data: { user }, error } = await window.supabaseClient.auth.getUser(token);
    if (error || !user) {
        localStorage.clear();
        window.location.href = '/landing.html';
        return false;
    }

    const role = user.user_metadata?.role || 'user';
    if (role !== 'admin') {
        window.location.href = '/landing.html';
        return false;
    }
    return true;
}

// ============================================================
// 2. دوال السيارات (Supabase)
// ============================================================

/**
 * جلب السيارات مع إمكانية التصفية
 * @param {object} filters - { city, status, brand, ... }
 * @returns {Promise<Array>}
 */
async function fetchCars(filters = {}) {
    let query = window.supabaseClient.from('cars').select('*');
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.brand) query = query.eq('brand', filters.brand);

    const { data, error } = await query;
    if (error) {
        console.error('فشل جلب السيارات:', error);
        return [];
    }
    return data;
}

/**
 * إضافة سيارة جديدة - فقط للمالك أو الأدمن
 * @param {object} carData - بيانات السيارة
 * @returns {Promise<object|null>}
 */
async function createCar(carData) {
    const token = localStorage.getItem('supabase_token');
    if (!token) {
        alert('الرجاء تسجيل الدخول أولاً');
        return null;
    }

    const user = getCurrentUser();
    if (!user) {
        alert('المستخدم غير موجود');
        return null;
    }

    const role = getUserRole();
    if (role !== 'owner' && role !== 'admin') {
        alert('❌ فقط المالك يمكنه إضافة سيارة.');
        return null;
    }

    // ===== أرسل الأعمدة الأساسية فقط =====
    const carPayload = {
        owner_id: user.id,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        daily_price: carData.daily_price,
        city: carData.city,
        status: 'pending'
    };

    // أضف الأعمدة الاختيارية فقط إذا كانت موجودة في الجدول
    if (carData.color) carPayload.color = carData.color;
    if (carData.location) carPayload.location = carData.location;
    if (carData.description) carPayload.description = carData.description;
    if (carData.type) carPayload.type = carData.type;
    if (carData.passengers) carPayload.passengers = carData.passengers;
    if (carData.transmission) carPayload.transmission = carData.transmission;
    if (carData.fuel) carPayload.fuel = carData.fuel;
    if (carData.images) carPayload.images = carData.images;
    if (carData.plate_number) carPayload.plate_number = carData.plate_number;

    const { data, error } = await window.supabaseClient
        .from('cars')
        .insert([carPayload])
        .select()
        .single();

    if (error) {
        console.error('فشل إضافة السيارة:', error);
        alert('حدث خطأ: ' + error.message);
        return null;
    }
    return data;
}

/**
 * تحديث حالة سيارة (موافقة، رفض، تفعيل)
 * @param {string|number} carId
 * @param {string} newStatus - 'active', 'inactive', 'pending', 'rejected'
 * @returns {Promise<object|null>}
 */
async function updateCarStatus(carId, newStatus) {
    const token = localStorage.getItem('supabase_token');
    if (!token) return null;

    const { data, error } = await window.supabaseClient
        .from('cars')
        .update({ status: newStatus })
        .eq('id', carId)
        .select()
        .single();

    if (error) {
        console.error('فشل تحديث حالة السيارة:', error);
        return null;
    }
    return data;
}

// ============================================================
// 3. دوال الحجز والعقود (Supabase)
// ============================================================

/**
 * إنشاء حجز جديد
 * @param {object} bookingData - { car_id, start_date, end_date, total_price, delivery_method?, delivery_location? }
 * @returns {Promise<object|null>}
 */
async function createBooking(bookingData) {
    const token = localStorage.getItem('supabase_token');
    if (!token) {
        alert('الرجاء تسجيل الدخول');
        return null;
    }
    const user = getCurrentUser();
    if (!user) return null;

    const { data, error } = await window.supabaseClient
        .from('bookings')
        .insert([{
            car_id: bookingData.car_id,
            renter_id: user.id,
            start_date: bookingData.start_date,
            end_date: bookingData.end_date,
            total_price: bookingData.total_price,
            status: 'pending_owner_approval',
            delivery_method: bookingData.delivery_method || null,
            delivery_location: bookingData.delivery_location || null
        }])
        .select()
        .single();

    if (error) {
        console.error('فشل إنشاء الحجز:', error);
        alert('حدث خطأ أثناء الحجز');
        return null;
    }
    return data;
}

/**
 * إنشاء عقد بعد الموافقة على الحجز
 * @param {object} contractData - { booking_id, contract_number, pdf_link?, qr_code?, start_date, end_date }
 * @returns {Promise<object|null>}
 */
async function createContract(contractData) {
    const token = localStorage.getItem('supabase_token');
    if (!token) return null;

    const { data, error } = await window.supabaseClient
        .from('contracts')
        .insert([contractData])
        .select()
        .single();

    if (error) {
        console.error('فشل إنشاء العقد:', error);
        return null;
    }
    return data;
}

// ============================================================
// 4. دوال العرض والتفاعل (تستدعي دوال Supabase)
// ============================================================

/**
 * عرض السيارات في عنصر محدد
 * @param {Array} cars - قائمة السيارات
 * @param {string} containerId - id العنصر الحاوي
 */
function renderCars(cars, containerId = 'cars-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!cars || cars.length === 0) {
        container.innerHTML = '<p>لا توجد سيارات متاحة حالياً</p>';
        return;
    }

    container.innerHTML = cars.map(car => `
        <div class="car-card" data-car-id="${car.id}">
            <div class="car-img-box">
                <img src="${car.images?.[0] || 'https://via.placeholder.com/300x200?text=سيارة'}" alt="${car.brand} ${car.model}">
                <span class="badge ${car.status === 'active' ? 'badge-success' : 'badge-warning'}">${car.status === 'active' ? 'متاحة' : 'قيد المراجعة'}</span>
            </div>
            <div class="car-info">
                <h3 class="car-title">${car.brand} ${car.model}</h3>
                <div class="car-year">${car.year} | ${car.city}</div>
                <div class="price-box">
                    <div class="price">${car.daily_price} <small>ر.س/يوم</small></div>
                    <button class="btn-book" onclick="bookCar('${car.id}')">حجز الآن</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * دالة حجز سيارة (تستدعي createBooking وتطلب التواريخ)
 * @param {string|number} carId
 */
async function bookCar(carId) {
    const user = getCurrentUser();
    if (!user) {
        alert('الرجاء تسجيل الدخول أولاً');
        window.location.href = '/landing.html';
        return;
    }

    const startDate = prompt('أدخل تاريخ البداية (YYYY-MM-DD HH:MM:SS)');
    const endDate = prompt('أدخل تاريخ النهاية (YYYY-MM-DD HH:MM:SS)');
    if (!startDate || !endDate) return;

    const { data: car, error: carError } = await window.supabaseClient
        .from('cars')
        .select('daily_price')
        .eq('id', carId)
        .single();

    if (carError || !car) {
        alert('حدث خطأ في جلب بيانات السيارة');
        return;
    }

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
    const total = days * car.daily_price;

    const booking = await createBooking({
        car_id: carId,
        start_date: startDate,
        end_date: endDate,
        total_price: total
    });

    if (booking) {
        alert('تم إنشاء الحجز بنجاح، في انتظار موافقة المالك');
        localStorage.setItem('current_booking_id', booking.id);
        window.location.href = '/dashboard-renter.html';
    }
}

// ============================================================
// 5. دوال التوافق مع الواجهات القديمة
// ============================================================

/**
 * دالة تسجيل الدخول القديمة - تم تعديلها لاستخدام Supabase
 */
async function loginUser(type) {
    const emailInput = document.getElementById('email-input') || document.getElementById('login-email');
    const passwordInput = document.getElementById('password-input') || document.getElementById('login-password');

    if (!emailInput || !passwordInput) {
        alert('يرجى التأكد من وجود حقول البريد الإلكتروني وكلمة المرور');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        alert('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }

    const result = await signInUser(email, password);
    if (result.success) {
        const role = result.role;
        updateNavbarBasedOnLoginStatus();

        if (role === 'admin') {
            window.location.href = '/admin_dashboard.html';
        } else if (role === 'owner') {
            window.location.href = '/dashboard-owner.html';
        } else if (role === 'renter') {
            window.location.href = '/dashboard-renter.html';
        } else {
            window.location.href = '/index.html';
        }
    } else {
        alert('فشل تسجيل الدخول: ' + result.error);
    }
}

/**
 * دالة تسجيل الخروج القديمة - تم تعديلها
 */
function logoutUser() {
    signOutUser();
}

// ============================================================
// 6. دوال مساعدة أخرى (تم إصلاح شريط التنقل)
// ============================================================

// -------------------------------------
// تحديث شريط التنقل بناءً على حالة تسجيل الدخول (✅ تم الإصلاح)
// -------------------------------------
function updateNavbarBasedOnLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userType = localStorage.getItem('userRole');

    // ===== عناصر سطح المكتب =====
    const desktopNavLinks = document.querySelector('.desktop-nav-links');
    const desktopAuthLinks = desktopNavLinks ? desktopNavLinks.querySelectorAll('.auth-link') : [];
    const desktopGuestButton = document.getElementById('nav-guest-button');
    const desktopUserProfilePlaceholder = document.getElementById('nav-user-profile-placeholder');

    // ===== عناصر الجوال =====
    const mobileBottomNavGuestButton = document.getElementById('mobile-bottom-guest-button');
    const mobileBottomNavUserButton = document.getElementById('mobile-bottom-user-button');
    const mobileBottomNavAuthLinks = document.querySelectorAll('.mobile-bottom-navbar .auth-link-bottom');

    // ===== 1. إخفاء الكل افتراضياً =====
    if (desktopGuestButton) desktopGuestButton.style.display = 'none';
    if (desktopUserProfilePlaceholder) desktopUserProfilePlaceholder.style.display = 'none';
    desktopAuthLinks.forEach(link => link.style.display = 'none');
    if (mobileBottomNavGuestButton) mobileBottomNavGuestButton.style.display = 'none';
    if (mobileBottomNavUserButton) mobileBottomNavUserButton.style.display = 'none';
    mobileBottomNavAuthLinks.forEach(link => link.style.display = 'none');

    if (!isLoggedIn) {
        // ===== 2. غير مسجل الدخول: عرض أزرار الدخول فقط =====
        if (desktopGuestButton) desktopGuestButton.style.display = 'flex';
        if (mobileBottomNavGuestButton) mobileBottomNavGuestButton.style.display = 'flex';
        return;
    }

    // ===== 3. مسجل الدخول: عرض ملف المستخدم =====
    if (desktopUserProfilePlaceholder) {
        let profileLink = '/index.html';
        if (userType === 'owner') profileLink = '/dashboard-owner.html';
        else if (userType === 'renter') profileLink = '/dashboard-renter.html';
        else if (userType === 'admin') profileLink = '/admin_dashboard.html';

        desktopUserProfilePlaceholder.innerHTML = `
            <a href="#" class="btn btn-outline" onclick="logoutUser()" style="margin-right: 10px;">
                <i class="fas fa-sign-out-alt"></i> خروج
            </a>
            <a href="${profileLink}" class="btn btn-secondary">
                <i class="fas fa-user-circle"></i> ملفي
            </a>
        `;
        desktopUserProfilePlaceholder.style.display = 'flex';
    }

    // ===== 4. عرض الروابط حسب الدور (سطح المكتب) =====
    desktopAuthLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        let show = false;

        if (userType === 'admin') {
            // الأدمن يرى كل الروابط
            show = true;
        } else if (userType === 'owner') {
            // المالك يرى: لوحة المؤجر + إضافة سيارة
            if (linkHref && (linkHref.includes('dashboard-owner.html') || linkHref.includes('add-car.html'))) {
                show = true;
            }
        } else if (userType === 'renter') {
            // المستأجر يرى: لوحة المستأجر فقط
            if (linkHref && linkHref.includes('dashboard-renter.html')) {
                show = true;
            }
        }
        // أي دور آخر (مثل 'user') لا يرى أي روابط مصادقة

        if (show) {
            link.style.display = 'block';
        }
    });

    // ===== 5. عرض الروابط حسب الدور (الجوال) =====
    if (mobileBottomNavUserButton) {
        mobileBottomNavUserButton.style.display = 'flex';
        if (userType === 'owner') mobileBottomNavUserButton.href = '/dashboard-owner.html';
        else if (userType === 'renter') mobileBottomNavUserButton.href = '/dashboard-renter.html';
        else if (userType === 'admin') mobileBottomNavUserButton.href = '/admin_dashboard.html';
        else mobileBottomNavUserButton.href = '/index.html';
    }

    mobileBottomNavAuthLinks.forEach(link => {
        const linkDataRole = link.getAttribute('data-role');
        let show = false;

        if (userType === 'admin') {
            show = true;
        } else if (userType === 'owner' && (linkDataRole === 'owner' || linkDataRole === 'all')) {
            show = true;
        } else if (userType === 'renter' && (linkDataRole === 'renter' || linkDataRole === 'all')) {
            show = true;
        } else if (linkDataRole === 'all') {
            show = true;
        }

        if (show) {
            link.style.display = 'flex';
        }
    });
}

// -------------------------------------
// تحديث بطاقة الولاء
// -------------------------------------
function updateLoyaltyCard(completedRentals) {
    const totalRentalsNeeded = 8;
    const progressPercentage = (completedRentals / totalRentalsNeeded) * 100;

    const progressBarFill = document.querySelector('.loyalty-line-fill');
    const loyaltyDots = document.querySelectorAll('.loyalty-dot');
    const currentRentalsText = document.getElementById('current-rentals-count');
    const remainingRentalsText = document.getElementById('remaining-rentals-count');

    if (progressBarFill) {
        progressBarFill.style.width = `${progressPercentage}%`;
    }

    loyaltyDots.forEach((dot, index) => {
        if (index < completedRentals) {
            dot.classList.add('completed');
        } else {
            dot.classList.remove('completed');
        }
        dot.textContent = index + 1;
    });

    if (currentRentalsText) currentRentalsText.textContent = completedRentals;
    if (remainingRentalsText) remainingRentalsText.textContent = totalRentalsNeeded - completedRentals;

    if (completedRentals >= totalRentalsNeeded) {
        if (remainingRentalsText) remainingRentalsText.textContent = '0';
        const rewardInfo = document.querySelector('.loyalty-reward-info small');
        if (rewardInfo) rewardInfo.textContent = 'تهانينا! تأجيرك المجاني بانتظرك!';
    }
}

// -------------------------------------
// الواجهة الليلية/النهارية
// -------------------------------------
function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-desktop');

    const applyTheme = (theme) => {
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(theme + '-mode');
        localStorage.setItem('theme', theme);

        if (themeToggleBtn) {
            if (window.innerWidth <= 992) {
                themeToggleBtn.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i><span>الوضع الليلي</span>' : '<i class="fas fa-sun"></i><span>الوضع النهاري</span>';
            } else {
                themeToggleBtn.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            }
        }
    };

    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
            applyTheme(newTheme);
        });
        window.addEventListener('resize', () => applyTheme(localStorage.getItem('theme') || 'light'));
    }
}

// -------------------------------------
// شريط "آخر مشاهدة للسيارات"
// -------------------------------------
const RECENTLY_VIEWED_KEY = 'recentlyViewedCars';
const MAX_RECENTLY_VIEWED = 5;

function addCarToRecentlyViewed(carId, carImg, carTitle) {
    let recentlyViewed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || [];
    recentlyViewed = recentlyViewed.filter(car => car.id !== carId);
    recentlyViewed.unshift({ id: carId, img: carImg, title: carTitle });
    if (recentlyViewed.length > MAX_RECENTLY_VIEWED) {
        recentlyViewed = recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
    }
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
    renderRecentlyViewedCars();
}

function renderRecentlyViewedCars() {
    const recentlyViewed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || [];
    const container = document.getElementById('recently-viewed-cars-container');

    if (container) {
        if (recentlyViewed.length === 0) {
            container.innerHTML = '<p style="color:var(--gray);">لا توجد سيارات تم عرضها مؤخرًا.</p>';
        } else {
            container.innerHTML = '';
            recentlyViewed.forEach(car => {
                const carLink = document.createElement('a');
                carLink.href = '#';
                carLink.classList.add('recent-car-thumb');
                carLink.innerHTML = `<img src="${car.img}" alt="${car.title}">`;
                container.appendChild(carLink);
            });
        }
    }
}

// -------------------------------------
// شهادات العملاء (السلايدر)
// -------------------------------------
let slideIndex = 0;
let slideInterval;

function showSlides() {
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;

    slides.forEach(slide => slide.style.display = 'none');
    dots.forEach(dot => dot.classList.remove('active'));

    slideIndex++;
    if (slideIndex > slides.length) slideIndex = 1;

    slides[slideIndex - 1].style.display = 'block';
    dots[slideIndex - 1].classList.add('active');
}

function currentSlide(n) {
    clearInterval(slideInterval);
    slideIndex = n;
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;

    slides.forEach(slide => slide.style.display = 'none');
    dots.forEach(dot => dot.classList.remove('active'));

    slides[slideIndex - 1].style.display = 'block';
    dots[slideIndex - 1].classList.add('active');

    slideInterval = setInterval(showSlides, 5000);
}

// -------------------------------------
// أداة اختبار السيارة (Quiz)
// -------------------------------------
function setupQuiz() {
    const quizForm = document.getElementById('car-quiz-form');
    const quizResults = document.getElementById('quiz-results');
    if (!quizForm || !quizResults) return;

    quizForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(quizForm);
        const answers = {};
        for (let [key, value] of formData.entries()) {
            answers[key] = value;
        }

        let recommendation = "لا يمكننا تحديد سيارة مناسبة بناءً على اختياراتك.";
        let carType = "";

        if (answers.passengers === '5' || answers.passengers === '7') {
            if (answers.budget === 'medium' || answers.budget === 'high') {
                recommendation = "نوصي بسيارة دفع رباعي فسيحة ومريحة لرحلاتك العائلية.";
                carType = "دفع رباعي";
            } else {
                recommendation = "ننصح بسيارة سيدان متوسطة الحجم، اقتصادية ومناسبة للاستخدام اليومي.";
                carType = "سيدان";
            }
        } else if (answers.passengers === '2' || answers.passengers === '4') {
            if (answers.budget === 'low') {
                recommendation = "سيارة اقتصادية صغيرة ستكون مثالية لتنقلاتك اليومية داخل المدينة.";
                carType = "اقتصادية";
            } else if (answers.style === 'sporty' || answers.style === 'luxury') {
                recommendation = "سيارة فاخرة أو رياضية ستلبي رغبتك في الأناقة والأداء العالي.";
                carType = "فاخرة";
            } else {
                recommendation = "سيارة سيدان أنيقة وعملية ستكون خياراً ممتازاً لك.";
                carType = "سيدان";
            }
        }

        quizResults.innerHTML = `
            <h3>نتائج اختبارك</h3>
            <p>${recommendation}</p>
            <p>يمكنك استكشاف السيارات من فئة: <strong>${carType}</strong></p>
            <a href="/cars.html" class="btn btn-primary" style="margin-top:20px;">
                <i class="fas fa-search"></i> استكشف السيارات
            </a>
        `;
        quizResults.style.display = 'block';
    });
}

// -------------------------------------
// وظائف المسؤولية الاجتماعية (CSR)
// -------------------------------------
function displayRandomCsrFact() {
    const csrFactElement = document.getElementById('csr-fact-display');
    if (csrFactElement && typeof csrFacts !== 'undefined' && csrFacts.length > 0) {
        const randomIndex = Math.floor(Math.random() * csrFacts.length);
        csrFactElement.textContent = csrFacts[randomIndex].text;
    }
}

function setupPledgeGenerator() {
    const pledgeForm = document.getElementById('pledge-form');
    const pledgeResultDiv = document.getElementById('pledge-result');
    const userName = localStorage.getItem('userName') || 'صديقنا';

    if (pledgeForm && pledgeResultDiv && typeof pledgeOptions !== 'undefined') {
        const pledgeOptionsContainer = pledgeForm.querySelector('.quiz-options');
        if (pledgeOptionsContainer) {
            pledgeOptionsContainer.innerHTML = '';
            pledgeOptions.forEach(option => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="radio" name="pledge-type" value="${option.id}"> ${option.text}`;
                pledgeOptionsContainer.appendChild(label);
            });
        }

        pledgeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const selectedPledgeId = pledgeForm.querySelector('input[name="pledge-type"]:checked')?.value;

            if (selectedPledgeId) {
                const selectedPledge = pledgeOptions.find(p => p.id === selectedPledgeId);
                if (selectedPledge) {
                    const thankYouMessage = selectedPledge.thankYou.replace('[اسم_المستخدم]', userName);
                    pledgeResultDiv.innerHTML = `
                        <h3>شكرًا لالتزامك!</h3>
                        <p>${thankYouMessage}</p>
                        <button class="btn btn-secondary" onclick="window.location.reload()">تعهد آخر</button>
                    `;
                    pledgeResultDiv.style.display = 'block';
                    pledgeForm.style.display = 'none';
                }
            } else {
                pledgeResultDiv.innerHTML = `<p style="color:var(--text-color-light);">الرجاء اختيار تعهد أولاً للمتابعة.</p>`;
                pledgeResultDiv.style.display = 'block';
            }
        });
    }
}

function renderImpactDashboard() {
    const impactContainer = document.getElementById('impact-stats-container');
    if (impactContainer && typeof impactStats !== 'undefined' && impactStats.length > 0) {
        impactContainer.innerHTML = '';
        impactStats.forEach(stat => {
            const statCard = document.createElement('div');
            statCard.classList.add('stat-card');
            statCard.innerHTML = `
                <h3>${stat.label}</h3>
                <div class="value">${stat.value}${stat.unit}</div>
                <p class="story" style="font-size:0.95rem; color: var(--gray); margin-top:10px;">${stat.story}</p>
            `;
            impactContainer.appendChild(statCard);
        });
    }
}

// -------------------------------------
// وظائف الخريطة (واجهة روشن) - تعمل ببيانات ثابتة
// -------------------------------------

let map;
let carMarkersLayer;
let currentRouteLine = null;
const targetLocation = [24.8375090, 46.7297325];

// بيانات السيارات الثابتة للخريطة
const allCars = [
    {
        id: 'r1', type: 'سيدان', model: 'تويوتا كامري 2024', price: '120',
        rating: 4.9, reviews: 52, lat: 24.8375090, lng: 46.7297325,
        scores: { mech: 10, acc: 10, clean: 9 },
        img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop'
    },
    {
        id: 'r2', type: 'دفع رباعي', model: 'تويوتا لاندكروزر', price: '450',
        rating: 5.0, reviews: 18, lat: 24.8381000, lng: 46.7292000,
        scores: { mech: 10, acc: 10, clean: 10 },
        img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop'
    },
    {
        id: 'r3', type: 'فاخرة', model: 'مرسيدس S500', price: '900',
        rating: 4.8, reviews: 12, lat: 24.8369000, lng: 46.7301000,
        scores: { mech: 10, acc: 9, clean: 10 },
        img: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
    },
    {
        id: 'r4', type: 'سيدان', model: 'هونداي النترا', price: '85',
        rating: 4.2, reviews: 89, lat: 24.8378000, lng: 46.7305000,
        scores: { mech: 8, acc: 7, clean: 8 },
        img: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop'
    },
    {
        id: 'r5', type: 'سيدان', model: 'تويوتا كامري 2023', price: '115',
        rating: 4.7, reviews: 40, lat: 24.8372000, lng: 46.7289000,
        scores: { mech: 9, acc: 10, clean: 8 },
        img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop'
    },
    {
        id: 'r6', type: 'دفع رباعي', model: 'شيفروليه تاهو', price: '380',
        rating: 4.9, reviews: 22, lat: 24.8365000, lng: 46.7295000,
        scores: { mech: 10, acc: 10, clean: 9 },
        img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop'
    },
    {
        id: 'r7', type: 'فاخرة', model: 'لوسيد آير', price: '700',
        rating: 5.0, reviews: 4, lat: 24.8385000, lng: 46.7298000,
        scores: { mech: 10, acc: 10, clean: 10 },
        img: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
    }
];

function initMap() {
    if (document.getElementById('mapid') && typeof L !== 'undefined') {
        if (map) { map.remove(); }
        map = L.map('mapid').setView(targetLocation, 17);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            maxZoom: 20
        }).addTo(map);
        carMarkersLayer = L.layerGroup().addTo(map);
        renderCarsOnMap();
        setTimeout(() => { map.invalidateSize(); }, 500);
    }
}

function createPriceIcon(price, type, extraClass = '') {
    let iconHtml = '';
    if (type === 'فاخرة') iconHtml = '<i class="fas fa-gem" style="color:#f1c40f"></i>';
    else if (type === 'دفع رباعي') iconHtml = '<i class="fas fa-truck-pickup" style="color:#e67e22"></i>';
    else iconHtml = '<i class="fas fa-car" style="color:var(--primary)"></i>';

    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="price-marker-box ${extraClass}">${iconHtml} ${price} ﷼</div>`,
        iconSize: [80, 30],
        iconAnchor: [40, 35],
        popupAnchor: [0, -35]
    });
}

function getProgressBar(score) {
    let colorClass = 'bg-success';
    if (score < 7) colorClass = 'bg-warning';
    if (score < 5) colorClass = 'bg-danger';
    return `
        <div class="progress-track">
            <div class="progress-fill ${colorClass}" style="width: ${score * 10}%"></div>
        </div>
        <div class="rating-score">${score}</div>
    `;
}

function drawRouteToCar(destLat, destLng) {
    if (currentRouteLine) map.removeLayer(currentRouteLine);
    const startPoint = targetLocation;
    const endPoint = [destLat, destLng];
    currentRouteLine = L.polyline([startPoint, endPoint], {
        color: 'var(--secondary)',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        lineCap: 'round'
    }).addTo(map);
    map.fitBounds(currentRouteLine.getBounds(), { padding: [50, 50] });
}

let currentType = 'الكل';
let maxPrice = 1000;

window.updatePriceLabel = function(val) {
    maxPrice = parseInt(val);
    const label = document.getElementById('priceValue');
    if (label) label.innerText = val + ' ريال';
};

window.filterMap = function(type, element) {
    currentType = type;
    document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    renderCarsOnMap();
};

function renderCarsOnMap() {
    if (!map || !carMarkersLayer) return;
    carMarkersLayer.clearLayers();
    if (currentRouteLine) map.removeLayer(currentRouteLine);

    const filtered = allCars.filter(car => {
        const typeMatch = currentType === 'الكل' ? true : car.type === currentType;
        const priceMatch = parseInt(car.price) <= maxPrice;
        return typeMatch && priceMatch;
    });

    filtered.forEach(car => {
        const isPremium = car.rating >= 5.0;
        const extraClass = isPremium ? 'premium-marker' : '';
        const marker = L.marker([car.lat, car.lng], { icon: createPriceIcon(car.price, car.type, extraClass) }).addTo(carMarkersLayer);
        marker.on('click', function() {
            drawRouteToCar(car.lat, car.lng);
        });

        const popupContent = `
            <div class="popup-car-card">
                <img src="${car.img}" class="popup-img">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <h4 style="margin:0; color:var(--primary);">${car.model}</h4>
                    <span class="rating-badge"><i class="fas fa-star"></i> ${car.rating}</span>
                </div>
                <div class="rating-bars-container">
                    <div class="rating-row"><span class="rating-label"><i class="fas fa-wrench"></i> الميكانيكا</span>${getProgressBar(car.scores.mech)}</div>
                    <div class="rating-row"><span class="rating-label"><i class="fas fa-shield-alt"></i> الحوادث</span>${getProgressBar(car.scores.acc)}</div>
                    <div class="rating-row"><span class="rating-label"><i class="fas fa-sparkles"></i> النظافة</span>${getProgressBar(car.scores.clean)}</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <div style="font-weight:bold; font-size:1.1rem;">${car.price} <span style="font-size:0.8rem; font-weight:normal;">ريال/يوم</span></div>
                    <a href="/cars.html?carId=${car.id}" class="btn btn-primary" style="padding:6px 15px; font-size:0.9rem;">حجز</a>
                </div>
            </div>
        `;
        marker.bindPopup(popupContent);
    });
}

window.simulateSmartLocate = function() {
    const btn = document.getElementById('smart-locate-btn');
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري البحث...';
    setTimeout(() => {
        map.flyTo(targetLocation, 17);
        btn.innerHTML = '<i class="fas fa-check"></i> أنت هنا';
        btn.style.background = '#2ecc71';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    }, 1000);
};

// ============================================================
// 7. تهيئة الصفحة عند تحميل DOM
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // تهيئة الثيم
    setupThemeToggle();

    // تحديث شريط التنقل بناءً على حالة الدخول
    updateNavbarBasedOnLoginStatus();

    // تفعيل العنصر النشط في القائمة السفلية
    const bottomNavItems = document.querySelectorAll('.mobile-bottom-navbar .nav-item');
    bottomNavItems.forEach(item => {
        item.classList.remove('active');
        const currentPath = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
        const itemHref = item.getAttribute('href');
        if (itemHref === currentPath) item.classList.add('active');
        if (itemHref === 'index.html' && (currentPath === '' || currentPath === 'index.html')) item.classList.add('active');
    });

    // ضبط padding-bottom للشريط السفلي على الموبايل
    function adjustBodyPadding() {
        const mobileBottomNavbar = document.querySelector('.mobile-bottom-navbar');
        if (mobileBottomNavbar && window.innerWidth <= 992) {
            document.body.style.paddingBottom = mobileBottomNavbar.offsetHeight + 'px';
        } else {
            document.body.style.paddingBottom = '0';
        }
    }
    adjustBodyPadding();
    window.addEventListener('resize', adjustBodyPadding);

    // تحديث بطاقة الولاء (مثال: 3 تأجيرات مكتملة)
    const userCompletedRentals = 3;
    updateLoyaltyCard(userCompletedRentals);

    // عرض السيارات التي تمت مشاهدتها مؤخراً
    renderRecentlyViewedCars();

    // تشغيل سلايدر الشهادات
    if (document.querySelector('.testimonial-slider')) {
        showSlides();
        slideInterval = setInterval(showSlides, 5000);
    }

    // إعداد اختبار السيارة
    setupQuiz();

    // CSR
    if (document.getElementById('csr-fact-display')) displayRandomCsrFact();
    if (document.getElementById('pledge-form')) setupPledgeGenerator();
    if (document.getElementById('impact-stats-container')) renderImpactDashboard();

    // تشغيل الخريطة إذا وجدت
    if (document.getElementById('mapid')) {
        setTimeout(() => {
            if (typeof L !== 'undefined') {
                initMap();
            } else {
                console.error("Leaflet library not loaded");
            }
        }, 100);
    }

    // -------------------------------
    // إذا كانت الصفحة هي صفحة السيارات (cars.html) نقوم بجلب السيارات وعرضها
    // -------------------------------
    if (window.location.pathname.includes('cars.html')) {
        (async () => {
            const cars = await fetchCars({ status: 'active' });
            renderCars(cars);
        })();
    }

    // -------------------------------
    // إذا كانت الصفحة هي لوحة تحكم الأدمن (admin_dashboard.html) نتحقق من الصلاحية
    // -------------------------------
    if (window.location.pathname.includes('admin_dashboard.html')) {
        (async () => {
            const hasAccess = await checkAdminAccess();
            if (hasAccess) {
                const adminContent = document.getElementById('admin-content');
                if (adminContent) adminContent.style.display = 'block';
            }
        })();
    }
});

// ============================================================
// 8. إضافة مستمعين للأحداث الإضافية
// ============================================================

// تفعيل العنصر النشط في القائمة الجانبية
document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', function(e) {
        const currentActive = document.querySelector('.sidebar-menu a.active');
        if (currentActive) currentActive.classList.remove('active');
        this.classList.add('active');
    });
});

// إضافة سيارة إلى "آخر مشاهدة" عند النقر على بطاقة سيارة
document.addEventListener('click', (e) => {
    if (e.target.closest('.car-card')) {
        const carCard = e.target.closest('.car-card');
        const carImg = carCard.querySelector('.car-img-box img')?.src || '';
        const carTitle = carCard.querySelector('.car-title')?.textContent || '';
        const carId = carTitle.replace(/\s/g, '-');
        if (carImg && carTitle) {
            addCarToRecentlyViewed(carId, carImg, carTitle);
        }
    }
});
