// Mobile horizontal overflow gate.
//
// NOTE: comments here are intentionally ASCII-only. scripts/ is scanned by
// font-subset-config.mjs, so a non-ASCII character would change the shipped font
// subset and force a fonts:subset regeneration.
//
// WHAT THIS MEASURES, AND WHY
// ---------------------------------------------------------------------------
// At 390px the whole document must not scroll sideways. A page that does is not
// "dense", it is broken: the reader drags the viewport left and right to read a
// paragraph, and every sticky/full-bleed band is visibly short of the right edge.
//
// On 2026-09-15 a live audit found 11 of 14 sampled finance routes scrolling,
// worst /overtime at +279px. The cause is always the same shape - a <table>
// wider than the viewport that no ancestor clips or scrolls. Wide tables are
// fine; what is not fine is letting the table size the document. The app already
// has the right pattern (div.salary-table-scroll.overflow-x-auto), so the fix is
// wrapping, never shrinking the data.
//
// The assertion is the reader's symptom itself, measured in the browser:
//   documentElement.scrollWidth - documentElement.clientWidth <= TOLERANCE_PX
//
// It is deliberately NOT a source grep for unwrapped <table>. A table is only a
// defect when it actually pushes the document, and a wrapped one never does, so
// the only honest judge is layout. Diagnostics below name the offending element
// AND check whether it has an overflow-x:auto|scroll ancestor, which is what
// tells a fixer "wrap this" versus "this one is already wrapped, look further".
//
// WHY THIS IS NOT IN `npm run build`
// ---------------------------------------------------------------------------
// It needs a real browser. playwright-core ships without browsers on purpose so
// that `npm ci` on the Vercel build image stays lean; chromium is downloaded in
// CI only (.github/workflows/ci.yml). Wiring this into `build` would make
// production deploys depend on a browser download that the deploy image does not
// have. So: CI gates it, the build stays portable.
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_ROUTES } from "./seo-routes.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(projectRoot, "dist");

// The narrowest phone width in the audit set. Anything that fits 390 fits 393,
// 412 and 430; the reverse is not true, so this is the only width worth gating.
const VIEWPORT = { width: 390, height: 844 };
// Sub-pixel layout rounding can leave a fraction of a pixel behind. One pixel of
// slack, no more - the defects this catches are 31px to 279px.
const TOLERANCE_PX = 1;
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

// Runs inside the page. Returns the document overflow and, when there is any,
// the elements that reach past the right edge with nothing scrolling them.
function probe(tolerance) {
  const root = document.documentElement;
  const overflow = root.scrollWidth - root.clientWidth;
  const viewportRight = root.clientWidth;

  const describe = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls =
      typeof el.className === "string" && el.className.trim()
        ? `.${el.className.trim().split(/\s+/).slice(0, 4).join(".")}`
        : "";
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const offenders = [];
  const offenderNodes = [];
  if (overflow > tolerance) {
    for (const el of document.querySelectorAll("body *")) {
      const style = getComputedStyle(el);
      // Fixed/sticky overlays ride the viewport; they cannot size the document.
      if (style.position === "fixed") continue;
      if (style.visibility === "hidden" || style.display === "none") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.right <= viewportRight + tolerance) continue;

      // THE JUDGEMENT: an element only pushes the page when nothing between it
      // and the root scrolls or clips horizontally. This is exactly why an
      // already-wrapped table must not be reported.
      //
      // <body> and <html> are excluded on purpose. This app sets overflow-x
      // hidden on body, and that does NOT clip: when html's overflow is visible
      // the body's value propagates to the viewport and body itself behaves as
      // visible. Counting it as containment made every route report "no
      // offender" while the document still scrolled +99px - the gate would have
      // been right about the symptom and useless about the cause.
      let contained = false;
      for (
        let parent = el.parentElement;
        parent && parent !== document.body && parent !== document.documentElement;
        parent = parent.parentElement
      ) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden") {
          contained = true;
          break;
        }
      }
      if (contained) continue;

      offenderNodes.push(el);
      offenders.push({
        el,
        selector: describe(el),
        width: Math.round(rect.width),
        right: Math.round(rect.right),
      });
    }
  }

  // Report the outermost offenders only. A wide table makes every one of its
  // cells overflow too, and 40 lines of <td> hide the one line that names the
  // element to wrap.
  const outermost = offenders.filter(
    (candidate) => !offenderNodes.some((other) => other !== candidate.el && other.contains(candidate.el)),
  );
  outermost.sort((a, b) => b.right - a.right);
  return {
    overflow,
    offenders: outermost.slice(0, 6).map(({ selector, width, right }) => ({ selector, width, right })),
  };
}

async function measure(context, origin, route) {
  const page = await context.newPage();
  try {
    await page.goto(`${origin}${BASE_PREFIX}${route === "/" ? "" : route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    // Measure the reader's page, not the prerendered stand-in that is about to be
    // adopted into the Vue layout. Both are in the DOM before mount, so measuring
    // early would double-count the body and invent overflow that never ships.
    try {
      await page.waitForFunction(
        () =>
          (document.querySelector("#app")?.children.length ?? 0) > 0 &&
          document.querySelectorAll("body > [data-seo-prerender]").length === 0,
        undefined,
        { timeout: 20000 },
      );
    } catch {
      return { route, failure: `${route}: app never mounted` };
    }
    // Fonts change text metrics, and a table sized by its widest cell is exactly
    // the thing this gate watches.
    await page.evaluate(() => document.fonts?.ready);

    const { overflow, offenders } = await page.evaluate(probe, TOLERANCE_PX);
    if (overflow <= TOLERANCE_PX) return { route, overflow };

    const lines = offenders
      .map((o) => `      +${o.right - VIEWPORT.width}px  w=${o.width}  ${o.selector}`)
      .join("\n");
    return {
      route,
      overflow,
      failure:
        `${route}: document scrolls +${overflow}px at ${VIEWPORT.width}px. ` +
        `Widest unwrapped elements (wrap them in div.overflow-x-auto):\n${lines || "      (none isolated - check a full-bleed ancestor)"}`,
    };
  } finally {
    await page.close();
  }
}

const server = await startServer();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
// Same reasoning as the hydration gate: one context for every route, so a service
// worker registered by the first page would race every later navigation. This
// gate is about layout, never about a cache layer.
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  serviceWorkers: "block",
});

// Analytics, AdSense and Kakao are third parties whose availability must not
// decide whether this gate passes - and an ad iframe of its own width would.
await context.route("**", (route) => {
  const url = route.request().url();
  return url.startsWith(origin) ? route.continue() : route.abort();
});

const failures = [];
const rows = [];

try {
  const queue = [...SEO_ROUTES];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    for (let route = queue.shift(); route; route = queue.shift()) {
      const result = await measure(context, origin, route);
      if (typeof result.overflow === "number") {
        rows.push({ route, overflow: result.overflow });
      }
      if (result.failure) failures.push(result.failure);
    }
  });
  await Promise.all(workers);
} finally {
  await browser.close();
  server.close();
}

rows.sort((a, b) => b.overflow - a.overflow || a.route.localeCompare(b.route));
for (const { route, overflow } of rows) {
  if (overflow <= TOLERANCE_PX) continue;
  console.log(`  ${route.padEnd(36)} +${overflow}px`);
}

if (failures.length > 0) {
  console.error(
    `\nMobile overflow gate failed on ${failures.length} of ${rows.length} route(s) at ${VIEWPORT.width}px:`,
  );
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `Mobile overflow (${VIEWPORT.width}px, tolerance ${TOLERANCE_PX}px): ` +
    `${rows.length} routes, all within tolerance`,
);
