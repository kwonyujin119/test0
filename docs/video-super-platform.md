# VIDEO 슈퍼 플랫폼 — 레퍼런스 · 감사 · 우선순위

작성 2026-11-11. 대상 파일: `video.html`, `videos.html`, `app/video/*`.

목표는 기능을 늘리는 것이 아니라, 영상 하나를 **편집 → 쇼츠로 만들기 → 썸네일 → 올리기** 까지 끊김 없이 끝내는 흐름입니다. 수익은 이 흐름을 꾸준히 반복해야 생깁니다.

## 1. 레퍼런스

> 확인 방법: 이 세션의 네트워크에서는 support.google.com · developer.mozilla.org 같은 공식 페이지를 직접 열 수 없었습니다. 그래서 **모든 행이 "검색 결과로만 봄"** 입니다. URL 은 검색 결과에 나온 것만 적었습니다. 수치를 결정에 쓰기 전에 공식 페이지를 한 번 직접 열어 보세요.

| 이름 | 무엇이 뛰어난가 | 우리 도구에 옮길 점 | URL | 확인 |
|---|---|---|---|---|
| CapCut 자동 자막 | 음성 인식으로 단어 단위 타이밍 자막을 자동 생성 | 자막 트랙을 단어 단위 타이밍 데이터로 저장(나중에 강조 효과 가능) | https://www.capcut.com/resource/auto-captions-ai-video-editor | 검색 결과로만 봄 |
| CapCut 자막 템플릿 | 글꼴·색·애니메이션 묶음 프리셋으로 자막 스타일 한 번에 적용 | 자막 스타일 프리셋 5~10개(쇼츠용 굵은 외곽선 등) 제공 | https://www.capcut.com/resource/top-10-premium-stylish-caption-templates-for-social-media-success | 검색 결과로만 봄 |
| CapCut Auto Reframe | 피사체를 찾아 다른 비율로 자동 재구성 | 16:9→9:16 변환 시 수동 "중심점 키프레임"부터 시작 | https://www.capcut.com/features/auto-reframe-video | 검색 결과로만 봄 |
| DaVinci Resolve Cut 페이지 | 위 전체/아래 확대 이중 타임라인, Source Tape(모든 소스를 한 테이프처럼), Smart Insert | 휴대폰에서 전체 미니맵 + 확대 타임라인 2단 구성 | https://www.premiumbeat.com/blog/davinci-resolve-16-cut-page-review/ | 검색 결과로만 봄 |
| Resolve 단축키 | A 선택, B 블레이드, T 트림, Shift+Backspace/Delete 리플 삭제 | 도구 전환 단축키(A/B)와 리플 삭제를 동일하게 | https://www.storyblocks.com/resources/blog/davinci-resolve-keyboard-shortcuts | 검색 결과로만 봄 |
| Premiere Pro 기본 단축키 | Ctrl/Cmd+K Add Edit(재생헤드에서 자르기), Q/W 리플 트림 | Ctrl/Cmd+K 자르기, Q/W "앞/뒤를 재생헤드까지 잘라 붙이기" | https://helpx.adobe.com/au/premiere-pro/using/default-keyboard-shortcuts.chromeless.html | 검색 결과로만 봄 |
| Premiere Q/W 설명 | Q=앞 편집점까지 리플 트림, W=다음 편집점까지 리플 트림 | 컷 편집 속도를 가장 크게 올리는 두 키, 그대로 채택 | https://fstoppers.com/education/ripple-trim-adobe-premiere-pro-keyboard-shortcuts-180674 | 검색 결과로만 봄 |
| Premiere Auto Reframe | 시퀀스 단위로 새 비율의 복제 시퀀스를 만들고 모션 추적 | 비율 변환 시 원본을 덮지 않고 "복제 프로젝트" 생성 | https://helpx.adobe.com/premiere-pro/using/auto-reframe.html | 검색 결과로만 봄 |
| Final Cut Pro 마그네틱 타임라인 | 클립을 옮기거나 지우면 빈틈이 자동으로 닫힘, 연결 클립은 동기 유지 | 기본 트랙은 빈틈 없는 "자석" 모드, B롤은 부모 클립에 붙여 이동 | https://support.apple.com/guide/final-cut-pro/ver90ba5929/mac | 검색 결과로만 봄 |
| Final Cut Pro 단축키 | B=블레이드 도구, Cmd+B=재생헤드에서 자르기, Shift+Cmd+B=전체 자르기 | B는 도구 전환, Cmd/Ctrl+B 는 즉시 자르기로 겸용 고려 | https://support.apple.com/kb/PH12724 | 검색 결과로만 봄 |
| Descript 텍스트 기반 편집·필러 제거 | 대본에서 "음/어" 자동 탐지 후 삭제/무시 선택, "Avoid harsh cuts" | 자막 텍스트에서 단어를 지우면 영상 구간도 삭제 | https://help.descript.com/hc/en-us/articles/10164806394509-Remove-filler-words | 검색 결과로만 봄 |
| Descript Shorten word gaps | 단어 사이 공백을 일괄/개별 단축, 최대 간격 설정 | "말 사이 공백을 N초로 줄이기" 슬라이더 | https://help.descript.com/hc/en-us/articles/10164807277453-Shorten-word-gaps | 검색 결과로만 봄 |
| VEED 자동 자막 | 저신뢰 단어 표시, SRT/VTT 가져오기·내보내기, 번역 | 자막 SRT/VTT 입출력 + 불확실 단어 하이라이트 | https://www.veed.io/learn/how-to-add-subtitles-or-captions-to-a-video | 검색 결과로만 봄 |
| Kapwing Smart Cut | 무음 감도 슬라이더로 무음 구간 자동 제거, 결과는 여러 클립으로 분할 | Web Audio RMS 로 무음 탐지 → 감도 슬라이더 → 분할(되돌리기 가능) | https://www.kapwing.com/help/how-to-use-smart-cut/ | 검색 결과로만 봄 |
| Opus Clip | 긴 영상에서 하이라이트 추출·세로 재구성·자막, 0~99 바이럴 점수(리뷰 기준) | 롱폼에서 "쇼츠 후보 구간" 표시(음량 피크·자막 밀도 기반 간단 점수) | https://www.opus.pro/home | 검색 결과로만 봄 |
| YPP 자격(현행) | 500명 팬 후원 단계 / 1,000명 + 4,000시간 또는 1,000만 쇼츠 조회 | 앱 안에 "수익화 진행률" 체크리스트(목표만 안내) | https://support.google.com/youtube/answer/72851?hl=en | 검색 결과로만 봄 |
| YPP 2027 변경 발표 | 2027-02-01부터 신규 신청 8,000시간 또는 2,000만 쇼츠 조회 | 진행률 체크리스트에 날짜별 기준 전환 반영 | https://www.newscaststudio.com/2026/08/10/youtube-partner-program-monetization-changes-2027/ | 검색 결과로만 봄 |
| YouTube 3분 쇼츠 | 2024-10-15 이후 정사각/세로 3분 이하 업로드는 쇼츠 | 9:16 내보내기 시 3:00 초과 경고 | https://support.google.com/youtube/answer/15424877?hl=en | 검색 결과로만 봄 |
| YouTube 권장 인코딩 | 1080p SDR 8/12 Mbps, 4K 35–45/53–68 Mbps | 내보내기 프리셋 "유튜브 1080p" 비트레이트 기본값 | https://support.google.com/youtube/answer/1722171?hl=en | 검색 결과로만 봄 |
| YouTube 썸네일 | 1280×720(최소 폭 640), 16:9, 2MB 이하, JPG/PNG/GIF/BMP | 썸네일 내보내기에서 2MB 넘으면 JPG 품질 자동 하향 | https://support.google.com/youtube/answer/72431?hl=en | 검색 결과로만 봄 |
| Instagram Reels 규격 | 1080×1920 9:16, 앱 내 3분, MP4/MOV H.264+AAC | Reels 프리셋 1080×1920 / 3분 경고 | https://postfa.st/sizes/instagram/reels | 검색 결과로만 봄 |
| TikTok 규격 | 1080×1920 9:16, 앱 촬영 10분, 업로드 최대 60분 | TikTok 프리셋(길이 제한 경고는 느슨하게) | https://postfa.st/sizes/tiktok/video | 검색 결과로만 봄 |
| 9:16 안전 영역 | 공식 수치 없음, 업체별로 상단 100~150px·하단 250~340px·우측 100px | 미리보기에 플랫폼별 안전 영역 오버레이 토글 | https://www.remotion.dev/elements/overlays/social-safe-zones/ | 검색 결과로만 봄 |
| 오디언스 유지율 핵심 순간 | "Intro"=첫 30초 후 남은 시청자 비율, 50% 이상이면 평균 이상 | 첫 30초 구간을 타임라인에 강조 표시("후킹 구간") | https://support.google.com/youtube/answer/9314415?hl=en | 검색 결과로만 봄 |
| Test & Compare | 썸네일·제목 최대 3개 A/B, 시청 시간 점유율로 승자 판정 | 썸네일 3안을 한 번에 내보내기 | https://support.google.com/youtube/answer/16391400?hl=en | 검색 결과로만 봄 |
| YouTube 오디오 보관함 | 보관함에서 받은 음원은 Content ID 소유권 주장 없음, CC 곡은 설명란 출처 표기 | 음원 라이선스·출처 문구를 프로젝트에 메모로 저장 | https://support.google.com/youtube/answer/3376882?hl=en | 검색 결과로만 봄 |
| Content ID 기본 | 업로드가 등록 콘텐츠와 일치하면 자동 claim, 저작권 경고(strike)와는 별개 | 외부 음원 사용 시 "Content ID 위험" 안내 | https://support.google.com/youtube/answer/6013276?hl=en | 검색 결과로만 봄 |
| 눈누(noonnu.cc) | 상업용 무료 한글 폰트를 라이선스(영상 허용 여부 등)와 함께 소개 | 내장 폰트는 OFL 등 영상·임베딩 허용 폰트만, 라이선스 링크 표시 | https://noonnu.cc | 검색 결과로만 봄 |
| WebCodecs (MDN) | VideoEncoder/Decoder, Dedicated Worker 에서 사용 가능, 일부 브라우저 미지원 | 지원되면 WebCodecs 인코딩, 아니면 MediaRecorder 대체 | https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Using_the_WebCodecs_API | 검색 결과로만 봄 |
| WebCodecs + OffscreenCanvas (Chrome) | 프레임 처리를 워커로, transferControlToOffscreen 으로 렌더링도 워커에서 | 렌더·인코딩을 워커로 옮겨 휴대폰 UI 끊김 감소 | https://developer.chrome.com/articles/webcodecs | 검색 결과로만 봄 |
| MediaRecorder isTypeSupported | Chrome 은 MP4(H.264/AAC) 기록 추가, Safari 18.4부터 WebM도 | 런타임에 mp4 → webm(vp9) → webm(vp8) 순 확인 | https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static | 검색 결과로만 봄 |
| Chromium MP4 MediaRecorder 의도 | MediaRecorder MP4 먹싱(H.264+AAC) 출시 공지 | Chrome 에서 MP4 직접 저장 가능 → 변환 단계 생략 | https://groups.google.com/a/chromium.org/g/blink-dev/c/p1OMVj1FrMI | 검색 결과로만 봄 |
| ffmpeg.wasm | 코어 약 31MB, 멀티스레드는 COOP/COEP 필요, 네이티브보다 크게 느림(약 0.08배) | 기본 경로에서 빼고 "고급 변환" 때만 지연 로드 | https://github.com/ffmpegwasm/ffmpeg.wasm/issues/312 | 검색 결과로만 봄 |
| iOS Safari 캔버스 메모리 | 총 캔버스 메모리 224~384MB(버전별), 캔버스당 16,777,216 픽셀 | 캔버스 재사용·해제(width=0), 4K 미리보기 금지 | https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/ | 검색 결과로만 봄 |


