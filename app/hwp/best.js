/* 문서 — best 문서 (레퍼런스 보관함)
   잘 만든 hwpx 문서를 올려 두면 누적되어 레퍼런스가 된다. 올릴 때 본문 글과 구조(문단마다 스타일·정렬·글꼴·크기, 표의 칸 글)를
   뽑아 함께 저장하므로, 앞으로 "이 레퍼런스처럼 써 줘" 같은 자동 문서 만들기의 재료가 된다.

   저장하는 곳 (API.mode 에 따라):
   · server — 내 PC 서버: best/<id>.hwpx (원본) + best/<id>.json (메타·구조·본문 글). 파일 그대로라 다른 도구가 바로 읽을 수 있다.
   · github — GitHub Pages 에서 토큰을 연결했을 때: 문서함과 같은 암호로 잠가 best/<id>.bin · best/<id>.json.bin · best/index.bin 에 올린다
              (저장소가 공개이므로 암호 없이 올리지 않는다 — 문서함 암호를 먼저 열어야 한다).
   · local  — 그 밖에(서버도 토큰도 없음): 이 브라우저의 IndexedDB 에만 둔다.

   기록(record) 모양:
   { id, name, note, tags: [], added: ISO, size, device,
     meta: { pages, sections, paras, chars, tables, images, fonts: [], styles: [{ name, count }], page: { w, h, land, top, bottom, left, right } },
     outline: [{ level, text }],                                   // 개요·제목 문단만
     struct: [{ t: 'p', st, al, face, size, bold, level?, text } | { t: 'table', rows: [[글, …], …] }],
     text: '본문 전체 글' }
   목록(index)에는 struct · text · outline 을 뺀 것만 둔다. */
