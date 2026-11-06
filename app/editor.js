/* 교안 편집기 */
'use strict';
(async function () {
  const $ = (id) => document.getElementById(id);
  const S = { name: '', deck: null, cur: 0, sel: [], ssel: [], focus: 'stage', editing: null, k: 1, zoomMode: 'fit', history: [], hi: -1, dirty: false, rev: 0, clip: null, slideClip: null };
  // ssel: 슬라이드 목록에서 함께 잡은 슬라이드 id 들 (현재 슬라이드 포함) · focus: 마지막으로 누른 곳 ('thumbs' 면 Del 이 슬라이드를 지움)
  const stage = $('stage'), overlay = $('overlay'), main = $('main'), props = $('props'), thumbsEl = $('thumbs');
  let slideNode = null, textToolbar = null, saveTimer = null;

  /* ---------- 초기화 ---------- */
  S.name = qs('deck');
  if (!S.name) { location.href = 'gyoan.html'; return; }
  await API.init();
  try { S.deck = await API.load(S.name); }
  catch (e) { alert(e.message); location.href = 'gyoan.html'; return; }
  S.base = S.deck.modified || ''; // 내가 불러온(또는 마지막으로 저장한) 판의 저장 시각
  migrate(S.deck);
  S.cur = clamp(parseInt(qs('slide') || '0', 10) || 0, 0, S.deck.slides.length - 1); S.ssel = [S.deck.slides[S.cur].id];
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
    const snap = JSON.stringify(S.deck), cap = snap.length > 8e6 ? 8 : snap.length > 2e6 ? 25 : 120;
    S.history.push({ deck: snap, cur: S.cur });
    while (S.history.length > cap) S.history.shift();
    S.hi = S.history.length - 1;
    updateUndoButtons();
  }
  function restore(h, at) { // at: 바뀐 일이 일어난 슬라이드 (되돌린 뒤에도 그 슬라이드를 보여 줌)
    S.deck = JSON.parse(h.deck); S.cur = clamp(at == null ? h.cur : at, 0, S.deck.slides.length - 1); S.ssel = [S.deck.slides[S.cur].id];
    S.sel = S.sel.filter(id => elById(id)); S.editing = null; hideTextToolbar();
    renderAll(); markDirty();
  }
  function undo() { if (S.editing) return; flushNudge(); if (S.hi > 0) { const at = S.history[S.hi].cur; S.hi--; restore(S.history[S.hi], at); } }
  function redo() { if (S.editing) return; flushNudge(); if (S.hi < S.history.length - 1) { S.hi++; restore(S.history[S.hi]); } }
  function updateUndoButtons() { $('btnUndo').disabled = S.hi <= 0; $('btnRedo').disabled = S.hi >= S.history.length - 1; }
  let draftWarned = false;
  function draftPut(deck) {
    const ok = Draft.put(S.name, deck || S.deck);
    if (!ok && !draftWarned) { draftWarned = true; toast('이 기기의 임시 저장 공간이 가득 찼습니다 — 미리보기에는 마지막 저장본이 보일 수 있습니다. 저장 단추로 저장해 주세요', 6000); }
    return ok;
  }
  function markDirty() {
    S.dirty = true; S.rev++; $('top').classList.add('is-dirty'); sizeLater();
    // 임시본은 손을 멈춘 뒤 한가할 때 저장 (끌기·입력 중에 멈칫하지 않게)
    clearTimeout(saveTimer); saveTimer = setTimeout(() => (window.requestIdleCallback || (f => f()))(() => draftPut(), { timeout: 3000 }), 800);
  }
  /* 변경 확정: 히스토리 + 더티 + 썸네일 */
  function commit(opts) {
    pushHistory(); markDirty();
    if (opts && opts.all) renderThumbs(); else updateThumb(S.cur);
  }
  /* 저장: 저장 중에 또 누르면(Ctrl+S 연타) 커밋을 두 번 만들지 않고, 끝난 뒤 바뀐 게 있으면 한 번 더 */
  let saving = null, saveAgain = false;
  function save() {
    if (S.editing) endEdit(); flushNudge();
    if (saving) { saveAgain = true; return saving; }
    saving = save1().finally(() => { saving = null; });
    return saving;
  }
  const when = (iso) => { try { return new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(iso); } };
  /* 저장 직전: 내가 불러온 뒤에 다른 곳에서 저장했는지 확인 */
  async function okToOverwrite() {
    if (!S.base) return true;
    const cur = await API.peek(S.name);
    if (!cur || cur <= S.base) return true;
    return confirm(`이 교안이 다른 곳(다른 기기 · 다른 탭)에서 ${when(cur)}에 저장되었습니다.\n지금 저장하면 그쪽에서 고친 내용을 덮어씁니다.\n\n확인: 내 것으로 덮어쓰기\n취소: 저장하지 않음 (이 화면을 새로 고침하면 그쪽 내용을 불러옵니다)`);
  }
  async function save1() {
    if (S.deletedElsewhere && !confirm('이 교안은 목록에서 삭제되었습니다. 저장하면 같은 이름으로 다시 만들어집니다.\n저장할까요?')) return;
    const sb = $('btnSave'), sbHtml = sb.innerHTML; sb.disabled = true; sb.innerHTML = API.mode === 'github' ? '저장 중… (몇 초)' : '저장 중…';
    let retry = false;
    try {
      const r0 = S.rev; // 저장하는 동안(GitHub 은 몇 초) 더 고친 내용은 '수정됨'으로 남김
      if (!(await okToOverwrite())) { saveAgain = false; toast('저장하지 않았습니다'); return; }
      await API.save(S.name, S.deck);
      S.base = S.deck.modified || S.base;
      if (hubBus) hubBus.postMessage({ type: 'saved', name: S.name, tab: TAB });
      S.deletedElsewhere = false;
      if (S.rev === r0) { S.dirty = false; $('top').classList.remove('is-dirty'); Draft.clear(S.name); }
      const up = BIGV.pct();
      if (up != null) toast(`저장했습니다 — 영상은 아직 올리는 중입니다 (${up}%). 다 올라갈 때까지 이 창을 닫지 마세요`, 5000);
      else toast('저장했습니다');
    } catch (e) {
      if (e.noToken || e.status === 401) { // 연결이 없거나 만료: 경고 대신 이 자리에서 바로 연결
        draftPut();
        const ok = await GH.connect({ expired: e.status === 401, reason: e.status === 401 ? '저장해 둔 토큰이 만료되었거나 올바르지 않습니다. 새 토큰을 넣으면 바로 저장합니다.' : '이 기기(브라우저·앱)에는 아직 GitHub 연결이 없습니다. 지금 연결하면 바로 저장합니다.' });
        ghChip();
        if (ok === true) retry = true;
        else toast('이 기기에 임시 저장해 두었습니다 — 연결한 뒤 저장하면 저장소에 올라갑니다', 3500);
      } else alert('저장 실패: ' + e.message);
    } finally { sb.disabled = false; sb.innerHTML = sbHtml; }
    const again = saveAgain && S.dirty; saveAgain = false;
    if (retry || again) { saving = null; return save(); }
  }
  /* 허브(목록)에서 이 교안을 지우거나 이름을 바꾸면 알려 줌 — 지운 교안을 모르고 다시 저장하지 않게 */
  const hubBus = ('BroadcastChannel' in window) ? new BroadcastChannel('gyoan:hub') : null;
  const TAB = uid(); let twinWarned = false;
  const warnTwin = () => { if (twinWarned) return; twinWarned = true; toast('이 교안이 다른 탭(창)에서도 열려 있습니다 — 한쪽에서만 고쳐 주세요. 나중에 저장하는 쪽은 덮어쓸지 물어봅니다', 7000); };
  if (hubBus) hubBus.onmessage = (ev) => {
    const m = ev.data || {}; if (m.name !== S.name) return;
    if (m.type === 'editing' && m.tab !== TAB) { hubBus.postMessage({ type: 'editing-too', name: S.name, tab: TAB }); warnTwin(); }
    if (m.type === 'editing-too' && m.tab !== TAB) warnTwin();
    if (m.type === 'saved' && m.tab !== TAB) toast('다른 탭에서 이 교안을 저장했습니다 — 여기서 저장하면 덮어쓸지 물어봅니다', 6000);
    if (m.type === 'deleted') { S.deletedElsewhere = true; toast('이 교안은 목록에서 삭제되었습니다. 저장하면 같은 이름으로 다시 만들어집니다', 6000); }
    if (m.type === 'renamed' && m.to) { S.name = m.to; history.replaceState(null, '', 'editor.html?deck=' + encodeURIComponent(m.to)); toast('교안 파일 이름이 "' + m.to + '" 으로 바뀌었습니다', 4000); }
  };
  /* 연결 안 된 기기: 경고 창 대신 위쪽에 작은 표시 하나 (누르면 연결) */
  function ghChip() {
    let c = $('ghChip');
    if (API.mode !== 'github' || GH.token) { if (c) c.remove(); return; }
    if (c) return;
    c = document.createElement('button'); c.id = 'ghChip'; c.className = 'btn sm'; c.textContent = '🔗 GitHub 연결';
    c.title = '이 기기에는 아직 연결이 없어 임시 저장만 됩니다. 눌러서 토큰을 한 번 넣으면 저장소에 저장됩니다.';
    c.style.cssText = 'margin-left:8px;border-color:#6b5416;color:#fde68a;background:#2b2410';
    c.onclick = async () => { if ((await GH.connect()) === true) { ghChip(); if (S.dirty) save(); } else ghChip(); };
    $('upStatus').after(c);
  }
  ghChip();
  window.addEventListener('beforeunload', (ev) => { draftNow(); if (S.dirty || API.pending.size || API.failed.size) { ev.preventDefault(); ev.returnValue = ''; } });
  /* 창을 닫거나 다른 앱으로 넘어갈 때(휴대폰): 0.8초 기다리지 않고 바로 임시본 저장 — 쓰는 중인 글도 함께 (글 편집은 그대로 둠) */
  function draftNow() {
    if (!S.deck || (!S.dirty && !S.editing)) return;
    let deck = S.deck;
    const id = S.editing, e = id && elById(id), node = id && nodeOf(id);
    if (e && node) {
      const i = curSlide().elements.indexOf(e);
      deck = JSON.parse(JSON.stringify(S.deck));
      const c = deck.slides[S.cur].elements[i];
      if (e.type === 'table') c.rows = readTableRows(node, e);
      else { const h = editHosts(node, e)[0]; if (h) c.html = cleanHtml(h.innerHTML); }
      if (!S.dirty && JSON.stringify(c) === JSON.stringify(e)) return; // 바뀐 것 없음
    }
    clearTimeout(saveTimer);
    draftPut(deck);
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') draftNow(); });
  window.addEventListener('pagehide', draftNow);
  API.onPending = (n) => { const c = $('upStatus'), pc = BIGV.pct(); c.textContent = !n ? '' : pc != null ? `영상 올리는 중 ${pc}%` + (n > 1 ? ` · 파일 ${n - 1}` : '') : `파일 올리는 중 ${n}`; c.classList.toggle('show', n > 0);  if (!n) sizeLater(); };
  /* ---------- 교안 용량: 이 교안이 쓰는 글·그림·동영상이 얼마나 되는지 ---------- */
  const fmtSize = (b) => b >= 1073741824 ? (b / 1073741824).toFixed(2) + 'GB' : b >= 1048576 ? (b / 1048576 >= 100 ? Math.round(b / 1048576) : (b / 1048576).toFixed(1)) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB';
  let assetSizes = null, assetSizesAt = 0, assetSizesP = null; // 자료 폴더의 파일 크기 (src → 바이트)
  function loadAssetSizes(force) {
    if (API.mode === 'local' || (API.mode === 'github' && !GH.cfg)) return Promise.resolve(null);
    if (!force && assetSizes && Date.now() - assetSizesAt < 60000) return Promise.resolve(assetSizes);
    if (assetSizesP) return assetSizesP;
    assetSizesP = API.assets().then(list => { assetSizes = new Map((list || []).map(a => [a.src, a.size || 0])); assetSizesAt = Date.now(); return assetSizes; }, () => assetSizes)
      .then(r => { assetSizesP = null; return r; });
    return assetSizesP;
  }
  /* { json, files:[{src,name,kind,size,known,slides}], image, video, inline, web, total, unknown } */
  function deckUsage() {
    const json = new Blob([JSON.stringify(S.deck)]).size, map = new Map();
    let inline = 0, web = 0;
    const add = (src, kind, i) => {
      if (!src) return;
      if (/^data:/i.test(src)) { inline += Math.round(Math.max(0, src.length - src.indexOf(',') - 1) * 0.75); return; } // 교안 파일 안에 든 그림 (글·배치 쪽에 이미 들어 있음)
      if (/^https?:/i.test(src) && !BIGV.parse(src)) { web++; return; }
      let f = map.get(src);
      if (!f) {
        const big = BIGV.parse(src); let size = null;
        if (big) size = big.total; else if (API.sizes && API.sizes[src] != null) size = API.sizes[src]; else if (assetSizes && assetSizes.has(src)) size = assetSizes.get(src);
        f = { src, kind, name: big ? big.name : src.replace(/^.*\//, ''), size: size || 0, known: size != null, slides: [] }; map.set(src, f);
      }
      if (!f.slides.includes(i)) f.slides.push(i);
    };
    S.deck.slides.forEach((s, i) => {
      if (s.bg && s.bg.image) add(s.bg.image, 'image', i);
      for (const e of s.elements || []) {
        if (e.type === 'image') add(e.src, 'image', i);
        else if (e.type === 'embed') { const p = parseEmbed(e.url); if (p.kind === 'video') add(e.url, 'video', i); else if (p.kind !== 'none') web++; add(embedPoster(e), 'image', i); }
      }
    });
    const files = Array.from(map.values()).sort((a, b) => b.size - a.size);
    const sum = (k) => files.filter(f => f.kind === k).reduce((a, f) => a + f.size, 0);
    const image = sum('image'), video = sum('video');
    return { json, files, image, video, inline, web, total: json + image + video, unknown: files.filter(f => !f.known).length };
  }
  var sizeTimer = null; // (var: 초기화 도중에 markDirty 가 먼저 불려도 안전하게)
  function sizeLater() { clearTimeout(sizeTimer); sizeTimer = setTimeout(() => (window.requestIdleCallback || (f => f()))(updateSizeChip, { timeout: 2000 }), 900); }
  function updateSizeChip() {
    const b = $('btnSize'); if (!b || !S.deck) return;
    const u = deckUsage(), mb = u.total / 1048576;
    b.textContent = `📦 용량 ${fmtSize(u.total)}${u.unknown ? '+' : ''}`;
    b.dataset.lv = mb >= 500 ? 'big' : mb >= 100 ? 'mid' : 'ok';
  }
  async function showDeckSize() {
    document.querySelectorAll('.modal-bg.size-bg').forEach(n => n.remove());
    const bg = document.createElement('div'); bg.className = 'modal-bg size-bg';
    bg.innerHTML = `<div class="modal size-modal"><h3>📦 이 교안의 용량</h3><p class="muted">계산하는 중…</p></div>`;
    const close = () => bg.remove();
    bg.onclick = (ev) => {
      if (ev.target === bg || ev.target.closest('[data-close]')) { close(); return; }
      const r = ev.target.closest('.r[data-slide]'); if (r) { close(); gotoSlide(+r.dataset.slide); }
    };
    bg.tabIndex = -1; bg.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Escape') close(); });
    document.body.appendChild(bg); bg.focus();
    await loadAssetSizes(true);
    if (!bg.isConnected) return;
    const u = deckUsage(); updateSizeChip();
    const K = { json: ['글 · 배치', '#9aa7bd'], image: ['그림', '#5b9bff'], video: ['동영상', '#f5b82e'] };
    const parts = [['json', u.json], ['image', u.image], ['video', u.video]].filter(p => p[1] > 0);
    const nImg = u.files.filter(f => f.kind === 'image').length, nVid = u.files.filter(f => f.kind === 'video').length;
    const top = u.files[0] ? u.files[0].size : 0;
    const slidesOf = (f) => { const a = f.slides.map(i => i + 1); return '슬라이드 ' + (a.length > 4 ? a.slice(0, 4).join(', ') + ' 외 ' + (a.length - 4) + '곳' : a.join(', ')); };
    const store = assetSizes ? Array.from(assetSizes.values()).reduce((a, b) => a + b, 0) : 0;
    const notes = [];
    if (u.unknown) notes.push(`크기를 확인하지 못한 파일 ${u.unknown}개는 합계에서 빠져 있습니다 (저장소에 아직 없거나 찾을 수 없는 파일).`);
    if (u.inline) notes.push(`교안 파일 안에 직접 들어 있는 그림이 ${fmtSize(u.inline)} 있습니다 (“글 · 배치”에 포함). GitHub 에 연결해 저장하면 따로 빠져서 교안이 가벼워집니다.`);
    if (u.web) notes.push(`유튜브 영상 · 웹 페이지처럼 주소로 연결한 것 ${u.web}개는 용량에 들어가지 않습니다.`);
    notes.push('같은 파일을 여러 슬라이드에 써도 한 번만 셉니다.');
    if (assetSizes) notes.push(`참고: 저장소의 자료 폴더(모든 교안의 그림·작은 영상)는 모두 ${fmtSize(store)} · 파일 ${assetSizes.size}개입니다.` + (API.mode === 'github' ? ' 6MB 가 넘는 영상은 따로 보관되어 여기에 들어가지 않습니다.' : ''));
    bg.querySelector('.modal').innerHTML = `<h3>📦 이 교안의 용량</h3>
      <div class="size-total"><b>${fmtSize(u.total)}${u.unknown ? '<small>+</small>' : ''}</b><span>슬라이드 ${S.deck.slides.length}장 · 그림 ${nImg}개 · 동영상 ${nVid}개</span></div>
      <div class="size-bar">${parts.map(([k, v]) => `<i style="flex:${v} 0 0;background:${K[k][1]}" title="${K[k][0]} ${fmtSize(v)}"></i>`).join('')}</div>
      <div class="size-legend">${parts.map(([k, v]) => `<span style="--k:${K[k][1]}">${K[k][0]} <b>${fmtSize(v)}</b> <em>${Math.round(v / u.total * 100)}%</em></span>`).join('')}</div>
      ${u.files.length ? `<h4>큰 파일부터 <span class="muted">누르면 그 슬라이드로 갑니다</span></h4>
      <div class="size-list">${u.files.slice(0, 60).map(f => `<div class="r" data-slide="${f.slides[0]}" title="${esc(f.name)}"><span class="ki ${f.kind}">${f.kind === 'video' ? '▶' : '🖼'}</span><span class="nm">${esc(f.name)}</span><span class="sl">${slidesOf(f)}</span><span class="sz">${f.known ? fmtSize(f.size) : '모름'}</span><i class="mt" style="width:${top ? Math.max(1, Math.round(f.size / top * 100)) : 0}%;background:${K[f.kind][1]}"></i></div>`).join('')}</div>${u.files.length > 60 ? `<p class="size-note">작은 파일 ${u.files.length - 60}개는 줄였습니다.</p>` : ''}` : '<p class="muted">이 교안에는 그림·동영상 파일이 없습니다.</p>'}
      <div class="size-note">${notes.map(n => '· ' + esc(n)).join('<br>')}</div>
      <div class="actions"><button class="btn" data-close>닫기</button></div>`;
  }
  $('btnSize').onclick = showDeckSize;
  sizeLater(); loadAssetSizes().then(sizeLater);

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
    { const gb = $('btnGroup'), els = selEls(); if (!gb.dataset.l) gb.dataset.l = gb.innerHTML; // 묶인 것을 잡았으면 '풀기'
      const un = els.length > 1 && els.every(e => e.group && e.group === els[0].group); gb.innerHTML = un ? gb.dataset.l.replace('묶기', '풀기') : gb.dataset.l; gb.classList.toggle('active', un); }
    renderLayers();
  }
  function rerenderEl(id) {
    const e = elById(id); const old = nodeOf(id); if (!e || !old) return;
    const n = renderElement(e, theme(), 'edit');
    old.replaceWith(n); markSelection();
  }
  function renderOverlay() {
    const guides = Array.from(overlay.querySelectorAll('.guide')); // 끌기·크기 조절 중 붙는 자리 안내선은 지우지 않음
    overlay.innerHTML = ''; guides.forEach(g => overlay.appendChild(g));
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
    const pts = { nw: [-hw, -hh], n: [0, -hh], ne: [hw, -hh], e: [hw, 0], se: [hw, hh], s: [0, hh], sw: [-hw, hh], w: [-hw, 0], rot: [0, -hh - (e.type === 'table' && !e.rotate ? tabSize() + 22 : 28)] }; // 표는 위에 ✕ 줄이 있어 회전 손잡이를 더 위로
    const small = e.w * k < 40 || e.h * k < 40;
    for (const [h, [dx, dy]] of Object.entries(pts)) {
      if (small && h.length === 1 && h !== 'rot') continue;
      const d = document.createElement('div'); d.className = 'handle ' + h; d.dataset.h = h;
      d.style.left = (cx + dx * cos - dy * sin) + 'px'; d.style.top = (cy + dx * sin + dy * cos) + 'px';
      d.title = h === 'rot' ? '회전 (Shift: 15° 단위)' : '';
      overlay.appendChild(d);
    }
    if (e.type === 'table' && !e.rotate) renderTableTabs(e);
  }
  /* 표를 잡으면 위·왼쪽에 줄마다 ✕ 손잡이: 누르면 그 열·행을 바로 지움 (올리면 지워질 줄이 빨갛게) · 끝의 ＋ 는 열·행 추가
     한 번 누른 칸은 점선으로 표시 — 속성 창·오른쪽 단추 메뉴의 추가/삭제가 그 칸 기준 */
  function tabSize() { return window.matchMedia && matchMedia('(pointer: coarse)').matches ? 24 : 15; } // 손가락으로 누르는 기기에서는 크게
  function renderTableTabs(e) {
    const node = nodeOf(e.id); if (!node || !e.rows || !e.rows.length) return;
    const o = overlay.getBoundingClientRect(), nb = node.getBoundingClientRect();
    const L = nb.left - o.left, T = nb.top - o.top, W = nb.width, H = nb.height;
    const nr = e.rows.length, nc = e.rows[0] ? e.rows[0].length : 1;
    const sz = tabSize(), gap = 7, off = sz + gap;
    const mk = (cls, txt, title, x, y, w, h, fn, hl) => {
      const d = document.createElement('div'); d.className = 'ttab ' + cls; d.textContent = txt; d.title = title;
      d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.width = Math.max(4, w) + 'px'; d.style.height = Math.max(4, h) + 'px';
      d.onclick = (ev) => { ev.stopPropagation(); fn(); };
      if (hl) {
        let mark = null;
        d.onpointerenter = () => { mark = document.createElement('div'); mark.className = 'thl'; mark.style.left = hl[0] + 'px'; mark.style.top = hl[1] + 'px'; mark.style.width = hl[2] + 'px'; mark.style.height = hl[3] + 'px'; overlay.appendChild(mark); };
        d.onpointerleave = () => { if (mark) mark.remove(); mark = null; };
      }
      overlay.appendChild(d);
    };
    let x = L;
    tableWeights(e.cols, nc).forEach((wt, i) => {
      const w = wt * W;
      if (nc > 1) mk('c', w >= 12 ? '✕' : '', `${i + 1}열 삭제`, x + 1, T - off, w - 2, sz, () => tableOp('colDel', { c: i }), [x, T, w, H]);
      x += w;
    });
    mk('add', '＋', '오른쪽 끝에 열 추가', L + W + 4, T - off, sz, sz, () => tableOp('colAdd', { c: nc - 1 }));
    Array.from(node.querySelectorAll('tr')).forEach((tr, i) => {
      const b = tr.getBoundingClientRect(); const y = b.top - o.top, h = Math.min(b.bottom, nb.bottom) - b.top; if (h <= 0) return;
      if (nr > 1) mk('r', h >= 12 ? '✕' : '', `${i + 1}행 삭제`, L - off, y + 1, sz, h - 2, () => tableOp('rowDel', { r: i }), [L, y, W, h]);
    });
    mk('add', '＋', '맨 아래에 행 추가', L - off, T + H + 4, sz, sz, () => tableOp('rowAdd', { r: nr - 1 }));
    if (!S.editing && S.cell && S.cell.id === e.id) {
      const td = node.querySelector(`[data-r="${S.cell.r}"][data-c="${S.cell.c}"]`);
      if (td) { const b = td.getBoundingClientRect(); const d = document.createElement('div'); d.className = 'cellmark'; d.style.left = (b.left - o.left) + 'px'; d.style.top = (b.top - o.top) + 'px'; d.style.width = b.width + 'px'; d.style.height = b.height + 'px'; overlay.appendChild(d); }
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
    const t = document.createElement('div'); t.className = 'thumb' + (i === S.cur ? ' active' : '') + (S.ssel.includes(s.id) && i !== S.cur ? ' multi' : '') + (s.hidden ? ' hid' : ''); t.dataset.i = i; t.draggable = true;
    t.style.aspectRatio = SLIDE_W + ' / ' + SLIDE_H;
    t._draw = () => { t._draw = null; const sl = renderSlide(s, S.deck, { mode: 'thumb' }); t.insertBefore(sl, t.firstChild); requestAnimationFrame(() => fitSlide(t, sl)); };
    if (thumbIO && i !== S.cur) thumbIO.observe(t); else t._draw();
    const n = document.createElement('div'); n.className = 'n'; n.textContent = i + 1; t.appendChild(n);
    const ms = maxStep(s); if (ms > 0) { const b = document.createElement('div'); b.className = 'steps'; b.textContent = `▸${ms}`; t.appendChild(b); }
    if (s.hidden) { const b = document.createElement('div'); b.className = 'hidb'; b.textContent = '숨김'; t.appendChild(b); }
    const trn = s.transition === 'morph' || (!s.transition && S.deck.transition === 'morph'); if (trn && i > 0) { const b = document.createElement('div'); b.className = 'trb'; b.textContent = '✨'; b.title = '모핑 전환'; t.appendChild(b); }
    t.onclick = (ev) => {
      S.focus = 'thumbs';
      if (ev.shiftKey) { // Shift: 현재 슬라이드부터 여기까지 범위
        const a = Math.min(S.cur, i), b = Math.max(S.cur, i);
        const ids = S.deck.slides.slice(a, b + 1).map(x => x.id);
        S.ssel = Array.from(new Set(S.ssel.concat(ids))); gotoSlide(i, true); return;
      }
      if (ev.ctrlKey || ev.metaKey) { // Ctrl: 하나씩 더하거나 빼기
        const id = S.deck.slides[i].id;
        if (S.ssel.includes(id)) { if (S.ssel.length > 1) { S.ssel = S.ssel.filter(x => x !== id); if (i === S.cur) { gotoSlide(S.deck.slides.findIndex(x => x.id === S.ssel[0]), true); return; } markSlideSel(); } return; }
        S.ssel = S.ssel.concat(id); gotoSlide(i, true); return;
      }
      gotoSlide(i);
    };
    t.oncontextmenu = (ev) => { ev.preventDefault(); S.focus = 'thumbs'; if (!S.ssel.includes(S.deck.slides[i].id)) gotoSlide(i); else gotoSlide(i, true); showMenu(ev.clientX, ev.clientY, slideMenuItems()); };
    t.ondragstart = (ev) => { if (!S.ssel.includes(S.deck.slides[i].id)) gotoSlide(i); ev.dataTransfer.setData('text/slide', String(i)); ev.dataTransfer.effectAllowed = 'move'; };
    t.ondragover = (ev) => { if (ev.dataTransfer.types.includes('text/slide')) { ev.preventDefault(); t.classList.add('dragover'); } };
    t.ondragleave = () => t.classList.remove('dragover');
    t.ondrop = (ev) => {
      ev.preventDefault(); t.classList.remove('dragover');
      const from = parseInt(ev.dataTransfer.getData('text/slide'), 10); if (isNaN(from) || from === i) return;
      // 함께 잡은 슬라이드는 묶어서 옮김 (순서는 그대로)
      const moving = S.deck.slides.filter(x => S.ssel.includes(x.id)); if (!moving.length) moving.push(S.deck.slides[from]);
      const target = S.deck.slides[i]; if (moving.includes(target)) return;
      const rest = S.deck.slides.filter(x => !moving.includes(x)); let at = rest.indexOf(target); if (i > from) at += 1;
      rest.splice(at, 0, ...moving); S.deck.slides = rest; S.cur = S.deck.slides.indexOf(moving[0]);
      commit({ all: true }); renderStage(); renderProps(); updateTop();
    };
    return t;
  }
  function updateThumb(i) {
    const old = thumbsEl.children[i]; if (!old) { renderThumbs(); return; }
    old.replaceWith(makeThumb(S.deck.slides[i], i));
  }
  function markSlideSel() { thumbsEl.querySelectorAll('.thumb').forEach((t, j) => { t.classList.toggle('active', j === S.cur); t.classList.toggle('multi', j !== S.cur && S.ssel.includes(S.deck.slides[j].id)); }); }
  function selSlides() { const cur = curSlide(); if (!S.ssel.includes(cur.id)) S.ssel = [cur.id]; const l = S.deck.slides.filter(s => S.ssel.includes(s.id)); return l.length ? l : [cur]; }
  function gotoSlide(i, keepSel) {
    if (S.editing) endEdit(); flushNudge();
    S.cur = clamp(i, 0, S.deck.slides.length - 1); S.sel = [];
    if (!keepSel) S.ssel = [curSlide().id]; else if (!S.ssel.includes(curSlide().id)) S.ssel = S.ssel.concat(curSlide().id);
    markSlideSel();
    { const ct = thumbsEl.children[S.cur]; if (ct && ct._draw) ct._draw(); }
    renderStage(); renderProps(); updateTop();
    const t = thumbsEl.children[S.cur]; if (t) t.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- 슬라이드 조작 ---------- */
  function addSlide(layout, after) {
    if (S.editing) endEdit();
    const s = newSlide(layout);
    const at = (after == null ? S.cur : after) + 1;
    S.deck.slides.splice(at, 0, s); S.cur = at; S.sel = []; S.ssel = [s.id];
    commit({ all: true }); renderStage(); renderProps(); updateTop();
    thumbsEl.children[S.cur]?.scrollIntoView({ block: 'nearest' });
  }
  function duplicateSlide() {
    const src = selSlides(); const last = Math.max(...src.map(s => S.deck.slides.indexOf(s)));
    const copies = src.map(o => { const s = clone(o); s.id = uid(); s.elements.forEach(e => { e.mk = e.mk || e.id; e.id = uid(); }); return s; }); // mk: 모핑 때 같은 요소로 인식
    S.deck.slides.splice(last + 1, 0, ...copies); S.cur = last + 1; S.sel = []; S.ssel = copies.map(s => s.id);
    commit({ all: true }); renderStage(); renderProps(); updateTop();
  }
  /* 잡은 슬라이드(여러 장이면 모두) 삭제 · 되돌리기는 Ctrl+Z */
  function deleteSlide() {
    const del = selSlides();
    if (del.length >= S.deck.slides.length) { toast('슬라이드를 모두 지울 수는 없습니다 (한 장은 남겨야 합니다)'); return; }
    const first = Math.min(...del.map(s => S.deck.slides.indexOf(s)));
    S.deck.slides = S.deck.slides.filter(s => !del.includes(s)); S.cur = clamp(first, 0, S.deck.slides.length - 1); S.sel = []; S.ssel = [curSlide().id];
    commit({ all: true }); renderStage(); renderProps(); updateTop();
    toast(`슬라이드 ${del.length}장 삭제 · Ctrl+Z 로 되돌리기`, 2600);
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
      { label: selSlides().length > 1 ? `슬라이드 ${selSlides().length}장 삭제` : '슬라이드 삭제', kbd: 'Delete', danger: true, fn: deleteSlide },
    ];
  }

  /* ---------- 요소 조작 ---------- */
  function addElement(e, select) {
    if (S.editing) endEdit();
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
    const wasEditing = !!S.editing; if (wasEditing) endEdit(); // 쓰던 글을 먼저 저장 (그 글 상자를 그림으로 바꾸지는 않음)
    try {
      const prep = await prepareImage(file);          // 크기·용량 최적화 (브라우저 안에서)
      const src = await API.stage(prep.blob, prep.name); // 바로 넣고, 업로드는 뒤에서
      // 상자(이미지 틀·도형·글 상자)가 하나 잡혀 있으면 그 자리에 채움 (붙여넣기 Ctrl+V · 끌어다 놓기)
      const tgt = at && at.into ? elById(at.into) : (!at && S.sel.length === 1 ? elById(S.sel[0]) : null);
      if (tgt && tgt.type === 'image') { tgt.src = src; commit(); rerenderEl(tgt.id); renderOverlay(); renderProps(); toast(tgt.src ? '이미지를 상자에 넣었습니다' : ''); return; }
      if (tgt && (tgt.type === 'shape' || tgt.type === 'text') && !S.editing && !wasEditing) { replaceBox(tgt, imageEl(tgt.x, tgt.y, tgt.w, tgt.h, src, { radius: tgt.radius || 0, shadow: !!tgt.shadow, fit: 'cover' })); toast('상자에 이미지를 넣었습니다 · 되돌리기 Ctrl+Z'); return; }
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
  /* 잡은 상자를 같은 자리·같은 순서의 다른 요소로 바꿈 (이미지·동영상 넣기) */
  function replaceBox(old, nu) {
    const els = curSlide().elements, i = els.indexOf(old); if (i < 0) return;
    nu.id = old.id; nu.step = old.step; nu.anim = old.anim; if (old.group) nu.group = old.group; if (old.link) nu.link = old.link; if (old.mk) nu.mk = old.mk;
    els[i] = nu; S.sel = [nu.id]; commit(); renderStage(); renderProps();
  }
  /* 유튜브 주소·공유 코드(<iframe …>)·mp4 주소를 잡은 상자에 넣거나 새로 만듦 */
  function putEmbed(text) {
    let url = String(text || '').trim();
    const m = url.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i); if (m) url = m[1]; // 공유 → 퍼가기 코드
    const p = parseEmbed(url); if (p.kind === 'none' || (p.kind === 'web' && !m)) return false;
    const tgt = S.sel.length === 1 && !S.editing ? elById(S.sel[0]) : null;
    if (tgt && tgt.type === 'embed') { tgt.url = url; commit(); rerenderEl(tgt.id); renderProps(); toast('동영상 주소를 바꿨습니다'); return true; }
    if (tgt && (tgt.type === 'shape' || tgt.type === 'image' || tgt.type === 'text')) { replaceBox(tgt, embedEl(tgt.x, tgt.y, tgt.w, tgt.h, url, { radius: tgt.radius || 0, shadow: !!tgt.shadow })); toast('상자에 동영상을 넣었습니다 · ▶ 를 누르면 바로 재생 · 되돌리기 Ctrl+Z', 3000); return true; }
    const [x, y] = centerBox(1280, 720); addElement(embedEl(x, y, 1280, 720, url)); toast('동영상을 넣었습니다 · ▶ 를 누르면 바로 재생'); return true;
  }

  /* ---------- 동영상 파일 (PC 의 파일 · PPT 안의 영상) ---------- */
  const VIDEO_EXT = /\.(mp4|m4v|mov|webm|ogv|wmv|avi|mkv|mpg|mpeg|asf|3gp|flv)$/i;
  function isVideoFile(f) { return !!f && (/^video\//.test(f.type || '') || VIDEO_EXT.test(f.name || '')); }
  function isPptFile(f) { return !!f && /\.(pptx|ppsx|pptm|ppsm|potx|ppt|pps)$/i.test(f.name || ''); }
  /* 브라우저가 이 영상을 틀 수 있는지 확인하고, 화면 크기·길이·표지 그림(영상의 한 장면)을 얻음 */
  function probeVideo(blob, at) {
    return new Promise((res) => {
      const url = URL.createObjectURL(blob), v = document.createElement('video');
      let done = false, meta = null;
      const finish = (o) => { if (done) return; done = true; clearTimeout(timer); v.onerror = v.onseeked = v.onloadedmetadata = null; try { v.removeAttribute('src'); v.load(); } catch (e) { } URL.revokeObjectURL(url); res(o); };
      const noPoster = () => finish(Object.assign(meta, { poster: null }));
      const timer = setTimeout(() => { if (meta) noPoster(); else finish({ ok: false }); }, 12000);
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      v.onerror = () => { if (meta) noPoster(); else finish({ ok: false }); };
      v.onloadedmetadata = () => {
        if (!v.videoWidth || !v.videoHeight) { finish({ ok: false }); return; } // 소리만 나오고 화면은 못 푸는 형식
        meta = { ok: true, w: v.videoWidth, h: v.videoHeight, dur: isFinite(v.duration) ? v.duration : 0 };
        const t = at > 0 ? at + 0.1 : Math.min(2, meta.dur * 0.1);
        try { v.currentTime = Math.max(0, Math.min(t, meta.dur - 0.05)); } catch (e) { noPoster(); }
      };
      v.onseeked = () => {
        try {
          const k = Math.min(1, 960 / meta.w), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(meta.w * k)); c.height = Math.max(1, Math.round(meta.h * k));
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
          c.toBlob(b => finish(Object.assign(meta, { poster: b || null })), 'image/jpeg', 0.8);
        } catch (e) { noPoster(); }
      };
      v.src = url;
    });
  }
  /* 동영상 파일을 넣음: 상자가 하나 잡혀 있으면 그 자리에, 아니면 새 상자로. opt = { poster(Blob), start(초), trimEnd(끝에서 잘라낸 초) } */
  async function insertVideoFile(file, at, opt) {
    opt = opt || {}; if (!file) return false;
    const wasEditing = !!S.editing; if (wasEditing) endEdit();
    if (API.mode === 'local' || (API.mode === 'github' && !GH.token)) { alert('동영상 파일은 저장소에 연결된 뒤에 넣을 수 있습니다.\n교안 작업장 첫 화면의 [GitHub 연결] 을 먼저 해 주세요.\n(유튜브 주소는 지금도 붙여넣을 수 있습니다)'); return false; }
    const mb = file.size / 1048576, mbs = mb >= 10 ? Math.round(mb) : mb.toFixed(1);
    const reuse = opt.reuse && API.blobs[opt.reuse.src] ? opt.reuse : null; // 이 화면에서 이미 올린 같은 영상 → 다시 올리지 않음
    const big = API.mode === 'github' && file.size > BIGV.LIMIT; // 큰 영상: 조각으로 나눠 올림 (100MB 가 넘어도 됨)
    if (reuse) { /* 묻지 않음 */ }
    else if (big) {
      if (file.size > BIGV.MAX) { alert(`이 영상은 ${mbs}MB 입니다.\n1GB(1024MB)가 넘는 영상은 올릴 수 없습니다.\n\n· 영상을 줄여서 다시 넣거나 (PowerPoint: 파일 → 정보 → 미디어 압축)\n· 유튜브에 올린 뒤 그 주소를 붙여넣어 주세요.`); return false; }
      if (mb > 30 && !confirm(`이 영상은 ${mbs}MB 입니다.\n큰 영상은 여러 조각으로 나눠 올립니다. (재생할 때는 한 영상으로 이어집니다)\n\n· 올리는 데 인터넷 속도에 따라 몇 분에서 수십 분이 걸립니다.\n· 화면 위쪽의 "영상 올리는 중 …%" 가 사라질 때까지 이 창을 닫지 마세요.\n· 그동안 편집 · 저장 · ▶ 재생은 그대로 할 수 있습니다.\n\n계속할까요?`)) return false;
    } else if (mb > 95) {
      if (!confirm(`이 영상은 ${mbs}MB 입니다.\n이 PC 에서는 재생되지만, 100MB 가 넘는 파일은 이 PC 화면에서는 GitHub(인터넷 사이트)에 올라가지 않습니다.\n인터넷 사이트(github.io)에서 교안을 열어 넣으면 100MB 가 넘는 영상도 올라갑니다.\n\n그래도 이 PC 에만 넣을까요?`)) return false;
    }
    if (!reuse) toast('영상을 확인하는 중…', 15000);
    const info = reuse || await probeVideo(file, opt.start || 0);
    if (!info.ok) {
      toast('영상을 넣지 못했습니다');
      const ext = ((file.name || '').match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
      alert(`이 영상${ext ? '(.' + ext + ')' : ''}은 웹 브라우저에서 재생되지 않는 형식입니다.\nmp4(H.264) 형식으로 바꾼 뒤 다시 넣어 주세요.\n\n· PowerPoint 에 들어 있는 영상이면 [파일 → 정보 → 미디어 압축] 으로 바뀌는 경우가 많습니다.`);
      return false;
    }
    try {
      let name = (file.name || 'video.mp4').replace(/^.*[\\/]/, '');
      if (!/\.(mp4|webm|ogv|mov|m4v)$/i.test(name)) name = name.replace(/\.[^.]*$/, '') + (/webm/i.test(file.type || '') ? '.webm' : '.mp4'); // 주소만 보고도 동영상인 줄 알도록
      const src = reuse ? reuse.src : big ? API.stageBig(file, name) : await API.stage(file, name);
      let poster = reuse ? reuse.poster : '';
      if (!reuse) try {
        if (opt.poster) { const pp = await prepareImage(new File([opt.poster], name.replace(/\.[^.]+$/, '') + '-poster.png', { type: opt.poster.type || 'image/png' })); poster = await API.stage(pp.blob, pp.name); }
        else if (info.poster) poster = await API.stage(info.poster, name.replace(/\.[^.]+$/, '') + '-poster.jpg');
      } catch (e) { if (info.poster) { try { poster = await API.stage(info.poster, name.replace(/\.[^.]+$/, '') + '-poster.jpg'); } catch (e2) { } } }
      if (opt.onStaged) opt.onStaged({ ok: true, src, poster, w: info.w, h: info.h, dur: info.dur });
      const extra = { posterOf: src }; if (poster) extra.poster = poster;
      const st = Math.max(0, Math.round((opt.start || 0) * 10) / 10), en = opt.trimEnd && info.dur ? Math.round((info.dur - opt.trimEnd) * 10) / 10 : 0;
      if (st) extra.start = st; if (en > st) extra.end = en;
      const tail = (big && !reuse ? ' · 영상은 뒤에서 계속 올라갑니다 (위쪽 %)' : '') + ' · ▶ 를 누르면 바로 재생 · 되돌리기 Ctrl+Z';
      // 상자(동영상·이미지 틀·도형·글 상자)가 하나 잡혀 있으면 그 자리에 채움 (붙여넣기 Ctrl+V · 끌어다 놓기)
      const tgt = at && at.into ? elById(at.into) : (!at && S.sel.length === 1 ? elById(S.sel[0]) : null);
      if (tgt && tgt.type === 'embed') {
        tgt.url = src; tgt.posterOf = src; if (poster) tgt.poster = poster; else delete tgt.poster;
        if (extra.start) tgt.start = extra.start; else delete tgt.start; if (extra.end) tgt.end = extra.end; else delete tgt.end;
        commit(); rerenderEl(tgt.id); renderProps(); toast('상자의 동영상을 바꿨습니다' + tail, 3500); return true;
      }
      if (tgt && (tgt.type === 'image' || ((tgt.type === 'shape' || tgt.type === 'text') && !wasEditing))) {
        replaceBox(tgt, embedEl(tgt.x, tgt.y, tgt.w, tgt.h, src, Object.assign({ radius: tgt.radius || 0, shadow: !!tgt.shadow }, extra)));
        toast('상자에 동영상을 넣었습니다' + tail, 3500); return true;
      }
      const r = Math.min(1280 / info.w, 720 / info.h), w = Math.round(info.w * r), h = Math.round(info.h * r);
      const x = at ? Math.round(at.x - w / 2) : Math.round((SLIDE_W - w) / 2), y = at ? Math.round(at.y - h / 2) : Math.round((SLIDE_H - h) / 2);
      addElement(embedEl(clamp(x, 0, SLIDE_W - w), clamp(y, 0, SLIDE_H - h), w, h, src, extra));
      toast('동영상을 넣었습니다' + tail, 3500); return true;
    } catch (e) { alert('동영상 삽입 실패: ' + e.message); return false; }
  }

  /* ---------- PPT(.pptx) 안의 영상 꺼내기 ----------
     PowerPoint 에서 영상을 복사하면 클립보드에는 표지 그림만 담기고 영상은 PowerPoint 안에 남습니다.
     그래서 PPT 파일을 직접 열어(pptx 는 ZIP 묶음) 그 안의 영상을 꺼냅니다. 필요한 부분만 읽으므로 큰 파일도 빠릅니다. */
  async function zipIndex(file) {
    const n = Math.min(file.size, 65557 + 20), tail = new Uint8Array(await file.slice(file.size - n).arrayBuffer()), tv = new DataView(tail.buffer);
    let p = -1; for (let i = tail.length - 22; i >= 0; i--) if (tv.getUint32(i, true) === 0x06054b50) { p = i; break; }
    if (p < 0) throw new Error('PowerPoint 파일(.pptx)이 아닙니다');
    let cdSize = tv.getUint32(p + 12, true), cdOfs = tv.getUint32(p + 16, true);
    if (cdOfs === 0xFFFFFFFF && p >= 20 && tv.getUint32(p - 20, true) === 0x07064b50) { // 4GB 넘는 묶음 (zip64)
      const o = Number(tv.getBigUint64(p - 12, true)), z = new DataView(await file.slice(o, o + 56).arrayBuffer());
      cdSize = Number(z.getBigUint64(40, true)); cdOfs = Number(z.getBigUint64(48, true));
    }
    const cd = new Uint8Array(await file.slice(cdOfs, cdOfs + cdSize).arrayBuffer()), dv = new DataView(cd.buffer), dec = new TextDecoder('utf-8');
    const out = new Map();
    for (let q = 0; q + 46 <= cd.length && dv.getUint32(q, true) === 0x02014b50;) {
      const method = dv.getUint16(q + 10, true), nlen = dv.getUint16(q + 28, true), xlen = dv.getUint16(q + 30, true), clen = dv.getUint16(q + 32, true);
      let csize = dv.getUint32(q + 20, true), usize = dv.getUint32(q + 24, true), lofs = dv.getUint32(q + 42, true);
      const name = dec.decode(cd.subarray(q + 46, q + 46 + nlen));
      for (let x = q + 46 + nlen, xe = x + xlen; x + 4 <= xe;) { // zip64 덧붙임
        const id = dv.getUint16(x, true), sz = dv.getUint16(x + 2, true); let y = x + 4;
        if (id === 1) { if (usize === 0xFFFFFFFF) { usize = Number(dv.getBigUint64(y, true)); y += 8; } if (csize === 0xFFFFFFFF) { csize = Number(dv.getBigUint64(y, true)); y += 8; } if (lofs === 0xFFFFFFFF) lofs = Number(dv.getBigUint64(y, true)); }
        x += 4 + sz;
      }
      if (!name.endsWith('/')) out.set(name, { method, csize, usize, lofs });
      q += 46 + nlen + xlen + clen;
    }
    return out;
  }
  async function zipBlob(file, ent, type) {
    if (!ent) throw new Error('파일 안에서 찾지 못했습니다');
    const lh = new DataView(await file.slice(ent.lofs, ent.lofs + 30).arrayBuffer());
    if (lh.getUint32(0, true) !== 0x04034b50) throw new Error('파일이 바뀌었거나 손상되었습니다');
    const start = ent.lofs + 30 + lh.getUint16(26, true) + lh.getUint16(28, true), raw = file.slice(start, start + ent.csize);
    if (ent.method === 0) return new Blob([await raw.arrayBuffer()], { type: type || '' });
    if (ent.method !== 8) throw new Error('지원하지 않는 압축 방식입니다');
    const b = await new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
    return new Blob([b], { type: type || '' });
  }
  const PPT_MIME = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', wmv: 'video/x-ms-wmv', avi: 'video/x-msvideo', mpg: 'video/mpeg', mpeg: 'video/mpeg', mkv: 'video/x-matroska', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp' };
  const extOf = (s) => ((String(s || '').match(/\.([a-z0-9]+)$/i) || [, ''])[1]).toLowerCase();
  function pptRels(xml, base) { // 관계 파일 → Map(rId → { type, target(묶음 안 경로), external })
    const m = new Map(), dir = base.split('/').slice(0, -1);
    for (const tag of xml.match(/<Relationship\b[^>]*>/g) || []) {
      const a = {}; tag.replace(/([\w:]+)="([^"]*)"/g, (_, k, v) => { a[k] = v.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'); return ''; });
      if (!a.Id) continue;
      const external = a.TargetMode === 'External'; let target = a.Target || '';
      if (!external) { const parts = target.startsWith('/') ? [] : dir.slice(); for (const s of target.split('/')) { if (s === '..') parts.pop(); else if (s && s !== '.') parts.push(s); } target = parts.join('/'); }
      m.set(a.Id, { type: a.Type || '', target, external });
    }
    return m;
  }
  async function readPptVideos(file) {
    const idx = await zipIndex(file), text = async (n) => (await zipBlob(file, idx.get(n))).text();
    if (!idx.has('ppt/presentation.xml')) throw new Error('PowerPoint 파일(.pptx)이 아닙니다');
    let order = [];
    try { // 슬라이드 순서 (파일 번호와 다를 수 있음)
      const rels = pptRels(await text('ppt/_rels/presentation.xml.rels'), 'ppt/presentation.xml'), pres = await text('ppt/presentation.xml');
      for (const m of pres.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)) { const r = rels.get(m[1]); if (r && idx.has(r.target)) order.push(r.target); }
    } catch (e) { }
    if (!order.length) order = Array.from(idx.keys()).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.slice(16)) - parseInt(b.slice(16)));
    const vids = [];
    for (let i = 0; i < order.length; i++) {
      const sp = order[i], rn = sp.replace(/([^/]+)$/, '_rels/$1.rels'); if (!idx.has(rn)) continue;
      const rels = pptRels(await text(rn), sp);
      if (!Array.from(rels.values()).some(r => /\/(video|media)$/.test(r.type))) continue;
      const doc = new DOMParser().parseFromString(await text(sp), 'application/xml');
      const one = (el, n) => el.getElementsByTagNameNS('*', n)[0];
      for (const pic of Array.from(doc.getElementsByTagNameNS('*', 'pic'))) {
        const vf = one(pic, 'videoFile'); if (!vf) continue;
        const md = one(pic, 'media'), blip = one(pic, 'blip'), nm = one(pic, 'cNvPr'), trim = one(pic, 'trim');
        const r = (md && rels.get(md.getAttribute('r:embed') || md.getAttribute('r:link') || '')) || rels.get(vf.getAttribute('r:link') || ''); if (!r) continue;
        const pr = blip && rels.get(blip.getAttribute('r:embed') || ''), ent = r.external ? null : idx.get(r.target);
        const v = { slide: i + 1, name: (nm && nm.getAttribute('name')) || '동영상', path: r.target, ext: extOf(r.target), ent, size: ent ? ent.usize : 0,
          posterEnt: pr && !pr.external && /^(png|jpe?g|gif|bmp)$/.test(extOf(pr.target)) ? idx.get(pr.target) : null, posterExt: pr ? extOf(pr.target) : '',
          start: trim ? (parseFloat(trim.getAttribute('st')) || 0) / 1000 : 0, trimEnd: trim ? (parseFloat(trim.getAttribute('end')) || 0) / 1000 : 0 };
        if (!ent) { if (/^https?:\/\//i.test(r.target)) v.url = r.target; else v.linked = true; }
        vids.push(v);
      }
    }
    return vids;
  }
  /* S.ppt = 지금 열어 둔 PPT { name, file, vids, syms } — 이 화면을 닫을 때까지 기억 (PPT 에서 복사해 붙여넣은 영상을 알아보는 데도 씀) */
  /* ---------- PPT 심벌 창 ----------
     PPT 파일을 열면 그 안의 그림·도형·묶음을 하나씩 꺼내 작은 창에 늘어놓습니다 (app/pptsym.js).
     심벌을 끌어서 슬라이드의 원하는 자리에 놓거나, [내 심벌] 창 위에 놓아 모아 둘 수 있습니다.
     (PowerPoint 창에서 도형을 직접 끌어오면 PowerPoint 가 브라우저에 그림을 넘겨주지 않아, 파일을 여는 방식으로 함) */
  let pptWant = '', pptDrag = null, pptPanel = null, innerDrag = false, symPaste = null, iconRedraw = null;
  const PPTPOS_KEY = 'gyoan:pptSymPos';
  const DROP_HELP = '끌어온 프로그램이 그림을 넘겨주지 않았습니다 — PowerPoint 의 도형은 복사(Ctrl+C)한 뒤 여기서 붙여넣기(Ctrl+V) 하거나, PPT 파일을 통째로 끌어다 놓으면 그 안의 심벌을 골라 넣을 수 있습니다';
  document.addEventListener('dragstart', () => { innerDrag = true; }, true);
  document.addEventListener('dragend', () => { innerDrag = false; pptDrag = null; }, true);
  async function openPpt(file, want) {
    want = want || pptWant; pptWant = '';
    if (S.editing) endEdit();
    if (/\.(ppt|pps)$/i.test(file.name || '')) { alert('옛 형식(.ppt) 파일은 읽지 못합니다.\nPowerPoint 에서 [파일 → 다른 이름으로 저장] 으로 "PowerPoint 프레젠테이션(.pptx)" 으로 저장한 뒤 다시 넣어 주세요.'); return; }
    toast('PPT 파일을 읽는 중…', 15000);
    let vids, syms = { items: [], skipped: 0 };
    try { vids = await readPptVideos(file); } catch (e) { toast('PPT 를 읽지 못했습니다'); alert('PPT 파일을 읽지 못했습니다: ' + e.message); return; }
    try { await loadScript('app/pptsym.js'); syms = await PPTSYM.read(file, { zipIndex, zipBlob, pptRels, extOf }); } catch (e) { syms = { items: [], skipped: 0, error: e.message }; }
    if (!vids.length && !syms.items.length) {
      toast('PPT 에서 가져올 것을 찾지 못했습니다');
      alert(`"${file.name}" 안에서 가져올 그림·도형·동영상을 찾지 못했습니다.` + (syms.skipped ? `\n\n브라우저가 열 수 없는 형식(EMF·WMF)의 그림 ${syms.skipped}개는 건너뛰었습니다.\n그런 그림은 PowerPoint 에서 복사(Ctrl+C)한 뒤 여기에 붙여넣어(Ctrl+V) 주세요.` : '') + (syms.error ? '\n(' + syms.error + ')' : ''));
      return;
    }
    closePptSyms();
    S.ppt = { name: file.name, file, vids, syms };
    if (syms.items.length && (want === 'sym' || !vids.length)) { toast(`PPT 에서 심벌 ${syms.items.length}개를 찾았습니다 · 끌어서 슬라이드나 내 심벌에 놓으세요`, 4000); showPptSyms(); }
    else { toast(`PPT 에서 동영상 ${vids.length}개를 찾았습니다`); showPptVideos(); }
  }
  function closePptSyms() { if (pptPanel) pptPanel._close(); }
  /* 심벌 하나를 슬라이드에 (at: 슬라이드 좌표 { x, y } — 없으면 가운데) */
  async function placePptSym(it, at) {
    const P = S.ppt; if (!P || !it) return false;
    if (S.editing) endEdit();
    const put = (w, h) => [Math.round(clamp(at ? at.x - w / 2 : (SLIDE_W - w) / 2, 0, Math.max(0, SLIDE_W - w))), Math.round(clamp(at ? at.y - h / 2 : (SLIDE_H - h) / 2, 0, Math.max(0, SLIDE_H - h)))];
    if (it.kind === 'txt') {
      const big = graphemes(it.c).length <= 2, w = big ? 220 : 360, h = 220, [x, y] = put(w, h);
      addElement(textEl('text', x, y, w, h, esc(it.c), { style: Object.assign({ fontSize: big ? 150 : 60, align: 'center', valign: 'middle', lineHeight: 1 }, it.color ? { color: it.color } : {}) }));
      return true;
    }
    let r; try { r = await PPTSYM.render(it); } catch (e) { toast('이 심벌은 가져오지 못했습니다: ' + e.message, 4500); return false; }
    try {
      let src;
      if (it.kind === 'media') { const prep = await prepareImage(new File([r.blob], r.name, { type: r.blob.type })); src = await API.stage(prep.blob, prep.name); }
      else src = await API.stage(r.blob, r.name);
      const k = SLIDE_W / (P.syms.slideW || 1280); let w = r.w * k, h = r.h * k; const s = Math.min(1, 1400 / w, 900 / h); w = Math.max(8, Math.round(w * s)); h = Math.max(8, Math.round(h * s));
      const [x, y] = put(w, h); addElement(imageEl(x, y, w, h, src));
      if (r.approx) toast('모양이 PowerPoint 와 조금 다를 수 있는 도형입니다 — 똑같이 넣으려면 PowerPoint 에서 복사(Ctrl+C)해 붙여넣으세요(Ctrl+V)', 6000);
      return true;
    } catch (e) { alert('심벌을 넣지 못했습니다: ' + e.message); return false; }
  }
  /* 심벌 하나를 내 심벌에 */
  async function pptSymToMy(it) {
    const before = mySyms().length;
    if (it.kind === 'txt') await addMySym({ t: 'txt', c: it.c });
    else { const r = await PPTSYM.render(it); await addMySymFromDrop({ files: [new File([r.blob], r.name, { type: r.blob.type })], getData: () => '' }); }
    return mySyms().length > before;
  }
  function showPptSyms() {
    const P = S.ppt; if (!P || !P.syms || !P.syms.items.length) { pptWant = 'sym'; $('filePpt').click(); return; }
    document.querySelectorAll('.modal-bg.ppt-videos').forEach(n => n.remove());
    closePptSyms();
    const items = P.syms.items, urls = [];
    const el = pptPanel = document.createElement('div'); el.className = 'pptsym';
    let html = '', last = 0;
    for (const it of items) {
      if (it.slide !== last) { if (last) html += '</div>'; last = it.slide; html += `<div class="ps-h">${it.slide}번 슬라이드</div><div class="ps-grid">`; }
      html += `<div class="ps-it${it.kind === 'txt' ? ' txt' : ''}" draggable="true" data-i="${it.id}" title="${esc(it.name || '심벌')}">${it.kind === 'txt' ? `<span${it.color ? ` style="color:${esc(it.color)}"` : ''}>${esc(it.c)}</span>` : ''}<button type="button" class="ps-add" data-add title="내 심벌에 담기">＋</button></div>`;
    }
    html += '</div>';
    el.innerHTML = `<div class="ps-head" title="끌어서 창 옮기기"><b>🧩 PPT 심벌</b><span class="ps-name">${esc(P.name)} · ${items.length}개</span><button type="button" class="ps-x" data-close title="닫기">×</button></div>
      <div class="ps-tools"><button type="button" class="btn sm" data-my title="내 심벌 창을 엽니다 — 열어 둔 채로 심벌을 끌어다 놓으세요">⭐ 내 심벌 열기</button><button type="button" class="btn sm" data-all title="이 PPT 의 심벌을 모두 내 심벌에 담기">모두 담기</button>${P.vids.length ? `<button type="button" class="btn sm" data-vids title="이 PPT 의 동영상">🎞 동영상 ${P.vids.length}</button>` : ''}<button type="button" class="btn sm" data-other title="다른 PPT 파일 열기">📂 다른 PPT</button></div>
      <div class="ps-body">${html}</div>
      <div class="ps-foot"><b>끌어서</b> 슬라이드의 원하는 자리나 <b>내 심벌</b> 창에 놓으세요 · <b>누르면</b> 슬라이드 가운데에 · <b>＋</b> 는 내 심벌에 담기${P.syms.skipped ? `<br>※ EMF·WMF 그림 ${P.syms.skipped}개는 브라우저가 열지 못해 뺐습니다 (PowerPoint 에서 Ctrl+C → 여기서 Ctrl+V)` : ''}</div>`;
    document.body.appendChild(el);
    const place = (l, t) => { el.style.left = clamp(l, 0, Math.max(0, window.innerWidth - el.offsetWidth)) + 'px'; el.style.top = clamp(t, 0, Math.max(0, window.innerHeight - 60)) + 'px'; };
    const pos = lsGet(PPTPOS_KEY, null); if (pos && isFinite(pos.l) && isFinite(pos.t)) place(pos.l, pos.t); else place(window.innerWidth - el.offsetWidth - 16, 112);
    const byId = (n) => items[+n.dataset.i];
    // 보이는 것부터 작은 그림을 그림
    const load = async (tile) => {
      const it = byId(tile); if (!it || it.kind === 'txt' || tile.dataset.done) return; tile.dataset.done = '1';
      try { const r = await PPTSYM.render(it); if (!el.isConnected) return; const u = URL.createObjectURL(r.blob); urls.push(u); const im = new Image(); im.draggable = false; im.alt = ''; im.src = u; tile.insertBefore(im, tile.firstChild); if (r.approx) { tile.classList.add('approx'); tile.title += ' — 모양이 PowerPoint 와 조금 다를 수 있습니다'; } }
      catch (e) { tile.classList.add('bad'); tile.draggable = false; tile.title = (it.name || '심벌') + ' — 가져올 수 없습니다 (' + e.message + ')'; }
    };
    const io = new IntersectionObserver((ents) => { for (const en of ents) if (en.isIntersecting) { io.unobserve(en.target); load(en.target); } }, { root: el.querySelector('.ps-body'), rootMargin: '200px' });
    el.querySelectorAll('.ps-it').forEach(t => io.observe(t));
    const myOpen = () => !!document.querySelector('.modal-bg .icon-modal');
    const toMy = async (it) => { try { if (await pptSymToMy(it)) { toast('내 심벌에 담았습니다'); if (iconRedraw) iconRedraw(); return true; } } catch (e) { toast('이 심벌은 가져오지 못했습니다: ' + e.message, 4500); } return false; };
    el.addEventListener('click', async (ev) => {
      if (ev.target.closest('[data-close]')) { el._close(); return; }
      if (ev.target.closest('[data-my]')) { if (!myOpen()) showIconPicker(); if (iconRedraw) iconRedraw(); return; }
      if (ev.target.closest('[data-vids]')) { document.querySelectorAll('.modal-bg').forEach(n => { if (n.querySelector('.icon-modal')) n.remove(); }); showPptVideos(); return; }
      if (ev.target.closest('[data-other]')) { pptWant = 'sym'; $('filePpt').click(); return; }
      if (ev.target.closest('[data-all]')) {
        const list = items.filter(it => !el.querySelector(`.ps-it.bad[data-i="${it.id}"]`));
        if (!confirm(`이 PPT 의 심벌 ${list.length}개를 모두 내 심벌에 담을까요?` + (list.length > 60 ? '\n\n많이 담으면 내 심벌 목록이 길어지고 저장 공간도 많이 씁니다.\n필요한 것만 끌어다 놓는 쪽을 권합니다.' : ''))) return;
        let n = 0;
        for (let i = list.length - 1; i >= 0; i--) { // 내 심벌은 새것이 앞에 오므로 뒤에서부터 담아 순서를 지킴
          toast(`내 심벌에 담는 중… ${list.length - i} / ${list.length}`, 20000);
          try { if (await pptSymToMy(list[i])) n++; else break; /* 저장 공간이 가득 참 */ } catch (e) { }
        }
        toast(n === list.length ? `심벌 ${n}개를 내 심벌에 담았습니다` : `심벌 ${n}개를 담았습니다 (${list.length - n}개는 담지 못했습니다)`, 4000); if (iconRedraw) iconRedraw();
        return;
      }
      const tile = ev.target.closest('.ps-it'); if (!tile || tile.classList.contains('bad')) return;
      const it = byId(tile);
      if (ev.target.closest('[data-add]') || myOpen()) { await toMy(it); return; } // 내 심벌 창이 열려 있으면 누르기 = 담기
      if (await placePptSym(it)) toast('슬라이드에 넣었습니다 · 되돌리기 Ctrl+Z');
    });
    el.addEventListener('dragstart', (ev) => {
      const tile = ev.target.closest && ev.target.closest('.ps-it'); if (!tile || tile.classList.contains('bad')) { ev.preventDefault(); return; }
      pptDrag = byId(tile); ev.dataTransfer.setData('text/x-gyoan-pptsym', String(pptDrag.id)); ev.dataTransfer.effectAllowed = 'copy';
      const im = tile.querySelector('img'); if (im && im.complete && im.naturalWidth) { try { ev.dataTransfer.setDragImage(im, im.width / 2, im.height / 2); } catch (e) { } }
    });
    // 제목 줄을 끌어 창 옮기기
    const head = el.querySelector('.ps-head');
    head.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0 || ev.target.closest('button')) return; ev.preventDefault();
      const r = el.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top;
      const move = (e) => place(e.clientX - dx, e.clientY - dy);
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); lsSet(PPTPOS_KEY, { l: parseFloat(el.style.left) || 0, t: parseFloat(el.style.top) || 0 }); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
    el._close = () => { io.disconnect(); el.remove(); urls.forEach(u => URL.revokeObjectURL(u)); if (pptPanel === el) pptPanel = null; };
  }
  function showPptVideos(only, note) {
    const P = S.ppt; if (!P || !P.vids.length) { pptWant = 'video'; $('filePpt').click(); return; }
    document.querySelectorAll('.modal-bg.ppt-videos').forEach(n => n.remove());
    const list = only || P.vids, urls = [];
    const fmt = (b) => b >= 1048576 ? (b / 1048576 >= 10 ? Math.round(b / 1048576) : (b / 1048576).toFixed(1)) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB';
    const bg = document.createElement('div'); bg.className = 'modal-bg ppt-videos';
    bg.innerHTML = `<div class="modal" style="width:720px;max-width:94vw"><h3>🎞 PPT 의 동영상 <span class="muted" style="font-weight:400;font-size:13px">${esc(P.name)} · ${P.vids.length}개</span></h3>
      <p class="muted" style="margin:0 0 12px;font-size:13px;line-height:1.6">${esc(note || '넣을 영상을 누르세요. 상자를 하나 잡아 두었으면 그 상자 자리에 들어갑니다.')}${only ? '' : '<br>이 PPT 를 열어 둔 동안에는 <b>PowerPoint 에서 영상을 복사(Ctrl+C)해서 여기에 붙여넣어도(Ctrl+V)</b> 영상으로 들어갑니다.'}</p>
      <div class="ppt-grid">${list.map((v) => `<div class="pv" data-i="${P.vids.indexOf(v)}" title="${esc(v.name)}"><div class="ph"><i>▶</i></div><b>${v.slide}번 슬라이드</b><span>${esc(v.name)}</span><small>${v.url ? '인터넷 영상 (주소로 넣음)' : v.linked ? '⚠ PPT 안에 없음 (PC 파일에 연결)' : esc(v.ext.toUpperCase()) + ' · ' + fmt(v.size)}</small></div>`).join('')}</div>
      <div class="actions"><button class="btn ghost" data-other>다른 PPT 열기…</button>${P.syms && P.syms.items.length ? `<button class="btn ghost" data-syms title="이 PPT 안의 그림·도형을 심벌로 꺼내 씁니다">🧩 그림·도형 ${P.syms.items.length}개</button>` : ''}<span style="flex:1"></span><button class="btn" data-close>닫기</button></div></div>`;
    const close = () => { bg.remove(); urls.forEach(u => URL.revokeObjectURL(u)); };
    bg.onclick = (ev) => {
      if (ev.target === bg || ev.target.closest('[data-close]')) { close(); return; }
      if (ev.target.closest('[data-other]')) { close(); pptWant = 'video'; $('filePpt').click(); return; }
      if (ev.target.closest('[data-syms]')) { close(); showPptSyms(); return; }
      const c = ev.target.closest('.pv'); if (!c) return; close(); takePptVideo(P.vids[+c.dataset.i]);
    };
    bg.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') close(); });
    document.body.appendChild(bg);
    list.forEach(async (v) => { // 표지 그림은 뒤에서 차례로
      if (!v.posterEnt) return;
      try { const u = URL.createObjectURL(await zipBlob(P.file, v.posterEnt, PPT_MIME[v.posterExt])); urls.push(u); const ph = bg.querySelector(`.pv[data-i="${P.vids.indexOf(v)}"] .ph`); if (ph) ph.style.backgroundImage = `url("${u}")`; } catch (e) { }
    });
  }
  async function takePptVideo(v) {
    const P = S.ppt; if (!P || !v) return false;
    if (v.url) return putEmbed(v.url);
    if (v.linked) { alert(`이 영상은 PPT 안에 들어 있지 않고, PC 의 파일에 연결만 되어 있습니다.\n\n${(() => { try { return decodeURIComponent(v.path); } catch (e) { return v.path; } })().replace(/^file:\/+/i, '')}\n\n그 영상 파일을 편집 화면에 끌어다 놓거나, 파일을 복사(Ctrl+C)한 뒤 여기에 붙여넣어(Ctrl+V) 주세요.`); return false; }
    const same = P.vids.find(x => x.path === v.path && x.staged && API.blobs[x.staged.src]); // 같은 영상을 또 넣을 때는 올려 둔 것을 그대로 씀
    if (same) return insertVideoFile(new File([], 'video.mp4'), null, { reuse: same.staged, start: v.start, trimEnd: v.trimEnd });
    toast('PPT 에서 영상을 꺼내는 중…', 30000);
    let blob, poster = null;
    try { blob = await zipBlob(P.file, v.ent, PPT_MIME[v.ext] || 'video/mp4'); }
    catch (e) { toast('영상을 꺼내지 못했습니다'); alert('PPT 파일에서 영상을 꺼내지 못했습니다.\nPPT 를 연 뒤에 그 파일을 고쳐 저장했다면, [PPT 에서 영상 가져오기] 로 파일을 다시 열어 주세요.\n(' + e.message + ')'); return false; }
    if (v.posterEnt) { try { poster = await zipBlob(P.file, v.posterEnt, PPT_MIME[v.posterExt]); } catch (e) { } }
    const base = String(v.name || 'video').replace(/\.[a-z0-9]{2,5}$/i, '') || 'video';
    return insertVideoFile(new File([blob], base + '.' + (v.ext || 'mp4'), { type: blob.type }), null, { poster, start: v.start, trimEnd: v.trimEnd, onStaged: (st) => { v.staged = st; } });
  }
  /* 붙여넣은 그림이 열어 둔 PPT 의 어느 영상 표지인지 찾음 (16×16 으로 줄인 색 비교) */
  async function imgSig(blob) {
    const bmp = await createImageBitmap(blob), c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#000'; g.fillRect(0, 0, 16, 16); g.drawImage(bmp, 0, 0, 16, 16); if (bmp.close) bmp.close();
    const d = g.getImageData(0, 0, 16, 16).data, s = new Uint8Array(768); for (let i = 0, j = 0; i < d.length; i += 4) { s[j++] = d[i]; s[j++] = d[i + 1]; s[j++] = d[i + 2]; }
    return s;
  }
  async function matchPptVideo(blob) {
    const P = S.ppt; if (!P) return [];
    let sig; try { sig = await imgSig(blob); } catch (e) { return []; }
    const hits = [], seen = new Set(); P.stale = false;
    for (const v of P.vids) {
      if (!v.ent || !v.posterEnt || seen.has(v.path)) continue;
      if (v.sig === undefined) {
        let pb = null; try { pb = await zipBlob(P.file, v.posterEnt, PPT_MIME[v.posterExt]); } catch (e) { P.stale = true; continue; } // PPT 파일이 그 사이 바뀜 (다시 열어야 함)
        try { v.sig = await imgSig(pb); } catch (e) { v.sig = null; }
      }
      if (!v.sig) continue;
      let d = 0; for (let i = 0; i < 768; i++) d += Math.abs(sig[i] - v.sig[i]); d /= 768;
      if (d < 12) { hits.push({ v, d }); seen.add(v.path); }
    }
    return hits.sort((a, b) => a.d - b.d);
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
    const els = selEls().filter(e => !e.locked); if (!els.length) return;
    let L = 0, T = 0, R = SLIDE_W, B = SLIDE_H;
    if (els.length > 1) { L = Math.min(...els.map(e => e.x)); T = Math.min(...els.map(e => e.y)); R = Math.max(...els.map(e => e.x + e.w)); B = Math.max(...els.map(e => e.y + e.h)); }
    for (const e of els) {
      if (how === 'left') e.x = L; if (how === 'right') e.x = R - e.w; if (how === 'hcenter') e.x = Math.round((L + R) / 2 - e.w / 2);
      if (how === 'top') e.y = T; if (how === 'bottom') e.y = B - e.h; if (how === 'vcenter') e.y = Math.round((T + B) / 2 - e.h / 2);
    }
    commit(); renderStage(); renderProps();
  }
  function distribute(axis) {
    const els = selEls().filter(e => !e.locked); if (els.length < 3) { toast('3개 이상 선택하세요'); return; }
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
  function commitDebounced() { clearTimeout(nudgeTimer); nudgeTimer = setTimeout(() => { nudgeTimer = null; commit(); }, 400); }
  function flushNudge() { if (nudgeTimer) { clearTimeout(nudgeTimer); nudgeTimer = null; commit(); } }

  /* ---------- 포인터 상호작용 ---------- */
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('dblclick', (ev) => {
    const node = ev.target.closest('.el'); if (!node) return;
    const e = elById(node.dataset.id); if (!e) return;
    if (e.type === 'image') { S.sel = [e.id]; $('fileReplace').dataset.id = e.id; $('fileReplace').click(); }
    else if (e.type === 'math') openMathDialog(e);
    else if (e.type === 'embed') openEmbedDialog(e);
    else if (e.type === 'chart') { S.sel = [e.id]; markSelection(); renderOverlay(); renderProps(); const ta = props.querySelector('input[data-cg="1,1"]') || props.querySelector('textarea[data-k="data"]'); if (ta) { ta.focus(); ta.scrollIntoView({ block: 'center' }); } }
    else startEdit(e.id, ev);
  });
  stage.addEventListener('pointerover', (ev) => { const n = ev.target.closest('.el'); slideNode?.querySelectorAll('.el.hover').forEach(x => x.classList.remove('hover')); if (n) n.classList.add('hover'); });
  stage.addEventListener('pointerleave', () => slideNode?.querySelectorAll('.el.hover').forEach(x => x.classList.remove('hover')));
  stage.addEventListener('contextmenu', (ev) => {
    const node = ev.target.closest('.el');
    if (S.editing) return;
    ev.preventDefault();
    if (node) {
      const td = ev.target.closest('th,td'), was = S.sel.includes(node.dataset.id);
      if (!was) S.sel = [node.dataset.id];
      if (td && td.dataset.r != null && S.sel.length === 1) S.cell = { id: node.dataset.id, r: +td.dataset.r, c: +td.dataset.c }; // 표: 오른쪽 단추로 누른 칸이 추가·삭제의 기준
      if (!was || td) { markSelection(); renderOverlay(); renderProps(); }
      showMenu(ev.clientX, ev.clientY, elementMenuItems());
    }
    else showMenu(ev.clientX, ev.clientY, slideMenuItems());
  });
  function elementMenuItems() {
    const e = elById(S.sel[0]); const items = [];
    if (e && e.type === 'table' && S.sel.length === 1 && !e.locked && S.cell && S.cell.id === e.id) {
      const { r, c } = S.cell, at = { r, c };
      items.push({ label: `이 행 삭제 (${r + 1}행)`, danger: true, fn: () => tableOp('rowDel', at) }, { label: `이 열 삭제 (${c + 1}열)`, danger: true, fn: () => tableOp('colDel', at) },
        { label: '위에 행 추가', fn: () => tableOp('rowAddBefore', at) }, { label: '아래에 행 추가', fn: () => tableOp('rowAdd', at) },
        { label: '왼쪽에 열 추가', fn: () => tableOp('colAddBefore', at) }, { label: '오른쪽에 열 추가', fn: () => tableOp('colAdd', at) }, { sep: true });
    }
    if (e && editable(e)) items.push({ label: '글 편집', kbd: '더블클릭', fn: () => startEdit(e.id) });
    if (e && e.type === 'image') items.push({ label: '이미지 교체…', fn: () => { $('fileReplace').dataset.id = e.id; $('fileReplace').click(); } });
    if (e && S.sel.length === 1 && ((e.type === 'image' && e.src) || isIconText(e))) items.push({ label: e.type === 'image' ? '배경 지우기…' : '아이콘 배경 지우기…', fn: () => showBgRemove(e) });
    if (e && e.type === 'math') items.push({ label: '수식 편집…', fn: () => openMathDialog(e) });
    if (e && e.type === 'embed') items.push({ label: '주소 바꾸기…', fn: () => openEmbedDialog(e) }, { label: '▶ 여기서 재생', fn: () => playEmbedHere(e.id) });
    if (e && (e.type === 'shape' || e.type === 'image' || e.type === 'text') && S.sel.length === 1) items.push({ label: '이 상자에 동영상 넣기…', fn: () => { const u = prompt('YouTube 주소 또는 퍼가기 코드를 붙여넣으세요'); if (u && !putEmbed(u)) alert('주소를 알아볼 수 없습니다'); } });
    items.push({ label: '복제', kbd: 'Ctrl+D', fn: duplicateSelected }, { label: '복사', kbd: 'Ctrl+C', fn: copySelected },
      { label: '잘라내기', kbd: 'Ctrl+X', fn: () => { copySelected(); deleteSelected(); } }, { label: '붙여넣기', kbd: 'Ctrl+V', fn: () => { if (S.clip) pasteData(S.clip); else toast('먼저 복사하세요 (Ctrl+C)'); } },
      { label: '서식 복사', kbd: 'Ctrl+Shift+C', fn: copyStyle }, { label: '서식 붙여넣기', kbd: 'Ctrl+Shift+V', fn: pasteStyle }, { sep: true },
      S.sel.length > 1 ? { label: '묶기', kbd: 'Ctrl+G', fn: groupSel } : null, e && e.group ? { label: '묶음 풀기', kbd: 'Ctrl+Shift+G', fn: ungroupSel } : null,
      { label: '맨 앞으로', kbd: 'Ctrl+Shift+]', fn: () => zOrder('front') }, { label: '앞으로 한 단계', kbd: 'Ctrl+]', fn: () => zOrder('up') }, { label: '뒤로 한 단계', kbd: 'Ctrl+[', fn: () => zOrder('down') }, { label: '맨 뒤로', kbd: 'Ctrl+Shift+[', fn: () => zOrder('back') }, { sep: true },
      { label: e && e.locked ? '잠금 해제' : '잠금 (이동 방지)', fn: () => { for (const x of selEls()) x.locked = !x.locked; commit(); markSelection(); renderOverlay(); renderProps(); } },
      { label: '삭제', kbd: 'Del', danger: true, fn: deleteSelected });
    return items.filter(Boolean);
  }

  /* 편집 중 동영상 재생: 자리 표시 대신 실제 플레이어를 넣고, ✕ 를 누르면 되돌림 */
  function playEmbedHere(id) {
    const e = elById(id), node = nodeOf(id); if (!e || !node) return;
    const p = parseEmbed(e.url); if (p.kind === 'none') return;
    node.innerHTML = ''; node.classList.add('playing');
    node.appendChild(embedPlayer(e, p, true));
    const x = document.createElement('button'); x.className = 'embed-stop'; x.type = 'button'; x.textContent = '✕ 닫기'; x.title = '재생 멈추고 편집으로';
    x.onpointerdown = (ev) => { ev.stopPropagation(); };
    x.onclick = (ev) => { ev.stopPropagation(); rerenderEl(id); };
    node.appendChild(x);
    S.sel = [id]; markSelection(); renderOverlay(); renderProps();
  }
  function onPointerDown(ev) {
    if (ev.button !== 0) return;
    closeMenus(); S.focus = 'stage';
    const t = ev.target;
    if (t.closest('.text-toolbar')) return;
    if (t.closest('.embed-play[data-play]')) { const n = t.closest('.el'); if (n) { ev.preventDefault(); playEmbedHere(n.dataset.id); return; } }
    if (t.closest('.el.playing') && !t.closest('.handle')) return; // 재생 중인 플레이어 조작
    const handle = t.closest('.handle');
    if (handle) { ev.preventDefault(); startResize(ev, handle.dataset.h); return; }
    if (t.closest('.ttab')) { ev.preventDefault(); return; } // 표의 ✕·＋ 손잡이 (누르면 click 에서 처리)
    const tb = tableBorderHit(ev); if (tb) { ev.preventDefault(); startTableLineDrag(ev, tb); return; }
    const node = t.closest('.el');
    if (S.editing) { if (node && node.dataset.id === S.editing) return; endEdit(); }
    if (node) {
      const id = node.dataset.id; const e = elById(id); if (!e) return;
      const ids = ev.altKey ? [id] : groupOf(id);
      if (ev.shiftKey) { S.sel = ids.every(x => S.sel.includes(x)) ? S.sel.filter(x => !ids.includes(x)) : Array.from(new Set(S.sel.concat(ids))); }
      else if (!S.sel.includes(id)) S.sel = ids;
      { const td = e.type === 'table' ? t.closest('th,td') : null; if (td && td.dataset.r != null) S.cell = { id, r: +td.dataset.r, c: +td.dataset.c }; } // 표: 누른 칸을 기억 (행·열 추가/삭제의 기준)
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
    const dup = ev.ctrlKey || ev.metaKey;
    let els = selEls().filter(e => !e.locked); if (!els.length) return;
    const sx = ev.clientX, sy = ev.clientY; let orig = els.map(e => ({ e, x: e.x, y: e.y })); let moved = false;
    track((m) => {
      let dx = (m.clientX - sx) / S.k, dy = (m.clientY - sy) / S.k;
      if (!moved && Math.hypot(m.clientX - sx, m.clientY - sy) < 3) return;
      if (!moved && dup) { const copies = freshCopies(els, 0, 0, false); curSlide().elements.push(...copies); S.sel = copies.map(c => c.id); renderStage(); els = copies; orig = els.map(e => ({ e, x: e.x, y: e.y })); }
      moved = true;
      if (!m.altKey) { const p = orig[0]; const sn = computeSnap(p.x + dx, p.y + dy, p.e.w, p.e.h, els); dx += sn.dx; dy += sn.dy; showGuides(sn.guides); } else clearGuides();
      for (const o of orig) { o.e.x = Math.round(o.x + dx); o.e.y = Math.round(o.y + dy); const n = nodeOf(o.e.id); if (n) { n.style.left = o.e.x + 'px'; n.style.top = o.e.y + 'px'; } }
      renderOverlay(); updatePosInputs();
    }, () => { clearGuides(); if (moved) { commit(); renderProps(); } });
  }
  function snapLines(moving) { // 붙을 수 있는 세로·가로 선: 슬라이드 가장자리·가운데·여백, 다른 개체의 가장자리·가운데, 격자
    const others = curSlide().elements.filter(e => !moving.includes(e));
    const vx = [0, SLIDE_W / 2, SLIDE_W, M, SLIDE_W - M], hy = [0, SLIDE_H / 2, SLIDE_H];
    for (const o of others) { vx.push(o.x, o.x + o.w / 2, o.x + o.w); hy.push(o.y, o.y + o.h / 2, o.y + o.h); }
    if (S.grid) { for (let v = 0; v <= SLIDE_W; v += 60) vx.push(v); for (let v = 0; v <= SLIDE_H; v += 60) hy.push(v); }
    return { vx, hy };
  }
  function computeSnap(x, y, w, h, moving) {
    const th = 7 / S.k; const { vx, hy } = snapLines(moving);
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
      let turned = false;
      track((m) => {
        turned = true;
        let deg = Math.atan2(m.clientY - cys, m.clientX - cxs) * 180 / Math.PI + 90;
        if (m.shiftKey) deg = Math.round(deg / 15) * 15; deg = Math.round(((deg % 360) + 360) % 360); if (deg > 180) deg -= 360;
        e.rotate = deg; node.style.transform = deg ? `rotate(${deg}deg)` : ''; renderOverlay(); updatePosInputs();
      }, () => { if (turned) { commit(); renderProps(); } });
      return;
    }
    const ratio = o.w / o.h; const isCorner = h.length === 2; let sized = false;
    track((m) => {
      sized = true;
      let dx = (m.clientX - sx) / S.k, dy = (m.clientY - sy) / S.k;
      if (o.r) { const a = -o.r * Math.PI / 180; const rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a); dx = rx; dy = ry; }
      let x = o.x, y = o.y, w = o.w, hh = o.h;
      if (h.includes('e')) w = o.w + dx; if (h.includes('w')) { x = o.x + dx; w = o.w - dx; }
      if (h.includes('s')) hh = o.h + dy; if (h.includes('n')) { y = o.y + dy; hh = o.h - dy; }
      const rk = e.type === 'image' || e.type === 'embed';
      const keep = (isCorner && ((rk && !m.shiftKey) || (!rk && m.shiftKey))) || (e.ratioLock && !m.shiftKey);
      if (keep) { if (Math.abs(w / ratio - hh) * ratio > Math.abs(hh * ratio - w)) hh = w / ratio; else w = hh * ratio; if (h.includes('w')) x = o.x + o.w - w; if (h.includes('n')) y = o.y + o.h - hh; }
      if (!keep && !o.r && !m.altKey) { // 크기를 바꿀 때도 다른 개체·슬라이드 가장자리에 붙음 (Alt: 끄기)
        const { vx, hy } = snapLines([e]); const th = 7 / S.k, gs = [];
        const near = (val, list) => { let best = null, bd = th; for (const v of list) { const d = Math.abs(v - val); if (d < bd) { bd = d; best = v; } } return best; };
        let s;
        if (h.includes('e') && (s = near(x + w, vx)) != null) { w = s - x; gs.push({ v: s }); }
        if (h.includes('w') && (s = near(x, vx)) != null) { w += x - s; x = s; gs.push({ v: s }); }
        if (h.includes('s') && (s = near(y + hh, hy)) != null) { hh = s - y; gs.push({ h: s }); }
        if (h.includes('n') && (s = near(y, hy)) != null) { hh += y - s; y = s; gs.push({ h: s }); }
        showGuides(gs);
      }
      w = Math.max(16, w); hh = Math.max(16, hh);
      e.x = Math.round(x); e.y = Math.round(y); e.w = Math.round(w); e.h = Math.round(hh);
      if (e.type === 'shape' || e.type === 'chart') { rerenderEl(e.id); }
      else { node.style.left = e.x + 'px'; node.style.top = e.y + 'px'; node.style.width = e.w + 'px'; node.style.height = e.h + 'px'; }
      renderOverlay(); updatePosInputs();
    }, () => { clearGuides(); if (sized) { commit(); renderProps(); } });
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
  /* 표 칸 내용을 행,열 자리로 읽음 (합친 칸 아래 가려진 자리는 저장된 값 유지 · Tab 으로 늘어난 줄은 빈 칸으로 채움) */
  function readTableRows(node, e) {
    const rows = (e.rows || []).map(r => r.slice());
    node.querySelectorAll('th,td').forEach(td => { const r = +td.dataset.r, c = +td.dataset.c; if (!rows[r]) rows[r] = []; rows[r][c] = cleanHtml(td.innerHTML); });
    const nc = Math.max(1, ...rows.map(r => r.length));
    return rows.map(r => { const o = []; for (let i = 0; i < nc; i++) o.push(r[i] || ''); return o; });
  }
  function focusCell(id, r, c) {
    const node = nodeOf(id); const td = node && node.querySelector(`[data-r="${r}"][data-c="${c}"]`); if (!td) return;
    td.focus(); const rg = document.createRange(); rg.selectNodeContents(td); rg.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
  }
  /* 칸 꾸밈·합치기 (편집 중 글 도구 막대에서) */
  function cellOp(cmd, val) {
    const e = elById(S.editing || S.sel[0]); if (!e || e.type !== 'table' || !S.cell) return;
    const { r, c } = S.cell, key = r + ',' + c;
    e.cells = e.cells || {}; const s = e.cells[key] || (e.cells[key] = {});
    const node = nodeOf(e.id), td = node && node.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    const tidy = () => { if (!Object.keys(s).length) delete e.cells[key]; if (!Object.keys(e.cells).length) delete e.cells; };
    if (cmd === 'cellFill' || cmd === 'cellFillClear') {
      if (cmd === 'cellFill') s.fill = val; else delete s.fill;
      if (td) { td.style.background = s.fill ? themeColor(s.fill, theme()) : ''; td.classList.toggle('filled', !!s.fill); }
      tidy(); commit(); return;
    }
    if (cmd === 'cellAlign') { s.align = val; if (td) td.style.textAlign = val; tidy(); commit(); return; }
    if (cmd === 'mergeR' || cmd === 'mergeD') {
      const nr = e.rows.length, nc = e.rows[0].length, rs = s.rs || 1, cs = s.cs || 1;
      const cov = tableCovered(e.cells, nr, nc);
      const plain = (rr, cc) => rr < nr && cc < nc && !cov.has(rr + ',' + cc) && !((e.cells[rr + ',' + cc] || {}).rs > 1) && !((e.cells[rr + ',' + cc] || {}).cs > 1);
      const eat = []; let ok = true;
      if (cmd === 'mergeR') for (let i = 0; i < rs; i++) { if (!plain(r + i, c + cs)) ok = false; eat.push([r + i, c + cs]); }
      else for (let j = 0; j < cs; j++) { if (!plain(r + rs, c + j)) ok = false; eat.push([r + rs, c + j]); }
      if (!ok) { tidy(); toast(cmd === 'mergeR' ? '오른쪽에 합칠 수 있는 칸이 없습니다 (표 끝이거나 이미 합친 칸)' : '아래에 합칠 수 있는 칸이 없습니다 (표 끝이거나 이미 합친 칸)', 2600); return; }
      if (S.editing) endEdit();
      const extra = eat.map(([rr, cc]) => e.rows[rr][cc]).filter(x => x && stripHtml(x).trim());
      if (extra.length) e.rows[r][c] = [e.rows[r][c], ...extra].filter(x => x && stripHtml(x).trim()).join(' ');
      eat.forEach(([rr, cc]) => { e.rows[rr][cc] = ''; delete e.cells[rr + ',' + cc]; });
      if (cmd === 'mergeR') s.cs = cs + 1; else s.rs = rs + 1;
      e.cells[key] = s; commit(); rerenderEl(e.id); renderOverlay(); startEdit(e.id); focusCell(e.id, r, c); return;
    }
    if (cmd === 'split') {
      if (!(s.rs > 1 || s.cs > 1)) { tidy(); toast('합친 칸이 아닙니다', 2000); return; }
      if (S.editing) endEdit();
      delete s.rs; delete s.cs; tidy(); commit(); rerenderEl(e.id); renderOverlay(); startEdit(e.id); focusCell(e.id, r, c);
    }
  }
  /* 행·열을 넣고 뺄 때 합친 칸·칸 꾸밈의 자리를 따라 옮김. insert=true 면 idx 다음 자리에 추가, false 면 idx 삭제 */
  function tableRemap(e, axis, idx, insert) {
    const out = {}, cells = e.cells || {};
    for (const k in cells) {
      let [r, c] = k.split(',').map(Number); const s = Object.assign({}, cells[k]);
      let p = axis === 'r' ? r : c, span = axis === 'r' ? (s.rs || 1) : (s.cs || 1);
      if (insert) { if (p > idx) p++; else if (p + span - 1 > idx) span++; }
      else { if (p === idx) { if (span > 1) span--; else continue; } else if (p > idx) p--; else if (p + span - 1 >= idx) span--; }
      if (axis === 'r') { r = p; if (span > 1) s.rs = span; else delete s.rs; } else { c = p; if (span > 1) s.cs = span; else delete s.cs; }
      if (Object.keys(s).length) out[r + ',' + c] = s;
    }
    if (Object.keys(out).length) e.cells = out; else delete e.cells;
  }
  /* 표를 잡은 채 칸 사이 경계를 끌면 열 너비·행 높이가 바뀜 */
  function tableBorderHit(ev) {
    const td = ev.target.closest ? ev.target.closest('th,td') : null; const node = td && td.closest('.el-table'); if (!node) return null;
    const e = elById(node.dataset.id); if (!e || e.type !== 'table' || e.locked || e.rotate || !(S.sel.includes(e.id) || S.editing === e.id)) return null;
    const nr = e.rows.length, nc = e.rows[0].length, r = +td.dataset.r, c = +td.dataset.c, rs = td.rowSpan || 1, cs = td.colSpan || 1;
    const b = td.getBoundingClientRect(), th = 7;
    if (ev.clientX > b.right - th && c + cs < nc) return { e, node, axis: 'c', i: c + cs - 1 };
    if (ev.clientX < b.left + th && c > 0) return { e, node, axis: 'c', i: c - 1 };
    if (ev.clientY > b.bottom - th && r + rs < nr) return { e, node, axis: 'r', i: r + rs - 1 };
    if (ev.clientY < b.top + th && r > 0) return { e, node, axis: 'r', i: r - 1 };
    return null;
  }
  function startTableLineDrag(ev, hit) {
    const { e, node, axis, i } = hit; if (S.editing === e.id) endEdit();
    const n = axis === 'c' ? e.rows[0].length : e.rows.length, key = axis === 'c' ? 'cols' : 'rh', total = axis === 'c' ? e.w : e.h;
    const px0 = tableWeights(e[key], n).map(v => v * total); const s0 = axis === 'c' ? ev.clientX : ev.clientY, min = 24;
    const apply = (w) => { const els = node.querySelectorAll(axis === 'c' ? 'col' : 'tr'); w.forEach((v, k) => { if (els[k]) els[k].style[axis === 'c' ? 'width' : 'height'] = (v * 100).toFixed(3) + '%'; }); };
    let w = null;
    track((m) => {
      const d = ((axis === 'c' ? m.clientX : m.clientY) - s0) / S.k;
      const a = clamp(px0[i] + d, min, px0[i] + px0[i + 1] - min); const px = px0.slice(); px[i] = a; px[i + 1] = px0[i] + px0[i + 1] - a;
      w = px.map(v => v / total); apply(w);
    }, () => { if (!w) return; e[key] = w.map(v => Math.round(v * 1000) / 1000); commit(); rerenderEl(e.id); renderOverlay(); });
  }
  stage.addEventListener('click', (ev) => { if (ev.target.closest && ev.target.closest('a')) ev.preventDefault(); });
  stage.addEventListener('pointermove', (ev) => {
    if (ev.buttons || !slideNode) return;
    const h = (S.sel.length === 1 || S.editing) ? tableBorderHit(ev) : null;
    slideNode.classList.toggle('tbl-c', !!h && h.axis === 'c'); slideNode.classList.toggle('tbl-r', !!h && h.axis === 'r');
  });
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
    if (target.dataset.r != null) S.cell = { id, r: +target.dataset.r, c: +target.dataset.c };
    showTextToolbar(node);
  }
  function onCellFocus(ev) { const c = ev.target; if (c.dataset && c.dataset.r != null) S.cell = { id: S.editing, r: +c.dataset.r, c: +c.dataset.c }; }
  function onEditBlur() {
    // 같은 요소 안(다른 표 칸)이나 글 도구 막대로 옮긴 것은 편집 계속
    setTimeout(() => {
      if (!S.editing) return; const n = nodeOf(S.editing), a = document.activeElement; if ((n && n.contains(a)) || (textToolbar && textToolbar.contains(a))) return;
      // 글자를 끌어서 고른 채 속성 창의 크기·색 칸으로 간 경우: 편집을 이어 감 (값을 정하면 그 글자에만 적용)
      if (a && a.dataset && HOLD_KEYS.includes(a.dataset.k) && props.contains(a) && editRange && !editRange.collapsed) { a.addEventListener('blur', onEditBlur, { once: true }); return; }
      endEdit();
    }, 0);
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
      const rows = readTableRows(node, e);
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
    return safeHtml(out);
  }
  /* ---- 글 편집 중 "끌어서 고른 글자만" 크기 바꾸기 ---- */
  let editRange = null; // 글 도구의 크기 칸으로 초점이 옮겨가도 고른 범위를 기억
  function selInEdit() { const n = S.editing && nodeOf(S.editing), sel = window.getSelection(); if (!n || !sel.rangeCount) return null; const r = sel.getRangeAt(0); return n.contains(r.commonAncestorContainer) ? r : null; }
  document.addEventListener('selectionchange', () => { if (!S.editing) return; const r = selInEdit(); if (r) { editRange = r.cloneRange(); syncSizeBox(); } });
  function restoreEditRange() {
    const n = S.editing && nodeOf(S.editing); if (!n || !editRange || !n.contains(editRange.commonAncestorContainer)) return false;
    const c = editRange.commonAncestorContainer, host = (c.nodeType === 1 ? c : c.parentNode).closest('[contenteditable="true"]'); if (host) host.focus();
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(editRange); return true;
  }
  /* 커서(또는 고른 글자의 첫머리) 자리의 글자 크기 */
  function caretFontSize() {
    const r = selInEdit() || editRange; if (!r) return null; let n = r.startContainer;
    if (!r.collapsed) { const w = document.createTreeWalker(r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentNode, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) { if (!t.length || !r.intersectsNode(t)) continue; if (t === r.startContainer && r.startOffset >= t.length) continue; n = t; break; } }
    if (n.nodeType !== 1) n = n.parentNode;
    return n ? Math.round(parseFloat(getComputedStyle(n).fontSize)) || null : null;
  }
  const HOLD_KEYS = ['style.fontSize', 'style.color'];
  /* 글 편집 중 끌어서 고른 글자가 있는가 (속성 창 칸에 초점이 가 있으면 기억해 둔 범위를 되살림) */
  function ensureEditSel() {
    if (!S.editing) return false; const r = selInEdit(); if (r) return !r.collapsed;
    if (editRange && !editRange.collapsed && restoreEditRange()) { const r2 = selInEdit(); return !!(r2 && !r2.collapsed); }
    return false;
  }
  function syncSizeBox() { if (!textToolbar) return; const b = textToolbar.querySelector('[data-fs]'); if (b && document.activeElement !== b) { const v = caretFontSize(); if (v) b.value = v; } }
  const fitFs = (v) => clamp(Math.round(v), 8, 400);
  /* 고른 글자만: delta(±) 만큼, 또는 abs(px) 로. 고른 글자가 없으면 false (→ 상자 전체를 바꿈) */
  function sizeSelection(delta, abs) {
    const r = selInEdit(); if (!r || r.collapsed) return false;
    const c = r.commonAncestorContainer, root = c.nodeType === 1 ? c : c.parentNode;
    const sc = r.startContainer, so = r.startOffset, ec = r.endContainer, eo = r.endOffset;
    const texts = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t;
    while ((t = w.nextNode())) if (t.length && r.intersectsNode(t)) texts.push(t);
    const done = [];
    for (let n of texts) { // 고른 글자 조각마다: 지금 크기를 재서 그 조각만 감쌈 (이미 크기를 준 조각이면 그 값을 고침)
      const s = n === sc ? so : 0, e2 = n === ec ? eo : n.length; if (e2 <= s) continue;
      if (e2 < n.length) n.splitText(e2);
      if (s > 0) n = n.splitText(s);
      const p = n.parentNode, cur = parseFloat(getComputedStyle(p).fontSize) || 40, v = fitFs(abs != null ? abs : cur + delta) + 'px';
      let hit = null; for (let q = p; q && q.childNodes.length === 1 && q.getAttribute('contenteditable') !== 'true'; q = q.parentNode) if (q.tagName === 'SPAN' && q.style.fontSize) { hit = q; break; }
      if (hit) { hit.style.fontSize = v; done.push(hit); }
      else { const sp = document.createElement('span'); sp.style.fontSize = v; p.insertBefore(sp, n); sp.appendChild(n); done.push(sp); }
    }
    if (!done.length) return false;
    const sel = window.getSelection(), nr = document.createRange(); nr.setStartBefore(done[0]); nr.setEndAfter(done[done.length - 1]); sel.removeAllRanges(); sel.addRange(nr);
    markDirty(); syncSizeBox(); positionTextToolbar(); return true;
  }
  /* 상자 전체 크기를 바꿀 때: 글 안에 따로 크기를 준 부분도 같은 만큼 (delta) 또는 같은 비율 (k) 로 */
  const inlineFs = (html, fn) => (html && html.indexOf('font-size') >= 0) ? html.replace(/font-size:\s*([\d.]+)px/g, (m, v) => 'font-size: ' + fitFs(fn(+v)) + 'px') : html;
  function bumpInline(e, fn) {
    if (e.type === 'table') { if (e.rows) e.rows = e.rows.map(r => r.map(c => inlineFs(c, fn))); }
    else if (e.html) e.html = inlineFs(e.html, fn);
  }
  function exec(cmd, val) { document.execCommand(cmd, false, val); }
  /* 글자 도구 막대를 직접 옮겨 둔 자리 (없으면 편집 중인 상자 바로 위) */
  const TTB_KEY = 'gyoan:ttbPos';
  let ttbPos = null; try { const t = JSON.parse(localStorage.getItem(TTB_KEY) || 'null'); if (t && isFinite(t.left) && isFinite(t.top)) ttbPos = { left: +t.left, top: +t.top }; } catch (e) { }
  function showTextToolbar(node) {
    hideTextToolbar();
    const e = elById(node.dataset.id); const st = resolveTextStyle(e, theme());
    textToolbar = document.createElement('div'); textToolbar.className = 'text-toolbar';
    textToolbar.innerHTML = `
      <span class="grip" title="끌어서 옮기기 · 옮긴 자리에 계속 뜹니다 (두 번 누르면 다시 상자 위로)">⠿</span>
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
      <button class="btn" data-cmd="size-" title="글자 작게 (Ctrl+[) · 끌어서 고른 글자만, 고르지 않았으면 상자 전체">A−</button>
      <input type="number" data-fs min="8" max="400" step="2" value="${Math.round(st.fontSize)}" title="글자 크기 · 끌어서 고른 글자만, 고르지 않았으면 상자 전체">
      <button class="btn" data-cmd="size+" title="글자 크게 (Ctrl+]) · 끌어서 고른 글자만, 고르지 않았으면 상자 전체">A+</button>
      <button class="btn" data-cmd="link" title="링크 (Ctrl+K)">🔗</button>
      <button class="btn" data-cmd="sym" title="기호 넣기 (① Ⅳ ★ → ㎡ ℃ …)">Ω</button>
      <button class="btn" data-cmd="removeFormat" title="서식 지우기">✕</button>${e.type !== 'table' ? '' : `
      <span class="sep"></span>
      <input type="color" data-cmd="cellFill" value="#fde68a" title="이 칸 배경색">
      <button class="btn" data-cmd="cellFillClear" title="칸 배경색 지우기">⌫</button>
      <button class="btn" data-cmd="cellAlign" data-val="left" title="칸 왼쪽 정렬">⇤</button><button class="btn" data-cmd="cellAlign" data-val="center" title="칸 가운데 정렬">↔</button><button class="btn" data-cmd="cellAlign" data-val="right" title="칸 오른쪽 정렬">⇥</button>
      <button class="btn" data-cmd="mergeR" title="오른쪽 칸과 합치기">합→</button><button class="btn" data-cmd="mergeD" title="아래 칸과 합치기">합↓</button><button class="btn" data-cmd="split" title="합친 칸 나누기">나누기</button>
      <span class="sep"></span>
      <button class="btn" data-cmd="rowAdd" title="이 칸 아래에 행 추가">＋행</button><button class="btn del" data-cmd="rowDel" title="이 칸이 있는 행 삭제">－행</button><button class="btn" data-cmd="colAdd" title="이 칸 오른쪽에 열 추가">＋열</button><button class="btn del" data-cmd="colDel" title="이 칸이 있는 열 삭제">－열</button>`}`;
    textToolbar.addEventListener('mousedown', (ev) => { if (ev.target.tagName !== 'INPUT') ev.preventDefault(); });
    // 손잡이(⠿)나 막대의 빈 곳을 끌어서 옮김 — 옮긴 자리는 기억해 두고 다음에도 그 자리에 띄움
    const tb = textToolbar, grip = tb.querySelector('.grip');
    tb.addEventListener('pointerdown', (ev) => {
      if (ev.button || !(ev.target === grip || ev.target === tb || ev.target.classList.contains('sep'))) return;
      const mr = main.getBoundingClientRect(), r = tb.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top, x0 = ev.clientX, y0 = ev.clientY;
      let moved = false;
      const move = (m) => {
        if (!moved && Math.abs(m.clientX - x0) + Math.abs(m.clientY - y0) < 4) return;
        moved = true; tb.classList.add('dragging');
        ttbPos = { left: Math.round(m.clientX - mr.left - dx), top: Math.round(m.clientY - mr.top - dy) }; positionTextToolbar();
      };
      const up = () => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        tb.classList.remove('dragging');
        if (moved) { tb.classList.add('moved'); try { localStorage.setItem(TTB_KEY, JSON.stringify(ttbPos)); } catch (e) { } }
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
    grip.addEventListener('dblclick', () => { ttbPos = null; tb.classList.remove('moved'); try { localStorage.removeItem(TTB_KEY); } catch (e) { } positionTextToolbar(); toast('도구 막대를 다시 상자 위에 붙였습니다'); });
    tb.classList.toggle('moved', !!ttbPos);
    textToolbar.addEventListener('click', (ev) => {
      const sb = ev.target.closest('[data-sym]'); if (sb) { exec('insertText', sb.dataset.sym); return; }
      const b = ev.target.closest('[data-cmd]'); if (!b || b.tagName === 'INPUT') return;
      const cmd = b.dataset.cmd; const e = elById(S.editing); if (!e) return;
      if (cmd === 'size+' || cmd === 'size-') { fontSizeStep(cmd === 'size+' ? 4 : -4); return; }
      if (cmd === 'hilite') { exec('hiliteColor', '#fde68a'); return; }
      if (cmd === 'sym') { let pop = textToolbar.querySelector('.sym-pop'); if (pop) { pop.remove(); return; } pop = document.createElement('div'); pop.className = 'sym-pop'; pop.innerHTML = SYMBOLS.map(c => `<button class="btn" data-sym="${esc(c)}">${esc(c)}</button>`).join(''); textToolbar.appendChild(pop); return; }
      if (cmd === 'link') { const u = prompt('링크 주소'); if (u) exec('createLink', u); return; }
      if (/^(cellFillClear|cellAlign|mergeR|mergeD|split)$/.test(cmd)) { cellOp(cmd, b.dataset.val); return; }
      if (/^(row|col)(Add|Del)$/.test(cmd)) { const id = e.id; tableOp(cmd); if (S.cell && S.cell.id === id) { const c = S.cell; startEdit(id); focusCell(id, c.r, c.c); S.cell = { id, r: c.r, c: c.c }; } return; } // 하던 편집을 이어 감
      exec(cmd);
    });
    textToolbar.querySelector('input[type=color]').addEventListener('input', (ev) => exec('foreColor', ev.target.value));
    const fsBox = textToolbar.querySelector('[data-fs]');
    const fsApply = () => {
      const v = +fsBox.value, e = elById(S.editing); if (!e || !isFinite(v) || v <= 0) { syncSizeBox(); return; }
      restoreEditRange();
      if (!sizeSelection(0, fitFs(v))) { e.style = e.style || {}; e.style.fontSize = fitFs(v); applyElementTextStyle(e, nodeOf(e.id), theme()); markDirty(); renderProps(); positionTextToolbar(); }
      fsBox.value = fitFs(v);
    };
    fsBox.addEventListener('change', fsApply);
    fsBox.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Enter') { ev.preventDefault(); fsApply(); } else if (ev.key === 'Escape') { ev.preventDefault(); restoreEditRange(); } });
    const cf = textToolbar.querySelector('input[data-cmd=cellFill]'); if (cf) cf.addEventListener('input', (ev) => cellOp('cellFill', ev.target.value));
    main.appendChild(textToolbar); positionTextToolbar();
  }
  function positionTextToolbar() {
    if (!textToolbar || !S.editing) return;
    const node = nodeOf(S.editing); if (!node) return;
    const r = node.getBoundingClientRect(), mr = main.getBoundingClientRect();
    const tw = textToolbar.offsetWidth, th = textToolbar.offsetHeight;
    let left = r.left - mr.left + r.width / 2 - tw / 2, top = r.top - mr.top - th - 10;
    left = clamp(left, 8, mr.width - tw - 8); if (top < 8) top = r.bottom - mr.top + 10;
    if (ttbPos) { left = clamp(ttbPos.left, 8, Math.max(8, mr.width - tw - 8)); top = clamp(ttbPos.top, 8, Math.max(8, mr.height - th - 8)); } // 직접 옮겨 둔 자리 (화면 밖으로는 나가지 않게)
    textToolbar.style.left = left + 'px'; textToolbar.style.top = top + 'px';
  }
  function hideTextToolbar() { if (textToolbar) { textToolbar.remove(); textToolbar = null; } }

  /* ---------- 속성 패널 ---------- */
  const row = (label, html) => `<div class="prow"><label>${label}</label><div class="ctrls">${html}</div></div>`;
  const num = (k, v, step, min, max, title) => `<input type="number" data-k="${k}" value="${v == null ? '' : v}" step="${step || 1}" ${min != null ? `min="${min}"` : ''} ${max != null ? `max="${max}"` : ''} ${title ? `title="${title}"` : ''}>`;
  /* ---------- 색 팔레트 ----------
     색 칸(□)을 누르면 브라우저의 색 고르기 창 대신 대표색 팔레트를 먼저 보여 줍니다.
     (테마 색 · 색상별 5단계 · 무채색 · 최근 쓴 색 · 색 번호 직접 입력 · 화면에서 따오기 · 세밀하게 고르기)
     고른 색은 원래 색 칸에 그대로 넣고 input/change 를 알리므로, 색을 쓰는 모든 곳이 그대로 동작합니다. */
  const PAL_HUES = [
    ['빨강', ['#fee2e2', '#fca5a5', '#ef4444', '#b91c1c', '#7f1d1d']], ['주황', ['#ffedd5', '#fdba74', '#f97316', '#c2410c', '#7c2d12']],
    ['노랑', ['#fef3c7', '#fcd34d', '#f59e0b', '#b45309', '#78350f']], ['연두', ['#ecfccb', '#bef264', '#84cc16', '#4d7c0f', '#365314']],
    ['초록', ['#dcfce7', '#86efac', '#22c55e', '#15803d', '#14532d']], ['청록', ['#ccfbf1', '#5eead4', '#14b8a6', '#0f766e', '#134e4a']],
    ['하늘', ['#e0f2fe', '#7dd3fc', '#0ea5e9', '#0369a1', '#0c4a6e']], ['파랑', ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a']],
    ['보라', ['#f3e8ff', '#d8b4fe', '#a855f7', '#7e22ce', '#581c87']], ['분홍', ['#fce7f3', '#f9a8d4', '#ec4899', '#be185d', '#831843']],
  ];
  const PAL_TONE = ['아주 연한', '연한', '기본', '진한', '아주 진한'];
  const PAL_GRAY = [['#ffffff', '흰색'], ['#f3f4f6', '아주 연한 회색'], ['#d1d5db', '연한 회색'], ['#9ca3af', '회색'], ['#6b7280', '중간 회색'], ['#4b5563', '진한 회색'], ['#374151', '짙은 회색'], ['#1f2937', '먹색'], ['#111827', '검정에 가까운'], ['#000000', '검정']];
  const PAL_KEY = 'gyoan:recentColors';
  let palRecent = []; try { const a = JSON.parse(localStorage.getItem(PAL_KEY) || '[]'); if (Array.isArray(a)) palRecent = a.filter(c => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 10); } catch (e) { }
  function palRemember(c) {
    c = String(c || '').toLowerCase(); if (!/^#[0-9a-f]{6}$/.test(c)) return;
    palRecent = [c].concat(palRecent.filter(x => x !== c)).slice(0, 10);
    try { localStorage.setItem(PAL_KEY, JSON.stringify(palRecent)); } catch (e) { }
  }
  let palPop = null;
  function closePalette() { if (palPop) { palPop.remove(); palPop = null; document.removeEventListener('pointerdown', palOutside, true); } }
  function palOutside(ev) { if (palPop && !palPop.contains(ev.target) && ev.target !== palPop._input) closePalette(); }
  function openPalette(input) {
    closePalette();
    const t = theme(), cur = String(input.value || '').toLowerCase(), inBar = !!input.closest('.text-toolbar');
    const sw = (c, title) => `<button type="button" class="cp-sw${c.toLowerCase() === cur ? ' on' : ''}" data-c="${c}" title="${esc(title)} ${c.toUpperCase()}" style="background:${c}"></button>`;
    const themeCols = THEME_COLOR_KEYS.map(([k, n]) => [toHex(t[k]), n]).filter((x, i, a) => a.findIndex(y => y[0] === x[0]) === i);
    const pop = palPop = document.createElement('div'); pop.className = 'cpal'; pop._input = input;
    pop.innerHTML = `
      <div class="cp-h">테마 색 <span>이 교안의 디자인 색</span></div>
      <div class="cp-row">${themeCols.map(([c, n]) => sw(c, n)).join('')}</div>
      <div class="cp-h">대표색 <span>위는 연하게 · 아래는 진하게</span></div>
      <div class="cp-grid">${PAL_TONE.map((tn, r) => PAL_HUES.map(([hn, cs]) => sw(cs[r], tn + ' ' + hn)).join('')).join('')}</div>
      <div class="cp-h">흰색 · 회색 · 검정</div>
      <div class="cp-grid">${PAL_GRAY.map(([c, n]) => sw(c, n)).join('')}</div>
      ${palRecent.length ? `<div class="cp-h">최근에 쓴 색</div><div class="cp-grid">${palRecent.map(c => sw(c, '최근')).join('')}</div>` : ''}
      <div class="cp-foot"><span class="cp-now" style="background:${cur}" title="지금 색"></span><input type="text" class="cp-hex" value="${cur}" maxlength="7" spellcheck="false" title="색 번호 (#rrggbb) — 고치고 Enter">
        ${window.EyeDropper ? '<button type="button" class="btn sm" data-pick title="화면의 아무 곳이나 눌러 그 색을 가져옵니다">🖍 화면에서</button>' : ''}<button type="button" class="btn sm" data-more title="색상판에서 세밀하게 고르기">세밀하게…</button></div>`;
    (inBar ? input.closest('.text-toolbar') : document.body).appendChild(pop);
    const r = input.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    let left = clamp(r.left, 8, window.innerWidth - pw - 8), top = r.bottom + 6; if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 6);
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
    const apply = (c, keep) => {
      c = String(c).toLowerCase(); if (!/^#[0-9a-f]{6}$/.test(c)) return false;
      if (inBar) restoreEditRange(); // 글 편집 중: 고른 글자에 색이 들어가게 범위를 되살림
      input.value = c; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
      palRemember(c); if (!keep) closePalette(); return true;
    };
    pop.addEventListener('mousedown', (ev) => { if (!ev.target.closest('.cp-hex')) ev.preventDefault(); ev.stopPropagation(); }); // 글 편집 범위·초점을 건드리지 않게
    pop.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    pop.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const b = ev.target.closest('.cp-sw'); if (b) { apply(b.dataset.c); return; }
      if (ev.target.closest('[data-more]')) { closePalette(); try { if (input.showPicker) input.showPicker(); else { input._native = true; input.click(); } } catch (e) { input._native = true; input.click(); } return; }
      if (ev.target.closest('[data-pick]')) { try { const res = await new window.EyeDropper().open(); if (res && res.sRGBHex) apply(res.sRGBHex); } catch (e) { } }
    });
    const hex = pop.querySelector('.cp-hex');
    hex.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Enter') { ev.preventDefault(); let v = hex.value.trim(); if (/^[0-9a-f]{6}$/i.test(v)) v = '#' + v; if (/^#[0-9a-f]{3}$/i.test(v)) v = '#' + v.slice(1).split('').map(x => x + x).join(''); if (!apply(v)) { hex.select(); toast('색 번호는 #1f7a5a 처럼 넣어 주세요'); } } else if (ev.key === 'Escape') { ev.preventDefault(); closePalette(); } });
    document.addEventListener('pointerdown', palOutside, true);
  }
  // 색 칸을 누르면: 팔레트 (세밀하게… 를 고르면 브라우저의 색 고르기 창)
  document.addEventListener('click', (ev) => {
    const inp = ev.target.closest && ev.target.closest('input[type=color]'); if (!inp || inp.disabled) return;
    if (inp._native) { inp._native = false; return; }
    ev.preventDefault();
    if (palPop && palPop._input === inp) closePalette(); else openPalette(inp);
  }, true);
  document.addEventListener('change', (ev) => { const inp = ev.target; if (inp && inp.matches && inp.matches('input[type=color]')) palRemember(inp.value); }, true);
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && palPop) { ev.stopPropagation(); closePalette(); } }, true);
  window.addEventListener('resize', closePalette);

  const colorIn = (k, v) => `<input type="color" data-k="${k}" value="${toHex(v)}">`;
  const selIn = (k, v, opts) => `<select data-k="${k}">${opts.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(v) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
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

  let propsEvt = 0, tabFrom = null;
  const focusSig = (a) => a && a.dataset && props.contains(a) ? (a.dataset.cg != null ? `[data-cg="${a.dataset.cg}"]` : a.dataset.k ? `${a.tagName.toLowerCase()}[data-k="${a.dataset.k}"]` : null) : null;
  props.addEventListener('keydown', (ev) => { if (ev.key === 'Tab') tabFrom = { t: Date.now(), shift: ev.shiftKey, sig: focusSig(ev.target) }; }, true);
  props.addEventListener('pointerdown', () => { S.focus = 'props'; }, true);
  function renderProps() {
    const sig = propsEvt ? focusSig(document.activeElement) : null, tf = propsEvt ? tabFrom : null;
    renderProps1();
    if (!propsEvt) return;
    let el = sig ? props.querySelector(sig) : null;
    if (!el && tf && tf.sig && Date.now() - tf.t < 400) { // Tab 으로 넘어가는 순간 창이 다시 그려진 경우: 다음(Shift 는 이전) 칸으로
      const from = props.querySelector(tf.sig), list = Array.from(props.querySelectorAll('input,select,textarea')).filter(x => !x.disabled && x.offsetParent);
      el = from ? list[list.indexOf(from) + (tf.shift ? -1 : 1)] || null : null; tabFrom = null;
    }
    if (el && document.activeElement !== el) { try { el.focus({ preventScroll: true }); if (el.select && /^(text|number)$/.test(el.type)) el.select(); } catch (err) { } }
  }
  function renderProps1() {
    const els = selEls();
    if (!els.length) props.innerHTML = slideProps();
    else if (els.length === 1) props.innerHTML = elementProps(els[0]);
    else props.innerHTML = multiProps(els);
    // 묶음마다 성격에 맞는 색 (ui.css 의 section[data-kind])
    props.querySelectorAll('section').forEach(sec => {
      const h = sec.querySelector('h4'), t = h && h.firstChild ? String(h.firstChild.textContent || '') : '';
      sec.dataset.kind = !h ? 'act' : /배경/.test(t) ? 'bg' : /노트/.test(t) ? 'note' : /슬라이드 작업/.test(t) ? 'slide' : /교안 전체/.test(t) ? 'deck' : /위치|개 선택/.test(t) ? 'pos' : /애니메이션/.test(t) ? 'anim' : /링크/.test(t) ? 'link'
        : /텍스트|글자/.test(t) ? 'text' : /꾸밈|보정|자르기/.test(t) ? 'style' : 'obj';
    });
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
      ${row('', `<button class="btn sm" data-act="bgAll" title="지금 슬라이드의 배경(종류·색·이미지)을 모든 슬라이드에 똑같이">이 배경을 모든 슬라이드에</button>`)}
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
    return `<section><h4>위치 · 크기 ${tog('locked', e.locked, e.locked ? '🔒 잠김' : '🔓', '잠그면 이동/크기 조절이 안 됩니다')} ${tog('ratioLock', e.ratioLock, '⛶ 비율', '비율 고정: 너비나 높이를 바꾸면 다른 쪽도 따라 바뀝니다 (Shift 없이 끌어도 유지)')}</h4>
      <div class="grid4">
        ${num('x', e.x, 1, null, null, 'X')}${num('y', e.y, 1, null, null, 'Y')}${num('w', e.w, 1, 16, null, '너비')}${num('h', e.h, 1, 16, null, '높이')}
      </div>
      <div class="prow" style="margin-top:6px"><label>회전</label><div class="ctrls">${num('rotate', e.rotate || 0, 1, -180, 180)}${small('투명도')}${num('opacity', Math.round((e.opacity == null ? 1 : e.opacity) * 100), 5, 0, 100)}</div></div>
      ${e.group ? hint('⛓ 묶음에 들어 있습니다 · Ctrl+Shift+G 로 풀기 · Alt+클릭으로 하나만 선택') : ''}
    </section>`;
  }
  /* 최근 쓴 글꼴 (이 기기에 저장 · 최근 것이 맨 위) */
  const RECENT_FONT_KEY = 'gyoan:recentFonts';
  const recentFonts = () => { let l = []; try { l = JSON.parse(localStorage.getItem(RECENT_FONT_KEY)) || []; } catch (e) { } return l.filter(id => FONTS.some(f => f.id === id)); };
  function touchFont(id) { if (!id || !FONTS.some(f => f.id === id)) return; const l = [id].concat(recentFonts().filter(x => x !== id)).slice(0, 8); try { localStorage.setItem(RECENT_FONT_KEY, JSON.stringify(l)); } catch (e) { } }
  function fontOptions(v, first) {
    const opt = (id, name) => `<option value="${esc(id)}" ${String(id) === String(v || '') ? 'selected' : ''}>${esc(name)}</option>`;
    const rec = recentFonts(); const nm = id => (FONTS.find(f => f.id === id) || {}).name || id;
    return (first ? opt(first[0], first[1]) : '') + (rec.length ? `<optgroup label="최근 사용">${rec.map(id => opt(id, nm(id))).join('')}</optgroup>` : '') + `<optgroup label="모든 글꼴">${FONTS.map(f => opt(f.id, f.name)).join('')}</optgroup>`;
  }
  function fontRows(e, st, o) {
    o = o || {};
    return `${row('글꼴', `<select data-k="style.font">${fontOptions(st.font)}</select>`)}
      ${row('크기', num('style.fontSize', st.fontSize, 2, 8, 400) + choice('style.fontSize', st.fontSize, (o.sizes || [24, 32, 40, 56, 72]).map(v => [v, String(v)])))}
      ${row('색', colorIn('style.color', st.color) + '<div style="flex:3">' + swatches('style.color') + '</div>')}
      ${row('스타일', tog('style.bold', st.bold, '<b>B</b>', '굵게 (Ctrl+B)') + tog('style.italic', st.italic, '<i>I</i>', '기울임 (Ctrl+I)') + tog('style.underline', st.underline, '<u>U</u>', '밑줄') + tog('style.tshadow', st.tshadow, '그림자', '글자 그림자 (사진 위 글자에 좋음)') + (e.type === 'text' || e.type === 'shape' ? tog('style.vertical', st.vertical, '세로', '세로 쓰기') : ''))}
      ${row('외곽선', num('style.outline', st.outline || 0, 0.5, 0, 10, '글자 테두리 두께 (0 = 없음)') + colorIn('style.outlineColor', st.outlineColor || '#000000'))}
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
        ${row('줄 간격', num('style.lineHeight', st.lineHeight || 1.5, 0.1, 0.8, 3) + small('자간') + num('style.letterSpacing', st.letterSpacing || 0, 0.5, -5, 20) + small('문단') + num('style.paraGap', st.paraGap || 0, 2, 0, 200, '문단(줄바꿈) 사이 간격'))}
        ${row('글머리', selIn('style.list', st.list || '', LISTS))}
        ${row('맞춤', `<button class="btn sm" data-act="autofit" title="글이 상자 안에 꽉 차도록 글자 크기를 맞춥니다">글자 크기 자동 맞춤</button>`)}
        ${isIconText(e) ? row('아이콘', `<button class="btn sm" data-act="bgRemove" title="아이콘의 바탕 칸(색 네모·동그라미 등)을 눌러서 지웁니다 · 아이콘은 그림으로 바뀝니다">🪄 아이콘 배경 지우기…</button>`) : ''}
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
        ${e.src ? row('배경', `<button class="btn sm" data-act="bgRemove" title="바탕색(흰 배경 등)을 투명하게 만듭니다 · 지울 곳을 눌러 고를 수 있습니다">🪄 배경 지우기…</button>`) : ''}
        ${row('맞춤', choice('fit', e.fit || 'contain', [['contain', '맞추기'], ['cover', '채우기'], ['fill', '늘이기']]))}
        ${row('모양', selIn('mask', e.mask || '', MASKS))}
        ${row('모서리', num('radius', e.radius || 0, 4, 0, 400))}
        ${row('테두리', num('border', e.border || 0, 1, 0, 40) + colorIn('borderColor', e.borderColor || '#ffffff'))}
        ${row('효과', tog('shadow', e.shadow, '그림자') + tog('flip', e.flip, '좌우 반전') + tog('flipV', e.flipV, '상하 반전'))}
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
        ${row('효과', tog('shadow', e.shadow, '그림자') + (line ? '' : tog('flip', e.flip, '좌우 반전') + tog('flipV', e.flipV, '상하 반전')))}
      </section>
      ${line ? '' : `<section><h4>도형 안 글자 <span class="muted" style="text-transform:none;font-weight:400">더블클릭으로 입력</span></h4>${fontRows(e, st)}
        ${row('안쪽 여백', num('style.padding', st.padding == null ? '' : st.padding, 4, 0, 300, '비우면 자동 (도형 크기의 4%·8%)'))}</section>`}`;
    } else if (e.type === 'table') {
      body = `<section><h4>표 <span class="muted" style="text-transform:none;font-weight:400">더블클릭: 칸 편집 · Tab: 다음 칸</span></h4>
        ${(() => { const tc = S.cell && S.cell.id === e.id ? S.cell : null, nr = e.rows.length, nc = e.rows[0] ? e.rows[0].length : 1;
          const rn = tc ? Math.min(tc.r, nr - 1) + 1 : nr, cn = tc ? Math.min(tc.c, nc - 1) + 1 : nc;
          return row('삭제', `<button class="btn sm danger" data-act="rowDel" ${nr > 1 ? '' : 'disabled'}>－ ${rn}행 삭제</button><button class="btn sm danger" data-act="colDel" ${nc > 1 ? '' : 'disabled'}>－ ${cn}열 삭제</button>`)
            + row('행 추가', `<button class="btn sm" data-act="rowAddBefore">＋ 위에</button><button class="btn sm" data-act="rowAdd">＋ 아래에</button>`)
            + row('열 추가', `<button class="btn sm" data-act="colAddBefore">＋ 왼쪽에</button><button class="btn sm" data-act="colAdd">＋ 오른쪽에</button>`)
            + hint(tc ? '표에서 누른 칸(노란 점선)이 기준입니다. 표 위·왼쪽의 ✕ 를 누르면 그 열·행을 바로 지웁니다 · 되돌리기 Ctrl+Z' : '표의 칸을 한 번 누르면 그 칸이 기준이 됩니다 (지금은 마지막 행·열). 표 위·왼쪽의 ✕ 를 누르면 그 열·행을 바로 지웁니다'); })()}
        ${row('너비·높이', `<button class="btn sm" data-act="colsEven" ${e.cols ? '' : 'disabled'}>열 너비 균등</button><button class="btn sm" data-act="rowsEven" ${e.rh ? '' : 'disabled'}>행 높이 균등</button>`)}
        ${hint('표를 잡은 채 칸 사이 경계를 끌면 열 너비·행 높이가 바뀝니다. 칸을 더블클릭해 편집할 때 도구 막대에서 칸 배경색 · 정렬 · 합치기')}
        ${row('강조', tog('header', e.header, '첫 행 머리글') + tog('firstCol', e.firstCol, '첫 열 굵게'))}
        ${row('줄무늬', tog('band', e.band, '한 줄씩 배경'))}
        ${row('선', choice('lines', e.lines || 'grid', [['grid', '격자'], ['h', '가로선'], ['none', '없음']]) + colorIn('lineColor', e.lineColor || '$muted'))}
        ${row('머리글 색', colorIn('headFill', e.headFill || '$accent') + '<div style="flex:3">' + swatches('headFill') + '</div>')}
        ${row('모서리', num('radius', e.radius || 0, 2, 0, 80))}
      </section>
      <section><h4>표 글자</h4>${fontRows(e, st, { valign: false, sizes: [20, 24, 28, 32, 40] })}</section>`;
    } else if (e.type === 'chart') {
      const g = chartGrid(e.data);
      body = `<section><h4>차트</h4>
        <div class="chart-kinds">${CHART_KINDS.map(([k, n]) => `<button class="ck ${(e.kind || 'bar') === k ? 'active' : ''}" data-k="kind" data-val="${k}" title="${n}">${chartPicto(k)}<span>${n}</span></button>`).join('')}</div>
        ${hint('아래 표에 바로 적으면 슬라이드의 차트가 따라 바뀝니다 · 첫 줄은 제목, 첫 칸은 항목 이름 · 엑셀 표를 복사해 칸에 붙여넣어도 됩니다')}
        <div class="cgrid-wrap"><table class="cgrid">${g.map((r, i) => `<tr>${r.map((c, j) => `<td><input type="text" data-cg="${i},${j}" value="${esc(c)}" ${i === 0 ? 'class="hd"' : ''} placeholder="${i === 0 ? (j === 0 ? '항목' : '계열 ' + j) : (j === 0 ? '이름' : '값')}"></td>`).join('')}</tr>`).join('')}</table></div>
        <div class="cgrid-tools"><button class="btn sm" data-act="cgRow">＋ 줄</button><button class="btn sm" data-act="cgCol">＋ 계열</button><button class="btn sm" data-act="cgRowDel" title="마지막 줄 지우기">－ 줄</button><button class="btn sm" data-act="cgColDel" title="마지막 계열 지우기">－ 계열</button></div>
        <details class="cgrid-raw"><summary class="muted" style="font-size:11.5px;cursor:pointer">텍스트로 편집 (쉼표·탭 구분)</summary><textarea data-k="data" class="mono" style="min-height:110px;margin-top:6px" spellcheck="false">${esc(e.data || '')}</textarea></details>
        ${row('표시', tog('values', e.values, '값') + tog('legend', e.legend, '범례') + tog('grid', e.grid !== false, '격자') + tog('axis', e.axis !== false, '눈금', '축의 숫자 눈금'))}
        ${row('계열 색', (() => { const ser = parseChartData(e.data).series, pal = chartPalette(e, theme()); return ser.slice(0, 8).map((s, i) => `<label class="ck-col" title="${esc(s.name || '계열 ' + (i + 1))}">${colorIn('colors.' + i, pal[i])}</label>`).join('') + (e.colors ? '<button class="btn sm" data-act="colorsReset" title="테마의 강조색 순서로 되돌림">테마 색</button>' : ''); })())}
        ${row('단위', `<input type="text" data-k="unit" value="${esc(e.unit || '')}" placeholder="예: %, 명, 억원">`)}
        ${e.kind === 'donut' ? row('가운데', `<input type="text" data-k="center" value="${esc(e.center || '')}" placeholder="가운데 큰 글자 (예: 72%)">`) : ''}
        ${row('글자 크기', num('style.fontSize', st.fontSize, 2, 10, 80))}
        ${row('글자 색', colorIn('style.color', st.color) + '<div style="flex:3">' + swatches('style.color') + '</div>')}
        ${hint('계열 색을 바꾸지 않으면 테마의 강조색 순서로 칠해집니다 · 발표 때 막대가 자라나는 효과가 나옵니다')}
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
        ${p.kind === 'web' ? '' : row('재생 범위', `<input type="text" data-k="start" value="${esc(e.start ? fmtClock(e.start) : '')}" placeholder="시작 1:30" style="width:84px" title="이 시점부터 (분:초 또는 초)"> <span class="muted">~</span> <input type="text" data-k="end" value="${esc(e.end ? fmtClock(e.end) : '')}" placeholder="끝 2:45" style="width:84px" title="이 시점에서 멈춤 (비우면 끝까지)">`)}
        ${p.kind === 'web' ? '' : hint('영상을 따로 자르지 않아도 됩니다 · 분:초 로 적으면 그 구간만 재생 · ▶ 를 눌러 편집 화면에서 바로 확인')}
        ${row('모서리', num('radius', e.radius || 0, 4, 0, 200))}
        ${row('효과', tog('shadow', e.shadow, '그림자'))}
        ${row('', `<button class="btn sm" data-act="playHere">▶ 여기서 재생</button><button class="btn sm" data-act="openEmbed">새 창에서 확인</button>`)}
        ${row('파일로 넣기', `<button class="btn sm" data-act="pickVideo" title="PC 의 동영상 파일(mp4)을 이 상자에">🎞 동영상 파일…</button><button class="btn sm" data-act="pickPpt" title="PPT 파일 안에 들어 있는 영상을 이 상자에">📽 PPT 에서…</button>`)}
        ${hint('동영상 파일을 복사(Ctrl+C)해서 붙여넣거나(Ctrl+V) 끌어다 놓아도 됩니다 · PowerPoint 안의 영상은 [PPT 에서…] 로 그 PPT 파일을 한 번 열어 두면, 그 뒤로는 PowerPoint 에서 복사해 붙여넣어도 영상으로 들어갑니다')}
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

  /* 차트 데이터 ↔ 표 칸 */
  function chartGrid(text) {
    const rows = String(text || '').split(/\r?\n/).filter(l => l.trim()).map(l => l.split(/\t|,/).map(c => c.trim()));
    const nc = Math.max(2, ...rows.map(r => r.length)); while (rows.length < 2) rows.push([]);
    return rows.map(r => r.concat(Array(nc - r.length).fill('')));
  }
  function gridText(grid) { return grid.map(r => r.map(c => String(c).replace(/[,\t\r\n]/g, ' ')).join(',')).join('\n'); }
  function readGrid() { const g = []; props.querySelectorAll('input[data-cg]').forEach(i => { const [r, c] = i.dataset.cg.split(',').map(Number); (g[r] = g[r] || [])[c] = i.value; }); return g.map(r => Array.from(r, x => x == null ? '' : x)); }
  function setChartGrid(g, doCommit) { const t = gridText(g); const ta = props.querySelector('textarea[data-k="data"]'); if (ta) ta.value = t; setProp('data', t, doCommit); }
  const CHART_PICTO = {
    bar: '<rect x="3" y="12" width="5" height="12"/><rect x="11" y="5" width="5" height="19"/><rect x="19" y="9" width="5" height="15"/>',
    hbar: '<rect x="2" y="3" width="20" height="5"/><rect x="2" y="11" width="13" height="5"/><rect x="2" y="19" width="17" height="5"/>',
    stack: '<rect x="3" y="14" width="5" height="10"/><rect x="3" y="8" width="5" height="6" opacity=".55"/><rect x="11" y="10" width="5" height="14"/><rect x="11" y="3" width="5" height="7" opacity=".55"/><rect x="19" y="16" width="5" height="8"/><rect x="19" y="11" width="5" height="5" opacity=".55"/>',
    line: '<polyline points="3,20 9,11 15,15 23,5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>',
    area: '<path d="M3 22 L3 18 L9 10 L15 14 L23 5 L23 22 Z" opacity=".75"/>',
    pie: '<path d="M13 13 L13 2 A11 11 0 1 1 3.6 18.5 Z"/><path d="M13 13 L3.6 18.5 A11 11 0 0 1 13 2 Z" opacity=".45"/>',
    donut: '<path d="M13 2 A11 11 0 1 1 3.6 18.5 L7.6 16.2 A6.4 6.4 0 1 0 13 6.6 Z"/><path d="M3.6 18.5 A11 11 0 0 1 13 2 L13 6.6 A6.4 6.4 0 0 0 7.6 16.2 Z" opacity=".45"/>',
  };
  const chartPicto = (k) => `<svg viewBox="0 0 26 26" width="30" height="30" fill="currentColor" aria-hidden="true">${CHART_PICTO[k] || CHART_PICTO.bar}</svg>`;
  props.addEventListener('paste', (ev) => { // 엑셀 표를 칸에 붙여넣으면 표 전체를 바꿈
    const t = ev.target; if (!t.dataset || t.dataset.cg == null) return;
    const text = ev.clipboardData.getData('text/plain') || ''; if (!/\t|\n/.test(text.trim())) return;
    ev.preventDefault(); ev.stopPropagation();
    const clean = text.split(/\r?\n/).map(l => l.split('\t').map(v => { v = v.trim(); return /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(v) ? v.replace(/,/g, '') : v.replace(/,/g, ' '); }).join('\t')).join('\n');
    setChartGrid(chartGrid(clean), true);
  });
  const ratioAt = new Map(); // 너비·높이 칸에 들어설 때의 가로세로 비율 (숫자를 한 자씩 치는 동안에도 같은 비율 유지)
  let ratioFor = null;
  const noteRatio = (t) => { if (!t.dataset || (t.dataset.k !== 'w' && t.dataset.k !== 'h') || ratioFor === t) return; ratioFor = t; ratioAt.clear(); for (const e of selEls()) if (e.w && e.h) ratioAt.set(e.id, e.w / e.h); };
  props.addEventListener('focusin', (ev) => noteRatio(ev.target));
  const emptyNum = (t) => t.type === 'number' && t.value.trim() === '';
  /* 속성 변경 */
  props.addEventListener('input', (ev) => { const t = ev.target; if (emptyNum(t) && t.dataset.cg == null) return; noteRatio(t); if (t.dataset.cg != null) { setChartGrid(readGrid(), false); return; } if (t.dataset.k && (t.type === 'number' || t.type === 'color' || t.type === 'range' || t.tagName === 'TEXTAREA')) setProp(t.dataset.k, readVal(t), false); });
  props.addEventListener('change', (ev) => {
    const t = ev.target;
    if (emptyNum(t) && t.dataset.cg == null) { renderProps(); return; } // 비워 둔 숫자 칸: 0 으로 쓰지 않고 원래 값으로
    propsEvt++;
    try { if (t.dataset.cg != null) setChartGrid(readGrid(), true); else if (t.dataset.k) setProp(t.dataset.k, readVal(t), true); }
    finally { propsEvt--; }
  });
  props.addEventListener('keydown', (ev) => { // 표 칸에서 Enter = 아래 칸, 마지막 줄이면 새 줄
    const t = ev.target; if (!t.dataset || t.dataset.cg == null || ev.key !== 'Enter' || ev.isComposing) return;
    ev.preventDefault(); const [r, c] = t.dataset.cg.split(',').map(Number); const nx = props.querySelector(`input[data-cg="${r + 1},${c}"]`);
    if (nx) nx.focus(); else { const g = readGrid(); g.push(Array(g[0].length).fill('')); setChartGrid(g, true); renderProps(); const i = props.querySelector(`input[data-cg="${r + 1},${c}"]`); if (i) i.focus(); }
  });
  props.addEventListener('mousedown', (ev) => { if (S.editing && !/^(INPUT|SELECT|TEXTAREA|OPTION)$/.test(ev.target.tagName) && ev.target.closest('button,.swatch,[data-act],[data-align]')) ev.preventDefault(); });
  props.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-k],[data-act],[data-align]'); if (!t) return;
    if (S.editing && (t.dataset.align || (t.dataset.act && t.dataset.act !== 'fsUp' && t.dataset.act !== 'fsDown'))) endEdit(); // 쓰던 글을 먼저 저장
    if (t.dataset.align) { alignSel(t.dataset.align); return; }
    if (t.dataset.act) { doAct(t.dataset.act); return; }
    if (t.dataset.toggle) { setProp(t.dataset.k, !t.classList.contains('active'), true); return; } // 단추가 보여 주는 상태의 반대로 (기본이 켜짐인 항목도 첫 클릭에 꺼짐)
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
      } else if (key === 'notes') { s.notes = v; if (doCommit) pushHistory(); markDirty(); return; }
      else { if (!s.bg) s.bg = {}; setPath(s, key, v); if (key === 'decor' && !v) delete s.decor; if (key === 'transition' && !v) delete s.transition; }
      if (doCommit) commit(); else markDirty();
      renderStage(); if (doCommit) renderProps(); return;
    }
    const els = selEls(); if (!els.length) return;
    if (S.editing) {
      if (k === 'style.fontSize' || k === 'style.color' || k === 'style.bold' || k === 'style.italic' || k === 'style.underline') {
        const a = document.activeElement, held = a && a.dataset && a.dataset.k === k && props.contains(a) && editRange && !editRange.collapsed && !selInEdit();
        if (held && !doCommit) return; // 속성 창 칸에 값을 넣는 중: 다 넣을 때까지 기다림
        if (ensureEditSel()) {
          if (k === 'style.fontSize') sizeSelection(0, v); else if (k === 'style.color') exec('foreColor', toHex(themeColor(v, theme()))); else exec(k.slice(6));
          markDirty(); return;
        }
      } else if (!k.startsWith('style.')) endEdit(); // 글꼴 꾸밈이 아닌 속성은 쓰던 글을 먼저 저장하고 적용
    }
    for (const e of els) {
      let val = v;
      if (k === 'opacity') val = clamp(v / 100, 0, 1);
      if (k === 'w' || k === 'h') val = Math.max(8, val);
      if (k === 'style.fontSize' && !(val > 0)) continue;
      if ((k === 'w' || k === 'h') && e.ratioLock && e.w && e.h) { const rt = ratioAt.get(e.id) || e.w / e.h; if (k === 'w') e.h = Math.max(8, Math.round(val / rt)); else e.w = Math.max(8, Math.round(val * rt)); }
      if (k.startsWith('colors.')) { const i = +k.slice(7); e.colors = (e.colors || []).slice(); while (e.colors.length <= i) e.colors.push(''); e.colors[i] = v; rerenderEl(e.id); continue; }
      if (k === 'start' || k === 'end') { val = parseClock(v); if (!val) { delete e[k]; rerenderEl(e.id); continue; } }
      if (k === 'style.bg' && v === '') { delete e.style.bg; } else if (k === 'link' && !v) { delete e.link; } else setPath(e, k, val);
      if (k.startsWith('style.') && (val === '' || val === false) && k !== 'style.align' && k !== 'style.valign') delete e.style[k.slice(6)];
      if (k === 'role') { /* 역할 변경시 크기/색 오버라이드 제거 */ delete e.style.fontSize; delete e.style.color; delete e.style.bold; delete e.style.font; }
      if (k === 'style.font' && doCommit) touchFont(val);
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
      case 'bgAll': { const bg = curSlide().bg ? clone(curSlide().bg) : null; for (const s of S.deck.slides) { if (bg) s.bg = clone(bg); else delete s.bg; } commit({ all: true }); renderStage(); toast(`슬라이드 ${S.deck.slides.length}장에 같은 배경을 적용했습니다`); break; }
      case 'colorsReset': for (const e of selEls()) delete e.colors; commit(); renderStage(); renderProps(); break;
      case 'dupSlide': duplicateSlide(); break;
      case 'delSlide': deleteSlide(); break;
      case 'moveUp': moveSlide(-1); break;
      case 'moveDown': moveSlide(1); break;
      case 'layout': showLayoutMenu(null, applyLayout); break;
      case 'dup': duplicateSelected(); break;
      case 'del': deleteSelected(); break;
      case 'bgRemove': if (e) showBgRemove(e); break;
      case 'replaceImage': if (e) { $('fileReplace').dataset.id = e.id; $('fileReplace').click(); } break;
      case 'fitRatio': if (e && e.src) imageSize(e.src).then(d => { e.h = Math.round(e.w * d.h / d.w); commit(); rerenderEl(e.id); renderOverlay(); renderProps(); }); break;
      case 'distH': distribute('h'); break;
      case 'distV': distribute('v'); break;
      case 'sameW': { const els = selEls(); for (const x of els) if (!x.locked) x.w = els[0].w; commit(); renderStage(); break; }
      case 'sameH': { const els = selEls(); for (const x of els) if (!x.locked) x.h = els[0].h; commit(); renderStage(); break; }
      case 'autofit': if (e) autofit(e); break;
      case 'gradToggle': if (e) { if (e.fill2) e.fill2 = ''; else { e.fill2 = '$accent2'; if (e.gAngle == null) e.gAngle = 135; } commit(); rerenderEl(e.id); renderProps(); } break;
      case 'gray': if (e) { e.fx = Object.assign({}, e.fx, { s: 0 }); commit(); rerenderEl(e.id); renderProps(); } break;
      case 'fxReset': if (e) { delete e.fx; commit(); rerenderEl(e.id); renderProps(); } break;
      case 'cropReset': if (e) { delete e.cropX; delete e.cropY; delete e.zoom; commit(); rerenderEl(e.id); renderProps(); } break;
      case 'rowAdd': case 'rowAddBefore': case 'rowDel': case 'colAdd': case 'colAddBefore': case 'colDel': case 'colsEven': case 'rowsEven': tableOp(a); break;
      case 'mathDialog': if (e) openMathDialog(e); break;
      case 'playHere': if (e) playEmbedHere(e.id); break;
      case 'pickVideo': if (e) { S.sel = [e.id]; $('fileVideo').click(); } break;
      case 'pickPpt': if (e) { S.sel = [e.id]; showPptVideos(); } break;
      case 'cgRow': { const g = readGrid(); g.push(Array(g[0].length).fill('')); setChartGrid(g, true); renderProps(); break; }
      case 'cgCol': { const g = readGrid(); g.forEach((r, i) => r.push(i === 0 ? '계열 ' + r.length : '')); setChartGrid(g, true); renderProps(); break; }
      case 'cgRowDel': { const g = readGrid(); if (g.length > 2) g.pop(); setChartGrid(g, true); renderProps(); break; }
      case 'cgColDel': { const g = readGrid(); if (g[0].length > 2) g.forEach(r => r.pop()); setChartGrid(g, true); renderProps(); break; }
      case 'openEmbed': if (e) { const q = parseEmbed(e.url); window.open(q.kind === 'youtube' ? `https://www.youtube.com/watch?v=${q.id}` : q.kind === 'video' ? API.resolveSrc(e.url) : e.url, '_blank', 'noopener'); } break;
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
    const list = onPick ? LAYOUTS : LAYOUTS.filter(l => l.id === 'blank').concat(LAYOUTS.filter(l => l.id !== 'blank')); // 새로 넣을 때는 '빈 슬라이드'를 맨 앞에
    for (const L of list) {
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
    // 단추 아래에 자리가 없으면(화면 맨 아래 단추) 위로 펼침 — 화면 밖으로 나가 안 보이던 문제
    const h = m.offsetHeight; let top = a.bottom + 6;
    if (top + h > innerHeight - 8) top = a.top - 6 - h;
    if (top < 8) top = Math.max(8, Math.min(a.bottom + 6, innerHeight - h - 8));
    m.style.left = Math.max(8, Math.min(a.left, innerWidth - m.offsetWidth - 8)) + 'px'; m.style.top = top + 'px';
  }
  function btnMenu(btn, items) {
    if (openMenu && openMenu._btn === btn) { closeMenus(); return; } // 같은 단추를 다시 누르면 닫힘
    const r = btn.getBoundingClientRect(); showMenu(r.left, r.bottom + 6, items);
    if (openMenu) openMenu._btn = btn;
  }
  document.addEventListener('pointerdown', (ev) => { if (openMenu && !openMenu.contains(ev.target) && ev.target.closest('.btn') !== openMenu._btn) closeMenus(); });

  /* ---------- 툴바 이벤트 ---------- */
  $('btnAddSlide').onclick = (ev) => { ev.stopPropagation(); showLayoutMenu(); };
  $('btnAddSlide2').onclick = (ev) => { ev.stopPropagation(); closeMenus(); addSlide('blank'); toast('빈 슬라이드를 넣었습니다 · 다른 모양은 옆의 ▾'); }; // 누르면 바로 빈 슬라이드
  $('btnAddSlide3').onclick = (ev) => { ev.stopPropagation(); showLayoutMenu($('btnAddSlide3')); };
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
  $('fileVideo').onchange = async (ev) => { const f = ev.target.files[0]; ev.target.value = ''; if (f) await insertVideoFile(f); };
  $('filePpt').onchange = async (ev) => { const f = ev.target.files[0]; ev.target.value = ''; if (f) await openPpt(f); };
  $('fileReplace').onchange = async (ev) => { const f = ev.target.files[0]; if (f) await replaceImage(ev.target.dataset.id, f); ev.target.value = ''; };
  $('fileBg').onchange = async (ev) => {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try { const prep = await prepareImage(f); const src = await API.stage(prep.blob, prep.name); const s = curSlide(); s.bg = Object.assign({}, s.bg || {}, { image: src, fit: 'cover' }); delete s.bg.gradient; commit(); renderStage(); renderProps(); }
    catch (e) { alert('배경 이미지 실패: ' + e.message); }
  };
  async function showAssetLibrary() {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    const frame = (sub, body) => `<div class="modal" style="min-width:min(560px,94vw)"><h3>이미지 라이브러리 <span class="muted" style="font-weight:400;font-size:13px">assets/ 폴더${sub}</span></h3>
      <div class="asset-grid">${body}</div>
      <div class="actions"><button class="btn" data-close>닫기</button></div></div>`;
    bg.innerHTML = frame('', '<div class="muted">불러오는 중…</div>');
    bg.onclick = async (ev) => {
      if (ev.target.dataset.close != null || ev.target === bg) { bg.remove(); return; }
      const a = ev.target.closest('.a'); if (!a) return; bg.remove();
      try {
        const d = await imageSize(a.dataset.src); const r = Math.min(1, 1200 / d.w, 760 / d.h);
        addElement(imageEl(Math.round((SLIDE_W - d.w * r) / 2), Math.round((SLIDE_H - d.h * r) / 2), Math.round(d.w * r), Math.round(d.h * r), a.dataset.src));
      } catch (e) { toast('이미지를 열 수 없습니다: ' + a.dataset.src, 3000); }
    };
    document.body.appendChild(bg);
    try {
      const list = (await API.assets()).filter(a => /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(a.name)); // 동영상 파일은 빼고
      bg.innerHTML = frame(` · ${list.length}개`, list.map(a => `<div class="a" data-src="${esc(a.src)}" style="background-image:url('${esc(a.src)}')" title="${esc(a.name)}"><span>${esc(a.name)}</span></div>`).join('') || '<div class="muted">아직 업로드된 이미지가 없습니다.</div>');
    } catch (e) { bg.innerHTML = frame('', `<div class="muted">목록을 불러오지 못했습니다: ${esc(e.message)}</div>`); }
  }
  document.querySelectorAll('#alignGroup .btn').forEach(b => b.onclick = () => alignSel(b.dataset.align));
  $('btnDup').onclick = duplicateSelected; $('btnDel').onclick = deleteSelected;
  $('btnUndo').onclick = undo; $('btnRedo').onclick = redo;
  $('btnSave').onclick = save;
  $('deckTitle').onchange = (ev) => { S.deck.title = ev.target.value.trim() || S.deck.title; ev.target.value = S.deck.title; document.title = S.deck.title + ' · 편집'; commit({ all: true }); };
  const themeSel = $('theme'); THEMES.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; themeSel.appendChild(o); });
  themeSel.onchange = () => { setProp('deck.theme', themeSel.value, true); themeSel.blur(); };
  $('zoom').onchange = (ev) => { S.zoomMode = ev.target.value; layoutStage(); ev.target.blur(); };
  $('btnPresent').onclick = () => present(false);
  $('btnPreview').onclick = () => { if (S.editing) endEdit(); draftPut(); window.open(`present.html?deck=${encodeURIComponent(S.name)}&draft=1&start=${S.cur}`, '_blank'); };
  $('btnExport').onclick = (ev) => {
    ev.stopPropagation();
    btnMenu(ev.currentTarget, [
      { label: 'JSON 파일 다운로드', fn: () => download(S.name + '.json', JSON.stringify(S.deck, null, 1), 'application/json') },
      { label: '단독 HTML (어디서나 발표)', fn: exportHtml },
      { label: 'PowerPoint 파일 (.pptx)', fn: exportPptx },
      { label: 'PDF / 인쇄용 보기', fn: () => openAfterSave(`present.html?deck=${encodeURIComponent(S.name)}&print=1`) },
    ]);
  };
  function download(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  /* 필요할 때만 불러오는 프로그램 파일 (PPT 내보내기) */
  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[data-lazy="${src}"]`)) { res(); return; }
      const sc = document.createElement('script'); sc.src = src; sc.dataset.lazy = src;
      sc.onload = () => res(); sc.onerror = () => { sc.remove(); rej(new Error('프로그램 파일을 불러오지 못했습니다 (' + src + ') — 인터넷 연결을 확인해 주세요')); };
      document.head.appendChild(sc);
    });
  }
  /* PowerPoint(.pptx) 로 내보내기 — 글·도형·표·그림은 PowerPoint 에서 고칠 수 있는 개체로 (app/pptx.js) */
  let pptBusy = false;
  async function exportPptx() {
    if (pptBusy) { toast('PPT 파일을 만드는 중입니다…'); return; }
    if (S.editing) endEdit();
    const vids = new Map();
    for (const sl of S.deck.slides) for (const e of sl.elements || []) { if (e.type !== 'embed' || e.hide) continue; const q = parseEmbed(e.url); if (q.kind === 'video' && /\.(mp4|m4v|mov)(?:[?#]|$)/i.test(q.src)) vids.set(q.src, 1); }
    let withVideos = false;
    if (vids.size) {
      await loadAssetSizes(); const u = deckUsage(), mb = u.video / 1048576;
      withVideos = confirm(`이 교안에는 동영상 파일이 ${vids.size}개 있습니다${u.video ? ` (약 ${fmtSize(u.video)})` : ''}.\n\n[확인] 동영상을 PPT 파일 안에 넣습니다${mb > 50 ? ' — 파일이 그만큼 커지고, 받는 데 시간이 걸립니다' : ''}\n[취소] 동영상은 넣지 않고 표지 그림만 넣습니다`);
    }
    pptBusy = true; toast('PPT 파일을 만드는 중…', 600000);
    try {
      await loadScript('app/hwp/zip.js'); await loadScript('app/pptx.js');
      const site = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? new URL('present.html?deck=' + encodeURIComponent(S.name), location.href).href : '';
      const r = await PPTX.build(S.deck, { videos: withVideos, siteUrl: site, progress: (m) => toast('PPT 파일을 만드는 중 — ' + m, 600000) });
      const a = document.createElement('a'); a.href = URL.createObjectURL(r.blob); a.download = S.name + '.pptx'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      toast(`PPT 파일을 내려받았습니다 (${fmtSize(r.blob.size)})` + (r.warn.length ? ' — ' + r.warn.join(' · ') : ''), r.warn.length ? 9000 : 3500);
    } catch (e) { toast('PPT 파일을 만들지 못했습니다'); alert('PPT 파일을 만들지 못했습니다: ' + (e && e.message || e)); }
    finally { pptBusy = false; }
  }
  async function exportHtml() {
    if (S.editing) endEdit();
    toast('HTML 만드는 중…', 5000);
    const deck = clone(S.deck);
    let lost = 0, vids = 0, vlocal = 0;
    const toData = async (src) => { if (!src || src.startsWith('data:')) return src; try { const b = await (await fetch(API.resolveSrc(src))).blob(); return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); } catch (e) { lost++; return src; } };
    for (const s of deck.slides) { if (s.bg && s.bg.image) s.bg.image = await toData(s.bg.image); for (const e of s.elements) {
        if (e.type === 'image' && e.src) e.src = await toData(e.src);
        else if (e.type === 'embed' && parseEmbed(e.url).kind === 'video' && !/^(https?:|data:)/i.test(e.url)) { // 동영상 파일은 HTML 에 담지 않고 사이트 주소로 연결
          const old = e.url; vids++; if (BIGV.parse(old)) { /* 조각으로 올린 큰 영상: 어디서 열어도 저장소에서 받아 재생 */ } else if (/^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) { e.url = new URL(old, location.href).href; } else vlocal++;
          if (e.poster && e.posterOf === old) { e.poster = await toData(e.poster); e.posterOf = e.url; }
        }
      } }
    let slideCss, uiCss, commonJs, presentJs;
    try { [slideCss, uiCss, commonJs, presentJs] = await Promise.all(['app/slide.css', 'app/ui.css', 'app/common.js', 'app/present.js'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' (' + r.status + ')'); return r.text(); }))); }
    catch (err) { alert('HTML 파일을 만들지 못했습니다: 프로그램 파일을 읽을 수 없습니다 (' + err.message + ')\n서버(또는 사이트)로 연 화면에서 다시 해 주세요.'); return; }
    const json = JSON.stringify(deck).replace(/<\/script/gi, '<\\/script');
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(deck.title)}</title><style>${slideCss}\n${uiCss}</style></head><body class="present"><script>window.EMBEDDED_DECK=${json};<\/script><script>${commonJs}<\/script><script>${presentJs}<\/script></body></html>`;
    download(S.name + '.html', html, 'text/html');
    const vnote = vlocal ? ` · 동영상 파일 ${vlocal}개는 담기지 않습니다 (HTML 파일 옆에 assets 폴더를 함께 두어야 재생)` : vids ? ` · 동영상 파일 ${vids}개는 인터넷이 있어야 재생됩니다` : '';
    toast((lost ? `HTML 파일을 내려받았습니다 — 이미지 ${lost}개는 넣지 못했습니다 (그 그림은 인터넷이 있어야 보입니다)` : 'HTML 파일을 내려받았습니다') + vnote, lost || vnote ? 6000 : 2600);
  }

  /* ---------- 드래그 앤 드롭 / 붙여넣기 ---------- */
  /* 받는 것: 그림·영상·PPT 파일 / PPT 심벌 창의 심벌 / 다른 프로그램에서 끌어온 글자·그림 주소.
     아무 자료도 넘겨주지 않는 프로그램(PowerPoint 의 도형 등)에서 끌어오면 방법을 알려 줌 */
  const dropKind = (dt) => { const t = Array.from(dt.types || []); return pptDrag ? 'sym' : t.includes('Files') ? 'files' : innerDrag ? '' : (t.includes('text/plain') || t.includes('text/html') || t.includes('text/uri-list')) ? 'data' : !t.length ? 'none' : ''; };
  main.addEventListener('dragover', (ev) => { if (dropKind(ev.dataTransfer)) { ev.preventDefault(); if (pptDrag) ev.dataTransfer.dropEffect = 'copy'; main.classList.add('dragover'); } });
  main.addEventListener('dragleave', (ev) => { if (!main.contains(ev.relatedTarget)) main.classList.remove('dragover'); });
  main.addEventListener('drop', async (ev) => {
    main.classList.remove('dragover'); const kind = dropKind(ev.dataTransfer); if (!kind) return; ev.preventDefault();
    const r = overlay.getBoundingClientRect(); const at = { x: (ev.clientX - r.left) / S.k, y: (ev.clientY - r.top) / S.k };
    if (kind === 'sym') { const it = pptDrag; pptDrag = null; if (await placePptSym(it, at)) toast('심벌을 넣었습니다 · 되돌리기 Ctrl+Z'); return; }
    if (kind !== 'files' || !ev.dataTransfer.files.length) {
      const html = ev.dataTransfer.getData('text/html') || '', text = (ev.dataTransfer.getData('text/plain') || '').trim();
      const m = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i.exec(html), url = m ? m[1].replace(/&amp;/g, '&') : /^(https?:\/\/\S+\.(png|jpe?g|gif|svg|webp)(\?\S*)?|data:image\/\S+)$/i.test(text) ? text : '';
      if (url && /^(data:image\/|https?:)/i.test(url)) { // 웹 페이지 등에서 끌어온 그림
        try { const b = await (await fetch(url)).blob(); if (/^image\//.test(b.type)) { await insertImageFile(new File([b], 'drop-' + Date.now() + '.' + ((b.type.split('/')[1] || 'png').replace('svg+xml', 'svg').replace('jpeg', 'jpg')), { type: b.type }), at); return; } } catch (e) { }
        if (m) { toast('그 그림은 가져올 수 없는 곳에 있습니다 — 그림을 복사(Ctrl+C)해서 붙여넣어(Ctrl+V) 주세요', 6000); return; }
      }
      if (!text || /^file:/i.test(text)) { toast(DROP_HELP, 9000); return; }
      if (putEmbed(text)) return;
      const g = graphemes(text).length, big = g <= 3 && !/\n/.test(text), w = big ? 220 : clamp(g * 44, 320, 1120), h = big ? 220 : 160;
      addElement(textEl('text', Math.round(clamp(at.x - w / 2, 0, SLIDE_W - w)), Math.round(clamp(at.y - h / 2, 0, SLIDE_H - h)), w, h, esc(text).replace(/\r?\n/g, '<br>'), { style: big ? { fontSize: 150, align: 'center', valign: 'middle', lineHeight: 1 } : { align: 'center', valign: 'middle' } }));
      return;
    }
    const ph = document.elementFromPoint(ev.clientX, ev.clientY); const slot = ph && ph.closest ? ph.closest('.el-image.img-empty') : null;
    const files = Array.from(ev.dataTransfer.files);
    const ppt = files.find(isPptFile); if (ppt) { await openPpt(ppt); return; }              // PPT 파일 → 그 안의 동영상 고르기
    const box = ph && ph.closest ? ph.closest('.mode-edit .el[data-id]') : null;              // 상자 위에 놓으면 그 상자에
    let n = 0; for (const f of files) {
      const p = { x: at.x + n * 40, y: at.y + n * 40, into: n === 0 && slot ? slot.dataset.id : null };
      if (isVideoFile(f)) { if (n === 0 && box && !slot) { const be = elById(box.dataset.id); if (be && ['embed', 'image', 'shape'].includes(be.type)) p.into = be.id; } await insertVideoFile(f, p); }
      else await insertImageFile(f, p);
      n++;
    }
  });
  document.addEventListener('paste', async (ev) => {
    if (symPaste && symPaste(ev)) return;                          // 내 심벌 창이 열려 있으면 내 심벌에
    const text = ev.clipboardData.getData('text/plain') || '', clipHtml = ev.clipboardData.getData('text/html') || '';
    const items = Array.from(ev.clipboardData.items || []);
    const editingTable = S.editing && elById(S.editing) && elById(S.editing).type === 'table';
    const tableLike = /\t/.test(text) && text.trim().split(/\r?\n/).length > 1;
    const img = items.find(i => i.type.startsWith('image/'));
    const files = Array.from(ev.clipboardData.files || []);        // 탐색기에서 복사한 파일
    const vfile = files.find(isVideoFile), pfile = files.find(isPptFile);
    if ((vfile || pfile) && !text.trim() && !isTypingField()) { ev.preventDefault(); if (vfile) await insertVideoFile(vfile); else await openPpt(pfile); return; }
    // 글과 그림이 함께 든 복사본(엑셀 칸·워드 글)은 글을 붙임. 단 PowerPoint 의 도형(글자가 든 심벌)은 그림으로
    const picFirst = !!img && (!text.trim() || ((!clipHtml || /Microsoft PowerPoint/i.test(clipHtml)) && !isTyping() && !text.startsWith(CLIP_TAG)));
    if (picFirst && !editingTable) {
      ev.preventDefault(); const f = img.getAsFile();
      if (S.ppt && f) { // PowerPoint 에서 복사한 영상은 표지 그림만 넘어옴 → 열어 둔 PPT 에서 같은 표지의 영상을 찾아 넣음
        const hits = await matchPptVideo(f);
        if (hits.length === 1 || (hits.length > 1 && hits[1].d - hits[0].d > 3)) { if (await takePptVideo(hits[0].v)) { toast('PowerPoint 에서 복사한 영상을 넣었습니다 · ▶ 를 누르면 바로 재생 · 되돌리기 Ctrl+Z', 3500); return; } }
        else if (hits.length > 1) { showPptVideos(hits.map(h => h.v), '붙여넣은 그림과 표지가 비슷한 영상이 여러 개입니다. 넣을 영상을 고르세요.'); return; }
      }
      await insertImageFile(new File([f], 'clipboard-' + Date.now() + '.' + (f.type.split('/')[1] || 'png'), { type: f.type }));
      if (S.ppt && S.ppt.stale) toast('열어 둔 PPT 파일이 바뀌어 영상을 찾지 못했습니다 — [더보기 → PPT 에서 영상 가져오기] 로 다시 열어 주세요', 6000);
      return;
    }
    if (S.editing) { // 서식 없는 텍스트로 붙여넣기
      ev.preventDefault(); if (text.startsWith(CLIP_TAG)) return;
      exec('insertHTML', esc(text).replace(/\r?\n/g, '<br>')); return;
    }
    if (isTyping()) return;
    ev.preventDefault();
    if (text.startsWith(CLIP_TAG)) { try { pasteData(JSON.parse(text.slice(CLIP_TAG.length))); } catch (e) { toast('붙여넣기 실패'); } return; }
    if (tableLike) { addTableFromText(text); return; }           // 엑셀·한글 표 → 표
    if (putEmbed(text)) return;                                   // 유튜브 주소·퍼가기 코드 → 잡은 상자에 영상
    if (text.trim()) { addElement(textEl('text', 400, 400, 1120, 200, esc(text).replace(/\r?\n/g, '<br>'))); return; }
    if (S.clip) pasteData(S.clip);
  });

  /* ---------- 키보드 (PowerPoint 와 같은 배치) ---------- */
  function isTyping() { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable); }
  function isTypingField() { const a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); } // 속성 칸·대화상자에 글을 쓰는 중
  function present(fromStart) { openAfterSave(`present.html?deck=${encodeURIComponent(S.name)}&start=${fromStart ? 0 : S.cur}`); }
  /* 발표·인쇄 창: 저장(GitHub 은 몇 초)이 끝난 뒤에 window.open 을 부르면 팝업 차단에 걸릴 수 있어,
     클릭 직후에 빈 창을 먼저 열고 저장이 끝나면 주소를 넣음. 저장이 안 됐으면 이 기기의 임시본으로 보여 줌 */
  async function openAfterSave(url) {
    const w = window.open('', '_blank');
    try { await save(); } catch (e) { }
    if (S.dirty) { draftPut(); url += '&draft=1'; }
    if (w && !w.closed) w.location.href = url; else window.open(url, '_blank');
  }
  /* 글자 크기 단계 조절: 편집 중이면 그 상자, 아니면 선택한 텍스트 상자 전부 */
  function fontSizeStep(delta) {
    if (S.editing && sizeSelection(delta)) return; // 글을 쓰는 중에 끌어서 고른 글자가 있으면 그 글자만
    const els = (S.editing ? [elById(S.editing)] : selEls()).filter(e => e && TEXTY.includes(e.type)); if (!els.length) return;
    for (const e of els) {
      e.style = e.style || {}; const cur = resolveTextStyle(e, theme()).fontSize; e.style.fontSize = clamp(Math.round(cur + delta), 8, 400);
      const node = nodeOf(e.id);
      // 글 안에 따로 크기를 준 부분도 같은 만큼 (차이가 유지되게)
      if (S.editing) { if (node) node.querySelectorAll('[style*="font-size"]').forEach(x => { const c = parseFloat(x.style.fontSize); if (c) x.style.fontSize = fitFs(c + delta) + 'px'; }); }
      else { const before = e.type === 'table' ? JSON.stringify(e.rows) : e.html; bumpInline(e, v => v + delta); if ((e.type === 'table' ? JSON.stringify(e.rows) : e.html) !== before) { rerenderEl(e.id); continue; } }
      if (e.type === 'chart') rerenderEl(e.id); else applyElementTextStyle(e, node, theme());
    }
    if (S.editing) { markDirty(); syncSizeBox(); positionTextToolbar(); } else { commit(); renderOverlay(); }
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
  /* 서식 복사·붙여넣기: 종류별로 꾸밈 속성 전부 (같은 종류끼리는 그대로, 다른 종류끼리는 글자 서식과 공통 속성만) */
  const STYLE_KEYS = {
    text: ['role', 'opacity'], shape: ['fill', 'fill2', 'fill2Op', 'gAngle', 'stroke', 'strokeWidth', 'dash', 'radius', 'shadow', 'opacity', 'flip', 'flipV'],
    image: ['radius', 'shadow', 'border', 'borderColor', 'fit', 'mask', 'fx', 'flip', 'flipV', 'opacity'], table: ['header', 'band', 'firstCol', 'lines', 'headFill', 'headColor', 'lineColor', 'radius', 'opacity'],
    chart: ['values', 'legend', 'grid', 'axis', 'colors', 'unit', 'opacity'], embed: ['radius', 'shadow', 'opacity'], math: ['opacity'],
  };
  const COMMON_KEYS = ['radius', 'shadow', 'opacity'];
  function copyStyle() {
    const e = S.editing ? elById(S.editing) : selEls()[0]; if (!e) return;
    styleClip = { type: e.type, style: clone(e.style || {}), props: {} };
    for (const k of STYLE_KEYS[e.type] || []) if (e[k] !== undefined) styleClip.props[k] = clone(e[k]);
    toast('서식 복사');
  }
  function pasteStyle() {
    if (!styleClip) { toast('먼저 Ctrl+Shift+C 로 서식을 복사하세요'); return; }
    const els = selEls(); if (!els.length) return;
    for (const e of els) {
      const same = e.type === styleClip.type;
      const keys = same ? (STYLE_KEYS[e.type] || []) : COMMON_KEYS.filter(k => (STYLE_KEYS[e.type] || []).includes(k) && styleClip.props[k] !== undefined);
      for (const k of keys) { if (styleClip.props[k] === undefined) delete e[k]; else e[k] = clone(styleClip.props[k]); }
      if (same || (TEXTY.includes(e.type) && TEXTY.includes(styleClip.type))) e.style = clone(styleClip.style);
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

  /* 한글 조합 중에 누른 Ctrl 단축키(저장·찾기·인쇄 등): 브라우저 기본 동작(페이지 저장·인쇄 창)은 막고, 조합이 끝난 뒤 실행 */
  let imeKey = null;
  document.addEventListener('compositionend', () => { const p = imeKey; imeKey = null; if (p && Date.now() - p.t < 1500) setTimeout(() => onKey(p.ev), 0); }, true);
  document.addEventListener('keydown', onKey);
  function onKey(ev) {
    if (ev.isComposing || ev.keyCode === 229) {
      if (ev.code === 'Tab' && S.editing && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { // 한글을 조합하던 중의 Tab: 글자를 확정한 뒤 실행 (표의 다음 칸 · 목록 들여쓰기)
        ev.preventDefault();
        const p = imeKey = { t: Date.now(), ev: { key: 'Tab', code: 'Tab', keyCode: 9, isComposing: false, ctrlKey: false, metaKey: false, shiftKey: ev.shiftKey, altKey: false, target: ev.target, preventDefault() { } } };
        setTimeout(() => { if (imeKey === p) { imeKey = null; onKey(p.ev); } }, 150); // 조합이 끝났다는 신호가 오지 않아도 실행
        return;
      }
      if ((ev.ctrlKey || ev.metaKey) && /^(KeyS|KeyF|KeyH|KeyP|KeyM|Enter)$/.test(ev.code)) {
        ev.preventDefault();
        imeKey = { t: Date.now(), ev: { key: ev.code === 'Enter' ? 'Enter' : ev.code.slice(3).toLowerCase(), code: ev.code, keyCode: 0, isComposing: false, ctrlKey: ev.ctrlKey, metaKey: ev.metaKey, shiftKey: ev.shiftKey, altKey: ev.altKey, target: ev.target, preventDefault() { } } };
        return;
      }
    }
    const ctrl = ev.ctrlKey || ev.metaKey, shift = ev.shiftKey, alt = ev.altKey;
    const key = ev.key, low = key.length === 1 ? key.toLowerCase() : key;
    const stop = () => ev.preventDefault();

    /* 창(디자인·아이콘·수식·연결…)이 떠 있는 동안: 단축키가 뒤의 슬라이드를 건드리지 않게. Esc 는 그 창을 닫음 */
    const modal = document.querySelector('.modal-bg');
    if (modal) {
      if (key === 'Escape') { const b = modal.querySelector('[data-close], #kbClose, #ghCancel'); if (b) b.click(); else modal.remove(); }
      return;
    }

    /* --- 어디서나 --- */
    if (ctrl && low === 's') { stop(); save(); return; }
    if (ctrl && !shift && low === 'f') { stop(); showFind(false); return; }
    if (ctrl && !shift && low === 'h') { stop(); showFind(true); return; }            // Ctrl+H 바꾸기 (PPT)
    if (alt && key === 'F10') { stop(); toggleLayers(); return; }                      // Alt+F10 선택 창 (PPT)
    if (key === 'F5') { stop(); present(!shift); return; }            // F5 처음부터 · Shift+F5 현재 슬라이드부터
    if (key === 'F1' || (ctrl && key === '/')) { stop(); showShortcutHelp(); return; }
    if (ctrl && low === 'p') { stop(); openAfterSave(`present.html?deck=${encodeURIComponent(S.name)}&print=1`); return; }
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
    if (ctrl && low === 'b') { stop(); const tx = selEls().filter(x => TEXTY.includes(x.type)); if (!tx.length) return; for (const e of tx) { e.style = e.style || {}; e.style.bold = !resolveTextStyle(e, theme()).bold; } commit(); renderStage(); renderProps(); return; }
    if (ctrl && low === 'i') { stop(); const tx = selEls().filter(x => TEXTY.includes(x.type)); if (!tx.length) return; for (const e of tx) { e.style = e.style || {}; e.style.italic = !resolveTextStyle(e, theme()).italic; } commit(); renderStage(); renderProps(); return; }
    if (ctrl && shift && (key === 'PageUp' || key === 'ArrowUp')) { stop(); moveSlide(-1); return; }
    if (ctrl && shift && (key === 'PageDown' || key === 'ArrowDown')) { stop(); moveSlide(1); return; }
    if (ctrl && key === 'Home') { stop(); gotoSlide(0); return; }
    if (ctrl && key === 'End') { stop(); gotoSlide(S.deck.slides.length - 1); return; }
    if (ctrl && key === 'Delete') { stop(); deleteSlide(); return; }
    if (key === 'Delete' || key === 'Backspace') {
      if (S.sel.length) { stop(); deleteSelected(); return; }
      if (S.focus === 'thumbs' || S.ssel.length > 1) { stop(); deleteSlide(); } // 슬라이드 목록에서 잡은 슬라이드 삭제
      return;
    }
    if (ctrl && low === 'a' && S.focus === 'thumbs') { stop(); S.ssel = S.deck.slides.map(s => s.id); markSlideSel(); toast(`슬라이드 ${S.ssel.length}장 모두 선택`); return; }
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
  }

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
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey, true); }; // 닫기 단추·바깥 클릭으로 닫아도 키 가로채기를 거둠
    bg.onclick = (ev) => { if (ev.target === bg) close(); };
    bg.querySelector('#kbClose').onclick = close;
    const onKey = (ev) => { if (ev.key === 'Escape' || ev.key === 'F1') { ev.preventDefault(); ev.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
  }
  $('btnHelp').onclick = showShortcutHelp;
  window.addEventListener('resize', layoutStage);
  // 휴대폰: 속성 창은 아래에서 올라오는 판으로 (⚙ 속성 단추로 열고 닫음)
  const toggleProps = (on) => { const ed = document.querySelector('.ed'); ed.classList.toggle('props-open', on); $('btnProps').classList.toggle('active', ed.classList.contains('props-open')); };
  if ($('btnProps')) { $('btnProps').onclick = () => toggleProps(); $('propsClose').onclick = () => toggleProps(false); }
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
    const orig = els.map(e => ({ e, x: e.x, y: e.y, w: e.w, h: e.h, fs: TEXTY.includes(e.type) ? resolveTextStyle(e, theme()).fontSize : 0, html: e.html, rows: e.rows }));
    const ax = corner.includes('w') ? b.x + b.w : b.x, ay = corner.includes('n') ? b.y + b.h : b.y;
    const sx = ev.clientX, sy = ev.clientY; let moved = false;
    track((m) => {
      const dx = (m.clientX - sx) / S.k, dy = (m.clientY - sy) / S.k;
      const nw = b.w + (corner.includes('w') ? -dx : dx), nh = b.h + (corner.includes('n') ? -dy : dy);
      const k = Math.max(0.05, Math.max(nw / b.w, nh / b.h)); moved = true;
      for (const o of orig) {
        o.e.x = Math.round(ax + (o.x - ax) * k); o.e.y = Math.round(ay + (o.y - ay) * k);
        o.e.w = Math.max(8, Math.round(o.w * k)); o.e.h = Math.max(8, Math.round(o.h * k));
        if (o.fs) { o.e.style = o.e.style || {}; o.e.style.fontSize = Math.max(6, Math.round(o.fs * k)); if (o.html != null) o.e.html = o.html; if (o.rows) o.e.rows = o.rows; bumpInline(o.e, v => v * k); }
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
  function clipData(kind) { return kind === 'els' ? { kind, items: clone(selEls()) } : { kind: 'slides', items: selSlides().map(clone) }; }
  function pasteData(data) {
    if (!data || !data.items || !data.items.length) return;
    if (S.editing) endEdit();
    if (data.kind === 'slides') {
      const ss = data.items.map(s => { const c = clone(s); c.id = uid(); c.elements.forEach(e => { e.mk = e.mk || e.id; e.id = uid(); }); return c; });
      const at = Math.max(...selSlides().map(s => S.deck.slides.indexOf(s))) + 1;
      S.deck.slides.splice(at, 0, ...ss); S.cur = at; S.sel = []; S.ssel = ss.map(s => s.id);
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
    toast(data.kind === 'els' ? `${data.items.length}개 복사 · 다른 슬라이드·교안에도 붙여넣을 수 있습니다` : `슬라이드 ${data.items.length}장 복사 · 다른 교안에도 붙여넣을 수 있습니다`);
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
  /* 행·열 추가/삭제. at = { r, c } 로 자리를 정함 (없으면 누른 칸·편집하던 칸, 그것도 없으면 마지막 줄)
     rowAdd·colAdd 는 그 줄 다음에, rowAddBefore·colAddBefore 는 그 줄 앞에 넣음 */
  function tableOp(op, at) {
    const e = elById(S.sel[0]); if (!e || e.type !== 'table') return;
    const mine = S.cell && (S.cell.id == null || S.cell.id === e.id) ? S.cell : null, cell = at || mine; if (S.editing) endEdit();
    const rows = e.rows; const nc = rows[0] ? rows[0].length : 1;
    const ci = cell && cell.c != null ? clamp(cell.c, 0, nc - 1) : nc - 1, ri = cell && cell.r != null ? clamp(cell.r, 0, rows.length - 1) : rows.length - 1;
    const before = /Before$/.test(op); if (before) op = op.replace('Before', '');
    const ra = before ? ri - 1 : ri, ca = before ? ci - 1 : ci; // 이 줄 다음 자리에 넣음 (-1 이면 맨 앞)
    let nr2 = mine && mine.r != null ? mine.r : 0, nc2 = mine && mine.c != null ? mine.c : 0, msg = ''; // 끝난 뒤 기준 칸
    const keepMerged = (axis, idx) => { // 합친 칸의 글은 첫 칸에만 들어 있으므로, 그 줄을 지우기 전에 다음 줄로 옮김
      const cells = e.cells || {};
      for (const k in cells) {
        const [r, c] = k.split(',').map(Number), m = cells[k];
        if (axis === 'r' && r === idx && (m.rs || 1) > 1 && rows[r + 1] && !stripHtml(rows[r + 1][c] || '')) rows[r + 1][c] = rows[r][c];
        if (axis === 'c' && c === idx && (m.cs || 1) > 1 && rows[r] && c + 1 < rows[r].length && !stripHtml(rows[r][c + 1] || '')) rows[r][c + 1] = rows[r][c];
      }
    };
    const wOp = (key, n, idx, ins) => { if (!e[key]) return; const w = tableWeights(e[key], n); if (ins) w.splice(idx + 1, 0, 1 / n); else w.splice(idx, 1); e[key] = w; };
    if (op === 'rowAdd') { rows.splice(ra + 1, 0, Array(nc).fill('')); e.h += Math.round(e.h / (rows.length - 1)); wOp('rh', rows.length - 1, ra, true); tableRemap(e, 'r', ra, true); nr2 = ra + 1; if (cell && cell.c != null) nc2 = ci; }
    if (op === 'rowDel') {
      if (rows.length <= 1) { toast('행이 하나뿐이라 지울 수 없습니다 · 표를 통째로 지우려면 Del'); return; }
      keepMerged('r', ri); rows.splice(ri, 1); e.h = Math.max(40, e.h - Math.round(e.h / (rows.length + 1))); wOp('rh', rows.length + 1, ri, false); tableRemap(e, 'r', ri, false);
      nr2 = ri; if (cell && cell.c != null) nc2 = ci; msg = `${ri + 1}행을 지웠습니다 · 되돌리기 Ctrl+Z`;
    }
    if (op === 'colAdd') { rows.forEach(r => r.splice(ca + 1, 0, '')); wOp('cols', nc, ca, true); tableRemap(e, 'c', ca, true); nc2 = ca + 1; if (cell && cell.r != null) nr2 = ri; }
    if (op === 'colDel') {
      if (nc <= 1) { toast('열이 하나뿐이라 지울 수 없습니다 · 표를 통째로 지우려면 Del'); return; }
      keepMerged('c', ci); rows.forEach(r => r.splice(ci, 1)); wOp('cols', nc, ci, false); tableRemap(e, 'c', ci, false);
      nc2 = ci; if (cell && cell.r != null) nr2 = ri; msg = `${ci + 1}열을 지웠습니다 · 되돌리기 Ctrl+Z`;
    }
    if (op === 'colsEven') delete e.cols;
    if (op === 'rowsEven') delete e.rh;
    // 기준 칸을 남겨 둠: 같은 단추를 거듭 누르면 이어서 지우거나 넣을 수 있게
    S.cell = (cell || /^(row|col)/.test(op) && /(Add|Del)$/.test(op)) ? { id: e.id, r: clamp(nr2, 0, rows.length - 1), c: clamp(nc2, 0, (rows[0] ? rows[0].length : 1) - 1) } : null;
    commit(); rerenderEl(e.id); renderOverlay(); renderProps(); if (msg) toast(msg, 2600);
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
      const e = elById(S.editing); const nc = e.rows[0] ? e.rows[0].length : last.children.length;
      for (let ci = 0; ci < nc; ci++) { const td = document.createElement('td'); td.dataset.r = r; td.dataset.c = ci; td.contentEditable = 'true'; td.addEventListener('blur', onEditBlur); td.addEventListener('focus', onCellFocus); tr.appendChild(td); }
      last.parentNode.appendChild(tr);
      e.h += Math.round(e.h / r); node.style.height = e.h + 'px'; renderOverlay();
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
    '기호': '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅰⅱⅲⅳⅴ●○◎■□▲△▼▽◆◇★☆→←↑↓↔⇒⇔✓✗※∑√∞≈≠≤≥±×÷°℃㎡㎥㎏㎞㎜ΔΩπμσλθ',
  };
  const SYMBOLS = Array.from('①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ●○■□▲△▶◆★☆✓✗→←↑↓⇒⇔※∑√∞≈≠≤≥±×÷°℃㎡㎥㎏㎞㎜ΔΩπμσθλ²³½·…“”「」');
  const graphemes = (s) => (window.Intl && Intl.Segmenter) ? Array.from(new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(s), x => x.segment) : Array.from(s);
  /* 내 심벌: 파일·글자를 끌어다 놓거나 잡은 개체를 더해 두고 다시 씀 (이 기기의 브라우저에 저장) */
  const MYSYM_KEY = 'gyoan:mySymbols', ICON_ORDER_KEY = 'gyoan:iconOrder', ICON_FOLD_KEY = 'gyoan:iconFold', MY = '내 심벌';
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const mySyms = () => lsGet(MYSYM_KEY, []);
  function saveSyms(list) { if (!lsSet(MYSYM_KEY, list)) { alert('내 심벌 저장 공간이 가득 찼습니다. 안 쓰는 심벌을 지워 주세요.'); return false; } symLater(); return true; }
  /* ---- 내 심벌 함께 쓰기: 저장소의 my-symbols.json 한 파일로 모든 기기(PC·휴대폰)가 같은 목록을 씀 ----
     · 읽기: 누구나 (연결 전에는 배포된 사이트의 파일을 읽음)   · 쓰기: GitHub 에 연결된 기기
     · 합치기: 이 기기에서 새로 더한 것은 올리고, 다른 기기에서 더한 것은 받고, 어느 쪽에서든 지운 것은 양쪽에서 지움 */
  const SYM_FILE = 'my-symbols.json', SYM_SEEN_KEY = 'gyoan:mySymbolsSeen', SYM_DEL_KEY = 'gyoan:mySymbolsDel';
  const symSt = { state: 'idle', busy: null, again: false, timer: null, onChange: null };
  const symOn = () => API.mode === 'github';
  const symCanWrite = () => symOn() && !!GH.token;
  /* 저장소의 목록. 파일이 아직 없으면 null. 읽을 수 없거나 내용이 깨졌으면 오류 (그럴 때는 아무것도 지우지 않음) */
  async function symRead() {
    let text = null;
    if (!GH.token && GH.onPages) { const r = await fetch(SYM_FILE + '?t=' + Date.now(), { cache: 'no-store' }); if (r.status === 404) return null; if (!r.ok) throw new Error('읽지 못함 (' + r.status + ')'); text = await r.text(); }
    else text = await GH.raw(SYM_FILE);
    if (text == null) return null;
    const j = JSON.parse(text); if (!j || !Array.isArray(j.items)) throw new Error('형식이 다릅니다');
    return j.items.filter(x => x && x.id && (x.t === 'img' ? typeof x.d === 'string' : typeof x.c === 'string'));
  }
  function symMerge(remote) {
    const local = mySyms(), seen = new Set(lsGet(SYM_SEEN_KEY, [])), del = new Set(lsGet(SYM_DEL_KEY, []));
    const rIds = new Set((remote || []).map(x => x.id));
    // 이 기기에만 있는 것: 저장소에서 본 적 없는 것 = 새로 더한 것(올림) / 본 적 있는데 사라진 것 = 다른 기기에서 지운 것(뺌)
    const fresh = local.filter(x => !rIds.has(x.id) && (!remote || !seen.has(x.id)));
    const kept = (remote || []).filter(x => !del.has(x.id));
    const out = fresh.concat(kept);
    const needPush = fresh.length > 0 || (remote || []).some(x => del.has(x.id));
    const changed = out.map(x => x.id).join() !== local.map(x => x.id).join();
    if (changed) lsSet(MYSYM_KEY, out);
    lsSet(SYM_SEEN_KEY, kept.map(x => x.id));
    return { out, needPush, changed };
  }
  function symNotify(changed) { if (symSt.onChange) { try { symSt.onChange(!!changed); } catch (e) { } } }
  function symSync() {
    if (!symOn()) return Promise.resolve(false);
    if (symSt.busy) { symSt.again = true; return symSt.busy; }
    symSt.state = 'sync'; symNotify(false);
    const run = (async () => {
      let changed = false;
      try {
        const m = symMerge(await symRead()); changed = m.changed;
        if (!m.needPush) symSt.state = symCanWrite() ? 'ok' : 'readonly';
        else if (!symCanWrite()) symSt.state = 'needToken';
        else {
          await GH.enqueue({ path: SYM_FILE, content: JSON.stringify({ v: 1, updated: new Date().toISOString(), items: m.out }, null, 1) }, { now: true, message: `내 심벌 저장 (${m.out.length}개)` });
          lsSet(SYM_DEL_KEY, []); lsSet(SYM_SEEN_KEY, m.out.map(x => x.id)); symSt.state = 'ok'; // 방금 올린 것은 저장소에 있는 것으로 기억
        }
      } catch (e) { symSt.state = e && (e.noToken || e.status === 401) ? 'needToken' : 'fail'; }
      return changed;
    })();
    symSt.busy = run;
    return run.then((changed) => { symSt.busy = null; symNotify(changed); if (symSt.again) { symSt.again = false; symLater(); } return changed; });
  }
  function symLater() { if (!symOn()) return; clearTimeout(symSt.timer); symSt.timer = setTimeout(symSync, 1200); }
  function symForget(id) { if (!symOn()) return; const d = lsGet(SYM_DEL_KEY, []); if (!d.includes(id)) { d.push(id); lsSet(SYM_DEL_KEY, d.slice(-300)); } } // 지운 것은 저장소에서도 지우도록 적어 둠
  function symLabel(n) {
    const none = '그림·글자를 끌어다 놓거나 붙여넣으면(Ctrl+V) 모아 둡니다';
    if (!symOn()) return n ? `${n}개 · 이 기기에 저장됨` : none;
    const head = (n ? `${n}개` : none) + ' · ';
    switch (symSt.state) {
      case 'sync': return head + '다른 기기와 맞추는 중…';
      case 'ok': return head + '모든 기기에서 함께 씀 ✓';
      case 'readonly': return head + '저장소에서 불러옴 · 여기서 더한 것도 나누려면 <a href="#" data-myconnect>GitHub 연결</a>';
      case 'needToken': return head + '아직 이 기기에만 있음 — <a href="#" data-myconnect>GitHub 연결</a>을 하면 모든 기기에서 씀';
      case 'fail': return head + '다른 기기와 맞추지 못했습니다 (인터넷 확인) · <a href="#" data-mysync>다시 시도</a>';
      default: return head + (symCanWrite() ? '모든 기기에서 함께 씀' : '이 기기에 저장됨');
    }
  }
  /* 심벌로 쓸 원본 그림을 저장소에 함께 올려 둠 → 어느 기기에서 넣어도 선명하게 (연결된 기기 · 내 PC 서버) */
  async function symOriginal(f) {
    if (!(API.mode === 'server' || symCanWrite())) return '';
    try { const prep = await prepareImage(f); const src = await API.stage(prep.blob, prep.name); return /^assets\//.test(src) ? src : ''; } catch (e) { return ''; }
  }
  const imgLoads = (src) => new Promise((res) => { const im = new Image(); const t = setTimeout(() => res(false), 5000); im.onload = () => { clearTimeout(t); res(true); }; im.onerror = () => { clearTimeout(t); res(false); }; im.src = src; });
  /* 그림은 작게(최대 160px) 줄여서 보관 */
  function shrinkImage(blob) {
    return new Promise((res, rej) => {
      const im = new Image(); const u = URL.createObjectURL(blob);
      im.onload = () => { const r = Math.min(1, 160 / im.naturalWidth, 160 / im.naturalHeight); const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * r)); c.height = Math.max(1, Math.round(im.naturalHeight * r)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/png')); };
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('그림을 읽을 수 없습니다')); }; im.src = u;
    });
  }
  async function addMySym(item) { const l = mySyms(); l.unshift(Object.assign({ id: uid() }, item)); return saveSyms(l); }
  async function addMySymFromDrop(dt) {
    let n = 0;
    for (const f of Array.from(dt.files || [])) { if (!f.type.startsWith('image/')) continue; if (f.type === 'image/svg+xml' && f.size < 60000) { await addMySym({ t: 'img', d: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(await f.text()))) }); } else { const src = await symOriginal(f); await addMySym(Object.assign({ t: 'img', d: await shrinkImage(f) }, src ? { src } : {})); } n++; }
    if (!n) { const t = (dt.getData('text/plain') || '').trim(); if (t) { for (const c of graphemes(t).filter(c => c.trim()).slice(0, 20)) { await addMySym({ t: 'txt', c }); n++; } } }
    return n;
  }
  /* 개체 하나 → 내 심벌 (글자·기호 상자, 이미지). 넣었으면 true, 못 넣으면 까닭(글) */
  async function addMySymFromEl(e) {
    if (e && e.type === 'image' && e.src) {
      try { const b = await (await fetch(API.resolveSrc(e.src))).blob(); const small = /svg/i.test(b.type) && b.size < 60000; return (await addMySym(small ? { t: 'img', d: await blobToDataURL(b) } : { t: 'img', d: await shrinkImage(b), src: /^assets\//.test(e.src) ? e.src : '' })) ? true : '저장 공간이 가득 찼습니다'; }
      catch (err) { return '이미지를 가져오지 못했습니다'; }
    }
    if (e && (e.type === 'text' || e.type === 'shape')) { const t = stripHtml(e.html || '').trim(); if (!t) return '글이 없는 상자입니다'; return (await addMySym({ t: 'txt', c: t.length > 12 ? t.slice(0, 12) : t, fs: e.type === 'text' ? (e.style && e.style.fontSize) : null })) ? true : '저장 공간이 가득 찼습니다'; }
    return '글자·기호 상자나 이미지만 심벌로 둘 수 있습니다';
  }
  /* 잡은 개체 → 내 심벌 */
  async function addMySymFromSelection() {
    const e = S.sel.length === 1 ? elById(S.sel[0]) : null; if (!e) { toast('먼저 슬라이드에서 개체를 하나 잡으세요'); return false; }
    const r = await addMySymFromEl(e); if (r !== true) toast(r); return r === true;
  }
  /* 붙여넣기(Ctrl+V) → 내 심벌: 그림(PowerPoint 에서 복사한 도형·그림, 화면 캡처, 그림 파일) · 편집 화면에서 복사한 개체 · 글자 */
  async function addMySymFromPaste(files, text) {
    if (files.length) return addMySymFromDrop({ files: files.map((f, i) => new File([f], f.name && !/^image\.(png|bmp)$/i.test(f.name) ? f.name : `symbol-${Date.now().toString(36)}${i || ''}.` + ((f.type.split('/')[1] || 'png').replace('svg+xml', 'svg').replace('jpeg', 'jpg')), { type: f.type })), getData: () => '' });
    if (text.startsWith(CLIP_TAG)) {
      let data = null; try { data = JSON.parse(text.slice(CLIP_TAG.length)); } catch (e) { }
      if (!data || data.kind !== 'els') { toast('슬라이드는 내 심벌에 넣을 수 없습니다 — 개체(그림·기호)를 복사해 주세요'); return 0; }
      let n = 0, why = ''; for (const e of (data.items || []).slice().reverse().slice(0, 30)) { const r = await addMySymFromEl(e); if (r === true) n++; else why = r; }
      if (!n && why) toast(why); return n;
    }
    const t = text.replace(/\s+/g, ' ').trim(); if (!t) return 0;
    return (await addMySym({ t: 'txt', c: t.length > 12 ? t.slice(0, 12) : t })) ? 1 : 0;
  }
  function iconSections() {
    const names = [MY].concat(Object.keys(ICONS)); const order = lsGet(ICON_ORDER_KEY, []);
    return order.filter(n => names.includes(n)).concat(names.filter(n => !order.includes(n)));
  }
  function showIconPicker() {
    if (S.editing) endEdit();
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    const fold = new Set(lsGet(ICON_FOLD_KEY, []));
    const draw = () => {
      const secHtml = (name) => {
        const open = !fold.has(name);
        let grid;
        if (name === MY) {
          const l = mySyms();
          grid = `<div class="icon-grid my-grid" data-drop="1">${l.map(it => `<button class="ic my" data-my="${esc(it.id)}" title="누르면 넣기 · 우클릭하면 지우기">${it.t === 'img' ? `<img src="${esc(it.d)}" alt="">` : esc(it.c)}</button>`).join('')}
            <div class="my-drop" title="여기에 그림 파일·글자·PPT 심벌을 끌어다 놓거나, 복사한 것을 붙여넣으세요(Ctrl+V)">＋<small>끌어다 놓기 · Ctrl+V</small></div></div>
            <div class="my-tools"><button class="btn sm" data-mysel="1" title="슬라이드에서 잡은 글자·기호 상자나 이미지를 내 심벌로">＋ 잡은 개체 추가</button><input type="text" data-mytxt="1" placeholder="기호·글자 입력 후 Enter" style="width:150px"><label class="btn sm" title="그림 파일 고르기">📁 파일…<input type="file" accept="image/*" multiple data-myfile="1" hidden></label><button class="btn sm" data-myppt="1" title="PPT 파일을 열어 그 안의 그림·도형을 심벌로 꺼냅니다 (꺼낸 것을 여기로 끌어다 놓기)">🧩 PPT 에서…</button><span class="muted" data-symstate style="font-size:11.5px">${symLabel(l.length)}</span></div>`;
        } else grid = `<div class="icon-grid">${graphemes(ICONS[name]).filter(c => c.trim()).map(c => `<button class="ic" data-ic="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
        return `<section class="icon-sec${open ? '' : ' fold'}" data-sec="${esc(name)}"><h4 draggable="true" title="누르면 접기·펴기 · 끌어서 순서 바꾸기"><span class="grip">⋮⋮</span><span class="nm">${esc(name)}</span><span class="cnt">${name === MY ? mySyms().length : graphemes(ICONS[name]).filter(c => c.trim()).length}</span><span class="arrow">${open ? '▾' : '▸'}</span></h4>${open ? grid : ''}</section>`;
      };
      bg.innerHTML = `<div class="modal icon-modal"><h3>아이콘 · 기호 <span class="muted" style="font-weight:400;font-size:13px">누르면 슬라이드 가운데에 들어갑니다 · 크기는 글자 크기(Ctrl+] / Ctrl+[)로</span></h3>
        <div class="icon-secs">${iconSections().map(secHtml).join('')}</div>
        <div class="actions"><span class="muted" style="flex:1;font-size:12px">제목을 누르면 접고 펴기 · ⋮⋮ 를 끌면 순서 바꾸기 · <b>복사한 그림·기호는 Ctrl+V 로 내 심벌에</b> (PowerPoint 도형도 됩니다) · 글을 쓰는 중에는 글 상자 위 도구의 Ω 버튼</span><button class="btn" data-close>닫기</button></div></div>`;
    };
    const insertTxt = (c, fs) => { const [x, y] = centerBox(220, 220); bg.remove(); addElement(textEl('text', x, y, 220, 220, esc(c), { style: { fontSize: fs || (graphemes(c).length > 2 ? 60 : 150), align: 'center', valign: 'middle', lineHeight: 1 } })); };
    const insertImg = async (it) => {
      bg.remove();
      try {
        let src = it.src;
        if (src && !API.blobs[src] && !(await imgLoads(src)) && !(symOn() && await imgLoads(GH.rawUrl(src)))) src = ''; // 원본이 아직 이 기기에서 안 보이면 작은 그림으로
        if (!src) { const b = await (await fetch(it.d)).blob(); src = await API.stage(b, /svg/i.test(b.type) ? 'symbol.svg' : 'symbol.png'); }
        const [x, y] = centerBox(300, 300); addElement(imageEl(x, y, 300, 300, src));
      } catch (err) { alert('심벌을 넣지 못했습니다: ' + err.message); }
    };
    let dragSec = null;
    bg.addEventListener('click', async (ev) => {
      if (ev.target === bg || ev.target.dataset.close != null) { bg.remove(); return; }
      if (ev.target.closest('[data-myconnect]')) { ev.preventDefault(); const ok = await GH.connect({ reason: '연결하면 내 심벌이 저장소에 올라가 PC·휴대폰 어디서나 같은 목록을 씁니다.' }); ghChip(); if (ok === true) symSync(); return; }
      if (ev.target.closest('[data-mysync]')) { ev.preventDefault(); symSync(); return; }
      const h = ev.target.closest('.icon-sec > h4'); if (h) { const n = h.parentNode.dataset.sec; if (fold.has(n)) fold.delete(n); else fold.add(n); lsSet(ICON_FOLD_KEY, Array.from(fold)); draw(); return; }
      if (ev.target.closest('[data-mysel]')) { if (await addMySymFromSelection()) { toast('내 심벌에 넣었습니다'); draw(); } return; }
      if (ev.target.closest('[data-myppt]')) { showPptSyms(); return; }
      if (ev.target.closest('.my-drop')) { bg.querySelector('[data-myfile]').click(); return; }
      const my = ev.target.closest('[data-my]'); if (my) { const it = mySyms().find(x => x.id === my.dataset.my); if (!it) return; if (it.t === 'img') insertImg(it); else insertTxt(it.c, it.fs); return; }
      const b = ev.target.closest('[data-ic]'); if (b) insertTxt(b.dataset.ic);
    });
    bg.addEventListener('contextmenu', (ev) => { const my = ev.target.closest('[data-my]'); if (!my) return; ev.preventDefault(); if (confirm(symOn() ? '이 심벌을 내 심벌에서 지울까요?\n(함께 쓰는 다른 기기에서도 지워집니다)' : '이 심벌을 내 심벌에서 지울까요?')) { symForget(my.dataset.my); saveSyms(mySyms().filter(x => x.id !== my.dataset.my)); draw(); } });
    bg.addEventListener('keydown', async (ev) => { ev.stopPropagation(); if (ev.key === 'Escape') { bg.remove(); return; } if (ev.key === 'Enter' && ev.target.dataset.mytxt != null && !ev.isComposing) { const t = ev.target.value.trim(); if (!t) return; await addMySym({ t: 'txt', c: t.length > 12 ? t.slice(0, 12) : t }); draw(); bg.querySelector('[data-mytxt]').focus(); } });
    bg.addEventListener('change', async (ev) => { if (ev.target.dataset.myfile != null) { const dt = { files: ev.target.files, getData: () => '' }; const n = await addMySymFromDrop(dt); if (n) { toast(`심벌 ${n}개를 넣었습니다`); draw(); } } });
    // 끌어다 놓기: 그림 파일·글자 → 내 심벌 / 묶음 제목 → 순서 바꾸기
    bg.addEventListener('dragstart', (ev) => { const h = ev.target.closest && ev.target.closest('.icon-sec > h4'); if (!h) return; dragSec = h.parentNode; ev.dataTransfer.setData('text/icon-sec', dragSec.dataset.sec); ev.dataTransfer.effectAllowed = 'move'; });
    bg.addEventListener('dragover', (ev) => {
      const sec = ev.target.closest && ev.target.closest('.icon-sec');
      if (dragSec && sec) { ev.preventDefault(); if (sec !== dragSec) { const r = sec.getBoundingClientRect(); sec.parentNode.insertBefore(dragSec, ev.clientY < r.top + r.height / 2 ? sec : sec.nextSibling); } return; }
      if (!dragSec && (pptDrag || ev.dataTransfer.types.includes('Files') || ev.dataTransfer.types.includes('text/plain') || !ev.dataTransfer.types.length)) { ev.preventDefault(); if (pptDrag) ev.dataTransfer.dropEffect = 'copy'; bg.querySelector('.icon-modal').classList.add('dragover'); }
    });
    bg.addEventListener('dragleave', (ev) => { if (ev.target === bg.querySelector('.icon-modal')) bg.querySelector('.icon-modal').classList.remove('dragover'); });
    bg.addEventListener('dragend', () => { if (dragSec) { lsSet(ICON_ORDER_KEY, Array.from(bg.querySelectorAll('.icon-sec')).map(x => x.dataset.sec)); dragSec = null; } });
    bg.addEventListener('drop', async (ev) => {
      bg.querySelector('.icon-modal').classList.remove('dragover');
      if (dragSec) { ev.preventDefault(); return; }
      if (pptDrag) { // PPT 심벌 창에서 끌어온 심벌
        ev.preventDefault(); const it = pptDrag; pptDrag = null;
        try { if (await pptSymToMy(it)) { toast('내 심벌에 담았습니다'); showMy(); } } catch (err) { toast('이 심벌은 가져오지 못했습니다: ' + err.message, 4500); }
        return;
      }
      if (!ev.dataTransfer.files.length && !ev.dataTransfer.getData('text/plain')) { if (!ev.dataTransfer.types.length) { ev.preventDefault(); toast(DROP_HELP, 9000); } return; }
      ev.preventDefault();
      try { const n = await addMySymFromDrop(ev.dataTransfer); if (n) { toast(`내 심벌에 ${n}개를 넣었습니다`); if (fold.has(MY)) { fold.delete(MY); lsSet(ICON_FOLD_KEY, Array.from(fold)); } draw(); } else toast('그림 파일이나 글자만 넣을 수 있습니다'); } catch (err) { alert(err.message); }
    });
    // 창을 열 때 다른 기기와 맞춤: 목록이 달라졌으면 다시 그리고, 아니면 상태 글만 고침
    const showMy = () => { if (!bg.isConnected) return; if (fold.has(MY)) { fold.delete(MY); lsSet(ICON_FOLD_KEY, Array.from(fold)); } draw(); };
    iconRedraw = showMy;
    // 붙여넣기(Ctrl+V): 이 창이 열려 있는 동안에는 슬라이드가 아니라 내 심벌에 넣음
    symPaste = (ev) => {
      if (!bg.isConnected) { symPaste = null; return false; }
      const cd = ev.clipboardData, text = cd.getData('text/plain') || '', html = cd.getData('text/html') || '';
      const files = Array.from(cd.files || []).filter(f => /^image\//.test(f.type));
      const pic = files.length > 0 && (!text.trim() || !html || /Microsoft PowerPoint/i.test(html));
      if (!pic && ev.target && ev.target.dataset && ev.target.dataset.mytxt != null) return false; // 글 칸에는 글을 그대로 붙임
      ev.preventDefault();
      (async () => {
        try { const n = await addMySymFromPaste(pic ? files : [], text); if (n) { toast(`내 심벌에 ${n}개를 넣었습니다`); showMy(); } else if (!text.startsWith(CLIP_TAG)) toast('내 심벌에는 그림이나 글자만 넣을 수 있습니다'); }
        catch (err) { alert('내 심벌에 넣지 못했습니다: ' + err.message); }
      })();
      return true;
    };
    symSt.onChange = (changed) => { if (!bg.isConnected) { symSt.onChange = null; return; } if (changed && !bg.querySelector('[data-mytxt]:focus')) draw(); else { const el = bg.querySelector('[data-symstate]'); if (el) el.innerHTML = symLabel(mySyms().length); } };
    draw(); document.body.appendChild(bg); symSync();
  }

  /* ---- 배경 지우기 (아이콘 · 이미지) ---- */
  /* 글자 수가 적은 글 상자(이모지·기호)는 아이콘으로 봄 */
  function isIconText(e) { if (!e || e.type !== 'text') return false; const t = stripHtml(e.html || ''); return !!t && !/\n/.test(t) && graphemes(t).length <= 3; }
  /* 이미지 → 캔버스. 가져올 수 있는 곳(이 사이트의 파일, 방금 넣은 그림, 교안 안에 든 그림)만 */
  async function imageToCanvas(src) {
    const urls = [API.resolveSrc(src)];
    if (API.mode === 'github' && !/^(data:|blob:|https?:)/i.test(src)) urls.push(GH.rawUrl(src));
    let blob = null;
    for (const u of urls) { try { const r = await fetch(u); if (r.ok) { blob = await r.blob(); break; } } catch (err) { } }
    if (!blob) throw new Error('이 그림은 불러올 수 없어 배경을 지울 수 없습니다. 다른 사이트의 그림은 파일로 받아서 넣어 주세요.');
    return new Promise((res, rej) => {
      const im = new Image(), u = URL.createObjectURL(blob);
      im.onload = () => {
        const w0 = im.naturalWidth || 512, h0 = im.naturalHeight || 512, big = Math.max(w0, h0);
        const r = big > 1400 ? 1400 / big : (blob.type === 'image/svg+xml' && big < 512 ? 512 / big : 1);
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w0 * r)); c.height = Math.max(1, Math.round(h0 * r));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c);
      };
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('그림을 읽을 수 없습니다')); }; im.src = u;
    });
  }
  /* 아이콘(이모지·기호 글 상자) → 상자와 같은 비율의 투명한 그림 */
  function iconToCanvas(e) {
    const st = resolveTextStyle(e, theme()), txt = stripHtml(e.html || ''), fs = st.fontSize || 150;
    let k = clamp(480 / fs, 1, 4); k = Math.min(k, 1400 / Math.max(e.w, e.h));
    const c = document.createElement('canvas'); c.width = Math.max(8, Math.round(e.w * k)); c.height = Math.max(8, Math.round(e.h * k));
    const g = c.getContext('2d'); const font = (px) => `${st.italic ? 'italic ' : ''}${st.bold ? 700 : 400} ${px}px ${fontCss(st.font)}`;
    let px = fs * k; g.font = font(px); let m = g.measureText(txt);
    const hh = (mm) => (mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent) || px;
    const sc = Math.min(1, 0.96 * c.width / Math.max(1, m.width), 0.96 * c.height / hh(m));
    if (sc < 1) { px *= sc; g.font = font(px); m = g.measureText(txt); }
    g.fillStyle = themeColor(st.color, theme()); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillText(txt, c.width / 2, c.height / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    return c;
  }
  /* 지우기 계산: picks = 지울 곳들 {auto|x,y, r,g,b}. 같은 색으로 이어진 곳(또는 그림 전체의 같은 색)을 투명하게, 경계는 부드럽게 */
  function eraseBackground(orig, W, H, picks, tol, all, soft) {
    const src = orig.data, n = W * H, out = new Uint8ClampedArray(src);
    const gone = new Uint8Array(n), fa = new Float32Array(n).fill(1), kc = new Uint8Array(n); // kc: 경계 픽셀이 어느 pick 색에 물들었는지
    const T2 = tol * tol, S = soft ? Math.max(14, tol * 0.6) : 0, TS2 = (tol + S) * (tol + S);
    const stack = new Int32Array(n), seen = new Uint8Array(n), ring = new Int32Array(n);
    picks.forEach((p, pi) => {
      const kr = p.r, kg = p.g, kb = p.b, tag = pi + 1;
      const d2 = (i) => { const o = i * 4; if (src[o + 3] < 16) return 1e9; const a = src[o] - kr, b = src[o + 1] - kg, c = src[o + 2] - kb; return a * a + b * b + c * c; };
      if (all) { for (let i = 0; i < n; i++) if (!gone[i] && d2(i) <= T2) gone[i] = tag; }
      else {
        seen.fill(0); let sp = 0;
        const push = (i) => { if (seen[i]) return; seen[i] = 1; if (!gone[i] && d2(i) <= T2) { gone[i] = tag; stack[sp++] = i; } };
        if (p.auto) { for (let x = 0; x < W; x++) { push(x); push(n - W + x); } for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); } }
        else push(p.y * W + p.x);
        while (sp) { const i = stack[--sp], x = i % W; if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (i >= W) push(i - W); if (i < n - W) push(i + W); }
      }
      if (!S) return;
      // 지운 곳에 맞닿은 두 겹: 배경색이 섞인 만큼 반투명하게
      let rn = 0; seen.fill(0);
      const edge = (i, from) => { if (gone[i] || seen[i]) return; seen[i] = 1; const d = d2(i); if (d >= TS2) return; const f = (Math.sqrt(d) - tol) / S; if (f < fa[i]) { fa[i] = Math.max(0, f); kc[i] = tag; } if (from === 1) ring[rn++] = i; };
      const around = (i, from) => { const x = i % W; if (x > 0) edge(i - 1, from); if (x < W - 1) edge(i + 1, from); if (i >= W) edge(i - W, from); if (i < n - W) edge(i + W, from); };
      for (let i = 0; i < n; i++) if (gone[i] === tag) around(i, 1);
      const r1 = rn; for (let j = 0; j < r1; j++) around(ring[j], 2);
    });
    let cnt = 0;
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      if (gone[i]) { out[o + 3] = 0; if (src[o + 3] >= 16) cnt++; continue; }
      const f = fa[i]; if (f >= 1) continue;
      if (f <= 0.04) { out[o + 3] = 0; cnt++; continue; }
      const p = picks[kc[i] - 1]; // 섞여 있던 배경색을 덜어 냄 (흰 테두리가 남지 않게)
      out[o] = (src[o] - (1 - f) * p.r) / f; out[o + 1] = (src[o + 1] - (1 - f) * p.g) / f; out[o + 2] = (src[o + 2] - (1 - f) * p.b) / f; out[o + 3] = src[o + 3] * f;
    }
    return { data: out, gone, removed: cnt };
  }
  /* 가장자리에서 가장 많은 색 → 처음에 자동으로 지울 배경색. 가장자리가 이미 투명하거나 색이 제각각이면 없음 */
  function borderColor(orig, W, H) {
    const src = orig.data, cnt = new Map(); let total = 0, clear = 0;
    const add = (i) => { const o = i * 4; total++; if (src[o + 3] < 16) { clear++; return; } const k = (src[o] >> 4) << 8 | (src[o + 1] >> 4) << 4 | (src[o + 2] >> 4); const v = cnt.get(k) || [0, 0, 0, 0]; v[0]++; v[1] += src[o]; v[2] += src[o + 1]; v[3] += src[o + 2]; cnt.set(k, v); };
    for (let x = 0; x < W; x++) { add(x); add((H - 1) * W + x); } for (let y = 1; y < H - 1; y++) { add(y * W); add(y * W + W - 1); }
    if (clear > total * 0.5) return { clear: true };
    let best = null; for (const v of cnt.values()) if (!best || v[0] > best[0]) best = v;
    if (!best || best[0] < total * 0.3) return null;
    return { r: Math.round(best[1] / best[0]), g: Math.round(best[2] / best[0]), b: Math.round(best[3] / best[0]) };
  }
  async function showBgRemove(e) {
    if (!e) return; if (S.editing) endEdit();
    const isTxt = e.type === 'text';
    if (!isTxt && !(e.type === 'image' && e.src)) { toast('이미지나 아이콘을 잡고 눌러 주세요'); return; }
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal bgrm"><h3>${isTxt ? '아이콘 ' : ''}배경 지우기 <span class="muted" style="font-weight:400;font-size:13px">지울 곳을 그림에서 누르세요 · 누를 때마다 더 지워집니다</span></h3>
      <div class="bgrm-view"><canvas></canvas><div class="bgrm-msg">불러오는 중…</div></div>
      <div class="row"><label style="white-space:nowrap">지우는 정도</label><input type="range" min="4" max="160" value="48" data-tol style="flex:1"><span class="muted" data-tolv style="width:30px;text-align:right">48</span></div>
      <div class="row" style="flex-wrap:wrap"><label class="bgrm-ck" title="켜면 눌러서 고른 색을 그림 어디에 있든 모두 지웁니다 (글자 안쪽의 막힌 틈까지)"><input type="checkbox" data-all> 떨어져 있는 같은 색도 지우기</label><label class="bgrm-ck" title="경계를 반투명하게 다듬어 흰 테두리가 남지 않게 합니다"><input type="checkbox" data-soft checked> 가장자리 부드럽게</label>
        <span style="flex:1"></span><span class="bgrm-bgs" title="확인용 바탕"><button class="on" data-pv="" title="투명(체크 무늬)"></button><button data-pv="#ffffff" title="흰 바탕" style="background:#fff"></button><button data-pv="#111827" title="어두운 바탕" style="background:#111827"></button></span></div>
      <div class="row"><span class="muted" data-info style="flex:1;font-size:12.5px"></span><button class="btn sm" data-back disabled>↶ 한 번 되돌리기</button><button class="btn sm" data-reset disabled>처음으로</button></div>
      <div class="actions"><button class="btn" data-close>취소</button><button class="btn primary" data-ok disabled>적용</button></div></div>`;
    document.body.appendChild(bg);
    const q = (sel) => bg.querySelector(sel), cv = q('canvas'), msg = q('.bgrm-msg'), info = q('[data-info]'), ok = q('[data-ok]');
    bg.addEventListener('click', (ev) => { if (ev.target === bg || ev.target.closest('[data-close]')) bg.remove(); });
    let work;
    try { work = isTxt ? iconToCanvas(e) : await imageToCanvas(e.src); }
    catch (err) { msg.textContent = err.message; return; }
    if (!bg.isConnected) return;
    const W = work.width, H = work.height; let orig;
    try { orig = work.getContext('2d').getImageData(0, 0, W, H); } catch (err) { msg.textContent = '이 그림은 보안 제한 때문에 배경을 지울 수 없습니다.'; return; }
    cv.width = W; cv.height = H; msg.remove();
    const g = cv.getContext('2d'); let picks = [], res = null, raf = 0;
    const auto = borderColor(orig, W, H); const first = auto && !auto.clear ? [{ auto: true, r: auto.r, g: auto.g, b: auto.b }] : [];
    picks = first.slice();
    const draw = () => {
      raf = 0;
      const tol = +q('[data-tol]').value; q('[data-tolv]').textContent = tol;
      res = eraseBackground(orig, W, H, picks, tol, q('[data-all]').checked, q('[data-soft]').checked);
      g.putImageData(new ImageData(res.data, W, H), 0, 0);
      const pct = Math.round(res.removed / (W * H) * 100);
      info.textContent = !picks.length ? (auto && auto.clear ? '바탕이 이미 투명합니다. 더 지울 곳(색 칸 등)을 눌러 주세요.' : '지울 곳을 그림에서 눌러 주세요.') : res.removed ? `지운 넓이 ${pct < 1 ? '1% 미만' : pct + '%'}${first.length && picks.length === 1 ? ' · 가장자리 바탕색을 자동으로 지웠습니다' : ''}` : '지워진 곳이 없습니다. “지우는 정도”를 올려 보세요.';
      ok.disabled = !res.removed; q('[data-back]').disabled = !picks.length; q('[data-reset]').disabled = picks.length === first.length;
    };
    const redraw = () => { if (!raf) raf = setTimeout(draw, 16); };
    cv.addEventListener('click', (ev) => {
      const r = cv.getBoundingClientRect(); if (!r.width) return;
      const x = clamp(Math.floor((ev.clientX - r.left) / r.width * W), 0, W - 1), y = clamp(Math.floor((ev.clientY - r.top) / r.height * H), 0, H - 1), o = (y * W + x) * 4;
      if (orig.data[o + 3] < 16 || (res && res.gone[y * W + x])) { info.textContent = '이미 지워진 곳입니다. 남아 있는 색을 눌러 주세요.'; return; }
      if (picks.length >= 200) { info.textContent = '너무 많이 눌렀습니다. “처음으로”를 눌러 다시 해 주세요.'; return; }
      picks.push({ x, y, r: orig.data[o], g: orig.data[o + 1], b: orig.data[o + 2] }); redraw();
    });
    bg.addEventListener('input', (ev) => { if (ev.target.matches('[data-tol],[data-all],[data-soft]')) redraw(); });
    q('[data-back]').onclick = () => { picks.pop(); redraw(); };
    q('[data-reset]').onclick = () => { picks = first.slice(); redraw(); };
    q('.bgrm-bgs').onclick = (ev) => { const b = ev.target.closest('[data-pv]'); if (!b) return; for (const x of bg.querySelectorAll('[data-pv]')) x.classList.toggle('on', x === b); cv.style.background = b.dataset.pv || ''; };
    ok.onclick = async () => {
      if (!res || !res.removed) return;
      ok.disabled = true; ok.textContent = '적용 중…';
      try {
        const blob = await new Promise((r, j) => cv.toBlob(b => b ? r(b) : j(new Error('그림을 만들지 못했습니다')), 'image/png'));
        const src = await API.stage(blob, isTxt ? 'icon.png' : 'nobg.png');
        bg.remove();
        if (!curSlide().elements.includes(e)) { toast('개체가 바뀌어 적용하지 못했습니다'); return; }
        if (isTxt) replaceBox(e, imageEl(e.x, e.y, e.w, e.h, src, { fit: 'contain', rotate: e.rotate || 0, opacity: e.opacity == null ? 1 : e.opacity }));
        else { e.src = src; commit(); rerenderEl(e.id); renderOverlay(); renderProps(); }
        toast(isTxt ? '아이콘을 그림으로 바꾸고 배경을 지웠습니다 · 되돌리기 Ctrl+Z' : '배경을 지웠습니다 · 되돌리기 Ctrl+Z');
      } catch (err) { ok.disabled = false; ok.textContent = '적용'; alert('배경 지우기 실패: ' + err.message); }
    };
    draw();
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
    const sel = (k, v) => `<select data-dk="${k}">${fontOptions(v || '', ['', '테마 기본'])}</select>`;
    const draw = () => {
      const d = S.deck, t = theme(), ft = d.footer || {};
      bg.innerHTML = `<div class="modal design-modal"><h3>🎨 디자인 <span class="muted" style="font-weight:400;font-size:13px">교안 전체에 바로 적용됩니다 · Ctrl+Z 로 되돌리기</span></h3>
        <h4>테마</h4><div class="theme-grid">${THEMES.map(x => `<div class="theme-card ${x.id === d.theme ? 'on' : ''}" data-theme="${x.id}"><div class="pv"></div><span>${esc(x.name)}</span></div>`).join('')}</div>
        <div class="design-cols">
          <div><h4>색 직접 지정</h4>${THEME_COLOR_KEYS.map(([k, n]) => `<label class="drow"><span>${n}</span><input type="color" data-color="${k}" value="${toHex(t[k])}">${d.colors && d.colors[k] ? '<em>바꿈</em>' : ''}</label>`).join('')}
            <button class="btn sm" data-reset="1">테마 색으로 되돌리기</button></div>
          <div><h4>글꼴</h4>
            <label class="drow"><span>제목</span>${sel('titleFont', d.titleFont || '')}</label>
            <label class="drow"><span>본문</span>${sel('bodyFont', d.bodyFont || '')}</label>
            <div class="font-pv" style="font-family:${esc(fontCss(t.titleFont))}">제목 글꼴 미리보기 Aa</div><div class="font-pv sm" style="font-family:${esc(fontCss(t.bodyFont))}">본문 글꼴 미리보기 — 소방용수시설의 종류 123</div>
            <h4>장식</h4><label class="drow"><span>모든 슬라이드</span><select data-dk="decor">${DECORS.map(o => `<option value="${o[0]}" ${o[0] === (d.decor || '') ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
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
      if (t.dataset.dk) { if (t.value) S.deck[t.dataset.dk] = t.value; else delete S.deck[t.dataset.dk]; if (t.dataset.dk !== 'decor') touchFont(t.value); apply(true); return; }
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
      if (replaceInElement(e, q.value.trim(), r.value, true)) { commit({ all: true }); renderStage(); findPos--; }
      go(1);
    };
    const all = () => {
      let n = 0; S.deck.slides.forEach(sl => sl.elements.forEach(e => { n += replaceInElement(e, q.value.trim(), r.value, false); }));
      if (n) { commit({ all: true }); renderStage(); renderProps(); } toast(n ? `${n}곳을 바꿨습니다` : '바꿀 내용이 없습니다'); findPos = -1; upd();
    };
    const close = () => { findEl.remove(); findEl = null; $('btnFind').classList.remove('active'); };
    $('btnFind').classList.add('active');
    q.addEventListener('input', () => { findPos = -1; upd(); });
    q.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); go(ev.shiftKey ? -1 : 1); } if (ev.key === 'Escape') close(); if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'h') { ev.preventDefault(); findEl.classList.add('rep'); r.focus(); } });
    r.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Escape') close(); if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); one(); } });
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
        if (li.dataset.id === dragId) { dragId = null; return; }
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
  $('btnAddChart').onclick = (ev) => { ev.stopPropagation(); btnMenu(ev.currentTarget, CHART_KINDS.map(([k, n]) => ({ label: `<span class="mi-picto">${chartPicto(k)}</span>${n}`, fn: () => addChart(k) }))); };
  $('btnAddIcon').onclick = showIconPicker;
  $('btnAddMore').onclick = (ev) => {
    ev.stopPropagation();
    btnMenu(ev.currentTarget, [
      { label: '∑ 수식…', fn: () => openMathDialog(null) },
      { label: '▶ 동영상 · 웹 페이지 (주소)…', fn: () => openEmbedDialog(null) },
      { label: '🎞 동영상 파일…', fn: () => $('fileVideo').click() },
      { label: '📽 PPT 에서 영상 가져오기…', fn: () => showPptVideos() },
      { label: '🧩 PPT 에서 심벌·그림 가져오기…', fn: () => showPptSyms() },
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
  if (hubBus) hubBus.postMessage({ type: 'editing', name: S.name, tab: TAB }); // 같은 교안을 연 다른 탭이 있으면 서로 알림
  const dr0 = Draft.get(S.name);
  if (dr0 && JSON.stringify(dr0) !== JSON.stringify(S.deck)) {
    const newer = !!S.deck.modified && (!dr0.modified || S.deck.modified > dr0.modified); // 임시본을 만든 뒤에 다른 곳에서 저장됨
    if (confirm('저장하지 않은 임시 작업본이 있습니다. 불러올까요?' + (newer ? `\n\n주의: 저장된 교안이 이 임시본보다 나중(${when(S.deck.modified)})에 저장되었습니다 — 다른 기기에서 고친 것 같습니다.\n임시본을 불러와 저장하면 그 내용을 덮어쓰게 됩니다. 잘 모르겠으면 “취소”를 누르세요.` : ''))) { S.deck = dr0; S.base = dr0.modified || ''; migrate(S.deck); S.cur = clamp(S.cur, 0, S.deck.slides.length - 1); S.sel = []; S.ssel = [curSlide().id]; pushHistory(); renderAll(); markDirty(); }
    else Draft.clear(S.name);
  }
})();
