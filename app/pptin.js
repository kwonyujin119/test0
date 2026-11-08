/* PowerPoint(.pptx) → 교안 변환
   탐색기에서 .pptx 를 "발표"로 열거나(설치한 앱), 교안 목록에 PPT 파일을 끌어다 놓거나 [가져오기] 로 고르면
   이 모듈이 PPT 의 슬라이드를 교안으로 바꿉니다. PowerPoint 가 없어도 브라우저 안에서만 동작합니다.
   · 글 상자 → 글 요소 (크기·색·굵게·정렬·글머리 기호 유지 — 고칠 수 있음)
   · 그림 → 그림 요소 (원본 파일 그대로)   · 기본 도형(사각형·원·화살표 …) → 도형 요소 (글 포함)
   · 복잡한 도형·묶음·선 → SVG 그림 (app/pptsym.js 의 그리기)   · 표 → 표 요소   · 차트 → 차트 요소
   · 동영상 → 동영상 요소 (저장소에 연결되어 있을 때 · 아니면 표지 그림만)
   · 슬라이드 마스터·레이아웃의 꾸밈(띠·로고·배경 그림)은 슬라이드마다 한 장의 그림으로 맨 뒤에 깔고 잠가 둠
   · 발표자 노트 → 노트, 숨긴 슬라이드 → 숨김
   읽지 못하는 것: 옛 형식(.ppt), SmartArt, 수식 개체, EMF·WMF 그림, 애니메이션·화면 전환
   쓰는 곳: app/hub.js. app/common.js(요소 생성 함수) 와 app/pptsym.js 를 먼저 불러와야 함 */
