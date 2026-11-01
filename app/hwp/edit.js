/* 한글 작업장 — 편집 핵심 (쪽 나누기 표시, 글자/문단 모양 적용, 표, 되돌리기, 붙여넣기) */
const W = {
  doc: null, name: '', handle: null, boxId: null, draftId: null, dirty: false, zoom: 1, pages: [],
  cells: null,        // 셀 블록 (Set<td>)
  fmtCopy: null,      // 모양 복사 (Alt+C)
  uid: Math.random().toString(36).slice(2),
};
const $id = id => document.getElementById(id);
const GAP = 14; // 쪽 사이 간격(px)

/* ---------- 선택 도우미 ---------- */
function sel() { return window.getSelection(); }
function rng() { const s = sel(); return s.rangeCount ? s.getRangeAt(0) : null; }
function docEl() { return $id('doc'); }
function inDoc(n) { const d = docEl(); return !!(n && d && (n === d || d.contains(n))); }
function blockOf(n) { if (!n) return null; const e = n.nodeType === 1 ? n : n.parentElement; const b = e && e.closest('.hp'); return b && inDoc(b) ? b : null; }
function topOf(n) { let b = blockOf(n); while (b && !b.parentElement.classList.contains('hsec')) b = blockOf(b.parentElement); return b; }
function cellOf(n) { const e = n && (n.nodeType === 1 ? n : n.parentElement); const td = e && e.closest('td'); return td && inDoc(td) ? td : null; }
function hostOf(b) { return b.parentElement; } // .hsec 또는 td
function placeCaret(node, off) { const r = document.createRange(); r.setStart(node, off); r.collapse(true); const s = sel(); s.removeAllRanges(); s.addRange(r); focusFor(node); }
function focusFor(node) { const e = node.nodeType === 1 ? node : node.parentElement; const host = e.closest('td[contenteditable="true"]') || docEl(); if (document.activeElement !== host) host.focus({ preventScroll: true }); }
function caretToStart(b) {
  const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('.isl,table') && n.parentElement.closest('.isl,table') !== b ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const t = w.nextNode(); if (t) placeCaret(t, 0); else placeCaret(b, 0);
}
function caretToEnd(b) {
  let last = null; const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) if (!n.parentElement.closest('.isl') && blockOf(n) === b) last = n;
  if (last) placeCaret(last, last.length); else { const br = Array.from(b.childNodes).findIndex(x => x.nodeName === 'BR' && !x.dataset.lb); placeCaret(b, br >= 0 ? br : b.childNodes.length); }
}
/* 블록 안 글자 위치(문자 수)로 캐럿 저장/복원 */
function textNodesOf(b) { const out = []; const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (!n.parentElement.closest('.isl') && blockOf(n) === b) out.push(n); return out; }
function caretOffset(b, node, off) {
  const p = document.createRange(); try { p.setStart(node, off); } catch (e) { return 0; } p.collapse(true);
  let k = 0;
  for (const t of textNodesOf(b)) { if (t === node) return k + off; if (p.comparePoint(t, t.length) < 1) k += t.length; else break; }
  return k;
}
function setCaretOffset(b, k) {
  for (const t of textNodesOf(b)) { if (k <= t.length) { placeCaret(t, k); return; } k -= t.length; }
  caretToEnd(b);
}
function isEmptyBlock(b) { return !textNodesOf(b).some(t => t.nodeValue.replace(/​/g, '')) && !b.querySelector('.isl:not(.hid),table,br[data-lb]'); }
function ensureBr(b) { const last = b.lastChild; if (isEmptyBlock(b) && !(last && last.nodeName === 'BR' && !last.dataset.lb)) b.appendChild(document.createElement('br')); else if (last && last.nodeName === 'BR' && last.dataset.lb) b.appendChild(document.createElement('br')); }
function atBlockStart(b, r) {
  const t = document.createRange(); t.setStart(b, 0); t.setEnd(r.startContainer, r.startOffset);
  const f = t.cloneContents(); return !f.textContent.replace(/[​]/g, '') && !f.querySelector('.isl:not(.hid),table,br[data-lb]');
}
function atBlockEnd(b, r) {
  const t = document.createRange(); t.setStart(r.endContainer, r.endOffset); t.setEnd(b, b.childNodes.length);
  const f = t.cloneContents(); return !f.textContent.replace(/[​]/g, '') && !f.querySelector('.isl:not(.hid),table,br[data-lb]');
}
/* 캐럿 위치의 글자 모양 번호 */
function cpOfNode(n) { const e = n.nodeType === 1 ? n : n.parentElement; const s = e.closest('[data-cp]'); const b = blockOf(n); if (s && b && b.contains(s) && s !== b && !s.matches('table')) return s.dataset.cp; return b ? b.dataset.dcp || '0' : '0'; }
function cpAtCaret() {
  const r = rng(); if (!r || !inDoc(r.startContainer)) return '0';
  let n = r.startContainer, off = r.startOffset;
  if (n.nodeType === 3) return cpOfNode(n);
  const before = n.childNodes[off - 1], after = n.childNodes[off];
  const pick = x => { while (x && x.nodeType === 1 && x.lastChild && !x.classList.contains('isl')) x = x.lastChild; return x; };
  const x = pick(before) || after; return x ? cpOfNode(x) : cpOfNode(n);
}

/* ---------- 되돌리기 (블록 단위 스냅숏) ---------- */
const UNDO = { stack: [], redo: [], cur: null, bytes: 0 };
function pathOf(el) { const p = []; const root = docEl(); while (el && el !== root) { p.unshift(Array.prototype.indexOf.call(el.parentElement.children, el)); el = el.parentElement; } return p; }
function byPath(p) { let e = docEl(); for (const i of p) { e = e && e.children[i]; } return e; }
function blocksIn(host) { return Array.from(host.children).filter(x => x.classList.contains('hp')); }
/* host 의 [a, b] 블록을 바꾸기 전에 기록 */
function record(kind, first, last) {
  if (!first) return null;
  last = last || first;
  const host = hostOf(first);
  if (hostOf(last) !== host) {
    const a = topOf(first) || first, z = topOf(last) || last;
    if (a === first && z === last) return record(kind, first.closest('.hsec') || first, last.closest('.hsec') || last); // 서로 다른 구역
    return record(kind, a, z);
  }
  const kids = Array.from(host.children), i = kids.indexOf(first), j = kids.indexOf(last);
  const now = Date.now();
  const c = UNDO.cur;
  if (kind === 'type' && c && c.kind === 'type' && !c.open && c.i === i && j === i && c.n === 1 && now - c.t < 1500 && c.path.join() === pathOf(host).join() && c.afterTotal === host.children.length) { c.t = now; return c; }
  const r = rng(); const cb = r && blockOf(r.startContainer);
  const e = { kind, path: pathOf(host), i, n: j - i + 1, before: kids.slice(i, j + 1).map(x => x.outerHTML), totalBefore: kids.length, afterTotal: null, t: now, open: true,
    caret: cb && host.contains(cb) ? { bi: kids.indexOf(hostOf(cb) === host ? cb : topOf(cb)), path: pathOf(cb), off: caretOffset(cb, r.startContainer, r.startOffset) } : null };
  UNDO.stack.push(e); UNDO.redo.length = 0; UNDO.cur = e;
  UNDO.bytes += e.before.reduce((s, h) => s + h.length, 0);
  while (UNDO.stack.length > 200 || (UNDO.bytes > 60e6 && UNDO.stack.length > 5)) { const x = UNDO.stack.shift(); UNDO.bytes -= x.before.reduce((s, h) => s + h.length, 0); }
  return e;
}
function settle(e) { e = e || UNDO.cur; if (e && e.open) { const host = byPath(e.path); e.afterTotal = host ? host.children.length : e.totalBefore; e.open = false; } }
function restore(e, into) {
  const host = byPath(e.path); if (!host) return false;
  const nAfter = e.n + (e.afterTotal - e.totalBefore);
  const kids = Array.from(host.children);
  const cur = kids.slice(e.i, e.i + nAfter);
  const r = rng(); const cb = r && blockOf(r.startContainer);
  into.push({ kind: e.kind, path: e.path, i: e.i, n: nAfter, before: cur.map(x => x.outerHTML), totalBefore: kids.length, afterTotal: kids.length - nAfter + e.n, open: false, t: 0,
    caret: cb && host.contains(cb) ? { path: pathOf(cb), off: caretOffset(cb, r.startContainer, r.startOffset) } : null });
  const tpl = document.createElement('template'); tpl.innerHTML = e.before.join('');
  const ref = kids[e.i + nAfter] || null;
  cur.forEach(x => x.remove());
  host.insertBefore(tpl.content, ref);
  if (e.caret) { const b = byPath(e.caret.path); if (b && b.classList.contains('hp')) setCaretOffset(b, e.caret.off); else { const f = host.children[e.i]; if (f) caretToEnd(f); } }
  return true;
}
function undo() { settle(); const e = UNDO.stack.pop(); if (!e) { toast('되돌릴 작업이 없습니다'); return; } UNDO.cur = null; restore(e, UNDO.redo); changed(); }
function redo() { settle(); const e = UNDO.redo.pop(); if (!e) { toast('다시 실행할 작업이 없습니다'); return; } UNDO.cur = null; const keep = UNDO.redo.slice(); restore(e, UNDO.stack); UNDO.redo = keep; changed(); }
/* 블록 범위를 바꾸는 작업 감싸기 */
function edit(first, last, fn, kind) { const e = record(kind || 'op', first, last); const r = fn(); settle(e); UNDO.cur = null; changed(); return r; }

