# SECRET 슈퍼 플랫폼 — 지속 수익의 조건과 설계

기준일: 2026-11-11. 이 문서는 SECRET(주식 투자 도우미)을 "꾸준히 수익을 이어가는 플랫폼"으로 키우기 위한 근거, 지금 구현한 것, 다음 세션에서 할 일을 정리합니다.

## 먼저 짚을 한계

- **수익을 보장하는 방법은 찾지 못했습니다.** 자료가 반복해서 보여 준 것은 "이기는 법"이 아니라 "크게 지는 길"이었습니다. 미국 대형주 액티브 펀드의 89%가 5년 동안 지수에 뒤졌고, 대만 데이트레이더 가운데 꾸준히 이긴 사람은 1% 미만이었습니다. 2020년 이후 국내 신규 개인투자자는 62%가 손실을 봤습니다.
- 그래서 이 플랫폼의 목표는 예측을 잘하는 것이 아닙니다. 비용 · 회전율 · 낙폭 · 행동 실수를 줄여 **살아남는 확률**을 높이는 것입니다.
- **확인 범위:** 조사 세션의 네트워크 정책 때문에 spglobal.com · dalbar.com · morningstar.com · kcmi.re.kr 등의 원문은 직접 열지 못했습니다. 수치는 검색 결과의 초록 · 요약 · 보도에서 확인했습니다. "원문 확인 필요"로 표시한 값은 투자 판단에 쓰기 전에 원문으로 확인하세요.

## 레퍼런스

