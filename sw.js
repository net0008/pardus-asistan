const CACHE_NAME = 'pardus-asistan-v7.5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon.png',
  './datapc.json',
  './datamobil.json',
  // Eğer share-image.png kullandıysan onu da ekle, yoksa bu satırı sil:
  // './share-image.png' 
];

// 1. Kurulum (Dosyaları Önbelleğe Al)
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Kuruluyor...');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Dosyalar önbelleğe alınıyor');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Aktifleştirme (Eski Sürümleri Temizle)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Eski önbellek siliniyor:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. İstekleri Yakala (İnternet Yoksa Önbellekten Ver)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      // Önbellekte varsa onu döndür, yoksa internetten çek
      return response || fetch(e.request);
    }).catch(() => {
      // Hem internet yok hem önbellek yoksa (Örn: Hiç girilmemiş bir resim)
      // Buraya özel bir "offline.html" sayfası da yönlendirilebilir ama şimdilik gerek yok.
      console.log('İnternet yok ve kaynak önbellekte bulunamadı.');
    })
  );
});