/* ---------- 변경 알림 · 쪽 나누기 ---------- */
let _layoutT = null, _draftT = null;
function changed(soft) {
  if (!soft) { W.dirty = true; if (window.onDocChanged) window.onDocChanged(); }
  clearTimeout(_layoutT); _layoutT = setTimeout(layout, 120);
}
function secPage(si) { return W.doc.page(si); }
function layout() {
  const d = docEl(); if (!d || !W.doc) return;
  const secs = Array.from(d.querySelectorAll(':scope > .hsec'));
  numbering();
  const pages = []; let pageTop = 0, maxW = 0;
  secs.forEach((sec, k) => {
    const si = +sec.dataset.s, pg = secPage(si);
    const PW = pg.w / HU, PH = pg.h / HU, mt = (pg.top + pg.header) / HU, mb = (pg.bottom + pg.footer) / HU;
    maxW = Math.max(maxW, PW);
    const st = sec.style; const set = (p, v) => { if (st[p] !== v) st[p] = v; };
    set('width', PW + 'px'); set('paddingLeft', ((pg.left + pg.gutter) / HU) + 'px'); set('paddingRight', (pg.right / HU) + 'px'); set('paddingTop', mt + 'px');
    if (k > 0) { pageTop += GAP; set('marginTop', GAP + 'px'); } else set('marginTop', '0px');
    const blocks = blocksIn(sec);
    const hs = blocks.map(b => b.offsetHeight);
    let top = pageTop, cTop = top + mt, cBot = top + PH - mb, y = cTop;
    const first = pages.length;
    pages.push({ top, w: PW, h: PH, si, pg });
    const next = () => { top += PH + GAP; cTop = top + mt; cBot = top + PH - mb; pages.push({ top, w: PW, h: PH, si, pg }); };
    blocks.forEach((b, i) => {
      const h = hs[i];
      let push = 0;
      const force = i > 0 && (b.dataset.pb === '1' || ppBreak(b.dataset.pp));
      if (force || (y + h > cBot + 0.5 && y > cTop + 0.5)) { next(); push = cTop - y; y = cTop; b.dataset.pgs = '1'; }
      else if (y < cTop - 0.5) { push = cTop - y; y = cTop; b.dataset.pgs = '1'; }
      else if (b.dataset.pgs) delete b.dataset.pgs;
      const mv = push ? push.toFixed(2) + 'px' : '';
      if (b.style.marginTop !== mv) b.style.marginTop = mv;
      y += h;
      while (y > cBot + 0.5) next();
    });
    const pb = Math.max(0, top + PH - y);
    set('paddingBottom', pb.toFixed(2) + 'px');
    pageTop = top + PH;
    for (let p = first; p < pages.length; p++) pages[p].secPage = p - first + 1;
  });
  W.pages = pages;
  drawPages(maxW, pageTop);
  if (window.onLayout) window.onLayout();
}
const _ppBreak = new Map();
function ppBreak(pp) { if (!_ppBreak.has(pp)) _ppBreak.set(pp, W.doc.header.pp(pp).pageBreakBefore); return _ppBreak.get(pp); }
function hfInfo() {
  const r = { header: null, footer: null, pageNum: null };
  for (const s of docEl().querySelectorAll('.isl[data-ctrl]')) {
    const k = s.dataset.ctrl; if (!/^(header|footer|pageNum)$/.test(k) || r[k]) continue;
    const isl = W.doc.islands[s.dataset.i]; const inner = isl && isl.el.firstElementChild; if (!inner) continue;
    if (k === 'pageNum') r.pageNum = { pos: inner.getAttribute('pos') || 'BOTTOM_CENTER', fmt: inner.getAttribute('formatType') || 'DIGIT', side: inner.getAttribute('sideChar') || '', el: inner };
    else {
      const ps = xdesc(inner, 'p'); const al = ps[0] ? W.doc.header.pp(ps[0].getAttribute('paraPrIDRef') || '0').align : 'LEFT';
      r[k] = { text: ps.map(p => xdesc(p, 't').map(t => t.textContent).join('')).join(' '), align: al, el: inner };
    }
  }
  return r;
}
function drawPages(maxW, total) {
  const box = $id('pages'), sheet = $id('sheet');
  const hf = hfInfo();
  const frag = document.createDocumentFragment();
  W.pages.forEach((p, i) => {
    const el = document.createElement('div'); el.className = 'page';
    el.style.cssText = `top:${p.top}px;width:${p.w}px;height:${p.h}px`;
    const pg = p.pg, n = i + 1;
    const ta = a => ({ CENTER: 'center', RIGHT: 'right' }[a] || 'left');
    if (hf.header && hf.header.text) { const h = document.createElement('div'); h.className = 'pg-hd'; h.style.cssText = `top:${pg.header / HU}px;left:${pg.left / HU}px;right:${pg.right / HU}px;text-align:${ta(hf.header.align)}`; h.textContent = hf.header.text; el.appendChild(h); }
    if (hf.footer && hf.footer.text) { const f = document.createElement('div'); f.className = 'pg-ft'; f.style.cssText = `bottom:${pg.footer / HU}px;left:${pg.left / HU}px;right:${pg.right / HU}px;text-align:${ta(hf.footer.align)}`; f.textContent = hf.footer.text; el.appendChild(f); }
    if (hf.pageNum && hf.pageNum.pos !== 'NONE') {
      const pn = document.createElement('div'); pn.className = 'pg-num';
      const pos = hf.pageNum.pos; const top = /^TOP/.test(pos);
      const al = /LEFT/.test(pos) ? 'left' : /RIGHT/.test(pos) ? 'right' : 'center';
      const s = (NUM_FMT[hf.pageNum.fmt] || NUM_FMT.DIGIT)(n);
      pn.textContent = hf.pageNum.side ? `${hf.pageNum.side} ${s} ${hf.pageNum.side}` : s;
      pn.style.cssText = `${top ? 'top' : 'bottom'}:${(top ? pg.header : pg.footer) / HU}px;left:${pg.left / HU}px;right:${pg.right / HU}px;text-align:${al}`;
      el.appendChild(pn);
    }
    const lab = document.createElement('div'); lab.className = 'pg-lab'; lab.textContent = n; el.appendChild(lab);
    frag.appendChild(el);
  });
  box.replaceChildren(frag);
  sheet.style.width = maxW + 'px'; sheet.style.height = total + 'px';
  applyZoom();
}
function applyZoom() {
  const sheet = $id('sheet'), wrap = $id('sheetWrap'); if (!sheet) return;
  const w = parseFloat(sheet.style.width) || 794, h = parseFloat(sheet.style.height) || 1123;
  sheet.style.transform = W.zoom === 1 ? '' : `scale(${W.zoom})`;
  wrap.style.width = (w * W.zoom) + 'px'; wrap.style.height = (h * W.zoom) + 'px';
}
function pageOfY(y) { let lo = 0, hi = W.pages.length - 1, ans = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (W.pages[m].top <= y) { ans = m; lo = m + 1; } else hi = m - 1; } return ans; }
function caretPage() {
  const r = rng(); if (!r || !inDoc(r.startContainer)) return 0;
  let rect = r.getClientRects()[0] || (blockOf(r.startContainer) || docEl()).getBoundingClientRect();
  const s = $id('sheet').getBoundingClientRect();
  return pageOfY((rect.top - s.top) / W.zoom);
}

/* ---------- 문단 번호 · 개요 번호 표시 ---------- */
function numbering() {
  const H = W.doc.header; const cnt = new Map();
  const outlineId = (() => { const sp = W.doc.secPr(0); return sp ? sp.getAttribute('outlineShapeIDRef') || '1' : '1'; })();
  for (const b of docEl().querySelectorAll('.hp')) {
    const h = H.headingInfo(b.dataset.pp);
    let txt = '';
    if (h) {
      if (h.type === 'BULLET') { const bu = H.bullet.get(h.idRef); txt = bu ? (bu.getAttribute('char') || '●') : '●'; }
      else {
        const nid = h.type === 'OUTLINE' ? outlineId : h.idRef;
        let c = cnt.get(nid); if (!c) { c = new Array(10).fill(0); cnt.set(nid, c); }
        const lv = Math.max(0, Math.min(9, h.level));
        const ph = H.paraHead(nid, lv);
        c[lv] = (c[lv] || 0) + 1; for (let k = lv + 1; k < 10; k++) c[k] = 0;
        if (ph) txt = (ph.textContent || '').replace(/\^(\d+)/g, (_, d) => { const L = +d - 1; const hh = H.paraHead(nid, L); const st = hh ? xint(hh, 'start', 1) : 1; const v = (c[L] || 0) + st - 1; return (NUM_FMT[hh ? hh.getAttribute('numFormat') : 'DIGIT'] || NUM_FMT.DIGIT)(Math.max(1, v)); });
        else txt = c[lv] + '.';
      }
    }
    if (txt) { if (b.dataset.num !== txt) b.dataset.num = txt; } else if (b.dataset.num != null) delete b.dataset.num;
  }
}

