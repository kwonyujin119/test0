#!/usr/bin/env python3
"""SECRET Study — 매일 아침(한국 시간 6시 전) 그날의 학습 레슨을 만들어 briefing 브랜치 study/ 에 날짜별로 저장한다.

  study/YYYY-MM-DD.json  {date, generatedAt, mode, en: [소설, 경제], ja: 레슨, zh: 레슨, errors}
  study/index.json       {dates: [...], updated}  — 날짜별 기록(지우지 않음)

두 가지 방식
  · ANTHROPIC_API_KEY 가 있으면(mode "ai"): Claude 가 새로 씀
      - 영어 경제: 웹 검색으로 최근 7일 세계 경제 이슈를 찾아 직접 쓴 매거진 글(베끼지 않음) + 출처
      - 영어 소설: 저작권이 끝난 명작의 대화 장면을 고등학생 수준으로 각색(앞서 쓴 작품 · 장면은 피함)
      - 일본어 · 중국어: 어린이 첫걸음 레슨(앞서 쓴 주제는 피함)
  · 키가 없거나 한 항목이 실패하면(mode "rotation"): 앱에 들어 있는 기본 레슨을 날짜로 돌려 {"ref": id} 로 저장 — 토큰을 쓰지 않음
앱(app/secret/study.js)은 모닝 브리핑처럼 이 파일을 읽는다. 형식은 study.js 의 EN_SCHEMA 와 같다.
"""
import argparse, datetime as dt, json, os, sys

KST = dt.timezone(dt.timedelta(hours=9))
MODEL = 'claude-opus-5-5'
SYSTEM = ('너는 한국 학생을 가르치는 꼼꼼한 외국어 선생님이다. 사실과 숫자는 확인한 것만 쓰고, 저작권이 있는 글을 베끼지 않는다. '
          '요청한 JSON 하나만 답한다(앞뒤 설명 · 코드 울타리 없이).')
EN_SCHEMA = ('{"title":"영어 제목","sub":"한국어 부제(출처 · 날짜)","note":"한국어 안내(각색 · 직접 쓴 글임을 밝힘)",'
             '"sources":[["출처 제목","https://..."]],"plan":[["단어",7],["문법",6],["독해",10],["작문",7]],'
             '"vocab":[["word","품사(n./v./adj.)","한국어 뜻","English example","예문 해석"]] (정확히 12개),'
             '"grammar":{"title":"문법 이름(한국어)","explain":"한국어 설명 3~4문장","examples":[["English","해석"]] (3개),'
             '"practice":[["문제",["보기1","보기2","보기3","보기4"],정답번호0~3,"한국어 해설"]] (4개)},'
             '"passage":[["말하는 사람(대사면 이름, 서술이면 빈 문자열)","English","한국어 해석"]] (8~12줄, 합계 280~350단어),'
             '"questions":[["English question",["A","B","C","D"],정답번호,"한국어 해설"]] (5개),'
             '"writing":{"prompt":"한국어 과제(5~6문장 · 오늘 문법 사용)","guide":["틀 문장 4개"],"model":"모범 답안 English"}}')
KID_FMT = {'ja': '단어는 히라가나(외래어는 가타카나), 읽기는 헵번식 로마자 소문자', 'zh': '단어는 간체자, 읽기는 성조 표시가 있는 병음'}
KID_NAME = {'ja': '일본어', 'zh': '중국어'}
BUILTIN = {'en_novel': ['en-novel-holmes-1'], 'en_econ': ['en-econ-2026-11-13'],
           'ja': ['ja-1', 'ja-2', 'ja-3', 'ja-4', 'ja-5'], 'zh': ['zh-1', 'zh-2', 'zh-3', 'zh-4', 'zh-5']}


def jload(p, d):
    try:
        with open(p, encoding='utf-8') as f: return json.load(f)
    except Exception:
        return d


def jsave(p, v):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f: json.dump(v, f, ensure_ascii=False, indent=1)


