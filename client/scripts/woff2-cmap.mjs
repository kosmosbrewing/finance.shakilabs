// 배포되는 WOFF2에서 cmap(문자→글리프 매핑)을 직접 읽는다.
//
// 왜 직접 파싱하나: 글리프 커버리지 판정에 `document.fonts.check()`를 쓰면 안 된다 —
// 이 환경 Chromium은 폰트에 없는 글자를 물어도 true를 돌려준다(실패할 수 없는 게이트).
// 근거와 실측은 docs/BRAND_FONT_SUBSET.md 6절.
// 유일하게 믿을 수 있는 판정은 **실제로 배포되는 파일의 cmap 전수 대조**다.
// python fontTools를 부르면 될 일이지만, 그건 빌드 게이트에 python 의존을 새로 들이는 일이라
// (서브셋 생성은 수동 스크립트, 검증은 build 체인) Node만으로 읽는다.
//
// WOFF2 구조(W3C WOFF2 §4): 48바이트 헤더 → 테이블 디렉터리 → brotli 스트림 하나.
// 스트림 안에는 테이블들이 디렉터리 순서대로 패딩 없이 이어 붙어 있다.
import { brotliDecompressSync } from "node:zlib";

const WOFF2_HEADER_BYTES = 48;

// 플래그 하위 6비트는 이 표의 인덱스다(63이면 태그가 뒤따라온다).
const KNOWN_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm",
  "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern",
  "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC",
  "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
  "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty",
  "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
  "Gloc", "Feat", "Sill",
];

function readUIntBase128(buffer, offset) {
  let value = 0;
  for (let index = 0; index < 5; index += 1) {
    const byte = buffer.readUInt8(offset + index);
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) return { value, offset: offset + index + 1 };
  }
  throw new Error("Malformed UIntBase128 in WOFF2 table directory");
}

// 테이블이 변환(transform)됐는지. glyf/loca는 3이 "변환 없음"이고 0이 표준 변환,
// 나머지 테이블은 0이 "변환 없음"이다. 변환된 테이블만 transformLength를 갖는다.
function isTransformed(tag, transformVersion) {
  if (tag === "glyf" || tag === "loca") return transformVersion !== 3;
  return transformVersion !== 0;
}

function extractTable(woff2, wantedTag) {
  if (woff2.subarray(0, 4).toString("ascii") !== "wOF2") throw new Error("Not a WOFF2 file");
  const numTables = woff2.readUInt16BE(12);

  let cursor = WOFF2_HEADER_BYTES;
  const entries = [];
  for (let index = 0; index < numTables; index += 1) {
    const flags = woff2.readUInt8(cursor);
    cursor += 1;
    const tagIndex = flags & 0x3f;
    let tag;
    if (tagIndex === 0x3f) {
      tag = woff2.subarray(cursor, cursor + 4).toString("ascii");
      cursor += 4;
    } else {
      tag = KNOWN_TAGS[tagIndex];
    }
    const originalLength = readUIntBase128(woff2, cursor);
    cursor = originalLength.offset;
    let length = originalLength.value;
    if (isTransformed(tag, (flags >> 6) & 0x03)) {
      const transformed = readUIntBase128(woff2, cursor);
      cursor = transformed.offset;
      length = transformed.value;
    }
    entries.push({ tag, length });
  }

  const stream = brotliDecompressSync(woff2.subarray(cursor));
  let start = 0;
  for (const entry of entries) {
    if (entry.tag === wantedTag) return stream.subarray(start, start + entry.length);
    start += entry.length;
  }
  throw new Error(`WOFF2 has no ${wantedTag} table`);
}

// format 4: 세그먼트별 delta/rangeOffset을 실제로 풀어 글리프 0(=없음)은 버린다.
function readFormat4(table, offset, codePoints) {
  const segCount = table.readUInt16BE(offset + 6) / 2;
  const endAt = offset + 14;
  const startAt = endAt + segCount * 2 + 2;
  const deltaAt = startAt + segCount * 2;
  const rangeAt = deltaAt + segCount * 2;
  for (let segment = 0; segment < segCount; segment += 1) {
    const end = table.readUInt16BE(endAt + segment * 2);
    const start = table.readUInt16BE(startAt + segment * 2);
    if (start > end) continue;
    const delta = table.readInt16BE(deltaAt + segment * 2);
    const rangeOffset = table.readUInt16BE(rangeAt + segment * 2);
    for (let code = start; code <= end && code !== 0xffff; code += 1) {
      let glyph;
      if (rangeOffset === 0) {
        glyph = (code + delta) & 0xffff;
      } else {
        const glyphAt = rangeAt + segment * 2 + rangeOffset + (code - start) * 2;
        if (glyphAt + 1 >= table.length) continue;
        glyph = table.readUInt16BE(glyphAt);
        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }
      if (glyph !== 0) codePoints.add(code);
    }
  }
}

function readFormat12(table, offset, codePoints) {
  const groupCount = table.readUInt32BE(offset + 12);
  for (let group = 0; group < groupCount; group += 1) {
    const at = offset + 16 + group * 12;
    const start = table.readUInt32BE(at);
    const end = table.readUInt32BE(at + 4);
    const startGlyph = table.readUInt32BE(at + 8);
    for (let code = start; code <= end; code += 1) {
      if (startGlyph + (code - start) !== 0) codePoints.add(code);
    }
  }
}

/** 배포 WOFF2가 실제로 그릴 수 있는 코드포인트 전수. */
export function woff2CodePoints(fontBuffer) {
  const table = extractTable(fontBuffer, "cmap");
  const codePoints = new Set();
  const subtableCount = table.readUInt16BE(2);
  // 어느 서브테이블이 "최선"인지 고르지 않고 4·12를 전부 합집합한다 —
  // 커버리지 질문에는 "어떤 경로로든 그려지는가"가 답이다.
  for (let index = 0; index < subtableCount; index += 1) {
    const offset = table.readUInt32BE(4 + index * 8 + 4);
    const format = table.readUInt16BE(offset);
    if (format === 4) readFormat4(table, offset, codePoints);
    else if (format === 12) readFormat12(table, offset, codePoints);
  }
  return codePoints;
}