/* ---------- 모양 CSS ---------- */
function rebuildCss() { $id('docCss').textContent = W.doc.header.css(); _ppBreak.clear(); W.doc.header._hcache = null; }
function addRule(kind, id) { const s = $id('docCss').sheet; try { s.insertRule(W.doc.header.ruleFor(kind, id), s.cssRules.length); } catch (e) { $id('docCss').textContent += '\n' + W.doc.header.ruleFor(kind, id); } }

/* ---------- 글자 모양 적용 ---------- */
function textNodesInRange(r) {
  const out = []; const root = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentNode;
  if (r.startContainer.nodeType === 3 && r.startContainer === r.endContainer) return [r.startContainer];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (!r.intersectsNode(n) || n.parentElement.closest('.isl') || !blockOf(n)) continue;
    if (r.comparePoint(n, n.length) < 0 || r.comparePoint(n, 0) > 0) continue;
    if ((n === r.startContainer && r.startOffset >= n.length) || (n === r.endContainer && r.endOffset === 0)) continue;
    out.push(n);
  }
  return out;
}
function splitBoundaries(r) {
  let { startContainer: sc, startOffset: so, endContainer: ec, endOffset: eo } = r;
  if (ec.nodeType === 3 && eo > 0 && eo < ec.length) ec.splitText(eo);
  if (sc.nodeType === 3 && so > 0 && so < sc.length) { const n = sc.splitText(so); if (sc === ec) { ec = n; eo = eo - so; } sc = n; so = 0; }
  const nr = document.createRange(); nr.setStart(sc, so); nr.setEnd(ec, ec.nodeType === 3 ? Math.min(eo, ec.length) : eo); return nr;
}
function setNodeCp(t, cp) {
  const p = t.parentElement;
  if (p.tagName === 'SPAN' && p.dataset.cp != null && !p.classList.contains('isl')) {
    if (p.childNodes.length === 1) { p.dataset.cp = cp; p.className = 'cp-' + cp; return; }
    const right = p.cloneNode(false); let x = t.nextSibling; while (x) { const nx = x.nextSibling; right.appendChild(x); x = nx; }
    const mid = p.cloneNode(false); mid.dataset.cp = cp; mid.className = 'cp-' + cp;
    p.after(mid); mid.appendChild(t); if (right.firstChild) mid.after(right);
    if (!p.firstChild) p.remove();
    return;
  }
  const s = document.createElement('span'); s.className = 'cp-' + cp; s.dataset.cp = cp; t.before(s); s.appendChild(t);
}
function mergeSpans(b) {
  for (const s of Array.from(b.querySelectorAll('span[data-cp]:not(.isl)'))) {
    if (blockOf(s) !== b) continue;
    if (!s.textContent) { if (!s.querySelector('*')) s.remove(); continue; }
    const n = s.nextSibling;
    if (n && n.nodeType === 1 && n.tagName === 'SPAN' && !n.classList.contains('isl') && n.dataset.cp === s.dataset.cp) { while (n.firstChild) s.appendChild(n.firstChild); n.remove(); }
  }
  b.normalize();
}
/* 선택 영역(또는 셀 블록) 의 글자 모양 번호를 fn(cp) 로 바꿈 */
function mapCp(fn) {
  const cache = new Map(); const f = cp => { if (!cache.has(cp)) cache.set(cp, String(fn(cp))); return cache.get(cp); };
  if (W.cells && W.cells.size) {
    const tds = Array.from(W.cells), t = tds[0].closest('table'), top = topOf(t);
    edit(top, top, () => { for (const td of tds) applyCpIn(td, f); });
    return;
  }
  const r = rng(); if (!r || !inDoc(r.startContainer)) return;
  if (r.collapsed) {
    const cp = f(cpAtCaret()); const b = blockOf(r.startContainer); if (!b) return;
    if (isEmptyBlock(b)) { record('type', b); b.dataset.dcp = cp; b.className = b.className.replace(/\bcp-\S+/, 'cp-' + cp); settle(); }
    const s = document.createElement('span'); s.className = 'cp-' + cp; s.dataset.cp = cp; s.textContent = '​';
    let n = r.startContainer;
    if (n.nodeType === 3) { const t = n.splitText(r.startOffset); const p = n.parentElement; if (p.tagName === 'SPAN' && p.dataset.cp != null && !p.classList.contains('isl')) { const right = p.cloneNode(false); let x = t; while (x) { const nx = x.nextSibling; right.appendChild(x); x = nx; } p.after(right); p.after(s); } else t.before(s); }
    else { const ref = n.childNodes[r.startOffset] || null; if (n.classList && n.classList.contains('hp')) n.insertBefore(s, ref); else if (n.tagName === 'SPAN') n.after(s); else n.insertBefore(s, ref); }
    placeCaret(s.firstChild, 1); changed(); return;
  }
  const b1 = blockOf(r.startContainer), b2 = blockOf(r.endContainer); if (!b1 || !b2) return;
  edit(b1, b2, () => {
    const nr = splitBoundaries(r);
    const nodes = textNodesInRange(nr).filter(t => t.length);
    const isl = Array.from(document.querySelectorAll('#doc .isl[data-cp]:not(.hid)')).filter(x => nr.intersectsNode(x));
    const blocks = new Set();
    for (const t of nodes) { blocks.add(blockOf(t)); setNodeCp(t, f(cpOfNode(t))); }
    for (const x of isl) { const cp = f(x.dataset.cp); x.dataset.cp = cp; if (/\bcp-\S+/.test(x.className)) x.className = x.className.replace(/\bcp-\S+/, 'cp-' + cp); blocks.add(blockOf(x)); }
    // 비어 있는 문단도 선택 안에 있으면 기본 모양 바꿈
    let b = b1; while (b) { if (isEmptyBlock(b)) { const cp = f(b.dataset.dcp || '0'); b.dataset.dcp = cp; b.className = b.className.replace(/\bcp-\S+/, 'cp-' + cp); } if (b === b2) break; b = b.nextElementSibling; if (b && !b.classList.contains('hp')) break; }
    for (const bb of blocks) if (bb) mergeSpans(bb);
    if (nodes.length) { const s = sel(); const rr = document.createRange(); const a = nodes[0], z = nodes[nodes.length - 1]; if (a.isConnected && z.isConnected) { rr.setStart(a, 0); rr.setEnd(z, z.length); s.removeAllRanges(); s.addRange(rr); } }
  });
}
function applyCpIn(container, f) {
  const nodes = []; const w = document.createTreeWalker(container, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) if (!n.parentElement.closest('.isl') && n.length) nodes.push(n);
  const blocks = new Set();
  for (const t of nodes) { blocks.add(blockOf(t)); setNodeCp(t, f(cpOfNode(t))); }
  for (const b of container.querySelectorAll('.hp')) { const cp = f(b.dataset.dcp || '0'); b.dataset.dcp = cp; b.className = b.className.replace(/\bcp-\S+/, 'cp-' + cp); blocks.add(b); }
  for (const b of blocks) if (b) mergeSpans(b);
}
function applyCp(mods) { mapCp(cp => W.doc.header.deriveCp(cp, mods)); }
function toggleCp(prop) {
  const c = W.doc.header.cp(selCp());
  if (prop === 'bold') applyCp({ bold: !c.bold });
  else if (prop === 'italic') applyCp({ italic: !c.italic });
  else if (prop === 'underline') applyCp({ underline: c.underline ? '' : 'BOTTOM' });
  else if (prop === 'strike') applyCp({ strike: !c.strike });
  else if (prop === 'sup') applyCp({ script: c.sup ? 'none' : 'sup' });
  else if (prop === 'sub') applyCp({ script: c.sub ? 'none' : 'sub' });
}
function selCp() {
  if (W.cells && W.cells.size) { const td = W.cells.values().next().value; const b = td.querySelector('.hp'); if (!b) return '0'; const t = textNodesOf(b)[0]; return t ? cpOfNode(t) : b.dataset.dcp || '0'; }
  const r = rng(); if (!r || !inDoc(r.startContainer)) return '0';
  if (!r.collapsed) { const ns = textNodesInRange(r).filter(t => t.nodeValue.replace(/​/g, '')); if (ns.length) { const t = ns[0]; return cpOfNode(t); } }
  return cpAtCaret();
}
function stepCp(fn) { mapCp(cp => { const c = W.doc.header.cp(cp); return W.doc.header.deriveCp(cp, fn(c)); }); }

