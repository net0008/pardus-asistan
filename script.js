let ALL_DATA = [];
let isMobile = window.innerWidth <= 768;
let secretClickCount = 0;
let secretTimer;

const DEFAULT_TITLE = document.title;
const DEFAULT_DESCRIPTION = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

function setMetaDescription(text) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && text) {
        metaDesc.setAttribute('content', text);
    }
}

function stripMarkdown(text) {
    return String(text || '')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

function handleGuideLink(event, id) {
    if (event && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || (typeof event.button === 'number' && event.button !== 0))) {
        return true;
    }
    const item = ALL_DATA.find(i => i.id === id);
    if (item) {
        if (event) event.preventDefault();
        openDetail(item);
        return false;
    }
    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setupEventListeners();
    setAutomaticDate();
    registerServiceWorker();
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
});

async function loadData() {
    const dataFile = 'datamobil.json';
    try {
        const response = await fetch(dataFile);
        if (!response.ok) throw new Error("Dosya bulunamadı");
        ALL_DATA = await response.json();
        // Sayfa ilk yüklendiğinde varsayılan olarak 'Göç' kategorisini seçili getir.
        filterCategory('goc');

        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        const guideParam = params.get('rehber') || window.location.hash.replace(/^#/, '');

        if (query) {
            const searchInput = document.getElementById('searchInput') || document.querySelector('.search-box input');
            if (searchInput) searchInput.value = query;
            filter(query);
        } else if (guideParam && ALL_DATA.some(i => i.id === guideParam)) {
            openDetailById(guideParam, false);
        }
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
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    data.forEach(item => {
        const isFav = favorites.includes(item.id);
        const formattedCardTitle = item.title.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const card = document.createElement("div");
        card.className = "card";
        card.onclick = (e) => {
            if (!e.target.classList.contains('fav-btn') && !e.target.closest('a.card-link')) {
                openDetail(item);
            }
        };
        card.innerHTML = `
            <i class="${isFav ? "fas fa-star active" : "far fa-star"} fav-btn" role="button" aria-label="${isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}" onclick="toggleFav('${item.id}', this)"></i>
            <i class="fas ${item.icon} main-icon" aria-hidden="true"></i>
            <span><a href="rehber/${item.id}/" class="card-link" onclick="return handleGuideLink(event, '${item.id}')">${formattedCardTitle}</a></span>
            <small>${item.windows_karsiligi || ''}</small>
        `;
        grid.appendChild(card);
    });
}

function filterCategory(category, btnElement) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    
    let targetBtn = btnElement;
    if (!targetBtn && typeof window !== 'undefined' && window.event && window.event.target) {
        targetBtn = window.event.target.closest('.cat-btn');
    }
    if (!targetBtn) {
        targetBtn = document.querySelector(`.cat-btn[data-category="${category}"]`) ||
                    document.querySelector(`.cat-btn[onclick*="'${category}'"]`);
    }
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    renderMenu(category === 'all' ? ALL_DATA : ALL_DATA.filter(item => item.category === category));
}

function filter(keyword) {
    const lower = keyword.toLowerCase().trim();
    if (lower === "yonetici") {
        document.querySelector('.search-box input').value = "";
        const modal = document.getElementById('secretModal');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.getElementById('secretPass').focus();
        renderMenu(ALL_DATA); 
        return;
    }
    const filtered = ALL_DATA.filter(item => 
    item.title.toLowerCase().includes(lower) || 
    (item.windows_karsiligi && item.windows_karsiligi.toLowerCase().includes(lower)) ||
    (item.steps && item.steps.some(step => step.toLowerCase().includes(lower)))
);
    renderMenu(filtered);
}


function checkPassword(){var _0x1c9d=['\x76\x61\x6C\x75\x65','\x67\x65\x74\x45\x6C\x65\x6D\x65\x6E\x74\x42\x79\x49\x64','\x73\x65\x63\x72\x65\x74\x50\x61\x73\x73','\x31\x32\x33\x34','\x68\x72\x65\x66','\x6C\x6F\x63\x61\x74\x69\x6F\x6E','\x72\x61\x70\x6F\x72\x2E\x68\x74\x6D\x6C','\x6C\x6F\x67\x69\x6E\x45\x72\x72\x6F\x72','\x73\x74\x79\x6C\x65','\x64\x69\x73\x70\x6C\x61\x79','\x62\x6C\x6F\x63\x6B'];var _0x3b2a=document[_0x1c9d[1]](_0x1c9d[2])[_0x1c9d[0]];if(_0x3b2a===_0x1c9d[3]){window[_0x1c9d[5]][_0x1c9d[4]]=_0x1c9d[6];}else{document[_0x1c9d[1]](_0x1c9d[7])[_0x1c9d[8]][_0x1c9d[9]]=_0x1c9d[10];}}

function closeSecretModal() {
    const modal = document.getElementById('secretModal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('secretPass').value = '';
}

// --- DETAY SAYFASI ---
function openDetailById(id, pushHistory = true) {
    const item = ALL_DATA.find(i => i.id === id);
    if (item) {
        openDetail(item, pushHistory);
    }
}

function openDetail(item, pushHistory = true) {
    document.getElementById("mainView").style.display = "none";
    document.getElementById("settingsView").style.display = "none";
    document.getElementById("detailView").style.display = "block";
    
    // --- BAŞLIKTAKİ ** ** İŞARETLERİNİ STRONG ETİKETİNE ÇEVİRİR ---
    // Bu sayede CSS'deki .detail-view strong kuralı çalışır ve renk turuncu olur.
    let formattedTitle = item.title.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    document.getElementById("detailTitle").innerHTML = formattedTitle;
    
    const cleanTitle = stripMarkdown(item.title);
    document.title = cleanTitle + ' | Pardus Asistan';
    const firstStep = item.steps && item.steps.length > 0 ? stripMarkdown(item.steps[0]) : '';
    const winText = item.windows_karsiligi ? 'Windows karşılığı: ' + item.windows_karsiligi + '. ' : '';
    setMetaDescription((cleanTitle + '. ' + winText + firstStep).slice(0, 155));

    if (pushHistory && window.location.hash !== '#' + item.id) {
        history.pushState({ view: 'detail', id: item.id }, '', '#' + item.id);
    }

    document.getElementById("detailWindows").innerText = "Windows: " + (item.windows_karsiligi || "Yok");
    const container = document.getElementById("detailStepsContainer");
    container.innerHTML = "";
    item.steps.forEach((step) => {
        let formatted = step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        container.innerHTML += `<div class="step-box">${formatted}</div>`; 
    });
    window.scrollTo(0,0);
}

function closeDetail(fromPopState = false) {
    document.getElementById("detailView").style.display = "none";
    document.getElementById("settingsView").style.display = "none";
    document.getElementById("mainView").style.display = "block";
    document.title = DEFAULT_TITLE;
    setMetaDescription(DEFAULT_DESCRIPTION);
    if (!fromPopState && window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
}

window.addEventListener('popstate', () => {
    const hashId = window.location.hash.replace(/^#/, '');
    if (hashId && ALL_DATA.some(i => i.id === hashId)) {
        openDetailById(hashId, false);
    } else if (document.getElementById("detailView").style.display === "block") {
        closeDetail(true);
    }
});

function switchTab(tab) {
    document.getElementById("mainView").style.display = "none";
    document.getElementById("detailView").style.display = "none";
    document.getElementById("settingsView").style.display = "none";
    document.title = DEFAULT_TITLE;
    setMetaDescription(DEFAULT_DESCRIPTION);
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
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
        btn.setAttribute('aria-label', 'Favorilere ekle');
    } else {
        favs.push(id);
        btn.className = "fas fa-star fav-btn active";
        btn.setAttribute('aria-label', 'Favorilerden çıkar');
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
        const modal = document.getElementById('secretModal');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
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

function setupEventListeners() { 
    checkInstallPrompt(); 
}

// Tarih fonksiyonu
function setAutomaticDate() {
    const dateElement = document.getElementById('lastUpdateDate');
    if (dateElement) {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        // Örn: "25 Şubat 2026" şeklinde yazdırır
        const formattedDate = today.toLocaleDateString('tr-TR', options);
        dateElement.innerText = "Son Güncelleme: " + formattedDate;
    }
}

// PWA Service Worker Kaydı
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('[Service Worker] Kayıt başarılı:', reg.scope);
                })
                .catch(err => {
                    console.error('[Service Worker] Kayıt hatası:', err);
                });
        });
    }
}
