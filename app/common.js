/* 교안 작업장 공통 모듈
   - 데이터 모델 / 테마 / 레이아웃 / 렌더러 / 저장 API
   - 편집기(editor.js), 발표기(present.js), 허브(hub.js)가 함께 사용 */
'use strict';

const SLIDE_W = 1920, SLIDE_H = 1080;

const FONT_SANS = "'Pretendard Variable', Pretendard, 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
const FONT_SERIF = "'Noto Serif KR', 'Nanum Myeongjo', '나눔명조', Batang, '바탕', serif";
const FONT_MONO = "'Cascadia Code', 'D2Coding', Consolas, 'Courier New', monospace";
/* 글꼴 목록 — 교안 작업장·한글 작업장 공용.
   fam: CSS 글꼴 이름, gf: Google Fonts 이름 (실제로 쓰일 때만 불러옴, 한글은 쓰인 글자 묶음만 내려받음),
   face: 한글(hwpx) 문서에 저장할 글꼴 이름 (그 PC 에 같은 이름의 글꼴이 있으면 한글이 그대로 씀), cat: 분류 */
const FONT_CATS = [['sans', '고딕'], ['serif', '명조'], ['display', '제목·강조'], ['hand', '손글씨'], ['mono', '고정폭']];
const _F = (id, name, fam, gf, cat, face, fb) => ({ id, name, fam, gf, cat, face: face || fam, css: (fam ? `'${fam}', ` : '') + (fb || (cat === 'serif' ? FONT_SERIF : cat === 'mono' ? FONT_MONO : cat === 'hand' ? FONT_SANS.replace(/sans-serif$/, 'cursive') : FONT_SANS)) });
const FONTS = [
  { id: 'sans', name: '프리텐다드 (기본 고딕)', fam: 'Pretendard Variable', cat: 'sans', face: 'Pretendard', css: FONT_SANS },
  _F('noto-sans', '노토 산스 (본고딕)', 'Noto Sans KR', 'Noto+Sans+KR:wght@300;400;500;700;900', 'sans'),
  _F('nanum-gothic', '나눔고딕', 'Nanum Gothic', 'Nanum+Gothic:wght@400;700;800', 'sans', '나눔고딕'),
  _F('dodum', '고운 돋움 (부드러운 고딕)', 'Gowun Dodum', 'Gowun+Dodum', 'sans', '고운돋움'),
  _F('ibm', 'IBM Plex 고딕 (단정함)', 'IBM Plex Sans KR', 'IBM+Plex+Sans+KR:wght@300;400;600;700', 'sans'),
  _F('gothic-a1', '고딕 A1', 'Gothic A1', 'Gothic+A1:wght@300;400;600;800', 'sans'),
  _F('sunflower', '해바라기 고딕', 'Sunflower', 'Sunflower:wght@300;500;700', 'sans'),
  _F('orbit', '오르빗 (둥근 고딕)', 'Orbit', 'Orbit', 'sans'),
  _F('dongle', '동글 (귀여운 고딕)', 'Dongle', 'Dongle:wght@300;400;700', 'sans'),
  _F('serif', '노토 명조 (본명조)', 'Noto Serif KR', 'Noto+Serif+KR:wght@400;700;900', 'serif'),
  _F('nanum-myeongjo', '나눔명조', 'Nanum Myeongjo', 'Nanum+Myeongjo:wght@400;700;800', 'serif', '나눔명조'),
  _F('batang', '고운 바탕 (부드러운 명조)', 'Gowun Batang', 'Gowun+Batang:wght@400;700', 'serif', '고운바탕'),
  _F('hahmlet', '함렛 (현대적 명조)', 'Hahmlet', 'Hahmlet:wght@300;400;600;800', 'serif'),
  _F('song-myung', '송명 (옛 명조)', 'Song Myung', 'Song+Myung', 'serif'),
  _F('diphylleia', '산수국 (가는 명조)', 'Diphylleia', 'Diphylleia', 'serif'),
  _F('blackhan', '검은고딕 (굵은 제목)', 'Black Han Sans', 'Black+Han+Sans', 'display', '검은고딕'),
  _F('dohyeon', '도현 (제목)', 'Do Hyeon', 'Do+Hyeon', 'display'),
  _F('jua', '주아 (둥근 글씨)', 'Jua', 'Jua', 'display'),
  _F('gugi', '구기 (붓 제목)', 'Gugi', 'Gugi', 'display'),
  _F('yeon-sung', '연성 (부드러운 제목)', 'Yeon Sung', 'Yeon+Sung', 'display'),
  _F('stylish', '스타일리시', 'Stylish', 'Stylish', 'display'),
  _F('black-white', '흑백사진 (레트로)', 'Black And White Picture', 'Black+And+White+Picture', 'display'),
  _F('kirang', '기랑해랑 (그림 글씨)', 'Kirang Haerang', 'Kirang+Haerang', 'display'),
  _F('bagel', '베이글 (아주 굵게)', 'Bagel Fat One', 'Bagel+Fat+One', 'display'),
  _F('gasoek', '가석 (굵은 강조)', 'Gasoek One', 'Gasoek+One', 'display'),
  _F('pen', '나눔손글씨 펜', 'Nanum Pen Script', 'Nanum+Pen+Script', 'hand', '나눔손글씨 펜'),
  _F('brush', '나눔손글씨 붓', 'Nanum Brush Script', 'Nanum+Brush+Script', 'hand', '나눔손글씨 붓'),
  _F('gaegu', '개구 (손글씨)', 'Gaegu', 'Gaegu:wght@300;400;700', 'hand'),
  _F('hi-melody', '하이멜로디', 'Hi Melody', 'Hi+Melody', 'hand'),
  _F('poor-story', '서툰 이야기', 'Poor Story', 'Poor+Story', 'hand'),
  _F('gamja', '감자꽃', 'Gamja Flower', 'Gamja+Flower', 'hand'),
  _F('cute', '귀여운 글씨', 'Cute Font', 'Cute+Font', 'hand'),
  _F('single-day', '싱글데이', 'Single Day', 'Single+Day', 'hand'),
  _F('east-sea', '동해 독도 (붓글씨)', 'East Sea Dokdo', 'East+Sea+Dokdo', 'hand'),
  _F('dokdo', '독도 (거친 손글씨)', 'Dokdo', 'Dokdo', 'hand'),
  { id: 'mono', name: '고정폭 (코드)', fam: 'Consolas', cat: 'mono', face: 'Consolas', css: FONT_MONO },
  _F('nanum-coding', '나눔고딕코딩', 'Nanum Gothic Coding', 'Nanum+Gothic+Coding:wght@400;700', 'mono', '나눔고딕코딩'),
];
/* 한글 작업장에서 고를 수 있는 PC 글꼴 (설치된 PC 에서만 그 모양으로 보임 — 사무실 한글 문서에 흔한 글꼴) */
const PC_FONTS = ['함초롬바탕', '함초롬돋움', '맑은 고딕', '바탕', '바탕체', '돋움', '돋움체', '굴림', '굴림체', '궁서', '궁서체', '휴먼명조', '신명조', '견고딕', '중고딕', 'HY헤드라인M', 'HY견고딕', 'HY견명조', 'HY중고딕', 'HY신명조', '한컴 윤고딕 230', '한컴 윤고딕 240', 'Arial', 'Times New Roman', 'Calibri'];
/* 글꼴 이름(한글 문서의 face 나 CSS 이름)으로 목록 항목 찾기 */
function findFontByFace(face) { if (!face) return null; const k = String(face).replace(/\s+/g, '').toLowerCase(); return FONTS.find(f => [f.face, f.fam, f.name].some(n => n && n.replace(/\s+/g, '').toLowerCase() === k)) || null; }
const _fontsLoaded = new Set();
function loadFont(id) {
  const f = FONTS.find(x => x.id === id);
  if (!f || !f.gf || _fontsLoaded.has(id) || typeof document === 'undefined') return;
  _fontsLoaded.add(id);
  const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=' + f.gf + '&display=swap';
  document.head.appendChild(l);
}
/* 글꼴 목록 미리보기용: 그 글꼴 이름 글자만 아주 작게 받아 옴 */
const _fontPreview = new Set();
function loadFontPreview(f) {
  if (!f || !f.gf || _fontsLoaded.has(f.id) || _fontPreview.has(f.id) || typeof document === 'undefined') return;
  _fontPreview.add(f.id);
  const fam = f.gf.split(':')[0];
  const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=' + fam + '&text=' + encodeURIComponent(Array.from(new Set(f.name + '가나다 AaBb123')).join('')) + '&display=swap';
  document.head.appendChild(l);
}
function fontCss(id) { const f = FONTS.find(f => f.id === id); if (!f) return FONT_SANS; loadFont(id); return f.css; }

