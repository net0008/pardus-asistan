// --- DEĞİŞKENLER ---
let allData = [];
let favorites = JSON.parse(localStorage.getItem('pardusFavs')) || [];
let currentTab = 'home';
let deferredPrompt; // PWA yükleme değişkeni

const mainView = document.getElementById('mainView');
const detailView = document.getElementById('detailView');
const settingsView = document.getElementById('settingsView');
const grid = document.getElementById('menuGrid');

// --- BAŞLANGIÇ AYARLARI ---
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.checked = true;
}

// --- CİHAZ TESPİTİ VE VERİ ÇEKME ---
const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const dataFile = isMobile ? 'datamobil.json' : 'datapc.json';

console.log(`Cihaz Algılandı: ${isMobile ? 'Mobil' : 'Bilgisayar/Tahta'} - Yüklenen Dosya: ${dataFile}`);

// Veriyi Çek
fetch(dataFile)
    .then(res => {
        if (!res.ok) throw new Error("Dosya bulunamadı");
        return res.json();
    })
    .then(data => {
        allData = data;
        renderMenu(allData);
    })
    .catch(err => {
        console.error("Veri yükleme hatası:", err);
        if(grid) grid.innerHTML = `<p style="text-align:center; color:red;">Veri yüklenemedi!<br>(${dataFile} dosyası eksik olabilir)</p>`;
    });

// --- MENÜ ÇİZME ---
function renderMenu(items) {
    if(!grid) return;
    grid.innerHTML = '';
    
    if (items.length === 0) {
        grid.innerHTML = '<div style="text-align:center; width:100%; grid-column:1/-1; padding:40px; color:#999;">Sonuç bulunamadı.</div>';
        return;
    }

    items.forEach(item => {
        const isFav = favorites.includes(item.id);
        const starClass = isFav ? 'fas fa-star active' : 'far fa-star';
        
        // Başlıktaki ** işaretlerini temizle ve renklendir
        const displayTitle = item.title.replace(/\*\*(.*?)\*\*/g, '<span style="color: #f57f17;">$1</span>');

        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openDetail(item.id);

        card.innerHTML = `
            <i class="${starClass} fav-btn" onclick="toggleFav(event, '${item.id}')"></i>
            <i class="fas ${item.icon} main-icon"></i>
            <span>${displayTitle}</span>
            <small style="display:block; opacity:0.7; font-size:0.7rem; margin-top:5px;">${item.windows_karsiligi.split('/')[0]}</small>
        `;
        grid.appendChild(card);
    });
}

// --- DETAY SAYFASI AÇ ---
function openDetail(id) {
    const item = allData.find(x => x.id === id);
    if (!item) return;

    // Sayfa Geçişi
    mainView.style.display = 'none';
    if(settingsView) settingsView.style.display = 'none';
    detailView.style.display = 'block';
    
    // Başlık ve İkon (Yıldızları temizle)
    const cleanTitle = item.title.replace(/\*\*(.*?)\*\*/g, '$1');
    document.getElementById('detailTitle').innerText = cleanTitle;
    
    // Windows Karşılığı
    document.getElementById('detailWindows').innerHTML = `<i class="fab fa-windows"></i> <strong>Windows'ta:</strong> ${item.windows_karsiligi}`;

    // Resim Varsa Göster
    const imgContainer = document.getElementById('detailImageContainer');
    if(imgContainer) {
        if(item.image) {
            imgContainer.style.display = 'block';
            imgContainer.innerHTML = `<img src="${item.image}" style="max-width:100%; border-radius:8px; border:1px solid #ddd;">`;
        } else {
            imgContainer.style.display = 'none';
        }
    }

    // --- ADIMLARI LİSTELE ---
    const container = document.getElementById('detailStepsContainer');
    if(container) {
        container.innerHTML = ''; // Temizle
        
        item.steps.forEach(step => {
            const div = document.createElement('div');
            div.className = 'step-box'; 
            // Metin içindeki **bold** kısımları HTML <b> tagine çevir
            let formattedStep = step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            div.innerHTML = formattedStep;
            container.appendChild(div);
        });
    }

    window.scrollTo(0, 0); 
}