### 편집 단축키 표준 (우리 도구 제안)

- J/K/L 역재생/정지/재생(반복 누르면 배속), I/O 구간 시작/끝 — Premiere·Resolve·FCP 공통.
- 자르기: Ctrl/Cmd+K(Premiere), B 블레이드 도구(Resolve·FCP), Cmd+B 즉시 자르기(FCP).
- 리플 삭제: Shift+Delete(Mac)/Shift+Backspace(Win) — Resolve 기준, Premiere 도 같은 계열.
- Q/W: 재생헤드까지 앞/뒤 리플 트림(Premiere). 모바일에는 같은 기능의 버튼 두 개로.

### 핵심 수치

- **YPP 현행(1단계, 팬 후원)**: 구독자 500 + 90일 내 공개 업로드 3개 + 12개월 3,000 시청시간 또는 90일 쇼츠 300만 조회. 출처 https://support.google.com/youtube/answer/72851?hl=en — 검색 결과로만 봄(1단계 수치는 제3자 요약).
- **YPP 현행(광고 수익)**: 구독자 1,000 + 12개월 공개 시청 4,000시간 또는 90일 공개 쇼츠 1,000만 조회. 같은 출처 — 검색 결과로만 봄(공식 페이지 문구 인용 확인).
- **YPP 2027-02-01 변경(발표)**: 신규 신청 1,000명 + 365일 8,000시간 또는 90일 쇼츠 2,000만 조회. 기존 회원은 쇼츠 수익 유지에 90일 1,000만 조회 필요. 출처 https://www.newscaststudio.com/2026/08/10/youtube-partner-program-monetization-changes-2027/ , https://vidiq.com/blog/post/youtube-partner-program-changes-2027/ — 검색 결과로만 봄(2차 보도, 공식 원문 미확인).
- **쇼츠 최대 길이**: 3분, 정사각 또는 세로(2024-10-15 이후 업로드). 출처 https://support.google.com/youtube/answer/15424877?hl=en — 검색 결과로만 봄.
- **Reels**: 1080×1920, 앱 내 3분(외부 업로드 더 길게 가능하나 3분 초과는 비팔로워 추천 제외 보도). 출처 https://postfa.st/sizes/instagram/reels — 검색 결과로만 봄(Meta 공식 아님).
- **TikTok**: 1080×1920, 앱 촬영 10분 / 업로드 60분. 출처 https://postfa.st/sizes/tiktok/video — 검색 결과로만 봄(공식 아님).
- **9:16 안전 영역**: 공식 픽셀 수치 없음. 업체 가이드 범위: 상단 100~150px, 하단 250~340px(쇼츠가 가장 넓음), 우측 100px, 보수적 중앙 상자 약 900×1400px. 출처 https://www.remotion.dev/elements/overlays/social-safe-zones/ — 검색 결과로만 봄.
- **썸네일**: 1280×720, 최소 폭 640px, 16:9, 2MB 이하, JPG/PNG/GIF/BMP. 출처 https://support.google.com/youtube/answer/72431?hl=en — 검색 결과로만 봄(2MB는 제3자 일치, 공식 원문 미열람).
- **권장 비트레이트(SDR)**: 1080p 8 Mbps(24/25/30fps) / 12 Mbps(48/50/60fps), 4K 35–45 / 53–68 Mbps. 같은 페이지의 다른 캐시는 1080p 10/15 Mbps 로 나와 버전 차이 있음. 출처 https://support.google.com/youtube/answer/1722171?hl=en — 검색 결과로만 봄.
- **유지율 기준**: 첫 30초 후 50% 이상 남으면 "평균 이상 인트로". 출처 https://support.google.com/youtube/answer/12942217?hl=en — 검색 결과로만 봄.
- **ffmpeg.wasm**: 코어 약 31MB, core-mt 는 COOP: same-origin + COEP: require-corp 필요, 벤치마크에서 네이티브 5.2초 대 core-mt 60.4초. 출처 https://github.com/ffmpegwasm/ffmpeg.wasm/issues/312 — 검색 결과로만 봄.

