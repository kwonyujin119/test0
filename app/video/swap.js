/* 영상 작업장 — 얼굴 덮기 (가상 인물 사진의 얼굴을 영상 속 얼굴 모양에 맞춰 휘어 덮는다)
   - 얼굴 기준점 468개(MediaPipe)로 사진 얼굴을 삼각형 그물로 나누고, 장면마다 영상 속 같은 기준점 자리로 휘어 그린다(WebGL)
   - 눈·입·표정·고개가 원래 얼굴을 그대로 따라가므로 원래 목소리와 입 모양이 저절로 맞는다
   - 입안은 비워 두어 원래 영상의 이·혀가 보이고, 피부색·밝기를 장면에 맞추고 경계를 흐리게 섞는다
   - 실제 사람처럼 보이므로 'AI 캐릭터' 표시를 끌 수 없다(render.js). 내장 가상 인물 사진에만 쓴다 */
'use strict';
(() => {
  const N = 468;
  const UPPER_IN = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308], LOWER_IN = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];
  const LIP_LOW = new Set(LOWER_IN.slice(1, -1));
  const LIPS_OUT = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];

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
  /* 사진 기준점 → 그릴 삼각형 목록. 입이 다물린 사진도 입안 삼각형이 생기지 않게 아랫입술을 살짝 내린 모양으로 나눈다 */
  function buildMesh(L, fw) {
    const P = new Float32Array(L.slice(0, N * 2)), Q = new Float32Array(P), gap = fw * .06;
    for (const i of LIP_LOW) Q[i * 2 + 1] += gap;
    /* 입술과 입안은 덮지 않고 원래 영상의 입을 그대로 보여 준다 → 말하는 입 모양이 원래 목소리와 언제나 맞음 */
    const mouth = LIPS_OUT.map(i => [Q[i * 2], Q[i * 2 + 1]]);
    /* 이마 위쪽은 앞머리가 섞여 있기 쉬워 덮지 않음 (눈썹에서 눈-눈썹 거리의 0.7배 위까지만) */
    const avgY = ids => ids.reduce((s, i) => s + Q[i * 2 + 1], 0) / ids.length, browY = avgY([105, 66, 334, 296, 107, 336]), eyeY = avgY([159, 145, 386, 374]), cut = browY - (eyeY - browY) * .45;
    const tris = delaunay(Q).filter(t => { const cx = (Q[t[0] * 2] + Q[t[1] * 2] + Q[t[2] * 2]) / 3, cy = (Q[t[0] * 2 + 1] + Q[t[1] * 2 + 1] + Q[t[2] * 2 + 1]) / 3; return !inPoly(cx, cy, mouth) && Math.min(Q[t[0] * 2 + 1], Q[t[1] * 2 + 1], Q[t[2] * 2 + 1]) >= cut; });
    return Uint16Array.from(tris.flat());
  }

  /* ---------- WebGL ---------- */
  let gl = null, cv = null, P = {}, buf = {}, fbo = {}, failed = false;
  const VS_TRI = `#version 300 es
in vec2 aPos; in vec2 aUV; uniform vec2 uSize; out vec2 vUV;
void main(){ vUV = aUV; vec2 p = aPos / uSize * 2.0 - 1.0; gl_Position = vec4(p, 0.0, 1.0); }`;
  const FS_TRI = `#version 300 es
precision highp float; in vec2 vUV; uniform sampler2D uTex; out vec4 o;
void main(){ vec4 c = texture(uTex, vUV); o = vec4(c.rgb, c.a > 0.5 ? 1.0 : 0.0); }`;
  const VS_Q = `#version 300 es
in vec2 aPos; uniform float uFlip; out vec2 vUV;
void main(){ vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos.x, aPos.y * uFlip, 0.0, 1.0); }`;
  const FS_BLUR = `#version 300 es
precision highp float; in vec2 vUV; uniform sampler2D uTex; uniform vec2 uDir; out vec4 o;
void main(){ float s = 0.0, w = 0.0; for (int i = -6; i <= 6; i++) { float k = exp(-float(i*i) / 18.0); s += texture(uTex, vUV + uDir * float(i)).a * k; w += k; } o = vec4(0.0, 0.0, 0.0, s / w); }`;
  const FS_MIX = `#version 300 es
precision highp float; in vec2 vUV; uniform sampler2D uBase, uFace, uMask; uniform vec3 uGain, uBias; out vec4 o;
void main(){ vec3 b = texture(uBase, vUV).rgb; vec3 f = texture(uFace, vUV).rgb * uGain + uBias; float m = clamp((texture(uMask, vUV).a - 0.5) * 2.4, 0.0, 1.0); o = vec4(mix(b, clamp(f, 0.0, 1.0), m), 1.0); }`;
  function prog(vs, fs) {
    const mk = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p;
  }
  function init() {
    if (gl || failed) return !!gl;
    try {
      cv = document.createElement('canvas'); gl = cv.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
      if (!gl) throw new Error('WebGL2 없음');
      P.tri = prog(VS_TRI, FS_TRI); P.blur = prog(VS_Q, FS_BLUR); P.mix = prog(VS_Q, FS_MIX);
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

  /* ---------- 가상 인물 사진 준비 ---------- */
  const src = new Map(); /* id → { img, tex, uv, idx, n } | 'busy' | 'fail' */
  const SW = VE.swap = {};
  SW.can = id => !!(VE.CHARS && VE.CHARS[id] && VE.CHARS[id].photo);
  SW.ready = id => { const s = src.get(id); return !!(s && s !== 'busy' && s !== 'fail'); };
  SW.prepare = async (id) => {
    if (!SW.can(id)) return false; const s0 = src.get(id); if (s0 && s0 !== 'busy') return s0 !== 'fail'; if (s0 === 'busy') { while (src.get(id) === 'busy') await new Promise(r => setTimeout(r, 50)); return SW.ready(id); }
    src.set(id, 'busy');
    try {
      await VE.CHARS[id].load(); const img = VE.charPhoto(id); if (!img) throw new Error('사진 없음');
      let L = await VE.idb.get('cache', 'mesh:' + id + ':' + img.src.split('/').pop()).catch(() => null);
      if (!L) { L = await VE.imageLandmarks(img); if (!L) throw new Error('사진에서 얼굴을 찾지 못했습니다'); VE.idb.put('cache', 'mesh:' + id + ':' + img.src.split('/').pop(), L).catch(() => { }); }
      const W = img.naturalWidth, H = img.naturalHeight, px = new Float32Array(N * 2); for (let i = 0; i < N; i++) { px[i * 2] = L[i * 2] * W; px[i * 2 + 1] = L[i * 2 + 1] * H; }
      const fw = Math.hypot(px[454 * 2] - px[234 * 2], px[454 * 2 + 1] - px[234 * 2 + 1]);
      const uv = new Float32Array(N * 2); for (let i = 0; i < N * 2; i++) uv[i] = L[i];
      src.set(id, { img, uv, idx: buildMesh(px, fw), tex: null });
      VE.emit('chars'); return true;
    } catch (e) { console.warn('얼굴 덮기 준비 실패', id, e); src.set(id, 'fail'); return false; }
  };

  /* ---------- 그리기 ----------
     c: 2D 그림판, pts: 출력 그림판 좌표의 기준점 468개(x,y), key: 색 맞춤을 이어 쓰는 열쇠 */
  const crop = document.createElement('canvas'), cropC = crop.getContext('2d', { willReadFrequently: true });
  const tone = new Map();
  SW.draw = (c, pts, id, key, t) => {
    const s = src.get(id); if (!s || s === 'busy' || s === 'fail') { if (!s) SW.prepare(id); return false; }
    if (!init()) return false;
    const W = c.canvas.width, H = c.canvas.height;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < N; i++) { const x = pts[i * 2], y = pts[i * 2 + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const pad = Math.max(x1 - x0, y1 - y0) * .18; x0 = Math.max(0, Math.floor(x0 - pad)); y0 = Math.max(0, Math.floor(y0 - pad)); x1 = Math.min(W, Math.ceil(x1 + pad)); y1 = Math.min(H, Math.ceil(y1 + pad));
    const bw = x1 - x0, bh = y1 - y0; if (bw < 8 || bh < 8) return false;
    const k = Math.min(1, 640 / Math.max(bw, bh)), cw = Math.max(8, Math.round(bw * k)), ch = Math.max(8, Math.round(bh * k));
    crop.width = cw; crop.height = ch; cropC.drawImage(c.canvas, x0, y0, bw, bh, 0, 0, cw, ch);
    cv.width = cw; cv.height = ch; gl.viewport(0, 0, cw, ch);
    if (!s.tex) s.tex = tex(s.img);
    const base = tex(crop);
    /* 1) 사진 얼굴을 영상 얼굴 모양으로 휘어 그림 */
    const A = target('face', cw, ch); gl.bindFramebuffer(gl.FRAMEBUFFER, A.fb); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const pos = new Float32Array(N * 2); for (let i = 0; i < N; i++) { pos[i * 2] = (pts[i * 2] - x0) * k; pos[i * 2 + 1] = (pts[i * 2 + 1] - y0) * k; }
    gl.useProgram(P.tri); gl.uniform2f(gl.getUniformLocation(P.tri, 'uSize'), cw, ch);
    const aP = gl.getAttribLocation(P.tri, 'aPos'), aU = gl.getAttribLocation(P.tri, 'aUV');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.pos); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.uv); gl.bufferData(gl.ARRAY_BUFFER, s.uv, gl.STATIC_DRAW); gl.enableVertexAttribArray(aU); gl.vertexAttribPointer(aU, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, s.idx, gl.STATIC_DRAW);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, s.tex); gl.uniform1i(gl.getUniformLocation(P.tri, 'uTex'), 0);
    gl.drawElements(gl.TRIANGLES, s.idx.length, gl.UNSIGNED_SHORT, 0); gl.disableVertexAttribArray(aP); gl.disableVertexAttribArray(aU);
    /* 2) 피부색 · 밝기 맞추기: 덮을 자리의 원래 색과 사진 얼굴 색의 평균·퍼짐을 맞춤 (장면 사이 깜빡임은 이전 값과 섞어 줄임) */
    const fp = new Uint8Array(cw * ch * 4); gl.readPixels(0, 0, cw, ch, gl.RGBA, gl.UNSIGNED_BYTE, fp);
    /* 피부처럼 밝은 곳만 비교 (머리카락 · 눈썹 · 눈은 빼서 색이 들뜨지 않게), 곱하기로 맞춰 어두운 곳은 어둡게 둠 */
    const bp = cropC.getImageData(0, 0, cw, ch).data; const sF = [0, 0, 0], sB = [0, 0, 0]; let n = 0;
    const skin = (r, g, b) => r > 60 && r >= g && r >= b && (r + g + b) > 200;
    for (let y = 0; y < ch; y += 3) for (let x = 0; x < cw; x += 3) { const i = (y * cw + x) * 4; if (fp[i + 3] < 200) continue; if (!skin(fp[i], fp[i + 1], fp[i + 2]) || !skin(bp[i], bp[i + 1], bp[i + 2])) continue; for (let q = 0; q < 3; q++) { sF[q] += fp[i + q] / 255; sB[q] += bp[i + q] / 255; } n++; }
    let gain = [1, 1, 1], bias = [0, 0, 0];
    if (n > 30) for (let q = 0; q < 3; q++) { const mF = sF[q] / n, mB = sB[q] / n; gain[q] = 1 + (Math.max(.75, Math.min(1.35, (mB + .02) / (mF + .02))) - 1) * .85; }
    const prev = tone.get(key); if (prev && Math.abs(prev.t - t) < .25) { for (let q = 0; q < 3; q++) { gain[q] = prev.g[q] * .6 + gain[q] * .4; bias[q] = prev.b[q] * .6 + bias[q] * .4; } }
    tone.set(key, { t, g: gain, b: bias });
    /* 3) 경계 흐리기: 얼굴 자리의 투명도를 가로·세로로 흐림 */
    const rad = Math.max(1, Math.hypot(pos[454 * 2] - pos[234 * 2], pos[454 * 2 + 1] - pos[234 * 2 + 1]) * .012);
    const B1 = target('b1', cw, ch), B2 = target('b2', cw, ch);
    gl.useProgram(P.blur); gl.uniform1f(gl.getUniformLocation(P.blur, 'uFlip'), 1); gl.uniform1i(gl.getUniformLocation(P.blur, 'uTex'), 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, B1.fb); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform2f(gl.getUniformLocation(P.blur, 'uDir'), rad / cw, 0); quad(P.blur);
    gl.bindFramebuffer(gl.FRAMEBUFFER, B2.fb); gl.bindTexture(gl.TEXTURE_2D, B1.t); gl.uniform2f(gl.getUniformLocation(P.blur, 'uDir'), 0, rad / ch); quad(P.blur);
    /* 4) 섞어 그리기 (화면 출력은 위아래가 뒤집혀 있어 uFlip) */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.useProgram(P.mix); gl.uniform1f(gl.getUniformLocation(P.mix, 'uFlip'), -1);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, base); gl.uniform1i(gl.getUniformLocation(P.mix, 'uBase'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(gl.getUniformLocation(P.mix, 'uFace'), 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, B2.t); gl.uniform1i(gl.getUniformLocation(P.mix, 'uMask'), 2);
    gl.uniform3fv(gl.getUniformLocation(P.mix, 'uGain'), gain); gl.uniform3fv(gl.getUniformLocation(P.mix, 'uBias'), bias);
    quad(P.mix); gl.activeTexture(gl.TEXTURE0); gl.deleteTexture(base);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(cv, 0, 0, cw, ch, x0, y0, bw, bh); c.restore();
    return true;
  };
})();