/* ---------- 문단 모양 적용 ---------- */
function selBlocks() {
  if (W.cells && W.cells.size) { const out = []; for (const td of W.cells) out.push(...td.querySelectorAll('.hp')); return out; }
  const r = rng(); if (!r || !inDoc(r.startContainer)) return [];
  const b1 = blockOf(r.startContainer), b2 = blockOf(r.endContainer); if (!b1) return [];
  if (b1 === b2 || hostOf(b1) !== hostOf(b2 || b1)) return [b1];
  const out = []; let b = b1; while (b) { if (b.classList.contains('hp')) out.push(b); if (b === b2) break; b = b.nextElementSibling; }
  return out;
}
function mapPp(fn) {
  const bs = selBlocks(); if (!bs.length) return;
  const first = bs[0], last = bs[bs.length - 1];
  const doIt = () => { const cache = new Map(); for (const b of bs) { const pp = b.dataset.pp || '0'; if (!cache.has(pp)) cache.set(pp, String(fn(pp))); const np = cache.get(pp); b.dataset.pp = np; b.className = b.className.replace(/\bpp-\S+/, 'pp-' + np); } };
  if (hostOf(first) === hostOf(last)) edit(first, last, doIt); else { const t = topOf(first); edit(t, topOf(last), doIt); }
}
function applyPp(mods) { mapPp(pp => W.doc.header.derivePp(pp, mods)); }
function stepPp(fn) { mapPp(pp => W.doc.header.derivePp(pp, fn(W.doc.header.pp(pp)))); }
function selPp() { const bs = selBlocks(); return bs.length ? bs[0].dataset.pp || '0' : '0'; }
function applyStyle(sid) {
  const st = W.doc.header.styles.find(s => s.id === String(sid)); if (!st) return;
  const bs = selBlocks(); if (!bs.length) return;
  const first = bs[0], last = bs[bs.length - 1];
  const doIt = () => {
    for (const b of bs) {
      b.dataset.st = st.id; b.dataset.pp = st.pp; b.dataset.dcp = st.cp; b.className = `hp pp-${st.pp} cp-${st.cp}`;
      if (st.type !== 'CHAR') for (const s of b.querySelectorAll('span[data-cp]')) if (blockOf(s) === b) { s.dataset.cp = st.cp; if (!s.classList.contains('isl')) s.className = 'cp-' + st.cp; else if (/\bcp-\S+/.test(s.className)) s.className = s.className.replace(/\bcp-\S+/, 'cp-' + st.cp); }
      mergeSpans(b);
    }
  };
  if (hostOf(first) === hostOf(last)) edit(first, last, doIt); else edit(topOf(first), topOf(last), doIt);
}

/* ---------- 문단 나누기 · 합치기 · 지우기 ---------- */
function splitBlock(opts) {
  opts = opts || {};
  let r = rng(); if (!r) return;
  if (!r.collapsed) { deleteSelection(true); r = rng(); }
  const b = blockOf(r.startContainer); if (!b) return;
  edit(b, b, () => {
    const cp = cpAtCaret();
    const tail = document.createRange(); tail.setStart(r.startContainer, r.startOffset); tail.setEnd(b, b.childNodes.length);
    const frag = tail.extractContents();
    const nb = b.cloneNode(false); nb.removeAttribute('data-k'); nb.removeAttribute('style'); delete nb.dataset.pgs; delete nb.dataset.num;
    if (!opts.keepBreak) delete nb.dataset.pb;
    nb.appendChild(frag);
    // 문단 맨 앞에서 나눠도 조판 부호(구역 설정 등)는 원래 문단에 남김
    const keepC = []; for (let x = nb.firstChild; x && x.nodeType === 1 && x.classList.contains('hid'); x = x.nextSibling) keepC.push(x);
    for (let i = keepC.length - 1; i >= 0; i--) b.insertBefore(keepC[i], b.firstChild);
    // 빈 span 정리
    for (const x of [b, nb]) for (const s of Array.from(x.querySelectorAll('span[data-cp]:not(.isl)'))) if (!s.textContent && !s.querySelector('*')) s.remove();
    const nbText = !isEmptyBlock(nb);
    if (!nbText) { nb.dataset.dcp = cp; nb.className = nb.className.replace(/\bcp-\S+/, 'cp-' + cp); }
    // 다음 스타일
    if (!nbText) { const st = W.doc.header.styles.find(s => s.id === b.dataset.st); if (st && st.next && st.next !== st.id) { const ns = W.doc.header.styles.find(s => s.id === st.next); if (ns) { nb.dataset.st = ns.id; nb.dataset.pp = ns.pp; nb.className = nb.className.replace(/\bpp-\S+/, 'pp-' + ns.pp); } } }
    for (const x of [b, nb]) { const brs = Array.from(x.childNodes).filter(n => n.nodeName === 'BR' && !n.dataset.lb); brs.forEach(n => { if (n !== x.lastChild) n.remove(); }); ensureBr(x); }
    if (opts.pageBreak) nb.dataset.pb = '1';
    b.after(nb);
    caretToStart(nb);
  });
}
function mergeInto(a, b) { // b 를 a 뒤에 붙임
  const last = a.lastChild; if (last && last.nodeName === 'BR' && !last.dataset.lb) last.remove();
  const mark = document.createTextNode(''); a.appendChild(mark);
  for (const n of Array.from(b.childNodes)) { if (n.nodeName === 'BR' && !n.dataset.lb && n === b.lastChild) continue; a.appendChild(n); }
  b.remove(); mergeSpans(a); ensureBr(a);
  return mark;
}
function joinBackward(b) {
  const prev = b.previousElementSibling;
  if (!prev || !prev.classList.contains('hp')) { if (isEmptyBlock(b) && b.nextElementSibling && hostOf(b).classList.contains('hsec') && !b.querySelector('.isl')) { const nx = b.nextElementSibling; edit(b, nx, () => { b.remove(); caretToStart(nx); }); } return; }
  if (isEmptyBlock(prev) && !prev.querySelector('.isl')) { edit(prev, b, () => { prev.remove(); caretToStart(b); }); return; }
  const k = textNodesOf(prev).reduce((s, t) => s + t.length, 0);
  edit(prev, b, () => { mergeInto(prev, b); setCaretOffset(prev, k); });
}
function joinForward(b) {
  const next = b.nextElementSibling; if (!next || !next.classList.contains('hp')) return;
  const k = textNodesOf(b).reduce((s, t) => s + t.length, 0);
  if (isEmptyBlock(b) && !b.querySelector('.isl')) { edit(b, next, () => { b.remove(); caretToStart(next); }); return; }
  edit(b, next, () => { mergeInto(b, next); setCaretOffset(b, k); });
}
function deleteSelection(noRecord) {
  const r = rng(); if (!r || r.collapsed) return;
  const b1 = blockOf(r.startContainer), b2 = blockOf(r.endContainer); if (!b1 || !b2) return;
  // 지워지는 범위 안의 조판 부호(구역 설정·머리말·쪽 번호·필드 등)는 보존 (표 안 것은 표와 함께)
  const hidden = Array.from(docEl().querySelectorAll('.isl.hid')).filter(x => r.intersectsNode(x) && !x.parentElement.closest('table'));
  const putBack = () => { if (!hidden.length || !b1.isConnected) return; let ref = b1.firstChild; while (ref && ref.nodeType === 1 && ref.classList.contains('hid')) ref = ref.nextSibling; for (const x of hidden) if (!x.isConnected) b1.insertBefore(x, ref); };
  const run = () => { run0(); putBack(); };
  const run0 = () => {
    if (b1 === b2) { r.deleteContents(); mergeSpans(b1); ensureBr(b1); const rr = rng(); if (!rr || !b1.contains(rr.startContainer)) caretToEnd(b1); return; }
    if (hostOf(b1) !== hostOf(b2)) { sel().collapseToStart(); return; }
    const k = caretOffset(b1, r.startContainer, r.startOffset);
    r.deleteContents();
    if (b2.isConnected && b1.isConnected) mergeInto(b1, b2);
    if (b1.isConnected) { mergeSpans(b1); ensureBr(b1); setCaretOffset(b1, k); }
  };
  if (noRecord) { const e = record('op', b1, hostOf(b1) === hostOf(b2) ? b2 : b1); run(); settle(e); UNDO.cur = null; changed(); }
  else edit(b1, hostOf(b1) === hostOf(b2) ? b2 : b1, run);
}
function insertText(text) {
  let r = rng(); if (!r) return;
  if (!r.collapsed) { deleteSelection(true); r = rng(); }
  const b = blockOf(r.startContainer); if (!b) return;
  record('type', b);
  let n = r.startContainer, off = r.startOffset;
  if (n.nodeType === 3) { n.insertData(off, text); placeCaret(n, off + text.length); }
  else {
    const t = document.createTextNode(text); const ref = n.childNodes[off] || null;
    if (ref && ref.nodeName === 'BR' && !ref.dataset.lb && ref === b.lastChild && n === b) { const cp = b.dataset.dcp; const s = document.createElement('span'); s.className = 'cp-' + cp; s.dataset.cp = cp; s.appendChild(t); b.insertBefore(s, ref); ref.remove(); }
    else n.insertBefore(t, ref);
    placeCaret(t, text.length);
  }
  settle(); changed();
}
function insertNode(node, kind) {
  let r = rng(); if (!r) return;
  if (!r.collapsed) { deleteSelection(true); r = rng(); }
  const b = blockOf(r.startContainer); if (!b) return;
  edit(b, b, () => {
    r.insertNode(node);
    const p = node.parentNode;
    if (p.tagName === 'SPAN' && node.classList && node.classList.contains('isl')) { // 섬은 span 밖으로
      const right = p.cloneNode(false); let x = node.nextSibling; while (x) { const nx = x.nextSibling; right.appendChild(x); x = nx; }
      p.after(node); if (right.firstChild) node.after(right);
    }
    if (!node.nextSibling && node.parentNode === b) b.appendChild(document.createElement('br'));
    ensureBr(b);
    const q = node.parentNode; placeCaret(q, Array.prototype.indexOf.call(q.childNodes, node) + 1);
  }, kind);
}
function insertLineBreak() { const br = document.createElement('br'); br.dataset.lb = '1'; insertNode(br); }
function insertTab() { const el = W.doc.newTab(); const s = W.doc.islandHtml(el, cpAtCaret(), true); insertNode(s); }
function deleteVisualLine(toEnd) {
  const s = sel(); if (!s.rangeCount) return;
  if (!toEnd) s.modify('move', 'backward', 'lineboundary');
  s.modify('extend', 'forward', 'lineboundary');
  if (sel().isCollapsed) { const b = blockOf(s.anchorNode); if (b) joinForward(b); return; }
  deleteSelection();
}

