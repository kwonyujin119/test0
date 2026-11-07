/* 영상 작업장 — 내보내기: 브라우저의 영상 인코더(WebCodecs)로 파일을 만든다. 재생 시간과 무관하게 프레임을 하나씩 정확히 처리한다
   묶음·풀기 부품: Mediabunny */
'use strict';
(() => {
  const SR = 48000;

  /* 클립 하나의 소리를 SR·스테레오로 차례로 내놓음 */
  async function* clipAudio(MB, o, speed) {
    /* o = { mid, in, out, vol, fadeIn, fadeOut } */
    const len = (o.out - o.in) / speed, need = Math.round(len * SR), r = VE.rt.get(o.mid), m = VE.media(o.mid);
    await VE.openInput(o.mid);
    const declick = Math.round(SR * .004), env = (n) => { const local = n / SR; let g = VE.mixFade(o, local, len); if (n < declick) g *= n / declick; if (need - n < declick) g *= (need - n) / declick; return g; };
    const pitchFix = speed !== 1 ? [new VoiceDSP.Shifter(SR), new VoiceDSP.Shifter(SR)] : null; if (pitchFix) pitchFix.forEach(s => { s.ratio = 1 / speed; });
    let made = 0;
    if (r.aTrack && m.hasAudio) {
      const sink = new MB.AudioBufferSink(r.aTrack);
      for await (const { buffer, timestamp } of sink.buffers(o.in, o.out + .05)) {
        const sr = buffer.sampleRate, a = buffer.getChannelData(0), b = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : a, end = timestamp + buffer.length / sr;
        /* 이 버퍼가 덮는 출력 표본 수 */
        let last = Math.ceil((end - o.in) / speed * SR); if (last > need) last = need; const cnt = last - made; if (cnt <= 0) continue;
        const L = new Float32Array(cnt), R = new Float32Array(cnt), ratio = sr * speed / SR, base = (o.in + made / SR * speed - timestamp) * sr;
        for (let i = 0; i < cnt; i++) {
          const p = base + i * ratio; if (p < 0) continue; const k = Math.floor(p), f = p - k, g = env(made + i); if (k >= a.length) continue; const k2 = Math.min(a.length - 1, k + 1);
          let x = a[k] * (1 - f) + a[k2] * f, y = b[k] * (1 - f) + b[k2] * f; if (pitchFix) { x = pitchFix[0].push(x); y = pitchFix[1].push(y); } L[i] = x * g; R[i] = y * g;
        }
        made += cnt; yield [L, R]; if (made >= need) break;
      }
    }
    /* 소리가 모자라면 무음으로 채움 (뒤 클립과 어긋나지 않게) */
    while (made < need) { const n = Math.min(need - made, SR); yield [new Float32Array(n), new Float32Array(n)]; made += n; }
  }
  /* 차례로 내놓는 소리를 원하는 길이씩 꺼내는 도구 */
  class Puller {
    constructor(gen) { this.gen = gen; this.buf = null; this.pos = 0; this.done = false; }
    async read(n, L, R, at, gain) {
      let filled = 0;
      while (filled < n) {
        if (!this.buf || this.pos >= this.buf[0].length) { if (this.done) return filled; const x = await this.gen.next(); if (x.done) { this.done = true; return filled; } this.buf = x.value; this.pos = 0; }
        const take = Math.min(n - filled, this.buf[0].length - this.pos), a = this.buf[0], b = this.buf[1];
        for (let i = 0; i < take; i++) { L[at + filled + i] += a[this.pos + i] * (gain == null ? 1 : gain); R[at + filled + i] += b[this.pos + i] * (gain == null ? 1 : gain); }
        this.pos += take; filled += take;
      }
      return filled;
    }
  }
  async function* mainAudio(MB) { for (const c of VE.p.clips) { const m = VE.media(c.mid); if (m.kind === 'image') { const n = Math.round(VE.clipLen(c) * SR); let left = n; while (left > 0) { const k = Math.min(left, SR); yield [new Float32Array(k), new Float32Array(k)]; left -= k; } continue; } yield* clipAudio(MB, c, c.speed || 1); } }

  VE.exportSupport = async (fmt, w, h) => {
    const MB = await VE.mb(); const vcodecs = fmt === 'webm' ? ['vp9', 'vp8', 'av1'] : ['avc', 'hevc', 'av1', 'vp9'], acodecs = fmt === 'webm' ? ['opus'] : ['aac', 'opus'];
    const v = await MB.getFirstEncodableVideoCodec(vcodecs, { width: w, height: h }).catch(() => null), a = await MB.getFirstEncodableAudioCodec(acodecs, { numberOfChannels: 2, sampleRate: SR }).catch(() => null);
    return { v, a };
  };

  /* opts: { short, fmt, quality, fps, captions, fileHandle, onProg, signal } → { blob | saved, name, codec } */
  VE.exportVideo = async (opts) => {
    const MB = await VE.mb(); const total = VE.total(); if (total <= 0) throw new Error('타임라인이 비어 있습니다');
    const [W, H] = VE.frameSize(opts.short), fps = opts.fps || VE.p.fps || 30, nFrames = Math.ceil(total * fps), sig = opts.signal;
    const { v: vc, a: ac } = await VE.exportSupport(opts.fmt, W, H); if (!vc) throw new Error('이 브라우저는 영상 만들기(WebCodecs)를 지원하지 않습니다. PC 의 크롬이나 엣지에서 해 주세요.');
    for (const c of VE.p.clips) { const m = VE.media(c.mid); if (m.offline) throw new Error(`${m.name}: 원본 파일을 다시 연결해 주세요`); if (m.noDecode) throw new Error(`${m.name}: 이 브라우저가 풀 수 없는 영상 형식입니다`); }
    /* 얼굴 분석이 남아 있으면 먼저 */
    if (VE.needFaceJobs().length) await VE.runFaceJobs(p => opts.onProg && opts.onProg({ stage: '얼굴 위치 찾는 중', ratio: p.ratio, eta: p.eta }), sig);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d', { alpha: false, desynchronized: false, willReadFrequently: false });
    const target = opts.writable ? new MB.StreamTarget(opts.writable, { chunked: true }) : new MB.BufferTarget();
    const format = opts.fmt === 'webm' ? new MB.WebMOutputFormat() : new MB.Mp4OutputFormat(opts.writable ? { fastStart: false } : { fastStart: 'in-memory' });
    const output = new MB.Output({ format, target });
    const q = { low: MB.QUALITY_MEDIUM, mid: MB.QUALITY_HIGH, high: MB.QUALITY_VERY_HIGH }[opts.quality || 'mid'] || MB.QUALITY_HIGH;
    const vs = new MB.CanvasSource(cv, { codec: vc, bitrate: q, keyFrameInterval: 2 }); output.addVideoTrack(vs, { frameRate: fps });
    let as = null; if (ac) { as = new MB.AudioBufferSource({ codec: ac, bitrate: MB.QUALITY_HIGH }); output.addAudioTrack(as); }
    await output.start();

    /* 소리 준비 */
    const dsp = new VoiceDSP(SR, 2); dsp.set(VE.p.voice); const lat = dsp.active ? dsp.latency : 0;
    const main = new Puller(mainAudio(MB)); const totalS = Math.round(total * SR); let audioOut = 0, skip = lat;
    const music = VE.p.music.map(o => ({ o, start: Math.round(o.start * SR), end: Math.round((o.start + o.out - o.in) * SR), puller: null }));
    const BLOCK = 4800;
    const feedAudio = async (upto) => {
      if (!as) return; upto = Math.min(totalS, Math.round(upto * SR));
      while (audioOut < upto) {
        const n = Math.min(BLOCK, totalS - audioOut), L = new Float32Array(n), R = new Float32Array(n);
        /* 음성: 처리 지연만큼 더 읽어 맞춤 */
        if (skip > 0) { const sk = Math.min(skip, BLOCK), a = new Float32Array(sk), b = new Float32Array(sk); await main.read(sk, a, b, 0); dsp.process([a, b], [a, b], sk); skip -= sk; continue; }
        await main.read(n, L, R, 0); dsp.process([L, R], [L, R], n);
        for (const mu of music) {
          if (audioOut + n <= mu.start || audioOut >= mu.end || mu.o.mid == null) continue;
          if (!mu.puller) mu.puller = new Puller(clipAudio(MB, mu.o, 1));
          const from = Math.max(audioOut, mu.start), to = Math.min(audioOut + n, mu.end); await mu.puller.read(to - from, L, R, from - audioOut);
        }
        const ab = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: SR }); ab.copyToChannel(L, 0); ab.copyToChannel(R, 1);
        await as.add(ab); audioOut += n;
      }
    };

    /* 영상 */
    const { starts } = VE.layout(); let frame = 0; const t0 = performance.now(); let lastUi = 0;
    const report = () => { const now = performance.now(); if (now - lastUi < 120) return; lastUi = now; const done = frame / nFrames, spent = (now - t0) / 1000; opts.onProg && opts.onProg({ stage: '영상 만드는 중', ratio: done, eta: done > .01 ? spent / done * (1 - done) : null, speed: spent > 0 ? (frame / fps) / spent : 0 }); };
    const check = () => { if (sig && sig.aborted) throw new DOMException('그만둠', 'AbortError'); };
    try {
      for (let ci = 0; ci < VE.p.clips.length; ci++) {
        const c = VE.p.clips[ci], m = VE.media(c.mid), r = VE.rt.get(c.mid), a = starts[ci], b = a + VE.clipLen(c), sp = c.speed || 1;
        const idx = []; for (let f = frame; f < nFrames && f / fps < b - 1e-9; f++) idx.push(f); if (!idx.length) continue;
        const srcOf = f => clamp(c.in + (f / fps - a) * sp, c.in, c.out);
        const drawOne = async (f, framePic, fw, fh, pipInfo) => {
          VE.drawFrame(ctx, W, H, { t: f / fps, clip: c, media: m, src: srcOf(f), frame: framePic, fw, fh, pip: pipInfo, noCaption: !opts.captions });
          await vs.add(f / fps, 1 / fps); frame = f + 1; await feedAudio((f + 1) / fps + .4); report(); check();
        };
        /* 화면 속 화면 영상 */
        let pipIter = null, pipTrack = null;
        if (c.pip) {
          await VE.openInput(c.pip.mid); const pr = VE.rt.get(c.pip.mid); pipTrack = pr.vTrack;
          if (pipTrack) { const first = await pipTrack.getFirstTimestamp().catch(() => 0); const sink = new MB.VideoSampleSink(pipTrack), pm = VE.media(c.pip.mid); pipIter = sink.samplesAtTimestamps(idx.map(f => clamp(srcOf(f) + (c.pip.off || 0), first, pm.dur)))[Symbol.asyncIterator](); }
        }
        const nextPip = async (f) => { if (!pipIter) return null; const x = await pipIter.next(); const s = x.done ? null : x.value; if (!s) return null; return { frame: s, fw: s.displayWidth, fh: s.displayHeight, src: srcOf(f) + (c.pip.off || 0) }; };
        if (m.kind === 'image') {
          const bm = await createImageBitmap(r.blob);
          for (const f of idx) { const pi = await nextPip(f); await drawOne(f, bm, bm.width, bm.height, pi); if (pi) pi.frame.close(); } bm.close();
        } else {
          await VE.openInput(c.mid); if (!r.vTrack) throw new Error(`${m.name}: 영상 트랙을 찾지 못했습니다`);
          const first = await r.vTrack.getFirstTimestamp().catch(() => 0), sink = new MB.VideoSampleSink(r.vTrack); let k = 0, hold = null;
          for await (const s of sink.samplesAtTimestamps(idx.map(f => Math.max(first, srcOf(f))))) {
            const f = idx[k++]; const pi = await nextPip(f);
            if (s) { if (hold) hold.close(); hold = s; }
            if (hold) await drawOne(f, hold, hold.displayWidth, hold.displayHeight, pi); else await drawOne(f, null, 0, 0, pi);
            if (pi) pi.frame.close();
          }
          if (hold) hold.close();
        }
        if (pipIter && pipIter.return) await pipIter.return();
      }
      vs.close(); await feedAudio(total + 1); if (as) as.close();
      opts.onProg && opts.onProg({ stage: '파일 마무리', ratio: 1 });
      await output.finalize();
    } catch (e) { try { await output.cancel(); } catch (x) { } throw e; }
    const ext = format.fileExtension || (opts.fmt === 'webm' ? '.webm' : '.mp4'), name = VE.safeName(VE.p.name) + ext;
    if (opts.writable) return { saved: true, name, codec: vc, audio: ac, W, H };
    return { blob: new Blob([target.buffer], { type: format.mimeType || 'video/mp4' }), name, codec: vc, audio: ac, W, H };
  };
})();
