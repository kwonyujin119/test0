/* 교안 편집기 */
'use strict';
(async function () {
  const $ = (id) => document.getElementById(id);
  const S = { name: '', deck: null, cur: 0, sel: [], editing: null, k: 1, zoomMode: 'fit', history: [], hi: -1, dirty: false, clip: null, slideClip: null };
  const stage = $('stage'), overlay = $('overlay'), main = $('main'), props = $('props'), thumbsEl = $('thumbs');
  let slideNode = null, textToolbar = null, saveTimer = null;

  /* ---------- 초기화 ---------- */
  S.name = qs('deck');
  if (!S.name) { location.href = 'gyoan.html'; return; }
  await API.init();
  try { S.deck = await API.load(S.name); }
  catch (e) { alert(e.message); location.href = 'gyoan.html'; return; }
  migrate(S.deck);
  S.cur = clamp(parseInt(qs('slide') || '0', 10) || 0, 0, S.deck.slides.length - 1);
  document.title = S.deck.title + ' · 편집';

  function migrate(d) {
    if (!d.slides || !d.slides.length) d.slides = [newSlide('title', { title: d.title })];
    if (!d.theme) d.theme = 'clean';
    for (const s of d.slides) {
      if (!s.id) s.id = uid(); if (!s.elements) s.elements = []; if (s.notes == null) s.notes = '';
      for (const e of s.elements) { if (!e.id) e.id = uid(); if (e.type === 'text' && !e.style) e.style = {}; if (e.step == null) e.step = 0; }
    }
  }

  const curSlide = () => S.deck.slides[S.cur];
  const theme = () => deckTheme(S.deck);
  const TEXTY = ['text', 'shape', 'table', 'math', 'chart'];
  const elById = (id) => curSlide().elements.find(e => e.id === id);
  const selEls = () => S.sel.map(elById).filter(Boolean);
  const nodeOf = (id) => slideNode && slideNode.querySelector(`.el[data-id="${CSS.escape(id)}"]`);

  /* ---------- 히스토리 / 저장 ---------- */
  function pushHistory() {
    S.history = S.history.slice(0, S.hi + 1);
    S.history.push({ deck: JSON.stringify(S.deck), cur: S.cur });
    if (S.history.length > 120) S.history.shift();
    S.hi = S.history.length - 1;
    updateUndoButtons();
  }
  function restore(h) {
    S.deck = JSON.parse(h.deck); S.cur = clamp(h.cur, 0, S.deck.slides.length - 1);
    S.sel = S.sel.filter(id => elById(id)); S.editing = null; hideTextToolbar();
    renderAll(); markDirty();
  }
  function undo() { if (S.editing) return; if (S.hi > 0) { S.hi--; restore(S.history[S.hi]); } }
  function redo() { if (S.editing) return; if (S.hi < S.history.length - 1) { S.hi++; restore(S.history[S.hi]); } }
  function updateUndoButtons() { $('btnUndo').disabled = S.hi <= 0; $('btnRedo').disabled = S.hi >= S.history.length - 1; }
  function markDirty() {
    S.dirty = true; $('top').classList.add('is-dirty');
    // 임시본은 손을 멈춘 뒤 한가할 때 저장 (끌기·입력 중에 멈칫하지 않게)
    clearTimeout(saveTimer); saveTimer = setTimeout(() => (window.requestIdleCallback || (f => f()))(() => Draft.put(S.name, S.deck), { timeout: 3000 }), 800);
  }
  /* 변경 확정: 히스토리 + 더티 + 썸네일 */
  function commit(opts) {
    pushHistory(); markDirty();
    if (opts && opts.all) renderThumbs(); else updateThumb(S.cur);
  }
  async function save() {
    if (S.editing) endEdit();
    try {
      await API.save(S.name, S.deck); S.dirty = false; $('top').classList.remove('is-dirty'); Draft.clear(S.name);
      toast('저장했습니다');
    } catch (e) {
      if (e.noToken && confirm(e.message + '\n\n허브로 이동할까요? (임시본은 이 브라우저에 남아 있습니다)')) { Draft.put(S.name, S.deck); S.dirty = false; location.href = 'gyoan.html'; return; }
      alert('저장 실패: ' + e.message);
    }
  }
  window.addEventListener('beforeunload', (ev) => { if (S.dirty || API.pending.size) { ev.preventDefault(); ev.returnValue = ''; } });
  API.onPending = (n) => { const c = $('upStatus'); c.textContent = n ? `이미지 올리는 중 ${n}` : ''; c.classList.toggle('show', n > 0); };

  /* ---------- 렌더 ---------- */
  function renderAll() { renderThumbs(); renderStage(); renderProps(); updateTop(); }
  function updateTop() {
    $('deckTitle').value = S.deck.title;
    $('theme').value = S.deck.theme;
    $('slideCount').textContent = `${S.cur + 1} / ${S.deck.slides.length}`;
    $('footSlide').textContent = `슬라이드 ${S.cur + 1} / ${S.deck.slides.length}  ·  ${S.deck.slides[S.cur].elements.length}개 요소`;
    updateUndoButtons();
  }
  function renderStage() {
    stage.querySelectorAll('.slide').forEach(n => n.remove());
    slideNode = renderSlide(curSlide(), S.deck, { mode: 'edit' });
    stage.insertBefore(slideNode, overlay);
    layoutStage(); markSelection();
    $('footSlide').textContent = `슬라이드 ${S.cur + 1} / ${S.deck.slides.length}  ·  ${curSlide().elements.length}개 요소`;
  }
  function layoutStage() {
    if (!slideNode) return;
    if (S.zoomMode === 'fit') { S.k = fitSlide(stage, slideNode, 36); }
    else {
      const k = parseFloat(S.zoomMode); S.k = k;
      slideNode.style.transform = `scale(${k})`; slideNode.style.transformOrigin = '0 0'; slideNode.style.position = 'absolute';
      slideNode.style.left = Math.max(20, (stage.clientWidth - SLIDE_W * k) / 2) + 'px';
      slideNode.style.top = Math.max(20, (stage.clientHeight - SLIDE_H * k) / 2) + 'px';
      stage.style.overflow = 'auto';
    }
    if (S.zoomMode === 'fit') stage.style.overflow = 'hidden';
    overlay.style.left = slideNode.style.left; overlay.style.top = slideNode.style.top;
    overlay.style.width = (SLIDE_W * S.k) + 'px'; overlay.style.height = (SLIDE_H * S.k) + 'px';
    renderOverlay(); positionTextToolbar(); applyGrid();
  }
  function markSelection() {
    if (!slideNode) return;
    slideNode.querySelectorAll('.el').forEach(n => {
      const e = elById(n.dataset.id); if (!e) return;
      n.classList.toggle('selected', S.sel.includes(n.dataset.id));
      n.classList.toggle('locked', !!e.locked);
      n.classList.toggle('grouped', !!e.group);
      const ms = elementMaxStep(e);
      if (ms > 0) { n.classList.add('step-badge'); n.dataset.step = (e.listSteps && ms > (e.step || 0)) ? `${listStepBase(e)}–${ms}` : String(e.step || 0); }
      else { n.classList.remove('step-badge'); delete n.dataset.step; }
    });
    $('footSel').textContent = S.sel.length ? `${S.sel.length}개 선택` : '';
    const has = S.sel.length > 0;
    document.querySelectorAll('#alignGroup .btn, #btnOrder, #btnGroup, #btnDup, #btnDel').forEach(b => b.disabled = !has);
    renderLayers();
  }
  function rerenderEl(id) {
    const e = elById(id); const old = nodeOf(id); if (!e || !old) return;
    const n = renderElement(e, theme(), 'edit');
    old.replaceWith(n); markSelection();
  }
  function renderOverlay() {
    overlay.innerHTML = '';
    if (S.sel.length > 1) {
      const els = selEls().filter(e => !e.locked); if (els.length < 2) return;
      const b = bboxOf(els), k = S.k;
      const box = document.createElement('div'); box.className = 'selbox';
      box.style.left = b.x * k + 'px'; box.style.top = b.y * k + 'px'; box.style.width = b.w * k + 'px'; box.style.height = b.h * k + 'px'; overlay.appendChild(box);
      for (const [h, fx, fy] of [['mnw', 0, 0], ['mne', 1, 0], ['msw', 0, 1], ['mse', 1, 1]]) {
        const d = document.createElement('div'); d.className = 'handle ' + h.slice(1); d.dataset.h = h; d.title = '함께 크기 조절';
        d.style.left = (b.x + b.w * fx) * k + 'px'; d.style.top = (b.y + b.h * fy) * k + 'px'; overlay.appendChild(d);
      }
      return;
    }
    if (S.sel.length !== 1) return;
    const e = elById(S.sel[0]); if (!e || e.locked) return;
    const k = S.k, cx = (e.x + e.w / 2) * k, cy = (e.y + e.h / 2) * k, hw = e.w * k / 2, hh = e.h * k / 2;
    const a = (e.rotate || 0) * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
    const pts = { nw: [-hw, -hh], n: [0, -hh], ne: [hw, -hh], e: [hw, 0], se: [hw, hh], s: [0, hh], sw: [-hw, hh], w: [-hw, 0], rot: [0, -hh - 28] };
    const small = e.w * k < 40 || e.h * k < 40;
    for (const [h, [dx, dy]] of Object.entries(pts)) {
      if (small && h.length === 1 && h !== 'rot') continue;
      const d = document.createElement('div'); d.className = 'handle ' + h; d.dataset.h = h;
      d.style.left = (cx + dx * cos - dy * sin) + 'px'; d.style.top = (cy + dx * sin + dy * cos) + 'px';
      d.title = h === 'rot' ? '회전 (Shift: 15° 단위)' : '';
      overlay.appendChild(d);
    }
  }

  /* 썸네일 */
  let thumbFill = 0;
  function renderThumbs() {
    thumbsEl.innerHTML = '';
    S.deck.slides.forEach((s, i) => thumbsEl.appendChild(makeThumb(s, i)));
    $('slideCount').textContent = `${S.cur + 1} / ${S.deck.slides.length}`;
    // 보이지 않는 썸네일도 한가할 때 하나씩 마저 그림
    clearTimeout(thumbFill);
    const idle = window.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 10 }), 30));
    const fill = dl => { for (const t of thumbsEl.children) { if (t._draw) { t._draw(); if (dl.timeRemaining() < 4) { thumbFill = setTimeout(() => idle(fill, { timeout: 1000 }), 50); return; } } } };
    thumbFill = setTimeout(() => idle(fill, { timeout: 1000 }), 300);
  }
  /* 썸네일은 목록에서 보일 때만 그림 (슬라이드가 많아도 열기·테마 바꾸기가 빠름) */
  const thumbIO = 'IntersectionObserver' in window ? new IntersectionObserver(ents => {
    for (const en of ents) if (en.isIntersecting) { const t = en.target; thumbIO.unobserve(t); if (t._draw) t._draw(); }
  }, { root: thumbsEl, rootMargin: '600px 0px' }) : null;
  function makeThumb(s, i) {
    const t = document.createElement('div'); t.className = 'thumb' + (i === S.cur ? ' active' : '') + (s.hidden ? ' hid' : ''); t.dataset.i = i; t.draggable = true;
    t.style.aspectRatio = SLIDE_W + ' / ' + SLIDE_H;
    t._draw = () => { t._draw = null; const sl = renderSlide(s, S.deck, { mode: 'thumb' }); t.insertBefore(sl, t.firstChild); requestAnimationFrame(() => fitSlide(t, sl)); };
    if (thumbIO && i !== S.cur) thumbIO.observe(t); else t._draw();
    const n = document.createElement('div'); n.className = 'n'; n.textContent = i + 1; t.appendChild(n);
    const ms = maxStep(s); if (ms > 0) { const b = document.createElement('div'); b.className = 'steps'; b.textContent = `▸${ms}`; t.appendChild(b); }
    if (s.hidden) { const b = document.createElement('div'); b.className = 'hidb'; b.textContent = '숨김'; t.appendChild(b); }
    const trn = s.transition === 'morph' || (!s.transition && S.deck.transition === 'morph'); if (trn && i > 0) { const b = document.createElement('div'); b.className = 'trb'; b.textContent = '✨'; b.title = '모핑 전환'; t.appendChild(b); }
    t.onclick = () => gotoSlide(i);
    t.oncontextmenu = (ev) => { ev.preventDefault(); gotoSlide(i); showMenu(ev.clientX, ev.clientY, slideMenuItems()); };
    t.ondragstart = (ev) => { ev.dataTransfer.setData('text/slide', String(i)); ev.dataTransfer.effectAllowed = 'move'; };
    t.ondragover = (ev) => { if (ev.dataTransfer.types.includes('text/slide')) { ev.preventDefault(); t.classList.add('dragover'); } };
    t.ondragleave = () => t.classList.remove('dragover');
    t.ondrop = (ev) => {
      ev.preventDefault(); t.classList.remove('dragover');
      const from = parseInt(ev.dataTransfer.getData('text/slide'), 10); if (isNaN(from) || from === i) return;
      const [mv] = S.deck.slides.splice(from, 1); S.deck.slides.splice(i, 0, mv); S.cur = i;
      commit({ all: true }); renderStage(); renderProps(); updateTop();
    };
    return t;
  }
  function updateThumb(i) {
    const old = thumbsEl.children[i]; if (!old) { renderThumbs(); return; }
    old.replaceWith(makeThumb(S.deck.slides[i], i));
  }
  function gotoSlide(i) {
    if (S.editing) endEdit();
    S.cur = clamp(i, 0, S.deck.slides.length - 1); S.sel = [];
    thumbsEl.querySelectorAll('.thumb').forEach((t, j) => t.classList.toggle('active', j === S.cur));
    { const ct = thumbsEl.children[S.cur]; if (ct && ct._draw) ct._draw(); }
    renderStage(); renderProps(); updateTop();
    const t = thumbsEl.children[S.cur]; if (t) t.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- 슬라이드 조작 ---------- */
  function addSlide(layout, after) {
    if (S.editing) endEdit();
    const s = newSlide(layout);
    const at = (after == null ? S.cur : after) + 1;
    S.deck.slides.splice(at, 0, s); S.cur = at; S.sel = [];
    commit({ all: true }); renderStage(); renderProps(); updateTop();
    thumbsEl.children[S.cur]?.scrollIntoView({ block: 'nearest' });
  }
  function duplicateSlide() {
    const s = clone(curSlide()); s.id = uid(); s.elements.forEach(e => { e.mk = e.mk || e.id; e.id = uid(); }); // mk: 모핑 때 같은 요소로 인식
    S.deck.slides.splice(S.cur + 1, 0, s); S.cur++; S.sel = [];
    commit({ all: true }); renderStage(); renderProps(); updateTop();
  }
  function deleteSlide() {
    if (S.deck.slides.length <= 1) { toast('마지막 슬라이드는 삭제할 수 없습니다'); return; }
    S.deck.slides.splice(S.cur, 1); S.cur = clamp(S.cur, 0, S.deck.slides.length - 1); S.sel = [];
    commit({ all: true }); renderStage(); renderProps(); updateTop();
  }
  function moveSlide(d) {
    const j = S.cur + d; if (j < 0 || j >= S.deck.slides.length) return;
    const [s] = S.deck.slides.splice(S.cur, 1); S.deck.slides.splice(j, 0, s); S.cur = j;
    commit({ all: true }); renderStage(); updateTop();
  }
  function applyLayout(layout) {
    const s = curSlide();
    if (s.elements.length && !confirm('현재 슬라이드의 요소를 레이아웃으로 바꿉니다. 계속할까요?')) return;
    s.elements = layoutElements(layout); S.sel = [];
    commit(); renderStage(); renderProps();
  }
  function slideMenuItems() {
    return [
      { label: '새 슬라이드 추가', kbd: 'Ctrl+Enter', fn: () => showLayoutMenu() },
      { label: '슬라이드 복제', kbd: 'Ctrl+Shift+D', fn: duplicateSlide },
      { label: '슬라이드 복사', kbd: 'Ctrl+C', fn: () => { S.sel = []; markSelection(); copyCmd(); } },
      { label: '붙여넣기', kbd: 'Ctrl+V', fn: () => { if (S.clip) pasteData(S.clip); else toast('먼저 복사하세요 (Ctrl+C)'); } },
      { label: curSlide().hidden ? '숨기기 해제' : '슬라이드 숨기기', fn: toggleHideSlide },
      { label: '레이아웃 적용…', fn: () => showLayoutMenu(null, applyLayout) },
      { sep: true },
      { label: '위로 이동', fn: () => moveSlide(-1) },
      { label: '아래로 이동', fn: () => moveSlide(1) },
      { sep: true },
      { label: '슬라이드 삭제', danger: true, fn: deleteSlide },
    ];
  }

  /* ---------- 요소 조작 ---------- */
  function addElement(e, select) {
    curSlide().elements.push(e);
    commit(); renderStage(); if (select !== false) { S.sel = [e.id]; markSelection(); renderOverlay(); } renderProps();
    return e;
  }
  function addText(role) {
    const presets = {
      title: [M, 300, SLIDE_W - M * 2, 200, '제목'], heading: [M, 90, SLIDE_W - M * 2, 130, '소제목'],
      body: [M, 260, SLIDE_W - M * 2, 600, '<ul><li>내용</li></ul>'], caption: [M, 960, SLIDE_W - M * 2, 60, '캡션'],
      code: [M, 260, SLIDE_W - M * 2, 600, '코드'], quote: [200, 350, SLIDE_W - 400, 300, '“인용문”'],
      number: [M, 300, SLIDE_W - M * 2, 260, '42%'], text: [600, 440, 720, 200, '텍스트'],
    };
    const p = presets[role] || presets.text;
    const e = textEl(role, p[0], p[1], p[2], p[3], p[4]);
    if (role === 'text') e.style = { align: 'center', valign: 'middle' };
    addElement(e);
    setTimeout(() => startEdit(e.id, null, true), 30);
  }
  function addShape(shape) {
    const e = shapeEl(shape, 760, 390, 400, 300);
    if (shape === 'line' || shape === 'arrow') { e.h = 40; e.w = 600; e.strokeWidth = 10; e.fill = '$accent'; }
    addElement(e);
  }
  async function insertImageFile(file, at) {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const prep = await prepareImage(file);          // 크기·용량 최적화 (브라우저 안에서)
      const src = await API.stage(prep.blob, prep.name); // 바로 넣고, 업로드는 뒤에서
      // 비어 있는 이미지 틀이 선택돼 있으면(레이아웃의 자리) 그 틀에 채움
      const tgt = at && at.into ? elById(at.into) : (!at && S.sel.length === 1 ? elById(S.sel[0]) : null);
      if (tgt && tgt.type === 'image' && !tgt.src) { tgt.src = src; commit(); rerenderEl(tgt.id); renderOverlay(); renderProps(); return; }
      const dim = { w: prep.w, h: prep.h };
      const maxW = 1200, maxH = 760; let w = dim.w, h = dim.h;
      const r = Math.min(1, maxW / w, maxH / h); w = Math.round(w * r); h = Math.round(h * r);
      const x = at ? Math.round(at.x - w / 2) : Math.round((SLIDE_W - w) / 2), y = at ? Math.round(at.y - h / 2) : Math.round((SLIDE_H - h) / 2);
      addElement(imageEl(clamp(x, 0, SLIDE_W - w), clamp(y, 0, SLIDE_H - h), w, h, src));
    } catch (e) { alert('이미지 삽입 실패: ' + e.message); }
  }
  function imageSize(src) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth || 800, h: im.naturalHeight || 600 }); im.onerror = () => rej(new Error('이미지를 열 수 없습니다')); im.src = API.resolveSrc(src); });
  }
  async function replaceImage(id, file) {
    const e = elById(id); if (!e) return;
    try {
      const prep = await prepareImage(file); const src = await API.stage(prep.blob, prep.name); const dim = { w: prep.w, h: prep.h };
      const wasEmpty = !e.src; e.src = src;
      // 빈 틀이었으면 틀 크기 유지, 아니면 비율 유지하여 현재 너비에 맞춤
      if (!wasEmpty) e.h = Math.round(e.w * dim.h / dim.w);
      commit(); rerenderEl(id); renderOverlay(); renderProps();
    } catch (err) { alert('이미지 교체 실패: ' + err.message); }
  }
  function deleteSelected() {
    if (!S.sel.length) return;
    curSlide().elements = curSlide().elements.filter(e => !S.sel.includes(e.id)); S.sel = [];
    commit(); renderStage(); renderProps();
  }
  function duplicateSelected() {
    const els = selEls(); if (!els.length) return;
    const copies = freshCopies(els, 30, 30, false);
    curSlide().elements.push(...copies); S.sel = copies.map(c => c.id);
    commit(); renderStage(); renderProps();
  }
  function copySelected() { if (S.sel.length) copyCmd(); }
  function zOrder(cmd) {
    const arr = curSlide().elements; const ids = S.sel; if (!ids.length) return;
    const selected = arr.filter(e => ids.includes(e.id)), rest = arr.filter(e => !ids.includes(e.id));
    if (cmd === 'front') curSlide().elements = rest.concat(selected);
    else if (cmd === 'back') curSlide().elements = selected.concat(rest);
    else {
      const a = arr.slice();
      if (cmd === 'up') { for (let i = a.length - 2; i >= 0; i--) if (ids.includes(a[i].id) && !ids.includes(a[i + 1].id)) [a[i], a[i + 1]] = [a[i + 1], a[i]]; }
      else { for (let i = 1; i < a.length; i++) if (ids.includes(a[i].id) && !ids.includes(a[i - 1].id)) [a[i], a[i - 1]] = [a[i - 1], a[i]]; }
      curSlide().elements = a;
    }
    commit(); renderStage();
  }
  function alignSel(how) {
    const els = selEls(); if (!els.length) return;
    let L = 0, T = 0, R = SLIDE_W, B = SLIDE_H;
    if (els.length > 1) { L = Math.min(...els.map(e => e.x)); T = Math.min(...els.map(e => e.y)); R = Math.max(...els.map(e => e.x + e.w)); B = Math.max(...els.map(e => e.y + e.h)); }
    for (const e of els) {
      if (how === 'left') e.x = L; if (how === 'right') e.x = R - e.w; if (how === 'hcenter') e.x = Math.round((L + R) / 2 - e.w / 2);
      if (how === 'top') e.y = T; if (how === 'bottom') e.y = B - e.h; if (how === 'vcenter') e.y = Math.round((T + B) / 2 - e.h / 2);
    }
    commit(); renderStage(); renderProps();
  }
  function distribute(axis) {
    const els = selEls(); if (els.length < 3) { toast('3개 이상 선택하세요'); return; }
    const k = axis === 'h' ? 'x' : 'y', sz = axis === 'h' ? 'w' : 'h';
    els.sort((a, b) => a[k] - b[k]);
    const total = els.reduce((s, e) => s + e[sz], 0); const span = (els[els.length - 1][k] + els[els.length - 1][sz]) - els[0][k];
    const gap = (span - total) / (els.length - 1); let pos = els[0][k];
    for (const e of els) { e[k] = Math.round(pos); pos += e[sz] + gap; }
    commit(); renderStage(); renderProps();
  }
  function nudge(dx, dy) {
    const els = selEls().filter(e => !e.locked); if (!els.length) return;
    for (const e of els) { e.x += dx; e.y += dy; const n = nodeOf(e.id); if (n) { n.style.left = e.x + 'px'; n.style.top = e.y + 'px'; } }
    renderOverlay(); commitDebounced(); renderProps();
  }
  let nudgeTimer = null;
  function commitDebounced() { clearTimeout(nudgeTimer); nudgeTimer = setTimeout(() => commit(), 400); }

  /* ---------- 포인터 상호작용 ---------- */
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('dblclick', (ev) => {
    const node = ev.target.closest('.el'); if (!node) return;
    const e = elById(node.dataset.id); if (!e) return;
    if (e.type === 'image') { S.sel = [e.id]; $('fileReplace').dataset.id = e.id; $('fileReplace').click(); }
    else if (e.type === 'math') openMathDialog(e);
    else if (e.type === 'embed') openEmbedDialog(e);
    else if (e.type === 'chart') { S.sel = [e.id]; markSelection(); renderOverlay(); renderProps(); const ta = props.querySelector('textarea[data-k="data"]'); if (ta) { ta.focus(); ta.scrollIntoView({ block: 'center' }); } }
    else startEdit(e.id, ev);
  });
  stage.addEventListener('pointerover', (ev) => { const n = ev.target.closest('.el'); slideNode?.querySelectorAll('.el.hover').forEach(x => x.classList.remove('hover')); if (n) n.classList.add('hover'); });
  stage.addEventListener('pointerleave', () => slideNode?.querySelectorAll('.el.hover').forEach(x => x.classList.remove('hover')));
  stage.addEventListener('contextmenu', (ev) => {
    const node = ev.target.closest('.el');
    if (S.editing) return;
    ev.preventDefault();
    if (node) { if (!S.sel.includes(node.dataset.id)) { S.sel = [node.dataset.id]; markSelection(); renderOverlay(); renderProps(); } showMenu(ev.clientX, ev.clientY, elementMenuItems()); }
    else showMenu(ev.clientX, ev.clientY, slideMenuItems());
  });
  function elementMenuItems() {
    const e = elById(S.sel[0]); const items = [];
    if (e && editable(e)) items.push({ label: '글 편집', kbd: '더블클릭', fn: () => startEdit(e.id) });
    if (e && e.type === 'image') items.push({ label: '이미지 교체…', fn: () => { $('fileReplace').dataset.id = e.id; $('fileReplace').click(); } });
    if (e && e.type === 'math') items.push({ label: '수식 편집…', fn: () => openMathDialog(e) });
    if (e && e.type === 'embed') items.push({ label: '주소 바꾸기…', fn: () => openEmbedDialog(e) });
    items.push({ label: '복제', kbd: 'Ctrl+D', fn: duplicateSelected }, { label: '복사', kbd: 'Ctrl+C', fn: copySelected },
      { label: '서식 복사', kbd: 'Ctrl+Shift+C', fn: copyStyle }, { label: '서식 붙여넣기', kbd: 'Ctrl+Shift+V', fn: pasteStyle }, { sep: true },
      S.sel.length > 1 ? { label: '묶기', kbd: 'Ctrl+G', fn: groupSel } : null, e && e.group ? { label: '묶음 풀기', kbd: 'Ctrl+Shift+G', fn: ungroupSel } : null,
      { label: '맨 앞으로', fn: () => zOrder('front') }, { label: '맨 뒤로', fn: () => zOrder('back') }, { sep: true },
      { label: e && e.locked ? '잠금 해제' : '잠금 (이동 방지)', fn: () => { for (const x of selEls()) x.locked = !x.locked; commit(); markSelection(); renderOverlay(); renderProps(); } },
      { label: '삭제', kbd: 'Del', danger: true, fn: deleteSelected });
    return items.filter(Boolean);
  }

  function onPointerDown(ev) {
    if (ev.button !== 0) return;
    closeMenus();
    const t = ev.target;
    if (t.closest('.text-toolbar')) return;
    const handle = t.closest('.handle');
    if (handle) { ev.preventDefault(); startResize(ev, handle.dataset.h); return; }
    const node = t.closest('.el');
    if (S.editing) { if (node && node.dataset.id === S.editing) return; endEdit(); }
    if (node) {
      const id = node.dataset.id; const e = elById(id); if (!e) return;
      const ids = ev.altKey ? [id] : groupOf(id);
      if (ev.shiftKey) { S.sel = ids.every(x => S.sel.includes(x)) ? S.sel.filter(x => !ids.includes(x)) : Array.from(new Set(S.sel.concat(ids))); }
      else if (!S.sel.includes(id)) S.sel = ids;
      markSelection(); renderOverlay(); renderProps();
      ev.preventDefault();
      if (!e.locked) startDrag(ev);
    } else {
      if (!slideNode.contains(t) && t !== slideNode && t !== stage) return;
      if (!ev.shiftKey) { S.sel = []; markSelection(); renderOverlay(); renderProps(); }
      startMarquee(ev);
    }
  }
  function track(onMove, onUp) {
    // 마우스 움직임은 화면 한 번 그릴 때 한 번만 처리 (끌기·크기 조절이 부드럽게)
    let last = null, raf = 0;
    const mv = (e) => { last = e; if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (last) onMove(last); }); };
    const up = (e) => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); if (raf) { cancelAnimationFrame(raf); raf = 0; if (last) onMove(last); } onUp(e); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }
  function startDrag(ev) {
    if (ev.ctrlKey || ev.metaKey) { duplicateSelected(); for (const e of selEls()) { e.x -= 30; e.y -= 30; } renderStage(); }
    const els = selEls().filter(e => !e.locked); if (!els.length) return;
    const sx = ev.clientX, sy = ev.clientY; const orig = els.map(e => ({ e, x: e.x, y: e.y })); let moved = false;
    track((m) => {
      let dx = (m.clientX - sx) / S.k, dy = (m.clientY - sy) / S.k;
      if (!moved && Math.hypot(m.clientX - sx, m.clientY - sy) < 3) return; moved = true;
      if (!m.altKey) { const p = orig[0]; const sn = computeSnap(p.x + dx, p.y + dy, p.e.w, p.e.h, els); dx += sn.dx; dy += sn.dy; showGuides(sn.guides); } else clearGuides();
      for (const o of orig) { o.e.x = Math.round(o.x + dx); o.e.y = Math.round(o.y + dy); const n = nodeOf(o.e.id); if (n) { n.style.left = o.e.x + 'px'; n.style.top = o.e.y + 'px'; } }
      renderOverlay(); updatePosInputs();
    }, () => { clearGuides(); if (moved) { commit(); renderProps(); } });
  }
  function computeSnap(x, y, w, h, moving) {
    const th = 7 / S.k; const others = curSlide().elements.filter(e => !moving.includes(e));
    const vx = [0, SLIDE_W / 2, SLIDE_W, M, SLIDE_W - M], hy = [0, SLIDE_H / 2, SLIDE_H];
    for (const o of others) { vx.push(o.x, o.x + o.w / 2, o.x + o.w); hy.push(o.y, o.y + o.h / 2, o.y + o.h); }
    if (S.grid) { for (let v = 0; v <= SLIDE_W; v += 60) vx.push(v); for (let v = 0; v <= SLIDE_H; v += 60) hy.push(v); }
    let dx = 0, dy = 0, bx = th, by = th; const guides = [];
    for (const c of [x, x + w / 2, x + w]) for (const v of vx) { const d = Math.abs(v - c); if (d < bx) { bx = d; dx = v - c; guides[0] = { v }; } }
    for (const c of [y, y + h / 2, y + h]) for (const v of hy) { const d = Math.abs(v - c); if (d < by) { by = d; dy = v - c; guides[1] = { h: v }; } }
    return { dx, dy, guides: guides.filter(Boolean) };
  }
  function showGuides(gs) {
    clearGuides();
    for (const g of gs) {
      const d = document.createElement('div');
      if (g.v != null) { d.className = 'guide v'; d.style.left = (g.v * S.k) + 'px'; } else { d.className = 'guide h'; d.style.top = (g.h * S.k) + 'px'; }
      overlay.appendChild(d);
    }
  }
  function clearGuides() { overlay.querySelectorAll('.guide').forEach(g => g.remove()); }
  function startResize(ev, h) {
    if (h.length === 3 && h[0] === 'm') { startGroupResize(ev, h); return; }
    const e = elById(S.sel[0]); if (!e) return;
    const o = { x: e.x, y: e.y, w: e.w, h: e.h, r: e.rotate || 0 }; const sx = ev.clientX, sy = ev.clientY;
    const node = nodeOf(e.id);
    const rect = overlay.getBoundingClientRect();
    const cxs = rect.left + (o.x + o.w / 2) * S.k, cys = rect.top + (o.y + o.h / 2) * S.k;
    if (h === 'rot') {
      track((m) => {
        let deg = Math.atan2(m.clientY - cys, m.clientX - cxs) * 180 / Math.PI + 90;
        if (m.shiftKey) deg = Math.round(deg / 15) * 15; deg = Math.round(((deg % 360) + 360) % 360); if (deg > 180) deg -= 360;
        e.rotate = deg; node.style.transform = deg ? `rotate(${deg}deg)` : ''; renderOverlay(); updatePosInputs();
      }, () => { commit(); renderProps(); });
      return;
    }
    const ratio = o.w / o.h; const isCorner = h.length === 2;
    track((m) => {
      let dx = (m.clientX - sx) / S.k, dy = (m.clientY - sy) / S.k;
      if (o.r) { const a = -o.r * Math.PI / 180; const rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a); dx = rx; dy = ry; }
      let x = o.x, y = o.y, w = o.w, hh = o.h;
      if (h.includes('e')) w = o.w + dx; if (h.includes('w')) { x = o.x + dx; w = o.w - dx; }
      if (h.includes('s')) hh = o.h + dy; if (h.includes('n')) { y = o.y + dy; hh = o.h - dy; }
      const rk = e.type === 'image' || e.type === 'embed';
      const keep = isCorner && ((rk && !m.shiftKey) || (!rk && m.shiftKey));
      if (keep) { if (Math.abs(w / ratio - hh) * ratio > Math.abs(hh * ratio - w)) hh = w / ratio; else w = hh * ratio; if (h.includes('w')) x = o.x + o.w - w; if (h.includes('n')) y = o.y + o.h - hh; }
      w = Math.max(16, w); hh = Math.max(16, hh);
      e.x = Math.round(x); e.y = Math.round(y); e.w = Math.round(w); e.h = Math.round(hh);
      if (e.type === 'shape' || e.type === 'chart') { rerenderEl(e.id); }
      else { node.style.left = e.x + 'px'; node.style.top = e.y + 'px'; node.style.width = e.w + 'px'; node.style.height = e.h + 'px'; }
      renderOverlay(); updatePosInputs();
    }, () => { commit(); renderProps(); });
  }
  function startMarquee(ev) {
    const rect = overlay.getBoundingClientRect(); const sx = ev.clientX - rect.left, sy = ev.clientY - rect.top; let box = null;
    track((m) => {
      const x = m.clientX - rect.left, y = m.clientY - rect.top;
      if (!box) { if (Math.hypot(x - sx, y - sy) < 4) return; box = document.createElement('div'); box.className = 'marquee'; overlay.appendChild(box); }
      box.style.left = Math.min(sx, x) + 'px'; box.style.top = Math.min(sy, y) + 'px'; box.style.width = Math.abs(x - sx) + 'px'; box.style.height = Math.abs(y - sy) + 'px';
    }, (m) => {
      if (!box) return; box.remove();
      const x = m.clientX - rect.left, y = m.clientY - rect.top;
      const L = Math.min(sx, x) / S.k, T = Math.min(sy, y) / S.k, R = Math.max(sx, x) / S.k, B = Math.max(sy, y) / S.k;
      const hit = expandGroups(curSlide().elements.filter(e => !e.locked && e.x < R && e.x + e.w > L && e.y < B && e.y + e.h > T).map(e => e.id));
      S.sel = ev.shiftKey ? Array.from(new Set(S.sel.concat(hit))) : hit;
      markSelection(); renderOverlay(); renderProps();
    });
  }

  /* ---------- 텍스트 편집 ---------- */
  const isLineShape = (e) => e.type === 'shape' && (e.shape === 'line' || e.shape === 'arrow' || e.shape === 'dline');
  const editable = (e) => !!e && (e.type === 'text' || e.type === 'table' || (e.type === 'shape' && !isLineShape(e)));
  function editHosts(node, e) { return e.type === 'table' ? Array.from(node.querySelectorAll('th,td')) : [node.querySelector('.el-text-inner')].filter(Boolean); }
  function startEdit(id, ev, selectAll) {
    const e = elById(id); if (!editable(e)) return;
    if (S.editing && S.editing !== id) endEdit();
    S.sel = [id]; markSelection(); renderOverlay(); renderProps();
    let node = nodeOf(id); if (!node) return;
    const hosts = editHosts(node, e); if (!hosts.length) return;
    let target = hosts[0];
    if (ev) { const hit = document.elementFromPoint(ev.clientX, ev.clientY); const c = hit && hit.closest ? hit.closest('th,td,.el-text-inner') : null; if (c && hosts.includes(c)) target = c; }
    if (target.querySelector('.placeholder')) target.innerHTML = '';
    hosts.forEach(h => { h.contentEditable = 'true'; h.addEventListener('blur', onEditBlur); h.addEventListener('focus', onCellFocus); });
    S.editing = id; node.classList.add('editing');
    target.focus();
    const sel = window.getSelection(); let placed = false;
    if (ev && document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(ev.clientX, ev.clientY); if (r && target.contains(r.startContainer)) { sel.removeAllRanges(); sel.addRange(r); placed = true; } }
    if (!placed) { const r = document.createRange(); r.selectNodeContents(target); if (!selectAll) r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
    if (target.dataset.r != null) S.cell = { r: +target.dataset.r, c: +target.dataset.c };
    showTextToolbar(node);
  }
  function onCellFocus(ev) { const c = ev.target; if (c.dataset && c.dataset.r != null) S.cell = { r: +c.dataset.r, c: +c.dataset.c }; }
  function onEditBlur() {
    // 같은 요소 안(다른 표 칸)이나 글 도구 막대로 옮긴 것은 편집 계속
    setTimeout(() => { if (!S.editing) return; const n = nodeOf(S.editing), a = document.activeElement; if ((n && n.contains(a)) || (textToolbar && textToolbar.contains(a))) return; endEdit(); }, 0);
  }
  function endEdit() {
    if (!S.editing) return;
    const id = S.editing; const node = nodeOf(id); S.editing = null; hideTextToolbar();
    const e = elById(id); if (!node || !e) return;
    node.classList.remove('editing');
    const hosts = editHosts(node, e);
    hosts.forEach(h => { h.removeEventListener('blur', onEditBlur); h.removeEventListener('focus', onCellFocus); h.contentEditable = 'false'; });
    let changed = false;
    if (e.type === 'table') {
      const rows = Array.from(node.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(c => cleanHtml(c.innerHTML)));
      if (JSON.stringify(rows) !== JSON.stringify(e.rows)) { e.rows = rows; changed = true; }
    } else if (hosts[0]) {
      const html = cleanHtml(hosts[0].innerHTML);
      if (html !== (e.html || '')) { e.html = html; changed = true; }
    }
    if (changed) commit();
    rerenderEl(id); renderOverlay(); renderProps();
  }
  function cleanHtml(html) {
    const d = document.createElement('div'); d.innerHTML = html;
    d.querySelectorAll('.placeholder').forEach(x => x.remove());
    d.querySelectorAll('[style]').forEach(x => { // 허용된 인라인 스타일만 유지
      const keep = ['color', 'background-color', 'font-size', 'font-weight', 'font-style', 'text-decoration'];
      const st = x.getAttribute('style') || ''; const out = st.split(';').map(s => s.trim()).filter(s => keep.some(k => s.startsWith(k + ':'))).join('; ');
      if (out) x.setAttribute('style', out); else x.removeAttribute('style');
    });
    d.querySelectorAll('[class]').forEach(x => x.removeAttribute('class'));
    let out = d.innerHTML.replace(/(<br\s*\/?>)+$/i, '');
    if (!stripHtml(out) && !/<img/.test(out)) out = '';
    return out;
  }
  function exec(cmd, val) { document.execCommand(cmd, false, val); }
  function showTextToolbar(node) {
    hideTextToolbar();
    const e = elById(node.dataset.id); const st = resolveTextStyle(e, theme());
    textToolbar = document.createElement('div'); textToolbar.className = 'text-toolbar';
    textToolbar.innerHTML = `
      <button class="btn" data-cmd="bold" title="굵게 (Ctrl+B)"><b>B</b></button>
      <button class="btn" data-cmd="italic" title="기울임 (Ctrl+I)"><i>I</i></button>
      <button class="btn" data-cmd="underline" title="밑줄 (Ctrl+U)"><u>U</u></button>
      <button class="btn" data-cmd="strikeThrough" title="취소선"><s>S</s></button>
      <button class="btn" data-cmd="hilite" title="형광펜" style="background:#fde68a;color:#000">형광</button>
      <input type="color" data-cmd="foreColor" value="${toHex(themeColor(st.color, theme()))}" title="글자 색">
      <span class="sep"></span>
      <button class="btn" data-cmd="insertUnorderedList" title="글머리 기호">•≡</button>
      <button class="btn" data-cmd="insertOrderedList" title="번호 매기기">1≡</button>
      <button class="btn" data-cmd="outdent" title="내어쓰기 (Shift+Tab)">⇤</button>
      <button class="btn" data-cmd="indent" title="들여쓰기 (Tab)">⇥</button>
      <span class="sep"></span>
      <button class="btn" data-cmd="size-" title="글자 작게">A−</button>
      <button class="btn" data-cmd="size+" title="글자 크게">A+</button>
      <button class="btn" data-cmd="link" title="링크 (Ctrl+K)">🔗</button>
      <button class="btn" data-cmd="sym" title="기호 넣기 (① ★ → ㎡ ℃ …)">Ω</button>
      <button class="btn" data-cmd="removeFormat" title="서식 지우기">✕</button>`;
    textToolbar.addEventListener('mousedown', (ev) => { if (ev.target.tagName !== 'INPUT') ev.preventDefault(); });
    textToolbar.addEventListener('click', (ev) => {
      const sb = ev.target.closest('[data-sym]'); if (sb) { exec('insertText', sb.dataset.sym); return; }
      const b = ev.target.closest('[data-cmd]'); if (!b || b.tagName === 'INPUT') return;
      const cmd = b.dataset.cmd; const e = elById(S.editing); if (!e) return;
      if (cmd === 'size+' || cmd === 'size-') { const cur = resolveTextStyle(e, theme()).fontSize; e.style.fontSize = clamp(cur + (cmd === 'size+' ? 4 : -4), 10, 400); applyElementTextStyle(e, nodeOf(e.id), theme()); markDirty(); renderProps(); return; }
      if (cmd === 'hilite') { exec('hiliteColor', '#fde68a'); return; }
      if (cmd === 'sym') { let pop = textToolbar.querySelector('.sym-pop'); if (pop) { pop.remove(); return; } pop = document.createElement('div'); pop.className = 'sym-pop'; pop.innerHTML = SYMBOLS.map(c => `<button class="btn" data-sym="${esc(c)}">${esc(c)}</button>`).join(''); textToolbar.appendChild(pop); return; }
      if (cmd === 'link') { const u = prompt('링크 주소'); if (u) exec('createLink', u); return; }
      exec(cmd);
    });
    textToolbar.querySelector('input[type=color]').addEventListener('input', (ev) => exec('foreColor', ev.target.value));
    main.appendChild(textToolbar); positionTextToolbar();
  }
  function positionTextToolbar() {
    if (!textToolbar || !S.editing) return;
    const node = nodeOf(S.editing); if (!node) return;
    const r = node.getBoundingClientRect(), mr = main.getBoundingClientRect();
    const tw = textToolbar.offsetWidth, th = textToolbar.offsetHeight;
    let left = r.left - mr.left + r.width / 2 - tw / 2, top = r.top - mr.top - th - 10;
    left = clamp(left, 8, mr.width - tw - 8); if (top < 8) top = r.bottom - mr.top + 10;
    textToolbar.style.left = left + 'px'; textToolbar.style.top = top + 'px';
  }
  function hideTextToolbar() { if (textToolbar) { textToolbar.remove(); textToolbar = null; } }

  /* ---------- 속성 패널 ---------- */
  const row = (label, html) => `<div class="prow"><label>${label}</label><div class="ctrls">${html}</div></div>`;
  const num = (k, v, step, min, max, title) => `<input type="number" data-k="${k}" value="${v == null ? '' : v}" step="${step || 1}" ${min != null ? `min="${min}"` : ''} ${max != null ? `max="${max}"` : ''} ${title ? `title="${title}"` : ''}>`;
  const colorIn = (k, v) => `<input type="color" data-k="${k}" value="${toHex(v)}">`;
  const selIn = (k, v, opts) => `<select data-k="${k}">${opts.map(o => `<option value="${o[0]}" ${String(o[0]) === String(v) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
  const tog = (k, v, label, title) => `<button class="btn sm ${v ? 'active' : ''}" data-k="${k}" data-toggle="1" title="${title || ''}">${label}</button>`;
  const choice = (k, v, opts) => opts.map(o => `<button class="btn sm ${String(o[0]) === String(v) ? 'active' : ''}" data-k="${k}" data-val="${o[0]}" title="${o[2] || ''}">${o[1]}</button>`).join('');
  function swatches(k, allowNone) {
    const t = theme();
    const cols = [['$accent', '강조'], ['$accent2', '강조2'], ['$title', '제목색'], ['$fg', '본문색'], ['$muted', '흐림'], ['$surface', '면'], ['$bg', '배경'],
      ['#ffffff', '흰색'], ['#111111', '검정'], ['#ef4444', '빨강'], ['#f59e0b', '주황'], ['#22c55e', '초록'], ['#3b82f6', '파랑'], ['#a855f7', '보라']];
    return `<div class="swatches">${allowNone ? `<div class="swatch none" data-k="${k}" data-val="" title="없음"></div>` : ''}${cols.map(c => `<div class="swatch" data-k="${k}" data-val="${c[0]}" title="${c[1]}" style="background:${themeColor(c[0], t)}"></div>`).join('')}</div>`;
  }
  function toHex(c) {
    if (!c) return '#000000'; c = themeColor(c, theme());
    if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(c)) return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); if (m) return '#' + [m[1], m[2], m[3]].map(x => (+x).toString(16).padStart(2, '0')).join('');
    return '#000000';
  }
  const ANIMS = [['fade', '페이드'], ['up', '아래서 위로'], ['down', '위에서 아래로'], ['left', '왼쪽에서'], ['right', '오른쪽에서'], ['zoom', '확대'], ['pop', '튀어나오기'], ['wipe', '닦아내기'], ['blur', '흐림 → 선명'], ['spin', '회전하며'], ['none', '효과 없음']];
  const EMPHS = [['pulse', '두근 (크게)'], ['shake', '흔들기'], ['glow', '빛나기']];
  const SPEEDS = [['', '기본'], ['0.3', '빠르게'], ['0.5', '보통'], ['1', '느리게'], ['2', '아주 느리게']];
  const TRANS = [['', '기본 (교안 설정)'], ['none', '없음'], ['fade', '페이드'], ['slide', '밀어내기'], ['up', '위로 밀기'], ['cover', '덮기'], ['wipe', '닦아내기'], ['zoom', '확대'], ['blur', '흐리게'], ['morph', '모핑 ✨ (같은 요소가 움직임)']];
  const DECORS = [['', '테마 기본'], ['none', '없음'], ['bar-left', '왼쪽 바'], ['bar-top', '위쪽 바'], ['band-bottom', '아래 띠'], ['corner', '모서리 원'], ['frame', '테두리'], ['grid', '모눈']];
  const LISTS = [['', '• 기본'], ['check', '✔ 체크'], ['arrow', '➜ 화살표'], ['dash', '– 줄표'], ['square', '■ 네모'], ['star', '★ 별'], ['none', '기호 없음']];
  const MASKS = [['', '사각형'], ['circle', '원'], ['hexagon', '육각형'], ['diamond', '마름모'], ['triangle', '삼각형'], ['arch', '아치'], ['blob', '자유 모양']];
  const GRADS = ['linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)', 'linear-gradient(135deg,#f6d365,#fda085)', 'linear-gradient(135deg,#a1c4fd,#c2e9fb)', 'linear-gradient(135deg,#d4fc79,#96e6a1)', 'linear-gradient(135deg,#fbc2eb,#a6c1ee)', 'linear-gradient(180deg,#ffffff,#e5e7eb)', 'linear-gradient(135deg,#141e30,#243b55)', 'linear-gradient(135deg,#ff9a9e,#fecfef)', 'linear-gradient(135deg,#43cea2,#185a9d)', 'linear-gradient(160deg,#fdfbfb,#ebedee)', 'radial-gradient(circle at 30% 20%,#3a3f5c,#0d0f1a)'];
  const rng = (k, v, min, max, step, title) => `<input type="range" data-k="${k}" value="${v}" min="${min}" max="${max}" step="${step || 1}" ${title ? `title="${title}"` : ''}>`;
  const hint = (t) => `<div class="muted" style="font-size:11.5px;margin:4px 0 2px;line-height:1.5">${t}</div>`;
  const small = (t) => `<label style="color:var(--ui-muted);font-size:12px">${t}</label>`;

  function renderProps() {
    const els = selEls();
    if (!els.length) props.innerHTML = slideProps();
    else if (els.length === 1) props.innerHTML = elementProps(els[0]);
    else props.innerHTML = multiProps(els);
  }
  function slideProps() {
    const s = curSlide(); const bg = s.bg || {};
    const mode = bg.image ? 'image' : bg.gradient ? 'gradient' : bg.color ? 'color' : 'theme';
    const tr = s.transition || '';
    const morphOn = tr === 'morph' || (!tr && S.deck.transition === 'morph');
    return `
    <section><h4>슬라이드 ${S.cur + 1} 배경</h4>
      ${row('종류', choice('slide.bgmode', mode, [['theme', '테마'], ['color', '단색'], ['gradient', '그라데이션'], ['image', '이미지']]))}
      ${mode === 'color' ? row('색', colorIn('slide.bg.color', bg.color || theme().bg) + '<div style="flex:3">' + swatches('slide.bg.color') + '</div>') : ''}
      ${mode === 'gradient' ? row('프리셋', `<div class="swatches">${GRADS.map(g => `<div class="swatch" data-k="slide.bg.gradient" data-val="${g}" style="background:${g}"></div>`).join('')}</div>`) + row('직접', `<input type="text" data-k="slide.bg.gradient" value="${esc(bg.gradient || '')}" placeholder="linear-gradient(...)">`) : ''}
      ${mode === 'image' ? row('이미지', `<button class="btn sm" data-act="bgImage">파일 선택…</button>`) + (bg.image ? row('맞춤', selIn('slide.bg.fit', bg.fit || 'cover', [['cover', '채우기'], ['contain', '맞추기']])) + row('어둡게', rng('slide.bg.dim', bg.dim || 0, 0, 0.85, 0.05, '사진 위 글자가 잘 보이도록 어둡게')) + row('바탕색', colorIn('slide.bg.color', bg.color || theme().bg)) : '') : ''}
      ${row('장식', selIn('slide.decor', s.decor || '', DECORS))}
      ${row('전환', selIn('slide.transition', tr, TRANS))}
      ${morphOn ? hint('✨ 모핑: 이 슬라이드를 앞 슬라이드의 복제본(Ctrl+Shift+D)으로 만든 뒤 요소를 옮기거나 키우면, 발표 때 그 사이가 부드럽게 움직입니다.') : ''}
      ${row('발표', tog('slide.hidden', s.hidden, s.hidden ? '🙈 숨긴 슬라이드' : '보임', '숨기면 발표 때 건너뜁니다 (번호로는 이동 가능)') + tog('slide.noFooter', s.noFooter, '꼬리말 숨김'))}
    </section>
    <section><h4>발표자 노트 <span class="muted" style="text-transform:none;font-weight:400">발표자 보기(S)에서 표시</span></h4>
      <textarea data-k="slide.notes" placeholder="이 슬라이드에서 말할 내용, 참고 사항…">${esc(s.notes || '')}</textarea>
    </section>
    <section><h4>슬라이드 작업</h4>
      <div class="grid2">
        <button class="btn sm" data-act="dupSlide" title="Ctrl+Shift+D">복제</button>
        <button class="btn sm" data-act="layout">레이아웃 적용…</button>
        <button class="btn sm" data-act="moveUp">▲ 위로</button>
        <button class="btn sm" data-act="moveDown">▼ 아래로</button>
        <button class="btn sm" data-act="outline">📝 개요로 만들기…</button>
        <button class="btn sm" data-act="album">🖼 사진 앨범…</button>
        <button class="btn sm danger" data-act="delSlide" style="grid-column:1/-1">슬라이드 삭제</button>
      </div>
    </section>
    <section><h4>교안 전체</h4>
      ${row('기본 전환', selIn('deck.transition', S.deck.transition || 'fade', TRANS.slice(1)))}
      ${row('테마', selIn('deck.theme', S.deck.theme, THEMES.map(t => [t.id, t.name])))}
      ${row('', '<button class="btn sm" data-act="design">🎨 디자인 · 색 · 글꼴 · 꼬리말…</button>')}
      <div class="muted" style="font-size:12px;margin-top:6px">슬라이드 ${S.deck.slides.length}장${S.deck.slides.some(x => x.hidden) ? ` (숨김 ${S.deck.slides.filter(x => x.hidden).length})` : ''} · 파일: decks/${esc(S.name)}.json</div>
    </section>`;
  }
  function posSection(e) {
    return `<section><h4>위치 · 크기 ${tog('locked', e.locked, e.locked ? '🔒 잠김' : '🔓', '잠그면 이동/크기 조절이 안 됩니다')}</h4>
      <div class="grid4">
        ${num('x', e.x, 1, null, null, 'X')}${num('y', e.y, 1, null, null, 'Y')}${num('w', e.w, 1, 16, null, '너비')}${num('h', e.h, 1, 16, null, '높이')}
      </div>
      <div class="prow" style="margin-top:6px"><label>회전</label><div class="ctrls">${num('rotate', e.rotate || 0, 1, -180, 180)}${small('투명도')}${num('opacity', Math.round((e.opacity == null ? 1 : e.opacity) * 100), 5, 0, 100)}</div></div>
      ${e.group ? hint('⛓ 묶음에 들어 있습니다 · Ctrl+Shift+G 로 풀기 · Alt+클릭으로 하나만 선택') : ''}
    </section>`;
  }
  function fontRows(e, st, o) {
    o = o || {};
    return `${row('글꼴', selIn('style.font', st.font, FONTS.map(f => [f.id, f.name])))}
      ${row('크기', num('style.fontSize', st.fontSize, 2, 8, 400) + choice('style.fontSize', st.fontSize, (o.sizes || [24, 32, 40, 56, 72]).map(v => [v, String(v)])))}
      ${row('색', colorIn('style.color', st.color) + '<div style="flex:3">' + swatches('style.color') + '</div>')}
      ${row('스타일', tog('style.bold', st.bold, '<b>B</b>', '굵게 (Ctrl+B)') + tog('style.italic', st.italic, '<i>I</i>', '기울임 (Ctrl+I)') + tog('style.underline', st.underline, '<u>U</u>', '밑줄') + tog('style.tshadow', st.tshadow, '그림자', '글자 그림자 (사진 위 글자에 좋음)'))}
      ${row('가로 정렬', choice('style.align', st.align || 'left', [['left', '⇤', '왼쪽'], ['center', '↔', '가운데'], ['right', '⇥', '오른쪽']]))}
      ${o.valign === false ? '' : row('세로 정렬', choice('style.valign', st.valign || 'top', [['top', '⤒', '위'], ['middle', '↕', '가운데'], ['bottom', '⤓', '아래']]))}`;
  }
  function animSection(e) {
    return `<section><h4>애니메이션 (클릭 단계)</h4>
      ${row('나타내기', num('step', e.step || 0, 1, 0, 50, '0 = 처음부터 보임, 1 이상 = 그 번째 클릭에 나타남') + selIn('anim', e.anim || 'fade', ANIMS))}
      ${e.type === 'text' ? row('목록', tog('listSteps', e.listSteps, '항목 하나씩 표시', '글머리 항목을 클릭할 때마다 하나씩 보여줍니다')) : ''}
      ${row('속도', selIn('dur', e.dur ? String(e.dur) : '', SPEEDS) + small('지연(초)') + num('delay', e.delay || 0, 0.1, 0, 10, '같은 클릭에서 이만큼 늦게 시작'))}
      ${row('강조', num('emStep', e.emStep || 0, 1, 0, 50, '이 번째 클릭에서 한 번 강조 (0 = 없음)') + selIn('emAnim', e.emAnim || 'pulse', EMPHS))}
      ${row('사라지기', num('outStep', e.outStep || 0, 1, 0, 50, '이 번째 클릭에서 사라짐 (0 = 사라지지 않음)'))}
      ${hint(`같은 단계 번호 = 함께 나타남 · 지연으로 “이전 효과 다음” 연출 · 이 슬라이드의 최대 단계: ${maxStep(curSlide())}`)}
    </section>`;
  }
  function slideTitle(s) {
    const h = s.elements.find(e => e.type === 'text' && (e.role === 'title' || e.role === 'heading')) || s.elements.find(e => e.type === 'text');
    return (h && stripHtml(h.html)) || '(제목 없음)';
  }
  function linkSection(e) {
    const v = e.link || '';
    const opts = [['', '없음'], ['next', '다음 슬라이드'], ['prev', '이전 슬라이드'], ['first', '첫 슬라이드'], ['last', '마지막 슬라이드']]
      .concat(S.deck.slides.map((s, i) => ['slide:' + s.id, `${i + 1}. ${slideTitle(s).slice(0, 22)}`]));
    if (v.startsWith('url:')) opts.push([v, '🌐 ' + v.slice(4, 44)]);
    opts.push(['__url', '🌐 웹 주소 입력…']);
    return `<section><h4>링크 <span class="muted" style="text-transform:none;font-weight:400">발표 중 클릭하면 이동 (목차·버튼에 좋음)</span></h4>${row('이동', selIn('link', v, opts))}</section>`;
  }
  function elementProps(e) {
    let body = '';
    const st = resolveTextStyle(e, theme());
    if (e.type === 'text') {
      body = `<section><h4>텍스트</h4>
        ${row('역할', selIn('role', e.role || 'text', Object.entries(ROLE_NAMES)))}
        ${fontRows(e, st)}
        ${row('줄 간격', num('style.lineHeight', st.lineHeight || 1.5, 0.1, 0.8, 3) + small('자간') + num('style.letterSpacing', st.letterSpacing || 0, 0.5, -5, 20))}
        ${row('글머리', selIn('style.list', st.list || '', LISTS))}
        ${row('맞춤', `<button class="btn sm" data-act="autofit" title="글이 상자 안에 꽉 차도록 글자 크기를 맞춥니다">글자 크기 자동 맞춤</button>`)}
      </section>
      <section><h4>상자 꾸밈</h4>
        ${row('배경', colorIn('style.bg', st.bg || theme().surface) + '<div style="flex:3">' + swatches('style.bg', true) + '</div>')}
        ${row('안쪽 여백', num('style.padding', st.padding || 0, 4, 0, 200) + small('모서리') + num('style.radius', st.radius || 0, 4, 0, 200))}
        ${row('테두리', num('style.border', st.border || 0, 1, 0, 40) + colorIn('style.borderColor', st.borderColor || '$accent'))}
        ${row('효과', tog('style.shadow', st.shadow, '그림자') + tog('style.accentBar', st.accentBar, '왼쪽 강조선'))}
      </section>`;
    } else if (e.type === 'image') {
      const fx = e.fx || {};
      body = `<section><h4>이미지</h4>
        ${row('파일', `<button class="btn sm" data-act="replaceImage">교체…</button><button class="btn sm" data-act="fitRatio" title="원본 비율로 높이 조정">원본 비율</button>`)}
        ${row('맞춤', choice('fit', e.fit || 'contain', [['contain', '맞추기'], ['cover', '채우기'], ['fill', '늘이기']]))}
        ${row('모양', selIn('mask', e.mask || '', MASKS))}
        ${row('모서리', num('radius', e.radius || 0, 4, 0, 400))}
        ${row('테두리', num('border', e.border || 0, 1, 0, 40) + colorIn('borderColor', e.borderColor || '#ffffff'))}
        ${row('효과', tog('shadow', e.shadow, '그림자') + tog('flip', e.flip, '좌우 반전'))}
      </section>
      <section><h4>자르기 <span class="muted" style="text-transform:none;font-weight:400">보여줄 부분 고르기</span></h4>
        ${row('확대', rng('zoom', e.zoom || 1, 1, 4, 0.05))}
        ${row('가로 위치', rng('cropX', e.cropX == null ? 50 : e.cropX, 0, 100))}
        ${row('세로 위치', rng('cropY', e.cropY == null ? 50 : e.cropY, 0, 100))}
        ${hint('“채우기”와 함께 쓰면 액자에 맞춰 원하는 부분만 보입니다')}
        ${row('', `<button class="btn sm" data-act="cropReset">자르기 초기화</button>`)}
      </section>
      <section><h4>보정</h4>
        ${row('밝기', rng('fx.b', fx.b == null ? 100 : fx.b, 30, 200))}
        ${row('대비', rng('fx.c', fx.c == null ? 100 : fx.c, 30, 200))}
        ${row('채도', rng('fx.s', fx.s == null ? 100 : fx.s, 0, 200))}
        ${row('세피아', rng('fx.sepia', fx.sepia || 0, 0, 100))}
        ${row('흐림', rng('fx.blur', fx.blur || 0, 0, 20))}
        ${row('', `<button class="btn sm" data-act="gray">흑백</button><button class="btn sm" data-act="fxReset">보정 초기화</button>`)}
      </section>`;
    } else if (e.type === 'shape') {
      const line = e.shape === 'line' || e.shape === 'arrow' || e.shape === 'dline';
      body = `<section><h4>도형</h4>
        ${row('종류', selIn('shape', e.shape, SHAPES.map(s => [s.id, s.name])))}
        ${row(line ? '색' : '채우기', colorIn('fill', e.fill || '$accent') + '<div style="flex:3">' + swatches('fill', true) + '</div>')}
        ${line ? '' : row('그라데이션', `<button class="btn sm ${e.fill2 ? 'active' : ''}" data-act="gradToggle">${e.fill2 ? '켜짐' : '꺼짐'}</button>` + (e.fill2 ? colorIn('fill2', e.fill2) + num('gAngle', e.gAngle == null ? 90 : e.gAngle, 15, 0, 360, '방향 (도)') : ''))}
        ${row(line ? '굵기' : '선', num('strokeWidth', e.strokeWidth || 0, 1, 0, 60) + (line ? '' : colorIn('stroke', e.stroke || '$accent')) + tog('dash', e.dash, '점선'))}
        ${e.shape === 'rect' || e.shape === 'callout' ? row('모서리', num('radius', e.radius || 0, 4, 0, 400)) : ''}
        ${row('효과', tog('shadow', e.shadow, '그림자'))}
      </section>
      ${line ? '' : `<section><h4>도형 안 글자 <span class="muted" style="text-transform:none;font-weight:400">더블클릭으로 입력</span></h4>${fontRows(e, st)}</section>`}`;
    } else if (e.type === 'table') {
      body = `<section><h4>표 <span class="muted" style="text-transform:none;font-weight:400">더블클릭: 칸 편집 · Tab: 다음 칸</span></h4>
        ${row('행', `<button class="btn sm" data-act="rowAdd">＋ 행 추가</button><button class="btn sm" data-act="rowDel">－ 행 삭제</button>`)}
        ${row('열', `<button class="btn sm" data-act="colAdd">＋ 열 추가</button><button class="btn sm" data-act="colDel">－ 열 삭제</button>`)}
        ${hint('편집 중인 칸 다음에 추가 / 그 칸을 삭제합니다')}
        ${row('강조', tog('header', e.header, '첫 행 머리글') + tog('firstCol', e.firstCol, '첫 열 굵게'))}
        ${row('줄무늬', tog('band', e.band, '한 줄씩 배경'))}
        ${row('선', choice('lines', e.lines || 'grid', [['grid', '격자'], ['h', '가로선'], ['none', '없음']]) + colorIn('lineColor', e.lineColor || '$muted'))}
        ${row('머리글 색', colorIn('headFill', e.headFill || '$accent') + '<div style="flex:3">' + swatches('headFill') + '</div>')}
        ${row('모서리', num('radius', e.radius || 0, 2, 0, 80))}
      </section>
      <section><h4>표 글자</h4>${fontRows(e, st, { valign: false, sizes: [20, 24, 28, 32, 40] })}</section>`;
    } else if (e.type === 'chart') {
      body = `<section><h4>차트</h4>
        ${row('종류', selIn('kind', e.kind || 'bar', CHART_KINDS))}
        ${hint('데이터: 첫 줄은 제목줄 (항목,계열1,계열2…) · 쉼표나 탭으로 구분 · 엑셀 표를 복사해 붙여넣어도 됩니다')}
        <textarea data-k="data" class="mono" style="min-height:150px" spellcheck="false">${esc(e.data || '')}</textarea>
        ${row('표시', tog('values', e.values, '값') + tog('legend', e.legend, '범례') + tog('grid', e.grid !== false, '격자'))}
        ${row('단위', `<input type="text" data-k="unit" value="${esc(e.unit || '')}" placeholder="예: %, 명, 억원">`)}
        ${e.kind === 'donut' ? row('가운데', `<input type="text" data-k="center" value="${esc(e.center || '')}" placeholder="가운데 큰 글자 (예: 72%)">`) : ''}
        ${row('글자 크기', num('style.fontSize', st.fontSize, 2, 10, 80))}
        ${row('글자 색', colorIn('style.color', st.color) + '<div style="flex:3">' + swatches('style.color') + '</div>')}
        ${hint('색은 테마의 강조색 순서로 칠해집니다 (🎨 디자인에서 바꿀 수 있음) · 발표 때 막대가 자라나는 효과가 나옵니다')}
      </section>`;
    } else if (e.type === 'math') {
      body = `<section><h4>수식 <span class="muted" style="text-transform:none;font-weight:400">LaTeX 문법</span></h4>
        <textarea data-k="tex" class="mono" style="min-height:90px" spellcheck="false">${esc(e.tex || '')}</textarea>
        ${row('', `<button class="btn sm" data-act="mathDialog">수식 편집기 (예제 포함)…</button>`)}
        ${row('크기', num('style.fontSize', st.fontSize, 4, 16, 300))}
        ${row('색', colorIn('style.color', st.color) + '<div style="flex:3">' + swatches('style.color') + '</div>')}
        ${row('가로 정렬', choice('style.align', st.align || 'center', [['left', '⇤', '왼쪽'], ['center', '↔', '가운데'], ['right', '⇥', '오른쪽']]))}
        ${row('세로 정렬', choice('style.valign', st.valign || 'middle', [['top', '⤒', '위'], ['middle', '↕', '가운데'], ['bottom', '⤓', '아래']]))}
      </section>`;
    } else if (e.type === 'embed') {
      const p = parseEmbed(e.url);
      const kl = { youtube: 'YouTube 동영상', vimeo: 'Vimeo 동영상', video: '동영상 파일', web: '웹 페이지', none: '알 수 없는 주소' }[p.kind];
      body = `<section><h4>동영상 · 웹</h4>
        ${row('주소', `<input type="text" data-k="url" value="${esc(e.url || '')}" placeholder="YouTube 링크 / mp4 주소 / 웹 페이지">`)}
        ${hint(`${kl} · 발표 화면에서 재생됩니다${p.kind === 'web' ? ' · 일부 사이트는 다른 페이지 안에 표시되지 않도록 막아 두었습니다' : ''}${p.kind === 'youtube' ? ' · 주소에 ?t=90 처럼 쓰면 그 시점부터 재생' : ''}`)}
        ${p.kind === 'web' ? '' : row('재생', tog('autoplay', e.autoplay, '자동 재생') + tog('muted', e.muted, '소리 끔') + tog('loop', e.loop, '반복'))}
        ${row('모서리', num('radius', e.radius || 0, 4, 0, 200))}
        ${row('효과', tog('shadow', e.shadow, '그림자'))}
        ${row('', `<button class="btn sm" data-act="openEmbed">새 창에서 확인</button>`)}
      </section>`;
    }
    return body + posSection(e) + animSection(e) + linkSection(e) + `<section><div class="grid2"><button class="btn sm" data-act="dup">복제</button><button class="btn sm danger" data-act="del">삭제</button></div></section>`;
  }
  function multiProps(els) {
    const grouped = els.length > 1 && els.every(e => e.group && e.group === els[0].group);
    const texty = els.filter(e => e.type !== 'image' && e.type !== 'embed');
    return `<section><h4>${els.length}개 선택${grouped ? ' · ⛓ 묶음' : ''}</h4>
      ${row('묶기', `<button class="btn sm" data-act="group" title="Ctrl+G">묶기</button><button class="btn sm" data-act="ungroup" title="Ctrl+Shift+G">풀기</button>`)}
      ${row('정렬', `<div class="grid4" style="flex:1">${['left', 'hcenter', 'right', 'top', 'vcenter', 'bottom'].map((a, i) => `<button class="btn sm icon" data-align="${a}">${['⇤', '↔', '⇥', '⤒', '↕', '⤓'][i]}</button>`).join('')}</div>`)}
      ${row('분포', `<button class="btn sm" data-act="distH">가로 등간격</button><button class="btn sm" data-act="distV">세로 등간격</button>`)}
      ${row('크기', `<button class="btn sm" data-act="sameW">같은 너비</button><button class="btn sm" data-act="sameH">같은 높이</button>`)}
      ${texty.length ? row('글자', `<button class="btn sm" data-act="fsDown" title="Ctrl+[">가−</button><button class="btn sm" data-act="fsUp" title="Ctrl+]">가+</button>`) : ''}
      ${hint('모서리 손잡이를 끌면 함께 크기가 바뀝니다')}
    </section>
    <section><h4>애니메이션</h4>${row('단계', num('step', commonVal(els, 'step'), 1, 0, 50) + selIn('anim', commonVal(els, 'anim') || 'fade', ANIMS))}
      ${row('순서대로', `<button class="btn sm" data-act="stepSeq" title="선택한 요소들을 위→아래, 왼쪽→오른쪽 순서로 1, 2, 3…">1→2→3 자동 부여</button>`)}
    </section>
    <section><div class="grid2"><button class="btn sm" data-act="dup">복제</button><button class="btn sm danger" data-act="del">삭제</button></div></section>`;
  }
  function commonVal(els, k) { const v = els[0][k]; return els.every(e => e[k] === v) ? v : ''; }

  /* 속성 변경 */
  props.addEventListener('input', (ev) => { const t = ev.target; if (t.dataset.k && (t.type === 'number' || t.type === 'color' || t.type === 'range' || t.tagName === 'TEXTAREA')) setProp(t.dataset.k, readVal(t), false); });
  props.addEventListener('change', (ev) => { const t = ev.target; if (t.dataset.k) setProp(t.dataset.k, readVal(t), true); });
  props.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-k],[data-act],[data-align]'); if (!t) return;
    if (t.dataset.align) { alignSel(t.dataset.align); return; }
    if (t.dataset.act) { doAct(t.dataset.act); return; }
    if (t.dataset.toggle) { const k = t.dataset.k; const cur = k.startsWith('slide.') ? getPath(curSlide(), k.slice(6)) : k.startsWith('deck.') ? getPath(S.deck, k.slice(5)) : (S.sel.length ? getPath(selEls()[0], k) : null); setProp(k, !cur, true); return; }
    if (t.dataset.val != null && t.tagName !== 'INPUT' && t.tagName !== 'SELECT') { let v = t.dataset.val; if (/^-?\d+(\.\d+)?$/.test(v)) v = parseFloat(v); setProp(t.dataset.k, v, true); }
  });
  function readVal(t) {
    if (t.type === 'number' || t.type === 'range') { const v = parseFloat(t.value); return isNaN(v) ? 0 : v; }
    return t.value;
  }
  function getPath(o, path) { return path.split('.').reduce((a, k) => a == null ? a : a[k], o); }
  function setPath(o, path, v) { const ks = path.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null || typeof a[ks[i]] !== 'object') a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; }
  function setProp(k, v, doCommit) {
    if (k === 'deck.theme') { S.deck.theme = v; delete S.deck.colors; delete S.deck.titleFont; delete S.deck.bodyFont; delete S.deck.decor; $('theme').value = v; commit({ all: true }); renderStage(); renderProps(); return; }
    if (k.startsWith('deck.')) { setPath(S.deck, k.slice(5), v); if (doCommit) commit({ all: true }); else markDirty(); renderStage(); if (doCommit) renderProps(); return; }
    if (k === 'link' && v === '__url') { const u = prompt('열 웹 주소 (https://…)', 'https://'); if (!u || !/^https?:\/\/\S+/.test(u.trim())) { renderProps(); return; } v = 'url:' + u.trim(); }
    if (k.startsWith('slide.')) {
      const s = curSlide(); const key = k.slice(6);
      if (key === 'bgmode') {
        if (v === 'theme') s.bg = null; else if (v === 'color') s.bg = { color: (s.bg && s.bg.color) || theme().bg }; else if (v === 'gradient') s.bg = { gradient: GRADS[0] };
        else if (v === 'image') { s.bg = s.bg && s.bg.image ? s.bg : { image: '' }; $('fileBg').click(); }
      } else if (key === 'notes') { s.notes = v; if (doCommit) { pushHistory(); markDirty(); } return; }
      else { if (!s.bg) s.bg = {}; setPath(s, key, v); if (key === 'decor' && !v) delete s.decor; if (key === 'transition' && !v) delete s.transition; }
      if (doCommit) commit(); else markDirty();
      renderStage(); if (doCommit) renderProps(); return;
    }
    const els = selEls(); if (!els.length) return;
    for (const e of els) {
      let val = v;
      if (k === 'opacity') val = clamp(v / 100, 0, 1);
      if (k === 'style.bg' && v === '') { delete e.style.bg; } else if (k === 'link' && !v) { delete e.link; } else setPath(e, k, val);
      if (k.startsWith('style.') && (val === '' || val === false) && k !== 'style.align' && k !== 'style.valign') delete e.style[k.slice(6)];
      if (k === 'role') { /* 역할 변경시 크기/색 오버라이드 제거 */ delete e.style.fontSize; delete e.style.color; delete e.style.bold; delete e.style.font; }
      if (k === 'shape' && (v === 'line' || v === 'arrow') && e.h > 80) e.h = 40;
      if (S.editing === e.id && k.startsWith('style.') && e.type !== 'chart') applyElementTextStyle(e, nodeOf(e.id), theme());
      else rerenderEl(e.id);
    }
    renderOverlay();
    if (doCommit) { commit(); renderProps(); } else markDirty();
  }
  function updatePosInputs() {
    const e = elById(S.sel[0]); if (!e || S.sel.length !== 1) return;
    for (const k of ['x', 'y', 'w', 'h', 'rotate']) { const i = props.querySelector(`input[data-k="${k}"]`); if (i && document.activeElement !== i) i.value = e[k] || 0; }
  }
  function doAct(a) {
    const e = elById(S.sel[0]);
    switch (a) {
      case 'bgImage': $('fileBg').click(); break;
      case 'dupSlide': duplicateSlide(); break;
      case 'delSlide': if (confirm('이 슬라이드를 삭제할까요?')) deleteSlide(); break;
      case 'moveUp': moveSlide(-1); break;
      case 'moveDown': moveSlide(1); break;
      case 'layout': showLayoutMenu(null, applyLayout); break;
      case 'dup': duplicateSelected(); break;
      case 'del': deleteSelected(); break;
      case 'replaceImage': if (e) { $('fileReplace').dataset.id = e.id; $('fileReplace').click(); } break;
      case 'fitRatio': if (e && e.src) imageSize(e.src).then(d => { e.h = Math.round(e.w * d.h / d.w); commit(); rerenderEl(e.id); renderOverlay(); renderProps(); }); break;
      case 'distH': distribute('h'); break;
      case 'distV': distribute('v'); break;
      case 'sameW': { const els = selEls(); for (const x of els) x.w = els[0].w; commit(); renderStage(); break; }
      case 'sameH': { const els = selEls(); for (const x of els) x.h = els[0].h; commit(); renderStage(); break; }
      case 'autofit': if (e) autofit(e); break;
      case 'gradToggle': if (e) { if (e.fill2) e.fill2 = ''; else { e.fill2 = '$accent2'; if (e.gAngle == null) e.gAngle = 135; } commit(); rerenderEl(e.id); renderProps(); } break;
      case 'gray': if (e) { e.fx = Object.assign({}, e.fx, { s: 0 }); commit(); rerenderEl(e.id); renderProps(); } break;
      case 'fxReset': if (e) { delete e.fx; commit(); rerenderEl(e.id); renderProps(); } break;
      case 'cropReset': if (e) { delete e.cropX; delete e.cropY; delete e.zoom; commit(); rerenderEl(e.id); renderProps(); } break;
      case 'rowAdd': case 'rowDel': case 'colAdd': case 'colDel': tableOp(a); break;
      case 'mathDialog': if (e) openMathDialog(e); break;
      case 'openEmbed': if (e) { const q = parseEmbed(e.url); window.open(q.kind === 'youtube' ? `https://www.youtube.com/watch?v=${q.id}` : e.url, '_blank', 'noopener'); } break;
      case 'design': showDesign(); break;
      case 'outline': showOutline(); break;
      case 'album': $('fileAlbum').click(); break;
      case 'group': groupSel(); break;
      case 'ungroup': ungroupSel(); break;
      case 'fsUp': fontSizeStep(4); break;
      case 'fsDown': fontSizeStep(-4); break;
      case 'stepSeq': { const els = selEls().sort((p, q) => (p.y - q.y) || (p.x - q.x)); els.forEach((x, i) => x.step = i + 1); commit(); renderStage(); renderProps(); break; }
    }
  }

  /* ---------- 메뉴 ---------- */
  let openMenu = null;
  function closeMenus() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  function showMenu(x, y, items) {
    closeMenus();
    const m = document.createElement('div'); m.className = 'menu';
    for (const it of items) {
      if (it.sep) { m.appendChild(document.createElement('hr')); continue; }
      const d = document.createElement('div'); d.className = 'mi' + (it.danger ? ' danger' : ''); d.innerHTML = `<span>${it.label}</span>${it.kbd ? `<kbd>${it.kbd}</kbd>` : ''}`;
      if (it.danger) d.style.color = '#fca5a5';
      d.onclick = () => { closeMenus(); it.fn(); }; m.appendChild(d);
    }
    document.body.appendChild(m); openMenu = m;
    const w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.min(x, innerWidth - w - 8) + 'px'; m.style.top = Math.min(y, innerHeight - h - 8) + 'px';
  }
  function showLayoutMenu(anchor, onPick) {
    closeMenus();
    const m = document.createElement('div'); m.className = 'layout-menu';
    for (const L of LAYOUTS) {
      const it = document.createElement('div'); it.className = 'layout-item';
      const pv = document.createElement('div'); pv.className = 'pv';
      const sl = renderSlide({ id: 'x', elements: layoutElements(L.id), bg: null, notes: '' }, S.deck, { mode: 'thumb' });
      pv.appendChild(sl); it.appendChild(pv);
      const lb = document.createElement('div'); lb.textContent = L.name; it.appendChild(lb);
      it.onclick = () => { closeMenus(); (onPick || addSlide)(L.id); };
      m.appendChild(it);
      requestAnimationFrame(() => fitSlide(pv, sl));
    }
    document.body.appendChild(m); openMenu = m;
    const a = (anchor || $('btnAddSlide')).getBoundingClientRect();
    m.style.left = Math.min(a.left, innerWidth - m.offsetWidth - 8) + 'px'; m.style.top = (a.bottom + 6) + 'px';
  }
  function btnMenu(btn, items) {
    const r = btn.getBoundingClientRect(); showMenu(r.left, r.bottom + 6, items);
  }
  document.addEventListener('pointerdown', (ev) => { if (openMenu && !openMenu.contains(ev.target) && !ev.target.closest('.btn')) closeMenus(); });

  /* ---------- 툴바 이벤트 ---------- */
  $('btnAddSlide').onclick = (ev) => { ev.stopPropagation(); showLayoutMenu(); };
  $('btnAddSlide2').onclick = (ev) => { ev.stopPropagation(); showLayoutMenu($('btnAddSlide2')); };
  $('btnAddText').onclick = (ev) => { ev.stopPropagation(); btnMenu(ev.currentTarget, Object.entries(ROLE_NAMES).map(([id, n]) => ({ label: n, fn: () => addText(id) }))); };
  $('btnAddShape').onclick = (ev) => { ev.stopPropagation(); btnMenu(ev.currentTarget, SHAPES.map(s => ({ label: s.name, fn: () => addShape(s.id) }))); };
  $('btnAddImage').onclick = (ev) => {
    ev.stopPropagation();
    btnMenu(ev.currentTarget, [
      { label: '파일에서…', fn: () => $('fileImage').click() },
      { label: '이미지 라이브러리 (assets/)', fn: showAssetLibrary },
      { label: '주소(URL)로…', fn: async () => { const u = prompt('이미지 주소'); if (!u) return; try { const d = await imageSize(u); const r = Math.min(1, 1200 / d.w, 760 / d.h); addElement(imageEl(Math.round((SLIDE_W - d.w * r) / 2), Math.round((SLIDE_H - d.h * r) / 2), Math.round(d.w * r), Math.round(d.h * r), u)); } catch (e) { alert(e.message); } } },
    ]);
  };
  $('fileImage').onchange = async (ev) => { for (const f of ev.target.files) await insertImageFile(f); ev.target.value = ''; };
  $('fileReplace').onchange = async (ev) => { const f = ev.target.files[0]; if (f) await replaceImage(ev.target.dataset.id, f); ev.target.value = ''; };
  $('fileBg').onchange = async (ev) => {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try { const prep = await prepareImage(f); const src = await API.stage(prep.blob, prep.name); const s = curSlide(); s.bg = Object.assign({}, s.bg || {}, { image: src, fit: 'cover' }); delete s.bg.gradient; commit(); renderStage(); renderProps(); }
    catch (e) { alert('배경 이미지 실패: ' + e.message); }
  };
  async function showAssetLibrary() {
    const list = await API.assets();
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="min-width:560px"><h3>이미지 라이브러리 <span class="muted" style="font-weight:400;font-size:13px">assets/ 폴더 · ${list.length}개</span></h3>
      <div class="asset-grid">${list.map(a => `<div class="a" data-src="${esc(a.src)}" style="background-image:url('${esc(a.src)}')" title="${esc(a.name)}"><span>${esc(a.name)}</span></div>`).join('') || '<div class="muted">아직 업로드된 이미지가 없습니다.</div>'}</div>
      <div class="actions"><button class="btn" data-close>닫기</button></div></div>`;
    bg.onclick = async (ev) => {
      if (ev.target.dataset.close != null || ev.target === bg) { bg.remove(); return; }
      const a = ev.target.closest('.a'); if (!a) return; bg.remove();
      const d = await imageSize(a.dataset.src); const r = Math.min(1, 1200 / d.w, 760 / d.h);
      addElement(imageEl(Math.round((SLIDE_W - d.w * r) / 2), Math.round((SLIDE_H - d.h * r) / 2), Math.round(d.w * r), Math.round(d.h * r), a.dataset.src));
    };
    document.body.appendChild(bg);
  }
  document.querySelectorAll('#alignGroup .btn').forEach(b => b.onclick = () => alignSel(b.dataset.align));
  $('btnDup').onclick = duplicateSelected; $('btnDel').onclick = deleteSelected;
  $('btnUndo').onclick = undo; $('btnRedo').onclick = redo;
  $('btnSave').onclick = save;
  $('deckTitle').onchange = (ev) => { S.deck.title = ev.target.value.trim() || S.deck.title; ev.target.value = S.deck.title; document.title = S.deck.title + ' · 편집'; commit({ all: true }); };
  const themeSel = $('theme'); THEMES.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; themeSel.appendChild(o); });
  themeSel.onchange = () => setProp('deck.theme', themeSel.value, true);
  $('zoom').onchange = (ev) => { S.zoomMode = ev.target.value; layoutStage(); };
  $('btnPresent').onclick = () => present(false);
  $('btnPreview').onclick = () => { if (S.editing) endEdit(); Draft.put(S.name, S.deck); window.open(`present.html?deck=${encodeURIComponent(S.name)}&draft=1&start=${S.cur}`, '_blank'); };
  $('btnExport').onclick = (ev) => {
    ev.stopPropagation();
    btnMenu(ev.currentTarget, [
      { label: 'JSON 파일 다운로드', fn: () => download(S.name + '.json', JSON.stringify(S.deck, null, 1), 'application/json') },
      { label: '단독 HTML (어디서나 발표)', fn: exportHtml },
      { label: 'PDF / 인쇄용 보기', fn: async () => { await save(); window.open(`present.html?deck=${encodeURIComponent(S.name)}&print=1`, '_blank'); } },
    ]);
  };
  function download(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  async function exportHtml() {
    if (S.editing) endEdit();
    toast('HTML 만드는 중…', 5000);
    const deck = clone(S.deck);
    const toData = async (src) => { if (!src || src.startsWith('data:')) return src; try { const b = await (await fetch(API.resolveSrc(src))).blob(); return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); } catch (e) { return src; } };
    for (const s of deck.slides) { if (s.bg && s.bg.image) s.bg.image = await toData(s.bg.image); for (const e of s.elements) if (e.type === 'image' && e.src) e.src = await toData(e.src); }
    const [slideCss, uiCss, commonJs, presentJs] = await Promise.all(['app/slide.css', 'app/ui.css', 'app/common.js', 'app/present.js'].map(u => fetch(u).then(r => r.text())));
    const json = JSON.stringify(deck).replace(/<\/script/gi, '<\\/script');
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(deck.title)}</title><style>${slideCss}\n${uiCss}</style></head><body class="present"><script>window.EMBEDDED_DECK=${json};<\/script><script>${commonJs}<\/script><script>${presentJs}<\/script></body></html>`;
    download(S.name + '.html', html, 'text/html');
    toast('HTML 파일을 내려받았습니다');
  }

  /* ---------- 드래그 앤 드롭 / 붙여넣기 ---------- */
  main.addEventListener('dragover', (ev) => { if (ev.dataTransfer.types.includes('Files')) { ev.preventDefault(); main.classList.add('dragover'); } });
  main.addEventListener('dragleave', (ev) => { if (!main.contains(ev.relatedTarget)) main.classList.remove('dragover'); });
  main.addEventListener('drop', async (ev) => {
    main.classList.remove('dragover'); if (!ev.dataTransfer.files.length) return; ev.preventDefault();
    const r = overlay.getBoundingClientRect(); const at = { x: (ev.clientX - r.left) / S.k, y: (ev.clientY - r.top) / S.k };
    const ph = document.elementFromPoint(ev.clientX, ev.clientY); const slot = ph && ph.closest ? ph.closest('.el-image.img-empty') : null;
    let n = 0; for (const f of ev.dataTransfer.files) { await insertImageFile(f, { x: at.x + n * 40, y: at.y + n * 40, into: n === 0 && slot ? slot.dataset.id : null }); n++; }
  });
  document.addEventListener('paste', async (ev) => {
    const text = ev.clipboardData.getData('text/plain') || '';
    const items = Array.from(ev.clipboardData.items || []);
    const editingTable = S.editing && elById(S.editing) && elById(S.editing).type === 'table';
    const tableLike = /\t/.test(text) && text.trim().split(/\r?\n/).length > 1;
    const img = items.find(i => i.type.startsWith('image/'));
    if (img && !tableLike && !editingTable) { ev.preventDefault(); const f = img.getAsFile(); await insertImageFile(new File([f], 'clipboard-' + Date.now() + '.' + (f.type.split('/')[1] || 'png'), { type: f.type })); return; }
    if (S.editing) { // 서식 없는 텍스트로 붙여넣기
      ev.preventDefault(); if (text.startsWith(CLIP_TAG)) return;
      exec('insertHTML', esc(text).replace(/\r?\n/g, '<br>')); return;
    }
    if (isTyping()) return;
    ev.preventDefault();
    if (text.startsWith(CLIP_TAG)) { try { pasteData(JSON.parse(text.slice(CLIP_TAG.length))); } catch (e) { toast('붙여넣기 실패'); } return; }
    if (tableLike) { addTableFromText(text); return; }           // 엑셀·한글 표 → 표
    if (text.trim()) { addElement(textEl('text', 400, 400, 1120, 200, esc(text).replace(/\r?\n/g, '<br>'))); return; }
    if (S.clip) pasteData(S.clip);
  });

  /* ---------- 키보드 (PowerPoint 와 같은 배치) ---------- */
  function isTyping() { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable); }
  function present(fromStart) { save().then(() => window.open(`present.html?deck=${encodeURIComponent(S.name)}&start=${fromStart ? 0 : S.cur}`, '_blank')); }
  /* 글자 크기 단계 조절: 편집 중이면 그 상자, 아니면 선택한 텍스트 상자 전부 */
  function fontSizeStep(delta) {
    const els = (S.editing ? [elById(S.editing)] : selEls()).filter(e => e && TEXTY.includes(e.type)); if (!els.length) return;
    for (const e of els) { e.style = e.style || {}; const cur = resolveTextStyle(e, theme()).fontSize; e.style.fontSize = clamp(Math.round(cur + delta), 8, 400); if (e.type === 'chart') rerenderEl(e.id); else applyElementTextStyle(e, nodeOf(e.id), theme()); }
    if (S.editing) markDirty(); else commit();
    renderProps();
  }
  function setAlign(a) {
    if (S.editing) { exec(a === 'left' ? 'justifyLeft' : a === 'center' ? 'justifyCenter' : a === 'right' ? 'justifyRight' : 'justifyFull'); return; }
    const els = selEls().filter(e => TEXTY.includes(e.type) && e.type !== 'chart'); if (!els.length) return;
    for (const e of els) { e.style = e.style || {}; e.style.align = a === 'justify' ? 'left' : a; }
    commit(); renderStage(); renderProps();
  }
  /* 서식 복사 / 붙여넣기 (Ctrl+Shift+C / V) */
  let styleClip = null;
  function copyStyle() { const e = S.editing ? elById(S.editing) : selEls()[0]; if (!e) return; styleClip = { type: e.type, style: clone(e.style || {}), role: e.role, fill: e.fill, stroke: e.stroke, strokeWidth: e.strokeWidth, radius: e.radius, shadow: e.shadow, border: e.border, borderColor: e.borderColor }; toast('서식 복사'); }
  function pasteStyle() {
    if (!styleClip) { toast('먼저 Ctrl+Shift+C 로 서식을 복사하세요'); return; }
    const els = selEls(); if (!els.length) return;
    for (const e of els) {
      if (e.type === 'text' && styleClip.type === 'text') { e.style = clone(styleClip.style); if (styleClip.role) e.role = styleClip.role; }
      else if (e.type === 'shape' && styleClip.type === 'shape') { for (const k of ['fill', 'stroke', 'strokeWidth', 'radius', 'shadow']) if (styleClip[k] !== undefined) e[k] = styleClip[k]; }
      else if (e.type === 'image' && styleClip.type === 'image') { for (const k of ['radius', 'shadow', 'border', 'borderColor']) if (styleClip[k] !== undefined) e[k] = styleClip[k]; }
    }
    commit(); renderStage(); renderProps(); toast('서식 붙여넣기');
  }
  /* Tab / Shift+Tab: 슬라이드 안의 요소를 차례로 선택 */
  function cycleSelection(dir) {
    const arr = curSlide().elements; if (!arr.length) return;
    let i = S.sel.length ? arr.findIndex(e => e.id === S.sel[S.sel.length - 1]) : (dir > 0 ? -1 : arr.length);
    i = (i + dir + arr.length) % arr.length;
    S.sel = [arr[i].id]; markSelection(); renderOverlay(); renderProps();
  }
  function selectAll() { S.sel = curSlide().elements.filter(e => !e.locked).map(e => e.id); markSelection(); renderOverlay(); renderProps(); }
  function clearSelection() { closeMenus(); S.sel = []; markSelection(); renderOverlay(); renderProps(); }

  document.addEventListener('keydown', (ev) => {
    const ctrl = ev.ctrlKey || ev.metaKey, shift = ev.shiftKey, alt = ev.altKey;
    const key = ev.key, low = key.length === 1 ? key.toLowerCase() : key;
    const stop = () => ev.preventDefault();

    /* --- 어디서나 --- */
    if (ctrl && low === 's') { stop(); save(); return; }
    if (ctrl && !shift && low === 'f') { stop(); showFind(false); return; }
    if (ctrl && !shift && low === 'h') { stop(); showFind(true); return; }            // Ctrl+H 바꾸기 (PPT)
    if (alt && key === 'F10') { stop(); toggleLayers(); return; }                      // Alt+F10 선택 창 (PPT)
    if (key === 'F5') { stop(); present(!shift); return; }            // F5 처음부터 · Shift+F5 현재 슬라이드부터
    if (key === 'F1' || (ctrl && key === '/')) { stop(); showShortcutHelp(); return; }
    if (ctrl && low === 'p') { stop(); save().then(() => window.open(`present.html?deck=${encodeURIComponent(S.name)}&print=1`, '_blank')); return; }
    if (ctrl && low === 'm') { stop(); addSlide('content'); return; } // Ctrl+M 새 슬라이드 (PPT)
    if (ctrl && key === 'Enter') { stop(); addSlide('content'); return; }

    /* --- 글 편집 중 --- */
    if (S.editing) {
      if (key === 'Escape') { stop(); endEdit(); return; }
      if (key === 'F2') { stop(); endEdit(); return; }
      if (key === 'Tab') { stop(); if (elById(S.editing) && elById(S.editing).type === 'table') tableTab(shift); else exec(shift ? 'outdent' : 'indent'); return; }
      if (ctrl && (key === ']' || key === '}' || (shift && key === '>'))) { stop(); fontSizeStep(4); return; }
      if (ctrl && (key === '[' || key === '{' || (shift && key === '<'))) { stop(); fontSizeStep(-4); return; }
      if (ctrl && !shift && low === 'e') { stop(); setAlign('center'); return; }
      if (ctrl && !shift && low === 'l') { stop(); setAlign('left'); return; }
      if (ctrl && !shift && low === 'r') { stop(); setAlign('right'); return; }
      if (ctrl && !shift && low === 'j') { stop(); setAlign('justify'); return; }
      if (ctrl && low === 'k') { stop(); const u = prompt('링크 주소'); if (u) exec('createLink', u); return; }
      if (ctrl && key === '=' && !shift) { stop(); exec('subscript'); return; }
      if (ctrl && (key === '+' || (shift && key === '='))) { stop(); exec('superscript'); return; }
      if (ctrl && shift && low === 'c') { stop(); copyStyle(); return; }
      if (ctrl && key === ' ') { stop(); exec('removeFormat'); return; }      // Ctrl+Space 서식 지우기 (PPT)
      if (ctrl && shift && low === 'l') { stop(); exec('insertUnorderedList'); return; }
      if (ctrl && shift && low === 'h') { stop(); exec('hiliteColor', '#fde68a'); return; }
      return; // 나머지(Ctrl+B/I/U, Ctrl+Z 등)는 브라우저 기본 동작
    }
    if (isTyping()) { if (key === 'Escape') document.activeElement.blur(); return; }

    /* --- 편집 (슬라이드/요소) --- */
    if (ctrl && low === 'z') { stop(); shift ? redo() : undo(); return; }
    if (ctrl && low === 'y') { stop(); redo(); return; }
    if (ctrl && shift && low === 'd') { stop(); duplicateSlide(); return; }
    if (ctrl && low === 'd') { stop(); duplicateSelected(); return; }
    if (ctrl && shift && low === 'c') { stop(); copyStyle(); return; }
    if (ctrl && shift && low === 'v') { stop(); pasteStyle(); return; }
    if (ctrl && (low === 'c' || low === 'x' || low === 'v')) return; // copy / cut / paste 이벤트에서 처리
    if (ctrl && low === 'a') { stop(); selectAll(); return; }
    if (ctrl && shift && low === 'g') { stop(); ungroupSel(); return; }               // Ctrl+Shift+G 그룹 해제
    if (ctrl && low === 'g') { stop(); groupSel(); return; }                           // Ctrl+G 그룹
    if (ctrl && (key === ']' || key === '}')) { stop(); if (shift) zOrder('front'); else if (S.sel.length && selEls().every(e => TEXTY.includes(e.type))) fontSizeStep(4); else zOrder('up'); return; }
    if (ctrl && (key === '[' || key === '{')) { stop(); if (shift) zOrder('back'); else if (S.sel.length && selEls().every(e => TEXTY.includes(e.type))) fontSizeStep(-4); else zOrder('down'); return; }
    if (ctrl && shift && (key === '>' || key === '.')) { stop(); fontSizeStep(4); return; }
    if (ctrl && shift && (key === '<' || key === ',')) { stop(); fontSizeStep(-4); return; }
    if (ctrl && !shift && low === 'e') { stop(); setAlign('center'); return; }
    if (ctrl && !shift && low === 'l') { stop(); setAlign('left'); return; }
    if (ctrl && !shift && low === 'r') { stop(); setAlign('right'); return; }
    if (ctrl && !shift && low === 'j') { stop(); setAlign('justify'); return; }
    if (ctrl && low === 'b') { stop(); for (const e of selEls().filter(x => TEXTY.includes(x.type))) { e.style = e.style || {}; e.style.bold = !resolveTextStyle(e, theme()).bold; } commit(); renderStage(); renderProps(); return; }
    if (ctrl && low === 'i') { stop(); for (const e of selEls().filter(x => TEXTY.includes(x.type))) { e.style = e.style || {}; e.style.italic = !resolveTextStyle(e, theme()).italic; } commit(); renderStage(); renderProps(); return; }
    if (ctrl && shift && (key === 'PageUp' || key === 'ArrowUp')) { stop(); moveSlide(-1); return; }
    if (ctrl && shift && (key === 'PageDown' || key === 'ArrowDown')) { stop(); moveSlide(1); return; }
    if (ctrl && key === 'Home') { stop(); gotoSlide(0); return; }
    if (ctrl && key === 'End') { stop(); gotoSlide(S.deck.slides.length - 1); return; }
    if (ctrl && key === 'Delete') { stop(); if (confirm('이 슬라이드를 삭제할까요?')) deleteSlide(); return; }
    if (key === 'Delete' || key === 'Backspace') { if (S.sel.length) { stop(); deleteSelected(); } return; }
    if (key === 'Escape') { clearSelection(); return; }
    if (key === 'Tab') { stop(); cycleSelection(shift ? -1 : 1); return; }
    if ((key === 'Enter' || key === 'F2') && S.sel.length === 1) { const e = elById(S.sel[0]); if (editable(e)) { stop(); startEdit(e.id, null, key === 'F2'); } else if (e && e.type === 'math') { stop(); openMathDialog(e); } return; }
    if (key === 'PageDown') { stop(); gotoSlide(S.cur + 1); return; }
    if (key === 'PageUp') { stop(); gotoSlide(S.cur - 1); return; }
    if (key === 'Home' && !S.sel.length) { stop(); gotoSlide(0); return; }
    if (key === 'End' && !S.sel.length) { stop(); gotoSlide(S.deck.slides.length - 1); return; }
    if (key.startsWith('Arrow')) {
      if (!S.sel.length) { if (key === 'ArrowDown' || key === 'ArrowRight') gotoSlide(S.cur + 1); if (key === 'ArrowUp' || key === 'ArrowLeft') gotoSlide(S.cur - 1); return; }
      stop(); const d = ctrl ? 1 : shift ? 50 : 10;   // 화살표 10px · Ctrl 1px(미세) · Shift 50px
      nudge(key === 'ArrowLeft' ? -d : key === 'ArrowRight' ? d : 0, key === 'ArrowUp' ? -d : key === 'ArrowDown' ? d : 0);
    }
  });

  /* ---------- 단축키 도움말 (F1) ---------- */
  function showShortcutHelp() {
    if (document.getElementById('kbHelp')) return;
    const rows = (list) => list.map(r => `<div><span>${r[0]}</span><span>${r[1]}</span></div>`).join('');
    const k = (s) => s.split(' ').map(x => `<kbd>${x}</kbd>`).join(' ');
    const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'kbHelp';
    bg.innerHTML = `<div class="modal kb-help"><h3>편집 단축키 <span class="muted" style="font-weight:400;font-size:13px">PowerPoint 와 같은 배치 · 전체 설명서는 <a href="shortcuts.html" target="_blank">shortcuts.html</a></span></h3>
      <div class="kb-cols">
        <div><h4>파일 · 발표</h4>${rows([['저장', k('Ctrl+S')], ['발표 (처음부터)', k('F5')], ['발표 (현재 슬라이드부터)', k('Shift+F5')], ['인쇄 / PDF 보기', k('Ctrl+P')], ['이 도움말', k('F1') + ' ' + k('Ctrl+/')]])}
        <h4>슬라이드</h4>${rows([['새 슬라이드', k('Ctrl+M') + ' ' + k('Ctrl+Enter')], ['슬라이드 복제', k('Ctrl+Shift+D')], ['슬라이드 삭제', k('Ctrl+Delete')], ['이전 / 다음 슬라이드', k('PgUp') + ' / ' + k('PgDn')], ['처음 / 끝 슬라이드', k('Ctrl+Home') + ' / ' + k('Ctrl+End')], ['슬라이드 순서 위 / 아래', k('Ctrl+Shift+↑') + ' / ' + k('Ctrl+Shift+↓')]])}
        <h4>선택 · 이동</h4>${rows([['다음 / 이전 요소 선택', k('Tab') + ' / ' + k('Shift+Tab')], ['모두 선택', k('Ctrl+A')], ['여러 개 선택', k('Shift') + '+클릭 · 드래그'], ['선택 해제', k('Esc')], ['이동 10px / 1px / 50px', k('←↑↓→') + ' / ' + k('Ctrl+') + ' / ' + k('Shift+')], ['비율 유지 크기 조절', k('Shift') + '+모서리 드래그 (이미지는 기본)'], ['스냅 끄고 드래그', k('Alt') + '+드래그'], ['묶기 / 풀기', k('Ctrl+G') + ' / ' + k('Ctrl+Shift+G')], ['묶음 안 하나만 선택', k('Alt') + '+클릭'], ['개체 목록 (선택 창)', k('Alt+F10')]])}
        <h4>찾기</h4>${rows([['찾기', k('Ctrl+F')], ['바꾸기', k('Ctrl+H')]])}</div>
        <div><h4>요소</h4>${rows([['복제', k('Ctrl+D')], ['복사 / 잘라내기 / 붙여넣기', k('Ctrl+C') + ' ' + k('Ctrl+X') + ' ' + k('Ctrl+V')], ['서식 복사 / 붙여넣기', k('Ctrl+Shift+C') + ' / ' + k('Ctrl+Shift+V')], ['삭제', k('Delete')], ['앞으로 / 뒤로', k('Ctrl+]') + ' / ' + k('Ctrl+[')], ['맨 앞 / 맨 뒤', k('Ctrl+Shift+]') + ' / ' + k('Ctrl+Shift+[')], ['실행 취소 / 다시 실행', k('Ctrl+Z') + ' / ' + k('Ctrl+Y')]])}
        <h4>글 편집</h4>${rows([['편집 시작 / 끝', k('Enter') + ' ' + k('F2') + ' 더블클릭 / ' + k('Esc')], ['굵게 / 기울임 / 밑줄', k('Ctrl+B') + ' ' + k('Ctrl+I') + ' ' + k('Ctrl+U')], ['왼쪽 / 가운데 / 오른쪽 정렬', k('Ctrl+L') + ' ' + k('Ctrl+E') + ' ' + k('Ctrl+R')], ['글자 크게 / 작게', k('Ctrl+]') + ' / ' + k('Ctrl+[') + ' (' + k('Ctrl+Shift+>') + ' / ' + k('Ctrl+Shift+<') + ')'], ['들여쓰기 / 내어쓰기', k('Tab') + ' / ' + k('Shift+Tab')], ['글머리 기호', k('Ctrl+Shift+L')], ['형광펜', k('Ctrl+Shift+H')], ['링크', k('Ctrl+K')], ['서식 지우기', k('Ctrl+Space')], ['아래 첨자 / 위 첨자', k('Ctrl+=') + ' / ' + k('Ctrl+Shift+=')], ['표: 다음 칸 / 이전 칸', k('Tab') + ' / ' + k('Shift+Tab')]])}</div>
      </div>
      <div class="actions"><span class="muted" style="font-size:12px;flex:1">발표 화면 단축키는 발표 중 <kbd>?</kbd> 또는 <kbd>F1</kbd></span><button class="btn primary" id="kbClose">닫기</button></div></div>`;
    document.body.appendChild(bg);
    const close = () => bg.remove();
    bg.onclick = (ev) => { if (ev.target === bg) close(); };
    bg.querySelector('#kbClose').onclick = close;
    const onKey = (ev) => { if (ev.key === 'Escape' || ev.key === 'F1') { ev.preventDefault(); ev.stopPropagation(); close(); document.removeEventListener('keydown', onKey, true); } };
    document.addEventListener('keydown', onKey, true);
  }
  $('btnHelp').onclick = showShortcutHelp;
  window.addEventListener('resize', layoutStage);
  new ResizeObserver(layoutStage).observe(stage);

  /* ======================= 추가 기능 ======================= */
  function bboxOf(els) {
    const L = Math.min(...els.map(e => e.x)), T = Math.min(...els.map(e => e.y)), R = Math.max(...els.map(e => e.x + e.w)), B = Math.max(...els.map(e => e.y + e.h));
    return { x: L, y: T, w: R - L, h: B - T };
  }
  function centerBox(w, h) { return [Math.round((SLIDE_W - w) / 2), Math.round((SLIDE_H - h) / 2)]; }

  /* ---- 묶기 (그룹) ---- */
  function groupOf(id) { const e = elById(id); if (!e || !e.group) return [id]; return curSlide().elements.filter(x => x.group === e.group).map(x => x.id); }
  function expandGroups(ids) { const out = new Set(); ids.forEach(id => groupOf(id).forEach(x => out.add(x))); return Array.from(out); }
  function groupSel() {
    const els = selEls(); if (els.length < 2) { toast('두 개 이상 선택한 뒤 묶으세요 (Shift+클릭 또는 드래그)'); return; }
    const g = 'g' + uid(); els.forEach(e => e.group = g);
    commit(); markSelection(); renderOverlay(); renderProps(); toast('묶었습니다 · 풀기는 Ctrl+Shift+G');
  }
  function ungroupSel() {
    const els = selEls(); if (!els.some(e => e.group)) { toast('묶음이 아닙니다'); return; }
    els.forEach(e => delete e.group); commit(); markSelection(); renderOverlay(); renderProps(); toast('묶음을 풀었습니다');
  }
  /* 여러 개를 함께 크기 조절 (모서리 손잡이) — 글자 크기도 같은 비율로 */
  function startGroupResize(ev, h) {
    const els = selEls().filter(e => !e.locked); if (!els.length) return;
    const b = bboxOf(els), corner = h.slice(1);
    const orig = els.map(e => ({ e, x: e.x, y: e.y, w: e.w, h: e.h, fs: TEXTY.includes(e.type) ? resolveTextStyle(e, theme()).fontSize : 0 }));
    const ax = corner.includes('w') ? b.x + b.w : b.x, ay = corner.includes('n') ? b.y + b.h : b.y;
    const sx = ev.clientX, sy = ev.clientY; let moved = false;
    track((m) => {
      const dx = (m.clientX - sx) / S.k, dy = (m.clientY - sy) / S.k;
      const nw = b.w + (corner.includes('w') ? -dx : dx), nh = b.h + (corner.includes('n') ? -dy : dy);
      const k = Math.max(0.05, Math.max(nw / b.w, nh / b.h)); moved = true;
      for (const o of orig) {
        o.e.x = Math.round(ax + (o.x - ax) * k); o.e.y = Math.round(ay + (o.y - ay) * k);
        o.e.w = Math.max(8, Math.round(o.w * k)); o.e.h = Math.max(8, Math.round(o.h * k));
        if (o.fs) { o.e.style = o.e.style || {}; o.e.style.fontSize = Math.max(6, Math.round(o.fs * k)); }
      }
      renderStage();
    }, () => { if (moved) { commit(); renderProps(); } });
  }

  /* ---- 복사 / 붙여넣기 (다른 교안·다른 탭에도 됨) ---- */
  const CLIP_TAG = 'GYOAN-CLIP:';
  function freshCopies(els, dx, dy, keepMk) {
    const gmap = {};
    return els.map(e => {
      const c = clone(e); if (keepMk) c.mk = e.mk || e.id; else delete c.mk;
      c.id = uid(); c.x += dx; c.y += dy;
      if (c.group) c.group = gmap[c.group] || (gmap[c.group] = 'g' + uid());
      return c;
    });
  }
  function clipData(kind) { return kind === 'els' ? { kind, items: clone(selEls()) } : { kind: 'slides', items: [clone(curSlide())] }; }
  function pasteData(data) {
    if (!data || !data.items || !data.items.length) return;
    if (S.editing) endEdit();
    if (data.kind === 'slides') {
      const ss = data.items.map(s => { const c = clone(s); c.id = uid(); c.elements.forEach(e => { e.mk = e.mk || e.id; e.id = uid(); }); return c; });
      S.deck.slides.splice(S.cur + 1, 0, ...ss); S.cur += 1; S.sel = [];
      commit({ all: true }); renderStage(); renderProps(); updateTop(); toast(`슬라이드 ${ss.length}장 붙여넣기`); return;
    }
    const here = new Set(curSlide().elements.map(e => e.mk || e.id));
    const off = data.items.some(e => here.has(e.mk || e.id)) ? 30 : 0; // 다른 슬라이드면 같은 자리에 (모핑용)
    const copies = freshCopies(data.items, off, off, true);
    curSlide().elements.push(...copies); S.sel = copies.map(c => c.id);
    commit(); renderStage(); renderProps();
  }
  document.addEventListener('copy', (ev) => {
    if (isTyping() || S.editing) return;
    const data = clipData(S.sel.length ? 'els' : 'slides'); S.clip = data;
    ev.clipboardData.setData('text/plain', CLIP_TAG + JSON.stringify(data)); ev.preventDefault();
    toast(data.kind === 'els' ? `${data.items.length}개 복사 · 다른 슬라이드·교안에도 붙여넣을 수 있습니다` : '슬라이드 복사 · 다른 교안에도 붙여넣을 수 있습니다');
  });
  document.addEventListener('cut', (ev) => {
    if (isTyping() || S.editing || !S.sel.length) return;
    const data = clipData('els'); S.clip = data;
    ev.clipboardData.setData('text/plain', CLIP_TAG + JSON.stringify(data)); ev.preventDefault(); deleteSelected();
  });
  function copyCmd() { if (!document.execCommand('copy')) { S.clip = clipData(S.sel.length ? 'els' : 'slides'); toast('복사했습니다'); } }

  /* ---- 표 ---- */
  function addTable(r, c) {
    const w = Math.min(1680, c * 320), h = Math.min(820, r * 92);
    const rows = Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => i === 0 ? `제목 ${j + 1}` : ''));
    const [x, y] = centerBox(w, h); addElement(tableEl(x, y, w, h, rows));
  }
  function addTableFromText(text) {
    let rows = text.replace(/\r/g, '').replace(/\n+$/, '').split('\n').map(l => l.split('\t').map(c => esc(c.trim())));
    const nc = Math.max(...rows.map(r => r.length)); rows = rows.map(r => r.concat(Array(nc - r.length).fill('')));
    const w = Math.min(1680, nc * 300), h = Math.min(860, rows.length * 80);
    const [x, y] = centerBox(w, h); addElement(tableEl(x, y, w, h, rows)); toast('붙여넣은 표를 만들었습니다');
  }
  function tableOp(op) {
    const e = elById(S.sel[0]); if (!e || e.type !== 'table') return;
    const cell = S.cell; if (S.editing) endEdit();
    const rows = e.rows; const nc = rows[0] ? rows[0].length : 1;
    const ci = cell ? clamp(cell.c, 0, nc - 1) : nc - 1, ri = cell ? clamp(cell.r, 0, rows.length - 1) : rows.length - 1;
    if (op === 'rowAdd') { rows.splice(ri + 1, 0, Array(nc).fill('')); e.h += Math.round(e.h / (rows.length - 1)); }
    if (op === 'rowDel') { if (rows.length <= 1) return; rows.splice(ri, 1); e.h = Math.max(40, e.h - Math.round(e.h / (rows.length + 1))); }
    if (op === 'colAdd') rows.forEach(r => r.splice(ci + 1, 0, ''));
    if (op === 'colDel') { if (nc <= 1) return; rows.forEach(r => r.splice(ci, 1)); }
    S.cell = null; commit(); rerenderEl(e.id); renderOverlay(); renderProps();
  }
  function tablePicker(btn) {
    closeMenus();
    const m = document.createElement('div'); m.className = 'menu tpick';
    m.innerHTML = `<div class="tp-label">표 크기를 고르세요</div><div class="tp-grid">${Array.from({ length: 8 * 10 }, (_, i) => `<div data-r="${Math.floor(i / 10) + 1}" data-c="${i % 10 + 1}"></div>`).join('')}</div><div class="tp-label">엑셀에서 복사한 표는 Ctrl+V 로 바로 붙여넣기</div>`;
    const lab = m.querySelector('.tp-label');
    m.addEventListener('mouseover', (ev) => { const d = ev.target.closest('[data-r]'); if (!d) return; const r = +d.dataset.r, c = +d.dataset.c; m.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', +x.dataset.r <= r && +x.dataset.c <= c)); lab.textContent = `${r}행 × ${c}열 표`; });
    m.addEventListener('click', (ev) => { const d = ev.target.closest('[data-r]'); if (!d) return; closeMenus(); addTable(+d.dataset.r, +d.dataset.c); });
    document.body.appendChild(m); openMenu = m;
    const r = btn.getBoundingClientRect(); m.style.left = r.left + 'px'; m.style.top = (r.bottom + 6) + 'px';
  }
  /* 표 편집 중 Tab: 다음 칸 · 마지막 칸이면 줄 추가 */
  function tableTab(back) {
    const node = nodeOf(S.editing); if (!node) return;
    const cur = document.activeElement && document.activeElement.closest ? document.activeElement.closest('th,td') : null;
    let cells = Array.from(node.querySelectorAll('th,td'));
    let j = cells.indexOf(cur) + (back ? -1 : 1);
    if (j >= cells.length) {
      const last = node.querySelector('tr:last-child'); const tr = document.createElement('tr'); const r = node.querySelectorAll('tr').length;
      Array.from(last.children).forEach((_, ci) => { const td = document.createElement('td'); td.dataset.r = r; td.dataset.c = ci; td.contentEditable = 'true'; td.addEventListener('blur', onEditBlur); td.addEventListener('focus', onCellFocus); tr.appendChild(td); });
      last.parentNode.appendChild(tr);
      const e = elById(S.editing); e.h += Math.round(e.h / r); node.style.height = e.h + 'px'; renderOverlay();
      cells = Array.from(node.querySelectorAll('th,td'));
    }
    const t = cells[clamp(j, 0, cells.length - 1)]; t.focus();
    const rg = document.createRange(); rg.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
  }

  /* ---- 차트 ---- */
  const CHART_SAMPLES = {
    pie: '항목,비율\n가,40\n나,30\n다,20\n라,10', donut: '항목,비율\n완료,72\n진행 중,18\n대기,10',
    line: '월,2024년,2025년\n1월,30,42\n2월,45,51\n3월,38,60\n4월,52,66\n5월,61,74', area: '월,방문자\n1월,120\n2월,180\n3월,160\n4월,240\n5월,310',
    stack: '구분,A,B,C\n1분기,20,15,10\n2분기,25,18,12\n3분기,30,22,15\n4분기,28,26,20', hbar: '항목,점수\n안전성,88\n경제성,72\n편의성,65\n확장성,54',
  };
  function addChart(kind) { const [x, y] = centerBox(1200, 700); addElement(chartEl(x, y, 1200, 700, kind, CHART_SAMPLES[kind])); }

  /* ---- 아이콘 · 기호 ---- */
  const ICONS = {
    '자주 쓰는': '✅❌⭕❗❓💡📌📍🎯⭐🔥⚠️🚫✔️➡️⬅️⬆️⬇️🔄➕➖✖️➗💯🏆🔑🔒🔓📢🔔⏰⌛📅🗓️',
    '교육 · 학습': '📚📖📝✏️🖊️📏📐📊📈📉🗂️📁📋📎🔍🔬🔭🧪🧫🧬⚗️🧮💻🖥️⌨️🖱️📱🎓🏫👩‍🏫👨‍🏫🧑‍🎓🙋💬🗨️🧠',
    '안전 · 소방': '🚒🧯🔥🚨🚑🚓⛑️🦺🪜💧🌊🚰🚿🏭🏢🏠🏗️⚡🔌🔋☢️☣️🛑🚧⛔🆘📞☎️🧰🔧🔨🪛⚙️🧲',
    '사람 · 감정': '😀😊🙂😉😎🤔😮😢😡👍👎👏🙌🤝👋✋👉👈👆👇💪🙏👀👥👤👨‍💼👩‍💼🧑‍🔧🧑‍🚒👨‍⚕️👩‍⚕️',
    '자연 · 사물': '🌍🌏☀️🌤️⛅🌧️⛈️❄️🌡️🌱🌳🍀🌸🍎☕🚗🚌🚆✈️🚀⛵🏔️🗺️🧭💰💳🎁📦🛒🏥🏛️⚖️',
    '기호': '①②③④⑤⑥⑦⑧⑨⑩●○◎■□▲△▼▽◆◇★☆→←↑↓↔⇒⇔✓✗※∑√∞≈≠≤≥±×÷°℃㎡㎥㎏㎞㎜ΔΩπμσλθ',
  };
  const SYMBOLS = Array.from('①②③④⑤⑥⑦⑧⑨⑩●○■□▲△▶◆★☆✓✗→←↑↓⇒⇔※∑√∞≈≠≤≥±×÷°℃㎡㎥㎏㎞㎜ΔΩπμσθλ²³½·…“”「」');
  const graphemes = (s) => (window.Intl && Intl.Segmenter) ? Array.from(new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(s), x => x.segment) : Array.from(s);
  function showIconPicker() {
    if (S.editing) endEdit();
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal icon-modal"><h3>아이콘 · 기호 <span class="muted" style="font-weight:400;font-size:13px">누르면 슬라이드 가운데에 들어갑니다 · 크기는 글자 크기(Ctrl+] / Ctrl+[)로</span></h3>
      ${Object.entries(ICONS).map(([k, v]) => `<h4>${k}</h4><div class="icon-grid">${graphemes(v).filter(c => c.trim()).map(c => `<button class="ic" data-ic="${esc(c)}">${esc(c)}</button>`).join('')}</div>`).join('')}
      <div class="actions"><span class="muted" style="flex:1;font-size:12px">글을 쓰는 중에는 글 상자 위 도구의 Ω 버튼으로 기호를 넣을 수 있습니다</span><button class="btn" data-close>닫기</button></div></div>`;
    bg.onclick = (ev) => {
      if (ev.target === bg || ev.target.dataset.close != null) { bg.remove(); return; }
      const b = ev.target.closest('[data-ic]'); if (!b) return; bg.remove();
      const [x, y] = centerBox(220, 220);
      addElement(textEl('text', x, y, 220, 220, esc(b.dataset.ic), { style: { fontSize: 150, align: 'center', valign: 'middle', lineHeight: 1 } }));
    };
    document.body.appendChild(bg);
  }

  /* ---- 수식 ---- */
  const MATH_EX = [['분수', '\\frac{a}{b}'], ['제곱근', '\\sqrt{x^2 + y^2}'], ['첨자', 'x_{i}^{2}'], ['합 Σ', '\\sum_{i=1}^{n} x_i'], ['적분', '\\int_{a}^{b} f(x)\\,dx'], ['극한', '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1'],
    ['행렬', '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'], ['연립', '\\begin{cases} x + y = 3 \\\\ x - y = 1 \\end{cases}'], ['근의 공식', 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}'],
    ['유량 Q=AV', 'Q = A \\cdot V'], ['베르누이', '\\frac{p}{\\rho g} + \\frac{v^2}{2g} + z = \\text{일정}'], ['하젠-윌리엄스', 'Q = 0.2785\\, C\\, D^{2.63}\\, S^{0.54}'], ['방수량', 'Q = 0.653\\, D^2 \\sqrt{P}'], ['단위', '1\\,\\text{m}^3/\\text{min} = 16.7\\,\\text{L/s}']];
  function openMathDialog(e) {
    if (S.editing) endEdit();
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal math-modal"><h3>수식 <span class="muted" style="font-weight:400;font-size:13px">LaTeX 문법 · 아래 예제를 눌러 시작하세요</span></h3>
      <div class="math-ex">${MATH_EX.map((x, i) => `<button class="btn sm" data-ex="${i}">${esc(x[0])}</button>`).join('')}</div>
      <div class="math-pv" id="mPv">…</div>
      <textarea id="mTex" class="mono" spellcheck="false" placeholder="예: Q = A \\cdot V">${esc(e ? e.tex : '')}</textarea>
      <div class="actions"><span class="muted" style="flex:1;font-size:12px">^ 위첨자 · _ 아래첨자 · \\frac{}{} 분수 · \\sqrt{} 루트 · \\cdot 곱하기점 · \\times ×</span><button class="btn" data-close>취소</button><button class="btn primary" id="mOk">${e ? '바꾸기' : '넣기'}</button></div></div>`;
    document.body.appendChild(bg);
    const ta = bg.querySelector('#mTex'), pv = bg.querySelector('#mPv');
    const draw = () => { if (!window.katex) { pv.textContent = '수식 도구를 불러오는 중…'; return; } try { pv.innerHTML = katex.renderToString(ta.value || '\\text{수식을 입력하세요}', { displayMode: true, throwOnError: false }); } catch (err) { pv.textContent = err.message; } };
    loadKatex().then(draw, (err) => { pv.textContent = err.message; });
    ta.addEventListener('input', draw);
    bg.addEventListener('click', (ev) => {
      if (ev.target === bg || ev.target.dataset.close != null) { bg.remove(); return; }
      const ex = ev.target.closest('[data-ex]'); if (ex) { ta.value = MATH_EX[+ex.dataset.ex][1]; draw(); ta.focus(); return; }
      if (ev.target.id === 'mOk') {
        const tex = ta.value.trim(); bg.remove(); if (!tex) return;
        if (e) { e.tex = tex; commit(); rerenderEl(e.id); renderProps(); }
        else { const [x, y] = centerBox(1200, 240); addElement(mathEl(x, y, 1200, 240, tex)); }
      }
    });
    ta.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) bg.querySelector('#mOk').click(); if (ev.key === 'Escape') bg.remove(); });
    setTimeout(() => ta.focus(), 30);
  }

  /* ---- 동영상 · 웹 ---- */
  function openEmbedDialog(e) {
    if (S.editing) endEdit();
    const u = prompt('동영상 또는 웹 페이지 주소를 붙여넣으세요\n· YouTube 링크 (예: https://youtu.be/…  ·  ?t=90 이면 1분 30초부터)\n· mp4 파일 주소 또는 assets/파일이름.mp4\n· 웹 페이지 주소 (일부 사이트는 표시를 막아 둡니다)', e ? e.url : '');
    if (u == null) return; const url = u.trim(); if (!url) return;
    if (parseEmbed(url).kind === 'none') { alert('주소를 알아볼 수 없습니다. http 로 시작하는 주소나 .mp4 파일을 넣어 주세요.'); return; }
    if (e) { e.url = url; commit(); rerenderEl(e.id); renderProps(); return; }
    const [x, y] = centerBox(1280, 720); addElement(embedEl(x, y, 1280, 720, url));
  }

  /* ---- 글자 크기 자동 맞춤 ---- */
  function autofit(e) {
    const node = nodeOf(e.id); if (!node || e.type !== 'text') return;
    const inner = node.querySelector('.el-text-inner'); const cs = getComputedStyle(node);
    const room = () => node.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const fits = () => inner.scrollHeight <= room() + 1 && inner.scrollWidth <= inner.clientWidth + 1;
    e.style = e.style || {};
    const cur = resolveTextStyle(e, theme()).fontSize, base = textDefaults(e.role, theme()).fontSize;
    let lo = 8, hi = Math.max(cur, Math.round(base * 1.5)) + 1; // 넘치면 줄이고, 남으면 기본 크기의 1.5배까지만 키움
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; e.style.fontSize = mid; applyTextNodeStyle(e, node, theme()); if (fits()) lo = mid; else hi = mid; }
    e.style.fontSize = lo; commit(); rerenderEl(e.id); renderProps(); toast(lo < cur ? `넘치는 글을 ${lo}px 로 줄였습니다` : lo > cur ? `상자에 맞춰 ${lo}px 로 키웠습니다` : '이미 상자에 잘 맞습니다');
  }

  /* ---- 디자인 (테마 · 색 · 글꼴 · 장식 · 꼬리말) ---- */
  function showDesign() {
    if (S.editing) endEdit();
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    const fontOpts = [['', '테마 기본']].concat(FONTS.map(f => [f.id, f.name]));
    const sel = (k, v, opts) => `<select data-dk="${k}">${opts.map(o => `<option value="${o[0]}" ${o[0] === v ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    const draw = () => {
      const d = S.deck, t = theme(), ft = d.footer || {};
      bg.innerHTML = `<div class="modal design-modal"><h3>🎨 디자인 <span class="muted" style="font-weight:400;font-size:13px">교안 전체에 바로 적용됩니다 · Ctrl+Z 로 되돌리기</span></h3>
        <h4>테마</h4><div class="theme-grid">${THEMES.map(x => `<div class="theme-card ${x.id === d.theme ? 'on' : ''}" data-theme="${x.id}"><div class="pv"></div><span>${esc(x.name)}</span></div>`).join('')}</div>
        <div class="design-cols">
          <div><h4>색 직접 지정</h4>${THEME_COLOR_KEYS.map(([k, n]) => `<label class="drow"><span>${n}</span><input type="color" data-color="${k}" value="${toHex(t[k])}">${d.colors && d.colors[k] ? '<em>바꿈</em>' : ''}</label>`).join('')}
            <button class="btn sm" data-reset="1">테마 색으로 되돌리기</button></div>
          <div><h4>글꼴</h4>
            <label class="drow"><span>제목</span>${sel('titleFont', d.titleFont || '', fontOpts)}</label>
            <label class="drow"><span>본문</span>${sel('bodyFont', d.bodyFont || '', fontOpts)}</label>
            <div class="font-pv" style="font-family:${esc(fontCss(t.titleFont))}">제목 글꼴 미리보기 Aa</div><div class="font-pv sm" style="font-family:${esc(fontCss(t.bodyFont))}">본문 글꼴 미리보기 — 소방용수시설의 종류 123</div>
            <h4>장식</h4><label class="drow"><span>모든 슬라이드</span>${sel('decor', d.decor || '', DECORS)}</label>
            <h4>꼬리말</h4>
            <label class="drow"><input type="checkbox" data-ft="num" ${ft.num ? 'checked' : ''}> 슬라이드 번호</label>
            <label class="drow"><input type="checkbox" data-ft="total" ${ft.total ? 'checked' : ''}> 전체 장수도 함께 (3 / 20)</label>
            <label class="drow"><input type="checkbox" data-ft="skipFirst" ${ft.skipFirst !== false ? 'checked' : ''}> 표지(첫 장)에는 표시 안 함</label>
            <label class="drow"><span>문구</span><input type="text" data-ft="text" value="${esc(ft.text || '')}" placeholder="예: 소방용수의 이해 · 홍길동"></label>
          </div>
        </div>
        <div class="actions"><button class="btn primary" data-close>닫기</button></div></div>`;
      bg.querySelectorAll('.theme-card').forEach(c => {
        const sl = renderSlide(curSlide(), Object.assign({}, S.deck, { theme: c.dataset.theme, colors: null, titleFont: '', bodyFont: '', decor: '' }), { mode: 'thumb' });
        const pv = c.querySelector('.pv'); pv.appendChild(sl); requestAnimationFrame(() => fitSlide(pv, sl));
      });
    };
    const apply = (redraw) => { commit({ all: true }); renderStage(); renderProps(); if (redraw) draw(); };
    bg.addEventListener('click', (ev) => {
      if (ev.target === bg || ev.target.dataset.close != null) { bg.remove(); return; }
      const card = ev.target.closest('.theme-card'); if (card) { setProp('deck.theme', card.dataset.theme, true); draw(); return; }
      if (ev.target.dataset.reset) { delete S.deck.colors; apply(true); }
    });
    bg.addEventListener('input', (ev) => { const t = ev.target; if (t.dataset.color) { S.deck.colors = Object.assign({}, S.deck.colors, { [t.dataset.color]: t.value }); markDirty(); renderStage(); } });
    bg.addEventListener('change', (ev) => {
      const t = ev.target;
      if (t.dataset.color) { apply(true); return; }
      if (t.dataset.dk) { if (t.value) S.deck[t.dataset.dk] = t.value; else delete S.deck[t.dataset.dk]; apply(true); return; }
      if (t.dataset.ft) { const ft = S.deck.footer = Object.assign({ skipFirst: true }, S.deck.footer); ft[t.dataset.ft] = t.type === 'checkbox' ? t.checked : t.value; apply(false); }
    });
    bg.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') bg.remove(); ev.stopPropagation(); });
    draw(); document.body.appendChild(bg);
  }

  /* ---- 찾기 · 바꾸기 (Ctrl+F / Ctrl+H) ---- */
  let findEl = null, findPos = -1;
  function elementText(e) {
    if (e.type === 'table') return (e.rows || []).flat().map(c => stripHtml(c)).join(' ');
    if (e.type === 'chart') return e.data || ''; if (e.type === 'math') return e.tex || ''; if (e.type === 'embed') return e.url || '';
    return stripHtml(e.html || '');
  }
  function replaceHtml(html, q, r, once) {
    const d = document.createElement('div'); d.innerHTML = html || ''; let n = 0;
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), once ? 'i' : 'gi');
    const w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT); const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const t of nodes) { if (once && n) break; const a = t.nodeValue.replace(re, () => { n++; return r; }); if (a !== t.nodeValue) t.nodeValue = a; }
    return { html: d.innerHTML, n };
  }
  function replaceInElement(e, q, r, once) {
    if (!q) return 0;
    if (e.type === 'text' || e.type === 'shape') { const o = replaceHtml(e.html, q, r, once); if (o.n) e.html = o.html; return o.n; }
    if (e.type === 'table') { let n = 0; for (const row of e.rows) for (let c = 0; c < row.length; c++) { if (once && n) return n; const o = replaceHtml(row[c], q, r, once); if (o.n) { row[c] = o.html; n += o.n; } } return n; }
    return 0;
  }
  function showFind(withReplace) {
    if (findEl) { findEl.classList.toggle('rep', !!withReplace || findEl.classList.contains('rep')); findEl.querySelector('#fq').select(); findEl.querySelector('#fq').focus(); return; }
    if (S.editing) endEdit();
    findEl = document.createElement('div'); findEl.className = 'findbar' + (withReplace ? ' rep' : '');
    findEl.innerHTML = `<input id="fq" type="search" placeholder="찾을 내용 (모든 슬라이드)"><span class="muted" id="fcount" style="min-width:52px;text-align:right;font-size:12px"></span>
      <button class="btn sm" id="fprev" title="이전 (Shift+Enter)">▲</button><button class="btn sm" id="fnext" title="다음 (Enter)">▼</button><button class="btn sm" id="ftog">바꾸기</button><button class="btn sm ghost" id="fclose" title="닫기 (Esc)">✕</button>
      <div class="frow"><input id="fr" type="text" placeholder="바꿀 내용"><button class="btn sm" id="fone">바꾸기</button><button class="btn sm" id="fall">모두 바꾸기</button></div>`;
    main.appendChild(findEl);
    const q = findEl.querySelector('#fq'), r = findEl.querySelector('#fr'), cnt = findEl.querySelector('#fcount');
    const hits = () => { const s = q.value.trim().toLowerCase(); if (!s) return []; const out = []; S.deck.slides.forEach((sl, si) => sl.elements.forEach(e => { if (elementText(e).toLowerCase().includes(s)) out.push({ si, id: e.id }); })); return out; };
    const upd = () => { const h = hits(); cnt.textContent = q.value ? (h.length ? `${h.length}곳` : '없음') : ''; return h; };
    const go = (d) => {
      const h = upd(); if (!h.length) return; findPos = (findPos + d + h.length) % h.length; const t = h[findPos];
      if (t.si !== S.cur) gotoSlide(t.si); S.sel = [t.id]; markSelection(); renderOverlay(); renderProps(); cnt.textContent = `${findPos + 1} / ${h.length}`;
    };
    const one = () => {
      const h = hits(); if (!h.length) return; if (findPos < 0 || !h[findPos]) { go(1); return; }
      const t = h[findPos]; const e = S.deck.slides[t.si].elements.find(x => x.id === t.id);
      if (replaceInElement(e, q.value.trim(), r.value, true)) { commit({ all: true }); renderStage(); }
      findPos--; go(1);
    };
    const all = () => {
      let n = 0; S.deck.slides.forEach(sl => sl.elements.forEach(e => { n += replaceInElement(e, q.value.trim(), r.value, false); }));
      if (n) { commit({ all: true }); renderStage(); renderProps(); } toast(n ? `${n}곳을 바꿨습니다` : '바꿀 내용이 없습니다'); findPos = -1; upd();
    };
    const close = () => { findEl.remove(); findEl = null; };
    q.addEventListener('input', () => { findPos = -1; upd(); });
    q.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Enter') { ev.preventDefault(); go(ev.shiftKey ? -1 : 1); } if (ev.key === 'Escape') close(); if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'h') { ev.preventDefault(); findEl.classList.add('rep'); r.focus(); } });
    r.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Escape') close(); if (ev.key === 'Enter') { ev.preventDefault(); one(); } });
    findEl.querySelector('#fprev').onclick = () => go(-1); findEl.querySelector('#fnext').onclick = () => go(1);
    findEl.querySelector('#ftog').onclick = () => { findEl.classList.toggle('rep'); if (findEl.classList.contains('rep')) r.focus(); };
    findEl.querySelector('#fclose').onclick = close; findEl.querySelector('#fone').onclick = one; findEl.querySelector('#fall').onclick = all;
    const pre = window.getSelection().toString().trim(); if (pre && pre.length < 60) q.value = pre;
    q.focus(); q.select(); upd();
  }

  /* ---- 개체 목록 (Alt+F10) ---- */
  let layersOn = false;
  const TYPE_ICON = { text: 'T', image: '🖼', shape: '◆', table: '▦', chart: '📊', math: '∑', embed: '▶' };
  function elLabel(e) {
    if (e.name) return e.name;
    if (e.type === 'text' || e.type === 'shape') { const t = stripHtml((e.html || '').replace(/<\/(li|p|div)>|<br\s*\/?>/gi, ' · ')).replace(/^[\s·]+|[\s·]+$/g, ''); if (t) return t.slice(0, 26); }
    if (e.type === 'shape') return (SHAPES.find(s => s.id === e.shape) || {}).name || '도형';
    if (e.type === 'chart') return '차트 · ' + ((CHART_KINDS.find(k => k[0] === e.kind) || [])[1] || '');
    if (e.type === 'math') return '수식 ' + (e.tex || '').slice(0, 18);
    if (e.type === 'table') return `표 ${(e.rows || []).length}×${((e.rows || [])[0] || []).length}`;
    return TYPE_NAMES[e.type] || e.type;
  }
  function toggleLayers() { layersOn = !layersOn; $('btnLayers').classList.toggle('active', layersOn); renderLayers(); }
  function renderLayers() {
    let p = $('layers');
    if (!layersOn) { if (p) p.remove(); return; }
    if (!p) {
      p = document.createElement('div'); p.id = 'layers'; p.className = 'layers'; main.appendChild(p);
      let dragId = null;
      p.addEventListener('click', (ev) => {
        if (ev.target.closest('[data-lclose]')) { toggleLayers(); return; }
        const li = ev.target.closest('.li'); if (!li) return; const e = elById(li.dataset.id); if (!e) return;
        if (ev.target.closest('[data-lhide]')) { e.hide = !e.hide; if (!e.hide) delete e.hide; commit(); rerenderEl(e.id); renderLayers(); return; }
        if (ev.target.closest('[data-llock]')) { e.locked = !e.locked; commit(); markSelection(); renderOverlay(); renderProps(); return; }
        if (S.editing) endEdit();
        S.sel = ev.shiftKey ? (S.sel.includes(e.id) ? S.sel.filter(x => x !== e.id) : S.sel.concat(e.id)) : [e.id];
        markSelection(); renderOverlay(); renderProps();
      });
      p.addEventListener('dblclick', (ev) => {
        const li = ev.target.closest('.li'); if (!li || !ev.target.closest('.nm')) return; const e = elById(li.dataset.id); if (!e) return;
        const n = prompt('이 요소의 이름 (개체 목록에만 보임)', e.name || elLabel(e)); if (n == null) return;
        if (n.trim()) e.name = n.trim(); else delete e.name; commit(); renderLayers();
      });
      p.addEventListener('dragstart', (ev) => { const li = ev.target.closest('.li'); if (!li) return; dragId = li.dataset.id; ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/layer', dragId); });
      p.addEventListener('dragover', (ev) => { const li = ev.target.closest('.li'); if (!li || !dragId) return; ev.preventDefault(); p.querySelectorAll('.dragover').forEach(x => x.classList.remove('dragover')); li.classList.add('dragover'); });
      p.addEventListener('drop', (ev) => {
        const li = ev.target.closest('.li'); if (!li || !dragId) return; ev.preventDefault();
        const arr = curSlide().elements, from = arr.findIndex(x => x.id === dragId); const [mv] = arr.splice(from, 1);
        const to = arr.findIndex(x => x.id === li.dataset.id); arr.splice(to + 1, 0, mv); dragId = null;
        commit(); renderStage();
      });
      p.addEventListener('dragend', () => { dragId = null; p.querySelectorAll('.dragover').forEach(x => x.classList.remove('dragover')); });
    }
    const els = curSlide().elements.slice().reverse();
    p.innerHTML = `<div class="lh"><b>개체 목록</b><span class="muted">위쪽 = 앞쪽 · 끌어서 순서 바꾸기</span><button class="btn sm ghost" data-lclose title="닫기 (Alt+F10)">✕</button></div>` +
      (els.map(e => `<div class="li ${S.sel.includes(e.id) ? 'on' : ''} ${e.hide ? 'off' : ''}" draggable="true" data-id="${e.id}"><span class="ti">${TYPE_ICON[e.type] || '?'}</span><span class="nm" title="더블클릭: 이름 바꾸기">${esc(elLabel(e))}</span>${e.group ? '<span class="gp" title="묶음">⛓</span>' : ''}${e.step ? `<span class="st" title="${e.step}번째 클릭에 나타남">${e.step}</span>` : ''}<button class="ib" data-lhide title="${e.hide ? '보이기' : '숨기기'}">${e.hide ? '🙈' : '👁'}</button><button class="ib" data-llock title="잠금">${e.locked ? '🔒' : '🔓'}</button></div>`).join('') || '<div class="muted" style="padding:12px">이 슬라이드에 요소가 없습니다</div>');
  }

  /* ---- 개요로 슬라이드 만들기 ---- */
  function buildList(items) {
    if (!items.length) return '';
    let html = '', depth = -1, prev = -1; const tags = [];
    for (const it of items) {
      const lvl = Math.min(it.level, prev + 1);
      if (lvl > depth) { if (depth >= 0) html = html.replace(/<\/li>$/, ''); const tag = it.ordered ? 'ol' : 'ul'; html += `<${tag}>`; tags.push(tag); depth = lvl; }
      else while (depth > lvl) { html += `</${tags.pop()}></li>`; depth--; }
      html += `<li>${it.text}</li>`; prev = lvl;
    }
    while (tags.length) { html += `</${tags.pop()}>`; if (tags.length) html += '</li>'; }
    return html;
  }
  function outlineToSlides(text) {
    const lines = String(text || '').replace(/\r/g, '').replace(/\t/g, '  ').split('\n');
    const hasHead = lines.some(l => /^#{1,3}\s+\S/.test(l));
    const blocks = []; let cur = null, sawTitle = false;
    const start = (kind, title) => { cur = { kind, title, items: [], paras: [], notes: [] }; blocks.push(cur); };
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
    const bullet = /^(\s*)([-*•·▪◦]|\d+[.)])\s+(.*)$/;
    for (const raw of lines) {
      const l = raw.replace(/\s+$/, '');
      if (!l.trim()) { if (!hasHead) cur = null; continue; }
      if (/^\s*---+\s*$/.test(l)) { cur = null; continue; }
      let m;
      if (hasHead && (m = l.match(/^(#{1,3})\s+(.*)$/))) {
        if (m[1].length === 1) { start(sawTitle ? 'section' : 'title', m[2].trim()); sawTitle = true; }
        else if (m[1].length === 2) start('content', m[2].trim());
        else { if (!cur) start('content', ''); cur.paras.push('<b>' + inline(m[2].trim()) + '</b>'); }
        continue;
      }
      if (!cur) { if (hasHead) start('content', ''); else { start('content', l.trim().replace(bullet, '$3')); continue; } }
      if ((m = l.match(/^\s*>\s?(.*)$/))) { cur.notes.push(m[1]); continue; }
      if ((m = l.match(bullet))) { cur.items.push({ level: Math.min(2, Math.floor(m[1].length / 2)), ordered: /\d/.test(m[2]), text: inline(m[3]) }); continue; }
      cur.paras.push(inline(l.trim()));
    }
    let part = 0;
    return blocks.map(b => {
      let s;
      if (b.kind === 'title') {
        s = newSlide('title', { title: b.title });
        s.elements[0].html = inline(b.title);
        s.elements[1].html = b.paras.concat(b.items.map(i => i.text)).join(' · ') || '';
        if (!s.elements[1].html) s.elements.splice(1, 1);
      } else if (b.kind === 'section') {
        part++; s = newSlide('section', { title: b.title });
        s.elements[0].html = 'PART ' + part; s.elements[1].html = inline(b.title);
        const sub = b.paras.concat(b.items.map(i => i.text)).join(' · ');
        if (sub) s.elements[3].html = sub; else s.elements.splice(3, 1);
      } else {
        s = newSlide('content', {});
        s.elements[0].html = inline(b.title || '');
        const body = b.paras.map(p => `<p>${p}</p>`).join('') + buildList(b.items);
        const n = b.paras.length + b.items.length;
        if (body) { s.elements[1].html = body; if (n > 12) s.elements[1].style.fontSize = 26; else if (n > 8) s.elements[1].style.fontSize = 30; }
        else s.elements.splice(1, 1);
        if (!b.title) s.elements.splice(0, 1);
      }
      s.notes = b.notes.join('\n');
      return s;
    });
  }
  const OUTLINE_SAMPLE = '# 소방용수의 이해\n강의자 · 2026년 2학기\n\n## 학습 목표\n- 소방용수시설의 종류를 설명할 수 있다\n- 수리 계산의 기본을 이해한다\n  - 유량과 압력의 관계\n\n# 소방용수시설\n\n## 소방용수시설의 종류\n1. 소화전\n2. 급수탑\n3. 저수조\n> 노트: 현장 사진을 함께 보여 줄 것';
  function showOutline() {
    if (S.editing) endEdit();
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal outline-modal"><h3>📝 개요로 슬라이드 만들기 <span class="muted" style="font-weight:400;font-size:13px">한글·워드·메모장·ChatGPT 에서 쓴 개요를 붙여넣으세요</span></h3>
      <div class="outline-help"><code># 제목</code> 첫 번째는 표지, 그다음부터 섹션 구분 · <code>## 제목</code> 새 슬라이드 · <code>- 항목</code> 글머리 (앞에 빈칸 두 개 = 하위 항목) · <code>1. 항목</code> 번호 목록 · <code>&gt; 문장</code> 발표자 노트 · <code>**굵게**</code><br>제목 기호(#)가 하나도 없으면 빈 줄로 슬라이드를 나누고, 각 묶음의 첫 줄이 제목이 됩니다.</div>
      <textarea id="olText" class="mono" spellcheck="false" placeholder="${esc(OUTLINE_SAMPLE)}"></textarea>
      <div class="actions"><span id="olInfo" class="muted" style="flex:1;font-size:12.5px">현재 슬라이드 뒤에 추가됩니다</span><button class="btn" data-sample>예시 넣기</button><button class="btn" data-close>취소</button><button class="btn primary" id="olGo">슬라이드 만들기</button></div></div>`;
    document.body.appendChild(bg);
    const ta = bg.querySelector('#olText'), info = bg.querySelector('#olInfo');
    const upd = () => { const n = ta.value.trim() ? outlineToSlides(ta.value).length : 0; info.textContent = n ? `슬라이드 ${n}장이 현재 슬라이드 뒤에 만들어집니다` : '현재 슬라이드 뒤에 추가됩니다'; };
    ta.addEventListener('input', upd);
    ta.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Escape') bg.remove(); if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) bg.querySelector('#olGo').click(); });
    bg.addEventListener('click', (ev) => {
      if (ev.target === bg || ev.target.dataset.close != null) { bg.remove(); return; }
      if (ev.target.dataset.sample != null) { ta.value = OUTLINE_SAMPLE; upd(); return; }
      if (ev.target.id === 'olGo') {
        const ss = outlineToSlides(ta.value); if (!ss.length) { toast('내용을 입력하세요'); return; }
        bg.remove(); S.deck.slides.splice(S.cur + 1, 0, ...ss); S.cur += 1; S.sel = [];
        commit({ all: true }); renderStage(); renderProps(); updateTop(); toast(`슬라이드 ${ss.length}장을 만들었습니다`);
      }
    });
    setTimeout(() => ta.focus(), 30);
  }

  /* ---- 사진 앨범: 사진마다 한 장씩 ---- */
  $('fileAlbum').onchange = async (ev) => {
    const files = Array.from(ev.target.files).filter(f => f.type.startsWith('image/')); ev.target.value = ''; if (!files.length) return;
    if (S.editing) endEdit();
    toast(`사진 ${files.length}장으로 슬라이드를 만드는 중…`, 4000);
    let at = S.cur;
    for (const f of files) {
      try {
        const prep = await prepareImage(f); const src = await API.stage(prep.blob, prep.name);
        const maxW = 1700, maxH = 850; const r = Math.min(maxW / prep.w, maxH / prep.h); const w = Math.round(prep.w * r), h = Math.round(prep.h * r);
        const s = newSlide('blank');
        s.elements.push(imageEl(Math.round((SLIDE_W - w) / 2), 50 + Math.round((maxH - h) / 2), w, h, src, { radius: 12, shadow: true }));
        s.elements.push(textEl('caption', M, 935, SLIDE_W - M * 2, 70, esc(f.name.replace(/\.[^.]+$/, '')), { style: { align: 'center', fontSize: 30, valign: 'middle' } }));
        S.deck.slides.splice(++at, 0, s);
      } catch (e) { toast('사진을 넣지 못했습니다: ' + f.name); }
    }
    S.cur = at; S.sel = []; commit({ all: true }); renderStage(); renderProps(); updateTop();
    thumbsEl.children[S.cur]?.scrollIntoView({ block: 'nearest' });
  };

  /* ---- 격자 ---- */
  S.grid = (() => { try { return localStorage.getItem('gyoan:grid') === '1'; } catch (e) { return false; } })();
  function applyGrid() {
    overlay.classList.toggle('grid-on', !!S.grid);
    overlay.style.backgroundSize = S.grid ? `${60 * S.k}px ${60 * S.k}px` : '';
    const b = $('btnGrid'); if (b) b.classList.toggle('active', !!S.grid);
  }
  $('btnGrid').onclick = () => { S.grid = !S.grid; try { localStorage.setItem('gyoan:grid', S.grid ? '1' : '0'); } catch (e) { } applyGrid(); toast(S.grid ? '격자 켜짐 · 60px 간격에 맞춰 붙습니다' : '격자 꺼짐'); };

  function toggleHideSlide() {
    const s = curSlide(); s.hidden = !s.hidden; if (!s.hidden) delete s.hidden;
    commit(); renderProps(); toast(s.hidden ? '숨긴 슬라이드: 발표 때 건너뜁니다' : '슬라이드를 다시 보이게 했습니다');
  }

  /* ---- 새 도구 버튼 ---- */
  $('btnAddTable').onclick = (ev) => { ev.stopPropagation(); tablePicker(ev.currentTarget); };
  $('btnAddChart').onclick = (ev) => { ev.stopPropagation(); btnMenu(ev.currentTarget, CHART_KINDS.map(([k, n]) => ({ label: n, fn: () => addChart(k) }))); };
  $('btnAddIcon').onclick = showIconPicker;
  $('btnAddMore').onclick = (ev) => {
    ev.stopPropagation();
    btnMenu(ev.currentTarget, [
      { label: '∑ 수식…', fn: () => openMathDialog(null) },
      { label: '▶ 동영상 · 웹 페이지…', fn: () => openEmbedDialog(null) },
      { sep: true },
      { label: '📝 개요로 슬라이드 만들기…', fn: showOutline },
      { label: '🖼 사진 앨범 (사진마다 한 장씩)…', fn: () => $('fileAlbum').click() },
    ]);
  };
  $('btnOrder').onclick = (ev) => {
    ev.stopPropagation();
    btnMenu(ev.currentTarget, [
      { label: '맨 앞으로', kbd: 'Ctrl+Shift+]', fn: () => zOrder('front') }, { label: '앞으로', kbd: 'Ctrl+]', fn: () => zOrder('up') },
      { label: '뒤로', kbd: 'Ctrl+[', fn: () => zOrder('down') }, { label: '맨 뒤로', kbd: 'Ctrl+Shift+[', fn: () => zOrder('back') },
      { sep: true }, { label: '가로 등간격 (3개 이상)', fn: () => distribute('h') }, { label: '세로 등간격 (3개 이상)', fn: () => distribute('v') },
    ]);
  };
  $('btnGroup').onclick = () => { const els = selEls(); if (els.length > 1 && els.every(e => e.group && e.group === els[0].group)) ungroupSel(); else groupSel(); };
  $('btnFind').onclick = () => showFind(false);
  $('btnLayers').onclick = toggleLayers;
  $('btnDesign').onclick = showDesign;

  /* ---------- 시작 ---------- */
  window.__gyoan = { S, renderStage, gotoSlide }; // 개발용: 콘솔에서 상태 확인
  pushHistory();
  renderAll();
  if (Draft.get(S.name) && JSON.stringify(Draft.get(S.name)) !== JSON.stringify(S.deck)) {
    if (confirm('저장하지 않은 임시 작업본이 있습니다. 불러올까요?')) { S.deck = Draft.get(S.name); migrate(S.deck); pushHistory(); renderAll(); markDirty(); }
    else Draft.clear(S.name);
  }
})();
