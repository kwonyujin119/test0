/* 잠긴 폴더 확인 — 발표 화면 · 편집기가 함께 씀
   교안 목록(hub.js)에서 관리자가 폴더를 잠그면 gyoan-folders.json 의 폴더에 locked: true 가 붙는다.
   게스트(관리자가 아닌 기기)는 잠긴 폴더 안 교안을 발표 · 편집 화면으로도 열 수 없다.
   솔직한 한계: 화면에서 막는 잠금이다. 교안 파일(decks/*.json) 주소를 직접 아는 사람은 파일을 받을 수 있다. */
'use strict';
const FolderLock = {
  ADMIN_DAYS: 30, // access.js 와 같은 기간
  isAdmin() {
    try { const s = JSON.parse(localStorage.getItem('ws:access') || 'null'); return !!(s && s.role === 'admin' && s.at && Date.now() - s.at < this.ADMIN_DAYS * 864e5); } catch (e) { return false; }
  },
  async folders() {
    try {
      if (API.mode === 'server') { const r = await fetch('api/folders', { cache: 'no-store' }); return r.ok ? r.json() : null; }
      if (API.mode === 'github') {
        if (!GH.token && GH.onPages) { const r = await fetch('gyoan-folders.json', { cache: 'no-store' }).catch(() => null); if (r && r.ok) return r.json(); }
        const t = await GH.raw('gyoan-folders.json'); return t ? JSON.parse(t) : null;
      }
      return JSON.parse(localStorage.getItem('gyoan:folders:local') || 'null');
    } catch (e) { return null; }
  },
  /* 이 기기에서 이 교안을 열면 안 되는지: 잠긴 폴더 이름 | '' */
  async blocked(name) {
    if (this.isAdmin()) return '';
    const j = await this.folders(); if (!j || !j.decks || !Array.isArray(j.folders)) return '';
    const id = j.decks[name]; const f = id && j.folders.find(x => x && x.id === id);
    return f && f.locked === true ? String(f.name || '잠긴 폴더') : '';
  },
  screen(folderName) {
    return `<div class="pend show"><div class="pend-t">잠긴 교안입니다</div><div style="color:#c9cbd1;max-width:560px;padding:0 20px;text-align:center;font-size:15px;line-height:1.65;word-break:keep-all">「${esc(folderName)}」 폴더는 관리자만 볼 수 있습니다. 첫 화면에서 관리자로 입장하면 열립니다.</div><div class="pend-a"><a class="btn ink" href="index.html?mode=1">관리자로 입장</a><a class="btn" href="gyoan.html">교안 목록으로</a></div></div>`;
  },
};
