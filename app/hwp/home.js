/* DOCUMENT — 첫 화면
   PRESENTATION(gyoan.html)과 같은 구조: 왼쪽 레일(분류 · 도구) · 위 도구 줄(검색 · 정렬 · 격자/목록) · 가운데 "이어서 작업"(가장 최근 문서의 큰 종이 미리보기)
   · 아래 "다른 문서" 격자 · best 문서 격자.
   문서 목록은 문서함(GitHub 에 암호로 잠근 문서)과 이 기기 임시본(저장하지 않고 닫은 문서)을 한 줄로 합친 것이다.
   문서함 문서에 임시본이 남아 있으면 한 카드로 보이고 "저장 안 한 작업본" 표시가 붙는다(열면 임시본을 연다).
   카드의 종이에는 문서의 첫 문단 몇 개(preview)가 보인다 — 저장할 때 기록해 둔 글이라 파일을 다시 열지 않아도 된다.
   편집 화면 위에 덮이는 층이라 문서를 열어 둔 채로도 드나들 수 있다 (머리 줄 [DOCUMENT] ↔ [편집으로 돌아가기]).
   꾸밈은 app/ui.css 의 허브 클래스(.shell .rail .hub .menu .seg …)와 app/hwp/hwp.css 의 .hm-* .doc-* 를 쓴다.
   문서를 열고 저장하는 일은 ui.js 가 window.__hwp 로 내놓은 함수를 부른다. */
