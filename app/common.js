/* 교안 작업장 공통 모듈
   - 데이터 모델 / 테마 / 레이아웃 / 렌더러 / 저장 API
   - 편집기(editor.js), 발표기(present.js), 허브(hub.js)가 함께 사용 */
'use strict';

const SLIDE_W = 1920, SLIDE_H = 1080;

const FONT_SANS = "'Pretendard Variable', Pretendard, 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
const FONT_SERIF = "'Noto Serif KR', 'Nanum Myeongjo', '나눔명조', Batang, '바탕', serif";
const FONT_MONO = "'Cascadia Code', 'D2Coding', Consolas, 'Courier New', monospace";
const FONTS = [
  { id: 'sans', name: '고딕 (기본)', css: FONT_SANS },
  { id: 'serif', name: '명조', css: FONT_SERIF },
  { id: 'mono', name: '고정폭 (코드)', css: FONT_MONO },
];
function fontCss(id) { const f = FONTS.find(f => f.id === id); return f ? f.css : FONT_SANS; }

/* ---------- 테마 ---------- */
const THEMES = [
  { id: 'clean', name: '클린 화이트', bg: '#ffffff', fg: '#1f2937', title: '#111827', accent: '#2563eb', accent2: '#f59e0b', muted: '#6b7280', surface: '#f3f4f6', decor: 'bar-left' },
  { id: 'academic', name: '아카데믹 네이비', bg: '#ffffff', fg: '#1e293b', title: '#1e3a8a', accent: '#1e3a8a', accent2: '#c2410c', muted: '#64748b', surface: '#eef2ff', decor: 'bar-top' },
  { id: 'navy', name: '다크 네이비', bg: '#0f172a', fg: '#e2e8f0', title: '#ffffff', accent: '#38bdf8', accent2: '#fbbf24', muted: '#94a3b8', surface: '#1e293b', decor: 'bar-left' },
  { id: 'chalk', name: '칠판', bg: '#26403a', fg: '#f1f5f1', title: '#fde68a', accent: '#fde68a', accent2: '#93c5fd', muted: '#b7c4bd', surface: '#31504a', decor: 'none', bgGradient: 'radial-gradient(ellipse at center, #2d4b44 0%, #203630 100%)' },
  { id: 'warm', name: '웜 베이지', bg: '#faf5ea', fg: '#3f3a30', title: '#2b2620', accent: '#c2410c', accent2: '#0f766e', muted: '#857c6c', surface: '#f1e8d6', decor: 'bar-left' },
  { id: 'forest', name: '포레스트', bg: '#f0f7f2', fg: '#1f3326', title: '#14532d', accent: '#15803d', accent2: '#ca8a04', muted: '#5b7262', surface: '#dcebe0', decor: 'bar-top' },
  { id: 'plum', name: '플럼 다크', bg: '#1c1023', fg: '#f3e8ff', title: '#ffffff', accent: '#e879f9', accent2: '#fbbf24', muted: '#c4b5d8', surface: '#2e1b3a', decor: 'none', bgGradient: 'linear-gradient(135deg, #1c1023 0%, #2a1440 100%)' },
  { id: 'mint', name: '민트 그라데이션', bg: '#ecfeff', fg: '#134e4a', title: '#0f3d3a', accent: '#0d9488', accent2: '#f97316', muted: '#4b7f7a', surface: '#ccfbf1', decor: 'none', bgGradient: 'linear-gradient(160deg, #ecfeff 0%, #d1fae5 100%)' },
];
function getTheme(id) { return THEMES.find(t => t.id === id) || THEMES[0]; }

/* 역할(role)별 텍스트 기본 스타일 — 테마를 바꾸면 함께 바뀜 */
function textDefaults(role, theme) {
  switch (role) {
    case 'title': return { fontSize: 84, color: theme.title, bold: true, lineHeight: 1.2, font: 'sans' };
    case 'subtitle': return { fontSize: 38, color: theme.muted, lineHeight: 1.4, font: 'sans' };
    case 'heading': return { fontSize: 58, color: theme.title, bold: true, lineHeight: 1.25, font: 'sans' };
    case 'body': return { fontSize: 36, color: theme.fg, lineHeight: 1.55, font: 'sans' };
    case 'caption': return { fontSize: 24, color: theme.muted, lineHeight: 1.4, font: 'sans' };
    case 'quote': return { fontSize: 52, color: theme.title, lineHeight: 1.4, font: 'serif', italic: true, align: 'center' };
    case 'code': return { fontSize: 28, color: '#e5e7eb', lineHeight: 1.5, font: 'mono', bg: '#1e1e2e', padding: 36, radius: 18 };
    case 'number': return { fontSize: 160, color: theme.accent, bold: true, lineHeight: 1.1, align: 'center', font: 'sans' };
    default: return { fontSize: 36, color: theme.fg, lineHeight: 1.5, font: 'sans' };
  }
}
const ROLE_NAMES = { title: '제목', subtitle: '부제목', heading: '소제목', body: '본문', caption: '캡션', quote: '인용', code: '코드', number: '큰 숫자', text: '일반' };

