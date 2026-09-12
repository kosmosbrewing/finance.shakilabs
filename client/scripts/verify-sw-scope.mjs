// Service worker scope gate - measured in a real browser, not read off the config.
//
// NOTE: comments here are intentionally ASCII-only. scripts/ is scanned by
// font-subset-config.mjs, so a non-ASCII character would change the shipped font
// subset and force a fonts:subset regeneration.
//
// WHY A BROWSER IS REQUIRED
// ---------------------------------------------------------------------------
// shakilabs.com serves a dozen apps off one origin: /finance/, /house/, /car/ ...
// A service worker registered by one of them can, if its scope is wrong, answer
// fetches for all of them - and the symptom is another team's app silently
// serving stale pages. "scope: '/finance/'" in a config file is a claim; the only
// proof is asking the browser which clients the worker controls. This gate mounts
// a fake sibling app at /house/ next to the real dist and checks four things:
//
//   1. the registration's scope is exactly <origin>/finance/;
//   2. a page under /finance/ IS controlled by the worker;
//   3. a page under /house/ is NOT controlled, and nothing under /house/ lands in
//      any cache the worker owns;
//   4. navigations are network-first: content changed on disk after the first
//      visit shows up on the next load, rather than the cached copy. That is what
//      keeps the hydration gate's view and the reader's view the same page.
//   5. /api/ responses are never cached.
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(projectRoot, "dist");
const BASE_PREFIX = "/finance";
// The sibling app is a stand-in for /house/, /car/ and the rest. Its body is
// unique so a cached answer would be obvious.
const SIBLING_PREFIX = "/house";
const SIBLING_BODY = "<!doctype html><title>sibling app</title><p>sibling-app-live</p>";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

// Marker the test swaps into a served page to prove the next load came from the
// network and not from the worker's cache.
let liveMarker = "MARKER-FIRST";

function resolveFile(urlPath) {
  let path = decodeURIComponent(urlPath.split("?")[0]);
  if (path === BASE_PREFIX || path === `${BASE_PREFIX}/`) path = "/";
  else if (path.startsWith(`${BASE_PREFIX}/`)) path = path.slice(BASE_PREFIX.length);

  const candidate = resolve(distRoot, `.${path}`);
  if (candidate !== distRoot && !candidate.startsWith(distRoot + sep)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const indexed = join(candidate, "index.html");
  return existsSync(indexed) ? indexed : null;
}

function startServer() {
  const server = createServer((request, response) => {
    const url = request.url ?? "/";

    if (url.startsWith(SIBLING_PREFIX)) {
      response.writeHead(200, { "content-type": MIME[".html"] });
      response.end(SIBLING_BODY);
      return;
    }
    // Stand-in for the comment/like backend.
    if (url.startsWith("/api/")) {
      response.writeHead(200, { "content-type": MIME[".json"] });
      response.end(JSON.stringify({ ok: true, at: Date.now() }));
      return;
    }

    const file = resolveFile(url);
    if (!file) {
      response.writeHead(404).end("not found");
      return;
    }
    let body = readFileSync(file);
    if (extname(file) === ".html") {
      body = Buffer.from(
        readFileSync(file, "utf8").replace("</body>", `<span id="live-marker">${liveMarker}</span></body>`),
      );
    }
    response.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  });

  return new Promise((done) => server.listen(0, "127.0.0.1", () => done(server)));
}

const failures = [];
const rows = [];
const check = (label, ok, detail) => {
  rows.push(`  ${ok ? "ok  " : "FAIL"} ${label}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures.push(`${label}${detail ? ` - ${detail}` : ""}`);
};

const server = await startServer();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const context = await browser.newContext();
// Third parties must not decide whether this gate passes.
await context.route("**", (route) =>
  route.request().url().startsWith(origin) ? route.continue() : route.abort(),
);

try {
  const page = await context.newPage();
  await page.goto(`${origin}${BASE_PREFIX}/insurance`, { waitUntil: "load", timeout: 30000 });

  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
    timeout: 20000,
  }).catch(() => {});

  // 1. scope
  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.scope ?? null;
  });
  check("registration scope is <origin>/finance/", scope === `${origin}${BASE_PREFIX}/`, String(scope));

  // 2. a /finance/ page is controlled
  const controlledHere = await page.evaluate(() => navigator.serviceWorker.controller !== null);
  check("page under /finance/ is controlled by the worker", controlledHere);

  // 4. network-first. THREE loads, not two, and the reason matters: the first
  // navigation happens before the worker has activated, so nothing is cached yet
  // and even a CacheFirst handler would look correct on the second load. The
  // second load is what fills the cache; only the third can tell a stale answer
  // from a fresh one. (Verified in reverse: with handler CacheFirst this check
  // passed at two loads and fails at three.)
  liveMarker = "MARKER-SECOND";
  await page.reload({ waitUntil: "load" });
  const seeded = await page.textContent("#live-marker");
  liveMarker = "MARKER-THIRD";
  await page.reload({ waitUntil: "load" });
  const after = await page.textContent("#live-marker");
  check(
    "navigation is network-first (fresh HTML wins over cache)",
    after === "MARKER-THIRD",
    `seeded ${seeded} -> served ${after}`,
  );

  // 5. /api/ is never cached
  await page.evaluate(async () => {
    await fetch("/api/finance/ping").catch(() => {});
  });
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls = [];
    for (const name of names) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) urls.push(request.url);
    }
    return { names, urls };
  });
  check(
    "no /api/ response is cached",
    !cached.urls.some((url) => url.includes("/api/")),
    cached.urls.filter((url) => url.includes("/api/")).join(", "),
  );
  check(
    "no sibling-app URL is cached",
    !cached.urls.some((url) => url.includes(SIBLING_PREFIX)),
    cached.urls.filter((url) => url.includes(SIBLING_PREFIX)).join(", "),
  );
  const outside = cached.urls.filter((url) => !url.startsWith(`${origin}${BASE_PREFIX}/`));
  check("every cached URL sits under /finance/", outside.length === 0, outside.slice(0, 3).join(", "));

  // 3. the sibling app is untouched
  const sibling = await context.newPage();
  await sibling.goto(`${origin}${SIBLING_PREFIX}/dsr`, { waitUntil: "load", timeout: 30000 });
  const siblingControlled = await sibling.evaluate(() => navigator.serviceWorker.controller !== null);
  check("page under /house/ is NOT controlled by the worker", siblingControlled === false);
  const siblingBody = await sibling.textContent("p");
  check("sibling app serves its own live body", siblingBody === "sibling-app-live", String(siblingBody));

  console.log("Service worker scope");
  for (const row of rows) console.log(row);
  console.log(`  caches: ${cached.names.join(", ")} (${cached.urls.length} entries)`);
} finally {
  await browser.close();
  server.close();
}

if (failures.length > 0) {
  console.error(`\nService worker scope gate failed (${failures.length}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