'use strict';
const HwpHome = (() => {
  const $ = id => document.getElementById(id);
  const U = () => window.__hwp; // ui.js: 문서 열기 · 저장 · 창 · 문서함 암호 …
  const GUEST = Access.isGuest;
  const root = $('home');
  const FILTERS = { all: '모든 문서', box: '문서함', week: '최근 7일', draft: '저장 안 한 작업본', best: 'best 문서' };
  const PREF = 'hwp:home'; // 이 기기에 기억하는 보기 설정
  const pref = (() => { try { return Object.assign({ view: 'grid', sort: 'recent' }, JSON.parse(localStorage.getItem(PREF) || '{}')); } catch (e) { return { view: 'grid', sort: 'recent' }; } })();
  const savePref = () => { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) { } };
  let filter = 'all', kw = '';
  const box = { state: 'idle', items: [], folders: [], err: '' };  // noconn(GitHub 연결 없음) · locked(암호) · loading · ok · err
  const best = { state: 'idle', items: [], err: '' }; // locked(GitHub 암호) · loading · ok · err
  let drafts = [], draftsLoaded = false, inited = false;

  /* ---------- 보이기 / 숨기기 ---------- */
  function show(which) {
    if (which && (FILTERS[which] || /^f:/.test(which))) setFilter(GUEST && which === 'best' ? 'all' : which); // 게스트는 best 문서를 볼 수 없음
    root.hidden = false;
    render();  // 받아 둔 자료로 먼저 그리고
    refresh(); // 새로 받아 다시 그림
  }
  function hide() { closeMenu(); root.hidden = true; }
  /* "지금 ○○ 을(를) 편집하는 중" 띠: 그 문서가 "이어서 작업" 자리에 이미 보이면 줄임 */
  function banner(hero) { const W = U().W; $('hmEditing').hidden = !W.doc || !!(hero && hero.cur); if (W.doc) $('hmEditName').textContent = W.name; }

  /* ---------- 자료 ---------- */
  async function refresh() {
    await BestDocs.init(); // API.init(): 내 PC 서버인지 · GitHub 인지
    railGh(); render();
    loadDrafts(); loadBox(); loadBest();
  }
  async function loadDrafts() {
    drafts = GUEST ? [] : await HwpStore.drafts.list();
    draftsLoaded = true; render();
  }
  async function loadBox() { // 공통 저장소(documents/): 누구나 읽음 — 토큰 · 암호 필요 없음
    box.state = box.items.length ? 'ok' : 'loading'; render(); // 받아 둔 목록이 있으면 그대로 보여 주며 새로 받음
    try { box.items = await U().boxRun(() => HwpStore.box.list()); box.folders = HwpStore.box.folder.list(); box.state = 'ok'; }
    catch (e) { console.error(e); box.state = 'err'; box.err = e.message; }
    render(); checkLegacy();
  }
  /* 예전 잠긴 문서함(hwp/*.bin)에 남은 문서 → 공통 저장소로 옮기기 (관리자 · GitHub 연결 · 한 번만 암호) */
  const legacy = { n: 0, busy: false };
  const movedIds = () => new Set(box.items.map(x => x.legacy).filter(Boolean).concat(HwpStore.box.folder.skipped() || []));
  async function checkLegacy() {
    if (GUEST || !HwpStore.box.canWrite() || legacy.checked) return; legacy.checked = true;
    try {
      if (!(await HwpStore.legacy.exists())) return;
      const moved = movedIds();
      if (await HwpStore.legacy.restoreKey()) { const old = await HwpStore.legacy.list(); legacy.n = old.filter(x => !moved.has(x.id)).length; }
      else legacy.n = moved.size ? 0 : -1; // 암호를 모르면 개수는 모름 (-1: 옮길 것이 있을 수 있음)
    } catch (e) { console.warn('legacy', e); }
    render();
  }
  /* 옮기기: 문서마다 따로 꺼내고, 파일이 없거나 못 푼 문서는 건너뛰고 나머지는 옮긴다 (한 개 때문에 전부 멈추지 않게) */
  async function migrate() {
    if (legacy.busy) return; legacy.busy = true;
    try {
      if (!(await U().legacyEnsure())) return;
      const moved = movedIds();
      const old = (await U().boxRun(() => HwpStore.legacy.list())).filter(x => !moved.has(x.id));
      if (!old.length) { legacy.n = 0; toast('옮길 문서가 없습니다 — 모두 옮겨져 있습니다', 2400); render(); return; }
      const docs = [], missing = [], failed = [];
      for (const [k, x] of old.entries()) {
        toast(`잠긴 문서함에서 꺼내는 중… ${k + 1}/${old.length}`, 20000);
        try { docs.push({ name: x.name, data: await U().boxRun(() => HwpStore.legacy.load(x.id)), created: x.created, modified: x.modified, device: x.device, preview: x.preview, legacy: x.id }); }
        catch (e) { console.warn('옮기기', x, e); (/찾지 못했습니다/.test(e.message) ? missing : failed).push(x); }
      }
      toast(`공통 저장소에 올리는 중… (${docs.length}개)`, 30000);
      const n = docs.length || missing.length ? await U().boxRun(() => HwpStore.box.importMany(docs, missing.map(x => x.id))) : 0;
      legacy.n = failed.length; legacy.checked = false;
      const li = xs => xs.map(x => `<li>${esc(x.name)}</li>`).join('');
      if (!missing.length && !failed.length) toast(`${n}개 문서를 옮겼습니다 — 이제 어느 기기에서나 보입니다 (잠긴 원본은 그대로 둠)`, 4000);
      else U().dialog(icon('info', 16) + `${n}개를 옮겼습니다`, `<p class="dlg-desc">${n}개 문서를 공통 저장소로 옮겼습니다.</p>`
        + (missing.length ? `<p class="dlg-desc"><b>파일이 없는 문서 ${missing.length}개는 건너뛰었습니다.</b> 예전 문서함 목록에만 이름이 남고 실제 파일은 이미 지워진 것입니다 (예전에 두 기기에서 거의 동시에 저장 · 삭제할 때 생긴 문제 — 새 저장 방식에서는 생기지 않게 고쳤습니다). 다시 알리지 않습니다.</p><ul>${li(missing)}</ul>` : '')
        + (failed.length ? `<p class="dlg-desc"><b>꺼내지 못한 문서 ${failed.length}개</b> — 잠시 뒤 알림의 [옮기기]를 다시 누르면 이것만 다시 시도합니다.</p><ul>${li(failed)}</ul>` : ''),
        { foot: '<button class="tb primary" data-x="cancel">확인</button>', noEnter: true, noFocus: true });
      loadBox();
    } catch (e) { console.error(e); U().tell('옮기지 못했습니다', e.message); }
    finally { legacy.busy = false; }
  }


  async function loadBest() {
    if (GUEST) return; // 게스트에게는 best 문서 목록을 받지도 않음
    await BestDocs.init();
    if (BestDocs.mode() === 'github' && !HwpStore.legacy.unlocked && !(await HwpStore.legacy.restoreKey())) { best.state = 'locked'; render(); return; }
    best.state = best.items.length ? 'ok' : 'loading'; render();
    try { best.items = await BestDocs.list(); best.state = 'ok'; }
    catch (e) { console.error(e); best.state = 'err'; best.err = e.message; }
    render();
  }
  /* 문서함 암호(또는 GitHub 연결)를 열고 목록을 받음 — best 문서도 같은 암호 */
  async function unlock() { if (await U().legacyEnsure()) loadBest(); } // best 문서(암호)
  function lock() {
    HwpStore.legacy.lock();
    if (BestDocs.mode() === 'github') { best.items = []; best.state = 'locked'; }
    render(); toast('문서함을 잠갔습니다 — 이 기기에 기억한 암호를 지웠습니다', 2600);
  }
  async function connect() { if (await U().connectDialog()) { toast('GitHub 에 연결했습니다 — 이제 이 기기에서 저장할 수 있습니다'); legacy.checked = false; refresh(); } }
  function railGh() {
    const b = $('hmGh'); if (GUEST) { b.style.display = 'none'; return; }
    b.style.display = '';
    const on = !!(GH.cfg && GH.token);
    b.innerHTML = on ? `${icon('link', 17)}<span>GitHub</span><em>연결됨</em>` : `${icon('link', 17)}<span>GitHub 연결</span>`;
    b.title = on ? `GitHub 저장소 ${GH.cfg.owner}/${GH.cfg.repo} 에 연결되어 있습니다 — 누르면 상태 확인 · 토큰 바꾸기` : 'GitHub 저장소에 문서함·best 문서를 올리도록 토큰 연결 (PRESENTATION과 같은 연결)';
  }

  /* ---------- 도구 줄 아래 한 줄 알림: 지금 어디에 저장되는지 (문서 자리에 같은 안내 판이 보이면 줄임) ---------- */
  function notice(panelShown) {
    const n = $('hmNotice'); n.hidden = false; n.className = 'hub-notice'; n.innerHTML = '';
    const link = (id, label) => `<a href="#" id="${id}">${label}</a>`;
    if (GUEST) { n.className += ' guest'; n.innerHTML = `${icon('eye', 15)}<span>보기 전용입니다. hwpx 문서를 읽고 인쇄할 수 있습니다. <a href="index.html?mode=1">관리자로 입장</a></span>`; return; }
    if (panelShown) { n.hidden = true; return; }
    const repo = GH.cfg ? `${esc(GH.cfg.owner)}/${esc(GH.cfg.repo)}` : '';
    if (legacy.n) n.innerHTML = `${icon('lock', 15)}<span>예전 잠긴 문서함에 문서${legacy.n > 0 ? ' ' + legacy.n + '개' : ''}가 남아 있습니다. ${link('hmMigrate', '모두 공통 저장소로 옮기기')} — 한 번만 문서함 암호를 넣으면 어느 기기 · 게스트 화면에서도 보입니다.</span>`;
    else if (box.state === 'err') n.innerHTML = `${icon('info', 15)}<span>문서 목록을 읽지 못했습니다. ${esc(box.err)} ${link('hmRetry', '다시 시도')}</span>`;
    else if (!HwpStore.box.canWrite()) n.innerHTML = `${icon('info', 15)}<span>문서는 어느 기기에서나 보입니다. 이 기기에서 <b>저장</b>하려면 ${link('hmGhOn', 'GitHub 에 연결')}하세요 (한 번만).</span>`;
    else if (box.state === 'ok' || box.state === 'loading') n.innerHTML = `${icon('link', 15)}<span>문서는 GitHub 저장소 <b>${repo}</b> 의 documents/ 에 저장되어 어느 기기에서나 보입니다 (게스트는 읽기만, 잠긴 폴더는 숨김) · ${link('hmGhOff', '연결 해제')}</span>`;
    else { n.hidden = true; return; }
    const on = (id, fn) => { const a = n.querySelector('#' + id); if (a) a.onclick = ev => { ev.preventDefault(); fn(); }; };
    on('hmGhOn', connect); on('hmRetry', loadBox); on('hmMigrate', migrate);
    on('hmGhOff', async () => { if (await U().askConfirm('GitHub 연결을 해제할까요?', '이 브라우저에 저장된 GitHub 토큰을 지웁니다. 저장소의 문서는 그대로입니다.', '연결 해제')) { GH.clear(); location.reload(); } });
  }

  /* ---------- 때 ---------- */
  function relTime(t) {
    t = typeof t === 'number' ? t : Date.parse(t || ''); if (!t) return '';
    const now = new Date(), d = new Date(t), mins = Math.floor((now - d) / 60000);
    if (mins < 1) return '방금'; if (mins < 60) return `${mins}분 전`;
    if (mins < 1440 && d.getDate() === now.getDate()) return `${Math.floor(mins / 60)}시간 전`;
    const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (d >= new Date(t0 - 864e5) && d < t0) return '어제';
    return d.getFullYear() === now.getFullYear() ? `${d.getMonth() + 1}월 ${d.getDate()}일` : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  }
  const inWeek = x => x.time && Date.now() - x.time < 7 * 864e5;

  /* ---------- 문서 목록: 문서함 + 임시본을 한 줄로 ---------- */
  /* ---------- 폴더: 관리자가 만들고 잠금. 잠긴 폴더는 게스트 화면(목록 · 검색 · 이어서 작업) 어디에도 안 보임 ---------- */
  const folderOf = id => box.folders.find(f => f.id === id) || null;
  const hiddenForGuest = it => GUEST && it.folder && (folderOf(it.folder) || {}).locked;
  const visibleFolders = () => box.folders.filter(f => !(GUEST && f.locked));
  function renderFolders() {
    const nav = $('hmFolders'), head = $('hmFoldHead'); const fs = visibleFolders();
    head.hidden = GUEST && !fs.length;
    nav.innerHTML = fs.map(f => `<button class="rail-item${filter === 'f:' + f.id ? ' on' : ''}" data-filter="f:${esc(f.id)}" title="${esc(f.name)}${f.locked ? ' — 잠금: 게스트에게 숨김' : ''}">${icon(f.locked ? 'lock' : 'folder')}<span>${esc(f.name)}</span><em>${box.items.filter(x => x.folder === f.id).length || ''}</em></button>`).join('');
  }
  async function folderNew() {
    if (!(await U().boxEnsure())) return;
    const n = await U().askText('새 폴더', '폴더 이름', '', '만들기'); if (!n) return;
    try { const id = await U().boxRun(() => HwpStore.box.folder.create(n)); toast(`"${n}" 폴더를 만들었습니다`, 2000); await loadBox(); setFilter('f:' + id); render(); }
    catch (e) { U().tell('폴더를 만들지 못했습니다', e.message); }
  }
  async function folderAct(f, what) {
    if (!(await U().boxEnsure())) return;
    const n = box.items.filter(x => x.folder === f.id).length;
    try {
      if (what === 'rename') { const v = await U().askText('폴더 이름 바꾸기', '폴더 이름', f.name, '바꾸기'); if (!v || v === f.name) return; await U().boxRun(() => HwpStore.box.folder.rename(f.id, v)); }
      if (what === 'lock') { if (!(await U().askConfirm(`"${f.name}" 폴더를 잠글까요?`, `게스트(보기 전용) 화면에서는 이 폴더와 안의 문서 ${n}개가 목록 · 검색 어디에도 보이지 않습니다.<br>다만 저장소가 공개라서, 파일 주소를 직접 아는 사람은 받을 수 있습니다.`, '잠그기'))) return; await U().boxRun(() => HwpStore.box.folder.lock(f.id, true)); }
      if (what === 'unlock') await U().boxRun(() => HwpStore.box.folder.lock(f.id, false));
      if (what === 'del') { if (!(await U().askConfirm(`"${f.name}" 폴더를 지울까요?`, `폴더만 지웁니다. 안의 문서 ${n}개는 지우지 않고 '모든 문서'로 나옵니다.`, '폴더 지우기', true))) return; await U().boxRun(() => HwpStore.box.folder.remove(f.id)); setFilter('all'); }
      toast({ rename: '폴더 이름을 바꿨습니다', lock: `"${f.name}" 폴더를 잠갔습니다 — 게스트에게 숨겨집니다`, unlock: `"${f.name}" 폴더 잠금을 풀었습니다`, del: '폴더를 지웠습니다' }[what], 2600);
    } catch (e) { U().tell('하지 못했습니다', e.message); }
    loadBox();
  }
  function moveDialog(x) {
    const opts = [['', '폴더 밖으로 (모든 문서)']].concat(box.folders.map(f => [f.id, (f.locked ? '🔒 ' : '') + f.name]));
    U().dialog(icon('folder', 16) + '폴더로 옮기기', `<p class="dlg-desc"><b>${esc(x.name)}</b></p><div class="grid1"><label>폴더</label><select id="mvF">${opts.map(([v, l]) => `<option value="${esc(v)}"${(x.box.folder || '') === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>${box.folders.length ? '' : '<p class="dlg-desc">아직 폴더가 없습니다. 왼쪽 [폴더 ＋] 로 만드세요.</p>'}`,
      { okText: '옮기기', onOk: async q => { if (!(await U().boxEnsure())) return false; try { await U().boxRun(() => HwpStore.box.folder.move(x.box.id, q('#mvF').value)); toast('옮겼습니다', 1600); loadBox(); } catch (e) { U().tell('옮기지 못했습니다', e.message); } } });
  }

  function docs() {
    const W = U().W, list = [];
    const byBox = new Map(); for (const d of drafts) if (d.boxId && !byBox.has(d.boxId)) byBox.set(d.boxId, d); // 임시본은 최근 것부터
    for (const it of box.items) {
      if (hiddenForGuest(it)) continue;
      const d = byBox.get(it.id) || null;
      list.push({ kind: 'box', id: it.id, name: it.name, time: Math.max(Date.parse(it.modified) || 0, d ? d.time : 0), size: it.size, device: it.device, preview: (d && d.preview) || it.preview, box: it, draft: d, cur: !!W.doc && (it.id === W.boxId || (d && d.id === W.draftId)) });
    }
    const boxIds = new Set(box.items.map(x => x.id));
    for (const d of drafts) { if (d.boxId && boxIds.has(d.boxId)) continue; list.push({ kind: 'draft', id: 'd:' + d.id, name: d.name, time: d.time, preview: d.preview, draft: d, cur: !!W.doc && d.id === W.draftId }); }
    return list;
  }
  function sorted(list) {
    const by = { recent: (a, b) => b.time - a.time, name: (a, b) => a.name.localeCompare(b.name, 'ko') };
    return list.slice().sort(by[pref.sort] || by.recent);
  }

  /* ---------- 카드 ---------- */
  /* 종이: 미리보기 글이 있으면 그 글(첫 줄이 제목처럼), 없으면 이름과 글줄 모양 */
  function sheetHtml(title, preview, badge) {
    const body = preview ? `<div class="ds-text">${esc(preview)}</div>` : `<div class="ds-title">${esc(title)}</div><div class="ds-lines"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
    return `<div class="doc-sheet" tabindex="0" role="link">${body}${badge ? `<span class="ds-badge">${esc(badge)}</span>` : ''}<div class="ds-hover"></div></div>`;
  }
  /* o: { id, title, preview, badge, meta: [], chip, note, tags, cur, click, actions: [{ label, icon, run }], menu: [{ label, icon, run, danger } | null] } */
  function card(o) {
    const c = document.createElement('article'); c.className = 'doc-card' + (o.cur ? ' cur' : ''); c.dataset.id = o.id;
    c.innerHTML = sheetHtml(o.title, o.preview, o.badge) + `<div class="doc-body"><div class="doc-text"><div class="doc-title" title="${esc(o.title)}">${esc(o.title)}</div><div class="doc-meta">${(o.meta || []).filter(Boolean).map(m => `<span>${esc(m)}</span>`).join('')}${o.chip ? `<span class="draft-chip" title="저장하지 않은 작업본이 이 기기에 남아 있습니다. 열면 그 작업본을 엽니다">${esc(o.chip)}</span>` : ''}${o.tags && o.tags.length ? `<span class="doc-tags">${o.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</span>` : ''}</div>${o.note ? `<div class="doc-note" title="${esc(o.note)}">${esc(o.note)}</div>` : ''}</div>
      <div class="doc-actions">${o.actions.map((a, i) => `<button class="btn sm" data-a="${i}">${icon(a.icon, 14)}${esc(a.label)}</button>`).join('')}</div>
      ${o.menu && o.menu.length ? `<button class="btn icon ghost kebab" data-more title="더 보기" aria-label="${esc(o.title)} 더 보기">${icon('dots')}</button>` : ''}</div>`;
    const sheet = c.querySelector('.doc-sheet'), hv = c.querySelector('.ds-hover');
    const main = o.click || o.actions[0];
    hv.innerHTML = o.actions.map((a, i) => `<button class="btn${i === 0 ? ' ink' : ''}" data-a="${i}">${icon(a.icon, 16)}${esc(a.label)}</button>`).join('');
    sheet.setAttribute('aria-label', `${o.title} — ${main.label}`);
    sheet.onclick = ev => { const b = ev.target.closest('button[data-a]'); if (b) run(o.actions[+b.dataset.a], c); else if (!ev.target.closest('button')) run(main, c); };
    sheet.onkeydown = ev => { if (ev.key === 'Enter' && ev.target === sheet) run(main, c); };
    c.querySelector('.doc-actions').onclick = ev => { const b = ev.target.closest('button[data-a]'); if (b) run(o.actions[+b.dataset.a], c); };
    const more = c.querySelector('[data-more]'); if (more) more.onclick = () => menu(more, o.menu, c);
    return c;
  }
  async function run(a, host) {
    if (!a || (host && host.classList.contains('busy'))) return;
    if (host) host.classList.add('busy');
    try { await a.run(); } catch (e) { console.error(e); U().tell(a.label + ' — 하지 못했습니다', e.message); }
    finally { if (host) host.classList.remove('busy'); }
  }
  function grid() { const g = document.createElement('div'); g.className = 'doc-grid' + (pref.view === 'list' ? ' list' : ''); return g; }
  function ghosts(n) { const g = grid(); for (let i = 0; i < n; i++) { const c = document.createElement('div'); c.className = 'doc-card ghost'; c.innerHTML = '<div class="doc-sheet"></div><div class="doc-body"><div><div class="line"></div><div class="line short"></div></div></div>'; g.appendChild(c); } return g; }
  /* 안내 판: 잠김 · 연결 없음 · 비어 있음 */
  function panel(ic, html, sub, btns) {
    const d = document.createElement('div'); d.className = 'hm-panel';
    d.innerHTML = `<div class="pi">${icon(ic, 20)}</div><div class="t">${html}${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
    for (const [label, bic, fn, cls] of btns || []) { const b = document.createElement('button'); b.className = 'btn' + (cls ? ' ' + cls : ''); b.innerHTML = (bic ? icon(bic, 16) : '') + esc(label); b.onclick = fn; d.appendChild(b); }
    return d;
  }
  function empty(html) { const d = document.createElement('div'); d.className = 'hub-empty'; d.innerHTML = html; return d; }
  function headBtn(host, label, ic, fn, cls) { const b = document.createElement('button'); b.className = 'btn sm' + (cls ? ' ' + cls : ''); b.innerHTML = (ic ? icon(ic, 14) : '') + esc(label); b.onclick = fn; host.appendChild(b); return b; }

  /* ---------- ⋯ 메뉴 (ui.js 의 펼침 메뉴를 같이 씀) ---------- */
  const menu = (btn, items, host) => U().popMenu(btn, items.map(it => it && Object.assign({}, it, { run: () => run(it, host) })), { alignRight: true, focus: true });
  const closeMenu = () => U().closePop();

  /* ---------- 문서(문서함 · 임시본) 카드 ---------- */
  function docCard(x) {
    const W = U().W;
    const openDraft = async () => { if (!(await U().confirmDiscard())) return; const r = await HwpStore.drafts.get(x.draft.id); if (!r) { toast('임시본이 이미 지워졌습니다'); loadDrafts(); return; } toast('임시본을 여는 중…', 20000); await U().openBytes(await r.blob.arrayBuffer(), { name: r.name, draftId: x.draft.id, boxId: r.boxId || null, dirty: true }); };
    const openBox = async () => { if (!(await U().confirmDiscard())) return; toast('여는 중…', 20000); const u = await U().boxRun(() => HwpStore.box.load(x.box.id)); await U().openBytes(u.buffer, { name: x.box.name, boxId: x.box.id, savedTime: Date.parse(x.box.modified) || null }); };
    const open = x.cur ? async () => hide() : (x.draft ? openDraft : openBox);
    const print = async () => { await open(); if (U().W.doc && root.hidden) U().act('print'); };
    const dl = async () => { toast('받는 중…', 20000); const u = await U().boxRun(() => HwpStore.box.load(x.box.id)); HwpStore.download(x.box.name + '.hwpx', new Blob([u], { type: 'application/hwp+zip' })); toast('내려받기 폴더에 저장했습니다 (' + x.box.name + '.hwpx)', 2600); };
    const ren = async () => { const n = await U().askText('이름 바꾸기', '이름', x.box.name, '바꾸기'); if (!n || n === x.box.name) return; await U().boxRun(() => HwpStore.box.rename(x.box.id, n)); if (x.box.id === W.boxId) U().setName(n); x.box.name = n; render(); toast('이름을 바꿨습니다'); };
    const delBox = async () => { if (!(await U().askConfirm(`"${x.name}" 을(를) 문서함에서 지울까요?`, '저장소에서 지웁니다. Git 기록에는 남습니다.' + (x.draft ? ' 이 기기의 임시본은 그대로 둡니다.' : ''), '삭제', true))) return; await U().boxRun(() => HwpStore.box.remove(x.box.id)); if (x.box.id === W.boxId) { W.boxId = null; U().updateState(); } box.items = box.items.filter(b => b.id !== x.box.id); render(); toast('문서함에서 지웠습니다', 2200); };
    const delDraft = async () => { if (!(await U().askConfirm(`"${x.name}" 임시본을 지울까요?`, x.box ? '문서함에 저장된 문서는 그대로 두고, 이 기기에 남은 저장 안 한 작업본만 지웁니다.' : '지우면 되살릴 수 없습니다.', '지우기', true))) return; await HwpStore.drafts.del(x.draft.id); loadDrafts(); };
    const openLabel = x.cur ? '편집으로 돌아가기' : x.draft ? '이어서 편집' : GUEST ? '열기' : '열어서 편집';
    const o = { id: x.id, cur: x.cur, title: x.name, preview: x.preview,
      meta: [x.cur ? '지금 편집 중' : '', relTime(x.time) + (x.time ? (x.draft ? ' 임시 저장' : ' 저장') : ''), x.kind === 'box' ? ((folderOf(x.box.folder) || {}).name || '모든 기기') : (x.draft.boxId ? '저장된 문서 · 이 기기 작업본' : '이 기기'), x.size ? U().fmtKB(x.size) : '', x.device || ''],
      chip: x.draft ? '저장 안 한 작업본' : '',
      actions: [{ label: openLabel, icon: 'edit', run: open }, { label: '인쇄', icon: 'print', run: print }],
      menu: [{ label: openLabel, icon: 'edit', run: open }, { label: '인쇄 · PDF 저장', icon: 'print', run: print }] };
    if (x.box && x.draft) o.menu.push({ label: '저장본 열기 (작업본 말고)', icon: 'folder', run: openBox });
    if (x.box) o.menu.push({ label: 'hwpx 내려받기', icon: 'download', run: dl });
    if (x.box && !GUEST) o.menu.push({ label: '이름 바꾸기', icon: 'edit', run: ren }, { label: '폴더로 옮기기', icon: 'folder', run: () => moveDialog(x) });
    o.menu.push(null);
    if (x.draft) o.menu.push({ label: '임시본 지우기', icon: 'trash', run: delDraft, danger: true });
    if (x.box && !GUEST) o.menu.push({ label: '삭제', icon: 'trash', run: delBox, danger: true });
    return o;
  }
  async function boxUpload() {
    const p = await HwpStore.pickOpen().catch(e => { U().tell('파일을 열지 못했습니다', e.message); return null; }); if (!p) return;
    if (!(await U().boxEnsure())) return;
    toast('올리는 중…', 20000);
    const fid = filter.startsWith('f:') ? filter.slice(2) : null;
    try { await U().boxRun(() => HwpStore.box.save(null, p.file.name.replace(/\.hwpx$/i, ''), p.file, U().deviceName(), null, fid ? { folder: fid } : null)); toast('올렸습니다 — 모든 기기에서 보입니다', 2200); }
    catch (e) { console.error(e); U().tell('올리지 못했습니다', e.message); }
    loadBox();
  }

  /* ---------- 이어서 작업 (가장 최근 문서) ---------- */
  function renderHero(x) {
    const R = $('hmResume'); R.hidden = !x; if (!x) return;
    const o = docCard(x);
    const when = x.time ? new Date(x.time).toLocaleString('ko-KR') : '';
    R.innerHTML = `${sheetHtml(o.title, o.preview)}<div class="rs-side"><div class="eyebrow">${x.cur ? '지금 편집 중' : '이어서 작업'}</div><h2 class="rs-title">${esc(o.title)}</h2><div class="meta" title="${esc(when)}">${o.meta.slice(1).filter(Boolean).map(m => `<span>${esc(m)}</span>`).join(' · ')}${o.chip ? ` · <span class="draft-chip">${esc(o.chip)}</span>` : ''}</div>
      <div class="rs-facts">${x.box ? `<span>${icon('lock', 14)}GitHub 문서함에 암호로 보관 · 다른 기기에서도 같은 문서</span>` : `<span>${icon('clock', 14)}이 브라우저에 자동 임시 저장된 작업본 · 저장하면 문서함이나 PC 파일로</span>`}</div>
      <div class="cta"><button class="btn ink lg" data-a="0">${icon('edit')}${esc(o.actions[0].label)}</button><button class="btn lg" data-a="1">${icon('print')}인쇄</button><span class="flex"></span><button class="btn icon ghost" data-more title="더 보기" aria-label="${esc(o.title)} 더 보기">${icon('dots')}</button></div></div>`;
    const sheet = R.querySelector('.doc-sheet'); sheet.querySelector('.ds-hover').remove();
    sheet.setAttribute('aria-label', `${o.title} — ${o.actions[0].label}`);
    sheet.onclick = () => run(o.actions[0], R); sheet.onkeydown = ev => { if (ev.key === 'Enter') run(o.actions[0], R); };
    R.querySelectorAll('[data-a]').forEach(b => b.onclick = () => run(o.actions[+b.dataset.a], R));
    R.querySelector('[data-more]').onclick = ev => menu(ev.currentTarget, o.menu, R);
  }

  /* ---------- 문서 격자 ----------
     돌려주는 값: 문서함 상태(연결 없음 · 잠김 · 오류)를 이 자리의 안내 판으로 보였는지 — 보였으면 위 한 줄 알림은 줄임 */
  function renderDocs(list, hero, q) {
    const S = $('secDocs'), body = $('docsBody'), acts = $('docsActs'), head = $('docsHead'), cnt = $('docsCnt');
    S.hidden = filter === 'best'; if (S.hidden) return false;
    acts.innerHTML = '';
    // 제목은 "이어서 작업" 아래 나머지일 때만 ("모든 문서" 아래 또 "모든 문서" 가 보이지 않게)
    head.textContent = '다른 문서'; head.hidden = cnt.hidden = !hero;
    cnt.textContent = list.length ? `${list.length}개` : '';
    const W = U().W;
    const vf = filter.startsWith('f:') ? folderOf(filter.slice(2)) : null;
    if (vf && !GUEST) { // 폴더 안: 관리자 도구
      head.textContent = vf.locked ? '잠긴 폴더 — 게스트에게 숨김' : '폴더'; head.hidden = false;
      headBtn(acts, '이름 바꾸기', 'edit', () => folderAct(vf, 'rename'), 'ghost');
      headBtn(acts, vf.locked ? '잠금 풀기' : '잠그기', vf.locked ? 'unlock' : 'lock', () => folderAct(vf, vf.locked ? 'unlock' : 'lock'), 'ghost');
      headBtn(acts, '폴더 지우기', 'trash', () => folderAct(vf, 'del'), 'ghost');
    } else if (filter === 'all' && !GUEST && box.state === 'ok') headBtn(acts, '파일 올리기', 'upload', boxUpload).title = '내 PC 의 .hwpx 파일을 올려 모든 기기에서 보이게 합니다';
    $('secDocs').querySelector('.hm-head').hidden = !hero && !acts.children.length && !vf;
    if (list.length) { const g = grid(); for (const x of list) g.appendChild(card(docCard(x))); body.replaceChildren(g); return false; }
    if (hero) { body.innerHTML = ''; S.hidden = true; return false; } // 문서가 하나뿐이면 "이어서 작업"만
    const loading = !draftsLoaded || box.state === 'idle' || (box.state === 'loading' && filter !== 'draft');
    if (loading) { body.replaceChildren(ghosts(5)); return false; }
    if (q) { body.replaceChildren(empty(`<b>"${esc(kw)}" 이(가) 들어간 문서가 없습니다</b><span>검색 칸을 비우면 전체가 보입니다.</span>`)); return false; }
    const boxPanel = () => box.state === 'err' ? panel('info', '<b>문서 목록을 읽지 못했습니다.</b>', esc(box.err), [['다시 시도', 'redo', loadBox]]) : null;
    if (vf) { body.replaceChildren(empty(`<b>폴더가 비어 있습니다</b><span>${GUEST ? '' : '문서 카드의 ⋯ → [폴더로 옮기기] 로 넣거나, 이 폴더를 연 채로 [파일 올리기]를 쓰세요.'}</span>`)); return false; }
    if (filter === 'all') {
      if (box.state === 'err') { body.replaceChildren(boxPanel()); return true; }
      const e = empty(`${W.doc ? '<b>저장된 문서가 없습니다</b><span>지금 문서를 저장(Ctrl+S)하면 어느 기기에서나 여기에 보입니다.</span>' : '<b>첫 문서를 만들어 보세요</b><span>새 문서를 만들거나 PC 의 .hwpx 파일을 이 화면에 끌어다 놓으세요.</span>'}<div class="hub-empty-cta"><button class="btn${$('hmNew').getClientRects().length ? '' : ' ink'}" id="emNew">${icon('plus')}새 문서</button><button class="btn ghost" id="emOpen">${icon('import')}파일 가져오기</button></div>`);
      body.replaceChildren(e);
      e.querySelector('#emNew').onclick = () => U().newDoc(); e.querySelector('#emOpen').onclick = () => U().openDialog();
      return false;
    }
    if (filter === 'week') body.replaceChildren(empty('<b>최근 7일 동안 저장한 문서가 없습니다</b>'));
    if (filter === 'draft') body.replaceChildren(empty('<b>저장하지 않은 작업본이 없습니다</b><span>편집하다가 저장하지 않고 닫으면 여기에 모입니다.</span>'));
    return false;
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
  function renderBest(match, q) {
    const S = $('secBest'); S.hidden = GUEST || !(filter === 'all' || filter === 'best'); if (S.hidden) return 0;
    const body = $('bestBody'), acts = $('bestActs'), cnt = $('bestCnt');
    acts.innerHTML = ''; cnt.textContent = '';
    if (best.state === 'idle' || (best.state === 'loading' && !best.items.length)) { body.replaceChildren(ghosts(4)); return 0; }
    if (best.state === 'locked') { body.replaceChildren(panel('lock', GUEST ? '<b>best 문서는 암호로 잠겨 있습니다.</b> 게스트 모드에서는 볼 수 없습니다.' : '<b>best 문서는 문서함과 같은 암호로 잠겨 있습니다.</b> 암호를 입력하면 여기에 바로 보입니다.', '', GUEST ? [] : [['암호 입력', 'unlock', unlock]])); return 0; }
    if (best.state === 'err') { body.replaceChildren(panel('info', `<b>best 문서 목록을 읽지 못했습니다.</b> ${esc(best.err)}`, '', [['다시 시도', 'redo', loadBest]])); return 0; }
    if (!GUEST) headBtn(acts, 'hwpx 올리기', 'upload', pickBest);
    const list = sorted(best.items.map(it => ({ it, name: it.name, time: Date.parse(it.added) || 0 }))).map(x => x.it).filter(it => match(it.name, it.note, (it.tags || []).join(' '), it.meta && it.meta.preview));
    cnt.textContent = `${best.items.length ? list.length + '개 · ' : ''}${BestDocs.MODE_NAMES[BestDocs.mode()]}`;
    if (!best.items.length) { body.replaceChildren(GUEST ? panel('bookmark', '<b>아직 올린 best 문서가 없습니다.</b> 관리자가 올리면 여기에 보입니다.', '', []) : dropZone()); return 0; }
    if (!list.length) { if (q && filter === 'all') S.hidden = true; else body.replaceChildren(empty(`<b>"${esc(kw)}" 이(가) 들어간 best 문서가 없습니다</b>`)); return 0; }
    const g = grid(); for (const it of list) g.appendChild(card(bestCard(it)));
    if (!GUEST && !q && pref.view !== 'list') { const add = document.createElement('div'); add.className = 'doc-card add'; add.appendChild(dropZone()); g.appendChild(add); }
    body.replaceChildren(g);
    return list.length;
  }

  /* ---------- 그리기 ---------- */
  function render() {
    if (root.hidden) return;
    const q = kw.toLowerCase();
    const match = (...xs) => !q || xs.some(x => (x || '').toLowerCase().includes(q));
    const all = docs();
    $('cAll').textContent = all.length || ''; $('cWeek').textContent = all.filter(inWeek).length || '';
    $('cDraft').textContent = drafts.length || ''; $('cBest').textContent = best.items.length || '';
    $('dDraft').hidden = !drafts.length; // 노란 점: 저장 안 한 작업본이 있을 때만
    const vf = filter.startsWith('f:') ? folderOf(filter.slice(2)) : null;
    if (filter.startsWith('f:') && (!vf || (GUEST && vf.locked))) { filter = 'all'; setFilter('all'); }
    renderFolders();
    $('hmTitle').textContent = q ? '검색 결과' : vf ? vf.name : FILTERS[filter];
    let list = all.filter(x => match(x.name, x.preview));
    if (vf) list = list.filter(x => x.box && x.box.folder === vf.id);
    if (filter === 'week') list = list.filter(inWeek);
    if (filter === 'draft') list = list.filter(x => x.draft);
    if (filter === 'best') list = [];
    list = sorted(list);
    const hero = filter === 'all' && !q && pref.sort === 'recent' && list.length ? list[0] : null;
    renderHero(hero); banner(hero);
    const rest = hero ? list.slice(1) : list;
    notice(renderDocs(rest, hero, q));
    const nb = renderBest(match, q);
    const shown = list.length + nb;
    $('hmSub').textContent = (q || filter !== 'all') ? `${shown}개` : (all.length ? `문서 ${all.length}개` : '');
  }
  function setFilter(k) {
    filter = k;
    document.querySelectorAll('#hmNav [data-filter], #hmFolders [data-filter]').forEach(b => { const on = b.dataset.filter === k; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }
  const paintView = () => document.querySelectorAll('#home .seg-b').forEach(b => { const on = b.dataset.view === pref.view; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });

  /* ---------- 사용 안내 ---------- */
  function guideDialog() {
    U().dialog(icon('help', 16) + 'DOCUMENT 사용 안내', `<div class="hm-guide">
      <section><h4>문서는 어디에 있나</h4><p><b>문서함</b> — GitHub 저장소에 암호로 잠가 보관합니다. 집·사무실·휴대폰 어디서나 같은 문서를 열고 저장합니다.</p><p><b>저장 안 한 작업본</b> — 편집 중인 내용은 이 브라우저에 자동으로 임시 저장됩니다. 창을 닫아도 첫 화면에서 이어서 엽니다.</p><p><b>내 PC 파일</b> — .hwpx 파일을 열면 같은 파일에 바로 저장됩니다(크롬·엣지). 사무실 한글에서 그대로 열립니다.</p></section>
      <section><h4>best 문서</h4><p>잘 만든 hwpx 를 올려 두면 레퍼런스로 쌓입니다. <b>바탕으로 새 문서</b>로 그 서식 위에서 바로 시작하고, <b>구조</b>에서 스타일·글꼴·표 구성을 봅니다.</p><p>올릴 때 메모와 꼬리표(공문 · 보고서 …)를 달아 두면 검색이 편합니다.</p></section>
      <section><h4>편리한 기능</h4><p>이 화면에 .hwpx 파일을 끌어다 놓으면 바로 열립니다. <kbd>/</kbd> 로 검색, <kbd>Esc</kbd> 로 편집 화면으로 돌아갑니다.</p><p>한글과 같은 단축키를 씁니다 — <kbd>Alt</kbd>+<kbd>L</kbd> 글자 모양, <kbd>Alt</kbd>+<kbd>T</kbd> 문단 모양, <kbd>F7</kbd> 편집 용지, <kbd>F1</kbd> 전체 보기.</p><p><b>.hwp</b>(옛 형식)는 한글에서 <b>다른 이름으로 저장 → 한글 표준 문서(*.hwpx)</b> 로 한 번 저장한 뒤 여세요.</p></section>
    </div>`, { width: 760, noEnter: true, noFocus: true, foot: `<button class="tb" id="hgKeys">${icon('help', 15)}단축키 모음 (F1)</button><span class="grow"></span><button class="tb primary" data-x="cancel">닫기</button>`, init: (q, close) => { q('#hgKeys').onclick = () => { close(false); U().helpDialog(); }; } });
  }

  /* ---------- 단추 · 키 ---------- */
  function init() {
    if (inited) return; inited = true;
    $('hmNav').onclick = $('hmFolders').onclick = e => { const b = e.target.closest('[data-filter]'); if (!b) return; setFilter(b.dataset.filter); render(); root.scrollTop = 0; };
    $('hmFolderNew').onclick = folderNew;
    $('hmQ').oninput = () => { kw = $('hmQ').value.trim(); render(); };
    const sortSel = $('hmSort'); sortSel.value = pref.sort; sortSel.onchange = () => { pref.sort = sortSel.value; savePref(); render(); };
    document.querySelectorAll('#home .seg-b').forEach(b => b.onclick = () => { pref.view = b.dataset.view; savePref(); paintView(); render(); });
    paintView();
    $('hmNew').onclick = () => U().newDoc();
    $('hmOpen').onclick = () => U().openDialog();
    $('hmHelp').onclick = guideDialog;
    $('hmBack').onclick = hide;
    $('hmGh').onclick = connect;
    document.addEventListener('keydown', ev => {
      if (root.hidden || document.querySelector('.dlg-bg, .modal-bg')) return;
      const inField = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
      if (ev.key === '/' && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !inField) { ev.preventDefault(); $('hmQ').focus(); return; }
      if (ev.key === 'Escape') {
        if (closeMenu()) return;
        if (document.activeElement === $('hmQ')) { if (kw) { $('hmQ').value = ''; kw = ''; render(); } else $('hmQ').blur(); return; }
        if (U().W.doc) hide(); // 문서를 열어 둔 채 왔으면 편집으로
      }
    });
  }
  init();
  return { show, hide, refresh, render, get visible() { return !root.hidden; } };
})();
