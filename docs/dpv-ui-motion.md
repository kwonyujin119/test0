# DPV 인터랙션 레이어 — 움직임 · 안내 부품 기준

기준일: 2026-11-20. 사용자가 보내 준 기법 18가지(스크롤 모션 9 + 컴포넌트 비교 9)를 DPV 전체(DOCUMENT · PRESENTATION · VIDEO · SECRET)에 맞춰 골라 썼습니다. 이 문서에는 어디에 썼는지, 왜 어떤 것은 쓰지 않았는지, 근거가 무엇인지를 정리했습니다.

- 구현 파일: `app/motion.js`(모든 화면에서 불러옴), `app/ui.css` 끝의 「DPV 인터랙션 레이어」 구역, SECRET 전용 적용은 `app/secret/secret.css` 끝.
- **확인 범위:** 조사 세션의 네트워크 정책 때문에 nngroup.com · m3.material.io 의 원문은 열지 못했습니다. 아래 URL 은 모두 **검색 결과로만 확인**한 것이고, 수치는 검색 결과에 실제로 나온 값만 적었습니다.

## 먼저 짚을 점: 18가지를 모두 쓰지는 않았습니다

DPV 는 랜딩 페이지가 아니라 매일 반복해서 쓰는 업무 도구입니다. 연구들이 공통으로 말하는 것은 "자주 보는 화면일수록 움직임은 짧고 적게"입니다. 그래서 패럴랙스 · 텍스트 리빌 · 무한 스크롤은 쓰지 않았습니다. 움직임을 줄이도록 설정한 기기(`prefers-reduced-motion`)에서는 나타나기 · 코치마크 · 시트 움직임을 모두 끕니다(WCAG 2.3.3).

## 기법별 적용

### A. 스크롤 · 모션

| 기법 | DPV 적용 | 이유 · 수치 |
|---|---|---|
| 01 페이드 업 | **적용.** 작업장 카드, 교안 · 문서 · 영상 목록 카드, SECRET 대시보드 카드에 씁니다. 처음 볼 때 한 번만, 240–280ms, 8px | NN/g: 보조 콘텐츠에만, 한 번만, 500ms 넘으면 느림. 같은 탭을 다시 열거나 다시 그릴 때는 움직이지 않음 |
| 02 패럴랙스 | **쓰지 않음** | 빨리 스크롤하면 못 읽고, 시선을 빼앗고, 멀미를 일으킴. 사용성 개선 근거 없음(NN/g) |
| 03 스티키 헤더 | **적용.** SECRET 각 화면의 제목 · 도구 줄이 위에 붙습니다. 내렸을 때만 경계선과 그림자가 생깁니다. 목록 화면(교안 · 문서 · 영상)은 이미 적용돼 있었음 | NN/g: 긴 화면에서 도구를 계속 쓸 때. 키를 작게, 반투명이면 대비 유지 |
| 04 가로 스크롤 | 새로 넣지 않음. 슬라이드 · 클립 줄은 이미 사용자가 직접 넘기는 방식 | 자동 회전 캐러셀은 배너로 오인돼 무시됨(NN/g). 5초 넘게 움직이면 멈춤 수단 필요(WCAG 2.2.2) |
| 05 스케일 인 | **적용(기존 유지).** PC 모달 · 메뉴가 살짝 커지며 열림(pop-in 0.18s) | 열린 자리를 보여 주는 용도로만. 반복해서 여는 패널에는 쓰지 않음 |
| 06 텍스트 리빌 | **쓰지 않음** | 본문 · 작업 글에는 맞지 않음(NN/g: 스크롤 연출은 보조 콘텐츠만) |
| 07 스태거 | **적용.** 페이드 업과 함께 카드마다 35ms 간격, 최대 6장까지만 지연 | Material: 한꺼번에 나타나지 않게 약간의 시차. Flutter 예제 50ms. 자주 갱신되는 표 · 시세에는 쓰지 않음 |
| 08 진행 바 | **적용.** 읽기 진행 바(위쪽 3px)를 SECRET 의 긴 화면과 단축키 안내에 씁니다. 작업 진행률은 기존 내보내기 진행 표시를 유지 | 긴 읽기에만. 10초 넘는 작업은 퍼센트 진행 바(NN/g) |
| 09 무한 스크롤 | **쓰지 않음** | 교안 · 문서 · 종목처럼 찾기 목적의 목록에는 맞지 않음. 푸터에 닿지 못함(NN/g) |

