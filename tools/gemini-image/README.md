# Gemini 이미지 커넥터

Claude 가 Google Gemini 이미지 모델(Nano Banana 계열)을 도구(`gemini_generate_image`)로 불러 그림을 만든다.
Gemini 앱 로그인이 아니라 **Gemini API**(Google AI Studio 키)를 쓴다.

## 준비 (한 번)

1. https://aistudio.google.com/apikey 에서 **Create API key**. 새 키는 `AQ.` 로 시작한다.
   - 이미지 모델은 무료 한도가 없거나 매우 작다. 429 가 나면 AI Studio 에서 결제(Billing)를 연결한다.
2. 키 넣기 — **저장소에 커밋하지 않는다.**
   - 클라우드 세션: 보안 입력 카드는 쓰지 않는다(Bearer 방식이라 이미지가 안 됨). claude.ai/code → 세션 제목 옆 ˅ → Edit cloud environment → Network secrets → Add secret: 사이트 `generativelanguage.googleapis.com`, Header name `x-goog-api-key`, Prefix 비움.
   - PC(PowerShell): `setx GEMINI_API_KEY "AIza..."` 후 터미널 다시 열기
3. 이 폴더에서 `claude` 를 실행 → `gemini-image` 서버 사용 승인. `/mcp` 로 확인.

## 쓰기

Claude 에게: "Gemini로 소방훈련 포스터 그림 만들어줘, 16:9"
→ `generated-images/` 에 저장, 미리보기가 대화에 뜬다.

```
python3 tools/gemini-image/server.py --cli "벚꽃 아래 소풍 가는 어린이들, 수채화" --aspect 16:9
```

## 옵션

| 항목 | 값 |
|---|---|
| aspect_ratio | 1:1(기본) · 16:9 · 9:16 · 4:3 · 3:4 · 3:2 · 2:3 · 21:9 |
| resolution | 512px · 1K(기본) · 2K · 4K — 클수록 비쌈 |
| reference_images | 참고 이미지(flash·pro 14장, lite 3장). CLI `--ref` |
| thinking_level | minimal · low · high (flash·pro). CLI `--thinking` |
| google_search | 구글 검색 근거(flash·pro). CLI `--search` |
| model | 기본 gemini-3.1-flash-image. 요청마다 `model` 로 바꾸거나 환경 변수 `GEMINI_IMAGE_MODEL` |

프롬프트 작성법은 [`../image-prompting/GUIDE.md`](../image-prompting/GUIDE.md).
