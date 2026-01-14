const CACHE_VERSION = 'v1.0.0'; // ИЗМЕНЯЙТЕ ПРИ КАЖДОМ ОБНОВЛЕНИИ
const CACHE_NAME = `construction-calculator-${CACHE_VERSION}`;
const urlsToCache = [
    '/construction-calculator/',
    '/construction-calculator/index.html',
    '/construction-calculator/manifest.json',
    '/construction-calculator/icons/icon-192.png',
    '/construction-calculator/icons/icon-512.png'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Всегда пытаемся получить свежую версию из сети
                return fetch(event.request)
                    .then(function(networkResponse) {
                        // Обновляем кэш новой версией
                        if (networkResponse) {
                            caches.open(CACHE_NAME).then(function(cache) {
                                cache.put(event.request, networkResponse.clone());
                            });
                            return networkResponse;
                        }
                    })
                    .catch(function() {
                        // Если сеть недоступна, используем кэш
                        return response;
                    });
            })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    // Удаляем старые версии кэша
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Немедленно берем контроль над клиентами
    return self.clients.claim();
});
