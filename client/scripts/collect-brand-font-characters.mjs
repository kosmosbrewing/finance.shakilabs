// 브랜드 폰트(GmarketSans) 문자셋 수집기 — docs/BRAND_FONT_SUBSET.md §3의 구현.
//
// 왜 소스 grep이 아니라 렌더 실측인가: .vue를 훑으면 주석의 한글까지 세어 과대 수집되고,
// 반대로 "히어로 숫자만 쓴다"고 가정해 41자로 자르면 h1이 글자 단위로 서체가 갈린다
// ('2026 원천세 계산기' → "계산기"만 Pretendard). 둘 다 겪은 뒤 남은 유일한 기준은
// **실제로 이 폰트가 그리는 문자만** 담는 것이고, 그건 렌더 결과에서만 알 수 있다.
//
// 수집 규칙
//   1. dist를 정적 서버로 띄우고 프리렌더된 라우트를 전부 연다.
//   2. 각 텍스트 노드의 부모 요소 computed fontFamily의 **첫 패밀리**가 브랜드 폰트인
//      것만 담는다(첫 패밀리가 아니면 그 폰트는 그 글자를 그리지 않는다). 요소가 아니라
//      텍스트 노드 단위로 보는 이유: 조상을 세면 자손 텍스트가 딸려 들어오고,
//      "리프 요소"만 세면 <h1>앞 <b>강조</b> 뒤</h1>의 "앞/뒤"를 놓친다.
//   3. JS 비활성 패스(크롤러가 보는 프리렌더 HTML)와 JS 활성 패스(하이드레이션 후 DOM)를
//      모두 돈다. 하이드레이션이 프리렌더 블록을 제거하므로 한 패스로는 절반만 보인다.
//
// 산출물: scripts/brand-font-characters.json — 서브셋 문자셋의 정본(config가 이걸 읽는다).
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_ROUTES } from "./seo-routes.mjs";
import { BRAND_FONT_FAMILY, NUMERAL_CHARACTERS } from "./font-subset-config.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const distRoot = resolve(scriptRoot, "..", "dist");
const charactersPath = resolve(scriptRoot, "brand-font-characters.json");
const BASE_PREFIX = "/finance";
// 원문 전수를 남겨, 문자셋이 아니라 **렌더된 텍스트**를 기준으로 fontTools cmap과
// 대조할 수 있게 한다(같은 코드가 만든 집합끼리 비교하면 그건 항등식이다).
const textDumpPath = process.env.BRAND_FONT_TEXT_DUMP ?? "";
const CONCURRENCY = 6;

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
  // localhost 전용이지만 dist 밖 경로는 여전히 막는다.
  if (candidate !== distRoot && !candidate.startsWith(distRoot + sep)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;

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
  return new Promise((ready) => server.listen(0, "127.0.0.1", () => ready(server)));
}

// 페이지 안에서 실행된다. 첫 패밀리가 brandFamily인 텍스트 노드만 돌려준다.
function collectInPage(brandFamily) {
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEMPLATE", "TITLE", "HEAD"]);
  const hits = [];
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    if (!text.trim()) continue;
    const element = node.parentElement;
    if (!element || SKIP_TAGS.has(element.tagName)) continue;
    const first = getComputedStyle(element).fontFamily.split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (first !== brandFamily) continue;
    const className = typeof element.className === "string" ? element.className : "";
    hits.push({ tag: element.tagName.toLowerCase(), className, text });
  }
  return hits;
}

async function collectRoute(context, origin, route, hydrated) {
  const page = await context.newPage();
  try {
    await page.goto(`${origin}${BASE_PREFIX}${route === "/" ? "" : route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (hydrated) {
      // 마운트 전에 읽으면 프리렌더 사본을 읽는다 — 목표는 하이드레이션 후 DOM이다.
      await page
        .waitForFunction(() => (document.querySelector("#app")?.children.length ?? 0) > 0, undefined, {
          timeout: 20000,
        })
        .catch(() => {});
      // 웹폰트 로드 완료를 기다려야 폴백 폰트 스택이 아니라 최종 스택을 읽는다.
      await page.evaluate(() => document.fonts.ready).catch(() => {});
    }
    return await page.evaluate(collectInPage, BRAND_FONT_FAMILY);
  } finally {
    await page.close();
  }
}

const server = await startServer();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();

const sources = new Map(); // "tag.class" -> 샘플 텍스트
const characters = new Set();
const rawTexts = []; // BRAND_FONT_TEXT_DUMP=경로 일 때만 쓴다(문자셋 유도 과정을 외부 검증하기 위해)
let hitCount = 0;

function absorb(hits) {
  for (const hit of hits) {
    hitCount += 1;
    if (textDumpPath) rawTexts.push(hit.text);
    const key = `${hit.tag}${hit.className ? `.${hit.className.trim().split(/\s+/).join(".")}` : ""}`;
    // 샘플은 사전순으로 가장 앞선 것 하나로 고정한다 — "먼저 본 것"으로 두면 라우트를
    // 병렬로 도는 순서에 따라 값이 흔들려, 문자셋이 그대로인데도 커밋 디프가 생긴다.
    const sample = hit.text.trim().slice(0, 40);
    if (!sources.has(key) || sample < sources.get(key)) sources.set(key, sample);
    // 줄바꿈·탭은 렌더되면 공백이다. 공백 자체는 문자셋에 포함한다(단어 사이 커닝).
    for (const character of hit.text.replace(/\s+/g, " ")) {
      if (character.codePointAt(0) >= 0x20) characters.add(character);
    }
  }
}

try {
  for (const hydrated of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      javaScriptEnabled: hydrated,
      serviceWorkers: "block",
    });
    // 서드파티(분석·광고 스크립트)는 이 수집의 결과를 좌우해선 안 된다.
    await context.route("**", (route) =>
      route.request().url().startsWith(origin) ? route.continue() : route.abort(),
    );
    const queue = [...SEO_ROUTES];
    let done = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        for (let route = queue.shift(); route; route = queue.shift()) {
          absorb(await collectRoute(context, origin, route, hydrated));
          done += 1;
        }
      }),
    );
    console.log(`  ${hydrated ? "hydrated" : "prerender"} pass: ${done} routes`);
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

for (const character of NUMERAL_CHARACTERS) characters.add(character);
const charset = [...characters].sort().join("");

writeFileSync(
  charactersPath,
  `${JSON.stringify(
    {
      schemaVersion: 1,
      family: BRAND_FONT_FAMILY,
      routes: SEO_ROUTES.length,
      characterCount: [...charset].length,
      characters: charset,
      // 어떤 셀렉터가 이 폰트를 쓰는지 남긴다 — h1만 있다고 가정하면 다음 사람이 또 틀린다.
      sources: [...sources.entries()].sort().map(([selector, sample]) => ({ selector, sample })),
    },
    null,
    2,
  )}\n`,
);

if (textDumpPath) writeFileSync(textDumpPath, `${JSON.stringify(rawTexts)}\n`);

console.log(`Collected ${[...charset].length} characters from ${hitCount} brand-font text nodes.`);
for (const [selector, sample] of [...sources.entries()].sort()) {
  console.log(`  ${selector}  —  ${sample}`);
}
