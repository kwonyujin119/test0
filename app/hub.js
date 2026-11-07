/* 허브: 교안 목록 */
'use strict';
(async function () {
  await API.init();
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const notice = document.getElementById('notice');
  const q = document.getElementById('q');
  let decks = [];
  const removed = new Map();   // 방금 지운(이름 바꾼) 교안: 목록이 잠깐 옛것을 돌려줘도 다시 보이지 않게
  const deckCache = new Map(); // 썸네일용 교안 내용 (목록을 다시 그릴 때 또 받지 않게)
  const bus = ('BroadcastChannel' in window) ? new BroadcastChannel('gyoan:hub') : null; // 열려 있는 편집기 창에 알림

  if (API.mode === 'local') {
    notice.style.display = 'block';
    notice.innerHTML = '서버 없이 열렸습니다. 지금은 교안이 <b>브라우저 안에만</b> 저장됩니다. 폴더의 <b>start.cmd</b> 를 실행해 열면 decks/ 폴더에 파일로 저장되고 Git 으로 관리할 수 있습니다.';
  }
  if (API.mode === 'github') {
    document.getElementById('btnGh').style.display = '';
    ghNotice();
  }

  /* ---------- GitHub 연결 (GitHub Pages 에서 열었을 때) ---------- */
  function ghNotice() {
    notice.style.display = 'block';
    const repo = `<b>${esc(GH.cfg.owner)}/${esc(GH.cfg.repo)}</b>`;
    if (GH.token) {
      notice.className = 'hub-notice ok';
      notice.innerHTML = `GitHub 저장소 ${repo} 에 바로 저장됩니다. 저장할 때마다 커밋이 하나씩 쌓이고, 내 PC 에서는 <code>git pull</code> 로 받으면 됩니다. <a href="#" id="ghOff">연결 해제</a>`;
      notice.querySelector('#ghOff').onclick = (ev) => { ev.preventDefault(); if (confirm('이 브라우저에 저장된 GitHub 토큰을 지울까요?')) { GH.clear(); location.reload(); } };
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
  function fail(what, e) { if (e.quiet) toast('GitHub 에 연결하면 저장소에 저장할 수 있습니다', 2600); else alert(what + e.message); }
  const emptyHtml = empty.innerHTML;
  document.getElementById('btnGh').onclick = ghDialog;

  let listOk = false;
  /* 새로 만들기·가져오기·복제 전에: 최신 목록을 확인 (목록을 못 읽은 채 같은 이름으로 덮어쓰지 않게) */
  async function freshList() { await refresh(); if (!listOk) alert('교안 목록을 확인할 수 없어 진행하지 않았습니다. 인터넷 연결을 확인한 뒤 다시 해 주세요.'); return listOk; }
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); }); // 뒤로 가기로 돌아오면 목록을 새로
  async function refresh() {
    try { decks = await API.list(); listOk = true; } catch (e) { listOk = false; toast('목록을 불러오지 못했습니다' + (e && e.message ? ' — ' + e.message : '') + (decks.length ? ' (이전 목록을 보여 줍니다)' : ''), 4000); } // 실패해도 보이던 목록은 그대로
    decks = decks.filter(d => !(removed.has(d.name) && Date.now() - removed.get(d.name) < 120000));
    render();
  }

  function render() {
    const kw = (q.value || '').trim().toLowerCase();
    const list = decks.filter(d => !kw || (d.title + ' ' + d.name).toLowerCase().includes(kw));
    grid.innerHTML = '';
    empty.style.display = list.length ? 'none' : 'block';
    empty.innerHTML = !list.length && decks.length ? `"${esc(kw)}" 이(가) 들어간 교안이 없습니다. 검색 칸을 비우면 전체가 보입니다.` : emptyHtml;
    for (const d of list) grid.appendChild(card(d));
    document.getElementById('sub').textContent = decks.length ? `교안 ${decks.length}개` : '교안을 모아두고, 편집하고, 바로 발표합니다.';
  }

  function card(d) {
    const c = document.createElement('div'); c.className = 'deck-card';
    const th = document.createElement('div'); th.className = 'deck-thumb';
    th.innerHTML = '<div class="play"><span>발표 시작</span></div>';
    th.title = '클릭하면 발표를 시작합니다';
    th.onclick = () => open('present.html?deck=' + encodeURIComponent(d.name), true);
    c.appendChild(th);
    const body = document.createElement('div'); body.className = 'deck-body';
    /* 카드 아래 줄: 슬라이드 수 · 저장한 때(이 기기의 시간) · 파일 이름 · 이 기기에 저장 안 한 작업본이 있으면 표시 */
    const meta = (state) => `<span>${state || (d.slides === '' ? '불러오는 중…' : `슬라이드 ${d.slides}장`)}</span><span title="마지막으로 저장한 때">${esc(d.modified || '')}</span><span class="muted">${esc(d.name)}.json</span>`
      + (Draft.has(d.name) ? '<span class="draft-chip" title="이 기기에 저장하지 않은 작업본이 남아 있습니다. [편집] 을 누르면 어느 쪽으로 열지 물어봅니다.">저장 안 한 작업본</span>' : '');
    body.innerHTML = `<div class="deck-title">${esc(d.title)}</div><div class="deck-meta">${meta()}</div>`;
    // 첫 슬라이드 썸네일
    const ck = d.name + '|' + (d.size || '') + '|' + (d.modified || '');
    (deckCache.has(ck) ? Promise.resolve(deckCache.get(ck)) : API.load(d.name).then(deck => { deckCache.set(ck, deck); return deck; })).then(deck => {
      if (d.partial) {
        d.title = deck.title || d.name; d.slides = (deck.slides || []).length;
        d.modified = fmtWhen(deck.modified);
        body.querySelector('.deck-title').textContent = d.title;
        body.querySelector('.deck-meta').innerHTML = meta();
      }
      if (!deck.slides || !deck.slides.length) return;
      const s = renderSlide(deck.slides[0], deck, { mode: 'thumb' });
      th.insertBefore(s, th.firstChild);
      const fit = () => fitSlide(th, s);
      fit(); new ResizeObserver(fit).observe(th);
    }).catch(() => { if (d.partial) body.querySelector('.deck-meta').innerHTML = meta('⚠ 내용을 읽지 못했습니다'); }); // 목록에는 있는데 열 수 없는 교안 (연결 끊김 · 파일 손상)
    const act = document.createElement('div'); act.className = 'deck-actions';
    act.innerHTML = `<button class="btn sm primary" data-a="present">${icon('play', 14)}발표</button>
      <button class="btn sm" data-a="edit">${icon('edit', 14)}편집</button>
      <span class="spacer"></span>
      <button class="btn sm ghost" data-a="dup" title="복제">복제</button>
      <button class="btn sm ghost" data-a="rename" title="이름 바꾸기">이름</button>
      <button class="btn sm ghost danger" data-a="del" title="삭제">삭제</button>`;
    act.onclick = async (ev) => {
      const btn = ev.target.closest('button[data-a]'); if (!btn || c.classList.contains('busy')) return;
      const a = btn.dataset.a;
      /* 일하는 동안: 카드를 흐리게, 단추는 "…중"으로 (GitHub 은 몇 초 걸림 · 두 번 누름 방지) */
      const busy = (label) => {
        c.classList.add('busy'); act.querySelectorAll('button').forEach(b => b.disabled = true);
        const old = btn.textContent; btn.textContent = label;
        return () => { c.classList.remove('busy'); act.querySelectorAll('button').forEach(b => b.disabled = false); btn.textContent = old; };
      };
      if (a === 'present') open('present.html?deck=' + encodeURIComponent(d.name), true);
      if (a === 'edit') open('editor.html?deck=' + encodeURIComponent(d.name));
      if (a === 'del') {
        const how = API.mode === 'server' ? '(decks/.trash 폴더로 이동합니다)' : API.mode === 'github' ? '(저장소에서 지웁니다. Git 기록에는 남습니다)' : '';
        if (!confirm(`"${d.title}" 교안을 삭제할까요?\n${how}`)) return;
        const done = busy('삭제 중…');
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
        const done = busy('복제 중…');
        if (!(await freshList())) { done(); return; } // 최신 목록에서 겹치지 않는 이름을 고름
        try {
          const deck = await API.load(d.name); const name = uniqueName(d.name + ' 사본');
          deck.title = (deck.title || d.name) + ' 사본'; removed.delete(name); Draft.forget(name);
          await ghTry(() => API.save(name, deck)); toast('복제했습니다');
        } catch (e) { done(); fail('복제 실패: ', e); return; }
        refresh();
      }
      if (a === 'rename') {
        const nn = prompt('새 파일 이름 (목록 아래에 작게 보이는 이름입니다 · 교안 제목은 편집기 맨 위에서 바꿉니다)', d.name); if (!nn || nn === d.name) return;
        const safe = sanitize(nn); if (!safe) return;
        const done = busy('바꾸는 중…');
        if (!(await freshList())) { done(); return; } // 최신 목록으로 확인 (다른 기기에서 만든 같은 이름의 교안을 덮어쓰지 않게)
        if (decks.some(x => x.name === safe)) { done(); alert('같은 이름의 교안이 있습니다'); return; }
        if (!decks.some(x => x.name === d.name)) { done(); alert('이 교안은 이미 지워졌거나 이름이 바뀌었습니다. 목록을 새로 고쳤습니다.'); return; }
        try { removed.delete(safe); await ghTry(() => API.rename(d.name, safe)); toast('이름을 바꿨습니다'); }
        catch (e) { done(); fail('이름 바꾸기 실패: ', e); return; }
        Draft.forget(safe); Draft.move(d.name, safe); // 이 기기에 남은 작업본도 새 이름으로
        removed.set(d.name, Date.now());
        if (bus) bus.postMessage({ type: 'renamed', name: d.name, to: safe });
        refresh();
      }
    };
    body.appendChild(act); c.appendChild(body);
    return c;
  }

  function open(url, newTab) { if (newTab) window.open(url, '_blank'); else location.href = url; }
  function sanitize(n) { return n.replace(/[\\/:*?"<>|]/g, '_').trim(); }
  function uniqueName(base) { let n = sanitize(base), i = 2; while (decks.some(d => d.name === n)) n = sanitize(base) + ' ' + (i++); return n; }

  /* 위쪽 단추: 일하는 동안 "…중"으로 바꾸고 잠금 */
  function hold(id, label) { const b = document.getElementById(id); const old = b.textContent; b.disabled = true; b.textContent = label; return () => { b.disabled = false; b.textContent = old; }; }
  document.getElementById('btnNew').onclick = async () => {
    const title = (prompt('새 교안 제목', '새 교안') || '').trim(); if (!title) return;
    const done = hold('btnNew', '만드는 중…');
    if (!(await freshList())) { done(); return; }
    const name = uniqueName(title); if (!name) { done(); alert('제목에 쓸 수 있는 글자가 없습니다'); return; }
    removed.delete(name); Draft.forget(name);
    const deck = newDeck(title);
    try { await ghTry(() => API.save(name, deck)); } catch (e) { done(); fail('만들기 실패: ', e); return; }
    location.href = 'editor.html?deck=' + encodeURIComponent(name);
  };
  document.getElementById('btnImport').onclick = () => document.getElementById('fileImport').click();
  document.getElementById('fileImport').onchange = async (ev) => { const f = ev.target.files[0]; ev.target.value = ''; if (f) await importFile(f); };
  const isPpt = (f) => !!f && /\.(pptx|ppsx|pptm|ppsm|potx|ppt|pps|pot)$/i.test(f.name || '');
  async function importFile(f) {
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
    if (/\.(ppt|pps|pot)$/i.test(f.name || '')) { alert(`"${f.name}" 은 옛 형식(.ppt) 파일이라 읽지 못합니다.\nPowerPoint 에서 [파일 → 다른 이름으로 저장] 으로 "PowerPoint 프레젠테이션(.pptx)" 으로 저장한 뒤 다시 열어 주세요.`); return; }
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
    } catch (e) { toast('PPT 를 가져오지 못했습니다'); if (!e.quiet) alert('PPT 를 교안으로 바꾸지 못했습니다: ' + e.message); else fail('', e); }
    finally { importing = false; done(); }
  }
  // 이 화면에 파일 끌어다 놓기 (.pptx → 교안, .json → 교안 파일 가져오기)
  const dropOk = (dt) => dt && Array.from(dt.types || []).includes('Files');
  document.addEventListener('dragover', (ev) => { if (dropOk(ev.dataTransfer)) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; document.body.classList.add('dragover'); } });
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
    try { await importFile(await p.files[0].getFile()); } catch (e) { alert('파일을 열 수 없습니다: ' + e.message); }
  });
  q.oninput = render;
  refresh();
})();
