/* DPV 인터랙션 레이어 — 모든 작업장이 함께 쓰는 움직임 · 안내 부품 (docs/dpv-ui-motion.md)
   · 나타나기(페이드 업 + 스태거): 처음 보이는 카드 목록만. 다시 그릴 때마다 움직이지 않게, 화면을 연 직후 잠깐만 켠다
   · 툴팁: 아이콘만 있는 단추의 title 을 즉시 · 같은 모양으로 (마우스 · 키보드 초점, Esc 로 닫힘, 위에 올려도 안 사라짐)
   · 읽기 진행 바: 긴 화면(레퍼런스 · 단축키 · 긴 보고서)을 내릴 때 위쪽 가는 막대
   · 모달 → 휴대폰에서는 바텀시트(CSS) + 손잡이를 아래로 끌어 닫기
   · 코치마크: 새 기능을 처음 한 번만 짚어 줌 (DPV.coach)
   · 확인 · 알림 창: 브라우저 기본 창 대신 같은 모양의 창 (DPV.confirm / DPV.alert)
   움직임을 줄이도록 설정한 기기(prefers-reduced-motion)에서는 나타나기 · 코치마크 움직임을 모두 끈다. */
'use strict';
(() => {
  if (window.DPV && window.DPV.ready) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)');
  const PHONE = matchMedia('(max-width: 640px)');
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 1. 나타나기 (페이드 업 + 스태거) ---------- */
  const REVEAL = '.ws-card, .ws-banner, .deck-card:not(.ghost), .doc-card:not(.ghost), .sc-card, .en-c, .sc-ref, .sc-sum > div, .td-grid > section, .sc-reco-i, .sc-apis > *, [data-reveal]';
  let io = null, mo = null, winTimer = 0;
  const done = new WeakSet(), seenViews = new WeakSet();
  function settle(el) { el.classList.remove('rv', 'rv-in'); el.style.removeProperty('--rv-d'); }
  function prime(root) {
    if (RM.matches || !('IntersectionObserver' in window)) return;
    io = io || new IntersectionObserver(es => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        const el = e.target; io.unobserve(el);
        el.classList.add('rv-in');
        setTimeout(() => settle(el), 520 + (parseInt(el.style.getPropertyValue('--rv-d')) || 0));
      }
    }, { rootMargin: '0px 0px -6% 0px' });
    const per = new Map();
    for (const el of (root || document).querySelectorAll(REVEAL)) {
      if (done.has(el) || el.closest('.modal, .menu, #coach')) continue;
      done.add(el);
      const n = per.get(el.parentNode) || 0; per.set(el.parentNode, n + 1);
      el.style.setProperty('--rv-d', Math.min(n, 6) * 35 + 'ms');
      el.classList.add('rv'); io.observe(el);
    }
  }
  /* 화면을 연 직후 1.6초 동안만 새로 붙는 카드(비동기로 그리는 목록)도 나타나게 */
  function openWindow(root, ms) {
    if (RM.matches) return;
    prime(root);
    if (!('MutationObserver' in window)) return;
    if (mo) mo.disconnect();
    let raf = 0;
    mo = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; prime(root); }); });
    mo.observe(root || document.body, { childList: true, subtree: true });
    clearTimeout(winTimer);
    winTimer = setTimeout(() => { mo && mo.disconnect(); mo = null; }, ms || 1600);
  }
  /* 안전망: 무엇이 잘못돼도 3초 뒤엔 모두 보이게 */
  setInterval(() => { document.querySelectorAll('.rv:not(.rv-in)').forEach(el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) settle(el); }); }, 3000);

  /* ---------- 2. 툴팁 ---------- */
  let tip = null, tipFor = null, tipT = 0, hideT = 0;
  const TIPPABLE = 'button[title], a[title], [role="button"][title], [data-tip]';
  function tipText(el) { return el.getAttribute('data-tip') || ''; }
  function adopt(el) { // title → data-tip (브라우저 기본 툴팁이 겹치지 않게). 접근성 이름은 유지
    const t = el.getAttribute('title'); if (!t) return;
    if (!el.getAttribute('aria-label') && !el.textContent.trim()) el.setAttribute('aria-label', t);
    el.setAttribute('data-tip', t); el.removeAttribute('title');
  }
  function placeTip() {
    if (!tip || !tipFor) return;
    const r = tipFor.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, m = 8;
    let top = r.top - h - m, below = false;
    if (top < 6) { top = r.bottom + m; below = true; }
    let left = r.left + r.width / 2 - w / 2; left = Math.max(6, Math.min(innerWidth - w - 6, left));
    tip.style.left = left + 'px'; tip.style.top = top + 'px'; tip.classList.toggle('below', below);
    tip.style.setProperty('--ax', (r.left + r.width / 2 - left) + 'px');
  }
  function showTip(el, now) {
    clearTimeout(tipT); clearTimeout(hideT);
    const go = () => {
      const t = tipText(el); if (!t || !el.isConnected) return;
      if (!tip) { tip = document.createElement('div'); tip.id = 'dpvTip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); tip.addEventListener('mouseenter', () => clearTimeout(hideT)); tip.addEventListener('mouseleave', () => hideTip()); }
      tipFor = el; tip.textContent = t; tip.classList.add('show'); placeTip();
      el.setAttribute('aria-describedby', 'dpvTip');
    };
    if (now || (tip && tip.classList.contains('show'))) go(); else tipT = setTimeout(go, 450);
  }
  function hideTip(soon) {
    clearTimeout(tipT);
    const h = () => { if (tip) tip.classList.remove('show'); if (tipFor) tipFor.removeAttribute('aria-describedby'); tipFor = null; };
    if (soon) { clearTimeout(hideT); hideT = setTimeout(h, 120); } else h();
  }
  document.addEventListener('mouseover', e => {
    if (!FINE.matches) return;
    const el = e.target.closest && e.target.closest(TIPPABLE); if (!el || el.closest('.slide, #doc, .hwp-page')) return;
    adopt(el); if (el !== tipFor) showTip(el);
  }, true);
  document.addEventListener('mouseout', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el && (!e.relatedTarget || !el.contains(e.relatedTarget)) && e.relatedTarget !== tip) hideTip(true); }, true);
  document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest(TIPPABLE); if (!el) return; adopt(el); let fv = true; try { fv = el.matches(':focus-visible'); } catch (x) { } if (fv && !el.textContent.trim()) showTip(el, true); });
  document.addEventListener('focusout', () => hideTip());
  addEventListener('pointerdown', () => hideTip(), true);
  addEventListener('scroll', () => hideTip(), true);
  addEventListener('keydown', e => { if (e.key === 'Escape' && tip && tip.classList.contains('show')) hideTip(); }, true);

  /* ---------- 3. 읽기 진행 바 ---------- */
  let bar = null;
  const LONG = '.sc-page:not([hidden]), [data-progress]';
  function progress(sc) {
    const isDoc = sc === document || sc === document.documentElement || sc === document.body;
    const el = isDoc ? document.scrollingElement : sc;
    if (!isDoc && !(sc.matches && sc.matches(LONG))) return;
    if (isDoc && !document.body.hasAttribute('data-progress')) return;
    const max = el.scrollHeight - el.clientHeight;
    if (!bar) { bar = document.createElement('div'); bar.id = 'dpvProgress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar); }
    const on = max > el.clientHeight * 1.2 && el.scrollTop > 8;
    bar.classList.toggle('on', on);
    bar.style.transform = `scaleX(${on ? Math.min(1, el.scrollTop / max) : 0})`;
    if (!isDoc) { const r = sc.getBoundingClientRect(); bar.style.left = r.left + 'px'; bar.style.width = r.width + 'px'; } else { bar.style.left = '0'; bar.style.width = '100%'; }
    // 스티키 머리글 그림자: 내렸을 때만
    const head = isDoc ? null : sc.querySelector(':scope > .sc-bar');
    if (head) head.classList.toggle('stuck', el.scrollTop > 4);
  }
  addEventListener('scroll', e => progress(e.target), { capture: true, passive: true });

  /* ---------- 4. 바텀시트 끌어 닫기 (휴대폰) ---------- */
  let drag = null;
  document.addEventListener('touchstart', e => {
    if (!PHONE.matches) return;
    const m = e.target.closest && e.target.closest('.modal-bg > .modal'); if (!m) return;
    const r = m.getBoundingClientRect(), y = e.touches[0].clientY;
    if (y - r.top > 28 && m.scrollTop > 0) return; // 손잡이 근처이거나 맨 위에서만
    if (y - r.top > 28 && e.target.closest('input, textarea, select, [contenteditable], .sc-tablewrap')) return;
    drag = { m, y0: y, dy: 0 };
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!drag) return; drag.dy = Math.max(0, e.touches[0].clientY - drag.y0);
    if (drag.dy > 6) { drag.m.style.transition = 'none'; drag.m.style.transform = `translateY(${drag.dy}px)`; }
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (!drag) return; const { m, dy } = drag; drag = null;
    m.style.transition = 'transform .2s var(--ease, ease)';
    if (dy > 110) {
      const bg = m.parentElement;
      bg.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); // 바깥을 누른 것과 같게 (그 창이 허락하는 경우만 닫힘)
      setTimeout(() => { if (bg.isConnected) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); }, 30);
      setTimeout(() => { if (bg.isConnected) m.style.transform = ''; }, 80); // 닫히지 않는 창이면 제자리로
    } else m.style.transform = '';
  });

  /* ---------- 5. 확인 · 알림 창 (알럿은 결정이 필요할 때만, 알림은 토스트) ---------- */
  function box(title, desc, buttons, danger) {
    return new Promise(res => {
      const bg = document.createElement('div'); bg.className = 'modal-bg dpv-ask';
      bg.innerHTML = `<div class="modal ask" role="alertdialog" aria-modal="true" aria-labelledby="dpvAskT"${desc ? ' aria-describedby="dpvAskD"' : ''}><h3 id="dpvAskT">${esc(title)}</h3>${desc ? `<p class="modal-desc" id="dpvAskD">${esc(desc).replace(/\n/g, '<br>')}</p>` : ''}<div class="actions">${buttons.map((b, i) => `<button type="button" class="btn${i === buttons.length - 1 ? (danger ? ' danger-solid' : ' primary') : ''}" data-i="${i}">${esc(b)}</button>`).join('')}</div></div>`;
      const prev = document.activeElement;
      const done = v => { bg.remove(); document.removeEventListener('keydown', onKey, true); try { prev && prev.focus && prev.focus(); } catch (e) { } res(v); };
      const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); done(-1); } };
      document.addEventListener('keydown', onKey, true);
      bg.addEventListener('mousedown', e => { if (e.target === bg) done(-1); });
      bg.querySelectorAll('[data-i]').forEach(b => b.onclick = () => done(+b.dataset.i));
      document.body.appendChild(bg);
      setTimeout(() => { const last = bg.querySelector('.actions .btn:last-child'); last && last.focus(); }, 20);
    });
  }
  const confirmBox = async (title, desc, ok, danger) => (await box(title, desc, ['취소', ok || '확인'], danger)) === 1;
  const alertBox = async (title, desc) => { await box(title, desc, ['확인']); };

  /* ---------- 6. 코치마크 (새 기능을 처음 한 번만) ---------- */
  let coachOn = false;
  function coach(id, steps, opts) {
    const key = 'dpv:coach:' + id;
    if (coachOn || LS.get(key)) return false;
    const list = (steps || []).filter(s => { const el = typeof s.el === 'string' ? document.querySelector(s.el) : s.el; if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    if (!list.length) return false;
    coachOn = true; let i = 0;
    const wrap = document.createElement('div'); wrap.id = 'coach'; wrap.innerHTML = '<div class="co-hole"></div><div class="co-pop" role="dialog" aria-live="polite"></div>';
    document.body.appendChild(wrap);
    const hole = wrap.querySelector('.co-hole'), pop = wrap.querySelector('.co-pop');
    // 안내 중에 창이 열리면 안내를 닫음 — 안내 층이 창의 단추를 가려 누를 수 없던 문제
    const mo = new MutationObserver(() => { if (document.querySelector('.modal-bg, .dlg-bg')) end(); });
    const end = () => { LS.set(key, '1'); coachOn = false; wrap.remove(); mo.disconnect(); removeEventListener('resize', place); document.removeEventListener('keydown', onKey, true); };
    mo.observe(document.body, { childList: true });
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); end(); } else if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); next(); } };
    function place() {
      const s = list[i], el = typeof s.el === 'string' ? document.querySelector(s.el) : s.el; if (!el) return end();
      const r = el.getBoundingClientRect(), p = 6;
      hole.style.cssText = `left:${r.left - p}px;top:${r.top - p}px;width:${r.width + p * 2}px;height:${r.height + p * 2}px`;
      const pw = pop.offsetWidth, ph = pop.offsetHeight;
      let top = r.bottom + 14, left = r.left;
      if (top + ph > innerHeight - 10) top = Math.max(10, r.top - ph - 14);
      if (r.right + pw + 20 < innerWidth && r.height > 120) { left = r.right + 14; top = Math.max(10, r.top); }
      left = Math.max(10, Math.min(innerWidth - pw - 10, left));
      pop.style.left = left + 'px'; pop.style.top = top + 'px';
    }
    function draw() {
      const s = list[i], last = i === list.length - 1;
      pop.innerHTML = `${s.badge !== false ? '<span class="co-new">새 기능</span>' : ''}<b>${esc(s.title)}</b><p>${esc(s.text)}</p>${s.keys ? `<p class="co-keys">${s.keys.map(k => `<kbd>${esc(k)}</kbd>`).join(' ')}</p>` : ''}<div class="co-row">${list.length > 1 ? `<span class="co-dots">${list.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</span>` : ''}<button type="button" class="btn ghost sm" data-skip>${last ? '' : '건너뛰기'}</button><button type="button" class="btn primary sm" data-next>${last ? '알겠어요' : '다음'}</button></div>`;
      const sk = pop.querySelector('[data-skip]'); if (last) sk.remove(); else sk.onclick = end;
      pop.querySelector('[data-next]').onclick = next;
      place(); setTimeout(() => { const b = pop.querySelector('[data-next]'); b && b.focus(); }, 30);
    }
    function next() { if (i < list.length - 1) { i++; draw(); } else end(); }
    wrap.addEventListener('mousedown', e => { if (e.target === wrap) end(); });
    addEventListener('resize', place); document.addEventListener('keydown', onKey, true);
    setTimeout(draw, (opts && opts.delay) || 0);
    return true;
  }

  /* 작업장별 "새 기능" 안내 — 대상이 화면에 보일 때 처음 한 번만 (관리자 전용 단추는 관리자에게만 보이므로 자연히 걸러짐) */
  const PAGE = (location.pathname.split('/').pop() || 'index.html').replace(/\?.*/, '');
  const TOURS = {
    'secret.html': [['secret-engine', [{ el: '.rail [data-view="engine"]', title: '수익 엔진', text: '보유 종목 · 결정 카드 · 나의 원칙으로 "오래 수익을 이어간 투자자들의 조건"을 매일 점검합니다. 규칙을 어기면 이 메뉴에 점이 뜨고, 새 매매 크기를 절반 · 중지로 알려 줍니다.' }]]],
    'hangul.html': [
      ['doc-home', [{ el: '#hmTpl', title: '서식으로 새 문서', text: '보고서 · 추진계획 · 공문 · 보도자료 · 적극행정 우수사례 · 자기기술서를 공문서 형식 그대로 시작합니다.' }]],
      ['doc-edit', [{ el: '#btnCheck', title: '문서 점검 (F8)', text: '날짜 · 금액 표기, "끝." · 붙임, 쉬운 말, 두괄식을 한 번에 봅니다. 기능 이름을 몰라도 Ctrl+K 로 찾을 수 있습니다.', keys: ['F8', 'Ctrl+K'] }]],
    ],
    'video.html': [['video-pub', [{ el: '#veRail [data-tab="pub"]', title: '올리기', text: '세로 쇼츠로 바꾸기(얼굴 따라가기 · 안전 영역), 썸네일, 올리기 전 점검표가 모였습니다.' }]]],
    'editor.html': [['pres-check', [{ el: '#btnCheck', title: '발표 점검', text: '장마다 글 양 · 글자 크기 · 대비를 보고, 지난 발표의 장별 시간과 비교합니다.' }]]],
  };
  const pending = () => (TOURS[PAGE] || []).filter(([id]) => !LS.get('dpv:coach:' + id));
  function tryTours() {
    if (coachOn || document.querySelector('.modal-bg, .menu, .dlg-bg')) return; // 창(DOCUMENT 의 .dlg-bg 포함)이 떠 있으면 안내하지 않음
    for (const [id, steps] of pending()) if (coach(id, steps)) return;
  }
  if (TOURS[PAGE]) { let n = 0; const t = setInterval(() => { if (++n > 30 || !pending().length) { clearInterval(t); return; } tryTours(); }, 2500); }

  /* ---------- AI 단추 표시: 반짝이 아이콘 + 글자 라벨이 있는 단추만 (라벨 없는 반짝이는 AI 로 표시하지 않음) ---------- */
  function markAI(root) {
    (root || document).querySelectorAll('button i[data-ic="sparkle"], button .ico[data-ic="sparkle"], a.btn i[data-ic="sparkle"]').forEach(i => { const b = i.closest('button, a'); if (b && b.textContent.trim() && !b.classList.contains('ai-act')) b.classList.add('ai-act'); });
  }
  let aiMo = null;
  function watchAI() { markAI(); if (!('MutationObserver' in window)) return; aiMo = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.querySelector && n.querySelector('[data-ic="sparkle"]')) markAI(n); }); aiMo.observe(document.body, { childList: true, subtree: true }); }

  /* ---------- 명령 찾기 (Ctrl+K) — 작업장 이동 · 이 화면 메뉴 · 테마 · 단축키 ----------
     편집기 · 문서 · 영상 작업장은 Ctrl+K 를 자기 기능으로 이미 쓰므로, 그 밖의 화면에서만 Ctrl+K 로 연다 (탭 바 [찾기] 는 어디서나) */
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const cho = s => [...String(s)].map(c => { const k = c.charCodeAt(0) - 0xAC00; return k >= 0 && k < 11172 ? CHO[Math.floor(k / 588)] : c; }).join('');
  const OWN_K = /^(editor|hangul|video|present)\.html$/;
  function commands() {
    const isAdmin = document.documentElement.classList.contains('admin');
    const L = [];
    const go = (label, href, hint) => L.push({ label, hint: hint || '작업장', run: () => { location.href = href; } });
    go('DPV 첫 화면', 'index.html'); go('DOCUMENT — 한글 문서', 'hangul.html'); go('PRESENTATION — 교안', 'gyoan.html'); go('VIDEO — 영상', 'videos.html');
    if (isAdmin) go('SECRET — 투자', 'secret.html');
    const seen = new Set();
    document.querySelectorAll('.rail [data-view], #hmNav .rail-item, #veRail [data-tab]').forEach(b => {
      const t = (b.textContent || b.getAttribute('data-tip') || '').replace(/\s+/g, ' ').replace(/\s\d+$/, '').trim(); if (!t || t.length > 40 || seen.has(t)) return;
      seen.add(t); L.push({ label: t, hint: '이 화면', run: () => b.click() });
    });
    L.push({ label: document.documentElement.dataset.theme === 'dark' ? '화면을 밝게' : '화면을 어둡게', hint: '보기', run: () => { if (window.UiTheme) UiTheme.set(UiTheme.get() === 'dark' ? 'light' : 'dark'); } });
    L.push({ label: '단축키 안내', hint: '도움말 · ?', run: () => { location.href = 'shortcuts.html'; } });
    L.push({ label: '새 기능 안내 다시 보기', hint: '도움말', run: () => { window.DPV.resetCoach(); location.reload(); } });
    return L;
  }
  function palette() {
    if (document.getElementById('dpvPal')) return;
    const all = commands(); let list = all, sel = 0;
    const bg = document.createElement('div'); bg.className = 'modal-bg dpv-pal-bg'; bg.id = 'dpvPal';
    bg.innerHTML = `<div class="modal dpv-pal" role="dialog" aria-modal="true" aria-label="명령 찾기"><input type="search" class="dpv-pal-q" placeholder="무엇을 할까요? (초성도 됩니다: ㅁㅅ → 문서)" role="combobox" aria-expanded="true" aria-controls="dpvPalL" aria-autocomplete="list" enterkeyhint="go"><ul class="dpv-pal-l" id="dpvPalL" role="listbox"></ul><p class="dpv-pal-f"><kbd>↑</kbd> <kbd>↓</kbd> 고르기 · <kbd>Enter</kbd> 실행 · <kbd>Esc</kbd> 닫기</p></div>`;
    document.body.appendChild(bg);
    const q = bg.querySelector('input'), ul = bg.querySelector('ul');
    const close = () => { bg.remove(); document.removeEventListener('keydown', key, true); };
    const draw = () => {
      ul.innerHTML = list.length ? list.slice(0, 40).map((c, i) => `<li role="option" id="dpvPo${i}" aria-selected="${i === sel}" class="${i === sel ? 'on' : ''}" data-i="${i}"><span>${esc(c.label)}</span><small>${esc(c.hint)}</small></li>`).join('') : '<li class="none">찾는 것이 없습니다</li>';
      q.setAttribute('aria-activedescendant', list.length ? 'dpvPo' + sel : '');
      const on = ul.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    };
    const run = i => { const c = list[i]; if (!c) return; close(); setTimeout(() => c.run(), 0); };
    q.addEventListener('input', () => { const v = q.value.trim().toLowerCase(), vc = cho(v); list = !v ? all : all.filter(c => { const l = c.label.toLowerCase(); return l.includes(v) || cho(l).includes(vc) || c.hint.includes(v); }); sel = 0; draw(); });
    ul.addEventListener('click', e => { const li = e.target.closest('[data-i]'); if (li) run(+li.dataset.i); });
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(list.length - 1, sel + 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
      else if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); run(sel); }
    };
    document.addEventListener('keydown', key, true);
    bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
    draw(); setTimeout(() => q.focus(), 20);
  }
  document.addEventListener('keydown', e => {
    if (OWN_K.test(PAGE)) return;
    const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.code === 'KeyK') { e.preventDefault(); palette(); }
    else if (e.key === '?' && !typing && !e.ctrlKey && !e.metaKey && !document.querySelector('.modal-bg')) { e.preventDefault(); location.href = 'shortcuts.html'; }
  });

  /* 작업장 사이 전환(View Transitions)이 중간에 끊기면(곧바로 다른 화면으로 넘어갈 때) 브라우저가 오류로 남기므로 조용히 받음 */
  const quietVT = e => { const vt = e && e.viewTransition; if (vt) ['ready', 'finished', 'updateCallbackDone'].forEach(k => vt[k] && vt[k].catch(() => { })); };
  addEventListener('pagereveal', quietVT); addEventListener('pageswap', quietVT);

  /* ---------- 시작 ---------- */
  function boot() {
    watchAI();
    openWindow(document.body, 2200);
    document.querySelectorAll('button[title], a[title]').forEach(el => { if (!el.textContent.trim() && !el.getAttribute('aria-label')) el.setAttribute('aria-label', el.getAttribute('title')); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.DPV = Object.assign(window.DPV || {}, {
    ready: true,
    view(root) { if (root && !seenViews.has(root)) { seenViews.add(root); openWindow(root, 1200); } const pg = root && root.classList && root.classList.contains('sc-page') ? root : null; if (pg) progress(pg); }, // 화면(탭)을 바꿀 때 부름
    reveal: prime, coach, confirm: confirmBox, alert: alertBox, palette,
    aiBusy(el, on) { if (el) el.classList.toggle('ai-busy', !!on); }, // AI 가 일하는 동안 그 입력창 · 카드 테두리에 빛 (화면당 한 곳)
    resetCoach(id) { try { if (id) localStorage.removeItem('dpv:coach:' + id); else Object.keys(localStorage).filter(k => k.startsWith('dpv:coach:')).forEach(k => localStorage.removeItem(k)); } catch (e) { } },
  });
})();
