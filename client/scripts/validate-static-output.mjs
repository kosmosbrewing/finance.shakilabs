// 정적 산출물 게이트 — 프리렌더 결과가 배포 가능한 상태인지 빌드 중에 검증한다.
//
// 왜 생겼나: 02.finance는 156라우트를 프리렌더하면서 이 게이트가 없었고, 그 결과
//   (a) 가이드 4페이지가 /finance 접두어 없는 내부 링크 21개를 렌더해 크롤러가 404를 만났고
//   (b) 157페이지 전부가 셸 <noscript>를 남겨 h1이 2개였다.
// 두 결함 모두 04.card의 게이트가 이미 검사하던 항목이라, 코드가 아니라 게이트 부재가 원인이다.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEO_ROUTES,
  SITEMAP_ROUTES,
  PARAM_ROUTES,
  canonicalPathFor,
} from "./seo-routes.mjs";
// Body-text floors.
//
// The measurement basis matters more than the threshold. This counts the text inside
// article|section[data-seo-prerender] with whitespace removed — the page's own content, excluding
// the shared header/footer and excluding the spaces between words.
//
// An earlier version of this gate measured everything after <div id="app"></div> and kept the
// whitespace. That reads ~28% higher: /withholding scored 1,534 there and 1,202 here, so pages
// passed a 1,500 gate while an external audit measuring the article text called them thin. The
// stricter basis is the one that matches how the content is actually judged, so the gate uses it.
//
// MIN: no prerendered route may ship a stub. /freelancer/:amount once rendered a heading and one
// link while still returning 200.
// SITEMAP_MIN: anything submitted for indexing has to stand on its own. Every route in the
// sitemap is a page we are actively asking a crawler to rank.
const MIN_BODY_CHARS = 250;
const SITEMAP_MIN_BODY_CHARS = 1500;

function bodyTextLength(html) {
  const blocks = [
    ...html.matchAll(/<(article|section)[^>]*\bdata-seo-prerender[^>]*>([\s\S]*?)<\/\1>/gi),
  ];
  return blocks
    .map(([, , inner]) =>
      inner
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z]+;/gi, " "),
    )
    .join(" ")
    .replace(/\s+/g, "").length;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const repositoryRoot = resolve(projectRoot, "..");
const distRoot = resolve(projectRoot, "dist");
const canonicalBase = "https://shakilabs.com/finance";

const failures = [];
function assert(condition, message) {
  if (!condition) failures.push(message);
}

function canonicalFrom(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"\s*\/?>/)?.[1];
}

// The home route is "/" but vercel.json sets trailingSlash:false, so its public URL is the
// bare base — naive concatenation would demand ".../finance/", which 308s.
function urlFor(route) {
  return route === "/" ? canonicalBase : canonicalBase + route;
}

function validateVercelConfig() {
  const config = JSON.parse(readFileSync(resolve(repositoryRoot, "vercel.json"), "utf8"));
  assert(config.cleanUrls === true, "vercel.json: cleanUrls must be true");
  assert(config.trailingSlash === false, "vercel.json: trailingSlash must be false");
  assert(
    !(config.rewrites ?? []).some((rewrite) => rewrite.destination === "/index.html"),
    "vercel.json: index.html catch-all rewrite is forbidden (it would mask missing prerender output)",
  );
}

