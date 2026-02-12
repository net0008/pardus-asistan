let ALL_DATA = [];
let isMobile = window.innerWidth <= 768;

// --- GİZLİ MENÜ DEĞİŞKENLERİ ---
let secretClickCount = 0;
let secretTimer;

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setupEventListeners();
    checkInstallPrompt();
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
});

async function loadData() {
    const dataFile = isMobile ? 'datamobil.json' : 'datapc.json';
    try {
        const response = await fetch(dataFile);
        if (!response.ok) throw new Error("Veri dosyası bulunamadı");
        ALL_DATA = await response.json();
        renderMenu(ALL_DATA);
    } catch (error) {
        console.error("Hata:", error);
        document.getElementById("menuGrid").innerHTML = `<p style="color:red; text-align:center;">Veri yüklenemedi!</p>`;
    }
}

function renderMenu(data) {
    const grid = document.getElementById("menuGrid");
    grid.innerHTML = "";
    if (data.length === 0) {
        grid.innerHTML = "<p style='text-align:center; width:100%;'>Sonuç bulunamadı.</p>";
        return;
    }
    data.forEach(item => {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFav = favorites.includes(item.id);
        const card = document.createElement("div");
        card.className = "card";
        card.onclick = (e) => { if(!e.target.classList.contains('fav-btn')) openDetail(item); };
        card.innerHTML = `
            <i class="${isFav ? "fas fa-star active" : "far fa-star"} fav-btn" onclick="toggleFav('${item.id}', this)"></i>
            <i class="fas ${item.icon} main-icon"></i>
            <span>${item.title}</span>
            <small>${item.windows_karsiligi || ''}</small>
        `;
        grid.appendChild(card);
    });
}

function filterCategory(category) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderMenu(category === 'all' ? ALL_DATA : ALL_DATA.filter(item => item.category === category));
}

function filter(keyword) {
    const lower = keyword.toLowerCase();
    renderMenu(ALL_DATA.filter(item => item.title.toLowerCase().includes(lower) || (item.windows_karsiligi && item.windows_karsiligi.toLowerCase().includes(lower))));
}

function openDetail(item) {
    document.getElementById("mainView").style.display = "none";
    document.getElementById("detailView").style.display = "block";
    document.getElementById("detailTitle").innerHTML = item.title;
    document.getElementById("detailWindows").innerText = "Windows: " + (item.windows_karsiligi || "Benzeri Yok");
    const container = document.getElementById("detailStepsContainer");
    container.innerHTML = "";
    item.steps.forEach((step, index) => {
        let formatted = step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:#f57f17; text-decoration:underline;">$1</a>')
                            .replace(/`(.*?)`/g, '<code style="background:#eee; padding:2px 4px; border-radius:4px;">$1</code>');
        container.innerHTML += `<div class="step-box"><strong style="color:#f57f17;">${index + 1}.</strong> ${formatted}</div>`;
    });
    window.scrollTo(0,0);
}

function closeDetail() {
    document.getElementById("detailView").style.display = "none";
    document.getElementById("settingsView").style.display = "none";
    document.getElementById("mainView").style.display = "block";
}

function switchTab(tab) {
    document.getElementById("mainView").style.display = "none";
    document.getElementById("detailView").style.display = "none";
    document.getElementById("settingsView").style.display = "none";
    document.querySelectorAll('.nav-item, .pc-nav button').forEach(el => el.classList.remove('active'));

    if (tab === 'home') {
        document.getElementById("mainView").style.display = "block";
        highlightBtn('btnHome', 'pcBtnHome');
        renderMenu(ALL_DATA);
    } else if (tab === 'fav') {
        document.getElementById("mainView").style.display = "block";
        highlightBtn('btnFav', 'pcBtnFav');
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        renderMenu(ALL_DATA.filter(item => favorites.includes(item.id)));
    } else if (tab === 'settings') {
        document.getElementById("settingsView").style.display = "block";
        highlightBtn('btnSettings', 'pcBtnSettings');
    }
}

function highlightBtn(mobileId, pcId) {
    if(document.getElementById(mobileId)) document.getElementById(mobileId).classList.add('active');
    if(document.getElementById(pcId)) document.getElementById(pcId).classList.add('active');
}

function toggleFav(id, btn) {
    let favs = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favs.includes(id)) { favs = favs.filter(f => f !== id); btn.className = "far fa-star fav-btn"; }
    else { favs.push(id); btn.className = "fas fa-star fav-btn active"; }
    localStorage.setItem('favorites', JSON.stringify(favs));
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// --- GİZLİ MENÜ MANTIĞI ---
function triggerSecret(element) {
    secretClickCount++;
    
    // Tıklama efekti
    element.style.transform = "scale(0.9)";
    setTimeout(() => element.style.transform = "scale(1)", 100);

    // Süre sıfırlama (2 saniye içinde basmalı)
    clearTimeout(secretTimer);
    secretTimer = setTimeout(() => { secretClickCount = 0; }, 2000);

    if (secretClickCount >= 5) {
        document.getElementById('secretModal').style.display = 'flex';
        document.getElementById('secretPass').focus();
        secretClickCount = 0;
    }
}

async function checkPassword() {
    const input = document.getElementById('secretPass').value;
    
    // Şifreyi Hashle (SHA-256)
    const hash = await sha256(input);
    
    // "1234" şifresinin hash değeri:
    const correctHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; 

    if (hash === correctHash) {
        // Başarılı
        document.getElementById('secretModal').style.display = 'none';
        document.getElementById('secretView').style.display = 'block';
        document.getElementById('secretPass').value = ''; 
        document.getElementById('loginError').style.display = 'none';
    } else {
        // Hatalı
        document.getElementById('loginError').style.display = 'block';
        // Giriş kutusunu salla
        const modalContent = document.querySelector('.modal-content');
        modalContent.style.animation = "shake 0.3s";
        setTimeout(() => modalContent.style.animation = "", 300);
    }
}

function closeSecretModal() {
    document.getElementById('secretModal').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('secretPass').value = '';
}

function closeSecretView() {
    document.getElementById('secretView').style.display = 'none';
}

// SHA-256 Şifreleme Yardımcısı
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// CSS Shake Animasyonu için ekleme
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}`;
document.head.appendChild(style);

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (window.innerWidth <= 768) {
        const installContainer = document.getElementById('installContainer');
        if(installContainer) installContainer.style.display = 'block';
    }
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

function setupEventListeners() { checkInstallPrompt(); }