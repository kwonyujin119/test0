/* 교안 편집기 */
'use strict';
(async function () {
  const $ = (id) => document.getElementById(id);
  const S = { name: '', deck: null, cur: 0, sel: [], editing: null, k: 1, zoomMode: 'fit', history: [], hi: -1, dirty: false, clip: null, slideClip: null };
  const stage = $('stage'), overlay = $('overlay'), main = $('main'), props = $('props'), thumbsEl = $('thumbs');
  let slideNode = null, textToolbar = null, saveTimer = null;

  /* ---------- 초기화 ---------- */
  S.name = qs('deck');
  if (!S.name) { location.href = 'index.html'; return; }
  await API.init();
  try { S.deck = await API.load(S.name); }
  catch (e) { alert(e.message); location.href = 'index.html'; return; }
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
  const theme = () => getTheme(S.deck.theme);
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
    clearTimeout(saveTimer); saveTimer = setTimeout(() => Draft.put(S.name, S.deck), 300);
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
    } catch (e) { alert('저장 실패: ' + e.message); }
  }
  window.addEventListener('beforeunload', (ev) => { if (S.dirty) { ev.preventDefault(); ev.returnValue = ''; } });

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
    renderOverlay(); positionTextToolbar();
  }
  function markSelection() {
    if (!slideNode) return;
    slideNode.querySelectorAll('.el').forEach(n => {
      const e = elById(n.dataset.id); if (!e) return;
      n.classList.toggle('selected', S.sel.includes(n.dataset.id));
      n.classList.toggle('locked', !!e.locked);
      const ms = elementMaxStep(e);
      if (ms > 0) { n.classList.add('step-badge'); n.dataset.step = (e.listSteps && ms > (e.step || 0)) ? `${listStepBase(e)}–${ms}` : String(e.step || 0); }
      else { n.classList.remove('step-badge'); delete n.dataset.step; }
    });
    $('footSel').textContent = S.sel.length ? `${S.sel.length}개 선택` : '';
    const has = S.sel.length > 0;
    document.querySelectorAll('#alignGroup .btn, #zGroup .btn, #btnDup, #btnDel').forEach(b => b.disabled = !has);
  }
  function rerenderEl(id) {
    const e = elById(id); const old = nodeOf(id); if (!e || !old) return;
    const n = renderElement(e, theme(), 'edit');
    old.replaceWith(n); markSelection();
  }
  function renderOverlay() {
    overlay.innerHTML = '';
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
  function renderThumbs() {
    thumbsEl.innerHTML = '';
    S.deck.slides.forEach((s, i) => thumbsEl.appendChild(makeThumb(s, i)));
    $('slideCount').textContent = `${S.cur + 1} / ${S.deck.slides.length}`;
  }
  function makeThumb(s, i) {
    const t = document.createElement('div'); t.className = 'thumb' + (i === S.cur ? ' active' : ''); t.dataset.i = i; t.draggable = true;
    const sl = renderSlide(s, S.deck, { mode: 'thumb' });
    t.appendChild(sl);
    const n = document.createElement('div'); n.className = 'n'; n.textContent = i + 1; t.appendChild(n);
    const ms = maxStep(s); if (ms > 0) { const b = document.createElement('div'); b.className = 'steps'; b.textContent = `▸${ms}`; t.appendChild(b); }
    requestAnimationFrame(() => fitSlide(t, sl));
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
    const s = clone(curSlide()); s.id = uid(); s.elements.forEach(e => e.id = uid());
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
    toast('이미지 넣는 중…', 4000);
    try {
      const src = await API.upload(file, file.name);
      const dim = await imageSize(src);
      const maxW = 1200, maxH = 760; let w = dim.w, h = dim.h;
      const r = Math.min(1, maxW / w, maxH / h); w = Math.round(w * r); h = Math.round(h * r);
      const x = at ? Math.round(at.x - w / 2) : Math.round((SLIDE_W - w) / 2), y = at ? Math.round(at.y - h / 2) : Math.round((SLIDE_H - h) / 2);
      addElement(imageEl(clamp(x, 0, SLIDE_W - w), clamp(y, 0, SLIDE_H - h), w, h, src));
      toast('이미지를 넣었습니다');
    } catch (e) { alert('이미지 삽입 실패: ' + e.message); }
  }
  function imageSize(src) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth || 800, h: im.naturalHeight || 600 }); im.onerror = () => rej(new Error('이미지를 열 수 없습니다')); im.src = src; });
  }
  async function replaceImage(id, file) {
    const e = elById(id); if (!e) return;
    try {
      const src = await API.upload(file, file.name); const dim = await imageSize(src);
      e.src = src;
      // 비율 유지하여 현재 너비에 맞춤
      e.h = Math.round(e.w * dim.h / dim.w);
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
    const copies = els.map(e => Object.assign(clone(e), { id: uid(), x: e.x + 30, y: e.y + 30 }));
    curSlide().elements.push(...copies); S.sel = copies.map(c => c.id);
    commit(); renderStage(); renderProps();
  }
  function copySelected() { const els = selEls(); if (els.length) { S.clip = clone(els); toast(`${els.length}개 복사`); } }
  function pasteClip() {
    if (!S.clip) return;
    const copies = S.clip.map(e => Object.assign(clone(e), { id: uid(), x: e.x + 30, y: e.y + 30 }));
    curSlide().elements.push(...copies); S.sel = copies.map(c => c.id);
    commit(); renderStage(); renderProps();
  }
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
    if (e.type === 'text') startEdit(e.id, ev);
    else if (e.type === 'image') { S.sel = [e.id]; $('fileReplace').dataset.id = e.id; $('fileReplace').click(); }
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
    if (e && e.type === 'text') items.push({ label: '글 편집', kbd: '더블클릭', fn: () => startEdit(e.id) });
    if (e && e.type === 'image') items.push({ label: '이미지 교체…', fn: () => { $('fileReplace').dataset.id = e.id; $('fileReplace').click(); } });
    items.push({ label: '복제', kbd: 'Ctrl+D', fn: duplicateSelected }, { label: '복사', kbd: 'Ctrl+C', fn: copySelected }, { sep: true },
      { label: '맨 앞으로', fn: () => zOrder('front') }, { label: '맨 뒤로', fn: () => zOrder('back') }, { sep: true },
      { label: e && e.locked ? '잠금 해제' : '잠금 (이동 방지)', fn: () => { for (const x of selEls()) x.locked = !x.locked; commit(); markSelection(); renderOverlay(); renderProps(); } },
      { label: '삭제', kbd: 'Del', danger: true, fn: deleteSelected });
    return items;
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
      if (ev.shiftKey) { S.sel = S.sel.includes(id) ? S.sel.filter(x => x !== id) : S.sel.concat(id); }
      else if (!S.sel.includes(id)) S.sel = [id];
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
    const mv = (e) => onMove(e); const up = (e) => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); onUp(e); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }
  function startDrag(ev) {
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
      const keep = isCorner && ((e.type === 'image' && !m.shiftKey) || (e.type !== 'image' && m.shiftKey));
      if (keep) { if (Math.abs(w / ratio - hh) * ratio > Math.abs(hh * ratio - w)) hh = w / ratio; else w = hh * ratio; if (h.includes('w')) x = o.x + o.w - w; if (h.includes('n')) y = o.y + o.h - hh; }
      w = Math.max(16, w); hh = Math.max(16, hh);
      e.x = Math.round(x); e.y = Math.round(y); e.w = Math.round(w); e.h = Math.round(hh);
      if (e.type === 'shape') { rerenderEl(e.id); }
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
      const hit = curSlide().elements.filter(e => !e.locked && e.x < R && e.x + e.w > L && e.y < B && e.y + e.h > T).map(e => e.id);
      S.sel = ev.shiftKey ? Array.from(new Set(S.sel.concat(hit))) : hit;
      markSelection(); renderOverlay(); renderProps();
    });
  }

  /* ---------- 텍스트 편집 ---------- */
  function startEdit(id, ev, selectAll) {
    const e = elById(id); if (!e || e.type !== 'text') return;
    if (S.editing && S.editing !== id) endEdit();
    S.sel = [id]; markSelection(); renderOverlay(); renderProps();
    const node = nodeOf(id); const inner = node.querySelector('.el-text-inner');
    if (inner.querySelector('.placeholder')) inner.innerHTML = '';
    inner.contentEditable = 'true'; S.editing = id; node.classList.add('editing');
    inner.focus();
    if (ev && document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(ev.clientX, ev.clientY);
      if (r) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
    } else {
      const r = document.createRange(); r.selectNodeContents(inner); if (!selectAll) r.collapse(false);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    showTextToolbar(node);
    inner.addEventListener('input', onEditInput);
    inner.addEventListener('blur', onEditBlur);
  }
  function onEditInput() { }
  function onEditBlur(ev) {
    // 툴바 클릭으로 인한 blur 는 무시
    setTimeout(() => { if (S.editing && document.activeElement !== ev.target && !(textToolbar && textToolbar.contains(document.activeElement))) endEdit(); }, 0);
  }
  function endEdit() {
    if (!S.editing) return;
    const id = S.editing; const node = nodeOf(id); S.editing = null; hideTextToolbar();
    if (!node) return;
    const inner = node.querySelector('.el-text-inner'); node.classList.remove('editing');
    inner.removeEventListener('input', onEditInput); inner.removeEventListener('blur', onEditBlur);
    inner.contentEditable = 'false';
    const html = cleanHtml(inner.innerHTML); const e = elById(id);
    if (e && html !== e.html) { e.html = html; commit(); }
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
      <button class="btn" data-cmd="link" title="링크">🔗</button>
      <button class="btn" data-cmd="removeFormat" title="서식 지우기">✕</button>`;
    textToolbar.addEventListener('mousedown', (ev) => { if (ev.target.tagName !== 'INPUT') ev.preventDefault(); });
    textToolbar.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-cmd]'); if (!b || b.tagName === 'INPUT') return;
      const cmd = b.dataset.cmd; const e = elById(S.editing); if (!e) return;
      if (cmd === 'size+' || cmd === 'size-') { const cur = resolveTextStyle(e, theme()).fontSize; e.style.fontSize = clamp(cur + (cmd === 'size+' ? 4 : -4), 10, 400); applyTextNodeStyle(e, nodeOf(e.id), theme()); markDirty(); renderProps(); return; }
      if (cmd === 'hilite') { exec('hiliteColor', '#fde68a'); return; }
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
  const ANIMS = [['fade', '페이드'], ['up', '아래서 위로'], ['left', '왼쪽에서'], ['zoom', '확대'], ['none', '없음']];
  const TRANS = [['', '기본(페이드)'], ['none', '없음'], ['fade', '페이드'], ['slide', '밀기'], ['zoom', '확대']];
  const GRADS = ['linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)', 'linear-gradient(135deg,#f6d365,#fda085)', 'linear-gradient(135deg,#a1c4fd,#c2e9fb)', 'linear-gradient(135deg,#d4fc79,#96e6a1)', 'linear-gradient(135deg,#fbc2eb,#a6c1ee)', 'linear-gradient(180deg,#ffffff,#e5e7eb)', 'linear-gradient(135deg,#141e30,#243b55)'];

  function renderProps() {
    const els = selEls();
    if (!els.length) props.innerHTML = slideProps();
    else if (els.length === 1) props.innerHTML = elementProps(els[0]);
    else props.innerHTML = multiProps(els);
  }
  function slideProps() {
    const s = curSlide(); const bg = s.bg || {};
    const mode = bg.image ? 'image' : bg.gradient ? 'gradient' : bg.color ? 'color' : 'theme';
    return `
    <section><h4>슬라이드 ${S.cur + 1} 배경</h4>
      ${row('종류', choice('slide.bgmode', mode, [['theme', '테마'], ['color', '단색'], ['gradient', '그라데이션'], ['image', '이미지']]))}
      ${mode === 'color' ? row('색', colorIn('slide.bg.color', bg.color || theme().bg) + '<div style="flex:3">' + swatches('slide.bg.color') + '</div>') : ''}
      ${mode === 'gradient' ? row('프리셋', `<div class="swatches">${GRADS.map(g => `<div class="swatch" data-k="slide.bg.gradient" data-val="${g}" style="background:${g}"></div>`).join('')}</div>`) + row('직접', `<input type="text" data-k="slide.bg.gradient" value="${esc(bg.gradient || '')}" placeholder="linear-gradient(...)">`) : ''}
      ${mode === 'image' ? row('이미지', `<button class="btn sm" data-act="bgImage">파일 선택…</button>`) + (bg.image ? row('맞춤', selIn('slide.bg.fit', bg.fit || 'cover', [['cover', '채우기'], ['contain', '맞추기']])) + row('바탕색', colorIn('slide.bg.color', bg.color || theme().bg)) : '') : ''}
      ${row('장식', selIn('slide.decor', s.decor || '', [['', '테마 기본'], ['none', '없음'], ['bar-left', '왼쪽 바'], ['bar-top', '위쪽 바']]))}
      ${row('전환', selIn('slide.transition', s.transition || '', TRANS))}
    </section>
    <section><h4>발표자 노트 <span class="muted" style="text-transform:none;font-weight:400">발표자 보기(S)에서 표시</span></h4>
      <textarea data-k="slide.notes" placeholder="이 슬라이드에서 말할 내용, 참고 사항…">${esc(s.notes || '')}</textarea>
    </section>
    <section><h4>슬라이드 작업</h4>
      <div class="grid2">
        <button class="btn sm" data-act="dupSlide">복제</button>
        <button class="btn sm" data-act="layout">레이아웃 적용…</button>
        <button class="btn sm" data-act="moveUp">▲ 위로</button>
        <button class="btn sm" data-act="moveDown">▼ 아래로</button>
        <button class="btn sm danger" data-act="delSlide" style="grid-column:1/-1">슬라이드 삭제</button>
      </div>
    </section>
    <section><h4>교안 전체</h4>
      ${row('기본 전환', selIn('deck.transition', S.deck.transition || 'fade', TRANS.slice(1)))}
      ${row('테마', selIn('deck.theme', S.deck.theme, THEMES.map(t => [t.id, t.name])))}
      <div class="muted" style="font-size:12px;margin-top:6px">슬라이드 ${S.deck.slides.length}장 · 파일: decks/${esc(S.name)}.json</div>
    </section>`;
  }
  function posSection(e) {
    return `<section><h4>위치 · 크기 ${tog('locked', e.locked, e.locked ? '🔒 잠김' : '🔓', '잠그면 이동/크기 조절이 안 됩니다')}</h4>
      <div class="grid4">
        ${num('x', e.x, 1, null, null, 'X')}${num('y', e.y, 1, null, null, 'Y')}${num('w', e.w, 1, 16, null, '너비')}${num('h', e.h, 1, 16, null, '높이')}
      </div>
      <div class="prow" style="margin-top:6px"><label>회전</label><div class="ctrls">${num('rotate', e.rotate || 0, 1, -180, 180)}<label style="color:var(--ui-muted);font-size:12px">투명도</label>${num('opacity', Math.round((e.opacity == null ? 1 : e.opacity) * 100), 5, 0, 100)}</div></div>
    </section>`;
  }
  function animSection(e) {
    return `<section><h4>나타내기 (클릭 단계)</h4>
      ${row('단계', num('step', e.step || 0, 1, 0, 50, '0 = 처음부터 표시, 1 이상 = 해당 클릭에 나타남') + selIn('anim', e.anim || 'fade', ANIMS))}
      ${e.type === 'text' ? row('목록', tog('listSteps', e.listSteps, '항목 하나씩 표시', '글머리 항목을 클릭할 때마다 하나씩 보여줍니다')) : ''}
      <div class="muted" style="font-size:11.5px">이 슬라이드의 최대 단계: ${maxStep(curSlide())}</div>
    </section>`;
  }
  function elementProps(e) {
    let body = '';
    if (e.type === 'text') {
      const st = resolveTextStyle(e, theme());
      body = `<section><h4>텍스트</h4>
        ${row('역할', selIn('role', e.role || 'text', Object.entries(ROLE_NAMES)))}
        ${row('글꼴', selIn('style.font', st.font, FONTS.map(f => [f.id, f.name])))}
        ${row('크기', num('style.fontSize', st.fontSize, 2, 8, 400) + choice('style.fontSize', st.fontSize, [[24, '24'], [32, '32'], [40, '40'], [56, '56'], [72, '72']]))}
        ${row('색', colorIn('style.color', st.color) + '<div style="flex:3">' + swatches('style.color') + '</div>')}
        ${row('스타일', tog('style.bold', st.bold, '<b>B</b>', '굵게') + tog('style.italic', st.italic, '<i>I</i>', '기울임') + tog('style.underline', st.underline, '<u>U</u>', '밑줄'))}
        ${row('가로 정렬', choice('style.align', st.align || 'left', [['left', '⇤', '왼쪽'], ['center', '↔', '가운데'], ['right', '⇥', '오른쪽']]))}
        ${row('세로 정렬', choice('style.valign', st.valign || 'top', [['top', '⤒', '위'], ['middle', '↕', '가운데'], ['bottom', '⤓', '아래']]))}
        ${row('줄 간격', num('style.lineHeight', st.lineHeight || 1.5, 0.1, 0.8, 3) + '<label style="color:var(--ui-muted);font-size:12px">자간</label>' + num('style.letterSpacing', st.letterSpacing || 0, 0.5, -5, 20))}
      </section>
      <section><h4>상자 꾸밈</h4>
        ${row('배경', colorIn('style.bg', st.bg || theme().surface) + '<div style="flex:3">' + swatches('style.bg', true) + '</div>')}
        ${row('안쪽 여백', num('style.padding', st.padding || 0, 4, 0, 200) + '<label style="color:var(--ui-muted);font-size:12px">모서리</label>' + num('style.radius', st.radius || 0, 4, 0, 200))}
        ${row('테두리', num('style.border', st.border || 0, 1, 0, 40) + colorIn('style.borderColor', st.borderColor || '$accent'))}
        ${row('효과', tog('style.shadow', st.shadow, '그림자') + tog('style.accentBar', st.accentBar, '왼쪽 강조선'))}
      </section>`;
    } else if (e.type === 'image') {
      body = `<section><h4>이미지</h4>
        ${row('파일', `<button class="btn sm" data-act="replaceImage">교체…</button><button class="btn sm" data-act="fitRatio" title="원본 비율로 높이 조정">원본 비율</button>`)}
        ${row('맞춤', choice('fit', e.fit || 'contain', [['contain', '맞추기'], ['cover', '채우기'], ['fill', '늘이기']]))}
        ${row('모서리', num('radius', e.radius || 0, 4, 0, 400))}
        ${row('테두리', num('border', e.border || 0, 1, 0, 40) + colorIn('borderColor', e.borderColor || '#ffffff'))}
        ${row('효과', tog('shadow', e.shadow, '그림자') + tog('flip', e.flip, '좌우 반전'))}
        <div class="muted" style="font-size:11px;word-break:break-all;margin-top:4px">${esc((e.src || '').slice(0, 80))}</div>
      </section>`;
    } else if (e.type === 'shape') {
      body = `<section><h4>도형</h4>
        ${row('종류', selIn('shape', e.shape, SHAPES.map(s => [s.id, s.name])))}
        ${row('채우기', colorIn('fill', e.fill || '$accent') + '<div style="flex:3">' + swatches('fill', true) + '</div>')}
        ${row('선', num('strokeWidth', e.strokeWidth || 0, 1, 0, 60) + colorIn('stroke', e.stroke || '$accent'))}
        ${e.shape === 'rect' ? row('모서리', num('radius', e.radius || 0, 4, 0, 400)) : ''}
        ${row('효과', tog('shadow', e.shadow, '그림자'))}
      </section>`;
    }
    return body + posSection(e) + animSection(e) + `<section><div class="grid2"><button class="btn sm" data-act="dup">복제</button><button class="btn sm danger" data-act="del">삭제</button></div></section>`;
  }
  function multiProps(els) {
    return `<section><h4>${els.length}개 선택</h4>
      ${row('정렬', `<div class="grid4" style="flex:1">${['left', 'hcenter', 'right', 'top', 'vcenter', 'bottom'].map((a, i) => `<button class="btn sm icon" data-align="${a}">${['⇤', '↔', '⇥', '⤒', '↕', '⤓'][i]}</button>`).join('')}</div>`)}
      ${row('분포', `<button class="btn sm" data-act="distH">가로 등간격</button><button class="btn sm" data-act="distV">세로 등간격</button>`)}
      ${row('크기', `<button class="btn sm" data-act="sameW">같은 너비</button><button class="btn sm" data-act="sameH">같은 높이</button>`)}
    </section>
    <section><h4>나타내기</h4>${row('단계', num('step', commonVal(els, 'step'), 1, 0, 50) + selIn('anim', commonVal(els, 'anim') || 'fade', ANIMS))}
      ${row('순서대로', `<button class="btn sm" data-act="stepSeq" title="선택한 요소들을 1, 2, 3… 순서로 나타나게">1→2→3 자동 부여</button>`)}
    </section>
    <section><div class="grid2"><button class="btn sm" data-act="dup">복제</button><button class="btn sm danger" data-act="del">삭제</button></div></section>`;
  }
  function commonVal(els, k) { const v = els[0][k]; return els.every(e => e[k] === v) ? v : ''; }

  /* 속성 변경 */
  props.addEventListener('input', (ev) => { const t = ev.target; if (t.dataset.k && (t.type === 'number' || t.type === 'color' || t.type === 'range')) setProp(t.dataset.k, readVal(t), false); });
  props.addEventListener('change', (ev) => { const t = ev.target; if (t.dataset.k) setProp(t.dataset.k, readVal(t), true); });
  props.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-k],[data-act],[data-align]'); if (!t) return;
    if (t.dataset.align) { alignSel(t.dataset.align); return; }
    if (t.dataset.act) { doAct(t.dataset.act); return; }
    if (t.dataset.toggle) { const els = S.sel.length ? selEls() : null; const cur = els ? getPath(els[0], t.dataset.k) : null; setProp(t.dataset.k, !cur, true); return; }
    if (t.dataset.val != null && t.tagName !== 'INPUT' && t.tagName !== 'SELECT') { let v = t.dataset.val; if (/^-?\d+(\.\d+)?$/.test(v)) v = parseFloat(v); setProp(t.dataset.k, v, true); }
  });
  function readVal(t) {
    if (t.type === 'number') { const v = parseFloat(t.value); return isNaN(v) ? 0 : v; }
    return t.value;
  }
  function getPath(o, path) { return path.split('.').reduce((a, k) => a == null ? a : a[k], o); }
  function setPath(o, path, v) { const ks = path.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null || typeof a[ks[i]] !== 'object') a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; }
  function setProp(k, v, doCommit) {
    if (k === 'deck.theme') { S.deck.theme = v; $('theme').value = v; commit({ all: true }); renderStage(); renderProps(); return; }
    if (k === 'deck.transition') { S.deck.transition = v; commit(); return; }
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
      if (k === 'style.bg' && v === '') { delete e.style.bg; } else setPath(e, k, val);
      if (k.startsWith('style.') && (val === '' || val === false) && k !== 'style.align' && k !== 'style.valign') delete e.style[k.slice(6)];
      if (k === 'role') { /* 역할 변경시 크기/색 오버라이드 제거 */ delete e.style.fontSize; delete e.style.color; delete e.style.bold; delete e.style.font; }
      if (k === 'shape' && (v === 'line' || v === 'arrow') && e.h > 80) e.h = 40;
      if (S.editing === e.id && k.startsWith('style.')) applyTextNodeStyle(e, nodeOf(e.id), theme());
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
    try { const src = await API.upload(f, f.name); const s = curSlide(); s.bg = Object.assign({}, s.bg || {}, { image: src, fit: 'cover' }); delete s.bg.gradient; commit(); renderStage(); renderProps(); }
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
  document.querySelectorAll('#zGroup .btn').forEach(b => b.onclick = () => zOrder(b.dataset.z));
  $('btnDup').onclick = duplicateSelected; $('btnDel').onclick = deleteSelected;
  $('btnUndo').onclick = undo; $('btnRedo').onclick = redo;
  $('btnSave').onclick = save;
  $('deckTitle').onchange = (ev) => { S.deck.title = ev.target.value.trim() || S.deck.title; ev.target.value = S.deck.title; document.title = S.deck.title + ' · 편집'; commit({ all: true }); };
  const themeSel = $('theme'); THEMES.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; themeSel.appendChild(o); });
  themeSel.onchange = () => setProp('deck.theme', themeSel.value, true);
  $('zoom').onchange = (ev) => { S.zoomMode = ev.target.value; layoutStage(); };
  $('btnPresent').onclick = async () => { await save(); window.open(`present.html?deck=${encodeURIComponent(S.name)}&start=${S.cur}`, '_blank'); };
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
    const toData = async (src) => { if (!src || src.startsWith('data:')) return src; try { const b = await (await fetch(src)).blob(); return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); } catch (e) { return src; } };
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
    for (const f of ev.dataTransfer.files) await insertImageFile(f, at);
  });
  document.addEventListener('paste', async (ev) => {
    const items = Array.from(ev.clipboardData.items || []);
    const img = items.find(i => i.type.startsWith('image/'));
    if (img) { ev.preventDefault(); const f = img.getAsFile(); await insertImageFile(new File([f], 'clipboard-' + Date.now() + '.' + (f.type.split('/')[1] || 'png'), { type: f.type })); return; }
    if (S.editing) { // 서식 없는 텍스트로 붙여넣기
      ev.preventDefault(); const text = ev.clipboardData.getData('text/plain');
      exec('insertHTML', esc(text).replace(/\r?\n/g, '<br>')); return;
    }
    if (isTyping()) return;
    const text = ev.clipboardData.getData('text/plain');
    if (text && !S.clip) { addElement(textEl('text', 400, 400, 1120, 200, esc(text).replace(/\r?\n/g, '<br>'))); }
    else if (S.clip) pasteClip();
  });

  /* ---------- 키보드 ---------- */
  function isTyping() { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable); }
  document.addEventListener('keydown', (ev) => {
    const ctrl = ev.ctrlKey || ev.metaKey;
    if (S.editing) {
      if (ev.key === 'Escape') { ev.preventDefault(); endEdit(); }
      else if (ev.key === 'Tab') { ev.preventDefault(); exec(ev.shiftKey ? 'outdent' : 'indent'); }
      else if (ctrl && ev.key.toLowerCase() === 's') { ev.preventDefault(); save(); }
      return;
    }
    if (ctrl && ev.key.toLowerCase() === 's') { ev.preventDefault(); save(); return; }
    if (ev.key === 'F5') { ev.preventDefault(); $('btnPresent').click(); return; }
    if (isTyping()) { if (ev.key === 'Escape') document.activeElement.blur(); return; }
    if (ctrl && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
    if (ctrl && ev.key.toLowerCase() === 'y') { ev.preventDefault(); redo(); return; }
    if (ctrl && ev.key === 'Enter') { ev.preventDefault(); addSlide('content'); return; }
    if (ctrl && ev.shiftKey && ev.key.toLowerCase() === 'd') { ev.preventDefault(); duplicateSlide(); return; }
    if (ctrl && ev.key.toLowerCase() === 'd') { ev.preventDefault(); duplicateSelected(); return; }
    if (ctrl && ev.key.toLowerCase() === 'c') { copySelected(); return; }
    if (ctrl && ev.key.toLowerCase() === 'x') { copySelected(); deleteSelected(); return; }
    if (ctrl && ev.key.toLowerCase() === 'v') { return; /* paste 이벤트에서 처리 */ }
    if (ctrl && ev.key.toLowerCase() === 'a') { ev.preventDefault(); S.sel = curSlide().elements.filter(e => !e.locked).map(e => e.id); markSelection(); renderOverlay(); renderProps(); return; }
    if (ctrl && (ev.key === ']' || ev.key === '}')) { ev.preventDefault(); zOrder(ev.shiftKey ? 'front' : 'up'); return; }
    if (ctrl && (ev.key === '[' || ev.key === '{')) { ev.preventDefault(); zOrder(ev.shiftKey ? 'back' : 'down'); return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { if (S.sel.length) { ev.preventDefault(); deleteSelected(); } return; }
    if (ev.key === 'Escape') { closeMenus(); S.sel = []; markSelection(); renderOverlay(); renderProps(); return; }
    if (ev.key === 'Enter' && S.sel.length === 1) { const e = elById(S.sel[0]); if (e && e.type === 'text') { ev.preventDefault(); startEdit(e.id); } return; }
    if (ev.key === 'PageDown') { ev.preventDefault(); gotoSlide(S.cur + 1); return; }
    if (ev.key === 'PageUp') { ev.preventDefault(); gotoSlide(S.cur - 1); return; }
    if (ev.key.startsWith('Arrow')) {
      if (!S.sel.length) { if (ev.key === 'ArrowDown') gotoSlide(S.cur + 1); if (ev.key === 'ArrowUp') gotoSlide(S.cur - 1); return; }
      ev.preventDefault(); const d = ev.shiftKey ? 10 : 1;
      nudge(ev.key === 'ArrowLeft' ? -d : ev.key === 'ArrowRight' ? d : 0, ev.key === 'ArrowUp' ? -d : ev.key === 'ArrowDown' ? d : 0);
    }
  });
  window.addEventListener('resize', layoutStage);
  new ResizeObserver(layoutStage).observe(stage);

  /* ---------- 시작 ---------- */
  pushHistory();
  renderAll();
  if (Draft.get(S.name) && JSON.stringify(Draft.get(S.name)) !== JSON.stringify(S.deck)) {
    if (confirm('저장하지 않은 임시 작업본이 있습니다. 불러올까요?')) { S.deck = Draft.get(S.name); migrate(S.deck); pushHistory(); renderAll(); markDirty(); }
    else Draft.clear(S.name);
  }
})();