/* 입력 직후 정리: 크롬이 끼워 넣는 서식 태그·인라인 스타일 제거 */
function tidy(b) {
  if (!b) return;
  for (const e of Array.from(b.querySelectorAll('b,i,u,strike,s,font,em,strong,sup,sub,span:not([data-cp]):not(.isl),div:not(.hp)'))) {
    if (blockOf(e) !== b) continue;
    const p = e.parentNode; while (e.firstChild) p.insertBefore(e.firstChild, e); e.remove();
  }
  for (const s of b.querySelectorAll('span[data-cp][style]:not(.isl)')) s.removeAttribute('style');
  ensureBr(b);
}

/* ---------- 표 ---------- */
function newCellLike(td, h) {
  const n = td.cloneNode(false); n.removeAttribute('rowspan'); n.removeAttribute('colspan'); n.classList.remove('csel');
  if (h != null) { n.dataset.h = h; n.style.height = (h / HU).toFixed(1) + 'px'; }
  const p0 = td.querySelector('.hp');
  n.appendChild(W.doc.newParaHtml(p0 ? p0.dataset.pp : '0', p0 ? p0.dataset.st : '0', p0 ? p0.dataset.dcp : '0'));
  return n;
}
function refreshCols(t) {
  const g = tableGrid(t); let cg = t.querySelector('colgroup');
  if (!cg) { cg = document.createElement('colgroup'); t.insertBefore(cg, t.firstChild); }
  cg.replaceChildren(...g.colW.map(w => { const c = document.createElement('col'); c.style.width = ((w || 3000) / HU).toFixed(1) + 'px'; return c; }));
  t.style.width = (g.colW.reduce((a, b) => a + (b || 3000), 0) / HU).toFixed(1) + 'px';
}
function tableOp(td, fn) { const t = td.closest('table.htb'); const top = topOf(t); return edit(top, top, () => { const r = fn(t, tableGrid(t)); if (t.isConnected) refreshCols(t); return r; }); }
function rowHeight(g, r) { let h = 0; for (const [td, p] of g.pos) if (p.r === r && p.rs === 1) h = Math.max(h, +td.dataset.h || 0); return h || 1800; }
function insertRow(td, below) {
  tableOp(td, (t, g) => {
    const p = g.pos.get(td); const ref = below ? p.r + p.rs - 1 : p.r; const at = below ? ref + 1 : ref;
    const tr = document.createElement('tr'); const done = new Set(); let c = 0;
    while (c < g.cols) {
      const cell = g.occ[ref][c]; const cp = g.pos.get(cell);
      const spans = below ? cp.r + cp.rs - 1 > ref : cp.r < ref;
      if (spans) { if (!done.has(cell)) { cell.rowSpan = cp.rs + 1; cell.dataset.h = (+cell.dataset.h || 0) + rowHeight(g, ref); done.add(cell); } c += cp.cs; continue; }
      const n = newCellLike(cell, rowHeight(g, ref)); if (cp.cs > 1) n.colSpan = cp.cs; tr.appendChild(n); c += cp.cs;
    }
    const atRow = t.rows[at] || null; (atRow ? atRow.parentNode : t.tBodies[0] || t).insertBefore(tr, atRow);
    const first = tr.cells[0]; if (first) caretToStart(first.querySelector('.hp'));
  });
}
function insertCol(td, right) {
  tableOp(td, (t, g) => {
    const p = g.pos.get(td); const ref = right ? p.c + p.cs - 1 : p.c;
    const nw = g.colW[ref] || 3000; const total = g.colW.reduce((a, b) => a + b, 0);
    const done = new Set();
    for (let r = 0; r < g.rows; r++) {
      const cell = g.occ[r][ref]; if (!cell || done.has(cell)) continue; done.add(cell);
      const cp = g.pos.get(cell);
      const spans = right ? cp.c + cp.cs - 1 > ref : cp.c < ref;
      if (spans) { cell.colSpan = cp.cs + 1; cell.dataset.w = (+cell.dataset.w || 0) + nw; continue; }
      const n = newCellLike(cell); n.dataset.w = nw; if (cp.rs > 1) n.rowSpan = cp.rs;
      if (right) cell.after(n); else cell.before(n);
    }
    // 표 전체 너비는 그대로: 모든 셀 너비를 비율로 줄임
    const k = total / (total + nw);
    for (const c of t.querySelectorAll('td')) if (c.closest('table') === t) c.dataset.w = Math.round((+c.dataset.w || 0) * k);
  });
}
function deleteRow(td) {
  const t = td.closest('table.htb');
  if (t.rows.length <= 1) { deleteTable(t); return; }
  tableOp(td, (t, g) => {
    const r = g.pos.get(td).r; const row = t.rows[r]; const rh = rowHeight(g, r);
    for (const [cell, p] of g.pos) {
      if (p.r < r && p.r + p.rs - 1 >= r) { cell.rowSpan = p.rs - 1; cell.dataset.h = Math.max(300, (+cell.dataset.h || 0) - rh); }
      else if (p.r === r && p.rs > 1) {
        const nextRow = t.rows[r + 1]; cell.rowSpan = p.rs - 1; cell.dataset.h = Math.max(300, (+cell.dataset.h || 0) - rh);
        const before = Array.from(nextRow.cells).find(x => g.pos.get(x).c > p.c) || null; nextRow.insertBefore(cell, before);
      }
    }
    row.remove();
    const nr = t.rows[Math.min(r, t.rows.length - 1)]; if (nr && nr.cells[0]) caretToStart(nr.cells[0].querySelector('.hp'));
  });
}
function deleteCol(td) {
  const t = td.closest('table.htb'); const g0 = tableGrid(t);
  if (g0.cols <= 1) { deleteTable(t); return; }
  tableOp(td, (t, g) => {
    const c = g.pos.get(td).c; const w = g.colW[c] || 0; const done = new Set();
    for (let r = 0; r < g.rows; r++) { const cell = g.occ[r][c]; if (!cell || done.has(cell)) continue; done.add(cell); const p = g.pos.get(cell); if (p.cs > 1) { cell.colSpan = p.cs - 1; cell.dataset.w = Math.max(300, (+cell.dataset.w || 0) - w); } else cell.remove(); }
    fixEmptyRows(t);
    const any = t.querySelector('td'); if (any) caretToStart(any.querySelector('.hp'));
  });
}
function deleteTable(t) {
  const b = blockOf(t); if (!b) return;
  edit(b, b, () => { t.remove(); ensureBr(b); caretToStart(b); });
  clearCells();
}
function cellRect(cells) {
  const t = cells[0].closest('table'); const g = tableGrid(t);
  let r0 = 1e9, c0 = 1e9, r1 = -1, c1 = -1;
  for (const td of cells) { const p = g.pos.get(td); r0 = Math.min(r0, p.r); c0 = Math.min(c0, p.c); r1 = Math.max(r1, p.r + p.rs - 1); c1 = Math.max(c1, p.c + p.cs - 1); }
  // 직사각형 안에 걸친 병합 셀까지 넓힘
  let grow = true;
  while (grow) { grow = false; for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const td = g.occ[r][c]; const p = g.pos.get(td); if (p.r < r0) { r0 = p.r; grow = true; } if (p.c < c0) { c0 = p.c; grow = true; } if (p.r + p.rs - 1 > r1) { r1 = p.r + p.rs - 1; grow = true; } if (p.c + p.cs - 1 > c1) { c1 = p.c + p.cs - 1; grow = true; } } }
  const set = new Set(); for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set.add(g.occ[r][c]);
  return { t, g, r0, c0, r1, c1, cells: Array.from(set) };
}
/* 셀이 하나도 없는 줄은 지우고, 그 줄을 덮던 세로 병합을 한 칸 줄임 */
function fixEmptyRows(t) {
  for (;;) {
    const tr = Array.from(t.rows).find(x => !x.cells.length); if (!tr) return;
    const ri = Array.prototype.indexOf.call(t.rows, tr); const g = tableGrid(t);
    for (const [td, p] of g.pos) if (p.r < ri && p.r + p.rs - 1 >= ri) td.rowSpan = Math.max(1, p.rs - 1);
    tr.remove();
  }
}
function mergeCells(cells) {
  if (!cells || cells.length < 2) { toast('합칠 셀을 두 개 이상 블록으로 잡으세요 (F5 또는 마우스로 끌기)'); return; }
  const td0 = cells[0];
  tableOp(td0, () => {
    const R = cellRect(cells); const keep = R.g.occ[R.r0][R.c0];
    for (const td of R.cells) { if (td === keep) continue; for (const p of Array.from(td.querySelectorAll(':scope > .hp'))) if (!isEmptyBlock(p)) keep.appendChild(p); td.remove(); }
    const blocks = Array.from(keep.querySelectorAll(':scope > .hp')); if (blocks.length > 1 && isEmptyBlock(blocks[0])) blocks[0].remove();
    keep.colSpan = R.c1 - R.c0 + 1; keep.rowSpan = R.r1 - R.r0 + 1;
    keep.dataset.w = Math.round(R.g.colW.slice(R.c0, R.c1 + 1).reduce((a, b) => a + b, 0));
    let h = 0; for (let r = R.r0; r <= R.r1; r++) h += rowHeight(R.g, r); keep.dataset.h = h; keep.style.height = (h / HU).toFixed(1) + 'px';
    fixEmptyRows(R.t);
    clearCells(); caretToStart(keep.querySelector('.hp'));
  });
}
function splitCell(td) {
  if ((td.colSpan || 1) === 1 && (td.rowSpan || 1) === 1) { // 병합되지 않은 셀은 두 칸으로 나눔
    tableOp(td, (t, g) => {
      const p = g.pos.get(td); const w = Math.round((+td.dataset.w || 3000) / 2);
      const done = new Set();
      for (let r = 0; r < g.rows; r++) { const cell = g.occ[r][p.c]; if (!cell || done.has(cell) || cell === td) continue; done.add(cell); cell.colSpan = (cell.colSpan || 1) + 1; }
      td.dataset.w = w; const n = newCellLike(td); n.dataset.w = w; td.after(n);
    });
    return;
  }
  tableOp(td, (t, g) => {
    const p = g.pos.get(td);
    const rh = []; for (let r = p.r; r < p.r + p.rs; r++) rh.push(rowHeight(g, r));
    td.colSpan = 1; td.rowSpan = 1; td.dataset.w = Math.round(g.colW[p.c] || 3000); td.dataset.h = rh[0]; td.style.height = (rh[0] / HU).toFixed(1) + 'px';
    for (let r = p.r; r < p.r + p.rs; r++) {
      const row = t.rows[r];
      for (let c = p.c; c < p.c + p.cs; c++) {
        if (r === p.r && c === p.c) continue;
        const n = newCellLike(td, rh[r - p.r]); n.dataset.w = Math.round(g.colW[c] || 3000);
        const before = Array.from(row.cells).find(x => g.pos.has(x) && g.pos.get(x).c > c && x !== td) || null;
        if (r === p.r) { const after = Array.from(row.cells).filter(x => x === td || (g.pos.has(x) && g.pos.get(x).c < c) || (!g.pos.has(x))).pop(); after.after(n); }
        else row.insertBefore(n, before);
      }
    }
  });
}
function equalizeCells(cells, what) {
  if (!cells || !cells.length) return;
  tableOp(cells[0], (t, g) => {
    if (what === 'w') { const R = cellRect(cells); const tot = R.g.colW.slice(R.c0, R.c1 + 1).reduce((a, b) => a + b, 0); const each = tot / (R.c1 - R.c0 + 1); for (const td of R.cells) { const p = R.g.pos.get(td); td.dataset.w = Math.round(each * p.cs); } }
    else { const R = cellRect(cells); let tot = 0; for (let r = R.r0; r <= R.r1; r++) tot += rowHeight(R.g, r); const each = tot / (R.r1 - R.r0 + 1); for (const td of R.cells) { const p = R.g.pos.get(td); td.dataset.h = Math.round(each * p.rs); td.style.height = (each * p.rs / HU).toFixed(1) + 'px'; } }
  });
}
function resizeCells(cells, dw, dh) {
  tableOp(cells[0], (t, g) => {
    const R = cellRect(cells);
    if (dw) { const c = R.c1; for (const [td, p] of R.g.pos) if (p.c + p.cs - 1 === c) td.dataset.w = Math.max(300, (+td.dataset.w || 0) + dw); }
    if (dh) for (let r = R.r0; r <= R.r1; r++) for (const [td, p] of R.g.pos) if (p.r + p.rs - 1 === r && p.r >= R.r0) { td.dataset.h = Math.max(300, (+td.dataset.h || 0) + dh); td.style.height = (+td.dataset.h / HU).toFixed(1) + 'px'; }
  });
}
function cellFill(cells, color) {
  if (!cells.length) return;
  tableOp(cells[0], () => { for (const td of cells) { const bf = W.doc.header.deriveBf(td.dataset.bf || '1', { fill: color }); td.dataset.bf = bf; td.className = 'bf-' + bf + (td.classList.contains('csel') ? ' csel' : ''); } });
}
function cellBorder(cells, type, sides) {
  if (!cells.length) return;
  tableOp(cells[0], () => { for (const td of cells) { const bf = W.doc.header.deriveBf(td.dataset.bf || '1', { sides: sides || ['left', 'right', 'top', 'bottom'], type: type, width: type === 'NONE' ? '0.1 mm' : '0.12 mm' }); td.dataset.bf = bf; td.className = 'bf-' + bf + (td.classList.contains('csel') ? ' csel' : ''); } });
}
function cellAlign(cells, va) { if (!cells.length) return; tableOp(cells[0], () => { for (const td of cells) td.style.verticalAlign = va; }); }
function insertTable(rows, cols) {
  const r = rng(); const b = r && blockOf(r.startContainer); if (!b) { toast('표를 넣을 곳을 먼저 클릭하세요'); return; }
  const host = hostOf(b);
  const pg = W.doc.page(+(b.closest('.hsec') || { dataset: { s: 0 } }).dataset.s);
  const cw = host.tagName === 'TD' ? Math.max(3000, (+host.dataset.w || 20000) - 1200) : pg.w - pg.left - pg.right - pg.gutter - 600;
  const cp = cpAtCaret();
  const el = W.doc.newTableXml(rows, cols, cw, cp);
  const t = W.doc.tableHtml(el, cp);
  edit(b, b, () => {
    let target = b;
    if (!isEmptyBlock(b)) { const nb = W.doc.newParaHtml(b.dataset.pp, b.dataset.st, cp); nb.dataset.pp = b.dataset.pp; b.after(nb); target = nb; }
    target.replaceChildren(...target.querySelectorAll(':scope > .isl.hid'), t); // 구역 설정·머리말 같은 조판 부호는 남김
    const after = W.doc.newParaHtml(target.dataset.pp, target.dataset.st, cp); target.after(after);
    caretToStart(t.rows[0].cells[0].querySelector('.hp'));
  });
}
function tableFromRows(rows) {
  rows = rows.filter(r => r.some(c => c.trim() !== '') || rows.length === 1);
  if (!rows.length) return;
  const cols = Math.max(...rows.map(r => r.length));
  insertTable(rows.length, cols);
  const td = cellOf(rng().startContainer); if (!td) return;
  fillCells(td, rows);
}
function fillCells(td, rows) {
  tableOp(td, (t, g) => {
    const p = g.pos.get(td);
    while (t.rows.length < p.r + rows.length) { // 마지막 줄의 격자(세로 병합 포함)를 따라 새 줄을 만듦
      const g1 = tableGrid(t), lr = g1.rows - 1, tr = document.createElement('tr');
      for (let c = 0; c < g1.cols;) { const cell = g1.occ[lr][c]; const q = g1.pos.get(cell); const n = newCellLike(cell, rowHeight(g1, lr)); if (q.cs > 1) n.colSpan = q.cs; n.dataset.w = Math.round(g1.colW.slice(c, c + q.cs).reduce((a, b) => a + b, 0)); tr.appendChild(n); c += q.cs; }
      t.rows[t.rows.length - 1].parentNode.appendChild(tr);
    }
    const g2 = tableGrid(t);
    rows.forEach((row, i) => row.forEach((v, j) => {
      const cell = g2.occ[p.r + i] && g2.occ[p.r + i][p.c + j]; if (!cell) return;
      const b = cell.querySelector('.hp') || cell.appendChild(W.doc.newParaHtml('0', '0', '0'));
      for (const x of Array.from(cell.querySelectorAll(':scope > .hp')).slice(1)) x.remove();
      b.replaceChildren(); const cp = b.dataset.dcp || '0';
      if (v !== '') { const s = document.createElement('span'); s.className = 'cp-' + cp; s.dataset.cp = cp; s.textContent = v; b.appendChild(s); }
      ensureBr(b);
    }));
  });
}