function validateRoutes() {
  const routeSet = new Set(SEO_ROUTES);
  const sitemapRouteSet = new Set(SITEMAP_ROUTES);
  const hashes = new Map();
  const titles = new Map();

  for (const route of SEO_ROUTES) {
    const outputPath = resolve(distRoot, route.slice(1), "index.html");
    if (!existsSync(outputPath)) {
      assert(false, `Missing static output for ${route}`);
      continue;
    }
    const html = readFileSync(outputPath, "utf8");

    // Consolidated amount variants must canonicalize to their base calculator; every other
    // route stays self-canonical. This assertion is the reason seo-routes.mjs and this gate
    // have to move in the same commit — a one-sided change fails the build immediately.
    const expectedCanonical = urlFor(canonicalPathFor(route));
    assert(
      canonicalFrom(html) === expectedCanonical,
      `Invalid canonical for ${route}: expected ${expectedCanonical}, got ${canonicalFrom(html)}`,
    );

    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    assert(title.length > 0, `Missing title for ${route}`);
    if (title) titles.set(title, [...(titles.get(title) ?? []), route]);

    const h1Count = html.match(/<h1\b/gi)?.length ?? 0;
    assert(h1Count === 1, `Expected one H1 for ${route}, found ${h1Count}`);

    assert(
      !/<noscript>/i.test(html),
      `Route-specific output must not retain the shell noscript for ${route}`,
    );

    // 내부 링크는 base(/finance)를 포함해야 한다. RouterLink의 to="/quit"는 옳지만
    // 정적 HTML에 그대로 나가면 404가 된다 — 21개 링크가 이 경로로 깨졌다.
    for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
      const href = match[1].split("#")[0].split("?")[0].replace(/\/$/, "");
      assert(
        !routeSet.has(href),
        `Unprefixed internal link on ${route}: href="${href}" must be "${canonicalBase.replace("https://shakilabs.com", "")}${href}"`,
      );
    }

    const bodyChars = bodyTextLength(html);
    const floor = sitemapRouteSet.has(route) ? SITEMAP_MIN_BODY_CHARS : MIN_BODY_CHARS;
    assert(
      bodyChars >= floor,
      `Thin body for ${route}: ${bodyChars} chars, need ${floor}`,
    );

    const hash = createHash("sha256").update(html).digest("hex");
    assert(!hashes.has(hash), `Duplicate raw HTML: ${route} equals ${hashes.get(hash)}`);
    hashes.set(hash, route);
  }

  for (const [title, routes] of titles) {
    assert(
      routes.length === 1,
      `Duplicate <title> across ${routes.length} routes ("${title}"): ${routes.slice(0, 4).join(", ")}`,
    );
  }
}

function validateSitemap() {
  const sitemapPath = resolve(distRoot, "sitemap.xml");
  if (!existsSync(sitemapPath)) {
    assert(false, "Missing dist/sitemap.xml");
    return null;
  }
  const sitemap = readFileSync(sitemapPath, "utf8");
  const listed = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url.replace(/\/$/, "")),
  );
  for (const route of SITEMAP_ROUTES) {
    assert(listed.has(urlFor(route)), `Sitemap is missing self-canonical route ${route}`);
  }
  // The consolidation only pays off if the variants actually leave the sitemap. Without this
  // assertion, generate-sitemap.mjs could quietly fall back to SEO_ROUTES and re-submit all 120
  // canonicalized URLs while every other check still passed.
  for (const route of PARAM_ROUTES) {
    assert(
      !listed.has(urlFor(route)),
      `Sitemap lists ${route}, which canonicalizes to ${canonicalPathFor(route)}`,
    );
  }
  // Each loc must appear exactly once — adding "/" to SEO_ROUTES is the kind of change that
  // can silently list the home twice (once bare, once with a trailing slash).
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  assert(
    locs.length === listed.size,
    `Sitemap has ${locs.length - listed.size} duplicate <loc> entries`,
  );
  for (const url of listed) {
    const route = url.replace(canonicalBase, "");
    assert(
      route === "" || SEO_ROUTES.includes(route),
      `Sitemap lists ${url} but no static output is generated for it`,
    );
  }
  return listed;
}

