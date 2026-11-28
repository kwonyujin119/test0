/* 교안 발표기
   - 프레젠터 리모컨(PageUp/PageDown/F5/Esc/B)과 키보드/클릭/터치로 조작
   - 발표자 보기(노트·타이머·다음 슬라이드) 창과 BroadcastChannel 로 동기화
   - 단독 HTML(EMBEDDED_DECK) / 인쇄(PDF) 모드 지원 */
'use strict';
if (!ICONS.arrowRight) ICONS.arrowRight = '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'; // 공통 묶음(common.js)에 들어오면 아무 일도 하지 않음
/* 발표 조작 막대에만 쓰는 아이콘 (공통 묶음에 같은 이름이 있으면 그것을 씀) */
{ const add = { chevL: '<path d="m15 6-6 6 6 6"/>', chevR: '<path d="m9 6 6 6-6 6"/>', pen: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-4-4L4 16Z"/><path d="m14 6 4 4"/>', laser: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>', screen: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8"/>', timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5"/><path d="M9.5 2.5h5"/>', pause: '<path d="M8 5v14M16 5v14"/>' };
  for (const k in add) if (!ICONS[k]) ICONS[k] = add[k]; }
/* 연출 스타일(app/pres-fx.css): 페이지 머리에 아직 연결되지 않았으면 여기서 붙임 (이미 있으면 그대로) */
if (!window.EMBEDDED_DECK && !document.querySelector('link[href$="pres-fx.css"]')) document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="app/pres-fx.css">');
(async function () {
  const name = qs('deck') || 'deck';
  const role = qs('role') || 'main';
  /* 공유 링크(…&guest=1, 표지 QR): 처음 온 사람의 기기를 게스트(보기 전용) 모드로 — 이미 관리자 · 게스트를 고른 기기는 그대로 둠 */
  if (qs('guest') === '1') { try { if (!localStorage.getItem('ws:access')) localStorage.setItem('ws:access', JSON.stringify({ role: 'guest', at: Date.now() })); } catch (e) { } }
  let deck;
  if (window.EMBEDDED_DECK) deck = window.EMBEDDED_DECK;
  else {
    await API.init();
    /* 잠긴 폴더의 교안: 관리자가 아닌 기기에서는 열지 않음 */
    if (typeof FolderLock !== 'undefined') { const lk = await FolderLock.blocked(name); if (lk) { document.body.innerHTML = FolderLock.screen(lk); return; } }
    try {
      if (qs('draft')) deck = Draft.get(name); // 편집 화면의 [미리보기]: 아직 저장하지 않은 작업본
      if (deck && role === 'main' && !qs('print')) setTimeout(() => toast('아직 저장하지 않은 작업본을 보여 줍니다 (미리보기)', 3500), 800);
      if (!deck) deck = await API.load(name);
    } catch (e) {
      if (e && e.notFound) { const to = await API.findMoved(name); if (to) { const u = new URL(location.href); u.searchParams.set('deck', to); location.replace(u.href); return; } } /* 이름(번호)이 바뀐 교안의 옛 링크 */
      document.body.innerHTML = `<div class="pend show"><div class="pend-t">교안을 열 수 없습니다</div><div style="color:#c9cbd1;max-width:560px;padding:0 20px;text-align:center;font-size:15px;line-height:1.65;word-break:keep-all">${esc(e.message)}</div><div class="pend-a"><a class="btn ink" href="gyoan.html">교안 목록으로</a></div></div>`; return; }
  }
  if (deck.guestbook && typeof Guestbook !== 'undefined') await Guestbook.expand(deck); /* SACHIL 방명록 교안: 열 때 최신 방명록을 슬라이드로 */
  normalizeDeck(deck);
  if (!deck.slides.length) deck.slides = [newSlide('blank')];
  document.title = (deck.title || name || '교안') + (role === 'notes' ? ' · 발표자 보기' : ' · 발표');
  const N = deck.slides.length;
  const channel = ('BroadcastChannel' in window) ? new BroadcastChannel('gyoan:' + name) : null;

  if (qs('print')) return renderPrint();
  if (role === 'notes') return notesView();
  window.GYOAN_LIVE = true; // 동영상·웹 요소를 실제로 재생
  /* 발표 중에는 화면이 꺼지지 않게 */
  const keepAwake = () => { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => { }); } catch (e) { } };
  keepAwake(); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });
  /* 쓰인 글꼴·수식 도구를 미리 받아 둠 (그 슬라이드에 가서야 글꼴이 바뀌어 보이지 않게) */
  try {
    const th = deckTheme(deck);
    for (const sl of deck.slides) for (const e of sl.elements) if (e.type === 'text' || e.type === 'shape' || e.type === 'table') fontCss(resolveTextStyle(e, th).font);
    if (deck.slides.some(sl => sl.elements.some(e => e.type === 'math'))) Promise.resolve(loadKatex()).catch(() => { });
  } catch (e) { }

  /* ======================= 발표 화면 ======================= */
  document.body.innerHTML = `
    <div class="pstage" id="pstage"></div>
    <div class="pbar" id="pbar"></div>
    <div class="pnum" id="pnum"></div>
    <div class="pblank" id="pblank"></div>
    <canvas class="pdraw" id="pdraw"></canvas>
    <div class="plaser" id="plaser"></div>
    <div class="phud" id="phud"></div>
    <div class="pgoto" id="pgoto"></div>
    <div class="poverview" id="poverview"><div class="grid" id="ogrid"></div></div>
    <div class="phelp" id="phelp"><div class="box">
      <h3>발표 단축키 <span class="muted" style="font-weight:400;font-size:13px">PowerPoint 슬라이드 쇼와 같음 · 리모컨의 다음/이전 단추 = PageDown/PageUp</span></h3>
      <div class="cols">
        <div><span>다음</span><span><kbd>→</kbd> <kbd>↓</kbd> <kbd>PgDn</kbd> <kbd>Space</kbd> <kbd>Enter</kbd> <kbd>N</kbd> 클릭</span></div>
        <div><span>이전</span><span><kbd>←</kbd> <kbd>↑</kbd> <kbd>PgUp</kbd> <kbd>Backspace</kbd> <kbd>P</kbd> 우클릭</span></div>
        <div><span>처음 / 끝</span><span><kbd>Home</kbd> / <kbd>End</kbd></span></div>
        <div><span>특정 슬라이드로</span><span>번호 입력 후 <kbd>Enter</kbd></span></div>
        <div><span>모든 슬라이드 보기</span><span><kbd>Ctrl+S</kbd> <kbd>G</kbd> <kbd>-</kbd> <kbd>O</kbd></span></div>
        <div><span>검은 화면</span><span><kbd>B</kbd> <kbd>.</kbd></span></div>
        <div><span>흰 화면</span><span><kbd>W</kbd> <kbd>,</kbd></span></div>
        <div><span>확대 / 축소</span><span><kbd>+</kbd> / <kbd>-</kbd></span></div>
        <div><span>펜</span><span><kbd>Ctrl+P</kbd> <kbd>D</kbd> (Shift 드래그 = 굵은 노랑)</span></div>
        <div><span>레이저 포인터</span><span><kbd>Ctrl+L</kbd> <kbd>L</kbd></span></div>
        <div><span>화살표(펜·레이저 해제)</span><span><kbd>Ctrl+A</kbd> <kbd>Esc</kbd></span></div>
        <div><span>잉크 지우기</span><span><kbd>E</kbd></span></div>
        <div><span>포인터 숨기기</span><span><kbd>Ctrl+H</kbd></span></div>
        <div><span>발표자 보기 창</span><span><kbd>Alt+F5</kbd> <kbd>S</kbd></span></div>
        <div><span>전체화면</span><span><kbd>F</kbd> <kbd>F5</kbd> <kbd>F11</kbd></span></div>
        <div><span>타이머 표시 (목표를 정하면 남은 시간도)</span><span><kbd>T</kbd></span></div>
        <div><span>토의 · 실습 타이머 (30초 ~ 10분)</span><span><kbd>K</kbd></span></div>
        <div><span>이 도움말</span><span><kbd>F1</kbd> <kbd>?</kbd> <kbd>H</kbd></span></div>
        <div><span>편집기로</span><span><kbd>Ctrl+E</kbd></span></div>
        <div><span>발표 종료</span><span><kbd>Esc</kbd> (전체화면이면 한 번 더)</span></div>
      </div>
      <div style="margin-top:12px;font-size:13px;line-height:1.6"><b>발표자 보기(S)</b> — 목표 시간 · 남은 시간(10% 남으면 노랑, 넘으면 빨강) · 타이머 멈춤 · 이 장에 머문 시간과 지난 기록 비교. 1분 넘게 발표하면 장별 시간이 이 브라우저에 저장되어 편집기 <b>점검</b>에서 볼 수 있습니다.</div>
      <div style="margin-top:8px;font-size:13px;line-height:1.6"><b>조작 막대</b> — 마우스를 움직이면 아래에 나타납니다: 이전 · 다음 · 구역(누르면 그 구역으로) · 펜 · 레이저 · 검은 화면 · 토의 타이머 · 시간. 시작 암전 · 진행 막대 · 조작 막대는 오른쪽 위 <b>연출</b>에서 끄고 켭니다.</div>
      <div style="margin-top:8px;font-size:13px;line-height:1.6"><b>휴대폰 · 태블릿</b> — 화면을 누르면 다음 슬라이드, 옆으로 밀면 앞·뒤로 넘어갑니다. 누를 때마다 오른쪽 위에 메뉴(목록 · 전체화면 · 종료)가 잠깐 나타납니다.</div>
      <div class="muted" style="margin-top:14px;font-size:13px">아무 키나 누르거나 화면을 눌러 닫기 · 전체 설명서: <a href="shortcuts.html" target="_blank" onclick="event.stopPropagation()">shortcuts.html</a></div>
    </div></div>
    <div class="pmenu peek" id="pmenu">
      <button class="btn sm" data-a="notes" title="발표자 보기 (S)">${icon('notes', 16)}노트</button>
      <button class="btn sm" data-a="overview" title="한눈에 보기 (O)">${icon('gallery', 16)}목록</button>
      <button class="btn sm" data-a="full" title="전체화면 (F)">${icon('expand', 16)}전체화면</button>
      <button class="btn sm icon" data-a="fx" title="연출 — 시작 암전 · 진행 막대 · 조작 막대" aria-label="연출 설정">${icon('sliders', 16)}</button>
      <button class="btn sm icon" data-a="help" title="도움말 (?)" aria-label="도움말">${icon('help', 16)}</button>
      <button class="btn sm icon" data-a="exit" title="종료 (Esc)" aria-label="종료">${icon('x', 16)}</button>
    </div>
    <div class="pend" id="pend"><div class="pf-end">
      <div class="pf-end-k">발표를 마쳤습니다</div>
      <div class="pf-end-t">감사합니다</div>
      <div class="pf-end-d">${esc(deck.title || name)}</div>
      <div class="pf-recap" id="pfRecap"></div>
      <div class="pf-qa">${icon('chat', 18)}질문 · 의견을 받겠습니다</div>
      <div class="pf-end-me">
        <div class="psum" id="pendSum"></div>
        <div class="pend-a"><button class="btn" data-a="back">마지막 슬라이드로</button><button class="btn" data-a="first">처음부터</button><button class="btn ink" data-a="exit">종료</button></div>
      </div>
    </div></div>
    <div class="pf-track" id="pfTrack" aria-hidden="true"></div>
    <div class="pf-cue" id="pfCue" aria-hidden="true"></div>
    <div class="pf-cd" id="pfCd" hidden></div>
    <div class="pf-dock" id="pfDock" role="toolbar" aria-label="발표 조작"></div>`;
  const $ = (id) => document.getElementById(id);
  const pstage = $('pstage'), pbar = $('pbar'), pnum = $('pnum'), pblank = $('pblank'), pdraw = $('pdraw'), plaser = $('plaser'), phud = $('phud'), pgoto = $('pgoto');

  const visible = (i) => !deck.slides[i].hidden;
  /* 숨긴 슬라이드는 건너뜀 (번호로 직접 이동하면 볼 수 있음) */
  function nextVisible(i, d) { let j = i + d; while (j >= 0 && j < N && !visible(j)) j += d; return j; }
  let startIdx = clamp(parseInt(qs('start') || '0', 10) || 0, 0, N - 1);
  if (startIdx === 0 && !visible(0)) { const j = nextVisible(0, 1); if (j < N) startIdx = j; }
  const st = { idx: startIdx, step: 0, blank: '', pen: false, laser: false, goto: '', timerStart: null, pausedAt: null, showTimer: false, ended: false };
  /* 몰입 연출 설정 (이 브라우저에 기억): cold = 시작할 때 암전 → 표지, bar = 아래 구역별 진행 막대, dock = 마우스를 움직이면 나타나는 조작 막대 */
  const FX = (() => { const d = { cold: true, bar: true, dock: true }; try { return Object.assign(d, JSON.parse(localStorage.getItem('pres:fx') || '{}')); } catch (e) { return d; } })();
  /* 콜드 오픈: 목록 · 링크로 처음 열었을 때만 (편집기의 [발표] · 새로 고침 · 미리보기는 바로 그 장) */
  /* 암전 시작은 발표하는 사람 화면에만: 공유 링크 · QR 로 각자 휴대폰에서 보는 청중(게스트)은 바로 표지 */
  const viewer = qs('guest') === '1' || (() => { try { return (JSON.parse(localStorage.getItem('ws:access') || 'null') || {}).role === 'guest'; } catch (e) { return false; } })();
  let cold = !!(FX.cold && !qs('start') && !qs('draft') && !viewer && role === 'main');
  let pfPop = null; // 열려 있는 작은 창 (연출 설정 · 타이머 고르기)
  const CD = { total: 0, end: 0, left: null, t: 0, hideT: 0, shrinkT: 0 }; // 토의 · 실습 타이머: end = 끝나는 시각(돌아가는 중), left = 멈춘 동안 남은 초
  /* 장별 시간 기록 (멈춘 시간은 빼고) — 발표가 끝나거나 창을 닫을 때 "지난 발표 기록"으로 저장 */
  const T = { acc: {}, mark: 0, runId: '' };
  const elapsedMs = () => st.timerStart ? (st.pausedAt || Date.now()) - st.timerStart : 0;
  function startTimer() { if (st.timerStart) return; st.timerStart = Date.now(); st.pausedAt = null; T.acc = {}; T.mark = 0; T.runId = uid(); }
  function account() { if (!st.timerStart) return; const now = elapsedMs(), id = slideOf(st.idx).id; if (st.ended) { T.mark = now; return; } /* 끝 화면에 머문 시간은 빼고 */ T.acc[id] = (T.acc[id] || 0) + Math.max(0, now - T.mark); T.mark = now; }
  function saveRun() {
    if (!st.timerStart) return null;
    account();
    const total = Math.round(elapsedMs() / 1000); if (total < 60) return null; // 1분이 안 되는 시험 재생은 기록하지 않음
    const slides = {}; for (const k in T.acc) slides[k] = Math.round(T.acc[k] / 1000);
    const run = { id: T.runId, at: Date.now(), total, slides, n: Object.keys(slides).filter(k => slides[k] > 0).length };
    PresTime.saveRun(name, run); return run;
  }
  window.addEventListener('pagehide', () => saveRun());
  const strokes = {}; // idx -> [[{x,y},...], ...] (슬라이드 기준 0~1 좌표)
  let curLayer = null, curNodes = null, hudTimer = null, gotoTimer = null, idleTimer = null, hideMenuTimer = null;

  const slideOf = (i) => deck.slides[i];
  const transitionOf = (i) => { const t = slideOf(i).transition; return t === undefined || t === '' ? (deck.transition || 'fade') : t; };

  function makeLayer(i, step, back) {
    const layer = document.createElement('div'); layer.className = 'layer';
    const s = renderSlide(slideOf(i), deck, { mode: 'present', step, back });
    layer.appendChild(s);
    return layer;
  }
  function show(i, step, dir) {
    const old = curLayer, fromIdx = st.idx;
    if (old && fromIdx !== i) account();
    const layer = makeLayer(i, step, dir < 0);
    const tr = old ? transitionOf(i) : 'none';
    if (tr === 'morph') {
      pstage.className = 'pstage t-morph';
      layer.classList.add('in'); pstage.appendChild(layer); curLayer = layer;
      fitSlide(layer, layer.firstChild);
      morph(old, layer, fromIdx, i);
    } else {
      pstage.className = 'pstage' + (tr !== 'none' ? ' t-' + tr : '') + (dir < 0 ? ' back' : '');
      if (old) { old.classList.add('out'); old.classList.remove('in'); }
      layer.classList.add('in');
      pstage.appendChild(layer); curLayer = layer;
      fitSlide(layer, layer.firstChild);
      if (old) setTimeout(() => old.remove(), TR_MS[tr] || 700);
      if (old && tr === 'warp') warpFx();
      if (old && tr === 'liquid') liquidFx(old, layer);
      if (old && tr === 'tear') tearFx(old);
    }
    curNodes = Array.from(layer.querySelectorAll('.slide > .el')).map(n => ({ n, e: slideOf(i).elements.find(e => e.id === n.dataset.id) }));
    st.idx = i; st.step = step;
    syncMedia();
    updateHud(); redraw(); broadcast();
    fxSlide(fromIdx, i, !!old);
    preloadAround(i);
    if (!window.EMBEDDED_DECK) { try { const u = new URL(location.href); u.searchParams.set('start', i); history.replaceState(null, '', u); } catch (e) { } } // 새로 고침해도 보던 슬라이드에서 이어짐
  }
  /* ---- 영상 레퍼런스 ② 전환: 물결 · 빗방울 · 종이 찢기 · 워프 빛줄기 ---- */
  const TR_MS = { warp: 1300, card: 2250, portal: 1750, liquid: 1650, tear: 1650 };
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function svgFx() {
    if (document.getElementById('pfFx')) return;
    const d = document.createElement('div'); d.id = 'pfFx'; d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0"><filter id="pfLiqA" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.022" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>'
      + '<filter id="pfLiqF" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="3" seed="9"/><feDisplacementMap in="SourceGraphic" scale="70" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
    document.body.appendChild(d);
  }
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function warpFx() { if (RM) return; const w = document.createElement('div'); w.className = 'p-warp'; pstage.appendChild(w); setTimeout(() => w.remove(), 1150); }
  function liquidFx(old, layer) {
    if (RM) return;
    svgFx(); const dm = document.querySelector('#pfLiqA feDisplacementMap'), tb = document.querySelector('#pfLiqA feTurbulence');
    const foam = document.createElement('div'); foam.className = 'p-foam'; foam.style.filter = 'url(#pfLiqF)';
    foam.style.backgroundImage = 'linear-gradient(115deg, transparent 39%, rgba(200,230,255,.25) 42%, rgba(235,246,255,.95) 44.6%, rgba(150,205,240,.45) 46.4%, rgba(120,190,235,.15) 49%, transparent 52%)';
    pstage.appendChild(foam);
    const mask = 'linear-gradient(115deg, #000 0%, #000 44%, transparent 47%, transparent 100%)';
    Object.assign(layer.style, { webkitMaskImage: mask, maskImage: mask, webkitMaskSize: '300% 100%', maskSize: '300% 100%', filter: 'url(#pfLiqA)' });
    const t0 = performance.now(), D = 1500;
    (function f(now) {
      const t = Math.min(1, (now - t0) / D), e = ease(t), pos = (100 * (1 - e)).toFixed(2) + '% 0';
      layer.style.webkitMaskPosition = layer.style.maskPosition = pos; foam.style.backgroundPosition = pos;
      dm.setAttribute('scale', (90 * (1 - e)).toFixed(1)); tb.setAttribute('baseFrequency', `0.008 ${(0.022 + 0.006 * Math.sin(t * 9)).toFixed(4)}`);
      foam.style.opacity = t > .85 ? (1 - t) / .15 : 1;
      if (t < 1 && layer.isConnected) requestAnimationFrame(f);
      else { foam.remove(); ['webkitMaskImage', 'maskImage', 'webkitMaskSize', 'maskSize', 'webkitMaskPosition', 'maskPosition', 'filter'].forEach(k => layer.style[k] = ''); if (layer.isConnected) dropsFx(); }
    })(t0);
  }
  function dropsFx() {
    if (RM) return; pstage.querySelectorAll('.p-drops').forEach(x => x.remove());
    const box = document.createElement('div'); box.className = 'p-drops'; const W = innerWidth, H = innerHeight;
    for (let k = 0; k < Math.round(W * H / 22000); k++) {
      const i = document.createElement('i'), r = 5 + Math.pow(Math.random(), 2.4) * 26;
      i.style.cssText = `left:${Math.random() * W}px;top:${Math.random() * H}px;width:${r}px;height:${r * (1 + Math.random() * .25)}px`;
      const slide = r > 18 && Math.random() < .5 ? 40 + Math.random() * 160 : 0, hold = 1600 + Math.random() * 2200;
      i.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)', offset: .06 }, { opacity: 1, transform: `translateY(${slide * .6}px)`, offset: .7 }, { opacity: 0, transform: `translateY(${slide}px) scale(.8)` }],
        { duration: hold + 900, delay: Math.random() * 350, easing: 'ease-out', fill: 'both' });
      box.appendChild(i);
    }
    pstage.appendChild(box); setTimeout(() => box.remove(), 5200);
  }
  function tearFx(old) {
    if (RM || !old) return;
    const pts = []; let x = 50 + (Math.random() - .5) * 8;
    for (let y = 0; y <= 100; y += 2.5) { x += (Math.random() - .5) * 3.2; x = Math.max(38, Math.min(62, x)); pts.push(`${x.toFixed(2)}% ${y}%`); }
    const L = `polygon(0 0, ${pts.join(', ')}, 0 100%)`, Rr = `polygon(${pts.join(', ')}, 100% 100%, 100% 0)`;
    const piece = (clip, side) => {
      const w = document.createElement('div'); w.className = 'p-tear';
      const c = old.cloneNode(true); c.classList.remove('out', 'in');
      c.querySelectorAll('iframe,video').forEach(n => { const p = n.closest('.el-embed'); if (p) p.style.background = 'transparent'; n.remove(); }); // 조각에는 웹 화면 대신 배경 사진
      c.style.clipPath = clip; w.appendChild(c);
      w.style.filter = `drop-shadow(${side * 5}px 0 0 #EFEBE2) drop-shadow(${side * 2}px 0 1px rgba(0,0,0,.35)) drop-shadow(${side * 14}px 6px 22px rgba(0,0,0,.5))`;
      w.style.transformOrigin = side < 0 ? '100% 100%' : '0% 100%';
      pstage.appendChild(w);
      w.animate([{ transform: 'none' }, { transform: `perspective(1600px) rotateY(${side * 4}deg) rotate(${side * -1.5}deg) translateX(${side * -1}%)`, offset: .22 },
        { transform: `perspective(1600px) rotateY(${side * 38}deg) rotate(${side * -20}deg) translate(${side * -62}%, 14%)`, opacity: .95 }],
        { duration: 1500, easing: 'cubic-bezier(.55,0,.75,.35)', fill: 'forwards' }).onfinish = () => w.remove();
    };
    piece(L, 1); piece(Rr, -1); old.style.visibility = 'hidden';
  }
  /* 모핑: 앞뒤 슬라이드에서 같은 요소(복제로 이어진 요소)는 위치·크기·회전이 부드럽게 바뀜 */
  function morph(old, layer, fromIdx, toIdx) {
    const keyOf = (e) => e.mk || e.id;
    const from = slideOf(fromIdx), to = slideOf(toIdx);
    const oldByKey = new Map(); for (const e of from.elements) { const k = keyOf(e); if (!oldByKey.has(k)) oldByKey.set(k, e); }
    const slideEl = layer.firstChild, used = new Set();
    const ease = 'cubic-bezier(.45,.05,.25,1)';
    for (const n of slideEl.querySelectorAll(':scope > .el')) {
      const e = to.elements.find(x => x.id === n.dataset.id); if (!e) continue;
      const o = oldByKey.get(keyOf(e));
      const op1 = e.opacity == null ? 1 : e.opacity;
      if (!o || used.has(o.id) || n.classList.contains('step-hidden')) { n.animate([{ opacity: 0 }, { opacity: op1 }], { duration: 450, delay: 350, fill: 'backwards', easing: 'ease-out' }); continue; }
      used.add(o.id);
      const dx = (o.x + o.w / 2) - (e.x + e.w / 2), dy = (o.y + o.h / 2) - (e.y + e.h / 2);
      n.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${o.w / e.w}, ${o.h / e.h}) rotate(${o.rotate || 0}deg)`, opacity: o.opacity == null ? 1 : o.opacity },
        { transform: `translate(0px, 0px) scale(1, 1) rotate(${e.rotate || 0}deg)`, opacity: op1 },
      ], { duration: 800, easing: ease });
    }
    if (!old) return;
    // 다음 슬라이드에 없는 요소는 그 자리에서 서서히 사라짐
    const first = slideEl.querySelector(':scope > .el');
    old.querySelectorAll('.slide > .el').forEach(n => {
      if (used.has(n.dataset.id) || n.classList.contains('step-hidden')) return;
      const c = n.cloneNode(true); c.classList.remove(...ANIM_CLASSES); slideEl.insertBefore(c, first);
      c.animate([{ opacity: getComputedStyle(n).opacity }, { opacity: 0 }], { duration: 350, fill: 'forwards', easing: 'ease-in' }).onfinish = () => c.remove();
    });
    // 배경이 다르면 새 슬라이드를 겹쳐 서서히 드러냄
    const bgOf = (s) => JSON.stringify(slideBackground(s, deckTheme(deck)));
    if (bgOf(from) !== bgOf(to)) { layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' }); setTimeout(() => old.remove(), 520); }
    else old.remove();
  }
  /* ---- 독 확대: 마우스(또는 포인터)가 다가가면 아이콘이 커지고 이웃도 조금 — 마우스가 쉬면 3초마다 한 번 저절로 훑음 ---- */
  let dockMouse = null, dockIdle = 0, dockRaf = 0;
  function dockPaint(px, py) {
    if (!curLayer) return; const ns = curLayer.querySelectorAll('.fx-dock'); if (!ns.length) return;
    ns.forEach((n) => { const r = n.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = Math.max(r.width, r.height) * 2.4;
      const d = px == null ? 1e9 : Math.hypot(px - cx, py - cy), k = Math.max(0, 1 - d / R), s = 1 + .5 * k * k * (3 - 2 * k);
      n.style.scale = s.toFixed(3); n.style.translate = `0 ${(-(s - 1) * (parseFloat(n.style.height) || r.height) * .32).toFixed(1)}px`; });
  }
  pstage.addEventListener('mousemove', (ev) => { dockMouse = [ev.clientX, ev.clientY]; dockIdle = performance.now(); dockPaint(ev.clientX, ev.clientY); });
  pstage.addEventListener('mouseleave', () => { dockMouse = null; dockPaint(null); });
  (function dockAuto(now) {
    dockRaf = requestAnimationFrame(dockAuto);
    if (!curLayer || (dockMouse && now - dockIdle < 3000)) return;
    const ns = Array.from(curLayer.querySelectorAll('.fx-dock')); if (!ns.length) return;
    const rs = ns.map(n => n.getBoundingClientRect()), x0 = Math.min(...rs.map(r => r.left)) - 60, x1 = Math.max(...rs.map(r => r.right)) + 60, y0 = Math.min(...rs.map(r => r.top)) - 60, y1 = Math.max(...rs.map(r => r.bottom)) + 60;
    const ph = (now / 1000) % 4.5; // 4.5초마다: 1.8초 동안 한쪽 끝에서 다른 쪽 끝까지 훑기
    if (ph > 1.8) { dockPaint(null); return; } const t = ph / 1.8;
    dockPaint(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
  })(performance.now());
  /* 다음 두 슬라이드의 이미지를 미리 받아 두어 넘길 때 끊김이 없게 */
  const preloaded = new Set();
  function preloadAround(i) {
    for (let j = i + 1; j <= Math.min(N - 1, i + 2); j++) {
      const s = slideOf(j); const srcs = [];
      if (s.bg && s.bg.image) srcs.push(s.bg.image);
      for (const e of s.elements || []) if (e.type === 'image' && e.src) srcs.push(e.src);
      for (const src of srcs) { if (preloaded.has(src)) continue; preloaded.add(src); const im = new Image(); im.decoding = 'async'; im.src = API.resolveSrc(src); }
    }
  }
  function applyStep(back) {
    if (!curNodes) return;
    for (const { n, e } of curNodes) if (e) applyStepToNode(e, n, st.step, back);
    syncMedia();
    updateHud(); broadcast();
  }
  /* 동영상: 아직 나타나지 않았거나 사라진 것은 소리가 나지 않게 멈추고, 나타날 때 시작 */
  function syncMedia() {
    if (!curNodes) return;
    for (const { n, e } of curNodes) {
      if (!e || e.type !== 'embed') continue;
      const hid = n.classList.contains('step-hidden') || n.classList.contains('anim-out'), v = n.querySelector('video'), f = n.querySelector('iframe');
      if (v) { if (hid) v.pause(); else if (e.autoplay && v.paused && !v.ended) v.play().catch(() => { }); }
      if (f) { if (hid && !f.dataset.src) { f.dataset.src = f.src; f.src = 'about:blank'; } else if (!hid && f.dataset.src) { f.src = f.dataset.src; delete f.dataset.src; } }
    }
  }
  /* 끝난 애니메이션의 흔적 지우기 (원 모양으로 자른 그림·그림자가 다음 클릭 때까지 풀려 보이던 문제) */
  pstage.addEventListener('animationend', (ev) => { const n = ev.target; if (n.classList && n.classList.contains('anim') && !n.classList.contains('anim-out') && !n.classList.contains('anim-sheen') && !n.classList.contains('anim-kenburns') && !n.classList.contains('anim-float') && !n.classList.contains('anim-scan') && !n.classList.contains('anim-cycle4')) n.classList.remove(...ANIM_CLASSES); });
  /* 카운트다운이 0이 되면: 장 설정 autoNext 가 있으면 잠깐(암흑) 멈췄다가 다음 장으로 */
  pstage.addEventListener('countdown-end', () => {
    const i = st.idx, sl = slideOf(i); if (!sl.autoNext) return;
    setTimeout(() => { if (st.idx !== i || st.ended) return; const j = nextVisible(i, 1); if (j < N) show(j, 0, 1); }, (+sl.autoNextDelay || 1.5) * 1000);
  });
  const firstVisible = () => { const j = visible(0) ? 0 : nextVisible(0, 1); return j < N ? j : 0; };
  const lastVisible = () => { const j = visible(N - 1) ? N - 1 : nextVisible(N - 1, -1); return j >= 0 ? j : N - 1; };
  function updateHud() {
    pbar.style.width = ((st.idx + 1) / N * 100) + '%';
    const ms = maxStep(slideOf(st.idx));
    pnum.textContent = `${st.idx + 1} / ${N}` + (ms ? `  ·  ${st.step}/${ms}` : '') + (st.showTimer ? '   ' + timerText() : '');
    fxHud();
  }
  function timerText() {
    const s = Math.floor(elapsedMs() / 1000), tg = PresTime.target(name);
    return PresTime.fmt(s) + (tg ? '  (남은 ' + PresTime.fmt(tg * 60 - s) + ')' : '') + (st.pausedAt ? '  멈춤' : '');
  }
  setInterval(() => { if (st.showTimer) updateHud(); }, 1000);

  function next() {
    if (cold) { startShow(); return; }
    if (st.ended) { return; }
    if (!st.timerStart) startTimer();
    if (st.step < maxStep(slideOf(st.idx))) { st.step++; applyStep(); return; }
    const j = nextVisible(st.idx, 1);
    if (j < N) show(j, 0, 1);
    else endShow();
  }
  function prev() {
    if (cold) return;
    if (st.ended) { st.ended = false; $('pend').classList.remove('show'); broadcast(); return; }
    if (st.step > 0) { st.step--; applyStep(true); return; }
    const j = nextVisible(st.idx, -1);
    if (j >= 0) show(j, maxStep(slideOf(j)), -1);
  }
  function goto(i, step) { if (cold) dropCold(); i = clamp(i, 0, N - 1); st.ended = false; $('pend').classList.remove('show'); show(i, step || 0, i >= st.idx ? 1 : -1); }
  function endShow() { const run = saveRun(); st.ended = true; closePops(); $('pendSum').innerHTML = runSummary(run); $('pfRecap').innerHTML = recapHtml(); rememberLast(true); $('pend').classList.add('show'); broadcast(); }
  /* 끝 화면: 이번 발표 시간 · 목표와의 차이 · 오래 머문 장 */
  function runSummary(run) {
    if (!run) return st.timerStart ? '<div class="psum-t">1분이 안 되어 시간 기록은 남기지 않았습니다</div>' : '';
    const tg = PresTime.target(name), diff = run.total - tg * 60;
    const top = deck.slides.map((s, i) => ({ i, t: run.slides[s.id] || 0 })).filter(x => x.t > 0).sort((a, b) => b.t - a.t).slice(0, 3);
    return `<div class="psum-t">발표 시간 <b>${PresTime.fmt(run.total)}</b>` +
      (tg ? ` · 목표 ${tg}분보다 <b class="${diff > 0 ? 'over' : -diff <= tg * 6 ? 'ok' : ''}">${PresTime.fmt(Math.abs(diff))} ${diff > 0 ? '김' : '짧음'}</b>` : '') + `</div>` +
      (top.length ? `<div class="psum-s">오래 머문 장 · ${top.map(x => `${x.i + 1}장 ${PresTime.fmt(x.t)}`).join(' · ')}</div>` : '') +
      `<div class="psum-s">장별 시간은 편집기의 <b>점검</b>에서 볼 수 있습니다 (이 브라우저에 저장)</div>`;
  }
  function broadcast() { if (channel) channel.postMessage({ type: 'state', idx: st.idx, step: st.step, ended: st.ended, timerStart: st.timerStart, pausedAt: st.pausedAt, mark: T.mark, blank: st.blank }); }
  if (channel) channel.onmessage = (ev) => {
    const m = ev.data || {};
    if (m.type === 'hello') broadcast();
    if (m.type === 'nav') { if (m.cmd === 'next') next(); else if (m.cmd === 'prev') prev(); else if (m.cmd === 'goto') goto(m.idx, 0); else if (m.cmd === 'timer') { st.timerStart = null; startTimer(); st.timerStart = m.value || Date.now(); broadcast(); }
      else if (m.cmd === 'pause') { if (!st.timerStart) startTimer(); else if (st.pausedAt) { st.timerStart += Date.now() - st.pausedAt; st.pausedAt = null; } else st.pausedAt = Date.now(); updateHud(); broadcast(); }
      else if (m.cmd === 'blank') { setBlank(m.kind); } }
  };

  /* ---- 화면 상태 ---- */
  function zoomStage(d) {
    st.zoom = clamp((st.zoom || 1) + d * 0.5, 1, 3);
    pstage.style.transform = st.zoom > 1 ? `scale(${st.zoom})` : ''; pstage.style.transformOrigin = 'center center';
    hud(st.zoom > 1 ? `확대 ${st.zoom}× (− 로 축소 · 마우스로 보고 싶은 곳을 가리키세요)` : '원래 크기');
  }
  function setBlank(kind) { st.blank = st.blank === kind ? '' : kind; pblank.className = 'pblank ' + st.blank; broadcast(); }
  function hud(msg) { phud.textContent = msg; phud.classList.add('show'); clearTimeout(hudTimer); hudTimer = setTimeout(() => phud.classList.remove('show'), 1600); }
  /* 전체화면: 표준 이름이 없는 브라우저(아이패드 사파리 등)는 webkit 이름으로 */
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const fsExit = () => { const x = document.exitFullscreen || document.webkitExitFullscreen; if (x) { try { const p = x.call(document); if (p && p.catch) p.catch(() => { }); } catch (e) { } } };
  /* 영상만 전체화면으로 키운 상태 (영상의 전체화면 단추 · 두 번 누르기) */
  const videoFs = () => { const f = fsEl(); return !!(f && f !== document.documentElement && f.closest && f.closest('.el-embed')); };
  function toggleFullscreen() {
    if (fsEl()) { fsExit(); return; }
    const el = document.documentElement, rf = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!rf) { hud('이 기기는 전체화면을 지원하지 않습니다 (홈 화면에 추가하면 전체화면으로 열립니다)'); return; }
    try { const p = rf.call(el); if (p && p.catch) p.catch(() => hud('전체화면을 사용할 수 없습니다 (F11 을 눌러보세요)')); } catch (e) { hud('전체화면을 사용할 수 없습니다 (F11 을 눌러보세요)'); }
  }
  function openNotes() {
    const u = new URL(location.href); u.searchParams.set('role', 'notes'); u.searchParams.delete('start');
    const w = window.open(u.toString(), 'gyoan-notes-' + name, 'width=1200,height=760');
    if (!w) hud('팝업이 차단되었습니다 — 주소창의 팝업 허용을 눌러 주세요'); else hud('발표자 보기를 열었습니다 · 이 화면은 F 로 전체화면');
  }
  function exitShow() {
    if (fsEl()) fsExit();
    if (channel) channel.postMessage({ type: 'bye' }); // 발표자 보기 창도 함께 닫힘
    if (window.EMBEDDED_DECK) { // 내보낸 단독 파일: 돌아갈 목록이 없음
      if ($('pend').classList.contains('show')) { window.close(); hud('발표를 마쳤습니다 — 이 창(탭)을 닫으세요'); }
      else endShow();
      return;
    }
    if (window.opener && !window.opener.closed) window.close();
    location.href = 'gyoan.html';
  }
  const overview = {
    open() {
      const g = $('ogrid'); g.innerHTML = '';
      deck.slides.forEach((s, i) => {
        const o = document.createElement('div'); o.className = 'o' + (i === st.idx ? ' cur' : '') + (s.hidden ? ' hid' : '');
        const sl = renderSlide(s, deck, { mode: 'thumb' }); o.appendChild(sl);
        const n = document.createElement('div'); n.className = 'n'; n.textContent = i + 1; o.appendChild(n);
        o.onclick = () => { overview.close(); goto(i, 0); };
        g.appendChild(o); requestAnimationFrame(() => fitSlide(o, sl));
      });
      this.sel = st.idx;
      $('poverview').classList.add('show'); $('poverview').querySelector('.cur')?.scrollIntoView({ block: 'center' });
    },
    move(d) { // 방향키: 좌우 = 한 장, 상하 = 한 줄
      const os = Array.from($('ogrid').children); if (!os.length) return;
      let per = 1; while (per < os.length && os[per].offsetTop === os[0].offsetTop) per++;
      const j = clamp(this.sel + (d === 'up' ? -per : d === 'down' ? per : d === 'left' ? -1 : 1), 0, os.length - 1);
      os.forEach((o, i) => o.classList.toggle('cur', i === j)); this.sel = j; os[j].scrollIntoView({ block: 'nearest' });
    },
    refit() { for (const o of $('ogrid').children) if (o.firstChild) fitSlide(o, o.firstChild); },
    close() { $('poverview').classList.remove('show'); },
    isOpen() { return $('poverview').classList.contains('show'); },
    toggle() { this.isOpen() ? this.close() : this.open(); },
  };
  $('poverview').addEventListener('click', (ev) => { if (!ev.target.closest('.o')) overview.close(); }); // 빈 곳을 누르면 닫힘 (휴대폰)

  /* ---- 펜 / 레이저 ---- */
  const ctx = pdraw.getContext('2d');
  function slideRect() { // 화면에 보이는 슬라이드 영역
    const k = Math.min(innerWidth / SLIDE_W, innerHeight / SLIDE_H);
    const w = SLIDE_W * k, h = SLIDE_H * k; return { x: (innerWidth - w) / 2, y: (innerHeight - h) / 2, w, h };
  }
  function redraw() {
    pdraw.width = innerWidth; pdraw.height = innerHeight; ctx.clearRect(0, 0, pdraw.width, pdraw.height);
    const r = slideRect(); const list = strokes[st.idx] || [];
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const s of list) {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width; ctx.beginPath();
      s.pts.forEach((p, i) => { const x = r.x + p.x * r.w, y = r.y + p.y * r.h; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
  }
  let drawing = null;
  pdraw.addEventListener('pointerdown', (ev) => {
    if (!st.pen) return; ev.preventDefault();
    const r = slideRect(); drawing = { color: ev.buttons === 32 || ev.shiftKey ? '#fde047' : '#ef4444', width: ev.shiftKey ? 14 : 5, pts: [{ x: (ev.clientX - r.x) / r.w, y: (ev.clientY - r.y) / r.h }] };
    (strokes[st.idx] = strokes[st.idx] || []).push(drawing); pdraw.setPointerCapture(ev.pointerId);
  });
  pdraw.addEventListener('pointermove', (ev) => {
    if (!drawing) return; const r = slideRect(); drawing.pts.push({ x: (ev.clientX - r.x) / r.w, y: (ev.clientY - r.y) / r.h }); redraw();
  });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) pdraw.addEventListener(t, () => { drawing = null; });
  function togglePen() { st.pen = !st.pen; pdraw.classList.toggle('on', st.pen); if (st.pen && st.laser) toggleLaser(); if (st.pen && st.zoom > 1) { st.zoom = 1; pstage.style.transform = ''; } hud(st.pen ? '펜 모드 (D 로 해제 · E 로 지우기 · Shift 드래그 = 굵은 노랑)' : '펜 해제'); }
  function clearDrawing() { strokes[st.idx] = []; redraw(); hud('지웠습니다'); }
  function toggleLaser() { st.laser = !st.laser; plaser.classList.toggle('on', st.laser); if (st.laser && st.pen) togglePen(); hud(st.laser ? '레이저 포인터 (L 로 해제)' : '레이저 해제'); }
  window.addEventListener('pointermove', (ev) => { if (st.zoom > 1) { const x = ev.clientX / innerWidth * 100, y = ev.clientY / innerHeight * 100; pstage.style.transformOrigin = `${x}% ${y}%`; } if (st.laser) { plaser.style.left = ev.clientX + 'px'; plaser.style.top = ev.clientY + 'px'; } wake(); });

  /* ---- 커서 / 메뉴 자동 숨김 ---- */
  let menuShownAt = 0, lastPointer = 'mouse';
  function wake() {
    if (document.body.classList.contains('hide-cursor') || !$('pmenu').classList.contains('peek')) menuShownAt = performance.now();
    document.body.classList.remove('hide-cursor'); $('pmenu').classList.add('peek'); document.body.classList.add('pf-awake');
    if (cold) coldHint();
    clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!st.pen) document.body.classList.add('hide-cursor'); $('pmenu').classList.remove('peek'); if (!pfPop) document.body.classList.remove('pf-awake'); }, 2500);
  }
  wake();
  window.addEventListener('pointerdown', (ev) => { lastPointer = ev.pointerType || 'mouse'; wake(); }); // 휴대폰: 마우스 움직임이 없으므로 화면을 누를 때도 메뉴를 다시 보여 줌

  /* ---- 입력 ---- */
  function anyOverlayOpen() { return overview.isOpen() || $('phelp').classList.contains('show'); }
  document.addEventListener('keydown', (ev) => {
    const k = ev.key; const ctrl = ev.ctrlKey || ev.metaKey;
    /* 영상만 전체화면일 때: 슬라이드를 넘기면 영상이 사라지며 전체화면이 풀리므로, 키는 영상 조작에만 씀 */
    if (videoFs()) {
      const v = fsEl().tagName === 'VIDEO' ? fsEl() : fsEl().querySelector('video');
      if (!v) return;
      if (k === ' ' || k === 'k' || k === 'K' || k === 'Enter') { ev.preventDefault(); if (v.paused) v.play().catch(() => { }); else v.pause(); }
      else if (k === 'ArrowRight' || k === 'ArrowLeft' || k === 'PageDown' || k === 'PageUp') { ev.preventDefault(); v.currentTime = clamp(v.currentTime + (k === 'ArrowRight' || k === 'PageDown' ? 5 : -5), 0, v.duration || 0); }
      else if (k === 'f' || k === 'F' || k === 'F5') { ev.preventDefault(); fsExit(); }
      return;
    }
    if (ctrl && k.toLowerCase() === 'e') { ev.preventDefault(); if (window.EMBEDDED_DECK) return;
      // 편집기에서 연 발표 창이면: 편집기를 하나 더 열지 않고 이 창을 닫아 원래 편집기로 돌아감
      try { if (window.opener && !window.opener.closed && /editor\.html$/.test(window.opener.location.pathname)) { window.close(); return; } } catch (e) { }
      location.href = `editor.html?deck=${encodeURIComponent(name)}&slide=${st.idx}`; return; }
    /* PowerPoint 슬라이드 쇼 조합키 */
    if (ctrl && !ev.altKey) {
      switch (k.toLowerCase()) {
        case 'p': ev.preventDefault(); togglePen(); return;          // Ctrl+P 펜
        case 'l': ev.preventDefault(); toggleLaser(); return;        // Ctrl+L 레이저
        case 'a': ev.preventDefault(); if (st.pen) togglePen(); if (st.laser) toggleLaser(); hud('화살표(기본 포인터)'); return; // Ctrl+A 화살표
        case 'h': ev.preventDefault(); document.body.classList.add('hide-cursor'); return;   // Ctrl+H 포인터 숨기기
        case 's': ev.preventDefault(); overview.isOpen() ? overview.close() : overview.open(); return; // Ctrl+S 모든 슬라이드
        case 'e': return;
      }
      return;
    }
    if (ev.altKey) { if (k === 'F5') { ev.preventDefault(); openNotes(); } return; }   // Alt+F5 발표자 보기
    if (pfPop) { // 연출 · 타이머 고르기 창: Esc 로 닫고, 타이머 창에서는 1~5 로 고름
      if (k === 'Escape') { ev.preventDefault(); closePops(); return; }
      if (pfPop.dataset.kind === 'cd' && /^[1-5]$/.test(k)) { ev.preventDefault(); const b = pfPop.querySelectorAll('[data-sec]')[+k - 1]; if (b) b.click(); return; }
      if ((k === 'Tab' || k === 'Enter' || k === ' ') && pfPop.contains(document.activeElement)) return; // 창 안의 단추 · 확인란
      closePops();
    }
    if ($('phelp').classList.contains('show')) { ev.preventDefault(); $('phelp').classList.remove('show'); return; }
    if (overview.isOpen()) {
      const mv = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[k];
      if (mv) { ev.preventDefault(); overview.move(mv); }
      else if (k === 'Enter' || k === ' ') { ev.preventDefault(); const j = overview.sel; overview.close(); goto(j, 0); }
      else if (k === 'Home' || k === 'End') { ev.preventDefault(); overview.sel = k === 'Home' ? 0 : N - 1; overview.move(k === 'Home' ? 'left' : 'right'); }
      else if (k === 'Escape' || k === 'o' || k === 'O' || k === 'g' || k === 'G' || k === '-') { ev.preventDefault(); overview.close(); }
      return;
    }
    if (st.blank && !['b', 'B', '.', 'w', 'W', ',', 'F5', 'f', 'F', 'F11'].includes(k)) { setBlank(st.blank); ev.preventDefault(); return; }
    // 번호를 치는 중: Esc = 취소, Backspace = 한 자 지움
    if (st.goto && (k === 'Escape' || k === 'Backspace')) {
      st.goto = k === 'Escape' ? '' : st.goto.slice(0, -1); ev.preventDefault();
      if (st.goto) pgoto.innerHTML = `${st.goto}<small>Enter 로 이동</small>`; else { pgoto.classList.remove('show'); clearTimeout(gotoTimer); }
      return;
    }
    // 숫자 → 슬라이드 이동
    if (/^[0-9]$/.test(k)) { st.goto += k; pgoto.innerHTML = `${st.goto}<small>Enter 로 이동</small>`; pgoto.classList.add('show'); clearTimeout(gotoTimer); gotoTimer = setTimeout(() => { st.goto = ''; pgoto.classList.remove('show'); }, 3000); ev.preventDefault(); return; }
    if (st.goto && k === 'Enter') { const n = parseInt(st.goto, 10); st.goto = ''; pgoto.classList.remove('show'); clearTimeout(gotoTimer); goto(n - 1, 0); ev.preventDefault(); return; }
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter': case 'n': case 'N': ev.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': case 'p': case 'P': ev.preventDefault(); prev(); break;
      case 'Home': ev.preventDefault(); goto(firstVisible(), 0); break;
      case 'End': ev.preventDefault(); { const t = lastVisible(); goto(t, maxStep(slideOf(t))); } break;
      case 'F5': case 'f': case 'F': ev.preventDefault(); toggleFullscreen(); break;
      case 'b': case 'B': case '.': ev.preventDefault(); setBlank('black'); break;
      case 'w': case 'W': case ',': ev.preventDefault(); setBlank('white'); break;
      case '+': case '=': ev.preventDefault(); zoomStage(1); break;
      case '_': ev.preventDefault(); zoomStage(-1); break;
      case '-': ev.preventDefault(); if (st.zoom > 1) zoomStage(-1); else overview.open(); break;   // 확대 중이면 축소, 아니면 모든 슬라이드
      case 'o': case 'O': case 'g': case 'G': ev.preventDefault(); overview.open(); break;
      case 's': case 'S': ev.preventDefault(); openNotes(); break;
      case 'd': case 'D': ev.preventDefault(); togglePen(); break;
      case 'e': case 'E': ev.preventDefault(); clearDrawing(); break;
      case 'l': case 'L': ev.preventDefault(); toggleLaser(); break;
      case 'k': case 'K': ev.preventDefault(); if (CD.end || CD.left != null) cdPause(); else cdChooser(); break;
      case 't': case 'T': ev.preventDefault(); st.showTimer = !st.showTimer; if (st.showTimer && !st.timerStart) startTimer(); pnum.classList.toggle('keep', st.showTimer); updateHud(); hud(st.showTimer ? '타이머 표시 (오른쪽 아래)' : '타이머 숨김'); break;
      case '?': case 'h': case 'H': case 'F1': ev.preventDefault(); $('phelp').classList.add('show'); break;
      case 'Escape':
        if (st.pen) { togglePen(); break; } if (st.laser) { toggleLaser(); break; }
        if (st.ended) { exitShow(); break; }
        if (fsEl()) { /* 브라우저가 전체화면을 해제함 */ hud('한 번 더 Esc: 발표 종료'); break; }
        exitShow(); break;
    }
  });
  // 클릭 = 다음, 우클릭 = 이전, 휠, 터치 스와이프
  pstage.addEventListener('click', (ev) => {
    if (st.pen || anyOverlayOpen()) return;
    if (st.blank) { setBlank(st.blank); return; }
    if (ev.target.closest('video, iframe')) return;                 // 동영상 조작은 넘기지 않음
    const an = ev.target.closest('a[href]');
    if (an) { ev.preventDefault(); const h = (an.getAttribute('href') || '').trim(); if (h && !/^(javascript|data|vbscript):/i.test(h)) window.open(/^[a-z][\w+.-]*:/i.test(h) ? h : 'https://' + h, '_blank', 'noopener'); return; }
    const ln = ev.target.closest('.el[data-link]'); if (ln) { followLink(ln.dataset.link); return; }
    next();
  });
  /* 요소에 건 링크: 슬라이드로 이동 / 웹 주소 열기 */
  function followLink(l) {
    if (l.startsWith('slide:')) { const i = deck.slides.findIndex(s => s.id === l.slice(6)); if (i >= 0) goto(i, 0); return; }
    if (l === 'next') return next(); if (l === 'prev') return prev();
    if (l === 'first') return goto(firstVisible(), 0); if (l === 'last') return goto(lastVisible(), 0);
    const u = l.replace(/^url:/, ''); if (/^https?:\/\//i.test(u) || /^[\w-]+\.html(\?|#|$)/i.test(u)) window.open(u, '_blank', 'noopener'); // 같은 사이트의 페이지(예: quiz.html)도 열기
  }
  /* 동영상(YouTube 등)을 누른 뒤에도 리모컨·키보드가 계속 발표기를 조작하도록 포커스를 되돌림 */
  window.addEventListener('blur', () => setTimeout(() => { const a = document.activeElement; if (a && a.tagName === 'IFRAME' && /youtube|vimeo/i.test(a.src || '')) { a.blur(); window.focus(); } }, 0));
  pblank.addEventListener('click', () => { if (st.blank) setBlank(st.blank); });
  document.addEventListener('contextmenu', (ev) => { ev.preventDefault(); if (ev.target.closest && ev.target.closest('.pf-dock, .pf-pop, .pf-cd, .pmenu')) return; if (!st.pen && !anyOverlayOpen() && lastPointer === 'mouse') prev(); }); // 터치의 길게 누르기는 뒤로 가지 않음
  let wheelLock = 0;
  document.addEventListener('wheel', (ev) => { if (anyOverlayOpen() || ev.ctrlKey || st.blank) return; const t = Date.now(); if (t - wheelLock < 500) return; wheelLock = t; if (ev.deltaY > 0) next(); else if (ev.deltaY < 0) prev(); }, { passive: true });
  let touchX = null, touchY = null, multiTouch = false;
  document.addEventListener('touchstart', (ev) => { if (st.pen) return; multiTouch = ev.touches.length > 1; touchX = ev.touches[0].clientX; touchY = ev.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', (ev) => {
    if (multiTouch || anyOverlayOpen() || st.blank || (ev.target.closest && ev.target.closest('video'))) { touchX = null; return; } // 두 손가락·목록 화면·동영상 조작은 넘기지 않음
    if (touchX == null || st.pen) return; const dx = ev.changedTouches[0].clientX - touchX, dy = ev.changedTouches[0].clientY - touchY; touchX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { ev.preventDefault(); dx < 0 ? next() : prev(); }
  });
  $('pmenu').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-a]'); ev.stopPropagation(); if (!b) return; const a = b.dataset.a;
    if (lastPointer !== 'mouse' && performance.now() - menuShownAt < 400) return; // 터치: 방금 나타난 메뉴는 한 번 더 눌러야 동작
    b.blur();
    if (a === 'fx') { fxSettings(b); return; }
    if (a === 'notes') openNotes(); if (a === 'overview') overview.toggle(); if (a === 'full') toggleFullscreen(); if (a === 'help') $('phelp').classList.add('show'); if (a === 'exit') exitShow();
  });
  $('pend').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a; ev.stopPropagation();
    if (a === 'back') { st.ended = false; $('pend').classList.remove('show'); broadcast(); } if (a === 'first') goto(firstVisible(), 0); if (a === 'exit') exitShow();
  });
  $('phelp').addEventListener('click', () => $('phelp').classList.remove('show'));
  const refitAll = () => { if (curLayer) fitSlide(curLayer, curLayer.firstChild); redraw(); if (overview.isOpen()) overview.refit(); };
  window.addEventListener('resize', refitAll);
  /* 전체화면이 되거나 풀릴 때: 크기 알림(resize)이 늦거나 오지 않는 브라우저가 있어, 바뀐 화면 크기로 다시 맞춤
     (바로 · 그림 두 번 뒤 · 0.35초 뒤 — 화면이 커지는 움직임이 끝난 뒤의 크기까지) */
  function onFullscreen() {
    refitAll(); requestAnimationFrame(() => requestAnimationFrame(refitAll)); setTimeout(refitAll, 350);
    const on = !!fsEl(), b = $('pmenu').querySelector('[data-a=full]');
    if (b) { b.innerHTML = `${icon(on ? 'shrink' : 'expand', 16)}${on ? '전체화면 끝' : '전체화면'}`; b.title = on ? '전체화면 끝내기 (F · Esc)' : '전체화면 (F)'; }
    document.body.classList.toggle('is-full', on);
  }
  document.addEventListener('fullscreenchange', onFullscreen); document.addEventListener('webkitfullscreenchange', onFullscreen);

  /* ======================= 몰입 연출 (pres-fx.css) =======================
     슬라이드 자체(모양 · 위치 · 효과)는 건드리지 않고, 바깥 틀만: 콜드 오픈 · 구역별 진행 막대 · 조작 막대 · 구역 안내 · 토의 타이머 · 끝 화면 */
  document.body.classList.add('pf');
  const applyFx = () => { document.body.classList.toggle('pf-bar-off', !FX.bar); document.body.classList.toggle('pf-dock-off', !FX.dock); };
  const saveFx = () => { try { localStorage.setItem('pres:fx', JSON.stringify(FX)); } catch (e) { } };
  applyFx();
  /* 구역 찾기: 「01」 처럼 큰 두 자리 번호(100px 이상)나 「PART 2」 · 「CHAPTER 3」 글이 있는 장을 구역 첫 장으로 봄 (교안 파일은 그대로) */
  function plain(h) { return String(h || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim(); }
  function divider(sl) { // (발표자 보기에서도 씀 — 그래서 함수 안에서만 값을 만듦)
    const PART_RE = /^(PART|CHAPTER|SECTION|파트)\s*0?(\d{1,2})\b/i;
    const tx = sl.elements.filter(e => e.html && (e.type === 'text' || e.type === 'shape')).map(e => ({ t: plain(e.html), fs: +(e.style && e.style.fontSize) || (e.role === 'title' ? 80 : e.role === 'heading' ? 56 : 32) })).filter(x => x.t);
    const bigs = tx.filter(x => x.fs >= 100 && /^(0[1-9]|1[0-9])$/.test(x.t));
    const big = new Set(bigs.map(x => x.t)).size === 1 ? bigs[0] : null; // 01 · 02 · 03 이 함께 크게 있는 장은 목록(정리)이지 구역 장이 아님
    const part = tx.find(x => x.t.length <= 24 && PART_RE.test(x.t));
    if (!big && !part) return null;
    const no = big ? big.t : String(+part.t.match(PART_RE)[2]).padStart(2, '0');
    const title = tx.filter(x => x !== big && x !== part && !/^\d+$/.test(x.t) && x.t.length <= 40 && !PART_RE.test(x.t))
      .sort((p, q) => wordy(q.t) - wordy(p.t) || q.fs - p.fs)[0]; // 숫자 위주(38,344건)보다 말 제목을 먼저
    function wordy(t) { return /[가-힣A-Za-z]{2}/.test(t) && (t.match(/\d/g) || []).length / t.length < .4 ? 1 : 0; }
    return { no, title: title ? title.t : '' };
  }
  /* SEGS: 진행 막대의 칸 = 구역 (첫 구역 앞의 장들은 '시작' 칸). 구역이 둘보다 적으면 칸 하나 */
  const SEGS = (() => {
    const out = []; let n = 0;
    deck.slides.forEach((sl, i) => {
      const d = visible(i) ? divider(sl) : null;
      const prevNo = out.length ? out[out.length - 1].no : '';
      if (d && d.no !== prevNo) { out.push({ from: i, no: d.no, title: d.title, num: true, cnt: 0 }); n++; } // 같은 번호가 또 나오면(예: 04 실습) 그 구역의 이어짐
      else if (!out.length) out.push({ from: i, no: '', title: '시작', num: false, cnt: 0 });
      if (visible(i)) out[out.length - 1].cnt++;
    });
    if (n < 2) return [{ from: 0, no: '', title: '', num: false, cnt: deck.slides.filter(s => !s.hidden).length || 1 }];
    return out.filter(g => g.cnt > 0);
  })();
  const NUMBERED = SEGS.filter(g => g.num);
  const segOf = (i) => { let k = 0; for (let j = 0; j < SEGS.length; j++) if (SEGS[j].from <= i) k = j; return k; };
  const segLabel = (g) => g.num ? `${g.no} · ${g.title || '구역'}` : g.title;
  const VIS_BEFORE = []; { let c = 0; for (let i = 0; i < N; i++) { VIS_BEFORE[i] = c; if (visible(i)) c++; } } // 앞에 있는 보이는 장 수
  /* 아래 진행 막대: 칸 너비 = 그 구역의 장 수, 지금 구역은 작업장 색으로 차오름 */
  const track = $('pfTrack');
  track.innerHTML = SEGS.map(g => `<span class="sg" style="flex-grow:${g.cnt}"><i></i></span>`).join('');
  function fxTrack() {
    const k = segOf(st.idx), g = SEGS[k], segs = track.children;
    const done = clamp(VIS_BEFORE[st.idx] - VIS_BEFORE[g.from] + (visible(st.idx) ? 1 : 0), 0, g.cnt);
    for (let j = 0; j < segs.length; j++) {
      segs[j].className = 'sg' + (j < k ? ' past' : j === k ? ' cur' : '');
      segs[j].firstChild.style.transform = `scaleX(${j < k ? 1 : j === k ? done / g.cnt : 0})`;
    }
  }
  /* 조작 막대: 이전 · 위치 · 다음 | 구역 | 펜 · 레이저 · 검은 화면 · 토의 타이머 | 시간 */
  const dock = $('pfDock');
  dock.innerHTML = `<button class="pf-b" data-d="prev" title="이전 (←)" aria-label="이전">${icon('chevL', 18)}</button>
    <div class="pf-pos"><b id="pfNo">1</b><span>/ ${N}</span><em id="pfStep"></em></div>
    <button class="pf-b" data-d="next" title="다음 (→ · Space)" aria-label="다음">${icon('chevR', 18)}</button>
    ${NUMBERED.length ? `<span class="pf-sep"></span><div class="pf-secs">${SEGS.map((g, j) => g.num ? `<button class="pf-sec" data-seg="${j}" title="${esc(segLabel(g))} — 이 구역으로" aria-label="${esc(segLabel(g))}"><b>${esc(g.no)}</b><span class="t">${esc(g.title)}</span></button>` : '').join('')}</div>` : ''}
    <span class="pf-sep pf-wide"></span>
    <div class="pf-tools pf-wide">
      <button class="pf-b" data-d="pen" title="펜 (D) — Shift 로 굵은 노랑 · E 지우기" aria-label="펜">${icon('pen', 18)}</button>
      <button class="pf-b" data-d="laser" title="레이저 포인터 (L)" aria-label="레이저 포인터">${icon('laser', 18)}</button>
      <button class="pf-b" data-d="blank" title="검은 화면 (B) — 청중의 눈을 발표자에게" aria-label="검은 화면">${icon('screen', 18)}</button>
      <button class="pf-b" data-d="cd" title="토의 · 실습 타이머 (K)" aria-label="토의 실습 타이머">${icon('timer', 18)}</button>
    </div>
    <span class="pf-sep"></span>
    <button class="pf-time" id="pfTime" data-d="time" title="지난 시간 · 남은 시간 (누르거나 T: 화면 오른쪽 아래에도 표시)"></button>`;
  function fxHud() {
    if (!dock.firstChild) return;
    const ms = maxStep(slideOf(st.idx)), k = segOf(st.idx);
    $('pfNo').textContent = st.idx + 1;
    $('pfStep').textContent = ms ? `${st.step}/${ms}` : '';
    dock.querySelectorAll('.pf-sec').forEach(b => { const j = +b.dataset.seg; b.classList.toggle('cur', j === k); b.classList.toggle('past', j < k); if (j === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    const q = (s) => dock.querySelector(s);
    q('[data-d=pen]').classList.toggle('on', !!st.pen); q('[data-d=laser]').classList.toggle('on', !!st.laser); q('[data-d=blank]').classList.toggle('on', st.blank === 'black'); q('[data-d=cd]').classList.toggle('on', !!(CD.end || CD.left != null));
    fxTime(); fxTrack();
  }
  function fxTime() {
    const el = $('pfTime'); if (!el) return;
    if (!st.timerStart) { el.className = 'pf-time'; el.innerHTML = `${icon('clock', 15)}<span>시작 전</span>`; return; }
    const s = Math.floor(elapsedMs() / 1000), tg = PresTime.target(name), lv = PresTime.level(tg * 60 - s, tg);
    el.className = 'pf-time ' + lv + (st.pausedAt ? ' paused' : '');
    el.innerHTML = `${icon('clock', 15)}<span>${PresTime.fmt(s)}</span>` + (tg ? `<small>${lv === 'over' ? PresTime.fmt(s - tg * 60) + ' 넘김' : '남은 ' + PresTime.fmt(tg * 60 - s)}</small>` : '');
  }
  setInterval(() => { if (document.body.classList.contains('pf-awake')) fxTime(); }, 1000);
  dock.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-d], [data-seg]'); ev.stopPropagation(); if (!b) return;
    if (lastPointer !== 'mouse' && performance.now() - menuShownAt < 400) return; // 터치: 방금 나타난 막대는 한 번 더 눌러야 동작
    const d = b.dataset.d; b.blur();
    if (b.dataset.seg != null) { goto(SEGS[+b.dataset.seg].from, 0); return; }
    if (d === 'prev') prev(); else if (d === 'next') next();
    else if (d === 'pen') togglePen(); else if (d === 'laser') toggleLaser();
    else if (d === 'blank') setBlank('black');
    else if (d === 'cd') { if (CD.end || CD.left != null) cdStop(); else cdChooser(b); }
    else if (d === 'time') { st.showTimer = !st.showTimer; if (st.showTimer && !st.timerStart) startTimer(); pnum.classList.toggle('keep', st.showTimer); updateHud(); hud(st.showTimer ? '타이머 표시 (오른쪽 아래)' : '타이머 숨김'); }
    fxHud();
  });
  /* 장이 바뀔 때: 진행 막대가 차오르고, 건너뛰어(목록 · 번호 · 뒤로) 다른 구역에 들어오면 아래 왼쪽에 지금 구역을 잠깐 알림
     (차례대로 넘어와 구역 첫 장에 닿은 때는 그 장이 이미 구역을 알리므로 띄우지 않음) */
  let cueT = 0;
  function fxSlide(from, to, had) {
    rememberLast(false);
    if (!had || from === to || !NUMBERED.length) return;
    const a = segOf(from), b = segOf(to); if (a === b) return;
    const g = SEGS[b]; if (g.from === to && to > from) return;
    const n = NUMBERED.indexOf(g), cue = $('pfCue');
    cue.innerHTML = `${g.num ? `<b>${esc(g.no)}</b>` : ''}<span>${esc(g.title || '')}</span>${n >= 0 ? `<em>${n + 1} / ${NUMBERED.length} 구역</em>` : ''}`;
    cue.classList.remove('show'); void cue.offsetWidth; cue.classList.add('show');
    clearTimeout(cueT); cueT = setTimeout(() => cue.classList.remove('show'), 2200);
  }
  /* 목록의 [이어서 발표] 를 위해 마지막으로 본 장을 기억 (이 브라우저에만) */
  function rememberLast(done) {
    if (window.EMBEDDED_DECK || qs('draft') || cold) return;
    try { localStorage.setItem('pres:last:' + name, JSON.stringify({ i: st.idx, n: N, at: Date.now(), done: !!done || st.idx === lastVisible() })); } catch (e) { }
  }
  /* 끝 화면: 오늘 다룬 구역 (번호 구역이 있을 때 · 여섯 개까지) */
  function recapHtml() {
    if (!NUMBERED.length) return '';
    const list = NUMBERED.slice(0, 6).map(g => `<span><b>${esc(g.no)}</b>${esc(g.title || '구역')}</span>`).join('');
    return `<div class="pf-recap-l">오늘 다룬 것</div><div class="pf-recap-c">${list}${NUMBERED.length > 6 ? `<span>외 ${NUMBERED.length - 6}개</span>` : ''}</div>`;
  }

  /* ---- 콜드 오픈: 검은 화면으로 기다리다가 첫 클릭(→ · Space · 리모컨)에 표지가 천천히 드러남. 발표 시간도 그때부터 ---- */
  let coldT = 0;
  function coldHint() { const c = $('pfCold'); if (!c) return; c.classList.remove('quiet'); clearTimeout(coldT); coldT = setTimeout(() => c.classList.add('quiet'), 3500); }
  if (cold) {
    const c = document.createElement('div'); c.className = 'pf-cold'; c.id = 'pfCold';
    c.innerHTML = `<div class="hint"><span>준비되었습니다 — 화면을 누르거나 <kbd>→</kbd> · 리모컨 [다음] 을 누르면 <b>표지가 열립니다</b></span><span class="sub"><kbd>F</kbd> 전체화면 · <kbd>S</kbd> 발표자 보기 · 이 암전은 오른쪽 위 [연출] 에서 끌 수 있습니다</span></div>`;
    c.addEventListener('click', (ev) => { ev.stopPropagation(); next(); });
    document.body.appendChild(c); document.body.classList.add('pf-coldon'); coldHint();
  }
  function startShow() {
    if (!cold) return; cold = false;
    startTimer();
    if (curLayer) { curLayer.remove(); curLayer = null; } // 표지를 다시 그려, 등장 효과가 암전이 걷히는 동안 보이게
    show(st.idx, 0, 1);
    document.body.classList.remove('pf-coldon');
    const c = $('pfCold'); if (c) { c.classList.add('go'); setTimeout(() => c.remove(), 1000); }
    fxHud();
  }
  function dropCold() { if (!cold) return; cold = false; document.body.classList.remove('pf-coldon'); const c = $('pfCold'); if (c) c.remove(); }

  /* ---- 작은 창 (연출 설정 · 타이머 고르기) ---- */
  function closePops() { if (pfPop) { pfPop.remove(); pfPop = null; } }
  document.addEventListener('pointerdown', (ev) => { if (pfPop && !pfPop.contains(ev.target) && !ev.target.closest('[data-a=fx], [data-d=cd]')) closePops(); }, true);
  function popAt(el, anchor, below) {
    closePops(); pfPop = el; document.body.appendChild(el);
    const r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight - 90, bottom: innerHeight - 90, width: 0 };
    const W = el.offsetWidth, H = el.offsetHeight;
    el.style.left = Math.round(clamp(r.left + r.width / 2 - W / 2, 8, innerWidth - W - 8)) + 'px';
    el.style.top = Math.round(below ? Math.min(r.bottom + 8, innerHeight - H - 8) : Math.max(8, r.top - H - 8)) + 'px';
    const f = el.querySelector('button, input'); if (f) f.focus({ preventScroll: true });
  }
  function fxSettings(anchor) {
    if (pfPop && pfPop.dataset.kind === 'fx') { closePops(); return; }
    const el = document.createElement('div'); el.className = 'pf-pop'; el.dataset.kind = 'fx'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '연출 설정');
    const row = (k, t, d) => `<label class="pf-row"><input type="checkbox" data-k="${k}" ${FX[k] ? 'checked' : ''}><span><b>${t}</b><small>${d}</small></span></label>`;
    el.innerHTML = `<div class="pf-pop-h">연출 <small>이 브라우저에 기억 · 슬라이드는 그대로</small></div>`
      + row('cold', '시작 암전 → 표지', '목록에서 열면 검은 화면으로 기다렸다가, 첫 클릭에 표지가 드러납니다')
      + row('bar', '구역별 진행 막대', '화면 맨 아래 얇은 막대 — 지금 구역이 작업장 색으로 차오릅니다')
      + row('dock', '조작 막대', '마우스를 움직이면 아래에 이전 · 다음 · 구역 · 펜 · 타이머가 나타납니다');
    el.addEventListener('change', (ev) => { const k = ev.target.dataset.k; if (!k) return; FX[k] = ev.target.checked; saveFx(); applyFx(); });
    popAt(el, anchor, true);
  }

  /* ---- 토의 · 실습 타이머 (K): 화면 가운데 크게 나타났다가 왼쪽 위로 작게. 누르면 크게 · 작게, 0 이 되면 두 번 깜빡임 ---- */
  const cdEl = $('pfCd');
  const RING = 2 * Math.PI * 15.5;
  cdEl.innerHTML = `<svg class="ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5" class="bg"/><circle cx="18" cy="18" r="15.5" class="fg" stroke-dasharray="${RING.toFixed(2)}"/></svg><span class="v" role="timer"></span><span class="l">토의 · 실습</span><button class="x" type="button" title="타이머 끄기" aria-label="타이머 끄기">${icon('x', 14)}</button>`;
  cdEl.addEventListener('click', (ev) => { ev.stopPropagation(); if (ev.target.closest('.x')) { cdStop(); return; } clearTimeout(CD.shrinkT); cdEl.classList.toggle('big'); });
  function cdChooser(anchor) {
    if (pfPop && pfPop.dataset.kind === 'cd') { closePops(); return; }
    const el = document.createElement('div'); el.className = 'pf-pop pf-pop-cd'; el.dataset.kind = 'cd'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '토의 · 실습 타이머');
    const opts = [[30, '30초'], [60, '1분'], [180, '3분'], [300, '5분'], [600, '10분']];
    el.innerHTML = `<div class="pf-pop-h">토의 · 실습 타이머 <small>숫자 1~5 로도 고릅니다</small></div><div class="pf-cd-opts">${opts.map(([v, t], i) => `<button type="button" data-sec="${v}"><kbd>${i + 1}</kbd>${t}</button>`).join('')}</div>`;
    el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-sec]'); if (!b) return; closePops(); cdStart(+b.dataset.sec); });
    popAt(el, anchor || (document.body.classList.contains('pf-awake') && FX.dock ? dock.querySelector('[data-d=cd]') : null), false);
  }
  const cdText = (sec) => { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
  function cdDraw() {
    const left = CD.left != null ? CD.left : Math.max(0, (CD.end - Date.now()) / 1000);
    cdEl.querySelector('.v').textContent = cdText(left);
    cdEl.querySelector('.fg').style.strokeDashoffset = (RING * (1 - left / CD.total)).toFixed(2);
    cdEl.classList.toggle('paused', CD.left != null);
    cdEl.classList.toggle('low', left > 0 && left <= Math.min(10, CD.total / 6));
    if (CD.end && left <= 0) {
      CD.end = 0; clearInterval(CD.t); cdEl.classList.remove('low'); cdEl.classList.add('done'); cdEl.querySelector('.v').textContent = '시간 끝';
      clearTimeout(CD.hideT); CD.hideT = setTimeout(cdStop, 12000); fxHud();
    }
  }
  function cdStart(sec) {
    clearInterval(CD.t); clearTimeout(CD.hideT);
    CD.total = sec; CD.left = null; CD.end = Date.now() + sec * 1000;
    cdEl.hidden = false; cdEl.classList.remove('done', 'paused', 'low'); cdEl.classList.add('big');
    cdDraw(); CD.t = setInterval(cdDraw, 250);
    clearTimeout(CD.shrinkT); CD.shrinkT = setTimeout(() => cdEl.classList.remove('big'), 1800);
    hud(`토의 · 실습 ${cdText(sec)} — K: 멈춤 · 계속 · 타이머를 누르면 크게 · 작게`); fxHud();
  }
  function cdPause() {
    if (cdEl.classList.contains('done')) { cdStop(); return; }
    if (CD.left != null) { CD.end = Date.now() + CD.left * 1000; CD.left = null; CD.t = setInterval(cdDraw, 250); hud('타이머 계속'); }
    else if (CD.end) { CD.left = Math.max(0, (CD.end - Date.now()) / 1000); CD.end = 0; clearInterval(CD.t); hud('타이머 멈춤 — K 로 계속 · × 로 끄기'); }
    cdDraw(); fxHud();
  }
  function cdStop() { clearInterval(CD.t); clearTimeout(CD.hideT); clearTimeout(CD.shrinkT); CD.end = 0; CD.left = null; cdEl.hidden = true; cdEl.classList.remove('big', 'done', 'paused', 'low'); fxHud(); }

  show(st.idx, 0, 1);
  if (!fsEl() && !cold) hud(matchMedia('(pointer: coarse)').matches ? '좌우로 밀어서 넘기기' : 'F 또는 F5: 전체화면  ·  ?: 단축키 도움말');

  /* ======================= 발표자 보기 ======================= */
  function notesView() {
    document.body.className = 'notes-view';
    const tg0 = PresTime.target(name), plan = PresTime.plan(deck);
    document.body.innerHTML = `<div class="nv">
      <div class="nv-top">
        <div class="timer" id="timer" title="지난 시간 (멈춘 시간 빼고)">00:00</div>
        <button class="btn sm" id="tPause" title="타이머 멈춤 · 계속">멈춤</button>
        <button class="btn sm" id="tReset" title="타이머를 0 으로 (이번 기록도 새로 시작)">초기화</button>
        <label class="nv-goal" title="발표 목표 시간 — 남은 시간이 10%(최소 2분) 이하면 노랑, 넘으면 빨강">목표 <input type="number" id="tGoal" min="0" max="600" step="1" inputmode="numeric" value="${tg0 || ''}" placeholder="${plan.total ? Math.round(plan.total / 60) : '—'}">분</label>
        <div class="nv-remain" id="remain"></div>
        <span class="sep"></span>
        <div id="pos" style="font-size:18px;font-weight:600"></div>
        <div class="nv-blank" id="blankTag" hidden></div>
        <div class="grow"></div>
        <button class="btn" id="bPrev">${icon('back', 16)}이전</button><button class="btn ink" id="bNext">다음${icon('arrowRight', 16)}</button>
        <span class="sep"></span>
        <button class="btn sm" id="bBig" title="노트 글자 크게">가+</button>
        <div class="clock" id="clock"></div>
      </div>
      <div class="nv-cur" id="cur"></div>
      <div class="nv-right">
        <div class="nv-pace" id="pace"></div>
        <div><div class="lbl">다음</div><div class="nv-next" id="next"></div></div>
        <div class="nv-notes" id="notes"></div>
      </div>
      <div class="nv-goto" id="ngoto"></div></div>`;
    const $ = (id) => document.getElementById(id);
    let s = { idx: 0, step: 0, timerStart: null, pausedAt: null, mark: 0, ended: false, blank: '' };
    const last = PresTime.last(name);
    /* 지금 구역 (발표 화면의 진행 막대와 같은 기준: 큰 두 자리 번호 · PART 글이 있는 장이 둘 이상일 때) */
    const DIVS = deck.slides.map((sl, i) => !sl.hidden && divider(sl)).map((d, i) => d ? Object.assign({ i }, d) : null).filter(Boolean).filter((d, j, a) => !j || a[j - 1].no !== d.no);
    const secAt = (i) => { if (DIVS.length < 2) return ''; let g = null; for (const d of DIVS) if (d.i <= i) g = d; return g ? `${g.no} ${g.title}`.trim() : ''; };
    function render() {
      if (!deck.slides[s.idx]) return; // 발표 창과 교안 사본이 다른 경우
      const cur = $('cur'), nx = $('next'); cur.innerHTML = ''; nx.innerHTML = '';
      const a = renderSlide(deck.slides[s.idx], deck, { mode: 'present', step: s.step }); cur.appendChild(a); fitSlide(cur, a);
      const ms = maxStep(deck.slides[s.idx]);
      let nextLabel = '';
      if (s.step < ms) { const b = renderSlide(deck.slides[s.idx], deck, { mode: 'present', step: s.step + 1 }); nx.appendChild(b); fitSlide(nx, b); nextLabel = `다음 클릭: 단계 ${s.step + 1}/${ms}`; }
      else { let j = s.idx + 1; while (j < N && deck.slides[j].hidden) j++; if (j < N) { const b = renderSlide(deck.slides[j], deck, { mode: 'present', step: 0 }); nx.appendChild(b); fitSlide(nx, b); nextLabel = `다음 슬라이드 ${j + 1}`; } else nextLabel = '마지막 슬라이드'; }
      nx.previousElementSibling.textContent = nextLabel;
      $('notes').innerHTML = `<div class="lbl">노트</div>` + (esc(deck.slides[s.idx].notes || '').trim() || '<span class="muted">(노트 없음)</span>');
      const sg = secAt(s.idx);
      $('pos').textContent = (sg ? sg + '  ·  ' : '') + `${s.idx + 1} / ${N}` + (ms ? ` · ${s.step}/${ms}` : '') + (deck.slides[s.idx].hidden ? ' · 숨긴 슬라이드' : '') + (s.ended ? ' · 종료' : '');
      const bt = $('blankTag'); bt.hidden = !s.blank; bt.textContent = s.blank === 'white' ? '흰 화면 중 (W)' : '검은 화면 중 (B)';
    }
    const elapsed = () => s.timerStart ? Math.max(0, ((s.pausedAt || Date.now()) - s.timerStart) / 1000) : 0;
    /* 이 장에 머문 시간 · 지난 기록(또는 노트에 적은 계획)과 비교한 빠르기 */
    function pace() {
      const sl = deck.slides[s.idx]; if (!sl) return '';
      const here = s.timerStart ? Math.max(0, elapsed() - (s.mark || 0) / 1000) : 0;
      const parts = [`<span>이 장 <b>${PresTime.fmt(here)}</b></span>`];
      let ref = null, label = '';
      if (last && last.slides[sl.id] != null) { parts.push(`<span class="muted">지난 기록 ${PresTime.fmt(last.slides[sl.id])}</span>`); ref = PresTime.expectedStart(deck, last, sl.id); label = '지난 기록'; }
      const p = plan.by[sl.id];
      if (p && p.dur != null) parts.push(`<span class="muted">계획 ${PresTime.fmt(p.dur)}</span>`);
      if (ref == null && p && p.start != null) { ref = p.start; label = '노트 계획'; }
      if (ref != null && s.timerStart) {
        const d = (s.mark || 0) / 1000 - ref;
        parts.push(Math.abs(d) < 15 ? `<span class="pace-ok">${label}과 비슷</span>` : `<span class="${d > 0 ? 'pace-late' : 'pace-ok'}">${label}보다 ${PresTime.fmt(Math.abs(d))} ${d > 0 ? '늦음' : '빠름'}</span>`);
      }
      return parts.join('');
    }
    function tick() {
      const t = elapsed(), tg = PresTime.target(name);
      $('timer').textContent = PresTime.fmt(t);
      $('timer').classList.toggle('paused', !!s.pausedAt);
      $('tPause').textContent = !s.timerStart ? '시작' : s.pausedAt ? '계속' : '멈춤';
      const r = $('remain'), lv = PresTime.level(tg * 60 - t, tg);
      r.className = 'nv-remain ' + lv;
      r.textContent = !tg ? '' : lv === 'over' ? `${PresTime.fmt(t - tg * 60)} 넘김` : `남은 ${PresTime.fmt(tg * 60 - t)}`;
      $('pace').innerHTML = pace();
      $('clock').textContent = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    setInterval(tick, 1000); tick();
    const send = (m) => channel && channel.postMessage(Object.assign({ type: 'nav' }, m));
    const edge = (d) => { let j = d > 0 ? 0 : N - 1; while (j >= 0 && j < N && deck.slides[j].hidden) j += d; return j >= 0 && j < N ? j : (d > 0 ? 0 : N - 1); }; // 숨긴 슬라이드를 건너뛴 처음 · 끝
    if (channel) channel.onmessage = (ev) => { const m = ev.data || {}; if (m.type === 'bye') { window.close(); return; } if (m.type === 'state') { s = { idx: m.idx, step: m.step, timerStart: m.timerStart, pausedAt: m.pausedAt || null, mark: m.mark || 0, ended: m.ended, blank: m.blank || '' }; render(); tick(); } };
    $('bNext').onclick = () => send({ cmd: 'next' }); $('bPrev').onclick = () => send({ cmd: 'prev' });
    $('tReset').onclick = async () => { if (s.timerStart && elapsed() > 60 && !(await uiConfirm('타이머를 0 으로 되돌릴까요?', '이번 발표의 장별 시간도 새로 잽니다.', '0 으로'))) return; send({ cmd: 'timer', value: Date.now() }); };
    $('tPause').onclick = () => send({ cmd: 'pause' });
    $('tGoal').onchange = () => { $('tGoal').value = PresTime.setTarget(name, $('tGoal').value) || ''; tick(); };
    $('bBig').onclick = () => $('bBig').classList.toggle('active', $('notes').classList.toggle('big'));
    /* 번호 + Enter = 그 슬라이드로 (PowerPoint 와 같음) */
    let goto = '', gotoTimer = null;
    const showGoto = () => { const g = $('ngoto'); g.innerHTML = goto ? `${goto}<small>Enter 로 이동 · Esc 취소</small>` : ''; g.classList.toggle('show', !!goto); clearTimeout(gotoTimer); if (goto) gotoTimer = setTimeout(() => { goto = ''; showGoto(); }, 3000); };
    document.addEventListener('keydown', (ev) => {
      if (ev.target && ev.target.tagName === 'INPUT') { if (ev.key === 'Enter' || ev.key === 'Escape') ev.target.blur(); return; } // 목표 시간 칸에 쓰는 중
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (/^[0-9]$/.test(ev.key)) { ev.preventDefault(); goto += ev.key; showGoto(); return; }
      if (goto && (ev.key === 'Enter' || ev.key === 'Escape' || ev.key === 'Backspace')) {
        ev.preventDefault();
        if (ev.key === 'Enter') send({ cmd: 'goto', idx: clamp(parseInt(goto, 10) - 1, 0, N - 1) });
        goto = ev.key === 'Backspace' ? goto.slice(0, -1) : ''; showGoto(); return;
      }
      switch (ev.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter': case 'n': case 'N': ev.preventDefault(); send({ cmd: 'next' }); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': case 'p': case 'P': ev.preventDefault(); send({ cmd: 'prev' }); break;
        case 'Home': ev.preventDefault(); send({ cmd: 'goto', idx: edge(1) }); break; case 'End': ev.preventDefault(); send({ cmd: 'goto', idx: edge(-1) }); break;
        case 'b': case 'B': case '.': ev.preventDefault(); send({ cmd: 'blank', kind: 'black' }); break;
        case 'w': case 'W': case ',': ev.preventDefault(); send({ cmd: 'blank', kind: 'white' }); break;
        case 'Escape': window.close(); break;
        case 'F1': case '?': ev.preventDefault(); window.open('shortcuts.html#notes', '_blank'); break;
      }
    });
    window.addEventListener('resize', render);
    render(); if (channel) channel.postMessage({ type: 'hello' });
    if (!channel) $('notes').innerHTML = '<div class="lbl">이 브라우저는 창 간 동기화를 지원하지 않습니다.</div>';
  }

  /* ======================= 인쇄(PDF) 모드 ======================= */
  function renderPrint() {
    document.body.className = 'print-mode';
    document.body.innerHTML = `<div class="print-bar"><b>${esc(deck.title)}</b><span class="muted">슬라이드 ${N}장 · 인쇄 대화상자에서 "PDF로 저장"을 선택하세요 (여백 없음, 가로 방향)</span><span style="flex:1"></span><button class="btn ink" onclick="window.print()">인쇄 · PDF 저장</button><a class="btn" href="gyoan.html">교안 목록</a></div>`;
    for (const s of deck.slides) {
      if (s.hidden) continue;
      const page = document.createElement('div'); page.className = 'print-page';
      page.appendChild(renderSlide(s, deck, { mode: 'present', step: Infinity }));
      document.body.appendChild(page);
    }
  }
})();