/* ---------- 셀 블록 (F5 / 마우스 끌기) ---------- */
function setCells(list) {
  clearCells(true);
  W.cells = new Set(list); for (const td of W.cells) td.classList.add('csel');
  if (window.onSelChange) window.onSelChange();
}
function clearCells(silent) { if (W.cells) for (const td of W.cells) td.classList.remove('csel'); W.cells = null; if (!silent && window.onSelChange) window.onSelChange(); }
function cellBlockRect(a, b) {
  const t = a.closest('table'); const g = tableGrid(t); const pa = g.pos.get(a), pb = g.pos.get(b);
  const R = cellRect([g.occ[Math.min(pa.r, pb.r)][Math.min(pa.c, pb.c)], g.occ[Math.max(pa.r + pa.rs - 1, pb.r + pb.rs - 1)][Math.max(pa.c + pa.cs - 1, pb.c + pb.cs - 1)]]);
  return R.cells;
}
function moveCellBlock(dr, dc, extend) {
  const t = W.cellAnchor.closest('table'); const g = tableGrid(t);
  const focus = W.cellFocus || W.cellAnchor; const p = g.pos.get(focus);
  const r = Math.max(0, Math.min(g.rows - 1, (dr > 0 ? p.r + p.rs - 1 : p.r) + dr)), c = Math.max(0, Math.min(g.cols - 1, (dc > 0 ? p.c + p.cs - 1 : p.c) + dc));
  const nf = g.occ[r][c]; W.cellFocus = nf;
  if (!extend) W.cellAnchor = nf;
  setCells(extend ? cellBlockRect(W.cellAnchor, nf) : [nf]);
}
/* 표 안 Tab 이동 */
function cellMove(td, back) {
  const t = td.closest('table'); const all = Array.from(t.querySelectorAll('td')).filter(x => x.closest('table') === t);
  const i = all.indexOf(td); const n = all[i + (back ? -1 : 1)];
  if (n) caretToEnd(n.querySelector('.hp'));
  else if (!back) { insertRow(td.closest('tr').cells[0], true); }
}

