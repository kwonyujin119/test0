/* 한글 작업장 — 화면 · 단축키 · 대화상자 · 파일 */
(() => {
  const doc = docEl();
  const H = () => W.doc.header;
  const GUEST = Access.isGuest; // 보기 전용: 고치는 명령·단축키·끌기를 막고, 저장 API 는 access.js 가 막음
  const guestSay = () => toast('보기 전용(게스트) 모드입니다 — 고치려면 첫 화면에서 관리자로 입장하세요', 2600);
  const viewOnly = () => { if (!GUEST) return; doc.contentEditable = 'false'; doc.querySelectorAll('[contenteditable]').forEach(n => n.setAttribute('contenteditable', 'false')); };
  for (const id of ['roleChip', 'roleChip2']) { const n = $id(id); if (n) n.innerHTML = Access.chip(); }
  const escH = s => esc(s);
  /* 이 화면에서만 쓰는 선 아이콘 (common.js 에 이미 있으면 그것을 씀). 앞선 fillIcons 가 비워 둔 자리를 채움 */
  for (const [k, v] of Object.entries({ chevronDown: '<path d="m6 9 6 6 6-6"/>', chevronUp: '<path d="m6 15 6-6 6 6"/>' })) if (!ICONS[k]) ICONS[k] = v;
  document.querySelectorAll('[data-ic^="chevron"]').forEach(n => { n.innerHTML = icon(n.dataset.ic, 14); });

  /* ---------- 펼침 메뉴 (리본 [더 보기] · 정렬 · 표 줄/칸 · 첫 화면 ⋯) ----------
     items: [{ label, icon | glyph, kbd, danger, on, run } | null(구분선)]. 마우스로 열면 문서의 선택을 그대로 두고, 키보드로 열면 첫 항목에 초점 */
  let pop = null;
  function closePop(focusBack) {
    if (!pop) return false;
    const b = pop._btn; pop.remove(); pop = null; b.setAttribute('aria-expanded', 'false'); b.classList.remove('open');
    if (focusBack) b.focus();
    return true;
  }
  function popMenu(btn, items, opts) {
    opts = opts || {};
    const same = pop && pop._btn === btn; closePop(); if (same) return;
    const m = document.createElement('div'); m.className = 'menu hw-menu'; m.setAttribute('role', 'menu'); m._btn = btn;
    for (const it of items) {
      if (!it) { m.appendChild(document.createElement('hr')); continue; }
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mi' + (it.danger ? ' danger' : '') + (it.on ? ' on' : ''); b.setAttribute('role', 'menuitem');
      b.innerHTML = `${it.glyph ? `<span class="mi-g" aria-hidden="true">${it.glyph}</span>` : icon(it.icon || 'dots', 16)}<span class="mi-t">${escH(it.label)}</span>${it.kbd ? `<kbd>${escH(it.kbd)}</kbd>` : ''}`;
      b.addEventListener('mousedown', e => e.preventDefault()); // 문서의 선택을 잃지 않게
      b.onclick = () => { closePop(); it.run(); };
      m.appendChild(b);
    }
    m.addEventListener('keydown', e => {
      const list = Array.from(m.querySelectorAll('.mi')), i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = list.length; list[(i + (e.key === 'ArrowDown' ? 1 : n - 1) + (i < 0 && e.key === 'ArrowUp' ? 1 : 0)) % n].focus(); }
      else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); list[e.key === 'Home' ? 0 : list.length - 1].focus(); }
      else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); closePop(true); }
    });
    document.body.appendChild(m); pop = m; btn.setAttribute('aria-expanded', 'true'); btn.classList.add('open');
    const r = btn.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(opts.alignRight ? r.right - m.offsetWidth : r.left, innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top = (r.bottom + 4 + m.offsetHeight > innerHeight - 8 ? Math.max(8, r.top - 4 - m.offsetHeight) : r.bottom + 4) + 'px';
    if (opts.focus || opts.keyboard) { const f = m.querySelector('.mi'); if (f) f.focus(); }
  }
  document.addEventListener('pointerdown', e => { if (pop && !pop.contains(e.target) && !pop._btn.contains(e.target)) closePop(); }, true);
  window.addEventListener('resize', () => closePop());
  /* 단추를 마우스로 눌렀는지(detail>0) 키보드로 눌렀는지 */
  const viaKey = e => !!e && e.detail === 0;

  let savedRange = null;
  const keepSel = () => { const r = rng(); if (r && inDoc(r.startContainer)) savedRange = r.cloneRange(); };
  const backSel = () => { if (savedRange && savedRange.startContainer.isConnected) { const s = sel(); s.removeAllRanges(); s.addRange(savedRange); focusFor(savedRange.startContainer); } };

  /* ---------- 대화상자 ---------- */
  function dialog(title, body, opts) {
    opts = opts || {};
    keepSel();
    const bg = document.createElement('div'); bg.className = 'dlg-bg';
    bg.innerHTML = `<div class="dlg" role="dialog" style="${opts.width ? 'width:' + opts.width + 'px' : ''}"><h3>${title}</h3><div class="body">${body}</div><div class="foot">${opts.foot != null ? opts.foot : `<button class="tb" data-x="cancel">취소</button><button class="tb primary" data-x="ok">${opts.okText || '설정'}</button>`}</div></div>`;
    bg.querySelectorAll('input:not([type])').forEach(x => { x.type = 'text'; }); // 글 칸은 모두 같은 모양(ui.css 의 input[type=text])으로
    document.body.appendChild(bg);
    const q = s => bg.querySelector(s);
    const close = (restore) => { bg.remove(); document.removeEventListener('keydown', onKey, true); if (restore !== false) backSel(); if (opts.onClose) opts.onClose(); };
    let busy = false;
    const ok = async () => {
      if (busy) return; // 처리 중에 다시 누른 것은 무시 (두 번 실행 방지)
      if (opts.onOk) {
        busy = true; const btn = q('[data-x="ok"]'); if (btn) btn.disabled = true;
        let r; try { r = await opts.onOk(q, close); } finally { busy = false; if (btn) btn.disabled = false; }
        if (r === false) return;
      }
      close();
    };
    const onKey = e => {
      if (!bg.isConnected) return;
      const all = document.querySelectorAll('.dlg-bg'); if (all[all.length - 1] !== bg) return; // 겹친 창: 맨 위 창만
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'Enter' && !e.isComposing && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON' && !opts.noEnter) { e.preventDefault(); e.stopPropagation(); ok(); }
      else e.stopPropagation();
    };
    document.addEventListener('keydown', onKey, true);
    bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
    bg.addEventListener('click', e => { const x = e.target.closest('[data-x]'); if (!x) return; if (x.dataset.x === 'cancel') close(); if (x.dataset.x === 'ok') ok(); });
    const first = bg.querySelector('input:not([type=checkbox]):not([type=radio]),select,textarea'); if (first && !opts.noFocus) setTimeout(() => { first.focus(); if (first.select) first.select(); }, 0);
    if (opts.init) opts.init(q, close);
    return { q, close, bg };
  }
  const num = (q, s, d) => { const v = parseFloat(q(s).value); return isNaN(v) ? d : v; };
  /* 확인 · 글 입력 · 알림 — 브라우저 기본 창(confirm/prompt/alert) 대신 같은 모양의 창. desc 는 HTML */
  function askConfirm(title, desc, okText, danger) {
    return new Promise(res => { let v = false; dialog(escH(title), desc ? `<p class="dlg-desc">${desc}</p>` : '', { foot: `<button class="tb" data-x="cancel">취소</button><button class="tb ${danger ? 'danger solid' : 'primary'}" data-x="ok">${escH(okText || '확인')}</button>`, onOk: () => { v = true; }, onClose: () => res(v), noFocus: true, init: q => setTimeout(() => { const b = q('[data-x="ok"]'); if (b) b.focus(); }, 0) }); });
  }
  function askText(title, label, value, okText, desc) {
    return new Promise(res => { let v = null; dialog(escH(title), `${desc ? `<p class="dlg-desc">${desc}</p>` : ''}<div class="grid1"><label>${escH(label)}</label><input id="ak_v" value="${escH(value || '')}"></div>`, { okText: okText || '확인', onOk: q => { const t = q('#ak_v').value.trim(); if (!t) { q('#ak_v').focus(); return false; } v = t; }, onClose: () => res(v) }); });
  }
  function tell(title, desc) {
    return new Promise(res => dialog(escH(title), `<p class="dlg-desc">${escH(desc || '').replace(/\n/g, '<br>')}</p>`, { foot: `<button class="tb primary" data-x="ok">확인</button>`, onClose: () => res(true), noFocus: true, init: q => setTimeout(() => { const b = q('[data-x="ok"]'); if (b) b.focus(); }, 0) }));
  }

  /* ---------- 문서 열기/만들기 ---------- */
  function setName(n) { W.name = n || '새 문서'; $id('docNameT').textContent = W.name; document.title = W.name + ' — 한글 작업장'; }
  function loadDoc(d, meta) {
    meta = meta || {};
    clearCells(true); hidePic();
    W.doc = d; W.handle = meta.handle || null; W.boxId = meta.boxId || null; W.draftId = meta.draftId || ('d' + Date.now().toString(36));
    d.header.onAdd = (kind, id) => addRule(kind, id);
    rebuildCss();
    doc.replaceChildren(d.render());
    d.isClean = el => Track.clean(el); // 손대지 않은 문단은 원본 그대로 (바뀐 곳은 실시간 추적)
    Track.start();
    warm(d);
    UNDO.stack.length = 0; UNDO.redo.length = 0; UNDO.cur = null; UNDO.bytes = 0;
    setName(meta.name || d.title || '새 문서');
    W.dirty = !!meta.dirty; W.savedTime = meta.savedTime || null; updateState();
    fillStyles(); fillFonts();
    if (typeof HwpHome !== 'undefined') HwpHome.hide(); // home.js 의 const 는 window 에 붙지 않음
    document.body.classList.add('has-doc');
    viewOnly();
    setView(viewPref(), true);
    layout();
    if (!W.reflow) { const cw = $id('canvas').clientWidth, pw = d.page(0).w / HU; if (cw < pw + 60) setZoom('width'); else setZoom(1); }
    const first = doc.querySelector('.hsec > .hp'); if (first) { doc.focus({ preventScroll: true }); caretToStart(first); }
    $id('canvas').scrollTop = 0;
    if (meta.dirty) scheduleDraft();
  }
  function warm(d) { // 한가할 때 조금씩 저장 준비 (화면 반응을 막지 않음)
    const idle = window.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 8 }), 50));
    const step = dl => { if (W.doc !== d) return; if (!d.warmCache(() => dl.timeRemaining() < 2)) idle(step, { timeout: 2000 }); };
    idle(step, { timeout: 2000 });
  }
  async function openBytes(buf, meta) {
    try {
      if (buf.byteLength > 300000) { toast('문서를 여는 중…', 60000); await new Promise(r => setTimeout(r, 30)); } // 큰 문서: 멈춘 것처럼 보이지 않게
      const d = await HwpxDoc.open(buf); loadDoc(d, meta); toast(`"${meta.name}" 을(를) 열었습니다`); return true; }
    catch (e) { console.error(e); tell('문서를 열 수 없습니다', e.message); return false; }
  }
  async function openFile(file, handle) {
    if (!file) return;
    if (/\.hwp$/i.test(file.name)) { tell('.hwp(옛 형식) 파일은 바로 열 수 없습니다', '한글에서 [파일 → 다른 이름으로 저장 → 파일 형식: 한글 표준 문서(*.hwpx)] 로 저장한 뒤 그 파일을 열어 주세요.'); return; }
    if (!(await confirmDiscard())) return;
    const buf = await file.arrayBuffer();
    await openBytes(buf, { name: file.name.replace(/\.hwpx$/i, ''), handle, savedTime: handle ? file.lastModified : null });
  }
  async function confirmDiscard() {
    if (!W.doc || !W.dirty) return true;
    return askConfirm(`"${W.name}" 에 저장하지 않은 내용이 있습니다`, '그래도 다른 문서를 열까요? 지금 문서는 이 기기에 임시 저장되어, 첫 화면의 <b>저장 안 한 작업본</b>에서 다시 열 수 있습니다.', '다른 문서 열기');
  }
  async function newDoc() { if (!(await confirmDiscard())) return; loadDoc(HwpxDoc.blank(), { name: '새 문서' }); }
  async function openDialog() {
    const p = await HwpStore.pickOpen().catch(e => { tell('파일을 열지 못했습니다', e.message); return null; });
    if (p) await openFile(p.file, p.handle);
  }

  /* ---------- 저장 ---------- */
  let saving = false;
  let rev = 0; // 고친 횟수 — 저장하는 동안(문서함은 몇 초 걸림) 더 고친 내용이 있으면 '저장됨'으로 바꾸지 않음
  function savedAt(r0) { W.dirty = rev !== r0; W.savedTime = Date.now(); updateState(); if (W.dirty) scheduleDraft(); else HwpStore.drafts.del(W.draftId); }
  async function build() { tidyAll(); Track.flush(); return W.doc.save(doc); }
  function tidyAll() { for (const b of doc.querySelectorAll('.hp')) { const brs = b.querySelectorAll(':scope > br:not([data-lb])'); if (brs.length > 1) brs.forEach((x, i) => { if (i < brs.length - 1 && !x.nextSibling) x.remove(); }); } }
  const fileName = () => (W.name || '문서').replace(/[\\/:*?"<>|]/g, '_') + '.hwpx';
  /* 첫 화면 카드의 종이 미리보기에 쓸 글: 첫 문단 몇 개 */
  function preview() { const out = []; let n = 0; for (const p of doc.querySelectorAll('.hsec > .hp')) { const t = p.textContent.replace(/[\u200b\ufeff]/g, '').replace(/\s+/g, ' ').trim(); if (!t) continue; out.push(t); n += t.length; if (out.length >= 12 || n > 400) break; } return out.join('\n').slice(0, 400); }
  async function save(as) {
    if (!W.doc || saving) return;
    saving = true; setState('저장 중…');
    const r0 = rev;
    try {
      if (!as && W.boxId) { const blob = await build(); await boxRun(() => HwpStore.box.save(W.boxId, W.name, blob, deviceName(), preview())); done('문서함에 저장했습니다'); }
      else if (!as && W.handle) { const blob = await build(); await HwpStore.writeHandle(W.handle, blob); done('내 PC 파일에 저장했습니다'); }
      else if (as === 'box' || as === 'boxNew') { await boxSaveCurrent(await build(), r0, as === 'boxNew'); }
      else {
        // 저장 창을 먼저 열고(클릭 직후여야 브라우저가 막지 않음) 문서는 그다음 만듦 — 큰 문서도 창이 안 뜨는 일이 없게
        const h = await HwpStore.pickSaveHandle(fileName());
        if (h === false) { setState(''); updateState(); return; }
        const blob = await build();
        if (h) { await HwpStore.writeHandle(h, blob); W.handle = h; W.boxId = null; if (h.name) setName(h.name.replace(/\.hwpx$/i, '')); done('내 PC 에 저장했습니다'); }
        else { HwpStore.download(fileName(), blob); done('내려받기 폴더에 저장했습니다 (' + fileName() + ')'); }
      }
    } catch (e) { console.error(e); setState(''); updateState(); tell('저장하지 못했습니다', e.message); }
    finally { saving = false; }
    function done(msg) { savedAt(r0); toast(msg, 2600); }
  }
  function saveAsMenu() {
    dialog('다른 이름으로 저장', `<div class="grid1"><label>파일 이름</label><input id="sa_nm" value="${escH(W.name)}"></div>
      <div class="info" style="margin-top:12px">· <b>내 PC</b>: hwpx 파일로 저장합니다. 한글에서 바로 열립니다.<br>· <b>문서함</b>: 암호화해서 GitHub 문서함에 올립니다. 집·사무실 어디서나 엽니다.</div>`, {
      foot: `<button class="tb" data-x="cancel">취소</button><button class="tb" id="sa_box">${icon('lock', 15)}문서함에 저장</button><button class="tb primary" id="sa_pc">${icon('save', 15)}내 PC 에 저장</button>`,
      init: (q, close) => {
        const nm = () => { const v = q('#sa_nm').value.trim(); if (v) setName(v); };
        q('#sa_pc').onclick = () => { nm(); close(false); save('pc'); };
        q('#sa_box').onclick = () => { nm(); close(false); save('boxNew'); }; // 다른 이름으로: 문서함에 새 문서로 (원래 문서는 그대로)
      }, noEnter: true });
  }
  const deviceName = BestDocs.deviceName;
  function setState(t) { const s = $id('saveState'); s.className = 'state' + (t ? ' busy' : ''); s.textContent = t; delete s.dataset.v; } // 저장 중 알림 (휴대폰에서도 보임)
  /* 저장한 때: 오늘이면 '오후 3:12', 아니면 '11월 3일' */
  function savedClock(t) { const d = new Date(t), now = new Date(); return d.toDateString() === now.toDateString() ? d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : `${d.getMonth() + 1}월 ${d.getDate()}일`; }
  /* 머리 줄의 저장 상태: 깨끗하면 흐린 '저장됨 · 오후 3:12', 고친 뒤면 노란 점 + '저장 안 됨'. [저장] 단추는 고친 뒤에만 먹색(주 단추) */
  function updateState() {
    const s = $id('saveState'), where = W.boxId ? '문서함' : W.handle ? '내 PC 파일' : '';
    const v = W.dirty ? '<i class="mark-dot"></i>저장 안 됨' : W.savedTime ? '저장됨 · ' + escH(savedClock(W.savedTime)) : '';
    s.className = 'state' + (W.dirty ? ' dirty' : '');
    if (s.dataset.v !== v) { s.dataset.v = v; s.innerHTML = v; } // 읽어 주는 칸(role=status): 글자마다 다시 쓰지 않음
    s.title = W.dirty ? '저장하지 않은 내용이 있습니다 (이 기기에는 자동으로 임시 저장됨) — 저장 또는 Ctrl+S' : W.savedTime ? `${where ? where + '에 ' : ''}${new Date(W.savedTime).toLocaleString('ko-KR')} 저장` : '';
    $id('btnSave').classList.toggle('primary', !!(W.doc && W.dirty));
    $id('stSaved').textContent = W.doc ? (GUEST ? '보기 전용' : '저장 위치: ' + (where || (W.savedTime ? '내려받은 파일' : '아직 저장 안 함'))) : '';
  }
  window.onDocChanged = () => { rev++; if (!W.dirty) { W.dirty = true; } updateState(); scheduleDraft(); };
  let draftT = null, buildMs = 0;
  // 큰 문서는 저장 준비에 시간이 걸리므로 임시 저장 간격을 늘림 (입력이 끊기지 않게)
  function scheduleDraft() {
    clearTimeout(draftT);
    // 입력을 멈춘 뒤 한가할 때만 임시 저장 (큰 문서는 간격을 더 둠) — 타자 중에 멈칫하지 않게
    draftT = setTimeout(() => (window.requestIdleCallback || (f => setTimeout(f, 0)))(() => saveDraft(), { timeout: 4000 }), Math.max(3000, buildMs * 10));
  }
  let drafted = '', draftP = null; // drafted: 마지막으로 임시 저장한 문서·수정 차례
  async function saveDraft() {
    if (!W.doc || !W.dirty || saving) return;
    const d = W.doc, id = W.draftId, key = id + ':' + rev;
    try {
      const t = performance.now(); const blob = await build(); buildMs = performance.now() - t;
      // 만드는 사이에 저장을 마쳤거나(임시본을 지운 뒤 다시 남기지 않게) 다른 문서를 열었으면(그 문서 자리에 이 글을 쓰지 않게) 그만둠
      if (W.doc !== d || W.draftId !== id || !W.dirty || saving) return;
      await HwpStore.drafts.put(id, W.name, blob, { boxId: W.boxId, preview: preview() }); drafted = key;
    } catch (e) { console.warn('임시 저장 실패', e); }
  }
  /* 창을 닫거나 다른 앱으로 넘어갈 때(휴대폰은 닫기 전에 beforeunload 가 오지 않기도 함): 기다리지 않고 바로 임시 저장 시작 */
  function draftNow() {
    if (!W.doc || !W.dirty || drafted === W.draftId + ':' + rev) return;
    clearTimeout(draftT);
    if (!draftP) draftP = saveDraft().finally(() => { draftP = null; });
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') draftNow(); });
  window.addEventListener('pagehide', draftNow);
  window.addEventListener('beforeunload', e => { if (W.doc && W.dirty) { draftNow(); e.preventDefault(); e.returnValue = ''; } });

  /* ---------- 문서함 ---------- */
  async function boxSaveCurrent(blob, r0, asNew) {
    if (!(await boxEnsure())) { setState(''); updateState(); return; }
    const id = asNew ? null : W.boxId;
    W.boxId = await boxRun(() => HwpStore.box.save(id, W.name, blob, deviceName(), preview()));
    W.handle = null; savedAt(r0);
    toast('문서함에 저장했습니다 — 다른 PC 에서도 이 문서를 열 수 있습니다', 3000);
  }
  function connectDialog(opts) {
    opts = opts || {};
    return new Promise(res => {
      let done = false;
      const c = GH.cfg || GH.detect() || { owner: 'kwonyujin119', repo: 'test0', branch: 'main' };
      const linked = !!GH.token && !opts.expired; // 이미 연결됨 → 상태를 보여 주고, 토큰 칸은 바꿀 때만
      dialog(linked ? '문서함 연결 (GitHub) — 연결되어 있습니다' : '문서함 연결 (GitHub)', `${linked ? `<div class="info" style="margin-bottom:10px"><b>이 기기는 GitHub 저장소 ${escH(c.owner)}/${escH(c.repo)} 에 연결되어 있습니다.</b> 교안 작업장과 같은 연결입니다. 토큰을 바꿀 때만 아래에 새 토큰을 넣고 [바꾸기], 그대로 두려면 [취소].</div>` : ''}${opts.expired ? '<div class="warn" style="margin-bottom:10px"><b>GitHub 토큰의 사용 기간이 끝났거나 올바르지 않습니다.</b><br>새 토큰을 붙여넣고 <b>연결</b>을 누르면 하던 일을 이어서 합니다.</div>' : ''}<div class="info">문서함은 GitHub 저장소 <b>${escH(c.owner)}/${escH(c.repo)}</b> 의 <code>hwp/</code> 폴더에 <b>암호화된 파일</b>로 보관합니다. 토큰은 <b>이 기기에만</b> 기억되고 교안 작업장과 함께 씁니다 (교안 작업장에서 이미 연결했다면 같은 브라우저에서는 다시 할 필요가 없습니다).</div>
        <div class="grid1" style="margin-top:12px"><label>저장소</label><div style="display:flex;gap:6px;align-items:center"><input id="g_o" value="${escH(c.owner)}" aria-label="사용자"><span>/</span><input id="g_r" value="${escH(c.repo)}" aria-label="저장소"></div>
        <label for="g_t">토큰</label><input id="g_t" type="password" placeholder="${linked ? '바꿀 때만: 새 토큰 붙여넣기' : 'github_pat_… 붙여넣기'}" autocomplete="off"></div>
        <details class="howto"${opts.expired || !GH.token ? ' open' : ''}><summary>토큰 만드는 법</summary><ol>
          <li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a> 를 엽니다.</li>
          <li><b>Repository access</b> → <i>Only select repositories</i> → <b>${escH(c.repo)}</b></li>
          <li><b>Permissions</b> → <b>Contents</b> → <i>Read and write</i></li>
          <li><i>Generate token</i> 을 누르고 나온 문자열을 위 칸에 붙여넣습니다.</li>
        </ol>${opts.expired ? '<p>기간이 끝난 토큰은 <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener">토큰 목록</a>에서 그 토큰을 열고 <i>Regenerate token</i> 을 누르면 같은 권한으로 새 문자열을 받습니다.</p>' : ''}</details>`, {
        okText: linked ? '바꾸기' : '연결', noFocus: true, init: q => setTimeout(() => { if (!linked) q('#g_t').focus(); }, 0),
        onOk: async (q) => {
          const cfg = { owner: q('#g_o').value.trim(), repo: q('#g_r').value.trim(), branch: c.branch || 'main', token: q('#g_t').value.trim() };
          if (linked && !cfg.token && cfg.owner === c.owner && cfg.repo === c.repo) { done = true; res(true); return; } // 바꿀 토큰이 없으면 지금 연결 그대로
          if (!cfg.owner || !cfg.repo || !cfg.token) { toast(linked ? '바꾸려면 새 토큰을 붙여넣어 주세요' : '저장소와 토큰을 입력하세요', 2600); return false; }
          // 확인을 통과한 토큰만 이 기기에 기억 (틀린 토큰이 남아 '연결됨'으로 여겨지지 않게)
          const prev = GH.cfg; GH.cfg = cfg;
          try { const r = await GH.check(); if (!r.push) { GH.cfg = prev; tell('이 토큰으로는 저장소에 쓸 수 없습니다', 'Contents: Read and write 권한이 있는 토큰이 필요합니다.'); return false; } }
          catch (e) { GH.cfg = prev; tell('연결하지 못했습니다', e.message); return false; }
          GH.save(cfg);
          done = true; res(true);
        }, onClose: () => res(done || (!opts.expired && !!(GH.cfg && GH.token))) });
    });
  }
  /* 문서함 작업: 토큰이 만료되면(401) 연결 창을 바로 다시 띄우고, 연결되면 같은 일을 한 번 더 시도 */
  async function gh401(fn) {
    try { return await fn(); }
    catch (e) {
      if (e.status !== 401) throw e;
      if (!(await connectDialog({ expired: true }))) throw e;
      return fn();
    }
  }
  /* 문서함 작업: 토큰 만료면 다시 연결, 기억해 둔 암호 키가 맞지 않으면 암호를 다시 물어 한 번 더 */
  async function boxRun(fn) {
    try { return await gh401(fn); }
    catch (e) {
      if (!e.badPass) throw e;
      toast('문서함 암호를 다시 입력해 주세요', 2500);
      if (!(await boxEnsure())) throw new Error('문서함 암호를 입력하지 않아 멈췄습니다');
      return gh401(fn);
    }
  }
  async function boxEnsure() {
    if (!HwpStore.box.ready()) { if (!(await connectDialog())) return false; }
    if (HwpStore.box.unlocked || await HwpStore.box.restoreKey()) return true;
    let exists = false; try { exists = await gh401(() => HwpStore.box.exists()); } catch (e) { tell('문서함을 확인하지 못했습니다', e.message); return false; }
    return new Promise(res => {
      dialog(exists ? '문서함 열기' : '문서함 만들기', `${exists ? '<p style="margin-top:0">문서함 암호를 입력하세요.</p>' : `<div class="warn">처음 한 번 문서함 암호를 정합니다. 문서는 이 암호로 <b>브라우저 안에서 암호화</b>된 뒤 올라가므로, 저장소가 공개여도 내용과 파일 이름은 보이지 않습니다.<br><b>암호를 잊으면 누구도(저도) 문서를 되살릴 수 없습니다.</b> 꼭 기억해 두세요.</div>`}
        <div class="grid1" style="margin-top:12px"><label>암호</label><input id="b_p" type="password" autocomplete="off">${exists ? '' : '<label>암호 확인</label><input id="b_p2" type="password" autocomplete="off">'}</div>
        <label class="chk" style="display:flex;gap:6px;margin-top:10px"><input type="checkbox" id="b_rm" checked> 이 기기에서 암호 기억하기 (개인 PC 에서만)</label>`, {
        okText: exists ? '열기' : '만들기',
        onOk: async (q) => {
          const p = q('#b_p').value;
          if (p.length < 6) { toast('암호는 6자 이상으로 해 주세요', 2400); return false; }
          if (!exists && p !== q('#b_p2').value) { toast('두 암호가 다릅니다', 2400); return false; }
          try { await gh401(() => HwpStore.box.unlock(p, q('#b_rm').checked)); } catch (e) { toast(e.message, 3200); return false; }
          res(true);
        }, onClose: () => res(HwpStore.box.unlocked) });
    });
  }
  /* ---------- best 문서 (레퍼런스) ---------- */
  const fmtKB = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  /* GitHub 모드: 문서함 암호를 먼저 연다 (같은 암호로 잠가 올리므로) */
  async function bestReady() {
    await BestDocs.init();
    if (BestDocs.mode() !== 'github') return true;
    if (GUEST) return false;
    return boxEnsure();
  }
  async function bestOpen(it, asNew) {
    if (!(await confirmDiscard())) return;
    toast('레퍼런스를 여는 중…', 20000);
    const u = await BestDocs.file(it.id);
    await openBytes(u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength), { name: asNew ? '새 문서 — ' + it.name + ' 기반' : it.name, dirty: !!asNew });
    if (asNew) toast('레퍼런스를 바탕으로 새 문서를 열었습니다 — 고친 뒤 [다른 이름으로] 저장하세요', 3200);
  }
  function bestStructDialog(rec) {
    const m = rec.meta || {};
    const pg = m.page ? `${Math.round(m.page.w / MM)}×${Math.round(m.page.h / MM)}mm${m.page.land ? ' 가로' : ''} · 여백 위 ${Math.round(m.page.top / MM)} 아래 ${Math.round(m.page.bottom / MM)} 왼 ${Math.round(m.page.left / MM)} 오른 ${Math.round(m.page.right / MM)}` : '';
    const rows = (rec.struct || []).slice(0, 400).map(x => x.t === 'table' ? `<div><small>표 ${x.rows.length}×${(x.rows[0] || []).length}</small><em class="tbl">${escH((x.rows[0] || []).join(' | ').slice(0, 90))}</em></div>`
      : `<div class="${x.level != null ? 'lv' + Math.min(3, x.level) : ''}"><small>${escH(x.st)}${x.size ? ' ' + x.size + 'pt' : ''}${x.bold ? ' 진하게' : ''}</small><span>${escH(x.text.slice(0, 140))}</span></div>`).join('');
    dialog(icon('list', 16) + escH(rec.name) + ' — 구조', `<div class="best-struct">
      <div class="kv"><span>용지</span><span>${escH(pg)}</span><span>글자 수</span><span>${(m.chars || 0).toLocaleString()}자 · 문단 ${m.paras || 0} · 표 ${m.tables || 0} · 그림 ${m.images || 0}</span>
      <span>글꼴</span><span>${escH((m.fonts || []).join(', ') || '—')}</span><span>스타일</span><span>${escH((m.styles || []).map(x => x.name + '(' + x.count + ')').join(', ') || '—')}</span>
      ${rec.note ? `<span>메모</span><span>${escH(rec.note)}</span>` : ''}${rec.tags && rec.tags.length ? `<span>꼬리표</span><span>${rec.tags.map(t => '<span class="tag">' + escH(t) + '</span>').join(' ')}</span>` : ''}</div>
      <div class="ol">${rows || '<div><span class="muted">뽑힌 구조가 없습니다</span></div>'}</div>
      ${(rec.struct || []).length > 400 ? '<p class="muted" style="margin:6px 0 0;font-size:12px">앞 400개 항목만 보입니다.</p>' : ''}</div>`, {
      width: 760, noEnter: true,
      foot: `<button class="tb" id="bs_copy">본문 글 복사</button><span class="grow"></span><button class="tb primary" data-x="cancel">닫기</button>`,
      init: q => { q('#bs_copy').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(rec.text || '') : Promise.reject()).then(() => toast('본문 글을 복사했습니다'), () => toast('복사하지 못했습니다')); }; },
    });
  }
  function bestEditDialog(it, after) {
    dialog('best 문서 정보', `<div class="grid1"><label>이름</label><input id="be_nm" value="${escH(it.name)}"><label>메모</label><input id="be_note" value="${escH(it.note || '')}" placeholder="어떤 점이 좋은 문서인지 (예: 공문 서식, 표 정리 깔끔)"><label>꼬리표</label><input id="be_tags" value="${escH((it.tags || []).join(', '))}" placeholder="쉼표로 구분 (예: 공문, 보고서)"></div>`, {
      okText: '저장', onOk: async q => { try { await BestDocs.update(it.id, { name: q('#be_nm').value, note: q('#be_note').value, tags: q('#be_tags').value.split(/[,，]/) }); toast('고쳤습니다'); after(); } catch (e) { tell('고치지 못했습니다', e.message); return false; } } });
  }
  async function bestUpload(files, after) {
    files = Array.from(files || []).filter(f => /\.hwpx$/i.test(f.name));
    if (!files.length) { toast('.hwpx 파일을 골라 주세요'); return; }
    if (!(await bestReady())) return;
    let note = '', tags = [];
    const meta = await new Promise(res => dialog(icon('bookmark', 16) + 'best 문서 올리기', `<p style="margin:0 0 10px">${files.length === 1 ? `<b>${escH(files[0].name)}</b>` : `${files.length}개 파일`} 을(를) 레퍼런스로 올립니다. 본문 글과 구조(스타일·글꼴·표)를 함께 뽑아 저장합니다.</p>
      <div class="grid1"><label>메모</label><input id="bu_note" placeholder="어떤 점이 좋은 문서인지 (예: 공문 서식, 표 정리 깔끔)"><label>꼬리표</label><input id="bu_tags" placeholder="쉼표로 구분 (예: 공문, 보고서)"></div>
      <div class="info" style="margin-top:12px">저장 위치: <b>${escH(BestDocs.MODE_NAMES[BestDocs.mode()])}</b>${BestDocs.mode() === 'github' ? ' — 문서함과 같은 암호로 잠가 올립니다' : BestDocs.mode() === 'local' ? ' — 내 PC 서버(start.cmd)나 GitHub 연결이 없어 이 브라우저에만 남습니다' : ''}</div>`, {
      okText: '올리기', onOk: q => { res({ note: q('#bu_note').value, tags: q('#bu_tags').value.split(/[,，]/) }); }, onClose: () => res(null) }));
    if (!meta) return;
    let n = 0;
    for (const f of files) {
      try { await BestDocs.add(f, { note: meta.note, tags: meta.tags, progress: m => toast(f.name + ' — ' + m, 20000) }); n++; }
      catch (e) { console.error(e); await tell(`"${f.name}" 을(를) 올리지 못했습니다`, e.message); }
    }
    if (n) toast(`best 문서 ${n}개를 올렸습니다`, 2600);
    after();
  }
  /* ---------- 리본 상태 ---------- */
  function fillStyles() {
    const s = $id('selStyle'); const list = H().styles.filter(x => x.type !== 'CHAR');
    s.innerHTML = list.map(x => `<option value="${escH(x.id)}">${escH(x.name || x.eng)}</option>`).join('');
  }
  function fillFonts() { const all = Array.from(new Set(H().allFaces().concat(FONTS.map(f => f.face), PC_FONTS))).filter(Boolean); $id('fontList').innerHTML = all.map(f => `<option value="${escH(f)}">`).join(''); }
  /* 글꼴 목록 (▾): 무료 웹 글꼴은 그 모양 그대로 미리 보여 주고, 고르면 어느 PC 에서나 같은 모양으로 보임 */
  function openFontPanel() {
    if (!W.doc) return;
    keepSel();
    const p = $id('fontPanel'); const r = $id('inFont').getBoundingClientRect();
    p.style.left = Math.min(r.left, innerWidth - 330) + 'px'; p.style.top = (r.bottom + 4) + 'px'; p.hidden = false;
    $id('fontQ').value = ''; drawFonts(''); setTimeout(() => $id('fontQ').focus(), 0);
    $id('btnFont').classList.add('on');
  }
  function drawFonts(q) {
    const cur = $id('inFont').value; const k = q.trim().toLowerCase();
    const hit = n => !k || n.toLowerCase().includes(k);
    const item = (face, label, css, note) => `<button type="button" data-face="${escH(face)}" class="${face === cur ? 'on' : ''}" style="font-family:${escH(css)}">${escH(label)}<span>${escH(note || '')}</span></button>`;
    let h = '';
    const docFaces = H().allFaces().filter(f => hit(f));
    if (docFaces.length) h += `<h5>이 문서에 쓰인 글꼴</h5>` + docFaces.map(f => item(f, f, fontStack([f]), findFontByFace(f) ? '웹 글꼴' : 'PC 글꼴')).join('');
    for (const [cat, cname] of FONT_CATS) {
      const list = FONTS.filter(f => f.cat === cat && (hit(f.name) || hit(f.face)));
      if (!list.length) continue;
      list.forEach(f => loadFontPreview(f));
      h += `<h5>${cname} <small>· 어느 PC 에서나 같은 모양</small></h5>` + list.map(f => item(f.face, f.name, f.css, f.face !== f.name ? f.face : '')).join('');
    }
    const pcs = PC_FONTS.filter(hit);
    if (pcs.length) h += `<h5>PC 글꼴 <small>· 설치된 PC 에서만 그 모양</small></h5>` + pcs.map(f => item(f, f, fontStack([f]), '')).join('');
    if (k && !FONTS.some(f => hit(f.name) || hit(f.face)) && !pcs.length && !docFaces.length) h += `<h5>그 밖의 글꼴</h5>` + item(q.trim(), q.trim() + ' (이 이름 그대로)', fontStack([q.trim()]), 'PC 글꼴');
    $id('fontItems').innerHTML = h;
  }
  const closeFontPanel = () => { $id('fontPanel').hidden = true; $id('btnFont').classList.remove('on'); };
  $id('btnFont').addEventListener('mousedown', e => { e.preventDefault(); keepSel(); });
  $id('btnFont').addEventListener('click', () => { if ($id('fontPanel').hidden) openFontPanel(); else closeFontPanel(); });
  $id('fontQ').addEventListener('input', e => drawFonts(e.target.value));
  $id('fontQ').addEventListener('keydown', e => { if (e.key === 'Escape') { closeFontPanel(); backSel(); } if (e.key === 'Enter' && !e.isComposing) { const b = $id('fontItems').querySelector('button'); if (b) b.click(); } });
  $id('fontItems').addEventListener('mousedown', e => e.preventDefault());
  $id('fontItems').addEventListener('click', e => { const b = e.target.closest('[data-face]'); if (!b) return; closeFontPanel(); $id('inFont').value = b.dataset.face; backSel(); applyCp({ face: b.dataset.face }); });
  document.addEventListener('mousedown', e => { if (!$id('fontPanel').hidden && !e.target.closest('#fontPanel,#btnFont')) closeFontPanel(); });
  // 웹 글꼴을 다 받으면 글자 폭이 바뀌므로 쪽 나누기 다시 계산
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { if (W.doc) { Track.full = true; changed(true); } });
  const LS_OPTS = [100, 115, 130, 150, 160, 180, 200, 250, 300];
  $id('selLs').innerHTML = LS_OPTS.map(v => `<option value="${v}">${v}%</option>`).join('');
  let raf = 0;
  let ribT = 0;
  window.onSelChange = () => { clearTimeout(ribT); ribT = setTimeout(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(refreshRibbon); }, 60); };
  function refreshRibbon() {
    if (!W.doc) return;
    const r = rng(); const inside = W.cells || (r && inDoc(r.startContainer));
    if (!inside) return;
    const c = H().cp(selCp()); const p = H().pp(selPp());
    if (document.activeElement !== $id('inFont')) $id('inFont').value = c.faceH || c.faceL || '';
    if (document.activeElement !== $id('inSize')) $id('inSize').value = +(c.height / 100).toFixed(1);
    const on = (a, v) => { const b = document.querySelector(`#ribbon [data-act="${a}"]`); if (b) b.classList.toggle('on', !!v); };
    on('bold', c.bold); on('italic', c.italic); on('underline', c.underline); on('strike', c.strike); on('sup', c.sup); on('sub', c.sub);
    paintAlign(p.align);
    on('outline', p.heading === 'OUTLINE' || p.heading === 'NUMBER'); on('bullet', p.heading === 'BULLET');
    document.querySelector('.clr span').style.setProperty('--sw', hexColor(c.color) || '#000');
    const ls = $id('selLs'); if (p.lsType === 'PERCENT') { if (!LS_OPTS.includes(p.ls)) { if (!ls.querySelector(`option[value="${p.ls}"]`)) ls.insertAdjacentHTML('beforeend', `<option value="${p.ls}">${p.ls}%</option>`); } ls.value = p.ls; }
    const b = r && blockOf(r.startContainer); const st = W.cells ? null : b && b.dataset.st;
    if (st != null && document.activeElement !== $id('selStyle')) $id('selStyle').value = st;
    const td = W.cells ? W.cells.values().next().value : r && cellOf(r.startContainer);
    $id('tableBar').hidden = !td;
    if (td) $id('selVa').value = td.style.verticalAlign || 'top';
    status();
  }
  function status() {
    if (!W.doc) return;
    const n = W.pages.length || 1; const p = Math.min(n, caretPage() + 1);
    $id('stPage').textContent = `${p}/${n} 쪽`;
    const secs = W.doc.sections.length; $id('stSec').textContent = secs > 1 ? `구역 ${(W.pages[p - 1] || {}).si + 1 || 1}/${secs}` : '';
  }
  window.onLayout = () => { status(); clearTimeout(status._c); status._c = setTimeout(() => { $id('stChars').textContent = (doc.textContent || '').replace(/\s/g, '').length.toLocaleString() + '자'; }, 1500); if (W.selPic) placePicHandle(); };
  document.addEventListener('selectionchange', () => { if (!W.doc) return; window.onSelChange(); });

  /* ---------- 리본 입력 ---------- */
  const ribbon = $id('top');
  ribbon.addEventListener('mousedown', e => { if (e.target.closest('button,.clr')) { keepSel(); if (!e.target.closest('.clr')) e.preventDefault(); } });
  ribbon.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });
  $id('status').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });
  for (const id of ['selStyle', 'inFont', 'inSize', 'selLs', 'selVa']) $id(id).addEventListener('focus', keepSel);
  $id('selStyle').addEventListener('change', e => { backSel(); applyStyle(e.target.value); });
  const fontApply = () => { const v = $id('inFont').value.trim(); if (!v) return; backSel(); applyCp({ face: v }); };
  $id('inFont').addEventListener('change', fontApply);
  $id('inFont').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); fontApply(); } if (e.key === 'Escape') backSel(); });
  const sizeApply = () => { const v = parseFloat($id('inSize').value); if (!(v > 0)) return; backSel(); applyCp({ height: Math.round(v * 100) }); };
  $id('inSize').addEventListener('change', sizeApply);
  $id('inSize').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); sizeApply(); } if (e.key === 'Escape') backSel(); });
  $id('selLs').addEventListener('change', e => { backSel(); applyPp({ lsType: 'PERCENT', ls: +e.target.value }); });
  $id('selVa').addEventListener('change', e => { backSel(); cellAlign(curCells(), e.target.value); });
  $id('inColor').addEventListener('input', e => { e.target.parentElement.querySelector('span').style.setProperty('--sw', e.target.value); });
  $id('inColor').addEventListener('change', e => { backSel(); applyCp({ color: e.target.value.toUpperCase() }); });
  $id('inShade').addEventListener('change', e => { backSel(); applyCp({ shade: e.target.value.toUpperCase() }); });
  $id('inShade').addEventListener('input', e => { e.target.parentElement.querySelector('span').style.setProperty('--sw', e.target.value); });
  $id('inCellFill').addEventListener('change', e => { backSel(); cellFill(curCells(), e.target.value.toUpperCase()); });
  $id('selZoom').addEventListener('change', e => setZoom(e.target.value));
  $id('docName').addEventListener('click', async () => { const n = await askText('문서 이름', '이름', W.name, '바꾸기'); if (n && n !== W.name) { setName(n); if (W.doc) window.onDocChanged(); } }); // 이름 바꾸기도 고친 횟수에 넣음 (저장 중에 바꾸면 '저장 안 됨' 유지)

  /* ---------- 정렬 (펼침 단추 하나에 다섯 가지) ---------- */
  const dKey = () => (window.PWA && PWA.standalone ? 'Ctrl+Shift+T' : 'Ctrl+Alt+T');
  const ALIGNS = [['alJ', '양쪽 정렬', 'textJ', 'Ctrl+Shift+M', 'JUSTIFY'], ['alL', '왼쪽 정렬', 'textL', 'Ctrl+Shift+L', 'LEFT'], ['alC', '가운데 정렬', 'textC', 'Ctrl+Shift+C', 'CENTER'], ['alR', '오른쪽 정렬', 'textR', 'Ctrl+Shift+R', 'RIGHT'], ['alD', '배분 정렬', 'textD', '', 'DISTRIBUTE']];
  let curAlign = '';
  function paintAlign(al) {
    al = /DISTRIBUTE/.test(al || '') ? 'DISTRIBUTE' : (al || 'JUSTIFY'); if (al === curAlign) return; curAlign = al;
    const x = ALIGNS.find(a => a[4] === al) || ALIGNS[0], b = $id('btnAlign');
    b.firstElementChild.innerHTML = icon(x[2]); b.title = '문단 정렬 — ' + x[1];
  }
  const alignItems = () => ALIGNS.map(([a, label, ic, kbd, v]) => ({ label, icon: ic, kbd: kbd || dKey(), on: curAlign === v, run: () => act(a) }));
  $id('btnAlign').addEventListener('click', e => popMenu(e.currentTarget, alignItems(), { keyboard: viaKey(e) }));

  /* ---------- 리본이 모자랄 때: 뒤 묶음부터 [더 보기] 메뉴로 ---------- */
  const gly = (t, label, kbd) => ({ glyph: t, label, kbd });
  const GRP_MENU = {
    char: [['bold', gly('<b>가</b>', '진하게', 'Ctrl+B')], ['italic', gly('<i>가</i>', '기울임', 'Ctrl+I')], ['underline', gly('<u>가</u>', '밑줄', 'Ctrl+U')], ['strike', gly('<s>가</s>', '취소선')], ['sup', gly('x²', '위 첨자')], ['sub', gly('x₂', '아래 첨자')], ['shadeNone', { icon: 'x', label: '형광펜 지우기' }], ['charDlg', { icon: 'type', label: '글자 모양 · 색 · 형광펜…', kbd: 'Alt+L' }]],
    para: [['indentL', { icon: 'indentL', label: '왼쪽 여백 줄이기' }], ['indentR', { icon: 'indentR', label: '왼쪽 여백 늘리기' }], ['outline', { icon: 'listNum', label: '개요 번호' }], ['bullet', { icon: 'list', label: '글머리표' }], ['paraDlg', { icon: 'paragraph', label: '문단 모양 · 줄 간격…', kbd: 'Alt+T' }]],
    insert: [['table', { icon: 'table', label: '표 만들기', kbd: 'Ctrl+N, T' }], ['image', { icon: 'image', label: '그림 넣기', kbd: 'Ctrl+N, I' }], ['pageBreak', { icon: 'pageBreak', label: '쪽 나누기', kbd: 'Ctrl+Enter' }], ['symbol', { icon: 'symbol', label: '문자표', kbd: 'Ctrl+F10' }]],
    page: [['pageDlg', { icon: 'ruler', label: '편집 용지', kbd: 'F7' }], ['pageNum', { icon: 'hash', label: '쪽 번호 매기기', kbd: 'Ctrl+N, P' }], ['headFoot', { icon: 'layout', label: '머리말/꼬리말', kbd: 'Ctrl+N, H' }]],
    find: [['find', { icon: 'search', label: '찾기', kbd: 'Ctrl+F' }], ['replace', { icon: 'search', label: '찾아 바꾸기', kbd: 'Ctrl+H' }]],
  };
  const rib = $id('ribbon'), ribMore = $id('btnRibMore'), ribGroups = Array.from(rib.querySelectorAll(':scope > .grp'));
  function ribbonFit() {
    if (!rib.offsetParent) return; // 게스트: 리본이 없음
    closePop();
    const over = () => rib.scrollWidth > rib.clientWidth + 1;
    ribGroups.forEach(x => { x.hidden = false; }); ribMore.hidden = true; rib.classList.remove('compact');
    if (!over()) return;
    rib.classList.add('compact'); // 먼저 글자 이름을 빼 보고 (아이콘만, 이름은 가리키면 보임)
    if (!over()) return;
    ribMore.hidden = false;
    for (let i = ribGroups.length - 1; i > 0 && over(); i--) ribGroups[i].hidden = true; // 첫 묶음(스타일·글꼴·크기)은 늘 보임
    for (const g of ribGroups) if (g.hidden) { g.hidden = false; if (over()) g.hidden = true; } // 남은 자리에 들어가는 뒤 묶음(표·그림 · 찾기 …)은 다시 꺼냄
  }
  let fitRaf = 0; const fitSoon = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(ribbonFit); };
  window.addEventListener('resize', fitSoon);
  if (document.fonts) document.fonts.ready.then(fitSoon);
  fitSoon();
  ribMore.addEventListener('click', e => {
    const items = [];
    for (const grp of ribGroups) {
      if (!grp.hidden) continue;
      const k = grp.dataset.grp; if (items.length) items.push(null);
      if (k === 'para') items.push(...alignItems());
      for (const [a, it] of GRP_MENU[k] || []) { const b = rib.querySelector(`[data-act="${a}"]`); items.push(Object.assign({ on: !!(b && b.classList.contains('on')), run: () => act(a) }, it)); }
    }
    popMenu(e.currentTarget, items, { alignRight: true, keyboard: viaKey(e) });
  });

  /* ---------- 휴대폰 머리 줄: 열기 · 저장 · 인쇄만 두고 나머지는 ⋯ 메뉴 ---------- */
  $id('btnBar1More').addEventListener('click', e => {
    const dark = UiTheme.get() === 'dark';
    const items = (GUEST ? [] : [{ icon: 'filePlus', label: '새 문서', kbd: 'Alt+N', run: () => act('new') }, { icon: 'export', label: '다른 이름으로 저장', kbd: 'Alt+V', run: () => act('saveAs') }, { icon: 'lock', label: '문서함', run: () => act('box') }])
      .concat([{ icon: 'bookmark', label: 'best 문서', run: () => act('best') }, null, { icon: 'help', label: '단축키 모음', kbd: 'F1', run: () => act('help') }, { icon: dark ? 'sun' : 'moon', label: dark ? '화면을 밝게' : '화면을 어둡게', run: () => UiTheme.set(dark ? 'light' : 'dark') }]);
    popMenu(e.currentTarget, items, { alignRight: true, keyboard: viaKey(e) });
  });

  /* ---------- 표 줄: 줄·칸 추가 / 지우기 ---------- */
  $id('btnTblAdd').addEventListener('click', e => popMenu(e.currentTarget, [
    { icon: 'plus', label: '위에 줄 추가', run: () => act('rowAbove') }, { icon: 'plus', label: '아래에 줄 추가', kbd: 'Ctrl+Enter', run: () => act('rowBelow') },
    { icon: 'plus', label: '왼쪽에 칸 추가', run: () => act('colLeft') }, { icon: 'plus', label: '오른쪽에 칸 추가', run: () => act('colRight') },
    null, { icon: 'table', label: '여러 줄·칸 추가…', kbd: 'Alt+Insert', run: () => rowColDialog(true) }], { keyboard: viaKey(e) }));
  $id('btnTblDel').addEventListener('click', e => popMenu(e.currentTarget, [
    { icon: 'minus', label: '줄 지우기', kbd: 'Alt+Delete', danger: true, run: () => act('rowDel') }, { icon: 'minus', label: '칸 지우기', danger: true, run: () => act('colDel') },
    null, { icon: 'trash', label: '표 지우기', danger: true, run: () => act('tableDel') }], { keyboard: viaKey(e) }));

  function curCells() {
    if (W.cells && W.cells.size) return Array.from(W.cells);
    const r = savedRange || rng(); const td = r && cellOf(r.startContainer); return td ? [td] : [];
  }
  function needDoc() { if (!W.doc) { toast('먼저 문서를 새로 만들거나 여세요'); return false; } return true; }

  /* ---------- 명령 ---------- */
  const ALIGN = { alJ: 'JUSTIFY', alL: 'LEFT', alC: 'CENTER', alR: 'RIGHT', alD: 'DISTRIBUTE' };
  const GUEST_OK = /^(home|open|help|best|print|find|replace|zoomIn|zoomOut)$/;
  function act(a) {
    if (GUEST && !GUEST_OK.test(a)) { guestSay(); return; }
    if (a === 'home') return HwpHome.show();
    if (a === 'new') return newDoc();
    if (a === 'open') return openDialog();
    if (a === 'box') return HwpHome.show('box');
    if (a === 'best') return HwpHome.show('best');
    if (a === 'help') return helpDialog();
    if (!needDoc()) return;
    if (ALIGN[a]) { backSel(); return applyPp({ align: ALIGN[a] }); }
    switch (a) {
      case 'save': return save();
      case 'saveAs': return saveAsMenu();
      case 'print': return doPrint();
      case 'bold': case 'italic': case 'underline': case 'strike': case 'sup': case 'sub': backSel(); return toggleCp(a);
      case 'shadeNone': backSel(); return applyCp({ shade: 'none' });
      case 'indentL': backSel(); return stepPp(p => ({ left: Math.max(0, p.left - 1000) }));
      case 'indentR': backSel(); return stepPp(p => ({ left: p.left + 1000 }));
      case 'outline': backSel(); return toggleHeading('OUTLINE');
      case 'bullet': backSel(); return toggleHeading('BULLET');
      case 'charDlg': return charDialog();
      case 'paraDlg': return paraDialog();
      case 'table': return tableDialog();
      case 'image': return pickImage();
      case 'pageBreak': backSel(); return splitBlock({ pageBreak: true });
      case 'symbol': return symbolDialog();
      case 'find': return openFind(false);
      case 'replace': return openFind(true);
      case 'pageDlg': return pageDialog();
      case 'pageNum': return pageNumDialog();
      case 'headFoot': return headFootDialog();
      case 'styleDlg': return styleDialog();
      case 'rowAbove': case 'rowBelow': case 'colLeft': case 'colRight': case 'rowDel': case 'colDel': case 'merge': case 'split': case 'eqW': case 'eqH': case 'cellFillNone': case 'cellDlg': case 'tableDel': case 'cellPick': return tableAct(a);
      case 'zoomIn': return setZoom(Math.min(4, +(W.zoom + 0.1).toFixed(2)));
      case 'zoomOut': return setZoom(Math.max(0.3, +(W.zoom - 0.1).toFixed(2)));
    }
  }
  function tableAct(a) {
    if (a === 'cellPick') { W.cellPick = !W.cellPick; W.cellPickAnchor = null; $id('btnCellPick').classList.toggle('on', W.cellPick); toast(W.cellPick ? '셀을 차례로 누르면 블록으로 잡힙니다 (다시 누르면 끔)' : '셀 선택을 껐습니다', 1800); return; }
    const cells = curCells(); if (!cells.length) { toast('표 안을 먼저 클릭하세요'); return; }
    const td = cells[0];
    switch (a) {
      case 'rowAbove': return insertRow(td, false);
      case 'rowBelow': return insertRow(cells[cells.length - 1], true);
      case 'colLeft': return insertCol(td, false);
      case 'colRight': return insertCol(cells[cells.length - 1], true);
      case 'rowDel': clearCells(); return deleteRow(td);
      case 'colDel': clearCells(); return deleteCol(td);
      case 'merge': return mergeCells(cells);
      case 'split': clearCells(); return splitCell(td);
      case 'eqW': return equalizeCells(cells, 'w');
      case 'eqH': return equalizeCells(cells, 'h');
      case 'cellFillNone': return cellFill(cells, null);
      case 'cellDlg': return cellDialog(cells);
      case 'tableDel': askConfirm('이 표를 지울까요?', '표 안의 글도 함께 지워집니다.', '표 지우기', true).then(ok => { if (ok) deleteTable(td.closest('table.htb')); }); return;
    }
  }
  function toggleHeading(type) {
    const p = H().pp(selPp());
    if (type === 'OUTLINE') { if (p.heading === 'OUTLINE' || p.heading === 'NUMBER') applyPp({ heading: { type: 'NONE', idRef: 0, level: 0 } }); else applyPp({ heading: { type: 'OUTLINE', idRef: 0, level: 0 } }); }
    else { if (p.heading === 'BULLET') applyPp({ heading: { type: 'NONE', idRef: 0, level: 0 } }); else { const id = ensureBullet(); applyPp({ heading: { type: 'BULLET', idRef: id, level: 0 } }); } }
  }
  function ensureBullet() {
    const h = H(); if (h.bullet.size) return h.bullet.keys().next().value;
    const rl = h.refList; let box = xkid(rl, 'bullets');
    if (!box) { box = h.doc.createElementNS(HNS.hh, 'hh:bullets'); box.setAttribute('itemCnt', '0'); rl.insertBefore(box, xkid(rl, 'paraProperties')); }
    const el = xfrag(`<hh:bullet xmlns:hh="${HNS.hh}" id="1" char="●" useImage="0"><hh:paraHead level="0" align="LEFT" useInstWidth="0" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="DIGIT" charPrIDRef="4294967295" checkable="0"/></hh:bullet>`, '글머리표', h.doc);
    box.appendChild(el); box.setAttribute('itemCnt', '1'); h.bullet.set('1', el); h._hcache = null;
    return '1';
  }

  /* ---------- 보기: 쪽 보기 / 화면 맞춤 보기 ---------- */
  function viewPref() { let v = null; try { v = localStorage.getItem('hwp:view'); } catch (e) { } return v || (innerWidth < 760 ? 'reflow' : 'page'); }
  function setView(v, quiet) {
    W.reflow = v === 'reflow';
    document.body.classList.toggle('reflow', W.reflow);
    $id('btnView').innerHTML = W.reflow ? icon('phone', 14) + '<span>화면 맞춤</span>' : icon('page', 14) + '<span>쪽 보기</span>';
    if (!quiet) { try { localStorage.setItem('hwp:view', v); } catch (e) { } }
    // 화면 맞춤 보기는 확대/축소 없이 1배로 그림 → 쪽 보기의 배율은 기억해 두었다가 돌아올 때 되살림 (끌기·내어쓰기 계산이 배율로 나뉘지 않게)
    if (W.reflow) { if (W.zoom !== 1) { W.pageZoom = W.zoom; W.zoom = 1; applyZoom(); } }
    if (W.doc) { Track.full = true; layout(); if (!W.reflow) { const cw = $id('canvas').clientWidth, pw = W.doc.page(0).w / HU; if (cw < pw + 60) setZoom('width'); else if (W.pageZoom) setZoom(W.pageZoom); W.pageZoom = null; } }
  }
  $id('btnView').addEventListener('click', () => { setView(W.reflow ? 'page' : 'reflow'); toast(W.reflow ? '화면 맞춤 보기 — 글이 화면 폭에 맞춰 흐릅니다 (파일은 그대로)' : '쪽 보기 — 인쇄될 모양 그대로', 2200); });

  /* ---------- 확대/축소 ---------- */
  function setZoom(v) {
    const cv = $id('canvas'); const pg = W.doc ? W.doc.page(0) : { w: 59528, h: 84188 };
    if (v === 'fit') v = Math.min((cv.clientWidth - 60) / (pg.w / HU), (cv.clientHeight - 40) / (pg.h / HU));
    else if (v === 'width') v = (cv.clientWidth - 70) / (pg.w / HU);
    W.zoom = Math.max(0.3, Math.min(4, +v)); applyZoom();
    const z = $id('selZoom'); const o = Array.from(z.options).find(x => Math.abs(+x.value - W.zoom) < 0.001); if (o) z.value = o.value; else { let c = z.querySelector('option[data-cur]'); if (!c) { c = document.createElement('option'); c.dataset.cur = '1'; z.insertBefore(c, z.firstChild); } c.value = W.zoom; c.textContent = Math.round(W.zoom * 100) + '%'; z.value = c.value; }
    if (W.selPic) placePicHandle();
  }
  $id('canvas').addEventListener('wheel', e => { if (!e.ctrlKey || W.reflow) return; e.preventDefault(); setZoom(W.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }, { passive: false });

  /* ---------- 편집 이벤트 ---------- */
  doc.addEventListener('beforeinput', e => {
    const t = e.inputType;
    if (t === 'historyUndo') { e.preventDefault(); undo(); return; }
    if (t === 'historyRedo') { e.preventDefault(); redo(); return; }
    if (/^format/.test(t)) { e.preventDefault(); return; }
    if (t === 'insertParagraph') { e.preventDefault(); splitBlock(); return; }
    if (t === 'insertLineBreak') { e.preventDefault(); insertLineBreak(); return; }
    if (/^insertFrom(Paste|Drop|Yank)$|^deleteByDrag$|^deleteByCut$/.test(t)) { e.preventDefault(); return; }
    if (W.cells) clearCells();
    if (W.selPic && /^delete/.test(t)) { e.preventDefault(); deletePic(); return; }
    hidePic();
    const r = rng(); if (!r) return;
    const b = blockOf(r.startContainer); if (!b) { e.preventDefault(); return; }
    if (!r.collapsed) {
      if (/^delete/.test(t)) { e.preventDefault(); deleteSelection(); return; }
      if (t === 'insertText' || t === 'insertReplacementText') { e.preventDefault(); insertText(e.data || (e.dataTransfer && e.dataTransfer.getData('text/plain')) || ''); return; }
      record('op', b, blockOf(r.endContainer)); return;
    }
    if ((t === 'deleteContentBackward' || t === 'deleteWordBackward') && atBlockStart(b, r)) { e.preventDefault(); joinBackward(b); return; }
    if ((t === 'deleteContentForward' || t === 'deleteWordForward') && atBlockEnd(b, r)) { e.preventDefault(); joinForward(b); return; }
    record('type', b);
  });
  doc.addEventListener('input', () => {
    settle();
    const r = rng(); const b = r && blockOf(r.startContainer); tidy(b);
    changed();
  });
  doc.addEventListener('compositionstart', () => { const r = rng(); if (r && !r.collapsed && blockOf(r.startContainer) !== blockOf(r.endContainer)) deleteSelection(); });
  doc.addEventListener('paste', e => { hidePic(); onPaste(e); });
  doc.addEventListener('copy', e => onCopy(e, false));
  doc.addEventListener('cut', e => onCopy(e, true));
  doc.addEventListener('dragstart', e => { e.preventDefault(); });

  /* ---------- 마우스: 셀 블록 · 너비 조절 · 그림 ---------- */
  let drag = null;
  function edgeOf(td, e) {
    const rc = td.getBoundingClientRect(); const z = 5;
    if (Math.abs(e.clientX - rc.right) <= z) return { td, kind: 'col' };
    if (Math.abs(e.clientY - rc.bottom) <= z) return { td, kind: 'row' };
    return null;
  }
  doc.addEventListener('mousemove', e => {
    if (drag || GUEST) return;
    const td = e.target.closest && e.target.closest('td'); const ed = td && edgeOf(td, e);
    doc.classList.toggle('colrs', !!(ed && ed.kind === 'col')); doc.classList.toggle('rowrs', !!(ed && ed.kind === 'row'));
  });
  doc.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (W.cellPick) { // 휴대폰용 셀 선택: 첫 셀이 기준, 다음 셀까지 직사각형으로
      const td = e.target.closest('td');
      if (td) { e.preventDefault(); const a = W.cellPickAnchor && W.cellPickAnchor.isConnected && W.cellPickAnchor.closest('table') === td.closest('table') ? W.cellPickAnchor : null; if (!a) { W.cellPickAnchor = td; W.cellAnchor = td; W.cellFocus = td; setCells([td]); } else { W.cellAnchor = a; W.cellFocus = td; setCells(cellBlockRect(a, td)); } sel().removeAllRanges(); return; }
    }
    const pic = e.target.closest('.isl.pic');
    if (pic) { e.preventDefault(); selectPic(pic); return; }
    hidePic();
    const td = e.target.closest('td');
    const ed = td && !GUEST && edgeOf(td, e);
    if (ed) { e.preventDefault(); startResize(ed, e); return; }
    if (W.cells && !e.shiftKey) clearCells();
    if (td && e.shiftKey && (W.cells || cellOf(rng() && rng().startContainer))) { // Shift+클릭: 셀 블록 넓히기
      const a = W.cellAnchor && W.cellAnchor.isConnected && W.cellAnchor.closest('table') === td.closest('table') ? W.cellAnchor : cellOf(rng().startContainer);
      if (a && a.closest('table') === td.closest('table') && a !== td) { e.preventDefault(); W.cellAnchor = a; W.cellFocus = td; setCells(cellBlockRect(a, td)); sel().removeAllRanges(); return; }
    }
    if (td) drag = { kind: 'cells', from: td };
  });
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    if (drag.kind === 'cells') {
      if (!(e.buttons & 1)) { drag = null; return; }
      const el = document.elementFromPoint(e.clientX, e.clientY); const td = el && el.closest && el.closest('td');
      if (td && td !== drag.from && td.closest('table') === drag.from.closest('table')) { W.cellAnchor = drag.from; W.cellFocus = td; setCells(cellBlockRect(drag.from, td)); sel().removeAllRanges(); drag.moved = true; }
      else if (drag.moved && td === drag.from) { setCells([td]); sel().removeAllRanges(); }
    } else if (drag.kind === 'col' || drag.kind === 'row') {
      const d = (drag.kind === 'col' ? e.clientX - drag.x : e.clientY - drag.y) / W.zoom * HU;
      for (const [td, w0] of drag.a) { const v = Math.max(300, w0 + d); td.dataset[drag.kind === 'col' ? 'w' : 'h'] = Math.round(v); if (drag.kind === 'row') td.style.height = (v / HU).toFixed(1) + 'px'; }
      for (const [td, w0] of drag.b) td.dataset.w = Math.round(Math.max(300, w0 - d));
      if (drag.kind === 'col') refreshCols(drag.t);
    } else if (drag.kind === 'pic') {
      const w = Math.max(16, drag.w0 + (e.clientX - drag.x) / W.zoom);
      drag.pic.style.width = w + 'px'; drag.pic.style.height = (w * drag.ratio) + 'px'; placePicHandle();
    }
  });
  document.addEventListener('mouseup', e => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.kind === 'col' || d.kind === 'row') { settle(d.rec); UNDO.cur = null; changed(); }
    if (d.kind === 'pic') { const w = parseFloat(d.pic.style.width); d.pic.style.width = d.w0 + 'px'; d.pic.style.height = (d.w0 * d.ratio) + 'px'; resizePic(d.pic, w); placePicHandle(); }
    if (d.kind === 'cells' && W.cells && W.cells.size) window.onSelChange();
  });
  function startResize(ed, e) {
    const t = ed.td.closest('table.htb'); const g = tableGrid(t); const p = g.pos.get(ed.td);
    const rec = record('op', topOf(t));
    const a = [], b = [];
    if (ed.kind === 'col') { const c = p.c + p.cs - 1; for (const [td, q] of g.pos) { if (q.c + q.cs - 1 === c) a.push([td, +td.dataset.w || 0]); else if (q.c === c + 1) b.push([td, +td.dataset.w || 0]); } }
    else { const r = p.r + p.rs - 1; for (const [td, q] of g.pos) if (q.r + q.rs - 1 === r) a.push([td, +td.dataset.h || 0]); }
    drag = { kind: ed.kind, t, a, b, x: e.clientX, y: e.clientY, rec };
  }
  function selectPic(pic) { hidePic(); clearCells(); W.selPic = pic; pic.classList.add('picsel'); sel().removeAllRanges(); placePicHandle(); }
  function hidePic() { if (W.selPic) W.selPic.classList.remove('picsel'); W.selPic = null; $id('picHandle').hidden = true; }
  function placePicHandle() {
    const p = W.selPic; const h = $id('picHandle'); if (!p || !p.isConnected || GUEST) { if (!p || !p.isConnected) hidePic(); return; }
    const s = $id('sheet').getBoundingClientRect(), r = p.getBoundingClientRect();
    h.style.left = ((r.right - s.left) / W.zoom - 6) + 'px'; h.style.top = ((r.bottom - s.top) / W.zoom - 6) + 'px'; h.hidden = false;
  }
  $id('picHandle').addEventListener('mousedown', e => { if (!W.selPic) return; e.preventDefault(); e.stopPropagation(); const p = W.selPic; const w0 = p.getBoundingClientRect().width / W.zoom; drag = { kind: 'pic', pic: p, x: e.clientX, w0, ratio: (p.getBoundingClientRect().height / W.zoom) / w0 }; });
  /* 고른 그림을 키보드로 키우고 줄임 (Ctrl+→ / Ctrl+←) — 그림이 새로 그려지므로 같은 자리의 그림을 다시 고름 */
  function stepPic(f) {
    const p = W.selPic; if (!p || GUEST) return;
    const b = blockOf(p); if (!b) return;
    const path = pathOf(b), i = Array.from(b.querySelectorAll('.isl.pic')).indexOf(p);
    resizePic(p, p.getBoundingClientRect().width / W.zoom * f);
    const nb = byPath(path), np = nb && nb.querySelectorAll('.isl.pic')[i];
    if (np) selectPic(np); else hidePic();
  }
  function deletePic() { const p = W.selPic; if (!p) return; const b = blockOf(p); hidePic(); edit(b, b, () => { const nx = p.nextSibling; p.remove(); ensureBr(b); if (nx && nx.isConnected) placeCaret(nx.parentNode, Array.prototype.indexOf.call(nx.parentNode.childNodes, nx)); else caretToEnd(b); }); }
  async function pickImage() {
    keepSel();
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
    inp.onchange = async () => { backSel(); for (const f of inp.files) await insertImageFile(f); };
    inp.click();
  }

  /* ---------- 끌어다 놓기 ---------- */
  let dragDepth = 0;
  const dropDone = () => { dragDepth = 0; $id('dropMask').hidden = true; };
  window.addEventListener('dragenter', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) { dragDepth++; $id('dropMask').hidden = false; } });
  window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $id('dropMask').hidden = true; });
  window.addEventListener('dragover', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) e.preventDefault(); });
  window.addEventListener('drop', async e => {
    dragDepth = 0; $id('dropMask').hidden = true;
    const files = Array.from(e.dataTransfer ? e.dataTransfer.files : []); if (!files.length) return;
    e.preventDefault();
    const hw = files.find(f => /\.hwpx?$/i.test(f.name));
    if (hw) { let handle = null; try { const it = Array.from(e.dataTransfer.items).find(i => i.kind === 'file'); if (it && it.getAsFileSystemHandle) handle = await it.getAsFileSystemHandle(); } catch (er) { } await openFile(hw, handle && handle.kind === 'file' ? handle : null); return; }
    if (!W.doc || GUEST) return;
    const pos = document.caretPositionFromPoint ? document.caretPositionFromPoint(e.clientX, e.clientY) : null;
    const rr = pos ? (() => { const x = document.createRange(); x.setStart(pos.offsetNode, pos.offset); return x; })() : document.caretRangeFromPoint && document.caretRangeFromPoint(e.clientX, e.clientY);
    if (rr && inDoc(rr.startContainer)) { const s = sel(); s.removeAllRanges(); s.addRange(rr); }
    for (const f of files) if (/^image\//.test(f.type)) await insertImageFile(f);
  });

  /* ---------- 단축키 ---------- */
  let chord = null, chordT = null;
  function setChord(c) { chord = c; clearTimeout(chordT); $id('stChord').textContent = c ? 'Ctrl+N — T 표 · I 그림 · P 쪽 번호 · H 머리말/꼬리말' : ''; if (c) chordT = setTimeout(() => setChord(null), 2500); }
  function keyName(e) {
    const c = e.code || '';
    let k = /^Key[A-Z]$/.test(c) ? c.slice(3).toLowerCase() : /^Digit\d$/.test(c) ? c.slice(5) : /^Numpad\d$/.test(c) ? c.slice(6) : ({ BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=', Backspace: 'backspace', Delete: 'delete', Insert: 'insert', Enter: 'enter', NumpadEnter: 'enter', Tab: 'tab', Escape: 'esc', Space: 'space', ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Home: 'home', End: 'end', PageUp: 'pgup', PageDown: 'pgdn' }[c] || (/^F\d+$/.test(c) ? c.toLowerCase() : (e.key || '').toLowerCase()));
    return (e.ctrlKey || e.metaKey ? 'ctrl+' : '') + (e.altKey ? 'alt+' : '') + (e.shiftKey ? 'shift+' : '') + k;
  }
  const STY = n => { const list = H().styles.filter(x => x.type !== 'CHAR'); const s = list[n]; if (s) { applyStyle(s.id); toast('스타일: ' + (s.name || s.eng), 1000); } };
  const MAP = {
    'ctrl+s': () => act('save'), 'alt+s': () => act('save'), 'alt+v': () => act('saveAs'),
    'ctrl+o': () => act('open'), 'alt+o': () => act('open'), 'alt+n': () => act('new'),
    'ctrl+p': () => act('print'), 'alt+p': () => act('print'),
    'ctrl+z': () => undo(), 'ctrl+shift+z': () => redo(),
    'ctrl+b': () => toggleCp('bold'), 'alt+shift+b': () => toggleCp('bold'),
    'ctrl+i': () => toggleCp('italic'), 'alt+shift+i': () => toggleCp('italic'),
    'ctrl+u': () => toggleCp('underline'), 'alt+shift+u': () => toggleCp('underline'),
    'alt+shift+e': () => stepCp(c => ({ height: c.height + 100 })), 'ctrl+]': () => stepCp(c => ({ height: c.height + 100 })),
    'alt+shift+r': () => stepCp(c => ({ height: Math.max(100, c.height - 100) })), 'ctrl+[': () => stepCp(c => ({ height: Math.max(100, c.height - 100) })),
    'alt+shift+w': () => stepCp(c => ({ spacing: c.spacing + 1 })), 'alt+shift+n': () => stepCp(c => ({ spacing: c.spacing - 1 })),
    'alt+shift+k': () => stepCp(c => ({ ratio: c.ratio + 1 })), 'alt+shift+j': () => stepCp(c => ({ ratio: c.ratio - 1 })),
    'alt+shift+z': () => stepPp(p => ({ lsType: 'PERCENT', ls: (p.lsType === 'PERCENT' ? p.ls : 160) + 10 })), 'alt+shift+a': () => stepPp(p => ({ lsType: 'PERCENT', ls: Math.max(50, (p.lsType === 'PERCENT' ? p.ls : 160) - 10) })),
    'ctrl+shift+l': () => applyPp({ align: 'LEFT' }), 'ctrl+shift+c': () => applyPp({ align: 'CENTER' }), 'ctrl+shift+r': () => applyPp({ align: 'RIGHT' }),
    'ctrl+shift+m': () => applyPp({ align: 'JUSTIFY' }), 'ctrl+shift+t': () => applyPp({ align: 'DISTRIBUTE' }), 'ctrl+alt+t': () => applyPp({ align: 'DISTRIBUTE' }),
    'alt+l': () => act('charDlg'), 'alt+t': () => act('paraDlg'), 'f6': () => act('styleDlg'), 'f7': () => act('pageDlg'),
    'ctrl+f': () => act('find'), 'ctrl+h': () => act('replace'), 'ctrl+f2': () => act('replace'), 'ctrl+l': () => findAgain(false),
    'ctrl+f10': () => act('symbol'), 'f1': () => act('help'),
    'alt+c': () => formatPaint(),
    'ctrl+y': () => deleteVisualLine(false), 'alt+y': () => deleteVisualLine(true),
    'ctrl+n': () => setChord('n'), 'ctrl+alt+n': () => setChord('n'),
    'alt+insert': () => rowColDialog(true), 'alt+delete': () => rowColDialog(false),
    'shift+tab': () => hangIndent(),
  };
  for (let i = 1; i <= 9; i++) MAP['ctrl+' + i] = () => STY(i - 1);
  /* 한글 조합 중에 누른 Ctrl/Alt 단축키: 브라우저 기본 동작(페이지 저장·인쇄 등)은 막고, 조합이 끝난 뒤 실행 */
  let imeKey = null;
  document.addEventListener('compositionend', () => { const p = imeKey; imeKey = null; if (p && Date.now() - p.t < 1500) setTimeout(() => onKey(p.e), 0); }, true);
  document.addEventListener('keydown', onKey);
  function onKey(e) {
    if (document.querySelector('.dlg-bg')) return; // 대화상자가 처리
    const k = keyName(e);
    if (e.isComposing || e.keyCode === 229) { // 한글 조합 중에는 글자 입력에 손대지 않음
      if (W.doc && (MAP[k] || k === 'ctrl+enter') && /^(ctrl|alt)\+/.test(k)) {
        e.preventDefault();
        imeKey = { t: Date.now(), e: { key: e.key, code: e.code, keyCode: 0, isComposing: false, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, shiftKey: e.shiftKey, target: e.target, preventDefault() { } } };
      }
      return;
    }
    if (k === 'esc') { if (closePop()) { e.preventDefault(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); return; } if (!$id('findBar').hidden) { closeFind(); e.preventDefault(); return; } if (W.cells) { const a = W.cellAnchor; clearCells(); if (a) caretToEnd(a.querySelector('.hp')); e.preventDefault(); return; } if (W.selPic) { hidePic(); return; } setChord(null); return; }
    if (!W.doc || (typeof HwpHome !== 'undefined' && HwpHome.visible)) { if (MAP[k] && /^(ctrl\+o|alt\+o|alt\+n|f1)$/.test(k) && !(GUEST && k === 'alt+n')) { e.preventDefault(); MAP[k](); } return; }
    if (GUEST) { if (/^(ctrl\+o|alt\+o|ctrl\+p|alt\+p|ctrl\+f|ctrl\+l|f1)$/.test(k)) { e.preventDefault(); MAP[k](); } else if (/^(ctrl|alt)\+[a-z0-9\[\]]$|^f\d$|^ctrl\+enter$/.test(k) && !/^ctrl\+(c|a)$/.test(k)) e.preventDefault(); return; }
    const inEditor = inDoc(e.target) || e.target === document.body || e.target === $id('canvas');
    if (!inEditor && !/^(ctrl|alt)\+|^f\d/.test(k)) return;
    if (e.target.closest && e.target.closest('#findBar')) return;
    // Ctrl+N 다음 글자
    if (chord) {
      const c = k.replace(/^(ctrl\+|alt\+|shift\+)+/, ''); setChord(null);
      const f = { t: () => act('table'), i: () => act('image'), p: () => act('pageNum'), h: () => act('headFoot') }[c];
      if (f) { e.preventDefault(); f(); return; }
    }
    // 셀 블록
    if (W.cells && W.cells.size) { if (cellKeys(e, k)) { e.preventDefault(); return; } }
    if (W.selPic && (k === 'delete' || k === 'backspace')) { e.preventDefault(); deletePic(); return; }
    if (W.selPic && (k === 'ctrl+right' || k === 'ctrl+left')) { e.preventDefault(); stepPic(k === 'ctrl+right' ? 1.1 : 1 / 1.1); return; } // 손잡이를 끌지 않고 그림 크기 바꾸기
    const r = rng(); const td = r && cellOf(r.startContainer);
    // 본문과 표 칸에 걸친 선택: 브라우저는 편집 영역이 달라 아무것도 하지 않으므로 직접 지움
    if (r && !r.collapsed && inDoc(r.startContainer)) {
      const b1 = blockOf(r.startContainer), b2 = blockOf(r.endContainer);
      if (b1 && b2 && hostOf(b1) !== hostOf(b2)) {
        if (/^(ctrl\+)?(backspace|delete)$/.test(k)) { e.preventDefault(); deleteSelection(); return; }
        if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key && e.key.length === 1) deleteSelection(); // 지운 뒤 글자는 그대로 들어감
      }
    }
    if (k === 'f5') { e.preventDefault(); if (td) { W.cellAnchor = td; W.cellFocus = td; W.cellExtend = false; setCells([td]); sel().removeAllRanges(); } return; }
    if (td && (k === 'tab' || k === 'shift+tab')) { e.preventDefault(); cellMove(td, k === 'shift+tab'); return; }
    if (td && k === 'ctrl+enter') { e.preventDefault(); insertRow(td, true); return; }
    if (k === 'tab') { e.preventDefault(); insertTab(); return; }
    if (k === 'ctrl+enter') { e.preventDefault(); splitBlock({ pageBreak: true }); return; }
    if (k === 'shift+enter') { e.preventDefault(); insertLineBreak(); return; }
    if (k === 'enter') { e.preventDefault(); splitBlock(); return; }
    if (k === 'ctrl+a' && W.cells) clearCells();
    const f = MAP[k];
    if (f) { e.preventDefault(); keepSel(); f(); }
  }
  function cellKeys(e, k) {
    const cells = Array.from(W.cells);
    const dirs = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] };
    const base = k.replace(/^shift\+/, '');
    if (k === 'f5') { if (!W.cellExtend) { W.cellExtend = true; toast('셀 블록 넓히기: 방향키', 1200); } else { const t = cells[0].closest('table'); setCells(Array.from(t.querySelectorAll('td')).filter(x => x.closest('table') === t)); } return true; }
    if (dirs[base] && !e.ctrlKey && !e.altKey) { moveCellBlock(dirs[base][0], dirs[base][1], e.shiftKey || W.cellExtend); return true; }
    if (/^ctrl\+(left|right|up|down)$/.test(k)) { const d = k.split('+')[1]; const st = 283; resizeCells(cells, d === 'left' ? -st : d === 'right' ? st : 0, d === 'up' ? -st : d === 'down' ? st : 0); setCells(cells); return true; }
    if (k === 'm') { mergeCells(cells); return true; }
    if (k === 's') { clearCells(); splitCell(cells[0]); return true; }
    if (k === 'w') { equalizeCells(cells, 'w'); setCells(cells); return true; }
    if (k === 'h') { equalizeCells(cells, 'h'); setCells(cells); return true; }
    if (k === 'l' || k === 'c') { cellDialog(cells); return true; }
    if (k === 'delete' || k === 'backspace') { clearCellContents(cells); setCells(cells); return true; }
    if (k === 'enter') { const a = cells[0]; clearCells(); caretToEnd(a.querySelector('.hp')); return true; }
    if (k === 'alt+insert') { rowColDialog(true); return true; }
    if (k === 'alt+delete') { rowColDialog(false); return true; }
    if (MAP[k] && /^(ctrl|alt)\+/.test(k)) { MAP[k](); setCells(cells.filter(x => x.isConnected)); return true; }
    if (k.length === 1 || k === 'space') { const a = cells[0]; clearCells(); caretToEnd(a.querySelector('.hp')); return false; }
    return false;
  }
  function hangIndent() { // Shift+Tab: 커서 위치까지 내어쓰기
    const r = rng(); if (!r) return; const b = blockOf(r.startContainer); if (!b) return;
    const p = H().pp(b.dataset.pp);
    if (p.intent < 0) { applyPp({ intent: 0 }); return; }
    const rc = r.getClientRects()[0]; if (!rc) return;
    const br = b.getBoundingClientRect(); const pad = parseFloat(getComputedStyle(b).paddingLeft) * W.zoom;
    const x = (rc.left - br.left - pad) / W.zoom; if (x <= 1) return;
    applyPp({ intent: -Math.round(x * HU) });
  }
  function formatPaint() {
    const r = rng(); if (!r) return;
    if (!W.fmtCopy || r.collapsed && !W.cells) { W.fmtCopy = { cp: selCp(), pp: selPp() }; toast('모양을 복사했습니다 — 바꿀 곳을 블록으로 잡고 다시 Alt+C', 2200); return; }
    const f = W.fmtCopy; mapCp(() => f.cp); mapPp(() => f.pp); toast('모양을 붙였습니다', 1000);
  }

  /* ---------- 찾기 / 바꾸기 ---------- */
  function openFind(rep) {
    const fb = $id('findBar'); fb.hidden = false; $id('fRepRow').hidden = !rep;
    const r = rng(); if (r && !r.collapsed && r.toString().length < 80) $id('fq').value = r.toString();
    keepSel(); $id('fq').focus(); $id('fq').select(); $id('fMsg').textContent = '';
  }
  function closeFind() { $id('findBar').hidden = true; backSel(); }
  function findAgain(back) {
    const q = $id('fq').value; if (!q) { openFind(false); return; }
    backSel(); const ok = findNext(q, { back, case: $id('fCase').checked }); $id('fMsg').textContent = ok ? '' : '찾지 못함'; if (!ok) toast(`"${q}" 을(를) 찾지 못했습니다`); keepSel();
  }
  $id('fq').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); findAgain(e.shiftKey); $id('fq').focus(); } if (e.key === 'Escape') { e.preventDefault(); closeFind(); } });
  $id('fr').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); $id('fRep').click(); } if (e.key === 'Escape') { e.preventDefault(); closeFind(); } });
  $id('fNext').onclick = () => findAgain(false); $id('fPrev').onclick = () => findAgain(true); $id('fClose').onclick = closeFind;
  $id('fRep').onclick = () => { backSel(); replaceSel($id('fq').value, $id('fr').value, $id('fCase').checked); findAgain(false); }; // 선택한 곳을 바꾸고(선택이 없으면 건너뜀) 다음을 찾음
  $id('fRepAll').onclick = () => { const n = replaceAll($id('fq').value, $id('fr').value, { case: $id('fCase').checked }); $id('fMsg').textContent = n + '개 바꿈'; toast(n ? `${n}개를 바꿨습니다` : '바꿀 내용을 찾지 못했습니다'); };

  /* ---------- 인쇄 ---------- */
  function doPrint() {
    const pg = W.doc.page(0); const hf = hfInfo();
    const mm = v => (v / MM).toFixed(2) + 'mm';
    const box = (x, al) => x && x.text ? `@${al}-${{ CENTER: 'center', RIGHT: 'right' }[x.align] || 'left'}{content:${JSON.stringify(x.text)};font:9pt 'Malgun Gothic',sans-serif;color:#333}` : '';
    let pn = '';
    if (hf.pageNum && hf.pageNum.pos !== 'NONE') { const pos = hf.pageNum.pos; const v = /^TOP/.test(pos) ? 'top' : 'bottom'; const h = /LEFT/.test(pos) ? 'left' : /RIGHT/.test(pos) ? 'right' : 'center'; const side = hf.pageNum.side ? JSON.stringify(hf.pageNum.side + ' ') : '""'; pn = `@${v}-${h}{content:${side} counter(page) ${hf.pageNum.side ? JSON.stringify(' ' + hf.pageNum.side) : '""'};font:9pt 'Malgun Gothic',sans-serif}`; }
    $id('printCss').textContent = `@page{size:${mm(pg.w)} ${mm(pg.h)};margin:${mm(pg.top + pg.header)} 0 ${mm(pg.bottom + pg.footer)} 0;${box(hf.header, 'top')}${box(hf.footer, 'bottom')}${pn}}`;
    clearCells(); hidePic();
    setTimeout(() => window.print(), 50);
  }

  /* ---------- 글자 모양 (Alt+L) ---------- */
  function charDialog() {
    const c = H().cp(selCp());
    dialog('글자 모양', `<fieldset><legend>기본</legend><div class="grid2">
        <label>기준 크기</label><input id="c_sz" type="number" step="0.5" min="1" value="${c.height / 100}"> <label>pt</label><span></span>
        <label>글꼴</label><input id="c_ft" list="fontList" value="${escH(c.faceH)}"><label>장평</label><input id="c_ra" type="number" min="50" max="200" value="${c.ratio}">
        <label>글자 색</label><input id="c_co" type="color" value="${hexColor(c.color) || '#000000'}"><label>자간</label><input id="c_sp" type="number" min="-50" max="50" value="${c.spacing}">
        <label>음영 색</label><span style="display:flex;gap:6px;align-items:center"><input id="c_sh" type="color" value="${hexColor(c.shade) || '#ffffff'}"><label class="chk"><input type="checkbox" id="c_shn" ${hexColor(c.shade) ? '' : 'checked'}> 없음</label></span><span></span><span></span>
      </div></fieldset>
      <fieldset><legend>속성</legend><div class="chks">
        <label><input type="checkbox" id="c_b" ${c.bold ? 'checked' : ''}> <b>진하게</b></label><label><input type="checkbox" id="c_i" ${c.italic ? 'checked' : ''}> <i>기울임</i></label>
        <label><input type="checkbox" id="c_u" ${c.underline ? 'checked' : ''}> <u>밑줄</u></label><label><input type="checkbox" id="c_s" ${c.strike ? 'checked' : ''}> <s>취소선</s></label>
        <label><input type="checkbox" id="c_sup" ${c.sup ? 'checked' : ''}> 위 첨자</label><label><input type="checkbox" id="c_sub" ${c.sub ? 'checked' : ''}> 아래 첨자</label>
      </div></fieldset><div class="preview" id="c_pv">한글 Hangul 123 가나다라</div>`, {
      width: 520,
      init: q => {
        const pv = () => { const p = q('#c_pv'); p.style.fontSize = num(q, '#c_sz', 10) + 'pt'; p.style.fontFamily = fontStack([q('#c_ft').value]); p.style.color = q('#c_co').value; p.style.fontWeight = q('#c_b').checked ? 700 : 400; p.style.fontStyle = q('#c_i').checked ? 'italic' : 'normal'; p.style.textDecoration = [q('#c_u').checked ? 'underline' : '', q('#c_s').checked ? 'line-through' : ''].join(' ') || 'none'; p.style.letterSpacing = num(q, '#c_sp', 0) / 100 + 'em'; p.style.background = q('#c_shn').checked ? '' : q('#c_sh').value; };
        q('.body').addEventListener('input', pv); pv();
      },
      onOk: q => {
        const m = {};
        const sz = Math.round(num(q, '#c_sz', c.height / 100) * 100); if (sz !== c.height) m.height = sz;
        const ft = q('#c_ft').value.trim(); if (ft && ft !== c.faceH) m.face = ft;
        const ra = num(q, '#c_ra', c.ratio); if (ra !== c.ratio) m.ratio = ra;
        const sp = num(q, '#c_sp', c.spacing); if (sp !== c.spacing) m.spacing = sp;
        const co = q('#c_co').value.toUpperCase(); if (co !== (hexColor(c.color) || '#000000').toUpperCase()) m.color = co;
        const sh = q('#c_shn').checked ? 'none' : q('#c_sh').value.toUpperCase(); if (sh !== (hexColor(c.shade) ? c.shade.toUpperCase() : 'none')) m.shade = sh;
        if (q('#c_b').checked !== c.bold) m.bold = q('#c_b').checked;
        if (q('#c_i').checked !== c.italic) m.italic = q('#c_i').checked;
        if (q('#c_u').checked !== !!c.underline) m.underline = q('#c_u').checked ? 'BOTTOM' : '';
        if (q('#c_s').checked !== c.strike) m.strike = q('#c_s').checked;
        const sc = q('#c_sup').checked ? 'sup' : q('#c_sub').checked ? 'sub' : 'none'; if (sc !== (c.sup ? 'sup' : c.sub ? 'sub' : 'none')) m.script = sc;
        backSel(); if (Object.keys(m).length) applyCp(m);
      } });
  }
  /* ---------- 문단 모양 (Alt+T) ---------- */
  function paraDialog() {
    const p = H().pp(selPp()); const pt = v => +(v / 100).toFixed(1);
    const first = p.intent > 0 ? 'in' : p.intent < 0 ? 'out' : 'none';
    dialog('문단 모양', `<fieldset><legend>정렬 · 여백</legend><div class="grid2">
        <label>정렬</label><select id="p_al">${[['JUSTIFY', '양쪽'], ['LEFT', '왼쪽'], ['CENTER', '가운데'], ['RIGHT', '오른쪽'], ['DISTRIBUTE', '배분'], ['DISTRIBUTE_SPACE', '나눔']].map(([v, n]) => `<option value="${v}" ${p.align === v ? 'selected' : ''}>${n}</option>`).join('')}</select><span></span><span></span>
        <label>왼쪽 (pt)</label><input id="p_l" type="number" step="0.5" value="${pt(p.left)}"><label>오른쪽 (pt)</label><input id="p_r" type="number" step="0.5" value="${pt(p.right)}">
        <label>첫 줄</label><select id="p_ft"><option value="none" ${first === 'none' ? 'selected' : ''}>보통</option><option value="in" ${first === 'in' ? 'selected' : ''}>들여쓰기</option><option value="out" ${first === 'out' ? 'selected' : ''}>내어쓰기</option></select><label>값 (pt)</label><input id="p_iv" type="number" step="0.5" min="0" value="${pt(Math.abs(p.intent))}">
      </div></fieldset>
      <fieldset><legend>간격</legend><div class="grid2">
        <label>줄 간격</label><select id="p_lt">${[['PERCENT', '글자에 따라 (%)'], ['FIXED', '고정 값 (pt)'], ['BETWEEN_LINES', '여백만 지정 (pt)'], ['AT_LEAST', '최소 (pt)']].map(([v, n]) => `<option value="${v}" ${p.lsType === v ? 'selected' : ''}>${n}</option>`).join('')}</select><label>값</label><input id="p_lv" type="number" step="1" value="${p.lsType === 'PERCENT' ? p.ls : pt(p.ls)}">
        <label>문단 위 (pt)</label><input id="p_pv" type="number" step="0.5" value="${pt(p.prev)}"><label>문단 아래 (pt)</label><input id="p_nx" type="number" step="0.5" value="${pt(p.next)}">
      </div></fieldset>`, {
      width: 520,
      onOk: q => {
        const m = {}; const hu = v => Math.round(v * 100);
        if (q('#p_al').value !== p.align) m.align = q('#p_al').value;
        const l = hu(num(q, '#p_l', 0)); if (l !== p.left) m.left = l;
        const rr = hu(num(q, '#p_r', 0)); if (rr !== p.right) m.right = rr;
        const ft = q('#p_ft').value, iv = hu(num(q, '#p_iv', 0)); const intent = ft === 'in' ? iv : ft === 'out' ? -iv : 0; if (intent !== p.intent) m.intent = intent;
        const lt = q('#p_lt').value, lv = num(q, '#p_lv', 160); const lsv = lt === 'PERCENT' ? Math.round(lv) : hu(lv); if (lt !== p.lsType || lsv !== p.ls) { m.lsType = lt; m.ls = lsv; }
        const pv = hu(num(q, '#p_pv', 0)); if (pv !== p.prev) m.prev = pv;
        const nx = hu(num(q, '#p_nx', 0)); if (nx !== p.next) m.next = nx;
        backSel(); if (Object.keys(m).length) applyPp(m);
      } });
  }
  /* ---------- 스타일 (F6) ---------- */
  function styleDialog() {
    const list = H().styles; const cur = (blockOf((rng() || {}).startContainer) || { dataset: {} }).dataset.st;
    dialog('스타일', `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;max-height:50vh;overflow:auto">${list.map((s, i) => `<button class="tb ${s.id === cur ? 'on' : ''}" data-sid="${escH(s.id)}" style="justify-content:space-between;border-color:#e5e8ee">${escH(s.name || s.eng)}<span class="muted" style="font-size:11px">${s.type === 'CHAR' ? '글자' : (i < 9 ? 'Ctrl+' + (i + 1) : '')}</span></button>`).join('')}</div>`, {
      foot: '<button class="tb" data-x="cancel">닫기</button>', noEnter: true,
      init: (q, close) => q('.body').addEventListener('click', e => { const b = e.target.closest('[data-sid]'); if (!b) return; close(); applyStyle(b.dataset.sid); }) });
  }
  /* ---------- 표 만들기 ---------- */
  function tableDialog() {
    dialog('표 만들기', `<div class="grid2"><label>줄 개수</label><input id="t_r" type="number" min="1" max="500" value="5"><label>칸 개수</label><input id="t_c" type="number" min="1" max="60" value="5"></div><div class="muted" style="margin-top:10px;font-size:12px">또는 아래 칸을 눌러 바로 만들기</div><div class="tgrid" id="t_g" style="grid-template-columns:repeat(10,18px)">${'<i></i>'.repeat(80)}</div><div class="muted" id="t_lab" style="font-size:12px;height:16px"></div>`, {
      okText: '만들기', width: 380,
      init: (q, close) => {
        const cells = Array.from(q('#t_g').children);
        q('#t_g').addEventListener('mousemove', e => { const i = cells.indexOf(e.target); if (i < 0) return; const r = (i / 10 | 0) + 1, c = i % 10 + 1; cells.forEach((x, j) => x.classList.toggle('on', (j / 10 | 0) < r && j % 10 < c)); q('#t_lab').textContent = `${r}줄 × ${c}칸`; });
        q('#t_g').addEventListener('click', e => { const i = cells.indexOf(e.target); if (i < 0) return; close(); insertTable((i / 10 | 0) + 1, i % 10 + 1); });
      },
      onOk: q => { const r = Math.max(1, Math.min(500, num(q, '#t_r', 5) | 0)), c = Math.max(1, Math.min(60, num(q, '#t_c', 5) | 0)); backSel(); insertTable(r, c); } });
  }
  function rowColDialog(add) {
    const cells = curCells(); if (!cells.length) { toast('표 안에서 쓸 수 있습니다'); return; }
    dialog(add ? '줄/칸 추가하기' : '줄/칸 지우기', `<div class="chks" style="flex-direction:column;gap:8px">${add ? `<label><input type="radio" name="rc" value="ra"> 위쪽에 줄 추가</label><label><input type="radio" name="rc" value="rb" checked> 아래쪽에 줄 추가</label><label><input type="radio" name="rc" value="cl"> 왼쪽에 칸 추가</label><label><input type="radio" name="rc" value="cr"> 오른쪽에 칸 추가</label><div class="grid1"><label>개수</label><input id="rc_n" type="number" min="1" max="50" value="1"></div>` : `<label><input type="radio" name="rc" value="r" checked> 줄</label><label><input type="radio" name="rc" value="c"> 칸</label>`}</div>`, {
      okText: add ? '추가' : '지우기', width: 320,
      onOk: q => {
        const v = q('input[name=rc]:checked').value; const n = add ? Math.max(1, Math.min(50, num(q, '#rc_n', 1) | 0)) : 1;
        clearCells(true);
        for (let i = 0; i < n; i++) { const c = cells.filter(x => x.isConnected); const td = c[0], tl = c[c.length - 1]; if (!td) break; if (v === 'ra') insertRow(td, false); if (v === 'rb') insertRow(tl, true); if (v === 'cl') insertCol(td, false); if (v === 'cr') insertCol(tl, true); if (v === 'r') deleteRow(td); if (v === 'c') deleteCol(td); }
      } });
  }
  function cellDialog(cells) {
    cells = cells || curCells(); if (!cells.length) return;
    dialog('셀 테두리/배경', `<div class="grid1"><label>배경색</label><span style="display:flex;gap:8px;align-items:center"><input type="color" id="cd_f" value="#e8eef8"><label class="chk"><input type="checkbox" id="cd_fn"> 배경 없음</label><label class="chk"><input type="checkbox" id="cd_fk" checked> 그대로 두기</label></span>
      <label>테두리</label><select id="cd_b"><option value="">그대로 두기</option><option value="SOLID">실선</option><option value="DASH">파선</option><option value="DOT">점선</option><option value="DOUBLE_SLIM">이중선</option><option value="NONE">없음</option></select>
      <label>적용할 선</label><select id="cd_s"><option value="all">모두</option><option value="out">바깥쪽만</option><option value="top">위</option><option value="bottom">아래</option><option value="left">왼쪽</option><option value="right">오른쪽</option></select></div>`, {
      width: 400,
      init: q => { q('#cd_f').addEventListener('input', () => { q('#cd_fk').checked = false; q('#cd_fn').checked = false; }); q('#cd_fn').addEventListener('change', () => { q('#cd_fk').checked = false; }); },
      onOk: q => {
        backSel();
        if (!q('#cd_fk').checked) cellFill(cells, q('#cd_fn').checked ? null : q('#cd_f').value.toUpperCase());
        const t = q('#cd_b').value; const s = q('#cd_s').value;
        if (t) {
          if (s === 'out') { const R = cellRect(cells); const live = R.cells; for (const td of live) { const p = R.g.pos.get(td); const sides = []; if (p.r === R.r0) sides.push('top'); if (p.r + p.rs - 1 === R.r1) sides.push('bottom'); if (p.c === R.c0) sides.push('left'); if (p.c + p.cs - 1 === R.c1) sides.push('right'); if (sides.length) cellBorder([td], t, sides); } }
          else cellBorder(cells, t, s === 'all' ? null : [s]);
        }
        if (W.cells) setCells(cells.filter(x => x.isConnected));
      } });
  }
  /* ---------- 편집 용지 (F7) ---------- */
  const PAPERS = [['A4', 210, 297], ['A3', 297, 420], ['B4', 257, 364], ['B5', 182, 257], ['A5', 148, 210], ['Letter', 215.9, 279.4], ['Legal', 215.9, 355.6]];
  function pageDialog() {
    const r = rng(); const sec = r && blockOf(r.startContainer) ? +blockOf(r.startContainer).closest('.hsec').dataset.s : 0;
    const p = W.doc.page(sec); const m = v => +(v / MM).toFixed(1);
    const pw = Math.min(p.w, p.h), ph = Math.max(p.w, p.h);
    const cur = PAPERS.find(x => Math.abs(x[1] - pw / MM) < 1 && Math.abs(x[2] - ph / MM) < 1);
    dialog('편집 용지', `<fieldset><legend>용지 종류</legend><div class="grid2">
        <label>종류</label><select id="g_pp">${PAPERS.map(x => `<option value="${x[0]}" ${cur && cur[0] === x[0] ? 'selected' : ''}>${x[0]} (${x[1]}×${x[2]}mm)</option>`).join('')}<option value="user" ${cur ? '' : 'selected'}>사용자 정의</option></select><span></span><span></span>
        <label>폭 (mm)</label><input id="g_w" type="number" step="0.1" value="${m(pw)}"><label>길이 (mm)</label><input id="g_h" type="number" step="0.1" value="${m(ph)}">
        <label>방향</label><span class="chks"><label><input type="radio" name="g_o" value="p" ${p.land ? '' : 'checked'}> 세로</label><label><input type="radio" name="g_o" value="l" ${p.land ? 'checked' : ''}> 가로</label></span><span></span><span></span>
      </div></fieldset>
      <fieldset><legend>용지 여백 (mm)</legend><div class="grid2">
        <label>위쪽</label><input id="g_t" type="number" step="0.1" value="${m(p.top)}"><label>머리말</label><input id="g_hd" type="number" step="0.1" value="${m(p.header)}">
        <label>왼쪽</label><input id="g_l" type="number" step="0.1" value="${m(p.left)}"><label>오른쪽</label><input id="g_r" type="number" step="0.1" value="${m(p.right)}">
        <label>제본</label><input id="g_g" type="number" step="0.1" value="${m(p.gutter)}"><label>꼬리말</label><input id="g_ft" type="number" step="0.1" value="${m(p.footer)}">
        <label>아래쪽</label><input id="g_b" type="number" step="0.1" value="${m(p.bottom)}"><span></span><span></span>
      </div></fieldset>${W.doc.sections.length > 1 ? `<div class="muted" style="font-size:12px">구역 ${sec + 1} 에 적용됩니다.</div>` : ''}`, {
      width: 520,
      init: q => q('#g_pp').addEventListener('change', () => { const x = PAPERS.find(y => y[0] === q('#g_pp').value); if (x) { q('#g_w').value = x[1]; q('#g_h').value = x[2]; } }),
      onOk: q => {
        const u = s => Math.round(num(q, s, 0) * MM);
        W.doc.setPage(sec, { w: u('#g_w'), h: u('#g_h'), land: q('input[name=g_o]:checked').value === 'l', top: u('#g_t'), bottom: u('#g_b'), left: u('#g_l'), right: u('#g_r'), header: u('#g_hd'), footer: u('#g_ft'), gutter: u('#g_g') });
        const sp = doc.querySelector(`.hsec[data-s="${sec}"] .isl[data-ctrl="secPr"]`); if (sp) sp.dataset.touch = Date.now(); // 구역 설정이 바뀐 문단은 새로 저장
        window.onDocChanged(); Track.full = true; layout(); // 구역 설정은 원본 XML 을 직접 고치므로 저장 때 그대로 반영됨
      } });
  }
  /* ---------- 쪽 번호 ---------- */
  function firstBlockOfSec0() { return doc.querySelector('.hsec > .hp'); }
  function insertCtrlIsland(xmlInner, kind) {
    const b = firstBlockOfSec0(); if (!b) return;
    const el = W.doc.ctrlXml(xmlInner); const s = W.doc.islandHtml(el, b.dataset.dcp || '0', false);
    edit(b, b, () => { let ref = b.firstChild; while (ref && ref.nodeType === 1 && ref.classList.contains('isl') && ref.classList.contains('hid')) ref = ref.nextSibling; b.insertBefore(s, ref); });
  }
  function pageNumDialog() {
    const hf = hfInfo(); const cur = hf.pageNum || { pos: 'BOTTOM_CENTER', fmt: 'DIGIT', side: '-' };
    const POS = [['BOTTOM_CENTER', '아래 가운데'], ['BOTTOM_LEFT', '아래 왼쪽'], ['BOTTOM_RIGHT', '아래 오른쪽'], ['TOP_CENTER', '위 가운데'], ['TOP_LEFT', '위 왼쪽'], ['TOP_RIGHT', '위 오른쪽'], ['NONE', '없음 (지우기)']];
    const FMT = [['DIGIT', '1, 2, 3'], ['CIRCLED_DIGIT', '①, ②, ③'], ['ROMAN_CAPITAL', 'I, II, III'], ['ROMAN_SMALL', 'i, ii, iii'], ['LATIN_CAPITAL', 'A, B, C'], ['HANGUL_SYLLABLE', '가, 나, 다']];
    dialog('쪽 번호 매기기', `<div class="grid1"><label>위치</label><select id="n_p">${POS.map(([v, n]) => `<option value="${v}" ${cur.pos === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label>번호 모양</label><select id="n_f">${FMT.map(([v, n]) => `<option value="${v}" ${cur.fmt === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label>줄표 넣기</label><label class="chk"><input type="checkbox" id="n_s" ${cur.side ? 'checked' : ''}> - 1 - 처럼 앞뒤에 줄표</label></div>`, {
      width: 380,
      onOk: q => {
        const pos = q('#n_p').value, fmt = q('#n_f').value, side = q('#n_s').checked ? '-' : '';
        const isl = Array.from(doc.querySelectorAll('.isl[data-ctrl="pageNum"]'));
        if (pos === 'NONE') { for (const s of isl) { const b = blockOf(s); edit(b, b, () => s.remove()); } layout(); return; }
        if (hf.pageNum && isl.length) { const b = blockOf(isl[0]); edit(b, b, () => { const el = replaceIsland(isl[0], W.doc.islands[isl[0].dataset.i].el).firstElementChild; el.setAttribute('pos', pos); el.setAttribute('formatType', fmt); el.setAttribute('sideChar', side); }); }
        else insertCtrlIsland(`<hp:pageNum pos="${pos}" formatType="${fmt}" sideChar="${side}"/>`);
        layout();
      } });
  }
  /* ---------- 머리말 / 꼬리말 ---------- */
  function headFootDialog() {
    const hf = hfInfo();
    const al = a => `<select id="${a.id}">${[['LEFT', '왼쪽'], ['CENTER', '가운데'], ['RIGHT', '오른쪽']].map(([v, n]) => `<option value="${v}" ${(a.v || 'LEFT') === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
    dialog('머리말 / 꼬리말', `<div class="grid1"><label>머리말</label><input id="h_h" value="${escH(hf.header ? hf.header.text : '')}" placeholder="예: 소방안전 교육자료"><label>머리말 정렬</label>${al({ id: 'h_ha', v: hf.header && hf.header.align })}
      <label>꼬리말</label><input id="h_f" value="${escH(hf.footer ? hf.footer.text : '')}" placeholder="예: 기관 이름"><label>꼬리말 정렬</label>${al({ id: 'h_fa', v: hf.footer && hf.footer.align })}</div>
      <p class="muted" style="font-size:12px;margin-bottom:0">모든 쪽에 같은 글이 들어갑니다. 비우면 지웁니다. 쪽 번호는 [# 쪽 번호] 에서 따로 넣습니다.</p>`, {
      width: 460,
      onOk: q => { setHF('header', q('#h_h').value, q('#h_ha').value, hf.header); setHF('footer', q('#h_f').value, q('#h_fa').value, hf.footer); layout(); } });
  }
  function setHF(kind, text, align, cur) {
    const isl = doc.querySelector(`.isl[data-ctrl="${kind}"]`);
    const pg = W.doc.page(0); const cw = pg.w - pg.left - pg.right;
    const pp = W.doc.header.derivePp('0', { align, lsType: 'PERCENT', ls: 150 }); const cp = (W.doc.header.styles.find(s => s.eng === 'Header') || { cp: '0' }).cp;
    if (!text.trim()) { if (isl) { const b = blockOf(isl); edit(b, b, () => isl.remove()); } return; }
    if (cur && isl) {
      const b = blockOf(isl);
      edit(b, b, () => {
        const el = replaceIsland(isl, W.doc.islands[isl.dataset.i].el).firstElementChild; const ps = xdesc(el, 'p'); const p = ps[0];
        ps.slice(1).forEach(x => x.remove());
        p.setAttribute('paraPrIDRef', pp);
        const runs = xkids(p, 'run'); const run = runs[0] || p.appendChild(p.ownerDocument.createElementNS(HNS.hp, 'hp:run'));
        if (!runs.length) run.setAttribute('charPrIDRef', cp);
        runs.slice(1).forEach(x => x.remove());
        while (run.firstChild) run.firstChild.remove();
        const t = p.ownerDocument.createElementNS(HNS.hp, 'hp:t'); t.textContent = text; run.appendChild(t);
        for (const ls of xkids(p, 'linesegarray')) ls.remove();
      });
      return;
    }
    const tx = text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    insertCtrlIsland(`<hp:${kind} id="${kind === 'header' ? 1 : 2}" applyPageType="BOTH"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="${kind === 'header' ? 'BOTTOM' : 'TOP'}" linkListIDRef="0" linkListNextIDRef="0" textWidth="${cw}" textHeight="${kind === 'header' ? pg.header : pg.footer}" hasTextRef="0" hasNumRef="0"><hp:p id="0" paraPrIDRef="${pp}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${cp}"><hp:t>${tx}</hp:t></hp:run></hp:p></hp:subList></hp:${kind}>`);
  }
  /* ---------- 문자표 ---------- */
  const SYMS = {
    '기호': '※○●◎◇◆□■△▲▽▼◁◀▷▶☆★♤♠♡♥♧♣⊙◈▣◐◑▒▤▥▨▧▦▩♨☏☎☜☞¶†‡↕↗↙↖↘♭♩♪♬㉿㈜№㏇™㏂㏘℡®ª',
    '화살표': '→←↑↓↔⇒⇔⇐⇑⇓↗↘↙↖⇄⇆➔➜➝➞➡⬅⬆⬇',
    '원·괄호 숫자': '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⒜⒝⒞⒟⒠ⓐⓑⓒⓓⓔⓕ㉠㉡㉢㉣㉤㉥㉦㉧㉨㉩㉮㉯㉰㉱㉲㉳㉴㉵㉶㉷㈎㈏㈐㈑㈒',
    '로마·그리스': 'ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω',
    '단위': '℃℉°′″㎜㎝㎞㎡㎢㎥㎦㎖㎗ℓ㎘㏄㎎㎏㎾㎿㎿㏊㎐㎑㎒㎓㎅㎆㎉㎾㎽㎼Ω㏀㏁㎭㎧㎨㎳㎲㎱㎰㎳％‰',
    '수학': '±×÷≠≤≥∞∴∵∽∝√∫∬∮∑∏∂∇≡≒≪≫⊂⊃⊆⊇∈∋∪∩∧∨¬⇒⇔∀∃∠⊥⌒',
    '문장 부호': '·‥…「」『』【】〈〉《》〔〕‘’“”〃～ˇ˘˝˚˙¸˛¡¿ː',
  };
  function symbolDialog() {
    const tabs = Object.keys(SYMS); let cur = tabs[0]; try { cur = localStorage.getItem('hwp:symtab') || cur; } catch (e) { } if (!SYMS[cur]) cur = tabs[0];
    dialog('문자표', `<div class="symtabs">${tabs.map(t => `<button class="tb ${t === cur ? 'on' : ''}" data-t="${t}">${t}</button>`).join('')}</div><div class="sym" id="sy"></div><p class="muted" style="font-size:12px;margin-bottom:0">글자를 누르면 커서 위치에 넣습니다.</p>`, {
      foot: '<button class="tb" data-x="cancel">닫기</button>', noEnter: true, width: 560,
      init: (q, close) => {
        const draw = () => { q('#sy').innerHTML = Array.from(new Set(Array.from(SYMS[cur]))).map(ch => `<button data-ch="${ch}">${ch}</button>`).join(''); q('.symtabs').querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === cur)); };
        q('.symtabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; cur = b.dataset.t; try { localStorage.setItem('hwp:symtab', cur); } catch (er) { } draw(); });
        q('#sy').addEventListener('click', e => { const b = e.target.closest('[data-ch]'); if (!b) return; close(); insertText(b.dataset.ch); });
        draw();
      } });
  }
  /* ---------- 도움말 (F1) ---------- */
  function helpDialog() {
    const row = (k, d) => `<tr><td>${k.split(' / ').map(x => x.split('+').map(y => `<kbd>${y}</kbd>`).join('+')).join(' ')}</td><td>${d}</td></tr>`;
    const sec = (t, rows) => `<h4>${t}</h4><table class="kb">${rows.map(r => row(r[0], r[1])).join('')}</table>`;
    dialog('한글 작업장 단축키', `<div class="kbcols"><div>
      ${sec('파일', [['Alt+N', '새 문서'], ['Alt+O / Ctrl+O', '불러오기'], ['Alt+S / Ctrl+S', '저장하기 (열어 둔 파일 또는 문서함)'], ['Alt+V', '다른 이름으로 저장'], ['Alt+P / Ctrl+P', '인쇄 · PDF 저장']])}
      ${sec('편집', [['Ctrl+Z', '되돌리기'], ['Ctrl+Shift+Z', '다시 실행'], ['Ctrl+X / Ctrl+C / Ctrl+V', '오려 두기 · 복사 · 붙이기'], ['Ctrl+Y', '한 줄 지우기'], ['Alt+Y', '커서부터 줄 끝까지 지우기'], ['Ctrl+Enter', '쪽 나누기'], ['Shift+Enter', '줄 나누기 (문단 안에서)'], ['Tab', '탭'], ['Shift+Tab', '커서 위치까지 내어쓰기'], ['Ctrl+F', '찾기'], ['Ctrl+H / Ctrl+F2', '찾아 바꾸기'], ['Ctrl+L', '다시 찾기'], ['Ctrl+F10', '문자표'], ['Alt+C', '모양 복사 (한 번 누르면 복사, 블록 잡고 다시 누르면 붙이기)'], ['Ctrl+← / Ctrl+→', '고른 그림 줄이기 · 키우기 (손잡이를 끌지 않고)']])}
      ${sec('입력', [['Ctrl+N , T', '표 만들기'], ['Ctrl+N , I', '그림 넣기'], ['Ctrl+N , P', '쪽 번호 매기기'], ['Ctrl+N , H', '머리말/꼬리말'], ['Ctrl+Alt+N , 글자', '위와 같음 (브라우저 탭에서 Ctrl+N 대신)'], ['F7', '편집 용지']])}
      ${window.PWA && PWA.standalone ? '<div class="kbnote ok">앱 창에서 열었으므로 <kbd>Ctrl</kbd>+<kbd>N</kbd> 다음 글자, <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>T</kbd> 도 한글과 똑같이 됩니다.</div>' : `<div class="kbnote"><b>브라우저 탭에서 안 되는 키</b> — 크롬·엣지는 <kbd>Ctrl</kbd>+<kbd>N</kbd>(새 창)과 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>T</kbd>(닫은 탭 다시 열기)를 먼저 가져갑니다.<br>· 대신 <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd> 다음 글자, 배분 정렬은 <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>T</kbd> 를 누르세요.<br>· <b>앱으로 설치해 열면</b> 한글과 같은 키가 그대로 됩니다.</div>`}
    </div><div>
      ${sec('글자 · 문단', [['Alt+L', '글자 모양'], ['Alt+T', '문단 모양'], ['F6', '스타일'], ['Ctrl+1 ~ 9', '바탕글 · 본문 · 개요 1~7'], ['Ctrl+B / Ctrl+I / Ctrl+U', '진하게 · 기울임 · 밑줄'], ['Alt+Shift+B / I / U', '진하게 · 기울임 · 밑줄 (한글 방식)'], ['Alt+Shift+E / Alt+Shift+R', '글자 크게 · 작게 (1pt)'], ['Ctrl+] / Ctrl+[', '글자 크게 · 작게 (1pt)'], ['Alt+Shift+W / Alt+Shift+N', '자간 넓게 · 좁게'], ['Alt+Shift+K / Alt+Shift+J', '장평 넓게 · 좁게'], ['Alt+Shift+Z / Alt+Shift+A', '줄 간격 넓게 · 좁게'], ['Ctrl+Shift+L / C / R', '왼쪽 · 가운데 · 오른쪽 정렬'], ['Ctrl+Shift+M', '양쪽 정렬'], ['Ctrl+Shift+T / Ctrl+Alt+T', '배분 정렬']])}
      ${sec('표', [['Tab / Shift+Tab', '다음 · 앞 셀 (마지막 셀에서 Tab: 줄 추가)'], ['Ctrl+Enter', '아래에 줄 추가'], ['Alt+Insert', '줄/칸 추가하기'], ['Alt+Delete', '줄/칸 지우기'], ['F5', '셀 블록 (한 번 더: 방향키로 넓히기, 세 번: 표 전체)'], ['Shift+방향키', '셀 블록 넓히기'], ['M / S', '셀 합치기 · 나누기 (셀 블록에서)'], ['W / H', '셀 너비 · 높이 같게'], ['L / C', '셀 테두리/배경'], ['Ctrl+방향키', '셀 크기 조절 (셀 블록에서)'], ['Delete', '셀 내용 지우기 (셀 블록에서)'], ['Enter / Esc', '셀 블록 풀기']])}
      ${sec('보기', [['Ctrl+마우스 휠', '확대 · 축소'], ['Esc', '찾기 창 닫기'], ['F1', '이 도움말']])}
    </div></div>`, { foot: '<button class="tb primary" data-x="cancel">닫기</button>', width: 860, noEnter: true });
  }

  /* ---------- 시작 ---------- */
  doc.addEventListener('keyup', () => window.onSelChange());
  window.__hwp = { W, GUEST, act, openBytes, openFile, openDialog, newDoc, loadDoc, save, build, dialog, askConfirm, askText, tell, boxEnsure, boxRun, connectDialog, confirmDiscard, updateState, dropDone, bestReady, bestOpen, bestUpload, bestStructDialog, bestEditDialog, helpDialog, setName, deviceName, fmtKB, popMenu, closePop };
  (async () => {
    GH.load();
    $id('selZoom').value = '1';
    const q = new URLSearchParams(location.search);
    // 앱으로 설치한 뒤 탐색기에서 hwpx 를 더블클릭하면 여기로 파일이 넘어옴 (같은 파일에 바로 저장됨)
    let launched = false;
    if ('launchQueue' in window) window.launchQueue.setConsumer(async p => {
      if (!p.files || !p.files.length) return;
      launched = true; const h = p.files[0];
      try { await openFile(await h.getFile(), h); } catch (e) { tell('파일을 열 수 없습니다', e.message); }
    });
    if (q.get('new') === '1' && !GUEST) { loadDoc(HwpxDoc.blank(), { name: '새 문서' }); return; }
    // home.js 는 이 파일 뒤에 읽히므로 문서가 다 읽힌 뒤에 (타이머만으로는 home.js 보다 먼저 깨어날 수 있음)
    if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    await new Promise(r => setTimeout(r, 0));
    if (!launched && !W.doc) HwpHome.show();
  })();
})();
