# GPT 이미지 커넥터

Claude(Opus)가 OpenAI 이미지 모델을 도구(`gpt_generate_image`)로 불러 그림을 만든다.
ChatGPT 앱에 로그인하는 방식이 아니라 **OpenAI API** 를 쓴다.

## 준비 (한 번)

1. https://platform.openai.com/api-keys 에서 API 키 발급, Billing 에 결제 수단 등록.
   - ChatGPT Plus 구독과 **별도 과금**(이미지 한 장당 과금, quality 가 높을수록 비쌈).
   - gpt-image 모델은 조직 인증(Verify organization)을 요구할 수 있다. 403 이 나면 확인.
2. 키를 환경 변수로 넣는다. **저장소에 커밋하지 않는다.**
   - Windows(PowerShell): `setx OPENAI_API_KEY "sk-..."` 후 터미널 다시 열기
   - macOS/Linux: `~/.zshrc` 등에 `export OPENAI_API_KEY=sk-...`
3. 이 폴더에서 `claude` 를 실행하면 `.mcp.json` 의 `gpt-image` 서버를 쓸지 묻는다 → 승인.
   `/mcp` 로 연결 상태를 본다. (Python 3 필요, 추가 설치 없음)

## 쓰기

Claude 에게: "GPT로 봄 소풍 교안 표지 그림 만들어줘, 가로형, 고품질"
→ `generated-images/` 에 PNG 저장, 미리보기가 대화에 뜬다.

터미널에서 바로 시험:

```
python3 tools/gpt-image/server.py --cli "벚꽃 아래 소풍 가는 어린이들, 수채화" --size 1536x1024
```

## 옵션

| 항목 | 값 |
|---|---|
| size | 자유(16의 배수, 긴 변<3840, 비율≤3:1). 예: 1024x1024 · 1536x864(16:9) · 1024x1536 · 2560x1440(2K) |
| quality | low · medium(기본) · high · xhigh · max · auto |
| n | 1~4 |
| background | auto · transparent · opaque (투명은 png/webp) |
| output_format | png(기본) · webp · jpeg |
| reference_images | 참고 이미지 경로들 → 편집 모드(캐릭터·스타일 유지, 합성). CLI `--ref` |
| model | 기본 gpt-image-2.6-sunburst. 요청마다 `model` 로 바꾸거나 환경 변수 `OPENAI_IMAGE_MODEL` |

프롬프트 작성법은 [`../image-prompting/GUIDE.md`](../image-prompting/GUIDE.md).
