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
    home: '<path d="M4 11.2 12 4.5l8 6.7"/><path d="M6.5 9.5V19.5h11V9.5"/><path d="M10 19.5v-5h4v5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.2-8.2"/><path d="m16 7 3 3"/><path d="m13.5 9.5 2 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.4-3.4 4.3-5 7.5-5s6.1 1.6 7.5 5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    pie: '<path d="M12 3v9h9"/><path d="M20.4 15.5A9 9 0 1 1 8.5 3.7"/>',
    gauge: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/><path d="M12 16h.01"/>',
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
    etf: { kind: 'data', name: '공공데이터포털 ETF 시세 (금융위원회)', caps: ['quote', 'history'], keyUrl: 'https://www.data.go.kr/data/15094806/openapi.do', note: 'ETF 의 하루 단위 시세 · 일봉 · 순자산가치(NAV) · 기초지수. 금융위원회 주식시세와 같은 공공데이터포털 키를 그대로 넣으세요 (공공데이터포털에서 「금융위원회_증권상품시세정보」 활용신청 필요).' },
    index: { kind: 'data', name: '공공데이터포털 지수 시세 (금융위원회)', caps: ['index'], keyUrl: 'https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword=%EA%B8%88%EC%9C%B5%EC%9C%84%EC%9B%90%ED%9A%8C_%EC%A7%80%EC%88%98%EC%8B%9C%EC%84%B8%EC%A0%95%EB%B3%B4', note: '코스피 · 코스닥 · 코스피 200 의 하루 단위 지수 (종가 · 등락 · 5일 · 20일 흐름). 같은 공공데이터포털 키를 그대로 넣으세요 (「금융위원회_지수시세정보」 활용신청 필요).' },
    ecos: { kind: 'data', name: '한국은행 ECOS (금리 · 환율)', caps: ['macro'], keyUrl: 'https://ecos.bok.or.kr/api/', note: '기준금리 · 국고채 3년/10년 · 원/달러 환율을 AI 와 시장 데이터 화면에 넣습니다. 한국은행이 브라우저에서 바로 부르는 것을 막아 두어, 만들어 둔 Cloudflare 중계를 거칩니다 (중계 코드를 최신으로 다시 붙여 넣어야 함).' },
    naver: { kind: 'data', name: '네이버 뉴스 검색', caps: ['newsKR'], keyUrl: 'https://console.ncloud.com/', note: '아침 브리핑 이후 나온 종목별 최신 국내 뉴스. 2026년 7월 31일부터 네이버 검색 API 새 키는 네이버 클라우드의 NAVER API HUB 에서 받습니다 (예전 개발자센터 키도 그대로 됨). [네이버 키 받는 법] 을 보세요. Cloudflare 중계를 거칩니다.' },
    fred: { kind: 'data', name: 'FRED (미국 경제지표)', caps: ['usmacro'], keyUrl: 'https://fredaccount.stlouisfed.org/apikeys', note: '미국 연준 자료: 10년 · 2년 국채 금리 · 연방기금 금리 · 소비자물가(CPI) · 실업률 · 원/달러. 무료 가입 후 API 키를 넣으세요. Cloudflare 중계를 거칩니다.' },
    dart: { kind: 'data', name: 'OpenDART (금융감독원 공시)', caps: ['dart'], keyUrl: 'https://opendart.fss.or.kr/', note: '공시 목록 · 주요 재무(매출 · 영업이익 · 순이익 · 자산 · 부채 · 자본) · 회사 개요. 금융감독원이 브라우저에서 바로 부르는 것을 막아 두어, 만들어 둔 Cloudflare 중계를 거칩니다 (중계 코드를 최신으로 다시 붙여 넣어야 함). 처음 한 번 회사 고유번호 표를 받아 이 기기에 30일 둡니다.' },
    ksd: { kind: 'data', name: '한국예탁결제원 주식정보 (공공데이터포털)', caps: ['ksd'], keyUrl: 'https://www.data.go.kr/data/15157413/openapi.do', note: '시세가 아니라 종목의 "속사정"을 봅니다: 표준코드 · 발행일 · 상장일/상장폐지 · 배당 순위(시가배당률 · 주당배당금) · 의무보호예수(풀릴 물량) · 신규 예탁 지정 · 시장별 발행주식수. 공공데이터포털 일반 인증키를 그대로 붙여 넣으세요 (금융위원회 시세와 같은 키).' },
    kisrelay: { kind: 'data', name: 'Cloudflare 중계 (KIS 시세 선택)', caps: ['quote', 'history'], note: '내 Cloudflare 무료 중계. OpenDART · 네이버 뉴스 · 한국은행 ECOS · FRED 는 브라우저에서 바로 부를 수 없어 이 중계를 거칩니다. 한국투자증권 앱키를 중계에 넣었으면 「KIS 실시간 시세도 쓰기」를 켜서 실시간 현재가 · PER · PBR 도 받습니다 (주문 기능 없음). 아래 [중계 만드는 법] 대로 한 번 만든 뒤, 주소 칸에 중계 주소, API 키 칸에 중계 암호를 넣으세요.' },
    tencent: { kind: 'data', name: '텐센트 증권 (중국 · 홍콩 시세)', caps: ['quote', 'history'], nokey: true, note: '중국 상하이 · 선전 A주와 홍콩 주식의 현재가 · 일봉 · PER · 52주 고저 · 시가총액. 키가 필요 없습니다 — [추가] 만 누르면 됩니다. 종목은 sh600519(상하이) · sz000001(선전) · hk00700(홍콩), 또는 600519.SS · 0700.HK 처럼 씁니다. 텐센트의 공개 시세 주소를 쓰는 것이라(공식 API 아님) 바뀌거나 막힐 수 있어 개인 참고용입니다.' },
    custom: { kind: 'data', name: '사용자 정의 (REST)', caps: ['custom'], note: '주소에 {symbol} 과 {key} 를 넣으면 그 자리에 종목과 키가 들어갑니다. 받은 내용을 AI 가 읽습니다.' },
  };
  const isAI = a => TYPES[a.type] && TYPES[a.type].kind === 'ai';
  const aiApis = () => cfg.apis.filter(a => isAI(a) && a.on !== false);
  const dataApis = () => cfg.apis.filter(a => !isAI(a) && a.on !== false);
  const activeAI = () => aiApis().find(a => a.id === cfg.ai) || aiApis()[0] || null;
  /* 중계 카드: kis === false 면 KIS 시세는 보류하고 DART · 네이버 · ECOS · FRED 통로로만 */
  const kisOn = a => a.type === 'kisrelay' && a.kis !== false;
  const noKey = a => !!a && (a.type === 'custom' || !!(TYPES[a.type] || {}).nokey); // 키 없이 쓰는 종류
  const capsOf = a => a.type === 'kisrelay' && a.kis === false ? [] : (TYPES[a.type].caps || []);
  const relayApi = () => dataApis().find(a => a.type === 'kisrelay');
  const realtimeOn = () => dataApis().some(kisOn);
  const needRelay = who => new Error(`${who} 는 Cloudflare 중계를 거칩니다 — API 연결에서 [Cloudflare 중계] 를 먼저 만들어 주세요 (KIS 는 꺼 둬도 됩니다)`);
  /* 예전(KIS 만 하던) 중계 코드는 x-api-key 를 허락하지 않아 브라우저가 요청을 막음 → 주소 문제와 구별해서 알림 */
  const OLD_RELAY = '중계 코드가 예전 것입니다 — 중계 카드 연필 → [중계 만드는 법] → [중계 코드 복사] 로 최신 코드를 Cloudflare 에 붙여 넣고 Deploy 하세요 (비밀 값은 그대로 두면 됨)';
  /* 오류 문구에서 키 가리기 (예전 중계는 DART 주소를 키째 돌려줌) · 예전 중계의 DART 이동 문제는 코드 바꾸기로 안내 */
  const scrub = s => String(s || '').replace(/(crtfc_key|api_key|apikey|servicekey)=[^&\s"']+/gi, '$1=…').replace(/(StatisticSearch\/)[^/\s]+/g, '$1…');
  const dartWhy = s => /too many redirects/i.test(s) ? 'DART 가 중계 요청을 계속 다른 주소로 보냅니다 — 중계 카드 연필 → [중계 만드는 법] → [중계 코드 복사] 로 최신 코드를 Cloudflare 에 붙여 넣고 Deploy 하세요 (이 문제를 고친 코드)' : scrub(s);
  async function relayDown(base, rk) {
    try { await fetch(base + '/ping', { headers: { 'x-relay-key': String(rk || '').trim() } }); }
    catch (e) { return new Error('중계에 연결하지 못했습니다 — 중계 주소를 확인하세요'); }
    return new Error(OLD_RELAY); // 암호만 보내면 닿는데 API 키를 함께 보내면 막힘
  }
  async function relayFresh(base, rk) {
    try { await fetch(base + '/ping', { headers: { 'x-relay-key': String(rk || '').trim(), 'x-api-key': '-' } }); return true; } catch (e) { return false; }
  }
  const dataFor = cap => dataApis().find(a => capsOf(a).includes(cap));
  cfg.apis.forEach(a => { if (a.type === 'kisrelay' && a.name === '한국투자증권 KIS (실시간 중계)') a.name = TYPES.kisrelay.name; }); // 예전 이름

  /* ---------- 키 잠금 (선택) ---------- */
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = u8 => btoa(String.fromCharCode(...new Uint8Array(u8)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  let lockKey = null, keyMem = null; // 풀어 둔 동안만 메모리에
  async function derive(pass, salt) {
    const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  }
  async function sealKeys() {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, lockKey, enc.encode(JSON.stringify(keyMem)));
    const was = LS.get(K_REMEMBER, null);
    cfg.lock.iv = b64(iv); cfg.lock.data = b64(data); cfg.lock.ids = Object.keys(keyMem).filter(id => keyMem[id]); saveCfg();
    if (was && was.exp > Date.now()) LS.set(K_REMEMBER, Object.assign({}, was, { data: cfg.lock.data, keys: keyMem }));
  }
  /* 이 기기에서 기억 (1년): 키와 잠금 열쇠를 이 기기의 저장소에만 두어 암호를 다시 묻지 않음 (동기화 · GitHub 에는 올리지 않음).
     SECRET 은 관리자 한 사람만 쓰는 화면이라, 편하게 쓰는 쪽을 기본으로 함 */
  const K_REMEMBER = 'sec:keyRemember', REMEMBER_DAYS = 365;
  function remembered(full) {
    const r = LS.get(K_REMEMBER, null);
    if (!r || !cfg.lock || r.data !== cfg.lock.data || !(r.exp > Date.now())) return null;
    return full ? r : (r.keys || null);
  }
  async function remember(on) {
    if (on && cfg.lock && keyMem) {
      let raw = ''; try { if (lockKey) raw = b64(await crypto.subtle.exportKey('raw', lockKey)); } catch (e) { }
      const was = LS.get(K_REMEMBER, null);
      LS.set(K_REMEMBER, { exp: Date.now() + REMEMBER_DAYS * 864e5, data: cfg.lock.data, keys: keyMem, raw: raw || (was && was.data === cfg.lock.data ? was.raw || '' : '') });
    } else if (!on) { try { localStorage.removeItem(K_REMEMBER); } catch (e) { } }
  }
  async function keyFromMemory() { // 기억해 둔 잠금 열쇠 꺼내기
    const r = remembered(true); if (!r || !r.raw) return false;
    try { lockKey = await crypto.subtle.importKey('raw', unb64(r.raw), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']); return true; } catch (e) { return false; }
  }
  const fillIds = () => { if (cfg.lock && keyMem && !cfg.lock.ids) { cfg.lock.ids = Object.keys(keyMem).filter(id => keyMem[id]); saveCfg(); } }; // 예전 잠금에도 키 목록을
  { const r0 = remembered(); if (r0) { keyMem = Object.assign({}, r0); keyFromMemory(); setTimeout(fillIds, 0); } } // 이 기기에서 기억 중이면 처음부터 풀린 채로
  let unlocking = null; // 여러 시세를 한꺼번에 불러도 암호 창은 하나만
  function unlock(force) {
    if (!cfg.lock || (keyMem && (!force || lockKey))) return Promise.resolve(true);
    if (!force) { const r = remembered(); if (r) { keyMem = Object.assign({}, r); return Promise.resolve(true); } }
    if (unlocking) return unlocking;
    unlocking = (async () => {
      if (await keyFromMemory()) { const r = remembered(); if (r) keyMem = Object.assign({}, r); if (keyMem) return true; } // 기억해 둔 열쇠로 — 암호 없이
      const pass = await askPass('API 키 잠금 풀기', keyMem ? '이번 한 번만 넣어 주세요. 이 기기에 1년 동안 기억해서 다시 묻지 않습니다.' : '잠금 암호를 넣어 주세요. 이 기기에 1년 동안 기억해서 다시 묻지 않습니다.', false, true);
      if (pass == null) return false;
      try {
        const k = await derive(pass, unb64(cfg.lock.salt));
        const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(cfg.lock.iv) }, k, unb64(cfg.lock.data));
        lockKey = k; keyMem = JSON.parse(dec.decode(raw)); fillIds(); await remember(askPass.remember); renderApis(); return true;
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
    if (!cfg.lock) { api.key = key; markKey(api.id); return; }
    if (!(await unlock(true))) throw new Error('API 키 잠금을 풀어야 저장할 수 있습니다'); // 잠그려면 열쇠가 있어야 해서 이때는 암호를 물음
    keyMem[api.id] = key; api.key = ''; await sealKeys(); markKey(api.id);
  }
  const markKey = id => { sy.keyT[id] = Date.now(); saveSy(); SYNCQ.mark('keys'); }; // 다른 기기로 옮길 때 더 최근 것이 이기도록

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
      const d = dialog(`<h3>${esc(title)}</h3><p class="modal-desc">${esc(desc)}</p><form class="sc-form"><label>암호<input type="password" id="pw1" autocomplete="new-password" required minlength="4"></label>${twice ? '<label>한 번 더<input type="password" id="pw2" autocomplete="new-password" required></label>' : ''}${rememberBox ? `<label class="sc-check"><input type="checkbox" id="pwKeep" checked><span>이 기기에서 다시 묻지 않기 (1년)</span></label>` : ''}<div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">확인</button></div></form>`, 'ask');
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
      async _get(k, s, days, urls) {
        const k0 = String(k || '').replace(/\s+/g, ''); // 붙여 넣을 때 딸려 온 빈칸 · 줄바꿈 제거
        const key = /%[0-9A-F]{2}/i.test(k0) ? decodeURIComponent(k0) : k0; // Encoding 키를 넣어도 두 번 바뀌지 않게
        const q = String(s).trim().replace(/\.(KS|KQ|KRX)$/i, '').replace(/:KRX$/i, '');
        const code = ((q.match(/^A?(\d[0-9A-Z]{5})$/i) || [])[1] || '').toUpperCase();
        const ymd8 = d => d.toISOString().slice(0, 10).replace(/-/g, '');
        const from = new Date(Date.now() - Math.ceil(days * 1.5 + 10) * 864e5);
        const qs = '?resultType=json&pageNo=1'
          + `&numOfRows=${Math.min(Math.ceil(days * 1.5) + 20, 1000)}&beginBasDt=${ymd8(from)}&serviceKey=${E(key)}`
          + (code ? `&likeSrtnCd=${code}` : `&itmsNm=${E(q)}`);
        /* 새 주소(V2)를 먼저, 키가 옛 주소에만 등록돼 있으면 옛 주소로 */
        const URLS = urls || ['https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2', 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo'];
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
      /* 긴 기간: beginBasDt 부터 1000개씩 (최대 6번 ≈ 24년) */
      async range(k, s, years) {
        const k0 = String(k || '').replace(/\s+/g, ''), key = /%[0-9A-F]{2}/i.test(k0) ? decodeURIComponent(k0) : k0;
        const code = String(s).replace(/\.(KS|KQ)$/i, ''), begin = new Date(Date.now() - years * 365.25 * 864e5).toISOString().slice(0, 10).replace(/-/g, '');
        const n = v => +String(v).replace(/,/g, ''), all = [];
        for (let pg = 1; pg <= 6; pg++) {
          const u = `https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2?resultType=json&numOfRows=1000&pageNo=${pg}&beginBasDt=${begin}&likeSrtnCd=${code}&serviceKey=${E(key)}`;
          let r; try { r = await fetch(u); } catch (e) { throw new Error('공공데이터포털에 연결하지 못했습니다 (네트워크)'); }
          const j = await r.json().catch(() => null), body = j && j.response && j.response.body;
          if (!body) { if (pg === 1) throw new Error('공공데이터포털: 긴 기간 자료를 받지 못했습니다'); break; }
          let it = body.items && body.items.item; it = Array.isArray(it) ? it : it ? [it] : [];
          all.push(...it.filter(x => x.srtnCd === code));
          if (it.length < 1000 || all.length >= (+body.totalCount || 0)) break;
        }
        const seen = new Set();
        return all.filter(x => !seen.has(x.basDt) && seen.add(x.basDt)).sort((a, b) => a.basDt.localeCompare(b.basDt))
          .map(x => ({ t: `${x.basDt.slice(0, 4)}-${x.basDt.slice(4, 6)}-${x.basDt.slice(6)}`, o: n(x.mkp), h: n(x.hipr), l: n(x.lopr), c: n(x.clpr), v: n(x.trqu) })).filter(b => b.c);
      },
      async history(k, s, days) {
        const n = v => +String(v).replace(/,/g, '');
        return (await this._get(k, s, days)).map(x => ({ t: `${x.basDt.slice(0, 4)}-${x.basDt.slice(4, 6)}-${x.basDt.slice(6)}`, o: n(x.mkp), h: n(x.hipr), l: n(x.lopr), c: n(x.clpr), v: n(x.trqu) })).slice(-days);
      },
    },
    /* 공공데이터포털 · 금융위원회_증권상품시세정보 (ETF) — 주식시세와 같은 모양 · 같은 키 */
    etf: {
      URLS: ['https://apis.data.go.kr/1160100/GetSecuritiesProductInfoService_V2/getETFPriceInfo_V2', 'https://apis.data.go.kr/1160100/service/GetSecuritiesProductInfoService/getETFPriceInfo'],
      async quote(k, s) {
        const a = await DATA.datagokr._get(k, s, 7, this.URLS), x = a[a.length - 1], n = v => (v === '' || v == null ? null : +String(v).replace(/,/g, ''));
        const d = `${x.basDt.slice(0, 4)}-${x.basDt.slice(4, 6)}-${x.basDt.slice(6)}`;
        return { symbol: x.srtnCd, name: x.itmsNm, exchange: 'ETF', currency: 'KRW', price: n(x.clpr), change: n(x.vs), changePct: n(x.fltRt), open: n(x.mkp), high: n(x.hipr), low: n(x.lopr), prevClose: n(x.clpr) - n(x.vs), volume: n(x.trqu),
          nav: n(x.nav), navGapPct: n(x.nav) ? (n(x.clpr) / n(x.nav) - 1) * 100 : null, netAssets: n(x.nPptTotAmt), marketCap: n(x.mrktTotAmt), index: x.bssIdxIdxNm || undefined, indexClose: n(x.bssIdxClpr), time: d, source: `공공데이터포털 ETF (${d} 종가 · 실시간 아님)` };
      },
      async history(k, s, days) {
        const n = v => +String(v).replace(/,/g, '');
        return (await DATA.datagokr._get(k, s, days, this.URLS)).map(x => ({ t: `${x.basDt.slice(0, 4)}-${x.basDt.slice(4, 6)}-${x.basDt.slice(6)}`, o: n(x.mkp), h: n(x.hipr), l: n(x.lopr), c: n(x.clpr), v: n(x.trqu) })).slice(-days);
      },
    },
    /* 공공데이터포털 · 금융위원회_지수시세정보 — 코스피 · 코스닥 · 코스피 200 */
    index: {
      URLS: ['https://apis.data.go.kr/1160100/GetMarketIndexInfoService_V2/getStockMarketIndex_V2', 'https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex'],
      async _one(key, name) {
        const begin = new Date(Date.now() - 50 * 864e5).toISOString().slice(0, 10).replace(/-/g, '');
        let bad = null;
        for (const u of this.URLS) {
          for (const p of ['idxNm', 'likeIdxNm']) {
            let r; try { r = await fetch(`${u}?resultType=json&pageNo=1&numOfRows=60&beginBasDt=${begin}&${p}=${E(name)}&serviceKey=${E(key)}`); } catch (e) { throw new Error('공공데이터포털에 연결하지 못했습니다 (네트워크)'); }
            const j = await r.json().catch(() => null), h = j && j.OpenAPI_ServiceResponse && j.OpenAPI_ServiceResponse.cmmMsgHeader;
            if (h) { bad = bad || h; break; }
            let it = j && j.response && j.response.body && j.response.body.items && j.response.body.items.item; it = Array.isArray(it) ? it : it ? [it] : [];
            it = it.filter(x => x.idxNm === name || p === 'likeIdxNm').sort((a, b) => a.basDt.localeCompare(b.basDt));
            if (it.length) {
              const n = v => +String(v).replace(/,/g, ''), c = it.map(x => n(x.clpr)), last = it[it.length - 1], ret = k => c.length > k ? Math.round((c[c.length - 1] / c[c.length - 1 - k] - 1) * 10000) / 100 : null;
              return { name: last.idxNm, date: last.basDt, close: n(last.clpr), change: n(last.vs), changePct: n(last.fltRt), high: n(last.hipr), low: n(last.lopr), ret5d: ret(5), ret20d: ret(20), recent: it.slice(-10).map(x => [x.basDt, n(x.clpr)]) };
            }
          }
        }
        if (bad) throw new Error('공공데이터포털(지수): ' + (bad.returnAuthMsg || bad.errMsg) + (/NOT_REGISTERED/.test(bad.errMsg || '') ? ' — 「금융위원회_지수시세정보」 활용신청이 필요합니다' : ''));
        throw new Error(`${name}: 지수 자료가 없습니다`);
      },
      async get(k, names) {
        const k0 = String(k || '').replace(/\s+/g, ''), key = /%[0-9A-F]{2}/i.test(k0) ? decodeURIComponent(k0) : k0;
        const out = [], errs = [];
        for (const nm of names || ['코스피', '코스닥', '코스피 200']) { try { out.push(await this._one(key, nm)); } catch (e) { errs.push(e.message); } }
        if (!out.length) throw new Error(errs[0] || '지수 자료를 받지 못했습니다');
        return { source: '공공데이터포털 (금융위원회 지수시세 · 종가 기준)', indices: out, errors: errs.length ? errs : undefined };
      },
    },
    /* 네이버 뉴스 검색 — KIS 중계의 /naver */
    naver: {
      async search(k, q, n) {
        const j = await relayGet('/naver', { query: String(q || '').slice(0, 80), display: String(Math.max(1, Math.min(30, +n || 10))), sort: 'date' }, k, '네이버');
        const clean = t => String(t || '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        return { query: q, total: j.total, items: (j.items || []).map(x => ({ title: clean(x.title), summary: clean(x.description).slice(0, 220), date: x.pubDate ? new Date(new Date(x.pubDate).getTime() + 9 * 36e5).toISOString().replace('T', ' ').slice(0, 16) : '', url: x.originallink || x.link })), source: '네이버 뉴스 검색 (최신순)' };
      },
    },
    /* 텐센트 증권 공개 시세 — 중국 A주 · 홍콩 (키 없음 · 브라우저에서 바로 · 공식 API 아님). 현재가는 GBK 글자, 칸은 ~ 로 나뉨 */
    tencent: {
      _code(s) { const c = cnSym(s); if (!c) throw new Error(`${s}: 텐센트 시세는 중국 · 홍콩 종목만 됩니다 — 상하이 sh600519 · 선전 sz000001 · 홍콩 hk00700 (또는 600519.SS · 0700.HK)`); return c; },
      async _get(u) { let r; try { r = await fetch(u, { cache: 'no-store' }); } catch (e) { throw new Error('텐센트 시세에 연결하지 못했습니다 (인터넷 · 차단 여부를 확인하세요)'); } if (!r.ok) throw new Error('텐센트 시세: HTTP ' + r.status); return r; },
      async quote(k, s) {
        const c = this._code(s), hk = c.startsWith('hk');
        const r = await this._get('https://qt.gtimg.cn/q=' + (hk ? 'r_' : '') + c);
        let t = ''; try { t = new TextDecoder('gbk').decode(await r.arrayBuffer()); } catch (e) { }
        const m = t.match(/="([^"]*)"/), f = m ? m[1].split('~') : [];
        const n = i => { const v = parseFloat(f[i]); return isFinite(v) ? v : null; };
        if (f.length < 40 || !n(3)) throw new Error(`${s}: 텐센트에 이 종목 시세가 없습니다 (코드를 확인하세요)`);
        const ts = String(f[30] || ''), time = /^\d{14}$/.test(ts) ? `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(8, 10)}:${ts.slice(10, 12)}` : ts.replace(/\//g, '-').slice(0, 16);
        const w = hk ? [n(48), n(49)] : [n(67), n(68)];
        return { symbol: c, name: f[1] || '', exchange: { sh: '상하이', sz: '선전', hk: '홍콩' }[c.slice(0, 2)], currency: f.find(x => /^(CNY|HKD|USD)$/.test(x)) || (hk ? 'HKD' : 'CNY'),
          price: n(3), change: n(31), changePct: n(32), open: n(5), high: n(33), low: n(34), prevClose: n(4), volume: hk ? n(6) : n(6) != null ? n(6) * 100 : null,
          per: n(39) || undefined, pbr: hk ? undefined : n(46) || undefined, marketCap: n(45) ? n(45) * 1e8 : undefined, marketCapUnit: hk ? '홍콩달러' : '위안',
          week52: w[0] && w[1] ? { high: w[0], low: w[1] } : undefined, time, source: `텐센트 증권 (${hk ? '홍콩' : '중국'} · 공식 API 아님 · 통화 ${hk ? 'HKD' : 'CNY'})` };
      },
      async history(k, s, days) {
        const c = this._code(s), n = Math.max(20, Math.min(days || 260, 2000));
        const r = await this._get(`https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${c},day,,,${n},qfq`);
        const j = await r.json().catch(() => null), d = j && j.data && j.data[c], rows = d ? (d.qfqday || d.day || []) : [];
        if (!rows.length) throw new Error(`${s}: 텐센트에 이 종목 일봉이 없습니다`);
        return rows.map(x => ({ t: x[0], o: +x[1], c: +x[2], h: +x[3], l: +x[4], v: +x[5] })).filter(b => isFinite(b.c) && b.c > 0); // 수정주가(배당 · 분할 반영)
      },
    },
    /* FRED 미국 경제지표 — KIS 중계의 /fred */
    fred: {
      SERIES: [['DGS10', '미국 10년 국채', '%'], ['DGS2', '미국 2년 국채', '%'], ['FEDFUNDS', '연방기금 금리', '%'], ['CPIAUCSL', '소비자물가(CPI) 전년비', '%', 'yoy'], ['UNRATE', '실업률', '%'], ['DEXKOUS', '원/달러 (연준)', '원']],
      async overview(k) {
        const out = [], errs = [];
        for (const [id, name, unit, mode] of this.SERIES) {
          try {
            const j = await relayGet('/fred', { series_id: id, limit: mode === 'yoy' ? '14' : '30' }, k, 'FRED');
            const rows = (j.rows || []).map(r => ({ t: r.t, v: +r.v })).filter(r => isFinite(r.v));
            if (!rows.length) throw new Error(`${name}: 자료 없음`);
            if (mode === 'yoy') { if (rows.length < 13) throw new Error(`${name}: 자료 부족`); const y = Math.round((rows[0].v / rows[12].v - 1) * 1000) / 10, p = rows.length > 13 ? Math.round((rows[1].v / rows[13].v - 1) * 1000) / 10 : null; out.push({ id, name, unit, date: rows[0].t, value: y, prev: p }); }
            else { const back = rows[Math.min(rows.length - 1, 20)]; out.push({ id, name, unit, date: rows[0].t, value: rows[0].v, change1m: Math.round((rows[0].v - back.v) * 100) / 100 }); }
          } catch (e) { errs.push(e.message); }
        }
        if (!out.length) throw new Error(errs[0] || 'FRED 자료를 받지 못했습니다');
        return { source: 'FRED (미국 세인트루이스 연준)', series: out, errors: errs.length ? errs : undefined };
      },
    },
    /* OpenDART — KIS 중계의 /dart 를 거쳐 (DART 키는 SECRET 에) */
    dart: {
      async _relay() { const r = relayApi(); if (!r) throw needRelay('OpenDART'); return { base: String(r.base || '').trim().replace(/\/+$/, ''), rk: String(await keyOf(r) || '').trim() }; },
      async _call(k, ep, q) {
        const { base, rk } = await this._relay();
        let r; try { r = await fetch(`${base}/dart?` + new URLSearchParams(Object.assign({ ep }, q || {})), { headers: { 'x-relay-key': rk, 'x-api-key': String(k || '').trim() } }); }
        catch (e) { throw await relayDown(base, rk); }
        if (ep === 'corpCode.xml') return r;
        const j = await r.json().catch(() => null);
        if (r.status === 404 || (j && /종목은 6자리 코드로|없는 기능입니다 \(\/quote/.test(j.error || '') && !/dart/.test(j.error || ''))) throw new Error(OLD_RELAY);
        if (!j || !j.ok) throw new Error(dartWhy('DART: ' + String((j && j.error) || ('HTTP ' + r.status)).replace(/^DART: /, '')));
        if (j.status && j.status !== '000' && j.status !== '013') throw new Error('DART: ' + (j.message || j.status) + (j.status === '010' || j.status === '011' ? ' — DART 인증키를 다시 확인하세요' : j.status === '020' ? ' — 오늘 조회 한도를 넘었습니다' : ''));
        return j;
      },
      /* 종목코드 → DART 고유번호: 고유번호 압축 파일을 한 번 받아 이 기기에서 풀어 30일 둠 */
      async _map(k) {
        const c = LS.get('sec:dartCorp', null); if (c && c.t && Date.now() - c.t < 30 * 864e5 && c.m) return c.m;
        if (this._loading) return this._loading;
        this._loading = (async () => {
          const r = await this._call(k, 'corpCode.xml');
          const buf = await r.arrayBuffer(), u8 = new Uint8Array(buf);
          if (!(u8[0] === 0x50 && u8[1] === 0x4b)) { // 압축 파일이 아니면 받은 것을 그대로 보여 줌 (원인을 알 수 있게)
            let msg = ''; try { msg = new TextDecoder().decode(u8.slice(0, 2000)); } catch (e) { }
            const m = msg.match(/<message>([^<]+)/) || msg.match(/"message"\s*:\s*"([^"]+)/) || msg.match(/"error"\s*:\s*"([^"]+)/);
            const plain = msg.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70);
            const why = m ? dartWhy(m[1]) : !u8.length ? `빈 응답 (HTTP ${r.status})` : /<html|<!doctype/i.test(msg) ? `DART 가 웹 페이지로 답함 (HTTP ${r.status}) ${plain}` : `HTTP ${r.status} ${plain}`;
            throw new Error('DART 고유번호 표를 받지 못했습니다 — ' + why);
          }
          const xml = await unzipFirst(buf), m = {};
          const re = /<list>([\s\S]*?)<\/list>/g; let x;
          while ((x = re.exec(xml))) { const b = x[1], sc = (b.match(/<stock_code>\s*([0-9A-Z]{6})\s*<\/stock_code>/) || [])[1]; if (!sc) continue; const cc = (b.match(/<corp_code>(\d{8})<\/corp_code>/) || [])[1], nm = (b.match(/<corp_name>([^<]*)<\/corp_name>/) || [])[1] || ''; if (cc) m[sc] = [cc, nm.trim()]; }
          if (!Object.keys(m).length) throw new Error('DART 고유번호 표가 비어 있습니다');
          LS.set('sec:dartCorp', { t: Date.now(), m }); return m;
        })();
        try { return await this._loading; } finally { this._loading = null; }
      },
      async corp(k, s) {
        const m = await this._map(k), q = String(s || '').trim(), code = normSym(q);
        if (m[code]) return { stock: code, corp: m[code][0], name: m[code][1] };
        const hit = Object.entries(m).find(([, v]) => v[1] === q) || Object.entries(m).find(([, v]) => v[1].replace(/\s|\(주\)|주식회사/g, '') === q.replace(/\s|\(주\)|주식회사/g, ''));
        if (hit) return { stock: hit[0], corp: hit[1][0], name: hit[1][1] };
        throw new Error(`${s}: DART 에서 찾지 못했습니다 (상장 종목의 6자리 코드나 정확한 회사명으로)`);
      },
      async disclosures(k, s, days) {
        const c = await this.corp(k, s), ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');
        const j = await this._call(k, 'list.json', { corp_code: c.corp, bgn_de: ymd(new Date(Date.now() - (days || 90) * 864e5)), end_de: ymd(new Date(Date.now() + 9 * 36e5)), page_count: '40' });
        return { company: c.name, stock: c.stock, items: (j.list || []).map(x => ({ date: `${x.rcept_dt.slice(0, 4)}-${x.rcept_dt.slice(4, 6)}-${x.rcept_dt.slice(6)}`, title: String(x.report_nm || '').replace(/\s+/g, ' ').trim(), filer: x.flr_nm, url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${x.rcept_no}` })), source: 'OpenDART (금융감독원)' };
      },
      async company(k, s) {
        const c = await this.corp(k, s), j = await this._call(k, 'company.json', { corp_code: c.corp });
        return { name: j.corp_name, ceo: j.ceo_nm, market: { Y: '유가증권', K: '코스닥', N: '코넥스', E: '기타' }[j.corp_cls] || j.corp_cls, industryCode: j.induty_code, founded: j.est_dt, fiscalMonth: j.acc_mt, homepage: j.hm_url, address: j.adres };
      },
      /* 주요 재무: 가장 최근 보고서(올해 3분기 → 반기 → 1분기 → 작년 사업보고서 …), 연결 우선 */
      async financials(k, s) {
        const c = await this.corp(k, s), y = new Date().getFullYear();
        const tries = [[y, '11014', '3분기'], [y, '11012', '반기'], [y, '11013', '1분기'], [y - 1, '11011', '사업보고서'], [y - 1, '11014', '3분기'], [y - 2, '11011', '사업보고서']];
        for (const [yy, rc, rn] of tries) {
          const j = await this._call(k, 'fnlttSinglAcnt.json', { corp_code: c.corp, bsns_year: String(yy), reprt_code: rc });
          const list = j.list || []; if (!list.length) continue;
          const fs = list.some(x => x.fs_div === 'CFS') ? 'CFS' : 'OFS', L = list.filter(x => x.fs_div === fs);
          const n = v => { const t = String(v || '').replace(/,/g, '').trim(); return t === '' || t === '-' ? null : +t; };
          const g = nm => L.find(x => x.account_nm === nm) || L.find(x => String(x.account_nm).replace(/\s/g, '').startsWith(nm.replace(/\s/g, '')));
          const row = nm => { const x = g(nm); if (!x) return null; const cur = n(x.thstrm_amount), prev = n(x.frmtrm_amount); return { now: cur, before: prev, change: cur != null && prev ? Math.round((cur / prev - 1) * 1000) / 10 : null, period: x.thstrm_nm, prevPeriod: x.frmtrm_nm }; };
          const out = { 매출액: row('매출액') || row('영업수익'), 영업이익: row('영업이익'), 당기순이익: row('당기순이익') || row('당기순이익(손실)'), 자산총계: row('자산총계'), 부채총계: row('부채총계'), 자본총계: row('자본총계') };
          const r = (a, b) => a && b && a.now != null && b.now ? Math.round(a.now / b.now * 1000) / 10 : null;
          return { company: c.name, stock: c.stock, year: yy, report: rn, basis: fs === 'CFS' ? '연결' : '별도', unit: '원', items: out, ratios: { 영업이익률: r(out.영업이익, out.매출액), 순이익률: r(out.당기순이익, out.매출액), 부채비율: r(out.부채총계, out.자본총계) }, note: '3분기 · 반기 · 1분기 보고서의 손익은 해당 분기(3개월) 또는 누적 기준일 수 있음 — period 로 확인', source: 'OpenDART (금융감독원)' };
        }
        throw new Error(`${c.name}: 최근 정기보고서 재무 자료가 없습니다`);
      },
    },
    /* 한국은행 ECOS — KIS 중계의 /ecos 를 거쳐 (ECOS 키는 여기 SECRET 에, 중계에는 지나가기만) */
    ecos: {
      SERIES: [
        { id: 'base', name: '한국은행 기준금리', stat: '722Y001', item: '0101000', cycles: ['D', 'M'], unit: '%' },
        { id: 'ktb3', name: '국고채 3년', stat: '817Y002', item: '010200000', cycles: ['D'], unit: '%' },
        { id: 'ktb10', name: '국고채 10년', stat: '817Y002', item: '010210000', cycles: ['D'], unit: '%' },
        { id: 'usd', name: '원/달러 환율', stat: '731Y001', item: '0000001', cycles: ['D'], unit: '원' },
      ],
      async _one(k, ser, relay) {
        const base = String(relay.base || '').trim().replace(/\/+$/, ''), rk = await keyOf(relay);
        const ymd = (d, c) => c === 'M' ? d.toISOString().slice(0, 7).replace('-', '') : d.toISOString().slice(0, 10).replace(/-/g, '');
        let last = null;
        for (const c of ser.cycles) {
          const from = new Date(Date.now() - (c === 'M' ? 800 : 120) * 864e5), to = new Date(Date.now() + 9 * 36e5);
          let r; try { r = await fetch(`${base}/ecos?` + new URLSearchParams({ stat: ser.stat, cycle: c, from: ymd(from, c), to: ymd(to, c), item: ser.item }), { headers: { 'x-relay-key': String(rk || '').trim(), 'x-api-key': String(k || '').trim() } }); }
          catch (e) { throw await relayDown(base, rk); }
          const j = await r.json().catch(() => null);
          if (r.status === 404 || (j && /종목은 6자리 코드로/.test(j.error || ''))) throw new Error(OLD_RELAY);
          if (j && j.ok && (j.rows || []).length) {
            const rows = j.rows.map(x => ({ t: x.TIME, v: +x.DATA_VALUE })).filter(x => isFinite(x.v));
            const lv = rows[rows.length - 1], back = rows[Math.max(0, rows.length - (c === 'M' ? 2 : 21))];
            return { id: ser.id, name: ser.name, unit: ser.unit, date: lv.t, value: lv.v, change1m: back ? Math.round((lv.v - back.v) * 1000) / 1000 : null, recent: rows.slice(-10) };
          }
          last = (j && j.error) || ('HTTP ' + r.status);
        }
        throw new Error(`${ser.name}: ${last}`);
      },
      async macro(k) {
        const relay = relayApi();
        if (!relay) throw needRelay('한국은행 ECOS');
        const out = [], errs = [];
        for (const ser of this.SERIES) { try { out.push(await this._one(k, ser, relay)); } catch (e) { errs.push(e.message); } }
        if (!out.length) throw new Error(errs[0] || '한국은행 자료를 받지 못했습니다');
        return { source: '한국은행 ECOS', series: out, errors: errs.length ? errs : undefined };
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
  /* 중국 · 홍콩 종목 → 텐센트 코드 (sh600519 · sz000001 · hk00700). 한국 6자리와 겹치므로 시장 표시가 꼭 있어야 함 */
  const cnSym = s => {
    const t = String(s || '').trim().toUpperCase().replace(/\s/g, ''); let m;
    if ((m = /^(SH|SZ)(\d{6})$/.exec(t))) return m[1].toLowerCase() + m[2];
    if ((m = /^(\d{6})\.(SS|SH|SHH|SZ|SHZ)$/.exec(t))) return (/^S(S|H|HH)$/.test(m[2]) ? 'sh' : 'sz') + m[1];
    if ((m = /^HK(\d{1,5})$/.exec(t) || /^(\d{1,5})\.HK$/.exec(t))) return 'hk' + m[1].padStart(5, '0');
    return null;
  };
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
  /* Cloudflare 중계를 거쳐 부르기 (네이버 · FRED): 중계 주소 · 암호는 KIS 카드의 것, 그 API 의 키는 x-api-key 로 */
  async function relayGet(path, params, apiKey, who) {
    const r0 = relayApi();
    if (!r0) throw needRelay(who);
    const base = String(r0.base || '').trim().replace(/\/+$/, ''), rk = String(await keyOf(r0) || '').trim();
    let r; try { r = await fetch(base + path + '?' + new URLSearchParams(params || {}), { headers: { 'x-relay-key': rk, 'x-api-key': String(apiKey || '').trim() } }); }
    catch (e) { throw await relayDown(base, rk); }
    const j = await r.json().catch(() => null);
    if (r.status === 404 || (j && /종목은 6자리 코드로/.test(j.error || ''))) throw new Error(OLD_RELAY);
    if (!j || !j.ok) throw new Error((j && j.error) || `${who}: HTTP ${r.status}`);
    return j;
  }
  async function unzipFirst(buf) {
    const v = new DataView(buf); let e = buf.byteLength - 22;
    while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('압축 파일을 읽지 못했습니다');
    const cd = v.getUint32(e + 16, true);
    if (v.getUint32(cd, true) !== 0x02014b50) throw new Error('압축 파일을 읽지 못했습니다');
    const method = v.getUint16(cd + 10, true), size = v.getUint32(cd + 20, true), lh = v.getUint32(cd + 42, true);
    const start = lh + 30 + v.getUint16(lh + 26, true) + v.getUint16(lh + 28, true), data = new Uint8Array(buf, start, size);
    if (method === 0) return new TextDecoder().decode(data);
    if (typeof DecompressionStream === 'undefined') throw new Error('이 브라우저는 압축 풀기를 지원하지 않습니다 — 최신 크롬 · 엣지 · 사파리에서 열어 주세요');
    return await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  }
  async function callData(cap, ...args) {
    const cn = (cap === 'quote' || cap === 'history') && cnSym(args[0]), tc = dataApis().find(a => a.type === 'tencent');
    if (cn && tc) return DATA.tencent[cap]('', ...args, tc);
    const krs = (cap === 'quote' || cap === 'history') && isKR(args[0]) ? ['kisrelay', 'datagokr', 'etf'].map(t => dataApis().find(a => a.type === t && capsOf(a).includes(cap))).filter(Boolean) : [];
    if (krs.length) {
      let last = null;
      for (const a of krs) { try { return await DATA[a.type][cap](await keyOf(a), ...args, a); } catch (e) { last = e; } }
      throw last;
    }
    const api = dataApis().find(a => a.type !== 'tencent' && capsOf(a).includes(cap));
    if (!api) throw new Error(tc && (cap === 'quote' || cap === 'history') ? `${args[0]}: 텐센트 시세는 중국 · 홍콩 종목만 됩니다 — 상하이 sh600519 · 선전 sz000001 · 홍콩 hk00700 처럼 넣어 주세요` : `'${cap}' 를 주는 시세 API 가 등록되어 있지 않습니다`);
    const k = await keyOf(api);
    return DATA[api.type][cap](k, ...args, api);
  }

  /* 일봉에서 지표를 계산 (AI 가 숫자를 지어내지 않도록, 계산은 여기서) */
  const R2 = v => v == null || !isFinite(v) ? null : Math.round(v * 100) / 100;
  function analyze(bars) {
    bars = (bars || []).filter(b => b && isFinite(b.c) && b.c > 0);
    const c = bars.map(b => b.c), n = c.length; if (n < 2) return { bars: n };
    const H = i => isFinite(bars[i].h) && bars[i].h > 0 ? bars[i].h : c[i], L = i => isFinite(bars[i].l) && bars[i].l > 0 ? bars[i].l : c[i];
    const last = c[n - 1], ret = k => n > k ? (last / c[n - 1 - k] - 1) * 100 : null;
    const smaAt = (k, i) => i + 1 >= k ? c.slice(i + 1 - k, i + 1).reduce((a, b) => a + b, 0) / k : null, sma = k => smaAt(k, n - 1);
    const ema = (a, k) => { const w = 2 / (k + 1); let e = a[0]; return a.map((x, i) => (e = i ? x * w + e * (1 - w) : x)); };
    let rsi = null;
    if (n > 15) { let g = 0, l = 0; for (let i = 1; i <= 14; i++) { const d = c[i] - c[i - 1]; if (d > 0) g += d; else l -= d; } g /= 14; l /= 14; for (let i = 15; i < n; i++) { const d = c[i] - c[i - 1]; g = (g * 13 + Math.max(d, 0)) / 14; l = (l * 13 + Math.max(-d, 0)) / 14; } rsi = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
    let atr = null;
    if (n > 15) { const tr = []; for (let i = n - 14; i < n; i++) { const p = c[i - 1]; tr.push(Math.max(H(i) - L(i), Math.abs(H(i) - p), Math.abs(L(i) - p))); } atr = tr.reduce((a, b) => a + b, 0) / tr.length; }
    const lr = []; for (let i = Math.max(1, n - 20); i < n; i++) lr.push(Math.log(c[i] / c[i - 1]));
    const mean = lr.reduce((a, b) => a + b, 0) / lr.length, vol = Math.sqrt(lr.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, lr.length - 1)) * Math.sqrt(252) * 100;
    let hi = -Infinity, lo = Infinity; for (let i = 0; i < n; i++) { hi = Math.max(hi, H(i)); lo = Math.min(lo, L(i)); }
    let peak = c[0], mdd = 0; for (const x of c) { peak = Math.max(peak, x); mdd = Math.min(mdd, (x / peak - 1) * 100); }
    const s20 = sma(20), s50 = sma(50), s200 = sma(200);
    // MACD (12, 26, 9)
    let macd = null;
    if (n >= 35) { const e12 = ema(c, 12), e26 = ema(c, 26), m = c.map((_, i) => e12[i] - e26[i]), sg = ema(m.slice(25), 9), h1 = m[n - 1] - sg[sg.length - 1], h0 = m[n - 2] - sg[sg.length - 2];
      macd = { macd: R2(m[n - 1]), signal: R2(sg[sg.length - 1]), hist: R2(h1), state: h1 > 0 ? (h0 <= 0 ? '방금 시그널 상향 돌파' : '시그널 위 (상승 힘)') : (h0 >= 0 ? '방금 시그널 하향 이탈' : '시그널 아래 (하락 힘)') }; }
    // 볼린저 (20, 2)
    let boll = null;
    if (n >= 20) { const w = c.slice(-20), sd = Math.sqrt(w.reduce((a, b) => a + (b - s20) ** 2, 0) / 20), up = s20 + 2 * sd, dn = s20 - 2 * sd; boll = { upper: R2(up), lower: R2(dn), pctB: R2((last - dn) / ((up - dn) || 1) * 100), widthPct: R2((up - dn) / s20 * 100) }; }
    // 52주 위치 · 지지 / 저항 · 거래량 · 연속
    const w52 = Math.max(0, n - 250); let h52 = -Infinity, l52 = Infinity; for (let i = w52; i < n; i++) { h52 = Math.max(h52, H(i)); l52 = Math.min(l52, L(i)); }
    const lvl = k => { let a = Infinity, b = -Infinity; for (let i = Math.max(0, n - 1 - k); i < n - 1; i++) { a = Math.min(a, L(i)); b = Math.max(b, H(i)); } return [R2(a), R2(b)]; };
    const [sup20, res20] = lvl(20), [sup60, res60] = lvl(60);
    const vs = bars.map(b => +b.v || 0), vAvg = vs.slice(Math.max(0, n - 21), n - 1).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(20, n - 1));
    const volRatio = vAvg > 0 && vs[n - 1] > 0 ? vs[n - 1] / vAvg : null;
    let streak = 0; for (let i = n - 1; i > 0; i--) { const d = Math.sign(c[i] - c[i - 1]); if (!d) break; if (!streak || Math.sign(streak) === d) streak += d; else break; }
    let cross = null;
    if (n >= 52) for (let i = n - 1; i >= Math.max(50, n - 30); i--) { const a = smaAt(20, i) - smaAt(50, i), b = smaAt(20, i - 1) - smaAt(50, i - 1); if (a > 0 && b <= 0) { cross = { type: '골든크로스 (20일선이 50일선 위로)', date: bars[i].t, daysAgo: n - 1 - i }; break; } if (a < 0 && b >= 0) { cross = { type: '데드크로스 (20일선이 50일선 아래로)', date: bars[i].t, daysAgo: n - 1 - i }; break; } }
    const dist = v => v ? R2((last / v - 1) * 100) : null;
    const sig = [];
    if (rsi != null) { if (rsi >= 70) sig.push(`RSI ${R2(rsi)} — 과열권(70 이상)`); else if (rsi <= 30) sig.push(`RSI ${R2(rsi)} — 침체권(30 이하)`); }
    if (s200) sig.push(last >= s200 ? `200일선 위 (${dist(s200)}%) — 장기 상승 구간` : `200일선 아래 (${dist(s200)}%) — 장기 약세 구간`);
    if (cross) sig.push(`${cross.type} ${cross.daysAgo}거래일 전`);
    if (macd && /방금/.test(macd.state)) sig.push('MACD ' + macd.state);
    if (boll) { if (boll.pctB > 100) sig.push('볼린저 상단 돌파 — 강한 상승 또는 과열'); else if (boll.pctB < 0) sig.push('볼린저 하단 이탈 — 급락 또는 과매도'); if (n >= 140) { const ws = []; for (let i = n - 120; i < n; i += 5) { const w = c.slice(i - 19, i + 1), m = w.reduce((a, b) => a + b, 0) / 20; ws.push(Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / 20) * 4 / m * 100); } if (boll.widthPct <= Math.min(...ws) * 1.1) sig.push('볼린저 폭이 최근 6개월 가장 좁음 — 큰 움직임 직전일 수 있음'); } }
    if (volRatio != null && volRatio >= 2) sig.push(`거래량 평소(20일 평균)의 ${R2(volRatio)}배`);
    if (h52 > 0 && last >= h52 * 0.98) sig.push('52주 최고가 근처 (2% 이내)'); else if (l52 > 0 && last <= l52 * 1.02) sig.push('52주 최저가 근처 (2% 이내)');
    if (Math.abs(streak) >= 4) sig.push(`${Math.abs(streak)}일 연속 ${streak > 0 ? '상승' : '하락'}`);
    if (mdd <= -30 && (last / hi - 1) * 100 > -10) sig.push('큰 낙폭 뒤 고점 근처까지 회복');
    return {
      from: bars[0].t, to: bars[n - 1].t, bars: n, last: R2(last),
      returnPct: { d1: R2(ret(1)), d5: R2(ret(5)), d20: R2(ret(20)), d60: R2(ret(60)), d120: R2(ret(120)), d250: R2(ret(250)) },
      sma: { d20: R2(s20), d50: R2(s50), d200: R2(s200) }, fromSmaPct: { d20: dist(s20), d50: dist(s50), d200: dist(s200) },
      trend: s20 && s50 ? (last > s20 && s20 > s50 ? '상승 정렬 (종가 > 20일 > 50일)' : last < s20 && s20 < s50 ? '하락 정렬 (종가 < 20일 < 50일)' : '혼조') : '자료 부족',
      rsi14: R2(rsi), macd, bollinger: boll, atr14: R2(atr), atrPct: atr ? R2(atr / last * 100) : null, volatility20dAnnualPct: R2(vol),
      rangeHigh: R2(hi), rangeLow: R2(lo), fromHighPct: R2((last / hi - 1) * 100), maxDrawdownPct: R2(mdd),
      week52: { high: R2(h52), low: R2(l52), positionPct: h52 > l52 ? R2((last - l52) / (h52 - l52) * 100) : null },
      levels: { support20: sup20, resistance20: res20, support60: sup60, resistance60: res60, note: '직전 20 · 60거래일의 최저 · 최고 (오늘 제외)' },
      volume: { last: vs[n - 1] || null, avg20: R2(vAvg), ratio: R2(volRatio) }, streakDays: streak, lastCross: cross,
      signals: sig, signalNote: '이 앱이 규칙으로 계산한 사실 — 매수 · 매도 추천이 아님',
      recentCloses: bars.slice(-10).map(b => [b.t, R2(b.c)]),
    };
  }

  /* 여러 개를 동시에 몇 개씩만 (KIS 초당 한도 · 공공데이터 부담) */
  async function pool(list, k, fn) { const out = new Array(list.length); let i = 0; await Promise.all(Array.from({ length: Math.min(k, list.length) }, async () => { while (i < list.length) { const j = i++; out[j] = await fn(list[j], j); } })); return out; }
  const DISC_RISK = /유상증자|전환사채|신주인수권부사채|교환사채|감자|최대주주\s*변경|소송|거래정지|매매거래정지|횡령|배임|관리종목|불성실공시|상장적격성|감사의견|회생|부도|영업정지|투자주의|투자경고|투자위험|단기과열|자기주식\s*처분|주식등의대량보유/;
  const DISC_GOOD = /자기주식\s*(취득|소각)|자사주\s*(매입|소각)|무상증자|배당|단일판매|공급계약|수주|특허|기술이전|영업실적.*(증가|호전)/;
  const discTag = t => DISC_RISK.test(t) ? '주의' : DISC_GOOD.test(t) ? '긍정' : '';
  /* 관심 · 보유 종목 목록에 있으면 손익 · 손절/목표까지 거리 · 경고 */
  function posInfo(s, price) {
    const it = watch.items.find(x => String(x.symbol || '').toUpperCase() === s); if (!it) return null;
    const o = { name: it.name || undefined, holding: +it.qty > 0, qty: +it.qty || 0, avg: +it.avg || null, stop: +it.stop || null, target: +it.target || null, memo: it.memo || undefined, alerts: [] };
    if (price) {
      if (o.avg) { o.pnlPct = R2((price / o.avg - 1) * 100); if (o.qty) o.pnlAmount = Math.round((price - o.avg) * o.qty); }
      if (o.stop) { o.toStopPct = R2((o.stop / price - 1) * 100); if (price <= o.stop) o.alerts.push('손절가 이탈'); else if (o.toStopPct > -3) o.alerts.push('손절가까지 3% 이내'); }
      if (o.target) { o.toTargetPct = R2((o.target / price - 1) * 100); if (price >= o.target) o.alerts.push('목표가 도달'); }
      if (o.avg && o.stop && o.avg !== o.stop) o.rMultiple = R2((price - o.avg) / Math.abs(o.avg - o.stop));
      if (+it.alertHi && price >= +it.alertHi) o.alerts.push(`알림가 ${it.alertHi} 이상`);
      if (+it.alertLo && price <= +it.alertLo) o.alerts.push(`알림가 ${it.alertLo} 이하`);
    }
    return o;
  }
  /* 회사 이름으로 왔으면 DART 회사 목록으로 6자리 코드 찾기 */
  async function toCode(s) {
    if (!/[가-힣]/.test(s) || !dataFor('dart')) return s;
    try { const c = await DATA.dart.corp(await keyOf(dataFor('dart')), s); return c.stock || s; } catch (e) { return s; }
  }

  /* 한 종목 종합: 따로 부르던 것을 한 번에 (AI 왕복을 줄이고, 신호 · 밸류 · 공시 분류는 여기서 계산) */
  async function stockDossier(sym0) {
    let s = String(sym0 || '').trim().toUpperCase(); s = await toCode(s);
    const kr = isKR(s), gaps = [], dk = dataFor('dart') && kr ? await keyOf(dataFor('dart')).catch(() => null) : null;
    const safe = async (label, ok, fn) => { if (!ok) return undefined; try { return await fn(); } catch (e) { gaps.push(`${label}: ${e.message}`); return undefined; } };
    const [q, bars, fin, disc, idx] = await Promise.all([
      safe('시세', dataFor('quote'), () => callData('quote', s)),
      safe('일봉', dataFor('history'), () => callData('history', s, 260)),
      safe('재무', dk, () => DATA.dart.financials(dk, s)),
      safe('공시', dk, () => DATA.dart.disclosures(dk, s, 45)),
      safe('지수', kr && dataFor('index'), async () => DATA.index.get(await keyOf(dataFor('index')), ['코스피', '코스닥'])),
    ]);
    const tech = bars && bars.length ? analyze(bars) : null;
    const wi = watch.items.find(x => String(x.symbol || '').toUpperCase() === s);
    const name = (q && q.name) || (fin && fin.company) || (disc && disc.company) || (wi && wi.name) || s;
    const [news, brief] = await Promise.all([
      kr ? safe('국내 뉴스', dataFor('newsKR'), async () => DATA.naver.search(await keyOf(dataFor('newsKR')), name, 10)) : safe('뉴스', dataFor('news'), async () => ({ items: await callData('news', s, 7) })),
      safe('브리핑', /[가-힣A-Za-z]{2,}/.test(name) && name !== s || !kr, () => briefingForAI(name, '')),
    ]);
    const price = q && isFinite(q.price) ? q.price : tech ? tech.last : null;
    // 지수 대비 (코스닥 종목이면 코스닥)
    let rel = null;
    if (tech && idx && idx.indices) {
      const kq = /KOSDAQ|코스닥/i.test((q && q.exchange) || '') || /코스닥/.test(JSON.stringify((fin && fin.profile) || ''));
      const ix = idx.indices.find(x => x.name === (kq ? '코스닥' : '코스피')) || idx.indices[0];
      if (ix) rel = { index: ix.name, indexRet5d: ix.ret5d, indexRet20d: ix.ret20d, excess5dPctPt: tech.returnPct.d5 != null && ix.ret5d != null ? R2(tech.returnPct.d5 - ix.ret5d) : null, excess20dPctPt: tech.returnPct.d20 != null && ix.ret20d != null ? R2(tech.returnPct.d20 - ix.ret20d) : null };
    }
    // 밸류: 증권사(KIS) 값이 있으면 그것, 없으면 시가총액 ÷ 최근 보고서
    const val = {}, mcap = q ? (q.marketCap || (q.marketCapEok ? q.marketCapEok * 1e8 : null)) : null;
    if (q) { if (q.per) val.per = q.per; if (q.pbr) val.pbr = q.pbr; if (q.eps) val.eps = q.eps; if (q.week52) val.week52 = q.week52; }
    if (mcap) val.marketCapEok = Math.round(mcap / 1e8);
    if (fin && mcap) {
      const eq = fin.items.자본총계 && fin.items.자본총계.now, ni = fin.items.당기순이익 && fin.items.당기순이익.now;
      if (eq > 0 && !val.pbr) val.pbrCalc = R2(mcap / eq);
      if (ni != null && !val.per && fin.report === '사업보고서') val.perCalc = ni > 0 ? R2(mcap / ni) : '적자';
    }
    if (Object.keys(val).length) val.note = 'per · pbr 은 증권사(KIS) 값, perCalc · pbrCalc 는 시가총액 ÷ 최근 보고서 순이익 · 자본으로 이 앱이 계산 (지배주주 몫과 조금 다를 수 있음, 분기 보고서로는 PER 을 계산하지 않음)';
    const di = disc ? disc.items.map(x => Object.assign({}, x, { tag: discTag(x.title) })) : null;
    // 한눈에 (규칙 계산 · 판단은 AI 가)
    const card = {};
    if (tech) {
      card.추세 = tech.trend + (tech.sma.d200 ? (tech.last >= tech.sma.d200 ? ' · 200일선 위' : ' · 200일선 아래') : '');
      card.모멘텀 = `5일 ${tech.returnPct.d5}% · 20일 ${tech.returnPct.d20}% · RSI ${tech.rsi14}` + (rel && rel.excess20dPctPt != null ? ` · ${rel.index} 대비 20일 ${rel.excess20dPctPt > 0 ? '+' : ''}${rel.excess20dPctPt}%p` : '');
      card.위험 = `변동성(연) ${tech.volatility20dAnnualPct}% · 하루 평균 움직임(ATR) ${tech.atrPct}% · 구간 고점 대비 ${tech.fromHighPct}%`;
      card.가격대 = `지지 ${tech.levels.support20}(20일) / ${tech.levels.support60}(60일) · 저항 ${tech.levels.resistance20}(20일) / ${tech.levels.resistance60}(60일)`;
    }
    if (fin) card.재무 = `${fin.year} ${fin.report}(${fin.basis}): 영업이익률 ${fin.ratios.영업이익률}% · 부채비율 ${fin.ratios.부채비율}%` + (fin.items.영업이익 && fin.items.영업이익.change != null ? ` · 영업이익 전기 대비 ${fin.items.영업이익.change}%` : '');
    if (Object.keys(val).length) card.밸류 = [val.per && `PER ${val.per}`, val.perCalc && `PER(계산) ${val.perCalc}`, val.pbr && `PBR ${val.pbr}`, val.pbrCalc && `PBR(계산) ${val.pbrCalc}`, val.marketCapEok && `시총 ${val.marketCapEok.toLocaleString('ko-KR')}억`].filter(Boolean).join(' · ');
    if (di) { const r = di.filter(x => x.tag === '주의'), g = di.filter(x => x.tag === '긍정'); card.공시 = `최근 45일 ${di.length}건 — 주의 ${r.length} · 긍정 ${g.length}` + (r.length ? ` (${r.slice(0, 3).map(x => x.title).join(' / ')})` : ''); }
    const pos = posInfo(s, price);
    return {
      symbol: s, name, asOf: (q && q.time) || (tech && tech.to) || null,
      quote: q || null, scorecard: card, signals: tech ? tech.signals : [], technicals: tech, relative: rel, valuation: Object.keys(val).length ? val : null,
      financials: fin || null, disclosures: di ? { recent: di.slice(0, 15), risk: di.filter(x => x.tag === '주의'), positive: di.filter(x => x.tag === '긍정') } : null,
      news: news ? (news.items || []).slice(0, 8) : null, briefing: brief || null, position: pos,
      gaps, howToUse: 'scorecard 로 큰 그림 → signals · technicals 로 가격대 → financials · valuation · disclosures 로 근본 → news · briefing 으로 최근 이유. gaps 는 못 받은 자료 — 확신을 낮추거나 다른 도구 · 웹 검색으로 보충',
    };
  }

  /* 관심 · 보유 종목 전체 점검: 급한 것부터 */
  async function scanPortfolio() {
    const items = watch.items.filter(x => x.symbol).slice(0, 20);
    if (!items.length) return { count: 0, note: '관심 · 보유 종목이 없습니다 — 내 종목 화면에서 추가하면 점검할 수 있습니다' };
    const dk = dataFor('dart') ? await keyOf(dataFor('dart')).catch(() => null) : null;
    const rows = await pool(items, 4, async it => {
      const s = String(it.symbol).toUpperCase(), row = { symbol: s, name: it.name || undefined };
      try {
        const t = analyze(await callData('history', s, 130));
        Object.assign(row, { date: t.to, last: t.last, ret: { d1: t.returnPct.d1, d5: t.returnPct.d5, d20: t.returnPct.d20 }, rsi14: t.rsi14, trend: t.trend, atrPct: t.atrPct, support20: t.levels.support20, signals: t.signals });
      } catch (e) { row.error = e.message; }
      const live = watch.quotes[s]; const price = live && isFinite(live.price) && live.time && Date.now() - new Date(live.time) < 6 * 36e5 ? live.price : row.last;
      const pos = posInfo(s, price); if (pos) { delete pos.name; delete pos.memo; Object.assign(row, pos); }
      if (dk && isKR(s)) { try { const d = await DATA.dart.disclosures(dk, s, 7); row.newDisclosures = d.items.slice(0, 5).map(x => ({ date: x.date, title: x.title, tag: discTag(x.title), url: x.url })); } catch (e) { } }
      let u = 0; for (const a of row.alerts || []) u += /이탈/.test(a) ? 5 : /도달|이내/.test(a) ? 3 : 2;
      for (const d of row.newDisclosures || []) u += d.tag === '주의' ? 3 : d.tag === '긍정' ? 1 : 0;
      for (const g of row.signals || []) u += /방금|돌파|이탈|크로스|배$/.test(g) ? 1 : 0;
      if (row.ret && Math.abs(row.ret.d1 || 0) >= 5) u += 2;
      row.urgency = u; return row;
    });
    rows.sort((a, b) => b.urgency - a.urgency);
    const held = rows.filter(r => r.holding), val = held.reduce((a, r) => a + (r.last || 0) * (r.qty || 0), 0), cost = held.reduce((a, r) => a + (r.avg || 0) * (r.qty || 0), 0);
    return { count: rows.length, scannedAt: new Date().toISOString(), summary: { holdings: held.length, watchOnly: rows.length - held.length, marketValue: Math.round(val) || null, cost: Math.round(cost) || null, pnlPct: cost ? R2((val / cost - 1) * 100) : null, needsAttention: rows.filter(r => r.urgency >= 3).map(r => r.name || r.symbol) }, rows, note: '급한 순(urgency). 가격은 마지막 일봉 종가(최근 6시간 안에 불러온 시세가 있으면 그것) 기준' + (watch.items.length > 20 ? ` · 앞 20개만 (전체 ${watch.items.length})` : '') };
  }

  /* 여러 종목 나란히 + 수익률 상관관계 */
  async function compareStocks(list) {
    const syms = [...new Set((list || []).map(x => String(x || '').trim().toUpperCase()).filter(Boolean))].slice(0, 6);
    if (syms.length < 2) throw new Error('비교할 종목을 두 개 이상 주세요');
    const codes = await Promise.all(syms.map(toCode));
    const got = await pool(codes, 3, async s => { try { const b = await callData('history', s, 260); return { s, b, t: analyze(b) }; } catch (e) { return { s, err: e.message }; } });
    const ok = got.filter(x => x.t);
    const table = got.map(x => x.t ? { symbol: x.s, last: x.t.last, date: x.t.to, ret: x.t.returnPct, volatilityPct: x.t.volatility20dAnnualPct, maxDrawdownPct: x.t.maxDrawdownPct, fromHighPct: x.t.fromHighPct, rsi14: x.t.rsi14, trend: x.t.trend, week52Pos: x.t.week52.positionPct, signals: x.t.signals } : { symbol: x.s, error: x.err });
    const rets = o => { const m = new Map(); for (let i = Math.max(1, o.b.length - 120); i < o.b.length; i++) m.set(o.b[i].t, o.b[i].c / o.b[i - 1].c - 1); return m; };
    const corr = [];
    for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) {
      const A = rets(ok[i]), B = rets(ok[j]), xs = [], ys = []; for (const [t, v] of A) if (B.has(t)) { xs.push(v); ys.push(B.get(t)); }
      if (xs.length < 20) continue; const ma = xs.reduce((a, b) => a + b, 0) / xs.length, mb = ys.reduce((a, b) => a + b, 0) / ys.length;
      let sab = 0, sa = 0, sb = 0; xs.forEach((x, k) => { sab += (x - ma) * (ys[k] - mb); sa += (x - ma) ** 2; sb += (ys[k] - mb) ** 2; });
      corr.push({ pair: [ok[i].s, ok[j].s], corr120d: R2(sab / Math.sqrt(sa * sb)), days: xs.length });
    }
    const best = k => ok.slice().sort((a, b) => (b.t.returnPct[k] ?? -1e9) - (a.t.returnPct[k] ?? -1e9)).map(x => x.s);
    return { table, correlation: corr, rankBy20d: best('d20'), rankBy250d: best('d250'), note: '상관관계 1 에 가까우면 같이 움직임(분산 효과 작음), 0 근처면 따로, 음수면 반대로' };
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
    const cnHint = dataApis().some(a => a.type === 'tencent') ? ' 중국 A주는 sh600519(상하이) · sz000001(선전), 홍콩은 hk00700 처럼 시장을 앞에 붙인다(한국 6자리와 겹치므로 꼭). 회사 이름만 알면 코드로 바꿔서 부른다. 값은 위안(CNY) · 홍콩달러(HKD).' : '';
    const sym = { type: 'string', description: '종목 코드. 미국은 AAPL, 한국은 6자리 코드(005930)를 먼저 쓴다(종목명도 공공데이터포털에서는 됨). 한국 종목은 KIS 중계(실시간)가 있으면 그쪽, 없거나 실패하면 공공데이터포털(전 영업일 종가)로 조회됨 — 결과의 source 로 실시간인지 확인.' + cnHint };
    if (dataFor('quote')) T.push({ name: 'get_quote', description: '종목의 현재가(또는 최근 종가) · 등락률 · 고가 · 저가를 등록된 시세 API 로 조회한다. 가격을 말하기 전에 반드시 이 도구로 확인한다.', input_schema: { type: 'object', properties: { symbol: sym }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('history')) T.push({ name: 'get_price_history', description: '일봉을 받아 이 앱이 직접 계산한 지표를 돌려준다: 기간 수익률(5·20·60·120·250일), 이동평균(20·50·200), 추세 정렬, RSI14, ATR14, 20일 변동성(연율), 구간 고점 대비 하락, 최대 낙폭, 최근 10일 종가.', input_schema: { type: 'object', properties: { symbol: sym, days: { type: 'integer', description: '받을 거래일 수 (60~400, 기본 260)' } }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('news')) T.push({ name: 'get_news', description: '종목의 최근 회사 뉴스 제목 · 출처 · 링크 · 요약을 시세 API 로 받는다.', input_schema: { type: 'object', properties: { symbol: sym, days: { type: 'integer', description: '최근 며칠 (1~30, 기본 7)' } }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('custom')) T.push({ name: 'fetch_custom_data', description: '사용자가 등록한 사용자 정의 API 를 종목 코드로 불러 원문(JSON 또는 텍스트)을 돌려준다.', input_schema: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('quote') || dataFor('history') || dataFor('dart')) T.push({ name: 'get_stock_dossier', description: '한 종목 종합 조사를 한 번에: 시세 · 일봉 지표(추세 · RSI · MACD · 볼린저 · 52주 위치 · 지지/저항 · 거래량) · 규칙 신호(signals) · 지수 대비 성과 · 밸류(PER · PBR · 시총) · 최근 재무 · 최근 45일 공시(주의/긍정 분류) · 국내 뉴스 · 오늘 브리핑 언급 · 사용자 보유 현황(손익 · 손절/목표 거리)과 한눈에 보기(scorecard), 못 받은 자료(gaps). 종목 하나를 판단 · 설명할 때 가장 먼저 이것만 부르고, gaps 만 다른 도구로 보충한다.', input_schema: { type: 'object', properties: { symbol: { type: 'string', description: '6자리 코드(005930) · 미국 티커(AAPL) · 또는 한국 회사명.' + cnHint } }, required: ['symbol'], additionalProperties: false } });
    if (dataFor('history')) T.push({ name: 'scan_portfolio', description: '사용자의 관심 · 보유 종목 전체(최대 20개)를 점검해 급한 순으로 돌려준다: 최근 종가 · 1/5/20일 수익률 · RSI · 추세 · 신호, 보유 손익 · 손절가/목표가까지 거리 · R 배수 · 경고(손절 이탈 · 목표 도달 · 알림가), 최근 7일 새 공시(주의/긍정). "내 종목 어때", "오늘 점검", "뭐부터 봐야 해" 에 쓴다.', input_schema: { type: 'object', properties: {}, additionalProperties: false } });
    if (dataFor('history')) T.push({ name: 'compare_stocks', description: '2~6개 종목을 나란히 비교한다: 기간 수익률 · 변동성 · 최대 낙폭 · 고점 대비 · RSI · 추세 · 52주 위치 · 신호와, 최근 120거래일 일간 수익률 상관관계(분산 효과), 20일 · 1년 수익률 순위. 종목 고르기 · 갈아타기 · 분산을 물을 때 쓴다.', input_schema: { type: 'object', properties: { symbols: { type: 'array', items: { type: 'string' }, description: '종목 코드 또는 회사명 2~6개' } }, required: ['symbols'], additionalProperties: false } });
    T.push({ name: 'get_briefing', description: '이 앱이 매일 아침(8시 전까지 여러 번 보강) 모으는 그날의 모닝 브리핑(여러 언론이 함께 다룬 주식 관련 큰 이슈 15개 · 언론사 수 · 분류)과 전략 브리핑(증권사 데일리 시황 · 투자전략 리포트의 제목 · 요약, 주간 전략, 자주 나온 말)을 돌려준다. "오늘 · 요즘 시장", 이슈, 특정 종목 · 업종의 최근 뉴스나 증권사 시각을 말할 때 웹 검색보다 먼저 확인한다. focus 를 주면 그 말이 들어간 항목만 골라 준다.', input_schema: { type: 'object', properties: { focus: { type: 'string', description: '종목명 · 업종 · 키워드 (선택, 예: 삼성전자, 반도체, 환율)' }, date: { type: 'string', description: 'YYYY-MM-DD (선택, 기본 가장 최근 판)' } }, additionalProperties: false } });
    if (dataFor('newsKR')) T.push({ name: 'search_news_kr', description: '네이버 뉴스에서 최신순으로 국내 기사를 찾는다(제목 · 요약 · 시각 · 원문 링크). 아침 브리핑 이후의 종목 · 업종 뉴스, 장중 급등락 이유를 확인할 때 쓴다. 웹 검색보다 국내 언론에 빠르고 정확하다.', input_schema: { type: 'object', properties: { query: { type: 'string', description: '검색어 (예: 삼성전자 실적, 2차전지 수주)' }, count: { type: 'integer', description: '몇 건 (기본 10, 최대 30)' } }, required: ['query'], additionalProperties: false } });
    if (dataFor('usmacro')) T.push({ name: 'get_us_macro', description: '미국 연준 FRED 자료로 10년 · 2년 국채 금리, 연방기금 금리, 소비자물가(전년비), 실업률, 원/달러의 최근 값과 변화를 돌려준다. 미국 금리 · 물가 · 고용이 한국 증시에 주는 영향을 말할 때 쓴다.', input_schema: { type: 'object', properties: {}, additionalProperties: false } });
    if (dataFor('dart')) {
      T.push({ name: 'get_disclosures', description: '한국 상장사의 최근 공시 목록(날짜 · 제목 · 제출인 · 원문 링크)을 금융감독원 OpenDART 에서 받는다. 실적 · 유상증자 · 전환사채 · 자사주 · 최대주주 변경 · 소송 등 주가에 영향을 줄 일을 확인할 때 쓴다.', input_schema: { type: 'object', properties: { symbol: { type: 'string', description: '6자리 코드(005930) 또는 회사명' }, days: { type: 'integer', description: '최근 며칠 (기본 90, 최대 365)' } }, required: ['symbol'], additionalProperties: false } });
      T.push({ name: 'get_financials', description: '한국 상장사의 가장 최근 정기보고서 주요 재무(매출액 · 영업이익 · 당기순이익 · 자산 · 부채 · 자본, 전기 대비 증감, 영업이익률 · 순이익률 · 부채비율)와 회사 개요를 OpenDART 에서 받는다. 실적 · 재무 건전성 · 밸류에이션을 말할 때 쓴다.', input_schema: { type: 'object', properties: { symbol: { type: 'string', description: '6자리 코드(005930) 또는 회사명' } }, required: ['symbol'], additionalProperties: false } });
    }
    if (dataFor('index')) T.push({ name: 'get_index', description: '코스피 · 코스닥 · 코스피 200 의 최근 종가 · 등락률 · 5일/20일 수익률 · 최근 10일 값을 공식 자료(금융위원회)로 돌려준다. 시장 분위기 · 지수 수준을 말하기 전에 확인한다.', input_schema: { type: 'object', properties: {}, additionalProperties: false } });
    if (dataFor('macro')) T.push({ name: 'get_macro', description: '한국은행 ECOS 공식 자료로 기준금리 · 국고채 3년/10년 금리 · 원/달러 환율의 최근 값과 한 달 변화, 최근 10개 값을 돌려준다. 금리 · 환율을 말하기 전에 이 도구로 확인한다.', input_schema: { type: 'object', properties: {}, additionalProperties: false } });
    if (dataFor('ksd')) {
      T.push({ name: 'get_ksd_stock_info', description: '한국예탁결제원 공식 자료로 한국 종목 하나의 기본정보(표준코드 · 영문명 · 발행일 · 주식종류) · 상장정보(상장일 · 상장폐지일) · 작년 배당(시가배당률 · 주당배당금 · 순위)을 돌려준다. 시세는 없다.', input_schema: { type: 'object', properties: { symbol: { type: 'string', description: '6자리 코드(005930) 또는 정확한 회사명(삼성전자)' }, year: { type: 'integer', description: '배당 기준연도 (선택, 기본 작년)' } }, required: ['symbol'], additionalProperties: false } });
      T.push({ name: 'query_ksd', description: '한국예탁결제원 주식정보의 다른 기능을 직접 부른다. 의무보호예수(풀릴 물량 → 수급 부담) · 신규 예탁지정 · 시장별 발행주식수 · 배당 순위 상위 · CB/BW 행사조건 등. op 와 params(필수는 *) — '
        + Object.entries(KSD_OPS).map(([k, v]) => `${k}: ${v.d} (${v.p})`).join(' / '),
        input_schema: { type: 'object', properties: { op: { type: 'string', enum: Object.keys(KSD_OPS) }, params: { type: 'object', description: '요청 값 (예: {"stdDt":"20261106"})', additionalProperties: { type: 'string' } } }, required: ['op'], additionalProperties: false } });
    }
    T.push({ name: 'get_portfolio', description: '(종목별 점검은 scan_portfolio 가 낫다) 사용자가 이 앱에 적어 둔 관심 종목 · 보유 수량 · 평균 단가 · 목표가 · 손절가 · 메모와 마지막으로 불러온 시세를 돌려준다.', input_schema: { type: 'object', properties: {}, additionalProperties: false } });
    T.push({ name: 'get_journal', description: '사용자의 결정 카드(매매 일지): 통계(승률 · 평균 이익/손실 R · 기대값 · 손익 합계 · 평균 보유일 · 감정별 · 판 이유별 · 체크리스트별), 성적표(reportCard: 같은 기간 지수 대비 평균 초과 · 지수를 이긴 비율, 손절 규율 — 손절가에 닿은 수 · 미룬 수 · 미뤄서 더 잃은 R, 체크리스트 · AI 의견 · 감정별 승률 · 평균 R · 지수 대비, 점검일이 된 결정 수)와 최근 40건(진입 · 손절 · 목표 · 청산 · 이유 · 감정 · AI 의견 · 점검일 · 교훈 · 자동 채점 score)을 돌려준다.', input_schema: { type: 'object', properties: { period: { type: 'string', enum: ['all', 'year', '90'], description: '성적표 기간 (기본 all)' } }, additionalProperties: false } });
    T.push({ name: 'get_notes', description: '사용자가 노트 탭에 날짜별로 적은 메모를 돌려준다. company 를 주면 그 기업이 들어간 노트만 (최근 60개).', input_schema: { type: 'object', properties: { company: { type: 'string', description: '기업 이름 (선택, 예: 삼성전자)' } }, additionalProperties: false } });
    T.push({ name: 'save_memory', description: '앞으로의 답에 계속 필요한 사용자 정보 · 선호를 한 문장으로 기억한다. 사용자가 "기억해" 라고 했거나 투자 성향 · 제약을 새로 알았을 때만 쓴다. 시세처럼 금방 바뀌는 정보나 이미 프로필에 있는 내용은 저장하지 않는다. 사용자는 나의 원칙 화면에서 보고 지울 수 있다.', input_schema: { type: 'object', properties: { text: { type: 'string', description: '기억할 한 문장' } }, required: ['text'], additionalProperties: false } });
    T.push({ name: 'search_records', description: '키워드 추적: 이 앱이 모은 모닝 브리핑 뉴스 · 증권사 전략 리포트(날짜별)와 사용자의 AI 대화 · 노트 · 매매 일지에서 키워드를 찾아 날짜별 건수(byDay)와 최근 기사 · 리포트 문장을 돌려준다. "요즘 ○○ 얘기가 얼마나 나오나", "○○ 관련 증권사 시각이 어떻게 바뀌었나", "예전에 ○○ 에 대해 뭐라고 적었나" 를 물을 때 쓴다. 쉼표로 여러 말을 주면 모두 들어간 것만.', input_schema: { type: 'object', properties: { query: { type: 'string', description: '찾을 키워드 (예: HBM, 금리, 삼성전자)' }, days: { type: 'integer', description: '최근 며칠 (3~60, 기본 14)' } }, required: ['query'], additionalProperties: false } });
    T.push({ name: 'get_profit_engine', description: '수익 엔진 점검: 사용자 보유 · 결정 카드 · 나의 원칙으로 계산한 "지속 수익의 조건" 통과율(score)과 항목별 결과(checks: 핵심 지수 비중 · 한 종목 비중 · 손절가 · 걸린 위험 합계 · 계좌 고점 대비 하락 · 회전율 · 기대값 · 지수 대비 · 체크리스트 준수 · 감정 매매 · 레버리지, 각각 status ok/warn/bad/na · 값 · 근거 · 고칠 것), 오늘의 규칙(rules)과 새 매매 크기 배수(sizeFactor: 1 정상 · 0.5 절반 · 0 중지), 리밸런싱(목표 대비 옮길 금액), 해외 주식 세금(올해 실현 손익 · 250만 원 공제 남은 금액 · 손실/이익 실현 후보). 계좌 전체 · 비중 · 리밸런싱 · 지금 사도 되는지 · 세금을 물을 때 먼저 부른다. sizeFactor 가 1 보다 작으면 수량 계산에 반영한다.', input_schema: { type: 'object', properties: {}, additionalProperties: false } });
    T.push({ name: 'position_size', description: '감수할 손실에서 거꾸로 매수 수량을 계산한다: 1주당 위험, 수량, 투입 금액과 계좌 대비 비중, 손익비(R), 손익분기 승률, 승률을 주면 1회 기대값. 비중 · 손절 · 목표를 말할 때 이 도구로 계산한다.', input_schema: { type: 'object', properties: { account: { type: 'number', description: '계좌 금액' }, risk_percent: { type: 'number', description: '한 번에 감수할 손실 % (보통 0.5~2)' }, entry: { type: 'number' }, stop: { type: 'number' }, target: { type: 'number' }, win_rate: { type: 'number', description: '예상 승률 % (선택)' } }, required: ['account', 'risk_percent', 'entry', 'stop'], additionalProperties: false } });
    return T;
  }
  const LABEL = { get_stock_dossier: '종목 종합', scan_portfolio: '내 종목 점검', compare_stocks: '종목 비교', get_quote: '시세', get_price_history: '일봉 · 지표', get_news: '뉴스', fetch_custom_data: '사용자 API', get_ksd_stock_info: '예탁결제원 종목', get_macro: '금리 · 환율', get_briefing: '오늘 브리핑', get_index: '지수', get_disclosures: '공시', get_financials: '재무', search_news_kr: '국내 뉴스', get_us_macro: '미국 지표', query_ksd: '예탁결제원', get_portfolio: '내 종목', get_journal: '매매 일지', get_notes: '노트', save_memory: '기억함', position_size: '수량 계산', get_profit_engine: '수익 엔진', web_search: '웹 검색' };
  function validate(name, input) {
    const def = toolDefs().find(t => t.name === name); if (!def) return '알 수 없는 도구';
    if (!input || typeof input !== 'object') return '입력이 비어 있습니다';
    for (const k of def.input_schema.required || []) if (input[k] == null || input[k] === '') return `${k} 가 없습니다`;
    for (const [k, sc] of Object.entries(def.input_schema.properties)) if (input[k] != null && sc.type === 'array' && !Array.isArray(input[k])) return `${k} 는 목록이어야 합니다`;
    for (const [k, s] of Object.entries(def.input_schema.properties)) if (input[k] != null && s.type === 'number' && !isFinite(+input[k])) return `${k} 는 숫자여야 합니다`;
    return '';
  }
  async function runTool(name, input) {
    const bad = validate(name, input); if (bad) throw new Error('INVALID_INPUT: ' + bad);
    const s = String(input.symbol || '').trim().toUpperCase();
    switch (name) {
      case 'get_stock_dossier': return await stockDossier(input.symbol);
      case 'scan_portfolio': return await scanPortfolio();
      case 'compare_stocks': return await compareStocks(input.symbols);
      case 'get_quote': { const q = await callData('quote', s); watch.quotes[s] = { price: q.price, changePct: q.changePct, time: q.time || new Date().toISOString(), source: q.source }; saveWatch(); return q; }
      case 'get_price_history': { const d = Math.max(60, Math.min(400, +input.days || 260)); const bars = await callData('history', s, d); if (!bars.length) throw new Error(`${s}: 일봉이 없습니다`); return Object.assign({ symbol: s }, analyze(bars)); }
      case 'get_news': return { symbol: s, items: await callData('news', s, Math.max(1, Math.min(30, +input.days || 7))) };
      case 'fetch_custom_data': return await callData('custom', s);
      case 'search_news_kr': { const a = dataFor('newsKR'); return await DATA.naver.search(await keyOf(a), String(input.query).trim(), input.count); }
      case 'get_us_macro': { const a = dataFor('usmacro'); return await DATA.fred.overview(await keyOf(a)); }
      case 'get_disclosures': { const a = dataFor('dart'); return await DATA.dart.disclosures(await keyOf(a), String(input.symbol).trim(), Math.max(7, Math.min(365, +input.days || 90))); }
      case 'get_financials': { const a = dataFor('dart'), k = await keyOf(a); const f = await DATA.dart.financials(k, String(input.symbol).trim()); try { f.profile = await DATA.dart.company(k, String(input.symbol).trim()); } catch (e) { } return f; }
      case 'get_briefing': return await briefingForAI(String(input.focus || '').trim(), String(input.date || '').trim());
      case 'get_index': { const a = dataFor('index'); return await DATA.index.get(await keyOf(a)); }
      case 'get_macro': { const a = dataFor('macro'); return await DATA.ecos.macro(await keyOf(a)); }
      case 'get_ksd_stock_info': { const a = dataFor('ksd'); const r = await DATA.ksd.stock(await keyOf(a), String(input.symbol).trim(), input.year); return Object.assign({ symbol: s, source: '한국예탁결제원 (공공데이터포털)' }, r); }
      case 'query_ksd': { const a = dataFor('ksd'); const r = await DATA.ksd.call(await keyOf(a), String(input.op), Object.fromEntries(Object.entries(input.params || {}).map(([k2, v]) => [k2, String(v)]))); if (r.items.length > 200) { r.note = `${r.items.length}건 중 앞 200건만`; r.items = r.items.slice(0, 200); } return r; }
      case 'get_notes': { const c = String(input.company || '').trim(); const list = notes.filter(n => !c || (n.companies || []).includes(c) || String(n.text).includes(c)).sort((a, b) => a.date.localeCompare(b.date)).slice(-60); return { company: c || null, count: list.length, notes: list.map(n => ({ date: n.date, companies: n.companies, text: n.text })) }; }
      case 'get_journal': return { stats: jStats(), reportCard: reportCard(input.period || 'all'), checklist: me.checklist, trades: journal.slice(-40).map(t => Object.assign({}, t, { score: t.score ? Object.assign({}, t.score, { at: undefined }) : undefined })) };
      case 'save_memory': { const t = String(input.text).trim().slice(0, 200); if (!me.notes.some(n => n.text === t)) { me.notes.push({ t: Date.now(), text: t, by: 'AI' }); me.notes = me.notes.slice(-50); saveMe(); } return { saved: t, total: me.notes.length }; }
      case 'get_portfolio': return { items: watch.items, quotes: watch.quotes, note: '수량 · 평균 단가가 0 이면 관심만 있는 종목' };
      case 'get_profit_engine': return engineState();
      case 'search_records': return await searchRecords(String(input.query).trim(), input.days);
      case 'position_size': return sizePlan({ account: +input.account, risk_percent: +input.risk_percent, entry: +input.entry, stop: +input.stop, target: input.target ? +input.target : 0, win_rate: input.win_rate ? +input.win_rate : 0 });
    }
    throw new Error('알 수 없는 도구');
  }

  function systemPrompt(webOn) {
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const tools = toolDefs().map(t => t.name).concat(webOn ? ['web_search'] : []);
    return `당신은 개인 투자자의 주식 리서치 · 매매 계획 도우미입니다. 한국어로 답합니다. 오늘은 ${today}입니다.

목표: 사용자가 근거 있는 판단을 하고, 손실을 통제하고, 같은 실수를 반복하지 않게 도와 수익을 낼 가능성을 높이는 것. 수익을 약속하지 않습니다.

데이터 지도 (등록된 것만, 도구가 있으면 기억이나 짐작 대신 꼭 도구로)
${[
  ['get_profit_engine', '계좌 전체 · 비중 · 리밸런싱 · "지금 사도 되나" · 세금 → 먼저 이것 (규칙 위반 · 새 매매 크기 · 옮길 금액). 새 매수를 권하기 전에 rules 와 sizeFactor 를 확인'],
  ['get_stock_dossier', '종목 하나를 판단 · 설명 → 먼저 이것 하나 (시세 · 지표 · 신호 · 밸류 · 재무 · 공시 · 뉴스 · 브리핑 · 내 보유 현황). gaps 에 있는 것만 다른 도구로 보충'],
  ['scan_portfolio', '"내 종목 어때 · 오늘 점검 · 뭐부터" → 관심 · 보유 전체를 급한 순으로 (손절 · 목표 거리, 경고, 새 공시)'],
  ['compare_stocks', '두 종목 이상 비교 · 고르기 · 분산 → 수익률 · 위험 · 상관관계를 나란히'],
  ['get_briefing', '오늘 · 요즘 시장, 이슈, 증권사 시각 → 먼저 이것 (아침 8시 전 보강판), 그 뒤 소식은 웹 검색'],
  ['get_index', '코스피 · 코스닥 수준과 흐름'],
  ['get_macro', '기준금리 · 국고채 · 원/달러 (한국은행)'],
  ['get_quote', '현재가 — 결과의 source 로 실시간(KIS)인지 전일 종가(공공데이터)인지 구분해 말함. ETF 는 NAV 와 괴리율도'],
  ['get_price_history', '추세 · 지표 · 변동성 · 낙폭 (이 앱이 계산)'],
  ['get_ksd_stock_info', '한국 종목의 공식 기록 · 상장일 · 작년 배당'],
  ['get_financials', '실적 · 재무 건전성 (매출 · 영업이익 · 순이익 · 부채비율, 금융감독원)'],
  ['search_news_kr', '브리핑 이후 국내 최신 뉴스 · 급등락 이유 (네이버, 웹 검색보다 먼저)'],
  ['get_us_macro', '미국 국채 · 연준 금리 · 물가 · 고용 (FRED)'],
  ['get_disclosures', '최근 공시 (유상증자 · 전환사채 · 자사주 · 최대주주 변경 등) — 종목 판단 전에 확인'],
  ['query_ksd', '의무보호예수(풀릴 물량) · 신규 예탁지정 · 시장 통계'],
  ['get_news', '해외 종목 회사 뉴스'],
].filter(([n]) => tools.includes(n)).map(([n, w]) => `- ${n}: ${w}`).join('\n') || '- (시세 · 자료 도구 없음)'}
- 서로 상관없는 조회는 한 번에 함께 부릅니다 (예: get_quote + get_price_history + get_ksd_stock_info). 한국 종목은 6자리 코드(005930)로 부릅니다.

데이터 원칙
- 쓸 수 있는 도구: ${tools.join(', ') || '없음'}. ${dataFor('quote') ? '' : '시세 API 가 등록되어 있지 않으니, 가격을 말할 때는 웹 검색 결과나 사용자가 준 숫자만 쓰고 그 사실을 밝힙니다. '}${dataFor('quote') && !realtimeOn() ? '지금 국내 시세는 공공데이터포털 종가 기준(보통 전 영업일, 장중 실시간 아님)입니다. 가격을 말할 때 "○월 ○일 종가"처럼 기준일을 밝히고, 오늘 장중 움직임이 중요하면 search_news_kr · 웹 검색으로 보완하되 그 숫자는 출처와 함께 따로 적습니다. ' : ''}
- 가격 · 등락률 · 지표 · 날짜는 도구 결과나 검색 결과에 있는 것만 말하고, 언제 기준인지 적습니다. 모르는 숫자는 지어내지 말고 "확인 필요"라고 씁니다.
- 지표 계산(수익률 · 이동평균 · RSI · MACD · 변동성 · 지지/저항)은 get_stock_dossier · get_price_history 결과를, 비중 · 수량은 position_size 결과를 씁니다. 직접 계산해서 숫자를 만들지 않습니다.
- 사용자의 보유 · 관심 종목이 관련되면 get_portfolio 로, 과거 매매 · 습관이 관련되면 get_journal 로, 특정 기업에 대해 사용자가 적어 둔 생각이 관련되면 get_notes 로 먼저 확인합니다.
- 사용자가 "기억해" 라고 하거나 앞으로 계속 필요한 사용자 정보(성향 · 제약 · 선호)를 새로 알게 되면 save_memory 로 한 문장만 저장하고, 저장했다고 짧게 말합니다.

종목 · 매매 판단을 물으면 이 순서로 짧게:
1. 한 줄 결론 (관망 · 분할 매수 검토 · 비중 축소 검토 같은 행동 단위, 확신 정도 낮음/보통/높음)
2. 근거 (데이터 · 뉴스 · 실적, 출처와 기준일)
3. 반대 근거와 위험 (무엇이 틀리면 생각을 바꿀지)
4. 시나리오: 강세 · 기본 · 약세 각각의 조건과 대략의 가격대
5. 실행 계획: 진입 조건, 손절가(근거), 목표가, 1회 감수 손실 기준의 수량 · 비중
6. 다음에 확인할 것 (실적 발표일 · 공시 · 지표 발표 등)

분석 원칙
- signals 는 이 앱이 규칙으로 계산한 사실이지 매수 · 매도 추천이 아닙니다. 추세 · 모멘텀 · 재무 · 공시 · 뉴스 중 여러 갈래가 같은 방향일 때만 확신을 올리고, 갈래끼리 엇갈리면 그 엇갈림이 결론입니다.
- 확신 정도는 근거의 수와 질로 정합니다. gaps(못 받은 자료)가 판단에 중요한 부분이면 확신을 '낮음' 으로 두고 무엇이 비었는지 밝힙니다.
- 손절가 · 목표가 · 진입 가격대는 계산값에 근거합니다: 지지/저항(levels), 이동평균, ATR(손절은 보통 진입가에서 ATR 1.5~2배 아래 또는 직전 지지선 바로 아래). 어느 값을 썼는지 괄호로 적습니다.
- 사용자가 보유 중이면(position.holding) 평균 단가 · 손절가 · 목표가 기준으로, 손익과 R 배수를 넣어 말합니다. 경고(alerts)가 있으면 맨 먼저 말합니다.
- 공시에 '주의' 가 있으면(유상증자 · 전환사채 · 최대주주 변경 · 소송 등) 결론보다 먼저 짚습니다.
- 답을 보내기 전에 스스로 검산합니다: 인용한 숫자가 모두 도구 결과에 있는가, 기준일이 맞는가, 결론이 반대 근거보다 강한가. 아니면 고칩니다.

결정 카드: 사용자가 사거나 팔기로 마음먹으면, 매매 일지의 [결정 카드] 에 이유 · 손절가 · 목표가 · 점검일 · AI 의견을 적어 두라고 짧게 권합니다 (점검일에 지수 대비 · 손절 규율이 자동 채점됨). 성과를 물으면 get_journal 의 reportCard 를 근거로, 표본 수와 함께 말합니다.
습관 원칙: 잦은 매매 · 몰빵 · 물타기 · 손절 미루기 · 뉴스 추격 매수의 위험을 필요할 때 짚습니다. 레버리지 · 신용 · 단기 급등주는 위험을 분명히 말합니다. 세금 · 수수료도 고려합니다.
답의 끝에는 쓴 근거를 한 줄로: "근거: 시세(출처 · 기준일) · 브리핑(날짜) · 리포트(증권사) …". 근거 사이에 엇갈림이 있으면(뉴스는 낙관, 리포트는 경계 등) 숨기지 말고 짚습니다.
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
    if (webOn) tools.push({ type: 'web_search_20260209', name: 'web_search', max_uses: cfg.deep !== false ? 10 : 6 });
    const body = {
      model: api.model || TYPES.claude.model, max_tokens: 64000, stream: true,
      system: systemPrompt(webOn), messages: wire, tools,
      thinking: { type: 'adaptive', display: 'summarized' },
      output_config: { effort: cfg.deep !== false ? 'high' : 'medium' },
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
        const st = { id: u.id, name: u.name, label: (LABEL[u.name] || u.name) + (u.input && u.input.symbol ? ' ' + u.input.symbol : u.input && Array.isArray(u.input.symbols) ? ' ' + u.input.symbols.join(' · ') : ''), state: 'run' }; ui.steps.push(st); paint();
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
        const st = { id: tc.id, name: tc.function.name, label: (LABEL[tc.function.name] || tc.function.name) + (args.symbol ? ' ' + args.symbol : Array.isArray(args.symbols) ? ' ' + args.symbols.join(' · ') : ''), state: 'run' }; ui.steps.push(st); paint();
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
    ['오늘 시장 한눈에', '미국 · 한국 증시와 금리 · 환율 · 유가 흐름, 오늘 주목할 일정', '오늘 시장을 정리해 줘. get_briefing 으로 오늘 아침 큰 이슈와 증권사 시각을, 있으면 get_index 로 코스피 · 코스닥, get_macro 로 금리 · 환율을 먼저 확인하고, 그 뒤 필요한 것만 웹 검색으로 보완해. ① 한 줄 요약 ② 지수 · 금리 · 환율 숫자 ③ 큰 이슈 3가지와 증권사 시각 ④ 내 관심 종목(get_portfolio)에 미칠 영향 ⑤ 이번 주 일정 순서로.'],
    ['내 종목 점검', '보유 · 관심 종목의 추세 · 위험 · 다음 확인할 일', '내 관심 종목과 보유 종목을 get_portfolio 로 보고, 각 종목의 시세 · 추세 · 위험과 다음에 확인할 일을 표로 점검해 줘. 손절가나 비중이 위험해 보이면 짚어 줘.'],
    ['매수 전 따져 보기', '살까 말까 고민되는 종목을 결론 · 근거 · 반대 근거로', '매수를 고민하는 종목이 있어. 종목은 '],
    ['손절 · 목표가 · 수량', '감수할 손실에서 거꾸로 수량과 비중 계산', '계좌 금액 1000만 원, 한 번에 1% 까지 손실을 감수할 때, 종목 '],
    ['실적 발표 전 위험', '발표일 · 시장 기대 · 주가 반응 시나리오', '다가오는 실적 발표 전에 위험을 점검하고 싶어. 종목은 '],
    ['내 매매 습관 진단', '최근 매매를 적으면 잦은 매매 · 손절 미루기 등을 짚어 줌', '내 최근 매매를 적을 테니 습관의 문제(잦은 매매, 손절 미루기, 추격 매수, 몰빵 등)를 진단하고 고칠 규칙을 3개 만들어 줘.\n- '],
  ];
  function paint() { if (paint._r) return; paint._r = requestAnimationFrame(() => { paint._r = 0; renderMsgs(); }); }
  function renderMsgs() {
    const box = $('msgs'); const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    if (cur && !Array.isArray(cur.view)) cur.view = []; // 깨진 대화가 있어도 화면이 멈추지 않게
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
    $('deepWrap').hidden = !(a && a.type === 'claude'); $('deepOn').checked = cfg.deep !== false;
  }
  $('aiSel').onchange = e => { cfg.ai = e.target.value; saveCfg(); renderAiSel(); };
  $('webOn').onchange = e => { cfg.web = e.target.checked; saveCfg(); };
  $('deepOn').onchange = e => { cfg.deep = e.target.checked; saveCfg(); toast(e.target.checked ? '깊게 분석: 더 오래 생각하고 더 많이 찾습니다 (느리고 토큰을 더 씀)' : '보통 분석: 더 빠르게 답합니다', 2600); };
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
    quickAdd($('wQuick'), () => renderWatch());
    const items = watch.items; $('cWatch').textContent = items.length || '';
    let cost = 0, value = 0, priced = 0;
    const rows = items.map((it, i) => {
      const q = watch.quotes[normSym(it.symbol)] || watch.quotes[it.symbol] || {}, p = q.price, qty = +it.qty || 0, avg = +it.avg || 0;
      const pl = p && qty && avg ? (p - avg) * qty : null, plp = p && avg ? (p / avg - 1) * 100 : null;
      if (qty && avg && p) { cost += qty * avg; value += qty * p; priced++; }
      const toStop = p && it.stop ? (it.stop / p - 1) * 100 : null;
      const hit = p && ((it.alertHi && p >= +it.alertHi) || (it.alertLo && p <= +it.alertLo));
      return `<tr><td class="sym"><button type="button" class="st-link" data-open="${esc(normSym(it.symbol))}" title="종목 분석 열기"><b>${esc(it.name || it.symbol)}</b><span>${it.name ? esc(it.symbol) : ''}</span></button>${hit ? `<span class="sc-alert" title="알림 가격: ${it.alertHi ? num(+it.alertHi) + ' 이상 ' : ''}${it.alertLo ? num(+it.alertLo) + ' 이하' : ''}">알림 가격 도달</span>` : ''}</td>
        <td data-l="현재가" class="px">${num(p)}</td><td data-l="등락" class="chg ${cls(q.changePct)}">${pct(q.changePct)}</td>
        <td data-l="수량">${qty ? num(qty, 4) : '–'}</td><td data-l="평균 단가">${avg ? num(avg) : '–'}</td>
        <td data-l="평가 손익" class="${cls(pl)}">${pl == null ? '–' : num(pl, 0)}</td><td data-l="수익률" class="${cls(plp)}">${pct(plp)}</td>
        <td data-l="손절가">${it.stop ? num(it.stop) : '–'}${toStop != null ? `<br><span class="${toStop > -3 ? 'up' : ''}" style="font-size:var(--fs-xs)">${pct(toStop, 1)}</span>` : ''}</td><td data-l="목표가">${it.target ? num(it.target) : '–'}</td>
        <td class="memo">${esc(it.memo || '')}</td>
        <td class="ac"><span class="acts"><button class="btn ghost" data-ed="${i}" title="고치기" aria-label="${esc(it.symbol)} 고치기">${icon('edit', 15)}</button><button class="btn ghost" data-rm="${i}" title="빼기" aria-label="${esc(it.symbol)} 빼기">${icon('trash', 15)}</button></span></td></tr>`;
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
      ${f('symbol', '종목 코드 · 티커 · 이름', 't', '예: 005930 · 0190G0 · AAPL · 삼성전자')}<p class="hint" data-symhint>코드나 티커를 넣으면 이름이 저절로 채워집니다. 이름을 넣으면 고를 수 있게 보여 줍니다.</p>
      ${f('name', '이름 (저절로 채움 · 고쳐도 됨)', 't', '예: 삼성전자')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${f('qty', '보유 수량 (관심만 있으면 비움)', 'n')}${f('avg', '평균 단가', 'n')}${f('stop', '손절가', 'n')}${f('target', '목표가', 'n')}${f('alertHi', '알림: 이 가격 이상', 'n')}${f('alertLo', '알림: 이 가격 이하', 'n')}</div>
      <label>메모 · 매수 이유<textarea name="memo" rows="3" placeholder="왜 샀는지 · 무엇이 틀리면 팔지">${esc(it.memo || '')}</textarea></label>
      <div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">저장</button></div></form>`);
    const form = d.el.querySelector('form'); setTimeout(() => form.symbol.focus(), 30);
    d.el.querySelector('[data-x]').onclick = d.close;
    stkBind(form.symbol, form.name, d.el.querySelector('[data-symhint]'));
    form.onsubmit = async e => {
      e.preventDefault(); const o = {}; for (const k of ['symbol', 'name', 'qty', 'avg', 'stop', 'target', 'alertHi', 'alertLo', 'memo']) o[k] = form[k].value.trim();
      if (o.symbol && !stkLooksCode(o.symbol)) { const c = (await stkFind(o.symbol, 1).catch(() => []))[0]; if (c) { if (!o.name) o.name = c.name; o.symbol = c.code; } }
      o.symbol = normSym(o.symbol) || o.symbol.toUpperCase(); if (!o.symbol) { toast('종목 코드를 넣어 주세요', 1800); return; }
      if (!o.name) { const r = await stkName(o.symbol).catch(() => null); if (r) o.name = r.name; }
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
    ['지속 수익의 근거', '수익 엔진의 점검 항목이 기대는 연구 — 이기는 법보다 크게 지는 길을 피하는 법이 반복해서 확인됐습니다', [
      ['SPIVA U.S. Year-End 2025', '연구', '미국 대형주 액티브 펀드가 S&P 500 에 뒤진 비율: 1년 79% · 5년 89%. 상위 펀드가 다음 기간에도 상위에 남는 경우는 극소수.', '핵심(지수) 비중 · 지수 대비 점검', 'https://www.spglobal.com/spdji/en/spiva/article/spiva-us-year-end-2025/'],
      ['Barber · Odean (2000)', '연구', '6만 6천여 가구: 가장 많이 거래한 20% 의 연 수익 11.4%, 시장 17.9%. 비용 전 수익은 비슷 — 차이는 거래 비용과 빈도.', '회전율 점검 · 냉각 대기열', 'https://faculty.haas.berkeley.edu/odean/papers/returns/Returns.html'],
      ['Barber · Lee · Liu · Odean (2014)', '연구', '대만 데이트레이더 중 비용을 빼고도 꾸준히 이긴 사람은 1% 미만.', '단타 대신 결정 카드 · 점검일', 'https://econpapers.repec.org/RePEc:eee:finmar:v:18:y:2014:i:c:p:1-24'],
      ['Bessembinder (2018) · 외 (2023)', '연구', '미국 주식 58% 는 평생 수익이 단기 국채 미만, 상위 4% 종목이 초과 부(富) 전부를 만듦. 전 세계 6만 4천 종목도 같은 결과.', '한 종목 최대 비중 점검', 'https://wpcarey.asu.edu/sites/default/files/2021-10/do-stocks-outperform-treasury-bills.pdf'],
      ['자본시장연구원 (2021)', '연구', '2020년 이후 신규 개인투자자 62% 손실. 다음 날 이익 종목은 41% 팔고 손실 종목은 22% 만 팜(처분 효과). 1년 거래 이익 약 13조 원, 거래 비용 약 13.7조 원.', '손절가 점검 · 감정 매매 비율', 'https://www.fnnews.com/news/202104131912345956'],
      ['Morningstar Mind the Gap', '연구', '투자자가 실제로 얻은 수익이 펀드 수익보다 연 약 1.2%p 낮음 — 변동성 큰 상품일수록 차이가 큼(사고파는 시점의 실수).', '정해진 날 리밸런싱 · 냉각 시간', 'https://www.morningstar.com/business/insights/research/mind-the-gap-2025'],
      ['Thorp · MacLean · Ziemba (켈리 기준)', '연구', '이론상 최적 비중(켈리)으로 걸어도 50% 낙폭을 겪을 확률이 큼. 절반 켈리는 성장률의 약 3/4 을 지키면서 변동은 크게 줄임.', '1회 감수 손실 · 걸린 위험 합계', 'https://www.stat.berkeley.edu/~aldous/157/Papers/Good_Bad_Kelly.pdf'],
      ['Cheng · Madhavan (2009)', '연구', '레버리지 · 인버스 ETF 는 매일 비율을 맞춰 기간 수익이 지수 × 배수와 달라지고, 변동성이 클수록 손해.', '레버리지 점검', 'https://joim.com/dynamics-leveraged-inverse-exchange-traded-funds'],
      ['Harvey · Liu · Zhu (2016) · McLean · Pontiff (2016)', '연구', '보고된 팩터 316개 — 우연을 거르려면 t > 3. 예측 변수의 수익은 논문이 나온 뒤 58% 줄어듦.', '백테스트 결과는 할인해서 봄 (다음 단계)', 'https://www.nber.org/papers/w20592.pdf'],
      ['Gary Klein — 사전 실패 가정 (HBR 2007)', '방법', '"이미 실패했다"고 가정하고 이유를 쓰면 위험 요인을 약 30% 더 찾아냄. 성과를 직접 높인다는 증거는 아직 약함.', '냉각 대기열의 실패 가정 칸', 'https://hbr.org/2007/09/performing-a-project-premortem'],
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
  /* 추천 API — 무엇이 좋아지는지 · 어디서 키를 받는지 · [키 넣기] 한 번 (API 추가 카드는 그대로) */
  const RECO = [
    { type: 'claude', why: 'AI 두뇌 — 대화 · 분석 · 웹 검색', how: 'Anthropic Console 에서 키 만들기' },
    { type: 'datagokr', why: '국내 주식 시세 · 일봉 · 20년 차트', how: '공공데이터포털 「금융위원회_주식시세정보」 활용신청' },
    { type: 'etf', why: 'ETF 시세 · NAV · 기초지수 (0190G0 같은 ETF)', how: '같은 공공데이터포털 키 · 「금융위원회_증권상품시세정보」 활용신청' },
    { type: 'ksd', why: '종목 공식 기록 · 배당 순위 · 의무보호예수', how: '같은 공공데이터포털 키 · 「한국예탁결제원_주식정보서비스」' },
    { type: 'index', why: '코스피 · 코스닥 지수 흐름 — AI 가 시장 분위기를 숫자로', how: '같은 공공데이터포털 키 · 「금융위원회_지수시세정보」 활용신청' },
    { type: 'kisrelay', why: 'DART · 네이버 · ECOS · FRED 를 잇는 통로 (선택: KIS 실시간 현재가 · PER · PBR)', how: '내 Cloudflare 무료 중계 한 번 만들기 — KIS 앱키 없이도 됨' },
    { type: 'ecos', why: '기준금리 · 국고채 · 원/달러 환율', how: '한국은행 ECOS 인증키 신청 (Cloudflare 중계를 거침)' },
    { type: 'dart', why: '공시 목록 · 매출 · 영업이익 · 순이익 · 부채비율 · 회사 개요', how: 'OpenDART 인증키 신청 (Cloudflare 중계를 거침)' },
    { type: 'naver', why: '브리핑 이후 종목별 최신 국내 뉴스 — AI · 종목 분석 · 오늘 한눈에', how: '네이버 클라우드 NAVER API HUB → 뉴스 검색 (2026.7.31 부터 새 키는 여기서, Cloudflare 중계를 거침)', keyUrl: 'https://console.ncloud.com/', guide: 'naver' },
    { type: 'fred', why: '미국 국채 · 연준 금리 · 물가 · 실업률 — 미국장 영향', how: 'FRED 무료 가입 → API Keys (Cloudflare 중계를 거침)' },
    { type: 'finnhub', why: '미국 주식 시세 · 회사 뉴스', how: 'Finnhub 무료 가입 후 대시보드의 키' },
    { type: 'twelvedata', why: '미국 · 해외 종목 일봉 · 차트 (하루 800회)', how: 'Twelve Data 무료 가입 → API Keys' },
    { type: 'alphavantage', why: '미국 종목 일봉 · 뉴스 감성 점수 (하루 25회)', how: 'Alpha Vantage 무료 키 신청' },
    { type: 'tencent', why: '중국 A주(상하이 · 선전) · 홍콩 주식 현재가 · 일봉 · PER · 52주 고저', how: '키 필요 없음 — [추가] 한 번이면 끝 (공식 API 가 아니라 개인 참고용)' },
  ];
  function renderReco() {
    const box = $('apiReco'); if (!box) return;
    box.innerHTML = `<div class="sc-reco-h"><h2>추천 API</h2><p>키만 받아 오면 [키 넣기] 한 번으로 연결됩니다. 위에서부터 효과가 큰 순서입니다.</p></div>
      <div class="sc-reco">${RECO.map(r => {
        const T = r.type ? TYPES[r.type] : null, have = r.type && cfg.apis.find(a => a.type === r.type), ok = have && (hasKey(have) || noKey(have));
        const name = r.name || T.name, url = r.keyUrl || (T && T.keyUrl) || '';
        return `<div class="sc-reco-i${ok ? ' on' : ''}${r.soon ? ' soon' : ''}">
          <div class="t"><b>${esc(name)}</b>${ok ? `<span class="ks ok">${icon('check', 13)}연결됨</span>` : have ? '<span class="ks warn">키 없음</span>' : r.soon ? '<span class="ks">준비 중</span>' : ''}</div>
          <p class="why">${esc(r.why)}</p><p class="how">${esc(r.how)}</p>
          <div class="row">${url ? `<a class="btn sm ghost" href="${esc(url)}" target="_blank" rel="noopener">${icon('link', 14)}키 받으러 가기</a>` : ''}${r.guide === 'naver' ? `<button class="btn sm ghost" data-guide="naver">${icon('help', 14)}받는 법</button>` : ''}${r.soon ? `<span class="soon-n">${esc(r.note)}</span>` : ok ? `<button class="btn sm" data-reco-test="${have.id}">시험</button>` : T && T.nokey ? `<button class="btn sm ink" data-reco="${r.type}">${icon('plus', 14)}추가</button>` : `<button class="btn sm ink" data-reco="${r.type}">${icon('key', 14)}키 넣기</button>`}</div>
        </div>`;
      }).join('')}</div>`;
    fillIcons(box);
    box.querySelectorAll('[data-reco]').forEach(b => b.onclick = () => { const have = cfg.apis.find(a => a.type === b.dataset.reco); if (TYPES[b.dataset.reco].nokey) quickAdd(b.dataset.reco); else openAdd(b.dataset.reco, have || undefined); });
    box.querySelectorAll('[data-guide="naver"]').forEach(b => b.onclick = () => naverGuide());
    box.querySelectorAll('[data-reco-test]').forEach(b => b.onclick = () => testApi(cfg.apis.find(x => x.id === b.dataset.recoTest), b));
  }
  /* 키 없이 쓰는 종류: 창 없이 바로 추가하고 시험 */
  function quickAdd(t) {
    const T = TYPES[t], have = cfg.apis.find(a => a.type === t);
    if (have) { if (have.on === false) { have.on = true; saveCfg(); renderApis(); } testApi(have); return; }
    const o = { id: uid(), type: t, on: true, name: T.name, model: '', base: '', key: '', test: '' };
    cfg.apis.push(o); saveCfg(); renderApis(); toast(`${T.name} 를 추가했습니다`, 1800); testApi(o);
  }
  const FEATS = [
    { t: 'claude', n: 'AI 대화 · 분석', use: '대화 · 종목 종합 · 내 종목 점검', ai: true },
    { t: 'datagokr', n: '국내 시세 · 일봉 (종가)', use: '관심 종목 · 종목 분석 · 차트 · 지표' },
    { t: 'kisrelay', n: '실시간 시세 · PER · PBR', use: '장중 현재가 (KIS)', kis: true },
    { t: 'etf', n: 'ETF 시세 · NAV', use: 'ETF 종목 분석 · 괴리율' },
    { t: 'tencent', n: '중국 · 홍콩 시세', use: '중국 A주 · 홍콩 종목 분석 · 차트 (키 없음)' },
    { t: 'index', n: '코스피 · 코스닥 지수', use: '오늘 · 시장 · 상대 강도' },
    { t: 'ksd', n: '배당 · 보호예수 · 상장', use: '종목 분석 · 시장 데이터' },
    { t: 'dart', n: '공시 · 재무', use: '종목 분석 · 오늘 · 위험 공시', relay: true },
    { t: 'naver', n: '국내 최신 뉴스', use: '종목 분석 · 오늘 · AI', relay: true },
    { t: 'ecos', n: '금리 · 환율', use: '오늘 · 시장', relay: true },
    { t: 'fred', n: '미국 경제지표', use: '오늘 · AI', relay: true },
  ];
  function capState(f) {
    const api = f.ai ? activeAI() : f.kis ? (dataApis().find(kisOn) || relayApi()) : dataApis().find(a => a.type === f.t);
    if (!api) return { s: 'off', l: '없음', api: null, act: f.ai ? 'add' : 'add' };
    if (f.kis && api.kis === false) return { s: 'off', l: 'KIS 보류 · 종가로 대신', api, act: '' };
    if (f.relay && !relayApi()) return { s: 'warn', l: '중계가 있어야 함', api, act: 'relay' };
    if (!hasKey(api) && !noKey(api)) return { s: 'warn', l: '키 없음', api, act: 'edit' };
    if (api.test === 'ok') return { s: 'ok', l: '됨', api, act: '' };
    if (api.test) return { s: 'bad', l: api.test, api, act: 'test' };
    return { s: 'idle', l: '시험 전', api, act: 'test' };
  }
  function renderCaps() {
    const box = $('apiCaps'); if (!box) return;
    const rows = FEATS.map(f => ({ f, st: capState(f) })), ok = rows.filter(r => r.st.s === 'ok').length;
    const btn = (r, i) => r.st.act === 'add' ? `<button class="btn sm ghost" data-cap-add="${r.f.t}">연결</button>` : r.st.act === 'relay' ? `<button class="btn sm ghost" data-cap-add="kisrelay">중계 연결</button>` : r.st.act === 'edit' ? `<button class="btn sm ghost" data-cap-edit="${r.st.api.id}">키 넣기</button>` : r.st.act === 'test' ? `<button class="btn sm ghost" data-cap-test="${r.st.api.id}">시험</button>` : '';
    box.innerHTML = `<div class="sc-reco-h sc-caps-h"><div><h2>지금 되는 기능 <small>${ok} / ${rows.length}</small></h2><p>연결한 API 로 어떤 화면이 채워지는지 봅니다. 초록이 아닌 줄은 오른쪽 단추로 고칩니다.</p></div><button class="btn sm" id="capAll">${icon('check', 14)}모두 시험</button></div>
      <div class="sc-caps">${rows.map((r, i) => `<div class="sc-cap ${r.st.s}"><i class="dot" aria-hidden="true"></i><div class="tx"><b>${esc(r.f.n)}</b><small title="${esc(r.st.l)}">${esc(r.st.s === 'bad' || r.st.s === 'warn' || (r.st.s === 'off' && r.st.api) ? r.st.l : r.f.use)}</small></div>${r.st.s === 'bad' ? '<span class="lb">오류</span>' : r.st.s === 'off' && r.st.api ? '<span class="lb">보류</span>' : ''}${btn(r, i)}</div>`).join('')}</div>`;
    fillIcons(box);
    box.querySelectorAll('[data-cap-add]').forEach(b => b.onclick = () => { const t = b.dataset.capAdd, have = cfg.apis.find(a => a.type === t); if (TYPES[t] && TYPES[t].nokey) quickAdd(t); else openAdd(t, have || undefined); });
    box.querySelectorAll('[data-cap-edit]').forEach(b => b.onclick = () => openAdd(null, cfg.apis.find(a => a.id === b.dataset.capEdit)));
    box.querySelectorAll('[data-cap-test]').forEach(b => b.onclick = () => testApi(cfg.apis.find(a => a.id === b.dataset.capTest), b));
    $('capAll').onclick = async ev => {
      const b = ev.currentTarget, list = cfg.apis.filter(a => a.on !== false && (hasKey(a) || noKey(a)));
      if (!list.length) { toast('시험할 API 가 없습니다 — 먼저 연결해 주세요', 2200); return; }
      if (cfg.lock && !(await unlock())) return;
      b.disabled = true; let n = 0;
      for (const a of list) { b.textContent = `시험 중 ${++n} / ${list.length}`; await testApi(a, null, true); }
      const bad = list.filter(a => a.test !== 'ok');
      toast(bad.length ? `${list.length - bad.length}개 통과 · ${bad.length}개 확인 필요: ${bad.map(a => a.name).join(', ')}` : `${list.length}개 모두 통과했습니다`, 4200);
    };
  }
  function renderApis() {
    $('cApi').textContent = cfg.apis.length || ''; renderReco(); renderCaps();
    $('apiNote').innerHTML = `${icon('shield', 15)}<span>키는 <b>이 기기의 이 브라우저에만</b> 저장되고 GitHub · 다른 기기로 가지 않습니다. 같은 주소(github.io)의 다른 페이지도 브라우저 저장소를 읽을 수 있으니 <b>잠금 암호</b>를 걸어 두기를 권합니다. 주문(매수 · 매도) 기능은 없습니다.</span>`;
    const cur = activeAI();
    $('apiGrid').innerHTML = cfg.apis.map(a => {
      const T = TYPES[a.type] || {}; const ai = T.kind === 'ai';
      const k = cfg.lock ? (keyMem ? keyMem[a.id] : '') : a.key;
      const ks = hasKey(a) ? (k ? `<span class="ks ok">${icon('check', 13)}이 기기에 있음</span> ${esc(mask(k))}` : `<span class="ks ok">${icon('lock', 13)}있음 · 잠김</span>`) : noKey(a) ? '<span class="ks">필요 없음</span>' : remoteHas(a.id) ? '<span class="ks warn">다른 기기에 있음 · 받기 전</span>' : (sy.on ? '<span class="ks bad">이 기기에 없음 — 다른 기기에서 넣었다면 그 기기에서 SECRET 을 한 번 열면 저절로 옮겨 옵니다 · 아니면 [고치기] 로 넣기</span>' : '<span class="ks bad">없음 — [고치기] 로 넣기 (기기 연결을 켜면 다른 기기의 키도 저절로 옮겨 옵니다)</span>');
      return `<div class="sc-api${a.on === false ? ' off' : ''}"><div class="h"><span class="kind ${ai ? '' : 'data'}">${ai ? 'AI' : '시세'}</span><b title="${esc(a.name)}">${esc(a.name)}</b></div>
        <dl><dt>종류</dt><dd>${esc(T.name || a.type)}</dd><dt>키</dt><dd>${ks}</dd>${ai ? `<dt>모델</dt><dd>${esc(a.model || T.model || '–')}</dd>` : ''}${a.base ? `<dt>주소</dt><dd title="${esc(a.base)}">${esc(a.base)}</dd>` : ''}${a.type === 'kisrelay' ? `<dt>제공</dt><dd>DART · 네이버 · ECOS · FRED 통로${a.kis === false ? ' · <b>KIS 보류</b>' : ' · KIS 현재가 · 일봉'}</dd>` : !ai ? `<dt>제공</dt><dd>${(T.caps || []).map(c => ({ quote: '현재가', history: '일봉', news: '뉴스', custom: '원문', ksd: '종목 기본정보 · 상장 · 배당 · 의무보호예수', macro: '금리 · 환율', index: '코스피 · 코스닥 지수', dart: '공시 · 재무 · 회사 개요', newsKR: '국내 최신 뉴스', usmacro: '미국 금리 · 물가 · 고용' })[c]).join(' · ')}</dd>` : ''}</dl>
        <span class="st ${a.test === 'ok' ? 'ok' : a.test ? 'bad' : ''}">${a.test === 'ok' ? '시험 통과' : a.test ? esc(a.test) : '아직 시험하지 않음'}</span>
        <div class="row">${ai ? `<label class="use"><input type="radio" name="useAi" value="${a.id}"${cur && cur.id === a.id ? ' checked' : ''}${a.on === false ? ' disabled' : ''}>대화에 쓰기</label>` : `<label class="use"><input type="checkbox" data-on="${a.id}"${a.on !== false ? ' checked' : ''}>사용</label>${a.type === 'kisrelay' ? `<label class="use" title="끄면 KIS 시세는 쉬고, 국내 시세는 공공데이터포털(종가)로 봅니다. 중계 통로는 그대로"><input type="checkbox" data-kis="${a.id}"${a.kis !== false ? ' checked' : ''}>KIS</label>` : ''}`}<span class="grow"></span>
          <button class="btn sm" data-test="${a.id}">시험</button><button class="btn sm ghost icon" data-edit="${a.id}" title="고치기" aria-label="고치기">${icon('edit', 15)}</button><button class="btn sm ghost icon" data-rm="${a.id}" title="지우기" aria-label="지우기">${icon('trash', 15)}</button></div></div>`;
    }).join('') + `<button class="sc-api sc-add" id="apiPlus">${icon('plus', 26)}<b>API 추가</b><span style="font-size:var(--fs-xs)">AI · 시세 API 를 여러 개 붙일 수 있습니다</span></button>`;
    $('apiPlus').onclick = () => openAdd();
    $('apiGrid').querySelectorAll('[name=useAi]').forEach(r => r.onchange = () => { cfg.ai = r.value; saveCfg(); renderAiSel(); });
    $('apiGrid').querySelectorAll('[data-on]').forEach(c => c.onchange = () => { const a = cfg.apis.find(x => x.id === c.dataset.on); a.on = c.checked; saveCfg(); renderApis(); });
    $('apiGrid').querySelectorAll('[data-kis]').forEach(c => c.onchange = () => { const a = cfg.apis.find(x => x.id === c.dataset.kis); a.kis = c.checked; a.test = ''; saveCfg(); renderApis(); toast(c.checked ? 'KIS 시세를 다시 씁니다 — [시험] 으로 확인하세요' : 'KIS 를 보류했습니다 — 국내 시세는 공공데이터포털(종가), 중계 통로는 그대로', 3000); });
    $('apiGrid').querySelectorAll('[data-test]').forEach(b => b.onclick = () => testApi(cfg.apis.find(x => x.id === b.dataset.test), b));
    $('apiGrid').querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openAdd(null, cfg.apis.find(x => x.id === b.dataset.edit)));
    $('apiGrid').querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => {
      const a = cfg.apis.find(x => x.id === b.dataset.rm);
      if (!(await confirmBox(`${a.name} 를 지울까요?`, '이 기기에 저장한 키도 함께 지웁니다.', '지우기'))) return;
      cfg.apis = cfg.apis.filter(x => x !== a); if (keyMem) { delete keyMem[a.id]; if (lockKey) await sealKeys(); } if (cfg.ai === a.id) cfg.ai = ''; saveCfg(); markKey(a.id); renderApis(); renderAiSel();
    });
    $('lockBox').innerHTML = cfg.lock
      ? `<div><b>키 잠금 켜짐</b> — 키를 암호로 감싸 두었습니다. ${(() => { const r = LS.get(K_REMEMBER, null), ok = remembered(); return ok ? `<b>이 기기에서 기억 중</b> (${Math.max(1, Math.ceil((r.exp - Date.now()) / 864e5))}일 남음) — 암호를 묻지 않습니다.` : keyMem ? '지금은 풀려 있습니다 (이 화면을 닫으면 다시 잠깁니다).' : '키가 필요할 때 암호를 한 번 묻습니다.'; })()}</div>${keyMem ? '' : '<button class="btn" id="lkOpen">풀기</button>'}${remembered() ? '<button class="btn ghost" id="lkForget">기억 지우기</button>' : ''}${remoteMissing() ? `<button class="btn" id="lkGet">${icon('key', 15)}다른 기기 키 받기</button>` : ''}<button class="btn ghost" id="lkOff">잠금 끄기</button>`
      : `<div><b>키 잠금 꺼짐 (선택)</b> — 키는 잠금 없이도 기기끼리 저절로 옮겨집니다. 이 기기 안에서도 키를 암호로 감싸 두려면 잠금을 거세요. 암호를 잊으면 키를 다시 등록해야 합니다.</div><button class="btn" id="lkOn">${icon('lock', 15)}잠금 암호 걸기</button>${remoteMissing() ? `<button class="btn" id="lkGet">${icon('key', 15)}다른 기기 키 받기</button>` : ''}`;
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
  async function testApi(a, btn, quiet) {
    if (btn) btn.disabled = true;
    try {
      const k = await keyOf(a); if (!k && !noKey(a)) throw new Error('키가 비어 있습니다');
      if (a.type === 'claude') {
        const r = await fetch('https://api.anthropic.com/v1/models?limit=1', { headers: { 'x-api-key': k, 'anthropic-version': '2026-10-21', 'anthropic-dangerous-direct-browser-access': 'true' } });
        if (!r.ok) { let j = null; try { j = await r.json(); } catch (e) { } throw new Error(apiErr(r.status, j, 'Claude')); }
      } else if (isAI(a)) {
        const base = String(a.base || TYPES[a.type].base || '').replace(/\/+$/, '');
        const r = await fetch(base + '/models', { headers: { Authorization: 'Bearer ' + k } });
        if (!r.ok) { let j = null; try { j = await r.json(); } catch (e) { } throw new Error(apiErr(r.status, j, TYPES[a.type].name)); }
      } else {
        const T = TYPES[a.type]; const s = a.type === 'datagokr' || a.type === 'kisrelay' ? '005930' : a.type === 'tencent' ? 'hk00700' : 'AAPL';
        if (a.type === 'naver') { const n = await DATA.naver.search(k, '삼성전자', 1); if (!n.items.length) throw new Error('네이버: 검색 결과가 없습니다'); }
        else if (a.type === 'fred') { await DATA.fred.overview(k); }
        else if (a.type === 'dart') { const d = await DATA.dart.disclosures(k, '005930', 30); if (!d.company) throw new Error('DART: 삼성전자를 찾지 못했습니다'); }
        else if (a.type === 'ecos') { await DATA.ecos.macro(k); }
        else if (a.type === 'index') { await DATA.index.get(k, ['코스피']); }
        else if (a.type === 'etf') { await DATA.etf.quote(k, '069500'); } // KODEX 200
        else if (a.type === 'kisrelay') {
          const base = String(a.base || '').trim().replace(/\/+$/, '');
          if (!/^https:\/\/[^/]+/.test(base)) throw new Error('중계 주소를 넣어 주세요 (https://….workers.dev)');
          let r; try { r = await fetch(base + '/ping', { headers: { 'x-relay-key': String(k).trim() } }); } catch (e) { throw new Error('중계에 연결하지 못했습니다 — 중계 주소를 확인하세요'); }
          const j = await r.json().catch(() => null);
          if (!r.ok || !j || !j.ok) throw new Error('중계: ' + ((j && j.error) || ('HTTP ' + r.status)));
          if (dataApis().some(x => ['dart', 'naver', 'ecos', 'fred'].includes(x.type)) && !(await relayFresh(base, k))) throw new Error(OLD_RELAY);
          if (a.kis !== false) {
            if (j.kis === false) throw new Error('중계는 됩니다. 다만 KIS 앱키가 중계에 없습니다 — KIS 를 보류하려면 카드의 「KIS」 를 끄세요');
            try { await DATA.kisrelay.quote(k, '005930', a); } catch (e) { throw new Error(e.message.replace(/^KIS 중계: /, 'KIS: ') + ' — 중계 통로는 됩니다. KIS 를 보류하려면 카드의 「KIS」 를 끄세요'); }
          }
        }
        else if (a.type === 'ksd') { const r = await DATA.ksd.call(k, 'getStkIsinByShortIsinN1', { shortIsin: '005930' }); if (!r.items.length) throw new Error('예탁결제원: 시험 종목(005930)을 찾지 못했습니다'); }
        else if (T.caps.includes('quote')) await DATA[a.type].quote(k, s, a); else await DATA.custom.custom(k, s, a);
      }
      a.test = 'ok'; if (!quiet) toast(`${a.name}: 연결됐습니다${a.type === 'kisrelay' && a.kis === false ? ' (KIS 보류 · 중계 통로만)' : ''}`, 2000);
    } catch (e) {
      a.test = /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? '연결 실패 (네트워크 · 브라우저 차단)' : scrub(e.message).slice(0, 160);
      if (!quiet) toast(`${a.name}: ${a.test}`, 4000);
    } finally { saveCfg(); if (btn) btn.disabled = false; renderApis(); }
  }
  function naverGuide() {
    const d = dialog(`<h3>네이버 뉴스 키 받는 법 (NAVER API HUB)</h3>
      <p class="modal-desc">네이버가 <b>2026년 7월 31일부터 검색 API 새 신청을 개발자센터에서 막고</b>, 네이버 클라우드의 <b>NAVER API HUB</b> 로 옮겼습니다. (개발자센터에서 "신규로 등록할 수 없는 API" 가 뜨는 이유) 이미 받아 둔 개발자센터 키가 있으면 그것도 그대로 됩니다.</p>
      <ol class="sc-steps">
        <li><a href="https://www.ncloud.com/" target="_blank" rel="noopener"><b>네이버 클라우드 플랫폼</b></a> 에 로그인 (네이버 아이디로 가입 가능)</li>
        <li><a href="https://console.ncloud.com/" target="_blank" rel="noopener"><b>콘솔</b></a> → 메뉴 <b>All Services → Application Services → NAVER API HUB</b> → <b>[신청하기]</b> → Subscription 에서 <b>[서비스 이용 신청]</b> (약관 동의)</li>
        <li>NAVER API HUB 의 <b>Application → [Application 등록]</b> → API 에서 <b>뉴스 검색</b> 을 고르고 [다음] → 이름(예: DPV) → 등록</li>
        <li><b>Application 관리</b> 에서 만든 것을 고르고 <b>[인증 정보]</b> → <b>Client ID</b> 와 <b>Client Secret</b> 복사</li>
        <li>SECRET 네이버 카드의 <b>[키 넣기]</b> → <b>Client ID</b> · <b>Client Secret</b> 칸에 각각 붙여 넣고 [추가하고 시험]</li>
      </ol>
      <p class="hint">요금은 네이버 클라우드 안내를 확인하세요 (검색 API 는 한시적 무료로 안내된 적이 있음). 네이버 뉴스는 Cloudflare 중계를 거치므로, 시험에서 "중계 코드가 예전 것" 이라고 나오면 [중계 코드 복사] 로 Cloudflare 코드를 한 번 바꿔 주세요. 자세한 공식 안내: <a href="https://guide.ncloud-docs.com/docs/apihub-overview" target="_blank" rel="noopener">NAVER API HUB 개요</a></p>
      <div class="actions"><a class="btn ink" href="https://console.ncloud.com/" target="_blank" rel="noopener">${icon('link', 16)}네이버 클라우드 콘솔 열기</a><button class="btn" data-x>닫기</button></div>`, 'sc-dlg');
    d.el.querySelector('[data-x]').onclick = d.close;
  }
  function kisGuide() {
    const d = dialog(`<h3>Cloudflare 중계 만드는 법 (한 번만, 약 5분)</h3>
      <p class="modal-desc">OpenDART · 네이버 뉴스 · 한국은행 ECOS · FRED · 한국투자증권은 웹페이지에서 직접 부르는 것을 막아 두어서, 내 계정의 작은 중계(Cloudflare Worker, 무료)를 거칩니다. 중계는 <b>조회만</b> 하며 주문 기능이 없습니다. <b>KIS 앱키는 선택</b>입니다 — 없으면 KIS 시세만 빠지고 나머지는 그대로 됩니다.</p>
      <ol class="sc-steps">
        <li><a href="https://dash.cloudflare.com/sign-up" target="_blank" rel="noopener">Cloudflare</a> 에 무료로 가입하고 로그인합니다.</li>
        <li>왼쪽 메뉴 <b>Workers &amp; Pages</b>(또는 Compute) → <b>Create</b> → <b>Hello World</b> 로 시작 → 이름을 <b>dpv-kis</b> 로 → <b>Deploy</b>.</li>
        <li><b>Edit code</b> → 원래 코드를 모두 지우고, 아래 <b>[중계 코드 복사]</b> 한 것을 붙여 넣기 → <b>Deploy</b>.</li>
        <li>그 Worker 의 <b>Settings → Variables and Secrets → Add</b> 에서 종류를 <b>Secret</b> 으로 넣습니다.<br><code>RELAY_KEY</code> = [중계 암호 만들기] 로 만든 값 (꼭 필요)<br><small>KIS 실시간 시세도 쓰려면 <code>KIS_APPKEY</code> = 앱키 · <code>KIS_APPSECRET</code> = 앱시크릿 (모의투자 앱키면 <code>KIS_MOCK</code> = <code>1</code> 도). KIS 를 보류하면 이 둘은 넣지 않아도 됩니다.</small></li>
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
      <div class="sc-kis" id="nvHelp" hidden><button type="button" class="btn sm" id="nvGuide">${icon('help', 14)}네이버 키 받는 법</button><a class="btn sm" href="https://console.ncloud.com/" target="_blank" rel="noopener">${icon('link', 14)}네이버 클라우드 콘솔 열기</a></div>
      <label class="sc-chk" id="fKis" hidden><input type="checkbox" name="kis"${edit ? (a.kis !== false ? ' checked' : '') : ''}><span>KIS 실시간 시세도 쓰기 <small>앱키 · 앱시크릿을 중계에 넣었을 때만. 끄면 중계는 DART · 네이버 · ECOS · FRED 통로로만 씁니다.</small></span></label>
      <div class="sc-kis" id="kisHelp" hidden><button type="button" class="btn sm" id="kisGuide">${icon('help', 14)}중계 만드는 법</button><button type="button" class="btn sm" id="kisGen">${icon('lock', 14)}중계 암호 만들기</button></div>
      <label>이름<input type="text" name="name" value="${esc(a.name)}" placeholder="예: 내 Claude"></label>
      <label><span id="fKeyL">API 키</span><input type="password" name="key" placeholder="${edit ? '바꿀 때만 넣으세요' : '키를 붙여 넣으세요'}" autocomplete="off"></label>
      <label id="fSecret" hidden>Client Secret<input type="password" name="secret" placeholder="${edit ? '바꿀 때만 넣으세요' : 'Client Secret 을 붙여 넣으세요'}" autocomplete="off"></label>
      <label id="fModel">모델<input type="text" name="model" value="${esc(a.model || '')}"></label>
      <label id="fBase">주소<input type="text" name="base" value="${esc(a.base || '')}"></label>
      <div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">${edit ? '저장' : '추가하고 시험'}</button></div></form>`);
    const f = d.el.querySelector('form');
    const sync = () => {
      const T = TYPES[f.type.value]; const ai = T.kind === 'ai';
      $('tNote').innerHTML = esc(T.note || '') + (T.keyUrl ? ` <a href="${T.keyUrl}" target="_blank" rel="noopener">키 발급 페이지</a>` : '');
      $('fModel').hidden = !ai; f.model.placeholder = f.type.value === 'claude' ? 'claude-opus-5-5 (비우면 기본)' : '예: 해당 회사의 모델 이름';
      const kis = f.type.value === 'kisrelay'; $('kisHelp').hidden = !kis; $('fKis').hidden = !kis;
      const nv = f.type.value === 'naver'; $('nvHelp').hidden = !nv; $('fSecret').hidden = !nv; $('fKeyL').textContent = nv ? 'Client ID' : 'API 키';
      $('fKeyL').parentElement.hidden = !!T.nokey; // 키 없이 쓰는 종류는 키 칸을 숨김
      $('fBase').hidden = !(kis || f.type.value === 'compat' || f.type.value === 'custom' || (ai && f.type.value !== 'claude' && edit));
      f.base.placeholder = kis ? 'https://dpv-kis.○○○.workers.dev' : f.type.value === 'custom' ? 'https://…?symbol={symbol}&apikey={key}' : (T.base || 'https://…/v1');
      f.key.placeholder = kis ? '중계 암호 ([중계 암호 만들기] 로 만든 값)' : nv ? (edit ? '바꿀 때만 넣으세요' : 'Client ID 를 붙여 넣으세요') : (edit ? '바꿀 때만 넣으세요' : '키를 붙여 넣으세요');
      if (!f.name.value || f.name.dataset.auto || Object.values(TYPES).some(x => x.name === f.name.value)) { f.name.value = T.name; f.name.dataset.auto = '1'; }
    };
    f.name.oninput = () => { delete f.name.dataset.auto; };
    $('kisGuide').onclick = () => kisGuide();
    $('nvGuide').onclick = () => naverGuide();
    $('kisGen').onclick = async () => { // 긴 무작위 암호 — 이 칸과 Cloudflare 의 RELAY_KEY 에 같은 값
      const v = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');
      f.key.type = 'text'; f.key.value = v;
      try { await navigator.clipboard.writeText(v); toast('중계 암호를 만들어 복사했습니다 — Cloudflare 의 RELAY_KEY 에 붙여 넣으세요', 4200); } catch (e) { f.key.select(); toast('중계 암호를 만들었습니다 — 칸의 값을 복사해 Cloudflare 의 RELAY_KEY 에 넣으세요', 4200); }
    };
    f.type.onchange = sync; sync(); setTimeout(() => (edit ? f.name : f.key).focus(), 30);
    d.el.querySelector('[data-x]').onclick = d.close;
    f.onsubmit = async e => {
      e.preventDefault();
      const t = f.type.value, T = TYPES[t];
      let key = f.key.value.trim();
      if (t === 'naver') { const sec = f.secret.value.trim(); if (key && !key.includes(':')) { if (!sec) { toast('Client Secret 도 넣어 주세요', 2000); return; } key = key + ':' + sec; } else if (!key && sec) { toast('Client ID 도 넣어 주세요', 2000); return; } } // 두 칸 → 「아이디:시크릿」
      if (!edit && !key && t !== 'custom' && !T.nokey) { toast('API 키를 넣어 주세요', 1800); return; }
      if ((t === 'compat' || t === 'custom' || t === 'kisrelay') && !f.base.value.trim()) { toast(t === 'kisrelay' ? '중계 주소를 넣어 주세요 ([중계 만드는 법] 5번)' : '주소를 넣어 주세요', 2200); return; }
      if (T.kind === 'ai' && t !== 'claude' && !f.model.value.trim()) { toast('모델 이름을 넣어 주세요', 1800); return; }
      const o = edit || { id: uid(), type: t, on: true };
      if (edit && !isAI(edit) && T.kind === 'data' && o.type !== t) { if (o.name === TYPES[o.type].name) o.name = ''; o.type = t; } // 종류 바꾸기 (키는 그대로)
      if (t === 'kisrelay') o.kis = !!f.kis.checked;
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
    track: [], // 키워드 추적 [{ k, at }]
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
  /* =====================================================================
     결정 카드 채점 — 점검일 · 손절 규율 · 지수 대비 (일봉으로 계산, AI 없이)
     ===================================================================== */
  const AIOP = ['AI 와 같은 의견', 'AI 는 신중 · 반대', 'AI 에게 묻지 않음'];
  const todayStr = () => new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10); // 한국 날짜
  const d10 = x => { const s = String(x || ''); return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : s.slice(0, 10).replace(/\//g, '-'); };
  const curOf = s => { const c = cnSym(s); return c ? (c.startsWith('hk') ? 'HKD' : 'CNY') : isKR(s) ? 'KRW' : 'USD'; };
  /* 같은 시장의 지수 대신 그 지수를 따라가는 ETF 로 (시세 API 하나로 일봉을 받을 수 있게) */
  const benchOf = s => { const c = cnSym(s); return c ? (c.startsWith('hk') ? { sym: 'hk02800', name: '항셍지수 (TraHK)' } : { sym: 'sh510300', name: 'CSI300 (중국)' }) : isKR(s) ? { sym: '069500', name: '코스피200 (KODEX 200)' } : { sym: 'SPY', name: 'S&P500 (SPY)' }; };
  const isDue = t => !isClosed(t) && t.reviewDate && t.reviewDate <= todayStr();
  /* 계좌 규모: "3000만 원" · "1억 5000만" · 30000000 → 원 */
  const parseWon = v => { let sum = 0, hit = false; const re = /(\d+(?:\.\d+)?)\s*(조|억|천만|백만|만|천)?/g, U = { 조: 1e12, 억: 1e8, 천만: 1e7, 백만: 1e6, 만: 1e4, 천: 1e3 }; let m; const t = String(v || '').replace(/,/g, ''); while ((m = re.exec(t))) { hit = true; sum += +m[1] * (U[m[2]] || 1); } return hit ? sum : NaN; };
  const accountWon = () => { const c = +(LS.get(K_CALC, {}).cAcc || 0); return c > 0 ? c : parseWon(me.profile.account); };
  const barCache = new Map(); // 이 화면을 연 동안만: 종목 → 일봉
  async function barsOf(sym, n) {
    const k = String(sym).toUpperCase(), c = barCache.get(k);
    if (c && c.n >= n && Date.now() - c.at < 30 * 6e4) return c.bars;
    const bars = (await callData('history', sym, n)).map(b => Object.assign({}, b, { t: d10(b.t) })).filter(b => b.t && isFinite(b.c));
    barCache.set(k, { n, at: Date.now(), bars }); return bars;
  }
  async function scoreTrade(t) {
    const e = +t.entry, st = +t.stop, tg = +t.target, risk = st > 0 ? Math.abs(e - st) : 0, today = todayStr();
    const open = d10(t.openDate) || today, closed = isClosed(t), end = closed ? d10(t.closeDate) || today : today;
    const n = Math.min(400, Math.ceil(Math.max(1, (Date.parse(today) - Date.parse(open)) / 864e5) * 0.75) + 20);
    const bars = await barsOf(t.symbol, n), after = bars.filter(b => b.t > open && b.t <= end);
    const live = watch.quotes[String(t.symbol).toUpperCase()], lastBar = bars[bars.length - 1];
    const px = closed ? +t.exit : live && live.price && live.time && Date.now() - new Date(live.time) < 6 * 36e5 ? live.price : lastBar ? lastBar.c : null;
    const R = v => risk > 0 && v != null ? Math.round((v - e) / risk * 100) / 100 : null, r1 = v => v == null ? null : Math.round(v * 10) / 10;
    const lo = b => isFinite(b.l) && b.l > 0 ? b.l : b.c, hi = b => isFinite(b.h) && b.h > 0 ? b.h : b.c;
    const stopBar = st > 0 && st < e ? after.find(b => lo(b) <= st) : null, tgtBar = tg > e ? after.find(b => hi(b) >= tg) : null;
    let below = 0; if (!closed && st > 0) for (let i = after.length - 1; i >= 0 && after[i].c < st; i--) below++;
    const heldPast = !!(closed && stopBar && +t.exit < st && (!t.closeDate || stopBar.t < d10(t.closeDate)));
    const ret = px ? (px / e - 1) * 100 : null;
    let bench = null;
    const B = benchOf(t.symbol);
    try {
      const bb = await barsOf(B.sym, Math.max(n, 60)), b0 = bb.find(b => b.t >= open), b1 = [...bb].reverse().find(b => b.t <= end);
      if (b0 && b1 && b1.t >= b0.t) bench = { sym: B.sym, name: B.name, ret: r1((b1.c / b0.c - 1) * 100), from: b0.t, to: b1.t };
    } catch (err) { bench = { sym: B.sym, name: B.name, err: String(err.message || err).slice(0, 80) }; }
    const mfe = after.length ? Math.max(...after.map(hi)) : null, mae = after.length ? Math.min(...after.map(lo)) : null;
    const status = closed ? (heldPast ? '손절 미룸' : t.exitReason || '청산')
      : below > 0 ? `손절선 아래 ${below}일째` : stopBar ? '손절가 닿음 · 보유 중' : tgtBar ? '목표가 닿음 · 보유 중' : isDue(t) ? '점검일 지남' : '진행 중';
    return { at: Date.now(), done: closed, px, r: R(px), ret: r1(ret), bench, excess: bench && bench.ret != null && ret != null ? r1(ret - bench.ret) : null,
      stopHit: stopBar ? stopBar.t : '', targetHit: tgtBar ? tgtBar.t : '', first: stopBar && tgtBar ? (stopBar.t <= tgtBar.t ? 'stop' : 'target') : stopBar ? 'stop' : tgtBar ? 'target' : '',
      daysBelowStop: below, heldPastStop: heldPast, extraLossR: heldPast && risk > 0 ? Math.round(((+t.exit - st) / risk) * 100) / 100 : 0,
      mfeR: R(mfe), maeR: R(mae), bars: after.length, status };
  }
  let scoring = false;
  async function autoScore(force) {
    if (scoring || !dataFor('history')) return 0; scoring = true;
    const stale = journal.filter(t => t.symbol && +t.entry > 0 && (force || !t.score || (!t.score.done && Date.now() - t.score.at > 6 * 36e5) || (isClosed(t) && !t.score.done)));
    let changed = 0;
    try {
      for (const t of stale) {
        try { const sc = await scoreTrade(t), was = JSON.stringify(Object.assign({}, t.score || {}, { at: 0 })); t.score = sc; t.scoreErr = ''; if (JSON.stringify(Object.assign({}, sc, { at: 0 })) !== was) { t.updated = Date.now(); changed++; } }
        catch (e) { if (t.scoreErr !== String(e.message || e).slice(0, 120)) { t.scoreErr = String(e.message || e).slice(0, 120); changed++; } }
      }
    } finally { scoring = false; }
    if (changed) saveJournal(); else LS.set(K_JOURNAL, journal);
    if (!$('vJournal').hidden) renderJournal(true);
    return stale.length;
  }
  /* 성적표: 기간 안에서 시작한 결정만 */
  function reportCard(period) {
    const today = todayStr(), from = period === 'year' ? today.slice(0, 4) + '-01-01' : period === '90' ? new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10) : '';
    const L = journal.filter(t => +t.entry > 0 && (!from || d10(t.openDate) >= from)), C = L.filter(isClosed);
    const avg = a => { a = a.filter(v => v != null && isFinite(v)); return a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100) / 100 : null; };
    const grp = (list, key) => { const o = {}; for (const t of list) { const k = key(t) || '미기록'; (o[k] = o[k] || []).push(t); } return Object.fromEntries(Object.entries(o).map(([k, a]) => [k, { n: a.length, winPct: Math.round(a.filter(t => +t.exit > +t.entry).length / a.length * 100), avgR: avg(a.map(jR)), avgRet: avg(a.map(t => (+t.exit / +t.entry - 1) * 100)), avgExcess: avg(a.map(t => t.score && t.score.excess)) }])); };
    const withB = C.filter(t => t.score && t.score.excess != null), stopTouched = C.filter(t => t.score && t.score.stopHit), held = C.filter(t => t.score && t.score.heldPastStop);
    const gaveBack = C.filter(t => t.score && t.score.mfeR != null && +t.target > +t.entry && t.score.mfeR >= 0.8 * ((+t.target - +t.entry) / Math.abs(+t.entry - +t.stop || 1)) && +t.exit <= +t.entry);
    return {
      period: period || 'all', decisions: L.length, closed: C.length, open: L.length - C.length, due: L.filter(isDue).length,
      vsIndex: { n: withB.length, avgReturnPct: avg(withB.map(t => t.score.ret)), avgIndexPct: avg(withB.map(t => t.score.bench.ret)), avgExcessPct: avg(withB.map(t => t.score.excess)), beatPct: withB.length ? Math.round(withB.filter(t => t.score.excess > 0).length / withB.length * 100) : null },
      openVsIndex: { n: L.filter(t => !isClosed(t) && t.score && t.score.excess != null).length, avgExcessPct: avg(L.filter(t => !isClosed(t) && t.score).map(t => t.score.excess)) },
      byChecklist: grp(C, t => t.checkTotal ? ((t.checks || []).length >= t.checkTotal ? '모두 지킴' : '일부만 지킴') : ''),
      byAI: grp(C, t => t.ai), byEmotion: grp(C, t => t.emotion),
      stopDiscipline: { touched: stopTouched.length, heldPast: held.length, extraLossR: Math.round(held.reduce((a, t) => a + (t.score.extraLossR || 0), 0) * 100) / 100, openBelow: L.filter(t => !isClosed(t) && t.score && t.score.daysBelowStop > 0).map(t => ({ symbol: t.symbol, days: t.score.daysBelowStop })) },
      gaveBack: gaveBack.length,
    };
  }
  function cardVerdict(c) {
    const v = c.vsIndex;
    if (!c.decisions) return '아직 결정 카드가 없습니다. 사기 전에 [결정 카드] 로 이유 · 손절 · 목표 · 점검일을 적으면, 점검일마다 자동으로 채점합니다.';
    if (v.n < 10) return `지수와 비교된 끝난 결정이 ${v.n}건입니다. 10건이 넘으면 "내 방식이 지수를 사 두는 것보다 나은가" 를 말할 수 있습니다.`;
    return v.avgExcessPct > 0 ? `끝난 결정 ${v.n}건이 같은 기간 지수보다 평균 ${v.avgExcessPct}%p 높았습니다 (지수를 이긴 비율 ${v.beatPct}%). 표본이 늘어도 유지되는지 계속 봅니다.`
      : `끝난 결정 ${v.n}건이 같은 기간 지수보다 평균 ${Math.abs(v.avgExcessPct)}%p 낮았습니다 (지수를 이긴 비율 ${v.beatPct}%). 지금까지의 기록으로는 개별 종목 선택이 지수를 사 두는 것보다 못했다는 뜻입니다.`;
  }
  const EMO = ['계획대로 차분히', '확신', '불안', '조급함 (놓칠까 봐)', '만회하려고', '지루해서'];
  const EXITR = ['목표가 도달', '손절가 도달', '계획을 바꿈 (근거 있음)', '감정적으로 (불안 · 조급)', '기타'];
  function renderJournal(noScore) {
    const st = jStats(); $('cJournal').textContent = journal.length || '';
    renderCard();
    if (!noScore) setTimeout(() => autoScore(false), 50);
    const R = v => v == null ? '–' : (v > 0 ? '+' : '') + v + 'R';
    $('jSum').innerHTML = `<div><span>끝난 매매 · 보유 중</span><b>${st.closedTrades} · ${st.openTrades}</b></div><div><span>승률</span><b>${st.winRatePct == null ? '–' : st.winRatePct + '%'}</b></div><div><span>평균 이익 · 평균 손실</span><b>${R(st.avgWinR)} · ${R(st.avgLossR)}</b></div><div><span>1회 기대값</span><b class="${cls(st.expectancyR)}">${R(st.expectancyR)}</b></div><div><span>손익 합계</span><b class="${cls(st.totalPnl)}">${st.closedTrades ? num(st.totalPnl, 0) : '–'}</b></div><div><span>평균 보유</span><b>${st.avgHoldDays == null ? '–' : st.avgHoldDays + '일'}</b></div>`;
    const list = journal.map((t, i) => [t, i]).sort((a, b) => (isClosed(a[0]) - isClosed(b[0])) || String(b[0].openDate || '').localeCompare(String(a[0].openDate || '')));
    const rows = list.map(([t, i]) => {
      const closed = isClosed(t), sc = t.score || null, q0 = (watch.quotes[String(t.symbol || '').toUpperCase()] || {}).price, q = q0 || (sc && !closed ? sc.px : null);
      const px = closed ? +t.exit : q, risk = Math.abs(+t.entry - +t.stop);
      const warn = sc && (sc.daysBelowStop > 0 || sc.heldPastStop || (!closed && sc.stopHit)), due = isDue(t);
      const r = px && risk > 0 ? (px - +t.entry) / risk : null, ret = px ? (px / +t.entry - 1) * 100 : null, pnl = px && t.qty ? (px - +t.entry) * +t.qty : null;
      return `<tr${due ? ' class="due"' : ''}><td>${esc(t.openDate || '')}${closed && t.closeDate ? `<br><span style="font-size:var(--fs-xs);color:var(--ui-muted)">→ ${esc(t.closeDate)}</span>` : t.reviewDate ? `<br><span class="rv${due ? ' on' : ''}">점검 ${esc(t.reviewDate.slice(5))}</span>` : ''}</td>
        <td class="sym"><b>${esc(t.symbol)}</b>${sc ? `<span class="sc-tag${warn ? ' warn' : closed ? '' : ' open'}">${esc(sc.status)}</span>` : closed ? `<span class="sc-tag">${esc(t.exitReason || '청산')}</span>` : '<span class="sc-tag open">보유 중</span>'}${t.ai ? `<span class="sc-ai">${esc(t.ai)}</span>` : ''}</td>
        <td>${num(+t.entry)}</td><td>${t.qty ? num(+t.qty, 4) : '–'}</td><td>${t.stop ? num(+t.stop) : '–'}</td><td>${t.target ? num(+t.target) : '–'}</td>
        <td>${closed ? num(+t.exit) : q ? `<span title="현재가">${num(q)}</span>` : '–'}</td>
        <td class="${cls(r)}">${r == null ? '–' : (r > 0 ? '+' : '') + r.toFixed(2) + 'R'}<br><span style="font-size:var(--fs-xs)">${pct(ret, 1)}</span>${sc && sc.excess != null ? `<br><span class="vs ${cls(sc.excess)}" title="같은 기간 ${esc(sc.bench.name)} ${pct(sc.bench.ret, 1)}">지수 대비 ${sc.excess > 0 ? '+' : ''}${sc.excess}%p</span>` : t.scoreErr ? `<br><span class="vs" title="${esc(t.scoreErr)}">채점 못 함</span>` : ''}</td>
        <td class="${cls(pnl)}">${pnl == null ? '–' : num(pnl, 0)}</td>
        <td>${esc(t.emotion || '–')}</td><td>${t.checkTotal ? `${(t.checks || []).length}/${t.checkTotal}` : '–'}</td>
        <td class="why">${t.reason ? `<b>이유</b> ${esc(t.reason)}` : ''}${t.lesson ? `<br><b>교훈</b> ${esc(t.lesson)}` : ''}</td>
        <td><span class="acts"><button class="btn ghost" data-jed="${i}" title="고치기 · 청산 적기" aria-label="${esc(t.symbol)} 고치기">${icon('edit', 15)}</button><button class="btn ghost" data-jrm="${i}" title="지우기" aria-label="${esc(t.symbol)} 지우기">${icon('trash', 15)}</button></span></td></tr>`;
    }).join('');
    $('jTable').innerHTML = `<thead><tr><th>날짜</th><th class="sym">종목</th><th>진입가</th><th>수량</th><th>손절</th><th>목표</th><th>청산 · 현재가</th><th>결과</th><th>손익</th><th>그때 감정</th><th>체크</th><th>이유 · 교훈</th><th></th></tr></thead><tbody>${rows || '<tr><td class="empty" colspan="13">아직 기록이 없습니다. 사기 전에 [결정 카드] 로 이유 · 손절가 · 목표가 · 점검일을 적고, 팔 때 같은 줄을 열어 청산가와 교훈을 적으세요.</td></tr>'}</tbody>`;
    const bc = st.byChecklist, a = bc['체크리스트 모두 지킴'], b = bc['일부만 지킴'];
    $('jNote').textContent = (st.closedTrades < 5 ? `끝난 매매가 ${st.closedTrades}건입니다. 5건 이상 쌓이면 통계가 의미 있어지고, 20건 이상이면 계산기의 승률로 쓸 만합니다. ` : '') + (a && b ? `체크리스트를 다 지켰을 때 승률 ${a.winRatePct}% (${a.trades}건) · 일부만 지켰을 때 ${b.winRatePct}% (${b.trades}건). ` : '') + 'R = (청산가 − 진입가) ÷ (진입가 − 손절가). 1R 은 처음 정한 손실 한 번만큼입니다.';
    $('jTable').querySelectorAll('[data-jed]').forEach(b => b.onclick = () => editTrade(+b.dataset.jed));
    $('jTable').querySelectorAll('[data-jrm]').forEach(b => b.onclick = async () => { const t = journal[+b.dataset.jrm]; if (await confirmBox(`${t.symbol} 기록을 지울까요?`, '매매 일지에서 지웁니다.', '지우기')) { journal.splice(+b.dataset.jrm, 1); if (t.id) SYNCQ.tomb('journal', t.id); saveJournal(); renderJournal(); } });
  }
  function editTrade(i) {
    const today = new Date().toISOString().slice(0, 10);
    const t = i == null ? { openDate: today, symbol: '', entry: '', qty: '', stop: '', target: '', reason: '', emotion: '', checks: [], closeDate: '', exit: '', exitReason: '', lesson: '', reviewDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), ai: '', fx: '' } : Object.assign({}, journal[i]);
    const v = k => esc(t[k] == null ? '' : t[k]);
    const n = (k, l) => `<label>${l}<input type="number" step="any" min="0" name="${k}" value="${v(k)}"></label>`;
    const checks = me.checklist.map((c, j) => `<label><input type="checkbox" name="ck" value="${esc(c)}"${(t.checks || []).includes(c) ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('');
    const d = dialog(`<h3>${i == null ? '결정 카드 — 사기 전에' : esc(t.symbol) + ' 결정 카드'}</h3>${i == null ? '<p class="modal-desc">이유와 손절가를 한 문장으로 못 쓰면 사지 않는 것이 원칙입니다. 점검일이 되면 SECRET 이 결과 · 손절 규율 · 같은 기간 지수 대비를 자동으로 채점합니다.</p>' : ''}<form class="sc-form">
      <div class="grid3"><label>산 날<input type="date" name="openDate" value="${v('openDate')}"></label><label>종목<input type="text" name="symbol" value="${v('symbol')}" placeholder="예: 005930 · AAPL · hk00700"></label>${n('entry', '진입가')}${n('stop', '손절가 (틀렸다고 인정할 곳)')}${n('target', '목표가')}${n('qty', '수량')}</div>
      <div class="sc-qty"><label class="fx">환율 (1 단위 = 원)<input type="number" step="any" min="0" name="fx" value="${v('fx')}" placeholder="해외 종목만"></label><button type="button" class="btn sm" data-qty>${icon('calc', 14)}위험 기준 수량 계산</button><span class="sc-qty-o" data-qo></span></div>
      <label>산 이유 (한두 문장)<textarea name="reason" rows="2" placeholder="예: 실적 서프라이즈 뒤 20일선 지지 확인">${v('reason')}</textarea></label>
      <div class="grid3"><label>그때 감정<select name="emotion"><option value="">고르기</option>${EMO.map(o => `<option${t.emotion === o ? ' selected' : ''}>${o}</option>`).join('')}</select></label><label>AI 의견<select name="ai"><option value="">고르기</option>${AIOP.map(o => `<option${t.ai === o ? ' selected' : ''}>${o}</option>`).join('')}</select></label><label>점검일<input type="date" name="reviewDate" value="${v('reviewDate')}"></label></div>
      ${me.checklist.length ? `<fieldset><legend>매수 전 체크리스트 (지킨 것)</legend><div class="sc-checks">${checks}</div></fieldset>` : ''}
      <fieldset><legend>판 뒤에 적기 (보유 중이면 비워 둠)</legend>
        <div class="grid3"><label>판 날<input type="date" name="closeDate" value="${v('closeDate')}"></label>${n('exit', '청산가')}<label>판 이유<select name="exitReason"><option value="">고르기</option>${EXITR.map(o => `<option${t.exitReason === o ? ' selected' : ''}>${o}</option>`).join('')}</select></label></div>
        <label>배운 것<textarea name="lesson" rows="2" placeholder="예: 손절가를 미뤄서 손실이 2배가 됐다">${v('lesson')}</textarea></label>
      </fieldset>
      <div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">저장</button></div></form>`, 'sc-dlg wide');
    const f = d.el.querySelector('form'); setTimeout(() => (i == null ? f.symbol : f.exit).focus(), 30); d.el.querySelector('[data-x]').onclick = d.close;
    const fxShow = () => { const s = f.symbol.value.trim(); f.fx.closest('label').hidden = !s || curOf(s) === 'KRW'; f.fx.placeholder = s ? `1 ${curOf(s)} = ? 원` : '해외 종목만'; };
    f.symbol.addEventListener('input', fxShow); fxShow();
    d.el.querySelector('[data-qty]').onclick = () => { // 1회 감수 손실(나의 원칙) · 한 종목 최대 비중으로 수량
      const out = d.el.querySelector('[data-qo]'), e0 = +f.entry.value, s0 = +f.stop.value, acc = accountWon(), cur = curOf(f.symbol.value.trim()), fx = cur === 'KRW' ? 1 : +f.fx.value;
      const rk = +me.profile.riskTrade || 1, mp = +me.profile.maxPos || 100;
      if (!(acc > 0)) { out.innerHTML = '<b>나의 원칙</b> 의 계좌 규모(또는 계산기의 계좌 금액)를 넣으면 계산합니다'; return; }
      if (!(e0 > 0 && s0 > 0 && e0 !== s0)) { out.textContent = '진입가와 손절가를 먼저 넣어 주세요'; return; }
      if (!(fx > 0)) { out.textContent = `해외 종목이라 환율(1 ${cur} = ? 원)이 필요합니다`; return; }
      const byRisk = Math.floor(acc * rk / 100 / (Math.abs(e0 - s0) * fx)), byPos = Math.floor(acc * mp / 100 / (e0 * fx)), q = Math.max(0, Math.min(byRisk, byPos));
      f.qty.value = q; const cost = q * e0 * fx;
      out.innerHTML = `계좌 ${num(acc / 1e4, 0)}만 원 · 1회 손실 ${rk}% (${num(acc * rk / 100 / 1e4, 1)}만 원) → <b>${num(q, 0)}주</b> · 투입 ${num(cost / 1e4, 0)}만 원 (계좌의 ${num(cost / acc * 100, 1)}%)${byPos < byRisk ? ` — 한 종목 최대 비중 ${mp}% 때문에 ${num(byRisk, 0)}주에서 줄임` : ''}`;
    };
    f.onsubmit = e => {
      e.preventDefault();
      const o = { id: t.id || uid() };
      for (const k of ['openDate', 'symbol', 'reason', 'emotion', 'closeDate', 'exitReason', 'lesson', 'ai', 'reviewDate']) o[k] = f[k].value.trim();
      for (const k of ['entry', 'qty', 'stop', 'target', 'exit', 'fx']) o[k] = f[k].value === '' ? '' : +f[k].value;
      o.symbol = o.symbol.toUpperCase();
      if (!o.symbol || !(o.entry > 0)) { toast('종목과 진입가를 넣어 주세요', 2000); return; }
      if (o.exit && !o.closeDate) o.closeDate = today;
      o.checks = [...f.querySelectorAll('[name=ck]:checked')].map(x => x.value); o.checkTotal = me.checklist.length;
      if (t.score && ['openDate', 'symbol', 'entry', 'stop', 'target', 'exit', 'closeDate'].every(k => String(o[k]) === String(t[k] == null ? '' : t[k]))) o.score = t.score; // 바뀐 게 없으면 채점 그대로, 바뀌면 다시
      o.updated = Date.now(); if (i == null) journal.push(o); else journal[i] = o; saveJournal(); d.close(); renderJournal();
      if (!o.stop) toast('손절가가 없으면 R(손익비) 과 손절 규율을 채점할 수 없습니다', 2600);
      else if (!o.reason) toast('산 이유가 비어 있습니다 — 한 문장이라도 적어 두면 나중에 무엇이 통했는지 알 수 있습니다', 3200);
    };
  }
  function renderCard() {
    const box = $('jCard'); if (!box) return;
    const per = box.dataset.per || 'all', c = reportCard(per), R = v => v == null ? '–' : (v > 0 ? '+' : '') + v + 'R', P = v => v == null ? '–' : (v > 0 ? '+' : '') + v + '%p';
    const rows = o => Object.entries(o).map(([k, x]) => `<tr><th>${esc(k)}</th><td>${x.n}건</td><td>${x.winPct}%</td><td class="${cls(x.avgR)}">${R(x.avgR)}</td><td class="${cls(x.avgExcess)}">${P(x.avgExcess)}</td></tr>`).join('') || '<tr><td class="empty" colspan="5">끝난 결정이 없습니다</td></tr>';
    const tbl = (h, o) => `<section><h3>${h}</h3><table class="sc-mini"><thead><tr><th></th><th>건수</th><th>승률</th><th>평균 R</th><th>지수 대비</th></tr></thead><tbody>${rows(o)}</tbody></table></section>`;
    const v = c.vsIndex, sd = c.stopDiscipline;
    box.innerHTML = `<div class="sc-rc-h"><h2>성적표</h2><div class="sc-tools"><select id="jPer" aria-label="기간"><option value="all"${per === 'all' ? ' selected' : ''}>전체</option><option value="year"${per === 'year' ? ' selected' : ''}>올해</option><option value="90"${per === '90' ? ' selected' : ''}>최근 90일</option></select><button class="btn sm" id="jScore">${icon('refresh', 14)}지금 채점</button></div></div>
      ${c.due ? `<p class="sc-due">${icon('alert', 15)}점검일이 된 결정 ${c.due}건 — 줄을 열어 계속 가질지 · 팔지 정하고, 계속 가지면 점검일을 새로 정하세요.</p>` : ''}
      <p class="sc-rc-v">${esc(cardVerdict(c))}</p>
      <div class="sc-rc-g">
        <section><h3>같은 기간 지수 대비</h3><dl class="sc-kv2"><div><dt>끝난 결정 평균 수익률</dt><dd class="${cls(v.avgReturnPct)}">${v.avgReturnPct == null ? '–' : pct(v.avgReturnPct, 1)}</dd></div><div><dt>같은 기간 지수</dt><dd>${v.avgIndexPct == null ? '–' : pct(v.avgIndexPct, 1)}</dd></div><div><dt>평균 초과 (지수를 이긴 비율)</dt><dd class="${cls(v.avgExcessPct)}">${P(v.avgExcessPct)}${v.beatPct != null ? ` · ${v.beatPct}%` : ''}</dd></div><div><dt>보유 중 평균 초과</dt><dd class="${cls(c.openVsIndex.avgExcessPct)}">${P(c.openVsIndex.avgExcessPct)}</dd></div></dl></section>
        <section><h3>손절 규율</h3><dl class="sc-kv2"><div><dt>손절가에 닿은 끝난 결정</dt><dd>${sd.touched}건</dd></div><div><dt>그중 손절을 미룬 것</dt><dd class="${sd.heldPast ? 'bad' : ''}">${sd.heldPast}건</dd></div><div><dt>미뤄서 더 잃은 것</dt><dd class="${sd.extraLossR < 0 ? 'bad' : ''}">${sd.extraLossR ? R(sd.extraLossR) : '–'}</dd></div><div><dt>지금 손절선 아래 보유</dt><dd class="${sd.openBelow.length ? 'bad' : ''}">${sd.openBelow.length ? sd.openBelow.map(x => `${esc(x.symbol)} ${x.days}일`).join(' · ') : '없음'}</dd></div><div><dt>목표 근처까지 갔다가 손실로 끝남</dt><dd>${c.gaveBack}건</dd></div></dl></section>
        ${tbl('원칙 (체크리스트)', c.byChecklist)}
        ${tbl('AI 의견', c.byAI)}
      </div>
      <p class="sc-fine" style="text-align:left">지수 대비 = 내 수익률 − 같은 날짜 사이 ${esc('그 시장 지수 ETF')} 수익률 (한국 KODEX 200 · 미국 SPY · 중국 CSI300 · 홍콩 TraHK). 수수료 · 세금 · 환율 효과는 빠져 있습니다.</p>`;
    fillIcons(box);
    $('jPer').onchange = e => { box.dataset.per = e.target.value; renderCard(); };
    $('jScore').onclick = async () => { const b = $('jScore'); b.disabled = true; barCache.clear(); const n = await autoScore(true); toast(n ? `결정 ${n}건을 다시 채점했습니다` : dataFor('history') ? '채점할 결정이 없습니다' : '일봉을 주는 시세 API 가 있어야 채점합니다', 2400); };
  }
  $('jAdd').onclick = () => editTrade(null);
  $('jAsk').onclick = () => { show('chat'); send('get_journal 로 내 결정 카드와 성적표를 보고 회고해 줘: 같은 기간 지수 대비 성과(내 방식이 지수를 사 두는 것보다 나은지), 손절 규율(미룬 횟수와 그 비용), 체크리스트를 지켰을 때와 아닐 때, AI 의견을 따랐을 때와 아닐 때의 차이, 반복되는 실수 3가지, 그리고 내 규칙에 더하면 좋을 규칙 3가지. 표본이 적으면 그 한계부터 말해 줘.'); };
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
  $('wAuto').onchange = e => { cfg.auto = +e.target.value; saveCfg(); setAuto(); toast(cfg.auto ? `${cfg.auto}분마다 시세를 다시 불러옵니다 (이 화면을 열어 둔 동안)${realtimeOn() ? '' : ' — 지금 국내 시세는 종가 기준이라 장중에는 거의 바뀌지 않습니다'}` : '자동 새로 고침을 껐습니다', 3200); };

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
  const briefUrl = (f, ref) => `https://raw.githubusercontent.com/${briefRepo()}/${ref || 'briefing'}/${f}${ref ? '' : `?v=${Math.floor(Date.now() / 300000)}`}`;
  /* 방금 올라온 판이 바로 보이게: briefing 브랜치의 최신 커밋 번호로 읽음 (raw 서버는 브랜치 주소를 5분쯤 예전 것으로 보여 줌). 실패하면 브랜치 주소로 */
  let briefRef = { sha: '', at: 0 };
  async function latestRef() {
    if (briefRef.sha && Date.now() - briefRef.at < 60000) return briefRef.sha;
    try { const r = await fetch(`https://api.github.com/repos/${briefRepo()}/commits/briefing`, { headers: { accept: 'application/vnd.github.sha' }, cache: 'no-store' }); if (r.ok) { const t = (await r.text()).trim(); if (/^[0-9a-f]{40}$/.test(t)) briefRef = { sha: t, at: Date.now() }; } } catch (e) { }
    return briefRef.sha;
  }
  const bui = { dates: null, date: '', cache: {} };
  async function getBrief(f) {
    if (bui.cache[f]) return bui.cache[f];
    const ref = await latestRef();
    let r = await fetch(briefUrl(f, ref), { cache: 'no-store' });
    if (ref && !r.ok && r.status !== 404) r = await fetch(briefUrl(f), { cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('브리핑을 불러오지 못했습니다 (' + r.status + ')');
    const j = await r.json(); bui.cache[f] = j; return j;
  }
  async function briefingForAI(focus, date) {
    const ok = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
    const m = await getBrief(ok(date) ? date + '.json' : 'latest.json').catch(() => null);
    const st = await getBrief(ok(date) ? 'strategy/' + date + '.json' : 'strategy/latest.json').catch(() => null);
    if (!m && !st) throw new Error('브리핑 자료를 받지 못했습니다');
    const hit = t => !focus || String(t || '').toLowerCase().includes(focus.toLowerCase());
    const cut = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t; };
    const issues = m ? (m.items || []).filter(x => hit(x.title + ' ' + (x.keywords || []).join(' ') + ' ' + (x.related || []).map(r => r.title).join(' '))).map(x => ({ rank: x.rank, title: x.title, category: x.category, outlets: x.sources, source: x.source, time: x.time, also: (x.related || []).slice(0, 2).map(r => `${r.source}: ${r.title}`) })) : [];
    const feeds = !m || !m.byFeed ? [] : Array.isArray(m.byFeed) ? m.byFeed.map(f => [f.name, f.items]) : Object.entries(m.byFeed); // [{ name, items }] (예전 모양도)
    const extra = focus ? feeds.flatMap(([feed, list]) => (Array.isArray(list) ? list : []).filter(x => hit(x.title)).map(x => ({ feed, title: x.title, source: x.source, time: x.time }))).slice(0, 12) : [];
    const rep = (list, n, len) => (list || []).filter(x => hit(x.title + ' ' + x.summary)).slice(0, n).map(x => ({ broker: x.broker, kind: x.kindName, date: x.date, title: x.title, reads: x.reads, summary: cut(x.summary, len) }));
    return {
      morning: m ? { date: m.date, builtAt: m.generatedAt, picked: `${m.issues || ''}개 이슈 중 여러 언론이 함께 다룬 큰 이슈`, issues, moreFromFeeds: extra.length ? extra : undefined } : null,
      strategy: st ? { date: st.date, builtAt: st.generatedAt, dailyDate: st.dailyDate, daily: rep(st.daily, focus ? 8 : 10, focus ? 700 : 420), weekly: rep(st.weekly, focus ? 5 : 6, 300), topWords: (st.dailyKeywords || []).slice(0, 12).map(k => `${k.word}(${k.count})`).join(', ') } : null,
      note: '아침 8시 전까지 여러 번 보강하는 자료. 이후 소식은 웹 검색으로 보완',
    };
  }
  async function renderBrief(force) {
    const box = $('bList');
    if (force) { bui.cache = {}; bui.dates = null; }
    box.innerHTML = '<div class="sc-bmsg">불러오는 중…</div>';
    const actions = `https://github.com/${briefRepo()}/actions/workflows/morning-briefing.yml`;
    let idx;
    try { idx = await getBrief('index.json'); } catch (e) { box.innerHTML = `<div class="sc-bmsg">${esc(e.message)}. 인터넷 연결을 확인하고 [다시 불러오기] 를 눌러 주세요.</div>`; return; }
    if (!idx || !(idx.dates || []).length) {
      box.innerHTML = `<div class="sc-bmsg"><b>아직 브리핑이 없습니다.</b><br>매일 아침 6시부터 GitHub 이 뉴스를 모아 8시 전까지 여러 번 보강해 여기에 올립니다. 지금 바로 받으려면 <a href="${actions}" target="_blank" rel="noopener">GitHub Actions 의 Morning briefing</a> 에서 [Run workflow] 를 누르고, 1~2분 뒤 [다시 불러오기] 를 누르세요.</div>`;
      $('bDate').innerHTML = ''; return;
    }
    bui.dates = idx.dates; if (!bui.date || !bui.dates.includes(bui.date)) bui.date = bui.dates[0];
    $('bDate').innerHTML = bui.dates.map(d => { const x = new Date(d + 'T00:00'); return `<option value="${d}"${d === bui.date ? ' selected' : ''}>${x.getMonth() + 1}월 ${x.getDate()}일 (${'일월화수목금토'[x.getDay()]})${d === ymdLocal(new Date()) ? ' · 오늘' : ''}</option>`; }).join('');
    const i = bui.dates.indexOf(bui.date); $('bPrev').disabled = i >= bui.dates.length - 1; $('bNext').disabled = i <= 0;
    let d; try { d = await getBrief(bui.date + '.json'); } catch (e) { box.innerHTML = `<div class="sc-bmsg">${esc(e.message)}</div>`; return; }
    if (!d) { box.innerHTML = '<div class="sc-bmsg">이 날의 브리핑 파일이 없습니다.</div>'; return; }
    const t = d.generatedAt ? new Date(d.generatedAt) : null;
    $('bLead').innerHTML = `${t ? `${t.getMonth() + 1}월 ${t.getDate()}일 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')} 에 만듦 · ` : ''}뉴스 피드 ${d.feedsOk}/${d.feeds}곳 · 기사 ${num(d.articles, 0)}건 → 이슈 ${num(d.issues, 0)}개 중 <b>여러 언론이 함께 다룬 주식 관련 큰 이슈 ${d.items.length}개</b>. AI 토큰은 쓰지 않습니다. ${morningNote(bui.dates[0])}`;
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
  /* 아침 6~8시(한국): '보강 중', 8시가 지나면 '오늘 판 완성'. 열어 둔 동안 15분마다 새로 받아 옴 */
  const kstNow = () => new Date(Date.now() + 9 * 36e5);
  function morningNote(latest) {
    const k = kstNow(), today = k.toISOString().slice(0, 10), h = k.getUTCHours();
    if (latest && latest !== today && h >= 8) return `<span class="sc-late">오늘(${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일) 판이 아직 올라오지 않아 ${latest.slice(5).replace('-', '월 ')}일 판을 보여 줍니다 — GitHub 예약 실행이 늦어지고 있습니다. 올라오는 대로 이 화면이 저절로 바꿉니다.</span>`;
    const m = k.getUTCMinutes(); return h >= 6 && (h < 8) ? `<b>지금 보강 중</b> — 8시 전까지 15분마다 새로 받아 옵니다.` : h >= 8 ? '오늘 아침 판 (6시~7시 45분 여러 번 보강해 8시 전에 완성).' : '오늘 아침 6시부터 보강을 시작해 8시 전에 완성합니다.'; }
  setInterval(() => {
    const h = kstNow().getUTCHours(), m = kstNow().getUTCMinutes();
    if (document.visibilityState !== 'visible' || !(h >= 5 && h < 11)) return; // 아침 5~11시: 늦은 판도 저절로 받아 옴
    if (!$('vBrief').hidden) renderBrief(true); else if (!$('vStrat').hidden) renderStrat(true); else if (!$('vSum').hidden) renderSum(true);
  }, 15 * 60000);
  $('bDate').onchange = e => { bui.date = e.target.value; renderBrief(); };
  $('bPrev').onclick = () => { const i = bui.dates.indexOf(bui.date); if (i < bui.dates.length - 1) { bui.date = bui.dates[i + 1]; renderBrief(); } };
  $('bNext').onclick = () => { const i = bui.dates.indexOf(bui.date); if (i > 0) { bui.date = bui.dates[i - 1]; renderBrief(); } };

  /* =====================================================================
     수익 엔진 — "꾸준히 수익을 이어가는 조건"을 내 실제 자료(보유 · 결정 카드 · 원칙)로 매일 점검
     · 예측이 아니라 규칙: 핵심(지수)/위성 비중 · 한 종목 비중 · 손절 · 열린 위험 · 계좌 낙폭 · 회전율 · 기대값 · 지수 대비 · 체크리스트 · 감정 매매
     · 낙폭 서킷 브레이커: 고점 대비 하락이 허용치의 절반이면 새 매매 크기를 절반, 허용치면 새 매매 중지
     · 리밸런싱: 목표 비중에서 허용 폭 이상 벗어나면 얼마를 옮길지
     · 냉각 대기열: 사고 싶은 종목을 바로 사지 않고 사전 실패 가정(프리모템)과 함께 정한 시간 동안 묵힘
     · 세금: 해외 주식 실현 손익과 연 250만 원 기본 공제, 절세 계좌 한도
     근거: 레퍼런스 화면 · docs/secret-super-platform.md
     ===================================================================== */
  const K_ENG = 'sec:engine';
  const ENG0 = { plan: { core: 70, sat: 25, cash: 5, band: 5, heatMax: 6, coolH: 24, turnMax: 100 }, cash: '', fx: { USD: 1400, HKD: 180, CNY: 195 }, coreSyms: [], satSyms: [], equity: [], ideas: [], kisHide: 0 };
  const eng = Object.assign(JSON.parse(JSON.stringify(ENG0)), LS.get(K_ENG, {}));
  eng.plan = Object.assign({}, ENG0.plan, eng.plan); eng.fx = Object.assign({}, ENG0.fx, eng.fx);
  const saveEng = () => { LS.set(K_ENG, eng); SYNCQ.mark('engine'); };
  /* 세금 · 계좌 상수 (2026년 기준 — 바뀌면 여기만 고침) */
  const TAX = {
    overseasRate: 0.22, overseasDeduction: 2500000, // 해외 주식 양도소득세 22%(지방세 포함), 연 250만 원 기본 공제, 해외끼리 손익 통산
    dividendRate: 0.154, finIncomeThreshold: 20000000, // 배당 · 이자 15.4%, 연 2천만 원 넘으면 금융소득 종합과세
    isaYear: 20000000, pensionCredit: 9000000, // ISA 연 납입 한도, 연금저축 + IRP 세액공제 대상 한도
    basis: '2026년 기준 · 세법 개정 시 달라질 수 있음',
  };
  const LEV = /레버리지|인버스|곱버스|2X|3X|ULTRA|BULL|BEAR|TQQQ|SQQQ|SOXL|SOXS|UPRO|SPXU|TMF|LABU|FNGU/i;
  const COREPAT = /^(KODEX|TIGER|ACE|RISE|SOL|HANARO|KOSEF|ARIRANG|PLUS|KIWOOM|1Q|TIME|WON)\b|ETF|^(SPY|VOO|IVV|VTI|VT|QQQ|QQQM|SCHD|VXUS|VEA|VWO|BND|AGG|TLT|IEF|SHY|GLD|IAU|DIA|RSP|SPLG|ITOT|IEFA|IEMG)$/i;
  const symU = s => String(s || '').trim().toUpperCase();
  const isLev = it => LEV.test(`${it.symbol || ''} ${it.name || ''}`);
  function bucketOf(it) {
    const s = symU(it.symbol);
    if (eng.coreSyms.includes(s)) return 'core';
    if (eng.satSyms.includes(s)) return 'sat';
    return !isLev(it) && (COREPAT.test(s) || COREPAT.test(String(it.name || '').trim())) ? 'core' : 'sat';
  }
  const fxOf = s => { const c = curOf(s); return c === 'KRW' ? 1 : (+eng.fx[c] || 0); };
  function holdings() {
    return watch.items.filter(it => +it.qty > 0 && it.symbol).map(it => {
      const s = symU(it.symbol), q = watch.quotes[s], px = q && isFinite(q.price) && q.price > 0 ? +q.price : (+it.avg || 0), fx = fxOf(s);
      const value = px * (+it.qty) * fx, cost = (+it.avg || 0) * (+it.qty) * fx;
      const risk = +it.stop > 0 && px > +it.stop ? (px - +it.stop) * (+it.qty) * fx : (+it.stop > 0 ? 0 : null);
      return { symbol: s, name: it.name || '', qty: +it.qty, price: px, priced: !!(q && q.price), value, cost, pnl: value - cost, stop: +it.stop || 0, risk, bucket: bucketOf(it), lev: isLev(it), cur: curOf(s), fxMissing: !fx };
    });
  }
  /* 월말(또는 아무 때) 평가액 기록 → 고점 대비 하락 */
  function ddInfo() {
    const e = eng.equity.filter(x => +x.v > 0).sort((a, b) => a.d.localeCompare(b.d));
    if (!e.length) return null;
    let peak = 0, peakD = ''; for (const x of e) if (+x.v > peak) { peak = +x.v; peakD = x.d; }
    const last = e[e.length - 1], dd = peak ? (+last.v / peak - 1) * 100 : 0;
    return { peak, peakDate: peakD, last: +last.v, lastDate: last.d, ddPct: R2(dd), points: e.length };
  }
  function engineState() {
    const H = holdings(), cash = parseWon(eng.cash) || 0;
    const invested = H.reduce((a, h) => a + h.value, 0), total = invested + cash;
    const coreV = H.filter(h => h.bucket === 'core').reduce((a, h) => a + h.value, 0), satV = invested - coreV;
    const pct = v => total > 0 ? R2(v / total * 100) : null;
    const p = eng.plan, maxPos = +me.profile.maxPos || 20, maxDD = +me.profile.maxDD || 20;
    const st = journal.length ? jStats() : null, rc = journal.length ? reportCard('all') : null;
    const yearAgo = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
    const tradedYear = journal.filter(t => +t.entry > 0 && +t.qty > 0 && d10(t.openDate) >= yearAgo);
    const buyAmt = tradedYear.reduce((a, t) => a + (+t.entry) * (+t.qty) * (curOf(t.symbol) === 'KRW' ? 1 : (+t.fx || fxOf(t.symbol) || 0)), 0);
    const turnover = total > 0 ? R2(buyAmt / total * 100) : null;
    const dd = ddInfo();
    const C = [];
    const add = (id, title, status, value, why, fix, ref) => C.push({ id, title, status, value, why, fix, ref });
    // 1 핵심/위성
    if (!total) add('core', '핵심(지수) 비중', 'na', '보유 종목이 없습니다', '대부분의 액티브 펀드도 15년 넘게 지수를 이기지 못합니다. 계좌의 큰 몫을 낮은 비용의 지수에 두면 종목 선택이 틀려도 계좌가 버팁니다.', '관심 종목 · 보유에 수량 · 평균 단가를 넣으세요', 'SPIVA');
    else { const c = pct(coreV); add('core', '핵심(지수) 비중', c >= p.core - p.band ? 'ok' : c >= p.core - 2 * p.band ? 'warn' : 'bad', `${c}% (목표 ${p.core}% · 허용 ±${p.band}%p)`, '대부분의 액티브 펀드도 15년 넘게 지수를 이기지 못합니다. 계좌의 큰 몫을 낮은 비용의 지수에 두면 종목 선택이 틀려도 계좌가 버팁니다.', c < p.core - p.band ? `지수 ETF 를 ${Math.round((p.core - c) / 100 * total).toLocaleString('ko-KR')}원어치 늘리면 목표 비중입니다` : '', 'SPIVA'); }
    // 2 한 종목 비중 (지수 ETF 제외)
    const big = H.filter(h => h.bucket === 'sat' && total && h.value / total * 100 > maxPos);
    if (total) add('conc', '한 종목 최대 비중', big.length ? 'bad' : 'ok', big.length ? big.map(h => `${h.name || h.symbol} ${pct(h.value)}%`).join(' · ') + ` (한도 ${maxPos}%)` : `모두 ${maxPos}% 이하`, '주식 수익의 대부분은 극소수 종목이 만들고, 개별 종목의 절반 이상은 단기 국채보다 못했습니다. 한 종목에 크게 걸면 그 극소수를 고를 확률에 계좌를 거는 것입니다.', big.length ? '한도를 넘는 만큼 나눠 줄이거나, 이유를 결정 카드에 적어 두세요' : '', 'Bessembinder');
    // 3 손절가
    const sats = H.filter(h => h.bucket === 'sat');
    if (sats.length) { const noStop = sats.filter(h => !h.stop); add('stops', '개별 종목 손절가', noStop.length ? (noStop.length / sats.length > .5 ? 'bad' : 'warn') : 'ok', noStop.length ? `${noStop.length}/${sats.length} 종목에 손절가 없음 — ${noStop.slice(0, 4).map(h => h.name || h.symbol).join(' · ')}` : `${sats.length} 종목 모두 손절가 있음`, '사람은 이익은 빨리 팔고 손실은 오래 들고 가는 경향(처분 효과)이 있습니다. 미리 정한 손절가가 없으면 내려갈 때 희망으로 판단합니다.', noStop.length ? '관심 종목 · 보유에서 손절가를 넣으세요 (지수 ETF 는 비중으로 관리)' : '', 'Shefrin · Statman'); }
    // 4 열린 위험(heat)
    if (sats.length && total) { const r = sats.reduce((a, h) => a + (h.risk || 0), 0), hp = pct(r), unk = sats.some(h => h.risk == null); add('heat', '지금 걸린 위험 합계', hp > p.heatMax ? 'bad' : unk ? 'warn' : 'ok', `손절가까지 모두 닿으면 계좌의 ${hp}%${unk ? ' (손절가 없는 종목은 빠짐 — 실제로는 더 큼)' : ''} · 한도 ${p.heatMax}%`, '한 번의 위험을 작게 해도 동시에 여러 개를 들고 있으면 같이 무너집니다. 손절가까지의 손실 합계를 한도 안에 두면 나쁜 날에도 계좌가 살아남습니다.', hp > p.heatMax ? '새 진입을 멈추고, 손절가를 올리거나(이익 보호) 수량을 줄이세요' : '', 'Van Tharp · Kelly'); }
    // 5 낙폭 서킷 브레이커
    if (!dd) add('dd', '계좌 고점 대비 하락', 'na', '평가액 기록이 없습니다', '본전까지 필요한 수익: -20% → +25%, -33% → +50%, -50% → +100%. 큰 낙폭을 피하는 것이 수익을 이어가는 첫 조건입니다.', '아래 [평가액 기록] 에 한 달에 한 번 계좌 총액을 적으세요', '낙폭 회복 수학');
    else add('dd', '계좌 고점 대비 하락', dd.ddPct <= -maxDD ? 'bad' : dd.ddPct <= -maxDD / 2 ? 'warn' : 'ok', `${dd.ddPct}% (고점 ${dd.peakDate} · 허용 -${maxDD}%)`, '본전까지 필요한 수익: -20% → +25%, -33% → +50%, -50% → +100%. 큰 낙폭을 피하는 것이 수익을 이어가는 첫 조건입니다.', dd.ddPct <= -maxDD ? '새 매매를 멈추고 핵심(지수)만 유지 — 원인을 결정 카드로 돌아본 뒤 다시 시작' : dd.ddPct <= -maxDD / 2 ? '새 매매 크기를 절반으로 (1회 감수 손실 % 를 반으로)' : '', '낙폭 회복 수학');
    // 6 회전율
    if (turnover != null && tradedYear.length) add('turn', '1년 회전율 (산 금액 ÷ 계좌)', turnover > 2 * p.turnMax ? 'bad' : turnover > p.turnMax ? 'warn' : 'ok', `${turnover}% · 1년 매수 ${tradedYear.length}건 (한도 ${p.turnMax}%)`, '개인 6만여 가구 연구에서 가장 많이 사고판 20% 는 연 수익이 시장보다 약 6.5%p 낮았습니다. 원인은 거래 비용과 과신이었습니다.', turnover > p.turnMax ? '한 달 매매 횟수 상한을 나의 원칙에 적고, 냉각 대기열을 거쳐 사세요' : '', 'Barber · Odean');
    // 7 기대값
    if (st && st.closedTrades) add('exp', '내 매매의 기대값', st.closedTrades < 20 ? 'warn' : st.expectancyR > 0 ? 'ok' : 'bad', `1회 평균 ${st.expectancyR == null ? '?' : st.expectancyR}R · 승률 ${st.winRatePct}% · 끝난 매매 ${st.closedTrades}건${st.closedTrades < 20 ? ' (20건 미만 — 아직 운과 실력을 구분 못 함)' : ''}`, '승률보다 "승률 × 평균 이익 − 패율 × 평균 손실"이 플러스여야 이어갈 수 있습니다. 표본이 적으면 우연일 수 있습니다.', st.closedTrades >= 20 && !(st.expectancyR > 0) ? '위성 비중을 줄이고 핵심(지수)을 늘리세요 — 지금까지 기록으로는 개별 매매가 돈을 벌지 못했습니다' : '', 'Van Tharp · 표본 크기');
    // 8 지수 대비
    if (rc && rc.vsIndex.n) { const v = rc.vsIndex; add('bench', '같은 기간 지수 대비', v.n < 10 ? 'warn' : v.avgExcessPct > 0 ? 'ok' : 'bad', `평균 ${v.avgExcessPct > 0 ? '+' : ''}${v.avgExcessPct}%p · 지수를 이긴 비율 ${v.beatPct}% (${v.n}건)`, '개별 종목 매매는 "그냥 지수를 사 둔 것"보다 나아야 의미가 있습니다. 못하면 시간과 위험만 더 쓴 것입니다.', v.n >= 10 && v.avgExcessPct <= 0 ? `위성 비중을 ${Math.max(5, p.sat - 10)}% 로 줄이는 것을 검토하세요` : '', 'SPIVA · DALBAR'); }
    // 9 체크리스트
    const ck = journal.filter(t => t.checkTotal);
    if (ck.length >= 3) { const all = ck.filter(t => (t.checks || []).length >= t.checkTotal).length, r = Math.round(all / ck.length * 100); add('check', '매수 전 체크리스트 준수', r >= 80 ? 'ok' : r >= 50 ? 'warn' : 'bad', `${r}% 를 모두 지킴 (${ck.length}건)`, '체크리스트는 아는 것을 빠뜨리는 실수를 줄입니다. 일지에서 "다 지킨 매매"와 아닌 매매의 승률을 비교해 보세요.', r < 80 ? '체크리스트를 다 못 채우면 사지 않는 규칙을 더하세요' : '', 'Gawande · Pabrai'); }
    // 10 감정 매매
    const em = journal.filter(t => t.emotion), hot = em.filter(t => /조급|만회|지루/.test(t.emotion));
    if (em.length >= 3) { const r = Math.round(hot.length / em.length * 100); add('emo', '감정 매매 비율 (조급 · 만회 · 지루)', r > 30 ? 'bad' : r > 15 ? 'warn' : 'ok', `${r}% (${hot.length}/${em.length})`, '놓칠까 봐, 잃은 것을 되찾으려고, 지루해서 하는 매매는 계획 밖의 매매입니다. 냉각 시간을 두면 상당수가 저절로 걸러집니다.', r > 15 ? `냉각 대기열을 쓰세요 (지금 ${p.coolH}시간)` : '', 'Kahneman · 냉각 시간'); }
    // 11 레버리지
    const lv = H.filter(h => h.lev);
    if (H.length) add('lev', '레버리지 · 인버스', lv.length ? 'bad' : 'ok', lv.length ? lv.map(h => h.name || h.symbol).join(' · ') : '없음', '레버리지 ETF 는 매일 비율을 맞춰서 횡보장에서도 값이 녹아내립니다(변동성 끌림). 오래 들고 있으면 지수 × 배수와 크게 달라집니다.', lv.length ? '단기 목적이 아니면 정리 계획을 세우세요' : '', '변동성 끌림');
    // 오늘의 규칙
    const rules = [];
    const bad = id => C.some(c => c.id === id && c.status === 'bad'), warn = id => C.some(c => c.id === id && c.status === 'warn');
    let size = 1;
    if (bad('dd')) { rules.push({ lvl: 'stop', text: '새 매매 중지 — 계좌 낙폭이 허용치에 닿았습니다. 핵심(지수)만 유지하고 결정 카드로 원인부터 돌아보세요.' }); size = 0; }
    else if (warn('dd')) { rules.push({ lvl: 'half', text: `새 매매 크기 절반 — 1회 감수 손실 ${me.profile.riskTrade || 1}% → ${R2((+me.profile.riskTrade || 1) / 2)}%` }); size = .5; }
    if (bad('heat')) { rules.push({ lvl: 'stop', text: '새 진입 금지 — 걸린 위험 합계가 한도를 넘었습니다.' }); size = 0; }
    if (bad('conc')) rules.push({ lvl: 'half', text: '한도를 넘은 종목은 더 사지 않습니다.' });
    if (bad('exp') || bad('bench')) rules.push({ lvl: 'half', text: '개별 매매가 지수보다 못했습니다 — 위성 비중을 늘리지 않습니다.' });
    if (bad('turn') || bad('emo')) rules.push({ lvl: 'half', text: `사기 전 ${p.coolH}시간 냉각 — 냉각 대기열에 먼저 올리세요.` });
    if (!rules.length) rules.push({ lvl: 'ok', text: '규칙 안에 있습니다. 계획대로 하되, 새 매매는 결정 카드부터.' });
    // 리밸런싱
    const reb = total > 0 ? [['core', '핵심 (지수)', coreV, p.core], ['sat', '위성 (개별 종목)', satV, p.sat], ['cash', '현금', cash, p.cash]].map(([k, l, v, tg]) => { const now = pct(v), diff = R2(now - tg); return { k, label: l, value: Math.round(v), nowPct: now, targetPct: tg, diffPct: diff, move: Math.abs(diff) > p.band ? Math.round(-diff / 100 * total) : 0 }; }) : [];
    // 세금 (해외 주식)
    const yr = todayStr().slice(0, 4);
    const fxClosed = journal.filter(t => isClosed(t) && curOf(t.symbol) !== 'KRW' && d10(t.closeDate || t.openDate).startsWith(yr) && +t.qty > 0);
    const realized = Math.round(fxClosed.reduce((a, t) => a + (+t.exit - +t.entry) * (+t.qty) * (+t.fx || fxOf(t.symbol) || 0), 0));
    const left = Math.max(0, TAX.overseasDeduction - Math.max(0, realized));
    const fxH = H.filter(h => h.cur !== 'KRW'), uGain = fxH.filter(h => h.pnl > 0), uLoss = fxH.filter(h => h.pnl < 0);
    const tax = { year: yr, realized, deductionLeft: left, taxIfNow: Math.round(Math.max(0, realized - TAX.overseasDeduction) * TAX.overseasRate), trades: fxClosed.length,
      harvestLoss: realized > TAX.overseasDeduction ? uLoss.map(h => ({ symbol: h.symbol, name: h.name, loss: Math.round(h.pnl) })) : [],
      harvestGain: left > 0 ? uGain.map(h => ({ symbol: h.symbol, name: h.name, gain: Math.round(h.pnl) })) : [], basis: TAX.basis };
    const app = C.filter(c => c.status !== 'na'), ok = app.filter(c => c.status === 'ok').length;
    return { asOf: new Date().toISOString(), total: Math.round(total), invested: Math.round(invested), cash: Math.round(cash), unpriced: H.filter(h => !h.priced).map(h => h.symbol), fxMissing: H.filter(h => h.fxMissing).map(h => h.symbol), score: app.length ? Math.round(ok / app.length * 100) : null, checks: C, rules, sizeFactor: size, rebalance: reb, band: p.band, drawdown: dd, turnoverPct: turnover, tax, plan: p, holdings: H.map(h => ({ symbol: h.symbol, name: h.name, bucket: h.bucket, valueWon: Math.round(h.value), weightPct: pct(h.value), lev: h.lev || undefined })) };
  }

  /* ---------- KIS (한국투자증권) Open API 등록 배너 ---------- */
  const kisNeed = () => !realtimeOn() && !(eng.kisHide && Date.now() - eng.kisHide < 14 * 864e5);
  function kisBanner() {
    if (!kisNeed()) return '';
    const relay = cfg.apis.find(a => a.type === 'kisrelay');
    const sub = relay ? '중계는 이미 있습니다 — 한국투자증권 앱키를 중계에 넣고, 중계 카드에서 「KIS 실시간 시세도 쓰기」를 켜면 됩니다.' : '지금 국내 시세는 공공데이터포털의 전 영업일 종가입니다. 한국투자증권 Open API 를 등록하면 장중 실시간 현재가 · PER · PBR 로 바뀝니다 (조회만, 주문 기능 없음).';
    return `<div class="en-kis" role="region" aria-label="한국투자증권 API 등록"><span class="ico-b">${icon('key', 18)}</span><div class="tx"><b>한국투자증권 API 를 등록하면 실시간 시세로 바뀝니다</b><span>${esc(sub)}</span></div><div class="acts"><button class="btn ink" data-kis="go">${icon('key', 15)}등록하기</button><button class="btn ghost" data-kis="later">2주 뒤에</button></div></div>`;
  }
  function wireKis(box) {
    box.querySelectorAll('[data-kis="go"]').forEach(b => b.onclick = () => kisSteps());
    box.querySelectorAll('[data-kis="later"]').forEach(b => b.onclick = () => { eng.kisHide = Date.now(); saveEng(); box.querySelectorAll('.en-kis').forEach(x => x.remove()); toast('API 연결 화면의 추천 API 에서 언제든 등록할 수 있습니다', 2600); });
  }
  function kisSteps() {
    const relay = cfg.apis.find(a => a.type === 'kisrelay');
    const d = dialog(`<h3>한국투자증권 Open API 등록 (약 10분)</h3>
      <p class="modal-desc">한국투자증권은 웹페이지에서 바로 부르는 것을 막아 두어, 내 Cloudflare 중계(무료)에 앱키를 넣고 그 중계를 거쳐 시세만 받습니다. <b>주문 기능은 없습니다.</b> 앱키 · 시크릿은 중계에만 두고 이 화면에는 넣지 않습니다.</p>
      <ol class="sc-steps">
        <li class="${relay ? 'done' : ''}"><b>한국투자증권 계좌</b> — 없으면 「한국투자」 앱에서 비대면으로 개설합니다. 연습만 하려면 모의투자 계좌로도 됩니다.</li>
        <li><b>KIS Developers</b> 에 로그인 → <b>API 신청</b>(KIS Developers 서비스 신청) → 계좌를 고르고 신청하면 <b>앱키(App Key)</b> 와 <b>앱시크릿(App Secret)</b> 이 나옵니다. 실전 · 모의 앱키가 따로 있습니다.</li>
        <li><b>Cloudflare 중계</b> — ${relay ? '이미 만들어 둔 중계' : '중계를 아직 안 만들었으면 [중계 만드는 법] 대로 한 번 만들고'}의 <b>Settings → Variables and Secrets</b> 에 Secret 으로 <code>KIS_APPKEY</code> · <code>KIS_APPSECRET</code> 을 넣습니다. 모의투자 앱키면 <code>KIS_MOCK</code> = <code>1</code> 도.</li>
        <li><b>API 연결</b> → 중계 카드 연필 → 「KIS 실시간 시세도 쓰기」를 켜고 [시험]. 처음 시험할 때 KIS 가 접근 토큰 발급 알림을 보낼 수 있습니다 (토큰은 하루 동안 다시 씀).</li>
      </ol>
      <div class="actions en-wrap"><a class="btn" href="https://apiportal.koreainvestment.com/" target="_blank" rel="noopener">${icon('link', 15)}KIS Developers 열기</a><button class="btn" data-g>중계 만드는 법</button><button class="btn ink" data-a>${icon('key', 15)}${relay ? '중계 카드 열기' : '중계 추가'}</button></div>`, 'sc-dlg');
    d.el.querySelector('[data-g]').onclick = () => { d.close(); kisGuide(); };
    d.el.querySelector('[data-a]').onclick = () => { d.close(); show('apis'); setTimeout(() => openAdd('kisrelay', relay || undefined), 60); };
  }

  /* ---------- 화면 ---------- */
  const ST = { ok: ['통과', 'ok'], warn: ['주의', 'warn'], bad: ['위반', 'bad'], na: ['자료 없음', 'na'] };
  const won = v => v == null ? '–' : Math.round(v).toLocaleString('ko-KR') + '원';
  function renderEngine() {
    const s = engineState(), p = eng.plan, box = $('engBox');
    const ideasDue = eng.ideas.filter(x => x.status === 'wait');
    box.innerHTML = kisBanner() + `
      <div class="sc-sum">
        <div><span>지속 수익 조건 통과</span><b>${s.score == null ? '–' : s.score + '%'}</b></div>
        <div><span>계좌 평가액 (보유 + 현금)</span><b>${won(s.total)}</b></div>
        <div><span>고점 대비</span><b class="${s.drawdown && s.drawdown.ddPct < 0 ? 'dn' : ''}">${s.drawdown ? s.drawdown.ddPct + '%' : '–'}</b></div>
        <div><span>새 매매 크기</span><b>${s.sizeFactor === 0 ? '중지' : s.sizeFactor === .5 ? '절반' : '정상'}</b></div>
      </div>
      <section class="sc-card en-rules"><h2>오늘의 규칙</h2><ul>${s.rules.map(r => `<li class="${r.lvl}">${esc(r.text)}</li>`).join('')}</ul>
        ${s.unpriced.length ? `<p class="sub">시세를 아직 안 불러온 종목은 평균 단가로 셌습니다: ${esc(s.unpriced.join(' · '))} — 관심 종목 · 보유에서 [시세 새로 고침]</p>` : ''}
        ${s.fxMissing.length ? `<p class="sub warn">환율이 없어 0 원으로 셌습니다: ${esc(s.fxMissing.join(' · '))} — 아래 설정에서 환율을 넣으세요</p>` : ''}</section>
      <section class="en-sec" id="engRoutine"></section>
      <section class="en-sec"><h2>지속 수익의 조건 점검</h2><p>예측이 아니라, 오래 살아남은 투자자들의 공통 조건을 내 자료로 확인합니다. 근거는 레퍼런스 화면에 있습니다.</p>
        <div class="en-checks">${s.checks.map(c => `<div class="en-c ${ST[c.status][1]}"><div class="h"><span class="st">${ST[c.status][0]}</span><b>${esc(c.title)}</b><span class="ref">${esc(c.ref)}</span></div><p class="v">${esc(c.value)}</p><p class="why">${esc(c.why)}</p>${c.fix ? `<p class="fix">${esc(c.fix)}</p>` : ''}</div>`).join('')}</div></section>
      <section class="sc-card"><h2>리밸런싱 <small>목표에서 ±${p.band}%p 넘게 벗어나면 옮길 금액</small></h2>
        ${s.rebalance.length ? `<div class="sc-tablewrap"><table class="sc-table en-reb"><thead><tr><th>구분</th><th>지금</th><th>목표</th><th>차이</th><th>옮길 금액</th></tr></thead><tbody>${s.rebalance.map(r => `<tr><td>${esc(r.label)}</td><td>${r.nowPct}% <small>${won(r.value)}</small></td><td>${r.targetPct}%</td><td class="${Math.abs(r.diffPct) > p.band ? 'warn' : ''}">${r.diffPct > 0 ? '+' : ''}${r.diffPct}%p</td><td>${r.move ? (r.k === 'cash' ? (r.move > 0 ? '현금으로 남기기 ' : '현금에서 쓰기 ') : (r.move > 0 ? '사기 ' : '팔기 ')) + won(Math.abs(r.move)) : '그대로'}</td></tr>`).join('')}</tbody></table></div>
          <p class="sub">정해진 날(분기 첫 영업일 등)에만 봅니다. 많이 오른 쪽을 덜고 덜 오른 쪽을 채우는 규칙이라, 과열을 쫓는 실수를 저절로 줄입니다. 지수 ETF 판정이 틀린 종목은 아래 설정에서 바꾸세요.</p>` : '<p class="sub">관심 종목 · 보유에 수량과 평균 단가를 넣고, 아래에 현금을 적으면 계산합니다.</p>'}
      </section>
      <section class="sc-card"><h2>냉각 대기열 <small>사고 싶을 때 바로 사지 않고 ${p.coolH}시간 묵히기</small></h2>
        <p class="sub">"6개월 뒤 이 매매가 실패했다면, 이유는?" (사전 실패 가정)을 먼저 적습니다. 시간이 지나도 사고 싶으면 결정 카드로 넘깁니다.</p>
        <div class="en-ideas">${eng.ideas.length ? eng.ideas.slice().reverse().map(x => { const left = x.t + p.coolH * 36e5 - Date.now(), ready = left <= 0; return `<div class="en-idea ${x.status}"><div class="h"><b>${esc(x.symbol)}</b><span class="tag">${x.status === 'done' ? '결정 카드로 넘김' : x.status === 'drop' ? '안 사기로 함' : ready ? '살 수 있음' : `${Math.ceil(left / 36e5)}시간 남음`}</span></div><p><em>이유</em> ${esc(x.reason)}</p><p><em>실패 가정</em> ${esc(x.premortem)}</p>${x.status === 'wait' ? `<div class="row">${ready ? `<button class="btn sm ink" data-iok="${x.id}">결정 카드 쓰기</button>` : ''}<button class="btn sm" data-idrop="${x.id}">안 사기</button></div>` : ''}</div>`; }).join('') : '<div class="sc-empty-s">비어 있습니다.</div>'}</div>
        <div class="sc-add-row"><button class="btn" id="engIdea">${icon('plus', 15)}대기열에 올리기</button>${ideasDue.length ? `<span class="sub">기다리는 것 ${ideasDue.length}개</span>` : ''}</div></section>
      <section class="sc-card"><h2>세금 — 해외 주식 ${s.tax.year}년 <small>${esc(TAX.basis)}</small></h2>
        <div class="sc-sum"><div><span>올해 실현 손익 (결정 카드 기준)</span><b>${won(s.tax.realized)}</b></div><div><span>기본 공제 ${won(TAX.overseasDeduction)} 중 남음</span><b>${won(s.tax.deductionLeft)}</b></div><div><span>지금 기준 예상 세금 (22%)</span><b>${won(s.tax.taxIfNow)}</b></div></div>
        ${s.tax.harvestLoss.length ? `<p class="sub">공제를 넘었습니다. 손실 중인 해외 종목을 연말 전에 팔면(다시 사도 됨) 과세 이익이 줄어듭니다: ${esc(s.tax.harvestLoss.map(h => `${h.name || h.symbol} ${won(h.loss)}`).join(' · '))}</p>` : ''}
        ${s.tax.harvestGain.length ? `<p class="sub">공제가 ${won(s.tax.deductionLeft)} 남았습니다. 이익 중인 해외 종목을 남은 공제만큼 연말 전에 실현하고 다시 사면, 매수 단가가 올라가 다음 해 세금이 줄어듭니다: ${esc(s.tax.harvestGain.map(h => `${h.name || h.symbol} +${won(h.gain)}`).join(' · '))}</p>` : ''}
        <p class="sub">결제일 기준으로 연도가 나뉘므로 연말 마지막 거래일 2~3일 전까지 체결해야 그해 손익으로 잡힙니다. 국내 상장 해외 ETF 는 배당소득세(15.4%) 대상이라 여기 셈에 넣지 않습니다. 장기 자금은 ISA(연 ${won(TAX.isaYear)} 한도) · 연금저축 · IRP(세액공제 대상 연 ${won(TAX.pensionCredit)})를 먼저 채우는 것이 확실한 수익입니다.</p></section>
      <section class="sc-card"><h2>평가액 기록 <small>한 달에 한 번 — 고점 대비 하락 계산에 씀</small></h2>
        <div class="en-eq">${eng.equity.length ? eng.equity.slice().sort((a, b) => b.d.localeCompare(a.d)).slice(0, 12).map(x => `<span>${esc(x.d)} <b>${won(+x.v)}</b><button class="sc-x" data-eqdel="${esc(x.d)}" aria-label="지우기" title="지우기">${icon('x', 12)}</button></span>`).join('') : '<span class="sub">아직 없습니다.</span>'}</div>
        <div class="sc-add-row"><input type="month" id="engEqD" value="${todayStr().slice(0, 7)}" aria-label="달"><input type="text" id="engEqV" inputmode="numeric" placeholder="계좌 총액 (예: 3200만)" aria-label="계좌 총액"><button class="btn" id="engEqAdd">${icon('plus', 15)}기록</button>${s.total ? `<button class="btn ghost" id="engEqNow">지금 평가액 ${won(s.total)} 넣기</button>` : ''}</div></section>
      <section class="sc-card"><h2>설정</h2>
        <div class="sc-form"><div class="sc-grid2">
          <label>핵심 (지수) 목표 %<input type="number" data-pl="core" value="${p.core}" min="0" max="100"></label>
          <label>위성 (개별 종목) 목표 %<input type="number" data-pl="sat" value="${p.sat}" min="0" max="100"></label>
          <label>현금 목표 %<input type="number" data-pl="cash" value="${p.cash}" min="0" max="100"></label>
          <label>리밸런싱 허용 폭 (%p)<input type="number" data-pl="band" value="${p.band}" min="1" max="30"></label>
          <label>걸린 위험 합계 한도 (%)<input type="number" data-pl="heatMax" value="${p.heatMax}" min="1" max="30" step="0.5"></label>
          <label>냉각 시간 (시간)<input type="number" data-pl="coolH" value="${p.coolH}" min="0" max="336"></label>
          <label>1년 회전율 한도 (%)<input type="number" data-pl="turnMax" value="${p.turnMax}" min="10" max="1000" step="10"></label>
          <label>현금 (원)<input type="text" id="engCash" value="${esc(eng.cash)}" placeholder="예: 300만"></label>
          <label>환율 USD (원)<input type="number" data-fx="USD" value="${eng.fx.USD}" min="0" step="any"></label>
          <label>환율 HKD · CNY (원)<span class="en-fx"><input type="number" data-fx="HKD" value="${eng.fx.HKD}" min="0" step="any" aria-label="HKD"><input type="number" data-fx="CNY" value="${eng.fx.CNY}" min="0" step="any" aria-label="CNY"></span></label>
        </div>
        ${p.core + p.sat + p.cash !== 100 ? `<p class="sub warn">목표 합이 ${p.core + p.sat + p.cash}% 입니다 — 100% 가 되게 맞추세요.</p>` : ''}
        <p class="sub">1회 감수 손실 · 한 종목 최대 비중 · 계좌 최대 하락 허용은 <a href="#me" data-goto="me">나의 원칙</a> 의 값을 씁니다 (지금 ${me.profile.riskTrade || 1}% · ${me.profile.maxPos || 20}% · ${me.profile.maxDD || 20}%).</p>
        ${s.holdings.length ? `<div class="en-bk"><span class="sub">핵심 / 위성 구분 (눌러서 바꾸기)</span>${s.holdings.map(h => `<button type="button" class="en-b ${h.bucket}" data-bk="${esc(h.symbol)}">${esc(h.name || h.symbol)} · ${h.bucket === 'core' ? '핵심' : '위성'}${h.lev ? ' · 레버리지' : ''}</button>`).join('')}</div>` : ''}
        </div></section>
      <p class="sc-fine" style="text-align:left">이 점검은 수익을 보장하지 않습니다. 오래 살아남은 투자자들의 공통 조건(낮은 비용 · 분산 · 손실 통제 · 규칙 · 기록)을 지키고 있는지 보여 줄 뿐이며, 판단과 책임은 사용자에게 있습니다.</p>`;
    fillIcons(box); wireKis(box);
    box.querySelectorAll('[data-pl]').forEach(el => el.addEventListener('change', () => { const v = +el.value; if (isFinite(v)) { eng.plan[el.dataset.pl] = v; saveEng(); renderEngine(); } }));
    box.querySelectorAll('[data-fx]').forEach(el => el.addEventListener('change', () => { eng.fx[el.dataset.fx] = +el.value || 0; saveEng(); renderEngine(); }));
    $('engCash').addEventListener('change', e => { eng.cash = e.target.value.trim(); saveEng(); renderEngine(); });
    box.querySelectorAll('[data-bk]').forEach(b => b.onclick = () => {
      const sx = b.dataset.bk, it = watch.items.find(x => symU(x.symbol) === sx) || { symbol: sx }, now = bucketOf(it);
      eng.coreSyms = eng.coreSyms.filter(x => x !== sx); eng.satSyms = eng.satSyms.filter(x => x !== sx);
      (now === 'core' ? eng.satSyms : eng.coreSyms).push(sx); saveEng(); renderEngine();
    });
    box.querySelectorAll('[data-goto]').forEach(a => a.onclick = e => { e.preventDefault(); show(a.dataset.goto); });
    const addEq = (d, v) => { if (!/^\d{4}-\d{2}$/.test(d) || !(v > 0)) { toast('달과 금액을 넣어 주세요', 1800); return; } eng.equity = eng.equity.filter(x => x.d !== d); eng.equity.push({ d, v: Math.round(v) }); saveEng(); renderEngine(); };
    $('engEqAdd').onclick = () => addEq($('engEqD').value, parseWon($('engEqV').value));
    if ($('engEqNow')) $('engEqNow').onclick = () => addEq($('engEqD').value, s.total);
    box.querySelectorAll('[data-eqdel]').forEach(b => b.onclick = () => { eng.equity = eng.equity.filter(x => x.d !== b.dataset.eqdel); saveEng(); renderEngine(); });
    $('engIdea').onclick = () => editIdea();
    box.querySelectorAll('[data-idrop]').forEach(b => b.onclick = () => { const x = eng.ideas.find(y => y.id === b.dataset.idrop); if (x) { x.status = 'drop'; saveEng(); renderEngine(); } });
    box.querySelectorAll('[data-iok]').forEach(b => b.onclick = () => {
      const x = eng.ideas.find(y => y.id === b.dataset.iok); if (!x) return;
      editTrade(null);
      const f = [...document.querySelectorAll('.sc-dlg form')].pop();
      if (f) { f.symbol.value = x.symbol; if (x.stop) f.stop.value = x.stop; if (x.target) f.target.value = x.target; f.reason.value = x.reason + (x.premortem ? `\n(실패 가정) ${x.premortem}` : ''); f.symbol.dispatchEvent(new Event('input')); }
      x.status = 'done'; saveEng();
    });
    paintRoutines();
    const rt = LS.get(K_RT, null); if (!rtBusy && (dataFor('quote') || dataFor('history')) && (!rt || Date.now() - rt.at > 6 * 36e5)) runRoutines();
  }
  function editIdea() {
    const d = dialog(`<h3>냉각 대기열에 올리기</h3><p class="modal-desc">${eng.plan.coolH}시간 뒤에도 사고 싶으면 결정 카드로 넘깁니다. 실패 가정을 못 쓰면 아직 모르는 것입니다.</p><form class="sc-form">
      <label>종목<input type="text" name="symbol" required placeholder="예: 005930 · AAPL"></label>
      <label>사고 싶은 이유 (한두 문장)<textarea name="reason" rows="2" required></textarea></label>
      <label>6개월 뒤 이 매매가 실패했다면, 이유는?<textarea name="premortem" rows="2" required placeholder="예: 실적이 기대에 못 미치고, 업황 회복이 1년 늦어진다"></textarea></label>
      <div class="sc-grid2"><label>손절가 (선택)<input type="number" name="stop" step="any" min="0"></label><label>목표가 (선택)<input type="number" name="target" step="any" min="0"></label></div>
      <div class="actions"><button type="button" class="btn" data-x>취소</button><button class="btn ink">올리기</button></div></form>`, 'sc-dlg');
    const f = d.el.querySelector('form'); d.el.querySelector('[data-x]').onclick = d.close; setTimeout(() => f.symbol.focus(), 30);
    f.onsubmit = e => { e.preventDefault(); eng.ideas.push({ id: 'i' + Date.now().toString(36), t: Date.now(), symbol: f.symbol.value.trim().toUpperCase(), reason: f.reason.value.trim(), premortem: f.premortem.value.trim(), stop: +f.stop.value || 0, target: +f.target.value || 0, status: 'wait' }); eng.ideas = eng.ideas.slice(-60); saveEng(); d.close(); renderEngine(); toast(`${eng.plan.coolH}시간 뒤에 다시 보세요`, 2200); };
  }
  $('engAsk').onclick = () => { show('chat'); send('get_profit_engine 으로 내 수익 엔진 점검 결과를 보고, 위반 · 주의 항목을 급한 순서로 정리해 줘. 항목마다 왜 문제인지(근거 연구 한 줄)와 이번 주에 할 구체적 행동 하나씩. 리밸런싱이 필요하면 금액까지.'); };

  /* =====================================================================
     기기 사이 동기화 — 비공개 GitHub 저장소(영상과 같은 test0-video)의 secret/ 폴더
     · state.json: 나의 원칙 · 노트 · 매매 일지 · 관심 종목 · 계산기 · API 목록(키 빼고) · 잠근 키 묶음(암호화된 것만) · 대화 목록
     · chats/<id>.json: 대화 하나씩 (개수 제한 없음)
     · 합치는 법: 노트 · 일지 · 대화는 하나씩 더 최근 것이 이김(지운 것은 '지움 표시'로 전달), 나머지는 고친 시각이 늦은 쪽이 이김
     · API 키: 한 기기에서 넣으면 다른 기기에서도 저절로 씀. 키 하나마다 고친 시각이 늦은 쪽이 이김.
       state.json 의 vault 에 AES-GCM 으로 감싸 둠 (열쇠도 같은 비공개 저장소에 — 보호는 비공개 저장소 · GitHub 토큰이 맡고,
       암호화는 키가 글자 그대로 보이거나 비밀 값 검사에 걸리지 않게 하는 것). 잠금 암호를 건 기기는 풀려 있을 때(기억 중 포함)만 주고받음
     ===================================================================== */
  const K_SYNC = 'sec:sync';
  const sy = Object.assign({ on: false, shaState: '', shaChat: {}, tomb: { notes: {}, journal: {}, chats: {} }, rev: {}, hash: {}, pushed: '', at: 0, err: '', keyT: {} }, LS.get(K_SYNC, {}));
  if (!sy.keyT) sy.keyT = {};
  sy.tomb = Object.assign({ notes: {}, journal: {}, chats: {} }, sy.tomb);
  const saveSy = () => LS.set(K_SYNC, sy);
  const SY = { busy: false, state: sy.on ? 'idle' : 'off', msg: '', timer: 0, again: false };
  const deviceName = () => /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ? '휴대폰' : 'PC';
  const hashOf = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); };
  const sect = {
    me: () => me, engine: () => eng, notes: () => notes, journal: () => journal, watch: () => ({ items: watch.items }), calc: () => LS.get(K_CALC, {}),
    cfg: () => ({ apis: cfg.apis.map(a => ({ id: a.id, type: a.type, name: a.name, model: a.model || '', base: a.base || '', on: a.on !== false })), ai: cfg.ai, web: cfg.web, deep: cfg.deep, auto: cfg.auto || 0, lock: cfg.lock ? { salt: cfg.lock.salt, iv: cfg.lock.iv, data: cfg.lock.data, ids: cfg.lock.ids || undefined } : null }), // ids: 어느 API 에 키가 있는지만 (키 값 아님)
  };
  /* 고칠 때마다 부름: 내용이 실제로 바뀌었으면 그 칸의 고친 시각을 기록하고 잠시 뒤 올림 */
  SYNCQ.mark = k => {
    if (sect[k]) { const h = hashOf(JSON.stringify(sect[k]())); if (sy.hash[k] === h) return; sy.hash[k] = h; sy.rev[k] = Date.now(); saveSy(); }
    if (sy.on) { clearTimeout(SY.timer); SY.timer = setTimeout(() => syncNow(), 3000); }
  };
  SYNCQ.tomb = (k, id) => { sy.tomb[k][id] = Date.now(); saveSy(); SYNCQ.mark(k === 'chats' ? 'chats' : k); };
  /* 아직 한 번도 고친 시각이 없는 칸: 내용이 있으면 1(오래된 것), 비어 있으면 0 — 처음 맞출 때 먼저 올라간 쪽을 따르게 */
  const emptySect = { engine: () => hashOf(JSON.stringify(eng)) === hashOf(JSON.stringify(ENG0)), me: () => hashOf(JSON.stringify(me)) === hashOf(JSON.stringify(ME0)), watch: () => !watch.items.length, calc: () => !Object.keys(LS.get(K_CALC, {})).length, cfg: () => !cfg.apis.length, notes: () => !notes.length, journal: () => !journal.length };
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
    if (take('engine') && r.engine) { const kh = eng.kisHide; Object.keys(eng).forEach(k => delete eng[k]); Object.assign(eng, JSON.parse(JSON.stringify(ENG0)), r.engine); eng.plan = Object.assign({}, ENG0.plan, eng.plan); eng.fx = Object.assign({}, ENG0.fx, eng.fx); eng.kisHide = Math.max(kh || 0, eng.kisHide || 0); LS.set(K_ENG, eng); sy.rev.engine = Math.max(rr.engine || 0, 2); changed = true; }
    if (take('watch') && r.watch) { watch.items = r.watch.items || []; LS.set(K_WATCH, watch); sy.rev.watch = Math.max(rr.watch || 0, 2); changed = true; }
    if (take('calc') && r.calc) { LS.set(K_CALC, r.calc); calcIds.forEach(id => { if (r.calc[id] != null) $(id).value = r.calc[id]; }); sy.rev.calc = Math.max(rr.calc || 0, 2); changed = true; }
    if (take('cfg') && r.cfg) {
      const keep = new Map(cfg.apis.map(a => [a.id, a]));
      cfg.apis = (r.cfg.apis || []).map(a => Object.assign({}, a, { key: (keep.get(a.id) || {}).key || '', test: (keep.get(a.id) || {}).test || '' }));
      cfg.ai = r.cfg.ai; cfg.web = r.cfg.web; if ('deep' in r.cfg) cfg.deep = r.cfg.deep; cfg.auto = r.cfg.auto || 0; sy.rev.cfg = Math.max(rr.cfg || 0, 2); changed = true;
    }
    cfg.lockRemote = r.cfg && r.cfg.lock && r.cfg.lock.data ? r.cfg.lock : null;
    LS.set(K_CFG, cfg);
    for (const c of chats.slice()) if ((sy.tomb.chats[c.id] || 0) >= (c.updated || 0) && sy.tomb.chats[c.id]) { chats = chats.filter(x => x !== c); IDB.del(c.id); if (cur === c) cur = null; changed = true; }
    for (const k in sect) sy.hash[k] = hashOf(JSON.stringify(sect[k]()));
    return changed;
  }
  /* ---------- API 키 보관함 (기기끼리 저절로) ---------- */
  let vault = null, vaultH = '', ring = '', remoteMap = null; // 메모리에만
  const ringKey = b => crypto.subtle.importKey('raw', unb64(b), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  /* 이 기기의 키: 잠금이 없으면 카드에, 잠금이 있으면 풀려 있을 때만 (잠겨 있으면 null → 주고받지 않음) */
  function localKeys() {
    if (cfg.lock && !keyMem) { const r = remembered(); if (r) keyMem = Object.assign({}, r); }
    if (cfg.lock && !keyMem) return null;
    return Object.fromEntries(cfg.apis.map(a => [a.id, (cfg.lock ? keyMem[a.id] : a.key) || '']));
  }
  async function putKeys(got) {
    if (!cfg.lock) { cfg.apis.forEach(a => { if (a.id in got) a.key = got[a.id]; }); LS.set(K_CFG, cfg); return true; }
    if (!lockKey && !(await keyFromMemory())) return false;
    Object.assign(keyMem, got); await sealKeys(); return true;
  }
  async function mergeKeys(v) {
    remoteMap = null;
    if (!v || !v.ring || !v.iv || !v.data) return false;
    try { remoteMap = JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(v.iv) }, await ringKey(v.ring), unb64(v.data)))); } catch (e) { return false; }
    ring = v.ring; vault = v; vaultH = hashOf(JSON.stringify(remoteMap));
    const loc = localKeys(); if (!loc) return false;
    const got = {};
    for (const [id, e] of Object.entries(remoteMap)) {
      if (!(id in loc) || !e) continue;
      const lt = sy.keyT[id] || (loc[id] ? 1 : 0), rt = e.t || 0, rk = e.k || '';
      if (rk !== loc[id] && (rt > lt || (lt <= 1 && !loc[id] && rk))) got[id] = rk;
    }
    if (!Object.keys(got).length) return false;
    if (!(await putKeys(got))) return false;
    for (const id in got) sy.keyT[id] = Math.max(sy.keyT[id] || 0, remoteMap[id].t || 1);
    saveSy(); return true;
  }
  async function buildVault() {
    const loc = localKeys(); if (!loc) return; // 잠겨 있으면 받은 것을 그대로 다시 올림
    const map = Object.assign({}, remoteMap || {});
    for (const id of new Set([...Object.keys(loc), ...Object.keys(sy.keyT)])) {
      const k = loc[id] || '', t = sy.keyT[id] || (k ? 1 : 0);
      if (!t) continue;
      if (!map[id] || t > (map[id].t || 0) || (t === (map[id].t || 0) && k)) map[id] = { k, t };
    }
    if (!Object.keys(map).length) return;
    const plain = JSON.stringify(map), h = hashOf(plain);
    if (vault && ring && vault.ring === ring && vaultH === h) return; // 그대로면 다시 감싸지 않음 (안 바뀐 것을 또 올리지 않게)
    if (!ring) ring = b64(crypto.getRandomValues(new Uint8Array(32)));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await ringKey(ring), enc.encode(plain));
    vault = { v: 1, ring, iv: b64(iv), data: b64(data) }; vaultH = h; remoteMap = map;
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
    return Object.assign(s, { v: 1, at: Date.now(), device: deviceName(), rev: sy.rev, tomb: sy.tomb, chats: chats.map(c => ({ id: c.id, title: c.title, updated: c.updated })) }, vault ? { vault } : {});
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
      if (rem && await mergeKeys(rem.data.vault)) { changed = true; renderAiSel(); if (!$('vApis').hidden) renderApis(); renderBanner(); }
      await buildVault();
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
    box.innerHTML = `<span class="ico-wrap">${icon('cloud', 20)}</span><div class="tx"><b>모든 기기에서 같게 보기</b> — 대화 기록 · 노트 · 매매 일지 · 나의 원칙 · 관심 종목을 비공개 GitHub 저장소 <b>${esc(c.owner)}/${esc(c.repo)}</b> 의 secret 폴더에 두고, 휴대폰 · PC 어디서 열어도 같게 맞춥니다. API 키도 암호화해 함께 옮기므로, 한 기기에서 넣으면 다른 기기에서도 바로 씁니다.
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
      sy.keysSeen = L.data; saveSy(); saveCfg(); await remember(keep);
      const added = cfg.apis.filter(a => !before.has(a.id) && keyMem && keyMem[a.id]);
      const still = cfg.apis.filter(a => !hasKey(a) && !noKey(a));
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
  function remoteMissing() { const L = cfg.lockRemote; if (!L || !L.data || (cfg.lock && cfg.lock.data === L.data)) return false; return cfg.apis.some(a => !noKey(a) && !hasKey(a) && (!L.ids || L.ids.includes(a.id))); }
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
    cfg.lock = { salt: b64(salt) }; await sealKeys(); await remember(true); return true;
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
    if (!idx || !(idx.dates || []).length) { box.innerHTML = `<div class="sc-bmsg"><b>아직 전략 브리핑이 없습니다.</b><br>매일 아침 7시 전후로 여러 번 보강해 8시 전에 만들어집니다. 지금 받으려면 <a href="${actions}" target="_blank" rel="noopener">GitHub Actions 의 Strategy briefing</a> 에서 [Run workflow] 를 누르고 1~2분 뒤 [다시 불러오기] 를 누르세요.</div>`; $('sDate').innerHTML = ''; return; }
    sui.dates = idx.dates; if (!sui.date || !sui.dates.includes(sui.date)) sui.date = sui.dates[0];
    $('sDate').innerHTML = sui.dates.map(d => { const x = new Date(d + 'T00:00'); return `<option value="${d}"${d === sui.date ? ' selected' : ''}>${x.getMonth() + 1}월 ${x.getDate()}일 (${'일월화수목금토'[x.getDay()]})${d === ymdLocal(new Date()) ? ' · 오늘' : ''}</option>`; }).join('');
    let d; try { d = await getBrief('strategy/' + sui.date + '.json'); } catch (e) { box.innerHTML = `<div class="sc-bmsg">${esc(e.message)}</div>`; return; }
    if (!d) { box.innerHTML = '<div class="sc-bmsg">이 날의 전략 브리핑 파일이 없습니다.</div>'; return; }
    if (sui.mode === 'sum') { renderStratSum(d); return; }
    const list = sui.mode === 'weekly' ? d.weekly || [] : d.daily || [], kw = sui.mode === 'weekly' ? d.weeklyKeywords || [] : d.dailyKeywords || [];
    const t = d.generatedAt ? new Date(d.generatedAt) : null, dd = d.dailyDate ? new Date(d.dailyDate + 'T00:00') : null;
    $('sLead').innerHTML = `${t ? `${t.getMonth() + 1}월 ${t.getDate()}일 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')} 에 모음 · ` : ''}${sui.mode === 'weekly' ? `최근 7일 주간 전략 리포트 <b>${list.length}개</b>` : `${dd ? `${dd.getMonth() + 1}월 ${dd.getDate()}일 발행 ` : ''}증권사 데일리 · 투자전략 리포트 <b>${list.length}개</b>`}, 많이 읽힌 순. AI 토큰은 쓰지 않습니다. ${morningNote(sui.dates && sui.dates[0])}`;
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
  /* 날짜별: 그날의 모닝 브리핑(날짜.json) + 그날의 전략 브리핑(strategy/날짜.json). 위 띠는 날짜별 시장 온도(market/sumtemp.json — 저녁 장 마감 기록이 같은 규칙으로 셈) */
  const mui = { date: '', dates: [] };
  $('mReload').onclick = () => renderSum(true);
  $('mDate').onchange = e => { mui.date = e.target.value; renderSum(); };
  $('mPrev').onclick = () => { const i = mui.dates.indexOf(mui.date); if (i < mui.dates.length - 1) { mui.date = mui.dates[i + 1]; renderSum(); } };
  $('mNext').onclick = () => { const i = mui.dates.indexOf(mui.date); if (i > 0) { mui.date = mui.dates[i - 1]; renderSum(); } };
  const dLabel = d => { const x = new Date(d + 'T00:00'); return `${x.getMonth() + 1}월 ${x.getDate()}일 (${'일월화수목금토'[x.getDay()]})${d === ymdLocal(new Date()) ? ' · 오늘' : ''}`; };
  function sumTempOf(md, sd) {
    const news = [], seen = new Set();
    for (const it of ((md && md.items) || []).concat(...((md && md.byFeed) || []).map(f => f.items || []))) { const k = it.link || it.title; if (seen.has(k)) continue; seen.add(k); news.push(it); }
    const reps = ((sd && sd.daily) || []).concat((sd && sd.weekly) || []);
    let pos = 0, neg = 0;
    for (const t of news.map(n => n.title).concat(...reps.map(r => String(r.summary).split('\n')))) { if (POS.test(t)) pos++; if (NEG.test(t)) neg++; }
    const pp = Math.round(pos / (pos + neg || 1) * 100);
    return { news, reps, pos, neg, pp, mood: pp >= 60 ? '오름 신호가 우세' : pp <= 40 ? '내림 · 위험 신호가 우세' : '오름 · 내림 신호가 엇갈림' };
  }
  async function paintTemps() {
    const box = $('mTemps'); const st = await getBrief('market/sumtemp.json').catch(() => null);
    const ds = mui.dates.slice(0, 30).reverse(); if (ds.length < 2) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="m-temps" role="group" aria-label="날짜별 시장 온도 (오름 신호 비율)"><span class="lb">날짜별 시장 온도<small>오름 신호 비율 · 누르면 그날</small></span><div class="bars">${ds.map(d => { const t = st && st.dates && st.dates[d]; const v = t ? t.pp : null; return `<button type="button" data-md="${d}" class="${d === mui.date ? 'on' : ''} ${v == null ? 'na' : v >= 60 ? 'up' : v <= 40 ? 'dn' : 'mid'}" title="${dLabel(d)} · ${t ? `${t.mood} (오름 ${t.pos} · 내림 ${t.neg}, ${v}%)` : '아직 셈 안 함 (저녁 장 마감 기록 때 셈)'}"><i style="height:${v == null ? 6 : Math.max(8, v)}%"></i><em>${+d.slice(8)}</em></button>`; }).join('')}</div></div>`;
    box.querySelectorAll('[data-md]').forEach(b => b.onclick = () => { mui.date = b.dataset.md; renderSum(); });
  }
  async function renderSum(force) {
    const box = $('mList'); if (force) bui.cache = {};
    box.innerHTML = '<div class="sc-bmsg">뉴스와 리포트를 불러오는 중…</div>';
    let mi = null, si = null;
    try { [mi, si] = await Promise.all([getBrief('index.json'), getBrief('strategy/index.json')]); } catch (e) { box.innerHTML = `<div class="sc-bmsg">${esc(e.message)}</div>`; return; }
    const mds = (mi && mi.dates) || [], sds = (si && si.dates) || [];
    mui.dates = [...new Set(mds.concat(sds))].sort().reverse();
    if (!mui.date || !mui.dates.includes(mui.date)) mui.date = mui.dates[0] || '';
    $('mDate').innerHTML = mui.dates.map(d => `<option value="${d}"${d === mui.date ? ' selected' : ''}>${dLabel(d)}</option>`).join('');
    $('mPrev').disabled = mui.dates.indexOf(mui.date) >= mui.dates.length - 1; $('mNext').disabled = mui.dates.indexOf(mui.date) <= 0;
    paintTemps();
    const md = mds.includes(mui.date) ? await getBrief(mui.date + '.json').catch(() => null) : null;
    const sd = sds.includes(mui.date) ? await getBrief('strategy/' + mui.date + '.json').catch(() => null) : null;
    if (!md && !sd) { box.innerHTML = '<div class="sc-bmsg">아직 모닝 브리핑 · 전략 브리핑이 없습니다. 내일 아침 8시 이후에 다시 열어 보세요.</div>'; return; }
    const T = sumTempOf(md, sd), news = T.news;
    const daily = (sd && sd.daily) || [], weekly = (sd && sd.weekly) || [], reps = daily.concat(weekly);
    const fmtD = s => { if (!s) return ''; const x = new Date(s); return `${x.getMonth() + 1}월 ${x.getDate()}일 ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; };
    $('mLead').innerHTML = `모닝 브리핑 뉴스 <b>${news.length}건</b>${md ? ` (${fmtD(md.generatedAt)})` : ''} + 증권사 리포트 <b>${reps.length}개</b>${sd ? ` (${fmtD(sd.generatedAt)}, 데일리 ${sd.dailyDate || ''})` : ''}를 합쳐, 둘이 함께 가리키는 것을 규칙으로 골랐습니다. AI 토큰은 쓰지 않습니다.`;
    /* 1. 함께 가리키는 말 */
    const cnt = arr => { const m = new Map(); for (const t of arr) for (const w of sumWords(t)) m.set(w, (m.get(w) || 0) + 1); return m; };
    const nw = cnt(news.map(n => n.title)), rw = cnt(reps.map(r => r.title + ' ' + r.summary));
    const GEN = new Set(['시장', '미국', '증시', '국내', '주식', '투자', '전망', '한국', '글로벌', '투자자', '종목', '기업']); // 너무 흔한 말은 뺌
    const both = [...nw.keys()].filter(w => !GEN.has(w) && rw.has(w) && nw.get(w) >= 2 && rw.get(w) >= 2).map(w => ({ w, n: nw.get(w), r: rw.get(w), s: nw.get(w) / Math.max(1, news.length) + rw.get(w) / Math.max(1, reps.length) })).sort((a, b) => b.s - a.s).slice(0, 10);
    /* 2. 시장 온도 (sumTempOf — 장 마감 노트도 같은 규칙) */
    const { pos, neg, pp, mood } = T;
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
        <div><h2>${top3.length ? `${mui.date === ymdLocal(new Date()) ? '오늘' : dLabel(mui.date)} 뉴스와 증권사가 함께 가리키는 것: ${top3.map(esc).join(' · ')}` : '뉴스와 리포트가 함께 가리키는 말이 뚜렷하지 않습니다'}</h2>
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
    const plain = () => [`[전략 요약 ${mui.date}]`, `함께 가리키는 것: ${both.slice(0, 6).map(b => b.w).join(', ')}`, `시장 온도: ${mood} (오름 ${pos} · 내림 ${neg})`, '핵심 이슈:', ...issues.map(({ it, view }) => `- ${it.title}${view ? ` → [${view.who[0].broker}] ${view.t}` : ''}`), '위험:', ...riskR.map(p => '- ' + p.t), ...riskN.map(n => '- ' + n.title), '대응:', ...act.map(p => '- ' + p.t), `주목 기업: ${cos.map(x => x.c).join(', ')}`].join('\n');
    $('mNote').onclick = () => editNote(null, mui.date || ymdLocal(new Date()), plain() + '\n');
    $('mAsk').onclick = () => { show('chat'); send('오늘 모닝 브리핑과 증권사 전략 리포트를 규칙으로 합친 요약이야. 이것을 바탕으로 내 보유 · 관심 종목(get_portfolio), 나의 원칙, 매매 일지(get_journal)에 맞춰 오늘 할 일과 하지 말 일을 짧게 정리해 줘.\n\n' + plain()); };
  }

  /* =====================================================================
     종목 코드 ↔ 이름 — 장 마감 기록(market-close.yml)이 하루 한 번 briefing 브랜치에 저장한 목록
     · market/stocks-kr.json: 코스피 · 코스닥 전 종목(주식 · ETF · ETN) [코드, 이름, P/Q, s/e/n]
     · market/stocks-us.json: 미국 상장 종목(나스닥 트레이더 목록) [티커, 영문 이름, ETF 여부]
     · 미국 종목의 한글 이름은 companies.js 의 SEC_ALIAS(AAPL → 애플)를 함께 씀
     ===================================================================== */
  const STK = {};
  const stkLooksCode = q => { const s = normSym(q); return /^\d[0-9A-Z]{5}$/.test(s) || /^[A-Z][A-Z.\-]{0,6}$/.test(s); };
  function stkLoad(kind) {
    if (!STK[kind]) STK[kind] = (async () => {
      let j = null;
      try { const r = await fetch(briefUrl(`market/stocks-${kind}.json`)); if (r.ok) j = await r.json(); } catch (e) { }
      const rows = (j && j.rows) || [];
      if (!rows.length) setTimeout(() => { delete STK[kind]; }, 60000); // 못 받았으면 1분 뒤 다시
      return { rows, m: new Map(rows.map(x => [String(x[0]).toUpperCase(), x])) };
    })();
    return STK[kind];
  }
  const KR_ALIAS = () => { const a = window.SEC_ALIAS || {}, m = {}; for (const [k, v] of Object.entries(a)) if (/^[A-Z.]+$/.test(k) && !m[v]) m[v] = k; return m; }; // 애플 → AAPL
  const stkOut = (x, us) => us ? { code: x[0], name: (window.SEC_ALIAS || {})[x[0]] || x[1], en: x[1], mkt: '미국', etf: !!x[2] } : { code: x[0], name: x[1], mkt: x[2] === 'Q' ? '코스닥' : '코스피', etf: x[3] !== 's', kind: x[3] === 'e' ? 'ETF' : x[3] === 'n' ? 'ETN' : '' };
  async function stkName(sym) {
    const s = normSym(sym); if (!s) return null;
    if (/^\d[0-9A-Z]{5}$/.test(s)) { const x = (await stkLoad('kr')).m.get(s); return x ? stkOut(x) : null; }
    if (/^[A-Z][A-Z.\-]{0,6}$/.test(s)) { const x = (await stkLoad('us')).m.get(s) || (await stkLoad('us')).m.get(s.replace('.', '-')); return x ? stkOut(x, true) : null; }
    return null;
  }
  async function stkFind(q, n) {
    q = String(q || '').trim(); n = n || 8; if (!q) return [];
    const ql = q.toLowerCase().replace(/\s+/g, ''), out = [];
    const sc = (nm, sym) => { const t = nm.toLowerCase().replace(/\s+/g, ''); return sym && sym.toLowerCase() === ql ? 0 : t === ql ? 0 : t.startsWith(ql) ? 1 : t.includes(ql) ? 2 : 9; };
    const ka = KR_ALIAS()[q]; if (ka) { const x = (await stkLoad('us')).m.get(ka); out.push([-1, x ? stkOut(x, true) : { code: ka, name: q, mkt: '미국' }]); }
    (await stkLoad('kr')).rows.forEach((x, i) => { const v = sc(x[1], x[0]); if (v < 9) out.push([v + (x[3] === 's' ? 0 : .5) + i / 1e5, stkOut(x)]); });
    if (/^[a-z]/i.test(q)) (await stkLoad('us')).rows.forEach(x => { const v = sc(x[1], x[0]); if (v < 9) out.push([v + .3 + (x[2] ? .5 : 0), stkOut(x, true)]); });
    const seen = new Set();
    return out.sort((a, b) => a[0] - b[0]).map(x => x[1]).filter(x => !seen.has(x.code) && seen.add(x.code)).slice(0, n);
  }
  const stkLabel = r => `${r.name}${r.en && r.en !== r.name ? ` (${r.en})` : ''} · ${r.mkt}${r.kind ? ' ' + r.kind : r.etf ? ' ETF' : ''}`;
  /* 입력칸에 붙이기: 코드 · 티커 → 이름 채움, 이름 → 고를 목록 */
  function stkBind(symEl, nameEl, hintEl, onPick) {
    let tm = 0, seq = 0; const box = document.createElement('div'); box.className = 'sc-sugg'; box.hidden = true; symEl.insertAdjacentElement('afterend', box);
    const auto = () => !nameEl || !nameEl.value.trim() || nameEl.dataset.auto === '1';
    const hint = (t, cls) => { if (hintEl) { hintEl.textContent = t; hintEl.className = 'hint ' + (cls || ''); } };
    const pick = r => { symEl.value = r.code; if (nameEl) { nameEl.value = r.name; nameEl.dataset.auto = '1'; } box.hidden = true; hint('✓ ' + stkLabel(r), 'ok'); if (onPick) onPick(r); };
    const list = rs => { box.innerHTML = rs.map((r, i) => `<button type="button" data-i="${i}"><b>${esc(r.name)}</b><span>${esc(r.code)} · ${esc(r.mkt)}${r.kind ? ' ' + r.kind : r.etf ? ' ETF' : ''}${r.en && r.en !== r.name ? ' · ' + esc(r.en) : ''}</span></button>`).join(''); box.hidden = !rs.length; box.querySelectorAll('[data-i]').forEach(b => b.onmousedown = e => { e.preventDefault(); pick(rs[+b.dataset.i]); }); };
    const run = async src => {
      const my = ++seq, v = src.value.trim(); if (!v) { box.hidden = true; return; }
      if (src === symEl && stkLooksCode(v)) {
        const r = await stkName(v).catch(() => null); if (my !== seq) return;
        if (r) { if (auto() && nameEl) { nameEl.value = r.name; nameEl.dataset.auto = '1'; } hint('✓ ' + stkLabel(r) + ' — ' + normSym(v), 'ok'); box.hidden = true; if (onPick) onPick(r, true); return; }
        if (/^[A-Z]/i.test(v)) { const rs = await stkFind(v, 6).catch(() => []); if (my !== seq) return; if (rs.length) { list(rs); hint('목록에서 고르세요'); return; } }
        hint(STK.kr ? '목록에 없는 코드 — 그대로 저장해도 됩니다 (시세 API 로 확인)' : '종목 목록을 받는 중…', 'warn'); box.hidden = true; return;
      }
      const rs = await stkFind(v, 8).catch(() => []); if (my !== seq) return;
      list(rs); hint(rs.length ? '목록에서 고르세요' : '찾지 못했습니다 — 6자리 코드나 티커로 넣어 보세요', rs.length ? '' : 'warn');
    };
    const on = src => () => { if (src === nameEl) nameEl.dataset.auto = ''; clearTimeout(tm); tm = setTimeout(() => run(src), 220); };
    symEl.addEventListener('input', on(symEl)); if (nameEl) nameEl.addEventListener('input', on(nameEl));
    symEl.addEventListener('keydown', e => { if (e.key === 'Escape') box.hidden = true; if (e.key === 'Enter' && !box.hidden && box.firstChild) { e.preventDefault(); box.firstChild.dispatchEvent(new MouseEvent('mousedown')); } });
    symEl.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 150));
    if (symEl.value.trim() && nameEl && !nameEl.value.trim()) run(symEl);
  }
  /* 빠른 추가 줄 — 오늘 한눈에(레이더) · 관심 종목 · 보유 */
  function quickAdd(el, after) {
    if (!el || el.dataset.on) return; el.dataset.on = '1';
    el.innerHTML = `<form class="sc-quick" autocomplete="off"><div class="in"><input type="text" name="q" placeholder="티커 · 종목코드 · 이름 (예: 005930 · AAPL · 삼성전자)" aria-label="추가할 종목"></div><button class="btn">${icon('plus', 15)}관심 종목에 추가</button><p class="hint" data-h>코드나 티커를 넣으면 종목 이름이 저절로 나옵니다.</p></form>`;
    const f = el.querySelector('form'); let got = null;
    stkBind(f.q, null, f.querySelector('[data-h]'), r => { got = r; });
    f.q.addEventListener('input', () => { got = null; });
    f.onsubmit = async e => {
      e.preventDefault(); const v = f.q.value.trim(); if (!v) return;
      let r = got && got.code === normSym(v) ? got : stkLooksCode(v) ? await stkName(v).catch(() => null) : (await stkFind(v, 1).catch(() => []))[0];
      const code = r ? r.code : normSym(v);
      if (!stkLooksCode(code)) { toast('종목을 찾지 못했습니다 — 6자리 코드나 티커로 넣어 주세요', 2600); return; }
      if (watch.items.some(it => normSym(it.symbol) === code)) { toast(`${r ? r.name : code} 은(는) 이미 있습니다`, 2000); return; }
      watch.items.push({ symbol: code, name: r ? r.name : '', qty: '', avg: '', stop: '', target: '', alertHi: '', alertLo: '', memo: '' }); saveWatch();
      $('cWatch').textContent = watch.items.length || '';
      f.q.value = ''; got = null; f.querySelector('[data-h]').textContent = `${r ? r.name + ' (' + code + ')' : code} 을(를) 더했습니다 — 수량 · 손절가는 관심 종목 · 보유에서`; f.querySelector('[data-h]').className = 'hint ok';
      if (after) after();
    };
  }
  /* 이름이 비어 있는 관심 종목에 이름 채우기 (한 번) */
  async function fillNames() {
    const miss = watch.items.filter(it => it.symbol && !it.name); if (!miss.length) return;
    let n = 0; for (const it of miss) { const r = await stkName(it.symbol).catch(() => null); if (r && !it.name) { it.name = r.name; n++; } }
    if (!n) return; saveWatch(); if (!$('vWatch').hidden) renderWatch(); if (td.radar) td.radar.forEach(r => { if (!r.it.name) { const w = watch.items.find(x => x.symbol === r.it.symbol); if (w) r.it.name = w.name; } });
  }

  /* =====================================================================
     키워드 추적 — 모닝 브리핑 뉴스 · 증권사 리포트(날짜별 파일) · AI 대화 · 노트 · 매매 일지에서 찾기 (AI 토큰 안 씀)
     · 지난 날짜 파일은 줄여서 브라우저 Cache Storage(sec-corpus-v1)에 둠 — 다시 받지 않음
     · 추적 키워드는 me.track (기기끼리 맞춤), 마지막으로 본 건수는 이 기기에만(sec:trackSeen)
     ===================================================================== */
  const K_TSEEN = 'sec:trackSeen';
  if (!Array.isArray(me.track)) me.track = [];
  const kmem = {};
  async function briefRaw(f) {
    const ref = await latestRef();
    let r = await fetch(briefUrl(f, ref), { cache: 'no-store' }); if (ref && !r.ok && r.status !== 404) r = await fetch(briefUrl(f), { cache: 'no-store' });
    return r.ok ? r.json() : null;
  }
  let kidx = null;
  async function corpusIdx() {
    if (kidx && Date.now() - kidx.at < 10 * 60000) return kidx;
    const [mi, si] = await Promise.all([briefRaw('index.json').catch(() => null), briefRaw('strategy/index.json').catch(() => null)]);
    kidx = { at: Date.now(), m: (mi && mi.dates) || [], s: (si && si.dates) || [] }; kidx.all = [...new Set(kidx.m.concat(kidx.s))].sort().reverse(); return kidx;
  }
  async function corpusDay(d, ix) {
    if (kmem[d]) return kmem[d];
    const past = d < ymdLocal(new Date()), key = 'https://sec-corpus.invalid/' + d; let v = null;
    if (past && window.caches) try { const c = await caches.open('sec-corpus-v1'); const r = await c.match(key); if (r) v = await r.json(); } catch (e) { }
    if (!v) {
      const [md, sd] = await Promise.all([ix.m.includes(d) ? briefRaw(d + '.json').catch(() => null) : null, ix.s.includes(d) ? briefRaw('strategy/' + d + '.json').catch(() => null) : null]);
      const T = sumTempOf(md, sd);
      v = { news: T.news.map(n => ({ t: n.title, s: n.source, l: n.link, c: n.category || '' })), reps: T.reps.map(r => ({ t: r.title, b: r.broker, l: r.link, k: r.kindName || '', x: String(r.summary || '') })), temp: { pos: T.pos, neg: T.neg, pp: T.pp } };
      if (past && (md || sd) && window.caches) try { const c = await caches.open('sec-corpus-v1'); await c.put(key, new Response(JSON.stringify(v), { headers: { 'content-type': 'application/json' } })); } catch (e) { }
    }
    kmem[d] = v; return v;
  }
  const kTerms = q => String(q || '').split(/[,，]/).map(x => x.trim().toLowerCase()).filter(Boolean);
  const kHit = (txt, terms) => { const t = String(txt || '').toLowerCase(); return terms.length && terms.every(w => t.includes(w)); };
  const kSnip = (txt, terms) => { const s = String(txt || ''); const ln = s.split('\n').find(l => kHit(l, terms.slice(0, 1))) || s; const i = ln.toLowerCase().indexOf(terms[0]); return (i > 60 ? '…' : '') + ln.slice(Math.max(0, i - 60), i + 120).trim(); };
  async function kSearch(q, days) {
    const terms = kTerms(q); if (!terms.length) return null;
    const ix = await corpusIdx(), ds = ix.all.slice(0, days), since = ds[ds.length - 1] || ymdLocal(new Date(Date.now() - days * 864e5));
    const out = { q, terms, days: ds, byDay: {}, news: [], reps: [], chats: [], notes: [], journal: [] };
    const bump = (d, k) => { const o = out.byDay[d] || (out.byDay[d] = { news: 0, reps: 0, mine: 0 }); o[k]++; };
    for (const d of ds) {
      const v = await corpusDay(d, ix);
      for (const n of v.news) if (kHit(n.t + ' ' + n.c, terms)) { out.news.push(Object.assign({ d }, n)); bump(d, 'news'); }
      for (const r of v.reps) if (kHit(r.t + '\n' + r.x, terms)) { out.reps.push(Object.assign({ d, snip: kSnip(r.t + '\n' + r.x, terms) }, r)); bump(d, 'reps'); }
    }
    for (const c of chats) for (const m of c.view || []) { if (!m.text || !kHit(m.text, terms)) continue; const d = ymdLocal(new Date(m.t || c.updated || Date.now())); if (d < since) continue; out.chats.push({ id: c.id, title: c.title, role: m.role, d, snip: kSnip(m.text, terms) }); bump(d, 'mine'); }
    for (const n of notes) if (n.date >= since && kHit(n.text, terms)) { out.notes.push({ id: n.id, d: n.date, snip: kSnip(n.text, terms), auto: !!n.auto }); bump(n.date, 'mine'); }
    for (const t of journal) { const txt = [t.symbol, t.reason, t.exitReason, t.lesson, t.ai].join('\n'); const d = d10(t.openDate) || ''; if (d >= since && kHit(txt, terms)) { out.journal.push({ symbol: t.symbol, d, snip: kSnip(txt, terms) }); bump(d, 'mine'); } }
    return out;
  }
  const kui = { q: '', days: 14, res: null, busy: false };
  $('kDays').onchange = e => { kui.days = +e.target.value; if (kui.q) runK(kui.q); };
  $('kForm').onsubmit = e => { e.preventDefault(); runK($('kQ').value); };
  $('kTrack').onclick = () => { const k = $('kQ').value.trim(); if (!k) { toast('추적할 키워드를 넣어 주세요', 1800); return; } if (me.track.some(t => t.k === k)) { toast('이미 추적 중입니다', 1600); return; } me.track.push({ k, at: Date.now() }); me.track = me.track.slice(-20); saveMe(); paintTracks(); runK(k); toast(`"${k}" 추적을 시작합니다`, 2000); };
  async function runK(q) {
    q = String(q || '').trim(); if (!q) return; kui.q = q; $('kQ').value = q;
    const box = $('kOut'); box.innerHTML = '<div class="sc-bmsg">뉴스 · 리포트를 찾는 중… (처음엔 날짜별 파일을 받느라 조금 걸립니다)</div>';
    try { kui.res = await kSearch(q, kui.days); } catch (e) { box.innerHTML = `<div class="sc-bmsg">${esc(e.message)}</div>`; return; }
    paintK(); paintTracks();
  }
  function paintK() {
    const r = kui.res, box = $('kOut'); if (!r) { box.innerHTML = ''; return; }
    const tot = r.news.length + r.reps.length + r.chats.length + r.notes.length + r.journal.length;
    const ds = r.days.slice().reverse(), mx = Math.max(1, ...ds.map(d => { const o = r.byDay[d] || {}; return (o.news || 0) + (o.reps || 0) + (o.mine || 0); }));
    const sec = (title, sub, items, fn) => `<section class="sc-card k-sec"><h2>${title} <small>${items.length}건</small></h2><p class="sub">${sub}</p>${items.length ? `<ol class="k-list">${items.slice(0, 30).map(fn).join('')}</ol>${items.length > 30 ? `<p class="sc-fine">최근 30건만 보여 줍니다</p>` : ''}` : '<p class="sc-fine" style="text-align:left">없음</p>'}</section>`;
    const md = d => `${+d.slice(5, 7)}/${+d.slice(8)}`;
    const hl = t => { let h = esc(t); for (const w of r.terms) h = h.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); return h; };
    box.innerHTML = `<section class="sc-card k-head"><h2>"${esc(r.q)}" — ${tot}건 <small>최근 ${r.days.length}일 (브리핑이 있는 날)</small></h2>
      <div class="k-bars" role="img" aria-label="날짜별 건수">${ds.map(d => { const o = r.byDay[d] || {}, n = (o.news || 0) + (o.reps || 0), m = o.mine || 0; return `<div title="${md(d)} · 뉴스 ${o.news || 0} · 리포트 ${o.reps || 0} · 내 기록 ${m}"><span><i class="n" style="height:${(o.news || 0) / mx * 100}%"></i><i class="r" style="height:${(o.reps || 0) / mx * 100}%"></i><i class="m" style="height:${m / mx * 100}%"></i></span><em>${n + m || ''}</em><small>${md(d)}</small></div>`; }).join('')}</div>
      <div class="k-lg"><span class="n">뉴스</span><span class="r">증권사 리포트</span><span class="m">내 기록(AI 대화 · 노트 · 일지)</span></div>
      <div class="row"><button class="btn sm" id="kAsk">${icon('sparkle', 14)}AI 에게 이 키워드 흐름 정리 받기</button>${me.track.some(t => t.k === r.q) ? '' : `<button class="btn sm ghost" id="kTrack2">${icon('eye', 14)}추적에 올리기</button>`}</div></section>
      <div class="k-grid">
      ${sec('뉴스', '모닝 브리핑(여러 언론 피드)', r.news, x => `<li><a href="${esc(x.l)}" target="_blank" rel="noopener">${hl(x.t)}</a><span>${md(x.d)} · ${esc(x.s || '')}</span></li>`)}
      ${sec('증권사 리포트', '전략 브리핑(데일리 · 주간 전략)', r.reps, x => `<li><a href="${esc(x.l)}" target="_blank" rel="noopener">${hl(x.t)}</a><span>${md(x.d)} · ${esc(x.b || '')} ${esc(x.k)}</span><p>${hl(x.snip)}</p></li>`)}
      ${sec('AI 어시스턴트 대화', '이 기기에 있는 대화 (기기 동기화를 켜면 모든 기기 것)', r.chats, x => `<li><button type="button" class="k-go" data-chat="${esc(x.id)}">${esc(x.title || '대화')}</button><span>${md(x.d)} · ${x.role === 'user' ? '내 질문' : 'AI 답'}</span><p>${hl(x.snip)}</p></li>`)}
      ${sec('노트', '장 마감 기록 포함', r.notes, x => `<li><button type="button" class="k-go" data-note="${esc(x.d)}">${md(x.d)} 노트${x.auto ? ' (장 마감)' : ''}</button><p>${hl(x.snip)}</p></li>`)}
      ${sec('매매 일지', '이유 · 청산 이유 · 교훈 · AI 의견', r.journal, x => `<li><button type="button" class="k-go" data-jr="1">${esc(x.symbol)}</button><span>${md(x.d)}</span><p>${hl(x.snip)}</p></li>`)}
      </div>`;
    box.querySelectorAll('[data-chat]').forEach(b => b.onclick = () => { openChat(b.dataset.chat); show('chat'); });
    box.querySelectorAll('[data-note]').forEach(b => b.onclick = () => { nui.day = b.dataset.note; nui.month = null; nui.co = ''; show('notes'); });
    box.querySelectorAll('[data-jr]').forEach(b => b.onclick = () => show('journal'));
    const t2 = $('kTrack2'); if (t2) t2.onclick = () => $('kTrack').click();
    $('kAsk').onclick = () => {
      const lines = [`키워드 "${r.q}" 를 최근 ${r.days.length}일 동안 추적한 결과야 (뉴스 ${r.news.length} · 리포트 ${r.reps.length} · 내 기록 ${r.chats.length + r.notes.length + r.journal.length}).`, '날짜별 건수: ' + ds.map(d => { const o = r.byDay[d] || {}; return `${md(d)} ${(o.news || 0) + (o.reps || 0)}`; }).join(', '), '최근 뉴스:', ...r.news.slice(0, 8).map(x => `- ${md(x.d)} ${x.t}`), '최근 리포트:', ...r.reps.slice(0, 6).map(x => `- ${md(x.d)} [${x.b}] ${x.t}: ${x.snip}`)];
      show('chat'); send(lines.join('\n') + '\n\n이 키워드가 언제부터 왜 많이 나왔는지, 증권사 시각이 어떻게 바뀌었는지, 내 보유 · 관심 종목(get_portfolio)에 주는 의미를 짧게 정리해 줘. 근거 없는 전망은 빼고, 확인할 것을 알려 줘.');
    };
  }
  /* 추적 칩: 최근 브리핑 날의 건수 · 지난번에 본 뒤 새로 나온 건수 */
  async function trackCounts() {
    if (!me.track.length) return {};
    const ix = await corpusIdx(), d = ix.all[0]; if (!d) return {};
    const v = await corpusDay(d, ix), out = {};
    for (const t of me.track) { const terms = kTerms(t.k); out[t.k] = { d, n: v.news.filter(n => kHit(n.t + ' ' + n.c, terms)).length + v.reps.filter(r => kHit(r.t + '\n' + r.x, terms)).length }; }
    return out;
  }
  let tcount = {};
  async function paintTracks(refresh) {
    const box = $('kTracks'); if (refresh || !Object.keys(tcount).length) try { tcount = await trackCounts(); } catch (e) { }
    const seen = LS.get(K_TSEEN, {}), fresh = t => { const c = tcount[t.k]; if (!c) return 0; const s = seen[t.k]; return s && s.d === c.d ? Math.max(0, c.n - s.n) : c.n; };
    const totalNew = me.track.reduce((a, t) => a + fresh(t), 0); $('cTrack').textContent = totalNew || '';
    if (kui.q && tcount[kui.q]) { seen[kui.q] = tcount[kui.q]; LS.set(K_TSEEN, seen); }
    if (!box) return;
    box.innerHTML = me.track.length ? '<span class="lb">추적 중</span>' + me.track.map(t => { const c = tcount[t.k], f = fresh(t); return `<span class="k-chip${kui.q === t.k ? ' on' : ''}"><button type="button" data-k="${esc(t.k)}">${esc(t.k)}${c ? ` <em>${c.n}</em>` : ''}${f && kui.q !== t.k ? `<i title="새로 나온 건수">+${f}</i>` : ''}</button><button type="button" class="x" data-kx="${esc(t.k)}" aria-label="${esc(t.k)} 추적 그만" title="추적 그만">${icon('x', 11)}</button></span>`; }).join('') + `<span class="sc-fine">숫자 = ${tcount[me.track[0].k] ? `${+tcount[me.track[0].k].d.slice(5, 7)}월 ${+tcount[me.track[0].k].d.slice(8)}일` : '최근'} 브리핑의 뉴스 · 리포트 건수</span>` : '<span class="sc-fine">추적 중인 키워드가 없습니다. 키워드를 넣고 [추적]을 누르면 매일 몇 번 나왔는지 보여 줍니다.</span>';
    box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => runK(b.dataset.k));
    box.querySelectorAll('[data-kx]').forEach(b => b.onclick = () => { me.track = me.track.filter(t => t.k !== b.dataset.kx); saveMe(); paintTracks(); });
  }
  function renderTrack() { paintTracks(true); if (kui.res) paintK(); else if (me.track[0]) runK(me.track[0].k); setTimeout(() => $('kQ').focus(), 30); }
  setTimeout(() => { paintTracks(true).catch(() => { }); }, 4000);
  /* AI 도구 search_records 가 씀 */
  async function searchRecords(q, days) {
    const r = await kSearch(q, Math.max(3, Math.min(60, +days || 14))); if (!r) throw new Error('query 가 비었습니다');
    const ds = r.days.slice().reverse();
    return { query: r.q, days: r.days.length, counts: { news: r.news.length, reports: r.reps.length, chats: r.chats.length, notes: r.notes.length, journal: r.journal.length }, byDay: ds.map(d => Object.assign({ date: d }, r.byDay[d] || { news: 0, reps: 0, mine: 0 })),
      news: r.news.slice(0, 12).map(x => ({ date: x.d, title: x.t, source: x.s, link: x.l })), reports: r.reps.slice(0, 10).map(x => ({ date: x.d, broker: x.b, title: x.t, snippet: x.snip, link: x.l })),
      myRecords: r.chats.slice(0, 5).map(x => ({ kind: 'AI 대화', date: x.d, title: x.title, snippet: x.snip })).concat(r.notes.slice(0, 5).map(x => ({ kind: '노트', date: x.d, snippet: x.snip })), r.journal.slice(0, 5).map(x => ({ kind: '매매 일지', date: x.d, symbol: x.symbol, snippet: x.snip }))),
      note: '모닝 브리핑 · 전략 브리핑이 있는 날만 셈. 뉴스 · 리포트 원문은 링크에서 확인' };
  }

  /* =====================================================================
     API 수익 루틴 — 등록한 API 를 "규칙 → 오늘 할 일"로 잇는 점검 (수익을 약속하지 않음 · 큰 손실을 피하는 규칙만)
     1. 추세 필터: KODEX 200(069500) 이 200일선(약 10개월선) 위인지 — 아래면 새 위성 매매 크기를 절반으로 (R29–R35)
     2. 보유 종목 추세 × 손익: 손실 + 200일선 아래 = 손절 규칙 다시 보기, 이익 + 200일선 위 = 일찍 팔지 않기 (처분 효과 R11 · R49)
     3. 위험 공시: 보유 한국 종목의 최근 7일 공시 가운데 유상증자 · 전환사채 · 감자 · 소송 등 (OpenDART)
     4. 가격 경보: 손절가 이탈 · 목표가 도달 (시세 API)
     결과는 이 기기에 6시간 기억 (API 사용량 아낌)
     ===================================================================== */
  const K_RT = 'sec:routine';
  const RISK_DIS = /유상증자|전환사채|신주인수권|교환사채|감자|관리종목|불성실|횡령|배임|소송|상장폐지|거래정지|감사의견|투자주의|투자경고|최대주주\s*변경|영업정지/;
  let rtBusy = false;
  async function runRoutines() {
    if (rtBusy) return; rtBusy = true; paintRoutines();
    const H = watch.items.filter(it => +it.qty > 0).slice(0, 12), res = { at: Date.now(), items: [] };
    const add = (id, o) => res.items.push(Object.assign({ id }, o));
    try {
      /* 1 추세 필터 */
      if (dataFor('history')) {
        try {
          const b = await callData('history', '069500', 300), a = b.length > 200 ? analyze(b) : null;
          if (!a || !a.sma.d200) add('trend', { st: 'na', v: `일봉이 ${b.length}개뿐이라 200일선을 못 셉니다` });
          else { const up = a.last >= a.sma.d200; add('trend', { st: up ? 'ok' : 'warn', v: `KODEX 200 ${num(a.last)} · 200일선 ${num(a.sma.d200)} (${a.fromSmaPct.d200 > 0 ? '+' : ''}${a.fromSmaPct.d200}%)`, act: up ? '추세 위 — 새 위성 매매는 정한 크기대로. 핵심 지수는 정한 날에만 리밸런싱.' : '추세 아래 — 새 위성 매매 크기를 절반으로. 핵심 지수를 팔라는 뜻은 아닙니다(정한 리밸런싱 날에만 손댐).', half: !up }); }
        } catch (e) { add('trend', { st: 'na', v: '일봉을 받지 못했습니다: ' + e.message }); }
      } else add('trend', { st: 'need', need: '일봉(차트) API' });
      /* 2 보유 추세 × 손익 + 4 가격 경보 */
      if (!H.length) add('hold', { st: 'na', v: '보유 수량을 적은 종목이 없습니다' });
      else if (!dataFor('quote')) add('hold', { st: 'need', need: '시세 API' });
      else {
        const rows = [];
        for (const it of H) {
          const code = normSym(it.symbol), r = { name: it.name || code };
          try { const q = await callData('quote', code); r.p = q.price; } catch (e) { r.err = '시세'; }
          if (dataFor('history')) try { const b = await callData('history', code, 260); const a = b.length > 200 ? analyze(b) : null; if (a && a.sma.d200) r.d200 = a.sma.d200; } catch (e) { }
          if (r.p && +it.avg) r.pl = (r.p / +it.avg - 1) * 100;
          if (r.p && +it.stop && r.p <= +it.stop) r.flag = ['bad', '손절가 이탈 — 정한 대로 정리할지 오늘 결정'];
          else if (r.p && +it.target && r.p >= +it.target) r.flag = ['good', '목표가 도달 — 계획대로 일부 실현할지 결정'];
          else if (r.pl != null && r.d200 && r.pl < 0 && r.p < r.d200) r.flag = ['warn', '손실 + 200일선 아래 — 버티는 이유를 한 문장으로 다시 쓰기(처분 효과)'];
          else if (r.pl != null && r.d200 && r.pl > 0 && r.p >= r.d200) r.flag = ['ok', '이익 + 추세 위 — 이유 없이 일찍 팔지 않기'];
          else if (r.p && !+it.stop) r.flag = ['warn', '손절가 없음 — 정하기'];
          rows.push(r);
        }
        const bad = rows.filter(r => r.flag && (r.flag[0] === 'bad' || r.flag[0] === 'warn')).length;
        add('hold', { st: bad ? 'warn' : 'ok', v: `보유 ${rows.length}종목 · 할 일 ${bad}개`, rows });
      }
      /* 3 위험 공시 */
      const KR = H.filter(it => /^\d[0-9A-Z]{5}$/.test(normSym(it.symbol)));
      if (!KR.length) add('dis', { st: 'na', v: '보유한 한국 종목이 없습니다' });
      else if (!dataFor('dart')) add('dis', { st: 'need', need: 'OpenDART API' });
      else {
        const hits = [];
        for (const it of KR) { try { const d = await DATA.dart.disclosures(await keyOf(dataFor('dart')), normSym(it.symbol), 7); for (const x of d.items) if (RISK_DIS.test(x.title)) hits.push({ name: it.name || it.symbol, date: x.date, title: x.title, url: x.url }); } catch (e) { } }
        add('dis', { st: hits.length ? 'bad' : 'ok', v: hits.length ? `위험 공시 ${hits.length}건` : `최근 7일 위험 공시 없음 (${KR.length}종목)`, hits, act: hits.length ? '공시 원문을 읽기 전에는 그 종목을 더 사지 않습니다.' : '' });
      }
    } finally { rtBusy = false; }
    LS.set(K_RT, res); paintRoutines();
  }
  function paintRoutines() {
    const box = $('engRoutine'); if (!box) return;
    const r = LS.get(K_RT, null), get = id => r && (r.items || []).find(x => x.id === id);
    const ST2 = { ok: ['괜찮음', 'ok'], warn: ['할 일', 'warn'], bad: ['먼저 볼 것', 'bad'], na: ['자료 없음', 'na'], need: ['API 필요', 'na'] };
    const card = (id, title, api, why, ref) => { const x = get(id); const st = x ? ST2[x.st] : null; return `<div class="en-c ${st ? st[1] : 'na'}"><div class="h"><span class="st">${st ? st[0] : '아직 안 봄'}</span><b>${title}</b><span class="ref">${ref}</span></div>
      <p class="v">${x ? (x.st === 'need' ? `${esc(x.need)} 를 등록하면 자동으로 점검합니다 <button type="button" class="btn sm ghost" data-goapi>API 연결</button>` : esc(x.v || '')) : `쓰는 API: ${api}`}</p>
      ${x && x.act ? `<p class="fix">${esc(x.act)}</p>` : ''}
      ${x && x.rows ? `<ul class="en-rt">${x.rows.map(o => `<li class="${o.flag ? o.flag[0] : ''}"><b>${esc(o.name)}</b><span>${o.p ? num(o.p) : '시세 없음'}${o.pl != null ? ` · ${o.pl > 0 ? '+' : ''}${num(o.pl, 1)}%` : ''}${o.d200 ? ` · 200일선 ${o.p >= o.d200 ? '위' : '아래'}` : ''}</span>${o.flag ? `<em>${esc(o.flag[1])}</em>` : ''}</li>`).join('')}</ul>` : ''}
      ${x && x.hits && x.hits.length ? `<ul class="en-rt">${x.hits.map(h => `<li class="bad"><b>${esc(h.name)}</b><span>${esc(h.date)}</span><em><a href="${esc(h.url)}" target="_blank" rel="noopener">${esc(h.title)}</a></em></li>`).join('')}</ul>` : ''}
      <p class="why">${why}</p></div>`; };
    const trend = get('trend');
    box.innerHTML = `<h2>API 수익 루틴 <small>등록한 API → 규칙 → 오늘 할 일</small></h2>
      <p class="sub">수익을 약속하지 않습니다. 오래 살아남은 투자자들이 지킨 "큰 손실을 피하는 규칙"을, 등록한 API 로 매일 자동 점검합니다. ${r ? `마지막 점검 ${new Date(r.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : '아직 점검하지 않았습니다'}${trend && trend.half ? ' · <b class="warn">추세 필터: 새 위성 매매 크기 절반</b>' : ''}</p>
      <div class="en-checks">
        ${card('trend', '추세 필터 (10개월선)', '일봉(차트) API', '지수가 약 10개월(200거래일) 이동평균 아래일 때 위험 자산을 줄이는 규칙은 큰 하락장의 낙폭을 줄였다는 연구가 많습니다(수익을 늘린다는 보장은 없음). 이 앱에서는 새 위성 매매 크기를 줄이는 데만 씁니다.', 'R29–R35')}
        ${card('hold', '보유 종목: 추세 × 손익 · 가격 경보', '시세 API (+ 일봉 API)', '개인은 이익 종목을 일찍 팔고 손실 종목을 오래 드는 경향(처분 효과)이 있습니다. 손실이면서 추세까지 꺾인 종목을 먼저 다시 봅니다.', 'R11 · R49')}
        ${card('dis', '보유 종목 위험 공시 (최근 7일)', 'OpenDART API', '유상증자 · 전환사채 · 감자 · 소송 · 관리종목 같은 공시는 주가에 큰 영향을 줍니다. 원문을 읽기 전에는 더 사지 않는 규칙.', 'OpenDART')}
      </div>
      <div class="sc-add-row"><button class="btn ink" id="rtRun"${rtBusy ? ' disabled' : ''}>${icon('refresh', 15)}${rtBusy ? '점검하는 중…' : '지금 점검'}</button><span class="sub">보유 종목마다 시세 · 일봉 · 공시를 한 번씩 부릅니다 (최대 12종목)</span></div>`;
    fillIcons(box);
    const b = $('rtRun'); if (b) b.onclick = () => runRoutines();
    box.querySelectorAll('[data-goapi]').forEach(x => x.onclick = () => show('apis'));
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
  const rawBox = (e, it) => (it || (e && e.tried)) ? `<details class="sc-raw" open><summary>받은 원문 · 시도한 값</summary><pre>${e && e.tried ? esc('시도: ' + e.tried.join(' → ')) + '\n' : ''}${it ? esc(JSON.stringify(it, null, 1)) : '(원문 없음 — 서버가 오류만 보냄)'}</pre></details>` : '';
  /* 작년 배당 순위 전체를 한 번만 받아 코드 → 배당 으로 (하루 1회) */
  function ksdDividends(year) {
    const a = dataFor('ksd'); if (!a) return Promise.resolve(null);
    const fk = 'divfail:' + year, f = ksdCache[fk];
    if (f && Date.now() - f.t < 6 * 36e5) return Promise.reject(Object.assign(new Error(f.v.msg), { raw: f.v.raw, tried: f.v.tried })); // 실패도 6시간 기억 (하루 100회 아끼기 · [다시 받기] 로 즉시)
    return ksdCached('div:' + year, 24 * 7, async () => {
      const key = await keyOf(a);
      /* 시장별로 순위 상위 100건씩 (한 번에 1000건은 거절됨) — 유가증권 · 코스닥 2번이면 끝 */
      const byMarket = async (extra) => { const out = { total: 0, items: [] }; for (const lt of ['11', '12']) { const r = await DATA.ksd.call(key, 'getDividendRankN1', Object.assign({ rankTpcd: '1', listTpcd: lt, pageNo: '1', numOfRows: '100' }, extra)); out.total += r.total; out.items = out.items.concat(r.items); } return out; };
      const tries = [
        ['시장별 100건', () => byMarket({ year: String(year) })],
        ['시장별 · 보통주', () => byMarket({ year: String(year), stkTpcd: '1' })],
        ['전체 100건', async () => DATA.ksd.call(key, 'getDividendRankN1', { rankTpcd: '1', year: String(year), pageNo: '1', numOfRows: '100' })],
        [`${year - 1}년`, () => byMarket({ year: String(year - 1) })],
      ];
      let r = null, err = null, used = year; const tried = [];
      for (const [name, t] of tries) {
        tried.push(name);
        try { const x = await t(); if (x.items.length) { r = x; if (name.endsWith('년')) used = year - 1; break; } }
        catch (e) { err = e; if (!/PARAMETER|NODATA|NO_DATA/i.test(e.message)) break; }
      }
      if (!r) {
        const e = err || new Error('배당 자료가 비어 있습니다'); e.tried = tried;
        ksdCache[fk] = { t: Date.now(), v: { msg: e.message, raw: e.raw || null, tried } }; LS.set(K_KSDC, ksdCache);
        throw e;
      }
      const m = {};
      for (const it of r.items) {
        const x = pick(it), code = x.shotnIsin || fld(x, /shotn|short|srtn/i);
        if (code) m[code] = [+fld(x, /^num$|rank/i) || 0, x.korSecnNm || fld(x, /nm$/i) || '', x.caltotMartTpcd || fld(x, /mart/i) || '', numOf(x.divAmtPerStk || fld(x, /amt/i)), numOf(x.divRateCpri || fld(x, /cpri|rate/i)), x.secnKacd || fld(x, /kacd|kind/i) || ''];
      }
      if (!Object.keys(m).length && r.items.length) { const e = new Error('배당 자료의 항목 이름이 예상과 다릅니다'); e.raw = r.items[0]; throw e; }
      return { total: r.total, m, year: used, top: true }; // top: 시장별 상위 100 까지만
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
    stock = { q, code: '', name: '', quote: null, bars: null, ksd: null, div: null, dart: null, news: null, err: {}, loading: true };
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
      jobs.push(ksdDividends(y).then(d => { stock.div = d ? { year: d.year || y, total: d.total, top: d.top, row: d.m[stock.code] || null } : null; }).catch(e => { stock.err.div = e.message; }).then(done));
    }
    if (dataFor('newsKR')) jobs.push((async () => { const a = dataFor('newsKR'); for (let i = 0; i < 20 && !stock.name && stock.loading; i++) await new Promise(r => setTimeout(r, 150)); stock.news = await DATA.naver.search(await keyOf(a), stock.name || stock.code, 8); })().catch(e => { stock.err.news = e.message; }).then(done));
    if (dataFor('dart') && /^\d[0-9A-Z]{5}$/.test(stock.code)) jobs.push((async () => { const a = dataFor('dart'), k2 = await keyOf(a); const [f, d] = await Promise.all([DATA.dart.financials(k2, stock.code).catch(e => ({ err: e.message })), DATA.dart.disclosures(k2, stock.code, 120).catch(e => ({ err: e.message }))]); stock.dart = { f, d }; })().catch(e => { stock.err.dart = e.message; }).then(done));
    await Promise.all(jobs); if (my === stockSeq) { stock.loading = false; renderStock(); }
  }

  /* 가격 차트 (SVG) — 선 또는 봉(캔들) · 20/60 이동평균 · 거래량 · 내 평균 단가/손절/목표 선 · 짚으면 그 봉의 값
     o.kind: 'line' | 'candle', o.per: 'D' | 'W' | 'M', o.ma20/o.ma60: 전체 기간으로 미리 계산한 이동평균(보이는 구간만큼) */
  function chartSvg(bars, mine, W, H, o) {
    if (!bars || bars.length < 2) return '';
    o = o || {}; W = W || 760; H = H || 260;
    const candle = o.kind === 'candle', volH = candle ? Math.round(H * .18) : 0;
    const P = { l: 8, r: 64, t: 14, b: 26 + volH };
    const n = bars.length, c = bars.map(b => b.c);
    const m20 = o.ma20 || c.map((_, i) => i + 1 >= 20 ? c.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20 : null);
    const m60 = o.ma60 || c.map((_, i) => i + 1 >= 60 ? c.slice(i - 59, i + 1).reduce((a, b) => a + b, 0) / 60 : null);
    let lo = Math.min(...bars.map(b => candle ? (b.l || b.c) : b.c)), hi = Math.max(...bars.map(b => candle ? (b.h || b.c) : b.c));
    if (!candle) { lo = Math.min(lo, ...bars.map(b => b.l || b.c)); hi = Math.max(hi, ...bars.map(b => b.h || b.c)); }
    [mine && +mine.avg, mine && +mine.stop, mine && +mine.target].filter(v => v > 0).forEach(v => { if (v > lo * .85 && v < hi * 1.15) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    const pad = (hi - lo) * .06 || hi * .02; lo = Math.max(0, lo - pad); hi += pad; // 가격은 0 아래로 그리지 않음
    const pw = W - P.l - P.r, step = pw / n, X = i => P.l + step * (i + .5), Y = v => P.t + (H - P.t - P.b) * (1 - (v - lo) / (hi - lo));
    const path = arr => arr.map((v, i) => v == null ? '' : `${arr[i - 1] == null ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    const up = c[n - 1] >= c[0], col = up ? 'var(--sc-up)' : 'var(--sc-down)';
    const ticks = [0, .25, .5, .75, 1].map(f => lo + (hi - lo) * f);
    const fmt = v => v >= 1000 ? Math.round(v).toLocaleString('ko-KR') : v.toFixed(v >= 100 ? 1 : 2);
    const dl = t => o.per === 'M' ? t.slice(0, 7) : t.slice(2);
    const dates = W < 480 ? [0, n - 1] : [0, Math.floor(n / 2), n - 1];
    const lines = [[mine && +mine.avg, '평균 단가'], [mine && +mine.stop, '손절'], [mine && +mine.target, '목표']].filter(([v]) => v > 0 && v > lo && v < hi);
    let body = '';
    if (candle) {
      const bw = Math.max(1, Math.min(14, step * .68)), vmax = Math.max(1, ...bars.map(b => b.v || 0)), vy = H - 26;
      body = bars.map((b, i) => {
        const oo = b.o || b.c, upc = b.c >= oo, cl = upc ? 'cu' : 'cd', x = X(i), y1 = Y(Math.max(oo, b.c)), y2 = Y(Math.min(oo, b.c));
        const v = b.v ? `<rect class="vb ${cl}" x="${(x - bw / 2).toFixed(1)}" y="${(vy - (volH - 6) * b.v / vmax).toFixed(1)}" width="${bw.toFixed(1)}" height="${((volH - 6) * b.v / vmax).toFixed(1)}"/>` : '';
        return `<line class="wk ${cl}" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${Y(b.h || Math.max(oo, b.c)).toFixed(1)}" y2="${Y(b.l || Math.min(oo, b.c)).toFixed(1)}"/><rect class="bd ${cl}" x="${(x - bw / 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, y2 - y1).toFixed(1)}"/>${v}`;
      }).join('');
    } else {
      body = `<path d="${path(c)}L${X(n - 1)},${H - P.b}L${X(0)},${H - P.b}Z" fill="${col}" opacity=".07"/><path d="${path(c)}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="${X(n - 1)}" cy="${Y(c[n - 1])}" r="3.5" fill="${col}"/>`;
    }
    return `<svg class="sc-chart${candle ? ' candle' : ''}" data-lo="${lo}" data-hi="${hi}" data-h="${H}" data-pb="${P.b}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${n}개 봉 ${candle ? '봉' : '선'} 차트">
      ${ticks.map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="${W - P.r + 6}" y="${Y(v) + 4}" class="ax">${fmt(v)}</text>`).join('')}
      ${candle ? `<line x1="${P.l}" x2="${W - P.r}" y1="${H - 26}" y2="${H - 26}" class="g"/>` : ''}
      ${dates.map(i => `<text x="${X(i)}" y="${H - 6}" class="ax" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${dl(bars[i].t)}</text>`).join('')}
      ${body}
      <path d="${path(m60)}" class="ma60"/><path d="${path(m20)}" class="ma20"/>
      ${lines.map(([v, nm]) => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" class="lv"/><text x="${P.l + 4}" y="${Y(v) - 4}" class="lvt">${nm} ${fmt(v)}</text>`).join('')}
      <g class="hv" style="display:none"><line class="hl" y1="${P.t}" y2="${H - 26}"/><circle r="4" class="hc"/></g>
      <rect class="hit" x="${P.l}" y="0" width="${pw}" height="${H}" fill="transparent" data-l="${P.l}" data-w="${pw}" data-vw="${W}"/>
    </svg>`;
  }
  function wireChart(box, bars, per) {
    const svg = box.querySelector('.sc-chart'); if (!svg) return;
    const hit = svg.querySelector('.hit'), hv = svg.querySelector('.hv'), tip = box.querySelector('.sc-tip');
    const H = +svg.dataset.h || 260, P = { t: 14, b: +svg.dataset.pb || 26 }, n = bars.length;
    const L = +svg.dataset.lo, Hh = +svg.dataset.hi; // 차트와 같은 세로 범위
    const unit = per === 'M' ? '월' : per === 'W' ? '주' : '일';
    const move = e => {
      const r = svg.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * +hit.dataset.vw, step = +hit.dataset.w / n;
      const i = Math.max(0, Math.min(n - 1, Math.floor((vx - +hit.dataset.l) / step)));
      const x = +hit.dataset.l + step * (i + .5);
      hv.style.display = ''; hv.querySelector('.hl').setAttribute('x1', x); hv.querySelector('.hl').setAttribute('x2', x);
      const b = bars[i], prev = bars[i - 1];
      hv.querySelector('.hc').setAttribute('cx', x); hv.querySelector('.hc').setAttribute('cy', P.t + (H - P.t - P.b) * (1 - (b.c - L) / (Hh - L)));
      const ch = prev ? (b.c / prev.c - 1) * 100 : null;
      tip.innerHTML = `<b>${esc(per === 'M' ? b.t.slice(0, 7) : b.t)}</b>${per === 'W' ? ' 주' : ''} ${b.o ? `시 ${num(b.o)} · 고 ${num(b.h)} · 저 ${num(b.l)} · ` : ''}종 <b>${num(b.c)}</b> <span class="${cls(ch)}">${prev ? `전${unit} 대비 ` : ''}${pct(ch)}</span>${b.v ? ` · 거래량 ${num(b.v, 0)}` : ''}`;
    };
    hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { hv.style.display = 'none'; tip.innerHTML = tip.dataset.def || ''; });
  }
  /* 긴 기간: 일봉을 주봉 · 월봉으로 묶음 */
  function aggBars(bars, per) {
    if (per === 'D') return bars;
    const key = t => { if (per === 'M') return t.slice(0, 7); const d = new Date(t + 'T00:00:00Z'), w = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - w); return d.toISOString().slice(0, 10); };
    const out = []; let g = null, gk = '';
    for (const b of bars) { const k = key(b.t); if (k !== gk) { if (g) out.push(g); gk = k; g = { t: b.t, o: b.o || b.c, h: b.h || b.c, l: b.l || b.c, c: b.c, v: b.v || 0 }; } else { g.t = b.t; g.h = Math.max(g.h, b.h || b.c); g.l = Math.min(g.l, b.l || b.c); g.c = b.c; g.v += b.v || 0; } }
    if (g) out.push(g); return out;
  }
  /* 긴 기간 자료: KIS 중계(주봉 · 월봉을 직접) → 공공데이터포털(일봉을 1000개씩 받아 묶음) */
  const RANGES = [[20, '1개월'], [60, '3개월'], [120, '6개월'], [250, '1년'], ['3y', '3년'], ['5y', '5년'], ['10y', '10년'], ['20y', '20년']];
  const perOf = r => typeof r === 'number' ? 'D' : parseInt(r) <= 5 ? 'W' : 'M';
  async function loadLong(code, yrs, per) {
    const kis = dataApis().find(kisOn);
    if (kis) {
      try {
        const j = await DATA.kisrelay._call(await keyOf(kis), kis, '/daily', { code, period: per, days: per === 'W' ? yrs * 53 : yrs * 12 + 2 });
        if (j.period === per && (j.rows || []).length) { const d8 = x => `${x.slice(0, 4)}-${x.slice(4, 6)}-${x.slice(6)}`; return { src: '한국투자증권', bars: j.rows.map(x => ({ t: d8(x.stck_bsop_date), o: +x.stck_oprc, h: +x.stck_hgpr, l: +x.stck_lwpr, c: +x.stck_clpr, v: +x.acml_vol })).filter(b => b.c).reverse() }; }
      } catch (e) { /* 아래 공공데이터포털로 */ }
    }
    const d = dataApis().find(a => a.type === 'datagokr');
    if (!d) throw new Error('긴 기간 차트는 공공데이터포털 주식시세나 KIS 중계가 있어야 합니다');
    const daily = await DATA.datagokr.range(await keyOf(d), code, yrs);
    return { src: '공공데이터포털', bars: aggBars(daily, per) };
  }
  function wantLong(r) {
    const s = stock; if (!s || typeof r === 'number' || !/^\d[0-9A-Z]{5}$/.test(s.code)) return;
    s.long = s.long || {}; if (s.long[r]) return;
    s.long[r] = { loading: true }; const my = stockSeq;
    loadLong(s.code, parseInt(r), perOf(r)).then(v => { s.long[r] = v; }).catch(e => { s.long[r] = { err: e.message }; }).then(() => { if (my === stockSeq) renderStock(); });
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
    const rng = RANGES.some(([n]) => n === stockPref.range) ? stockPref.range : 120, per = perOf(rng), kind = stockPref.kind === 'candle' ? 'candle' : 'line';
    if (typeof rng !== 'number') wantLong(rng);
    const LG = typeof rng === 'number' ? null : (s.long || {})[rng];
    const full = typeof rng === 'number' ? b : LG && LG.bars, from = full ? (typeof rng === 'number' ? Math.max(0, full.length - rng) : 0) : 0;
    const shown = full ? full.slice(from) : null;
    const maOf = k => { if (!full) return null; const cc = full.map(x => x.c); return cc.map((_, i) => i + 1 >= k ? cc.slice(i + 1 - k, i + 1).reduce((x, y) => x + y, 0) / k : null).slice(from); };
    const unitN = per === 'M' ? '개월' : per === 'W' ? '주' : '일', perName = per === 'M' ? '월봉' : per === 'W' ? '주봉' : '일봉';
    const chgOf = () => shown && shown.length > 1 ? (shown[shown.length - 1].c / shown[0].c - 1) * 100 : null;
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
          <div class="st-ch-head"><h3>가격 흐름 <small>${perName}</small></h3>
            <div class="st-ch-ctl"><div class="sc-seg" id="stKind" role="group" aria-label="차트 모양"><button type="button" data-k="line" class="${kind === 'line' ? 'on' : ''}" aria-pressed="${kind === 'line'}">선</button><button type="button" data-k="candle" class="${kind === 'candle' ? 'on' : ''}" aria-pressed="${kind === 'candle'}">봉</button></div>
            <div class="sc-seg st-range" id="stRange" role="group" aria-label="기간">${RANGES.map(([n, t]) => `<button type="button" data-n="${n}" class="${rng === n ? 'on' : ''}">${t}</button>`).join('')}</div></div></div>
          ${(() => {
            if (!shown || shown.length < 2) return LG && LG.err ? errBox(LG.err) : LG && LG.loading ? loading(`${perName} (${parseInt(rng)}년)`) : s.err.bars ? errBox(s.err.bars) : dataFor('history') ? loading('일봉') : apiNeed('datagokr', '일봉 API 가 없습니다 (공공데이터포털 주식시세 · KIS)');
            const short = typeof rng !== 'number' && shown.length && (new Date(shown[shown.length - 1].t) - new Date(shown[0].t)) / 3.156e10 < parseInt(rng) - .6;
            const def = `${shown[0].t} → ${shown[shown.length - 1].t} · 이 기간 ${pct(chgOf())} · ${kind === 'candle' ? '봉(빨강 오름 · 파랑 내림) · 아래 거래량' : '굵은 선 종가'} · 옅은 선 20${unitN} · 점선 60${unitN} 이동평균${LG && LG.src ? ' · ' + LG.src : ''}${short ? ` · 받을 수 있는 자료가 ${shown[0].t.slice(0, 4)}년부터입니다` : ''}`;
            return `<p class="sc-tip" data-def="${esc(def)}">${esc(def)}</p>${chartSvg(shown, mine, chartW, chartW < 480 ? 220 : 280, { kind, per, ma20: maOf(20), ma60: maOf(60) })}`;
          })()}
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
          ${dataFor('ksd') && /^\d[0-9A-Z]{5}$/.test(s.code || '') ? `<h4>${s.div ? s.div.year + '년 배당' : '배당'}</h4>${s.err.div ? errBox(s.err.div) : !s.div ? loading('배당') : dv ? kv([['주당 배당금', num(dv[3], 0) + '원'], ['시가배당률', num(dv[4], 2) + '%'], ['배당 순위', `${esc(dv[2] || '')} ${num(dv[0], 0)}위`], ['시장', esc(dv[2])]]) : `<p class="sc-mute">${s.div && s.div.top ? '시가배당률 시장별 상위 100위 안에 없습니다 (배당이 적거나 없음).' : '이 해 배당 기록이 없습니다 (무배당이거나 ETF 등).'}</p>`}` : ''}
        </section>
        ${/^\d[0-9A-Z]{5}$/.test(s.code || '') ? `<section class="sc-card st-dart"><h3>실적 · 공시 <small>금융감독원 OpenDART</small></h3>${!dataFor('dart') ? apiNeed('dart', 'OpenDART 를 연결하면 매출 · 영업이익 · 순이익 · 부채비율과 최근 공시가 보입니다')
          : s.err.dart ? errBox(s.err.dart) : !s.dart ? loading('공시 · 재무') : (() => {
            const f = s.dart.f, d = s.dart.d, eok = v => v == null ? '–' : num(v / 1e8, 0) + '억', chg = x => x && x.change != null ? ` <span class="${cls(x.change)}">${x.change > 0 ? '+' : ''}${num(x.change, 1)}%</span>` : '';
            const fin = f.err ? errBox(f.err) : `<p class="sc-mute" style="margin:0 0 8px">${esc(String(f.year))}년 ${esc(f.report)} · ${esc(f.basis)} · ${esc((f.items.매출액 || f.items.영업이익 || {}).period || '')}</p>${kv([['매출액', eok((f.items.매출액 || {}).now) + chg(f.items.매출액)], ['영업이익', eok((f.items.영업이익 || {}).now) + chg(f.items.영업이익)], ['당기순이익', eok((f.items.당기순이익 || {}).now) + chg(f.items.당기순이익)], ['영업이익률', f.ratios.영업이익률 != null ? num(f.ratios.영업이익률, 1) + '%' : null], ['부채비율', f.ratios.부채비율 != null ? num(f.ratios.부채비율, 1) + '%' : null], ['자본총계', eok((f.items.자본총계 || {}).now)]])}`;
            const dis = d.err ? errBox(d.err) : (d.items || []).length ? `<ul class="st-dis">${d.items.slice(0, 8).map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a><span>${esc(x.date)} · ${esc(x.filer || '')}</span></li>`).join('')}</ul>` : '<p class="sc-mute">최근 4개월 공시가 없습니다.</p>';
            return `${fin}<h4>최근 공시</h4>${dis}`;
          })()}</section>` : ''}
        ${dataFor('newsKR') || /^\d[0-9A-Z]{5}$/.test(s.code || '') ? `<section class="sc-card st-news"><h3>최근 뉴스 <small>네이버 · 최신순</small></h3>${!dataFor('newsKR') ? apiNeed('naver', '네이버 뉴스 검색을 연결하면 이 종목의 최신 기사가 보입니다')
          : s.err.news ? errBox(s.err.news) : !s.news ? loading('뉴스') : s.news.items.length ? `<ul class="st-dis">${s.news.items.map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a><span>${esc(x.date)}${x.summary ? ' · ' + esc(x.summary.length > 80 ? x.summary.slice(0, 80) + '…' : x.summary) : ''}</span></li>`).join('')}</ul>` : '<p class="sc-mute">최근 기사가 없습니다.</p>'}</section>` : ''}
        ${mine ? (() => { const qty = +mine.qty || 0, avg = +mine.avg || 0, pl = price && qty && avg ? (price - avg) * qty : null, plp = price && avg ? (price / avg - 1) * 100 : null, toStop = price && mine.stop ? (mine.stop / price - 1) * 100 : null, toT = price && mine.target ? (mine.target / price - 1) * 100 : null;
          return `<section class="sc-card"><h3>내 보유 · 계획</h3>${kv([['수량', qty ? num(qty, 4) : '관심만'], ['평균 단가', avg ? num(avg) : null], ['평가 손익', pl != null ? num(pl, 0) : null, cls(pl)], ['수익률', plp != null ? pct(plp) : null, cls(plp)], ['손절가까지', toStop != null ? `${num(+mine.stop)} (${pct(toStop, 1)})` : '정하지 않음'], ['목표가까지', toT != null ? `${num(+mine.target)} (${pct(toT, 1)})` : null]])}${mine.memo ? `<p class="st-memo">${esc(mine.memo)}</p>` : ''}${!mine.stop ? '<p class="sc-mute">손절가가 없습니다. 들어가기 전에 "어디서 틀렸다고 인정할지"를 정해 두세요.</p>' : ''}</section>`; })() : ''}
      </div>
      <p class="sc-fine">숫자는 연결한 API 에서 그대로 가져오고, 지표는 이 앱이 일봉으로 계산합니다. 투자 판단과 책임은 본인에게 있습니다.</p>`;
    fillIcons(box); wireGoApi(box);
    if (shown && shown.length > 1) wireChart(box.querySelector('.st-chart'), shown, per);
    const rg = $('stRange'); if (rg) rg.querySelectorAll('button').forEach(x => x.onclick = () => { stockPref.range = /y$/.test(x.dataset.n) ? x.dataset.n : +x.dataset.n; LS.set(K_STOCK, stockPref); renderStock(); });
    const kd = $('stKind'); if (kd) kd.querySelectorAll('button').forEach(x => x.onclick = () => { stockPref.kind = x.dataset.k; LS.set(K_STOCK, stockPref); renderStock(); });
    box.querySelectorAll('[data-st]').forEach(x => x.onclick = () => stockAct(x.dataset.st));
  }
  let stW = 0, stWt = 0; addEventListener('resize', () => { clearTimeout(stWt); stWt = setTimeout(() => { const b = $('stBody'); if (b && !$('vStock').hidden && stock && Math.abs(b.clientWidth - stW) > 24) { stW = b.clientWidth; renderStock(); } }, 200); });
  function wireGoApi(box) { box.querySelectorAll('[data-goapi]').forEach(x => x.onclick = () => { show('apis'); if (x.dataset.goapi) setTimeout(() => openAdd(x.dataset.goapi), 60); }); }
  function stockAct(a) {
    const s = stock; if (!s) return; const label = s.name ? `${s.name}(${s.code})` : s.code;
    if (a === 'ai') { show('chat'); send(`${label} 종목을 분석해 줘. get_quote · get_price_history${dataFor('ksd') ? ' · get_ksd_stock_info' : ''}${dataFor('dart') ? ' · get_financials · get_disclosures' : ''}${dataFor('newsKR') ? ' · search_news_kr' : ''} 로 숫자를 먼저 확인하고, get_portfolio 로 내 보유 여부와 손절 · 목표를 본 뒤, ① 한 줄 결론 ② 근거 3가지 ③ 반대 근거 · 위험 ④ 지금 할 일(진입 · 대기 · 정리 중 하나, 손절 · 목표 가격) ⑤ 다음에 확인할 일 순서로 짧게. 나의 원칙과 어긋나는 점이 있으면 먼저 짚어 줘.`); }
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
    return ksdCached('v2:' + op + ':' + JSON.stringify(base) + ':' + lastBizDays(1)[0], ttl, async () => {
      const monthEnd = back => { const d = new Date(Date.now() + 9 * 36e5); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - back + 1); d.setUTCDate(0); while (!(d.getUTCDay() % 6)) d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10).replace(/-/g, ''); };
      const days = lastBizDays(3).concat([monthEnd(1), monthEnd(2)]).filter((x, i, a) => a.indexOf(x) === i), tried = [];
      let lastErr = null, raw = null;
      for (const d of days) {
        tried.push(d);
        try {
          const r = await DATA.ksd.call(key, op, Object.assign({}, base, { stdDt: d }));
          const items = r.items.map(pick).filter(x => Object.entries(x).some(([kk, v]) => !/dt$/i.test(kk) && /^-?[\d,.]+$/.test(String(v).trim()))); // 숫자가 없는 줄(기준일 · '전체' 만)은 자료 없음
          if (items.length) return { d, items, tried };
          raw = raw || r.items[0] || null;
        } catch (e) { lastErr = e; if (!/PARAMETER|NODATA|NO_DATA/i.test(e.message)) throw e; }
      }
      return { d: '', items: [], tried, raw, err: lastErr && lastErr.message };
    });
  }
  async function renderMarket() {
    const box = $('mkBody'); if (!box) return;
    if (!dataFor('ksd')) { box.innerHTML = `<div class="sc-empty-st"><h2>시장 데이터는 예탁결제원 주식정보로 봅니다</h2><p>배당 상위 종목 · 의무보호예수(곧 풀릴 수 있는 물량) · 새로 예탁 지정된 종목 · 시장 규모를 하루 한 번 받아 둡니다.</p>${apiNeed('ksd', '한국예탁결제원 주식정보(공공데이터포털)를 연결해 주세요')}</div>`; fillIcons(box); wireGoApi(box); return; }
    const y = new Date().getFullYear() - 1, ym = new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 7).replace('-', '');
    box.innerHTML = `<div class="mk-grid">
      <section class="sc-card mk-div"><div class="st-ch-head"><h3>${y}년 배당 상위 <small>시가배당률 · 누르면 종목 분석</small></h3><div class="sc-seg" id="mkMart">${[['all', '전체'], ['유가', '유가증권'], ['코스닥', '코스닥']].map(([v, t]) => `<button type="button" data-v="${v}" class="${mkMart === v ? 'on' : ''}">${t}</button>`).join('')}</div></div><div id="mkDiv"><div class="sc-skel">불러오는 중…</div></div></section>
      <section class="sc-card"><h3>의무보호예수 <small>최대주주 · 공모 등으로 묶인 물량 — 풀리면 매물 부담</small></h3><div id="mkLock"><div class="sc-skel">불러오는 중…</div></div></section>
      ${dataFor('index') ? '<section class="sc-card"><h3>지수 <small>금융위원회 · 종가 기준</small></h3><div id="mkIdx"><div class="sc-skel">불러오는 중…</div></div></section>' : ''}
      ${dataFor('macro') ? '<section class="sc-card"><h3>금리 · 환율 <small>한국은행 ECOS · 한 달 변화</small></h3><div id="mkMacro"><div class="sc-skel">불러오는 중…</div></div></section>' : ''}
      <section class="sc-card"><h3>시장 규모 <small>상장 회사 · 시가총액</small></h3><div id="mkSize"><div class="sc-skel">불러오는 중…</div></div></section>
      <section class="sc-card"><h3>이번 달 신규 예탁지정 <small>곧 거래될 수 있는 새 종목 후보</small></h3><div id="mkNew"><div class="sc-skel">불러오는 중…</div></div></section>
    </div><p class="sc-fine">한국예탁결제원 공공데이터를 하루 한 번 받아 이 기기에 둡니다 (개발 계정은 하루 100회 제한). 출처: 한국예탁결제원 · 공공데이터포털.</p>`;
    fillIcons(box);
    const fail = (id, e) => { $(id).innerHTML = `<div class="sc-err">${icon('alert', 15)}<span>${esc(e.message || e)}</span></div>${rawBox(e, e && e.raw)}`; };
    const MK = { 11: '유가증권', 12: '코스닥', 13: 'K-OTC', 14: '코넥스', 50: '기타' };
    ksdDividends(y).then(d => {
      if (d && d.year && d.year !== y) { const h = box.querySelector('.mk-div h3'); if (h && h.firstChild) h.firstChild.textContent = `${d.year}년 배당 상위 `; }
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
        if (!pickRow) return `<p class="sc-mute">${MK[t]}: ${r.items.length ? '숫자를 읽지 못했습니다' : '최근 자료가 없습니다'}${r.err ? ' — ' + esc(r.err) : ''} <small>(조회한 기준일: ${esc((r.tried || []).join(', '))})</small></p>${rawBox(null, r.items[0] || r.raw)}`;
        const it = pickRow.x, v = pickRow.v;
        return `<div class="mk-lock"><b>${MK[t]}</b><span class="big">${isFinite(v.ratio) ? num(v.ratio, 2) + '%' : '–'}</span><div class="bar"><i style="width:${isFinite(v.ratio) ? Math.min(100, v.ratio * 5) : 0}%"></i></div><small>${isFinite(v.q) ? num(v.q / 1e6, 1) + '백만 주' : ''}${isFinite(v.co) ? ` · ${num(v.co, 0)}개 회사` : ''}${kind(it) ? ` · ${esc(kind(it))}` : ''} · 기준 ${esc(r.d.slice(0, 4) + '.' + r.d.slice(4, 6) + '.' + r.d.slice(6))}</small></div>`; }).join('')
        + '<p class="sc-mute">비율이 오르면 묶인 물량이 늘어난 것, 크게 줄면 그만큼 풀린 것입니다. 개별 종목의 해제일은 공시(DART)에서 확인하세요.</p>';
    }).catch(e => fail('mkLock', e));
    if (dataFor('index')) (async () => { const a = dataFor('index'); return ksdCached('idx:' + lastBizDays(1)[0], 6, async () => DATA.index.get(await keyOf(a))); })().then(m => {
      $('mkIdx').innerHTML = `<dl class="sc-kv mk-macro">${m.indices.map(x => `<dt>${esc(x.name)}<small>${esc(String(x.date).replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3'))} · 20일 ${pct(x.ret20d)}</small></dt><dd>${num(x.close, 2)} <span class="${cls(x.changePct)}">${pct(x.changePct)}</span></dd>`).join('')}</dl>${m.errors ? `<p class="sc-mute">${esc(m.errors.join(' · '))}</p>` : ''}`;
    }).catch(e => fail('mkIdx', e));
    if (dataFor('macro')) (async () => { const a = dataFor('macro'); return ksdCached('ecos:' + lastBizDays(1)[0], 12, async () => DATA.ecos.macro(await keyOf(a))); })().then(m => {
      $('mkMacro').innerHTML = `<dl class="sc-kv mk-macro">${m.series.map(x => `<dt>${esc(x.name)}<small>${esc(String(x.date).replace(/(\d{4})(\d{2})(\d{2})?/, (a0, y, mo, d) => d ? `${y}.${mo}.${d}` : `${y}.${mo}`))}</small></dt><dd>${num(x.value, x.unit === '원' ? 1 : 2)}${x.unit === '원' ? '원' : '%'}${x.change1m != null ? ` <span class="${cls(x.change1m)}">${x.change1m > 0 ? '+' : ''}${num(x.change1m, x.unit === '원' ? 1 : 2)}${x.unit === '원' ? '' : '%p'}</span>` : ''}</dd>`).join('')}</dl>${m.errors ? `<p class="sc-mute">${esc(m.errors.join(' · '))}</p>` : ''}`;
    }).catch(e => fail('mkMacro', e));
    ksdLatest('getListStatN1', {}, 24).then(r => {
      const g = {};
      for (const x of r.items) { const m = MK[x.caltotMartTpcd]; if (!m) continue; const o = g[m] = g[m] || { n: 0, co: 0, sc: 0, cap: 0 }; o.n++; o.co += numOf(x.cocnt) || 0; o.sc += numOf(x.secncnt) || 0; o.cap += numOf(x.martpTotamt) || 0; }
      const rows = Object.entries(g).filter(([, o]) => o.cap > 0);
      $('mkSize').innerHTML = rows.length ? `<div class="sc-tablewrap"><table class="sc-table"><thead><tr><th>시장</th><th>회사</th><th>종목</th><th>시가총액</th></tr></thead><tbody>${rows.map(([m, o]) => `<tr><td class="sym"><b>${m}</b>${o.n > 1 ? `<span>주권 · 외국주권 · 리츠 등 ${o.n}개 구분 합계</span>` : ''}</td><td>${num(o.co, 0)}</td><td>${num(o.sc, 0)}</td><td>${num(o.cap / 1e12, 1)}조</td></tr>`).join('')}</tbody></table></div><p class="sc-mute">기준 ${esc(r.d.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3'))}</p>` : '<p class="sc-mute">자료가 없습니다.</p>';
    }).catch(e => fail('mkSize', e));
    ksdCached('new:' + ym, 12, async () => (await DATA.ksd.call(await keyOf(dataFor('ksd')), 'getNewDepoSecnListN1', { yyyymm: ym, searchType: '1' })).items.map(pick)).then(items => {
      $('mkNew').innerHTML = items.length ? `<ul class="mk-new">${items.slice(0, 15).map(x => `<li><b>${esc(x.korSecnNm || '')}</b><span>${esc(x.indtpNm || '')} · ${esc(x.secnKacdNm || '')} · ${esc((x.apliDt || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3'))}</span></li>`).join('')}</ul>` : '<p class="sc-mute">이번 달은 아직 없습니다.</p>';
    }).catch(e => fail('mkNew', e));
  }
  $('mkAsk').onclick = () => { show('chat'); send('query_ksd 로 의무보호예수 현황(getSafeDpDutyDepoStatusN1, 유가증권 11 · 코스닥 12, 최근 영업일)과 올해 신규 예탁지정 종목을 확인하고, 지금 시장 수급에 주는 의미와 내 관심 종목(get_portfolio)에 영향이 있는지 짧게 정리해 줘.'); };
  $('mkReload').onclick = () => { for (const k of Object.keys(ksdCache)) if (!/^div:|^stk:|^nm:/.test(k)) delete ksdCache[k]; LS.set(K_KSDC, ksdCache); renderMarket(); };

  /* =====================================================================
     오늘 한눈에 — 연결한 API 를 모두 모은 아침 화면
     시장(지수 · 금리 · 환율 · 미국 지표) · 내 종목 레이더(경고 · 새 공시 · 오늘 뉴스) · 큰 이슈 · 증권사 시각 · 내 종목 소식 · AI 오늘 리포트
     ===================================================================== */
  const td = { radar: null, at: 0, busy: false };
  const kstToday = () => new Date(Date.now() + 9 * 36e5);
  function tdTile(label, value, sub, c, src) { return `<div class="td-tile"><span>${esc(label)}</span><b>${value}</b><small class="${c || ''}">${sub || ''}</small>${src ? `<i>${esc(src)}</i>` : ''}</div>`; }
  async function renderToday(force) {
    quickAdd($('tdQuick'), () => { td.radar = null; tdRadar(true); });
    const k = kstToday(), wd = '일월화수목금토'[k.getUTCDay()];
    $('tdTitle').textContent = `오늘 · ${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 (${wd})`;
    const have = t => !!dataFor(t), miss = [['index', '지수'], ['macro', '금리 · 환율'], ['usmacro', '미국 지표'], ['dart', '공시'], ['newsKR', '국내 뉴스'], ['quote', '시세']].filter(([t]) => !have(t)).map(([, n]) => n);
    $('tdLead').innerHTML = `연결한 API 를 모두 모아 아침에 볼 것만 한 화면에. ${miss.length ? `<span class="td-miss">아직 없는 것: ${esc(miss.join(' · '))} — <button type="button" class="linkish" data-goapi="">API 연결</button></span>` : '모든 자료가 연결되어 있습니다.'}`;
    wireGoApi($('tdLead'));
    if (force) { td.radar = null; for (const kk of Object.keys(ksdCache)) if (/^(idx|ecos|fred):/.test(kk)) delete ksdCache[kk]; LS.set(K_KSDC, ksdCache); }
    { const kb = $('tdKis'); if (kb) { kb.innerHTML = kisBanner(); fillIcons(kb); wireKis(kb); } }
    tdStrip(); tdBrief(); tdRadar(force);
  }
  /* 1) 시장 띠: 코스피 · 코스닥 · 원/달러 · 국고채 3년 · 미 10년 · 연준 금리 */
  async function tdStrip() {
    const box = $('tdStrip'); box.innerHTML = '<div class="sc-skel">시장 자료 불러오는 중…</div>';
    const day = lastBizDays(1)[0], jobs = [];
    if (dataFor('index')) jobs.push(ksdCached('idx:' + day, 6, async () => DATA.index.get(await keyOf(dataFor('index')))).then(m => ({ idx: m })).catch(e => ({ err: '지수: ' + e.message })));
    if (dataFor('macro')) jobs.push(ksdCached('ecos:' + day, 12, async () => DATA.ecos.macro(await keyOf(dataFor('macro')))).then(m => ({ kr: m })).catch(e => ({ err: '한국은행: ' + e.message })));
    if (dataFor('usmacro')) jobs.push(ksdCached('fred:' + day, 12, async () => DATA.fred.overview(await keyOf(dataFor('usmacro')))).then(m => ({ us: m })).catch(e => ({ err: 'FRED: ' + e.message })));
    if (!jobs.length) { box.innerHTML = `<div class="sc-need">${icon('key', 16)}<span>지수 · 금리 · 환율 · 미국 지표 API 를 연결하면 여기에 시장 띠가 생깁니다.</span><button class="btn sm" data-goapi="index">연결하기</button></div>`; fillIcons(box); wireGoApi(box); return; }
    const rs = await Promise.all(jobs), o = Object.assign({}, ...rs.filter(r => !r.err)), errs = rs.filter(r => r.err).map(r => r.err), t = [];
    const fd = d => String(d || '').replace(/^(\d{4})-?(\d{2})-?(\d{2}).*/, '$2.$3').replace(/^(\d{4})(\d{2})$/, '$1.$2');
    for (const x of (o.idx ? o.idx.indices : []).slice(0, 2)) t.push(tdTile(x.name, num(x.close, 2), `${pct(x.changePct)} · 20일 ${pct(x.ret20d)}`, cls(x.changePct), fd(x.date)));
    const s = id => o.kr && o.kr.series.find(x => x.id === id), u = id => o.us && o.us.series.find(x => x.id === id);
    const fx = s('usd') || u('DEXKOUS'); if (fx) t.push(tdTile('원/달러', num(fx.value, 1), fx.change1m != null ? `한 달 ${fx.change1m > 0 ? '+' : ''}${num(fx.change1m, 1)}원` : '', cls(fx.change1m), fd(fx.date)));
    const k3 = s('ktb3'); if (k3) t.push(tdTile('국고채 3년', num(k3.value, 3) + '%', k3.change1m != null ? `한 달 ${k3.change1m > 0 ? '+' : ''}${num(k3.change1m, 2)}%p` : '', cls(k3.change1m), fd(k3.date)));
    const bs = s('base'); if (bs) t.push(tdTile('한국 기준금리', num(bs.value, 2) + '%', '', '', fd(bs.date)));
    const u10 = u('DGS10'); if (u10) t.push(tdTile('미국 10년', num(u10.value, 2) + '%', u10.change1m != null ? `한 달 ${u10.change1m > 0 ? '+' : ''}${num(u10.change1m, 2)}%p` : '', cls(u10.change1m), fd(u10.date)));
    const ff = u('FEDFUNDS'); if (ff) t.push(tdTile('연준 금리', num(ff.value, 2) + '%', '', '', fd(ff.date)));
    const cpi = u('CPIAUCSL'); if (cpi) t.push(tdTile('미국 물가', num(cpi.value, 1) + '%', cpi.prev != null ? `전월 ${num(cpi.prev, 1)}%` : '전년비', cls(cpi.value - (cpi.prev || cpi.value)), fd(cpi.date)));
    box.innerHTML = (t.length ? `<div class="td-strip">${t.join('')}</div>` : '') + (errs.length ? `<p class="sc-mute">${esc(errs.join(' · '))}</p>` : '');
  }
  /* 2) 오늘 큰 이슈 · 증권사 시각 (브리핑 — API 키 없이) */
  async function tdBrief() {
    $('tdIssues').innerHTML = $('tdBroker').innerHTML = '<div class="sc-skel">불러오는 중…</div>';
    try {
      const b = await briefingForAI('', '');
      const m = b.morning, st = b.strategy;
      $('tdIssues').innerHTML = m && m.issues.length ? `<ol class="td-list">${m.issues.slice(0, 6).map(x => `<li><b>${esc(x.title)}</b><span>${esc(x.category || '')} · ${num(x.outlets, 0)}개 언론</span></li>`).join('')}</ol><button class="btn sm ghost" data-v="brief">모닝 브리핑 전체</button>${morningNote(m.date)}` : '<p class="sc-mute">오늘 브리핑이 아직 없습니다.</p>';
      $('tdBroker').innerHTML = st && st.daily.length ? `<ul class="td-list">${st.daily.slice(0, 4).map(x => `<li><b>${esc(x.broker)} · ${esc(x.title)}</b><span>${esc(String(x.summary || '').split(/\n|(?<=다\.)\s/).map(z => z.replace(/^[-·•\s]+/, '').trim()).filter(z => z.length > 12).slice(0, 2).join(' · ').slice(0, 160))}</span></li>`).join('')}</ul>${st.topWords ? `<p class="sc-mute">자주 나온 말: ${esc(st.topWords)}</p>` : ''}<button class="btn sm ghost" data-v="strat">전략 브리핑 전체</button>` : '<p class="sc-mute">오늘 증권사 리포트가 아직 없습니다.</p>';
      for (const id of ['tdIssues', 'tdBroker']) $(id).querySelectorAll('[data-v]').forEach(x => x.onclick = () => show(x.dataset.v));
      td.brief = m;
    } catch (e) { $('tdIssues').innerHTML = `<div class="sc-err">${icon('alert', 15)}<span>${esc(e.message)}</span></div>`; $('tdBroker').innerHTML = ''; }
  }
  /* 3) 내 종목 레이더: 종목마다 시세 · 추세 · 경고 · 새 공시 · 오늘 뉴스 (10분 기억) */
  async function tdRadar(force) {
    const box = $('tdRadar'), mine = $('tdMine');
    const items = watch.items.slice(0, 12);
    if (!items.length) { box.innerHTML = `<div class="sc-need">${icon('trend', 16)}<span>관심 종목 · 보유를 적으면 종목마다 경고 · 새 공시 · 오늘 뉴스를 모아 보여 줍니다.</span><button class="btn sm" id="tdAdd">종목 추가</button></div>`; fillIcons(box); $('tdAdd').onclick = () => { show('watch'); editItem(null); }; mine.innerHTML = '<p class="sc-mute">관심 종목이 없습니다.</p>'; return; }
    if (td.radar && !force && Date.now() - td.at < 600000) { paintRadar(); return; }
    if (td.busy) return; td.busy = true;
    box.innerHTML = `<div class="sc-skel">내 종목 ${items.length}개 살펴보는 중…</div>`;
    const res = [];
    const one = async it => {
      const code = normSym(it.symbol), kr = /^\d[0-9A-Z]{5}$/.test(code), r = { it, code, kr, flags: [], err: [] };
      try { r.q = await callData('quote', code); watch.quotes[code] = { price: r.q.price, changePct: r.q.changePct, time: r.q.time || new Date().toISOString(), source: r.q.source }; } catch (e) { r.err.push('시세'); }
      if (dataFor('history')) try { const b = await callData('history', code, 120); if (b.length > 20) r.a = analyze(b); } catch (e) { }
      if (kr && dataFor('dart')) try { const d = await DATA.dart.disclosures(await keyOf(dataFor('dart')), code, 7); r.dis = d.items; } catch (e) { }
      if (dataFor('newsKR')) try { const n = await DATA.naver.search(await keyOf(dataFor('newsKR')), it.name || (r.q && r.q.name) || code, 10); const since = Date.now() - 864e5; r.news = n.items.filter(x => x.date && new Date(x.date.replace(' ', 'T') + ':00+09:00').getTime() > since); } catch (e) { }
      const p = r.q && r.q.price, stop = +it.stop, tgt = +it.target, avg = +it.avg;
      if (p && stop) { const d = (p / stop - 1) * 100; if (p <= stop) r.flags.push(['bad', '손절가 이탈']); else if (d < 3) r.flags.push(['bad', `손절가까지 ${num(d, 1)}%`]); }
      if (p && tgt && p >= tgt) r.flags.push(['good', '목표가 도달']);
      if (p && ((+it.alertHi && p >= +it.alertHi) || (+it.alertLo && p <= +it.alertLo))) r.flags.push(['warn', '알림 가격']);
      if (r.a && r.a.rsi14 != null) { if (r.a.rsi14 >= 70) r.flags.push(['warn', `RSI ${num(r.a.rsi14, 0)} 과열`]); else if (r.a.rsi14 <= 30) r.flags.push(['warn', `RSI ${num(r.a.rsi14, 0)} 침체`]); }
      if (r.a && r.a.sma && r.a.sma.d20 && p) r.flags.push([p >= r.a.sma.d20 ? 'ok' : 'warn', p >= r.a.sma.d20 ? '20일선 위' : '20일선 아래']);
      if (r.dis && r.dis.length) r.flags.push(['news', `새 공시 ${r.dis.length}`]);
      if (r.news && r.news.length) r.flags.push(['news', `오늘 뉴스 ${r.news.length}`]);
      if (p && avg && +it.qty) r.pl = (p / avg - 1) * 100;
      if (p && !stop && +it.qty) r.flags.push(['warn', '손절가 없음']);
      res.push(r);
    };
    try { const q = items.slice(); await Promise.all([0, 1, 2].map(async () => { while (q.length) await one(q.shift()); })); }
    finally { td.busy = false; }
    saveWatch();
    td.radar = items.map(it => res.find(r => r.it === it)).filter(Boolean); td.at = Date.now();
    paintRadar();
  }
  function paintRadar() {
    const box = $('tdRadar'), rs = td.radar || [];
    const rank = r => r.flags.some(f => f[0] === 'bad') ? 0 : r.flags.some(f => f[0] === 'news' || f[0] === 'warn') ? 1 : 2; // 급한 것 먼저
    box.innerHTML = `<div class="td-radar">${rs.slice().sort((a, b) => rank(a) - rank(b)).map(r => `<button type="button" class="td-row" data-open="${esc(r.code)}">
        <span class="nm"><b>${esc(r.it.name || (r.q && r.q.name) || r.code)}</b><small>${esc(r.code)}${r.pl != null ? ` · 내 수익 <em class="${cls(r.pl)}">${pct(r.pl, 1)}</em>` : ''}</small></span>
        <span class="px">${r.q ? `<b>${num(r.q.price)}</b><small class="${cls(r.q.changePct)}">${pct(r.q.changePct)}</small>` : `<small>${r.err.length ? '시세 없음' : '–'}</small>`}</span>
        <span class="fl">${r.flags.map(f => `<i class="f-${f[0]}">${esc(f[1])}</i>`).join('')}</span>
      </button>`).join('')}</div><p class="sc-mute">${new Date(td.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준 · 누르면 종목 분석 · 경고가 있는 종목이 위로</p>`;
    box.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { $('stQ').value = b.dataset.open; openStock(b.dataset.open); });
    /* 내 종목 소식: 새 공시 · 오늘 뉴스 · 오늘 브리핑에 나온 것 */
    const names = rs.map(r => [r, r.it.name || (r.q && r.q.name) || '']).filter(([, n]) => n && n.length > 1);
    const rows = [];
    for (const r of rs) {
      for (const d of (r.dis || []).slice(0, 2)) rows.push(`<li><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.title)}</a><span>공시 · ${esc(r.it.name || r.code)} · ${esc(d.date)}</span></li>`);
      for (const n of (r.news || []).slice(0, 2)) rows.push(`<li><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a><span>뉴스 · ${esc(r.it.name || r.code)} · ${esc(n.date.slice(11))}</span></li>`);
    }
    for (const x of (td.brief && td.brief.issues) || []) { const hit = names.find(([, n]) => x.title.includes(n)); if (hit) rows.push(`<li><b>${esc(x.title)}</b><span>오늘 브리핑 · ${esc(hit[1])}</span></li>`); }
    $('tdMine').innerHTML = rows.length ? `<ul class="st-dis">${rows.slice(0, 12).join('')}</ul>` : `<p class="sc-mute">${dataFor('dart') || dataFor('newsKR') ? '내 종목에 새 공시 · 오늘 뉴스가 없습니다.' : 'OpenDART · 네이버 뉴스를 연결하면 내 종목의 새 공시 · 오늘 뉴스가 여기에 모입니다.'}</p>`;
  }
  $('tdReload').onclick = () => renderToday(true);
  $('tdAI').onclick = () => {
    const has = t => toolDefs().some(x => x.name === t);
    const first = ['get_briefing', 'get_index', 'get_macro', 'get_us_macro', 'get_portfolio'].filter(has).join(' · ');
    const per = ['get_quote', 'get_price_history', 'get_disclosures', 'search_news_kr'].filter(has).join(' · ');
    show('chat'); if (cur && (cur.view || []).length) { cur = null; keepCur(); renderChat(); }
    send(`오늘 아침 리포트를 만들어 줘. 먼저 ${first} 로 시장과 내 종목을 확인하고, 내 종목마다 ${per || 'get_quote'} 로 숫자 · 새 공시(최근 7일) · 오늘 뉴스를 확인해. 순서: ① 시장 한 줄 요약과 지수 · 금리 · 환율 · 미국 지표 숫자 ② 오늘 큰 이슈 3가지와 증권사 시각(엇갈리면 짚기) ③ 내 종목 표: 현재가 · 등락 · 추세 · 새 소식 · 오늘 할 일(유지 / 손절 점검 / 비중 조절 / 대기) ④ 나의 원칙과 어긋나는 점 ⑤ 오늘 · 이번 주 주의할 일정과 위험. 짧은 문장과 표로.`);
  };

  const VIEWS = { engine: 'vEngine', today: 'vToday', track: 'vTrack', chat: 'vChat', stock: 'vStock', market: 'vMarket', history: 'vHistory', sum: 'vSum', brief: 'vBrief', strat: 'vStrat', notes: 'vNotes', me: 'vMe', watch: 'vWatch', journal: 'vJournal', calc: 'vCalc', refs: 'vRefs', apis: 'vApis' };
  function show(v) {
    for (const [k, id] of Object.entries(VIEWS)) $(id).hidden = k !== v;
    document.querySelectorAll('.rail [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    if (v === 'watch') renderWatch(); if (v === 'history') renderHistory(); if (v === 'journal') renderJournal(); if (v === 'notes') renderNotes(); if (v === 'sum') renderSum(); if (v === 'brief') renderBrief(); if (v === 'strat') renderStrat(); if (v === 'me') renderMe(); if (v === 'calc') renderCalc(); if (v === 'refs') renderRefs(); if (v === 'apis') { renderApis(); renderSyncBox(); } if (v === 'chat') renderChat(); if (v === 'stock') renderStock(); if (v === 'today') renderToday(); if (v === 'market') renderMarket(); if (v === 'engine') renderEngine(); if (v === 'track') renderTrack();
    try { history.replaceState(null, '', v === 'today' ? 'secret.html' : 'secret.html#' + v); } catch (e) { }
  }
  document.querySelectorAll('.rail [data-view]').forEach(b => b.onclick = () => show(b.dataset.view));

  fillIcons(document);
  $('cWatch').textContent = watch.items.length || ''; $('cApi').textContent = cfg.apis.length || ''; $('cJournal').textContent = journal.length || ''; $('cNotes').textContent = notes.length || '';
  setAuto();
  show(VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'today');
  { const due = journal.filter(isDue).length, k = 'sec:dueToast'; if (due && LS.get(k, '') !== todayStr()) { LS.set(k, todayStr()); setTimeout(() => toast(`점검일이 된 결정 카드 ${due}건 — 매매 일지에서 확인하세요`, 4000), 1500); } }
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

  /* =====================================================================
     장 마감 노트 — GitHub Actions(market-close.yml)가 평일 저녁 8시 무렵 briefing 브랜치 market/recent.json 에 저장한
     시장 온도 · 코스피 등락률 · 시가총액 상위 10개 종목 등락률을 그날 날짜의 노트로 남김 (AI 토큰 안 씀)
     · 노트 번호를 날짜로 고정(mkt-YYYY-MM-DD): 여러 기기에서 만들어도 하나로 합쳐짐
     · 사용자가 지운 날(tomb)은 다시 만들지 않고, 이미 있는 노트(고친 것 포함)는 건드리지 않음
     ===================================================================== */
  const mktText = r => {
    const p = v => v == null ? '–' : (v > 0 ? '+' : '') + Number(v).toFixed(2) + '%';
    const w = v => v == null ? '–' : Number(v).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
    const t = r.temp, b = r.breadth, k = r.kospi || {};
    return [`[장 마감 ${r.date}]`,
      t ? `1. 시장 온도: ${t.mood} (오름 ${t.pos} · 내림 ${t.neg}, 오름 비율 ${t.pp}%) — 전략 요약과 같은 규칙` : '1. 시장 온도: 기록 없음 — 이날은 모닝 · 전략 브리핑이 없었습니다',
      `2. 코스피: ${w(k.close)} (${p(k.chgPct)}${k.diff != null ? `, ${k.diff > 0 ? '+' : ''}${w(k.diff)}p` : ''})${b ? ` · 상승 ${b.up} · 하락 ${b.down} 종목` : ''}`,
      `3. 시가총액 상위 10개 종목`,
      ...(r.top10 || []).map(s => `  ${s.rank}. ${s.name} ${s.close == null ? '–' : w(s.close) + '원'} ${p(s.chgPct)}`),
      '', `기준: ${r.top10Basis || '네이버 증권'}${r.backfill ? '' : ` · ${String(r.at || '').slice(11, 16)} 수집`}`].join('\n');
  };
  let mktAt = 0;
  async function marketNotes(force) {
    if (!force && Date.now() - mktAt < 10 * 60000) return; mktAt = Date.now();
    let list = null;
    try {
      const ref = await latestRef();
      let r = await fetch(briefUrl('market/recent.json', ref), { cache: 'no-store' });
      if (ref && !r.ok && r.status !== 404) r = await fetch(briefUrl('market/recent.json'), { cache: 'no-store' });
      if (r.ok) list = await r.json();
    } catch (e) { }
    if (!Array.isArray(list)) return;
    let changed = 0;
    for (const m of list) {
      if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(m.date || '') || !m.kospi) continue;
      const id = 'mkt-' + m.date, text = mktText(m), h = hashOf(text);
      if (sy.tomb.notes[id]) continue; // 사용자가 지운 날
      const n = notes.find(x => x.id === id);
      if (n) {
        /* 손대지 않은 자동 노트만 새 내용으로 (사용자가 고친 노트는 그대로) */
        const untouched = n.auto === 'market' && (n.autoHash ? hashOf(n.text) === n.autoHash : n.updated === n.created);
        if (untouched && n.autoHash !== h) { n.text = text; n.autoHash = h; n.updated = Date.now(); changed++; }
        continue;
      }
      const ts = Date.parse(m.at) || Date.now();
      notes.push({ id, created: ts, updated: ts, date: m.date, text, companies: [], auto: 'market', autoHash: h }); changed++;
    }
    if (!changed) return;
    saveNotes(); if (!$('vNotes').hidden) renderNotes();
  }
  marketNotes();
  setTimeout(() => { fillNames().catch(() => { }); }, 2500);
  setInterval(() => { if (document.visibilityState === 'visible') marketNotes(); }, 15 * 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') marketNotes(); });
  addEventListener('hashchange', () => { const v = location.hash.slice(1); if (VIEWS[v]) show(v); });
})();
