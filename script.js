// --- DEĞİŞKENLER ---
let allData = [];
let favorites = JSON.parse(localStorage.getItem('pardusFavs')) || [];
let currentTab = 'home';

// Elementleri seçme
const mainContent = document.getElementById('mainContent');
const detailView = document.getElementById('detailView');
const settingsView = document.getElementById('settingsView');
const grid = document.getElementById('menuGrid');

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
        if (grid) grid.innerHTML = '<p style="text-align:center;">Veri yüklenemedi.</p>';
    });

// --- MENÜYÜ ÇİZME ---
function renderMenu(items) {
    if (!grid) return;
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<div style="text-align:center; width:100%; grid-column:1/-1; padding:40px; color:#999;">Sonuç bulunamadı.</div>';
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

// --- DETAY SAYFASINI AÇMA (YENİ SİSTEM) ---
function openDetail(id) {
    const item = allData.find(x => x.id === id);
    if (!item) return;

    // 1. Ana İçeriği Gizle, Detayı Göster
    if (mainContent) mainContent.style.display = 'none';
    if (settingsView) settingsView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';

    // 2. İçeriği Doldur
    document.getElementById('detailTitle').innerText = item.title;
    document.getElementById('detailWindows').innerHTML = `<i class="fab fa-windows"></i> Windows: ${item.windows_karsiligi}`;
    document.getElementById('detailIcon').innerHTML = `<i class="fas ${item.icon}"></i>`;

    // 3. Resim Kontrolü
    const imgContainer = document.getElementById('detailImageContainer');
    if (item.image) {
        imgContainer.style.display = 'block';
        imgContainer.innerHTML = `<img src="${item.image}">`;
    } else {
        imgContainer.style.display = 'none';
    }

    // 4. Adımları Listele
    const list = document.getElementById('detailSteps');
    list.innerHTML = '';
    item.steps.forEach(step => {
        const li = document.createElement('li');
        li.innerHTML = step;
        list.appendChild(li);
    });

    // Sayfanın en tepesine kaydır (Telefonda aşağıda kalmasın)
    window.scrollTo(0, 0);
}

// --- GERİ DÖN FONKSİYONU ---
function closeDetail() {
    // Detayı gizle, ana içeriği aç
    if (detailView) detailView.style.display = 'none';
    
    // Hangi sekmedeysek oraya dön
    if (currentTab === 'settings') {
        if (settingsView) settingsView.style.display = 'block';
    } else {
        if (mainContent) mainContent.style.display = 'block';
    }
}

// --- FAVORİ İŞLEMLERİ ---
function toggleFav(e, id) {
    e.stopPropagation(); 
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('pardusFavs', JSON.stringify(favorites));

    if (currentTab === 'fav') {
        const favItems = allData.filter(item => favorites.includes(item.id));
        renderMenu(favItems);
    } else {
        renderMenu(allData);
    }
}

// --- SEKME DEĞİŞTİRME ---
function switchTab(tab) {
    currentTab = tab;
    
    // Detay açıksa kapat
    if (detailView) detailView.style.display = 'none';

    // Buton aktiflikleri
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (tab === 'home') document.getElementById('btnHome').classList.add('active');
    if (tab === 'fav') document.getElementById('btnFav').classList.add('active');
    if (tab === 'settings') document.getElementById('btnSettings').classList.add('active');

    // Görünürlük ayarları
    if (mainContent) mainContent.style.display = 'none';
    if (settingsView) settingsView.style.display = 'none';

    if (tab === 'settings') {
        if (settingsView) settingsView.style.display = 'block';
    } else {
        if (mainContent) mainContent.style.display = 'block';
        // İçerik filtreleme
        if (tab === 'home') {
            renderMenu(allData);
        } else if (tab === 'fav') {
            const favItems = allData.filter(item => favorites.includes(item.id));
            renderMenu(favItems);
        }
    }
}

// --- DİĞER FONKSİYONLAR ---
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function filter(val) {
    if (currentTab === 'fav') return;
    const searchTerm = val.toLowerCase();
    const filtered = allData.filter(item => {
        return item.title.toLowerCase().includes(searchTerm) ||
            item.windows_karsiligi.toLowerCase().includes(searchTerm);
    });
    renderMenu(filtered);
}

function filterCategory(category) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    
    if (category === 'all') {
        renderMenu(allData);
    } else {
        const filtered = allData.filter(item => item.category === category);
        renderMenu(filtered);
    }
}

// PWA Servis İşçisi
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// Yükle Butonu
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