const BestDocs = (() => {
  const DIR = 'best';
  const MAX_STRUCT = 4000, MAX_TEXT = 300000, MAX_CELL = 400;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const INDEX_KEYS = ['id', 'name', 'note', 'tags', 'added', 'size', 'device', 'meta'];
  const indexOf = r => { const o = {}; for (const k of INDEX_KEYS) if (r[k] !== undefined) o[k] = r[k]; return o; };
  const newId = () => Date.now().toString(36) + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  const safeName = n => String(n || '').replace(/\.hwpx$/i, '').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').trim().replace(/^\.+/, '').slice(0, 80) || '문서';

  /* 문서는 API.init() 을 따로 부르지 않으므로 여기서 한 번 (내 PC 서버가 있는지 → GitHub 연결인지) */
  let inited = null;
  const init = () => inited || (inited = (typeof API !== 'undefined' ? API.init() : Promise.resolve('local')).catch(() => 'local'));
  function mode() {
    if (typeof API === 'undefined') return 'local';
    if (API.mode === 'server') return 'server';
    if (API.mode === 'github' && typeof GH !== 'undefined' && GH.token) return 'github';
    return 'local';
  }
  const MODE_NAMES = { server: '내 PC 의 best/ 폴더', github: 'GitHub 저장소 (암호화)', local: '이 브라우저 안' };

  /* ---------- 구조 뽑기 ---------- */
  async function extract(buf) {
    const d = await HwpxDoc.open(buf);
    const H = d.header;
    const stName = new Map(H.styles.map(s => [s.id, s.name || s.eng || s.id]));
    const frag = d.render(); // 화면에 붙이지 않고 구조만 읽는다
    const fonts = new Map(), styles = new Map();
    const struct = [], outline = [], textParts = [];
    let chars = 0, tables = 0, images = 0, paras = 0;
    const cellText = td => Array.from(td.children).filter(x => x.classList && x.classList.contains('hp')).map(p => p.textContent.replace(/[​﻿]/g, '').trim()).filter(Boolean).join('\n').slice(0, MAX_CELL);
    for (const sec of frag.querySelectorAll('.hsec')) {
      for (const b of sec.children) {
        if (!b.classList.contains('hp')) continue;
        paras++;
        const cp = H.cp(b.dataset.dcp || '0'), pp = H.pp(b.dataset.pp || '0');
        const st = stName.get(b.dataset.st) || '바탕글';
        styles.set(st, (styles.get(st) || 0) + 1);
        const face = cp.faceH || cp.faceL || ''; if (face) fonts.set(face, (fonts.get(face) || 0) + 1);
        images += b.querySelectorAll('.isl.pic').length;
        // 표: 칸 글을 줄·칸 그대로
        for (const t of b.querySelectorAll(':scope > table.htb, :scope > .isl > table.htb')) {
          tables++;
          const rows = Array.from(t.rows).map(r => Array.from(r.cells).map(cellText));
          if (struct.length < MAX_STRUCT) struct.push({ t: 'table', rows });
          textParts.push(rows.map(r => r.join('\t')).join('\n'));
        }
        // 글 (표 안의 글은 뺌)
        const c = b.cloneNode(true); c.querySelectorAll('table').forEach(x => x.remove());
        const text = c.textContent.replace(/[​﻿]/g, '').replace(/\s+$/g, '').trim();
        if (!text) continue;
        chars += text.replace(/\s/g, '').length; textParts.push(text);
        const item = { t: 'p', st, al: pp.align, face, size: +(cp.height / 100).toFixed(1), bold: !!cp.bold, text: text.slice(0, 2000) };
        const isHead = pp.heading === 'OUTLINE' || /개요|제목|Outline|Heading|Title/i.test(st);
        if (isHead) { item.level = pp.level || 0; if (outline.length < 300) outline.push({ level: item.level, text: text.slice(0, 120) }); }
        if (struct.length < MAX_STRUCT) struct.push(item);
      }
    }
    const pg = d.page(0);
    const meta = {
      sections: d.sections.length, paras, chars, tables, images,
      fonts: Array.from(fonts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(x => x[0]),
      styles: Array.from(styles.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([name, count]) => ({ name, count })),
      page: { w: pg.w, h: pg.h, land: pg.land, top: pg.top, bottom: pg.bottom, left: pg.left, right: pg.right },
      pages: Math.max(1, Math.round(chars / 1100)), // 어림(한 쪽 1100자) — 화면에 띄우지 않고 뽑으므로 정확한 쪽 수는 모른다
      title: d.title || '',
      preview: textParts.slice(0, 12).join('\n').slice(0, 400), // 첫 화면 카드의 종이 미리보기 글
    };
    let text = textParts.join('\n'); if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT) + '\n…(이하 생략)';
    return { meta, outline, struct, text };
  }

  /* ---------- 내 PC 서버 ---------- */
  const S = {
    async list() { const r = await fetch('api/best', { cache: 'no-store' }); if (!r.ok) throw new Error('내 PC 서버가 best 문서 목록을 주지 않았습니다 (' + r.status + ') — 서버(start.cmd)를 새로 띄운 뒤 다시 해 주세요'); return r.json(); },
    async get(id) { const r = await fetch('api/best/' + encodeURIComponent(id), { cache: 'no-store' }); if (!r.ok) throw new Error('best 문서를 읽지 못했습니다 (' + r.status + ')'); return r.json(); },
    async file(id) { const r = await fetch(DIR + '/' + encodeURIComponent(id) + '.hwpx', { cache: 'no-store' }); if (!r.ok) throw new Error('원본 hwpx 파일을 읽지 못했습니다 (' + r.status + ')'); return new Uint8Array(await r.arrayBuffer()); },
    async put(rec, bytes) {
      if (bytes) { const f = await fetch('api/best/' + encodeURIComponent(rec.id) + '/file', { method: 'POST', body: bytes }); if (!f.ok) throw new Error('원본 파일을 올리지 못했습니다 (' + f.status + ')'); }
      const r = await fetch('api/best/' + encodeURIComponent(rec.id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec) });
      if (!r.ok) throw new Error('best 문서를 저장하지 못했습니다 (' + r.status + ')');
    },
    async remove(id) { const r = await fetch('api/best/' + encodeURIComponent(id), { method: 'DELETE' }); if (!r.ok && r.status !== 404) throw new Error('지우지 못했습니다 (' + r.status + ')'); },
    async uniqueId(name) { const ids = new Set((await this.list()).map(x => x.id)); let base = safeName(name), id = base, i = 2; while (ids.has(id)) id = base + '-' + (i++); return id; },
  };

  /* ---------- GitHub (문서함 암호로 잠금) ---------- */
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const G = {
    box() { if (!HwpStore.box.unlocked) { const e = new Error('best 문서를 GitHub 에 올리려면 먼저 문서함 암호를 열어야 합니다'); e.needBox = true; throw e; } return HwpStore.box; },
    async readJson(path) { const u = await this.box().read(path); if (!u) return null; return JSON.parse(dec.decode(await this.box().open(u, path))); },
    async list() { return (await this.readJson(DIR + '/index.bin')) || []; },
    async get(id) { const r = await this.readJson(`${DIR}/${id}.json.bin`); if (!r) throw new Error('best 문서를 찾지 못했습니다'); return r; },
    async file(id) { const u = await this.box().read(`${DIR}/${id}.bin`); if (!u) throw new Error('원본 hwpx 파일을 찾지 못했습니다'); return this.box().open(u, `${DIR}/${id}.bin`); },
    async put(rec, bytes) {
      const items = await this.list(); // 목록을 못 읽으면 저장도 멈춤 (다른 문서를 덮어쓰지 않게)
      const i = items.findIndex(x => x.id === rec.id); if (i >= 0) items[i] = indexOf(rec); else items.push(indexOf(rec));
      const ch = [
        { path: `${DIR}/${rec.id}.json.bin`, base64: b64(await this.box().seal(enc.encode(JSON.stringify(rec)), `${DIR}/${rec.id}.json.bin`)) },
        { path: DIR + '/index.bin', base64: b64(await this.box().seal(enc.encode(JSON.stringify(items)), DIR + '/index.bin')) },
      ];
      if (bytes) ch.unshift({ path: `${DIR}/${rec.id}.bin`, base64: b64(await this.box().seal(bytes, `${DIR}/${rec.id}.bin`)) });
      await GH.commit('best 문서 ' + (bytes ? '추가' : '갱신') + ': ' + rec.id, ch);
    },
    async remove(id) {
      const items = (await this.list()).filter(x => x.id !== id);
      await GH.commit('best 문서 삭제: ' + id, [{ path: `${DIR}/${id}.bin`, delete: true }, { path: `${DIR}/${id}.json.bin`, delete: true }, { path: DIR + '/index.bin', base64: b64(await this.box().seal(enc.encode(JSON.stringify(items)), DIR + '/index.bin')) }]);
    },
    async uniqueId() { return newId(); },
  };

  /* ---------- 이 브라우저 (IndexedDB) ---------- */
  let _db = null;
  function db() {
    if (_db) return _db;
    _db = new Promise((res, rej) => { const r = indexedDB.open('hwp-best', 1); r.onupgradeneeded = () => { r.result.createObjectStore('docs', { keyPath: 'id' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    return _db;
  }
  async function tx(modeName, fn) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('docs', modeName); const r = fn(t.objectStore('docs')); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); }
  const L = {
    async list() { const all = (await tx('readonly', s => s.getAll())) || []; return all.map(indexOf); },
    async get(id) { const r = await tx('readonly', s => s.get(id)); if (!r) throw new Error('best 문서를 찾지 못했습니다'); const o = Object.assign({}, r); delete o.file; return o; },
    async file(id) { const r = await tx('readonly', s => s.get(id)); if (!r || !r.file) throw new Error('원본 hwpx 파일을 찾지 못했습니다'); return new Uint8Array(await r.file.arrayBuffer()); },
    async put(rec, bytes) { let file = bytes ? new Blob([bytes], { type: 'application/hwp+zip' }) : (await tx('readonly', s => s.get(rec.id)) || {}).file; await tx('readwrite', s => s.put(Object.assign({}, rec, { file }))); },
    async remove(id) { await tx('readwrite', s => s.delete(id)); },
    async uniqueId() { return newId(); },
  };
  const be = () => ({ server: S, github: G, local: L })[mode()];

  /* ---------- 공개 API ---------- */
  async function list() { await init(); return (await be().list()).sort((a, b) => (b.added || '').localeCompare(a.added || '')); }
  async function get(id) { await init(); return be().get(id); }
  async function file(id) { await init(); return be().file(id); }
  /* 올리기: hwpx 파일 → 구조 뽑기 → 저장. opts = { note, tags: [], progress(msg) } */
  async function add(f, opts) {
    opts = opts || {};
    const say = m => { if (opts.progress) opts.progress(m); };
    if (!/\.hwpx$/i.test(f.name || '')) throw new Error('.hwpx 파일만 올릴 수 있습니다 (.hwp 는 한글에서 hwpx 로 저장한 뒤 올려 주세요)');
    await init();
    say('문서를 읽는 중…');
    const buf = await f.arrayBuffer();
    const bytes = new Uint8Array(buf);
    say('구조를 뽑는 중…');
    const x = await extract(buf);
    const id = await be().uniqueId(f.name);
    const rec = { id, name: safeName(f.name), note: (opts.note || '').trim(), tags: (opts.tags || []).map(t => String(t).trim()).filter(Boolean).slice(0, 12), added: new Date().toISOString(), size: bytes.length, device: deviceName(), meta: x.meta, outline: x.outline, struct: x.struct, text: x.text };
    say('저장하는 중…');
    await be().put(rec, bytes);
    return rec;
  }
  /* 이름 · 메모 · 꼬리표 고치기 */
  async function update(id, patch) {
    await init();
    const rec = await be().get(id);
    if (patch.name != null) rec.name = safeName(patch.name) || rec.name;
    if (patch.note != null) rec.note = String(patch.note).trim();
    if (patch.tags != null) rec.tags = patch.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 12);
    await be().put(rec, null);
    return rec;
  }
  async function remove(id) { await init(); return be().remove(id); }
  function deviceName() { const ua = navigator.userAgent; return /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : ''; }
  /* 레퍼런스 전체를 한 덩어리로 (앞으로 자동 문서 만들기에 넘길 재료) */
  async function exportAll() { const items = await list(); const out = []; for (const it of items) out.push(await get(it.id)); return out; }

  return { mode, init, MODE_NAMES, extract, list, get, file, add, update, remove, exportAll, safeName, deviceName };
})();
