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
    } catch (e) { document.body.innerHTML = `<div style="color:#fff;padding:40px;font-family:sans-serif">교안을 불러올 수 없습니다: ${esc(e.message)}<br><br><a href="gyoan.html" style="color:#8cf">← 목록으로</a></div>`; return; }
  }
  if (!deck.slides || !deck.slides.length) deck.slides = [newSlide('blank')];
  document.title = deck.title + (role === 'notes' ? ' · 발표자 보기' : ' · 발표');
  const N = deck.slides.length;
  const channel = ('BroadcastChannel' in window) ? new BroadcastChannel('gyoan:' + name) : null;

  if (qs('print')) return renderPrint();
  if (role === 'notes') return notesView();
  window.GYOAN_LIVE = true; // 동영상·웹 요소를 실제로 재생

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
      <h3>발표 단축키 <span class="muted" style="font-weight:400;font-size:13px">PowerPoint 슬라이드 쇼와 같음 · 리모컨의 ▶/◀ = PageDown/PageUp</span></h3>
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
        <div><span>타이머 표시</span><span><kbd>T</kbd></span></div>
        <div><span>이 도움말</span><span><kbd>F1</kbd> <kbd>?</kbd> <kbd>H</kbd></span></div>
        <div><span>편집기로</span><span><kbd>Ctrl+E</kbd></span></div>
        <div><span>발표 종료</span><span><kbd>Esc</kbd> (전체화면이면 한 번 더)</span></div>
      </div>
      <div style="margin-top:12px;font-size:13px;line-height:1.6"><b>휴대폰 · 태블릿</b> — 화면을 누르면 다음 슬라이드, 옆으로 밀면 앞·뒤로 넘어갑니다. 누를 때마다 오른쪽 위에 메뉴(목록 · 전체화면 · ✕ 종료)가 잠깐 나타납니다.</div>
      <div class="muted" style="margin-top:14px;font-size:13px">아무 키나 누르거나 화면을 눌러 닫기 · 전체 설명서: <a href="shortcuts.html" target="_blank" onclick="event.stopPropagation()">shortcuts.html</a></div>
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

  const visible = (i) => !deck.slides[i].hidden;
  /* 숨긴 슬라이드는 건너뜀 (번호로 직접 이동하면 볼 수 있음) */
  function nextVisible(i, d) { let j = i + d; while (j >= 0 && j < N && !visible(j)) j += d; return j; }
  let startIdx = clamp(parseInt(qs('start') || '0', 10) || 0, 0, N - 1);
  if (startIdx === 0 && !visible(0)) { const j = nextVisible(0, 1); if (j < N) startIdx = j; }
  const st = { idx: startIdx, step: 0, blank: '', pen: false, laser: false, goto: '', timerStart: null, showTimer: false, ended: false };
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
    const old = curLayer, fromIdx = st.idx;
    const layer = makeLayer(i, step);
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
      if (old) setTimeout(() => old.remove(), 700);
    }
    curNodes = Array.from(layer.querySelectorAll('.slide > .el')).map(n => ({ n, e: slideOf(i).elements.find(e => e.id === n.dataset.id) }));
    st.idx = i; st.step = step;
    updateHud(); redraw(); broadcast();
    preloadAround(i);
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
    const j = nextVisible(st.idx, 1);
    if (j < N) show(j, 0, 1);
    else endShow();
  }
  function prev() {
    if (st.ended) { st.ended = false; $('pend').classList.remove('show'); return; }
    if (st.step > 0) { st.step--; applyStep(); return; }
    const j = nextVisible(st.idx, -1);
    if (j >= 0) show(j, maxStep(slideOf(j)), -1);
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
  function zoomStage(d) {
    st.zoom = clamp((st.zoom || 1) + d * 0.5, 1, 3);
    pstage.style.transform = st.zoom > 1 ? `scale(${st.zoom})` : ''; pstage.style.transformOrigin = 'center center';
    hud(st.zoom > 1 ? `확대 ${st.zoom}× (− 로 축소 · 마우스로 보고 싶은 곳을 가리키세요)` : '원래 크기');
  }
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
      $('poverview').classList.add('show'); $('poverview').querySelector('.cur')?.scrollIntoView({ block: 'center' });
    },
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
  pdraw.addEventListener('pointerup', () => { drawing = null; });
  function togglePen() { st.pen = !st.pen; pdraw.classList.toggle('on', st.pen); if (st.pen && st.laser) toggleLaser(); hud(st.pen ? '펜 모드 (D 로 해제 · E 로 지우기 · Shift 드래그 = 굵은 노랑)' : '펜 해제'); }
  function clearDrawing() { strokes[st.idx] = []; redraw(); hud('지웠습니다'); }
  function toggleLaser() { st.laser = !st.laser; plaser.classList.toggle('on', st.laser); if (st.laser && st.pen) togglePen(); hud(st.laser ? '레이저 포인터 (L 로 해제)' : '레이저 해제'); }
  window.addEventListener('pointermove', (ev) => { if (st.zoom > 1) { const x = ev.clientX / innerWidth * 100, y = ev.clientY / innerHeight * 100; pstage.style.transformOrigin = `${x}% ${y}%`; } if (st.laser) { plaser.style.left = ev.clientX + 'px'; plaser.style.top = ev.clientY + 'px'; } wake(); });

  /* ---- 커서 / 메뉴 자동 숨김 ---- */
  function wake() {
    document.body.classList.remove('hide-cursor'); $('pmenu').classList.add('peek');
    clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!st.pen) document.body.classList.add('hide-cursor'); $('pmenu').classList.remove('peek'); }, 2500);
  }
  wake();
  window.addEventListener('pointerdown', wake); // 휴대폰: 마우스 움직임이 없으므로 화면을 누를 때도 메뉴를 다시 보여 줌

  /* ---- 입력 ---- */
  function anyOverlayOpen() { return overview.isOpen() || $('phelp').classList.contains('show'); }
  document.addEventListener('keydown', (ev) => {
    const k = ev.key; const ctrl = ev.ctrlKey || ev.metaKey;
    if (ctrl && k.toLowerCase() === 'e') { ev.preventDefault(); if (!window.EMBEDDED_DECK) location.href = `editor.html?deck=${encodeURIComponent(name)}&slide=${st.idx}`; return; }
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
    if ($('phelp').classList.contains('show')) { ev.preventDefault(); $('phelp').classList.remove('show'); return; }
    if (overview.isOpen()) { if (k === 'Escape' || k === 'o' || k === 'O' || k === 'g' || k === 'G' || k === '-') { ev.preventDefault(); overview.close(); } return; }
    if (st.blank && !['b', 'B', '.', 'w', 'W', ',', 'Escape', 'F5', 'f', 'F', 'F11'].includes(k)) { st.blank = ''; pblank.className = 'pblank'; ev.preventDefault(); return; }
    // 숫자 → 슬라이드 이동
    if (/^[0-9]$/.test(k)) { st.goto += k; pgoto.innerHTML = `${st.goto}<small>Enter 로 이동</small>`; pgoto.classList.add('show'); clearTimeout(gotoTimer); gotoTimer = setTimeout(() => { st.goto = ''; pgoto.classList.remove('show'); }, 3000); ev.preventDefault(); return; }
    if (st.goto && k === 'Enter') { const n = parseInt(st.goto, 10); st.goto = ''; pgoto.classList.remove('show'); clearTimeout(gotoTimer); goto(n - 1, 0); ev.preventDefault(); return; }
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter': case 'n': case 'N': ev.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': case 'p': case 'P': ev.preventDefault(); prev(); break;
      case 'Home': ev.preventDefault(); { const j = visible(0) ? 0 : nextVisible(0, 1); goto(j < N ? j : 0, 0); } break;
      case 'End': ev.preventDefault(); { const j = visible(N - 1) ? N - 1 : nextVisible(N - 1, -1); const t = j >= 0 ? j : N - 1; goto(t, maxStep(slideOf(t))); } break;
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
  pstage.addEventListener('click', (ev) => {
    if (st.pen || anyOverlayOpen()) return;
    if (st.blank) { st.blank = ''; pblank.className = 'pblank'; return; }
    if (ev.target.closest('video, iframe')) return;                 // 동영상 조작은 넘기지 않음
    const ln = ev.target.closest('.el[data-link]'); if (ln) { followLink(ln.dataset.link); return; }
    next();
  });
  /* 요소에 건 링크: 슬라이드로 이동 / 웹 주소 열기 */
  function followLink(l) {
    if (l.startsWith('slide:')) { const i = deck.slides.findIndex(s => s.id === l.slice(6)); if (i >= 0) goto(i, 0); return; }
    if (l === 'next') return next(); if (l === 'prev') return prev();
    if (l === 'first') return goto(0, 0); if (l === 'last') return goto(N - 1, 0);
    const u = l.replace(/^url:/, ''); if (/^https?:\/\//i.test(u)) window.open(u, '_blank', 'noopener');
  }
  /* 동영상(YouTube 등)을 누른 뒤에도 리모컨·키보드가 계속 발표기를 조작하도록 포커스를 되돌림 */
  window.addEventListener('blur', () => setTimeout(() => { const a = document.activeElement; if (a && a.tagName === 'IFRAME') { a.blur(); window.focus(); } }, 0));
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
    const b = ev.target.closest('[data-a]'); ev.stopPropagation(); if (!b) return; const a = b.dataset.a;
    if (a === 'notes') openNotes(); if (a === 'overview') overview.toggle(); if (a === 'full') toggleFullscreen(); if (a === 'help') $('phelp').classList.add('show'); if (a === 'exit') exitShow();
  });
  $('pend').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a; ev.stopPropagation();
    if (a === 'back') { st.ended = false; $('pend').classList.remove('show'); broadcast(); } if (a === 'first') goto(0, 0); if (a === 'exit') exitShow();
  });
  $('phelp').addEventListener('click', () => $('phelp').classList.remove('show'));
  window.addEventListener('resize', () => { if (curLayer) fitSlide(curLayer, curLayer.firstChild); redraw(); });

  show(st.idx, 0, 1);
  if (!document.fullscreenElement) hud(matchMedia('(pointer: coarse)').matches ? '좌우로 밀어서 넘기기' : 'F 또는 F5: 전체화면  ·  ?: 단축키 도움말');

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
      else { let j = s.idx + 1; while (j < N && deck.slides[j].hidden) j++; if (j < N) { const b = renderSlide(deck.slides[j], deck, { mode: 'present', step: 0 }); nx.appendChild(b); fitSlide(nx, b); nextLabel = `다음 슬라이드 ${j + 1}`; } else nextLabel = '마지막 슬라이드'; }
      nx.previousElementSibling.textContent = nextLabel;
      $('notes').innerHTML = `<div class="lbl">노트</div>` + (esc(deck.slides[s.idx].notes || '').trim() || '<span class="muted">(노트 없음)</span>');
      $('pos').textContent = `${s.idx + 1} / ${N}` + (ms ? ` · ${s.step}/${ms}` : '') + (deck.slides[s.idx].hidden ? ' · 숨긴 슬라이드' : '') + (s.ended ? ' · 종료' : '');
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
    $('bBig').onclick = () => $('bBig').classList.toggle('active', $('notes').classList.toggle('big'));
    document.addEventListener('keydown', (ev) => {
      switch (ev.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter': case 'n': ev.preventDefault(); send({ cmd: 'next' }); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': case 'p': ev.preventDefault(); send({ cmd: 'prev' }); break;
        case 'Home': send({ cmd: 'goto', idx: 0 }); break; case 'End': send({ cmd: 'goto', idx: N - 1 }); break;
        case 'Escape': window.close(); break;
        case 'F1': case '?': ev.preventDefault(); window.open('shortcuts.html', '_blank'); break;
      }
    });
    window.addEventListener('resize', render);
    render(); if (channel) channel.postMessage({ type: 'hello' });
    if (!channel) $('notes').innerHTML = '<div class="lbl">이 브라우저는 창 간 동기화를 지원하지 않습니다.</div>';
  }

  /* ======================= 인쇄(PDF) 모드 ======================= */
  function renderPrint() {
    document.body.className = 'print-mode';
    document.body.innerHTML = `<div class="print-bar"><b>${esc(deck.title)}</b><span class="muted">슬라이드 ${N}장 · 인쇄 대화상자에서 "PDF로 저장"을 선택하세요 (여백 없음, 가로 방향)</span><span style="flex:1"></span><button class="btn primary" onclick="window.print()">🖨 인쇄 / PDF 저장</button><a class="btn" href="gyoan.html">목록</a></div>`;
    for (const s of deck.slides) {
      if (s.hidden) continue;
      const page = document.createElement('div'); page.className = 'print-page';
      page.appendChild(renderSlide(s, deck, { mode: 'present', step: Infinity }));
      document.body.appendChild(page);
    }
  }
})();