### B. 컴포넌트 고르기

| 비교 | DPV 기준 | 적용한 것 |
|---|---|---|
| 01 팝업 vs 모달 | 모달은 꼭 결정이 필요한 때만. Esc · 취소 단추로 닫힘 | 확인 창을 같은 모양의 모달로 통일했습니다(`uiConfirm`). 결과를 쓴 단추 이름("지우기", "모두 지우기")을 씁니다 |
| 02 토스트 vs 스낵바 | 단순 알림은 토스트(2.2초). 되돌리기가 있으면 스낵바(6초) | 기본 시간을 1.8초에서 2.2초로, 되돌리기가 있을 때는 5초에서 6초로 늘렸습니다(Material: 4–10초). `role="status"` 는 그대로 유지 |
| 03 툴팁 vs 팝오버 | 툴팁은 아이콘 단추 이름처럼 짧은 글만. 단추 · 설명이 필요하면 팝오버(코치마크) | 브라우저 기본 툴팁 대신 같은 모양의 툴팁을 씁니다. 0.45초 뒤에 뜨고, 키보드 초점에서는 바로 뜨고, Esc 로 닫히며, 툴팁 위로 마우스를 올려도 사라지지 않습니다(WCAG 1.4.13). 휴대폰에는 띄우지 않습니다 |
| 04 바텀시트 vs 드로어 | 휴대폰의 보조 창은 바텀시트. 손잡이와 취소 단추를 둘 다 둠 | **휴대폰(640px 이하)의 모든 모달이 바텀시트로 바뀝니다.** 아래 단추 줄은 고정되어 엄지가 닿고, 손잡이를 아래로 끌어 닫을 수 있습니다(그 창이 바깥 누르기로 닫히는 창일 때만) |
| 05 배너 vs 푸시 | 배너는 앱 안에서 중요한 일(KIS 등록 등). 푸시는 앱을 닫았을 때 행동이 필요한 일 | 배너는 기존 것을 유지합니다. 푸시(손절가 이탈 알림)는 SECRET 다음 세션의 할 일 |
| 06 배지 vs 닷 | 숫자가 중요하면 배지(관심 종목 4 · 일지 3). "확인할 것 있음"만이면 닷 | SECRET 「수익 엔진」 메뉴에 상태 닷을 붙였습니다. 새 매매 크기가 절반이면 주황, 중지면 빨강입니다. 마우스를 올리면 이유가 툴팁으로 나옵니다 |
| 07 온보딩 vs 코치마크 | 긴 투어는 하지 않음. 새 기능 하나를 맥락에서 한 번만 | 코치마크 4개(SECRET 수익 엔진, DOCUMENT 서식 · 문서 점검 F8 · Ctrl+K, VIDEO 올리기, PRESENTATION 점검)를 넣었습니다. 대상이 화면에 보일 때 처음 한 번만 뜨고, 한 번에 한 장만 나옵니다 |
| 08 딤 vs 블러 | 데이터 위에는 딤을 주로 쓰고 블러는 약하게(가독성) | 기존 딤 + 1.5px 블러를 유지합니다. 강한 유리 효과는 쓰지 않습니다 |
| 09 알럿 vs 토스트 | 되돌릴 수 없는 삭제만 확인 창. 알림 · 성공은 토스트 | 브라우저 기본 `confirm` · `alert` 6곳을 같은 모양의 창이나 토스트로 바꿨습니다(GitHub 토큰 지우기 · 연결 실패, 영상 그림 · AI 목소리 지우기, 발표 타이머 초기화, 발표 기록 지우기). 저장 충돌처럼 동기 흐름에 묶인 확인 창은 동작을 바꿀 위험이 있어 그대로 두었습니다(다음 할 일) |

