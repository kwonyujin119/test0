/* 교안 발표기
   - 프레젠터 리모컨(PageUp/PageDown/F5/Esc/B)과 키보드/클릭/터치로 조작
   - 발표자 보기(노트·타이머·다음 슬라이드) 창과 BroadcastChannel 로 동기화
   - 단독 HTML(EMBEDDED_DECK) / 인쇄(PDF) 모드 지원 */
'use strict';
(async function () {
  const name = qs('deck') || 'deck';
  const role = qs('role') || 'main';
  let deck;
  if (window.EMBEDDED_DECK) deck = window.EMBEDDED_DECK;
  else {
    await API.init();
    try {
      if (qs('draft')) deck = Draft.get(name);
      if (!deck) deck = await API.load(name);
    } catch (e) { document.body.innerHTML = `<div style="color:#fff;padding:40px;font-family:sans-serif">교안을 불러올 수 없습니다: ${esc(e.message)}<br><br><a href="index.html" style="color:#8cf">← 목록으로</a></div>`; return; }
  }
  if (!deck.slides || !deck.slides.length) deck.slides = [newSlide('blank')];
  document.title = deck.title + (role === 'notes' ? ' · 발표자 보기' : ' · 발표');
  const N = deck.slides.length;
  const channel = ('BroadcastChannel' in window) ? new BroadcastChannel('gyoan:' + name) : null;

  if (qs('print')) return renderPrint();
  if (role === 'notes') return notesView();

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
      <h3>발표 단축키 <span class="muted" style="font-weight:400;font-size:13px">(프레젠터 리모컨의 ▶/◀ = PageDown/PageUp)</span></h3>
      <div class="cols">
        <div><span>다음</span><span><kbd>→</kbd> <kbd>↓</kbd> <kbd>PgDn</kbd> <kbd>Space</kbd> <kbd>Enter</kbd> <kbd>N</kbd> 클릭</span></div>
        <div><span>이전</span><span><kbd>←</kbd> <kbd>↑</kbd> <kbd>PgUp</kbd> <kbd>Backspace</kbd> <kbd>P</kbd> 우클릭</span></div>
        <div><span>처음 / 끝</span><span><kbd>Home</kbd> / <kbd>End</kbd></span></div>
        <div><span>특정 슬라이드로</span><span>숫자 입력 후 <kbd>Enter</kbd></span></div>
        <div><span>전체화면</span><span><kbd>F</kbd> <kbd>F5</kbd> <kbd>F11</kbd></span></div>
        <div><span>검은 / 흰 화면</span><span><kbd>B</kbd> <kbd>.</kbd> / <kbd>W</kbd></span></div>
        <div><span>슬라이드 한눈에</span><span><kbd>O</kbd> <kbd>G</kbd> <kbd>-</kbd></span></div>
        <div><span>발표자 보기 창</span><span><kbd>S</kbd></span></div>
        <div><span>펜 그리기 / 지우기</span><span><kbd>D</kbd> / <kbd>E</kbd></span></div>
        <div><span>레이저 포인터</span><span><kbd>L</kbd></span></div>
        <div><span>타이머 표시</span><span><kbd>T</kbd></span></div>
        <div><span>이 도움말</span><span><kbd>?</kbd> <kbd>H</kbd> <kbd>F1</kbd></span></div>
        <div><span>발표 종료</span><span><kbd>Esc</kbd> (전체화면 해제 → 한 번 더)</span></div>
        <div><span>편집기로</span><span><kbd>Ctrl+E</kbd></span></div>
      </div>
      <div class="muted" style="margin-top:14px;font-size:13px">아무 키나 눌러 닫기</div>
    </div></div>
    <div class="pmenu peek" id="pmenu">
      <button class="btn sm" data-a="notes" title="발표자 보기 (S)">노트</button>
      <button class="btn sm" data-a="overview" title="한눈에 보기 (O)">목록</button>
      <button class="btn sm" data-a="full" title="전체화면 (F)">전체화면</button>
      <button class="btn sm" data-a="help" title="도움말 (?)">?</button>
      <button class="btn sm" data-a="exit" title="종료 (Esc)">✕</button>
    </div>
    <div class="pend" id="pend">
      <div>발표가 끝났습니다</div>
      <div style="display:flex;gap:10px"><button class="btn" data-a="back">← 마지막 슬라이드</button><button class="btn" data-a="first">처음부터</button><button class="btn primary" data-a="exit">종료</button></div>
    </div>`;
  const $ = (id) => document.getElementById(id);
  const pstage = $('pstage'), pbar = $('pbar'), pnum = $('pnum'), pblank = $('pblank'), pdraw = $('pdraw'), plaser = $('plaser'), phud = $('phud'), pgoto = $('pgoto');

  const st = { idx: clamp(parseInt(qs('start') || '0', 10) || 0, 0, N - 1), step: 0, blank: '', pen: false, laser: false, goto: '', timerStart: null, showTimer: false, ended: false };
  const strokes = {}; // idx -> [[{x,y},...], ...] (슬라이드 기준 0~1 좌표)
  let curLayer = null, curNodes = null, hudTimer = null, gotoTimer = null, idleTimer = null, hideMenuTimer = null;

  const slideOf = (i) => deck.slides[i];
  const transitionOf = (i) => { const t = slideOf(i).transition; return t === undefined || t === '' ? (deck.transition || 'fade') : t; };

  function makeLayer(i, step) {
    const layer = document.createElement('div'); layer.className = 'layer';
    const s = renderSlide(slideOf(i), deck, { mode: 'present', step });
    layer.appendChild(s);
    return layer;
  }
  function show(i, step, dir) {
    const old = curLayer;
    const layer = makeLayer(i, step);
    const tr = old ? transitionOf(i) : 'none';
    pstage.className = 'pstage' + (tr !== 'none' ? ' t-' + tr : '') + (dir < 0 ? ' back' : '');
    if (old) { old.classList.add('out'); old.classList.remove('in'); }
    layer.classList.add('in');
    pstage.appendChild(layer); curLayer = layer;
    fitSlide(layer, layer.firstChild);
    curNodes = Array.from(layer.querySelectorAll('.slide > .el')).map(n => ({ n, e: slideOf(i).elements.find(e => e.id === n.dataset.id) }));
    if (old) setTimeout(() => old.remove(), 600);
    st.idx = i; st.step = step;
    updateHud(); redraw(); broadcast();
  }
  function applyStep() {
    if (!curNodes) return;
    for (const { n, e } of curNodes) if (e) applyStepToNode(e, n, st.step);
    updateHud(); broadcast();
  }
  function updateHud() {
    pbar.style.width = ((st.idx + 1) / N * 100) + '%';
    const ms = maxStep(slideOf(st.idx));
    pnum.textContent = `${st.idx + 1} / ${N}` + (ms ? `  ·  ${st.step}/${ms}` : '') + (st.showTimer ? '   ' + timerText() : '');
  }
  function timerText() { if (!st.timerStart) return '00:00'; const s = Math.floor((Date.now() - st.timerStart) / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  setInterval(() => { if (st.showTimer) updateHud(); }, 1000);

  function next() {
    if (st.ended) { return; }
    if (!st.timerStart) st.timerStart = Date.now();
    if (st.step < maxStep(slideOf(st.idx))) { st.step++; applyStep(); return; }
    if (st.idx < N - 1) show(st.idx + 1, 0, 1);
    else endShow();
  }
  function prev() {
    if (st.ended) { st.ended = false; $('pend').classList.remove('show'); return; }
    if (st.step > 0) { st.step--; applyStep(); return; }
    if (st.idx > 0) show(st.idx - 1, maxStep(slideOf(st.idx - 1)), -1);
  }
  function goto(i, step) { i = clamp(i, 0, N - 1); st.ended = false; $('pend').classList.remove('show'); show(i, step || 0, i >= st.idx ? 1 : -1); }
  function endShow() { st.ended = true; $('pend').classList.add('show'); broadcast(); }
  function broadcast() { if (channel) channel.postMessage({ type: 'state', idx: st.idx, step: st.step, ended: st.ended, timerStart: st.timerStart }); }
  if (channel) channel.onmessage = (ev) => {
    const m = ev.data || {};
    if (m.type === 'hello') broadcast();
    if (m.type === 'nav') { if (m.cmd === 'next') next(); else if (m.cmd === 'prev') prev(); else if (m.cmd === 'goto') goto(m.idx, 0); else if (m.cmd === 'timer') { st.timerStart = m.value; broadcast(); } }
  };

  /* ---- 화면 상태 ---- */
  function setBlank(kind) { st.blank = st.blank === kind ? '' : kind; pblank.className = 'pblank ' + st.blank; }
  function hud(msg) { phud.textContent = msg; phud.classList.add('show'); clearTimeout(hudTimer); hudTimer = setTimeout(() => phud.classList.remove('show'), 1600); }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => hud('전체화면을 사용할 수 없습니다 (F11 을 눌러보세요)'));
  }
  function openNotes() {
    const u = new URL(location.href); u.searchParams.set('role', 'notes'); u.searchParams.delete('start');
    window.open(u.toString(), 'gyoan-notes-' + name, 'width=1200,height=760');
  }
  function exitShow() {
    if (document.fullscreenElement) document.exitFullscreen();
    if (window.EMBEDDED_DECK) { $('pend').classList.add('show'); return; }
    if (window.opener && !window.opener.closed) window.close();
    location.href = 'index.html';
  }
  const overview = {
    open() {
      const g = $('ogrid'); g.innerHTML = '';
      deck.slides.forEach((s, i) => {
        const o = document.createElement('div'); o.className = 'o' + (i === st.idx ? ' cur' : '');
        const sl = renderSlide(s, deck, { mode: 'thumb' }); o.appendChild(sl);
        const n = document.createElement('div'); n.className = 'n'; n.textContent = i + 1; o.appendChild(n);
        o.onclick = () => { overview.close(); goto(i, 0); };
        g.appendChild(o); requestAnimationFrame(() => fitSlide(o, sl));
      });
      $('poverview').classList.add('show'); $('poverview').querySelector('.cur')?.scrollIntoView({ block: 'center' });
    },
    close() { $('poverview').classList.remove('show'); },
    isOpen() { return $('poverview').classList.contains('show'); },
  };

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
  pdraw.addEventListener('pointerup', () => { drawing = null; });
  function togglePen() { st.pen = !st.pen; pdraw.classList.toggle('on', st.pen); if (st.pen && st.laser) toggleLaser(); hud(st.pen ? '펜 모드 (D 로 해제 · E 로 지우기 · Shift 드래그 = 굵은 노랑)' : '펜 해제'); }
  function clearDrawing() { strokes[st.idx] = []; redraw(); hud('지웠습니다'); }
  function toggleLaser() { st.laser = !st.laser; plaser.classList.toggle('on', st.laser); if (st.laser && st.pen) togglePen(); hud(st.laser ? '레이저 포인터 (L 로 해제)' : '레이저 해제'); }
  window.addEventListener('pointermove', (ev) => { if (st.laser) { plaser.style.left = ev.clientX + 'px'; plaser.style.top = ev.clientY + 'px'; } wake(); });

  /* ---- 커서 / 메뉴 자동 숨김 ---- */
  function wake() {
    document.body.classList.remove('hide-cursor'); $('pmenu').classList.add('peek');
    clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!st.pen) document.body.classList.add('hide-cursor'); $('pmenu').classList.remove('peek'); }, 2500);
  }
  wake();

  /* ---- 입력 ---- */
  function anyOverlayOpen() { return overview.isOpen() || $('phelp').classList.contains('show'); }
  document.addEventListener('keydown', (ev) => {
    const k = ev.key; const ctrl = ev.ctrlKey || ev.metaKey;
    if (ctrl && k.toLowerCase() === 'e') { ev.preventDefault(); if (!window.EMBEDDED_DECK) location.href = `editor.html?deck=${encodeURIComponent(name)}&slide=${st.idx}`; return; }
    if (ctrl || ev.altKey) return;
    if ($('phelp').classList.contains('show')) { ev.preventDefault(); $('phelp').classList.remove('show'); return; }
    if (overview.isOpen()) { if (k === 'Escape' || k === 'o' || k === 'O' || k === 'g' || k === 'G' || k === '-') { ev.preventDefault(); overview.close(); } return; }
    if (st.blank && !['b', 'B', '.', 'w', 'W', 'Escape', 'F5', 'f', 'F', 'F11'].includes(k)) { st.blank = ''; pblank.className = 'pblank'; ev.preventDefault(); return; }
    // 숫자 → 슬라이드 이동
    if (/^[0-9]$/.test(k)) { st.goto += k; pgoto.innerHTML = `${st.goto}<small>Enter 로 이동</small>`; pgoto.classList.add('show'); clearTimeout(gotoTimer); gotoTimer = setTimeout(() => { st.goto = ''; pgoto.classList.remove('show'); }, 3000); ev.preventDefault(); return; }
    if (st.goto && k === 'Enter') { const n = parseInt(st.goto, 10); st.goto = ''; pgoto.classList.remove('show'); clearTimeout(gotoTimer); goto(n - 1, 0); ev.preventDefault(); return; }
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter': case 'n': case 'N': ev.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': case 'p': case 'P': ev.preventDefault(); prev(); break;
      case 'Home': ev.preventDefault(); goto(0, 0); break;
      case 'End': ev.preventDefault(); goto(N - 1, maxStep(slideOf(N - 1))); break;
      case 'F5': case 'f': case 'F': ev.preventDefault(); toggleFullscreen(); break;
      case 'b': case 'B': case '.': ev.preventDefault(); setBlank('black'); break;
      case 'w': case 'W': ev.preventDefault(); setBlank('white'); break;
      case 'o': case 'O': case 'g': case 'G': case '-': ev.preventDefault(); overview.open(); break;
      case 's': case 'S': ev.preventDefault(); openNotes(); break;
      case 'd': case 'D': ev.preventDefault(); togglePen(); break;
      case 'e': case 'E': ev.preventDefault(); clearDrawing(); break;
      case 'l': case 'L': ev.preventDefault(); toggleLaser(); break;
      case 't': case 'T': ev.preventDefault(); st.showTimer = !st.showTimer; if (st.showTimer && !st.timerStart) st.timerStart = Date.now(); updateHud(); break;
      case '?': case 'h': case 'H': case 'F1': ev.preventDefault(); $('phelp').classList.add('show'); break;
      case 'Escape':
        if (st.pen) { togglePen(); break; } if (st.laser) { toggleLaser(); break; }
        if (st.ended) { exitShow(); break; }
        if (document.fullscreenElement) { /* 브라우저가 전체화면을 해제함 */ hud('한 번 더 Esc: 발표 종료'); break; }
        exitShow(); break;
    }
  });
  // 클릭 = 다음, 우클릭 = 이전, 휠, 터치 스와이프
  pstage.addEventListener('click', (ev) => { if (st.pen || anyOverlayOpen()) return; if (st.blank) { st.blank = ''; pblank.className = 'pblank'; return; } next(); });
  pblank.addEventListener('click', () => { st.blank = ''; pblank.className = 'pblank'; });
  document.addEventListener('contextmenu', (ev) => { ev.preventDefault(); if (!st.pen && !anyOverlayOpen()) prev(); });
  let wheelLock = 0;
  document.addEventListener('wheel', (ev) => { if (anyOverlayOpen()) return; const t = Date.now(); if (t - wheelLock < 500) return; wheelLock = t; if (ev.deltaY > 0) next(); else if (ev.deltaY < 0) prev(); }, { passive: true });
  let touchX = null, touchY = null;
  document.addEventListener('touchstart', (ev) => { if (st.pen) return; touchX = ev.touches[0].clientX; touchY = ev.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', (ev) => {
    if (touchX == null || st.pen) return; const dx = ev.changedTouches[0].clientX - touchX, dy = ev.changedTouches[0].clientY - touchY; touchX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { ev.preventDefault(); dx < 0 ? next() : prev(); }
  });
  $('pmenu').addEventListener('click', (ev) => {
    const a = ev.target.dataset.a; ev.stopPropagation();
    if (a === 'notes') openNotes(); if (a === 'overview') overview.open(); if (a === 'full') toggleFullscreen(); if (a === 'help') $('phelp').classList.add('show'); if (a === 'exit') exitShow();
  });
  $('pend').addEventListener('click', (ev) => {
    const a = ev.target.dataset.a; if (!a) return; ev.stopPropagation();
    if (a === 'back') { st.ended = false; $('pend').classList.remove('show'); broadcast(); } if (a === 'first') goto(0, 0); if (a === 'exit') exitShow();
  });
  $('phelp').addEventListener('click', () => $('phelp').classList.remove('show'));
  window.addEventListener('resize', () => { if (curLayer) fitSlide(curLayer, curLayer.firstChild); redraw(); });

  show(st.idx, 0, 1);
  if (!document.fullscreenElement) hud('F 또는 F5: 전체화면  ·  ?: 단축키 도움말');

  /* ======================= 발표자 보기 ======================= */
  function notesView() {
    document.body.className = 'notes-view';
    document.body.innerHTML = `<div class="nv">
      <div class="nv-top">
        <div class="timer" id="timer">00:00</div>
        <button class="btn sm" id="tReset" title="타이머 초기화">초기화</button>
        <span class="sep"></span>
        <div id="pos" style="font-size:18px;font-weight:600"></div>
        <div class="grow"></div>
        <button class="btn" id="bPrev">◀ 이전</button><button class="btn primary" id="bNext">다음 ▶</button>
        <span class="sep"></span>
        <button class="btn sm" id="bBig" title="노트 글자 크게">가+</button>
        <div class="clock" id="clock"></div>
      </div>
      <div class="nv-cur" id="cur"></div>
      <div class="nv-right">
        <div><div class="lbl">다음</div><div class="nv-next" id="next"></div></div>
        <div class="nv-notes" id="notes"></div>
      </div></div>`;
    const $ = (id) => document.getElementById(id);
    let s = { idx: 0, step: 0, timerStart: null, ended: false };
    function render() {
      const cur = $('cur'), nx = $('next'); cur.innerHTML = ''; nx.innerHTML = '';
      const a = renderSlide(deck.slides[s.idx], deck, { mode: 'present', step: s.idx === s.idx ? s.step : Infinity }); cur.appendChild(a); fitSlide(cur, a);
      const ms = maxStep(deck.slides[s.idx]);
      let nextLabel = '';
      if (s.step < ms) { const b = renderSlide(deck.slides[s.idx], deck, { mode: 'present', step: s.step + 1 }); nx.appendChild(b); fitSlide(nx, b); nextLabel = `다음 클릭: 단계 ${s.step + 1}/${ms}`; }
      else if (s.idx < N - 1) { const b = renderSlide(deck.slides[s.idx + 1], deck, { mode: 'present', step: 0 }); nx.appendChild(b); fitSlide(nx, b); nextLabel = `다음 슬라이드 ${s.idx + 2}`; }
      else nextLabel = '마지막 슬라이드';
      nx.previousElementSibling.textContent = nextLabel;
      $('notes').innerHTML = `<div class="lbl">노트</div>` + (esc(deck.slides[s.idx].notes || '').trim() || '<span class="muted">(노트 없음)</span>');
      $('pos').textContent = `${s.idx + 1} / ${N}` + (ms ? ` · ${s.step}/${ms}` : '') + (s.ended ? ' · 종료' : '');
    }
    function tick() {
      const t = s.timerStart ? Math.floor((Date.now() - s.timerStart) / 1000) : 0;
      $('timer').textContent = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
      $('clock').textContent = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    setInterval(tick, 1000); tick();
    const send = (m) => channel && channel.postMessage(Object.assign({ type: 'nav' }, m));
    if (channel) channel.onmessage = (ev) => { const m = ev.data || {}; if (m.type === 'state') { s = { idx: m.idx, step: m.step, timerStart: m.timerStart, ended: m.ended }; render(); tick(); } };
    $('bNext').onclick = () => send({ cmd: 'next' }); $('bPrev').onclick = () => send({ cmd: 'prev' });
    $('tReset').onclick = () => send({ cmd: 'timer', value: Date.now() });
    $('bBig').onclick = () => $('notes').classList.toggle('big');
    document.addEventListener('keydown', (ev) => {
      switch (ev.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter': case 'n': ev.preventDefault(); send({ cmd: 'next' }); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': case 'p': ev.preventDefault(); send({ cmd: 'prev' }); break;
        case 'Home': send({ cmd: 'goto', idx: 0 }); break; case 'End': send({ cmd: 'goto', idx: N - 1 }); break;
        case 'Escape': window.close(); break;
      }
    });
    window.addEventListener('resize', render);
    render(); if (channel) channel.postMessage({ type: 'hello' });
    if (!channel) $('notes').innerHTML = '<div class="lbl">이 브라우저는 창 간 동기화를 지원하지 않습니다.</div>';
  }

  /* ======================= 인쇄(PDF) 모드 ======================= */
  function renderPrint() {
    document.body.className = 'print-mode';
    document.body.innerHTML = `<div class="print-bar"><b>${esc(deck.title)}</b><span class="muted">슬라이드 ${N}장 · 인쇄 대화상자에서 "PDF로 저장"을 선택하세요 (여백 없음, 가로 방향)</span><span style="flex:1"></span><button class="btn primary" onclick="window.print()">🖨 인쇄 / PDF 저장</button><a class="btn" href="index.html">목록</a></div>`;
    for (const s of deck.slides) {
      const page = document.createElement('div'); page.className = 'print-page';
      page.appendChild(renderSlide(s, deck, { mode: 'present', step: Infinity }));
      document.body.appendChild(page);
    }
  }
})();
