/* 영상 작업장 — 공개 AI 목소리
   받아 적은 글을 공개 음성 모델(Supertonic 2, Supertone · OpenRAIL-M)로 다시 읽어 원래 목소리를 바꾸고, 글을 읽어 내레이션을 만든다.
   - 모델은 이 기기 안(별도 작업 스레드)에서만 돌린다. 소리와 글을 밖으로 보내지 않는다.
   - 문장은 원래 말한 자리(원본 시간)에 붙이므로 나중에 컷을 바꿔도 따라간다.
   - 모델 사용 조건에 따라 AI 로 만든 음성이라는 표시를 기본으로 넣는다. */
'use strict';
(() => {
  const SR = 44100;
  const REV = '75e6727618a02f323c720cba9478152d4bc16ca4';
  const REPO = 'https://huggingface.co/Supertone/supertonic-2/resolve/' + REV + '/';
  const ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
  const MODEL_MB = 263;
  VE.TTS_INFO = { name: 'Supertonic 2', maker: 'Supertone', license: 'OpenRAIL-M', page: 'https://huggingface.co/Supertone/supertonic-2', licenseUrl: 'https://huggingface.co/Supertone/supertonic-2/blob/main/LICENSE', mb: MODEL_MB };

  /* 목소리 10종 — 이름은 모델이 붙인 번호, 설명은 같은 문장을 읽혀 잰 음높이와 빠르기 */
  const VOICES = VE.VOICES = [
    { id: 'F1', name: '여성 1', desc: '중간 음 · 보통 빠르기' },
    { id: 'F2', name: '여성 2', desc: '높은 음 · 보통 빠르기' },
    { id: 'F3', name: '여성 3', desc: '중간 음 · 조금 느림' },
    { id: 'F4', name: '여성 4', desc: '조금 높은 음 · 빠름' },
    { id: 'F5', name: '여성 5', desc: '조금 낮은 음 · 조금 느림' },
    { id: 'M1', name: '남성 1', desc: '조금 높은 음 · 보통 빠르기' },
    { id: 'M2', name: '남성 2', desc: '낮은 음 · 보통 빠르기' },
    { id: 'M3', name: '남성 3', desc: '낮은 음 · 빠름' },
    { id: 'M4', name: '남성 4', desc: '중간 음 · 조금 느림' },
    { id: 'M5', name: '남성 5', desc: '낮은 음 · 느림' },
  ];
  VE.voiceName = id => (VOICES.find(v => v.id === id) || { name: id }).name;
  const SPEED0 = 1.05; /* 모델이 권하는 기본 빠르기 */

  /* ---------- 작업 스레드 (모델 실행) ---------- */
  function workerMain() {
    let ort = null, S = null, cfg = null, idx = null; const styles = {};
    const say = (o, tr) => self.postMessage(o, tr || []);
    async function grab(path, onBytes) {
      let cache = null; try { cache = await caches.open('ve-tts-supertonic2'); } catch (e) { }
      const url = REPO + path;
      if (cache) { const hit = await cache.match(url).catch(() => null); if (hit) { const b = await hit.arrayBuffer(); onBytes && onBytes(b.byteLength); return b; } }
      const r = await fetch(url); if (!r.ok) throw new Error('모델 파일을 받지 못했습니다 (' + r.status + ')');
      const rd = r.body.getReader(), parts = [];
      for (; ;) { const x = await rd.read(); if (x.done) break; parts.push(x.value); onBytes && onBytes(x.value.length); }
      const blob = new Blob(parts); if (cache) { try { await cache.put(url, new Response(blob)); } catch (e) { } }
      return blob.arrayBuffer();
    }
    const json = b => JSON.parse(new TextDecoder().decode(b));
    let loading = null;
    const load = () => loading || (loading = doLoad().catch(e => { loading = null; throw e; }));
    async function doLoad() {
      ort = await import(ORT + 'ort.wasm.min.mjs'); ort.env.wasm.wasmPaths = ORT; ort.env.wasm.numThreads = 1;
      const files = [['onnx/tts.json', 8699], ['onnx/unicode_indexer.json', 262196], ['onnx/duration_predictor.onnx', 1521526], ['onnx/text_encoder.onnx', 27431318], ['onnx/vector_estimator.onnx', 132471364], ['onnx/vocoder.onnx', 101405066]];
      const all = files.reduce((a, f) => a + f[1], 0); let got = 0, last = 0;
      const onBytes = n => { got += n; const now = Date.now(); if (now - last > 150) { last = now; say({ type: 'dl', ratio: Math.min(1, got / all) }); } };
      const s = {};
      for (const [p] of files) {
        const b = await grab(p, onBytes);
        if (p.endsWith('tts.json')) cfg = json(b); else if (p.endsWith('indexer.json')) idx = json(b);
        else s[p.slice(5, -5)] = await ort.InferenceSession.create(new Uint8Array(b), { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      }
      S = s;
    }
    async function style(v) {
      if (styles[v]) return styles[v];
      const j = json(await grab('voice_styles/' + v + '.json'));
      return styles[v] = { ttl: new ort.Tensor('float32', new Float32Array(j.style_ttl.data.flat(Infinity)), j.style_ttl.dims), dp: new ort.Tensor('float32', new Float32Array(j.style_dp.data.flat(Infinity)), j.style_dp.dims) };
    }
    /* 공식 예제의 글 다듬기와 같은 규칙 */
    function prep(t) {
      t = String(t).normalize('NFKD');
      const rep = { '–': '-', '‑': '-', '—': '-', '_': ' ', '“': '"', '”': '"', '‘': "'", '’': "'", '´': "'", '`': "'", '[': ' ', ']': ' ', '|': ' ', '/': ' ', '#': ' ', '→': ' ', '←': ' ' };
      for (const k in rep) t = t.split(k).join(rep[k]);
      t = t.replace(/[♥☆♡©\\]/g, '').replace(/ ([,.!?;:'])/g, '$1').replace(/\s+/g, ' ').trim();
      if (!/[.!?;:,'"')\]}…。」』】〉》›»]$/.test(t)) t += '.';
      return '<ko>' + t + '</ko>';
    }
    function ids(text) { const out = []; for (const ch of text) { const c = ch.codePointAt(0); out.push(c < idx.length ? idx[c] : -1); } return out; }
    /* 앞뒤 무음을 걷어 말이 원래 자리에서 바로 시작하게 */
    function trim(w) {
      const th = .012; let a = 0, b = w.length - 1;
      while (a < w.length && Math.abs(w[a]) < th) a++;
      while (b > a && Math.abs(w[b]) < th) b--;
      a = Math.max(0, a - Math.round(SR * .025)); b = Math.min(w.length, b + Math.round(SR * .06));
      const o = w.slice(a, b); const f = Math.min(o.length >> 1, Math.round(SR * .006)); for (let i = 0; i < f; i++) { o[i] *= i / f; o[o.length - 1 - i] *= i / f; }
      return o;
    }
    async function synth({ text, voice, steps, speed, span, room }) {
      const st = await style(voice), t = prep(text), id = ids(t), L = id.length;
      const tid = new ort.Tensor('int64', BigInt64Array.from(id.map(BigInt)), [1, L]), tm = new ort.Tensor('float32', new Float32Array(L).fill(1), [1, 1, L]);
      const dur0 = (await S.duration_predictor.run({ text_ids: tid, style_dp: st.dp, text_mask: tm })).duration.data[0];
      /* 빠르기: 원래 말한 길이에 가깝게, 다음 말과 겹치지 않게 */
      let sp = speed || 1.05;
      if (span) {
        const talk = Math.max(.25, dur0 - .55); /* 앞뒤 무음(약 0.55초)을 뺀 말 길이 */
        const fit = talk / span; sp = Math.max(sp * .88, Math.min(sp * 1.12, fit));
        if (room && talk / sp > room) sp = talk / room;
        sp = Math.max(.7, Math.min(1.9, sp));
      }
      const dur = dur0 / sp;
      const emb = (await S.text_encoder.run({ text_ids: tid, style_ttl: st.ttl, text_mask: tm })).text_emb;
      const cs = cfg.ae.base_chunk_size * cfg.ttl.chunk_compress_factor, D = cfg.ttl.latent_dim * cfg.ttl.chunk_compress_factor, wl = Math.floor(dur * cfg.ae.sample_rate), LL = Math.max(1, Math.ceil(wl / cs));
      let x = new Float32Array(D * LL); for (let i = 0; i < x.length; i++) { const u1 = Math.max(1e-4, Math.random()), u2 = Math.random(); x[i] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }
      const lm = new ort.Tensor('float32', new Float32Array(LL).fill(1), [1, 1, LL]), ts = new ort.Tensor('float32', new Float32Array([steps]), [1]);
      for (let k = 0; k < steps; k++) {
        const o = await S.vector_estimator.run({ noisy_latent: new ort.Tensor('float32', x, [1, D, LL]), text_emb: emb, style_ttl: st.ttl, latent_mask: lm, text_mask: tm, current_step: new ort.Tensor('float32', new Float32Array([k]), [1]), total_step: ts });
        x = o.denoised_latent.data;
      }
      const w = (await S.vocoder.run({ latent: new ort.Tensor('float32', x, [1, D, LL]) })).wav_tts.data;
      return { pcm: trim(w.subarray(0, Math.min(w.length, wl))), speed: sp };
    }
    self.onmessage = async e => {
      const d = e.data;
      try {
        if (d.type === 'load') { await load(); say({ type: 'ready', id: d.id }); }
        else if (d.type === 'synth') { await load(); const r = await synth(d); say({ type: 'res', id: d.id, pcm: r.pcm, speed: r.speed }, [r.pcm.buffer]); }
      } catch (err) { say({ type: 'err', id: d.id, msg: String(err && err.message || err) }); }
    };
  }
  const workerSrc = `const SR=${SR},REPO=${JSON.stringify(REPO)},ORT=${JSON.stringify(ORT)};(${workerMain.toString()})();`;
  let worker = null, ready = false, seq = 0, loadP = null;
  const getWorker = () => worker || (worker = new Worker(URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' })), { type: 'module' }));
  const call = (msg, onDl) => new Promise((res, rej) => {
    const w = getWorker(), id = ++seq;
    const fin = () => { w.removeEventListener('message', on); w.removeEventListener('error', onErr); };
    const on = e => { const d = e.data; if (d.type === 'dl') { onDl && onDl(d.ratio); return; } if (d.id !== id) return; if (d.type === 'ready' || d.type === 'res') { fin(); res(d); } else if (d.type === 'err') { fin(); rej(new Error(d.msg)); } };
    const onErr = e => { fin(); rej(new Error(e.message || '목소리 부품을 시작하지 못했습니다')); };
    w.addEventListener('message', on); w.addEventListener('error', onErr); w.postMessage({ ...msg, id });
  });
  const tts = VE.tts = {
    get ready() { return ready; },
    /* 처음 한 번 모델을 받음. 이미 받았는지는 저장소로 확인 */
    cached: async () => { try { const c = await caches.open('ve-tts-supertonic2'); return !!(await c.match(REPO + 'onnx/vocoder.onnx')); } catch (e) { return false; } },
    ensure: async (onProg) => {
      if (ready) return; onProg && onProg({ stage: '목소리 모델 받는 중', ratio: 0 });
      const fns = tts._dl || (tts._dl = new Set()); if (onProg) fns.add(onProg);
      if (!loadP) loadP = call({ type: 'load' }, r => fns.forEach(f => f({ stage: r >= 1 ? '목소리 모델 준비 중' : '목소리 모델 받는 중', ratio: r }))).then(() => { ready = true; }).finally(() => { loadP = null; fns.clear(); });
      await loadP;
    },
    say: async (text, voice, opts) => { opts = opts || {}; await tts.ensure(opts.onProg); const r = await call({ type: 'synth', text, voice, steps: opts.steps || 5, speed: opts.speed || SPEED0, span: opts.span || 0, room: opts.room || 0 }); return { pcm: r.pcm, speed: r.speed, sr: SR }; },
    stop: () => { if (worker) { worker.terminate(); worker = null; ready = false; loadP = null; } },
  };

  /* ---------- 들어 보기 ---------- */
  const samples = new Map(); let sampleCtx = null, sampleNode = null;
  tts.preview = async (voice, onProg) => {
    if (!samples.has(voice)) samples.set(voice, (await tts.say('안녕하세요. 이 목소리로 강의 영상을 읽어 드립니다.', voice, { steps: 4, onProg })).pcm);
    const pcm = samples.get(voice); const AC = window.AudioContext || window.webkitAudioContext;
    if (!sampleCtx) sampleCtx = new AC(); if (sampleCtx.state === 'suspended') await sampleCtx.resume().catch(() => { });
    tts.stopPreview(); const b = sampleCtx.createBuffer(1, pcm.length, SR); b.copyToChannel(pcm, 0);
    const n = sampleCtx.createBufferSource(); n.buffer = b; n.connect(sampleCtx.destination); n.start(); sampleNode = n;
    return new Promise(res => { n.onended = () => { if (sampleNode === n) sampleNode = null; res(); }; });
  };
  tts.stopPreview = () => { if (sampleNode) { try { sampleNode.stop(); } catch (e) { } sampleNode = null; } };

  /* ---------- 글을 소리 파일로 (내레이션) ---------- */
  const sentences = (text, max) => {
    const out = []; String(text).split(/\n\s*\n+/).forEach(par => {
      let cur = ''; par.replace(/\s+/g, ' ').trim().split(/(?<=[.!?。…])\s+/).forEach(s => {
        while (s.length > max) { const cut = s.lastIndexOf(' ', max) > max * .5 ? s.lastIndexOf(' ', max) : max; if (cur) { out.push(cur); cur = ''; } out.push(s.slice(0, cut).trim()); s = s.slice(cut).trim(); }
        if (!s) return; if (cur && cur.length + s.length + 1 > max) { out.push(cur); cur = s; } else cur = cur ? cur + ' ' + s : s;
      });
      if (cur) out.push(cur); out.push('\n');
    });
    while (out.length && out[out.length - 1] === '\n') out.pop(); return out;
  };
  function wav(pcm) {
    const b = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(b), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
    for (let i = 0; i < pcm.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 32767 | 0, true);
    return b;
  }
  /* 글 → 타임라인 아래(소리 줄)의 소리 조각 */
  VE.narrate = async (text, voice, opts) => {
    opts = opts || {}; const parts = sentences(text, 110).filter(s => s.trim()); if (!parts.length) throw new Error('읽을 글을 적어 주세요');
    const list = sentences(text, 110), pcs = []; let done = 0, gap = false; const t0 = performance.now();
    await tts.ensure(opts.onProg);
    for (const s of list) {
      if (opts.signal && opts.signal.aborted) throw new DOMException('그만둠', 'AbortError');
      if (s === '\n') { if (pcs.length) { pcs.push(new Float32Array(Math.round(SR * .5))); gap = true; } continue; }
      const r = await tts.say(s, voice, { steps: opts.steps, speed: opts.speed });
      if (pcs.length && !gap) pcs.push(new Float32Array(Math.round(SR * .28)));
      pcs.push(r.pcm); done++; gap = false;
      const spent = (performance.now() - t0) / 1000; opts.onProg && opts.onProg({ stage: '글 읽는 중', ratio: done / parts.length, eta: spent / done * (parts.length - done) });
    }
    const n = pcs.reduce((a, p) => a + p.length, 0), all = new Float32Array(n); let o = 0; for (const p of pcs) { all.set(p, o); o += p.length; }
    const name = `AI 목소리 · ${VE.voiceName(voice)} · ${String(text).trim().slice(0, 14).replace(/\s+/g, ' ')}.wav`;
    const file = new File([wav(all)], VE.safeName(name).replace(/\.wav$/, '') + '.wav', { type: 'audio/wav' });
    const [m] = await VE.importFiles([file], { autoAdd: false, role: 'tts' }); if (!m) throw new Error('소리 파일을 넣지 못했습니다');
    m.voice = voice; const at = opts.at != null ? opts.at : 0;
    const clip = VE.addMusic(m.id, at); clip.vol = 1; clip.fadeOut = 0; VE.touch();
    return clip;
  };

  /* ---------- 원래 목소리를 AI 목소리로 (원본 시간에 붙임) ---------- */
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const clean = t => String(t).replace(/\s+/g, ' ').trim();
  /* 장면(클립)마다 받아 적은 낱말을 문장으로 묶음. 문장은 장면 경계를 넘지 않는다 */
  function plan() {
    const out = [], seen = new Set();
    for (const c of VE.p.clips) {
      const m = VE.media(c.mid); if (!m || m.kind === 'image' || !m.words || !m.words.length) continue;
      const ws = m.words.filter(w => { const x = (w.s + w.e) / 2; return x >= c.in && x <= c.out && clean(w.t); });
      const groups = []; let cur = null;
      for (const w of ws) {
        if (cur) { const last = cur.w[cur.w.length - 1]; if (w.s - last.e > .6 || cur.text.length + w.t.length > 90 || /[.?!。]$/.test(clean(last.t))) { groups.push(cur); cur = null; } }
        if (!cur) cur = { mid: c.mid, s: Math.max(c.in, w.s), e: 0, w: [], text: '' };
        cur.w.push(w); cur.text = clean(cur.text + ' ' + w.t); cur.e = Math.min(c.out, w.e);
      }
      if (cur) groups.push(cur);
      groups.forEach((g, i) => { const nx = groups[i + 1]; g.span = Math.max(.25, g.e - g.s); g.room = Math.max(g.span, (nx ? nx.s - .05 : c.out) - g.s); });
      for (const g of groups) { const key = g.mid + '|' + g.s.toFixed(2) + '|' + g.text; if (seen.has(key)) continue; seen.add(key); out.push(g); }
    }
    return out;
  }
  const keyOf = (g, o) => 'dub:' + hash([o.voice, o.speed, o.steps, g.mid, g.s.toFixed(2), g.room.toFixed(1), g.text].join('|'));
  const dub = VE.dub = {};
  const pcmOf = (mid) => { const r = VE.rt.get(mid); if (!r) return null; return r.dubPcm || (r.dubPcm = new Map()); };
  dub.settings = () => { const v = VE.p.voice; return { voice: v.aiVoice || 'F1', speed: +(SPEED0 * (v.aiSpeed || 1)).toFixed(3), steps: v.aiSteps || 5 }; };
  dub.has = () => VE.p.media.some(m => m.dub && m.dub.segs && m.dub.segs.length);
  dub.active = mid => { if (!VE.p.voice.ai) return false; const m = VE.media(mid); return !!(m && m.dub && m.dub.segs && m.dub.segs.length); };
  dub.anyActive = () => VE.p.voice.ai && dub.has();
  /* 지금 설정으로 새로 만들어야 하는 문장 수 / 전체 */
  dub.status = () => {
    const o = dub.settings(), g = plan(); let fresh = 0, todoChars = 0;
    for (const x of g) { const m = VE.media(x.mid), k = keyOf(x, o); if (m.dub && m.dub.segs.some(s => s.k === k)) fresh++; else todoChars += x.text.length; }
    return { total: g.length, fresh, todo: g.length - fresh, todoChars, mids: [...new Set(g.map(x => x.mid))] };
  };
  dub.groups = plan;
  /* 저장해 둔 소리 불러오기 */
  dub.load = async (mid) => {
    const m = VE.media(mid), map = pcmOf(mid); if (!m || !m.dub || !map) return;
    for (const s of m.dub.segs) { if (map.has(s.k)) continue; const v = await VE.idb.get('cache', s.k).catch(() => null); if (v) { const i16 = new Int16Array(v); const f = new Float32Array(i16.length); for (let i = 0; i < f.length; i++) f[i] = i16[i] / 32767; map.set(s.k, f); } }
  };
  dub.loadAll = async () => { for (const m of VE.p.media) if (m.dub) await dub.load(m.id); };
  const toI16 = f => { const o = new Int16Array(f.length); for (let i = 0; i < f.length; i++) o[i] = Math.max(-1, Math.min(1, f[i])) * 32767 | 0; return o.buffer; };

  /* 만들기: 이미 만든 문장은 그대로 두고 바뀐 문장만 새로 만든다 */
  dub.run = async ({ onProg, signal }) => {
    const o = dub.settings(), groups = plan(); if (!groups.length) throw new Error('받아 적은 글이 없습니다. 먼저 자막을 만들어 주세요');
    await tts.ensure(onProg);
    const next = new Map(); /* mid → segs */
    for (const x of groups) if (!next.has(x.mid)) next.set(x.mid, []);
    const todo = []; for (const x of groups) { const m = VE.media(x.mid), k = keyOf(x, o), old = m.dub && m.dub.segs.find(s => s.k === k); if (old && (pcmOf(x.mid).has(k) || await VE.idb.get('cache', k).catch(() => null))) next.get(x.mid).push(old); else todo.push({ x, k }); }
    const allChars = todo.reduce((a, t) => a + t.x.text.length, 0) || 1; let doneChars = 0; const t0 = performance.now();
    const commit = () => {
      for (const [mid, segs] of next) {
        const m = VE.media(mid), keep = new Set(segs.map(s => s.k));
        if (m.dub) for (const s of m.dub.segs) if (!keep.has(s.k)) { VE.idb.del('cache', s.k).catch(() => { }); const map = pcmOf(mid); if (map) map.delete(s.k); }
        segs.sort((a, b) => a.at - b.at); m.dub = { voice: o.voice, speed: o.speed, steps: o.steps, segs };
      }
      VE.saveSoon(); VE.emit('dub');
    };
    try {
      for (let i = 0; i < todo.length; i++) {
        const { x, k } = todo[i];
        if (signal && signal.aborted) throw new DOMException('그만둠', 'AbortError');
        const spent = (performance.now() - t0) / 1000;
        onProg && onProg({ stage: `문장 읽는 중 (${i + 1}/${todo.length})`, ratio: doneChars / allChars, eta: doneChars > 0 ? spent / doneChars * (allChars - doneChars) : null });
        const r = await tts.say(x.text, o.voice, { steps: o.steps, speed: o.speed, span: x.span, room: x.room });
        await VE.idb.put('cache', k, toI16(r.pcm)).catch(() => { });
        pcmOf(x.mid).set(k, r.pcm);
        next.get(x.mid).push({ k, at: x.s, dur: r.pcm.length / SR, text: x.text, sp: +r.speed.toFixed(3) });
        doneChars += x.text.length;
      }
    } finally { commit(); }
    if (!VE.p.voice.ai) { VE.edit(() => { VE.p.voice.ai = true; }); }
  };
  dub.clear = () => {
    for (const m of VE.p.media) if (m.dub) { for (const s of m.dub.segs) VE.idb.del('cache', s.k).catch(() => { }); delete m.dub; const map = pcmOf(m.id); if (map) map.clear(); }
    VE.edit(() => { VE.p.voice.ai = false; }); VE.emit('dub');
  };

  /* 원본 시간 a~b 의 AI 목소리를 sr 로 (내보내기용) */
  dub.renderSrc = (mid, a, b, sr) => {
    const m = VE.media(mid), map = pcmOf(mid), n = Math.max(0, Math.round((b - a) * sr)), out = new Float32Array(n); if (!m || !m.dub || !map) return out;
    const k = SR / sr;
    for (const s of m.dub.segs) {
      const pcm = map.get(s.k); if (!pcm) continue; const s0 = s.at, s1 = s.at + pcm.length / SR; if (s1 <= a || s0 >= b) continue;
      const from = Math.max(0, Math.floor((s0 - a) * sr)), to = Math.min(n, Math.ceil((s1 - a) * sr));
      for (let i = from; i < to; i++) { const p = ((a + i / sr) - s0) * SR; if (p < 0) continue; const j = Math.floor(p), f = p - j; if (j + 1 >= pcm.length) break; out[i] += pcm[j] * (1 - f) + pcm[j + 1] * f; }
      /* 장면 끝에서 말이 잘리면 짧게 줄여 딸깍 소리를 막음 */
      if (s1 > b) { const fl = Math.min(n, Math.round(sr * .03)); for (let i = 0; i < fl; i++) out[n - 1 - i] *= i / fl; }
    }
    return out;
  };

  /* ---------- 미리보기 재생: 재생 중인 장면의 원본 시간에 맞춰 문장을 예약 ---------- */
  const live = new Map(); let liveClip = null;
  dub.stopAll = () => { for (const n of live.values()) { try { n.stop(); } catch (e) { } } live.clear(); liveClip = null; };
  /* audio = 재생기의 소리 묶음, st = { clip, src } (멈췄으면 null) */
  dub.sync = (audio, st) => {
    if (!audio || !st || !dub.active(st.clip.mid)) { if (live.size) dub.stopAll(); return; }
    const c = st.clip, m = VE.media(c.mid), map = pcmOf(c.mid), sp = c.speed || 1, ctx = audio.ctx;
    if (liveClip !== c.id) { dub.stopAll(); liveClip = c.id; }
    if (m.dub.segs.some(s => !map.has(s.k)) && !m._dubLoading) { m._dubLoading = true; dub.load(c.mid).finally(() => { m._dubLoading = false; }); }
    for (const s of m.dub.segs) {
      if (live.has(s.k)) continue; const pcm = map.get(s.k); if (!pcm) continue;
      const s1 = s.at + pcm.length / SR; if (s1 <= st.src + .02 || s.at > st.src + .5 || s.at >= c.out || s1 <= c.in) continue;
      const startSrc = Math.max(st.src, s.at, c.in), endSrc = Math.min(s1, c.out); if (endSrc - startSrc < .02) continue;
      const b = ctx.createBuffer(1, pcm.length, SR); b.copyToChannel(pcm, 0);
      const n = ctx.createBufferSource(); n.buffer = b; n.playbackRate.value = sp;
      const g = ctx.createGain(); g.gain.value = c.vol == null ? 1 : c.vol; n.connect(g); g.connect(audio.bus);
      const when = ctx.currentTime + Math.max(0, (s.at - st.src) / sp), off = Math.max(0, startSrc - s.at);
      n.start(when, off); n.stop(when + (endSrc - startSrc) / sp + .01); live.set(s.k, n);
      n.onended = () => { try { g.disconnect(); } catch (e) { } };
    }
  };

  /* 화면에 'AI 음성' 표시를 넣을 때인지 */
  dub.labelAt = (t, clip) => {
    if (VE.p.aiVoiceLabel === false) return false;
    if (clip && dub.active(clip.mid)) return true;
    return VE.p.music.some(o => { const m = VE.media(o.mid); return m && m.role === 'tts' && t >= o.start && t < o.start + (o.out - o.in); });
  };
})();
