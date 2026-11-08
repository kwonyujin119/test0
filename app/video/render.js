/* 영상 작업장 — 한 장면 그리기. 미리보기와 내보내기가 같은 함수를 써서 결과가 같다 */
'use strict';
(() => {
  const small = document.createElement('canvas'); small.width = 64; small.height = 36;
  const smallC = small.getContext('2d', { willReadFrequently: true });
  const mos = document.createElement('canvas'); const mosC = mos.getContext('2d');

  const paint = (c, frame, x, y, w, h) => { if (frame && frame.draw && !frame.nodeType) frame.draw(c, x, y, w, h); else if (frame) c.drawImage(frame, x, y, w, h); };

  /* 원본 영상이 화면 어디에 놓이는지 */
  VE.destRect = (clip, W, H, fw, fh) => {
    const s = clip.fit === 'fill' ? Math.max(W / fw, H / fh) : Math.min(W / fw, H / fh);
    const k = s * (clip.zoom || 1), w = fw * k, h = fh * k;
    return { x: (W - w) / 2 + (clip.px || 0) * W, y: (H - h) / 2 + (clip.py || 0) * H, w, h };
  };

  /* ---------- 얼굴 위치 보간 ---------- */
  const lerp = (a, b, f) => a + (b - a) * f;
  const FIELDS = 12; /* cx cy w h roll yaw pitch blinkL blinkR mouth smile brow */
  VE.poseAt = (mid, src) => {
    const r = VE.rt.get(mid), tr = r && r.track; if (!tr) return null;
    const pos = src * tr.fps, i = Math.floor(pos), f = pos - i, fr = tr.frames;
    const hold = Math.round(tr.fps * 1.5);
    let a = fr[i], b = fr[i + 1];
    if (!a || !a.length) { for (let k = 1; k <= hold; k++) { const p = fr[i - k]; if (p && p.length) { a = p; break; } } }
    if (!b || !b.length) b = a;
    if (!a || !a.length) { if (b && b.length) a = b; else return null; }
    if (a.length !== b.length) return a.map(x => x);
    return a.map((face, n) => { const q = b[n]; const o = new Array(FIELDS); for (let k = 0; k < FIELDS; k++) o[k] = lerp(face[k], q[k], f); return o; });
  };
  /* 얼굴 기준점 468개 (0~1) — 앞뒤 기록 사이를 이어 그림. 잠깐 놓친 장면은 1.5초까지 직전 값을 씀 */
  const meshBuf = new Float32Array(936);
  VE.meshAt = (mid, src) => {
    const r = VE.rt.get(mid), tr = r && r.track; if (!tr || !tr.mesh) return null;
    const pos = src * tr.fps, i = Math.floor(pos), f = pos - i, M = tr.mesh, hold = Math.round(tr.fps * 1.5);
    let a = M[i], b = M[i + 1];
    if (!a) { for (let k = 1; k <= hold; k++) { if (M[i - k]) { a = M[i - k]; break; } } }
    if (!b) b = a; if (!a) { if (b) a = b; else return null; }
    for (let k = 0; k < 936; k++) meshBuf[k] = (a[k] + (b[k] - a[k]) * f) / 16000;
    return meshBuf;
  };
  const toParams = p => ({ roll: p[4], yaw: p[5], pitch: p[6], blinkL: p[7], blinkR: p[8], mouth: p[9], smile: p[10], brow: p[11] });

  /* ---------- 글자 ---------- */
  const FONT = "'Pretendard Variable', Pretendard, 'Malgun Gothic', sans-serif";
  const wrap = (c, text, maxW) => {
    const words = text.split(/\s+/), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  };
  /* 줄 안에서 낱말 위치를 재며 지금 말하는 낱말을 칠함 */
  const drawCaption = (c, W, H, cap, t) => {
    const st = VE.p.cap, unit = Math.min(W, H) * .052 * (st.size || 1);
    c.save(); c.font = `700 ${unit}px ${FONT}`; c.textBaseline = 'middle'; c.lineJoin = 'round';
    const lines = wrap(c, cap.text, W * .86), lh = unit * 1.36;
    const y0 = st.pos === 'top' ? H * .08 + lh / 2 : st.pos === 'middle' ? H / 2 - (lines.length - 1) * lh / 2 : H * .92 - (lines.length - 1) * lh - lh / 2;
    let wi = 0;
    lines.forEach((ln, i) => {
      const y = y0 + i * lh, w = c.measureText(ln).width, x = (W - w) / 2;
      if (st.style === 'box') { c.fillStyle = 'rgba(12,13,15,.72)'; c.beginPath(); c.roundRect(x - unit * .45, y - lh * .46, w + unit * .9, lh * .92, unit * .22); c.fill(); }
      if (st.style === 'outline' || st.style === 'word') { c.strokeStyle = 'rgba(0,0,0,.92)'; c.lineWidth = unit * .19; c.strokeText(ln, x, y); }
      c.textAlign = 'left';
      let px = x; const parts = ln.split(' ');
      parts.forEach((part, k) => {
        const item = cap.words[wi++]; const on = st.style === 'word' && item && t >= item.s && t < item.e + .04;
        c.fillStyle = on ? '#ffd84d' : '#fff'; c.fillText(part, px, y);
        px += c.measureText(part + (k < parts.length - 1 ? ' ' : '')).width;
      });
    });
    c.restore();
  };
  const drawTitle = (c, W, H, o, t) => {
    const fade = Math.min(1, (t - o.start) / .25, (o.end - t) / .25); if (fade <= 0) return;
    const base = Math.min(W, H), big = o.preset === 'title', unit = base * (big ? .092 : .046) * (o.size || 1);
    c.save(); c.globalAlpha = fade; c.font = `${big ? 800 : 700} ${unit}px ${FONT}`; c.textBaseline = 'middle'; c.lineJoin = 'round';
    const lines = String(o.text || '').split('\n').flatMap(l => wrap(c, l, W * .84)), lh = unit * 1.26, cx = o.x * W, cy = o.y * H, top = cy - (lines.length - 1) * lh / 2;
    let maxW = 0; lines.forEach(l => maxW = Math.max(maxW, c.measureText(l).width));
    c.textAlign = o.preset === 'lower' ? 'left' : 'center';
    const lx = o.preset === 'lower' ? cx - maxW / 2 : cx;
    if (o.preset === 'lower') {
      const pad = unit * .6; c.fillStyle = 'rgba(12,13,15,.82)'; c.beginPath(); c.roundRect(lx - pad, top - lh * .62, maxW + pad * 2, (lines.length - 1) * lh + lh * 1.24, unit * .2); c.fill();
      c.fillStyle = o.color || '#fff'; c.fillRect(lx - pad, top - lh * .62, unit * .12, (lines.length - 1) * lh + lh * 1.24);
    } else { c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = unit * .28; c.shadowOffsetY = unit * .05; }
    c.fillStyle = o.preset === 'lower' ? '#fff' : (o.color || '#fff');
    lines.forEach((l, i) => c.fillText(l, lx, top + i * lh));
    c.restore();
  };
  VE.titleBox = (c, W, H, o) => { /* 끌기용 대략의 상자 */
    const big = o.preset === 'title', unit = Math.min(W, H) * (big ? .092 : .046) * (o.size || 1); c.save(); c.font = `800 ${unit}px ${FONT}`;
    const lines = String(o.text || '').split('\n').flatMap(l => wrap(c, l, W * .84)); let w = 0; lines.forEach(l => w = Math.max(w, c.measureText(l).width)); c.restore();
    const h = lines.length * unit * 1.26; return { x: o.x * W - w / 2, y: o.y * H - h / 2, w, h };
  };

  /* ---------- 화면 속 화면 ---------- */
  const PIP_POS = { br: [1, 1], bl: [0, 1], tr: [1, 0], tl: [0, 0] };
  const drawPip = (c, W, H, clip, f) => {
    const pip = clip.pip; if (!pip || !f.pip || !f.pip.frame) return;
    const base = Math.min(W, H), d = base * (pip.size || .28), m = base * .035, [hx, vy] = PIP_POS[pip.pos || 'br'] || PIP_POS.br;
    const x = hx ? W - d - m : m, y = vy ? H - d - m : m, cx = x + d / 2, cy = y + d / 2;
    const { frame, fw, fh, src } = f.pip, poses = pip.char || pip.follow ? VE.poseAt(pip.mid, src) : null, pose = poses && poses[0];
    c.save(); c.beginPath(); if ((pip.shape || 'circle') === 'circle') c.arc(cx, cy, d / 2, 0, Math.PI * 2); else c.roundRect(x, y, d, d, d * .12);
    c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = d * .08; c.fillStyle = '#20232a'; c.fill(); c.shadowColor = 'transparent'; c.clip();
    if (pip.char && VE.isChar(pip.char)) {
      c.fillStyle = pip.bg || '#e9eef6'; c.fillRect(x, y, d, d);
      const pr = pose ? toParams(pose) : null;
      VE.drawChar(c, pip.char, cx, cy + d * .04, d * .58, pr ? pr.roll : 0, pr, 1);
    } else {
      /* 가운데를 정사각형으로 잘라 넣음 */
      const k = Math.max(d / fw, d / fh) * (pip.zoom || 1), w = fw * k, h = fh * k; paint(c, frame, cx - w / 2, cy - h / 2, w, h);
    }
    c.restore();
    c.save(); c.beginPath(); if ((pip.shape || 'circle') === 'circle') c.arc(cx, cy, d / 2, 0, Math.PI * 2); else c.roundRect(x, y, d, d, d * .12); c.lineWidth = Math.max(1.5, base * .004); c.strokeStyle = 'rgba(255,255,255,.9)'; c.stroke(); c.restore();
  };

  /* ---------- 장면 ---------- */
  /* f = { t, clip, media, src, frame, fw, fh, pip:{frame,fw,fh,src}, noCaption } */
  VE.drawFrame = (c, W, H, f) => {
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const clip = f.clip; let usesChar = false, swapped = false;
    if (clip && f.frame && f.fw && f.fh) {
      const r = VE.destRect(clip, W, H, f.fw, f.fh);
      const covers = r.x <= 0.5 && r.y <= 0.5 && r.x + r.w >= W - 0.5 && r.y + r.h >= H - 0.5;
      if (!covers && VE.p.bg === 'blur') {
        /* 빈 자리: 같은 장면을 작게 줄였다 키워 흐린 배경으로 */
        const k = Math.max(W / f.fw, H / f.fh); smallC.imageSmoothingEnabled = true;
        paint(smallC, f.frame, 0, 0, small.width, small.height);
        /* 얼굴 효과를 쓰면 흐린 배경에서도 얼굴이 보이지 않게 그 자리를 주변 색으로 덮음 */
        if (clip.face && clip.face.mode) { const ps = VE.poseAt(clip.mid, f.src); if (ps) for (const p of ps) { const fx = p[0] * small.width, fy = p[1] * small.height, rx = p[2] * small.width * .85, ry = p[3] * small.height * .85; const px = smallC.getImageData(clamp(Math.round(fx + rx * 1.5), 0, small.width - 1), clamp(Math.round(fy), 0, small.height - 1), 1, 1).data; smallC.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`; smallC.beginPath(); smallC.ellipse(fx, fy, rx, ry, 0, 0, Math.PI * 2); smallC.fill(); } }
        c.drawImage(small, (W - f.fw * k) / 2, (H - f.fh * k) / 2, f.fw * k, f.fh * k);
        c.fillStyle = 'rgba(0,0,0,.42)'; c.fillRect(0, 0, W, H);
      } else if (!covers && VE.p.bg === 'white') { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); }
      paint(c, f.frame, r.x, r.y, r.w, r.h);
      /* 얼굴 */
      if (clip.face && clip.face.mode) {
        const poses = VE.poseAt(clip.mid, f.src);
        if (poses) poses.forEach((p, n) => {
          const px = r.x + p[0] * r.w, py = r.y + p[1] * r.h, fwPx = p[2] * r.w, fhPx = p[3] * r.h;
          if (clip.face.mode === 'mosaic') {
            const bw = fwPx * 1.3, bh = fhPx * 1.45, cells = 8, bx = px - bw / 2, by = py - bh / 2;
            const sx = clamp(bx, 0, W - 1), sy = clamp(by, 0, H - 1), sw = Math.min(W - sx, bw), sh = Math.min(H - sy, bh); if (sw < 2 || sh < 2) return;
            mos.width = cells; mos.height = Math.max(2, Math.round(cells * sh / sw)); mosC.imageSmoothingEnabled = true; mosC.drawImage(c.canvas, sx, sy, sw, sh, 0, 0, mos.width, mos.height);
            c.save(); c.beginPath(); c.ellipse(px, py, bw / 2, bh / 2, p[4], 0, Math.PI * 2); c.clip(); c.imageSmoothingEnabled = false; c.drawImage(mos, sx, sy, sw, sh); c.restore();
          } else if (n === 0 && VE.isChar(clip.face.char)) {
            usesChar = true; const pr = toParams(p);
            /* 얼굴 덮기: 기준점 그물로 사진 얼굴을 영상 얼굴 모양에 맞춰 덮음 (실패하면 아래의 얹기 방식으로) */
            if (clip.face.swap && VE.swap && VE.swap.can(clip.face.char)) {
              const ms = VE.meshAt(clip.mid, f.src);
              if (ms) { const pts = new Float32Array(936); for (let q = 0; q < 468; q++) { pts[q * 2] = r.x + ms[q * 2] * r.w; pts[q * 2 + 1] = r.y + ms[q * 2 + 1] * r.h; } if (VE.swap.draw(c, pts, clip.face.char, clip.id, f.src)) { swapped = true; return; } }
            }
            /* AI 목소리로 바꾼 장면은 그 소리 크기에 맞춰 입을 움직임 */
            if (VE.dub && VE.dub.active(clip.mid)) pr.mouth = VE.dub.mouthAt(clip.mid, f.src);
            /* 얼굴 눈금은 이마까지만이라 머리카락까지 덮도록 조금 위로 */
            VE.drawChar(c, clip.face.char, px + (clip.face.dx || 0) * fwPx, py + ((clip.face.dy || 0) - .09) * fhPx, Math.max(fwPx, fhPx * .8), pr.roll, pr, clip.face.scale || 1.25);
          }
        });
      }
      /* 페이드 */
      const len = VE.clipLen(clip), local = f.src != null ? (f.src - clip.in) / (clip.speed || 1) : 0; let fade = 1;
      if (clip.fadeIn > 0) fade = Math.min(fade, local / clip.fadeIn); if (clip.fadeOut > 0) fade = Math.min(fade, (len - local) / clip.fadeOut);
      if (fade < 1) { c.fillStyle = `rgba(0,0,0,${1 - clamp(fade, 0, 1)})`; c.fillRect(0, 0, W, H); }
    }
    if (clip && clip.pip) { if (clip.pip.char && VE.isChar(clip.pip.char)) usesChar = true; drawPip(c, W, H, clip, f); }
    for (const o of VE.p.titles) if (f.t >= o.start && f.t < o.end) drawTitle(c, W, H, o, f.t);
    if (!f.noCaption && VE.p.cap.on) { const cap = VE.capAt(f.t); if (cap) drawCaption(c, W, H, cap, f.t); }
    /* 캐릭터로 바꾼 영상이라는 표시 */
    /* 얼굴 덮기는 실제 사람처럼 보이므로 표시를 끌 수 없다 */
    const usesVoice = !!(VE.dub && VE.dub.labelAt(f.t, clip)), showChar = usesChar && (VE.p.aiLabel || swapped);
    if (showChar || usesVoice) {
      const u = Math.min(W, H) * .024, label = showChar && usesVoice ? 'AI 캐릭터 · AI 음성' : showChar ? 'AI 캐릭터' : 'AI 음성', m = Math.min(W, H) * .03; c.font = `600 ${u}px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
      const w = c.measureText(label).width + u * 1.2, h = u * 1.8; c.fillStyle = 'rgba(12,13,15,.62)'; c.beginPath(); c.roundRect(W - m - w, m, w, h, h / 2); c.fill(); c.fillStyle = '#fff'; c.fillText(label, W - m - w + u * .6, m + h / 2);
    }
    c.restore();
  };
  VE.mixFade = (o, local, len) => { let g = o.vol == null ? 1 : o.vol; if (o.fadeIn > 0) g *= clamp(local / o.fadeIn, 0, 1); if (o.fadeOut > 0) g *= clamp((len - local) / o.fadeOut, 0, 1); return g; };
})();
