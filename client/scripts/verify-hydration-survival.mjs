// Hydration survival gate.
//
// NOTE: comments here are intentionally ASCII-only. scripts/ is scanned by
// font-subset-config.mjs, so a non-ASCII character would change the shipped font
// subset and force a fonts:subset regeneration.
//
// WHAT THIS MEASURES, AND WHY NOT CHARACTER COUNTS
// ---------------------------------------------------------------------------
// This app injects its prerendered body as a sibling of <div id="app"> and, on
// mount, moves the <article> into the Vue layout while dropping any section the
// app already draws (src/utils/prerenderFallback.ts). That is only safe if the
// sentences the crawler received are still somewhere in the reader's DOM. When
// they are not, the crawler and the reader get different bodies - a
// cloaking-adjacent shape, and an AdSense reviewer (who runs JavaScript) reads
// the smaller page.
//
// A character-count ratio cannot detect that. On 2026-08-26 five live card
// routes scored 95-208% on that ratio while ZERO of their prerendered sentences
// were still in the DOM: a calculator screen simply writes a similar VOLUME of
// different words. Ratios measure bulk; this gate measures identity.
//
// So the unit is a sentence: every >=30-character sentence of the prerendered
// article must still be findable in the hydrated DOM. Whitespace is squashed on
// both sides, because the app re-renders the same sentence through different
// elements and wraps it differently.
//
// Two assertions per route, both required:
//   1. the prerendered blocks left the body after mount (either adopted into the
//      layout or deleted). Measuring before that would read the copy that is
//      about to move and report a false 100%;
//   2. at least SURVIVAL_FLOOR of those sentences are somewhere in the DOM.
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_ROUTES, SITEMAP_ROUTES, PARAM_ROUTES } from "./seo-routes.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(projectRoot, "dist");

// Matches the floor used by the live audit. A route below this is serving the
// crawler prose the reader never sees.
const SURVIVAL_FLOOR = 0.9;
const MIN_SENTENCE_CHARS = 30;

// WHAT IS ENFORCED, AND WHAT IS ONLY REPORTED
// ---------------------------------------------------------------------------
// The floor is enforced on the sitemap routes: those are the URLs this site
// actively asks a crawler to rank, so their body has to be the body a reader
// gets. The 120 canonicalized amount variants (/salary/3000 and friends) are
// measured and printed but not gated, because their prerendered prose narrates
// one specific amount while the view renders that amount as calculator UI - a
// real gap, but one that needs content work per family, not a wiring fix. They
// are tracked separately; gating them today would only turn this gate off.
//
// LEDGER, NOT MUTE LIST
// ---------------------------------------------------------------------------
// Sitemap routes that are still under the floor are listed with the number they
// actually scored. A listed route fails if it gets WORSE, and it also fails once
// it reaches the floor - at which point the line must be deleted. So the list can
// only shrink, and it cannot quietly absorb a new regression.
const KNOWN_BELOW_FLOOR = {
  // Prerender narrates the household rules for this variant; EitcView renders the
  // same rules as a table + result, so the sentences themselves are not redrawn.
  "/eitc/single-income": 0.79,
  "/eitc/double-income": 0.82,
  // AboutView writes shorter versions of the prerendered "limits" and "operating
  // principles" sections under identical headings, so dedupe drops the longer ones.
  "/about": 0.71,
};
// 158 routes, so pages run in parallel. Kept low enough that a laptop and a
// 2-core CI runner both stay responsive.
const CONCURRENCY = 6;

// Vercel serves this app under /finance (see vite.config.ts base: "/finance/"),
// so the local server has to reproduce the prefix or every asset URL in the
// built HTML 404s.
const BASE_PREFIX = "/finance";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