/* ---------- 그림 ---------- */
async function insertImageFile(file) {
  const r = rng(); const b = r && blockOf(r.startContainer); if (!b) { toast('그림을 넣을 곳을 먼저 클릭하세요'); return; }
  let blob = file, type = file.type;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) { toast('그림 파일을 읽지 못했습니다'); return; }
  let w = bmp.width, h = bmp.height;
  if (!/^image\/(png|jpeg|gif|bmp)$/.test(type) || file.size > 4e6 || Math.max(w, h) > 3000) {
    const k = Math.min(1, 2400 / Math.max(w, h)); const cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    const cx = cv.getContext('2d'); const jpg = type === 'image/jpeg' || file.size > 4e6; if (jpg) { cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); } cx.drawImage(bmp, 0, 0, cv.width, cv.height);
    type = jpg ? 'image/jpeg' : 'image/png'; blob = await new Promise(res => cv.toBlob(res, type, 0.9)); w = cv.width; h = cv.height;
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const host = hostOf(b); const pg = W.doc.page(0);
  const maxW = host.tagName === 'TD' ? Math.max(2000, (+host.dataset.w || 20000) - 1200) : pg.w - pg.left - pg.right - pg.gutter;
  // 화면 96dpi 기준 크기, 본문 너비를 넘으면 맞춤
  const el = W.doc.addImage(bytes, type, w, h, maxW);
  const s = W.doc.islandHtml(el, cpAtCaret(), false);
  insertNode(s);
}
/* 섬(원본 XML)을 고칠 때는 복제본을 새 번호로 등록 — 되돌리면 옛 번호의 원본이 그대로 돌아옴 */
function replaceIsland(span, el) { const old = W.doc.islands[span.dataset.i]; const c = el.cloneNode(true); span.dataset.i = W.doc.islands.push({ el: c, inT: old ? old.inT : false }) - 1; return c; }
function resizePic(span, wPx) {
  const isl = W.doc.islands[span.dataset.i]; if (!isl) return;
  const el = isl.el; const sz = xkid(el, 'sz'), cur = xkid(el, 'curSz'), org = xkid(el, 'orgSz');
  const ow = xint(sz, 'width', 1), oh = xint(sz, 'height', 1);
  const w = Math.max(300, Math.round(wPx * HU)), h = Math.round(oh * w / ow);
  const b = blockOf(span);
  edit(b, b, () => {
    const el2 = replaceIsland(span, el);
    for (const e of [xkid(el2, 'sz'), xkid(el2, 'curSz')]) if (e) { e.setAttribute('width', w); e.setAttribute('height', h); }
    const sm = xdesc(el2, 'scaMatrix')[0]; if (sm && org) { sm.setAttribute('e1', (w / xint(org, 'width', w)).toFixed(6)); sm.setAttribute('e5', (h / xint(org, 'height', h)).toFixed(6)); }
    const ri = xkid(el2, 'rotationInfo'); if (ri) { ri.setAttribute('centerX', Math.round(w / 2)); ri.setAttribute('centerY', Math.round(h / 2)); }
    span.style.width = (w / HU).toFixed(1) + 'px'; span.style.height = (h / HU).toFixed(1) + 'px';
  });
}

