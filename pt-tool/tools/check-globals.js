// 한 화면(html)이 불러오는 스크립트들 사이에 같은 최상위 이름(const·let·class)이 두 번 선언되면
// 브라우저에서 "Identifier has already been declared" 로 뒤 스크립트가 통째로 멈춤 — 배포 전에 잡음
const fs = require('fs'), path = require('path');
let bad = 0;
for (const html of fs.readdirSync('.').filter(f => f.endsWith('.html'))) {
  const src = fs.readFileSync(html, 'utf8');
  const scripts = [...src.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]).filter(s => !/^https?:/.test(s)).map(s => s.split('?')[0]);
  const seen = new Map();
  for (const s of scripts) {
    if (!fs.existsSync(s)) continue;
    const code = fs.readFileSync(s, 'utf8');
    for (const m of code.matchAll(/^(?:const|let|class)\s+([A-Za-z_$][\w$]*)/gm)) {
      const n = m[1];
      if (seen.has(n) && seen.get(n) !== s) { console.log(`${html}: '${n}' 이(가) ${seen.get(n)} 와 ${s} 에 함께 선언됨`); bad = 1; }
      else seen.set(n, s);
    }
  }
}
if (!bad) console.log('최상위 이름 겹침 없음');
process.exit(bad);