// Router <-> sitemap, both directions.
//
// Why: the Vue router and seo-routes.mjs are two hand-maintained lists of the same thing. Adding a
// calculator to the router and forgetting seo-routes.mjs costs nothing at build time — vite still
// bundles the view, the dev server still serves it, and the live SPA still renders it on a click.
// The page just never gets prerendered and never enters the sitemap, so it is invisible to a
// crawler while looking perfectly healthy to a human. Nothing here caught that; only counting the
// XML by hand did.
//
// Both directions are checked because each one alone passes a state that is worse than the bug it
// prevents. "Every router route must be listed" alone accepts a route turned into a redirect while
// its URL stays in the sitemap — submitting a URL whose canonical points elsewhere. "Every listed
// URL must be reachable" alone accepts a brand-new calculator that is simply missing everywhere.
function parseRouterRoutes(source) {
  const start = source.indexOf("const routes: RouteRecordRaw[]");
  assert(
    start !== -1,
    "router/index.ts: could not find `const routes: RouteRecordRaw[]` — route extraction failed",
  );
  if (start === -1) return [];

  const body = source.slice(start);
  const marks = [...body.matchAll(/path:\s*"([^"]+)"/g)].map((match) => ({
    // A TS string literal escapes its backslashes, so the source text "\\d+" is the value "\d+".
    path: match[1].replace(/\\\\/g, "\\"),
    index: match.index,
  }));
  // No fallback. A gate that silently inspects zero routes is worse than no gate at all: it prints
  // a reassuring pass line while checking nothing.
  assert(marks.length > 0, "router/index.ts: no `path:` declarations parsed — route extraction failed");

  return marks.map((mark, i) => ({
    path: mark.path,
    // Everything up to the next `path:` belongs to this record.
    redirect: /redirect:/.test(body.slice(mark.index, marks[i + 1]?.index ?? body.length)),
  }));
}

// A router path compiled to the set of URLs it can serve. Used only for the reachability
// direction, so it stays deliberately narrow: named params with an optional inline constraint.
function routePattern(path) {
  const source = path.replace(/:(\w+)(\(([^)]*)\))?/g, (_, __, ___, constraint) =>
    constraint ? `(?:${constraint})` : "[^/]+",
  );
  return new RegExp(`^${source}$`);
}

function validateRouterSitemapParity(listed) {
  if (!listed) return;
  const routerRoutes = parseRouterRoutes(
    readFileSync(resolve(projectRoot, "src", "router", "index.ts"), "utf8"),
  );
  if (routerRoutes.length === 0) return;

  assert(
    routerRoutes.some((route) => route.path === "/" && !route.redirect),
    "router/index.ts must register an index route that renders its own view",
  );

  for (const route of routerRoutes) {
    // Amount variants are declared as params (`/salary/:amount`). They are prerendered but
    // canonicalize into their base, so their absence from the sitemap is the intended state —
    // PARAM_ROUTES is already asserted separately above. Only concrete paths are checked here.
    if (route.path.includes(":")) continue;
    if (route.redirect) {
      assert(
        !listed.has(urlFor(route.path)),
        `Redirect route must not be listed in the sitemap: ${urlFor(route.path)}`,
      );
      continue;
    }
    assert(
      listed.has(urlFor(route.path)),
      `Router route is missing from the sitemap: ${urlFor(route.path)}`,
    );
  }

  // Reverse: a submitted URL the router cannot match renders NotFound once JS boots, so the
  // crawler is served prerendered content the visitor never sees.
  const matchers = routerRoutes
    // The catch-all exists to render NotFound; letting it match here would satisfy every URL.
    .filter((route) => !route.redirect && !/\(\.\*\)/.test(route.path))
    .map((route) => routePattern(route.path));
  for (const url of listed) {
    const path = url.replace(canonicalBase, "") || "/";
    assert(
      matchers.some((matcher) => matcher.test(path)),
      `Sitemap lists ${url} but no router route matches ${path} (it would render NotFound)`,
    );
  }
}