## 레퍼런스

| 주제 | 출처 | 핵심 |
|---|---|---|
| 애니메이션 길이 | https://nngroup.com/articles/animation-duration · https://www.nngroup.com/articles/animation-purpose-ux/ | 대부분 100–500ms. 자주 보는 것일수록 짧고 미묘하게 |
| 스크롤 연출 | https://www.nngroup.com/articles/scroll-animations/ · https://www.nngroup.com/articles/scroll-fading-101/ | 보조 콘텐츠에만, 한 번만, 500ms 넘으면 느림 |
| 패럴랙스 | https://www.nngroup.com/articles/parallax-usability/ | 가독성 · 멀미 문제, 개선 근거 없음 |
| 스티키 헤더 | https://www.nngroup.com/articles/sticky-headers/ | 작게, 쓸모 있을 때만 |
| 캐러셀 | https://www.nngroup.com/articles/designing-effective-carousels/ · https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide | 자동 회전 피하기, 멈춤 수단 |
| 스태거 | https://m1.material.io/motion/choreography.html · https://docs.flutter.dev/cookbook/effects/staggered-menu-animation | 약간의 시차(예제 50ms) |
| 진행 표시 | https://nngroup.com/articles/progress-indicators | 10초 넘으면 퍼센트 진행 바 |
| 무한 스크롤 | https://www.nngroup.com/articles/infinite-scrolling/ | 찾기 목적의 목록에는 페이지 · 더 보기 |
| 모달 | https://nngroup.com/articles/modal-nonmodal-dialog/ · https://www.nngroup.com/articles/accidental-overlay-dismissal/ | 꼭 필요할 때만, 명시적 취소 |
| 스낵바 | https://material.io/components/snackbars · https://w3.org/WAI/WCAG22/Techniques/aria/ARIA22 | 4–10초, 되돌리기, role=status |
| 툴팁 | https://nngroup.com/articles/tooltip-guidelines · https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus | 필수 정보 넣지 않기, Esc · 마우스 올리기 · 유지 |
| 바텀시트 | https://www.nngroup.com/articles/bottom-sheet/ · https://developer.apple.com/design/human-interface-guidelines/sheets.md | 휴대폰 보조 화면, 닫기 수단 분명히 |
| 배지 · 닷 | https://nngroup.com/articles/indicators-validations-notifications | 관련 요소 옆, 남발 금지 |
| 코치마크 | https://www.nngroup.com/articles/mobile-tutorials/ · https://www.nngroup.com/articles/mobile-instructional-overlay/ | 튜토리얼 본 쪽 91% vs 건너뛴 쪽 94% — 짧게, 하나씩 |
| 딤 · 블러 | https://www.nngroup.com/articles/glassmorphism/ · https://developer.apple.com/design/human-interface-guidelines/materials.md | 블러만으로 가독성 보장 안 됨 |
| 알럿 | https://developer.apple.com/design/human-interface-guidelines/alerts.md · https://www.nngroup.com/articles/confirmation-dialog/ | 되돌릴 수 없는 작업에만, 결과를 쓴 단추 이름 |
| 동작 줄이기 | https://w3.org/WAI/WCAG21/Understanding/animation-from-interactions · https://web.dev/articles/prefers-reduced-motion | 비필수 애니메이션은 끌 수 있게 |
| 국내 기준 | https://krds.go.kr/html/eng/utility/utility_04.html | KRDS 는 KWCAG 2.2 · WCAG 2.1 기반(컴포넌트별 세부 지침은 찾지 못함) |

## 쓰는 법 (개발 메모)

- **화면(탭)을 바꿀 때:** `DPV.view(그 화면 요소)` 를 부르면 처음 열 때만 카드가 나타나는 효과가 붙습니다.
- **카드가 아닌 요소에 효과를 줄 때:** 요소에 `data-reveal` 을 붙입니다.
- **확인 · 알림 창:**
  ```js
  await uiConfirm('제목', '설명', '결과 단추 이름', 위험하면 true)
  await uiAlert('제목', '설명')
  ```
