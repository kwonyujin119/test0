/* 영상 작업장 — 음성 처리. 미리듣기(오디오 워클릿)와 내보내기(본 스레드)가 같은 코드를 쓴다
   순서: 저음 잡음 거르기 → 잡음 줄이기(주파수별 잡음 바닥 추정) → 음높이 바꾸기 → 로봇 → 음량 맞추기 → 넘침 막기
   특정 인물의 목소리를 흉내 내는 기능은 넣지 않는다 (음높이·음색 효과만) */
'use strict';
(() => {
  const FFT_N = 1024, HOP = 256;
  /* 복소수 FFT (제자리 계산) */
  class FFT {
    constructor(n) {
      this.n = n; this.cos = new Float32Array(n / 2); this.sin = new Float32Array(n / 2);
      for (let i = 0; i < n / 2; i++) { this.cos[i] = Math.cos(2 * Math.PI * i / n); this.sin[i] = Math.sin(2 * Math.PI * i / n); }
      this.rev = new Uint32Array(n); const bits = Math.log2(n);
      for (let i = 0; i < n; i++) { let r = 0; for (let b = 0; b < bits; b++) if (i & (1 << b)) r |= 1 << (bits - 1 - b); this.rev[i] = r; }
    }
    run(re, im, inv) {
      const n = this.n, rev = this.rev;
      for (let i = 0; i < n; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
      for (let s = 2; s <= n; s <<= 1) {
        const h = s >> 1, st = n / s;
        for (let i = 0; i < n; i += s) for (let j = 0, k = 0; j < h; j++, k += st) {
          const c = this.cos[k], d = inv ? this.sin[k] : -this.sin[k], a = i + j, b = a + h, xr = re[b] * c - im[b] * d, xi = re[b] * d + im[b] * c;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        }
      }
      if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
    }
  }
  /* 잡음 줄이기: 칸마다 소리 세기의 낮은 쪽을 따라가 잡음 바닥으로 삼고, 그만큼 덜어 냄 */
  class Denoiser {
    constructor(sr) {
      this.fft = new FFT(FFT_N); this.win = new Float32Array(FFT_N); for (let i = 0; i < FFT_N; i++) this.win[i] = Math.sin(Math.PI * (i + .5) / FFT_N);
      this.inBuf = new Float32Array(FFT_N); this.outBuf = new Float32Array(FFT_N); this.re = new Float32Array(FFT_N); this.im = new Float32Array(FFT_N);
      const b = FFT_N / 2 + 1; this.P = new Float32Array(b); this.N = new Float32Array(b); this.G = new Float32Array(b).fill(1); this.first = true; this.fill = 0; this.amount = .7;
      this.up = Math.pow(2, HOP / sr / 2.5); /* 잡음 바닥이 2.5초에 두 배까지만 오름 (말소리를 잡음으로 착각하지 않게) */
      this.out = new Float32Array(HOP); this.outN = 0; this.rd = 0;
    }
    frame() {
      const { re, im, inBuf, win, P, N, G } = this, n = FFT_N, b = n / 2 + 1, amt = this.amount;
      for (let i = 0; i < n; i++) { re[i] = inBuf[i] * win[i]; im[i] = 0; }
      this.fft.run(re, im, false);
      const beta = 1.6 + 2.2 * amt, floor = 1 - .88 * amt;
      for (let k = 0; k < b; k++) {
        const pw = re[k] * re[k] + im[k] * im[k];
        P[k] = this.first ? pw : P[k] * .75 + pw * .25;
        N[k] = this.first ? P[k] : Math.min(N[k] * this.up, Math.max(P[k], 1e-12));
        let g = 1 - beta * N[k] / Math.max(P[k], 1e-12); if (g < floor) g = floor;
        G[k] = g > G[k] ? G[k] * .4 + g * .6 : G[k] * .82 + g * .18;
      }
      this.first = false;
      for (let k = 0; k < b; k++) { const g = G[k]; re[k] *= g; im[k] *= g; if (k > 0 && k < n / 2) { re[n - k] = re[k]; im[n - k] = -im[k]; } }
      this.fft.run(re, im, true);
      /* 사인 창 두 번 + 75% 겹침 → 합이 2 */
      for (let i = 0; i < n; i++) this.outBuf[i] += re[i] * win[i] * .5;
    }
    /* 한 표본 넣고 한 표본 꺼냄 (지연 FFT_N) */
    push(x) {
      this.inBuf[this.fill++] = x;
      if (this.fill === FFT_N) {
        this.frame();
        for (let i = 0; i < HOP; i++) this.out[i] = this.outBuf[i];
        this.outBuf.copyWithin(0, HOP); this.outBuf.fill(0, FFT_N - HOP);
        this.inBuf.copyWithin(0, HOP); this.fill = FFT_N - HOP;
        this.outN = HOP; this.rd = 0;
      }
      return this.outN > 0 ? (this.outN--, this.out[this.rd++]) : 0;
    }
  }
  /* 음높이 바꾸기: 지연선 두 갈래를 교차해 읽음 (실시간 가능) */
  class Shifter {
    constructor(sr) { this.size = Math.round(sr * .08) & ~1; this.L = this.size * 2 + 8; this.buf = new Float32Array(this.L); this.w = 0; this.ph = 0; this.ratio = 1; }
    tap(ph) { const L = this.L; let p = this.w - ph * this.size - 2; while (p < 0) p += L; const i = Math.floor(p), f = p - i; return this.buf[i % L] * (1 - f) + this.buf[(i + 1) % L] * f; }
    push(x) {
      if (this.ratio === 1) return x;
      this.buf[this.w] = x;
      const p1 = this.ph, p2 = (this.ph + .5) % 1, e1 = Math.sin(Math.PI * p1), e2 = Math.sin(Math.PI * p2);
      const out = this.tap(p1) * e1 * e1 + this.tap(p2) * e2 * e2;
      this.ph += (1 - this.ratio) / this.size; if (this.ph >= 1) this.ph -= 1; if (this.ph < 0) this.ph += 1;
      this.w = (this.w + 1) % this.L; return out;
    }
  }
  class VoiceDSP {
    constructor(sr, channels) {
      this.sr = sr; this.ch = channels || 2; this.dn = []; this.sh = []; this.hp = [];
      for (let i = 0; i < this.ch; i++) { this.dn.push(new Denoiser(sr)); this.sh.push(new Shifter(sr)); this.hp.push({ x1: 0, y1: 0 }); }
      this.env = 0; this.atk = Math.exp(-1 / (sr * .004)); this.rel = Math.exp(-1 / (sr * .14)); this.ringPh = 0; this.ringF = 2 * Math.PI * 62 / sr;
      this.hpA = Math.exp(-2 * Math.PI * 80 / sr); this.p = { clean: false, denoise: 0, level: false, ratio: 1, robot: false };
    }
    set(v) { /* {clean,denoise,level,preset,pitch} */
      const pr = VoiceDSP.PRESETS[v.preset] || VoiceDSP.PRESETS.none, semi = (pr.semi || 0) + (+v.pitch || 0);
      this.p = { clean: !!v.clean, denoise: v.clean ? +v.denoise : 0, level: !!(v.clean && v.level), ratio: Math.pow(2, semi / 12), robot: !!pr.robot };
      for (let i = 0; i < this.ch; i++) { this.sh[i].ratio = this.p.ratio; this.dn[i].amount = this.p.denoise; }
    }
    get latency() { return this.p.clean && this.p.denoise > 0 ? FFT_N : 0; }
    get active() { const p = this.p; return p.clean || p.ratio !== 1 || p.robot; }
    /* inp[채널][표본] → out[채널][표본], n 개 */
    process(inp, out, n) {
      const p = this.p, chs = this.ch;
      if (!this.active) { for (let c = 0; c < chs; c++) { const a = inp[c] || inp[0], b = out[c]; if (a !== b) b.set(a.subarray(0, n)); } return; }
      const thr = .1 /* -20dB */, ratioC = 1 / 3.2, makeup = p.level ? 2.4 : 1;
      for (let i = 0; i < n; i++) {
        let peak = 0;
        for (let c = 0; c < chs; c++) {
          let x = (inp[c] || inp[0])[i];
          if (p.clean) { const h = this.hp[c], y = this.hpA * (h.y1 + x - h.x1); h.x1 = x; h.y1 = y; x = y; if (p.denoise > 0) x = this.dn[c].push(x); }
          if (p.ratio !== 1) x = this.sh[c].push(x);
          if (p.robot) x = x * (.35 + .65 * Math.sin(this.ringPh));
          out[c][i] = x; const ax = Math.abs(x); if (ax > peak) peak = ax;
        }
        if (p.robot) { this.ringPh += this.ringF; if (this.ringPh > 6.2831853) this.ringPh -= 6.2831853; }
        let g = 1;
        if (p.level) {
          this.env = peak > this.env ? this.atk * this.env + (1 - this.atk) * peak : this.rel * this.env + (1 - this.rel) * peak;
          if (this.env > thr) g = Math.pow(this.env / thr, ratioC - 1);
          /* 말이 없을 때는 키우지 않아 잡음이 다시 올라오지 않게 함 */
          const open = this.env >= .03 ? 1 : this.env / .03; g *= 1 + (makeup - 1) * open;
        }
        for (let c = 0; c < chs; c++) { let y = out[c][i] * g; const a = Math.abs(y); if (a > .85) y = Math.sign(y) * (.85 + .13 * Math.tanh((a - .85) / .13)); out[c][i] = y; }
      }
    }
  }
  VoiceDSP.PRESETS = { none: { name: '원래 목소리' }, low: { name: '낮게', semi: -4 }, high: { name: '높게', semi: 4 }, toon: { name: '만화 캐릭터', semi: 8 }, giant: { name: '거인', semi: -8 }, robot: { name: '로봇', semi: -1, robot: true } };
  VoiceDSP.Shifter = Shifter; VoiceDSP.Denoiser = Denoiser;
  globalThis.VoiceDSP = VoiceDSP;
  /* 워클릿 안에서 불렸을 때 */
  if (typeof registerProcessor === 'function') {
    class VoiceNode extends AudioWorkletProcessor {
      constructor() { super(); this.d = new VoiceDSP(sampleRate, 2); this.port.onmessage = e => this.d.set(e.data); }
      process(inputs, outputs) {
        const i = inputs[0], o = outputs[0]; if (!o || !o.length) return true;
        if (!i || !i.length) { o.forEach(c => c.fill(0)); return true; }
        const a = [i[0], i[1] || i[0]], b = [o[0], o[1] || new Float32Array(o[0].length)];
        this.d.process(a, b, o[0].length); return true;
      }
    }
    registerProcessor('ve-voice', VoiceNode);
  }
})();