// Tailwind's slash-opacity modifier only emits a class when the number is on the opacity scale
// (5·10·20·25…). Write `bg-primary/8` and the build says nothing, no rule is generated, and the
// element simply has no background — it inherits whatever is behind it. A theme-less colour name
// (`bg-warning` where the token is `status.warning`) disappears the same silent way.
//
// This is not hypothetical here: the site header shipped as `bg-primary/8`, so its background was
// dead on every page and read as the page background. The neighbouring `border-primary/20` and
// `border-status-success/30` ARE on the scale and did render, which is exactly why nobody noticed
// — the boxes had their outline and just no fill.
function collectSourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, out);
    else if (/\.(vue|ts)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

function validateOpacityUtilitiesAreGenerated() {
  const cssDir = resolve(distRoot, "assets");
  if (!existsSync(cssDir)) {
    assert(false, "No built CSS directory to validate utilities against");
    return;
  }
  const cssFiles = readdirSync(cssDir).filter((name) => name.endsWith(".css"));
  assert(cssFiles.length > 0, "No built CSS found to validate utilities against");
  const css = cssFiles.map((name) => readFileSync(resolve(cssDir, name), "utf8")).join("\n");

  // Only colour utilities carrying a slash opacity. Widening this to layout utilities pulls in
  // runtime-composed class strings and the false positives swamp the signal.
  const utility =
    /(?:[a-z-]+:)*(?:bg|text|border|ring|divide|fill|stroke|outline|placeholder|from|via|to)-[a-z][a-z0-9-]*\/(?:\d+|\[[0-9.]+%?\])/g;
  const toSelector = (cls) => cls.replace(/[/[\]%.:]/g, (ch) => "\\" + ch);

  const missing = [];
  for (const file of collectSourceFiles(resolve(projectRoot, "src"))) {
    for (const cls of new Set(readFileSync(file, "utf8").match(utility) ?? [])) {
      if (css.includes("." + toSelector(cls))) continue;
      missing.push(`${cls}  (${file.slice(projectRoot.length + 1)})`);
    }
  }
  assert(
    missing.length === 0,
    "These opacity utilities generated no CSS — if the number is off Tailwind's opacity scale use " +
      "the arbitrary-value form (/[8%]), and check the colour name exists in the theme:\n  " +
      missing.join("\n  "),
  );
}

function validateNotFound() {
  const notFoundPath = resolve(distRoot, "404.html");
  if (!existsSync(notFoundPath)) {
    assert(false, "Missing custom 404.html");
    return;
  }
  const html = readFileSync(notFoundPath, "utf8");
  assert(
    /name="robots" content="noindex,nofollow"/.test(html),
    "404.html must be noindex,nofollow",
  );
  assert(html.includes('href="/finance"'), "404.html must contain a recovery link");
  // Ads on a contentless screen violate Google's Valuable Inventory policy. noindex keeps the
  // page out of the index but the policy judges the presence of the loader, not the indexing.
  assert(
    !/adsbygoogle|googlesyndication/i.test(html),
    "404.html must not load the AdSense script (Valuable Inventory policy)",
  );
}

validateVercelConfig();
validateRoutes();
validateRouterSitemapParity(validateSitemap());
validateOpacityUtilitiesAreGenerated();
validateNotFound();

if (failures.length > 0) {
  // 첫 실패에서 던지지 않고 모아서 보고한다 — 게이트를 새로 켤 때 결함이 몇 종인지 한 번에 봐야 한다.
  process.stderr.write(`\n[validate-static-output] ${failures.length}건 실패\n`);
  for (const message of failures.slice(0, 30)) process.stderr.write(`  - ${message}\n`);
  if (failures.length > 30) process.stderr.write(`  ... 외 ${failures.length - 30}건\n`);
  process.exit(1);
}

console.log(
  `Validated ${SEO_ROUTES.length} finance routes ` +
    `(${SITEMAP_ROUTES.length} sitemap + ${PARAM_ROUTES.length} canonicalized variants), ` +
    "sitemap, and 404 output.",
);