- **새 기능 안내:** `motion.js` 의 `TOURS` 에 `[아이디, [{ el, title, text, keys }]]` 를 넣습니다. 한 번에 한 장만 넣으세요. 다시 보려면 `DPV.resetCoach()` 를 부릅니다.
- **읽기 진행 바:** 긴 문서 페이지는 `<body data-progress>` 를 붙이면 나옵니다. SECRET 의 `.sc-page` 는 자동입니다.

## 다음 할 일

1. 편집기 저장 충돌의 확인 창(`app/editor.js`)을 같은 모양의 창으로 바꿉니다. 저장 흐름을 비동기로 바꿔야 해서 따로 시험이 필요합니다.
2. 일상적인 삭제(슬라이드 · 클립 · 노트)를 확인 창 없이 바로 지우고, 스낵바의 [되돌리기] 로 되살리게 바꿉니다(Apple · Material). 작업장별 되돌리기 구조를 확인해야 합니다.
3. SECRET 시세 영역에 자동 갱신 멈춤 단추를 둡니다(WCAG 2.2.2 — 주가가 예로 나옴).
4. 영상 내보내기 진행을 퍼센트 진행 바로 바꾸고 남은 시간을 표시합니다.

---

# 2차 개편 (2026-11-25): AI 모션 · 탭 바 · UI/UX 트렌드

조사 에이전트 3개의 결과를 바탕으로 했습니다. 막힌 사이트가 많아서 developer.apple.com · developer.android.com · GitHub 원본(androidx 토큰, KRDS 코드 키트, WCAG · MDN 소스)만 본문까지 확인했고, 나머지는 **검색 결과로만 확인**했습니다.

## 먼저 짚을 점: 유행을 그대로 따르지 않았습니다

- **유리 효과(Liquid Glass):** NN/g 가 "Liquid Glass Is Cracked" 에서 가독성 문제를 지적했고, Apple 도 iOS 26.1 에 불투명 옵션을 더했습니다. 그래서 탭 바에만, 거의 불투명하게(96%) 씁니다. 대비를 높이도록 설정한 기기에서는 완전히 불투명하게 합니다.
- **보라색 그라데이션과 빛나는 AI 표현:** "가장 알아보기 쉬운 AI 티"라는 비판이 있어, AI 강조는 **화면당 한 곳**만 둡니다. 색도 보라색이 아니라 **작업장 색**을 씁니다.
- **떠 있는 캡슐형 탭 바, 스크롤하면 숨는 탭 바, 가운데 큰 버튼(FAB), 진동(햅틱):** 쓰지 않습니다. 근거는 HIG "탭 바는 이동용이고 늘 보여야 한다", iOS Safari 의 진동 API 미지원입니다.

## AI 모션

| 기법 | 적용 | 근거 |
|---|---|---|
| 테두리 빛 회전(conic + `@property`) | AI 가 일하는 동안 **입력창 한 곳**에만(SECRET 대화 입력창). AI 단추는 마우스를 올렸을 때 한 바퀴만 | 화면당 강조 1요소(Morningstar AI 디자인, "AI design slop" 비판) |
| 글자 반짝임(shimmer) | "국내 뉴스 하는 중"처럼 **무엇을 하는지** 쓴 글자에만 | Fluent 2 대기 UX: 3초 넘으면 단계 문구로 · 구체적으로 쓰기(Smashing 2026-05) |
| 스트리밍 커서 | 깜빡이는 막대 대신 작업장 색 점이 숨 쉬듯 | 스트리밍 커서 컴포넌트 사례 |
| 답이 다 나왔을 때 | 한 번 가볍게 자리 잡기(opacity · transform 만 씀, blur 는 쓰지 않음) | Chrome: blur 애니메이션은 느림 · transform/opacity 만(web.dev) |
| 화면낭독기 | 스트리밍 본문의 `aria-live` 를 없애고, "답을 쓰는 중 / 답이 나왔습니다"만 따로 알림 | 스트리밍 본문을 live 영역에 두면 조각을 반복해서 읽음(azukiazusa · tianpan) |
| 반짝이 아이콘 | **글자 라벨이 있는 단추만** AI 단추로 표시 | NN/g "AI sparkles icon problem" |
| 동작 줄이기 | 위의 움직임을 모두 멈춤 | WCAG 2.3.3 · C39 |

