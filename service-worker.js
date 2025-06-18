// service-worker.js

const CACHE_NAME = 'aidanai-agenda-cache-v1';
// REFACTOR: Lista de recursos a cachear. Incluimos la raíz para capturar el HTML.
const urlsToCache = [
    './', // Cachea el archivo HTML principal (index.html o similar)
    'https://npmcdn.com/parse/dist/parse.min.js',
    './aiDANaI_icon_192.png',
    './aiDANaI_icon_512.png'
];

// Evento 'install': se dispara cuando el SW se instala por primera vez.
self.addEventListener('install', event => {
    // Realiza la instalación: abre el caché y añade los recursos principales.
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento 'fetch': se dispara cada vez que la página realiza una petición de red.
self.addEventListener('fetch', event => {
    // REFACTOR: Estrategia "Cache First". Ideal para rendimiento en apps.
    // Intenta responder desde el caché. Si no está, va a la red.
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si la respuesta está en el caché, la devuelve.
                if (response) {
                    return response;
                }

                // Si no, realiza la petición a la red.
                return fetch(event.request).then(
                    networkResponse => {
                        // Si la petición a la red falla, no hacemos nada (el usuario está offline y no tenemos el recurso).
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Opcional: Clonar la respuesta y guardarla en caché para la próxima vez.
                        // No lo hacemos para las peticiones a Parse API para no cachear datos.
                        if (!event.request.url.includes('back4app')) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        
                        return networkResponse;
                    }
                );
            })
    );
});

// Evento 'activate': se dispara cuando un nuevo SW se activa.
// Se usa para limpiar cachés antiguos.
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Si el nombre del caché no está en nuestra lista blanca, lo borramos.
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});