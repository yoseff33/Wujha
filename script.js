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
// نفترض أن window.supabaseClient مُهيأ من supabase-config.js
// إذا لم يكن موجودًا، نُظهر خطأ ولن نستخدم محاكاة
function getSupabaseClient() {
    if (typeof window.supabaseClient === 'undefined' || !window.supabaseClient) {
        console.error('❌ Supabase client غير مُهيأ. تأكد من تحميل supabase-config.js بشكل صحيح.');
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
            }
        });

        if (mobileBottomNavUserButton) {
            mobileBottomNavUserButton.style.display = 'flex';
            mobileBottomNavUserButton.href = userType === 'owner' ? 'dashboard-owner.html' : 'dashboard-renter.html';
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

function loginUser(type) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userType', type);
    localStorage.setItem('userName', type === 'owner' ? 'نواف السبيعي' : 'سارة الحربي'); 
    updateNavbarBasedOnLoginStatus();
    if (type === 'owner') {
        window.location.href = 'dashboard-owner.html';
    } else if (type === 'renter') {
        window.location.href = 'dashboard-renter.html';
    }
}

function logoutUser() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName'); 
    updateNavbarBasedOnLoginStatus();
    window.location.href = 'index.html';
}

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
        if (error) {
            console.error('فشل جلب موقع السيارة:', error);
            return null;
        }
        return data;
    } catch (err) {
        console.error('استثناء في جلب موقع السيارة:', err);
        return null;
    }
}

async function updateCarLocation(carId, lat, lng, address, radius = 500) {
    const user = getCurrentUser();
    if (!user) {
        alert('الرجاء تسجيل الدخول');
        return null;
    }
    const client = getSupabaseClient();
    if (!client) return null;
    try {
        const { data, error } = await client
            .from('cars')
            .update({
                latitude: lat,
                longitude: lng,
                location_address: address,
                geofence_radius: radius,
                location_updated_at: new Date().toISOString()
            })
            .eq('id', carId)
            .select()
            .single();
        if (error) {
            console.error('فشل تحديث موقع السيارة:', error);
            return null;
        }
        await client
            .from('car_location_history')
            .insert([{
                car_id: carId,
                latitude: lat,
                longitude: lng,
                address: address,
                updated_by: user.id
            }]);
        return data;
    } catch (err) {
        console.error('استثناء في تحديث موقع السيارة:', err);
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
        container.innerHTML = '<p style="text-align:center; padding:40px; color:#888;">لا توجد سيارات متاحة حالياً</p>';
        return;
    }

    function sanitize(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    container.innerHTML = cars.map(car => {
        const hasLocation = car.latitude && car.longitude;
        const locationStatus = hasLocation ? '📍 موقع محدد' : '❌ لم يحدد الموقع';
        const locationText = hasLocation ? `نطاق تقريبي: ${car.geofence_radius || 500} متر` : '';
        const imgSrc = car.images && car.images.length > 0 ? car.images[0] : 'https://via.placeholder.com/300x200?text=سيارة';

        return `
        <div class="car-card" data-car-id="${sanitize(car.id)}">
            <div class="car-img-box">
                <img src="${sanitize(imgSrc)}" alt="${sanitize(car.brand)} ${sanitize(car.model)}" loading="lazy">
                <span class="badge ${car.status === 'active' ? 'badge-success' : 'badge-warning'}">${car.status === 'active' ? 'متاحة' : 'قيد المراجعة'}</span>
            </div>
            <div class="car-info">
                <h3 class="car-title">${sanitize(car.brand)} ${sanitize(car.model)}</h3>
                <div class="car-year">${sanitize(car.year)} | ${sanitize(car.city)}</div>
                <div class="car-specs">
                    <span class="spec"><i class="fas fa-map-pin"></i> ${locationStatus}</span>
                    ${hasLocation ? `<span class="spec"><i class="fas fa-circle" style="color:#c5a065;"></i> ${locationText}</span>` : ''}
                </div>
                <div class="price-box">
                    <div class="price">${sanitize(car.daily_price)} <small>ر.س/يوم</small></div>
                    ${car.status === 'active' ? 
                        `<button class="btn-book" onclick="openBookingModalFromCarId('${sanitize(car.id)}')">حجز الآن</button>` : 
                        `<button class="btn-book" style="background:#95a5a6;cursor:not-allowed;" disabled>غير متاحة</button>`}
                </div>
                ${hasLocation ? `<div style="margin-top:10px;"><button class="btn btn-sm btn-outline" onclick="showApproximateLocation('${sanitize(car.id)}')"><i class="fas fa-eye"></i> عرض النطاق التقريبي</button></div>` : ''}
            </div>
        </div>
        `;
    }).join('');

    attachBookingButtonsToCards();
}

function attachBookingButtonsToCards() {
    document.querySelectorAll('.car-card .btn-book').forEach(btn => {
        if (!btn.hasAttribute('data-modal-listener')) {
            btn.setAttribute('data-modal-listener', 'true');
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const card = this.closest('.car-card');
                if (card) {
                    const carId = card.dataset.carId;
                    if (carId) {
                        openBookingModalFromCarId(carId);
                    }
                }
            });
        }
    });
}