/* ---------- 유틸 ---------- */
function uid() { return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function stripHtml(html) { const d = document.createElement('div'); d.innerHTML = html || ''; return (d.textContent || '').trim(); }

/* ---------- 모델 생성 ---------- */
function newDeck(title) {
  const d = { title: title || '새 교안', theme: 'clean', created: new Date().toISOString(), slides: [] };
  d.slides.push(newSlide('title', { title: title || '새 교안', subtitle: '부제목 · 강의자 이름 · 날짜' }));
  return d;
}
function newSlide(layout, fill) {
  return { id: uid(), bg: null, transition: '', notes: '', elements: layoutElements(layout || 'blank', fill || {}) };
}
function textEl(role, x, y, w, h, html, extra) {
  return Object.assign({ id: uid(), type: 'text', role, x, y, w, h, html: html || '', style: {}, step: 0, anim: 'fade', rotate: 0, opacity: 1 }, extra || {});
}
function imageEl(x, y, w, h, src, extra) {
  return Object.assign({ id: uid(), type: 'image', x, y, w, h, src: src || '', fit: 'contain', radius: 0, shadow: false, step: 0, anim: 'fade', rotate: 0, opacity: 1 }, extra || {});
}
function shapeEl(shape, x, y, w, h, extra) {
  return Object.assign({ id: uid(), type: 'shape', shape, x, y, w, h, fill: '$accent', stroke: '', strokeWidth: 0, radius: 24, shadow: false, step: 0, anim: 'fade', rotate: 0, opacity: 1 }, extra || {});
}

const LAYOUTS = [
  { id: 'title', name: '표지', icon: '▭' },
  { id: 'section', name: '섹션 구분', icon: '▬' },
  { id: 'content', name: '소제목 + 본문', icon: '≡' },
  { id: 'twoCol', name: '2단 본문', icon: '‖' },
  { id: 'imageRight', name: '본문 + 이미지(우)', icon: '▣' },
  { id: 'imageLeft', name: '이미지(좌) + 본문', icon: '▣' },
  { id: 'imageFull', name: '큰 이미지 + 캡션', icon: '▦' },
  { id: 'compare', name: '비교 (A vs B)', icon: '⇔' },
  { id: 'quote', name: '인용구', icon: '❝' },
  { id: 'number', name: '핵심 숫자', icon: '#' },
  { id: 'code', name: '코드', icon: '</>' },
  { id: 'blank', name: '빈 슬라이드', icon: '□' },
];
const LAYOUT_NAMES = Object.fromEntries(LAYOUTS.map(l => [l.id, l.name]));
const M = 120; // 좌우 여백
function layoutElements(layout, f) {
  const H = f.heading || '소제목을 입력하세요';
  const B = f.body || '<ul><li>첫 번째 내용</li><li>두 번째 내용</li><li>세 번째 내용</li></ul>';
  switch (layout) {
    case 'title': return [
      textEl('title', M, 330, SLIDE_W - M * 2, 220, f.title || '강의 제목', { style: { align: 'center', valign: 'middle' } }),
      textEl('subtitle', M, 570, SLIDE_W - M * 2, 120, f.subtitle || '부제목 · 강의자 · 날짜', { style: { align: 'center', valign: 'top' } }),
    ];
    case 'section': return [
      textEl('caption', M, 360, 900, 60, f.caption || 'PART 1', { style: { fontSize: 30, color: '$accent', bold: true } }),
      textEl('title', M, 430, SLIDE_W - M * 2, 240, f.title || '섹션 제목', { style: { fontSize: 96, valign: 'top' } }),
      shapeEl('rect', M, 690, 220, 12, { fill: '$accent', radius: 6 }),
      textEl('subtitle', M, 730, SLIDE_W - M * 2, 100, f.subtitle || '이 섹션에서 다룰 내용을 한 줄로'),
    ];
    case 'content': return [
      textEl('heading', M, 90, SLIDE_W - M * 2, 130, H, { style: { valign: 'middle' } }),
      textEl('body', M, 260, SLIDE_W - M * 2, 700, B),
    ];
    case 'twoCol': return [
      textEl('heading', M, 90, SLIDE_W - M * 2, 130, H, { style: { valign: 'middle' } }),
      textEl('body', M, 260, 800, 700, f.body || '<ul><li>왼쪽 내용</li><li>왼쪽 내용</li></ul>'),
      textEl('body', 1000, 260, 800, 700, f.body2 || '<ul><li>오른쪽 내용</li><li>오른쪽 내용</li></ul>'),
    ];
    case 'imageRight': return [
      textEl('heading', M, 90, SLIDE_W - M * 2, 130, H, { style: { valign: 'middle' } }),
      textEl('body', M, 260, 820, 700, B),
      imageEl(1000, 260, 800, 660, f.image || '', { radius: 24, shadow: true }),
    ];
    case 'imageLeft': return [
      textEl('heading', M, 90, SLIDE_W - M * 2, 130, H, { style: { valign: 'middle' } }),
      imageEl(M, 260, 800, 660, f.image || '', { radius: 24, shadow: true }),
      textEl('body', 980, 260, 820, 700, B),
    ];
    case 'imageFull': return [
      textEl('heading', M, 70, SLIDE_W - M * 2, 110, H, { style: { valign: 'middle' } }),
      imageEl(M, 200, SLIDE_W - M * 2, 720, f.image || '', { radius: 20, shadow: true }),
      textEl('caption', M, 940, SLIDE_W - M * 2, 70, f.caption || '그림 1. 캡션을 입력하세요', { style: { align: 'center' } }),
    ];
    case 'compare': return [
      textEl('heading', M, 90, SLIDE_W - M * 2, 130, H, { style: { valign: 'middle' } }),
      shapeEl('rect', M, 260, 810, 100, { fill: '$accent', radius: 20 }),
      textEl('text', M, 260, 810, 100, f.a || 'A', { style: { color: '#ffffff', bold: true, align: 'center', valign: 'middle', fontSize: 40 } }),
      shapeEl('rect', 990, 260, 810, 100, { fill: '$accent2', radius: 20 }),
      textEl('text', 990, 260, 810, 100, f.b || 'B', { style: { color: '#ffffff', bold: true, align: 'center', valign: 'middle', fontSize: 40 } }),
      shapeEl('rect', M, 380, 810, 560, { fill: '$surface', radius: 20 }),
      textEl('body', M + 30, 410, 750, 500, '<ul><li>장점</li><li>특징</li></ul>'),
      shapeEl('rect', 990, 380, 810, 560, { fill: '$surface', radius: 20 }),
      textEl('body', 1020, 410, 750, 500, '<ul><li>장점</li><li>특징</li></ul>'),
    ];
    case 'quote': return [
      textEl('quote', 200, 300, SLIDE_W - 400, 360, f.quote || '“인용문을 입력하세요.”', { style: { valign: 'middle' } }),
      textEl('caption', 200, 700, SLIDE_W - 400, 60, f.by || '— 출처', { style: { align: 'center', fontSize: 30 } }),
    ];
    case 'number': return [
      textEl('number', M, 260, SLIDE_W - M * 2, 260, f.number || '73%', { style: { valign: 'middle' } }),
      textEl('heading', M, 560, SLIDE_W - M * 2, 120, f.heading || '핵심 수치의 의미', { style: { align: 'center' } }),
      textEl('body', 300, 700, SLIDE_W - 600, 160, f.body || '수치에 대한 설명을 입력하세요', { style: { align: 'center' } }),
    ];
    case 'code': return [
      textEl('heading', M, 90, SLIDE_W - M * 2, 130, H, { style: { valign: 'middle' } }),
      textEl('code', M, 260, SLIDE_W - M * 2, 680, f.code || 'def hello(name):\n    print(f"안녕하세요, {name}")'),
    ];
    default: return [];
  }
}
function maxStep(slide) { return slide.elements.reduce((m, e) => Math.max(m, elementMaxStep(e)), 0); }

/* ---------- 렌더러 ---------- */
/* 테마 색 참조: 색 문자열이 "$accent" 처럼 시작하면 테마 색으로 치환 */
function themeColor(v, theme) {
  if (typeof v !== 'string') return v;
  if (v[0] === '$') return theme[v.slice(1)] || v;
  return v;
}

function slideBackground(slide, theme) {
  const bg = slide.bg || {};
  const css = {};
  if (bg.image) {
    css.backgroundImage = `url("${API.resolveSrc(bg.image)}")`;
    css.backgroundSize = bg.fit === 'contain' ? 'contain' : 'cover';
    css.backgroundPosition = 'center'; css.backgroundRepeat = 'no-repeat';
    css.backgroundColor = bg.color || theme.bg;
  } else if (bg.gradient) {
    css.background = bg.gradient;
  } else if (bg.color) {
    css.background = bg.color;
  } else {
    css.background = theme.bgGradient || theme.bg;
  }
  return css;
}

/* opts: { mode: 'edit'|'present'|'thumb', step: number } */
function renderSlide(slide, deck, opts) {
  opts = opts || {};
  const theme = getTheme(deck.theme);
  const mode = opts.mode || 'present';
  const step = opts.step == null ? Infinity : opts.step;
  const el = document.createElement('div');
  el.className = 'slide theme-' + theme.id + ' mode-' + mode;
  el.style.width = SLIDE_W + 'px'; el.style.height = SLIDE_H + 'px';
  Object.assign(el.style, slideBackground(slide, theme));
  el.style.setProperty('--accent', theme.accent);
  el.style.setProperty('--accent2', theme.accent2);
  el.style.setProperty('--fg', theme.fg);
  el.style.setProperty('--muted', theme.muted);
  el.style.setProperty('--surface', theme.surface);
  el.style.fontFamily = FONT_SANS;
  // 테마 장식 (배경 이미지가 있으면 생략)
  const decor = (slide.bg && slide.bg.image) ? 'none' : (slide.decor || theme.decor);
  if (decor && decor !== 'none') { const d = document.createElement('div'); d.className = 'decor decor-' + decor; el.appendChild(d); }
  for (const e of slide.elements) {
    const node = renderElement(e, theme, mode);
    if (mode === 'present') applyStepToNode(e, node, step);
    el.appendChild(node);
  }
  return el;
}

function renderElement(e, theme, mode) {
  const node = document.createElement('div');
  node.className = 'el el-' + e.type;
  node.dataset.id = e.id;
  node.style.left = e.x + 'px'; node.style.top = e.y + 'px';
  node.style.width = e.w + 'px'; node.style.height = e.h + 'px';
  if (e.rotate) node.style.transform = `rotate(${e.rotate}deg)`;
  if (e.opacity != null && e.opacity !== 1) { node.style.opacity = e.opacity; node.style.setProperty('--op', e.opacity); }
  if (e.type === 'text') renderText(e, node, theme, mode);
  else if (e.type === 'image') renderImage(e, node, theme, mode);
  else if (e.type === 'shape') renderShape(e, node, theme, mode);
  return node;
}

function resolveTextStyle(e, theme) {
  return Object.assign({}, textDefaults(e.role, theme), e.style || {});
}

function applyTextNodeStyle(e, node, theme) {
  const st = resolveTextStyle(e, theme);
  node.style.fontSize = st.fontSize + 'px';
  node.style.color = themeColor(st.color, theme);
  node.style.fontFamily = fontCss(st.font);
  node.style.fontWeight = st.bold ? '700' : '400';
  node.style.fontStyle = st.italic ? 'italic' : 'normal';
  node.style.textDecoration = st.underline ? 'underline' : 'none';
  node.style.lineHeight = st.lineHeight || 1.5;
  node.style.textAlign = st.align || 'left';
  node.style.letterSpacing = st.letterSpacing ? st.letterSpacing + 'px' : '';
  node.style.justifyContent = st.valign === 'middle' ? 'center' : st.valign === 'bottom' ? 'flex-end' : 'flex-start';
  node.style.background = st.bg ? themeColor(st.bg, theme) : '';
  node.style.padding = st.padding ? st.padding + 'px' : '';
  node.style.borderRadius = st.radius ? st.radius + 'px' : '';
  node.style.border = st.border ? `${st.border}px solid ${themeColor(st.borderColor || '$accent', theme)}` : '';
  node.style.boxShadow = st.shadow ? '0 12px 40px rgba(0,0,0,.18)' : '';
  node.style.borderLeft = st.accentBar ? `14px solid ${theme.accent}` : (st.border ? `${st.border}px solid ${themeColor(st.borderColor || '$accent', theme)}` : '');
  if (st.accentBar && !st.padding) node.style.paddingLeft = '28px';
  const inner = node.querySelector('.el-text-inner');
  if (inner) inner.classList.toggle('pre', st.font === 'mono' || e.role === 'code');
}

function renderText(e, node, theme, mode) {
  const inner = document.createElement('div');
  inner.className = 'el-text-inner';
  inner.innerHTML = e.html || '';
  if (mode === 'edit' && !stripHtml(e.html) && !/<img|<ul|<ol/.test(e.html || '')) {
    inner.innerHTML = '<span class="placeholder">텍스트를 입력하세요</span>';
  }
  node.appendChild(inner);
  applyTextNodeStyle(e, node, theme);
}

/* 목록 항목 하나씩 표시(listSteps): 최상위 li 들을 찾는다 */
function topLevelItems(inner) {
  return Array.from(inner.querySelectorAll('li')).filter(li => !li.parentElement.closest('li'));
}
function listStepBase(e) { return (e.step || 0) > 0 ? e.step : 1; }
function elementMaxStep(e) {
  if (e.type === 'text' && e.listSteps) {
    const d = document.createElement('div'); d.innerHTML = e.html || '';
    const n = topLevelItems(d).length;
    return n ? listStepBase(e) + n - 1 : (e.step || 0);
  }
  return e.step || 0;
}
/* 발표 단계에 맞게 요소 표시/애니메이션 클래스 적용 */
function applyStepToNode(e, node, step) {
  const s = e.step || 0;
  node.classList.remove('step-hidden', 'anim', 'anim-fade', 'anim-up', 'anim-left', 'anim-zoom');
  if (s > step) { node.classList.add('step-hidden'); return; }
  if (s > 0 && s === step && e.anim && e.anim !== 'none') node.classList.add('anim', 'anim-' + e.anim);
  if (e.type === 'text' && e.listSteps) {
    const inner = node.querySelector('.el-text-inner'); if (!inner) return;
    const base = listStepBase(e);
    topLevelItems(inner).forEach((li, i) => {
      const ls = base + i;
      li.classList.remove('step-hidden', 'anim', 'anim-fade', 'anim-up', 'anim-left', 'anim-zoom');
      if (ls > step) li.classList.add('step-hidden');
      else if (ls === step && step > 0) li.classList.add('anim', 'anim-' + (e.anim && e.anim !== 'none' ? e.anim : 'fade'));
    });
  }
}

function renderImage(e, node, theme, mode) {
  if (e.radius) node.style.borderRadius = e.radius + 'px';
  if (e.shadow) node.style.boxShadow = '0 16px 48px rgba(0,0,0,.25)';
  if (e.border) node.style.border = `${e.border}px solid ${themeColor(e.borderColor || '#ffffff', theme)}`;
  if (!e.src) {
    if (mode !== 'present') { node.classList.add('img-empty'); node.innerHTML = '<div class="img-hint">🖼 이미지<br><small>더블클릭 → 파일 선택 / 붙여넣기 / 드래그</small></div>'; }
    return;
  }
  const img = document.createElement('img');
  img.src = API.resolveSrc(e.src); img.draggable = false; img.alt = ''; img.decoding = 'async';
  if (API.mode === 'github' && !/^(data:|blob:|https?:)/i.test(e.src)) img.onerror = () => { if (img.dataset.fb) return; img.dataset.fb = '1'; img.src = GH.rawUrl(e.src); };
  img.style.objectFit = e.fit || 'contain';
  if (e.flip) img.style.transform = 'scaleX(-1)';
  node.appendChild(img);
}

function renderShape(e, node, theme, mode) {
  const w = e.w, h = e.h;
  const fill = themeColor(e.fill || 'none', theme) || 'none';
  const stroke = themeColor(e.stroke, theme);
  const sw = e.strokeWidth || 0;
  const strokeAttr = sw > 0 && stroke ? `stroke="${stroke}" stroke-width="${sw}"` : 'stroke="none"';
  let body = '';
  const r = e.radius || 0;
  switch (e.shape) {
    case 'rect': body = `<rect x="${sw / 2}" y="${sw / 2}" width="${w - sw}" height="${h - sw}" rx="${r}" fill="${fill}" ${strokeAttr}/>`; break;
    case 'ellipse': body = `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - sw / 2}" ry="${h / 2 - sw / 2}" fill="${fill}" ${strokeAttr}/>`; break;
    case 'triangle': body = `<polygon points="${w / 2},${sw} ${w - sw},${h - sw} ${sw},${h - sw}" fill="${fill}" ${strokeAttr} stroke-linejoin="round"/>`; break;
    case 'diamond': body = `<polygon points="${w / 2},${sw} ${w - sw},${h / 2} ${w / 2},${h - sw} ${sw},${h / 2}" fill="${fill}" ${strokeAttr} stroke-linejoin="round"/>`; break;
    case 'line': { const t = Math.max(2, sw || 6); const c = stroke || fill; body = `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="${c}" stroke-width="${t}" stroke-linecap="round"/>`; break; }
    case 'arrow': {
      const t = Math.max(4, sw || 10); const c = stroke || fill; const head = Math.min(w * 0.35, h, t * 4);
      body = `<line x1="0" y1="${h / 2}" x2="${w - head * 0.8}" y2="${h / 2}" stroke="${c}" stroke-width="${t}" stroke-linecap="round"/>` +
        `<polygon points="${w - head},${h / 2 - head * 0.6} ${w},${h / 2} ${w - head},${h / 2 + head * 0.6}" fill="${c}"/>`; break;
    }
    case 'star': {
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - sw, rr = R * 0.45; const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rad = i % 2 ? rr : R; pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1)); }
      body = `<polygon points="${pts.join(' ')}" fill="${fill}" ${strokeAttr} stroke-linejoin="round"/>`; break;
    }
    case 'chevron': { const d = Math.min(h / 2, w * 0.25); body = `<polygon points="0,0 ${w - d},0 ${w},${h / 2} ${w - d},${h} 0,${h} ${d},${h / 2}" fill="${fill}" ${strokeAttr}/>`; break; }
    default: body = `<rect width="${w}" height="${h}" fill="${fill}"/>`;
  }
  if (e.shadow) node.style.filter = 'drop-shadow(0 12px 24px rgba(0,0,0,.25))';
  node.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">${body}</svg>`;
}
const SHAPES = [
  { id: 'rect', name: '사각형' }, { id: 'ellipse', name: '원' }, { id: 'triangle', name: '삼각형' }, { id: 'diamond', name: '마름모' },
  { id: 'star', name: '별' }, { id: 'chevron', name: '화살 블록' }, { id: 'line', name: '선' }, { id: 'arrow', name: '화살표' },
];

