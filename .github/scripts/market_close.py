#!/usr/bin/env python3
"""SECRET 장 마감 기록 — 매일 저녁(한국 시간 20시 이후) 그날의 시장을 모아 briefing 브랜치의 market/ 에 저장한다.

저장하는 것 (market/)
  YYYY-MM-DD.json · recent.json  하루 기록: ① 시장 온도(전략 요약과 같은 규칙) ② 코스피 종가 · 등락률 ③ 코스피 시가총액 상위 10개 종목 등락률
                                 지난 거래일도 채움(--backfill, 기본 60거래일). 지난 날의 상위 10개는 "수집한 날의 시총 상위 10개"의 그날 종가 등락률
  sumtemp.json                   전략 요약의 시장 온도를 날짜별로 (모닝 · 전략 브리핑이 있는 날 전부)
  stocks-kr.json · stocks-us.json 종목 코드 ↔ 이름 목록 (앱이 코드를 넣으면 이름을 채우는 데 씀). 하루 한 번만 새로 받음

시장 온도 = 전략 요약(secret.js renderSum)과 같은 규칙: 그날 모닝 브리핑 뉴스 제목 + 증권사 리포트 요약 문장 가운데
  오름 말(반등 · 상승 · 매수 …)이 든 문장 수와 내림 말(급락 · 우려 · 매도 …)이 든 문장 수. 오름 비율 60% 이상 '오름 신호가 우세', 40% 이하 '내림 · 위험 신호가 우세'.
  secret.js 의 POS · NEG 를 고치면 여기도 같이 고친다.

자료: 네이버 증권 모바일 API(공식 API 아님 — 형식이 바뀌면 실패), 나스닥 트레이더 종목 목록. 장이 열리지 않은 날은 하루 기록을 만들지 않는다.
AI 토큰을 쓰지 않는다. 앱(secret.js)이 이 파일을 읽어 노트에 날짜별로 남긴다.
"""
import argparse, datetime as dt, json, os, re, sys, time, urllib.request

KST = dt.timezone(dt.timedelta(hours=9))
UA = 'Mozilla/5.0 (DPV market close)'
VERBOSE = False
NV = 'https://m.stock.naver.com/api'
POS = re.compile(r'반등|상승|급등|매수|회복|호조|최고치|개선|기대|강세|순매수|돌파')
NEG = re.compile(r'급락|폭락|우려|투매|매도|하락|리스크|경계|부담|공포|약세|순매도|침체|쇼크')


def log(*a):
    if VERBOSE: print(*a, file=sys.stderr)


def get(url, enc=None, accept='application/json'):
    last = None
    for i in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept, 'Referer': 'https://m.stock.naver.com/'})
            with urllib.request.urlopen(req, timeout=30) as r:
                raw = r.read()
            return raw.decode(enc or 'utf-8', 'replace')
        except Exception as e:
            last = e; log('retry', url, e); time.sleep(2 * (i + 1))
    raise last


def num(s):
    if s is None: return None
    if isinstance(s, (int, float)): return float(s)
    s = str(s).replace(',', '').replace('%', '').replace('+', '').strip()
    try: return float(s)
    except ValueError: return None


def signed(chg, diff, cmp):
    code = str((cmp or {}).get('code') or '')
    if code in ('4', '5'):  # 4·5 = 하락
        if chg is not None and chg > 0: chg = -chg
        if diff is not None and diff > 0: diff = -diff
    return chg, diff


def jload(p, default):
    try:
        with open(p, encoding='utf-8') as f: return json.load(f)
    except Exception:
        return default


def jsave(p, v, indent=1):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f: json.dump(v, f, ensure_ascii=False, indent=indent, separators=None if indent else (',', ':'))


# ---------- 코스피 지수 ----------
def index_now():
    j = json.loads(get(f'{NV}/index/KOSPI/basic'))
    chg, diff = signed(num(j.get('fluctuationsRatio')), num(j.get('compareToPreviousClosePrice')), j.get('compareToPreviousPrice'))
    return {'close': num(j.get('closePrice')), 'diff': diff, 'chg': chg, 'date': (j.get('localTradedAt') or '')[:10]}


def daily(path, days):
    """일별 시세 (최근 → 과거). pageSize 는 60 이하만 받음"""
    out = {}
    page = 1
    while len(out) < days and page <= 10:
        rows = json.loads(get(f'{NV}/{path}/price?pageSize=30&page={page}'))
        if not rows: break
        for r in rows:
            chg, diff = signed(num(r.get('fluctuationsRatio')), num(r.get('compareToPreviousClosePrice')), r.get('compareToPreviousPrice'))
            out[(r.get('localTradedAt') or '')[:10]] = {'close': num(r.get('closePrice')), 'diff': diff, 'chg': chg}
        page += 1
    return out


