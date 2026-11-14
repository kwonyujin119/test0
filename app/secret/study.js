/* SECRET Study — 영어(고등학생 · 30분: 단어 · 문법 · 독해 · 작문) · 일본어 · 중국어(어린이)
   · 기본 레슨은 study-data.js. [새로 만들기]는 등록한 AI(사용자 키)가 같은 형식의 JSON 으로 만들고 이 기기에 저장(sec:studyAI, 종류별 20개)
   · 진행 · 작문은 이 기기에만(sec:study). 읽어 주기는 브라우저 음성 합성(speechSynthesis) — 기기에 그 언어 음성이 없으면 안내 */
'use strict';
window.SEC_STUDY = (() => {
  const D = window.SEC_STUDY_DATA;
  const K = 'sec:study', KAI = 'sec:studyAI';
  let H = null; // { esc, icon, toast, LS, ai, aiName }
  const st = () => Object.assign({ done: {}, write: {}, pick: {}, quiz: {} }, H.LS.get(K, {}));
  const save = s => H.LS.set(K, s);
  const aiStore = () => Object.assign({ en: [], ja: [], zh: [] }, H.LS.get(KAI, {}));
  /* ---------- 날짜별 레슨 (briefing 브랜치 study/ — study-daily.yml 이 매일 6시 전에 만듦) ----------
     · 6시 전에는 어제 판, 6시부터 오늘 판 (모닝 브리핑처럼). 지난 날짜도 골라 볼 수 있음
     · {"ref": id} 는 앱에 든 기본 레슨을 가리킴 (토큰을 쓰지 않은 날) */
  const dui = { idx: null, at: 0, cache: {}, date: '', day: null };
  const effToday = () => { const k = new Date(Date.now() + 9 * 36e5); return new Date(k.getTime() - (k.getUTCHours() < 6 ? 864e5 : 0)).toISOString().slice(0, 10); };
  async function ensureDay(force) {
    if (force || !dui.idx || Date.now() - dui.at > 10 * 60000) {
      const j = await H.brief('study/index.json').catch(() => null), lim = effToday();
      dui.idx = ((j && j.dates) || []).filter(d => d <= lim).sort().reverse(); dui.at = Date.now();
    }
    if (!dui.date || !dui.idx.includes(dui.date)) dui.date = dui.idx[0] || '';
    if (dui.date && !dui.cache[dui.date]) dui.cache[dui.date] = await H.brief(`study/${dui.date}.json`).catch(() => null);
    dui.day = dui.date ? dui.cache[dui.date] : null;
  }
  const resolve = (x, lang) => !x ? null : x.ref ? D[lang].find(l => l.id === x.ref) || null : x;
  function dayLessons(lang) {
    const d = dui.day; if (!d) return [];
    const arr = lang === 'en' ? (d.en || []).map(x => resolve(x, 'en')) : [resolve(d[lang], lang)];
    return arr.filter(Boolean).map(l => Object.assign({}, l, { today: d.date }));
  }
  const lessons = lang => { const day = dayLessons(lang), ids = new Set(day.map(l => l.id)); return day.concat(aiStore()[lang].concat(D[lang]).filter(l => !ids.has(l.id))); };
  const dayBar = () => {
    const d = dui.day, md = s => `${+s.slice(5, 7)}월 ${+s.slice(8)}일`;
    if (!dui.idx || !dui.idx.length) return `<div class="st-day"><span>📅 날짜별 레슨이 아직 없습니다 — 매일 아침 6시 전에 만들어집니다. 그 전까지는 기본 레슨으로 공부하세요.</span></div>`;
    return `<div class="st-day"><label>📅 <select data-day aria-label="레슨 날짜">${dui.idx.map(x => `<option value="${x}"${x === dui.date ? ' selected' : ''}>${md(x)}${x === effToday() ? ' · 오늘' : ''}</option>`).join('')}</select></label>
      <span>${d ? (d.mode === 'ai' ? 'AI 가 새로 쓴 레슨' : '기본 레슨을 날짜로 돌린 날 (토큰 안 씀)') + (d.errors && d.errors.length ? ` · 일부는 기본 레슨으로 대신함` : '') : '이 날짜의 레슨을 불러오지 못했습니다'} · 매일 아침 6시에 새 판</span></div>`;
  };
  function bindDay(el, rerender) { const s = el.querySelector('[data-day]'); if (s) s.onchange = async () => { dui.date = s.value; ui.en = ''; kid.ja = ''; kid.zh = ''; await ensureDay(); rerender(); }; }
  const esc = s => H.esc(String(s == null ? '' : s));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- 읽어 주기 ---------- */
  const LANG = { en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' };
  function speak(text, lang, rate) {
    if (!('speechSynthesis' in window)) { H.toast('이 브라우저는 읽어 주기를 지원하지 않습니다', 2200); return; }
    const u = new SpeechSynthesisUtterance(String(text)); u.lang = LANG[lang] || lang; u.rate = rate || (lang === 'en' ? .95 : .8);
    const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.replace('_', '-').toLowerCase().startsWith(u.lang.toLowerCase().slice(0, 2)));
    if (v) u.voice = v; else if (speechSynthesis.getVoices().length) H.toast('이 기기에 그 언어 음성이 없어 다른 음성으로 읽습니다', 2200);
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  const say = (t, lang) => `<button type="button" class="st-say" data-say="${esc(t)}" data-lang="${lang}" aria-label="읽어 주기" title="읽어 주기">🔊</button>`;
  function bindSay(el) { el.querySelectorAll('[data-say]').forEach(b => b.onclick = e => { e.stopPropagation(); speak(b.dataset.say, b.dataset.lang); }); }

  /* ---------- 객관식 ---------- */
  function mcq(qs, key) {
    return `<ol class="st-mcq">${qs.map((q, i) => `<li data-q="${key}-${i}" data-a="${q[2]}"><p>${esc(q[0])}</p><div class="opts">${q[1].map((o, j) => `<button type="button" data-o="${j}">${String.fromCharCode(65 + j)}. ${esc(o)}</button>`).join('')}</div><p class="why" hidden>${esc(q[3] || '')}</p></li>`).join('')}</ol>`;
  }
  function bindMcq(el, onScore) {
    el.querySelectorAll('.st-mcq > li').forEach(li => li.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      if (li.dataset.done) return; li.dataset.done = '1';
      const ok = +b.dataset.o === +li.dataset.a; b.classList.add(ok ? 'ok' : 'bad'); li.querySelector(`[data-o="${li.dataset.a}"]`).classList.add('ok');
      const w = li.querySelector('.why'); w.hidden = false; w.textContent = (ok ? '정답! ' : '아쉬워요. ') + w.textContent;
      if (onScore) onScore(ok);
    }));
  }

  /* =====================================================================
     영어 — 30분 레슨
     ===================================================================== */
  const ui = { en: '', timer: null, t0: 0, acc: 0 };
  function renderEn(el) {
    const L = lessons('en'), s = st();
    if (!ui.en || !L.some(x => x.id === ui.en)) { const dl = dayLessons('en'); ui.en = dl.length ? dl[0].id : s.pick.en && L.some(x => x.id === s.pick.en) ? s.pick.en : L.find(x => x.kind === 'novel').id; }
    const x = L.find(l => l.id === ui.en), dn = s.done[x.id] || {};
    const totalMin = x.plan.reduce((a, p) => a + p[1], 0);
    el.innerHTML = dayBar() + `<div class="st-pick">${L.map(l => `<button type="button" class="${l.id === x.id ? 'on' : ''}${l.today ? ' day' : ''}" data-l="${l.id}"><span class="k">${l.today ? `${+l.today.slice(5, 7)}/${+l.today.slice(8)} 레슨 · ` : ''}${l.kind === 'econ' ? '경제 매거진' : '소설 대사'}${l.ai ? ' · 내가 만듦' : ''}</span><b>${esc(l.title)}</b><small>${esc(l.sub || '')}</small>${Object.keys(s.done[l.id] || {}).length === 4 ? '<em>✓ 끝냄</em>' : ''}</button>`).join('')}</div>
      <div class="st-make"><button type="button" class="btn sm" data-make="novel">${H.icon('sparkle', 14)}새 소설 레슨 만들기 (AI)</button><button type="button" class="btn sm" data-make="econ">${H.icon('sparkle', 14)}이번 주 경제 기사 만들기 (AI · 웹 검색)</button><span class="sc-fine">${H.aiName() ? `${esc(H.aiName())} 로 만듭니다 · 사용량(토큰)이 듭니다` : 'AI API 를 등록하면 새로 만들 수 있습니다'}</span></div>
      <article class="st-lesson">
        <header><span class="tag">${x.kind === 'econ' ? '경제 매거진' : '소설 대사'} · ${totalMin}분</span><h2>${esc(x.title)}</h2><p class="sub">${esc(x.sub || '')}</p>${x.note ? `<p class="note">${esc(x.note)}</p>` : ''}
          ${x.sources && x.sources.length ? `<p class="src">참고: ${x.sources.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>` : ''}</header>
        <div class="st-timer"><button type="button" class="btn sm ink" data-timer>${ui.timer ? '일시 정지' : '30분 시작'}</button><div class="bar"><i style="width:0%"></i></div><span class="t" data-tt>${totalMin}:00</span>
          <div class="secs">${x.plan.map(([n, m], i) => `<span class="${dn[i] ? 'done' : ''}" data-sec="${i}">${n} ${m}분${dn[i] ? ' ✓' : ''}</span>`).join('')}</div></div>
        <section><h3>1. 단어 <small>${x.plan[0][1]}분 · 카드를 누르면 뜻 · 🔊 발음</small></h3>
          <div class="st-cards">${x.vocab.map((v, i) => `<div class="st-card" data-flip tabindex="0"><div class="f"><b>${esc(v[0])}</b><span>${esc(v[1])}</span>${say(v[0], 'en')}</div><div class="b"><b>${esc(v[2])}</b><p>${esc(v[3])}</p><small>${esc(v[4])}</small></div></div>`).join('')}</div>
          <h4>단어 확인 퀴즈</h4>${mcq(shuffle(x.vocab).slice(0, 5).map(v => { const opts = shuffle([v[2]].concat(shuffle(x.vocab.filter(y => y !== v)).slice(0, 3).map(y => y[2]))); return [`"${v[0]}" 의 뜻은?`, opts, opts.indexOf(v[2]), v[3]]; }), 'v')}
          ${doneBtn(x, 0, dn)}</section>
        <section><h3>2. 문법 <small>${x.plan[1][1]}분</small></h3><h4>${esc(x.grammar.title)}</h4><p class="ex">${esc(x.grammar.explain)}</p>
          <ul class="st-ex">${x.grammar.examples.map(e => `<li><span>${esc(e[0])} ${say(e[0], 'en')}</span><small>${esc(e[1])}</small></li>`).join('')}</ul>
          <h4>연습</h4>${mcq(x.grammar.practice, 'g')}${doneBtn(x, 1, dn)}</section>
        <section><h3>3. 독해 <small>${x.plan[2][1]}분 · 먼저 해석 없이 읽고, 막히면 [해석]</small></h3>
          <div class="st-tools"><button type="button" class="btn sm ghost" data-ko>해석 모두 보기</button><button type="button" class="btn sm ghost" data-readall>${'🔊'} 전체 읽어 주기</button></div>
          <div class="st-pass">${x.passage.map(p => `<div class="ln${p[0] ? ' say' : ''}">${p[0] ? `<b class="who">${esc(p[0])}</b>` : ''}<p>${esc(p[1])} ${say(p[1], 'en')}</p><p class="ko" hidden>${esc(p[2])}</p></div>`).join('')}</div>
          <h4>내용 확인</h4>${mcq(x.questions, 'r')}${doneBtn(x, 2, dn)}</section>
        <section><h3>4. 작문 <small>${x.plan[3][1]}분 · 이 기기에 저절로 저장</small></h3><p class="ex">${esc(x.writing.prompt)}</p>
          <ul class="st-guide">${x.writing.guide.map(g => `<li>${esc(g)}</li>`).join('')}</ul>
          <textarea class="st-write" rows="7" placeholder="여기에 영어로 쓰세요">${esc(s.write[x.id] || '')}</textarea><p class="sc-fine st-wc" style="text-align:left"></p>
          <div class="st-tools"><button type="button" class="btn sm ghost" data-model>모범 답안 보기</button><button type="button" class="btn sm" data-fix>${H.icon('sparkle', 14)}AI 첨삭</button></div>
          <p class="st-model" hidden>${esc(x.writing.model)} ${say(x.writing.model, 'en')}</p><div class="st-fixout"></div>${doneBtn(x, 3, dn)}</section>
      </article>`;
    bindSay(el); bindMcq(el); bindDay(el, () => renderEn(el));
    el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { ui.en = b.dataset.l; const s2 = st(); s2.pick.en = ui.en; save(s2); stopTimer(); ui.acc = 0; renderEn(el); });
    el.querySelectorAll('[data-flip]').forEach(c => { const f = () => c.classList.toggle('on'); c.onclick = f; c.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } }; });
    el.querySelector('[data-ko]').onclick = e => { const on = e.target.textContent.includes('보기'); el.querySelectorAll('.st-pass .ko').forEach(k => { k.hidden = !on; }); e.target.textContent = on ? '해석 숨기기' : '해석 모두 보기'; };
    el.querySelector('[data-readall]').onclick = () => speak(x.passage.map(p => p[1]).join(' '), 'en');
    el.querySelectorAll('.st-pass .ln').forEach(ln => ln.ondblclick = () => { const k = ln.querySelector('.ko'); k.hidden = !k.hidden; });
    const ta = el.querySelector('.st-write'), wc = el.querySelector('.st-wc');
    const count = () => { const n = (ta.value.match(/[A-Za-z']+/g) || []).length, sn = (ta.value.match(/[.!?](\s|$)/g) || []).length; wc.textContent = `${n}단어 · ${sn}문장`; };
    ta.oninput = () => { const s2 = st(); s2.write[x.id] = ta.value; save(s2); count(); }; count();
    el.querySelector('[data-model]').onclick = e => { const m = el.querySelector('.st-model'); m.hidden = !m.hidden; e.target.textContent = m.hidden ? '모범 답안 보기' : '모범 답안 숨기기'; };
    el.querySelector('[data-fix]').onclick = () => fixWriting(x, ta.value, el.querySelector('.st-fixout'));
    el.querySelectorAll('[data-done]').forEach(b => b.onclick = () => { const s2 = st(); const d = s2.done[x.id] = s2.done[x.id] || {}; if (d[b.dataset.done]) delete d[b.dataset.done]; else d[b.dataset.done] = Date.now(); save(s2); renderEn(el); });
    el.querySelectorAll('[data-make]').forEach(b => b.onclick = () => makeEn(b.dataset.make, el, b));
    const tb = el.querySelector('[data-timer]'); tb.onclick = () => { if (ui.timer) stopTimer(); else startTimer(totalMin); tb.textContent = ui.timer ? '일시 정지' : '이어서 시작'; };
    ui.el = el; ui.total = totalMin; ui.plan = x.plan;
    tickTimer(totalMin, el);
  }
  const doneBtn = (x, i, dn) => `<div class="st-done"><button type="button" class="btn sm ${dn[i] ? '' : 'ink'}" data-done="${i}">${dn[i] ? '✓ 끝냄 (취소)' : '이 부분 끝냄'}</button></div>`;
  /* 30분 타이머 — 화면을 떠나도 흐름 유지(이 기기 메모리) */
  function startTimer() { ui.t0 = Date.now(); ui.timer = setInterval(() => tickTimer(ui.total, ui.el), 1000); }
  function stopTimer() { if (ui.timer) { clearInterval(ui.timer); ui.acc += Date.now() - ui.t0; ui.timer = null; } }
  function tickTimer(total, el) {
    if (!el || !el.isConnected) return; const ms = ui.acc + (ui.timer ? Date.now() - ui.t0 : 0), left = Math.max(0, total * 60000 - ms);
    const t = el.querySelector('[data-tt]'); if (!t) return; t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
    el.querySelector('.st-timer .bar i').style.width = Math.min(100, ms / (total * 600)) + '%';
    let acc = 0; const m = ms / 60000; el.querySelectorAll('[data-sec]').forEach((sp, i) => { const a = acc; acc += ui.plan[i][1]; sp.classList.toggle('now', !!ui.timer && m >= a && m < acc); });
    if (left === 0 && ui.timer) { stopTimer(); H.toast('30분이 끝났습니다. 수고했어요!', 3000); }
  }
  async function fixWriting(x, text, out) {
    if (!text.trim()) { H.toast('먼저 작문을 써 주세요', 1800); return; }
    if (!H.aiName()) { H.toast('AI API 를 먼저 등록해 주세요 (Stock → API 연결)', 2600); return; }
    out.innerHTML = '<div class="sc-bmsg">첨삭하는 중…</div>';
    try {
      const r = await H.ai(`고등학생 영어 작문 첨삭.\n과제: ${x.writing.prompt}\n학생 글:\n"""${text.slice(0, 2000)}"""\n\n한국어로 짧게: 1) 고친 글 전체(영어) 2) 고친 곳마다 이유 한 줄씩(최대 6개) 3) 더 자연스러운 표현 2개 4) 10점 만점 점수와 다음에 신경 쓸 한 가지. 칭찬은 근거가 있을 때만.`, { web: false });
      out.innerHTML = `<div class="st-ai">${esc(r)}</div>`;
    } catch (e) { out.innerHTML = `<div class="sc-err">${esc(e.message)}</div>`; }
  }
  const EN_SCHEMA = `{"title":"영어 제목","sub":"한국어 부제(출처 · 날짜)","note":"한국어 안내(각색 · 직접 쓴 글임을 밝힘)","sources":[["출처 제목","https://..."]],"plan":[["단어",7],["문법",6],["독해",10],["작문",7]],"vocab":[["word","품사(n./v./adj.)","한국어 뜻","English example","예문 해석"]  (정확히 12개)],"grammar":{"title":"문법 이름(한국어)","explain":"한국어 설명 3~4문장","examples":[["English","해석"] (3개)],"practice":[["문제","[보기 4개]",정답 번호(0~3),"한국어 해설"] (4개)]},"passage":[["말하는 사람(대사면 이름, 서술이면 빈 문자열)","English","한국어 해석"] (8~12줄, 합계 280~350단어)],"questions":[["English question",["A","B","C","D"],정답 번호,"한국어 해설"] (5개)],"writing":{"prompt":"한국어 과제(5~6문장 · 오늘 문법 사용)","guide":["틀 문장 4개"],"model":"모범 답안 English"}}`;
  async function makeEn(kind, el, btn) {
    if (!H.aiName()) { H.toast('AI API 를 먼저 등록해 주세요 (Stock → API 연결)', 2600); return; }
    const have = lessons('en').map(l => l.title).join(' / ');
    const today = new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10);
    const prompt = kind === 'econ'
      ? `오늘은 ${today} (한국 시간)이다. 웹 검색으로 최근 7일 안에 나온 세계 경제의 가장 큰 이슈 하나를 찾아(여러 언론이 다룬 것), 한국 고등학생용 영어 학습 레슨을 만들어라.\n- 독해 글은 경제 매거진 문체로 네가 직접 쓴 원문(기사 문장을 베끼지 말 것), 280~350단어, 고등학생 수준 어휘. 사실 · 숫자는 검색 결과로 확인한 것만, 날짜를 밝힐 것.\n- sources 에 실제로 본 기사 2~3개 (제목, URL).\n- 이미 있는 레슨과 겹치지 말 것: ${have}\n- 답은 JSON 하나만, 다른 말 없이. 형식:\n${EN_SCHEMA}`
      : `한국 고등학생용 영어 학습 레슨을 만들어라. 저작권이 끝난(작가 사망 70년 이상) 유명 소설의 흥미로운 대화 장면 하나를 골라 고등학생 수준으로 각색한 대화문으로 써라(원문 그대로가 아님을 note 에 밝힐 것). 작품 · 장면은 흥미가 이어지게 고르고, 이미 있는 레슨과 겹치지 말 것: ${have}\n- sub 에 작품 이름(한국어 · 영어), 작가, 발표 연도.\n- sources 는 빈 배열 가능.\n- 답은 JSON 하나만, 다른 말 없이. 형식:\n${EN_SCHEMA}`;
    await makeLesson('en', prompt, { web: kind === 'econ' }, btn, j => {
      if (!Array.isArray(j.vocab) || j.vocab.length < 6 || !j.grammar || !Array.isArray(j.passage) || !Array.isArray(j.questions) || !j.writing) throw new Error('AI 가 만든 레슨 형식이 맞지 않습니다. 다시 눌러 보세요');
      return Object.assign(j, { id: 'en-ai-' + Date.now(), kind, ai: true, plan: Array.isArray(j.plan) && j.plan.length === 4 ? j.plan : [['단어', 7], ['문법', 6], ['독해', 10], ['작문', 7]] });
    }, l => { ui.en = l.id; renderEn(el); });
  }
  async function makeLesson(lang, prompt, opt, btn, fix, done) {
    const label = btn.innerHTML; btn.disabled = true; btn.textContent = '만드는 중… (1~2분)';
    try {
      const txt = await H.ai(prompt, opt);
      const a = txt.indexOf('{'), b = txt.lastIndexOf('}'); if (a < 0 || b < a) throw new Error('AI 답에서 레슨을 찾지 못했습니다. 다시 눌러 보세요');
      let j; try { j = JSON.parse(txt.slice(a, b + 1)); } catch (e) { throw new Error('AI 답의 형식이 깨졌습니다. 다시 눌러 보세요'); }
      const l = fix(j), s = aiStore(); s[lang] = [l].concat(s[lang]).slice(0, 20); H.LS.set(KAI, s);
      H.toast('새 레슨을 만들었습니다', 2000); done(l);
    } catch (e) { H.toast(e.message, 4000); }
    finally { btn.disabled = false; btn.innerHTML = label; }
  }

  /* =====================================================================
     일본어 · 중국어 — 어린이
     ===================================================================== */
  const kid = { ja: '', zh: '' };
  function renderKid(el, lang) {
    const L = lessons(lang), s = st(), today = Math.floor((Date.now() + 9 * 36e5) / 864e5);
    if (!kid[lang] || !L.some(x => x.id === kid[lang])) { const dl = dayLessons(lang); kid[lang] = dl.length ? dl[0].id : (s.pick[lang] && L.some(x => x.id === s.pick[lang])) ? s.pick[lang] : D[lang][today % D[lang].length].id; }
    const x = L.find(l => l.id === kid[lang]), name = lang === 'ja' ? '일본어' : '중국어', rd = lang === 'ja' ? '로마자' : '병음';
    const stars = (s.quiz[x.id] || 0);
    el.innerHTML = dayBar() + `<div class="kd-pick">${L.map(l => `<button type="button" class="${l.id === x.id ? 'on' : ''}${l.today ? ' day' : ''}" data-l="${l.id}"><span>${l.emoji || '⭐'}</span>${l.today ? `<small>${+l.today.slice(5, 7)}/${+l.today.slice(8)}</small>` : ''}${esc(l.title)}${l.ai ? ' · 내가 만듦' : ''}${(s.quiz[l.id] || 0) >= 5 ? ' ⭐' : ''}</button>`).join('')}</div>
      <div class="st-make"><button type="button" class="btn sm" data-make>${H.icon('sparkle', 14)}새 ${name} 레슨 만들기 (AI)</button><span class="sc-fine">${H.aiName() ? '사용량(토큰)이 듭니다' : 'AI API 를 등록하면 새로 만들 수 있습니다'}</span></div>
      <article class="kd">
        <header><span class="big">${x.emoji || '⭐'}</span><h2>${esc(x.title)}</h2><p class="sub">그림을 누르면 읽어 줘요 · ${rd}와 뜻도 함께 · 오늘의 최고 점수 ${'⭐'.repeat(Math.min(5, stars))}${stars ? '' : '없음'}</p></header>
        <h3>1. 낱말 카드</h3>
        <div class="kd-words">${x.words.map(w => `<button type="button" class="kd-w" data-say="${esc(w[0])}" data-lang="${lang}"><span class="e">${w[3] || ''}</span><b>${esc(w[0])}</b><span class="r">${esc(w[1])}</span><span class="m">${esc(w[2])}</span></button>`).join('')}</div>
        <h3>2. 따라 말하기</h3>
        <ul class="kd-ph">${x.phrases.map(p => `<li>${say(p[0], lang)}<div><b>${esc(p[0])}</b><span class="r">${esc(p[1])}</span><span class="m">${esc(p[2])}</span></div></li>`).join('')}</ul>
        <h3>3. 짧은 대화</h3>
        <ul class="kd-dl">${x.dialog.map(d => `<li class="${d[0] === 'A' ? 'a' : 'b'}">${say(d[1], lang)}<div><b>${esc(d[1])}</b><span class="r">${esc(d[2])}</span><span class="m">${esc(d[3])}</span></div></li>`).join('')}</ul>
        <h3>4. 퀴즈 — 그림에 맞는 말을 골라요</h3><div class="kd-quiz" data-quiz></div>
      </article>`;
    bindSay(el); bindDay(el, () => renderKid(el, lang));
    el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { kid[lang] = b.dataset.l; const s2 = st(); s2.pick[lang] = kid[lang]; save(s2); renderKid(el, lang); });
    el.querySelector('[data-make]').onclick = e => makeKid(lang, el, e.currentTarget);
    quiz(el.querySelector('[data-quiz]'), x, lang);
  }
  function quiz(box, x, lang) {
    const qs = shuffle(x.words).slice(0, 5); let i = 0, score = 0;
    const next = () => {
      if (i >= qs.length) {
        const s = st(); s.quiz[x.id] = Math.max(s.quiz[x.id] || 0, score); save(s);
        box.innerHTML = `<div class="kd-end"><b>${'⭐'.repeat(score)}${'☆'.repeat(5 - score)}</b><p>${score === 5 ? '모두 맞혔어요! 최고예요!' : score >= 3 ? '잘했어요! 한 번 더 해 볼까요?' : '괜찮아요, 다시 해 봐요!'}</p><button type="button" class="btn ink">다시 하기</button></div>`;
        box.querySelector('button').onclick = () => quiz(box, x, lang); return;
      }
      const q = qs[i], opts = shuffle([q].concat(shuffle(x.words.filter(w => w !== q)).slice(0, 3)));
      box.innerHTML = `<p class="kd-q"><span class="e">${q[3] || ''}</span>${esc(q[2])} <small>(${i + 1}/${qs.length})</small></p><div class="kd-opts">${opts.map((o, j) => `<button type="button" data-j="${j}"><b>${esc(o[0])}</b><span>${esc(o[1])}</span></button>`).join('')}</div>`;
      box.querySelectorAll('[data-j]').forEach(b => b.onclick = () => {
        if (box.dataset.lock) return; box.dataset.lock = '1';
        const o = opts[+b.dataset.j], ok = o === q; if (ok) score++;
        b.classList.add(ok ? 'ok' : 'bad'); box.querySelectorAll('[data-j]').forEach(bb => { if (opts[+bb.dataset.j] === q) bb.classList.add('ok'); });
        speak(q[0], lang);
        setTimeout(() => { delete box.dataset.lock; i++; next(); }, 1100);
      });
    };
    next();
  }
  async function makeKid(lang, el, btn) {
    if (!H.aiName()) { H.toast('AI API 를 먼저 등록해 주세요 (Stock → API 연결)', 2600); return; }
    const name = lang === 'ja' ? '일본어' : '중국어', have = lessons(lang).map(l => l.title).join(' / ');
    const fmt = lang === 'ja' ? '단어는 히라가나(외래어는 가타카나), 읽기는 헵번식 로마자 소문자' : '단어는 간체자, 읽기는 성조 표시가 있는 병음';
    const prompt = `한국 어린이(6~9살)를 위한 ${name} 첫걸음 레슨 하나를 만들어라. 아이들이 좋아하는 생활 주제 하나(이미 있는 것과 겹치지 말 것: ${have}).\n- ${fmt}. 뜻은 한국어. 아주 쉬운 말만.\n- 답은 JSON 하나만, 다른 말 없이. 형식:\n{"title":"한국어 주제 + ${name} 주제어","emoji":"이모지 1개","words":[["단어","읽기","뜻","이모지"] (정확히 8개)],"phrases":[["문장","읽기","뜻"] (3개)],"dialog":[["A 또는 B","문장","읽기","뜻"] (4줄)]}`;
    await makeLesson(lang, prompt, { web: false }, btn, j => {
      if (!Array.isArray(j.words) || j.words.length < 4 || !Array.isArray(j.phrases) || !Array.isArray(j.dialog)) throw new Error('AI 가 만든 레슨 형식이 맞지 않습니다. 다시 눌러 보세요');
      return Object.assign(j, { id: `${lang}-ai-${Date.now()}`, ai: true });
    }, l => { kid[lang] = l.id; renderKid(el, lang); });
  }

  /* 열어 둔 채 6시가 지나면 새 판으로 */
  const last = { view: '', el: null, eff: '' };
  setInterval(() => { const e = effToday(); if (!last.eff) last.eff = e; if (e === last.eff) return; last.eff = e; dui.idx = null; dui.date = ''; ui.en = ''; kid.ja = ''; kid.zh = ''; if (last.el && last.el.offsetParent) window.SEC_STUDY.render(last.view, last.el).then(() => H.toast('오늘의 새 레슨이 도착했습니다', 3000)); }, 5 * 60000);
  return {
    init(h) { H = h; if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => { }; } catch (e) { } } },
    async render(view, el) {
      const go = () => { if (view === 'en') renderEn(el); else renderKid(el, view); };
      last.view = view; last.el = el;
      if (!dui.idx) el.innerHTML = '<div class="sc-bmsg">오늘의 레슨을 불러오는 중…</div>';
      try { await ensureDay(); } catch (e) { }
      go();
    },
  };
})();
