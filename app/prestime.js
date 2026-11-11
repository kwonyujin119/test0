/* 발표 시간 관리 — 발표 화면 · 발표자 보기 · 편집기 [점검] 이 함께 씀
   - 목표 시간(분)과 지난 발표 기록(장별 시간)은 이 브라우저(localStorage)에만 저장합니다. 교안 파일은 바꾸지 않습니다.
   - 노트 첫 줄의 시간 표시를 계획으로 읽습니다: [1분] · (2분) · ⏱ 1분 · [오프닝 · 30초] = 이 장의 길이,
     [0:30] · [12:00 — …] = 이 장을 시작할 시각(발표 시작부터) */
'use strict';
const PresTime = {
  MAX_RUNS: 5,
  _get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
  _set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  /* 목표 시간(분). 0 = 정하지 않음 */
  target(name) { const v = +this._get('pres:target:' + name); return v > 0 ? v : 0; },
  setTarget(name, min) { min = Math.max(0, Math.min(600, Math.round(+min || 0))); if (min) this._set('pres:target:' + name, min); else try { localStorage.removeItem('pres:target:' + name); } catch (e) { } return min; },
  /* 지난 발표 기록: 최근 것이 앞. run = { id, at, total(초), slides: { 슬라이드id: 초 }, n(장 수) } */
  runs(name) { const r = this._get('pres:runs:' + name); return Array.isArray(r) ? r.filter(x => x && x.slides) : []; },
  last(name) { return this.runs(name)[0] || null; },
  saveRun(name, run) {
    const list = this.runs(name).filter(r => r.id !== run.id);
    list.unshift(run); this._set('pres:runs:' + name, list.slice(0, this.MAX_RUNS));
  },
  clearRuns(name) { try { localStorage.removeItem('pres:runs:' + name); } catch (e) { } },
  /* 노트 첫 줄에서 계획 시간 읽기 → { dur: 초|null, at: 초|null } */
  planOf(notes) {
    const line = String(notes || '').split('\n')[0].trim().slice(0, 60), r = { dur: null, at: null };
    if (!line) return r;
    const at = line.match(/^[\[(（]\s*(\d{1,3}):(\d{2})\b/);
    if (at) { r.at = (+at[1]) * 60 + (+at[2]); return r; }
    const head = line.match(/^(?:⏱️?\s*[^\s].{0,20}|[\[(（][^\])）]{0,40}[\])）])/);
    if (!head || /PART|파트|전체|총\s|\d\s*부\b/i.test(head[0])) return r; // [PART 1 · 약 15분] 같은 묶음 시간은 이 장의 길이가 아님
    const m = head[0].match(/(\d+(?:\.\d+)?)\s*분(?:\s*(\d+)\s*초)?|(\d+)\s*초/);
    if (m) r.dur = m[3] ? +m[3] : Math.round((+m[1]) * 60 + (+m[2] || 0));
    return r;
  },
  /* 교안 전체 계획: 보이는 슬라이드마다 { start: 시작 예정(초)|null, dur }, total = 계획한 전체 길이(초)|0 */
  plan(deck) {
    const out = {}, slides = deck.slides.filter(s => !s.hidden);
    const ps = slides.map(s => this.planOf(s.notes));
    const nAt = ps.filter(p => p.at != null).length, nDur = ps.filter(p => p.dur != null).length;
    let total = 0;
    if (nAt >= 2) { // 시작 시각을 적은 교안: 적힌 장만 비교
      slides.forEach((s, i) => { out[s.id] = { start: ps[i].at, dur: null }; });
    } else if (nDur >= Math.max(2, slides.length / 3)) { // 길이를 적은 교안: 앞 장 길이를 더해 시작 시각을 계산
      let acc = 0; slides.forEach((s, i) => { out[s.id] = { start: acc, dur: ps[i].dur }; acc += ps[i].dur || 0; }); total = acc;
    }
    return { by: out, total, kind: nAt >= 2 ? 'at' : total ? 'dur' : '' };
  },
  /* 지난 기록으로 본 "이 장을 시작했어야 할 시각" (보이는 순서대로 앞 장 시간의 합) */
  expectedStart(deck, run, slideId) {
    if (!run) return null; let acc = 0;
    for (const s of deck.slides) { if (s.id === slideId) return acc; if (!s.hidden && run.slides[s.id] != null) acc += run.slides[s.id]; }
    return null;
  },
  fmt(sec, signed) {
    const neg = sec < 0; sec = Math.round(Math.abs(sec));
    const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
    const t = (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(s).padStart(2, '0');
    return (signed ? (neg ? '−' : '+') : neg ? '−' : '') + t;
  },
  /* 남은 시간 상태: '' | 'warn'(얼마 안 남음) | 'over'(넘김) */
  level(remainSec, targetMin) { if (!targetMin) return ''; if (remainSec < 0) return 'over'; return remainSec <= Math.max(120, targetMin * 6) ? 'warn' : ''; },
};