/* ---------- 테마 ---------- */
const THEMES = [
  { id: 'clean', name: '클린 화이트', bg: '#ffffff', fg: '#1f2937', title: '#111827', accent: '#2563eb', accent2: '#f59e0b', muted: '#6b7280', surface: '#f3f4f6', decor: 'bar-left' },
  { id: 'academic', name: '아카데믹 네이비', bg: '#ffffff', fg: '#1e293b', title: '#1e3a8a', accent: '#1e3a8a', accent2: '#c2410c', muted: '#64748b', surface: '#eef2ff', decor: 'bar-top' },
  { id: 'slate', name: '슬레이트 비즈니스', bg: '#f8fafc', fg: '#334155', title: '#0f172a', accent: '#0f766e', accent2: '#6366f1', muted: '#64748b', surface: '#e2e8f0', decor: 'bar-top', titleFont: 'ibm', bodyFont: 'ibm' },
  { id: 'paper', name: '종이 노트', bg: '#fbfaf6', fg: '#33302a', title: '#1d1b17', accent: '#b45309', accent2: '#2563eb', muted: '#8a8377', surface: '#f1ede2', decor: 'frame', titleFont: 'serif' },
  { id: 'coral', name: '코랄', bg: '#fff7f5', fg: '#3b2723', title: '#2a1714', accent: '#e8505b', accent2: '#0d9488', muted: '#94736c', surface: '#ffe4df', decor: 'band-bottom' },
  { id: 'warm', name: '웜 베이지', bg: '#faf5ea', fg: '#3f3a30', title: '#2b2620', accent: '#c2410c', accent2: '#0f766e', muted: '#857c6c', surface: '#f1e8d6', decor: 'bar-left' },
  { id: 'forest', name: '포레스트', bg: '#f0f7f2', fg: '#1f3326', title: '#14532d', accent: '#15803d', accent2: '#ca8a04', muted: '#5b7262', surface: '#dcebe0', decor: 'bar-top' },
  { id: 'ocean', name: '오션 블루', bg: '#f0f9ff', fg: '#1e3a5f', title: '#0c2a4d', accent: '#0369a1', accent2: '#f97316', muted: '#5b7a99', surface: '#dbeafe', decor: 'corner', bgGradient: 'linear-gradient(160deg, #f0f9ff 0%, #dbeafe 100%)' },
  { id: 'mint', name: '민트 그라데이션', bg: '#ecfeff', fg: '#134e4a', title: '#0f3d3a', accent: '#0d9488', accent2: '#f97316', muted: '#4b7f7a', surface: '#ccfbf1', decor: 'none', bgGradient: 'linear-gradient(160deg, #ecfeff 0%, #d1fae5 100%)' },
  { id: 'navy', name: '다크 네이비', bg: '#0f172a', fg: '#e2e8f0', title: '#ffffff', accent: '#38bdf8', accent2: '#fbbf24', muted: '#94a3b8', surface: '#1e293b', decor: 'bar-left' },
  { id: 'mono', name: '모노 블랙', bg: '#0b0b0c', fg: '#e7e7e7', title: '#ffffff', accent: '#ffffff', accent2: '#f43f5e', muted: '#9a9a9a', surface: '#1c1c1f', decor: 'none' },
  { id: 'bold', name: '볼드 옐로', bg: '#111827', fg: '#e5e7eb', title: '#facc15', accent: '#facc15', accent2: '#38bdf8', muted: '#9ca3af', surface: '#1f2937', decor: 'corner', titleFont: 'blackhan' },
  { id: 'blueprint', name: '블루프린트', bg: '#0b3a6e', fg: '#e0f2fe', title: '#ffffff', accent: '#7dd3fc', accent2: '#fde047', muted: '#a5c8e6', surface: '#124a85', decor: 'grid' },
  { id: 'chalk', name: '칠판', bg: '#26403a', fg: '#f1f5f1', title: '#fde68a', accent: '#fde68a', accent2: '#93c5fd', muted: '#b7c4bd', surface: '#31504a', decor: 'none', bgGradient: 'radial-gradient(ellipse at center, #2d4b44 0%, #203630 100%)' },
  { id: 'plum', name: '플럼 다크', bg: '#1c1023', fg: '#f3e8ff', title: '#ffffff', accent: '#e879f9', accent2: '#fbbf24', muted: '#c4b5d8', surface: '#2e1b3a', decor: 'none', bgGradient: 'linear-gradient(135deg, #1c1023 0%, #2a1440 100%)' },
  { id: 'sunset', name: '선셋', bg: '#1f1235', fg: '#fde7f3', title: '#ffffff', accent: '#fb7185', accent2: '#fbbf24', muted: '#d8b4c8', surface: '#2f1d4a', decor: 'none', bgGradient: 'linear-gradient(135deg, #1f1235 0%, #4a1942 60%, #7c2d4a 100%)' },
];
const THEME_COLOR_KEYS = [['accent', '강조'], ['accent2', '강조 2'], ['title', '제목'], ['fg', '본문'], ['muted', '흐린 글자'], ['surface', '면(카드)'], ['bg', '배경']];
function getTheme(id) { return THEMES.find(t => t.id === id) || THEMES[0]; }
/* 교안의 테마 + 직접 지정한 색·글꼴·장식 (deck.colors / titleFont / bodyFont / decor) */
function deckTheme(deck) {
  const t = Object.assign({}, getTheme(deck && deck.theme));
  const c = (deck && deck.colors) || {};
  for (const [k] of THEME_COLOR_KEYS) if (c[k]) t[k] = c[k];
  if (c.bg) t.bgGradient = '';
  if (deck && deck.titleFont) t.titleFont = deck.titleFont;
  if (deck && deck.bodyFont) t.bodyFont = deck.bodyFont;
  if (deck && deck.decor) t.decor = deck.decor;
  t.titleFont = t.titleFont || 'sans'; t.bodyFont = t.bodyFont || 'sans';
  return t;
}

