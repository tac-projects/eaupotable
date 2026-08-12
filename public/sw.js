const CACHE_NAME = 'eaupotable-v43';
const ASSETS_TO_CACHE = [
  '/',
  '/img/favicon.svg',
  '/img/logo.svg',
  '/img/icons/google-search-icon.png',
  '/img/vignette-bg.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Grand+Hotel&display=swap'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On utilise return pour s'assurer que si un fichier manque, on le voit dans la console
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
  if (event.request.url.includes('api.mapbox.com') || event.request.url.includes('hubeau.eaufrance.fr')) {
    return;
  }

  // Ne pas intercepter les requêtes de développement (HMR)
  if (event.request.url.includes('_next') || event.request.url.includes('webpack')) {
     return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
