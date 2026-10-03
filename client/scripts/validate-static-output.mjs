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
  CALCULATOR_ROUTES,
  canonicalPathFor,
} from "./seo-routes.mjs";
import {
  APP_NAME,
  APP_NAME_ROUTES,
  BRAND_SUFFIX,
  PAGE_TITLES,
  PAGE_TITLE_MAX_CHARS,
  brandTitle,
} from "./page-titles.mjs";
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

// 라우트 -> dist 출력 파일 (프리렌더와 같은 규칙: cleanUrls 디렉터리 + index.html)
function outputPathForRoute(route) {
  return route === "/"
    ? resolve(distRoot, "index.html")
    : resolve(distRoot, route.slice(1), "index.html");
}
// 정적 HTML의 모든 표가 가로 스크롤 래퍼 안에 있어야 한다.
// 브라우저 게이트(verify-mobile-overflow)는 하이드레이션 뒤 화면만 본다 — 크롤러가 받는
// 원시 HTML은 아무도 안 보고 있었다. 이건 파일만 읽어서 결정적으로 판정하니 빌드에 둔다.
function validateTableScrollWrappers() {
  const wrapperOpen = /<div data-table-scroll\b/gi;
  for (const route of SEO_ROUTES) {
    const html = readFileSync(outputPathForRoute(route), "utf8");
    const tables = (html.match(/<table\b/gi) ?? []).length;
    if (tables === 0) continue;
    const wrappers = (html.match(wrapperOpen) ?? []).length;
    assert(
      wrappers === tables,
      `${route}: ${tables}개 표 중 ${wrappers}개만 가로 스크롤 래퍼 안에 있다`,
    );
  }
}

// 렌더 문단(<p>) 250자 상한 게이트(v8b 결함 수정, 2026-10-03).
//
// 왜: 전수 스캔에서 39개 사이트맵 페이지 중 25개가 250자를 넘는 <p>를 하나 이상 갖고 있었다
// (최장 437자, /guide/job-change). 단일 소스(scripts/paragraph-chunks.mjs의
// ensureParagraphLength)를 hub-content.mjs·hub-digests-tools.mjs·hub-digests.mjs의 렌더러
// 네 곳과 guide-content.mjs의 손글씨 HTML 한 곳에 연결해 고쳤다 — 이 게이트는 그 수정이
// 되돌아가거나 새 긴 문단이 들어오면 빌드를 실패시킨다.
//
// 약관(/terms)·개인정보(/privacy)는 법률 문서라 제외한다(브리프 공통 규칙).
const PARAGRAPH_LENGTH_LIMIT = 250;
const PARAGRAPH_EXCLUDE_ROUTES = new Set(["/terms", "/privacy"]);
// Ledger, not mute list(verify-hydration-survival.mjs의 KNOWN_BELOW_FLOOR와 같은 패턴):
// /eitc의 "단독·홑벌이·맞벌이 한계 부담" 비교 문장은 세 유형을 한 문장 안에 쉼표로 나열하고
// "…28.72%입니다."에서만 끝난다 — 문장 경계("다."/"요.")가 그 한 곳뿐이라 v8b 규칙(문장
// 경계에서만 분할)으로는 254자보다 더 줄일 수 없다. 유형 하나를 지우면 세 유형 비교가 깨지므로
// 삭제 대상도 아니다. 이 값이 더 커지면 실패하고, 250 이하로 내려오면 이 줄을 지워야 한다.
const KNOWN_OVER_LIMIT = {
  "/eitc": 254,
};

function longestParagraph(html) {
  let max = 0;
  for (const match of html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > max) max = text.length;
  }
  return max;
}

function validateParagraphLength() {
  for (const route of SEO_ROUTES) {
    if (PARAGRAPH_EXCLUDE_ROUTES.has(route)) continue;
    const path = outputPathForRoute(route);
    if (!existsSync(path)) continue;
    const max = longestParagraph(readFileSync(path, "utf8"));
    const limit = KNOWN_OVER_LIMIT[route] ?? PARAGRAPH_LENGTH_LIMIT;
    assert(
      max <= limit,
      `${route}: longest <p> is ${max} chars (limit ${limit}) — split at a sentence boundary ` +
        "(다./요. + space) via ensureParagraphLength, do not delete sentences or change numbers",
    );
  }
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

function collectCssFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) collectCssFiles(full, out);
    else if (entry.name.endsWith(".css")) out.push(full);
  }
  return out;
}