/* 역할(role)별 텍스트 기본 스타일 — 테마를 바꾸면 함께 바뀜 */
function textDefaults(role, theme) {
  const tf = theme.titleFont || 'sans', bf = theme.bodyFont || 'sans';
  switch (role) {
    case 'title': return { fontSize: 84, color: theme.title, bold: true, lineHeight: 1.2, font: tf };
    case 'subtitle': return { fontSize: 38, color: theme.muted, lineHeight: 1.4, font: bf };
    case 'heading': return { fontSize: 58, color: theme.title, bold: true, lineHeight: 1.25, font: tf };
    case 'body': return { fontSize: 36, color: theme.fg, lineHeight: 1.55, font: bf };
    case 'caption': return { fontSize: 24, color: theme.muted, lineHeight: 1.4, font: bf };
    case 'quote': return { fontSize: 52, color: theme.title, lineHeight: 1.4, font: tf === 'sans' ? 'serif' : tf, italic: tf === 'sans', align: 'center' };
    case 'code': return { fontSize: 28, color: '#e5e7eb', lineHeight: 1.5, font: 'mono', bg: '#1e1e2e', padding: 36, radius: 18 };
    case 'number': return { fontSize: 160, color: theme.accent, bold: true, lineHeight: 1.1, align: 'center', font: tf };
    default: return { fontSize: 36, color: theme.fg, lineHeight: 1.5, font: bf };
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
  const s = { id: uid(), bg: null, transition: '', notes: '', elements: layoutElements(layout || 'blank', fill || {}) };
  if (layout === 'heroImage') { s.bg = { color: '#111111' }; s.decor = 'none'; s.noFooter = true; }
  if (layout === 'agenda') s.decor = 'none';
  return s;
}
const BASE = () => ({ id: uid(), step: 0, anim: 'fade', rotate: 0, opacity: 1 });
function textEl(role, x, y, w, h, html, extra) {
  return Object.assign(BASE(), { type: 'text', role, x, y, w, h, html: html || '', style: {} }, extra || {});
}
function imageEl(x, y, w, h, src, extra) {
  return Object.assign(BASE(), { type: 'image', x, y, w, h, src: src || '', fit: 'contain', radius: 0, shadow: false }, extra || {});
}
function shapeEl(shape, x, y, w, h, extra) {
  return Object.assign(BASE(), { type: 'shape', shape, x, y, w, h, fill: '$accent', stroke: '', strokeWidth: 0, radius: 24, shadow: false, html: '', style: {} }, extra || {});
}
function tableEl(x, y, w, h, rows, extra) {
  return Object.assign(BASE(), { type: 'table', x, y, w, h, rows: rows || [['구분', '내용', '비고'], ['', '', ''], ['', '', '']], header: true, band: true, firstCol: false, lines: 'grid', headFill: '$accent', radius: 0, style: {} }, extra || {});
}
function chartEl(x, y, w, h, kind, data, extra) {
  return Object.assign(BASE(), { type: 'chart', x, y, w, h, kind: kind || 'bar', data: data || '항목,값\n1분기,42\n2분기,58\n3분기,71\n4분기,64', values: true, legend: true, grid: true, unit: '', style: {} }, extra || {});
}
function mathEl(x, y, w, h, tex, extra) {
  return Object.assign(BASE(), { type: 'math', x, y, w, h, tex: tex || 'Q = A \\cdot V', style: {} }, extra || {});
}
function embedEl(x, y, w, h, url, extra) {
  return Object.assign(BASE(), { type: 'embed', x, y, w, h, url: url || '', radius: 16, autoplay: false }, extra || {});
}
const TYPE_NAMES = { text: '텍스트', image: '이미지', shape: '도형', table: '표', chart: '차트', math: '수식', embed: '동영상·웹' };

const LAYOUTS = [
  { id: 'title', name: '표지' },
  { id: 'section', name: '섹션 구분' },
  { id: 'agenda', name: '목차' },
  { id: 'content', name: '소제목 + 본문' },
  { id: 'twoCol', name: '2단 본문' },
  { id: 'threeCards', name: '3단 카드' },
  { id: 'imageRight', name: '본문 + 이미지(우)' },
  { id: 'imageLeft', name: '이미지(좌) + 본문' },
  { id: 'imageFull', name: '큰 이미지 + 캡션' },
  { id: 'heroImage', name: '전면 사진 + 제목' },
  { id: 'twoImages', name: '이미지 2장' },
  { id: 'imageGrid', name: '이미지 4장' },
  { id: 'compare', name: '비교 (A vs B)' },
  { id: 'process', name: '단계 (프로세스)' },
  { id: 'timeline', name: '타임라인' },
  { id: 'summary', name: '핵심 정리 3줄' },
  { id: 'stats', name: '숫자 3개' },
  { id: 'number', name: '핵심 숫자' },
  { id: 'table', name: '표' },
  { id: 'chart', name: '차트 + 설명' },
  { id: 'quote', name: '인용구' },
  { id: 'code', name: '코드' },
  { id: 'closing', name: '마무리 (감사합니다)' },
  { id: 'blank', name: '빈 슬라이드' },
];
const LAYOUT_NAMES = Object.fromEntries(LAYOUTS.map(l => [l.id, l.name]));
const M = 120; // 좌우 여백
function layoutElements(layout, f) {
  const H = f.heading || '소제목을 입력하세요';
  const B = f.body || '<ul><li>첫 번째 내용</li><li>두 번째 내용</li><li>세 번째 내용</li></ul>';
  const head = (y, h) => textEl('heading', M, y || 90, SLIDE_W - M * 2, h || 130, H, { style: { valign: 'middle' } });
  const white = (extra) => Object.assign({ color: '#ffffff' }, extra || {});
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
    case 'agenda': return [
      shapeEl('rect', 0, 0, 660, SLIDE_H, { fill: '$accent', radius: 0 }),
      textEl('caption', M, 400, 460, 60, 'CONTENTS', { style: white({ fontSize: 30, bold: true, letterSpacing: 6 }) }),
      textEl('title', M, 460, 460, 160, f.title || '목차', { style: white({ fontSize: 110 }) }),
      textEl('body', 780, 200, 1020, 700, f.body || '<ol><li>강의 개요</li><li>핵심 개념</li><li>사례와 적용</li><li>정리와 질문</li></ol>', { style: { fontSize: 46, lineHeight: 2.1, valign: 'middle', bold: true } }),
    ];
    case 'content': return [head(), textEl('body', M, 260, SLIDE_W - M * 2, 700, B)];
    case 'twoCol': return [
      head(),
      textEl('body', M, 260, 800, 700, f.body || '<ul><li>왼쪽 내용</li><li>왼쪽 내용</li></ul>'),
      textEl('body', 1000, 260, 800, 700, f.body2 || '<ul><li>오른쪽 내용</li><li>오른쪽 내용</li></ul>'),
    ];
    case 'threeCards': {
      const out = [head()]; const w = 520, gap = 60;
      const icons = ['💡', '🔍', '🎯'], titles = ['첫 번째', '두 번째', '세 번째'];
      for (let i = 0; i < 3; i++) {
        const x = M + i * (w + gap);
        out.push(shapeEl('rect', x, 270, w, 680, { fill: '$surface', radius: 32 }));
        out.push(textEl('text', x, 320, w, 140, icons[i], { style: { fontSize: 100, align: 'center', valign: 'middle', lineHeight: 1 } }));
        out.push(textEl('text', x + 40, 490, w - 80, 80, titles[i] + ' 핵심', { style: { fontSize: 42, bold: true, align: 'center', color: '$title', valign: 'middle' } }));
        out.push(textEl('body', x + 50, 590, w - 100, 320, '짧은 설명을 두세 줄로 적어 주세요.', { style: { fontSize: 30, align: 'center', lineHeight: 1.6 } }));
      }
      return out;
    }
    case 'imageRight': return [head(), textEl('body', M, 260, 820, 700, B), imageEl(1000, 260, 800, 660, f.image || '', { radius: 24, shadow: true })];
    case 'imageLeft': return [head(), imageEl(M, 260, 800, 660, f.image || '', { radius: 24, shadow: true }), textEl('body', 980, 260, 820, 700, B)];
    case 'imageFull': return [
      head(70, 110),
      imageEl(M, 200, SLIDE_W - M * 2, 720, f.image || '', { radius: 20, shadow: true }),
      textEl('caption', M, 940, SLIDE_W - M * 2, 70, f.caption || '그림 1. 캡션을 입력하세요', { style: { align: 'center' } }),
    ];
    case 'heroImage': return [
      imageEl(0, 0, SLIDE_W, SLIDE_H, f.image || '', { fit: 'cover' }),
      shapeEl('rect', 0, 380, SLIDE_W, 700, { fill: '#000000', fill2: '#000000', fill2Op: 0, gAngle: 270, radius: 0, opacity: 0.8 }),
      textEl('title', M, 660, SLIDE_W - M * 2, 180, f.title || '사진 위의 큰 제목', { style: white({ fontSize: 96, valign: 'bottom', tshadow: true }) }),
      textEl('subtitle', M, 850, SLIDE_W - M * 2, 90, f.subtitle || '한 줄 설명', { style: white({ tshadow: true }) }),
    ];
    case 'twoImages': return [
      head(),
      imageEl(M, 260, 810, 560, '', { radius: 20, fit: 'cover' }), imageEl(990, 260, 810, 560, '', { radius: 20, fit: 'cover' }),
      textEl('caption', M, 850, 810, 70, '왼쪽 그림 설명', { style: { align: 'center', fontSize: 30 } }),
      textEl('caption', 990, 850, 810, 70, '오른쪽 그림 설명', { style: { align: 'center', fontSize: 30 } }),
    ];
    case 'imageGrid': {
      const out = [head(60, 110)]; const w = 820, h = 380;
      for (let i = 0; i < 4; i++) out.push(imageEl(M + (i % 2) * (w + 40), 210 + Math.floor(i / 2) * (h + 30), w, h, '', { radius: 16, fit: 'cover' }));
      return out;
    }
    case 'compare': return [
      head(),
      shapeEl('rect', M, 260, 810, 100, { fill: '$accent', radius: 20, html: f.a || 'A', style: { fontSize: 40 } }),
      shapeEl('rect', 990, 260, 810, 100, { fill: '$accent2', radius: 20, html: f.b || 'B', style: { fontSize: 40 } }),
      shapeEl('rect', M, 380, 810, 560, { fill: '$surface', radius: 20 }),
      textEl('body', M + 30, 410, 750, 500, '<ul><li>장점</li><li>특징</li></ul>'),
      shapeEl('rect', 990, 380, 810, 560, { fill: '$surface', radius: 20 }),
      textEl('body', 1020, 410, 750, 500, '<ul><li>장점</li><li>특징</li></ul>'),
    ];
    case 'process': {
      const out = [head()]; const w = 430, stp = 417;
      for (let i = 0; i < 4; i++) {
        const x = M + i * stp;
        out.push(shapeEl('chevron', x, 300, w, 170, { fill: i % 2 ? '$accent2' : '$accent', html: `${i + 1}단계`, style: { fontSize: 40 }, step: i + 1, anim: 'left' }));
        out.push(textEl('body', x + 40, 510, w - 90, 400, '이 단계에서 하는 일', { style: { fontSize: 30, align: 'center' }, step: i + 1, anim: 'up' }));
      }
      return out;
    }
    case 'timeline': {
      const out = [head(), shapeEl('line', M, 560, SLIDE_W - M * 2, 40, { fill: '$muted', strokeWidth: 6 })];
      [0, 1, 2, 3].map(i => M + 140 + i * 466).forEach((cx, i) => {
        out.push(shapeEl('ellipse', cx - 32, 548, 64, 64, { fill: '$accent', stroke: '$bg', strokeWidth: 8 }));
        out.push(textEl('text', cx - 200, 420, 400, 90, String(2021 + i), { style: { fontSize: 48, bold: true, color: '$accent', align: 'center', valign: 'bottom' } }));
        out.push(textEl('body', cx - 200, 640, 400, 260, '이 시기의 중요한 사건', { style: { fontSize: 30, align: 'center' } }));
      });
      return out;
    }
    case 'summary': {
      const out = [head(80, 120)];
      ['첫 번째 핵심 내용을 한 문장으로', '두 번째 핵심 내용을 한 문장으로', '세 번째 핵심 내용을 한 문장으로'].forEach((t, i) => {
        const y = 250 + i * 240;
        out.push(shapeEl('rect', M, y, SLIDE_W - M * 2, 200, { fill: '$surface', radius: 28 }));
        out.push(shapeEl('ellipse', M + 40, y + 40, 120, 120, { fill: '$accent', html: String(i + 1), style: { fontSize: 56 } }));
        out.push(textEl('body', M + 200, y + 20, SLIDE_W - M * 2 - 240, 160, t, { style: { fontSize: 40, valign: 'middle', bold: true, color: '$title' } }));
      });
      return out;
    }
    case 'stats': {
      const out = [head()]; const w = 520, gap = 60;
      [['87%', '만족도'], ['1,240', '참여 인원'], ['3.5×', '성과 향상']].forEach(([n, c], i) => {
        const x = M + i * (w + gap);
        out.push(textEl('number', x, 350, w, 220, n, { style: { fontSize: 130, valign: 'middle' } }));
        out.push(shapeEl('rect', x + w / 2 - 50, 590, 100, 8, { fill: '$accent2', radius: 4 }));
        out.push(textEl('text', x, 630, w, 90, c, { style: { fontSize: 40, bold: true, align: 'center', color: '$title' } }));
        out.push(textEl('caption', x + 30, 730, w - 60, 120, '숫자에 대한 짧은 설명', { style: { align: 'center', fontSize: 28 } }));
      });
      return out;
    }
    case 'number': return [
      textEl('number', M, 260, SLIDE_W - M * 2, 260, f.number || '73%', { style: { valign: 'middle' } }),
      textEl('heading', M, 560, SLIDE_W - M * 2, 120, f.heading || '핵심 수치의 의미', { style: { align: 'center' } }),
      textEl('body', 300, 700, SLIDE_W - 600, 160, f.body || '수치에 대한 설명을 입력하세요', { style: { align: 'center' } }),
    ];
    case 'table': return [head(), tableEl(M, 260, SLIDE_W - M * 2, 620, [['구분', '항목 A', '항목 B'], ['기준 1', '', ''], ['기준 2', '', ''], ['기준 3', '', '']], { firstCol: true })];
    case 'chart': return [
      head(),
      chartEl(M, 250, 1080, 720),
      textEl('body', 1260, 280, 540, 640, '<ul><li>가장 높은 값은 3분기</li><li>전년 대비 증가</li><li>원인과 시사점</li></ul>', { style: { fontSize: 34 } }),
    ];
    case 'quote': return [
      textEl('quote', 200, 300, SLIDE_W - 400, 360, f.quote || '“인용문을 입력하세요.”', { style: { valign: 'middle' } }),
      textEl('caption', 200, 700, SLIDE_W - 400, 60, f.by || '— 출처', { style: { align: 'center', fontSize: 30 } }),
    ];
    case 'code': return [head(), textEl('code', M, 260, SLIDE_W - M * 2, 680, f.code || 'def hello(name):\n    print(f"안녕하세요, {name}")')];
    case 'closing': return [
      textEl('title', M, 340, SLIDE_W - M * 2, 200, f.title || '감사합니다', { style: { align: 'center', valign: 'middle', fontSize: 120 } }),
      shapeEl('rect', SLIDE_W / 2 - 80, 570, 160, 10, { fill: '$accent', radius: 5 }),
      textEl('subtitle', M, 610, SLIDE_W - M * 2, 80, 'Q & A · 질문을 환영합니다', { style: { align: 'center' } }),
      textEl('caption', M, 720, SLIDE_W - M * 2, 60, '이름 · email@university.ac.kr', { style: { align: 'center', fontSize: 28 } }),
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
  const theme = deckTheme(deck);
  const mode = opts.mode || 'present';
  const step = opts.step == null ? Infinity : opts.step;
  const el = document.createElement('div');
  el.className = 'slide theme-' + theme.id + ' mode-' + mode;
  el.style.width = SLIDE_W + 'px'; el.style.height = SLIDE_H + 'px';
  Object.assign(el.style, slideBackground(slide, theme));
  for (const [k] of THEME_COLOR_KEYS) el.style.setProperty('--' + k, theme[k]);
  el.style.fontFamily = fontCss(theme.bodyFont);
  const bg = slide.bg || {};
  if (bg.image && bg.dim) { const d = document.createElement('div'); d.className = 'bg-dim'; d.style.background = `rgba(0,0,0,${bg.dim})`; el.appendChild(d); }
  // 테마 장식 (배경 이미지가 있으면 생략)
  const decor = bg.image ? 'none' : (slide.decor || theme.decor);
  if (decor && decor !== 'none') { const d = document.createElement('div'); d.className = 'decor decor-' + decor; el.appendChild(d); }
  for (const e of slide.elements) {
    const node = renderElement(e, theme, mode);
    if (mode === 'present') applyStepToNode(e, node, step);
    el.appendChild(node);
  }
  // 꼬리말 (슬라이드 번호 / 문구)
  const ft = deck.footer; const idx = deck.slides ? deck.slides.indexOf(slide) : -1;
  if (ft && (ft.num || ft.text) && idx >= 0 && !slide.noFooter && !(ft.skipFirst && idx === 0)) {
    const f = document.createElement('div'); f.className = 'slide-footer';
    f.innerHTML = `<span>${esc(ft.text || '')}</span><span class="ft-num">${ft.num ? (idx + 1) + (ft.total ? ' / ' + deck.slides.length : '') : ''}</span>`;
    el.appendChild(f);
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
  if (e.link) { node.dataset.link = e.link; node.classList.add('has-link'); }
  if (e.hide) node.classList.add('el-hide');
  const fn = RENDERERS[e.type];
  if (fn) fn(e, node, theme, mode);
  return node;
}

/* 요소 종류별 글자 기본값 */
function resolveTextStyle(e, theme) {
  let d;
  const bf = theme.bodyFont || 'sans';
  if (e.type === 'shape') d = { fontSize: 36, color: '#ffffff', bold: true, lineHeight: 1.3, align: 'center', valign: 'middle', font: bf };
  else if (e.type === 'table') d = { fontSize: 30, color: theme.fg, lineHeight: 1.35, align: 'center', font: bf };
  else if (e.type === 'chart') d = { fontSize: 26, color: theme.fg, font: bf };
  else if (e.type === 'math') d = { fontSize: 64, color: theme.fg, align: 'center', valign: 'middle' };
  else d = textDefaults(e.role, theme);
  return Object.assign({}, d, e.style || {});
}
function setFontStyles(box, st, theme) {
  box.style.fontSize = st.fontSize + 'px';
  box.style.color = themeColor(st.color, theme);
  box.style.fontFamily = fontCss(st.font);
  box.style.fontWeight = st.bold ? '700' : '400';
  box.style.fontStyle = st.italic ? 'italic' : 'normal';
  box.style.textDecoration = st.underline ? 'underline' : 'none';
  box.style.lineHeight = st.lineHeight || 1.5;
  box.style.textAlign = st.align || 'left';
  box.style.letterSpacing = st.letterSpacing ? st.letterSpacing + 'px' : '';
  box.style.textShadow = st.tshadow ? '0 4px 18px rgba(0,0,0,.45)' : '';
}
const VALIGN = { middle: 'center', bottom: 'flex-end' };

function applyTextNodeStyle(e, node, theme) {
  const st = resolveTextStyle(e, theme);
  setFontStyles(node, st, theme);
  node.style.justifyContent = VALIGN[st.valign] || 'flex-start';
  node.style.background = st.bg ? themeColor(st.bg, theme) : '';
  node.style.padding = st.padding ? st.padding + 'px' : '';
  node.style.borderRadius = st.radius ? st.radius + 'px' : '';
  node.style.boxShadow = st.shadow ? '0 12px 40px rgba(0,0,0,.18)' : '';
  node.style.border = st.border ? `${st.border}px solid ${themeColor(st.borderColor || '$accent', theme)}` : '';
  if (st.accentBar) node.style.borderLeft = `14px solid ${theme.accent}`;
  if (st.accentBar && !st.padding) node.style.paddingLeft = '28px';
  const inner = node.querySelector('.el-text-inner');
  if (inner) { inner.classList.toggle('pre', st.font === 'mono' || e.role === 'code'); if (st.list) inner.dataset.list = st.list; else delete inner.dataset.list; }
}
/* 글자를 가진 모든 요소(텍스트·도형·표·수식)의 글자 서식 다시 적용 */
function applyElementTextStyle(e, node, theme) {
  if (!node) return;
  if (e.type === 'text') return applyTextNodeStyle(e, node, theme);
  const st = resolveTextStyle(e, theme);
  const box = e.type === 'shape' ? node.querySelector('.shape-text') : node;
  if (!box) return;
  setFontStyles(box, st, theme);
  if (e.type === 'shape' || e.type === 'math') box.style.justifyContent = VALIGN[st.valign] || (e.type === 'shape' ? 'center' : 'flex-start');
  const inner = box.querySelector('.el-text-inner'); if (inner) { if (st.list) inner.dataset.list = st.list; else delete inner.dataset.list; }
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
  let m = e.step || 0;
  if (e.type === 'text' && e.listSteps) {
    const d = document.createElement('div'); d.innerHTML = e.html || '';
    const n = topLevelItems(d).length;
    if (n) m = Math.max(m, listStepBase(e) + n - 1);
  }
  return Math.max(m, e.outStep || 0, e.emStep || 0);
}
const ANIM_CLASSES = ['anim', 'anim-fade', 'anim-up', 'anim-down', 'anim-left', 'anim-right', 'anim-zoom', 'anim-pop', 'anim-wipe', 'anim-blur', 'anim-spin', 'anim-pulse', 'anim-shake', 'anim-glow', 'anim-out'];
/* 발표 단계에 맞게 요소 표시/애니메이션 클래스 적용 */
function applyStepToNode(e, node, step) {
  const s = e.step || 0;
  node.classList.remove('step-hidden', ...ANIM_CLASSES);
  node.style.animationDuration = e.dur ? e.dur + 's' : '';
  node.style.animationDelay = e.delay ? e.delay + 's' : '';
  if (s > step) { node.classList.add('step-hidden'); return; }
  if (e.outStep && step >= e.outStep) { if (step === e.outStep) node.classList.add('anim', 'anim-out'); else node.classList.add('step-hidden'); return; }
  if (e.emStep && step === e.emStep) node.classList.add('anim', 'anim-' + (e.emAnim || 'pulse'));
  else if (s > 0 && s === step && e.anim && e.anim !== 'none') node.classList.add('anim', 'anim-' + e.anim);
  if (e.type === 'text' && e.listSteps) {
    const inner = node.querySelector('.el-text-inner'); if (!inner) return;
    const base = listStepBase(e);
    topLevelItems(inner).forEach((li, i) => {
      const ls = base + i;
      li.classList.remove('step-hidden', ...ANIM_CLASSES);
      if (ls > step) li.classList.add('step-hidden');
      else if (ls === step && step > 0) li.classList.add('anim', 'anim-' + (e.anim && e.anim !== 'none' ? e.anim : 'fade'));
    });
  }
}

const IMG_MASKS = { circle: 'ellipse(50% 50% at 50% 50%)', hexagon: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)', diamond: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)', triangle: 'polygon(50% 0, 100% 100%, 0 100%)', arch: 'inset(0 round 50% 50% 0 0 / 35% 35% 0 0)', blob: 'polygon(32% 3%, 70% 0, 96% 24%, 100% 62%, 80% 93%, 44% 100%, 12% 86%, 0 52%, 8% 18%)' };
function renderImage(e, node, theme, mode) {
  if (e.radius) node.style.borderRadius = e.radius + 'px';
  if (e.shadow) node.style.boxShadow = '0 16px 48px rgba(0,0,0,.25)';
  if (e.border) node.style.border = `${e.border}px solid ${themeColor(e.borderColor || '#ffffff', theme)}`;
  if (e.mask && IMG_MASKS[e.mask]) { node.style.clipPath = IMG_MASKS[e.mask]; node.style.boxShadow = ''; }
  if (!e.src) {
    if (mode !== 'present') { node.classList.add('img-empty'); node.innerHTML = '<div class="img-hint">🖼 이미지<br><small>더블클릭 → 파일 선택 / 붙여넣기 / 드래그</small></div>'; }
    return;
  }
  const img = document.createElement('img');
  img.src = API.resolveSrc(e.src); img.draggable = false; img.alt = ''; img.decoding = 'async';
  if (API.mode === 'github' && !/^(data:|blob:|https?:)/i.test(e.src)) img.onerror = () => { if (img.dataset.fb) return; img.dataset.fb = '1'; img.src = GH.rawUrl(e.src); };
  img.style.objectFit = e.fit || 'contain';
  const cx = e.cropX == null ? 50 : e.cropX, cy = e.cropY == null ? 50 : e.cropY, z = e.zoom || 1;
  img.style.objectPosition = `${cx}% ${cy}%`;
  if (z !== 1 || e.flip) { img.style.transform = `scale(${e.flip ? -z : z}, ${z})`; img.style.transformOrigin = `${cx}% ${cy}%`; }
  const fx = e.fx || {}; const f = [];
  if (fx.b != null && fx.b !== 100) f.push(`brightness(${fx.b}%)`);
  if (fx.c != null && fx.c !== 100) f.push(`contrast(${fx.c}%)`);
  if (fx.s != null && fx.s !== 100) f.push(`saturate(${fx.s}%)`);
  if (fx.sepia) f.push(`sepia(${fx.sepia}%)`);
  if (fx.blur) f.push(`blur(${fx.blur}px)`);
  if (f.length) img.style.filter = f.join(' ');
  node.appendChild(img);
}

function renderShape(e, node, theme, mode) {
  const w = e.w, h = e.h;
  const sw = e.strokeWidth || 0;
  let fill = themeColor(e.fill || 'none', theme) || 'none';
  const stroke = themeColor(e.stroke, theme);
  const dash = e.dash ? ` stroke-dasharray="${Math.max(2, sw || 6) * 2.5} ${Math.max(2, sw || 6) * 1.8}"` : '';
  const strokeAttr = (sw > 0 && stroke ? `stroke="${stroke}" stroke-width="${sw}"` : 'stroke="none"') + dash;
  let defs = '';
  const isLine = e.shape === 'line' || e.shape === 'arrow' || e.shape === 'dline';
  if (e.fill2 && fill !== 'none' && !isLine) {
    const gid = 'g' + uid();
    defs = `<defs><linearGradient id="${gid}" gradientTransform="rotate(${e.gAngle == null ? 90 : e.gAngle} .5 .5)"><stop offset="0" stop-color="${fill}"/><stop offset="1" stop-color="${themeColor(e.fill2, theme)}" stop-opacity="${e.fill2Op == null ? 1 : e.fill2Op}"/></linearGradient></defs>`;
    fill = `url(#${gid})`;
  }
  const r = e.radius || 0, i = sw / 2, W = w - sw, Hh = h - sw;
  const P = (pts) => pts.map(([a, b]) => (i + a * W).toFixed(1) + ',' + (i + b * Hh).toFixed(1)).join(' ');
  const poly = (pts) => `<polygon points="${P(pts)}" fill="${fill}" ${strokeAttr} stroke-linejoin="round"/>`;
  const abs = (pts) => `<polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" ${strokeAttr} stroke-linejoin="round"/>`;
  let body = '';
  switch (e.shape) {
    case 'rect': body = `<rect x="${i}" y="${i}" width="${W}" height="${Hh}" rx="${Math.max(0, Math.min(r, W / 2, Hh / 2))}" fill="${fill}" ${strokeAttr}/>`; break;
    case 'ellipse': body = `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${W / 2}" ry="${Hh / 2}" fill="${fill}" ${strokeAttr}/>`; break;
    case 'triangle': body = poly([[.5, 0], [1, 1], [0, 1]]); break;
    case 'rtriangle': body = poly([[0, 0], [1, 1], [0, 1]]); break;
    case 'diamond': body = poly([[.5, 0], [1, .5], [.5, 1], [0, .5]]); break;
    case 'pentagon': body = poly([[.5, 0], [1, .38], [.81, 1], [.19, 1], [0, .38]]); break;
    case 'hexagon': body = poly([[.25, 0], [.75, 0], [1, .5], [.75, 1], [.25, 1], [0, .5]]); break;
    case 'octagon': body = poly([[.29, 0], [.71, 0], [1, .29], [1, .71], [.71, 1], [.29, 1], [0, .71], [0, .29]]); break;
    case 'parallelogram': body = poly([[.2, 0], [1, 0], [.8, 1], [0, 1]]); break;
    case 'trapezoid': body = poly([[.18, 0], [.82, 0], [1, 1], [0, 1]]); break;
    case 'plus': { const t = .34, a = (1 - t) / 2, b = a + t; body = poly([[a, 0], [b, 0], [b, a], [1, a], [1, b], [b, b], [b, 1], [a, 1], [a, b], [0, b], [0, a], [a, a]]); break; }
    case 'star': {
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - sw, rr = R * 0.45; const pts = [];
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5; const rad = k % 2 ? rr : R; pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]); }
      body = abs(pts); break;
    }
    case 'chevron': { const d = Math.min(h / 2, w * 0.25); body = abs([[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h], [d, h / 2]]); break; }
    case 'blockArrow': { const d = Math.min(w * .45, h * .9); body = abs([[0, h * .28], [w - d, h * .28], [w - d, 0], [w, h / 2], [w - d, h], [w - d, h * .72], [0, h * .72]]); break; }
    case 'doubleArrow': { const d = Math.min(w * .3, h * .9); body = abs([[0, h / 2], [d, 0], [d, h * .28], [w - d, h * .28], [w - d, 0], [w, h / 2], [w - d, h], [w - d, h * .72], [d, h * .72], [d, h]]); break; }
    case 'ring': {
      const ell = (rx, ry) => `M ${w / 2 - rx},${h / 2} a ${rx},${ry} 0 1,0 ${2 * rx},0 a ${rx},${ry} 0 1,0 ${-2 * rx},0 Z`;
      body = `<path fill-rule="evenodd" d="${ell(W / 2, Hh / 2)} ${ell(W / 2 * .62, Hh / 2 * .62)}" fill="${fill}" ${strokeAttr}/>`; break;
    }
    case 'callout': {
      const bh = h * .78, rr = Math.max(0, Math.min(r || 24, W / 2, bh / 2));
      body = `<path d="M ${i + rr},${i} H ${w - i - rr} Q ${w - i},${i} ${w - i},${i + rr} V ${bh - rr} Q ${w - i},${bh} ${w - i - rr},${bh} H ${w * .36} L ${w * .14},${h - i} L ${w * .2},${bh} H ${i + rr} Q ${i},${bh} ${i},${bh - rr} V ${i + rr} Q ${i},${i} ${i + rr},${i} Z" fill="${fill}" ${strokeAttr} stroke-linejoin="round"/>`; break;
    }
    case 'heart': {
      const X = (v) => (i + v * W).toFixed(1), Y = (v) => (i + v * Hh).toFixed(1);
      body = `<path d="M ${X(.5)},${Y(.28)} C ${X(.5)},${Y(.1)} ${X(.3)},${Y(0)} ${X(.16)},${Y(.06)} C ${X(-.02)},${Y(.15)} ${X(-.02)},${Y(.45)} ${X(.12)},${Y(.6)} L ${X(.5)},${Y(1)} L ${X(.88)},${Y(.6)} C ${X(1.02)},${Y(.45)} ${X(1.02)},${Y(.15)} ${X(.84)},${Y(.06)} C ${X(.7)},${Y(0)} ${X(.5)},${Y(.1)} ${X(.5)},${Y(.28)} Z" fill="${fill}" ${strokeAttr} stroke-linejoin="round"/>`; break;
    }
    case 'line': { const t = Math.max(2, sw || 6); const c = stroke || fill; body = `<line x1="${t / 2}" y1="${h / 2}" x2="${w - t / 2}" y2="${h / 2}" stroke="${c}" stroke-width="${t}" stroke-linecap="round"${dash}/>`; break; }
    case 'arrow': case 'dline': {
      const t = Math.max(4, sw || 10); const c = stroke || fill; const head = Math.min(w * 0.35, Math.max(h, t * 3), t * 4);
      const two = e.shape === 'dline';
      body = `<line x1="${two ? head * 0.8 : t / 2}" y1="${h / 2}" x2="${w - head * 0.8}" y2="${h / 2}" stroke="${c}" stroke-width="${t}" stroke-linecap="round"${dash}/>` +
        `<polygon points="${w - head},${h / 2 - head * 0.6} ${w},${h / 2} ${w - head},${h / 2 + head * 0.6}" fill="${c}"/>` +
        (two ? `<polygon points="${head},${h / 2 - head * 0.6} 0,${h / 2} ${head},${h / 2 + head * 0.6}" fill="${c}"/>` : ''); break;
    }
    default: body = `<rect width="${w}" height="${h}" fill="${fill}"/>`;
  }
  if (e.shadow) node.style.filter = 'drop-shadow(0 12px 24px rgba(0,0,0,.25))';
  node.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">${defs}${body}</svg>`;
  // 도형 안 글자 (편집 화면에서는 비어 있어도 상자를 만들어 둠)
  if (!isLine && (e.html || mode === 'edit')) {
    const box = document.createElement('div'); box.className = 'shape-text';
    const inner = document.createElement('div'); inner.className = 'el-text-inner'; inner.innerHTML = e.html || '';
    box.appendChild(inner); node.appendChild(box);
    applyElementTextStyle(e, node, theme);
  }
}
const SHAPES = [
  { id: 'rect', name: '사각형 (모서리 조절)' }, { id: 'ellipse', name: '원 / 타원' }, { id: 'triangle', name: '삼각형' }, { id: 'rtriangle', name: '직각삼각형' },
  { id: 'diamond', name: '마름모' }, { id: 'pentagon', name: '오각형' }, { id: 'hexagon', name: '육각형' }, { id: 'octagon', name: '팔각형' },
  { id: 'parallelogram', name: '평행사변형' }, { id: 'trapezoid', name: '사다리꼴' }, { id: 'star', name: '별' }, { id: 'heart', name: '하트' },
  { id: 'plus', name: '십자 (더하기)' }, { id: 'ring', name: '도넛 (고리)' }, { id: 'callout', name: '말풍선' }, { id: 'chevron', name: '화살 블록 (단계)' },
  { id: 'blockArrow', name: '굵은 화살표' }, { id: 'doubleArrow', name: '양쪽 굵은 화살표' }, { id: 'line', name: '선' }, { id: 'arrow', name: '화살표 선' }, { id: 'dline', name: '양쪽 화살표 선' },
];

