# hwp-pua.woff2

한컴 한글이 자체 영역(Unicode 사용자 정의 영역, PUA)에 둔 기호(예: U+F02B1 = ①)를 브라우저에서 보이게 하는 작은 글꼴입니다.
문서 속 글자는 바꾸지 않고(저장 때 원래 글자 그대로), 화면에서만 표준 기호 모양을 빌려 그립니다.

- 글자 모양 출처: Noto Sans CJK KR (© Google / Adobe, SIL Open Font License 1.1 — https://openfontlicense.org) 에서 필요한 글자만 뽑음
- 이 파일도 SIL OFL 1.1 을 따릅니다. 글꼴 이름: HWP PUA
- 매핑: U+F02B1~F02C4 → ①~⑳ (rhwp/auto-hwp 의 한컴 PDF 대조 표), 그 밖의 항목과 추정 항목은 `tools/build-hwp-pua.py` 주석 참고
- 다시 만들기: `python3 tools/build-hwp-pua.py NotoSansCJK-Regular.ttc app/fonts/hwp-pua.woff2` (fontTools, brotli 필요)
