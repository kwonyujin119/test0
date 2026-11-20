# 이미지 생성 프롬프트 가이드 (GPT · Gemini)

> **Claude 가 이미지 프롬프트를 쓰기 전에 이 문서를 먼저 읽는다.**
> 사용자는 Claude 가 준 프롬프트를 그대로 실행한다. 그러니 첫 결과물이 바로 쓸 수 있는 수준이 되도록 쓴다.
> 근거: OpenAI 공식 cookbook, Google 공식 cookbook·Cloud 블로그(맨 아래 참고 문헌), 그리고 이 저장소에서 실제로 돌려 본 결과(2026-11).

---

## 0. 작업 순서 (Claude)

1. **목적 확인**: 어디에 쓰는가(교안 표지 · 본문 삽화 · 포스터 · 인포그래픽 · 아이콘), 대상(유아 · 초등 · 성인), 화면 비율(슬라이드 16:9 · A4 세로 · 정사각).
2. 빠진 정보가 결과를 크게 바꾸면 **딱 한 번만** 묻는다. 그 밖의 것은 합리적인 기본값으로 정하고, 정한 값을 답변에 적는다.
3. **모델과 설정 고르기**(§2).
4. **프롬프트 쓰기**(§3 템플릿). 영어 본문에 한국어 글자는 따옴표로 넣는다(§4).
5. **내용 검수**: 그림 속 안전수칙·절차·용어가 실제 지침과 맞는지 Claude 가 먼저 확인한다(§6).
6. 결과를 받으면 **체크리스트(§7)**로 점검한다. 고칠 때는 한 번에 하나만 바꾼다(§8).

---

## 1. 도구 요약

| | GPT (`gpt_generate_image`) | Gemini (`gemini_generate_image`) |
|---|---|---|
| 기본 모델 | `gpt-image-2.6-sunburst` | `gemini-3.1-flash-image` (Nano Banana 2) |
| 다른 모델 | `gpt-image-2.6-flare`, `gpt-image-2`, `gpt-image-1-mini`(대량·초안) | `gemini-3-pro-image`(Pro: 복잡한 글자·4K), `gemini-3.1-flash-lite-image`(빠르고 쌈) |
| 크기 | `size` 자유 지정: 16의 배수, 긴 변 < 3840, 비율 ≤ 3:1. 2560x1440 초과는 실험적 | `aspect_ratio` 1:1 · 2:3 · 3:2 · 3:4 · 4:3 · 4:5 · 5:4 · 9:16 · 16:9 · 21:9 (+ flash·pro 는 1:4 · 4:1 · 1:8 · 8:1), `resolution` 512px · 1K · 2K · 4K |
| 품질 | `quality` low · medium · high (+ xhigh · max) | 해상도와 `thinking_level`(minimal · low · high) |
| 참고 이미지 | `reference_images` → 편집 모드 | `reference_images` (flash·pro 최대 14장, lite 3장) |
| 특수 기능 | **투명 배경**(png/webp), `n` 1~4장 | **구글 검색 근거**(`google_search`), 극단적 가로·세로 비율 |
| 결과 | PNG(기본) · WebP · JPEG | JPG |

### 자주 쓰는 크기
| 용도 | GPT `size` | Gemini |
|---|---|---|
| 슬라이드 전체(16:9) | `1536x864` 또는 고해상도 `2560x1440` | `16:9`, `2K` |
| A4 세로 인쇄물 | `1024x1536` (2:3) 또는 `1696x2400` | `3:4` 또는 `2:3`, `2K`~`4K` |
| 정사각 삽화·SNS | `1024x1024` | `1:1`, `1K` |
| 가로 배너 | `2400x800` (3:1) | `21:9` 또는 `4:1` |
| 아이콘·스티커(투명) | `1024x1024`, `background: transparent` | — (투명 미지원) |

---

## 2. 어떤 모델을 쓸까

