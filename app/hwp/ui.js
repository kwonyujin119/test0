/* 한글 작업장 — 화면 · 단축키 · 대화상자 · 파일 */
(() => {
  const doc = docEl();
  const H = () => W.doc.header;
  const escH = s => esc(s);
  let savedRange = null;
  const keepSel = () => { const r = rng(); if (r && inDoc(r.startContainer)) savedRange = r.cloneRange(); };
  const backSel = () => { if (savedRange && savedRange.startContainer.isConnected) { const s = sel(); s.removeAllRanges(); s.addRange(savedRange); focusFor(savedRange.startContainer); } };

  /* ---------- 대화상자 ---------- */
  function dialog(title, body, opts) {
    opts = opts || {};
    keepSel();
    const bg = document.createElement('div'); bg.className = 'dlg-bg';
    bg.innerHTML = `<div class="dlg" role="dialog" style="${opts.width ? 'width:' + opts.width + 'px' : ''}"><h3>${title}</h3><div class="body">${body}</div><div class="foot">${opts.foot != null ? opts.foot : `<button class="tb" data-x="cancel">취소</button><button class="tb primary" data-x="ok">${opts.okText || '설정'}</button>`}</div></div>`;
    document.body.appendChild(bg);
    const q = s => bg.querySelector(s);
    const close = (restore) => { bg.remove(); document.removeEventListener('keydown', onKey, true); if (restore !== false) backSel(); if (opts.onClose) opts.onClose(); };
    const ok = async () => { if (opts.onOk) { const r = await opts.onOk(q, close); if (r === false) return; } close(); };
    const onKey = e => {
      if (!bg.isConnected) return;
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

  /* ---------- 문서 열기/만들기 ---------- */
  function setName(n) { W.name = n || '새 문서'; $id('docName').textContent = W.name; document.title = W.name + ' — 한글 작업장'; }
  function loadDoc(d, meta) {
    meta = meta || {};
    clearCells(true); hidePic();
    W.doc = d; W.handle = meta.handle || null; W.boxId = meta.boxId || null; W.draftId = meta.draftId || ('d' + Date.now().toString(36));
    d.header.onAdd = (kind, id) => addRule(kind, id);
    rebuildCss();
    doc.replaceChildren(d.render());
    d.sealSigs(doc);
    UNDO.stack.length = 0; UNDO.redo.length = 0; UNDO.cur = null; UNDO.bytes = 0;
    setName(meta.name || d.title || '새 문서');
    W.dirty = !!meta.dirty; updateState();
    fillStyles(); fillFonts();
    $id('start').hidden = true;
    layout();
    const first = doc.querySelector('.hsec > .hp'); if (first) { doc.focus({ preventScroll: true }); caretToStart(first); }
    $id('canvas').scrollTop = 0;
    if (meta.dirty) scheduleDraft();
  }
  async function openBytes(buf, meta) {
    try { const d = await HwpxDoc.open(buf); loadDoc(d, meta); toast(`"${meta.name}" 을(를) 열었습니다`); return true; }
    catch (e) { console.error(e); alert('문서를 열 수 없습니다.\n\n' + e.message); return false; }
  }
  async function openFile(file, handle) {
    if (!file) return;
    if (/\.hwp$/i.test(file.name)) { alert('.hwp(옛 형식) 파일은 바로 열 수 없습니다.\n\n한글에서 [파일 → 다른 이름으로 저장 → 파일 형식: 한글 표준 문서(*.hwpx)] 로 저장한 뒤 그 파일을 열어 주세요.'); return; }
    if (!(await confirmDiscard())) return;
    const buf = await file.arrayBuffer();
    await openBytes(buf, { name: file.name.replace(/\.hwpx$/i, ''), handle });
  }
  async function confirmDiscard() {
    if (!W.doc || !W.dirty) return true;
    return confirm(`"${W.name}" 에 저장하지 않은 내용이 있습니다.\n그래도 다른 문서를 열까요? (임시 저장본은 시작 화면에서 다시 열 수 있습니다)`);
  }
  async function newDoc() { if (!(await confirmDiscard())) return; loadDoc(HwpxDoc.blank(), { name: '새 문서' }); }
  async function openDialog() {
    const p = await HwpStore.pickOpen().catch(e => { alert(e.message); return null; });
    if (p) await openFile(p.file, p.handle);
  }

  /* ---------- 저장 ---------- */
  let saving = false;
  async function build() { tidyAll(); return W.doc.save(doc); }
  function tidyAll() { for (const b of doc.querySelectorAll('.hp')) { const brs = b.querySelectorAll(':scope > br:not([data-lb])'); if (brs.length > 1) brs.forEach((x, i) => { if (i < brs.length - 1 && !x.nextSibling) x.remove(); }); } }
  const fileName = () => (W.name || '문서').replace(/[\\/:*?"<>|]/g, '_') + '.hwpx';
  async function save(as) {
    if (!W.doc || saving) return;
    saving = true; setState('저장 중…');
    try {
      const blob = await build();
      if (!as && W.boxId) { await HwpStore.box.save(W.boxId, W.name, blob, deviceName()); done('문서함에 저장했습니다'); }
      else if (!as && W.handle) { await HwpStore.writeHandle(W.handle, blob); done('내 PC 파일에 저장했습니다'); }
      else if (as === 'box') { await boxSaveCurrent(blob); }
      else {
        const h = await HwpStore.pickSave(fileName(), blob);
        if (h === false) { setState(''); updateState(); return; }
        if (h) { W.handle = h; W.boxId = null; if (h.name) setName(h.name.replace(/\.hwpx$/i, '')); done('내 PC 에 저장했습니다'); }
        else done('내려받기 폴더에 저장했습니다 (' + fileName() + ')');
      }
    } catch (e) { console.error(e); setState(''); updateState(); alert('저장하지 못했습니다.\n\n' + e.message); }
    finally { saving = false; }
    function done(msg) { W.dirty = false; updateState(); toast(msg, 2600); HwpStore.drafts.del(W.draftId); }
  }
  function saveAsMenu() {
    dialog('다른 이름으로 저장', `<div class="grid1"><label>파일 이름</label><input id="sa_nm" value="${escH(W.name)}"></div>
      <div class="info" style="margin-top:12px">· <b>내 PC</b>: hwpx 파일로 저장합니다. 한글에서 바로 열립니다.<br>· <b>문서함</b>: 암호화해서 GitHub 문서함에 올립니다. 집·사무실 어디서나 엽니다.</div>`, {
      foot: `<button class="tb" data-x="cancel">취소</button><button class="tb" id="sa_box">🔒 문서함에 저장</button><button class="tb primary" id="sa_pc">💾 내 PC 에 저장</button>`,
      init: (q, close) => {
        const nm = () => { const v = q('#sa_nm').value.trim(); if (v) setName(v); };
        q('#sa_pc').onclick = () => { nm(); close(false); save('pc'); };
        q('#sa_box').onclick = () => { nm(); close(false); save('box'); };
      }, noEnter: true });
  }
  function deviceName() { const ua = navigator.userAgent; return /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : ''; }
  function setState(t) { $id('saveState').textContent = t; }
  function updateState() {
    const s = $id('saveState'); s.classList.toggle('dirty', W.dirty);
    const where = W.boxId ? '문서함' : W.handle ? '내 PC 파일' : '저장 안 됨';
    s.textContent = W.dirty ? '● 수정됨' : (W.boxId || W.handle ? '저장됨' : '');
    $id('stSaved').textContent = W.doc ? '저장 위치: ' + where : '';
  }
  window.onDocChanged = () => { if (!W.dirty) { W.dirty = true; } updateState(); scheduleDraft(); };
  let draftT = null, buildMs = 0;
  // 큰 문서는 저장 준비에 시간이 걸리므로 임시 저장 간격을 늘림 (입력이 끊기지 않게)
  function scheduleDraft() { clearTimeout(draftT); draftT = setTimeout(saveDraft, Math.max(4000, buildMs * 15)); }
  async function saveDraft() {
    if (!W.doc || !W.dirty || saving) return;
    try { const t = performance.now(); const blob = await build(); buildMs = performance.now() - t; await HwpStore.drafts.put(W.draftId, W.name, blob, { boxId: W.boxId }); } catch (e) { console.warn('임시 저장 실패', e); }
  }
  window.addEventListener('beforeunload', e => { if (W.doc && W.dirty) { saveDraft(); e.preventDefault(); e.returnValue = ''; } });

  /* ---------- 문서함 ---------- */
  async function boxSaveCurrent(blob) {
    if (!(await boxEnsure())) { setState(''); updateState(); return; }
    W.boxId = await HwpStore.box.save(W.boxId, W.name, blob || await build(), deviceName());
    W.handle = null; W.dirty = false; updateState(); HwpStore.drafts.del(W.draftId);
    toast('문서함에 저장했습니다 — 다른 PC 에서도 이 문서를 열 수 있습니다', 3000);
  }
  function connectDialog() {
    return new Promise(res => {
      const c = GH.cfg || GH.detect() || { owner: 'kwonyujin119', repo: 'test0', branch: 'main' };
      dialog('GitHub 연결', `<div class="info">문서함은 GitHub 저장소 <b>${escH(c.owner)}/${escH(c.repo)}</b> 의 <code>hwp/</code> 폴더에 <b>암호화된 파일</b>로 보관합니다. 교안 작업장과 같은 토큰을 씁니다 (교안 작업장에서 이미 연결했다면 같은 브라우저에서는 다시 할 필요가 없습니다).</div>
        <div class="grid1" style="margin-top:12px"><label>저장소</label><div style="display:flex;gap:6px"><input id="g_o" value="${escH(c.owner)}"><span>/</span><input id="g_r" value="${escH(c.repo)}"></div>
        <label>토큰</label><input id="g_t" type="password" placeholder="github_pat_…" autocomplete="off"></div>
        <p class="muted" style="font-size:12px;line-height:1.6">토큰 만들기: github.com/settings/personal-access-tokens/new → Repository access: <b>${escH(c.repo)}</b> → Permissions: <b>Contents: Read and write</b></p>`, {
        okText: '연결',
        onOk: async (q) => {
          const cfg = { owner: q('#g_o').value.trim(), repo: q('#g_r').value.trim(), branch: c.branch || 'main', token: q('#g_t').value.trim() };
          if (!cfg.owner || !cfg.repo || !cfg.token) { alert('저장소와 토큰을 입력하세요'); return false; }
          GH.save(cfg);
          try { const r = await GH.check(); if (!r.push) { alert('이 토큰으로는 저장소에 쓸 수 없습니다 (Contents: Read and write 권한 필요)'); return false; } }
          catch (e) { alert(e.message); return false; }
          res(true);
        }, onClose: () => res(!!(GH.cfg && GH.token)) });
    });
  }
  async function boxEnsure() {
    if (!HwpStore.box.ready()) { if (!(await connectDialog())) return false; }
    if (HwpStore.box.unlocked || await HwpStore.box.restoreKey()) return true;
    let exists = false; try { exists = await HwpStore.box.exists(); } catch (e) { alert(e.message); return false; }
    return new Promise(res => {
      dialog(exists ? '문서함 열기' : '문서함 만들기', `${exists ? '<p style="margin-top:0">문서함 암호를 입력하세요.</p>' : `<div class="warn">처음 한 번 문서함 암호를 정합니다. 문서는 이 암호로 <b>브라우저 안에서 암호화</b>된 뒤 올라가므로, 저장소가 공개여도 내용과 파일 이름은 보이지 않습니다.<br><b>암호를 잊으면 누구도(저도) 문서를 되살릴 수 없습니다.</b> 꼭 기억해 두세요.</div>`}
        <div class="grid1" style="margin-top:12px"><label>암호</label><input id="b_p" type="password" autocomplete="off">${exists ? '' : '<label>암호 확인</label><input id="b_p2" type="password" autocomplete="off">'}</div>
        <label class="chk" style="display:flex;gap:6px;margin-top:10px"><input type="checkbox" id="b_rm" checked> 이 기기에서 암호 기억하기 (개인 PC 에서만)</label>`, {
        okText: exists ? '열기' : '만들기',
        onOk: async (q) => {
          const p = q('#b_p').value;
          if (p.length < 6) { alert('암호는 6자 이상으로 해 주세요'); return false; }
          if (!exists && p !== q('#b_p2').value) { alert('두 암호가 다릅니다'); return false; }
          try { await HwpStore.box.unlock(p, q('#b_rm').checked); } catch (e) { alert(e.message); return false; }
          res(true);
        }, onClose: () => res(HwpStore.box.unlocked) });
    });
  }
  async function boxDialog() {
    if (!(await boxEnsure())) return;
    const d = dialog('🔒 문서함', '<div id="bx" class="muted">불러오는 중…</div>', {
      width: 720,
      foot: `<button class="tb" id="bx_lock" title="이 기기에 기억한 암호를 지웁니다">잠그기</button><span class="grow"></span><button class="tb" id="bx_up">PC 파일 올리기</button>${W.doc ? '<button class="tb" id="bx_cur">현재 문서 저장</button>' : ''}<button class="tb" data-x="cancel">닫기</button>`,
      noEnter: true,
    });
    const q = d.q;
    q('#bx_lock').onclick = () => { HwpStore.box.lock(); d.close(); toast('문서함을 잠갔습니다'); };
    if (q('#bx_cur')) q('#bx_cur').onclick = async () => { d.close(); await boxSaveCurrent(); };
    q('#bx_up').onclick = async () => {
      const p = await HwpStore.pickOpen().catch(() => null); if (!p) return;
      try { q('#bx').textContent = '올리는 중…'; await HwpStore.box.save(null, p.file.name.replace(/\.hwpx$/i, ''), p.file, deviceName()); toast('문서함에 올렸습니다'); render(); } catch (e) { alert(e.message); render(); }
    };
    async function render() {
      let items;
      try { items = await HwpStore.box.list(); } catch (e) { q('#bx').textContent = e.message; return; }
      if (!items.length) { q('#bx').innerHTML = '<p>문서함이 비어 있습니다. <b>현재 문서 저장</b> 또는 <b>PC 파일 올리기</b> 로 시작하세요.</p>'; return; }
      q('#bx').innerHTML = `<table class="boxlist">${items.map(it => `<tr data-id="${escH(it.id)}"><td class="nm2">${escH(it.name)}${it.id === W.boxId ? ' <span class="muted">(지금 여는 중)</span>' : ''}</td><td class="muted">${new Date(it.modified).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}${it.device ? ' · ' + escH(it.device) : ''}</td><td class="muted">${Math.max(1, Math.round(it.size / 1024))} KB</td><td style="white-space:nowrap;text-align:right"><button class="tb" data-b="open">열기</button><button class="tb" data-b="dl" title="hwpx 로 내려받기">내려받기</button><button class="tb" data-b="ren">이름</button><button class="tb danger" data-b="del">삭제</button></td></tr>`).join('')}</table>`;
      q('#bx').onclick = async e => {
        const b = e.target.closest('[data-b]'); if (!b) return; const tr = b.closest('tr'); const id = tr.dataset.id; const it = items.find(x => x.id === id);
        try {
          if (b.dataset.b === 'open') { if (!(await confirmDiscard())) return; b.textContent = '여는 중…'; const u = await HwpStore.box.load(id); d.close(false); await openBytes(u.buffer, { name: it.name, boxId: id }); }
          if (b.dataset.b === 'dl') { const u = await HwpStore.box.load(id); HwpStore.download(it.name + '.hwpx', new Blob([u], { type: 'application/hwp+zip' })); }
          if (b.dataset.b === 'ren') { const n = prompt('새 이름', it.name); if (n && n.trim()) { await HwpStore.box.rename(id, n.trim()); if (id === W.boxId) setName(n.trim()); render(); } }
          if (b.dataset.b === 'del') { if (confirm(`"${it.name}" 을(를) 문서함에서 지울까요?\n(GitHub 기록에는 암호화된 상태로 남습니다)`)) { await HwpStore.box.remove(id); if (id === W.boxId) { W.boxId = null; updateState(); } render(); } }
        } catch (er) { alert(er.message); }
      };
    }
    render();
  }

  /* ---------- 시작 화면 ---------- */
  async function showStart() {
    $id('start').hidden = false;
    const list = await HwpStore.drafts.list();
    const box = $id('draftList');
    if (!list.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<h4>임시 저장된 문서 (이 브라우저)</h4>${list.slice(0, 8).map(x => `<div class="dl-item" data-id="${escH(x.id)}"><span class="nm2">📝 ${escH(x.name)}</span><span class="muted">${new Date(x.time).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}</span><button class="tb" data-d="open">이어서 편집</button><button class="tb danger" data-d="del">지우기</button></div>`).join('')}`;
    box.onclick = async e => {
      const b = e.target.closest('[data-d]'); if (!b) return; const id = b.closest('.dl-item').dataset.id;
      if (b.dataset.d === 'del') { await HwpStore.drafts.del(id); showStart(); return; }
      const x = await HwpStore.drafts.get(id); if (!x) return;
      await openBytes(await x.blob.arrayBuffer(), { name: x.name, draftId: id, boxId: x.boxId || null, dirty: true });
    };
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
  const closeFontPanel = () => { $id('fontPanel').hidden = true; };
  $id('btnFont').addEventListener('mousedown', e => { e.preventDefault(); keepSel(); });
  $id('btnFont').addEventListener('click', () => { if ($id('fontPanel').hidden) openFontPanel(); else closeFontPanel(); });
  $id('fontQ').addEventListener('input', e => drawFonts(e.target.value));
  $id('fontQ').addEventListener('keydown', e => { if (e.key === 'Escape') { closeFontPanel(); backSel(); } if (e.key === 'Enter' && !e.isComposing) { const b = $id('fontItems').querySelector('button'); if (b) b.click(); } });
  $id('fontItems').addEventListener('mousedown', e => e.preventDefault());
  $id('fontItems').addEventListener('click', e => { const b = e.target.closest('[data-face]'); if (!b) return; closeFontPanel(); $id('inFont').value = b.dataset.face; backSel(); applyCp({ face: b.dataset.face }); });
  document.addEventListener('mousedown', e => { if (!$id('fontPanel').hidden && !e.target.closest('#fontPanel,#btnFont')) closeFontPanel(); });
  // 웹 글꼴을 다 받으면 글자 폭이 바뀌므로 쪽 나누기 다시 계산
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { if (W.doc) changed(true); });
  const LS_OPTS = [100, 115, 130, 150, 160, 180, 200, 250, 300];
  $id('selLs').innerHTML = LS_OPTS.map(v => `<option value="${v}">${v}%</option>`).join('');
  let raf = 0;
  window.onSelChange = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(refreshRibbon); };
  function refreshRibbon() {
    if (!W.doc) return;
    const r = rng(); const inside = W.cells || (r && inDoc(r.startContainer));
    if (!inside) return;
    const c = H().cp(selCp()); const p = H().pp(selPp());
    if (document.activeElement !== $id('inFont')) $id('inFont').value = c.faceH || c.faceL || '';
    if (document.activeElement !== $id('inSize')) $id('inSize').value = +(c.height / 100).toFixed(1);
    const on = (a, v) => { const b = document.querySelector(`#ribbon [data-act="${a}"]`); if (b) b.classList.toggle('on', !!v); };
    on('bold', c.bold); on('italic', c.italic); on('underline', c.underline); on('strike', c.strike); on('sup', c.sup); on('sub', c.sub);
    on('alJ', p.align === 'JUSTIFY'); on('alL', p.align === 'LEFT'); on('alC', p.align === 'CENTER'); on('alR', p.align === 'RIGHT'); on('alD', /DISTRIBUTE/.test(p.align));
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
  window.onLayout = () => { status(); clearTimeout(status._c); status._c = setTimeout(() => { $id('stChars').textContent = (doc.innerText || '').replace(/\s/g, '').length.toLocaleString() + '자'; }, 600); if (W.selPic) placePicHandle(); };
  document.addEventListener('selectionchange', () => { if (!W.doc) return; window.onSelChange(); });

  /* ---------- 리본 입력 ---------- */
  const ribbon = $id('top');
  ribbon.addEventListener('mousedown', e => { if (e.target.closest('button,.clr')) { keepSel(); if (!e.target.closest('.clr')) e.preventDefault(); } });
  ribbon.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });
  $id('status').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });
  $id('start').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });
  for (const id of ['selStyle', 'inFont', 'inSize', 'selLs', 'selVa']) $id(id).addEventListener('focus', keepSel);
  $id('selStyle').addEventListener('change', e => { backSel(); applyStyle(e.target.value); });
  const fontApply = () => { const v = $id('inFont').value.trim(); if (!v) return; backSel(); applyCp({ face: v }); };
  $id('inFont').addEventListener('change', fontApply);
  $id('inFont').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fontApply(); } if (e.key === 'Escape') backSel(); });
  const sizeApply = () => { const v = parseFloat($id('inSize').value); if (!(v > 0)) return; backSel(); applyCp({ height: Math.round(v * 100) }); };
  $id('inSize').addEventListener('change', sizeApply);
  $id('inSize').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sizeApply(); } if (e.key === 'Escape') backSel(); });
  $id('selLs').addEventListener('change', e => { backSel(); applyPp({ lsType: 'PERCENT', ls: +e.target.value }); });
  $id('selVa').addEventListener('change', e => { backSel(); cellAlign(curCells(), e.target.value); });
  $id('inColor').addEventListener('input', e => { e.target.parentElement.querySelector('span').style.setProperty('--sw', e.target.value); });
  $id('inColor').addEventListener('change', e => { backSel(); applyCp({ color: e.target.value.toUpperCase() }); });
  $id('inShade').addEventListener('change', e => { backSel(); applyCp({ shade: e.target.value.toUpperCase() }); });
  $id('inShade').addEventListener('input', e => { e.target.parentElement.querySelector('span').style.setProperty('--sw', e.target.value); });
  $id('inCellFill').addEventListener('change', e => { backSel(); cellFill(curCells(), e.target.value.toUpperCase()); });
  $id('selZoom').addEventListener('change', e => setZoom(e.target.value));
  $id('docName').addEventListener('click', () => { const n = prompt('문서 이름', W.name); if (n && n.trim()) { setName(n.trim()); if (W.doc) { W.dirty = true; updateState(); } } });

  function curCells() {
    if (W.cells && W.cells.size) return Array.from(W.cells);
    const r = savedRange || rng(); const td = r && cellOf(r.startContainer); return td ? [td] : [];
  }
  function needDoc() { if (!W.doc) { toast('먼저 문서를 새로 만들거나 여세요'); return false; } return true; }

  /* ---------- 명령 ---------- */
  const ALIGN = { alJ: 'JUSTIFY', alL: 'LEFT', alC: 'CENTER', alR: 'RIGHT', alD: 'DISTRIBUTE' };
  function act(a) {
    if (a === 'new') return newDoc();
    if (a === 'open') return openDialog();
    if (a === 'box') return boxDialog();
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
      case 'rowAbove': case 'rowBelow': case 'colLeft': case 'colRight': case 'rowDel': case 'colDel': case 'merge': case 'split': case 'eqW': case 'eqH': case 'cellFillNone': case 'cellDlg': case 'tableDel': return tableAct(a);
      case 'zoomIn': return setZoom(Math.min(4, +(W.zoom + 0.1).toFixed(2)));
      case 'zoomOut': return setZoom(Math.max(0.3, +(W.zoom - 0.1).toFixed(2)));
    }
  }
  function tableAct(a) {
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
      case 'tableDel': if (confirm('이 표를 지울까요?')) deleteTable(td.closest('table.htb')); return;
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

  /* ---------- 확대/축소 ---------- */
  function setZoom(v) {
    const cv = $id('canvas'); const pg = W.doc ? W.doc.page(0) : { w: 59528, h: 84188 };
    if (v === 'fit') v = Math.min((cv.clientWidth - 60) / (pg.w / HU), (cv.clientHeight - 40) / (pg.h / HU));
    else if (v === 'width') v = (cv.clientWidth - 70) / (pg.w / HU);
    W.zoom = Math.max(0.3, Math.min(4, +v)); applyZoom();
    const z = $id('selZoom'); const o = Array.from(z.options).find(x => Math.abs(+x.value - W.zoom) < 0.001); if (o) z.value = o.value; else { let c = z.querySelector('option[data-cur]'); if (!c) { c = document.createElement('option'); c.dataset.cur = '1'; z.insertBefore(c, z.firstChild); } c.value = W.zoom; c.textContent = Math.round(W.zoom * 100) + '%'; z.value = c.value; }
    if (W.selPic) placePicHandle();
  }
  $id('canvas').addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); setZoom(W.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }, { passive: false });

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
  doc.addEventListener('focusin', e => { if (!W.doc) return; });

  /* ---------- 마우스: 셀 블록 · 너비 조절 · 그림 ---------- */
  let drag = null;
  function edgeOf(td, e) {
    const rc = td.getBoundingClientRect(); const z = 5;
    if (Math.abs(e.clientX - rc.right) <= z) return { td, kind: 'col' };
    if (Math.abs(e.clientY - rc.bottom) <= z) return { td, kind: 'row' };
    return null;
  }
  doc.addEventListener('mousemove', e => {
    if (drag) return;
    const td = e.target.closest && e.target.closest('td'); const ed = td && edgeOf(td, e);
    doc.classList.toggle('colrs', !!(ed && ed.kind === 'col')); doc.classList.toggle('rowrs', !!(ed && ed.kind === 'row'));
  });
  doc.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    const pic = e.target.closest('.isl.pic');
    if (pic) { e.preventDefault(); selectPic(pic); return; }
    hidePic();
    const td = e.target.closest('td');
    const ed = td && edgeOf(td, e);
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
    const p = W.selPic; const h = $id('picHandle'); if (!p || !p.isConnected) { hidePic(); return; }
    const s = $id('sheet').getBoundingClientRect(), r = p.getBoundingClientRect();
    h.style.left = ((r.right - s.left) / W.zoom - 6) + 'px'; h.style.top = ((r.bottom - s.top) / W.zoom - 6) + 'px'; h.hidden = false;
  }
  $id('picHandle').addEventListener('mousedown', e => { if (!W.selPic) return; e.preventDefault(); e.stopPropagation(); const p = W.selPic; const w0 = p.getBoundingClientRect().width / W.zoom; drag = { kind: 'pic', pic: p, x: e.clientX, w0, ratio: (p.getBoundingClientRect().height / W.zoom) / w0 }; });
  function deletePic() { const p = W.selPic; if (!p) return; const b = blockOf(p); hidePic(); edit(b, b, () => { const nx = p.nextSibling; p.remove(); ensureBr(b); if (nx && nx.isConnected) placeCaret(nx.parentNode, Array.prototype.indexOf.call(nx.parentNode.childNodes, nx)); else caretToEnd(b); }); }
  async function pickImage() {
    keepSel();
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
    inp.onchange = async () => { backSel(); for (const f of inp.files) await insertImageFile(f); };
    inp.click();
  }

  /* ---------- 끌어다 놓기 ---------- */
  let dragDepth = 0;
  window.addEventListener('dragenter', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) { dragDepth++; $id('dropMask').hidden = false; } });
  window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $id('dropMask').hidden = true; });
  window.addEventListener('dragover', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) e.preventDefault(); });
  window.addEventListener('drop', async e => {
    dragDepth = 0; $id('dropMask').hidden = true;
    const files = Array.from(e.dataTransfer ? e.dataTransfer.files : []); if (!files.length) return;
    e.preventDefault();
    const hw = files.find(f => /\.hwpx?$/i.test(f.name));
    if (hw) { let handle = null; try { const it = Array.from(e.dataTransfer.items).find(i => i.kind === 'file'); if (it && it.getAsFileSystemHandle) handle = await it.getAsFileSystemHandle(); } catch (er) { } await openFile(hw, handle && handle.kind === 'file' ? handle : null); return; }
    if (!W.doc) return;
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
    'ctrl+shift+m': () => applyPp({ align: 'JUSTIFY' }), 'ctrl+shift+t': () => applyPp({ align: 'DISTRIBUTE' }),
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
  document.addEventListener('keydown', e => {
    if (document.querySelector('.dlg-bg')) return; // 대화상자가 처리
    const k = keyName(e);
    if (e.isComposing || e.keyCode === 229) return; // 한글 조합 중에는 손대지 않음 (조합이 끝난 뒤 다시 들어옴)
    if (k === 'esc') { if (!$id('findBar').hidden) { closeFind(); e.preventDefault(); return; } if (W.cells) { const a = W.cellAnchor; clearCells(); if (a) caretToEnd(a.querySelector('.hp')); e.preventDefault(); return; } if (W.selPic) { hidePic(); return; } setChord(null); return; }
    if (!W.doc) { if (MAP[k] && /^(ctrl\+o|alt\+o|alt\+n|f1)$/.test(k)) { e.preventDefault(); MAP[k](); } return; }
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
    const r = rng(); const td = r && cellOf(r.startContainer);
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
  });
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
  $id('fRep').onclick = () => { backSel(); const q = $id('fq').value; if (!replaceSel(q, $id('fr').value)) { /* 선택이 없으면 먼저 찾기 */ } findAgain(false); };
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
        markSecDirty(sec); W.dirty = true; updateState(); scheduleDraft(); layout();
      } });
  }
  function markSecDirty(si) { /* 구역 설정은 원본 XML 을 직접 고치므로 문단 비교와 무관 — 저장 때 그대로 반영됨 */ }
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
    const tabs = Object.keys(SYMS); let cur = localStorage.getItem('hwp:symtab') || tabs[0]; if (!SYMS[cur]) cur = tabs[0];
    dialog('문자표', `<div class="symtabs">${tabs.map(t => `<button class="tb ${t === cur ? 'on' : ''}" data-t="${t}">${t}</button>`).join('')}</div><div class="sym" id="sy"></div><p class="muted" style="font-size:12px;margin-bottom:0">글자를 누르면 커서 위치에 넣습니다.</p>`, {
      foot: '<button class="tb" data-x="cancel">닫기</button>', noEnter: true, width: 560,
      init: (q, close) => {
        const draw = () => { q('#sy').innerHTML = Array.from(new Set(Array.from(SYMS[cur]))).map(ch => `<button data-ch="${ch}">${ch}</button>`).join(''); q('.symtabs').querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === cur)); };
        q('.symtabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; cur = b.dataset.t; localStorage.setItem('hwp:symtab', cur); draw(); });
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
      ${sec('편집', [['Ctrl+Z', '되돌리기'], ['Ctrl+Shift+Z', '다시 실행'], ['Ctrl+X / Ctrl+C / Ctrl+V', '오려 두기 · 복사 · 붙이기'], ['Ctrl+Y', '한 줄 지우기'], ['Alt+Y', '커서부터 줄 끝까지 지우기'], ['Ctrl+Enter', '쪽 나누기'], ['Shift+Enter', '줄 나누기 (문단 안에서)'], ['Tab', '탭'], ['Shift+Tab', '커서 위치까지 내어쓰기'], ['Ctrl+F / Ctrl+H', '찾기 · 찾아 바꾸기'], ['Ctrl+L', '다시 찾기'], ['Ctrl+F10', '문자표'], ['Alt+C', '모양 복사 (한 번 누르면 복사, 블록 잡고 다시 누르면 붙이기)']])}
      ${sec('입력', [['Ctrl+N , T', '표 만들기'], ['Ctrl+N , I', '그림 넣기'], ['Ctrl+N , P', '쪽 번호 매기기'], ['Ctrl+N , H', '머리말/꼬리말'], ['F7', '편집 용지']])}
      <p class="muted" style="font-size:12px">크롬·엣지가 Ctrl+N 을 새 창 열기로 먼저 가로채면 <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd> 다음 글자를 누르세요.</p>
    </div><div>
      ${sec('글자 · 문단', [['Alt+L', '글자 모양'], ['Alt+T', '문단 모양'], ['F6', '스타일'], ['Ctrl+1 ~ 9', '바탕글 · 본문 · 개요 1~7'], ['Ctrl+B / Ctrl+I / Ctrl+U', '진하게 · 기울임 · 밑줄'], ['Alt+Shift+E / Alt+Shift+R', '글자 크게 · 작게 (1pt)'], ['Alt+Shift+W / Alt+Shift+N', '자간 넓게 · 좁게'], ['Alt+Shift+K / Alt+Shift+J', '장평 넓게 · 좁게'], ['Alt+Shift+Z / Alt+Shift+A', '줄 간격 넓게 · 좁게'], ['Ctrl+Shift+L / C / R', '왼쪽 · 가운데 · 오른쪽 정렬'], ['Ctrl+Shift+M', '양쪽 정렬'], ['Ctrl+Shift+T', '배분 정렬 (브라우저가 막으면 리본 단추)']])}
      ${sec('표', [['Tab / Shift+Tab', '다음 · 앞 셀 (마지막 셀에서 Tab: 줄 추가)'], ['Ctrl+Enter', '아래에 줄 추가'], ['Alt+Insert', '줄/칸 추가하기'], ['Alt+Delete', '줄/칸 지우기'], ['F5', '셀 블록 (한 번 더: 방향키로 넓히기, 세 번: 표 전체)'], ['Shift+방향키', '셀 블록 넓히기'], ['M / S', '셀 합치기 · 나누기 (셀 블록에서)'], ['W / H', '셀 너비 · 높이 같게'], ['L', '셀 테두리/배경'], ['Ctrl+방향키', '셀 크기 조절'], ['Esc', '셀 블록 풀기']])}
      ${sec('보기', [['Ctrl+마우스 휠', '확대 · 축소'], ['F1', '이 도움말']])}
    </div></div>`, { foot: '<button class="tb primary" data-x="cancel">닫기</button>', width: 860, noEnter: true });
  }

  /* ---------- 시작 ---------- */
  doc.addEventListener('keyup', () => window.onSelChange());
  window.__hwp = { W, act, openBytes, loadDoc, save, build };
  (async () => {
    GH.load();
    $id('selZoom').value = '1';
    const q = new URLSearchParams(location.search);
    // 앱으로 설치한 뒤 탐색기에서 hwpx 를 더블클릭하면 여기로 파일이 넘어옴 (같은 파일에 바로 저장됨)
    let launched = false;
    if ('launchQueue' in window) window.launchQueue.setConsumer(async p => {
      if (!p.files || !p.files.length) return;
      launched = true; const h = p.files[0];
      try { await openFile(await h.getFile(), h); } catch (e) { alert('파일을 열 수 없습니다: ' + e.message); }
    });
    if (q.get('new') === '1') { loadDoc(HwpxDoc.blank(), { name: '새 문서' }); return; }
    await new Promise(r => setTimeout(r, 0));
    if (!launched && !W.doc) showStart();
  })();
})();