/* ---------- 표 ---------- */
function renderTable(e, node, theme, mode) {
  const rows = e.rows && e.rows.length ? e.rows : [['']];
  const t = document.createElement('table');
  t.className = 'tbl lines-' + (e.lines || 'grid') + (e.band ? ' band' : '') + (e.header ? ' has-head' : '') + (e.firstCol ? ' first-col' : '');
  t.style.setProperty('--head', themeColor(e.headFill || '$accent', theme));
  t.style.setProperty('--headfg', themeColor(e.headColor || '#ffffff', theme));
  t.style.setProperty('--line', themeColor(e.lineColor || '$muted', theme));
  const tb = document.createElement('tbody'); t.appendChild(tb);
  rows.forEach((r, ri) => {
    const tr = document.createElement('tr');
    r.forEach((c, ci) => { const td = document.createElement(ri === 0 && e.header ? 'th' : 'td'); td.innerHTML = c || ''; td.dataset.r = ri; td.dataset.c = ci; tr.appendChild(td); });
    tb.appendChild(tr);
  });
  if (e.radius) { node.style.borderRadius = e.radius + 'px'; node.style.overflow = 'hidden'; }
  node.appendChild(t);
  applyElementTextStyle(e, node, theme);
}

/* ---------- 차트 ---------- */
const CHART_KINDS = [['bar', '세로 막대'], ['hbar', '가로 막대'], ['stack', '누적 막대'], ['line', '꺾은선'], ['area', '영역'], ['pie', '원형'], ['donut', '도넛']];
function parseChartData(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const split = (l) => l.split(/\t|,/).map(s => s.trim());
  const num = (s) => { const v = parseFloat(String(s == null ? '' : s).replace(/[^0-9.\-]/g, '')); return isNaN(v) ? 0 : v; };
  if (!lines.length) return { labels: [], series: [] };
  let head = split(lines[0]), body = lines.slice(1).map(split);
  // 첫 줄이 숫자로만 되어 있으면 머리줄이 없는 것으로 봄
  const isYear = (v) => /^(19|20)\d\d$/.test(v);
  if (head.length > 1 && head.slice(1).every(v => v !== '' && /^-?[\d.,]+%?$/.test(v)) && !head.slice(1).every(isYear)) { body = lines.map(split); head = [''].concat(head.slice(1).map((_, i) => '값' + (i ? i + 1 : ''))); }
  return { labels: body.map(r => r[0]), series: head.slice(1).map((name, i) => ({ name, values: body.map(r => num(r[i + 1])) })) };
}
function chartPalette(e, theme) {
  const base = [theme.accent, theme.accent2, '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#64748b', '#ec4899', '#84cc16'];
  if (e.colors && e.colors.length) return e.colors.map(c => themeColor(c, theme)).concat(base);
  return base;
}
function niceScale(min, max) {
  min = Math.min(0, min); max = Math.max(0, max); if (max === min) max = min + 1;
  const rough = (max - min) / 5, p = Math.pow(10, Math.floor(Math.log10(rough))), f = rough / p;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  return { step, min: Math.floor(min / step + 1e-9) * step, max: Math.ceil(max / step - 1e-9) * step };
}
function renderChart(e, node, theme, mode) {
  const st = resolveTextStyle(e, theme);
  const W = e.w, H = e.h, fs = st.fontSize, fg = themeColor(st.color, theme), muted = theme.muted;
  const { labels, series } = parseChartData(e.data);
  const pal = chartPalette(e, theme);
  const fmt = (v) => Number(v.toFixed(2)).toLocaleString('ko-KR') + (e.unit || '');
  const T = (x, y, s, o) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${o || ''}>${esc(s)}</text>`;
  let svg = '';
  const kind = e.kind || 'bar';
  if (!labels.length || !series.length) { svg = T(W / 2, H / 2, '데이터를 입력하세요', `text-anchor="middle" fill="${muted}"`); }
  else if (kind === 'pie' || kind === 'donut') {
    const vals = series[0].values.map(v => Math.max(0, v)); const total = vals.reduce((a, b) => a + b, 0) || 1;
    const legendW = e.legend ? Math.min(W * 0.42, fs * 10) : 0;
    const cx = (W - legendW) / 2, cy = H / 2, R = Math.max(10, Math.min(cx, cy) - fs * 0.6), r0 = kind === 'donut' ? R * 0.58 : 0;
    const p = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
    let a0 = -Math.PI / 2;
    vals.forEach((v, k) => {
      const a1 = a0 + (v / total) * Math.PI * 2; const large = a1 - a0 > Math.PI ? 1 : 0;
      let d;
      if (v / total > 0.9999) d = `M ${p(R, 0)} A ${R},${R} 0 1,1 ${p(R, Math.PI)} A ${R},${R} 0 1,1 ${p(R, 0)}` + (r0 ? ` M ${p(r0, 0)} A ${r0},${r0} 0 1,0 ${p(r0, Math.PI)} A ${r0},${r0} 0 1,0 ${p(r0, 0)}` : '') + ' Z';
      else d = r0 ? `M ${p(R, a0)} A ${R},${R} 0 ${large},1 ${p(R, a1)} L ${p(r0, a1)} A ${r0},${r0} 0 ${large},0 ${p(r0, a0)} Z` : `M ${cx},${cy} L ${p(R, a0)} A ${R},${R} 0 ${large},1 ${p(R, a1)} Z`;
      svg += `<path class="cslice" style="animation-delay:${(k * 0.08).toFixed(2)}s;transform-origin:${cx}px ${cy}px" d="${d}" fill="${pal[k % pal.length]}" stroke="${theme.bg}" stroke-width="${Math.max(2, fs * 0.12)}" fill-rule="evenodd"/>`;
      if (e.values && v / total > 0.04) {
        const am = (a0 + a1) / 2, lr = r0 ? (R + r0) / 2 : R * 0.62;
        svg += T(cx + lr * Math.cos(am), cy + lr * Math.sin(am) + fs * 0.35, Math.round(v / total * 100) + '%', `text-anchor="middle" fill="#fff" font-weight="700" class="cval"`);
      }
      a0 = a1;
    });
    if (kind === 'donut' && e.center) svg += T(cx, cy + fs * 0.55, e.center, `text-anchor="middle" fill="${fg}" font-weight="800" font-size="${fs * 1.6}"`);
    if (e.legend) {
      const lx = W - legendW + fs * 0.5, n = labels.length, lh = fs * 1.6, ly0 = cy - (n * lh) / 2 + lh / 2;
      labels.forEach((l, k) => { const y = ly0 + k * lh; svg += `<rect x="${lx}" y="${(y - fs * 0.45).toFixed(1)}" width="${fs * 0.8}" height="${fs * 0.8}" rx="${fs * 0.15}" fill="${pal[k % pal.length]}"/>` + T(lx + fs * 1.2, y + fs * 0.32, l + (e.values ? '  ' + fmt(vals[k]) : ''), `fill="${fg}"`); });
    }
  } else {
    const horiz = kind === 'hbar', stack = kind === 'stack';
    const legendH = e.legend && series.length > 1 ? fs * 1.8 : 0;
    let lo = 0, hi = 0;
    if (stack) labels.forEach((_, j) => { let ps = 0, ng = 0; series.forEach(s => { const v = s.values[j]; if (v >= 0) ps += v; else ng += v; }); hi = Math.max(hi, ps); lo = Math.min(lo, ng); });
    else series.forEach(s => s.values.forEach(v => { hi = Math.max(hi, v); lo = Math.min(lo, v); }));
    const sc = niceScale(lo, hi);
    const maxLabel = Math.max(...labels.map(l => String(l).length), 1);
    const tickW = Math.max(...[sc.min, sc.max].map(v => fmt(v).length)) * fs * 0.62;
    const padL = horiz ? Math.min(W * 0.32, maxLabel * fs * 0.95 + fs) : tickW + fs * 0.8;
    const padB = fs * 2.1, padT = legendH + fs * (e.values ? 1.6 : 0.8), padR = horiz ? fs * (e.values ? 3.5 : 1) : fs * 0.6;
    const pw = Math.max(10, W - padL - padR), ph = Math.max(10, H - padT - padB);
    const vpos = (v) => horiz ? padL + (v - sc.min) / (sc.max - sc.min) * pw : padT + ph - (v - sc.min) / (sc.max - sc.min) * ph;
    for (let v = sc.min; v <= sc.max + sc.step / 2; v += sc.step) {
      const q = vpos(v);
      if (e.grid !== false) svg += horiz ? `<line x1="${q}" y1="${padT}" x2="${q}" y2="${padT + ph}" stroke="${muted}" stroke-opacity=".28" stroke-width="2"/>` : `<line x1="${padL}" y1="${q}" x2="${padL + pw}" y2="${q}" stroke="${muted}" stroke-opacity=".28" stroke-width="2"/>`;
      /* axis:false — 값이 막대에 직접 붙어 있을 때 눈금 숫자는 중복이라 끌 수 있게 한다 */
      if (e.axis !== false) svg += horiz ? T(q, padT + ph + fs * 1.3, fmt(v), `text-anchor="middle" fill="${muted}" font-size="${fs * 0.85}"`) : T(padL - fs * 0.4, q + fs * 0.32, fmt(v), `text-anchor="end" fill="${muted}" font-size="${fs * 0.85}"`);
    }
    const zero = vpos(0);
    svg += horiz ? `<line x1="${zero}" y1="${padT}" x2="${zero}" y2="${padT + ph}" stroke="${muted}" stroke-width="3"/>` : `<line x1="${padL}" y1="${zero}" x2="${padL + pw}" y2="${zero}" stroke="${muted}" stroke-width="3"/>`;
    const n = labels.length, band = (horiz ? ph : pw) / n;
    labels.forEach((l, j) => {
      const c = (horiz ? padT : padL) + band * (j + 0.5);
      svg += horiz ? T(padL - fs * 0.5, c + fs * 0.35, l, `text-anchor="end" fill="${fg}"`) : T(c, padT + ph + fs * 1.4, l, `text-anchor="middle" fill="${fg}"`);
    });
    if (kind === 'line' || kind === 'area') {
      series.forEach((s, k) => {
        const col = pal[k % pal.length];
        const pts = s.values.map((v, j) => [padL + band * (j + 0.5), vpos(v)]);
        const d = pts.map((q, j) => (j ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
        if (kind === 'area') svg += `<path class="carea" d="${d} L ${pts[pts.length - 1][0].toFixed(1)},${zero} L ${pts[0][0].toFixed(1)},${zero} Z" fill="${col}" fill-opacity=".22"/>`;
        svg += `<path class="cline" pathLength="1" d="${d}" fill="none" stroke="${col}" stroke-width="${Math.max(3, fs * 0.2)}" stroke-linejoin="round" stroke-linecap="round"/>`;
        pts.forEach((q, j) => {
          svg += `<circle class="cdot" style="animation-delay:${(0.5 + j * 0.06).toFixed(2)}s" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${Math.max(4, fs * 0.28)}" fill="${theme.bg}" stroke="${col}" stroke-width="${Math.max(3, fs * 0.16)}"/>`;
          if (e.values) svg += T(q[0], q[1] - fs * 0.7, fmt(s.values[j]), `text-anchor="middle" fill="${fg}" font-weight="700" font-size="${fs * 0.85}" class="cval"`);
        });
      });
    } else {
      const inner = band * 0.72, bw = stack ? inner : inner / series.length;
      labels.forEach((_, j) => {
        let pos = 0, neg = 0;
        series.forEach((s, k) => {
          const v = s.values[j];
          /* pointColors: 막대 하나만 강조하고 나머지는 회색으로 둘 때 쓴다 (없으면 기존대로) */
          const col = (e.pointColors && e.pointColors[j]) ? themeColor(e.pointColors[j], theme) : pal[k % pal.length];
          let a, b;
          if (stack) { if (v >= 0) { a = pos; b = pos + v; pos = b; } else { a = neg; b = neg + v; neg = b; } } else { a = 0; b = v; }
          const off = (horiz ? padT : padL) + band * j + (band - inner) / 2 + (stack ? 0 : k * bw);
          const p1 = vpos(a), p2 = vpos(b), lo2 = Math.min(p1, p2), len = Math.abs(p2 - p1);
          const rad = Math.min(bw * 0.12, 10);
          const delay = `animation-delay:${(j * 0.06 + k * 0.03).toFixed(2)}s`;
          svg += horiz ? `<rect class="cbar-h" style="${delay}" x="${lo2.toFixed(1)}" y="${off.toFixed(1)}" width="${len.toFixed(1)}" height="${(bw * 0.92).toFixed(1)}" rx="${rad}" fill="${col}"/>`
            : `<rect class="cbar" style="${delay}" x="${off.toFixed(1)}" y="${lo2.toFixed(1)}" width="${(bw * 0.92).toFixed(1)}" height="${len.toFixed(1)}" rx="${rad}" fill="${col}"/>`;
          if (e.values && (!stack || len > fs * 1.2)) {
            const vs = fs * 0.85;
            if (stack) svg += horiz ? T(lo2 + len / 2, off + bw * 0.46 + fs * 0.32, fmt(v), `text-anchor="middle" fill="#fff" font-weight="700" font-size="${vs}" class="cval"`) : T(off + bw * 0.46, lo2 + len / 2 + fs * 0.3, fmt(v), `text-anchor="middle" fill="#fff" font-weight="700" font-size="${vs}" class="cval"`);
            else svg += horiz ? T(v >= 0 ? lo2 + len + fs * 0.35 : lo2 - fs * 0.35, off + bw * 0.46 + fs * 0.32, fmt(v), `text-anchor="${v >= 0 ? 'start' : 'end'}" fill="${fg}" font-weight="700" font-size="${vs}" class="cval"`) : T(off + bw * 0.46, v >= 0 ? lo2 - fs * 0.4 : lo2 + len + fs * 1.05, fmt(v), `text-anchor="middle" fill="${fg}" font-weight="700" font-size="${vs}" class="cval"`);
          }
        });
      });
    }
    if (legendH) {
      let x = padL; const y = fs * 0.9;
      series.forEach((s, k) => { svg += `<rect x="${x}" y="${y - fs * 0.55}" width="${fs * 0.8}" height="${fs * 0.8}" rx="${fs * 0.15}" fill="${pal[k % pal.length]}"/>` + T(x + fs * 1.1, y + fs * 0.2, s.name, `fill="${fg}"`); x += fs * 2 + String(s.name).length * fs * 0.95; });
    }
  }
  node.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${esc(fontCss(st.font))}" font-size="${fs}" style="display:block;overflow:visible">${svg}</svg>`;
}

