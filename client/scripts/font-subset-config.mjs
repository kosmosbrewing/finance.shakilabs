import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
export const clientRoot = resolve(scriptRoot, "..");

// 브랜드 폰트 패밀리명. @font-face·tailwind(font-title/font-brand)·@shakilabs/ui의
// --sh-font-display가 모두 이 이름을 가리킨다.
export const BRAND_FONT_FAMILY = "GmarketSans";

// 히어로에 나올 수 있는 문자. U+2212(−)는 이 폰트에 글리프가 없어 폴백이 받는다.
export const NUMERAL_CHARACTERS =
  "0123456789,.%+-~/()\u00B7 원억만천조년월일개회건세명점배급시간분초";

// 렌더 실측으로 수집한 브랜드 폰트 문자셋. 정본은 이 JSON이고
// 재수집은 `npm run fonts:brand-charset`가 한다(소스 grep은 과대 수집이라 금지).
const brandCharacters = JSON.parse(
  readFileSync(resolve(scriptRoot, "brand-font-characters.json"), "utf8"),
);
// 수집기가 이미 숫자셋을 합쳐 두지만, 카운트업 중간 프레임처럼 정적 렌더에 안 잡히는
// 문자가 있으므로 여기서 한 번 더 합집합을 보장한다.
export const BRAND_FONT_CHARACTERS = [
  ...new Set([...brandCharacters.characters, ...NUMERAL_CHARACTERS]),
]
  .sort()
  .join("");

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
    // 브랜드 폰트 = 제목 + 히어로 숫자. 문자셋은 렌더 실측에서 온다
    // (scripts/collect-brand-font-characters.mjs, docs/BRAND_FONT_SUBSET.md §3).
    //
    // 두 번 틀렸던 자리다:
    //   ① UI 전체 문자셋(979자)으로 자르면 Pretendard만 그리는 800여 자가 들어가 122KB.
    //   ② 숫자 41자로 자르면 h1이 글자 단위로 서체가 갈린다
    //      ('2026 원천세 계산기' → "계산기"만 Pretendard 폴백).
    // 정답은 "실제로 이 폰트가 그리는 문자만" — 188자 11KB.
    source: resolve(clientRoot, "public/fonts/GmarketSansBold.woff"),
    output: resolve(clientRoot, "public/fonts/GmarketSansBold-brand-v1.woff2"),
    publicName: "GmarketSansBold-brand-v1.woff2",
    characters: BRAND_FONT_CHARACTERS,
    // --no-hinting만 쓴다. --layout-features=''는 커널링(GPOS)을 날리고,
    // 힌팅/name 테이블을 남기면 같은 41자가 14.8KB까지 부푼다.
    subsetFlags: ["--no-hinting"],
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

// 주석은 화면에 찍히지 않는다. 그런데 수집에 섞이면 "왜"를 적는 한국어 주석 하나가
// 서브셋을 바꿔 무관한 작업이 폰트 재생성·해시 게이트에서 멈춘다(반복 발생).
// 문자열 안의 `https://`도 잘리지만 URL은 ASCII라 한글 수집에는 영향이 없다 —
// 위험한 건 과소 수집뿐이므로 렌더 결과와 차집합을 대조해 검증했다.
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

export function collectFontCharacters() {
  const characters = new Set();
  for (const path of contentRoots.flatMap(listTextFiles)) {
    if (!textExtensions.has(extname(path))) continue;
    for (const character of stripComments(readFileSync(path, "utf8"))) characters.add(character);
  }
  return [...characters].sort().join("");
}
