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
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 7.97Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.2-8.2"/><path d="m16 7 3 3"/><path d="m13.5 9.5 2 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.4-3.4 4.3-5 7.5-5s6.1 1.6 7.5 5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    pie: '<path d="M12 3v9h9"/><path d="M20.4 15.5A9 9 0 1 1 8.5 3.7"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/>',
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
  let chats = []; // 대화는 IndexedDB(ws-secret · chats) 에 모두 보관 — 개수 제한 없음 (아래에서 불러옴)
  let watch = LS.get(K_WATCH, { items: [], quotes: {} });
  const SYNCQ = { mark() { }, tomb() { } }; // 기기 동기화가 채움 (아래)
  const saveCfg = () => { LS.set(K_CFG, cfg); SYNCQ.mark('cfg'); };
  const IDB = {
    db: null,
    open() { return this.db || (this.db = new Promise((res, rej) => { const r = indexedDB.open('ws-secret', 1); r.onupgradeneeded = () => r.result.createObjectStore('chats', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); },
    async tx(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('chats', mode); const q = fn(t.objectStore('chats')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); },
    all() { return this.tx('readonly', s => s.getAll()); },
    put(c) { return this.tx('readwrite', s => s.put(c)).catch(e => console.warn('대화 저장 실패', e)); },
    del(id) { return this.tx('readwrite', s => s.delete(id)).catch(() => { }); },
  };
  const savedAt = {};
  function saveChats() {
    chats.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    let any = false;
    for (const c of chats) if (savedAt[c.id] !== c.updated) { savedAt[c.id] = c.updated; const o = Object.assign({}, c); delete o.live; IDB.put(o); any = true; }
    if (any) SYNCQ.mark('chats');
  }
  const saveWatch = () => { LS.set(K_WATCH, watch); SYNCQ.mark('watch'); };

  /* ---------- API 종류 ---------- */
  const TYPES = {
    claude: { kind: 'ai', name: 'Claude (Anthropic)', model: 'claude-opus-5-5', keyUrl: 'https://console.anthropic.com/settings/keys', note: '웹 검색 · 시세 도구 · 실시간 답변을 모두 씁니다. 기본 모델 Claude Opus 5.5.' },
    openai: { kind: 'ai', name: 'OpenAI', base: 'https://api.openai.com/v1', keyUrl: 'https://platform.openai.com/api-keys', note: '시세 도구를 씁니다 (웹 검색 없음). 모델 이름을 넣어 주세요.' },
    gemini: { kind: 'ai', name: 'Google Gemini', base: 'https://generativelanguage.googleapis.com/v1beta/openai', keyUrl: 'https://aistudio.google.com/apikey', note: 'OpenAI 호환 주소로 연결합니다. 모델 이름을 넣어 주세요.' },
    compat: { kind: 'ai', name: '기타 AI (OpenAI 호환)', base: '', note: 'chat/completions 를 받는 주소(…/v1)와 모델 이름을 넣습니다.' },
    finnhub: { kind: 'data', name: 'Finnhub', caps: ['quote', 'news'], keyUrl: 'https://finnhub.io/dashboard', note: '현재가 · 회사 뉴스 (무료: 분당 60회, 주로 미국 종목).' },
    twelvedata: { kind: 'data', name: 'Twelve Data', caps: ['quote', 'history'], keyUrl: 'https://twelvedata.com/account/api-keys', note: '현재가 · 일봉 (무료: 하루 800회). 한국 종목은 요금제에 따라 다릅니다.' },
    alphavantage: { kind: 'data', name: 'Alpha Vantage', caps: ['quote', 'history', 'news'], keyUrl: 'https://www.alphavantage.co/support/#api-key', note: '현재가 · 일봉 · 뉴스 감성 (무료: 하루 25회).' },
    datagokr: { kind: 'data', name: '공공데이터포털 주식시세 (금융위원회)', caps: ['quote', 'history'], keyUrl: 'https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword=%EC%A3%BC%EC%8B%9D%EC%8B%9C%EC%84%B8%EC%A0%95%EB%B3%B4', note: '국내 상장 종목의 하루 단위 시세 · 일봉 (무료). 마지막 영업일 종가 기준이라 장중 실시간은 아닙니다. 마이페이지의 일반 인증키를 Encoding · Decoding 어느 쪽이든 그대로 붙여 넣으세요. 종목은 6자리 코드(005930)나 종목명(삼성전자).' },
    ksd: { kind: 'data', name: '한국예탁결제원 주식정보 (공공데이터포털)', caps: ['ksd'], keyUrl: 'https://www.data.go.kr/data/15157413/openapi.do', note: '시세가 아니라 종목의 "속사정"을 봅니다: 표준코드 · 발행일 · 상장일/상장폐지 · 배당 순위(시가배당률 · 주당배당금) · 의무보호예수(풀릴 물량) · 신규 예탁 지정 · 시장별 발행주식수. 공공데이터포털 일반 인증키를 그대로 붙여 넣으세요 (금융위원회 시세와 같은 키).' },
    kisrelay: { kind: 'data', name: '한국투자증권 KIS (실시간 중계)', caps: ['quote', 'history'], note: '국내 종목 실시간 현재가 · 일봉 · PER · PBR · 52주 고저. 앱키 · 앱시크릿은 여기가 아니라 내 Cloudflare 중계에 넣습니다 (주문 기능 없는 시세 전용). 아래 [중계 만드는 법] 대로 한 번 만든 뒤, 주소 칸에 중계 주소, API 키 칸에 중계 암호를 넣으세요.' },
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
    const was = LS.get(K_REMEMBER, null);
    cfg.lock.iv = b64(iv); cfg.lock.data = b64(data); cfg.lock.ids = Object.keys(keyMem).filter(id => keyMem[id]); saveCfg();
    if (was && was.exp > Date.now()) LS.set(K_REMEMBER, { exp: was.exp, data: cfg.lock.data, keys: keyMem });
  }
  /* 이 기기에서 기억 (30일): 잠금 암호를 매번 묻지 않게. 내 기기의 저장소에만 두고, 동기화(GitHub)에는 올리지 않음 */
  const K_REMEMBER = 'sec:keyRemember', REMEMBER_DAYS = 30;
  function remembered() {
    const r = LS.get(K_REMEMBER, null);
    if (!r || !cfg.lock || r.data !== cfg.lock.data || !(r.exp > Date.now())) return null;
    return r.keys || null;
  }
  function remember(on) {
    if (on && cfg.lock && keyMem) LS.set(K_REMEMBER, { exp: Date.now() + REMEMBER_DAYS * 864e5, data: cfg.lock.data, keys: keyMem });
    else if (!on) { try { localStorage.removeItem(K_REMEMBER); } catch (e) { } }
  }
  const fillIds = () => { if (cfg.lock && keyMem && !cfg.lock.ids) { cfg.lock.ids = Object.keys(keyMem).filter(id => keyMem[id]); saveCfg(); } }; // 예전 잠금에도 키 목록을
  { const r0 = remembered(); if (r0) { keyMem = Object.assign({}, r0); setTimeout(fillIds, 0); } } // 이 기기에서 기억 중이면 처음부터 풀린 채로
  let unlocking = null; // 여러 시세를 한꺼번에 불러도 암호 창은 하나만
  function unlock(force) {
    if (!cfg.lock || (keyMem && (!force || lockKey))) return Promise.resolve(true);
    if (!force) { const r = remembered(); if (r) { keyMem = Object.assign({}, r); return Promise.resolve(true); } }
    if (unlocking) return unlocking;
    unlocking = (async () => {
      const pass = await askPass('API 키 잠금 풀기', '잠금 암호를 넣어 주세요.', false, true);
      if (pass == null) return false;
      try {
        const k = await derive(pass, unb64(cfg.lock.salt));
        const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(cfg.lock.iv) }, k, unb64(cfg.lock.data));
        lockKey = k; keyMem = JSON.parse(dec.decode(raw)); fillIds(); remember(askPass.remember); renderApis(); return true;
      } catch (e) { toast('암호가 맞지 않습니다', 2200); return false; }
    })();
    return unlocking.finally(() => { unlocking = null; });
  }
  let adoptTried = false; // 다른 기기의 키 받기는 이 화면에서 한 번만 자동으로 물음 (그 뒤엔 [이 기기 연결] 단추로)
  async function keyOf(api) {
    if (!cfg.lock) { if (api.key) return api.key; }
    else { if (!(await unlock())) throw new Error('API 키 잠금을 풀지 않았습니다'); if (keyMem[api.id]) return keyMem[api.id]; }
    if (remoteHas(api.id) && !adoptTried) { adoptTried = true; if (await adoptRemoteKeys()) return cfg.lock && keyMem ? keyMem[api.id] || '' : api.key || ''; }
    return '';
  }
  async function setKey(api, key) {
    if (!cfg.lock) { api.key = key; return; }
    if (!(await unlock(true))) throw new Error('API 키 잠금을 풀어야 저장할 수 있습니다'); // 잠그려면 열쇠가 있어야 해서 이때는 암호를 물음
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
  function askPass(title, desc, twice, rememberBox) {
    askPass.remember = false;
    return new Promise(res => {
      const d = dialog(`<h3>${esc(title)}</h3><p class="modal-desc">${esc(desc)}</p><form class="sc-form"><label>암호<input type="password" id="pw1" autocomplete="new-password" required minlength="4"></label>${twice ? '<label>한 번 더<input type="password" id="pw2" autocomplete="new-password" required></label>' : ''}${rememberBox ? `<label class="sc-check"><input type="checkbox" id="pwKeep" checked><span>이 기기에서 ${REMEMBER_DAYS}일 동안 다시 묻지 않기</span></label>` : ''}<div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">확인</button></div></form>`, 'ask');
      const f = d.el.querySelector('form'); setTimeout(() => d.el.querySelector('#pw1').focus(), 30);
      let done = false; const fin = v => { if (done) return; done = true; d.close(); res(v); };
      d.bg.addEventListener('closed', () => fin(null)); d.el.querySelector('[data-x]').onclick = () => fin(null);
      f.onsubmit = e => { e.preventDefault(); const a = d.el.querySelector('#pw1').value; if (twice && a !== d.el.querySelector('#pw2').value) { toast('두 암호가 다릅니다', 2000); return; } const kp = d.el.querySelector('#pwKeep'); askPass.remember = !!(kp && kp.checked); fin(a); };
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
    /* 공공데이터포털 · 금융위원회_주식시세정보 (브라우저에서 바로 불러올 수 있음) */
    datagokr: {
      async _get(k, s, days) {
        const k0 = String(k || '').replace(/\s+/g, ''); // 붙여 넣을 때 딸려 온 빈칸 · 줄바꿈 제거
        const key = /%[0-9A-F]{2}/i.test(k0) ? decodeURIComponent(k0) : k0; // Encoding 키를 넣어도 두 번 바뀌지 않게
        const q = String(s).trim().replace(/\.(KS|KQ|KRX)$/i, '').replace(/:KRX$/i, '');
        const code = (q.match(/^A?(\d{6})$/i) || [])[1];
        const ymd8 = d => d.toISOString().slice(0, 10).replace(/-/g, '');
        const from = new Date(Date.now() - Math.ceil(days * 1.5 + 10) * 864e5);
        const qs = '?resultType=json&pageNo=1'
          + `&numOfRows=${Math.min(Math.ceil(days * 1.5) + 20, 1000)}&beginBasDt=${ymd8(from)}&serviceKey=${E(key)}`
          + (code ? `&likeSrtnCd=${code}` : `&itmsNm=${E(q)}`);
        /* 새 주소(V2)를 먼저, 키가 옛 주소에만 등록돼 있으면 옛 주소로 */
        const URLS = ['https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2', 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo'];
        let r, t, j, bad, first = null;
        for (const u of URLS) {
          try { r = await fetch(u + qs); } catch (e) { throw new Error('공공데이터포털에 연결하지 못했습니다 (네트워크)'); }
          t = await r.text(); j = null; try { j = JSON.parse(t); } catch (e) { }
          bad = j && j.OpenAPI_ServiceResponse && j.OpenAPI_ServiceResponse.cmmMsgHeader;
          if (!bad) break;
          first = first || bad;
        }
        if (bad) bad = first; // 두 곳 다 안 되면 새 주소의 오류로 알림
        if (bad) throw new Error('공공데이터포털: ' + (bad.returnAuthMsg || bad.errMsg) + (/NOT_REGISTERED/.test(bad.errMsg || '') ? ' — ① 활용신청한 서비스가 정확히 「금융위원회_주식시세정보」 인지 (주식발행정보 · KRX상장종목정보 등은 다른 서비스) ② 승인 직후면 1~2시간 뒤 ③ 마이페이지의 일반 인증키를 다시 복사' : ''));
        if (!j || !j.response) throw new Error(`공공데이터포털 오류 ${r.status}: ${t.slice(0, 160)}`);
        if (j.response.header && j.response.header.resultCode !== '00') throw new Error('공공데이터포털: ' + j.response.header.resultMsg);
        let it = j.response.body && j.response.body.items && j.response.body.items.item; it = Array.isArray(it) ? it : it ? [it] : [];
        if (code) it = it.filter(x => x.srtnCd === code);
        if (!it.length) throw new Error(`${s}: 시세가 없습니다 — 6자리 종목 코드(005930)나 정확한 종목명(삼성전자)으로 찾아 주세요`);
        return it.sort((a, b) => a.basDt.localeCompare(b.basDt));
      },
      async quote(k, s) {
        const a = await this._get(k, s, 7), x = a[a.length - 1], n = v => +String(v).replace(/,/g, '');
        const d = `${x.basDt.slice(0, 4)}-${x.basDt.slice(4, 6)}-${x.basDt.slice(6)}`;
        return { symbol: x.srtnCd, name: x.itmsNm, exchange: x.mrktCtg, currency: 'KRW', price: n(x.clpr), change: n(x.vs), changePct: n(x.fltRt), open: n(x.mkp), high: n(x.hipr), low: n(x.lopr), prevClose: n(x.clpr) - n(x.vs), volume: n(x.trqu), marketCap: n(x.mrktTotAmt), time: d, source: `공공데이터포털 (${d} 종가 · 실시간 아님)` };
      },
      async history(k, s, days) {
        const n = v => +String(v).replace(/,/g, '');
        return (await this._get(k, s, days)).map(x => ({ t: `${x.basDt.slice(0, 4)}-${x.basDt.slice(4, 6)}-${x.basDt.slice(6)}`, o: n(x.mkp), h: n(x.hipr), l: n(x.lopr), c: n(x.clpr), v: n(x.trqu) })).slice(-days);
      },
    },
    /* 공공데이터포털 · 한국예탁결제원_주식정보서비스_GW (XML) */
    ksd: {
      async call(k, op, params) {
        if (!KSD_OPS[op]) throw new Error('예탁결제원: 없는 기능 ' + op);
        const k0 = String(k || '').replace(/\s+/g, ''), key = /%[0-9A-F]{2}/i.test(k0) ? decodeURIComponent(k0) : k0;
        const q = new URLSearchParams(Object.assign({ pageNo: '1', numOfRows: '100' }, params || {}));
        let r; try { r = await fetch(`https://apis.data.go.kr/B552481/StockSvc/${op}?serviceKey=${E(key)}&${q}`); } catch (e) { throw new Error('공공데이터포털(예탁결제원)에 연결하지 못했습니다 (네트워크)'); }
        const t = await r.text(), x = new DOMParser().parseFromString(t, 'text/xml');
        const g = (el, n) => { const e = el.getElementsByTagName(n)[0]; return e ? e.textContent.trim() : ''; };
        if (x.getElementsByTagName('OpenAPI_ServiceResponse').length) {
          const m = g(x, 'returnAuthMsg') || g(x, 'errMsg');
          throw new Error('예탁결제원: ' + m + (/NOT_REGISTERED/.test(g(x, 'errMsg')) ? ' — 공공데이터포털에서 「한국예탁결제원_주식정보서비스_GW」 가 승인돼 있는지, 승인 직후면 1~2시간 뒤 다시' : ''));
        }
        const code = g(x, 'resultCode'); if (code && code !== '00') throw new Error('예탁결제원: ' + (g(x, 'resultMsg') || code));
        if (!x.getElementsByTagName('response').length && !x.getElementsByTagName('body').length) throw new Error(`예탁결제원 오류 ${r.status}: ${t.slice(0, 160)}`);
        const F = KSD_OPS[op].f || {};
        const items = Array.from(x.getElementsByTagName('item')).map(it => { const o = {}; for (const c of it.children) { const v = c.textContent.trim(); if (v !== '') o[F[c.tagName] ? `${F[c.tagName]} [${c.tagName}]` : c.tagName] = v; } return o; });
        return { op, title: KSD_OPS[op].d, total: +g(x, 'totalCount') || items.length, items };
      },
      /* 종목 하나: 기본정보 → 상장정보 → (있으면) 작년 배당 순위 */
      async stock(k, s, year) {
        const q = String(s || '').trim().replace(/\.(KS|KQ)$/i, ''), code = (q.match(/^A?(\d{6})$/i) || [])[1];
        const base = code ? await this.call(k, 'getStkIsinByShortIsinN1', { shortIsin: code }) : await this.call(k, 'getStkIsinByNmN1', { secnNm: q });
        if (!base.items.length) throw new Error(`${s}: 예탁결제원에 없는 종목입니다 (6자리 코드나 정확한 회사명으로)`);
        const pick = it => Object.fromEntries(Object.entries(it).map(([kk, v]) => [kk.replace(/^.*\[(\w+)\]$/, '$1'), v]));
        const b = pick(base.items.find(it => /보통/.test(JSON.stringify(it))) || base.items[0]);
        const out = { 기본정보: base.items.slice(0, 5) };
        if (b.isin) try { out.상장정보 = (await this.call(k, 'getStkListInfoN1', { isin: b.isin })).items; } catch (e) { out.상장정보 = '불러오지 못함: ' + e.message; }
        const sc = b.shotnIsin || code;
        if (sc) {
          const y = +year || new Date().getFullYear() - 1;
          try {
            const d = await this.call(k, 'getDividendRankN1', { rankTpcd: '1', year: String(y), numOfRows: '3000' });
            const mine = d.items.filter(it => Object.entries(it).some(([kk, v]) => /\[shotnIsin\]$/.test(kk) && v === sc));
            out[`배당(${y}년, 시가배당률 순위 · 전체 ${d.total}종목 중)`] = mine.length ? mine : '이 해 배당 순위에 없음 (무배당이거나 자료 없음)';
          } catch (e) { out.배당 = '불러오지 못함: ' + e.message; }
        }
        return out;
      },
    },
    /* 한국투자증권 KIS — 내 Cloudflare 중계(app/secret/kis-relay.worker.js)를 거쳐서. 키는 중계에만 있고 여기서는 중계 암호만 */
    kisrelay: {
      async _call(k, api, path, q) {
        const base = String(api.base || '').trim().replace(/\/+$/, '');
        if (!/^https:\/\/[^/]+/.test(base)) throw new Error('KIS 중계 주소를 넣어 주세요 (https://….workers.dev)');
        const tk = 'sec:kisTok:' + api.id; let sealed = ''; try { sealed = localStorage.getItem(tk) || ''; } catch (e) { }
        let r; try { r = await fetch(base + path + '?' + new URLSearchParams(q), { headers: Object.assign({ 'x-relay-key': String(k || '').trim() }, sealed ? { 'x-kis-token': sealed } : {}) }); }
        catch (e) { throw new Error('KIS 중계에 연결하지 못했습니다 — 중계 주소를 확인하고, 중계 코드를 최신으로 붙여 넣었는지 확인하세요'); }
        const nt = r.headers.get('x-kis-token'); if (nt) try { localStorage.setItem(tk, nt); } catch (e) { } // 토큰 봉투 (중계만 열 수 있음)
        const j = await r.json().catch(() => null);
        if (!r.ok || !j || !j.ok) throw new Error('KIS 중계: ' + ((j && j.error) || ('HTTP ' + r.status)));
        return j;
      },
      _code(s) {
        const q = String(s || '').trim().replace(/\.(KS|KQ)$/i, '').replace(/:KRX$/i, '');
        const m = q.match(/^A?([0-9A-Z]{6})$/i); if (m) return m[1].toUpperCase();
        throw new Error(`${s}: KIS 는 6자리 종목 코드로 찾습니다 (예: 삼성전자 005930)`);
      },
      async quote(k, s, api) {
        const code = this._code(s), o = (await this._call(k, api, '/quote', { code })).output || {}, n = v => (v === '' || v == null ? null : +v);
        if (!n(o.stck_prpr)) throw new Error(`${s}: 시세가 없습니다 (종목 코드를 확인하세요)`);
        return { symbol: code, currency: 'KRW', price: n(o.stck_prpr), change: n(o.prdy_vrss), changePct: n(o.prdy_ctrt), open: n(o.stck_oprc), high: n(o.stck_hgpr), low: n(o.stck_lwpr), prevClose: n(o.stck_sdpr), volume: n(o.acml_vol),
          per: n(o.per), pbr: n(o.pbr), eps: n(o.eps), week52: o.w52_hgpr ? { high: n(o.w52_hgpr), low: n(o.w52_lwpr) } : undefined, marketCapEok: n(o.hts_avls), sector: o.bstp_kor_isnm || undefined,
          time: new Date().toISOString(), source: '한국투자증권 KIS (실시간)' };
      },
      async history(k, s, days, api) {
        const code = this._code(s), j = await this._call(k, api, '/daily', { code, days });
        const d8 = x => `${x.slice(0, 4)}-${x.slice(4, 6)}-${x.slice(6)}`;
        return (j.rows || []).map(x => ({ t: d8(x.stck_bsop_date), o: +x.stck_oprc, h: +x.stck_hgpr, l: +x.stck_lwpr, c: +x.stck_clpr, v: +x.acml_vol })).filter(b => b.c).reverse();
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
  const isKR = s => /^A?\d[0-9A-Z]{5}(\.(KS|KQ))?$|:KRX$|[가-힣]/i.test(String(s || '').trim()); // 0190G0 같은 새 영문 섞인 코드(ETF 등)도
  const KSD_OPS = {
    getStkIsinByShortIsinN1: { d: '단축코드로 종목 기본정보', p: 'shortIsin*=6자리 코드', f: { secnKacdNm: '주식종류', engSecnNm: '영문 종목명', isin: '표준코드', issuDt: '발행일', issucoCustno: '발행회사번호', korSecnNm: '종목명', eltscYn: '전자증권 여부', shotnIsin: '단축코드' } },
    getStkIsinByNmN1: { d: '회사명으로 종목 기본정보', p: 'secnNm*=발행회사명', f: { shotnIsin: '단축코드', engSecnNm: '영문 종목명', isin: '표준코드', issuDt: '발행일', issucoCustno: '발행회사번호', korSecnNm: '종목명', secnKacdNm: '주식종류', eltscYn: '전자증권 여부' } },
    getStkListInfoN1: { d: '주식 상장정보', p: 'isin*=표준코드(KR…)', f: { xpitDt: '만료일자', apliDt: '상장일자', dlistDt: '상장폐지일자', isin: '표준코드', korSecnNm: '종목명', listTpcd: '상장구분코드', issucoCustno: '발행회사번호' } },
    getDividendRankN1: { d: '배당 순위', p: 'rankTpcd*=1 시가배당률 · 2 액면가배당률, year*=YYYY, stkTpcd=1 보통주 · 2 우선주, listTpcd=11 유가 · 12 코스닥 · 13 K-OTC · 14 코넥스', f: { shotnIsin: '단축코드', caltotMartTpcd: '시장', divAmtPerStk: '주당배당금', divRateCpri: '시가배당률(%)', divRatePval: '액면가배당률(%)', issucoCustno: '발행회사번호', korSecnNm: '종목명', num: '배당 순위', pval: '액면가', secnKacd: '주식종류', setaccMm: '결산월', setaccMmdd: '결산월일' } },
    getVctfDivRankInfo: { d: '유가증권시장 배당 순위', p: 'schStdYy*=YYYY', f: { shotnIsin: '단축코드', exerPrcp: '종목명', persDivamt: '주당배당금', pvalDivrate: '액면가배당률', rank: '순위' } },
    getSafeDpDutyDepoStatusN1: { d: '의무보호예수 전체 현황', p: 'stdDt*=YYYYMMDD, listTpcd=11 유가 · 12 코스닥 …', f: { stkDepoQty: '의무보유예탁 주식수', cocnt: '기업수', issuStkKindTpnm: '주식종류', issuStkqty: '총발행주식수', safedpRatioValue: '보호예수비율(%)', secncnt: '종목수', stdDt: '기준일' } },
    getSafeDpDutyDepoRgtStatusN1: { d: '의무보호예수 사유별 현황', p: 'listTpcd*=11 유가 · 12 코스닥 …, stdDt*=YYYYMMDD', f: { safedpStkDepoQty: '의무보유예탁주식수', codevalueNm: '사유', dutyDepoCocnt: '의무보호예수기업수', dutyDepoSecncnt: '의무보호예수종목수', dutyDepoStkDepoQty: '의무보호예수주식수', safedpCocnt: '의무보유예탁기업수', safedpSecncnt: '의무보유예탁종목수' } },
    getNewDepoSecnListN1: { d: '신규 예탁지정 종목', p: 'yyyymm*=YYYYMM, searchType=1 지정 · 2 취소', f: { totIssuQty: '총발행규모', apliDt: '예탁지정(취소)일자', indtpNm: '산업분류', isin: '표준코드', korSecnNm: '종목명', pval: '액면가', secnKacdNm: '주식종류', setaccMm: '결산월', eltscYn: '전자증권 여부' } },
    getTotIssuStkQty: { d: '시장별 총발행주식수', p: 'schStdDt*=YYYYMMDD', f: { vctfMart: '유가증권시장', konexMart: '코넥스시장', kosdaqMart: '코스닥시장', schStdDt: '기준일' } },
    getListStatN1: { d: '상장구분별 현황', p: 'stdDt*=YYYYMMDD', f: { payinCapsAmt: '납입자본금', secncnt: '종목수', caltotMartTpcd: '시장코드', cocnt: '회사수', issuStkqty: '발행주식수', martpTotamt: '시가총액' } },
    getSecSetlCostStatN1: { d: '월별 주식결제대금', p: 'schBeginDt*=YYYYMMDD, schExpryDt*=YYYYMMDD', f: { stdYymm: '기준년월', martsetlTrCost: '시장결제 거래대금', martsetlSetlCost: '시장결제 결제대금', stkisetlTrCost: '기관결제 거래대금', stkisetlSetlCost: '기관결제 결제대금', kotcTrCost: 'K-OTC 거래대금', kotcSetlCost: 'K-OTC 결제대금' } },
    getShotnByMartN1: { d: '시장별 단축코드 전체', p: 'martTpcd*=11 유가 · 12 코스닥 · 13 K-OTC · 14 코넥스', f: { shotnIsin: '단축코드', korSecnNm: '종목명' } },
    getXrcStkStatInfoN1: { d: '주식관련사채(CB · BW) 정보', p: 'bondIsin*=채권 표준코드', f: { xrcStkIsinNm: '행사주식종목명', korSecnNm: '채권 종목명', xrcPrice: '행사가격', xrcRatio: '행사비율(%)', xrcStkIsin: '행사주식종목번호', wrtbIsinNm: '신주인수권증권 종목명' } },
    getXrcStkOptionXrcInfoN1: { d: '주식관련사채 행사조건', p: 'bondIsin*=채권 표준코드', f: { korSecnNm: '채권 종목명', xrcPossBeginDt: '행사 시작일', xrcPossExpryDt: '행사 종료일', wrtIssuQty: '신주인수권 발행수량', xrcRatioChgPossYn: '행사비율 변동 가능' } },
    getDocInfoN1: { d: '신주인수권증서 정보', p: 'martTpcd*=11 유가 · 12 코스닥 …', f: { persFixIssuprcNm: '신주발행가격', docIssuTermBeginDt: '증서발행 시작일', docIssuTermExpryDt: '증서발행 종료일', isin: '표준코드', korSecnNm: '종목명', listDt: '상장일', paidStdDt: '유상기준일' } },
    getWrtInfoN1: { d: '신주인수권증권 정보', p: 'stdDt*=YYYYMMDD', f: { korSecnNm: '종목명', bondIsin: '채권 표준코드', deliDt: '교부일', isin: '표준코드', issuDt: '발행일', issuNtimes: '발행횟수' } },
    getKDRSecnInfo: { d: '시장별 KDR 종목', p: 'caltotMartTpcd*=11 유가 · 12 코스닥 · 13 코넥스', f: { kdrIsin: 'KDR 표준코드', korSecnNm: '종목명', listDt: '상장일', ovsListStkmkCd: '해외상장시장' } },
  };
  async function callData(cap, ...args) {
    const krs = (cap === 'quote' || cap === 'history') && isKR(args[0]) ? ['kisrelay', 'datagokr'].map(t => dataApis().find(a => a.type === t)).filter(Boolean) : [];
    if (krs.length) {
      let last = null;
      for (const a of krs) { try { return await DATA[a.type][cap](await keyOf(a), ...args, a); } catch (e) { last = e; } }
      throw last;
    }
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
    const sym = { type: 'string', description: '종목 코드. 미국은 AAPL, 한국은 6자리 코드(005930)를 먼저 쓴다(종목명도 공공데이터포털에서는 됨). 한국 종목은 KIS 중계(실시간)가 있으면 그쪽, 없거나 실패하면 공공데이터포털(전 영업일 종가)로 조회됨 — 결과의 source 로 실시간인지 확인' };
    if (dataFor('quote')) T.push({ name: 'get_quote', description: '종목의 현재가(또는 최근 종가) · 등락률 · 고가 · 저가를 등록된 시세 API 로 조회한다. 가격을 말하기 전에 반드시 이 도구로 확인한다.', input_schema: { type: 'object', properties: { symbol: sym }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('history')) T.push({ name: 'get_price_history', description: '일봉을 받아 이 앱이 직접 계산한 지표를 돌려준다: 기간 수익률(5·20·60·120·250일), 이동평균(20·50·200), 추세 정렬, RSI14, ATR14, 20일 변동성(연율), 구간 고점 대비 하락, 최대 낙폭, 최근 10일 종가.', input_schema: { type: 'object', properties: { symbol: sym, days: { type: 'integer', description: '받을 거래일 수 (60~400, 기본 260)' } }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('news')) T.push({ name: 'get_news', description: '종목의 최근 회사 뉴스 제목 · 출처 · 링크 · 요약을 시세 API 로 받는다.', input_schema: { type: 'object', properties: { symbol: sym, days: { type: 'integer', description: '최근 며칠 (1~30, 기본 7)' } }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('custom')) T.push({ name: 'fetch_custom_data', description: '사용자가 등록한 사용자 정의 API 를 종목 코드로 불러 원문(JSON 또는 텍스트)을 돌려준다.', input_schema: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('ksd')) {
      T.push({ name: 'get_ksd_stock_info', description: '한국예탁결제원 공식 자료로 한국 종목 하나의 기본정보(표준코드 · 영문명 · 발행일 · 주식종류) · 상장정보(상장일 · 상장폐지일) · 작년 배당(시가배당률 · 주당배당금 · 순위)을 돌려준다. 시세는 없다.', input_schema: { type: 'object', properties: { symbol: { type: 'string', description: '6자리 코드(005930) 또는 정확한 회사명(삼성전자)' }, year: { type: 'integer', description: '배당 기준연도 (선택, 기본 작년)' } }, required: ['symbol'], additionalProperties: false } });
      T.push({ name: 'query_ksd', description: '한국예탁결제원 주식정보의 다른 기능을 직접 부른다. 의무보호예수(풀릴 물량 → 수급 부담) · 신규 예탁지정 · 시장별 발행주식수 · 배당 순위 상위 · CB/BW 행사조건 등. op 와 params(필수는 *) — '
        + Object.entries(KSD_OPS).map(([k, v]) => `${k}: ${v.d} (${v.p})`).join(' / '),
        input_schema: { type: 'object', properties: { op: { type: 'string', enum: Object.keys(KSD_OPS) }, params: { type: 'object', description: '요청 값 (예: {"stdDt":"20261106"})', additionalProperties: { type: 'string' } } }, required: ['op'], additionalProperties: false } });
    }
    T.push({ name: 'get_portfolio', description: '사용자가 이 앱에 적어 둔 관심 종목 · 보유 수량 · 평균 단가 · 목표가 · 손절가 · 메모와 마지막으로 불러온 시세를 돌려준다.', input_schema: { type: 'object', properties: {}, additionalProperties: false } });
    T.push({ name: 'get_journal', description: '사용자의 매매 일지: 통계(승률 · 평균 이익/손실 R · 기대값 · 손익 합계 · 평균 보유일 · 감정별 · 판 이유별 · 체크리스트를 다 지켰을 때와 아닐 때의 승률)와 최근 매매 40건(진입 · 손절 · 목표 · 청산 · 이유 · 감정 · 교훈)을 돌려준다.', input_schema: { type: 'object', properties: {}, additionalProperties: false } });
    T.push({ name: 'get_notes', description: '사용자가 노트 탭에 날짜별로 적은 메모를 돌려준다. company 를 주면 그 기업이 들어간 노트만 (최근 60개).', input_schema: { type: 'object', properties: { company: { type: 'string', description: '기업 이름 (선택, 예: 삼성전자)' } }, additionalProperties: false } });
    T.push({ name: 'save_memory', description: '앞으로의 답에 계속 필요한 사용자 정보 · 선호를 한 문장으로 기억한다. 사용자가 "기억해" 라고 했거나 투자 성향 · 제약을 새로 알았을 때만 쓴다. 시세처럼 금방 바뀌는 정보나 이미 프로필에 있는 내용은 저장하지 않는다. 사용자는 나의 원칙 화면에서 보고 지울 수 있다.', input_schema: { type: 'object', properties: { text: { type: 'string', description: '기억할 한 문장' } }, required: ['text'], additionalProperties: false } });
    T.push({ name: 'position_size', description: '감수할 손실에서 거꾸로 매수 수량을 계산한다: 1주당 위험, 수량, 투입 금액과 계좌 대비 비중, 손익비(R), 손익분기 승률, 승률을 주면 1회 기대값. 비중 · 손절 · 목표를 말할 때 이 도구로 계산한다.', input_schema: { type: 'object', properties: { account: { type: 'number', description: '계좌 금액' }, risk_percent: { type: 'number', description: '한 번에 감수할 손실 % (보통 0.5~2)' }, entry: { type: 'number' }, stop: { type: 'number' }, target: { type: 'number' }, win_rate: { type: 'number', description: '예상 승률 % (선택)' } }, required: ['account', 'risk_percent', 'entry', 'stop'], additionalProperties: false } });
    return T;
  }
  const LABEL = { get_quote: '시세', get_price_history: '일봉 · 지표', get_news: '뉴스', fetch_custom_data: '사용자 API', get_ksd_stock_info: '예탁결제원 종목', query_ksd: '예탁결제원', get_portfolio: '내 종목', get_journal: '매매 일지', get_notes: '노트', save_memory: '기억함', position_size: '수량 계산', web_search: '웹 검색' };
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
      case 'get_ksd_stock_info': { const a = dataFor('ksd'); const r = await DATA.ksd.stock(await keyOf(a), String(input.symbol).trim(), input.year); return Object.assign({ symbol: s, source: '한국예탁결제원 (공공데이터포털)' }, r); }
      case 'query_ksd': { const a = dataFor('ksd'); const r = await DATA.ksd.call(await keyOf(a), String(input.op), Object.fromEntries(Object.entries(input.params || {}).map(([k2, v]) => [k2, String(v)]))); if (r.items.length > 200) { r.note = `${r.items.length}건 중 앞 200건만`; r.items = r.items.slice(0, 200); } return r; }
      case 'get_notes': { const c = String(input.company || '').trim(); const list = notes.filter(n => !c || (n.companies || []).includes(c) || String(n.text).includes(c)).sort((a, b) => a.date.localeCompare(b.date)).slice(-60); return { company: c || null, count: list.length, notes: list.map(n => ({ date: n.date, companies: n.companies, text: n.text })) }; }
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
- 사용자의 보유 · 관심 종목이 관련되면 get_portfolio 로, 과거 매매 · 습관이 관련되면 get_journal 로, 특정 기업에 대해 사용자가 적어 둔 생각이 관련되면 get_notes 로 먼저 확인합니다.
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
  const K_CUR = 'sec:curChat';
  const keepCur = () => { try { if (cur && cur.id) localStorage.setItem(K_CUR, cur.id); else localStorage.removeItem(K_CUR); } catch (e) { } };
  function openChat(id) { cur = chats.find(c => c.id === id) || null; keepCur(); renderChat(); renderChatList(); }

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
    if (!cur) { cur = newChat(); chats.unshift(cur); keepCur(); }
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
    const hb = $('btnHist'); if (hb) { hb.querySelector('em').textContent = chats.length || ''; hb.hidden = !chats.length; }
    renderAiSel(); renderMsgs(); renderQuick();
  }
  function renderChatList() {
    const box = $('chatList'); const list = chats.slice(0, 12);
    box.innerHTML = list.length ? '<b>최근 대화</b>' + list.map(c => `<div class="sc-chat-i${cur && cur.id === c.id ? ' on' : ''}"><button class="t" data-c="${c.id}" title="${esc(c.title)}">${esc(c.title)}</button><button class="x" data-del="${c.id}" title="이 대화 지우기" aria-label="이 대화 지우기">${icon('x', 14)}</button></div>`).join('') + `<button type="button" class="all" id="allChats">모든 대화 ${chats.length}개 보기</button>` : '';
    const all = $('allChats'); if (all) all.onclick = () => show('history');
    box.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { show('chat'); openChat(b.dataset.c); });
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const c = chats.find(x => x.id === b.dataset.del); if (!c) return;
      if (!(await confirmBox('대화를 지울까요?', `"${c.title}" 대화를 이 기기에서 지웁니다. 되돌릴 수 없습니다.`, '지우기'))) return;
      chats = chats.filter(x => x !== c); if (cur === c) cur = null; IDB.del(c.id); SYNCQ.tomb('chats', c.id); renderChat(); renderChatList();
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
  $('btnHist').onclick = () => show('history');
  $('btnNew').onclick = () => { if (busy) return; cur = null; keepCur(); show('chat'); renderChat(); renderChatList(); $('q').focus(); };

  /* =====================================================================
     관심 종목 · 보유
     ===================================================================== */
  function renderWatch() {
    const items = watch.items; $('cWatch').textContent = items.length || '';
    let cost = 0, value = 0, priced = 0;
    const rows = items.map((it, i) => {
      const q = watch.quotes[normSym(it.symbol)] || watch.quotes[it.symbol] || {}, p = q.price, qty = +it.qty || 0, avg = +it.avg || 0;
      const pl = p && qty && avg ? (p - avg) * qty : null, plp = p && avg ? (p / avg - 1) * 100 : null;
      if (qty && avg && p) { cost += qty * avg; value += qty * p; priced++; }
      const toStop = p && it.stop ? (it.stop / p - 1) * 100 : null;
      const hit = p && ((it.alertHi && p >= +it.alertHi) || (it.alertLo && p <= +it.alertLo));
      return `<tr><td class="sym"><button type="button" class="st-link" data-open="${esc(normSym(it.symbol))}" title="종목 분석 열기"><b>${esc(it.symbol)}</b></button><span>${esc(it.name || '')}</span>${hit ? `<span class="sc-alert" title="알림 가격: ${it.alertHi ? num(+it.alertHi) + ' 이상 ' : ''}${it.alertLo ? num(+it.alertLo) + ' 이하' : ''}">알림 가격 도달</span>` : ''}</td>
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
    $('wTable').querySelectorAll('[data-open]').forEach(b => b.onclick = () => { $('stQ').value = b.dataset.open; openStock(b.dataset.open); });
    $('wTable').querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { const it = items[+b.dataset.rm]; if (await confirmBox(`${it.symbol} 을(를) 뺄까요?`, '목록에서만 빠집니다.', '빼기')) { items.splice(+b.dataset.rm, 1); saveWatch(); renderWatch(); } });
  }
  function editItem(i, preset) {
    const it = i == null ? Object.assign({ symbol: '', name: '', qty: '', avg: '', stop: '', target: '', alertHi: '', alertLo: '', memo: '' }, preset || {}) : Object.assign({}, watch.items[i]);
    const f = (k, l, t, ph) => `<label>${l}<input ${t === 'n' ? 'type="number" step="any" min="0"' : 'type="text"'} name="${k}" value="${esc(it[k] == null ? '' : it[k])}" placeholder="${ph || ''}"></label>`;
    const d = dialog(`<h3>${i == null ? '종목 추가' : esc(it.symbol) + ' 고치기'}</h3><form class="sc-form">
      ${f('symbol', '종목 코드', 't', '예: 005930 · 0190G0 · AAPL')}<p class="hint">한국은 6자리 코드(ETF 처럼 영문이 섞인 0190G0 도 그대로), 미국은 AAPL 처럼. 이름은 아래 칸에.</p>
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
    try { for (const it of watch.items) { try { await runTool('get_quote', { symbol: normSym(it.symbol) }); ok++; } catch (e) { fail.push(it.symbol); } } }
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
    LS.set(K_CALC, Object.fromEntries(calcIds.map(id => [id, $(id).value]))); SYNCQ.mark('calc');
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
      const ks = hasKey(a) ? (k ? `<span class="ks ok">${icon('check', 13)}이 기기에 있음</span> ${esc(mask(k))}` : `<span class="ks ok">${icon('lock', 13)}있음 · 잠김</span>`) : a.type === 'custom' ? '<span class="ks">필요 없음</span>' : remoteHas(a.id) ? '<span class="ks warn">다른 기기에 있음 · 받기 전</span>' : '<span class="ks bad">없음 — [고치기] 로 넣기</span>';
      return `<div class="sc-api${a.on === false ? ' off' : ''}"><div class="h"><span class="kind ${ai ? '' : 'data'}">${ai ? 'AI' : '시세'}</span><b title="${esc(a.name)}">${esc(a.name)}</b></div>
        <dl><dt>종류</dt><dd>${esc(T.name || a.type)}</dd><dt>키</dt><dd>${ks}</dd>${ai ? `<dt>모델</dt><dd>${esc(a.model || T.model || '–')}</dd>` : ''}${a.base ? `<dt>주소</dt><dd title="${esc(a.base)}">${esc(a.base)}</dd>` : ''}${!ai ? `<dt>제공</dt><dd>${(T.caps || []).map(c => ({ quote: '현재가', history: '일봉', news: '뉴스', custom: '원문', ksd: '종목 기본정보 · 상장 · 배당 · 의무보호예수' })[c]).join(' · ')}</dd>` : ''}</dl>
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
      ? `<div><b>키 잠금 켜짐</b> — 키를 암호로 감싸 두었습니다. ${(() => { const r = LS.get(K_REMEMBER, null), ok = remembered(); return ok ? `<b>이 기기에서 기억 중</b> (${Math.max(1, Math.ceil((r.exp - Date.now()) / 864e5))}일 남음) — 암호를 묻지 않습니다.` : keyMem ? '지금은 풀려 있습니다 (이 화면을 닫으면 다시 잠깁니다).' : '키가 필요할 때 암호를 한 번 묻습니다.'; })()}</div>${keyMem ? '' : '<button class="btn" id="lkOpen">풀기</button>'}${remembered() ? '<button class="btn ghost" id="lkForget">기억 지우기</button>' : ''}${remoteMissing() ? `<button class="btn" id="lkGet">${icon('key', 15)}다른 기기 키 받기</button>` : ''}<button class="btn ghost" id="lkOff">잠금 끄기</button>`
      : `<div><b>키 잠금 꺼짐</b> — 잠금 암호를 걸면 키를 AES-GCM 으로 감싸 저장합니다. 암호를 잊으면 키를 다시 등록해야 합니다.</div><button class="btn" id="lkOn">${icon('lock', 15)}잠금 암호 걸기</button>${remoteMissing() ? `<button class="btn" id="lkGet">${icon('key', 15)}다른 기기 키 받기</button>` : ''}`;
    fillIcons($('vApis'));
    const on = $('lkOn'), off = $('lkOff'), op = $('lkOpen');
    if (op) op.onclick = async () => { if (await unlock()) { toast('키 잠금을 풀었습니다', 1800); renderApis(); renderBanner(); } };
    const fg = $('lkForget'); if (fg) fg.onclick = () => { remember(false); keyMem = null; lockKey = null; toast('이 기기의 기억을 지웠습니다 — 다음에 키가 필요할 때 암호를 묻습니다', 3000); renderApis(); };
    const gt = $('lkGet'); if (gt) gt.onclick = async () => { adoptTried = false; sy.keysSeen = ''; await adoptRemoteKeys(); renderApis(); renderBanner(); };
    if (on) on.onclick = async () => { if (await lockFlow('잠금 암호 걸기', '4자 이상. 이 암호는 어디에도 저장하지 않습니다.')) { toast('키를 잠갔습니다', 2000); renderApis(); } };
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
        const T = TYPES[a.type]; const s = a.type === 'datagokr' || a.type === 'kisrelay' ? '005930' : 'AAPL';
        if (a.type === 'ksd') { const r = await DATA.ksd.call(k, 'getStkIsinByShortIsinN1', { shortIsin: '005930' }); if (!r.items.length) throw new Error('예탁결제원: 시험 종목(005930)을 찾지 못했습니다'); }
        else if (T.caps.includes('quote')) await DATA[a.type].quote(k, s, a); else await DATA.custom.custom(k, s, a);
      }
      a.test = 'ok'; toast(`${a.name}: 연결됐습니다`, 2000);
    } catch (e) {
      a.test = /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? '연결 실패 (네트워크 · 브라우저 차단)' : e.message.slice(0, 120);
      toast(`${a.name}: ${a.test}`, 4000);
    } finally { saveCfg(); if (btn) btn.disabled = false; renderApis(); }
  }
  function kisGuide() {
    const d = dialog(`<h3>KIS 중계 만드는 법 (한 번만, 약 5분)</h3>
      <p class="modal-desc">한국투자증권 API 는 웹페이지에서 직접 부르는 것을 막아 두어서, 내 계정의 작은 중계(Cloudflare Worker, 무료)를 거칩니다. 앱키 · 앱시크릿은 그 중계에만 들어가고, 중계는 <b>시세 조회만</b> 하며 주문 기능이 없습니다.</p>
      <ol class="sc-steps">
        <li><a href="https://dash.cloudflare.com/sign-up" target="_blank" rel="noopener">Cloudflare</a> 에 무료로 가입하고 로그인합니다.</li>
        <li>왼쪽 메뉴 <b>Workers &amp; Pages</b>(또는 Compute) → <b>Create</b> → <b>Hello World</b> 로 시작 → 이름을 <b>dpv-kis</b> 로 → <b>Deploy</b>.</li>
        <li><b>Edit code</b> → 원래 코드를 모두 지우고, 아래 <b>[중계 코드 복사]</b> 한 것을 붙여 넣기 → <b>Deploy</b>.</li>
        <li>그 Worker 의 <b>Settings → Variables and Secrets → Add</b> 에서 종류를 <b>Secret</b> 으로 세 개를 넣습니다.<br><code>KIS_APPKEY</code> = 앱키 · <code>KIS_APPSECRET</code> = 앱시크릿 · <code>RELAY_KEY</code> = [중계 암호 만들기] 로 만든 값<br><small>모의투자 앱키라면 <code>KIS_MOCK</code> = <code>1</code> 도 넣습니다.</small></li>
        <li>Worker 화면 위쪽의 주소(<code>https://dpv-kis.○○○.workers.dev</code>)를 복사해 이 창의 <b>주소</b> 칸에 넣고 [추가하고 시험].</li>
      </ol>
      <p class="hint">처음 시험할 때 KIS 가 접근 토큰 발급 알림(카카오톡)을 보낼 수 있습니다. 토큰은 하루 동안 다시 써서 알림이 자주 오지 않습니다.</p>
      <div class="actions"><a class="btn" href="https://dash.cloudflare.com/" target="_blank" rel="noopener">Cloudflare 열기</a><button class="btn ink" data-cp>${icon('copy', 16)}중계 코드 복사</button></div>`, 'sc-dlg');
    d.el.querySelector('[data-cp]').onclick = async ev => {
      const b = ev.currentTarget;
      try {
        const code = await fetch('app/secret/kis-relay.worker.js', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(); return r.text(); });
        await navigator.clipboard.writeText(code); b.textContent = '복사했습니다 — Cloudflare 편집기에 붙여 넣으세요';
      } catch (e) { window.open('app/secret/kis-relay.worker.js', '_blank'); toast('코드 파일을 열었습니다 — 모두 선택해 복사하세요', 3000); }
    };
  }
  function openAdd(type, edit) {
    const a = edit || { type: type || 'claude', name: '', model: '', base: '' };
    const opts = (kind, label) => `<optgroup label="${label}">${Object.entries(TYPES).filter(([, t]) => t.kind === kind).map(([id, t]) => `<option value="${id}"${a.type === id ? ' selected' : ''}>${t.name}</option>`).join('')}</optgroup>`;
    const d = dialog(`<h3>${edit ? 'API 고치기' : 'API 추가'}</h3><form class="sc-form" autocomplete="off">
      <label>종류<select name="type"${edit && isAI(edit) ? ' disabled' : ''}>${edit && !isAI(edit) ? '' : opts('ai', 'AI (대화)')}${opts('data', '시세 · 데이터')}</select></label>
      <p class="hint" id="tNote"></p>
      <div class="sc-kis" id="kisHelp" hidden><button type="button" class="btn sm" id="kisGuide">${icon('help', 14)}중계 만드는 법</button><button type="button" class="btn sm" id="kisGen">${icon('lock', 14)}중계 암호 만들기</button></div>
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
      const kis = f.type.value === 'kisrelay'; $('kisHelp').hidden = !kis;
      $('fBase').hidden = !(kis || f.type.value === 'compat' || f.type.value === 'custom' || (ai && f.type.value !== 'claude' && edit));
      f.base.placeholder = kis ? 'https://dpv-kis.○○○.workers.dev' : f.type.value === 'custom' ? 'https://…?symbol={symbol}&apikey={key}' : (T.base || 'https://…/v1');
      f.key.placeholder = kis ? '중계 암호 ([중계 암호 만들기] 로 만든 값)' : (edit ? '바꿀 때만 넣으세요' : '키를 붙여 넣으세요');
      if (!f.name.value || f.name.dataset.auto || Object.values(TYPES).some(x => x.name === f.name.value)) { f.name.value = T.name; f.name.dataset.auto = '1'; }
    };
    f.name.oninput = () => { delete f.name.dataset.auto; };
    $('kisGuide').onclick = () => kisGuide();
    $('kisGen').onclick = async () => { // 긴 무작위 암호 — 이 칸과 Cloudflare 의 RELAY_KEY 에 같은 값
      const v = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');
      f.key.type = 'text'; f.key.value = v;
      try { await navigator.clipboard.writeText(v); toast('중계 암호를 만들어 복사했습니다 — Cloudflare 의 RELAY_KEY 에 붙여 넣으세요', 4200); } catch (e) { f.key.select(); toast('중계 암호를 만들었습니다 — 칸의 값을 복사해 Cloudflare 의 RELAY_KEY 에 넣으세요', 4200); }
    };
    f.type.onchange = sync; sync(); setTimeout(() => (edit ? f.name : f.key).focus(), 30);
    d.el.querySelector('[data-x]').onclick = d.close;
    f.onsubmit = async e => {
      e.preventDefault();
      const t = f.type.value, T = TYPES[t], key = f.key.value.trim();
      if (!edit && !key && t !== 'custom') { toast('API 키를 넣어 주세요', 1800); return; }
      if ((t === 'compat' || t === 'custom' || t === 'kisrelay') && !f.base.value.trim()) { toast(t === 'kisrelay' ? '중계 주소를 넣어 주세요 ([중계 만드는 법] 5번)' : '주소를 넣어 주세요', 2200); return; }
      if (T.kind === 'ai' && t !== 'claude' && !f.model.value.trim()) { toast('모델 이름을 넣어 주세요', 1800); return; }
      const o = edit || { id: uid(), type: t, on: true };
      if (edit && !isAI(edit) && T.kind === 'data' && o.type !== t) { if (o.name === TYPES[o.type].name) o.name = ''; o.type = t; } // 종류 바꾸기 (키는 그대로)
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
  const saveMe = () => { LS.set(K_ME, me); SYNCQ.mark('me'); };
  let journal = LS.get(K_JOURNAL, []);
  const saveJournal = () => { LS.set(K_JOURNAL, journal); $('cJournal').textContent = journal.length || ''; SYNCQ.mark('journal'); };

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
    if (d.calc) SYNCQ.mark('calc'); SYNCQ.mark('watch');
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
    $('jTable').innerHTML = `<thead><tr><th>날짜</th><th class="sym">종목</th><th>진입가</th><th>수량</th><th>손절</th><th>목표</th><th>청산 · 현재가</th><th>결과</th><th>손익</th><th>그때 감정</th><th>체크</th><th>이유 · 교훈</th><th></th></tr></thead><tbody>${rows || '<tr><td class="empty" colspan="13">아직 기록이 없습니다. 살 때 [매매 기록] 으로 이유 · 손절가 · 감정을 적고, 팔 때 같은 줄을 열어 청산가와 교훈을 적으세요.</td></tr>'}</tbody>`;
    const bc = st.byChecklist, a = bc['체크리스트 모두 지킴'], b = bc['일부만 지킴'];
    $('jNote').textContent = (st.closedTrades < 5 ? `끝난 매매가 ${st.closedTrades}건입니다. 5건 이상 쌓이면 통계가 의미 있어지고, 20건 이상이면 계산기의 승률로 쓸 만합니다. ` : '') + (a && b ? `체크리스트를 다 지켰을 때 승률 ${a.winRatePct}% (${a.trades}건) · 일부만 지켰을 때 ${b.winRatePct}% (${b.trades}건). ` : '') + 'R = (청산가 − 진입가) ÷ (진입가 − 손절가). 1R 은 처음 정한 손실 한 번만큼입니다.';
    $('jTable').querySelectorAll('[data-jed]').forEach(b => b.onclick = () => editTrade(+b.dataset.jed));
    $('jTable').querySelectorAll('[data-jrm]').forEach(b => b.onclick = async () => { const t = journal[+b.dataset.jrm]; if (await confirmBox(`${t.symbol} 기록을 지울까요?`, '매매 일지에서 지웁니다.', '지우기')) { journal.splice(+b.dataset.jrm, 1); if (t.id) SYNCQ.tomb('journal', t.id); saveJournal(); renderJournal(); } });
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
      o.updated = Date.now(); if (i == null) journal.push(o); else journal[i] = o; saveJournal(); d.close(); renderJournal();
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
     노트 — 날짜별 메모 · 기업 탭 · 달력
     ===================================================================== */
  const K_NOTES = 'sec:notes';
  let notes = LS.get(K_NOTES, []);
  const saveNotes = () => { LS.set(K_NOTES, notes); $('cNotes').textContent = notes.length || ''; SYNCQ.mark('notes'); };
  const ymdLocal = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const nui = { co: '', month: null, day: ymdLocal(new Date()) };
  /* 사전 + 관심 종목 · 매매 일지 · 노트에서 이미 쓴 이름 */
  const coExtra = () => [...watch.items.flatMap(it => [it.name, it.symbol]), ...journal.map(t => t.symbol), ...notes.flatMap(n => n.companies || [])].filter(Boolean);
  function coCounts() { const m = new Map(); for (const n of notes) for (const c of n.companies || []) m.set(c, (m.get(c) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); }
  const linkify = s => esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  function renderNotes() {
    $('cNotes').textContent = notes.length || '';
    if (!nui.month) { const d = new Date(nui.day); nui.month = new Date(d.getFullYear(), d.getMonth(), 1); }
    const counts = coCounts(); if (nui.co && !counts.some(([c]) => c === nui.co)) nui.co = '';
    $('nTabs').innerHTML = `<button type="button" role="tab" data-co="" class="${nui.co ? '' : 'on'}" aria-selected="${!nui.co}">전체 <em>${notes.length}</em></button>` + counts.map(([c, n]) => `<button type="button" role="tab" data-co="${esc(c)}" class="${nui.co === c ? 'on' : ''}" aria-selected="${nui.co === c}">${esc(c)} <em>${n}</em></button>`).join('');
    $('nTabs').querySelectorAll('[data-co]').forEach(b => b.onclick = () => { nui.co = b.dataset.co; const ds = notes.filter(n => (n.companies || []).includes(nui.co)).map(n => n.date).sort(); if (nui.co && ds.length) { nui.day = ds[ds.length - 1]; const d = new Date(nui.day); nui.month = new Date(d.getFullYear(), d.getMonth(), 1); } renderNotes(); });
    /* 고른 기업의 노트 날짜 (다른 달로 바로 가기) */
    if (nui.co) {
      const ds = [...new Set(notes.filter(n => (n.companies || []).includes(nui.co)).map(n => n.date))].sort().reverse();
      $('nDates').innerHTML = `<span>${esc(nui.co)} 노트한 날</span>` + ds.map(d => `<button type="button" data-go="${d}" class="${d === nui.day ? 'on' : ''}">${d.slice(2).replace(/-/g, '.')}</button>`).join('');
      $('nDates').querySelectorAll('[data-go]').forEach(b => b.onclick = () => { nui.day = b.dataset.go; const d = new Date(nui.day); nui.month = new Date(d.getFullYear(), d.getMonth(), 1); renderNotes(); });
    } else $('nDates').innerHTML = '';
    /* 달력 */
    const m = nui.month, first = new Date(m.getFullYear(), m.getMonth(), 1), start = new Date(first); start.setDate(1 - first.getDay());
    $('nMonth').textContent = `${m.getFullYear()}년 ${m.getMonth() + 1}월`;
    const byDay = {}; for (const n of notes) (byDay[n.date] = byDay[n.date] || []).push(n);
    const today = ymdLocal(new Date());
    let html = ['일', '월', '화', '수', '목', '금', '토'].map((w, i) => `<div class="wd${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}">${w}</div>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i); const k = ymdLocal(d), list = byDay[k] || [];
      if (i >= 35 && d.getMonth() !== m.getMonth()) break;
      const hit = nui.co && list.some(n => (n.companies || []).includes(nui.co));
      const shown = nui.co && hit ? list.filter(n => (n.companies || []).includes(nui.co)) : list;
      const label = n => (n.companies && n.companies.length ? n.companies.slice(0, 2).join(' · ') + ' — ' : '') + String(n.text || '').split('\n')[0];
      html += `<button type="button" class="sc-d${d.getMonth() !== m.getMonth() ? ' out' : ''}${k === today ? ' today' : ''}${k === nui.day ? ' sel' : ''}${list.length ? ' has' : ''}${hit ? ' hit' : ''}" data-day="${k}" aria-label="${k} 노트 ${list.length}개"><span class="dn">${d.getDate()}</span><span class="lines">${shown.slice(0, 2).map(n => `<span>${esc(label(n))}</span>`).join('')}</span>${shown.length > 2 ? `<span class="more">+${shown.length - 2}</span>` : ''}</button>`;
    }
    $('nGrid').innerHTML = html; $('nGrid').closest('.sc-cal').classList.toggle('filter', !!nui.co);
    $('nGrid').querySelectorAll('[data-day]').forEach(b => { b.onclick = () => { nui.day = b.dataset.day; renderNotes(); }; b.ondblclick = () => editNote(null, b.dataset.day); });
    /* 고른 날의 노트 */
    const list = (byDay[nui.day] || []).slice().sort((a, b) => (a.created || 0) - (b.created || 0));
    const dd = new Date(nui.day + 'T00:00'); const wd = ['일', '월', '화', '수', '목', '금', '토'][dd.getDay()];
    $('nDay').innerHTML = `<h2>${dd.getMonth() + 1}월 ${dd.getDate()}일 (${wd})</h2><p class="sub">${list.length ? `노트 ${list.length}개${nui.co ? ` · ${esc(nui.co)} 관련 ${list.filter(n => (n.companies || []).includes(nui.co)).length}개` : ''}` : '이 날 노트가 없습니다. 달력의 날짜를 두 번 누르거나 아래 단추로 적으세요.'}</p>
      ${list.map(n => { const rel = !nui.co || (n.companies || []).includes(nui.co); return `<div class="sc-nitem${rel ? '' : ' dim'}"><div class="cos">${(n.companies || []).map(c => `<button type="button" class="sc-co" data-pick="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="txt">${linkify(n.text)}</div><div class="ft"><span>${n.updated ? new Date(n.updated).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span><span class="grow"></span><button class="sc-x" data-ned="${n.id}" title="고치기" aria-label="고치기">${icon('edit', 14)}</button><button class="sc-x" data-nrm="${n.id}" title="지우기" aria-label="지우기">${icon('trash', 14)}</button></div></div>`; }).join('')}
      <button class="btn" id="nAddDay" style="margin-top:4px">${icon('plus', 15)}이 날에 노트 추가</button>`;
    $('nAddDay').onclick = () => editNote(null, nui.day);
    $('nDay').querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { nui.co = b.dataset.pick; renderNotes(); });
    $('nDay').querySelectorAll('[data-ned]').forEach(b => b.onclick = () => editNote(b.dataset.ned));
    $('nDay').querySelectorAll('[data-nrm]').forEach(b => b.onclick = async () => { if (!(await confirmBox('노트를 지울까요?', '지우면 되돌릴 수 없습니다.', '지우기'))) return; notes = notes.filter(n => n.id !== b.dataset.nrm); SYNCQ.tomb('notes', b.dataset.nrm); saveNotes(); renderNotes(); });
  }
  function editNote(id, day, preset) {
    const n = id ? notes.find(x => x.id === id) : { date: day || nui.day || ymdLocal(new Date()), text: preset || '', companies: [] };
    let cos = (n.companies || []).slice(), removed = new Set();
    const d = dialog(`<h3>${id ? '노트 고치기' : '노트 추가'}</h3><form class="sc-form">
      <label>날짜<input type="date" name="date" value="${esc(n.date)}" required></label>
      <label>내용<textarea name="text" rows="7" placeholder="예) 삼성전자 HBM 납품 기사 — 다음 주 실적 발표 전에 비중 점검. 링크도 붙여 넣을 수 있습니다.">${esc(n.text)}</textarea></label>
      <div><div class="hint" style="margin:0 0 4px">기업 (글에서 저절로 찾음 · 누르면 뺌)</div><div class="sc-cochips" id="neCos"></div></div>
      <div class="sc-add-row" style="margin-top:0"><input type="text" id="neCoNew" placeholder="기업 직접 더하기 (Enter)"><button type="button" class="btn" id="neCoAdd">${icon('plus', 15)}더하기</button></div>
      <div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">저장</button></div></form>`, 'sc-dlg wide');
    const f = d.el.querySelector('form');
    /* 직접 더한 기업(글에 없는 것)은 그대로 두고, 나머지는 글에서 다시 찾음 */
    const manual = new Set((n.companies || []).filter(c => !secFindCompanies(n.text, coExtra()).includes(c)));
    const detect = () => { const auto = secFindCompanies(f.text.value, coExtra()); cos = [...new Set([...auto, ...manual])].filter(c => !removed.has(c)); draw(); };
    const draw = () => { const box = d.el.querySelector('#neCos'); box.innerHTML = cos.length ? cos.map(c => `<button type="button" class="sc-co" data-rm="${esc(c)}" title="빼기">${esc(c)}${icon('x', 11)}</button>`).join('') : '<span class="none">아직 없습니다 — 내용에 기업 이름을 쓰면 여기에 생깁니다</span>'; box.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { removed.add(b.dataset.rm); manual.delete(b.dataset.rm); cos = cos.filter(c => c !== b.dataset.rm); draw(); }); };
    const addCo = () => { const v = d.el.querySelector('#neCoNew').value.trim(); if (!v) return; removed.delete(v); manual.add(v); if (!cos.includes(v)) cos.push(v); d.el.querySelector('#neCoNew').value = ''; draw(); };
    d.el.querySelector('#neCoAdd').onclick = addCo; d.el.querySelector('#neCoNew').onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addCo(); } };
    f.text.addEventListener('input', detect); detect(); setTimeout(() => f.text.focus(), 30);
    d.el.querySelector('[data-x]').onclick = d.close;
    f.onsubmit = e => {
      e.preventDefault(); const text = f.text.value.trim(); if (!text) { toast('내용을 적어 주세요', 1800); return; }
      const o = id ? n : { id: uid(), created: Date.now() };
      o.date = f.date.value || ymdLocal(new Date()); o.text = text; o.companies = cos.slice(); o.updated = Date.now();
      if (!id) notes.push(o); saveNotes(); d.close(); nui.day = o.date; const dd = new Date(o.date + 'T00:00'); nui.month = new Date(dd.getFullYear(), dd.getMonth(), 1);
      if (!$('vNotes').hidden) renderNotes(); else toast(`노트에 남겼습니다${o.companies.length ? ' (' + o.companies.join(', ') + ')' : ''}`, 2400);
    };
  }
  $('nAdd').onclick = () => editNote(null, nui.day);
  $('nPrev').onclick = () => { nui.month = new Date(nui.month.getFullYear(), nui.month.getMonth() - 1, 1); renderNotes(); };
  $('nNext').onclick = () => { nui.month = new Date(nui.month.getFullYear(), nui.month.getMonth() + 1, 1); renderNotes(); };
  $('nToday').onclick = () => { nui.day = ymdLocal(new Date()); nui.month = null; renderNotes(); };

  /* =====================================================================
     모닝 브리핑 — GitHub Actions 가 매일 아침 briefing 브랜치에 저장한 큰 이슈 15개 (AI 토큰 안 씀)
     ===================================================================== */
  const briefRepo = () => { let c = null; try { c = typeof GH !== 'undefined' && GH.load ? GH.load() : null; } catch (e) { } return `${(c && c.owner) || 'kwonyujin119'}/${(c && c.repo) || 'test0'}`; };
  const briefUrl = f => `https://raw.githubusercontent.com/${briefRepo()}/briefing/${f}?v=${Math.floor(Date.now() / 300000)}`;
  const bui = { dates: null, date: '', cache: {} };
  async function getBrief(f) {
    if (bui.cache[f]) return bui.cache[f];
    const r = await fetch(briefUrl(f), { cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('브리핑을 불러오지 못했습니다 (' + r.status + ')');
    const j = await r.json(); bui.cache[f] = j; return j;
  }
  async function renderBrief(force) {
    const box = $('bList');
    if (force) { bui.cache = {}; bui.dates = null; }
    box.innerHTML = '<div class="sc-bmsg">불러오는 중…</div>';
    const actions = `https://github.com/${briefRepo()}/actions/workflows/morning-briefing.yml`;
    let idx;
    try { idx = await getBrief('index.json'); } catch (e) { box.innerHTML = `<div class="sc-bmsg">${esc(e.message)}. 인터넷 연결을 확인하고 [다시 불러오기] 를 눌러 주세요.</div>`; return; }
    if (!idx || !(idx.dates || []).length) {
      box.innerHTML = `<div class="sc-bmsg"><b>아직 브리핑이 없습니다.</b><br>매일 아침 6시 30분쯤 GitHub 이 뉴스를 모아 7시 전에 여기에 올립니다. 지금 바로 받으려면 <a href="${actions}" target="_blank" rel="noopener">GitHub Actions 의 Morning briefing</a> 에서 [Run workflow] 를 누르고, 1~2분 뒤 [다시 불러오기] 를 누르세요.</div>`;
      $('bDate').innerHTML = ''; return;
    }
    bui.dates = idx.dates; if (!bui.date || !bui.dates.includes(bui.date)) bui.date = bui.dates[0];
    $('bDate').innerHTML = bui.dates.map(d => { const x = new Date(d + 'T00:00'); return `<option value="${d}"${d === bui.date ? ' selected' : ''}>${x.getMonth() + 1}월 ${x.getDate()}일 (${'일월화수목금토'[x.getDay()]})${d === ymdLocal(new Date()) ? ' · 오늘' : ''}</option>`; }).join('');
    const i = bui.dates.indexOf(bui.date); $('bPrev').disabled = i >= bui.dates.length - 1; $('bNext').disabled = i <= 0;
    let d; try { d = await getBrief(bui.date + '.json'); } catch (e) { box.innerHTML = `<div class="sc-bmsg">${esc(e.message)}</div>`; return; }
    if (!d) { box.innerHTML = '<div class="sc-bmsg">이 날의 브리핑 파일이 없습니다.</div>'; return; }
    const t = d.generatedAt ? new Date(d.generatedAt) : null;
    $('bLead').innerHTML = `${t ? `${t.getMonth() + 1}월 ${t.getDate()}일 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')} 에 만듦 · ` : ''}뉴스 피드 ${d.feedsOk}/${d.feeds}곳 · 기사 ${num(d.articles, 0)}건 → 이슈 ${num(d.issues, 0)}개 중 <b>여러 언론이 함께 다룬 주식 관련 큰 이슈 ${d.items.length}개</b>. AI 토큰은 쓰지 않습니다. 매일 아침 7시 전에 새로 만들어집니다.`;
    if (bui.mode === 'feeds') { box.innerHTML = renderFeeds(d); $('bLead').innerHTML += ` · 피드별 중요도 순 5개씩 <b>${d.feedItems || 0}개</b>`; return; }
    const extra = coExtra();
    box.innerHTML = `<div class="sc-brief">${d.items.map(it => {
      const cos = secFindCompanies(it.title, extra), tm = it.time ? it.time.slice(11, 16) : '';
      return `<article class="sc-bi"><span class="rk">${it.rank}</span>
        <a class="tt" href="${esc(it.link)}" target="_blank" rel="noopener">${esc(it.title)}</a>
        <div class="mt"><span class="sc-tag">${esc(it.category)}</span><span>${esc(it.source)}${tm ? ' · ' + tm : ''}</span><span>${it.sources > 1 ? `${it.sources}개 언론` : '단독 보도'}</span>${cos.map(c => `<button type="button" class="sc-co" data-bco="${esc(c)}" title="${esc(c)} 노트 보기">${esc(c)}</button>`).join('')}</div>
        <div>${(it.related || []).length ? `<details><summary class="sc-fine" style="text-align:left;margin:0;cursor:pointer">같은 이슈 다른 기사 ${it.related.length}건</summary><ul class="rel">${it.related.map(r => `<li><a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.title)}</a> · ${esc(r.source)}</li>`).join('')}</ul></details>` : ''}
          <div class="acts"><button class="btn sm" data-bnote="${it.rank}">${icon('edit', 14)}노트에 남기기</button><button class="btn sm ghost" data-bask="${it.rank}">${icon('sparkle', 14)}AI 에게 영향 묻기</button></div></div></article>`;
    }).join('')}</div><p class="sc-fine" style="text-align:left;margin-top:12px">제목을 누르면 원문이 열립니다. [AI 에게 영향 묻기] 를 누를 때만 등록한 AI 토큰을 씁니다.</p>`;
    const byRank = r => d.items.find(x => x.rank === +r);
    box.querySelectorAll('[data-bnote]').forEach(b => b.onclick = () => { const it = byRank(b.dataset.bnote); editNote(null, ymdLocal(new Date()), `${it.title}\n${it.link}\n`); });
    box.querySelectorAll('[data-bask]').forEach(b => b.onclick = () => { const it = byRank(b.dataset.bask); show('chat'); send(`오늘 모닝 브리핑의 이 뉴스가 시장과 내 종목(get_portfolio)에 주는 영향을 짧게 정리해 줘. 필요하면 웹 검색으로 원문 내용을 확인해 줘.\n"${it.title}" (${it.source})\n${it.link}`); });
    box.querySelectorAll('[data-bco]').forEach(b => b.onclick = () => { nui.co = b.dataset.bco; show('notes'); });
  }
  $('bReload').onclick = () => renderBrief(true);
  $('bDate').onchange = e => { bui.date = e.target.value; renderBrief(); };
  $('bPrev').onclick = () => { const i = bui.dates.indexOf(bui.date); if (i < bui.dates.length - 1) { bui.date = bui.dates[i + 1]; renderBrief(); } };
  $('bNext').onclick = () => { const i = bui.dates.indexOf(bui.date); if (i > 0) { bui.date = bui.dates[i - 1]; renderBrief(); } };

  /* =====================================================================
     기기 사이 동기화 — 비공개 GitHub 저장소(영상과 같은 test0-video)의 secret/ 폴더
     · state.json: 나의 원칙 · 노트 · 매매 일지 · 관심 종목 · 계산기 · API 목록(키 빼고) · 잠근 키 묶음(암호화된 것만) · 대화 목록
     · chats/<id>.json: 대화 하나씩 (개수 제한 없음)
     · 합치는 법: 노트 · 일지 · 대화는 하나씩 더 최근 것이 이김(지운 것은 '지움 표시'로 전달), 나머지는 고친 시각이 늦은 쪽이 이김
     · API 키는 잠금 암호를 건 경우에만 암호화된 채로 옮겨지고, 다른 기기에서 같은 암호로 풉니다
     ===================================================================== */
  const K_SYNC = 'sec:sync';
  const sy = Object.assign({ on: false, shaState: '', shaChat: {}, tomb: { notes: {}, journal: {}, chats: {} }, rev: {}, hash: {}, pushed: '', at: 0, err: '' }, LS.get(K_SYNC, {}));
  sy.tomb = Object.assign({ notes: {}, journal: {}, chats: {} }, sy.tomb);
  const saveSy = () => LS.set(K_SYNC, sy);
  const SY = { busy: false, state: sy.on ? 'idle' : 'off', msg: '', timer: 0, again: false };
  const deviceName = () => /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ? '휴대폰' : 'PC';
  const hashOf = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); };
  const sect = {
    me: () => me, notes: () => notes, journal: () => journal, watch: () => ({ items: watch.items }), calc: () => LS.get(K_CALC, {}),
    cfg: () => ({ apis: cfg.apis.map(a => ({ id: a.id, type: a.type, name: a.name, model: a.model || '', base: a.base || '', on: a.on !== false })), ai: cfg.ai, web: cfg.web, auto: cfg.auto || 0, lock: cfg.lock ? { salt: cfg.lock.salt, iv: cfg.lock.iv, data: cfg.lock.data, ids: cfg.lock.ids || undefined } : null }), // ids: 어느 API 에 키가 있는지만 (키 값 아님)
  };
  /* 고칠 때마다 부름: 내용이 실제로 바뀌었으면 그 칸의 고친 시각을 기록하고 잠시 뒤 올림 */
  SYNCQ.mark = k => {
    if (sect[k]) { const h = hashOf(JSON.stringify(sect[k]())); if (sy.hash[k] === h) return; sy.hash[k] = h; sy.rev[k] = Date.now(); saveSy(); }
    if (sy.on) { clearTimeout(SY.timer); SY.timer = setTimeout(() => syncNow(), 3000); }
  };
  SYNCQ.tomb = (k, id) => { sy.tomb[k][id] = Date.now(); saveSy(); SYNCQ.mark(k === 'chats' ? 'chats' : k); };
  /* 아직 한 번도 고친 시각이 없는 칸: 내용이 있으면 1(오래된 것), 비어 있으면 0 — 처음 맞출 때 먼저 올라간 쪽을 따르게 */
  const emptySect = { me: () => hashOf(JSON.stringify(me)) === hashOf(JSON.stringify(ME0)), watch: () => !watch.items.length, calc: () => !Object.keys(LS.get(K_CALC, {})).length, cfg: () => !cfg.apis.length, notes: () => !notes.length, journal: () => !journal.length };
  for (const k in sect) { if (!sy.hash[k]) sy.hash[k] = hashOf(JSON.stringify(sect[k]())); if (sy.rev[k] == null) sy.rev[k] = emptySect[k]() ? 0 : 1; }
  saveSy();

  function ghCfg() {
    const v = LS.get('ve:sync', {}); let g = null; try { g = GH.cfg || GH.load(); } catch (e) { }
    return { owner: v.owner || (g && g.owner) || 'kwonyujin119', repo: v.repo || 'test0-video', token: v.token || (g && g.token) || '', from: v.token ? 'video' : (g && g.token) ? 'shared' : '' };
  }
  async function gh(method, path, body) {
    const c = ghCfg();
    if (!c.token) { const e = new Error('이 기기에 GitHub 토큰이 없습니다. 아래 칸에 토큰을 한 번 넣어 주세요.'); e.noToken = true; throw e; }
    let r;
    try { r = await fetch(`https://api.github.com/repos/${E(c.owner)}/${E(c.repo)}${path}`, { method, cache: 'no-store', headers: Object.assign({ Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: 'Bearer ' + c.token }, body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { const er = new Error('인터넷에 연결되어 있지 않아 지금은 맞추지 못했습니다. 연결되면 다시 맞춥니다.'); er.offline = true; throw er; }
    if (r.status === 404 && method === 'GET') return null;
    if (!r.ok) {
      let m = r.status + ' ' + r.statusText; try { const j = await r.json(); if (j.message) m = j.message; } catch (e) { }
      if (r.status === 401) m = 'GitHub 토큰이 올바르지 않거나 만료되었습니다. 아래 칸에 새 토큰을 넣어 주세요.';
      else if (r.status === 403 && /rate limit/i.test(m)) m = 'GitHub 요청 한도를 넘었습니다. 잠시 뒤에 다시 맞춥니다.';
      else if (r.status === 403) m = `이 토큰에는 ${c.repo} 저장소에 쓸 권한이 없습니다. Contents: Read and write 권한이 있는 토큰을 넣어 주세요.`;
      const e = new Error(m); e.status = r.status; throw e;
    }
    return r.status === 204 ? null : r.json();
  }
  const b64e = s => { const u = enc.encode(s); let o = ''; for (let i = 0; i < u.length; i += 0x8000) o += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(o); };
  const b64d = s => dec.decode(Uint8Array.from(atob(String(s).replace(/\s/g, '')), c => c.charCodeAt(0)));
  async function getFile(path) {
    const j = await gh('GET', '/contents/' + path); if (!j) return null;
    let text = j.content && j.encoding === 'base64' ? b64d(j.content) : null;
    if (text == null) { const b = await gh('GET', '/git/blobs/' + j.sha); text = b64d(b.content); } // 1MB 가 넘는 파일
    return { sha: j.sha, data: JSON.parse(text) };
  }
  async function putFile(path, data, sha, msg) {
    const body = { message: msg, content: b64e(JSON.stringify(data)) }; if (sha) body.sha = sha;
    try { return (await gh('PUT', '/contents/' + path, body)).content.sha; }
    catch (e) { if (e.status === 409 || e.status === 422) { const cur = await gh('GET', '/contents/' + path); body.sha = cur ? cur.sha : undefined; if (!body.sha) delete body.sha; return (await gh('PUT', '/contents/' + path, body)).content.sha; } throw e; }
  }
  const chatPath = id => `secret/chats/${String(id).replace(/[^\w-]/g, '')}.json`;
  const plainChat = c => { const o = Object.assign({}, c); delete o.live; return o; };

  function setSy(state, msg) { SY.state = state; SY.msg = msg || ''; sy.err = state === 'bad' ? SY.msg : ''; paintSync(); renderBanner(); }
  function paintSync() {
    const em = $('cSync'); if (!em) return;
    em.className = SY.state === 'ok' ? 'ok' : SY.state === 'bad' ? 'bad' : '';
    em.textContent = !sy.on ? '꺼짐' : SY.state === 'busy' ? '맞추는 중' : SY.state === 'bad' ? '확인 필요' : sy.at ? '켜짐' : '';
    if (!$('vApis').hidden) renderSyncBox();
  }

  /* 받은 것 합치기 */
  async function mergeRemote(r) {
    let changed = false;
    for (const k of ['notes', 'journal', 'chats']) for (const [id, t] of Object.entries((r.tomb || {})[k] || {})) if ((sy.tomb[k][id] || 0) < t) { sy.tomb[k][id] = t; changed = true; }
    const byId = (loc, rem, ts, kind) => {
      const m = new Map(loc.map(x => [x.id, x]));
      for (const x of rem || []) { const l = m.get(x.id); if (!l || (ts(x) || 0) > (ts(l) || 0)) { m.set(x.id, x); changed = true; } }
      return [...m.values()].filter(x => { const dead = (sy.tomb[kind][x.id] || 0) >= (ts(x) || 0) && sy.tomb[kind][x.id]; if (dead) changed = true; return !dead; });
    };
    notes = byId(notes, r.notes, x => x.updated || x.created, 'notes'); LS.set(K_NOTES, notes);
    journal = byId(journal, r.journal, x => x.updated || 0, 'journal'); LS.set(K_JOURNAL, journal);
    const rr = r.rev || {};
    const take = k => { const a = rr[k] || 0, b = sy.rev[k] || 0; return a > b || (a === b && a === 1); }; // 둘 다 처음이면 먼저 올라간 쪽
    if (take('me') && r.me) { Object.keys(me).forEach(k => delete me[k]); Object.assign(me, JSON.parse(JSON.stringify(ME0)), r.me); me.profile = Object.assign({}, ME0.profile, me.profile); me.answer = Object.assign({}, ME0.answer, me.answer); LS.set(K_ME, me); sy.rev.me = Math.max(rr.me || 0, 2); changed = true; }
    if (take('watch') && r.watch) { watch.items = r.watch.items || []; LS.set(K_WATCH, watch); sy.rev.watch = Math.max(rr.watch || 0, 2); changed = true; }
    if (take('calc') && r.calc) { LS.set(K_CALC, r.calc); calcIds.forEach(id => { if (r.calc[id] != null) $(id).value = r.calc[id]; }); sy.rev.calc = Math.max(rr.calc || 0, 2); changed = true; }
    if (take('cfg') && r.cfg) {
      const keep = new Map(cfg.apis.map(a => [a.id, a]));
      cfg.apis = (r.cfg.apis || []).map(a => Object.assign({}, a, { key: (keep.get(a.id) || {}).key || '', test: (keep.get(a.id) || {}).test || '' }));
      cfg.ai = r.cfg.ai; cfg.web = r.cfg.web; cfg.auto = r.cfg.auto || 0; sy.rev.cfg = Math.max(rr.cfg || 0, 2); changed = true;
    }
    cfg.lockRemote = r.cfg && r.cfg.lock && r.cfg.lock.data ? r.cfg.lock : null;
    LS.set(K_CFG, cfg);
    for (const c of chats.slice()) if ((sy.tomb.chats[c.id] || 0) >= (c.updated || 0) && sy.tomb.chats[c.id]) { chats = chats.filter(x => x !== c); IDB.del(c.id); if (cur === c) cur = null; changed = true; }
    for (const k in sect) sy.hash[k] = hashOf(JSON.stringify(sect[k]()));
    return changed;
  }
  /* 대화: 다른 기기에서 더 최근에 고친 것만, 6개씩 나눠 받음 (받는 대로 목록에 보임) */
  async function pullChats(r) {
    const need = (r.chats || []).filter(rc => !((sy.tomb.chats[rc.id] || 0) >= rc.updated) && !((chats.find(c => c.id === rc.id) || {}).updated >= rc.updated));
    let done = 0;
    for (let i = 0; i < need.length; i += 6) {
      setSy('busy', `다른 기기의 대화 받는 중 ${done}/${need.length}`);
      await Promise.all(need.slice(i, i + 6).map(async rc => {
        const f = await getFile(chatPath(rc.id)); done++; if (!f) return;
        sy.shaChat[rc.id] = f.sha; const c = f.data, l = chats.find(x => x.id === c.id);
        if (l) { if (l === cur && busy) return; Object.assign(l, c); } else chats.push(c);
        savedAt[c.id] = c.updated; IDB.put(plainChat(c));
      }));
      chats.sort((a, b) => (b.updated || 0) - (a.updated || 0)); renderChatList(); if (!$('vHistory').hidden) renderHistory();
    }
    return need.length > 0;
  }
  function localState() {
    const s = {}; for (const k in sect) s[k] = sect[k]();
    return Object.assign(s, { v: 1, at: Date.now(), device: deviceName(), rev: sy.rev, tomb: sy.tomb, chats: chats.map(c => ({ id: c.id, title: c.title, updated: c.updated })) });
  }
  async function syncNow(opts) {
    opts = opts || {};
    if (!sy.on) return; if (SY.busy) { SY.again = true; return; }
    if (busy && !opts.force) { clearTimeout(SY.timer); SY.timer = setTimeout(() => syncNow(), 4000); return; } // 답을 받는 중에는 미룸
    SY.busy = true; setSy('busy', '다른 기기와 맞추는 중…');
    try {
      const rem = await getFile('secret/state.json');
      let changed = false;
      if (rem && rem.sha !== sy.shaState) { changed = await mergeRemote(rem.data); if (changed) refreshAfterSync(); if (await pullChats(rem.data)) { changed = true; if (cur) renderMsgs(); } }
      const rIdx = new Map(((rem && rem.data.chats) || []).map(c => [c.id, c.updated]));
      const up = chats.filter(c => !(c === cur && busy) && (!rIdx.has(c.id) || (c.updated || 0) > rIdx.get(c.id)));
      for (let i = 0; i < up.length; i++) { // 같은 가지에 한꺼번에 올리면 서로 부딪치므로 하나씩
        if (up.length > 3) setSy('busy', `대화 올리는 중 ${i}/${up.length}`);
        sy.shaChat[up[i].id] = await putFile(chatPath(up[i].id), plainChat(up[i]), sy.shaChat[up[i].id], `SECRET 대화 저장 (${deviceName()})`);
      }
      for (const id of Object.keys(sy.tomb.chats)) if (rIdx.has(id) && !chats.some(c => c.id === id)) { try { const f = await gh('GET', '/contents/' + chatPath(id)); if (f) await gh('DELETE', '/contents/' + chatPath(id), { message: 'SECRET 대화 지움', sha: f.sha }); } catch (e) { } delete sy.shaChat[id]; }
      const st = localState(), core = hashOf(JSON.stringify(Object.assign({}, st, { at: 0, device: '' })));
      if (!rem || core !== sy.pushed || (rem && rem.sha !== sy.shaState)) {
        sy.shaState = await putFile('secret/state.json', st, rem ? rem.sha : undefined, `SECRET 저장 (${deviceName()})`);
        sy.pushed = core;
      } else sy.shaState = rem.sha;
      sy.at = Date.now(); saveSy(); setSy('ok', '');
      if (changed) { chats.sort((a, b) => (b.updated || 0) - (a.updated || 0)); renderChatList(); }
    } catch (e) {
      setSy(e.offline ? 'idle' : 'bad', e.message); saveSy();
    } finally {
      SY.busy = false; if (SY.again) { SY.again = false; setTimeout(() => syncNow(), 500); }
    }
  }
  function refreshAfterSync() {
    $('cWatch').textContent = watch.items.length || ''; $('cJournal').textContent = journal.length || ''; $('cNotes').textContent = notes.length || ''; $('cApi').textContent = cfg.apis.length || '';
    chats.sort((a, b) => (b.updated || 0) - (a.updated || 0)); renderChatList();
    const a = document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('.sc-main') && a.id !== 'q') return; // 쓰는 중이면 화면을 다시 그리지 않음
    const v = Object.keys(VIEWS).find(k => !$(VIEWS[k]).hidden); if (v) show(v);
  }
  async function enableSync() {
    const c = ghCfg();
    setSy('busy', '저장소를 확인하는 중…');
    try {
      const r = await fetch(`https://api.github.com/repos/${E(c.owner)}/${E(c.repo)}`, { headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + c.token }, cache: 'no-store' });
      if (r.status === 404) throw new Error(`${c.owner}/${c.repo} 저장소를 찾지 못했습니다. 영상(VIDEO)의 [다른 기기와 연결] 에서 만든 비공개 저장소가 있어야 합니다.`);
      if (r.status === 401) throw new Error('GitHub 토큰이 올바르지 않거나 만료되었습니다.');
      const j = await r.json();
      if (!j.private) throw new Error(`${c.repo} 가 공개 저장소입니다. SECRET 자료는 비공개 저장소에만 둡니다.`);
      if (!(j.permissions && j.permissions.push)) throw new Error(`이 토큰에는 ${c.repo} 에 쓸 권한이 없습니다.`);
      sy.on = true; saveSy(); await syncNow({ force: true }); toast('이제 모든 기기에서 SECRET 이 같게 보입니다', 2600);
    } catch (e) { sy.on = false; saveSy(); setSy('bad', e.message); }
  }
  function renderSyncBox() {
    const c = ghCfg(), box = $('syncBox'); if (!box) return;
    const when = sy.at ? new Date(sy.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    box.innerHTML = `<span class="ico-wrap">${icon('cloud', 20)}</span><div class="tx"><b>모든 기기에서 같게 보기</b> — 대화 기록 · 노트 · 매매 일지 · 나의 원칙 · 관심 종목을 비공개 GitHub 저장소 <b>${esc(c.owner)}/${esc(c.repo)}</b> 의 secret 폴더에 두고, 휴대폰 · PC 어디서 열어도 같게 맞춥니다. API 키는 잠금 암호를 건 경우에만 암호화된 채로 옮겨집니다.
      <div class="st ${SY.state === 'ok' ? 'ok' : SY.state === 'bad' ? 'bad' : ''}">${!sy.on ? '꺼져 있음 — 이 기기에만 저장 중' : SY.state === 'busy' ? '맞추는 중…' : SY.state === 'bad' ? esc(SY.msg || sy.err) : `켜짐 · 마지막으로 맞춘 때 ${esc(when)}`}</div>
      ${!c.token ? `<div class="tok"><input type="password" id="syTok" placeholder="GitHub 토큰 (${esc(c.repo)} 저장소 Contents 읽기 · 쓰기)" autocomplete="off"><button class="btn" id="syTokOk">넣기</button></div><p class="sc-fine" style="text-align:left;margin:4px 0 0">영상(VIDEO) 동기화에 쓰는 것과 같은 토큰입니다. 이 기기에 한 번만 넣으면 됩니다.</p>` : ''}</div>
      <div class="acts">${sy.on ? `<button class="btn" id="syNow">${icon('refresh', 15)}지금 맞추기</button><button class="btn ghost" id="syOff">끄기</button>` : `<button class="btn ink" id="syOn">${icon('cloud', 15)}이 기기 연결</button>`}</div>`;
    const on = $('syOn'), off = $('syOff'), now = $('syNow'), tk = $('syTokOk');
    if (on) on.onclick = () => connectDevice();
    if (now) now.onclick = () => syncNow({ force: true });
    if (off) off.onclick = async () => { if (await confirmBox('동기화를 끌까요?', '이 기기의 자료는 그대로 남고, 다른 기기와 더 이상 맞추지 않습니다.', '끄기')) { sy.on = false; saveSy(); setSy('off'); } };
    if (tk) tk.onclick = () => { const v = $('syTok').value.trim(); if (!v) return; const o = LS.get('ve:sync', {}); o.token = v; LS.set('ve:sync', o); renderSyncBox(); toast('토큰을 넣었습니다. [켜기] 를 누르세요', 2200); };
  }
  /* 다른 기기에서 잠근 API 키 받기 (같은 암호로) */
  let adopting = null;
  function adoptRemoteKeys() { if (!adopting) adopting = adoptRemoteKeys1().finally(() => { adopting = null; }); return adopting; }
  async function adoptRemoteKeys1() {
    const L = cfg.lockRemote; if (!L) return false;
    const pass = await askPass('다른 기기의 API 키 받기', '다른 기기에서 건 키 잠금 암호를 넣으면, 그 기기에 등록한 API 키를 이 기기에서도 씁니다.', false, true); if (pass == null) return false;
    const keep = askPass.remember;
    try {
      const k = await derive(pass, unb64(L.salt)); const got = JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(L.iv) }, k, unb64(L.data))));
      const before = new Set(cfg.apis.filter(a => hasKey(a)).map(a => a.id));
      if (!cfg.lock) { cfg.lock = { salt: L.salt, iv: L.iv, data: L.data }; lockKey = k; keyMem = Object.assign({}, got); cfg.apis.forEach(a => { if (a.key && !keyMem[a.id]) keyMem[a.id] = a.key; a.key = ''; }); await sealKeys(); }
      else { if (!(await unlock())) return false; for (const id in got) if (got[id] && !keyMem[id]) keyMem[id] = got[id]; if (lockKey) await sealKeys(); }
      sy.keysSeen = L.data; saveSy(); saveCfg(); remember(keep);
      const added = cfg.apis.filter(a => !before.has(a.id) && keyMem && keyMem[a.id]);
      const still = cfg.apis.filter(a => !hasKey(a) && a.type !== 'custom');
      toast(added.length ? `키 ${added.length}개를 받았습니다: ${added.map(a => a.name).join(' · ')}${still.length ? ` · 아직 키가 없는 것: ${still.map(a => a.name).join(' · ')}` : ''}` : still.length ? `그 기기에도 ${still.map(a => a.name).join(' · ')} 의 키는 없습니다 — 이 기기에서 [고치기] 로 넣어 주세요` : '받을 새 키가 없습니다 — 이 기기에 이미 모두 있습니다', 5200);
      renderApis(); renderBanner(); return true;
    } catch (e) { toast('암호가 맞지 않습니다', 2200); return false; }
  }

  /* =====================================================================
     이 기기 연결 — 단추 하나로: 토큰(없을 때만) → 동기화 켜기 → 자료 받기 → API 키 (다른 기기에서 잠근 것 받기 / 처음이면 옮길지 묻기)
     ===================================================================== */
  /* 키가 이 기기에 있는지: 풀려 있으면 그대로, 잠겨 있으면 잠근 키 목록으로 (예전 잠금은 목록이 없어 '있다고' 봄) */
  const hasKey = a => cfg.lock ? (keyMem ? !!keyMem[a.id] : (cfg.lock.ids ? cfg.lock.ids.includes(a.id) : true)) : !!a.key;
  /* 다른 기기에서 받을 키가 있는지: 그쪽 잠금이 이 기기 것과 다르고, 이미 확인한 것이 아니고, 이 기기에 없는 키가 그쪽에 있을 때만 */
  function remoteHas(id) {
    const L = cfg.lockRemote; if (!L || !L.data) return false;
    if (cfg.lock && cfg.lock.data === L.data) return false;
    if (sy.keysSeen === L.data) return false;
    if (hasKey({ id, key: (cfg.apis.find(a => a.id === id) || {}).key })) return false;
    return L.ids ? L.ids.includes(id) : true;
  }
  const keysToGet = () => cfg.apis.filter(a => remoteHas(a.id));
  /* [다른 기기 키 받기] 단추: 그쪽에만 있는 키가 남아 있을 때 ('나중에' 와 상관없이) */
  function remoteMissing() { const L = cfg.lockRemote; if (!L || !L.data || (cfg.lock && cfg.lock.data === L.data)) return false; return cfg.apis.some(a => a.type !== 'custom' && !hasKey(a) && (!L.ids || L.ids.includes(a.id))); }
  function askToken() {
    return new Promise(res => {
      const c = ghCfg();
      const d = dialog(`<h3>GitHub 토큰 한 번만 넣기</h3>
        <p class="modal-desc">SECRET 자료를 비공개 저장소 <b>${esc(c.owner)}/${esc(c.repo)}</b> 에 두고 모든 기기에서 같게 맞추려면, 이 기기에 토큰이 한 번 필요합니다. 영상(VIDEO) 동기화에 쓴 토큰이 있으면 그것을 붙여 넣으세요.</p>
        <ol class="sc-steps1"><li>토큰이 없으면 <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub 토큰 만들기</a> 를 엽니다.</li><li>Repository access 에서 <b>${esc(c.repo)}</b> 를 고르고, Permissions 의 <b>Contents</b> 를 <b>Read and write</b> 로 합니다.</li><li>만든 토큰을 아래에 붙여 넣습니다.</li></ol>
        <form class="sc-form"><label>토큰<input type="password" name="tok" placeholder="github_pat_…" autocomplete="off" required></label>
        <div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">연결</button></div></form>`, 'sc-dlg');
      const f = d.el.querySelector('form'); setTimeout(() => f.tok.focus(), 30);
      let done = false; const fin = v => { if (done) return; done = true; d.close(); res(v); };
      d.bg.addEventListener('closed', () => fin(null)); d.el.querySelector('[data-x]').onclick = () => fin(null);
      f.onsubmit = e => { e.preventDefault(); const v = f.tok.value.trim(); if (v) fin(v); };
    });
  }
  async function lockFlow(title, desc) {
    const p = await askPass(title, desc, true); if (!p) return false;
    const salt = crypto.getRandomValues(new Uint8Array(16)); lockKey = await derive(p, salt);
    keyMem = Object.fromEntries(cfg.apis.map(a => [a.id, a.key || ''])); cfg.apis.forEach(a => { a.key = ''; });
    cfg.lock = { salt: b64(salt) }; await sealKeys(); return true;
  }
  let connecting = false;
  async function connectDevice() {
    if (connecting) return; connecting = true; renderBanner();
    try {
      let c = ghCfg();
      if (!c.token) {
        const tok = await askToken(); if (!tok) return;
        const o = LS.get('ve:sync', {}); o.token = tok; LS.set('ve:sync', o); c = ghCfg();
      }
      await enableSync();
      if (!sy.on) return; // 실패 문구는 배너에
      const ai = aiApis();
      if (cfg.lockRemote && ai.some(a => !hasKey(a))) await adoptRemoteKeys();
      else if (!cfg.lock && cfg.apis.some(a => a.key) && !sy.askedLock) {
        sy.askedLock = true; saveSy();
        if (await confirmBox('API 키도 다른 기기로 옮길까요?', '잠금 암호를 정하면 키를 암호화해 함께 옮깁니다. 다른 기기에서는 [이 기기 연결] 을 누르고 같은 암호만 넣으면 됩니다. 옮기지 않으면 기기마다 키를 따로 넣습니다.', '암호 정하기'))
          if (await lockFlow('키 잠금 암호 정하기', '4자 이상. 다른 기기에서 같은 암호를 넣으면 키가 옮겨집니다. 이 암호는 어디에도 저장하지 않습니다.')) toast('API 키도 함께 옮겨집니다', 2400);
      }
      toast('이 기기 연결을 마쳤습니다. 이제 휴대폰 · PC 어디서나 같게 보입니다', 3000);
    } finally { connecting = false; renderBanner(); }
  }
  function renderBanner() {
    const b = $('syncBanner'); if (!b) return;
    const wait = sy.on ? keysToGet() : [], needKey = wait.length > 0;
    let html = '', bad = false;
    if (connecting) html = `<span class="ico-b">${icon('cloud', 18)}</span><div class="tx"><b>이 기기를 연결하는 중…</b><span>${esc(SY.msg || '잠시만 기다려 주세요')}</span></div>`;
    else if (!sy.on && !sy.dismiss) html = `<span class="ico-b">${icon('cloud', 18)}</span><div class="tx"><b>휴대폰 · PC 어디서나 같게 보려면 이 기기를 한 번 연결하세요</b><span>대화 기록 · 노트 · 매매 일지 · 나의 원칙 · 관심 종목을 비공개 저장소로 맞춥니다.</span></div><div class="acts"><button class="btn ink" id="bnConnect">${icon('cloud', 15)}이 기기 연결</button><button class="btn ghost" id="bnLater">이 기기만 쓰기</button></div>`;
    else if (sy.on && SY.state === 'bad') { bad = true; html = `<span class="ico-b">${icon('alert', 18)}</span><div class="tx"><b>다른 기기와 맞추지 못했습니다</b><span>${esc(SY.msg || sy.err || '')}</span></div><div class="acts"><button class="btn" id="bnConnect">다시 연결</button></div>`; }
    else if (needKey) html = `<span class="ico-b">${icon('key', 18)}</span><div class="tx"><b>다른 기기에서 등록한 API 키 ${wait.length}개를 받을 수 있습니다</b><span>${esc(wait.map(a => a.name).join(' · '))} — 그 기기에서 정한 키 잠금 암호를 한 번 넣으면 이 기기에서도 씁니다.</span></div><div class="acts"><button class="btn ink" id="bnKeys">${icon('key', 15)}키 받기</button><button class="btn ghost" id="bnKeysNo">나중에</button></div>`;
    b.hidden = !html; b.classList.toggle('bad', bad); b.innerHTML = html;
    const cn = $('bnConnect'), lt = $('bnLater'), ky = $('bnKeys');
    if (cn) cn.onclick = () => connectDevice();
    if (lt) lt.onclick = () => { sy.dismiss = true; saveSy(); renderBanner(); toast('왼쪽 [기기 동기화] 에서 언제든 연결할 수 있습니다', 2600); };
    if (ky) ky.onclick = async () => { await adoptRemoteKeys(); renderBanner(); };
    const kn = $('bnKeysNo'); if (kn) kn.onclick = () => { sy.keysSeen = cfg.lockRemote && cfg.lockRemote.data; saveSy(); renderBanner(); toast('API 연결 화면의 [다른 기기 키 받기] 로 언제든 받을 수 있습니다', 2800); };
  }

  /* =====================================================================
     모든 대화 (검색)
     ===================================================================== */
  function chatText(c) { return (c.view || []).map(m => m.text || '').join('\n'); }
  function renderHistory() {
    const q = $('hQ').value.trim().toLowerCase();
    const list = chats.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0)).filter(c => !q || (c.title || '').toLowerCase().includes(q) || chatText(c).toLowerCase().includes(q));
    $('hLead').textContent = `대화 ${chats.length}개를 모두 보관합니다${sy.on ? ' · 다른 기기와 같게 맞춰집니다' : ' · 지금은 이 기기에만 저장 (기기 동기화를 켜면 모든 기기에서 같게)'}.${q ? ` 검색 결과 ${list.length}개.` : ''}`;
    const mark = s => { const e = esc(s); if (!q) return e; const i = s.toLowerCase().indexOf(q); if (i < 0) return e; return esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length)); };
    $('hList').innerHTML = list.length ? list.map(c => {
      const t = chatText(c), i = q ? t.toLowerCase().indexOf(q) : -1, snip = i >= 0 ? t.slice(Math.max(0, i - 40), i + 120) : ((c.view || []).find(m => m.role === 'assistant') || {}).text || '';
      const n = (c.view || []).filter(m => m.role === 'user').length;
      return `<button type="button" class="sc-hi" data-hc="${c.id}"><b>${mark(c.title || '대화')}</b><span class="when">${c.updated ? new Date(c.updated).toLocaleString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''} · 질문 ${n}개</span><span class="snip">${mark(String(snip).replace(/\s+/g, ' ').slice(0, 220))}</span></button>`;
    }).join('') : `<div class="sc-bmsg">${q ? '찾는 대화가 없습니다.' : '아직 대화가 없습니다.'}</div>`;
    $('hList').querySelectorAll('[data-hc]').forEach(b => b.onclick = () => { show('chat'); openChat(b.dataset.hc); });
  }
  $('hQ').addEventListener('input', renderHistory);

  /* ---------- 모닝 브리핑: 피드별 5개씩 ---------- */
  bui.mode = 'top';
  $('bMode').onclick = e => { const b = e.target.closest('button'); if (!b) return; bui.mode = b.dataset.v; $('bMode').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); renderBrief(); };
  function renderFeeds(d) {
    const feeds = d.byFeed || [];
    if (!feeds.length) return '<div class="sc-bmsg">이 날의 브리핑에는 피드별 목록이 없습니다 (내일 아침부터 생깁니다).</div>';
    return `<div class="sc-feeds">${feeds.map(f => `<section class="sc-feed"><h3>${esc(f.name)}</h3>${f.items.length ? `<ol>${f.items.map(it => `<li><a href="${esc(it.link)}" target="_blank" rel="noopener">${esc(it.title)}</a><span>${esc(it.source)}${it.time ? ' · ' + it.time.slice(11, 16) : ''}${it.sources > 1 ? ` · ${it.sources}개 언론` : ''}${it.category ? ' · ' + esc(it.category) : ''}</span></li>`).join('')}</ol>` : '<p class="sc-fine" style="text-align:left">오늘은 이 피드에서 받은 기사가 없습니다.</p>'}</section>`).join('')}</div>`;
  }

  /* =====================================================================
     전략 브리핑 — 증권사 데일리 시황 · 투자전략 리포트 (briefing 브랜치의 strategy/)
     ===================================================================== */

  /* ---------- 전략 요약 (AI 없이): 여러 증권사 리포트에 공통으로 많이 나온 문장 · 낱말 · 기업을 규칙으로 고름 ---------- */
  const SUM_STOP = new Set('있는 있다 있음 대한 위한 따른 통해 이후 이번 지난 전일 금일 오늘 내일 관련 가운데 기록 대비 수준 정도 경우 이상 이하 중심 주요 최근 현재 향후 모두 일부 하는 했다 한다 되는 된다 것으로 에서 으로 대해 위해 전반 시황 마감 리포트 증권 코멘트 데일리 Daily Weekly 주간 주차'.split(' '));
  const sumWords = t => [...new Set((String(t).match(/[A-Za-z][A-Za-z0-9&]{1,}|[가-힣]{2,}/g) || []).map(w => /^[가-힣]/.test(w) && w.length > 2 ? w.replace(/(은|는|이|가|을|를|의|에|와|과|로|으로|도|만|에서|까지|부터)$/, '') : w).filter(w => w.length >= 2 && !SUM_STOP.has(w)))];
  const RISK = /우려|리스크|위험|부담|경계|하락|급락|약세|매도|투매|불확실|변동성|조정/;
  const ACT = /비중|매수|관심|추천|Top\s*Picks|대응|분할|선별|유망|주목|편입|매력|저가|트레이딩|포트폴리오/i;
  const gram2 = t => { const s = String(t).replace(/[^가-힣A-Za-z0-9]/g, ''); const o = new Set(); for (let i = 0; i < s.length - 1; i++) o.add(s.slice(i, i + 2)); return o; };
  const jac2 = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n || 1); };
  function keyPoints(list, n, filter) {
    const df = new Map(); for (const x of list) for (const w of sumWords(x.title + ' ' + x.summary)) df.set(w, (df.get(w) || 0) + 1);
    const cand = [];
    for (const x of list) for (let t of String(x.summary || '').split(/\n|(?<=[.다])\s+(?=[가-힣A-Z])/)) {
      t = t.replace(/^[\s\-·•:▶►◆■□○●*]+/, '').replace(/\s+/g, ' ').trim();
      if (t.length < 14 || t.length > 170 || (filter && !filter.test(t))) continue;
      const ws = sumWords(t); if (ws.length < 3) continue;
      const score = ws.reduce((a, w) => a + Math.max(0, (df.get(w) || 0) - 1), 0) / Math.sqrt(ws.length) + (/\d/.test(t) ? 0.6 : 0);
      cand.push({ t, x, score, g: gram2(t), w: new Set(ws) });
    }
    cand.sort((a, b) => b.score - a.score);
    const out = [];
    for (const c of cand) {
      const same = out.find(o => jac2(o.g, c.g) >= 0.32 || jac2(o.w, c.w) >= 0.3); // 글자 조각이나 낱말이 많이 겹치면 같은 내용
      if (same) { if (!same.who.some(w => w.broker === c.x.broker)) same.who.push(c.x); continue; }
      if (out.length < n) out.push({ t: c.t, g: c.g, w: c.w, who: [c.x] });
    }
    /* 여러 증권사가 함께 짚은 내용을 앞으로 */
    return out.sort((a, b) => b.who.length - a.who.length);
  }
  function renderStratSum(d) {
    const daily = d.daily || [], weekly = d.weekly || [];
    const dd = d.dailyDate ? new Date(d.dailyDate + 'T00:00') : null;
    $('sLead').innerHTML = `${dd ? `${dd.getMonth() + 1}월 ${dd.getDate()}일 발행 ` : ''}증권사 리포트 <b>${daily.length}개</b>와 최근 7일 주간 리포트 <b>${weekly.length}개</b>에서, 여러 증권사가 공통으로 많이 쓴 문장 · 낱말 · 기업을 규칙으로 골랐습니다. AI 토큰은 쓰지 않습니다. 원문 요약은 [일간 전략] · [주간 전략] 에 그대로 있습니다.`;
    $('sKw').innerHTML = (d.dailyKeywords || []).length ? '<span>오늘의 핵심 말</span>' + d.dailyKeywords.map(k => `<b>${esc(k.word)} <em>${k.count}</em></b>`).join('') : '';
    const extra = coExtra(), coCount = new Map();
    for (const x of daily.concat(weekly)) for (const c of new Set(secFindCompanies(x.title + '\n' + x.summary, extra).map(c => (window.SEC_ALIAS || {})[c] || c))) coCount.set(c, (coCount.get(c) || 0) + 1); // 리포트 하나에 한 번만 셈
    const cos = [...coCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
    const pts = (arr, cls) => arr.length ? `<ol class="sc-pts">${arr.map((p, i) => `<li class="${cls || ''}"><i>${i + 1}</i><span>${esc(p.t)}</span><span class="who">${p.who.length > 1 ? `${p.who.length}곳이 함께 짚음 · ` : ''}${p.who.slice(0, 4).map(x => `<a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.broker)}</a>`).join(' · ')}</span></li>`).join('')}</ol>` : '<p class="sc-fine" style="text-align:left">고를 만한 문장이 없습니다.</p>';
    const core = keyPoints(daily, 7), risk = keyPoints(daily, 4, RISK), act = keyPoints(daily.concat(weekly), 12, ACT).filter(p => !RISK.test(p.t)).slice(0, 5), wk = keyPoints(weekly, 5);
    $('sList').innerHTML = `<div class="sc-sum2">
      <section class="sc-card wide"><h2>오늘 증권사들이 공통으로 짚은 것</h2><p class="sub">여러 리포트에 겹쳐 나온 낱말이 많은 문장 순 · 같은 내용을 쓴 증권사를 함께 표시</p>${pts(core)}</section>
      <section class="sc-card"><h2>위험 요인</h2><p class="sub">우려 · 부담 · 변동성 · 매도 같은 말이 든 문장</p>${pts(risk, 'risk')}</section>
      <section class="sc-card"><h2>전략 · 대응</h2><p class="sub">비중 · 매수 · 관심 · 대응 같은 말이 든 문장 (일간 + 주간)</p>${pts(act)}</section>
      <section class="sc-card"><h2>많이 언급된 기업</h2><p class="sub">리포트 제목 · 요약에 나온 횟수 · 누르면 그 기업 노트로</p>${cos.length ? `<div class="sc-cos">${cos.map(([c, n]) => `<button type="button" data-sco="${esc(c)}">${esc(c)} <em>${n}</em></button>`).join('')}</div>` : '<p class="sc-fine" style="text-align:left">없음</p>'}</section>
      <section class="sc-card"><h2>이번 주 큰 흐름</h2><p class="sub">최근 7일 주간 전략 리포트에서 · 자주 나온 말: ${(d.weeklyKeywords || []).slice(0, 6).map(k => esc(k.word)).join(', ') || '없음'}</p>${pts(wk)}</section>
      <div class="wide" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" id="sumNote">${icon('edit', 15)}이 요약을 노트에 남기기</button><button class="btn ghost" id="sumAsk">${icon('sparkle', 15)}이 요약으로 내 종목 점검 받기 (AI)</button></div>
    </div>`;
    $('sList').querySelectorAll('[data-sco]').forEach(b => b.onclick = () => { nui.co = b.dataset.sco; show('notes'); });
    const plain = () => [`[전략 요약 ${d.dailyDate || ''}]`, '핵심: ' + core.slice(0, 5).map(p => '- ' + p.t).join('\n'), '위험: ' + risk.map(p => '- ' + p.t).join('\n'), '대응: ' + act.map(p => '- ' + p.t).join('\n'), '많이 언급: ' + cos.map(([c, n]) => `${c}(${n})`).join(', ')].join('\n');
    $('sumNote').onclick = () => editNote(null, ymdLocal(new Date()), plain() + '\n');
    $('sumAsk').onclick = () => { show('chat'); send('오늘 증권사 전략 리포트를 규칙으로 요약한 내용이야. 이것을 바탕으로 내 보유 · 관심 종목(get_portfolio)과 나의 원칙에 맞춰 오늘 대응을 짧게 정리해 줘.\n\n' + plain()); };
  }

  const sui = { mode: 'sum', dates: null, date: '' };
  $('sMode').onclick = e => { const b = e.target.closest('button'); if (!b) return; sui.mode = b.dataset.v; $('sMode').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); renderStrat(); };
  $('sReload').onclick = () => renderStrat(true);
  $('sDate').onchange = e => { sui.date = e.target.value; renderStrat(); };
  async function renderStrat(force) {
    const box = $('sList'); if (force) { bui.cache = {}; sui.dates = null; }
    box.innerHTML = '<div class="sc-bmsg">불러오는 중…</div>'; $('sKw').innerHTML = '';
    const actions = `https://github.com/${briefRepo()}/actions/workflows/strategy-briefing.yml`;
    let idx; try { idx = await getBrief('strategy/index.json'); } catch (e) { box.innerHTML = `<div class="sc-bmsg">${esc(e.message)}</div>`; return; }
    if (!idx || !(idx.dates || []).length) { box.innerHTML = `<div class="sc-bmsg"><b>아직 전략 브리핑이 없습니다.</b><br>매일 아침 7시 10분쯤 만들어집니다. 지금 받으려면 <a href="${actions}" target="_blank" rel="noopener">GitHub Actions 의 Strategy briefing</a> 에서 [Run workflow] 를 누르고 1~2분 뒤 [다시 불러오기] 를 누르세요.</div>`; $('sDate').innerHTML = ''; return; }
    sui.dates = idx.dates; if (!sui.date || !sui.dates.includes(sui.date)) sui.date = sui.dates[0];
    $('sDate').innerHTML = sui.dates.map(d => { const x = new Date(d + 'T00:00'); return `<option value="${d}"${d === sui.date ? ' selected' : ''}>${x.getMonth() + 1}월 ${x.getDate()}일 (${'일월화수목금토'[x.getDay()]})${d === ymdLocal(new Date()) ? ' · 오늘' : ''}</option>`; }).join('');
    let d; try { d = await getBrief('strategy/' + sui.date + '.json'); } catch (e) { box.innerHTML = `<div class="sc-bmsg">${esc(e.message)}</div>`; return; }
    if (!d) { box.innerHTML = '<div class="sc-bmsg">이 날의 전략 브리핑 파일이 없습니다.</div>'; return; }
    if (sui.mode === 'sum') { renderStratSum(d); return; }
    const list = sui.mode === 'weekly' ? d.weekly || [] : d.daily || [], kw = sui.mode === 'weekly' ? d.weeklyKeywords || [] : d.dailyKeywords || [];
    const t = d.generatedAt ? new Date(d.generatedAt) : null, dd = d.dailyDate ? new Date(d.dailyDate + 'T00:00') : null;
    $('sLead').innerHTML = `${t ? `${t.getMonth() + 1}월 ${t.getDate()}일 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')} 에 모음 · ` : ''}${sui.mode === 'weekly' ? `최근 7일 주간 전략 리포트 <b>${list.length}개</b>` : `${dd ? `${dd.getMonth() + 1}월 ${dd.getDate()}일 발행 ` : ''}증권사 데일리 · 투자전략 리포트 <b>${list.length}개</b>`}, 많이 읽힌 순. AI 토큰은 쓰지 않습니다. 매일 07:10 쯤 (08:30 보충).`;
    $('sKw').innerHTML = kw.length ? '<span>자주 나온 말</span>' + kw.map(k => `<b>${esc(k.word)} <em>${k.count}</em></b>`).join('') : '';
    box.innerHTML = list.length ? list.map(x => `<article class="sc-rp"><span class="rk">${x.rank}</span>
      <a class="tt" href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a>
      <div class="mt"><span class="br">${esc(x.broker)}</span><span class="sc-tag">${esc(x.kindName)}</span><span>${esc(x.date)}</span><span>조회 ${num(x.reads, 0)}</span></div>
      ${x.summary ? `<div class="sm" id="sm${x.nid}">${esc(x.summary)}</div>` : ''}
      <div class="acts">${x.summary && x.summary.split('\n').length > 4 ? `<button class="btn sm ghost" data-more="${x.nid}">요약 더 보기</button>` : ''}<button class="btn sm" data-snote="${x.nid}">${icon('edit', 14)}노트에 남기기</button><button class="btn sm ghost" data-sask="${x.nid}">${icon('sparkle', 14)}내 종목에 주는 의미 묻기</button></div></article>`).join('') : `<div class="sc-bmsg">${sui.mode === 'weekly' ? '최근 7일 안에 주간 전략 리포트가 없습니다.' : '이 날 모은 데일리 리포트가 없습니다.'}</div>`;
    const byId = id => list.find(x => x.nid === id);
    box.querySelectorAll('[data-more]').forEach(b => b.onclick = () => { const el = $('sm' + b.dataset.more); el.classList.toggle('open'); b.textContent = el.classList.contains('open') ? '접기' : '요약 더 보기'; });
    box.querySelectorAll('[data-snote]').forEach(b => b.onclick = () => { const x = byId(b.dataset.snote); editNote(null, ymdLocal(new Date()), `[${x.broker}] ${x.title}\n${x.link}\n`); });
    box.querySelectorAll('[data-sask]').forEach(b => b.onclick = () => { const x = byId(b.dataset.sask); show('chat'); send(`${x.broker} 의 "${x.title}" (${x.date}) 리포트 요약이야. 이 전략이 내 보유 · 관심 종목(get_portfolio)과 나의 원칙에 주는 의미를 짧게 정리해 줘.\n\n${x.summary}`); });
  }

  /* =====================================================================
     전략 요약 — 모닝 브리핑(뉴스) + 전략 브리핑(증권사 리포트)을 규칙으로 합쳐 요약 (AI 토큰 안 씀)
     · 함께 가리키는 말: 뉴스 제목과 리포트에 둘 다 많이 나온 낱말
     · 시장 온도: 오름(반등 · 상승 · 매수 …) / 내림(급락 · 우려 · 매도 …) 신호 문장 수
     · 핵심 이슈: 뉴스 큰 이슈마다 낱말이 가장 많이 겹치는 증권사 문장을 붙임
     ===================================================================== */
  const POS = /반등|상승|급등|매수|회복|호조|최고치|개선|기대|강세|순매수|돌파/;
  const NEG = /급락|폭락|우려|투매|매도|하락|리스크|경계|부담|공포|약세|순매도|침체|쇼크/;
  const WHEN = /일정|발표\s*예정|예정|FOMC|CPI|PCE|고용지표|금통위|실적\s*발표|다음\s*주|내주|주간\s*일정|어닝/;
  $('mReload').onclick = () => renderSum(true);
  async function renderSum(force) {
    const box = $('mList'); if (force) bui.cache = {};
    box.innerHTML = '<div class="sc-bmsg">뉴스와 리포트를 불러오는 중…</div>';
    let mi = null, si = null;
    try { [mi, si] = await Promise.all([getBrief('index.json'), getBrief('strategy/index.json')]); } catch (e) { box.innerHTML = `<div class="sc-bmsg">${esc(e.message)}</div>`; return; }
    const md = mi && (mi.dates || [])[0] ? await getBrief(mi.dates[0] + '.json').catch(() => null) : null;
    const sd = si && (si.dates || [])[0] ? await getBrief('strategy/' + si.dates[0] + '.json').catch(() => null) : null;
    if (!md && !sd) { box.innerHTML = '<div class="sc-bmsg">아직 모닝 브리핑 · 전략 브리핑이 없습니다. 내일 아침 7시 이후에 다시 열어 보세요.</div>'; return; }
    const news = [], seen = new Set();
    for (const it of ((md && md.items) || []).concat(...((md && md.byFeed) || []).map(f => f.items || []))) { const k = it.link || it.title; if (seen.has(k)) continue; seen.add(k); news.push(it); }
    const daily = (sd && sd.daily) || [], weekly = (sd && sd.weekly) || [], reps = daily.concat(weekly);
    const fmtD = s => { if (!s) return ''; const x = new Date(s); return `${x.getMonth() + 1}월 ${x.getDate()}일 ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; };
    $('mLead').innerHTML = `모닝 브리핑 뉴스 <b>${news.length}건</b>${md ? ` (${fmtD(md.generatedAt)})` : ''} + 증권사 리포트 <b>${reps.length}개</b>${sd ? ` (${fmtD(sd.generatedAt)}, 데일리 ${sd.dailyDate || ''})` : ''}를 합쳐, 둘이 함께 가리키는 것을 규칙으로 골랐습니다. AI 토큰은 쓰지 않습니다.`;
    /* 1. 함께 가리키는 말 */
    const cnt = arr => { const m = new Map(); for (const t of arr) for (const w of sumWords(t)) m.set(w, (m.get(w) || 0) + 1); return m; };
    const nw = cnt(news.map(n => n.title)), rw = cnt(reps.map(r => r.title + ' ' + r.summary));
    const GEN = new Set(['시장', '미국', '증시', '국내', '주식', '투자', '전망', '한국', '글로벌', '투자자', '종목', '기업']); // 너무 흔한 말은 뺌
    const both = [...nw.keys()].filter(w => !GEN.has(w) && rw.has(w) && nw.get(w) >= 2 && rw.get(w) >= 2).map(w => ({ w, n: nw.get(w), r: rw.get(w), s: nw.get(w) / Math.max(1, news.length) + rw.get(w) / Math.max(1, reps.length) })).sort((a, b) => b.s - a.s).slice(0, 10);
    /* 2. 시장 온도 */
    let pos = 0, neg = 0;
    for (const t of news.map(n => n.title).concat(...reps.map(r => String(r.summary).split('\n')))) { if (POS.test(t)) pos++; if (NEG.test(t)) neg++; }
    const tot = pos + neg || 1, pp = Math.round(pos / tot * 100);
    const mood = pp >= 60 ? '오름 신호가 우세' : pp <= 40 ? '내림 · 위험 신호가 우세' : '오름 · 내림 신호가 엇갈림';
    /* 3. 핵심 이슈 + 증권사 시각 */
    const pool = keyPoints(daily.concat(weekly), 60);
    const issues = ((md && md.items) || []).slice(0, 6).map(it => {
      const ws = new Set(sumWords(it.title)); let best = null, bs = 0;
      for (const p of pool) { let s = 0; for (const w of p.w) if (ws.has(w)) s++; if (s > bs) { bs = s; best = p; } }
      return { it, view: bs >= 2 ? best : null };
    });
    /* 4. 위험 · 대응 · 일정 */
    const riskR = keyPoints(daily, 3, RISK), riskN = news.filter(n => NEG.test(n.title)).sort((a, b) => (b.sources || 0) - (a.sources || 0)).slice(0, 3);
    const act = keyPoints(reps, 12, ACT).filter(p => !RISK.test(p.t)).slice(0, 4);
    const schedN = news.filter(n => WHEN.test(n.title)).sort((a, b) => (b.sources || 0) - (a.sources || 0)).slice(0, 4), schedR = keyPoints(reps, 3, WHEN);
    /* 5. 주목 기업 (뉴스 + 리포트) · 내 종목 표시 */
    const extra = coExtra(), alias = window.SEC_ALIAS || {}, coN = new Map(), coR = new Map();
    for (const n of news) for (const c of new Set(secFindCompanies(n.title, extra).map(c => alias[c] || c))) coN.set(c, (coN.get(c) || 0) + 1);
    for (const r of reps) for (const c of new Set(secFindCompanies(r.title + '\n' + r.summary, extra).map(c => alias[c] || c))) coR.set(c, (coR.get(c) || 0) + 1);
    const myNames = new Set(watch.items.flatMap(it => [it.symbol, it.name]).filter(Boolean).map(x => alias[x] || x));
    const cos = [...new Set([...coN.keys(), ...coR.keys()])].map(c => ({ c, n: coN.get(c) || 0, r: coR.get(c) || 0 })).sort((a, b) => (b.n + b.r) - (a.n + a.r)).slice(0, 14);
    /* 6. 내 종목 관련 */
    const mine = watch.items.map(it => { const names = [it.symbol, it.name].filter(Boolean); const hn = news.filter(n => names.some(x => n.title.includes(x))); const hr = reps.filter(r => names.some(x => (r.title + r.summary).includes(x))); return { it, hn, hr }; }).filter(x => x.hn.length || x.hr.length);
    const pts = (arr, cls) => arr.length ? `<ol class="sc-pts">${arr.map((p, i) => `<li class="${cls || ''}"><i>${i + 1}</i><span>${esc(p.t)}</span><span class="who">${p.who.length > 1 ? `${p.who.length}곳 · ` : ''}${p.who.slice(0, 3).map(x => `<a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.broker)}</a>`).join(' · ')}</span></li>`).join('')}</ol>` : '';
    const nl = (arr, cls) => arr.length ? `<ol class="sc-pts">${arr.map((n, i) => `<li class="${cls || ''}"><i>${i + 1}</i><span><a href="${esc(n.link)}" target="_blank" rel="noopener" style="color:inherit">${esc(n.title)}</a></span><span class="who">뉴스 · ${esc(n.source)}${n.sources > 1 ? ` 외 · ${n.sources}개 언론` : ''}</span></li>`).join('')}</ol>` : '';
    const top3 = both.slice(0, 3).map(b => b.w);
    box.innerHTML = `<div class="sc-sum2">
      <section class="sc-card wide"><div class="sc-hero">
        <div><h2>${top3.length ? `오늘 뉴스와 증권사가 함께 가리키는 것: ${top3.map(esc).join(' · ')}` : '오늘 뉴스와 리포트가 함께 가리키는 말이 뚜렷하지 않습니다'}</h2>
          <p class="sub">뉴스 제목과 리포트에 둘 다 2번 이상 나온 낱말 (뉴스 건수 / 리포트 수)</p>
          <div class="sc-both">${both.map(b => `<b>${esc(b.w)} <em>${b.n} / ${b.r}</em></b>`).join('') || '<span class="sc-fine">없음</span>'}</div></div>
        <div class="sc-temp"><p class="sub" style="margin:0">시장 온도 — 오름 · 내림 신호가 든 문장 수</p><b class="v">${mood}</b>
          <div class="bar" role="img" aria-label="오름 ${pos} · 내림 ${neg}"><i class="pos" style="width:${pp}%"></i><i class="neg" style="width:${100 - pp}%"></i></div>
          <div class="lg"><span>오름 신호 ${pos}</span><span>내림 · 위험 신호 ${neg}</span></div></div>
      </div></section>
      <section class="sc-card wide"><h2>핵심 이슈와 증권사 시각</h2><p class="sub">모닝 브리핑의 큰 이슈마다, 낱말이 가장 많이 겹치는 증권사 리포트 문장을 붙였습니다</p>
        ${issues.length ? `<ol class="sc-iss">${issues.map(({ it, view }, i) => `<li><i>${i + 1}</i><a class="h" href="${esc(it.link)}" target="_blank" rel="noopener">${esc(it.title)}</a><span class="m">${esc(it.category || '')} · ${esc(it.source)}${it.sources > 1 ? ` 외 ${it.sources}개 언론` : ''}</span>${view ? `<div class="v">${esc(view.t)}<small>증권사 시각 · ${view.who.slice(0, 3).map(x => `<a href="${esc(x.link)}" target="_blank" rel="noopener" style="color:inherit">${esc(x.broker)}</a>`).join(' · ')}</small></div>` : '<div class="v none">이 이슈를 직접 다룬 증권사 문장은 찾지 못했습니다</div>'}</li>`).join('')}</ol>` : '<p class="sc-fine" style="text-align:left">모닝 브리핑이 아직 없습니다.</p>'}</section>
      <section class="sc-card"><h2>위험 요인</h2><p class="sub">증권사가 짚은 위험 + 여러 언론이 다룬 하락 · 우려 뉴스</p>${pts(riskR, 'risk')}${nl(riskN, 'risk')}${!riskR.length && !riskN.length ? '<p class="sc-fine" style="text-align:left">눈에 띄는 위험 신호가 없습니다.</p>' : ''}</section>
      <section class="sc-card"><h2>전략 · 대응</h2><p class="sub">증권사 리포트에서 비중 · 매수 · 주목 · 대응이 든 문장</p>${pts(act) || '<p class="sc-fine" style="text-align:left">없음</p>'}</section>
      <section class="sc-card"><h2>주목 기업</h2><p class="sub">뉴스 + 리포트에서 함께 많이 나온 기업 (뉴스 / 리포트) · 테두리 진한 것은 내 종목 · 누르면 그 기업 노트로</p>
        ${cos.length ? `<div class="sc-cos">${cos.map(x => `<button type="button" class="${myNames.has(x.c) ? 'mine' : ''}" data-mco="${esc(x.c)}">${esc(x.c)} <em>${x.n} / ${x.r}</em></button>`).join('')}</div>` : '<p class="sc-fine" style="text-align:left">없음</p>'}</section>
      <section class="sc-card"><h2>확인할 일정</h2><p class="sub">발표 · FOMC · CPI · 실적 발표 · 이번 주 같은 말이 든 뉴스와 리포트 문장</p>${nl(schedN)}${pts(schedR)}${!schedN.length && !schedR.length ? '<p class="sc-fine" style="text-align:left">찾지 못했습니다.</p>' : ''}</section>
      ${mine.length ? `<section class="sc-card wide"><h2>내 종목 관련</h2><p class="sub">관심 종목 · 보유에 적은 종목이 나온 뉴스와 리포트</p><div class="sc-mine2">${mine.map(x => `<div><b>${esc(x.it.name || x.it.symbol)}</b> — 뉴스 ${x.hn.length}건 · 리포트 ${x.hr.length}개<br>${x.hn.slice(0, 2).map(n => `<a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.title)}</a>`).join('<br>')}${x.hr.slice(0, 1).map(r => `<br><a href="${esc(r.link)}" target="_blank" rel="noopener">[${esc(r.broker)}] ${esc(r.title)}</a>`).join('')}</div>`).join('')}</div></section>` : ''}
      <div class="wide" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" id="mNote">${icon('edit', 15)}이 요약을 노트에 남기기</button><button class="btn ghost" id="mAsk">${icon('sparkle', 15)}이 요약으로 오늘 내 대응 묻기 (AI)</button></div>
    </div>`;
    box.querySelectorAll('[data-mco]').forEach(b => b.onclick = () => { nui.co = b.dataset.mco; show('notes'); });
    const plain = () => [`[전략 요약 ${ymdLocal(new Date())}]`, `함께 가리키는 것: ${both.slice(0, 6).map(b => b.w).join(', ')}`, `시장 온도: ${mood} (오름 ${pos} · 내림 ${neg})`, '핵심 이슈:', ...issues.map(({ it, view }) => `- ${it.title}${view ? ` → [${view.who[0].broker}] ${view.t}` : ''}`), '위험:', ...riskR.map(p => '- ' + p.t), ...riskN.map(n => '- ' + n.title), '대응:', ...act.map(p => '- ' + p.t), `주목 기업: ${cos.map(x => x.c).join(', ')}`].join('\n');
    $('mNote').onclick = () => editNote(null, ymdLocal(new Date()), plain() + '\n');
    $('mAsk').onclick = () => { show('chat'); send('오늘 모닝 브리핑과 증권사 전략 리포트를 규칙으로 합친 요약이야. 이것을 바탕으로 내 보유 · 관심 종목(get_portfolio), 나의 원칙, 매매 일지(get_journal)에 맞춰 오늘 할 일과 하지 말 일을 짧게 정리해 줘.\n\n' + plain()); };
  }

  /* =====================================================================
     화면 전환 (2)
     ===================================================================== */
  /* =====================================================================
     종목 분석 — 등록한 API 를 한 화면에: 시세(KIS 실시간 · 금융위 전일 종가) · 일봉 차트와 지표 · 예탁결제원 기록 · 내 보유
     ===================================================================== */
  const K_STOCK = 'sec:stock', K_KSDC = 'sec:ksdCache';
  const stockPref = LS.get(K_STOCK, { recent: [], range: 120 });
  const ksdCache = LS.get(K_KSDC, {}); // { key: { t, v } } — 개발 계정은 하루 100회라 아껴 씀
  function ksdCached(key, ttlH, fn) {
    const c = ksdCache[key]; if (c && Date.now() - c.t < ttlH * 36e5) return Promise.resolve(c.v);
    return fn().then(v => { ksdCache[key] = { t: Date.now(), v }; const ks = Object.keys(ksdCache); if (ks.length > 120) ks.sort((a, b) => ksdCache[a].t - ksdCache[b].t).slice(0, ks.length - 120).forEach(k => delete ksdCache[k]); LS.set(K_KSDC, ksdCache); return v; });
  }
  /* "ETF 0190G0" · "005930.KS" · "A005930" → 005930 / 0190G0. 한국 코드가 아니면 그대로 (미국 AAPL 등) */
  function normSym(s) {
    const t = String(s || '').trim().toUpperCase();
    const m = t.match(/(?:^|[^0-9A-Z])A?(\d[0-9A-Z]{5})(?:\.(?:KS|KQ))?(?:$|[^0-9A-Z])/);
    return m ? m[1] : t.replace(/\s+/g, '');
  }
  const pick = it => Object.fromEntries(Object.entries(it || {}).map(([k, v]) => [k.replace(/^.*\[(\w+)\]$/, '$1'), v]));
  const numOf = v => { const t = String(v == null ? '' : v).replace(/[,%\s]/g, ''); if (t === '') return NaN; const n = +t; return isFinite(n) ? n : NaN; };
  const fld = (x, re) => { for (const k in x) if (re.test(k) && x[k] !== '') return x[k]; return ''; };
  const rawBox = (e, it) => it ? `<details class="sc-raw"><summary>받은 원문 보기</summary><pre>${esc(JSON.stringify(it, null, 1))}</pre></details>` : '';
  /* 작년 배당 순위 전체를 한 번만 받아 코드 → 배당 으로 (하루 1회) */
  function ksdDividends(year) {
    const a = dataFor('ksd'); if (!a) return Promise.resolve(null);
    return ksdCached('div:' + year, 24 * 7, async () => {
      const key = await keyOf(a), y = String(year);
      const pages = async (base, max) => { // 1000건씩 나눠 받기
        let all = [], total = 0;
        for (let pg = 1; pg <= max; pg++) {
          const r = await DATA.ksd.call(key, 'getDividendRankN1', Object.assign({}, base, { pageNo: String(pg), numOfRows: '1000' }));
          total = r.total || total; all = all.concat(r.items);
          if (!r.items.length || all.length >= total) break;
        }
        return { total: total || all.length, items: all };
      };
      const tries = [
        () => pages({ rankTpcd: '1', year: y }, 4),
        () => pages({ rankTpcd: '1', year: y, stkTpcd: '1' }, 4),
        async () => { const out = { total: 0, items: [] }; for (const lt of ['11', '12']) { const r = await pages({ rankTpcd: '1', year: y, stkTpcd: '1', listTpcd: lt }, 3); out.total += r.total; out.items = out.items.concat(r.items); } return out; },
      ];
      let r = null, err = null;
      for (const t of tries) { try { r = await t(); break; } catch (e) { err = e; if (!/PARAMETER/i.test(e.message)) throw e; } }
      if (!r) throw err;
      const m = {};
      for (const it of r.items) {
        const x = pick(it), code = x.shotnIsin || fld(x, /shotn|short|srtn/i);
        if (code) m[code] = [+fld(x, /^num$|rank/i) || 0, x.korSecnNm || fld(x, /nm$/i) || '', x.caltotMartTpcd || fld(x, /mart/i) || '', numOf(x.divAmtPerStk || fld(x, /amt/i)), numOf(x.divRateCpri || fld(x, /cpri|rate/i)), x.secnKacd || fld(x, /kacd|kind/i) || ''];
      }
      if (!Object.keys(m).length && r.items.length) { const e = new Error('배당 자료의 항목 이름이 예상과 다릅니다'); e.raw = r.items[0]; throw e; }
      return { total: r.total, m };
    });
  }
  /* 이름 → 코드 (예탁결제원 → 금융위 순서) */
  async function resolveSym(q) {
    const s = normSym(q); if (/^\d[0-9A-Z]{5}$/.test(s) || /^[A-Z.\-]{1,10}$/.test(s)) return { code: s, name: '' };
    const k = dataFor('ksd');
    if (k) { try { const b = await ksdCached('nm:' + q, 24 * 30, async () => (await DATA.ksd.call(await keyOf(k), 'getStkIsinByNmN1', { secnNm: q })).items.map(pick)); const x = b.find(i => /보통/.test(i.secnKacdNm || '')) || b[0]; if (x && x.shotnIsin) return { code: x.shotnIsin, name: x.korSecnNm || q }; } catch (e) { } }
    const d = dataApis().find(a => a.type === 'datagokr');
    if (d) { try { const r = await DATA.datagokr.quote(await keyOf(d), q); return { code: r.symbol, name: r.name || q }; } catch (e) { } }
    throw new Error(`"${q}" 의 종목 코드를 찾지 못했습니다 — 6자리 코드(예: 005930)로 찾아 주세요`);
  }

  let stock = null, stockSeq = 0;
  async function openStock(q) {
    q = String(q || '').trim(); if (!q) return;
    show('stock'); const my = ++stockSeq;
    stock = { q, code: '', name: '', quote: null, bars: null, ksd: null, div: null, err: {}, loading: true };
    renderStock();
    try { const r = await resolveSym(q); stock.code = r.code; stock.name = r.name; }
    catch (e) { stock.err.code = e.message; stock.loading = false; renderStock(); return; }
    stock.name = String(stock.name || '').replace(/보통주$/, '');
    const w = watch.items.find(it => normSym(it.symbol) === stock.code); if (w && w.name && !stock.name) stock.name = w.name;
    stockPref.recent = [stock.code].concat(stockPref.recent.filter(x => x !== stock.code)).slice(0, 8); LS.set(K_STOCK, stockPref);
    renderStock();
    const done = () => { if (my === stockSeq) renderStock(); };
    const jobs = [];
    if (dataFor('quote')) jobs.push(callData('quote', stock.code).then(q2 => { stock.quote = q2; if (q2.name && !stock.name) stock.name = q2.name; watch.quotes[stock.code] = { price: q2.price, changePct: q2.changePct, time: q2.time || new Date().toISOString(), source: q2.source }; saveWatch(); }).catch(e => { stock.err.quote = e.message; }).then(done));
    if (dataFor('history')) jobs.push(callData('history', stock.code, 260).then(b => { stock.bars = b; }).catch(e => { stock.err.bars = e.message; }).then(done));
    const k = dataFor('ksd');
    if (k && /^\d[0-9A-Z]{5}$/.test(stock.code)) {
      jobs.push(ksdCached('stk:' + stock.code, 24 * 7, async () => {
        const key = await keyOf(k), b = (await DATA.ksd.call(key, 'getStkIsinByShortIsinN1', { shortIsin: stock.code })).items.map(pick);
        const x = b.find(i => /보통/.test(i.secnKacdNm || '')) || b[0] || {};
        let l = null; if (x.isin) try { l = pick((await DATA.ksd.call(key, 'getStkListInfoN1', { isin: x.isin })).items[0]); } catch (e) { }
        return { base: x, list: l };
      }).then(v => { stock.ksd = v; if (v.base.korSecnNm && !stock.name) stock.name = v.base.korSecnNm.replace(/보통주$/, ''); }).catch(e => { stock.err.ksd = e.message; }).then(done));
      const y = new Date().getFullYear() - 1;
      jobs.push(ksdDividends(y).then(d => { stock.div = d ? { year: y, total: d.total, row: d.m[stock.code] || null } : null; }).catch(e => { stock.err.div = e.message; }).then(done));
    }
    await Promise.all(jobs); if (my === stockSeq) { stock.loading = false; renderStock(); }
  }

  /* 일봉 차트 (SVG) — 종가 선 · 20/60일 이동평균 · 손으로 짚으면 그날 값 */
  function chartSvg(bars, mine, W, H) {
    if (!bars || bars.length < 2) return '';
    W = W || 760; H = H || 260; const P = { l: 8, r: 64, t: 14, b: 26 };
    const c = bars.map(b => b.c), ma = k => c.map((_, i) => i + 1 >= k ? c.slice(i + 1 - k, i + 1).reduce((a, b) => a + b, 0) / k : null);
    const m20 = ma(20), m60 = ma(60);
    const lv = [mine && +mine.avg, mine && +mine.stop, mine && +mine.target].filter(v => v > 0);
    let lo = Math.min(...bars.map(b => b.l || b.c)), hi = Math.max(...bars.map(b => b.h || b.c));
    lv.forEach(v => { if (v > lo * .85 && v < hi * 1.15) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    const pad = (hi - lo) * .06 || hi * .02; lo -= pad; hi += pad;
    const X = i => P.l + (W - P.l - P.r) * i / (bars.length - 1), Y = v => P.t + (H - P.t - P.b) * (1 - (v - lo) / (hi - lo));
    const path = arr => arr.map((v, i) => v == null ? '' : `${arr[i - 1] == null ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    const up = c[c.length - 1] >= c[0], col = up ? 'var(--sc-up)' : 'var(--sc-down)';
    const ticks = [0, .25, .5, .75, 1].map(f => lo + (hi - lo) * f);
    const fmt = v => v >= 1000 ? Math.round(v).toLocaleString('ko-KR') : v.toFixed(v >= 100 ? 1 : 2);
    const dates = W < 480 ? [0, bars.length - 1] : [0, Math.floor(bars.length / 2), bars.length - 1];
    const lines = [[mine && +mine.avg, '평균 단가'], [mine && +mine.stop, '손절'], [mine && +mine.target, '목표']].filter(([v]) => v > 0 && v > lo && v < hi);
    return `<svg class="sc-chart" data-lo="${lo}" data-hi="${hi}" data-h="${H}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="최근 ${bars.length}거래일 종가 차트">
      ${ticks.map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="${W - P.r + 6}" y="${Y(v) + 4}" class="ax">${fmt(v)}</text>`).join('')}
      ${dates.map(i => `<text x="${X(i)}" y="${H - 6}" class="ax" text-anchor="${i === 0 ? 'start' : i === bars.length - 1 ? 'end' : 'middle'}">${bars[i].t.slice(2)}</text>`).join('')}
      <path d="${path(c)}L${X(c.length - 1)},${H - P.b}L${X(0)},${H - P.b}Z" fill="${col}" opacity=".07"/>
      <path d="${path(m60)}" class="ma60"/><path d="${path(m20)}" class="ma20"/>
      <path d="${path(c)}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round"/>
      ${lines.map(([v, n]) => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" class="lv"/><text x="${P.l + 4}" y="${Y(v) - 4}" class="lvt">${n} ${fmt(v)}</text>`).join('')}
      <circle cx="${X(c.length - 1)}" cy="${Y(c[c.length - 1])}" r="3.5" fill="${col}"/>
      <g class="hv" style="display:none"><line class="hl" y1="${P.t}" y2="${H - P.b}"/><circle r="4" class="hc"/></g>
      <rect class="hit" x="${P.l}" y="0" width="${W - P.l - P.r}" height="${H}" fill="transparent" data-l="${P.l}" data-w="${W - P.l - P.r}" data-vw="${W}"/>
    </svg>`;
  }
  function wireChart(box, bars) {
    const svg = box.querySelector('.sc-chart'); if (!svg) return;
    const hit = svg.querySelector('.hit'), hv = svg.querySelector('.hv'), tip = box.querySelector('.sc-tip');
    const H = +svg.dataset.h || 260, P = { t: 14, b: 26 };
    const L = +svg.dataset.lo, Hh = +svg.dataset.hi; // 차트와 같은 세로 범위
    const move = e => {
      const r = svg.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * +hit.dataset.vw;
      const i = Math.max(0, Math.min(bars.length - 1, Math.round((vx - +hit.dataset.l) / +hit.dataset.w * (bars.length - 1))));
      const x = +hit.dataset.l + +hit.dataset.w * i / (bars.length - 1);
      hv.style.display = ''; hv.querySelector('.hl').setAttribute('x1', x); hv.querySelector('.hl').setAttribute('x2', x);
      const b = bars[i], prev = bars[i - 1];
      hv.querySelector('.hc').setAttribute('cx', x); hv.querySelector('.hc').setAttribute('cy', P.t + (H - P.t - P.b) * (1 - (b.c - L) / (Hh - L)));
      const ch = prev ? (b.c / prev.c - 1) * 100 : null;
      tip.innerHTML = `<b>${esc(b.t)}</b> 종가 <b>${num(b.c)}</b> <span class="${cls(ch)}">${pct(ch)}</span>${b.v ? ` · 거래량 ${num(b.v, 0)}` : ''}`;
    };
    hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { hv.style.display = 'none'; tip.innerHTML = tip.dataset.def || ''; });
  }

  function apiNeed(t, label) { return `<div class="sc-need">${icon('key', 16)}<span>${label}</span><button class="btn sm" data-goapi="${t}">연결하기</button></div>`; }
  function renderStock() {
    const box = $('stBody'); if (!box) return;
    const recent = stockPref.recent.concat(watch.items.map(it => normSym(it.symbol))).filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 10);
    $('stRecent').innerHTML = recent.map(s => { const it = watch.items.find(w => normSym(w.symbol) === s); return `<button type="button" data-s="${esc(s)}">${it && it.name ? `${esc(it.name)}<small>${esc(s)}</small>` : esc(s)}</button>`; }).join('');
    $('stRecent').querySelectorAll('[data-s]').forEach(b => b.onclick = () => { $('stQ').value = b.dataset.s; openStock(b.dataset.s); });
    if (!stock) {
      const have = { quote: !!dataFor('quote'), history: !!dataFor('history'), ksd: !!dataFor('ksd') };
      box.innerHTML = `<div class="sc-empty-st"><h2>종목 하나를 깊이 봅니다</h2><p>코드(005930 · 0190G0 · AAPL)나 이름(삼성전자)을 넣으면, 연결한 API 를 모두 모아 한 화면에 보여 줍니다.</p>
        <ul class="sc-srcs">
          <li class="${have.quote ? 'on' : ''}">${icon(have.quote ? 'check' : 'key', 15)}<b>시세</b><span>${have.quote ? esc(dataApis().filter(a => (TYPES[a.type].caps || []).includes('quote')).map(a => a.name).join(' · ')) : '연결 안 됨'}</span></li>
          <li class="${have.history ? 'on' : ''}">${icon(have.history ? 'check' : 'key', 15)}<b>일봉 · 지표</b><span>${have.history ? '차트 · 이동평균 · RSI · 변동성 · 낙폭' : '연결 안 됨'}</span></li>
          <li class="${have.ksd ? 'on' : ''}">${icon(have.ksd ? 'check' : 'key', 15)}<b>예탁결제원 기록</b><span>${have.ksd ? '표준코드 · 상장일 · 배당 순위' : '연결 안 됨'}</span></li>
        </ul>${have.quote && have.ksd ? '' : `<button class="btn sm" data-goapi="">API 연결로</button>`}</div>`;
      wireGoApi(box); return;
    }
    const s = stock, q = s.quote, b = s.bars, A = b && b.length > 1 ? analyze(b) : null;
    const mine = watch.items.find(it => normSym(it.symbol) === s.code);
    const price = q ? q.price : b && b.length ? b[b.length - 1].c : null;
    const chg = q ? q.changePct : null;
    const rng = stockPref.range || 120, shown = b ? b.slice(-rng) : null;
    const per = n => shown && shown.length > n ? (shown[shown.length - 1].c / shown[0].c - 1) * 100 : null;
    const loading = t => `<div class="sc-skel">${esc(t)} 불러오는 중…</div>`;
    const chartW = Math.max(280, Math.min(1400, Math.round((box.clientWidth || 760) - 38))); // 화면 폭에 맞춰 (글자가 눌리지 않게)
    const errBox = m => `<div class="sc-err">${icon('alert', 15)}<span>${esc(m)}</span></div>`;
    const kv = rows => `<dl class="sc-kv">${rows.filter(r => r && r[1] != null && r[1] !== '' && r[1] !== '–').map(([k, v, c]) => `<dt>${k}</dt><dd${c ? ` class="${c}"` : ''}>${v}</dd>`).join('')}</dl>`;
    const d8 = v => /^\d{8}$/.test(v || '') ? `${v.slice(0, 4)}.${v.slice(4, 6)}.${v.slice(6)}` : (v || '');
    const rsi = A && A.rsi14 != null ? A.rsi14 : null;
    const rsiTxt = rsi == null ? '' : rsi >= 70 ? '과열권' : rsi <= 30 ? '침체권' : '중립';
    const k = s.ksd && s.ksd.base, l = s.ksd && s.ksd.list, dv = s.div && s.div.row;
    const realtime = q && /실시간/.test(q.source || '');
    box.innerHTML = `
      <header class="st-head">
        <div class="st-id"><h2>${esc(s.name || s.code || s.q)}</h2><span>${esc(s.code)}${k && k.engSecnNm ? ' · ' + esc(k.engSecnNm) : ''}${q && q.exchange ? ' · ' + esc(q.exchange) : ''}${q && q.sector ? ' · ' + esc(q.sector) : ''}</span></div>
        <div class="st-px">${price != null ? `<b>${num(price)}</b><span class="${cls(chg)}">${q && q.change != null ? (q.change > 0 ? '▲ ' : q.change < 0 ? '▼ ' : '') + num(Math.abs(q.change)) + ' ' : ''}${pct(chg)}</span>` : s.err.code ? '' : '<b class="sc-skel-i">–</b>'}
          <small>${q ? `<i class="dot ${realtime ? 'live' : ''}"></i>${esc(q.source || '')}` : s.err.quote ? '시세 불러오기 실패' : dataFor('quote') ? '시세 불러오는 중…' : '시세 API 없음'}</small></div>
        <div class="st-acts">
          <button class="btn ink" data-st="ai">${icon('sparkle', 16)}AI 분석</button>
          ${mine ? `<button class="btn" data-st="edit">${icon('edit', 16)}보유 고치기</button>` : `<button class="btn" data-st="add">${icon('plus', 16)}관심 종목에</button>`}
          <button class="btn" data-st="calc">${icon('calc', 16)}매매 계획</button>
          <button class="btn" data-st="note">${icon('calendar', 16)}노트</button>
        </div>
      </header>
      ${s.err.code ? errBox(s.err.code) : ''}
      <div class="st-grid">
        <section class="sc-card st-chart">
          <div class="st-ch-head"><h3>가격 흐름</h3>
            <div class="sc-seg" id="stRange">${[[20, '1개월'], [60, '3개월'], [120, '6개월'], [250, '1년']].map(([n, t]) => `<button type="button" data-n="${n}" class="${rng === n ? 'on' : ''}">${t}</button>`).join('')}</div></div>
          ${shown ? `<p class="sc-tip" data-def="${esc(`${shown[0].t} → ${shown[shown.length - 1].t} · 이 기간 ${pct(per(1))} · 굵은 선 종가, 옅은 선 20일 · 점선 60일 이동평균`)}">${esc(`${shown[0].t} → ${shown[shown.length - 1].t} · 이 기간 ${pct(per(1))} · 굵은 선 종가, 옅은 선 20일 · 점선 60일 이동평균`)}</p>${chartSvg(shown, mine, chartW, chartW < 480 ? 210 : 260)}`
            : s.err.bars ? errBox(s.err.bars) : dataFor('history') ? loading('일봉') : apiNeed('datagokr', '일봉 API 가 없습니다 (공공데이터포털 주식시세 · KIS)')}
        </section>
        <section class="sc-card">
          <h3>지금 상태 <small>일봉으로 이 앱이 직접 계산</small></h3>
          ${A ? `<div class="st-meter"><span>RSI 14</span><div class="bar"><i style="left:${Math.max(0, Math.min(100, rsi || 0))}%"></i><em style="left:30%"></em><em style="left:70%"></em></div><b>${num(rsi, 0)} · ${rsiTxt}</b></div>
            ${kv([['추세', esc(A.trend)], ['5일', pct(A.returnPct.d5), cls(A.returnPct.d5)], ['20일', pct(A.returnPct.d20), cls(A.returnPct.d20)], ['60일', pct(A.returnPct.d60), cls(A.returnPct.d60)], ['1년', pct(A.returnPct.d250), cls(A.returnPct.d250)],
              ['20 · 50일 평균', `${num(A.sma.d20, 0)} · ${num(A.sma.d50, 0)}`], ['고점 대비', pct(A.fromHighPct), cls(A.fromHighPct)], ['최대 낙폭', pct(A.maxDrawdownPct), 'down'], ['하루 평균 변동(ATR)', A.atrPct != null ? num(A.atrPct, 2) + '%' : null], ['연 변동성', A.volatility20dAnnualPct != null ? num(A.volatility20dAnnualPct, 1) + '%' : null]])}`
            : s.err.bars ? errBox(s.err.bars) : dataFor('history') ? loading('지표') : apiNeed('datagokr', '일봉 API 가 있어야 계산합니다')}
        </section>
        <section class="sc-card">
          <h3>시세 상세</h3>
          ${q ? kv([['시가', num(q.open)], ['고가', num(q.high)], ['저가', num(q.low)], ['전일 종가', num(q.prevClose)], ['거래량', q.volume ? num(q.volume, 0) : null], ['52주 최고', q.week52 ? num(q.week52.high) : A ? num(A.rangeHigh) : null], ['52주 최저', q.week52 ? num(q.week52.low) : A ? num(A.rangeLow) : null],
              ['PER', q.per ? num(q.per, 2) : null], ['PBR', q.pbr ? num(q.pbr, 2) : null], ['시가총액', q.marketCapEok ? num(q.marketCapEok, 0) + '억' : q.marketCap ? num(q.marketCap / 1e8, 0) + '억' : null]])
            : s.err.quote ? errBox(s.err.quote) : dataFor('quote') ? loading('시세') : apiNeed('datagokr', '시세 API 가 없습니다')}
        </section>
        <section class="sc-card">
          <h3>예탁결제원 기록 <small>공식 등록 정보</small></h3>
          ${!dataFor('ksd') ? apiNeed('ksd', '한국예탁결제원 주식정보를 연결하면 표준코드 · 상장일 · 배당이 보입니다')
            : !/^\d[0-9A-Z]{5}$/.test(s.code || '') ? '<p class="sc-mute">한국 종목에서만 볼 수 있습니다.</p>'
            : s.err.ksd ? errBox(s.err.ksd) : !s.ksd ? loading('예탁결제원') : kv([['표준코드', esc(k.isin)], ['주식 종류', esc(k.secnKacdNm)], ['발행일', d8(k.issuDt)], ['상장일', l ? d8(l.apliDt) : null], ['상장폐지일', l && l.dlistDt ? d8(l.dlistDt) : null], ['전자증권', k.eltscYn === 'Y' ? '예' : k.eltscYn === 'N' ? '아니오' : null]])}
          ${dataFor('ksd') && /^\d[0-9A-Z]{5}$/.test(s.code || '') ? `<h4>${s.div ? s.div.year + '년 배당' : '배당'}</h4>${s.err.div ? errBox(s.err.div) : !s.div ? loading('배당') : dv ? kv([['주당 배당금', num(dv[3], 0) + '원'], ['시가배당률', num(dv[4], 2) + '%'], ['배당 순위', `${num(dv[0], 0)}위 / ${num(s.div.total, 0)}`], ['시장', esc(dv[2])]]) : '<p class="sc-mute">이 해 배당 기록이 없습니다 (무배당이거나 ETF 등).</p>'}` : ''}
        </section>
        ${mine ? (() => { const qty = +mine.qty || 0, avg = +mine.avg || 0, pl = price && qty && avg ? (price - avg) * qty : null, plp = price && avg ? (price / avg - 1) * 100 : null, toStop = price && mine.stop ? (mine.stop / price - 1) * 100 : null, toT = price && mine.target ? (mine.target / price - 1) * 100 : null;
          return `<section class="sc-card"><h3>내 보유 · 계획</h3>${kv([['수량', qty ? num(qty, 4) : '관심만'], ['평균 단가', avg ? num(avg) : null], ['평가 손익', pl != null ? num(pl, 0) : null, cls(pl)], ['수익률', plp != null ? pct(plp) : null, cls(plp)], ['손절가까지', toStop != null ? `${num(+mine.stop)} (${pct(toStop, 1)})` : '정하지 않음'], ['목표가까지', toT != null ? `${num(+mine.target)} (${pct(toT, 1)})` : null]])}${mine.memo ? `<p class="st-memo">${esc(mine.memo)}</p>` : ''}${!mine.stop ? '<p class="sc-mute">손절가가 없습니다. 들어가기 전에 "어디서 틀렸다고 인정할지"를 정해 두세요.</p>' : ''}</section>`; })() : ''}
      </div>
      <p class="sc-fine">숫자는 연결한 API 에서 그대로 가져오고, 지표는 이 앱이 일봉으로 계산합니다. 투자 판단과 책임은 본인에게 있습니다.</p>`;
    fillIcons(box); wireGoApi(box);
    if (shown) wireChart(box.querySelector('.st-chart'), shown);
    const rg = $('stRange'); if (rg) rg.querySelectorAll('button').forEach(x => x.onclick = () => { stockPref.range = +x.dataset.n; LS.set(K_STOCK, stockPref); renderStock(); });
    box.querySelectorAll('[data-st]').forEach(x => x.onclick = () => stockAct(x.dataset.st));
  }
  let stW = 0, stWt = 0; addEventListener('resize', () => { clearTimeout(stWt); stWt = setTimeout(() => { const b = $('stBody'); if (b && !$('vStock').hidden && stock && Math.abs(b.clientWidth - stW) > 24) { stW = b.clientWidth; renderStock(); } }, 200); });
  function wireGoApi(box) { box.querySelectorAll('[data-goapi]').forEach(x => x.onclick = () => { show('apis'); if (x.dataset.goapi) setTimeout(() => openAdd(x.dataset.goapi), 60); }); }
  function stockAct(a) {
    const s = stock; if (!s) return; const label = s.name ? `${s.name}(${s.code})` : s.code;
    if (a === 'ai') { show('chat'); send(`${label} 종목을 분석해 줘. get_quote · get_price_history${dataFor('ksd') ? ' · get_ksd_stock_info' : ''} 로 숫자를 먼저 확인하고, get_portfolio 로 내 보유 여부와 손절 · 목표를 본 뒤, ① 한 줄 결론 ② 근거 3가지 ③ 반대 근거 · 위험 ④ 지금 할 일(진입 · 대기 · 정리 중 하나, 손절 · 목표 가격) ⑤ 다음에 확인할 일 순서로 짧게. 나의 원칙과 어긋나는 점이 있으면 먼저 짚어 줘.`); }
    if (a === 'add') editItem(null, { symbol: s.code, name: s.name || '' });
    if (a === 'edit') { const i = watch.items.findIndex(it => normSym(it.symbol) === s.code); if (i >= 0) editItem(i); }
    if (a === 'calc') { const p = s.quote ? s.quote.price : s.bars && s.bars.length ? s.bars[s.bars.length - 1].c : ''; show('calc'); $('cSym').value = s.code; if (p) $('cEntry').value = p; const A = s.bars && s.bars.length > 15 ? analyze(s.bars) : null; if (A && A.atr14 && p && !$('cStop').value) $('cStop').value = Math.round((p - 2 * A.atr14) * 100) / 100; renderCalc(); toast(A && A.atr14 ? '진입가는 현재가, 손절가는 ATR 2배 아래로 넣었습니다 — 고쳐 쓰세요' : '진입가를 현재가로 넣었습니다', 3200); }
    if (a === 'note') { show('notes'); setTimeout(() => { const t = document.querySelector('#vNotes textarea, #nText'); if (typeof editNote === 'function') editNote(null, null, `${s.name || s.code} `); else if (t) { t.value = `${s.name || s.code} `; t.focus(); } }, 60); }
  }
  $('stForm').onsubmit = e => { e.preventDefault(); openStock($('stQ').value); };

  /* =====================================================================
     시장 데이터 — 예탁결제원: 배당 상위 · 의무보호예수(풀릴 물량) · 신규 예탁지정 · 시장 규모
     ===================================================================== */
  let mkMart = 'all';
  const lastBizDays = n => { const out = []; const d = new Date(Date.now() + 9 * 36e5); while (out.length < n) { d.setUTCDate(d.getUTCDate() - 1); const w = d.getUTCDay(); if (w && w !== 6) out.push(d.toISOString().slice(0, 10).replace(/-/g, '')); } return out; };
  async function ksdLatest(op, base, ttl) { // 최근 영업일부터 거슬러 올라가며 자료가 있는 날
    const a = dataFor('ksd'), key = await keyOf(a);
    return ksdCached(op + ':' + JSON.stringify(base) + ':' + lastBizDays(1)[0], ttl, async () => {
      for (const d of lastBizDays(5)) { const r = await DATA.ksd.call(key, op, Object.assign({}, base, { stdDt: d })); if (r.items.length) return { d, items: r.items.map(pick) }; }
      return { d: '', items: [] };
    });
  }
  async function renderMarket() {
    const box = $('mkBody'); if (!box) return;
    if (!dataFor('ksd')) { box.innerHTML = `<div class="sc-empty-st"><h2>시장 데이터는 예탁결제원 주식정보로 봅니다</h2><p>배당 상위 종목 · 의무보호예수(곧 풀릴 수 있는 물량) · 새로 예탁 지정된 종목 · 시장 규모를 하루 한 번 받아 둡니다.</p>${apiNeed('ksd', '한국예탁결제원 주식정보(공공데이터포털)를 연결해 주세요')}</div>`; fillIcons(box); wireGoApi(box); return; }
    const y = new Date().getFullYear() - 1, ym = new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 7).replace('-', '');
    box.innerHTML = `<div class="mk-grid">
      <section class="sc-card mk-div"><div class="st-ch-head"><h3>${y}년 배당 상위 <small>시가배당률 · 누르면 종목 분석</small></h3><div class="sc-seg" id="mkMart">${[['all', '전체'], ['유가', '유가증권'], ['코스닥', '코스닥']].map(([v, t]) => `<button type="button" data-v="${v}" class="${mkMart === v ? 'on' : ''}">${t}</button>`).join('')}</div></div><div id="mkDiv"><div class="sc-skel">불러오는 중…</div></div></section>
      <section class="sc-card"><h3>의무보호예수 <small>최대주주 · 공모 등으로 묶인 물량 — 풀리면 매물 부담</small></h3><div id="mkLock"><div class="sc-skel">불러오는 중…</div></div></section>
      <section class="sc-card"><h3>시장 규모 <small>상장 회사 · 시가총액</small></h3><div id="mkSize"><div class="sc-skel">불러오는 중…</div></div></section>
      <section class="sc-card"><h3>이번 달 신규 예탁지정 <small>곧 거래될 수 있는 새 종목 후보</small></h3><div id="mkNew"><div class="sc-skel">불러오는 중…</div></div></section>
    </div><p class="sc-fine">한국예탁결제원 공공데이터를 하루 한 번 받아 이 기기에 둡니다 (개발 계정은 하루 100회 제한). 출처: 한국예탁결제원 · 공공데이터포털.</p>`;
    fillIcons(box);
    const fail = (id, e) => { $(id).innerHTML = `<div class="sc-err">${icon('alert', 15)}<span>${esc(e.message || e)}</span></div>${rawBox(e, e && e.raw)}`; };
    const MK = { 11: '유가증권', 12: '코스닥', 13: 'K-OTC', 14: '코넥스', 50: '기타' };
    ksdDividends(y).then(d => {
      const rows = Object.entries(d.m).map(([code, r]) => ({ code, rank: r[0], name: r[1], mart: r[2], amt: r[3], rate: r[4], kind: r[5] }))
        .filter(r => r.rate > 0 && (mkMart === 'all' || (r.mart || '').includes(mkMart))).sort((a, b) => b.rate - a.rate).slice(0, 20);
      $('mkDiv').innerHTML = rows.length ? `<div class="sc-tablewrap"><table class="sc-table mk-t"><thead><tr><th>#</th><th>종목</th><th>시가배당률</th><th>주당 배당금</th></tr></thead><tbody>${rows.map((r, i) => `<tr data-open="${esc(r.code)}"><td>${i + 1}</td><td class="sym"><b>${esc(r.name)}</b><span>${esc(r.code)} · ${esc(r.mart)}${/우/.test(r.kind) ? ' · 우선주' : ''}</span></td><td class="up">${num(r.rate, 2)}%</td><td>${num(r.amt, 0)}원</td></tr>`).join('')}</tbody></table></div><p class="sc-mute">배당률이 지나치게 높으면 주가가 크게 떨어진 탓일 수 있습니다. 꾸준함은 종목 분석에서 함께 보세요.</p>` : '<p class="sc-mute">자료가 없습니다.</p>';
      $('mkDiv').querySelectorAll('[data-open]').forEach(tr => tr.onclick = () => { $('stQ').value = tr.dataset.open; openStock(tr.dataset.open); });
      $('mkMart').querySelectorAll('button').forEach(b => b.onclick = () => { mkMart = b.dataset.v; renderMarket(); });
    }).catch(e => fail('mkDiv', e));
    Promise.all([11, 12].map(t => ksdLatest('getSafeDpDutyDepoStatusN1', { listTpcd: String(t) }, 24).then(r => [t, r]))).then(rs => {
      $('mkLock').innerHTML = rs.map(([t, r]) => {
        const val = x => { const q = numOf(x.stkDepoQty || fld(x, /depo.*qty|qty.*depo/i)), iss = numOf(x.issuStkqty || fld(x, /issu.*qty/i)); let ratio = numOf(x.safedpRatioValue || fld(x, /ratio|rate|rt$/i)); if (!isFinite(ratio) && q > 0 && iss > 0) ratio = q / iss * 100; return { q, iss, ratio, co: numOf(x.cocnt || fld(x, /cocnt|cnt/i)) }; };
        const kind = x => x.issuStkKindTpnm || fld(x, /kind.*nm|tpnm/i);
        const rows = r.items.map(x => ({ x, v: val(x) })).filter(o => isFinite(o.v.ratio) || isFinite(o.v.q));
        const pickRow = rows.find(o => /합계|전체|^계$/.test(kind(o.x))) || rows.find(o => /보통/.test(kind(o.x))) || rows[0];
        if (!pickRow) return `<p class="sc-mute">${MK[t]}: 숫자를 읽지 못했습니다</p>${rawBox(null, r.items[0])}`;
        const it = pickRow.x, v = pickRow.v;
        return `<div class="mk-lock"><b>${MK[t]}</b><span class="big">${isFinite(v.ratio) ? num(v.ratio, 2) + '%' : '–'}</span><div class="bar"><i style="width:${isFinite(v.ratio) ? Math.min(100, v.ratio * 5) : 0}%"></i></div><small>${isFinite(v.q) ? num(v.q / 1e6, 1) + '백만 주' : ''}${isFinite(v.co) ? ` · ${num(v.co, 0)}개 회사` : ''}${kind(it) ? ` · ${esc(kind(it))}` : ''} · 기준 ${esc(r.d.slice(0, 4) + '.' + r.d.slice(4, 6) + '.' + r.d.slice(6))}</small></div>`; }).join('')
        + '<p class="sc-mute">비율이 오르면 묶인 물량이 늘어난 것, 크게 줄면 그만큼 풀린 것입니다. 개별 종목의 해제일은 공시(DART)에서 확인하세요.</p>';
    }).catch(e => fail('mkLock', e));
    ksdLatest('getListStatN1', {}, 24).then(r => {
      const rows = r.items.filter(x => MK[x.caltotMartTpcd] && +x.martpTotamt);
      $('mkSize').innerHTML = rows.length ? `<div class="sc-tablewrap"><table class="sc-table"><thead><tr><th>시장</th><th>회사</th><th>종목</th><th>시가총액</th></tr></thead><tbody>${rows.map(x => `<tr><td>${MK[x.caltotMartTpcd]}</td><td>${num(+x.cocnt, 0)}</td><td>${num(+x.secncnt, 0)}</td><td>${num(+x.martpTotamt / 1e12, 1)}조</td></tr>`).join('')}</tbody></table></div><p class="sc-mute">기준 ${esc(r.d.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3'))}</p>` : '<p class="sc-mute">자료가 없습니다.</p>';
    }).catch(e => fail('mkSize', e));
    ksdCached('new:' + ym, 12, async () => (await DATA.ksd.call(await keyOf(dataFor('ksd')), 'getNewDepoSecnListN1', { yyyymm: ym, searchType: '1' })).items.map(pick)).then(items => {
      $('mkNew').innerHTML = items.length ? `<ul class="mk-new">${items.slice(0, 15).map(x => `<li><b>${esc(x.korSecnNm || '')}</b><span>${esc(x.indtpNm || '')} · ${esc(x.secnKacdNm || '')} · ${esc((x.apliDt || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3'))}</span></li>`).join('')}</ul>` : '<p class="sc-mute">이번 달은 아직 없습니다.</p>';
    }).catch(e => fail('mkNew', e));
  }
  $('mkAsk').onclick = () => { show('chat'); send('query_ksd 로 의무보호예수 현황(getSafeDpDutyDepoStatusN1, 유가증권 11 · 코스닥 12, 최근 영업일)과 올해 신규 예탁지정 종목을 확인하고, 지금 시장 수급에 주는 의미와 내 관심 종목(get_portfolio)에 영향이 있는지 짧게 정리해 줘.'); };
  $('mkReload').onclick = () => { for (const k of Object.keys(ksdCache)) if (!/^div:|^stk:|^nm:/.test(k)) delete ksdCache[k]; LS.set(K_KSDC, ksdCache); renderMarket(); };

  const VIEWS = { chat: 'vChat', stock: 'vStock', market: 'vMarket', history: 'vHistory', sum: 'vSum', brief: 'vBrief', strat: 'vStrat', notes: 'vNotes', me: 'vMe', watch: 'vWatch', journal: 'vJournal', calc: 'vCalc', refs: 'vRefs', apis: 'vApis' };
  function show(v) {
    for (const [k, id] of Object.entries(VIEWS)) $(id).hidden = k !== v;
    document.querySelectorAll('.rail [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    if (v === 'watch') renderWatch(); if (v === 'history') renderHistory(); if (v === 'journal') renderJournal(); if (v === 'notes') renderNotes(); if (v === 'sum') renderSum(); if (v === 'brief') renderBrief(); if (v === 'strat') renderStrat(); if (v === 'me') renderMe(); if (v === 'calc') renderCalc(); if (v === 'refs') renderRefs(); if (v === 'apis') { renderApis(); renderSyncBox(); } if (v === 'chat') renderChat(); if (v === 'stock') renderStock(); if (v === 'market') renderMarket();
    try { history.replaceState(null, '', v === 'chat' ? 'secret.html' : 'secret.html#' + v); } catch (e) { }
  }
  document.querySelectorAll('.rail [data-view]').forEach(b => b.onclick = () => show(b.dataset.view));

  fillIcons(document);
  $('cWatch').textContent = watch.items.length || ''; $('cApi').textContent = cfg.apis.length || ''; $('cJournal').textContent = journal.length || ''; $('cNotes').textContent = notes.length || '';
  setAuto();
  show(VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'chat');
  paintSync(); renderBanner();
  (async () => {
    try { chats = (await IDB.all()) || []; } catch (e) { chats = []; }
    const old = LS.get(K_CHATS, null); // 예전처럼 localStorage 에 있던 대화를 옮김
    if (Array.isArray(old) && old.length) { for (const c of old) if (c && c.id && !chats.some(x => x.id === c.id)) { chats.push(c); await IDB.put(c); } try { localStorage.removeItem(K_CHATS); } catch (e) { } }
    chats.forEach(c => { savedAt[c.id] = c.updated; }); chats.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    if (!cur) { let id = null; try { id = localStorage.getItem(K_CUR); } catch (e) { } const c = id && chats.find(x => x.id === id); if (c) cur = c; } // 다시 열면 보던 대화 그대로
    renderChatList(); const v = Object.keys(VIEWS).find(k => !$(VIEWS[k]).hidden); if (v === 'chat' || v === 'history') show(v);
    if (sy.on) {
      syncNow();
      setInterval(() => { if (document.visibilityState === 'visible') syncNow(); }, 60000);
    }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && sy.on) syncNow(); });
    addEventListener('online', () => { if (sy.on) syncNow(); });
  })();
  addEventListener('hashchange', () => { const v = location.hash.slice(1); if (VIEWS[v]) show(v); });
})();
