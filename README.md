# 교안 작업장 (test0)

강의 교안을 **가볍게 만들고, 프레젠터 리모컨으로 발표**하는 도구입니다.
PowerPoint 처럼 텍스트·이미지·도형을 배치하지만, 설치 프로그램 없이 브라우저에서 동작하고
교안 하나가 JSON 파일 하나라서 Git 으로 모아 관리할 수 있습니다.

## 시작하기

1. `start.cmd` 를 더블클릭합니다. (PowerShell 로 로컬 서버가 뜨고 브라우저가 열립니다)
2. 브라우저에서 `http://localhost:8787/` 이 열리면 **＋ 새 교안** 으로 시작하거나,
   예시 교안을 **▶ 발표** / **✎ 편집** 해 봅니다.
3. 서버 창은 발표·편집하는 동안 켜 둡니다. 끝나면 창을 닫으면 됩니다.

> Windows 10 에 기본으로 있는 PowerShell 만 사용합니다. 별도 설치가 필요 없습니다.
> 포트를 바꾸려면 `powershell -ExecutionPolicy Bypass -File server.ps1 -Port 9000` 처럼 실행합니다.

## 어디서나 열기 (GitHub Pages)

`main` 브랜치에 푸시하면 GitHub Actions 가 자동으로 배포합니다 (`.github/workflows/pages.yml`).

**https://kwonyujin119.github.io/test0/**

- 토큰 없이 열면 **보기·발표** 만 됩니다. 강의실 PC 에서 주소만 열고 리모컨으로 발표하면 됩니다.
- 허브의 **GitHub 연결** 에 토큰을 한 번 등록하면 그 브라우저에서는 **편집·저장** 도 됩니다.
  저장할 때마다 저장소에 커밋이 하나씩 쌓이고(`교안 저장: …`, `이미지 추가: …`), 내 PC 에서는 `git pull` 로 받습니다.
- 토큰 만들기: [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) →
  Repository access: *Only select repositories* → `test0` → Permissions: **Contents → Read and write**.
  토큰은 브라우저(localStorage)에만 저장되고 GitHub 외에는 어디에도 보내지 않습니다. 공용 PC 에서는 발표만 하고, 연결하지 마세요.
- 저장 직후 배포가 끝나기까지 30초~1분 걸립니다. 그 사이에도 교안은 GitHub API 로 바로 읽으므로 최신 내용이 보입니다.
  방금 올린 이미지는 배포 전이면 `raw.githubusercontent.com` 에서 대신 불러옵니다.
- 같은 교안을 PC(로컬 서버)와 웹에서 번갈아 편집할 때는, 로컬에서 작업하기 전에 `git pull`, 끝나면 `git push` 를 잊지 마세요.

## 폴더 구조

```
test0-교안/
├─ start.cmd          서버 실행 (더블클릭)
├─ server.ps1         로컬 서버 + 저장 API (PowerShell)
├─ index.html         허브: 교안 목록
├─ editor.html        편집기
├─ present.html       발표기 (발표자 보기 · 인쇄 모드 포함)
├─ shortcuts.html     단축키 설명서 (인쇄 가능)
├─ app/               공통 모듈 (렌더러·테마·레이아웃), 편집기, 발표기, 스타일
├─ decks/             교안 1개 = JSON 파일 1개   ← 여기에 교안이 쌓입니다
│   └─ .trash/        삭제한 교안 (Git 제외)
└─ assets/            이미지 파일 (편집기에서 넣은 이미지가 자동 저장)
```

## 단축키 (PowerPoint 와 같은 배치)

전체 설명서: **[shortcuts.html](shortcuts.html)** (허브 하단 링크 · 인쇄 가능).
발표 중 `F1` / `?`, 편집 중 `F1` 을 누르면 화면 안에서 바로 볼 수 있습니다.

### 발표 (슬라이드 쇼)

