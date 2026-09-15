import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectFontCharacters, fontJobs } from "./font-subset-config.mjs";
import { woff2CodePoints } from "./woff2-cmap.mjs";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptRoot, "..");
const distRoot = resolve(clientRoot, "dist");
const manifest = JSON.parse(readFileSync(resolve(scriptRoot, "font-subset-manifest.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

assert(manifest.characterSha256 === hash(collectFontCharacters()),
  "UI characters changed; run npm run fonts:subset");
const manifestFonts = new Map(manifest.fonts.map((font) => [font.publicName, font]));

const css = readdirSync(resolve(distRoot, "assets"))
  .filter((file) => file.endsWith(".css"))
  .map((file) => readFileSync(resolve(distRoot, "assets", file), "utf8"))
  .join("\n");
const html = readFileSync(resolve(distRoot, "index.html"), "utf8");
for (const fontJob of fontJobs) {
  const fontPath = resolve(distRoot, "fonts", fontJob.publicName);
  assert(existsSync(fontPath), `Missing shipped font: ${fontJob.publicName}`);
  const font = readFileSync(fontPath);
  const manifestFont = manifestFonts.get(fontJob.publicName);
  assert(font.subarray(0, 4).toString("ascii") === "wOF2", "Shipped font must be WOFF2");
  assert(font.byteLength <= fontJob.maxBytes,
    `${fontJob.publicName} exceeds its ${fontJob.maxBytes}-byte budget`);
  assert(manifestFont?.bytes === font.byteLength, `${fontJob.publicName} manifest size is stale`);
  assert(manifestFont?.sha256 === hash(font), `${fontJob.publicName} hash does not match`);
  // 글리프 커버리지 — 이 게이트의 핵심.
  //
  // 선언한 문자 중 하나라도 배포 파일의 cmap에 없으면 그 글자만 폴백 폰트로 그려진다.
  // 화면은 깨지지 않는다 — 두부 글자가 아니라 Pretendard로 곱게 그려지고, 한 단어 안에서
  // 서체만 갈린다. 그래서 눈으로도, document.fonts.check()로도 잡히지 않았다
  // (이 환경 Chromium의 fonts.check()는 폰트에 없는 글자에도 true를 준다 — 가짜 게이트).
  // 배포되는 바이트의 cmap 전수 대조만이 판정이다.
  if (fontJob.characters) {
    const codePoints = woff2CodePoints(font);
    const missing = [...new Set(fontJob.characters)].filter(
      (character) => !codePoints.has(character.codePointAt(0)),
    );
    assert(
      missing.length === 0,
      `${fontJob.publicName} cmap misses ${missing.length} declared character(s): ` +
        `${missing.map((character) => `${character}(U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")})`).join(" ")}` +
        " — those render in the fallback font, splitting typefaces mid-word. Run npm run fonts:subset",
    );
  }
  assert(css.includes(`/finance/fonts/${fontJob.publicName}`), `Built CSS misses ${fontJob.publicName}`);
  if (fontJob.preload) {
    assert(html.includes(`/finance/fonts/${fontJob.publicName}`), `Index preload misses ${fontJob.publicName}`);
  }
}

const covered = fontJobs.filter((fontJob) => fontJob.characters);
console.log(
  `Validated ${fontJobs.length} subset fonts` +
    `${covered.length > 0 ? `, cmap coverage on ${covered.map((fontJob) => `${fontJob.publicName} (${[...new Set(fontJob.characters)].length} chars)`).join(", ")}` : ""}.`,
);
