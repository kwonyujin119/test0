/* VIDEO — 올리기: 쇼츠 만들기(9:16 · 얼굴 따라가기 · 안전 영역) · I/O 구간 · 썸네일 · 올리기 전 점검표
   수치 근거와 출처는 docs/video-super-platform.md 에 정리했다 (플랫폼 규칙은 바뀌므로 화면 문구에 "대략"을 붙인 곳이 있다) */
'use strict';
(() => {
  if (!ICONS.smartphone) ICONS.smartphone = '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>';
  ICONS.upload = '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>';
  const SHORTS_MAX = 180; /* 쇼츠 · 릴스: 3분까지 */
  const HL = [['#ffe14d', '노랑'], ['#ff5a4d', '빨강'], ['#4dd2ff', '하늘'], ['#6dff8a', '초록'], ['#ffffff', '흰색']];
  VE.hlSwatches = cur => `<div class="ve-swatch">${HL.map(([c, n]) => `<button type="button" data-hl="${c}" class="${(cur || '#ffd84d').toLowerCase() === c || (!cur && c === '#ffe14d') ? 'on' : ''}" style="--sw:${c}" title="${n}" aria-label="${n}"></button>`).join('')}</div>`;
  const pub = () => { const p = VE.p; if (!p.pub) p.pub = { title: '', desc: '', tags: '', ok: {}, thumb: null, thumbDone: false }; if (!p.pub.ok) p.pub.ok = {}; return p.pub; };
  const vertical = () => { const [a, b] = VE.ASPECTS[VE.p.aspect] || [16, 9]; return b > a; };

  /* ---------- I · O 구간 ---------- */
  VE.mark = { i: null, o: null };
  const markChanged = () => { VE.tl.request(); if (VE.curTab && VE.curTab() === 'pub') VE.renderTab(); };
  VE.markIn = t => { VE.mark.i = t; if (VE.mark.o != null && VE.mark.o <= t) VE.mark.o = null; markChanged(); toast(`구간 시작 ${VE.fmtT(t, true)}`, 1000); };
  VE.markOut = t => { VE.mark.o = t; if (VE.mark.i != null && VE.mark.i >= t) VE.mark.i = null; markChanged(); toast(`구간 끝 ${VE.fmtT(t, true)}`, 1000); };
  VE.markClear = () => { VE.mark.i = VE.mark.o = null; markChanged(); };
  VE.markClip = () => { const a = VE.at(VE.player.t); if (!a) return; VE.mark.i = a.start; VE.mark.o = a.start + VE.clipLen(a.clip); markChanged(); };
  VE.markRange = () => { const m = VE.mark; if (m.i == null && m.o == null) return null; const T = VE.total(), a = clamp(m.i == null ? 0 : m.i, 0, T), b = clamp(m.o == null ? T : m.o, 0, T); return b - a > .05 ? [a, b] : null; };
  /* 구간 지우고 뒤를 당김 (리플 삭제) */
  VE.cutMarked = () => { const r = VE.markRange(); if (!r) return false; const s = VE.removeRanges([r]); VE.markClear(); VE.player.seek(r[0]); toast(`${VE.fmtLen(s)} 분량을 지우고 당겼습니다. Ctrl+Z 로 되돌립니다`, 2400); return true; };
  VE.on('project', () => { VE.mark.i = VE.mark.o = null; });

  /* ---------- 세로 쇼츠로 바꾸기 ---------- */
  const job = { on: false, ratio: 0, stage: '' }; let ac = null;
  VE.applyShorts = async () => {
    const land = c => { const m = VE.media(c.mid); return m && m.kind === 'video' && m.w > m.h * 1.05; };
    VE.edit(() => {
      const p = VE.p; p.aspect = '9:16';
      for (const c of p.clips) if (land(c)) { c.fit = 'fill'; c.reframe = true; c.px = 0; c.py = 0; c.zoom = 1; }
      if (p.cap.style !== 'shorts') { p.cap.style = 'shorts'; p.cap.pos = 'bottom'; p.cap.len = 'short'; }
    });
    if (VE.fitTimeline) VE.fitTimeline();
    if (!VE.p.clips.some(land)) { toast('세로 화면으로 바꿨습니다', 1800); return; }
    if (!VE.needFaceJobs().length) { toast('세로 화면으로 바꾸고 얼굴을 따라가게 했습니다', 2200); return; }
    job.on = true; job.ratio = 0; job.stage = '얼굴 위치 찾는 중'; ac = new AbortController(); VE.renderTab();
    try { await VE.runFaceJobs(p => { job.ratio = p.ratio; const n = document.getElementById('sProg'); if (n) n.style.width = Math.round(p.ratio * 100) + '%'; }, ac.signal);
      const found = VE.p.clips.filter(c => c.reframe).some(c => { const tr = VE.rt.get(c.mid) && VE.rt.get(c.mid).track; return tr && tr.frames.some(f => f && f.length); });
      toast(found ? '얼굴을 따라가는 세로 화면을 만들었습니다' : '영상에서 얼굴을 찾지 못해 가운데를 보여 줍니다. 미리보기를 끌어 위치를 옮길 수 있습니다', 3600); }
    catch (e) { if (e.name !== 'AbortError') toast('얼굴 위치를 찾지 못해 가운데를 보여 줍니다: ' + VE.niceErr(e), 4500); }
    finally { job.on = false; ac = null; VE.player.invalidate(); VE.renderTab(); }
  };
  /* 구간을 새 쇼츠 프로젝트로 (원본은 그대로 둠, 영상 파일은 같은 것을 함께 씀) */
  VE.rangeToShorts = async () => {
    const r = VE.markRange(); if (!r) { toast('먼저 I · O 로 구간을 표시해 주세요', 2200); return; }
    const [a, b] = r; if (b - a > SHORTS_MAX && !confirm(`고른 구간이 ${VE.fmtT(b - a)} 로 3분이 넘습니다. 그래도 만들까요? (3분이 넘으면 쇼츠로 올라가지 않습니다)`)) return;
    await VE.saveNow(); const src = VE.p.name;
    const q = JSON.parse(JSON.stringify(VE.p)); q.id = uid(); q.name = src + ' 쇼츠'; q.updated = Date.now(); q.pub = { title: '', desc: '', tags: '', ok: {} };
    q.music = (q.music || []).map(o => { o.start -= a; if (o.start < 0) { o.in -= o.start; o.start = 0; } return o; }).filter(o => o.in < o.out - .05 && o.start < b - a);
    await VE.loadProject(q);
    const T = VE.total(), cut = []; if (a > .01) cut.push([0, a]); if (T - b > .01) cut.push([b, T]); if (cut.length) VE.removeRanges(cut);
    await VE.applyShorts(); VE.clearHistory(); await VE.saveNow();
    try { history.replaceState(null, '', 'video.html?p=' + encodeURIComponent(VE.p.id)); } catch (e) { }
    VE.emit('project'); toast(`'${VE.p.name}' 를 만들었습니다. 원본 '${src}' 는 영상 목록에 그대로 있습니다`, 4000);
  };

  /* ---------- 안전 영역 (미리보기에만) ---------- */
  /* 공식 픽셀 값은 없다. 여러 안내서의 값을 넉넉히 잡음: 위 13% · 아래 20% · 오른쪽 단추 줄 11% */
  const safeOn = () => { try { return localStorage.getItem('ve:safe') !== '0'; } catch (e) { return true; } };
  VE.drawOverlay = (c, W, H) => {
    if (!safeOn() || !vertical() || !VE.p.clips.length) return;
    c.save(); c.fillStyle = 'rgba(255,60,60,.16)';
    c.fillRect(0, 0, W, H * .13); c.fillRect(0, H * .8, W, H * .2); c.fillRect(W * .89, H * .45, W * .11, H * .35);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.setLineDash([10, 8]); c.lineWidth = 2; c.strokeRect(W * .06, H * .13, W * .83, H * .67);
    c.setLineDash([]); c.font = `600 ${Math.round(W * .03)}px sans-serif`; c.fillStyle = 'rgba(255,255,255,.9)'; c.textBaseline = 'middle'; c.textAlign = 'center';
    c.fillText('앱 화면이 덮는 자리', W / 2, H * .065); c.fillText('제목 · 채널 · 설명이 덮는 자리', W / 2, H * .9);
    c.restore();
  };

  /* ---------- 첫 3초 ---------- */
  const hook = () => {
    const caps = VE.captions().filter(x => x.start < 3), tit = VE.p.titles.filter(o => o.start < 3);
    const text = [...tit.map(o => String(o.text).split('\n')[0]), ...caps.map(x => x.text)].join(' / ');
    return { ok: !!text, text };
  };
  /* ---------- 점검 ---------- */
  const usesAI = () => VE.p.clips.some(c => (c.face && c.face.mode === 'char') || (c.pip && c.pip.char) || (VE.dub && VE.dub.active(c.mid)));
  VE.pubChecks = () => {
    const P = VE.p, T = VE.total(), v = vertical(), pb = pub(), out = [], h = hook();
    if (v) out.push(T <= SHORTS_MAX ? ['ok', `길이 ${VE.fmtT(T)} — 쇼츠 · 릴스(3분 이하)에 맞습니다`] : ['bad', `길이 ${VE.fmtT(T)} — 3분이 넘어 쇼츠로 올라가지 않습니다. I · O 로 구간을 골라 '구간을 새 쇼츠로'를 쓰세요`]);
    else out.push(['ok', `가로 ${P.aspect} · ${VE.fmtT(T)} — 일반 YouTube 영상`]);
    if (v && P.clips.some(c => { const m = VE.media(c.mid); return m && m.kind === 'video' && m.w > m.h * 1.05 && c.fit !== 'fill'; })) out.push(['warn', '가로 영상이 세로 화면에 작게 들어가 있습니다 — 위의 [세로 쇼츠로 바꾸기]']);
    out.push(h.ok ? ['ok', `첫 3초: “${h.text.slice(0, 40)}”`] : ['warn', '첫 3초에 말도 글자도 없습니다. 넘기기 쉬운 자리입니다 — 결론이나 질문을 맨 앞에']);
    out.push(VE.captions().length && P.cap.on ? ['ok', '자막 있음 (소리 끄고 보는 사람도 따라옵니다)'] : ['warn', '자막이 없습니다 — [자막·글] 탭에서 만들 수 있습니다']);
    if (!v) out.push(pb.thumbDone ? ['ok', '썸네일 만듦'] : ['warn', '썸네일을 아직 만들지 않았습니다']);
    out.push(pb.title.trim() ? (pb.title.length > 100 ? ['bad', '제목이 100자를 넘습니다'] : ['ok', `제목 ${pb.title.length}자`]) : ['warn', '제목을 아직 적지 않았습니다']);
    out.push(['ok', '글꼴: 프리텐다드 (SIL 오픈 폰트 라이선스, 상업적 사용 가능)']);
    if (P.music.length) out.push(['ask', 'music', '넣은 음악의 출처를 확인했습니다 (유튜브 오디오 보관함 · 직접 만든 곡 · 사용 허락 받은 곡)']);
    else out.push(['ok', '따로 넣은 음악 없음 (원본 영상 속 배경음악은 직접 확인하세요)']);
    if (usesAI()) out.push(['ask', 'ai', "AI 캐릭터 · AI 목소리를 썼습니다. 올릴 때 '변경되거나 합성된 콘텐츠'에 '예'를 고르겠습니다"]);
    out.push(['ask', 'own', '남의 영상 · 방송을 그대로 쓰지 않았습니다 (재사용 콘텐츠는 수익 창출이 거절될 수 있음)']);
    return out;
  };
  /* 장(챕터): 큰 제목 글자로 만든다. YouTube 규칙: 0:00 부터, 3개 이상, 각 10초 이상 */
  VE.chapters = () => {
    const ts = VE.p.titles.filter(o => o.preset === 'title').sort((a, b) => a.start - b.start), T = VE.total();
    if (!ts.length) return { err: "[글자] 탭에서 '큰 제목'을 장마다 넣으면 장 목록을 만들 수 있습니다" };
    const list = ts.map(o => ({ t: o.start, name: String(o.text).split('\n')[0].trim() || '장' }));
    if (list[0].t > .5) list.unshift({ t: 0, name: '시작' }); else list[0].t = 0;
    if (list.length < 3) return { err: '장이 3개 이상이어야 YouTube 가 장으로 보여 줍니다 (큰 제목을 더 넣어 주세요)' };
    for (let i = 0; i < list.length; i++) { const e = i + 1 < list.length ? list[i + 1].t : T; if (e - list[i].t < 10) return { err: `'${list[i].name}' 장이 10초보다 짧습니다. 장마다 10초 이상이어야 합니다` }; }
    return { text: list.map(x => `${VE.fmtT(x.t)} ${x.name}`).join('\n') };
  };

  /* ---------- 패널 ---------- */
  VE.pPub = (box) => {
    const P = VE.p, T = VE.total(), v = vertical(), pb = pub(), r = VE.markRange(), U = VE.ui;
    const chk = VE.pubChecks(), ic = { ok: '✓', warn: '!', bad: '✕', ask: '' };
    box.innerHTML = U.head('올리기', '쇼츠 만들기 · 썸네일 · 올리기 전 점검') + `
      ${!P.clips.length ? '<div class="ve-empty">영상을 먼저 넣어 주세요.</div>' : `
      <div class="ve-sec"><div class="ve-lab">세로 쇼츠 · 릴스 · 틱톡<em>9:16 · 3분 이하</em></div>
        ${v ? `<div class="ve-meter${T > SHORTS_MAX ? ' over' : ''}"><i style="width:${Math.min(100, T / SHORTS_MAX * 100)}%"></i><span>${VE.fmtT(T)} / 3:00</span></div>` : ''}
        ${job.on ? `<div class="ve-prog"><div class="ve-prog-top"><span>${job.stage}</span><button class="btn sm ghost" id="sStop" type="button">그만</button></div><div class="ve-bar"><i id="sProg" style="width:${Math.round(job.ratio * 100)}%"></i></div></div>`
        : `<button class="btn ${v ? '' : 'ink '}ve-big" id="sApply" type="button"><i data-ic="smartphone"></i>${v ? '얼굴 따라가기 다시 맞추기' : '세로 쇼츠로 바꾸기'}</button>
        <p class="ve-hint">가로 영상은 화면을 꽉 채우고 말하는 사람 얼굴을 따라 좌우로 움직입니다. 자막은 쇼츠형 큰 자막으로 바꿉니다. 마음에 안 들면 Ctrl+Z.</p>`}
        ${v ? `<label class="ve-check tight"><input type="checkbox" id="sSafe"${safeOn() ? ' checked' : ''}><span><b>안전 영역 보기</b> 앱 단추 · 제목이 덮는 자리를 미리보기에만 표시 (대략)</span></label>` : ''}</div>
      <div class="ve-sec"><div class="ve-lab">구간 고르기<em>긴 영상 → 쇼츠</em></div>
        <div class="ve-range">${r ? `<b>${VE.fmtT(r[0], true)} ~ ${VE.fmtT(r[1], true)}</b> <span>${VE.fmtLen(r[1] - r[0])}</span>` : '<span>재생 위치를 옮기며 시작 · 끝을 누르세요</span>'}</div>
        <div class="ve-tools"><button class="btn sm" id="sIn" type="button">시작 <kbd>I</kbd></button><button class="btn sm" id="sOut" type="button">끝 <kbd>O</kbd></button>
        <button class="btn sm" id="sCut" type="button"${r ? '' : ' disabled'}><i data-ic="trash"></i>구간 지우기 <kbd>Shift+Del</kbd></button><button class="btn sm ink" id="sNew" type="button"${r ? '' : ' disabled'}><i data-ic="copy"></i>구간을 새 쇼츠로</button>${r ? '<button class="btn sm ghost" id="sClr" type="button">표시 지우기</button>' : ''}</div></div>
      <div class="ve-sec"><div class="ve-lab">썸네일</div>
        <button class="btn ve-big" id="sThumb" type="button"><i data-ic="image"></i>${pb.thumbDone ? '썸네일 다시 만들기' : '썸네일 만들기'}</button></div>
      <div class="ve-sec"><div class="ve-lab">제목<em id="sTitleN">${pb.title.length}/100</em></div>
        <input type="text" id="sTitle" class="ve-in" maxlength="100" placeholder="핵심 낱말을 앞쪽에 (휴대폰은 앞 40자 정도만 보임)" value="${esc(pb.title)}">
        <div class="ve-lab" style="margin-top:10px">설명</div><textarea id="sDesc" class="ve-ta sm" rows="5" placeholder="첫 두 줄이 '더보기' 전에 보입니다">${esc(pb.desc)}</textarea>
        <div class="ve-tools"><button class="btn sm" id="sChap" type="button">장(챕터) 넣기</button></div>
        <div class="ve-lab" style="margin-top:10px">해시태그</div><input type="text" id="sTags" class="ve-in" placeholder="#소방 #안전교육 (앞의 3개가 제목 위에 보임)" value="${esc(pb.tags)}">
        <button class="btn sm" id="sCopy" type="button" style="margin-top:8px"><i data-ic="copy"></i>제목 · 설명 · 태그 복사</button></div>
      <div class="ve-sec"><div class="ve-lab">올리기 전 점검</div><ul class="ve-chk">${chk.map(c => c[0] === 'ask'
        ? `<li class="ask"><label class="ve-check tight"><input type="checkbox" data-ok="${c[1]}"${pb.ok[c[1]] ? ' checked' : ''}><span>${esc(c[2])}</span></label></li>`
        : `<li class="${c[0]}"><i>${ic[c[0]]}</i><span>${esc(c[1])}</span></li>`).join('')}</ul></div>
      <details class="ve-more"><summary>수익 창출 조건 (YouTube 파트너 프로그램)</summary><div class="ve-note">
        <b>광고 수익</b>: 구독자 1,000명 + 최근 12개월 공개 긴 영상 시청 4,000시간, 또는 구독자 1,000명 + 최근 90일 공개 쇼츠 조회수 1,000만.<br>
        <b>먼저 열리는 단계</b>(멤버십 · 후원 기능): 구독자 500명 + 최근 90일 공개 영상 3개 + (12개월 시청 3,000시간 또는 90일 쇼츠 조회수 300만).<br>
        남의 영상을 그대로 올리는 '재사용 콘텐츠'는 심사에서 거절됩니다. 2027년 2월부터 새로 신청하는 채널의 기준(시청 8,000시간 또는 쇼츠 2,000만)이 올라간다는 보도가 있습니다(YouTube 공식 글은 아직 확인하지 못함). 조건은 바뀔 수 있으니 YouTube 스튜디오의 '수익 창출' 화면에서 확인하세요.</div></details>`}`;
    const q = id => box.querySelector('#' + id);
    if (!P.clips.length) return;
    const ap = q('sApply'); if (ap) ap.onclick = () => VE.applyShorts();
    const st = q('sStop'); if (st) st.onclick = () => { if (ac) ac.abort(); };
    const sf = q('sSafe'); if (sf) sf.onchange = () => { try { localStorage.setItem('ve:safe', sf.checked ? '1' : '0'); } catch (e) { } VE.player.invalidate(); };
    q('sIn').onclick = () => VE.markIn(VE.player.t); q('sOut').onclick = () => VE.markOut(VE.player.t);
    q('sCut').onclick = () => VE.cutMarked(); q('sNew').onclick = () => VE.rangeToShorts(); const cl = q('sClr'); if (cl) cl.onclick = VE.markClear;
    q('sThumb').onclick = () => VE.thumbDialog();
    const save = () => { P.updated = Date.now(); VE.saveSoon(); };
    const ti = q('sTitle'), de = q('sDesc'), tg = q('sTags');
    [ti, de, tg].forEach(n => n.addEventListener('keydown', e => e.stopPropagation()));
    ti.oninput = () => { pb.title = ti.value; q('sTitleN').textContent = ti.value.length + '/100'; save(); };
    de.oninput = () => { pb.desc = de.value; save(); }; tg.oninput = () => { pb.tags = tg.value; save(); };
    [ti, de, tg].forEach(n => n.onchange = () => VE.renderTab());
    q('sChap').onclick = () => { const c = VE.chapters(); if (c.err) { toast(c.err, 4000); return; } pb.desc = (pb.desc.replace(/(^|\n)0:00 [\s\S]*$/, '').trim() + '\n\n' + c.text).trim(); save(); VE.renderTab(); toast('설명 끝에 장 목록을 넣었습니다', 2000); };
    q('sCopy').onclick = async () => { const t = [pb.title || P.name, '', pb.desc, '', pb.tags].join('\n').trim(); try { await navigator.clipboard.writeText(t); toast('복사했습니다. 올리는 화면에 붙여 넣으세요', 2200); } catch (e) { toast('복사하지 못했습니다. 글을 길게 눌러 복사해 주세요', 3000); } };
    box.querySelectorAll('[data-ok]').forEach(n => n.onchange = () => { pb.ok[n.dataset.ok] = n.checked; save(); });
  };

  /* ---------- 썸네일 ---------- */
  const FONT = "'Pretendard Variable', Pretendard, 'Malgun Gothic', sans-serif";
  function drawThumb(cv, s) {
    const W = cv.width, H = cv.height, c = cv.getContext('2d'); c.fillStyle = '#111'; c.fillRect(0, 0, W, H);
    const f = VE.player.frameNow();
    if (f && f.fw && f.fh) {
      const k = Math.max(W / f.fw, H / f.fh), w = f.fw * k, h = f.fh * k; let x = (W - w) / 2;
      const fx = f.clip && VE.faceX ? VE.faceX(f.clip.mid, f.src) : null; if (fx != null) x = clamp((s.pos === 'left' ? W * .68 : W / 2) - fx * w, W - w, 0);
      c.filter = s.pop ? 'brightness(1.08) contrast(1.15) saturate(1.3)' : 'none';
      if (f.frame.draw && !f.frame.nodeType) f.frame.draw(c, x, (H - h) / 2, w, h); else c.drawImage(f.frame, x, (H - h) / 2, w, h);
      c.filter = 'none';
    }
    const lines = [s.t1, s.t2].map(x => String(x || '').trim()); if (!lines[0] && !lines[1]) return;
    const left = s.pos === 'left', bottom = s.pos === 'bottom', maxW = W * (left ? .6 : .9);
    let g;
    if (left) { g = c.createLinearGradient(0, 0, W * .75, 0); g.addColorStop(0, 'rgba(0,0,0,.72)'); g.addColorStop(1, 'rgba(0,0,0,0)'); }
    else if (bottom) { g = c.createLinearGradient(0, H * .35, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.78)'); }
    else { g = 'rgba(0,0,0,.32)'; }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    let unit = Math.min(W, H) * .2 * (s.size || 1); c.font = `900 ${unit}px ${FONT}`;
    const widest = () => Math.max(...lines.map(l => c.measureText(l).width));
    while (widest() > maxW && unit > 20) { unit *= .94; c.font = `900 ${unit}px ${FONT}`; }
    const lh = unit * 1.12, n = lines.filter(Boolean).length, cy = bottom ? H * .93 - (n - 1) * lh - lh / 2 : H / 2 - (n - 1) * lh / 2;
    c.textBaseline = 'middle'; c.textAlign = left ? 'left' : 'center'; c.lineJoin = 'round';
    const x0 = left ? W * .05 : W / 2; let k = 0;
    lines.forEach((l, i) => { if (!l) return; const y = cy + k++ * lh; c.lineWidth = unit * .16; c.strokeStyle = '#000'; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = unit * .2; c.strokeText(l, x0, y); c.shadowColor = 'transparent'; c.fillStyle = i === 1 ? s.color : '#fff'; c.fillText(l, x0, y); });
  }
  VE.thumbDialog = () => {
    if (VE.player.playing) VE.player.pause();
    const pb = pub(); const s = Object.assign({ t1: (pb.title || VE.p.name || '').slice(0, 14), t2: '', color: '#ffe14d', pos: 'left', size: 1, pop: true, tall: false }, pb.thumb || {});
    if (s.t != null) VE.player.seek(s.t);
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ve-thumb" role="dialog" aria-modal="true" aria-label="썸네일 만들기"><h3>썸네일 만들기</h3>
      <div class="ve-thumb-view"><canvas id="thC"></canvas><div class="ve-thumb-mini"><canvas id="thM" width="168" height="94"></canvas><span>목록에서 작게 보이는 모습 — 이 크기에서도 읽혀야 합니다</span></div></div>
      <div class="ve-row ve-thumb-nav"><button class="btn sm" data-mv="-1" type="button">◀ 1초</button><button class="btn sm" data-mv="-0.04" type="button">◀ 한 장면</button><button class="btn sm" data-mv="0.04" type="button">한 장면 ▶</button><button class="btn sm" data-mv="1" type="button">1초 ▶</button></div>
      <p class="ve-hint">얼굴 표정이 크게 보이는 장면이 좋습니다. 글자는 3~5낱말이면 충분합니다.</p>
      <label class="ve-field"><span class="ve-lab">큰 글자</span><input type="text" id="th1" class="ve-in" maxlength="20" value="${esc(s.t1)}"></label>
      <label class="ve-field"><span class="ve-lab">강조 줄 (색 글자)</span><input type="text" id="th2" class="ve-in" maxlength="20" value="${esc(s.t2)}" placeholder="비워도 됩니다"></label>
      <div class="ve-lab">강조색</div>${VE.hlSwatches(s.color)}
      <div class="ve-lab" style="margin-top:10px">글자 자리</div>${VE.ui.seg('thPos', s.pos, [['left', '왼쪽'], ['center', '가운데'], ['bottom', '아래']])}
      <div style="margin-top:10px">${VE.ui.range('thSize', '글자 크기', s.size, .6, 1.4, .05, v => Math.round(v * 100) + '%')}</div>
      <label class="ve-check tight"><input type="checkbox" id="thPop"${s.pop ? ' checked' : ''}><span><b>선명하게</b> 밝기 · 대비 · 색을 조금 올림</span></label>
      <div class="ve-lab" style="margin-top:8px">크기</div>${VE.ui.seg('thTall', s.tall ? '1' : '0', [['0', '가로 1280×720 (YouTube)'], ['1', '세로 1080×1920 (릴스 표지)']])}
      <div class="actions"><button class="btn" id="thClose" data-dismiss type="button">닫기</button><button class="btn ink" id="thSave" type="button"><i data-ic="download"></i>JPG 저장</button></div></div>`;
    document.body.appendChild(bg); fillIcons(bg);
    const cv = bg.querySelector('#thC'), mini = bg.querySelector('#thM'), q = id => bg.querySelector('#' + id);
    let lastKey = '';
    const paint = (force) => {
      const fn = VE.player.frameNow(), key = JSON.stringify(s) + (fn ? fn.src : '') + VE.player.t; if (!force && key === lastKey) return; lastKey = key;
      cv.width = s.tall ? 1080 : 1280; cv.height = s.tall ? 1920 : 720; drawThumb(cv, s);
      mini.width = s.tall ? 54 : 168; mini.height = 94; mini.getContext('2d').drawImage(cv, 0, 0, mini.width, mini.height);
    };
    const keep = () => { s.t = VE.player.t; pb.thumb = { ...s }; VE.saveSoon(); };
    const tick = setInterval(() => paint(), 200);
    bg.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { VE.player.seek(VE.player.t + +b.dataset.mv); });
    q('th1').oninput = e => { s.t1 = e.target.value; paint(); }; q('th2').oninput = e => { s.t2 = e.target.value; paint(); };
    [q('th1'), q('th2')].forEach(n => n.addEventListener('keydown', e => e.stopPropagation()));
    bg.querySelectorAll('[data-hl]').forEach(b => b.onclick = () => { s.color = b.dataset.hl; bg.querySelectorAll('[data-hl]').forEach(x => x.classList.toggle('on', x === b)); paint(); });
    VE.ui.onSeg(bg, 'thPos', v => { s.pos = v; bg.querySelectorAll('#thPos button').forEach(x => x.classList.toggle('on', x.dataset.v === v)); paint(); });
    VE.ui.onSeg(bg, 'thTall', v => { s.tall = v === '1'; bg.querySelectorAll('#thTall button').forEach(x => x.classList.toggle('on', x.dataset.v === v)); paint(); });
    VE.ui.onRange(bg, 'thSize', v => { s.size = v; paint(); }, v => Math.round(v * 100) + '%', true);
    q('thPop').onchange = e => { s.pop = e.target.checked; paint(); };
    const close = () => { clearInterval(tick); keep(); bg.remove(); if (VE.curTab() === 'pub') VE.renderTab(); };
    q('thClose').onclick = close;
    q('thSave').onclick = async () => {
      paint(true); if (!VE.player.frameNow()) { toast('장면이 아직 준비되지 않았습니다. 잠시 뒤 다시 눌러 주세요', 2400); return; }
      /* YouTube 썸네일은 2MB 이하 */
      let blob = null; for (const qq of [.92, .85, .78, .7, .6]) { blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', qq)); if (blob && blob.size < 2e6) break; }
      if (!blob) { toast('그림을 만들지 못했습니다', 2400); return; }
      VE.download(blob, VE.safeName(VE.p.name) + (s.tall ? ' 표지' : ' 썸네일') + '.jpg'); pb.thumbDone = true; keep(); toast(`썸네일을 저장했습니다 (${VE.fmtSize(blob.size)})`, 2200);
    };
    setTimeout(() => paint(true), 60);
  };
})();
