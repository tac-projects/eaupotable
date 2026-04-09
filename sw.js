const CACHE_NAME = 'eaupotable-v9';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/css/variables.css',
  '/assets/css/base.css',
  '/assets/css/layout.css',
  '/assets/css/components.css',
  '/assets/css/responsive.css',
  '/assets/js/app.js',
  '/assets/img/favicon.svg',
  '/assets/img/logo.svg',
  '/assets/img/icons/icon-512-v3.png',
  '/assets/img/vignette-bg.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Grand+Hotel&display=swap'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie de cache : Cache First, then Network
self.addEventListener('fetch', (event) => {
  // On ne cache pas les appels API Mapbox ou Hub'Eau pour garder les données fraîches
  if (event.request.url.includes('api.mapbox.com') || event.request.url.includes('agriculture.gouv.fr') || event.request.url.includes('opendata')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Optionnel : Dynamiquement ajouter au cache ici si nécessaire
        return fetchResponse;
      });
    })
  );
});