## 2. 현재 코드 감사 (작업 전)

이미 잘 되는 것: 받아쓰기 자막(Whisper, 기기 안), 글을 지우면 영상이 잘리는 글 편집(Descript 방식), 무음 · 군말 자르기(Kapwing Smart Cut 방식), 자석 타임라인(Final Cut 방식), WebCodecs 내보내기(Mediabunny), 얼굴 모자이크 · 캐릭터, AI 목소리, GitHub 동기화. **편집 자체는 약하지 않습니다.** 약한 곳은 편집이 끝난 뒤, 즉 돈이 되는 단계였습니다.

| 구분 | 빠진 것 · 불편한 것 | 왜 문제인가 | 이번 처리 |
|---|---|---|---|
| 쇼츠 | 가로 영상을 9:16 으로 바꾸면 작게 들어가고 위아래가 흐린 배경 | 쇼츠에서 사람이 작게 보이면 바로 넘김 | **얼굴 따라가기 리프레임** |
| 쇼츠 | 안전 영역 표시 없음. 세로 화면 '아래' 자막이 높이 92% 지점 | 쇼츠 제목 · 채널 이름이 자막을 덮음 | **안전 영역 표시, 세로 자막 자리를 76% 로** |
| 쇼츠 | 3분 제한 안내 없음 | 3분이 넘으면 쇼츠로 분류되지 않음 | **길이 막대 · 경고** |
| 쇼츠 | 긴 영상에서 구간을 떼어 쇼츠로 만드는 방법 없음 (지우기만 가능) | 긴 강의 하나로 쇼츠 여러 개를 만드는 것이 가장 효율적인 흐름 | **I/O 구간 → '구간을 새 쇼츠로'(원본 보존)** |
| 자막 | 모양이 테두리 · 상자 · 낱말 강조뿐, 크기가 작음 | 쇼츠형 큰 자막이 사실상 표준 | **쇼츠형 큰 자막 + 강조색 5가지** |
| 썸네일 | 없음 | 긴 영상의 클릭률은 썸네일이 좌우함 | **썸네일 만들기(1280×720 · 2MB 이하 JPG, 작은 크기 미리보기)** |
| 올리기 | 제목 · 설명 · 태그 · 저작권 · AI 표시 점검 없음 | 음원 Content ID, AI 합성 미공개, 재사용 콘텐츠가 수익을 막음 | **올리기 전 점검표 · 장(챕터) 자동 만들기 · 복사** |
| 내보내기 | 화질만 고르고, 어디에 올릴지 프리셋 없음 | 비율을 잘못 고른 채 내보내기 쉬움 | **"어디에 올리나요" 프리셋 + 경고** |
| 단축키 | I/O 없음, 리플 삭제 없음, Ctrl+K 없음, ↑/↓ 컷 이동 없음 | 다른 편집기 손버릇이 안 통함 | **I · O · X · Ctrl+Shift+X · Shift+Del · Ctrl+K · ↑ · ↓** |
| 단축키 | J 는 5초 뒤로, L 은 재생뿐 (거꾸로 · 배속 셔틀 없음) | 표준과 다름 | 다음 세션 (배경음악 동기화를 같이 고쳐야 함) |
| 휴대폰 | 키보드가 없음 | 구간 고르기를 못 함 | [올리기] 탭에 단추로 같은 기능 |
| 휴대폰 | 아래 탭이 8개로 늘어 막대 안에서 옆으로 넘김 | 첫 탭(미디어)이 가려질 수 있음 | 남음 (아래 참고) |

