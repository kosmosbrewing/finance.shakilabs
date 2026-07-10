import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { clientRoot, collectFontCharacters, fontJob } from "./font-subset-config.mjs";

const characters = collectFontCharacters();
const temporaryRoot = mkdtempSync(join(tmpdir(), "finance-fonts-"));
const characterFile = resolve(temporaryRoot, "characters.txt");
const manifestPath = resolve(clientRoot, "scripts/font-subset-manifest.json");

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

try {
  writeFileSync(characterFile, characters);
  const result = spawnSync("python3", [
    "-m",
    "fontTools.subset",
    fontJob.source,
    `--text-file=${characterFile}`,
    `--output-file=${fontJob.output}`,
    "--flavor=woff2",
    "--layout-features=*",
    "--name-IDs=*",
    "--name-legacy",
    "--name-languages=*",
    "--notdef-glyph",
    "--notdef-outline",
    "--recommended-glyphs",
    "--no-recalc-timestamp",
    "--drop-tables+=FFTM",
  ], { encoding: "utf8" });

  if (result.error || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr.trim();
    throw new Error(`Font subsetting failed for ${fontJob.publicName}: ${detail}`);
  }

  const content = readFileSync(fontJob.output);
  const manifest = {
    schemaVersion: 1,
    characterCount: [...characters].length,
    characterSha256: hash(characters),
    font: {
      publicName: fontJob.publicName,
      bytes: content.byteLength,
      sha256: hash(content),
    },
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${manifest.font.publicName} for ${manifest.characterCount} characters.`);
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
