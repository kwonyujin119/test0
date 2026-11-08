#!/usr/bin/env python3
"""전략 브리핑 — 증권사 데일리 시황 · 투자전략 리포트에서 일간 전략과 주간 전략을 모은다 (AI 를 쓰지 않음).

자료: 네이버페이 증권 리서치의 '데일리'(시황) · '투자전략' 목록 (증권사 리포트 제목 · 요약 · 증권사 · 날짜 · 조회수)
  일간 전략: 가장 최근 발행일의 리포트 (주간 리포트 제외), 많이 읽힌 순
  주간 전략: 최근 7일 안의 Weekly · 주간 · 주차 · 위클리 리포트, 많이 읽힌 순
  자주 나온 말: 일간 리포트 요약에서 많이 나온 낱말 (규칙으로 셈)
쓰는 법: python3 strategy_briefing.py --out <폴더>   (표준 라이브러리만 씀)
"""
import argparse, collections, datetime as dt, html, json, os, re, sys, urllib.request

KST = dt.timezone(dt.timedelta(hours=9))
API = 'https://stock.naver.com/api/stockSecurity/researches/v2/{kind}?index={index}&size=50'
LINK = {'market': 'https://finance.naver.com/research/market_info_read.naver?nid={nid}', 'invest': 'https://finance.naver.com/research/invest_read.naver?nid={nid}'}
KIND_NAME = {'market': '데일리 시황', 'invest': '투자전략'}
WEEKLY = re.compile(r'weekly|위클리|주간|\d\s*주차|week', re.I)  # '국내주식' 같은 말에 걸리지 않게 좁힘
STOP = set('있는 있다 있음 등 및 대한 위한 따른 통해 이후 이번 지난 전일 금일 오늘 내일 이전 관련 가운데 기록 대비 하락 상승 마감 지수 시장 증시 주가 투자 전략 전망 예상 가능성 우려 기대 영향 확대 축소 유지 지속 발표 경우 이상 이하 정도 수준 중심 주요 최근 현재 향후 전후 모두 일부 하는 했다 한다 되는 된다 것으로 것이 것은 에서 으로 에게 부터 까지 미국 한국 국내 글로벌 대해 위해 전반 부담 Weekly weekly 주간 주차 Daily 데일리 리서치 코멘트 시황 마감 모닝 증권 리포트'.split())


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (DPV strategy briefing)', 'Accept': 'application/json', 'Referer': 'https://stock.naver.com/research'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode('utf-8'))


def text_of(h):
    h = re.sub(r'<br\s*/?>|</p>|</li>', '\n', h or '', flags=re.I)
    t = html.unescape(re.sub(r'<[^>]+>', '', h))
    lines = [re.sub(r'[ \t ]+', ' ', l).strip() for l in t.split('\n')]
    return '\n'.join(l for l in lines if l)


def collect(days=8, verbose=False):
    since = (dt.datetime.now(KST) - dt.timedelta(days=days)).strftime('%Y-%m-%d')
    out = []
    for kind in ('market', 'invest'):
        for index in range(0, 8):  # 50개씩 최대 400개
            try:
                j = get(API.format(kind=kind, index=index))
            except Exception as e:
                print(f'  ERR {kind} {index}: {e}', file=sys.stderr); break
            items = j.get('items') or []
            for x in items:
                d = (x.get('writeDate') or '')[:10]
                if d < since:
                    continue
                body = text_of(x.get('content'))
                out.append({'kind': kind, 'kindName': KIND_NAME[kind], 'nid': str(x.get('nid')), 'title': html.unescape(x.get('title') or '').strip(), 'broker': (x.get('brokerName') or '').strip(),
                            'date': d, 'reads': int(x.get('readCount') or 0), 'summary': body[:1200], 'link': LINK[kind].format(nid=x.get('nid'))})
            if verbose:
                print(f'  {kind} {index}: {len(items)}', file=sys.stderr)
            if not j.get('hasNext') or not items or min((x.get('writeDate') or '9')[:10] for x in items) < since:
                break
    seen, uniq = set(), []
    for x in out:  # 두 목록에 같은 리포트가 있으면 하나만
        k = (x['broker'], x['title'])
        if k not in seen:
            seen.add(k); uniq.append(x)
    return uniq


def keywords(texts, n=12):
    c = collections.Counter()
    for t in texts:
        words = set(re.findall(r'[A-Za-z][A-Za-z0-9&\-]{1,}|[가-힣]{2,}', t))
        for w in words:
            w2 = re.sub(r'(은|는|이|가|을|를|의|에|와|과|로|으로|도|만|에서|까지|부터)$', '', w) if re.match(r'[가-힣]', w) and len(w) > 2 else w
            if len(w2) >= 2 and w2 not in STOP and not w2.isdigit():
                c[w2] += 1
    return [{'word': w, 'count': k} for w, k in c.most_common(n) if k >= 2]


def build(verbose=False):
    now = dt.datetime.now(KST)
    items = collect(verbose=verbose)
    weekly = sorted([x for x in items if WEEKLY.search(x['title'])], key=lambda x: (-x['reads']))
    daily_pool = [x for x in items if not WEEKLY.search(x['title'])]
    latest = max((x['date'] for x in daily_pool), default='')
    daily = sorted([x for x in daily_pool if x['date'] == latest], key=lambda x: -x['reads'])
    week_from = (now - dt.timedelta(days=7)).strftime('%Y-%m-%d')
    weekly = [x for x in weekly if x['date'] >= week_from]
    for i, x in enumerate(daily, 1): x['rank'] = i
    for i, x in enumerate(weekly, 1): x['rank'] = i
    return {'date': now.strftime('%Y-%m-%d'), 'generatedAt': now.isoformat(timespec='minutes'), 'dailyDate': latest,
            'method': '증권사 데일리 시황 · 투자전략 리포트 (많이 읽힌 순, AI 사용 안 함)', 'source': '네이버페이 증권 리서치',
            'daily': daily[:30], 'weekly': weekly[:20], 'dailyKeywords': keywords([x['title'] + '\n' + x['summary'] for x in daily]),
            'weeklyKeywords': keywords([x['title'] + '\n' + x['summary'] for x in weekly]), 'counts': {'all': len(items), 'daily': len(daily), 'weekly': len(weekly)}}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default='briefing-out'); ap.add_argument('--keep', type=int, default=60); ap.add_argument('-v', '--verbose', action='store_true')
    a = ap.parse_args()
    data = build(a.verbose)
    if not data['daily'] and not data['weekly']:
        print('리포트를 하나도 모으지 못했습니다 — 저장하지 않음', file=sys.stderr); return 1
    d = os.path.join(a.out, 'strategy'); os.makedirs(d, exist_ok=True)
    w = lambda name, obj: open(os.path.join(d, name), 'w', encoding='utf-8').write(json.dumps(obj, ensure_ascii=False, indent=1))
    w('latest.json', data); w(data['date'] + '.json', data)
    try:
        dates = json.load(open(os.path.join(d, 'index.json'), encoding='utf-8')).get('dates', [])
    except Exception:
        dates = []
    dates = sorted(set(dates + [data['date']]), reverse=True)
    for old in dates[a.keep:]:
        try: os.remove(os.path.join(d, old + '.json'))
        except OSError: pass
    w('index.json', {'dates': dates[: a.keep], 'updated': data['generatedAt']})
    print(f"{data['date']}: 리포트 {data['counts']['all']} → 일간 {len(data['daily'])} ({data['dailyDate']}) · 주간 {len(data['weekly'])}", file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