| 동작 | 키 |
|---|---|
| 다음 / 이전 | `→` `PageDown` `Space` `Enter` `N` 클릭 / `←` `PageUp` `Backspace` `P` 우클릭 |
| 처음 / 끝 · 특정 슬라이드 | `Home` / `End` · 번호 입력 후 `Enter` |
| 모든 슬라이드 보기 | `Ctrl+S` `G` `-` `O` |
| 검은 화면 / 흰 화면 | `B` `.` / `W` `,` |
| 확대 / 축소 | `+` / `-` |
| 펜 / 레이저 / 화살표 / 잉크 지우기 | `Ctrl+P` `D` / `Ctrl+L` `L` / `Ctrl+A` `Esc` / `E` |
| 포인터 숨기기 | `Ctrl+H` |
| 발표자 보기 창 | `Alt+F5` `S` |
| 전체화면 | `F` `F5` `F11` |
| 도움말 / 편집기로 / 종료 | `F1` `?` / `Ctrl+E` / `Esc` |

일반 프레젠터 리모컨(로지텍 등)은 `PageUp` / `PageDown` / `F5` / `B` / `Esc` 를 보내므로 그대로 동작합니다.

**듀얼 모니터**: 발표 화면에서 `S` 를 누르면 발표자 보기 창이 열립니다. 이 창을 노트북 화면에,
발표 화면을 프로젝터에 두고 전체화면(`F`)을 켜세요. 두 창은 자동으로 동기화되고, 어느 창에서 키를 눌러도 넘어갑니다.

### 편집기

| 동작 | 키 |
|---|---|
| 저장 · 인쇄/PDF · 도움말 | `Ctrl+S` · `Ctrl+P` · `F1` |
| 발표 처음부터 / 현재 슬라이드부터 | `F5` / `Shift+F5` |
| 새 슬라이드 · 복제 · 삭제 | `Ctrl+M` · `Ctrl+Shift+D` · `Ctrl+Delete` |
| 슬라이드 이동 · 순서 바꾸기 | `PageUp` `PageDown` `Ctrl+Home` `Ctrl+End` · `Ctrl+Shift+↑` `Ctrl+Shift+↓` |
| 요소 선택 | `Tab` `Shift+Tab` · `Ctrl+A` · `Shift`+클릭 · 드래그 범위 선택 · `Esc` 해제 |
| 요소 이동 | 화살표 10px · `Ctrl`+화살표 1px · `Shift`+화살표 50px · `Ctrl`+드래그 복제 · `Alt`+드래그 스냅 끄기 |
| 복제 · 복사/잘라내기/붙여넣기 · 서식 복사/붙여넣기 | `Ctrl+D` · `Ctrl+C` `Ctrl+X` `Ctrl+V` · `Ctrl+Shift+C` `Ctrl+Shift+V` |
| 앞으로/뒤로 · 맨 앞/맨 뒤 | `Ctrl+]` `Ctrl+[` · `Ctrl+Shift+]` `Ctrl+Shift+[` |
| 실행 취소 / 다시 실행 | `Ctrl+Z` / `Ctrl+Y` |
| 글 편집 시작 / 끝 | `Enter` `F2` 더블클릭 / `Esc` |
| 글 서식 | `Ctrl+B` `Ctrl+I` `Ctrl+U` · 정렬 `Ctrl+L` `Ctrl+E` `Ctrl+R` `Ctrl+J` · 크기 `Ctrl+]` `Ctrl+[` · `Tab` 들여쓰기 · `Ctrl+K` 링크 · `Ctrl+Space` 서식 지우기 |

## 편집기

- **슬라이드 추가**: `＋ 슬라이드` → 레이아웃 선택 (표지, 소제목+본문, 2단, 이미지+본문, 비교, 인용, 핵심 숫자, 코드 …)
- **글 편집**: 텍스트 상자를 더블클릭. 툴바에서 굵게·형광펜·글머리·번호·들여쓰기·글자 크기·링크.
- **이미지**: `Ctrl+V` 로 붙여넣기, 파일을 캔버스에 끌어다 놓기, 또는 `🖼 이미지` 메뉴. 이미지는 `assets/` 에 저장됩니다.
- **도형**: 사각형, 원, 삼각형, 마름모, 별, 화살 블록, 선, 화살표. 색은 테마 색(강조/면 등)과 연결할 수 있어 테마를 바꾸면 함께 바뀝니다.
- **꾸밈**: 오른쪽 패널에서 글꼴·크기·색·정렬·줄간격·배경 상자·여백·모서리·테두리·그림자·왼쪽 강조선.
- **나타내기(클릭 단계)**: 요소마다 `단계` 숫자를 지정하면 리모컨을 누를 때마다 순서대로 나타납니다.
  본문 목록은 `항목 하나씩 표시` 를 켜면 글머리 항목이 한 줄씩 나타납니다.
