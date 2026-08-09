// 정적 산출물 게이트 — 프리렌더 결과가 배포 가능한 상태인지 빌드 중에 검증한다.
//
// 왜 생겼나: 02.finance는 156라우트를 프리렌더하면서 이 게이트가 없었고, 그 결과
//   (a) 가이드 4페이지가 /finance 접두어 없는 내부 링크 21개를 렌더해 크롤러가 404를 만났고
//   (b) 157페이지 전부가 셸 <noscript>를 남겨 h1이 2개였다.
// 두 결함 모두 04.card의 게이트가 이미 검사하던 항목이라, 코드가 아니라 게이트 부재가 원인이다.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEO_ROUTES,
  SITEMAP_ROUTES,
  PARAM_ROUTES,
  canonicalPathFor,
} from "./seo-routes.mjs";
import { HUB_ROUTES } from "./hub-content.mjs";

// Body-text floors. Measured on the page's own content: the shared header and footer are stripped
// first, because counting the chrome makes every page look ~700 characters richer than it is and
// hides exactly the thin pages this gate exists to catch.
//
// MIN: no prerendered route may ship a stub. /freelancer/:amount used to render a heading and one
// link (67 characters) while still returning 200.
// HUB_MIN: the base calculators absorb their variants' canonical, so they have to be the
// substantial page of the family, not a shell the variants point at.
const MIN_BODY_CHARS = 250;
const HUB_MIN_BODY_CHARS = 1500;

// /salary and /insurance are hubs too — they predate hub-content.mjs and still render through
// LANDING_CONTENT, so they are not in HUB_ROUTES and have to be named here.
const HUB_BODY_ROUTES = [...HUB_ROUTES, "/salary", "/insurance"];

function bodyTextLength(html) {
  const appRoot = html.indexOf('<div id="app"></div>');
  let body = appRoot >= 0 ? html.slice(appRoot) : html;
  body = body.replace(/<header data-seo-prerender[\s\S]*?<\/header>/i, "");
  body = body.replace(/<footer data-seo-prerender[\s\S]*?<\/footer>/i, "");
  body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  return body
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length;
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
    const floor = HUB_BODY_ROUTES.includes(route) ? HUB_MIN_BODY_CHARS : MIN_BODY_CHARS;
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
    return;
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
}

validateVercelConfig();
validateRoutes();
validateSitemap();
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
