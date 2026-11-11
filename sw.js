/* DPV 앱 — 서비스 워커 (안전 우선)
   인터넷이 될 때는 늘 인터넷에서 받은 최신 화면을 그대로 씁니다 (받지 못할 때만 저장해 둔 사본).
   인터넷이 끊겼거나 먹통일 때는 저장해 둔 화면 파일(html·js·css)로 엽니다.
   교안·문서함·GitHub API 같은 데이터는 저장하지 않습니다. */
const CACHE = 'ws-app-v69';
const CORE = [
  './', 'index.html', 'gyoan.html', 'hangul.html', 'video.html', 'editor.html', 'present.html', 'shortcuts.html', 'manifest.webmanifest',
  'app/common.js', 'app/access.js', 'app/hub.css', 'app/hub.js', 'app/editor.js', 'app/present.js', 'app/prestime.js', 'app/folderlock.js', 'app/pptx.js', 'app/pptsym.js', 'app/pptin.js', 'app/bgai.js', 'app/ui.css', 'app/slide.css', 'app/pwa.js', 'app/appnav.js',
  'app/hwp/zip.js', 'app/hwp/hwpx.js', 'app/hwp/store.js', 'app/hwp/best.js', 'app/hwp/edit.js', 'app/hwp/ui.js', 'app/hwp/work.js', 'app/hwp/home.js', 'app/hwp/hwp.css',
  'app/video/core.js', 'app/video/dsp.js', 'app/video/chars.js', 'app/video/render.js', 'app/video/swap.js', 'app/video/player.js', 'app/video/timeline.js', 'app/video/tools.js', 'app/video/voices.js', 'app/video/sync.js', 'app/video/export.js', 'app/video/rec.js', 'app/video/panels.js', 'app/video/shorts.js', 'app/video/app.js', 'app/video/video.css',
  'videos.html', 'app/video/home.js', 'app/video/home.css',
  'secret.html', 'app/secret/secret.js', 'app/secret/secret.css', 'app/secret/companies.js',
  'app/icons/icon-192.png', 'app/icons/icon-512.png', 'app/icons/icon-maskable-512.png', 'app/icons/hangul-96.png', 'app/icons/gyoan-96.png', 'app/icons/video-96.png',
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
    /* 브라우저가 묵혀 둔 파일(서버가 10분 동안 그대로 쓰라고 한 것)을 쓰지 않고, 매번 서버에 새것인지 물어봄.
       새 버전을 올린 직후에 새 화면(html)과 옛 꾸밈·옛 스크립트(css·js)가 섞여 보이지 않게 하려는 것 — 바뀌지 않은 파일은 다시 받지 않는다 */
    const fresh = { cache: 'no-cache' };
    const net = nav ? fetch(req.url, fresh).then(r => r.redirected ? fetch(req) : r) : fetch(req, fresh);
    if (!cached) return net.then(r => { saveCopy(req, r); return r; }).catch(err => nav ? caches.match('index.html').then(m => { if (m) return m; throw err; }) : Promise.reject(err));
    return new Promise(resolve => {
      let done = false; const finish = (r) => { if (!done) { done = true; clearTimeout(timer); resolve(r); } };
      const timer = setTimeout(() => finish(cached.clone()), 6000); // 6초 넘게 대답이 없으면 사본으로
      net.then(r => { if (r.status >= 500) finish(cached.clone()); else { saveCopy(req, r); finish(r); } }, () => finish(cached.clone()));
    });
  });
}
/* 큰 동영상 (100MB 가 넘어 조각으로 나눠 올린 영상) — app/common.js 의 BIGV 와 짝
   주소: bigvideo/소유자/저장소/꼬리표/조각수-조각크기-전체크기/이름.mp4
   요청한 구간이 들어 있는 조각을 저장소에서 받아 그대로 흘려보냄 → 보통 영상 파일처럼 바로 재생·위치 이동이 됨.
   한 번에 조각 하나의 끝까지만 보내고, 나머지는 브라우저가 이어서 요청함. */
const BIGV = /^bigvideo\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(\d+)-(\d+)-(\d+)\/([^\/]+)$/;
const BIGV_RAW = 'https://raw.githubusercontent.com/';
function bigVideo(req, m) {
  const n = +m[4], cs = +m[5], total = +m[6];
  const part = (i) => `${BIGV_RAW}${m[1]}/${m[2]}/${m[3]}/p${String(i).padStart(4, '0')}`;
  const base = { 'Content-Type': /\.webm$/i.test(m[7]) ? 'video/webm' : /\.og[gv]$/i.test(m[7]) ? 'video/ogg' : 'video/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
  if (!(n > 0 && cs > 0 && total > 0)) return Promise.resolve(new Response('', { status: 404 }));
  const rm = /^bytes=(\d*)-(\d*)$/.exec((req.headers.get('range') || '').trim());
  if (!rm || (rm[1] === '' && rm[2] === '')) { // 구간 없이 통째로 달라는 요청: 조각을 차례로 이어 보냄
    let i = 0, rd = null;
    const body = new ReadableStream({
      async pull(c) {
        for (;;) {
          if (!rd) { if (i >= n) { c.close(); return; } const r = await fetch(part(i++)); if (!r.ok) throw new Error('part ' + r.status); rd = r.body.getReader(); }
          const { done, value } = await rd.read();
          if (done) { rd = null; continue; }
          c.enqueue(value); return;
        }
      },
      cancel() { if (rd) rd.cancel().catch(() => { }); },
    });
    return Promise.resolve(new Response(body, { status: 200, headers: Object.assign({ 'Content-Length': String(total) }, base) }));
  }
  let start, end = total - 1;
  if (rm[1] === '') start = Math.max(0, total - +rm[2]); else { start = +rm[1]; if (rm[2] !== '') end = Math.min(end, +rm[2]); }
  if (start >= total || start > end) return Promise.resolve(new Response('', { status: 416, headers: { 'Content-Range': 'bytes */' + total } }));
  const i = Math.floor(start / cs), off = start - i * cs, plen = Math.min(cs, total - i * cs);
  const last = Math.min(end, i * cs + plen - 1), want = last - start + 1, whole = off === 0 && want === plen;
  return fetch(part(i), whole ? {} : { headers: { Range: `bytes=${off}-${off + want - 1}` } }).then(async r => {
    if (!r.ok) return new Response('', { status: r.status === 404 ? 404 : 502 });
    const body = whole || r.status === 206 ? r.body : (await r.blob()).slice(off, off + want); // 구간 요청이 통하지 않으면 받아서 잘라 냄
    return new Response(body, { status: 206, headers: Object.assign({ 'Content-Range': `bytes ${start}-${last}/${total}`, 'Content-Length': String(want) }, base) });
  });
}
self.addEventListener('fetch', e => {
  try {
    const req = e.request; const u = new URL(req.url);
    if (req.method !== 'GET' || u.origin !== self.location.origin) return;
    const rel = u.pathname.slice(new URL(self.registration.scope).pathname.length); // 앱 폴더 기준 경로
    const bv = BIGV.exec(rel); if (bv) { e.respondWith(bigVideo(req, bv)); return; }      // 조각으로 올린 큰 영상
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname)) return;
    if (/^(api|decks|assets|hwp|best)\//.test(rel) || req.headers.has('range')) return;  // 교안·이미지·문서 같은 데이터는 그대로 둠
    if (req.mode !== 'navigate' && !SHELL.test(u.pathname)) return;
    e.respondWith(netFirst(req).catch(() => fetch(req)));
  } catch (err) { /* 문제가 생기면 끼어들지 않음 */ }
});
