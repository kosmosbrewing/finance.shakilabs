// Calculator funnel wiring gate.
//
// NOTE: comments here are intentionally ASCII-only. scripts/ is scanned by
// font-subset-config.mjs, so a non-ASCII character would change the shipped font
// subset and force a fonts:subset regeneration.
//
// WHY THIS EXISTS
// ---------------------------------------------------------------------------
// The funnel events (calculator_start / calculator_submit / result_view) were
// wired on 4 of the 26 calculators while every report said the analytics work
// was "done". The same repo has already shipped a "26/26 complete" claim that
// measured 18/26, so the denominator here is never typed by hand: it is
// CALCULATOR_ROUTES, which seo-routes.mjs derives from the sitemap.
//
// Three assertions, all required:
//   1. src/utils/calculatorIds.ts lists EXACTLY the sitemap calculator routes -
//      no extra id can be invented and no route can be silently dropped;
//   2. every calculator route has a router entry, and the view that entry loads
//      contains <CalculatorInteractionTracker>;
//   3. no view hardcodes calculator-id / page-path back onto the tracker - the
//      ids must stay route-derived or the parameter fragmentation that page_view
//      already suffered comes back on the events.
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CALCULATOR_ROUTES } from "./seo-routes.mjs";

const clientRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(clientRoot, relative), "utf8");

const failures = [];

// --- 1. the id registry mirrors the sitemap-derived route list ---------------
const idsSource = read("src/utils/calculatorIds.ts");
const registryBlock = idsSource.match(
  /export const CALCULATOR_ROUTES = \[([\s\S]*?)\] as const;/,
);
if (!registryBlock) {
  failures.push("src/utils/calculatorIds.ts: CALCULATOR_ROUTES array not found");
}
const registryRoutes = new Set(
  [...(registryBlock?.[1] ?? "").matchAll(/"([^"]+)"/g)].map(([, route]) => route),
);
const sitemapRoutes = new Set(CALCULATOR_ROUTES);
for (const route of sitemapRoutes) {
  if (!registryRoutes.has(route)) {
    failures.push(`calculatorIds.ts is missing ${route} (present in the sitemap)`);
  }
}
for (const route of registryRoutes) {
  if (!sitemapRoutes.has(route)) {
    failures.push(`calculatorIds.ts lists ${route}, which is not a sitemap calculator route`);
  }
}

// --- 2. every calculator route reaches a view that wraps the tracker ---------
const routerSource = read("src/router/index.ts");
const routeToView = new Map();
// Tempered: a redirect entry has no component, so an unrestricted scan would
// bridge into the NEXT route and credit the wrong path (this cost /compare once).
const entry = /path:\s*"([^"]+)"((?:(?!path:)[\s\S]){0,400}?)component:\s*\(\)\s*=>\s*import\("@\/views\/([A-Za-z0-9]+\.vue)"\)/g;
for (const [, path, , view] of routerSource.matchAll(entry)) {
  // Only the bare calculator path counts. /insurance/:amount loads the same view
  // but a wiring claim has to be anchored to the canonical route.
  if (!routeToView.has(path)) routeToView.set(path, view);
}

const TRACKER_TAG = "<CalculatorInteractionTracker";
const HARDCODED = /<CalculatorInteractionTracker[\s\S]{0,200}?(:?calculator-id|:?page-path)=/;
const wired = [];
for (const route of [...sitemapRoutes].sort()) {
  const view = routeToView.get(route);
  if (!view) {
    failures.push(`${route}: no router entry loads a view for this calculator route`);
    continue;
  }
  const viewPath = `src/views/${view}`;
  if (!existsSync(resolve(clientRoot, viewPath))) {
    failures.push(`${route}: router points at ${viewPath}, which does not exist`);
    continue;
  }
  const source = read(viewPath);
  if (!source.includes(TRACKER_TAG)) {
    failures.push(`${route}: ${view} has no ${TRACKER_TAG}> - funnel events never fire here`);
    continue;
  }
  // --- 3. ids stay route-derived ---
  if (HARDCODED.test(source)) {
    failures.push(
      `${route}: ${view} passes calculator-id/page-path to the tracker. ` +
        "Those are derived from the route on purpose - remove the prop.",
    );
    continue;
  }
  wired.push({ route, view });
}

const total = sitemapRoutes.size;
for (const { route, view } of wired) {
  console.log(`  ${route.padEnd(24)} ${view}`);
}
console.log(`Calculator funnel wiring: ${wired.length}/${total} calculators`);

if (failures.length > 0) {
  console.error(`\nCalculator analytics gate failed (${failures.length}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