// @media 블록의 내용만 뽑아낸다(중첩 { }를 직접 세어서) — 미디어 쿼리 밖의 !important
// 규칙(현재는 없음)과 안쪽 규칙을 구분해야 "media rule" 범위를 정확히 지킨다.
function extractMediaBlockBodies(css) {
  const bodies = [];
  const opener = /@media[^{]*\{/g;
  let match;
  while ((match = opener.exec(css))) {
    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    bodies.push(css.slice(start, i - 1));
    opener.lastIndex = i;
  }
  return bodies;
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

// 11px 보조 글자 재발 방지 게이트(v8 결함 수정, 2026-10-03).
//
// 왜 소스를 보나(빌드 CSS·HTML이 아니라): /comprehensive-tax·/freelancer의 업종 주석,
// /guide/*의 단계 설명·"N단계 · ", /all의 항목 설명은 모두 하이드레이션 뒤에만 DOM에
// 들어오는 계산기 UI 안쪽 글자다. 이 앱의 크롤러용 정적 스냅샷(data-seo-prerender)은
// 인라인 style로 구워 낸 별도 SEO 문단이라 Tailwind 클래스를 아예 안 쓴다 — 그래서
// dist의 HTML·CSS를 대조해서는 이 결함을 재현도 재검증도 못 한다. 실제 방문자가 보는
// 글자 크기는 소스의 tailwind.config.ts 토큰과 text-[...] 화살표 값이 전부이므로,
// validateOpacityUtilitiesAreGenerated와 같은 방식으로 소스를 직접 스캔한다.
//
// 1) tiny 토큰(.text-tiny)이 다시 13px 밑으로 내려가면 실패 — 18곳이 넘는 호출부가
//    공유하는 소스라 토큰 하나가 전체를 되돌릴 수 있다.
// 2) text-[Npx]/text-[N.Mrem] 화살표 유틸은 전부 12px 이상이어야 하고, 12px대는
//    src/components/result-visualization/(차트 전용 디렉터리) 밖에서 쓰이면 실패 —
//    v8 공통 규칙 "13px 미만 글자(차트 범례 12px 제외)"를 디렉터리 경계로 집행한다.
//    .text-xs(Tailwind 기본 유틸)는 이 결함과 다른 토큰 계열이라 범위 밖이다.
// 3) src/**/*.css의 @media 규칙 안 !important font-size가 13px 밑이면 실패 — 2026-10-03
//    추가. responsive-accessibility.css의 "@media (max-width:400px)" 바닥이
//    `.text-caption, .text-tiny, .text-xs, ...` 전부를 12px !important로 눌러서,
//    (1)에서 토큰을 13px로 고쳐도 360~400px 폭(네이버 트래픽 다수가 쓰는 갤럭시 폭)
//    에서는 이 !important가 다시 12px로 덮어 고친 게 무효화됐다 — 토큰과 바닥을 같이
//    봐야 한다. `.retro-details-chevron`(접기 화살표 글리프, 본문 글자 아님)만 예외.
function validateNoTinyTextUtilities() {
  const tailwindConfigPath = resolve(projectRoot, "tailwind.config.ts");
  const tailwindConfig = readFileSync(tailwindConfigPath, "utf8");
  const tinyMatch = tailwindConfig.match(/tiny:\s*\[\s*"([0-9.]+)rem"/);
  assert(tinyMatch !== null, "tailwind.config.ts: could not find the `tiny` fontSize token");
  if (tinyMatch) {
    const tinyPx = Number.parseFloat(tinyMatch[1]) * 16;
    assert(
      tinyPx >= 13,
      `tailwind.config.ts: fontSize.tiny is ${tinyMatch[1]}rem (${tinyPx}px) — must stay >= 13px. ` +
        "This is the token behind /comprehensive-tax·/freelancer's industry note, /guide/* step " +
        "descriptions, and /all's item descriptions.",
    );
  }

  const chartDir = resolve(projectRoot, "src", "components", "result-visualization");
  const arbitraryPattern = /text-\[([0-9.]+)(px|rem)\]/g;
  const offenders = [];
  for (const file of collectSourceFiles(resolve(projectRoot, "src"))) {
    const isChartFile = file === chartDir || file.startsWith(chartDir + "/");
    for (const match of readFileSync(file, "utf8").matchAll(arbitraryPattern)) {
      const [, rawValue, unit] = match;
      const px = unit === "rem" ? Number.parseFloat(rawValue) * 16 : Number.parseFloat(rawValue);
      if (px >= 13) continue;
      if (px >= 12 && isChartFile) continue;
      offenders.push(
        `${file.slice(projectRoot.length + 1)}: text-[${rawValue}${unit}] = ${px}px` +
          (px < 12
            ? " (below the 12px chart-legend floor)"
            : " (12px is only allowed inside src/components/result-visualization/)"),
      );
    }
  }
  // (3) CSS 소스의 @media !important 바닥.
  const chevronException = new Set([".retro-details-chevron"]);
  const ruleWithinMedia = /([^{}]+)\{([^{}]*)\}/g;
  for (const file of collectCssFiles(resolve(projectRoot, "src"))) {
    // 주석을 먼저 지운다 — 안 지우면 셀렉터 바로 위 줄의 /* ... */ 설명이 "셀렉터"
    // 캡처에 섞여 들어와 .retro-details-chevron처럼 정확히 비교해야 하는 예외가 안 걸린다.
    const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const body of extractMediaBlockBodies(css)) {
      for (const match of body.matchAll(ruleWithinMedia)) {
        const [, selectorList, ruleBody] = match;
        if (!/!important/.test(ruleBody)) continue;
        const sizeMatch = ruleBody.match(/font-size:\s*([0-9.]+)(px|rem)\s*!important/);
        if (!sizeMatch) continue;
        const px =
          sizeMatch[2] === "rem"
            ? Number.parseFloat(sizeMatch[1]) * 16
            : Number.parseFloat(sizeMatch[1]);
        if (px >= 13) continue;
        for (const selector of selectorList.split(",").map((s) => s.trim())) {
          if (chevronException.has(selector)) continue;
          offenders.push(
            `${file.slice(projectRoot.length + 1)}: ${selector} { font-size: ${sizeMatch[1]}${sizeMatch[2]} !important } = ${px}px (media rule)`,
          );
        }
      }
    }
  }

  assert(
    offenders.length === 0,
    "Sub-13px text utilities found (chart visualizations may use exactly 12px):\n  " +
      offenders.join("\n  "),
  );
}

// 빌드 CSS 전체 스캔(v8c 결함 수정, 2026-10-03).
//
// 왜: validateNoTinyTextUtilities는 소스의 Tailwind 유틸리티(.text-tiny, text-[Npx])만 본다.
// `.eyebrow`(main.css, font-size:0.7rem=11.2px, STEP 1/2/3 배지·AboutView 날짜 라벨에 쓰임)는
// 일반 CSS 클래스라 그 스캔의 사각지대였다 — getComputedStyle 실측(360·1280px)으로 11.2px가
// 드러난 뒤에야 찾았다. 빌드된 CSS는 출처(Tailwind 유틸·일반 클래스·@shakilabs/ui 패키지)를
// 가리지 않고 전부 한 파일에 모이므로, 여기서 한 번 더 보면 이런 사각지대가 다시 안 생긴다.
//
// 허용: 차트 전용(.text-\[12px\], result-visualization 디렉터리 — 소스 스캔이 이미 집행),
// .retro-details-chevron(글리프), .text-xs(Tailwind 기본 유틸 — 별도 토큰 계열, 사용자 결정
// 대기), .sh-*(@shakilabs/ui 패키지 전체 — 이 웨이브 범위 밖, 0.3.43 백로그). 그 외 13px
// 미만 font-size가 하나라도 남으면 실패한다.
function validateBuiltCssFontSizes() {
  const cssDir = resolve(distRoot, "assets");
  if (!existsSync(cssDir)) {
    assert(false, "No built CSS directory to validate font sizes against");
    return;
  }
  const cssFiles = readdirSync(cssDir).filter((name) => name.endsWith(".css"));
  assert(cssFiles.length > 0, "No built CSS found to validate font sizes against");
  const css = cssFiles.map((name) => readFileSync(resolve(cssDir, name), "utf8")).join("\n");

  const allowedExact = new Set([".text-\\[12px\\]", ".retro-details-chevron", ".text-xs"]);
  const offenders = [];
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const [, selectorList, body] = match;
    // !important 규칙은 responsive-accessibility.css의 ≤400px 정규화(이미 13px 이상)다.
    if (/!important/.test(body)) continue;
    const sizeMatch = body.match(/font-size:\s*([0-9.]+)(px|rem)/);
    if (!sizeMatch) continue;
    const px =
      sizeMatch[2] === "rem" ? Number.parseFloat(sizeMatch[1]) * 16 : Number.parseFloat(sizeMatch[1]);
    if (px >= 13) continue;
    for (const selector of selectorList.split(",").map((s) => s.trim())) {
      if (allowedExact.has(selector)) continue;
      if (selector.startsWith(".sh-")) continue;
      offenders.push(`${selector} { font-size: ${sizeMatch[1]}${sizeMatch[2]} } = ${px}px`);
    }
  }
  assert(
    offenders.length === 0,
    "13px 미만 font-size가 빌드 CSS에 남아 있다(.sh-* 패키지·text-xs·차트 예외 제외):\n  " +
      offenders.join("\n  "),
  );
}

// llms.txt <-> sitemap.
//
// Why: llms.txt is the one shipped file that states, in plain text, how many calculators this site
// has. It said "23개 계산기" twice for three weeks after the 24th, 25th and 26th shipped, and it
// listed 23 URLs. Nothing failed, because no gate had ever read it.
//
// Both halves are checked. The count alone would pass a file that names the right number of wrong
// URLs; the URL list alone would pass a file that lists 26 URLs under the sentence "23개 계산기".
// The generator derives both from the same array, so this is the assertion that the generator
// actually ran and that its output reached dist.
function validateLlmsTxt() {
  const llmsPath = resolve(distRoot, "llms.txt");
  if (!existsSync(llmsPath)) {
    assert(false, "Missing dist/llms.txt");
    return;
  }
  const llms = readFileSync(llmsPath, "utf8");

  const counts = [...llms.matchAll(/(\d+)개 계산기/g)].map(([, value]) => Number(value));
  assert(counts.length > 0, "llms.txt states no calculator count");
  for (const stated of new Set(counts)) {
    assert(
      stated === CALCULATOR_ROUTES.length,
      `llms.txt claims ${stated}개 계산기 but the sitemap has ${CALCULATOR_ROUTES.length}`,
    );
  }

  // Only the calculator links: the hub, guides and policy pages may or may not be listed, but a
  // calculator URL that is missing (or one that no longer exists) is a factual error about the
  // site's own contents.
  const listed = new Set(
    [...llms.matchAll(/https:\/\/shakilabs\.com\/finance(\/[a-z0-9-]+)/g)].map(([, route]) => route),
  );
  for (const route of CALCULATOR_ROUTES) {
    assert(listed.has(route), `llms.txt is missing calculator ${route}`);
  }
  const routeSet = new Set(SEO_ROUTES);
  for (const route of listed) {
    assert(routeSet.has(route), `llms.txt links ${route}, which is not a route of this app`);
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
  // Ads on a contentless screen violate Google's Valuable Inventory policy. noindex keeps the
  // page out of the index but the policy judges the presence of the loader, not the indexing.
  assert(
    !/adsbygoogle|googlesyndication/i.test(html),
    "404.html must not load the AdSense script (Valuable Inventory policy)",
  );
  assert(
    !/kakaocdn\.net\/kas|kakao_ad_area/i.test(html),
    "404.html must not load the AdFit script either (same policy, other network)",
  );
}

// One provider at a time, and the page has to say which one.
//
// Two ways this drifts, both of them shipped-and-silent:
//   1. Both loaders end up on the page. AdFit policy 5.2 forbids another
//      network's script running alongside it; AdSense judges ad-to-content
//      ratio. Nothing in the browser complains - the page just breaks a rule.
//   2. The provider flips to AdFit and /privacy still tells readers that Google
//      AdSense is the only third party receiving their cookie identifiers.
//      That is a false statement about personal data, not a stale sentence.
function validateAdProvider() {
  const provider = (process.env.VITE_AD_PROVIDER ?? "adsense").trim().toLowerCase();
  const shell = readFileSync(resolve(distRoot, "index.html"), "utf8");
  const hasAdsense = /googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(shell);
  const hasAdfit = /kakaocdn\.net\/kas\/static\/ba\.min\.js/i.test(shell);

  assert(
    !(hasAdsense && hasAdfit),
    "index.html carries both ad loaders; only one network may run at a time",
  );

  if (provider === "adsense") {
    assert(hasAdsense, "VITE_AD_PROVIDER=adsense but index.html has no AdSense loader");
    assert(!hasAdfit, "VITE_AD_PROVIDER=adsense but index.html carries the AdFit loader");
  } else if (provider === "adfit") {
    assert(hasAdfit, "VITE_AD_PROVIDER=adfit but index.html has no AdFit loader");
    assert(!hasAdsense, "VITE_AD_PROVIDER=adfit but index.html still carries the AdSense loader");
  } else {
    assert(!hasAdsense && !hasAdfit, `VITE_AD_PROVIDER=${provider} but an ad loader is still shipped`);
  }

  // The disclosure has to name the network that is actually running.
  const privacyPath = resolve(distRoot, "privacy", "index.html");
  if (!existsSync(privacyPath)) return;
  const privacy = readFileSync(privacyPath, "utf8");

  if (provider === "adfit") {
    assert(
      /애드핏|AdFit|카카오/.test(privacy),
      "/privacy names no Kakao/AdFit third party while AdFit is the active network",
    );
  }
  if (provider === "none") {
    return;
  }
  if (provider === "adsense") {
    assert(
      /AdSense|애드센스/.test(privacy),
      "/privacy must keep naming Google AdSense while AdSense is the active network",
    );
  }
}

// 제목 레시피 게이트(함대 공통, 2026-10-03).
//  - 계산기·가이드: `<페이지 제목> | ShakiLabs`, 홈: `<앱 이름> | ShakiLabs`,
//    허브·정책·404: `<페이지 제목> · <앱 이름> | ShakiLabs`
//  - 페이지 제목 40자 이하 — 네이버가 약 35자에서 자르므로 길면 브랜드·핵심 구절이 잘린다
//  - <title> 태그는 문서 전체에서 정확히 1개 — 차트 SVG <title>이 네이버에 "title 요소 2개 이상"(61페이지)으로
//    잡힌 적이 있다. 셀 때는 `<title`로 세어 SVG 안의 것도 잡는다
//  - page-titles.mjs에 있는 라우트는 산출물 제목이 그 값과 같아야 한다(뷰·라우터와 같은 소스라는 보증)
function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function checkTitleRecipe(label, route, html) {
  const titleTags = (html.match(/<title\b/gi) ?? []).length;
  assert(titleTags === 1, `${label}: expected exactly one <title, found ${titleTags}`);

  const raw = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (raw === undefined) return;
  const title = decodeEntities(raw);
  assert(title.endsWith(BRAND_SUFFIX), `${label}: title must end with "${BRAND_SUFFIX}": ${title}`);
  const page = title.slice(0, -BRAND_SUFFIX.length);
  assert(!page.includes("|"), `${label}: title has a middle "|" segment: ${title}`);

  const appSuffix = ` · ${APP_NAME}`;
  let head = page;
  if (route === "/") {
    assert(page === APP_NAME, `${label}: home title must be "${APP_NAME}${BRAND_SUFFIX}": ${title}`);
  } else if (APP_NAME_ROUTES.includes(route)) {
    assert(page.endsWith(appSuffix), `${label}: hub/policy title must end with "${appSuffix}": ${title}`);
    head = page.slice(0, -appSuffix.length);
  } else {
    assert(!page.includes(APP_NAME), `${label}: calculator title must not carry the app name: ${title}`);
  }
  assert(
    head.length <= PAGE_TITLE_MAX_CHARS,
    `${label}: page title is ${head.length} chars (max ${PAGE_TITLE_MAX_CHARS}): ${head}`,
  );

  const expected = PAGE_TITLES[route];
  if (expected !== undefined) {
    assert(title === brandTitle(expected), `${label}: title drifted from page-titles.mjs: ${title}`);
  }

  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  assert(description.trim().length > 0, `${label}: missing meta description`);
  for (const property of ["og:title", "twitter:title"]) {
    const attribute = property.startsWith("og:") ? "property" : "name";
    const value = html.match(new RegExp(`<meta ${attribute}="${property}" content="([^"]*)"`))?.[1];
    assert(
      value !== undefined && decodeEntities(value) === title,
      `${label}: ${property} must equal <title>`,
    );
  }
}

function validateTitleRecipe() {
  for (const route of SEO_ROUTES) {
    const path = outputPathForRoute(route);
    if (!existsSync(path)) continue;
    checkTitleRecipe(route, route, readFileSync(path, "utf8"));
  }
  const notFoundPath = resolve(distRoot, "404.html");
  if (existsSync(notFoundPath)) {
    checkTitleRecipe("404.html", "/404", readFileSync(notFoundPath, "utf8"));
  }
}

validateVercelConfig();
validateRoutes();
validateTitleRecipe();
validateRouterSitemapParity(validateSitemap());
validateLlmsTxt();
validateOpacityUtilitiesAreGenerated();
validateNoTinyTextUtilities();
validateBuiltCssFontSizes();
validateNotFound();
validateAdProvider();
validateTableScrollWrappers();
validateParagraphLength();

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
