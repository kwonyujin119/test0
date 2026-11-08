/* DPV — 입장 모드 (게스트 · 관리자)
   첫 화면(index.html)에서 고른 모드를 이 기기(localStorage)에 기억한다.
   · 게스트: 보기만 — 교안 목록 · 발표 · 문서 열람. 편집 화면과 저장 단추를 감추고, 저장·업로드 API 호출을 막는다.
   · 관리자: 접속코드를 맞히면 편집 가능. 코드는 소금을 섞은 SHA-256 해시로만 비교한다 (코드 자체는 어디에도 쓰여 있지 않다).
   솔직한 한계: 이 코드는 브라우저 안에서만 확인하므로 "진짜 보안"이 아니라 "실수로 고치는 것을 막는 문"이다.
   실제 저장 권한은 GitHub 토큰(관리자 기기에만 저장)과 내 PC 서버가 쥐고 있다.
   불러오는 순서: common.js(API·GH) → [store.js(HwpStore)] → access.js → 화면 스크립트. */
'use strict';
const Access = {
  KEY: 'ws:access',
  SALT: 'ws-admin-gate-v1',
  HASH: '3c5f53fe61602d917960e99493b424c0d9653532b7218735d0560ad69e9776d0',
  ADMIN_DAYS: 30, // 관리자 모드는 이 기기에서 30일 동안 유지 (그 뒤엔 코드를 다시 묻는다)
  _st: undefined,
  load() {
    if (this._st !== undefined) return this._st;
    let s = null; try { s = JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { }
    if (s && s.role === 'admin' && !(s.at && Date.now() - s.at < this.ADMIN_DAYS * 864e5)) s = null; // 기간이 지난 관리자 모드
    if (s && s.role !== 'admin' && s.role !== 'guest') s = null;
    this._st = s; return s;
  },
  _save(s) { this._st = s; try { if (s) localStorage.setItem(this.KEY, JSON.stringify(s)); else localStorage.removeItem(this.KEY); } catch (e) { } this.apply(); },
  get role() { const s = this.load(); return s ? s.role : ''; },
  get chosen() { return !!this.role; },
  get isAdmin() { return this.role === 'admin'; },
  get isGuest() { return this.role !== 'admin'; }, // 아직 고르지 않았으면 게스트(보기 전용)로 본다
  enterGuest() { this._save({ role: 'guest', at: Date.now() }); },
  leave() { this._save(null); },
  async hash(code) {
    if (!(window.crypto && crypto.subtle)) throw new Error('이 환경(http 주소)에서는 접속코드를 확인할 수 없습니다. https 주소나 내 PC 서버(localhost)에서 열어 주세요.');
    const u8 = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(this.SALT + ':' + String(code || '').trim())));
    return Array.from(u8, b => b.toString(16).padStart(2, '0')).join('');
  },
  async verify(code) { return (await this.hash(code)) === this.HASH; },
  async enterAdmin(code) { if (!(await this.verify(code))) return false; this._save({ role: 'admin', at: Date.now() }); return true; },
  /* 게스트 모드에서 저장·업로드를 막을 때 던지는 오류 */
  denied() { const e = new Error('보기 전용(게스트) 모드라 저장할 수 없습니다 — 첫 화면에서 관리자로 입장하세요'); e.guest = true; e.quiet = true; return e; },
  /* <html class="guest|admin"> — 화면은 CSS 로 [data-admin] 요소를 감춘다 */
  apply() {
    const h = document.documentElement;
    h.classList.toggle('guest', this.isGuest); h.classList.toggle('admin', this.isAdmin); h.classList.toggle('role-chosen', this.chosen);
    this.guard();
  },
  _guarded: false,
  /* 게스트: 저장·업로드 API 를 호출하지 못하게 막는다 (화면에서 단추를 감추는 것과 별개로 한 번 더) */
  guard() {
    if (!this.isGuest || this._guarded) return;
    const block = (obj, names, ret) => { if (!obj) return; for (const n of names) if (typeof obj[n] === 'function') obj[n] = () => { if (ret === 'reject') return Promise.reject(this.denied()); throw this.denied(); }; };
    /* common.js 의 API·GH 는 const 라 window 에 붙지 않으므로 typeof 로 확인 */
    const hasAPI = typeof API !== 'undefined', hasGH = typeof GH !== 'undefined', hasStore = typeof HwpStore !== 'undefined', hasBest = typeof BestDocs !== 'undefined';
    if (hasAPI) block(API, ['save', 'remove', 'rename', 'stage', 'stageBig', 'upload'], 'reject');
    if (hasGH) { block(GH, ['commit', 'enqueue'], 'reject'); GH.connect = () => { if (typeof toast === 'function') toast('게스트 모드에서는 GitHub 에 연결하지 않습니다', 2600); return Promise.resolve(false); }; }
    if (hasStore) { block(HwpStore, ['pickSave', 'pickSaveHandle', 'writeHandle'], 'reject'); if (HwpStore.box) block(HwpStore.box, ['unlock', 'save', 'remove', 'rename'], 'reject'); }
    if (hasBest) block(BestDocs, ['add', 'remove', 'update'], 'reject');
    this._guarded = hasAPI || hasStore;
  },
  /* 지금 모드를 보여 주는 작은 표식 (첫 화면 · 작업장 머리에 붙임) */
  chip() {
    const a = this.isAdmin;
    return `<a class="ws-chip ${a ? 'admin' : 'guest'}" href="index.html?mode=1" title="${a ? '관리자 모드 — 편집·저장할 수 있습니다. 누르면 모드를 바꿉니다' : '게스트 모드 — 보기만 할 수 있습니다. 누르면 관리자로 입장할 수 있습니다'}">${typeof icon === 'function' ? icon(a ? 'unlock' : 'eye', 14) : ''}<span>${a ? '관리자' : '게스트 · 보기 전용'}</span></a>`;
  },
  /* 접속코드 창. 맞으면 true */
  prompt(opts) {
    opts = opts || {};
    return new Promise(done => {
      const bg = document.createElement('div'); bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal ws-gate-modal" role="dialog" aria-modal="true" aria-labelledby="gateTitle">
        <h3 id="gateTitle">관리자로 입장</h3>
        <p class="modal-desc">접속코드를 입력하면 이 기기에서 ${this.ADMIN_DAYS}일 동안 교안과 문서를 만들고 고칠 수 있습니다.</p>
        <div class="row"><input type="password" id="gateCode" inputmode="numeric" autocomplete="off" placeholder="접속코드" aria-label="접속코드" style="flex:1;height:44px;font-size:18px;letter-spacing:.2em;text-align:center"></div>
        <div class="ws-gate-err" id="gateErr" hidden>접속코드가 맞지 않습니다</div>
        <div class="actions"><button class="btn" id="gateCancel">취소</button><button class="btn ink" id="gateOk">입장</button></div></div>`;
      document.body.appendChild(bg);
      const $ = id => bg.querySelector('#' + id);
      const close = v => { bg.remove(); done(v); };
      bg.addEventListener('mousedown', ev => { if (ev.target === bg) close(false); });
      bg.addEventListener('keydown', ev => { if (ev.key === 'Escape') close(false); else if (ev.key === 'Enter') $('gateOk').click(); ev.stopPropagation(); });
      $('gateCancel').onclick = () => close(false);
      $('gateOk').onclick = async () => {
        const v = $('gateCode').value.trim(); if (!v) { $('gateCode').focus(); return; }
        $('gateOk').disabled = true;
        try {
          if (await this.enterAdmin(v)) { close(true); return; }
          $('gateErr').hidden = false; $('gateCode').value = ''; $('gateCode').focus(); bg.querySelector('.modal').classList.remove('shake'); void bg.offsetWidth; bg.querySelector('.modal').classList.add('shake');
        } catch (e) { $('gateErr').textContent = e.message; $('gateErr').hidden = false; }
        $('gateOk').disabled = false;
      };
      setTimeout(() => $('gateCode').focus(), 30);
    });
  },
};
/* 선 아이콘 추가 (common.js 의 ICONS 에 더함 — DOCUMENT·첫 화면에서 씀). 화살표는 common.js 의 back · arrowRight */
if (typeof ICONS !== 'undefined') Object.assign(ICONS, {
  file: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/>',
  filePlus: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="M12 11v6"/><path d="M9 14h6"/>',
  folder: '<path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/>',
  print: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="1.5"/><path d="M7 14h10v6H7Z"/>',
  upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>',
  download: '<path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4Z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  ruler: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3"/><path d="M11 8v4"/><path d="M15 8v3"/><path d="M19 8v4"/>',
  hash: '<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="M16 3l-2 18"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
  symbol: '<path d="M12 3v18"/><path d="M5 12h14"/><circle cx="12" cy="12" r="8"/>',
  pageBreak: '<path d="M4 12h3"/><path d="M10 12h4"/><path d="M17 12h3"/><path d="M6 4v5h12V4"/><path d="M6 20v-5h12v5"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  page: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>',
  zoomIn: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>',
  zoomOut: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/><path d="M8 11h6"/>',
  logout: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5"/><path d="m15 8 4 4-4 4"/><path d="M9 12h10"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  minus: '<path d="M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.01"/>',
  type: '<path d="M4 7V4h16v3"/><path d="M12 4v16"/><path d="M8 20h8"/>',
  paragraph: '<path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4 4 0 0 0 0 8H13"/>',
  presentation: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4"/><path d="M8 20h8"/>',
  doc: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 7.8 8 9 4.6-1.2 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  key: '<circle cx="8" cy="14" r="4"/><path d="m11 11 9-9"/><path d="m16 6 2 2"/><path d="m18 4 2 2"/>',
  textL: '<path d="M4 6h16"/><path d="M4 10h10"/><path d="M4 14h16"/><path d="M4 18h10"/>',
  textC: '<path d="M4 6h16"/><path d="M7 10h10"/><path d="M4 14h16"/><path d="M7 18h10"/>',
  textR: '<path d="M4 6h16"/><path d="M10 10h10"/><path d="M4 14h16"/><path d="M10 18h10"/>',
  textJ: '<path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h16"/><path d="M4 18h16"/>',
  textD: '<path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h16"/><path d="M4 18h16"/><path d="M4 3v18"/><path d="M20 3v18"/>',
  indentL: '<path d="M11 6h9"/><path d="M11 10h9"/><path d="M11 14h9"/><path d="M4 18h16"/><path d="m7 9-3 3 3 3"/>',
  indentR: '<path d="M11 6h9"/><path d="M11 10h9"/><path d="M11 14h9"/><path d="M4 18h16"/><path d="m4 9 3 3-3 3"/>',
  listNum: '<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="M4 5h1.5v4"/><path d="M4 11.5h2.5l-2.5 3h2.5"/><path d="M4 17h2.5a1 1 0 0 1 0 2H5.5a1 1 0 0 0 0 2H6.5"/>',
});
/* common.js 의 fillIcons 는 이 파일보다 먼저 돌았으므로, 위에서 더한 아이콘이 빈 채로 남은 자리를 채움 */
if (typeof icon === 'function') document.querySelectorAll('[data-ic]').forEach(n => { if (!n.firstChild || !n.firstChild.firstChild) n.innerHTML = icon(n.dataset.ic); });
Access.apply();
document.addEventListener('DOMContentLoaded', () => Access.apply());
