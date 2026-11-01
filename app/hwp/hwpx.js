/* hwpx 문서 모델 — 원본 XML 을 그대로 품고, 편집한 문단만 다시 만들어 저장합니다.
   (손대지 않은 문단·표·그림·필드·머리말 등은 원본 XML 을 그대로 돌려 써서 한글에서 열었을 때 모양이 유지됩니다) */
const HNS = {
  hp: 'http://www.hancom.co.kr/hwpml/2011/paragraph',
  hh: 'http://www.hancom.co.kr/hwpml/2011/head',
  hc: 'http://www.hancom.co.kr/hwpml/2011/core',
  hs: 'http://www.hancom.co.kr/hwpml/2011/section',
  opf: 'http://www.idpf.org/2007/opf/',
  unit: 'http://www.hancom.co.kr/hwpml/2016/HwpUnitChar',
};
const H_LANGS = ['hangul', 'latin', 'hanja', 'japanese', 'other', 'symbol', 'user'];
const H_LANGS_UP = H_LANGS.map(s => s.toUpperCase());
const HU = 75; // HWPUNIT ÷ 75 = CSS px  (7200 HWPUNIT = 1 inch = 96 px)
const MM = 7200 / 25.4; // 1mm 의 HWPUNIT

/* ---------- XML 도우미 ---------- */
function xkids(el, name) { const out = []; if (!el) return out; for (let c = el.firstElementChild; c; c = c.nextElementSibling) if (!name || c.localName === name) out.push(c); return out; }
function xkid(el, name) { if (!el) return null; for (let c = el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === name) return c; return null; }
function xdesc(el, name) { return el ? Array.from(el.getElementsByTagNameNS('*', name)) : []; }
function xint(el, a, d) { if (!el) return d; const v = el.getAttribute(a); if (v == null || v === '') return d; const n = parseInt(v, 10); return isNaN(n) ? d : n; }
function xparse(text, what) {
  const doc = new DOMParser().parseFromString(text.replace(/^﻿/, ''), 'application/xml');
  const err = doc.getElementsByTagName('parsererror')[0];
  if (err) throw new Error((what || 'XML') + ' 을(를) 읽을 수 없습니다: ' + err.textContent.slice(0, 160));
  return doc;
}
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>';
function xfrag(x, what, owner) { // 조각 XML → owner 문서의 요소 (중복 xmlns 선언 없이)
  const el = owner.importNode(xparse(x, what).documentElement, true);
  for (const e of [el, ...el.getElementsByTagName('*')]) for (const a of Array.from(e.attributes)) if (a.name.startsWith('xmlns')) e.removeAttributeNode(a);
  return el;
}
function xstring(doc) { return XML_HEAD + new XMLSerializer().serializeToString(doc.documentElement); }
function cssStr(s) { return '"' + String(s).replace(/["\\\n\r\f<>{};]/g, '') + '"'; }
function hexColor(c) { return c && /^#[0-9a-f]{6}$/i.test(c) ? c : null; }
function mmW(s) { const m = /([\d.]+)\s*mm/.exec(s || ''); return m ? parseFloat(m[1]) : 0.12; }

function fontStack(faces) {
  faces = faces.filter(Boolean);
  const serif = faces.some(f => /바탕|명조|궁서|batang|myeong|serif|times|신명|그래픽/i.test(f));
  const base = serif ? ['Batang', "'바탕'", "'Noto Serif KR'", "'Nanum Myeongjo'", 'serif'] : ["'Malgun Gothic'", "'Noto Sans KR'", "'Pretendard Variable'", 'sans-serif'];
  return Array.from(new Set(faces.map(cssStr))).concat(base).join(',');
}

const NUM_FMT = {
  DIGIT: n => String(n),
  CIRCLED_DIGIT: n => n >= 1 && n <= 20 ? String.fromCharCode(0x2460 + n - 1) : `(${n})`,
  ROMAN_CAPITAL: n => roman(n), ROMAN_SMALL: n => roman(n).toLowerCase(),
  LATIN_CAPITAL: n => String.fromCharCode(65 + (n - 1) % 26), LATIN_SMALL: n => String.fromCharCode(97 + (n - 1) % 26),
  CIRCLED_LATIN_CAPITAL: n => String.fromCharCode(0x24B6 + (n - 1) % 26), CIRCLED_LATIN_SMALL: n => String.fromCharCode(0x24D0 + (n - 1) % 26),
  HANGUL_SYLLABLE: n => '가나다라마바사아자차카타파하'[(n - 1) % 14], CIRCLED_HANGUL_SYLLABLE: n => String.fromCharCode(0x326E + (n - 1) % 14),
  HANGUL_JAMO: n => 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ'[(n - 1) % 14], CIRCLED_HANGUL_JAMO: n => String.fromCharCode(0x3260 + (n - 1) % 14),
  HANGUL_PHONETIC: n => '일이삼사오육칠팔구십'[(n - 1) % 10], IDEOGRAPH: n => '一二三四五六七八九十'[(n - 1) % 10], CIRCLED_IDEOGRAPH: n => String.fromCharCode(0x3280 + (n - 1) % 10),
};
function roman(n) { const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of t) while (n >= v) { s += r; n -= v; } return s || '0'; }

/* ---------- 머리 정보 (글꼴·글자 모양·문단 모양·테두리·스타일) ---------- */
const CP_ORDER = ['fontRef', 'ratio', 'spacing', 'relSz', 'offset', 'italic', 'bold', 'underline', 'strikeout', 'outline', 'shadow', 'emboss', 'engrave', 'supscript', 'subscript'];
class HwpHeader {
  constructor(doc) { this.doc = doc; this.root = doc.documentElement; this.onAdd = null; this.index(); }
  index() {
    const rl = this.refList = xkid(this.root, 'refList');
    const box = n => { let b = xkid(rl, n); if (!b) { b = this.doc.createElementNS(HNS.hh, 'hh:' + n); b.setAttribute('itemCnt', '0'); rl.appendChild(b); } return b; };
    this.fontBox = box('fontfaces'); this.bfBox = box('borderFills'); this.cpBox = box('charProperties'); this.ppBox = box('paraProperties'); this.stBox = xkid(rl, 'styles');
    this.fonts = {};
    for (const ff of xkids(this.fontBox, 'fontface')) this.fonts[(ff.getAttribute('lang') || '').toLowerCase()] = { el: ff, list: xkids(ff, 'font').map(f => ({ id: f.getAttribute('id'), face: f.getAttribute('face') || '' })) };
    const okId = id => /^\d{1,9}$/.test(id || ''); // 번호가 아닌 id 는 무시 (CSS·HTML 주입 방지)
    const map = (b, n) => { const m = new Map(); for (const e of xkids(b, n)) if (okId(e.getAttribute('id'))) m.set(e.getAttribute('id'), e); return m; };
    this.charPr = map(this.cpBox, 'charPr'); this.paraPr = map(this.ppBox, 'paraPr'); this.borderFill = map(this.bfBox, 'borderFill');
    this.numbering = map(xkid(rl, 'numberings'), 'numbering'); this.bullet = map(xkid(rl, 'bullets'), 'bullet');
    this.styles = xkids(this.stBox, 'style').filter(s => okId(s.getAttribute('id'))).map(s => ({ id: s.getAttribute('id'), type: s.getAttribute('type'), name: s.getAttribute('name') || '', eng: s.getAttribute('engName') || '', pp: s.getAttribute('paraPrIDRef') || '0', cp: s.getAttribute('charPrIDRef') || '0', next: s.getAttribute('nextStyleIDRef'), el: s }));
    this._keys = {};
  }
  face(lang, id) { const f = this.fonts[lang]; if (!f) return ''; const x = f.list.find(z => z.id === String(id)); return x ? x.face : ''; }
  fontId(lang, face) {
    const f = this.fonts[lang]; if (!f) return null;
    let x = f.list.find(z => z.face === face);
    if (x) return x.id;
    const id = String(f.list.reduce((m, z) => Math.max(m, +z.id), -1) + 1);
    const el = this.doc.createElementNS(HNS.hh, 'hh:font');
    el.setAttribute('id', id); el.setAttribute('face', face); el.setAttribute('type', 'TTF'); el.setAttribute('isEmbedded', '0');
    const ti = this.doc.createElementNS(HNS.hh, 'hh:typeInfo');
    const serif = /바탕|명조|궁서|batang|myeong/i.test(face);
    Object.entries({ familyType: serif ? 'FCAT_OLDSTYLE' : 'FCAT_GOTHIC', weight: '6', proportion: '0', contrast: '0', strokeVariation: '1', armStyle: '1', letterform: '1', midline: '1', xHeight: '1' }).forEach(([k, v]) => ti.setAttribute(k, v));
    el.appendChild(ti); f.el.appendChild(el); f.el.setAttribute('fontCnt', String(f.list.length + 1));
    f.list.push({ id, face });
    return id;
  }
  allFaces() { const s = new Set(); for (const l of ['hangul', 'latin']) (this.fonts[l] ? this.fonts[l].list : []).forEach(f => f.face && s.add(f.face)); return Array.from(s); }

  /* 글자 모양 읽기 */
  cp(id) {
    const e = this.charPr.get(String(id)) || this.charPr.get('0');
    const r = { id: String(id), height: xint(e, 'height', 1000), color: e && e.getAttribute('textColor') || '#000000', shade: e && e.getAttribute('shadeColor') || 'none' };
    const fr = xkid(e, 'fontRef');
    r.faceH = this.face('hangul', fr ? fr.getAttribute('hangul') : 0); r.faceL = this.face('latin', fr ? fr.getAttribute('latin') : 0);
    r.ratio = xint(xkid(e, 'ratio'), 'hangul', 100); r.spacing = xint(xkid(e, 'spacing'), 'hangul', 0); r.relSz = xint(xkid(e, 'relSz'), 'hangul', 100);
    r.offset = xint(xkid(e, 'offset'), 'hangul', 0);
    r.bold = !!xkid(e, 'bold'); r.italic = !!xkid(e, 'italic');
    const u = xkid(e, 'underline'); r.underline = u && u.getAttribute('type') !== 'NONE' ? u.getAttribute('type') : ''; r.ulColor = u && u.getAttribute('color');
    const s = xkid(e, 'strikeout'); r.strike = !!(s && s.getAttribute('shape') && s.getAttribute('shape') !== 'NONE');
    r.sup = !!xkid(e, 'supscript'); r.sub = !!xkid(e, 'subscript');
    const sh = xkid(e, 'shadow'); r.shadow = !!(sh && sh.getAttribute('type') && sh.getAttribute('type') !== 'NONE');
    const ol = xkid(e, 'outline'); r.outline = !!(ol && ol.getAttribute('type') && ol.getAttribute('type') !== 'NONE');
    return r;
  }
  cpCss(id) {
    const c = this.cp(id), sz = c.height / 100 * c.relSz / 100 * (c.sup || c.sub ? 0.68 : 1);
    let s = `font-size:${+sz.toFixed(2)}pt;font-family:${fontStack([c.faceL, c.faceH])};color:${hexColor(c.color) || '#000'};`;
    s += `font-weight:${c.bold ? 700 : 400};font-style:${c.italic ? 'italic' : 'normal'};`;
    const dec = []; if (c.underline === 'BOTTOM') dec.push('underline'); if (c.underline === 'TOP') dec.push('overline'); if (c.strike || c.underline === 'CENTER') dec.push('line-through');
    s += `text-decoration:${dec.length ? dec.join(' ') : 'none'};`;
    if (c.underline && hexColor(c.ulColor) && c.ulColor !== '#000000') s += `text-decoration-color:${c.ulColor};`;
    s += `background-color:${hexColor(c.shade) && c.shade.toUpperCase() !== '#FFFFFF' ? c.shade : 'transparent'};`;
    s += `letter-spacing:${c.spacing ? (c.spacing / 100).toFixed(3) + 'em' : 'normal'};`;
    s += `vertical-align:${c.sup ? 'super' : c.sub ? 'sub' : c.offset ? (-c.offset / 100).toFixed(2) + 'em' : 'baseline'};`;
    if (c.ratio !== 100) s += `font-stretch:${c.ratio}%;`;
    s += c.shadow ? 'text-shadow:1px 1px 0 #b2b2b2;' : 'text-shadow:none;';
    if (c.outline) s += '-webkit-text-stroke:.6px currentColor;color:transparent;';
    return s;
  }
  /* 문단 모양 읽기 */
  pp(id) {
    const e = this.paraPr.get(String(id)) || this.paraPr.get('0');
    const al = xkid(e, 'align'), hd = xkid(e, 'heading'), br = xkid(e, 'breakSetting');
    const sw = xkid(e, 'switch'), cs = sw ? xkid(sw, 'case') : null;
    const holder = cs || e;
    const mg = xkid(holder, 'margin'), ls = xkid(holder, 'lineSpacing');
    const mv = n => xint(xkid(mg, n), 'value', 0);
    const bd = xkid(e, 'border');
    return {
      id: String(id), align: al ? al.getAttribute('horizontal') || 'JUSTIFY' : 'JUSTIFY',
      intent: mv('intent'), left: mv('left'), right: mv('right'), prev: mv('prev'), next: mv('next'),
      lsType: ls ? ls.getAttribute('type') || 'PERCENT' : 'PERCENT', ls: ls ? xint(ls, 'value', 160) : 160,
      heading: hd ? hd.getAttribute('type') || 'NONE' : 'NONE', headId: xint(hd, 'idRef', 0), level: xint(hd, 'level', 0),
      pageBreakBefore: br && br.getAttribute('pageBreakBefore') === '1', keepWithNext: br && br.getAttribute('keepWithNext') === '1',
      bf: bd ? bd.getAttribute('borderFillIDRef') : null,
    };
  }
  ppCss(id) {
    const p = this.pp(id);
    const ta = { LEFT: 'left', RIGHT: 'right', CENTER: 'center', JUSTIFY: 'justify', DISTRIBUTE: 'justify', DISTRIBUTE_SPACE: 'justify' }[p.align] || 'justify';
    let s = `text-align:${ta};text-align-last:${/DISTRIBUTE/.test(p.align) ? 'justify' : 'auto'};`;
    const hang = p.intent < 0 ? -p.intent : 0;
    s += `padding-left:${((p.left + hang) / HU).toFixed(2)}px;padding-right:${(p.right / HU).toFixed(2)}px;text-indent:${(p.intent / HU).toFixed(2)}px;`;
    s += `padding-top:${(p.prev / HU).toFixed(2)}px;padding-bottom:${(p.next / HU).toFixed(2)}px;`;
    if (p.lsType === 'FIXED') s += `line-height:${(p.ls / HU).toFixed(2)}px;`;
    else if (p.lsType === 'BETWEEN_LINES') s += `line-height:calc(1.2em + ${(p.ls / HU).toFixed(2)}px);`;
    else if (p.lsType === 'AT_LEAST') s += `line-height:max(1.2em, ${(p.ls / HU).toFixed(2)}px);`;
    else s += `line-height:${Math.max(0.5, p.ls / 100).toFixed(3)};`;
    if (p.bf && p.bf !== '0') { const b = this.bfCss(p.bf, false); if (b) s += b; }
    return s;
  }
  bf(id) {
    const e = this.borderFill.get(String(id)); if (!e) return null;
    const side = n => { const b = xkid(e, n + 'Border'); return { type: b ? b.getAttribute('type') || 'NONE' : 'NONE', width: b ? b.getAttribute('width') : '0.1 mm', color: b ? b.getAttribute('color') || '#000000' : '#000000' }; };
    const r = { id: String(id), left: side('left'), right: side('right'), top: side('top'), bottom: side('bottom'), fill: null, grad: null };
    const fb = xkid(e, 'fillBrush');
    if (fb) {
      const wb = xkid(fb, 'winBrush'); if (wb && hexColor(wb.getAttribute('faceColor'))) r.fill = wb.getAttribute('faceColor');
      const g = xkid(fb, 'gradation'); if (g) r.grad = { angle: xint(g, 'angle', 0), colors: xkids(g, 'color').map(c => c.getAttribute('value')).filter(hexColor) };
    }
    return r;
  }
  bfCss(id, cell) {
    const b = this.bf(id); if (!b) return '';
    const st = { SOLID: 'solid', DASH: 'dashed', DOT: 'dotted', DASH_DOT: 'dashed', DASH_DOT_DOT: 'dashed', LONG_DASH: 'dashed', CIRCLE: 'dotted', DOUBLE_SLIM: 'double', SLIM_THICK: 'double', THICK_SLIM: 'double', SLIM_THICK_SLIM: 'double', WAVE: 'solid', DOUBLE_WAVE: 'double', THICK_3D: 'outset', THICK_3D_REVERS: 'inset', SOLID_3D: 'outset', SOLID_3D_REVERS: 'inset' };
    let s = '';
    for (const n of ['left', 'right', 'top', 'bottom']) {
      const x = b[n];
      if (x.type === 'NONE') { if (cell) s += `border-${n}:1px dashed var(--hw-ghost);`; continue; }
      const w = Math.max(1, mmW(x.width) * 3.78), style = st[x.type] || 'solid';
      s += `border-${n}:${(style === 'double' ? Math.max(3, w) : w).toFixed(2)}px ${style} ${hexColor(x.color) || '#000'};`;
    }
    if (b.grad && b.grad.colors.length > 1) s += `background:linear-gradient(${b.grad.angle + 90}deg,${b.grad.colors.join(',')});`;
    else if (b.fill) s += `background-color:${b.fill};`;
    else if (cell) s += 'background-color:transparent;';
    return s;
  }
  css() {
    const out = [];
    for (const id of this.charPr.keys()) out.push(`.cp-${id}{${this.cpCss(id)}}`);
    for (const id of this.paraPr.keys()) out.push(`.pp-${id}{${this.ppCss(id)}}`);
    for (const id of this.borderFill.keys()) out.push(`.bf-${id}{${this.bfCss(id, true)}}`);
    return out.join('\n');
  }
  ruleFor(kind, id) { return kind === 'cp' ? `.cp-${id}{${this.cpCss(id)}}` : kind === 'pp' ? `.pp-${id}{${this.ppCss(id)}}` : `.bf-${id}{${this.bfCss(id, true)}}`; }

  /* 같은 모양이 이미 있으면 그 번호를, 없으면 새로 추가 */
  _dedupe(kind, map, box, el) {
    const ser = new XMLSerializer();
    if (!this._keys[kind]) { const m = new Map(); for (const [id, e] of map) { const c = e.cloneNode(true); c.removeAttribute('id'); const k = ser.serializeToString(c); if (!m.has(k)) m.set(k, id); } this._keys[kind] = m; }
    el.removeAttribute('id');
    const key = ser.serializeToString(el);
    const hit = this._keys[kind].get(key); if (hit != null) return hit;
    const id = String(Array.from(map.keys()).reduce((m, k) => Math.max(m, +k), -1) + 1);
    el.setAttribute('id', id);
    // id 를 맨 앞 속성으로
    const attrs = Array.from(el.attributes).map(a => [a.name, a.value]); attrs.forEach(([n]) => el.removeAttribute(n));
    el.setAttribute('id', id); attrs.forEach(([n, v]) => { if (n !== 'id') el.setAttribute(n, v); });
    box.appendChild(el); map.set(id, el); box.setAttribute('itemCnt', String(map.size));
    this._keys[kind].set(key, id);
    if (this.onAdd) this.onAdd(kind, id);
    return id;
  }
  _setChild(e, name, on, attrs, order) {
    let c = xkid(e, name);
    if (!on) { if (c) c.remove(); return; }
    if (!c) {
      c = this.doc.createElementNS(e.namespaceURI, e.prefix ? e.prefix + ':' + name : name);
      const idx = order.indexOf(name); let before = null;
      for (let x = e.firstElementChild; x; x = x.nextElementSibling) { const j = order.indexOf(x.localName); if (j > idx) { before = x; break; } }
      e.insertBefore(c, before);
    }
    if (attrs) for (const [k, v] of Object.entries(attrs)) c.setAttribute(k, v);
    return c;
  }
  deriveCp(id, m) {
    const base = this.charPr.get(String(id)) || this.charPr.get('0');
    const e = base.cloneNode(true);
    if (m.height != null) e.setAttribute('height', String(Math.round(Math.max(100, Math.min(409600, m.height)))));
    if (m.color) e.setAttribute('textColor', m.color);
    if (m.shade) e.setAttribute('shadeColor', m.shade);
    if (m.bold != null) this._setChild(e, 'bold', m.bold, null, CP_ORDER);
    if (m.italic != null) this._setChild(e, 'italic', m.italic, null, CP_ORDER);
    if (m.underline != null) this._setChild(e, 'underline', true, { type: m.underline ? (m.underline === true ? 'BOTTOM' : m.underline) : 'NONE', shape: 'SOLID', color: m.ulColor || '#000000' }, CP_ORDER);
    if (m.strike != null) this._setChild(e, 'strikeout', true, { shape: m.strike ? 'SOLID' : 'NONE', color: '#000000' }, CP_ORDER);
    if (m.script != null) { this._setChild(e, 'supscript', m.script === 'sup', null, CP_ORDER); this._setChild(e, 'subscript', m.script === 'sub', null, CP_ORDER); }
    if (m.face) { const fr = xkid(e, 'fontRef') || this._setChild(e, 'fontRef', true, {}, CP_ORDER); H_LANGS.forEach(l => { const fid = this.fontId(l, m.face); if (fid != null) fr.setAttribute(l, fid); }); }
    const allLang = (name, v) => { const x = xkid(e, name) || this._setChild(e, name, true, {}, CP_ORDER); H_LANGS.forEach(l => x.setAttribute(l, String(v))); };
    if (m.ratio != null) allLang('ratio', Math.max(50, Math.min(200, Math.round(m.ratio))));
    if (m.spacing != null) allLang('spacing', Math.max(-50, Math.min(50, Math.round(m.spacing))));
    if (m.relSz != null) allLang('relSz', m.relSz);
    return this._dedupe('cp', this.charPr, this.cpBox, e);
  }
  derivePp(id, m) {
    const base = this.paraPr.get(String(id)) || this.paraPr.get('0');
    const e = base.cloneNode(true);
    if (m.align) { const a = xkid(e, 'align'); if (a) a.setAttribute('horizontal', m.align); }
    const holders = [];
    const sw = xkid(e, 'switch');
    if (sw) { const cs = xkid(sw, 'case'), df = xkid(sw, 'default'); if (cs) holders.push([cs, 1]); if (df) holders.push([df, 2]); }
    else holders.push([e, 1]);
    for (const [h, mul] of holders) {
      const mg = xkid(h, 'margin');
      for (const n of ['intent', 'left', 'right', 'prev', 'next']) if (m[n] != null && mg) { const x = xkid(mg, n); if (x) x.setAttribute('value', String(Math.round(m[n] * mul))); }
      const ls = xkid(h, 'lineSpacing');
      if (ls && (m.ls != null || m.lsType)) {
        const t = m.lsType || ls.getAttribute('type') || 'PERCENT'; ls.setAttribute('type', t);
        if (m.ls != null) ls.setAttribute('value', String(Math.round(t === 'PERCENT' ? m.ls : m.ls * mul)));
      }
    }
    if (m.heading) { const hd = xkid(e, 'heading'); if (hd) { hd.setAttribute('type', m.heading.type); hd.setAttribute('idRef', String(m.heading.idRef || 0)); hd.setAttribute('level', String(m.heading.level || 0)); } }
    if (m.pageBreakBefore != null) { const b = xkid(e, 'breakSetting'); if (b) b.setAttribute('pageBreakBefore', m.pageBreakBefore ? '1' : '0'); }
    return this._dedupe('pp', this.paraPr, this.ppBox, e);
  }
  deriveBf(id, m) {
    const base = this.borderFill.get(String(id)) || this.borderFill.values().next().value;
    const e = base.cloneNode(true);
    if (m.sides) for (const n of m.sides) { const b = xkid(e, n + 'Border'); if (b) { b.setAttribute('type', m.type || 'SOLID'); b.setAttribute('width', m.width || '0.12 mm'); b.setAttribute('color', m.color || '#000000'); } }
    if (m.fill !== undefined) {
      let fb = xkid(e, 'fillBrush');
      if (m.fill === null) { if (fb) fb.remove(); }
      else {
        if (!fb) { fb = this.doc.createElementNS(HNS.hc, 'hc:fillBrush'); e.appendChild(fb); }
        while (fb.firstChild) fb.firstChild.remove();
        const wb = this.doc.createElementNS(HNS.hc, 'hc:winBrush'); wb.setAttribute('faceColor', m.fill); wb.setAttribute('hatchColor', '#999999'); wb.setAttribute('alpha', '0'); fb.appendChild(wb);
      }
    }
    return this._dedupe('bf', this.borderFill, this.bfBox, e);
  }
  /* 표 테두리용 기본 실선 테두리 */
  solidBf() { const first = this.borderFill.keys().next().value; return this.deriveBf(first, { sides: ['left', 'right', 'top', 'bottom'], type: 'SOLID', width: '0.12 mm', color: '#000000', fill: null }); }
  headingInfo(ppId) {
    this._hcache = this._hcache || new Map();
    if (this._hcache.has(ppId)) return this._hcache.get(ppId);
    const p = this.pp(ppId); const r = p.heading === 'NONE' ? null : { type: p.heading, idRef: String(p.headId), level: p.level };
    this._hcache.set(ppId, r); return r;
  }
  paraHead(numId, level) { const n = this.numbering.get(String(numId)); if (!n) return null; return xkids(n, 'paraHead').find(h => xint(h, 'level', 0) === level + 1) || null; }
}

/* ---------- 문서 ---------- */
class HwpxDoc {
  constructor(files) {
    this.files = files; // Map(name → {data, method})
    this.paras = []; this.paraSig = []; this.islands = []; this.tables = []; this.tblSig = []; this.tcs = [];
    this.bins = new Map(); this.newBins = [];
  }
  static async open(buf) { const files = await Zip.read(buf); const d = new HwpxDoc(files); d.load(); return d; }
  static blank() { const d = new HwpxDoc(HwpxDoc.blankFiles()); d.load(); return d; }
  text(name) { const f = this.files.get(name); return f ? new TextDecoder('utf-8').decode(f.data) : null; }
  load() {
    let hpfPath = 'Contents/content.hpf';
    const cont = this.text('META-INF/container.xml');
    if (cont) { const c = xparse(cont, 'container.xml'); const rf = xdesc(c, 'rootfile').find(r => /hpf$/i.test(r.getAttribute('full-path') || '')); if (rf) hpfPath = rf.getAttribute('full-path'); }
    const hpfText = this.text(hpfPath);
    if (!hpfText) throw new Error('hwpx 구성 파일(content.hpf)이 없습니다. 한글 표준 문서(hwpx)가 맞는지 확인해 주세요.');
    this.hpfPath = hpfPath; this.hpf = xparse(hpfText, 'content.hpf');
    const dir = hpfPath.includes('/') ? hpfPath.slice(0, hpfPath.lastIndexOf('/') + 1) : '';
    const resolve = h => { if (this.files.has(h)) return h; if (this.files.has(dir + h)) return dir + h; return h; };
    this.manifest = new Map();
    for (const it of xdesc(this.hpf, 'item')) this.manifest.set(it.getAttribute('id'), { href: resolve(it.getAttribute('href') || ''), type: it.getAttribute('media-type') || '', el: it });
    const spine = xdesc(this.hpf, 'itemref').map(r => r.getAttribute('idref'));
    let headerId = Array.from(this.manifest.keys()).find(id => /header\.xml$/i.test(this.manifest.get(id).href)) || 'header';
    const hd = this.manifest.get(headerId);
    if (!hd || !this.files.has(hd.href)) throw new Error('header.xml 이 없습니다');
    this.headerPath = hd.href; this.header = new HwpHeader(xparse(this.text(hd.href), 'header.xml'));
    let secIds = spine.filter(id => id !== headerId && this.manifest.has(id) && /section\d*\.xml$/i.test(this.manifest.get(id).href));
    if (!secIds.length) secIds = Array.from(this.manifest.keys()).filter(id => /section\d*\.xml$/i.test(this.manifest.get(id).href));
    this.sections = secIds.map(id => ({ id, path: this.manifest.get(id).href, doc: xparse(this.text(this.manifest.get(id).href), this.manifest.get(id).href) }));
    if (!this.sections.length) throw new Error('본문(section) 이 없습니다');
    for (const [id, m] of this.manifest) if (/^BinData\//i.test(m.href) || /image|bmp|png|jpe?g|gif|svg|wmf|emf/i.test(m.type)) this.bins.set(id, { path: m.href, type: m.type });
    const t = xdesc(this.hpf, 'title')[0]; this.title = t ? t.textContent : '';
  }
  binUrl(id) {
    const b = this.bins.get(id); if (!b) return '';
    if (!b.url) {
      const f = this.files.get(b.path); if (!f) return '';
      let type = b.type; if (!/^image\//.test(type)) { const ext = (b.path.split('.').pop() || '').toLowerCase(); type = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', svg: 'image/svg+xml', webp: 'image/webp' }[ext] || 'application/octet-stream'; }
      b.url = URL.createObjectURL(new Blob([f.data], { type }));
    }
    return b.url;
  }
  secPr(si) { return xdesc(this.sections[si].doc, 'secPr')[0] || null; }
  page(si) {
    const sp = this.secPr(si), pp = xkid(sp, 'pagePr'), mg = xkid(pp, 'margin');
    let w = xint(pp, 'width', 59528), h = xint(pp, 'height', 84188);
    const land = pp && pp.getAttribute('landscape') === 'NARROWLY';
    if (land && w < h) [w, h] = [h, w];
    return { w, h, land, top: xint(mg, 'top', 5668), bottom: xint(mg, 'bottom', 4252), left: xint(mg, 'left', 8504), right: xint(mg, 'right', 8504), header: xint(mg, 'header', 4252), footer: xint(mg, 'footer', 4252), gutter: xint(mg, 'gutter', 0) };
  }
  setPage(si, p) {
    const sp = this.secPr(si), pp = xkid(sp, 'pagePr'), mg = xkid(pp, 'margin');
    const pw = Math.min(p.w, p.h), ph = Math.max(p.w, p.h);
    pp.setAttribute('landscape', p.land ? 'NARROWLY' : 'WIDELY'); pp.setAttribute('width', String(pw)); pp.setAttribute('height', String(ph));
    for (const k of ['header', 'footer', 'gutter', 'left', 'right', 'top', 'bottom']) mg.setAttribute(k, String(Math.round(p[k])));
  }

  /* ===== 화면(HTML)으로 바꾸기 ===== */
  render() {
    const frag = document.createDocumentFragment();
    this.sections.forEach((s, si) => {
      const box = document.createElement('div'); box.className = 'hsec'; box.dataset.s = si;
      for (const p of xkids(s.doc.documentElement, 'p')) box.appendChild(this.paraHtml(p));
      if (!box.firstChild) box.appendChild(this.newParaHtml('0', '0', '0'));
      frag.appendChild(box);
    });
    return frag;
  }
  /* 화면 블록의 원본 비교용 서명 (번호·셀 선택 같은 화면 전용 표시는 뺌) */
  sig(div) { return div.dataset.pp + '|' + div.dataset.st + '|' + (div.dataset.pb || '') + '|' + div.innerHTML.replace(/ data-num="[^"]*"/g, '').replace(/ csel/g, ''); }
  tsig(t) { return t.outerHTML.replace(/ data-num="[^"]*"/g, '').replace(/ csel/g, ''); }
  sealSigs(root) {
    for (const d of root.querySelectorAll('.hp[data-k]')) this.paraSig[d.dataset.k] = this.sig(d);
    for (const t of root.querySelectorAll('table.htb[data-t]')) this.tblSig[t.dataset.t] = this.tsig(t);
  }
  newParaHtml(pp, st, cp) {
    const d = document.createElement('div'); d.className = `hp pp-${pp} cp-${cp}`; d.dataset.pp = pp; d.dataset.st = st; d.dataset.dcp = cp;
    d.appendChild(document.createElement('br')); return d;
  }
  paraHtml(p) {
    const d = document.createElement('div');
    d.dataset.k = this.paras.push(p) - 1;
    const pp = p.getAttribute('paraPrIDRef') || '0', st = p.getAttribute('styleIDRef') || '0';
    d.dataset.pp = pp; d.dataset.st = st;
    if (p.getAttribute('pageBreak') === '1') d.dataset.pb = '1';
    let dcp = null, visible = false;
    const addText = (cp, text) => {
      if (!text) return; visible = true;
      const last = d.lastChild;
      if (last && last.nodeType === 1 && last.tagName === 'SPAN' && !last.classList.contains('isl') && last.dataset.cp === cp) last.appendChild(document.createTextNode(text));
      else { const s = document.createElement('span'); s.className = 'cp-' + cp; s.dataset.cp = cp; s.textContent = text; d.appendChild(s); }
    };
    for (const run of xkids(p, 'run')) {
      const cp = run.getAttribute('charPrIDRef') || '0'; if (dcp == null) dcp = cp;
      for (const c of xkids(run)) {
        const n = c.localName;
        if (n === 't') {
          for (let x = c.firstChild; x; x = x.nextSibling) {
            if (x.nodeType === 3) addText(cp, x.nodeValue.replace(/\r?\n/g, ' '));
            else if (x.nodeType === 1) {
              const ln = x.localName;
              if (ln === 'lineBreak') { const br = document.createElement('br'); br.dataset.lb = '1'; d.appendChild(br); visible = true; }
              else { d.appendChild(this.islandHtml(x, cp, true)); if (/tab|Space|hyphen/.test(ln)) visible = true; }
            }
          }
        } else if (n === 'tbl') { d.appendChild(this.tableHtml(c, cp)); visible = true; }
        else { const isl = this.islandHtml(c, cp, false); d.appendChild(isl); if (!isl.classList.contains('hid')) visible = true; }
      }
    }
    dcp = dcp || '0'; d.dataset.dcp = dcp; d.className = `hp pp-${pp} cp-${dcp}`;
    const last = d.lastChild;
    if (!visible || (last && last.nodeName === 'BR')) d.appendChild(document.createElement('br'));
    return d;
  }
  islandHtml(el, cp, inT) {
    const i = this.islands.push({ el, inT }) - 1;
    const s = document.createElement('span'); s.className = 'isl'; s.contentEditable = 'false'; s.dataset.i = i; s.dataset.cp = cp;
    const n = el.localName;
    if (n === 'tab') { s.classList.add('tab', 'cp-' + cp); s.style.width = Math.max(10, xint(el, 'width', 3000) / HU).toFixed(1) + 'px'; s.textContent = ' '; return s; }
    if (n === 'nbSpace') { s.classList.add('cp-' + cp); s.textContent = ' '; return s; }
    if (n === 'fwSpace') { s.classList.add('cp-' + cp); s.textContent = '　'; return s; }
    if (n === 'hyphen') { s.classList.add('cp-' + cp); s.textContent = '-'; return s; }
    if (inT) { s.classList.add('hid'); return s; }
    if (n === 'ctrl') {
      const k = el.firstElementChild ? el.firstElementChild.localName : '';
      s.dataset.ctrl = k;
      if (k === 'footNote' || k === 'endNote') { s.classList.add('note'); s.textContent = k === 'footNote' ? '주' : '미주'; s.title = (k === 'footNote' ? '각주: ' : '미주: ') + el.textContent.trim().slice(0, 200); return s; }
      if (k === 'autoNum') { s.classList.add('cp-' + cp); s.textContent = '#'; s.title = '자동 번호'; return s; }
      s.classList.add('hid'); return s;
    }
    if (n === 'secPr') { s.classList.add('hid'); s.dataset.ctrl = 'secPr'; return s; }
    const szEl = xkid(el, 'sz') || xkid(el, 'curSz');
    const w = xint(szEl, 'width', 0), h = xint(szEl, 'height', 0);
    if (n === 'pic') {
      s.classList.add('obj', 'pic');
      const img = xdesc(el, 'img')[0]; const url = img ? this.binUrl(img.getAttribute('binaryItemIDRef')) : '';
      if (url) { const im = document.createElement('img'); im.src = url; im.alt = ''; im.draggable = false; s.appendChild(im); }
      if (w) s.style.width = (w / HU).toFixed(1) + 'px'; if (h) s.style.height = (h / HU).toFixed(1) + 'px';
      return s;
    }
    if (n === 'equation') {
      s.classList.add('obj', 'eq'); const sc = xkid(el, 'script'); s.textContent = sc ? sc.textContent : '수식'; s.title = '수식 (한글에서 편집)'; return s;
    }
    if (n === 'switch') { const def = xkid(el, 'default') || xkid(el, 'case'); const inner = def && def.firstElementChild; if (inner) { const v = this.islandHtml(inner, cp, false); this.islands.pop(); v.dataset.i = i; return v; } s.classList.add('hid'); return s; }
    // 그리기 개체·묶음·OLE·차트 등: 크기만큼 자리를 잡고 안에 그림/글이 있으면 보여 줌
    s.classList.add('obj', 'draw');
    if (w) s.style.width = (w / HU).toFixed(1) + 'px'; if (h) s.style.height = (h / HU).toFixed(1) + 'px';
    const img = xdesc(el, 'img')[0]; const url = img ? this.binUrl(img.getAttribute('binaryItemIDRef')) : '';
    if (url) { const im = document.createElement('img'); im.src = url; im.alt = ''; im.draggable = false; s.appendChild(im); }
    else { const tx = xdesc(el, 't').map(t => t.textContent).join(' ').trim(); s.textContent = tx || ({ container: '묶음 개체', rect: '사각형', ellipse: '타원', line: '선', ole: 'OLE 개체', chart: '차트', textart: '글맵시', polygon: '다각형', curve: '곡선', arc: '호' }[n] || '개체'); }
    s.title = '그리기 개체 — 원본 그대로 저장됩니다 (한글에서 편집)';
    return s;
  }
  tableHtml(tbl, cp) {
    const ti = this.tables.push(tbl) - 1;
    const t = document.createElement('table'); t.className = 'htb'; t.contentEditable = 'false'; t.dataset.t = ti; t.dataset.cp = cp;
    const pos = xkid(tbl, 'pos');
    if (pos && pos.getAttribute('treatAsChar') !== '1') {
      t.classList.add('blk');
      const ha = pos.getAttribute('horzAlign'), ho = xint(pos, 'horzOffset', 0);
      if (ha === 'CENTER') t.classList.add('mid'); else if (ha === 'RIGHT') t.classList.add('end'); else if (ho > 0 && ho < 60000) t.style.marginLeft = (ho / HU).toFixed(1) + 'px';
    }
    const inM = xkid(tbl, 'inMargin');
    const cells = [];
    let cols = xint(tbl, 'colCnt', 0);
    const body = document.createElement('tbody'); t.appendChild(body); // 되돌리기 때 HTML 로 다시 읽어도 구조가 같도록
    for (const tr of xkids(tbl, 'tr')) {
      const row = document.createElement('tr'); body.appendChild(row);
      for (const tc of xkids(tr, 'tc')) {
        const td = document.createElement('td');
        td.dataset.tc = this.tcs.push(tc) - 1;
        const span = xkid(tc, 'cellSpan'), sz = xkid(tc, 'cellSz'), addr = xkid(tc, 'cellAddr');
        const cs = xint(span, 'colSpan', 1), rs = xint(span, 'rowSpan', 1);
        if (cs > 1) td.colSpan = cs; if (rs > 1) td.rowSpan = rs;
        const w = xint(sz, 'width', 0), h = xint(sz, 'height', 0);
        td.dataset.w = w; td.dataset.h = h;
        if (h) td.style.height = (h / HU).toFixed(1) + 'px';
        const m = tc.getAttribute('hasMargin') === '1' ? xkid(tc, 'cellMargin') : inM;
        if (m) td.style.padding = ['top', 'right', 'bottom', 'left'].map(k => (xint(m, k, 141) / HU).toFixed(1) + 'px').join(' ');
        const bf = tc.getAttribute('borderFillIDRef') || '1'; td.dataset.bf = bf; td.className = 'bf-' + bf;
        const sub = xkid(tc, 'subList'); const va = sub ? sub.getAttribute('vertAlign') : 'TOP';
        td.style.verticalAlign = va === 'CENTER' ? 'middle' : va === 'BOTTOM' ? 'bottom' : 'top';
        td.contentEditable = 'true';
        for (const p of xkids(sub, 'p')) td.appendChild(this.paraHtml(p));
        if (!td.firstChild) td.appendChild(this.newParaHtml('0', '0', cp));
        row.appendChild(td);
        cells.push({ c: xint(addr, 'colAddr', 0), cs, w });
        cols = Math.max(cols, xint(addr, 'colAddr', 0) + cs);
      }
    }
    // 열 너비: 한 칸짜리 셀에서 구하고, 모르는 열은 병합 셀에서 나눠 채움
    const cw = new Array(cols).fill(0);
    for (const x of cells) if (x.cs === 1 && x.c < cols && !cw[x.c]) cw[x.c] = x.w;
    for (const x of cells) if (x.cs > 1) { const known = cw.slice(x.c, x.c + x.cs).reduce((a, b) => a + b, 0), miss = cw.slice(x.c, x.c + x.cs).filter(v => !v).length; if (miss) for (let k = x.c; k < x.c + x.cs && k < cols; k++) if (!cw[k]) cw[k] = Math.max(300, (x.w - known) / miss); }
    const total = xint(xkid(tbl, 'sz'), 'width', 0) || cw.reduce((a, b) => a + b, 0);
    const cg = document.createElement('colgroup');
    cw.forEach(v => { const c = document.createElement('col'); c.style.width = ((v || total / cols) / HU).toFixed(1) + 'px'; cg.appendChild(c); });
    t.insertBefore(cg, t.firstChild);
    t.style.width = (cw.reduce((a, b) => a + (b || total / cols), 0) / HU).toFixed(1) + 'px';
    return t;
  }

  /* ===== 저장 (HTML → hwpx) ===== */
  async save(root, opts) {
    opts = opts || {};
    this._used = new Set(); this._usedT = new Set(); this._usedIsl = new Set();
    const out = new Map();
    const secs = Array.from(root.querySelectorAll(':scope > .hsec'));
    this.sections.forEach((s, si) => {
      const box = secs.find(b => +b.dataset.s === si);
      const nd = document.implementation.createDocument(null, null, null);
      const sec = nd.importNode(s.doc.documentElement, false); nd.appendChild(sec);
      const blocks = box ? Array.from(box.children).filter(x => x.classList.contains('hp')) : [];
      for (const b of blocks) sec.appendChild(this.paraXml(b, nd));
      if (!sec.firstElementChild) sec.appendChild(this.paraXml(this.newParaHtml('0', '0', '0'), nd));
      this.ensureSecPr(s, sec, nd);
      out.set(s.path, xstring(nd));
    });
    out.set(this.headerPath, xstring(this.header.doc));
    // 새 그림 → BinData + manifest
    const man = xdesc(this.hpf, 'manifest')[0];
    for (const b of this.newBins) if (!b.written) {
      const it = this.hpf.createElementNS(HNS.opf, 'opf:item');
      it.setAttribute('id', b.id); it.setAttribute('href', b.path); it.setAttribute('media-type', b.type); it.setAttribute('isEmbeded', '1');
      man.appendChild(it); this.manifest.set(b.id, { href: b.path, type: b.type, el: it });
      this.files.set(b.path, { data: b.data, method: 0 }); b.written = true;
    }
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    for (const m of xdesc(this.hpf, 'meta')) if (m.getAttribute('name') === 'ModifiedDate') m.textContent = now;
    out.set(this.hpfPath, xstring(this.hpf));
    if (this.files.has('Preview/PrvText.txt')) out.set('Preview/PrvText.txt', (root.innerText || '').replace(/\n{3,}/g, '\n\n').slice(0, 1000).replace(/\n/g, '\r\n'));
    const entries = [];
    const names = Array.from(this.files.keys());
    if (names.includes('mimetype')) { names.splice(names.indexOf('mimetype'), 1); names.unshift('mimetype'); }
    for (const name of names) {
      const f = this.files.get(name);
      const data = out.has(name) ? out.get(name) : f.data;
      const store = name === 'mimetype' || (!out.has(name) && f.method === 0) || /\.(png|jpe?g|gif|webp)$/i.test(name);
      entries.push({ name, data, store });
    }
    const blob = await Zip.write(entries);
    // 저장한 내용을 새 원본으로 삼음 (다음 저장 때 비교 기준)
    for (const [name, text] of out) { const f = this.files.get(name); const data = new TextEncoder().encode(text); if (f) f.data = data; else this.files.set(name, { data, method: 8 }); }
    return blob;
  }
  ensureSecPr(s, sec, nd) {
    const found = xdesc(sec, 'secPr')[0];
    if (found) { // 구역 설정은 반드시 첫 문단에
      const p0 = sec.firstElementChild; let p = found; while (p && p.parentNode !== sec) p = p.parentNode;
      if (p && p !== p0) {
        const run = found.parentNode; const col = xkids(run, 'ctrl').find(c => xkid(c, 'colPr'));
        const nr = nd.createElementNS(HNS.hp, 'hp:run'); nr.setAttribute('charPrIDRef', run.getAttribute('charPrIDRef') || '0');
        nr.appendChild(found); if (col) nr.appendChild(col);
        if (!run.firstElementChild && xkids(run.parentNode, 'run').length > 1) run.remove();
        p0.insertBefore(nr, p0.firstChild);
      }
      return;
    }
    const orig = xdesc(s.doc, 'secPr')[0]; if (!orig) return;
    const p = sec.firstElementChild;
    const run = nd.createElementNS(HNS.hp, 'hp:run'); run.setAttribute('charPrIDRef', (xkid(p, 'run') || { getAttribute: () => '0' }).getAttribute('charPrIDRef') || '0');
    run.appendChild(nd.importNode(orig, true));
    const col = orig.parentNode && xkids(orig.parentNode, 'ctrl').find(c => xkid(c, 'colPr'));
    if (col) run.appendChild(nd.importNode(col, true));
    p.insertBefore(run, p.firstChild);
  }
  paraXml(div, nd) {
    const k = div.dataset.k;
    if (k != null && !this._used.has(k) && this.paraSig[k] === this.sig(div)) { this._used.add(k); return nd.importNode(this.paras[k], true); }
    const src = k != null && !this._used.has(k) ? this.paras[k] : null;
    if (k != null) this._used.add(k);
    const p = nd.createElementNS(HNS.hp, 'hp:p');
    p.setAttribute('id', src ? src.getAttribute('id') || '0' : '0');
    p.setAttribute('paraPrIDRef', div.dataset.pp || '0'); p.setAttribute('styleIDRef', div.dataset.st || '0');
    p.setAttribute('pageBreak', div.dataset.pb === '1' ? '1' : '0'); p.setAttribute('columnBreak', src ? src.getAttribute('columnBreak') || '0' : '0'); p.setAttribute('merged', '0');
    const items = [];
    this.collect(div, div.dataset.dcp || '0', items);
    while (items.length && items[items.length - 1].plainBr) items.pop();
    let run = null, t = null;
    const mk = (n, a) => { const e = nd.createElementNS(HNS.hp, 'hp:' + n); if (a) for (const [x, v] of Object.entries(a)) e.setAttribute(x, v); return e; };
    for (const it of items) {
      if (!run || run.getAttribute('charPrIDRef') !== it.cp) { run = mk('run', { charPrIDRef: it.cp }); p.appendChild(run); t = null; }
      if (it.text != null || it.lb || (it.el && it.inT)) {
        if (!t) { t = mk('t'); run.appendChild(t); }
        if (it.text != null) {
          const parts = it.text.split(/(\t|\n)/);
          for (const s of parts) { if (s === '\t') t.appendChild(mk('tab', { width: '4000', leader: '0', type: '1' })); else if (s === '\n') t.appendChild(mk('lineBreak')); else if (s) t.appendChild(nd.createTextNode(s)); }
        } else if (it.lb) t.appendChild(mk('lineBreak'));
        else t.appendChild(nd.importNode(it.el, true));
      } else { t = null; run.appendChild(it.tbl ? this.tableXml(it.tbl, nd) : nd.importNode(it.el, true)); }
    }
    if (!p.firstElementChild) p.appendChild(mk('run', { charPrIDRef: div.dataset.dcp || '0' }));
    return p;
  }
  collect(node, cp, items) {
    for (let x = node.firstChild; x; x = x.nextSibling) {
      if (x.nodeType === 3) {
        const s = x.nodeValue.replace(/[​﻿]/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').replace(/\r/g, '');
        if (s) items.push({ cp, text: s });
        continue;
      }
      if (x.nodeType !== 1) continue;
      if (x.tagName === 'BR') { items.push(x.dataset.lb ? { cp, lb: true } : { cp, lb: true, plainBr: true }); continue; }
      if (x.classList.contains('isl')) { const is = this.islands[x.dataset.i]; if (is) { items.push({ cp: x.dataset.cp || cp, el: is.el, inT: is.inT }); this._usedIsl.add(is.el); } continue; }
      if (x.tagName === 'TABLE' && x.classList.contains('htb')) { items.push({ cp: x.dataset.cp || cp, tbl: x }); continue; }
      if (x.tagName === 'IMG' || x.tagName === 'STYLE' || x.tagName === 'SCRIPT') continue;
      if (x.classList.contains('hp')) { if (items.length && !items[items.length - 1].lb) items.push({ cp, lb: true }); }
      this.collect(x, x.dataset && x.dataset.cp ? x.dataset.cp : cp, items);
    }
  }
  tableXml(t, nd) {
    const ti = t.dataset.t;
    if (!this._usedT.has(ti) && this.tblSig[ti] === this.tsig(t)) { this._usedT.add(ti); return nd.importNode(this.tables[ti], true); }
    this._usedT.add(ti);
    const src = this.tables[ti];
    const tbl = nd.importNode(src, false);
    const kidsSrc = xkids(src), firstTr = kidsSrc.findIndex(c => c.localName === 'tr');
    const pre = firstTr < 0 ? kidsSrc : kidsSrc.slice(0, firstTr), post = firstTr < 0 ? [] : kidsSrc.slice(firstTr).filter(c => c.localName !== 'tr' && c.localName !== 'cellzoneList');
    const grid = tableGrid(t);
    let changedW = false;
    const reshaped = t.rows.length !== xint(src, 'rowCnt', -1) || grid.cols !== xint(src, 'colCnt', -1);
    for (const c of pre) {
      if (c.localName === 'cellzoneList' && reshaped) continue; // 줄/칸 수가 바뀌면 셀 영역 정보는 맞지 않음
      const e = nd.importNode(c, true);
      if (c.localName === 'sz') { const w = grid.colW.reduce((a, b) => a + b, 0); if (w && Math.abs(w - xint(c, 'width', 0)) > 2) { e.setAttribute('width', String(Math.round(w))); changedW = true; } }
      tbl.appendChild(e);
    }
    tbl.setAttribute('rowCnt', String(t.rows.length)); tbl.setAttribute('colCnt', String(grid.cols));
    const mk = (n, a) => { const e = nd.createElementNS(HNS.hp, 'hp:' + n); if (a) for (const [x, v] of Object.entries(a)) e.setAttribute(x, v); return e; };
    Array.from(t.rows).forEach((row, r) => {
      const tr = mk('tr'); tbl.appendChild(tr);
      for (const td of row.cells) {
        const pos = grid.pos.get(td) || { r, c: 0 };
        const tpl = this.tcs[td.dataset.tc];
        const tc = nd.importNode(tpl, false); tc.setAttribute('borderFillIDRef', td.dataset.bf || tpl.getAttribute('borderFillIDRef') || '1');
        let sub = null;
        for (const c of xkids(tpl)) {
          const n = c.localName;
          if (n === 'subList') {
            sub = nd.importNode(c, false);
            const va = td.style.verticalAlign; sub.setAttribute('vertAlign', va === 'middle' ? 'CENTER' : va === 'bottom' ? 'BOTTOM' : 'TOP');
            const ps = Array.from(td.children).filter(x => x.classList.contains('hp'));
            for (const d of ps) sub.appendChild(this.paraXml(d, nd));
            if (!sub.firstElementChild) sub.appendChild(this.paraXml(this.newParaHtml('0', '0', t.dataset.cp || '0'), nd));
            tc.appendChild(sub);
          } else if (n === 'cellAddr') tc.appendChild(mk('cellAddr', { colAddr: String(pos.c), rowAddr: String(pos.r) }));
          else if (n === 'cellSpan') tc.appendChild(mk('cellSpan', { colSpan: String(td.colSpan || 1), rowSpan: String(td.rowSpan || 1) }));
          else if (n === 'cellSz') tc.appendChild(mk('cellSz', { width: String(Math.round(+td.dataset.w || 0)), height: String(Math.round(+td.dataset.h || 0)) }));
          else tc.appendChild(nd.importNode(c, true));
        }
        tr.appendChild(tc);
      }
    });
    for (const c of post) tbl.appendChild(nd.importNode(c, true));
    return tbl;
  }

  /* ===== 새로 만드는 개체 ===== */
  newTableXml(rows, cols, contentW, cp) {
    const bf = this.header.solidBf();
    const cw = Math.floor(contentW / cols), ch = 1800;
    const doc = this.sections[0].doc;
    let x = `<hp:tbl xmlns:hp="${HNS.hp}" id="${Date.now() % 2000000000}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="1" rowCnt="${rows}" colCnt="${cols}" cellSpacing="0" borderFillIDRef="${bf}" noAdjust="0">`;
    x += `<hp:sz width="${cw * cols}" widthRelTo="ABSOLUTE" height="${ch * rows}" heightRelTo="ABSOLUTE" protect="0"/>`;
    x += `<hp:pos treatAsChar="0" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>`;
    x += `<hp:outMargin left="283" right="283" top="283" bottom="283"/><hp:inMargin left="510" right="510" top="141" bottom="141"/>`;
    for (let r = 0; r < rows; r++) {
      x += '<hp:tr>';
      for (let c = 0; c < cols; c++) x += `<hp:tc name="" header="${r === 0 ? 1 : 0}" hasMargin="0" protect="0" editable="0" dirty="0" borderFillIDRef="${bf}"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0"><hp:p id="0" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${cp}"/></hp:p></hp:subList><hp:cellAddr colAddr="${c}" rowAddr="${r}"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="${cw}" height="${ch}"/><hp:cellMargin left="510" right="510" top="141" bottom="141"/></hp:tc>`;
      x += '</hp:tr>';
    }
    x += '</hp:tbl>';
    return xfrag(x, '표', doc);
  }
  addImage(bytes, type, wPx, hPx, maxW) {
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/bmp': 'bmp', 'image/webp': 'png' }[type] || 'png';
    let n = 1; while (this.manifest.has('image' + n) || this.newBins.some(b => b.id === 'image' + n)) n++;
    const id = 'image' + n, path = `BinData/${id}.${ext}`;
    this.newBins.push({ id, path, type: ext === 'jpg' ? 'image/jpeg' : 'image/' + ext, data: bytes });
    this.bins.set(id, { path, type: type, url: URL.createObjectURL(new Blob([bytes], { type })) });
    const ow = Math.round(wPx * HU), oh = Math.round(hPx * HU);
    let w = ow, h = oh; if (maxW && w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
    const sx = (w / ow).toFixed(6), sy = (h / oh).toFixed(6);
    const x = `<hp:pic xmlns:hp="${HNS.hp}" xmlns:hc="${HNS.hc}" id="${Date.now() % 2000000000}" zOrder="1" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="${(Date.now() + 7) % 2000000000}" reverse="0">`
      + `<hp:offset x="0" y="0"/><hp:orgSz width="${ow}" height="${oh}"/><hp:curSz width="${w}" height="${h}"/><hp:flip horizontal="0" vertical="0"/>`
      + `<hp:rotationInfo angle="0" centerX="${Math.round(w / 2)}" centerY="${Math.round(h / 2)}" rotateimage="1"/>`
      + `<hp:renderingInfo><hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:scaMatrix e1="${sx}" e2="0" e3="0" e4="0" e5="${sy}" e6="0"/><hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/></hp:renderingInfo>`
      + `<hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="${ow}" y="0"/><hc:pt2 x="${ow}" y="${oh}"/><hc:pt3 x="0" y="${oh}"/></hp:imgRect>`
      + `<hp:imgClip left="0" right="${ow}" top="0" bottom="${oh}"/><hp:inMargin left="0" right="0" top="0" bottom="0"/><hp:imgDim dimwidth="${ow}" dimheight="${oh}"/>`
      + `<hc:img binaryItemIDRef="${id}" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/><hp:effects/>`
      + `<hp:sz width="${w}" widthRelTo="ABSOLUTE" height="${h}" heightRelTo="ABSOLUTE" protect="0"/>`
      + `<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="PARA" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>`
      + `<hp:outMargin left="0" right="0" top="0" bottom="0"/></hp:pic>`;
    return xfrag(x, '그림', this.sections[0].doc);
  }
  ctrlXml(inner) { return xfrag(`<hp:ctrl xmlns:hp="${HNS.hp}">${inner}</hp:ctrl>`, '조판 부호', this.sections[0].doc); }
  newTab() { return xfrag(`<hp:tab xmlns:hp="${HNS.hp}" width="4000" leader="0" type="1"/>`, '탭', this.sections[0].doc); }
  /* 머리말/꼬리말 글 (첫 구역 기준, 화면 표시용) */
  headFoot(si) {
    const r = { header: '', footer: '', pageNum: null };
    for (const c of xdesc(this.sections[si || 0].doc, 'ctrl')) {
      const k = c.firstElementChild; if (!k) continue;
      if (k.localName === 'header' && !r.header) r.header = xdesc(k, 't').map(t => t.textContent).join('');
      if (k.localName === 'footer' && !r.footer) r.footer = xdesc(k, 't').map(t => t.textContent).join('');
      if (k.localName === 'pageNum' && !r.pageNum) r.pageNum = { pos: k.getAttribute('pos') || 'BOTTOM_CENTER', fmt: k.getAttribute('formatType') || 'DIGIT', side: k.getAttribute('sideChar') || '' };
    }
    return r;
  }

  /* ===== 새 문서 틀 ===== */
  static blankFiles() {
    const enc = new TextEncoder(), files = new Map();
    const put = (n, s, store) => files.set(n, { data: enc.encode(s), method: store ? 0 : 8 });
    const NSDECL = 'xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history" xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart" xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"';
    put('mimetype', 'application/hwp+zip', true);
    put('version.xml', XML_HEAD + '<hv:HCFVersion xmlns:hv="http://www.hancom.co.kr/hwpml/2011/version" tagetApplication="WORDPROCESSOR" major="5" minor="1" micro="0" buildNumber="1" os="1" xmlVersion="1.4" application="Hancom Office Hangul" appVersion="9, 1, 1, 5656 WIN32LEWindows_10"/>', true);
    // 글꼴: 0 함초롬돋움, 1 함초롬바탕
    const typeInfo = '<hh:typeInfo familyType="FCAT_GOTHIC" weight="6" proportion="4" contrast="0" strokeVariation="1" armStyle="1" letterform="1" midline="1" xHeight="1"/>';
    const fontfaces = H_LANGS_UP.map(l => `<hh:fontface lang="${l}" fontCnt="2"><hh:font id="0" face="함초롬돋움" type="TTF" isEmbedded="0">${typeInfo}</hh:font><hh:font id="1" face="함초롬바탕" type="TTF" isEmbedded="0">${typeInfo}</hh:font></hh:fontface>`).join('');
    const side = (t, w) => ['left', 'right', 'top', 'bottom'].map(s => `<hh:${s}Border type="${t}" width="${w}" color="#000000"/>`).join('');
    const bfx = (id, t, w, fill) => `<hh:borderFill id="${id}" threeD="0" shadow="0" centerLine="NONE" breakCellSeparateLine="0"><hh:slash type="NONE" Crooked="0" isCounter="0"/><hh:backSlash type="NONE" Crooked="0" isCounter="0"/>${side(t, w)}<hh:diagonal type="SOLID" width="0.1 mm" color="#000000"/>${fill ? '<hc:fillBrush><hc:winBrush faceColor="none" hatchColor="#999999" alpha="0"/></hc:fillBrush>' : ''}</hh:borderFill>`;
    const all = v => H_LANGS.map(l => `${l}="${v}"`).join(' ');
    const cpx = (id, h, font, color) => `<hh:charPr id="${id}" height="${h}" textColor="${color || '#000000'}" shadeColor="none" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="2"><hh:fontRef ${all(font)}/><hh:ratio ${all(100)}/><hh:spacing ${all(0)}/><hh:relSz ${all(100)}/><hh:offset ${all(0)}/><hh:underline type="NONE" shape="SOLID" color="#000000"/><hh:strikeout shape="NONE" color="#000000"/><hh:outline type="NONE"/><hh:shadow type="NONE" color="#B2B2B2" offsetX="10" offsetY="10"/></hh:charPr>`;
    const mg = (v, mul) => ['intent', 'left', 'right', 'prev', 'next'].map(k => `<hc:${k} value="${(v[k] || 0) * mul}" unit="HWPUNIT"/>`).join('');
    const ppx = (id, o) => `<hh:paraPr id="${id}" tabPrIDRef="${o.tab || 0}" condense="0" fontLineHeight="0" snapToGrid="1" suppressLineNumbers="0" checked="0"><hh:align horizontal="${o.align || 'JUSTIFY'}" vertical="BASELINE"/><hh:heading type="${o.head || 'NONE'}" idRef="${o.head ? 1 : 0}" level="${o.level || 0}"/><hh:breakSetting breakLatinWord="KEEP_WORD" breakNonLatinWord="KEEP_WORD" widowOrphan="0" keepWithNext="0" keepLines="0" pageBreakBefore="0" lineWrap="BREAK"/><hh:autoSpacing eAsianEng="0" eAsianNum="0"/><hp:switch><hp:case hp:required-namespace="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar"><hh:margin>${mg(o, 1)}</hh:margin><hh:lineSpacing type="PERCENT" value="${o.ls || 160}" unit="HWPUNIT"/></hp:case><hp:default><hh:margin>${mg(o, 2)}</hh:margin><hh:lineSpacing type="PERCENT" value="${o.ls || 160}" unit="HWPUNIT"/></hp:default></hp:switch><hh:border borderFillIDRef="2" offsetLeft="0" offsetRight="0" offsetTop="0" offsetBottom="0" connect="0" ignoreMargin="0"/></hh:paraPr>`;
    const pps = [ppx(0, {}), ppx(1, { left: 1500 })];
    for (let lv = 0; lv < 7; lv++) pps.push(ppx(2 + lv, { head: 'OUTLINE', level: lv, left: 1000 * (lv + 1), tab: 1 }));
    pps.push(ppx(9, { ls: 150 }));
    const fmts = [['DIGIT', '^1.'], ['HANGUL_SYLLABLE', '^2.'], ['DIGIT', '^3)'], ['HANGUL_SYLLABLE', '^4)'], ['DIGIT', '(^5)'], ['HANGUL_SYLLABLE', '(^6)'], ['CIRCLED_DIGIT', '^7'], ['CIRCLED_HANGUL_SYLLABLE', '^8'], ['HANGUL_JAMO', '^9'], ['ROMAN_SMALL', '^10']];
    const heads = fmts.map(([f, t], i) => `<hh:paraHead start="1" level="${i + 1}" align="LEFT" useInstWidth="1" autoIndent="1" widthAdjust="0" textOffsetType="PERCENT" textOffset="50" numFormat="${f}" charPrIDRef="4294967295" checkable="${i >= 6 ? 1 : 0}">${t}</hh:paraHead>`).join('');
    const sty = (id, name, eng, pp, cp, type) => `<hh:style id="${id}" type="${type || 'PARA'}" name="${name}" engName="${eng}" paraPrIDRef="${pp}" charPrIDRef="${cp}" nextStyleIDRef="${type === 'CHAR' ? 0 : id}" langID="1042" lockForm="0"/>`;
    const styles = [sty(0, '바탕글', 'Normal', 0, 0), sty(1, '본문', 'Body', 1, 0)];
    for (let lv = 0; lv < 7; lv++) styles.push(sty(2 + lv, '개요 ' + (lv + 1), 'Outline ' + (lv + 1), 2 + lv, 0));
    styles.push(sty(9, '쪽 번호', 'Page Number', 0, 1, 'CHAR'), sty(10, '머리말', 'Header', 9, 1));
    const header = XML_HEAD + `<hh:head ${NSDECL} version="1.4" secCnt="1"><hh:beginNum page="1" footnote="1" endnote="1" pic="1" tbl="1" equation="1"/><hh:refList>`
      + `<hh:fontfaces itemCnt="7">${fontfaces}</hh:fontfaces>`
      + `<hh:borderFills itemCnt="3">${bfx(1, 'NONE', '0.1 mm')}${bfx(2, 'NONE', '0.1 mm', true)}${bfx(3, 'SOLID', '0.12 mm')}</hh:borderFills>`
      + `<hh:charProperties itemCnt="2">${cpx(0, 1000, 1)}${cpx(1, 900, 0)}</hh:charProperties>`
      + `<hh:tabProperties itemCnt="2"><hh:tabPr id="0" autoTabLeft="0" autoTabRight="0"/><hh:tabPr id="1" autoTabLeft="1" autoTabRight="0"/></hh:tabProperties>`
      + `<hh:numberings itemCnt="1"><hh:numbering id="1" start="0">${heads}</hh:numbering></hh:numberings>`
      + `<hh:paraProperties itemCnt="${pps.length}">${pps.join('')}</hh:paraProperties>`
      + `<hh:styles itemCnt="${styles.length}">${styles.join('')}</hh:styles>`
      + `</hh:refList><hh:compatibleDocument targetProgram="HWP201X"><hh:layoutCompatibility/></hh:compatibleDocument><hh:docOption><hh:linkinfo path="" pageInherit="0" footnoteInherit="0"/></hh:docOption><hh:trackchageConfig flags="56"/></hh:head>`;
    put('Contents/header.xml', header);
    const notePr = (tag, place, len) => `<hp:${tag}><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="${len}" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="283" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="${place}" beneathText="0"/></hp:${tag}>`;
    const pbf = t => `<hp:pageBorderFill type="${t}" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>`;
    const secPr = `<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" outlineShapeIDRef="1" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0"><hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/><hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/><hp:visibility hideFirstHeader="0" hideFirstFooter="0" hideFirstMasterPage="0" border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/><hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/><hp:pagePr landscape="WIDELY" width="59528" height="84188" gutterType="LEFT_ONLY"><hp:margin header="4252" footer="4252" gutter="0" left="8504" right="8504" top="5668" bottom="4252"/></hp:pagePr>${notePr('footNotePr', 'EACH_COLUMN', -1)}${notePr('endNotePr', 'END_OF_DOCUMENT', 14692344)}${pbf('BOTH')}${pbf('EVEN')}${pbf('ODD')}</hp:secPr>`;
    put('Contents/section0.xml', XML_HEAD + `<hs:sec ${NSDECL}><hp:p id="0" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0">${secPr}<hp:ctrl><hp:colPr id="" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/></hp:ctrl></hp:run><hp:run charPrIDRef="0"><hp:t/></hp:run></hp:p></hs:sec>`);
    put('Preview/PrvText.txt', '');
    put('settings.xml', XML_HEAD + '<ha:HWPApplicationSetting xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"><ha:CaretPosition listIDRef="0" paraIDRef="0" pos="0"/></ha:HWPApplicationSetting>');
    put('META-INF/container.rdf', XML_HEAD + '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about=""><ns0:hasPart xmlns:ns0="http://www.hancom.co.kr/hwpml/2016/meta/pkg#" rdf:resource="Contents/header.xml"/></rdf:Description><rdf:Description rdf:about="Contents/header.xml"><rdf:type rdf:resource="http://www.hancom.co.kr/hwpml/2016/meta/pkg#HeaderFile"/></rdf:Description><rdf:Description rdf:about=""><ns0:hasPart xmlns:ns0="http://www.hancom.co.kr/hwpml/2016/meta/pkg#" rdf:resource="Contents/section0.xml"/></rdf:Description><rdf:Description rdf:about="Contents/section0.xml"><rdf:type rdf:resource="http://www.hancom.co.kr/hwpml/2016/meta/pkg#SectionFile"/></rdf:Description><rdf:Description rdf:about=""><rdf:type rdf:resource="http://www.hancom.co.kr/hwpml/2016/meta/pkg#Document"/></rdf:Description></rdf:RDF>');
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    put('Contents/content.hpf', XML_HEAD + `<opf:package ${NSDECL} version="" unique-identifier="" id=""><opf:metadata><opf:title/><opf:language>ko</opf:language><opf:meta name="creator" content="text">업무 공간</opf:meta><opf:meta name="subject" content="text"/><opf:meta name="description" content="text"/><opf:meta name="lastsaveby" content="text">업무 공간</opf:meta><opf:meta name="CreatedDate" content="text">${now}</opf:meta><opf:meta name="ModifiedDate" content="text">${now}</opf:meta><opf:meta name="date" content="text"/><opf:meta name="keyword" content="text"/></opf:metadata><opf:manifest><opf:item id="header" href="Contents/header.xml" media-type="application/xml"/><opf:item id="section0" href="Contents/section0.xml" media-type="application/xml"/><opf:item id="settings" href="settings.xml" media-type="application/xml"/></opf:manifest><opf:spine><opf:itemref idref="header" linear="yes"/><opf:itemref idref="section0" linear="yes"/></opf:spine></opf:package>`);
    put('META-INF/container.xml', XML_HEAD + '<ocf:container xmlns:ocf="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf"><ocf:rootfiles><ocf:rootfile full-path="Contents/content.hpf" media-type="application/hwpml-package+xml"/><ocf:rootfile full-path="Preview/PrvText.txt" media-type="text/plain"/><ocf:rootfile full-path="META-INF/container.rdf" media-type="application/rdf+xml"/></ocf:rootfiles></ocf:container>');
    put('META-INF/manifest.xml', XML_HEAD + '<odf:manifest xmlns:odf="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"/>');
    return files;
  }
}

/* 표의 실제 격자 위치 (병합 셀 고려) */
function tableGrid(t) {
  const pos = new Map(), occ = []; let cols = 0;
  Array.from(t.rows).forEach((row, r) => {
    occ[r] = occ[r] || []; let c = 0;
    for (const td of row.cells) {
      while (occ[r][c]) c++;
      pos.set(td, { r, c, rs: td.rowSpan || 1, cs: td.colSpan || 1 });
      for (let i = 0; i < (td.rowSpan || 1); i++) { occ[r + i] = occ[r + i] || []; for (let j = 0; j < (td.colSpan || 1); j++) occ[r + i][c + j] = td; }
      c += td.colSpan || 1; cols = Math.max(cols, c);
    }
  });
  const colW = new Array(cols).fill(0);
  for (const [td, p] of pos) if (p.cs === 1 && !colW[p.c]) colW[p.c] = +td.dataset.w || 0;
  for (const [td, p] of pos) if (p.cs > 1) { const known = colW.slice(p.c, p.c + p.cs).reduce((a, b) => a + b, 0), miss = colW.slice(p.c, p.c + p.cs).filter(v => !v).length; if (miss) for (let k = p.c; k < p.c + p.cs; k++) if (!colW[k]) colW[k] = Math.max(300, ((+td.dataset.w || 0) - known) / miss); }
  return { pos, occ, cols, rows: t.rows.length, colW };
}
