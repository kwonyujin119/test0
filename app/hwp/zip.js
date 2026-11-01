/* 최소 ZIP 읽기/쓰기 — 브라우저 내장 (De)CompressionStream('deflate-raw') 사용, 외부 라이브러리 없음.
   hwpx 는 ZIP 묶음이며, 'mimetype' 이 맨 앞에 무압축으로 있어야 한글이 정상 인식합니다. */
const Zip = (() => {
  const CRC = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; }
  function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  async function pipe(u8, stream) { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer()); }
  const inflate = u8 => pipe(u8, new DecompressionStream('deflate-raw'));
  const deflate = u8 => pipe(u8, new CompressionStream('deflate-raw'));
  const utf8 = new TextDecoder('utf-8'), cp = new TextDecoder('euc-kr', { fatal: false });

  /* → Map(name → { data: Uint8Array, method }) — 순서 유지 */
  async function read(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('hwpx(ZIP) 파일이 아닙니다. 한글에서 "다른 이름으로 저장 → 한글 표준 문서(*.hwpx)" 로 저장한 파일을 올려 주세요.');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const out = new Map();
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('ZIP 목록이 손상되었습니다');
      const flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true);
      const csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const lofs = dv.getUint32(p + 42, true);
      const nameBytes = u8.subarray(p + 46, p + 46 + nlen);
      const name = (flags & 0x800) ? utf8.decode(nameBytes) : (/^[\x00-\x7f]*$/.test(String.fromCharCode(...nameBytes)) ? utf8.decode(nameBytes) : cp.decode(nameBytes));
      p += 46 + nlen + xlen + clen;
      const lnlen = dv.getUint16(lofs + 26, true), lxlen = dv.getUint16(lofs + 28, true);
      const start = lofs + 30 + lnlen + lxlen;
      const raw = u8.subarray(start, start + csize);
      if (name.endsWith('/')) continue;
      let data;
      if (method === 0) data = raw.slice();
      else if (method === 8) data = await inflate(raw);
      else throw new Error('지원하지 않는 압축 방식입니다 (' + method + '): ' + name);
      out.set(name, { data, method });
    }
    return out;
  }

  function dosTime(d) {
    return { time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() };
  }

  /* entries = [{ name, data: Uint8Array|string, store?: bool }] → Blob */
  const packed = new WeakMap(); // 바뀌지 않은 파일(같은 바이트 배열)은 압축·CRC 를 다시 하지 않음
  async function write(entries) {
    const enc = new TextEncoder(), now = dosTime(new Date());
    const locals = [], centrals = []; let offset = 0;
    for (const e of entries) {
      const data = typeof e.data === 'string' ? enc.encode(e.data) : e.data;
      const nameB = enc.encode(e.name), utf = /[^\x00-\x7f]/.test(e.name);
      let crc, method, body;
      const hit = typeof e.data !== 'string' && packed.get(data);
      if (hit && hit.store === !!e.store) ({ crc, method, body } = hit);
      else {
        crc = crc32(data); method = e.store ? 0 : 8; body = data;
        if (method === 8) { body = await deflate(data); if (body.length >= data.length) { method = 0; body = data; } }
        if (typeof e.data !== 'string') packed.set(data, { crc, method, body, store: !!e.store });
      }
      const lh = new Uint8Array(30 + nameB.length), lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, utf ? 0x800 : 0, true); lv.setUint16(8, method, true);
      lv.setUint16(10, now.time, true); lv.setUint16(12, now.date, true); lv.setUint32(14, crc, true);
      lv.setUint32(18, body.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, nameB.length, true); lv.setUint16(28, 0, true);
      lh.set(nameB, 30);
      const ch = new Uint8Array(46 + nameB.length), cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, utf ? 0x800 : 0, true); cv.setUint16(10, method, true);
      cv.setUint16(12, now.time, true); cv.setUint16(14, now.date, true); cv.setUint32(16, crc, true);
      cv.setUint32(20, body.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, nameB.length, true);
      cv.setUint32(42, offset, true); ch.set(nameB, 46);
      locals.push(lh, body); centrals.push(ch);
      offset += lh.length + body.length;
    }
    const cdSize = centrals.reduce((s, c) => s + c.length, 0);
    const end = new Uint8Array(22), ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
    return new Blob([...locals, ...centrals, end], { type: 'application/hwp+zip' });
  }

  return { read, write, crc32 };
})();