| 상황 | 추천 | 이유 |
|---|---|---|
| 교육 내용이 정확해야 하는 삽화(절차·단계·수칙) | **GPT sunburst, medium~high** | 실제 시험에서 지시 반영이 더 정확했다(4단계를 모두 그림) |
| 그림 속 한글이 많은 인포그래픽·포스터 | **GPT high** 또는 **Gemini Pro + thinking high** | 둘 다 공식 문서가 글자·인포그래픽 강점을 내세운다. 중요하면 둘 다 뽑아 비교 |
| 슬라이드 배경·넓은 장면·4K 인쇄 | **Gemini flash, 16:9/21:9, 2K~4K** | 비율 선택이 넓고 4K 지원 |
| 교안에 얹을 아이콘·캐릭터 컷(투명) | **GPT, transparent, png** | Gemini 는 투명 배경 미지원 |
| 같은 캐릭터를 여러 장에 | 둘 다 가능: 첫 장을 **캐릭터 기준 그림**으로 만들고 `reference_images` 로 넘긴다(§5) | 실제 시험에서 둘 다 캐릭터를 잘 유지했다 |
| 실존 사물·장소·최신 정보(실제 소방차 모델, 특정 건물) | **Gemini flash + google_search** | 검색으로 근거를 잡는다 |
| 아이디어 시안 여러 장 | GPT low `n=4` 또는 Gemini flash-lite | 싸고 빠르다 |

**품질 설정의 기준**
- 작은 글자, 빽빽한 라벨, 인포그래픽, 슬라이드 → GPT `high` / Gemini `2K` + `thinking high`
- 일반 삽화 → GPT `medium` / Gemini `1K`
- 구도만 보는 초안 → GPT `low` / Gemini `512px` 또는 lite

---

## 3. 프롬프트 템플릿

양쪽 공식 문서의 공통 원칙은 다음과 같다.
- **구조화**: 장면 → 주제 → 세부 → 제약 순서로 쓴다.
- **용도 명시**: "children's picture-book illustration", "classroom handout", "slide" 같은 용도를 밝혀 완성도의 기준을 정한다.
- **서술형 문장**: 키워드를 나열하지 말고 문장으로 장면을 설명한다.
- **구도·조명·시점 지정**: 원하는 화면을 구체적으로 정한다.
- **바꿀 것과 지킬 것 구분**: 편집할 때는 무엇을 바꾸고 무엇을 그대로 둘지 나눠 쓴다.

본문은 **영어**로 쓴다. 지시 해석이 더 안정적이다. 그림 속 글자만 한국어로 따옴표 안에 넣는다.

### 3-1. 기본 템플릿 (삽화·장면)
```
Create a [용도: children's picture-book illustration / classroom slide illustration / poster] for [대상: Korean kindergarten children / elementary students / adults].

Scene: [장소, 시간, 분위기]
Subject: [누가, 무엇을 하는지 — 동작·시선·손의 위치까지 구체적으로]
Details: [소품, 복장, 반드시 정확해야 하는 요소를 목록으로]
Composition: [eye-level / top-down / wide shot / close-up], [주인공 위치: left third, centered], [빈 공간: negative space on the right for a title]
Lighting & color: [soft daylight, warm palette, high contrast …]
Style: [soft watercolor picture-book / flat vector illustration / clean 3D render / photorealistic]
Text: [none] 또는 render exactly: "한국어 문구" (verbatim, once, [위치], [글꼴 느낌])
Constraints: no extra text, no logos, no watermark, [교육 내용상 그리면 안 되는 것]
```

### 3-2. 인포그래픽·슬라이드 (글자 많음)
```
Create one [16:9 slide / A4 portrait handout] infographic titled "제목" for [대상].

Layout: [title top-center; 4 numbered steps left-to-right with arrows; one icon per step; footer note bottom]
Content (render text EXACTLY, verbatim, Korean):
1. "단계 1 문구"
2. "단계 2 문구"
3. "단계 3 문구"
4. "단계 4 문구"
Visual language: clean flat icons, consistent stroke width, [2~3색 팔레트], white background, generous spacing.
Typography: bold rounded Korean sans-serif for titles, regular for labels, high contrast, large readable text.
Constraints: no additional text beyond the list above, no duplicate labels, no tiny text, no decorative clutter, no logos, no watermark.
```
설정: GPT `quality: high`, `size: 1536x864` / Gemini Pro 또는 flash, `thinking_level: high`, `16:9`, `2K`.

### 3-3. 캐릭터 기준 그림 (반복 사용용)
```
Create a character reference sheet for an original children's-book character.
Character: [나이, 직업, 체형, 얼굴 특징, 머리, 옷 색·소재, 소품 — 구체적으로]
Show: front view, full body, neutral pose, plain light background.
Style: [최종 그림과 같은 화풍]
Constraints: original character, no text, no watermark.
```

### 3-4. 참고 이미지 사용 (편집·일관성·합성)
```
Image 1: [무엇인지 — 예: the firefighter character reference].
Image 2: [무엇인지 — 예: style reference].
Create [새 장면] using the SAME character from Image 1 (same face, hairstyle, outfit, colors, proportions).
Change: [바꿀 것만]
Keep unchanged: [얼굴, 옷, 화풍, 색감 … 매번 다시 적는다]
Constraints: do not redesign the character; no extra text; no watermark.
```

