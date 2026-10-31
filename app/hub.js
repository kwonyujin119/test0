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
  function ghDialog() {
    const c = GH.cfg || { owner: '', repo: '', branch: 'main', token: '' };
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="min-width:520px;max-width:600px">
      <h3>GitHub 저장소에 바로 저장</h3>
      <p class="muted" style="margin:0 0 12px;font-size:13px;line-height:1.5">이 사이트에서 편집한 교안과 이미지를 저장소에 직접 커밋합니다.
      토큰은 <b>이 브라우저에만</b> 저장되며 어디에도 전송되지 않습니다 (GitHub 에만 보냅니다).</p>
      <div class="row"><label style="width:70px">저장소</label><input type="text" id="ghOwner" placeholder="사용자" value="${esc(c.owner)}" style="flex:1"> <span>/</span> <input type="text" id="ghRepo" placeholder="저장소" value="${esc(c.repo)}" style="flex:1"></div>
      <div class="row"><label style="width:70px">브랜치</label><input type="text" id="ghBranch" value="${esc(c.branch || 'main')}" style="width:140px"></div>
      <div class="row"><label style="width:70px">토큰</label><input type="password" id="ghToken" placeholder="github_pat_… 또는 ghp_…" value="${esc(c.token || '')}" style="flex:1" autocomplete="off"></div>
      <div class="gh-howto">
        <b>토큰 만드는 법</b> (한 번만)
        <ol>
          <li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a> 를 엽니다.</li>
          <li>Token name 에 <code>gyoan</code>, Expiration 은 넉넉히(예: 1년).</li>
          <li><b>Repository access</b> → <i>Only select repositories</i> → <code>${esc(c.repo || 'test0')}</code> 선택.</li>
          <li><b>Permissions</b> → Repository permissions → <b>Contents</b> → <i>Read and write</i>.</li>
          <li><i>Generate token</i> 을 누르고 나온 문자열을 위 칸에 붙여넣습니다.</li>
        </ol>
      </div>
      <div class="actions">
        ${c.token ? '<button class="btn ghost danger" id="ghClear">연결 해제</button>' : ''}
        <span class="spacer" style="flex:1"></span>
        <button class="btn" id="ghCancel">취소</button>
        <button class="btn primary" id="ghOk">연결 확인</button>
      </div></div>`;
    document.body.appendChild(bg);
    const $ = (id) => bg.querySelector('#' + id);
    const close = () => bg.remove();
    bg.onclick = (ev) => { if (ev.target === bg) close(); };
    $('ghCancel').onclick = close;
    if ($('ghClear')) $('ghClear').onclick = () => { GH.clear(); close(); location.reload(); };
    $('ghOk').onclick = async () => {
      const cfg = { owner: $('ghOwner').value.trim(), repo: $('ghRepo').value.trim(), branch: $('ghBranch').value.trim() || 'main', token: $('ghToken').value.trim() };
      if (!cfg.owner || !cfg.repo) { alert('저장소 이름을 입력하세요'); return; }
      if (!cfg.token) { alert('토큰을 입력하세요'); return; }
      $('ghOk').disabled = true; $('ghOk').textContent = '확인 중…';
      const prev = GH.cfg; GH.cfg = cfg;
      try {
        const r = await GH.check();
        if (!r.push) throw new Error('이 토큰으로는 저장소에 쓸 수 없습니다. 토큰 권한에서 Contents → Read and write 를 확인하세요.');
        GH.save(cfg); toast('GitHub 에 연결했습니다'); close(); location.reload();
      } catch (e) { GH.cfg = prev; alert('연결 실패: ' + e.message); $('ghOk').disabled = false; $('ghOk').textContent = '연결 확인'; }
    };
    setTimeout(() => $('ghToken').focus(), 50);
  }
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
        try { await API.remove(d.name); toast('삭제했습니다'); } catch (e) { alert('삭제 실패: ' + e.message); }
        refresh();
      }
      if (a === 'dup') {
        const deck = await API.load(d.name); const name = uniqueName(d.name + ' 사본');
        deck.title = deck.title + ' 사본';
        try { await API.save(name, deck); toast('복제했습니다'); } catch (e) { alert('복제 실패: ' + e.message); }
        refresh();
      }
      if (a === 'rename') {
        const nn = prompt('새 파일 이름 (decks/ 폴더의 파일명)', d.name); if (!nn || nn === d.name) return;
        const safe = sanitize(nn); if (decks.some(x => x.name === safe)) { alert('같은 이름의 교안이 있습니다'); return; }
        try { const deck = await API.load(d.name); await API.save(safe, deck); await API.remove(d.name); } catch (e) { alert('이름 바꾸기 실패: ' + e.message); }
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
    try { await API.save(name, deck); } catch (e) { alert('만들기 실패: ' + e.message); return; }
    location.href = 'editor.html?deck=' + encodeURIComponent(name);
  };
  document.getElementById('btnImport').onclick = () => document.getElementById('fileImport').click();
  document.getElementById('fileImport').onchange = async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    try {
      const deck = JSON.parse(await f.text());
      if (!deck.slides) throw new Error('교안 형식이 아닙니다');
      const name = uniqueName(f.name.replace(/\.json$/i, ''));
      await API.save(name, deck); toast('가져왔습니다'); refresh();
    } catch (e) { alert('가져오기 실패: ' + e.message); }
    ev.target.value = '';
  };
  q.oninput = render;
  refresh();
})();