| # | 자료 | 핵심 수치 · 결론 | SECRET 에 옮긴 것 | URL |
|---|---|---|---|---|
| R1 | SPIVA U.S. Year-End 2025 (S&P DJI, 2026) | 대형주 액티브의 지수 미달 비율: 1년 79%, 3년 67%, 5년 89% | 핵심(지수) 비중 점검 | https://www.spglobal.com/spdji/en/spiva/article/spiva-us-year-end-2025/ |
| R2 | SPIVA Persistence Scorecard 2025 | 상위 펀드가 다음 기간에도 상위에 남는 경우는 극소수(비율 원문 확인 필요) | 같은 근거 | https://www.spglobal.com/spdji/en/documents/spiva/persistence-scorecard-year-end-2025.pdf |
| R3 | Carhart (1997) | 펀드 성과가 이어지는 현상은 모멘텀과 비용으로 거의 설명됨. 꾸준한 것은 최하위 펀드의 부진뿐 | 같은 근거 | https://ideas.repec.org/a/bla/jfinan/v52y1997i1p57-82.html |
| R4 | Barber · Odean, Trading Is Hazardous to Your Wealth (2000) | 66,465가구 조사. 가장 많이 거래한 20%는 연 11.4%, 시장은 17.9% | 회전율 점검 | https://faculty.haas.berkeley.edu/odean/papers/returns/Returns.html |
| R5 | Barber · Lee · Liu · Odean (2009) | 대만 개인투자자 전체가 연 3.8%p 손실. 대부분 시장가 주문에서 생김 | 회전율 · 감정 매매 | https://faculty.haas.berkeley.edu/odean/papers%20current%20versions/justhowmuchdoindividualinvestorslose_rfs_2009.pdf |
| R6 | Barber 외, Day Trading (2014) | 비용을 빼고 꾸준히 이긴 데이트레이더는 1% 미만 | 단타 대신 결정 카드 | https://econpapers.repec.org/RePEc:eee:finmar:v:18:y:2014:i:c:p:1-24 |
| R8 | Chague 외, Day Trading for a Living? (2019) | 300일 넘게 한 사람의 97%가 손실 | 같은 근거 | https://ideas.repec.org/p/spa/wpaper/2019wpecon47.html |
| R9 | Barber · Odean, Boys Will Be Boys (2001) | 과잉확신 → 45% 더 거래 → 위험조정 수익 연 1.4%p 낮음 | 감정 매매 비율 | https://faculty.haas.berkeley.edu/odean/papers/gender/gender.html |
| R11 | Barber · Odean, All That Glitters (2008) | 개인은 뉴스 · 거래량 급증으로 눈에 띈 종목을 사고, 그 종목은 이후 부진 | 냉각 대기열 | https://ideas.repec.org/a/oup/rfinst/v21y2008i2p785-818.html |
| R12 | DALBAR QAIB 2026 | 투자자와 S&P 500 의 수익 차이: 2024년 8.48%p, 2025년 0.72%p. 해마다 크게 흔들림 | 정해진 날 리밸런싱 | https://www.dalbar.com/PressReleases/doc/2026QAIBReportPressRelease.pdf |
| R13 | Morningstar, Mind the Gap 2025 | 투자자가 실제로 얻은 수익이 펀드 수익보다 연 약 1.2%p 낮음 | 같은 근거 | https://www.morningstar.com/business/insights/research/mind-the-gap-2025 |
| R14 | Bessembinder, Do Stocks Outperform T-Bills? (2018) | 58%의 종목이 평생 단기 국채보다 못함. 4.3%의 종목이 초과 부(富) 전부를 만듦 | 한 종목 최대 비중 | https://wpcarey.asu.edu/sites/default/files/2021-10/do-stocks-outperform-treasury-bills.pdf |
| R15 | Bessembinder 외, 64,000 Global Stocks (2023) | 미국 밖 종목도 57.4%가 단기 국채 미달 | 같은 근거 | https://rpc.cfainstitute.org/research/financial-analysts-journal/2023/long-term-shareholder-returns-evidence-from-64000-global-stocks |
| R16 | 자본시장연구원, 코로나19 국면의 개인투자자 (2021) | 신규 투자자의 62% 손실. 다음 날 이익 종목은 41% 팔고 손실 종목은 22%만 팜. 거래 이익 약 13조 원, 거래 비용 약 13.7조 원 | 손절가 · 감정 매매 | 보도: https://www.fnnews.com/news/202104131912345956 (원문 URL 확인 필요) |
| R17 | 자본시장연구원 이슈보고서 22-02 | 2020년 국내 개인의 연 회전율 약 1,600% | 회전율 한도 | 원문 URL 확인 필요 |
| R18 | 자본시장연구원, 개인 해외투자 성과 (2026) | 해외 투자자의 약 절반이 시장 평균 미달. 비용을 빼면 손실이 더 많음 | 세금 · 비용 | 보도: https://www.segye.com/newsView/20260210505629 |
| R20 | 금감원, 단일종목 레버리지 ETF 손실 (2026, 보도) | 개인 총손실 약 6.3조 원 | 레버리지 점검 | 원문 확인 필요 |
| R21 | deHaan · Glover (2024) | 거래할 수 있는 시간이 줄면 개인의 성과가 좋아짐 | 냉각 시간(간접 근거) | https://www.gsb.stanford.edu/insights/more-time-trade-isnt-good-thing-many-retail-investors |
| R22–R25 | Kelly (1956), Thorp (2006), MacLean · Thorp · Ziemba (2010) | 풀 켈리는 50% 낙폭 확률이 50%. 절반 켈리는 성장률의 약 3/4 을 유지 | 1회 감수 손실 · 걸린 위험 합계 | https://www.stat.berkeley.edu/~aldous/157/Papers/Good_Bad_Kelly.pdf |
| R26 | Statman (1987) | 무작위 분산에는 30–40종목이 필요 | 분산(지수로 대신함) | https://ideas.repec.org/a/cup/jfinqa/v22y1987i03p353-363_01.html |
| R27 | Tharp · Elder, 1–2% 규칙 | 1회 위험을 자본의 1–2%로 제한하는 실무 경험칙(실증 검증은 없음) | 매매 계획 계산기 | (실무서) |
| R28 | Cheng · Madhavan (2009) | 레버리지 ETF 는 경로에 따라 수익이 달라지는 변동성 끌림이 있음 | 레버리지 점검 | https://joim.com/dynamics-leveraged-inverse-exchange-traded-funds |
| R29–R35 | Jegadeesh-Titman (1993), Daniel-Moskowitz (2016), Fama-French 5팩터 (2015), Novy-Marx (2013), Arnott 외 (2021), Faber (2007), Moskowitz 외 (2012) | 모멘텀 · 가치 · 퀄리티 · 추세에는 근거가 있지만 길게 부진함(가치 팩터 약 13년 −55%, 모멘텀 급락) | 다음 단계: 팩터 점수 · 10개월선 추세 필터 | https://www.nber.org/papers/w20439 · https://www.researchaffiliates.com/insights/journal-papers/reports-of-values-death-may-be-greatly-exaggerated |
| R36–R38 | Harvey · Liu · Zhu (2016), Bailey 외 PBO (2017), McLean · Pontiff (2016) | 우연을 거르려면 t > 3. 예측력은 출판 후 58% 줄어듦 | 다음 단계: 규칙 백테스트 할인 · 경고 | https://www.nber.org/papers/w20592.pdf · https://papers.ssrn.com/abstract=2326253 |
| R39–R40 | 버핏 90/10 지시 (2013 서한), 10년 내기 (2008–17) | 지수 +125.8%, 펀드오브펀드 5개는 +2.8~87.7% | 핵심(지수) 비중 | https://www.cnbc.com/2018/02/24/warren-buffett-on-how-he-turned-a-300000-bet-into-2-million-for-charity-in-10-years.html |
| R43 | Bogle, All-In Investment Expenses (2014) | 액티브 펀드의 실질 총비용 연 약 2.27% | 비용 · 세금 | https://rpc.cfainstitute.org/research/financial-analysts-journal/2014/the-arithmetic-of-all-in-investment-expenses |
| R45 | Klein, Project Premortem (HBR 2007) | 실패를 가정하면 이유를 약 30% 더 찾음(성과 효과는 미검증) | 냉각 대기열의 실패 가정 칸 | https://hbr.org/2007/09/performing-a-project-premortem |
| R46 | Annie Duke, Thinking in Bets (2018) | 결과로 결정을 평가하는 오류(resulting) | 결정 카드 채점(이미 있음) | (도서) |
| R47–R48 | Pabrai 체크리스트, Haynes · Gawande (NEJM 2009) | 수술 체크리스트로 사망률 1.5% → 0.8%(의료 근거) | 매수 전 체크리스트(이미 있음) | https://www.fool.com/investing/general/2013/01/08/checklist-investing-how-to-avoid-errors-and-learn.aspx |
| R49–R50 | Shefrin · Statman (1985), Odean (1998), Kahneman · Tversky (1979), Benartzi · Thaler (1995) | 처분 효과, 손실 회피(약 2배), 자주 볼수록 손실을 크게 체감 | 손절가 · 월 1회 평가액 | https://www.nber.org/papers/w4369 |
| R51 | Bonaparte · Cooper (2010) | 많이 거래하는 가구의 저성과 일부는 자기선택 때문일 수 있음(반론) | 한계로 기록 | https://www.nber.org/papers/w16022.pdf |

