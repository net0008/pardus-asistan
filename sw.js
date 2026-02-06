const CACHE_NAME = 'pardus-rehber-v2'; // Versiyonu v2 yaptık ki tarayıcı yenilesin
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/data.json',
  '/icon.png',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap'
];

// Yükleme Anı (Dosyaları hafızaya at)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Çalışma Anı (İnternet yoksa hafızadan getir)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});