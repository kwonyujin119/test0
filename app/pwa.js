/* DPV — 앱 설치·실행 (사용자가 따로 방법을 찾지 않게)
   1) [앱 설치] → 브라우저가 허락하면 바로 설치 창
   2) 다른 앱 안에서 연 화면(카톡 · 크롬 커스텀 탭 등)이라 설치가 안 되면 → 크롬 앱(카톡은 기본 브라우저)으로 이 화면을 바로 열고,
      거기서 [설치] 단추 하나만 뜨게 함 (?install=1)
   3) 이미 설치돼 있으면 → 설치된 DPV 앱으로 바로 엶 (안드로이드)
   4) 아이폰은 Apple 이 코드로 설치를 허락하지 않아, 공유 단추 위치만 한 줄로 알림
   3) Windows 는 '설치 파일'(바탕화면·시작 메뉴 아이콘을 만들어 앱 창으로 엶)도 제공 — 브라우저 사정과 무관하게 항상 됨 */
(() => {
  const ok = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && ok) navigator.serviceWorker.register('sw.js?v=6', { updateViaCache: 'none' }).then(reg => {
    // 하루 한 번, 인터넷이 끊겼을 때 쓸 화면 파일 사본을 새로 받아 둠
    let last = 0; try { last = +localStorage.getItem('pwa:refreshed') || 0; } catch (e) { }
    if (Date.now() - last > 864e5 && reg.active) { reg.active.postMessage('refresh'); try { localStorage.setItem('pwa:refreshed', Date.now()); } catch (e) { } }
  }).catch(() => { });

  const ua = navigator.userAgent;
  const os = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(ua) ? 'android' : /Windows/.test(ua) ? 'windows' : /Mac OS X/.test(ua) ? 'mac' : 'other';
  const browser = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\//i.test(ua) ? 'inapp' : /Edg\//.test(ua) ? 'edge' : /Whale\//.test(ua) ? 'whale' : /SamsungBrowser/.test(ua) ? 'samsung' : /Firefox\/|FxiOS/.test(ua) ? 'firefox' : /CriOS/.test(ua) ? 'chrome-ios' : /Chrome\//.test(ua) ? 'chrome' : /Safari\//.test(ua) ? 'safari' : 'other';
  const standalone = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches || navigator.standalone === true;
  const loadedAt = Date.now();
  const fromApp = /^android-app:/.test(document.referrer || ''); // 다른 앱이 크롬 커스텀 탭으로 연 화면이면 대개 이렇게 표시됨
  const PWA = window.PWA = { standalone, prompt: null, installed: false, browser, os, install, start };
  document.documentElement.classList.toggle('in-app', standalone);
  const fire = () => window.dispatchEvent(new Event('pwa-change'));
  // 이미 설치돼 있는지 (크롬·엣지가 알려 주는 경우)
  if (navigator.getInstalledRelatedApps) navigator.getInstalledRelatedApps().then(list => { if (list && list.length) { PWA.installed = true; fire(); pill(); refreshGuide(); } }).catch(() => { });

  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.prompt = e; PWA.installed = false; fire(); pill(); refreshGuide(); });
  window.addEventListener('appinstalled', () => { PWA.prompt = null; PWA.installed = true; fire(); pill(); note('설치했습니다. 바탕화면 · 홈 화면의 DPV 아이콘으로 여세요'); });
  async function install() {
    if (!PWA.prompt) return false;
    const p = PWA.prompt; PWA.prompt = null;
    try { await p.prompt(); } catch (e) { return false; }
    const r = await p.userChoice.catch(() => ({ outcome: 'dismissed' }));
    fire(); pill();
    return r.outcome === 'accepted';
  }
  /* '앱 설치' 단추: 설명 없이 바로 설치 창. 안 되는 경우만 한 줄 알림 */
  const note = (msg, act) => { if (typeof toast === 'function') toast(msg, act ? 7000 : 4500, act); else alert(msg); };
  const canPrompt = () => os !== 'ios' && browser !== 'inapp' && browser !== 'firefox' && !standalone;
  const waitPrompt = ms => new Promise(res => {
    if (PWA.prompt) return res(true);
    const on = () => { clearTimeout(t); res(true); };
    const t = setTimeout(() => { window.removeEventListener('beforeinstallprompt', on); res(false); }, ms);
    window.addEventListener('beforeinstallprompt', on, { once: true });
  });
  const here = extra => { const u = new URL(location.href); u.hash = ''; u.searchParams.delete('install'); if (extra) for (const k in extra) u.searchParams.set(k, extra[k]); return u; };
  const intentFor = (u, pkg) => `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;${pkg ? `package=${pkg};` : ''}S.browser_fallback_url=${encodeURIComponent(u.href)};end`;
  const toChrome = () => { location.href = intentFor(here({ install: '1' }), 'com.android.chrome'); };
  const openApp = () => { if (os === 'android') location.href = intentFor(here()); else note('이미 설치되어 있습니다 — 바탕화면 · 시작 메뉴의 DPV 아이콘으로 여세요'); };
  /* 단추 하나짜리 창 (설명 대신) */
  function sheet(o) {
    css(); closeGuide();
    guide = document.createElement('div'); guide.id = 'pwaGuide'; guide.dataset.mode = 'sheet';
    guide.setAttribute('role', 'dialog'); guide.setAttribute('aria-modal', 'true'); guide.setAttribute('aria-label', o.title);
    guide.innerHTML = `${o.point ? `<div class="pwa-point" aria-hidden="true"><b>↑</b><span>바로 위 ⋮ 메뉴 → ${o.point}</span></div>` : ''}<div class="box"><h3>${o.title}</h3>${o.text ? `<p>${o.text}</p>` : ''}${o.label ? `<button class="btn ink big" data-go>${ic(o.icon || 'download')}${o.label}</button>` : ''}<div class="row">${o.copy ? '<button class="btn ghost" data-cp>주소 복사</button>' : ''}<button class="btn ${o.label ? 'ghost' : 'ink'}" data-c>${o.label ? '나중에' : '확인'}</button></div></div>`;
    guide.addEventListener('mousedown', e => { if (e.target === guide) closeGuide(); });
    guide.addEventListener('keydown', e => { if (e.key === 'Escape') closeGuide(); });
    document.body.appendChild(guide);
    guide.querySelector('[data-c]').onclick = () => closeGuide();
    const cp = guide.querySelector('[data-cp]'); if (cp) cp.onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(() => { cp.textContent = '복사했습니다'; }).catch(() => { window.prompt('이 주소를 복사하세요', location.href); }); };
    const go = guide.querySelector('[data-go]'); if (go) { go.onclick = () => { closeGuide(); o.run(); }; go.focus(); }
  }
  function cctSheet() {
    try { history.replaceState(null, '', here({ install: '1' }).href); } catch (e) { }
    sheet(fromApp
      ? { title: '크롬으로 한 번만 열어 주세요', point: 'Chrome에서 열기', copy: true, text: '지금 화면은 다른 앱 안에 열린 창이라, 안드로이드가 여기서는 앱 설치를 막아 둡니다. 오른쪽 위 <b>⋮</b> → <b>[Chrome에서 열기]</b> 를 누르면 열린 크롬 화면에 <b>[설치]</b> 단추가 바로 떠 있습니다.' }
      : { title: '오른쪽 위 ⋮ 에서 한 번만 눌러 주세요', point: '앱 설치 · Chrome에서 열기', copy: true, text: '이 화면에서는 브라우저가 바로 설치 창을 허락하지 않았습니다. 오른쪽 위 <b>⋮</b> 메뉴의 <b>[앱 설치]</b>(또는 <b>[홈 화면에 추가]</b>)를 누르세요. 메뉴에 <b>[Chrome에서 열기]</b> 가 있으면 그것을 누르면, 열린 화면에 <b>[설치]</b> 단추가 바로 떠 있습니다.<br><br><b>'앱이 이미 설치되어 있습니다'</b> 가 뜨면: 예전에 설치한 DPV(이전 이름 <b>업무 공간</b>) 앱이 기기에 남아 있는 것입니다. 홈 화면 아이콘만 지우면 앱은 앱스 화면에 그대로 남습니다. 그 줄을 누르면 바로 열리고, 새로 설치하려면 앱스 화면에서 그 앱을 길게 눌러 <b>[설치 삭제]</b> 후 다시 누르세요.' });
  }
  const askInstall = () => sheet({ title: 'DPV 앱 설치', text: '아래 단추를 누르고, 뜨는 창에서 [설치] 를 누르면 끝납니다.', label: '설치', run: async () => { if (!(await install())) note('설치를 취소했습니다. 다시 누르면 언제든 설치할 수 있습니다'); } });
  let starting = false;
  async function start() {
    if (starting) return; starting = true;
    try {
      /* 카카오톡 안: 기본 브라우저로 바로 (거기서 [설치] 하나) */
      if (/KAKAOTALK/i.test(ua)) { location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(here({ install: '1' }).href); return; }
      if (browser === 'inapp' && os === 'android') return toChrome();
      if (PWA.installed) return openApp();
      if (!PWA.prompt && canPrompt()) { const left = 3000 - (Date.now() - loadedAt); if (left > 200) { note('설치 창을 여는 중…'); await waitPrompt(left); } }
      if (PWA.prompt) { if (!(await install())) note('설치를 취소했습니다. 다시 누르면 언제든 설치할 수 있습니다'); return; } // 설치되면 appinstalled 가 알림
      if (PWA.installed) return openApp();
      /* 안드로이드인데 설치 창이 안 옴 = 다른 앱 안에서 연 화면(크롬 커스텀 탭 등)이거나 이미 설치됨 → 크롬 앱으로 이 화면을 열어 거기서 마무리 */
      if (os === 'android') return browser === 'chrome' ? cctSheet() : toChrome(); // 크롬 밖(삼성 인터넷 · 앱 안 화면 등)은 크롬 앱으로
      if (os === 'ios') {
        if (browser === 'inapp') return note('이 앱 안 화면에서는 설치할 수 없습니다 — 오른쪽 위 메뉴에서 [Safari 로 열기] 를 눌러 주세요');
        return note(browser === 'safari' ? '아래 가운데 공유 단추(□↑) → [홈 화면에 추가] 를 누르면 설치됩니다' : '주소창 오른쪽 공유 단추(□↑) → [홈 화면에 추가] 를 누르면 설치됩니다', { label: '그림으로 보기', run: () => showGuide('help') });
      }
      if (os === 'windows') return sheet({ title: 'DPV 앱 설치', text: '이 브라우저에서는 바로 설치가 되지 않아 설치 파일로 설치합니다. 받은 파일을 열면 바탕화면 · 시작 메뉴에 DPV 아이콘이 생깁니다. (이미 설치했다면 주소창 오른쪽의 앱 아이콘으로 여세요)', label: '설치 파일 받기', run: () => { const a = document.createElement('a'); a.href = 'install/setup.cmd'; a.download = 'DPV 설치.cmd'; document.body.appendChild(a); a.click(); a.remove(); } });
      note('이 브라우저에서는 바로 설치가 되지 않습니다 — 크롬이나 엣지로 열어 주세요', { label: '다른 방법', run: () => showGuide('help') });
    } finally { starting = false; }
  }

  /* ---------- 안내 창 (꾸밈은 ui.css 토큰 · 단추는 .btn) ---------- */
  const ic = (n, z) => (typeof icon === 'function' ? icon(n, z || 18) : '');
  let guide = null;
  function css() {
    if (document.getElementById('pwaCss')) return;
    const s = document.createElement('style'); s.id = 'pwaCss';
    s.textContent = `
#pwaGuide{position:fixed;inset:0;z-index:1000;background:var(--ui-overlay);display:grid;place-items:center;padding:16px;overflow:auto}
#pwaGuide .box{background:var(--ui-panel);color:var(--ui-fg);border-radius:16px;width:min(560px,100%);padding:24px;box-shadow:var(--ui-shadow);max-height:calc(100vh - 32px);overflow:auto;word-break:keep-all;overflow-wrap:anywhere}
#pwaGuide h3{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:var(--fs-lg);line-height:var(--lh-lg)}
#pwaGuide h3 .ico{color:var(--ui-ok)}
#pwaGuide h4{margin:0 0 6px;font-size:var(--fs-md);font-weight:600}
#pwaGuide p{margin:6px 0;line-height:1.65;color:var(--ui-muted)}
#pwaGuide p b,#pwaGuide li b{color:var(--ui-fg)}
#pwaGuide ol{margin:6px 0 0;padding-left:20px;line-height:1.85}
#pwaGuide .bar{margin:8px 0 4px;display:flex;align-items:center;gap:8px;background:var(--ui-panel);border:1px solid var(--ui-border);border-radius:999px;padding:6px 8px 6px 14px;font-size:var(--fs-xs);color:var(--ui-muted)}
#pwaGuide .bar .url{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#pwaGuide .bar .pin{width:28px;height:24px;border-radius:6px;display:grid;place-items:center;border:2px solid var(--ui-accent);color:var(--ui-accent);font-size:var(--fs-sm);animation:pwaBlink 1.2s infinite}
#pwaGuide .bar .dots{width:24px;text-align:center;font-weight:800}
@keyframes pwaBlink{50%{background:var(--ui-accent-soft)}}
#pwaGuide .row{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
#pwaGuide .big{width:100%;height:44px;margin-top:8px;justify-content:center;font-size:var(--fs-lg)}
#pwaGuide .card{border:1px solid var(--ui-border);border-radius:12px;padding:12px 14px;margin-top:12px;background:var(--ui-panel2)}
#pwaGuide small{color:var(--ui-muted);font-size:var(--fs-xs);line-height:1.6}
#pwaGuide .pwa-point{position:fixed;top:6px;right:6px;display:flex;flex-direction:column;align-items:flex-end;gap:4px;pointer-events:none;animation:pwaNudge 1s ease-in-out infinite}
#pwaGuide .pwa-point b{width:44px;height:44px;margin-right:2px;border-radius:50%;display:grid;place-items:center;background:var(--ui-ink);color:var(--ui-on-ink);font-size:24px;line-height:1;box-shadow:var(--ui-shadow)}
#pwaGuide .pwa-point span{padding:6px 12px;border-radius:999px;background:var(--ui-ink);color:var(--ui-on-ink);font-size:var(--fs-sm);font-weight:700;white-space:nowrap;box-shadow:var(--ui-shadow)}
@keyframes pwaNudge{50%{transform:translateY(-4px)}}
@media (prefers-reduced-motion:reduce){#pwaGuide .pwa-point{animation:none}}
#pwaPill{position:fixed;left:16px;bottom:40px;z-index:90;display:flex;align-items:center;background:var(--ui-ink);color:var(--ui-on-ink);border-radius:999px;box-shadow:var(--ui-shadow-sm);font-size:var(--fs-sm);font-weight:600;overflow:hidden}
#pwaPill button{display:inline-flex;align-items:center;gap:6px;height:40px;background:none;border:0;color:inherit;font:inherit;padding:0 14px;cursor:pointer}
#pwaPill [data-x]{padding:0 12px 0 4px}
#pwaPill .ico{width:16px;height:16px}`;
    document.head.appendChild(s);
  }
  function showGuide(mode) {
    css(); closeGuide();
    guide = document.createElement('div'); guide.id = 'pwaGuide'; guide.dataset.mode = mode || 'help';
    guide.setAttribute('role', 'dialog'); guide.setAttribute('aria-modal', 'true'); guide.setAttribute('aria-label', 'DPV 앱 설치');
    guide.addEventListener('mousedown', e => { if (e.target === guide) closeGuide(); });
    guide.addEventListener('keydown', e => { if (e.key === 'Escape') closeGuide(); });
    document.body.appendChild(guide);
    refreshGuide();
  }
  function closeGuide() { if (guide) { guide.remove(); guide = null; } }
  const URL0 = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  function steps() {
    const bar = icon => `<div class="bar"><span class="url">${URL0()}</span>${icon}</div>`;
    switch (browser) {
      case 'chrome':
        if (os === 'android') return `<h4>휴대폰 크롬에서 설치하기</h4>${bar('<span class="dots">⋮</span>')}<ol><li>오른쪽 위 <kbd>⋮</kbd> → <kbd>홈 화면에 추가</kbd> (또는 <kbd>앱 설치</kbd>) → <kbd>설치</kbd></li><li>홈 화면에 생긴 <b>DPV</b> 아이콘으로 엽니다.</li></ol>`;
        return `<h4>크롬에서 설치하기</h4>${bar('<span class="pin" title="설치 아이콘">⇩</span><span class="dots">⋮</span>')}<ol><li>주소창 <b>오른쪽 끝</b>의 <b>설치 아이콘</b>(모니터에 ↓ 모양)을 누르고 <kbd>설치</kbd></li><li>아이콘이 안 보이면: 오른쪽 위 <kbd>⋮</kbd> → <kbd>전송, 저장, 공유</kbd> → <kbd>페이지를 앱으로 설치…</kbd> (또는 <kbd>DPV 설치…</kbd>) → <kbd>설치</kbd></li></ol>`;
      case 'edge': return `<h4>엣지에서 설치하기</h4>${bar('<span class="pin" title="앱 설치 아이콘">⊞</span><span class="dots">⋯</span>')}<ol><li>오른쪽 위 <kbd>⋯</kbd> → <kbd>앱</kbd> → <kbd>이 사이트를 앱으로 설치</kbd> → <kbd>설치</kbd></li><li>또는 주소창 오른쪽의 <b>앱 설치 아이콘</b>을 누르고 <kbd>설치</kbd></li></ol>`;
      case 'whale': return `<h4>웨일에서 설치하기</h4>${bar('<span class="pin" title="설치 아이콘">⇩</span><span class="dots">≡</span>')}<ol><li>주소창 오른쪽의 <b>설치 아이콘</b>을 누르고 <kbd>설치</kbd></li><li>안 보이면 크롬이나 엣지로 이 주소를 열어 설치하는 것이 가장 확실합니다.</li></ol>`;
      case 'samsung': return `<h4>삼성 인터넷에서 설치하기</h4><ol><li>아래 메뉴 <kbd>≡</kbd> → <kbd>현재 페이지 추가</kbd> → <kbd>홈 화면</kbd></li></ol>`;
      case 'chrome-ios': case 'safari':
        if (os === 'ios') return `<h4>아이폰·아이패드에서 설치하기</h4><ol><li>${browser === 'safari' ? '아래쪽' : '주소창 오른쪽'} <b>공유 단추</b>(□↑) 누르기</li><li><kbd>홈 화면에 추가</kbd> → <kbd>추가</kbd></li></ol>`;
        return `<h4>이 브라우저는 앱 설치를 지원하지 않습니다</h4><p>크롬이나 엣지로 아래 주소를 열어 주세요.</p>${bar('')}`;
      case 'inapp': return `<h4>카카오톡·네이버 앱 안에서는 설치할 수 없습니다</h4><p>화면의 <b>⋮</b> 또는 <b>공유</b> → <kbd>다른 브라우저로 열기</kbd>(크롬)를 누른 뒤 다시 설치하세요.</p>${bar('')}`;
      default: return `<h4>크롬이나 엣지에서 설치하세요</h4><p>이 브라우저(${browser === 'firefox' ? '파이어폭스' : '현재 브라우저'})는 앱 설치를 지원하지 않습니다. 크롬 또는 엣지로 아래 주소를 열어 주세요.</p>${bar('')}`;
    }
  }
  function refreshGuide() {
    if (!guide || guide.dataset.mode === 'sheet') return;
    const mode = guide.dataset.mode; let h = '';
    if (mode === 'done') {
      h = /ios|android/.test(os) ? `<h3>${ic('check', 20)}설치했습니다</h3><p>앞으로는 <b>홈 화면</b>의 <b>DPV</b> 아이콘으로 여세요. 주소창 없이 앱처럼 열립니다.</p><div class="row"><button class="btn ink" data-c>확인</button></div>`
        : `<h3>${ic('check', 20)}설치했습니다</h3><p>DPV 앱 창이 열렸을 거예요. 앞으로는 <b>바탕화면</b>·<b>시작 메뉴</b>의 <b>DPV</b> 아이콘으로 여세요.</p><p><small>작업 표시줄에 고정: 앱 창의 작업 표시줄 아이콘을 오른쪽 클릭 → <b>작업 표시줄에 고정</b></small></p><div class="row"><button class="btn ink" data-c>확인</button></div>`;
    } else {
      h = `<h3>DPV 앱 설치</h3>`;
      if (PWA.prompt) h += `<p>지금 바로 설치할 수 있습니다. 아래 단추를 누르고 뜨는 창에서 <b>설치</b>를 누르세요.</p><button class="btn ink big" data-go>${ic('download')}지금 설치</button>`;
      else if (PWA.installed) h += `<div class="card"><b>이미 설치되어 있습니다.</b><br><small>${/ios|android/.test(os) ? '홈 화면' : '바탕화면·시작 메뉴'}의 <b>DPV</b> 아이콘으로 여세요. 이 브라우저 창에서는 주소창 오른쪽의 <b>앱에서 열기</b> 아이콘을 눌러도 앱으로 열립니다.</small></div>`;
      else h += `<p>아래 방법 중 편한 것을 쓰세요. 한 번만 하면 됩니다.</p>`;
      h += `<div class="card">${steps()}</div>`;
      if (os === 'windows') h += `<div class="card"><h4>안 되면 — Windows 설치 파일 (항상 됩니다)</h4><p><small>내려받은 <b>DPV 설치.cmd</b> 를 열면 바탕화면·시작 메뉴에 <b>DPV</b> 아이콘이 생기고, 주소창 없는 앱 창으로 열립니다 (크롬 또는 엣지 사용).<br>열 때 <b>"Windows의 PC 보호"</b> 창이 뜨면 <b>추가 정보 → 실행</b>, 브라우저가 파일을 막으면 <b>유지</b>를 누르세요.</small></p><a class="btn big" href="install/setup.cmd" download="DPV 설치.cmd">${ic('download')}Windows 설치 파일 내려받기</a></div>`;
      h += `<div class="row">${!['chrome', 'edge', 'whale', 'samsung'].includes(browser) || os === 'ios' ? '<button class="btn" data-copy>주소 복사</button>' : ''}<button class="btn" data-c>닫기</button></div>`;
    }
    if (guide.dataset.h === h) return;
    guide.dataset.h = h;
    guide.innerHTML = `<div class="box">${h}</div>`;
    const q = s => guide.querySelector(s);
    if (q('[data-c]')) { q('[data-c]').onclick = () => closeGuide(); q('[data-c]').focus(); }
    if (q('[data-go]')) q('[data-go]').onclick = async () => { const done = await install(); if (!guide) return; guide.dataset.mode = done ? 'done' : 'help'; refreshGuide(); }; // 취소했으면 설치 단추 대신 방법 안내
    if (q('[data-copy]')) q('[data-copy]').onclick = e => { (navigator.clipboard ? navigator.clipboard.writeText(URL0()) : Promise.reject()).then(() => { e.target.textContent = '복사했습니다'; }).catch(() => { prompt('이 주소를 복사하세요', URL0()); }); };
  }

  /* 두 작업장 첫 화면: 왼쪽 아래 '앱으로 설치' 단추 */
  const PAGE = (location.pathname.split('/').pop() || 'index.html');
  function pill() {
    let el = document.getElementById('pwaPill');
    let hide = false; try { hide = !!sessionStorage.getItem('pwa:hide'); } catch (e) { }
    const want = !standalone && !PWA.installed && /^(gyoan\.html|hangul\.html)$/.test(PAGE) && !hide;
    if (!want) { if (el) el.remove(); return; }
    if (el) return;
    css();
    el = document.createElement('div'); el.id = 'pwaPill';
    el.innerHTML = `<button type="button" data-i>${ic('download', 16)}앱으로 설치</button><button type="button" data-x title="닫기" aria-label="설치 안내 닫기">${ic('x', 16)}</button>`;
    el.querySelector('[data-i]').onclick = () => start();
    el.querySelector('[data-x]').onclick = () => { try { sessionStorage.setItem('pwa:hide', '1'); } catch (e) { } el.remove(); };
    (document.body || document.documentElement).appendChild(el);
  }
  if (document.body) pill(); else document.addEventListener('DOMContentLoaded', pill);
  if (/[?&]install=1(&|$)/.test(location.search) && !standalone) {
    try { history.replaceState(null, '', here().href); } catch (e) { }
    const arrive = async () => {
      if (PWA.prompt) return askInstall();
      if (await waitPrompt(6000)) return askInstall();
      if (os === 'android') { if (PWA.installed) sheet({ title: '이 기기에 DPV 앱이 이미 있습니다', text: '설치된 DPV 앱으로 엽니다.', label: '앱 열기', icon: 'arrowRight', run: () => openApp() }); else cctSheet(); }
      else if (PWA.installed) note('이미 설치되어 있습니다 — 바탕화면 · 시작 메뉴의 DPV 아이콘으로 여세요');
    };
    if (document.body) arrive(); else document.addEventListener('DOMContentLoaded', arrive);
  }
  fire();
})();
