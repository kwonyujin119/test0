/* DPV · SECRET 용 한국투자증권(KIS) 시세 중계 — Cloudflare Worker
   ─────────────────────────────────────────────────────────────
   · 시세 조회만 합니다. 주문 · 잔고 · 계좌 기능은 코드에 아예 없습니다.
   · 앱키 · 앱시크릿은 이 Worker 의 비밀 값에만 둡니다 (휴대폰 · 사이트에는 두지 않음).
   · 중계 암호(RELAY_KEY)를 아는 사람만, DPV 사이트에서만 부를 수 있습니다.
   · 접근 토큰은 암호화해서 SECRET 에 맡겨 두고 다시 씁니다 (토큰을 자주 새로 받으면 KIS 가 알림을 보내고 1분에 1번으로 막음).

   비밀 값 (Worker → Settings → Variables and Secrets → Add → Type: Secret)
     KIS_APPKEY     한국투자증권 앱키
     KIS_APPSECRET  한국투자증권 앱시크릿
     RELAY_KEY      SECRET 에서 [중계 암호 만들기] 로 만든 값
   선택
     KIS_MOCK       "1" 이면 모의투자 서버로 */

const ORIGINS = ['https://kwonyujin119.github.io'];
const REAL = 'https://openapi.koreainvestment.com:9443';
const MOCK = 'https://openapivts.koreainvestment.com:29443';

let mem = null; // { t: 토큰, exp: 끝나는 때(ms) } — 이 Worker 가 살아 있는 동안만

export default {
  async fetch(req, env) {
    const origin = req.headers.get('origin') || '';
    const cors = {
      'access-control-allow-origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'x-relay-key, x-kis-token',
      'access-control-expose-headers': 'x-kis-token',
      'access-control-max-age': '86400',
      vary: 'origin',
    };
    const out = (status, body, extra) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cors, ...(extra || {}) } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'GET') return out(405, { error: 'GET 만 됩니다' });
    if (!env.KIS_APPKEY || !env.KIS_APPSECRET || !env.RELAY_KEY) return out(500, { error: '비밀 값(KIS_APPKEY · KIS_APPSECRET · RELAY_KEY)이 아직 없습니다' });
    if (!same(req.headers.get('x-relay-key') || '', env.RELAY_KEY)) return out(401, { error: '중계 암호가 맞지 않습니다' });

    const url = new URL(req.url);
    const code = String(url.searchParams.get('code') || '').toUpperCase();
    if (url.pathname === '/ping') return out(200, { ok: true, mock: env.KIS_MOCK === '1' });
    if (!/^[0-9A-Z]{6}$/.test(code)) return out(400, { error: '종목은 6자리 코드로 (예: 005930)' });

    try {
      const tok = await token(env, req.headers.get('x-kis-token'));
      const keep = { 'x-kis-token': await seal(env, tok) };
      if (url.pathname === '/quote') {
        const j = await kis(env, tok, '/uapi/domestic-stock/v1/quotations/inquire-price', 'FHKST01010100', { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: code });
        return out(200, { ok: true, code, output: j.output }, keep);
      }
      if (url.pathname === '/daily') {
        /* period: D 일봉 · W 주봉 · M 월봉 (한 번에 100개씩 거슬러 올라감, 최대 6번) */
        const period = /^[DWM]$/.test(url.searchParams.get('period') || '') ? url.searchParams.get('period') : 'D';
        const cap = { D: 400, W: 600, M: 300 }[period], span = { D: 140, W: 700, M: 3050 }[period];
        const days = Math.max(5, Math.min(cap, +url.searchParams.get('days') || 120));
        const rows = []; let name = '', end = new Date(Date.now() + 9 * 36e5); // 한국 시간
        for (let i = 0; i < 6 && rows.length < days; i++) {
          const start = new Date(end.getTime() - span * 864e5);
          const j = await kis(env, tok, '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice', 'FHKST03010100',
            { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: code, FID_INPUT_DATE_1: ymd(start), FID_INPUT_DATE_2: ymd(end), FID_PERIOD_DIV_CODE: period, FID_ORG_ADJ_PRC: '0' });
          name = name || (j.output1 && j.output1.hts_kor_isnm) || '';
          const got = (j.output2 || []).filter(r => r && r.stck_bsop_date);
          if (!got.length) break;
          rows.push(...got);
          end = new Date(Date.UTC(+got[got.length - 1].stck_bsop_date.slice(0, 4), +got[got.length - 1].stck_bsop_date.slice(4, 6) - 1, +got[got.length - 1].stck_bsop_date.slice(6)) - 864e5);
        }
        return out(200, { ok: true, code, name, period, rows: rows.slice(0, days) }, keep);
      }
      return out(404, { error: '없는 기능입니다 (/quote · /daily 만)' });
    } catch (e) {
      return out(502, { error: String(e.message || e) });
    }
  },
};

const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');
function same(a, b) { // 시간 차로 암호를 알아내지 못하게
  if (a.length !== b.length) return false;
  let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
const base = env => env.KIS_MOCK === '1' ? MOCK : REAL;

async function token(env, sealed, force) {
  const now = Date.now();
  if (!force && mem && mem.exp - now > 600e3) return mem;
  if (!force && sealed) { const o = await open(env, sealed); if (o && o.exp - now > 600e3) return (mem = o); }
  const r = await fetch(base(env) + '/oauth2/tokenP', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ grant_type: 'client_credentials', appkey: env.KIS_APPKEY, appsecret: env.KIS_APPSECRET }) });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || !j.access_token) throw new Error('KIS 토큰 발급 실패: ' + ((j && (j.error_description || j.msg1)) || r.status) + (r.status === 403 ? ' (1분에 1번만 받을 수 있습니다 — 잠시 뒤 다시)' : ''));
  return (mem = { t: j.access_token, exp: now + (+j.expires_in || 86400) * 1000 });
}

async function kis(env, tok, path, tr, q, again) {
  const r = await fetch(base(env) + path + '?' + new URLSearchParams(q), {
    headers: { 'content-type': 'application/json; charset=utf-8', authorization: 'Bearer ' + tok.t, appkey: env.KIS_APPKEY, appsecret: env.KIS_APPSECRET, tr_id: tr, custtype: 'P' },
  });
  const j = await r.json().catch(() => null);
  if (j && j.rt_cd === '0') return j;
  const msg = (j && (j.msg1 || j.error_description)) || ('HTTP ' + r.status);
  if (!again && /token|토큰|EGW00123|EGW00121/i.test(msg + (j && j.msg_cd || ''))) { // 토큰이 끝났으면 한 번만 새로 받아서
    const t2 = await token(env, null, true); Object.assign(tok, t2);
    return kis(env, tok, path, tr, q, true);
  }
  throw new Error('KIS: ' + msg);
}

/* 토큰 봉투: 앱시크릿 · 중계 암호로 만든 열쇠로 잠가서 SECRET 에 맡김 (SECRET 은 토큰을 볼 수 없음) */
async function aes(env) {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('dpv-kis|' + env.KIS_APPSECRET + '|' + env.RELAY_KEY));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
const b64 = u => btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function seal(env, o) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aes(env), new TextEncoder().encode(JSON.stringify(o))));
  const all = new Uint8Array(12 + ct.length); all.set(iv); all.set(ct, 12); return b64(all);
}
async function open(env, s) {
  try {
    const u = unb64(s);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, await aes(env), u.slice(12));
    const o = JSON.parse(new TextDecoder().decode(pt)); return o && o.t && o.exp ? o : null;
  } catch (e) { return null; }
}
