// ============================================================
//  script.js - الملف الأساسي لمنصة وُجْهَة (نسخة حقيقية)
//  يعتمد على Supabase الحقيقي بدون أي محاكاة
// ============================================================

// -------------------------------------
// دوال مساعدة عامة
// -------------------------------------

function getCurrentUser() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) return null;
    const userType = localStorage.getItem('userType');
    const userName = localStorage.getItem('userName') || 'مستخدم';
    return {
        id: localStorage.getItem('userId') || 'user-' + Date.now(),
        email: localStorage.getItem('userEmail') || 'user@example.com',
        user_metadata: { name: userName },
        userType: userType
    };
}

function getUserRole() {
    return localStorage.getItem('userType') || null;
}

// -------------------------------------
// دوال Supabase (الاتصال الحقيقي عبر supabase-config.js)
// -------------------------------------

function getSupabaseClient() {
    if (typeof window.supabaseClient === 'undefined' || !window.supabaseClient) {
        console.error('❌ Supabase client غير مُهيأ.');
        return null;
    }
    return window.supabaseClient;
}

// -------------------------------------
// دوال إدارة حالة تسجيل الدخول
// -------------------------------------

function updateNavbarBasedOnLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userType = localStorage.getItem('userType');

    const desktopNavLinks = document.querySelector('.desktop-nav-links');
    const desktopAuthLinks = desktopNavLinks ? desktopNavLinks.querySelectorAll('.auth-link') : [];
    const desktopGuestButton = document.getElementById('nav-guest-button');
    const desktopUserProfilePlaceholder = document.getElementById('nav-user-profile-placeholder');

    const mobileBottomNavGuestButton = document.getElementById('mobile-bottom-guest-button');
    const mobileBottomNavUserButton = document.getElementById('mobile-bottom-user-button');
    const mobileBottomNavAuthLinks = document.querySelectorAll('.mobile-bottom-navbar .auth-link-bottom');

    if (desktopGuestButton) desktopGuestButton.style.display = 'none';
    if (desktopUserProfilePlaceholder) desktopUserProfilePlaceholder.style.display = 'none';
    desktopAuthLinks.forEach(link => link.style.display = 'none');
    if (mobileBottomNavGuestButton) mobileBottomNavGuestButton.style.display = 'none';
    if (mobileBottomNavUserButton) mobileBottomNavUserButton.style.display = 'none';
    mobileBottomNavAuthLinks.forEach(link => link.style.display = 'none');

    if (isLoggedIn) {
        if (desktopUserProfilePlaceholder) {
            desktopUserProfilePlaceholder.innerHTML = `
                <a href="#" class="btn btn-outline" onclick="logoutUser()" style="margin-right: 10px;">
                    <i class="fas fa-sign-out-alt"></i> خروج
                </a>
                <a href="${userType === 'owner' ? 'dashboard-owner.html' : 'dashboard-renter.html'}" class="btn btn-secondary">
                    <i class="fas fa-user-circle"></i> ملفي
                </a>
            `;
            desktopUserProfilePlaceholder.style.display = 'flex';
        }
        desktopAuthLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (userType === 'owner') {
                if (linkHref && (linkHref.includes('dashboard-owner.html') || linkHref.includes('add-car.html'))) {
                    link.style.display = 'block';
                }
            } else if (userType === 'renter') {
                if (linkHref && linkHref.includes('dashboard-renter.html')) {
                    link.style.display = 'block';
                }
            } else if (userType === 'admin') {
                if (linkHref && linkHref.includes('dashboard-admin.html')) {
                    link.style.display = 'block';
                }
            }
        });
        if (mobileBottomNavUserButton) {
            mobileBottomNavUserButton.style.display = 'flex';
            if (userType === 'owner') mobileBottomNavUserButton.href = 'dashboard-owner.html';
            else if (userType === 'renter') mobileBottomNavUserButton.href = 'dashboard-renter.html';
            else if (userType === 'admin') mobileBottomNavUserButton.href = 'dashboard-admin.html';
        }
        mobileBottomNavAuthLinks.forEach(link => {
            const linkDataRole = link.getAttribute('data-role');
            if (linkDataRole === userType || linkDataRole === 'all') {
                link.style.display = 'flex';
            } else {
                link.style.display = 'none';
            }
        });
    } else {
        if (desktopGuestButton) desktopGuestButton.style.display = 'flex';
        if (mobileBottomNavGuestButton) mobileBottomNavGuestButton.style.display = 'flex';
    }
}