/* ---------- 붙여넣기 ---------- */
function pasteBlocks(blocks) { // 여러 문단 붙여넣기
  if (!blocks.length) return;
  let r = rng(); if (!r) return;
  if (!r.collapsed) { deleteSelection(true); r = rng(); }
  const b = blockOf(r.startContainer); if (!b) return;
  const host = hostOf(b);
  const e = record('op', b, b);
  const tail = document.createRange(); tail.setStart(r.startContainer, r.startOffset); tail.setEnd(b, b.childNodes.length);
  const frag = tail.extractContents();
  const nb = b.cloneNode(false); nb.removeAttribute('data-k'); nb.removeAttribute('style'); delete nb.dataset.pb; nb.appendChild(frag);
  ensureBr(b); ensureBr(nb);
  let last = b;
  const inserted = [];
  for (const x of blocks) { last.after(x); last = x; inserted.push(x); }
  last.after(nb);
  // 첫 문단은 앞 문단과, 끝 문단은 뒤 조각과 합침
  const first = inserted[0];
  if (!first.querySelector('table')) mergeInto(b, first);
  const lastIns = inserted[inserted.length - 1];
  const tailHost = lastIns.isConnected ? lastIns : b;
  const k = textNodesOf(tailHost).reduce((s, t) => s + t.length, 0);
  const hasTable = !!tailHost.querySelector('table');
  if (isEmptyBlock(nb) && !nb.querySelector('.isl:not(.hid)')) { if (!hasTable) nb.remove(); }
  else if (!hasTable) mergeInto(tailHost, nb);
  setCaretOffset(nb.isConnected && hasTable ? nb : tailHost, nb.isConnected && hasTable ? 0 : k);
  settle(e); UNDO.cur = null; changed();
}
function plainToBlocks(text, b) {
  const cp = cpAtCaret();
  return text.replace(/\r\n?/g, '\n').split('\n').map(line => {
    const d = W.doc.newParaHtml(b.dataset.pp, b.dataset.st, cp); d.className = `hp pp-${b.dataset.pp} cp-${cp}`;
    if (line) { d.replaceChildren(); const parts = line.split('\t'); parts.forEach((s, i) => { if (i) d.appendChild(W.doc.islandHtml(W.doc.newTab(), cp, true)); if (s) { const sp = document.createElement('span'); sp.className = 'cp-' + cp; sp.dataset.cp = cp; sp.textContent = s; d.appendChild(sp); } }); ensureBr(d); }
    return d;
  });
}
function sanitizeOwn(html) {
  const tpl = document.createElement('template'); tpl.innerHTML = html;
  const root = tpl.content;
  for (const e of Array.from(root.querySelectorAll('*'))) {
    if (e.matches('style,script,meta,link,title,iframe,object,embed')) { e.remove(); continue; }
    for (const a of Array.from(e.attributes)) if (/^on/i.test(a.name) || (a.name === 'href' && /^\s*javascript:/i.test(a.value))) e.removeAttribute(a.name);
    if (e.classList.contains('csel')) e.classList.remove('csel');
    if (e.matches('.isl.hid')) { e.remove(); continue; } // 구역 설정·머리말·필드 같은 조판 부호는 복사하지 않음
    if (e.classList.contains('hp')) { e.removeAttribute('data-pgs'); e.removeAttribute('data-num'); e.style.marginTop = ''; }
  }
  return root;
}
function htmlTableRows(html) {
  const tpl = document.createElement('template'); tpl.innerHTML = html;
  const t = tpl.content.querySelector('table'); if (!t) return null;
  return Array.from(t.rows).map(r => Array.from(r.cells).map(c => (c.innerText || c.textContent || '').replace(/\s+/g, ' ').trim()));
}
function onPaste(e) {
  if (!inDoc(e.target)) return;
  e.preventDefault();
  const dt = e.clipboardData; const html = dt.getData('text/html'), text = dt.getData('text/plain');
  const img = Array.from(dt.items || []).find(i => i.kind === 'file' && /^image\//.test(i.type));
  const r = rng(); const b = r && blockOf(r.startContainer); if (!b) return;
  const td = cellOf(b);
  if (html && html.includes('data-hwpclip="' + W.uid + '"')) {
    const frag = sanitizeOwn(html); const wrap = frag.querySelector('[data-hwpclip]') || frag;
    const blocks = Array.from(wrap.children).filter(x => x.classList.contains('hp'));
    if (blocks.length) pasteBlocks(blocks);
    else { const d = document.createElement('div'); d.className = b.className; d.dataset.pp = b.dataset.pp; d.dataset.st = b.dataset.st; d.dataset.dcp = b.dataset.dcp; d.append(...Array.from(wrap.childNodes)); pasteBlocks([d]); }
    return;
  }
  if (img && !text) { const f = img.getAsFile(); if (f) insertImageFile(f); return; }
  const rows = html ? htmlTableRows(html) : null;
  const tsv = text && /\t/.test(text) ? text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n').map(l => l.split('\t')) : null;
  const grid = rows || (tsv && tsv.length > 1 ? tsv : null);
  if (grid && grid.length) { if (td) fillCells(td, grid); else tableFromRows(grid); return; }
  if (text) { const blocks = plainToBlocks(text, b); if (blocks.length === 1) { const t = text.replace(/\r?\n/g, ''); if (!/\t/.test(t)) { insertText(t); return; } } pasteBlocks(blocks); }
}
function onCopy(e, cut) {
  if (W.cells && W.cells.size) {
    e.preventDefault();
    const R = cellRect(Array.from(W.cells)); const lines = [];
    for (let r = R.r0; r <= R.r1; r++) { const row = []; for (let c = R.c0; c <= R.c1; c++) { const td = R.g.occ[r][c]; const p = R.g.pos.get(td); row.push(p.r === r && p.c === c ? td.innerText.replace(/\s+/g, ' ').trim() : ''); } lines.push(row.join('\t')); }
    e.clipboardData.setData('text/plain', lines.join('\n'));
    if (cut) clearCellContents(Array.from(W.cells));
    return;
  }
  const r = rng(); if (!r || r.collapsed || !inDoc(r.startContainer)) return;
  e.preventDefault();
  const div = document.createElement('div'); div.setAttribute('data-hwpclip', W.uid);
  const b1 = blockOf(r.startContainer), b2 = blockOf(r.endContainer);
  if (b1 && b2 && b1 !== b2 && hostOf(b1) === hostOf(b2)) {
    const frag = r.cloneContents();
    for (const n of Array.from(frag.childNodes)) div.appendChild(n);
  } else div.appendChild(r.cloneContents());
  e.clipboardData.setData('text/html', div.outerHTML);
  e.clipboardData.setData('text/plain', sel().toString().replace(/​/g, ''));
  if (cut) deleteSelection();
}
function clearCellContents(cells) {
  if (!cells.length) return;
  tableOp(cells[0], () => { for (const td of cells) { const ps = Array.from(td.querySelectorAll(':scope > .hp')); ps.slice(1).forEach(p => p.remove()); const b = ps[0]; if (b) { b.replaceChildren(); ensureBr(b); } } });
}

/* ---------- 찾기 ---------- */
function findNext(q, opts) {
  opts = opts || {};
  if (!q) return false;
  const blocks = Array.from(docEl().querySelectorAll('.hp'));
  const r = rng();
  const norm = s => opts.case ? s : s.toLowerCase(); const nq = norm(q);
  let startB = r && blockOf(opts.back ? r.startContainer : r.endContainer); let startI = startB ? blocks.indexOf(startB) : -1;
  let startOff = startB ? caretOffset(startB, opts.back ? r.startContainer : r.endContainer, opts.back ? r.startOffset : r.endOffset) : 0;
  const n = blocks.length;
  for (let step = 0; step <= n; step++) {
    const i = opts.back ? (startI - step + n * 2) % n : ((startI < 0 ? 0 : startI) + step) % n;
    const b = blocks[i]; const nodes = textNodesOf(b); const text = nodes.map(t => t.nodeValue).join('');
    let pos;
    if (opts.back) { if (step === 0 && startI >= 0) pos = startOff - nq.length < 0 ? -1 : norm(text).lastIndexOf(nq, startOff - nq.length); else pos = norm(text).lastIndexOf(nq); }
    else pos = norm(text).indexOf(nq, step === 0 && startI >= 0 ? startOff : 0);
    if (step === n && pos >= 0 && !opts.back && startI >= 0 && pos >= startOff) pos = -1;
    if (pos >= 0) { selectTextRange(b, pos, pos + q.length); return true; }
  }
  return false;
}
function selectTextRange(b, a, z) {
  const nodes = textNodesOf(b); let k = 0, sn, so, en, eo;
  for (const t of nodes) { const L = t.length; if (sn == null && a <= k + L) { sn = t; so = a - k; } if (z <= k + L) { en = t; eo = z - k; break; } k += L; }
  if (!sn || !en) return;
  const r = document.createRange(); r.setStart(sn, so); r.setEnd(en, eo); const s = sel(); focusFor(sn); s.removeAllRanges(); s.addRange(r);
  const rect = r.getBoundingClientRect(); const cv = $id('canvas'); const cr = cv.getBoundingClientRect();
  if (rect.top < cr.top + 40 || rect.bottom > cr.bottom - 40) cv.scrollTop += rect.top - cr.top - cr.height / 3;
}
function replaceSel(q, rep) {
  const r = rng(); if (!r || r.collapsed) return false;
  if (r.toString().toLowerCase() !== q.toLowerCase()) return false;
  insertText(rep); return true;
}
function replaceAll(q, rep, opts) {
  if (!q) return 0;
  opts = opts || {};
  const blocks = Array.from(docEl().querySelectorAll('.hp')).filter(b => { const t = textNodesOf(b).map(x => x.nodeValue).join(''); return opts.case ? t.includes(q) : t.toLowerCase().includes(q.toLowerCase()); });
  if (!blocks.length) return 0;
  let count = 0;
  const list = Array.from(new Set(blocks.map(topOf))); const first = list[0], last = list[list.length - 1];
  const work = () => {
    for (const b of blocks) {
      for (;;) {
        const nodes = textNodesOf(b); const text = nodes.map(t => t.nodeValue).join('');
        const idx = opts.case ? text.indexOf(q, b._rp || 0) : text.toLowerCase().indexOf(q.toLowerCase(), b._rp || 0);
        if (idx < 0) break;
        // 해당 범위를 지우고 첫 글자 노드에 넣음
        let k = 0, done = false;
        for (const t of nodes) {
          const L = t.length;
          if (!done && idx < k + L) {
            const s0 = idx - k; let remain = q.length;
            const take = Math.min(L - s0, remain); t.deleteData(s0, take); t.insertData(s0, rep); remain -= take;
            let nx = nodes.indexOf(t) + 1; while (remain > 0 && nx < nodes.length) { const u = nodes[nx]; const tk = Math.min(u.length, remain); u.deleteData(0, tk); remain -= tk; nx++; }
            done = true;
          }
          k += L;
        }
        b._rp = idx + rep.length; count++;
      }
      delete b._rp; mergeSpans(b);
    }
  };
  edit(first, last, work);
  return count;
}
