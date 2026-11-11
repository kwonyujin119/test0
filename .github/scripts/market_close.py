#!/usr/bin/env python3
"""SECRET 장 마감 기록 — 매일 저녁(한국 시간 20시 무렵) 그날의 코스피를 모아 briefing 브랜치의 market/ 에 저장한다.

저장하는 것
  1. 시장 온도 (0~100): 상승 종목 비율과 코스피 등락률을 반반 섞은 점수
  2. 코스피 종가 · 등락률
  3. 코스피 시가총액 상위 10개 종목의 종가 · 등락률

자료: 네이버 증권(공식 API 가 아님 — 형식이 바뀌면 실패할 수 있음). 장이 열리지 않은 날(주말 · 휴장)은 저장하지 않는다.
AI 토큰을 쓰지 않는다. 앱(secret.js)이 이 파일을 읽어 노트에 날짜별로 남긴다.
"""
import argparse, datetime as dt, json, os, re, sys, time, urllib.request

KST = dt.timezone(dt.timedelta(hours=9))
UA = 'Mozilla/5.0 (DPV market close)'
VERBOSE = False


def log(*a):
    if VERBOSE: print(*a, file=sys.stderr)


def get(url, enc=None, accept='application/json'):
    last = None
    for i in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept, 'Referer': 'https://m.stock.naver.com/'})
            with urllib.request.urlopen(req, timeout=20) as r:
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


# ---------- 코스피 지수 ----------
def index_mobile():
    j = json.loads(get('https://m.stock.naver.com/api/index/KOSPI/basic'))
    chg = num(j.get('fluctuationsRatio')); diff = num(j.get('compareToPreviousClosePrice'))
    code = str((j.get('compareToPreviousPrice') or {}).get('code') or '')
    if code in ('4', '5') and chg is not None and chg > 0: chg, diff = -chg, -(diff or 0)  # 4·5 = 하락
    at = j.get('localTradedAt') or ''
    return {'close': num(j.get('closePrice')), 'diff': diff, 'chg': chg, 'date': at[:10], 'status': j.get('marketStatus') or '', 'src': 'm.stock.naver.com'}


def index_desktop():
    h = get('https://finance.naver.com/sise/sise_index.naver?code=KOSPI', 'euc-kr', 'text/html')
    close = num(re.search(r'id="now_value"[^>]*>([\d,.]+)<', h).group(1))
    m = re.search(r'id="change_value_and_rate"[^>]*>\s*<span>([\d,.]+)</span>\s*([+-]?[\d.]+)%', h)
    diff, chg = num(m.group(1)), num(m.group(2))
    if chg is not None and chg < 0: diff = -diff
    d = re.search(r'id="time"[^>]*>\s*(\d{4})\.(\d{2})\.(\d{2})', h)
    return {'close': close, 'diff': diff, 'chg': chg, 'date': f'{d.group(1)}-{d.group(2)}-{d.group(3)}' if d else '', 'status': '', 'src': 'finance.naver.com'}


# ---------- 코스피 전 종목 (시가총액 순) ----------
def stocks_mobile():
    out, page, total = [], 1, None
    while page <= 30:
        j = json.loads(get(f'https://m.stock.naver.com/api/stocks/marketValue/KOSPI?page={page}&pageSize=100'))
        items = j.get('stocks') or []
        total = j.get('totalCount') or total
        for s in items:
            chg = num(s.get('fluctuationsRatio'))
            code = str((s.get('compareToPreviousPrice') or {}).get('code') or '')
            if code in ('4', '5') and chg is not None and chg > 0: chg = -chg
            out.append({'code': s.get('itemCode'), 'name': s.get('stockName'), 'close': num(s.get('closePrice')), 'chg': chg})
        if not items or (total and len(out) >= int(total)): break
        page += 1
    return out


def stocks_desktop():
    out = []
    for page in range(1, 50):
        h = get(f'https://finance.naver.com/sise/sise_market_sum.naver?sosok=0&page={page}', 'euc-kr', 'text/html')
        rows = re.findall(r'<a href="/item/main\.naver\?code=(\w{6})" class="tltle">([^<]+)</a>.*?<td class="number">([\d,]+)</td>.*?<td class="number">\s*<span class="[^"]*">\s*([+-]?[\d.]+)%', h, re.S)
        if not rows: break
        for code, name, close, chg in rows: out.append({'code': code, 'name': name.strip(), 'close': num(close), 'chg': num(chg)})
        if len(rows) < 50: break
    return out


