/* 영상 — 미리보기 재생
   장면마다 <video> 를 두 개씩 준비해 두고 다음 장면을 미리 찾아 둔 뒤 넘어가므로 컷 사이가 끊기지 않는다 */
'use strict';
(() => {
  const P = VE.player = { t: 0, playing: false };
  let cv = null, ctx = null, active = null, next = null, lastNow = 0, dirty = true, audio = null, trimPreview = null;

  /* ---------- 소리 연결 ---------- */
  async function ensureAudio() {
    if (audio) { if (audio.ctx.state === 'suspended') await audio.ctx.resume().catch(() => { }); return audio; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    const c = new AC({ latencyHint: 'interactive' }); const bus = c.createGain(), master = c.createGain(), musicBus = c.createGain();
    audio = { ctx: c, bus, master, musicBus, node: null, wired: new WeakMap() };
    bus.connect(master); musicBus.connect(master); master.connect(c.destination); master.gain.value = P.muted ? 0 : 1;
    if (c.audioWorklet) {
      try { await c.audioWorklet.addModule('app/video/dsp.js'); const n = new AudioWorkletNode(c, 've-voice', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); audio.node = n; n.port.postMessage(VE.p.voice); bus.disconnect(); bus.connect(n); n.connect(master); }
      catch (e) { console.warn('음성 처리 부품 시작 실패', e); }
    }
    if (c.state === 'suspended') await c.resume().catch(() => { });
    return audio;
  }
  P._audio = () => audio; /* 점검용 */
  P.muted = false;
  P.setMuted = v => { P.muted = !!v; if (audio) audio.master.gain.value = P.muted ? 0 : 1; VE.emit('mute'); };
  P.voiceChanged = () => { if (audio && audio.node) audio.node.port.postMessage(VE.p.voice); };
  function wire(el, music) {
    if (!audio) return null; let g = audio.wired.get(el);
    if (!g) { try { const s = audio.ctx.createMediaElementSource(el); g = audio.ctx.createGain(); s.connect(g); g.connect(music ? audio.musicBus : audio.bus); audio.wired.set(el, g); } catch (e) { console.warn(e); return null; } }
    return g;
  }

  /* AI 목소리로 바꾼 장면은 원래 소리를 끈다 */
  const dubbed = c => !!(VE.dub && c && VE.dub.active(c.mid));

  /* ---------- 요소 고르기 ---------- */
  const isTimed = c => { const m = VE.media(c.mid); return m && m.kind !== 'image'; };
  const pickEl = (c, avoid) => { const a = VE.el(c.mid, 'a'); if (a && a !== avoid) return a; return VE.el(c.mid, 'b'); };
  function imgOf(c) { const r = VE.rt.get(c.mid); if (!r) return null; if (r.img) return r.img; if (!r.imgP && r.blob) r.imgP = createImageBitmap(r.blob).then(b => { r.img = b; VE.emit('frame'); }).catch(() => { }); return null; }
  function bind(at) {
    const c = at.clip; const el = isTimed(c) ? (active && active.clip.mid === c.mid && active.el ? active.el : pickEl(c)) : null;
    return { clip: c, i: at.i, start: at.start, el };
  }
  const seekEl = (el, s) => { if (el && Math.abs(el.currentTime - s) > .012) { try { el.currentTime = s; } catch (e) { } } };

  P.seek = (t, opts) => {
    P.t = clamp(t, 0, VE.total()); const at = VE.at(P.t); if (VE.dub) VE.dub.stopAll();
    if (!at) { active = next = null; dirty = true; VE.emit('time'); return; }
    if (active && active.el && (!active.clip || active.clip.id !== at.clip.id) && P.playing) active.el.pause();
    active = bind(at); next = null;
    if (active.el) { seekEl(active.el, at.src); active.el.playbackRate = at.clip.speed || 1; if (P.playing) active.el.play().catch(() => { }); }
    dirty = true; VE.emit('time');
  };
  P.play = async () => {
    if (!VE.p.clips.length) return; await ensureAudio();
    if (P.t >= VE.total() - .02) P.t = 0;
    const at = VE.at(P.t); active = bind(at); next = null; P.playing = true; lastNow = performance.now();
    if (VE.dub) VE.dub.stopAll();
    if (active.el) { const g = wire(active.el); if (g) g.gain.value = dubbed(at.clip) ? 0 : VE.mixFade(at.clip, P.t - at.start, VE.clipLen(at.clip)); seekEl(active.el, at.src); active.el.playbackRate = at.clip.speed || 1; try { await active.el.play(); } catch (e) { console.warn(e); } }
    VE.emit('playstate');
  };
  P.pause = () => {
    P.playing = false; if (active && active.el) active.el.pause(); if (next && next.el) next.el.pause(); stopSide(); if (VE.dub) VE.dub.stopAll(); dirty = true; VE.emit('playstate');
  };
  P.toggle = () => P.playing ? P.pause() : P.play();
  P.setTrimPreview = v => { trimPreview = v; dirty = true; };
  P.invalidate = () => { dirty = true; };

  function stopSide() { for (const m of VE.p.music) { const e = VE.rt.get(m.mid) && VE.rt.get(m.mid).els['m' + m.id]; if (e) e.pause(); } VE.p.clips.forEach(c => { if (c.pip) { const r = VE.rt.get(c.pip.mid), e = r && r.els.p; if (e) e.pause(); } }); }
  function syncMusic() {
    for (const m of VE.p.music) {
      const dur = m.out - m.in, local = P.t - m.start, inside = local >= 0 && local < dur;
      const r = VE.rt.get(m.mid), e = inside && P.playing ? VE.el(m.mid, 'm' + m.id) : r && r.els['m' + m.id]; if (!e) continue;
      if (!inside || !P.playing) { if (!e.paused) e.pause(); continue; }
      const g = wire(e, true); if (g) g.gain.value = VE.mixFade(m, local, dur);
      const want = m.in + local; if (Math.abs(e.currentTime - want) > .25) e.currentTime = want; if (e.paused) e.play().catch(() => { });
    }
  }
  function syncPip(c, src) {
    const pip = c && c.pip; if (!pip) return null; const e = VE.el(pip.mid, 'p'); if (!e) return null; e.muted = true;
    const want = src + (pip.off || 0), m = VE.media(pip.mid); const inside = want >= 0 && want <= m.dur;
    if (!inside) { if (!e.paused) e.pause(); return null; }
    if (P.playing) { e.playbackRate = c.speed || 1; if (Math.abs(e.currentTime - want) > .18) e.currentTime = want; if (e.paused) e.play().catch(() => { }); }
    else { if (!e.paused) e.pause(); seekEl(e, want); }
    return e.readyState >= 2 ? { frame: e, fw: e.videoWidth, fh: e.videoHeight, src: want } : null;
  }

  /* ---------- 다음 장면 준비 + 넘어가기 ---------- */
  function prepareNext() {
    if (next || !active) return; const c = VE.p.clips[active.i + 1]; if (!c) return;
    const el = isTimed(c) ? pickEl(c, active.el) : null; next = { clip: c, i: active.i + 1, start: active.start + VE.clipLen(active.clip), el };
    if (el) { el.pause(); seekEl(el, c.in); el.playbackRate = c.speed || 1; }
  }
  function advance() {
    if (!active) return; const old = active;
    if (!next) prepareNext();
    if (!next) { P.pause(); P.t = VE.total(); dirty = true; VE.emit('time'); return; }
    active = next; next = null; if (old.el && old.el !== active.el) old.el.pause();
    if (active.el) { if (old.el === active.el) seekEl(active.el, active.clip.in); active.el.play().catch(() => { }); }
    P.t = active.start; lastNow = performance.now();
  }

  /* ---------- 매 프레임 ---------- */
  /* 화면이 가려지면 브라우저가 프레임 호출을 멈추므로 타이머로 이어 간다 (소리와 컷 넘김이 끊기지 않게) */
  let lastRaf = 0;
  function raf(now) { requestAnimationFrame(raf); lastRaf = performance.now(); tick(now); }
  function tick(now) {
    if (P.playing && active) {
      const c = active.clip, sp = c.speed || 1, end = active.start + VE.clipLen(c);
      let nt = P.t;
      if (active.el) { if (!active.el.seeking && active.el.readyState >= 2) nt = active.start + (active.el.currentTime - c.in) / sp; }
      else nt = P.t + (now - lastNow) / 1000;
      lastNow = now; nt = Math.max(nt, active.start);
      if (end - nt < 1.2) prepareNext();
      if (nt >= end - .015 || (active.el && active.el.ended)) { advance(); nt = P.t; }
      if (nt !== P.t) { P.t = nt; } dirty = true;
      VE.emit('time');
      /* 소리 크기 · 페이드 */
      if (P.playing && active.el && audio) { const g = wire(active.el); if (g) { const cc = active.clip, local = (P.t - active.start); g.gain.value = active.el.muted || dubbed(cc) ? 0 : VE.mixFade(cc, local, VE.clipLen(cc)); } if (next && next.el && next.el !== active.el) { const ng = wire(next.el); if (ng) ng.gain.value = 0; } }
      syncMusic();
      if (VE.dub) VE.dub.sync(audio, P.playing && active ? { clip: active.clip, src: active.el ? active.el.currentTime : active.clip.in + (P.t - active.start) * (active.clip.speed || 1) } : null);
    }
    if (dirty) { dirty = false; P.draw(); }
  }

  /* ---------- 그리기 ---------- */
  P.size = () => { const [w, h] = VE.frameSize(720); return [w, h]; };
  P.draw = () => {
    if (!cv) return; const [W, H] = P.size(); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; layoutStage(); }
    if (!VE.p.clips.length) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return; }
    let t = P.t, at = active && t >= active.start - 1e-6 && t <= active.start + VE.clipLen(active.clip) + .05 && VE.clip(active.clip.id) ? { clip: active.clip, start: active.start, src: Math.min(active.clip.out, active.clip.in + (t - active.start) * (active.clip.speed || 1)) } : null;
    if (!at) { P.seek(t); at = VE.at(P.t); if (!at) return; }
    let clip = at.clip, src = at.src, frame = null, fw = 0, fh = 0;
    const m = VE.media(clip.mid);
    if (trimPreview && VE.clip(trimPreview.id)) { /* 자르는 동안: 자르는 지점의 장면을 보여 줌 */
      clip = VE.clip(trimPreview.id); src = trimPreview.src; const el = isTimed(clip) ? VE.el(clip.mid, 'a') : null; if (el) { seekEl(el, src); if (el.readyState >= 2) { frame = el; fw = el.videoWidth; fh = el.videoHeight; } }
    } else if (m && m.kind === 'image') { const b = imgOf(clip); if (b) { frame = b; fw = b.width; fh = b.height; } }
    else if (active && active.el && active.el.readyState >= 2) { frame = active.el; fw = active.el.videoWidth; fh = active.el.videoHeight; }
    const pip = syncPip(clip, src);
    VE.drawFrame(ctx, W, H, { t: P.t, clip, media: m, src, frame, fw, fh, pip });
    drawGuides();
  };
  function drawGuides() {
    const s = VE.sel, o = VE.selObj(); if (!s || !o || s.type !== 'title' || P.t < o.start || P.t >= o.end) return;
    const [W, H] = P.size(), b = VE.titleBox(ctx, W, H, o); ctx.save(); ctx.strokeStyle = '#7aa2ff'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.strokeRect(b.x - 8, b.y - 6, b.w + 16, b.h + 12); ctx.restore();
  }

  /* 화면에 맞추기 */
  function layoutStage() {
    const box = VE.$('veStage'); if (!box || !cv) return; const pad = 0, bw = box.clientWidth - pad * 2, bh = box.clientHeight - pad * 2; if (bw <= 0 || bh <= 0) return;
    const k = Math.min(bw / cv.width, bh / cv.height); cv.style.width = Math.floor(cv.width * k) + 'px'; cv.style.height = Math.floor(cv.height * k) + 'px';
  }
  P.layoutStage = layoutStage;

  /* 미리보기 위에서 글자 · 영상 위치를 끌어 옮기기 */
  function bindDrag() {
    let drag = null;
    const pos = ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height }; };
    /* 미리보기를 짧게 누르면 재생 · 멈춤, 글자나 확대한 영상은 끌어 옮김 (움직였을 때만 되돌리기 기록) */
    cv.addEventListener('pointerdown', ev => {
      const [W, H] = P.size(), p = pos(ev), x = p.x * W, y = p.y * H;
      const hit = VE.p.titles.filter(o => P.t >= o.start && P.t < o.end).reverse().find(o => { const b = VE.titleBox(ctx, W, H, o); return x >= b.x - 12 && x <= b.x + b.w + 12 && y >= b.y - 10 && y <= b.y + b.h + 10; });
      const tap = { t0: performance.now(), cx: ev.clientX, cy: ev.clientY };
      if (hit) { VE.select({ type: 'title', id: hit.id }); drag = { kind: 'title', o: hit, sx: p.x, sy: p.y, ox: hit.x, oy: hit.y, tap }; }
      else { const at = VE.at(P.t); if (!at) return; const c = at.clip; VE.select({ type: 'clip', id: c.id }); drag = c.fit === 'fill' || (c.zoom || 1) > 1 ? { kind: 'clip', o: c, sx: p.x, sy: p.y, ox: c.px || 0, oy: c.py || 0, tap } : { kind: 'none', tap }; }
      cv.setPointerCapture(ev.pointerId); ev.preventDefault();
    });
    cv.addEventListener('pointermove', ev => {
      if (!drag) return; if (Math.hypot(ev.clientX - drag.tap.cx, ev.clientY - drag.tap.cy) > 6) drag.moved = true;
      if (drag.kind === 'none' || !drag.moved) return; if (!drag.snapped) { VE.snap(); drag.snapped = true; }
      const p = pos(ev), dx = p.x - drag.sx, dy = p.y - drag.sy;
      if (drag.kind === 'title') { drag.o.x = clamp(drag.ox + dx, .02, .98); drag.o.y = clamp(drag.oy + dy, .03, .97); }
      else { drag.o.px = drag.ox + dx; drag.o.py = drag.oy + dy; }
      VE.touch(true);
    });
    const up = (ev) => {
      if (!drag) return; const d = drag; drag = null;
      if (d.snapped) { VE.saveSoon(); VE.emit('select'); }
      else if (ev.type === 'pointerup' && !d.moved && d.kind !== 'title' && performance.now() - d.tap.t0 < 400) P.toggle();
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('dblclick', ev => { ev.preventDefault(); if (VE.toggleFull) VE.toggleFull(); });
  }

  P.init = () => {
    cv = VE.$('veCanvas'); ctx = cv.getContext('2d', { alpha: false }); bindDrag();
    const ro = new ResizeObserver(layoutStage); ro.observe(VE.$('veStage'));
    VE.on('frame', () => { dirty = true; });
    VE.on('change', () => {
      if (P.t > VE.total()) P.t = VE.total();
      if (active && !VE.clip(active.clip.id)) { const was = P.playing; if (active.el) active.el.pause(); active = null; next = null; if (was) P.seek(P.t); }
      else { const at = VE.at(P.t); if (at && (!active || active.clip.id !== at.clip.id || Math.abs(active.start - at.start) > .001)) P.seek(P.t); else if (at && active) active.clip = at.clip; next = null; }
      dirty = true;
    });
    VE.on('track', () => { dirty = true; }); VE.on('chars', () => { dirty = true; });
    document.addEventListener('visibilitychange', () => { dirty = true; });
    requestAnimationFrame(raf);
    setInterval(() => { const n = performance.now(); if (n - lastRaf > 250) tick(n); }, 100);
  };
})();
