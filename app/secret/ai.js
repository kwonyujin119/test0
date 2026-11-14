/* SECRET AI 탭 — ① 날짜별 AI 공부(30일 과정이 하루에 하나씩 열리고 누적 + 키가 있으면 매일 "AI 소식") ② 용어 사전
   · 과정: ai-course.js (start 날짜가 1일차) · 용어: ai-terms.js
   · 그날의 "AI 소식"은 Study 와 같은 study/YYYY-MM-DD.json 의 ai 칸 (study-daily.yml, ANTHROPIC_API_KEY 가 있을 때만)
   · 진행 · 내 답은 이 기기에만 (sec:aiStudy) */
'use strict';
window.SEC_AI = (() => {
  const C = window.SEC_AI_COURSE, TERMS = window.SEC_AI_TERMS;
  const K = 'sec:aiStudy';
  let H = null;
  const esc = s => H.esc(String(s == null ? '' : s));
  const st = () => Object.assign({ done: {}, steps: {}, ans: {} }, H.LS.get(K, {}));
  const save = s => H.LS.set(K, s);
  const kstDate = () => new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10);
  const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
  const dayIdx = d => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(C.start + 'T00:00:00Z')) / 864e5);
  const md = d => { const x = new Date(d + 'T00:00:00Z'); return `${x.getUTCMonth() + 1}월 ${x.getUTCDate()}일 (${'일월화수목금토'[x.getUTCDay()]})`; };

  /* ---------- 날짜별 목록: 열린 과정 + 그날의 AI 소식 ---------- */
  const news = {}; let newsIdx = null, newsAt = 0;
  async function loadNews() {
    if (newsIdx && Date.now() - newsAt < 10 * 60000) return;
    const j = await H.brief('study/index.json').catch(() => null); newsIdx = (j && j.dates) || []; newsAt = Date.now();
    await Promise.all(newsIdx.slice(0, 14).filter(d => !(d in news)).map(async d => { const r = await H.brief(`study/${d}.json`).catch(() => null); news[d] = r && r.ai && r.ai.title ? r.ai : null; }));
  }
  function entries() {
    const today = kstDate(), n = Math.min(C.lessons.length, dayIdx(today) + 1), out = [];
    for (let i = 0; i < n; i++) out.push({ id: 'c' + (i + 1), date: addDays(C.start, i), day: i + 1, l: C.lessons[i] });
    for (const [d, l] of Object.entries(news)) if (l && d <= today) out.push({ id: 'n' + d, date: d, news: true, l });
    return out.sort((a, b) => b.date.localeCompare(a.date) || (a.news ? -1 : 1));
  }
  const ui = { sel: '' };
  async function renderDay(el) {
    if (!newsIdx) el.innerHTML = '<div class="sc-bmsg">불러오는 중…</div>';
    try { await loadNews(); } catch (e) { }
    const E = entries(), s = st();
    if (!E.length) { el.innerHTML = `<div class="sc-bmsg">${md(C.start)}부터 하루에 하나씩 열립니다.</div>`; return; }
    if (!ui.sel || !E.some(e => e.id === ui.sel)) ui.sel = (E.find(e => !e.news && !s.done[e.id]) || E[0]).id;
    const e = E.find(x => x.id === ui.sel), l = e.l, doneN = E.filter(x => !x.news && s.done[x.id]).length, openN = E.filter(x => !x.news).length;
    const left = C.lessons.length - openN;
    el.innerHTML = `<div class="ai-top"><div class="ai-prog"><b>${doneN} / ${C.lessons.length}</b><span>과정 진행 · 열린 과 ${openN}${left ? ` · 남은 과 ${left}(하루에 하나씩)` : ' · 과정을 모두 열었습니다'}</span><div class="bar"><i style="width:${doneN / C.lessons.length * 100}%"></i></div></div></div>
      <div class="ai-list" role="list">${E.map(x => `<button type="button" role="listitem" class="${x.id === e.id ? 'on' : ''}${s.done[x.id] ? ' done' : ''}${x.news ? ' news' : ''}" data-sel="${x.id}"><span>${x.news ? '오늘의 AI 소식' : x.day + '일차'} · ${esc(md(x.date))}</span><b>${s.done[x.id] ? '✓ ' : ''}${esc(x.l.t || x.l.title)}</b></button>`).join('')}</div>
      <article class="ai-lesson">${e.news ? newsCard(e, s) : lessonCard(e, s)}</article>`;
    el.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { ui.sel = b.dataset.sel; renderDay(el); el.querySelector('.ai-lesson').scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    el.querySelectorAll('[data-term]').forEach(b => b.onclick = () => { tui.q = b.dataset.term; tui.cat = ''; H.show('aiterm'); });
    el.querySelectorAll('[data-step]').forEach(c => c.onchange = () => { const s2 = st(); const k = e.id + ':' + c.dataset.step; if (c.checked) s2.steps[k] = 1; else delete s2.steps[k]; save(s2); });
    const ta = el.querySelector('[data-ans]'); if (ta) ta.oninput = () => { const s2 = st(); s2.ans[e.id] = ta.value; save(s2); };
    const cp = el.querySelector('[data-copy]'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(l.prompt); H.toast('실습 질문을 복사했습니다', 1600); } catch (er) { H.toast('복사하지 못했습니다 — 길게 눌러 복사하세요', 2200); } };
    const ask = el.querySelector('[data-ask]'); if (ask) ask.onclick = () => H.ask(l.prompt);
    const dn = el.querySelector('[data-done]'); if (dn) dn.onclick = () => { const s2 = st(); if (s2.done[e.id]) delete s2.done[e.id]; else s2.done[e.id] = Date.now(); save(s2); if (s2.done[e.id]) { const nx = entries().filter(x => !x.news && !s2.done[x.id]).pop(); H.toast(nx ? '좋습니다. 다음 과도 열려 있습니다' : '열린 과를 모두 끝냈습니다. 내일 새 과가 열립니다', 2400); } renderDay(el); };
  }
  const termChips = arr => (arr || []).length ? `<div class="ai-terms-in"><span>관련 용어</span>${arr.map(t => `<button type="button" data-term="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : '';
  function lessonCard(e, s) {
    const l = e.l;
    return `<header><span class="tag">${e.day}일차 · ${esc(md(e.date))}</span><h2>${esc(l.t)}</h2><p class="goal">오늘의 목표 — ${esc(l.goal)}</p></header>
      <section><h3>설명</h3><p>${esc(l.body)}</p></section>
      <section><h3>실습</h3><ol class="ai-steps">${l.steps.map((x, i) => `<li><label><input type="checkbox" data-step="${i}"${s.steps[e.id + ':' + i] ? ' checked' : ''}> ${esc(x)}</label></li>`).join('')}</ol>
        <div class="ai-prompt"><div class="lb">Claude 에게 바로 해 볼 질문</div><pre>${esc(l.prompt)}</pre><div class="row"><button type="button" class="btn sm" data-copy>${H.icon('copy', 14)}복사</button><button type="button" class="btn sm ink" data-ask>${H.icon('sparkle', 14)}AI 어시스턴트로 해 보기</button></div><p class="sc-fine" style="text-align:left;margin:4px 0 0">[AI 어시스턴트로 해 보기]는 Stock → AI 어시스턴트로 넘어가 등록한 AI 로 보냅니다(토큰 사용).</p></div></section>
      ${termChips(l.terms)}
      <section><h3>스스로 점검</h3><p class="q">${esc(l.q)}</p><textarea data-ans rows="3" placeholder="내 답을 적어 두세요 (이 기기에 저장)">${esc(s.ans[e.id] || '')}</textarea></section>
      <div class="ai-done"><button type="button" class="btn ${s.done[e.id] ? '' : 'ink'}" data-done>${s.done[e.id] ? '✓ 끝냄 (취소)' : '오늘 공부 끝냄'}</button></div>`;
  }
  function newsCard(e, s) {
    const l = e.l;
    return `<header><span class="tag">오늘의 AI 소식 · ${esc(md(e.date))}</span><h2>${esc(l.title)}</h2>${l.sub ? `<p class="goal">${esc(l.sub)}</p>` : ''}</header>
      <section><h3>무슨 일이 있었나</h3><p>${esc(l.body)}</p></section>
      ${(l.points || []).length ? `<section><h3>핵심</h3><ul class="ai-steps">${l.points.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
      ${(l.sources || []).length ? `<p class="ai-src">출처: ${l.sources.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>` : ''}
      ${l.prompt ? `<div class="ai-prompt"><div class="lb">더 알아보기 — Claude 에게</div><pre>${esc(l.prompt)}</pre><div class="row"><button type="button" class="btn sm" data-copy>${H.icon('copy', 14)}복사</button><button type="button" class="btn sm ink" data-ask>${H.icon('sparkle', 14)}AI 어시스턴트로 해 보기</button></div></div>` : ''}
      ${termChips(l.terms)}
      ${l.q ? `<section><h3>스스로 점검</h3><p class="q">${esc(l.q)}</p><textarea data-ans rows="3" placeholder="내 생각을 적어 두세요 (이 기기에 저장)">${esc(s.ans[e.id] || '')}</textarea></section>` : ''}
      <p class="sc-fine" style="text-align:left">AI 가 웹 검색으로 정리한 글입니다. 숫자 · 날짜는 출처에서 확인하세요.</p>
      <div class="ai-done"><button type="button" class="btn ${s.done[e.id] ? '' : 'ink'}" data-done>${s.done[e.id] ? '✓ 읽음 (취소)' : '읽음'}</button></div>`;
  }

  /* ---------- 용어 사전 ---------- */
  const tui = { q: '', cat: '' };
  const CATS = [...new Set(TERMS.map(t => t[2]))];
  function renderTerms(el) {
    el.innerHTML = `<div class="ai-tsearch"><input type="search" data-tq placeholder="용어 · 영어 · 설명으로 찾기 (예: 토큰, RAG, 환각)" value="${esc(tui.q)}" aria-label="용어 찾기"></div>
      <div class="ai-cats" role="tablist"><button type="button" data-cat="" class="${tui.cat ? '' : 'on'}">전체 <em>${TERMS.length}</em></button>${CATS.map(c => `<button type="button" data-cat="${esc(c)}" class="${tui.cat === c ? 'on' : ''}">${esc(c)} <em>${TERMS.filter(t => t[2] === c).length}</em></button>`).join('')}</div>
      <p class="sc-fine ai-cnt" style="text-align:left"></p><dl class="ai-dict"></dl>`;
    const box = el.querySelector('.ai-dict'), cnt = el.querySelector('.ai-cnt'), inp = el.querySelector('[data-tq]');
    const paint = () => {
      const q = tui.q.trim().toLowerCase(), opened = Math.min(C.lessons.length, dayIdx(kstDate()) + 1);
      let L = TERMS.filter(t => (!tui.cat || t[2] === tui.cat) && (!q || (t[0] + ' ' + t[1] + ' ' + t[3]).toLowerCase().includes(q)));
      if (q) L = L.sort((a, b) => (b[0].toLowerCase() === q) - (a[0].toLowerCase() === q) || (b[0].toLowerCase().includes(q)) - (a[0].toLowerCase().includes(q)));
      const hl = s => { let h = esc(s); if (q) h = h.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); return h; };
      cnt.textContent = `${L.length}개${q ? ` · "${tui.q}"` : ''}${tui.cat ? ` · ${tui.cat}` : ''}`;
      box.innerHTML = L.map(t => `<div class="ai-term"><dt>${hl(t[0])}<small>${hl(t[1])}</small><span class="cat">${esc(t[2])}</span></dt><dd>${hl(t[3])}${(C.lessons.map((l, i) => l.terms.includes(t[0]) ? i + 1 : 0).filter(Boolean)).slice(0, 4).map(n => n <= opened ? `<button type="button" class="ai-go" data-go="c${n}">${n}일차에서 배움</button>` : `<span class="ai-go off">${n}일차에 배움 (예정)</span>`).join('')}</dd></div>`).join('') || '<p class="sc-fine">찾는 용어가 없습니다.</p>';
      box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { ui.sel = b.dataset.go; H.show('aiday'); });
    };
    let tm = 0; inp.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { tui.q = inp.value; paint(); }, 120); };
    el.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { tui.cat = b.dataset.cat; el.querySelectorAll('[data-cat]').forEach(x => x.classList.toggle('on', x === b)); paint(); });
    paint();
    if (!tui.q) setTimeout(() => inp.focus(), 30);
  }

  return {
    init(h) { H = h; },
    render(view, el) { if (view === 'aiday') return renderDay(el); renderTerms(el); },
  };
})();
