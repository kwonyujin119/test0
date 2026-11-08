/* SECRET — 주식 투자 AI 어시스턴트 (관리자 전용)
   · 대화: 사용자가 등록한 AI API(Claude 기본 · OpenAI 호환)로 묻고 답한다. AI 는 등록한 시세 API 를 도구로 불러 숫자를 확인하고,
     Claude 는 웹 검색으로 최신 뉴스 · 공시를 찾는다. 답은 "결론 · 근거 · 반대 근거 · 시나리오 · 실행 계획" 틀로.
   · 관심 종목 · 보유: 시세를 불러 손익을 보고, AI 에게 점검을 맡긴다.
   · 매매 계획 계산기: 감수할 손실에서 거꾸로 수량을 정하고, 손익비 · 승률로 기대값을 본다.
   · API 키는 이 브라우저(localStorage)에만 둔다. 서버 · GitHub 로 보내지 않는다. 잠금 암호를 걸면 AES-GCM 으로 감싸 둔다.
   주문(매수 · 매도) 기능은 없다 — 조회와 판단 도움만. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const ICO = {
    send: '<path d="M5 12h13"/><path d="m12 5 7 7-7 7"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    sparkle: '<path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8Z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4Z"/>',
    trend: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M8 16h.01"/><path d="M12 16h.01"/><path d="M16 16h.01"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z"/><path d="M4 19V5"/><path d="M8 7h7"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/><path d="M20 20v-4h-4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>',
    alert: '<path d="M12 4 2.5 20h19Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  };
  for (const k in ICO) if (!ICONS[k]) ICONS[k] = ICO[k];
  document.querySelectorAll('[data-ic]').forEach(n => { if (ICO[n.dataset.ic]) n.innerHTML = icon(n.dataset.ic); }); // 앞서 빈 칸으로 채워진 자리를 다시 그림

  /* ---------- 입장 ---------- */
  if (!Access.isAdmin) {
    $('scGate').hidden = false; fillIcons($('scGate'));
    $('gateIn').onclick = async () => { if (await Access.prompt()) location.reload(); };
    return;
  }
  $('scApp').hidden = false;
  $('roleChip').innerHTML = Access.chip();

  /* ---------- 저장 ---------- */
  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  const K_CFG = 'sec:cfg', K_CHATS = 'sec:chats', K_WATCH = 'sec:watch', K_CALC = 'sec:calc';
  const cfg = Object.assign({ apis: [], ai: '', web: true, lock: null }, LS.get(K_CFG, {}));
  let chats = LS.get(K_CHATS, []);
  let watch = LS.get(K_WATCH, { items: [], quotes: {} });
  const saveCfg = () => LS.set(K_CFG, cfg);
  function saveChats() {
    chats.sort((a, b) => b.updated - a.updated); chats = chats.slice(0, 40);
    while (!LS.set(K_CHATS, chats) && chats.length > 1) chats.pop(); // 저장 공간이 모자라면 오래된 대화부터 뺀다
  }
  const saveWatch = () => LS.set(K_WATCH, watch);

  /* ---------- API 종류 ---------- */
  const TYPES = {
    claude: { kind: 'ai', name: 'Claude (Anthropic)', model: 'claude-opus-5-5', keyUrl: 'https://console.anthropic.com/settings/keys', note: '웹 검색 · 시세 도구 · 실시간 답변을 모두 씁니다. 기본 모델 Claude Opus 5.5.' },
    openai: { kind: 'ai', name: 'OpenAI', base: 'https://api.openai.com/v1', keyUrl: 'https://platform.openai.com/api-keys', note: '시세 도구를 씁니다 (웹 검색 없음). 모델 이름을 넣어 주세요.' },
    gemini: { kind: 'ai', name: 'Google Gemini', base: 'https://generativelanguage.googleapis.com/v1beta/openai', keyUrl: 'https://aistudio.google.com/apikey', note: 'OpenAI 호환 주소로 연결합니다. 모델 이름을 넣어 주세요.' },
    compat: { kind: 'ai', name: '기타 AI (OpenAI 호환)', base: '', note: 'chat/completions 를 받는 주소(…/v1)와 모델 이름을 넣습니다.' },
    finnhub: { kind: 'data', name: 'Finnhub', caps: ['quote', 'news'], keyUrl: 'https://finnhub.io/dashboard', note: '현재가 · 회사 뉴스 (무료: 분당 60회, 주로 미국 종목).' },
    twelvedata: { kind: 'data', name: 'Twelve Data', caps: ['quote', 'history'], keyUrl: 'https://twelvedata.com/account/api-keys', note: '현재가 · 일봉 (무료: 하루 800회). 한국 종목은 요금제에 따라 다릅니다.' },
    alphavantage: { kind: 'data', name: 'Alpha Vantage', caps: ['quote', 'history', 'news'], keyUrl: 'https://www.alphavantage.co/support/#api-key', note: '현재가 · 일봉 · 뉴스 감성 (무료: 하루 25회).' },
    custom: { kind: 'data', name: '사용자 정의 (REST)', caps: ['custom'], note: '주소에 {symbol} 과 {key} 를 넣으면 그 자리에 종목과 키가 들어갑니다. 받은 내용을 AI 가 읽습니다.' },
  };
  const isAI = a => TYPES[a.type] && TYPES[a.type].kind === 'ai';
  const aiApis = () => cfg.apis.filter(a => isAI(a) && a.on !== false);
  const dataApis = () => cfg.apis.filter(a => !isAI(a) && a.on !== false);
  const activeAI = () => aiApis().find(a => a.id === cfg.ai) || aiApis()[0] || null;
  const dataFor = cap => dataApis().find(a => (TYPES[a.type].caps || []).includes(cap));

  /* ---------- 키 잠금 (선택) ---------- */
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = u8 => btoa(String.fromCharCode(...new Uint8Array(u8)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  let lockKey = null, keyMem = null; // 풀어 둔 동안만 메모리에
  async function derive(pass, salt) {
    const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function sealKeys() {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, lockKey, enc.encode(JSON.stringify(keyMem)));
    cfg.lock.iv = b64(iv); cfg.lock.data = b64(data); saveCfg();
  }
  async function unlock() {
    if (!cfg.lock || keyMem) return true;
    const pass = await askPass('API 키 잠금 풀기', '잠금 암호를 넣어 주세요. 이 화면을 닫을 때까지 풀린 채로 둡니다.');
    if (pass == null) return false;
    try {
      const k = await derive(pass, unb64(cfg.lock.salt));
      const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(cfg.lock.iv) }, k, unb64(cfg.lock.data));
      lockKey = k; keyMem = JSON.parse(dec.decode(raw)); renderApis(); return true;
    } catch (e) { toast('암호가 맞지 않습니다', 2200); return false; }
  }
  async function keyOf(api) {
    if (!cfg.lock) return api.key || '';
    if (!(await unlock())) throw new Error('API 키 잠금을 풀지 않았습니다');
    return keyMem[api.id] || '';
  }
  async function setKey(api, key) {
    if (!cfg.lock) { api.key = key; return; }
    if (!(await unlock())) throw new Error('API 키 잠금을 풀어야 저장할 수 있습니다');
    keyMem[api.id] = key; api.key = ''; await sealKeys();
  }

  /* ---------- 작은 창 ---------- */
  function dialog(html, cls) {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${cls || 'sc-dlg'}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(bg); fillIcons(bg);
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); bg.dispatchEvent(new Event('closed')); } };
    document.addEventListener('keydown', onKey, true);
    bg.addEventListener('mousedown', e => { if (e.target === bg) { close(); bg.dispatchEvent(new Event('closed')); } });
    return { el: bg.firstElementChild, bg, close };
  }
  function askPass(title, desc, twice) {
    return new Promise(res => {
      const d = dialog(`<h3>${esc(title)}</h3><p class="modal-desc">${esc(desc)}</p><form class="sc-form"><label>암호<input type="password" id="pw1" autocomplete="new-password" required minlength="4"></label>${twice ? '<label>한 번 더<input type="password" id="pw2" autocomplete="new-password" required></label>' : ''}<div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">확인</button></div></form>`, 'ask');
      const f = d.el.querySelector('form'); setTimeout(() => d.el.querySelector('#pw1').focus(), 30);
      let done = false; const fin = v => { if (done) return; done = true; d.close(); res(v); };
      d.bg.addEventListener('closed', () => fin(null)); d.el.querySelector('[data-x]').onclick = () => fin(null);
      f.onsubmit = e => { e.preventDefault(); const a = d.el.querySelector('#pw1').value; if (twice && a !== d.el.querySelector('#pw2').value) { toast('두 암호가 다릅니다', 2000); return; } fin(a); };
    });
  }
  function confirmBox(title, desc, ok) {
    return new Promise(res => {
      const d = dialog(`<h3>${esc(title)}</h3><p class="modal-desc">${esc(desc)}</p><div class="actions"><button class="btn" data-x>취소</button><button class="btn ink" data-ok>${esc(ok || '확인')}</button></div>`, 'ask');
      let done = false; const fin = v => { if (done) return; done = true; d.close(); res(v); };
      d.bg.addEventListener('closed', () => fin(false)); d.el.querySelector('[data-x]').onclick = () => fin(false); d.el.querySelector('[data-ok]').onclick = () => fin(true);
    });
  }

  /* ---------- 숫자 ---------- */
  const num = (v, d = 2) => (v == null || !isFinite(v)) ? '–' : Number(v).toLocaleString('ko-KR', { maximumFractionDigits: d });
  const pct = (v, d = 2) => (v == null || !isFinite(v)) ? '–' : (v > 0 ? '+' : '') + Number(v).toFixed(d) + '%';
  const cls = v => v > 0 ? 'up' : v < 0 ? 'down' : '';

  /* =====================================================================
     시세 API (도구가 부르는 쪽)
     ===================================================================== */
  async function getJSON(url) {
    let r; try { r = await fetch(url); } catch (e) { throw new Error('시세 API 에 연결하지 못했습니다 (네트워크 또는 브라우저 접근 차단)'); }
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { }
    if (!r.ok) throw new Error(`시세 API 오류 ${r.status}: ${(j && (j.message || j.error)) || t.slice(0, 160)}`);
    if (!j) throw new Error('시세 API 가 JSON 이 아닌 답을 보냈습니다');
    return j;
  }
  const ymd = d => d.toISOString().slice(0, 10);
  const E = encodeURIComponent;
  const DATA = {
    finnhub: {
      async quote(k, s) {
        const j = await getJSON(`https://finnhub.io/api/v1/quote?symbol=${E(s)}&token=${E(k)}`);
        if (!j || !j.c) throw new Error(`${s}: 시세가 없습니다 (종목 코드를 확인하세요)`);
        return { symbol: s, price: j.c, change: j.d, changePct: j.dp, open: j.o, high: j.h, low: j.l, prevClose: j.pc, time: j.t ? new Date(j.t * 1000).toISOString() : '', source: 'Finnhub' };
      },
      async news(k, s, days) {
        const to = new Date(), from = new Date(Date.now() - days * 864e5);
        const j = await getJSON(`https://finnhub.io/api/v1/company-news?symbol=${E(s)}&from=${ymd(from)}&to=${ymd(to)}&token=${E(k)}`);
        return (Array.isArray(j) ? j : []).slice(0, 12).map(n => ({ title: n.headline, source: n.source, url: n.url, time: n.datetime ? new Date(n.datetime * 1000).toISOString() : '', summary: String(n.summary || '').slice(0, 280) }));
      },
    },
    twelvedata: {
      async quote(k, s) {
        const j = await getJSON(`https://api.twelvedata.com/quote?symbol=${E(s)}&apikey=${E(k)}`);
        if (j.status === 'error') throw new Error(`Twelve Data: ${j.message}`);
        return { symbol: j.symbol || s, name: j.name, exchange: j.exchange, currency: j.currency, price: +j.close, change: +j.change, changePct: +j.percent_change, open: +j.open, high: +j.high, low: +j.low, prevClose: +j.previous_close, week52: j.fifty_two_week ? { low: +j.fifty_two_week.low, high: +j.fifty_two_week.high } : undefined, time: j.datetime, source: 'Twelve Data' };
      },
      async history(k, s, days) {
        const j = await getJSON(`https://api.twelvedata.com/time_series?symbol=${E(s)}&interval=1day&outputsize=${Math.min(days, 5000)}&apikey=${E(k)}`);
        if (j.status === 'error') throw new Error(`Twelve Data: ${j.message}`);
        return (j.values || []).map(v => ({ t: v.datetime, o: +v.open, h: +v.high, l: +v.low, c: +v.close, v: +v.volume })).reverse();
      },
    },
    alphavantage: {
      _chk(j) { const m = j.Note || j.Information || j['Error Message']; if (m) throw new Error('Alpha Vantage: ' + m); },
      async quote(k, s) {
        const j = await getJSON(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${E(s)}&apikey=${E(k)}`); this._chk(j);
        const q = j['Global Quote'] || {}; if (!q['05. price']) throw new Error(`${s}: 시세가 없습니다`);
        return { symbol: q['01. symbol'] || s, price: +q['05. price'], change: +q['09. change'], changePct: parseFloat(q['10. change percent']), open: +q['02. open'], high: +q['03. high'], low: +q['04. low'], prevClose: +q['08. previous close'], time: q['07. latest trading day'], source: 'Alpha Vantage' };
      },
      async history(k, s, days) {
        const j = await getJSON(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${E(s)}&outputsize=${days > 100 ? 'full' : 'compact'}&apikey=${E(k)}`); this._chk(j);
        const ts = j['Time Series (Daily)'] || {};
        return Object.keys(ts).sort().slice(-days).map(t => ({ t, o: +ts[t]['1. open'], h: +ts[t]['2. high'], l: +ts[t]['3. low'], c: +ts[t]['4. close'], v: +ts[t]['5. volume'] }));
      },
      async news(k, s) {
        const j = await getJSON(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${E(s)}&limit=20&apikey=${E(k)}`); this._chk(j);
        return (j.feed || []).slice(0, 12).map(n => ({ title: n.title, source: n.source, url: n.url, time: n.time_published, sentiment: n.overall_sentiment_label, summary: String(n.summary || '').slice(0, 280) }));
      },
    },
    custom: {
      async custom(k, s, api) {
        const url = String(api.base || '').replace(/\{symbol\}/g, E(s)).replace(/\{key\}/g, E(k));
        let r; try { r = await fetch(url); } catch (e) { throw new Error('사용자 정의 API 에 연결하지 못했습니다 (브라우저 접근 차단일 수 있습니다)'); }
        const t = await r.text(); if (!r.ok) throw new Error(`사용자 정의 API 오류 ${r.status}: ${t.slice(0, 160)}`);
        return { url: url.replace(E(k), '****'), body: t.slice(0, 8000) };
      },
    },
  };
  async function callData(cap, ...args) {
    const api = dataFor(cap); if (!api) throw new Error(`'${cap}' 를 주는 시세 API 가 등록되어 있지 않습니다`);
    const k = await keyOf(api);
    return DATA[api.type][cap](k, ...args, api);
  }

  /* 일봉에서 지표를 계산 (AI 가 숫자를 지어내지 않도록, 계산은 여기서) */
  function analyze(bars) {
    const c = bars.map(b => b.c).filter(isFinite); const n = c.length; if (n < 2) return { bars: n };
    const last = c[n - 1], ret = k => n > k ? (last / c[n - 1 - k] - 1) * 100 : null;
    const sma = k => n >= k ? c.slice(-k).reduce((a, b) => a + b, 0) / k : null;
    let rsi = null;
    if (n > 15) { let g = 0, l = 0; for (let i = 1; i <= 14; i++) { const d = c[i] - c[i - 1]; if (d > 0) g += d; else l -= d; } g /= 14; l /= 14; for (let i = 15; i < n; i++) { const d = c[i] - c[i - 1]; g = (g * 13 + Math.max(d, 0)) / 14; l = (l * 13 + Math.max(-d, 0)) / 14; } rsi = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
    let atr = null;
    if (n > 15) { const tr = []; for (let i = n - 14; i < n; i++) { const b = bars[i], p = bars[i - 1].c; tr.push(Math.max(b.h - b.l, Math.abs(b.h - p), Math.abs(b.l - p))); } atr = tr.reduce((a, b) => a + b, 0) / tr.length; }
    const lr = []; for (let i = Math.max(1, n - 20); i < n; i++) lr.push(Math.log(c[i] / c[i - 1]));
    const mean = lr.reduce((a, b) => a + b, 0) / lr.length, vol = Math.sqrt(lr.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, lr.length - 1)) * Math.sqrt(252) * 100;
    const hi = Math.max(...bars.map(b => b.h)), lo = Math.min(...bars.map(b => b.l));
    let peak = c[0], mdd = 0; for (const x of c) { peak = Math.max(peak, x); mdd = Math.min(mdd, (x / peak - 1) * 100); }
    const s20 = sma(20), s50 = sma(50), s200 = sma(200);
    const r2 = v => v == null ? null : Math.round(v * 100) / 100;
    return {
      from: bars[0].t, to: bars[n - 1].t, bars: n, last: r2(last),
      returnPct: { d5: r2(ret(5)), d20: r2(ret(20)), d60: r2(ret(60)), d120: r2(ret(120)), d250: r2(ret(250)) },
      sma: { d20: r2(s20), d50: r2(s50), d200: r2(s200) },
      trend: s20 && s50 ? (last > s20 && s20 > s50 ? '상승 정렬 (종가 > 20일 > 50일)' : last < s20 && s20 < s50 ? '하락 정렬 (종가 < 20일 < 50일)' : '혼조') : '자료 부족',
      rsi14: r2(rsi), atr14: r2(atr), atrPct: atr ? r2(atr / last * 100) : null, volatility20dAnnualPct: r2(vol),
      rangeHigh: r2(hi), rangeLow: r2(lo), fromHighPct: r2((last / hi - 1) * 100), maxDrawdownPct: r2(mdd),
      avgVolume20: r2(bars.slice(-20).reduce((a, b) => a + (b.v || 0), 0) / Math.min(20, n)),
      recentCloses: bars.slice(-10).map(b => [b.t, r2(b.c)]),
    };
  }

  function sizePlan({ account, risk_percent, entry, stop, target, win_rate }) {
    const per = Math.abs(entry - stop); if (!(per > 0)) throw new Error('진입가와 손절가가 같습니다');
    const riskAmt = account * risk_percent / 100, qty = Math.floor(riskAmt / per), cost = qty * entry;
    const out = { riskPerShare: per, riskAmount: Math.round(riskAmt), quantity: qty, positionCost: Math.round(cost), positionPctOfAccount: account ? +(cost / account * 100).toFixed(1) : null, stopDistancePct: +(per / entry * 100).toFixed(2), side: stop < entry ? 'long' : 'short' };
    if (target) {
      const reward = Math.abs(target - entry), R = reward / per; out.rewardRisk = +R.toFixed(2); out.profitAtTarget = Math.round(reward * qty); out.breakEvenWinRatePct = +(100 / (1 + R)).toFixed(1);
      if (win_rate) { const p = win_rate / 100; out.expectancyR = +(p * R - (1 - p)).toFixed(2); out.expectancyAmount = Math.round(out.expectancyR * riskAmt); }
    }
    return out;
  }

  /* =====================================================================
     AI 도구
     ===================================================================== */
  function toolDefs() {
    const T = [];
    const sym = { type: 'string', description: '시세 API 형식의 종목 코드. 미국은 AAPL, 한국은 등록한 API 의 형식(예: 005930.KS, 005930:KRX 등)' };
    if (dataFor('quote')) T.push({ name: 'get_quote', description: '종목의 현재가(또는 최근 종가) · 등락률 · 고가 · 저가를 등록된 시세 API 로 조회한다. 가격을 말하기 전에 반드시 이 도구로 확인한다.', input_schema: { type: 'object', properties: { symbol: sym }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('history')) T.push({ name: 'get_price_history', description: '일봉을 받아 이 앱이 직접 계산한 지표를 돌려준다: 기간 수익률(5·20·60·120·250일), 이동평균(20·50·200), 추세 정렬, RSI14, ATR14, 20일 변동성(연율), 구간 고점 대비 하락, 최대 낙폭, 최근 10일 종가.', input_schema: { type: 'object', properties: { symbol: sym, days: { type: 'integer', description: '받을 거래일 수 (60~400, 기본 260)' } }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('news')) T.push({ name: 'get_news', description: '종목의 최근 회사 뉴스 제목 · 출처 · 링크 · 요약을 시세 API 로 받는다.', input_schema: { type: 'object', properties: { symbol: sym, days: { type: 'integer', description: '최근 며칠 (1~30, 기본 7)' } }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('custom')) T.push({ name: 'fetch_custom_data', description: '사용자가 등록한 사용자 정의 API 를 종목 코드로 불러 원문(JSON 또는 텍스트)을 돌려준다.', input_schema: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'], additionalProperties: false } });
    T.push({ name: 'get_portfolio', description: '사용자가 이 앱에 적어 둔 관심 종목 · 보유 수량 · 평균 단가 · 목표가 · 손절가 · 메모와 마지막으로 불러온 시세를 돌려준다.', input_schema: { type: 'object', properties: {}, additionalProperties: false } });
    T.push({ name: 'get_journal', description: '사용자의 매매 일지: 통계(승률 · 평균 이익/손실 R · 기대값 · 손익 합계 · 평균 보유일 · 감정별 · 판 이유별 · 체크리스트를 다 지켰을 때와 아닐 때의 승률)와 최근 매매 40건(진입 · 손절 · 목표 · 청산 · 이유 · 감정 · 교훈)을 돌려준다.', input_schema: { type: 'object', properties: {}, additionalProperties: false } });
    T.push({ name: 'save_memory', description: '앞으로의 답에 계속 필요한 사용자 정보 · 선호를 한 문장으로 기억한다. 사용자가 "기억해" 라고 했거나 투자 성향 · 제약을 새로 알았을 때만 쓴다. 시세처럼 금방 바뀌는 정보나 이미 프로필에 있는 내용은 저장하지 않는다. 사용자는 나의 원칙 화면에서 보고 지울 수 있다.', input_schema: { type: 'object', properties: { text: { type: 'string', description: '기억할 한 문장' } }, required: ['text'], additionalProperties: false } });
    T.push({ name: 'position_size', description: '감수할 손실에서 거꾸로 매수 수량을 계산한다: 1주당 위험, 수량, 투입 금액과 계좌 대비 비중, 손익비(R), 손익분기 승률, 승률을 주면 1회 기대값. 비중 · 손절 · 목표를 말할 때 이 도구로 계산한다.', input_schema: { type: 'object', properties: { account: { type: 'number', description: '계좌 금액' }, risk_percent: { type: 'number', description: '한 번에 감수할 손실 % (보통 0.5~2)' }, entry: { type: 'number' }, stop: { type: 'number' }, target: { type: 'number' }, win_rate: { type: 'number', description: '예상 승률 % (선택)' } }, required: ['account', 'risk_percent', 'entry', 'stop'], additionalProperties: false } });
    return T;
  }
  const LABEL = { get_quote: '시세', get_price_history: '일봉 · 지표', get_news: '뉴스', fetch_custom_data: '사용자 API', get_portfolio: '내 종목', get_journal: '매매 일지', save_memory: '기억함', position_size: '수량 계산', web_search: '웹 검색' };
  function validate(name, input) {
    const def = toolDefs().find(t => t.name === name); if (!def) return '알 수 없는 도구';
    if (!input || typeof input !== 'object') return '입력이 비어 있습니다';
    for (const k of def.input_schema.required || []) if (input[k] == null || input[k] === '') return `${k} 가 없습니다`;
    for (const [k, s] of Object.entries(def.input_schema.properties)) if (input[k] != null && s.type === 'number' && !isFinite(+input[k])) return `${k} 는 숫자여야 합니다`;
    return '';
  }
  async function runTool(name, input) {
    const bad = validate(name, input); if (bad) throw new Error('INVALID_INPUT: ' + bad);
    const s = String(input.symbol || '').trim().toUpperCase();
    switch (name) {
      case 'get_quote': { const q = await callData('quote', s); watch.quotes[s] = { price: q.price, changePct: q.changePct, time: q.time || new Date().toISOString(), source: q.source }; saveWatch(); return q; }
      case 'get_price_history': { const d = Math.max(60, Math.min(400, +input.days || 260)); const bars = await callData('history', s, d); if (!bars.length) throw new Error(`${s}: 일봉이 없습니다`); return Object.assign({ symbol: s }, analyze(bars)); }
      case 'get_news': return { symbol: s, items: await callData('news', s, Math.max(1, Math.min(30, +input.days || 7))) };
      case 'fetch_custom_data': return await callData('custom', s);
      case 'get_journal': return { stats: jStats(), checklist: me.checklist, trades: journal.slice(-40) };
      case 'save_memory': { const t = String(input.text).trim().slice(0, 200); if (!me.notes.some(n => n.text === t)) { me.notes.push({ t: Date.now(), text: t, by: 'AI' }); me.notes = me.notes.slice(-50); saveMe(); } return { saved: t, total: me.notes.length }; }
      case 'get_portfolio': return { items: watch.items, quotes: watch.quotes, note: '수량 · 평균 단가가 0 이면 관심만 있는 종목' };
      case 'position_size': return sizePlan({ account: +input.account, risk_percent: +input.risk_percent, entry: +input.entry, stop: +input.stop, target: input.target ? +input.target : 0, win_rate: input.win_rate ? +input.win_rate : 0 });
    }
    throw new Error('알 수 없는 도구');
  }

  function systemPrompt(webOn) {
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const tools = toolDefs().map(t => t.name).concat(webOn ? ['web_search'] : []);
    return `당신은 개인 투자자의 주식 리서치 · 매매 계획 도우미입니다. 한국어로 답합니다. 오늘은 ${today}입니다.

목표: 사용자가 근거 있는 판단을 하고, 손실을 통제하고, 같은 실수를 반복하지 않게 도와 수익을 낼 가능성을 높이는 것. 수익을 약속하지 않습니다.

데이터 원칙
- 쓸 수 있는 도구: ${tools.join(', ') || '없음'}. ${dataFor('quote') ? '' : '시세 API 가 등록되어 있지 않으니, 가격을 말할 때는 웹 검색 결과나 사용자가 준 숫자만 쓰고 그 사실을 밝힙니다. '}
- 가격 · 등락률 · 지표 · 날짜는 도구 결과나 검색 결과에 있는 것만 말하고, 언제 기준인지 적습니다. 모르는 숫자는 지어내지 말고 "확인 필요"라고 씁니다.
- 지표 계산(수익률 · 이동평균 · RSI · 변동성)은 get_price_history 결과를, 비중 · 수량은 position_size 결과를 씁니다.
- 사용자의 보유 · 관심 종목이 관련되면 get_portfolio 로, 과거 매매 · 습관이 관련되면 get_journal 로 먼저 확인합니다.
- 사용자가 "기억해" 라고 하거나 앞으로 계속 필요한 사용자 정보(성향 · 제약 · 선호)를 새로 알게 되면 save_memory 로 한 문장만 저장하고, 저장했다고 짧게 말합니다.

종목 · 매매 판단을 물으면 이 순서로 짧게:
1. 한 줄 결론 (관망 · 분할 매수 검토 · 비중 축소 검토 같은 행동 단위, 확신 정도 낮음/보통/높음)
2. 근거 (데이터 · 뉴스 · 실적, 출처와 기준일)
3. 반대 근거와 위험 (무엇이 틀리면 생각을 바꿀지)
4. 시나리오: 강세 · 기본 · 약세 각각의 조건과 대략의 가격대
5. 실행 계획: 진입 조건, 손절가(근거), 목표가, 1회 감수 손실 기준의 수량 · 비중
6. 다음에 확인할 것 (실적 발표일 · 공시 · 지표 발표 등)

습관 원칙: 잦은 매매 · 몰빵 · 물타기 · 손절 미루기 · 뉴스 추격 매수의 위험을 필요할 때 짚습니다. 레버리지 · 신용 · 단기 급등주는 위험을 분명히 말합니다. 세금 · 수수료도 고려합니다.
이것은 정보 제공이며 투자 판단과 책임은 사용자에게 있다는 점을 첫 답에서 한 번만 짧게 밝힙니다. 표는 짧게, 문단은 짧게 씁니다.` + meBlock();
  }

  /* =====================================================================
     AI 호출
     ===================================================================== */
  function apiErr(status, j, who) {
    const m = j && (j.error && (j.error.message || j.error) || j.message);
    if (status === 401 || status === 403) return `${who}: API 키가 맞지 않거나 권한이 없습니다 (${status})`;
    if (status === 429) return `${who}: 요청이 너무 많거나 사용 한도를 넘었습니다. 잠시 뒤 다시 해 보세요 (429)`;
    if (status === 529 || status >= 500) return `${who}: 서비스가 잠시 바쁩니다. 잠시 뒤 다시 해 보세요 (${status})`;
    return `${who} 오류 ${status}: ${typeof m === 'string' ? m : JSON.stringify(m || '').slice(0, 200)}`;
  }

  /* Claude — Messages API 를 브라우저에서 바로 (스트리밍 · 도구 · 웹 검색). 대화 기록은 받은 그대로 덧붙이기만 한다 */
  async function claudeTurn(api, key, wire, ui, signal) {
    const webOn = cfg.web !== false;
    const tools = toolDefs().map(t => Object.assign({}, t, { eager_input_streaming: true }));
    if (webOn) tools.push({ type: 'web_search_20260209', name: 'web_search', max_uses: 6 });
    const body = {
      model: api.model || TYPES.claude.model, max_tokens: 64000, stream: true,
      system: systemPrompt(webOn), messages: wire, tools,
      thinking: { type: 'adaptive', display: 'summarized' },
      output_config: { effort: 'medium' },
      cache_control: { type: 'ephemeral' },
      fallbacks: 'default',
    };
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2026-10-21', 'anthropic-beta': 'server-side-fallback-2026-07-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify(body),
    });
    if (!r.ok) { let j = null; try { j = await r.json(); } catch (e) { } throw new Error(apiErr(r.status, j, 'Claude')); }
    const blocks = []; let stop = null, stopDetails = null;
    const reader = r.body.getReader(), td = new TextDecoder(); let buf = '';
    const handle = ev => {
      switch (ev.type) {
        case 'content_block_start': {
          const b = JSON.parse(JSON.stringify(ev.content_block)); blocks[ev.index] = b;
          if (b.type === 'tool_use' || b.type === 'server_tool_use') b._json = '';
          if (b.type === 'text' && ui.text && !/\n\n$/.test(ui.text)) ui.text += '\n\n';
          if (b.type === 'web_search_tool_result') {
            if (Array.isArray(b.content)) for (const x of b.content) if (x.url && !ui.sources.some(s => s.url === x.url)) ui.sources.push({ url: x.url, title: x.title || x.url });
            const st = ui.steps.find(s => s.id === b.tool_use_id); if (st) st.state = Array.isArray(b.content) ? 'ok' : 'bad';
          }
          break;
        }
        case 'content_block_delta': {
          const b = blocks[ev.index], d = ev.delta; if (!b) break;
          if (d.type === 'text_delta') { b.text += d.text; ui.text += d.text; }
          else if (d.type === 'input_json_delta') b._json += d.partial_json;
          else if (d.type === 'thinking_delta') { b.thinking = (b.thinking || '') + d.thinking; ui.think += d.thinking; }
          else if (d.type === 'signature_delta') b.signature = d.signature;
          else if (d.type === 'citations_delta') (b.citations = b.citations || []).push(d.citation);
          break;
        }
        case 'content_block_stop': {
          const b = blocks[ev.index];
          if (b && '_json' in b) { try { b.input = b._json ? JSON.parse(b._json) : {}; } catch (e) { b.input = {}; b._bad = true; } delete b._json; }
          if (b && b.type === 'server_tool_use') ui.steps.push({ id: b.id, name: b.name, label: (LABEL[b.name] || b.name) + (b.input && b.input.query ? ': ' + b.input.query : ''), state: 'run' });
          break;
        }
        case 'message_delta': stop = ev.delta.stop_reason; stopDetails = ev.delta.stop_details || null; break;
        case 'error': throw new Error('Claude: ' + ((ev.error && ev.error.message) || '스트림 오류'));
      }
      paint();
    };
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += td.decode(value, { stream: true });
      let i; while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
        const data = chunk.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('');
        if (data) handle(JSON.parse(data));
      }
    }
    return { content: blocks.filter(Boolean), stop, stopDetails };
  }

  async function runClaude(api, chat, ui, signal) {
    const key = await keyOf(api); if (!key) throw new Error('Claude API 키가 비어 있습니다');
    const wire = chat.wire.msgs;
    for (let step = 0; step < 16; step++) {
      const res = await claudeTurn(api, key, wire, ui, signal);
      const bad = res.content.filter(b => b._bad); bad.forEach(b => { delete b._bad; });
      wire.push({ role: 'assistant', content: res.content });
      if (res.stop !== 'tool_use' && res.stop !== 'pause_turn' && res.content.some(b => b.type === 'tool_use')) wire.pop(); // 답할 수 없는 도구 호출로 끝난 차례는 기록에 남기지 않음
      if (res.stop === 'refusal') { ui.note = '이 요청은 안전 정책 때문에 답하지 않았습니다' + (res.stopDetails && res.stopDetails.explanation ? `: ${res.stopDetails.explanation}` : '.'); break; }
      if (res.stop === 'max_tokens') { ui.note = '답이 너무 길어 중간에 멈췄습니다. "이어서" 라고 보내면 계속합니다.'; break; }
      if (res.stop === 'pause_turn') continue;
      if (res.stop !== 'tool_use') break;
      const uses = res.content.filter(b => b.type === 'tool_use');
      const results = await Promise.all(uses.map(async u => {
        const st = { id: u.id, name: u.name, label: (LABEL[u.name] || u.name) + (u.input && u.input.symbol ? ' ' + u.input.symbol : ''), state: 'run' }; ui.steps.push(st); paint();
        try {
          if (bad.includes(u)) throw new Error('INVALID_JSON: 도구 입력이 올바른 JSON 이 아닙니다. 다시 보내 주세요');
          const out = await runTool(u.name, u.input); st.state = 'ok'; paint();
          return { type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(out) };
        } catch (e) { st.state = 'bad'; st.err = e.message; paint(); return { type: 'tool_result', tool_use_id: u.id, content: e.message, is_error: true }; }
      }));
      wire.push({ role: 'user', content: results }); // 도구 결과는 한 번에 한 메시지로
    }
  }

  /* OpenAI 호환 (OpenAI · Gemini · 기타) — 도구 사용, 스트리밍 없이 */
  async function runCompat(api, chat, ui, signal) {
    const key = await keyOf(api); const base = String(api.base || TYPES[api.type].base || '').replace(/\/+$/, '');
    if (!base) throw new Error('API 주소가 비어 있습니다'); if (!api.model) throw new Error('모델 이름이 비어 있습니다 (API 연결에서 넣어 주세요)');
    const wire = chat.wire.msgs;
    const tools = toolDefs().map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }));
    for (let step = 0; step < 12; step++) {
      ui.steps.push({ id: 'think' + step, name: 'think', label: '생각 중', state: 'run' }); paint();
      let r; try { r = await fetch(base + '/chat/completions', { method: 'POST', signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ model: api.model, messages: [{ role: 'system', content: systemPrompt(false) }].concat(wire), tools }) }); }
      finally { ui.steps = ui.steps.filter(s => s.name !== 'think'); }
      if (!r.ok) { let j = null; try { j = await r.json(); } catch (e) { } throw new Error(apiErr(r.status, j, TYPES[api.type].name)); }
      const j = await r.json(); const ch = j.choices && j.choices[0]; if (!ch) throw new Error('빈 답을 받았습니다');
      const m = ch.message || {}; wire.push(m);
      if (m.content) { ui.text += (ui.text ? '\n\n' : '') + m.content; paint(); }
      if (!(m.tool_calls && m.tool_calls.length)) break;
      for (const tc of m.tool_calls) {
        let args = {}; try { args = JSON.parse(tc.function.arguments || '{}'); } catch (e) { }
        const st = { id: tc.id, name: tc.function.name, label: (LABEL[tc.function.name] || tc.function.name) + (args.symbol ? ' ' + args.symbol : ''), state: 'run' }; ui.steps.push(st); paint();
        let content; try { content = JSON.stringify(await runTool(tc.function.name, args)); st.state = 'ok'; } catch (e) { content = 'ERROR: ' + e.message; st.state = 'bad'; st.err = e.message; }
        wire.push({ role: 'tool', tool_call_id: tc.id, content }); paint();
      }
    }
  }

  /* =====================================================================
     대화 화면
     ===================================================================== */
  let cur = null, busy = null;
  const newChat = () => ({ id: uid(), title: '새 대화', updated: Date.now(), view: [], wire: { ai: '', msgs: [] } });
  function openChat(id) { cur = chats.find(c => c.id === id) || null; renderChat(); renderChatList(); }

  /* 고른 AI 가 바뀌면 지금까지의 글만으로 대화 기록을 새로 만든다 (다른 회사의 형식은 섞지 않음) */
  function ensureWire(chat, api) {
    if (chat.wire.ai === api.id) return;
    const msgs = [];
    for (let i = 0; i + 1 < chat.view.length; i += 2) {
      const u = chat.view[i], a = chat.view[i + 1];
      if (u.role !== 'user' || !a || a.role !== 'assistant' || !a.text) continue;
      msgs.push({ role: 'user', content: u.text }, { role: 'assistant', content: a.text });
    }
    chat.wire = { ai: api.id, msgs };
  }

  async function send(text) {
    text = String(text || '').trim(); if (!text || busy) return;
    const api = activeAI();
    if (!api) { toast('먼저 AI API 를 등록해 주세요', 2400); show('apis'); openAdd('claude'); return; }
    if (!cur) { cur = newChat(); chats.unshift(cur); }
    const chat = cur;
    ensureWire(chat, api);
    if (!chat.view.length) chat.title = text.replace(/\s+/g, ' ').slice(0, 40);
    chat.view.push({ role: 'user', text, t: Date.now() });
    const ui = { role: 'assistant', text: '', think: '', steps: [], sources: [], ai: api.name, live: true }; chat.view.push(ui);
    chat.updated = Date.now();
    const wireLen = chat.wire.msgs.length;
    chat.wire.msgs.push({ role: 'user', content: text });
    const ctrl = new AbortController(); busy = ctrl; setBusy(true);
    renderChat(); renderChatList();
    try {
      if (api.type === 'claude') await runClaude(api, chat, ui, ctrl.signal); else await runCompat(api, chat, ui, ctrl.signal);
    } catch (e) {
      if (e.name === 'AbortError') ui.note = '멈췄습니다.';
      else ui.error = /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? `${api.name} 에 연결하지 못했습니다. 인터넷 연결을 확인하고, 이 API 가 브라우저에서 바로 부르는 것을 허용하는지 확인하세요.` : e.message;
      /* 실패 · 멈춘 차례는 API 기록에서 통째로 걷어낸다 (뒤에서 덧붙인 것만): 답 없는 도구 호출로 끝나는 기록을 다음 질문에 보내지 않게.
         화면에는 받은 만큼 남겨 둔다 */
      chat.wire.msgs.length = wireLen;
    } finally {
      ui.live = false; busy = null; setBusy(false); chat.updated = Date.now(); saveChats(); renderChat(); renderChatList();
    }
  }
  function setBusy(on) { $('btnSend').hidden = on; $('btnStop').hidden = !on; }
  $('btnStop').onclick = () => { if (busy) busy.abort(); };

  /* 아주 작은 마크다운 → HTML (먼저 모두 이스케이프) */
  function md(src) {
    const lines = esc(src).split('\n'); let out = '', list = null, para = [];
    const inline = s => s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const flushP = () => { if (para.length) { out += `<p>${inline(para.join('<br>'))}</p>`; para = []; } };
    const flushL = () => { if (list) { out += `</${list}>`; list = null; } };
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/^```/.test(l)) { flushP(); flushL(); let code = ''; i++; while (i < lines.length && !/^```/.test(lines[i])) code += lines[i++] + '\n'; out += `<pre><code>${code}</code></pre>`; continue; }
      if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        flushP(); flushL(); const row = s => s.trim().replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()));
        out += '<table><thead><tr>' + row(l).map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>'; i += 2;
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) out += '<tr>' + row(lines[i++]).map(c => `<td>${c}</td>`).join('') + '</tr>';
        out += '</tbody></table>'; i--; continue;
      }
      let m;
      if ((m = l.match(/^(#{1,4})\s+(.*)$/))) { flushP(); flushL(); const h = Math.min(4, m[1].length + 1); out += `<h${h}>${inline(m[2])}</h${h}>`; continue; }
      if (/^\s*(---|\*\*\*)\s*$/.test(l)) { flushP(); flushL(); out += '<hr>'; continue; }
      if ((m = l.match(/^\s*([-*•]|\d+[.)])\s+(.*)$/))) { flushP(); const t = /\d/.test(m[1]) ? 'ol' : 'ul'; if (list !== t) { flushL(); out += `<${t}>`; list = t; } out += `<li>${inline(m[2])}</li>`; continue; }
      if (!l.trim()) { flushP(); flushL(); continue; }
      flushL(); para.push(l);
    }
    flushP(); flushL(); return out;
  }

  const PROMPTS = [
    ['오늘 시장 한눈에', '미국 · 한국 증시와 금리 · 환율 · 유가 흐름, 오늘 주목할 일정', '오늘 미국과 한국 증시 흐름, 금리 · 환율 · 유가, 그리고 이번 주 주목할 일정(실적 · 지표 발표)을 근거와 함께 요약해 줘.'],
    ['내 종목 점검', '보유 · 관심 종목의 추세 · 위험 · 다음 확인할 일', '내 관심 종목과 보유 종목을 get_portfolio 로 보고, 각 종목의 시세 · 추세 · 위험과 다음에 확인할 일을 표로 점검해 줘. 손절가나 비중이 위험해 보이면 짚어 줘.'],
    ['매수 전 따져 보기', '살까 말까 고민되는 종목을 결론 · 근거 · 반대 근거로', '매수를 고민하는 종목이 있어. 종목은 '],
    ['손절 · 목표가 · 수량', '감수할 손실에서 거꾸로 수량과 비중 계산', '계좌 금액 1000만 원, 한 번에 1% 까지 손실을 감수할 때, 종목 '],
    ['실적 발표 전 위험', '발표일 · 시장 기대 · 주가 반응 시나리오', '다가오는 실적 발표 전에 위험을 점검하고 싶어. 종목은 '],
    ['내 매매 습관 진단', '최근 매매를 적으면 잦은 매매 · 손절 미루기 등을 짚어 줌', '내 최근 매매를 적을 테니 습관의 문제(잦은 매매, 손절 미루기, 추격 매수, 몰빵 등)를 진단하고 고칠 규칙을 3개 만들어 줘.\n- '],
  ];
  function paint() { if (paint._r) return; paint._r = requestAnimationFrame(() => { paint._r = 0; renderMsgs(); }); }
  function renderMsgs() {
    const box = $('msgs'); const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    if (!cur || !cur.view.length) {
      const api = activeAI();
      box.innerHTML = `<div class="sc-empty">
        <h2>무엇을 살펴볼까요?</h2><p>시세 API 로 숫자를 확인하고, 결론 · 근거 · 반대 근거 · 실행 계획으로 답합니다.</p>
        ${api ? '' : `<div class="sc-setup">${icon('key', 16)} <b>AI API 가 아직 없습니다.</b> 왼쪽 아래 <b>API 연결</b>에서 Claude 등 AI 키를 + 로 등록하세요. 시세 API(Finnhub · Twelve Data · Alpha Vantage)를 함께 등록하면 AI 가 실제 숫자를 불러 씁니다.</div>`}
        ${me.prompts.length ? `<div class="sc-mine"><span>내 질문</span>${me.prompts.map((q, i) => `<button type="button" data-mq="${i}" title="${esc(q.text)}">${esc(q.title)}</button>`).join('')}</div>` : ''}
        <div class="sc-prompts">${PROMPTS.map((p, i) => `<button class="sc-prompt" data-p="${i}"><b>${p[0]}</b><span>${p[1]}</span></button>`).join('')}</div></div>`;
      box.querySelectorAll('[data-mq]').forEach(b => b.onclick = () => usePrompt(me.prompts[+b.dataset.mq].text));
      box.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const p = PROMPTS[+b.dataset.p][2]; const q = $('q'); q.value = p; grow(); q.focus(); q.setSelectionRange(p.length, p.length); if (!/ $|- $/.test(p)) send(p).then(() => { q.value = ''; grow(); }); });
      return;
    }
    box.innerHTML = cur.view.map(m => {
      if (m.role === 'user') return `<div class="sc-user"><div>${esc(m.text)}</div></div>`;
      const steps = (m.steps || []).filter(s => s.name !== 'think' || m.live);
      return `<div class="sc-bot">
        ${steps.length ? `<div class="sc-steps">${steps.map(s => `<span class="sc-step ${s.state === 'ok' ? 'ok' : s.state === 'bad' ? 'bad' : ''}" title="${esc(s.err || '')}">${icon(s.state === 'ok' ? 'check' : s.state === 'bad' ? 'alert' : s.name === 'web_search' ? 'globe' : 'refresh', 13)}${esc(s.label)}</span>`).join('')}</div>` : ''}
        ${m.think ? `<details class="sc-think"${m.live && !m.text ? ' open' : ''}><summary>생각 요약</summary><div>${esc(m.think)}</div></details>` : ''}
        <div class="${m.live ? 'sc-cursor' : ''}">${md(m.text || '')}</div>
        ${m.note ? `<p class="sc-fine" style="text-align:left;margin:6px 0 0">${esc(m.note)}</p>` : ''}
        ${m.error ? `<div class="sc-err">${esc(m.error)}</div>` : ''}
        ${m.sources && m.sources.length ? `<div class="sc-src">${m.sources.slice(0, 12).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">${esc(s.title)}</a>`).join('')}</div>` : ''}
      </div>`;
    }).join('');
    if (atBottom || (cur.view[cur.view.length - 1] || {}).live) box.scrollTop = box.scrollHeight;
  }
  function renderChat() {
    $('chatTitle').textContent = cur ? cur.title : 'AI 어시스턴트';
    renderAiSel(); renderMsgs(); renderQuick();
  }
  function renderChatList() {
    const box = $('chatList'); const list = chats.slice(0, 15);
    box.innerHTML = list.length ? '<b>최근 대화</b>' + list.map(c => `<div class="sc-chat-i${cur && cur.id === c.id ? ' on' : ''}"><button class="t" data-c="${c.id}" title="${esc(c.title)}">${esc(c.title)}</button><button class="x" data-del="${c.id}" title="이 대화 지우기" aria-label="이 대화 지우기">${icon('x', 14)}</button></div>`).join('') : '';
    box.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { show('chat'); openChat(b.dataset.c); });
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const c = chats.find(x => x.id === b.dataset.del); if (!c) return;
      if (!(await confirmBox('대화를 지울까요?', `"${c.title}" 대화를 이 기기에서 지웁니다. 되돌릴 수 없습니다.`, '지우기'))) return;
      chats = chats.filter(x => x !== c); if (cur === c) cur = null; saveChats(); renderChat(); renderChatList();
    });
  }
  function renderAiSel() {
    const sel = $('aiSel'), list = aiApis(), a = activeAI();
    sel.innerHTML = list.length ? list.map(x => `<option value="${x.id}"${a && a.id === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('') : '<option value="">AI API 없음</option>';
    sel.disabled = !list.length;
    $('webWrap').hidden = !(a && a.type === 'claude'); $('webOn').checked = cfg.web !== false;
  }
  $('aiSel').onchange = e => { cfg.ai = e.target.value; saveCfg(); renderAiSel(); };
  $('webOn').onchange = e => { cfg.web = e.target.checked; saveCfg(); };
  const grow = () => { const q = $('q'); q.style.height = 'auto'; q.style.height = Math.min(q.scrollHeight, innerHeight * .4) + 'px'; };
  $('q').addEventListener('input', grow);
  $('q').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('compose').requestSubmit(); } });
  $('compose').onsubmit = e => { e.preventDefault(); const q = $('q'); const t = q.value; if (!t.trim() || busy) return; q.value = ''; grow(); send(t); };
  $('btnNew').onclick = () => { if (busy) return; cur = null; show('chat'); renderChat(); renderChatList(); $('q').focus(); };

  /* =====================================================================
     관심 종목 · 보유
     ===================================================================== */
  function renderWatch() {
    const items = watch.items; $('cWatch').textContent = items.length || '';
    let cost = 0, value = 0, priced = 0;
    const rows = items.map((it, i) => {
      const q = watch.quotes[it.symbol] || {}, p = q.price, qty = +it.qty || 0, avg = +it.avg || 0;
      const pl = p && qty && avg ? (p - avg) * qty : null, plp = p && avg ? (p / avg - 1) * 100 : null;
      if (qty && avg && p) { cost += qty * avg; value += qty * p; priced++; }
      const toStop = p && it.stop ? (it.stop / p - 1) * 100 : null;
      const hit = p && ((it.alertHi && p >= +it.alertHi) || (it.alertLo && p <= +it.alertLo));
      return `<tr><td class="sym"><b>${esc(it.symbol)}</b><span>${esc(it.name || '')}</span>${hit ? `<span class="sc-alert" title="알림 가격: ${it.alertHi ? num(+it.alertHi) + ' 이상 ' : ''}${it.alertLo ? num(+it.alertLo) + ' 이하' : ''}">알림 가격 도달</span>` : ''}</td>
        <td>${num(p)}</td><td class="${cls(q.changePct)}">${pct(q.changePct)}</td>
        <td>${qty ? num(qty, 4) : '–'}</td><td>${avg ? num(avg) : '–'}</td>
        <td class="${cls(pl)}">${pl == null ? '–' : num(pl, 0)}</td><td class="${cls(plp)}">${pct(plp)}</td>
        <td>${it.stop ? num(it.stop) : '–'}${toStop != null ? `<br><span class="${toStop > -3 ? 'up' : ''}" style="font-size:var(--fs-xs)">${pct(toStop, 1)}</span>` : ''}</td><td>${it.target ? num(it.target) : '–'}</td>
        <td class="memo">${esc(it.memo || '')}</td>
        <td><span class="acts"><button class="btn ghost" data-ed="${i}" title="고치기" aria-label="${esc(it.symbol)} 고치기">${icon('edit', 15)}</button><button class="btn ghost" data-rm="${i}" title="빼기" aria-label="${esc(it.symbol)} 빼기">${icon('trash', 15)}</button></span></td></tr>`;
    }).join('');
    $('wTable').innerHTML = `<thead><tr><th>종목</th><th>현재가</th><th>등락</th><th>수량</th><th>평균 단가</th><th>평가 손익</th><th>수익률</th><th>손절가</th><th>목표가</th><th>메모 · 매수 이유</th><th></th></tr></thead><tbody>${rows || '<tr><td class="empty" colspan="11">아직 종목이 없습니다. [종목 추가] 로 관심 종목이나 보유 종목을 적어 두세요. 매수 이유와 손절가를 함께 적어 두면 AI 점검이 훨씬 정확해집니다.</td></tr>'}</tbody>`;
    const tot = value - cost;
    $('wSum').innerHTML = `<div><span>종목 수</span><b>${items.length}</b></div><div><span>매입 금액 (시세 있는 종목)</span><b>${num(cost, 0)}</b></div><div><span>평가 금액 (시세 있는 종목)</span><b>${num(value, 0)}</b></div><div><span>평가 손익</span><b class="${cls(tot)}">${priced ? num(tot, 0) : '–'}</b></div>`;
    const times = Object.values(watch.quotes).map(q => q.time).filter(Boolean).sort();
    $('wNote').textContent = (times.length ? `시세 기준: ${times[times.length - 1]} (${(Object.values(watch.quotes)[0] || {}).source || ''}) · ` : '') + '한국식 색: 오름 빨강 · 내림 파랑. 통화가 다른 종목을 섞으면 합계는 참고만 하세요.';
    $('wTable').querySelectorAll('[data-ed]').forEach(b => b.onclick = () => editItem(+b.dataset.ed));
    $('wTable').querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { const it = items[+b.dataset.rm]; if (await confirmBox(`${it.symbol} 을(를) 뺄까요?`, '목록에서만 빠집니다.', '빼기')) { items.splice(+b.dataset.rm, 1); saveWatch(); renderWatch(); } });
  }
  function editItem(i) {
    const it = i == null ? { symbol: '', name: '', qty: '', avg: '', stop: '', target: '', alertHi: '', alertLo: '', memo: '' } : Object.assign({}, watch.items[i]);
    const f = (k, l, t, ph) => `<label>${l}<input ${t === 'n' ? 'type="number" step="any" min="0"' : 'type="text"'} name="${k}" value="${esc(it[k] == null ? '' : it[k])}" placeholder="${ph || ''}"></label>`;
    const d = dialog(`<h3>${i == null ? '종목 추가' : esc(it.symbol) + ' 고치기'}</h3><form class="sc-form">
      ${f('symbol', '종목 코드 (시세 API 형식)', 't', '예: AAPL, 005930.KS')}<p class="hint">시세 API 마다 한국 종목 표기가 다릅니다 (예: Twelve Data 005930:KRX · Alpha Vantage 005930.KS). 확인은 [시험] 으로.</p>
      ${f('name', '이름 (선택)', 't', '예: 삼성전자')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${f('qty', '보유 수량 (관심만 있으면 비움)', 'n')}${f('avg', '평균 단가', 'n')}${f('stop', '손절가', 'n')}${f('target', '목표가', 'n')}${f('alertHi', '알림: 이 가격 이상', 'n')}${f('alertLo', '알림: 이 가격 이하', 'n')}</div>
      <label>메모 · 매수 이유<textarea name="memo" rows="3" placeholder="왜 샀는지 · 무엇이 틀리면 팔지">${esc(it.memo || '')}</textarea></label>
      <div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">저장</button></div></form>`);
    const form = d.el.querySelector('form'); setTimeout(() => form.symbol.focus(), 30);
    d.el.querySelector('[data-x]').onclick = d.close;
    form.onsubmit = e => {
      e.preventDefault(); const o = {}; for (const k of ['symbol', 'name', 'qty', 'avg', 'stop', 'target', 'alertHi', 'alertLo', 'memo']) o[k] = form[k].value.trim();
      o.symbol = o.symbol.toUpperCase(); if (!o.symbol) { toast('종목 코드를 넣어 주세요', 1800); return; }
      for (const k of ['qty', 'avg', 'stop', 'target', 'alertHi', 'alertLo']) o[k] = o[k] === '' ? '' : +o[k];
      if (i == null) watch.items.push(o); else watch.items[i] = o; saveWatch(); d.close(); renderWatch();
    };
  }
  $('wAdd').onclick = () => editItem(null);
  let refreshing = false;
  async function refreshQuotes(silent) {
    if (refreshing) return; if (!dataFor('quote')) { if (!silent) { toast('시세 API 를 먼저 등록해 주세요', 2400); show('apis'); } return; }
    refreshing = true; const b = $('wRefresh'); b.disabled = true; let ok = 0; const fail = [];
    try { for (const it of watch.items) { try { await runTool('get_quote', { symbol: it.symbol }); ok++; } catch (e) { fail.push(it.symbol); } } }
    finally { refreshing = false; b.disabled = false; }
    if (!$('vWatch').hidden) renderWatch();
    const hits = alertsHit();
    if (hits.length) { toast('가격 알림: ' + hits.map(h => `${h.symbol} ${num(h.price)} (${num(h.level)} ${h.kind})`).join(' · '), 6000); document.title = '● 가격 알림 · SECRET'; }
    else if (!silent) toast(fail.length ? `${ok}개 불러옴 · 실패: ${fail.join(', ')}` : `${ok}개 시세를 불러왔습니다`, 3000);
  }
  $('wRefresh').onclick = () => refreshQuotes(false);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && document.title !== 'SECRET') setTimeout(() => { document.title = 'SECRET'; }, 4000); });
  $('wAsk').onclick = () => { show('chat'); send(PROMPTS[1][2]); };

  /* =====================================================================
     매매 계획 계산기
     ===================================================================== */
  const calcIds = ['cSym', 'cAcc', 'cRisk', 'cEntry', 'cStop', 'cTarget', 'cWin'];
  const calcSaved = LS.get(K_CALC, {}); calcIds.forEach(id => { if (calcSaved[id] != null) $(id).value = calcSaved[id]; });
  function renderCalc() {
    const v = id => $(id).value === '' ? null : +$(id).value;
    const acc = v('cAcc'), risk = v('cRisk'), entry = v('cEntry'), stop = v('cStop'), target = v('cTarget'), win = v('cWin');
    LS.set(K_CALC, Object.fromEntries(calcIds.map(id => [id, $(id).value])));
    const out = $('calcOut');
    if (!(acc > 0 && risk > 0 && entry > 0 && stop > 0) || entry === stop) { out.innerHTML = '<p class="muted">계좌 금액 · 감수할 손실 % · 진입가 · 손절가를 넣으면 수량과 비중이 나옵니다. 목표가와 승률을 넣으면 손익비와 기대값도 계산합니다.</p>'; return; }
    const r = sizePlan({ account: acc, risk_percent: risk, entry, stop, target, win_rate: win });
    const notes = [];
    if (r.positionPctOfAccount > 100) notes.push(`<li class="warn">이 수량은 계좌보다 큽니다 (${r.positionPctOfAccount}%). 손절 폭을 넓히거나 감수 손실을 줄이세요.</li>`);
    else if (r.positionPctOfAccount > 25) notes.push(`<li class="warn">한 종목에 계좌의 ${r.positionPctOfAccount}% 가 들어갑니다. 갭 하락(손절가를 건너뛰는 하락)에 대비해 비중 상한을 정해 두세요.</li>`);
    if (r.rewardRisk != null && r.rewardRisk < 1.5) notes.push(`<li class="warn">손익비 ${r.rewardRisk}R 은 낮습니다. 이 손익비로는 승률이 ${r.breakEvenWinRatePct}% 를 넘어야 본전입니다.</li>`);
    if (r.expectancyR != null) notes.push(r.expectancyR > 0 ? `<li>승률 ${win}% 가 맞다면 한 번 매매의 기대값은 +${r.expectancyR}R (약 ${num(r.expectancyAmount, 0)}) 입니다. 승률 추정은 매매 기록으로 확인하세요.</li>` : `<li class="warn">승률 ${win}% 로는 기대값이 ${r.expectancyR}R 로 마이너스입니다. 이 매매는 하지 않는 편이 낫습니다.</li>`);
    notes.push(`<li class="muted">손절가까지 ${r.stopDistancePct}% 거리. 수수료 · 세금 · 미끄러짐(체결 차이)은 빠져 있습니다.</li>`);
    out.innerHTML = `<div class="big">
      <div class="key"><span>살 수량</span><b>${num(r.quantity, 0)}주</b></div>
      <div><span>감수할 손실</span><b>${num(r.riskAmount, 0)}</b></div>
      <div><span>투입 금액 (계좌 대비)</span><b>${num(r.positionCost, 0)}</b><span>${r.positionPctOfAccount}%</span></div>
      <div><span>손익비</span><b>${r.rewardRisk != null ? r.rewardRisk + 'R' : '–'}</b><span>${r.breakEvenWinRatePct != null ? '본전 승률 ' + r.breakEvenWinRatePct + '%' : '목표가를 넣으세요'}</span></div>
      <div><span>목표 도달 시 이익</span><b>${r.profitAtTarget != null ? num(r.profitAtTarget, 0) : '–'}</b></div>
      <div><span>1회 기대값</span><b class="${cls(r.expectancyR)}">${r.expectancyR != null ? (r.expectancyR > 0 ? '+' : '') + r.expectancyR + 'R' : '–'}</b></div>
    </div><ul>${notes.join('')}</ul>`;
  }
  $('calcForm').addEventListener('input', renderCalc); $('calcForm').onsubmit = e => e.preventDefault();
  $('cAsk').onclick = () => {
    const g = id => $(id).value; show('chat');
    send(`이 매매 계획을 검토해 줘. 종목 ${g('cSym') || '(미정)'}, 계좌 ${g('cAcc')}, 1회 감수 손실 ${g('cRisk')}%, 진입 ${g('cEntry')}, 손절 ${g('cStop')}, 목표 ${g('cTarget') || '(없음)'}, 예상 승률 ${g('cWin')}%. position_size 로 계산하고, 손절가 · 목표가의 근거가 차트 · 변동성(ATR) 기준으로 타당한지, 더 나은 계획이 있는지 알려 줘.`);
  };

  /* =====================================================================
     레퍼런스 · 원칙
     ===================================================================== */
  const PRINCIPLES = [
    ['한 번에 잃을 돈부터 정하기', '매매마다 계좌의 0.5~2% 만 위험에 두면, 연속 손실에도 살아남습니다. 수량은 손절가에서 거꾸로 정합니다.', '매매 계획 계산기 · position_size 도구'],
    ['손익비와 기대값으로 고르기', '승률만 보지 말고 "승률 × 평균 이익 − 패율 × 평균 손실"이 플러스인 매매만 합니다. 손익비 2R 이면 승률 34% 로도 본전입니다.', '계산기의 손익비 · 본전 승률 · 기대값'],
    ['덜 사고팔기', '개인 6만여 가구를 본 연구(Barber · Odean)에서 가장 많이 매매한 20% 는 시장보다 연 수익이 크게 낮았고, 원인은 종목 선택보다 거래 비용과 잦은 매매였습니다.', 'AI 가 잦은 매매 · 추격 매수를 짚도록 함'],
    ['핵심은 지수, 개별 종목은 일부', '15년 넘게 보면 대부분의 액티브 펀드가 지수를 이기지 못했습니다(SPIVA). 핵심 자산은 낮은 비용의 지수에, 개별 종목은 정한 비중 안에서만.', '관심 종목의 비중 · 평가 금액'],
    ['사기 전에 "틀렸다"의 기준 적기', '매수 이유와 손절 조건을 미리 적어 두면, 가격이 내려갈 때 희망 대신 기준으로 판단합니다.', '종목 메모 · 손절가 칸, AI 의 "반대 근거"'],
    ['일정 확인 (실적 · 지표 · 공시)', '실적 발표 · 금리 결정 · 큰 공시 직전에는 변동이 큽니다. 일정 앞에서는 비중을 줄이거나 결과를 보고 들어갑니다.', '"실적 발표 전 위험" 질문 · 웹 검색'],
    ['나눠 사고, 정해진 날 리밸런싱', '한 번에 다 사지 않고 나눠 사면 타이밍 실수의 피해가 줄고, 정해진 날 비중을 되돌리면 과열된 자산을 자연스럽게 덜어 냅니다.', 'AI 실행 계획의 분할 매수 · 비중'],
    ['비용 · 세금 줄이기', '수수료 · 환전 · 세금은 확실한 손실입니다. ISA · 연금저축 같은 절세 계좌와 낮은 수수료를 먼저 챙깁니다.', 'AI 가 세금 · 수수료를 함께 고려'],
    ['기록하고 돌아보기', '매매 이유 · 결과 · 감정을 적고 한 달에 한 번 돌아보면, 승률과 손익비를 실제 숫자로 알게 됩니다. 계산기의 승률도 이 기록에서 옵니다.', '"내 매매 습관 진단" 질문'],
    ['레버리지 · 몰빵 · 물타기 피하기', '빚과 집중 투자는 한 번의 큰 손실로 회복할 수 없게 만듭니다. 손절가를 내리며 물을 타는 것은 계획을 버리는 것입니다.', 'AI 원칙: 위험을 분명히 말함'],
  ];
  const REFS = [
    ['해외 AI 주식 도구', '점수 · 신호 · 대화형 리서치', [
      ['Danelfin', 'AI 점수', '미국 종목 · ETF 가 앞으로 3개월 동안 시장을 이길 확률을 1~10 점으로 매기고, 점수를 만든 신호를 보여 줍니다(설명 가능한 AI).', '답마다 확신 정도와 근거 · 반대 근거를 같이 보여 줌', 'https://danelfin.com'],
      ['Kavout (K Score)', 'AI 점수', '재무 · 가격 · 기술 지표 · 대체 데이터를 머신러닝으로 묶어 종목을 1~9 점으로 매깁니다.', '시세 · 일봉 지표를 도구로 불러 판단 재료로 씀', 'https://www.kavout.com'],
      ['Trade Ideas (Holly AI)', '매매 신호', '밤새 수많은 전략을 시뮬레이션해 그날의 진입 · 손절 · 목표 신호를 고릅니다. 단타 중심.', '실행 계획을 진입 조건 · 손절가 · 목표가로 씀', 'https://www.trade-ideas.com'],
      ['Tickeron', '패턴 인식', '차트 패턴과 추세를 찾아 신호와 신뢰도를 보여 줍니다. 스윙 매매 중심.', '추세 정렬 · RSI · 변동성을 계산해 줌', 'https://tickeron.com'],
      ['Fiscal.ai (옛 FinChat)', '대화형 리서치', '실제 재무 데이터를 근거로 회사에 대해 묻고 답하는 AI. 데이터가 붙은 답이 핵심입니다.', 'AI 가 숫자를 지어내지 않고 도구 · 검색 결과만 쓰게 함', 'https://fiscal.ai'],
      ['YCharts AI Chat', '대화형 리서치', '색인된 금융 데이터베이스를 바탕으로 실시간 답을 돌려줍니다.', 'API 를 + 로 여러 개 붙여 데이터 출처를 넓힘', 'https://ycharts.com'],
    ]],
    ['국내 · 데이터', '증권사 AI 와 이 도구에 붙일 수 있는 데이터', [
      ['토스증권', '투자 플랫폼', '해외주식 · AI · 커뮤니티를 결합했고, 전문가 판단과 AI 전략을 결합한 자산관리 서비스를 준비 중이라고 알려졌습니다.', '쉬운 말과 한눈에 보는 손익 화면', 'https://tossinvest.com'],
      ['증권사 AI 리서치', 'AI 투자분석', '유안타증권 등은 MTS 에 AI 투자분석 · 종목 추천을 넣어 왔습니다. 각 사 공식 자료로 수수료 · 방식 · 책임을 비교하세요.', '추천보다 "왜"를 묻는 대화 방식', 'https://www.myasset.com'],
      ['OpenDART (전자공시 Open API)', '데이터', '금융감독원 전자공시 자료(공시 · 재무제표)를 API 로 받습니다. 국내 종목 근거 자료로 좋습니다.', '다음 단계: 사용자 정의 API 로 연결 검토 (브라우저 접근 허용 여부 확인 필요)', 'https://opendart.fss.or.kr'],
      ['한국투자증권 KIS Developers', '데이터 · 주문', '국내 · 해외 시세와 주문 API. 브라우저에서 바로 부르기 어려워 PC 서버가 필요합니다.', '다음 단계 후보 (주문은 확인 절차와 함께)', 'https://apiportal.koreainvestment.com'],
    ]],
    ['근거 자료', '원칙의 출처', [
      ['SPIVA (S&P Dow Jones Indices)', '연구', '액티브 펀드와 지수의 성과를 해마다 비교합니다. 2025년에는 미국 대형주 액티브 펀드의 79% 가 S&P 500 에 뒤졌습니다.', '원칙 4: 핵심은 지수', 'https://www.spglobal.com/spdji/en/spiva/article/spiva-us-year-end-2025/'],
      ['Barber · Odean (2000)', '연구', '"Trading Is Hazardous to Your Wealth" — 잦은 매매가 개인 투자자 수익을 깎는 원인은 비용과 과신이라는 연구.', '원칙 3: 덜 사고팔기', 'https://faculty.haas.berkeley.edu/odean/papers/returns/returns.html'],
    ]],
  ];
  function renderRefs() {
    $('refs').innerHTML = `<div class="sc-sec"><h2>수익 가능성을 높이는 원칙 10</h2><p>예측을 잘하는 것보다, 질 때 적게 지고 비용과 실수를 줄이는 쪽이 꾸준히 효과가 있습니다. 이 도구의 기능은 이 원칙에 맞춰져 있습니다.</p>
      <div class="sc-grid">${PRINCIPLES.map((p, i) => `<div class="sc-ref"><div class="h"><span class="n">${i + 1}</span><b>${esc(p[0])}</b></div><p>${esc(p[1])}</p><p class="use">${esc(p[2])}</p></div>`).join('')}</div></div>` +
      REFS.map(([h, sub, list]) => `<div class="sc-sec"><h2>${esc(h)}</h2><p>${esc(sub)}</p><div class="sc-grid">${list.map(r => `<div class="sc-ref"><div class="h"><b>${esc(r[0])}</b><span class="tag">${esc(r[1])}</span></div><p>${esc(r[2])}</p><p class="use">${esc(r[3])}</p><a href="${esc(r[4])}" target="_blank" rel="noopener">${esc(r[4].replace(/^https?:\/\//, ''))}</a></div>`).join('')}</div></div>`).join('') +
      '<p class="sc-fine" style="text-align:left">점수 · 신호 서비스의 성과 수치는 대부분 회사 자체 백테스트입니다. 어떤 AI 도 시장을 꾸준히 이긴다고 보장하지 못합니다.</p>';
  }

  /* =====================================================================
     API 연결
     ===================================================================== */
  const mask = k => !k ? (cfg.lock ? '잠금됨' : '없음') : '••••' + k.slice(-4);
  function renderApis() {
    $('cApi').textContent = cfg.apis.length || '';
    $('apiNote').innerHTML = `${icon('shield', 15)}<span>키는 <b>이 기기의 이 브라우저에만</b> 저장되고 GitHub · 다른 기기로 가지 않습니다. 같은 주소(github.io)의 다른 페이지도 브라우저 저장소를 읽을 수 있으니 <b>잠금 암호</b>를 걸어 두기를 권합니다. 주문(매수 · 매도) 기능은 없습니다.</span>`;
    const cur = activeAI();
    $('apiGrid').innerHTML = cfg.apis.map(a => {
      const T = TYPES[a.type] || {}; const ai = T.kind === 'ai';
      const k = cfg.lock ? (keyMem ? keyMem[a.id] : '') : a.key;
      return `<div class="sc-api${a.on === false ? ' off' : ''}"><div class="h"><span class="kind ${ai ? '' : 'data'}">${ai ? 'AI' : '시세'}</span><b title="${esc(a.name)}">${esc(a.name)}</b></div>
        <dl><dt>종류</dt><dd>${esc(T.name || a.type)}</dd><dt>키</dt><dd>${esc(mask(k))}</dd>${ai ? `<dt>모델</dt><dd>${esc(a.model || T.model || '–')}</dd>` : ''}${a.base ? `<dt>주소</dt><dd title="${esc(a.base)}">${esc(a.base)}</dd>` : ''}${!ai ? `<dt>제공</dt><dd>${(T.caps || []).map(c => ({ quote: '현재가', history: '일봉', news: '뉴스', custom: '원문' })[c]).join(' · ')}</dd>` : ''}</dl>
        <span class="st ${a.test === 'ok' ? 'ok' : a.test ? 'bad' : ''}">${a.test === 'ok' ? '시험 통과' : a.test ? esc(a.test) : '아직 시험하지 않음'}</span>
        <div class="row">${ai ? `<label class="use"><input type="radio" name="useAi" value="${a.id}"${cur && cur.id === a.id ? ' checked' : ''}${a.on === false ? ' disabled' : ''}>대화에 쓰기</label>` : `<label class="use"><input type="checkbox" data-on="${a.id}"${a.on !== false ? ' checked' : ''}>사용</label>`}<span class="grow"></span>
          <button class="btn sm" data-test="${a.id}">시험</button><button class="btn sm ghost icon" data-edit="${a.id}" title="고치기" aria-label="고치기">${icon('edit', 15)}</button><button class="btn sm ghost icon" data-rm="${a.id}" title="지우기" aria-label="지우기">${icon('trash', 15)}</button></div></div>`;
    }).join('') + `<button class="sc-api sc-add" id="apiPlus">${icon('plus', 26)}<b>API 추가</b><span style="font-size:var(--fs-xs)">AI · 시세 API 를 여러 개 붙일 수 있습니다</span></button>`;
    $('apiPlus').onclick = () => openAdd();
    $('apiGrid').querySelectorAll('[name=useAi]').forEach(r => r.onchange = () => { cfg.ai = r.value; saveCfg(); renderAiSel(); });
    $('apiGrid').querySelectorAll('[data-on]').forEach(c => c.onchange = () => { const a = cfg.apis.find(x => x.id === c.dataset.on); a.on = c.checked; saveCfg(); renderApis(); });
    $('apiGrid').querySelectorAll('[data-test]').forEach(b => b.onclick = () => testApi(cfg.apis.find(x => x.id === b.dataset.test), b));
    $('apiGrid').querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openAdd(null, cfg.apis.find(x => x.id === b.dataset.edit)));
    $('apiGrid').querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => {
      const a = cfg.apis.find(x => x.id === b.dataset.rm);
      if (!(await confirmBox(`${a.name} 를 지울까요?`, '이 기기에 저장한 키도 함께 지웁니다.', '지우기'))) return;
      cfg.apis = cfg.apis.filter(x => x !== a); if (keyMem) { delete keyMem[a.id]; if (lockKey) await sealKeys(); } if (cfg.ai === a.id) cfg.ai = ''; saveCfg(); renderApis(); renderAiSel();
    });
    $('lockBox').innerHTML = cfg.lock
      ? `<div><b>키 잠금 켜짐</b> — 키를 암호로 감싸 두었습니다. ${keyMem ? '지금은 풀려 있습니다 (이 화면을 닫으면 다시 잠깁니다).' : 'AI 를 처음 부를 때 암호를 묻습니다.'}</div>${keyMem ? '' : '<button class="btn" id="lkOpen">풀기</button>'}<button class="btn ghost" id="lkOff">잠금 끄기</button>`
      : `<div><b>키 잠금 꺼짐</b> — 잠금 암호를 걸면 키를 AES-GCM 으로 감싸 저장합니다. 암호를 잊으면 키를 다시 등록해야 합니다.</div><button class="btn" id="lkOn">${icon('lock', 15)}잠금 암호 걸기</button>`;
    fillIcons($('vApis'));
    const on = $('lkOn'), off = $('lkOff'), op = $('lkOpen');
    if (op) op.onclick = () => unlock();
    if (on) on.onclick = async () => {
      const p = await askPass('잠금 암호 걸기', '4자 이상. 이 암호는 어디에도 저장하지 않습니다.', true); if (!p) return;
      const salt = crypto.getRandomValues(new Uint8Array(16)); lockKey = await derive(p, salt);
      keyMem = Object.fromEntries(cfg.apis.map(a => [a.id, a.key || ''])); cfg.apis.forEach(a => { a.key = ''; });
      cfg.lock = { salt: b64(salt) }; await sealKeys(); toast('키를 잠갔습니다', 2000); renderApis();
    };
    if (off) off.onclick = async () => {
      if (!(await unlock())) return;
      cfg.apis.forEach(a => { a.key = keyMem[a.id] || ''; }); cfg.lock = null; lockKey = null; keyMem = null; saveCfg(); toast('잠금을 껐습니다', 2000); renderApis();
    };
  }
  async function testApi(a, btn) {
    if (btn) btn.disabled = true;
    try {
      const k = await keyOf(a); if (!k && a.type !== 'custom') throw new Error('키가 비어 있습니다');
      if (a.type === 'claude') {
        const r = await fetch('https://api.anthropic.com/v1/models?limit=1', { headers: { 'x-api-key': k, 'anthropic-version': '2026-10-21', 'anthropic-dangerous-direct-browser-access': 'true' } });
        if (!r.ok) { let j = null; try { j = await r.json(); } catch (e) { } throw new Error(apiErr(r.status, j, 'Claude')); }
      } else if (isAI(a)) {
        const base = String(a.base || TYPES[a.type].base || '').replace(/\/+$/, '');
        const r = await fetch(base + '/models', { headers: { Authorization: 'Bearer ' + k } });
        if (!r.ok) { let j = null; try { j = await r.json(); } catch (e) { } throw new Error(apiErr(r.status, j, TYPES[a.type].name)); }
      } else {
        const T = TYPES[a.type]; const s = 'AAPL';
        if (T.caps.includes('quote')) await DATA[a.type].quote(k, s); else await DATA.custom.custom(k, s, a);
      }
      a.test = 'ok'; toast(`${a.name}: 연결됐습니다`, 2000);
    } catch (e) {
      a.test = /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? '연결 실패 (네트워크 · 브라우저 차단)' : e.message.slice(0, 120);
      toast(`${a.name}: ${a.test}`, 4000);
    } finally { saveCfg(); if (btn) btn.disabled = false; renderApis(); }
  }
  function openAdd(type, edit) {
    const a = edit || { type: type || 'claude', name: '', model: '', base: '' };
    const opts = (kind, label) => `<optgroup label="${label}">${Object.entries(TYPES).filter(([, t]) => t.kind === kind).map(([id, t]) => `<option value="${id}"${a.type === id ? ' selected' : ''}>${t.name}</option>`).join('')}</optgroup>`;
    const d = dialog(`<h3>${edit ? 'API 고치기' : 'API 추가'}</h3><form class="sc-form" autocomplete="off">
      <label>종류<select name="type"${edit ? ' disabled' : ''}>${opts('ai', 'AI (대화)')}${opts('data', '시세 · 데이터')}</select></label>
      <p class="hint" id="tNote"></p>
      <label>이름<input type="text" name="name" value="${esc(a.name)}" placeholder="예: 내 Claude"></label>
      <label>API 키<input type="password" name="key" placeholder="${edit ? '바꿀 때만 넣으세요' : '키를 붙여 넣으세요'}" autocomplete="off"></label>
      <label id="fModel">모델<input type="text" name="model" value="${esc(a.model || '')}"></label>
      <label id="fBase">주소<input type="text" name="base" value="${esc(a.base || '')}"></label>
      <div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">${edit ? '저장' : '추가하고 시험'}</button></div></form>`);
    const f = d.el.querySelector('form');
    const sync = () => {
      const T = TYPES[f.type.value]; const ai = T.kind === 'ai';
      $('tNote').innerHTML = esc(T.note || '') + (T.keyUrl ? ` <a href="${T.keyUrl}" target="_blank" rel="noopener">키 발급 페이지</a>` : '');
      $('fModel').hidden = !ai; f.model.placeholder = f.type.value === 'claude' ? 'claude-opus-5-5 (비우면 기본)' : '예: 해당 회사의 모델 이름';
      $('fBase').hidden = !(f.type.value === 'compat' || f.type.value === 'custom' || (ai && f.type.value !== 'claude' && edit));
      f.base.placeholder = f.type.value === 'custom' ? 'https://…?symbol={symbol}&apikey={key}' : (T.base || 'https://…/v1');
      if (!f.name.value || f.name.dataset.auto) { f.name.value = T.name; f.name.dataset.auto = '1'; }
    };
    f.name.oninput = () => { delete f.name.dataset.auto; };
    f.type.onchange = sync; sync(); setTimeout(() => (edit ? f.name : f.key).focus(), 30);
    d.el.querySelector('[data-x]').onclick = d.close;
    f.onsubmit = async e => {
      e.preventDefault();
      const t = f.type.value, T = TYPES[t], key = f.key.value.trim();
      if (!edit && !key && t !== 'custom') { toast('API 키를 넣어 주세요', 1800); return; }
      if ((t === 'compat' || t === 'custom') && !f.base.value.trim()) { toast('주소를 넣어 주세요', 1800); return; }
      if (T.kind === 'ai' && t !== 'claude' && !f.model.value.trim()) { toast('모델 이름을 넣어 주세요', 1800); return; }
      const o = edit || { id: uid(), type: t, on: true };
      o.name = f.name.value.trim() || T.name; o.model = T.kind === 'ai' ? f.model.value.trim() : ''; o.base = f.base.value.trim() || '';
      try { if (key || !edit) await setKey(o, key); } catch (err) { toast(err.message, 2600); return; }
      if (!edit) { cfg.apis.push(o); if (T.kind === 'ai' && !activeAI()) cfg.ai = o.id; }
      o.test = ''; saveCfg(); d.close(); renderApis(); renderAiSel(); if (!activeAI() || cur == null) renderMsgs();
      testApi(o);
    };
  }
  $('apiAdd').onclick = () => openAdd();

  /* =====================================================================
     화면 전환
     ===================================================================== */

  /* =====================================================================
     나의 원칙 — AI 가 모든 답에 반영하는 내 기준 (이 기기에 저장)
     ===================================================================== */
  const K_ME = 'sec:me', K_JOURNAL = 'sec:journal';
  const ME0 = {
    profile: { goal: '', horizon: '', style: '', markets: '', riskTrade: 1, maxDD: 20, maxPos: 20, account: '', taxAcct: '' },
    rules: '', never: '',
    checklist: ['매수 이유를 한 문장으로 쓸 수 있다', '손절가와 그 근거를 정했다', '1회 손실이 정한 % 이하다', '손익비가 2 이상이다', '실적 발표 · 큰 일정이 코앞이 아니다', '뉴스를 보고 급하게 사는 것이 아니다 (조급함 아님)'],
    answer: { length: '보통', level: '중급', tone: '존댓말', format: '틀' },
    notes: [],
    prompts: [{ title: '아침 브리핑', text: 'get_portfolio 로 내 종목을 보고, 오늘 시장과 내 종목에 영향을 줄 뉴스 · 일정을 종목마다 3줄 이내로 요약해 줘. 내 규칙을 어기고 있는 종목(손절가 근처 · 비중 초과)이 있으면 맨 위에 알려 줘.' }],
  };
  const me = Object.assign(JSON.parse(JSON.stringify(ME0)), LS.get(K_ME, {}));
  me.profile = Object.assign({}, ME0.profile, me.profile); me.answer = Object.assign({}, ME0.answer, me.answer);
  const saveMe = () => { LS.set(K_ME, me); $('cMe').textContent = me.notes.length ? '' : ''; };
  let journal = LS.get(K_JOURNAL, []);
  const saveJournal = () => { LS.set(K_JOURNAL, journal); $('cJournal').textContent = journal.length || ''; };

  function meBlock() {
    const p = me.profile, a = me.answer, L = [];
    const line = (k, v) => { if (v !== '' && v != null) L.push(`- ${k}: ${v}`); };
    line('투자 목표', p.goal); line('투자 기간', p.horizon); line('스타일', p.style); line('주로 보는 시장', p.markets);
    line('1회 매매에서 감수할 손실', p.riskTrade ? p.riskTrade + '%' : ''); line('계좌 전체 최대 하락 허용', p.maxDD ? p.maxDD + '%' : ''); line('한 종목 최대 비중', p.maxPos ? p.maxPos + '%' : '');
    line('계좌 규모', p.account); line('절세 계좌', p.taxAcct);
    let s = L.length ? `\n\n사용자 프로필 (사용자가 직접 적은 기준 — 모든 답에 반영)\n${L.join('\n')}` : '';
    if (me.rules.trim()) s += `\n\n사용자의 규칙:\n${me.rules.trim()}`;
    if (me.never.trim()) s += `\n\n사용자가 절대 하지 않는 것:\n${me.never.trim()}`;
    if (me.checklist.length) s += `\n\n사용자의 매수 전 체크리스트:\n${me.checklist.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
    if (me.notes.length) s += `\n\n기억해 둔 사용자 정보 (이전 대화에서):\n${me.notes.map(n => '- ' + n.text).join('\n')}`;
    s += '\n\n이 기준을 쓰는 법: 매수 · 매도 · 비중 판단을 말할 때는 사용자의 규칙과 체크리스트 항목마다 충족 / 미충족 / 확인 필요를 짧게 표시하고, 어긋나는 것이 있으면 결론보다 먼저 경고합니다. 수량 · 비중은 사용자의 감수 손실 % 와 한 종목 최대 비중을 기준으로 position_size 로 계산합니다. 사용자의 기간 · 스타일과 맞지 않는 매매는 권하지 않고, 맞지 않는다고 말합니다.';
    const len = { '짧게': '핵심만 짧게 (8줄 안팎)', '보통': '필요한 만큼 간결하게', '자세히': '근거와 계산을 충분히 자세하게' }[a.length] || '';
    const lvl = { '입문': '전문 용어는 쉬운 말로 풀어 설명', '중급': '흔한 용어는 그대로 씀', '전문가': '용어 설명 없이 수치 중심' }[a.level] || '';
    s += `\n\n답변 방식: ${len}, ${lvl}, ${a.tone === '편하게' ? '반말로 편하게' : '존댓말'}.${a.format === '자유' ? ' 위의 정해진 순서 대신 질문에 맞는 형식으로 답하되, 위험과 반대 근거는 빠뜨리지 않습니다.' : ''}`;
    return s;
  }

  function renderMe() {
    const p = me.profile, a = me.answer;
    const sel = (k, opts, ph) => `<select data-p="${k}"><option value="">${ph || '고르기'}</option>${opts.map(o => `<option${p[k.split('.')[1]] === o ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
    const inp = (k, t, ph, extra) => `<input type="${t}" data-p="${k}" value="${esc(p[k.split('.')[1]] == null ? '' : p[k.split('.')[1]])}" placeholder="${esc(ph || '')}" ${extra || ''}>`;
    const seg = (k, opts) => `<div class="sc-seg" data-seg="${k}">${opts.map(o => `<button type="button" data-v="${o}" class="${a[k] === o ? 'on' : ''}">${o}</button>`).join('')}</div>`;
    $('meBox').innerHTML = `
      <div class="sc-card"><h2>나에 대한 것</h2><p class="sub">AI 가 수량 · 비중 · 추천 범위를 정할 때 쓰는 기준입니다.</p>
        <div class="sc-form">
          <label>투자 목표${inp('profile.goal', 'text', '예: 5년 안에 노후 자금 1억 · 연 10% 안정 수익')}</label>
          <div class="sc-grid2">
            <label>투자 기간${sel('profile.horizon', ['단타 (당일)', '스윙 (며칠~몇 주)', '중기 (몇 달)', '장기 (1년 이상)'])}</label>
            <label>스타일${sel('profile.style', ['가치', '성장', '배당', '모멘텀 · 추세', '지수 중심', '섞어서'])}</label>
            <label>주로 보는 시장${sel('profile.markets', ['한국', '미국', '한국 · 미국'])}</label>
            <label>계좌 규모 (선택)${inp('profile.account', 'text', '예: 3000만 원')}</label>
            <label>1회 감수 손실 (%)${inp('profile.riskTrade', 'number', '1', 'min="0.1" max="10" step="0.1"')}</label>
            <label>한 종목 최대 비중 (%)${inp('profile.maxPos', 'number', '20', 'min="1" max="100" step="1"')}</label>
            <label>계좌 최대 하락 허용 (%)${inp('profile.maxDD', 'number', '20', 'min="1" max="100" step="1"')}</label>
            <label>절세 계좌${inp('profile.taxAcct', 'text', '예: ISA · 연금저축')}</label>
          </div>
        </div></div>
      <div class="sc-card"><h2>나의 규칙</h2><p class="sub">한 줄에 하나씩. AI 가 답할 때마다 이 규칙에 맞는지 따집니다.</p>
        <div class="sc-form">
          <label>지키는 규칙<textarea data-m="rules" rows="5" placeholder="예) 한 번에 다 사지 않고 3번에 나눠 산다&#10;손절가에 닿으면 다음 날 시가에 판다&#10;한 달에 매매는 4번까지">${esc(me.rules)}</textarea></label>
          <label>절대 하지 않는 것<textarea data-m="never" rows="3" placeholder="예) 신용 · 미수 · 레버리지 ETF&#10;물타기 (손절가를 내리면서 더 사기)&#10;급등주 추격 매수">${esc(me.never)}</textarea></label>
        </div></div>
      <div class="sc-card"><h2>매수 전 체크리스트</h2><p class="sub">매매 일지에 기록할 때 체크하고, AI 는 매수 판단마다 항목별로 점검합니다. 일지에서 "다 지켰을 때"와 "아닐 때"의 승률을 비교해 줍니다.</p>
        <div class="sc-list" id="meChecks">${me.checklist.map((c, i) => `<div class="sc-li"><span class="n">${i + 1}</span><input type="text" data-ci="${i}" value="${esc(c)}" aria-label="체크리스트 ${i + 1}"><button type="button" class="sc-x" data-cdel="${i}" title="빼기" aria-label="빼기">${icon('x', 14)}</button></div>`).join('')}</div>
        <div class="sc-add-row"><input type="text" id="meCheckNew" placeholder="항목 추가 (Enter)"><button type="button" class="btn" id="meCheckAdd">${icon('plus', 15)}추가</button></div></div>
      <div class="sc-card"><h2>AI 답변 방식</h2><p class="sub">내 수준과 취향에 맞춰 답하게 합니다.</p>
        <div class="sc-opt"><span>길이</span>${seg('length', ['짧게', '보통', '자세히'])}</div>
        <div class="sc-opt"><span>수준</span>${seg('level', ['입문', '중급', '전문가'])}</div>
        <div class="sc-opt"><span>말투</span>${seg('tone', ['존댓말', '편하게'])}</div>
        <div class="sc-opt"><span>형식</span>${seg('format', ['틀', '자유'])}</div>
        <p class="sub" style="margin:4px 0 0">틀: 결론 → 근거 → 반대 근거 → 시나리오 → 실행 계획 → 확인할 것. 자유: 질문에 맞게 (위험은 늘 짚음).</p></div>
      <div class="sc-card"><h2>AI 가 기억하는 것</h2><p class="sub">대화 중 "기억해" 라고 하거나 AI 가 내 성향 · 제약을 새로 알면 여기에 한 줄씩 남깁니다. 모든 대화에서 씁니다. 틀린 것은 지우세요.</p>
        <div class="sc-list">${me.notes.length ? me.notes.map((n, i) => `<div class="sc-note"><span>${n.by === 'AI' ? '<em>AI</em>' : ''}${esc(n.text)}</span><button type="button" class="sc-x" data-ndel="${i}" title="지우기" aria-label="지우기">${icon('x', 14)}</button></div>`).join('') : '<div class="sc-empty-s">아직 없습니다.</div>'}</div>
        <div class="sc-add-row"><input type="text" id="meNoteNew" placeholder="직접 적기 (예: 반도체 업종 비중이 이미 높음)"><button type="button" class="btn" id="meNoteAdd">${icon('plus', 15)}추가</button></div></div>
      <div class="sc-card"><h2>내 질문 단추</h2><p class="sub">자주 하는 질문을 단추로 만들어 대화 화면에서 한 번에 보냅니다. 끝을 띄어 쓰면 보내지 않고 입력 칸에 채워 이어서 쓸 수 있습니다.</p>
        <div class="sc-list">${me.prompts.length ? me.prompts.map((q, i) => `<div class="sc-pr"><div><b>${esc(q.title)}</b><span>${esc(q.text)}</span></div><button type="button" class="sc-x" data-pedit="${i}" title="고치기" aria-label="고치기">${icon('edit', 14)}</button><button type="button" class="sc-x" data-pdel="${i}" title="지우기" aria-label="지우기">${icon('x', 14)}</button></div>`).join('') : '<div class="sc-empty-s">아직 없습니다.</div>'}</div>
        <div class="sc-add-row"><button type="button" class="btn" id="mePromptAdd">${icon('plus', 15)}질문 단추 만들기</button></div></div>`;
    const box = $('meBox');
    box.querySelectorAll('[data-p]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { const k = el.dataset.p.split('.')[1]; me.profile[k] = el.type === 'number' ? (el.value === '' ? '' : +el.value) : el.value.trim(); saveMe(); }));
    box.querySelectorAll('[data-m]').forEach(el => el.addEventListener('input', () => { me[el.dataset.m] = el.value; saveMe(); }));
    box.querySelectorAll('[data-seg]').forEach(g => g.onclick = e => { const b = e.target.closest('button'); if (!b) return; me.answer[g.dataset.seg] = b.dataset.v; saveMe(); g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
    box.querySelectorAll('[data-ci]').forEach(el => el.addEventListener('input', () => { me.checklist[+el.dataset.ci] = el.value.trim(); saveMe(); }));
    box.querySelectorAll('[data-ci]').forEach(el => el.addEventListener('change', () => { me.checklist = me.checklist.filter(Boolean); saveMe(); renderMe(); }));
    box.querySelectorAll('[data-cdel]').forEach(b => b.onclick = () => { me.checklist.splice(+b.dataset.cdel, 1); saveMe(); renderMe(); });
    const addCheck = () => { const v = $('meCheckNew').value.trim(); if (!v) return; me.checklist.push(v); saveMe(); renderMe(); $('meCheckNew').focus(); };
    $('meCheckAdd').onclick = addCheck; $('meCheckNew').onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addCheck(); } };
    box.querySelectorAll('[data-ndel]').forEach(b => b.onclick = () => { me.notes.splice(+b.dataset.ndel, 1); saveMe(); renderMe(); });
    const addNote = () => { const v = $('meNoteNew').value.trim(); if (!v) return; me.notes.push({ t: Date.now(), text: v, by: 'me' }); saveMe(); renderMe(); };
    $('meNoteAdd').onclick = addNote; $('meNoteNew').onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addNote(); } };
    box.querySelectorAll('[data-pdel]').forEach(b => b.onclick = () => { me.prompts.splice(+b.dataset.pdel, 1); saveMe(); renderMe(); renderQuick(); });
    box.querySelectorAll('[data-pedit]').forEach(b => b.onclick = () => editPrompt(+b.dataset.pedit));
    $('mePromptAdd').onclick = () => editPrompt(null);
  }
  function editPrompt(i) {
    const q = i == null ? { title: '', text: '' } : me.prompts[i];
    const d = dialog(`<h3>${i == null ? '질문 단추 만들기' : '질문 단추 고치기'}</h3><form class="sc-form">
      <label>단추 이름<input type="text" name="title" value="${esc(q.title)}" placeholder="예: 아침 브리핑" maxlength="20"></label>
      <label>보낼 질문<textarea name="text" rows="5" placeholder="예: 내 종목 중 손절가 5% 안쪽인 것만 골라 대응 계획을 세워 줘">${esc(q.text)}</textarea></label>
      <p class="hint">끝을 한 칸 띄우면 보내지 않고 입력 칸에 채웁니다 (예: "매수 전 점검. 종목은 ").</p>
      <div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">저장</button></div></form>`);
    const f = d.el.querySelector('form'); setTimeout(() => f.title.focus(), 30); d.el.querySelector('[data-x]').onclick = d.close;
    f.onsubmit = e => { e.preventDefault(); const o = { title: f.title.value.trim(), text: f.text.value.replace(/^\s+/, '') }; if (!o.title || !o.text.trim()) { toast('이름과 질문을 넣어 주세요', 1800); return; } if (i == null) me.prompts.push(o); else me.prompts[i] = o; saveMe(); d.close(); renderMe(); renderQuick(); };
  }
  function usePrompt(text) { const q = $('q'); if (/ $/.test(text)) { show('chat'); q.value = text; grow(); q.focus(); q.setSelectionRange(text.length, text.length); return; } show('chat'); send(text); }
  function renderQuick() {
    const box = $('quick'); const on = cur && cur.view.length;
    box.innerHTML = on ? me.prompts.map((q, i) => `<button type="button" data-qi="${i}" title="${esc(q.text)}">${esc(q.title)}</button>`).join('') : '';
    box.querySelectorAll('[data-qi]').forEach(b => b.onclick = () => usePrompt(me.prompts[+b.dataset.qi].text));
  }

  /* 백업: API 키는 빼고 (키는 기기마다 따로 넣음) */
  $('meExport').onclick = () => {
    const data = { app: 'DPV-SECRET', v: 1, at: new Date().toISOString(), me, journal, watch, chats, calc: LS.get(K_CALC, {}) };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
    a.download = `secret-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('내보냈습니다 (API 키는 들어 있지 않습니다)', 2600);
  };
  $('meImport').onclick = () => $('meFile').click();
  $('meFile').onchange = async e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    let d; try { d = JSON.parse(await file.text()); } catch (err) { toast('읽을 수 없는 파일입니다', 2200); return; }
    if (!d || d.app !== 'DPV-SECRET') { toast('SECRET 백업 파일이 아닙니다', 2200); return; }
    if (!(await confirmBox('백업을 가져올까요?', `${String(d.at || '').slice(0, 10)} 백업의 나의 원칙 · 매매 일지 · 관심 종목 · 계산기를 지금 것과 바꿉니다. 대화는 없는 것만 더합니다. API 연결은 그대로 둡니다.`, '가져오기'))) return;
    if (d.me) { Object.keys(me).forEach(k => delete me[k]); Object.assign(me, JSON.parse(JSON.stringify(ME0)), d.me); me.profile = Object.assign({}, ME0.profile, me.profile); me.answer = Object.assign({}, ME0.answer, me.answer); saveMe(); }
    if (Array.isArray(d.journal)) { journal = d.journal; saveJournal(); }
    if (d.watch && Array.isArray(d.watch.items)) { watch = d.watch; watch.quotes = watch.quotes || {}; saveWatch(); }
    if (d.calc) LS.set(K_CALC, d.calc);
    if (Array.isArray(d.chats)) { for (const c of d.chats) if (c && c.id && !chats.some(x => x.id === c.id)) chats.push(c); saveChats(); renderChatList(); }
    toast('가져왔습니다', 2200); renderMe(); $('cWatch').textContent = watch.items.length || '';
  };

  /* =====================================================================
     매매 일지 — 내 실제 승률 · 손익비 · 습관
     ===================================================================== */
  const isClosed = t => t.exit !== '' && t.exit != null && +t.exit > 0;
  const jR = t => { const risk = Math.abs(+t.entry - +t.stop); return risk > 0 && isClosed(t) ? (+t.exit - +t.entry) / risk : null; };
  function jStats() {
    const closed = journal.filter(isClosed), n = closed.length;
    const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null, r2 = v => v == null ? null : Math.round(v * 100) / 100;
    const win = t => +t.exit > +t.entry;
    const wins = closed.filter(win), losses = closed.filter(t => !win(t));
    const days = closed.map(t => t.openDate && t.closeDate ? (new Date(t.closeDate) - new Date(t.openDate)) / 864e5 : null).filter(v => v != null && v >= 0);
    const by = key => { const o = {}; for (const t of closed) { const k = key(t) || '미기록'; o[k] = o[k] || { trades: 0, wins: 0 }; o[k].trades++; if (win(t)) o[k].wins++; } for (const k in o) o[k].winRatePct = Math.round(o[k].wins / o[k].trades * 100); return o; };
    return {
      closedTrades: n, openTrades: journal.length - n, winRatePct: n ? r2(wins.length / n * 100) : null,
      avgWinR: r2(avg(wins.map(jR).filter(v => v != null))), avgLossR: r2(avg(losses.map(jR).filter(v => v != null))),
      expectancyR: r2(avg(closed.map(jR).filter(v => v != null))), avgReturnPct: r2(avg(closed.map(t => (+t.exit / +t.entry - 1) * 100))),
      totalPnl: Math.round(closed.reduce((a, t) => a + (+t.exit - +t.entry) * (+t.qty || 0), 0)), avgHoldDays: r2(avg(days)),
      byEmotion: by(t => t.emotion), byExitReason: by(t => t.exitReason),
      byChecklist: by(t => t.checkTotal ? ((t.checks || []).length >= t.checkTotal ? '체크리스트 모두 지킴' : '일부만 지킴') : ''),
    };
  }
  const EMO = ['계획대로 차분히', '확신', '불안', '조급함 (놓칠까 봐)', '만회하려고', '지루해서'];
  const EXITR = ['목표가 도달', '손절가 도달', '계획을 바꿈 (근거 있음)', '감정적으로 (불안 · 조급)', '기타'];
  function renderJournal() {
    const st = jStats(); $('cJournal').textContent = journal.length || '';
    const R = v => v == null ? '–' : (v > 0 ? '+' : '') + v + 'R';
    $('jSum').innerHTML = `<div><span>끝난 매매 · 보유 중</span><b>${st.closedTrades} · ${st.openTrades}</b></div><div><span>승률</span><b>${st.winRatePct == null ? '–' : st.winRatePct + '%'}</b></div><div><span>평균 이익 · 평균 손실</span><b>${R(st.avgWinR)} · ${R(st.avgLossR)}</b></div><div><span>1회 기대값</span><b class="${cls(st.expectancyR)}">${R(st.expectancyR)}</b></div><div><span>손익 합계</span><b class="${cls(st.totalPnl)}">${st.closedTrades ? num(st.totalPnl, 0) : '–'}</b></div><div><span>평균 보유</span><b>${st.avgHoldDays == null ? '–' : st.avgHoldDays + '일'}</b></div>`;
    const list = journal.map((t, i) => [t, i]).sort((a, b) => (isClosed(a[0]) - isClosed(b[0])) || String(b[0].openDate || '').localeCompare(String(a[0].openDate || '')));
    const rows = list.map(([t, i]) => {
      const closed = isClosed(t), q = (watch.quotes[String(t.symbol || '').toUpperCase()] || {}).price;
      const px = closed ? +t.exit : q, risk = Math.abs(+t.entry - +t.stop);
      const r = px && risk > 0 ? (px - +t.entry) / risk : null, ret = px ? (px / +t.entry - 1) * 100 : null, pnl = px && t.qty ? (px - +t.entry) * +t.qty : null;
      return `<tr><td>${esc(t.openDate || '')}${closed && t.closeDate ? `<br><span style="font-size:var(--fs-xs);color:var(--ui-muted)">→ ${esc(t.closeDate)}</span>` : ''}</td>
        <td class="sym"><b>${esc(t.symbol)}</b>${closed ? `<span class="sc-tag">${esc(t.exitReason || '청산')}</span>` : '<span class="sc-tag open">보유 중</span>'}</td>
        <td>${num(+t.entry)}</td><td>${t.qty ? num(+t.qty, 4) : '–'}</td><td>${t.stop ? num(+t.stop) : '–'}</td><td>${t.target ? num(+t.target) : '–'}</td>
        <td>${closed ? num(+t.exit) : q ? `<span title="현재가">${num(q)}</span>` : '–'}</td>
        <td class="${cls(r)}">${r == null ? '–' : (r > 0 ? '+' : '') + r.toFixed(2) + 'R'}<br><span style="font-size:var(--fs-xs)">${pct(ret, 1)}</span></td>
        <td class="${cls(pnl)}">${pnl == null ? '–' : num(pnl, 0)}</td>
        <td>${esc(t.emotion || '–')}</td><td>${t.checkTotal ? `${(t.checks || []).length}/${t.checkTotal}` : '–'}</td>
        <td class="why">${t.reason ? `<b>이유</b> ${esc(t.reason)}` : ''}${t.lesson ? `<br><b>교훈</b> ${esc(t.lesson)}` : ''}</td>
        <td><span class="acts"><button class="btn ghost" data-jed="${i}" title="고치기 · 청산 적기" aria-label="${esc(t.symbol)} 고치기">${icon('edit', 15)}</button><button class="btn ghost" data-jrm="${i}" title="지우기" aria-label="${esc(t.symbol)} 지우기">${icon('trash', 15)}</button></span></td></tr>`;
    }).join('');
    $('jTable').innerHTML = `<thead><tr><th>날짜</th><th>종목</th><th>진입가</th><th>수량</th><th>손절</th><th>목표</th><th>청산 · 현재가</th><th>결과</th><th>손익</th><th>그때 감정</th><th>체크</th><th>이유 · 교훈</th><th></th></tr></thead><tbody>${rows || '<tr><td class="empty" colspan="13">아직 기록이 없습니다. 살 때 [매매 기록] 으로 이유 · 손절가 · 감정을 적고, 팔 때 같은 줄을 열어 청산가와 교훈을 적으세요.</td></tr>'}</tbody>`;
    const bc = st.byChecklist, a = bc['체크리스트 모두 지킴'], b = bc['일부만 지킴'];
    $('jNote').textContent = (st.closedTrades < 5 ? `끝난 매매가 ${st.closedTrades}건입니다. 5건 이상 쌓이면 통계가 의미 있어지고, 20건 이상이면 계산기의 승률로 쓸 만합니다. ` : '') + (a && b ? `체크리스트를 다 지켰을 때 승률 ${a.winRatePct}% (${a.trades}건) · 일부만 지켰을 때 ${b.winRatePct}% (${b.trades}건). ` : '') + 'R = (청산가 − 진입가) ÷ (진입가 − 손절가). 1R 은 처음 정한 손실 한 번만큼입니다.';
    $('jTable').querySelectorAll('[data-jed]').forEach(b => b.onclick = () => editTrade(+b.dataset.jed));
    $('jTable').querySelectorAll('[data-jrm]').forEach(b => b.onclick = async () => { const t = journal[+b.dataset.jrm]; if (await confirmBox(`${t.symbol} 기록을 지울까요?`, '이 기기의 매매 일지에서 지웁니다.', '지우기')) { journal.splice(+b.dataset.jrm, 1); saveJournal(); renderJournal(); } });
  }
  function editTrade(i) {
    const today = new Date().toISOString().slice(0, 10);
    const t = i == null ? { openDate: today, symbol: '', entry: '', qty: '', stop: '', target: '', reason: '', emotion: '', checks: [], closeDate: '', exit: '', exitReason: '', lesson: '' } : Object.assign({}, journal[i]);
    const v = k => esc(t[k] == null ? '' : t[k]);
    const n = (k, l) => `<label>${l}<input type="number" step="any" min="0" name="${k}" value="${v(k)}"></label>`;
    const checks = me.checklist.map((c, j) => `<label><input type="checkbox" name="ck" value="${esc(c)}"${(t.checks || []).includes(c) ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('');
    const d = dialog(`<h3>${i == null ? '매매 기록' : esc(t.symbol) + ' 기록'}</h3><form class="sc-form">
      <div class="grid3"><label>산 날<input type="date" name="openDate" value="${v('openDate')}"></label><label>종목<input type="text" name="symbol" value="${v('symbol')}" placeholder="예: AAPL"></label>${n('entry', '진입가')}${n('qty', '수량')}${n('stop', '손절가')}${n('target', '목표가')}</div>
      <label>산 이유 (한두 문장)<textarea name="reason" rows="2" placeholder="예: 실적 서프라이즈 뒤 20일선 지지 확인">${v('reason')}</textarea></label>
      <label>그때 감정<select name="emotion"><option value="">고르기</option>${EMO.map(o => `<option${t.emotion === o ? ' selected' : ''}>${o}</option>`).join('')}</select></label>
      ${me.checklist.length ? `<fieldset><legend>매수 전 체크리스트 (지킨 것)</legend><div class="sc-checks">${checks}</div></fieldset>` : ''}
      <fieldset><legend>판 뒤에 적기 (보유 중이면 비워 둠)</legend>
        <div class="grid3"><label>판 날<input type="date" name="closeDate" value="${v('closeDate')}"></label>${n('exit', '청산가')}<label>판 이유<select name="exitReason"><option value="">고르기</option>${EXITR.map(o => `<option${t.exitReason === o ? ' selected' : ''}>${o}</option>`).join('')}</select></label></div>
        <label>배운 것<textarea name="lesson" rows="2" placeholder="예: 손절가를 미뤄서 손실이 2배가 됐다">${v('lesson')}</textarea></label>
      </fieldset>
      <div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">저장</button></div></form>`, 'sc-dlg wide');
    const f = d.el.querySelector('form'); setTimeout(() => (i == null ? f.symbol : f.exit).focus(), 30); d.el.querySelector('[data-x]').onclick = d.close;
    f.onsubmit = e => {
      e.preventDefault();
      const o = { id: t.id || uid() };
      for (const k of ['openDate', 'symbol', 'reason', 'emotion', 'closeDate', 'exitReason', 'lesson']) o[k] = f[k].value.trim();
      for (const k of ['entry', 'qty', 'stop', 'target', 'exit']) o[k] = f[k].value === '' ? '' : +f[k].value;
      o.symbol = o.symbol.toUpperCase();
      if (!o.symbol || !(o.entry > 0)) { toast('종목과 진입가를 넣어 주세요', 2000); return; }
      if (o.exit && !o.closeDate) o.closeDate = today;
      o.checks = [...f.querySelectorAll('[name=ck]:checked')].map(x => x.value); o.checkTotal = me.checklist.length;
      if (i == null) journal.push(o); else journal[i] = o; saveJournal(); d.close(); renderJournal();
      if (!o.stop) toast('손절가가 없으면 R(손익비) 을 계산할 수 없습니다', 2600);
    };
  }
  $('jAdd').onclick = () => editTrade(null);
  $('jAsk').onclick = () => { show('chat'); send('get_journal 로 내 매매 일지를 보고 회고해 줘: 승률 · 평균 이익과 손실(R) · 기대값, 감정별 · 판 이유별 · 체크리스트를 다 지켰을 때와 아닐 때의 결과 차이, 반복되는 실수 3가지, 그리고 내 규칙에 더하면 좋을 규칙 3가지. 기록이 적으면 그 한계도 말해 줘.'); };
  $('cWinJ').onclick = () => { const st = jStats(); if (st.closedTrades < 3) { toast(`끝난 매매가 ${st.closedTrades}건이라 아직 승률로 쓰기 어렵습니다`, 2600); return; } $('cWin').value = Math.round(st.winRatePct); renderCalc(); toast(`매매 일지 ${st.closedTrades}건의 승률 ${st.winRatePct}% 를 넣었습니다`, 2400); };

  /* =====================================================================
     가격 알림 · 자동 새로 고침 (이 화면을 열어 둔 동안만)
     ===================================================================== */
  function alertsHit() {
    const out = [];
    for (const it of watch.items) { const p = (watch.quotes[it.symbol] || {}).price; if (!p) continue; if (it.alertHi && p >= +it.alertHi) out.push({ symbol: it.symbol, kind: '이상', level: +it.alertHi, price: p }); if (it.alertLo && p <= +it.alertLo) out.push({ symbol: it.symbol, kind: '이하', level: +it.alertLo, price: p }); }
    return out;
  }
  let autoTm = 0;
  function setAuto() {
    clearInterval(autoTm); const m = +(cfg.auto || 0); $('wAuto').value = String(m);
    if (m > 0) autoTm = setInterval(() => { if (document.visibilityState === 'visible' && dataFor('quote') && watch.items.length) refreshQuotes(true); }, m * 60000);
  }
  $('wAuto').onchange = e => { cfg.auto = +e.target.value; saveCfg(); setAuto(); toast(cfg.auto ? `${cfg.auto}분마다 시세를 다시 불러옵니다 (이 화면을 열어 둔 동안)` : '자동 새로 고침을 껐습니다', 2400); };

  /* =====================================================================
     화면 전환 (2)
     ===================================================================== */
  const VIEWS = { chat: 'vChat', me: 'vMe', watch: 'vWatch', journal: 'vJournal', calc: 'vCalc', refs: 'vRefs', apis: 'vApis' };
  function show(v) {
    for (const [k, id] of Object.entries(VIEWS)) $(id).hidden = k !== v;
    document.querySelectorAll('.rail [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    if (v === 'watch') renderWatch(); if (v === 'journal') renderJournal(); if (v === 'me') renderMe(); if (v === 'calc') renderCalc(); if (v === 'refs') renderRefs(); if (v === 'apis') renderApis(); if (v === 'chat') renderChat();
    try { history.replaceState(null, '', v === 'chat' ? 'secret.html' : 'secret.html#' + v); } catch (e) { }
  }
  document.querySelectorAll('.rail [data-view]').forEach(b => b.onclick = () => show(b.dataset.view));

  fillIcons(document);
  $('cWatch').textContent = watch.items.length || ''; $('cApi').textContent = cfg.apis.length || ''; $('cJournal').textContent = journal.length || '';
  setAuto();
  renderChatList();
  show(VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'chat');
  addEventListener('hashchange', () => { const v = location.hash.slice(1); if (VIEWS[v]) show(v); });
})();
