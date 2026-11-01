/* 업무 공간 — 앱(PWA) 설치·실행
   설치하면 바탕화면·시작 메뉴·작업 표시줄에 '업무 공간' 아이콘이 생기고, 브라우저 주소창 없이 앱 창으로 열립니다. */
(() => {
  const ok = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && ok) navigator.serviceWorker.register('sw.js?v=3', { updateViaCache: 'none' }).then(reg => {
    // 하루 한 번, 인터넷이 끊겼을 때 쓸 화면 파일 사본을 새로 받아 둠
    let last = 0; try { last = +localStorage.getItem('pwa:refreshed') || 0; } catch (e) { }
    if (Date.now() - last > 864e5 && reg.active) { reg.active.postMessage('refresh'); try { localStorage.setItem('pwa:refreshed', Date.now()); } catch (e) { } }
  }).catch(() => { });
  const standalone = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches || navigator.standalone === true;
  const PWA = window.PWA = { standalone, prompt: null, installed: false, install };
  document.documentElement.classList.toggle('in-app', standalone);
  const fire = () => window.dispatchEvent(new Event('pwa-change'));

  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.prompt = e; fire(); pill(); });
  window.addEventListener('appinstalled', () => { PWA.prompt = null; PWA.installed = true; fire(); pill(); });
  async function install() {
    if (!PWA.prompt) return false;
    PWA.prompt.prompt();
    const r = await PWA.prompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
    PWA.prompt = null; fire(); pill();
    return r.outcome === 'accepted';
  }

  /* 브라우저 탭으로 열었을 때: 오른쪽 아래에 '앱으로 설치' 단추 (첫 화면은 본문에 따로 있음) */
  const PAGE = (location.pathname.split('/').pop() || 'index.html');
  function pill() {
    let el = document.getElementById('pwaPill');
    const want = !standalone && PWA.prompt && !/^(index\.html|present\.html)$/.test(PAGE) && !sessionStorage.getItem('pwa:hide');
    if (!want) { if (el) el.remove(); return; }
    if (el) return;
    el = document.createElement('div'); el.id = 'pwaPill';
    el.innerHTML = '<button type="button" data-i>⬇ 업무 공간 앱으로 설치</button><button type="button" data-x title="닫기">✕</button>';
    el.style.cssText = 'position:fixed;right:16px;bottom:40px;z-index:90;display:flex;align-items:center;background:#1f7a5a;color:#fff;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.25);font:600 13px/1 "Pretendard Variable","Malgun Gothic",sans-serif;overflow:hidden';
    el.querySelectorAll('button').forEach(b => { b.style.cssText = 'background:none;border:0;color:#fff;font:inherit;padding:10px 14px;cursor:pointer'; });
    el.querySelector('[data-x]').style.padding = '10px 12px 10px 4px';
    el.querySelector('[data-i]').onclick = () => install();
    el.querySelector('[data-x]').onclick = () => { sessionStorage.setItem('pwa:hide', '1'); el.remove(); };
    (document.body || document.documentElement).appendChild(el);
  }
  fire();
})();