// -------------------------------------
// دوال النافذة المنبثقة للحجز (Modal) وتأكيد الحجز
// -------------------------------------

/**
 * فتح نافذة الحجز مع بيانات السيارة المختارة
 */
async function openBookingModalFromCarId(carId) {
    const user = getCurrentUser();
    if (!user) {
        alert('الرجاء تسجيل الدخول أولاً');
        window.location.href = 'landing.html';
        return;
    }

    const client = getSupabaseClient();
    if (!client) {
        alert('خطأ في الاتصال بقاعدة البيانات');
        return;
    }

    try {
        const { data: car, error } = await client
            .from('cars')
            .select('*')
            .eq('id', carId)
            .single();

        if (error || !car) {
            alert('تعذر العثور على بيانات السيارة');
            return;
        }

        const carData = {
            id: car.id,
            name: `${car.brand} ${car.model}`,
            image: car.images && car.images.length > 0 ? car.images[0] : 'https://via.placeholder.com/300x200?text=سيارة',
            dailyPrice: car.daily_price || 0
        };

        // تخزين البيانات في النطاق العام لتستخدمها دالة التأكيد
        window.currentCarData = carData;

        if (typeof window.openBookingModal === 'function') {
            window.openBookingModal(carData);
        } else {
            alert('نظام الحجز غير جاهز، يرجى تحديث الصفحة.');
        }
    } catch (err) {
        console.error('خطأ في فتح نافذة الحجز:', err);
        alert('حدث خطأ، الرجاء المحاولة مرة أخرى');
    }
}

/**
 * دالة إنشاء الحجز (حقيقية) مع تحسين معالجة الأخطاء
 */
window.createBooking = async function(bookingData) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase غير مهيأ، تعذر الاتصال بقاعدة البيانات.');
    }

    try {
        const { data, error } = await client
            .from('bookings')
            .insert([bookingData])
            .select()
            .single();

        if (error) {
            console.error('خطأ من Supabase أثناء إنشاء الحجز:', error);
            throw new Error(error.message || 'فشل إنشاء الحجز في قاعدة البيانات.');
        }
        return data;
    } catch (err) {
        console.error('استثناء في createBooking:', err);
        throw err;
    }
};

/**
 * دالة تأكيد الحجز – يتم استدعاؤها من زر "تأكيد الحجز" في المودال
 */
