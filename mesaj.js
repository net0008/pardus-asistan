// mesaj.js - Dinamik Duyuru ve İpucu Yönetimi

const announcements = [
    "<strong>Hatırlatma:</strong> İzmir İl MEM takvimine göre Pardus ETAP 23 geçiş işlemleri 1 Nisan 2026'ya kadar tamamlanmalıdır.",
    `<strong>İpucu:</strong> Arama kutusuna Windows'taki adını (Örn: Görev Yöneticisi) yazarak Pardus karşılığını bulabilirsiniz.`,
    `<strong>Önemli:</strong> Tahtanız donduğunda fişi çekmeyin, güç düğmesine 10-15 saniye basılı tutarak güvenle kapatın.`,
    `<strong>Biliyor muydunuz?</strong> Pardus Kalem'de arka planı şeffaf yaparak Z-Kitap üzerine çizim yapabilirsiniz.`,
    `<strong>Güvenlik:</strong> Sınıftan çıkarken tahtanızı ETA USB Anahtarınız ile kilitlemeyi unutmayın.`
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