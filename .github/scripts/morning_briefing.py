#!/usr/bin/env python3
"""모닝 브리핑 — 국내 경제 뉴스 피드에서 주식 투자 관련 '큰 이슈' 15개를 고른다 (AI 를 쓰지 않음).

고르는 법
  1. 여러 피드(Google 뉴스 경제 · 검색, 연합뉴스 · 한국경제 · 매일경제 RSS)에서 최근 24시간 기사를 모은다.
  2. 제목이 비슷한 기사(글자 두 개씩 묶은 조각의 겹침)를 한 이슈로 묶는다.
  3. 점수 = 다룬 언론 수 × 3 + 기사 수 + 시장 핵심어 가중치(금리 · 환율 · 실적 · 관세 …) + 최신 가산점.
     광고 · 종목 추천 · 리딩방 같은 글은 뺀다. 같은 분야가 너무 몰리지 않게 분야마다 5개까지.
  4. 위에서 15개를 골라 latest.json · YYYY-MM-DD.json · index.json 으로 저장한다.

쓰는 법: python3 morning_briefing.py --out <폴더>   (표준 라이브러리만 씀)
"""
import argparse, datetime as dt, email.utils, html, json, os, re, sys, urllib.parse, urllib.request
from xml.etree import ElementTree as ET

KST = dt.timezone(dt.timedelta(hours=9))
UA = 'Mozilla/5.0 (DPV morning briefing; GitHub Actions)'

QUERIES = [
    '코스피 OR 코스닥 OR 증시', '뉴욕증시 OR 나스닥 OR S&P500 OR 다우', '금리 OR 연준 OR FOMC OR 기준금리', '환율 OR 원달러',
    '국제유가 OR 금값 OR 원자재', '실적 발표 OR 영업이익 OR 어닝', '반도체 주가 OR 엔비디아 OR 삼성전자 OR SK하이닉스', '관세 OR 무역 OR 수출',
    '외국인 순매수 OR 순매도', '공시 OR 유상증자 OR 자사주 OR 배당', '비트코인 OR 가상자산', '공모주 OR 상장 OR IPO',
]
FEEDS = (['https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ko&gl=KR&ceid=KR:ko']
         + ['https://news.google.com/rss/search?q=' + urllib.parse.quote(q + ' when:1d') + '&hl=ko&gl=KR&ceid=KR:ko' for q in QUERIES]
         + ['https://www.yna.co.kr/rss/economy.xml', 'https://www.yna.co.kr/rss/market.xml',
            'https://www.hankyung.com/feed/finance', 'https://www.hankyung.com/feed/economy',
            'https://www.mk.co.kr/rss/50200011/', 'https://www.mk.co.kr/rss/30100041/'])
QUERY_LABELS = ['국내 증시', '미국 증시', '금리 · 연준', '환율', '원자재 · 금', '실적', '반도체', '관세 · 무역', '외국인 수급', '공시 · 배당', '가상자산', '공모주 · 상장']
FEED_NAMES = (['구글 뉴스 · 경제 헤드라인'] + ['구글 뉴스 · ' + q for q in QUERY_LABELS]
              + ['연합뉴스 · 경제', '연합뉴스 · 마켓+', '한국경제 · 증권', '한국경제 · 경제', '매일경제 · 증권', '매일경제 · 경제'])
PER_FEED = 5
HOST_NAME = {'yna.co.kr': '연합뉴스', 'hankyung.com': '한국경제', 'mk.co.kr': '매일경제'}

KW = {'기준금리': 3, '금리': 3, '연준': 3, 'FOMC': 3, '파월': 2, 'CPI': 3, '물가': 2, '인플레': 2, '고용': 2, 'GDP': 2, '국채': 2, '침체': 2,
      '환율': 2, '원·달러': 2, '원달러': 2, '달러': 1, '유가': 2, '금값': 1, '관세': 3, '무역': 1, '수출': 2,
      '코스피': 3, '코스닥': 2, '나스닥': 2, 'S&P': 2, '다우': 1, '증시': 2, '뉴욕증시': 2, '주가': 1,
      '급등': 2, '급락': 2, '폭락': 2, '폭등': 2, '최고치': 2, '사상 최고': 2, '최저': 1,
      '실적': 2, '영업이익': 2, '어닝': 2, '매출': 1, '가이던스': 2, '반도체': 2, 'HBM': 2, 'AI': 1,
      '외국인': 1, '기관': 1, '순매수': 1, '순매도': 1, '공매도': 2, 'IPO': 1, '상장': 1, '공모주': 1,
      '유상증자': 2, '자사주': 1, '배당': 1, '인수': 1, '합병': 1, 'M&A': 1, '규제': 1, '밸류업': 2, '금투세': 2, '비트코인': 1}
