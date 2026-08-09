import { describe, expect, it } from "vitest";
import {
  CONSOLIDATED_FAMILIES,
  canonicalPathFor,
  consolidateCanonicalUrl,
} from "@/utils/canonicalConsolidation";
import {
  PARAM_ROUTES,
  SEO_ROUTES,
  SITEMAP_ROUTES,
  canonicalPathFor as canonicalPathForBuild,
} from "../../scripts/seo-routes.mjs";

// The consolidation rule exists twice: once in the build script that writes the prerendered
// canonical + sitemap, once in the client module that rewrites canonical on hydration. If the
// two disagree, a page ships one canonical in its HTML and a different one after paint — the
// exact split-signal problem the consolidation was meant to end. These tests are the seam.
describe("canonical consolidation agrees with the prerender source of truth", () => {
  it("resolves every prerendered route the same way the build script does", () => {
    const mismatches = SEO_ROUTES.filter(
      (route: string) => canonicalPathFor(route) !== canonicalPathForBuild(route)
    );

    expect(mismatches).toEqual([]);
  });

  it("folds every PARAM_ROUTE into a different, shorter base path", () => {
    for (const route of PARAM_ROUTES as string[]) {
      const target = canonicalPathFor(route);

      expect(target).not.toBe(route);
      expect(route.startsWith(`${target}/`)).toBe(true);
      expect(CONSOLIDATED_FAMILIES).toContain(target);
    }
  });

  it("leaves every sitemap route self-canonical", () => {
    for (const route of SITEMAP_ROUTES as string[]) {
      expect(canonicalPathFor(route)).toBe(route);
    }
  });

  // The 0.85–0.90 band verdict: household type moves the statutory ceiling and the payout, so
  // these three keep their own place in the index. A future edit that folds them in would
  // silently drop three earned-income-tax-credit pages out of the sitemap.
  it("keeps the EITC household variants indexable", () => {
    for (const slug of ["single", "single-income", "double-income"]) {
      expect(canonicalPathFor(`/eitc/${slug}`)).toBe(`/eitc/${slug}`);
    }
    expect(PARAM_ROUTES).not.toContain("/eitc/single");
  });
});

describe("consolidateCanonicalUrl", () => {
  it("rewrites a variant URL onto its base calculator", () => {
    expect(consolidateCanonicalUrl("https://shakilabs.com/finance/salary/5000")).toBe(
      "https://shakilabs.com/finance/salary"
    );
    expect(
      consolidateCanonicalUrl("https://shakilabs.com/finance/compare/4000-vs-5000")
    ).toBe("https://shakilabs.com/finance/compare");
    expect(consolidateCanonicalUrl("https://shakilabs.com/finance/quit/10years")).toBe(
      "https://shakilabs.com/finance/quit"
    );
  });

  // The router matches /salary/:amount for any integer, so amounts that were never prerendered
  // still resolve to a real page and still need to fold in.
  it("folds amounts that are not in the prerendered set", () => {
    expect(consolidateCanonicalUrl("https://shakilabs.com/finance/salary/4321")).toBe(
      "https://shakilabs.com/finance/salary"
    );
  });

  it("leaves base calculators and non-consolidated pages untouched", () => {
    for (const url of [
      "https://shakilabs.com/finance",
      "https://shakilabs.com/finance/salary",
      "https://shakilabs.com/finance/eitc/double-income",
      "https://shakilabs.com/finance/guide/job-change",
      "https://shakilabs.com/finance/about",
    ]) {
      expect(consolidateCanonicalUrl(url)).toBe(url);
    }
  });

  it("ignores URLs outside the finance base", () => {
    expect(consolidateCanonicalUrl("https://shakilabs.com/card/salary/5000")).toBe(
      "https://shakilabs.com/card/salary/5000"
    );
  });
});