window.confirmBooking = async function() {
    // 1. التحقق من وجود بيانات السيارة
    if (!window.currentCarData || !window.currentCarData.id) {
        alert('❌ حدث خطأ: لم يتم تحديد السيارة المطلوبة.');
        return;
    }

    // 2. التحقق من تسجيل الدخول
    const user = getCurrentUser();
    if (!user) {
        alert('❌ يجب تسجيل الدخول أولاً لإتمام الحجز.');
        window.location.href = 'landing.html';
        return;
    }

    // 3. قراءة تواريخ الحجز من المودال
    const pickupDate = document.getElementById('pickup-date')?.value;
    const returnDate = document.getElementById('return-date')?.value;
    const pickupHour = document.getElementById('pickup-hour')?.value || '10';
    const pickupMinute = document.getElementById('pickup-minute')?.value || '30';
    const returnHour = document.getElementById('return-hour')?.value || '18';
    const returnMinute = document.getElementById('return-minute')?.value || '30';

    if (!pickupDate || !returnDate) {
        alert('⚠️ الرجاء اختيار تاريخي الاستلام والتسليم.');
        return;
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    if (returnD <= pickup) {
        alert('⚠️ تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام.');
        return;
    }

    // 4. حساب عدد الأيام والتكلفة الإجمالية
    const diffTime = Math.abs(returnD - pickup);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = window.currentCarData.dailyPrice * days;

    // 5. بناء كائن الحجز
    const startDateTime = `${pickupDate}T${pickupHour.padStart(2, '0')}:${pickupMinute}:00`;
    const endDateTime = `${returnDate}T${returnHour.padStart(2, '0')}:${returnMinute}:00`;

    const bookingPayload = {
        car_id: window.currentCarData.id,
        renter_id: user.id,
        start_date: startDateTime,
        end_date: endDateTime,
        total_price: totalPrice,
        status: 'pending' // أو 'confirmed' حسب منطق التطبيق
    };

    // 6. عرض رسالة انتظار أثناء الإنشاء
    const confirmBtn = document.getElementById('btn-confirm-booking');
    const originalText = confirmBtn?.innerHTML || 'تأكيد الحجز';
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحجز...';
    }

    try {
        const booking = await window.createBooking(bookingPayload);

        // 7. نجاح الحجز
        alert(`✅ تم إنشاء الحجز بنجاح!\n\nالسيارة: ${window.currentCarData.name}\nالمدة: ${days} يوم\nالإجمالي: ${totalPrice} ر.س\n\nفي انتظار موافقة المالك.`);
        localStorage.setItem('current_booking_id', booking.id);

        // 8. إغلاق المودال والانتقال إلى لوحة المستأجر
        if (typeof window.closeBookingModal === 'function') {
            window.closeBookingModal();
        } else {
            // إغلاق المودال يدوياً
            const modal = document.getElementById('booking-modal');
            if (modal) modal.classList.remove('open');
            document.body.style.overflow = '';
        }
        window.location.href = 'dashboard-renter.html';

    } catch (err) {
        console.error('❌ فشل الحجز:', err);
        alert(`❌ حدث خطأ أثناء الحجز: ${err.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
        // إعادة الزر إلى حالته الطبيعية
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalText;
        }
    }
};

// دالة bookCar تحوّل إلى النافذة الجديدة (اختصار)
window.bookCar = async function(carId) {
    openBookingModalFromCarId(carId);
};

// -------------------------------------
// دوال الخريطة (واجهة روشن) - بيانات حقيقية من قاعدة البيانات
// -------------------------------------

let map;
let carMarkersLayer;
let currentRouteLine = null;
const targetLocation = [24.8375090, 46.7297325];

// سنقوم بجلب السيارات الحقيقية في initMap
async function initMap() {
    const mapElement = document.getElementById('mapid');
    if (!mapElement || typeof L === 'undefined') return;

    if (map) { map.remove(); }

    map = L.map('mapid').setView(targetLocation, 17);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 20
    }).addTo(map);

    carMarkersLayer = L.layerGroup().addTo(map);

    // جلب السيارات الحقيقية من Supabase
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data: cars, error } = await client
                .from('cars')
                .select('*')
                .eq('status', 'active');
            if (!error && cars) {
                renderCarsOnMap(cars);
            } else {
                console.warn('لم يتم جلب سيارات للخريطة:', error);
            }
        } catch (err) {
            console.error('خطأ في جلب سيارات الخريطة:', err);
        }
    }

    setTimeout(() => { map.invalidateSize(); }, 500);
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
    currentRouteLine = L.polyline([targetLocation, [destLat, destLng]], {
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
}

window.filterMap = function(type, element) {
    currentType = type;
    document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    // إعادة عرض السيارات المفلترة من البيانات الأصلية
    if (window.currentMapCars) {
        renderCarsOnMap(window.currentMapCars);
    }
}

// تخزين السيارات المحملة للخريطة
window.currentMapCars = [];

function renderCarsOnMap(cars) {
    if (!map || !carMarkersLayer) return;
    carMarkersLayer.clearLayers();
    if (currentRouteLine) map.removeLayer(currentRouteLine);

    window.currentMapCars = cars || [];

    const filtered = cars.filter(car => {
        const typeMatch = currentType === 'الكل' ? true : car.type === currentType;
        const priceMatch = parseInt(car.daily_price) <= maxPrice;
        return typeMatch && priceMatch;
    });

    filtered.forEach(car => {
        if (!car.latitude || !car.longitude) return;

        const isPremium = car.rating >= 5.0;
        const extraClass = isPremium ? 'premium-marker' : '';
        const marker = L.marker([car.latitude, car.longitude], {
            icon: createPriceIcon(car.daily_price, car.type || 'سيدان', extraClass)
        }).addTo(carMarkersLayer);

        marker.on('click', function() {
            drawRouteToCar(car.latitude, car.longitude);
        });

        const scores = car.scores || { mech: 8, acc: 8, clean: 8 };
        const popupContent = `
            <div class="popup-car-card">
                <img src="${car.images?.[0] || 'https://via.placeholder.com/150'}" class="popup-img">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <h4 style="margin:0; color:var(--primary);">${car.brand} ${car.model}</h4>
                    <span class="rating-badge"><i class="fas fa-star"></i> ${car.rating || 4.5}</span>
                </div>
                <div class="rating-bars-container">
                    <div class="rating-row"><span class="rating-label"><i class="fas fa-wrench"></i> الميكانيكا</span>${getProgressBar(scores.mech)}</div>
                    <div class="rating-row"><span class="rating-label"><i class="fas fa-shield-alt"></i> الحوادث</span>${getProgressBar(scores.acc)}</div>
                    <div class="rating-row"><span class="rating-label"><i class="fas fa-sparkles"></i> النظافة</span>${getProgressBar(scores.clean)}</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <div style="font-weight:bold; font-size:1.1rem;">${car.daily_price} <span style="font-size:0.8rem; font-weight:normal;">ريال/يوم</span></div>
                    <button class="btn btn-primary btn-sm" onclick="window.openBookingModalFromCarId('${car.id}')">حجز</button>
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
}

// -------------------------------------
// دوال أخرى (ولاء، شهادات، اختبار...)
// -------------------------------------

function updateLoyaltyCard(completedRentals) {
    const totalRentalsNeeded = 8;
    const progressPercentage = (completedRentals / totalRentalsNeeded) * 100;

    const progressBarFill = document.querySelector('.loyalty-line-fill');
    const loyaltyDots = document.querySelectorAll('.loyalty-dot');
    const currentRentalsText = document.getElementById('current-rentals-count');
    const remainingRentalsText = document.getElementById('remaining-rentals-count');

    if (progressBarFill) progressBarFill.style.width = `${progressPercentage}%`;

    loyaltyDots.forEach((dot, index) => {
        if (index < completedRentals) dot.classList.add('completed');
        else dot.classList.remove('completed');
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

const RECENTLY_VIEWED_KEY = 'recentlyViewedCars';
const MAX_RECENTLY_VIEWED = 5;

function addCarToRecentlyViewed(carId, carImg, carTitle) {
    let recentlyViewed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || [];
    recentlyViewed = recentlyViewed.filter(car => car.id !== carId);
    recentlyViewed.unshift({ id: carId, img: carImg, title: carTitle });
    if (recentlyViewed.length > MAX_RECENTLY_VIEWED) recentlyViewed = recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
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

function setupQuiz() {
    const quizForm = document.getElementById('car-quiz-form');
    const quizResults = document.getElementById('quiz-results');
    if (!quizForm || !quizResults) return;

    quizForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(quizForm);
        const answers = {};
        for (let [key, value] of formData.entries()) answers[key] = value;

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
            <a href="cars.html" class="btn btn-primary" style="margin-top:20px;">
                <i class="fas fa-search"></i> استكشف السيارات
            </a>
        `;
        quizResults.style.display = 'block';
    });
}

// -------------------------------------
// دوال المصادقة الحقيقية مع Supabase
// -------------------------------------

window.signInUser = async function(email, password) {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase غير مهيأ' };
    try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            return { success: false, error: error.message };
        }
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
        console.error('استثناء في تسجيل الدخول:', err);
        return { success: false, error: err.message };
    }
};

window.signUpUser = async function(email, password, role, name, phone, extraData = {}) {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase غير مهيأ' };

    try {
        const metadata = {
            name, phone, role: role || 'user',
            status: (role === 'owner') ? 'pending' : 'approved',
            ...extraData
        };

        const { data: authData, error: authError } = await client.auth.signUp({
            email, password,
            options: { data: metadata }
        });

        if (authError) {
            console.error('خطأ في إنشاء الحساب:', authError);
            return { success: false, error: authError.message };
        }
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
        console.error('استثناء في إنشاء الحساب:', err);
        return { success: false, error: err.message };
    }
};

// -------------------------------------
// تهيئة الصفحة عند التحميل
// -------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
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

    updateLoyaltyCard(3);
    renderRecentlyViewedCars();
    if (document.querySelector('.testimonial-slider')) {
        showSlides();
        slideInterval = setInterval(showSlides, 5000);
    }
    setupQuiz();

    if (document.getElementById('mapid')) {
        setTimeout(() => {
            if (typeof L !== 'undefined') initMap();
            else console.error("Leaflet library not loaded");
        }, 100);
    }

    // تحميل السيارات لصفحة cars.html
    const carsGrid = document.getElementById('cars-grid');
    if (carsGrid) {
        (async () => {
            const client = getSupabaseClient();
            if (!client) {
                carsGrid.innerHTML = '<p style="color:red; text-align:center;">خطأ في الاتصال بقاعدة البيانات</p>';
                return;
            }
            try {
                const { data: cars, error } = await client
                    .from('cars')
                    .select('*')
                    .eq('status', 'active');
                if (error) throw error;
                renderCarsGrid(cars || [], 'cars-grid');
            } catch (err) {
                console.error('فشل تحميل السيارات:', err);
                carsGrid.innerHTML = '<p style="color:red; text-align:center;">فشل تحميل السيارات</p>';
            }
        })();
    }
});

// Sidebar active state
document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', function(e) {
        const currentActive = document.querySelector('.sidebar-menu a.active');
        if (currentActive) currentActive.classList.remove('active');
        this.classList.add('active');
    });
});

// تتبع السيارات المعروضة مؤخراً
document.addEventListener('click', (e) => {
    if (e.target.closest('.car-card')) {
        const card = e.target.closest('.car-card');
        const img = card.querySelector('.car-img img')?.src;
        const title = card.querySelector('.car-title')?.textContent;
        const carId = title ? title.replace(/\s/g, '-') : 'unknown';
        if (img) addCarToRecentlyViewed(carId, img, title);
    }
});

// -------------------------------------
// دوال إضافية للتصدير
// -------------------------------------

async function fetchCars(filter = {}) {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
        let query = client.from('cars').select('*');
        if (filter.status) query = query.eq('status', filter.status);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('فشل جلب السيارات:', err);
        return [];
    }
}

function showApproximateLocation(carId) {
    window.open(`car-location-preview.html?carId=${carId}`, '_blank', 'width=900,height=650');
}

// تصدير الدوال إلى النطاق العام
window.renderCarsGrid = renderCarsGrid;
window.openBookingModalFromCarId = openBookingModalFromCarId;
window.showApproximateLocation = showApproximateLocation;
window.getCarLocation = getCarLocation;
window.updateCarLocation = updateCarLocation;
window.fetchCars = fetchCars;
window.getCurrentUser = getCurrentUser;
window.logoutUser = logoutUser;
window.updateNavbarBasedOnLoginStatus = updateNavbarBasedOnLoginStatus;
window.attachBookingButtonsToCards = attachBookingButtonsToCards;
// تم تصدير createBooking و confirmBooking أعلاه مباشرة

console.log('✅ script.js حقيقي ومُحدث مع Supabase');
