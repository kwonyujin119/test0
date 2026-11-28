/* SECRET — 화면 효과 (app/secret/secret.css 「전면 개선」과 함께, secret.js 뒤에 불러옴)
   0번 교안 상위 효과만 씀: 숫자 세기 · 바뀐 숫자 강조 맥박 · 차트 닦아내며 그려지기 · 진행 막대 + 지난 시간 · 근거 칩 +N
   - secret.js 의 그리기 함수는 그대로 두고, 화면에 새로 붙은 요소를 보고 효과만 얹는다 (이 파일이 없어도 기능은 그대로)
   - transform · opacity 위주, 동작 줄이기(prefers-reduced-motion)면 숫자는 바로 최종값 · 움직임 없음 */
'use strict';
(() => {
  const root = document.querySelector('.sc-main'); if (!root) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. 숫자 세기 + 바뀐 숫자 맥박 ----------
     같은 자리(화면 · 이름표 · 종목)의 숫자를 기억해 두고
     · 처음 보는 자리: 0 → 값 (0.7초)
     · 값이 바뀐 자리: 이전 값 → 새 값 (0.45초) + 오름/내림 색 맥박 한 번
     · 같은 값: 아무것도 안 함 (다시 그려도 깜빡이지 않게) */
  /* .sc-sum b 는 app/motion.js 「숫자 바뀜」이 맡으므로 여기서는 건드리지 않음 (둘이 같은 글자를 고쳐 다투지 않게) */
  const NUMS = [
    /* [고를 것, 자리 이름, 처음 볼 때도 0부터 셀지] — 표 칸은 바뀔 때만 (줄마다 세면 어지러움) */
    ['.td-tile > b', b => b.parentNode.querySelector('span') && b.parentNode.querySelector('span').textContent, true],
    ['.fx-kpi [data-fx-n]', b => b.dataset.fxN, true],
    ['#wTable td.px, #wTable td.chg, #wTable td[data-l="평가 손익"], #wTable td[data-l="수익률"]', b => { const r = b.closest('tr'), s = r && r.querySelector('[data-open]'); return (s ? s.dataset.open : '') + '|' + (b.dataset.l || b.className); }, false],
  ];
  const last = new Map();
  const RX = /^([^\d+\-−]*?)([+\-−]?)(\d[\d,]*(?:\.\d+)?)(.*)$/s;
  function parse(t) {
    const m = String(t).trim().match(RX); if (!m) return null;
    const raw = m[3], dec = (raw.split('.')[1] || '').length, v = parseFloat(raw.replace(/,/g, '')) * (m[2] === '-' || m[2] === '−' ? -1 : 1);
    if (!isFinite(v)) return null;
    return { pre: m[1], sign: m[2], v, dec, comma: raw.includes(','), post: m[4] };
  }
  const fmt = (p, v) => {
    const a = Math.abs(v), s = p.comma ? a.toLocaleString('en-US', { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec }) : a.toFixed(p.dec);
    const sg = v < 0 ? (p.sign === '−' ? '−' : '-') : p.sign === '+' ? '+' : '';
    return p.pre + sg + s + p.post;
  };
  const ease = t => 1 - Math.pow(1 - t, 3);
  function run(el, from, p, ms) {
    const final = el.textContent, t0 = performance.now();
    el.classList.add('fx-counting');
    const step = now => {
      if (!el.isConnected || el.textContent !== el._fxShown) return; // 그새 다시 그려졌으면 멈춤
      const k = Math.min(1, (now - t0) / ms), v = from + (p.v - from) * ease(k);
      el._fxShown = el.textContent = k < 1 ? fmt(p, v) : final;
      if (k < 1) requestAnimationFrame(step); else el.classList.remove('fx-counting');
    };
    el._fxShown = el.textContent = fmt(p, from);
    requestAnimationFrame(step);
  }
  function pulse(el, dir) {
    if (RM.matches) return;
    const host = el.closest('.sc-sum > div, .td-tile, td') || el;
    host.classList.remove('fx-pulse', 'fx-up', 'fx-down'); void host.offsetWidth;
    host.classList.add('fx-pulse', dir > 0 ? 'fx-up' : 'fx-down');
    setTimeout(() => host.classList.remove('fx-pulse', 'fx-up', 'fx-down'), 900);
  }
  function numbers(scope) {
    if (!scope.querySelectorAll) return;
    for (const [sel, keyOf, first] of NUMS) for (const el of [...(scope.matches(sel) ? [scope] : []), ...scope.querySelectorAll(sel)]) {
      if (el.children.length && !el.matches('td')) continue;
      if (el.matches('td') && el.querySelector('*')) continue;
      if (el.classList.contains('fx-counting')) continue; // 세는 중 (내가 쓴 글자)
      const txt = el.textContent;
      if (el._fxSeen === txt || el._fxShown === txt) continue; el._fxSeen = txt;
      const p = parse(txt);
      const v = el.closest('.sc-view'), key = (v ? v.id : '') + '|' + (keyOf(el) || '').trim();
      if (!p) { last.delete(key); continue; }
      const had = last.has(key), prev = last.get(key); last.set(key, p.v);
      if (RM.matches || (had && prev === p.v)) continue;
      if (!had) { if (first && (Math.abs(p.v) >= 1 || p.dec)) run(el, 0, p, 700); }
      else { run(el, prev, p, 450); pulse(el, p.v - prev); }
    }
  }

  /* ---------- 2. 차트 그려지기 (닦아내기) ----------
     새로 붙은 차트 SVG 에 한 번만: 왼쪽에서 오른쪽으로 드러남 · 막대는 바닥에서 자람 (같은 차트를 다시 그리면 안 함) */
  const drawn = new Set();
  function charts(scope) {
    if (RM.matches || !scope.querySelectorAll) return;
    for (const svg of scope.querySelectorAll('svg:not(.ico)')) {
      if (svg._fxDrawn || svg.closest('.ws-hero, .modal')) continue; svg._fxDrawn = 1;
      const r = svg.getBoundingClientRect(); if (r.width < 120 || r.height < 40) continue;
      const key = (svg.closest('[id]') || {}).id + '|' + (svg.getAttribute('aria-label') || svg.getAttribute('viewBox') || '');
      if (drawn.has(key)) continue; drawn.add(key);
      svg.classList.add('fx-draw');
      setTimeout(() => svg.classList.remove('fx-draw'), 900);
    }
  }

  /* ---------- 3. AI: 지난 시간 (1초마다) · 근거 칩 +N ---------- */
  const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  setInterval(() => {
    for (const el of document.querySelectorAll('.fx-el[data-t0]')) el.textContent = clock(Math.max(0, Math.floor((Date.now() - +el.dataset.t0) / 1000)));
  }, 1000);
  document.addEventListener('click', e => {
    const b = e.target.closest('.sc-src .fx-more'); if (!b) return;
    const box = b.closest('.sc-src'), open = box.classList.toggle('open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    b.textContent = open ? '접기' : b.dataset.more;
  });

  /* ---------- 4. 입장: 맨 위 「SECRET」 글자 섞였다 맞춰지기 → app/motion.js 「작업장 제목 스크램블」로 옮김 (세 작업장 공용) ---------- */

  /* ---------- 지켜보기 ---------- */
  let q = new Set(), raf = 0;
  const flush = () => { raf = 0; const list = [...q]; q = new Set(); for (const n of list) if (n.isConnected) { numbers(n); charts(n); } };
  new MutationObserver(ms => {
    for (const m of ms) {
      const t = m.type === 'characterData' ? m.target.parentElement : m.target;
      if (t && t.nodeType === 1 && !t.classList.contains('fx-counting') && !(t.closest && t.closest('.fx-counting'))) q.add(t);
    }
    if (q.size && !raf) raf = requestAnimationFrame(flush);
  }).observe(root, { childList: true, subtree: true, characterData: true });
  numbers(root); charts(root);
})();