/* ---------- 수식 (KaTeX, 쓰일 때만 불러옴) ---------- */
const KATEX_V = '0.16.11';
let _katexP = null;
function loadKatex() {
  if (window.katex) return Promise.resolve();
  if (_katexP) return _katexP;
  _katexP = new Promise((res, rej) => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://cdn.jsdelivr.net/npm/katex@${KATEX_V}/dist/katex.min.css`; document.head.appendChild(l);
    const s = document.createElement('script'); s.src = `https://cdn.jsdelivr.net/npm/katex@${KATEX_V}/dist/katex.min.js`;
    s.onload = () => res(); s.onerror = () => { _katexP = null; rej(new Error('수식 도구를 불러오지 못했습니다 (인터넷 연결 확인)')); };
    document.head.appendChild(s);
  });
  return _katexP;
}
function renderMath(e, node, theme, mode) {
  const box = document.createElement('div'); box.className = 'math-box';
  node.appendChild(box);
  applyElementTextStyle(e, node, theme);
  const draw = () => { try { box.innerHTML = window.katex.renderToString(e.tex || '', { displayMode: true, throwOnError: false, output: 'html' }); box.classList.remove('math-pending'); } catch (err) { box.textContent = e.tex || ''; } };
  if (window.katex) draw();
  else { box.textContent = e.tex || ''; box.classList.add('math-pending'); loadKatex().then(draw, () => { }); }
}

