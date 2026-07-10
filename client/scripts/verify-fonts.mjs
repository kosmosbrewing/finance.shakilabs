import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectFontCharacters, fontJob } from "./font-subset-config.mjs";

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
assert(manifest.font.publicName === fontJob.publicName, "Font manifest name is stale");

const fontPath = resolve(distRoot, "fonts", fontJob.publicName);
assert(existsSync(fontPath), `Missing shipped font: ${fontJob.publicName}`);
const font = readFileSync(fontPath);
assert(font.subarray(0, 4).toString("ascii") === "wOF2", "Shipped font must be WOFF2");
assert(font.byteLength <= fontJob.maxBytes,
  `${fontJob.publicName} exceeds its ${fontJob.maxBytes}-byte budget`);
assert(manifest.font.bytes === font.byteLength, "Font manifest size is stale");
assert(manifest.font.sha256 === hash(font), "Shipped font does not match its manifest");

const css = readdirSync(resolve(distRoot, "assets"))
  .filter((file) => file.endsWith(".css"))
  .map((file) => readFileSync(resolve(distRoot, "assets", file), "utf8"))
  .join("\n");
assert(css.includes(`/finance/fonts/${fontJob.publicName}`), "Built CSS misses the v3 brand font");
const html = readFileSync(resolve(distRoot, "index.html"), "utf8");
assert(html.includes(`/finance/fonts/${fontJob.publicName}`), "Index preload misses the v3 brand font");

console.log(`Validated ${fontJob.publicName} (${font.byteLength} bytes).`);