SPAM = ['추천주', '리딩방', '무료 상담', '무료', '급등주 공개', '종목 추천', '수익 보장', '광고', '이벤트', '경품', '할인', '모집', '[포토]', '포토]', '[사진]', '[영상]', '운세', '부고', '인사]', '[인사']
CATS = [
    ('거시 · 금리', ['기준금리', '금리', '연준', 'FOMC', '파월', 'CPI', '물가', '인플레', '고용', 'GDP', '국채', '침체', '한국은행', '한은']),
    ('환율 · 원자재', ['환율', '원·달러', '원달러', '달러', '유가', '금값', '원자재', '구리']),
    ('정책 · 무역', ['관세', '무역', '수출', '규제', '밸류업', '금투세', '정부', '법안', '세제']),
    ('해외 증시', ['뉴욕증시', '나스닥', 'S&P', '다우', '미국 증시', '미 증시', '엔비디아', '테슬라', '애플']),
    ('국내 증시', ['코스피', '코스닥', '외국인', '기관', '공매도', '순매수', '순매도', '증시']),
    ('기업 · 실적', ['실적', '영업이익', '매출', '어닝', '가이던스', '인수', '합병', '유상증자', '자사주', '배당', '수주', '상장', '공모주', 'IPO']),
    ('가상자산', ['비트코인', '가상자산', '코인', '이더리움']),
]
PREF = ['연합뉴스', '연합인포맥스', '한국경제', '매일경제', '서울경제', '머니투데이', '이데일리', '조선비즈', '뉴스1', '뉴시스', '헤럴드경제', '아시아경제', '파이낸셜뉴스', '한국경제TV', '비즈워치', 'KBS', 'SBS', 'MBC', 'YTN']
# 주식 시장과 바로 이어지는 말 — 이 중 하나는 있어야 브리핑에 넣는다 (농산물 수출 · 행사 소식 등을 거름)
STRONG = ['코스피', '코스닥', '증시', '주가', '주식', '나스닥', 'S&P', '다우', '뉴욕증시', '기준금리', '금리', '연준', 'FOMC', 'CPI', '물가', '국채',
          '환율', '원·달러', '원달러', '유가', '관세', '실적', '영업이익', '어닝', '외국인', '순매수', '순매도', '공매도', '반도체', 'HBM',
          '상장', '공모주', 'IPO', '비트코인', '시가총액', '시총', '배당', '자사주', '유상증자', '밸류업', '금투세', '투자자', '급락', '급등', '폭락']
# 정치 공방 기사는 점수를 깎음 (시장 정보보다 말싸움이 중심)
POLITICS = ['국힘', '국민의힘', '민주당', '대통령실', '李대통령', '尹', '여당', '야당', '국회의원', '의원 "', '의원,', '지방선거', '대선']
STOP = set('기자 속보 종합 단독 오늘 내일 올해 지난 이번 관련 대한 위해 따라 가운데 이후 전망 사진 영상 포토 뉴스 마감 출발 개장 오전 오후 하루 이틀'.split())


