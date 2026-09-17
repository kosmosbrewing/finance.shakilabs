// DESIGN_CLEANUP_PLAN_2026-09-17 §4.2 — 액센트·의미색 토큰 게이트.
//
// 왜 순수 Node인가: 빌드에 배선되는 게이트라 Vercel 빌드 이미지에서 돌아야 한다.
// 그 이미지엔 크로미움도 python(fontTools)도 없다 — playwright를 넣으면 빌드가
// 브라우저를 내려받거나 깨진다(계획서 §6-10). 그래서 산출물 텍스트만 읽는다.
//
// 왜 메시지가 영어인가: 이 파일은 scripts/ 아래라 브랜드 폰트 문자셋 수집기의
// contentRoots에 들어간다. 수집기는 주석만 걷어내므로(stripComments) 문자열 리터럴에
// 한글을 쓰면 서브셋 해시가 깨져 무관한 작업이 verify-fonts에서 멈춘다. 주석은 한국어.
//
// 무엇을 판정하나 (전부 산출물 실측, 소스 grep 판정 아님):
//  1. index.html의 :root/.dark 액센트 토큰이 §2.2 확정 표와 문자열 일치
//  2. --primary 명도가 밴드 안 (라이트 24~41% · 다크 45~72%)
//  3. 의미색 4종이 v3 §2.1 고정 hex와 일치 (빌드 CSS에서 HSL→hex 역산 대조)
//  4. 폐기한 로컬 별칭이 빌드 CSS에 남아 있지 않음
//  5. 대비 >= 4.5:1 — primary vs 카드/캔버스, accent-foreground vs accent 틴트 (라이트·다크)
//
// 역방향 검증: --primary의 L을 밴드 밖으로 1% 옮기면 2번이 빨개진다(커밋 전 확인 의무).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(clientRoot, "dist");

// ── §2.2 확정 표 (돈·세금 그룹 = 인디고). 앱이 재계산하지 않는다 ────────────
const EXPECTED_LIGHT = {
  "--primary": "243 55% 41%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "243 15% 91%",
  "--secondary-foreground": "222 47% 11%",
  "--accent": "243 53% 95%",
  "--accent-foreground": "243 55% 30%",
  // 패키지 카테고리 액센트 API(v3 §4.1) — 2차 내비 밑줄이 이 값을 읽는다.
  // primary와 어긋나면 내비만 옛 브랜드색으로 남는 사고가 난다.
  "--accent-hsl": "243 55% 41%",
  "--accent-muted-hsl": "243 55% 41%",
};
const EXPECTED_DARK = {
  "--primary": "243 60% 72%",
  "--primary-foreground": "243 60% 10%",
  "--secondary": "243 15% 20%",
  "--secondary-foreground": "210 40% 96%",
  "--accent": "243 40% 22%",
  "--accent-foreground": "243 60% 78%",
  "--accent-hsl": "243 60% 72%",
  "--accent-muted-hsl": "243 60% 72%",
};

const PRIMARY_L_BAND = { light: [24, 41], dark: [45, 72] };

// v3 §2.1 color.focus — 포커스 링은 액센트가 아니라 ink다. 패키지
// `--sh-color-focus: hsl(var(--ring, 222 47% 20%))`가 이 값을 가져가므로, 선언이
// 빠지면 슬레이트 리터럴로 조용히 폴백한다(nutri가 그 상태였고 아무 게이트도 못 봤다).
// 값은 문자열이 아니라 렌더 hex로 판정한다 — 0 0% 4%와 0 0% 3.92%는 같은 #0A0A0A다.
const EXPECTED_RING_HEX = { light: "#0A0A0A", dark: "#F5F5F5" };

// v3 §2.1 의미색 — 12앱 고정 hex
const EXPECTED_STATUS = {
  light: {
    "--status-success": "#1B7A4A",
    "--status-warning": "#B45309",
    "--status-danger": "#C62828",
    "--status-info": "#1D4E8C",
  },
  dark: {
    "--status-success": "#5DCA8E",
    "--status-warning": "#F0B429",
    "--status-danger": "#F07171",
    "--status-info": "#8BB4E8",
  },
};