**세금 · 계좌 (2026-11 기준):**
- 해외 주식 양도세는 22%이고, 연 250만 원을 기본 공제합니다. 해외 주식끼리는 손익을 통산하고, 결제일 기준으로 연도를 나눕니다.
- 한국에는 개인 투자자에게 적용하는 워시세일 규정이 없습니다.
- 증권거래세는 2026년부터 코스피 · 코스닥 모두 0.20%입니다.
- 배당은 15.4%로 원천징수하고, 이자 · 배당을 합쳐 연 2천만 원을 넘으면 종합과세합니다.
- ISA 는 연 2천만 원(총 1억 원)까지 넣을 수 있고, 일반형 200만 원 · 서민형 400만 원까지 비과세입니다.
- 연금저축 + IRP 세액공제 한도는 900만 원입니다.
- 「2026 세제개편안」의 ISA 개편안(생산적금융 ISA)은 국회 처리 전이라 미확정입니다.

**KIS Open API:**
- 실전 서버는 `openapi.koreainvestment.com:9443`, 모의 서버는 `openapivts.koreainvestment.com:29443` 입니다.
- 토큰은 `/oauth2/tokenP` 로 받습니다. 약 24시간 쓸 수 있고, 1분에 1번만 발급됩니다.
- 국내 현재가 tr_id 는 `FHKST01010100`, 해외 현재가 tr_id 는 `HHDFS00000300` 입니다.
- 실전 서버는 초당 약 20건까지 부를 수 있습니다(공식 원문 확인 필요).
- 브라우저에서 바로 부를 수 있는지(CORS)는 확인하지 못했습니다. 앱시크릿을 보호하려면 어차피 중계를 거쳐야 합니다. SECRET 은 Cloudflare 중계를 씁니다.

## 지속 수익의 조건 → SECRET 기능

