const CACHE_NAME = 'pardus-asistan-v9.7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './mesaj.js',
  './manifest.json',
  './icon.png',
  './datamobil.json',
  './header-logo.png' 
];

// 1. Kurulum (Dosyaları Önbelleğe Al ve Beklemeden Geç)
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Kuruluyor...');
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Dosyalar önbelleğe alınıyor');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Aktifleştirme (Eski Sürümleri Temizle ve Hemen Kontrolü Al)
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

// 3. İstekleri Yakala (HTML/Veri/Script için Network-First, Diğer Statikler için Cache-First)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;
  if (!url.startsWith('http') || url.includes('googletagmanager.com') || url.includes('google-analytics.com')) {
    return;
  }

  // Sayfa gezinmeleri, HTML, JSON veya JS dosyalarında önce internetten günceli dene, internet yoksa önbellekten ver
  if (e.request.mode === 'navigate' || url.includes('.json') || url.includes('.js') || url.endsWith('.html')) {
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(e.request);
      })
    );
  } else {
    // Diğer statik dosyalar (CSS, Görseller, Fontlar)
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        return cachedResponse || fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, resClone);
            });
          }
          return networkResponse;
        });
      }).catch(() => {
        console.log('İnternet yok ve kaynak önbellekte bulunamadı.');
      })
    );
  }
});
