/* 교안(JSON) 한 장을 화면에 그리는 공통 코드 — 형식은 docs/format.md */
(function () {
  const W = 1920, H = 1080;
  function el(tag, cls) { const n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function drawSlide(slide, step) {
    const s = el('div', 'slide');
    s.style.background = (slide.bg && slide.bg.color) || '#ffffff';
    if (slide.bg && slide.bg.image) { s.style.backgroundImage = `url("${slide.bg.image}")`; s.style.backgroundSize = 'cover'; s.style.backgroundPosition = 'center'; }
    for (const e of slide.elements || []) {
      const n = el('div', 'el el-' + e.type);
      Object.assign(n.style, { left: e.x + 'px', top: e.y + 'px', width: e.w + 'px', height: e.h + 'px' });
      if (e.type === 'text') {
        n.innerHTML = e.text;
        Object.assign(n.style, { fontSize: (e.size || 40) + 'px', color: e.color || '#111', fontWeight: e.bold ? 700 : 400, textAlign: e.align || 'left', lineHeight: e.lineHeight || 1.35 });
      } else if (e.type === 'image') {
        const i = el('img'); i.src = e.src; i.alt = e.alt || ''; i.style.objectFit = e.fit || 'cover'; n.appendChild(i);
        if (e.radius) n.style.borderRadius = e.radius + 'px';
      } else if (e.type === 'shape') {
        Object.assign(n.style, { background: e.fill || '#ddd', borderRadius: (e.shape === 'circle' ? '50%' : (e.radius || 0) + 'px'), opacity: e.opacity == null ? 1 : e.opacity });
      }
      const st = e.step || 0;
      if (step != null && st > step) n.classList.add('hidden');
      else if (step != null && st > 0 && st === step) n.classList.add('appear');
      s.appendChild(n);
    }
    return s;
  }
  /* 상자(box) 크기에 맞춰 16:9 로 꽉 차게 */
  function fit(box, slideNode) {
    const k = Math.min(box.clientWidth / W, box.clientHeight / H);
    slideNode.style.transform = `translate(${(box.clientWidth - W * k) / 2}px, ${(box.clientHeight - H * k) / 2}px) scale(${k})`;
  }
  function maxStep(slide) { return Math.max(0, ...(slide.elements || []).map(e => e.step || 0)); }
  window.PT = { drawSlide, fit, maxStep, W, H };
})();