| 조건 | 근거 | SECRET 기능 | 상태 |
|---|---|---|---|
| 1. 핵심 자산은 저비용 지수 | R1–R3, R39, R40, R43 | 수익 엔진: 핵심(지수) 비중 점검, 리밸런싱 금액 | 이번에 구현 |
| 2. 회전율을 낮게 | R4, R5, R9, R16, R17 | 수익 엔진: 1년 회전율(한도 100%, 2배를 넘으면 위반) | 이번에 구현 |
| 3. 데이트레이딩 피하기 | R6–R8 | 결정 카드 · 점검일 채점 | 이미 있음 |
| 4. 낙폭 한도와 회복 수학 | R24, R25 | 평가액 기록 → 고점 대비 하락. 허용치의 절반이면 새 매매 크기를 절반, 허용치면 새 매매 중지 | 이번에 구현 |
| 5. 포지션 크기(1–2%, 부분 켈리) | R22–R27 | 매매 계획 계산기 · position_size, 걸린 위험 합계 한도 | 계산기는 이미 있음, 합계 점검은 이번에 구현 |
| 6. 분산 · 한 종목 상한 | R14, R15, R26 | 한 종목 최대 비중 점검(나의 원칙 값) | 이번에 구현 |
| 7. 레버리지 · 인버스 제한 | R19, R20, R28 | 레버리지 보유 경고 | 이번에 구현 |
| 8. 검증된 규칙 · 오래 부진할 각오 | R29–R35 | 추세 필터(10개월선), 팩터 점수 | 다음 세션 |
| 9. 백테스트 과최적화 막기 | R36–R38 | 내 규칙 백테스트 + 결과 할인 · 시도 수 기록 | 다음 세션 |
| 10. 행동 갭: 정해진 날, 냉각 | R12, R13, R21, R50 | 리밸런싱 허용 폭, 냉각 대기열(기본 24시간) | 이번에 구현 |
| 11. 처분 효과 · 눈에 띈 종목 | R11, R16, R49 | 손절가 점검, 감정 매매 비율 | 이번에 구현. 이익 · 손실 실현 비율(PGR/PLR)은 다음 세션 |
| 12. 기록 · 사전 실패 가정 · 체크리스트 | R45–R48 | 결정 카드 · 체크리스트(이미 있음), 실패 가정 칸(이번에 구현) | 이번에 구현 |
| 세금 · 비용 | R43, 세법 | 해외 주식 실현 손익과 250만 원 공제 남은 금액, 손실 · 이익 실현 후보 | 이번에 구현 |

## 이번에 구현한 것

- **수익 엔진**(`secret.html#engine`)
  - 11개 조건을 통과 · 주의 · 위반 · 자료 없음으로 나눠 보여 줍니다. 항목마다 근거와 할 일이 붙습니다.
  - **오늘의 규칙:** 새 매매 크기를 정상 · 절반 · 중지 가운데 하나로 정합니다.
  - **리밸런싱:** 핵심 · 위성 · 현금 목표에서 허용 폭(±5%p)을 넘으면 옮길 금액을 보여 줍니다.
  - **냉각 대기열:** 사고 싶은 이유와 실패 가정을 함께 적습니다. 정한 시간이 지나면 결정 카드로 넘깁니다.
  - **세금:** 해외 주식의 올해 실현 손익, 남은 공제, 실현 후보를 보여 줍니다.
  - **평가액 기록:** 월 1회 계좌 총액을 적어 고점 대비 하락을 계산합니다.
  - **설정:** 목표 비중, 한도, 냉각 시간, 환율, 핵심 · 위성 구분.
  - 기기 동기화에 `engine` 칸을 더했습니다.
- **AI 도구 `get_profit_engine`:** 계좌 · 비중 · "지금 사도 되나" · 세금을 물으면 AI 가 먼저 부릅니다. 결과의 sizeFactor 를 수량 계산에 반영합니다.
- **한국투자증권 API 등록 배너:** 오늘 한눈에 · 수익 엔진 화면에 뜹니다. 단계 안내 → KIS Developers → 중계 만드는 법 → 중계 카드 순서로 이어지고, 2주 동안 숨길 수 있습니다. KIS 실시간 시세가 켜지면 사라집니다.
- **레퍼런스 화면:** 「지속 수익의 근거」 10개를 더했습니다.

## 장 마감 노트 · 키워드 추적 · 종목 이름 · API 수익 루틴 (2026-11-11 추가)

- **장 마감 노트:** 평일 20시 이후 그날의 ① 시장 온도 ② 코스피 등락률 ③ 코스피 시가총액 상위 10개 종목 등락률을 노트에 그날 날짜로 남깁니다.
  - `.github/workflows/market-close.yml`(20:04 · 20:27 · 21:41, 평일)이 `.github/scripts/market_close.py` 를 돌려 `briefing` 브랜치 `market/` 에 저장합니다. 예약 실행이 빠지면 `.github/market-run.txt` 를 바꿔 `main` 에 올리면 바로 실행됩니다(첫날 20:04 · 20:27 예약이 실제로 빠졌음).
  - **시장 온도 = 전략 요약의 시장 온도**(같은 규칙): 그날 모닝 브리핑 뉴스 제목 + 증권사 리포트 문장 가운데 오름 말 / 내림 말이 든 문장 수. 브리핑이 없는 날(2026-11-08 이전)은 "기록 없음"입니다. 규칙을 바꾸면 `secret.js` 의 `POS` · `NEG` · `sumTempOf` 와 `market_close.py` 를 같이 고칩니다.
  - **지난 날:** 최근 60거래일을 채웁니다. 지난 날의 상위 10개는 "수집한 날의 시총 상위 10개"의 그날 종가 등락률이라 그날의 실제 순위와 다를 수 있습니다(노트에 밝힘).
  - 종목 등락률은 네이버 증권이 그날 종가로 내놓는 값(20시 이후)입니다. 2026-11-11 삼성전자는 19:28 에 +4.32%, 20시 이후 +4.58% — 시간외 · 넥스트레이드 거래가 반영된 것으로 보이며 한국거래소 15:30 종가와 다를 수 있습니다(원문 확인 못 함).
  - 노트 번호가 날짜로 고정(`mkt-YYYY-MM-DD`)이라 기기마다 하나로 합쳐집니다. 지운 날은 다시 만들지 않고, 손대지 않은 자동 노트만 새 형식으로 바꿉니다(`autoHash`).