function resolveFile(urlPath) {
  let path = decodeURIComponent(urlPath.split("?")[0]);
  if (path === BASE_PREFIX || path === `${BASE_PREFIX}/`) path = "/";
  else if (path.startsWith(`${BASE_PREFIX}/`)) path = path.slice(BASE_PREFIX.length);

  const candidate = resolve(distRoot, `.${path}`);
  // Never serve outside dist, even though this only ever answers localhost.
  if (candidate !== distRoot && !candidate.startsWith(distRoot + sep)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;

  // cleanUrls: /severance-pay -> dist/severance-pay/index.html
  const indexed = join(candidate, "index.html");
  return existsSync(indexed) ? indexed : null;
}

function startServer() {
  const server = createServer((request, response) => {
    const file = resolveFile(request.url ?? "/");
    if (!file) {
      response.writeHead(404).end("not found");
      return;
    }
    response.writeHead(200, {
      "content-type": MIME[extname(file)] ?? "application/octet-stream",
    });
    response.end(readFileSync(file));
  });

  return new Promise((resolveServer) => {
    server.listen(0, "127.0.0.1", () => resolveServer(server));
  });
}

// Block-level tags become line breaks so a heading never runs into the paragraph
// under it. The em dash is treated the same way: the prerender writes
// "<strong>lead-in</strong> - body" inside one <li>, while the views render the
// two halves as separate elements, so joining them would report a loss that did
// not happen.
const BLOCK_END =
  /<\/(p|li|h1|h2|h3|h4|h5|h6|td|th|div|section|article|blockquote|dd|dt|figcaption|ol|ul)>|<br\s*\/?>/gi;

function htmlToLines(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(BLOCK_END, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .split("\n");
}

export function sentencesFrom(html) {
  const sentences = [];
  for (const line of htmlToLines(html)) {
    for (const chunk of line.split(/\s—\s/)) {
      for (const raw of chunk.split(/(?<=[.!?])\s+/)) {
        const sentence = raw.replace(/\s+/g, " ").trim();
        if (sentence.length >= MIN_SENTENCE_CHARS) sentences.push(sentence);
      }
    }
  }
  return sentences;
}

const squash = (value) => value.replace(/\s+/g, "");

// The page's OWN prerendered body only - never the shared header/footer/nav,
// which Vue redraws for free and would inflate every route's score.
function prerenderedBody(html) {
  return [
    ...html.matchAll(
      /<(article|section)[^>]*\bdata-seo-prerender\b[^>]*>([\s\S]*?)<\/\1>/gi,
    ),
  ]
    .map(([, , inner]) => inner)
    .join("\n");
}

function staticFileFor(route) {
  const file =
    route === "/"
      ? resolve(distRoot, "index.html")
      : resolve(distRoot, route.slice(1), "index.html");
  if (!existsSync(file)) {
    throw new Error(`No static output for ${route} - run the build first`);
  }
  return readFileSync(file, "utf8");
}

async function measure(context, origin, route) {
  const sentences = sentencesFrom(prerenderedBody(staticFileFor(route)));
  if (sentences.length === 0) {
    return {
      route,
      failure: `${route}: prerendered body has no sentence of ${MIN_SENTENCE_CHARS}+ characters`,
    };
  }

  const page = await context.newPage();
  try {
    await page.goto(`${origin}${BASE_PREFIX}${route === "/" ? "" : route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Assertion 1: mounted AND the prerendered blocks are no longer loose in the
    // body. Measuring before that would read the doomed copy and report a false
    // 100%.
    try {
      await page.waitForFunction(
        () =>
          (document.querySelector("#app")?.children.length ?? 0) > 0 &&
          document.querySelectorAll("body > [data-seo-prerender]").length === 0,
        undefined,
        { timeout: 20000 },
      );
    } catch {
      return { route, failure: `${route}: app never mounted or never cleared the prerendered blocks` };
    }

    const dom = squash(
      htmlToLines(await page.evaluate(() => document.body.innerHTML)).join(" "),
    );
    const missing = sentences.filter((sentence) => !dom.includes(squash(sentence)));
    const rate = (sentences.length - missing.length) / sentences.length;
    const row = { route, total: sentences.length, missing: missing.length, rate };

    const percent = (value) => `${(value * 100).toFixed(1)}%`;
    const samples = () =>
      missing.slice(0, 5).map((sentence) => `      - ${sentence.slice(0, 110)}`).join("\n");

    if (route in KNOWN_BELOW_FLOOR) {
      const recorded = KNOWN_BELOW_FLOOR[route];
      if (rate >= SURVIVAL_FLOOR) {
        return {
          route,
          row,
          failure:
            `${route}: now at ${percent(rate)}, above the floor — delete its line from ` +
            "KNOWN_BELOW_FLOOR so the next regression is caught.",
        };
      }
      if (rate < recorded) {
        return {
          route,
          row,
          failure:
            `${route}: regressed to ${percent(rate)} from the recorded ${percent(recorded)}, ` +
            `${missing.length} of ${sentences.length} sentences missing:\n${samples()}`,
        };
      }
      return { route, row };
    }

    // Only the submitted URLs are gated; see the note above KNOWN_BELOW_FLOOR.
    if (rate >= SURVIVAL_FLOOR || !gatedRoutes.has(route)) return { route, row };
    return {
      route,
      row,
      failure:
        `${route}: ${percent(rate)} of ${sentences.length} prerendered sentences survived hydration ` +
        `(floor ${(SURVIVAL_FLOOR * 100).toFixed(0)}%), ${missing.length} missing:\n${samples()}`,
    };
  } finally {
    await page.close();
  }
}

const server = await startServer();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// Analytics, AdSense and Kakao are third parties whose availability must not
// decide whether this gate passes.
await context.route("**", (route) => {
  const url = route.request().url();
  return url.startsWith(origin) ? route.continue() : route.abort();
});

const gatedRoutes = new Set(SITEMAP_ROUTES);
const failures = [];
const rows = [];
// Only these routes are printed in full; the rest are summarised. 158 lines of
// "100.0%" buries the one line that matters.
const REPORT_ROUTES = new Set(process.argv.slice(2));

try {
  const queue = [...SEO_ROUTES];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    for (let route = queue.shift(); route; route = queue.shift()) {
      const result = await measure(context, origin, route);
      if (result.row) rows.push(result.row);
      if (result.failure) failures.push(result.failure);
    }
  });
  await Promise.all(workers);
} finally {
  await browser.close();
  server.close();
}

rows.sort((a, b) => a.rate - b.rate || a.route.localeCompare(b.route));
for (const { route, total, missing, rate } of rows) {
  if (rate === 1 && !REPORT_ROUTES.has(route)) continue;
  console.log(
    `  ${route.padEnd(32)} ${String(total - missing).padStart(3)}/${String(total).padEnd(3)} sentences  ${(rate * 100).toFixed(1)}%`,
  );
}

if (failures.length > 0) {
  console.error(`\nHydration survival gate failed on ${failures.length} route(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

const summarise = (subset) => {
  if (subset.length === 0) return "none";
  const worst = subset.reduce((low, row) => Math.min(low, row.rate), 1);
  const under = subset.filter((row) => row.rate < SURVIVAL_FLOOR).length;
  return `${subset.length} routes, worst ${(worst * 100).toFixed(1)}%, ${under} under floor`;
};
const variants = new Set(PARAM_ROUTES);
console.log(
  `Hydration survival (floor ${(SURVIVAL_FLOOR * 100).toFixed(0)}%)\n` +
    `  gated    (sitemap):  ${summarise(rows.filter((row) => gatedRoutes.has(row.route)))}\n` +
    `  reported (variants): ${summarise(rows.filter((row) => variants.has(row.route)))}`,
);
