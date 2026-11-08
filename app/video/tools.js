/* 영상 — 분석 도구: 무음 찾기 · 자동 자막(Whisper) · 얼굴 위치 찾기(MediaPipe)
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
  VE.WHISPER = {
    base: { id: 'onnx-community/whisper-base_timestamped', mb: 80, name: '빠르게' },
    small: { id: 'onnx-community/whisper-small_timestamped', mb: 250, name: '더 정확하게' },
    /* 한국어 정확도가 가장 높음. 4비트로 줄인 판 (인코더 425MB + 디코더 334MB) */
    large: { id: 'onnx-community/whisper-large-v3-turbo_timestamped', mb: 760, name: '가장 정확하게', dtype: { encoder_model: 'q4', decoder_model_merged: 'q4' } },
  };
  /* 받아쓰기에서 자주 틀리는 말 → 바른 말 (이 기기에 기억, 다음 자막에도 자동 적용) */
  VE.gloss = {
    list: () => { try { return JSON.parse(localStorage.getItem('ve:gloss') || '[]'); } catch (e) { return []; } },
    save: l => { try { localStorage.setItem('ve:gloss', JSON.stringify(l.slice(-200))); } catch (e) { } },
    add: (a, b) => { const l = VE.gloss.list().filter(x => x[0] !== a); l.push([a, b]); VE.gloss.save(l); },
    remove: a => VE.gloss.save(VE.gloss.list().filter(x => x[0] !== a)),
  };
  /* 받아 적은 낱말 전체에서 바꾸기 (낱말 안의 일부도 바꿈) → 바꾼 낱말 수 */
  /* 낱말 여러 개에 걸친 말도 찾음 (예: "소화 전" → "소화전"): 걸친 낱말들을 하나로 합쳐 바꿈 */
  const replaceIn = (ws, from, to) => {
    let n = 0;
    for (let guard = 0; guard < 2000; guard++) {
      const starts = []; let S = ''; ws.forEach((w, i) => { starts.push(S.length); S += (i ? ' ' : '') + w.t; if (i) starts[i]++; });
      let at = -1, from0 = 0; for (; ;) { at = S.indexOf(from, from0); if (at < 0) break; /* 이미 바꾼 결과 안의 일치는 건너뜀 */ if (to.includes(from) && S.slice(at - to.indexOf(from), at - to.indexOf(from) + to.length) === to) { from0 = at + 1; continue; } break; }
      if (at < 0) break;
      const end = at + from.length; let a = 0, b = 0; ws.forEach((w, i) => { if (starts[i] <= at) a = i; if (starts[i] < end) b = i; });
      const span = ws.slice(a, b + 1), text = span.map(w => w.t).join(' '), off = at - starts[a];
      /* 바꾼 말에 띄어쓰기가 있으면 낱말로 다시 나누고 시간을 글자 수대로 나눔 (낱말 강조 자막이 어긋나지 않게) */
      const parts = (text.slice(0, off) + to + text.slice(off + from.length)).trim().split(/\s+/).filter(Boolean), s0 = ws[a].s, e0 = ws[b].e, tot = parts.reduce((x, p) => x + p.length, 0) || 1; let cur = s0;
      const made = parts.map(p => { const d = (e0 - s0) * p.length / tot, w = { s: Math.round(cur * 1000) / 1000, e: Math.round((cur + d) * 1000) / 1000, t: p }; cur += d; return w; });
      ws.splice(a, b - a + 1, ...made); n++;
    }
    return n;
  };
  VE.replaceWords = (from, to, mids) => {
    from = String(from || '').trim(); to = String(to || '').trim(); if (!from || from === to) return 0; let n = 0;
    for (const m of VE.p.media) { if (!m.words || (mids && !mids.includes(m.id))) continue; n += replaceIn(m.words, from, to); }
    if (n) { VE.capDirty(); VE.saveSoon(); VE.emit('words'); } return n;
  };
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
    const modelCfg = () => ({ device: gpu ? 'webgpu' : 'wasm', dtype: model.dtype || (gpu ? { encoder_model: 'fp32', decoder_model_merged: 'q8' } : { encoder_model: 'q8', decoder_model_merged: 'q8' }) });
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
    m.words = glossApply(tighten(mid, dropGhosts(mid, dedupe(words)))); m.lang = lang; VE.capDirty(); VE.emit('words');
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
  /* 같은 낱말 · 같은 구절(4낱말까지)이 세 번 넘게 잇달아 나오면 받아쓰기 헛돎으로 보고 두 번까지만 남김 */
  function dedupe(ws) {
    let out = []; let run = 0;
    for (const w of ws) { const last = out[out.length - 1]; if (last && last.t === w.t) { run++; if (run >= 2) continue; } else run = 0; out.push(w); }
    for (let n = 2; n <= 4; n++) {
      const res = []; let i = 0;
      while (i < out.length) {
        const key = k => out.slice(k, k + n).map(x => x.t).join(' ');
        let rep = 1; const k0 = key(i); while (i + (rep + 1) * n <= out.length && key(i + rep * n) === k0) rep++;
        if (rep > 2) { res.push(...out.slice(i, i + 2 * n)); i += rep * n; } else { res.push(out[i]); i++; }
      }
      out = res;
    }
    return out;
  }
  /* 헛말 걸러내기: 말소리가 거의 없는 곳의 낱말, 그리고 Whisper 가 조용한 끝부분에 잘 지어내는 인사말 */
  const GHOST = /(시청해\s*주셔서\s*감사합니다|구독과\s*좋아요|좋아요와\s*구독|구독\s*부탁|알림\s*설정|MBC\s*뉴스|KBS\s*뉴스|SBS\s*뉴스|자막\s*(제공|제작|by)|Amara|다음\s*(영상|시간)에\s*(만나요|뵙겠습니다))/;
  function dropGhosts(mid, ws) {
    const pk = VE.rt.get(mid) && VE.rt.get(mid).peaks, hz = VE.PEAK_HZ; if (!pk || !ws.length) return ws;
    const sample = []; for (let i = 0; i < pk.length; i += Math.max(1, Math.floor(pk.length / 4000))) sample.push(pk[i]); sample.sort((a, b) => a - b);
    const floor = sample[Math.floor(sample.length * .15)] || 0, loud = sample[Math.floor(sample.length * .95)] || 0; if (loud <= 0) return ws;
    const level = w => { const a = Math.floor(w.s * hz), b = Math.min(pk.length - 1, Math.ceil(w.e * hz)); let mx = 0; for (let i = a; i <= b; i++) if (pk[i] > mx) mx = pk[i]; return mx; };
    /* 인사말 헛말: 문장 단위로 찾아서 소리가 약하면 지움 */
    const text = ws.map(w => w.t).join(' '), drop = new Set();
    let pos = 0; const starts = ws.map(w => { const s = pos; pos += w.t.length + 1; return s; });
    for (const mt of text.matchAll(new RegExp(GHOST.source, 'g'))) { const a = mt.index, b = a + mt[0].length; const idx = ws.map((w, i) => i).filter(i => starts[i] < b && starts[i] + ws[i].t.length > a); const lv = Math.max(...idx.map(i => level(ws[i]))); if (lv < loud * .35) idx.forEach(i => drop.add(i)); }
    return ws.filter((w, i) => !drop.has(i) && !(level(w) < Math.max(floor * 1.6, loud * .05)));
  }
  /* 자주 틀리는 말 자동 고치기 */
  function glossApply(ws) { for (const [a, b] of VE.gloss.list()) if (a && a !== b) replaceIn(ws, a, b || ''); return ws; }
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
  /* 사진 한 장의 얼굴 기준점 468개 (0~1, x·y 차례) — 얼굴 덮기용 */
  VE.imageLandmarks = (img) => { const p = faceLock.then(async () => {
    const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); c.fillStyle = '#c8ccd0'; c.fillRect(0, 0, W, H); c.drawImage(img, 0, 0);
    const lm = await VE.faceLandmarker(1); let L = null; for (let k = 0; k < 3 && !L; k++) { faceClock += 2000; L = lm.detectForVideo(cv, faceClock).faceLandmarks[0]; }
    if (!L) return null; const out = new Float32Array(468 * 2); for (let i = 0; i < 468; i++) { out[i * 2] = L[i].x; out[i * 2 + 1] = L[i].y; } return out;
  }); faceLock = p.catch(() => { }); return p; };
  const Q = 16000; /* 기준점 저장 배율 (Int16) */
  const trackOne = async (mid, { ranges, faces, mesh, onProg, signal }) => {
    const MB = await VE.mb(), r = VE.rt.get(mid), m = VE.media(mid); await VE.openInput(mid); if (!r.vTrack) throw new Error('영상이 없는 파일입니다');
    /* 얼굴 덮기는 입 모양 · 빠른 움직임까지 따라가야 해서 기준점 468개를 초당 30장 기록 */
    const fps = mesh ? 30 : (r.track && r.track.mesh ? r.track.fps : 12);
    if (!r.track || r.track.fps !== fps || (r.track.faces || 1) < (faces || 1) || (mesh && !r.track.mesh)) { r.track = { fps, faces: faces || 1, frames: [], mesh: mesh ? [] : undefined }; }
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
        if (res) {
          const order = (res.faceLandmarks || []).map((_, k) => [k, poseOf(res, k, ar)]).sort((a, b) => b[1][2] - a[1][2]); list = order.map(o => o[1]);
          if (tr.mesh && order.length) { const L = res.faceLandmarks[order[0][0]], a = new Int16Array(936); for (let q = 0; q < 468; q++) { a[q * 2] = Math.round(L[q].x * Q); a[q * 2 + 1] = Math.round(L[q].y * Q); } tr.mesh[i] = a; }
        }
      }
      tr.frames[i] = list; if (tr.mesh && !list.length) tr.mesh[i] = null;
      const now = performance.now(); if (now - last > 120) { last = now; const done = n / uniq.length, spent = (now - t0) / 1000; onProg && onProg({ ratio: done, eta: done > .02 ? spent / done * (1 - done) : null }); VE.emit('track', mid); await new Promise(z => setTimeout(z)); }
    }
    smooth(tr, uniq[0], uniq[uniq.length - 1]);
    if (tr.mesh) { /* 떨림 줄이기: 앞뒤 장면과 1:2:1 로 섞음 */
      const M = tr.mesh, a0 = uniq[0], a1 = uniq[uniq.length - 1], copy = []; for (let i = a0 - 1; i <= a1 + 1; i++) copy[i] = M[i];
      for (let i = a0; i <= a1; i++) { const c = copy[i], p = copy[i - 1], q = copy[i + 1]; if (!c || !p || !q) continue; const o = new Int16Array(936); for (let k = 0; k < 936; k++) o[k] = Math.round((p[k] + 2 * c[k] + q[k]) / 4); M[i] = o; }
    }
    VE.idb.put('cache', mid + ':track', tr).catch(() => { }); VE.emit('track', mid); return tr;
  };
  /* 프로젝트 전체에서 얼굴 분석이 필요한 곳을 모아 처리 */
  VE.needFaceJobs = () => {
    const jobs = new Map(); const add = (mid, a, b, faces, mesh) => { const j = jobs.get(mid) || { mid, ranges: [], faces: 1, mesh: false }; j.ranges.push([a, b]); j.faces = Math.max(j.faces, faces); j.mesh = j.mesh || !!mesh; jobs.set(mid, j); };
    for (const c of VE.p.clips) {
      if (c.face && c.face.mode) add(c.mid, c.in, c.out, c.face.mode === 'mosaic' ? 4 : 1, c.face.mode === 'char' && c.face.swap && VE.swap && VE.swap.can(c.face.char));
      if (c.pip && c.pip.char) { const off = c.pip.off || 0; add(c.pip.mid, Math.max(0, c.in + off), Math.max(0, c.out + off), 1); }
    }
    const out = [];
    jobs.forEach(j => { const r = VE.rt.get(j.mid), tr = r && r.track; let missing = !tr || (tr.faces || 1) < j.faces || (j.mesh && !tr.mesh); if (!missing) { for (const [a, b] of j.ranges) { for (let i = Math.floor(a * tr.fps); i <= Math.ceil(b * tr.fps); i += 3) if (tr.frames[i] === undefined && i / tr.fps <= VE.media(j.mid).dur) { missing = true; break; } if (missing) break; } } if (missing) out.push(j); });
    return out;
  };
  VE.runFaceJobs = async (onProg, signal) => {
    const jobs = VE.needFaceJobs();
    for (let i = 0; i < jobs.length; i++) await VE.trackFaces(jobs[i].mid, { ranges: jobs[i].ranges, faces: jobs[i].faces, mesh: jobs[i].mesh, signal, onProg: p => onProg && onProg({ ratio: (i + p.ratio) / jobs.length, eta: p.eta }) });
    return jobs.length;
  };
})();
