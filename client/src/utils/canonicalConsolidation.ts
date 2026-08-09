// Doorway-variant consolidation, client side.
//
// The prerendered HTML already ships a consolidated canonical (scripts/seo-routes.mjs), but
// useSEO rewrites canonical/og:url from window.location on hydration. A JS-rendering crawler
// would therefore see the variant URL again and the whole consolidation would be undone after
// paint. This module applies the same rule in the browser so both passes agree.
//
// The rule is path-based rather than a prop on each view on purpose: /salary/:amount matches any
// number, not just the 18 amounts that get prerendered, so a hand-typed or externally linked
// /salary/4321 is a doorway too and must fold into /salary. A per-view prop would only ever
// cover the routes someone remembered to annotate.
//
// canonicalConsolidation.test.ts asserts this list stays in step with PARAM_ROUTES in
// scripts/seo-routes.mjs, which is the build-time source of truth.

/**
 * Base calculators whose single-segment children are amount variants of the same page.
 *
 * /eitc is deliberately absent: household type changes the statutory income ceiling and the
 * maximum payout, so /eitc/single and /eitc/double-income reach different conclusions and stay
 * independently indexable.
 */
export const CONSOLIDATED_FAMILIES = [
  "/insurance",
  "/salary",
  "/comprehensive-tax",
  "/compare",
  "/withholding",
  "/year-end-settlement",
  "/parental-leave",
  "/unpaid-wage",
  "/freelancer",
  "/quit",
  "/severance-pay",
  "/weekly-holiday-pay",
  "/wage-converter",
  "/regional-health",
  "/unemployment",
] as const;

const FAMILY_SET: ReadonlySet<string> = new Set(CONSOLIDATED_FAMILIES);

/**
 * Maps an app-relative route path to the path that should own its canonical.
 * Consolidated variants fold into their base calculator; everything else is self-canonical.
 */
export function canonicalPathFor(path: string): string {
  const clean = path.replace(/\/+$/, "") || "/";
  const lastSlash = clean.lastIndexOf("/");
  if (lastSlash <= 0) return clean;

  const parent = clean.slice(0, lastSlash);
  return FAMILY_SET.has(parent) ? parent : clean;
}

/**
 * Same rule applied to a full URL whose pathname carries the "/finance" deploy base.
 * Returns the input unchanged when it is not a consolidated variant.
 */
export function consolidateCanonicalUrl(href: string, base = "/finance"): string {
  try {
    const url = new URL(href);
    if (url.pathname !== base && !url.pathname.startsWith(`${base}/`)) return href;

    const routePath = url.pathname.slice(base.length) || "/";
    const canonicalRoute = canonicalPathFor(routePath);
    if (canonicalRoute === routePath) return href;

    url.pathname = canonicalRoute === "/" ? base : `${base}${canonicalRoute}`;
    return url.toString();
  } catch {
    return href;
  }
}
