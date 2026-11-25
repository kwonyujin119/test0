/* DPV — 앱처럼 작업장 사이를 오가는 탭
   휴대폰(좁은 화면): 화면 맨 아래 고정 탭바 (DPV · DOC · PRES · VIDEO · SECRET) — 홈으로 돌아가지 않고 바로 바꿈
   PC(넓은 화면): 왼쪽 메뉴 맨 아래에 같은 줄을 작은 타일로. Alt+1 ~ Alt+5 로도 바꿈
   SECRET 은 관리자에게만 보임 (html.admin). 첫 화면에서 입장 방식을 고르기 전에는 숨김 */
(function () {
  const TABS = [
    { key: 'home', href: 'index.html', tile: 'DPV', label: 'DPV', title: 'DPV 첫 화면' },
    { key: 'doc', href: 'hangul.html', tile: 'D', label: 'DOC', title: 'DOCUMENT' },
    { key: 'pres', href: 'gyoan.html', tile: 'P', label: 'PRES', title: 'PRESENTATION' },
    { key: 'video', href: 'videos.html', tile: 'V', label: 'VIDEO', title: 'VIDEO' },
    { key: 'secret', href: 'secret.html', tile: 'S', label: 'SECRET', title: 'SECRET', admin: true },
  ];
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const cur = (TABS.find(t => t.href === page) || TABS[0]).key;

  function build() {
    if (document.getElementById('appNav')) return;
    const nav = document.createElement('nav');
    nav.id = 'appNav'; nav.className = 'app-nav'; nav.setAttribute('aria-label', '작업장 바꾸기');
    nav.innerHTML = TABS.map((t, i) => `<a href="${t.href}" data-k="${t.key}" data-label="${t.title}" class="app-tab${t.key === cur ? ' on' : ''}"${t.key === 'home' ? '' : ` data-ws="${t.key}"`}${t.admin ? ' data-admin-tab' : ''}${t.key === cur ? ' aria-current="page"' : ''} title="${t.title} (Alt+${i + 1})"><b class="app-tile${t.key === 'home' ? ' home' : ''}">${t.tile}</b><span>${t.label}</span></a>`).join('');
    nav.insertAdjacentHTML('afterbegin', '<i class="app-ind" aria-hidden="true"></i>');
    const rail = document.querySelector('.shell > .rail');
    if (rail) rail.appendChild(nav); else document.body.appendChild(nav);
    document.documentElement.classList.add('has-app-nav');
    dots(nav); slide(nav);
    addEventListener('resize', () => place(nav, false));
    if ('ResizeObserver' in window) new ResizeObserver(() => { const ind = nav.querySelector('.app-ind'); if (ind && !ind.classList.contains('show')) place(nav, false); }).observe(nav); // 처음엔 숨어 있다가 보이는 화면(문서 작업장 등)
    addEventListener('pagehide', () => { try { sessionStorage.setItem('dpv:tabFrom', cur); } catch (e) { } });
    addEventListener('storage', e => { if (e.key && e.key.startsWith('dpv:dot:')) dots(nav); });
    nav.addEventListener('click', e => { const a = e.target.closest('a.on'); if (a) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }); // 지금 탭을 다시 누르면 맨 위로
  }
  /* 지금 탭 알약(M3 활성 표시): 이전 작업장 자리에서 미끄러져 옴 · 동작 줄이기면 바로 */
  function place(nav, anim, from) {
    const ind = nav.querySelector('.app-ind'), on = nav.querySelector('.app-tab.on'); if (!ind || !on || !on.getClientRects().length) return;
    const t = from || on, tile = t.querySelector('.app-tile'), r = tile.getBoundingClientRect(), nr = nav.getBoundingClientRect();
    ind.style.transition = anim ? '' : 'none';
    ind.style.transform = `translate(${r.left + r.width / 2 - nr.left}px, ${r.top + r.height / 2 - nr.top}px) translate(-50%, -50%)`;
    ind.classList.add('show');
  }
  function slide(nav) {
    let from = null; try { from = sessionStorage.getItem('dpv:tabFrom'); } catch (e) { }
    const fromEl = from && from !== cur && nav.querySelector(`.app-tab[data-k="${from}"]`);
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      if (fromEl && fromEl.getClientRects().length && !still) { place(nav, false, fromEl); requestAnimationFrame(() => requestAnimationFrame(() => place(nav, true))); }
      else place(nav, false);
    });
  }
  /* 배지 · 닷: 숫자가 필요 없는 "확인할 것 있음"만 (SECRET 수익 엔진이 새 매매 절반 · 중지일 때) */
  function dots(nav) {
    nav.querySelectorAll('.app-tab').forEach(a => {
      let v = null; try { v = localStorage.getItem('dpv:dot:' + a.dataset.k); } catch (e) { }
      a.classList.toggle('has-dot', v === 'half' || v === 'stop'); a.classList.toggle('dot-stop', v === 'stop');
      const base = a.dataset.label; a.setAttribute('aria-label', base + (v === 'stop' ? ', 새 매매 중지 상태' : v === 'half' ? ', 확인할 것 있음' : ''));
    });
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);

  /* 카드를 길게 누르거나(안드로이드) 오른쪽 클릭하면 그 카드의 ⋯ 메뉴를 엶 — DOCUMENT · VIDEO 목록 (PRESENTATION 은 hub.js 가 누른 자리에서 직접 엶) */
  document.addEventListener('contextmenu', e => {
    if (e.defaultPrevented || e.target.closest('input, textarea, [contenteditable], .menu, .ProseMirror')) return;
    const host = e.target.closest('.doc-card, .deck-card, #hmResume, #resume');
    const more = host && host.querySelector('[data-more]');
    if (!more) return;
    e.preventDefault(); if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) { }
    more.click();
  });

  /* PC: Alt+1 ~ Alt+5 로 작업장 바꾸기 (글 입력 중에는 그대로 둠) */
  document.addEventListener('keydown', e => {
    if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const n = +e.key; if (!(n >= 1 && n <= TABS.length)) return;
    const nav = document.getElementById('appNav');
    if (!nav || !nav.getClientRects().length) return; // 탭이 안 보일 때(문서 편집 중 · 첫 화면 PC)는 편집기 단축키에 맡김
    const t = TABS[n - 1];
    if (t.admin && !document.documentElement.classList.contains('admin')) return;
    e.preventDefault(); if (t.key !== cur) location.href = t.href;
  });
})();
