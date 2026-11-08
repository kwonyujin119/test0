/* 영상 작업장 — 얼굴 덮기 (가상 인물 사진의 얼굴을 영상 속 얼굴 모양에 맞춰 휘어 덮는다)
   - 얼굴 기준점 468개(MediaPipe)로 사진 얼굴을 삼각형 그물로 나누고, 장면마다 영상 속 같은 기준점 자리로 휘어 그린다(WebGL)
   - 눈 · 입술 · 표정 · 고개가 원래 얼굴을 따라가고, 입을 벌리면 안쪽(이 · 혀)만 원래 영상이 보여 말과 입 모양이 맞는다
   - 조명: 얼굴 부위마다 밝기 · 색을 장면에 맞춤(흐린 그림끼리 나눈 비율을 곱함 → 한쪽 그늘도 따라감)
   - 이마는 사진에서 피부인 곳만 덮어 앞머리는 따라오지 않게
   - 실제 사람처럼 보이므로 'AI 캐릭터' 표시를 끌 수 없다(render.js). 내장 가상 인물 사진에만 쓴다 */
'use strict';
(() => {
  const N = 468;
  const UPPER_IN = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308], LOWER_IN = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];
  const LIP_LOW = new Set(LOWER_IN.slice(1, -1));
  const MOUTH_IN = [...UPPER_IN, ...LOWER_IN.slice(1, -1).reverse()];

  /* ---------- 삼각분할 (Bowyer–Watson) ---------- */
  function delaunay(P) {
    const n = P.length / 2; let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (let i = 0; i < n; i++) { const x = P[i * 2], y = P[i * 2 + 1]; if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
    const d = Math.max(maxX - minX, maxY - minY) * 20, mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
    const pts = Array.from(P); pts.push(mx - d, my - d, mx + d, my - d, mx, my + d);
    const circ = (a, b, c) => { const ax = pts[a * 2], ay = pts[a * 2 + 1], bx = pts[b * 2], by = pts[b * 2 + 1], cx = pts[c * 2], cy = pts[c * 2 + 1]; const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) || 1e-9; const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D, uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D; return [ux, uy, (ax - ux) ** 2 + (ay - uy) ** 2]; };
    let tris = [[n, n + 1, n + 2, ...circ(n, n + 1, n + 2)]];
    for (let i = 0; i < n; i++) {
      const x = pts[i * 2], y = pts[i * 2 + 1], bad = [], keep = [];
      for (const t of tris) ((x - t[3]) ** 2 + (y - t[4]) ** 2 < t[5] ? bad : keep).push(t);
      const edges = new Map();
      for (const t of bad) for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) { const k = a < b ? a + ',' + b : b + ',' + a; edges.set(k, edges.has(k) ? null : [a, b]); }
      tris = keep; edges.forEach(e => { if (e) tris.push([e[0], e[1], i, ...circ(e[0], e[1], i)]); });
    }
    return tris.filter(t => t[0] < n && t[1] < n && t[2] < n).map(t => [t[0], t[1], t[2]]);
  }
  const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  /* 피부 같은 색인지 (앞머리 · 눈썹 · 그늘진 머리카락은 아님) */
  const skinish = (r, g, b) => r > 90 && g > 45 && b > 25 && r >= g && r > b && r - Math.min(g, b) > 12 && (r + g + b) / 3 > 85;
  /* 사진 기준점(px) → 그릴 삼각형. 입이 다물린 사진도 입안 삼각형이 생기지 않게 아랫입술을 살짝 내린 모양으로 나누고,
     눈썹 위 삼각형은 사진에서 피부일 때만 남김. face = 휘어 그릴 것, hull = 가장자리 흐림용(입안 포함) */
  function buildMesh(P, fw, img) {
    const Q = new Float32Array(P), gap = fw * .06; for (const i of LIP_LOW) Q[i * 2 + 1] += gap;
    const mouth = MOUTH_IN.map(i => [Q[i * 2], Q[i * 2 + 1]]);
    const avgY = ids => ids.reduce((s, i) => s + P[i * 2 + 1], 0) / ids.length, browY = avgY([105, 66, 334, 296, 107, 336]);
    const W = img.naturalWidth, H = img.naturalHeight, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0); const D = cx.getImageData(0, 0, W, H).data;
    const px = (x, y) => { x = Math.max(0, Math.min(W - 1, Math.round(x))); y = Math.max(0, Math.min(H - 1, Math.round(y))); const i = (y * W + x) * 4; return [D[i], D[i + 1], D[i + 2], D[i + 3]]; };
    const skinTri = t => { let ok = 0, n = 0; const [a, b, c] = t.map(i => [P[i * 2], P[i * 2 + 1]]); for (const [u, v] of [[1 / 3, 1 / 3], [.6, .2], [.2, .6], [.2, .2]]) { const x = a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v, y = a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v, p = px(x, y); n++; if (p[3] > 200 && skinish(p[0], p[1], p[2])) ok++; } return ok >= 3; };
    const face = [], hull = [];
    for (const t of delaunay(Q)) {
      const top = Math.min(P[t[0] * 2 + 1], P[t[1] * 2 + 1], P[t[2] * 2 + 1]);
      if (top < browY && !skinTri(t)) continue; /* 앞머리 · 머리카락 */
      hull.push(...t);
      const mx = (Q[t[0] * 2] + Q[t[1] * 2] + Q[t[2] * 2]) / 3, my = (Q[t[0] * 2 + 1] + Q[t[1] * 2 + 1] + Q[t[2] * 2 + 1]) / 3;
      if (!inPoly(mx, my, mouth)) face.push(...t);
    }
    return { face: Uint16Array.from(face), hull: Uint16Array.from(hull) };
  }
  /* 영상 속 입안(안쪽 입술 사이) 삼각형: 가운데 점을 하나 더해 부채꼴로 */
  const HOLE = (() => { const out = []; for (let i = 0; i < MOUTH_IN.length; i++) out.push(N, MOUTH_IN[i], MOUTH_IN[(i + 1) % MOUTH_IN.length]); return Uint16Array.from(out); })();

  /* ---------- WebGL ---------- */
  let gl = null, cv = null, P = {}, buf = {}, fbo = {}, failed = false;
  const VS_TRI = `#version 300 es
in vec2 aPos; in vec2 aUV; uniform vec2 uSize; out vec2 vUV;
void main(){ vUV = aUV; vec2 p = aPos / uSize * 2.0 - 1.0; gl_Position = vec4(p, 0.0, 1.0); }`;
  const FS_TRI = `#version 300 es
precision highp float; in vec2 vUV; uniform sampler2D uTex; uniform float uSolid; out vec4 o;
void main(){ if (uSolid > 0.5) { o = vec4(1.0); return; } vec4 c = texture(uTex, vUV); o = vec4(c.rgb, c.a > 0.5 ? 1.0 : 0.0); }`;
  const VS_Q = `#version 300 es
in vec2 aPos; uniform float uFlip; out vec2 vUV;
void main(){ vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos.x, aPos.y * uFlip, 0.0, 1.0); }`;
  /* 흐리기 (네 성분 모두) */
  const FS_BLUR = `#version 300 es
precision highp float; in vec2 vUV; uniform sampler2D uTex; uniform vec2 uDir; out vec4 o;
void main(){ vec4 s = vec4(0.0); float w = 0.0; for (int i = -6; i <= 6; i++) { float k = exp(-float(i*i) / 18.0); s += texture(uTex, vUV + uDir * float(i)) * k; w += k; } o = s / w; }`;
  /* 조명 비교용: 색 × 얼굴 자리 (얼굴 밖은 0) */
  const FS_PRE = `#version 300 es
precision highp float; in vec2 vUV; uniform sampler2D uSrc, uMask; out vec4 o;
void main(){ float a = texture(uMask, vUV).a; o = vec4(texture(uSrc, vUV).rgb * a, a); }`;
  const FS_MIX = `#version 300 es
precision highp float; in vec2 vUV; uniform sampler2D uBase, uFace, uHull, uHole, uLowF, uLowB; uniform float uLight; out vec4 o;
void main(){
  vec3 b = texture(uBase, vUV).rgb; vec4 f = texture(uFace, vUV);
  vec4 lf = texture(uLowF, vUV), lb = texture(uLowB, vUV);
  vec3 mf = lf.rgb / max(lf.a, 1e-3), mb = lb.rgb / max(lb.a, 1e-3);
  vec3 ratio = clamp((mb + 0.02) / (mf + 0.02), 0.55, 1.8);
  vec3 fc = clamp(f.rgb * mix(vec3(1.0), ratio, uLight), 0.0, 1.0);
  float outer = clamp((texture(uHull, vUV).a - 0.5) * 2.4, 0.0, 1.0);
  float hole = clamp(texture(uHole, vUV).a * 1.6, 0.0, 1.0);
  float m = outer * (1.0 - hole) * f.a + outer * (1.0 - hole) * (1.0 - f.a) * 0.0;
  o = vec4(mix(b, fc, m), 1.0);
}`;
  function prog(vs, fs) {
    const mk = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p;
  }
  function init() {
    if (gl || failed) return !!gl;
    try {
      cv = document.createElement('canvas'); gl = cv.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
      if (!gl) throw new Error('WebGL2 없음');
      P.tri = prog(VS_TRI, FS_TRI); P.blur = prog(VS_Q, FS_BLUR); P.pre = prog(VS_Q, FS_PRE); P.mix = prog(VS_Q, FS_MIX);
      buf.quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf.quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      buf.pos = gl.createBuffer(); buf.uv = gl.createBuffer(); buf.idx = gl.createBuffer();
      return true;
    } catch (e) { console.warn('얼굴 덮기를 쓸 수 없습니다', e); failed = true; gl = null; return false; }
  }
  const tex = (src, w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); return t; };
  function target(name, w, h) {
    let f = fbo[name]; if (f && f.w === w && f.h === h) return f;
    if (f) { gl.deleteTexture(f.t); gl.deleteFramebuffer(f.fb); }
    const t = tex(null, w, h), fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return fbo[name] = { t, fb, w, h };
  }
  const quad = (p) => { const a = gl.getAttribLocation(p, 'aPos'); gl.bindBuffer(gl.ARRAY_BUFFER, buf.quad); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(a); };
  const U = (p, n) => gl.getUniformLocation(p, n);
  /* 그물 그리기: pos(그릴 자리 px), uv(사진 좌표), idx */
  function mesh(fb, w, h, pos, uv, idx, texId, solid, clear) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, w, h); if (clear !== false) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
    gl.useProgram(P.tri); gl.uniform2f(U(P.tri, 'uSize'), w, h); gl.uniform1f(U(P.tri, 'uSolid'), solid ? 1 : 0);
    const aP = gl.getAttribLocation(P.tri, 'aPos'), aU = gl.getAttribLocation(P.tri, 'aUV');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.pos); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.uv); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(aU); gl.vertexAttribPointer(aU, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.DYNAMIC_DRAW);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texId); gl.uniform1i(U(P.tri, 'uTex'), 0);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0); gl.disableVertexAttribArray(aP); gl.disableVertexAttribArray(aU);
  }
  function blur(srcTex, w, h, rad, a, b) {
    gl.useProgram(P.blur); gl.uniform1f(U(P.blur, 'uFlip'), 1); gl.uniform1i(U(P.blur, 'uTex'), 0); gl.activeTexture(gl.TEXTURE0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, a.fb); gl.viewport(0, 0, w, h); gl.bindTexture(gl.TEXTURE_2D, srcTex); gl.uniform2f(U(P.blur, 'uDir'), rad / w, 0); quad(P.blur);
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb); gl.bindTexture(gl.TEXTURE_2D, a.t); gl.uniform2f(U(P.blur, 'uDir'), 0, rad / h); quad(P.blur);
    return b.t;
  }

  /* ---------- 가상 인물 사진 준비 ---------- */
  const src = new Map(); /* id → { img, uv, face, hull, tex } | 'busy' | 'fail' */
  const SW = VE.swap = {};
  SW.can = id => !!(VE.CHARS && VE.CHARS[id] && VE.CHARS[id].photo);
  SW.ready = id => { const s = src.get(id); return !!(s && s !== 'busy' && s !== 'fail'); };
  SW.prepare = async (id) => {
    if (!SW.can(id)) return false; const s0 = src.get(id); if (s0 && s0 !== 'busy') return s0 !== 'fail'; if (s0 === 'busy') { while (src.get(id) === 'busy') await new Promise(r => setTimeout(r, 50)); return SW.ready(id); }
    src.set(id, 'busy');
    try {
      await VE.CHARS[id].load(); const img = VE.charPhoto(id); if (!img) throw new Error('사진 없음');
      const ck = 'mesh:' + id + ':' + img.src.split('/').pop();
      let L = await VE.idb.get('cache', ck).catch(() => null);
      if (!L) { L = await VE.imageLandmarks(img); if (!L) throw new Error('사진에서 얼굴을 찾지 못했습니다'); VE.idb.put('cache', ck, L).catch(() => { }); }
      const W = img.naturalWidth, H = img.naturalHeight, px = new Float32Array(N * 2); for (let i = 0; i < N; i++) { px[i * 2] = L[i * 2] * W; px[i * 2 + 1] = L[i * 2 + 1] * H; }
      const fw = Math.hypot(px[454 * 2] - px[234 * 2], px[454 * 2 + 1] - px[234 * 2 + 1]);
      const uv = new Float32Array((N + 1) * 2); for (let i = 0; i < N * 2; i++) uv[i] = L[i];
      const m = buildMesh(px, fw, img);
      src.set(id, { img, uv, face: m.face, hull: m.hull, tex: null });
      VE.emit('chars'); return true;
    } catch (e) { console.warn('얼굴 덮기 준비 실패', id, e); src.set(id, 'fail'); return false; }
  };

  /* ---------- 그리기 ----------
     c: 2D 그림판, pts: 출력 그림판 좌표의 기준점 468개(x,y) */
  const crop = document.createElement('canvas'), cropC = crop.getContext('2d');
  SW.draw = (c, pts, id) => {
    const s = src.get(id); if (!s || s === 'busy' || s === 'fail') { if (!s) SW.prepare(id); return false; }
    if (!init()) return false;
    const W = c.canvas.width, H = c.canvas.height;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < N; i++) { const x = pts[i * 2], y = pts[i * 2 + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const pad = Math.max(x1 - x0, y1 - y0) * .2; x0 = Math.max(0, Math.floor(x0 - pad)); y0 = Math.max(0, Math.floor(y0 - pad)); x1 = Math.min(W, Math.ceil(x1 + pad)); y1 = Math.min(H, Math.ceil(y1 + pad));
    const bw = x1 - x0, bh = y1 - y0; if (bw < 8 || bh < 8) return false;
    const k = Math.min(1, 720 / Math.max(bw, bh)), cw = Math.max(8, Math.round(bw * k)), ch = Math.max(8, Math.round(bh * k));
    crop.width = cw; crop.height = ch; cropC.drawImage(c.canvas, x0, y0, bw, bh, 0, 0, cw, ch);
    cv.width = cw; cv.height = ch;
    if (!s.tex) s.tex = tex(s.img);
    const base = tex(crop);
    const pos = new Float32Array((N + 1) * 2); let mx = 0, my = 0; for (let i = 0; i < N; i++) { pos[i * 2] = (pts[i * 2] - x0) * k; pos[i * 2 + 1] = (pts[i * 2 + 1] - y0) * k; }
    for (const i of MOUTH_IN) { mx += pos[i * 2]; my += pos[i * 2 + 1]; } pos[N * 2] = mx / MOUTH_IN.length; pos[N * 2 + 1] = my / MOUTH_IN.length;
    const fwPx = Math.hypot(pos[454 * 2] - pos[234 * 2], pos[454 * 2 + 1] - pos[234 * 2 + 1]);
    /* 1) 사진 얼굴을 영상 얼굴 모양으로, 2) 가장자리용 얼굴 전체, 3) 영상 속 입안 */
    const A = target('face', cw, ch), Hl = target('hull', cw, ch), Mo = target('hole', cw, ch);
    mesh(A.fb, cw, ch, pos, s.uv, s.face, s.tex, false);
    mesh(Hl.fb, cw, ch, pos, s.uv, s.hull, s.tex, true);
    mesh(Mo.fb, cw, ch, pos, s.uv, HOLE, s.tex, true);
    /* 4) 가장자리 흐림 (얼굴 너비의 약 7%), 입안은 살짝만 */
    const hullT = blur(Hl.t, cw, ch, Math.max(1, fwPx * .012), target('hb1', cw, ch), target('hb2', cw, ch));
    const holeT = blur(Mo.t, cw, ch, Math.max(.5, fwPx * .0025), target('mb1', cw, ch), target('mb2', cw, ch));
    /* 5) 조명 맞추기: 사진 얼굴과 장면을 크게 흐려(얼굴 자리만) 나눈 비율을 곱함 */
    const sw = Math.max(8, cw >> 2), sh = Math.max(8, ch >> 2);
    const pre = (srcT, out) => { gl.useProgram(P.pre); gl.uniform1f(U(P.pre, 'uFlip'), 1); gl.bindFramebuffer(gl.FRAMEBUFFER, out.fb); gl.viewport(0, 0, sw, sh); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcT); gl.uniform1i(U(P.pre, 'uSrc'), 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(U(P.pre, 'uMask'), 1); quad(P.pre); gl.activeTexture(gl.TEXTURE0); };
    const rL = Math.max(1, fwPx / 4 * .075); /* 눈 · 눈썹보다 큰 범위의 밝기만 옮김 (원래 얼굴 모양이 비치지 않게) */
    pre(A.t, target('pf', sw, sh)); const lowF = blur(fbo.pf.t, sw, sh, rL, target('lf1', sw, sh), target('lf2', sw, sh));
    pre(base, target('pb', sw, sh)); const lowB = blur(fbo.pb.t, sw, sh, rL, target('lb1', sw, sh), target('lb2', sw, sh));
    /* 6) 섞어 그리기 (화면 출력은 위아래가 뒤집혀 있어 uFlip) */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cw, ch); gl.useProgram(P.mix); gl.uniform1f(U(P.mix, 'uFlip'), -1); gl.uniform1f(U(P.mix, 'uLight'), .9);
    const bind = (unit, t, name) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(U(P.mix, name), unit); };
    bind(0, base, 'uBase'); bind(1, A.t, 'uFace'); bind(2, hullT, 'uHull'); bind(3, holeT, 'uHole'); bind(4, lowF, 'uLowF'); bind(5, lowB, 'uLowB');
    quad(P.mix); gl.activeTexture(gl.TEXTURE0); gl.deleteTexture(base);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(cv, 0, 0, cw, ch, x0, y0, bw, bh); c.restore();
    return true;
  };
})();