### 3-5. 투명 배경 아이콘 (GPT 전용)
```
Create a single [object] icon for a presentation slide.
Style: flat vector-like shapes, strong silhouette, [팔레트], simple and readable at small sizes.
Fully transparent background. Single centered subject with generous padding, clean alpha edges.
No solid backdrop, no scenery, no checkerboard, no shadow, no text, no watermark.
```
설정: `background: transparent`, `output_format: png`, `size: 1024x1024`.

---

## 4. 그림 속 한국어 글자

1. **글자는 따옴표 안에 그대로** 넣고 `verbatim`, `exactly once`, `no other text` 를 붙인다.
2. **문구는 짧게**: 한 덩어리에 8단어(한국어로 약 15자) 이내. 길면 틀릴 확률이 올라간다.
3. **역할과 위치를 지정한다**: `headline at top-center`, `label under each icon`.
4. **글꼴 느낌을 정한다**: `bold rounded Korean sans-serif`, `handwritten Korean`. 실제 글꼴 이름은 대략적으로만 반영된다.
5. **언어를 명시한다**: `Korean text` 라고 써 준다.
6. **글자가 필요 없으면** 반드시 `No text anywhere in the image.` 를 넣는다. 안 넣으면 모델이 문구를 지어낸다. 실제로 Gemini 가 프롬프트의 "따뜻한"을 포스터 문구로 써 버린 적이 있다.
7. **글자가 많고 정확해야 하는 경우**(수칙 전문, 표)는 그림에 넣지 말고, 그림은 글자 없이 만든 뒤 **교안 편집기에서 글자를 얹는 쪽**이 확실하다.
8. 글자가 틀리면 다시 뽑는다. 문구를 줄이고, 따옴표와 위치를 다시 적는다. GPT 는 `high` 로 올린다.

---

## 5. 같은 캐릭터를 여러 장에 쓰기

1. §3-3 으로 **기준 그림**을 만든다(GPT medium 또는 Gemini flash).
2. 이후 모든 장면은 기준 그림을 `reference_images` 로 넘기고 §3-4 템플릿을 쓴다.
3. 캐릭터 설명(옷 색, 머리, 소품)을 **매번 다시 적는다**. 생략하면 조금씩 달라진다.
4. 화풍 문구(`soft watercolor picture-book …`)도 모든 장에 똑같이 쓴다.
5. 실제 시험(2026-11-20): 소방관 그림을 참고로 넘겼을 때 GPT 와 Gemini 모두 얼굴·헬멧·방화복을 유지했다. GPT 는 참고 그림 속 아이들까지 거의 그대로 다시 그렸다. 새 인물을 원하면 `new children, different from Image 1` 이라고 써야 한다.

---

## 6. 교육 내용 정확성 (교안 전용 규칙)

모델은 그럴듯하게 그릴 뿐, 지침이 맞는지는 확인하지 않는다. **Claude 가 프롬프트에 정답을 써 넣는다.**
- 절차는 **모든 단계를 번호로** 적는다. 그래야 빠지지 않는다. 실제로 "소화기 사용법"만 쓰자 Gemini 는 3단계에서 멈췄다.
- 안전 동작은 정확히 묘사한다. 예: 화재 대피는 `covering nose and mouth with a handkerchief or sleeve, walking low` 처럼 손수건·젖은 수건 사용과 낮은 자세를 적는다.
- 그리면 안 되는 위험 장면은 `Constraints` 에 넣는다. 예: `no open flames near children`, `children do not touch the extinguisher nozzle`.
- 실존 기관 마크·로고·제복 휘장은 정확히 재현되지 않고 저작권·사칭 문제도 있다. `generic emblem` 으로 쓴다.
- 유아 대상 그림은 공포감을 주지 않도록 `calm, reassuring, not scary` 를 넣는다.

---

## 7. 결과 체크리스트

- [ ] 요청한 단계·요소가 **모두** 있는가(개수 세기)
- [ ] 그림 속 글자가 **정확**하고 한 번만 나오는가, 지어낸 글자는 없는가
- [ ] 안전 동작·장비 사용이 **실제 지침**과 맞는가
- [ ] 손가락·손 개수, 시선, 물건을 잡은 방식이 자연스러운가
- [ ] 캐릭터가 이전 장과 같은가(얼굴·옷·색)
- [ ] 교안에 넣었을 때 제목·글자 자리가 비어 있는가(negative space)
- [ ] 로고·워터마크·실존 상표가 없는가

