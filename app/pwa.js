/* 업무 공간 — 앱(PWA) 설치·실행
   설치하면 바탕화면·시작 메뉴·작업 표시줄에 '업무 공간' 아이콘이 생기고, 주소창 없는 앱 창으로 열립니다.
   크롬·엣지는 "페이지를 한 번 클릭하고 30초쯤 지나야" 설치 창(beforeinstallprompt)을 열어 주므로,
   그 전에 누르면 안내 창을 띄워 두었다가 준비되는 즉시 '지금 설치' 단추로 바꿉니다. */
(() => {
  const ok = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && ok) navigator.serviceWorker.register('sw.js?v=3', { updateViaCache: 'none' }).then(reg => {
    // 하루 한 번, 인터넷이 끊겼을 때 쓸 화면 파일 사본을 새로 받아 둠
    let last = 0; try { last = +localStorage.getItem('pwa:refreshed') || 0; } catch (e) { }
    if (Date.now() - last > 864e5 && reg.active) { reg.active.postMessage('refresh'); try { localStorage.setItem('pwa:refreshed', Date.now()); } catch (e) { } }
  }).catch(() => { });

  const ua = navigator.userAgent;
  const standalone = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches || navigator.standalone === true;
  const browser = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\//i.test(ua) ? 'inapp' : /Edg\//.test(ua) ? 'edge' : /Whale\//.test(ua) ? 'whale' : /SamsungBrowser/.test(ua) ? 'samsung' : /Firefox\//.test(ua) ? 'firefox' : /Chrome\//.test(ua) ? 'chrome' : /Safari\//.test(ua) ? 'safari' : 'other';
  const canInstall = ['chrome', 'edge', 'whale', 'samsung'].includes(browser) && ok;
  const PWA = window.PWA = { standalone, prompt: null, installed: false, browser, canInstall, install, start };
  document.documentElement.classList.toggle('in-app', standalone);
  const fire = () => window.dispatchEvent(new Event('pwa-change'));

  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.prompt = e; fire(); pill(); refreshGuide(); });
  window.addEventListener('appinstalled', () => { PWA.prompt = null; PWA.installed = true; try { localStorage.setItem('pwa:installed', '1'); } catch (e) { } fire(); pill(); refreshGuide(); });
  async function install() {
    if (!PWA.prompt) return false;
    const p = PWA.prompt; PWA.prompt = null;
    p.prompt();
    const r = await p.userChoice.catch(() => ({ outcome: 'dismissed' }));
    fire(); pill();
    return r.outcome === 'accepted';
  }
  /* '앱으로 설치' 단추: 준비됐으면 바로 설치 창, 아니면 안내 창 */
  async function start() {
    if (PWA.prompt) { const ok = await install(); if (ok) showGuide('done'); return; }
    showGuide('wait');
  }

  /* ---------- 안내 창 ---------- */
  let guide = null, timer = null;
  const NAME = { chrome: '크롬은', edge: '엣지는', whale: '웨일은', samsung: '삼성 인터넷은' }[browser] || '브라우저는';
  function css() {
    if (document.getElementById('pwaCss')) return;
    const s = document.createElement('style'); s.id = 'pwaCss';
    s.textContent = `
#pwaGuide{position:fixed;inset:0;z-index:200;background:rgba(10,14,22,.55);display:grid;place-items:center;padding:16px;font-family:"Pretendard Variable","Malgun Gothic",sans-serif}
#pwaGuide .box{background:#fff;color:#1f2430;border-radius:16px;width:min(520px,100%);padding:24px 24px 20px;box-shadow:0 30px 80px rgba(0,0,0,.35)}
#pwaGuide h3{margin:0 0 6px;font-size:19px}
#pwaGuide p{margin:6px 0;line-height:1.65;font-size:14px;color:#3b4252}
#pwaGuide .bar{margin:14px 0;display:flex;align-items:center;gap:8px;background:#f1f3f6;border:1px solid #dde1e7;border-radius:999px;padding:7px 10px 7px 14px;font-size:13px;color:#555}
#pwaGuide .bar .url{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#pwaGuide .bar .ico{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;border:2px solid #1f7a5a;color:#1f7a5a;font-weight:800;animation:pwaBlink 1.2s infinite}
@keyframes pwaBlink{50%{background:#d9ece4;transform:scale(1.12)}}
#pwaGuide .row{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
#pwaGuide button{border:1px solid #d5d9e0;background:#fff;color:#1f2430;border-radius:10px;padding:10px 16px;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer}
#pwaGuide button.go{background:#1f7a5a;border-color:#1f7a5a;color:#fff}
#pwaGuide button.go[disabled]{background:#9fb8ad;border-color:#9fb8ad;cursor:default}
#pwaGuide .prog{height:6px;background:#eef0f3;border-radius:9px;overflow:hidden;margin-top:12px}
#pwaGuide .prog i{display:block;height:100%;width:0;background:#1f7a5a;transition:width 1s linear}
#pwaGuide small{color:#6b7384}`;
    document.head.appendChild(s);
  }
  function showGuide(mode) {
    css(); closeGuide(true);
    guide = document.createElement('div'); guide.id = 'pwaGuide'; guide.dataset.mode = mode;
    guide.addEventListener('mousedown', e => { if (e.target === guide) closeGuide(); });
    document.body.appendChild(guide);
    if (mode === 'wait') { guide.dataset.t0 = Date.now(); timer = setInterval(refreshGuide, 1000); }
    refreshGuide();
  }
  function closeGuide(silent) { if (timer) { clearInterval(timer); timer = null; } if (guide) { guide.remove(); guide = null; } }
  function refreshGuide() {
    if (!guide) return;
    const url = location.origin + location.pathname.replace(/[^/]*$/, '');
    let h = '';
    if (PWA.installed || guide.dataset.mode === 'done') {
      h = `<h3>✅ 설치했습니다</h3><p>업무 공간 앱 창이 열렸을 거예요. 앞으로는 <b>바탕화면</b>이나 <b>시작 메뉴</b>, <b>작업 표시줄</b>의 <b>업무 공간</b> 아이콘으로 여세요.</p><p><small>작업 표시줄에 고정하려면: 앱 아이콘 오른쪽 클릭 → 작업 표시줄에 고정</small></p><div class="row"><button class="go" data-c>확인</button></div>`;
    } else if (!canInstall) {
      const why = browser === 'inapp' ? '카카오톡·네이버 앱 안의 브라우저에서는 앱을 설치할 수 없습니다.' : browser === 'firefox' || browser === 'safari' ? '이 브라우저는 앱 설치를 지원하지 않습니다.' : !ok ? '보안 주소(https)에서만 설치할 수 있습니다.' : '이 브라우저에서는 앱 설치가 안 될 수 있습니다.';
      h = `<h3>크롬이나 엣지에서 열어 주세요</h3><p>${why}<br><b>크롬</b> 또는 <b>엣지</b>로 아래 주소를 열면 단추 한 번으로 설치됩니다.</p><div class="bar"><span class="url">${url}</span></div><div class="row"><button data-copy>주소 복사</button><button class="go" data-c>닫기</button></div>`;
    } else if (PWA.prompt) {
      h = `<h3>설치 준비가 됐습니다</h3><p>아래 단추를 누르고, 뜨는 창에서 <b>설치</b>를 누르면 끝입니다.</p><div class="row"><button data-c>나중에</button><button class="go" data-go>⬇ 지금 설치</button></div>`;
    } else {
      const sec = Math.max(0, 30 - Math.round((Date.now() - (+guide.dataset.t0 || Date.now())) / 1000));
      const pct = Math.min(100, (30 - sec) / 30 * 100);
      h = `<h3>잠시만요 — 설치를 준비하고 있습니다</h3><p>${NAME} 처음 연 페이지를 잠깐 둘러본 뒤에 설치를 허용합니다. 준비되면 아래 단추가 <b>‘지금 설치’</b>로 바뀝니다.</p><div class="prog"><i style="width:${pct}%"></i></div><p><small>기다리기 싫으면: 주소창 오른쪽의 설치 아이콘을 바로 눌러도 됩니다.</small></p><div class="bar"><span class="url">${url}</span><span class="ico" title="주소창 오른쪽에 이런 아이콘이 있습니다">⊕</span></div><p><small>이미 설치했다면 이 창을 닫고 바탕화면·시작 메뉴의 <b>업무 공간</b> 아이콘으로 여세요. ${sec === 0 ? '<br>준비가 오래 걸리면 이 페이지를 한 번 클릭한 뒤 기다려 주세요.' : ''}</small></p><div class="row"><button data-c>닫기</button><button class="go" disabled>⬇ 지금 설치 ${sec ? `(${sec}초)` : ''}</button></div>`;
    }
    if (guide.dataset.h !== h) {
      guide.dataset.h = h;
      guide.innerHTML = `<div class="box">${h}</div>`;
      const q = s => guide.querySelector(s);
      if (q('[data-c]')) q('[data-c]').onclick = () => closeGuide();
      if (q('[data-go]')) q('[data-go]').onclick = async () => { const done = await install(); if (done) { guide.dataset.mode = 'done'; refreshGuide(); } else closeGuide(); };
      if (q('[data-copy]')) q('[data-copy]').onclick = e => { navigator.clipboard && navigator.clipboard.writeText(url).then(() => { e.target.textContent = '복사했습니다'; }).catch(() => { }); };
    }
  }

  /* 브라우저 탭으로 열었을 때: 오른쪽 아래에 '앱으로 설치' 단추 (첫 화면은 본문에 큰 단추가 따로 있음) */
  const PAGE = (location.pathname.split('/').pop() || 'index.html');
  function pill() {
    let el = document.getElementById('pwaPill');
    let hide = false; try { hide = !!sessionStorage.getItem('pwa:hide'); } catch (e) { }
    const want = !standalone && canInstall && !PWA.installed && /^(gyoan\.html|hangul\.html)$/.test(PAGE) && !hide;
    if (!want) { if (el) el.remove(); return; }
    if (el) return;
    el = document.createElement('div'); el.id = 'pwaPill';
    el.innerHTML = '<button type="button" data-i>⬇ 앱으로 설치</button><button type="button" data-x title="닫기">✕</button>';
    el.style.cssText = 'position:fixed;left:16px;bottom:40px;z-index:90;display:flex;align-items:center;background:#1f7a5a;color:#fff;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.25);font:600 13px/1 "Pretendard Variable","Malgun Gothic",sans-serif;overflow:hidden';
    el.querySelectorAll('button').forEach(b => { b.style.cssText = 'background:none;border:0;color:#fff;font:inherit;padding:10px 14px;cursor:pointer'; });
    el.querySelector('[data-x]').style.padding = '10px 12px 10px 4px';
    el.querySelector('[data-i]').onclick = () => start();
    el.querySelector('[data-x]').onclick = () => { try { sessionStorage.setItem('pwa:hide', '1'); } catch (e) { } el.remove(); };
    (document.body || document.documentElement).appendChild(el);
  }
  if (document.body) pill(); else document.addEventListener('DOMContentLoaded', pill);
  fire();
})();
