// Verifies that the SBOM in this repository actually describes this application.
// A scaffolding copy once carried another app's SBOM into three repositories, so the
// identity fields are checked on every CI run.
//
// Why identity fields instead of regenerating and diffing: CycloneDX metadata.timestamp,
// the UUID inside the SPDX documentNamespace and the npm CLI version recorded in tools are
// all non-deterministic, so a regenerate-and-diff guard would fail on every run. Reading the
// committed document needs no network, finishes in milliseconds and is fully deterministic.
//
// No SBOM present means an immediate pass, so this file can be dropped into every app: it
// only checks where an SBOM is produced and stays a harmless no-op everywhere else.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cyclonedxPath = resolve(projectRoot, "artifacts", "sbom", "production.cyclonedx.json");
const spdxPath = resolve(projectRoot, "artifacts", "sbom", "production.spdx.json");

if (!existsSync(cyclonedxPath)) {
  console.log("verify-sbom-identity: no SBOM artifact found, skipping.");
  process.exit(0);
}

const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
const cyclonedx = JSON.parse(readFileSync(cyclonedxPath, "utf8"));
const component = cyclonedx.metadata?.component ?? {};
const errors = [];

if (component.name !== packageJson.name) {
  errors.push(`cyclonedx metadata.component.name is "${component.name}", expected "${packageJson.name}"`);
}

if (component.version !== packageJson.version) {
  errors.push(`cyclonedx metadata.component.version is "${component.version}", expected "${packageJson.version}"`);
}

// GITHUB_REPOSITORY only exists on GitHub Actions; local runs skip the vcs comparison.
if (process.env.GITHUB_REPOSITORY) {
  const expectedUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}`;
  const vcs = (component.externalReferences ?? []).find((reference) => reference.type === "vcs");
  const actualUrl = vcs?.url?.replace(/\.git$/, "") ?? "";

  if (actualUrl !== expectedUrl) {
    errors.push(`cyclonedx vcs reference is "${actualUrl || "(missing)"}", expected "${expectedUrl}"`);
  }
} else {
  console.log("verify-sbom-identity: GITHUB_REPOSITORY unset, skipping vcs check.");
}

if (existsSync(spdxPath)) {
  const spdx = JSON.parse(readFileSync(spdxPath, "utf8"));
  const rootId = spdx.documentDescribes?.[0];
  const rootPackage = spdx.packages?.find((item) => item.SPDXID === rootId);

  if (rootPackage?.name !== packageJson.name) {
    errors.push(`spdx root package name is "${rootPackage?.name}", expected "${packageJson.name}"`);
  }
}

if (errors.length > 0) {
  console.error("verify-sbom-identity: SBOM does not belong to this repository.");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error("Run npm run sbom:prod in this repository instead of reusing another app's artifact.");
  process.exit(1);
}

console.log(`verify-sbom-identity: OK (${component.name}@${component.version})`);
