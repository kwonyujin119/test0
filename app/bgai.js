/* AI 배경 지우기 — 사진·사물의 배경을 브라우저 안에서 자동으로 분리합니다 (서버에 그림을 보내지 않음)
   · 모델: RMBG-1.4 (BRIA AI, 연구·비상업용 라이선스) — 처음 쓸 때 한 번 내려받아 브라우저에 보관(Cache API)
   · 실행: onnxruntime-web (CDN) 을 웹 워커 안에서 돌려 화면이 멈추지 않게 함
   · 그래픽 가속(WebGPU)이 되는 기기(PC 크롬·엣지, 최근 안드로이드 크롬)는 fp16 모델(88MB)로 1초 안팎,
     안 되는 기기는 양자화 모델(44MB)로 CPU 에서 돌려 수십 초가 걸릴 수 있음
   쓰는 곳: app/editor.js 의 배경 지우기 창 */
'use strict';
const BGAI = (() => {
  const ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
  /* fp16 판(88MB)은 일부 GPU(인텔 내장 등)에서 결과가 모두 0 으로 나와 쓰지 않음 → GPU 는 fp32 판, CPU 는 양자화 판 */
  const MODELS = {
    gpu: { url: 'https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model.onnx', mb: 176, ep: 'webgpu' },
    cpu: { url: 'https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model_quantized.onnx', mb: 44, ep: 'wasm' },
  };
  const N = 1024; // 모델 입력 크기 (고정)
  const CACHE = 'ws-models';
  const hasGpu = () => typeof navigator !== 'undefined' && !!navigator.gpu;
  let forceCpu = false; // GPU 계산이 이상하면(결과가 모두 0) CPU 판으로
  const pick = () => hasGpu() && !forceCpu ? MODELS.gpu : MODELS.cpu;

  /* 모델 파일: 보관해 둔 것이 있으면 그것, 없으면 내려받으며 진행률 알림 → ArrayBuffer */
  async function modelBytes(m, onProgress) {
    let cache = null; try { cache = await caches.open(CACHE); } catch (e) { }
    if (cache) { const hit = await cache.match(m.url); if (hit) return hit.arrayBuffer(); }
    const r = await fetch(m.url); if (!r.ok) throw new Error('모델을 내려받지 못했습니다 (' + r.status + ')');
    const total = +r.headers.get('content-length') || m.mb * 1048576; const parts = []; let got = 0;
    const rd = r.body.getReader();
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; if (onProgress) onProgress(Math.min(0.99, got / total)); }
    const blob = new Blob(parts, { type: 'application/octet-stream' });
    if (cache) { try { await cache.put(m.url, new Response(blob, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(blob.size) } })); } catch (e) { } }
    return blob.arrayBuffer();
  }
  async function cached() { try { const c = await caches.open(CACHE); return !!(await c.match(pick().url)); } catch (e) { return false; } }
  async function forget() { try { await caches.delete(CACHE); } catch (e) { } }

  /* 워커: onnxruntime 을 불러와 모델을 올려 두고, 그림을 받으면 마스크(0~1)를 돌려줌 */
  const WORKER = `
    importScripts(${JSON.stringify(ORT + 'ort.webgpu.min.js')});
    ort.env.wasm.wasmPaths = ${JSON.stringify(ORT)};
    ort.env.wasm.numThreads = 1;
    let sess = null, ep = '';
    const N = ${N};
    self.onmessage = async (ev) => {
      const m = ev.data;
      try {
        if (m.type === 'init') {
          const eps = m.ep === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm'];
          let err = null;
          for (const e of eps) { try { sess = await ort.InferenceSession.create(m.buf, { executionProviders: [e] }); ep = e; break; } catch (x) { err = x; } }
          if (!sess) throw err || new Error('모델을 열지 못했습니다');
          self.postMessage({ type: 'ready', ep });
        } else if (m.type === 'run') {
          const W = m.w, H = m.h, bmp = await createImageBitmap(new ImageData(m.data, W, H));
          const c = new OffscreenCanvas(N, N), g = c.getContext('2d', { willReadFrequently: true });
          g.drawImage(bmp, 0, 0, N, N); bmp.close();
          const d = g.getImageData(0, 0, N, N).data, f = new Float32Array(3 * N * N), n = N * N;
          for (let i = 0; i < n; i++) { f[i] = d[i * 4] / 255 - 0.5; f[n + i] = d[i * 4 + 1] / 255 - 0.5; f[2 * n + i] = d[i * 4 + 2] / 255 - 0.5; }
          const out = await sess.run({ input: new ort.Tensor('float32', f, [1, 3, N, N]) });
          const o = out[Object.keys(out)[0]].data; let mn = Infinity, mx = -Infinity;
          for (let i = 0; i < n; i++) { const v = o[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
          if (!(mx > mn)) { self.postMessage({ type: 'flat' }); return; } // 계산이 잘못됨 (모두 같은 값)
          const k = 255 / (mx - mn), mk = new Uint8ClampedArray(n * 4);
          for (let i = 0; i < n; i++) { const v = (o[i] - mn) * k; mk[i * 4] = v; mk[i * 4 + 1] = v; mk[i * 4 + 2] = v; mk[i * 4 + 3] = 255; }
          // 마스크를 원래 크기로 (부드럽게 키움/줄임)
          const mb = await createImageBitmap(new ImageData(mk, N, N));
          const c2 = new OffscreenCanvas(W, H), g2 = c2.getContext('2d', { willReadFrequently: true });
          g2.imageSmoothingEnabled = true; g2.imageSmoothingQuality = 'high'; g2.drawImage(mb, 0, 0, W, H); mb.close();
          const md = g2.getImageData(0, 0, W, H).data, alpha = new Uint8ClampedArray(W * H);
          for (let i = 0; i < W * H; i++) alpha[i] = md[i * 4];
          self.postMessage({ type: 'done', alpha }, [alpha.buffer]);
        }
      } catch (e) { self.postMessage({ type: 'error', message: String(e && e.message || e) }); }
    };`;
  let worker = null, ready = null, epUsed = '';
  function spawn() {
    if (worker) return;
    worker = new Worker(URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' })));
  }
  /* 모델 준비 (내려받기 + 열기). onStatus(msg, frac) 로 진행 알림 */
  function prepare(onStatus) {
    if (ready) return ready;
    const m = pick(), say = (t, f) => { try { if (onStatus) onStatus(t, f); } catch (e) { } };
    ready = (async () => {
      if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') throw new Error('이 브라우저는 AI 배경 지우기를 지원하지 않습니다');
      say('AI 모델을 준비하는 중…', 0);
      const buf = await modelBytes(m, (f) => say(`AI 모델 내려받는 중 (${m.mb}MB · 한 번만) ${Math.round(f * 100)}%`, f));
      say('AI 모델을 여는 중…', 1);
      spawn();
      await new Promise((res, rej) => {
        const onMsg = (ev) => { const d = ev.data; if (d.type === 'ready') { epUsed = d.ep; worker.removeEventListener('message', onMsg); res(); } else if (d.type === 'error') { worker.removeEventListener('message', onMsg); rej(new Error(d.message)); } };
        worker.addEventListener('message', onMsg); worker.onerror = (e) => rej(new Error(e.message || 'AI 프로그램을 불러오지 못했습니다 — 인터넷 연결을 확인해 주세요'));
        worker.postMessage({ type: 'init', buf, ep: m.ep }, [buf]);
      });
      return epUsed;
    })();
    ready.catch(() => { ready = null; if (worker) { worker.terminate(); worker = null; } });
    return ready;
  }
  /* 그림(ImageData) → 투명도(0~255, W*H). 큰 그림은 호출하는 쪽에서 1400px 안팎으로 줄여서 줌 */
  let runs = 0;
  async function mask(imageData, onStatus) {
    await prepare(onStatus);
    if (onStatus) onStatus(epUsed === 'webgpu' ? (runs ? '배경을 분리하는 중…' : '배경을 분리하는 중… (처음 한 번은 그래픽 준비 때문에 1분 가까이 걸릴 수 있습니다)') : '배경을 분리하는 중… (그래픽 가속이 없는 기기라 1분쯤 걸릴 수 있습니다)', null);
    const r = await new Promise((res, rej) => {
      const onMsg = (ev) => { const d = ev.data; if (d.type === 'done' || d.type === 'flat') { worker.removeEventListener('message', onMsg); res(d); } else if (d.type === 'error') { worker.removeEventListener('message', onMsg); rej(new Error(d.message)); } };
      worker.addEventListener('message', onMsg);
      const data = new Uint8ClampedArray(imageData.data); // 복사본을 넘김 (원본은 그대로)
      worker.postMessage({ type: 'run', data, w: imageData.width, h: imageData.height }, [data.buffer]);
    });
    runs++;
    if (r.type === 'flat') { // GPU 계산이 잘못됨 → CPU 판으로 한 번 더
      if (epUsed === 'webgpu' && !forceCpu) { stop(); forceCpu = true; runs = 0; if (onStatus) onStatus('그래픽 가속 계산이 잘못되어 CPU 로 다시 합니다…', null); return mask(imageData, onStatus); }
      throw new Error('배경을 찾지 못했습니다');
    }
    return r.alpha;
  }
  function stop() { if (worker) { worker.terminate(); worker = null; } ready = null; epUsed = ''; }
  return { mask, prepare, cached, forget, stop, hasGpu, info: () => Object.assign({ ep: epUsed }, pick()) };
})();
