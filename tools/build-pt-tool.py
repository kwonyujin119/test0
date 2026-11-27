#!/usr/bin/env python3
"""PRESENTATION(교안 목록 · 편집기 · 발표) 만 떼어 pt-tool/ 폴더로 만듭니다.
교육생은 이 폴더 안의 것만 자기 저장소 맨 위로 복사해 씁니다 (DOC · VIDEO · SECRET · 강사 교안은 들어가지 않음).
앱을 고친 뒤에는  python3 tools/build-pt-tool.py  로 다시 만듭니다."""
import os, re, shutil, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'pt-tool'
PAGES = ['gyoan.html', 'editor.html', 'present.html', 'shortcuts.html', 'manifest.webmanifest']
APP = ['access.js', 'ai-motion.css', 'ai-motion.js', 'anim.css', 'bgai.js', 'common.js', 'editor.js', 'folderlock.js', 'hub.css', 'hub.js',
       'motion.js', 'pptin.js', 'pptsym.js', 'pptx.js', 'pres-fx.css', 'present.js', 'prestime.js', 'pwa.js', 'slide.css', 'ui.css',
       'hwp/zip.js', 'vendor/qrcode.js']
EXAMPLE = "303. Let's Make PT Together"   # 예시 교안 하나 (높은 품질 기준으로 보여 주기)

def put(rel, text=None, src=None):
    p = OUT / rel; p.parent.mkdir(parents=True, exist_ok=True)
    if text is not None: p.write_text(text, encoding='utf-8')
    else: shutil.copy2(src, p)

if OUT.exists(): shutil.rmtree(OUT)
for f in PAGES:
    t = (ROOT / f).read_text(encoding='utf-8')
    t = re.sub(r'\s*<script src="app/appnav\.js[^"]*"></script>', '', t)                       # 작업장 탭(DOC·VIDEO·SECRET) 없음
    t = re.sub(r'\s*<a class="rail-item" href="index\.html">.*?</a>', '', t)                      # 'DPV로' 링크 없음
    put(f, t)
for f in APP:
    t = (ROOT / 'app' / f).read_text(encoding='utf-8')
    if f == 'access.js':  # 혼자 쓰는 툴: 접속코드 없이 늘 편집 가능 (실제 저장 권한은 GitHub 토큰이 쥠)
        t += "\n/* pt-tool: 접속코드 없이 편집 */\nAccess.load = function () { return (this._st = { role: 'admin', at: Date.now() }); };\n"
    if f == 'motion.js':  # 명령 창의 다른 작업장 이동 없앰
        t = re.sub(r"go\('DPV 첫 화면'.*?\n", "go('PRESENTATION — 교안', 'gyoan.html');\n", t, count=1)
        t = re.sub(r"\s*if \(isAdmin\) go\('SECRET[^\n]*", '', t, count=1)
    if f == 'common.js':
        t = t.replace("{ owner: 'kwonyujin119', repo: 'test0', branch: 'main', token: '' }", "{ owner: '', repo: '', branch: 'main', token: '' }")
    put('app/' + f, t)
for f in ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/gyoan-96.png']:
    if (ROOT / 'app' / f).exists(): put('app/' + f, src=ROOT / 'app' / f)
if (ROOT / 'assets/ui/ws-pres.webp').exists(): put('assets/ui/ws-pres.webp', src=ROOT / 'assets/ui/ws-pres.webp')
# 첫 화면 = 교안 목록
put('index.html', '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=gyoan.html"><title>PT</title><a href="gyoan.html">교안 목록으로</a>\n')
# 서비스 워커: 이 폴더 파일만
core = ['./', 'index.html'] + PAGES + ['app/' + f for f in APP] + ['app/icons/icon-192.png', 'app/icons/icon-512.png']
sw = (ROOT / 'sw.js').read_text(encoding='utf-8')
sw = re.sub(r"const CORE = \[.*?\n\];", 'const CORE = ' + json.dumps(core, ensure_ascii=False) + ';', sw, flags=re.S)
sw = re.sub(r"const CACHE = '[^']+'", "const CACHE = 'ws-app-pt1'", sw)
put('sw.js', sw)
# 예시 교안 + 쓰는 그림
deck = json.loads((ROOT / 'decks' / (EXAMPLE + '.json')).read_text(encoding='utf-8'))
deck['title'] = '예시 · ' + EXAMPLE.split('. ', 1)[1]
used = set(re.findall(r'assets/[^"\\]+\.(?:jpg|jpeg|png|webp|gif|svg)', json.dumps(deck, ensure_ascii=False)))
for a in sorted(used):
    if (ROOT / a).exists(): put(a, src=ROOT / a)
put('decks/' + deck['title'] + '.json', json.dumps(deck, ensure_ascii=False, indent=1))
put('gyoan-folders.json', json.dumps({'about': '교안 목록의 폴더 — 교안 파일 이름 → 폴더', 'folders': [], 'decks': {}}, ensure_ascii=False, indent=2))
# 배포 · 검사 도구 (교육생 저장소에서 그대로 동작)
put('.github/workflows/pages.yml', (ROOT / '.github/workflows/pages.yml').read_text(encoding='utf-8').replace('# → https://kwonyujin119.github.io/test0/\n', ''))
put('tools/check-globals.js', src=ROOT / 'tools/check-globals.js')
put('CLAUDE.md', """# 작업 규칙 (내 PT 툴)

이 저장소는 교안 목록(gyoan.html) · 편집기(editor.html) · 발표(present.html) 로 된 PT 툴입니다.
교안 1개 = decks/이름.json 하나. 그림은 assets/ 에 둡니다.

1. 고치기 전에 최신 상태를 받는다. 한 번에 한 가지만 고친다.
2. 고친 뒤 브라우저 화면을 캡처해 확인하고 결과를 보고한다.
3. app/ 의 파일을 고쳤으면 sw.js 의 CACHE 이름 끝 숫자를 하나 올린다(옛 화면이 남지 않게).
4. 비밀 자료 · 개인정보 · 토큰은 절대 올리지 않는다. 이 사이트는 공개된다.
5. 교안 파일을 지우거나 이름을 바꿀 때는 먼저 묻는다.
""")
put('README.md', """# 내 PT 툴

- 교안 목록: `https://(내 아이디).github.io/(저장소)/gyoan.html`
- 웹에서 바로 저장하려면 목록 화면 왼쪽 아래 [GitHub 연결] 에 토큰을 넣습니다. 아니면 Claude Code 대화창에서 말로 고치면 됩니다.
""")
n = sum(1 for _ in OUT.rglob('*') if _.is_file()); size = sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())
print(f'pt-tool: {n} files, {size/1e6:.1f} MB, images {len(used)}')