- **전략 요약 날짜별:** 날짜를 골라 그날의 전략 요약을 다시 볼 수 있습니다. 위 상자는 반으로 나눠 왼쪽은 날짜별 시장 온도 띠(`market/sumtemp.json`), 오른쪽은 날짜(세로) × 시장 온도 · 코스피 · 코스닥 등락률(가로) 그래프입니다. 단위가 달라 세 칸으로 나눴고(온도는 50% 기준, 두 지수는 같은 눈금), 코스닥은 `recent.json` 의 `kosdaq` 입니다.
- **키워드 추적**(`secret.html#track`): 모닝 브리핑 뉴스 · 증권사 리포트(날짜별 파일) · AI 대화 · 노트 · 매매 일지에서 찾고 날짜별 건수를 보여 줍니다. 추적 키워드는 `me.track`(기기 동기화), 지난 날짜 파일은 줄여서 Cache Storage `sec-corpus-v1` 에 둡니다. AI 도구 `search_records` 도 같은 검색을 씁니다.
- **종목 코드 ↔ 이름:** `market/stocks-kr.json`(코스피 · 코스닥 주식 · ETF · ETN, 네이버) · `market/stocks-us.json`(나스닥 트레이더 목록)을 하루 한 번 받습니다. 관심 종목 추가 대화상자 · 오늘 한눈에 레이더 · 관심 종목 화면의 빠른 추가 줄에서 코드 · 티커 → 이름, 이름 → 코드 목록. 이름이 빈 기존 종목도 채웁니다. DART 고유번호(8자리)는 아직 지원하지 않습니다.
- **API 수익 루틴**(수익 엔진): 등록한 API 로 ① 추세 필터(KODEX 200 의 200일선, 아래면 새 위성 매매 크기 절반) ② 보유 종목 추세 × 손익(처분 효과) · 손절/목표 ③ 보유 종목 위험 공시(7일)를 6시간마다 점검합니다. 수익을 약속하지 않고 큰 손실을 피하는 규칙만 다룹니다. 추세 필터 결과는 아직 `engineState` 의 sizeFactor 에 넣지 않았습니다(다음 세션 1번 백테스트로 검증한 뒤 넣을 것).

## 다음 세션 할 일 (세션별로 나눔 · 겹치지 않게)

1. **규칙 검증 세션** — 내 규칙 백테스트(10개월선 추세 필터, 모멘텀 · 퀄리티 점수)
   - 시도한 조합 수를 기록하고, 표본 밖 30% 를 떼어 두고, 결과를 50% 할인해 보여 줍니다(R29–R38).
   - 파일: `app/secret/backtest.js` 를 새로 만들고, `secret.js` 에는 화면 · 도구 연결만 넣습니다.
2. **행동 코칭 세션** — 실현 비율 PGR/PLR(처분 효과), 급등 · 거래량 급증 종목을 살 때 체크리스트 강제, 결정 2×2 회고(좋은/나쁜 결정 × 좋은/나쁜 결과)(R11, R46, R49).
3. **모니터링 세션** — 손절가 이탈 · 낙폭 단계 · 리밸런싱 날짜를 앱을 닫아도 오는 알림(웹 푸시)으로 보냅니다. 실적 · 배당 · 금리 일정도 함께 보냅니다.
4. **세금 · 계좌 세션** — 국내 증권거래세 · 수수료를 반영한 실질 비용, ISA · 연금 계좌별 배치 제안, 연말 손익 실현 일정(결제일 계산), 세제개편안 확정 반영.
5. **KIS 심화 세션** — 중계로 해외 현재가(HHDFS00000300)를 받고, 토큰 재사용 상태를 표시합니다.
