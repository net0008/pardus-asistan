// --- DEĞİŞKENLER ---
let allData = [];
let favorites = JSON.parse(localStorage.getItem('pardusFavs')) || [];
let currentTab = 'home';

// Elementleri seçerken (Eğer sayfada yoksa hata vermesin diye null kontrolü yapacağız)
const grid = document.getElementById('menuGrid');
const modal = document.getElementById('detailModal');
const settingsView = document.getElementById('settingsView');
const searchBox = document.querySelector('.search-box');
const adBanner = document.querySelector('.ad-banner');

// --- BAŞLANGIÇ AYARLARI ---
// Karanlık mod kontrolü
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.checked = true;
}

// --- VERİ ÇEKME ---
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        allData = data;
        renderMenu(allData);
    })
    .catch(error => {
        console.error('Veri hatası:', error);
        if (grid) grid.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1">Veri yüklenemedi.</p>';
    });

// --- MENÜYÜ ÇİZME FONKSİYONU ---
function renderMenu(items) {
    if (!grid) return; // Grid yoksa dur

    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<div style="text-align:center; width:100%; grid-column:1/-1; padding:40px; color:#999;">' +
            (currentTab === 'fav' ? '<i class="fas fa-star-half-alt" style="font-size:3rem; margin-bottom:10px;"></i><br>Henüz favori eklemediniz.' : 'Sonuç bulunamadı.') +
            '</div>';
        return;
    }

    items.forEach(item => {
        const isFav = favorites.includes(item.id);
        const starClass = isFav ? 'fas fa-star active' : 'far fa-star';

        grid.innerHTML += `
            <div class="card" onclick="openDetail('${item.id}')">
                <i class="${starClass} fav-btn" onclick="toggleFav(event, '${item.id}')"></i>
                <i class="fas ${item.icon} main-icon"></i>
                <span>${item.title}</span>
                <small style="display:block; font-size:0.7rem; opacity:0.7; margin-top:5px;">
                    ${item.windows_karsiligi.split('/')[0]}
                </small>
            </div>
        `;
    });
}

// --- FAVORİ İŞLEMLERİ ---
function toggleFav(e, id) {
    e.stopPropagation(); // Karta tıklanmasını engelle

    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }

    localStorage.setItem('pardusFavs', JSON.stringify(favorites));

    // Eğer favoriler sekmesindeysek listeyi yenile
    if (currentTab === 'fav') {
        const favItems = allData.filter(item => favorites.includes(item.id));
        renderMenu(favItems);
    } else {
        renderMenu(allData);
    }
}

// --- SEKME DEĞİŞTİRME (NAVIGASYON - GÜVENLİ VERSİYON) ---
function switchTab(tab) {
    currentTab = tab;

    // 1. Buton Aktifliği
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const btnHome = document.getElementById('btnHome');
    const btnFav = document.getElementById('btnFav');
    const btnSettings = document.getElementById('btnSettings');

    if (tab === 'home' && btnHome) btnHome.classList.add('active');
    if (tab === 'fav' && btnFav) btnFav.classList.add('active');
    if (tab === 'settings' && btnSettings) btnSettings.classList.add('active');

    // 2. Görünürlük Ayarları (Önce hepsini güvenlice gizle)
    // "if (grid)" demek "eğer grid değişkeni varsa" demektir. Yoksa işlem yapmaz, hata vermez.
    if (grid) grid.style.display = 'none';
    if (settingsView) settingsView.style.display = 'none';
    if (searchBox) searchBox.style.display = 'none';
    if (adBanner) adBanner.style.display = 'none';

    // 3. Seçilen Sekmeyi Göster
    if (tab === 'home') {
        if (grid) grid.style.display = 'grid';
        if (searchBox) searchBox.style.display = 'block';
        if (adBanner) adBanner.style.display = 'flex';
        renderMenu(allData);
    } else if (tab === 'fav') {
        if (grid) grid.style.display = 'grid';
        const favItems = allData.filter(item => favorites.includes(item.id));
        renderMenu(favItems);
    } else if (tab === 'settings') {
        if (settingsView) settingsView.style.display = 'block';
    }
}

// --- TEMA DEĞİŞTİRME ---
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
}

// --- ARAMA ---
function filter(val) {
    if (currentTab === 'fav') return;
    const searchTerm = val.toLowerCase();
    const filtered = allData.filter(item => {
        return item.title.toLowerCase().includes(searchTerm) ||
            item.windows_karsiligi.toLowerCase().includes(searchTerm);
    });
    renderMenu(filtered);
}

// --- MODAL İŞLEMLERİ ---
function openDetail(id) {
    const item = allData.find(d => d.id === id);
    if (!item) return;

    const mTitle = document.getElementById('mTitle');
    const mContent = document.getElementById('mContent');

    if (mTitle) mTitle.innerText = item.title;

    let html = '';
    if (item.windows_karsiligi) {
        html += `<div style="background:rgba(0, 71, 186, 0.1); color:var(--pardus-blue); padding:10px; border-radius:8px; margin-bottom:15px; font-size:0.9rem;">
                    <i class="fab fa-windows"></i> <strong>Windows'ta:</strong> ${item.windows_karsiligi}
                 </div>`;
    }

    item.steps.forEach(s => html += `<div class="step-box">${s}</div>`);

    if (mContent) mContent.innerHTML = html;
    if (modal) modal.style.display = 'block';
}

function closeModal() {
    if (modal) modal.style.display = 'none';
}

// --- PWA SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// --- UYGULAMA YÜKLEME (INSTALL) BUTONU MANTIĞI ---
let deferredPrompt;
const installBtn = document.getElementById('installApp');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'block';
});

if (installBtn) {
    installBtn.addEventListener('click', (e) => {
        installBtn.style.display = 'none';
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                deferredPrompt = null;
            });
        }
    });
}

// --- KATEGORİ FİLTRELEME ---
function filterCategory(category) {
    // 1. Düğme renklerini ayarla
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));

    // Tıklanan düğmeye 'active' sınıfını ver
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // 2. İçeriği filtrele
    if (category === 'all') {
        renderMenu(allData);
    } else {
        const filtered = allData.filter(item => item.category === category);
        renderMenu(filtered);
    }
}