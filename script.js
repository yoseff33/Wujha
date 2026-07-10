// ============================================================
//  script.js - الملف الأساسي لمنصة وُجْهَة (معدل)
//  يحتوي على جميع الدوال الأساسية، بما فيها نظام مواقع السيارات
// ============================================================

// -------------------------------------
// دوال مساعدة عامة
// -------------------------------------

// الحصول على المستخدم الحالي من localStorage (محاكاة)
function getCurrentUser() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) return null;
    const userType = localStorage.getItem('userType');
    const userName = localStorage.getItem('userName') || 'مستخدم';
    return {
        id: 'user-' + Date.now(), // محاكاة معرف فريد
        email: 'user@example.com',
        user_metadata: { name: userName },
        userType: userType
    };
}

function getUserRole() {
    return localStorage.getItem('userType') || null;
}

// -------------------------------------
// دوال Supabase (افتراضية - قد تستبدل بالاتصال الحقيقي)
// -------------------------------------
// نستخدم window.supabaseClient الذي تم تعريفه في supabase-config.js
// إذا لم يكن موجوداً، نستخدم نسخة وهمية للاختبار
if (typeof window.supabaseClient === 'undefined') {
    console.warn('supabaseClient غير معرف، سيتم استخدام بيانات وهمية');
    window.supabaseClient = {
        from: (table) => ({
            select: (cols) => ({
                eq: (field, value) => ({
                    single: async () => {
                        // بيانات وهمية للاختبار
                        if (table === 'cars') {
                            const mockCar = {
                                id: value,
                                brand: 'تويوتا',
                                model: 'كامري',
                                year: 2024,
                                city: 'الرياض',
                                daily_price: 120,
                                status: 'active',
                                images: ['https://via.placeholder.com/300x200'],
                                latitude: 24.8375,
                                longitude: 46.7297,
                                location_address: 'واجهة روشن، الرياض',
                                geofence_radius: 500,
                                location_updated_at: new Date().toISOString()
                            };
                            return { data: mockCar, error: null };
                        }
                        if (table === 'bookings') {
                            return { data: [], error: null };
                        }
                        return { data: null, error: null };
                    },
                    in: (field, values) => ({
                        order: (col, opts) => ({
                            then: (cb) => cb({ data: [], error: null })
                        })
                    }),
                    order: (col, opts) => ({
                        then: (cb) => cb({ data: [], error: null })
                    })
                }),
                insert: (data) => ({
                    then: (cb) => cb({ data: data, error: null })
                }),
                update: (data) => ({
                    eq: (field, value) => ({
                        select: (cols) => ({
                            single: async () => ({ data: { ...data, id: value }, error: null })
                        }),
                        then: (cb) => cb({ data: { ...data, id: value }, error: null })
                    })
                })
            }),
            insert: (data) => ({
                then: (cb) => cb({ data: data, error: null })
            })
        })
    };
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

/**
 * جلب موقع السيارة من قاعدة البيانات
 * @param {string} carId - معرف السيارة
 * @returns {Promise<Object|null>} - كائن يحتوي على latitude, longitude, location_address, geofence_radius, location_updated_at
 */
async function getCarLocation(carId) {
    if (!carId) return null;
    try {
        const { data, error } = await window.supabaseClient
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

/**
 * تحديث موقع السيارة في قاعدة البيانات (للمالك)
 * @param {string} carId - معرف السيارة
 * @param {number} lat - خط العرض
 * @param {number} lng - خط الطول
 * @param {string} address - عنوان الموقع
 * @param {number} radius - نصف قطر النطاق بالمتر
 * @returns {Promise<Object|null>} - بيانات السيارة المحدثة
 */
async function updateCarLocation(carId, lat, lng, address, radius = 500) {
    const user = getCurrentUser();
    if (!user) {
        alert('الرجاء تسجيل الدخول');
        return null;
    }
    try {
        const { data, error } = await window.supabaseClient
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
        // تسجيل السجل في history
        await window.supabaseClient
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

/**
 * عرض السيارات في شبكة (مع معلومات الموقع)
 * @param {Array} cars - قائمة السيارات
 * @param {string} containerId - معرف العنصر الذي سيتم العرض فيه (افتراضي 'cars-grid')
 */
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
                    ${car.status === 'active' ? `<button class="btn-book" onclick="bookCar('${sanitize(car.id)}')">حجز الآن</button>` : `<button class="btn-book" style="background:#95a5a6;cursor:not-allowed;" disabled>غير متاحة</button>`}
                </div>
                ${hasLocation ? `<div style="margin-top:10px;"><button class="btn btn-sm btn-outline" onclick="showApproximateLocation('${sanitize(car.id)}')"><i class="fas fa-eye"></i> عرض النطاق التقريبي</button></div>` : ''}
            </div>
        </div>
        `;
    }).join('');
}

/**
 * عرض النطاق التقريبي للسيارة في نافذة جديدة
 * @param {string} carId - معرف السيارة
 */
function showApproximateLocation(carId) {
    window.open(`car-location-preview.html?carId=${carId}`, '_blank', 'width=900,height=650');
}

// -------------------------------------
// دوال الحجز (استدعاء createBooking من script.js الأساسي إن وجد)
// -------------------------------------

// إذا كانت createBooking غير معرفة، نضيف دالة احتياطية
if (typeof createBooking === 'undefined') {
    window.createBooking = async function(bookingData) {
        console.log('محاكاة إنشاء حجز:', bookingData);
        // محاكاة نجاح
        return { id: 'mock-booking-id', ...bookingData };
    };
}

window.bookCar = async function(carId) {
    const user = getCurrentUser();
    if (!user) {
        alert('الرجاء تسجيل الدخول أولاً');
        window.location.href = 'landing.html';
        return;
    }

    const startDate = prompt('أدخل تاريخ البداية (YYYY-MM-DD HH:MM:SS)');
    const endDate = prompt('أدخل تاريخ النهاية (YYYY-MM-DD HH:MM:SS)');
    if (!startDate || !endDate) return;

    // جلب سعر السيارة اليومي (محاكاة)
    const car = await getCarInfo(carId);
    if (!car) {
        alert('حدث خطأ في جلب بيانات السيارة');
        return;
    }

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)));
    const total = days * car.daily_price;

    const booking = await createBooking({
        car_id: carId,
        start_date: startDate,
        end_date: endDate,
        total_price: total
    });

    if (booking) {
        alert('تم إنشاء الحجز بنجاح، في انتظار موافقة المالك');
        window.location.href = 'dashboard-renter.html';
    }
};

// دالة مساعدة لجلب معلومات السيارة (محاكاة)
async function getCarInfo(carId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('cars')
            .select('daily_price')
            .eq('id', carId)
            .single();
        if (error || !data) {
            return { daily_price: 100 }; // قيمة افتراضية
        }
        return data;
    } catch (e) {
        return { daily_price: 100 };
    }
}

// -------------------------------------
// دوال الخريطة (واجهة روشن) - موجودة سابقاً مع تعديلات طفيفة
// -------------------------------------

let map;
let carMarkersLayer;
let currentRouteLine = null;
const targetLocation = [24.8375090, 46.7297325];

// بيانات السيارات المحدثة (واجهة روشن)
const allCars = [
    { 
        id: 'r1', type: 'سيدان', model: 'تويوتا كامري 2024', price: '120', 
        rating: 4.9, reviews: 52, lat: 24.8375090, lng: 46.7297325, 
        scores: { mech: 10, acc: 10, clean: 9 },
        img: 'https://tse2.mm.bing.net/th/id/OIP.F3b-M0eckL0XjmywTpu8EgHaFj?rs=1&pid=ImgDetMain&o=7&rm=3' 
    },
    { 
        id: 'r2', type: 'دفع رباعي', model: 'تويوتا لاندكروزر', price: '450', 
        rating: 5.0, reviews: 18, lat: 24.8381000, lng: 46.7292000, 
        scores: { mech: 10, acc: 10, clean: 10 },
        img: 'https://www.autopediame.com/userfiles/images/%D9%84%D8%A7%D9%86%D8%AF%D9%83%D8%B1%D9%88%D8%B2%D8%B1/%D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7%20%D9%84%D8%A7%D9%86%D8%AF%D9%83%D8%B1%D9%88%D8%B2%D8%B1%201.jpg' 
    },
    { 
        id: 'r3', type: 'فاخرة', model: 'مرسيدس S500', price: '900', 
        rating: 4.8, reviews: 12, lat: 24.8369000, lng: 46.7301000, 
        scores: { mech: 10, acc: 9, clean: 10 }, 
        img: 'https://media.elbalad.news/2024/10/large/995/9/554.jpg' 
    },
    { 
        id: 'r4', type: 'سيدان', model: 'هونداي النترا', price: '85', 
        rating: 4.2, reviews: 89, lat: 24.8378000, lng: 46.7305000, 
        scores: { mech: 8, acc: 7, clean: 8 },
        img: 'https://static.sayidaty.net/styles/900_scale/public/2022-03/80578.jpeg.webp' 
    },
    { id: 'r5', type: 'سيدان', model: 'تويوتا كامري 2023', price: '115', rating: 4.7, reviews: 40, lat: 24.8372000, lng: 46.7289000, scores: { mech: 9, acc: 10, clean: 8 }, img: 'https://tse2.mm.bing.net/th/id/OIP.F3b-M0eckL0XjmywTpu8EgHaFj?rs=1&pid=ImgDetMain&o=7&rm=3' },
    { id: 'r6', type: 'دفع رباعي', model: 'شيفروليه تاهو', price: '380', rating: 4.9, reviews: 22, lat: 24.8365000, lng: 46.7295000, scores: { mech: 10, acc: 10, clean: 9 }, img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_xL-R8y8f_Q_g_h_j_k_l_m_n_o_p' },
    { id: 'r7', type: 'فاخرة', model: 'لوسيد آير', price: '700', rating: 5.0, reviews: 4, lat: 24.8385000, lng: 46.7298000, scores: { mech: 10, acc: 10, clean: 10 }, img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_xL-R8y8f_Q_g_h_j_k_l_m_n_o_p' }
];

function initMap() {
    if (document.getElementById('mapid') && typeof L !== 'undefined') {
        if(map) { map.remove(); }
        
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
    if(type === 'فاخرة') iconHtml = '<i class="fas fa-gem" style="color:#f1c40f"></i>';
    else if(type === 'دفع رباعي') iconHtml = '<i class="fas fa-truck-pickup" style="color:#e67e22"></i>';
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
    if(currentRouteLine) map.removeLayer(currentRouteLine);
    
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

// متغيرات الفلترة
let currentType = 'الكل';
let maxPrice = 1000;

window.updatePriceLabel = function(val) {
    maxPrice = parseInt(val);
    const label = document.getElementById('priceValue');
    if(label) label.innerText = val + ' ريال';
}

window.filterMap = function(type, element) {
    currentType = type;
    document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
    if(element) element.classList.add('active');
    renderCarsOnMap();
}

// دالة عرض السيارات على الخريطة (تستخدم allCars)
function renderCarsOnMap() {
    if(!map || !carMarkersLayer) return;
    
    carMarkersLayer.clearLayers();
    if(currentRouteLine) map.removeLayer(currentRouteLine);

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
                    <a href="cars.html?carId=${car.id}" class="btn btn-primary" style="padding:6px 15px; font-size:0.9rem;">حجز</a>
                </div>
            </div>
        `;
        marker.bindPopup(popupContent);
    });
}

window.simulateSmartLocate = function() {
    const btn = document.getElementById('smart-locate-btn');
    if(!btn) return;
    
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
// دوال الولاء، الشهادات، الاختبار، إلخ.
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
            <a href="cars.html" class="btn btn-primary" style="margin-top:20px;">
                <i class="fas fa-search"></i> استكشف السيارات
            </a>
        `;
        quizResults.style.display = 'block';
    });
}

// دوال المسؤولية الاجتماعية (إن وجدت)
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
// تهيئة الصفحة عند التحميل
// -------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    updateNavbarBasedOnLoginStatus();

    // Bottom Navbar Active State
    const bottomNavItems = document.querySelectorAll('.mobile-bottom-navbar .nav-item');
    bottomNavItems.forEach(item => {
        item.classList.remove('active');
        const currentPath = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
        const itemHref = item.getAttribute('href');
        if (itemHref === currentPath) item.classList.add('active');
        if (itemHref === 'index.html' && (currentPath === '' || currentPath === 'index.html')) item.classList.add('active');
    });

    // Body padding for mobile nav
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

    const userCompletedRentals = 3;
    updateLoyaltyCard(userCompletedRentals);
    renderRecentlyViewedCars();
    if (document.querySelector('.testimonial-slider')) {
        showSlides();
        slideInterval = setInterval(showSlides, 5000);
    }
    setupQuiz();

    // CSR Features
    if (document.getElementById('csr-fact-display')) displayRandomCsrFact(); 
    if (document.getElementById('pledge-form')) setupPledgeGenerator(); 
    if (document.getElementById('impact-stats-container')) renderImpactDashboard(); 

    // Map Initialization (إذا كانت الصفحة تحتوي على خريطة)
    if (document.getElementById('mapid')) {
        setTimeout(() => {
            if (typeof L !== 'undefined') {
                initMap();
            } else {
                console.error("Leaflet library not loaded");
            }
        }, 100);
    }

    // إذا كانت الصفحة هي cars.html، نقوم بجلب السيارات وعرضها باستخدام renderCarsGrid
    // (يتم استدعاؤها من كود خاص في cars.html، لكننا نضع هنا منطقاً تلقائياً)
    const carsGrid = document.getElementById('cars-grid');
    if (carsGrid) {
        // جلب السيارات من قاعدة البيانات (محاكاة أو حقيقية)
        (async () => {
            try {
                const { data: cars, error } = await window.supabaseClient
                    .from('cars')
                    .select('*')
                    .eq('status', 'active');
                if (error) throw error;
                renderCarsGrid(cars || [], 'cars-grid');
            } catch (err) {
                console.error('فشل تحميل السيارات:', err);
                renderCarsGrid([], 'cars-grid');
            }
        })();
    }
});

// Sidebar Active State
document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', function(e) {
        const currentActive = document.querySelector('.sidebar-menu a.active');
        if (currentActive) currentActive.classList.remove('active');
        this.classList.add('active');
    });
});

document.addEventListener('click', (e) => {
    if (e.target.closest('.car-card')) {
        const carCard = e.target.closest('.car-card');
        const carImg = carCard.querySelector('.car-img img').src;
        const carTitle = carCard.querySelector('.car-title').textContent;
        const carId = carTitle.replace(/\s/g, '-');
        addCarToRecentlyViewed(carId, carImg, carTitle);
    }
});

// ============================================================
//  دوال إضافية للتوافق مع الملفات الجديدة (car-location, إلخ)
// ============================================================

// دالة لجلب السيارات حسب الفلتر (تستخدم في cars.html)
async function fetchCars(filter = {}) {
    try {
        let query = window.supabaseClient.from('cars').select('*');
        if (filter.status) {
            query = query.eq('status', filter.status);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('فشل جلب السيارات:', err);
        return [];
    }
}

// دالة للحجز (تستخدم في cars.html)
window.bookCar = async function(carId) {
    const user = getCurrentUser();
    if (!user) {
        alert('الرجاء تسجيل الدخول أولاً');
        window.location.href = 'landing.html';
        return;
    }

    const startDate = prompt('أدخل تاريخ البداية (YYYY-MM-DD HH:MM:SS)');
    const endDate = prompt('أدخل تاريخ النهاية (YYYY-MM-DD HH:MM:SS)');
    if (!startDate || !endDate) return;

    // جلب سعر السيارة اليومي
    const { data: car, error } = await window.supabaseClient
        .from('cars')
        .select('daily_price')
        .eq('id', carId)
        .single();
    if (error || !car) {
        alert('حدث خطأ في جلب بيانات السيارة');
        return;
    }

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)));
    const total = days * car.daily_price;

    const booking = await createBooking({
        car_id: carId,
        start_date: startDate,
        end_date: endDate,
        total_price: total
    });

    if (booking) {
        alert('تم إنشاء الحجز بنجاح، في انتظار موافقة المالك');
        window.location.href = 'dashboard-renter.html';
    }
};

// دالة createBooking (إذا لم تكن معرفة)
if (typeof createBooking === 'undefined') {
    window.createBooking = async function(bookingData) {
        try {
            const { data, error } = await window.supabaseClient
                .from('bookings')
                .insert([bookingData])
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('فشل إنشاء الحجز:', err);
            alert('حدث خطأ أثناء الحجز');
            return null;
        }
    };
}

// تصدير الدوال إلى النافذة العامة للاستخدام في الصفحات الأخرى
window.renderCarsGrid = renderCarsGrid;
window.showApproximateLocation = showApproximateLocation;
window.getCarLocation = getCarLocation;
window.updateCarLocation = updateCarLocation;
window.fetchCars = fetchCars;

console.log('✅ script.js تم تحديثه بنجاح مع نظام مواقع السيارات.');
