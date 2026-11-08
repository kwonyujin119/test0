/* 영상 작업장 — 시작, 윗줄, 재생 단추, 단축키, 내보내기 창, 프로젝트 목록 */
'use strict';
(() => {
  const $ = VE.$;
  /* 파일 고르기 */
  VE.pickFiles = (cb, accept) => { const i = document.createElement('input'); i.type = 'file'; i.multiple = !accept; i.accept = accept || 'video/*,audio/*,image/*,.mkv,.mov,.m4a,.flac'; i.onchange = () => { const f = Array.from(i.files || []); if (cb) cb(f); else if (f.length) VE.importFiles(f); }; i.click(); };

  function updateTime() {
    const t = VE.player.t, all = VE.total(); $('tcNow').textContent = VE.fmtT(t, true); $('tcAll').textContent = VE.fmtT(all);
    const sk = $('veSeek'); if (sk && document.activeElement !== sk) { const v = all > 0 ? Math.round(t / all * 1000) : 0; if (+sk.value !== v) sk.value = v; } if (sk) sk.style.setProperty('--p', (all > 0 ? t / all * 100 : 0) + '%');
  }
  function updatePlay() { const b = $('btnPlay'); b.innerHTML = icon(VE.player.playing ? 'pause' : 'play', 20); b.title = (VE.player.playing ? '멈춤' : '재생') + ' (Space)'; b.setAttribute('aria-label', b.title); }
  function updateHistory() { $('btnUndo').disabled = !VE.canUndo(); $('btnRedo').disabled = !VE.canRedo(); }
  function updateSave() { const s = $('veSave'); s.textContent = VE.saveState === 'dirty' ? '저장 중…' : VE.saveState === 'error' ? '저장 실패' : '이 기기에 저장됨'; s.classList.toggle('bad', VE.saveState === 'error'); }
  function updateEmpty() { const none = !VE.p.clips.length; $('veEmpty').hidden = !none; $('veCanvas').style.visibility = none ? 'hidden' : 'visible'; $('btnExport').disabled = none; for (const id of ['tlSplit', 'tlDelete', 'tlHead', 'tlTail']) $(id).disabled = none; if (!none) $('tlDelete').disabled = !VE.sel; }

  /* ---------- 단축키 ---------- */
  function keys(ev) {
    const a = ev.target; if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !(a.type === 'range' || a.type === 'checkbox')) || (a && a.isContentEditable)) return;
    const ctrl = ev.ctrlKey || ev.metaKey, k = ev.key;
    if (document.querySelector('.modal-bg')) return;
    if (ctrl && (k === 'z' || k === 'Z')) { ev.preventDefault(); ev.shiftKey ? VE.redo() : VE.undo(); return; }
    if (ctrl && (k === 'y' || k === 'Y')) { ev.preventDefault(); VE.redo(); return; }
    if (ctrl && (k === 's' || k === 'S')) { ev.preventDefault(); VE.saveNow(); toast('이 기기에 저장했습니다', 1400); return; }
    if (ctrl) return;
    const fps = VE.p.fps || 30, P = VE.player;
    switch (k) {
      case ' ': ev.preventDefault(); P.toggle(); break;
      case 'k': case 'K': P.pause(); break;
      case 'm': case 'M': P.setMuted(!P.muted); break;
      case 'f': case 'F': VE.toggleFull(); break;
      case 'l': case 'L': if (!P.playing) P.play(); break;
      case 'j': case 'J': P.pause(); P.seek(P.t - 5); break;
      case 's': case 'S': if (!VE.splitAt(P.t)) toast('클립의 맨 앞이나 맨 뒤에서는 자를 수 없습니다', 1800); break;
      case 'q': case 'Q': VE.trimToPlayhead('head'); break;
      case 'w': case 'W': VE.trimToPlayhead('tail'); break;
      case 'Delete': case 'Backspace': if (VE.sel) { ev.preventDefault(); VE.deleteSel(); } break;
      case 'ArrowLeft': ev.preventDefault(); P.pause(); P.seek(P.t - (ev.shiftKey ? 1 : 1 / fps)); break;
      case 'ArrowRight': ev.preventDefault(); P.pause(); P.seek(P.t + (ev.shiftKey ? 1 : 1 / fps)); break;
      case 'Home': ev.preventDefault(); P.seek(0); break;
      case 'End': ev.preventDefault(); P.seek(VE.total()); break;
      case '+': case '=': VE.tl.setZoom(VE.tl.z * 1.3); break;
      case '-': VE.tl.setZoom(VE.tl.z / 1.3); break;
      case 'Escape': if (document.body.classList.contains('ve-full')) VE.toggleFull(); else VE.select(null); break;
    }
  }

  /* ---------- 내보내기 ---------- */
  function exportDialog() {
    if (VE.player.playing) VE.player.pause();
    const srcH = Math.max(...VE.p.clips.map(c => { const m = VE.media(c.mid); return m && m.w ? Math.min(m.w, m.h) : 0; }), 0) || 1080;
    const choices = [[480, '480p', '가볍게'], [720, '720p', '보통'], [1080, '1080p', 'Full HD'], [1440, '1440p', '고화질'], [2160, '4K', '최고화질']].filter(c => c[0] <= Math.max(1080, srcH));
    const bestShort = choices.filter(c => c[0] <= srcH).pop() || choices[Math.min(1, choices.length - 1)];
    const st = { short: bestShort[0], fmt: 'mp4', quality: 'mid', captions: VE.captions().length > 0 && VE.p.cap.on };
    const total = VE.total(), bg = document.createElement('div'); bg.className = 'modal-bg'; let ac = null, resultUrl = null;
    const estimate = () => { const [W, H] = VE.frameSize(st.short), mbps = (W * H * VE.p.fps) / 1e6 * ({ low: .055, mid: .1, high: .17 }[st.quality]); return (mbps * 1e6 / 8 + 20e3) * total; };
    const render = () => {
      const [W, H] = VE.frameSize(st.short);
      bg.innerHTML = `<div class="modal ve-export" role="dialog" aria-label="내보내기"><h3>영상 파일로 내보내기</h3>
        <div class="ve-sec"><div class="ve-lab">화질</div><div class="ve-seg wide" id="xRes">${choices.map(c => `<button type="button" data-v="${c[0]}" class="${st.short === c[0] ? 'on' : ''}"><b>${c[1]}</b><em>${c[2]}</em></button>`).join('')}</div></div>
        <div class="ve-sec"><div class="ve-lab">파일 크기와 화질</div><div class="ve-seg" id="xQ"><button type="button" data-v="low" class="${st.quality === 'low' ? 'on' : ''}">작은 파일</button><button type="button" data-v="mid" class="${st.quality === 'mid' ? 'on' : ''}">균형</button><button type="button" data-v="high" class="${st.quality === 'high' ? 'on' : ''}">좋은 화질</button></div></div>
        <div class="ve-sec"><div class="ve-lab">형식</div><div class="ve-seg" id="xF"><button type="button" data-v="mp4" class="${st.fmt === 'mp4' ? 'on' : ''}">MP4 (권장)</button><button type="button" data-v="webm" class="${st.fmt === 'webm' ? 'on' : ''}">WebM</button></div></div>
        ${VE.captions().length ? `<label class="ve-check tight"><input type="checkbox" id="xCap"${st.captions ? ' checked' : ''}><span><b>자막을 영상에 넣기</b></span></label>` : ''}
        <div class="ve-stat" style="margin-top:12px"><div><span>크기</span><b>${W}×${H}</b></div><div><span>길이</span><b>${VE.fmtT(total)}</b></div><div><span>예상 용량</span><b>약 ${VE.fmtSize(estimate())}</b></div></div>
        <p class="ve-hint">이 기기에서 바로 만듭니다. 파일을 밖으로 보내지 않습니다.</p>
        <div class="actions"><button class="btn" id="xClose">닫기</button>${VE.captions().length ? '<button class="btn" id="xSrt"><i data-ic="fileText"></i>자막 파일만</button>' : ''}<button class="btn ink" id="xGo"><i data-ic="export"></i>내보내기</button></div></div>`;
      fillIcons(bg);
      bg.querySelector('#xRes').onclick = e => { const b = e.target.closest('button'); if (b) { st.short = +b.dataset.v; render(); } };
      bg.querySelector('#xQ').onclick = e => { const b = e.target.closest('button'); if (b) { st.quality = b.dataset.v; render(); } };
      bg.querySelector('#xF').onclick = e => { const b = e.target.closest('button'); if (b) { st.fmt = b.dataset.v; render(); } };
      const xc = bg.querySelector('#xCap'); if (xc) xc.onchange = () => { st.captions = xc.checked; };
      const xs = bg.querySelector('#xSrt'); if (xs) xs.onclick = () => VE.download(new Blob(['﻿' + VE.toSrt()], { type: 'text/plain;charset=utf-8' }), VE.safeName(VE.p.name) + '.srt');
      bg.querySelector('#xClose').onclick = () => bg.remove();
      bg.querySelector('#xGo').onclick = () => go();
    };
    const go = async () => {
      /* 큰 파일은 메모리에 담지 않고 바로 디스크로 */
      let writable = null, suggested = VE.safeName(VE.p.name) + (st.fmt === 'webm' ? '.webm' : '.mp4');
      if (estimate() > 700 * 1048576 && window.showSaveFilePicker) {
        try { const h = await showSaveFilePicker({ suggestedName: suggested, types: [{ description: '영상', accept: st.fmt === 'webm' ? { 'video/webm': ['.webm'] } : { 'video/mp4': ['.mp4'] } }] }); writable = await h.createWritable(); }
        catch (e) { if (e.name === 'AbortError') return; }
      }
      ac = new AbortController(); const t0 = performance.now();
      bg.innerHTML = `<div class="modal ve-export"><h3>내보내는 중</h3><div class="ve-prog big"><div class="ve-prog-top"><span id="xStage">준비 중</span><span class="muted" id="xPct">0%</span></div><div class="ve-bar"><i id="xBar" style="width:0"></i></div><div class="muted" id="xEta" style="margin-top:6px;font-size:12.5px">&nbsp;</div></div><p class="ve-hint">이 탭을 닫지 마세요. 다른 창을 봐도 계속됩니다.</p><div class="actions"><button class="btn" id="xStop">그만두기</button></div></div>`;
      bg.querySelector('#xStop').onclick = () => ac.abort();
      try {
        const res = await VE.exportVideo({ short: st.short, fmt: st.fmt, quality: st.quality, fps: VE.p.fps, captions: st.captions, writable, signal: ac.signal,
          onProg: p => { const q = id => bg.querySelector('#' + id); if (!q('xStage')) return; q('xStage').textContent = p.stage; q('xPct').textContent = Math.round((p.ratio || 0) * 100) + '%'; q('xBar').style.width = (p.ratio || 0) * 100 + '%'; q('xEta').textContent = p.eta != null ? (p.eta < 60 ? `약 ${Math.max(1, Math.round(p.eta))}초 남음` : `약 ${Math.ceil(p.eta / 60)}분 남음`) + (p.speed ? ` · 재생 시간의 ${p.speed.toFixed(1)}배 속도` : '') : ' '; } });
        VE._lastExport = res; const secs = (performance.now() - t0) / 1000;
        if (res.blob) { resultUrl = URL.createObjectURL(res.blob); }
        bg.innerHTML = `<div class="modal ve-export"><h3>다 만들었습니다</h3>${resultUrl ? `<video class="ve-result-v" src="${resultUrl}" controls playsinline></video>` : ''}
          <div class="ve-stat"><div><span>크기</span><b>${res.W}×${res.H}</b></div><div><span>파일</span><b>${res.blob ? VE.fmtSize(res.blob.size) : '저장함'}</b></div><div><span>걸린 시간</span><b>${VE.fmtLen(secs)}</b></div></div>
          ${res.audio === 'opus' && st.fmt === 'mp4' ? '<div class="ve-note warn">이 브라우저는 AAC 소리를 만들 수 없어 Opus 소리를 넣었습니다. 일부 프로그램에서는 소리가 나지 않을 수 있습니다.</div>' : ''}
          <div class="actions"><button class="btn" id="xClose">닫기</button>${res.blob ? `<a class="btn ink" id="xSave" href="${resultUrl}" download="${esc(res.name)}"><i data-ic="download"></i>파일 저장</a>` : ''}</div></div>`;
        fillIcons(bg); bg.querySelector('#xClose').onclick = () => { bg.remove(); if (resultUrl) URL.revokeObjectURL(resultUrl); };
      } catch (e) {
        if (e.name === 'AbortError' || /cancel/i.test(e.name || '')) { toast('내보내기를 그만뒀습니다', 2200); render(); return; }
        console.error(e); bg.innerHTML = `<div class="modal ve-export"><h3>만들지 못했습니다</h3><div class="ve-note warn">${esc(VE.niceErr(e))}</div><div class="actions"><button class="btn" id="xBack">돌아가기</button></div></div>`; bg.querySelector('#xBack').onclick = render;
      }
    };
    document.body.appendChild(bg); render();
  }
  VE.exportDialog = exportDialog;

  /* ---------- 프로젝트 목록 ---------- */
  async function projectsDialog() {
    const all = (await VE.idb.all('projects').catch(() => [])).map(x => x.value).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="width:520px"><h3>내 영상 프로젝트</h3><div class="ve-plist">${all.map(p => `<div class="ve-pitem${p.id === VE.p.id ? ' on' : ''}" data-id="${esc(p.id)}"><div><b>${esc(p.name)}</b><span>${new Date(p.updated || 0).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · 파일 ${p.media.length}개</span></div>${p.id === VE.p.id ? '<em>지금 작업 중</em>' : `<button class="btn sm" data-open="${esc(p.id)}">열기</button>`}<button class="btn icon sm ghost" data-rm="${esc(p.id)}" title="지우기" aria-label="지우기"><i data-ic="trash"></i></button></div>`).join('') || '<div class="ve-empty">저장된 프로젝트가 없습니다.</div>'}</div>
      <div id="pjRemote"></div>
      <p class="ve-hint">${VE.sync.cfg().on ? '다른 기기와 연결되어 있습니다. 저장하면 비공개 저장소에 올라가고, 다른 기기의 목록에도 나타납니다.' : '프로젝트와 넣은 파일은 이 기기의 브라우저에만 있습니다. 휴대폰 · PC 에서 함께 보려면 위쪽 [다른 기기와 연결] 을 켜세요.'}</p><div class="actions"><button class="btn" id="pjClose">닫기</button><button class="btn ink" id="pjNew"><i data-ic="plus"></i>새 프로젝트</button></div></div>`;
    document.body.appendChild(bg); fillIcons(bg);
    bg.querySelector('#pjClose').onclick = () => bg.remove();
    /* 같은 이름이 쌓이지 않게 '새 영상 2', '새 영상 3' … */
    const freeName = () => { const used = new Set(all.map(p => p.name)); if (!used.has('새 영상')) return '새 영상'; for (let n = 2; ; n++) if (!used.has('새 영상 ' + n)) return '새 영상 ' + n; };
    bg.querySelector('#pjNew').onclick = async () => { await VE.saveNow(); await VE.loadProject(VE.newProject(freeName())); await VE.saveNow(); syncName(); bg.remove(); };
    bg.querySelectorAll('[data-open]').forEach(b => b.onclick = async () => { await VE.saveNow(); const p = all.find(x => x.id === b.dataset.open); await VE.loadProject(p); syncName(); bg.remove(); try { localStorage.setItem('ve:last', p.id); } catch (e) { } VE.sync.refreshOpen(); });
    /* 다른 기기에서 만든 프로젝트 (이 기기에 없거나 더 최근에 고친 것) */
    if (VE.sync.cfg().on) (async () => {
      const box = bg.querySelector('#pjRemote'); box.innerHTML = '<p class="ve-hint">다른 기기의 프로젝트를 확인하는 중…</p>';
      try {
        const list = await VE.sync.list(), mine = new Map(all.map(p => [p.id, p]));
        const rows = Object.entries(list).filter(([id, r]) => !mine.has(id) || (r.updated || 0) > (mine.get(id).updated || 0)).sort((a, b) => (b[1].updated || 0) - (a[1].updated || 0));
        box.innerHTML = rows.length ? `<div class="ve-lab" style="margin-top:12px">다른 기기에서</div><div class="ve-plist">${rows.map(([id, r]) => `<div class="ve-pitem"><div><b>${esc(r.name)}</b><span>${esc(r.device || '다른 기기')} · ${new Date(r.updated || 0).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · 파일 ${r.media || 0}개${mine.has(id) ? ' · 이 기기보다 최근' : ''}</span></div><button class="btn sm ink" data-pull="${esc(id)}">받아서 열기</button></div>`).join('')}</div>` : '';
        box.querySelectorAll('[data-pull]').forEach(b => b.onclick = async () => {
          const id = b.dataset.pull, here = mine.get(id);
          if (here && id === VE.p.id && (VE.p.updated || 0) > ((JSON.parse(localStorage.getItem('ve:syncState') || '{}').p || {})[id] || {}).rev && !confirm('이 기기에서 고친 뒤 아직 올리지 않은 내용이 있습니다. 다른 기기 것으로 바꿀까요?')) return;
          b.disabled = true; b.textContent = '받는 중…';
          try { await VE.saveNow(); const p = await VE.sync.pull(id); await VE.loadProject(p); syncName(); bg.remove(); try { localStorage.setItem('ve:last', p.id); } catch (e) { } toast('편집 내용을 받았습니다. 영상 파일을 받는 중입니다', 2600); await VE.sync.fetchMissing(); toast('다 받았습니다', 1800); }
          catch (e) { b.disabled = false; b.textContent = '받아서 열기'; toast('받지 못했습니다: ' + VE.niceErr(e), 4200); }
        });
      } catch (e) { box.innerHTML = `<p class="ve-hint" style="color:var(--ui-danger)">다른 기기의 목록을 읽지 못했습니다: ${esc(VE.niceErr(e))}</p>`; }
    })();
    bg.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => {
      const p = all.find(x => x.id === b.dataset.rm); if (!confirm(`'${p.name}' 프로젝트와 안에 넣은 파일을 이 기기에서 지울까요?${VE.sync.cfg().on ? ' 다른 기기의 목록에서도 지웁니다.' : ''} 되돌릴 수 없습니다.`)) return;
      if (VE.sync.cfg().on) VE.sync.remove(p.id).catch(e => toast('다른 기기 목록에서 지우지 못했습니다: ' + VE.niceErr(e), 4000));
      const others = all.filter(x => x.id !== p.id).flatMap(x => x.media.map(m => m.id)); for (const m of p.media) if (!others.includes(m.id)) { await VE.idb.del('blobs', m.id).catch(() => { }); await VE.idb.del('cache', m.id + ':peaks').catch(() => { }); await VE.idb.del('cache', m.id + ':track').catch(() => { }); if (m.dub) for (const s of m.dub.segs) await VE.idb.del('cache', s.k).catch(() => { }); }
      await VE.idb.del('projects', p.id); if (p.id === VE.p.id) { await VE.loadProject(VE.newProject()); syncName(); } bg.remove(); projectsDialog();
    });
  }
  /* ---------- 다른 기기와 연결 ---------- */
  function syncLabel() {
    const S = VE.sync, b = $('btnSync'); if (!b) return; const lab = b.querySelector('span');
    const t = !S.cfg().on ? '이 기기만' : S.state === 'busy' ? (S.ratio != null ? `올리고 받는 중 ${Math.round(S.ratio * 100)}%` : '맞추는 중') : S.state === 'error' ? '연결 오류' : S.state === 'conflict' ? '확인 필요' : '연결됨';
    if (lab) lab.textContent = t; b.title = (S.cfg().on ? S.msg || '다른 기기와 연결됨' : '다른 기기와 연결 (휴대폰 · PC 에서 같은 프로젝트)');
    b.classList.toggle('on', S.cfg().on && S.state !== 'error' && S.state !== 'conflict'); b.classList.toggle('bad', S.state === 'error' || S.state === 'conflict');
  }
  function syncDialog() {
    const S = VE.sync, c = S.cfg(), bg = document.createElement('div'); bg.className = 'modal-bg';
    const repoUrl = `https://github.com/new?name=${encodeURIComponent(c.repo)}&visibility=private&description=${encodeURIComponent('영상 작업장 (비공개)')}`;
    bg.innerHTML = `<div class="modal ve-sync" style="width:560px"><h3>다른 기기와 연결</h3>
      <p class="muted" style="margin:0 0 12px;font-size:13px;line-height:1.6">휴대폰과 PC 에서 같은 영상 프로젝트를 이어서 편집합니다. 편집 내용과 영상 파일을 <b>GitHub 비공개 저장소</b>에 올리고 받습니다. 얼굴이 나오는 영상이라 공개 저장소는 쓰지 않습니다.</p>
      ${c.token ? '' : `<div class="ve-note warn">이 기기에 GitHub 토큰이 없습니다. <a href="index.html">업무 공간 첫 화면</a>의 [GitHub 연결] 에서 먼저 토큰을 넣어 주세요. (교안 저장에 쓰는 것과 같은 토큰)</div>`}
      <details class="ve-steps"${c.on ? '' : ' open'}><summary>처음 한 번 준비 (약 3분)</summary><ol>
        <li><a href="${repoUrl}" target="_blank" rel="noopener">비공개 저장소 만들기</a> — 이름 <b>${esc(c.repo)}</b>, <b>Private</b> 를 고르고 [Create repository].</li>
        <li><a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener">토큰 권한 더하기</a> — 쓰고 있는 토큰을 열어 Repository access 에 <b>${esc(c.repo)}</b> 를 더하고, Contents 권한을 <b>Read and write</b> 로. (클래식 토큰에 repo 권한이 있으면 이 단계는 필요 없음)</li>
        <li>아래 [연결 확인] 을 누르고, 휴대폰에서도 같은 화면에서 연결을 켭니다.</li></ol></details>
      <label class="ve-field"><span class="ve-lab">저장소 이름</span><input type="text" id="syRepo" value="${esc(c.repo)}" spellcheck="false" autocomplete="off"></label>
      <div class="ve-note" id="syState">${c.on ? esc(S.msg || '연결됨') : '아직 이 기기만 씁니다.'}</div>
      <div class="actions"><button class="btn" id="syClose">닫기</button>${c.on ? '<button class="btn" id="syOff">연결 끄기</button><button class="btn" id="syNow">지금 맞추기</button>' : ''}<button class="btn ink" id="syOn">${c.on ? '연결 확인' : '연결 확인하고 켜기'}</button></div></div>`;
    document.body.appendChild(bg);
    const state = (t, bad) => { const n = bg.querySelector('#syState'); n.textContent = t; n.classList.toggle('warn', !!bad); };
    const repoIn = bg.querySelector('#syRepo'); repoIn.onkeydown = e => e.stopPropagation();
    bg.querySelector('#syClose').onclick = () => bg.remove();
    bg.querySelector('#syOn').onclick = async () => {
      const repo = repoIn.value.trim().replace(/^.*\//, ''); if (!repo) { repoIn.focus(); return; }
      S.setCfg({ repo }); S.ok = false; state('연결을 확인하는 중…');
      try { const r = await S.check(); S.setCfg({ on: true }); state(`연결됐습니다. 비공개 저장소 · 사용량 ${VE.fmtSize(r.size)} (GitHub 은 몇 GB 이하를 권합니다). 지금 프로젝트를 올립니다.`); syncLabel(); await VE.saveNow(); S.push(VE.p).then(() => S.refreshOpen()).catch(() => { }); }
      catch (e) { state(VE.niceErr(e), true); }
    };
    const off = bg.querySelector('#syOff'); if (off) off.onclick = () => { S.setCfg({ on: false }); S.init(); syncLabel(); bg.remove(); toast('연결을 껐습니다. 이제 이 기기에만 저장합니다', 2400); };
    const now = bg.querySelector('#syNow'); if (now) now.onclick = async () => { state('맞추는 중…'); try { await VE.saveNow(); await S.push(VE.p); await S.refreshOpen(); state(S.msg || '맞췄습니다', S.state === 'error' || S.state === 'conflict'); } catch (e) { state(VE.niceErr(e), true); } };
  }
  /* 두 기기에서 같은 프로젝트를 고쳤을 때 */
  let conflictOpen = false;
  function conflictDialog({ p, remote }) {
    if (conflictOpen) return; conflictOpen = true; const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" style="width:480px"><h3>다른 기기에서도 고쳤습니다</h3>
      <p style="font-size:13.5px;line-height:1.6;margin:0 0 12px">'${esc(p.name)}' 을(를) ${esc(remote.device || '다른 기기')}에서 ${new Date(remote.updated).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })} 에 고쳤고, 이 기기에서도 고쳤습니다. 어느 쪽을 남길까요? 남기지 않은 쪽의 고친 내용은 사라집니다.</p>
      <div class="actions"><button class="btn" id="cfLater">나중에</button><button class="btn" id="cfMine">이 기기 것 남기기</button><button class="btn ink" id="cfTheirs">${esc(remote.device || '다른 기기')} 것 받기</button></div></div>`;
    document.body.appendChild(bg); const close = () => { bg.remove(); conflictOpen = false; };
    bg.querySelector('#cfLater').onclick = close;
    bg.querySelector('#cfMine').onclick = async () => { close(); try { await VE.sync.push(VE.p, { force: true }); toast('이 기기 것을 올렸습니다', 2000); } catch (e) { toast(VE.niceErr(e), 4000); } };
    bg.querySelector('#cfTheirs').onclick = async () => { close(); try { const q = await VE.sync.pull(p.id); await VE.loadProject(q); syncName(); await VE.sync.fetchMissing(); toast('다른 기기 것을 받았습니다', 2000); } catch (e) { toast(VE.niceErr(e), 4000); } };
  }
  function syncName() { $('veName').value = VE.p.name; document.title = VE.p.name + ' - 영상 작업장'; }

  /* ---------- 창 어디든 끌어다 놓기 ---------- */
  function bindDrop() {
    let n = 0; const over = $('veDropOver'), isFile = ev => ev.dataTransfer && [...ev.dataTransfer.types].includes('Files');
    addEventListener('dragenter', ev => { if (isFile(ev)) { n++; over.hidden = false; ev.preventDefault(); } });
    addEventListener('dragleave', ev => { if (isFile(ev) && --n <= 0) { n = 0; over.hidden = true; } });
    addEventListener('dragover', ev => { if (isFile(ev)) ev.preventDefault(); });
    addEventListener('drop', ev => { if (!isFile(ev)) return; ev.preventDefault(); n = 0; over.hidden = true; VE.importFiles(ev.dataTransfer.files); });
  }

  /* ---------- 시작 ---------- */
  async function boot() {
    /* 게스트는 보기 전용이므로 영상 편집은 관리자만 */
    if (typeof Access !== 'undefined' && !Access.isAdmin) {
      $('veGate').hidden = false; $('veApp').hidden = true; fillIcons($('veGate'));
      $('gateIn').onclick = async () => { if (await Access.prompt()) location.reload(); }; return;
    }
    $('veRail').innerHTML = VE.tabs.map(([k, ic, t]) => `<button type="button" data-tab="${k}" title="${t}"><i data-ic="${ic}"></i><span>${t}</span></button>`).join('');
    fillIcons(document);
    $('veRail').onclick = ev => { const b = ev.target.closest('button[data-tab]'); if (!b) return; if (b.classList.contains('on') && document.body.classList.contains('ve-panel-open')) VE.closePanel(); else VE.openTab(b.dataset.tab); };
    VE.player.init(); VE.tl.init();
    $('btnPlay').onclick = () => VE.player.toggle();
    $('btnStart').onclick = () => VE.player.seek(0); $('btnEnd').onclick = () => VE.player.seek(VE.total());
    $('btnPrev').onclick = () => { VE.player.pause(); VE.player.seek(VE.player.t - 1 / (VE.p.fps || 30)); }; $('btnNext').onclick = () => { VE.player.pause(); VE.player.seek(VE.player.t + 1 / (VE.p.fps || 30)); };
    $('btnUndo').onclick = VE.undo; $('btnRedo').onclick = VE.redo;
    $('btnExport').onclick = exportDialog; $('btnProjects').onclick = projectsDialog; $('btnSync').onclick = syncDialog;
    VE.on('sync', syncLabel); VE.on('syncConflict', conflictDialog); VE.on('save', () => { if (VE.saveState === 'saved') VE.sync.soon(); });
    $('btnImportEmpty').onclick = () => VE.pickFiles(); $('btnRecEmpty').onclick = () => VE.openTab('rec');
    /* 속성 칸: 넓은 화면에서는 접어서 미리보기를 넓히고(기억함), 좁은 화면에서는 떠 있는 칸으로 */
    $('veBtnProps').onclick = () => {
      if (innerWidth > 1180) { const h = document.body.classList.toggle('ve-props-hidden'); try { localStorage.setItem('ve:propsHidden', h ? '1' : '0'); } catch (e) { } requestAnimationFrame(() => VE.player.layoutStage()); setTimeout(() => VE.player.layoutStage(), 60); }
      else document.body.classList.toggle('ve-props-open');
    };
    try { if (localStorage.getItem('ve:propsHidden') === '1') document.body.classList.add('ve-props-hidden'); } catch (e) { }
    /* 재생 막대: 끄는 동안은 멈추고, 놓으면 하던 대로 */
    const sk = $('veSeek'); let skWas = false, skOn = false;
    const skDown = () => { if (skOn) return; skOn = true; skWas = VE.player.playing; if (skWas) VE.player.pause(); };
    sk.addEventListener('pointerdown', skDown); sk.addEventListener('keydown', skDown);
    sk.oninput = () => { skDown(); VE.player.seek(+sk.value / 1000 * VE.total()); };
    sk.onchange = () => { if (skWas) VE.player.play(); skOn = false; skWas = false; };
    /* 소리 끄기 · 크게 보기 */
    const syncMute = () => { const b = $('btnMute'), m = VE.player.muted; b.innerHTML = icon(m ? 'mute' : 'volume', 18); b.title = (m ? '소리 켜기' : '소리 끄기') + ' (M)'; b.setAttribute('aria-label', b.title); b.classList.toggle('active', m); };
    $('btnMute').onclick = () => VE.player.setMuted(!VE.player.muted); VE.on('mute', syncMute);
    const wrap = document.querySelector('.ve-stage-wrap');
    const syncFull = () => { const on = document.body.classList.contains('ve-full'), b = $('btnFull'); b.innerHTML = icon(on ? 'shrink' : 'expand', 18); b.title = (on ? '작게 보기' : '크게 보기') + ' (F)'; b.setAttribute('aria-label', b.title); setTimeout(() => VE.player.layoutStage(), 30); };
    VE.toggleFull = () => {
      const on = document.body.classList.contains('ve-full');
      if (on) { document.body.classList.remove('ve-full'); if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); }
      else { document.body.classList.add('ve-full'); if (wrap.requestFullscreen) wrap.requestFullscreen().catch(() => { }); }
      syncFull();
    };
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('ve-full')) { document.body.classList.remove('ve-full'); } syncFull(); });
    $('btnFull').onclick = () => VE.toggleFull();
    $('tlSplit').onclick = () => { if (!VE.splitAt(VE.player.t)) toast('클립의 맨 앞이나 맨 뒤에서는 자를 수 없습니다', 1800); };
    $('tlDelete').onclick = () => VE.deleteSel(); $('tlHead').onclick = () => VE.trimToPlayhead('head'); $('tlTail').onclick = () => VE.trimToPlayhead('tail');
    $('tlSnap').onclick = () => { VE.tl.snap = !VE.tl.snap; $('tlSnap').classList.toggle('active', VE.tl.snap); }; $('tlSnap').classList.add('active');
    $('tlFit').onclick = () => VE.fitTimeline(); $('tlZoom').oninput = e => VE.tl.zoomFromSlider(+e.target.value);
    const nm = $('veName'); nm.oninput = () => { VE.p.name = nm.value || '새 영상'; document.title = VE.p.name + ' - 영상 작업장'; VE.saveSoon(); }; nm.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') nm.blur(); };
    addEventListener('keydown', keys); bindDrop();
    /* 타임라인 높이 끌기 */
    const sp = $('veSplit'); sp.onpointerdown = ev => { sp.setPointerCapture(ev.pointerId); const y0 = ev.clientY, h0 = $('veTimeline').offsetHeight; sp.onpointermove = e => { const h = clamp(h0 + y0 - e.clientY, 170, innerHeight * .62); document.documentElement.style.setProperty('--tlh', h + 'px'); }; sp.onpointerup = () => { sp.onpointermove = null; try { localStorage.setItem('ve:tlh', document.documentElement.style.getPropertyValue('--tlh')); } catch (e) { } }; };
    try { const h = localStorage.getItem('ve:tlh'); if (h) document.documentElement.style.setProperty('--tlh', h); } catch (e) { }
    VE.on('time', updateTime); VE.on('playstate', updatePlay); VE.on('history', updateHistory); VE.on('save', updateSave);
    VE.on('change', () => { updateTime(); updateEmpty(); }); VE.on('select', updateEmpty); VE.on('project', syncName);
    VE.on('busy', b => { const n = $('veBusy'); n.hidden = !b; if (b) n.textContent = b.msg; });
    addEventListener('beforeunload', ev => { if (VE.rec.state === 'recording' || VE.rec.state === 'paused') { ev.preventDefault(); ev.returnValue = ''; } });
    addEventListener('pagehide', () => { if (VE.saveState === 'dirty') VE.saveNow(); });
    VE.loadCustomChars();
    updatePlay(); updateHistory(); updateSave(); updateTime(); updateEmpty(); VE.renderProps();
    VE.openTab(innerWidth > 820 ? 'media' : 'media'); if (innerWidth <= 820) VE.closePanel();
    VE.mb().catch(e => toast(e.message, 5000));
    /* 지난 작업 이어서 */
    try { const id = localStorage.getItem('ve:last'); if (id) { const p = await VE.idb.get('projects', id); if (p) { await VE.loadProject(p); } } } catch (e) { console.warn(e); }
    /* 다른 기기와 연결: 열린 프로젝트를 맞추고 이 기기에 없는 파일을 받음 */
    VE.sync.init(); syncLabel(); if (VE.sync.cfg().on) VE.sync.refreshOpen();
    syncName(); updateEmpty();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
