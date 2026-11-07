/* 영상 작업장 — 화면 녹화
   화면과 카메라를 각각 파일로 녹화한다. 다른 창을 보는 동안 이 탭이 멈춰도 녹화가 끊기지 않고,
   카메라를 나중에 캐릭터로 바꾸거나 끌 수 있다. 화면을 고르는 확인 창은 브라우저가 띄우며 건너뛸 수 없다. */
'use strict';
(() => {
  const R = VE.rec = { state: 'idle', elapsed: 0 };
  let screen = null, cam = null, mic = null, mixCtx = null, recs = [], timer = 0, startedAt = 0, pausedFor = 0, pausedAt = 0, stopping = null;
  const pickMime = (hasV) => { const list = hasV ? ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'] : ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']; return list.find(t => MediaRecorder.isTypeSupported(t)) || ''; };
  R.canScreen = () => !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  R.canCam = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const stopAll = () => { [screen, cam, mic].forEach(s => s && s.getTracks().forEach(t => t.stop())); screen = cam = mic = null; if (mixCtx) { mixCtx.close().catch(() => { }); mixCtx = null; } };
  const nameOf = (mime, base) => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${base} ${d.getMonth() + 1}월 ${d.getDate()}일 ${p(d.getHours())}시 ${p(d.getMinutes())}분.${mime.includes('mp4') ? (base === '음성' ? 'm4a' : 'mp4') : (base === '음성' ? 'webm' : 'webm')}`; };
  /* 녹화 파일의 머리 정보를 바로잡음 (MediaRecorder 파일은 길이·찾아가기 정보가 없을 수 있음) */
  async function fix(blob, name) {
    try {
      const MB = await VE.mb(); const input = new MB.Input({ formats: MB.ALL_FORMATS, source: new MB.BlobSource(blob) });
      const isMp4 = blob.type.includes('mp4'); const format = isMp4 ? new MB.Mp4OutputFormat({ fastStart: 'in-memory' }) : new MB.WebMOutputFormat();
      const target = new MB.BufferTarget(), output = new MB.Output({ format, target }); const conv = await MB.Conversion.init({ input, output });
      if (!conv.isValid) return new File([blob], name, { type: blob.type });
      await conv.execute(); return new File([target.buffer], name, { type: format.mimeType });
    } catch (e) { console.warn('녹화 파일 정리 실패 (원본 사용)', e); return new File([blob], name, { type: blob.type }); }
  }
  /* opts = { source:'screen'|'camera'|'audio', mic:bool, camera:bool, systemAudio:bool, micId, camId } */
  R.prepare = async (opts) => {
    R.opts = opts;
    if (opts.source === 'screen') {
      if (!R.canScreen()) throw new Error('이 기기의 브라우저는 화면 녹화를 지원하지 않습니다. PC 의 크롬이나 엣지에서 해 주세요.');
      screen = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 30, max: 60 }, width: { ideal: 2560 }, height: { ideal: 1440 } }, audio: opts.systemAudio ? { echoCancellation: false, noiseSuppression: false } : false });
      screen.getVideoTracks()[0].addEventListener('ended', () => { if (R.state === 'recording' || R.state === 'paused') R.stop(); else if (R.state === 'count') { R.cancelled = true; } });
    }
    if (opts.source !== 'screen' && !R.canCam()) throw new Error('카메라·마이크를 쓸 수 없습니다');
    if (opts.mic || opts.source === 'audio') { try { mic = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: opts.micId ? { exact: opts.micId } : undefined, echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); } catch (e) { if (opts.source === 'audio') throw new Error('마이크를 쓸 수 없습니다. 주소창 왼쪽에서 허용해 주세요.'); toast('마이크 없이 녹화합니다. 허용하려면 주소창 왼쪽을 확인해 주세요.', 3600); } }
    if (opts.camera || opts.source === 'camera') { try { cam = await navigator.mediaDevices.getUserMedia({ video: { deviceId: opts.camId ? { exact: opts.camId } : undefined, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } }); } catch (e) { if (opts.source === 'camera') throw new Error('카메라를 쓸 수 없습니다. 주소창 왼쪽에서 허용해 주세요.'); toast('카메라 없이 녹화합니다.', 3000); } }
    return { screen, cam, mic };
  };
  R.start = () => {
    const o = R.opts, tracks = [];
    /* 소리 합치기 (화면 소리 + 마이크) */
    const sources = []; if (screen && screen.getAudioTracks().length) sources.push(screen); if (mic) sources.push(mic);
    if (sources.length === 1) tracks.push(sources[0].getAudioTracks()[0]);
    else if (sources.length > 1) { mixCtx = new AudioContext(); const dst = mixCtx.createMediaStreamDestination(); sources.forEach(s => mixCtx.createMediaStreamSource(s).connect(dst)); tracks.push(dst.stream.getAudioTracks()[0]); }
    const mainVideo = o.source === 'screen' ? screen : o.source === 'camera' ? cam : null;
    if (mainVideo) tracks.unshift(mainVideo.getVideoTracks()[0]);
    const mainMime = pickMime(!!mainVideo); const mainRec = new MediaRecorder(new MediaStream(tracks), { mimeType: mainMime || undefined, videoBitsPerSecond: 8e6, audioBitsPerSecond: 160e3 });
    const list = [{ role: 'main', rec: mainRec, mime: mainMime, chunks: [], base: o.source === 'screen' ? '화면 녹화' : o.source === 'camera' ? '카메라' : '음성' }];
    if (o.source === 'screen' && cam) { const m = pickMime(true); list.push({ role: 'cam', rec: new MediaRecorder(new MediaStream(cam.getVideoTracks()), { mimeType: m || undefined, videoBitsPerSecond: 2.5e6 }), mime: m, chunks: [], base: '카메라' }); }
    recs = list;
    stopping = new Promise(res => { let left = list.length; list.forEach(x => { x.rec.ondataavailable = e => { if (e.data && e.data.size) x.chunks.push(e.data); }; x.rec.onstart = () => { x.startedAt = performance.now(); }; x.rec.onstop = () => { if (--left === 0) res(); }; }); });
    list.forEach(x => x.rec.start(2000));
    startedAt = performance.now(); pausedFor = 0; R.state = 'recording'; R.elapsed = 0; timer = setInterval(() => { R.elapsed = (performance.now() - startedAt - pausedFor) / 1000; VE.emit('rec'); }, 250); VE.emit('rec');
  };
  R.pause = () => { if (R.state === 'recording') { recs.forEach(x => x.rec.pause()); pausedAt = performance.now(); R.state = 'paused'; VE.emit('rec'); } else if (R.state === 'paused') { recs.forEach(x => x.rec.resume()); pausedFor += performance.now() - pausedAt; R.state = 'recording'; VE.emit('rec'); } };
  R.abort = () => { stopAll(); R.state = 'idle'; VE.emit('rec'); };
  R.stop = async () => {
    if (R.state !== 'recording' && R.state !== 'paused') return; clearInterval(timer); R.state = 'saving'; VE.emit('rec');
    recs.forEach(x => { if (x.rec.state !== 'inactive') x.rec.stop(); }); await stopping; stopAll();
    const main = recs.find(x => x.role === 'main'), camR = recs.find(x => x.role === 'cam');
    const file = await fix(new Blob(main.chunks, { type: (main.mime || 'video/webm').split(';')[0] }), nameOf(main.mime || '', main.base));
    const added = await VE.importFiles([file], { autoAdd: false, role: 'rec' }); const m = added[0];
    let camM = null; if (camR && camR.chunks.length) { const cf = await fix(new Blob(camR.chunks, { type: (camR.mime || 'video/webm').split(';')[0] }), nameOf(camR.mime || '', camR.base)); const a2 = await VE.importFiles([cf], { autoAdd: false, role: 'cam' }); camM = a2[0]; }
    if (m) {
      VE.edit(() => {
        if (m.kind === 'audio') { const o = { id: uid(), mid: m.id, start: 0, in: 0, out: m.dur, vol: 1, fadeIn: 0, fadeOut: 0 }; VE.p.music.push(o); VE.sel = { type: 'music', id: o.id }; }
        else {
          const c = VE.newClip(m, 0, m.dur); if (camM) c.pip = { mid: camM.id, off: (camR.startedAt && main.startedAt ? (main.startedAt - camR.startedAt) / 1000 : 0), shape: 'circle', pos: 'br', size: .28, char: null, bg: '#e9eef6' };
          VE.p.clips.push(c); VE.sel = { type: 'clip', id: c.id };
        }
      });
      VE.emit('select'); if (VE.fitTimeline) VE.fitTimeline();
    }
    recs = []; R.state = 'idle'; VE.emit('rec'); toast('녹화를 타임라인에 넣었습니다', 2600); return m;
  };
})();
