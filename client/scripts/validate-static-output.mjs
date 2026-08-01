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
import { SEO_ROUTES } from "./seo-routes.mjs";

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

    assert(canonicalFrom(html) === canonicalBase + route, `Invalid canonical for ${route}`);

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
  for (const route of SEO_ROUTES) {
    assert(listed.has(canonicalBase + route), `Sitemap is missing prerendered route ${route}`);
  }
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

console.log(`Validated ${SEO_ROUTES.length} finance routes, sitemap, and 404 output.`);