// --- GERİ DÖN ---
function closeDetail() {
    detailView.style.display = 'none';
    if(currentTab === 'settings') {
        if(settingsView) settingsView.style.display = 'block';
    } else {
        mainView.style.display = 'block';
    }
}

// --- FAVORİ EKLE/ÇIKAR ---
function toggleFav(e, id) {
    e.stopPropagation(); // Kartın tıklanmasını engelle
    if(favorites.includes(id)) {
        favorites = favorites.filter(x => x !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('pardusFavs', JSON.stringify(favorites));
    
    // Eğer favoriler sekmesindeysek listeyi güncelle, değilse tümünü göster ama ikon değişsin
    if(currentTab === 'fav') {
        renderMenu(allData.filter(x => favorites.includes(x.id)));
    } else {
        renderMenu(allData); // Tüm listeyi yenile ki yıldızın durumu değişsin
    }
}

// --- SEKME DEĞİŞTİRME ---
function switchTab(tab) {
    currentTab = tab;
    closeDetail();
    
    // Alt menü aktiflik durumu
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // PC menü aktiflik durumu
    if(document.getElementById('pcBtnHome')) document.getElementById('pcBtnHome').classList.remove('active');
    if(document.getElementById('pcBtnFav')) document.getElementById('pcBtnFav').classList.remove('active');
    if(document.getElementById('pcBtnSettings')) document.getElementById('pcBtnSettings').classList.remove('active');

    // İlgili butonu aktif yap
    if(tab === 'home') {
        if(document.getElementById('btnHome')) document.getElementById('btnHome').classList.add('active');
        if(document.getElementById('pcBtnHome')) document.getElementById('pcBtnHome').classList.add('active');
    }
    if(tab === 'fav') {
        if(document.getElementById('btnFav')) document.getElementById('btnFav').classList.add('active');
        if(document.getElementById('pcBtnFav')) document.getElementById('pcBtnFav').classList.add('active');
    }
    if(tab === 'settings') {
        if(document.getElementById('btnSettings')) document.getElementById('btnSettings').classList.add('active');
        if(document.getElementById('pcBtnSettings')) document.getElementById('pcBtnSettings').classList.add('active');
    }

    mainView.style.display = 'none';
    if(settingsView) settingsView.style.display = 'none';

    if(tab === 'settings') {
        if(settingsView) settingsView.style.display = 'block';
    } else if (tab === 'fav') {
        mainView.style.display = 'block';
        renderMenu(allData.filter(x => favorites.includes(x.id)));
    } else {
        mainView.style.display = 'block';
        renderMenu(allData);
    }
}

// --- KATEGORİ FİLTRELEME ---
function filterCategory(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
    
    if (cat === 'all') {
        renderMenu(allData);
    } else {
        renderMenu(allData.filter(x => x.category === cat));
    }
}

// --- ARAMA ---
function filter(val) {
    const term = val.toLowerCase();
    const filtered = allData.filter(x => 
        x.title.toLowerCase().includes(term) || 
        x.windows_karsiligi.toLowerCase().includes(term) ||
        (x.steps && x.steps.join(' ').toLowerCase().includes(term)) // İçerikte de ara
    );
    renderMenu(filtered);
}

// --- TEMA ---
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// --- SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker Kayıtlı'))
    .catch(err => console.log('SW Hatası:', err));
}

// --- UYGULAMA YÜKLEME (MOBİL İÇİN) ---
const installBtn = document.getElementById('installApp');
const installContainer = document.getElementById('installContainer');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Sadece mobilde göster
    if (installContainer && isMobile) {
        installContainer.style.display = 'flex';
    }
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (outcome === 'accepted') {
                if (installContainer) installContainer.style.display = 'none';
            }
        }
    });
}