- **배경**: 테마 기본 / 단색 / 그라데이션 / 이미지. 슬라이드 전환: 페이드·밀기·확대.
- **테마**: 상단의 테마 선택으로 교안 전체의 색·장식이 한 번에 바뀝니다 (8종).
- **정렬**: 여러 요소를 선택(Shift+클릭 또는 드래그)하면 정렬·등간격 분포·같은 크기 버튼이 활성화됩니다.
- **노트**: 슬라이드를 선택한 상태(요소 선택 없음)에서 오른쪽 패널의 발표자 노트를 적습니다.
- **저장**: 변경이 있으면 제목 옆에 점이 표시됩니다. 저장 전에도 임시본이 브라우저에 보관되어 `미리보기` 로 바로 볼 수 있습니다.

### 내보내기

- **JSON 다운로드**: 교안 파일 그대로.
- **단독 HTML**: 이미지까지 한 파일에 넣어서, 서버 없이 아무 PC 에서나 더블클릭으로 발표할 수 있습니다 (USB 로 강의실 PC 에 옮길 때).
- **PDF / 인쇄용**: 모든 슬라이드를 한 페이지씩 보여줍니다. 브라우저 인쇄에서 "PDF로 저장"을 선택하세요 (학생 배포용 유인물).

## 교안 파일 형식

`decks/<이름>.json`

```json
{
  "title": "교안 제목", "theme": "academic", "transition": "fade",
  "slides": [
    { "id": "...", "bg": null, "transition": "", "notes": "발표자 노트",
      "elements": [
        { "type": "text",  "role": "heading", "x": 120, "y": 90, "w": 1680, "h": 130, "html": "소제목", "style": {}, "step": 0 },
        { "type": "image", "x": 1000, "y": 260, "w": 800, "h": 660, "src": "assets/그림.png", "radius": 24, "shadow": true },
        { "type": "shape", "shape": "rect", "x": 120, "y": 690, "w": 220, "h": 12, "fill": "$accent" }
      ] }
  ]
}
```

- 좌표계는 1920×1080 기준이며 화면 크기에 맞게 자동 축소/확대됩니다.
- 색에 `$accent`, `$accent2`, `$title`, `$fg`, `$muted`, `$surface`, `$bg` 를 쓰면 테마 색을 따라갑니다.
- 텍스트의 `role` (title, subtitle, heading, body, caption, quote, code, number) 에 따라 테마 기본 글꼴 크기·색이 정해지고, `style` 로 덮어씁니다.

## Git 으로 교안 모으기

```bash
git add decks assets
git commit -m "OO 과목 3주차 교안 추가"
git push
```

저장할 때마다 직전 버전이 `decks/<이름>.json.bak` 으로 남고(Git 제외), 삭제한 교안은 `decks/.trash/` 로 이동합니다.

## 세 가지 실행 방식

| 방식 | 저장 위치 | 용도 |
|---|---|---|
| `start.cmd` (로컬 서버) | `decks/`, `assets/` 폴더 파일 | 평소 작업. Git 으로 커밋·푸시 |
| GitHub Pages 주소 | GitHub 저장소 (토큰 연결 시) | 어디서나 발표, 급한 수정 |
| `index.html` 더블클릭 | 브라우저 localStorage | 임시 |

## 서버 없이 열면?

`index.html` 을 그대로 더블클릭해도 열리지만, 그때는 교안이 브라우저 안(localStorage)에만 저장됩니다.
폴더에 파일로 저장하려면 `start.cmd` 로 여세요.
