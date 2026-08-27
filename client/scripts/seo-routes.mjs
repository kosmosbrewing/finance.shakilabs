// 프리렌더 대상 라우트
// 건보료 축: GA 유입 1위 축이라 1만원 단위로 촘촘히 커버 (인접 구간 비교표가 페이지별 고유 해석 제공)
export const INSURANCE_AMOUNTS = [
  50_000,
  60_000,
  70_000,
  80_000,
  90_000,
  100_000,
  110_000,
  120_000,
  130_000,
  140_000,
  150_000,
  160_000,
  170_000,
  180_000,
  190_000,
  200_000,
  210_000,
  220_000,
  230_000,
  240_000,
  250_000,
  260_000,
  270_000,
  280_000,
  300_000,
  320_000,
  350_000,
  380_000,
  400_000,
  450_000,
  500_000,
];

// 임금체불 지연이자 프리셋 (만원) — 본문이 금액×기간×이율단계 표로 고유성 확보
export const UNPAID_WAGE_AMOUNTS = [100, 300, 500, 1000, 2000, 3000];

// 근로장려금 가구유형 프리셋 — 유형별 지급표가 완전히 달라 고유성 확보
export const EITC_HOUSEHOLDS = ["single", "single-income", "double-income"];

export const SALARY_AMOUNTS = [
  2000,
  2500,
  3000,
  3500,
  4000,
  4500,
  5000,
  5500,
  6000,
  7000,
  8000,
  9000,
  10000,
  12000,
  15000,
  20000,
  30000,
  50000,
];

export const COMPREHENSIVE_TAX_AMOUNTS = [
  1000,
  2000,
  3000,
  4000,
  5000,
  6000,
  8000,
  10000,
  15000,
  20000,
];

export const FREELANCER_AMOUNTS = [2000, 3000, 4000, 5000, 8000, 10000];

export const COMPARE_PAIRS = [
  [3000, 5000],
  [3000, 4000],
  [4000, 5000],
  [4000, 6000],
  [5000, 6000],
  [6000, 7000],
  [7000, 8000],
  [8000, 10000],
];

export const QUIT_YEARS = [1, 3, 5, 10];

export const WITHHOLDING_AMOUNTS = [
  30_000, 50_000, 100_000, 150_000, 200_000, 300_000, 500_000,
];

export const YEAR_END_AMOUNTS = [3000, 4500, 5200, 6000, 7500, 10000];

export const PARENTAL_LEAVE_AMOUNTS = [250, 300, 350, 400, 450, 500];

export const UNEMPLOYMENT_AMOUNTS = [250, 350, 500];
export const REGIONAL_HEALTH_AMOUNTS = [250, 350, 500];

export const WEEKLY_HOLIDAY_PAY_AMOUNTS = [10320, 11000, 12000, 15000];
export const WAGE_CONVERTER_AMOUNTS = [10320, 12000, 15000, 20000];
export const SEVERANCE_PAY_AMOUNTS = [1, 3, 5, 10];

// Doorway-variant consolidation (AdSense "low value content" remediation).
//
// Every family below was compared pair-by-pair on the tag-stripped prerendered body and came
// back above 0.90 similarity — /parental-leave and /unemployment peaked at 0.997, i.e. the only
// thing that differs between two URLs is the amount substituted into the same sentences. That
// is a doorway set, and no amount of padding fixes it, so the variants canonicalize into their
// base calculator instead: ranking signals merge into one page rather than splitting 120 ways.
//
// Deliberately NOT here: /eitc/:household. Household type changes the statutory income ceiling
// and the maximum payout, so each variant reaches a genuinely different conclusion and keeps
// its own place in the index.
//
// This is reversible. If a family later grows body content that actually diverges per URL,
// delete it from this list — the route returns to the sitemap and becomes self-canonical again
// with no other change, because the sitemap and the canonical tag both derive from this array.
export const PARAM_ROUTES = [
  ...INSURANCE_AMOUNTS.map((amount) => `/insurance/${amount}`),
  ...SALARY_AMOUNTS.map((amount) => `/salary/${amount}`),
  ...COMPREHENSIVE_TAX_AMOUNTS.map((amount) => `/comprehensive-tax/${amount}`),
  ...COMPARE_PAIRS.map(([a, b]) => `/compare/${a}-vs-${b}`),
  ...WITHHOLDING_AMOUNTS.map((amount) => `/withholding/${amount}`),
  ...YEAR_END_AMOUNTS.map((amount) => `/year-end-settlement/${amount}`),
  ...PARENTAL_LEAVE_AMOUNTS.map((amount) => `/parental-leave/${amount}`),
  ...UNPAID_WAGE_AMOUNTS.map((amount) => `/unpaid-wage/${amount}`),
  ...FREELANCER_AMOUNTS.map((amount) => `/freelancer/${amount}`),
  ...QUIT_YEARS.map((years) => `/quit/${years}years`),
  ...SEVERANCE_PAY_AMOUNTS.map((amount) => `/severance-pay/${amount}`),
  ...WEEKLY_HOLIDAY_PAY_AMOUNTS.map((amount) => `/weekly-holiday-pay/${amount}`),
  ...WAGE_CONVERTER_AMOUNTS.map((amount) => `/wage-converter/${amount}`),
  ...REGIONAL_HEALTH_AMOUNTS.map((amount) => `/regional-health/${amount}`),
  ...UNEMPLOYMENT_AMOUNTS.map((amount) => `/unemployment/${amount}`),
];

