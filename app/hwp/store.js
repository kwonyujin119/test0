/* 한글 작업장 저장소
   1) 내 PC 파일 — 열고, 같은 파일에 덮어쓰기(크롬·엣지) 또는 내려받기
   2) 임시 저장 — 이 브라우저(IndexedDB)에 자동 보관, 창이 닫혀도 복구
   3) 문서함 — GitHub 저장소 hwp/ 폴더에 "암호화해서" 보관 (저장소가 공개라도 내용·파일명은 암호 없이 볼 수 없음) */
const HwpStore = (() => {
  /* ---------- 내 PC 파일 ---------- */
  const canFS = 'showOpenFilePicker' in window;
  const PICK = { types: [{ description: '한글 문서 (hwpx)', accept: { 'application/hwp+zip': ['.hwpx'] } }], excludeAcceptAllOption: false };
  async function pickOpen() {
    if (canFS) {
      try { const [h] = await window.showOpenFilePicker(PICK); const f = await h.getFile(); return { file: f, handle: h }; }
      catch (e) { if (e.name === 'AbortError') return null; throw e; }
    }
    return new Promise(res => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.hwpx,application/hwp+zip';
      inp.onchange = () => res(inp.files[0] ? { file: inp.files[0], handle: null } : null);
      inp.click();
    });
  }
  async function writeHandle(handle, blob) {
    if (handle.queryPermission && (await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
      if ((await handle.requestPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('파일에 쓸 권한을 받지 못했습니다');
    }
    const w = await handle.createWritable(); await w.write(blob); await w.close();
  }
  async function pickSave(name, blob) {
    const h = await pickSaveHandle(name);
    if (h) await writeHandle(h, blob); else if (h === null) download(name, blob);
    return h;
  }
  /* 저장 위치만 먼저 고름 (문서를 만들기 전, 클릭 직후에 열어야 브라우저가 창을 막지 않음). 취소=false, 저장 창이 없는 브라우저=null */
  async function pickSaveHandle(name) {
    if (!('showSaveFilePicker' in window)) return null;
    try { return await window.showSaveFilePicker(Object.assign({ suggestedName: name }, PICK)); }
    catch (e) { if (e.name === 'AbortError') return false; throw e; }
  }
  function download(name, blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }

  /* ---------- 임시 저장 (IndexedDB) ---------- */
  let _db = null;
  function db() {
    if (_db) return _db;
    _db = new Promise((res, rej) => {
      const r = indexedDB.open('hwp-ws', 2);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('drafts')) d.createObjectStore('drafts', { keyPath: 'id' }); if (!d.objectStoreNames.contains('keys')) d.createObjectStore('keys'); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return _db;
  }
  async function tx(mode, fn, store) { store = store || 'drafts'; const d = await db(); return new Promise((res, rej) => { const t = d.transaction(store, mode); const s = t.objectStore(store); const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); }
  const drafts = {
    put: (id, name, blob, extra) => tx('readwrite', s => s.put(Object.assign({ id, name, blob, time: Date.now() }, extra || {}))).catch(() => { }),
    get: id => tx('readonly', s => s.get(id)),
    del: id => tx('readwrite', s => s.delete(id)).catch(() => { }),
    list: () => tx('readonly', s => s.getAll()).then(a => (a || []).sort((x, y) => y.time - x.time)).catch(() => []),
  };

  /* ---------- 문서함 (암호화 + GitHub) ---------- */
  const DIR = 'hwp';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const MAGIC = enc.encode('HWPE1');
  let key = null;
  const KEY_ID = () => 'box:' + (GH.cfg ? GH.cfg.owner + '/' + GH.cfg.repo : '');

  function ready() { if (!GH.cfg) GH.load(); return !!(GH.cfg && GH.token); }
  /* 저장소 파일 읽기. contents API 의 raw 응답은 일부 이진 파일에서 0바이트가 오고 1MB 가 넘으면 내용이 비므로,
     파일 정보(sha)를 받은 뒤 내용이 온전하지 않으면 git blob 으로 받음 */
  async function ghBin(path) {
    const fail = r => { const e = new Error(r.status === 401 ? 'GitHub 토큰이 올바르지 않거나 만료되었습니다' : '문서함을 읽지 못했습니다 (' + r.status + ')'); e.status = r.status; return e; };
    const r = await fetch(`${GH.base()}/contents/${encPath(path)}?ref=${encodeURIComponent(GH.cfg.branch)}`, { headers: GH.headers(), cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw fail(r);
    const j = await r.json();
    if (j.encoding === 'base64' && j.content) { const u = unb64(j.content.replace(/\s+/g, '')); if (u.length === j.size) return u; }
    if (!j.size) return new Uint8Array(0);
    const b = await fetch(`${GH.base()}/git/blobs/${j.sha}`, { headers: GH.headers('application/vnd.github.raw+json'), cache: 'no-store' });
    if (!b.ok) throw fail(b);
    const u = new Uint8Array(await b.arrayBuffer());
    if (u.length !== j.size) throw new Error('문서함 파일을 끝까지 받지 못했습니다. 잠시 후 다시 시도해 주세요');
    return u;
  }
  async function derive(pass, salt) {
    const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  /* path 를 추가 인증 데이터로 묶어, 파일을 바꿔치기하면 풀리지 않게 함 */
  async function seal(u8, path) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(path) }, key, u8));
    const out = new Uint8Array(MAGIC.length + 12 + ct.length); out.set(MAGIC, 0); out.set(iv, MAGIC.length); out.set(ct, MAGIC.length + 12); return out;
  }
  async function open(u8, path, k) {
    for (let i = 0; i < MAGIC.length; i++) if (u8[i] !== MAGIC[i]) throw new Error('문서함 파일 형식이 아닙니다');
    const iv = u8.subarray(MAGIC.length, MAGIC.length + 12), ct = u8.subarray(MAGIC.length + 12);
    try { return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(path) }, k || key, ct)); }
    catch (e) { if (!k) lock(); const er = new Error('암호가 맞지 않습니다'); er.badPass = true; throw er; }
  }
  /* box.json: { v, salt, check } — check 는 암호 확인용으로 암호화한 고정 문구 */
  async function boxInfo() { const u = await ghBin(DIR + '/box.json'); return u ? JSON.parse(dec.decode(u)) : null; }
  let unlocking = null;
  function unlock(pass, remember) { // 단추를 두 번 눌러도 한 번만 (문서함이 두 번 만들어져 암호 키가 어긋나지 않게)
    if (!unlocking) unlocking = unlock1(pass, remember).finally(() => { unlocking = null; });
    return unlocking;
  }
  async function unlock1(pass, remember) {
    if (!ready()) throw new Error('GitHub 연결이 필요합니다');
    let info = await boxInfo();
    if (!info) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const k0 = await derive(pass, salt);
      if (await boxInfo()) return unlock1(pass, remember); // 그 사이 다른 기기·창에서 만들어졌으면 그것을 씀
      key = k0;
      info = { v: 1, salt: b64(salt), check: b64(await seal(enc.encode('hwp-ws-ok'), DIR + '/box.json')), note: '한글 작업장 문서함 — 내용은 암호화되어 있습니다' };
      const idx = b64(await seal(enc.encode('[]'), DIR + '/index.bin'));
      await GH.commit('한글 작업장 문서함 만들기', [{ path: DIR + '/box.json', content: JSON.stringify(info, null, 1) }, { path: DIR + '/index.bin', base64: idx }]);
    } else {
      const k = await derive(pass, unb64(info.salt));
      const ok = dec.decode(await open(unb64(info.check), DIR + '/box.json', k)); if (ok !== 'hwp-ws-ok') throw new Error('암호가 맞지 않습니다');
      key = k;
    }
    // 기억하기: 꺼낼 수 없는(non-extractable) 키 객체를 이 브라우저 IndexedDB 에만 보관
    if (remember) await tx('readwrite', s => s.put(key, KEY_ID()), 'keys').catch(() => { });
    return true;
  }
  async function restoreKey() {
    if (key) return true; if (!ready()) return false;
    try { const k = await tx('readonly', s => s.get(KEY_ID()), 'keys'); if (!k) return false; key = k; return true; } catch (e) { return false; }
  }
  function lock() { key = null; tx('readwrite', s => s.delete(KEY_ID()), 'keys').catch(() => { }); }
  async function exists() { return !!(await boxInfo()); }
  async function list() {
    const u = await ghBin(DIR + '/index.bin'); if (!u) return [];
    return JSON.parse(dec.decode(await open(u, DIR + '/index.bin'))).sort((a, b) => (b.modified || '').localeCompare(a.modified || ''));
  }
  async function load(id) { const u = await ghBin(`${DIR}/${id}.bin`); if (!u) throw new Error('문서함에서 문서를 찾지 못했습니다'); return open(u, `${DIR}/${id}.bin`); }
  async function save(id, name, blob, device, preview) {
    const data = new Uint8Array(await blob.arrayBuffer());
    const items = await list(); // 목록을 못 읽으면 저장도 멈춤 (다른 문서 목록을 덮어쓰지 않도록)
    id = id || (Date.now().toString(36) + crypto.getRandomValues(new Uint32Array(1))[0].toString(36));
    const now = new Date().toISOString();
    const i = items.findIndex(x => x.id === id), rec = { id, name, size: data.length, modified: now, device: device || '' };
    if (preview != null) rec.preview = String(preview).slice(0, 400); // 첫 화면 카드의 종이 미리보기 글
    if (i >= 0) items[i] = Object.assign(items[i], rec); else items.push(Object.assign({ created: now }, rec));
    await GH.commit('한글 작업장 문서함 갱신', [{ path: `${DIR}/${id}.bin`, base64: b64(await seal(data, `${DIR}/${id}.bin`)) }, { path: DIR + '/index.bin', base64: b64(await seal(enc.encode(JSON.stringify(items)), DIR + '/index.bin')) }]);
    return id;
  }
  async function remove(id) {
    const items = (await list()).filter(x => x.id !== id);
    await GH.commit('한글 작업장 문서함 갱신', [{ path: `${DIR}/${id}.bin`, delete: true }, { path: DIR + '/index.bin', base64: b64(await seal(enc.encode(JSON.stringify(items)), DIR + '/index.bin')) }]);
  }
  async function rename(id, name) {
    const items = await list(); const it = items.find(x => x.id === id); if (!it) return;
    it.name = name;
    await GH.commit('한글 작업장 문서함 갱신', [{ path: DIR + '/index.bin', base64: b64(await seal(enc.encode(JSON.stringify(items)), DIR + '/index.bin')) }]);
  }

  return {
    canFS, pickOpen, pickSave, pickSaveHandle, writeHandle, download, drafts,
    box: { ready, unlock, restoreKey, lock, exists, list, load, save, remove, rename, get unlocked() { return !!key; },
      /* best 문서(best.js)가 같은 암호로 잠가 올릴 때 씀 */
      read: ghBin, seal: (u8, path) => seal(u8, path), open: (u8, path) => open(u8, path) },
  };
})();
