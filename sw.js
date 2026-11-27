// Фоновый помощник приложения (service worker).
// Страница — всегда свежая из сети (если сети нет — последняя сохранённая копия).
// Картинки и библиотеки (Supabase, Stockfish) — из памяти устройства, в фоне обновляются.
// Данные игроков (сервер Supabase) не сохраняются — только из сети.
const CACHE = 'shashki-v22';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/app-192.png', './icons/app-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if(r.method !== 'GET') return;
  const u = new URL(r.url);
  if(u.hostname.endsWith('supabase.co')) return;
  if(r.mode === 'navigate'){
    e.respondWith(fetch(r).then(res => {
      if(res.ok){ const cp = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); }
      return res;
    }).catch(() => caches.match('./index.html').then(hit => hit || caches.match('./'))));
    return;
  }
  if(u.origin === location.origin || /(^|\.)unpkg\.com$|(^|\.)jsdelivr\.net$/.test(u.hostname)){
    e.respondWith(caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if(res.ok){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
