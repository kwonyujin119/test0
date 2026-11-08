/* 한글 작업장 — 첫 화면
   교안 작업장(gyoan.html)과 같은 레일 + 허브 구조. 문서함 · best 문서 · 이 기기 임시본을 메뉴 뒤에 숨기지 않고 한 화면에 카드로 펼친다.
   카드의 종이에는 문서의 첫 문단 몇 개(preview)가 보인다 — 저장할 때 기록해 둔 글이라 파일을 다시 열지 않아도 된다.
   편집 화면 위에 덮이는 층이라 문서를 열어 둔 채로도 드나들 수 있다 (머리 줄 [한글 작업장] ↔ [편집으로 돌아가기]).
   꾸밈은 app/ui.css 의 허브 클래스(.shell .rail .hub .menu …)와 app/hwp/hwp.css 의 .hm-* .doc-* 를 쓴다.
   문서를 열고 저장하는 일은 ui.js 가 window.__hwp 로 내놓은 함수를 부른다. */
'use strict';
const HwpHome = (() => {
  const $ = id => document.getElementById(id);
  const U = () => window.__hwp; // ui.js: 문서 열기 · 저장 · 창 · 문서함 암호 …
  const GUEST = Access.isGuest;
  const root = $('home');
  const SEC = { all: '한글 작업장', box: '문서함', best: 'best 문서', draft: '이 기기 임시본' };
  let sec = 'all', kw = '';
  const box = { state: 'idle', items: [], err: '' };  // noconn(GitHub 연결 없음) · locked(암호) · loading · ok · err
  const best = { state: 'idle', items: [], err: '' }; // locked(GitHub 암호) · loading · ok · err
  let drafts = [], draftsLoaded = false, inited = false;
  let openMenu = null;

  /* ---------- 보이기 / 숨기기 ---------- */
  function show(which) {
    if (which && SEC[which]) setSec(which);
    root.hidden = false;
    banner();
    render();  // 받아 둔 자료로 먼저 그리고 (칸·제목이 바로 바뀌게)
    refresh(); // 새로 받아 다시 그림
  }
  function hide() { closeMenu(); root.hidden = true; }
  function banner() { const W = U().W; $('hmEditing').hidden = !W.doc; if (W.doc) $('hmEditName').textContent = W.name; }

  /* ---------- 자료 ---------- */
  async function refresh() {
    await BestDocs.init(); // API.init(): 내 PC 서버인지 · GitHub 인지
    notice(); railGh();
    render();
    loadDrafts(); loadBox(); loadBest();
  }
  async function loadDrafts() {
    drafts = GUEST ? [] : await HwpStore.drafts.list();
    draftsLoaded = true; render();
  }
  async function loadBox() {
    if (GUEST) return;
    if (!GH.cfg) GH.load();
    if (!HwpStore.box.ready()) { box.state = 'noconn'; render(); return; }
    if (!HwpStore.box.unlocked && !(await HwpStore.box.restoreKey())) { box.state = 'locked'; render(); return; }
    box.state = box.items.length ? 'ok' : 'loading'; render(); // 받아 둔 목록이 있으면 그대로 보여 주며 새로 받음
    try { box.items = await U().boxRun(() => HwpStore.box.list()); box.state = 'ok'; }
    catch (e) { console.error(e); box.state = 'err'; box.err = e.message; }
    render();
  }
  async function loadBest() {
    await BestDocs.init();
    if (BestDocs.mode() === 'github' && !HwpStore.box.unlocked && !(await HwpStore.box.restoreKey())) { best.state = 'locked'; render(); return; }
    best.state = best.items.length ? 'ok' : 'loading'; render();
    try { best.items = await BestDocs.list(); best.state = 'ok'; }
    catch (e) { console.error(e); best.state = 'err'; best.err = e.message; }
    render();
  }
  /* 문서함 암호(또는 GitHub 연결)를 열고 목록을 받음 — best 문서도 같은 암호 */
  async function unlock() { if (await U().boxEnsure()) { loadBox(); loadBest(); } }
  function lock() {
    HwpStore.box.lock(); box.items = []; box.state = 'locked';
    if (BestDocs.mode() === 'github') { best.items = []; best.state = 'locked'; }
    render(); toast('문서함을 잠갔습니다 — 이 기기에 기억한 암호를 지웠습니다', 2600);
  }

  /* ---------- 알림 줄 · 레일 ---------- */
  function notice() {
    const n = $('hmNotice'); n.hidden = false; n.className = 'hub-notice';
    if (GUEST) { n.className += ' guest'; n.innerHTML = `${icon('eye', 15)} <b>보기 전용(게스트)</b> 으로 들어왔습니다. hwpx 문서를 열어 읽고 인쇄할 수 있고, 고치거나 저장하는 일은 할 수 없습니다. <a href="index.html?mode=1">관리자로 입장</a>`; return; }
    if (API.mode === 'server') { n.hidden = true; return; }
    if (API.mode === 'github') {
      const repo = `<b>${esc(GH.cfg.owner)}/${esc(GH.cfg.repo)}</b>`;
      if (GH.token) { n.className += ' ok'; n.innerHTML = `GitHub 저장소 ${repo} 에 연결되어 있습니다. 문서함과 best 문서는 암호로 잠가 올라가며, 교안 작업장과 같은 연결을 씁니다. <a href="#" id="hmGhOff">연결 해제</a>`; n.querySelector('#hmGhOff').onclick = async ev => { ev.preventDefault(); if (await U().askConfirm('GitHub 연결을 해제할까요?', '이 브라우저에 저장된 GitHub 토큰을 지웁니다. 저장소의 문서는 그대로입니다.', '연결 해제')) { GH.clear(); location.reload(); } }; }
      else { n.innerHTML = `지금은 <b>PC 파일 열기 · 보기</b>만 됩니다. 문서함과 best 문서를 쓰려면 <a href="#" id="hmGhOn">GitHub 연결</a> 로 토큰을 한 번만 등록하세요.`; n.querySelector('#hmGhOn').onclick = ev => { ev.preventDefault(); connect(); }; }
      return;
    }
    n.innerHTML = '서버 없이 열렸습니다. best 문서는 <b>이 브라우저 안</b>에만 저장됩니다. 폴더의 <b>start.cmd</b> 로 열면 best/ 폴더에 파일로 저장되고 Git 으로 관리할 수 있습니다.';
  }
  async function connect() { if (await U().connectDialog()) { toast('GitHub 에 연결했습니다'); refresh(); } }
  function railGh() {
    const b = $('hmGh'); if (GUEST || API.mode !== 'github') { b.style.display = 'none'; return; }
    b.style.display = '';
    b.innerHTML = GH.token ? `${icon('link', 17)}<span>GitHub</span><em>연결됨</em>` : `${icon('link', 17)}<span>GitHub 연결</span>`;
    b.title = GH.token ? `GitHub 저장소 ${GH.cfg.owner}/${GH.cfg.repo} 에 연결되어 있습니다 — 누르면 상태 확인 · 토큰 바꾸기` : 'GitHub 저장소에 문서함·best 문서를 올리도록 토큰 연결';
  }

  /* ---------- 때 · 글 ---------- */
  function relTime(t) {
    t = typeof t === 'number' ? t : Date.parse(t || ''); if (!t) return '';
    const now = new Date(), d = new Date(t), mins = Math.floor((now - d) / 60000);
    if (mins < 1) return '방금'; if (mins < 60) return `${mins}분 전`;
    if (mins < 1440 && d.getDate() === now.getDate()) return `${Math.floor(mins / 60)}시간 전`;
    const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (d >= new Date(t0 - 864e5) && d < t0) return '어제';
    return d.getFullYear() === now.getFullYear() ? `${d.getMonth() + 1}월 ${d.getDate()}일` : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  }

  /* ---------- 카드 ---------- */
  /* 종이: 미리보기 글이 있으면 그 글(첫 줄이 제목처럼), 없으면 이름과 글줄 모양 */
  function sheetHtml(title, preview, badge) {
    const body = preview ? `<div class="ds-text">${esc(preview)}</div>` : `<div class="ds-title">${esc(title)}</div><div class="ds-lines"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
    return `<div class="doc-sheet" tabindex="0" role="link">${body}${badge ? `<span class="ds-badge">${esc(badge)}</span>` : ''}<div class="ds-hover"></div></div>`;
  }
  /* o: { id, title, preview, badge, meta: [], note, tags, click: 동작, actions: [{ label, icon, run }], menu: [{ label, icon, run, danger } | null] } */
  function card(o) {
    const c = document.createElement('article'); c.className = 'doc-card' + (o.cur ? ' cur' : ''); c.dataset.id = o.id;
    c.innerHTML = sheetHtml(o.title, o.preview, o.badge) + `<div class="doc-body"><div class="doc-text"><div class="doc-title" title="${esc(o.title)}">${esc(o.title)}</div><div class="doc-meta">${(o.meta || []).filter(Boolean).map(m => `<span>${esc(m)}</span>`).join('')}${o.chip ? `<span class="draft-chip" title="저장하지 않은 작업본입니다. 이어서 편집한 뒤 저장하세요">${esc(o.chip)}</span>` : ''}${o.tags && o.tags.length ? `<span class="doc-tags">${o.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</span>` : ''}</div>${o.note ? `<div class="doc-note" title="${esc(o.note)}">${esc(o.note)}</div>` : ''}</div>${o.menu && o.menu.length ? `<button class="btn icon ghost kebab" data-more title="더 보기" aria-label="${esc(o.title)} 더 보기">${icon('dots')}</button>` : ''}</div>`;
    const sheet = c.querySelector('.doc-sheet'), hv = c.querySelector('.ds-hover');
    const main = o.click || o.actions[0];
    hv.innerHTML = o.actions.map((a, i) => `<button class="btn${i === 0 ? ' ink' : ''}" data-a="${i}">${icon(a.icon, 16)}${esc(a.label)}</button>`).join('');
    sheet.setAttribute('aria-label', `${o.title} — ${main.label}`);
    sheet.onclick = ev => { const b = ev.target.closest('button[data-a]'); if (b) run(o.actions[+b.dataset.a], c); else if (!ev.target.closest('button')) run(main, c); };
    sheet.onkeydown = ev => { if (ev.key === 'Enter' && ev.target === sheet) run(main, c); };
    const more = c.querySelector('[data-more]'); if (more) more.onclick = () => menu(more, o.menu, c);
    return c;
  }
  async function run(a, host) {
    if (!a || (host && host.classList.contains('busy'))) return;
    if (host) host.classList.add('busy');
    try { await a.run(); } catch (e) { console.error(e); U().tell(a.label + ' — 하지 못했습니다', e.message); }
    finally { if (host) host.classList.remove('busy'); }
  }
  function grid() { const g = document.createElement('div'); g.className = 'doc-grid'; return g; }
  function ghosts(n) { const g = grid(); for (let i = 0; i < n; i++) { const c = document.createElement('div'); c.className = 'doc-card ghost'; c.innerHTML = '<div class="doc-sheet"></div><div class="doc-body"><div><div class="line"></div><div class="line short"></div></div></div>'; g.appendChild(c); } return g; }
  /* 안내 판: 잠김 · 연결 없음 · 비어 있음 */
  function panel(ic, html, sub, btns) {
    const d = document.createElement('div'); d.className = 'hm-panel';
    d.innerHTML = `<div class="pi">${icon(ic, 20)}</div><div class="t">${html}${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
    for (const [label, bic, fn, cls] of btns || []) { const b = document.createElement('button'); b.className = 'btn' + (cls ? ' ' + cls : ''); b.innerHTML = (bic ? icon(bic, 16) : '') + esc(label); b.onclick = fn; d.appendChild(b); }
    return d;
  }
  function headBtn(host, label, ic, fn, cls) { const b = document.createElement('button'); b.className = 'btn sm' + (cls ? ' ' + cls : ''); b.innerHTML = (ic ? icon(ic, 14) : '') + esc(label); b.onclick = fn; host.appendChild(b); return b; }

  /* ---------- ⋯ 메뉴 ---------- */
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  document.addEventListener('pointerdown', ev => { if (openMenu && !openMenu.contains(ev.target)) closeMenu(); });
  window.addEventListener('resize', closeMenu);
  function menu(btn, items, host) {
    const same = openMenu && openMenu._btn === btn; closeMenu(); if (same) return;
    const m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu'); m._btn = btn;
    for (const it of items) {
      if (!it) { m.appendChild(document.createElement('hr')); continue; }
      const b = document.createElement('div'); b.className = 'mi' + (it.danger ? ' danger' : ''); b.setAttribute('role', 'menuitem'); b.tabIndex = 0;
      b.innerHTML = `${icon(it.icon, 16)}<span>${esc(it.label)}</span>`;
      const go = () => { closeMenu(); run(it, host); };
      b.onclick = go; b.onkeydown = ev => { if (ev.key === 'Enter') go(); };
      m.appendChild(b);
    }
    document.body.appendChild(m); openMenu = m;
    const r = btn.getBoundingClientRect();
    m.style.position = 'fixed';
    m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top = (r.bottom + 6 + m.offsetHeight > innerHeight - 8 ? r.top - 6 - m.offsetHeight : r.bottom + 6) + 'px';
    const first = m.querySelector('.mi'); if (first) first.focus();
  }

  /* ---------- 문서함 ---------- */
  function boxCard(it) {
    const W = U().W, cur = it.id === W.boxId;
    const open = async () => { if (cur) { hide(); return; } if (!(await U().confirmDiscard())) return; toast('문서함에서 여는 중…', 20000); const u = await U().boxRun(() => HwpStore.box.load(it.id)); await U().openBytes(u.buffer, { name: it.name, boxId: it.id }); };
    const dl = async () => { toast('받는 중…', 20000); const u = await U().boxRun(() => HwpStore.box.load(it.id)); HwpStore.download(it.name + '.hwpx', new Blob([u], { type: 'application/hwp+zip' })); toast('내려받기 폴더에 저장했습니다 (' + it.name + '.hwpx)', 2600); };
    const ren = async () => { const n = await U().askText('이름 바꾸기', '이름', it.name, '바꾸기'); if (!n || n === it.name) return; await U().boxRun(() => HwpStore.box.rename(it.id, n)); if (cur) U().setName(n); it.name = n; render(); toast('이름을 바꿨습니다'); };
    const del = async () => { if (!(await U().askConfirm(`"${it.name}" 을(를) 문서함에서 지울까요?`, 'GitHub 기록에는 암호화된 상태로 남습니다.', '삭제', true))) return; await U().boxRun(() => HwpStore.box.remove(it.id)); if (cur) { W.boxId = null; U().updateState(); } box.items = box.items.filter(x => x.id !== it.id); render(); toast('문서함에서 지웠습니다', 2200); };
    return { id: it.id, cur, title: it.name, preview: it.preview, meta: [cur ? '지금 편집 중' : '', relTime(it.modified), it.device, U().fmtKB(it.size)],
      actions: [{ label: cur ? '편집으로 돌아가기' : '열기', icon: 'edit', run: open }],
      menu: [{ label: cur ? '편집으로 돌아가기' : '열기', icon: 'edit', run: open }, { label: 'hwpx 내려받기', icon: 'download', run: dl }, { label: '이름 바꾸기', icon: 'edit', run: ren }, null, { label: '삭제', icon: 'trash', run: del, danger: true }] };
  }
  async function boxUpload() {
    const p = await HwpStore.pickOpen().catch(e => { U().tell('파일을 열지 못했습니다', e.message); return null; }); if (!p) return;
    toast('문서함에 올리는 중…', 20000);
    try { await U().boxRun(() => HwpStore.box.save(null, p.file.name.replace(/\.hwpx$/i, ''), p.file, U().deviceName())); toast('문서함에 올렸습니다', 2200); }
    catch (e) { console.error(e); U().tell('올리지 못했습니다', e.message); }
    loadBox();
  }
  function renderBox(showIt, match) {
    const S = $('secBox'); if (GUEST) { S.hidden = true; return 0; }
    S.hidden = !showIt; if (!showIt) return 0;
    const W = U().W, body = $('boxBody'), acts = $('boxActs'), cnt = $('boxCnt');
    acts.innerHTML = ''; cnt.textContent = '';
    if (box.state === 'idle') { body.replaceChildren(ghosts(4)); return 0; }
    if (box.state === 'noconn') {
      body.replaceChildren(panel('lock', '<b>문서함</b>은 GitHub 저장소에 <b>암호로 잠가</b> 보관해 집·사무실·휴대폰 어디서나 같은 문서를 엽니다.',
        API.mode === 'github' ? '이 기기에는 아직 GitHub 연결이 없습니다. 토큰을 한 번 넣고 문서함 암호를 입력하면 문서가 여기에 바로 보입니다.' : '내 PC 서버에서 열었습니다. 문서함을 쓰려면 GitHub 저장소를 연결하세요 (교안 작업장과 같은 연결을 씁니다).',
        [['GitHub 연결', 'link', unlock, 'ink']]));
      return 0;
    }
    if (box.state === 'locked') { body.replaceChildren(panel('lock', '<b>문서함이 잠겨 있습니다.</b> 암호를 입력하면 문서가 여기에 바로 보입니다.', '', [['문서함 열기', 'unlock', unlock, 'ink']])); return 0; }
    if (box.state === 'err') { body.replaceChildren(panel('info', `<b>문서함을 읽지 못했습니다.</b> ${esc(box.err)}`, '', [['다시 시도', 'redo', loadBox]])); return 0; }
    headBtn(acts, 'PC 파일 올리기', 'upload', boxUpload);
    if (W.doc) headBtn(acts, W.boxId ? '현재 문서 저장' : '현재 문서를 문서함에', 'save', () => { hide(); U().save('box'); });
    headBtn(acts, '잠그기', 'lock', lock, 'ghost').title = '이 기기에 기억한 문서함 암호를 지웁니다';
    if (box.state === 'loading') { body.replaceChildren(ghosts(4)); return 0; }
    const list = box.items.filter(it => match(it.name, it.preview));
    cnt.textContent = box.items.length ? `${list.length}개` : '';
    if (!box.items.length) { body.replaceChildren(panel('folder', '<b>문서함이 비어 있습니다.</b> 지금 편집 중인 문서를 저장하거나 PC 의 hwpx 파일을 올리면, 다른 기기에서도 같은 문서를 엽니다.', '', [])); return 0; }
    if (!list.length) { S.hidden = true; return 0; }
    const g = grid(); for (const it of list) g.appendChild(card(boxCard(it))); body.replaceChildren(g);
    return list.length;
  }

  /* ---------- best 문서 ---------- */
  function pickBest() { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.hwpx'; inp.multiple = true; inp.onchange = () => U().bestUpload(inp.files, loadBest); inp.click(); }
  function dropZone() {
    const d = document.createElement('div'); d.className = 'best-drop';
    d.innerHTML = `${icon('upload', 20)}<b>잘 만든 .hwpx 문서를 여기에 끌어다 놓거나</b> 눌러서 고르세요<br><span>올린 문서는 누적되어 레퍼런스가 되고, 본문 글과 구조(스타일·글꼴·표)를 함께 뽑아 둡니다.</span>`;
    d.onclick = pickBest;
    d.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); d.classList.add('over'); });
    d.addEventListener('dragleave', () => d.classList.remove('over'));
    d.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); d.classList.remove('over'); U().dropDone(); U().bestUpload(e.dataTransfer.files, loadBest); });
    return d;
  }
  function bestCard(it) {
    const m = it.meta || {};
    const open = () => U().bestOpen(it, false), asNew = () => U().bestOpen(it, true);
    const struct = async () => U().bestStructDialog(await BestDocs.get(it.id));
    const edit = () => U().bestEditDialog(it, loadBest);
    const del = async () => { if (!(await U().askConfirm(`"${it.name}" 을(를) best 문서에서 지울까요?`, BestDocs.mode() === 'server' ? 'best/.trash 폴더로 옮깁니다.' : '', '지우기', true))) return; await BestDocs.remove(it.id); best.items = best.items.filter(x => x.id !== it.id); render(); toast('지웠습니다'); };
    const openA = { label: '열기', icon: 'eye', run: open }, newA = { label: '바탕으로 새 문서', icon: 'filePlus', run: asNew };
    return { id: it.id, title: it.name, preview: m.preview, badge: 'BEST', note: it.note, tags: it.tags,
      meta: [m.chars ? m.chars.toLocaleString() + '자' : '', m.tables ? '표 ' + m.tables : '', m.images ? '그림 ' + m.images : '', relTime(it.added)],
      click: openA, actions: GUEST ? [openA] : [newA, openA],
      menu: [openA].concat(GUEST ? [] : [newA], [{ label: '구조 · 본문 글 보기', icon: 'list', run: struct }], GUEST ? [] : [{ label: '이름 · 메모 · 꼬리표', icon: 'edit', run: edit }, null, { label: '지우기', icon: 'trash', run: del, danger: true }]) };
  }
  function renderBest(showIt, match) {
    const S = $('secBest'); S.hidden = !showIt; if (!showIt) return 0;
    const body = $('bestBody'), acts = $('bestActs'), cnt = $('bestCnt');
    acts.innerHTML = ''; cnt.textContent = '';
    if (best.state === 'idle') { body.replaceChildren(ghosts(4)); return 0; }
    if (best.state === 'locked') { body.replaceChildren(panel('lock', GUEST ? '<b>best 문서는 암호로 잠겨 있습니다.</b> 게스트 모드에서는 볼 수 없습니다.' : '<b>best 문서는 문서함과 같은 암호로 잠겨 있습니다.</b> 암호를 입력하면 여기에 바로 보입니다.', '', GUEST ? [] : [['암호 입력', 'unlock', unlock, 'ink']])); return 0; }
    if (best.state === 'err') { body.replaceChildren(panel('info', `<b>best 문서 목록을 읽지 못했습니다.</b> ${esc(best.err)}`, '', [['다시 시도', 'redo', loadBest]])); return 0; }
    if (!GUEST) headBtn(acts, 'hwpx 올리기', 'upload', pickBest);
    if (best.state === 'loading') { body.replaceChildren(ghosts(4)); return 0; }
    const list = best.items.filter(it => match(it.name, it.note, (it.tags || []).join(' '), it.meta && it.meta.preview));
    cnt.textContent = `${best.items.length ? list.length + '개 · ' : ''}${BestDocs.MODE_NAMES[BestDocs.mode()]}`;
    if (!best.items.length) { body.replaceChildren(GUEST ? panel('bookmark', '<b>아직 올린 best 문서가 없습니다.</b> 관리자가 올리면 여기에 보입니다.', '', []) : dropZone()); return 0; }
    if (!list.length) { S.hidden = true; return 0; }
    const g = grid(); for (const it of list) g.appendChild(card(bestCard(it)));
    if (!GUEST && !kw) { const add = document.createElement('div'); add.className = 'doc-card add'; add.appendChild(dropZone()); g.appendChild(add); }
    body.replaceChildren(g);
    return list.length;
  }

  /* ---------- 이 기기 임시본 ---------- */
  function draftCard(x) {
    const W = U().W, cur = W.doc && x.id === W.draftId;
    const open = async () => { if (cur) { hide(); return; } if (!(await U().confirmDiscard())) return; const r = await HwpStore.drafts.get(x.id); if (!r) { toast('임시본이 이미 지워졌습니다'); loadDrafts(); return; } toast('임시본을 여는 중…', 20000); await U().openBytes(await r.blob.arrayBuffer(), { name: r.name, draftId: x.id, boxId: r.boxId || null, dirty: true }); };
    const del = async () => { if (!(await U().askConfirm(`"${x.name}" 임시본을 지울까요?`, '지우면 되살릴 수 없습니다.', '지우기', true))) return; await HwpStore.drafts.del(x.id); loadDrafts(); };
    return { id: x.id, cur, title: x.name, preview: x.preview, meta: [cur ? '지금 편집 중' : '', relTime(x.time), x.boxId ? '문서함 문서' : ''], chip: '저장 안 함',
      actions: [{ label: cur ? '편집으로 돌아가기' : '이어서 편집', icon: 'edit', run: open }],
      menu: [{ label: cur ? '편집으로 돌아가기' : '이어서 편집', icon: 'edit', run: open }, null, { label: '임시본 지우기', icon: 'trash', run: del, danger: true }] };
  }
  function renderResume(x) {
    const R = $('hmResume'); R.hidden = !x; if (!x) return;
    const o = draftCard(x);
    R.innerHTML = `${sheetHtml(o.title, o.preview)}<div class="rs-side"><div class="eyebrow">${o.cur ? '지금 편집 중' : '이어서 작업'}</div><h2>${esc(o.title)}</h2><div class="meta">${o.meta.filter(Boolean).concat(['저장하지 않은 작업본']).join(' · ')}</div><div class="cta"><button class="btn ink lg" data-go>${icon('edit')}${esc(o.actions[0].label)}</button><button class="btn lg ghost" data-del>${icon('trash')}임시본 지우기</button></div></div>`;
    const sheet = R.querySelector('.doc-sheet'); sheet.querySelector('.ds-hover').remove();
    sheet.onclick = () => run(o.actions[0], R); sheet.onkeydown = ev => { if (ev.key === 'Enter') run(o.actions[0], R); };
    R.querySelector('[data-go]').onclick = () => run(o.actions[0], R);
    R.querySelector('[data-del]').onclick = () => run(o.menu[2], R);
  }
  function renderDrafts(showIt, list, match) {
    const S = $('secDraft'); if (GUEST) { S.hidden = true; return 0; }
    const rows = list.filter(x => match(x.name, x.preview));
    const empty = draftsLoaded && !drafts.length;
    S.hidden = !showIt || (!rows.length && !(sec === 'draft' && empty && !kw));
    if (S.hidden) return 0;
    const body = $('draftBody'), cnt = $('draftCnt');
    if (!draftsLoaded) { body.replaceChildren(ghosts(3)); cnt.textContent = ''; return 0; }
    if (empty) { body.replaceChildren(panel('check', '<b>저장하지 않은 임시본이 없습니다.</b> 편집하다가 저장하지 않고 닫으면 여기에 모입니다.', '', [])); cnt.textContent = ''; return 0; }
    cnt.textContent = `${rows.length}개`;
    const g = grid(); for (const x of rows) g.appendChild(card(draftCard(x))); body.replaceChildren(g);
    return rows.length;
  }

  /* ---------- 그리기 ---------- */
  function render() {
    if (root.hidden) return;
    const q = kw.toLowerCase();
    const match = (...xs) => !q || xs.some(x => (x || '').toLowerCase().includes(q));
    $('cBox').textContent = box.state === 'ok' && box.items.length ? box.items.length : '';
    $('cBest').textContent = best.items.length || '';
    $('cDraft').textContent = drafts.length || '';
    $('hmTitle').textContent = q ? '검색 결과' : SEC[sec];
    const showSec = k => sec === 'all' || sec === k;
    const hero = !GUEST && sec === 'all' && !q && drafts.length ? drafts[0] : null;
    renderResume(hero);
    let n = 0;
    n += renderBox(showSec('box'), match);
    n += renderBest(showSec('best'), match);
    n += renderDrafts(showSec('draft'), hero ? drafts.slice(1) : drafts, match);
    const E = $('hmEmpty');
    const none = q && !n && !document.querySelector('.hm-sec:not([hidden])');
    E.hidden = !none;
    if (none) E.innerHTML = `<b>"${esc(kw)}" 이(가) 들어간 문서가 없습니다</b><span>검색 칸을 비우면 전체가 보입니다.</span>`;
    $('hmSub').textContent = q ? `${n}개` : '';
  }
  function setSec(k) {
    sec = k;
    $('hmNav').querySelectorAll('[data-sec]').forEach(b => { const on = b.dataset.sec === k; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }

  /* ---------- 단추 · 키 ---------- */
  function init() {
    if (inited) return; inited = true;
    $('hmNav').onclick = e => { const b = e.target.closest('[data-sec]'); if (!b) return; setSec(b.dataset.sec); render(); root.scrollTop = 0; };
    $('hmQ').oninput = () => { kw = $('hmQ').value.trim(); render(); };
    $('hmNew').onclick = () => U().newDoc();
    $('hmOpen').onclick = () => U().openDialog();
    $('hmHelp').onclick = () => U().helpDialog();
    $('hmBack').onclick = hide;
    $('hmGh').onclick = connect;
    document.addEventListener('keydown', ev => {
      if (root.hidden || document.querySelector('.dlg-bg, .modal-bg')) return;
      const inField = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
      if (ev.key === '/' && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !inField) { ev.preventDefault(); $('hmQ').focus(); return; }
      if (ev.key === 'Escape') {
        if (openMenu) { closeMenu(); return; }
        if (document.activeElement === $('hmQ')) { if (kw) { $('hmQ').value = ''; kw = ''; render(); } else $('hmQ').blur(); return; }
        if (U().W.doc) hide(); // 문서를 열어 둔 채 왔으면 편집으로
      }
    });
  }
  init();
  return { show, hide, refresh, render, get visible() { return !root.hidden; } };
})();
