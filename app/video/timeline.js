/* VIDEO — 타임라인 (캔버스)
   참고한 관례: IMG.LY 타임라인 글 — 선택한 클립은 굵은 파랑 테두리 + 바깥쪽 손잡이, 손잡이의 잡는 범위는 보이는 크기의 두 배,
   화면 안에 보이는 지점에만 달라붙기 + 점선 안내, 자르는 동안 따로 뜨는 시간 표시, 짧으면 '5초' 길면 '1:00' 인 눈금, 선택한 클립에 길이 표시.
   본 트랙은 자석 방식: 언제나 틈 없이 붙어 있고 끌면 순서가 바뀐다 (Final Cut · CapCut) */
'use strict';
(() => {
  const TL = VE.tl = { z: 40, sx: 0, snap: true, overlay: null };
  const GUT = 54, RULER = 26, HANDLE = 11, MIN_LEN = .1;
  let cv, c, W = 0, H = 0, dpr = 1, dirty = true, col = {}, lanes = [], drag = null, snapLine = null, dropAt = null, tip = null;
  /* 캔버스 글꼴에는 CSS 변수(var(--ui-font))를 쓸 수 없어 실제 글꼴 이름을 읽어 둔다 */
  let FF = 'sans-serif';
  const font = (w, px) => `${w} ${px}px ${FF}`;

  const readTokens = () => { const s = getComputedStyle(document.documentElement), v = k => s.getPropertyValue(k).trim(); FF = v('--ui-font') || 'sans-serif'; col = { bg: v('--ui-panel'), lane: v('--ui-bg'), line: v('--ui-border'), line2: v('--ui-border2'), fg: v('--ui-fg'), muted: v('--ui-muted'), accent: v('--ui-accent'), soft: v('--ui-accent-soft'), panel2: v('--ui-panel2'), ink: v('--ui-ink'), onInk: v('--ui-on-ink'), mark: v('--ui-mark'), dark: document.documentElement.dataset.theme === 'dark' }; dirty = true; };
  const xOf = t => GUT + t * TL.z - TL.sx, tOf = x => (x - GUT + TL.sx) / TL.z;
  const maxT = () => Math.max(VE.total(), ...VE.p.music.map(m => m.start + m.out - m.in), ...VE.p.titles.map(o => o.end), 0);
  const contentW = () => (maxT() + 3) * TL.z;
  const clampScroll = () => { const m = Math.max(0, contentW() - (W - GUT)); TL.sx = clamp(TL.sx, 0, m); };
  TL.request = () => { dirty = true; };

  VE.fitTimeline = () => { const t = maxT(); TL.z = t > 0 ? clamp((W - GUT - 40) / t, .02, 300) : 40; TL.sx = 0; syncZoomUI(); dirty = true; };
  TL.setZoom = (z, cx) => { const a = cx == null ? xOf(VE.player.t) : cx, t = tOf(a); TL.z = clamp(z, .02, 500); TL.sx = t * TL.z + GUT - a; clampScroll(); syncZoomUI(); dirty = true; };
  const syncZoomUI = () => { const s = VE.$('tlZoom'); if (s) s.value = Math.round(Math.log(TL.z / .02) / Math.log(500 / .02) * 100); };
  TL.zoomFromSlider = v => { TL.setZoom(.02 * Math.pow(500 / .02, v / 100)); };

  /* ---------- 줄 배치 ---------- */
  const layoutLanes = () => {
    const hasCap = VE.captions().length > 0 && VE.p.cap.on; let y = RULER + 4; lanes = [];
    const push = (k, label, h) => { lanes.push({ k, label, y, h }); y += h + 4; };
    push('title', '글자', 24); if (hasCap) push('cap', '자막', 20);
    const main = clamp(H - y - 4 - 38 - 12, 44, 104); push('main', '영상', main); push('music', '소리', 34);
  };
  const lane = k => { if (!lanes.length) { W = cv.clientWidth; H = cv.clientHeight; layoutLanes(); } return lanes.find(l => l.k === k); };

  /* ---------- 그리기 ---------- */
  const rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); };
  function ruler() {
    const steps = [.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1200, 1800, 3600]; let major = steps[steps.length - 1]; for (const s of steps) if (s * TL.z >= 72) { major = s; break; }
    const minor = major / (major === 2 || major === 10 || major === 60 || major === 600 ? 2 : 5), t0 = Math.floor(tOf(GUT) / minor) * minor, t1 = tOf(W);
    c.font = font(500, 11); c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = col.muted;
    for (let t = Math.max(0, t0); t <= t1; t += minor) {
      const x = xOf(t), isMajor = Math.abs(t / major - Math.round(t / major)) < 1e-6;
      if (isMajor) { const label = t < 60 ? Math.round(t * 10) / 10 + '초' : VE.fmtT(t); c.fillText(t === 0 ? '0' : label, x + 3, 12); c.fillRect(x, 3, 1, RULER - 8); }
      else { c.globalAlpha = .55; c.fillRect(x - .5, RULER - 7, 1.5, 1.5); c.globalAlpha = 1; }
    }
    c.fillStyle = col.line; c.fillRect(0, RULER, W, 1);
  }
  function drawWave(mid, x, y, w, h, sIn, sPer, fill, x0, x1) {
    const r = VE.rt.get(mid), pk = r && r.peaks; if (!pk) return;
    c.fillStyle = fill; const hz = VE.PEAK_HZ; const a = Math.max(x, x0), b = Math.min(x + w, x1), m = y + h;
    for (let px = a; px < b; px += 2) {
      const s0 = sIn + (px - x) * sPer, s1 = s0 + 2 * sPer; let v = 0; const i0 = Math.floor(s0 * hz), i1 = Math.max(i0 + 1, Math.ceil(s1 * hz)); const stepI = Math.max(1, Math.floor((i1 - i0) / 24));
      for (let i = i0; i < i1 && i < pk.length; i += stepI) if (pk[i] > v) v = pk[i];
      const bar = Math.min(h, Math.max(1, Math.sqrt(v) * h * 1.25)); c.fillRect(px, m - bar, 1.4, bar);
    }
  }
  function mainClips() {
    const L = lane('main'), { starts } = VE.layout(), x0 = GUT, x1 = W; const sel = VE.sel && VE.sel.type === 'clip' ? VE.sel.id : null;
    VE.p.clips.forEach((cl, i) => {
      let x = xOf(starts[i]); const w = VE.clipLen(cl) * TL.z; if (x + w < x0 - 20 || x > x1 + 20) return;
      const m = VE.media(cl.mid), y = L.y, h = L.h, sp = cl.speed || 1;
      c.save(); rr(x + .5, y, Math.max(1.5, w - 1), h, 6); c.fillStyle = col.panel2; c.fill(); c.clip();
      if (m && w > 6) {
        const aspect = m.w && m.h ? m.w / m.h : 16 / 9, cell = Math.max(24, h * aspect), step = VE.thumbStep(TL.z / sp, cell); const a = Math.max(x, x0), b = Math.min(x + w, x1);
        const startI = Math.floor((a - x) / cell);
        for (let k = startI; x + k * cell < b; k++) { const cx = x + k * cell, st = cl.in + k * cell / TL.z * sp; const th = VE.thumb(cl.mid, Math.min(st, Math.max(cl.in, cl.out - .05)), step); if (th) { const tw = th.width, tH = th.height, s = Math.max(cell / tw, h / tH); c.drawImage(th, cx + (cell - tw * s) / 2, y + (h - tH * s) / 2, tw * s, tH * s); } }
        if (m.hasAudio && m.kind !== 'image') { const bh = Math.min(26, h * .42); c.fillStyle = 'rgba(10,11,13,.58)'; c.fillRect(x, y + h - bh, w, bh); drawWave(cl.mid, x, y + h - bh + 1, w, bh - 2, cl.in, sp / TL.z, 'rgba(255,255,255,.82)', x0, x1); }
        /* 페이드 표시 */
        c.fillStyle = 'rgba(0,0,0,.42)';
        if (cl.fadeIn > 0) { const fw = cl.fadeIn * TL.z; c.beginPath(); c.moveTo(x, y); c.lineTo(x + fw, y); c.lineTo(x, y + h); c.fill(); }
        if (cl.fadeOut > 0) { const fw = cl.fadeOut * TL.z; c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + w - fw, y); c.lineTo(x + w, y + h); c.fill(); }
        /* 이름 · 표시 */
        if (w > 44) {
          c.font = font(500, 12); c.textBaseline = 'middle'; c.textAlign = 'left';
          let tag = ''; if (sel === cl.id) tag = VE.fmtLen(VE.clipLen(cl)); else if (w > 120 && m) tag = m.name;
          if (sp !== 1) tag = sp + '배 ' + tag; if (cl.face && cl.face.mode) tag = (cl.face.mode === 'mosaic' ? '모자이크 ' : '캐릭터 ') + tag; if (cl.pip) tag = '화면 속 화면 ' + tag;
          tag = tag.trim(); if (tag) { let t = tag; const maxW = w - 16; if (c.measureText(t).width > maxW - 8) { while (t.length > 2 && c.measureText(t + '…').width > maxW - 8) t = t.slice(0, -1); t += '…'; } const tw = c.measureText(t).width + 10; c.fillStyle = 'rgba(10,11,13,.68)'; rr(x + 4, y + 4, tw, 19, 4); c.fill(); c.fillStyle = '#fff'; c.fillText(t, x + 9, y + 14); }
        }
        if (m.offline) { c.globalAlpha = .4; c.fillStyle = col.mark; c.fillRect(x, y, w, h); c.globalAlpha = 1; } /* 원본이 없음: 경고(주황) */
      }
      c.restore();
    });
    /* 잘라 낼 구간 미리 표시 */
    if (TL.overlay && TL.overlay.length) {
      c.save(); rr(GUT, L.y, W - GUT, L.h, 0); c.clip();
      for (const r of TL.overlay) { const a = xOf(r[0]), w = (r[1] - r[0]) * TL.z; if (a + w < GUT || a > W) continue; c.fillStyle = 'rgba(217,45,32,.34)'; c.fillRect(a, L.y, Math.max(1, w), L.h); c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1; c.save(); c.beginPath(); c.rect(a, L.y, w, L.h); c.clip(); for (let hx = a - L.h; hx < a + w; hx += 7) { c.beginPath(); c.moveTo(hx, L.y + L.h); c.lineTo(hx + L.h, L.y); c.stroke(); } c.restore(); }
      c.restore();
    }
    if (sel) {
      const i = VE.p.clips.findIndex(o => o.id === sel); if (i >= 0) { const cl = VE.p.clips[i]; frameSel(xOf(starts[i]), L.y, VE.clipLen(cl) * TL.z, L.h); }
    }
  }
  function frameSel(x, y, w, h) {
    c.save(); c.lineWidth = 2.5; c.strokeStyle = col.accent; rr(x + .5, y - .5, Math.max(2, w - 1), h + 1, 6); c.stroke();
    for (const [hx, s] of [[x - HANDLE + 1, -1], [x + w - 1, 1]]) {
      c.fillStyle = col.accent; c.beginPath(); c.roundRect(hx, y - .5, HANDLE, h + 1, s < 0 ? [6, 0, 0, 6] : [0, 6, 6, 0]); c.fill();
      c.fillStyle = '#fff'; c.globalAlpha = .9; c.fillRect(hx + HANDLE / 2 - 1, y + h / 2 - 8, 2, 16); c.globalAlpha = 1;
    }
    c.restore();
  }
  function musicLane() {
    const L = lane('music'), sel = VE.sel && VE.sel.type === 'music' ? VE.sel.id : null;
    for (const o of VE.p.music) {
      const x = xOf(o.start), w = (o.out - o.in) * TL.z; if (x + w < GUT || x > W) continue;
      c.save(); rr(x + .5, L.y, Math.max(2, w - 1), L.h, 5); c.fillStyle = col.panel2; c.fill(); c.strokeStyle = col.line2; c.lineWidth = 1; c.stroke(); c.clip();
      drawWave(o.mid, x, L.y + 2, w, L.h - 4, o.in, 1 / TL.z, col.muted, GUT, W);
      if (w > 50) { const m = VE.media(o.mid); c.font = font(500, 12); c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = col.fg; c.fillText(sel === o.id ? VE.fmtLen(o.out - o.in) : (m ? m.name : ''), x + 8, L.y + 10); }
      c.restore();
      if (sel === o.id) frameSel(x, L.y, w, L.h);
    }
  }
  function titleLane() {
    const L = lane('title'), sel = VE.sel && VE.sel.type === 'title' ? VE.sel.id : null;
    for (const o of VE.p.titles) {
      const x = xOf(o.start), w = (o.end - o.start) * TL.z; if (x + w < GUT || x > W) continue;
      c.save(); rr(x + .5, L.y, Math.max(2, w - 1), L.h, 5); c.fillStyle = col.ink; c.fill(); c.clip();
      c.font = font(500, 12); c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = col.onInk; c.fillText(String(o.text).split('\n')[0], x + 8, L.y + L.h / 2 + .5); c.restore();
      if (sel === o.id) frameSel(x, L.y, w, L.h);
    }
  }
  function capLane() {
    const L = lane('cap'); if (!L) return; c.font = font(500, 11); c.textBaseline = 'middle'; c.textAlign = 'left';
    const t0 = tOf(GUT), t1 = tOf(W);
    for (const o of VE.captions()) {
      if (o.showEnd < t0 || o.start > t1) continue; const x = xOf(o.start), w = (o.showEnd - o.start) * TL.z;
      c.save(); rr(x + .5, L.y, Math.max(2, w - 1), L.h, 4); c.fillStyle = col.soft; c.fill(); if (w > 22) { c.clip(); c.fillStyle = col.fg; c.fillText(o.text, x + 5, L.y + L.h / 2 + .5); } c.restore();
    }
  }
  function draw() {
    const nw = cv.clientWidth, nh = cv.clientHeight; dpr = window.devicePixelRatio || 1;
    if (nw !== W || nh !== H || cv.width !== Math.round(nw * dpr)) { W = nw; H = nh; cv.width = Math.round(nw * dpr); cv.height = Math.round(nh * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); layoutLanes(); clampScroll();
    c.fillStyle = col.bg; c.fillRect(0, 0, W, H);
    c.save(); c.beginPath(); c.rect(GUT, 0, W - GUT, H); c.clip();
    ruler();
    for (const L of lanes) { c.fillStyle = col.lane; c.fillRect(GUT, L.y, W - GUT, L.h); }
    /* 빈 상태 */
    if (!VE.p.clips.length) { const L = lane('main'); c.font = font(400, 13); c.fillStyle = col.muted; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('영상 파일을 여기로 끌어다 놓으세요', GUT + 14, L.y + L.h / 2); }
    capLane(); titleLane(); musicLane(); mainClips();
    markRange();
    if (drag && drag.kind === 'reorder' && drag.moved) reorderGhost();
    if (dropAt != null) { const L = lane('main'), x = xOf(dropAt); c.fillStyle = col.accent; c.fillRect(x - 1.5, L.y - 3, 3, L.h + 6); }
    if (snapLine != null) { const x = xOf(snapLine); c.save(); c.strokeStyle = col.accent; c.setLineDash([3, 3]); c.lineWidth = 1; c.beginPath(); c.moveTo(x + .5, RULER); c.lineTo(x + .5, H); c.stroke(); c.restore(); }
    playhead();
    c.restore();
    gutter(); scrollbar();
    if (tip) drawTip();
  }
  function reorderGhost() {
    const L = lane('main'), d = drag, w = Math.min(160, VE.clipLen(d.clip) * TL.z); c.save(); c.globalAlpha = .85; rr(d.px - w / 2, L.y - 3, w, L.h + 6, 6); c.fillStyle = col.accent; c.fill(); c.globalAlpha = 1; c.fillStyle = '#fff'; c.font = font(600, 12); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(VE.fmtLen(VE.clipLen(d.clip)), d.px, L.y + L.h / 2); c.restore();
    const { starts, total } = VE.layout(), t = d.insert >= VE.p.clips.length ? total : starts[d.insert]; const x = xOf(t); c.fillStyle = col.accent; c.fillRect(x - 1.5, L.y - 5, 3, L.h + 10);
  }
  /* I · O 로 표시한 구간 (Premiere · Resolve 의 시작 · 끝 표시) */
  function markRange() {
    const mk = VE.mark; if (!mk || (mk.i == null && mk.o == null)) return;
    const a = mk.i == null ? 0 : mk.i, b = mk.o == null ? VE.total() : mk.o; const x0 = xOf(a), x1 = xOf(b);
    c.save(); c.globalAlpha = .12; c.fillStyle = col.accent; c.fillRect(x0, RULER, Math.max(1, x1 - x0), H - RULER); c.globalAlpha = .55; c.fillRect(x0, 0, Math.max(1, x1 - x0), RULER); c.globalAlpha = 1;
    c.font = font(700, 11); c.textBaseline = 'top'; c.fillStyle = col.accent;
    if (mk.i != null) { c.fillRect(x0 - 1, 0, 2, H); c.textAlign = 'left'; c.fillText('I', x0 + 3, 2); }
    if (mk.o != null) { c.fillRect(x1 - 1, 0, 2, H); c.textAlign = 'right'; c.fillText('O', x1 - 3, 2); }
    c.restore();
  }
  function playhead() {
    const x = xOf(VE.player.t); if (x < GUT - 8 || x > W + 8) return;
    c.fillStyle = col.accent; c.fillRect(x - .75, 6, 1.5, H - 6); c.beginPath(); c.moveTo(x - 6, 2); c.lineTo(x + 6, 2); c.lineTo(x + 6, 10); c.lineTo(x, 16); c.lineTo(x - 6, 10); c.closePath(); c.fill();
  }
  function gutter() {
    c.fillStyle = col.bg; c.fillRect(0, 0, GUT, H); c.fillStyle = col.line; c.fillRect(GUT - 1, 0, 1, H);
    c.font = font(500, 12); c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = col.muted;
    for (const L of lanes) c.fillText(L.label, 12, L.y + L.h / 2 + .5);
  }
  function scrollbar() {
    const total = contentW(), vis = W - GUT; if (total <= vis + 2) return; const y = H - 8, w = Math.max(40, vis * vis / total), x = GUT + (TL.sx / (total - vis)) * (vis - w);
    c.fillStyle = col.line2; rr(x, y, w, 5, 2.5); c.fill();
  }
  function drawTip() { c.font = font(600, 12); const w = c.measureText(tip.text).width + 16, x = clamp(tip.x - w / 2, 4, W - w - 4), y = Math.max(2, tip.y - 28); c.fillStyle = col.ink; rr(x, y, w, 22, 5); c.fill(); c.fillStyle = col.onInk; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(tip.text, x + 8, y + 11.5); }

  /* ---------- 고르기 판단 ---------- */
  function hit(x, y) {
    if (y < RULER) return { zone: 'ruler' };
    const sel = VE.selObj(), sx = VE.sel;
    /* 선택한 것의 손잡이가 먼저 (잡는 범위 = 보이는 크기의 2배) */
    if (sel) {
      let a, b, L;
      if (sx.type === 'clip') { a = xOf(VE.startOf(sel.id)); b = a + VE.clipLen(sel) * TL.z; L = lane('main'); }
      else if (sx.type === 'music') { a = xOf(sel.start); b = a + (sel.out - sel.in) * TL.z; L = lane('music'); }
      else { a = xOf(sel.start); b = xOf(sel.end); L = lane('title'); }
      if (y >= L.y - 4 && y <= L.y + L.h + 4) { const g = HANDLE * 1.4; if (x >= a - g && x <= a + 4) return { zone: 'trimL', type: sx.type, o: sel }; if (x >= b - 4 && x <= b + g) return { zone: 'trimR', type: sx.type, o: sel }; }
    }
    for (const L of lanes) if (y >= L.y && y <= L.y + L.h) {
      const t = tOf(x);
      if (L.k === 'main') { const at = VE.at(t); if (at && t >= 0 && t <= VE.total()) return { zone: 'clip', type: 'clip', o: at.clip, i: at.i }; }
      if (L.k === 'music') { const o = VE.p.music.find(m => t >= m.start && t <= m.start + m.out - m.in); if (o) return { zone: 'item', type: 'music', o }; }
      if (L.k === 'title') { const o = VE.p.titles.slice().reverse().find(m => t >= m.start && t <= m.end); if (o) return { zone: 'item', type: 'title', o }; }
      if (L.k === 'cap') { const o = VE.capAt(t); if (o) return { zone: 'cap', cap: o }; }
      return { zone: 'empty' };
    }
    return { zone: 'empty' };
  }
  /* 달라붙을 자리: 화면에 보이는 것만 */
  function snapPoints(skip) {
    if (!TL.snap) return []; const pts = [0, VE.player.t, VE.total()], { starts } = VE.layout(); starts.forEach(s => pts.push(s));
    for (const o of VE.p.titles) if (o !== skip) pts.push(o.start, o.end); for (const o of VE.p.music) if (o !== skip) pts.push(o.start, o.start + o.out - o.in);
    const a = tOf(GUT), b = tOf(W); return pts.filter(p => p >= a && p <= b);
  }
  function snapTo(t, skip) { const pts = snapPoints(skip), r = 8 / TL.z; let best = null, d = r; for (const p of pts) { const k = Math.abs(p - t); if (k < d) { d = k; best = p; } } snapLine = best; return best == null ? t : best; }

  /* ---------- 조작 ---------- */
  const pts = new Map(); let pinch = null;
  const pos = ev => { const r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
  function down(ev) {
    const p = pos(ev); pts.set(ev.pointerId, p); cv.setPointerCapture(ev.pointerId);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: TL.z, cx: (a.x + b.x) / 2, sx: TL.sx }; drag = null; return; }
    if (p.y > H - 10 && contentW() > W - GUT) { drag = { kind: 'scroll', x0: p.x, s0: TL.sx }; return; }
    const h = hit(p.x, p.y), touch = ev.pointerType === 'touch';
    if (h.zone === 'ruler') { drag = { kind: 'scrub' }; VE.player.seek(snapTo(tOf(p.x))); dirty = true; return; }
    if (h.zone === 'trimL' || h.zone === 'trimR') {
      VE.snap(); drag = { kind: h.zone, type: h.type, o: h.o, x0: p.x, in0: h.o.in, out0: h.o.out, start0: h.o.start, end0: h.o.end, was: VE.player.t };
      if (VE.player.playing) VE.player.pause(); return;
    }
    if (h.zone === 'clip') {
      const already = VE.sel && VE.sel.id === h.o.id; VE.select({ type: 'clip', id: h.o.id });
      if (touch && !already) { drag = { kind: 'pan', x0: p.x, s0: TL.sx, tap: { x: p.x } }; return; }
      drag = { kind: 'reorder', clip: h.o, x0: p.x, px: p.x, moved: false, insert: h.i, from: h.i, tap: { x: p.x } }; dirty = true; return;
    }
    if (h.zone === 'item') {
      const already = VE.sel && VE.sel.id === h.o.id; VE.select({ type: h.type, id: h.o.id });
      if (touch && !already) { drag = { kind: 'pan', x0: p.x, s0: TL.sx, tap: { x: p.x } }; return; }
      drag = { kind: 'moveItem', type: h.type, o: h.o, x0: p.x, start0: h.o.start, end0: h.o.end, moved: false }; dirty = true; return;
    }
    if (h.zone === 'cap') { VE.player.seek(h.cap.start); return; }
    if (touch) { drag = { kind: 'pan', x0: p.x, s0: TL.sx, tap: { x: p.x, clear: true } }; return; }
    VE.select(null); drag = { kind: 'scrub' }; VE.player.seek(snapTo(tOf(p.x))); dirty = true;
  }
  function move(ev) {
    const p = pos(ev); if (pts.has(ev.pointerId)) pts.set(ev.pointerId, p);
    if (pinch && pts.size >= 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, cx = (a.x + b.x) / 2, t = (pinch.cx - GUT + pinch.sx) / pinch.z; TL.z = clamp(pinch.z * d / pinch.d, .02, 500); TL.sx = t * TL.z + GUT - cx; clampScroll(); syncZoomUI(); dirty = true; return; }
    if (!drag) { const h = hit(p.x, p.y); const cur = h.zone === 'trimL' || h.zone === 'trimR' ? 'ew-resize' : h.zone === 'clip' || h.zone === 'item' ? 'grab' : h.zone === 'ruler' ? 'col-resize' : 'default'; if (cv.style.cursor !== cur) cv.style.cursor = cur; return; }
    const dx = p.x - (drag.x0 || 0), dt = dx / TL.z;
    switch (drag.kind) {
      case 'scroll': { const vis = W - GUT, total = contentW(), w = Math.max(40, vis * vis / total); TL.sx = clamp(drag.s0 + dx * (total - vis) / Math.max(1, vis - w), 0, total - vis); break; }
      case 'pan': if (Math.abs(dx) > 5) drag.tap = null; TL.sx = drag.s0 - dx; clampScroll(); break;
      case 'scrub': { VE.player.seek(snapTo(clamp(tOf(p.x), 0, VE.total()))); autoEdge(p.x); break; }
      case 'trimL': case 'trimR': trimDrag(p, dt); break;
      case 'reorder': {
        if (Math.abs(dx) > 5) drag.moved = true; if (!drag.moved) break; drag.px = p.x; autoEdge(p.x);
        const { starts } = VE.layout(), n = VE.p.clips.length, t = tOf(p.x); let ins = n; for (let i = 0; i < n; i++) { if (t < starts[i] + VE.clipLen(VE.p.clips[i]) / 2) { ins = i; break; } } drag.insert = ins; break;
      }
      case 'moveItem': {
        if (Math.abs(dx) > 3) { if (!drag.moved) { VE.snap(); drag.moved = true; } } if (!drag.moved) break; const o = drag.o, len = drag.type === 'music' ? o.out - o.in : drag.end0 - drag.start0;
        let s = Math.max(0, drag.start0 + dt); const a = snapTo(s, o), b = snapTo(s + len, o); if (a !== s) s = a; else if (b !== s + len) s = b - len; else snapLine = null; s = Math.max(0, s);
        o.start = s; if (drag.type === 'title') o.end = s + len; VE.touch(true); tip = { x: xOf(s), y: lane(drag.type === 'music' ? 'music' : 'title').y, text: VE.fmtT(s, true) }; break;
      }
    }
    dirty = true;
  }
  function trimDrag(p, dt) {
    const d = drag, o = d.o;
    if (d.type === 'clip') {
      const sp = o.speed || 1, m = VE.media(o.mid), dur = m && m.kind === 'image' ? 36000 : (m ? m.dur : o.out), start = VE.startOf(o.id);
      if (d.kind === 'trimL') {
        let nin = clamp(d.in0 + dt * sp, 0, o.out - MIN_LEN);
        if (TL.snap) { const ph = VE.player.t; if (d.was >= start && d.was <= start + (d.out0 - d.in0) / sp) { const src = d.in0 + (d.was - start) * sp; if (Math.abs(src - nin) < 8 / TL.z * sp) { nin = src; snapLine = start; } else snapLine = null; } }
        o.in = nin; VE.player.setTrimPreview({ id: o.id, src: nin }); tip = { x: xOf(start), y: lane('main').y, text: VE.fmtT(nin, true) + ' 부터' };
      } else {
        let t = start + (clamp(d.out0 + dt * sp, o.in + MIN_LEN, dur) - o.in) / sp; const others = VE.player.t; if (TL.snap && Math.abs(t - others) < 8 / TL.z) { t = others; snapLine = others; } else snapLine = null;
        const nout = clamp(o.in + (t - start) * sp, o.in + MIN_LEN, dur); o.out = nout; VE.player.setTrimPreview({ id: o.id, src: Math.max(o.in, nout - .01) }); tip = { x: xOf(start) + (nout - o.in) / sp * TL.z, y: lane('main').y, text: VE.fmtT(nout, true) + ' 까지' };
      }
      VE.touch(true); autoEdge(p.x);
    } else if (d.type === 'music') {
      const m = VE.media(o.mid);
      if (d.kind === 'trimL') { const delta = clamp(dt, -d.in0, d.out0 - d.in0 - MIN_LEN); let s = snapTo(d.start0 + delta, o); const dd = clamp(s - d.start0, -d.in0, d.out0 - d.in0 - MIN_LEN); o.start = d.start0 + dd; o.in = d.in0 + dd; }
      else { let e = snapTo(d.start0 + (d.out0 - d.in0) + dt, o); o.out = clamp(d.in0 + (e - d.start0), d.in0 + MIN_LEN, m ? m.dur : d.out0); }
      VE.touch(true);
    } else {
      if (d.kind === 'trimL') o.start = clamp(snapTo(d.start0 + dt, o), 0, o.end - .2); else o.end = Math.max(o.start + .2, snapTo(d.end0 + dt, o));
      VE.touch(true); tip = { x: xOf(d.kind === 'trimL' ? o.start : o.end), y: lane('title').y, text: VE.fmtLen(o.end - o.start) };
    }
  }
  const autoEdge = (x) => { if (x > W - 28) TL.sx += 12; else if (x < GUT + 28) TL.sx -= 12; clampScroll(); };
  function up(ev) {
    const p = pos(ev); pts.delete(ev.pointerId); if (pts.size < 2) pinch = null;
    const d = drag; drag = null; snapLine = null; tip = null; dirty = true; if (!d) return;
    VE.player.setTrimPreview(null);
    if (d.kind === 'pan' && d.tap) { if (d.tap.clear) VE.select(null); VE.player.seek(clamp(tOf(d.tap.x), 0, VE.total())); return; }
    if (d.kind === 'reorder') {
      if (!d.moved) { VE.player.seek(clamp(tOf(p.x), 0, VE.total())); return; }
      let to = d.insert; if (to > d.from) to--; if (to !== d.from) VE.edit(() => { const [o] = VE.p.clips.splice(d.from, 1); VE.p.clips.splice(to, 0, o); });
      return;
    }
    if (d.kind === 'moveItem') { if (d.moved) VE.touch(); else VE.player.seek(clamp(tOf(p.x), 0, VE.total())); return; }
    if (d.kind === 'trimL' || d.kind === 'trimR') { if (d.type === 'clip') VE.player.seek(clamp(d.was, 0, VE.total())); VE.touch(); VE.emit('select'); }
  }
  function wheel(ev) {
    ev.preventDefault(); const p = pos(ev);
    if (ev.ctrlKey || ev.metaKey) { TL.setZoom(TL.z * Math.exp(-ev.deltaY * .0022), p.x); return; }
    const d = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY; TL.sx += d; clampScroll(); dirty = true;
  }
  /* 미디어 목록에서 끌어 넣기 */
  function dragOver(ev) {
    const has = ev.dataTransfer.types.includes('text/ve-media'); if (!has) return; ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy';
    const p = pos(ev), t = tOf(p.x), { starts, total } = VE.layout(); let at = total; for (let i = 0; i < starts.length; i++) if (t < starts[i] + VE.clipLen(VE.p.clips[i]) / 2) { at = starts[i]; break; } dropAt = at; dirty = true;
  }
  function drop(ev) {
    const mid = ev.dataTransfer.getData('text/ve-media'); if (!mid) return; ev.preventDefault(); const p = pos(ev), t = tOf(p.x), { starts } = VE.layout(); dropAt = null;
    const m = VE.media(mid); if (m && m.kind === 'audio') { VE.addMusic(mid, Math.max(0, t)); return; }
    let idx = VE.p.clips.length; for (let i = 0; i < starts.length; i++) if (t < starts[i] + VE.clipLen(VE.p.clips[i]) / 2) { idx = i; break; } VE.addClip(mid, idx);
  }

  /* ---------- 재생 중 따라가기 ---------- */
  function follow() { if (!VE.player.playing || drag) return; const x = xOf(VE.player.t); if (x > W - 40) { TL.sx += W - GUT - 80; clampScroll(); } else if (x < GUT) { TL.sx = Math.max(0, VE.player.t * TL.z - 40); } }
  function loop() { requestAnimationFrame(loop); if (dirty) { dirty = false; follow(); draw(); } }

  TL.init = () => {
    cv = VE.$('tlCanvas'); c = cv.getContext('2d'); readTokens();
    new MutationObserver(readTokens).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    new ResizeObserver(() => { dirty = true; }).observe(cv);
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', wheel, { passive: false }); cv.addEventListener('dragover', dragOver); cv.addEventListener('dragleave', () => { dropAt = null; dirty = true; }); cv.addEventListener('drop', drop);
    for (const k of ['change', 'select', 'time', 'thumb', 'peaks', 'track']) VE.on(k, () => { dirty = true; });
    if (document.fonts) document.fonts.ready.then(() => { dirty = true; });
    W = cv.clientWidth; H = cv.clientHeight; requestAnimationFrame(loop);
  };
})();
