/* 허브: 교안 목록 */
'use strict';
(async function () {
  await API.init();
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const notice = document.getElementById('notice');
  const q = document.getElementById('q');
  let decks = [];

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

  async function refresh() {
    try { decks = await API.list(); } catch (e) { decks = []; toast('목록을 불러오지 못했습니다'); }
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
    th.innerHTML = '<div class="play"><span>▶ 발표 시작</span></div>';
    th.title = '클릭하면 발표를 시작합니다';
    th.onclick = () => open('present.html?deck=' + encodeURIComponent(d.name), true);
    c.appendChild(th);
    const body = document.createElement('div'); body.className = 'deck-body';
    body.innerHTML = `<div class="deck-title">${esc(d.title)}</div>
      <div class="deck-meta"><span>슬라이드 ${d.slides}장</span><span>${esc(d.modified || '')}</span><span class="muted">${esc(d.name)}.json</span></div>`;
    // 첫 슬라이드 썸네일
    API.load(d.name).then(deck => {
      if (d.partial) {
        d.title = deck.title || d.name; d.slides = (deck.slides || []).length;
        d.modified = deck.modified ? deck.modified.slice(0, 16).replace('T', ' ') : '';
        body.querySelector('.deck-title').textContent = d.title;
        body.querySelector('.deck-meta').innerHTML = `<span>슬라이드 ${d.slides}장</span><span>${esc(d.modified)}</span><span class="muted">${esc(d.name)}.json</span>`;
      }
      if (!deck.slides || !deck.slides.length) return;
      const s = renderSlide(deck.slides[0], deck, { mode: 'thumb' });
      th.insertBefore(s, th.firstChild);
      const fit = () => fitSlide(th, s);
      fit(); new ResizeObserver(fit).observe(th);
    }).catch(() => { });
    const act = document.createElement('div'); act.className = 'deck-actions';
    act.innerHTML = `<button class="btn sm primary" data-a="present">▶ 발표</button>
      <button class="btn sm" data-a="edit">✎ 편집</button>
      <span class="spacer"></span>
      <button class="btn sm ghost" data-a="dup" title="복제">복제</button>
      <button class="btn sm ghost" data-a="rename" title="이름 바꾸기">이름</button>
      <button class="btn sm ghost danger" data-a="del" title="삭제">삭제</button>`;
    act.onclick = async (ev) => {
      const a = ev.target.dataset.a; if (!a) return;
      if (a === 'present') open('present.html?deck=' + encodeURIComponent(d.name), true);
      if (a === 'edit') open('editor.html?deck=' + encodeURIComponent(d.name));
      if (a === 'del') {
        const how = API.mode === 'server' ? '(decks/.trash 폴더로 이동합니다)' : API.mode === 'github' ? '(저장소에서 지웁니다. Git 기록에는 남습니다)' : '';
        if (!confirm(`"${d.title}" 교안을 삭제할까요?\n${how}`)) return;
        try { await ghTry(() => API.remove(d.name)); toast('삭제했습니다'); } catch (e) { fail('삭제 실패: ', e); }
        refresh();
      }
      if (a === 'dup') {
        const deck = await API.load(d.name); const name = uniqueName(d.name + ' 사본');
        deck.title = deck.title + ' 사본';
        try { await ghTry(() => API.save(name, deck)); toast('복제했습니다'); } catch (e) { fail('복제 실패: ', e); }
        refresh();
      }
      if (a === 'rename') {
        const nn = prompt('새 파일 이름 (목록 아래에 작게 보이는 이름입니다 · 교안 제목은 편집기 맨 위에서 바꿉니다)', d.name); if (!nn || nn === d.name) return;
        const safe = sanitize(nn); if (decks.some(x => x.name === safe)) { alert('같은 이름의 교안이 있습니다'); return; }
        try { const deck = await API.load(d.name); await ghTry(() => API.save(safe, deck)); await ghTry(() => API.remove(d.name)); } catch (e) { fail('이름 바꾸기 실패: ', e); }
        refresh();
      }
    };
    body.appendChild(act); c.appendChild(body);
    return c;
  }

  function open(url, newTab) { if (newTab) window.open(url, '_blank'); else location.href = url; }
  function sanitize(n) { return n.replace(/[\\/:*?"<>|]/g, '_').trim(); }
  function uniqueName(base) { let n = sanitize(base), i = 2; while (decks.some(d => d.name === n)) n = sanitize(base) + ' ' + (i++); return n; }

  document.getElementById('btnNew').onclick = async () => {
    const title = prompt('새 교안 제목', '새 교안'); if (!title) return;
    const name = uniqueName(title);
    const deck = newDeck(title);
    try { await ghTry(() => API.save(name, deck)); } catch (e) { fail('만들기 실패: ', e); return; }
    location.href = 'editor.html?deck=' + encodeURIComponent(name);
  };
  document.getElementById('btnImport').onclick = () => document.getElementById('fileImport').click();
  document.getElementById('fileImport').onchange = async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    try {
      const deck = JSON.parse(await f.text());
      if (!deck.slides) throw new Error('교안 형식이 아닙니다');
      const name = uniqueName(f.name.replace(/\.json$/i, ''));
      await ghTry(() => API.save(name, deck)); toast('가져왔습니다'); refresh();
    } catch (e) { fail('가져오기 실패: ', e); }
    ev.target.value = '';
  };
  q.oninput = render;
  refresh();
})();