const PARAM_ROUTE_SET = new Set(PARAM_ROUTES);

export const SEO_ROUTES = [
  // The app home. prerender.mjs already routed "/" to dist/index.html, but the route was
  // never listed here, so the home shipped as an empty shell with no body and no footer links.
  "/",
  "/insurance",
  "/salary",
  "/raise",
  "/bonus",
  "/annual-leave",
  "/overtime",
  "/pension",
  "/monthly-rent-deduction",
  "/irp",
  "/4-insurance-employer",
  "/comprehensive-tax",
  "/freelancer",
  ...FREELANCER_AMOUNTS.map((amount) => `/freelancer/${amount}`),
  "/freelance-rate",
  "/compare",
  "/quit",
  "/all",
  "/guide/resignation",
  "/guide/job-change",
  "/guide/year-end",
  "/guide/part-time",
  "/about",
  "/terms",
  "/privacy",
  ...INSURANCE_AMOUNTS.map((amount) => `/insurance/${amount}`),
  ...SALARY_AMOUNTS.map((amount) => `/salary/${amount}`),
  ...COMPREHENSIVE_TAX_AMOUNTS.map((amount) => `/comprehensive-tax/${amount}`),
  ...COMPARE_PAIRS.map(([a, b]) => `/compare/${a}-vs-${b}`),
  ...QUIT_YEARS.map((years) => `/quit/${years}years`),
  "/withholding",
  ...WITHHOLDING_AMOUNTS.map((amount) => `/withholding/${amount}`),
  "/year-end-settlement",
  ...YEAR_END_AMOUNTS.map((amount) => `/year-end-settlement/${amount}`),
  "/parental-leave",
  ...PARENTAL_LEAVE_AMOUNTS.map((amount) => `/parental-leave/${amount}`),
  "/unemployment",
  ...UNEMPLOYMENT_AMOUNTS.map((amount) => `/unemployment/${amount}`),
  "/regional-health",
  ...REGIONAL_HEALTH_AMOUNTS.map((amount) => `/regional-health/${amount}`),
  "/dependent",
  "/unpaid-wage",
  ...UNPAID_WAGE_AMOUNTS.map((amount) => `/unpaid-wage/${amount}`),
  "/eitc",
  ...EITC_HOUSEHOLDS.map((slug) => `/eitc/${slug}`),
  "/weekly-holiday-pay",
  ...WEEKLY_HOLIDAY_PAY_AMOUNTS.map((amount) => `/weekly-holiday-pay/${amount}`),
  "/wage-converter",
  ...WAGE_CONVERTER_AMOUNTS.map((amount) => `/wage-converter/${amount}`),
  "/severance-pay",
  ...SEVERANCE_PAY_AMOUNTS.map((amount) => `/severance-pay/${amount}`),
];

// PARAM_ROUTES is written by hand from the amount arrays, so it can silently drift out of
// SEO_ROUTES (a renamed slug, a family added to one list but not the other). A drifted entry
// would canonicalize a URL that is never prerendered, so fail the build here rather than ship it.
const SEO_ROUTE_SET = new Set(SEO_ROUTES);
for (const route of PARAM_ROUTES) {
  if (!SEO_ROUTE_SET.has(route)) {
    throw new Error(`[seo-routes] PARAM_ROUTES lists ${route}, which is not a prerendered route`);
  }
}

// The sitemap advertises only self-canonical pages. A consolidated variant still returns 200 and
// still gets crawled through internal links — it just should not be *submitted*, because every
// submitted URL that immediately points elsewhere spends crawl budget for nothing.
export const SITEMAP_ROUTES = SEO_ROUTES.filter((route) => !PARAM_ROUTE_SET.has(route));

// Everything in the sitemap that is not a calculator: the hub, the situation guides and the
// policy pages. Listed by hand because it is the short, stable half — a new calculator must never
// require an edit here, or the count below would drift again the moment one is added.
const NON_CALCULATOR_ROUTES = new Set(["/", "/all", "/about", "/terms", "/privacy"]);

// The calculators, derived — never counted by hand.
//
// Why this exists: /finance/llms.txt advertised "23개 계산기" for three weeks after /dependent,
// /unpaid-wage and /eitc shipped, because the number and the URL list were both typed in. Anything
// that states how many calculators this site has now reads it from here, so the only way to change
// the number is to add or remove a route.
//
// Depth filter: a two-segment sitemap route is a sub-page of a calculator (/eitc/single is a
// household variant of /eitc, /guide/* is a guide), never a calculator of its own.
export const CALCULATOR_ROUTES = SITEMAP_ROUTES.filter(
  (route) => route.split("/").length === 2 && !NON_CALCULATOR_ROUTES.has(route),
);

// Canonical target for a prerendered route: a consolidated variant points at its base
// calculator (/salary/5000 -> /salary), everything else points at itself.
export function canonicalPathFor(route) {
  return PARAM_ROUTE_SET.has(route) ? route.slice(0, route.lastIndexOf("/")) : route;
}

// PRERENDER_ROUTES intentionally still covers PARAM_ROUTES. Dropping a consolidated variant from
// the prerender pass would leave the Vercel rewrite serving an empty SPA shell for that URL,
// which reads as a soft-404 — strictly worse than the duplicate it was meant to fix.
export const PRERENDER_ROUTES = SEO_ROUTES;