def ask(client, prompt, web):
    """한 번 묻고 마지막 글을 돌려줌. 웹 검색이 길어 멈추면(pause_turn) 이어서. 거절은 다른 모델로 다시(fallbacks)"""
    import anthropic  # noqa: F401
    messages = [{'role': 'user', 'content': prompt}]
    tools = [{'type': 'web_search_20260209', 'name': 'web_search', 'max_uses': 6}] if web else []
    for _ in range(6):
        kw = dict(model=MODEL, max_tokens=32000, system=SYSTEM, messages=messages,
                  thinking={'type': 'adaptive'}, output_config={'effort': 'medium'},
                  betas=['server-side-fallback-2026-07-01'], fallbacks='default')
        if tools: kw['tools'] = tools
        with client.beta.messages.stream(**kw) as stream:
            msg = stream.get_final_message()
        if msg.stop_reason == 'pause_turn':
            messages.append({'role': 'assistant', 'content': msg.content}); continue
        if msg.stop_reason == 'refusal':
            raise RuntimeError('AI 가 답하지 않음(refusal)')
        text = '\n'.join(b.text for b in msg.content if b.type == 'text').strip()
        if not text: raise RuntimeError(f'빈 답 (stop_reason={msg.stop_reason})')
        return text
    raise RuntimeError('웹 검색이 너무 오래 걸림')


def parse(text):
    a, b = text.find('{'), text.rfind('}')
    if a < 0 or b < a: raise ValueError('JSON 없음')
    return json.loads(text[a:b + 1])


def check_en(j):
    ok = (isinstance(j.get('vocab'), list) and len(j['vocab']) >= 8 and all(isinstance(v, list) and len(v) >= 5 for v in j['vocab'])
          and isinstance(j.get('grammar'), dict) and isinstance(j['grammar'].get('practice'), list)
          and isinstance(j.get('passage'), list) and len(j['passage']) >= 4 and all(isinstance(p, list) and len(p) >= 3 for p in j['passage'])
          and isinstance(j.get('questions'), list) and len(j['questions']) >= 3 and all(isinstance(q, list) and len(q) >= 4 and isinstance(q[1], list) for q in j['questions'])
          and isinstance(j.get('writing'), dict) and j.get('title'))
    if not ok: raise ValueError('영어 레슨 형식이 맞지 않음')
    j.setdefault('plan', [['단어', 7], ['문법', 6], ['독해', 10], ['작문', 7]])
    j.setdefault('sources', [])
    return j


def check_kid(j):
    ok = (isinstance(j.get('words'), list) and len(j['words']) >= 6 and all(isinstance(w, list) and len(w) >= 3 for w in j['words'])
          and isinstance(j.get('phrases'), list) and isinstance(j.get('dialog'), list) and j.get('title'))
    if not ok: raise ValueError('어린이 레슨 형식이 맞지 않음')
    return j