---

## 8. 고치는 방법

| 문제 | 처방 |
|---|---|
| 단계·요소 누락 | 번호 목록으로 다시 적고 `include all N steps` 를 붙인다. GPT 는 high 로 올린다 |
| 엉뚱한 글자가 생김 | `No text anywhere` 또는 `only this text: "…"`. 분위기 형용사는 `Style:` 줄로 옮긴다 |
| 글자가 깨짐 | 문구를 줄이고, 따옴표·위치·글꼴을 적는다. GPT high / Gemini Pro + thinking high |
| 캐릭터가 바뀜 | 참고 이미지를 넘기고, 지킬 목록을 다시 적는다 |
| 구도가 원하는 대로 안 나옴 | 시점·주인공 위치·여백을 명시한다(`subject on left third, empty space on right`) |
| 너무 화려하거나 산만함 | `minimal background, fewer objects, generous white space` |
| 편집하다 다른 곳까지 바뀜 | `change only X; keep everything else exactly the same` 를 매번 쓴다 |
| 사진 느낌이 어색함 | `photorealistic`, `candid`, `natural light` 를 쓰고, 카메라 사양은 대략만 적는다 |

**한 번에 하나만 바꾼다.** 여러 개를 동시에 바꾸면 무엇이 효과를 냈는지 알 수 없다(OpenAI 가이드의 "iterate instead of overloading").

---

## 9. 비용 감각 (실측 토큰, 2026-11-20)

| 작업 | 토큰 | 대략 비용* |
|---|---|---|
| GPT sunburst, low, 1024² | 출력 824 | 약 35원 |
| GPT sunburst, medium, 1536x864 + 참고 1장 | 입력 1,214 / 출력 924 | 약 50원 |
| Gemini flash, 1K | 출력 1,571 | 약 95원 |
| Gemini flash, 16:9, thinking high + 참고 1장 | 출력 1,892(사고 1,477 별도) | 약 120~150원 |

\*외부 요금 정리 글 기준 추정이다. 정확한 금액은 각 콘솔의 Usage 화면에서 확인한다. 고해상도(2K·4K)와 high 품질은 몇 배로 오른다.

---

## 10. 참고 문헌

**공식 — 꼭 볼 것**
- OpenAI, *GPT Image Generation Models Prompting Guide* (cookbook): https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
  - 원본 노트북: https://github.com/openai/openai-cookbook/blob/main/examples/multimodal/image-gen-models-prompting-guide.ipynb
- OpenAI, *Image prompting* (모델별 가이드, 2.5·2.6): https://developers.openai.com/api/docs/guides/image-prompting
- OpenAI, *Image generation* (API 매개변수): https://developers.openai.com/api/docs/guides/image-generation
- OpenAI, *Generate and edit images with GPT Image* (cookbook): https://developers.openai.com/cookbook/examples/generate_images_with_gpt_image
- Google, *Gemini built-in image generation (Nano Banana)* cookbook: https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_Started_Nano_Banana.ipynb
- Google, *Image generation* (Gemini API 문서): https://ai.google.dev/gemini-api/docs/image-generation
- Google Cloud, *Ultimate prompting guide for Nano Banana* (2026-03): https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana
- Google DeepMind, *Nano Banana prompt guide*: https://deepmind.google/models/gemini-image/prompt-guide/
- Google, *7 tips to get the most out of Nano Banana Pro*: https://blog.google/products/gemini/prompting-tips-nano-banana-pro/

**보조 — 예시 모음 (검증 수준 낮음)**
- fal, *GPT Image 2 prompting guide*: https://fal.ai/learn/tools/prompting-gpt-image-2
- Luma, *GPT Image 2 complete guide*: https://lumalabs.ai/learning-center/articles/gpt-image-2-complete-guide
- Atlabs, *Ultimate Nano Banana Pro prompting guide*: https://www.atlabs.ai/blog/the-ultimate-nano-banana-pro-prompting-guide-mastering-gemini-3-pro-image
- awesome-nano-banana-pro-prompts (GitHub): https://github.com/cliprise/awesome-nano-banana-pro-prompts

> 2026-11-20 수집 당시, 이 클라우드 환경에서는 developers.openai.com · ai.google.dev · deepmind.google · blog.google 을 직접 열 수 없었다. 그래서 OpenAI 와 Google 은 GitHub 에 올라온 공식 cookbook 원본으로 내용을 확인했다. OpenAI 의 2.6 전용 페이지(sunburst/flare 차이)와 Gemini API 문서 원문은 아직 확인하지 못했다.
