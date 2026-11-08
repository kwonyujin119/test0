/* 영상 작업장 — 첫 화면 (교안 작업장과 같은 구성)
   왼쪽: 새 영상 · 모든 영상 · 최근 7일 · 다른 기기에서 · 아직 안 올라감 / 파일로 시작 · 녹화로 시작 · 다른 기기와 연결
   가운데: 가장 최근에 고친 영상 (이어서 작업) · 아래: 다른 영상
   프로젝트는 이 기기 브라우저(IndexedDB)에 있다. 연결을 켰으면 비공개 저장소의 목록도 함께 보여 준다.
   그림(미리보기)은 편집기가 저장할 때 남긴 화면, 없으면 첫 클립의 한 장면을 뽑아 둔다. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const S = VE.sync;
  const PREF = 'vh:pref';
  let pref = { sort: 'recent', view: 'grid' }; try { pref = { ...pref, ...JSON.parse(localStorage.getItem(PREF) || '{}') }; } catch (e) { }
  const savePref = () => { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) { } };
  let all = [], remote = {}, filter = 'all', loaded = false, remoteErr = '';
  const FILTER_NAMES = { all: '모든 영상', week: '최근 7일', remote: '다른 기기에서', unsent: '아직 안 올라감' };

  /* ---------- 작은 도구 ---------- */
  const dur = p => (p.clips || []).reduce((s, c) => s + Math.max(0, (c.out - c.in) / (c.speed || 1)), 0);
  const fmtDur = s => { s = Math.round(s || 0); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`; };
  function relTime(t) {
    if (!t) return '';
    const now = new Date(), d = new Date(t), mins = Math.floor((now - d) / 60000);
    if (mins < 1) return '방금'; if (mins < 60) return `${mins}분 전`;
    if (mins < 60 * 24 && d.getDate() === now.getDate()) return `${Math.floor(mins / 60)}시간 전`;
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (d >= y && d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return '어제';
    if (now - d < 7 * 864e5) return `${Math.floor((now - d) / 864e5)}일 전`;
    return d.toLocaleDateString('ko-KR', { year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric', month: 'long', day: 'numeric' });
  }
  const ASPECT_NAME = { '16:9': '가로', '9:16': '세로', '1:1': '정사각', '4:5': '세로 4:5' };
  function dialog(build) {
    return new Promise(resolve => {
      const bg = document.createElement('div'); bg.className = 'modal-bg';
      const m = document.createElement('div'); m.className = 'modal ask'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); bg.appendChild(m);
      const close = v => { document.removeEventListener('keydown', onKey, true); bg.remove(); resolve(v); };
      const onKey = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); close(null); } };
      document.addEventListener('keydown', onKey, true);
      bg.addEventListener('pointerdown', ev => { if (ev.target === bg) close(null); });
      build(m, close); document.body.appendChild(bg);
      const first = m.querySelector('[autofocus]') || m.querySelector('input,button.ink'); if (first) { first.focus(); if (first.select) first.select(); }
    });
  }
  const askText = (title, value, ok) => dialog((m, close) => {
    m.innerHTML = `<h3>${esc(title)}</h3><input type="text" value="${esc(value || '')}" autofocus aria-label="${esc(title)}" style="width:100%;height:40px;font-size:15px"><div class="actions"><button class="btn" data-x>취소</button><button class="btn ink" data-ok>${esc(ok)}</button></div>`;
    const inp = m.querySelector('input'); m.querySelector('[data-x]').onclick = () => close(null); m.querySelector('[data-ok]').onclick = () => close(inp.value.trim() || null);
    inp.onkeydown = ev => { if (ev.key === 'Enter' && !ev.isComposing) close(inp.value.trim() || null); };
  });
  const askConfirm = (title, desc, ok) => dialog((m, close) => {
    m.innerHTML = `<h3>${esc(title)}</h3><p class="modal-desc">${esc(desc)}</p><div class="actions"><button class="btn" data-x>취소</button><button class="btn danger-solid" data-ok autofocus>${esc(ok)}</button></div>`;
    m.querySelector('[data-x]').onclick = () => close(false); m.querySelector('[data-ok]').onclick = () => close(true);
  });
  const go = (q) => { location.href = 'video.html?' + q; };
  const openP = id => go('p=' + encodeURIComponent(id));
  const pullP = id => go('pull=' + encodeURIComponent(id));

  /* ---------- 미리보기 그림 ---------- */
  const posterUrl = new Map(); // id → objectURL
  let pq = Promise.resolve();
  const frameQ = fn => (pq = pq.then(fn, fn));
  /* 영상 파일의 t 초 장면을 그림으로 (한 번에 하나씩 — 휴대폰이 버거워하지 않게) */
  function grab(blob, kind, t, w) {
    return frameQ(() => new Promise(res => {
      const url = URL.createObjectURL(blob), done = (c) => { URL.revokeObjectURL(url); res(c); };
      const draw = (src, sw, sh) => { const W = w || 480, H = Math.round(W * sh / sw) || 270, c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(src, 0, 0, W, H); return c; };
      if (kind === 'image') { const im = new Image(); im.onload = () => done(draw(im, im.naturalWidth, im.naturalHeight)); im.onerror = () => done(null); im.src = url; return; }
      const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto';
      const to = setTimeout(() => done(null), 8000);
      v.onloadedmetadata = () => { v.currentTime = Math.min(Math.max(0, t), Math.max(0, (v.duration || 1) - .05)); };
      v.onseeked = () => { clearTimeout(to); try { done(v.videoWidth ? draw(v, v.videoWidth, v.videoHeight) : null); } catch (e) { done(null); } v.removeAttribute('src'); v.load(); };
      v.onerror = () => { clearTimeout(to); done(null); };
      v.src = url;
    }));
  }
  /* 영상 전체 시간 t 에 보이는 클립의 원본 위치 */
  function srcAt(p, t) { let s = 0; for (const c of p.clips || []) { const L = (c.out - c.in) / (c.speed || 1); if (t < s + L || c === p.clips[p.clips.length - 1]) return { c, src: Math.min(c.out, c.in + Math.max(0, t - s) * (c.speed || 1)) }; s += L; } return null; }
  async function frameAt(p, t, w) {
    const at = srcAt(p, t); if (!at) return null; const m = (p.media || []).find(x => x.id === at.c.mid); if (!m || m.kind === 'audio') return null;
    const blob = await VE.idb.get('blobs', m.id).catch(() => null); if (!blob) return null;
    return grab(blob, m.kind, at.src, w);
  }
  async function poster(p) {
    if (posterUrl.has(p.id)) return posterUrl.get(p.id);
    let b = await VE.idb.get('cache', 'poster:' + p.id).catch(() => null);
    if (!b && (p.clips || []).length) {
      const c = await frameAt(p, Math.min(1, dur(p) * .1)); if (c) { b = await new Promise(r => c.toBlob(r, 'image/jpeg', .78)); if (b) VE.idb.put('cache', 'poster:' + p.id, b).catch(() => { }); }
    }
    const u = b ? URL.createObjectURL(b) : ''; posterUrl.set(p.id, u); return u;
  }
  function putPoster(box, p, opts) {
    box.classList.add('loading');
    const ph = () => { box.classList.remove('loading'); box.classList.add('vh-ph'); box.insertAdjacentHTML('afterbegin', `<span class="vh-ph-ic">${icon(opts && opts.remote ? 'cloud' : 'film', 28)}</span>`); };
    if (opts && opts.remote) return ph();
    poster(p).then(u => {
      if (!u) return ph();
      const im = new Image(); im.className = 'vh-poster'; im.alt = ''; im.decoding = 'async';
      im.onload = () => { box.classList.remove('loading'); box.style.setProperty('--vh-bg', `url("${u}")`); box.classList.add('has-img'); };
      im.onerror = ph; im.src = u; box.insertBefore(im, box.firstChild);
    });
  }

  /* ---------- 목록 ---------- */
  function items() {
    const out = all.map(p => ({ id: p.id, p, name: p.name || '새 영상', t: p.updated || 0, len: dur(p), files: (p.media || []).length, newer: remote[p.id] && (remote[p.id].updated || 0) > (p.updated || 0) ? remote[p.id] : null }));
    const mine = new Set(all.map(p => p.id));
    for (const [id, r] of Object.entries(remote)) if (!mine.has(id)) out.push({ id, r, remote: true, name: r.name || '새 영상', t: r.updated || 0, len: r.len || 0, files: r.media || 0, device: r.device });
    return out;
  }
  const unsent = it => S.cfg().on && it.p && !S.isSent(it.p) && ((it.p.media || []).length || (it.p.clips || []).length);
  const inWeek = it => it.t && Date.now() - it.t < 7 * 864e5;
  function render() {
    const kw = ($('q').value || '').trim().toLowerCase(), every = items();
    let list = every.filter(it => !kw || it.name.toLowerCase().includes(kw));
    if (filter === 'week') list = list.filter(inWeek);
    if (filter === 'remote') list = list.filter(it => it.remote || it.newer);
    if (filter === 'unsent') list = list.filter(unsent);
    const by = { recent: (a, b) => b.t - a.t, title: (a, b) => a.name.localeCompare(b.name, 'ko'), long: (a, b) => b.len - a.len };
    list.sort(by[pref.sort] || by.recent);

    const on = S.cfg().on, nRemote = every.filter(it => it.remote || it.newer).length, nUnsent = every.filter(unsent).length;
    $('cAll').textContent = every.length || ''; $('cWeek').textContent = every.filter(inWeek).length || '';
    $('navRemote').hidden = !on; $('cRemote').textContent = nRemote || '';
    $('navUnsent').hidden = !on || !nUnsent; $('cUnsent').textContent = nUnsent || '';
    if (filter === 'unsent' && !nUnsent) filter = 'all';
    document.querySelectorAll('#nav .rail-item').forEach(b => b.classList.toggle('on', b.dataset.filter === filter));
    $('pageTitle').textContent = kw ? '검색 결과' : FILTER_NAMES[filter]; $('sub').textContent = loaded ? `${list.length}개` : '';

    const hero = filter === 'all' && !kw && pref.sort === 'recent' && list.length > 1 && list[0].p ? list[0] : null;
    const resume = $('resume'); resume.innerHTML = ''; resume.style.display = hero ? '' : 'none';
    if (hero) { renderResume(hero); list = list.slice(1); }
    $('gridHead').style.display = hero ? '' : 'none';

    const grid = $('grid'); grid.className = 'deck-grid vh-grid' + (pref.view === 'list' ? ' list' : ''); grid.innerHTML = '';
    for (const it of list) grid.appendChild(card(it));
    if (!loaded) for (let i = 0; i < 6; i++) grid.insertAdjacentHTML('beforeend', '<div class="deck-card ghost"><div class="deck-thumb loading"></div><div class="deck-body"><div class="line"></div><div class="line short"></div></div></div>');

    const none = loaded && !list.length && !hero, empty = $('empty'); empty.style.display = none ? '' : 'none';
    if (none) {
      empty.innerHTML = kw ? `<b>"${esc(kw)}" 이(가) 들어간 영상이 없습니다</b><span>검색 칸을 비우면 전체가 보입니다.</span>`
        : filter === 'week' ? '<b>최근 7일 동안 고친 영상이 없습니다</b>'
          : filter === 'remote' ? `<b>다른 기기에서 새로 올린 영상이 없습니다</b><span>${remoteErr ? esc(remoteErr) : '다른 기기에서 영상 작업장을 열면 남아 있던 영상이 저절로 올라옵니다.'}</span>`
            : `<b>첫 영상을 만들어 보세요</b><span>영상·사진·소리 파일로 시작하거나, 화면·카메라를 녹화해 시작합니다.</span><div class="vh-row"><button class="btn ink" data-empty="new">${icon('plus')}새 영상</button><button class="btn" data-empty="import">${icon('import')}파일로 시작</button><button class="btn" data-empty="rec">${icon('record')}녹화로 시작</button></div>`;
      empty.querySelectorAll('[data-empty]').forEach(b => b.onclick = () => ({ new: newVideo, import: () => $('fileImport').click(), rec: () => go('new=1&tab=rec') })[b.dataset.empty]());
    }
    const notice = $('notice');
    if (on && remoteErr) { notice.style.display = ''; notice.className = 'hub-notice warn'; notice.innerHTML = `${icon('cloud', 15)} 다른 기기 목록을 읽지 못했습니다: ${esc(remoteErr)} <a href="video.html?sync=1">연결 확인</a>`; }
    else if (on && nUnsent && filter !== 'unsent') { notice.style.display = ''; notice.className = 'hub-notice'; notice.innerHTML = `${icon('cloud', 15)} 이 기기에서 고친 뒤 아직 올리지 않은 영상이 ${nUnsent}개 있습니다. ${S.state === 'busy' ? esc(S.msg) + (S.ratio != null ? ` ${Math.round(S.ratio * 100)}%` : '') : '<a href="#" id="upNow">지금 올리기</a>'}`; const u = $('upNow'); if (u) u.onclick = ev => { ev.preventDefault(); upload(); }; }
    else notice.style.display = 'none';
  }

  function metaText(it) { return [it.len ? fmtDur(it.len) : '', it.files ? `파일 ${it.files}개` : '', relTime(it.t)].filter(Boolean).join(' · '); }
  function renderResume(it) {
    const p = it.p, resume = $('resume');
    resume.innerHTML = `<div class="resume-main deck-thumb vh-thumb" tabindex="0" role="link" aria-label="${esc(it.name)} 이어서 편집">${it.len ? `<span class="vh-dur">${fmtDur(it.len)}</span>` : ''}</div>
      <div class="resume-side">
        <div class="eyebrow">이어서 작업</div>
        <h2 class="resume-title">${esc(it.name)}</h2>
        <div class="resume-meta">${esc(metaText(it))}${p.aspect ? ` · ${ASPECT_NAME[p.aspect] || p.aspect}` : ''}${it.newer ? ` · <span class="vh-chip">${esc(it.newer.device || '다른 기기')}에서 더 최근에 고침</span>` : unsent(it) ? ' · <span class="vh-chip warn">아직 안 올라감</span>' : ''}</div>
        <div class="resume-film" data-film></div>
        <div class="resume-cta">
          <button class="btn ink lg" data-go="edit">${icon('edit')}이어서 편집</button>
          <button class="btn lg" data-go="export"${(p.clips || []).length ? '' : ' disabled'}>${icon('export')}내보내기</button>
          <span class="flex"></span>
          <button class="btn icon ghost" data-more title="더 보기" aria-label="${esc(it.name)} 더 보기">${icon('dots')}</button>
        </div>
      </div>`;
    const main = resume.querySelector('.resume-main'); putPoster(main, p);
    main.onclick = () => openP(p.id); main.onkeydown = ev => { if (ev.key === 'Enter') openP(p.id); };
    resume.querySelector('[data-go=edit]').onclick = () => it.newer ? pullP(p.id) : openP(p.id);
    resume.querySelector('[data-go=export]').onclick = () => go('p=' + encodeURIComponent(p.id) + '&export=1');
    resume.querySelector('[data-more]').onclick = ev => menu(ev.currentTarget, it, resume);
    /* 아래 띠: 영상 여기저기의 네 장면 — 누르면 그 자리에서 편집 */
    const L = it.len, film = resume.querySelector('[data-film]');
    if (L > 0) for (let i = 1; i <= 4; i++) {
      const t = L * i / 5, b = document.createElement('button'); b.className = 'film-t vh-film'; b.title = `${fmtDur(t)} 부터 편집`; b.setAttribute('aria-label', b.title);
      b.innerHTML = `<span class="vh-dur sm">${fmtDur(t)}</span>`; b.onclick = () => go('p=' + encodeURIComponent(p.id) + '&t=' + t.toFixed(2)); film.appendChild(b);
      frameAt(p, t, 320).then(c => { if (!c) return; c.className = 'vh-frame'; b.insertBefore(c, b.firstChild); });
    }
  }

  function card(it) {
    const c = document.createElement('article'); c.className = 'deck-card' + (it.remote ? ' vh-remote' : '');
    const th = document.createElement('div'); th.className = 'deck-thumb vh-thumb'; th.tabIndex = 0; th.setAttribute('role', 'link'); th.setAttribute('aria-label', it.name + (it.remote ? ' 받아서 열기' : ' 편집'));
    th.innerHTML = `${it.len ? `<span class="vh-dur">${fmtDur(it.len)}</span>` : ''}<div class="deck-hover">${it.remote || it.newer ? `<button class="btn ink" data-a="pull">${icon('cloud', 16)}받아서 열기</button>` : `<button class="btn ink" data-a="edit">${icon('edit', 16)}편집</button>`}</div>`;
    putPoster(th, it.p || {}, { remote: it.remote });
    const open = () => (it.remote || it.newer ? pullP(it.id) : openP(it.id));
    th.onclick = ev => { if (!ev.target.closest('button')) open(); }; th.onkeydown = ev => { if (ev.key === 'Enter' && ev.target === th) open(); };
    c.appendChild(th);
    const chip = it.remote ? `<span class="vh-chip">${esc(it.device || '다른 기기')}에서</span>` : it.newer ? `<span class="vh-chip">${esc(it.newer.device || '다른 기기')}에서 더 최근에 고침</span>` : unsent(it) ? '<span class="vh-chip warn">아직 안 올라감</span>' : '';
    const body = document.createElement('div'); body.className = 'deck-body';
    body.innerHTML = `<div class="deck-text"><div class="deck-title" title="${esc(it.name)}">${esc(it.name)}</div><div class="deck-meta">${metaText(it).split(' · ').map(s => `<span>${esc(s)}</span>`).join('')}${chip}</div></div>
      <div class="deck-actions">${it.remote || it.newer ? `<button class="btn sm" data-a="pull">${icon('cloud', 14)}받아서 열기</button>` : `<button class="btn sm" data-a="edit">${icon('edit', 14)}편집</button>`}</div>
      ${it.remote ? '' : `<button class="btn icon ghost kebab" data-more title="더 보기" aria-label="${esc(it.name)} 더 보기">${icon('dots')}</button>`}`;
    c.appendChild(body);
    c.addEventListener('click', ev => {
      const more = ev.target.closest('[data-more]'); if (more) { menu(more, it, c); return; }
      const b = ev.target.closest('button[data-a]'); if (!b || c.classList.contains('busy')) return;
      if (b.dataset.a === 'edit') openP(it.id); if (b.dataset.a === 'pull') pullP(it.id);
    });
    return c;
  }

  /* ---------- ⋯ 메뉴: 이름 바꾸기 · 복제 · 지우기 ---------- */
  let openMenu = null;
  const closeMenu = () => { if (openMenu) { openMenu.remove(); openMenu = null; } };
  document.addEventListener('pointerdown', ev => { if (openMenu && !openMenu.contains(ev.target)) closeMenu(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeMenu(); });
  addEventListener('resize', closeMenu);
  function menu(btn, it, host) {
    const same = openMenu && openMenu._btn === btn; closeMenu(); if (same) return;
    const m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu'); m._btn = btn;
    for (const x of [['rename', 'edit', '이름 바꾸기'], ['dup', 'copy', '복제'], null, ['del', 'trash', '지우기']]) {
      if (!x) { m.appendChild(document.createElement('hr')); continue; }
      const b = document.createElement('div'); b.className = 'mi' + (x[0] === 'del' ? ' danger' : ''); b.setAttribute('role', 'menuitem'); b.tabIndex = 0;
      b.innerHTML = `${icon(x[1], 16)}<span>${x[2]}</span>`; const run = () => { closeMenu(); act(x[0], it, host); };
      b.onclick = run; b.onkeydown = ev => { if (ev.key === 'Enter') run(); }; m.appendChild(b);
    }
    document.body.appendChild(m); openMenu = m;
    const r = btn.getBoundingClientRect(); m.style.position = 'fixed';
    m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top = (r.bottom + 6 + m.offsetHeight > innerHeight - 8 ? r.top - 6 - m.offsetHeight : r.bottom + 6) + 'px';
  }
  async function act(a, it, host) {
    const p = it.p; if (!p) return;
    if (a === 'rename') {
      const name = await askText('이름 바꾸기', p.name, '바꾸기'); if (!name || name === p.name) return;
      p.name = name; p.updated = Date.now(); await VE.idb.put('projects', p.id, p); S.soon(1500); toast('이름을 바꿨습니다', 1600); render(); return;
    }
    if (a === 'dup') {
      const q = JSON.parse(JSON.stringify(p)); q.id = uid(); q.name = p.name + ' 사본'; q.updated = Date.now();
      await VE.idb.put('projects', q.id, q); const pb = await VE.idb.get('cache', 'poster:' + p.id).catch(() => null); if (pb) await VE.idb.put('cache', 'poster:' + q.id, pb).catch(() => { });
      all.push(q); S.soon(1500); toast('복제했습니다', 1600); render(); return;
    }
    if (a === 'del') {
      if (!(await askConfirm(`'${p.name}' 을(를) 지울까요?`, `이 기기에서 프로젝트와 안에 넣은 파일을 지웁니다.${S.cfg().on ? ' 다른 기기의 목록에서도 지웁니다.' : ''} 되돌릴 수 없습니다.`, '지우기'))) return;
      host.classList.add('busy');
      try {
        if (S.cfg().on) await S.remove(p.id).catch(e => toast('다른 기기 목록에서 지우지 못했습니다: ' + VE.niceErr(e), 4000));
        const others = all.filter(x => x.id !== p.id).flatMap(x => (x.media || []).map(m => m.id));
        for (const m of p.media || []) if (!others.includes(m.id)) { await VE.idb.del('blobs', m.id).catch(() => { }); for (const k of [':peaks', ':track']) await VE.idb.del('cache', m.id + k).catch(() => { }); }
        await VE.idb.del('cache', 'poster:' + p.id).catch(() => { }); await VE.idb.del('projects', p.id);
        try { if (localStorage.getItem('ve:last') === p.id) localStorage.removeItem('ve:last'); } catch (e) { }
        all = all.filter(x => x.id !== p.id); delete remote[p.id]; toast('지웠습니다', 1600); render();
      } finally { host.classList.remove('busy'); }
    }
  }

  /* ---------- 만들기 ---------- */
  function newVideo() { go('new=1'); }
  async function importFiles(files) {
    if (!files.length) return;
    try { await VE.idb.put('cache', 'pending:import', Array.from(files)); go('new=1&import=1'); }
    catch (e) { toast('파일을 넘기지 못했습니다. 새 영상을 연 뒤 [파일 넣기] 로 넣어 주세요.', 4000); newVideo(); }
  }
  async function upload() { try { await S.pushAll(); } catch (e) { toast('올리지 못했습니다: ' + VE.niceErr(e), 4200); } all = await loadLocal(); render(); }

  /* ---------- 다른 기기와 연결 ---------- */
  function syncLabel() {
    const on = S.cfg().on, el = $('syncState');
    el.textContent = !on ? '이 기기만' : S.state === 'busy' ? (S.ratio != null ? Math.round(S.ratio * 100) + '%' : '맞추는 중') : S.state === 'error' ? '오류' : '연결됨';
    el.className = on ? (S.state === 'error' ? 'bad' : 'on') : '';
  }
  async function loadLocal() { return (await VE.idb.all('projects').catch(() => [])).map(x => x.value).filter(p => p && p.id); }
  async function loadRemote() {
    if (!S.cfg().on) return;
    try { remote = await S.list() || {}; remoteErr = ''; } catch (e) { remoteErr = VE.niceErr ? VE.niceErr(e) : e.message; }
    render();
  }

  /* ---------- 시작 ---------- */
  async function boot() {
    if (typeof Access !== 'undefined' && !Access.isAdmin) {
      $('vhGate').hidden = false; $('vhApp').hidden = true; fillIcons($('vhGate'));
      $('gateIn').onclick = async () => { if (await Access.prompt()) location.reload(); }; return;
    }
    $('roleChip').innerHTML = Access.chip ? Access.chip() : '';
    fillIcons(document);
    $('nav').onclick = ev => { const b = ev.target.closest('[data-filter]'); if (!b) return; filter = b.dataset.filter; render(); };
    $('q').oninput = render;
    addEventListener('keydown', ev => { if (ev.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { ev.preventDefault(); $('q').focus(); } });
    $('sort').value = pref.sort; $('sort').onchange = () => { pref.sort = $('sort').value; savePref(); render(); };
    document.querySelectorAll('.seg-b').forEach(b => { b.classList.toggle('on', b.dataset.view === pref.view); b.onclick = () => { pref.view = b.dataset.view; savePref(); document.querySelectorAll('.seg-b').forEach(x => x.classList.toggle('on', x === b)); render(); }; });
    $('btnNew').onclick = newVideo;
    $('btnImport').onclick = () => $('fileImport').click(); $('fileImport').onchange = ev => importFiles(ev.target.files);
    $('btnRec').onclick = () => go('new=1&tab=rec');
    $('btnSync').onclick = () => go('sync=1');
    /* 창에 파일을 끌어다 놓으면 새 영상으로 */
    let n = 0; const isFile = ev => ev.dataTransfer && [...ev.dataTransfer.types].includes('Files');
    addEventListener('dragenter', ev => { if (isFile(ev)) { n++; document.body.classList.add('dragover'); ev.preventDefault(); } });
    addEventListener('dragleave', ev => { if (isFile(ev) && --n <= 0) { n = 0; document.body.classList.remove('dragover'); } });
    addEventListener('dragover', ev => { if (isFile(ev)) ev.preventDefault(); });
    addEventListener('drop', ev => { if (!isFile(ev)) return; ev.preventDefault(); n = 0; document.body.classList.remove('dragover'); importFiles(ev.dataTransfer.files); });

    render();
    all = await loadLocal(); loaded = true; render();
    S.init(); syncLabel();
    let last = 0; VE.on('sync', () => { syncLabel(); const now = Date.now(); if (S.state !== 'busy' || now - last > 1500) { last = now; render(); } });
    if (S.cfg().on) { await loadRemote(); S.soon(1500); }
    /* 다 올리면 목록을 다시 (올라감 표시) */
    VE.on('sync', async () => { if (S.state === 'ok') { all = await loadLocal(); render(); } });
    /* 다른 창·앱에 갔다가 돌아오면 목록을 새로 (다른 기기에서 막 올린 영상이 보이게) */
    let lastRefresh = Date.now();
    VE.home = { refresh: async () => { lastRefresh = Date.now(); syncLabel(); all = await loadLocal(); render(); await loadRemote(); } };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - lastRefresh > 5000) VE.home.refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
