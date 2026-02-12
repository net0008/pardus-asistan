let ALL_DATA = [];
let isMobile = window.innerWidth <= 768;

// Sayfa Yüklendiğinde
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setupEventListeners();
    checkInstallPrompt();
    
    // Gece modu kontrolü
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
});

// Verileri Çek
async function loadData() {
    // Mobilde miyiz PC'de mi? Ona göre dosya seç
    const dataFile = isMobile ? 'datamobil.json' : 'datapc.json';
    console.log("Veri dosyası yükleniyor:", dataFile);

    try {
        const response = await fetch(dataFile);
        if (!response.ok) throw new Error("Veri dosyası bulunamadı (404)");
        
        ALL_DATA = await response.json();
        renderMenu(ALL_DATA); // Menüyü çiz
    } catch (error) {
        console.error("Hata:", error);
        // Hata olursa kullanıcıya göster
        document.getElementById("menuGrid").innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: red;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 10px;"></i>
                <p>Veriler yüklenemedi!</p>
                <small>${error.message}</small>
                <p style="font-size: 0.8rem; color: #555; margin-top:10px;">
                    Lütfen "datapc.json" dosyasının yapısını kontrol edin.
                </small>
            </div>
        `;
    }
}

// Menüyü Ekrana Çiz
function renderMenu(data) {
    const grid = document.getElementById("menuGrid");
    grid.innerHTML = ""; // Temizle

    if (data.length === 0) {
        grid.innerHTML = "<p style='text-align:center; width:100%;'>Sonuç bulunamadı.</p>";
        return;
    }

    data.forEach(item => {
        // Favori kontrolü
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFav = favorites.includes(item.id);
        const favIconClass = isFav ? "fas fa-star active" : "far fa-star";

        const card = document.createElement("div");
        card.className = "card";
        card.onclick = (e) => {
            // Favori butonuna basıldıysa detayı açma
            if(e.target.classList.contains('fav-btn')) return;
            openDetail(item);
        };

        card.innerHTML = `
            <i class="${favIconClass} fav-btn" onclick="toggleFav('${item.id}', this)"></i>
            <i class="fas ${item.icon} main-icon"></i>
            <span>${item.title}</span>
            <small>${item.windows_karsiligi || ''}</small>
        `;
        grid.appendChild(card);
    });
}

// Kategori Filtreleme
function filterCategory(category) {
    // Butonların rengini güncelle
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (category === 'all') {
        renderMenu(ALL_DATA);
    } else {
        const filtered = ALL_DATA.filter(item => item.category === category);
        renderMenu(filtered);
    }
}

// Arama Yapma
function filter(keyword) {
    const lower = keyword.toLowerCase();
    const filtered = ALL_DATA.filter(item => 
        item.title.toLowerCase().includes(lower) || 
        (item.windows_karsiligi && item.windows_karsiligi.toLowerCase().includes(lower))
    );
    renderMenu(filtered);
}

// Detay Açma
function openDetail(item) {
    document.getElementById("mainView").style.display = "none";
    document.getElementById("detailView").style.display = "block";
    
    // İçeriği doldur
    document.getElementById("detailTitle").innerHTML = item.title; // innerHTML ile bold desteği
    document.getElementById("detailWindows").innerText = "Windows: " + (item.windows_karsiligi || "Benzeri Yok");

    // Adımları Listele
    const stepsContainer = document.getElementById("detailStepsContainer");
    stepsContainer.innerHTML = "";
    
    if (item.steps && item.steps.length > 0) {
        item.steps.forEach((step, index) => {
            // Markdown benzeri bold yapısı (**yazı**) desteği
            let formattedStep = step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Link desteği [Link Adı](URL)
            formattedStep = formattedStep.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:#f57f17; text-decoration:underline;">$1</a>');

            stepsContainer.innerHTML += `
                <div class="step-box">
                    <span style="font-weight:bold; color:#fbc02d; margin-right:5px;">${index + 1}.</span> 
                    ${formattedStep}
                </div>
            `;
        });
    }
    
    window.scrollTo(0,0);
}

// Detay Kapatma
function closeDetail() {
    document.getElementById("detailView").style.display = "none";
    document.getElementById("settingsView").style.display = "none";
    document.getElementById("mainView").style.display = "block";
}

// Sekme Değiştirme (Alt Menü / Üst Menü)
function switchTab(tab) {
    // Önce hepsini kapat
    document.getElementById("mainView").style.display = "none";
    document.getElementById("detailView").style.display = "none";
    document.getElementById("settingsView").style.display = "none";
    
    // Aktif butonu güncelle (Hem Mobil Hem PC Menüsü İçin)
    document.querySelectorAll('.nav-item, .pc-nav button').forEach(el => el.classList.remove('active'));

    if (tab === 'home') {
        document.getElementById("mainView").style.display = "block";
        highlightBtn('btnHome', 'pcBtnHome');
        renderMenu(ALL_DATA); // Tümünü göster
    } else if (tab === 'fav') {
        document.getElementById("mainView").style.display = "block";
        highlightBtn('btnFav', 'pcBtnFav');
        
        // Sadece favorileri filtrele
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const favData = ALL_DATA.filter(item => favorites.includes(item.id));
        renderMenu(favData);
    } else if (tab === 'settings') {
        document.getElementById("settingsView").style.display = "block";
        highlightBtn('btnSettings', 'pcBtnSettings');
    }
}

function highlightBtn(mobileId, pcId) {
    if(document.getElementById(mobileId)) document.getElementById(mobileId).classList.add('active');
    if(document.getElementById(pcId)) document.getElementById(pcId).classList.add('active');
}

// Favori Ekle/Çıkar
function toggleFav(id, btnElement) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
        btnElement.className = "far fa-star fav-btn";
    } else {
        favorites.push(id);
        btnElement.className = "fas fa-star fav-btn active";
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Buton animasyonu
    btnElement.style.transform = "scale(1.2)";
    setTimeout(() => btnElement.style.transform = "scale(1)", 200);
}

// Gece Modu
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

// PWA Kurulum Butonu
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installContainer = document.getElementById('installContainer');
    if(installContainer) installContainer.style.display = 'block';
});

function checkInstallPrompt() {
    const installBtn = document.getElementById('installApp');
    if(installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    document.getElementById('installContainer').style.display = 'none';
                }
                deferredPrompt = null;
            }
        });
    }
}