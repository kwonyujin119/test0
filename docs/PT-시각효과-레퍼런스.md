# PT 시각 효과 레퍼런스 — 「Follow Me」 교안에 쓴 기법

`docs/PT-기법-레퍼런스.md`(구조 · 말하기 · Mayer · Alley)와 겹치지 않게, **눈에 보이는 효과**만 모았습니다.
근거가 약한 것은 약하다고 적었습니다. URL 은 모두 **웹 검색 결과로 확인**한 것입니다(이 세션에서 일부 사이트 본문 열람이 막혀 있었음).

## 1. 기법 표

| 기법 | 핵심 | 근거의 세기 | Follow Me 에 쓴 곳 |
|---|---|---|---|
| **글랜스 테스트 (3초)** — Duarte, *slide:ology* | 발표 화면은 "흘끗 보는 매체". 3초 안에 요점이 읽혀야 한다 | 경험칙(측정된 기준 아님) | 모든 제목을 결론 문장으로. 19장 전/후 비교가 바로 이 기준 |
| **그림 우위 효과** — Paivio, 이중 부호화 | 관련 있는 그림은 글보다 잘 기억된다. 장식용 그림은 오히려 부담 | 효과는 확실, 크기는 작음(수업 실험 약 5%) | 13장 실제 화면 3장, 19장 실제 전/후 화면. 장식 사진은 넣지 않음 |
| **전주의 속성 · 강조 하나** — Few, Knaflic | 색 · 크기 · 위치는 0.25초 안에 눈에 들어온다. 강조는 한 곳, 나머지는 회색 | 지각 연구 기반, 강함 | 주황은 "지금 볼 곳"에만: 6장 표의 칸 하나, 9장 여섯 칸 중 하나, 15장 마지막 회차 |
| **CRAP (대비 · 반복 · 정렬 · 근접)** — Robin Williams | 크기 · 색 대비로 순서를, 반복으로 통일감을, 보이지 않는 선으로 질서를, 가까이 두어 묶음을 | 디자인 실무 원칙(게슈탈트와 같은 뿌리) | 왼쪽 여백 120px 정렬, 위쪽 라벨 · 진행 표시 · 제목 위치를 모든 장에 반복 |
| **게슈탈트 — 근접 · 유사 · 전경/배경** | 가까운 것, 같은 색은 한 무리로 보인다 | 지각 원리, 강함 | 14장 네 조각 색 = 오른쪽 문장의 같은 색 구절. 카드 안에 묶어 보여 주기 |
| **공간 근접 원리** — Mayer (Beege 등 2019 재검증) | 그림과 그 설명은 붙여 둔다. 너무 붙이거나 멀면 효과가 줄 수 있음 | 강함(경계 조건 있음) | QR 바로 아래 "찍으면 복사 페이지가 열립니다", 전/후 그림 바로 아래 꼬리표 |
| **신호 주기 · 진행 표시** — Mayer | 지금 어디인지 알려 주는 단서가 이해를 돕는다 | 강함 | 오른쪽 위 1 · 2 · 3 진행 알약, 구역 장의 큰 번호 01 · 02 · 03 |
| **분할 · 한 번에 하나** — Mayer 분할 원리 | 한꺼번에 보이면 앞질러 읽는다. 클릭마다 하나씩 | 강함 | 카드 · 단계 · 회차를 클릭 단계로 공개(5 · 7 · 9 · 12 · 15 · 20장) |
| **큰 숫자** | 숫자를 문장에 묻지 말고 화면의 주인공으로 | 실무 원칙 | 2장 「0 줄 · 2 개」, 21장 「3 · 2 · 4」 |
| **명암 리듬** | 밝은 장(내용)과 어두운 장(전환 · 강조)을 번갈아 분위기 전환 신호로 | 실무 원칙 | 표지 · 훅 · 구역 · 정리 = 먹색, 내용 = 아이보리 |
| **여백** — Duarte, Reynolds | 여백은 숨 쉴 곳. 빈 곳이 있어야 중요한 것이 보인다 | 실무 원칙 | 한 장 글자 150자 안팎, 카드 사이 36px, 아래쪽 여백 남김 |
| **대비 (WCAG 1.4.3)** | 일반 글 4.5:1, 큰 글 3:1. 프로젝터는 더 흐려지므로 여유 있게 | 표준 | 밝은 바탕의 주황은 `#C2410C`(4.8:1), 어두운 바탕은 `#FF6B35`(6.5:1). 편집기 [점검]으로 대비 경고 0 확인 |
| **글자 크기 하한** | 뒷자리 기준 본문 28px 이상, 어떤 글도 24px 아래로 내리지 않는다 | 경험칙 | 모든 보이는 장 24px 이상(숨긴 부록 장만 19px) |
| **도식으로 바꾸기** | 순서 → 화살 블록, 순환 → 원 세 개, 비교 → 좌우 | 실무 원칙 | 7장 가입 순서(화살 블록), 12장 결과-피드백-반복(순환), 14 · 19장(좌우 비교) |
| **움직임은 뜻이 있을 때만** — Tversky 등 「애니메이션이 도움이 되는가」 | 꾸밈용 움직임은 이해를 돕지 않는다. 순서 · 방향을 보여 줄 때만 | 연구 결과 엇갈림 → 절제 | 전환은 페이드(구역 장만 확대). 등장은 위로 · 왼쪽(읽는 방향) |
| **QR 크기** — 청중 참여 도구(Slido · Mentimeter 등) 실무 | 뒷줄에서도 찍히게 크게, 짧은 주소를 함께 | 실무 원칙 | 10장 QR 540px(슬라이드 높이의 절반), 아래에 PC 용 주소 |

