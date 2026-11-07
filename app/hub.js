/* 허브: 교안 목록 */
'use strict';
(async function () {
  await API.init();
  const $ = (id) => document.getElementById(id);
  const grid = $('grid'), empty = $('empty'), notice = $('notice'), q = $('q'), resume = $('resume'), gridHead = $('gridHead');
  let decks = [];
  const removed = new Map();   // 방금 지운(이름 바꾼) 교안: 목록이 잠깐 옛것을 돌려줘도 다시 보이지 않게
  const deckCache = new Map(); // 썸네일용 교안 내용 (목록을 다시 그릴 때 또 받지 않게)
  const bus = ('BroadcastChannel' in window) ? new BroadcastChannel('gyoan:hub') : null; // 열려 있는 편집기 창에 알림

  /* 이 기기에 기억해 두는 보기 설정 */
  const PREF = 'gyoan:hub';
  const pref = (() => { try { return Object.assign({ view: 'grid', sort: 'recent' }, JSON.parse(localStorage.getItem(PREF) || '{}')); } catch (e) { return { view: 'grid', sort: 'recent' }; } })();
  const savePref = () => { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) { } };
  let filter = 'all';
  const FILTER_NAMES = { all: '모든 교안', week: '최근 7일', draft: '저장 안 한 작업본' };

  if (API.mode === 'local') {
    notice.style.display = 'block';
    notice.innerHTML = '서버 없이 열렸습니다. 지금은 교안이 <b>브라우저 안에만</b> 저장됩니다. 폴더의 <b>start.cmd</b> 를 실행해 열면 decks/ 폴더에 파일로 저장되고 Git 으로 관리할 수 있습니다.';
  }
  const GUEST = Access.isGuest; // 보기 전용: 새 교안·가져오기·편집·⋯ 메뉴를 감추고 저장 API 는 access.js 가 막음
  $('roleChip').innerHTML = Access.chip();
  if (API.mode === 'github' && !GUEST) {
    $('btnGh').style.display = '';
    ghNotice();
  }
  if (GUEST) {
    notice.style.display = 'block'; notice.className = 'hub-notice guest';
    notice.innerHTML = `${icon('eye', 15)} <b>보기 전용(게스트)</b> 으로 들어왔습니다. 교안을 열어 발표할 수 있고, 고치거나 저장하는 일은 할 수 없습니다. <a href="index.html?mode=1">관리자로 입장</a>`;
  }

  /* ---------- 창: 글 입력 · 확인 (브라우저 기본 창 대신) ---------- */
  function dialog(build) {
    return new Promise((resolve) => {
      const bg = document.createElement('div'); bg.className = 'modal-bg';
      const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
      bg.appendChild(m);
      const prevFocus = document.activeElement;
      const close = (v) => { document.removeEventListener('keydown', onKey, true); bg.remove(); if (prevFocus && prevFocus.focus) prevFocus.focus(); resolve(v); };
      const onKey = (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); close(null); } };
      document.addEventListener('keydown', onKey, true);
      bg.addEventListener('pointerdown', (ev) => { if (ev.target === bg) close(null); });
      build(m, close);
      document.body.appendChild(bg);
      const first = m.querySelector('[autofocus]') || m.querySelector('input,button.primary,button.ink');
      if (first) { first.focus(); if (first.select) first.select(); }
    });
  }
  function askText(title, label, value, okLabel) {
    return dialog((m, close) => {
      m.classList.add('ask');
      m.innerHTML = `<h3>${esc(title)}</h3><p class="modal-desc">${esc(label)}</p><input type="text" value="${esc(value || '')}" autofocus aria-label="${esc(title)}"><div class="actions"><button class="btn" data-x>취소</button><button class="btn ink" data-ok>${esc(okLabel || '확인')}</button></div>`;
      const inp = m.querySelector('input');
      m.querySelector('[data-x]').onclick = () => close(null);
      m.querySelector('[data-ok]').onclick = () => close(inp.value.trim() || null);
      inp.onkeydown = (ev) => { if (ev.key === 'Enter' && !ev.isComposing) close(inp.value.trim() || null); };
    });
  }
  function askConfirm(title, desc, okLabel) {
    return dialog((m, close) => {
      m.classList.add('ask');
      m.innerHTML = `<h3>${esc(title)}</h3><p class="modal-desc">${esc(desc)}</p><div class="actions"><button class="btn" data-x>취소</button><button class="btn danger-solid" data-ok autofocus>${esc(okLabel)}</button></div>`;
      m.querySelector('[data-x]').onclick = () => close(false);
      m.querySelector('[data-ok]').onclick = () => close(true);
    });
  }
  function tell(title, desc) {
    return dialog((m, close) => {
      m.classList.add('ask');
      m.innerHTML = `<h3>${esc(title)}</h3><p class="modal-desc">${esc(desc)}</p><div class="actions"><button class="btn ink" data-ok autofocus>확인</button></div>`;
      m.querySelector('[data-ok]').onclick = () => close(true);
    });
  }

  /* ---------- GitHub 연결 (GitHub Pages 에서 열었을 때) ---------- */
  function ghNotice() {
    notice.style.display = 'block';
    const repo = `<b>${esc(GH.cfg.owner)}/${esc(GH.cfg.repo)}</b>`;
    if (GH.token) {
      notice.className = 'hub-notice ok';
      notice.innerHTML = `GitHub 저장소 ${repo} 에 바로 저장됩니다. 저장할 때마다 커밋이 하나씩 쌓이고, 내 PC 에서는 <code>git pull</code> 로 받으면 됩니다. <a href="#" id="ghOff">연결 해제</a>`;
      notice.querySelector('#ghOff').onclick = async (ev) => { ev.preventDefault(); if (await askConfirm('GitHub 연결을 해제할까요?', '이 브라우저에 저장된 GitHub 토큰을 지웁니다. 저장소의 교안은 그대로입니다.', '연결 해제')) { GH.clear(); location.reload(); } };
    } else {
      notice.className = 'hub-notice';
      notice.innerHTML = `지금은 <b>보기 · 발표만</b> 가능합니다 (GitHub 저장소 ${repo} 의 교안). 여기서 편집하고 저장하려면 <a href="#" id="ghOn">GitHub 연결</a> 로 토큰을 한 번만 등록하세요.`;
      notice.querySelector('#ghOn').onclick = (ev) => { ev.preventDefault(); ghDialog(); };
    }
  }
  async function ghDialog() { if (await GH.connect()) location.reload(); }
  /* 저장소에 쓰는 일: 연결이 없거나 토큰이 만료됐으면 경고 대신 그 자리에서 연결 창을 띄우고, 연결되면 이어서 함 */
  async function ghTry(fn) {
    try { return await fn(); }
    catch (e) {
      if (API.mode !== 'github' || !(e.noToken || e.status === 401)) throw e;
      const ok = await GH.connect({ expired: e.status === 401, reason: e.status === 401 ? '저장해 둔 토큰이 만료되었거나 올바르지 않습니다. 새 토큰을 넣으면 하던 일을 이어서 합니다.' : '이 기기(브라우저·앱)에는 아직 GitHub 연결이 없습니다. 지금 연결하면 하던 일을 이어서 합니다.' });
      if (ok !== true) { e.quiet = true; throw e; } // 연결 창에서 [나중에]: 실패 경고는 띄우지 않음
      ghNotice();
      return fn();
    }
  }
  function fail(what, e) { if (e.quiet) toast('GitHub 에 연결하면 저장소에 저장할 수 있습니다', 2600); else tell(what.replace(/[:\s]+$/, ''), e.message); }
  $('btnGh').onclick = ghDialog;

  let listOk = false, loadedOnce = false;
  /* 새로 만들기·가져오기·복제 전에: 최신 목록을 확인 (목록을 못 읽은 채 같은 이름으로 덮어쓰지 않게) */
  async function freshList() { await refresh(); if (!listOk) tell('목록을 확인할 수 없습니다', '교안 목록을 확인할 수 없어 진행하지 않았습니다. 인터넷 연결을 확인한 뒤 다시 해 주세요.'); return listOk; }
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); }); // 뒤로 가기로 돌아오면 목록을 새로
  async function refresh() {
    try { decks = await API.list(); listOk = true; } catch (e) { listOk = false; toast('목록을 불러오지 못했습니다' + (e && e.message ? ' — ' + e.message : '') + (decks.length ? ' (이전 목록을 보여 줍니다)' : ''), 4000); } // 실패해도 보이던 목록은 그대로
    decks = decks.filter(d => !(removed.has(d.name) && Date.now() - removed.get(d.name) < 120000));
    loadedOnce = true;
    render();
    /* 목록에 제목·날짜가 없는 저장소(GitHub): 내용을 다 읽은 뒤 한 번 더 정렬해 그림 */
    const partial = decks.filter(d => d.partial && !d._read);
    if (partial.length) Promise.all(partial.map(d => loadDeck(d).catch(() => null))).then(() => { if (!document.querySelector('.deck-card.busy')) render(); });
  }

  /* ---------- 때 ---------- */
  function timeOf(d) {
    if (d._t) return d._t;
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(d.modified || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : 0;
  }
  function relTime(t) {
    if (!t) return '';
    const now = new Date(), d = new Date(t), mins = Math.floor((now - d) / 60000);
    if (mins < 1) return '방금';
    if (mins < 60) return `${mins}분 전`;
    if (mins < 60 * 24 && d.getDate() === now.getDate()) return `${Math.floor(mins / 60)}시간 전`;
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (d >= y && d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return '어제';
    return d.getFullYear() === now.getFullYear() ? `${d.getMonth() + 1}월 ${d.getDate()}일` : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  }

  /* ---------- 교안 내용 (썸네일용) ---------- */
  function loadDeck(d) {
    const ck = d.name + '|' + (d.size || '') + '|' + (d.modified || '');
    if (!deckCache.has(ck)) deckCache.set(ck, API.load(d.name).catch(e => { deckCache.delete(ck); throw e; }));
    return deckCache.get(ck).then(deck => {
      if (d.partial && !d._read) { d._read = true; d.title = deck.title || d.name; d.slides = (deck.slides || []).length; const when = deck.modified || deck.created; d.modified = fmtWhen(when); d._t = Date.parse(when) || 0; }
      return deck;
    });
  }
  function drawSlide(box, slide, deck) {
    const s = renderSlide(slide, deck, { mode: 'thumb' });
    box.insertBefore(s, box.firstChild); box.classList.remove('loading');
    const fit = () => fitSlide(box, s);
    fit(); new ResizeObserver(fit).observe(box);
  }

  /* ---------- 그리기 ---------- */
  const inWeek = (d) => { const t = timeOf(d); return t && Date.now() - t < 7 * 864e5; };
  function sorted(list) {
    const by = { recent: (a, b) => timeOf(b) - timeOf(a), title: (a, b) => (a.title || a.name).localeCompare(b.title || b.name, 'ko'), slides: (a, b) => (+b.slides || 0) - (+a.slides || 0) };
    return list.slice().sort(by[pref.sort] || by.recent);
  }
  function render() {
    const kw = (q.value || '').trim().toLowerCase();
    let list = decks.filter(d => !kw || ((d.title || '') + ' ' + d.name).toLowerCase().includes(kw));
    if (filter === 'week') list = list.filter(inWeek);
    if (filter === 'draft') list = list.filter(d => Draft.has(d.name));
    list = sorted(list);

    $('cAll').textContent = decks.length || '';
    $('cWeek').textContent = decks.filter(inWeek).length || '';
    $('cDraft').textContent = decks.filter(d => Draft.has(d.name)).length || '';
    $('pageTitle').textContent = kw ? '검색 결과' : FILTER_NAMES[filter];
    $('sub').textContent = loadedOnce ? `${list.length}개` : '';

    /* 맨 위: 가장 최근에 저장한 교안 (전체 목록에서만) */
    const hero = filter === 'all' && !kw && pref.sort === 'recent' && list.length > 1 ? list[0] : null;
    resume.innerHTML = ''; resume.style.display = hero ? '' : 'none';
    if (hero) { renderResume(hero); list = list.slice(1); }
    gridHead.style.display = hero ? '' : 'none';
    gridHead.textContent = '다른 교안';

    grid.className = 'deck-grid' + (pref.view === 'list' ? ' list' : '');
    grid.innerHTML = '';
    for (const d of list) grid.appendChild(card(d));

    const none = loadedOnce && !list.length && !hero;
    empty.style.display = none ? '' : 'none';
    if (none) {
      empty.innerHTML = kw ? `<b>"${esc(kw)}" 이(가) 들어간 교안이 없습니다</b><span>검색 칸을 비우면 전체가 보입니다.</span>`
        : filter === 'draft' ? '<b>저장하지 않은 작업본이 없습니다</b><span>편집하다가 저장하지 않고 닫으면 여기에 모입니다.</span>'
          : filter === 'week' ? '<b>최근 7일 동안 저장한 교안이 없습니다</b>'
            : GUEST ? '<b>아직 교안이 없습니다</b><span>관리자가 교안을 만들면 여기에 보입니다.</span>'
              : `<b>첫 교안을 만들어 보세요</b><span>새 교안을 만들거나 PowerPoint 파일을 이 화면에 끌어다 놓으세요.</span><button class="btn ink" id="emptyNew">${icon('plus')}새 교안</button>`;
      const en = $('emptyNew'); if (en) en.onclick = () => $('btnNew').click();
    }
    /* 불러오기 전: 빈 카드 자리 */
    if (!loadedOnce) for (let i = 0; i < 6; i++) { const c = document.createElement('div'); c.className = 'deck-card ghost'; c.innerHTML = '<div class="deck-thumb loading"></div><div class="deck-body"><div class="line"></div><div class="line short"></div></div>'; grid.appendChild(c); }
  }

  function renderResume(d) {
    resume.innerHTML = `<div class="resume-main deck-thumb loading" tabindex="0" role="link" aria-label="${esc(d.title)} ${GUEST ? '발표' : '편집'}"></div>
      <div class="resume-side">
        <div class="eyebrow">${GUEST ? '최근 교안' : '이어서 작업'}</div>
        <h2 class="resume-title">${esc(d.title)}</h2>
        <div class="resume-meta"><span data-m></span></div>
        <div class="resume-film" data-film></div>
        <div class="resume-cta">
          ${GUEST ? `<button class="btn ink lg" data-go="present">${icon('play')}발표</button>` : `<button class="btn ink lg" data-go="edit">${icon('edit')}이어서 편집</button>
          <button class="btn lg" data-go="present">${icon('play')}발표</button>
          <span class="flex"></span>
          <button class="btn icon ghost" data-more title="더 보기" aria-label="${esc(d.title)} 더 보기">${icon('dots')}</button>`}
        </div>
      </div>`;
    const meta = () => { resume.querySelector('[data-m]').textContent = [d.slides !== '' ? `슬라이드 ${d.slides}장` : '', relTime(timeOf(d))].filter(Boolean).join(' · '); };
    meta();
    const main = resume.querySelector('.resume-main');
    main.onclick = () => openEditor(d.name);
    main.onkeydown = (ev) => { if (ev.key === 'Enter') openEditor(d.name); };
    if (!GUEST) resume.querySelector('[data-go=edit]').onclick = () => openEditor(d.name);
    resume.querySelector('[data-go=present]').onclick = () => openPresent(d.name);
    if (!GUEST) resume.querySelector('[data-more]').onclick = (ev) => actionMenu(ev.currentTarget, d, main);
    loadDeck(d).then(deck => {
      meta();
      resume.querySelector('.resume-title').textContent = d.title;
      if (!deck.slides || !deck.slides.length) return;
      drawSlide(main, deck.slides[0], deck);
      const film = resume.querySelector('[data-film]');
      deck.slides.slice(1, 5).forEach((s, i) => {
        const t = document.createElement('button'); t.className = 'film-t'; t.title = `${i + 2}번 슬라이드 편집`; t.setAttribute('aria-label', t.title);
        t.onclick = () => { if (GUEST) openPresent(d.name); else location.href = 'editor.html?deck=' + encodeURIComponent(d.name) + '&slide=' + (i + 1); };
        film.appendChild(t); drawSlide(t, s, deck);
      });
    }).catch(() => { main.classList.remove('loading'); });
  }

  function card(d) {
    const c = document.createElement('article'); c.className = 'deck-card';
    const th = document.createElement('div'); th.className = 'deck-thumb loading'; th.tabIndex = 0; th.setAttribute('role', 'link'); th.setAttribute('aria-label', d.title + (GUEST ? ' 발표' : ' 편집'));
    th.innerHTML = `<div class="deck-hover"><button class="btn ink" data-a="present">${icon('play', 16)}발표</button>${GUEST ? '' : `<button class="btn" data-a="edit">${icon('edit', 16)}편집</button>`}</div>`;
    th.onclick = (ev) => { if (!ev.target.closest('button')) openEditor(d.name); };
    th.onkeydown = (ev) => { if (ev.key === 'Enter' && ev.target === th) openEditor(d.name); };
    c.appendChild(th);
    const body = document.createElement('div'); body.className = 'deck-body';
    /* 카드 아래 줄: 슬라이드 수 · 저장한 때 · (목록 보기에서) 파일 이름 · 이 기기에 저장 안 한 작업본 */
    const meta = (state) => `<span>${state || (d.slides === '' ? '불러오는 중…' : `${d.slides}장`)}</span><span title="마지막으로 저장한 때: ${esc(d.modified || '')}">${esc(relTime(timeOf(d)))}</span><span class="deck-file">${esc(d.name)}.json</span>`
      + (!GUEST && Draft.has(d.name) ? '<span class="draft-chip" title="이 기기에 저장하지 않은 작업본이 남아 있습니다. [편집] 을 누르면 어느 쪽으로 열지 물어봅니다.">저장 안 한 작업본</span>' : '');
    body.innerHTML = `<div class="deck-text"><div class="deck-title" title="${esc(d.title)}">${esc(d.title)}</div><div class="deck-meta">${meta()}</div></div>
      <div class="deck-actions"><button class="btn sm" data-a="present">${icon('play', 14)}발표</button>${GUEST ? '' : `<button class="btn sm" data-a="edit">${icon('edit', 14)}편집</button>`}</div>
      ${GUEST ? '' : `<button class="btn icon ghost kebab" data-more title="더 보기" aria-label="${esc(d.title)} 더 보기">${icon('dots')}</button>`}`;
    loadDeck(d).then(deck => {
      if (d.partial) { body.querySelector('.deck-title').textContent = d.title; body.querySelector('.deck-meta').innerHTML = meta(); }
      if (!deck.slides || !deck.slides.length) { th.classList.remove('loading'); return; }
      drawSlide(th, deck.slides[0], deck);
    }).catch(() => { th.classList.remove('loading'); th.classList.add('broken'); if (d.partial) body.querySelector('.deck-meta').innerHTML = meta('내용을 읽지 못했습니다'); }); // 목록에는 있는데 열 수 없는 교안 (연결 끊김 · 파일 손상)
    c.addEventListener('click', (ev) => {
      const more = ev.target.closest('[data-more]'); if (more) { actionMenu(more, d, c); return; }
      const btn = ev.target.closest('button[data-a]'); if (!btn || c.classList.contains('busy')) return;
      if (btn.dataset.a === 'present') openPresent(d.name);
      if (btn.dataset.a === 'edit') openEditor(d.name);
    });
    c.appendChild(body);
    return c;
  }

  /* ---------- ⋯ 메뉴: 복제 · 이름 바꾸기 · 삭제 ---------- */
  let openMenu = null;
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  document.addEventListener('pointerdown', (ev) => { if (openMenu && !openMenu.contains(ev.target)) closeMenu(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', closeMenu);
  function actionMenu(btn, d, host) {
    const same = openMenu && openMenu._btn === btn; closeMenu(); if (same) return;
    const m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu'); m._btn = btn;
    const items = [['dup', 'copy', '복제'], ['rename', 'edit', '파일 이름 바꾸기'], null, ['del', 'trash', '삭제']];
    for (const it of items) {
      if (!it) { m.appendChild(document.createElement('hr')); continue; }
      const b = document.createElement('div'); b.className = 'mi' + (it[0] === 'del' ? ' danger' : ''); b.setAttribute('role', 'menuitem'); b.tabIndex = 0;
      b.innerHTML = `${icon(it[1], 16)}<span>${it[2]}</span>`;
      const go = () => { closeMenu(); act(it[0], d, host); };
      b.onclick = go; b.onkeydown = (ev) => { if (ev.key === 'Enter') go(); };
      m.appendChild(b);
    }
    document.body.appendChild(m); openMenu = m;
    const r = btn.getBoundingClientRect();
    m.style.position = 'fixed';
    m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top = (r.bottom + 6 + m.offsetHeight > innerHeight - 8 ? r.top - 6 - m.offsetHeight : r.bottom + 6) + 'px';
  }
  async function act(a, d, host) {
    /* 일하는 동안: 카드를 흐리게 (GitHub 은 몇 초 걸림 · 두 번 누름 방지) */
    const busy = () => { host.classList.add('busy'); return () => host.classList.remove('busy'); };
    if (a === 'del') {
      const how = API.mode === 'server' ? 'decks/.trash 폴더로 옮깁니다.' : API.mode === 'github' ? '저장소에서 지웁니다. Git 기록에는 남습니다.' : '이 브라우저에서 지웁니다.';
      if (!(await askConfirm(`"${d.title}" 교안을 삭제할까요?`, how, '삭제'))) return;
      const done = busy();
      if (API.mode === 'github') toast('저장소에서 지우는 중… (몇 초 걸립니다)', 4000);
      try { await ghTry(() => API.remove(d.name)); }
      catch (e) { done(); fail('삭제 실패: ', e); return; }
      Draft.forget(d.name); // 이 기기에 남은 작업본도 치움 (같은 이름으로 새로 만든 교안에 옛 작업본이 뜨지 않게)
      removed.set(d.name, Date.now()); decks = decks.filter(x => x.name !== d.name); render(); // 목록을 다시 받기 전에 바로 지움
      toast(API.mode === 'server' ? '삭제했습니다 (decks/.trash 폴더에 보관)' : '삭제했습니다', 3000);
      if (bus) bus.postMessage({ type: 'deleted', name: d.name });
      refresh();
    }
    if (a === 'dup') {
      const done = busy();
      if (!(await freshList())) { done(); return; } // 최신 목록에서 겹치지 않는 이름을 고름
      try {
        const deck = clone(await API.load(d.name)); const name = uniqueName(d.name + ' 사본');
        deck.title = (deck.title || d.name) + ' 사본'; removed.delete(name); Draft.forget(name);
        await ghTry(() => API.save(name, deck)); toast('복제했습니다');
      } catch (e) { done(); fail('복제 실패: ', e); return; }
      refresh();
    }
    if (a === 'rename') {
      const nn = await askText('파일 이름 바꾸기', '교안 파일의 이름입니다. 화면에 보이는 교안 제목은 편집기 맨 위에서 바꿉니다.', d.name, '바꾸기'); if (!nn || nn === d.name) return;
      const safe = sanitize(nn); if (!safe) return;
      const done = busy();
      if (!(await freshList())) { done(); return; } // 최신 목록으로 확인 (다른 기기에서 만든 같은 이름의 교안을 덮어쓰지 않게)
      if (decks.some(x => x.name === safe)) { done(); tell('같은 이름의 교안이 있습니다', '다른 이름을 골라 주세요.'); return; }
      if (!decks.some(x => x.name === d.name)) { done(); tell('교안을 찾을 수 없습니다', '이 교안은 이미 지워졌거나 이름이 바뀌었습니다. 목록을 새로 고쳤습니다.'); return; }
      try { removed.delete(safe); await ghTry(() => API.rename(d.name, safe)); toast('이름을 바꿨습니다'); }
      catch (e) { done(); fail('이름 바꾸기 실패: ', e); return; }
      Draft.forget(safe); Draft.move(d.name, safe); // 이 기기에 남은 작업본도 새 이름으로
      removed.set(d.name, Date.now());
      if (bus) bus.postMessage({ type: 'renamed', name: d.name, to: safe });
      refresh();
    }
  }

  function openPresent(name) { window.open('present.html?deck=' + encodeURIComponent(name), '_blank'); }
  function openEditor(name) { if (GUEST) { openPresent(name); return; } location.href = 'editor.html?deck=' + encodeURIComponent(name); }
  function sanitize(n) { return n.replace(/[\\/:*?"<>|]/g, '_').trim(); }
  function uniqueName(base) { let n = sanitize(base), i = 2; while (decks.some(d => d.name === n)) n = sanitize(base) + ' ' + (i++); return n; }

  /* 단추: 일하는 동안 "…중"으로 바꾸고 잠금 (아이콘은 그대로) */
  function hold(id, label) {
    const b = $(id); const sp = b.querySelector('span') || b; const old = sp.textContent; const html = sp === b ? b.innerHTML : null;
    b.disabled = true; sp.textContent = label;
    return () => { b.disabled = false; if (html !== null) b.innerHTML = html; else sp.textContent = old; };
  }

  /* ---------- 새 교안: 제목과 테마를 한 창에서 ---------- */
  function newDeckDialog() {
    return dialog((m, close) => {
      m.classList.add('new-deck');
      m.innerHTML = `<h3>새 교안</h3>
        <label class="field"><span>제목</span><input type="text" id="ndTitle" value="새 교안" autofocus></label>
        <div class="field"><span>테마</span><div class="nd-grid" id="ndGrid" role="radiogroup" aria-label="테마"></div></div>
        <div class="actions"><span class="modal-desc" style="margin:0 auto 0 0">테마는 나중에 언제든 바꿀 수 있습니다.</span><button class="btn" data-x>취소</button><button class="btn ink" data-ok>만들기</button></div>`;
      let pick = 'clean';
      const g = m.querySelector('#ndGrid'), inp = m.querySelector('#ndTitle');
      const done = () => { const t = inp.value.trim(); if (!t) { inp.focus(); return; } close({ title: t, theme: pick }); };
      for (const t of THEMES) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'nd-theme' + (t.id === pick ? ' on' : ''); b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', t.id === pick);
        b.innerHTML = `<span class="pv"></span><span class="nm">${esc(t.name)}</span>`;
        b.onclick = () => { pick = t.id; g.querySelectorAll('.nd-theme').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); }); };
        b.ondblclick = done;
        g.appendChild(b);
        const preview = { title: inp.value, theme: t.id, slides: [] };
        const pv = b.querySelector('.pv'), sl = renderSlide(newSlide('title', { title: '교안 제목', subtitle: '부제목 · 강의자 이름' }), preview, { mode: 'thumb' });
        pv.appendChild(sl); requestAnimationFrame(() => fitSlide(pv, sl));
      }
      m.querySelector('[data-x]').onclick = () => close(null);
      m.querySelector('[data-ok]').onclick = done;
      inp.onkeydown = (ev) => { if (ev.key === 'Enter' && !ev.isComposing) done(); };
    });
  }
  $('btnNew').onclick = async () => {
    const r = await newDeckDialog(); if (!r) return;
    const done = hold('btnNew', '만드는 중…');
    if (!(await freshList())) { done(); return; }
    const name = uniqueName(r.title); if (!name) { done(); tell('제목을 바꿔 주세요', '제목에 쓸 수 있는 글자가 없습니다.'); return; }
    removed.delete(name); Draft.forget(name);
    const deck = newDeck(r.title); deck.theme = r.theme;
    try { await ghTry(() => API.save(name, deck)); } catch (e) { done(); fail('만들기 실패: ', e); return; }
    location.href = 'editor.html?deck=' + encodeURIComponent(name);
  };

  /* ---------- 사용 안내 ---------- */
  $('btnGuide').onclick = () => dialog((m, close) => {
    m.classList.add('guide-modal');
    m.innerHTML = `<h3>사용 안내</h3><div class="guide-cols">
      <section><h4>발표 조작 <small>프레젠터 리모컨 동일</small></h4>
        <p><kbd>→</kbd> <kbd>PgDn</kbd> <kbd>Space</kbd> <kbd>Enter</kbd> 다음</p><p><kbd>←</kbd> <kbd>PgUp</kbd> <kbd>Backspace</kbd> 이전</p>
        <p><kbd>F5</kbd> <kbd>F</kbd> 전체화면 · <kbd>B</kbd> 검은 화면</p><p><kbd>S</kbd> 발표자 노트 창 (듀얼 모니터)</p><p><kbd>Esc</kbd> 종료 · <kbd>F1</kbd> 도움말</p></section>
      <section><h4>파일</h4><p><b>decks/</b> 교안 1개 = JSON 파일 1개</p><p><b>assets/</b> 이미지 파일 · 모두 Git 으로 관리됩니다.</p>
        <p>GitHub Pages 주소로 열면 어디서나 발표할 수 있고, 토큰을 연결하면 편집·저장도 됩니다.</p></section>
      <section><h4>편리한 기능</h4><p>편집기에서 이미지를 붙여넣기(<kbd>Ctrl+V</kbd>)하거나 끌어다 놓으면 바로 들어갑니다.</p>
        <p>PowerPoint 파일(.pptx)을 이 화면에 끌어다 놓으면 교안으로 바뀝니다. 앱으로 설치했으면 탐색기에서 [연결 프로그램 → 업무 공간] 으로 열 수도 있습니다.</p></section>
    </div><div class="actions"><a class="btn" href="shortcuts.html">단축키 설명서</a><button class="btn ink" data-ok autofocus>닫기</button></div>`;
    m.querySelector('[data-ok]').onclick = () => close(true);
  });

  /* ---------- 가져오기 ---------- */
  $('btnImport').onclick = () => $('fileImport').click();
  $('fileImport').onchange = async (ev) => { const f = ev.target.files[0]; ev.target.value = ''; if (f) await importFile(f); };
  const isPpt = (f) => !!f && /\.(pptx|ppsx|pptm|ppsm|potx|ppt|pps|pot)$/i.test(f.name || '');
  async function importFile(f) {
    if (GUEST) { toast('게스트 모드에서는 가져올 수 없습니다 — 첫 화면에서 관리자로 입장하세요', 3200); return; }
    if (isPpt(f)) return importPpt(f);
    const done = hold('btnImport', '가져오는 중…');
    try {
      const deck = JSON.parse(await f.text());
      if (!deck || !Array.isArray(deck.slides)) throw new Error('교안 형식이 아닙니다');
      normalizeDeck(deck);
      if (!(await freshList())) { done(); return; }
      const name = uniqueName(f.name.replace(/\.json$/i, '') || '가져온 교안'); removed.delete(name); Draft.forget(name);
      await ghTry(() => API.save(name, deck)); toast('가져왔습니다'); refresh();
    } catch (e) { fail('가져오기 실패: ', e); }
    done();
  }
  /* ---------- PowerPoint 파일 → 교안 (app/pptin.js) ----------
     [가져오기] 로 고르거나, 이 화면에 끌어다 놓거나, 설치한 앱에서 탐색기의 .pptx 를 열면 여기로 옴.
     바꾼 교안은 저장소에 저장한 뒤 편집기로 열림 (거기서 바로 [발표]) */
  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[data-lazy="${src}"]`)) { res(); return; }
      const sc = document.createElement('script'); sc.src = src; sc.dataset.lazy = src;
      sc.onload = () => res(); sc.onerror = () => { sc.remove(); rej(new Error('프로그램 파일을 불러오지 못했습니다 (' + src + ') — 인터넷 연결을 확인해 주세요')); };
      document.head.appendChild(sc);
    });
  }
  let importing = false;
  async function importPpt(f) {
    if (importing) { toast('다른 파일을 가져오는 중입니다 — 끝난 뒤 다시 해 주세요'); return; }
    if (/\.(ppt|pps|pot)$/i.test(f.name || '')) { tell('옛 형식 파일입니다', `"${f.name}" 은 옛 형식(.ppt) 파일이라 읽지 못합니다. PowerPoint 에서 [파일 → 다른 이름으로 저장] 으로 "PowerPoint 프레젠테이션(.pptx)" 으로 저장한 뒤 다시 열어 주세요.`); return; }
    importing = true; const done = hold('btnImport', '변환 중…');
    try {
      toast('PPT 파일을 읽는 중…', 60000);
      await loadScript('app/pptsym.js'); await loadScript('app/pptin.js');
      if (!(await freshList())) return;
      const canVideo = API.mode === 'server' || (API.mode === 'github' && !!GH.token);
      const r = await PPTIN.toDeck(f, {
        stage: (blob, name) => API.stage(blob, name),
        progress: (m) => toast(m, 60000),
        video: canVideo ? async (file, name, poster) => { if (file.size > BIGV.MAX) throw new Error('1GB 가 넘는 동영상'); const src = API.mode === 'github' && file.size > BIGV.LIMIT ? API.stageBig(file, name) : await API.stage(file, name); return { src, poster }; } : null,
      });
      const name = uniqueName(r.deck.title || f.name.replace(/\.[^.]+$/, '') || '가져온 교안'); removed.delete(name); Draft.forget(name);
      toast('교안을 저장하는 중…', 60000);
      await ghTry(() => API.save(name, r.deck));
      const s = r.stats, parts = [`슬라이드 ${s.slides}장`, s.text ? `글 상자 ${s.text}` : '', s.image ? `그림 ${s.image}` : '', s.shape + s.drawn ? `도형 ${s.shape + s.drawn}` : '', s.table ? `표 ${s.table}` : '', s.chart ? `차트 ${s.chart}` : '', s.video ? `동영상 ${s.video}` : ''].filter(Boolean).join(' · ');
      try { sessionStorage.setItem('gyoan:imported', JSON.stringify({ name, summary: parts, warnings: r.warnings })); } catch (e) { }
      toast('교안으로 바꿨습니다 — ' + parts, 4000);
      location.href = 'editor.html?deck=' + encodeURIComponent(name);
    } catch (e) { toast('PPT 를 가져오지 못했습니다'); if (!e.quiet) tell('PPT 를 교안으로 바꾸지 못했습니다', e.message); else fail('', e); }
    finally { importing = false; done(); }
  }
  // 이 화면에 파일 끌어다 놓기 (.pptx → 교안, .json → 교안 파일 가져오기)
  const dropOk = (dt) => dt && Array.from(dt.types || []).includes('Files');
  document.addEventListener('dragover', (ev) => { if (GUEST) return; if (dropOk(ev.dataTransfer)) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; document.body.classList.add('dragover'); } });
  document.addEventListener('dragleave', (ev) => { if (!ev.relatedTarget) document.body.classList.remove('dragover'); });
  document.addEventListener('drop', async (ev) => {
    document.body.classList.remove('dragover'); if (!dropOk(ev.dataTransfer)) return; ev.preventDefault();
    const files = Array.from(ev.dataTransfer.files); const f = files.find(isPpt) || files.find(x => /\.json$/i.test(x.name || ''));
    if (!f) { toast('PowerPoint 파일(.pptx)이나 교안 파일(.json)을 놓아 주세요', 4000); return; }
    await importFile(f);
  });
  // 앱으로 설치한 뒤 탐색기에서 .pptx 를 [연결 프로그램 → 업무 공간] 으로 열면 여기로 파일이 넘어옴
  if ('launchQueue' in window) window.launchQueue.setConsumer(async (p) => {
    if (!p.files || !p.files.length) return;
    try { await importFile(await p.files[0].getFile()); } catch (e) { tell('파일을 열 수 없습니다', e.message); }
  });

  /* ---------- 위쪽 도구 ---------- */
  q.oninput = render;
  document.addEventListener('keydown', (ev) => {
    if (ev.key === '/' && !ev.ctrlKey && !ev.metaKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.querySelector('.modal-bg')) { ev.preventDefault(); q.focus(); }
    if (ev.key === 'Escape' && document.activeElement === q) { q.value = ''; q.blur(); render(); }
  });
  const sortSel = $('sort'); sortSel.value = pref.sort; sortSel.onchange = () => { pref.sort = sortSel.value; savePref(); render(); };
  const paintView = () => document.querySelectorAll('.seg-b').forEach(b => { const on = b.dataset.view === pref.view; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  document.querySelectorAll('.seg-b').forEach(b => b.onclick = () => { pref.view = b.dataset.view; savePref(); paintView(); render(); });
  paintView();
  $('nav').querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {
    filter = b.dataset.filter;
    $('nav').querySelectorAll('[data-filter]').forEach(x => { x.classList.toggle('on', x === b); if (x === b) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
    render();
  });

  render(); // 불러오기 전 빈 카드 자리
  refresh();
})();
