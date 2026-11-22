/* بيتنا نظيف: تعمل اللعبة بلا إنترنت بعد أول زيارة.
   الصفحة تُجلب من الشبكة أولًا (فيرى اللاعب آخر تحديث) وتُعرض النسخة المحفوظة عند انقطاع الاتصال،
   والصور والأصوات ومكتبة Three.js والخط تُقدَّم من الجهاز بعد حفظها.
   عند أي تعديل على اللعبة ارفع رقم VERSION ليُحذف الحفظ القديم عند اللاعبين. */
const VERSION = 'v1';
const CACHE = 'beitna-' + VERSION;
const CORE = [
  './', 'index.html', 'manifest.webmanifest',
  'img/logo.webp', 'img/boy.png', 'img/dev-logo.png', 'img/favicon-32.png', 'img/apple-touch-icon.png',
  'img/icon-192.png', 'img/icon-512.png', 'img/icon-maskable-512.png',
  'audio/praise/a7sant.mp3', 'audio/praise/rae3.mp3', 'audio/praise/barak-allah-feek.mp3',
  'audio/praise/batal.mp3', 'audio/praise/3zeem.mp3', 'audio/praise/mmtaz.mp3',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  /* فشل عنصر واحد لا يُفشل الحفظ كله */
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('beitna-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* الصفحة نفسها: الشبكة أولًا، والنسخة المحفوظة عند الانقطاع */
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('.html'))) {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return r;
    }).catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }
  /* بقية الملفات (ومنها Three.js وخط Cairo): من الجهاز إن وُجدت، وإلا من الشبكة ثم تُحفظ */
  const cacheable = url.origin === location.origin || /(^|\.)(jsdelivr\.net|googleapis\.com|gstatic\.com)$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  })));
});