## 3. 우선순위 (효과 ÷ 비용)

1. 쇼츠 세트 — 얼굴 따라가기 리프레임, 안전 영역, 3분 막대, 쇼츠형 자막. 이미 있는 얼굴 분석을 다시 써서 비용이 낮음. **완료**
2. 구간 → 새 쇼츠 프로젝트 (긴 영상 하나 → 쇼츠 여러 개). 프로젝트 복제가 영상 파일을 함께 쓰는 구조라 안전. **완료**
3. 썸네일 만들기. **완료**
4. 올리기 전 점검표 + 내보내기 프리셋. **완료**
5. 표준 단축키 (I/O, 리플 삭제, Ctrl+K, ↑/↓). **완료**

## 4. 이번에 바꾼 것

- 새 탭 **[올리기]** (`app/video/shorts.js`): 세로 쇼츠로 바꾸기, 안전 영역 보기, 구간 고르기(시작 · 끝 · 지우기 · 새 쇼츠로), 썸네일, 제목 · 설명 · 해시태그, 장(챕터) 넣기, 복사, 점검표, 수익 창출 조건 안내.
- 얼굴 따라가기: 클립에 `reframe: true` 가 있으면, 앞뒤 1초 동안의 얼굴 위치를 평균해 가로 위치를 정합니다. 미리보기와 내보내기가 같은 함수를 씁니다. 얼굴을 못 찾으면 가운데를 보여 줍니다.
- 자막: `cap.style = 'shorts'`, `cap.hl`(강조색). 세로 화면에서는 모든 자막 모양이 안전 영역 안(위 16% · 아래 76%)에 놓입니다. **기존 세로 프로젝트의 '아래' 자막도 위로 올라갑니다.** 쇼츠 UI 가 덮던 자리라 고치는 것이 맞다고 봤습니다.
- 내보내기 창: "어디에 올리나요"(YouTube 16:9 · 쇼츠·릴스·틱톡 9:16 · 인스타 피드 4:5), 3분 초과 · 가로 영상 경고, 끝난 뒤 [올리기 전 점검].
- 저장 형식: 프로젝트에 `pub`(제목 · 설명 · 태그 · 점검 · 썸네일 설정)와 클립의 `reframe` 이 더해졌습니다. 기존 프로젝트는 그대로 열립니다(없으면 기본값).