/* ---------- 동영상 · 웹 페이지 ---------- */
function parseEmbed(url) {
  url = String(url || '').trim();
  let m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (m) { const t = url.match(/[?&](?:t|start)=(\d+)/); return { kind: 'youtube', id: m[1], start: t ? +t[1] : 0 }; }
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/); if (m) return { kind: 'vimeo', id: m[1] };
  if (/\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i.test(url)) return { kind: 'video', src: url };
  if (/^https?:\/\//i.test(url)) return { kind: 'web', src: url };
  return { kind: 'none' };
}
function renderEmbed(e, node, theme, mode) {
  const p = parseEmbed(e.url);
  if (e.radius) node.style.borderRadius = e.radius + 'px';
  if (e.shadow) node.style.boxShadow = '0 16px 48px rgba(0,0,0,.25)';
  const live = mode === 'present' && window.GYOAN_LIVE;
  if (live && p.kind !== 'none') {
    if (p.kind === 'video') {
      const v = document.createElement('video'); v.src = API.resolveSrc(p.src); v.controls = true; v.playsInline = true; v.preload = 'metadata';
      if (e.autoplay) v.autoplay = true; if (e.loop) v.loop = true; if (e.muted) v.muted = true;
      node.appendChild(v); return;
    }
    const f = document.createElement('iframe');
    if (p.kind === 'youtube') f.src = `https://www.youtube-nocookie.com/embed/${p.id}?rel=0&modestbranding=1&playsinline=1${p.start ? '&start=' + p.start : ''}${e.autoplay ? '&autoplay=1' : ''}${e.muted ? '&mute=1' : ''}${e.loop ? '&loop=1&playlist=' + p.id : ''}`;
    else if (p.kind === 'vimeo') f.src = `https://player.vimeo.com/video/${p.id}${e.autoplay ? '?autoplay=1' : ''}`;
    else f.src = p.src;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write'; f.allowFullscreen = true; f.referrerPolicy = 'strict-origin-when-cross-origin';
    node.appendChild(f); return;
  }
  // 편집 / 미리보기 / 인쇄: 가벼운 대체 화면
  const ph = document.createElement('div'); ph.className = 'embed-ph';
  if (p.kind === 'youtube') ph.style.backgroundImage = `url("https://i.ytimg.com/vi/${p.id}/hqdefault.jpg")`;
  const label = { youtube: 'YouTube', vimeo: 'Vimeo', video: '동영상 파일', web: '웹 페이지', none: '동영상·웹 주소를 넣으세요' }[p.kind];
  ph.innerHTML = `<div class="embed-play">${p.kind === 'web' ? '🌐' : '▶'}</div><div class="embed-label">${esc(label)}${p.kind === 'web' ? '<br><small>' + esc(p.src.slice(0, 70)) + '</small>' : ''}${mode === 'edit' ? '<br><small>발표 화면에서 재생됩니다</small>' : ''}</div>`;
  node.appendChild(ph);
}