# ---------- 종목 (시가총액 순) ----------
def market_list(mkt, stocks_only=True):
    out, page, total = [], 1, None
    while page <= 40:
        j = json.loads(get(f'{NV}/stocks/marketValue/{mkt}?page={page}&pageSize=100'))
        items = j.get('stocks') or []
        total = j.get('totalCount') or total
        for s in items:
            typ = s.get('stockEndType') or 'stock'
            if stocks_only and typ != 'stock': continue  # ETF · ETN 제외
            chg, _ = signed(num(s.get('fluctuationsRatio')), None, s.get('compareToPreviousPrice'))
            out.append({'code': s.get('itemCode'), 'name': s.get('stockName'), 'close': num(s.get('closePrice')), 'chg': chg, 'type': typ})
        if not items or (total and page * 100 >= int(total)): break
        page += 1
    return out


def stock_lists(d, now):
    """종목 코드 ↔ 이름 (하루 한 번). 실패해도 다른 일은 계속"""
    p = os.path.join(d, 'stocks-kr.json')
    old = jload(p, None)
    if old and old.get('at', '')[:10] == now.strftime('%Y-%m-%d'): return
    try:
        rows = []
        for mkt, m in (('KOSPI', 'P'), ('KOSDAQ', 'Q')):
            for s in market_list(mkt, stocks_only=False):
                if s['code'] and s['name']: rows.append([s['code'], s['name'], m, {'stock': 's', 'etf': 'e', 'etn': 'n'}.get(s['type'], 's')])
        if len(rows) > 2000: jsave(p, {'at': now.isoformat(timespec='seconds'), 'cols': ['code', 'name', 'market(P 코스피 · Q 코스닥)', 'type(s 주식 · e ETF · n ETN)'], 'rows': rows}, indent=None)
        print('한국 종목 목록', len(rows))
    except Exception as e:
        print('한국 종목 목록 실패:', e)
    try:
        rows, seen = [], set()
        for url, sym_i, etf_i, test_i in (('https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt', 0, 6, 3), ('https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt', 0, 4, 6)):
            for ln in get(url, accept='text/plain').splitlines()[1:]:
                c = ln.split('|')
                if len(c) <= max(etf_i, test_i) or c[test_i] == 'Y' or c[0].startswith('File Creation'): continue
                sym = c[sym_i].strip()
                if not sym or sym in seen or not re.match(r'^[A-Z.\-]{1,6}$', sym.replace('$', '')): continue
                seen.add(sym)
                name = re.sub(r'\s*-?\s*(Common Stock|Ordinary Shares?|Class A Common Stock|American Depositary Shares?.*)$', '', c[1].strip(), flags=re.I).strip() or c[1].strip()
                rows.append([sym, name[:60], 1 if c[etf_i] == 'Y' else 0])
        if len(rows) > 3000: jsave(os.path.join(d, 'stocks-us.json'), {'at': now.isoformat(timespec='seconds'), 'cols': ['symbol', 'name', 'etf'], 'rows': rows}, indent=None)
        print('미국 종목 목록', len(rows))
    except Exception as e:
        print('미국 종목 목록 실패:', e)


# ---------- 시장 온도 (전략 요약과 같은 규칙) ----------
def sum_temp(pub, day):
    md = jload(os.path.join(pub, day + '.json'), None)
    sd = jload(os.path.join(pub, 'strategy', day + '.json'), None)
    if not md and not sd: return None
    news, seen = [], set()
    for it in ((md or {}).get('items') or []) + [x for f in ((md or {}).get('byFeed') or []) for x in (f.get('items') or [])]:
        k = it.get('link') or it.get('title')
        if k in seen: continue
        seen.add(k); news.append(it)
    reps = ((sd or {}).get('daily') or []) + ((sd or {}).get('weekly') or [])
    pos = neg = 0
    for t in [n.get('title') or '' for n in news] + [ln for r in reps for ln in str(r.get('summary')).split('\n')]:
        if POS.search(t): pos += 1
        if NEG.search(t): neg += 1
    pp = round(pos / ((pos + neg) or 1) * 100)
    mood = '오름 신호가 우세' if pp >= 60 else '내림 · 위험 신호가 우세' if pp <= 40 else '오름 · 내림 신호가 엇갈림'
    return {'pos': pos, 'neg': neg, 'pp': pp, 'mood': mood, 'news': len(news), 'reports': len(reps),
            'rule': '전략 요약과 같은 규칙: 뉴스 제목 · 리포트 문장 가운데 오름 말 / 내림 말이 든 문장 수'}


def all_temps(pub):
    ds = set((jload(os.path.join(pub, 'index.json'), {}) or {}).get('dates') or []) | set((jload(os.path.join(pub, 'strategy', 'index.json'), {}) or {}).get('dates') or [])
    return {d: t for d in sorted(ds, reverse=True) if (t := sum_temp(pub, d))}


