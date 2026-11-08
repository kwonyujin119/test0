/* 교안 → PowerPoint(.pptx) 내보내기 — 외부 라이브러리 없이 브라우저에서 바로 만듭니다.
   pptx 는 ZIP 묶음(XML + 그림·영상)이라 app/hwp/zip.js 의 Zip.write 로 묶습니다.
   - 글 상자 · 도형 · 표 · 그림: PowerPoint 에서 그대로 고칠 수 있는 개체로
   - 차트 · 수식: 그림으로 (모양 그대로, 내용은 PowerPoint 에서 못 고침)
   - 동영상 파일: PPT 안에 넣거나(선택), 표지 그림 + 링크로
   - 발표자 노트 · 슬라이드 전환 · 클릭 단계(나타나기)도 옮김
   단위: 슬라이드 1920×1080px = 12192000×6858000 EMU (1px = 6350 EMU), 글자 1px = 0.5pt */
const PPTX = (() => {
  const EMU = 6350, SW = 1920, SH = 1080;
  const emu = (px) => Math.round(px * EMU);
  const X = (s) => String(s == null ? '' : s).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f￾￿]/g, '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  const CT = 'application/vnd.openxmlformats-officedocument.presentationml.';

  /* ---------- 색 ---------- */
  let _cv = null;
  function rgba(v) { // CSS 색 → { hex: 'RRGGBB', a: 0~1 } (없음·투명·모르는 값은 null)
    if (v == null || v === '' || v === 'none' || v === 'transparent') return null;
    if (!_cv) _cv = document.createElement('canvas').getContext('2d');
    _cv.fillStyle = '#010203'; _cv.fillStyle = String(v); const s = _cv.fillStyle;
    if (s === '#010203' && !/^#?010203$/i.test(String(v).trim())) return null;
    if (s[0] === '#') return { hex: s.slice(1, 7).toUpperCase(), a: 1 };
    const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/);
    if (!m) return null;
    const h = (n) => Math.max(0, Math.min(255, Math.round(+n))).toString(16).padStart(2, '0');
    return { hex: (h(m[1]) + h(m[2]) + h(m[3])).toUpperCase(), a: m[4] == null ? 1 : +m[4] };
  }
  function mix(a, b, t) { // a 를 t 만큼, b 를 (1-t) 만큼 섞은 색 (#rrggbb)
    const A = rgba(a) || { hex: '000000' }, B = rgba(b) || { hex: 'FFFFFF' };
    const ch = (i) => Math.round(parseInt(A.hex.substr(i, 2), 16) * t + parseInt(B.hex.substr(i, 2), 16) * (1 - t)).toString(16).padStart(2, '0');
    return '#' + ch(0) + ch(2) + ch(4);
  }
  function clr(c, mul) { const a = c.a * (mul == null ? 1 : mul); return a < 0.999 ? `<a:srgbClr val="${c.hex}"><a:alpha val="${Math.max(0, Math.round(a * 100000))}"/></a:srgbClr>` : `<a:srgbClr val="${c.hex}"/>`; }
  function solid(v, mul) { const c = rgba(v); return c && c.a * (mul == null ? 1 : mul) > 0.003 ? `<a:solidFill>${clr(c, mul)}</a:solidFill>` : '<a:noFill/>'; }
  function lineXml(width, v, mul, extra) { const c = rgba(v); if (!(width > 0) || !c) return '<a:ln><a:noFill/></a:ln>'; return `<a:ln w="${emu(width)}"${extra && extra.cap ? ` cap="${extra.cap}"` : ''}><a:solidFill>${clr(c, mul)}</a:solidFill>${extra && extra.dash ? '<a:prstDash val="dash"/>' : ''}${extra && extra.join ? '<a:round/>' : ''}${extra && extra.ends ? extra.ends : ''}</a:ln>`; }
  const SHADOW = (blur, dist, alpha) => `<a:effectLst><a:outerShdw blurRad="${emu(blur)}" dist="${emu(dist)}" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="${Math.round(alpha * 100000)}"/></a:srgbClr></a:outerShdw></a:effectLst>`;
  /* CSS 그라데이션 → gradFill (linear-gradient(각도, 색…) · radial-gradient(…)) */
  function gradient(css, mul) {
    const m = /^\s*(linear|radial)-gradient\((.*)\)\s*$/i.exec(String(css || '')); if (!m) return null;
    const parts = []; let depth = 0, cur = '';
    for (const ch of m[2]) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { parts.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) parts.push(cur.trim());
    let ang = 180; const radial = m[1].toLowerCase() === 'radial';
    if (parts.length && !rgba(parts[0].replace(/\s+[\d.]+%\s*$/, ''))) {
      const f = parts.shift(), d = /(-?[\d.]+)deg/.exec(f);
      if (d) ang = +d[1]; else if (/to\s+right/.test(f)) ang = 90; else if (/to\s+left/.test(f)) ang = 270; else if (/to\s+top/.test(f)) ang = 0; else if (/to\s+bottom/.test(f)) ang = 180;
    }
    const stops = parts.map(p => { const q = /^(.*?)(?:\s+(-?[\d.]+)%)?$/.exec(p); return { c: rgba(q[1].trim()), pos: q[2] == null ? null : +q[2] }; }).filter(s => s.c);
    if (stops.length < 2) return null;
    stops.forEach((s, i) => { if (s.pos == null) s.pos = i === 0 ? 0 : i === stops.length - 1 ? 100 : null; });
    for (let i = 0; i < stops.length; i++) if (stops[i].pos == null) { let j = i; while (stops[j].pos == null) j++; const a = stops[i - 1].pos, b = stops[j].pos; for (let k = i; k < j; k++) stops[k].pos = a + (b - a) * (k - i + 1) / (j - i + 1); }
    const gs = stops.map(s => `<a:gs pos="${Math.round(Math.max(0, Math.min(100, s.pos)) * 1000)}">${clr(s.c, mul)}</a:gs>`).join('');
    return `<a:gradFill rotWithShape="1"><a:gsLst>${gs}</a:gsLst>${radial ? '<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path>' : `<a:lin ang="${Math.round((((ang - 90) % 360) + 360) % 360 * 60000)}" scaled="0"/>`}</a:gradFill>`;
  }

  /* ---------- 글꼴 ---------- */
  function face(id) { // 교안 글꼴 → PowerPoint 글꼴 이름 (기본 글꼴은 어느 PC 에나 있는 것으로)
    const f = (typeof FONTS !== 'undefined' && FONTS.find(x => x.id === id)) || null;
    if (!f || f.id === 'sans') return '맑은 고딕';
    if (f.id === 'mono') return 'Consolas';
    return f.face || f.fam || '맑은 고딕';
  }
  /* 글자 폭 맞춤: 교안의 웹 글꼴(프리텐다드 등)은 PC 글꼴(맑은 고딕)보다 한글이 좁습니다 (약 15%).
     그대로 두면 PowerPoint 에서 줄이 넘쳐 배치가 틀어지므로, 글 조각마다 두 글꼴로 실제 폭을 재서
     그 차이만큼 글자 간격을 좁힙니다 (PC 에 같은 글꼴이 있으면 차이가 0 이라 그대로). → 1자당 보정(em) */
  let _mc = null; const _kc = new Map();
  function kOf(t, st) {
    if (!st.web || !t) return 0;
    const w = st.bold ? 700 : 400, key = w + '|' + st.web + '|' + st.font + '|' + t;
    if (_kc.has(key)) return _kc.get(key);
    let k = 0;
    try {
      if (!_mc) _mc = document.createElement('canvas').getContext('2d');
      const m = (font) => { _mc.font = `${w} 100px ${font}`; return _mc.measureText(t).width; };
      k = (m(st.web) - m(`"${st.font}", "Malgun Gothic", sans-serif`)) / Array.from(t).length / 100;
      k = Math.abs(k) < 0.004 ? 0 : Math.max(-0.25, Math.min(0.15, k));
    } catch (e) { k = 0; }
    if (_kc.size > 20000) _kc.clear();
    _kc.set(key, k); return k;
  }
  async function prepFonts(deck, theme) { // 폭을 재기 전에 교안에 쓰인 글꼴을 다 받아 둠
    const ids = new Set(['sans', theme.titleFont, theme.bodyFont]);
    for (const sl of deck.slides) for (const e of sl.elements || []) if (e.style && e.style.font) ids.add(e.style.font);
    const jobs = [];
    for (const id of ids) { const f = typeof FONTS !== 'undefined' && FONTS.find(x => x.id === id); if (!f) continue; try { if (typeof loadFont === 'function') loadFont(id); } catch (e) { } for (const w of [400, 700]) jobs.push(document.fonts.load(`${w} 40px ${f.css}`, '가나다 abc 123').catch(() => { })); }
    await Promise.race([Promise.all(jobs), new Promise(r => setTimeout(r, 4000))]);
    _kc.clear();
  }
  function segs(t, st) { // 글을 한글 쪽 / 영문·숫자·기호 쪽으로 나눠 조각마다 보정값을 구함 (띄어쓰기는 앞 조각에 붙임)
    if (!st.web) return [[t, 0]];
    const out = []; let cur = '', cls = '';
    for (const ch of t) {
      const c = ch.codePointAt(0), q = c === 0x20 || c === 0xa0 || c === 0x09 ? (cls || '') : c >= 0x1100 && !(c >= 0x2000 && c < 0x2e80) ? 'H' : 'O';
      if (q && cls && q !== cls && cur) { out.push(cur); cur = ''; }
      if (q) cls = q; cur += ch;
    }
    if (cur) out.push(cur);
    return out.map(x => [x, kOf(x, st)]);
  }
  function faceOfCss(fam) { // 글 안에 직접 지정된 font-family
    const n = String(fam || '').split(',')[0].replace(/['"]/g, '').trim(); if (!n) return '';
    if (/pretendard/i.test(n)) return '맑은 고딕';
    const f = typeof findFontByFace === 'function' ? findFontByFace(n) : null;
    return f ? face(f.id) : n;
  }

  /* ---------- 글 (HTML → 문단 · 글자 조각) ---------- */
  const BLOCK = /^(div|p|h[1-6]|blockquote|pre|section|article|table|tr|td|th)$/;
  function parseHtml(html, base) {
    const root = document.createElement('div'); root.innerHTML = typeof safeHtml === 'function' ? safeHtml(html || '') : (html || '');
    root.querySelectorAll('.placeholder').forEach(n => n.remove());
    const paras = []; let cur = null, topItem = -1, itemNo = -1;
    const open = (o) => { cur = Object.assign({ runs: [], li: null, align: base.align || 'left', item: topItem, top: false }, o || {}); paras.push(cur); return cur; };
    const need = () => cur || open();
    const closeBlock = () => { if (cur) { const r = cur.runs; if (r.length && r[r.length - 1].br) r.pop(); } cur = null; };
    const text = (t, st) => { const parts = String(t).split('\n'); parts.forEach((s, i) => { if (i) need().runs.push({ br: true, st }); if (s) need().runs.push({ t: s, st }); }); };
    const styled = (st, el, tag) => {
      const s = Object.assign({}, st), cs = el.style;
      if (tag === 'b' || tag === 'strong') s.bold = true; else if (tag === 'i' || tag === 'em') s.italic = true; else if (tag === 'u' || tag === 'ins') s.underline = true;
      else if (tag === 's' || tag === 'strike' || tag === 'del') s.strike = true; else if (tag === 'sup') s.base = 30000; else if (tag === 'sub') s.base = -25000;
      else if (tag === 'mark') s.hl = mix(base.accent2 || '#f59e0b', base.bgc || '#ffffff', 0.45);
      else if (tag === 'code') { s.font = 'Consolas'; s.size = s.size * 0.92; s.web = typeof FONT_MONO !== 'undefined' ? FONT_MONO : ''; }
      else if (tag === 'a') { const h = el.getAttribute('href') || ''; if (/^https?:|^mailto:/i.test(h)) s.link = h; s.color = base.accent || s.color; s.underline = true; }
      else if (tag === 'font') { const c = el.getAttribute('color'); if (c && rgba(c)) s.color = c; const f = el.getAttribute('face'); if (f && faceOfCss(f)) { s.font = faceOfCss(f); s.web = f; } }
      if (cs && cs.cssText) {
        if (cs.color && rgba(cs.color)) s.color = cs.color;
        if (cs.backgroundColor && rgba(cs.backgroundColor)) s.hl = cs.backgroundColor;
        if (cs.fontSize) { const v = parseFloat(cs.fontSize); if (v > 0) s.size = /px$/.test(cs.fontSize) ? v : /pt$/.test(cs.fontSize) ? v * 2 : /em$/.test(cs.fontSize) ? s.size * v : /%$/.test(cs.fontSize) ? s.size * v / 100 : s.size; }
        if (cs.fontWeight) s.bold = /bold/.test(cs.fontWeight) || parseInt(cs.fontWeight, 10) >= 600;
        if (cs.fontStyle) s.italic = /italic|oblique/.test(cs.fontStyle);
        const td = cs.textDecorationLine || cs.textDecoration || ''; if (/underline/.test(td)) s.underline = true; if (/line-through/.test(td)) s.strike = true;
        if (cs.fontFamily) { const nf = faceOfCss(cs.fontFamily); if (nf) { s.font = nf; s.web = cs.fontFamily; } }
        if (cs.letterSpacing && /px$/.test(cs.letterSpacing)) s.spc = parseFloat(cs.letterSpacing);
      }
      return s;
    };
    const walk = (node, st, depth, inLi) => {
      for (const ch of Array.from(node.childNodes)) {
        if (ch.nodeType === 3) { if (/^(ul|ol)$/i.test(node.tagName || '') && !ch.nodeValue.trim()) continue; text(ch.nodeValue, st); continue; }
        if (ch.nodeType !== 1) continue;
        const tag = ch.tagName.toLowerCase();
        if (tag === 'br') { const q = need(); q.runs.push({ br: true, st }); q.keep = true; continue; }
        if (tag === 'img' || tag === 'svg' || tag === 'style' || tag === 'script') continue;
        const s2 = styled(st, ch, tag);
        if (tag === 'ul' || tag === 'ol') {
          closeBlock(); const s3 = depth >= 1 ? Object.assign({}, s2, { size: s2.size * 0.9 }) : s2; let n = 0;
          for (const li of Array.from(ch.children)) {
            if (li.tagName.toLowerCase() !== 'li') { walk(li, s3, depth + 1, inLi); continue; }
            closeBlock(); if (depth === 0) topItem = ++itemNo;
            open({ li: { ordered: tag === 'ol', level: depth, n: ++n }, align: li.style.textAlign || base.align || 'left' });
            walk(li, styled(s3, li, 'li'), depth + 1, true); closeBlock();
          }
          if (depth === 0) topItem = -1;
          continue;
        }
        if (BLOCK.test(tag)) {
          if (cur && cur.li && !cur.runs.length) { walk(ch, s2, depth, inLi); closeBlock(); continue; } // <li><div>글</div></li>: 글머리 줄에 그대로
          closeBlock(); const p = open({ align: ch.style.textAlign || (ch.getAttribute('align') || '') || base.align || 'left', top: node === root, blk: true });
          if (inLi && paras.length > 1) p.cont = depth; // 목록 항목 안의 이어지는 문단 (글머리 없이 들여쓰기만)
          walk(ch, s2, depth, inLi);
          closeBlock();
          if (!p.runs.length && !p.keep) paras.splice(paras.indexOf(p), 1); // 빈 상자는 높이가 없음 (<div><br></div> 는 빈 줄 하나)
          continue;
        }
        walk(ch, s2, depth, inLi);
      }
    };
    const st0 = { size: base.size, color: base.color, bold: !!base.bold, italic: !!base.italic, underline: !!base.underline, strike: false, font: base.font, spc: base.spc || 0, web: base.web || '' };
    walk(root, st0, 0, false); closeBlock();
    return paras;
  }
  function rPr(tag, st, base, o, kk) {
    const sz = Math.max(100, Math.min(400000, Math.round(st.size * 50))), spc = Math.round(((st.spc || 0) + (kk || 0) * st.size) * 50);
    let a = ` lang="ko-KR" altLang="en-US" sz="${sz}" b="${st.bold ? 1 : 0}" i="${st.italic ? 1 : 0}"`;
    if (st.underline) a += ' u="sng"'; if (st.strike) a += ' strike="sngStrike"';
    if (spc) a += ` spc="${spc}"`; if (st.base) a += ` baseline="${st.base}"`;
    a += ' dirty="0"';
    let c = '';
    if (base.outline) c += lineXml(base.outline, base.outlineColor || '#000000', base.op);
    c += solid(st.color, base.op);
    if (base.tshadow) c += SHADOW(18, 4, 0.45);
    if (st.hl) { const h = rgba(st.hl); if (h) c += `<a:highlight><a:srgbClr val="${h.a < 0.999 ? mix('#' + h.hex, base.bgc || '#ffffff', h.a).slice(1).toUpperCase() : h.hex}"/></a:highlight>`; }
    const f = X(st.font || '맑은 고딕'); c += `<a:latin typeface="${f}"/><a:ea typeface="${f}"/><a:cs typeface="${f}"/>`;
    if (st.link && o && o.rel) c += `<a:hlinkClick r:id="${o.rel(st.link)}"/>`;
    return `<${tag}${a}>${c}</${tag}>`;
  }
  /* 문단들을 <a:p>… 로. base: { size, color, font, lineHeight, align, list, paraGap, accent, op, … }, o.rel(url) → rId */
  function parasXml(paras, base, o) {
    if (!paras.length) paras = [{ runs: [], li: null, align: base.align || 'left' }];
    const ALG = { left: 'l', center: 'ctr', right: 'r', justify: 'just', start: 'l', end: 'r' };
    const lh = base.lineHeight || 1.5, list = base.list || '';
    const MARK = { check: '✔', arrow: '➜', dash: '–', square: '■', star: '★' };
    return paras.map((p, pi) => {
      const sizes = p.runs.map(r => r.st.size); const fs = sizes.length ? Math.max(...sizes) : base.size;
      let attr = ` algn="${ALG[p.align] || ALG[base.align] || 'l'}"`, bu = '<a:buNone/>';
      const pad = list && list !== 'none' ? 1.4 : 1.2;
      if (p.li) {
        const lvFs = base.size * Math.pow(0.9, p.li.level);
        if (list === 'none' && !p.li.ordered) { attr += ` marL="${emu(p.li.level * pad * lvFs)}" indent="0"`; }
        else {
          const left = (p.li.level + 1) * pad * lvFs + 0.15 * lvFs, hang = (p.li.ordered ? 1.15 : MARK[list] ? 1.4 : 0.85) * lvFs;
          attr += ` marL="${emu(left)}" indent="${-emu(Math.min(hang, left))}"`;
          const ac = rgba(base.accent || base.color);
          bu = (ac ? `<a:buClr>${clr(ac, base.op)}</a:buClr>` : '') + `<a:buSzPct val="${list === 'square' && !p.li.ordered ? 70000 : 100000}"/>`
            + (p.li.ordered ? `<a:buFont typeface="${X(base.font || '맑은 고딕')}"/><a:buAutoNum type="arabicPeriod"/>` : MARK[list] ? `<a:buFont typeface="Segoe UI Symbol"/><a:buChar char="${MARK[list]}"/>` : '<a:buFont typeface="Arial"/><a:buChar char="•"/>');
        }
      } else if (p.cont != null) attr += ` marL="${emu(p.cont * pad * base.size + 0.15 * base.size)}" indent="0"`;
      const bef = p.li ? Math.round(0.12 * fs * 50) : 0;
      const aft = p.top && pi < paras.length - 1 && base.paraGap ? Math.round(base.paraGap * 50) : 0;
      const pPr = `<a:pPr${attr}><a:lnSpc><a:spcPts val="${Math.max(100, Math.round(lh * fs * 50))}"/></a:lnSpc><a:spcBef><a:spcPts val="${bef}"/></a:spcBef><a:spcAft><a:spcPts val="${aft}"/></a:spcAft>${bu}</a:pPr>`;
      const runs = p.runs.map(r => r.br ? `<a:br>${rPr('a:rPr', r.st, base, o)}</a:br>` : segs(r.t, r.st).map(([t, kk]) => `<a:r>${rPr('a:rPr', r.st, base, o, kk)}<a:t>${X(t)}</a:t></a:r>`).join('')).join('');
      const last = p.runs.length ? p.runs[p.runs.length - 1].st : { size: base.size, color: base.color, bold: base.bold, italic: base.italic, font: base.font };
      return `<a:p>${pPr}${runs}${rPr('a:endParaRPr', Object.assign({}, last, { link: '', hl: '' }), base, o)}</a:p>`;
    }).join('');
  }
  function textBase(e, st, theme, op) {
    return { size: st.fontSize, color: themeColor(st.color, theme), bold: st.bold, italic: st.italic, underline: st.underline, font: face(st.font), lineHeight: st.lineHeight || 1.5, align: st.align || 'left',
      spc: st.letterSpacing || 0, outline: st.outline || 0, outlineColor: themeColor(st.outlineColor || '#000000', theme), tshadow: !!st.tshadow, list: st.list || '', paraGap: st.paraGap || 0,
      accent: theme.accent, accent2: theme.accent2, bgc: theme.bg, op: op == null ? 1 : op, web: typeof fontCss === 'function' ? fontCss(st.font) : '' };
  }
  const ANCH = { middle: 'ctr', bottom: 'b' };
  function bodyPr(ins, anchor, vert) { return `<a:bodyPr rot="0" vert="${vert ? 'eaVert' : 'horz'}" wrap="square" lIns="${emu(ins[3])}" tIns="${emu(ins[0])}" rIns="${emu(ins[1])}" bIns="${emu(ins[2])}" rtlCol="0" anchor="${anchor || 't'}"><a:noAutofit/></a:bodyPr><a:lstStyle/>`; }

  /* ---------- 도형 모양 (편집 화면의 renderShape 와 같은 좌표) ---------- */
  const POLY = {
    triangle: [[.5, 0], [1, 1], [0, 1]], rtriangle: [[0, 0], [1, 1], [0, 1]], diamond: [[.5, 0], [1, .5], [.5, 1], [0, .5]], pentagon: [[.5, 0], [1, .38], [.81, 1], [.19, 1], [0, .38]],
    hexagon: [[.25, 0], [.75, 0], [1, .5], [.75, 1], [.25, 1], [0, .5]], octagon: [[.29, 0], [.71, 0], [1, .29], [1, .71], [.71, 1], [.29, 1], [0, .71], [0, .29]],
    parallelogram: [[.2, 0], [1, 0], [.8, 1], [0, 1]], trapezoid: [[.18, 0], [.82, 0], [1, 1], [0, 1]],
    plus: (() => { const t = .34, a = (1 - t) / 2, b = a + t; return [[a, 0], [b, 0], [b, a], [1, a], [1, b], [b, b], [b, 1], [a, 1], [a, b], [0, b], [0, a], [a, a]]; })(),
  };
  const polyCmds = (pts) => pts.map((p, i) => [i ? 'L' : 'M', p[0], p[1]]).concat([['Z']]);
  function shapeCmds(e) { // → [['M',x,y] | ['L',x,y] | ['C',x1,y1,x2,y2,x,y] | ['Q',x1,y1,x,y] | ['A',rx,ry,시작각,돌림각] | ['Z']] (px)
    const w = e.w, h = e.h, sw = e.strokeWidth || 0, i = sw / 2, W = w - sw, H = h - sw, r = e.radius || 0;
    if (POLY[e.shape]) return polyCmds(POLY[e.shape].map(([a, b]) => [i + a * W, i + b * H]));
    switch (e.shape) {
      case 'star': { const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - sw, rr = R * 0.45, pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? rr : R; pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]); } return polyCmds(pts); }
      case 'chevron': { const d = Math.min(h / 2, w * 0.25); return polyCmds([[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h], [d, h / 2]]); }
      case 'blockArrow': { const d = Math.min(w * .45, h * .9); return polyCmds([[0, h * .28], [w - d, h * .28], [w - d, 0], [w, h / 2], [w - d, h], [w - d, h * .72], [0, h * .72]]); }
      case 'doubleArrow': { const d = Math.min(w * .3, h * .9); return polyCmds([[0, h / 2], [d, 0], [d, h * .28], [w - d, h * .28], [w - d, 0], [w, h / 2], [w - d, h], [w - d, h * .72], [d, h * .72], [d, h]]); }
      case 'ring': {
        const ell = (rx, ry, dir) => [['M', w / 2 - rx, h / 2]].concat([0, 1, 2, 3].map(k => ['A', rx, ry, dir > 0 ? 180 + 90 * k : 180 - 90 * k, 90 * dir]), [['Z']]);
        return ell(W / 2, H / 2, 1).concat(ell(W / 2 * .62, H / 2 * .62, -1));
      }
      case 'callout': {
        const bh = h * .78, rr = Math.max(0, Math.min(r || 24, W / 2, bh / 2));
        return [['M', i + rr, i], ['L', w - i - rr, i], ['Q', w - i, i, w - i, i + rr], ['L', w - i, bh - rr], ['Q', w - i, bh, w - i - rr, bh], ['L', w * .36, bh], ['L', w * .14, h - i], ['L', w * .2, bh], ['L', i + rr, bh], ['Q', i, bh, i, bh - rr], ['L', i, i + rr], ['Q', i, i, i + rr, i], ['Z']];
      }
      case 'heart': {
        const x = (v) => i + v * W, y = (v) => i + v * H;
        return [['M', x(.5), y(.28)], ['C', x(.5), y(.1), x(.3), y(0), x(.16), y(.06)], ['C', x(-.02), y(.15), x(-.02), y(.45), x(.12), y(.6)], ['L', x(.5), y(1)], ['L', x(.88), y(.6)], ['C', x(1.02), y(.45), x(1.02), y(.15), x(.84), y(.06)], ['C', x(.7), y(0), x(.5), y(.1), x(.5), y(.28)], ['Z']];
      }
    }
    return null;
  }
  function custGeom(cmds, w, h, flipH, flipV) {
    const S = 10, fx = (v) => Math.round((flipH ? w - v : v) * S), fy = (v) => Math.round((flipV ? h - v : v) * S), pt = (x, y) => `<a:pt x="${fx(x)}" y="${fy(y)}"/>`;
    const body = cmds.map(c => {
      switch (c[0]) {
        case 'M': return `<a:moveTo>${pt(c[1], c[2])}</a:moveTo>`;
        case 'L': return `<a:lnTo>${pt(c[1], c[2])}</a:lnTo>`;
        case 'C': return `<a:cubicBezTo>${pt(c[1], c[2])}${pt(c[3], c[4])}${pt(c[5], c[6])}</a:cubicBezTo>`;
        case 'Q': return `<a:quadBezTo>${pt(c[1], c[2])}${pt(c[3], c[4])}</a:quadBezTo>`;
        case 'A': return `<a:arcTo wR="${Math.round(c[1] * S)}" hR="${Math.round(c[2] * S)}" stAng="${Math.round((((c[3] % 360) + 360) % 360) * 60000)}" swAng="${Math.round(c[4] * 60000)}"/>`;
        default: return '<a:close/>';
      }
    }).join('');
    return `<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst><a:path w="${Math.round(w * S)}" h="${Math.round(h * S)}">${body}</a:path></a:pathLst></a:custGeom>`;
  }
  const prst = (name, adj) => `<a:prstGeom prst="${name}"><a:avLst>${adj || ''}</a:avLst></a:prstGeom>`;
  const roundGeom = (r, w, h) => { const m = Math.min(w, h); return r > 0 && m > 0 ? prst('roundRect', `<a:gd name="adj" fmla="val ${Math.round(Math.min(r, m / 2) / m * 100000)}"/>`) : prst('rect'); };
  const xfrm = (x, y, w, h, rot, flipH, flipV, tag) => `<${tag || 'a:xfrm'}${rot ? ` rot="${Math.round((((rot % 360) + 360) % 360) * 60000)}"` : ''}${flipH ? ' flipH="1"' : ''}${flipV ? ' flipV="1"' : ''}><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${Math.max(0, emu(w))}" cy="${Math.max(0, emu(h))}"/></${tag || 'a:xfrm'}>`;

  /* ---------- 파일 받기 · 그림 준비 ---------- */
  async function getBlob(src) {
    if (!src) return null;
    const urls = [API.resolveSrc(src)];
    if (!/^(data:|blob:|https?:)/i.test(src) && typeof GH !== 'undefined' && GH.cfg && GH.cfg.owner) urls.push(GH.rawUrl(src));
    for (const u of urls) { try { const r = await fetch(u); if (r.ok) { const b = await r.blob(); if (b.size) return b; } } catch (e) { } }
    return null;
  }
  function loadImage(url) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('그림을 열 수 없습니다')); im.src = url; }); }
  const canvasBlob = (c, type, q) => new Promise(res => c.toBlob(res, type || 'image/png', q));
  async function sniff(blob) { const b = new Uint8Array(await blob.slice(0, 12).arrayBuffer()); return b[0] === 0x89 && b[1] === 0x50 ? 'png' : b[0] === 0xFF && b[1] === 0xD8 ? 'jpeg' : b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 ? 'gif' : ''; }
  function filterCss(fx) { const f = []; fx = fx || {}; if (fx.b != null && fx.b !== 100) f.push(`brightness(${fx.b}%)`); if (fx.c != null && fx.c !== 100) f.push(`contrast(${fx.c}%)`); if (fx.s != null && fx.s !== 100) f.push(`saturate(${fx.s}%)`); if (fx.sepia) f.push(`sepia(${fx.sepia}%)`); if (fx.blur) f.push(`blur(${fx.blur}px)`); return f.join(' '); }
  /* 그림 파일 → PowerPoint 가 읽는 형식(png·jpeg·gif)으로, 보정(밝기 등)은 그림에 입혀서. → { data, ext, w, h } */
  async function prepImage(blob, fx) {
    const kind = await sniff(blob), filter = filterCss(fx), url = URL.createObjectURL(blob);
    try {
      const im = await loadImage(url); let w = im.naturalWidth, h = im.naturalHeight;
      if (!w || !h) { w = 800; h = 600; } // 크기 없는 SVG
      if (kind && !filter) return { data: new Uint8Array(await blob.arrayBuffer()), ext: kind, w, h };
      const k = kind ? 1 : Math.min(2, Math.max(1, 1600 / Math.max(w, h))); // SVG 등은 넉넉한 크기로
      const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
      const g = c.getContext('2d'); if (filter) g.filter = filter; g.drawImage(im, 0, 0, c.width, c.height);
      const jpg = kind === 'jpeg', out = await canvasBlob(c, jpg ? 'image/jpeg' : 'image/png', 0.92);
      return { data: new Uint8Array(await out.arrayBuffer()), ext: jpg ? 'jpeg' : 'png', w, h };
    } finally { URL.revokeObjectURL(url); }
  }
  /* SVG 글(차트) → PNG */
  async function svgToPng(svg, w, h, scale) {
    const im = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    const c = document.createElement('canvas'); c.width = Math.round(w * scale); c.height = Math.round(h * scale);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return new Uint8Array(await (await canvasBlob(c)).arrayBuffer());
  }
  /* 수식(KaTeX): 화면에 그린 것을 글꼴째 그림으로. 안 되면 null (→ 글자로 넣음) */
  let _katexCss = null;
  async function katexCss() {
    if (_katexCss != null) return _katexCss;
    const base = `https://cdn.jsdelivr.net/npm/katex@${typeof KATEX_V !== 'undefined' ? KATEX_V : '0.16.11'}/dist/`;
    let css = await (await fetch(base + 'katex.min.css')).text();
    const used = new Set(); document.fonts.forEach(f => { if (/KaTeX/.test(f.family) && f.status === 'loaded') used.add(f.family.replace(/['"]/g, '') + '|' + (f.weight === 'normal' ? '400' : f.weight === 'bold' ? '700' : f.weight) + '|' + f.style); });
    const faces = []; css = css.replace(/@font-face\{[^}]*\}/g, (m) => { faces.push(m); return ''; });
    let out = '';
    for (const f of faces) {
      const fam = (/font-family:\s*"?([^;"]+)"?/.exec(f) || [])[1], wt = (/font-weight:\s*([^;]+)/.exec(f) || [, '400'])[1].trim(), sty = (/font-style:\s*([^;]+)/.exec(f) || [, 'normal'])[1].trim();
      const key = fam + '|' + (wt === 'normal' ? '400' : wt === 'bold' ? '700' : wt) + '|' + sty;
      if (used.size && !used.has(key)) continue;
      const u = (/url\(([^)]+\.woff2)\)/.exec(f) || [])[1]; if (!u) continue;
      try { const b = await (await fetch(base + u.replace(/['"]/g, ''))).blob(); const d = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); out += `@font-face{font-family:"${fam}";font-weight:${wt};font-style:${sty};src:url(${d}) format("woff2")}`; } catch (e) { }
    }
    return (_katexCss = out + css);
  }
  async function mathToPng(e, theme, st) {
    if (typeof loadKatex !== 'function') return null;
    await loadKatex();
    const html = window.katex.renderToString(e.tex || '', { displayMode: true, throwOnError: false, output: 'html' });
    // 글꼴이 실제로 쓰이게 한 번 화면 밖에 그려 둠
    const probe = document.createElement('div'); probe.style.cssText = `position:fixed;left:-9999px;top:0;width:${e.w}px;font-size:${st.fontSize}px`; probe.innerHTML = html; document.body.appendChild(probe);
    try { await document.fonts.ready; await new Promise(r => setTimeout(r, 60)); await document.fonts.ready; } catch (err) { }
    const kx = probe.querySelector('.katex-html') || probe, kr = kx.getBoundingClientRect();
    let kw = kr.width; const kh = kr.height;
    kw = Math.max(kw, Array.from(probe.querySelectorAll('.katex-html > .base')).reduce((a, b) => a + b.getBoundingClientRect().width, 0));
    const padX = Math.ceil(Math.max(0, (kw - e.w) / 2) + 12), padY = Math.ceil(Math.max(0, (kh - e.h) / 2) + 12), W = e.w + padX * 2, Hh = e.h + padY * 2;
    const css = await katexCss(); probe.remove();
    const jc = ({ middle: 'center', bottom: 'flex-end' })[st.valign] || 'flex-start', c = rgba(themeColor(st.color, theme)) || { hex: '000000' };
    const s = 2, svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * s}" height="${Hh * s}" viewBox="0 0 ${W} ${Hh}"><foreignObject x="0" y="0" width="${W}" height="${Hh}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${Hh}px;padding:${padY}px 0;box-sizing:border-box;display:flex;flex-direction:column;justify-content:${jc};font-size:${st.fontSize}px;color:#${c.hex};text-align:${st.align || 'center'}"><style>${css.replace(/</g, '&lt;')}.katex-display{margin:0}.katex{font-size:1em}</style><div style="width:100%">${new XMLSerializer().serializeToString(new DOMParser().parseFromString('<div xmlns="http://www.w3.org/1999/xhtml">' + html + '</div>', 'text/html').body.firstChild)}</div></div></foreignObject></svg>`;
    for (let k = 0; k < 2; k++) { // 첫 번째는 글꼴이 덜 준비된 채 그려질 수 있어 두 번 그림
      const im = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
      const cv = document.createElement('canvas'); cv.width = W * s; cv.height = Hh * s; cv.getContext('2d').drawImage(im, 0, 0);
      if (k) return { data: new Uint8Array(await (await canvasBlob(cv)).arrayBuffer()), padX, padY };
      await new Promise(r => setTimeout(r, 120));
    }
    return null;
  }
  /* 영상 표지가 없을 때 쓰는 그림 */
  async function posterPng(label) {
    const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const g = c.getContext('2d');
    g.fillStyle = '#111'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = 'rgba(255,0,0,.9)'; g.beginPath(); g.arc(640, 320, 92, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(612, 268); g.lineTo(612, 372); g.lineTo(700, 320); g.closePath(); g.fill();
    g.font = '700 40px "Malgun Gothic", sans-serif'; g.textAlign = 'center'; g.fillText(label, 640, 500);
    return new Uint8Array(await (await canvasBlob(c)).arrayBuffer());
  }
  function videoMeta(blob) { return new Promise((res) => { const u = URL.createObjectURL(blob), v = document.createElement('video'); const done = (d) => { URL.revokeObjectURL(u); res(d); }; v.preload = 'metadata'; v.onloadedmetadata = () => done(isFinite(v.duration) ? v.duration : 0); v.onerror = () => done(0); setTimeout(() => done(0), 8000); v.src = u; }); }

  /* 상자 안에 그림이 놓이는 자리 (CSS object-fit · object-position · 확대 · 뒤집기와 같은 계산)
     → { x, y, w, h (보이는 부분, 상자 기준 px), crop: {l,t,r,b} (원본에서 잘라낼 비율), flipH, flipV } */
  function placeImage(bw, bh, iw, ih, fit, cx, cy, zoom, flipH, flipV) {
    cx = (cx == null ? 50 : cx) / 100; cy = (cy == null ? 50 : cy) / 100; zoom = zoom || 1;
    let rw, rh;
    if (fit === 'fill') { rw = bw; rh = bh; } else { const s = fit === 'cover' ? Math.max(bw / iw, bh / ih) : fit === 'none' ? 1 : Math.min(bw / iw, bh / ih); rw = iw * s; rh = ih * s; }
    let l = (bw - rw) * cx, t = (bh - rh) * cy; const ox = bw * cx, oy = bh * cy;
    let L = ox + (l - ox) * zoom, R = ox + (l + rw - ox) * zoom, T = oy + (t - oy) * zoom, B = oy + (t + rh - oy) * zoom;
    if (flipH) { const a = ox - (R - ox), b = ox - (L - ox); L = a; R = b; }
    if (flipV) { const a = oy - (B - oy), b = oy - (T - oy); T = a; B = b; }
    const vl = Math.max(0, L), vt = Math.max(0, T), vr = Math.min(bw, R), vb = Math.min(bh, B);
    if (vr - vl < 0.5 || vb - vt < 0.5) return null;
    let cl = (vl - L) / (R - L), cr = (R - vr) / (R - L), ct = (vt - T) / (B - T), cb = (B - vb) / (B - T);
    if (flipH) [cl, cr] = [cr, cl]; if (flipV) [ct, cb] = [cb, ct];
    return { x: vl, y: vt, w: vr - vl, h: vb - vt, crop: { l: cl, t: ct, r: cr, b: cb }, flipH: !!flipH, flipV: !!flipV };
  }
  const srcRect = (c) => { const v = (n) => Math.max(0, Math.round(n * 100000)); return c && (c.l > 1e-4 || c.t > 1e-4 || c.r > 1e-4 || c.b > 1e-4) ? `<a:srcRect l="${v(c.l)}" t="${v(c.t)}" r="${v(c.r)}" b="${v(c.b)}"/>` : ''; };

  /* ---------- 만들기 ----------
     opts: { videos: true(영상 파일을 PPT 안에 넣기), name, siteUrl(발표 화면 주소 — 넣지 않은 영상의 링크), progress(msg) }
     → { blob, warn: [안내 문장…] } */
  async function build(deck, opts) {
    opts = opts || {};
    if (typeof Zip === 'undefined') throw new Error('묶음 도구(zip)를 불러오지 못했습니다');
    const theme = deckTheme(deck), files = [], media = new Map(), exts = new Set(['png', 'jpeg']);
    await prepFonts(deck, theme);
    const say = (m) => { if (opts.progress) opts.progress(m); };
    const warn = { img: 0, vid: 0, vidLink: 0, math: 0, chart: 0 };
    let nImg = 0, nVid = 0;
    const addMedia = (key, data, ext, video) => { // 같은 파일은 한 번만 담음
      if (key && media.has(key)) return media.get(key);
      const name = video ? `media${++nVid}.${ext}` : `image${++nImg}.${ext}`; exts.add(ext);
      files.push({ name: 'ppt/media/' + name, data, store: true });
      const m = { name }; if (key) media.set(key, m); return m;
    };
    const imgCache = new Map();
    const image = async (src, fx) => { // → { name, w, h } | null
      const key = src + '|' + filterCss(fx); if (imgCache.has(key)) return imgCache.get(key);
      let out = null;
      try { const b = await getBlob(src); if (b) { const p = await prepImage(b, fx); out = Object.assign(addMedia(key, p.data, p.ext), { w: p.w, h: p.h }); } } catch (e) { out = null; }
      imgCache.set(key, out); return out;
    };
    const slideFile = new Map(deck.slides.map((s, i) => [s.id, i + 1]));
    const slides = [];

    for (let si = 0; si < deck.slides.length; si++) {
      const s = deck.slides[si]; say(`슬라이드 ${si + 1} / ${deck.slides.length}`);
      const rels = [], relKey = new Map(); let sid = 1;
      const rel = (type, target, ext) => { const k = type + '|' + target; if (relKey.has(k)) return relKey.get(k); const id = 'rId' + (rels.length + 2); rels.push(`<Relationship Id="${id}" Type="${type}" Target="${X(target)}"${ext ? ' TargetMode="External"' : ''}/>`); relKey.set(k, id); return id; };
      const o = { rel: (url) => rel(REL + 'hyperlink', url, true) };
      const link = (e) => { // 요소를 누르면 이동
        const v = e.link || ''; if (!v) return '';
        const jump = { next: 'nextslide', prev: 'previousslide', first: 'firstslide', last: 'lastslide' }[v];
        if (jump) return `<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=${jump}"/>`;
        if (v.startsWith('slide:') && slideFile.has(v.slice(6))) return `<a:hlinkClick r:id="${rel(REL + 'slide', `slide${slideFile.get(v.slice(6))}.xml`)}" action="ppaction://hlinksldjump"/>`;
        if (v.startsWith('url:') && /^https?:/i.test(v.slice(4))) return `<a:hlinkClick r:id="${o.rel(v.slice(4))}"/>`;
        return '';
      };
      const nv = (id, name, inner) => `<p:cNvPr id="${id}" name="${X(name)}"${inner ? `>${inner}</p:cNvPr>` : '/>'}`;
      const sp = (id, name, spPr, tx, hl, isText) => `<p:sp><p:nvSpPr>${nv(id, name, hl)}<p:cNvSpPr${isText ? ' txBox="1"' : ''}/><p:nvPr/></p:nvSpPr><p:spPr>${spPr}</p:spPr>${tx ? `<p:txBody>${tx}</p:txBody>` : ''}</p:sp>`;
      const pic = (id, name, rid, crop, spPr, hl, alpha, nvExtra) => `<p:pic><p:nvPicPr>${nv(id, name, hl)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr>${nvExtra || ''}</p:nvPr></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}">${alpha != null && alpha < 0.999 ? `<a:alphaModFix amt="${Math.round(alpha * 100000)}"/>` : ''}</a:blip>${srcRect(crop)}<a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${spPr}</p:spPr></p:pic>`;
      const shapes = [], anim = [], vids = [];

      /* 배경 */
      const bg = s.bg || {}; let bgXml = '', under = '';
      const bgFill = (fill) => `<p:bg><p:bgPr>${fill}<a:effectLst/></p:bgPr></p:bg>`;
      if (bg.image) {
        const im = await image(bg.image);
        if (im) {
          const pl = placeImage(SW, SH, im.w, im.h, bg.fit === 'contain' ? 'contain' : 'cover', 50, 50, 1);
          const rid = rel(REL + 'image', '../media/' + im.name);
          if (bg.fit === 'contain') { bgXml = bgFill(solid(bg.color || theme.bg)); under += pic(++sid, '배경 그림', rid, pl.crop, xfrm(pl.x, pl.y, pl.w, pl.h) + prst('rect')); }
          else bgXml = bgFill(`<a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${rid}"/>${srcRect(pl.crop)}<a:stretch><a:fillRect/></a:stretch></a:blipFill>`);
        } else { warn.img++; bgXml = bgFill(solid(bg.color || theme.bg)); }
        if (bg.dim) under += sp(++sid, '배경 어둡게', xfrm(0, 0, SW, SH) + prst('rect') + `<a:solidFill><a:srgbClr val="000000"><a:alpha val="${Math.round(Math.min(1, +bg.dim) * 100000)}"/></a:srgbClr></a:solidFill><a:ln><a:noFill/></a:ln>`);
      } else bgXml = bgFill(gradient(bg.gradient) || (bg.gradient ? null : bg.color ? solid(bg.color) : gradient(theme.bgGradient)) || solid(bg.color || theme.bg));
      shapes.push(under);

      /* 테마 장식 */
      const decor = bg.image ? 'none' : (s.decor || theme.decor);
      const plain = (name, x, y, w, h, fill, geom, ln) => sp(++sid, name, xfrm(x, y, w, h) + (geom || prst('rect')) + fill + (ln || '<a:ln><a:noFill/></a:ln>'));
      if (decor === 'bar-left') shapes.push(plain('장식', 0, 0, 22, SH, solid(theme.accent)));
      else if (decor === 'bar-top') shapes.push(plain('장식', 0, 0, SW, 16, solid(theme.accent)));
      else if (decor === 'band-bottom') shapes.push(plain('장식', 0, SH - 26, SW * 0.7, 26, solid(theme.accent)) + plain('장식', SW * 0.7, SH - 26, SW * 0.3, 26, solid(theme.accent2)));
      else if (decor === 'frame') shapes.push(plain('장식', 36, 36, SW - 72, SH - 72, '<a:noFill/>', roundGeom(6, SW - 72, SH - 72), lineXml(2, theme.muted, 0.45)));
      else if (decor === 'corner') { const c = rgba(theme.accent); if (c) shapes.push(plain('장식', SW + 260 - 760, -300, 760, 760, `<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0">${clr(c, 0.22)}</a:gs><a:gs pos="60000">${clr(c, 0.06)}</a:gs><a:gs pos="70000">${clr(c, 0)}</a:gs><a:gs pos="100000">${clr(c, 0)}</a:gs></a:gsLst><a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill>`, prst('ellipse'))); }
      else if (decor === 'grid') {
        const ln = lineXml(1.5, theme.accent, 0.14); let g = '';
        const cx = (x1, y1, x2, y2) => `<p:cxnSp><p:nvCxnSpPr>${nv(++sid, '격자')}<p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr>${xfrm(x1, y1, x2 - x1, y2 - y1)}${prst('line')}${ln}</p:spPr></p:cxnSp>`;
        for (let x = 0; x <= SW; x += 60) g += cx(x, 0, x, SH); for (let y = 0; y <= SH; y += 60) g += cx(0, y, SW, y);
        shapes.push(`<p:grpSp><p:nvGrpSpPr>${nv(++sid, '장식 (격자)')}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu(SW)}" cy="${emu(SH)}"/><a:chOff x="0" y="0"/><a:chExt cx="${emu(SW)}" cy="${emu(SH)}"/></a:xfrm></p:grpSpPr>${g}</p:grpSp>`);
      }

      /* 요소 */
      let n = 0;
      for (const e of s.elements || []) {
        if (e.hide) continue;
        const op = e.opacity == null ? 1 : +e.opacity, name = ((typeof TYPE_NAMES !== 'undefined' && TYPE_NAMES[e.type]) || e.type) + ' ' + (++n), hl = link(e);
        let id = 0, paraInfo = null;
        try {
          if (e.type === 'text') {
            const st = resolveTextStyle(e, theme), base = textBase(e, st, theme, op), paras = parseHtml(e.html, base);
            if (!paras.some(p => p.runs.some(r => r.t)) && !st.bg && !st.border) continue;
            const pad = +st.padding || 0, bar = st.accentBar ? 14 : 0, ins = [pad, pad, pad, pad + bar + (bar && !pad ? 28 : 0)];
            const spPr = xfrm(e.x, e.y, e.w, e.h, e.rotate) + roundGeom(st.radius || 0, e.w, e.h) + (st.bg ? solid(themeColor(st.bg, theme), op) : '<a:noFill/>')
              + (st.border ? lineXml(st.border, themeColor(st.borderColor || '$accent', theme), op) : '<a:ln><a:noFill/></a:ln>') + (st.shadow && st.bg ? SHADOW(40, 12, 0.18) : '');
            id = ++sid; shapes.push(sp(id, name, spPr, bodyPr(ins, ANCH[st.valign], st.vertical) + parasXml(paras, base, o), hl, true));
            if (bar) shapes.push(plain(name + ' 강조선', e.x, e.y, bar, e.h, solid(theme.accent, op)));
            paraInfo = paras;
          } else if (e.type === 'shape') {
            const sw = e.strokeWidth || 0, stroke = themeColor(e.stroke, theme), fillV = themeColor(e.fill || 'none', theme);
            if (e.shape === 'line' || e.shape === 'arrow' || e.shape === 'dline') {
              const t = e.shape === 'line' ? Math.max(2, sw || 6) : Math.max(4, sw || 10), c = stroke || fillV, tri = (k) => `<a:${k} type="triangle" w="med" len="med"/>`;
              const ends = e.shape === 'line' ? '' : (e.shape === 'dline' ? tri('headEnd') : '') + tri('tailEnd');
              id = ++sid; shapes.push(`<p:cxnSp><p:nvCxnSpPr>${nv(id, name, hl)}<p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr>${xfrm(e.x, e.y + e.h / 2, e.w, 0, e.rotate, e.flip, false)}${prst('line')}${lineXml(t, c, op, { cap: 'rnd', dash: e.dash, ends })}</p:spPr></p:cxnSp>`);
            } else {
              let fill = solid(fillV, op);
              if (e.fill2 && rgba(fillV)) { const a = rgba(fillV), b = rgba(themeColor(e.fill2, theme)); if (b) fill = `<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0">${clr(a, op)}</a:gs><a:gs pos="100000">${clr(b, op * (e.fill2Op == null ? 1 : +e.fill2Op))}</a:gs></a:gsLst><a:lin ang="${Math.round((((e.gAngle == null ? 90 : +e.gAngle) % 360 + 360) % 360) * 60000)}" scaled="0"/></a:gradFill>`; }
              const ln = sw > 0 && stroke ? lineXml(sw, stroke, op, { dash: e.dash, join: true }) : '<a:ln><a:noFill/></a:ln>';
              const cmds = shapeCmds(e); let geomXml, box = [e.x, e.y, e.w, e.h];
              if (cmds) geomXml = custGeom(cmds, e.w, e.h, e.flip, e.flipV);
              else { box = [e.x + sw / 2, e.y + sw / 2, e.w - sw, e.h - sw]; geomXml = e.shape === 'ellipse' ? prst('ellipse') : e.shape === 'rect' ? roundGeom(e.radius || 0, box[2], box[3]) : prst('rect'); }
              let tx = '';
              if (e.html && stripHtml(e.html)) {
                const st = resolveTextStyle(e, theme), base = textBase(e, st, theme, op);
                const pd = e.style && e.style.padding != null && e.style.padding !== '' ? [+e.style.padding, +e.style.padding, +e.style.padding, +e.style.padding] : [e.w * 0.04, e.w * 0.08, e.w * 0.04, e.w * 0.08];
                paraInfo = parseHtml(e.html, base); tx = bodyPr(pd, ANCH[st.valign] || (st.valign === 'top' ? 't' : 'ctr'), st.vertical) + parasXml(paraInfo, base, o);
              }
              id = ++sid; shapes.push(sp(id, name, xfrm(box[0], box[1], box[2], box[3], e.rotate) + geomXml + fill + ln + (e.shadow ? SHADOW(24, 12, 0.25) : ''), tx, hl));
            }
          } else if (e.type === 'image') {
            if (!e.src) continue;
            const im = await image(e.src, e.fx); if (!im) { warn.img++; continue; }
            const pl = placeImage(e.w, e.h, im.w, im.h, e.fit || 'contain', e.cropX, e.cropY, e.zoom, e.flip, e.flipV); if (!pl) continue;
            const full = pl.w > e.w - 1 && pl.h > e.h - 1;
            const MASK = { hexagon: POLY.hexagon, diamond: POLY.diamond, triangle: POLY.triangle, blob: [[.32, .03], [.7, 0], [.96, .24], [1, .62], [.8, .93], [.44, 1], [.12, .86], [0, .52], [.08, .18]] };
            const geomXml = e.mask === 'circle' ? prst('ellipse') : MASK[e.mask] ? custGeom(polyCmds(MASK[e.mask].map(([a, b]) => [a * pl.w, b * pl.h])), pl.w, pl.h, pl.flipH, pl.flipV)
              : e.mask === 'arch' ? prst('round2SameRect', '<a:gd name="adj1" fmla="val 50000"/><a:gd name="adj2" fmla="val 0"/>') : roundGeom(e.radius || 0, pl.w, pl.h);
            // 돌린 그림: 상자 가운데를 중심으로 돌므로, 잘린 그림 자리도 같은 중심 기준으로 옮김
            let px = e.x + pl.x, py = e.y + pl.y;
            if (e.rotate && !full) { const a = e.rotate * Math.PI / 180, dx = pl.x + pl.w / 2 - e.w / 2, dy = pl.y + pl.h / 2 - e.h / 2; px = e.x + e.w / 2 + dx * Math.cos(a) - dy * Math.sin(a) - pl.w / 2; py = e.y + e.h / 2 + dx * Math.sin(a) + dy * Math.cos(a) - pl.h / 2; }
            id = ++sid; shapes.push(pic(id, name, rel(REL + 'image', '../media/' + im.name), pl.crop,
              xfrm(px, py, pl.w, pl.h, e.rotate, pl.flipH, pl.flipV) + geomXml + (e.border ? lineXml(e.border, themeColor(e.borderColor || '#ffffff', theme), op) : '') + (e.shadow && !e.mask ? SHADOW(48, 16, 0.25) : ''), hl, op));
          } else if (e.type === 'table') {
            id = ++sid; shapes.push(tableXml(e, id, name, theme, o));
          } else if (e.type === 'chart') {
            const node = document.createElement('div'); renderChart(e, node, theme, 'thumb');
            const svg = node.innerHTML.replace(/ class="[^"]*"/g, '').replace(/ style="animation-delay[^"]*"/g, '');
            let data = null; try { data = await svgToPng(svg, e.w, e.h, 2); } catch (err) { data = null; }
            if (!data) { warn.chart++; continue; }
            id = ++sid; shapes.push(pic(id, name, rel(REL + 'image', '../media/' + addMedia('', data, 'png').name), null, xfrm(e.x, e.y, e.w, e.h, e.rotate) + prst('rect'), hl, op));
          } else if (e.type === 'math') {
            const st = resolveTextStyle(e, theme); let mp = null;
            try { mp = await mathToPng(e, theme, st); } catch (err) { mp = null; }
            id = ++sid;
            if (mp) shapes.push(pic(id, name, rel(REL + 'image', '../media/' + addMedia('', mp.data, 'png').name), null, xfrm(e.x - mp.padX, e.y - mp.padY, e.w + mp.padX * 2, e.h + mp.padY * 2, e.rotate) + prst('rect'), hl, op));
            else { warn.math++; const base = Object.assign(textBase(e, st, theme, op), { font: 'Cambria Math', size: st.fontSize * 0.6 }); shapes.push(sp(id, name, xfrm(e.x, e.y, e.w, e.h, e.rotate) + prst('rect') + '<a:noFill/>', bodyPr([0, 0, 0, 0], ANCH[st.valign] || 'ctr') + parasXml(parseHtml(X(e.tex || ''), base), base, o), hl, true)); }
          } else if (e.type === 'embed') {
            const p = parseEmbed(e.url); if (p.kind === 'none') continue;
            let posterData = null, posterKey = '';
            const ps = p.kind === 'video' ? embedPoster(e) : p.kind === 'youtube' ? `https://i.ytimg.com/vi/${p.id}/hqdefault.jpg` : '';
            let im = ps ? await image(ps) : null;
            if (!im) { posterKey = 'poster:' + p.kind; if (!media.has(posterKey)) posterData = await posterPng(p.kind === 'web' ? '웹 페이지' : p.kind === 'video' ? '동영상' : p.kind === 'youtube' ? 'YouTube 영상' : 'Vimeo 영상'); im = Object.assign(addMedia(posterKey, posterData, 'png'), { w: 1280, h: 720 }); }
            const pl = placeImage(e.w, e.h, im.w, im.h, 'cover', 50, 50, 1) || { x: 0, y: 0, w: e.w, h: e.h, crop: null };
            const imgRid = rel(REL + 'image', '../media/' + im.name), spPr = xfrm(e.x, e.y, e.w, e.h, e.rotate) + roundGeom(e.radius || 0, e.w, e.h) + (e.shadow ? SHADOW(48, 16, 0.25) : '');
            let done = false;
            if (p.kind === 'video') {
              const ext = (/\.(mp4|m4v|mov)(?:[?#]|$)/i.exec(p.src) || [])[1];
              if (opts.videos && ext) {
                say(`슬라이드 ${si + 1}: 영상을 담는 중…`);
                let vb = null; const big = typeof BIGV !== 'undefined' ? BIGV.parse(p.src) : null;
                try { if (big && !API.blobs[p.src]) vb = await (await fetch(await BIGV.assemble(big))).blob(); else vb = await getBlob(p.src); } catch (err) { vb = null; }
                if (vb) {
                  const key = 'video:' + p.src; let m = media.get(key);
                  if (!m) { m = addMedia(key, new Uint8Array(await vb.arrayBuffer()), ext.toLowerCase(), true); m.dur = (e.start || e.end) ? await videoMeta(vb) : 0; }
                  const trim = (e.start || (e.end && m.dur)) ? `<p14:trim${e.start ? ` st="${Math.round(e.start * 1000)}"` : ''}${e.end && m.dur > e.end ? ` end="${Math.round((m.dur - e.end) * 1000)}"` : ''}/>` : '';
                  const extra = `<a:videoFile r:link="${rel(REL + 'video', '../media/' + m.name)}"/><p:extLst><p:ext uri="{DAA4B4D4-6D71-4841-9C94-3DE7FCFB9230}"><p14:media xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" r:embed="${rel('http://schemas.microsoft.com/office/2007/relationships/media', '../media/' + m.name)}">${trim}</p14:media></p:ext></p:extLst>`;
                  id = ++sid; shapes.push(pic(id, name, imgRid, pl.crop, spPr, '<a:hlinkClick r:id="" action="ppaction://media"/>', null, extra)); vids.push(id); done = true;
                } else warn.vid++;
              }
              if (!done) warn.vidLink++;
            }
            if (!done) {
              const url = p.kind === 'youtube' ? `https://www.youtube.com/watch?v=${p.id}${p.start ? '&t=' + p.start : ''}` : p.kind === 'vimeo' ? `https://vimeo.com/${p.id}` : /^https?:/i.test(p.src) && !(typeof BIGV !== 'undefined' && BIGV.parse(p.src)) ? p.src : opts.siteUrl ? opts.siteUrl + '&start=' + si : '';
              id = ++sid; shapes.push(pic(id, name, imgRid, pl.crop, spPr, hl || (url ? `<a:hlinkClick r:id="${o.rel(url)}"/>` : '')));
            }
          }
        } catch (err) { console.warn('pptx: 요소를 옮기지 못함', e.type, err); continue; }
        /* 클릭 단계 → 나타나기 · 사라지기 */
        if (id) {
          const stp = e.step || 0, kind = e.anim === 'none' ? 'appear' : e.anim === 'wipe' ? 'wipe' : 'fade';
          if (e.type === 'text' && e.listSteps && paraInfo && paraInfo.some(p => p.item >= 0)) {
            const b = stp > 0 ? stp : 1, ranges = new Map();
            paraInfo.forEach((p, i) => { const k = p.item >= 0 ? b + p.item : stp; if (k <= 0) return; const key = (p.item >= 0 ? 'i' + p.item : 'x' + i); const r = ranges.get(key); if (r) r.end = i; else ranges.set(key, { step: k, st: i, end: i }); });
            for (const r of ranges.values()) anim.push({ step: r.step, id, kind, p: [r.st, r.end] });
          } else if (stp > 0) anim.push({ step: stp, id, kind });
          if (e.outStep > 0) anim.push({ step: e.outStep, id, kind: 'out' });
        }
      }

      /* 꼬리말 */
      const ft = deck.footer;
      if (ft && (ft.num || ft.text) && !s.noFooter && !(ft.skipFirst && si === 0)) {
        const base = { size: 22, color: theme.muted, font: face(theme.bodyFont), lineHeight: 1.3, align: 'left', spc: 0.44, op: 1, accent: theme.accent, bgc: theme.bg };
        const box = (x, w, txt, al, bold) => sp(++sid, '꼬리말', xfrm(x, SH - 30 - 40, w, 40) + prst('rect') + '<a:noFill/>', bodyPr([0, 0, 0, 0], 'b') + parasXml([{ runs: [{ t: txt, st: { size: 22, color: theme.muted, bold, font: base.font, spc: 0.44, web: typeof fontCss === 'function' ? fontCss(theme.bodyFont) : '' } }], li: null, align: al }], base, o), '', true);
        if (ft.text) shapes.push(box(70, 1300, ft.text, 'left', false));
        if (ft.num) shapes.push(box(SW - 70 - 400, 400, (si + 1) + (ft.total ? ' / ' + deck.slides.length : ''), 'right', true));
      }

      /* 전환 */
      const tr = s.transition || deck.transition || 'fade';
      const trXml = { fade: '<p:fade/>', blur: '<p:fade/>', morph: '<p:fade/>', slide: '<p:push dir="l"/>', up: '<p:push dir="u"/>', cover: '<p:cover dir="l"/>', wipe: '<p:wipe dir="l"/>', zoom: '<p:zoom dir="in"/>' }[tr];

      /* 노트 */
      const notes = String(s.notes || '').trim();
      if (notes) rel(REL + 'notesSlide', `../notesSlides/notesSlide${si + 1}.xml`);

      slides.push({
        xml: HEAD + `<p:sld ${NS}${s.hidden ? ' show="0"' : ''}><p:cSld>${bgXml}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes.join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${trXml ? `<p:transition spd="med">${trXml}</p:transition>` : ''}${timing(anim, vids)}</p:sld>`,
        rels: HEAD + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}slideLayout" Target="../slideLayouts/slideLayout1.xml"/>${rels.join('')}</Relationships>`,
        notes,
      });
    }

    /* 묶음에 담을 파일들 */
    say('PPT 파일로 묶는 중…');
    const out = []; const N = slides.length, hasNotes = slides.some(s => s.notes);
    const tf = face(theme.titleFont), bf = face(theme.bodyFont);
    const hex = (v, d) => (rgba(v) || { hex: d }).hex;
    const themeXml = (name) => HEAD + `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${X(name)}"><a:themeElements><a:clrScheme name="${X(name)}"><a:dk1><a:srgbClr val="${hex(theme.fg, '1F2937')}"/></a:dk1><a:lt1><a:srgbClr val="${hex(theme.bg, 'FFFFFF')}"/></a:lt1><a:dk2><a:srgbClr val="${hex(theme.title, '111827')}"/></a:dk2><a:lt2><a:srgbClr val="${hex(theme.surface, 'F3F4F6')}"/></a:lt2><a:accent1><a:srgbClr val="${hex(theme.accent, '2563EB')}"/></a:accent1><a:accent2><a:srgbClr val="${hex(theme.accent2, 'F59E0B')}"/></a:accent2><a:accent3><a:srgbClr val="10B981"/></a:accent3><a:accent4><a:srgbClr val="8B5CF6"/></a:accent4><a:accent5><a:srgbClr val="EF4444"/></a:accent5><a:accent6><a:srgbClr val="06B6D4"/></a:accent6><a:hlink><a:srgbClr val="${hex(theme.accent, '2563EB')}"/></a:hlink><a:folHlink><a:srgbClr val="${hex(theme.muted, '6B7280')}"/></a:folHlink></a:clrScheme>`
      + `<a:fontScheme name="${X(name)}"><a:majorFont><a:latin typeface="${X(tf)}"/><a:ea typeface="${X(tf)}"/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="${X(bf)}"/><a:ea typeface="${X(bf)}"/><a:cs typeface=""/></a:minorFont></a:fontScheme>`
      + `<a:fmtScheme name="${X(name)}"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;
    const EMPTY_TREE = '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree>';
    const CLRMAP = 'bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"';
    const lvl = (sz) => [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<a:lvl${i}pPr marL="${(i - 1) * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="1" hangingPunct="1"><a:defRPr sz="${sz}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${i}pPr>`).join('');
    let ct = HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>';
    const MIME = { png: 'image/png', jpeg: 'image/jpeg', gif: 'image/gif', mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime' };
    for (const x of exts) ct += `<Default Extension="${x}" ContentType="${MIME[x] || 'application/octet-stream'}"/>`;
    ct += `<Override PartName="/ppt/presentation.xml" ContentType="${CT}presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="${CT}slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="${CT}slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/presProps.xml" ContentType="${CT}presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="${CT}viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="${CT}tableStyles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>`;
    slides.forEach((s, i) => { ct += `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="${CT}slide+xml"/>`; if (s.notes) ct += `<Override PartName="/ppt/notesSlides/notesSlide${i + 1}.xml" ContentType="${CT}notesSlide+xml"/>`; });
    if (hasNotes) ct += `<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="${CT}notesMaster+xml"/><Override PartName="/ppt/theme/theme2.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>`;
    ct += '</Types>';
    const RELS = (inner) => HEAD + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${inner}</Relationships>`;
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    out.push({ name: '[Content_Types].xml', data: ct });
    out.push({ name: '_rels/.rels', data: RELS(`<Relationship Id="rId1" Type="${REL}officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${REL}extended-properties" Target="docProps/app.xml"/>`) });
    out.push({ name: 'docProps/core.xml', data: HEAD + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${X(deck.title || '')}</dc:title><dc:creator>발표</dc:creator><cp:lastModifiedBy>발표</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>` });
    out.push({ name: 'docProps/app.xml', data: HEAD + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><TotalTime>0</TotalTime><Words>0</Words><Application>Microsoft Office PowerPoint</Application><PresentationFormat>와이드스크린</PresentationFormat><Slides>${N}</Slides><Notes>${slides.filter(s => s.notes).length}</Notes><HiddenSlides>0</HiddenSlides><AppVersion>16.0000</AppVersion></Properties>` });
    // 프레젠테이션: rId1 마스터 · rId2 노트 마스터(있을 때) · 그 뒤 슬라이드 · 끝에 속성 파일들
    const r0 = hasNotes ? 3 : 2;
    out.push({ name: 'ppt/presentation.xml', data: HEAD + `<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>${hasNotes ? '<p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst>' : ''}<p:sldIdLst>${slides.map((s, i) => `<p:sldId id="${256 + i}" r:id="rId${r0 + i}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${emu(SW)}" cy="${emu(SH)}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:defPPr><a:defRPr lang="ko-KR"/></a:defPPr>${lvl(1800)}</p:defaultTextStyle></p:presentation>` });
    out.push({ name: 'ppt/_rels/presentation.xml.rels', data: RELS(`<Relationship Id="rId1" Type="${REL}slideMaster" Target="slideMasters/slideMaster1.xml"/>${hasNotes ? `<Relationship Id="rId2" Type="${REL}notesMaster" Target="notesMasters/notesMaster1.xml"/>` : ''}${slides.map((s, i) => `<Relationship Id="rId${r0 + i}" Type="${REL}slide" Target="slides/slide${i + 1}.xml"/>`).join('')}<Relationship Id="rId${r0 + N}" Type="${REL}presProps" Target="presProps.xml"/><Relationship Id="rId${r0 + N + 1}" Type="${REL}viewProps" Target="viewProps.xml"/><Relationship Id="rId${r0 + N + 2}" Type="${REL}theme" Target="theme/theme1.xml"/><Relationship Id="rId${r0 + N + 3}" Type="${REL}tableStyles" Target="tableStyles.xml"/>`) });
    out.push({ name: 'ppt/presProps.xml', data: HEAD + `<p:presentationPr ${NS}/>` });
    out.push({ name: 'ppt/viewProps.xml', data: HEAD + `<p:viewPr ${NS}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:slideViewPr><p:cSldViewPr snapToGrid="0"><p:cViewPr varScale="1"><p:scale><a:sx n="70" d="100"/><a:sy n="70" d="100"/></p:scale><p:origin x="0" y="0"/></p:cViewPr><p:guideLst/></p:cSldViewPr></p:slideViewPr><p:notesTextViewPr><p:cViewPr><p:scale><a:sx n="1" d="1"/><a:sy n="1" d="1"/></p:scale><p:origin x="0" y="0"/></p:cViewPr></p:notesTextViewPr><p:gridSpacing cx="72008" cy="72008"/></p:viewPr>` });
    out.push({ name: 'ppt/tableStyles.xml', data: HEAD + '<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>' });
    out.push({ name: 'ppt/theme/theme1.xml', data: themeXml('발표') });
    out.push({ name: 'ppt/slideMasters/slideMaster1.xml', data: HEAD + `<p:sldMaster ${NS}><p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>${EMPTY_TREE}</p:cSld><p:clrMap ${CLRMAP}/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle>${lvl(4400)}</p:titleStyle><p:bodyStyle>${lvl(2800)}</p:bodyStyle><p:otherStyle>${lvl(1800)}</p:otherStyle></p:txStyles></p:sldMaster>` });
    out.push({ name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data: RELS(`<Relationship Id="rId1" Type="${REL}slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${REL}theme" Target="../theme/theme1.xml"/>`) });
    out.push({ name: 'ppt/slideLayouts/slideLayout1.xml', data: HEAD + `<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="빈 화면">${EMPTY_TREE}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>` });
    out.push({ name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: RELS(`<Relationship Id="rId1" Type="${REL}slideMaster" Target="../slideMasters/slideMaster1.xml"/>`) });
    if (hasNotes) {
      const ph = (id, nm, type, idx, x, y, w, h, tx) => `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${nm}"/><p:cNvSpPr><a:spLocks noGrp="1"${type === 'sldImg' ? ' noRot="1" noChangeAspect="1"' : ''}/></p:cNvSpPr><p:nvPr><p:ph type="${type}"${idx ? ` idx="${idx}"` : ''}/></p:nvPr></p:nvSpPr><p:spPr>${x == null ? '' : `<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${type === 'sldImg' ? '<a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln>' : ''}`}</p:spPr>${tx || ''}</p:sp>`;
      const tree = (inner) => EMPTY_TREE.replace('</p:spTree>', inner + '</p:spTree>');
      out.push({ name: 'ppt/theme/theme2.xml', data: themeXml('노트') });
      out.push({ name: 'ppt/notesMasters/notesMaster1.xml', data: HEAD + `<p:notesMaster ${NS}><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>${tree(ph(2, '슬라이드 이미지', 'sldImg', 2, 685800, 1143000, 5486400, 3086100) + ph(3, '노트', 'body', 3, 685800, 4400550, 5486400, 3600450, '<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/><a:p><a:pPr lvl="0"/><a:r><a:rPr lang="ko-KR"/><a:t>노트</a:t></a:r></a:p></p:txBody>'))}</p:cSld><p:clrMap ${CLRMAP}/><p:notesStyle>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<a:lvl${i}pPr marL="${(i - 1) * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="1" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:latin typeface="맑은 고딕"/><a:ea typeface="맑은 고딕"/></a:defRPr></a:lvl${i}pPr>`).join('')}</p:notesStyle></p:notesMaster>` });
      out.push({ name: 'ppt/notesMasters/_rels/notesMaster1.xml.rels', data: RELS(`<Relationship Id="rId1" Type="${REL}theme" Target="../theme/theme2.xml"/>`) });
      slides.forEach((s, i) => {
        if (!s.notes) return;
        const ps = s.notes.split(/\r?\n/).map(l => `<a:p>${l ? `<a:r><a:rPr lang="ko-KR" altLang="en-US" dirty="0"/><a:t>${X(l)}</a:t></a:r>` : '<a:endParaRPr lang="ko-KR" altLang="en-US" dirty="0"/>'}</a:p>`).join('');
        out.push({ name: `ppt/notesSlides/notesSlide${i + 1}.xml`, data: HEAD + `<p:notes ${NS}><p:cSld>${tree(ph(2, '슬라이드 이미지', 'sldImg') + ph(3, '노트', 'body', 1, null, 0, 0, 0, `<p:txBody><a:bodyPr/><a:lstStyle/>${ps}</p:txBody>`))}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>` });
        out.push({ name: `ppt/notesSlides/_rels/notesSlide${i + 1}.xml.rels`, data: RELS(`<Relationship Id="rId1" Type="${REL}notesMaster" Target="../notesMasters/notesMaster1.xml"/><Relationship Id="rId2" Type="${REL}slide" Target="../slides/slide${i + 1}.xml"/>`) });
      });
    }
    slides.forEach((s, i) => { out.push({ name: `ppt/slides/slide${i + 1}.xml`, data: s.xml }); out.push({ name: `ppt/slides/_rels/slide${i + 1}.xml.rels`, data: s.rels }); });
    for (const f of files) out.push(f);
    const z = await Zip.write(out);
    const notes = [];
    if (warn.img) notes.push(`그림 ${warn.img}개는 받지 못해 빠졌습니다`);
    if (warn.vid) notes.push(`동영상 ${warn.vid}개는 받지 못해 표지 그림만 넣었습니다`);
    if (warn.vidLink) notes.push(`동영상 ${warn.vidLink}개는 표지 그림으로 들어갔습니다 (누르면 인터넷에서 열림)`);
    if (warn.math) notes.push(`수식 ${warn.math}개는 그림으로 만들지 못해 글자로 넣었습니다`);
    if (warn.chart) notes.push(`차트 ${warn.chart}개는 옮기지 못했습니다`);
    return { blob: new Blob([z], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), warn: notes };
  }

  /* ---------- 표 ---------- */
  function tableXml(e, id, name, theme, o) {
    const rows = e.rows && e.rows.length ? e.rows : [['']], nr = rows.length, nc = Math.max(1, ...rows.map(r => r.length));
    const cells = e.cells || {}, covered = tableCovered(cells, nr, nc), st = resolveTextStyle(e, theme);
    const cw = tableWeights(e.cols, nc).map(w => emu(w * e.w)), rh = tableWeights(e.rh, nr).map(w => emu(w * e.h));
    cw[nc - 1] += emu(e.w) - cw.reduce((a, b) => a + b, 0);
    const head = themeColor(e.headFill || '$accent', theme), headfg = themeColor(e.headColor || '#ffffff', theme), line = themeColor(e.lineColor || '$muted', theme);
    const lines = e.lines || 'grid', fs = st.fontSize, mX = emu(fs * 0.55), mY = emu(fs * 0.3);
    const origin = new Map(); // 가려진 칸 → 합친 칸의 시작 자리
    for (const k in cells) { const [r, c] = k.split(',').map(Number), s = cells[k], rs = Math.min(s.rs || 1, nr - r), cs = Math.min(s.cs || 1, nc - c); for (let i = 0; i < rs; i++) for (let j = 0; j < cs; j++) if (i || j) origin.set((r + i) + ',' + (c + j), [r, c]); }
    const border = (tag, on, color, mul) => on ? `<a:${tag} w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill>${clr(rgba(color) || { hex: '888888', a: 1 }, mul)}</a:solidFill><a:prstDash val="solid"/></a:${tag}>` : `<a:${tag} w="0"><a:noFill/></a:${tag}>`;
    let body = '';
    for (let r = 0; r < nr; r++) {
      body += `<a:tr h="${rh[r]}">`;
      for (let c = 0; c < nc; c++) {
        const key = r + ',' + c, th = r === 0 && e.header, s = cells[key] || {};
        const base = Object.assign(textBase(e, st, theme, 1), { align: s.align || st.align || 'center', color: s.color ? themeColor(s.color, theme) : th ? headfg : themeColor(st.color, theme), bold: th || (e.firstCol && c === 0) || st.bold });
        let attr = '', tx = `<a:p><a:endParaRPr lang="ko-KR" sz="${Math.round(fs * 50)}"/></a:p>`;
        if (covered.has(key)) { const og = origin.get(key) || [r, c]; attr = (og[1] !== c ? ' hMerge="1"' : '') + (og[0] !== r ? ' vMerge="1"' : ''); const so = cells[og[0] + ',' + og[1]] || {}; if (og[0] !== r && og[1] === c && (so.cs || 1) > 1) attr += ` gridSpan="${Math.min(so.cs, nc - c)}"`; }
        else {
          if (s.cs > 1) attr += ` gridSpan="${Math.min(s.cs, nc - c)}"`; if (s.rs > 1) attr += ` rowSpan="${Math.min(s.rs, nr - r)}"`;
          tx = parasXml(parseHtml(rows[r][c] || '', base), base, o);
        }
        const bc = th ? mix(head, '#000000', 0.7) : line, bm = th ? 1 : 0.55, v = lines === 'grid', h = lines !== 'none';
        const fill = s.fill ? solid(themeColor(s.fill, theme)) : th ? solid(head) : (e.band && r % 2 === 1) ? solid(theme.surface, 0.85) : lines === 'none' ? '<a:noFill/>' : solid(theme.bg);
        body += `<a:tc${attr}><a:txBody><a:bodyPr/><a:lstStyle/>${tx}</a:txBody><a:tcPr marL="${mX}" marR="${mX}" marT="${mY}" marB="${mY}" anchor="ctr">${border('lnL', v, bc, bm)}${border('lnR', v, bc, bm)}${border('lnT', h, bc, bm)}${border('lnB', h, bc, bm)}${fill}</a:tcPr></a:tc>`;
      }
      body += '</a:tr>';
    }
    return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="${X(name)}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>${xfrm(e.x, e.y, e.w, e.h, 0, false, false, 'p:xfrm')}<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr/><a:tblGrid>${cw.map(w => `<a:gridCol w="${w}"/>`).join('')}</a:tblGrid>${body}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
  }

  /* ---------- 클릭 단계(나타나기·사라지기) + 영상 재생 ---------- */
  function timing(anim, vids) {
    if (!anim.length && !vids.length) return '';
    let nid = 2; const next = () => ++nid;
    const tgt = (a) => `<p:tgtEl><p:spTgt spid="${a.id}"${a.p ? `><p:txEl><p:pRg st="${a.p[0]}" end="${a.p[1]}"/></p:txEl></p:spTgt>` : '/>'}</p:tgtEl>`;
    const setVis = (a, val, delay) => `<p:set><p:cBhvr><p:cTn id="${next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="${delay || 0}"/></p:stCondLst></p:cTn>${tgt(a)}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="${val}"/></p:to></p:set>`;
    const effect = (a, first) => {
      const id = next(), node = first ? 'clickEffect' : 'withEffect', grp = a.p ? ' grpId="0"' : '';
      let inner, preset;
      if (a.kind === 'out') { preset = 'presetID="10" presetClass="exit"'; inner = `<p:animEffect transition="out" filter="fade"><p:cBhvr><p:cTn id="${next()}" dur="500"/>${tgt(a)}</p:cBhvr></p:animEffect>` + setVis(a, 'hidden', 499); }
      else if (a.kind === 'appear') { preset = 'presetID="1" presetClass="entr"'; inner = setVis(a, 'visible'); }
      else if (a.kind === 'wipe') { preset = 'presetID="22" presetClass="entr" presetSubtype="8"'; inner = setVis(a, 'visible') + `<p:animEffect transition="in" filter="wipe(left)"><p:cBhvr><p:cTn id="${next()}" dur="500"/>${tgt(a)}</p:cBhvr></p:animEffect>`; }
      else { preset = 'presetID="10" presetClass="entr"'; inner = setVis(a, 'visible') + `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${next()}" dur="500"/>${tgt(a)}</p:cBhvr></p:animEffect>`; }
      return `<p:par><p:cTn id="${id}" ${preset}${/presetSubtype/.test(preset) ? '' : ' presetSubtype="0"'} fill="hold"${grp} nodeType="${node}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${inner}</p:childTnLst></p:cTn></p:par>`;
    };
    let main = '';
    if (anim.length) {
      const steps = Array.from(new Set(anim.map(a => a.step))).sort((a, b) => a - b);
      const clicks = steps.map(stp => { const list = anim.filter(a => a.step === stp); const o = next(), i = next(); return `<p:par><p:cTn id="${o}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${i}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${list.map((a, k) => effect(a, k === 0)).join('')}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>`; }).join('');
      main = `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${clicks}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>`;
    }
    const vseq = vids.map(v => { const a = next(), b = next(), c = next(), d = next(), f = next(); return `<p:seq concurrent="1" nextAc="seek"><p:cTn id="${a}" restart="whenNotActive" fill="hold" evtFilter="cancelBubble" nodeType="interactiveSeq"><p:stCondLst><p:cond evt="onClick" delay="0"><p:tgtEl><p:spTgt spid="${v}"/></p:tgtEl></p:cond></p:stCondLst><p:endSync evt="end" delay="0"><p:rtn val="all"/></p:endSync><p:childTnLst><p:par><p:cTn id="${b}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${c}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${d}" presetID="2" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="clickEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="togglePause"><p:cBhvr><p:cTn id="${f}" dur="1" fill="hold"/><p:tgtEl><p:spTgt spid="${v}"/></p:tgtEl></p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:nextCondLst><p:cond evt="onClick" delay="0"><p:tgtEl><p:spTgt spid="${v}"/></p:tgtEl></p:cond></p:nextCondLst></p:seq>`; }).join('');
    const vnodes = vids.map(v => `<p:video><p:cMediaNode vol="80000"><p:cTn id="${next()}" fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${v}"/></p:tgtEl></p:cMediaNode></p:video>`).join('');
    const bld = Array.from(new Set(anim.filter(a => a.p).map(a => a.id))).map(id => `<p:bldP spid="${id}" grpId="0" build="p"/>`).join('');
    return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>${main}${vseq}${vnodes}</p:childTnLst></p:cTn></p:par></p:tnLst>${bld ? `<p:bldLst>${bld}</p:bldLst>` : ''}</p:timing>`;
  }

  return { build };
})();
