import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
export const clientRoot = resolve(scriptRoot, "..");

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
    source: resolve(clientRoot, "public/fonts/GmarketSansBold.woff"),
    output: resolve(clientRoot, "public/fonts/GmarketSansBold-subset-v3.woff2"),
    publicName: "GmarketSansBold-subset-v3.woff2",
    maxBytes: 128 * 1024,
    preload: true,
  },
];

const textExtensions = new Set([".css", ".html", ".json", ".mjs", ".ts", ".vue"]);
const contentRoots = [
  resolve(clientRoot, "src"),
  resolve(clientRoot, "scripts"),
  resolve(clientRoot, "index.html"),
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
