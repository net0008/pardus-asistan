// mesaj.js - Dinamik Duyuru ve İpucu Yönetimi

const announcements = [
    `<strong>Saha Rehberi:</strong> <a href="javascript:void(0)" onclick="openDetailById('etap-tahta-pasif-aksiyon-rehberi')" style="color: inherit; text-decoration: underline; cursor: pointer; font-weight: 600;">Etkileşimli Tahtanız Pasif mi? Saha Aksiyon Rehberi <i class="fas fa-arrow-right" style="font-size:0.8rem;"></i></a>`,
    `<strong>Önemli:</strong> <a href="javascript:void(0)" onclick="openDetailById('etap-dokunmatik-calismiyor-cozum')" style="color: inherit; text-decoration: underline; cursor: pointer; font-weight: 600;">Tahtada Dokunmatik Çalışmıyor mu? Faz 1-2-3-4 Çözümleri <i class="fas fa-arrow-right" style="font-size:0.8rem;"></i></a>`,
    `<strong>Yeni Uygulama:</strong> <a href="javascript:void(0)" onclick="openDetailById('app-labplot-bilimsel-veri')" style="color: inherit; text-decoration: underline; cursor: pointer; font-weight: 600;">LabPlot ile Bilimsel Veri Keşfi ve Grafik Çizimi <i class="fas fa-arrow-right" style="font-size:0.8rem;"></i></a>`,
    `<strong>Yeni Rehber:</strong> <a href="javascript:void(0)" onclick="openDetailById('faz2-bios-pili-boot-ayari')" style="color: inherit; text-decoration: underline; cursor: pointer; font-weight: 600;">Faz 2 Vestel Tahtalarda BIOS Pili ve Boot Ayarları <i class="fas fa-arrow-right" style="font-size:0.8rem;"></i></a>`,
    `<strong>Duyuru:</strong> <a href="javascript:void(0)" onclick="openDetailById('etap-eba-qr-oturum-acma')" style="color: inherit; text-decoration: underline; cursor: pointer; font-weight: 600;">Akıllı Tahtalarda EBA QR ile Oturum Açma Başladı. <i class="fas fa-arrow-right" style="font-size:0.8rem;"></i></a>`,
    `<strong>Yapay Zeka:</strong> <a href="https://notebook.google.com/notebook/939ae59c-bdfc-4afa-b5a6-72790c19a0cf" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline; cursor: pointer; font-weight: 600;">Pardus Etap Rehber Yardım Sohbeti Robotu Yayında <i class="fas fa-external-link-alt" style="font-size:0.75rem; margin-left:3px;"></i></a>`
];

let currentAnnouncementIndex = 0;

function rotateAnnouncements() {
    const announcementElement = document.getElementById("announcement-text");
    
    // Sayfada duyuru kutusu yoksa hata vermemesi için kontrol
    if (!announcementElement) return;

    // Metni yavaşça görünmez yap
    announcementElement.style.opacity = 0;

    // Yarım saniye sonra metni değiştir ve tekrar görünür yap
    setTimeout(() => {
        currentAnnouncementIndex = (currentAnnouncementIndex + 1) % announcements.length;
        announcementElement.innerHTML = announcements[currentAnnouncementIndex];
        announcementElement.style.opacity = 1;
    }, 500); 
}

// 7 saniyede bir (7000ms) değiştir
setInterval(rotateAnnouncements, 7000);