/* DOCUMENT — 업무 도구: 서식으로 새 문서 · 문서 점검(F8) · 명령 찾기(Ctrl+K) · 실적 기록장 · 개조식 기호 자동 이어 쓰기
   ui.js 가 window.__hwp 로 내준 함수와 edit.js 의 편집 함수(선택·되돌리기 기록)만 쓴다. 문서 저장 형식(hwpx)은 건드리지 않는다. */
(() => {
  const U = window.__hwp; if (!U) return;
  const { W, GUEST } = U;
  const doc = docEl();
  const escH = s => esc(s);
  const H = () => W.doc.header;
  const today = () => { const d = new Date(); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`; };
  const todayW = () => { const d = new Date(); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.(${'일월화수목금토'[d.getDay()]})`; };
  const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const blockText = b => textNodesOf(b).map(t => t.nodeValue).join('').replace(/[​﻿]/g, '');
  const editorOpen = () => !!W.doc && !(typeof HwpHome !== 'undefined' && HwpHome.visible);

  /* =====================================================================
     1. 개조식 기호: □ ○ - · (정부 보고서에서 가장 많이 쓰는 4단계)
     ===================================================================== */
  const SYM = ['□', '○', '-', '·'];
  const SYM_RE = /^([□○■◦●\-·∙ㅇ])\s/;
  const HEAD_RE = /^(\d{1,2})\.\s+(?=\S)/; // 손으로 친 큰 제목 '1. 추진 배경' (행안부 2026 보고서 예시의 방식)
  const isItem = t => SYM_RE.test(t) || HEAD_RE.test(t);
  // 단계별 문단 모양: 왼쪽 여백 + 내어쓰기(둘째 줄이 기호 뒤 글자에 맞춰지도록)
  const LV_PP = [{ left: 0, intent: -1700, prev: 900 }, { left: 1300, intent: -1700, prev: 300 }, { left: 2600, intent: -1100, prev: 150 }, { left: 3600, intent: -1100, prev: 0 }];
  const lvPp = (base, L) => H().derivePp(base || '0', Object.assign({ align: 'JUSTIFY' }, LV_PP[L]));
  const symLevel = c => ({ '□': 0, '■': 0, '○': 1, 'ㅇ': 1, '◦': 1, '●': 1, '-': 2, '·': 3, '∙': 3 })[c];

  /* =====================================================================
     2. 서식으로 새 문서
     줄 표기: '#' 제목 · '@' 오른쪽 정렬 줄(날짜·부서) · '>' 요지(굵게) · '□ ' '○ ' '- ' '· ' 개조식 ·
              '1.' '2.' 공문 항목(개요 1) · '가.' (개요 2) · '1)' (개요 3) · '=' 가운데 · '' 빈 줄 · 그 밖 바탕글
     〔 〕 는 채울 칸 — Alt+. 로 다음 칸, 점검(F8)에서 남은 칸을 알려 줌
     ===================================================================== */
  const T = {};
  // 2026. 8. 24. 행안부 'AI 친화적 보고서' 원칙: 큰 제목 1. 2. · 항목 ○ - · 문장은 주어와 서술어가 있게 · 표는 위에 < 제목 > · 표 안의 표 금지
  T.report = { name: '1쪽 보고서 (검토 보고)', icon: 'doc', tag: '보고', desc: '결재권자가 첫 줄만 읽어도 무엇을 결정할지 아는 두괄식 1쪽 보고서 (행안부 2026 보고서 원칙)', tips: ['첫 상자(보고 요지)에 <b>결론 · 건의</b>를 한두 문장으로 먼저 씁니다 (두괄식).', '○ 항목은 “개선 요구 지속”처럼 명사로 끊지 말고 “개선 요구가 계속 나오고 있음”처럼 <b>주어와 서술어</b>가 보이게 씁니다 (행안부 2026. 8. 24. 원칙).', '○ 뒤에 (현황) (문제점) 같은 <b>괄호 소제목</b>을 달면 훑어 읽기 쉽습니다.', '표는 위에 <b>&lt; 제목 &gt;</b>을 달고, 표 안에 표를 넣지 않습니다.', '자세한 근거 · 통계는 <b>붙임</b>으로 뺍니다.'],
    lines: ['#〔제목: 무엇을 하겠다는 것인지 한 줄〕', '=서면보고 / ' + todayW() + ' / 〔부서 · 보고자〕', '', '>보고 요지: 〔결론과 건의를 한두 문장으로 — 무엇을 승인 · 결정해 주시면 되는지〕', '1. 추진 배경', '○ (근거) 〔법령 · 지시 · 민원 등 왜 지금 필요한지를 문장으로 씀〕', '2. 현황 및 문제점', '○ (현황) 〔현재 상태를 숫자로 씀 — 예: ○○개 중 ○○개(○○%)가 기준에 못 미침〕', '- 〔세부 근거〕', '○ (문제점) 〔무엇이 왜 문제인지 원인까지 씀〕', '3. 검토 의견', '=< 대안 비교 >', '|구분|1안 〔이름〕|2안 〔이름〕|', '|비용|〔 〕|〔 〕|', '|효과|〔 〕|〔 〕|', '|기간 · 부담|〔 〕|〔 〕|', '○ (추천) 〔추천안과 그 이유〕', '4. 건의 사항', '○ 〔결재권자가 결정할 것: 승인 · 예산 · 인력〕', '5. 향후 계획', '○ 〔언제까지 무엇을 할 예정임〕', '', '붙임  〔관련 자료〕 1부.'] };
  T.plan = { name: '추진계획(안) — 시장 · 기관장 보고', icon: 'list', tag: '계획', desc: '배경 · 현황 · 추진 개요 · 단계별 계획 · 일정표 · 예산 · 효과 · 협조 사항을 갖춘 표준 계획서. 첫머리에 승인받을 것을 먼저', tips: ['<b>보고 요지</b>에 무엇을 · 언제까지 · 얼마로 · 무엇을 승인받는지 씁니다.', '현황은 표로, 표 위에 <b>&lt; 제목 &gt;</b>.', '효과는 <b>전 → 후 숫자</b>로: “기준 미달 ○○곳 → 0곳”.', '예산은 산출 근거(단가 × 수량)와 재원(국 · 시비)을 함께.', '다른 기관(상수도사업소 등)이 할 일은 <b>협조 사항</b>에 이름을 적어 둡니다.'],
    lines: ['#〔사업명〕 추진계획(안)', '=〔시장〕 보고 / ' + todayW() + ' / 〔부서 · 보고자〕', '', '>보고 요지: 〔무엇을 · 언제까지 · 얼마로 추진하려 하며, 무엇을 승인받고자 하는지〕', '1. 추진 배경', '○ (근거) 〔근거 법령 · 상위 계획 · 지시 사항〕', '○ (필요성) 〔지금 문제와 그로 인한 위험을 숫자로 씀〕', '2. 현황 및 문제점', '=< 〔현황표 제목〕 (〔기준일〕 기준) >', '|구분|〔항목〕|〔항목〕|비고|', '|〔 〕|〔 〕|〔 〕|〔 〕|', '○ (문제점) 〔원인까지 밝혀 씀〕', '3. 추진 개요', '○ (기간) 〔2026. 12. 1.~2027. 6. 30.〕', '○ (대상) 〔대상 · 수량〕', '○ (내용) 〔주요 내용〕', '○ (예산) 총 〔000〕천원 (〔국비 · 시비〕)', '4. 세부 추진 계획', '○ (1단계: 진단) 〔무엇을 · 누가 · 어떻게 함〕', '○ (2단계: 개선) 〔 〕', '○ (3단계: 확인 · 환류) 〔 〕', '=< 추진 일정 >', '|단계|내용|기간|담당|', '|1단계|〔 〕|〔 〕|〔 〕|', '|2단계|〔 〕|〔 〕|〔 〕|', '|3단계|〔 〕|〔 〕|〔 〕|', '5. 소요 예산', '○ 총 〔000〕천원 — 산출 근거: 〔단가 × 수량〕', '6. 기대 효과', '○ 〔전 → 후를 숫자로 씀 — 예: 기준 미달 ○○곳 → 0곳〕', '7. 협조 및 행정사항', '○ 〔협조 기관 · 역할 분담 · 다음 보고 시점〕', '', '붙임  〔세부 현황〕 1부.'] };
  T.result = { name: '결과 보고', icon: 'check', tag: '보고', desc: '행사 · 훈련 · 점검이 끝난 뒤 계획 대비 결과를 숫자로 보고', tips: ['계획 대비 실적(목표 → 결과)을 숫자로 비교합니다.', '잘된 점만 쓰지 말고 문제점과 개선 방안을 함께 씁니다.', '사진 · 명단은 붙임으로 뺍니다.'],
    lines: ['#〔행사 · 훈련명〕 결과 보고', '=서면보고 / ' + todayW() + ' / 〔부서 · 보고자〕', '', '>보고 요지: 〔계획 대비 결과 한 문장: 목표 00명 중 00명(000%) 참여, 주요 성과〕', '1. 개요', '○ (일시) 〔2026. 11. 11.(수) 14:00~16:00〕', '○ (장소) 〔장소〕', '○ (참석) 〔누가 · 몇 명〕', '2. 주요 결과', '=< 계획 대비 결과 >', '|구분|계획|결과|달성률|', '|〔 〕|〔 〕|〔 〕|〔 〕|', '○ 〔성과를 문장으로 씀〕', '3. 문제점 및 개선 방안', '○ (문제점) 〔 〕', '○ (개선) 〔 〕', '4. 향후 조치', '○ 〔후속 조치 · 다음 일정〕', '', '붙임  〔사진 · 참석자 명단〕 1부.'] };
  T.meeting = { name: '회의자료', icon: 'rows', tag: '회의', desc: '회의 목적, 안건, 논의할 쟁점, 결정이 필요한 사항을 정리한 회의자료', tips: ['회의에서 <b>결정해야 할 것</b>을 맨 앞에 둡니다.', '쟁점마다 선택지(가안 · 나안)와 부서 의견을 표로 나란히 씁니다.', '회의 뒤 바로 결과 보고로 바꿀 수 있게 결정 칸을 비워 둡니다.'],
    lines: ['#〔회의명〕 회의자료', '=' + todayW() + ' / 〔부서〕', '', '>결정 필요 사항: 〔이번 회의에서 정할 것〕', '1. 회의 개요', '○ (일시) 〔2026. 11. 11.(수) 10:00〕', '○ (장소) 〔회의실〕', '○ (참석) 〔참석 범위〕', '2. 안건', '○ 〔안건 1〕', '○ 〔안건 2〕', '3. 논의 사항', '=< 쟁점별 선택지 >', '|쟁점|가안|나안|부서 의견|', '|〔 〕|〔 〕|〔 〕|〔 〕|', '4. 결정 사항 (회의 뒤 적음)', '○ 〔결정 내용 · 담당 · 기한〕'] };
  // 보도자료: 2025년 공문서 평가(문체부 · 국립국어원)에서 우수 보도자료로 꼽힌 권익위 「“소방자동차 진로 방해, 이제는 그만!”」(2025. 10. 13.)의 짜임을 따름
  T.press = { name: '보도자료', icon: 'notes', tag: '홍보', desc: '보도 시점 · 제목 · 부제 · 첫 문단(결과) · 배경 · 내용 · 인용 · 담당자. 2025년 우수 보도자료(권익위)의 짜임', tips: ['첫 문단에 <b>주민에게 무엇이 달라지는지</b>를 먼저 씁니다 (우수 보도자료 첫 문장: “앞으로 소방차, 구급차 등이 적시에 현장에 도착할 수 있도록 … 기대된다.”).', '부제(- …)는 두 줄: 누가 무엇을 했는지 · 주요 내용.', '용어 풀이는 <b>*</b> 각주로, 통계는 <b>※</b> 로 문단 아래에 붙입니다.', '보도자료는 서술식(~했다)으로, 한 문단은 □ 하나에 한 가지 내용.', '외국어 · 외국 문자(AI, TF, R&amp;D)는 우리말로 바꾸거나 처음에 풀어 씁니다 — 공문서 평가의 “용이성” 지표.'],
    lines: ['@보도 시점: 〔2026. 11. 12.(목) 06:00〕 / 배포: ' + todayW(), '#〔제목: 주민에게 무엇이 달라지는지〕', '=〔부제: 핵심 숫자나 배경 한 줄〕', '- 〔누가 무엇을 했는지〕', '- 〔주요 내용 두세 가지〕', '', '□ 〔첫 문단: 앞으로 무엇이 달라지는지 · 기대 효과〕', '〔○○소방서(서장 ○○○)는 ○일 ○○을 했다고 밝혔다.〕', '□ 〔배경: 왜 필요했는지〕', '※ 〔근거 통계: 최근 5년(2021~2025년)간 ○○건 중 ○○건(○○%)〕', '□ 〔주요 내용 1〕', '* 〔어려운 용어 풀이〕', '□ 〔주요 내용 2〕', '□ 〔인용: ○○○ 서장은 “ … ”라고 말했다.〕', '', '@담당 부서: 〔○○과〕 / 책임자: 〔과장 ○○○ (000-000-0000)〕 / 담당자: 〔○○○ (000-000-0000)〕'] };
  T.gongmun = { name: '공문 (기안문 본문)', icon: 'filePlus', tag: '공문', desc: '수신 · 제목 · 본문(1. 가. 자동 번호) · 붙임 · 끝. 을 갖춘 기안문 본문', tips: ['항목 기호는 1. → 가. → 1) → 가) 순서 — 이 서식은 번호가 자동으로 붙습니다 (Alt+Shift+→ / ← 로 단계 바꾸기).', '날짜는 2026. 11. 11. 처럼 숫자와 온점, 시간은 14:00 처럼 씁니다.', '금액은 금113,560원(금일십일만삼천오백육십원) — 점검(F8)에서 한글 금액을 붙여 줍니다.', '본문이 끝나면 두 칸 띄우고 “끝.” — 붙임이 있으면 붙임 끝에.'],
    lines: ['수신  〔수신자 (경유)〕', '(경유)', '제목  〔제목〕', '', '1.〔관련: ○○과-0000(2026. 11. 1.)〕', '2.〔본문 — 무엇을 요청 · 알리는지〕', '가.〔세부 내용〕', '나.〔세부 내용〕', '1)〔더 자세한 내용〕', '', '붙임  1. 〔○○ 계획서〕 1부.', '      2. 〔○○ 명단〕 1부.  끝.', '', '=〔발신 명의: ○○소방서장〕'] };
  T.proactive = { name: '적극행정 우수사례', icon: 'star', tag: '승진', desc: '적극행정 우수사례 공모 · 경진대회 제출용. 심사 기준(국민 체감도 · 적극성 · 창의성 · 난이도 · 확산 가능성) 순서로 구성', tips: ['심사표 항목 순서대로 쓰면 심사위원이 점수를 매기기 쉽습니다.', '<b>국민 체감도</b>: 주민 · 현장이 실제로 얻은 이익을 숫자로 (시간 · 비용 · 피해 감소).', '<b>적극성</b>: 무엇이 가로막았고(규정 · 관행 · 협업) 어떻게 넘었는지.', '<b>확산 가능성</b>: 다른 소방서 · 기관도 따라 할 수 있는지.'],
    lines: ['#〔사례명: 바뀐 결과가 드러나게〕', '@' + today() + ' 〔소속 · 성명〕', '', '>한 줄 요약: 〔무엇을 바꿔 누구에게 어떤 이익이 생겼는지〕', '□ 추진 배경 (문제 상황)', '○ 〔주민 · 현장이 겪던 불편 · 위험을 숫자로〕', '□ 적극행정 내용 (장애 요인과 극복)', '○ 장애 요인: 〔규정 · 관행 · 예산 · 협업의 벽〕', '○ 극복 과정: 〔누구와 · 어떻게 · 언제〕', '□ 성과 (국민 체감도)', '○ 〔전 → 후 비교: 00일 → 00일, 00건 → 00건〕', '○ 〔주민 · 언론 반응, 표창 등〕', '□ 창의성 · 전문성', '○ 〔새로운 방법 · 전문 지식을 쓴 점〕', '□ 중요도 · 난이도', '○ 〔왜 어려웠고 왜 중요한지〕', '□ 확산 가능성', '○ 〔다른 기관에 적용할 수 있는 점 · 제도화 여부〕'] };
  T.self = { name: '근무성적평정 자기기술서', icon: 'user', tag: '승진', desc: '평정 기간의 주요 실적을 목표 · 추진 내용 · 성과 · 기여도로 정리. 실적 기록장에 적어 둔 내용으로 바로 채울 수 있습니다', tips: ['실적마다 <b>목표 → 한 일 → 숫자로 된 성과 → 내 기여</b> 순서로.', '“노력함” 대신 “처리 기간 5일 → 2일”처럼 결과를 씁니다.', '평소 <b>실적 기록장</b>에 적어 두면 연말에 이 서식으로 바로 뽑힙니다.'],
    lines: ['#근무성적평정 자기기술서', '@평정 기간: 〔2026. 1. 1.~2026. 12. 31.〕 / 〔소속 · 직급 · 성명〕', '', '□ 주요 업무 실적', '○ 〔실적 1: 업무명〕', '- 목표: 〔무엇을 하려 했는지〕', '- 추진 내용: 〔무엇을 했는지〕', '- 성과: 〔숫자로〕', '- 기여도: 〔내가 맡은 부분 · 비율〕', '○ 〔실적 2〕', '- 목표: 〔 〕', '- 추진 내용: 〔 〕', '- 성과: 〔 〕', '□ 직무 수행 능력', '○ 〔기획력 · 협업 · 전문성을 보여 준 사례〕', '□ 교육 · 자격 · 표창', '○ 〔교육 이수 · 자격 취득 · 표창〕', '□ 향후 계획', '○ 〔내년에 이루려는 목표〕'] };
  const T_ORDER = ['report', 'plan', 'result', 'meeting', 'gongmun', 'press', 'proactive', 'self'];

  function makeBlocks(lines) {
    const h = H();
    const sty = name => h.styles.find(s => s.name === name);
    const s0 = sty('바탕글') || h.styles[0];
    const base = s0 ? s0.pp : '0', bcp = s0 ? s0.cp : '0';
    const cpBody = h.deriveCp(bcp, { height: 1300 });
    const cpTitle = h.deriveCp(bcp, { height: 2000, bold: true });
    const cpH = h.deriveCp(bcp, { height: 1400, bold: true });
    const cpMeta = h.deriveCp(bcp, { height: 1100, color: '#444444' });
    const ppC = h.derivePp(base, { align: 'CENTER', next: 600 });
    const ppR = h.derivePp(base, { align: 'RIGHT' });
    const ppSum = h.derivePp(base, { prev: 600, next: 400, left: 0, intent: 0 });
    const out = [];
    const mk = (pp, st, cp, text) => {
      const d = W.doc.newParaHtml(pp, st, cp);
      if (text) { d.replaceChildren(); const s = document.createElement('span'); s.className = 'cp-' + cp; s.dataset.cp = cp; s.textContent = text; d.appendChild(s); }
      return d;
    };
    const st0 = s0 ? s0.id : '0';
    let tbl = null;
    for (const ln of lines) {
      let m;
      if (ln.startsWith('|')) { const row = ln.replace(/^\||\|$/g, '').split('|').map(x => x.trim()); if (!tbl) { tbl = mk(base, st0, cpBody, ''); tbl.dataset.tbl = '[]'; out.push(tbl); } const r = JSON.parse(tbl.dataset.tbl); r.push(row); tbl.dataset.tbl = JSON.stringify(r); continue; }
      tbl = null;
      if (ln.startsWith('#')) out.push(mk(ppC, st0, cpTitle, ln.slice(1)));
      else if (ln.startsWith('@')) out.push(mk(ppR, st0, cpMeta, ln.slice(1)));
      else if (ln.startsWith('=')) out.push(mk(ppC, st0, cpBody, ln.slice(1)));
      else if (ln.startsWith('>')) out.push(mk(ppSum, st0, cpH, ln.slice(1)));
      else if ((m = /^(\d+|[가-힣])([.)])(?=〔)/.exec(ln))) {
        const lv = /\d/.test(m[1]) ? (m[2] === '.' ? 1 : 3) : (m[2] === '.' ? 2 : 4);
        const s = sty('개요 ' + lv);
        if (s) out.push(mk(s.pp, s.id, cpBody, ln.slice(m[0].length))); else out.push(mk(base, st0, cpBody, ln));
      } else if (HEAD_RE.test(ln)) out.push(mk(lvPp(base, 0), st0, cpH, ln));
      else if ((m = SYM_RE.exec(ln))) { const L = symLevel(m[1]); out.push(mk(lvPp(base, L), st0, L === 0 ? cpH : cpBody, ln)); }
      else out.push(mk(base, st0, cpBody, ln));
    }
    return out;
  }
  function fillNewDoc(name, lines) {
    U.loadDoc(HwpxDoc.blank(), { name, dirty: true });
    const sec = doc.querySelector('.hsec'); const first = sec.querySelector(':scope > .hp');
    const blocks = makeBlocks(lines);
    // 첫 문단에는 용지 설정(조판 부호)이 숨어 있으므로 지우지 않고 첫 줄의 모양 · 글만 옮겨 담음
    const b0 = blocks.shift();
    first.dataset.pp = b0.dataset.pp; first.dataset.st = b0.dataset.st; first.dataset.dcp = b0.dataset.dcp; first.className = b0.className;
    first.querySelectorAll(':scope > br').forEach(x => x.remove());
    for (const c of Array.from(b0.childNodes)) first.appendChild(c);
    ensureBr(first);
    let last = first; for (const b of blocks) { last.after(b); last = b; }
    for (const tb of Array.from(doc.querySelectorAll('.hp[data-tbl]'))) { // 서식의 표: 그 자리에 표를 만들고 머리 줄에 옅은 바탕
      const rows = JSON.parse(tb.dataset.tbl); delete tb.dataset.tbl; caretToStart(tb); tableFromRows(rows);
      const t = tb.querySelector('table.htb') || (tb.nextElementSibling && tb.nextElementSibling.querySelector('table.htb'));
      if (t && t.rows[0]) cellFill(Array.from(t.rows[0].cells), '#eef2f7');
      const nx = (t && blockOf(t.parentElement) || tb).nextElementSibling; if (nx && nx.classList.contains('hp') && isEmptyBlock(nx) && !nx.querySelector('.isl')) nx.remove(); // 표 뒤 빈 줄 하나는 지움
    }
    UNDO.stack.length = 0; UNDO.redo.length = 0; UNDO.cur = null;
    W.dirty = true; U.updateState(); changed();
    setTimeout(() => { layout(); nextSlot(false, true); }, 30);
  }
  function templateDialog() {
    if (GUEST) return;
    const card = k => { const t = T[k]; return `<button class="tp-card" data-k="${k}"><span class="tp-ic">${icon(t.icon)}</span><span class="tp-tx"><b>${escH(t.name)}</b><small>${escH(t.desc)}</small></span><em class="tp-tag">${t.tag}</em></button>`; };
    const d = U.dialog(icon('filePlus') + '서식으로 새 문서', `<div class="tp-wrap"><div class="tp-list"><button class="tp-card" data-k="blank"><span class="tp-ic">${icon('page')}</span><span class="tp-tx"><b>빈 문서</b><small>A4 빈 문서 (Alt+N)</small></span></button>${T_ORDER.map(card).join('')}</div><div class="tp-tips" id="tpTips"></div></div>`,
      { foot: '<span class="muted tp-foot">〔 〕 칸은 <kbd>Alt</kbd>+<kbd>.</kbd> 로 차례로 옮겨 다니며 채웁니다</span><button class="tb" data-x="cancel">닫기</button>', width: 860, noEnter: true, noFocus: true });
    const tips = d.q('#tpTips');
    const show = k => { const t = T[k]; tips.innerHTML = t ? `<h4>${escH(t.name)} — 이렇게 쓰면 통과가 빠릅니다</h4><ul>${t.tips.map(x => `<li>${x}</li>`).join('')}</ul><div class="tp-prev">${t.lines.slice(0, 14).map(l => `<div class="${l[0] === '#' ? 't' : l[0] === '@' ? 'r' : l[0] === '>' ? 's' : /^□/.test(l) ? 'h' : ''}">${escH(l.replace(/^[#@=>]/, '')) || '&nbsp;'}</div>`).join('')}${t.lines.length > 14 ? '<div class="more">⋯</div>' : ''}</div>` : '<p class="dlg-desc">왼쪽에서 문서 종류를 고르세요. 목차와 작성 요령이 미리 채워진 새 문서가 열립니다.</p>'; };
    show('report');
    d.bg.querySelectorAll('.tp-card').forEach(b => {
      b.addEventListener('mouseenter', () => show(b.dataset.k)); b.addEventListener('focus', () => show(b.dataset.k));
      b.addEventListener('click', async () => {
        d.close(false);
        if (!(await U.confirmDiscard())) return;
        if (b.dataset.k === 'blank') { U.loadDoc(HwpxDoc.blank(), { name: '새 문서' }); return; }
        const t = T[b.dataset.k]; fillNewDoc(t.name.replace(/\s*\(.+\)$/, ''), t.lines);
        toast(`${t.name} 서식을 열었습니다 — 〔 〕 칸을 채우세요 (Alt+. 다음 칸)`, 3200);
      });
    });
    setTimeout(() => { const f = d.bg.querySelector('.tp-card[data-k="report"]'); if (f) f.focus(); }, 0);
  }

  /* 〔 〕 칸 옮겨 다니기 */
  function nextSlot(back, quiet) {
    if (!W.doc) return;
    const blocks = Array.from(doc.querySelectorAll('.hp'));
    const r = rng(); let sb = r && blockOf(back ? r.startContainer : r.endContainer); let si = sb ? blocks.indexOf(sb) : -1;
    let off = sb ? caretOffset(sb, back ? r.startContainer : r.endContainer, back ? r.startOffset : r.endOffset) : 0;
    const n = blocks.length;
    for (let step = 0; step <= n; step++) {
      const i = back ? ((si < 0 ? 0 : si) - step + n * 2) % n : ((si < 0 ? 0 : si) + step) % n;
      const t = blockText(blocks[i]); const all = []; const re = /〔[^〔〕]*〕/g; let m;
      while ((m = re.exec(t))) all.push(m);
      let hit = null;
      if (back) { for (let k = all.length - 1; k >= 0; k--) if (!(step === 0 && si >= 0) || all[k].index + all[k][0].length < off) { hit = all[k]; break; } }
      else hit = all.find(x => !(step === 0 && si >= 0) || x.index >= off) || null;
      if (hit) { selectTextRange(blocks[i], hit.index, hit.index + hit[0].length); return true; }
    }
    if (!quiet) toast('채울 칸 〔 〕 이 남아 있지 않습니다', 1600);
    return false;
  }

  /* =====================================================================
     3. 개조식 쓰기 도우미: Enter 로 같은 기호 이어 쓰기, Alt+Shift+→/← 단계 바꾸기
     ===================================================================== */
  function onEnter(e) {
    if (GUEST || !editorOpen() || e.isComposing || e.keyCode === 229) return false;
    const r = rng(); if (!r || !r.collapsed) return false;
    const b = blockOf(r.startContainer); if (!b || cellOf(r.startContainer) || b.querySelector('table')) return false;
    const t = blockText(b); const hm = HEAD_RE.exec(t); const m = SYM_RE.exec(t) || (hm && ['', '□']); if (!m) return false;
    if (caretOffset(b, r.startContainer, r.startOffset) !== t.length) return false; // 줄 끝에서만
    e.preventDefault(); e.stopImmediatePropagation();
    if (!hm && t.trim() === m[1]) { // 기호만 있는 빈 항목: 기호를 지우고 개조식을 끝냄
      selectTextRange(b, 0, t.length); insertText(''); const base = (H().styles.find(s => s.name === '바탕글') || {}).pp || '0';
      edit(b, b, () => { b.dataset.pp = base; b.className = b.className.replace(/\bpp-\S+/, 'pp-' + base); }); return true;
    }
    const toSub = m[1] === '□' || m[1] === '■'; // □ 제목 · '1.' 큰 제목 다음 줄은 ○ 항목 (글자는 본문 모양)
    const sym = toSub ? '○' : m[1];
    const tn = textNodesOf(b).filter(x => x.nodeValue.length).pop();
    let cp = tn ? cpOfNode(tn) : (b.dataset.dcp || '0');
    if (toSub) {
      let nx = b.nextElementSibling; while (nx && !(nx.classList.contains('hp') && /^○\s/.test(blockText(nx)))) nx = nx.nextElementSibling;
      const nt = nx && textNodesOf(nx).find(x => x.nodeValue.trim());
      cp = nt ? cpOfNode(nt) : H().deriveCp(cp, { bold: false });
    }
    splitBlock();
    const nb = blockOf(rng().startContainer); if (!nb) return true;
    const base = (H().styles.find(s => s.name === '바탕글') || {}).pp || '0';
    const pp = toSub ? lvPp(base, 1) : nb.dataset.pp;
    let sp;
    edit(nb, nb, () => {
      nb.replaceChildren(...nb.querySelectorAll(':scope > .isl.hid'));
      sp = document.createElement('span'); sp.className = 'cp-' + cp; sp.dataset.cp = cp; sp.textContent = sym + ' '; nb.appendChild(sp);
      nb.dataset.pp = pp; nb.dataset.dcp = cp; nb.className = `hp pp-${pp} cp-${cp}`;
    });
    placeCaret(sp.firstChild, sp.firstChild.length);
    return true;
  }
  function shiftLevel(d) {
    if (GUEST || !editorOpen()) return;
    const bs = selBlocks(); if (!bs.length) return;
    const h = H(); const base = (h.styles.find(s => s.name === '바탕글') || {}).pp || '0';
    let did = 0;
    const work = () => {
      for (const b of bs) {
        const t = blockText(b); const m = SYM_RE.exec(t);
        if (m) {
          const L = Math.max(0, Math.min(3, symLevel(m[1]) + d)); const nt = textNodesOf(b).find(x => x.nodeValue.replace(/[​﻿]/g, '').length);
          if (nt) { const i = nt.nodeValue.indexOf(m[1]); nt.replaceData(i, 1, SYM[L]); }
          const pp = lvPp(base, L); b.dataset.pp = pp; b.className = b.className.replace(/\bpp-\S+/, 'pp-' + pp); did++; continue;
        }
        const st = h.styles.find(s => s.id === b.dataset.st); const lm = st && /^개요 (\d)$/.exec(st.name);
        if (lm) {
          const nl = Math.max(1, Math.min(7, +lm[1] + d)); const ns = h.styles.find(s => s.name === '개요 ' + nl); if (!ns) continue;
          b.dataset.st = ns.id; b.dataset.pp = ns.pp; b.className = b.className.replace(/\bpp-\S+/, 'pp-' + ns.pp); did++;
        }
      }
    };
    const first = bs[0], last = bs[bs.length - 1];
    if (hostOf(first) === hostOf(last)) edit(first, last, work); else edit(topOf(first), topOf(last), work);
    if (!did) toast('□ ○ - · 로 시작하는 줄이나 개요 문단(Ctrl+3~9)에서 쓰세요', 2200);
  }

  /* =====================================================================
     4. 문서 점검 (F8): 공문서 표기 · 쉬운 말 · 문장 · 빈칸 · 두괄식
     ===================================================================== */
  const jong = c => { const k = c.charCodeAt(0) - 0xAC00; return k >= 0 && k < 11172 ? k % 28 : -1; };
  const pad2 = n => String(n).padStart(2, '0');
  function wonKo(n) { // 113560 → 일십일만삼천오백육십 (공문서 금액 표기 예시와 같은 방식: '일'을 생략하지 않음)
    const dg = '영일이삼사오육칠팔구', small = ['', '십', '백', '천'], big = ['', '만', '억', '조'];
    let s = '', g = 0; if (!n) return '영';
    while (n > 0) { const part = n % 10000; if (part) { let p = ''; for (let i = 3; i >= 0; i--) { const v = Math.floor(part / 10 ** i) % 10; if (v) p += dg[v] + small[i]; } s = p + big[g] + s; } n = Math.floor(n / 10000); g++; }
    return s;
  }
  // 쉬운 말 (국립국어원 다듬은 말 · 공공언어 감수 기준에서 공문서에 자주 나오는 것). fix 가 없으면 고칠 말만 알려 줌
  const PLAIN = [
    ['익일', '다음 날'], ['금일(?![일이삼사오육칠팔구십백천만억원])', '오늘'], ['명일', '내일'], ['작일', '어제'], ['시건장치', '잠금장치'], ['수범\\s?사례', '모범 사례'], ['견출지', '찾음표'], ['게첨', '게시'],
    ['가일층', '한층 더'], ['미연에', '미리'], ['필히', '반드시'], ['차기(?=\\s|[가-힣])', '다음'], ['상이한', '다른'], ['상기(?=\\s?(?:의|와|한|내용|사항|건))', '위'], ['하기(?=\\s?(?:와\\s같이|의\\s(?:내용|사항)))', '아래'],
    ['에\\s?의거하여', '에 따라'], ['에\\s?의거', '에 따라'], ['감안하', '고려하'], ['(?<=[0-9])개소', '곳'], ['적의\\s?조치', '알맞게 조치'], ['(?<=[가-힣])토록(?=\\s|$|[.,])', '하도록'],
    ['거버넌스', '협치'], ['로드맵', '단계별 이행안'], ['매뉴얼', '지침서'], ['모니터링', '점검'], ['인센티브', '성과 보상'], ['컨트롤\\s?타워', '총괄 기구'], ['태스크\\s?포스', '전담 조직'], ['(?<![A-Za-z])TF(?![A-Za-z])', '전담 조직'],
    ['워크숍', '공동 연수'], ['리스크', '위험'], ['이슈', '쟁점'], ['피드백', '의견 반영'], ['프로세스', '절차'], ['가이드라인', '지침'], ['니즈', '수요'], ['원스톱', '한자리'], ['핫라인', '직통 전화'],
    ['인프라', '기반 시설'], ['마스터\\s?플랜', '종합 계획'], ['벤치마킹', '본따르기'], ['(?<![A-Za-z])MOU(?![A-Za-z])', '업무 협약'], ['아젠다|어젠다', '의제'], ['팩트', '사실'], ['업그레이드', '개선'], ['컨설팅', '상담'],
    ['송부', null, '보내다 (예: 송부합니다 → 보냅니다)'], ['득하', null, '얻다 · 받다 (예: 승인을 득한 → 승인을 받은)'], ['요하는|요함|요합니다', null, '필요한 · 필요함'], ['제고', null, '높임 · 향상'], ['기재하', null, '적다 · 쓰다'], ['지득', null, '알게 됨'],
    ['시달', null, '알림 · 지시'], ['하명', null, '지시'], ['함에\\s?있어(서)?', null, '~할 때 · ~하는 데'], ['에\\s?있어서', null, '~에서 · ~할 때'], ['불철주야', null, '밤낮없이'],
  ].map(([p, rep, hint]) => ({ re: new RegExp(p, 'g'), rep, hint }));
  // 서술식 → 개조식 끝맺음
  const ENDS = [[/했습니다\.?$/, '했음'], [/하였습니다\.?$/, '하였음'], [/합니다\.?$/, '함'], [/입니다\.?$/, '임'], [/됩니다\.?$/, '됨'], [/있습니다\.?$/, '있음'], [/없습니다\.?$/, '없음'], [/겠습니다\.?$/, '겠음'], [/습니다\.?$/, '음']];
  const CATS = { form: '공문서 표기', plain: '쉬운 말', space: '띄어쓰기', sent: '문장', slot: '빈칸', shape: '짜임' };

  function scan() {
    const res = []; if (!W.doc) return { list: res, stat: {} };
    const blocks = Array.from(doc.querySelectorAll('.hp')).filter(b => !b.querySelector(':scope > table'));
    const tops = Array.from(doc.querySelectorAll('.hsec > .hp'));
    const texts = new Map(blocks.map(b => [b, blockText(b)]));
    const gong = blocks.some(b => /^\s*수신\s/.test(texts.get(b)));
    const press = blocks.filter(b => texts.get(b).trim()).slice(0, 4).some(b => /^\s*(\(?공동\s?\)?\s*)?보\s?도\s?자\s?료\s*$|^\s*보도\s?시점/.test(texts.get(b))); // 보도자료는 서술식 · 부제는 명사로 끝나는 것이 정상
    const add = (cat, b, a, z, msg, rep, more) => res.push(Object.assign({ cat, b, a, z, find: texts.get(b).slice(a, z), msg, rep }, more || {}));
    const each = (b, re, fn) => { const t = texts.get(b); re.lastIndex = 0; let m; while ((m = re.exec(t))) { fn(m, t); if (!re.global) break; if (m[0] === '') re.lastIndex++; } };
    let chars = 0, sentN = 0, sentLen = 0, gaejo = 0, seosul = [];
    for (const b of blocks) {
      const t = texts.get(b); if (!t.trim()) continue; chars += t.replace(/\s/g, '').length;
      // 빈칸
      each(b, /〔[^〔〕]*〕/g, m => add('slot', b, m.index, m.index + m[0].length, '아직 채우지 않은 칸입니다'));
      // 날짜: 2026.11.1 / 2026-11-01 → 2026. 11. 1.
      each(b, /(?<![\d.])(\d{4})\s*([.\-\/])\s*(\d{1,2})\s*\2\s*(\d{1,2})(?!\d)(\.?)/g, m => {
        const y = +m[1], mo = +m[3], d = +m[4]; if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return;
        const want = `${y}. ${mo}. ${d}.`; if (m[0] !== want) add('form', b, m.index, m.index + m[0].length, '날짜는 숫자와 온점으로, 앞의 0 없이 씁니다 (2026. 1. 5.)', want);
      });
      if (gong) each(b, /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g, m => add('form', b, m.index, m.index + m[0].length, '공문서 날짜는 연 · 월 · 일 글자 대신 온점을 찍습니다', `${+m[1]}. ${+m[2]}. ${+m[3]}.`));
      // 시간: 오후 2시 30분 / 14시 30분 / 14:30분 → 14:30
      each(b, /(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?(?!간)/g, m => { let h = +m[2]; if (h > 12) return; if (m[1] === '오후' && h < 12) h += 12; if (m[1] === '오전' && h === 12) h = 0; add('form', b, m.index, m.index + m[0].length, '시간은 24시각제 숫자와 쌍점으로 씁니다', `${pad2(h)}:${pad2(+(m[3] || 0))}`); });
      each(b, /(?<![\d:오전후]\s?)(?<![\d:])(\d{1,2})\s*시\s*(\d{1,2})\s*분/g, m => { if (+m[1] > 24 || +m[2] > 59) return; add('form', b, m.index, m.index + m[0].length, '시간은 시 · 분 글자 대신 쌍점으로 씁니다', `${pad2(+m[1])}:${pad2(+m[2])}`); });
      each(b, /(?<!\d)(\d{1,2}):(\d{2})\s?분/g, m => add('form', b, m.index, m.index + m[0].length, '쌍점으로 쓴 시간 뒤에는 “분”을 쓰지 않습니다', `${m[1]}:${m[2]}`));
      // 금액 (공문)
      if (gong) each(b, /(?<![\d,])(금\s?)?(\d{1,3}(?:,\d{3})+|\d{4,})\s?원(?!\s*\(\s*금)/g, m => {
        const n = +m[2].replace(/,/g, ''); if (!n || n > 9e15) return;
        add('form', b, m.index, m.index + m[0].length, '공문서 금액은 숫자 뒤 괄호에 한글 금액을 함께 씁니다', `금${n.toLocaleString('en-US')}원(금${wonKo(n)}원)`);
      });
      // 쌍점 · 물결표 · 붙임
      each(b, /([가-힣)])\s+:\s*(?=\S)/g, m => add('form', b, m.index, m.index + m[0].length, '쌍점(:)은 앞 말에 붙이고 뒤는 한 칸 띄웁니다', m[1] + ': '));
      each(b, /([가-힣)]):(?=[가-힣(〔])/g, m => add('form', b, m.index, m.index + m[0].length, '쌍점(:) 뒤는 한 칸 띄웁니다', m[1] + ': '));
      each(b, /(\d\.?|\))(\s+~\s*|\s*~\s+)(?=[\d〔(])/g, m => add('form', b, m.index, m.index + m[0].length, '기간을 나타내는 물결표(~)는 앞뒤를 붙여 씁니다', m[1] + '~'));
      each(b, /^\s*붙임\s*[:：]\s*/g, m => add('form', b, m.index, m.index + m[0].length, '“붙임” 뒤에는 쌍점 없이 두 칸을 띄웁니다', '붙임  '));
      each(b, /(\S)(\s?|\s{3,})끝\.\s*$/g, m => { if (m[2].length !== 2) add('form', b, m.index, m.index + m[0].length, '“끝.” 은 마지막 글자에서 두 칸 띄웁니다', m[1] + '  끝.'); });
      // 쉬운 말
      for (const p of PLAIN) each(b, p.re, m => add('plain', b, m.index, m.index + m[0].length, p.rep ? `쉬운 말: “${m[0]}” → “${p.rep}”` : `쉬운 말로: “${m[0]}” → ${p.hint}`, p.rep));
      // 띄어쓰기
      each(b, /([가-힣])(\s?)수(\s?)(있|없)/g, m => { if (jong(m[1]) === 8 && (!m[2] || !m[3])) add('space', b, m.index, m.index + m[0].length, '“-ㄹ 수 있다”는 띄어 씁니다', `${m[1]} 수 ${m[4]}`); });
      each(b, /([가-힣])것(?=[이은을도과만]|\s|$)/g, m => { if (jong(m[1]) === 8 || /[는던은]/.test(m[1])) add('space', b, m.index, m.index + m[0].length, '“것”은 앞말과 띄어 씁니다', m[1] + ' 것'); });
      each(b, /것같/g, m => add('space', b, m.index, m.index + 2, '“것 같다”는 띄어 씁니다', '것 같'));
      each(b, /([가-힣])지않/g, m => add('space', b, m.index, m.index + m[0].length, '“-지 않다”는 띄어 씁니다', m[1] + '지 않'));
      each(b, /([가-힣]야)(한다|합니다|함|할|했)/g, m => add('space', b, m.index, m.index + m[0].length, '“-야 한다”는 띄어 씁니다', m[1] + ' ' + m[2]));
      each(b, /([가-힣A-Za-z0-9)])및|및(?=[가-힣A-Za-z0-9(])/g, m => add('space', b, m.index, m.index + m[0].length, '“및”은 앞뒤를 띄어 씁니다', m[1] ? m[1] + ' 및' : '및 '));
      // 같은 말 두 번
      each(b, /(?<![가-힣A-Za-z0-9])([가-힣A-Za-z0-9]{2,})\s+\1(?![가-힣A-Za-z0-9])/g, m => add('sent', b, m.index, m.index + m[0].length, `같은 말 “${m[1]}” 이 두 번 이어집니다`, m[1]));
      // 문장 길이 · 문체
      for (const s of t.split(/(?<=[.?!])\s+/)) { const L = s.replace(/\s/g, '').length; if (L > 2) { sentN++; sentLen += L; } }
      const parts = t.split(/(?<=[.?!])\s+/); let k = 0;
      const item = !press && /^[○\-·∙ㅇ◦]\s/.test(t.trim()), lim = item ? 70 : 100; // 공공기관 원문 11건 실측: 우수 보도자료도 70~90자 문장이 흔함 → 서술식은 100자, 개조식 한 항목은 두 줄(70자)
      for (const s of parts) { const L = s.replace(/\s/g, '').length; if (L > lim) { const a = t.indexOf(s, k); add('sent', b, a, a + s.length, item ? `한 항목이 ${L}자입니다 — 두 줄을 넘지 않게 나누세요` : `한 문장이 ${L}자입니다 — 둘로 나누면 읽기 쉽습니다`, null, { long: true }); } k += s.length; }
      const tt = t.trim();
      if (/(함|임|음|됨|필요|예정|계획|추진|완료|검토|중|\)|〕)$/.test(tt) || isItem(tt)) gaejo++;
      // 행안부 2026. 8. 24. AI 친화 보고서 원칙: ○ - · 항목을 명사로 끊지 말고 주어 · 서술어가 있는 문장으로
      const sm = /^([○\-·∙ㅇ◦])\s/.exec(tt);
      if (sm && !press && !/〔/.test(tt)) {
        const body = tt.replace(/^[○\-·∙ㅇ◦]\s*(\([^)]{1,12}\)\s*)?/, '').replace(/[.。]$/, '');
        const nm = /(지속|필요|추진|확대|강화|개선|검토|마련|실시|시행|완료|증가|감소|부족|미흡|발생|확보|운영|점검|협의|구축|도입|설치|정비|요구|요청|제고|해소|지원|추가|변경|조정|반영|확인|예정|계획|곤란|저하|노후)$/.exec(body);
        if (body.length >= 10 && nm && !/[:：]/.test(body)) {
          const fix = { 필요: '필요함', 예정: '예정임', 계획: '계획임', 곤란: '곤란함', 부족: '부족함', 미흡: '미흡함' }[nm[1]];
          const at = t.lastIndexOf(nm[1]);
          add('shape', b, at, at + nm[1].length, `“${nm[1]}”에서 끊긴 명사형 항목 — 행안부 보고서 원칙(2026. 8. 24.)은 주어와 서술어가 보이는 문장 (예: “개선 요구 지속” → “개선 요구가 계속 나오고 있음”)`, fix || null);
        }
      }
      if (/^[◆◇▶▷►▣◈★☆◎]/.test(tt)) add('shape', b, t.indexOf(tt[0]), t.indexOf(tt[0]) + 1, '꾸밈 기호 대신 표준 항목 기호를 씁니다 — 1. 가. 1) 또는 □ ○ - · (시행규칙 제2조)', null);
      if (/(니다|습니다)\.?$/.test(tt) && !/[“"].*니다[.]?[”"]/.test(tt)) seosul.push(b);
    }
    // 개조식 문서에 섞인 서술식
    if (gaejo >= 3 && seosul.length && seosul.length < gaejo) for (const b of seosul) {
      const t = texts.get(b); const e = ENDS.find(([re]) => re.test(t)); if (!e) continue;
      const m = e[0].exec(t); add('shape', b, m.index, t.length, '개조식 문서에 서술식(~습니다) 문장이 섞였습니다', e[1]);
    }
    // 표: 위에 < 제목 >, 표 안의 표 금지 (행안부 2026. 8. 24. 원칙 ①)
    const allTops = Array.from(doc.querySelectorAll('.hsec > .hp'));
    allTops.forEach((tb, i) => {
      const t = tb.querySelector(':scope > table.htb'); if (!t) return;
      let j = i - 1; while (j >= 0 && !blockText(allTops[j]).trim() && !allTops[j].querySelector('table')) j--;
      const prev = j >= 0 ? blockText(allTops[j]).trim() : '';
      if (!/^[<〈＜《\[［].{1,60}[>〉＞》\]］]$|^(표|그림)\s*\d|^\(단위/.test(prev)) res.push({ cat: 'shape', b: j >= 0 ? allTops[j] : tb, a: 0, z: 0, find: '', msg: '표 위에 제목이 없습니다 — 예: < 소화전 급수능력 측정 결과 > (행안부 보고서 원칙: 표 · 그림은 위에 제목)', rep: null });
      if (t.querySelector('td table')) res.push({ cat: 'shape', b: tb, a: 0, z: 0, find: '', msg: '표 안에 표가 있습니다 — 사람도 AI 도 읽기 어렵습니다. 표를 나누거나 글로 푸세요', rep: null });
    });
    // 두괄식: 제목 다음 네 줄 안에 결론 · 요지가 보이는지 (보고 · 계획 문서)
    const nonEmpty = tops.filter(b => (texts.get(b) || blockText(b)).trim());
    const title = nonEmpty[0] ? blockText(nonEmpty[0]) : '';
    if (!gong && nonEmpty.length >= 6 && /보고|계획|검토|방안|대책|결과/.test(title)) {
      const head = nonEmpty.slice(1, 5).map(blockText).join(' ');
      if (!/요지|요약|결론|건의|핵심|하고자|결정|승인|보고\s?드|필요/.test(head)) res.push({ cat: 'shape', b: nonEmpty[1], a: 0, z: 0, find: '', msg: '두괄식이 아닙니다 — 제목 바로 아래에 결론 · 건의(요지)를 한두 줄로 먼저 쓰세요', rep: null });
    }
    // 공문: 끝 표시
    if (gong && !blocks.some(b => /\s끝\.\s*$/.test(texts.get(b)))) {
      const att = blocks.filter(b => /^\s*(붙임|\d+\.\s)/.test(texts.get(b)) && texts.get(b).trim());
      const target = att.length ? att[att.length - 1] : null;
      if (target) { const t = texts.get(target).replace(/\s+$/, ''); res.push({ cat: 'form', b: target, a: t.length, z: texts.get(target).length, find: texts.get(target).slice(t.length), msg: '본문(붙임이 있으면 붙임) 끝에 두 칸 띄우고 “끝.” 을 씁니다', rep: '  끝.' }); }
      else res.push({ cat: 'form', b: blocks[0], a: 0, z: 0, find: '', msg: '공문 본문 끝에 “끝.” 표시가 없습니다', rep: null });
    }
    // 1쪽 보고서가 한 장을 넘음
    const pages = W.pages ? W.pages.length : 1;
    if (/보고/.test(title) && !/결과|자기기술서/.test(title) && pages > 1 && !gong) res.push({ cat: 'shape', b: nonEmpty[0] || blocks[0], a: 0, z: 0, find: '', msg: `보고서가 ${pages}쪽입니다 — 결재용이라면 1쪽으로 줄이고 나머지는 붙임으로 빼세요`, rep: null });
    // 겹치는 지적은 앞의 것만
    res.sort((x, y) => (blocks.indexOf(x.b) - blocks.indexOf(y.b)) || (x.a - y.a));
    const out = []; let lastB = null, lastZ = -1;
    for (const x of res) { if (x.b === lastB && x.z > x.a && x.a < lastZ) continue; out.push(x); if (x.z > x.a) { lastB = x.b; lastZ = x.z; } }
    const real = out.filter(x => x.cat !== 'slot').length;
    return { list: out, stat: { chars, pages, avg: sentN ? Math.round(sentLen / sentN) : 0, gong, press, per1k: chars ? +(real / chars * 1000).toFixed(1) : 0 } };
  }

  let chkOpen = false, chkT = null, chkData = null, chkFilter = 'all';
  const panel = () => $id('chkPanel');
  function openCheck() {
    if (!W.doc) { toast('먼저 문서를 여세요'); return; }
    chkOpen = true; panel().hidden = false; document.body.classList.add('chk-on'); runCheck();
  }
  function closeCheck() { chkOpen = false; panel().hidden = true; document.body.classList.remove('chk-on'); }
  function runCheck() {
    if (!chkOpen) return;
    chkData = scan(); const { list, stat } = chkData;
    const cnt = {}; list.forEach(x => { cnt[x.cat] = (cnt[x.cat] || 0) + 1; });
    const fixable = list.filter(x => x.rep != null && (chkFilter === 'all' || x.cat === chkFilter)).length;
    const chips = `<button class="ck-chip${chkFilter === 'all' ? ' on' : ''}" data-f="all">전체 ${list.length}</button>` + Object.keys(CATS).filter(k => cnt[k]).map(k => `<button class="ck-chip${chkFilter === k ? ' on' : ''}" data-f="${k}">${CATS[k]} ${cnt[k]}</button>`).join('');
    const shown = list.map((x, i) => [x, i]).filter(([x]) => chkFilter === 'all' || x.cat === chkFilter);
    $id('ckSum').innerHTML = `<span>${stat.gong ? '공문' : stat.press ? '보도자료' : '보고 · 일반 문서'}</span><span title="빈칸을 뺀 지적 수. 공공기관 원문 11건 실측: 우수 보도자료(권익위 2025. 10.) 0.8 · 행안부 2.3~2.5 · 소방청 보도자료 1.8~7.3">1,000자당 ${stat.per1k}건 <small>(우수 문서 1~3)</small></span><span>${stat.pages}쪽</span><span>${stat.chars.toLocaleString()}자</span><span title="문장 하나의 평균 글자 수(띄어쓰기 빼고)">평균 문장 ${stat.avg}자</span>`;
    $id('ckChips').innerHTML = chips;
    $id('ckFixAll').hidden = GUEST || !fixable; $id('ckFixAll').textContent = `고칠 수 있는 ${fixable}건 모두 고치기`;
    $id('ckList').innerHTML = shown.length ? shown.map(([x, i]) => `<li data-i="${i}" class="ck-${x.cat}"><button class="ck-go" data-go="${i}"><em>${CATS[x.cat]}</em><span class="m">${escH(x.msg)}</span>${x.find && x.find.trim() ? `<span class="f">${escH(x.find.length > 60 ? x.find.slice(0, 60) + '…' : x.find)}${x.rep != null ? ` <b>→</b> ${escH(x.rep.trim() ? x.rep : '(지움)')}` : ''}</span>` : ''}</button>${x.rep != null && !GUEST ? `<button class="tb ck-fix" data-fix="${i}">고치기</button>` : ''}</li>`).join('')
      : `<li class="ck-ok">${icon('check')}<span>${list.length ? '이 분류에는 지적할 곳이 없습니다' : '지적할 곳이 없습니다. 그래도 숫자 · 이름 · 날짜는 직접 한 번 더 확인하세요.'}</span></li>`;
  }
  function goIssue(x) {
    if (!x.b.isConnected) return;
    if (x.z > x.a) selectTextRange(x.b, x.a, x.z); else { caretToStart(x.b); const cv = $id('canvas'); const rc = x.b.getBoundingClientRect(), cr = cv.getBoundingClientRect(); cv.scrollTop += rc.top - cr.top - cr.height / 3; }
  }
  // 문단 안 [a, z) 글자를 rep 로 (글자 모양은 첫 글자의 것을 따름). 되돌리기 기록은 부르는 쪽에서
  function replaceRange(b, a, z, rep) {
    const nodes = textNodesOf(b); let k = 0;
    if (!nodes.length) { const cp = b.dataset.dcp || '0'; const sp = document.createElement('span'); sp.className = 'cp-' + cp; sp.dataset.cp = cp; sp.textContent = rep; b.insertBefore(sp, b.querySelector(':scope > br:last-child')); ensureBr(b); return; }
    let remain = z - a, done = false;
    for (const t of nodes) {
      const L = t.length;
      if (!done && (a < k + L || (a === k + L && t === nodes[nodes.length - 1]))) {
        const s0 = a - k, take = Math.min(L - s0, remain); t.deleteData(s0, take); t.insertData(s0, rep); remain -= take; done = true;
      } else if (done && remain > 0) { const tk = Math.min(L, remain); t.deleteData(0, tk); remain -= tk; }
      k += L;
    }
    mergeSpans(b); ensureBr(b);
  }
  const live = x => x.b.isConnected && blockText(x.b).slice(x.a, x.z) === x.find;
  function applyFixes(list) {
    list = list.filter(live); if (!list.length) return 0;
    // 같은 문단 안에서는 뒤에서부터 고쳐야 앞의 위치가 그대로
    list.sort((p, q) => p.b === q.b ? q.a - p.a : 0);
    const tops = Array.from(new Set(list.map(x => topOf(x.b)))).filter(Boolean);
    const all = Array.from(doc.querySelectorAll('.hsec > .hp')); tops.sort((p, q) => all.indexOf(p) - all.indexOf(q));
    const run = () => { for (const x of list) replaceRange(x.b, x.a, x.z, x.rep); };
    const f = tops[0], l = tops[tops.length - 1];
    if (f && hostOf(f) === hostOf(l)) edit(f, l, run); else run(), changed();
    return list.length;
  }
  function fixIssue(x) {
    if (!applyFixes([x])) return false;
    const e = x.a + x.rep.length; if (x.b.isConnected) { if (x.rep) selectTextRange(x.b, x.a, e); else setCaretOffset(x.b, x.a); }
    return true;
  }
  function fixAll() {
    const n = applyFixes(chkData.list.filter(x => x.rep != null && (chkFilter === 'all' || x.cat === chkFilter)));
    toast(`${n}건을 고쳤습니다 — Ctrl+Z 한 번이면 모두 되돌립니다`, 2400); runCheck();
  }
  function bindCheck() {
    const p = panel();
    p.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
    p.addEventListener('click', e => {
      const g = e.target.closest('[data-go]'), f = e.target.closest('[data-fix]'), c = e.target.closest('[data-f]');
      if (f) { const x = chkData.list[+f.dataset.fix]; if (x && !fixIssue(x)) toast('문서가 바뀌어 다시 점검합니다'); runCheck(); return; }
      if (g) { const x = chkData.list[+g.dataset.go]; if (x) goIssue(x); return; }
      if (c) { chkFilter = c.dataset.f; runCheck(); return; }
      if (e.target.closest('#ckClose')) closeCheck();
      if (e.target.closest('#ckRe')) runCheck();
      if (e.target.closest('#ckFixAll')) fixAll();
    });
    const prev = window.onDocChanged;
    window.onDocChanged = function () { if (prev) prev.apply(this, arguments); if (chkOpen) { clearTimeout(chkT); chkT = setTimeout(runCheck, 700); } };
  }

  /* =====================================================================
     5. 실적 기록장: 평소 성과를 적어 두고 → 자기기술서 · 적극행정 사례로 바로 뽑기
     이 기기 브라우저에 저장(localStorage 'hwp:wins'). 백업 파일로 내보내 다른 기기에 옮김
     ===================================================================== */
  const WKEY = 'hwp:wins';
  const WCATS = ['업무 성과', '적극행정 · 혁신', '민원 · 현장 대응', '교육 · 자격', '표창 · 포상', '협업 · 대외'];
  const wins = { all() { try { const v = JSON.parse(localStorage.getItem(WKEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }, put(list) { try { localStorage.setItem(WKEY, JSON.stringify(list)); return true; } catch (e) { toast('저장 공간이 부족해 기록하지 못했습니다'); return false; } } };
  function winsDialog(editId) {
    if (GUEST) return;
    const list = wins.all(); const cur = editId ? list.find(x => x.id === editId) : null;
    const body = `<p class="dlg-desc">한 일을 그때그때 적어 두면 연말 <b>근무성적평정 자기기술서</b>, <b>적극행정 우수사례</b>를 바로 만들 수 있습니다. 성과는 <b>숫자로</b> (전 → 후) 적으세요. 이 기기 브라우저에 저장되니 가끔 [백업 내보내기] 하세요.</p>
      <div class="wn-form"><div class="grid1">
        <label for="wnD">날짜</label><input id="wnD" type="date" value="${escH(cur ? cur.d : isoToday())}">
        <label for="wnC">분류</label><select id="wnC">${WCATS.map(c => `<option${cur && cur.cat === c ? ' selected' : ''}>${c}</option>`).join('')}</select>
        <label for="wnT">업무명</label><input id="wnT" placeholder="예: 다중이용업소 화재안전 점검 방식 개선" value="${escH(cur ? cur.t : '')}">
        <label for="wnW">한 일</label><textarea id="wnW" rows="2" placeholder="무엇이 가로막았고 어떻게 했는지">${escH(cur ? cur.w : '')}</textarea>
        <label for="wnR">성과 (숫자로)</label><input id="wnR" placeholder="예: 점검 1곳당 3시간 → 1시간(67% 단축), 지적 사항 120건 개선" value="${escH(cur ? cur.r : '')}">
        <label for="wnE">근거 문서</label><input id="wnE" placeholder="결과 보고 · 공문 번호 · 언론 보도" value="${escH(cur ? cur.e : (W.doc && (W.handle || W.boxId) ? W.name : ''))}">
      </div><div class="wn-btns">${cur ? '<button class="tb" id="wnCancel">고치기 취소</button>' : ''}<button class="tb primary" id="wnAdd">${icon(cur ? 'check' : 'plus')}${cur ? '고친 내용 저장' : '기록 추가'}</button></div></div>
      <div class="wn-head"><b>기록 ${list.length}건</b><span class="grow"></span><select id="wnP" aria-label="기간"><option value="y">올해</option><option value="h1">올해 상반기</option><option value="h2">올해 하반기</option><option value="py">작년</option><option value="all">전체</option></select><button class="tb" id="wnSelf">${icon('user')}자기기술서 만들기</button></div>
      <ul class="wn-list" id="wnList"></ul>
      <div class="wn-io"><button class="tb" id="wnExp">${icon('export')}백업 내보내기</button><button class="tb" id="wnImp">${icon('import')}백업 가져오기</button></div>`;
    const d = U.dialog(icon('star') + '실적 기록장', body, { foot: '<button class="tb" data-x="cancel">닫기</button>', width: 760, noEnter: true, noFocus: true });
    const q = d.q;
    if (!matchMedia('(pointer: coarse)').matches) setTimeout(() => q('#wnT').focus(), 0); // 휴대폰은 자판이 바로 올라오지 않게
    const draw = () => {
      const all = wins.all().sort((a, b) => (b.d || '').localeCompare(a.d || ''));
      q('#wnList').innerHTML = all.length ? all.map(x => `<li><div class="wn-t"><em>${escH(ymd(x.d))}</em><span class="wn-c">${escH(x.cat || '')}</span><b>${escH(x.t || '')}</b></div>${x.r ? `<div class="wn-r">${escH(x.r)}</div>` : ''}${x.w ? `<div class="wn-w">${escH(x.w)}</div>` : ''}<div class="wn-a"><button class="tb sm" data-pro="${x.id}" title="이 실적으로 적극행정 우수사례 서식 만들기">${icon('star')}우수사례로</button><button class="tb sm" data-ed="${x.id}">${icon('edit')}고치기</button><button class="tb sm danger" data-del="${x.id}" aria-label="지우기">${icon('trash')}</button></div></li>`).join('')
        : '<li class="wn-empty">아직 기록이 없습니다. 위에 첫 실적을 적어 보세요.</li>';
    };
    draw();
    q('#wnAdd').onclick = () => {
      const t = q('#wnT').value.trim(); if (!t) { q('#wnT').focus(); toast('업무명을 적으세요'); return; }
      const rec = { id: cur ? cur.id : 'w' + Date.now().toString(36), d: q('#wnD').value || isoToday(), cat: q('#wnC').value, t, w: q('#wnW').value.trim(), r: q('#wnR').value.trim(), e: q('#wnE').value.trim() };
      if (!rec.r) toast('성과를 숫자로 적어 두면 평정 · 승진 서류에서 힘이 됩니다', 2600);
      const all = wins.all().filter(x => x.id !== rec.id); all.push(rec);
      if (wins.put(all)) { if (cur) { d.close(false); winsDialog(); return; } ['#wnT', '#wnW', '#wnR'].forEach(s => { q(s).value = ''; }); q('#wnT').focus(); draw(); q('.wn-head b').textContent = `기록 ${all.length}건`; toast('기록했습니다', 1200); }
    };
    if (q('#wnCancel')) q('#wnCancel').onclick = () => { d.close(false); winsDialog(); };
    q('#wnList').addEventListener('click', async e => {
      const ed = e.target.closest('[data-ed]'), del = e.target.closest('[data-del]'), pro = e.target.closest('[data-pro]');
      if (ed) { d.close(false); winsDialog(ed.dataset.ed); }
      if (del) { const ok = await U.askConfirm('이 기록을 지울까요?', '지운 기록은 되돌릴 수 없습니다. (백업 파일이 있으면 가져오기로 살릴 수 있습니다)', '지우기', true); if (ok) { wins.put(wins.all().filter(x => x.id !== del.dataset.del)); draw(); q('.wn-head b').textContent = `기록 ${wins.all().length}건`; } }
      if (pro) { const x = wins.all().find(y => y.id === pro.dataset.pro); if (!x) return; d.close(false); if (!(await U.confirmDiscard())) return; fillNewDoc('적극행정 우수사례', proactiveLines(x)); }
    });
    q('#wnSelf').onclick = async () => {
      const per = q('#wnP').value; const y = new Date().getFullYear();
      const inP = x => { const yy = +(x.d || '').slice(0, 4), mm = +(x.d || '').slice(5, 7); return per === 'all' || (per === 'y' && yy === y) || (per === 'py' && yy === y - 1) || (per === 'h1' && yy === y && mm <= 6) || (per === 'h2' && yy === y && mm >= 7); };
      const sel = wins.all().filter(inP).sort((a, b) => (a.d || '').localeCompare(b.d || ''));
      if (!sel.length) { toast('이 기간에 적어 둔 실적이 없습니다'); return; }
      d.close(false); if (!(await U.confirmDiscard())) return;
      const pl = { y: `${y}. 1. 1.~${y}. 12. 31.`, h1: `${y}. 1. 1.~${y}. 6. 30.`, h2: `${y}. 7. 1.~${y}. 12. 31.`, py: `${y - 1}. 1. 1.~${y - 1}. 12. 31.`, all: '〔평정 기간〕' }[per];
      fillNewDoc('근무성적평정 자기기술서', selfLines(sel, pl));
      toast(`실적 ${sel.length}건으로 자기기술서를 만들었습니다 — 문장을 다듬고 점검(F8)하세요`, 3200);
    };
    q('#wnExp').onclick = () => { const b = new Blob([JSON.stringify({ kind: 'dpv-wins', v: 1, at: Date.now(), list: wins.all() }, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `실적기록장-${isoToday()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
    q('#wnImp').onclick = () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
      inp.onchange = async () => {
        const f = inp.files[0]; if (!f) return;
        try { const j = JSON.parse(await f.text()); const add = Array.isArray(j) ? j : j.list; if (!Array.isArray(add)) throw new Error('실적 기록장 백업 파일이 아닙니다');
          const all = wins.all(); const ids = new Set(all.map(x => x.id)); let n = 0; for (const x of add) if (x && x.id && x.t && !ids.has(x.id)) { all.push(x); n++; }
          wins.put(all); draw(); q('.wn-head b').textContent = `기록 ${all.length}건`; toast(`${n}건을 더했습니다 (같은 기록은 건너뜀)`, 2200);
        } catch (e) { U.tell('가져오지 못했습니다', e.message); }
      };
      inp.click();
    };
  }
  const ymd = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? `${+m[1]}. ${+m[2]}. ${+m[3]}.` : (s || ''); };
  function selfLines(list, period) {
    const L = ['#근무성적평정 자기기술서', '@평정 기간: ' + period + ' / 〔소속 · 직급 · 성명〕', ''];
    const main = list.filter(x => !/교육|표창/.test(x.cat)), edu = list.filter(x => /교육|표창/.test(x.cat));
    L.push('□ 주요 업무 실적');
    for (const x of main) { L.push(`○ ${x.t} (${ymd(x.d)}, ${x.cat})`); if (x.w) L.push('- 추진 내용: ' + x.w); L.push('- 성과: ' + (x.r || '〔숫자로 된 성과〕')); if (x.e) L.push('- 근거: ' + x.e); }
    if (!main.length) L.push('○ 〔주요 실적〕');
    L.push('□ 직무 수행 능력', '○ 〔위 실적에서 드러난 기획력 · 협업 · 전문성을 한두 줄로〕');
    L.push('□ 교육 · 자격 · 표창'); if (edu.length) for (const x of edu) L.push(`○ ${x.t} (${ymd(x.d)})${x.r ? ' — ' + x.r : ''}`); else L.push('○ 〔교육 이수 · 자격 취득 · 표창〕');
    L.push('□ 향후 계획', '○ 〔내년에 이루려는 목표〕');
    return L;
  }
  function proactiveLines(x) {
    return ['#' + x.t, '@' + today() + ' 〔소속 · 성명〕', '', '>한 줄 요약: ' + (x.r ? `${x.t} — ${x.r}` : '〔무엇을 바꿔 누구에게 어떤 이익이 생겼는지〕'), '□ 추진 배경 (문제 상황)', '○ 〔주민 · 현장이 겪던 불편 · 위험을 숫자로〕', '□ 적극행정 내용 (장애 요인과 극복)', '○ ' + (x.w || '〔장애 요인과 극복 과정〕'), '□ 성과 (국민 체감도)', '○ ' + (x.r || '〔전 → 후 비교〕'), '□ 창의성 · 전문성', '○ 〔새로운 방법 · 전문 지식을 쓴 점〕', '□ 중요도 · 난이도', '○ 〔왜 어려웠고 왜 중요한지〕', '□ 확산 가능성', '○ 〔다른 기관에 적용할 수 있는 점〕', '', '붙임  ' + (x.e || '〔근거 자료〕') + ' 1부.'];
  }

  /* =====================================================================
     6. 명령 찾기 (Ctrl+K): 이름 · 초성으로 모든 기능을 찾아 실행
     ===================================================================== */
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const cho = s => Array.from(s).map(c => { const k = c.charCodeAt(0) - 0xAC00; return k >= 0 && k < 11172 ? CHO[Math.floor(k / 588)] : c; }).join('');
  function commands() {
    const A = a => () => U.act(a);
    const c = [
      ['서식으로 새 문서 (보고서 · 계획서 · 공문 · 보도자료 …)', 'filePlus', '', templateDialog, 'template 템플릿 양식 서식', true],
      ['문서 점검 — 공문서 표기 · 쉬운 말 · 띄어쓰기', 'check', 'F8', openCheck, '맞춤법 검사 점검 교정', false, true],
      ['실적 기록장 — 성과 적기 · 자기기술서 만들기', 'star', '', () => winsDialog(), '승진 평정 실적 성과', true],
      ['다음 채울 칸 〔 〕', 'arrowRight', 'Alt+.', () => nextSlot(false), '빈칸 누름틀', true, true],
      ['개조식 단계 내리기 (□ → ○ → - → ·)', 'indentR', 'Alt+Shift+→', () => shiftLevel(1), '수준 개요', true, true],
      ['개조식 단계 올리기', 'indentL', 'Alt+Shift+←', () => shiftLevel(-1), '수준 개요', true, true],
      ['새 문서', 'filePlus', 'Alt+N', A('new'), 'new', true], ['파일 열기', 'folder', 'Alt+O', A('open'), 'open 불러오기'], ['저장', 'save', 'Ctrl+S', A('save'), 'save', true, true], ['다른 이름으로 저장', 'export', 'Alt+V', A('saveAs'), 'save as', true, true],
      ['인쇄 · PDF 저장', 'print', 'Ctrl+P', A('print'), 'print pdf', false, true], ['찾기', 'search', 'Ctrl+F', A('find'), 'find', false, true], ['찾아 바꾸기', 'search', 'Ctrl+H', A('replace'), 'replace 치환', true, true],
      ['글자 모양', 'type', 'Alt+L', A('charDlg'), '글꼴 크기 font', true, true], ['문단 모양', 'paragraph', 'Alt+T', A('paraDlg'), '줄간격 여백 들여쓰기', true, true], ['스타일', 'list', 'F6', A('styleDlg'), 'style', true, true],
      ['표 만들기', 'table', 'Ctrl+N, T', A('table'), 'table', true, true], ['그림 넣기', 'image', 'Ctrl+N, I', A('image'), 'image 사진', true, true], ['문자표', 'symbol', 'Ctrl+F10', A('symbol'), '특수문자 기호', true, true],
      ['쪽 나누기', 'pageBreak', 'Ctrl+Enter', A('pageBreak'), 'page break', true, true], ['편집 용지', 'ruler', 'F7', A('pageDlg'), '여백 용지 가로 세로', true, true], ['쪽 번호 매기기', 'hash', 'Ctrl+N, P', A('pageNum'), 'page number', true, true], ['머리말 · 꼬리말', 'layout', 'Ctrl+N, H', A('headFoot'), 'header footer', true, true],
      ['개요 번호 켜기/끄기', 'listNum', '', A('outline'), '번호 1. 가.', true, true], ['글머리표 켜기/끄기', 'list', '', A('bullet'), 'bullet', true, true],
      ['문서함 (GitHub 보관)', 'lock', '', A('box'), '보관 동기화', true], ['best 문서', 'bookmark', '', A('best'), '레퍼런스 예시'], ['첫 화면', 'back', '', A('home'), 'home 홈'], ['단축키 모음', 'help', 'F1', A('help'), 'help 도움말'],
    ];
    const h = W.doc && H();
    if (h) h.styles.filter(s => s.type !== 'CHAR').slice(0, 12).forEach((s, i) => c.push([`스타일: ${s.name || s.eng}`, 'list', i < 9 ? 'Ctrl+' + (i + 1) : '', () => { applyStyle(s.id); }, 'style ' + (s.eng || ''), true, true]));
    return c.map(([label, ic, kbd, run, kw, admin, needDoc]) => ({ label, ic, kbd, run, kw: kw || '', admin: !!admin, needDoc: !!needDoc })).filter(x => !(GUEST && x.admin) && !(x.needDoc && !editorOpen()));
  }
  function palette() {
    if (document.querySelector('.dlg-bg')) return;
    const r = rng(); const saved = r && inDoc(r.startContainer) ? r.cloneRange() : null;
    const bg = document.createElement('div'); bg.className = 'dlg-bg pal-bg';
    bg.innerHTML = `<div class="dlg pal" role="dialog" aria-label="명령 찾기"><div class="pal-in">${icon('search')}<input id="palQ" type="text" placeholder="하고 싶은 일을 쓰세요 — 예: 점검, 표, ㅈㅈ(저장)" spellcheck="false" autocomplete="off" aria-label="명령 찾기"><kbd>Esc</kbd></div><ul class="pal-list" id="palList" role="listbox"></ul></div>`;
    document.body.appendChild(bg);
    const inp = bg.querySelector('#palQ'), ul = bg.querySelector('#palList');
    const all = commands(); let shown = all, cur = 0;
    const close = back => { bg.remove(); if (back && saved && saved.startContainer.isConnected) { const s = sel(); s.removeAllRanges(); s.addRange(saved); focusFor(saved.startContainer); } };
    const draw = () => {
      const k = inp.value.trim().toLowerCase().replace(/\s+/g, '');
      shown = !k ? all : all.map(x => { const L = (x.label + ' ' + x.kw).toLowerCase().replace(/\s+/g, ''); const i = L.indexOf(k); const ci = cho(L).indexOf(k); return { x, s: i === 0 ? 0 : i > 0 ? 1 : ci >= 0 ? 2 : 9 }; }).filter(o => o.s < 9).sort((a, b) => a.s - b.s).map(o => o.x);
      cur = Math.min(cur, Math.max(0, shown.length - 1));
      ul.innerHTML = shown.length ? shown.map((x, i) => `<li role="option" data-i="${i}" class="${i === cur ? 'on' : ''}" aria-selected="${i === cur}">${icon(x.ic)}<span>${escH(x.label)}</span>${x.kbd ? `<kbd>${escH(x.kbd)}</kbd>` : ''}</li>`).join('') : '<li class="none">맞는 명령이 없습니다</li>';
      const on = ul.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    };
    const run = i => { const x = shown[i]; if (!x) return; close(true); setTimeout(() => x.run(), 0); };
    inp.addEventListener('input', () => { cur = 0; draw(); });
    inp.addEventListener('keydown', e => {
      if (e.isComposing) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); cur = Math.min(shown.length - 1, cur + 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cur = Math.max(0, cur - 1); draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); run(cur); }
      else if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.code === 'KeyK')) { e.preventDefault(); close(true); }
    });
    ul.addEventListener('mousedown', e => e.preventDefault());
    ul.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) run(+li.dataset.i); });
    bg.addEventListener('mousedown', e => { if (e.target === bg) close(true); });
    draw(); inp.focus();
  }

  /* =====================================================================
     단추 · 단축키 연결
     ===================================================================== */
  function toolMenu(btn, keyboard) {
    const items = (GUEST ? [] : [{ icon: 'filePlus', label: '서식으로 새 문서', run: templateDialog }])
      .concat([{ icon: 'check', label: '문서 점검', kbd: 'F8', run: openCheck }])
      .concat(GUEST ? [] : [{ icon: 'arrowRight', label: '다음 채울 칸 〔 〕', kbd: 'Alt+.', run: () => nextSlot(false) }, null, { icon: 'star', label: '실적 기록장', run: () => winsDialog() }])
      .concat([null, { icon: 'search', label: '명령 찾기', kbd: 'Ctrl+K', run: palette }]);
    U.popMenu(btn, items, { alignRight: true, keyboard });
  }
  document.addEventListener('keydown', e => {
    if (document.querySelector('.dlg-bg') || e.isComposing || e.keyCode === 229) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && !e.altKey && !e.shiftKey && e.code === 'KeyK') { e.preventDefault(); e.stopImmediatePropagation(); palette(); return; }
    if (!editorOpen()) return;
    if (e.code === 'F8' && !ctrl && !e.altKey) { e.preventDefault(); e.stopImmediatePropagation(); if (chkOpen) closeCheck(); else openCheck(); return; }
    if (e.key === 'Escape' && chkOpen && !document.querySelector('.hw-menu') && $id('findBar').hidden && !W.cells && !W.selPic) { closeCheck(); return; }
    if (GUEST) return;
    if (e.altKey && !ctrl && !e.shiftKey && (e.code === 'Period' || e.code === 'Comma')) { e.preventDefault(); e.stopImmediatePropagation(); nextSlot(e.code === 'Comma'); return; }
    if (e.altKey && e.shiftKey && !ctrl && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) { e.preventDefault(); e.stopImmediatePropagation(); shiftLevel(e.code === 'ArrowRight' ? 1 : -1); return; }
    if (ctrl && !e.altKey && (e.code === 'NumpadSubtract' || e.code === 'NumpadAdd')) { e.preventDefault(); e.stopImmediatePropagation(); shiftLevel(e.code === 'NumpadAdd' ? 1 : -1); return; }
    if (e.key === 'Enter' && !ctrl && !e.altKey && !e.shiftKey && (inDoc(e.target) || e.target === document.body)) onEnter(e);
  }, true);

  bindCheck();
  const tb = $id('btnTools'); if (tb) tb.addEventListener('click', e => toolMenu(e.currentTarget, e.detail === 0));
  const ck = $id('btnCheck'); if (ck) ck.addEventListener('click', () => { if (chkOpen) closeCheck(); else openCheck(); });
  const hn = $id('hmTpl'); if (hn) hn.addEventListener('click', templateDialog);
  const hw = $id('hmWins'); if (hw) hw.addEventListener('click', () => winsDialog());
  if (GUEST) document.querySelectorAll('[data-admin-work]').forEach(x => { x.hidden = true; });
  window.HwpWork = { templateDialog, openCheck, closeCheck, scan, winsDialog, palette, nextSlot, shiftLevel, wonKo, fillNewDoc, T };
})();
