// Keeps client/vendor/README.md honest about the tarball that is actually checked in.
// The README records a SHA-256 next to the version, so a stale entry is not merely outdated
// documentation: it hands the wrong checksum to anyone verifying supply chain integrity.
// Nine apps shipped a 0.3.7 checksum long after they had moved to a newer artifact.
//
// Three comparisons, all reading local files only, so the result is deterministic:
//   1. real SHA-256 of each tarball == the SHA-256 recorded in the README
//   2. version in the tarball filename == every version mentioned in the README prose
//   3. package.json file:vendor/... reference == the tarball actually present
// A missing vendor directory is an immediate pass so this file can be dropped into every app.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vendorDir = resolve(projectRoot, "vendor");

if (!existsSync(vendorDir)) {
  console.log("verify-vendor-artifacts: no vendor directory, skipping.");
  process.exit(0);
}

const tarballs = readdirSync(vendorDir).filter((name) => name.endsWith(".tgz"));

if (tarballs.length === 0) {
  console.log("verify-vendor-artifacts: no vendored tarball, skipping.");
  process.exit(0);
}

const readmePath = resolve(vendorDir, "README.md");
const readme = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "";
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
const dependencyRefs = Object.values(packageJson.dependencies ?? {});
const declaredHashes = [...readme.matchAll(/SHA-256:\s*`?([0-9a-f]{64})`?/g)].map((match) => match[1]);
const actualHashes = new Map(
  tarballs.map((tarball) => [
    tarball,
    createHash("sha256").update(readFileSync(resolve(vendorDir, tarball))).digest("hex"),
  ]),
);
const versions = new Set();
const errors = [];

if (!readme) {
  errors.push("client/vendor/README.md is missing");
}

for (const [tarball, actualHash] of actualHashes) {
  const version = tarball.match(/-(\d+\.\d+\.\d+)\.tgz$/)?.[1];

  if (version) {
    versions.add(version);
  }

  if (!readme.includes(tarball)) {
    errors.push(`README does not mention ${tarball}`);
  }

  if (!declaredHashes.includes(actualHash)) {
    errors.push(`README has no SHA-256 entry matching ${tarball} (${actualHash})`);
  }

  if (!dependencyRefs.includes(`file:vendor/${tarball}`)) {
    errors.push(`package.json has no dependency pinned to file:vendor/${tarball}`);
  }
}

// Catches a half fix where the checksum is corrected but an old version is left in the prose.
for (const mentioned of new Set([...readme.matchAll(/\b(\d+\.\d+\.\d+)\b/g)].map((match) => match[1]))) {
  if (!versions.has(mentioned)) {
    errors.push(`README mentions version ${mentioned}, but the vendored tarball is ${[...versions].join(", ")}`);
  }
}

for (const hash of declaredHashes) {
  if (![...actualHashes.values()].includes(hash)) {
    errors.push(`README declares SHA-256 ${hash}, which matches no vendored tarball`);
  }
}

if (errors.length > 0) {
  console.error("verify-vendor-artifacts: vendored artifact records are out of sync.");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error("Update client/vendor/README.md so version, SHA-256 and the package.json reference match the tarball.");
  process.exit(1);
}

console.log(`verify-vendor-artifacts: OK (${tarballs.join(", ")})`);
