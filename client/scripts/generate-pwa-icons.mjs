// App icons - home screen, browser tab - generated from repo inputs only.
//
// NOTE: comments here are intentionally ASCII-only. scripts/ is scanned by
// font-subset-config.mjs, so a non-ASCII character would change the shipped font
// subset and force a fonts:subset regeneration.
//
// WHY THIS IS GENERATED AND NOT DRAWN
// ---------------------------------------------------------------------------
// The marks this repo shipped (public/favicon.png, public/logo.png) are 48x48
// music notes left over from another project. A salary and health-insurance
// calculator cannot put a music note on someone's home screen, and upscaling
// 48px to 512px is mush besides. No artwork is invented here either: the icon is
// the app's own --primary token as the tile and ONE currency glyph, taken from
// the Pretendard Bold this repo already ships, as the mark.
//
// INPUTS -> OUTPUTS. Nothing else is consulted, so the result is reproducible:
//   colour   index.html --primary (light)  ... parsed, never re-typed
//   glyph    U+20A9 WON SIGN from public/fonts/Pretendard-Bold.woff
//   outputs  public/icons/icon-192.png, icon-512.png, icon-maskable-512.png
//            public/favicon.png  (tab and home screen show the same mark)
//
// WHEN A REAL LOGO ARRIVES
// ---------------------------------------------------------------------------
// Drop it at public/brand-mark.png and run `npm run icons:pwa` again: that file
// is used instead of the glyph and every output above is regenerated together.
// Nothing else needs editing. public/og-image.png is a separate asset with its
// own script (generate-og-image.mjs) and is deliberately untouched here.
//
// The glyph outline is read with fontTools, which scripts/subset-fonts.mjs
// already requires, so this adds no new dependency.
import sharp from "sharp";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(here, "..");
const fontPath = resolve(clientRoot, "public/fonts/Pretendard-Bold.woff");
const overridePath = resolve(clientRoot, "public/brand-mark.png");
const iconsDir = resolve(clientRoot, "public/icons");

const GLYPH_CODEPOINT = 0x20a9; // WON SIGN
const MARK_COLOR = "#ffffff";

// The tile colour is the app's own brand token. Parsing it means the icon cannot
// drift from the UI, and verify-pwa.mjs compares manifest.theme_color to the same
// token, so all three stay pinned to one source.
function brandHex() {
  const shell = readFileSync(resolve(clientRoot, "index.html"), "utf8");
  const match = shell.match(/--primary:\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!match) throw new Error("index.html has no --primary token");
  const [, h, s, l] = match.map(Number);
  const sat = s / 100;
  const lig = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to255 = (v) => Math.round(255 * v).toString(16).padStart(2, "0");
  return `#${to255(f(0))}${to255(f(8))}${to255(f(4))}`;
}

function readGlyph() {
  const python = `
import json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
font = TTFont(${JSON.stringify(fontPath)})
name = font.getBestCmap().get(${GLYPH_CODEPOINT})
if name is None:
    sys.exit("font has no glyph for U+%04X" % ${GLYPH_CODEPOINT})
glyphs = font.getGlyphSet()
path = SVGPathPen(glyphs)
glyphs[name].draw(path)
bounds = BoundsPen(glyphs)
glyphs[name].draw(bounds)
json.dump({"name": name, "d": path.getCommands(), "bounds": bounds.bounds}, sys.stdout)
`;
  const result = spawnSync("python3", ["-c", python], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(`glyph extraction failed: ${result.error?.message ?? result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout);
}

const brand = brandHex();
const useOverride = existsSync(overridePath);
const glyph = useOverride ? null : readGlyph();

// markRatio is the fraction of the tile the mark occupies.
//  0.56 for "any"      - fills the tile the way app icons normally do;
//  0.44 for "maskable" - Android crops to a circle or squircle, so the mark has
//                        to survive inside the inner 80% safe zone.
async function render(size, markRatio, outFile) {
  let composite;

  if (useOverride) {
    const mark = Math.round(size * markRatio);
    composite = await sharp(overridePath)
      .resize(mark, mark, { kernel: "lanczos3", fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
  } else {
    const [xMin, yMin, xMax, yMax] = glyph.bounds;
    const glyphWidth = xMax - xMin;
    const glyphHeight = yMax - yMin;
    const target = size * markRatio;
    const scale = target / Math.max(glyphWidth, glyphHeight);
    // Font outlines have Y pointing up and SVG has it pointing down, hence the
    // scale(1,-1); the translate before it centres the glyph's own bounding box
    // (not its advance width, which would leave the mark sitting off-centre).
    const tx = size / 2 - (xMin + glyphWidth / 2) * scale;
    const ty = size / 2 + (yMin + glyphHeight / 2) * scale;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<g transform="translate(${tx} ${ty}) scale(${scale} ${-scale})">` +
      `<path d="${glyph.d}" fill="${MARK_COLOR}"/></g></svg>`;
    composite = Buffer.from(svg);
  }

  await sharp({ create: { width: size, height: size, channels: 4, background: brand } })
    .composite([{ input: composite, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(outFile);

  console.log(`  ${outFile.replace(`${clientRoot}/`, "")}  ${size}x${size}`);
}

console.log(
  `App icons  tile ${brand}  mark ${useOverride ? "public/brand-mark.png" : `U+${GLYPH_CODEPOINT.toString(16).toUpperCase()} (${glyph.name})`}`,
);
await render(512, 0.56, resolve(iconsDir, "icon-512.png"));
await render(192, 0.56, resolve(iconsDir, "icon-192.png"));
await render(512, 0.44, resolve(iconsDir, "icon-maskable-512.png"));
// The tab icon is the same mark, so the tab, the header and the home screen do
// not disagree about what this app is.
await render(48, 0.56, resolve(clientRoot, "public/favicon.png"));
