/* 업무 공간 앱 — 서비스 워커 (안전 우선)
   인터넷이 될 때는 늘 인터넷에서 받은 최신 화면을 그대로 씁니다 (받지 못할 때만 저장해 둔 사본).
   인터넷이 끊겼거나 먹통일 때는 저장해 둔 화면 파일(html·js·css)로 엽니다.
   교안·문서함·GitHub API 같은 데이터는 저장하지 않습니다. */
const CACHE = 'ws-app-v4';
const CORE = [
  './', 'index.html', 'gyoan.html', 'hangul.html', 'editor.html', 'present.html', 'shortcuts.html', 'manifest.webmanifest',
  'app/common.js', 'app/hub.js', 'app/editor.js', 'app/present.js', 'app/ui.css', 'app/slide.css', 'app/pwa.js',
  'app/hwp/zip.js', 'app/hwp/hwpx.js', 'app/hwp/store.js', 'app/hwp/edit.js', 'app/hwp/ui.js', 'app/hwp/hwp.css',
  'app/icons/icon-192.png', 'app/icons/icon-512.png', 'app/icons/icon-maskable-512.png', 'app/icons/hangul-96.png', 'app/icons/gyoan-96.png',
];
function refresh() { // 화면 파일 사본을 새로 받아 둠 (실패한 파일은 예전 사본 유지)
  return caches.open(CACHE).then(c => Promise.all(CORE.map(u => fetch(new Request(u, { cache: 'reload' })).then(r => r.ok ? c.put(u, r) : null).catch(() => null))));
}
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(refresh()); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ws-app-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'refresh') e.waitUntil(refresh()); });
/* 화면 파일: 늘 인터넷에서 먼저 받고(= 늘 최신), 받지 못할 때만 저장해 둔 사본으로 엽니다.
   - 인터넷이 끊겼을 때, 그리고 "연결은 됐는데 먹통"인 와이파이(로그인 창이 뜨는 곳 등)에서도 앱이 열립니다.
   - 내 PC 서버(localhost)와 교안·이미지·API 요청에는 끼어들지 않습니다. */
const SHELL = /\.(html|js|css|png|svg|ico|webmanifest)$/i;
function saveCopy(req, res) { // 받은 최신 파일을 사본으로 (다음에 인터넷이 안 될 때 쓸 것)
  try { if (res && res.ok && res.type === 'basic') { const u = new URL(req.url); u.search = ''; const copy = res.clone(); caches.open(CACHE).then(c => c.put(u.href, copy)).catch(() => { }); } } catch (e) { }
}
function netFirst(req) {
  const nav = req.mode === 'navigate';
  return caches.match(req, { ignoreSearch: true }).then(cached => {
    const net = fetch(req);
    if (!cached) return net.then(r => { saveCopy(req, r); return r; }).catch(err => nav ? caches.match('index.html').then(m => { if (m) return m; throw err; }) : Promise.reject(err));
    return new Promise(resolve => {
      let done = false; const finish = (r) => { if (!done) { done = true; clearTimeout(timer); resolve(r); } };
      const timer = setTimeout(() => finish(cached.clone()), 6000); // 6초 넘게 대답이 없으면 사본으로
      net.then(r => { if (r.status >= 500) finish(cached.clone()); else { saveCopy(req, r); finish(r); } }, () => finish(cached.clone()));
    });
  });
}
self.addEventListener('fetch', e => {
  try {
    const req = e.request; const u = new URL(req.url);
    if (req.method !== 'GET' || u.origin !== self.location.origin) return;
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname)) return;
    const rel = u.pathname.slice(new URL(self.registration.scope).pathname.length); // 앱 폴더 기준 경로
    if (/^(api|decks|assets|hwp)\//.test(rel) || req.headers.has('range')) return;  // 교안·이미지·문서 같은 데이터는 그대로 둠
    if (req.mode !== 'navigate' && !SHELL.test(u.pathname)) return;
    e.respondWith(netFirst(req).catch(() => fetch(req)));
  } catch (err) { /* 문제가 생기면 끼어들지 않음 */ }
});
