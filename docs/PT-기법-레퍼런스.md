# PT 기법 · 디자인 레퍼런스

`decks/소방 교육 훈련 개선판.json`을 만들 때 쓴 원칙을 정리했습니다. 근거가 약한 것은 약하다고 따로 적었습니다.

## 1. 구조 — 무엇을 어떤 순서로 말할 것인가

| 기법 | 핵심 | 개선판에 적용한 곳 |
|---|---|---|
| **콜드 오픈** | 인사·소개 전에 가장 강한 장면이나 질문으로 시작해 주의를 잡는다 | 1장 「42초」. 화성 사례(28장)에서 다시 꺼내 매듭짓는다 |
| **스파크라인** (Nancy Duarte, *Resonate*) | 지금의 모습(what is)과 바뀐 모습(what could be)을 번갈아 보여 긴장을 만들고, 마지막은 바뀐 모습으로 끝낸다 | 위험·사례(현실) ↔ 훈련·To Do(바뀐 모습) → 맺음 「오늘도 아무 사건이 없었습니다」 |
| **3의 규칙** | 사람은 세 가지까지 잘 기억한다 | 「오늘 가져갈 3가지」(법·사람·습관), 사례 교훈 3가지, 행동 3가지 |
| **처음에 말하고, 말하고, 다시 말한다** | 로드맵 → 본론 → 요약 | 4장 로드맵 → 5부 본론 → 31장 교훈 요약 |
| **행동 요청(Call to Action)** | 끝은 감상보다 기한이 있는 구체적 행동으로 맺는다 | 35장 「다음 주까지 이 세 가지」 |
| **부록 슬라이드** | 세부 자료는 본편에서 빼 숨겨 두고, 질문이 나오면 꺼낸다 | 원본 사례 표 6장·과태료 표·자위소방대 표를 숨김 부록으로 둠 |

## 2. 슬라이드 한 장 — 어떻게 보여줄 것인가

| 원칙 | 근거 | 개선판 적용 |
|---|---|---|
| **주장-근거 구조** (Michael Alley) | 제목에 문장으로 주장을 쓰고(왼쪽 정렬, 두 줄 이내), 본문은 그림·사진·그래프로 근거를 댄다. 연구에서는 일주일 뒤 이해도와 기억이 더 좋고 인지 부하가 더 낮았다. 다만 주된 연구가 제안자 공동 연구이고 반론도 있다(Farkas) | 모든 내용 장의 제목을 「교육」 같은 단어 대신 「교육은 머리가 알게 하고, 훈련은 몸이 하게 한다」 같은 문장으로 바꿈 |
| **간결성** (Mayer 멀티미디어 학습) | 꾸밈용 글·그림·소리를 빼면 학습이 좋아진다(23개 실험 중 23개 지지, 중앙 효과크기 0.86) | 사례 장을 정보 표 9줄 → 큰 숫자 1개 + 문장 1개 + 사실 3줄로 줄임 |
| **신호 주기** (Mayer) | 구조를 보여주는 단서(강조색·화살표·진행 표시)가 학습을 돕는다(효과크기 0.69) | 구분 장마다 WHAT·WHY·HOW·CASE·TO DO 진행 막대, 강조색은 주황 하나만 |
| **중복 피하기** (Mayer) | 말로 할 내용을 화면에 그대로 쓰면 오히려 방해가 된다(빠르게 진행하는 강의일 때) | 설명은 발표자 노트로 옮기고 화면에는 핵심만 |
| **한 번에 하나씩** | 한꺼번에 다 보이면 청중이 앞질러 읽고 말을 듣지 않는다 | 카드·사실·체크리스트를 클릭 단계로 하나씩 공개 |
| **큰 숫자** | 통계를 문장에 묻지 말고 그 자체를 화면의 중심으로 | 42초 · 0:20 · 47명 · 1분 · 70개 동 · 20시간 |
| **대비** | 같은 조건에서 결과가 달라진 비교가 가장 설득력 있다 | 제천 「남탕 0 : 여탕 20」 |
| **퀴즈형 공개** | 답을 먼저 추측하게 하면 기억에 더 오래 남는다 | 과태료 장: 「얼마일까요?」 → 100 · 200 · 300 차례로 공개 |

## 3. 디자인 체계

- **명암 리듬:** 개념·방법 장은 밝은 아이보리, 충격·사례 장은 짙은 먹색. 배경이 바뀌는 순간 청중에게 분위기가 바뀌었다는 신호가 된다.
- **색:** 주황 하나(밝은 배경 `#E4521B`, 어두운 배경 `#FF6B35`). 사망자 수에만 빨강(`#FF3B30`). 통보는 파랑, 피난은 초록(소화전·유도등 색 관례).
- **글자:** 프리텐다드 하나로 통일. 크기는 큰 숫자 220~420 / 제목 54 / 본문 28~36. 무대에서 가장 뒤 좌석 기준으로 28px보다 작게 쓰지 않는다.
- **격자:** 왼쪽 여백 120px, 카드 사이 30px, 3열·4열 벤토 격자.
- **2025~2026 경향** (템플릿 업체 블로그 기준이라 참고만): 어두운 배경, 아주 큰 글자, 숫자 중심 시각화, 벤토 격자.

## 4. 말하기 — 자료보다 중요한 것

- 발표자 노트에 장마다 **시간표(약 43분)와 할 말**을 적었습니다. 발표 화면에서 노트를 켜고 연습하세요.
- **질문으로 참여시키기:** 「소화기 핀을 실제로 뽑아본 분?」, 「우리 피난유도팀, 지금 이름을 댈 수 있습니까?」
- **침묵 3초:** 42초, 0 : 20, 맺음 문장 뒤에.
- **리허설:** 소리 내어 3회 이상. 영상 5곳은 재생 시간을 재서 전체 시간을 다시 맞추세요.

## 출처

- Michael Alley, assertion-evidence 연구 — [Penn State 연구 목록](https://writing.engr.psu.edu/research.html), [Garner & Alley 2013 (IJEE)](https://www.ijee.ie/articles/Vol29-6/23_ijee2791ns.pdf), [WashU CTL 요약](https://ctl.wustl.edu/in-powerpoint-its-the-headline-that-makes-the-difference/)
- 반론 — [Farkas, Assessment of Alley's Slide Design](https://faculty.washington.edu/farkas/dfpubs/Farkas-Assessment%20Of%20Alleys%20Slide%20Design.pdf)
- Richard Mayer 멀티미디어 학습 원칙 — [Cambridge Handbook: 간결성·신호·중복](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/CD5B7AE1279A9AB81F8EEBB53DBEC86E), [Mayer 2020 원칙 요약](https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf)
- Nancy Duarte, *Resonate* · 스파크라인 — [Duarte 블로그](https://www.duarte.com/blog/move-presentation-audience-with-story-techniques-in-presentations/)
- 디자인 경향 — [Slidesgo 2026 Trends](https://slidesgo.com/slidesgo-school/ai-presentations/presentation-design-trends-2026), [Microsoft 365 Life Hacks](https://www.microsoft.com/en-us/microsoft-365-life-hacks/?p=9589)
- 소방안전교육 교안 구성 — [위키독스: 소방안전교육 교안 프롬프트 구조](https://wikidocs.net/326083)
