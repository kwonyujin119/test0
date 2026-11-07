/* 영상 작업장 — 얼굴 자리에 그리는 캐릭터 · 사진 가상 인물(app/video/people/, 사용자가 준 그림)
   기본 그림은 코드로 그린 임시 캐릭터다. 사용자가 그림(PNG·SVG)을 넣으면 그것을 쓴다.
   얼굴 값: blinkL·blinkR(0 뜸~1 감음), mouth(0~1 벌림), smile(0~1), brow(0~1 올림), yaw·pitch(-1~1 고개 방향) */
'use strict';
(() => {
  const TAU = Math.PI * 2;
  const ell = (c, x, y, rx, ry, fill, rot) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } };
  const poly = (c, pts, fill) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill(); };
  const line = (c, pts, color, w) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); };
  const curve = (c, x0, y0, cx, cy, x1, y1, color, w) => { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; c.stroke(); };
  const rrect = (c, x, y, w, h, r, fill) => { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } };

  /* 눈: 뜨면 둥근 눈, 감으면 호 */
  const eye = (c, x, y, r, blink, color, shine) => {
    const open = 1 - Math.min(1, blink * 1.15);
    if (open < .18) { curve(c, x - r, y, x, y + r * .55, x + r, y, color, r * .34); return; }
    ell(c, x, y, r * .86, r * Math.max(.2, open), color);
    if (shine && open > .5) ell(c, x + r * .28, y - r * .34, r * .26, r * .26, shine);
  };
  /* 입 공통: 벌리면 타원 + 혀 */
  const mouthOpen = (c, x, y, w, open, dark, tongue) => {
    const h = w * (.25 + open * 1.05);
    ell(c, x, y + h * .35, w, h, dark);
    if (tongue && open > .22) { c.save(); c.beginPath(); c.ellipse(x, y + h * .35, w, h, 0, 0, TAU); c.clip(); ell(c, x, y + h * 1.05, w * .7, h * .62, tongue); c.restore(); }
  };

  /* 사진으로 만든 가상 인물: 얼굴 자리에 맞춰 얹고, 말할 때 턱을 내려 입을 벌린다
     a = 1000px 너비 그림 안의 기준점 (얼굴 가운데 cx·cy, 볼 사이 너비 fw, 입 가운데 mx · 너비 mw, 입술 사이 ly, 턱 chin) — 얼굴 인식으로 잰 값 */
  const photos = {}; const photoWait = [];
  function loadPhoto(id, file, a) {
    if (photos[id]) return photos[id].p;
    const o = photos[id] = {};
    o.p = new Promise(res => {
      /* decode() 는 창이 가려져 있으면 끝나지 않을 수 있어 onload 로 기다린다 */
      const img = new Image();
      new Promise((ok, bad) => { img.onload = ok; img.onerror = () => bad(new Error(file)); img.src = file; }).then(() => {
        /* 턱 조각: 입술 사이부터 턱 아래까지. 옆과 아래는 흐리게 지워 이음매를 감춘다 */
        /* 가운데(입 너비쯤)만 온전히 움직이고 볼 쪽으로 갈수록 덜 움직여 이음매가 보이지 않게 한다 */
        const jw = Math.round(a.fw * .95), jh = Math.round(a.chin - a.ly + a.fw * .3), x0 = Math.round(a.mx - jw / 2), y0 = Math.round(a.ly);
        const cv = document.createElement('canvas'); cv.width = jw; cv.height = jh; const c = cv.getContext('2d');
        c.drawImage(img, x0, y0, jw, jh, 0, 0, jw, jh); c.globalCompositeOperation = 'destination-in';
        let g = c.createLinearGradient(0, 0, jw, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.24, '#000'); g.addColorStop(.76, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, jw, jh);
        g = c.createLinearGradient(0, 0, 0, jh); g.addColorStop(0, '#000'); g.addColorStop(.5, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, jw, jh);
        o.img = img; o.jaw = cv; o.x0 = x0; o.y0 = y0; o.ready = true; VE.emit && VE.emit('chars'); res();
      }).catch(e => { console.warn('가상 인물 그림을 읽지 못했습니다', e); res(); });
    });
    photoWait.push(o.p); return o.p;
  }
  function photoChar(id, name, file, a) {
    return {
      name, group: '가상 인물', cover: 1, photo: true, load: () => loadPhoto(id, file, a),
      draw(c, f) {
        const o = photos[id]; if (!o || !o.ready) { loadPhoto(id, file, a); return; }
        /* 단위 공간: 얼굴 너비 2 → 사진 얼굴을 조금 크게(0.92 × 2) 얹어 실제 얼굴을 덮음 */
        const s = 1.84 / a.fw; c.translate(0, .18); c.scale(s, s); c.translate(-a.cx, -a.cy);
        c.drawImage(o.img, 0, 0);
        const open = Math.max(0, Math.min(1, (f.mouth - .06) / .94));
        if (open > 0) {
          /* 벌어진 입 속: 입꼬리는 그대로, 가운데가 가장 깊은 렌즈꼴 + 윗니 살짝 */
          const d = open * a.fw * .055, hw = a.mw * .44;
          c.save(); c.beginPath(); c.moveTo(a.mx - hw, a.ly); c.quadraticCurveTo(a.mx, a.ly - d * .2, a.mx + hw, a.ly); c.quadraticCurveTo(a.mx, a.ly + d * 2.3, a.mx - hw, a.ly); c.closePath();
          const g = c.createLinearGradient(0, a.ly, 0, a.ly + d * 1.1); g.addColorStop(0, '#1e0c0e'); g.addColorStop(1, '#4b2427'); c.fillStyle = g; c.fill();
          c.clip(); const t = c.createLinearGradient(0, a.ly - d * .2, 0, a.ly + d * .38); t.addColorStop(0, 'rgba(226,216,208,.78)'); t.addColorStop(1, 'rgba(226,216,208,0)'); c.fillStyle = t; c.fillRect(a.mx - hw * .58, a.ly - d * .2, hw * 1.16, d * .58); c.restore();
          c.drawImage(o.jaw, o.x0, o.y0 + d);
        }
      },
    };
  }
  /* 내보내기 전에 사진이 다 읽혔는지 기다림 */
  VE.charsReady = () => { for (const k in CHARS) if (CHARS[k].load) CHARS[k].load(); return Promise.all(photoWait); };

  const CHARS = {
    cat: {
      name: '고양이', group: '동물', cover: 1.36, draw(c, f) {
        const fx = f.yaw * .16, fy = f.pitch * .1, skin = '#f2a65a', dark = '#c97a2e', inner = '#ffd9c2', ink = '#2b211a';
        poly(c, [[-.92, -.42], [-.82, -1.18], [-.26, -.82]], skin); poly(c, [[.92, -.42], [.82, -1.18], [.26, -.82]], skin);
        poly(c, [[-.78, -.56], [-.73, -.98], [-.42, -.78]], inner); poly(c, [[.78, -.56], [.73, -.98], [.42, -.78]], inner);
        ell(c, 0, 0, 1, .92, skin);
        for (const k of [-.26, 0, .26]) line(c, [[k + fx * .4, -.9], [k * .8 + fx * .6, -.58]], dark, .085);
        for (const s of [-1, 1]) { line(c, [[s * .98, -.05], [s * .68, -.02]], dark, .07); line(c, [[s * .96, .24], [s * .68, .17]], dark, .07); }
        ell(c, fx, .36 + fy, .46, .36, '#fff3e4');
        const ey = -.12 + fy - f.brow * .03; eye(c, -.4 + fx, ey, .19, f.blinkL, ink, '#fff'); eye(c, .4 + fx, ey, .19, f.blinkR, ink, '#fff');
        poly(c, [[-.09 + fx, .17 + fy], [.09 + fx, .17 + fy], [fx, .28 + fy]], '#e8747c');
        if (f.mouth > .1) mouthOpen(c, fx, .33 + fy, .2, f.mouth, '#6e2530', '#e8747c');
        else { const u = .36 + fy, sm = .07 + f.smile * .08; curve(c, fx, u - .06, -.08 + fx, u + sm, -.2 + fx, u - .01, ink, .035); curve(c, fx, u - .06, .08 + fx, u + sm, .2 + fx, u - .01, ink, .035); }
        for (const s of [-1, 1]) { line(c, [[s * .52 + fx, .26 + fy], [s * 1.12, .16 + fy * .5]], ink, .022); line(c, [[s * .52 + fx, .36 + fy], [s * 1.14, .38 + fy * .5]], ink, .022); }
      },
    },
    fox: {
      name: '여우', group: '동물', cover: 1.36, draw(c, f) {
        const fx = f.yaw * .16, fy = f.pitch * .1, fur = '#e4703a', tip = '#3a2a24', white = '#fff6ec', ink = '#241a16';
        poly(c, [[-.9, -.3], [-.86, -1.28], [-.2, -.72]], fur); poly(c, [[.9, -.3], [.86, -1.28], [.2, -.72]], fur);
        poly(c, [[-.87, -.98], [-.86, -1.28], [-.6, -1.05]], tip); poly(c, [[.87, -.98], [.86, -1.28], [.6, -1.05]], tip);
        poly(c, [[-.72, -.48], [-.74, -.92], [-.4, -.68]], '#ffc9a8'); poly(c, [[.72, -.48], [.74, -.92], [.4, -.68]], '#ffc9a8');
        c.beginPath(); c.moveTo(-1, -.22); c.quadraticCurveTo(-.95, -.92, 0, -.9); c.quadraticCurveTo(.95, -.92, 1, -.22); c.quadraticCurveTo(.9, .4, 0, 1); c.quadraticCurveTo(-.9, .4, -1, -.22); c.closePath(); c.fillStyle = fur; c.fill();
        c.beginPath(); c.moveTo(-.98, .02); c.quadraticCurveTo(-.5, .0, -.16 + fx, -.1); c.quadraticCurveTo(fx, .2 + fy, .16 + fx, -.1); c.quadraticCurveTo(.5, 0, .98, .02); c.quadraticCurveTo(.82, .44, 0, 1); c.quadraticCurveTo(-.82, .44, -.98, .02); c.closePath(); c.fillStyle = white; c.fill();
        const ey = -.14 + fy; eye(c, -.42 + fx, ey, .16, f.blinkL, ink, '#fff'); eye(c, .42 + fx, ey, .16, f.blinkR, ink, '#fff');
        ell(c, fx, .36 + fy, .1, .075, ink);
        if (f.mouth > .1) mouthOpen(c, fx, .47 + fy, .17, f.mouth * .9, '#60231e', '#e36f6f');
        else curve(c, -.17 + fx, .5 + fy, fx, .58 + fy + f.smile * .08, .17 + fx, .5 + fy, ink, .035);
      },
    },
    bear: {
      name: '곰', group: '동물', cover: 1.32, draw(c, f) {
        const fx = f.yaw * .15, fy = f.pitch * .1, fur = '#8d5f3e', dark = '#6b4529', muz = '#e7cdb0', ink = '#21160f';
        for (const s of [-1, 1]) { ell(c, s * .78, -.72, .32, .32, fur); ell(c, s * .78, -.72, .17, .17, dark); }
        ell(c, 0, 0, 1, .94, fur);
        ell(c, fx, .32 + fy, .46, .36, muz);
        const ey = -.16 + fy; eye(c, -.4 + fx, ey, .14, f.blinkL, ink, '#fff'); eye(c, .4 + fx, ey, .14, f.blinkR, ink, '#fff');
        for (const s of [-1, 1]) curve(c, s * .54 + fx, -.42 + fy - f.brow * .08, s * .4 + fx, -.5 + fy - f.brow * .12, s * .26 + fx, -.42 + fy - f.brow * .08, dark, .05);
        ell(c, fx, .17 + fy, .13, .09, ink);
        if (f.mouth > .1) mouthOpen(c, fx, .36 + fy, .19, f.mouth, '#55201c', '#d9716d');
        else curve(c, -.17 + fx, .39 + fy, fx, .48 + fy + f.smile * .08, .17 + fx, .39 + fy, ink, .035);
      },
    },
    robot: {
      name: '로봇', group: '캐릭터', cover: 1.32, draw(c, f) {
        const fx = f.yaw * .12, fy = f.pitch * .08, body = '#c8ced6', side = '#9aa3ae', panel = '#23272e', led = '#7fd7ff';
        line(c, [[0, -.92], [0, -1.26]], side, .06); ell(c, 0, -1.3, .085, .085, '#ff7a6b');
        rrect(c, -1.1, -.28, .18, .5, .06, side); rrect(c, .92, -.28, .18, .5, .06, side);
        rrect(c, -.96, -.94, 1.92, 1.82, .3, body);
        rrect(c, -.76 + fx, -.62 + fy, 1.52, 1.1, .2, panel);
        const ey = -.22 + fy;
        for (const [x, b] of [[-.36, f.blinkL], [.36, f.blinkR]]) { const h = Math.max(.035, .23 * (1 - Math.min(1, b * 1.15))); rrect(c, x + fx - .15, ey - h / 2, .3, h, Math.min(.06, h / 2), led); }
        const n = 7, w = .9, mo = f.mouth;
        for (let i = 0; i < n; i++) { const k = (i - (n - 1) / 2) / (n - 1), h = .03 + mo * .26 * (1 - k * k * 2.2) + f.smile * .01; rrect(c, fx + k * w - .045, .19 + fy - h / 2, .09, h, .025, led); }
        for (const s of [-1, 1]) ell(c, s * .84, .72, .04, .04, side);
      },
    },
    personM: photoChar('personM', '남성', 'app/video/people/virtual-m.webp', { cx: 512.2, cy: 333.1, fw: 282, mx: 512.2, mw: 127.3, ly: 399.8, chin: 499.2 }),
    personF: photoChar('personF', '여성', 'app/video/people/virtual-f.webp', { cx: 521, cy: 354.4, fw: 291.9, mx: 524.4, mw: 126.5, ly: 433.7, chin: 529.7 }),
    leadM: photoChar('leadM', '팀장 (남)', 'app/video/people/lead-m.webp', { cx: 352.2, cy: 342.4, fw: 277.5, mx: 352.7, mw: 115.4, ly: 410.2, chin: 502.9 }),
    leadF: photoChar('leadF', '팀장 (여)', 'app/video/people/lead-f.webp', { cx: 540.9, cy: 383.1, fw: 320.2, mx: 537.9, mw: 133.4, ly: 470.6, chin: 572.5 }),
    ceoM: photoChar('ceoM', '대표 (남)', 'app/video/people/ceo-m.webp', { cx: 507.4, cy: 362.4, fw: 302.3, mx: 508, mw: 124.2, ly: 440.2, chin: 536.3 }),
    ceoF: photoChar('ceoF', '대표 (여)', 'app/video/people/ceo-f.webp', { cx: 528.4, cy: 362.3, fw: 308.3, mx: 525.3, mw: 135.5, ly: 442.7, chin: 547.6 }),
    teacherA: {
      name: '가상 강사 1', group: '가상 인물', cover: 1.3, draw(c, f) {
        const fx = f.yaw * .14, fy = f.pitch * .09, skin = '#f6d3b6', shade = '#e8b995', hair = '#2f2a2a', ink = '#1f1b1b', lens = '#2f2a2a';
        for (const s of [-1, 1]) ell(c, s * .94, .02 + fy * .4, .14, .2, shade);
        c.beginPath(); c.moveTo(-.88, -.26); c.quadraticCurveTo(-.86, .66, 0, .98); c.quadraticCurveTo(.86, .66, .88, -.26); c.quadraticCurveTo(.8, -.98, 0, -.98); c.quadraticCurveTo(-.8, -.98, -.88, -.26); c.closePath(); c.fillStyle = skin; c.fill();
        c.beginPath(); c.moveTo(-.94, -.14); c.quadraticCurveTo(-1.08, -1.12, 0, -1.14); c.quadraticCurveTo(1.08, -1.12, .94, -.14); c.quadraticCurveTo(.82, -.5, .5, -.62); c.quadraticCurveTo(.05, -.5, -.42, -.7); c.quadraticCurveTo(-.82, -.5, -.94, -.14); c.closePath(); c.fillStyle = hair; c.fill();
        const ey = -.1 + fy; eye(c, -.38 + fx, ey, .105, f.blinkL, ink, '#fff'); eye(c, .38 + fx, ey, .105, f.blinkR, ink, '#fff');
        for (const s of [-1, 1]) { c.beginPath(); c.roundRect(s * .38 + fx - .24, ey - .17, .48, .33, .1); c.strokeStyle = lens; c.lineWidth = .04; c.stroke(); curve(c, s * .56 + fx, ey - .3 - f.brow * .1, s * .38 + fx, ey - .38 - f.brow * .13, s * .2 + fx, ey - .3 - f.brow * .08, hair, .055); }
        line(c, [[-.14 + fx, ey - .03], [.14 + fx, ey - .03]], lens, .04);
        curve(c, fx - .03, .1 + fy, fx - .07, .22 + fy, fx + .03, .24 + fy, shade, .045);
        if (f.mouth > .1) mouthOpen(c, fx, .46 + fy, .19, f.mouth, '#7b2c2c', '#e27f7a');
        else curve(c, -.19 + fx, .48 + fy, fx, .55 + fy + f.smile * .12, .19 + fx, .48 + fy, '#a14a44', .045);
      },
    },
    teacherB: {
      name: '가상 강사 2', group: '가상 인물', cover: 1.3, draw(c, f) {
        const fx = f.yaw * .14, fy = f.pitch * .09, skin = '#fbdcc4', shade = '#efc0a0', hair = '#5a3a2a', ink = '#241812', cheek = 'rgba(240,130,120,.35)';
        rrect(c, -1.08, -.76, 2.16, 2, .7, hair);
        c.beginPath(); c.moveTo(-.84, -.26); c.quadraticCurveTo(-.82, .66, 0, .98); c.quadraticCurveTo(.82, .66, .84, -.26); c.quadraticCurveTo(.76, -.96, 0, -.96); c.quadraticCurveTo(-.76, -.96, -.84, -.26); c.closePath(); c.fillStyle = skin; c.fill();
        c.beginPath(); c.moveTo(-.9, -.1); c.quadraticCurveTo(-1, -1.1, 0, -1.12); c.quadraticCurveTo(1, -1.1, .9, -.1); c.quadraticCurveTo(.66, -.62, .12, -.72); c.quadraticCurveTo(-.3, -.42, -.9, -.1); c.closePath(); c.fillStyle = hair; c.fill();
        const ey = -.08 + fy; eye(c, -.36 + fx, ey, .125, f.blinkL, ink, '#fff'); eye(c, .36 + fx, ey, .125, f.blinkR, ink, '#fff');
        for (const s of [-1, 1]) { curve(c, s * .52 + fx, ey - .24 - f.brow * .1, s * .36 + fx, ey - .32 - f.brow * .13, s * .2 + fx, ey - .24 - f.brow * .08, hair, .045); ell(c, s * .54 + fx, .2 + fy, .14, .09, cheek); }
        curve(c, fx - .02, .1 + fy, fx - .06, .2 + fy, fx + .03, .22 + fy, shade, .04);
        if (f.mouth > .1) mouthOpen(c, fx, .44 + fy, .17, f.mouth, '#8a2f38', '#ea8088');
        else curve(c, -.17 + fx, .46 + fy, fx, .53 + fy + f.smile * .12, .17 + fx, .46 + fy, '#c04a55', .05);
      },
    },
  };
  VE.CHARS = CHARS;
  VE.customChars = new Map(); /* id → { name, base, mouth, blink, both } (ImageBitmap) */
  const NEUTRAL = { blinkL: 0, blinkR: 0, mouth: 0, smile: .4, brow: 0, yaw: 0, pitch: 0 };
  VE.isChar = id => !!CHARS[id] || VE.customChars.has(id);
  VE.charName = id => CHARS[id] ? CHARS[id].name : (VE.customChars.get(id) || {}).name || '캐릭터';
  /* (x,y) 얼굴 가운데, size = 얼굴 너비(px), 크기 배율 k */
  VE.drawChar = (c, id, x, y, size, roll, f, k) => {
    f = f || NEUTRAL; k = k || 1;
    const b = CHARS[id]; c.save(); c.translate(x, y); c.rotate(roll || 0);
    if (b) { const r = size * .5 * b.cover * k; c.scale(r, r); b.draw(c, f); }
    else {
      const u = VE.customChars.get(id);
      if (u && u.base) {
        const closed = (f.blinkL + f.blinkR) / 2 > .5, open = f.mouth > .22;
        const img = (closed && open && u.both) || (open && u.mouth) || (closed && u.blink) || u.base;
        const w = size * 1.55 * k, h = w * u.base.height / u.base.width;
        /* 입 그림이 없으면 말할 때 살짝 움직여 말하는 느낌만 줌 */
        const squash = !u.mouth ? 1 + f.mouth * .05 : 1;
        c.scale(1 / Math.sqrt(squash), squash); c.drawImage(img, -w / 2, -h / 2 - size * .05, w, h);
      }
    }
    c.restore();
  };
  VE.charThumb = (id, px) => { const cv = document.createElement('canvas'); cv.width = cv.height = px; const c = cv.getContext('2d'); VE.drawChar(c, id, px / 2, px * .54, px * .6, 0, NEUTRAL, 1); return cv; };
  /* 사용자 캐릭터 불러오기 / 저장 */
  VE.loadCustomChars = async () => { try { const all = await VE.idb.all('chars'); for (const { key, value } of all) { const o = { name: value.name }; for (const k of ['base', 'mouth', 'blink', 'both']) if (value[k]) o[k] = await createImageBitmap(value[k]); VE.customChars.set(key, o); } VE.emit('chars'); } catch (e) { console.warn(e); } };
  VE.saveCustomChar = async (id, name, files) => { const rec = { name }; const o = { name }; for (const k of ['base', 'mouth', 'blink', 'both']) if (files[k]) { rec[k] = files[k]; o[k] = await createImageBitmap(files[k]); } await VE.idb.put('chars', id, rec); VE.customChars.set(id, o); VE.emit('chars'); };
  VE.removeCustomChar = async (id) => { await VE.idb.del('chars', id); VE.customChars.delete(id); VE.emit('chars'); };
})();
