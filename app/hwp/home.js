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
  const FILTERS = { all: '모든 문서', box: '문서함', week: '최근 7일', draft: '저장 안 한 작업본', best: 'best 문서', shared: '올린 문서' };
  const PREF = 'hwp:home'; // 이 기기에 기억하는 보기 설정
  const pref = (() => { try { return Object.assign({ view: 'grid', sort: 'recent' }, JSON.parse(localStorage.getItem(PREF) || '{}')); } catch (e) { return { view: 'grid', sort: 'recent' }; } })();
  const savePref = () => { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) { } };
  let filter = 'all', kw = '';
  const box = { state: 'idle', items: [], err: '' };  // noconn(GitHub 연결 없음) · locked(암호) · loading · ok · err
  const best = { state: 'idle', items: [], err: '' }; // locked(GitHub 암호) · loading · ok · err
  const shared = { state: 'idle', items: [] };       // 올린 문서: documents/*.hwpx + documents/index.json (교안의 decks/ 와 같은 방식 — 잠그지 않은 공개 파일, 관리자 화면에만 보임)
  let drafts = [], draftsLoaded = false, inited = false;

  /* ---------- 보이기 / 숨기기 ---------- */
  function show(which) {
    if (which && FILTERS[which]) setFilter(GUEST && which === 'best' ? 'all' : which); // 게스트는 best 문서를 볼 수 없음
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
    loadDrafts(); loadBox(); loadBest(); loadShared();
  }
  async function loadShared() {
    if (GUEST) return;
    try { const r = await fetch('documents/index.json', { cache: 'no-store' }); shared.items = r.ok ? ((await r.json()).items || []) : []; shared.state = 'ok'; }
    catch (e) { shared.items = []; shared.state = 'ok'; }
    render();
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
    if (GUEST) return; // 게스트에게는 best 문서 목록을 받지도 않음
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
  async function connect() { if (await U().connectDialog()) { toast('GitHub 에 연결했습니다'); refresh(); } }
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
    if (box.state === 'noconn') n.innerHTML = `${icon('info', 15)}<span>지금은 이 기기에서만 저장됩니다. 집·사무실·휴대폰에서 같은 문서를 열려면 ${link('hmGhOn', 'GitHub 에 연결')}하세요.</span>`;
    else if (box.state === 'locked') n.innerHTML = `${icon('lock', 15)}<span>문서함이 잠겨 있습니다. ${link('hmUnlock', '문서함 열기')}</span>`;
    else if (box.state === 'err') n.innerHTML = `${icon('info', 15)}<span>문서함을 읽지 못했습니다. ${esc(box.err)} ${link('hmRetry', '다시 시도')}</span>`;
    else if (box.state === 'ok' || box.state === 'loading') n.innerHTML = `${icon('link', 15)}<span>GitHub 저장소 <b>${esc(GH.cfg.owner)}/${esc(GH.cfg.repo)}</b> 에 암호로 잠가 보관합니다 · ${link('hmLock', '잠그기')} · ${link('hmGhOff', '연결 해제')}</span>`;
    else { n.hidden = true; return; }
    const on = (id, fn) => { const a = n.querySelector('#' + id); if (a) a.onclick = ev => { ev.preventDefault(); fn(); }; };
    on('hmGhOn', unlock); on('hmUnlock', unlock); on('hmRetry', loadBox); on('hmLock', lock);
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
  function docs() {
    const W = U().W, list = [];
    const byBox = new Map(); for (const d of drafts) if (d.boxId && !byBox.has(d.boxId)) byBox.set(d.boxId, d); // 임시본은 최근 것부터
    for (const it of box.items) {
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
    const openBox = async () => { if (!(await U().confirmDiscard())) return; toast('문서함에서 여는 중…', 20000); const u = await U().boxRun(() => HwpStore.box.load(x.box.id)); await U().openBytes(u.buffer, { name: x.box.name, boxId: x.box.id, savedTime: Date.parse(x.box.modified) || null }); };
    const open = x.cur ? async () => hide() : (x.draft ? openDraft : openBox);
    const print = async () => { await open(); if (U().W.doc && root.hidden) U().act('print'); };
    const dl = async () => { toast('받는 중…', 20000); const u = await U().boxRun(() => HwpStore.box.load(x.box.id)); HwpStore.download(x.box.name + '.hwpx', new Blob([u], { type: 'application/hwp+zip' })); toast('내려받기 폴더에 저장했습니다 (' + x.box.name + '.hwpx)', 2600); };
    const ren = async () => { const n = await U().askText('이름 바꾸기', '이름', x.box.name, '바꾸기'); if (!n || n === x.box.name) return; await U().boxRun(() => HwpStore.box.rename(x.box.id, n)); if (x.box.id === W.boxId) U().setName(n); x.box.name = n; render(); toast('이름을 바꿨습니다'); };
    const delBox = async () => { if (!(await U().askConfirm(`"${x.name}" 을(를) 문서함에서 지울까요?`, 'GitHub 기록에는 암호화된 상태로 남습니다.' + (x.draft ? ' 이 기기의 임시본은 그대로 둡니다.' : ''), '삭제', true))) return; await U().boxRun(() => HwpStore.box.remove(x.box.id)); if (x.box.id === W.boxId) { W.boxId = null; U().updateState(); } box.items = box.items.filter(b => b.id !== x.box.id); render(); toast('문서함에서 지웠습니다', 2200); };
    const delDraft = async () => { if (!(await U().askConfirm(`"${x.name}" 임시본을 지울까요?`, x.box ? '문서함에 저장된 문서는 그대로 두고, 이 기기에 남은 저장 안 한 작업본만 지웁니다.' : '지우면 되살릴 수 없습니다.', '지우기', true))) return; await HwpStore.drafts.del(x.draft.id); loadDrafts(); };
    const openLabel = x.cur ? '편집으로 돌아가기' : x.draft ? '이어서 편집' : GUEST ? '열기' : '열어서 편집';
    const o = { id: x.id, cur: x.cur, title: x.name, preview: x.preview,
      meta: [x.cur ? '지금 편집 중' : '', relTime(x.time) + (x.time ? (x.draft ? ' 임시 저장' : ' 저장') : ''), x.kind === 'box' ? '문서함' : (x.draft.boxId ? '문서함 문서 · 이 기기' : '이 기기'), x.size ? U().fmtKB(x.size) : '', x.device || ''],
      chip: x.draft ? '저장 안 한 작업본' : '',
      actions: [{ label: openLabel, icon: 'edit', run: open }, { label: '인쇄', icon: 'print', run: print }],
      menu: [{ label: openLabel, icon: 'edit', run: open }, { label: '인쇄 · PDF 저장', icon: 'print', run: print }] };
    if (x.box && x.draft) o.menu.push({ label: '문서함 저장본 열기 (작업본 말고)', icon: 'folder', run: openBox });
    if (x.box) o.menu.push({ label: 'hwpx 내려받기', icon: 'download', run: dl }, { label: '이름 바꾸기', icon: 'edit', run: ren });
    o.menu.push(null);
    if (x.draft) o.menu.push({ label: '임시본 지우기', icon: 'trash', run: delDraft, danger: true });
    if (x.box) o.menu.push({ label: '문서함에서 삭제', icon: 'trash', run: delBox, danger: true });
    return o;
  }
  async function boxUpload() {
    const p = await HwpStore.pickOpen().catch(e => { U().tell('파일을 열지 못했습니다', e.message); return null; }); if (!p) return;
    toast('문서함에 올리는 중…', 20000);
    try { await U().boxRun(() => HwpStore.box.save(null, p.file.name.replace(/\.hwpx$/i, ''), p.file, U().deviceName())); toast('문서함에 올렸습니다', 2200); }
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
    if (GUEST) { // 게스트: 문서함 · best 문서 모두 볼 수 없음 — 빈 화면 대신 할 수 있는 일을 안내
      S.hidden = false; acts.innerHTML = ''; S.querySelector('.hm-head').hidden = true;
      body.replaceChildren(panel('lock', '<b>게스트 모드에서는 문서함과 best 문서를 볼 수 없습니다.</b> 내 PC 의 .hwpx 파일은 [파일 가져오기]로 열어 읽고 인쇄할 수 있습니다.', '', [['파일 가져오기', 'import', () => U().openDialog()]]));
      return true;
    }
    S.hidden = filter === 'best' || filter === 'shared'; if (S.hidden) return false;
    acts.innerHTML = '';
    // 제목은 "이어서 작업" 아래 나머지일 때만 ("모든 문서" 아래 또 "모든 문서" 가 보이지 않게)
    head.textContent = '다른 문서'; head.hidden = cnt.hidden = !hero;
    cnt.textContent = list.length ? `${list.length}개` : '';
    const W = U().W;
    if (filter === 'box' && box.state === 'ok') {
      headBtn(acts, '파일 올리기', 'upload', boxUpload).title = '내 PC 의 .hwpx 파일을 문서함에 올립니다';
      if (W.doc) headBtn(acts, W.boxId ? '현재 문서 저장' : '현재 문서를 문서함에', 'save', () => { hide(); U().save('box'); });
      headBtn(acts, '잠그기', 'lock', lock, 'ghost').title = '이 기기에 기억한 문서함 암호를 지웁니다';
    }
    $('secDocs').querySelector('.hm-head').hidden = !hero && !acts.children.length;
    if (list.length) { const g = grid(); for (const x of list) g.appendChild(card(docCard(x))); body.replaceChildren(g); return false; }
    if (hero) { body.innerHTML = ''; S.hidden = true; return false; } // 문서가 하나뿐이면 "이어서 작업"만
    const loading = !draftsLoaded || box.state === 'idle' || (box.state === 'loading' && filter !== 'draft');
    if (loading) { body.replaceChildren(ghosts(5)); return false; }
    if (q) { body.replaceChildren(empty(`<b>"${esc(kw)}" 이(가) 들어간 문서가 없습니다</b><span>검색 칸을 비우면 전체가 보입니다.</span>`)); return false; }
    const boxPanel = () => {
      if (box.state === 'noconn') return panel('link', '<b>문서함은 GitHub 연결이 있어야 씁니다.</b>', '토큰을 한 번 넣고 문서함 암호를 정하면, 문서가 암호로 잠겨 보관되고 집·사무실·휴대폰 어디서나 같은 문서를 엽니다 (PRESENTATION과 같은 연결).', [['GitHub 연결', 'link', unlock]]);
      if (box.state === 'locked') return panel('lock', '<b>문서함이 잠겨 있습니다.</b>', '암호를 입력하면 문서가 여기에 바로 보입니다.', [['문서함 열기', 'unlock', unlock]]);
      if (box.state === 'err') return panel('info', '<b>문서함을 읽지 못했습니다.</b>', esc(box.err), [['다시 시도', 'redo', loadBox]]);
      return null;
    };
    if (filter === 'box') { const bp = boxPanel(); body.replaceChildren(bp || panel('folder', '<b>문서함이 비어 있습니다.</b>', '편집 중인 문서를 문서함에 저장하거나 위의 [파일 올리기] 로 PC 의 hwpx 파일을 올리면, 다른 기기에서도 같은 문서를 엽니다.')); return !!bp; }
    if (filter === 'all') {
      if (box.state === 'locked' || box.state === 'err') { body.replaceChildren(boxPanel()); return true; }
      if (shared.items.length && !q) { body.innerHTML = ''; S.hidden = true; return false; } // 올린 문서가 있으면 '첫 문서를 만들어 보세요' 대신 그 목록이 보이게
      const e = empty(`${W.doc ? '<b>문서함과 이 기기에 남은 문서가 없습니다</b><span>지금 문서를 문서함에 저장하면 다른 기기에서도 여기에 보입니다.</span>' : '<b>첫 문서를 만들어 보세요</b><span>새 문서를 만들거나 PC 의 .hwpx 파일을 이 화면에 끌어다 놓으세요.</span>'}<div class="hub-empty-cta"><button class="btn${$('hmNew').getClientRects().length ? '' : ' ink'}" id="emNew">${icon('plus')}새 문서</button><button class="btn ghost" id="emOpen">${icon('import')}파일 가져오기</button></div>`);
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

  /* ---------- 올린 문서 (documents/) ---------- */
  async function sharedBuf(it) { const r = await fetch('documents/' + encodeURIComponent(it.file), { cache: 'no-store' }); if (!r.ok) throw new Error('파일을 받지 못했습니다 (' + r.status + ')'); return r.arrayBuffer(); }
  async function sharedOpen(it) { if (!(await U().confirmDiscard())) return false; toast('여는 중…', 20000); return U().openBytes(await sharedBuf(it), { name: it.name }); } // 저장소에 이미 있는 문서라 '고친 내용 없음'으로 연다
  function sharedCard(it) {
    const open = { label: '열기', icon: 'eye', run: () => sharedOpen(it) };
    const toBox = { label: '문서함에 저장', icon: 'lock', run: async () => { const W = U().W; if ((W.doc && W.name === it.name && !W.boxId) || await sharedOpen(it)) U().save('boxNew'); } }; // 이미 열려 있으면 다시 받지 않음
    const down = { label: '내려받기', icon: 'download', run: async () => { const b = new Blob([await sharedBuf(it)]); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = it.name + '.hwpx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); } };
    return { id: 'sh-' + it.file, title: it.name, preview: it.preview, badge: it.ver || 'NEW', note: it.note,
      meta: [it.pages ? it.pages + '쪽' : '', it.size ? Math.max(1, Math.round(it.size / 1024)) + ' KB' : '', relTime(it.added)],
      click: open, actions: [open, toBox], menu: [open, toBox, down] };
  }
  function renderShared(match) {
    const S = $('secShared'); S.hidden = GUEST || !(filter === 'all' || filter === 'shared') || !shared.items.length; if (S.hidden) return 0;
    const list = sorted(shared.items.map(it => Object.assign({ time: Date.parse(it.added) || 0 }, it))).filter(it => match(it.name, it.note, it.preview));
    $('sharedCnt').textContent = list.length + '개 · 잠그지 않은 공개 파일';
    if (!list.length) { S.hidden = true; return 0; }
    const g = grid(); for (const it of list) g.appendChild(card(sharedCard(it))); $('sharedBody').replaceChildren(g);
    return list.length;
  }

  /* ---------- 그리기 ---------- */
  function render() {
    if (root.hidden) return;
    const q = kw.toLowerCase();
    const match = (...xs) => !q || xs.some(x => (x || '').toLowerCase().includes(q));
    const all = docs();
    $('cAll').textContent = all.length || ''; $('cBox').textContent = box.items.length || ''; $('cWeek').textContent = all.filter(inWeek).length || '';
    $('cDraft').textContent = drafts.length || ''; $('cBest').textContent = best.items.length || ''; $('cShared').textContent = shared.items.length || '';
    $('dDraft').hidden = !drafts.length; // 노란 점: 저장 안 한 작업본이 있을 때만
    $('hmTitle').textContent = q ? '검색 결과' : FILTERS[filter];
    let list = all.filter(x => match(x.name, x.preview));
    if (filter === 'box') list = list.filter(x => x.kind === 'box');
    if (filter === 'week') list = list.filter(inWeek);
    if (filter === 'draft') list = list.filter(x => x.draft);
    if (filter === 'best' || filter === 'shared' || GUEST) list = [];
    list = sorted(list);
    const hero = filter === 'all' && !q && pref.sort === 'recent' && list.length ? list[0] : null;
    renderHero(hero); banner(hero);
    const rest = hero ? list.slice(1) : list;
    notice(renderDocs(rest, hero, q));
    const nb = renderBest(match, q) + renderShared(match);
    const shown = list.length + nb;
    $('hmSub').textContent = (q || filter !== 'all') ? `${shown}개` : (all.length ? `문서 ${all.length}개` : '');
  }
  function setFilter(k) {
    filter = k;
    $('hmNav').querySelectorAll('[data-filter]').forEach(b => { const on = b.dataset.filter === k; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
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
    $('hmNav').onclick = e => { const b = e.target.closest('[data-filter]'); if (!b) return; setFilter(b.dataset.filter); render(); root.scrollTop = 0; };
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
