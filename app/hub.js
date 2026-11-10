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

  /* ---------- 폴더: 교안 파일은 그대로 두고, "교안 이름 → 폴더" 를 따로 저장 ----------
     저장 자리: GitHub 저장소(사이트)에서는 저장소 맨 위의 gyoan-folders.json (PC · 휴대폰이 같은 폴더를 봄),
     내 PC 서버(start.cmd)는 같은 파일(api/folders), 서버 없이 연 화면은 이 브라우저(localStorage).
     바꾸면 화면에는 바로 보이고, 0.6초 동안 모은 변경을 저장소의 최신 내용 위에 다시 얹어 한 번에 저장함
     (다른 기기에서 그 사이에 바꾼 폴더를 덮어쓰지 않게) */
  const Folders = {
    FILE: 'gyoan-folders.json', CACHE: 'gyoan:folders', LOCAL: 'gyoan:folders:local',
    st: { folders: [], decks: {} }, pend: [], timer: 0, chain: Promise.resolve(),
    clean(x) {
      const o = { folders: [], decks: {} };
      if (x && Array.isArray(x.folders)) for (const f of x.folders) if (f && f.id && typeof f.name === 'string' && !o.folders.some(g => g.id === String(f.id))) o.folders.push({ id: String(f.id), name: f.name });
      if (x && x.decks && typeof x.decks === 'object') for (const k in x.decks) if (o.folders.some(f => f.id === x.decks[k])) o.decks[k] = x.decks[k];
      return o;
    },
    of(name) { return this.st.decks[name] || null; },
    get(id) { return this.st.folders.find(f => f.id === id) || null; },
    list() { return this.st.folders.slice().sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true })); },
    apply(st, op) {
      if (op.t === 'create') { if (!st.folders.some(f => f.id === op.id)) st.folders.push({ id: op.id, name: op.name }); }
      else if (op.t === 'rename') { const f = st.folders.find(x => x.id === op.id); if (f) f.name = op.name; }
      else if (op.t === 'delete') { st.folders = st.folders.filter(f => f.id !== op.id); for (const k in st.decks) if (st.decks[k] === op.id) delete st.decks[k]; }
      else if (op.t === 'move') { if (op.to && st.folders.some(f => f.id === op.to)) st.decks[op.deck] = op.to; else delete st.decks[op.deck]; }
      else if (op.t === 'forget') delete st.decks[op.deck];
      else if (op.t === 'renameDeck') { if (st.decks[op.from]) { st.decks[op.to] = st.decks[op.from]; delete st.decks[op.from]; } }
    },
    cacheLoad() { try { const c = JSON.parse(localStorage.getItem(this.CACHE) || 'null'); if (c) this.st = this.clean(c); } catch (e) { } },
    cacheSave() { try { localStorage.setItem(this.CACHE, JSON.stringify(this.st)); } catch (e) { } },
    /* 저장된 폴더 정보 (없으면 빈 것) */
    async read() {
      if (API.mode === 'server') {
        const r = await fetch('api/folders', { cache: 'no-store' });
        if (r.status === 404) return this.clean(null);
        if (!r.ok) throw new Error('내 PC 서버에서 폴더 정보를 읽지 못했습니다 (' + r.status + ')');
        return this.clean(await r.json());
      }
      if (API.mode === 'github') {
        let text = null;
        if (!GH.token && GH.onPages) { // 토큰 없이 보는 기기: 사이트에 올라간 파일 (요청 한도 없음)
          const r = await fetch(this.FILE, { cache: 'no-store' }).catch(() => null);
          if (r && r.status === 404) return this.clean(null);
          if (r && r.ok) text = await r.text();
        }
        if (text == null) text = await GH.raw(this.FILE);
        if (text == null) return this.clean(null);
        let j = null; try { j = JSON.parse(text); } catch (e) { }
        return this.clean(j);
      }
      try { return this.clean(JSON.parse(localStorage.getItem(this.LOCAL) || 'null')); } catch (e) { return this.clean(null); }
    },
    async write(st, what) {
      const body = JSON.stringify({ about: '교안 목록의 폴더 — 교안 파일 이름 → 폴더. 교안 파일과 따로 저장합니다.', folders: st.folders, decks: st.decks, modified: new Date().toISOString() }, null, 1);
      if (API.mode === 'server') {
        const r = await fetch('api/folders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
        if (!r.ok) throw new Error('내 PC 서버가 폴더 정보를 저장하지 못했습니다 (' + r.status + ')');
        return;
      }
      if (API.mode === 'github') {
        if (!GH.token) { const e = new Error('이 기기에는 아직 GitHub 연결이 없습니다'); e.noToken = true; throw e; }
        await GH.enqueue({ path: this.FILE, content: body }, { now: true, message: '교안 폴더 정리: ' + what });
        return;
      }
      localStorage.setItem(this.LOCAL, body);
    },
    /* 저장된 것을 다시 읽어 화면에 (아직 저장하지 않은 변경은 그 위에 다시 얹음) */
    ready: false, // 저장된 폴더 정보를 한 번이라도 읽어 봤는지
    async load() {
      try {
        const s = await this.read();
        this.pend.forEach(x => this.apply(s, x.op)); this.st = s; this.cacheSave();
        return true;
      } catch (e) { return false; }
      finally { this.ready = true; }
    },
    /* pend: 아직 저장소에 들어가지 않은 변경 (저장하는 중인 것 포함). 이 기기에도 적어 두어,
       저장 도중에 화면을 떠나도(편집기로 가기 · 창 닫기) 다음에 목록을 열 때 이어서 저장함 */
    PEND: 'gyoan:folders:pend',
    pendSave() { try { if (this.pend.length) localStorage.setItem(this.PEND, JSON.stringify(this.pend)); else localStorage.removeItem(this.PEND); } catch (e) { } },
    pendLoad() { try { const a = JSON.parse(localStorage.getItem(this.PEND) || '[]'); if (Array.isArray(a)) this.pend = a.filter(x => x && x.op && x.op.t); } catch (e) { } },
    do(op, what) {
      if (GUEST) return;
      this.apply(this.st, op); this.pend.push({ op, what }); this.pendSave(); this.cacheSave(); render();
      clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 600);
    },
    flush() {
      clearTimeout(this.timer);
      this.busy++;
      this.chain = this.chain.then(async () => {
        const items = this.pend.slice(); if (!items.length) return;
        let base = null;
        try {
          const fresh = await this.read();
          const next = this.clean(fresh); items.forEach(x => this.apply(next, x.op));
          await ghTry(() => this.write(next, items.map(x => x.what).filter((w, i, a) => a.indexOf(w) === i).join(', ')));
          base = next;
        } catch (e) {
          fail('폴더 정리를 저장하지 못했습니다', e);
          try { base = await this.read(); } catch (e2) { } // 저장된 상태로 되돌림
        }
        this.pend = this.pend.slice(items.length); this.pendSave(); // 저장했거나 포기한 변경은 빼고, 그 사이 새로 한 변경은 남김
        if (base) { this.pend.forEach(x => this.apply(base, x.op)); this.st = base; this.cacheSave(); render(); }
      }).catch(() => { }).finally(() => { this.busy--; });
      return this.chain;
    },
    busy: 0, // 저장하는 중 (그동안은 다시 읽어 오지 않음)
  };
  Folders.cacheLoad(); Folders.pendLoad();
  const newFolderId = () => 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  /* 지금 보고 있는 폴더 (주소의 #f=… — 새로 고침 · 뒤로 가기에도 그대로) */
  const folderOfHash = () => { const m = /^#f=(.+)$/.exec(location.hash || ''); return m ? decodeURIComponent(m[1]) : null; };
  function viewFolder() { return filter.startsWith('f:') ? Folders.get(filter.slice(2)) : null; }

  if (API.mode === 'local') {
    notice.style.display = 'block';
    notice.innerHTML = '서버 없이 열렸습니다. 지금은 교안이 <b>브라우저 안에만</b> 저장됩니다. 폴더의 <b>start.cmd</b> 를 실행해 열면 decks/ 폴더에 파일로 저장되고 Git 으로 관리할 수 있습니다.';
  }
  const GUEST = Access.isGuest; // 보기 전용: 새 교안·가져오기·편집·⋯ 메뉴를 감추고 저장 API 는 access.js 가 막음
  $('roleChip').innerHTML = Access.chip();
  if (API.mode === 'github' && !GUEST) {
    $('btnGh').style.display = '';
    ghButton();
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
  function ghButton() { // 왼쪽 메뉴의 단추: 연결돼 있으면 '연결됨' 표시
    const b = $('btnGh'); if (!b) return;
    if (GH.token) { b.innerHTML = '<i data-ic="link"></i><span>GitHub</span><em>연결됨</em>'; b.title = `GitHub 저장소 ${GH.cfg.owner}/${GH.cfg.repo} 에 연결되어 있습니다 — 누르면 상태 확인 · 토큰 바꾸기`; }
    else { b.innerHTML = '<i data-ic="link"></i><span>GitHub 연결</span>'; b.title = 'GitHub 저장소에 바로 저장하도록 토큰 연결'; }
    fillIcons(b);
  }
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
  /* GitHub 저장소의 목록에는 파일 이름만 있고 제목·저장 시각이 없음. 그대로 그리면 이름순으로 먼저 보였다가
     내용을 다 읽은 뒤 최근 저장순으로 다시 바뀌어, 새로 고칠 때마다 엉뚱한 교안이 맨 위에 잠깐 보였음.
     → 교안마다 제목·슬라이드 수·저장 시각을 이 기기에 기억해 두고(파일 내용의 sha 가 같을 때만 씀),
       처음 보거나 바뀐 교안은 내용을 읽은 뒤에 한 번에 그림 (그동안은 빈 카드 자리) */
  const META = 'gyoan:hub:meta';
  const deckMeta = (() => { try { const m = JSON.parse(localStorage.getItem(META) || '{}'); return m && typeof m === 'object' ? m : {}; } catch (e) { return {}; } })();
  let metaTimer = 0;
  const saveMeta = () => { clearTimeout(metaTimer); metaTimer = setTimeout(() => { try { localStorage.setItem(META, JSON.stringify(deckMeta)); } catch (e) { } }, 300); };
  function fillMeta(d, title, slides, when) { d._read = true; d.title = title || d.name; d.slides = slides; d.modified = fmtWhen(when); d._t = Date.parse(when) || 0; d._when = when || ''; }
  let foldersFirst = null; // 폴더 정보를 처음 읽는 중 (첫 그림을 폴더까지 맞춘 뒤에 그리려고)
  const within = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);
  async function refresh() {
    try { decks = await API.list(); listOk = true; } catch (e) { listOk = false; toast('목록을 불러오지 못했습니다' + (e && e.message ? ' — ' + e.message : '') + (decks.length ? ' (이전 목록을 보여 줍니다)' : ''), 4000); } // 실패해도 보이던 목록은 그대로
    decks = decks.filter(d => !(removed.has(d.name) && Date.now() - removed.get(d.name) < 120000));
    for (const d of decks) if (d.partial && !d._read) { const m = deckMeta[d.name]; if (m && d.sha && m.sha === d.sha) fillMeta(d, m.title, m.slides, m.when); }
    if (listOk) { let gone = false; for (const k in deckMeta) if (!decks.some(d => d.name === k)) { delete deckMeta[k]; gone = true; } if (gone) saveMeta(); }
    const unknown = decks.filter(d => d.partial && !d._read);
    if (unknown.length) await within(Promise.all(unknown.map(d => loadDeck(d).catch(() => null))), 8000); // 오래 걸리면(느린 연결) 8초 뒤에는 아는 만큼 그림
    if (!loadedOnce && foldersFirst) await within(foldersFirst, 3000);
    loadedOnce = true;
    render();
    const still = decks.filter(d => d.partial && !d._read);
    if (still.length) Promise.all(still.map(d => loadDeck(d).catch(() => null))).then(() => { if (!document.querySelector('.deck-card.busy')) render(); });
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
    const ck = d.name + '|' + (d.size || '') + '|' + (d.sha || d.modified || ''); // GitHub: sha 로 (제목·시각을 채운 뒤에도 같은 열쇠 → 두 번 받지 않음)
    if (!deckCache.has(ck)) deckCache.set(ck, API.load(d.name).catch(e => { deckCache.delete(ck); throw e; }));
    return deckCache.get(ck).then(deck => {
      if (d.partial) {
        const title = deck.title || d.name, slides = (deck.slides || []).length, when = deck.modified || deck.created || '';
        const was = d._read ? [d.title, d.slides, d._when] : null;
        fillMeta(d, title, slides, when);
        if (d.sha) { deckMeta[d.name] = { sha: d.sha, title, slides, when }; saveMeta(); }
        // 기억해 둔 것과 실제 내용이 다르면(사이트 반영이 늦던 때 기억한 것 등) 고쳐서 다시 그림
        if (was && (was[0] !== title || was[1] !== slides || was[2] !== when) && loadedOnce) { clearTimeout(loadDeck._t); loadDeck._t = setTimeout(() => { if (!document.querySelector('.deck-card.busy')) render(); }, 200); }
      }
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
    if (filter.startsWith('f:') && !viewFolder() && Folders.ready) { filter = 'all'; if (folderOfHash()) history.replaceState(null, '', location.pathname + location.search); } // 지워졌거나 없는 폴더
    const kw = (q.value || '').trim().toLowerCase();
    const vf = viewFolder();
    const grouped = filter === 'all' && !kw; // 모든 교안: 폴더 밖 교안 → 폴더
    let all = (loadedOnce ? decks : []).filter(d => !kw || ((d.title || '') + ' ' + d.name).toLowerCase().includes(kw));
    if (filter === 'week') all = all.filter(inWeek);
    if (filter === 'draft') all = all.filter(d => Draft.has(d.name));
    all = sorted(all);
    let list = vf && !kw ? all.filter(d => Folders.of(d.name) === vf.id) : grouped ? all.filter(d => !Folders.of(d.name)) : all;

    $('cAll').textContent = decks.length || '';
    $('cWeek').textContent = decks.filter(inWeek).length || '';
    $('cDraft').textContent = decks.filter(d => Draft.has(d.name)).length || '';
    $('pageTitle').textContent = kw ? '검색 결과' : vf ? vf.name : (FILTER_NAMES[filter] || FILTER_NAMES.all);
    $('sub').textContent = loadedOnce ? `${list.length}개` : '';
    $('nav').querySelectorAll('[data-filter]').forEach(x => { const on = x.dataset.filter === filter; x.classList.toggle('on', on); if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
    renderFolderBar(vf && !kw ? vf : null, list.length);
    renderRailFolders(vf);

    /* 맨 위: 가장 최근에 저장한 교안 (전체 목록에서만) */
    const hero = grouped && pref.sort === 'recent' && all.length > 1 ? all[0] : null;
    resume.innerHTML = ''; resume.style.display = hero ? '' : 'none';
    if (hero) { renderResume(hero); list = list.filter(d => d !== hero); }
    const folders = grouped ? Folders.list() : [];
    gridHead.style.display = grouped && (hero || folders.length) && list.length ? '' : 'none';
    gridHead.textContent = hero ? '다른 교안' : '교안';

    grid.className = 'deck-grid' + (pref.view === 'list' ? ' list' : '');
    grid.innerHTML = '';
    for (const d of list) grid.appendChild(card(d, vf));

    /* 폴더: 폴더 밖 교안 다음에 */
    const fsec = $('folderSec'), fgrid = $('folderGrid');
    fsec.style.display = grouped && loadedOnce && (folders.length || !GUEST) ? '' : 'none';
    fgrid.innerHTML = '';
    if (grouped) {
      $('folderCount').textContent = folders.length ? `${folders.length}개` : '';
      for (const f of folders) fgrid.appendChild(folderCard(f));
      if (!GUEST) { const b = document.createElement('button'); b.className = 'folder-new'; b.type = 'button'; b.innerHTML = `${icon('folderPlus', 22)}<span>새 폴더</span><small>교안을 끌어다 넣어 정리합니다</small>`; b.onclick = newFolder; fgrid.appendChild(b); }
    }

    const none = loadedOnce && !list.length && !hero && !(grouped && folders.length);
    empty.style.display = none ? '' : 'none';
    if (none) {
      empty.innerHTML = kw ? `<b>"${esc(kw)}" 이(가) 들어간 교안이 없습니다</b><span>검색 칸을 비우면 전체가 보입니다.</span>`
        : vf ? `<b>이 폴더는 비어 있습니다</b><span>${GUEST ? '관리자가 교안을 넣으면 여기에 보입니다.' : '목록의 교안을 이 폴더로 끌어다 놓거나, 교안의 ⋯ 메뉴(휴대폰은 길게 누르기)에서 [폴더로 옮기기] 를 고르세요.'}</span>`
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
        <div class="resume-meta"><span data-m></span>${!GUEST && Draft.has(d.name) ? ' <span class="draft-chip" title="이 기기에 저장하지 않은 작업본이 남아 있습니다. [이어서 편집] 을 누르면 어느 쪽으로 열지 물어봅니다.">저장 안 한 작업본</span>' : ''}</div>
        <div class="resume-film" data-film></div>
        <div class="resume-cta">
          ${GUEST ? `<button class="btn ink lg" data-go="present">${icon('play')}발표</button>` : `<button class="btn ink lg" data-go="edit">${icon('edit')}이어서 편집</button>
          <button class="btn lg" data-go="present">${icon('play')}발표</button>
          <span class="flex"></span>
          <button class="btn icon ghost" data-more title="더 보기" aria-label="${esc(d.title)} 더 보기">${icon('dots')}</button>`}
        </div>
      </div>`;
    const meta = () => { const m = resume.querySelector('[data-m]'), t = relTime(timeOf(d)); m.textContent = [d.slides !== '' ? `슬라이드 ${d.slides}장` : '', t ? t + ' 저장' : ''].filter(Boolean).join(' · '); m.title = fmtWhen(d.modified) ? '마지막으로 저장한 때: ' + fmtWhen(d.modified) : ''; };
    meta();
    const main = resume.querySelector('.resume-main');
    main.onclick = () => openEditor(d.name);
    main.onkeydown = (ev) => { if (ev.key === 'Enter') openEditor(d.name); };
    if (!GUEST) resume.querySelector('[data-go=edit]').onclick = () => openEditor(d.name);
    resume.querySelector('[data-go=present]').onclick = () => openPresent(d.name);
    if (!GUEST) resume.querySelector('[data-more]').onclick = (ev) => actionMenu(ev.currentTarget, d, main);
    pressMenu(resume, d, main);
    loadDeck(d).then(deck => {
      meta();
      resume.querySelector('.resume-title').textContent = d.title;
      if (!deck.slides || !deck.slides.length) return;
      drawSlide(main, deck.slides[0], deck);
      const film = resume.querySelector('[data-film]');
      deck.slides.slice(1, 5).forEach((s, i) => {
        const t = document.createElement('button'); t.className = 'film-t'; t.title = `${i + 2}번 슬라이드${GUEST ? '부터 발표' : ' 편집'}`; t.setAttribute('aria-label', t.title);
        t.onclick = () => { if (GUEST) openPresent(d.name, i + 1); else location.href = 'editor.html?deck=' + encodeURIComponent(d.name) + '&slide=' + (i + 1); };
        film.appendChild(t); drawSlide(t, s, deck);
      });
    }).catch(() => { main.classList.remove('loading'); });
  }

  function card(d, vf) {
    const c = document.createElement('article'); c.className = 'deck-card';
    const fo = Folders.of(d.name) ? Folders.get(Folders.of(d.name)) : null; // 이 교안이 든 폴더 (검색 · 최근 7일 목록에서 표시)
    if (!GUEST && FINE) { // 마우스: 끌어다 폴더에 넣기
      c.draggable = true;
      c.addEventListener('dragstart', (ev) => { if (c.classList.contains('busy')) { ev.preventDefault(); return; } ev.dataTransfer.setData(DECK_DT, d.name); ev.dataTransfer.effectAllowed = 'move'; c.classList.add('dragging'); document.body.classList.add('deck-dragging'); closeMenu(); });
      c.addEventListener('dragend', () => { c.classList.remove('dragging'); document.body.classList.remove('deck-dragging'); clearDropMarks(); });
    }
    const th = document.createElement('div'); th.className = 'deck-thumb loading'; th.tabIndex = 0; th.setAttribute('role', 'link'); th.setAttribute('aria-label', d.title + (GUEST ? ' 발표' : ' 편집'));
    th.innerHTML = `<div class="deck-hover"><button class="btn ink" data-a="present">${icon('play', 16)}발표</button>${GUEST ? '' : `<button class="btn" data-a="edit">${icon('edit', 16)}편집</button>`}</div>`;
    th.onclick = (ev) => { if (!ev.target.closest('button')) openEditor(d.name); };
    th.onkeydown = (ev) => { if (ev.key === 'Enter' && ev.target === th) openEditor(d.name); };
    c.appendChild(th);
    const body = document.createElement('div'); body.className = 'deck-body';
    /* 카드 아래 줄: 슬라이드 수 · 저장한 때 · (목록 보기에서) 파일 이름 · 이 기기에 저장 안 한 작업본 */
    const meta = (state) => { const t = relTime(timeOf(d)); return `<span title="${fmtWhen(d.modified) ? '마지막으로 저장한 때: ' + esc(fmtWhen(d.modified)) : ''}">${state || (d.slides === '' ? '불러오는 중…' : `슬라이드 ${d.slides}장`)}${t && !state ? ' · ' + esc(t) : ''}</span><span class="deck-file">${esc(d.name)}.json</span>`
      + (fo && !vf ? `<span class="deck-folder" title="폴더: ${esc(fo.name)}">${icon('folder', 12)}${esc(fo.name)}</span>` : '')
      + (!GUEST && Draft.has(d.name) ? '<span class="draft-chip" title="이 기기에 저장하지 않은 작업본이 남아 있습니다. [편집] 을 누르면 어느 쪽으로 열지 물어봅니다.">저장 안 한 작업본</span>' : ''); };
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
    pressMenu(c, d, c);
    return c;
  }

  /* ---------- 길게 누르기(휴대폰) · 오른쪽 클릭(PC) · 메뉴 키(Shift+F10) → 같은 메뉴 ---------- */
  function pressMenu(el, d, host, menuFn) {
    let t = null, sx = 0, sy = 0, fired = 0;
    const at = (x, y) => ({ x, y });
    const show = menuFn || ((p) => actionMenu(null, d, host, p));
    const open = (x, y) => { fired = Date.now(); if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { } show(at(x, y)); };
    el.addEventListener('contextmenu', (ev) => { // 안드로이드 크롬은 길게 누르면 이 이벤트가 옴
      if (ev.target.closest('input, textarea, [contenteditable]')) return;
      ev.preventDefault(); clearTimeout(t);
      if (Date.now() - fired < 700) return; // 직접 잰 길게 누르기로 이미 열었음
      open(ev.clientX, ev.clientY);
    });
    el.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType === 'mouse') return;
      sx = ev.clientX; sy = ev.clientY; clearTimeout(t);
      t = setTimeout(() => open(sx, sy), 480); // 아이폰처럼 contextmenu 가 오지 않는 기기
    });
    const cancel = () => clearTimeout(t);
    el.addEventListener('pointermove', (ev) => { if (Math.abs(ev.clientX - sx) > 10 || Math.abs(ev.clientY - sy) > 10) cancel(); });
    el.addEventListener('pointerup', cancel); el.addEventListener('pointercancel', cancel);
    el.addEventListener('click', (ev) => { if (Date.now() - fired < 700) { ev.preventDefault(); ev.stopPropagation(); } }, true); // 손을 뗄 때 카드가 열리지 않게
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'ContextMenu' || (ev.shiftKey && ev.key === 'F10')) { ev.preventDefault(); const r = (ev.target.getBoundingClientRect ? ev.target : el).getBoundingClientRect(); show(at(r.left + 24, r.top + 24)); }
    });
  }

  /* ---------- ⋯ 메뉴 (길게 누르기 · 오른쪽 클릭도 같은 메뉴): 발표 · 편집 · 사본 만들기 · 이름 바꾸기 · 링크 복사 · 파일로 받기 · 삭제 ---------- */
  let openMenu = null, openShade = null;
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } if (openShade) { openShade.remove(); openShade = null; } }
  document.addEventListener('pointerdown', (ev) => { if (openMenu && !openMenu.contains(ev.target)) closeMenu(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', closeMenu);
  function actionMenu(btn, d, host, at) {
    const fine = matchMedia('(pointer: fine)').matches;
    const fo = Folders.of(d.name) ? Folders.get(Folders.of(d.name)) : null;
    const items = GUEST
      ? [['present', 'play', '발표'], null, ['link', 'link', '발표 링크 복사']]
      : [['edit', 'edit', '편집'], ['present', 'play', '발표'], fine ? ['newtab', 'expand', '새 탭에서 편집'] : null, null,
        ['move', 'folder', fo ? '다른 폴더로 옮기기' : '폴더로 옮기기'], fo ? ['out', 'folderOut', `폴더에서 빼기 (${fo.name})`] : null, null,
        ['dup', 'copy', '사본 만들기'], ['rename', 'text', '파일 이름 바꾸기'], ['link', 'link', '발표 링크 복사'], ['export', 'export', '파일로 받기 (.json)'], null,
        ['del', 'trash', '삭제']];
    showMenu(btn, at, d.title, d.slides !== '' ? `슬라이드 ${d.slides}장` + (fo ? ` · ${fo.name} 폴더` : '') : '', items, (a) => act(a, d, host));
  }
  /* 메뉴 그리기 (교안 · 폴더 공통). items: [동작, 아이콘, 글] · null = 구분선 */
  function showMenu(btn, at, title, sub, items, pick) {
    const same = btn && openMenu && openMenu._btn === btn; closeMenu(); if (same) return;
    items = items.filter((x, i, a) => x || (i && a[i - 1] && a.slice(i + 1).some(Boolean))); // 구분선이 겹치거나 맨 끝에 오지 않게
    const sheet = !btn && matchMedia('(max-width: 820px)').matches; // 휴대폰에서 길게 누르면: 아래에서 올라오는 시트
    const m = document.createElement('div'); m.className = 'menu deck-menu' + (sheet ? ' sheet' : ''); m.setAttribute('role', 'menu'); m.setAttribute('aria-label', title + ' 메뉴'); m._btn = btn;
    if (sheet) m.insertAdjacentHTML('beforeend', `<div class="mh"><b>${esc(title)}</b><small>${esc(sub || '')}</small></div>`);
    /* 길게 눌러 연 메뉴: 손가락을 떼는 순간의 누름이 그 자리의 메뉴 항목(예: 편집)이나 바깥(닫기)으로 들어가지 않게,
       메뉴가 열린 뒤 새로 누른 것만 받음 */
    let armed = !!btn; const arm = () => { armed = true; };
    for (const it of items) {
      if (!it) { m.appendChild(document.createElement('hr')); continue; }
      const b = document.createElement('div'); b.className = 'mi' + (/del$/.test(it[0]) ? ' danger' : ''); b.setAttribute('role', 'menuitem'); b.tabIndex = 0;
      b.innerHTML = `${icon(it[1], sheet ? 20 : 16)}<span>${esc(it[2])}</span>`;
      const go = () => { closeMenu(); pick(it[0]); };
      b.onclick = () => { if (armed) go(); }; b.onkeydown = (ev) => { if (ev.key === 'Enter') go(); };
      m.appendChild(b);
    }
    m.addEventListener('pointerdown', arm);
    if (sheet) { openShade = document.createElement('div'); openShade.className = 'menu-shade'; openShade.addEventListener('pointerdown', arm); openShade.onclick = () => { if (armed) closeMenu(); }; document.body.appendChild(openShade); }
    document.body.appendChild(m); openMenu = m;
    /* 자판으로도: ↑↓ 로 고르고 Enter, Esc 는 닫고 ⋯ 단추로 돌아감 */
    const mis = Array.from(m.querySelectorAll('.mi'));
    m.addEventListener('keydown', (ev) => {
      const i = mis.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); mis[(i + (ev.key === 'ArrowDown' ? 1 : -1) + mis.length) % mis.length].focus(); }
      else if (ev.key === 'Escape') { ev.stopPropagation(); closeMenu(); if (btn) btn.focus(); }
      else if (ev.key === 'Tab') { if (btn) btn.focus(); closeMenu(); }
    });
    if (!sheet) mis[0].focus({ preventScroll: true });
    if (sheet) return;
    m.style.position = 'fixed';
    if (at) { // 누른 자리에서 열림 (화면 밖으로 나가지 않게)
      m.style.left = Math.max(8, Math.min(at.x, innerWidth - m.offsetWidth - 8)) + 'px';
      m.style.top = Math.max(8, Math.min(at.y, innerHeight - m.offsetHeight - 8)) + 'px';
      return;
    }
    const r = btn.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top = (r.bottom + 6 + m.offsetHeight > innerHeight - 8 ? r.top - 6 - m.offsetHeight : r.bottom + 6) + 'px';
  }
  async function act(a, d, host) {
    /* 일하는 동안: 카드를 흐리게 (GitHub 은 몇 초 걸림 · 두 번 누름 방지) */
    const busy = () => { host.classList.add('busy'); return () => host.classList.remove('busy'); };
    if (a === 'edit') return openEditor(d.name);
    if (a === 'present') return openPresent(d.name);
    if (a === 'out') return moveDeck(d.name, null);
    if (a === 'move') { const to = await movePicker(d); if (to !== undefined) moveDeck(d.name, to); return; }
    if (a === 'newtab') { window.open('editor.html?deck=' + encodeURIComponent(d.name), '_blank'); return; }
    if (a === 'link') {
      const url = new URL('present.html?deck=' + encodeURIComponent(d.name), location.href).href;
      try { await navigator.clipboard.writeText(url); toast('발표 링크를 복사했습니다'); }
      catch (e) { window.prompt('이 주소를 복사하세요', url); }
      return;
    }
    if (a === 'export') {
      const done = busy();
      try {
        const deck = await API.load(d.name);
        const u = URL.createObjectURL(new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' }));
        const x = document.createElement('a'); x.href = u; x.download = d.name + '.json'; document.body.appendChild(x); x.click(); x.remove();
        setTimeout(() => URL.revokeObjectURL(u), 5000);
        toast('교안 파일을 받았습니다 — [파일 가져오기] 로 다시 넣을 수 있습니다', 3200);
      } catch (e) { fail('파일로 받기 실패: ', e); }
      done(); return;
    }
    if (a === 'del') {
      const how = API.mode === 'server' ? 'decks/.trash 폴더로 옮깁니다.' : API.mode === 'github' ? '저장소에서 지웁니다. Git 기록에는 남습니다.' : '이 브라우저에서 지웁니다.';
      if (!(await askConfirm(`"${d.title}" 교안을 삭제할까요?`, how, '삭제'))) return;
      const done = busy();
      if (API.mode === 'github') toast('저장소에서 지우는 중… (몇 초 걸립니다)', 4000);
      try { await ghTry(() => API.remove(d.name)); }
      catch (e) { done(); fail('삭제 실패: ', e); return; }
      Draft.forget(d.name); // 이 기기에 남은 작업본도 치움 (같은 이름으로 새로 만든 교안에 옛 작업본이 뜨지 않게)
      if (Folders.of(d.name)) Folders.do({ t: 'forget', deck: d.name }, '지운 교안 ' + d.name);
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
        if (Folders.of(d.name)) Folders.do({ t: 'move', deck: name, to: Folders.of(d.name) }, '사본 ' + name); // 사본은 원본과 같은 폴더에
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
      if (Folders.of(d.name)) Folders.do({ t: 'renameDeck', from: d.name, to: safe }, `이름 바꾼 교안 ${d.name} → ${safe}`); // 폴더도 새 이름으로
      removed.set(d.name, Date.now());
      if (bus) bus.postMessage({ type: 'renamed', name: d.name, to: safe });
      refresh();
    }
  }

  /* ---------- 폴더 화면 ---------- */
  const FINE = matchMedia('(pointer: fine)').matches; // 마우스가 있는 화면: 끌어다 놓기 (휴대폰은 길게 누르기 → 메뉴)
  const DECK_DT = 'application/x-gyoan-deck';
  function folderDecks(id) { return sorted(decks.filter(d => Folders.of(d.name) === id)); }
  function openFolder(id) { location.hash = 'f=' + encodeURIComponent(id); }
  function leaveFolder() { if (folderOfHash()) history.pushState(null, '', location.pathname + location.search); filter = 'all'; render(); }
  window.addEventListener('hashchange', () => { const id = folderOfHash(); filter = id ? 'f:' + id : 'all'; render(); window.scrollTo(0, 0); });
  window.addEventListener('popstate', () => { const id = folderOfHash(); const f = id ? 'f:' + id : (filter.startsWith('f:') ? 'all' : filter); if (f !== filter) { filter = f; render(); } });

  function folderCard(f) {
    const ds = folderDecks(f.id);
    const c = document.createElement('article'); c.className = 'deck-card folder-card'; c.dataset.drop = f.id;
    const th = document.createElement('div'); th.className = 'deck-thumb folder-thumb'; th.tabIndex = 0; th.setAttribute('role', 'link'); th.setAttribute('aria-label', `${f.name} 폴더 열기 (교안 ${ds.length}개)`);
    if (ds.length) {
      const mo = document.createElement('div'); mo.className = 'folder-mosaic n' + Math.min(4, ds.length);
      ds.slice(0, 4).forEach(d => {
        const t = document.createElement('div'); t.className = 'fm loading'; mo.appendChild(t);
        loadDeck(d).then(deck => { if (deck.slides && deck.slides.length) drawSlide(t, deck.slides[0], deck); else t.classList.remove('loading'); }).catch(() => t.classList.remove('loading'));
      });
      th.appendChild(mo);
    } else th.innerHTML = `<div class="folder-empty">${icon('folder', 34)}<span>비어 있음</span></div>`;
    th.onclick = () => openFolder(f.id);
    th.onkeydown = (ev) => { if (ev.key === 'Enter' && ev.target === th) openFolder(f.id); };
    c.appendChild(th);
    const body = document.createElement('div'); body.className = 'deck-body';
    body.innerHTML = `<div class="deck-text"><div class="deck-title folder-title" title="${esc(f.name)}">${icon('folder', 16)}<span>${esc(f.name)}</span></div><div class="deck-meta"><span>교안 ${ds.length}개</span></div></div>
      ${GUEST ? '' : `<button class="btn icon ghost kebab" data-more title="폴더 메뉴" aria-label="${esc(f.name)} 폴더 메뉴">${icon('dots')}</button>`}`;
    body.querySelector('.deck-text').onclick = () => openFolder(f.id);
    const more = body.querySelector('[data-more]'); if (more) more.onclick = (ev) => { ev.stopPropagation(); folderMenu(more, f); };
    c.appendChild(body);
    if (!GUEST) pressMenu(c, null, c, (at) => folderMenu(null, f, at));
    return c;
  }
  function folderMenu(btn, f, at) {
    const n = folderDecks(f.id).length;
    showMenu(btn, at, f.name, `폴더 · 교안 ${n}개`, [['open', 'folder', '열기'], null, ['frename', 'text', '폴더 이름 바꾸기'], null, ['fdel', 'trash', '폴더 삭제']], (a) => folderAct(a, f));
  }
  async function folderAct(a, f) {
    if (a === 'open') return openFolder(f.id);
    if (a === 'frename') {
      const nn = await askText('폴더 이름 바꾸기', '목록에 보이는 폴더 이름입니다. 안에 든 교안 파일은 바뀌지 않습니다.', f.name, '바꾸기'); if (!nn || nn === f.name) return;
      if (Folders.st.folders.some(x => x.id !== f.id && x.name === nn)) { tell('같은 이름의 폴더가 있습니다', '다른 이름을 골라 주세요.'); return; }
      Folders.do({ t: 'rename', id: f.id, name: nn }, `폴더 이름 ${f.name} → ${nn}`); toast('폴더 이름을 바꿨습니다');
    }
    if (a === 'fdel') {
      const n = folderDecks(f.id).length;
      if (!(await askConfirm(`"${f.name}" 폴더를 지울까요?`, n ? `폴더만 지웁니다. 안에 있던 교안 ${n}개는 목록으로 돌아가고, 교안 파일은 그대로 남습니다.` : '빈 폴더를 지웁니다.', '폴더 삭제'))) return;
      Folders.do({ t: 'delete', id: f.id }, '폴더 삭제 ' + f.name);
      if (filter === 'f:' + f.id) leaveFolder();
      toast(n ? `폴더를 지웠습니다 — 교안 ${n}개는 목록으로 돌아갔습니다` : '폴더를 지웠습니다', 3000);
    }
  }
  async function newFolder() {
    const nm = await askText('새 폴더', '교안을 묶어 둘 폴더 이름을 입력하세요. 교안 파일은 그대로 두고 목록에서만 묶입니다.', '새 폴더', '만들기'); if (!nm) return null;
    if (Folders.st.folders.some(x => x.name === nm)) { tell('같은 이름의 폴더가 있습니다', '다른 이름을 골라 주세요.'); return null; }
    const id = newFolderId();
    Folders.do({ t: 'create', id, name: nm }, '새 폴더 ' + nm);
    return id;
  }
  $('btnNewFolder').onclick = newFolder;
  /* 폴더 안을 볼 때 위쪽 줄: ← 모든 교안 (여기에 끌어다 놓으면 폴더에서 빼기) · 폴더 메뉴 */
  function renderFolderBar(vf, n) {
    const bar = $('folderBar');
    bar.style.display = vf ? '' : 'none'; if (!vf) { bar.innerHTML = ''; return; }
    bar.innerHTML = `<button class="btn sm ghost fb-back" data-drop="" title="모든 교안으로 (교안을 여기에 끌어다 놓으면 폴더에서 뺍니다)">${icon('back', 16)}모든 교안</button>
      <span class="fb-name">${icon('folder', 16)}<b>${esc(vf.name)}</b></span>
      <span class="flex"></span>
      ${GUEST ? '' : `<button class="btn sm ghost" data-fa="frename">${icon('text', 15)}이름 바꾸기</button><button class="btn icon ghost" data-more title="폴더 메뉴" aria-label="${esc(vf.name)} 폴더 메뉴">${icon('dots')}</button>`}
      <div class="drop-out" data-drop="">${icon('folderOut', 18)}여기에 놓으면 폴더에서 빼서 목록으로 꺼냅니다</div>`;
    bar.querySelector('.fb-back').onclick = leaveFolder;
    const rn = bar.querySelector('[data-fa=frename]'); if (rn) rn.onclick = () => folderAct('frename', vf);
    const more = bar.querySelector('[data-more]'); if (more) more.onclick = () => folderMenu(more, vf);
  }
  /* 왼쪽 메뉴의 폴더 목록: 누르면 열고, 교안을 끌어다 놓으면 넣음 (목록이 길어 아래의 폴더 칸이 화면 밖이어도) */
  function renderRailFolders(vf) {
    const nav = $('railFolders'), fs = Folders.list();
    nav.hidden = !fs.length; nav.innerHTML = '';
    if (!fs.length) return;
    nav.insertAdjacentHTML('beforeend', '<div class="rail-label">폴더</div>');
    for (const f of fs) {
      const b = document.createElement('button'); b.className = 'rail-item' + (vf && vf.id === f.id ? ' on' : ''); b.dataset.drop = f.id; b.title = `${f.name} 폴더 열기${GUEST ? '' : ' · 교안을 여기에 끌어다 놓으면 이 폴더에 넣습니다'}`;
      if (vf && vf.id === f.id) b.setAttribute('aria-current', 'page');
      b.innerHTML = `${icon('folder')}<span>${esc(f.name)}</span><em>${folderDecks(f.id).length || ''}</em>`;
      b.onclick = () => openFolder(f.id);
      if (!GUEST) pressMenu(b, null, b, (at) => folderMenu(null, f, at));
      nav.appendChild(b);
    }
  }
  /* 교안을 폴더로 (to = 폴더 id · null 이면 목록으로 꺼냄) */
  function moveDeck(name, to) {
    const from = Folders.of(name) || null; if (from === (to || null)) return;
    const d = decks.find(x => x.name === name), title = d ? d.title : name;
    const f = to ? Folders.get(to) : null; if (to && !f) return;
    Folders.do({ t: 'move', deck: name, to: to || null }, f ? `${title} → ${f.name}` : `${title} 폴더에서 빼기`);
    toast(f ? `"${title}" 을(를) ${f.name} 폴더에 넣었습니다` : `"${title}" 을(를) 폴더에서 빼서 목록으로 꺼냈습니다`, 2600);
  }
  /* 폴더 고르기 (휴대폰에서도: ⋯ 메뉴 · 길게 누르기 → [폴더로 옮기기]). 결과: 폴더 id · null(목록으로) · undefined(취소) */
  function movePicker(d) {
    const cur = Folders.of(d.name);
    return dialog((m, close) => {
      m.classList.add('ask', 'move-modal');
      const fs = Folders.list();
      m.innerHTML = `<h3>폴더로 옮기기</h3><p class="modal-desc">${esc(d.title)}</p>
        <div class="pick-list" role="listbox" aria-label="폴더">
          ${fs.map(f => `<button class="pick${f.id === cur ? ' on' : ''}" data-id="${esc(f.id)}" ${f.id === cur ? 'aria-current="true"' : ''}>${icon('folder', 18)}<span>${esc(f.name)}</span><small>${f.id === cur ? '지금 폴더' : `교안 ${folderDecks(f.id).length}개`}</small></button>`).join('')}
          ${cur ? `<button class="pick" data-id="">${icon('folderOut', 18)}<span>폴더에서 빼기</span><small>목록으로</small></button>` : ''}
          <button class="pick add" data-new>${icon('folderPlus', 18)}<span>새 폴더 만들어 넣기</span></button>
        </div>
        <div class="actions"><button class="btn" data-x>취소</button></div>`;
      m.querySelector('[data-x]').onclick = () => close(undefined);
      m.querySelectorAll('.pick[data-id]').forEach(b => b.onclick = () => { const id = b.dataset.id || null; close(id === cur ? undefined : id); });
      m.querySelector('[data-new]').onclick = async () => { close(undefined); const id = await newFolder(); if (id) moveDeck(d.name, id); };
    }).then(v => v === null && !cur ? undefined : v);
  }
  /* 끌어다 놓기: 폴더 칸 · 폴더 안의 [← 모든 교안] · 왼쪽의 [모든 교안] */
  const isDeckDrag = (ev) => !!ev.dataTransfer && Array.from(ev.dataTransfer.types || []).includes(DECK_DT);
  const dropTarget = (ev) => (ev.target && ev.target.closest) ? ev.target.closest('[data-drop]') : null;
  function clearDropMarks() { document.querySelectorAll('.drop-on').forEach(x => x.classList.remove('drop-on')); }
  document.addEventListener('dragover', (ev) => {
    if (!isDeckDrag(ev)) return; const t = dropTarget(ev); clearDropMarks(); if (!t) return;
    ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; t.classList.add('drop-on');
  });
  document.addEventListener('dragleave', (ev) => { if (isDeckDrag(ev) && !ev.relatedTarget) clearDropMarks(); });
  document.addEventListener('drop', (ev) => {
    if (!isDeckDrag(ev)) return; const t = dropTarget(ev); clearDropMarks(); document.body.classList.remove('deck-dragging'); if (!t) return;
    ev.preventDefault(); const name = ev.dataTransfer.getData(DECK_DT); if (name) moveDeck(name, t.dataset.drop || null);
  });
  $('nav').querySelector('[data-filter=all]').dataset.drop = '';

  function openPresent(name, start) { window.open('present.html?deck=' + encodeURIComponent(name) + (start ? '&start=' + start : ''), '_blank'); }
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
        <p>PowerPoint 파일(.pptx)을 이 화면에 끌어다 놓으면 교안으로 바뀝니다. 앱으로 설치했으면 탐색기에서 [연결 프로그램 → DPV] 으로 열 수도 있습니다.</p></section>
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
      if (!(await freshList())) return; // 실패 알림(toast)이 'PPT 파일을 읽는 중…' 을 바로 바꿔 씀
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
  // 앱으로 설치한 뒤 탐색기에서 .pptx 를 [연결 프로그램 → DPV] 으로 열면 여기로 파일이 넘어옴
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
    if (folderOfHash()) history.pushState(null, '', location.pathname + location.search); // 폴더 안에서 나옴
    render();
  });

  { const h = folderOfHash(); if (h) filter = 'f:' + h; }
  foldersFirst = Folders.load();
  render(); // 불러오기 전 빈 카드 자리
  refresh();
  foldersFirst.then(() => { if (loadedOnce) render(); if (Folders.pend.length && !GUEST) Folders.flush(); }); // 지난번에 저장하지 못한 변경이 있으면 이어서 저장
  /* 다른 기기(휴대폰 · PC)에서 바꾼 폴더: 이 화면으로 돌아올 때 다시 읽음 */
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !Folders.pend.length && !Folders.busy) Folders.load().then(ok => { if (ok && !Folders.pend.length && !Folders.busy) render(); }); });
  window.addEventListener('pagehide', () => { if (Folders.pend.length && !Folders.busy) Folders.flush(); }); // 저장하기 전에 화면을 떠나면 바로 저장 시작 (끝내지 못하면 다음에 이어서)
})();
