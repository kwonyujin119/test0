/* 영상 작업장 — 기기 사이 연결 (GitHub 비공개 저장소)
   - 얼굴이 나오는 영상이라 공개 저장소에는 올리지 않는다. 비공개 저장소가 아니면 쓰지 않는다
   - 토큰은 업무 공간의 [GitHub 연결] 에서 이 기기에 넣어 둔 것을 함께 쓴다 (사이트에 넣어 두지 않음)
   - 저장소 안: projects/index.json(목록) · projects/<id>.json(편집 내용) · media/<id>.json + media/<id>/part-0000…(20MB 조각) · dub/<열쇠>.bin(AI 목소리)
   - 저장하면 잠시 뒤 올리고, 열 때 다른 기기에서 고친 것이 있으면 받는다. 두 기기에서 함께 고쳤으면 묻는다 */
'use strict';
(() => {
  const PART = 20 * 1024 * 1024;
  const S = VE.sync = { state: 'off', msg: '', ratio: null, branch: 'main', size: 0 };
  const CFG = 've:sync', ST = 've:syncState';
  const readLS = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } };
  const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  S.cfg = () => {
    const c = readLS(CFG, {}); let gh = null; try { gh = typeof GH !== 'undefined' ? (GH.cfg || GH.load()) : null; } catch (e) { }
    return { on: !!c.on, owner: c.owner || (gh && gh.owner) || 'kwonyujin119', repo: c.repo || 'test0-video', token: (gh && gh.token) || '' };
  };
  S.setCfg = o => writeLS(CFG, { ...readLS(CFG, {}), ...o });
  const st = () => readLS(ST, { p: {}, media: {}, dub: {} });
  const setSt = fn => { const s = st(); s.p = s.p || {}; s.media = s.media || {}; s.dub = s.dub || {}; fn(s); writeLS(ST, s); };
  const set = (state, msg, ratio) => { S.state = state; S.msg = msg || ''; S.ratio = ratio == null ? null : ratio; VE.emit('sync'); };
  S.device = () => /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ? '휴대폰' : 'PC';

  /* ---------- GitHub API ---------- */
  async function api(method, path, body, raw) {
    const c = S.cfg();
    if (!c.token) { const e = new Error('이 기기에 GitHub 토큰이 없습니다. 업무 공간 첫 화면의 [GitHub 연결] 에서 먼저 연결해 주세요.'); e.noToken = true; throw e; }
    const h = { Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: 'Bearer ' + c.token };
    if (body) h['Content-Type'] = 'application/json';
    const r = await fetch(`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    if (r.status === 404 && method === 'GET') return null;
    if (!r.ok) {
      let msg = r.status + ' ' + r.statusText; try { const j = await r.json(); if (j.message) msg = j.message; } catch (e) { }
      if (r.status === 401) msg = 'GitHub 토큰이 올바르지 않거나 만료되었습니다. 업무 공간 첫 화면의 [GitHub 연결] 에서 새 토큰을 넣어 주세요.';
      else if (r.status === 403 && /rate limit/i.test(msg)) msg = 'GitHub 요청 한도를 넘었습니다. 잠시 뒤에 다시 해 주세요.';
      else if (r.status === 403) msg = '토큰에 이 저장소에 쓸 권한이 없습니다 (Contents: Read and write).';
      const e = new Error(msg); e.status = r.status; throw e;
    }
    if (r.status === 204) return null;
    return raw ? r.arrayBuffer() : r.json();
  }
  const readRaw = (path, ref) => api('GET', `/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref || S.branch)}`, null, true);
  const readJSON = async (path, ref) => { const b = await readRaw(path, ref); return b ? JSON.parse(new TextDecoder().decode(b)) : null; };
  const b64 = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.onerror = () => rej(fr.error); fr.readAsDataURL(blob); });
  const putBlob = async blob => (await api('POST', '/git/blobs', { content: await b64(blob), encoding: 'base64' })).sha;
  /* 여러 파일을 한 커밋으로. changesFn(head) 는 시도할 때마다 최신 상태로 다시 만든다 (목록을 덮어쓰지 않게) */
  async function commit(message, changesFn) {
    for (let i = 0; i < 4; i++) {
      const ref = await api('GET', `/git/ref/heads/${encodeURIComponent(S.branch)}`); if (!ref) throw new Error(`저장소에 ${S.branch} 가지가 없습니다`);
      const head = ref.object.sha, parent = await api('GET', `/git/commits/${head}`), changes = await changesFn(head);
      const tree = changes.map(c => c.delete ? { path: c.path, mode: '100644', type: 'blob', sha: null } : c.sha ? { path: c.path, mode: '100644', type: 'blob', sha: c.sha } : { path: c.path, mode: '100644', type: 'blob', content: c.content });
      const nt = await api('POST', '/git/trees', { base_tree: parent.tree.sha, tree }), nc = await api('POST', '/git/commits', { message, tree: nt.sha, parents: [head] });
      try { await api('PATCH', `/git/refs/heads/${encodeURIComponent(S.branch)}`, { sha: nc.sha }); return nc; } catch (e) { if (e.status !== 422 && e.status !== 409) throw e; }
    }
    throw new Error('저장이 다른 기기와 계속 엇갈립니다. 잠시 뒤에 다시 해 주세요.');
  }

  /* ---------- 연결 확인 ---------- */
  S.check = async () => {
    const repo = await api('GET', '');
    if (!repo) { const e = new Error('저장소를 찾지 못했습니다. 저장소를 만들었는지, 토큰에 그 저장소 권한을 줬는지 확인해 주세요.'); e.noRepo = true; throw e; }
    if (!repo.private) throw new Error('공개 저장소입니다. 얼굴이 나오는 영상이 누구에게나 보이므로 비공개 저장소만 씁니다.');
    if (repo.permissions && !repo.permissions.push) throw new Error('토큰에 이 저장소에 쓸 권한이 없습니다 (Contents: Read and write).');
    S.branch = repo.default_branch || 'main'; S.size = (repo.size || 0) * 1024;
    let ref = null; try { ref = await api('GET', `/git/ref/heads/${encodeURIComponent(S.branch)}`); } catch (e) { if (e.status !== 409) throw e; }
    if (!ref) await api('PUT', '/contents/README.md', { message: '영상 작업장 저장소 시작', content: btoa(unescape(encodeURIComponent('# 영상 작업장 (비공개)\n\n휴대폰과 PC 가 영상 프로젝트를 함께 쓰는 저장소입니다. 직접 고치지 마세요.\n'))) });
    S.ok = true; return { private: true, size: S.size, branch: S.branch };
  };
  S.ready = async () => { if (!S.cfg().on) return false; if (!S.ok) await S.check(); return true; };

  /* ---------- 올리기 ---------- */
  const clean = p => { const q = JSON.parse(JSON.stringify(p)); for (const m of q.media || []) { delete m.offline; delete m.unsaved; delete m._dubLoading; } return q; };
  let chain = Promise.resolve(), timer = 0;
  const queue = fn => (chain = chain.then(fn, fn));
  /* 저장 뒤 잠시 기다렸다 올림 (여러 번 저장해도 한 번에) */
  S.soon = () => { if (!S.cfg().on) return; clearTimeout(timer); timer = setTimeout(() => S.push(VE.p).catch(() => { }), 4000); };
  S.push = (p, opts) => queue(async () => {
    opts = opts || {};
    try {
      if (!(await S.ready())) return;
      p = clean(p); const s0 = st();
      /* 다른 기기에서 그 사이 고쳤는지 */
      const idx0 = (await readJSON('projects/index.json')) || { projects: {} }, remote = idx0.projects[p.id], base = s0.p[p.id] && s0.p[p.id].rev;
      if (!opts.force && remote && remote.updated > (base || 0) && remote.updated !== p.updated) { set('conflict', `다른 기기(${remote.device || '?'})에서 고친 내용이 있습니다`); VE.emit('syncConflict', { p, remote }); return; }
      const changes = []; let total = 0, done = 0;
      const todo = []; for (const m of p.media) { if (s0.media[m.id] && s0.media[m.id].done) continue; const blob = await VE.idb.get('blobs', m.id).catch(() => null); if (blob) { todo.push([m, blob]); total += blob.size; } }
      for (const [m, blob] of todo) {
        if (await readJSON(`media/${m.id}.json`)) { setSt(s => { s.media[m.id] = { done: true }; }); continue; }
        const rec = (st().media[m.id]) || { parts: [] }, n = Math.max(1, Math.ceil(blob.size / PART)), parts = [];
        for (let i = 0; i < n; i++) {
          if (!rec.parts[i]) { set('busy', `${m.name} 올리는 중`, total ? done / total : null); rec.parts[i] = await putBlob(blob.slice(i * PART, (i + 1) * PART)); setSt(s => { s.media[m.id] = { parts: rec.parts.slice() }; }); }
          parts.push(rec.parts[i]); done += Math.min(PART, blob.size - i * PART); set('busy', `${m.name} 올리는 중`, total ? done / total : null);
        }
        parts.forEach((sha, i) => changes.push({ path: `media/${m.id}/part-${String(i).padStart(4, '0')}`, sha }));
        changes.push({ path: `media/${m.id}.json`, content: JSON.stringify({ id: m.id, name: m.name, type: blob.type || '', size: blob.size, parts }) });
      }
      /* AI 목소리 저장분 */
      const dubs = []; for (const m of p.media) if (m.dub && m.dub.segs) for (const sg of m.dub.segs) { if (s0.dub[sg.k]) continue; const v = await VE.idb.get('cache', sg.k).catch(() => null); if (v) { changes.push({ path: `dub/${sg.k}.bin`, sha: await putBlob(new Blob([v])) }); dubs.push(sg.k); } }
      set('busy', '편집 내용 올리는 중', null);
      const json = JSON.stringify(p), info = { name: p.name, updated: p.updated, device: S.device(), media: p.media.length };
      await commit(`영상 저장: ${p.name} (${S.device()})`, async head => { const idx = (await readJSON('projects/index.json', head)) || { projects: {} }; idx.projects[p.id] = info; return [...changes, { path: `projects/${p.id}.json`, content: json }, { path: 'projects/index.json', content: JSON.stringify(idx, null, 1) }]; });
      setSt(s => { s.p[p.id] = { rev: p.updated }; for (const [m] of todo) s.media[m.id] = { done: true }; for (const k of dubs) s.dub[k] = 1; });
      set('ok', '다른 기기와 연결됨');
    } catch (e) { console.warn('연결 실패', e); set('error', e.message || String(e)); throw e; }
  });

  /* ---------- 받기 ---------- */
  S.list = async () => { if (!(await S.ready())) return {}; return ((await readJSON('projects/index.json')) || { projects: {} }).projects; };
  S.pull = async (id) => { await S.ready(); const p = await readJSON(`projects/${id}.json`); if (!p) throw new Error('저장소에서 프로젝트를 찾지 못했습니다'); await VE.idb.put('projects', p.id, p); setSt(s => { s.p[p.id] = { rev: p.updated }; }); return p; };
  /* 이 기기에 없는 영상 파일 · AI 목소리를 받아 붙임 (열린 프로젝트에) */
  S.fetchMissing = async () => {
    if (!(await S.ready())) return 0; let got = 0; const need = VE.p.media.filter(m => m.offline);
    for (const m of need) {
      const meta = await readJSON(`media/${m.id}.json`); if (!meta) continue; const bufs = [];
      for (let i = 0; i < meta.parts.length; i++) { set('busy', `${m.name} 받는 중`, i / meta.parts.length); bufs.push(await api('GET', `/git/blobs/${meta.parts[i]}`, null, true)); }
      const file = new File(bufs, meta.name || m.name, { type: meta.type || '' }); await VE.relink(m.id, file); setSt(s => { s.media[m.id] = { done: true }; }); got++;
    }
    for (const m of VE.p.media) if (m.dub && m.dub.segs) for (const sg of m.dub.segs) { if (await VE.idb.get('cache', sg.k).catch(() => null)) continue; const b = await readRaw(`dub/${sg.k}.bin`); if (b) { await VE.idb.put('cache', sg.k, b); setSt(s => { s.dub[sg.k] = 1; }); } }
    if (VE.dub) await VE.dub.loadAll();
    set('ok', '다른 기기와 연결됨'); return got;
  };
  /* 열린 프로젝트가 다른 기기에서 더 최근에 고쳐졌으면 받음 (이 기기에서 그 뒤로 고친 게 없을 때만) */
  S.refreshOpen = async () => {
    if (!S.cfg().on) return; try {
      const list = await S.list(), r = list[VE.p.id], base = (st().p[VE.p.id] || {}).rev || 0;
      if (r && r.updated > (VE.p.updated || 0)) {
        if ((VE.p.updated || 0) <= base) { const p = await S.pull(VE.p.id); await VE.loadProject(p); toast(`${r.device || '다른 기기'}에서 고친 내용을 받았습니다`, 2600); }
        else VE.emit('syncConflict', { p: VE.p, remote: r });
      }
      if (VE.p.media.some(m => m.offline)) await S.fetchMissing();
      if (S.state !== 'error' && S.state !== 'conflict') set('ok', '다른 기기와 연결됨');
    } catch (e) { console.warn(e); set('error', e.message || String(e)); }
  };
  /* 프로젝트 지우기 (저장소의 목록과 편집 내용에서. 올린 영상 조각은 저장소 기록에 남음) */
  S.remove = (id) => queue(async () => { if (!(await S.ready())) return; await commit('영상 프로젝트 지움', async head => { const idx = (await readJSON('projects/index.json', head)) || { projects: {} }; const had = !!idx.projects[id]; delete idx.projects[id]; return had ? [{ path: `projects/${id}.json`, delete: true }, { path: 'projects/index.json', content: JSON.stringify(idx, null, 1) }] : [{ path: 'projects/index.json', content: JSON.stringify(idx, null, 1) }]; }); setSt(s => { delete s.p[id]; }); });
  S.init = () => { if (S.cfg().on) set('idle', '연결 확인 중'); else set('off', '이 기기에만 저장'); };
})();