def make(client, kind, today, past):
    have = ' / '.join(past.get(kind, [])[-40:]) or '없음'
    if kind == 'en_econ':
        p = (f'오늘은 {today} (한국 시간)이다. 웹 검색으로 최근 7일 안에 나온 세계 경제의 가장 큰 이슈 하나(여러 언론이 다룬 것)를 찾아 '
             f'한국 고등학생용 영어 레슨을 만들어라.\n- 독해 글은 경제 매거진 문체로 네가 직접 쓴 원문(기사 문장을 베끼지 말 것), 280~350단어, '
             f'고등학생 어휘. 사실 · 숫자는 검색으로 확인한 것만, 날짜를 밝힐 것. 소문 · 사생활 의혹은 다루지 말 것.\n'
             f'- sources 에 실제로 본 기사 2~3개(제목, URL).\n- 최근에 다룬 주제와 겹치지 말 것: {have}\n- JSON 형식:\n{EN_SCHEMA}')
        return check_en(parse(ask(client, p, True)))
    if kind == 'en_novel':
        p = ('한국 고등학생용 영어 레슨을 만들어라. 저작권이 끝난(작가 사망 70년 이상) 유명 소설의 흥미로운 대화 장면 하나를 골라 '
             '고등학생 수준으로 각색한 대화문으로 써라(원문 그대로가 아님을 note 에 밝힐 것). 매일 이어 보고 싶게, 작품 · 장면을 고르고 '
             f'앞서 다룬 것과 겹치지 말 것: {have}\n- sub 에 작품 이름(한국어 · 영어) · 작가 · 발표 연도. sources 는 빈 배열 가능.\n- JSON 형식:\n{EN_SCHEMA}')
        return check_en(parse(ask(client, p, False)))
    lang = kind
    p = (f'한국 어린이(6~9살)를 위한 {KID_NAME[lang]} 첫걸음 레슨 하나를 만들어라. 아이들이 좋아하는 생활 주제 하나, '
         f'앞서 다룬 주제와 겹치지 말 것: {have}\n- {KID_FMT[lang]}. 뜻은 한국어. 아주 쉬운 말만.\n- JSON 형식:\n'
         '{"title":"한국어 주제 + 그 언어 주제어","emoji":"이모지 1개","words":[["단어","읽기","뜻","이모지"]] (정확히 8개),'
         '"phrases":[["문장","읽기","뜻"]] (3개),"dialog":[["A 또는 B","문장","읽기","뜻"]] (4줄)}')
    return check_kid(parse(ask(client, p, False)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--force', action='store_true', help='오늘 파일이 있어도 다시 만듦')
    a = ap.parse_args()
    now = dt.datetime.now(KST); today = now.strftime('%Y-%m-%d'); dn = (now.date() - dt.date(2026, 1, 1)).days
    d = os.path.join(a.out, 'study'); fp = os.path.join(d, today + '.json')
    old = jload(fp, None)
    if old and old.get('mode') == 'ai' and not old.get('errors') and not a.force:
        print('오늘 레슨이 이미 있습니다'); return
    idx = jload(os.path.join(d, 'index.json'), {'dates': []})
    # 최근에 다룬 제목 (겹치지 않게)
    past = {'en_novel': [], 'en_econ': [], 'ja': [], 'zh': []}
    for ds in sorted(idx.get('dates', []))[-60:]:
        r = jload(os.path.join(d, ds + '.json'), {})
        for i, k in enumerate(['en_novel', 'en_econ']):
            x = (r.get('en') or [None, None])[i] if len(r.get('en') or []) > i else None
            if isinstance(x, dict) and x.get('title'): past[k].append(f"{x['title']} ({x.get('sub', '')})")
        for k in ('ja', 'zh'):
            x = r.get(k)
            if isinstance(x, dict) and x.get('title'): past[k].append(x['title'])
    rot = lambda k: {'ref': BUILTIN[k][dn % len(BUILTIN[k])]}
    key = os.environ.get('ANTHROPIC_API_KEY', '').strip()
    out = {'date': today, 'generatedAt': now.isoformat(timespec='seconds'), 'mode': 'ai' if key else 'rotation', 'errors': []}
    res = {}
    if key:
        import anthropic
        client = anthropic.Anthropic(max_retries=4, timeout=600)
        for k in ('en_econ', 'en_novel', 'ja', 'zh'):
            for attempt in range(2):
                try:
                    j = make(client, k, today, past)
                    j['id'] = f"{'en-' + k[3:] if k.startswith('en_') else k}-{today}"
                    if k.startswith('en_'): j['kind'] = k[3:]
                    j['daily'] = today; res[k] = j; print('만듦', k, j.get('title')); break
                except anthropic.AuthenticationError:
                    out['errors'].append(f'{k}: API 키가 맞지 않음'); break
                except Exception as e:
                    print('실패', k, attempt, e, file=sys.stderr)
                    if attempt == 1: out['errors'].append(f'{k}: {str(e)[:160]}')
    for k in ('en_novel', 'en_econ', 'ja', 'zh'):
        if k not in res: res[k] = rot(k)
    if key and len(out['errors']) == 4: out['mode'] = 'rotation'
    out.update({'en': [res['en_novel'], res['en_econ']], 'ja': res['ja'], 'zh': res['zh']})
    jsave(fp, out)
    dates = sorted(set(idx.get('dates', [])) | {today}, reverse=True)
    jsave(os.path.join(d, 'index.json'), {'dates': dates, 'updated': now.isoformat(timespec='seconds')})
    print(f"{today} 저장 · 방식 {out['mode']} · 오류 {len(out['errors'])}")


if __name__ == '__main__':
    main()
