"""999. SACHIL 방명록 교안 자동 저장 — GitHub Actions(.github/workflows/guestbook-999.yml)가 10분마다 실행.
SACHIL:47 서버(교안의 guestbook.src)의 공개 방명록(/api/guestbook: 이름 없이 글·시각)을 받아
교안 파일에 한 장당 guestbook.per(기본 15)개씩 슬라이드(gb: true)로 저장한다. 최신 글이 먼저.
화면 배치는 app/common.js 의 Guestbook.expand 와 같다(발표 화면은 열 때 최신으로 다시 채움).
서버에 못 닿거나 응답이 이상하면 아무것도 바꾸지 않는다(저장된 방명록 장을 지우지 않음).
바뀐 것이 있으면 0, 없으면 3 으로 끝난다(워크플로가 커밋 여부를 고름).
저장된 글이 있는데 서버가 빈 목록을 주면 지우지 않는다(3)."""
import datetime, json, math, re, sys, urllib.request

DECK = 'decks/999. SACHIL 방명록.json'
KST = datetime.timezone(datetime.timedelta(hours=9))


def esc(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            .replace('"', '&quot;').replace("'", '&#39;'))


def when(ts):
    try:
        if float(ts) <= 0:
            return ''
        d = datetime.datetime.fromtimestamp(float(ts), KST)
    except (TypeError, ValueError, OverflowError, OSError):
        return ''
    return f'{d.year}. {d.month}. {d.day}. {d.hour:02d}:{d.minute:02d}'


def build(items, g):
    try:
        per = int(float(g.get('per') or 15))
    except (TypeError, ValueError):
        per = 15
    per = max(1, min(30, per))
    cols = 5
    rows = math.ceil(per / cols)
    X0, Y0, GAP = 80, 180, 24
    W = (1920 - X0 * 2 - GAP * (cols - 1)) // cols
    H = (1040 - Y0 - GAP * (rows - 1)) // rows
    iw, ih = W - 44, H - 44 - 26

    def u16(t):   # 화면(JS)과 같게 UTF-16 단위로 센다(이모지 = 2)
        return len(t.encode('utf-16-le')) // 2

    def lines(txt, fs):
        return sum(max(1, math.ceil(u16(l) * fs / iw)) for l in txt.split('\n'))

    pages = max(1, math.ceil(len(items) / per))
    out = []
    for k in range(pages):
        part = items[k * per:k * per + per]
        els = [
            {'id': f'gb{k + 1}h', 'type': 'text', 'role': 'heading', 'step': 0, 'x': X0, 'y': 48, 'w': 1300, 'h': 100,
             'html': esc(g.get('title') or 'SACHIL 방명록'), 'style': {'fontSize': 56, 'valign': 'middle'}},
            {'id': f'gb{k + 1}p', 'type': 'text', 'role': 'caption', 'step': 0, 'x': 1440, 'y': 58, 'w': 400, 'h': 80,
             'html': f'{k + 1} / {pages} · 모두 {len(items)}개', 'style': {'align': 'right', 'valign': 'middle', 'fontSize': 26}},
        ]
        if not part:
            els.append({'id': f'gb{k + 1}e', 'type': 'text', 'role': 'body', 'step': 0, 'x': X0, 'y': 420, 'w': 1920 - X0 * 2, 'h': 200,
                        'html': '아직 남긴 글이 없어요', 'style': {'align': 'center', 'valign': 'middle', 'color': '$muted'}})
        for i, m in enumerate(part):
            t = re.sub(r'\n{3,}', '\n\n', m['text'].strip())
            fs = next((f for f in (32, 28, 24, 21, 19, 17) if lines(t, f) * f * 1.45 <= ih), 17)
            while lines(t, fs) * fs * 1.45 > ih and u16(t) > 10:
                t = t[:int(len(t) * 0.9)].rstrip() + '…'
            tm = when(m.get('ts'))
            els.append({'id': f'gb{k + 1}c{i + 1}', 'type': 'text', 'role': 'body', 'step': 0,
                        'x': X0 + (i % cols) * (W + GAP), 'y': Y0 + (i // cols) * (H + GAP), 'w': W, 'h': H,
                        'html': esc(t).replace('\n', '<br>') + (f'<br><span style="font-size:15px;opacity:.6">{tm}</span>' if tm else ''),
                        'style': {'fontSize': fs, 'lineHeight': 1.45, 'color': '#1e293b', 'bg': '#ffffff', 'radius': 18,
                                  'padding': 22, 'shadow': True, 'valign': 'top'}})
        out.append({'id': f'gb{k + 1}', 'bg': None, 'transition': '',
                    'notes': f'방명록 {k * per + 1}–{k * per + len(part)}번째 글(자동 저장)', 'gb': True, 'elements': els})
    return out


def main():
    with open(DECK, encoding='utf-8') as f:
        deck = json.load(f)
    g = deck.get('guestbook') or {}
    src = str(g.get('src') or '').rstrip('/')
    if not re.fullmatch(r'https://[a-z0-9.\-]+(:\d+)?', src, re.I):
        print('guestbook.src 없음 — 건너뜀'); return 3
    try:
        req = urllib.request.Request(src + '/api/guestbook', headers={'User-Agent': 'dpv-guestbook-sync'})
        with urllib.request.urlopen(req, timeout=20) as r:
            j = json.load(r)
        items = j.get('items')
        if not j.get('ok') or not isinstance(items, list):
            raise ValueError('응답 형식이 다름')
    except Exception as e:   # 서버가 꺼졌거나 옛 버전 — 저장된 방명록 장을 그대로 둔다
        print('방명록을 받지 못함:', e); return 3
    items = [x for x in items if isinstance(x, dict) and isinstance(x.get('text'), str) and x['text'].strip()][::-1]
    new = build(items, g)
    old = [s for s in deck.get('slides', []) if s.get('gb')]
    had = sum(1 for s in old for e in s.get('elements', []) if re.fullmatch(r'gb\d+c\d+', str(e.get('id', ''))))
    if had and not items:   # 저장된 글이 있는데 서버가 빈 목록 — 방을 비웠거나 서버를 새로 깐 경우일 수 있어 지우지 않는다
        print('서버 목록이 비어 있음 — 저장된', had, '개를 그대로 둠'); return 3
    if old == new:
        print('바뀐 것 없음 · 글', len(items)); return 3
    deck['slides'] = [s for s in deck.get('slides', []) if not s.get('gb')] + new
    # modified(저장 시각)는 바꾸지 않는다 — 편집기에서 999를 열어 둔 사람에게 '다른 곳에서 저장됨' 창이 계속 뜨지 않게.
    # 편집기가 옛 방명록 장으로 저장해도 다음 실행에서 다시 채운다.
    with open(DECK, 'w', encoding='utf-8') as f:
        f.write(json.dumps(deck, ensure_ascii=False, indent=1))
    print('저장 · 글', len(items), '· 방명록 장', len(new)); return 0


if __name__ == '__main__':
    sys.exit(main())