function logoutUser() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('supabase_token');
    updateNavbarBasedOnLoginStatus();
    window.location.href = 'index.html';
}

// -------------------------------------
// دوال المصادقة الحقيقية مع Supabase
// -------------------------------------

window.signInUser = async function(email, password) {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase غير مهيأ' };
    try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        if (data.session) {
            localStorage.setItem('supabase_token', data.session.access_token);
            const role = data.user?.user_metadata?.role || 'user';
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userType', role);
            localStorage.setItem('userName', data.user?.user_metadata?.name || 'مستخدم');
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userEmail', data.user.email);
            updateNavbarBasedOnLoginStatus();
            return { success: true, user: data.user, role: role };
        }
        return { success: false, error: 'لم يتم استلام جلسة' };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

window.signUpUser = async function(email, password, role, name, phone, extraData = {}) {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase غير مهيأ' };
    try {
        const metadata = { name, phone, role: role || 'user', status: (role === 'owner') ? 'pending' : 'approved', ...extraData };
        const { data: authData, error: authError } = await client.auth.signUp({
            email, password,
            options: { data: metadata }
        });
        if (authError) return { success: false, error: authError.message };
        if (!authData.user) return { success: false, error: 'لم يتم إنشاء المستخدم' };
        try {
            await client.from('users').insert([{
                id: authData.user.id,
                email, name, phone,
                role: role || 'user',
                status: (role === 'owner') ? 'pending' : 'approved',
                national_id: extraData.national_id || null,
                birth_date: extraData.birth_date || null,
                driver_license: extraData.driver_license || null,
                gender: extraData.gender || null,
                created_at: new Date().toISOString()
            }]);
        } catch (insertErr) {
            console.warn('فشل إدراج بيانات المستخدم في جدول users:', insertErr);
        }
        if (authData.session) {
            localStorage.setItem('supabase_token', authData.session.access_token);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userType', role || 'user');
            localStorage.setItem('userName', name);
            localStorage.setItem('userId', authData.user.id);
            localStorage.setItem('userEmail', email);
            updateNavbarBasedOnLoginStatus();
        }
        return { success: true, user: authData.user };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

// -------------------------------------
// دوال الموقع (جلب وتحديث)
// -------------------------------------

async function getCarLocation(carId) {
    const client = getSupabaseClient();
    if (!client || !carId) return null;
    try {
        const { data, error } = await client
            .from('cars')
            .select('latitude, longitude, location_address, geofence_radius, location_updated_at')
            .eq('id', carId)
            .single();
        if (error) return null;
        return data;
    } catch (err) {
        return null;
    }
}

async function updateCarLocation(carId, lat, lng, address, radius = 500) {
    const user = getCurrentUser();
    if (!user) { alert('الرجاء تسجيل الدخول'); return null; }
    const client = getSupabaseClient();
    if (!client) return null;
    try {
        const { data, error } = await client
            .from('cars')
            .update({ latitude: lat, longitude: lng, location_address: address, geofence_radius: radius, location_updated_at: new Date().toISOString() })
            .eq('id', carId)
            .select()
            .single();
        if (error) return null;
        await client.from('car_location_history').insert([{ car_id: carId, latitude: lat, longitude: lng, address: address, updated_by: user.id }]);
        return data;
    } catch (err) {
        return null;
    }
}

// -------------------------------------
// دوال عرض السيارات (شبكة البطاقات)
// -------------------------------------

function renderCarsGrid(cars, containerId = 'cars-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!cars || cars.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-car"></i><p>لا توجد سيارات متاحة حالياً</p></div>';
        return;
    }
    container.innerHTML = cars.map(car => {
        const imgSrc = car.images && car.images.length > 0 ? car.images[0] : 'https://via.placeholder.com/300x200?text=سيارة';
        return `
        <div class="car-card" data-car-id="${car.id}">
            <div class="car-img-box">
                <img src="${imgSrc}" alt="${car.brand} ${car.model}" loading="lazy">
                <span class="car-badge ${car.status === 'active' ? 'available' : 'pending'}">${car.status === 'active' ? 'متاحة' : 'قيد المراجعة'}</span>
            </div>
            <div class="car-info">
                <h3 class="car-title">${car.brand} ${car.model}</h3>
                <div class="car-year-city">${car.year} | ${car.city}</div>
                <div class="car-specs">
                    <span class="spec"><i class="fas fa-map-pin"></i> ${car.latitude && car.longitude ? 'موقع محدد' : 'موقع غير محدد'}</span>
                </div>
                <div class="car-price-box">
                    <div class="car-price">${car.daily_price} <small>ر.س/يوم</small></div>
                    ${car.status === 'active' ? `<button class="btn-book" onclick="openBookingModalFromCarId('${car.id}')">حجز الآن</button>` : `<button class="btn-book" disabled>غير متاحة</button>`}
                </div>
            </div>
        </div>`;
    }).join('');
}

// -------------------------------------
// دوال النافذة المنبثقة للحجز (Modal) وتأكيد الحجز
// -------------------------------------

async function openBookingModalFromCarId(carId) {
    const user = getCurrentUser();
    if (!user) { alert('الرجاء تسجيل الدخول أولاً'); window.location.href = 'landing.html'; return; }
    const client = getSupabaseClient();
    if (!client) { alert('خطأ في الاتصال بقاعدة البيانات'); return; }
    try {
        const { data: car, error } = await client.from('cars').select('*').eq('id', carId).single();
        if (error || !car) { alert('تعذر العثور على بيانات السيارة'); return; }
        window.currentCarData = {
            id: car.id,
            name: `${car.brand} ${car.model}`,
            image: car.images && car.images.length > 0 ? car.images[0] : 'https://via.placeholder.com/300x200?text=سيارة',
            dailyPrice: car.daily_price || 0
        };
        openBookingModal(window.currentCarData);
    } catch (err) {
        console.error('خطأ في فتح نافذة الحجز:', err);
        alert('حدث خطأ، الرجاء المحاولة مرة أخرى');
    }
}

function openBookingModal(carData) {
    const modal = document.getElementById('booking-modal');
    if (!modal) {
        alert('نظام الحجز غير جاهز');
        return;
    }
    document.getElementById('modal-car-img').src = carData.image;
    document.getElementById('modal-car-name').textContent = carData.name;
    document.getElementById('modal-car-price').textContent = `${carData.dailyPrice} ر.س / يوم`;
    document.getElementById('summary-daily-price').textContent = `${carData.dailyPrice} ر.س`;
    document.getElementById('summary-days').textContent = '-- يوم';
    document.getElementById('summary-total').textContent = '0 ر.س';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pickup-date').setAttribute('min', today);
    document.getElementById('return-date').setAttribute('min', today);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('pickup-date').value = tomorrow.toISOString().split('T')[0];
    const dayAfter = new Date(tomorrow); dayAfter.setDate(dayAfter.getDate() + 1);
    document.getElementById('return-date').value = dayAfter.toISOString().split('T')[0];
    updateBookingSummary();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
}

function updateBookingSummary() {
    const pickupDate = document.getElementById('pickup-date').value;
    const returnDate = document.getElementById('return-date').value;
    if (!pickupDate || !returnDate) {
        document.getElementById('summary-days').textContent = '-- يوم';
        document.getElementById('summary-total').textContent = '0 ر.س';
        return;
    }
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    if (returnD <= pickup) {
        document.getElementById('summary-days').textContent = 'تاريخ غير صالح';
        document.getElementById('summary-total').textContent = '0 ر.س';
        return;
    }
    const diffDays = Math.ceil(Math.abs(returnD - pickup) / (1000 * 60 * 60 * 24));
    document.getElementById('summary-days').textContent = `${diffDays} يوم`;
    if (window.currentCarData && window.currentCarData.dailyPrice) {
        document.getElementById('summary-total').textContent = `${window.currentCarData.dailyPrice * diffDays} ر.س`;
    }
}

window.confirmBooking = async function() {
    if (!window.currentCarData) { alert('❌ لم يتم تحديد السيارة'); return; }
    const user = getCurrentUser();
    if (!user) { alert('❌ يجب تسجيل الدخول أولاً'); window.location.href = 'landing.html'; return; }
    const pickupDate = document.getElementById('pickup-date').value;
    const returnDate = document.getElementById('return-date').value;
    if (!pickupDate || !returnDate) { alert('⚠️ الرجاء اختيار تاريخي الاستلام والتسليم.'); return; }
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    if (returnD <= pickup) { alert('⚠️ تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام.'); return; }
    const diffDays = Math.ceil(Math.abs(returnD - pickup) / (1000 * 60 * 60 * 24));
    const totalPrice = window.currentCarData.dailyPrice * diffDays;

    const bookingPayload = {
        car_id: window.currentCarData.id,
        renter_id: user.id,
        start_date: pickupDate,
        end_date: returnDate,
        total_price: totalPrice,
        status: 'pending_owner_approval'
    };

    const confirmBtn = document.getElementById('btn-confirm-booking');
    const originalText = confirmBtn?.innerHTML || 'تأكيد الحجز';
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحجز...'; }

    try {
        const booking = await window.createBooking(bookingPayload);
        alert(`✅ تم إنشاء الحجز بنجاح!\nالسيارة: ${window.currentCarData.name}\nالمدة: ${diffDays} يوم\nالإجمالي: ${totalPrice} ر.س\nفي انتظار موافقة المالك.`);
        localStorage.setItem('current_booking_id', booking.id);
        closeBookingModal();
        window.location.href = 'dashboard-renter.html';
    } catch (err) {
        alert(`❌ حدث خطأ أثناء الحجز: ${err.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.innerHTML = originalText; }
    }
};

window.createBooking = async function(bookingData) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase غير مهيأ');
    const { data, error } = await client.from('bookings').insert([bookingData]).select().single();
    if (error) throw new Error(error.message);
    return data;
};

// -------------------------------------
// تهيئة الصفحة عند التحميل
// -------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    // تحديث شريط التنقل
    updateNavbarBasedOnLoginStatus();

    // Bottom Navbar active state
    const bottomNavItems = document.querySelectorAll('.mobile-bottom-navbar .nav-item');
    bottomNavItems.forEach(item => {
        item.classList.remove('active');
        const currentPath = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
        const itemHref = item.getAttribute('href');
        if (itemHref === currentPath) item.classList.add('active');
        if (itemHref === 'index.html' && (currentPath === '' || currentPath === 'index.html')) item.classList.add('active');
    });

    // Hamburger menu
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileSidebar = document.getElementById('mobileSidebar');

    if (hamburgerBtn && mobileSidebar && sidebarOverlay) {
        const openSidebar = () => {
            mobileSidebar.classList.add('open');
            sidebarOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        };
        const closeSidebar = () => {
            mobileSidebar.classList.remove('open');
            sidebarOverlay.classList.remove('open');
            document.body.style.overflow = '';
        };
        hamburgerBtn.addEventListener('click', openSidebar);
        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Theme toggle sync
    const themeToggle = document.getElementById('theme-toggle-desktop');
    if (themeToggle) {
        const applyTheme = (theme) => {
            document.body.classList.toggle('dark-mode', theme === 'dark');
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            const icon = themeToggle.querySelector('i');
            const span = themeToggle.querySelector('span');
            if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            if (span) span.textContent = theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي';
        };
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    // Booking modal events
    const pickupDate = document.getElementById('pickup-date');
    const returnDate = document.getElementById('return-date');
    if (pickupDate) pickupDate.addEventListener('change', updateBookingSummary);
    if (returnDate) returnDate.addEventListener('change', updateBookingSummary);

    // Close modal on overlay click
    const modal = document.getElementById('booking-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeBookingModal();
        });
    }

    console.log('✅ script.js جاهز');
});

// تصدير الدوال للنطاق العام
window.getSupabaseClient = getSupabaseClient;
window.getCurrentUser = getCurrentUser;
window.getUserRole = getUserRole;
window.updateNavbarBasedOnLoginStatus = updateNavbarBasedOnLoginStatus;
window.logoutUser = logoutUser;
window.getCarLocation = getCarLocation;
window.updateCarLocation = updateCarLocation;
window.renderCarsGrid = renderCarsGrid;
window.openBookingModalFromCarId = openBookingModalFromCarId;
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.updateBookingSummary = updateBookingSummary;
