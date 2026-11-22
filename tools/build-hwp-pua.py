# 한컴 고유 문자(PUA) → 표준 문자 모양을 빌려 그리는 작은 웹 글꼴 (Noto Sans CJK KR, SIL OFL 1.1 에서 필요한 글자만)
import sys
from fontTools.ttLib import TTFont, TTCollection
from fontTools import subset
MAP = {}
for i in range(20): MAP[0xF02B1 + i] = 0x2460 + i                     # ①~⑳ (rhwp/auto-hwp 매핑, 한컴 PDF 로 확인된 것)
neg = [0x2776 + i for i in range(10)] + [0x24EB + i for i in range(10)]  # ❶~⓴
for i in range(20): MAP[0xF02CE + i] = neg[i]                          # 추정: 문서 속 ❶❷ 와 같은 줄에 쓰임
MAP.update({0xF003B: 0x2193, 0xF02EF: 0x00B7, 0xF080F: 0x2501, 0xF0811: 0x250C, 0xF0817: 0x2514, 0xF081A: 0x2500, 0xF0854: 0x300A, 0xF0855: 0x300B,
            0xF03C5: 0x25A1,                                           # 추정: 1단계 제목 기호(□) — 다음 줄이 ○
            0xF0A7: 0x25AA, 0xF06D: 0x25CB, 0xF0FC: 0x2713, 0xF06C: 0x25CF, 0xF06E: 0x25A0, 0xF0A0: 0x2003, 0xF0D8: 0x25B6, 0xF0E0: 0x2192, 0xF0F0: 0x21E8, 0xF077: 0x25C6, 0xF076: 0x2756, 0xF0B7: 0x2022})  # 기호 글꼴(Wingdings 자리)
col = TTCollection(sys.argv[1]); font = None
for f in col.fonts:
    if any(n.toUnicode() == 'Noto Sans CJK KR' for n in f['name'].names if n.nameID == 1): font = f; break
cmap = font.getBestCmap()
need = sorted(set(v for v in MAP.values() if v in cmap))
opts = subset.Options(); opts.name_IDs = ['*']; opts.notdef_outline = True; opts.layout_features = []; opts.hinting = False; opts.desubroutinize = True
sub = subset.Subsetter(opts); sub.populate(unicodes=need); sub.subset(font)
g = font.getBestCmap()
for t in font['cmap'].tables:
    if t.isUnicode():
        for pua, std in MAP.items():
            if std in g and (pua <= 0xFFFF or t.format == 12): t.cmap[pua] = g[std]
for n in font['name'].names:
    if n.nameID in (1, 4, 16): n.string = 'HWP PUA'
    if n.nameID == 6: n.string = 'HWP-PUA'
font.flavor = 'woff2'; font.save(sys.argv[2])
print('mapped', sum(1 for s in MAP.values() if s in g), 'of', len(MAP), 'missing', [hex(s) for s in MAP.values() if s not in g])