const RENDERERS = { text: renderText, image: renderImage, shape: renderShape, table: renderTable, chart: renderChart, math: renderMath, embed: renderEmbed };

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
  /* 연결 창 (교안 허브·편집기·업무 공간 공통). 결과: true=연결됨, 'cleared'=해제, false=취소 */
  connect(opts) {
    opts = opts || {};
    return new Promise(done => {
      const c = this.cfg || this.detect() || { owner: 'kwonyujin119', repo: 'test0', branch: 'main', token: '' };
      const bg = document.createElement('div'); bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal" style="width:560px;max-width:94vw">
      <h3>GitHub 저장소에 바로 저장</h3>
      ${opts.reason ? `<p style="margin:0 0 10px;font-size:13.5px;line-height:1.55;color:#fde68a">${esc(opts.reason)}</p>` : ''}
      <p class="muted" style="margin:0 0 12px;font-size:13px;line-height:1.55">토큰은 보안을 위해 <b>사이트에 넣어 두지 않고</b>, 지금 쓰는 <b>이 기기 · 이 브라우저(또는 설치한 앱)</b>에만 저장됩니다.
      그래서 휴대폰, 다른 PC, 다른 브라우저에서는 처음 한 번씩 다시 넣어야 합니다. 한 번 넣으면 교안 작업장과 한글 작업장이 함께 씁니다.</p>
      <div class="row"><label style="width:70px">저장소</label><input type="text" id="ghOwner" placeholder="사용자" value="${esc(c.owner)}" style="flex:1;min-width:0"> <span>/</span> <input type="text" id="ghRepo" placeholder="저장소" value="${esc(c.repo)}" style="flex:1;min-width:0"></div>
      <div class="row"><label style="width:70px">브랜치</label><input type="text" id="ghBranch" value="${esc(c.branch || 'main')}" style="width:140px"></div>
      <div class="row"><label style="width:70px">토큰</label><input type="password" id="ghToken" placeholder="github_pat_… 또는 ghp_… 붙여넣기" value="" style="flex:1;min-width:0" autocomplete="off"></div>
      <details class="gh-howto"${c.token ? '' : ' open'}>
        <summary><b>토큰 만드는 법</b> (한 번만, 만든 토큰은 메모해 두면 다른 기기에서도 그대로 씁니다)</summary>
        <ol>
          <li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a> 를 엽니다.</li>
          <li>Token name 에 <code>gyoan</code>, Expiration 은 넉넉히(예: 1년).</li>
          <li><b>Repository access</b> → <i>Only select repositories</i> → <code>${esc(c.repo || 'test0')}</code> 선택.</li>
          <li><b>Permissions</b> → Repository permissions → <b>Contents</b> → <i>Read and write</i>.</li>
          <li><i>Generate token</i> 을 누르고 나온 문자열을 위 칸에 붙여넣습니다.</li>
        </ol>
      </details>
      <div class="actions">
        ${c.token ? '<button class="btn ghost danger" id="ghClear">연결 해제</button>' : ''}
        <span class="spacer" style="flex:1"></span>
        <button class="btn" id="ghCancel">${opts.cancelText || '나중에'}</button>
        <button class="btn primary" id="ghOk">연결</button>
      </div></div>`;
      document.body.appendChild(bg);
      const $ = (id) => bg.querySelector('#' + id);
      const close = (v) => { bg.remove(); done(v); };
      bg.onclick = (ev) => { if (ev.target === bg) close(false); };
      bg.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') close(false); else if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') $('ghOk').click(); });
      $('ghCancel').onclick = () => close(false);
      if ($('ghClear')) $('ghClear').onclick = () => { if (confirm('이 기기에 저장된 GitHub 토큰을 지울까요?')) { this.clear(); close('cleared'); } };
      $('ghOk').onclick = async () => {
        const cfg = { owner: $('ghOwner').value.trim(), repo: $('ghRepo').value.trim(), branch: $('ghBranch').value.trim() || 'main', token: $('ghToken').value.trim().replace(/\s+/g, '') };
        if (!cfg.owner || !cfg.repo) { alert('저장소 이름을 입력하세요'); return; }
        if (!cfg.token) { $('ghToken').focus(); toast('토큰을 붙여넣어 주세요'); return; }
        $('ghOk').disabled = true; $('ghOk').textContent = '확인 중…';
        const prev = this.cfg; this.cfg = cfg;
        try {
          const r = await this.check();
          if (!r.push) throw new Error('이 토큰으로는 저장소에 쓸 수 없습니다. 토큰 권한에서 Contents → Read and write 를 확인하세요.');
          this.save(cfg); toast('GitHub 에 연결했습니다 — 이 기기에서는 다시 넣지 않아도 됩니다', 2600); close(true);
        } catch (e) { this.cfg = prev; alert('연결 실패: ' + e.message); $('ghOk').disabled = false; $('ghOk').textContent = '연결'; }
      };
      setTimeout(() => $('ghToken').focus(), 50);
    });
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
  queuing: new Set(), // GitHub 커밋 큐에 아직 들어가지 않은 이미지 (base64 변환 중)
  failed: new Map(),  // src → blob (실패한 업로드, 저장 때 재시도)
  onPending: null,    // 진행 중 개수가 바뀔 때 알림 (편집기 상태 표시)
  _notify() { if (this.onPending) this.onPending(this.pending.size); },
  /* 이미지를 넣을 때: src 를 즉시 돌려주고 업로드는 뒤에서 진행 */
  async stage(blob, filename) {
    if (this.mode === 'local' || (this.mode === 'github' && !GH.token)) return blobToDataURL(blob); // 연결 전: 교안 안에 넣어 두고, 연결 후 저장할 때 올림
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
      // 큐에 들어가기까지(base64 변환)를 따로 기억 → 교안 저장이 이 이미지를 기다렸다가 같은 커밋에 담음
      let enq = null;
      const queued = blobToBase64(blob).then(b64 => { enq = GH.enqueue({ path: src, base64: b64 }); });
      this.queuing.add(queued); const off = () => this.queuing.delete(queued); queued.then(off, off);
      p = queued.then(() => enq);
    }
    p = p.then(() => { this.pending.delete(src); this._notify(); },
      (e) => { this.pending.delete(src); this.failed.set(src, blob); this._notify(); if (!e.noToken && e.status !== 401) toast('이미지 업로드 실패: ' + e.message + ' — 저장할 때 다시 시도합니다', 4000); });
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
      if (!GH.token) { const e = new Error('이 기기에는 아직 GitHub 연결이 없습니다'); e.noToken = true; throw e; }
      await this._liftImages(deck);
      this._retryFailed();
      await Promise.all(Array.from(this.queuing)).catch(() => { }); // 방금 옮긴 이미지가 큐에 다 들어갈 때까지 (교안이 이미지보다 먼저 올라가지 않게)
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
  /* 연결 전에 교안 안에 넣어 둔 이미지(data:)를 저장소 이미지 파일로 옮김 */
  async _liftImages(deck) {
    const jobs = [];
    for (const s of deck.slides || []) {
      if (s.bg && /^data:image\//.test(s.bg.image || '')) jobs.push([s.bg, 'image']);
      for (const e of s.elements || []) if (/^data:image\//.test(e.src || '')) jobs.push([e, 'src']);
    }
    for (const [o, k] of jobs) {
      const blob = await (await fetch(o[k])).blob();
      const ext = ({ 'image/jpeg': '.jpg', 'image/svg+xml': '.svg', 'image/gif': '.gif', 'image/webp': '.webp' })[blob.type] || '.png';
      o[k] = await this.stage(blob, 'image' + ext);
    }
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