'use strict';
const PPTIN = (() => {
  /* ---------- ZIP 읽기 (app/editor.js 와 같은 방식: 필요한 조각만 읽음) ---------- */
  async function zipIndex(file) {
    const n = Math.min(file.size, 65557 + 20), tail = new Uint8Array(await file.slice(file.size - n).arrayBuffer()), tv = new DataView(tail.buffer);
    let p = -1; for (let i = tail.length - 22; i >= 0; i--) if (tv.getUint32(i, true) === 0x06054b50) { p = i; break; }
    if (p < 0) throw new Error('PowerPoint 파일(.pptx)이 아닙니다');
    let cdSize = tv.getUint32(p + 12, true), cdOfs = tv.getUint32(p + 16, true);
    if (cdOfs === 0xFFFFFFFF && p >= 20 && tv.getUint32(p - 20, true) === 0x07064b50) {
      const o = Number(tv.getBigUint64(p - 12, true)), z = new DataView(await file.slice(o, o + 56).arrayBuffer());
      cdSize = Number(z.getBigUint64(40, true)); cdOfs = Number(z.getBigUint64(48, true));
    }
    const cd = new Uint8Array(await file.slice(cdOfs, cdOfs + cdSize).arrayBuffer()), dv = new DataView(cd.buffer), dec = new TextDecoder('utf-8');
    const out = new Map();
    for (let q = 0; q + 46 <= cd.length && dv.getUint32(q, true) === 0x02014b50;) {
      const method = dv.getUint16(q + 10, true), nlen = dv.getUint16(q + 28, true), xlen = dv.getUint16(q + 30, true), clen = dv.getUint16(q + 32, true);
      let csize = dv.getUint32(q + 20, true), usize = dv.getUint32(q + 24, true), lofs = dv.getUint32(q + 42, true);
      const name = dec.decode(cd.subarray(q + 46, q + 46 + nlen));
      for (let x = q + 46 + nlen, xe = x + xlen; x + 4 <= xe;) {
        const id = dv.getUint16(x, true), sz = dv.getUint16(x + 2, true); let y = x + 4;
        if (id === 1) { if (usize === 0xFFFFFFFF) { usize = Number(dv.getBigUint64(y, true)); y += 8; } if (csize === 0xFFFFFFFF) { csize = Number(dv.getBigUint64(y, true)); y += 8; } if (lofs === 0xFFFFFFFF) lofs = Number(dv.getBigUint64(y, true)); }
        x += 4 + sz;
      }
      if (!name.endsWith('/')) out.set(name, { method, csize, usize, lofs });
      q += 46 + nlen + xlen + clen;
    }
    return out;
  }
  async function zipBlob(file, ent, type) {
    if (!ent) throw new Error('파일 안에서 찾지 못했습니다');
    const lh = new DataView(await file.slice(ent.lofs, ent.lofs + 30).arrayBuffer());
    if (lh.getUint32(0, true) !== 0x04034b50) throw new Error('파일이 바뀌었거나 손상되었습니다');
    const start = ent.lofs + 30 + lh.getUint16(26, true) + lh.getUint16(28, true), raw = file.slice(start, start + ent.csize);
    if (ent.method === 0) return new Blob([await raw.arrayBuffer()], { type: type || '' });
    if (ent.method !== 8) throw new Error('지원하지 않는 압축 방식입니다');
    const b = await new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
    return new Blob([b], { type: type || '' });
  }
  function pptRels(xml, base) {
    const m = new Map(), dir = base.split('/').slice(0, -1);
    for (const tag of xml.match(/<Relationship\b[^>]*>/g) || []) {
      const a = {}; tag.replace(/([\w:]+)="([^"]*)"/g, (_, k, v) => { a[k] = v.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'); return ''; });
      if (!a.Id) continue;
      const external = a.TargetMode === 'External'; let target = a.Target || '';
      if (!external) { const parts = target.startsWith('/') ? [] : dir.slice(); for (const s of target.split('/')) { if (s === '..') parts.pop(); else if (s && s !== '.') parts.push(s); } target = parts.join('/'); }
      m.set(a.Id, { type: a.Type || '', target, external });
    }
    return m;
  }
  const extOf = (s) => ((String(s || '').match(/\.([a-z0-9]+)$/i) || [, ''])[1]).toLowerCase();
  const VIDEO_MIME = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', wmv: 'video/x-ms-wmv', avi: 'video/x-msvideo', mpg: 'video/mpeg', mpeg: 'video/mpeg', mkv: 'video/x-matroska' };
  const relOf = (rels, type) => { for (const r of rels.values()) if (r.type.endsWith('/' + type)) return r; return null; };
  const r2 = (v) => Math.round(v * 100) / 100;

  /* ---------- 자리 표시자(제목·본문 상자): 슬라이드에 위치·글자 서식이 없으면 레이아웃 → 마스터에서 물려받음 ---------- */
  const PH_T = (t) => /^(title|ctrTitle)$/.test(t || '') ? 'title' : /^(body|subTitle|obj|)$/.test(t || '') ? 'body' : t;
  function phOf(Y, node) {
    for (const c of node.children) if (/^nv/.test(c.localName)) { const ph = Y.kid(Y.kid(c, 'nvPr'), 'ph'); return ph ? { type: Y.attr(ph, 'type', ''), idx: Y.attr(ph, 'idx', '') } : null; }
    return null;
  }
  function findPh(Y, doc, ph) {
    if (!doc || !ph) return null;
    const tree = doc.getElementsByTagNameNS('*', 'spTree')[0]; if (!tree) return null;
    let byType = null;
    for (const sp of Y.kids(tree, 'sp')) {
      const p = phOf(Y, sp); if (!p) continue;
      if (ph.idx && p.idx === ph.idx) return sp;
      if (!byType && PH_T(p.type) === PH_T(ph.type) && (ph.type || !p.type || PH_T(p.type) === 'body')) byType = sp;
    }
    return byType;
  }
  const listStyle = (Y, n) => n ? Y.kid(Y.kid(n, 'txBody'), 'lstStyle') : null;

  /* ---------- 글 ---------- */
  const ALGN = { l: 'left', ctr: 'center', r: 'right', just: 'justify', dist: 'justify' };
  const ANCHOR = { t: 'top', ctr: 'middle', b: 'bottom' };
  const first = (arr, fn) => { for (const a of arr) { if (!a) continue; const v = fn(a); if (v != null && v !== '') return v; } return null; };
  /* 글 상자 하나의 글을 교안의 HTML 과 글자 서식으로. K = 글자 크기 배율(px)
     chain = 글자 서식을 물려받는 순서 (상자 → 레이아웃 → 마스터 자리 표시자 → 마스터 공통 → 기본). nLocal = 그중 앞의 "자리 표시자" 단계 수
     fontColor = 도형 스타일(fontRef)의 글자 색 — 자리 표시자 단계보다는 뒤, 마스터 공통 글자 색보다는 앞 (도형 안 글이 흰색으로 나오는 까닭) */
  function readTextBox(Y, node, chain, fontColor, K, T, nLocal) {
    const dk = { c: '#' + T.clr.dk1, a: 1 }; nLocal = nLocal || 0;
    const tb = Y.kid(node, 'txBody'); if (!tb) return null;
    const bp = Y.kid(tb, 'bodyPr');
    const auto = Y.kid(bp, 'normAutofit'), fscale = Y.numA(auto, 'fontScale', 100000) / 100000, lnRed = Y.numA(auto, 'lnSpcReduction', 0) / 100000;
    const ins = ['lIns', 'tIns', 'rIns', 'bIns'].map((k, i) => Y.numA(bp, k, [91440, 45720, 91440, 45720][i]) / Y.PX);
    const paras = [], sizes = new Map(), colors = new Map(); let total = 0, nB = 0, nI = 0, nU = 0, nRuns = 0, lh = null, gap = 0, gapN = 0;
    const wsum = (m, key, w) => m.set(key, (m.get(key) || 0) + w);
    for (const p of Y.kids(tb, 'p')) {
      const pPr = Y.kid(p, 'pPr'), lvl = Math.max(0, Math.min(8, Y.numA(pPr, 'lvl', 0)));
      const prs = [pPr].concat(chain.map(c => Y.kid(c, 'lvl' + (lvl + 1) + 'pPr')));
      const algn = first(prs, x => Y.attr(x, 'algn', null)) || 'l';
      let bullet = '';
      const bu = first(prs, x => Y.kid(x, 'buNone') ? 'none' : Y.kid(x, 'buAutoNum') ? 'ol' : (Y.kid(x, 'buChar') || Y.kid(x, 'buBlip')) ? 'ul' : null);
      if (bu && bu !== 'none') bullet = bu;
      const sp = first(prs, x => { const l = Y.kid(x, 'lnSpc'); if (!l) return null; const pc = Y.kid(l, 'spcPct'); return pc ? { pct: Y.numA(pc, 'val', 100000) / 100000 } : { pts: Y.numA(Y.kid(l, 'spcPts'), 'val', 0) / 100 }; });
      const bef = first(prs, x => { const s = Y.kid(x, 'spcBef'); return s ? Y.numA(Y.kid(s, 'spcPts'), 'val', 0) / 100 : null; }) || 0;
      const aft = first(prs, x => { const s = Y.kid(x, 'spcAft'); return s ? Y.numA(Y.kid(s, 'spcPts'), 'val', 0) / 100 : null; }) || 0;
      gap += (bef + aft) * 96 / 72; gapN++;
      const runs = [];
      for (const r of p.children) {
        if (r.localName === 'br') { runs.push({ br: true }); continue; }
        if (r.localName !== 'r' && r.localName !== 'fld') continue;
        const rp = Y.kid(r, 'rPr'), t = Y.kid(r, 't'); const text = t ? t.textContent : ''; if (!text) continue;
        const def = (fn) => first(prs, x => fn(Y.kid(x, 'defRPr')));
        const sz = (Y.numA(rp, 'sz', 0) || def(d => Y.numA(d, 'sz', 0) || null) || 1800) / 100;
        const px = sz * 96 / 72 * fscale * K;
        const b = (Y.attr(rp, 'b', null) || def(d => Y.attr(d, 'b', null)) || '0') === '1';
        const i = (Y.attr(rp, 'i', null) || def(d => Y.attr(d, 'i', null)) || '0') === '1';
        const u = (Y.attr(rp, 'u', null) || def(d => Y.attr(d, 'u', null)) || 'none') !== 'none';
        const fillCol = (d) => d && Y.kid(d, 'solidFill') ? Y.colorOf(Y.kid(d, 'solidFill'), T) : null;
        const col = (rp && Y.kid(rp, 'solidFill') ? Y.colorOf(Y.kid(rp, 'solidFill'), T) : null) || first(prs.slice(0, 1 + nLocal), x => fillCol(Y.kid(x, 'defRPr'))) || fontColor || first(prs.slice(1 + nLocal), x => fillCol(Y.kid(x, 'defRPr'))) || dk;
        const w = text.length; total += w; nRuns++; if (b) nB++; if (i) nI++; if (u) nU++;
        wsum(sizes, r2(px), w); wsum(colors, col.c, w);
        if (lh == null && sp) lh = sp.pct != null ? sp.pct : (sp.pts * 96 / 72 * K) / px / 1.2;
        runs.push({ t: text, px, b, i, u, c: col.c });
      }
      paras.push({ lvl, algn, bullet, runs });
    }
    if (!total) return null;
    const top = (m) => { let best = null, bw = -1; for (const [k, w] of m) if (w > bw) { bw = w; best = k; } return best; };
    const mainPx = top(sizes), mainColor = top(colors);
    const allB = nB === nRuns, allI = nI === nRuns, allU = nU === nRuns;
    const runHtml = (r) => {
      if (r.br) return '<br>';
      let s = esc(r.t); const st = [];
      if (Math.abs(r.px - mainPx) > 0.5) st.push('font-size:' + r2(r.px) + 'px');
      if (r.c !== mainColor) st.push('color:' + r.c);
      if (st.length) s = `<span style="${st.join(';')}">${s}</span>`;
      if (r.b && !allB) s = '<b>' + s + '</b>'; if (r.i && !allI) s = '<i>' + s + '</i>'; if (r.u && !allU) s = '<u>' + s + '</u>';
      return s;
    };
    const out = [], st = [];
    const closeTo = (n) => { while (st.length > n) { const t = st.pop(); out.push((t.li ? '</li>' : '') + '</' + t.tag + '>'); } };
    const algns = new Map();
    for (const p of paras) {
      const html = p.runs.map(runHtml).join(''), hasText = p.runs.some(r => r.t && r.t.trim());
      wsum(algns, p.algn, p.runs.reduce((a, r) => a + (r.t ? r.t.length : 0), 0));
      if (!p.bullet || !hasText) { closeTo(0); out.push('<div>' + (html || '<br>') + '</div>'); continue; }
      const depth = p.lvl + 1; closeTo(depth);
      while (st.length < depth) { out.push('<' + p.bullet + '>'); st.push({ tag: p.bullet, li: false }); }
      const t = st[st.length - 1]; if (t.li) out.push('</li>');
      out.push('<li>' + html); t.li = true;
    }
    closeTo(0);
    const style = { fontSize: Math.max(4, Math.round(mainPx)), color: mainColor, bold: allB, italic: allI, underline: allU, align: ALGN[top(algns)] || 'left', valign: ANCHOR[Y.attr(bp, 'anchor', 't')] || 'top', lineHeight: r2(Math.max(0.8, 1.2 * (lh == null ? 1 : lh) * (1 - lnRed))) };
    const pad = Math.round(Math.min(ins[0], ins[2]) * K); if (pad) style.padding = pad;
    const pg = Math.round(gap / Math.max(1, gapN) * K); if (pg > 2) style.paraGap = pg;
    return { html: out.join(''), style, plain: paras.map(p => p.runs.map(r => r.br ? '\n' : r.t).join('')).join('\n').trim() };
  }

  /* ---------- 기본 도형 → 교안 도형 ---------- */
  const SHAPE_MAP = { rect: 'rect', roundRect: 'rect', ellipse: 'ellipse', triangle: 'triangle', rtTriangle: 'rtriangle', diamond: 'diamond', pentagon: 'pentagon', hexagon: 'hexagon', octagon: 'octagon', parallelogram: 'parallelogram', trapezoid: 'trapezoid', plus: 'plus', star5: 'star', chevron: 'chevron', rightArrow: 'blockArrow', leftRightArrow: 'doubleArrow', heart: 'heart', donut: 'ring', flowChartProcess: 'rect', flowChartAlternateProcess: 'rect', flowChartDecision: 'diamond', flowChartConnector: 'ellipse', flowChartTerminator: 'rect', mathPlus: 'plus' };

  /* ---------- 변환 ---------- */
  /* file: .pptx 파일, opts: { stage(blob, name) → src, video(blob, name, poster) → { src, poster } | null, progress(msg) }
     → { deck, name, stats, warnings } */
  async function toDeck(file, opts) {
    opts = opts || {};
    const Y = (typeof PPTSYM !== 'undefined' && PPTSYM._) || null; if (!Y) throw new Error('app/pptsym.js 가 먼저 필요합니다');
    const say = (m) => { try { if (opts.progress) opts.progress(m); } catch (e) { } };
    const stage = opts.stage || (async (b) => blobToDataURL(b));
    say('PPT 파일을 여는 중…');
    const idx = await zipIndex(file);
    if (!idx.has('ppt/presentation.xml')) throw new Error('PowerPoint 파일(.pptx)이 아닙니다');
    const text = async (n) => idx.has(n) ? (await zipBlob(file, idx.get(n))).text() : '';
    const docs = new Map(), relsC = new Map();
    const docOf = async (n) => { if (!docs.has(n)) { const t = await text(n); docs.set(n, t ? new DOMParser().parseFromString(t, 'application/xml') : null); } return docs.get(n); };
    const relsOf = async (n) => { if (!relsC.has(n)) { const rn = n.replace(/([^/]+)$/, '_rels/$1.rels'); let m = new Map(); try { if (idx.has(rn)) m = pptRels(await text(rn), n); } catch (e) { } relsC.set(n, m); } return relsC.get(n); };
    const pres = await docOf('ppt/presentation.xml'), presRels = await relsOf('ppt/presentation.xml');
    const sldSz = pres.getElementsByTagNameNS('*', 'sldSz')[0];
    const sw = Y.numA(sldSz, 'cx', 12192000) / Y.PX, sh = Y.numA(sldSz, 'cy', 6858000) / Y.PX;
    const K = Math.min(SLIDE_W / sw, SLIDE_H / sh), OX = (SLIDE_W - sw * K) / 2, OY = (SLIDE_H - sh * K) / 2;
    const box = (x) => ({ x: Math.round(OX + x.x * K), y: Math.round(OY + x.y * K), w: Math.max(1, Math.round(x.w * K)), h: Math.max(1, Math.round(x.h * K)) });
    let order = [];
    for (const m of pres.getElementsByTagNameNS('*', 'sldId')) { const r = presRels.get(m.getAttribute('r:id') || ''); if (r && idx.has(r.target)) order.push(r.target); }
    if (!order.length) order = Array.from(idx.keys()).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.slice(16)) - parseInt(b.slice(16)));
    if (!order.length) throw new Error('슬라이드가 없는 파일입니다');
    const defStyle = pres.getElementsByTagNameNS('*', 'defaultTextStyle')[0] || null;
    const themes = new Map(), decos = new Map(), imgCache = new Map();
    const themeOf = async (mp) => { if (!themes.has(mp)) { const r = relOf(await relsOf(mp), 'theme'); let T; try { T = Y.parseTheme(r ? await text(r.target) : ''); } catch (e) { T = Y.parseTheme(''); } themes.set(mp, T); } return themes.get(mp); };
    const stats = { slides: 0, text: 0, image: 0, shape: 0, drawn: 0, table: 0, chart: 0, video: 0, skipped: 0, emf: 0 };
    const warnings = [];
    const warn = (m) => { if (!warnings.includes(m)) warnings.push(m); };
    const ctxOf = (rels, T) => ({ T, rels, cache: imgCache, extOf, has: (t) => idx.has(t), blob: (t, type) => zipBlob(file, idx.get(t), type) });
    const svgOf = async (node, C, viewBox) => { // 노드 하나(또는 여러 개)를 SVG 그림으로 → { blob, vb } (그릴 것이 없으면 null)
      const st = { defs: [], n: 0, lw: 0, approx: false, arrow: false, drawn: 0, lost: 0 };
      let body = ''; for (const n of Array.isArray(node) ? node : [node]) body += await Y.nodeSvg(n, C, st);
      if (st.lost) stats.emf += st.lost;
      if (!st.drawn) return null;
      let vb = viewBox;
      if (!vb) { const pad = Math.ceil(st.lw * (st.arrow ? 2.2 : 0.5) + 1), b = Y.boxOf(Y.xfOf(Y.kid(Y.kid(node, node.localName === 'grpSp' ? 'grpSpPr' : 'spPr'), 'xfrm'))); vb = [b.x - pad, b.y - pad, Math.max(2, b.w + pad * 2), Math.max(2, b.h + pad * 2)]; }
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Y.f2(vb[2])}" height="${Y.f2(vb[3])}" viewBox="${vb.map(Y.f2).join(' ')}">${st.defs.length ? '<defs>' + st.defs.join('') + '</defs>' : ''}${body}</svg>`;
      return { blob: new Blob([svg], { type: 'image/svg+xml' }), vb };
    };
    const svgEl = async (node, C, name) => { // SVG 그림 요소 (자리 = 그린 상자)
      const r = await svgOf(node, C); if (!r) return null;
      const src = await stage(r.blob, (name || '도형').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 30) + '.svg');
      return imageEl(Math.round(OX + r.vb[0] * K), Math.round(OY + r.vb[1] * K), Math.max(1, Math.round(r.vb[2] * K)), Math.max(1, Math.round(r.vb[3] * K)), src, { fit: 'fill' });
    };
    const stripText = (node) => { const c = node.cloneNode(true); for (const t of Array.from(c.children)) if (t.localName === 'txBody') c.removeChild(t); return c; };
    /* 배경 (슬라이드 → 레이아웃 → 마스터) */
    const bgOf = async (doc, C) => {
      const bg = doc && doc.getElementsByTagNameNS('*', 'bg')[0]; if (!bg) return null;
      const pr = Y.kid(bg, 'bgPr');
      if (pr) {
        const f = Y.fillOf(pr, null, C);
        if (!f) return Y.kid(pr, 'noFill') ? { color: '#ffffff' } : null;
        if (f.img) { const [svgId, rid] = Y.blipRid(f.img), data = (svgId && await Y.dataUrl(svgId, C)) || await Y.dataUrl(rid, C); if (data) { const b = await (await fetch(data)).blob(); const prep = await prepareImage(new File([b], 'background.' + (b.type.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg'), { type: b.type })); return { image: await stage(prep.blob, prep.name), fit: 'cover' }; } stats.emf++; return null; }
        if (f.stops) return { gradient: `linear-gradient(${Math.round(f.ang + 90)}deg, ${f.stops.map(s => s.col.c + ' ' + Math.round(s.p) + '%').join(', ')})` };
        return { color: f.c };
      }
      const ref = Y.kid(bg, 'bgRef'); const col = ref && Y.colorOf(ref, C.T); return col ? { color: col.c } : null;
    };
    /* 마스터·레이아웃의 꾸밈 (자리 표시자가 아닌 도형·그림) → 슬라이드 한 장 크기의 SVG 그림 */
    const decoOf = async (lp, ldoc, mp, mdoc, T, showMaster) => {
      const key = lp + '|' + showMaster; if (decos.has(key)) return decos.get(key);
      let src = null;
      try {
        const nodes = [];
        const pick = async (doc, path) => {
          const tree = doc && doc.getElementsByTagNameNS('*', 'spTree')[0]; if (!tree) return;
          const C = ctxOf(await relsOf(path), T);
          for (const n of Array.from(tree.children)) { if (!/^(sp|pic|grpSp|cxnSp|AlternateContent)$/.test(n.localName) || Y.isPh(n) || Y.hasMedia(n)) continue; nodes.push({ n, C }); }
        };
        if (showMaster) await pick(mdoc, mp);
        await pick(ldoc, lp);
        if (nodes.length) {
          const st = { defs: [], n: 0, lw: 0, approx: false, arrow: false, drawn: 0, lost: 0 }; let body = '';
          for (const { n, C } of nodes) body += await Y.nodeSvg(n, C, st);
          if (st.drawn) { const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Y.f2(sw)}" height="${Y.f2(sh)}" viewBox="0 0 ${Y.f2(sw)} ${Y.f2(sh)}">${st.defs.length ? '<defs>' + st.defs.join('') + '</defs>' : ''}${body}</svg>`; src = await stage(new Blob([svg], { type: 'image/svg+xml' }), '서식.svg'); }
        }
      } catch (e) { warn('슬라이드 서식(마스터)의 꾸밈 일부를 가져오지 못했습니다'); }
      decos.set(key, src); return src;
    };
    /* 차트 */
    const chartOf = async (path, b) => {
      const doc = await docOf(path); const pa = doc && doc.getElementsByTagNameNS('*', 'plotArea')[0]; if (!pa) return null;
      const C = ctxOf(new Map(), Y.parseTheme(''));
      let ch = null; for (const c of pa.children) if (/^(bar|bar3D|line|line3D|area|area3D|pie|pie3D|ofPie|doughnut|scatter|radar)Chart$/.test(c.localName)) { ch = c; break; }
      if (!ch) return null;
      const ln = ch.localName; let kind = 'bar';
      if (/^bar/.test(ln)) { kind = Y.attr(Y.kid(ch, 'barDir'), 'val', 'col') === 'bar' ? 'hbar' : 'bar'; if (kind === 'bar' && /stacked/i.test(Y.attr(Y.kid(ch, 'grouping'), 'val', ''))) kind = 'stack'; }
      else if (/^(line|scatter|radar)/.test(ln)) kind = 'line'; else if (/^area/.test(ln)) kind = 'area'; else if (/^(pie|ofPie)/.test(ln)) kind = 'pie'; else if (ln === 'doughnutChart') kind = 'donut';
      const vals = (el) => { const out = []; if (!el) return out; for (const pt of el.getElementsByTagNameNS('*', 'pt')) { const v = Y.kid(pt, 'v'); out[Y.numA(pt, 'idx', out.length)] = v ? v.textContent : ''; } return out; };
      let labels = null; const series = [], pointColors = [];
      for (const s of Y.kids(ch, 'ser')) {
        const tx = Y.kid(s, 'tx'); let name = tx ? (vals(tx)[0] || (Y.kid(tx, 'v') ? Y.kid(tx, 'v').textContent : '')) : '';
        const cv = vals(Y.kid(s, 'cat') || Y.kid(s, 'xVal')), vv = vals(Y.kid(s, 'val') || Y.kid(s, 'yVal'));
        if (!labels && cv.length) labels = cv;
        const sp = Y.kid(s, 'spPr'), col = sp && Y.kid(sp, 'solidFill') ? Y.colorOf(Y.kid(sp, 'solidFill'), C.T) : null;
        for (const dp of Y.kids(s, 'dPt')) { const i = Y.numA(Y.kid(dp, 'idx'), 'val', -1), f = Y.kid(dp, 'spPr') && Y.kid(Y.kid(dp, 'spPr'), 'solidFill'); if (i >= 0 && f) { const c = Y.colorOf(f, C.T); if (c) pointColors[i] = c.c; } }
        name = String(name || '').replace(/[\t\r\n]+/g, ' ').trim() || '계열 ' + (series.length + 1);
        if (/^-?[\d.,]+%?$/.test(name)) name = '계열 ' + name;
        series.push({ name, vals: vv, col: col ? col.c : '' });
      }
      const n = Math.max(labels ? labels.length : 0, ...series.map(s => s.vals.length)); if (!n || !series.length) return null;
      const clean = (s) => String(s == null ? '' : s).replace(/[\t\r\n]+/g, ' ').trim();
      const rows = [['항목'].concat(series.map(s => s.name))];
      for (let j = 0; j < n; j++) rows.push([clean(labels && labels[j] != null && labels[j] !== '' ? labels[j] : j + 1)].concat(series.map(s => s.vals[j] == null || s.vals[j] === '' ? '' : String(+s.vals[j]))));
      const dl = ch.getElementsByTagNameNS('*', 'showVal')[0];
      const e = chartEl(b.x, b.y, b.w, b.h, kind, rows.map(r => r.join('\t')).join('\n'), { legend: !!doc.getElementsByTagNameNS('*', 'legend')[0], values: !!dl && Y.attr(dl, 'val', '0') === '1', grid: true });
      if (series.some(s => s.col)) e.colors = series.map(s => s.col);
      if (pointColors.length) e.pointColors = Array.from(pointColors, c => c || '');
      return e;
    };
    /* 표 */
    const tableOf = (tbl, b, C, chain) => {
      const grid = Y.kids(Y.kid(tbl, 'tblGrid'), 'gridCol').map(g => Y.numA(g, 'w', 1)), trs = Y.kids(tbl, 'tr');
      if (!trs.length) return null;
      const rows = [], cells = {}, sizes = new Map(); let mainColor = null;
      trs.forEach((tr, ri) => {
        const row = []; let ci = 0;
        for (const tc of Y.kids(tr, 'tc')) {
          while (cells[ri + ',' + ci] && cells[ri + ',' + ci].covered) { row.push(''); ci++; }
          const hm = Y.attr(tc, 'hMerge', '0') === '1', vm = Y.attr(tc, 'vMerge', '0') === '1';
          const cs = Y.numA(tc, 'gridSpan', 1), rs = Y.numA(tc, 'rowSpan', 1);
          const tx = readTextBox(Y, tc, chain, null, K, C.T, 0);
          row.push(hm || vm ? '' : (tx ? tx.html : ''));
          const cell = {};
          if (cs > 1) cell.cs = cs; if (rs > 1) cell.rs = rs;
          const pr = Y.kid(tc, 'tcPr'), f = pr && Y.fillOf(pr, null, C); if (f && f.c) cell.fill = f.c;
          if (tx) { if (tx.style.align && tx.style.align !== 'left') cell.align = tx.style.align; sizes.set(tx.style.fontSize, (sizes.get(tx.style.fontSize) || 0) + tx.plain.length); if (tx.style.color && !mainColor) mainColor = tx.style.color; if (tx.style.color) cell.color = tx.style.color; }
          if (Object.keys(cell).length) cells[ri + ',' + ci] = cell;
          for (let i = 0; i < rs; i++) for (let j = 0; j < cs; j++) if (i || j) cells[(ri + i) + ',' + (ci + j)] = Object.assign(cells[(ri + i) + ',' + (ci + j)] || {}, { covered: true });
          ci += cs;
        }
        rows.push(row);
      });
      for (const k in cells) { delete cells[k].covered; if (!Object.keys(cells[k]).length) delete cells[k]; }
      const nc = Math.max(...rows.map(r => r.length)); for (const r of rows) while (r.length < nc) r.push('');
      let fs = 0, fw = -1; for (const [k, w] of sizes) if (w > fw) { fw = w; fs = k; }
      const pr = Y.kid(tbl, 'tblPr');
      const e = tableEl(b.x, b.y, b.w, b.h, rows, { header: Y.attr(pr, 'firstRow', '0') === '1', band: Y.attr(pr, 'bandRow', '0') === '1', firstCol: Y.attr(pr, 'firstCol', '0') === '1', lines: 'grid', radius: 0, cells, style: { fontSize: fs || 24, align: 'left' } });
      if (mainColor) { e.style.color = mainColor; for (const k in cells) { if (cells[k].color === mainColor) delete cells[k].color; if (!Object.keys(cells[k]).length) delete cells[k]; } }
      if (grid.length === nc) e.cols = grid.slice(); const rh = trs.map(t => Y.numA(t, 'h', 1)); e.rh = rh;
      const anyFill = Object.values(cells).some(c => c.fill), head = cells['0,0'] && cells['0,0'].fill;
      if (head) e.headFill = head; else if (e.header && anyFill) e.header = false; // 칸마다 색을 직접 칠한 표인데 첫 줄엔 없으면 머리 줄 꾸밈을 하지 않음
      else if (e.header) e.headFill = '#' + C.T.clr.accent1; // PowerPoint 기본 표 스타일(테마 강조색 머리 줄)
      if (e.header) { for (let c = 0; c < nc; c++) { const k = '0,' + c; if (cells[k]) { delete cells[k].fill; if (cells[k].color) { if (head) e.headColor = cells[k].color; delete cells[k].color; } if (!Object.keys(cells[k]).length) delete cells[k]; } } }
      return e;
    };
    /* 동영상 */
    const videoOf = async (pic, b, C, rels, name) => {
      const one = (n) => pic.getElementsByTagNameNS('*', n)[0];
      const vf = one('videoFile'), md = one('media'), blip = one('blip');
      const r = (md && rels.get(md.getAttribute('r:embed') || md.getAttribute('r:link') || '')) || (vf && rels.get(vf.getAttribute('r:link') || ''));
      let poster = '';
      try { const pr = blip && rels.get(blip.getAttribute('r:embed') || ''); if (pr && !pr.external && Y.MIME[extOf(pr.target)]) { const pb = await zipBlob(file, idx.get(pr.target), Y.MIME[extOf(pr.target)]); const prep = await prepareImage(new File([pb], (name || 'video') + '-poster.' + extOf(pr.target), { type: pb.type })); poster = await stage(prep.blob, prep.name); } } catch (e) { }
      let ent = r && !r.external ? idx.get(r.target) : null;
      if (ent && opts.video) {
        try {
          const ext = extOf(r.target), vb = await zipBlob(file, idx.get(r.target), VIDEO_MIME[ext] || 'video/mp4');
          const fname = ((name || 'video').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 30) || 'video') + '.' + (/^(mp4|webm|ogv|mov|m4v)$/.test(ext) ? ext : 'mp4');
          const v = await opts.video(new File([vb], fname, { type: vb.type }), fname, poster);
          if (v && v.src) { stats.video++; return embedEl(b.x, b.y, b.w, b.h, v.src, Object.assign({ radius: 0, posterOf: v.src }, v.poster ? { poster: v.poster } : {})); }
        } catch (e) { warn('동영상을 넣지 못했습니다: ' + e.message); }
      } else if (ent) warn('동영상은 저장소(GitHub · 내 PC 서버)에 연결된 뒤에 가져올 수 있어 표지 그림만 넣었습니다 — 편집기의 [더보기 → PPT 에서 영상 가져오기] 로 넣을 수 있습니다');
      else if (r && r.external) warn('PPT 바깥의 파일에 연결된 동영상은 가져오지 못해 표지 그림만 넣었습니다');
      if (poster) { stats.image++; return imageEl(b.x, b.y, b.w, b.h, poster, { fit: 'fill' }); }
      stats.skipped++; return null;
    };

    const deck = { title: (opts.title || file.name || 'PPT').replace(/\.[^.]+$/, ''), theme: 'clean', decor: 'none', created: new Date().toISOString(), slides: [], imported: { from: file.name, size: file.size, at: new Date().toISOString() } };
    for (let si = 0; si < order.length; si++) {
      const sp = order[si]; say(`슬라이드 ${si + 1} / ${order.length} 변환 중…`);
      const sdoc = await docOf(sp); if (!sdoc) { stats.skipped++; continue; }
      const rels = await relsOf(sp);
      const lr = relOf(rels, 'slideLayout'), lp = lr ? lr.target : '', ldoc = lp ? await docOf(lp) : null;
      const mr = lp ? relOf(await relsOf(lp), 'slideMaster') : null, mp = mr ? mr.target : '', mdoc = mp ? await docOf(mp) : null;
      const T = mp ? await themeOf(mp) : Y.parseTheme('');
      const C = ctxOf(rels, T);
      const slide = { id: uid(), bg: null, decor: 'none', noFooter: true, transition: '', notes: '', elements: [] };
      const root = sdoc.documentElement;
      if (Y.attr(root, 'show', '1') === '0') slide.hidden = true;
      const showMaster = Y.attr(root, 'showMasterSp', '1') !== '0' && (!ldoc || Y.attr(ldoc.documentElement, 'showMasterSp', '1') !== '0');
      try { slide.bg = (await bgOf(sdoc, C)) || (ldoc && await bgOf(ldoc, ctxOf(await relsOf(lp), T))) || (mdoc && await bgOf(mdoc, ctxOf(await relsOf(mp), T))) || null; } catch (e) { slide.bg = null; }
      if (!slide.bg) slide.bg = { color: '#ffffff' };
      if (ldoc || mdoc) { const d = await decoOf(lp, ldoc, mp, mdoc, T, showMaster); if (d) slide.elements.push(imageEl(Math.round(OX), Math.round(OY), Math.round(sw * K), Math.round(sh * K), d, { fit: 'fill', locked: true })); }
      const tsAll = mdoc && mdoc.getElementsByTagNameNS('*', 'txStyles')[0];
      const chainFor = (node, ph, lph, mph) => { // → { list, nLocal }
        const local = [listStyle(Y, node), listStyle(Y, lph), listStyle(Y, mph)].filter(Boolean), c = local.slice();
        if (tsAll) { const nm = !ph ? 'otherStyle' : PH_T(ph.type) === 'title' ? 'titleStyle' : 'bodyStyle'; c.push(Y.kid(tsAll, nm)); if (nm !== 'otherStyle') c.push(Y.kid(tsAll, 'otherStyle')); }
        c.push(defStyle); return { list: c.filter(Boolean), nLocal: local.length };
      };
      const take = async (node) => {
        const ln = node.localName;
        if (ln === 'AlternateContent') { const c = Y.kid(node, 'Fallback') || Y.kid(node, 'Choice'); for (const n of c ? Array.from(c.children) : []) await take(n); return; }
        const name = Y.nameOf(node);
        if (ln === 'grpSp') { const x = Y.xfOf(Y.kid(Y.kid(node, 'grpSpPr'), 'xfrm')); if (!x) return; const e = await svgEl(node, C, name || '묶음'); if (e) { stats.drawn++; slide.elements.push(e); } return; }
        if (ln === 'graphicFrame') {
          const x = Y.xfOf(Y.kid(node, 'xfrm')); if (!x) { stats.skipped++; return; } const b = box(x);
          const gd = Y.kid(Y.kid(node, 'graphic'), 'graphicData'), uri = Y.attr(gd, 'uri', '');
          if (/\/table$/.test(uri)) { const e = tableOf(Y.kid(gd, 'tbl'), b, C, chainFor(null, null, null, null).list); if (e) { stats.table++; slide.elements.push(e); } return; }
          if (/\/chart$/.test(uri)) { const cr = gd.getElementsByTagNameNS('*', 'chart')[0], r = cr && rels.get(cr.getAttribute('r:id') || ''); let e = null; try { e = r ? await chartOf(r.target, b) : null; } catch (err) { } if (e) { stats.chart++; slide.elements.push(e); } else { stats.skipped++; warn('읽지 못한 차트가 있습니다 (차트 자리는 비워 두었습니다)'); } return; }
          stats.skipped++; warn(/diagram/i.test(uri) ? 'SmartArt 는 가져오지 못합니다 — PowerPoint 에서 [그림으로 변환] 한 뒤 다시 저장하면 들어옵니다' : '가져오지 못하는 개체(OLE·수식 등)가 있습니다'); return;
        }
        if (ln === 'pic') {
          const spPr = Y.kid(node, 'spPr'), x = Y.xfOf(Y.kid(spPr, 'xfrm')); if (!x) return; const b = box(x);
          if (Y.hasMedia(node)) { if (node.getElementsByTagNameNS('*', 'videoFile')[0]) { const e = await videoOf(node, b, C, rels, name); if (e) slide.elements.push(e); } else { stats.skipped++; warn('소리 파일은 가져오지 못합니다'); } return; }
          const bf = Y.kid(node, 'blipFill'), [svgId, rid] = Y.blipRid(bf), r = rels.get(svgId) || rels.get(rid);
          if (!r || r.external || !idx.has(r.target) || !Y.MIME[extOf(r.target)]) { stats.emf++; return; }
          const sr = Y.kid(bf, 'srcRect'), crop = sr && ['l', 't', 'r', 'b'].some(k => Math.abs(Y.numA(sr, k, 0)) > 50);
          const line = Y.lineOf(spPr, Y.kid(node, 'style'), C), pg = Y.attr(Y.kid(spPr, 'prstGeom'), 'prst', 'rect');
          if (!crop && pg === 'rect' && !Y.kid(spPr, 'custGeom')) {
            const blob = await zipBlob(file, idx.get(r.target), Y.MIME[extOf(r.target)]);
            const prep = await prepareImage(new File([blob], ((name || '그림').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 30) || '그림') + '.' + extOf(r.target), { type: blob.type }));
            const e = imageEl(b.x, b.y, b.w, b.h, await stage(prep.blob, prep.name), { fit: 'fill' });
            if (x.rot) e.rotate = Math.round(x.rot * 10) / 10; if (x.fh) e.flip = true; if (x.fv) e.flipV = true;
            const am = Y.numA(Y.kid(Y.kid(bf, 'blip'), 'alphaModFix'), 'amt', 100000) / 100000; if (am < 1) e.opacity = r2(am);
            if (line) { e.border = Math.max(1, Math.round(line.w * K)); e.borderColor = line.c; }
            stats.image++; slide.elements.push(e); return;
          }
          const e = await svgEl(node, C, name || '그림'); if (e) { stats.image++; slide.elements.push(e); } return;
        }
        if (ln === 'cxnSp') { const e = await svgEl(node, C, name || '선'); if (e) { stats.drawn++; slide.elements.push(e); } return; }
        if (ln !== 'sp') return;
        const ph = phOf(Y, node), lph = ph ? findPh(Y, ldoc, ph) : null, mph = ph ? findPh(Y, mdoc, lph ? phOf(Y, lph) || ph : ph) : null;
        const spPr = Y.kid(node, 'spPr'), style = Y.kid(node, 'style');
        const x = Y.xfOf(Y.kid(spPr, 'xfrm')) || (lph && Y.xfOf(Y.kid(Y.kid(lph, 'spPr'), 'xfrm'))) || (mph && Y.xfOf(Y.kid(Y.kid(mph, 'spPr'), 'xfrm')));
        if (!x || (x.w < 1 && x.h < 1)) return;
        const b = box(x);
        const inherit = (fn) => fn(spPr, style) || (lph && fn(Y.kid(lph, 'spPr'), Y.kid(lph, 'style'))) || (mph && fn(Y.kid(mph, 'spPr'), Y.kid(mph, 'style'))) || null;
        const fill = ph ? inherit((p, s) => Y.fillOf(p, s, C)) : Y.fillOf(spPr, style, C), line = ph ? inherit((p, s) => Y.lineOf(p, s, C)) : Y.lineOf(spPr, style, C);
        const fontRef = style && Y.kid(style, 'fontRef'), fontColor = fontRef ? Y.colorOf(fontRef, T) : null, defColor = fontColor || { c: '#' + T.clr.dk1, a: 1 };
        const ch = chainFor(node, ph, lph, mph), tx = readTextBox(Y, node, ch.list, fontColor, K, T, ch.nLocal);
        const hasText = !!(tx && tx.plain);
        if (!fill && !line) { // 글만 있는 상자
          if (!hasText) return;
          const e = textEl(ph && PH_T(ph.type) === 'title' ? 'title' : 'body', b.x, b.y, b.w, b.h, tx.html, { style: tx.style });
          if (x.rot) e.rotate = Math.round(x.rot * 10) / 10;
          stats.text++; slide.elements.push(e); return;
        }
        const prst = Y.kid(spPr, 'custGeom') ? '' : Y.attr(Y.kid(spPr, 'prstGeom'), 'prst', (ph ? '' : 'rect')) || (lph && Y.attr(Y.kid(Y.kid(lph, 'spPr'), 'prstGeom'), 'prst', '')) || 'rect';
        const simpleFill = !fill || (fill.c && !fill.stops && !fill.img), simpleLine = !line || !line.head && !line.tail;
        const shape = SHAPE_MAP[prst];
        if (shape && simpleFill && simpleLine && (!fill || fill.a > 0.97 || !hasText)) { // 교안 도형으로 (글도 그 안에)
          const e = shapeEl(shape, b.x, b.y, b.w, b.h, { fill: fill ? fill.c : '', stroke: line ? line.c : '', strokeWidth: line ? Math.max(1, Math.round(line.w * K)) : 0, radius: 0, shadow: false, html: hasText ? tx.html : '', style: {} });
          if (prst === 'roundRect' || prst === 'flowChartAlternateProcess') { const g = Y.kids(Y.kid(Y.kid(spPr, 'prstGeom'), 'avLst'), 'gd')[0], v = g && /val\s+(-?\d+)/.exec(Y.attr(g, 'fmla', '')); e.radius = Math.round(Math.min(b.w, b.h) * Math.min(50000, v ? +v[1] : 16667) / 100000); }
          if (prst === 'flowChartTerminator') e.radius = Math.round(Math.min(b.w, b.h) / 2);
          if (line && line.dash) e.dash = true;
          if (fill && fill.a <= 0.97) e.opacity = r2(fill.a);
          if (x.rot) e.rotate = Math.round(x.rot * 10) / 10; if (x.fh) e.flip = true; if (x.fv) e.flipV = true;
          if (hasText) e.style = Object.assign({ valign: 'middle', align: 'center' }, tx.style); else e.style = { fontSize: 36, color: defColor.c, bold: false, align: 'center', valign: 'middle' };
          stats.shape++; slide.elements.push(e); return;
        }
        const e = await svgEl(hasText ? stripText(node) : node, C, name || '도형');
        if (e) { stats.drawn++; slide.elements.push(e); }
        if (hasText) { const t = textEl('body', b.x, b.y, b.w, b.h, tx.html, { style: Object.assign({ valign: 'middle', align: 'center' }, tx.style) }); if (x.rot) t.rotate = Math.round(x.rot * 10) / 10; stats.text++; slide.elements.push(t); }
      };
      const tree = sdoc.getElementsByTagNameNS('*', 'spTree')[0];
      for (const n of tree ? Array.from(tree.children) : []) { try { await take(n); } catch (e) { stats.skipped++; warn('가져오지 못한 개체가 있습니다: ' + e.message); } }
      // 발표자 노트
      try {
        const nr = relOf(rels, 'notesSlide'); const nd = nr ? await docOf(nr.target) : null;
        if (nd) for (const s of nd.getElementsByTagNameNS('*', 'sp')) { const p = phOf(Y, s); if (p && p.type === 'body') { slide.notes = Y.plainText(s); break; } }
      } catch (e) { }
      deck.slides.push(slide); stats.slides++;
    }
    if (!deck.slides.length) throw new Error('가져올 수 있는 슬라이드가 없습니다');
    const T0 = themes.values().next().value; // 첫 마스터의 테마 색 → 교안의 강조색 (글머리 기호 · 차트 기본 색이 PPT 와 비슷하게)
    if (T0) deck.colors = { accent: '#' + T0.clr.accent1, accent2: '#' + T0.clr.accent2, title: '#' + T0.clr.dk2, fg: '#' + T0.clr.dk1 };
    if (stats.emf) warn(`브라우저가 열 수 없는 형식(EMF·WMF)의 그림 ${stats.emf}개는 건너뛰었습니다 — PowerPoint 에서 그 그림을 복사해 편집기에 붙여넣으면 들어옵니다`);
    deck.title = deck.title || 'PPT';
    return { deck, stats, warnings };
  }
  const isPptx = (f) => !!f && /\.(pptx|ppsx|pptm|ppsm|potx)$/i.test(f.name || '');
  const isOldPpt = (f) => !!f && /\.(ppt|pps|pot)$/i.test(f.name || '');
  return { toDeck, isPptx, isOldPpt };
})();
