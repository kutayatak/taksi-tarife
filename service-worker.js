// Bump VERSION for every release, including fare-data changes.
const VERSION = 'v1.5.0';
const BASE = new URL('./', self.location.href);
const PREFIX = `taksi-tarife:${BASE.pathname}:`;
const CACHE = PREFIX + VERSION;
const ASSETS = ['./', './index.html', './404.html', './styles.css', './app.js', './core.js', './gps.js', './manifest.json', './data/fares.js', './data/locations.js', './icons/taxi.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'].map(p => new URL(p, BASE).href);
self.addEventListener('install', event => {
  // Atomic shell: never activate a partial set of files.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Fetch sequentially to avoid request-pool contention on mobile browsers.
      for (const url of ASSETS) {
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (!response.ok) throw new Error(`Shell asset unavailable: ${url}`);
        await cache.put(url, response);
      }
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Versioned cache-first keeps UI modules and fare data consistent until update is accepted.
    if (request.mode === 'navigate') return await cache.match(new URL('./index.html', BASE).href) || fetch(request);
    return await cache.match(request, { ignoreSearch: true }) || fetch(request);
  })());
});
