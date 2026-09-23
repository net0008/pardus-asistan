// mesaj.js - Dinamik Duyuru ve İpucu Yönetimi

const announcements = [
    `<strong>Yapay Zeka:</strong> <a href="javascript:void(0)" onclick="openChatbot()" style="color: inherit; text-decoration: underline; cursor: pointer; font-weight: 600;">Pardus Etap Rehber Yardım Sohbeti Robotu Yayında <i class="fas fa-robot" style="font-size:0.85rem; margin-left:3px;"></i></a>`,
    `<strong>Duyuru:</strong> <a href="javascript:void(0)" onclick="openDetailById('etap-yazici-kurulumu-eta-printer-manager')" style="color: inherit; text-decoration: underline; cursor: pointer; font-weight: 600;">Pardus'ta yazıcı kurulumu kolaylaştı. <i class="fas fa-arrow-right" style="font-size:0.8rem;"></i></a>`
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