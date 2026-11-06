/* PPT(.pptx) 안의 심벌 꺼내기
   슬라이드에 놓인 그림 · 도형 · 묶음(그룹)을 하나씩 떼어 내어 편집기에서 쓸 수 있는 그림으로 만듭니다.
   · 그림(PNG·JPG·GIF·SVG)은 PPT 에 든 원본 파일 그대로
   · 도형·묶음은 모양(자유형 · 자주 쓰는 기본 도형) · 색 · 선 · 글자를 읽어 SVG 그림으로 다시 그림 (크게 늘려도 또렷함)
   · 한두 글자짜리 글 상자(★ ① 같은 기호)는 글자 심벌로
   브라우저 안에서만 동작하며, PowerPoint 가 없어도 됩니다. 필요한 부분만 읽으므로 큰 파일도 빠릅니다.
   쓰는 곳: app/editor.js (PPT 심벌 창). ZIP 읽기는 편집기의 함수(zipIndex · zipBlob · pptRels · extOf)를 받아서 씀 */
const PPTSYM = (() => {
  const PX = 9525; // EMU → px (96dpi)
  const kid = (el, n) => { if (!el) return null; for (const c of el.children) if (c.localName === n) return c; return null; };
  const kids = (el, n) => el ? Array.from(el.children).filter(c => c.localName === n) : [];
  const attr = (el, a, d) => { const v = el ? el.getAttribute(a) : null; return v == null ? d : v; };
  const numA = (el, a, d) => { const v = parseFloat(attr(el, a, '')); return isFinite(v) ? v : d; };
  const f2 = (v) => { const n = +(+v).toFixed(2); return isFinite(n) ? n : 0; };
  const X = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', svg: 'image/svg+xml', webp: 'image/webp' };
  const graphemes = (s) => (window.Intl && Intl.Segmenter) ? Array.from(new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(s), x => x.segment) : Array.from(s);

  /* ---------- 색 ---------- */
  const PRST_CLR = { black: '000000', white: 'ffffff', red: 'ff0000', green: '008000', blue: '0000ff', yellow: 'ffff00', gray: '808080', grey: '808080', orange: 'ffa500', purple: '800080', cyan: '00ffff', magenta: 'ff00ff', lime: '00ff00', navy: '000080', silver: 'c0c0c0', maroon: '800000', teal: '008080', olive: '808000', pink: 'ffc0cb', brown: 'a52a2a', gold: 'ffd700' };
  const CLR_MAP = { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2' };
  const hexRgb = (h) => { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [0, 0, 0]; };
  const rgbHex = (c) => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  function rgbHsl(c) {
    const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l];
  }
  function hslRgb(h) {
    const [hh, s, l] = h; if (!s) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const t = (x) => { if (x < 0) x += 1; if (x > 1) x -= 1; return x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p; };
    return [t(hh + 1 / 3) * 255, t(hh) * 255, t(hh - 1 / 3) * 255];
  }
  /* 색을 담은 요소(solidFill · fillRef · gs …) → { c: '#rrggbb', a: 0~1 } */
  function colorOf(el, T) {
    if (!el) return null;
    for (const c of el.children) {
      let rgb;
      switch (c.localName) {
        case 'srgbClr': rgb = hexRgb(attr(c, 'val', '000000')); break;
        case 'sysClr': rgb = hexRgb(attr(c, 'lastClr', /window$/i.test(attr(c, 'val', '')) ? 'ffffff' : '000000')); break;
        case 'schemeClr': { const v = attr(c, 'val', ''); rgb = hexRgb(T.clr[CLR_MAP[v] || v] || '000000'); break; }
        case 'prstClr': rgb = hexRgb(PRST_CLR[attr(c, 'val', '')] || '000000'); break;
        case 'scrgbClr': rgb = ['r', 'g', 'b'].map(k => 255 * numA(c, k, 0) / 100000); break;
        default: continue;
      }
      let a = 1;
      for (const m of c.children) {
        const v = numA(m, 'val', 100000) / 100000;
        if (m.localName === 'alpha') a *= v;
        else if (m.localName === 'lumMod') { const h = rgbHsl(rgb); h[2] = Math.min(1, h[2] * v); rgb = hslRgb(h); }
        else if (m.localName === 'lumOff') { const h = rgbHsl(rgb); h[2] = Math.max(0, Math.min(1, h[2] + v)); rgb = hslRgb(h); }
        else if (m.localName === 'tint') rgb = rgb.map(x => x + (255 - x) * (1 - v));
        else if (m.localName === 'shade') rgb = rgb.map(x => x * v);
      }
      return { c: rgbHex(rgb), a: Math.max(0, Math.min(1, a)) };
    }
    return null;
  }
  function parseTheme(xml) {
    const T = { clr: { dk1: '000000', lt1: 'ffffff', dk2: '44546a', lt2: 'e7e6e6', accent1: '4472c4', accent2: 'ed7d31', accent3: 'a5a5a5', accent4: 'ffc000', accent5: '5b9bd5', accent6: '70ad47', hlink: '0563c1', folHlink: '954f72' }, ln: [9525, 12700, 19050] };
    if (!xml) return T;
    try {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const cs = doc.getElementsByTagNameNS('*', 'clrScheme')[0];
      if (cs) for (const c of cs.children) { const v = c.firstElementChild; if (!v) continue; const hex = v.localName === 'srgbClr' ? attr(v, 'val') : attr(v, 'lastClr'); if (hex) T.clr[c.localName] = hex; }
      const ls = doc.getElementsByTagNameNS('*', 'lnStyleLst')[0]; if (ls && kids(ls, 'ln').length) T.ln = kids(ls, 'ln').map(l => numA(l, 'w', 9525));
    } catch (e) { }
    return T;
  }

  /* ---------- 채우기 · 선 ---------- */
  function fillOf(spPr, style, C) { // → null(없음) | { c, a } | { stops, ang, radial } | { img: blipFill }
    for (const c of spPr ? spPr.children : []) {
      switch (c.localName) {
        case 'noFill': return null;
        case 'solidFill': return colorOf(c, C.T);
        case 'pattFill': return colorOf(kid(c, 'fgClr'), C.T);
        case 'blipFill': return { img: c };
        case 'grpFill': return C.grpFill || null;
        case 'gradFill': {
          const stops = kids(kid(c, 'gsLst'), 'gs').map(g => ({ p: numA(g, 'pos', 0) / 1000, col: colorOf(g, C.T) })).filter(s => s.col).sort((a, b) => a.p - b.p);
          if (!stops.length) return null; if (stops.length === 1) return stops[0].col;
          return { stops, ang: numA(kid(c, 'lin'), 'ang', 0) / 60000, radial: !!kid(c, 'path') };
        }
      }
    }
    const fr = style && kid(style, 'fillRef'); if (fr && numA(fr, 'idx', 0) > 0) return colorOf(fr, C.T);
    return null;
  }
  const DASH = { dash: [4, 3], sysDash: [3, 1], sysDot: [1, 1], dot: [1, 3], dashDot: [4, 3, 1, 3], lgDash: [8, 3], lgDashDot: [8, 3, 1, 3], lgDashDotDot: [8, 3, 1, 3, 1, 3], sysDashDot: [3, 1, 1, 1], sysDashDotDot: [3, 1, 1, 1, 1, 1] };
  function lineOf(spPr, style, C) { // → null | { c, a, w(px), dash, head, tail, cap }
    const ln = kid(spPr, 'ln'); let col = null, w = null;
    if (ln) {
      if (kid(ln, 'noFill')) return null;
      if (kid(ln, 'solidFill')) col = colorOf(kid(ln, 'solidFill'), C.T);
      else if (kid(ln, 'gradFill')) col = colorOf(kid(kid(kid(ln, 'gradFill'), 'gsLst'), 'gs'), C.T);
      if (ln.hasAttribute('w')) w = numA(ln, 'w', 9525);
    }
    const lr = style && kid(style, 'lnRef'), idx = lr ? numA(lr, 'idx', 0) : 0;
    if (!col) { if (idx > 0) col = colorOf(lr, C.T); else if (ln && !lr && w != null) col = { c: '#000000', a: 1 }; }
    if (!col) return null;
    if (w == null) w = idx > 0 ? (C.T.ln[idx - 1] || 9525) : 9525;
    const end = (n) => { const e = kid(ln, n), t = attr(e, 'type', 'none'); return t === 'none' ? '' : t; };
    return { c: col.c, a: col.a, w: Math.max(0.5, w / PX), dash: DASH[attr(kid(ln, 'prstDash'), 'val', '')] || null, head: ln ? end('headEnd') : '', tail: ln ? end('tailEnd') : '', cap: attr(ln, 'cap', '') === 'rnd' ? 'round' : '' };
  }

  /* ---------- 모양 ---------- */
  const P = (pts) => 'M' + pts.map(p => f2(p[0]) + ' ' + f2(p[1])).join('L') + 'Z';
  const ell = (cx, cy, rx, ry) => `M${f2(cx - rx)} ${f2(cy)}A${f2(rx)} ${f2(ry)} 0 1 0 ${f2(cx + rx)} ${f2(cy)}A${f2(rx)} ${f2(ry)} 0 1 0 ${f2(cx - rx)} ${f2(cy)}Z`;
  const rr = (w, h, tl, tr, br, bl) => `M${f2(tl)} 0L${f2(w - tr)} 0${tr ? `A${f2(tr)} ${f2(tr)} 0 0 1 ${f2(w)} ${f2(tr)}` : ''}L${f2(w)} ${f2(h - br)}${br ? `A${f2(br)} ${f2(br)} 0 0 1 ${f2(w - br)} ${f2(h)}` : ''}L${f2(bl)} ${f2(h)}${bl ? `A${f2(bl)} ${f2(bl)} 0 0 1 0 ${f2(h - bl)}` : ''}L0 ${f2(tl)}${tl ? `A${f2(tl)} ${f2(tl)} 0 0 1 ${f2(tl)} 0` : ''}Z`;
  /* PPT 의 각도(60000 분의 1 도, 시계 방향)로 타원 위의 점 */
  const ePt = (cx, cy, rx, ry, ang) => { const a = ang / 60000 * Math.PI / 180, t = Math.atan2(rx * Math.sin(a), ry * Math.cos(a)); return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]; };
  const sweep = (st, en) => { let s = (en - st) % 21600000; if (s <= 0) s += 21600000; return s; };
  function star(n, w, h, adj, hf, vf) {
    const rx = w / 2 * (hf || 1), ry = h / 2 * (vf || 1), cx = w / 2, cy = vf ? ry : h / 2, ix = rx * adj / 50000, iy = ry * adj / 50000, pts = [];
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n, b = a + Math.PI / n; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)], [cx + ix * Math.cos(b), cy + iy * Math.sin(b)]); }
    return P(pts);
  }
  const regular = (n, w, h) => { const pts = []; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push([w / 2 + w / 2 * Math.cos(a), h / 2 + h / 2 * Math.sin(a)]); } return pts; };
  function fitBox(pts, w, h) { // 정다각형을 상자에 꽉 차게
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    return pts.map(p => [(p[0] - x0) / (x1 - x0) * w, (p[1] - y0) / (y1 - y0) * h]);
  }
  const arrowR = (w, h, a1, a2) => { const ss = Math.min(w, h), dx = Math.min(w, ss * a2 / 100000), x1 = w - dx, dy = h * a1 / 200000, y1 = h / 2 - dy, y2 = h / 2 + dy; return [[0, y1], [x1, y1], [x1, 0], [w, h / 2], [x1, h], [x1, y2], [0, y2]]; };
  const flipX = (pts, w) => pts.map(p => [w - p[0], p[1]]);
  const swap = (pts) => pts.map(p => [p[1], p[0]]);
  /* 기본 도형 → 경로. a = 조절값(adj1, adj2 …) 없으면 PowerPoint 기본값 */
  const PRST = {
    rect: (w, h) => P([[0, 0], [w, 0], [w, h], [0, h]]),
    roundRect: (w, h, a) => { const r = Math.min(w, h) * Math.min(50000, a[0] == null ? 16667 : a[0]) / 100000; return rr(w, h, r, r, r, r); },
    round1Rect: (w, h, a) => { const r = Math.min(w, h) * (a[0] == null ? 16667 : a[0]) / 100000; return rr(w, h, 0, r, 0, 0); },
    round2SameRect: (w, h, a) => { const s = Math.min(w, h), r1 = s * (a[0] == null ? 16667 : a[0]) / 100000, r2 = s * (a[1] || 0) / 100000; return rr(w, h, r1, r1, r2, r2); },
    round2DiagRect: (w, h, a) => { const s = Math.min(w, h), r1 = s * (a[0] == null ? 16667 : a[0]) / 100000, r2 = s * (a[1] || 0) / 100000; return rr(w, h, r1, r2, r1, r2); },
    snip1Rect: (w, h, a) => { const d = Math.min(w, h) * (a[0] == null ? 16667 : a[0]) / 100000; return P([[0, 0], [w - d, 0], [w, d], [w, h], [0, h]]); },
    snip2SameRect: (w, h, a) => { const d = Math.min(w, h) * (a[0] == null ? 16667 : a[0]) / 100000; return P([[d, 0], [w - d, 0], [w, d], [w, h], [0, h], [0, d]]); },
    ellipse: (w, h) => ell(w / 2, h / 2, w / 2, h / 2),
    triangle: (w, h, a) => P([[w * (a[0] == null ? 50000 : a[0]) / 100000, 0], [w, h], [0, h]]),
    rtTriangle: (w, h) => P([[0, 0], [w, h], [0, h]]),
    diamond: (w, h) => P([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]),
    parallelogram: (w, h, a) => { const d = Math.min(w, Math.min(w, h) * (a[0] == null ? 25000 : a[0]) / 100000); return P([[d, 0], [w, 0], [w - d, h], [0, h]]); },
    trapezoid: (w, h, a) => { const d = Math.min(w / 2, Math.min(w, h) * (a[0] == null ? 25000 : a[0]) / 100000); return P([[d, 0], [w - d, 0], [w, h], [0, h]]); },
    pentagon: (w, h) => P(fitBox(regular(5, w, h), w, h)),
    hexagon: (w, h, a) => { const d = Math.min(w / 2, Math.min(w, h) * (a[0] == null ? 25000 : a[0]) / 100000); return P([[d, 0], [w - d, 0], [w, h / 2], [w - d, h], [d, h], [0, h / 2]]); },
    heptagon: (w, h) => P(fitBox(regular(7, w, h), w, h)),
    octagon: (w, h, a) => { const d = Math.min(w, h) * (a[0] == null ? 29289 : a[0]) / 100000; return P([[d, 0], [w - d, 0], [w, d], [w, h - d], [w - d, h], [d, h], [0, h - d], [0, d]]); },
    decagon: (w, h) => P(fitBox(regular(10, w, h), w, h)),
    dodecagon: (w, h) => P(fitBox(regular(12, w, h), w, h)),
    star4: (w, h, a) => star(4, w, h, a[0] == null ? 12500 : a[0]),
    star5: (w, h, a) => star(5, w, h, a[0] == null ? 19098 : a[0], 1.05146, 1.10557),
    star6: (w, h, a) => star(6, w, h, a[0] == null ? 28868 : a[0], 1.1547),
    star7: (w, h, a) => star(7, w, h, a[0] == null ? 34601 : a[0]),
    star8: (w, h, a) => star(8, w, h, a[0] == null ? 37500 : a[0]),
    star10: (w, h, a) => star(10, w, h, a[0] == null ? 42533 : a[0]),
    star12: (w, h, a) => star(12, w, h, a[0] == null ? 37500 : a[0]),
    star16: (w, h, a) => star(16, w, h, a[0] == null ? 37500 : a[0]),
    star24: (w, h, a) => star(24, w, h, a[0] == null ? 37500 : a[0]),
    star32: (w, h, a) => star(32, w, h, a[0] == null ? 37500 : a[0]),
    rightArrow: (w, h, a) => P(arrowR(w, h, a[0] == null ? 50000 : a[0], a[1] == null ? 50000 : a[1])),
    leftArrow: (w, h, a) => P(flipX(arrowR(w, h, a[0] == null ? 50000 : a[0], a[1] == null ? 50000 : a[1]), w)),
    downArrow: (w, h, a) => P(swap(arrowR(h, w, a[0] == null ? 50000 : a[0], a[1] == null ? 50000 : a[1]))),
    upArrow: (w, h, a) => P(swap(arrowR(h, w, a[0] == null ? 50000 : a[0], a[1] == null ? 50000 : a[1])).map(p => [p[0], h - p[1]])),
    leftRightArrow: (w, h, a) => { const a1 = a[0] == null ? 50000 : a[0], dx = Math.min(w / 2, Math.min(w, h) * (a[1] == null ? 50000 : a[1]) / 100000), dy = h * a1 / 200000, y1 = h / 2 - dy, y2 = h / 2 + dy; return P([[0, h / 2], [dx, 0], [dx, y1], [w - dx, y1], [w - dx, 0], [w, h / 2], [w - dx, h], [w - dx, y2], [dx, y2], [dx, h]]); },
    upDownArrow: (w, h, a) => { const a1 = a[0] == null ? 50000 : a[0], dy = Math.min(h / 2, Math.min(w, h) * (a[1] == null ? 50000 : a[1]) / 100000), dx = w * a1 / 200000, x1 = w / 2 - dx, x2 = w / 2 + dx; return P([[w / 2, 0], [w, dy], [x2, dy], [x2, h - dy], [w, h - dy], [w / 2, h], [0, h - dy], [x1, h - dy], [x1, dy], [0, dy]]); },
    chevron: (w, h, a) => { const d = Math.min(w, Math.min(w, h) * (a[0] == null ? 50000 : a[0]) / 100000); return P([[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h], [d, h / 2]]); },
    homePlate: (w, h, a) => { const d = Math.min(w, Math.min(w, h) * (a[0] == null ? 50000 : a[0]) / 100000); return P([[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h]]); },
    plus: (w, h, a) => { const d = Math.min(w, h) * (a[0] == null ? 25000 : a[0]) / 100000; return P([[d, 0], [w - d, 0], [w - d, d], [w, d], [w, h - d], [w - d, h - d], [w - d, h], [d, h], [d, h - d], [0, h - d], [0, d], [d, d]]); },
    donut: (w, h, a) => { const d = Math.min(w, h) * (a[0] == null ? 25000 : a[0]) / 100000; return ell(w / 2, h / 2, w / 2, h / 2) + ell(w / 2, h / 2, Math.max(0, w / 2 - d), Math.max(0, h / 2 - d)); },
    frame: (w, h, a) => { const d = Math.min(w, h) * (a[0] == null ? 12500 : a[0]) / 100000; return P([[0, 0], [w, 0], [w, h], [0, h]]) + P([[d, d], [d, h - d], [w - d, h - d], [w - d, d]]); },
    line: (w, h) => ({ d: `M0 0L${f2(w)} ${f2(h)}`, open: true, seg: [0, 0, w, h] }),
    bentConnector3: (w, h, a) => { const x = w * (a[0] == null ? 50000 : a[0]) / 100000; return { d: `M0 0L${f2(x)} 0L${f2(x)} ${f2(h)}L${f2(w)} ${f2(h)}`, open: true }; },
    bentConnector2: (w, h) => ({ d: `M0 0L${f2(w)} 0L${f2(w)} ${f2(h)}`, open: true }),
    curvedConnector3: (w, h, a) => { const x = w * (a[0] == null ? 50000 : a[0]) / 100000; return { d: `M0 0C${f2(x)} 0 ${f2(x)} ${f2(h)} ${f2(w)} ${f2(h)}`, open: true }; },
    arc: (w, h, a) => { const st = a[0] == null ? 16200000 : a[0], en = a[1] || 0, s = ePt(w / 2, h / 2, w / 2, h / 2, st), e = ePt(w / 2, h / 2, w / 2, h / 2, en); return { d: `M${f2(s[0])} ${f2(s[1])}A${f2(w / 2)} ${f2(h / 2)} 0 ${sweep(st, en) > 10800000 ? 1 : 0} 1 ${f2(e[0])} ${f2(e[1])}`, open: true }; },
    pie: (w, h, a) => { const st = a[0] || 0, en = a[1] == null ? 16200000 : a[1], s = ePt(w / 2, h / 2, w / 2, h / 2, st), e = ePt(w / 2, h / 2, w / 2, h / 2, en); return `M${f2(w / 2)} ${f2(h / 2)}L${f2(s[0])} ${f2(s[1])}A${f2(w / 2)} ${f2(h / 2)} 0 ${sweep(st, en) > 10800000 ? 1 : 0} 1 ${f2(e[0])} ${f2(e[1])}Z`; },
    chord: (w, h, a) => { const st = a[0] == null ? 2700000 : a[0], en = a[1] == null ? 16200000 : a[1], s = ePt(w / 2, h / 2, w / 2, h / 2, st), e = ePt(w / 2, h / 2, w / 2, h / 2, en); return `M${f2(s[0])} ${f2(s[1])}A${f2(w / 2)} ${f2(h / 2)} 0 ${sweep(st, en) > 10800000 ? 1 : 0} 1 ${f2(e[0])} ${f2(e[1])}Z`; },
    blockArc: (w, h, a) => {
      const st = a[0] == null ? 10800000 : a[0], en = a[1] || 0, d = Math.min(w, h) * (a[2] == null ? 25000 : a[2]) / 100000, rx = w / 2, ry = h / 2, ix = Math.max(0, rx - d), iy = Math.max(0, ry - d), big = sweep(st, en) > 10800000 ? 1 : 0;
      const s = ePt(rx, ry, rx, ry, st), e = ePt(rx, ry, rx, ry, en), s2 = ePt(rx, ry, ix, iy, st), e2 = ePt(rx, ry, ix, iy, en);
      return `M${f2(s[0])} ${f2(s[1])}A${f2(rx)} ${f2(ry)} 0 ${big} 1 ${f2(e[0])} ${f2(e[1])}L${f2(e2[0])} ${f2(e2[1])}A${f2(ix)} ${f2(iy)} 0 ${big} 0 ${f2(s2[0])} ${f2(s2[1])}Z`;
    },
    can: (w, h, a) => { const ry = Math.min(h / 2, Math.min(w, h) * (a[0] == null ? 25000 : a[0]) / 200000); return [`M0 ${f2(ry)}A${f2(w / 2)} ${f2(ry)} 0 0 1 ${f2(w)} ${f2(ry)}L${f2(w)} ${f2(h - ry)}A${f2(w / 2)} ${f2(ry)} 0 0 1 0 ${f2(h - ry)}Z`, { d: `M0 ${f2(ry)}A${f2(w / 2)} ${f2(ry)} 0 0 0 ${f2(w)} ${f2(ry)}`, open: true }]; },
    heart: (w, h) => `M${f2(w / 2)} ${f2(h)}C${f2(-w * 0.34)} ${f2(h * 0.46)} ${f2(w * 0.1)} ${f2(-h * 0.26)} ${f2(w / 2)} ${f2(h * 0.24)}C${f2(w * 0.9)} ${f2(-h * 0.26)} ${f2(w * 1.34)} ${f2(h * 0.46)} ${f2(w / 2)} ${f2(h)}Z`,
    flowChartTerminator: (w, h) => { const r = Math.min(w, h) / 2; return rr(w, h, r, r, r, r); },
    mathMinus: (w, h) => P([[w * 0.13, h * 0.38], [w * 0.87, h * 0.38], [w * 0.87, h * 0.62], [w * 0.13, h * 0.62]]),
  };
  const ALIAS = { straightConnector1: 'line', flowChartProcess: 'rect', flowChartAlternateProcess: 'roundRect', flowChartDecision: 'diamond', flowChartConnector: 'ellipse', flowChartInputOutput: 'parallelogram', flowChartPreparation: 'hexagon', flowChartManualOperation: 'trapezoid', flowChartMerge: 'triangle', flowChartExtract: 'triangle', notchedRightArrow: 'rightArrow', stripedRightArrow: 'rightArrow', mathPlus: 'plus', noSmoking: 'donut', snipRoundRect: 'round1Rect', snip2DiagRect: 'rect', wedgeRectCallout: 'rect', wedgeRoundRectCallout: 'roundRect', wedgeEllipseCallout: 'ellipse', bevel: 'rect', cube: 'rect', foldedCorner: 'rect', plaque: 'roundRect', flowChartOr: 'ellipse', flowChartSummingJunction: 'ellipse', bentConnector4: 'bentConnector3', bentConnector5: 'bentConnector3', curvedConnector2: 'curvedConnector3', curvedConnector4: 'curvedConnector3', curvedConnector5: 'curvedConnector3' };
  const EXACT = new Set(['straightConnector1', 'flowChartProcess', 'flowChartAlternateProcess', 'flowChartDecision', 'flowChartConnector', 'flowChartInputOutput', 'flowChartPreparation', 'mathPlus']);
  /* → { parts: [{ d, fill(bool), stroke(bool), open, seg }], approx } */
  function geomOf(spPr, w, h) {
    const cg = kid(spPr, 'custGeom');
    if (cg) {
      const parts = [];
      for (const p of kids(kid(cg, 'pathLst'), 'path')) {
        const pw = numA(p, 'w', 0), ph = numA(p, 'h', 0), sx = pw ? w / pw : 1 / PX, sy = ph ? h / ph : 1 / PX;
        let d = '', cx = 0, cy = 0, closed = false;
        const pt = (e) => [numA(e, 'x', 0) * sx, numA(e, 'y', 0) * sy];
        for (const c of p.children) {
          const ps = kids(c, 'pt').map(pt);
          if (c.localName === 'moveTo' && ps[0]) { d += `M${f2(ps[0][0])} ${f2(ps[0][1])}`;[cx, cy] = ps[0]; }
          else if (c.localName === 'lnTo' && ps[0]) { d += `L${f2(ps[0][0])} ${f2(ps[0][1])}`;[cx, cy] = ps[0]; }
          else if (c.localName === 'cubicBezTo' && ps.length >= 3) { d += 'C' + ps.slice(0, 3).map(q => f2(q[0]) + ' ' + f2(q[1])).join(' ');[cx, cy] = ps[2]; }
          else if (c.localName === 'quadBezTo' && ps.length >= 2) { d += 'Q' + ps.slice(0, 2).map(q => f2(q[0]) + ' ' + f2(q[1])).join(' ');[cx, cy] = ps[1]; }
          else if (c.localName === 'arcTo') {
            const rx = numA(c, 'wR', 0) * sx, ry = numA(c, 'hR', 0) * sy, st = numA(c, 'stAng', 0) / 60000 * Math.PI / 180, sw = numA(c, 'swAng', 0) / 60000 * Math.PI / 180;
            if (rx > 0 && ry > 0 && sw) {
              const par = (a) => Math.atan2(rx * Math.sin(a), ry * Math.cos(a)), t0 = par(st), ox = cx - rx * Math.cos(t0), oy = cy - ry * Math.sin(t0);
              const full = Math.abs(sw) >= Math.PI * 2 - 1e-6, n = full ? 2 : 1;
              for (let i = 1; i <= n; i++) {
                const a1 = st + sw * i / n, a0 = st + sw * (i - 1) / n; let dt = par(a1) - par(a0);
                if (sw > 0 && dt <= 0) dt += Math.PI * 2; if (sw < 0 && dt >= 0) dt -= Math.PI * 2;
                const t1 = par(a0) + dt, ex = ox + rx * Math.cos(t1), ey = oy + ry * Math.sin(t1);
                d += `A${f2(rx)} ${f2(ry)} 0 ${Math.abs(dt) > Math.PI ? 1 : 0} ${dt > 0 ? 1 : 0} ${f2(ex)} ${f2(ey)}`; cx = ex; cy = ey;
              }
            }
          }
          else if (c.localName === 'close') { d += 'Z'; closed = true; }
        }
        if (d) parts.push({ d, fill: attr(p, 'fill', 'norm') !== 'none', stroke: attr(p, 'stroke', '1') !== '0' && attr(p, 'stroke', 'true') !== 'false', open: !closed });
      }
      return { parts, approx: false };
    }
    const pg = kid(spPr, 'prstGeom'), name = attr(pg, 'prst', 'rect');
    const a = []; for (const g of kids(kid(pg, 'avLst'), 'gd')) { const m = /^adj(\d*)$/.exec(attr(g, 'name', '')), v = /val\s+(-?\d+)/.exec(attr(g, 'fmla', '')); if (m && v) a[Math.max(0, (parseInt(m[1] || '1', 10) || 1) - 1)] = parseInt(v[1], 10); }
    const fn = PRST[name] || PRST[ALIAS[name]];
    let out = fn ? fn(w, h, a) : (/arc|circle|ellipse|sun|moon|smiley|cloud/i.test(name) ? PRST.ellipse(w, h, a) : PRST.rect(w, h, a));
    const approx = !PRST[name] && !EXACT.has(name) || name === 'heart';
    const parts = (Array.isArray(out) ? out : [out]).map(o => typeof o === 'string' ? { d: o, fill: true, stroke: true, open: false } : { d: o.d, fill: !o.open, stroke: true, open: !!o.open, seg: o.seg });
    return { parts, approx };
  }

  /* ---------- 위치 · 회전 ---------- */
  function xfOf(x) { // a:xfrm → { x, y, w, h, rot, fh, fv, ch }
    if (!x) return null; const off = kid(x, 'off'), ext = kid(x, 'ext'); if (!off || !ext) return null;
    const o = { x: numA(off, 'x', 0) / PX, y: numA(off, 'y', 0) / PX, w: numA(ext, 'cx', 0) / PX, h: numA(ext, 'cy', 0) / PX, rot: numA(x, 'rot', 0) / 60000, fh: attr(x, 'flipH', '0') === '1' || attr(x, 'flipH', '') === 'true', fv: attr(x, 'flipV', '0') === '1' || attr(x, 'flipV', '') === 'true' };
    const co = kid(x, 'chOff'), ce = kid(x, 'chExt');
    if (co && ce) o.ch = { x: numA(co, 'x', 0) / PX, y: numA(co, 'y', 0) / PX, w: numA(ce, 'cx', 0) / PX, h: numA(ce, 'cy', 0) / PX };
    return o;
  }
  function tf(x, noFlip) {
    let s = `translate(${f2(x.x)} ${f2(x.y)})`;
    if (x.rot) s += ` rotate(${f2(x.rot)} ${f2(x.w / 2)} ${f2(x.h / 2)})`;
    if (!noFlip && (x.fh || x.fv)) s += ` translate(${x.fh ? f2(x.w) : 0} ${x.fv ? f2(x.h) : 0}) scale(${x.fh ? -1 : 1} ${x.fv ? -1 : 1})`;
    return s;
  }
  function boxOf(x) { // 회전까지 넣은 바깥 상자
    const a = x.rot * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)), bw = x.w * c + x.h * s, bh = x.w * s + x.h * c;
    return { x: x.x + x.w / 2 - bw / 2, y: x.y + x.h / 2 - bh / 2, w: bw, h: bh };
  }

  /* ---------- 그림 파일 ---------- */
  function dataUrl(rid, C) {
    const r = rid && C.rels.get(rid); if (!r || r.external) return Promise.resolve(null);
    const type = MIME[C.extOf(r.target)]; if (!type || !C.has(r.target)) return Promise.resolve(null);
    if (!C.cache.has(r.target)) C.cache.set(r.target, C.blob(r.target, type).then(b => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(b); })).catch(() => null));
    return C.cache.get(r.target);
  }
  const blipRid = (bf) => { const blip = kid(bf, 'blip'); if (!blip) return ['', '']; const sv = blip.getElementsByTagNameNS('*', 'svgBlip')[0]; return [sv ? (sv.getAttribute('r:embed') || '') : '', blip.getAttribute('r:embed') || '']; };
  async function blipImage(bf, w, h, C, st) {
    const [svgId, rid] = blipRid(bf); const data = (svgId && await dataUrl(svgId, C)) || await dataUrl(rid, C);
    if (!data) { st.approx = true; st.lost++; return ''; }
    const sr = kid(bf, 'srcRect'), l = numA(sr, 'l', 0) / 100000, t = numA(sr, 't', 0) / 100000, r = numA(sr, 'r', 0) / 100000, b = numA(sr, 'b', 0) / 100000;
    const W = w / Math.max(0.01, 1 - l - r), H = h / Math.max(0.01, 1 - t - b), am = numA(kid(kid(bf, 'blip'), 'alphaModFix'), 'amt', 100000) / 100000;
    st.drawn++;
    return `<image href="${data}" x="${f2(-l * W)}" y="${f2(-t * H)}" width="${f2(W)}" height="${f2(H)}" preserveAspectRatio="none"${am < 1 ? ` opacity="${f2(am)}"` : ''}/>`;
  }

  /* ---------- 글자 ---------- */
  let _mc = null;
  const FONT = `'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo','Noto Sans KR',sans-serif`;
  function measure(t, px, bold) { if (!_mc) _mc = document.createElement('canvas').getContext('2d'); _mc.font = `${bold ? 'bold ' : ''}${px}px ${FONT}`; return _mc.measureText(t).width; }
  function readText(node) { // → [{ algn, runs: [{ t, sz, b, i, col }] }]
    const tb = kid(node, 'txBody'); if (!tb) return [];
    return kids(tb, 'p').map(p => {
      const runs = [];
      for (const r of p.children) {
        if (r.localName === 'br') { runs.push({ br: true }); continue; }
        if (r.localName !== 'r' && r.localName !== 'fld') continue;
        const rp = kid(r, 'rPr'), t = kid(r, 't'); if (!t || !t.textContent) continue;
        runs.push({ t: t.textContent, sz: numA(rp, 'sz', 0), b: attr(rp, 'b', '0') === '1', i: attr(rp, 'i', '0') === '1', fill: kid(rp, 'solidFill') });
      }
      return { algn: attr(kid(p, 'pPr'), 'algn', 'l'), runs };
    });
  }
  const plainText = (node) => readText(node).map(p => p.runs.map(r => r.br ? '\n' : r.t).join('')).join('\n').trim();
  function textSvg(node, x, C, st) {
    const paras = readText(node); if (!paras.some(p => p.runs.some(r => r.t && r.t.trim()))) return '';
    const bp = kid(kid(node, 'txBody'), 'bodyPr'), style = kid(node, 'style');
    const ins = ['lIns', 'tIns', 'rIns', 'bIns'].map((k, i) => numA(bp, k, [91440, 45720, 91440, 45720][i]) / PX);
    const anchor = attr(bp, 'anchor', 't'), wrap = attr(bp, 'wrap', 'square') !== 'none', scale = numA(kid(bp, 'normAutofit'), 'fontScale', 100000) / 100000;
    const defCol = (style && colorOf(kid(style, 'fontRef'), C.T)) || { c: '#' + C.T.clr.dk1, a: 1 };
    const aw = Math.max(4, x.w - ins[0] - ins[2]);
    const lines = []; // { algn, segs: [{ t, px, b, i, col }], w, fs }
    for (const p of paras) {
      let cur = { algn: p.algn, segs: [], w: 0, fs: 0 }; const push = () => { lines.push(cur); cur = { algn: p.algn, segs: [], w: 0, fs: cur.fs }; };
      let lastPx = 18 * 96 / 72 * scale;
      for (const r of p.runs) {
        if (r.br) { if (!cur.fs) cur.fs = lastPx; push(); continue; }
        const px = (r.sz || 1800) / 100 * 96 / 72 * scale, col = (r.fill && colorOf(r.fill, C.T)) || defCol; lastPx = px;
        const toks = r.t.match(/[　-鿿가-힯＀-￯]|[^\s　-鿿가-힯＀-￯]+\s*|\s+/g) || [];
        for (const tk of toks) {
          const tw = measure(tk, px, r.b);
          if (wrap && cur.segs.length && cur.w + measure(tk.replace(/\s+$/, ''), px, r.b) > aw + 0.5) push();
          const last = cur.segs[cur.segs.length - 1];
          if (last && last.px === px && last.b === r.b && last.i === r.i && last.col.c === col.c && last.col.a === col.a) last.t += tk; else cur.segs.push({ t: tk, px, b: r.b, i: r.i, col });
          cur.w += tw; cur.fs = Math.max(cur.fs, px);
        }
      }
      if (!cur.fs) cur.fs = lastPx;
      lines.push(cur);
    }
    while (lines.length && !lines[lines.length - 1].segs.length) lines.pop();
    const total = lines.reduce((a, l) => a + l.fs * 1.2, 0);
    let y = anchor === 'ctr' ? ins[1] + (x.h - ins[1] - ins[3] - total) / 2 : anchor === 'b' ? x.h - ins[3] - total : ins[1];
    let out = '';
    for (const l of lines) {
      const lh = l.fs * 1.2;
      if (l.segs.length) {
        const an = l.algn === 'ctr' ? 'middle' : l.algn === 'r' ? 'end' : 'start', tx = l.algn === 'ctr' ? ins[0] + aw / 2 : l.algn === 'r' ? x.w - ins[2] : ins[0];
        const segs = l.segs.slice(); segs[segs.length - 1] = Object.assign({}, segs[segs.length - 1], { t: segs[segs.length - 1].t.replace(/\s+$/, '') });
        out += `<text x="${f2(tx)}" y="${f2(y + lh * 0.5 + l.fs * 0.36)}" text-anchor="${an}" font-family="${FONT}" style="white-space:pre">${segs.map(s => `<tspan font-size="${f2(s.px)}" fill="${s.col.c}"${s.col.a < 1 ? ` fill-opacity="${f2(s.col.a)}"` : ''}${s.b ? ' font-weight="bold"' : ''}${s.i ? ' font-style="italic"' : ''}>${X(s.t)}</tspan>`).join('')}</text>`;
      }
      y += lh;
    }
    st.drawn++;
    return out;
  }

  /* ---------- 그리기 ---------- */
  function paint(fill, st) {
    if (!fill) return 'fill="none"';
    if (fill.stops) {
      const id = 'g' + (++st.n), stops = fill.stops.map(s => `<stop offset="${f2(s.p)}%" stop-color="${s.col.c}"${s.col.a < 1 ? ` stop-opacity="${f2(s.col.a)}"` : ''}/>`).join('');
      st.defs.push(fill.radial ? `<radialGradient id="${id}">${stops}</radialGradient>` : `<linearGradient id="${id}" gradientTransform="rotate(${f2(fill.ang)} .5 .5)">${stops}</linearGradient>`);
      return `fill="url(#${id})"`;
    }
    return `fill="${fill.c}"${fill.a < 1 ? ` fill-opacity="${f2(fill.a)}"` : ''}`;
  }
  function strokeAttr(ln) {
    if (!ln) return 'stroke="none"';
    return `stroke="${ln.c}" stroke-width="${f2(ln.w)}"${ln.a < 1 ? ` stroke-opacity="${f2(ln.a)}"` : ''} stroke-linejoin="round"${ln.cap ? ` stroke-linecap="${ln.cap}"` : ''}${ln.dash ? ` stroke-dasharray="${ln.dash.map(v => f2(v * ln.w)).join(' ')}"` : ''}`;
  }
  function arrowHead(x0, y0, x1, y1, ln, type) { // (x1,y1) 쪽 끝에 화살촉
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, L = Math.max(ln.w * 3.5, 7), W = Math.max(ln.w * 1.8, 3.5);
    if (type === 'oval' || type === 'diamond') return `<circle cx="${f2(x1)}" cy="${f2(y1)}" r="${f2(W)}" fill="${ln.c}"/>`;
    const bx = x1 - ux * L, by = y1 - uy * L;
    return `<path d="${P([[x1, y1], [bx - uy * W, by + ux * W], [bx + uy * W, by - ux * W]])}" fill="${ln.c}"${ln.a < 1 ? ` fill-opacity="${f2(ln.a)}"` : ''}/>`;
  }
  async function nodeSvg(node, C, st) {
    switch (node.localName) {
      case 'AlternateContent': { const c = kid(node, 'Fallback') || kid(node, 'Choice'); let s = ''; for (const n of c ? Array.from(c.children) : []) s += await nodeSvg(n, C, st); return s; }
      case 'grpSp': {
        const gp = kid(node, 'grpSpPr'), x = xfOf(kid(gp, 'xfrm')); let inner = '';
        const C2 = Object.assign({}, C, { grpFill: fillOf(gp, null, C) || C.grpFill });
        for (const n of Array.from(node.children)) inner += await nodeSvg(n, C2, st);
        if (!x) return inner;
        let t = tf(x); if (x.ch && x.ch.w && x.ch.h) t += ` scale(${+(x.w / x.ch.w).toFixed(5)} ${+(x.h / x.ch.h).toFixed(5)}) translate(${f2(-x.ch.x)} ${f2(-x.ch.y)})`; else t += ` translate(${f2(-x.x)} ${f2(-x.y)})`;
        return `<g transform="${t}">${inner}</g>`;
      }
      case 'pic': {
        const spPr = kid(node, 'spPr'), x = xfOf(kid(spPr, 'xfrm')); if (!x) return '';
        const im = await blipImage(kid(node, 'blipFill'), x.w, x.h, C, st); if (!im) return '';
        const g = geomOf(spPr, x.w, x.h), ln = lineOf(spPr, kid(node, 'style'), C), d = g.parts.filter(p => !p.open).map(p => p.d).join('');
        const id = 'c' + (++st.n); st.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
        if (ln) st.lw = Math.max(st.lw, ln.w);
        return `<g transform="${tf(x)}"><g clip-path="url(#${id})">${im}</g>${ln ? `<path d="${d}" fill="none" ${strokeAttr(ln)}/>` : ''}</g>`;
      }
      case 'sp': case 'cxnSp': {
        const spPr = kid(node, 'spPr'), x = xfOf(kid(spPr, 'xfrm')); if (!x) return '';
        const style = kid(node, 'style'), g = geomOf(spPr, x.w, x.h), fill = fillOf(spPr, style, C), ln = lineOf(spPr, style, C);
        if (g.approx && (fill || ln)) st.approx = true;
        let s = '';
        if (fill && fill.img) {
          const im = await blipImage(fill.img, x.w, x.h, C, st), d = g.parts.filter(p => !p.open).map(p => p.d).join('');
          if (im && d) { const id = 'c' + (++st.n); st.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); s += `<g clip-path="url(#${id})">${im}</g>`; }
        }
        const fa = fill && !fill.img ? fill : null;
        if (fa || ln) {
          const closed = g.parts.filter(p => !p.open), open = g.parts.filter(p => p.open);
          const fillD = closed.filter(p => p.fill).map(p => p.d).join(''), strokeD = closed.filter(p => p.stroke).map(p => p.d).join('');
          if (fillD && fillD === strokeD) s += `<path d="${fillD}" fill-rule="evenodd" ${paint(fa, st)} ${strokeAttr(ln)}/>`;
          else { if (fillD && fa) s += `<path d="${fillD}" fill-rule="evenodd" ${paint(fa, st)}/>`; if (strokeD && ln) s += `<path d="${strokeD}" fill="none" ${strokeAttr(ln)}/>`; }
          for (const p of open) {
            if (!ln) continue;
            let d = p.d;
            if (p.seg && (ln.head || ln.tail)) { // 화살표 선: 촉이 뭉툭해지지 않게 선을 조금 줄임
              let [x0, y0, x1, y1] = p.seg; const len = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / len, uy = (y1 - y0) / len, cut = Math.min(len / 3, Math.max(ln.w * 3.5, 7) * 0.8);
              const ox0 = x0, oy0 = y0, ox1 = x1, oy1 = y1;
              if (ln.head) { x0 += ux * cut; y0 += uy * cut; } if (ln.tail) { x1 -= ux * cut; y1 -= uy * cut; }
              d = `M${f2(x0)} ${f2(y0)}L${f2(x1)} ${f2(y1)}`;
              if (ln.head) s += arrowHead(ox1, oy1, ox0, oy0, ln, ln.head); if (ln.tail) s += arrowHead(ox0, oy0, ox1, oy1, ln, ln.tail);
              st.arrow = true;
            }
            s += `<path d="${d}" fill="none" ${strokeAttr(ln)}/>`;
          }
          if (ln) st.lw = Math.max(st.lw, ln.w);
          if (fillD || strokeD || open.length) st.drawn++;
        }
        const txt = textSvg(node, x, C, st);
        return (s ? `<g transform="${tf(x)}">${s}</g>` : '') + (txt ? `<g transform="${tf(x, true)}">${txt}</g>` : '');
      }
    }
    return '';
  }

  /* ---------- PPT 읽기 ---------- */
  const hasMedia = (node) => !!(node.getElementsByTagNameNS('*', 'videoFile')[0] || node.getElementsByTagNameNS('*', 'audioFile')[0]);
  const isPh = (node) => !!node.getElementsByTagNameNS('*', 'ph')[0];
  const nameOf = (node) => { for (const c of node.children) if (/^nv/.test(c.localName)) { const p = kid(c, 'cNvPr'); return attr(p, 'name', '') || ''; } return ''; };
  /* file: PPT 파일, Z: { zipIndex, zipBlob, pptRels, extOf } → { items, skipped, slides, slideW } */
  async function read(file, Z) {
    const idx = await Z.zipIndex(file), text = async (n) => (await Z.zipBlob(file, idx.get(n))).text();
    if (!idx.has('ppt/presentation.xml')) throw new Error('PowerPoint 파일(.pptx)이 아닙니다');
    const pres = await text('ppt/presentation.xml');
    const sz = /<p:sldSz\b[^>]*\bcx="(\d+)"/.exec(pres), slideW = sz ? parseInt(sz[1], 10) / PX : 1280;
    let order = [];
    try {
      const rels = Z.pptRels(await text('ppt/_rels/presentation.xml.rels'), 'ppt/presentation.xml');
      for (const m of pres.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)) { const r = rels.get(m[1]); if (r && idx.has(r.target)) order.push(r.target); }
    } catch (e) { }
    if (!order.length) order = Array.from(idx.keys()).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.slice(16)) - parseInt(b.slice(16)));
    const themeName = Array.from(idx.keys()).filter(n => /^ppt\/theme\/theme\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.slice(15)) - parseInt(b.slice(15)))[0];
    let T; try { T = parseTheme(themeName ? await text(themeName) : ''); } catch (e) { T = parseTheme(''); }
    const items = [], seen = new Set(), cache = new Map(); let skipped = 0;
    const ser = new XMLSerializer();
    for (let i = 0; i < order.length && items.length < 2000; i++) {
      const sp = order[i]; let xml; try { xml = await text(sp); } catch (e) { continue; }
      const doc = new DOMParser().parseFromString(xml, 'application/xml'), tree = doc.getElementsByTagNameNS('*', 'spTree')[0]; if (!tree) continue;
      const rn = sp.replace(/([^/]+)$/, '_rels/$1.rels'); let rels = new Map(); if (idx.has(rn)) { try { rels = Z.pptRels(await text(rn), sp); } catch (e) { } }
      const C = { T, rels, cache, extOf: Z.extOf, has: (t) => idx.has(t), blob: (t, type) => Z.zipBlob(file, idx.get(t), type) };
      const add = (it, key) => { if (seen.has(key)) return; seen.add(key); it.slide = i + 1; it.id = items.length; items.push(it); };
      const take = (node) => {
        const ln = node.localName;
        if (ln === 'AlternateContent') { const c = kid(node, 'Fallback') || kid(node, 'Choice'); for (const n of c ? Array.from(c.children) : []) take(n); return; }
        if (ln !== 'sp' && ln !== 'cxnSp' && ln !== 'pic' && ln !== 'grpSp') return;
        if (hasMedia(node)) return; // 동영상·소리는 [PPT 에서 영상 가져오기] 로
        const pr = kid(node, ln === 'grpSp' ? 'grpSpPr' : 'spPr'), x = xfOf(kid(pr, 'xfrm')); if (!x || (x.w < 1 && x.h < 1)) return;
        const name = nameOf(node);
        if (ln === 'pic') {
          const [svgId, rid] = blipRid(kid(node, 'blipFill')), r = rels.get(svgId) || rels.get(rid);
          if (!r || r.external || !idx.has(r.target) || !MIME[Z.extOf(r.target)]) { skipped++; return; } // EMF·WMF 등 브라우저가 못 여는 그림
          const sr = kid(kid(node, 'blipFill'), 'srcRect'), crop = sr && ['l', 't', 'r', 'b'].some(k => Math.abs(numA(sr, k, 0)) > 50);
          const pg = attr(kid(pr, 'prstGeom'), 'prst', 'rect'), plain = !crop && !x.rot && !x.fh && !x.fv && pg === 'rect' && !kid(pr, 'custGeom') && !lineOf(pr, kid(node, 'style'), C);
          if (plain) { add({ kind: 'media', name, target: r.target, ext: Z.extOf(r.target), type: MIME[Z.extOf(r.target)], w: x.w, h: x.h, C }, 'm:' + r.target); return; }
        }
        if (ln === 'sp') {
          const fill = fillOf(pr, kid(node, 'style'), C), line = lineOf(pr, kid(node, 'style'), C);
          if (!fill && !line) { // 글만 있는 상자: 한두 글자 기호만 심벌로 (제목·본문 글은 건너뜀)
            const t = plainText(node); if (!t || /\n/.test(t) || graphemes(t).length > 2 || isPh(node)) return;
            const rp = node.getElementsByTagNameNS('*', 'rPr')[0], col = rp && kid(rp, 'solidFill') ? colorOf(kid(rp, 'solidFill'), T) : null;
            add({ kind: 'txt', name, c: t, color: col ? col.c : '', w: x.w, h: x.h, C }, 't:' + t + '|' + (col ? col.c : '')); return;
          }
        }
        const key = ser.serializeToString(node).replace(/<a:off\b[^>]*\/>/, '').replace(/<p:cNvPr\b[^>]*?(\/>|>[\s\S]*?<\/p:cNvPr>)/g, '');
        add({ kind: 'svg', name, node, box: boxOf(x), w: x.w, h: x.h, C }, 's:' + key);
      };
      for (const n of Array.from(tree.children)) take(n);
    }
    return { items, skipped, slides: order.length, slideW };
  }

  /* 심벌 하나를 그림 파일로 → { blob, name, w, h, approx } (글자 심벌은 쓰지 않음) */
  function render(it) {
    if (it._r) return it._r;
    const base = (it.name || '심벌').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 30) || '심벌';
    it._r = (async () => {
      if (it.kind === 'media') { const blob = await it.C.blob(it.target, it.type); return { blob, name: base + '.' + (it.ext === 'jpeg' ? 'jpg' : it.ext), w: it.w, h: it.h, approx: false }; }
      const st = { defs: [], n: 0, lw: 0, approx: false, arrow: false, drawn: 0, lost: 0 };
      const body = await nodeSvg(it.node, it.C, st);
      if (!st.drawn) throw new Error(st.lost ? '브라우저가 열 수 없는 그림 형식(EMF·WMF)입니다' : '그릴 내용이 없습니다');
      const pad = Math.ceil(st.lw * (st.arrow ? 2.2 : 0.5) + 1), b = it.box, vb = [b.x - pad, b.y - pad, Math.max(2, b.w + pad * 2), Math.max(2, b.h + pad * 2)];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(vb[2])}" height="${f2(vb[3])}" viewBox="${vb.map(f2).join(' ')}">${st.defs.length ? '<defs>' + st.defs.join('') + '</defs>' : ''}${body}</svg>`;
      return { blob: new Blob([svg], { type: 'image/svg+xml' }), name: base + '.svg', w: vb[2], h: vb[3], approx: st.approx };
    })();
    it._r.catch(() => { });
    return it._r;
  }
  return { read, render };
})();
