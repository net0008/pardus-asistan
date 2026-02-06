// --- DEĞİŞKENLER ---
let allData = [];
let favorites = JSON.parse(localStorage.getItem('pardusFavs')) || [];
let currentTab = 'home';

const grid = document.getElementById('menuGrid');
const modal = document.getElementById('detailModal');
const settingsView = document.getElementById('settingsView');
const searchBox = document.querySelector('.search-box');
const adBanner = document.querySelector('.ad-banner');

// --- BAŞLANGIÇ AYARLARI ---
// Karanlık mod kontrolü
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeToggle').checked = true;
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
        grid.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1">Veri yüklenemedi.</p>';
    });

// --- MENÜYÜ ÇİZME FONKSİYONU ---
function renderMenu(items) {
    grid.innerHTML = '';
    
    if(items.length === 0) {
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
        // Değilse sadece yıldızı güncelle (Basitlik için tüm menüyü yeniliyoruz)
        renderMenu(allData);
    }
}

// --- SEKME DEĞİŞTİRME (NAVIGASYON) ---
function switchTab(tab) {
    currentTab = tab;
    
    // 1. Buton Aktifliği
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(tab === 'home') document.getElementById('btnHome').classList.add('active');
    if(tab === 'fav') document.getElementById('btnFav').classList.add('active');
    if(tab === 'settings') document.getElementById('btnSettings').classList.add('active');

    // 2. Görünürlük Ayarları (Önce hepsini gizle)
    grid.style.display = 'none';
    settingsView.style.display = 'none';
    searchBox.style.display = 'none';
    adBanner.style.display = 'none';

    // 3. Seçilen Sekmeyi Göster
    if (tab === 'home') {
        grid.style.display = 'grid';
        searchBox.style.display = 'block';
        adBanner.style.display = 'flex';
        renderMenu(allData); // Tüm veriyi göster
    } 
    else if (tab === 'fav') {
        grid.style.display = 'grid';
        // Sadece favorileri filtrele
        const favItems = allData.filter(item => favorites.includes(item.id));
        renderMenu(favItems);
    }
    else if (tab === 'settings') {
        settingsView.style.display = 'block'; // Sadece ayarları göster
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
    if(currentTab === 'fav') return;
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
    if(!item) return;

    document.getElementById('mTitle').innerText = item.title;
    
    let html = '';
    if(item.windows_karsiligi) {
        html += `<div style="background:rgba(0, 71, 186, 0.1); color:var(--pardus-blue); padding:10px; border-radius:8px; margin-bottom:15px; font-size:0.9rem;">
                    <i class="fab fa-windows"></i> <strong>Windows'ta:</strong> ${item.windows_karsiligi}
                 </div>`;
    }

    item.steps.forEach(s => html += `<div class="step-box">${s}</div>`);
    document.getElementById('mContent').innerHTML = html;
    
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

// --- PWA SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
// --- UYGULAMA YÜKLEME (INSTALL) BUTONU MANTIĞI ---
let deferredPrompt;
const installBtn = document.getElementById('installApp');

// Tarayıcı "Yüklenebilir" sinyali verdiğinde çalışır
window.addEventListener('beforeinstallprompt', (e) => {
    // Otomatik çıkan çirkin barı engelle
    e.preventDefault();
    // Olayı daha sonra tetiklemek için sakla
    deferredPrompt = e;
    // Bizim özel butonumuzu görünür yap
    installBtn.style.display = 'block';
});

// Butona tıklandığında
installBtn.addEventListener('click', (e) => {
    // Butonu gizle
    installBtn.style.display = 'none';
    // Yükleme ekranını tetikle
    deferredPrompt.prompt();
    // Kullanıcının cevabını bekle
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('Kullanıcı uygulamayı yükledi');
        } else {
            console.log('Kullanıcı yüklemeyi reddetti');
        }
        deferredPrompt = null;
    });
});