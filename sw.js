/* 업무 공간 앱 — 서비스 워커 (안전 우선)
   인터넷이 될 때는 어떤 요청에도 끼어들지 않습니다 → 늘 최신 화면, 서비스 워커 때문에 열리지 않는 일 없음.
   인터넷이 끊겼을 때만 저장해 둔 화면 파일(html·js·css)로 엽니다.
   교안·문서함·GitHub API 같은 데이터는 저장하지 않습니다. */
const CACHE = 'ws-app-v3';
const CORE = [
  './', 'index.html', 'gyoan.html', 'hangul.html', 'editor.html', 'present.html', 'shortcuts.html', 'manifest.webmanifest',
  'app/common.js', 'app/hub.js', 'app/editor.js', 'app/present.js', 'app/ui.css', 'app/slide.css', 'app/pwa.js',
  'app/hwp/zip.js', 'app/hwp/hwpx.js', 'app/hwp/store.js', 'app/hwp/edit.js', 'app/hwp/ui.js', 'app/hwp/hwp.css',
  'app/icons/icon-192.png',
];
function refresh() { // 화면 파일 사본을 새로 받아 둠 (실패한 파일은 예전 사본 유지)
  return caches.open(CACHE).then(c => Promise.all(CORE.map(u => fetch(new Request(u, { cache: 'reload' })).then(r => r.ok ? c.put(u, r) : null).catch(() => null))));
}
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(refresh()); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'refresh') e.waitUntil(refresh()); });
self.addEventListener('fetch', e => {
  if (self.navigator.onLine !== false) return; // 온라인: 브라우저가 직접 처리
  const req = e.request; const u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== self.location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(m => m || (req.mode === 'navigate' ? caches.match('index.html') : fetch(req))));
});
