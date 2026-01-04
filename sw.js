// sw.js
const CACHE_NAME = 'antigravity-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0'
];

// Instalacja Service Workera i cache'owanie podstawowych plików
self.addEventListener('install', event => {
  self.skipWaiting(); // Wymuś natychmiastową aktywację
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Otwarto cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Aktywacja i czyszczenie starych cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Przejęcie kontroli nad stroną natychmiast
});

// Pobieranie zasobów - strategia: Cache First, potem Network + Dynamiczne Cache'owanie
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 1. Jeśli jest w cache, zwróć to
        if (response) {
          return response;
        }

        // 2. Jeśli nie ma, pobierz z sieci
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Sprawdź czy odpowiedź jest poprawna
            if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors' && response.type !== 'opaque') {
              return response;
            }

            // 3. Zapisz pobrany plik w cache na przyszłość (np. pliki czcionek)
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Opcjonalnie: Tu można zwrócić stronę offline.html jeśli istnieje
          // Ale w Twoim przypadku index.html jest już w cache
        });
      })
  );
});