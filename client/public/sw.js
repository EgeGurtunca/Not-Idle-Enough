// Çevrimdışı oynanabilirlik.
//  - Kurulumda: index.html okunur, içindeki hash'li js/css varlıkları önden önbelleğe alınır.
//    (Dosya adları derlemede üretildiği için listeyi HTML'den türetiyoruz — build eklentisi yok.)
//  - Gezinme (HTML): ağ önce → güncellemeler hemen gelir, çevrimdışında önbellekten açılır.
//  - Varlıklar: önbellek önce → adlar içerik-hash'li, yani değişmez.
const CACHE = 'incrementaloth-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  try {
    const html = await fetch('./index.html', { cache: 'no-store' }).then((r) => r.text());
    const urls = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1]);
    if (urls.length) await cache.addAll(urls);
  } catch {
    /* varlık listesi çıkarılamazsa çalışma-zamanı önbelleklemesi devralır */
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const cacheable = (res) => res && res.ok && res.type !== 'opaque';

// put'u waitUntil'e bağlar: SW erken kapanırsa yazma yarıda kalmaz
function store(e, req, res) {
  if (cacheable(res)) {
    const copy = res.clone();
    e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // fontlar vb. dokunulmaz

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => store(e, req, res))
        .catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => store(e, req, res)))
  );
});