## 탭 바 v2

| 항목 | 규격 | 근거 |
|---|---|---|
| 높이 | 64px + 안전 영역 | M3 Expressive 짧은 바 64dp(androidx 토큰) · MDN env() |
| 라벨 | 늘 표시, 11.5px | HIG "라벨 포함" · NN/g 아이콘 라벨. M3 AUTO(선택된 탭만 라벨)는 따르지 않음 |
| 활성 표시 | 알약 56×32 + 채운 타일(진한 작업장 색). 색만으로 구분하지 않음 | M3 활성 표시 56×32dp · WCAG 1.4.11(3:1) |
| 전환 | 알약이 **이전 작업장 자리에서 미끄러져** 옴. 작업장 사이는 View Transitions 로 부드럽게 바뀌고, 탭 바는 제자리에 남음 | 맥락 유지 · 동작 줄이기면 바로 |
| 숨김 | 스크롤해도 숨기지 않음 | HIG "섹션을 오갈 때 탭 바가 보여야 한다" |
| 닷 | SECRET 수익 엔진이 새 매매 "절반"(주황) · "중지"(빨강)일 때 SECRET 탭에 점. 화면낭독기 이름에도 덧붙임 | M3 small badge · HIG "꼭 알아야 할 것만" |
| 마크업 | `nav` 안 링크 + `aria-current="page"`(tablist 쓰지 않음) | WAI-ARIA APG · MDN · KRDS |
| SECRET 탭 | 관리자에게만 보임(기존 유지) | HIG 는 숨기지 말라고 하지만, SECRET 은 사용자가 정한 비공개 작업장이라 예외 |

## UI/UX

| 패턴 | 적용 | 비고 |
|---|---|---|
| 작업장 사이 부드러운 전환 | `@view-transition { navigation: auto; }` — 지원하는 브라우저(Chrome · Edge 126+, Safari 18.2+)에서만. 나머지는 지금처럼 바로 바뀜 | iOS 홈 화면 앱(standalone)에서 되는지는 실기기로 확인 필요 |
| 명령 찾기(Ctrl+K) | 작업장 이동 · 이 화면의 메뉴 · 화면 밝기 · 단축키 · 새 기능 안내 다시 보기. 초성 검색(ㅁㅅ → 문서) | 편집기 · 문서 · 영상 작업장은 Ctrl+K 를 이미 자기 기능으로 써서 제외 |
| `?` 키 | 단축키 안내 열기(목록 화면에서, 글을 쓰는 중이 아닐 때) | 키보드 우선 UX(Linear · Raycast) |
| 대비 높이기 | 대비를 높이도록 설정한 기기에서는 탭 바를 불투명하게 | `prefers-contrast` 는 주요 브라우저 지원. `prefers-reduced-transparency` 는 Safari 미지원이라 기본값을 불투명에 가깝게 둠 |

## 이번에 하지 않은 것 (효과는 있지만 화면별 설계가 필요)

1. **빈 상태 통일:** 무엇이 비었는지 + 왜 + 다음 행동 단추. 로딩 중에 "없음"이 뜨지 않게.
2. **로딩 규칙 통일:** 1초 미만은 표시 없음 · 몇 초는 스켈레톤 · 오래 걸리면 퍼센트와 남은 시간.
3. **`light-dark()` 로 다크 모드 토큰 정리**와 차트 색 대비 재검증.
4. **휴대폰에서 명령 찾기 여는 단추:** HIG 는 검색을 탭 5개와 분리된 단추로 두라고 함. 탭 바가 꽉 차 있어 자리를 정해야 함.
5. **SECRET 대시보드 벤토 정리:** 타일 6~9개 이내, 크기로 중요도 표시.
