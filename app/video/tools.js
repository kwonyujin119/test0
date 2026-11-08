/* 영상 작업장 — 분석 도구: 무음 찾기 · 자동 자막(Whisper) · 얼굴 위치 찾기(MediaPipe)
   모두 브라우저 안에서 돌아가며 파일을 밖으로 보내지 않는다. 모델만 처음 한 번 내려받는다. */
'use strict';
(() => {
  /* ---------- 무음 찾기 ---------- */
  /* 잡음 바닥을 스스로 잡고 그보다 sens 만큼 높은 소리를 말소리로 본다. 결과는 타임라인 구간 */
  VE.findSilence = ({ sens, minLen, pad }) => {
    const { starts } = VE.layout(), out = [], hz = VE.PEAK_HZ;
    VE.p.clips.forEach((c, i) => {
      const r = VE.rt.get(c.mid), pk = r && r.peaks, m = VE.media(c.mid); if (!pk || !m || m.kind === 'image') return;
      const a = Math.floor(c.in * hz), b = Math.min(pk.length, Math.ceil(c.out * hz)); if (b - a < 2) return;
      /* 소리 크기 분포에서 아래 15% 를 잡음 바닥, 위 95% 를 말소리 크기로 */
      const sample = []; const st = Math.max(1, Math.floor((b - a) / 4000)); for (let k = a; k < b; k += st) sample.push(pk[k]); sample.sort((x, y) => x - y);
      const floor = sample[Math.floor(sample.length * .15)] || 0, loud = sample[Math.floor(sample.length * .95)] || 0;
      const fdb = 20 * Math.log10(Math.max(floor, 1e-5)), ldb = 20 * Math.log10(Math.max(loud, 1e-5)); const thr = Math.pow(10, (fdb + (ldb - fdb) * sens) / 20);
      if (ldb - fdb < 6) return; /* 소리 차이가 거의 없으면 건드리지 않음 */
      let run = -1; const sp = c.speed || 1, push = (s0, s1) => { s0 += pad; s1 -= pad; if (s1 - s0 < minLen - pad * 2 || s1 - s0 < .05) return; out.push([starts[i] + (s0 - c.in) / sp, starts[i] + (s1 - c.in) / sp]); };
      for (let k = a; k < b; k++) {
        const quiet = pk[k] < thr;
        if (quiet && run < 0) run = k; else if (!quiet && run >= 0) { const len = (k - run) / hz; if (len >= minLen) push(Math.max(c.in, run / hz), k / hz); run = -1; }
      }
      if (run >= 0 && (b - run) / hz >= minLen) push(Math.max(c.in, run / hz), Math.min(c.out + pad, b / hz + pad));
    });
    return out;
  };

  /* ---------- 자동 자막 ---------- */
  const HF_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
  VE.WHISPER = { base: { id: 'onnx-community/whisper-base_timestamped', mb: 80, name: '빠르게' }, small: { id: 'onnx-community/whisper-small_timestamped', mb: 250, name: '더 정확하게' } };
  const workerSrc = `
    import { pipeline, env } from '${HF_URL}';
    env.allowLocalModels = false;
    let pipe = null, loaded = '';
    self.onmessage = async (e) => {
      const m = e.data;
      try {
        if (m.type === 'load') {
          if (loaded !== m.key) {
            const seen = {};
            pipe = await pipeline('automatic-speech-recognition', m.model, { device: m.device, dtype: m.dtype, progress_callback: p => {
              if (p.status === 'progress' && p.total) { seen[p.file] = [p.loaded, p.total]; let a = 0, b = 0; for (const k in seen) { a += seen[k][0]; b += seen[k][1]; } postMessage({ type: 'dl', ratio: a / b, mb: b / 1048576 }); }
            } });
            loaded = m.key;
          }
          postMessage({ type: 'ready' });
        } else if (m.type === 'run') {
          const r = await pipe(m.audio, { return_timestamps: 'word', language: m.lang || null, task: 'transcribe', chunk_length_s: 30, stride_length_s: 0, no_repeat_ngram_size: 3 });
          postMessage({ type: 'res', id: m.id, text: r.text, chunks: r.chunks || [] });
        }
      } catch (err) { postMessage({ type: 'err', id: m.id, msg: String(err && err.message || err) }); }
    };`;
  let worker = null;
  const getWorker = () => worker || (worker = new Worker(URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' })), { type: 'module' }));
  const killWorker = () => { if (worker) { worker.terminate(); worker = null; } };
  /* 일부 내장 그래픽에서 그래픽 가속이 멈추는 일이 있어, 한 조각이 오래 걸리면 CPU 로 바꿔 이어 간다 */
  const GPU_LIMIT_MS = 75000;
  const cpuOnly = () => { try { return localStorage.getItem('ve:asrCpu') === '1'; } catch (e) { return false; } };
  const setCpuOnly = () => { try { localStorage.setItem('ve:asrCpu', '1'); } catch (e) { } };
  const hasGpu = async () => { try { return !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch (e) { return false; } };
  /* 말이 없는 곳을 찾아 28초 이내로 나눔 */
  function windows(a, sr) {
    const out = [], max = 28 * sr, min = 18 * sr, frame = Math.round(sr * .05); let p = 0;
    while (p < a.length) {
      if (a.length - p <= max) { out.push([p, a.length]); break; }
      let best = p + max, low = Infinity;
      for (let k = p + min; k < p + max; k += frame) { let s = 0; for (let j = k; j < k + frame; j += 4) s += a[j] * a[j]; if (s < low) { low = s; best = k; } }
      out.push([p, best]); p = best;
    }
    return out;
  }
  const rms = (a, s, e) => { let t = 0, n = 0; for (let i = s; i < e; i += 40) { t += a[i] * a[i]; n++; } return Math.sqrt(t / Math.max(1, n)); };
  /* onProg({stage, ratio}) */
  VE.transcribe = async (mid, { quality, lang, onProg, signal }) => {
    const model = VE.WHISPER[quality] || VE.WHISPER.base; let gpu = !cpuOnly() && await hasGpu();
    const modelCfg = () => ({ device: gpu ? 'webgpu' : 'wasm', dtype: gpu ? { encoder_model: 'fp32', decoder_model_merged: 'q8' } : { encoder_model: 'q8', decoder_model_merged: 'q8' } });
    const call = (msg, transfer, limit) => new Promise((res, rej) => {
      const w = getWorker(); let timer = 0;
      const fin = () => { clearTimeout(timer); w.removeEventListener('message', on); w.removeEventListener('error', onErr); };
      const on = e => { const d = e.data; if (d.type === 'dl') { onProg && onProg({ stage: '모델 받는 중', ratio: d.ratio }); return; } if (d.type === 'ready' || d.type === 'res') { fin(); res(d); } else if (d.type === 'err') { fin(); rej(new Error(d.msg)); } };
      const onErr = e => { fin(); rej(new Error(e.message || '음성 인식 부품을 시작하지 못했습니다')); };
      if (limit) timer = setTimeout(() => { fin(); const x = new Error('느림'); x.slow = true; rej(x); }, limit);
      w.addEventListener('message', on); w.addEventListener('error', onErr); w.postMessage(msg, transfer || []);
    });
    const load = () => { const cfg = modelCfg(); return call({ type: 'load', key: model.id + cfg.device, model: model.id, ...cfg }); };
    onProg && onProg({ stage: '소리 읽는 중', ratio: 0 });
    const audio = await VE.readMono16k(mid, r => onProg && onProg({ stage: '소리 읽는 중', ratio: r })); if (!audio) throw new Error('이 파일에는 소리가 없습니다');
    onProg && onProg({ stage: '모델 준비 중', ratio: 0 });
    try { await load(); } catch (e) { if (!gpu) throw e; console.warn('그래픽 가속 실패, CPU 로', e); gpu = false; killWorker(); await load(); }
    const parts = windows(audio, 16000); let words = []; const m = VE.media(mid), t0 = performance.now(); let doneSec = 0, allPeak = 0;
    for (let k = 0; k < audio.length; k += 800) { const v = Math.abs(audio[k]); if (v > allPeak) allPeak = v; }
    const quietBelow = Math.max(.004, allPeak * .012);
    for (let i = 0; i < parts.length; i++) {
      if (signal && signal.aborted) throw new DOMException('그만둠', 'AbortError');
      const [a, b] = parts[i], offs = a / 16000; doneSec = a / 16000;
      const elapsed = (performance.now() - t0) / 1000, eta = doneSec > 0 ? elapsed / doneSec * (audio.length / 16000 - doneSec) : null;
      onProg && onProg({ stage: '받아쓰는 중', ratio: doneSec / (audio.length / 16000), eta, words: words.length });
      if (rms(audio, a, b) < quietBelow) continue; /* 말이 없는 곳에서 헛글자가 나오는 것을 막음 */
      const run = () => { const seg = audio.slice(a, b); return call({ type: 'run', id: i, audio: seg, lang }, [seg.buffer], gpu ? GPU_LIMIT_MS : 0); };
      let r; try { r = await run(); } catch (e) {
        if (!gpu) throw e; /* 그래픽 가속이 멈췄거나 실패: CPU 로 이어 감 */
        console.warn('그래픽 가속에서 CPU 로 바꿈', e.message); gpu = false; setCpuOnly(); killWorker(); onProg && onProg({ stage: 'CPU 로 바꿔 받아쓰는 중', ratio: doneSec / (audio.length / 16000) }); await load(); r = await run();
      }
      for (const ch of r.chunks) {
        const t = String(ch.text || '').trim(); if (!t || !ch.timestamp) continue;
        const s = (ch.timestamp[0] || 0) + offs; let e = ch.timestamp[1] == null ? s + .3 : ch.timestamp[1] + offs; if (e <= s) e = s + .08;
        words.push({ s: Math.round(s * 1000) / 1000, e: Math.round(e * 1000) / 1000, t });
      }
      m.words = words.slice(); VE.capDirty();
    }
    m.words = tighten(mid, dedupe(words)); m.lang = lang; VE.capDirty(); VE.emit('words');
    return m.words;
  };
  /* 음성 인식은 문장 첫 낱말에 앞쪽 무음을 포함하곤 한다. 소리 크기를 보고 낱말의 시작과 끝을 실제 말소리에 맞춤 */
  function tighten(mid, ws) {
    const pk = VE.rt.get(mid) && VE.rt.get(mid).peaks, hz = VE.PEAK_HZ; if (!pk || !ws.length) return ws;
    const sample = []; for (let i = 0; i < pk.length; i += Math.max(1, Math.floor(pk.length / 4000))) sample.push(pk[i]); sample.sort((a, b) => a - b);
    const floor = sample[Math.floor(sample.length * .15)] || 0, loud = sample[Math.floor(sample.length * .95)] || 0, thr = Math.pow(10, (20 * Math.log10(Math.max(floor, 1e-5)) * .7 + 20 * Math.log10(Math.max(loud, 1e-5)) * .3) / 20);
    return ws.map(w => {
      if (w.e - w.s < .35) return w; let a = Math.floor(w.s * hz), b = Math.min(pk.length - 1, Math.floor(w.e * hz)); const a0 = a, b0 = b;
      while (a < b && pk[a] < thr) a++; while (b > a && pk[b] < thr) b--;
      const s = a > a0 + 8 ? Math.max(w.s, a / hz - .06) : w.s, e = b < b0 - 12 ? Math.min(w.e, (b + 1) / hz + .08) : w.e;
      return e - s > .05 ? { s: Math.round(s * 1000) / 1000, e: Math.round(e * 1000) / 1000, t: w.t } : w;
    });
  }
  /* 말이 없는 곳의 잘 알려진 헛글자와 연속 반복 제거 */
  function dedupe(ws) {
    const out = []; let run = 0;
    for (const w of ws) { const last = out[out.length - 1]; if (last && last.t === w.t) { run++; if (run >= 2) continue; } else run = 0; out.push(w); }
    return out;
  }
  VE.FILLER = /^(음+|으+음*|어+|아+|에+|흠+|음\.*|어\.*|아\.*)[.,…]*$/;
  VE.findFillers = () => { const out = []; for (const c of VE.captions()) for (const w of c.words) if (VE.FILLER.test(w.t)) out.push(w); return out; };
  /* 낱말 목록 지우기: 원본 구간 → 타임라인 구간 → 잘라 내기 */
  VE.cutWords = (items) => { const ranges = []; for (const w of items) ranges.push(...VE.srcToTimeline(w.mid, w.ws, w.we)); return VE.removeRanges(ranges); };

  /* ---------- SRT 넣기 ---------- */
  VE.importSrt = (text, mid) => {
    const m = VE.media(mid); if (!m) return 0; const blocks = text.replace(/\r/g, '').split(/\n\n+/), words = [];
    const tm = s => { const q = s.trim().replace(',', '.').split(':').map(Number); return q.length === 3 ? q[0] * 3600 + q[1] * 60 + q[2] : q[0] * 60 + q[1]; };
    for (const b of blocks) {
      const ls = b.split('\n').filter(Boolean), ti = ls.findIndex(l => l.includes('-->')); if (ti < 0) continue;
      const [a, z] = ls[ti].split('-->').map(tm), body = ls.slice(ti + 1).join(' ').trim(); if (!body) continue;
      const parts = body.split(/\s+/), tot = parts.reduce((s, p) => s + p.length, 0) || 1; let cur = a;
      parts.forEach(p => { const d = (z - a) * p.length / tot; words.push({ s: cur, e: cur + d, t: p }); cur += d; });
    }
    m.words = words; VE.capDirty(); VE.emit('words'); return words.length;
  };

  /* ---------- 얼굴 위치 찾기 ---------- */
  const TASKS = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2';
  const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  let landP = null;
  VE.faceLandmarker = (numFaces) => {
    if (landP && landP.n >= numFaces) return landP.p;
    const p = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import(TASKS + '/vision_bundle.mjs');
      const fs = await FilesetResolver.forVisionTasks(TASKS + '/wasm');
      const mk = (delegate) => FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: FACE_MODEL, delegate }, runningMode: 'VIDEO', numFaces, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: false, minFaceDetectionConfidence: .4, minFacePresenceConfidence: .4, minTrackingConfidence: .4 });
      if (faceCpu()) return await mk('CPU');
      try { return await mk('GPU'); } catch (e) { console.warn('GPU 실패, CPU 로', e); return await mk('CPU'); }
    })();
    landP = { n: numFaces, p }; p.catch(() => { landP = null; }); return p;
  };
  /* 일부 휴대폰의 그래픽 가속에서 얼굴 찾기가 한 장면에서 깨지면(norm_rect was not ok 등) 부품이 망가진 채로 남는다.
     부품을 버리고 CPU 로 새로 만들어 이어 간다. 이 기기는 다음부터 CPU 로 */
  const faceCpu = () => { try { return localStorage.getItem('ve:faceCpu') === '1'; } catch (e) { return false; } };
  async function resetLandmarker(numFaces) {
    try { localStorage.setItem('ve:faceCpu', '1'); } catch (e) { }
    const old = landP; landP = null;
    if (old) { try { (await old.p).close(); } catch (e) { } }
    return VE.faceLandmarker(numFaces);
  }
  /* 눈금 하나 → [cx cy w h roll yaw pitch blinkL blinkR mouth smile brow] (좌표는 0~1) */
  function poseOf(res, i, ar) {
    const L = res.faceLandmarks[i], bs = res.faceBlendshapes && res.faceBlendshapes[i] ? res.faceBlendshapes[i].categories : [];
    const B = n => { const f = bs.find(x => x.categoryName === n); return f ? f.score : 0; };
    let x0 = 1, x1 = 0, y0 = 1, y1 = 0; for (const p of L) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
    const el = L[33], er = L[263], nose = L[1], left = L[234], right = L[454], top = L[10], chin = L[152];
    const roll = Math.atan2((er.y - el.y), (er.x - el.x) * ar);
    const span = Math.hypot((right.x - left.x) * ar, right.y - left.y) || 1e-3, midx = (left.x + right.x) / 2, midy = (left.y + right.y) / 2;
    const yaw = clamp(((nose.x - midx) * ar) / span * 3.2, -1, 1), vspan = Math.hypot((chin.x - top.x) * ar, chin.y - top.y) || 1e-3, pitch = clamp(((nose.y - (top.y + chin.y) / 2) / vspan) * 4 - .2, -1, 1);
    /* 얼굴 가운데: 코끝보다 조금 위. 너비는 고개를 돌려도 크게 줄지 않게 세로 길이로 보정 */
    const cx = (top.x + chin.x) / 2, cy = (top.y + chin.y) / 2, h = vspan, w = Math.max(span, vspan * .78 * ar / ar) / ar * 1;
    return [cx, cy, w, h, roll, yaw, pitch, B('eyeBlinkLeft'), B('eyeBlinkRight'), clamp(B('jawOpen') * 1.5, 0, 1), clamp((B('mouthSmileLeft') + B('mouthSmileRight')) / 2, 0, 1), clamp(B('browInnerUp'), 0, 1)];
  }
  VE.poseOf = poseOf;
  const smooth = (tr, a, b) => { /* 떨림을 줄이려고 위치 값을 앞뒤로 평균 */
    const fr = tr.frames, R = 2;
    const copy = []; for (let i = a; i <= b; i++) copy[i] = fr[i] && fr[i].length ? fr[i].map(f => f.slice()) : fr[i];
    for (let i = a; i <= b; i++) {
      const cur = copy[i]; if (!cur || !cur.length) continue;
      cur.forEach((f, n) => { for (const k of [0, 1, 2, 3, 4, 5, 6]) { let s = 0, w = 0; for (let j = -R; j <= R; j++) { const q = copy[i + j]; if (q && q[n]) { const wt = R + 1 - Math.abs(j); s += q[n][k] * wt; w += wt; } } fr[i][n][k] = s / w; } });
    }
  };
  /* 이 미디어에서 쓰는 구간의 얼굴 위치를 모두 찾아 둠 */
  /* 얼굴 찾기는 시간이 앞으로만 가야 하므로 한 번에 하나씩 차례로 */
  let faceLock = Promise.resolve(), faceClock = 1;
  VE.trackFaces = (mid, o) => { const p = faceLock.then(() => trackOne(mid, o)); faceLock = p.catch(() => { }); return p; };
  const trackOne = async (mid, { ranges, faces, onProg, signal }) => {
    const MB = await VE.mb(), r = VE.rt.get(mid), m = VE.media(mid); await VE.openInput(mid); if (!r.vTrack) throw new Error('영상이 없는 파일입니다');
    const fps = 12; if (!r.track || r.track.fps !== fps || (r.track.faces || 1) < (faces || 1)) { r.track = { fps, faces: faces || 1, frames: [] }; }
    const tr = r.track, want = []; (ranges || [[0, m.dur]]).forEach(([a, b]) => { for (let i = Math.floor(a * fps); i <= Math.ceil(b * fps); i++) if (tr.frames[i] === undefined && i / fps <= m.dur) want.push(i); });
    want.sort((x, y) => x - y); const uniq = want.filter((v, i) => v !== want[i - 1]); if (!uniq.length) return tr;
    let lm = await VE.faceLandmarker(faces || 1), fails = 0; const w = Math.min(640, m.w), h = Math.round(w * m.h / m.w / 2) * 2;
    const sink = new MB.CanvasSink(r.vTrack, { width: w, height: h, fit: 'fill', poolSize: 2 }); const ar = m.w / m.h, first = await r.vTrack.getFirstTimestamp().catch(() => 0);
    const stamps = uniq.map(i => Math.max(first, i / fps)); let n = 0, last = 0;
    const t0 = performance.now();
    for await (const got of sink.canvasesAtTimestamps(stamps)) {
      if (signal && signal.aborted) throw new DOMException('그만둠', 'AbortError');
      const i = uniq[n++]; let list = [];
      if (got && got.canvas.width > 1 && got.canvas.height > 1) {
        faceClock += 40; let res = null;
        try { res = lm.detectForVideo(got.canvas, faceClock); }
        catch (e) {
          /* 이 장면은 얼굴 없음으로 두고, 부품을 새로 만들어 다음 장면부터 이어 감 */
          console.warn('얼굴 찾기 한 장면 실패', e); fails++;
          if (fails > 8) throw new Error('이 영상에서는 얼굴 위치를 찾다가 자꾸 멈춥니다. 영상을 다시 저장하거나 PC 의 크롬·엣지에서 해 보세요.');
          lm = await resetLandmarker(faces || 1);
        }
        if (res) list = (res.faceLandmarks || []).map((_, k) => poseOf(res, k, ar)).sort((a, b) => b[2] - a[2]);
      }
      tr.frames[i] = list;
      const now = performance.now(); if (now - last > 120) { last = now; const done = n / uniq.length, spent = (now - t0) / 1000; onProg && onProg({ ratio: done, eta: done > .02 ? spent / done * (1 - done) : null }); VE.emit('track', mid); await new Promise(z => setTimeout(z)); }
    }
    smooth(tr, uniq[0], uniq[uniq.length - 1]);
    VE.idb.put('cache', mid + ':track', tr).catch(() => { }); VE.emit('track', mid); return tr;
  };
  /* 프로젝트 전체에서 얼굴 분석이 필요한 곳을 모아 처리 */
  VE.needFaceJobs = () => {
    const jobs = new Map(); const add = (mid, a, b, faces) => { const j = jobs.get(mid) || { mid, ranges: [], faces: 1 }; j.ranges.push([a, b]); j.faces = Math.max(j.faces, faces); jobs.set(mid, j); };
    for (const c of VE.p.clips) {
      if (c.face && c.face.mode) add(c.mid, c.in, c.out, c.face.mode === 'mosaic' ? 4 : 1);
      if (c.pip && c.pip.char) { const off = c.pip.off || 0; add(c.pip.mid, Math.max(0, c.in + off), Math.max(0, c.out + off), 1); }
    }
    const out = [];
    jobs.forEach(j => { const r = VE.rt.get(j.mid), tr = r && r.track; let missing = !tr || (tr.faces || 1) < j.faces; if (!missing) { for (const [a, b] of j.ranges) { for (let i = Math.floor(a * tr.fps); i <= Math.ceil(b * tr.fps); i += 3) if (tr.frames[i] === undefined && i / tr.fps <= VE.media(j.mid).dur) { missing = true; break; } if (missing) break; } } if (missing) out.push(j); });
    return out;
  };
  VE.runFaceJobs = async (onProg, signal) => {
    const jobs = VE.needFaceJobs();
    for (let i = 0; i < jobs.length; i++) await VE.trackFaces(jobs[i].mid, { ranges: jobs[i].ranges, faces: jobs[i].faces, signal, onProg: p => onProg && onProg({ ratio: (i + p.ratio) / jobs.length, eta: p.eta }) });
    return jobs.length;
  };
})();
