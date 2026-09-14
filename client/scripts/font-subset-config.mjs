import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
export const clientRoot = resolve(scriptRoot, "..");

// 히어로에 나올 수 있는 문자. U+2212(−)는 이 폰트에 글리프가 없어 폴백이 받는다.
export const NUMERAL_CHARACTERS =
  "0123456789,.%+-~/()\u00B7 원억만천조년월일개회건세명점배급시간분초";

export const fontJobs = [
  {
    source: resolve(clientRoot, "public/fonts/Pretendard-Regular.woff"),
    output: resolve(clientRoot, "public/fonts/Pretendard-Regular-subset.woff2"),
    publicName: "Pretendard-Regular-subset.woff2",
    maxBytes: 160 * 1024,
    preload: true,
  },
  {
    source: resolve(clientRoot, "public/fonts/Pretendard-Bold.woff"),
    output: resolve(clientRoot, "public/fonts/Pretendard-Bold-subset.woff2"),
    publicName: "Pretendard-Bold-subset.woff2",
    maxBytes: 160 * 1024,
    preload: true,
  },
  {
    // 강조 숫자 전용. 이 폰트는 ResultHero의 히어로 숫자 한 곳에서만 쓰이고 값은 전부
    // 포맷터(formatWon/formatKrwAuto/formatManWon) 출력이라 숫자·통화 단위면 충분하다.
    // 전체 UI 문자셋(≈978자)으로 자르면 122KB, 아래 44자면 8.8KB다.
    source: resolve(clientRoot, "public/fonts/GmarketSansBold.woff"),
    output: resolve(clientRoot, "public/fonts/GmarketSansBold-num-v1.woff2"),
    publicName: "GmarketSansBold-num-v1.woff2",
    characters: NUMERAL_CHARACTERS,
    maxBytes: 24 * 1024,
    preload: true,
  },
];

const textExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".ts", ".vue"]);
const contentRoots = [
  resolve(clientRoot, "src"),
  resolve(clientRoot, "scripts"),
  resolve(clientRoot, "index.html"),
  // 공유 UI 패키지에도 화면에 찍히는 한글이 있다(푸터 서비스 목록 등) — 빠지면 두부 글자
  resolve(clientRoot, "node_modules/@shakilabs/ui/dist/index.js"),
];

function listTextFiles(path) {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    return entry.isDirectory() ? listTextFiles(child) : [child];
  });
}

export function collectFontCharacters() {
  const characters = new Set();
  for (const path of contentRoots.flatMap(listTextFiles)) {
    if (!textExtensions.has(extname(path))) continue;
    for (const character of readFileSync(path, "utf8")) characters.add(character);
  }
  return [...characters].sort().join("");
}