def first_ok(*fns):
    errs = []
    for f in fns:
        try:
            v = f()
            if v: return v, errs
        except Exception as e:
            errs.append(f'{f.__name__}: {e}'); log('fail', f.__name__, e)
    return None, errs


# ---------- 시장 온도 ----------
def temperature(idx_chg, up, down):
    """0~100. 상승 종목 비율(넓이) 50% + 코스피 등락률 50%(±2.5% 에서 끝까지 감). 상승 · 하락 수를 못 받으면 등락률만."""
    idx_part = max(0.0, min(100.0, 50 + (idx_chg or 0) * 20))
    breadth = up / (up + down) * 100 if (up + down) else None
    score = round(0.5 * breadth + 0.5 * idx_part) if breadth is not None else round(idx_part)
    label = '뜨거움' if score >= 80 else '따뜻함' if score >= 60 else '보통' if score >= 40 else '차가움' if score >= 20 else '얼어붙음'
    return {'score': score, 'label': label, 'breadthPct': round(breadth, 1) if breadth is not None else None,
            'formula': '0.5 × 상승 종목 비율 + 0.5 × (50 + 코스피 등락률 × 20, 0~100)' if breadth is not None else '50 + 코스피 등락률 × 20 (상승 · 하락 수를 못 받음)'}


def main():
    global VERBOSE
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--force', action='store_true', help='장이 열리지 않은 날이어도 저장 (시험용)')
    ap.add_argument('-v', action='store_true')
    a = ap.parse_args(); VERBOSE = a.v
    now = dt.datetime.now(KST); today = now.strftime('%Y-%m-%d')

    idx, e1 = first_ok(index_mobile, index_desktop)
    if not idx or idx.get('chg') is None: sys.exit('코스피 지수를 받지 못했습니다: ' + '; '.join(e1))
    log('index', idx)
    if idx['date'] and idx['date'] != today and not a.force:
        print(f'오늘({today})은 장이 열리지 않았습니다 (마지막 거래일 {idx["date"]}) — 저장하지 않음'); return
    if now.hour < 16 and not a.force:
        print('아직 장 마감 전입니다 (16시 이후에 실행) — 저장하지 않음'); return

    fp = os.path.join(a.out, 'market', (idx['date'] or today) + '.json')
    if os.path.exists(fp) and not a.force:
        try:
            old = json.load(open(fp, encoding='utf-8'))
            if len(old.get('top10') or []) == 10 and old.get('breadth'):
                print('오늘 기록이 이미 있습니다 — 다시 쓰지 않음'); return
        except Exception:
            pass

    st, e2 = first_ok(stocks_mobile, stocks_desktop)
    st = [s for s in (st or []) if s.get('name') and s.get('chg') is not None]
    up = sum(1 for s in st if s['chg'] > 0); down = sum(1 for s in st if s['chg'] < 0); flat = len(st) - up - down
    top = st[:10]
    if len(top) < 10: log('top10 부족', len(top), e2)

    day = idx['date'] or today
    rec = {
        'date': day, 'at': now.isoformat(timespec='seconds'),
        'kospi': {'close': idx['close'], 'diff': idx['diff'], 'chgPct': idx['chg'], 'src': idx['src']},
        'breadth': {'up': up, 'down': down, 'flat': flat, 'total': len(st)} if st else None,
        'temp': temperature(idx['chg'], up, down),
        'top10': [{'rank': i + 1, 'code': s['code'], 'name': s['name'], 'close': s['close'], 'chgPct': s['chg']} for i, s in enumerate(top)],
        'top10Basis': '코스피 시가총액 순위 (네이버 증권, 우선주 포함)',
        'errors': e1 + e2,
    }
    d = os.path.join(a.out, 'market'); os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, day + '.json'), 'w', encoding='utf-8') as f: json.dump(rec, f, ensure_ascii=False, indent=1)
    rp = os.path.join(d, 'recent.json')
    try:
        recent = json.load(open(rp, encoding='utf-8'))
    except Exception:
        recent = []
    recent = [r for r in recent if r.get('date') != day] + [rec]
    recent = sorted(recent, key=lambda r: r['date'], reverse=True)[:30]
    with open(rp, 'w', encoding='utf-8') as f: json.dump(recent, f, ensure_ascii=False, indent=1)
    print(f"{day} 코스피 {idx['close']} ({idx['chg']:+.2f}%) · 온도 {rec['temp']['score']} {rec['temp']['label']} · 상승 {up} 하락 {down} · 상위 10 {len(top)}개")


if __name__ == '__main__':
    main()