## 2. 일부러 하지 않은 것

- **장식용 사진 · 스톡 이미지**: 그림 우위 효과는 "관련 있는 그림"일 때만 생깁니다. 실제 도구 화면만 썼습니다.
- **글자를 한꺼번에 날아오게 하는 효과 · 화려한 전환**: 근거가 약하고 시선을 뺏습니다.
- **강조색 두 가지 이상**: 14장의 네 색은 예외로, "네 조각을 같은 색끼리 맞춰 보는" 목적이 있어서 넣었습니다.

## 3. 출처 (모두 검색 결과로 확인)

- 글랜스 테스트 · 여백 — [Garr Reynolds 설계 팁](https://garrreynolds.com/design-tips), [Duarte slide:ology](https://duarte.com/books/slideology/), [Designing Effective Slides 요약](https://thinkinsights.net/insights/designing-effective-slides)
- 그림 우위 효과 — [Gary Fisk 2025 수업 실험](https://garyfisk.mataroa.blog/blog/2025-powerpoint-at-the-psychonomic-society-do-students-learn-more-from-text-or-images/), [Colby CogBlog](https://web.colby.edu/cogblog/?p=2069), [개념 정리](https://concepts.dsebastien.net/concept/picture-superiority-effect/)
- 전주의 속성 — [IMT Atlantique: 강조할 곳에 시선 모으기](https://formations.imt-atlantique.fr/data_storytelling/focus_concept.html), [UX Collective](https://uxdesign.cc/preattentive-attributes-of-visual-perception-and-their-application-to-data-visualizations-7b0fb50e1375)
- CRAP · 게슈탈트 — [Presentation Zen: 대비 · 반복 · 정렬 · 근접](https://presentationzen.com/blog/design-fundamentals-contrast-repetition-alignment-proximity), [게슈탈트로 다시 디자인한 PPT (2011)](https://core.ac.uk/download/12007531.pdf)
- 공간 근접 — [Beege 등 2019, Frontiers in Education](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2019.00086/pdf)
- 대비 — [WebAIM Contrast](https://webaim.org/articles/contrast/), [W3C Understanding 1.4.3](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html)
- QR 참여 — [Poll Everywhere: 행사용 투표 도구](https://www.polleverywhere.com/use-cases/best-polling-tools-conferences-and-events)
- Tversky 등(2002) 「Animation: can it facilitate?」 — 일반 지식으로 인용, 이번에 URL 확인 안 함

## 4. 요금 표(6장) 근거와 주의

2026년 11월 검색 기준이며 **공식 요금 페이지를 직접 열어 보지는 못했습니다.** 강의 전날 다시 확인하세요.
- Claude: 무료에는 Claude Code 가 없고 Pro 월 $20(연 결제 월 $17), Max 월 $100 · $200 — 제3자 정리 여러 곳이 일치([예](https://www.lindy.ai/blog/claude-pricing)). Max 이름 · 단계는 출처마다 조금 다름.
- GitHub: 무료 / Pro 월 $4 — [GitHub 요금제 문서](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)
- Cloudflare: 무료로 빌드 월 500회, 정적 요청 무제한 / Workers Paid 월 $5부터 — [Pages 한도](https://developers.cloudflare.com/pages/platform/limits), [Workers 요금](https://developers.cloudflare.com/workers/platform/pricing/)