def main():
    global VERBOSE
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--force', action='store_true', help='장이 열리지 않은 날 · 20시 전이어도 오늘 기록 (시험용)')
    ap.add_argument('--backfill', type=int, default=60, help='지난 거래일 몇 일까지 채울지 (0 이면 안 함)')
    ap.add_argument('-v', action='store_true')
    a = ap.parse_args(); VERBOSE = a.v
    now = dt.datetime.now(KST); today = now.strftime('%Y-%m-%d')
    pub = a.out; d = os.path.join(pub, 'market')
    os.makedirs(d, exist_ok=True)

    stock_lists(d, now)
    temps = all_temps(pub)
    jsave(os.path.join(d, 'sumtemp.json'), {'at': now.isoformat(timespec='seconds'), 'dates': temps})
    print('전략 요약 온도', len(temps), '일')

    rp = os.path.join(d, 'recent.json')
    recent = {r['date']: r for r in jload(rp, []) if r.get('date')}

    # 1) 오늘
    idx = index_now(); log('index', idx)
    open_today = idx['date'] == today
    if (open_today and now.hour >= 20) or a.force:
        old = recent.get(idx['date'] or today)
        if old and not old.get('backfill') and len(old.get('top10') or []) == 10 and not a.force:
            print('오늘 기록이 이미 있습니다')
        else:
            st = market_list('KOSPI')
            st = [s for s in st if s.get('name') and s.get('chg') is not None]
            up = sum(1 for s in st if s['chg'] > 0); down = sum(1 for s in st if s['chg'] < 0)
            day = idx['date'] or today
            recent[day] = {
                'date': day, 'at': now.isoformat(timespec='seconds'),
                'kospi': {'close': idx['close'], 'diff': idx['diff'], 'chgPct': idx['chg']},
                'breadth': {'up': up, 'down': down, 'flat': len(st) - up - down, 'total': len(st)} if st else None,
                'top10': [{'rank': i + 1, 'code': s['code'], 'name': s['name'], 'close': s['close'], 'chgPct': s['chg']} for i, s in enumerate(st[:10])],
                'top10Basis': '그날 코스피 시가총액 상위 10 · 주식만(ETF · ETN 제외, 우선주 포함) · 네이버 증권 당일 종가(20시 이후 값 — 시간외 · 넥스트레이드 거래가 반영돼 한국거래소 15:30 종가와 조금 다를 수 있음)',
            }
            print(f"{day} 코스피 {idx['close']} ({idx['chg']:+.2f}%) · 상위 10 {len(st[:10])}개")
    else:
        print(f'오늘 기록은 건너뜀 (장 {"열림" if open_today else "안 열림"} · {now:%H:%M})')

    # 2) 지난 거래일 채우기 — 빠진 날만
    if a.backfill > 0:
        try:
            ih = daily('index/KOSPI', a.backfill + 1)
            past = sorted([x for x in ih if x and x < today], reverse=True)[:a.backfill]
            miss = [x for x in past if x not in recent]
            if miss:
                base = next((r for r in sorted(recent.values(), key=lambda r: r['date'], reverse=True) if not r.get('backfill') and len(r.get('top10') or []) == 10), None)
                top = [(t['code'], t['name']) for t in base['top10']] if base else [(s['code'], s['name']) for s in market_list('KOSPI')[:10]]
                hist = {}
                for code, _ in top:
                    try: hist[code] = daily('stock/' + code, a.backfill + 1)
                    except Exception as e: log('hist fail', code, e)
                for x in miss:
                    k = ih[x]
                    recent[x] = {
                        'date': x, 'at': now.isoformat(timespec='seconds'), 'backfill': True,
                        'kospi': {'close': k['close'], 'diff': k['diff'], 'chgPct': k['chg']}, 'breadth': None,
                        'top10': [{'rank': i + 1, 'code': c, 'name': n, 'close': (hist.get(c, {}).get(x) or {}).get('close'), 'chgPct': (hist.get(c, {}).get(x) or {}).get('chg')} for i, (c, n) in enumerate(top)],
                        'top10Basis': f'지난 날 채움 — {today} 에 받은 시가총액 상위 10 종목의 그날 종가 등락률(그날의 순위와 다를 수 있음) · 네이버 증권',
                    }
                print('지난 거래일 채움', len(miss), '일')
        except Exception as e:
            print('지난 거래일 채우기 실패:', e)

    # 3) 모든 날의 시장 온도를 전략 요약 규칙으로 다시 붙이고 저장
    for r in recent.values():
        r['temp'] = temps.get(r['date'])
    rows = sorted(recent.values(), key=lambda r: r['date'], reverse=True)[:120]
    for r in rows:
        jsave(os.path.join(d, r['date'] + '.json'), r)
    jsave(rp, rows)
    print('recent.json', len(rows), '일 · 온도 있는 날', sum(1 for r in rows if r.get('temp')))


if __name__ == '__main__':
    main()
