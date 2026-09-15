import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { clientRoot, collectFontCharacters, fontJobs } from "./font-subset-config.mjs";

const characters = collectFontCharacters();
const temporaryRoot = mkdtempSync(join(tmpdir(), "finance-fonts-"));
const characterFile = resolve(temporaryRoot, "characters.txt");
const manifestPath = resolve(clientRoot, "scripts/font-subset-manifest.json");

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

try {
  writeFileSync(characterFile, characters);
  const fonts = fontJobs.map((fontJob) => {
    // 잡이 자기 문자셋을 선언하면 그것만 쓴다 — 브랜드 폰트를 UI 전체 문자셋(979자)으로
    // 자르면 11KB짜리가 122KB가 된다(Pretendard만 그리는 800여 자가 딸려 들어와서).
    let jobCharacterFile = characterFile;
    if (fontJob.characters) {
      jobCharacterFile = resolve(temporaryRoot, `${fontJob.publicName}.txt`);
      writeFileSync(jobCharacterFile, fontJob.characters);
    }
    // 잡이 플래그를 선언하면 그것만 쓴다. 브랜드 폰트는 --no-hinting 하나로 충분하고,
    // 아래 기본 플래그(name 테이블 전체 보존 + 힌팅 유지)를 쓰면 같은 문자셋이 35% 커진다.
    const subsetFlags = fontJob.subsetFlags ?? [
      "--layout-features=*",
      "--name-IDs=*",
      "--name-legacy",
      "--name-languages=*",
      "--notdef-glyph",
      "--notdef-outline",
      "--recommended-glyphs",
      "--no-recalc-timestamp",
      "--drop-tables+=FFTM",
    ];
    const result = spawnSync("python3", [
      "-m",
      "fontTools.subset",
      fontJob.source,
      `--text-file=${jobCharacterFile}`,
      `--output-file=${fontJob.output}`,
      "--flavor=woff2",
      ...subsetFlags,
    ], { encoding: "utf8" });

    if (result.error || result.status !== 0) {
      const detail = result.error?.message ?? result.stderr.trim();
      throw new Error(`Font subsetting failed for ${fontJob.publicName}: ${detail}`);
    }

    const content = readFileSync(fontJob.output);
    return {
      publicName: fontJob.publicName,
      bytes: content.byteLength,
      sha256: hash(content),
    };
  });
  const manifest = {
    schemaVersion: 2,
    characterCount: [...characters].length,
    characterSha256: hash(characters),
    fonts,
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${fonts.length} fonts for ${manifest.characterCount} characters.`);
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
