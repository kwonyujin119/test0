/* DPV — AI 모션 2단계 (app/ai-motion.css 와 함께). 모든 화면에서 불러도 되고, 없는 부품은 건너뜀.
   1) 첫 화면 히어로(#aimHero): 입장 전 · 뒤에 맞는 글, "이어서 할 일"(세 작업장의 이어 하기 링크를 최근 순으로 모음)
   2) AIM.steps / AIM.sync : AI 작업 단계 표시 ("소리 읽기 → AI 준비 → 받아쓰기 → 자막 완성")
   3) AIM.settle(el)       : 결과가 나왔을 때 한 번 자리 잡기
   4) AIM.scan(el, on)     : 그림을 훑는 AI (배경 AI 지우기)
   5) AIM.wait(btn, 글, 안내) : 오래 걸리는 AI 단추 — 하는 일 · 지난 시간을 보여 줌. 돌려준 함수를 부르면 원래대로
   각 작업장 파일은 window.AIM 이 있을 때만 부른다 (이 파일이 없어도 기능은 그대로) */
'use strict';
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const escH = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 작업 단계 ---------- */
  const NONE = /$^/; // 끝 단계: 일이 끝나면 패널이 다시 그려지므로 "지금"으로 보일 일은 없음
  const STEPS = {
    text: [['소리 읽기', /소리 읽는/], ['AI 준비', /모델/], ['받아쓰기', /받아쓰는/], ['자막 완성', NONE]],
    dub: [['AI 목소리 준비', /목소리 모델/], ['문장 읽기', /문장 읽는/], ['목소리 입히기', NONE]],
    narr: [['AI 목소리 준비', /목소리 모델/], ['글 읽기', /글 읽는/], ['클립 완성', NONE]],
  };
  const stepAt = (list, stage) => { let k = 0; list.forEach((s, i) => { if (s[1].test(stage || '')) k = i; }); return k; };
  function steps(kind, stage) {
    const list = STEPS[kind]; if (!list) return '';
    const k = stepAt(list, stage);
    return `<ol class="aim-steps" data-kind="${kind}" data-at="${k}" style="--n:${list.length}" aria-label="단계 ${k + 1}/${list.length}: ${escH(list[k][0])}">${list.map((s, i) => `<li class="${i < k ? 'done' : i === k ? 'now' : ''}"${i === k ? ' aria-current="step"' : ''}>${escH(s[0])}</li>`).join('')}</ol>`;
  }
  /* 진행 상자 안의 단계 표시만 고침 (단계가 바뀔 때만 DOM 을 건드림) */
  function sync(root, kind, stage) {
    const ol = root && root.querySelector('.aim-steps'); const list = STEPS[kind];
    if (!ol || !list) return;
    const k = stepAt(list, stage); if (+ol.dataset.at === k) return;
    ol.dataset.at = k; ol.setAttribute('aria-label', `단계 ${k + 1}/${list.length}: ${list[k][0]}`);
    [...ol.children].forEach((li, i) => { li.className = i < k ? 'done' : i === k ? 'now enter' : ''; if (i === k) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
  }

  /* ---------- 결과 자리 잡기 · 그림 훑기 · 기다리는 단추 ---------- */
  function settle(el) { if (!el || RM.matches) return; el.classList.remove('ai-settle'); void el.offsetWidth; el.classList.add('ai-settle'); el.addEventListener('animationend', () => el.classList.remove('ai-settle'), { once: true }); }
  function scan(el, on) { if (el) el.classList.toggle('aim-scan', !!on); }
  function wait(btn, label, hint) {
    if (!btn) return () => { };
    const old = btn.innerHTML, t0 = Date.now(); btn.disabled = true; btn.classList.add('ai-busy'); btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = `<span class="aim-wait"><span class="ai-shimmer">${escH(label)}</span><span class="aim-wait-t">0:00${hint ? ' · ' + escH(hint) : ''}</span></span>`;
    const t = btn.querySelector('.aim-wait-t');
    const tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}${hint ? ' · ' + hint : ''}`; }, 1000);
    return () => { clearInterval(tick); btn.innerHTML = old; btn.disabled = false; btn.classList.remove('ai-busy'); btn.removeAttribute('aria-busy'); };
  }

  /* ---------- 첫 화면 히어로 ---------- */
  function hero() {
    const box = document.getElementById('aimHero'); if (!box) return;
    const $ = id => document.getElementById(id);
    const gate = $('gate'), space = $('space');
    const JOBS = [['deckResume', 'pres', 'P'], ['hwpResume', 'doc', 'D'], ['videoResume', 'video', 'V']];
    const isAdmin = () => document.documentElement.classList.contains('admin');
    const greet = () => { const h = new Date().getHours(); return h < 5 ? '늦게까지 수고 많으십니다' : h < 11 ? '좋은 아침입니다' : h < 17 ? '좋은 오후입니다' : h < 22 ? '좋은 저녁입니다' : '늦게까지 수고 많으십니다'; };
    const today = () => new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
    const feat = (ws, L, text, i) => `<li data-ws="${ws}" style="--i:${i}"><i class="aim-tile" aria-hidden="true">${L}</i>${text}</li>`;
    const ago = t => (typeof window.fmtAgo === 'function' && t ? window.fmtAgo(+t) : '');
    const arrow = typeof window.icon === 'function' ? window.icon('arrowRight', 16) : '';
    let mode = '';

    function paint() {
      const m = space && !space.hidden ? (isAdmin() ? 'admin' : 'guest') : 'gate';
      if (m === mode) { jobs(); return; }
      mode = m; box.dataset.mode = m === 'gate' ? 'gate' : 'space';
      const H = box.querySelector('h2'), K = $('aimKicker'), L = $('aimLead'), F = $('aimFeats');
      if (m === 'gate') {
        K.textContent = 'AI 와 함께 쓰는 업무 공간';
        H.textContent = '문서 · 발표 · 영상을 한곳에서';
        L.textContent = '말소리는 자막으로, 글은 AI 목소리로, 사진 배경은 AI 가 지웁니다. 그림 · 영상 · 소리는 이 기기 안에서만 처리합니다.';
        F.innerHTML = feat('doc', 'D', '문서 점검 · 서식', 0) + feat('pres', 'P', '배경 AI 지우기', 1) + feat('video', 'V', '자동 자막 · AI 목소리', 2);
      } else if (m === 'admin') {
        K.textContent = today(); H.textContent = greet();
        F.innerHTML = feat('doc', 'D', '문서 점검 · 서식', 0) + feat('pres', 'P', '배경 AI 지우기', 1) + feat('video', 'V', '자동 자막 · AI 목소리', 2) + feat('secret', 'S', 'AI 어시스턴트', 3);
      } else {
        K.textContent = today(); H.textContent = greet();
        L.textContent = '보기 전용입니다. 교안을 발표하거나 hwpx 문서를 열어 인쇄합니다.';
        F.innerHTML = feat('pres', 'P', '교안 발표 · 리모컨', 0) + feat('doc', 'D', 'hwpx 열람 · 인쇄', 1);
      }
      jobs();
    }
    /* 이어서 할 일: 세 작업장 카드의 이어 하기 링크(index.html 이 채움)를 최근 순으로. 카드가 비었으면 판을 숨김 */
    function jobs() {
      const T = $('aimToday'); if (!T) return;
      if (mode === 'gate' || !mode) { T.hidden = true; T._h = ''; return; }
      const list = JOBS.map(([id, ws, L]) => { const a = $(id); if (!a || a.classList.contains('empty') || !a.getAttribute('href')) return null; const lb = a.querySelector('.rl-lbl'), ti = a.querySelector('.rl-title'); return { href: a.getAttribute('href'), ws, L, lbl: lb ? lb.textContent : '', title: ti ? ti.textContent : '', t: +a.dataset.t || 0 }; }).filter(Boolean).sort((a, b) => b.t - a.t);
      /* 이어 할 것이 없으면 판을 숨김 (빈 판 · "찾는 중" 판이 보였다 사라지며 아래 카드가 흔들리지 않게) */
      const L = $('aimLead');
      if (!list.length) { T.hidden = true; T._h = ''; box.dataset.jobs = '0'; if (L && mode === 'admin') L.textContent = '아래에서 작업장을 고르세요. 하던 일이 있으면 여기에 모아 보여 줍니다.'; return; }
      box.dataset.jobs = '1'; if (L && mode === 'admin') L.textContent = '하던 일을 바로 이어 가거나, 아래에서 작업장을 고르세요.';
      const html = `<div class="aim-today-h"><span id="aimTodayH">이어서 할 일</span>${list.length > 1 ? '<small>최근 순</small>' : ''}</div><ol aria-labelledby="aimTodayH">${list.map(j => `<li><a class="aim-job" data-ws="${j.ws}" href="${escH(j.href)}"><i class="aim-tile" aria-hidden="true">${j.L}</i><span class="aim-job-t"><small>${escH(j.lbl)}</small><b>${escH(j.title)}</b></span>${j.t ? `<span class="aim-job-ago">${escH(ago(j.t))}</span>` : ''}${arrow}</a></li>`).join('')}</ol>`;
      if (T._h === html) return; T._h = html;
      T.innerHTML = html; T.hidden = false;
    }

    let raf = 0; const soon = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(); }); };
    const mo = new MutationObserver(soon);
    [gate, space].forEach(n => n && mo.observe(n, { attributes: true, attributeFilter: ['hidden'] }));
    JOBS.forEach(([id]) => { const a = $(id); if (a) mo.observe(a, { attributes: true, childList: true, subtree: true, characterData: true }); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    paint();
    box.hidden = false;
    /* 처음 한 번만(이 탭에서) 등장 연출 · 오로라 흐름. 다시 그릴 때는 바로 */
    let seen = false; try { seen = sessionStorage.getItem('aim:hero') === '1'; sessionStorage.setItem('aim:hero', '1'); } catch (e) { }
    if (!RM.matches) { if (!seen) box.classList.add('aim-in'); box.classList.add('aim-flow'); }
  }

  window.AIM = { steps, sync, settle, scan, wait };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hero); else hero();
})();
