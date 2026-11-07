/* 영상 작업장 — 왼쪽 작업 칸(미디어 · 녹화 · 글 · 군더더기 자르기 · 얼굴 · 목소리 · 글자)과 오른쪽 속성 칸 */
'use strict';
(() => {
  const $ = VE.$; let tab = 'media';
  const job = {}; /* 진행 중인 분석: { kind, stage, ratio, eta, abort } */
  const eta = s => s == null ? '' : s < 60 ? `약 ${Math.max(1, Math.round(s))}초 남음` : `약 ${Math.ceil(s / 60)}분 남음`;
  const progress = (k, cancel) => { const j = job[k]; return j ? `<div class="ve-prog"><div class="ve-prog-top"><span>${esc(j.stage || '')}</span><span class="muted">${j.ratio != null ? Math.round(j.ratio * 100) + '%' : ''} ${eta(j.eta)}</span></div><div class="ve-bar"><i style="width:${Math.round((j.ratio || 0) * 100)}%"></i></div>${cancel ? `<button class="btn sm" data-act="${cancel}">그만두기</button>` : ''}</div>` : ''; };
  const range = (id, label, val, min, max, step, fmt) => `<label class="ve-field"><span class="ve-lab">${label}<em id="${id}V">${fmt ? fmt(val) : val}</em></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
  const seg = (id, val, opts) => `<div class="ve-seg" id="${id}">${opts.map(([v, t]) => `<button type="button" data-v="${v}" class="${String(val) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  const onSeg = (root, id, fn) => { const el = root.querySelector('#' + id); if (el) el.onclick = ev => { const b = ev.target.closest('button'); if (b) fn(b.dataset.v); }; };
  const onRange = (root, id, fn, fmt, liveOnly) => { const el = root.querySelector('#' + id); if (!el) return; const lab = root.querySelector('#' + id + 'V'); let began = false; el.oninput = () => { if (!began && !liveOnly) { VE.snap(); began = true; } if (lab) lab.textContent = fmt ? fmt(+el.value) : el.value; fn(+el.value); }; el.onchange = () => { began = false; VE.saveSoon(); }; };

  /* ---------- 탭 ---------- */
  const TABS = [
    ['media', 'folder', '미디어'], ['rec', 'record', '녹화'], ['text', 'captions', '자막·글'], ['cut', 'scissors', '군더더기'],
    ['face', 'smile', '얼굴'], ['voice', 'mic', '목소리'], ['title', 'type', '글자'],
  ];
  VE.tabs = TABS;
  VE.openTab = (k) => { tab = k; document.querySelectorAll('.ve-rail button[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === k)); document.body.classList.add('ve-panel-open'); if (k !== 'cut') { VE.tl.overlay = null; VE.tl.request(); } renderTab(); };
  const closePanel = () => document.body.classList.remove('ve-panel-open'); VE.closePanel = closePanel;
  function renderTab() { const box = $('vePanel'); if (!box) return; const fn = { media: pMedia, rec: pRec, text: pText, cut: pCut, face: pFace, voice: pVoice, title: pTitle }[tab]; fn(box); fillIcons(box); }
  VE.renderTab = renderTab;
  const head = (title, sub) => `<div class="ve-ph"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><button class="btn icon ghost ve-close" data-act="closePanel" title="닫기" aria-label="닫기"><i data-ic="x"></i></button></div>`;
  document.addEventListener('click', ev => { if (ev.target.closest('[data-act=closePanel]')) closePanel(); });

  /* ---------- 미디어 ---------- */
  function pMedia(box) {
    const list = VE.p.media;
    box.innerHTML = head('미디어', '영상 · 소리 · 그림을 넣습니다. 파일은 이 기기에만 보관합니다.') + `
      <button class="ve-drop" id="mImport" type="button"><i data-ic="upload"></i><b>파일 넣기</b><span>여기를 누르거나 창 어디든 끌어다 놓으세요</span></button>
      <div class="ve-mlist">${list.map(m => `<div class="ve-mitem${m.offline ? ' off' : ''}" draggable="true" data-mid="${m.id}">
        <div class="ve-mth" data-th="${m.id}"><i data-ic="${m.kind === 'audio' ? 'music' : m.kind === 'image' ? 'image' : 'film'}"></i></div>
        <div class="ve-mi"><b title="${esc(m.name)}">${esc(m.name)}</b><span>${m.offline ? '원본이 없습니다' : (m.kind === 'image' ? `${m.w}×${m.h}` : VE.fmtT(m.dur) + (m.w ? ` · ${m.w}×${m.h}` : ''))} · ${VE.fmtSize(m.size || 0)}</span></div>
        ${m.offline ? `<button class="btn sm" data-relink="${m.id}">다시 연결</button>` : `<button class="btn icon sm" data-add="${m.id}" title="타임라인 끝에 넣기" aria-label="타임라인에 넣기"><i data-ic="plus"></i></button>`}
      </div>`).join('') || '<div class="ve-empty">아직 넣은 파일이 없습니다.</div>'}</div>`;
    box.querySelector('#mImport').onclick = () => VE.pickFiles();
    box.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { VE.addClip(b.dataset.add); if (VE.fitTimeline && VE.p.clips.length < 3) VE.fitTimeline(); });
    box.querySelectorAll('[data-relink]').forEach(b => b.onclick = () => VE.pickFiles(files => { if (files[0]) VE.relink(b.dataset.relink, files[0]); }));
    box.querySelectorAll('.ve-mitem').forEach(it => { it.ondragstart = ev => { ev.dataTransfer.setData('text/ve-media', it.dataset.mid); ev.dataTransfer.effectAllowed = 'copy'; }; });
    box.querySelectorAll('[data-th]').forEach(async n => { const m = VE.media(n.dataset.th); if (!m || m.kind === 'audio' || m.offline) return; const step = 1; const tryDraw = () => { const b = VE.thumb(m.id, Math.min(1, m.dur / 2), step); if (b) { const cv = document.createElement('canvas'); cv.width = 96; cv.height = 54; const c = cv.getContext('2d'), s = Math.max(96 / b.width, 54 / b.height); c.drawImage(b, (96 - b.width * s) / 2, (54 - b.height * s) / 2, b.width * s, b.height * s); n.innerHTML = ''; n.appendChild(cv); return true; } return false; }; if (!tryDraw()) { let tries = 0; const iv = setInterval(() => { if (tryDraw() || ++tries > 30 || !n.isConnected) clearInterval(iv); }, 300); } });
  }

  /* ---------- 녹화 ---------- */
  const recUi = { source: 'screen', mic: true, camera: false, systemAudio: true };
  let previewStream = null;
  function pRec(box) {
    const R = VE.rec, busy = R.state !== 'idle';
    if (busy) {
      box.innerHTML = head('녹화', '') + `<div class="ve-rec-live"><div class="ve-rec-time"><span class="dot${R.state === 'paused' ? ' still' : ''}"></span>${VE.fmtT(R.elapsed)}</div>
        <p class="muted">${R.state === 'saving' ? '녹화 파일을 정리하는 중입니다…' : R.state === 'count' ? '곧 시작합니다' : R.state === 'paused' ? '잠시 멈췄습니다' : '녹화 중입니다. 다른 창으로 가도 계속 녹화됩니다.'}</p>
        <video id="recPrev" muted playsinline autoplay></video>
        ${R.state === 'recording' || R.state === 'paused' ? `<div class="ve-row"><button class="btn" id="recPause"><i data-ic="${R.state === 'paused' ? 'play' : 'pause'}"></i>${R.state === 'paused' ? '이어서' : '잠시 멈춤'}</button><button class="btn ink" id="recStop"><i data-ic="stop"></i>끝내기</button></div>` : ''}</div>`;
      const v = box.querySelector('#recPrev'); if (previewStream) v.srcObject = previewStream; else v.hidden = true;
      const p = box.querySelector('#recPause'), s = box.querySelector('#recStop'); if (p) p.onclick = () => R.pause(); if (s) s.onclick = () => R.stop(); return;
    }
    const canS = R.canScreen();
    box.innerHTML = head('녹화', '화면, 카메라, 목소리를 녹화해 바로 타임라인에 넣습니다.') + `
      ${canS ? '' : '<div class="ve-note warn">이 기기의 브라우저는 화면 녹화를 지원하지 않습니다. 카메라와 음성 녹음은 됩니다. 화면 녹화는 PC 의 크롬이나 엣지에서 해 주세요.</div>'}
      <div class="ve-sec"><div class="ve-lab">무엇을 녹화할까요</div>${seg('rSource', recUi.source, [['screen', '화면'], ['camera', '카메라만'], ['audio', '음성만']])}</div>
      <div class="ve-sec">
        ${recUi.source !== 'audio' ? '<label class="ve-check"><input type="checkbox" id="rMic"' + (recUi.mic ? ' checked' : '') + '><span><b>마이크</b> 내 목소리를 함께 녹음</span></label>' : ''}
        ${recUi.source === 'screen' ? `<label class="ve-check"><input type="checkbox" id="rSys"${recUi.systemAudio ? ' checked' : ''}><span><b>화면 소리</b> 탭이나 PC 소리 (고를 때 '오디오 공유'를 켜 주세요)</span></label>
        <label class="ve-check"><input type="checkbox" id="rCam"${recUi.camera ? ' checked' : ''}><span><b>카메라</b> 구석에 내 모습. 나중에 캐릭터로 바꾸거나 끌 수 있습니다</span></label>` : ''}
      </div>
      <button class="btn ink ve-big" id="rStart"><i data-ic="record"></i>${recUi.source === 'audio' ? '녹음 시작' : '녹화 시작'}</button>
      <p class="ve-hint">3초를 센 뒤 시작합니다. 끝내면 자동으로 타임라인에 들어갑니다.</p>`;
    onSeg(box, 'rSource', v => { recUi.source = v; renderTab(); fillIcons(box); });
    const bind = (id, k) => { const e = box.querySelector('#' + id); if (e) e.onchange = () => { recUi[k] = e.checked; }; }; bind('rMic', 'mic'); bind('rSys', 'systemAudio'); bind('rCam', 'camera');
    box.querySelector('#rStart').onclick = async () => {
      try {
        const got = await R.prepare({ ...recUi }); previewStream = got.screen || got.cam || null; R.state = 'count'; R.cancelled = false; R.elapsed = 0; renderTab();
        const ov = $('veCount'); ov.hidden = false; for (const n of [3, 2, 1]) { ov.textContent = n; await new Promise(z => setTimeout(z, 800)); if (R.cancelled) break; } ov.hidden = true;
        if (R.cancelled) { R.abort(); previewStream = null; return; }
        R.start();
      } catch (e) { R.abort(); if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') toast(e.message, 4000); else toast('녹화를 시작하지 않았습니다', 2200); }
    };
  }
  VE.on('rec', () => { if (VE.rec.state === 'idle') previewStream = null; if (tab === 'rec') { const t = document.querySelector('.ve-rec-time'); if (t && (VE.rec.state === 'recording')) { t.innerHTML = `<span class="dot"></span>${VE.fmtT(VE.rec.elapsed)}`; if (!document.getElementById('recPause') || document.getElementById('recPause').textContent.includes('이어서')) renderTab(); return; } renderTab(); } const b = $('veRecBadge'); if (b) { b.hidden = !(VE.rec.state === 'recording' || VE.rec.state === 'paused'); } });

  /* ---------- 자막 · 글로 편집 ---------- */
  const textUi = { quality: 'base', lang: 'korean', sel: null };
  let lastCapKey = '';
  function pText(box) {
    const mids = [...new Set(VE.p.clips.map(c => c.mid))].filter(id => { const m = VE.media(id); return m && m.hasAudio && m.kind !== 'image'; });
    const missing = mids.filter(id => !VE.media(id).words), caps = VE.captions(), running = job.text;
    const cap = VE.p.cap;
    box.innerHTML = head('자막 · 글로 편집', '말을 글로 받아 적습니다. 글을 지우면 영상도 함께 잘립니다.') + `
      ${running ? progress('text', 'stopText') : ''}
      ${!running && missing.length ? `<div class="ve-sec"><div class="ve-lab">정확도</div>${seg('tQuality', textUi.quality, [['base', '빠르게 (약 80MB)'], ['small', '더 정확하게 (약 250MB)']])}
        <div class="ve-lab" style="margin-top:10px">말하는 언어</div>${seg('tLang', textUi.lang, [['korean', '한국어'], ['english', '영어'], ['', '자동']])}
        <button class="btn ink ve-big" id="tRun" style="margin-top:12px"><i data-ic="sparkle"></i>자막 만들기</button>
        <p class="ve-hint">처음 한 번만 모델을 내려받습니다. 소리는 밖으로 보내지 않습니다.</p>
        <button class="btn sm ghost" id="tSrt"><i data-ic="import"></i>자막 파일(SRT) 넣기</button></div>` : ''}
      ${!mids.length ? '<div class="ve-empty">타임라인에 소리가 있는 영상을 넣으면 자막을 만들 수 있습니다.</div>' : ''}
      ${caps.length ? `<div class="ve-sec ve-inline"><label class="ve-check tight"><input type="checkbox" id="tOn"${cap.on ? ' checked' : ''}><span><b>영상에 자막 넣기</b></span></label></div>
        <div class="ve-sec"><div class="ve-lab">모양</div>${seg('tStyle', cap.style, [['outline', '테두리'], ['box', '상자'], ['word', '말하는 낱말 강조']])}
        <div class="ve-lab" style="margin-top:10px">자리</div>${seg('tPos', cap.pos, [['top', '위'], ['middle', '가운데'], ['bottom', '아래']])}
        <div style="margin-top:10px">${range('tSize', '크기', cap.size, .6, 1.8, .05, v => Math.round(v * 100) + '%')}</div></div>
        <div class="ve-tools"><button class="btn sm" id="tFill"><i data-ic="search"></i>군말 찾기</button><button class="btn sm danger" id="tDel" disabled><i data-ic="scissors"></i>고른 말 지우기</button><button class="btn sm ghost" id="tExp" title="자막 파일로 저장"><i data-ic="download"></i>SRT</button></div>
        <div class="ve-transcript" id="tDoc" tabindex="0">${renderDoc(caps)}</div>
        <p class="ve-hint">낱말을 누르면 그 자리로 갑니다. 끌어서 고른 뒤 Del 을 누르면 그 부분이 잘립니다. 두 번 누르면 글자를 고칩니다.</p>` : ''}`;
    onSeg(box, 'tQuality', v => { textUi.quality = v; renderTab(); }); onSeg(box, 'tLang', v => { textUi.lang = v; renderTab(); });
    const run = box.querySelector('#tRun'); if (run) run.onclick = () => runTranscribe(missing);
    const srt = box.querySelector('#tSrt'); if (srt) srt.onclick = () => VE.pickFiles(async files => { if (!files[0]) return; const n = VE.importSrt(await files[0].text(), mids[0]); toast(`자막 ${n}낱말을 넣었습니다`, 2400); renderTab(); }, '.srt');
    onSeg(box, 'tStyle', v => { VE.edit(() => { VE.p.cap.style = v; }); renderTab(); }); onSeg(box, 'tPos', v => { VE.edit(() => { VE.p.cap.pos = v; }); renderTab(); });
    onRange(box, 'tSize', v => { VE.p.cap.size = v; VE.touch(true); }, v => Math.round(v * 100) + '%');
    const on = box.querySelector('#tOn'); if (on) on.onchange = () => VE.edit(() => { VE.p.cap.on = on.checked; });
    const exp = box.querySelector('#tExp'); if (exp) exp.onclick = () => VE.download(new Blob(['﻿' + VE.toSrt()], { type: 'text/plain;charset=utf-8' }), VE.safeName(VE.p.name) + '.srt');
    const fill = box.querySelector('#tFill'); if (fill) fill.onclick = () => { const list = VE.findFillers(); if (!list.length) { toast('군말을 찾지 못했습니다. 음성 인식은 "음", "어" 를 적지 않을 때가 많습니다. [군더더기] 탭의 무음 자르기도 함께 쓰세요.', 5000); return; } if (confirm(`"음", "어" 같은 군말 ${list.length}개를 찾았습니다. 모두 잘라 낼까요? (되돌리기로 돌아올 수 있습니다)`)) { VE.cutWords(list); renderTab(); } };
    bindDoc(box);
  }
  function renderDoc(caps) {
    let html = '', prevEnd = -1, para = false; caps.forEach((c, ci) => { c.words.forEach((w, wi) => { if (prevEnd >= 0 && w.s - prevEnd > 1.4 && !para) { html += '</p><p>'; para = true; } html += `<span class="w" data-c="${ci}" data-w="${wi}">${esc(w.t)}</span> `; prevEnd = w.e; para = false; }); });
    return `<p>${html}</p>`;
  }
  const wordFrom = el => { const c = VE.captions()[+el.dataset.c]; return c ? c.words[+el.dataset.w] : null; };
  function selectedWords() { const s = getSelection(), doc = $('tDoc'); if (!s || s.isCollapsed || !doc) return []; const out = []; doc.querySelectorAll('.w').forEach(n => { if (s.containsNode(n, true)) { const w = wordFrom(n); if (w) out.push(w); } }); return out; }
  function bindDoc(box) {
    const doc = box.querySelector('#tDoc'), del = box.querySelector('#tDel'); if (!doc) return;
    const cutSel = () => { const w = selectedWords(); if (!w.length) return; VE.cutWords(w); getSelection().removeAllRanges(); renderTab(); toast(`${w.length}낱말을 잘랐습니다. Ctrl+Z 로 되돌립니다.`, 2400); };
    if (del) del.onclick = cutSel;
    document.onselectionchange = () => { const d = $('tDel'); if (!d) return; const has = selectedWords().length > 0; d.disabled = !has; };
    doc.onclick = ev => { const n = ev.target.closest('.w'); if (!n) return; const s = getSelection(); if (s && !s.isCollapsed) return; const w = wordFrom(n); if (w) VE.player.seek(w.s + .001); };
    doc.ondblclick = ev => {
      const n = ev.target.closest('.w'); if (!n) return; const w = wordFrom(n); if (!w) return; getSelection().removeAllRanges();
      const inp = document.createElement('input'); inp.type = 'text'; inp.value = w.t; inp.className = 've-wedit'; inp.style.width = Math.max(40, n.offsetWidth + 22) + 'px'; n.replaceWith(inp); inp.focus(); inp.select();
      const done = (save) => { const v = inp.value.trim(); if (save && v && v !== w.t) { w.ref.t = v; VE.capDirty(); } renderTab(); };
      inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') done(true); else if (e.key === 'Escape') done(false); }; inp.onblur = () => done(true);
    };
    doc.onkeydown = ev => { if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); ev.stopPropagation(); cutSel(); } };
  }
  async function runTranscribe(mids) {
    if (job.text) return; const ac = new AbortController(); job.text = { stage: '준비 중', ratio: 0, abort: ac }; renderTab();
    try {
      for (let i = 0; i < mids.length; i++) await VE.transcribe(mids[i], { quality: textUi.quality, lang: textUi.lang || null, signal: ac.signal, onProg: p => { job.text.stage = p.stage + (mids.length > 1 ? ` (${i + 1}/${mids.length})` : ''); job.text.ratio = p.ratio; job.text.eta = p.eta; if (tab === 'text') updateProgress('text'); } });
      toast('자막을 만들었습니다', 2400);
    } catch (e) { if (e.name !== 'AbortError') { console.error(e); toast('자막을 만들지 못했습니다: ' + e.message, 5000); } }
    delete job.text; if (tab === 'text') renderTab();
  }
  /* 진행 막대만 고침 */
  function updateProgress(k) { const p = $('vePanel').querySelector('.ve-prog'); if (!p) { renderTab(); return; } const j = job[k]; if (!j) return; p.querySelector('.ve-prog-top span').textContent = j.stage || ''; p.querySelector('.ve-prog-top .muted').textContent = `${j.ratio != null ? Math.round(j.ratio * 100) + '%' : ''} ${eta(j.eta)}`; p.querySelector('.ve-bar i').style.width = Math.round((j.ratio || 0) * 100) + '%'; }
  document.addEventListener('click', ev => { const b = ev.target.closest('[data-act]'); if (!b) return; if (b.dataset.act === 'stopText' && job.text) job.text.abort.abort(); if (b.dataset.act === 'stopFace' && job.face) job.face.abort.abort(); });
  /* 재생 중 지금 말하는 낱말 표시 */
  VE.on('time', () => {
    if (tab !== 'text') return; const doc = $('tDoc'); if (!doc) return; const t = VE.player.t, c = VE.capAt(t); if (!c) { if (lastCapKey) { const o = doc.querySelector('.w.now'); if (o) o.classList.remove('now'); lastCapKey = ''; } return; }
    const ci = VE.captions().indexOf(c); let wi = c.words.findIndex(w => t >= w.s && t < w.e + .05); if (wi < 0) return; const key = ci + ':' + wi; if (key === lastCapKey) return; lastCapKey = key;
    const o = doc.querySelector('.w.now'); if (o) o.classList.remove('now'); const n = doc.querySelector(`.w[data-c="${ci}"][data-w="${wi}"]`); if (n) { n.classList.add('now'); if (VE.player.playing) { const r = n.offsetTop - doc.scrollTop; if (r < 0 || r > doc.clientHeight - 30) doc.scrollTop = n.offsetTop - 40; } }
  });

  /* ---------- 군더더기 자르기 ---------- */
  const cutUi = { sens: .3, minLen: .7, pad: .12 };
  let found = [];
  const refreshSilence = () => { found = VE.findSilence(cutUi); VE.tl.overlay = found; VE.tl.request(); const n = $('cFound'); if (n) { const sum = found.reduce((s, r) => s + r[1] - r[0], 0); n.innerHTML = found.length ? `<b>${found.length}곳</b>에서 모두 <b>${VE.fmtLen(sum)}</b> 분량을 찾았습니다. 타임라인에 빨간 빗금으로 표시했습니다.` : '찾은 곳이 없습니다. 민감도를 올려 보세요.'; const a = $('cApply'); if (a) a.disabled = !found.length; } };
  function pCut(box) {
    const anyAudio = VE.p.clips.some(c => { const m = VE.media(c.mid); return m && m.hasAudio; }), wait = VE.p.clips.some(c => { const r = VE.rt.get(c.mid), m = VE.media(c.mid); return m && m.hasAudio && r && !r.peaksDone; });
    box.innerHTML = head('군더더기 자르기', '말이 없는 곳을 찾아 한 번에 잘라 냅니다.') + `
      ${!anyAudio ? '<div class="ve-empty">소리가 있는 영상을 타임라인에 넣어 주세요.</div>' : `
      ${wait ? '<div class="ve-note">소리를 분석하는 중입니다. 끝나면 결과가 더 정확해집니다.</div>' : ''}
      <div class="ve-sec">${range('cSens', '민감도', cutUi.sens, .1, .6, .02, v => v < .22 ? '조용한 곳만' : v < .4 ? '보통' : '적극적으로')}
      ${range('cMin', '이보다 긴 무음만', cutUi.minLen, .2, 3, .1, v => v.toFixed(1) + '초')}
      ${range('cPad', '말 앞뒤 여유', cutUi.pad, 0, .5, .02, v => v.toFixed(2) + '초')}</div>
      <div class="ve-result" id="cFound"></div>
      <button class="btn ink ve-big" id="cApply"><i data-ic="scissors"></i>찾은 곳 모두 자르기</button>
      <p class="ve-hint">자른 뒤에도 Ctrl+Z 로 되돌릴 수 있습니다.</p>`}
      <div class="ve-sec" style="margin-top:6px"><div class="ve-lab">재생 위치에서 앞뒤 지우기</div><div class="ve-row"><button class="btn sm" id="cHead">앞부분 지우기 <kbd>Q</kbd></button><button class="btn sm" id="cTail">뒷부분 지우기 <kbd>W</kbd></button></div></div>`;
    if (anyAudio) {
      const fmtS = v => v < .22 ? '조용한 곳만' : v < .4 ? '보통' : '적극적으로';
      onRange(box, 'cSens', v => { cutUi.sens = v; refreshSilence(); }, fmtS, true); onRange(box, 'cMin', v => { cutUi.minLen = v; refreshSilence(); }, v => v.toFixed(1) + '초', true); onRange(box, 'cPad', v => { cutUi.pad = v; refreshSilence(); }, v => v.toFixed(2) + '초', true);
      box.querySelector('#cApply').onclick = () => { if (!found.length) return; const n = found.length, s = VE.removeRanges(found); VE.tl.overlay = null; found = []; toast(`${n}곳에서 ${VE.fmtLen(s)} 분량을 잘라 냈습니다`, 2800); if (VE.fitTimeline) VE.fitTimeline(); renderTab(); };
      refreshSilence();
    }
    box.querySelector('#cHead').onclick = () => VE.trimToPlayhead('head'); box.querySelector('#cTail').onclick = () => VE.trimToPlayhead('tail');
  }
  VE.on('peaks', () => { if (tab === 'cut') refreshSilence(); });
  VE.trimToPlayhead = (side) => { const a = VE.at(VE.player.t); if (!a) return; const start = a.start, end = start + VE.clipLen(a.clip), t = VE.player.t; if (side === 'head') { if (t - start > .02) { VE.removeRanges([[start, t]]); VE.player.seek(start); } } else if (end - t > .02) VE.removeRanges([[t, end]]); };

  /* ---------- 얼굴 ---------- */
  const faceUi = { scope: 'all' };
  function pFace(box) {
    const p = VE.p, sel = VE.sel && VE.sel.type === 'clip' ? VE.selObj() : null, ref = sel || p.clips.find(c => c.face && c.face.mode), cur = ref && ref.face ? ref.face : null, curMode = cur ? cur.mode : '', curChar = cur ? cur.char : '';
    const groups = {}; for (const id in VE.CHARS) { const g = VE.CHARS[id].group; (groups[g] = groups[g] || []).push(id); }
    const customs = [...VE.customChars.keys()];
    box.innerHTML = head('얼굴 바꾸기', '얼굴을 따라 움직이는 동물 · 캐릭터 · 가상 인물로 바꿉니다.') + `
      ${job.face ? progress('face', 'stopFace') : ''}
      ${!p.faceOk ? `<div class="ve-note"><label class="ve-check tight"><input type="checkbox" id="fOk"><span>이 영상의 얼굴은 <b>제 얼굴이거나 당사자의 동의를 받았습니다.</b> 실제 사람인 것처럼 속이는 데 쓰지 않습니다.</span></label></div>` : ''}
      <div class="${p.faceOk ? '' : 've-locked'}">
      <div class="ve-sec"><div class="ve-lab">바꿀 곳</div>${seg('fScope', faceUi.scope, [['all', '영상 전체'], ['sel', '고른 클립만']])}</div>
      ${Object.keys(groups).map(g => `<div class="ve-sec"><div class="ve-lab">${g}</div><div class="ve-chars">${groups[g].map(id => charCell(id, curMode === 'char' && curChar === id)).join('')}</div></div>`).join('')}
      <div class="ve-sec"><div class="ve-lab">내 그림</div><div class="ve-chars">${customs.map(id => charCell(id, curMode === 'char' && curChar === id, true)).join('')}<button class="ve-char add" id="fAdd" type="button"><i data-ic="plus"></i><span>그림 넣기</span></button></div>
        <p class="ve-hint">정면을 보는 투명 배경 PNG 나 SVG 를 넣습니다. 입 벌린 그림, 눈 감은 그림을 함께 넣으면 말할 때 움직입니다. 실제 인물 사진은 넣지 마세요.</p></div>
      <div class="ve-sec"><div class="ve-lab">다른 효과</div><div class="ve-row"><button class="btn sm${curMode === 'mosaic' ? ' active' : ''}" id="fMosaic"><i data-ic="blur"></i>얼굴 모자이크</button><button class="btn sm" id="fOff"${curMode ? '' : ' disabled'}><i data-ic="x"></i>효과 끄기</button></div></div>
      ${curMode === 'char' ? `<div class="ve-sec">${range('fScale', '크기', cur.scale || 1.25, .7, 2.2, .05, v => Math.round(v * 100) + '%')}${range('fDy', '위아래 위치', cur.dy || 0, -.6, .6, .02, v => (v > 0 ? '아래 ' : v < 0 ? '위 ' : '') + Math.abs(Math.round(v * 100)))}
        <label class="ve-check tight"><input type="checkbox" id="fLabel"${p.aiLabel ? ' checked' : ''}><span><b>'AI 캐릭터' 표시</b> 영상 오른쪽 위에 작게 넣습니다</span></label></div>` : ''}
      </div>`;
    const ok = box.querySelector('#fOk'); if (ok) ok.onchange = () => { if (ok.checked) { p.faceOk = true; VE.saveSoon(); renderTab(); } };
    onSeg(box, 'fScope', v => { faceUi.scope = v; renderTab(); });
    box.querySelectorAll('[data-char]').forEach(b => { const holder = b.querySelector('[data-pic]'); if (holder && !holder.firstChild) holder.appendChild(VE.charThumb(b.dataset.char, 112)); b.onclick = ev => { if (ev.target.closest('[data-del]')) return; applyFace({ mode: 'char', char: b.dataset.char, scale: cur && cur.scale || 1.25, dy: cur && cur.dy || 0 }); }; });
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (confirm('이 그림을 지울까요?')) { await VE.removeCustomChar(b.dataset.del); renderTab(); } });
    box.querySelector('#fMosaic').onclick = () => applyFace({ mode: 'mosaic' });
    box.querySelector('#fOff').onclick = () => applyFace(null);
    box.querySelector('#fAdd').onclick = () => addCharDialog();
    const live = (k) => v => { const set = o => { if (o.face) o.face[k] = v; }; targetClips().forEach(set); VE.touch(true); };
    onRange(box, 'fScale', live('scale'), v => Math.round(v * 100) + '%'); onRange(box, 'fDy', live('dy'), v => (v > 0 ? '아래 ' : v < 0 ? '위 ' : '') + Math.abs(Math.round(v * 100)));
    const lb = box.querySelector('#fLabel'); if (lb) lb.onchange = () => VE.edit(() => { p.aiLabel = lb.checked; });
  }
  const charCell = (id, on, custom) => `<div class="ve-char${on ? ' on' : ''}" data-char="${esc(id)}" role="button" tabindex="0"><span data-pic></span><span>${esc(VE.charName(id))}</span>${custom ? `<button class="ve-del" data-del="${esc(id)}" title="지우기" aria-label="지우기"><i data-ic="x"></i></button>` : ''}</div>`;
  const targetClips = () => { if (faceUi.scope === 'sel') { const o = VE.sel && VE.sel.type === 'clip' ? VE.selObj() : null; return o ? [o] : []; } return VE.p.clips.filter(c => { const m = VE.media(c.mid); return m && m.kind === 'video'; }); };
  async function applyFace(face) {
    const list = targetClips(); if (!list.length) { toast(faceUi.scope === 'sel' ? '타임라인에서 클립을 먼저 고르세요' : '타임라인에 영상을 먼저 넣으세요', 2600); return; }
    VE.edit(() => { list.forEach(c => { c.face = face ? { ...face } : null; }); });
    renderTab();
    if (face) runFace();
  }
  async function runFace() {
    if (job.face) return; if (!VE.needFaceJobs().length) return; const ac = new AbortController(); job.face = { stage: '얼굴 위치 찾는 중', ratio: 0, abort: ac }; if (tab === 'face') renderTab();
    try { await VE.runFaceJobs(p => { job.face.ratio = p.ratio; job.face.eta = p.eta; if (tab === 'face') updateProgress('face'); VE.player.invalidate(); }, ac.signal); toast('얼굴 위치를 모두 찾았습니다', 2200); }
    catch (e) { if (e.name !== 'AbortError') { console.error(e); toast('얼굴을 찾지 못했습니다: ' + e.message, 5000); } }
    delete job.face; if (tab === 'face') renderTab(); VE.player.invalidate();
  }
  VE.runFace = runFace;
  function addCharDialog() {
    const bg = document.createElement('div'); bg.className = 'modal-bg'; const files = {};
    bg.innerHTML = `<div class="modal" style="width:480px"><h3>내 캐릭터 그림 넣기</h3>
      <div class="ve-field"><span class="ve-lab">이름</span><input type="text" id="cName" value="내 캐릭터"></div>
      <div class="ve-slots">${[['base', '기본', '꼭 필요'], ['mouth', '입 벌림', '말할 때'], ['blink', '눈 감음', '깜빡일 때'], ['both', '입 벌림 + 눈 감음', '선택']].map(([k, t, d]) => `<label class="ve-slot" data-k="${k}"><input type="file" accept="image/png,image/svg+xml,image/webp" hidden><span class="pic"><i data-ic="image"></i></span><b>${t}</b><span class="muted">${d}</span></label>`).join('')}</div>
      <p class="ve-hint">투명 배경의 정면 그림을 권합니다. 크기는 모두 같게 맞춰 주세요. 기본 그림 하나만 넣어도 얼굴을 따라 움직입니다.</p>
      <div class="actions"><button class="btn" id="cCancel">취소</button><button class="btn primary" id="cSave" disabled>넣기</button></div></div>`;
    document.body.appendChild(bg); fillIcons(bg);
    bg.querySelectorAll('.ve-slot').forEach(s => { const inp = s.querySelector('input'); inp.onchange = () => { const f = inp.files[0]; if (!f) return; files[s.dataset.k] = f; const url = URL.createObjectURL(f); s.querySelector('.pic').innerHTML = `<img src="${url}" alt="">`; bg.querySelector('#cSave').disabled = !files.base; }; });
    bg.querySelector('#cCancel').onclick = () => bg.remove();
    bg.querySelector('#cSave').onclick = async () => { try { await VE.saveCustomChar('u' + uid(), bg.querySelector('#cName').value.trim() || '내 캐릭터', files); bg.remove(); renderTab(); toast('그림을 넣었습니다. 눌러서 고르세요.', 2400); } catch (e) { toast('그림을 읽지 못했습니다: ' + e.message, 4000); } };
  }
  VE.on('chars', () => { if (tab === 'face') renderTab(); });

  /* ---------- 목소리 ---------- */
  function pVoice(box) {
    const v = VE.p.voice, P = VoiceDSP.PRESETS;
    box.innerHTML = head('목소리', '잡음을 줄이고, 음량을 고르게 맞추고, 목소리를 바꿉니다.') + `
      <div class="ve-sec"><label class="ve-check tight"><input type="checkbox" id="vClean"${v.clean ? ' checked' : ''}><span><b>음성 정리</b> 저음 웅웅거림과 일정한 잡음을 줄입니다</span></label>
        <div class="${v.clean ? '' : 've-locked'}" style="margin-top:8px">${range('vDen', '잡음 줄이는 정도', v.denoise, 0, 1, .05, x => Math.round(x * 100) + '%')}
        <label class="ve-check tight"><input type="checkbox" id="vLevel"${v.level ? ' checked' : ''}><span><b>음량 맞추기</b> 작은 말은 키우고 큰 소리는 눌러 고르게 합니다</span></label></div></div>
      <div class="ve-sec"><div class="ve-lab">목소리 바꾸기</div><div class="ve-grid2">${Object.keys(P).map(k => `<button class="ve-opt${v.preset === k ? ' on' : ''}" data-preset="${k}" type="button">${P[k].name}</button>`).join('')}</div>
        <div style="margin-top:10px">${range('vPitch', '음높이 조금 더', v.pitch, -6, 6, 1, x => (x > 0 ? '+' : '') + x)}</div>
        <p class="ve-hint">재생하면서 바로 들어 볼 수 있고, 내보낸 영상에도 그대로 들어갑니다. 특정 인물의 목소리를 흉내 내는 기능은 넣지 않았습니다.</p></div>`;
    const changed = () => { VE.player.voiceChanged(); VE.saveSoon(); };
    box.querySelector('#vClean').onchange = e => { VE.edit(() => { v.clean = e.target.checked; }); changed(); renderTab(); };
    box.querySelector('#vLevel').onchange = e => { VE.edit(() => { v.level = e.target.checked; }); changed(); };
    onRange(box, 'vDen', x => { v.denoise = x; changed(); }, x => Math.round(x * 100) + '%'); onRange(box, 'vPitch', x => { v.pitch = x; changed(); }, x => (x > 0 ? '+' : '') + x);
    box.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => { VE.edit(() => { v.preset = b.dataset.preset; }); changed(); renderTab(); });
  }

  /* ---------- 글자 ---------- */
  function pTitle(box) {
    box.innerHTML = head('글자', '재생 위치에 글자를 넣습니다. 미리보기에서 끌어 옮깁니다.') + `
      <div class="ve-grid2 tall"><button class="ve-opt big" data-preset="title" type="button"><b>큰 제목</b><span>장면의 주제</span></button><button class="ve-opt big" data-preset="lower" type="button"><b>이름표</b><span>아래쪽 띠</span></button><button class="ve-opt big" data-preset="note" type="button"><b>설명 글</b><span>작은 글자</span></button></div>
      <div class="ve-mlist" style="margin-top:12px">${VE.p.titles.slice().sort((a, b) => a.start - b.start).map(o => `<button class="ve-tlist" data-id="${o.id}" type="button"><b>${esc(String(o.text).split('\n')[0])}</b><span>${VE.fmtT(o.start)} ~ ${VE.fmtT(o.end)}</span></button>`).join('') || '<div class="ve-empty">아직 넣은 글자가 없습니다.</div>'}</div>`;
    box.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => { VE.addTitle(b.dataset.preset === 'title' ? '제목을 입력하세요' : b.dataset.preset === 'lower' ? '이름 · 소속' : '설명을 입력하세요', b.dataset.preset); renderTab(); });
    box.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { const o = VE.p.titles.find(x => x.id === b.dataset.id); if (o) { VE.player.seek(o.start + .01); VE.select({ type: 'title', id: o.id }); } });
  }

  /* ---------- 속성 칸 ---------- */
  function renderProps() {
    const box = $('veProps'); if (!box) return; const s = VE.sel, o = VE.selObj(), p = VE.p;
    if (!o) {
      const total = VE.total();
      box.innerHTML = `<div class="ve-ph"><div><h2>영상 설정</h2></div></div>
        <div class="ve-sec"><div class="ve-lab">화면 비율</div><div class="ve-ratio" id="pAspect">${[['16:9', '가로', 'YouTube'], ['9:16', '세로', '쇼츠'], ['1:1', '정사각형', ''], ['4:5', '4:5', '피드']].map(([v, t, d]) => `<button type="button" data-v="${v}" class="${p.aspect === v ? 'on' : ''}"><span class="shape r${v.replace(':', '-')}"></span><b>${t}</b>${d ? `<em>${d}</em>` : ''}</button>`).join('')}</div></div>
        <div class="ve-sec"><div class="ve-lab">빈 자리 배경</div>${seg('pBg', p.bg, [['blur', '흐린 장면'], ['black', '검정'], ['white', '흰색']])}</div>
        <div class="ve-sec"><div class="ve-lab">초당 장면 수</div>${seg('pFps', p.fps, [[24, '24'], [30, '30'], [60, '60']])}</div>
        <div class="ve-stat"><div><span>전체 길이</span><b>${VE.fmtT(total)}</b></div><div><span>클립</span><b>${p.clips.length}개</b></div></div>
        <div class="ve-keys"><div class="ve-lab">자주 쓰는 키</div><ul><li><kbd>Space</kbd>재생 · 멈춤</li><li><kbd>S</kbd>재생 위치에서 자르기</li><li><kbd>Del</kbd>고른 것 지우기</li><li><kbd>Q</kbd><kbd>W</kbd>앞부분 · 뒷부분 지우기</li><li><kbd>←</kbd><kbd>→</kbd>한 장면씩 이동</li><li><kbd>Ctrl</kbd>+휠 타임라인 확대</li></ul></div>`;
      box.querySelector('#pAspect').onclick = ev => { const b = ev.target.closest('button'); if (b) { VE.edit(() => { p.aspect = b.dataset.v; }); renderProps(); } };
      onSeg(box, 'pBg', v => { VE.edit(() => { p.bg = v; }); renderProps(); }); onSeg(box, 'pFps', v => { VE.edit(() => { p.fps = +v; }); renderProps(); });
      fillIcons(box); return;
    }
    if (s.type === 'clip') {
      const m = VE.media(o.mid), isV = m && m.kind === 'video', vids = p.media.filter(x => x.kind === 'video' && x.id !== o.mid);
      box.innerHTML = `<div class="ve-ph"><div><h2 title="${esc(m ? m.name : '')}">${esc(m ? m.name : '클립')}</h2><p>${VE.fmtLen(VE.clipLen(o))}${m && m.kind === 'video' ? ` · 원본 ${VE.fmtT(o.in)}~${VE.fmtT(o.out)}` : ''}</p></div><button class="btn icon ghost" id="pDel" title="이 클립 지우기 (Del)" aria-label="지우기"><i data-ic="trash"></i></button></div>
        ${m && m.kind === 'image' ? `<div class="ve-sec">${range('pLen', '보여 줄 시간', o.out - o.in, .5, 30, .5, v => v + '초')}</div>` : ''}
        ${isV ? `<div class="ve-sec"><div class="ve-lab">속도</div>${seg('pSpeed', o.speed || 1, [[.5, '0.5'], [1, '1'], [1.25, '1.25'], [1.5, '1.5'], [2, '2']])}</div>` : ''}
        ${m && m.hasAudio ? `<div class="ve-sec">${range('pVol', '소리 크기', o.vol, 0, 2, .05, v => Math.round(v * 100) + '%')}</div>` : ''}
        <div class="ve-sec">${range('pFI', '서서히 나타나기', o.fadeIn, 0, 3, .1, v => v.toFixed(1) + '초')}${range('pFO', '서서히 사라지기', o.fadeOut, 0, 3, .1, v => v.toFixed(1) + '초')}</div>
        <div class="ve-sec"><div class="ve-lab">화면 맞춤</div>${seg('pFit', o.fit, [['fit', '전체 보이기'], ['fill', '꽉 채우기']])}
          <div style="margin-top:10px">${range('pZoom', '확대', o.zoom || 1, 1, 3, .05, v => Math.round(v * 100) + '%')}</div>
          ${(o.fit === 'fill' || (o.zoom || 1) > 1) ? '<p class="ve-hint">미리보기를 끌면 위치가 옮겨집니다.</p>' : ''}
          ${o.px || o.py ? '<button class="btn sm ghost" id="pCenter">가운데로</button>' : ''}</div>
        ${isV ? `<div class="ve-sec"><div class="ve-lab">화면 속 화면</div>
          <select id="pPip" style="width:100%"><option value="">없음</option>${vids.map(x => `<option value="${x.id}"${o.pip && o.pip.mid === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
          ${o.pip ? `<div style="margin-top:8px">${seg('pPipPos', o.pip.pos || 'br', [['tl', '왼쪽 위'], ['tr', '오른쪽 위'], ['bl', '왼쪽 아래'], ['br', '오른쪽 아래']])}</div>
            <div style="margin-top:8px">${seg('pPipShape', o.pip.shape || 'circle', [['circle', '동그라미'], ['rect', '네모']])}</div>
            <div style="margin-top:8px">${range('pPipSize', '크기', o.pip.size || .28, .14, .5, .01, v => Math.round(v * 100) + '%')}</div>
            <div class="ve-lab" style="margin-top:8px">이 카메라 얼굴을 캐릭터로</div>
            <select id="pPipChar" style="width:100%"><option value="">바꾸지 않음</option>${Object.keys(VE.CHARS).concat([...VE.customChars.keys()]).map(id => `<option value="${esc(id)}"${o.pip.char === id ? ' selected' : ''}>${esc(VE.charName(id))}</option>`).join('')}</select>` : ''}</div>` : ''}`;
      box.querySelector('#pDel').onclick = () => VE.deleteSel();
      const live = (k, after) => v => { o[k] = v; if (after) after(v); VE.touch(true); };
      onRange(box, 'pVol', live('vol'), v => Math.round(v * 100) + '%'); onRange(box, 'pFI', live('fadeIn'), v => v.toFixed(1) + '초'); onRange(box, 'pFO', live('fadeOut'), v => v.toFixed(1) + '초');
      onRange(box, 'pZoom', live('zoom'), v => Math.round(v * 100) + '%'); onRange(box, 'pLen', v => { o.out = o.in + v; VE.touch(true); }, v => v + '초');
      onSeg(box, 'pSpeed', v => { VE.edit(() => { o.speed = +v; }); renderProps(); }); onSeg(box, 'pFit', v => { VE.edit(() => { o.fit = v; if (v === 'fit' && (o.zoom || 1) <= 1) { o.px = o.py = 0; } }); renderProps(); });
      const center = box.querySelector('#pCenter'); if (center) center.onclick = () => { VE.edit(() => { o.px = o.py = 0; }); renderProps(); };
      const pipSel = box.querySelector('#pPip'); if (pipSel) pipSel.onchange = () => { VE.edit(() => { o.pip = pipSel.value ? { mid: pipSel.value, off: 0, shape: 'circle', pos: 'br', size: .28, char: null, bg: '#e9eef6' } : null; }); renderProps(); };
      if (o.pip) {
        onSeg(box, 'pPipPos', v => { VE.edit(() => { o.pip.pos = v; }); renderProps(); }); onSeg(box, 'pPipShape', v => { VE.edit(() => { o.pip.shape = v; }); renderProps(); });
        onRange(box, 'pPipSize', v => { o.pip.size = v; VE.touch(true); }, v => Math.round(v * 100) + '%');
        const ch = box.querySelector('#pPipChar'); if (ch) ch.onchange = () => { if (ch.value && !p.faceOk) { if (!confirm('카메라의 얼굴은 본인이거나 당사자의 동의를 받았습니까?')) { ch.value = ''; return; } p.faceOk = true; } VE.edit(() => { o.pip.char = ch.value || null; }); if (ch.value) runFace(); };
      }
    } else if (s.type === 'music') {
      const m = VE.media(o.mid);
      box.innerHTML = `<div class="ve-ph"><div><h2 title="${esc(m ? m.name : '')}">${esc(m ? m.name : '음악')}</h2><p>${VE.fmtLen(o.out - o.in)} · ${VE.fmtT(o.start)} 부터</p></div><button class="btn icon ghost" id="pDel" title="지우기 (Del)" aria-label="지우기"><i data-ic="trash"></i></button></div>
        <div class="ve-sec">${range('pVol', '소리 크기', o.vol, 0, 1.5, .05, v => Math.round(v * 100) + '%')}${range('pFI', '서서히 커지기', o.fadeIn, 0, 5, .1, v => v.toFixed(1) + '초')}${range('pFO', '서서히 작아지기', o.fadeOut, 0, 5, .1, v => v.toFixed(1) + '초')}</div>`;
      box.querySelector('#pDel').onclick = () => VE.deleteSel();
      const live = k => v => { o[k] = v; VE.touch(true); }; onRange(box, 'pVol', live('vol'), v => Math.round(v * 100) + '%'); onRange(box, 'pFI', live('fadeIn'), v => v.toFixed(1) + '초'); onRange(box, 'pFO', live('fadeOut'), v => v.toFixed(1) + '초');
    } else {
      box.innerHTML = `<div class="ve-ph"><div><h2>글자</h2><p>${VE.fmtT(o.start)} ~ ${VE.fmtT(o.end)}</p></div><button class="btn icon ghost" id="pDel" title="지우기 (Del)" aria-label="지우기"><i data-ic="trash"></i></button></div>
        <div class="ve-sec"><textarea id="pText" rows="3" style="width:100%">${esc(o.text)}</textarea></div>
        <div class="ve-sec">${seg('pPreset', o.preset, [['title', '큰 제목'], ['lower', '이름표'], ['note', '설명 글']])}</div>
        <div class="ve-sec">${range('pSize', '크기', o.size || 1, .4, 2.5, .05, v => Math.round(v * 100) + '%')}${range('pDur', '보여 줄 시간', Math.min(30, o.end - o.start), .5, 30, .5, v => v + '초')}
          <label class="ve-field"><span class="ve-lab">색</span><input type="color" id="pColor" value="${esc(o.color || '#ffffff')}"></label></div>`;
      box.querySelector('#pDel').onclick = () => VE.deleteSel();
      const ta = box.querySelector('#pText'); let began = false; ta.oninput = () => { if (!began) { VE.snap(); began = true; } o.text = ta.value; VE.touch(true); }; ta.onchange = () => { began = false; VE.saveSoon(); };
      onSeg(box, 'pPreset', v => { VE.edit(() => { o.preset = v; }); renderProps(); });
      onRange(box, 'pSize', v => { o.size = v; VE.touch(true); }, v => Math.round(v * 100) + '%'); onRange(box, 'pDur', v => { o.end = o.start + v; VE.touch(true); }, v => v + '초');
      const co = box.querySelector('#pColor'); co.oninput = () => { o.color = co.value; VE.touch(true); }; co.onchange = () => VE.saveSoon();
    }
    fillIcons(box);
  }
  VE.renderProps = renderProps;

  let tabTimer = 0;
  VE.on('select', () => { renderProps(); document.body.classList.toggle('ve-has-sel', !!VE.sel); if (tab === 'face') renderTab(); });
  VE.on('media', () => { if (tab === 'media') renderTab(); });
  VE.on('change', () => {
    /* 끄는 동안 칸을 다시 그리면 슬라이더가 끊기므로 입력 중이 아니면 조금 뒤에 고침 */
    clearTimeout(tabTimer); tabTimer = setTimeout(() => {
      const a = document.activeElement, typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && (a.closest('#veProps') || a.closest('#vePanel'));
      if (!typing) { renderProps(); if (tab === 'title' || (tab === 'text' && !job.text) || tab === 'media') { const d = $('tDoc'); const top = d ? d.scrollTop : 0, s = getSelection(); if (!s || s.isCollapsed) { renderTab(); const d2 = $('tDoc'); if (d2) d2.scrollTop = top; } } if (tab === 'cut') refreshSilence(); }
    }, 160);
  });
  VE.on('words', () => { if (tab === 'text') renderTab(); });
  VE.on('project', () => { renderTab(); renderProps(); });
})();
