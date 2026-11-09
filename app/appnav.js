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
    nav.innerHTML = TABS.map((t, i) => `<a href="${t.href}" class="app-tab${t.key === cur ? ' on' : ''}"${t.key === 'home' ? '' : ` data-ws="${t.key}"`}${t.admin ? ' data-admin-tab' : ''}${t.key === cur ? ' aria-current="page"' : ''} title="${t.title} (Alt+${i + 1})"><b class="app-tile${t.key === 'home' ? ' home' : ''}">${t.tile}</b><span>${t.label}</span></a>`).join('');
    const rail = document.querySelector('.shell > .rail');
    if (rail) rail.appendChild(nav); else document.body.appendChild(nav);
    document.documentElement.classList.add('has-app-nav');
    nav.addEventListener('click', e => { const a = e.target.closest('a.on'); if (a) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }); // 지금 탭을 다시 누르면 맨 위로
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);

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