/* 컨테이너 크기에 맞게 슬라이드(1920x1080)를 축소/확대 */
function fitSlide(container, slideEl, pad) {
  pad = pad || 0;
  const cw = container.clientWidth - pad * 2, ch = container.clientHeight - pad * 2;
  const k = Math.max(0.01, Math.min(cw / SLIDE_W, ch / SLIDE_H));
  slideEl.style.transform = `scale(${k})`;
  slideEl.style.transformOrigin = '0 0';
  slideEl.style.position = 'absolute';
  slideEl.style.left = Math.round((container.clientWidth - SLIDE_W * k) / 2) + 'px';
  slideEl.style.top = Math.round((container.clientHeight - SLIDE_H * k) / 2) + 'px';
  return k;
}

/* ---------- 이미지 최적화: 넣기 전에 브라우저에서 크기·용량을 줄임 ---------- */
const IMG_MAX = 2560; // 긴 변 최대 픽셀 (슬라이드 1920 기준 + 확대 여유)
async function prepareImage(file) {
  const type = file.type || '';
  const name = (file.name || 'image.png').replace(/^.*[\\/]/, '');
  const asIs = async () => { const d = await imageDims(URL.createObjectURL(file)); return { blob: file, name, w: d.w, h: d.h }; };
  if (/svg|gif/i.test(type) || /\.(svg|gif)$/i.test(name)) return asIs(); // 벡터·애니메이션은 그대로
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } // EXIF 회전 반영
  catch (e) { try { bmp = await createImageBitmap(file); } catch (e2) { return asIs(); } }
  const w0 = bmp.width, h0 = bmp.height;
  const k = Math.min(1, IMG_MAX / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
  const isPng = /png/i.test(type), isJpg = /jpe?g/i.test(type), isWebp = /webp/i.test(type);
  // 이미 작고(300KB 미만) 줄일 필요도 없으면 원본 그대로
  if (k === 1 && file.size < 300 * 1024 && (isPng || isJpg || isWebp)) { if (bmp.close) bmp.close(); return { blob: file, name, w, h }; }
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.drawImage(bmp, 0, 0, w, h); if (bmp.close) bmp.close();
  // 투명 픽셀이 있으면 PNG 유지, 없으면 JPEG (사진·캡처 모두 충분한 화질)
  let alpha = false;
  if (isPng || isWebp) {
    const sc = document.createElement('canvas'); sc.width = sc.height = 64; const sx = sc.getContext('2d'); sx.drawImage(c, 0, 0, 64, 64);
    const px = sx.getImageData(0, 0, 64, 64).data; for (let i = 3; i < px.length; i += 4) if (px[i] < 250) { alpha = true; break; }
  }
  // 투명 없는 PNG(캡처 등)는 1.5MB 까지는 또렷함을 위해 원본 유지
  if (k === 1 && isPng && !alpha && file.size < 1.5 * 1024 * 1024) return { blob: file, name, w, h };
  const out = alpha ? 'image/png' : 'image/jpeg';
  const blob = await new Promise(r => c.toBlob(r, out, 0.86));
  if (!blob || (k === 1 && blob.size >= file.size)) return { blob: file, name, w, h }; // 줄어들지 않으면 원본
  return { blob, name: name.replace(/\.[^.]+$/, '') + (alpha ? '.png' : '.jpg'), w, h };
}
function imageDims(url) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth || 800, h: im.naturalHeight || 600 }); im.onerror = () => rej(new Error('이미지를 열 수 없습니다')); im.src = url; });
}
/* 파일명을 안전하게 + 짧은 꼬리표로 유일하게 (서버 왕복 없이 바로 src 를 정하기 위해) */
function uniqueAssetName(name) {
  let n = (name || 'image.png').replace(/^.*[\\/]/, '').replace(/[^\w.\-가-힣]/g, '_');
  const dot = n.lastIndexOf('.'); let base = dot > 0 ? n.slice(0, dot) : n; const ext = dot > 0 ? n.slice(dot).toLowerCase() : '.png';
  base = base.replace(/-[a-z0-9]{7}$/, ''); if (base.length > 32) base = base.slice(0, 32);
  const tag = Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 5);
  return `${base}-${tag}${ext}`;
}
function blobToDataURL(blob) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); }); }