def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml, */*'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def parse_time(s):
    if not s:
        return None
    try:
        t = email.utils.parsedate_to_datetime(s)
        return t if t.tzinfo else t.replace(tzinfo=KST)
    except Exception:
        pass
    for fmt in ('%Y-%m-%dT%H:%M:%S%z', '%Y-%m-%d %H:%M:%S'):
        try:
            t = dt.datetime.strptime(s.strip(), fmt)
            return t if t.tzinfo else t.replace(tzinfo=KST)
        except Exception:
            pass
    return None


def clean_title(t, source):
    t = html.unescape(re.sub(r'<[^>]+>', '', t or '')).strip()
    if source and t.endswith(' - ' + source):
        t = t[: -len(' - ' + source)].strip()
    while ' - ' in t and len(t.rsplit(' - ', 1)[1]) <= 15:  # 끝에 붙은 언론사 이름 (두 번 붙은 경우도)
        t = t.rsplit(' - ', 1)[0].strip()
    return re.sub(r'\s+', ' ', t)


def items_from(url, raw):
    out = []
    root = ET.fromstring(raw)
    host = urllib.parse.urlparse(url).hostname or ''
    for it in root.iter('item'):
        src_el = it.find('source')
        source = (src_el.text or '').strip() if src_el is not None and src_el.text else next((v for k, v in HOST_NAME.items() if host.endswith(k)), host)
        title = clean_title(it.findtext('title'), source)
        link = (it.findtext('link') or '').strip()
        when = parse_time(it.findtext('pubDate') or it.findtext('{http://purl.org/dc/elements/1.1/}date'))
        if title and link:
            out.append({'title': title, 'link': link, 'source': source, 'time': when})
    return out


def norm(t):
    t = re.sub(r'\[[^\]]*\]|\([^)]*\)|【[^】]*】', ' ', t)
    return re.sub(r'[^가-힣A-Za-z0-9]', '', t).lower()


def grams(t):
    s = norm(t)
    return {s[i:i + 2] for i in range(len(s) - 1)}


NUM = re.compile(r'\d+(?:[.,]\d+)?\s*(?:조|억|만|천|%|원|달러|bp|포인트|배)')


def figures(t):
    """제목 속 핵심 숫자 ('7.6조', '1360원', '6%') — 같은 숫자를 쓴 비슷한 제목은 같은 사건으로 봄"""
    return {re.sub(r'\s+', '', m) for m in NUM.findall(t)}


def same_story(a, b):
    j = jac(a['g'], b['g'])
    return j >= 0.34 or (j >= 0.12 and bool(a['f'] & b['f']))


def jac(a, b):
    return len(a & b) / len(a | b) if a and b else 0.0


def has(text, k):
    """낱말 가운데에 끼인 경우는 빼고 찾음 ('반환율' 안의 '환율' 같은 것)"""
    return re.search(('(?<![가-힣])' if re.match('[가-힣]', k) else '') + re.escape(k), text) is not None


def kw_score(text):
    return min(12, sum(w for k, w in KW.items() if has(text, k)))


def category(text):
    if has(text, '비트코인') or has(text, '가상자산'):
        return '가상자산'
    best, hit = '기타', 0
    for name, words in CATS:
        n = sum(1 for w in words if has(text, w))
        if n > hit:
            best, hit = name, n
    return best


def build(now=None, limit=15, verbose=False):
    now = now or dt.datetime.now(KST)
    raw_items, ok = [], 0
    for fi, url in enumerate(FEEDS):
        try:
            got = items_from(url, fetch(url))
            for g in got: g['feed'] = fi
            raw_items += got
            ok += 1
            if verbose:
                print(f'  {len(got):3d}  {url[:90]}', file=sys.stderr)
        except Exception as e:  # 피드 하나가 실패해도 나머지로 만든다
            if verbose:
                print(f'  ERR  {url[:90]}  {e}', file=sys.stderr)
    seen, items = {}, []
    for it in raw_items:
        if it['time'] and (now - it['time']).total_seconds() > 26 * 3600:
            continue
        if any(s in it['title'] for s in SPAM):
            continue
        key = norm(it['title'])
        if len(key) < 8:
            continue
        if key in seen:  # 같은 기사가 여러 피드에 있으면 피드만 더함
            seen[key]['feeds'].add(it['feed']); continue
        seen[key] = it; it['feeds'] = {it['feed']}
        it['g'], it['f'] = grams(it['title']), figures(it['title'])
        items.append(it)
    items.sort(key=lambda x: x['time'] or now, reverse=True)
    clusters = []
    for it in items:
        best = next((c for c in clusters if any(same_story(it, m) for m in c['items'][:6])), None)
        if best is not None:
            best['items'].append(it); it['c'] = best
        else:
            c = {'items': [it]}; it['c'] = c; clusters.append(c)
    for c in clusters:
        text = ' '.join(m['title'] for m in c['items'])
        srcs = {m['source'] for m in c['items']}
        newest = max((m['time'] for m in c['items'] if m['time']), default=None)
        age = (now - newest).total_seconds() / 3600 if newest else 24
        c['strong'] = any(has(text, k) for k in STRONG)
        c['score'] = 3 * len(srcs) + len(c['items']) + kw_score(text) + (2 if age < 6 else 1 if age < 12 else 0) - (8 if any(p in text for p in POLITICS) else 0)
        c['nsrc'], c['cat'], c['kw'] = len(srcs), category(text), [k for k in KW if has(text, k)][:6]
        rep = sorted(c['items'], key=lambda m: (PREF.index(m['source']) if m['source'] in PREF else 99, -(m['time'] or now).timestamp()))[0]
        c['rep'] = rep
    clusters.sort(key=lambda c: c['score'], reverse=True)
    picked, per_cat = [], {}
    for c in clusters:
        if not c['strong']:
            continue  # 시장과 바로 이어지는 말이 없는 기사
        if per_cat.get(c['cat'], 0) >= 5:
            continue
        if any(jac(c['rep']['g'], p['rep']['g']) >= 0.25 or same_story(c['rep'], p['rep']) for p in picked):
            continue
        picked.append(c)
        per_cat[c['cat']] = per_cat.get(c['cat'], 0) + 1
        if len(picked) >= limit:
            break
    fmt = lambda t: t.astimezone(KST).isoformat(timespec='minutes') if t else None
    out = []
    for i, c in enumerate(picked, 1):
        r = c['rep']
        rel = [m for m in c['items'] if m is not r]
        rel.sort(key=lambda m: PREF.index(m['source']) if m['source'] in PREF else 99)
        out.append({'rank': i, 'title': r['title'], 'link': r['link'], 'source': r['source'], 'time': fmt(r['time']),
                    'category': c['cat'], 'sources': c['nsrc'], 'articles': len(c['items']), 'keywords': c['kw'], 'score': c['score'],
                    'related': [{'title': m['title'], 'source': m['source'], 'link': m['link']} for m in rel[:4]]})
    # 피드마다 중요도 순 5개: 그 피드의 기사 중, 이슈 점수(여러 언론이 다룬 정도 + 핵심어 + 최신)가 높은 순 · 같은 이슈는 하나만
    feeds = []
    for fi, name in enumerate(FEED_NAMES):
        cand = [it for it in items if fi in it['feeds']]
        cand.sort(key=lambda it: (not it['c'].get('strong'), -it['c']['score'], -(it['time'] or now).timestamp()))
        got, used = [], set()
        for it in cand:
            if id(it['c']) in used:
                continue
            used.add(id(it['c']))
            c = it['c']
            got.append({'rank': len(got) + 1, 'title': it['title'], 'link': it['link'], 'source': it['source'], 'time': fmt(it['time']), 'category': c['cat'], 'sources': c['nsrc'], 'score': c['score']})
            if len(got) >= PER_FEED:
                break
        feeds.append({'name': name, 'items': got})
    return {'date': now.strftime('%Y-%m-%d'), 'generatedAt': now.isoformat(timespec='minutes'), 'feedsOk': ok, 'feeds': len(FEEDS),
            'articles': len(items), 'issues': len(clusters), 'method': '여러 언론이 함께 다룬 정도 + 시장 핵심어 + 최신순 (AI 사용 안 함)', 'items': out, 'feedItems': sum(len(f['items']) for f in feeds), 'byFeed': feeds}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='briefing-out')
    ap.add_argument('--keep', type=int, default=60, help='남겨 둘 날 수')
    ap.add_argument('-v', '--verbose', action='store_true')
    a = ap.parse_args()
    data = build(verbose=a.verbose)
    if not data['items']:
        print('기사를 하나도 모으지 못했습니다 — 저장하지 않음', file=sys.stderr)
        return 1
    os.makedirs(a.out, exist_ok=True)
    w = lambda name, obj: open(os.path.join(a.out, name), 'w', encoding='utf-8').write(json.dumps(obj, ensure_ascii=False, indent=1))
    w('latest.json', data)
    w(data['date'] + '.json', data)
    idx_path = os.path.join(a.out, 'index.json')
    try:
        dates = json.load(open(idx_path, encoding='utf-8')).get('dates', [])
    except Exception:
        dates = []
    dates = sorted(set(dates + [data['date']]), reverse=True)
    for old in dates[a.keep:]:
        try:
            os.remove(os.path.join(a.out, old + '.json'))
        except OSError:
            pass
    w('index.json', {'dates': dates[: a.keep], 'updated': data['generatedAt']})
    print(f"{data['date']}: 피드 {data['feedsOk']}/{data['feeds']} · 기사 {data['articles']} · 이슈 {data['issues']} → {len(data['items'])}개 저장", file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