// 폐기한 로컬 별칭. 빌드 CSS에 한 건이라도 남으면 실패한다.
// (선언 `--fee:` 와 유틸리티 `.text-fee{` 둘 다 잡는다 — 정의만 지우고 클래스를
//  남기면 Tailwind가 조용히 규칙을 버려 색 없는 마크업이 배포된다)
const FORBIDDEN_CSS_PATTERNS = [
  { label: "--fee / --profit declaration", re: /--(fee|profit)(-foreground)?\s*:/ },
  { label: "--deduction / --highlight declaration", re: /--(deduction|highlight)(-foreground)?\s*:/ },
  { label: "--status-caution declaration (5th semantic colour retired)", re: /--status-caution\s*:/ },
  { label: "--brand-* declaration", re: /--brand-[a-z0-9-]+\s*:/ },
  { label: ".text-fee / .bg-fee / .border-fee utility", re: /\.(text|bg|border|ring|from|via|to|fill|stroke)-fee[\s,.:{/]/ },
  { label: ".text-profit / .bg-profit utility", re: /\.(text|bg|border|ring|from|via|to|fill|stroke)-profit[\s,.:{/]/ },
  { label: ".text-deduction / .bg-highlight utility", re: /\.(text|bg|border|ring)-(deduction|highlight)[\s,.:{/]/ },
  { label: "status-caution utility", re: /\.(text|bg|border|ring)-status-caution[\s,.:{/]/ },
];

const failures = [];
const notes = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

// ── 색 계산 ────────────────────────────────────────────────────────────────
function hslTripletToRgb(triplet) {
  const [h, s, l] = String(triplet).trim().split(/[\s%]+/).filter(Boolean).map(Number);
  if ([h, s, l].some((n) => !Number.isFinite(n))) return null;
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) { r = c; g = x; }
  else if (hp < 2) { r = x; g = c; }
  else if (hp < 3) { g = c; b = x; }
  else if (hp < 4) { g = x; b = c; }
  else if (hp < 5) { r = x; b = c; }
  else { r = c; b = x; }
  const m = lig - c / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
const hexToRgb = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
const channel = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const lightnessOf = (triplet) => Number(String(triplet).trim().split(/[\s%]+/).filter(Boolean)[2]);

// ── CSS 파싱 ───────────────────────────────────────────────────────────────
// 선언은 중첩되지 않으므로 "가장 안쪽 블록"만 훑으면 @media/@layer를 신경 쓸 필요가 없다.
function parseRules(css) {
  // 주석을 먼저 걷는다 — 소스 index.html은 셀렉터 앞에 "왜"를 적은 블록 주석이 붙어
  // 있어서, 안 걷으면 셀렉터가 "/* ... */ :root"가 되고 :root 판정이 조용히 빗나간다.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, " ");
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = re.exec(stripped)) !== null) {
    rules.push({ selector: match[1].trim().replace(/\s+/g, " "), body: match[2] });
  }
  return rules;
}
function declarationsFor(css, predicate) {
  const out = new Map();
  for (const rule of parseRules(css)) {
    if (!predicate(rule.selector)) continue;
    for (const decl of rule.body.split(";")) {
      const idx = decl.indexOf(":");
      if (idx === -1) continue;
      const name = decl.slice(0, idx).trim();
      if (!name.startsWith("--")) continue;
      out.set(name, decl.slice(idx + 1).trim());
    }
  }
  return out;
}
const isLightRoot = (sel) => /(^|[\s,>+~])?:root\b/.test(sel) && !/\.dark/.test(sel);
const isDarkRoot = (sel) => /\.dark/.test(sel);

// ── 1·2. index.html 인라인 토큰 ────────────────────────────────────────────
const indexHtmlPath = resolve(clientRoot, "index.html");
check(existsSync(indexHtmlPath), `index.html not found at ${indexHtmlPath}`);
const indexHtml = existsSync(indexHtmlPath) ? readFileSync(indexHtmlPath, "utf8") : "";
const inlineStyle = [...indexHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
check(inlineStyle.includes("--primary"), "index.html inline <style> has no :root tokens - parser failed, not a pass");

const lightTokens = declarationsFor(inlineStyle, isLightRoot);
const darkTokens = declarationsFor(inlineStyle, isDarkRoot);

for (const [theme, expected, actual] of [
  ["light", EXPECTED_LIGHT, lightTokens],
  ["dark", EXPECTED_DARK, darkTokens],
]) {
  for (const [token, want] of Object.entries(expected)) {
    const got = (actual.get(token) || "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
    check(got === want, `[${theme}] ${token} = "${got || "(missing)"}" - plan table says "${want}"`);
  }
}

for (const [theme, tokens, band] of [
  ["light", lightTokens, PRIMARY_L_BAND.light],
  ["dark", darkTokens, PRIMARY_L_BAND.dark],
]) {
  const l = lightnessOf(tokens.get("--primary") || "");
  check(
    Number.isFinite(l) && l >= band[0] && l <= band[1],
    `[${theme}] --primary lightness ${Number.isFinite(l) ? `${l}%` : "(unparsed)"} is outside the ${band[0]}-${band[1]}% band`,
  );
}

for (const [theme, tokens] of [["light", lightTokens], ["dark", darkTokens]]) {
  const raw = tokens.get("--ring");
  check(Boolean(raw), `[${theme}] --ring is not declared - the package falls back to slate 222 47% 20%`);
  const rgb = raw ? hslTripletToRgb(raw) : null;
  const got = rgb ? toHex(rgb) : "(missing)";
  check(
    got === EXPECTED_RING_HEX[theme],
    `[${theme}] --ring = ${got} (${raw || "-"}) - v3 color.focus is ink ${EXPECTED_RING_HEX[theme]}, not the accent`,
  );
}

// ── 빌드 CSS 모으기 ────────────────────────────────────────────────────────
const assetsDir = resolve(distRoot, "assets");
check(existsSync(assetsDir), `dist/assets is missing - run after the build (${assetsDir})`);
const builtCss = existsSync(assetsDir)
  ? readdirSync(assetsDir)
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFileSync(resolve(assetsDir, file), "utf8"))
      .join("\n")
  : "";
check(builtCss.length > 0, "read zero bytes of built CSS - parser failure must not read as a pass");

// 셸이 stale하면 화면은 옛 색이다 — 산출물 index.html도 같은 값인지 본다.
const distIndex = resolve(distRoot, "index.html");
if (existsSync(distIndex)) {
  const shipped = readFileSync(distIndex, "utf8");
  check(
    shipped.includes(`--primary: ${EXPECTED_LIGHT["--primary"]}`) ||
      shipped.includes(`--primary:${EXPECTED_LIGHT["--primary"]}`),
    `dist/index.html does not carry --primary: ${EXPECTED_LIGHT["--primary"]} - the shipped shell is stale`,
  );
}

// ── 3. 의미색 고정 hex ─────────────────────────────────────────────────────
const cssLight = declarationsFor(builtCss, isLightRoot);
const cssDark = declarationsFor(builtCss, isDarkRoot);
for (const [theme, expected, actual] of [
  ["light", EXPECTED_STATUS.light, cssLight],
  ["dark", EXPECTED_STATUS.dark, cssDark],
]) {
  for (const [token, wantHex] of Object.entries(expected)) {
    const raw = actual.get(token);
    const rgb = raw ? hslTripletToRgb(raw) : null;
    const gotHex = rgb ? toHex(rgb) : "(missing)";
    check(gotHex === wantHex, `[${theme}] ${token} = ${gotHex} (${raw || "-"}) - v3 fixed value is ${wantHex}`);
  }
}

// ── 4. 폐기한 로컬 별칭 ────────────────────────────────────────────────────
for (const { label, re } of FORBIDDEN_CSS_PATTERNS) {
  check(!re.test(builtCss), `retired local alias still present in built CSS: ${label}`);
}

// ── 5. 대비 ────────────────────────────────────────────────────────────────
// 라이트는 v3 §2.1 고정면(카드 #FFFFFF · 캔버스 #F7F7F5) 기준.
// 다크는 앱이 실제로 쓰는 --card/--background를 읽어서 잰다 — 앱마다 다크 중성이 달라
// 상수로 박으면 재지 않은 수치를 보고하는 셈이 된다.
const AA = 4.5;
const surfacesLight = { "card #FFFFFF": hexToRgb("#FFFFFF"), "canvas #F7F7F5": hexToRgb("#F7F7F5") };
const surfacesDark = {
  "dark card": hslTripletToRgb(darkTokens.get("--card") || "0 0% 10.98%"),
  "dark canvas": hslTripletToRgb(darkTokens.get("--background") || "0 0% 7.06%"),
};

function reportContrast(theme, fgToken, fg, surfaces) {
  for (const [name, bg] of Object.entries(surfaces)) {
    if (!fg || !bg) { check(false, `[${theme}] ${fgToken} contrast could not be computed on ${name}`); continue; }
    const ratio = contrast(fg, bg);
    notes.push(`[${theme}] ${fgToken} on ${name} = ${ratio.toFixed(2)}:1`);
    check(ratio >= AA, `[${theme}] ${fgToken} on ${name} = ${ratio.toFixed(2)}:1 - below AA ${AA}:1`);
  }
}
reportContrast("light", "--primary", hslTripletToRgb(lightTokens.get("--primary") || ""), surfacesLight);
reportContrast("dark", "--primary", hslTripletToRgb(darkTokens.get("--primary") || ""), surfacesDark);

for (const [theme, tokens] of [["light", lightTokens], ["dark", darkTokens]]) {
  const tint = hslTripletToRgb(tokens.get("--accent") || "");
  const ink = hslTripletToRgb(tokens.get("--accent-foreground") || "");
  if (!tint || !ink) { check(false, `[${theme}] --accent / --accent-foreground could not be parsed`); continue; }
  const ratio = contrast(ink, tint);
  notes.push(`[${theme}] --accent-foreground on --accent tint = ${ratio.toFixed(2)}:1`);
  check(ratio >= AA, `[${theme}] --accent-foreground on --accent tint = ${ratio.toFixed(2)}:1 - below AA ${AA}:1`);

  const onPrimary = hslTripletToRgb(tokens.get("--primary-foreground") || "");
  const primary = hslTripletToRgb(tokens.get("--primary") || "");
  if (onPrimary && primary) {
    const fillRatio = contrast(onPrimary, primary);
    notes.push(`[${theme}] --primary-foreground on --primary fill = ${fillRatio.toFixed(2)}:1`);
    check(fillRatio >= AA, `[${theme}] --primary-foreground on --primary fill = ${fillRatio.toFixed(2)}:1 - below AA ${AA}:1`);
  }
}

// 함정 — v3 고정 경고색(#B45309)은 함대 기존값보다 밝다. 앱마다 --muted 명도가
// 달라서 muted 면 위 warning이 소수점 자리에서 갈린다(다른 그룹에서 4.38:1 미달 발생).
// 의미색을 muted 면에 얹는 마크업이 있으므로 앱별로 반드시 잰다.
const cssStatusByTheme = { light: cssLight, dark: cssDark };
for (const [theme, tokens] of [["light", lightTokens], ["dark", darkTokens]]) {
  const muted = hslTripletToRgb(tokens.get("--muted") || "");
  if (!muted) { check(false, `[${theme}] --muted could not be parsed`); continue; }
  for (const token of ["--status-warning", "--status-success", "--status-danger", "--status-info"]) {
    const ink = hslTripletToRgb(cssStatusByTheme[theme].get(token) || "");
    if (!ink) { check(false, `[${theme}] ${token} could not be parsed for the muted-surface check`); continue; }
    const ratio = contrast(ink, muted);
    notes.push(`[${theme}] ${token} on --muted = ${ratio.toFixed(2)}:1`);
    check(ratio >= AA, `[${theme}] ${token} on --muted = ${ratio.toFixed(2)}:1 - below AA ${AA}:1`);
  }
}

// 함정 — 솔리드 accent 면 위에 --primary를 얹은 마크업이 있으면 텍스트는 AA를 못 넘길 수
// 있다. 텍스트는 --accent-foreground로 고치는 것이 답이고, 아이콘·보더만 남는 자리는
// WCAG 1.4.11 비텍스트 3:1 행이다. 검사 행 자체를 지우지 않고 기준만 분리해 계속 잰다.
const NON_TEXT = 3;
for (const [theme, tokens] of [["light", lightTokens], ["dark", darkTokens]]) {
  const accent = hslTripletToRgb(tokens.get("--accent") || "");
  const primary = hslTripletToRgb(tokens.get("--primary") || "");
  if (!accent || !primary) continue;
  const ratio = contrast(primary, accent);
  notes.push(`[${theme}] --primary on solid --accent = ${ratio.toFixed(2)}:1 (non-text ${NON_TEXT}:1 row)`);
  check(
    ratio >= NON_TEXT,
    `[${theme}] --primary on solid --accent = ${ratio.toFixed(2)}:1 - below the non-text ${NON_TEXT}:1 floor`,
  );
}

// ── 결과 ───────────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error("Accent token gate FAILED:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
for (const note of notes) console.log(`  ${note}`);
console.log(`Accent token gate passed (${Object.keys(EXPECTED_LIGHT).length * 2} accent tokens, 8 semantic colours, ${notes.length} contrast pairs).`);
