/* 영상 작업장 — 핵심: 프로젝트 자료, 되돌리기, 기기 안 보관(IndexedDB), 미디어 읽기, 시간 계산
   파일은 서버로 보내지 않고 이 기기 브라우저 안에서만 처리한다.
   이름 충돌을 막으려고 모든 것을 VE 아래에 둔다 (common.js 의 전역 이름과 겹치지 않게) */
'use strict';
const VE = window.VE = {};
(() => {
  Object.assign(ICONS, {
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16"/><path d="M16 4v16"/><path d="M3 9h5"/><path d="M3 15h5"/><path d="M16 9h5"/><path d="M16 15h5"/>',
    scissors: '<circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M8 8l12 10"/><path d="M8 16 20 6"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4"/><path d="M8 20h8"/>',
    captions: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 12h4"/><path d="M13 12h4"/><path d="M7 16h7"/>',
    wave: '<path d="M4 10v4"/><path d="M8 7v10"/><path d="M12 4v16"/><path d="M16 8v8"/><path d="M20 10v4"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    pause: '<path d="M8 5v14"/><path d="M16 5v14"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
    record: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
    camera: '<rect x="3" y="7" width="13" height="10" rx="2"/><path d="m16 11 5-3v8l-5-3"/>',
    skipB: '<path d="M6 5v14"/><path d="m19 5-10 7 10 7Z"/>',
    skipF: '<path d="M18 5v14"/><path d="m5 5 10 7-10 7Z"/>',
    stepB: '<path d="m15 6-6 6 6 6"/>',
    stepF: '<path d="m9 6 6 6-6 6"/>',
    speed: '<path d="M4 16a8.5 8.5 0 1 1 16 0"/><path d="m12 14 4-5"/>',
    magnet: '<path d="M5 4v8a7 7 0 0 0 14 0V4h-4v8a3 3 0 0 1-6 0V4Z"/><path d="M5 8h4"/><path d="M15 8h4"/>',
    fit: '<path d="M4 9V5h4"/><path d="M20 9V5h-4"/><path d="M4 15v4h4"/><path d="M20 15v4h-4"/>',
    gap: '<path d="M6 4v16"/><path d="M18 4v16"/><path d="m10 9-3 3 3 3"/><path d="m14 9 3 3-3 3"/>',
    volume: '<path d="M4 10v4h3l5 4V6L7 10Z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/>',
    mute: '<path d="M4 10v4h3l5 4V6L7 10Z"/><path d="m16 9.5 5 5"/><path d="m21 9.5-5 5"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.8 8.6 4.95 4.95 0 0 1 17.5 18.5Z"/>',
    shrink: '<path d="M9 4v5H4"/><path d="M15 4v5h5"/><path d="M9 20v-5H4"/><path d="M15 20v-5h5"/>',
    sparkle: '<path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8Z"/>',
    blur: '<rect x="4" y="4" width="4" height="4"/><rect x="10" y="4" width="4" height="4"/><rect x="16" y="4" width="4" height="4"/><rect x="4" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="16" y="10" width="4" height="4"/><rect x="4" y="16" width="4" height="4"/><rect x="10" y="16" width="4" height="4"/><rect x="16" y="16" width="4" height="4"/>',
    fileText: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/>',
    folderOpen: '<path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v2"/><path d="M3 18 6 11h15l-3 8H4a1 1 0 0 1-1-1V7"/>',
  });

  /* common.js 가 먼저 빈 그림으로 채워 둔 자리를 다시 채움 */
  document.querySelectorAll('[data-ic]').forEach(n => { if (!n.firstChild || !n.firstChild.firstChild) n.innerHTML = icon(n.dataset.ic); });
  const $ = VE.$ = id => document.getElementById(id);
  VE.MB_URL = 'https://cdn.jsdelivr.net/npm/mediabunny@1.65.2/dist/bundles/mediabunny.min.mjs';
  VE.mb = () => VE._mb || (VE._mb = import(VE.MB_URL).catch(() => { VE._mb = null; throw new Error('영상 처리 부품을 받지 못했습니다. 인터넷 연결을 확인해 주세요.'); }));

  /* ---------- 시간 표시 ---------- */
  VE.fmtT = (t, tenth) => {
    t = Math.max(0, t || 0); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = Math.floor(t % 60);
    const base = (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0');
    return tenth ? base + '.' + Math.floor(t * 10 % 10) : base;
  };
  VE.fmtLen = t => t < 10 ? t.toFixed(1) + '초' : t < 60 ? Math.round(t) + '초' : VE.fmtT(t);
  VE.fmtSize = b => b >= 1073741824 ? (b / 1073741824).toFixed(1) + 'GB' : b >= 1048576 ? Math.round(b / 1048576) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB';

  /* ---------- 이벤트 ---------- */
  const subs = {};
  VE.on = (k, f) => { (subs[k] = subs[k] || []).push(f); };
  VE.emit = (k, a) => { (subs[k] || []).forEach(f => { try { f(a); } catch (e) { console.error(e); } }); };

  /* ---------- 기기 안 보관 ---------- */
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('ws-video', 1);
    r.onupgradeneeded = () => { const d = r.result; for (const s of ['projects', 'blobs', 'cache', 'chars']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (store, mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(store, mode); const q = fn(t.objectStore(store)); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); };
  VE.idb = {
    get: (s, k) => tx(s, 'readonly', o => o.get(k)), put: (s, k, v) => tx(s, 'readwrite', o => o.put(v, k)), del: (s, k) => tx(s, 'readwrite', o => o.delete(k)),
    all: async (s) => { const d = await db(); return new Promise((res, rej) => { const out = []; const q = d.transaction(s).objectStore(s).openCursor(); q.onsuccess = () => { const c = q.result; if (c) { out.push({ key: c.key, value: c.value }); c.continue(); } else res(out); }; q.onerror = () => rej(q.error); }); },
  };

  /* ---------- 프로젝트 자료 ---------- */
  VE.newProject = (name) => ({
    id: uid(), name: name || '새 영상', updated: Date.now(), aspect: '16:9', bg: 'blur', fps: 30,
    media: [], clips: [], titles: [], music: [],
    cap: { on: true, style: 'outline', size: 1, pos: 'bottom', maxChars: 26 },
    voice: { clean: false, denoise: .85, level: true, preset: 'none', pitch: 0 },
    aiLabel: true, aiVoiceLabel: true, faceOk: false,
  });
  VE.p = VE.newProject(); VE.rt = new Map(); VE.sel = null; VE.rev = 1;
  const ASPECTS = VE.ASPECTS = { '16:9': [16, 9], '9:16': [9, 16], '1:1': [1, 1], '4:5': [4, 5] };
  /* short = 짧은 변의 픽셀 수 (1080 → 1920×1080, 세로면 1080×1920) */
  VE.frameSize = (short) => { const [a, b] = ASPECTS[VE.p.aspect] || ASPECTS['16:9']; short = short || 1080; const k = short / Math.min(a, b); const even = v => Math.round(v * k / 2) * 2; return [even(a), even(b)]; };
  VE.media = id => VE.p.media.find(m => m.id === id);
  VE.clip = id => VE.p.clips.find(c => c.id === id);

  /* 되돌리기 */
  const SNAP_KEYS = ['clips', 'titles', 'music', 'aspect', 'bg', 'cap', 'voice', 'aiLabel', 'aiVoiceLabel'];
  const undoS = [], redoS = [];
  const snapStr = () => { const o = {}; SNAP_KEYS.forEach(k => o[k] = VE.p[k]); return JSON.stringify(o); };
  VE.snap = () => { undoS.push(snapStr()); if (undoS.length > 120) undoS.shift(); redoS.length = 0; VE.emit('history'); };
  VE.touch = (noSave) => { VE.rev++; layoutCache = null; capCache = null; VE.emit('change'); if (!noSave) VE.saveSoon(); };
  VE.edit = (fn) => { VE.snap(); const r = fn(); VE.touch(); return r; };
  const applySnap = (s) => { Object.assign(VE.p, JSON.parse(s)); if (VE.sel && !VE.selObj()) VE.sel = null; VE.touch(); VE.emit('select'); };
  VE.undo = () => { if (!undoS.length) return; redoS.push(snapStr()); applySnap(undoS.pop()); VE.emit('history'); };
  VE.redo = () => { if (!redoS.length) return; undoS.push(snapStr()); applySnap(redoS.pop()); VE.emit('history'); };
  VE.canUndo = () => undoS.length > 0; VE.canRedo = () => redoS.length > 0;
  VE.clearHistory = () => { undoS.length = redoS.length = 0; VE.emit('history'); };

  VE.select = (sel) => { VE.sel = sel; VE.emit('select'); };
  VE.selObj = () => { const s = VE.sel; if (!s) return null; const list = s.type === 'clip' ? VE.p.clips : s.type === 'music' ? VE.p.music : VE.p.titles; return list.find(o => o.id === s.id) || null; };

  /* 저장 */
  let saveTimer = 0;
  VE.saveState = 'saved';
  VE.saveSoon = () => { VE.saveState = 'dirty'; VE.emit('save'); clearTimeout(saveTimer); saveTimer = setTimeout(VE.saveNow, 700); };
  VE.saveNow = async () => {
    clearTimeout(saveTimer); VE.p.updated = Date.now();
    try { await VE.idb.put('projects', VE.p.id, JSON.parse(JSON.stringify(VE.p))); try { localStorage.setItem('ve:last', VE.p.id); } catch (e) { } VE.saveState = 'saved'; }
    catch (e) { console.error(e); VE.saveState = 'error'; }
    VE.emit('save');
  };

  /* ---------- 시간 계산: 본 트랙은 틈 없이 이어 붙는다 (자석 방식) ---------- */
  let layoutCache = null, capCache = null;
  VE.clipLen = c => (c.out - c.in) / (c.speed || 1);
  VE.layout = () => {
    if (layoutCache) return layoutCache;
    const starts = []; let t = 0; for (const c of VE.p.clips) { starts.push(t); t += VE.clipLen(c); }
    return layoutCache = { starts, total: t };
  };
  VE.total = () => VE.layout().total;
  VE.startOf = id => { const i = VE.p.clips.findIndex(c => c.id === id); return i < 0 ? 0 : VE.layout().starts[i]; };
  VE.at = (t) => {
    const { starts, total } = VE.layout(), cl = VE.p.clips; if (!cl.length) return null;
    t = clamp(t, 0, total); let lo = 0, hi = cl.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (starts[m] <= t + 1e-6) lo = m; else hi = m - 1; }
    const c = cl[lo]; return { clip: c, i: lo, start: starts[lo], src: Math.min(c.out, c.in + (t - starts[lo]) * (c.speed || 1)) };
  };

  /* ---------- 편집 동작 ---------- */
  const newClip = (m, a, b) => ({ id: uid(), mid: m.id, in: a, out: b, speed: 1, vol: 1, fadeIn: 0, fadeOut: 0, fit: 'fit', zoom: 1, px: 0, py: 0, face: null, pip: null });
  VE.newClip = newClip;
  VE.addClip = (mid, index) => {
    const m = VE.media(mid); if (!m) return null;
    if (m.kind === 'audio') return VE.addMusic(mid, VE.player ? VE.player.t : 0);
    return VE.edit(() => { const c = newClip(m, 0, m.kind === 'image' ? 5 : m.dur); if (index == null) VE.p.clips.push(c); else VE.p.clips.splice(index, 0, c); VE.sel = { type: 'clip', id: c.id }; VE.emit('select'); return c; });
  };
  VE.addMusic = (mid, start) => VE.edit(() => { const m = VE.media(mid); const o = { id: uid(), mid, start: start || 0, in: 0, out: m.dur, vol: .35, fadeIn: 0, fadeOut: 1 }; VE.p.music.push(o); VE.sel = { type: 'music', id: o.id }; VE.emit('select'); return o; });
  VE.addTitle = (text, preset) => VE.edit(() => { const t0 = VE.player ? VE.player.t : 0; const o = { id: uid(), start: t0, end: t0 + 4, text: text || '제목을 입력하세요', preset: preset || 'title', x: .5, y: preset === 'lower' ? .84 : .42, size: 1, color: '#ffffff' }; VE.p.titles.push(o); VE.sel = { type: 'title', id: o.id }; VE.emit('select'); return o; });
  /* 재생 위치에서 자르기 */
  VE.splitAt = (t) => {
    const a = VE.at(t); if (!a) return false;
    /* 원본 프레임 경계에 맞춰 자름 (반 프레임 어긋남 방지) */
    const fps = (VE.media(a.clip.mid) || {}).fps, cut = fps > 0 ? Math.round(a.src * fps) / fps : a.src; if (cut - a.clip.in < .02 || a.clip.out - cut < .02) return false;
    VE.edit(() => { const c = a.clip, d = JSON.parse(JSON.stringify(c)); d.id = uid(); d.in = cut; c.out = cut; d.fadeIn = 0; c.fadeOut = 0; VE.p.clips.splice(a.i + 1, 0, d); });
    return true;
  };
  /* 타임라인 구간들을 잘라 내고 뒤를 당김 (글자 상자도 함께 당김) */
  VE.removeRanges = (ranges) => {
    ranges = ranges.filter(r => r[1] - r[0] > .005).sort((a, b) => a[0] - b[0]);
    const merged = []; for (const r of ranges) { const l = merged[merged.length - 1]; if (l && r[0] <= l[1] + .001) l[1] = Math.max(l[1], r[1]); else merged.push([r[0], r[1]]); }
    if (!merged.length) return 0;
    return VE.edit(() => {
      const { starts } = VE.layout(), out = [], extra = [];
      VE.p.clips.forEach((c, i) => {
        const a = starts[i], b = a + VE.clipLen(c), sp = c.speed || 1, i0 = c.in; let cur = a, first = true; const segs = [];
        for (const r of merged) { if (r[1] <= a || r[0] >= b) continue; if (r[0] > cur) segs.push([cur, r[0]]); cur = Math.max(cur, r[1]); }
        if (cur < b) segs.push([cur, b]);
        /* 잘리고 남은 0.12초 미만 부스러기는 순간 튀어 보이므로 함께 지운다 (손대지 않은 장면은 그대로) */
        const whole = segs.length === 1 && segs[0][0] === a && segs[0][1] === b;
        const keep = segs.filter(s => whole || s[1] - s[0] >= .12);
        if (!whole) segs.forEach(s => { if (s[1] - s[0] < .12) extra.push(s); });
        keep.forEach((s, k) => {
          const d = first ? c : JSON.parse(JSON.stringify(c)); if (!first) d.id = uid(); first = false;
          d.in = i0 + (s[0] - a) * sp; d.out = i0 + (s[1] - a) * sp; if (k > 0) d.fadeIn = 0; if (k < keep.length - 1) d.fadeOut = 0; out.push(d);
        });
      });
      if (extra.length) { merged.push(...extra); merged.sort((x, y) => x[0] - y[0]); }
      const shift = t => { let m = 0; for (const r of merged) { if (t >= r[1]) m += r[1] - r[0]; else if (t > r[0]) m += t - r[0]; } return t - m; };
      VE.p.titles = VE.p.titles.map(o => ({ ...o, start: shift(o.start), end: shift(o.end) })).filter(o => o.end - o.start > .05);
      VE.p.clips = out; if (VE.sel && !VE.selObj()) { VE.sel = null; VE.emit('select'); }
      return merged.reduce((s, r) => s + r[1] - r[0], 0);
    });
  };
  /* 원본 시간 구간 → 타임라인 구간 */
  VE.srcToTimeline = (mid, a, b) => {
    const { starts } = VE.layout(), out = [];
    VE.p.clips.forEach((c, i) => { if (c.mid !== mid) return; const s = Math.max(a, c.in), e = Math.min(b, c.out); if (e > s) out.push([starts[i] + (s - c.in) / (c.speed || 1), starts[i] + (e - c.in) / (c.speed || 1)]); });
    return out;
  };
  /* 끌지 않고 옮기기 (단추 · 키보드): 클립은 한 칸 앞뒤로, 글자 · 소리는 dt 초만큼 */
  VE.moveSel = (dir, dt) => {
    const s = VE.sel, o = VE.selObj(); if (!o) return false;
    if (s.type === 'clip') {
      const i = VE.p.clips.indexOf(o), j = i + (dir < 0 ? -1 : 1); if (j < 0 || j >= VE.p.clips.length) return false;
      VE.edit(() => { VE.p.clips.splice(i, 1); VE.p.clips.splice(j, 0, o); }); return true;
    }
    const d = (dir < 0 ? -1 : 1) * (dt || .1), len = s.type === 'music' ? 0 : o.end - o.start, start = Math.max(0, Math.round((o.start + d) * 100) / 100);
    if (start === o.start) return false;
    VE.edit(() => { o.start = start; if (s.type === 'title') o.end = start + len; }); return true;
  };
  VE.deleteSel = () => {
    const s = VE.sel, o = VE.selObj(); if (!o) return;
    VE.edit(() => { if (s.type === 'clip') VE.p.clips = VE.p.clips.filter(c => c !== o); else if (s.type === 'music') VE.p.music = VE.p.music.filter(c => c !== o); else VE.p.titles = VE.p.titles.filter(c => c !== o); VE.sel = null; VE.emit('select'); });
  };

  /* ---------- 자막: 원본 시간의 낱말 → 타임라인의 줄 (자르면 저절로 맞음) ---------- */
  const lowerWord = (ws, t) => { let lo = 0, hi = ws.length; while (lo < hi) { const m = (lo + hi) >> 1; if (ws[m].e < t) lo = m + 1; else hi = m; } return lo; };
  VE.captions = () => {
    if (capCache) return capCache;
    /* 한 자막 글자 수: 설정값, 세로 화면은 줄을 짧게 */
    const [ax, ay] = VE.ASPECTS[VE.p.aspect] || [16, 9], vertical = ay > ax, len0 = VE.p.cap.len || 'mid';
    const max = ({ short: vertical ? 12 : 18, mid: vertical ? 16 : 26, long: vertical ? 24 : 38 })[len0] || 26;
    const out = [], { starts } = VE.layout(); let cur = null;
    /* 말을 나누기 좋은 곳: 문장 끝, 쉼표, 이어 주는 말끝(…고 · …서 · …며 · …는데 · …지만 …) */
    const SOFT = /(,|고|서|며|면|데|지만|니까|으니|는데|은데|도록|면서|거나)$/;
    const flush = () => { if (cur && cur.words.length) { cur.text = cur.words.map(w => w.t).join(' '); cur.end = cur.words[cur.words.length - 1].e; out.push(cur); } cur = null; };
    VE.p.clips.forEach((c, i) => {
      const m = VE.media(c.mid); if (!m || !m.words || !m.words.length) { flush(); return; }
      const sp = c.speed || 1, ws = m.words;
      for (let k = lowerWord(ws, c.in); k < ws.length && ws[k].s < c.out; k++) {
        const w = ws[k]; if ((w.s + w.e) / 2 < c.in || (w.s + w.e) / 2 > c.out) continue;
        const s = starts[i] + (Math.max(w.s, c.in) - c.in) / sp, e = starts[i] + (Math.min(w.e, c.out) - c.in) / sp;
        const item = { s, e, t: w.t, mid: c.mid, ws: w.s, we: w.e, ref: w, clip: c.id };
        if (cur) {
          const last = cur.words[cur.words.length - 1], have = cur.words.reduce((a, x) => a + x.t.length + 1, 0), len = have + w.t.length, lt = String(last.t).trim();
          if (len > max && !(s - last.e > .45 || /[.?!。]$/.test(lt))) {
            /* 길이가 넘치면 가장 가까운 말 덩어리 경계(…면 · …고 · 쉼표)로 물러나 나눔 → "호스를 / 연결하고" 대신 "…발생하면 / 소방차가 …" */
            let j = -1, acc = 0; cur.words.forEach((x, q) => { acc += x.t.length + 1; if (q < cur.words.length - 1 && (SOFT.test(String(x.t).trim()) || /[,.?!]$/.test(String(x.t).trim())) && acc >= max * .3) j = q; });
            if (j >= 0) { const rest = cur.words.splice(j + 1); flush(); cur = { start: rest[0].s, end: rest[rest.length - 1].e, words: rest }; }
            else flush();
          } else if (s - last.e > .45 || /[.?!。]$/.test(lt) || (SOFT.test(lt) && have >= max * .55) || (s - last.e > .25 && have >= max * .4)) flush();
          if (cur && cur.words.reduce((a, x) => a + x.t.length + 1, 0) + w.t.length > max * 1.15) flush();
        }
        if (!cur) cur = { start: s, end: e, words: [] };
        cur.words.push(item);
      }
    });
    flush();
    out.forEach((c, i) => { const n = out[i + 1]; c.showEnd = n && n.start - c.end < .35 ? n.start : c.end + .25; });
    return capCache = out;
  };
  VE.capAt = (t) => { const l = VE.captions(); let lo = 0, hi = l.length - 1, f = null; while (lo <= hi) { const m = (lo + hi) >> 1; if (l[m].start <= t) { f = l[m]; lo = m + 1; } else hi = m - 1; } return f && t < f.showEnd ? f : null; };
  VE.toSrt = () => {
    const f = t => { const ms = Math.round(t * 1000), h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1e3).padStart(3, '0')}`; };
    return VE.captions().map((c, i) => `${i + 1}\n${f(c.start)} --> ${f(c.showEnd)}\n${c.text}\n`).join('\n');
  };
  VE.capDirty = () => { capCache = null; VE.rev++; VE.emit('change'); VE.saveSoon(); };

  /* ---------- 미디어 읽기 ---------- */
  const kindOf = f => { const t = f.type || '', n = (f.name || '').toLowerCase(); if (t.startsWith('video/') || /\.(mp4|m4v|mov|webm|mkv)$/.test(n)) return 'video'; if (t.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|oga|flac|opus)$/.test(n)) return 'audio'; if (t.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/.test(n)) return 'image'; return null; };
  VE.kindOf = kindOf;
  /* 재생용 요소가 파일을 열 수 있는지 시험 */
  const elProbe = (url, kind) => new Promise(res => {
    const e = document.createElement(kind === 'audio' ? 'audio' : 'video'); e.preload = 'metadata'; e.muted = true; let done = false;
    const fin = v => { if (done) return; done = true; res(v); e.removeAttribute('src'); e.load(); };
    e.onloadedmetadata = () => { if (e.duration === Infinity) { e.currentTime = 1e7; e.ontimeupdate = () => { e.ontimeupdate = null; fin({ dur: e.duration, w: e.videoWidth, h: e.videoHeight }); }; return; } fin({ dur: e.duration, w: e.videoWidth, h: e.videoHeight }); };
    e.onerror = () => fin(null); setTimeout(() => fin(null), 20000); e.src = url;
  });
  async function openInput(mid) {
    const r = VE.rt.get(mid); if (r.inputP) return r.inputP;
    r.inputP = (async () => {
      const MB = await VE.mb();
      const input = new MB.Input({ formats: MB.ALL_FORMATS, source: new MB.BlobSource(r.blob) });
      r.input = input; r.vTrack = await input.getPrimaryVideoTrack().catch(() => null); r.aTrack = await input.getPrimaryAudioTrack().catch(() => null);
      return r;
    })();
    return r.inputP;
  }
  VE.openInput = openInput;
  async function probe(file, kind) {
    const url = URL.createObjectURL(file), meta = { kind, name: file.name || '이름 없음', size: file.size, type: file.type || '' };
    if (kind === 'image') { const b = await createImageBitmap(file); Object.assign(meta, { w: b.width, h: b.height, dur: 5, hasAudio: false }); b.close(); return { meta, url }; }
    let via = null;
    try {
      const MB = await VE.mb(); const input = new MB.Input({ formats: MB.ALL_FORMATS, source: new MB.BlobSource(file) });
      const v = await input.getPrimaryVideoTrack(), a = await input.getPrimaryAudioTrack();
      via = { dur: await input.computeDuration(), hasAudio: !!a };
      if (v) { via.w = v.displayWidth; via.h = v.displayHeight; try { const st = await v.computePacketStats(90); via.fps = st.averagePacketRate; } catch (e) { } if (!(await v.canDecode())) via.noDecode = true; }
    } catch (e) { console.warn('읽기 부품으로 열지 못함', e); }
    const el = await elProbe(url, kind);
    if (!via && !el) { URL.revokeObjectURL(url); throw new Error('이 파일 형식은 열 수 없습니다'); }
    if (kind === 'video' && !el) meta.noPlay = true;
    Object.assign(meta, { dur: (via && via.dur) || (el && el.dur) || 0, w: (via && via.w) || (el && el.w) || 0, h: (via && via.h) || (el && el.h) || 0, fps: via && via.fps ? Math.round(via.fps * 100) / 100 : 0, hasAudio: via ? via.hasAudio : true, noDecode: !!(via && via.noDecode) });
    return { meta, url };
  }
  VE.importFiles = async (files, opts) => {
    opts = opts || {}; const added = [];
    for (const f of Array.from(files)) {
      const kind = VE.kindOf(f); if (!kind) { toast(`${f.name}: 영상·소리·그림 파일만 넣을 수 있습니다`, 3200); continue; }
      VE.emit('busy', { msg: `${f.name} 읽는 중…` });
      try {
        const { meta, url } = await probe(f, kind); const m = { id: uid(), ...meta, words: null, role: opts.role || '' };
        VE.rt.set(m.id, { blob: f, url, els: {}, thumbs: new Map() });
        VE.p.media.push(m); added.push(m);
        if (kind === 'video' && m.fps > 40 && VE.p.fps < 60 && !VE.p.clips.length) VE.p.fps = 60;
        VE.idb.put('blobs', m.id, f).catch(e => { m.unsaved = true; VE.saveSoon(); toast('기기 저장 공간이 모자라 이 파일은 보관하지 못했습니다. 다음에 다시 연결해야 합니다.', 5000); console.warn(e); });
        if (m.noPlay) toast(`${m.name}: 이 브라우저에서 바로 재생할 수 없는 형식입니다. MP4(H.264) 를 권합니다.`, 5000);
        if (m.hasAudio && kind !== 'image') VE.computePeaks(m.id);
      } catch (e) { toast(`${f.name}: ${e.message}`, 4000); }
    }
    VE.emit('busy', null);
    if (added.length) {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
      VE.emit('media');
      if (opts.autoAdd !== false) {
        VE.snap();
        if (!VE.p.clips.length && added[0].w && added[0].h && added[0].h > added[0].w * 1.2) VE.p.aspect = '9:16'; /* 세로 영상으로 시작하면 세로 화면으로 */
        for (const m of added) { if (m.kind === 'audio') VE.p.music.push({ id: uid(), mid: m.id, start: 0, in: 0, out: m.dur, vol: .35, fadeIn: 0, fadeOut: 1 }); else VE.p.clips.push(newClip(m, 0, m.kind === 'image' ? 5 : m.dur)); }
        VE.touch(); if (VE.fitTimeline) VE.fitTimeline();
      } else VE.saveSoon();
    }
    return added;
  };

  /* 소리 크기 곡선 (초당 50칸) — 파형 그리기와 무음 찾기에 씀 */
  VE.PEAK_HZ = 50;
  VE.computePeaks = async (mid) => {
    const r = VE.rt.get(mid), m = VE.media(mid); if (!r || r.peaks || r.peaking) return r && r.peaks; r.peaking = true;
    try {
      const hit = await VE.idb.get('cache', mid + ':peaks').catch(() => null); if (hit) { r.peaks = hit; r.peaksDone = true; VE.emit('peaks', mid); return hit; }
      const MB = await VE.mb(); await openInput(mid); if (!r.aTrack) { m.hasAudio = false; return null; }
      const n = Math.ceil(m.dur * VE.PEAK_HZ) + 2, out = new Float32Array(n); r.peaks = out;
      const sink = new MB.AudioBufferSink(r.aTrack); let lastEmit = 0;
      for await (const { buffer, timestamp } of sink.buffers()) {
        const sr = buffer.sampleRate, d = buffer.getChannelData(0), step = sr / VE.PEAK_HZ;
        for (let i = 0; i * step < d.length; i++) {
          const a = Math.floor(i * step), b = Math.min(d.length, Math.floor((i + 1) * step)); let s = 0; for (let j = a; j < b; j += 2) s += d[j] * d[j];
          const k = Math.floor((timestamp + a / sr) * VE.PEAK_HZ); if (k >= 0 && k < n) out[k] = Math.max(out[k], Math.sqrt(s / Math.max(1, (b - a) / 2)));
        }
        const now = performance.now(); if (now - lastEmit > 300) { lastEmit = now; VE.emit('peaks', mid); await new Promise(z => setTimeout(z)); }
      }
      r.peaksDone = true; VE.idb.put('cache', mid + ':peaks', out).catch(() => { });
      VE.emit('peaks', mid); return out;
    } catch (e) { console.warn('파형 분석 실패', e); r.peaks = null; return null; }
    finally { r.peaking = false; }
  };

  /* 미리보기 그림 띠 */
  const thumbQ = []; let thumbBusy = false;
  VE.thumbStep = (pxPerSec, cellW) => { const need = cellW / pxPerSec; for (const s of [.5, 1, 2, 5, 10, 20, 30, 60, 120, 300, 600]) if (s >= need) return s; return 1200; };
  VE.thumb = (mid, t, step) => {
    const r = VE.rt.get(mid); if (!r || !r.blob) return null; const m = VE.media(mid);
    if (m.kind === 'image') { if (r.img) return r.img; if (!r.imgP) r.imgP = createImageBitmap(r.blob).then(b => { r.img = b; VE.emit('thumb'); }).catch(() => { }); return null; }
    if (m.noDecode) return null;
    const key = Math.floor(t / step) * step, got = r.thumbs.get(key);
    if (got && got !== 1) return got;
    if (!got) { r.thumbs.set(key, 1); thumbQ.push({ mid, key }); if (thumbQ.length > 60) { const o = thumbQ.shift(); const rr = VE.rt.get(o.mid); if (rr) rr.thumbs.delete(o.key); } pumpThumb(); }
    let near = null, best = 1e9; r.thumbs.forEach((v, k) => { if (v !== 1 && Math.abs(k - t) < best) { best = Math.abs(k - t); near = v; } });
    return near;
  };
  const firstT = async r => { if (r.first == null) { try { r.first = await r.vTrack.getFirstTimestamp(); } catch (e) { r.first = 0; } } return r.first; };
  async function pumpThumb() {
    if (thumbBusy) return; thumbBusy = true;
    try {
      const MB = await VE.mb();
      while (thumbQ.length) {
        const { mid, key } = thumbQ.pop(), r = VE.rt.get(mid); if (!r) continue;
        try {
          await openInput(mid); if (!r.vTrack) { r.thumbs.delete(key); continue; }
          if (!r.sink) { const h = 96, w = Math.max(2, Math.round(h * (r.vTrack.displayWidth / r.vTrack.displayHeight) / 2) * 2); r.sink = new MB.CanvasSink(r.vTrack, { width: w, height: h, fit: 'contain' }); }
          const got = await r.sink.getCanvas(Math.max(key, await firstT(r)));
          if (got) { r.thumbs.set(key, await createImageBitmap(got.canvas)); VE.emit('thumb'); } else r.thumbs.delete(key);
        } catch (e) { r.thumbs.delete(key); console.warn(e); }
        await new Promise(z => setTimeout(z));
      }
    } catch (e) { console.warn(e); } finally { thumbBusy = false; }
  }

  /* 16kHz 한 줄 소리 (자막용) */
  VE.readMono16k = async (mid, onProg) => {
    const MB = await VE.mb(), r = VE.rt.get(mid), m = VE.media(mid); await openInput(mid); if (!r.aTrack) return null;
    const out = new Float32Array(Math.ceil(m.dur * 16000) + 16000); const sink = new MB.AudioBufferSink(r.aTrack); let top = 0, last = 0;
    for await (const { buffer, timestamp } of sink.buffers()) {
      const sr = buffer.sampleRate, ch = buffer.numberOfChannels, n = buffer.length, a = buffer.getChannelData(0), b = ch > 1 ? buffer.getChannelData(1) : a;
      const o0 = Math.round(timestamp * 16000), len = Math.floor(n * 16000 / sr), ratio = sr / 16000;
      for (let i = 0; i < len; i++) {
        const s0 = Math.floor(i * ratio), s1 = Math.max(s0 + 1, Math.floor((i + 1) * ratio)); let s = 0; for (let j = s0; j < s1 && j < n; j++) s += a[j] + b[j];
        const k = o0 + i; if (k >= 0 && k < out.length) out[k] = s / ((s1 - s0) * 2);
      }
      top = Math.max(top, o0 + len);
      const now = performance.now(); if (now - last > 400) { last = now; if (onProg) onProg(Math.min(1, timestamp / m.dur)); await new Promise(z => setTimeout(z)); }
    }
    return out.subarray(0, top);
  };

  /* 프로젝트 열기 */
  VE.loadProject = async (p) => {
    if (VE.player) VE.player.pause();
    VE.rt.forEach(r => { if (r.url) URL.revokeObjectURL(r.url); Object.values(r.els || {}).forEach(e => { e.pause(); e.removeAttribute('src'); e.load(); e.remove(); }); });
    VE.rt = new Map(); VE.p = Object.assign(VE.newProject(), p); VE.sel = null; VE.clearHistory();
    for (const m of VE.p.media) {
      const blob = await VE.idb.get('blobs', m.id).catch(() => null);
      const r = { blob, url: blob ? URL.createObjectURL(blob) : '', els: {}, thumbs: new Map() }; VE.rt.set(m.id, r); m.offline = !blob;
      if (blob) { if (m.hasAudio && m.kind !== 'image') VE.computePeaks(m.id); VE.idb.get('cache', m.id + ':track').then(t => { if (t) { r.track = t; VE.emit('track', m.id); } }).catch(() => { }); }
    }
    VE.touch(true); VE.emit('media'); VE.emit('select'); VE.emit('project'); if (VE.fitTimeline) VE.fitTimeline(); if (VE.player) VE.player.seek(0);
  };
  VE.relink = async (mid, file) => { const r = VE.rt.get(mid), m = VE.media(mid); if (r.url) URL.revokeObjectURL(r.url); r.blob = file; r.url = URL.createObjectURL(file); r.inputP = null; r.sink = null; r.els = {}; r.thumbs = new Map(); r.peaks = null; m.offline = false; VE.idb.put('blobs', mid, file).catch(() => { }); if (m.hasAudio) VE.computePeaks(mid); VE.touch(); VE.emit('media'); };

  /* 재생용 요소 (미디어별 · 자리별 하나) */
  VE.el = (mid, slot) => {
    const r = VE.rt.get(mid), m = VE.media(mid); if (!r || !r.url) return null;
    if (r.els[slot]) return r.els[slot];
    const e = document.createElement(m.kind === 'audio' ? 'audio' : 'video'); e.preload = 'auto'; e.playsInline = true; e.setAttribute('playsinline', ''); e.src = r.url;
    if ('preservesPitch' in e) e.preservesPitch = true;
    e.addEventListener('seeked', () => VE.emit('frame')); e.addEventListener('loadeddata', () => VE.emit('frame'));
    const pool = $('vePool'); if (pool) pool.appendChild(e);
    return r.els[slot] = e;
  };
  /* 창 닫기: Esc 와 바깥 누르기로 닫히는 창 (닫을 수 없는 동안은 data-dismiss 단추를 두지 않음) */
  addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return; const bgs = document.querySelectorAll('.modal-bg'), top = bgs[bgs.length - 1]; if (!top) return;
    const x = top.querySelector('[data-dismiss]'); if (x) { ev.preventDefault(); ev.stopPropagation(); x.click(); }
  }, true);
  /* 바깥 누르기는 입력 칸이 없는 창만 (붙여넣은 토큰 · 이름을 실수로 잃지 않게) */
  document.addEventListener('pointerdown', ev => { const bg = ev.target; if (!bg.classList || !bg.classList.contains('modal-bg') || bg.querySelector('input:not([type=checkbox]), textarea')) return; const x = bg.querySelector('[data-dismiss]'); if (x) x.click(); });
  VE.download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); };
  /* 부품(영어)의 긴 오류문은 그대로 보이지 않게 쉬운 말로 */
  VE.niceErr = e => { const m = String(e && e.message || e || ''); if (/[가-힣]/.test(m) && m.length < 160) return m; return '처리 부품에서 오류가 났습니다. 다시 해 보고, 계속되면 PC 의 크롬·엣지에서 해 주세요.'; };
  VE.safeName = s => String(s || '영상').replace(/[\\/:*?"<>|]+/g, ' ').trim() || '영상';
})();
