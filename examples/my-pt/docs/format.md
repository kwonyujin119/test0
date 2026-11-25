# 교안 파일 형식

교안 1개 = `decks/이름.json` 파일 1개. 목록은 `decks/index.json` 한 파일로 관리합니다.

```json
{ "title": "소화기 사용법",
  "slides": [ { "bg": { "color": "#ffffff" }, "notes": "발표자 노트", "elements": [ ... ] } ] }
```

| 항목 | 뜻 |
|---|---|
| `slides` | 슬라이드 목록 (순서대로) |
| `bg.color` / `bg.image` | 배경 색 / 배경 그림 |
| `notes` | 발표자 보기(S)에만 보이는 메모 |
| `elements` | 그 장에 올리는 요소들 |

요소는 모두 1920×1080 화면 기준 좌표 `x, y, w, h` 를 씁니다.

| type | 쓰는 항목 |
|---|---|
| `text` | `text`(글, `<br>` 줄바꿈), `size`, `color`, `bold`, `align` |
| `image` | `src`, `fit`(cover/contain), `radius` |
| `shape` | `shape`(rect/circle), `fill`, `radius`, `opacity` |

`step` 은 몇 번째 클릭에 나타날지입니다. 0 이면 처음부터 보이고, 1 이면 첫 클릭에 나타납니다.
