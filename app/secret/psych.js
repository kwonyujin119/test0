/* SECRET Psychological — 하루하루 마음 기록(달력) + 내 기록을 분석한 종합 분석
   · 기록: { 'YYYY-MM-DD': { mood 1~10, stress 0~10, energy 0~10, sleep 시간, emo [감정], act [한 일], good [좋았던 일 3], grat [감사일기 3], th {생각 기록}, chk(예전 자가 점검 — 지금은 쓰지 않지만 지우지 않음), memo, updated } } — secret.js 가 저장 · 기기 동기화(칸 psych)
   · 분석은 이 기기 안에서 계산(토큰 안 씀). [AI 에게 해석 받기]만 등록한 AI 로 최근 기록을 보냄
   · 의학적 진단이 아님. 위험 신호(아주 낮은 기분이 이어짐 · 위험한 낱말)가 보이면 상담 전화를 안내 */
'use strict';
window.SEC_PSYCH = (() => {
  let H = null; // { esc, icon, toast, get, set, tomb, ask, confirm }
  const esc = s => H.esc(String(s == null ? '' : s));
  const EMO = [['기쁨', 1], ['평온', 1], ['감사', 1], ['자신감', 1], ['설렘', 1], ['뿌듯함', 1], ['피곤', -1], ['불안', -1], ['짜증', -1], ['분노', -1], ['슬픔', -1], ['외로움', -1], ['무기력', -1], ['부담', -1]];
  const EPOS = new Set(EMO.filter(e => e[1] > 0).map(e => e[0]));
  const MOODW = ['', '매우 나쁨', '많이 나쁨', '나쁨', '조금 나쁨', '그저 그럼', '보통', '조금 좋음', '좋음', '많이 좋음', '매우 좋음'];
  const DOW = '일월화수목금토';
  const kstToday = () => new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10);
  const addD = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
  const dowOf = d => new Date(d + 'T00:00:00Z').getUTCDay();
  const md = d => `${+d.slice(5, 7)}월 ${+d.slice(8)}일 (${DOW[dowOf(d)]})`;
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  const f1 = x => x == null ? '–' : (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, '');
  const num = v => typeof v === 'number' && isFinite(v) ? v : null;
  const ui = { month: '', sel: '', range: 30, more: false };
  const RISK = /죽고\s*싶|자살|사라지고\s*싶|살기\s*싫|끝내고\s*싶|자해/;
  /* 오늘 한 일 — 행동 활성화(활동과 기분의 연결을 스스로 보게 함). +1 은 기분을 돕는 쪽으로 알려진 활동, -1 은 주의할 활동 */
  const ACT = [['운동', 1], ['산책 · 햇빛', 1], ['사람 만남', 1], ['성취한 일', 1], ['즐거운 일 · 취미', 1], ['자연 · 바깥', 1], ['호흡 · 명상', 1], ['일찍 잠', 1], ['음주', -1], ['늦은 밤 화면', -1], ['야근 · 과로', -1], ['혼자 틀어박힘', -1]];


  function pearson(xs, ys) {
    const n = xs.length; if (n < 7) return null;
    const mx = avg(xs), my = avg(ys); let a = 0, b = 0, c = 0;
    for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; a += dx * dy; b += dx * dx; c += dy * dy; }
    return b && c ? a / Math.sqrt(b * c) : null;
  }
  const rWord = r => Math.abs(r) >= .6 ? '뚜렷하게' : Math.abs(r) >= .35 ? '어느 정도' : '';

  /* ---------- 종합 분석 ---------- */
  function analyze(data) {
    const today = kstToday(), days = Object.keys(data).filter(d => d <= today).sort();
    const range = (from, to) => days.filter(d => d >= from && d <= to).map(d => Object.assign({ d }, data[d]));
    const w1 = range(addD(today, -6), today), w0 = range(addD(today, -13), addD(today, -7)), m = range(addD(today, -29), today);
    const mood1 = avg(w1.map(x => x.mood).filter(num)), mood0 = avg(w0.map(x => x.mood).filter(num));
    let streak = 0; for (let d = data[today] ? today : addD(today, -1); data[d]; d = addD(d, -1)) streak++;
    const out = { n: days.length, n30: m.length, mood1, mood0, stress1: avg(w1.map(x => x.stress).filter(num)), energy1: avg(w1.map(x => x.energy).filter(num)), sleep1: avg(w1.map(x => x.sleep).filter(num)), streak, ins: [], risk: false, emoTop: [] };
    const cnt = {}; m.forEach(x => (x.emo || []).forEach(e => { cnt[e] = (cnt[e] || 0) + 1; }));
    out.emoTop = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 5);
    // 위험 신호
    const last3 = days.slice(-3).map(d => data[d]);
    if ((last3.length === 3 && last3.every(x => num(x.mood) != null && x.mood <= 2)) || days.slice(-7).some(d => RISK.test([data[d].memo, (data[d].th || {}).auto].join(' ')))) out.risk = true;
    out.good = days.slice(-7).filter(d => (data[d].good || []).some(Boolean)).length; out.grat = days.slice(-7).filter(d => (data[d].grat || []).some(Boolean)).length;
    if (m.length < 3) return out;
    // 1. 흐름
    if (mood1 != null && mood0 != null) {
      const dlt = mood1 - mood0;
      out.ins.push(Math.abs(dlt) < .5 ? `최근 7일 기분(${f1(mood1)})은 그 전 7일(${f1(mood0)})과 비슷합니다.` : dlt > 0 ? `최근 7일 기분이 그 전 7일보다 ${f1(dlt)}점 올랐습니다(${f1(mood0)} → ${f1(mood1)}). 무엇이 달랐는지 적어 두면 다시 쓸 수 있습니다.` : `최근 7일 기분이 그 전 7일보다 ${f1(-dlt)}점 내려갔습니다(${f1(mood0)} → ${f1(mood1)}). 아래 달력에서 낮았던 날의 메모를 다시 보세요.`);
    }
    // 6-1. 활동과 기분 (행동 활성화)
    const actFx = ACT.map(([a, sgn]) => { const w = m.filter(x => num(x.mood) != null && Array.isArray(x.act)), y = w.filter(x => x.act.includes(a)).map(x => x.mood), n = w.filter(x => !x.act.includes(a)).map(x => x.mood); return y.length >= 3 && n.length >= 3 ? [a, avg(y) - avg(n), y.length, sgn] : null; }).filter(Boolean).sort((p, q) => Math.abs(q[1]) - Math.abs(p[1]));
    const up = actFx.filter(x => x[1] >= .7).slice(0, 2), dn = actFx.filter(x => x[1] <= -.7).slice(0, 2);
    if (up.length) out.ins.push(`${up.map(([a, g, c]) => `"${a}" 한 날(${c}일) 기분이 ${f1(g)}점 높습니다`).join(', ')}. 기분이 처질 때 일부러 계획해 보세요(행동 활성화).`);
    if (dn.length) out.ins.push(`${dn.map(([a, g, c]) => `"${a}" 한 날(${c}일) 기분이 ${f1(-g)}점 낮습니다`).join(', ')}.`);
    // 2. 감정 균형
    const tot = Object.values(cnt).reduce((s, x) => s + x, 0);
    if (tot >= 5) {
      const pos = Object.entries(cnt).filter(([e]) => EPOS.has(e)).reduce((s, [, x]) => s + x, 0), pp = Math.round(pos / tot * 100);
      const top = out.emoTop[0];
      out.ins.push(`30일 동안 고른 감정 중 긍정 감정이 ${pp}%입니다. 가장 많이 느낀 감정은 "${top[0]}"(${top[1]}번).`);
    }
    // 3. 수면과 기분
    const sl = m.filter(x => num(x.sleep) != null && num(x.mood) != null), hi = sl.filter(x => x.sleep >= 7).map(x => x.mood), lo = sl.filter(x => x.sleep < 6).map(x => x.mood);
    if (hi.length >= 3 && lo.length >= 3) {
      const g = avg(hi) - avg(lo);
      out.ins.push(Math.abs(g) < .7 ? `잠을 7시간 넘게 잔 날과 6시간 못 잔 날의 기분 차이는 크지 않습니다(${f1(avg(hi))} / ${f1(avg(lo))}).` : g > 0 ? `7시간 넘게 잔 날의 기분(${f1(avg(hi))})이 6시간 못 잔 날(${f1(avg(lo))})보다 ${f1(g)}점 높습니다. 잠이 기분에 크게 작용하는 편입니다.` : `특이하게도 적게 잔 날의 기분이 더 높습니다(${f1(avg(lo))} / ${f1(avg(hi))}). 바쁜 날 기분이 좋은지 메모를 보세요.`);
    }
    // 4. 스트레스와 기분
    const sm = m.filter(x => num(x.stress) != null && num(x.mood) != null), r = pearson(sm.map(x => x.stress), sm.map(x => x.mood));
    if (r != null && rWord(r)) out.ins.push(r < 0 ? `스트레스가 높은 날 기분이 ${rWord(r)} 낮아집니다(상관 ${f1(r)}). 스트레스를 줄이는 일이 기분을 올리는 가장 빠른 길일 수 있습니다.` : `스트레스가 높은 날에도 기분이 함께 높은 편입니다(상관 ${f1(r)}). 긴장을 동력으로 쓰는 날이 많다는 뜻일 수 있지만, 피로가 쌓이지 않는지 보세요.`);
    // 5. 요일
    if (days.length >= 14) {
      const by = {}; days.slice(-60).forEach(d => { const x = data[d]; if (num(x.mood) == null) return; (by[dowOf(d)] = by[dowOf(d)] || []).push(x.mood); });
      const ok = Object.entries(by).filter(([, a]) => a.length >= 2).map(([k, a]) => [+k, avg(a)]).sort((a, b) => b[1] - a[1]);
      if (ok.length >= 3 && ok[0][1] - ok[ok.length - 1][1] >= 1) out.ins.push(`요일로 보면 ${DOW[ok[0][0]]}요일 기분이 가장 좋고(${f1(ok[0][1])}), ${DOW[ok[ok.length - 1][0]]}요일이 가장 낮습니다(${f1(ok[ok.length - 1][1])}). 그 요일에 반복되는 일이 있는지 보세요.`);
    }
    // 6. 낮은 날의 말
    const low = m.filter(x => num(x.mood) != null && x.mood <= 4 && x.memo);
    if (low.length >= 2) {
      const STOP = new Set('오늘 그냥 너무 정말 진짜 계속 그리고 그래서 하지만 했다 했음 있었다 없었다 같다 것 거 좀 많이 조금 나는 내가 나 우리 하는 하고 해서 때문에'.split(' '));
      const wc = {}; low.forEach(x => new Set((x.memo.match(/[가-힣A-Za-z]{2,}/g) || []).map(w => w.replace(/(은|는|이|가|을|를|에|에서|으로|로|와|과|도|만|이랑|랑|한테|의)$/, '')).filter(w => w.length >= 2 && !STOP.has(w))).forEach(w => { wc[w] = (wc[w] || 0) + 1; }));
      const top = Object.entries(wc).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (top.length) out.ins.push(`기분이 낮았던 날의 메모에 자주 나온 말: ${top.map(([w, c]) => `"${w}"(${c})`).join(', ')}.`);
    }
    // 6-2. 좋았던 일 세 가지
    if (out.good >= 3) out.ins.push(`최근 7일 중 ${out.good}일, 좋았던 일을 적었습니다. 매일 세 가지를 적는 연습은 행복감을 높인다는 연구가 있습니다.`);
    if (out.grat >= 3) out.ins.push(`최근 7일 중 ${out.grat}일 감사일기를 썼습니다. 고마운 사람에게 직접 한 마디 전하면 효과가 더 커질 수 있습니다.`);
    // 7. 기록 습관
    if (out.n30 < 15) out.ins.push(`30일 중 ${out.n30}일을 적었습니다. 매일 1분이라도 적으면 분석이 더 정확해집니다.`);
    else if (streak >= 7) out.ins.push(`${streak}일 연속으로 기록했습니다. 꾸준한 기록이 패턴을 보이게 합니다.`);
    return out;
  }

  /* 30일 꺾은선: 기분(초록) · 스트레스(주황), 같은 0~10 눈금. 기록 없는 날은 선을 끊음 */
  function chart(data, nDays) {
    const today = kstToday(), W = 560, Ht = 132, L = 22, R = 8, T = 10, B = 20, iw = W - L - R, ih = Ht - T - B;
    const ds = Array.from({ length: nDays }, (_, i) => addD(today, i - nDays + 1));
    const x = i => L + (nDays === 1 ? iw / 2 : i * iw / (nDays - 1)), y = v => T + ih - v / 10 * ih;
    const line = (k, cls) => { let p = '', on = false; ds.forEach((d, i) => { const v = data[d] && num(data[d][k]); if (v == null) { on = false; return; } p += (on ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); on = true; }); return p ? `<path class="${cls}" d="${p}"/>` : ''; };
    const dots = (k, cls) => ds.map((d, i) => { const v = data[d] && num(data[d][k]); return v == null ? '' : `<circle class="${cls}" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2.6"><title>${md(d)} ${k === 'mood' ? '기분' : '스트레스'} ${v}</title></circle>`; }).join('');
    const grid = [0, 5, 10].map(v => `<line class="g" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="t" x="${L - 5}" y="${y(v) + 3.5}" text-anchor="end">${v}</text>`).join('');
    const lab = [0, Math.floor((nDays - 1) / 2), nDays - 1].map(i => `<text class="t" x="${x(i)}" y="${Ht - 5}" text-anchor="${i === 0 ? 'start' : i === nDays - 1 ? 'end' : 'middle'}">${+ds[i].slice(5, 7)}/${+ds[i].slice(8)}</text>`).join('');
    return `<svg class="ps-chart" viewBox="0 0 ${W} ${Ht}" role="img" aria-label="최근 ${nDays}일 기분과 스트레스">${grid}${lab}${line('stress', 'ls')}${line('mood', 'lm')}${dots('stress', 'ds')}${dots('mood', 'dm')}</svg>`;
  }

  function renderTop(el, data) {
    const a = analyze(data), dl = a.mood1 != null && a.mood0 != null ? a.mood1 - a.mood0 : null;
    const kpi = (lb, v, sub) => `<div class="ps-kpi"><span>${lb}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
    el.innerHTML = `<div class="ps-top-h"><h2>종합 분석</h2><span class="sc-fine">내가 적은 기록만으로 계산 · 의학적 진단 아님</span>${a.n >= 3 ? `<button type="button" class="btn sm ps-aibtn" data-psai title="최근 14일 기록(메모 포함)을 등록한 AI 로 보냅니다 · 토큰 사용">${H.icon('sparkle', 14)}AI 에게 해석 받기</button>` : ''}</div>
      ${a.risk ? `<div class="ps-risk" role="alert"><b>요즘 많이 힘든 것 같습니다. 혼자 견디지 마세요.</b> 24시간 상담: <a href="tel:109">자살예방상담전화 109</a> · <a href="tel:15770199">정신건강위기상담 1577-0199</a>. 가까운 사람에게 지금 연락하는 것도 큰 도움이 됩니다.</div>` : ''}
        <div class="ps-kpis">
          ${kpi('최근 7일 기분', a.mood1 == null ? '–' : `${f1(a.mood1)}<em>/10</em>`, dl == null ? '' : `지난주 대비 <i class="${dl >= 0 ? 'pu' : 'pd'}">${dl >= 0 ? '+' : ''}${f1(dl)}</i>`)}
          ${kpi('스트레스', a.stress1 == null ? '–' : `${f1(a.stress1)}<em>/10</em>`, '최근 7일 평균')}
          ${kpi('에너지', a.energy1 == null ? '–' : `${f1(a.energy1)}<em>/10</em>`, '최근 7일 평균')}
          ${kpi('수면', a.sleep1 == null ? '–' : `${f1(a.sleep1)}<em>시간</em>`, '최근 7일 평균')}
          ${kpi('기록', `${a.n}<em>일</em>`, a.streak ? `${a.streak}일 연속` : '오늘 기록 전')}
        </div>
      <div class="ps-top-g">
        <div class="ps-chartbox"><div class="ps-leg"><span class="lm">기분</span><span class="ls">스트레스</span><span class="rg">${[14, 30, 90].map(n => `<button type="button" data-rg="${n}" class="${ui.range === n ? 'on' : ''}">${n}일</button>`).join('')}</span></div>${chart(data, ui.range)}
          ${a.emoTop.length ? `<div class="ps-emo-top"><span>30일 자주 느낀 감정</span>${a.emoTop.map(([e, c]) => `<i class="${EPOS.has(e) ? 'p' : 'n'}">${esc(e)} ${c}</i>`).join('')}</div>` : ''}</div>
        <div class="ps-ins"><h3>나의 패턴${a.ins.length ? ` <small>${a.ins.length}개</small>` : ''}</h3>${a.ins.length ? `<ul>${a.ins.slice(0, ui.more ? 99 : 3).map(s => `<li>${esc(s)}</li>`).join('')}</ul>${a.ins.length > 3 ? `<button type="button" class="ps-more" data-psmore>${ui.more ? '접기' : `더 보기 (${a.ins.length - 3})`}</button>` : ''}` : `<p class="sc-fine" style="text-align:left">${a.n ? `3일 이상 적으면 분석이 시작됩니다 (지금 ${a.n30}일).` : '아래 달력에서 날짜를 눌러 오늘의 마음을 적어 보세요. 3일부터 분석이 시작됩니다.'}</p>`}
          </div>
      </div>
`;
    el.querySelectorAll('[data-rg]').forEach(b => b.onclick = () => { ui.range = +b.dataset.rg; renderTop(el, H.get()); });
    const mo = el.querySelector('[data-psmore]'); if (mo) mo.onclick = () => { ui.more = !ui.more; renderTop(el, H.get()); };
    const ai = el.querySelector('[data-psai]'); if (ai) ai.onclick = () => H.ask(aiPrompt(data, a));
  }
  function aiPrompt(data, a) {
    const today = kstToday(), rows = [];
    for (let i = 13; i >= 0; i--) { const d = addD(today, -i), x = data[d]; if (x) rows.push(`${d}(${DOW[dowOf(d)]}) 기분 ${x.mood ?? '-'} · 스트레스 ${x.stress ?? '-'} · 에너지 ${x.energy ?? '-'} · 수면 ${x.sleep ?? '-'}시간 · 감정 ${(x.emo || []).join(', ') || '-'}${(x.act || []).length ? ` · 한 일 ${x.act.join(', ')}` : ''}${(x.good || []).some(Boolean) ? ` · 좋았던 일 ${x.good.filter(Boolean).join(' / ')}` : ''}${(x.grat || []).some(Boolean) ? ` · 감사 ${x.grat.filter(Boolean).join(' / ')}` : ''}${x.memo ? ` · 메모: ${x.memo.replace(/\s+/g, ' ').slice(0, 300)}` : ''}`); }
    return `아래는 내가 최근 14일 동안 적은 마음 기록이야(기분 · 스트레스 · 에너지는 10점 만점). 의학적 진단은 하지 말고, 따뜻하지만 솔직한 코치처럼 답해 줘.\n1) 이 기간의 흐름을 세 줄로 요약\n2) 기분을 올린 것과 떨어뜨린 것으로 보이는 패턴 (근거가 된 날짜를 함께)\n3) 다음 7일 동안 해 볼 작은 행동 3가지 (구체적으로)\n4) 내가 놓치고 있을 수 있는 점 하나\n위험 신호가 보이면 상담 전화(109, 1577-0199)를 안내해 줘.\n\n앱이 계산한 요약: 최근 7일 기분 ${f1(a.mood1)}, 그 전 7일 ${f1(a.mood0)}, 스트레스 ${f1(a.stress1)}, 수면 ${f1(a.sleep1)}시간.\n\n${rows.join('\n')}`;
  }

  /* ---------- 달력 + 입력창 ---------- */
  function renderCal(el, data) {
    const today = kstToday(); if (!ui.month) ui.month = today.slice(0, 7); if (!ui.sel) ui.sel = today;
    const [yy, mm] = ui.month.split('-').map(Number), first = `${ui.month}-01`, nd = new Date(Date.UTC(yy, mm, 0)).getUTCDate(), lead = dowOf(first);
    const mc = Object.keys(data).filter(d => d.startsWith(ui.month)), mavg = avg(mc.map(d => data[d].mood).filter(num));
    let cells = ''; for (let i = 0; i < lead; i++) cells += '<span class="ps-c empty"></span>';
    for (let k = 1; k <= nd; k++) {
      const d = `${ui.month}-${String(k).padStart(2, '0')}`, x = data[d], fut = d > today, mv = x && num(x.mood);
      cells += `<button type="button" class="ps-c${x ? ' has' : ''}${d === today ? ' today' : ''}${d === ui.sel ? ' sel' : ''}${dowOf(d) === 0 ? ' sun' : dowOf(d) === 6 ? ' sat' : ''}" data-d="${d}"${fut ? ' disabled' : ''} aria-label="${md(d)}${x ? ` 기분 ${mv ?? '-'}` : ' 기록 없음'}"${mv != null ? ` style="--a:${(.12 + mv / 10 * .62).toFixed(2)}"` : ''}><span class="n">${k}</span>${mv != null ? `<b>${mv}</b>` : x ? '<b>·</b>' : ''}</button>`;
    }
    el.innerHTML = `<div class="ps-cal-h"><button type="button" class="btn icon ghost" data-mv="-1" aria-label="이전 달">${H.icon('back', 16)}</button><h3>${yy}년 ${mm}월</h3><button type="button" class="btn icon ghost" data-mv="1" aria-label="다음 달"${ui.month >= today.slice(0, 7) ? ' disabled' : ''}>${H.icon('arrowRight', 16)}</button><button type="button" class="btn sm ghost" data-gotoday>오늘</button><span class="sc-fine">${mc.length}일 기록${mavg != null ? ` · 평균 기분 ${f1(mavg)}` : ''}</span></div>
      <div class="ps-grid" role="grid">${[...DOW].map((w, i) => `<span class="ps-w${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}">${w}</span>`).join('')}${cells}</div>
      <p class="sc-fine ps-cal-note">칸 안 숫자 = 그날 기분(10점) · 진할수록 좋은 날 · 날짜를 누르면 입력창이 열립니다. 힘든 상태가 2주 넘게 이어지면 전문가와 상담하세요.</p>`;
    el.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { const t = new Date(Date.UTC(yy, mm - 1 + +b.dataset.mv, 1)); ui.month = t.toISOString().slice(0, 7); renderCal(el, H.get()); });
    el.querySelector('[data-gotoday]').onclick = () => { ui.month = today.slice(0, 7); ui.sel = today; paintAll(); };
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { ui.sel = b.dataset.d; paintAll(); const ed = document.getElementById('psEdit'); if (ed && matchMedia('(max-width: 1099px)').matches) ed.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
  }
  function renderEdit(el, data) {
    const d = ui.sel || kstToday(), x = data[d] || {}, has = !!data[d];
    const sl = (k, lb, mn, mx, v, lo, hi) => `<label class="ps-sl"><span>${lb} <b data-v="${k}">${v ?? '–'}</b></span><input type="range" name="${k}" min="${mn}" max="${mx}" step="1" value="${v ?? Math.round((mn + mx) / 2)}"${v == null ? ' data-unset' : ''}><small><i>${lo}</i><i>${hi}</i></small></label>`;
    el.innerHTML = `<form class="ps-form" data-psform>
      <div class="ps-ed-h"><h2>Daily Log</h2><h3>${md(d)}${d === kstToday() ? ' · 오늘' : ''}</h3>${has ? `<span class="sc-fine">저장됨 · ${new Date(x.updated + 9 * 36e5).toISOString().slice(5, 16).replace('T', ' ').replace('-', '/')}</span>` : '<span class="sc-fine">아직 기록 없음</span>'}</div>
      ${sl('mood', '기분', 1, 10, x.mood, '1 매우 나쁨', '10 매우 좋음')}<p class="ps-mw" data-mw>${x.mood ? MOODW[x.mood] : '막대를 움직여 고르세요'}</p>
      ${sl('stress', '스트레스', 0, 10, x.stress, '0 없음', '10 극심')}
      ${sl('energy', '에너지', 0, 10, x.energy, '0 바닥', '10 넘침')}
      <label class="ps-sleep"><span>잠잔 시간</span><input type="number" name="sleep" min="0" max="16" step="0.5" inputmode="decimal" value="${x.sleep ?? ''}" placeholder="예: 6.5"> 시간</label>
      <fieldset class="ps-emo"><legend>오늘 느낀 감정 <small>(여러 개)</small></legend>${EMO.map(([e, s]) => `<label class="${s > 0 ? 'p' : 'n'}"><input type="checkbox" name="emo" value="${e}"${(x.emo || []).includes(e) ? ' checked' : ''}><span>${e}</span></label>`).join('')}</fieldset>
      <fieldset class="ps-emo ps-actf"><legend>오늘 한 일 <small>(기분과 이어지는 활동을 찾아 줍니다)</small></legend>${ACT.map(([a, s]) => `<label class="${s > 0 ? 'p' : 'n'}"><input type="checkbox" name="act" value="${a}"${(x.act || []).includes(a) ? ' checked' : ''}><span>${a}</span></label>`).join('')}</fieldset>
      <fieldset class="ps-good"><legend>오늘 좋았던 일 세 가지 <small>(작은 것도 좋아요 · 왜 좋았는지 한 마디)</small></legend>${[0, 1, 2].map(i => `<input name="good${i}" maxlength="120" value="${esc((x.good || [])[i] || '')}" placeholder="${['예: 점심에 동료가 커피를 사 줌 — 챙겨 주는 마음', '예: 미루던 보고서를 끝냄 — 해냈다', '예: 저녁 노을이 예뻤음'][i]}">`).join('')}</fieldset>
      <fieldset class="ps-good ps-grat"><legend>감사일기 <small>(누구에게 · 무엇이 고마웠는지 세 줄)</small></legend>${[0, 1, 2].map(i => `<input name="grat${i}" maxlength="160" value="${esc((x.grat || [])[i] || '')}" placeholder="${['예: 퇴근길에 안부를 물어 준 동생에게 고맙다', '예: 오늘도 아프지 않고 일할 수 있어 감사하다', '예: 어려운 일을 같이 맡아 준 팀원에게 고맙다'][i]}">`).join('')}</fieldset>
      <details class="ps-th"${x.th && x.th.auto ? ' open' : ''}><summary>힘든 생각 정리하기 <small>(생각 기록 · 인지행동치료 기법)</small></summary>
        <label><span>① 상황 — 언제 · 어디서 · 무슨 일</span><input name="th_sit" maxlength="200" value="${esc((x.th || {}).sit || '')}" placeholder="예: 회의에서 내 안이 반려됨"></label>
        <label><span>② 그때 든 생각 (자동적 사고)</span><input name="th_auto" maxlength="200" value="${esc((x.th || {}).auto || '')}" placeholder="예: 나는 늘 이 모양이야"></label>
        <label><span>③ 그 생각을 뒷받침하는 사실 / 반대되는 사실</span><textarea name="th_ev" rows="2" maxlength="400" placeholder="예: 이번 안은 반려 / 지난달 안 두 건은 채택됨">${esc((x.th || {}).ev || '')}</textarea></label>
        <label><span>④ 친구가 같은 일을 겪었다면 해 줄 말 — 균형 잡힌 생각</span><input name="th_alt" maxlength="200" value="${esc((x.th || {}).alt || '')}" placeholder="예: 이번 안이 부족했던 거지 내가 부족한 건 아니다"></label>
        <label class="ps-sl"><span>⑤ 정리한 뒤 그 감정의 세기 <b data-v="th_after">${(x.th || {}).after ?? '–'}</b></span><input type="range" name="th_after" min="0" max="10" step="1" value="${(x.th || {}).after ?? 5}"${(x.th || {}).after == null ? ' data-unset' : ''}><small><i>0 거의 없음</i><i>10 아주 셈</i></small></label>
      </details>
      <label class="ps-memo"><span>무슨 일이 있었나 · 떠오른 생각</span><textarea name="memo" rows="4" maxlength="2000" placeholder="기분을 바꾼 일, 마음에 남은 말, 내일 해 볼 것">${esc(x.memo || '')}</textarea></label>
      <div class="ps-act">${has ? '<button type="button" class="btn ghost" data-psdel>이 날 기록 지우기</button>' : ''}<button class="btn ink">${has ? '고친 것 저장' : '저장'}</button></div>
    </form>`;
    const f = el.querySelector('[data-psform]');
    f.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { r.removeAttribute('data-unset'); f.querySelector(`[data-v="${r.name}"]`).textContent = r.value; if (r.name === 'mood') f.querySelector('[data-mw]').textContent = MOODW[+r.value]; });
    f.onsubmit = e => {
      e.preventDefault(); const g = n => { const r = f.elements[n]; return r.hasAttribute('data-unset') ? (x[n] ?? null) : +r.value; };
      const sv = f.elements.sleep.value.trim(), memo = f.elements.memo.value.trim(), emo = [...f.querySelectorAll('[name=emo]:checked')].map(c => c.value);
      const act = [...f.querySelectorAll('[name=act]:checked')].map(c => c.value), good = [0, 1, 2].map(i => f.elements['good' + i].value.trim()), grat = [0, 1, 2].map(i => f.elements['grat' + i].value.trim());
      const tv = n => f.elements[n].value.trim(), ta = f.elements.th_after, th = { sit: tv('th_sit'), auto: tv('th_auto'), ev: tv('th_ev'), alt: tv('th_alt'), after: ta.hasAttribute('data-unset') ? ((x.th || {}).after ?? null) : +ta.value };
      const rec = Object.assign({}, x, { mood: g('mood'), stress: g('stress'), energy: g('energy'), sleep: sv === '' ? null : Math.max(0, Math.min(16, +sv)), emo, act, good: good.some(Boolean) ? good : [], grat: grat.some(Boolean) ? grat : [], th: th.sit || th.auto || th.ev || th.alt ? th : null, memo, updated: Date.now() }); // 자가 점검(chk) 등은 그대로 둠
      if (rec.mood == null) { H.toast('기분 막대를 한 번 움직여 골라 주세요', 2000); return; }
      const all = Object.assign({}, H.get()); all[d] = rec; H.set(all); H.toast(`${md(d)} 기록을 저장했습니다`, 1600); paintAll();
      if (RISK.test(memo + ' ' + th.auto) || rec.mood <= 2) H.toast('많이 힘든 날이네요. 24시간 상담 109 · 1577-0199', 4000);
    };
    const del = el.querySelector('[data-psdel]'); if (del) del.onclick = async () => { if (!(await H.confirm(`${md(d)} 기록을 지울까요?`, '지우면 되돌릴 수 없습니다.', '지우기'))) return; const all = Object.assign({}, H.get()); delete all[d]; H.tomb(d); H.set(all); paintAll(); };
  }
  /* ---------- 마음 도구: 호흡 · 도움받을 곳과 근거 (맨 아래) ---------- */
  function renderTools(el) {
    el.innerHTML = `<div class="ps-tl">
        <div class="ps-tcard"><h3>5분 호흡</h3><p class="sc-fine">두 번 들이쉬고 길게 내쉬기(주기적 한숨) — 하루 5분</p><div class="ps-trow"><button type="button" class="btn sm" data-breath>시작</button></div></div>
        <div class="ps-tcard"><h3>도움받을 곳 · 근거</h3><p class="sc-fine">24시간 상담 109 · 1577-0199 · 이 탭이 기대는 연구</p><div class="ps-trow"><button type="button" class="btn sm" data-help>보기</button></div></div>
      </div>`;
    el.querySelector('[data-breath]').onclick = openBreath;
    el.querySelector('[data-help]').onclick = openHelp;
  }
  function dlg(cls, html) {
    const d = document.createElement('dialog'); d.className = 'ps-dlg ' + cls; d.innerHTML = `<button type="button" class="btn icon ghost ps-x" data-x aria-label="닫기">${H.icon('x', 18)}</button>${html}`;
    document.body.appendChild(d); d.addEventListener('close', () => d.remove()); d.querySelector('[data-x]').onclick = () => d.close();
    d.addEventListener('click', e => { if (e.target === d) d.close(); }); d.showModal(); return d;
  }
  function openBreath() {
    const d = dlg('ps-brdlg', `<h2>5분 호흡 — 주기적 한숨</h2><p class="ps-lead">코로 깊게 들이쉬고, 잠깐 한 번 더 들이쉬어 폐를 채운 뒤, 입으로 천천히 길게 내쉽니다. 내쉬는 숨이 들이쉬는 숨보다 길게.</p>
      <div class="ps-br"><div class="ps-orb" data-orb></div><p class="ps-phase" data-ph>준비되면 시작</p><p class="ps-left" data-left>5:00</p></div>
      <div class="ps-act"><button type="button" class="btn ink" data-go>시작</button></div>
      <p class="sc-fine" style="text-align:left">근거: Balban 외(2023, Cell Reports Medicine) 무작위 비교 연구에서 하루 5분 주기적 한숨이 같은 시간의 마음챙김 명상보다 기분 개선 · 호흡수 감소가 컸습니다. 어지러우면 멈추고 평소대로 숨 쉬세요.</p>`);
    const orb = d.querySelector('[data-orb]'), ph = d.querySelector('[data-ph]'), lf = d.querySelector('[data-left]'), go = d.querySelector('[data-go]');
    const STEP = [['들이쉬기 (코)', 2000, 'in'], ['한 번 더 들이쉬기', 1000, 'in2'], ['길게 내쉬기 (입)', 5000, 'out']];
    let t0 = 0, run = false, tm = 0, i = 0, cyc = 0;
    const tick = () => { if (!run) return; const el = Date.now() - t0, left = Math.max(0, 300000 - el); lf.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')} · ${cyc}회`; if (!left) { stop(true); return; } };
    const step = () => { if (!run) return; const [t, ms, c] = STEP[i]; ph.textContent = t; orb.className = 'ps-orb ' + c; orb.style.transitionDuration = ms + 'ms'; tm = setTimeout(() => { i = (i + 1) % STEP.length; if (!i) cyc++; step(); }, ms); };
    let iv = 0; const stop = done => { run = false; clearTimeout(tm); clearInterval(iv); orb.className = 'ps-orb'; go.textContent = '다시 시작'; ph.textContent = done ? '잘 하셨습니다. 5분을 채웠습니다.' : '멈췄습니다';
      if (done || Date.now() - t0 > 60000) { const td = kstToday(), all = Object.assign({}, H.get()), x = Object.assign({}, all[td] || {}); x.act = [...new Set([...(x.act || []), '호흡 · 명상'])]; x.updated = Date.now(); all[td] = x; H.set(all); H.toast('오늘 한 일에 "호흡 · 명상"을 넣었습니다', 1800); paintAll(); } };
    go.onclick = () => { if (run) { stop(false); return; } run = true; t0 = Date.now(); i = 0; cyc = 0; go.textContent = '멈추기'; step(); iv = setInterval(tick, 500); tick(); };
    d.addEventListener('close', () => { if (run) stop(false); });
  }
  function openHelp() {
    dlg('ps-helpdlg', `<h2>도움받을 곳</h2>
      <ul class="ps-help"><li><a href="tel:109"><b>109</b></a> 자살예방상담전화 · 24시간 (2024년 1월부터 운영, 보건복지부)</li><li><a href="tel:15770199"><b>1577-0199</b></a> 정신건강위기상담전화 · 24시간 · 지역 정신건강복지센터로 연결</li><li><b>119 · 112</b> 지금 위험할 때</li>
        <li><a href="https://www.mentalhealth.go.kr" target="_blank" rel="noopener">국가정신건강정보포털</a> · <a href="https://www.ncmh.go.kr" target="_blank" rel="noopener">국립정신건강센터</a> — 정보 · 가까운 센터 찾기</li></ul>
      <h2>이 탭이 기대는 근거</h2>
      <ul class="ps-refs">
        <li><b>오늘 한 일 · 활동과 기분</b> — 행동 활성화: 기분이 좋아질 때까지 기다리지 않고, 기분을 돕는 활동을 먼저 계획하는 우울 치료 기법(메타분석에서 효과 보고: Cuijpers 외 2007, Ekers 외 2014). <i>이번에 원문은 확인하지 못함.</i></li>
        <li><b>좋았던 일 세 가지</b> — Seligman 외(2005, American Psychologist): 1주 동안 매일 적은 집단에서 행복감 증가 · 우울 증상 감소가 6개월까지 이어짐. 이후 반복 연구 결과는 엇갈림(위약 대조군과 차이가 작다는 연구도 있음).</li>
        <li><b>감사일기</b> — 매주 감사한 일을 적은 집단에서 삶의 만족감 · 낙관이 높아졌다는 실험(Emmons · McCullough, 2003). 이후 메타분석에서는 효과가 작다는 결과도 있음. <i>원문 확인 못 함.</i></li>
        <li><b>힘든 생각 정리</b> — 인지행동치료의 생각 기록(상황 → 자동적 사고 → 근거 → 균형 잡힌 생각). 혼자 쓰는 연습 도구이며 치료를 대신하지 않음.</li>
        <li><b>감정 고르기 · 메모</b> — 감정을 말로 붙이는 것(정서 명명)이 감정 반응을 누그러뜨린다는 뇌 영상 연구(Lieberman 외, 2007). <i>원문 확인 못 함.</i></li>
        <li><b>5분 호흡</b> — Balban 외(2023, Cell Reports Medicine) 원격 무작위 비교 연구: 하루 5분 주기적 한숨이 마음챙김 명상보다 기분 개선이 큼(p &lt; 0.05). 같은 연구실 연구로 독립 반복 검증은 아직 없음.</li>
        <li><b>수면 · 위험 신호</b> — 수면과 기분의 관계, 2주 넘는 우울 증상은 전문가 확인 권장(우울 선별 검사들이 쓰는 2주 기준).</li>
      </ul><p class="sc-fine" style="text-align:left">확인 기준일 2026-11-15. 이 탭은 진단 · 치료 도구가 아닙니다.</p>`);
  }
  let root = null;
  function paintAll() {
    if (!root) return; const data = H.get();
    renderTop(root.querySelector('#psTop'), data); renderTools(root.querySelector('#psTools')); renderCal(root.querySelector('#psCal'), data); renderEdit(root.querySelector('#psEdit'), data);
  }
  return {
    init(h) { H = h; },
    render(el) {
      if (!el.querySelector('#psTop')) el.innerHTML = '<section class="ps-top" id="psTop"></section><div class="ps-low"><section class="ps-cal" id="psCal"></section><section class="ps-edit" id="psEdit"></section></div><section class="ps-tools" id="psTools"></section>';
      root = el; paintAll();
    },
    _analyze: analyze, // 시험용
  };
})();