## 5. 다음 세션 할 일

1. **J/K/L 셔틀**: L 을 두 번 누르면 2배속, J 는 거꾸로. 배경음악 요소가 배속 재생 중에도 계속 다시 맞추지 않게 `player.js` 의 음악 동기화를 같이 고쳐야 합니다.
2. **쇼츠 후보 자동 찾기(Opus Clip 방식)**: 받아쓴 글에서 문장 단위로 30~60초 구간을 만들고, 말 밀도 · 소리 크기 · 질문형 문장으로 점수를 매겨 상위 5개를 보여 주기 → '새 쇼츠로'.
3. **썸네일 3안 한 번에**: YouTube Test & Compare 에 맞춰 장면 · 글자를 바꾼 3장을 내보내기.
4. **휴대폰 아래 탭 정리**: 8개가 한 줄에 다 들어가지 않습니다. 덜 쓰는 탭(녹화 · 목소리)을 '더 보기'로 묶기.
5. **얼굴 따라가기 손보기**: 지금은 1초 평균이라 사람이 빨리 움직이면 늦게 따라갑니다. 말하는 사람이 둘일 때 고르는 기능도 없습니다. 실제 인터뷰 영상으로 확인이 필요합니다.
6. **내보내기 비트레이트**: YouTube 권장 1080p 8 Mbps(30fps) / 12 Mbps(60fps)에 맞춘 "업로드용" 화질. 공식 페이지 수치를 먼저 확인할 것(캐시마다 다름).
7. 공식 페이지(YPP · 썸네일 · 쇼츠 길이)를 직접 열어 이 문서의 "검색 결과로만 봄"을 확인으로 바꾸기. YPP 2027 변경은 2차 보도만 있습니다.

## 6. 확인한 것 · 못 한 것

- 확인(Playwright · Chromium): PC 1280×900, 휴대폰 390×844. 할 수 있었던 것: 테스트 영상 넣기, I/O 키 → 구간 표시 → Shift+Del(20초 → 14초) → Ctrl+Z(20초), Ctrl+K 자르기, ↑/↓ 컷 이동, 세로 쇼츠로 바꾸기(얼굴 분석 실행 · 오류 없음), 얼굴 위치 값을 넣었을 때 화면이 그쪽으로 옮겨 가는지, 썸네일 JPG 저장(114KB), 내보내기 프리셋 · 9:16 내보내기 완료, 구간 → 새 쇼츠 프로젝트(6초, 원본 유지), 콘솔 오류 없음, 가로 스크롤 없음.
- 못 한 것: 실제 사람 얼굴 영상으로 따라가기 품질 확인(시험 영상에 얼굴이 없음), iPhone Safari 실기기, 프리텐다드 글꼴이 실제로 받아진 상태의 글자 폭(시험 환경에서는 글꼴 CDN 이 막혀 대체 글꼴로 확인).
