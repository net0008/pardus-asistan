let ALL_DATA = [];
let isMobile = window.innerWidth <= 768;
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
        if (!response.ok) throw new Error("Dosya bulunamadı");
        ALL_DATA = await response.json();
        renderMenu(ALL_DATA);
    } catch (error) {
        console.error(error);
        document.getElementById("menuGrid").innerHTML = `<p style="text-align:center;">Veriler yükleniyor...</p>`;
    }
}

function renderMenu(data) {
    const grid = document.getElementById("menuGrid");
    grid.innerHTML = "";
    if (data.length === 0) {
        grid.innerHTML = "<p style='text-align:center; width:100%; grid-column:1/-1;'>Sonuç bulunamadı.</p>";
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
    const lower = keyword.toLowerCase().trim();
    if (lower === "yonetici") {
        document.querySelector('.search-box input').value = "";
        document.getElementById('secretModal').style.display = 'flex';
        document.getElementById('secretPass').focus();
        renderMenu(ALL_DATA); 
        return;
    }
    const filtered = ALL_DATA.filter(item => 
        item.title.toLowerCase().includes(lower) || 
        (item.windows_karsiligi && item.windows_karsiligi.toLowerCase().includes(lower))
    );
    renderMenu(filtered);
}

function checkPassword() {
    const pass = document.getElementById('secretPass').value;
    if (pass === "1234") {
        window.location.href = "rapor.html";
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function closeSecretModal() {
    document.getElementById('secretModal').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('secretPass').value = '';
}

// --- DETAY SAYFASI ---
function openDetail(item) {
    document.getElementById("mainView").style.display = "none";
    document.getElementById("detailView").style.display = "block";
    
    // --- BAŞLIKTAKİ ** ** İŞARETLERİNİ STRONG ETİKETİNE ÇEVİRİR ---
    // Bu sayede CSS'deki .detail-view strong kuralı çalışır ve renk turuncu olur.
    let formattedTitle = item.title.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    document.getElementById("detailTitle").innerHTML = formattedTitle;
    
    document.getElementById("detailWindows").innerText = "Windows: " + (item.windows_karsiligi || "Yok");
    const container = document.getElementById("detailStepsContainer");
    container.innerHTML = "";
    item.steps.forEach((step, index) => {
        let formatted = step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        container.innerHTML += `<div class="step-box"><strong>${index + 1}.</strong> ${formatted}</div>`;
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
    if (favs.includes(id)) {
        favs = favs.filter(f => f !== id);
        btn.className = "far fa-star fav-btn";
    } else {
        favs.push(id);
        btn.className = "fas fa-star fav-btn active";
    }
    localStorage.setItem('favorites', JSON.stringify(favs));
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function triggerSecret(element) {
    secretClickCount++;
    element.style.transform = "scale(0.9)";
    setTimeout(() => element.style.transform = "scale(1)", 100);
    clearTimeout(secretTimer);
    secretTimer = setTimeout(() => { secretClickCount = 0; }, 2000);

    if (secretClickCount >= 5) {
        document.getElementById('secretModal').style.display = 'flex';
        document.getElementById('secretPass').focus();
        secretClickCount = 0;
    }
}

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