/* ---------- GitHub 저장소 직접 읽기/쓰기 (GitHub Pages 에서 열었을 때) ---------- */
const GH = {
  KEY: 'gyoan:gh',
  cfg: null,
  onPages: false,
  /* kwonyujin119.github.io/test0/ → owner=kwonyujin119, repo=test0 */
  detect() {
    const m = location.hostname.match(/^([^.]+)\.github\.io$/i);
    if (!m) return null;
    const seg = location.pathname.split('/').filter(Boolean);
    const repo = seg.length && !/\.html?$/i.test(seg[0]) ? decodeURIComponent(seg[0]) : m[1] + '.github.io';
    return { owner: m[1], repo, branch: 'main' };
  },
  load() {
    let saved = null; try { saved = JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { }
    const auto = this.detect(); this.onPages = !!auto;
    if (!saved && !auto) return null;
    this.cfg = Object.assign({ branch: 'main', token: '' }, auto || {}, saved || {});
    return this.cfg;
  },
  save(c) { this.cfg = c; localStorage.setItem(this.KEY, JSON.stringify(c)); },
  clear() { localStorage.removeItem(this.KEY); this.cfg = this.detect(); },
  get token() { return (this.cfg && this.cfg.token) || ''; },
  base() { return `https://api.github.com/repos/${this.cfg.owner}/${this.cfg.repo}`; },
  headers(accept) {
    const h = { 'Accept': accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (this.token) h['Authorization'] = 'Bearer ' + this.token;
    return h;
  },
  async api(method, path, body) {
    const h = this.headers(); if (body) h['Content-Type'] = 'application/json';
    const r = await fetch(this.base() + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    if (r.status === 404 && method === 'GET') return null;
    if (!r.ok) {
      let msg = r.status + ' ' + r.statusText; try { const j = await r.json(); if (j.message) msg = j.message; } catch (e) { }
      if (r.status === 401) msg = 'GitHub 토큰이 올바르지 않거나 만료되었습니다';
      else if (r.status === 403 && /rate limit/i.test(msg)) msg = 'GitHub 요청 한도를 넘었습니다. 잠시 후 다시 시도하거나 토큰을 연결하세요';
      else if (r.status === 403 || r.status === 404) msg = '저장소에 쓸 권한이 없습니다 (토큰 권한: Contents → Read and write)';
      const err = new Error(msg); err.status = r.status; throw err;
    }
    if (r.status === 204) return null;
    return r.json();
  },
  /* 파일 내용(텍스트) 읽기 – 캐시 없이 최신 커밋 기준 */
  async raw(path) {
    const r = await fetch(`${this.base()}/contents/${encPath(path)}?ref=${encodeURIComponent(this.cfg.branch)}`, { headers: this.headers('application/vnd.github.raw+json'), cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('GitHub 에서 읽지 못했습니다 (' + r.status + ')');
    return r.text();
  },
  async dir(path) {
    const list = await this.api('GET', `/contents/${encPath(path)}?ref=${encodeURIComponent(this.cfg.branch)}`);
    return Array.isArray(list) ? list.filter(f => f.type === 'file') : [];
  },
  rawUrl(path) { return `https://raw.githubusercontent.com/${this.cfg.owner}/${this.cfg.repo}/${this.cfg.branch}/${encPath(path)}`; },
  /* 여러 파일을 한 커밋으로 반영. changes = [{path, content} | {path, base64} | {path, delete: true}] */
  async commit(message, changes) {
    if (!this.token) { const e = new Error('GitHub 토큰이 연결되어 있지 않아 저장할 수 없습니다. 허브(첫 화면)의 [GitHub 연결] 을 눌러 주세요.'); e.noToken = true; throw e; }
    const br = encodeURIComponent(this.cfg.branch);
    for (let attempt = 0; attempt < 3; attempt++) {
      const ref = await this.api('GET', `/git/ref/heads/${br}`);
      if (!ref) throw new Error(`브랜치 "${this.cfg.branch}" 를 찾을 수 없습니다`);
      const head = ref.object.sha;
      const parent = await this.api('GET', `/git/commits/${head}`);
      const tree = [];
      for (const c of changes) {
        if (c.delete) tree.push({ path: c.path, mode: '100644', type: 'blob', sha: null });
        else if (c.base64 != null) { const b = await this.api('POST', '/git/blobs', { content: c.base64, encoding: 'base64' }); tree.push({ path: c.path, mode: '100644', type: 'blob', sha: b.sha }); }
        else tree.push({ path: c.path, mode: '100644', type: 'blob', content: c.content });
      }
      const nt = await this.api('POST', '/git/trees', { base_tree: parent.tree.sha, tree });
      const nc = await this.api('POST', '/git/commits', { message, tree: nt.sha, parents: [head] });
      try { await this.api('PATCH', `/git/refs/heads/${br}`, { sha: nc.sha }); return nc; }
      catch (e) { if (e.status !== 422 && e.status !== 409) throw e; } // 그 사이 다른 커밋이 들어옴 → 다시 시도
    }
    throw new Error('저장이 계속 충돌합니다. 잠시 후 다시 시도해 주세요.');
  },
  /* 변경을 모아 한 커밋으로: 이미지 여러 장을 연달아 넣어도 커밋 1개, 저장 시 이미지+교안이 커밋 1개 */
  _queue: [], _timer: null, _chain: Promise.resolve(),
  enqueue(change, opts) {
    opts = opts || {};
    return new Promise((res, rej) => {
      this._queue.push({ change, res, rej, message: opts.message });
      clearTimeout(this._timer);
      if (opts.now) this._flush(); else this._timer = setTimeout(() => this._flush(), 700);
    });
  },
  _flush() {
    const items = this._queue.splice(0); if (!items.length) return;
    this._chain = this._chain.then(async () => {
      const main = items.find(x => x.message);
      const imgs = items.filter(x => !x.message).map(x => x.change.path.replace(/^assets\//, ''));
      let msg = main ? main.message : '이미지 추가: ' + imgs.join(', ');
      if (main && imgs.length) msg += ` (+이미지 ${imgs.length})`;
      try { await this.commit(msg, items.map(x => x.change)); items.forEach(x => x.res(true)); }
      catch (e) { items.forEach(x => x.rej(e)); }
    });
    return this._chain;
  },
  /* 연결 확인: 저장소 접근 가능 여부와 쓰기 권한 */
  async check() {
    const repo = await this.api('GET', '');
    if (!repo) throw new Error('저장소를 찾을 수 없습니다: ' + this.cfg.owner + '/' + this.cfg.repo);
    return { ok: true, push: !!(repo.permissions && repo.permissions.push), name: repo.full_name, private: !!repo.private };
  },
};
function encPath(p) { return p.split('/').map(encodeURIComponent).join('/'); }
function blobToBase64(blob) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.onerror = rej; fr.readAsDataURL(blob); });
}

/* ---------- 저장 API (로컬 서버 ↔ GitHub 저장소 ↔ 브라우저 저장소 폴백) ---------- */
const API = {
  mode: 'server', // 'server' | 'github' | 'local'
  blobs: {},      // 방금 올린 이미지를 서버/배포를 기다리지 않고 바로 보여주기 위한 blob URL
  pending: new Map(), // src → 진행 중인 업로드
  failed: new Map(),  // src → blob (실패한 업로드, 저장 때 재시도)
  onPending: null,    // 진행 중 개수가 바뀔 때 알림 (편집기 상태 표시)
  _notify() { if (this.onPending) this.onPending(this.pending.size); },
  /* 이미지를 넣을 때: src 를 즉시 돌려주고 업로드는 뒤에서 진행 */
  async stage(blob, filename) {
    if (this.mode === 'local') return blobToDataURL(blob);
    const src = 'assets/' + uniqueAssetName(filename);
    this.blobs[src] = URL.createObjectURL(blob);
    this._start(src, blob);
    return src;
  },
  _start(src, blob) {
    let p;
    if (this.mode === 'server') {
      p = fetch('api/assets?name=' + encodeURIComponent(src.slice(7)), { method: 'POST', body: blob }).then(r => { if (!r.ok) throw new Error('업로드 실패 (' + r.status + ')'); });
    } else {
      p = blobToBase64(blob).then(b64 => GH.enqueue({ path: src, base64: b64 }));
    }
    p = p.then(() => { this.pending.delete(src); this._notify(); },
      (e) => { this.pending.delete(src); this.failed.set(src, blob); this._notify(); toast('이미지 업로드 실패: ' + e.message + ' — 저장할 때 다시 시도합니다', 4000); });
    this.pending.set(src, p); this._notify();
  },
  _retryFailed() { for (const [src, blob] of Array.from(this.failed)) { this.failed.delete(src); this._start(src, blob); } },
  /* 저장 전에 호출: 실패한 업로드 재시도 + 진행 중인 업로드 완료 대기 */
  async flush() {
    this._retryFailed();
    await Promise.all(Array.from(this.pending.values()));
    if (this.failed.size) throw new Error(`이미지 ${this.failed.size}개를 올리지 못했습니다. 네트워크를 확인하고 다시 저장해 주세요`);
  },
  async init() {
    if (location.protocol === 'file:') { this.mode = 'local'; return this.mode; }
    try {
      const r = await fetch('api/ping', { cache: 'no-store' });
      if (r.ok && (await r.json()).ok) { this.mode = 'server'; return this.mode; }
    } catch (e) { }
    this.mode = GH.load() ? 'github' : 'local';
    return this.mode;
  },
  resolveSrc(src) { return (src && this.blobs[src]) || src; },
  _local() { try { return JSON.parse(localStorage.getItem('gyoan:decks') || '{}'); } catch (e) { return {}; } },
  _saveLocal(all) { localStorage.setItem('gyoan:decks', JSON.stringify(all)); },
  async list() {
    if (this.mode === 'server') { const r = await fetch('api/decks', { cache: 'no-store' }); return r.json(); }
    if (this.mode === 'github') {
      const files = await GH.dir('decks');
      return files.filter(f => /\.json$/i.test(f.name)).map(f => {
        const name = f.name.replace(/\.json$/i, '');
        return { name, title: name, slides: '', theme: '', modified: '', size: f.size, partial: true };
      });
    }
    const all = this._local();
    return Object.keys(all).map(name => ({ name, title: all[name].title || name, slides: (all[name].slides || []).length, theme: all[name].theme || '', modified: all[name].modified || '' }));
  },
  async load(name) {
    if (this.mode === 'server') {
      const r = await fetch('api/decks/' + encodeURIComponent(name), { cache: 'no-store' });
      if (!r.ok) throw new Error('교안을 찾을 수 없습니다: ' + name);
      return r.json();
    }
    if (this.mode === 'github') {
      let text = null;
      // 토큰 없이 Pages 에서 볼 때는 배포된 파일을 직접 읽음 (요청 한도 없음)
      if (!GH.token && GH.onPages) { try { const r = await fetch('decks/' + encodeURIComponent(name) + '.json', { cache: 'no-store' }); if (r.ok) text = await r.text(); } catch (e) { } }
      if (text == null) text = await GH.raw('decks/' + name + '.json');
      if (text == null) throw new Error('교안을 찾을 수 없습니다: ' + name);
      return JSON.parse(text);
    }
    const d = this._local()[name]; if (!d) throw new Error('교안을 찾을 수 없습니다: ' + name); return d;
  },
  async save(name, deck) {
    deck.modified = new Date().toISOString();
    if (this.mode === 'server') {
      await this.flush();
      const r = await fetch('api/decks/' + encodeURIComponent(name), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deck, null, 1) });
      if (!r.ok) throw new Error('저장 실패 (' + r.status + ')');
      return r.json();
    }
    if (this.mode === 'github') {
      this._retryFailed();
      // 큐에 모인 이미지와 교안을 한 커밋으로
      await GH.enqueue({ path: 'decks/' + name + '.json', content: JSON.stringify(deck, null, 1) }, { now: true, message: '교안 저장: ' + (deck.title || name) });
      return { ok: true, name };
    }
    const all = this._local(); all[name] = deck; this._saveLocal(all); return { ok: true };
  },
  async remove(name) {
    if (this.mode === 'server') { const r = await fetch('api/decks/' + encodeURIComponent(name), { method: 'DELETE' }); return r.json(); }
    if (this.mode === 'github') { await GH.commit('교안 삭제: ' + name, [{ path: 'decks/' + name + '.json', delete: true }]); return { ok: true }; }
    const all = this._local(); delete all[name]; this._saveLocal(all); return { ok: true };
  },
  /* (호환용) 올리고 끝날 때까지 기다림 */
  async upload(blob, filename) { const src = await this.stage(blob, filename); await this.flush(); return src; },
  async assets() {
    if (this.mode === 'server') { const r = await fetch('api/assets', { cache: 'no-store' }); return r.json(); }
    if (this.mode === 'github') return (await GH.dir('assets')).map(f => ({ name: f.name, src: 'assets/' + f.name, size: f.size }));
    return [];
  },
};

/* 임시 저장(발표 미리보기용) */
const Draft = {
  key(name) { return 'gyoan:draft:' + name; },
  put(name, deck) { try { localStorage.setItem(this.key(name), JSON.stringify(deck)); } catch (e) { } },
  get(name) { try { return JSON.parse(localStorage.getItem(this.key(name))); } catch (e) { return null; } },
  clear(name) { localStorage.removeItem(this.key(name)); },
};

function qs(k) { return new URLSearchParams(location.search).get(k); }
function toast(msg, ms) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove('show'), ms || 1800);
}
