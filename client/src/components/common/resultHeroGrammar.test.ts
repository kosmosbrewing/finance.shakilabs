// Result-hero grammar gate (docs: 100_MVP/docs/RESULT_DESIGN_BACKLOG.md).
// Guards the single result grammar across all 26 calculators:
//  1. every calculator view renders ResultHero (directly or via an imported component)
//  2. `text-display` lives only inside ResultHero.vue — no forked heroes
//  3. ResultHero itself keeps the grammar: label above value, display size,
//     brand color, tabular numerals, centered
//  4. stat-grid values stay neutral (no brand/status color)
//  5. no count-up animation revival in result components
import { describe, expect, it } from "vitest";

const vueSources = import.meta.glob("/src/**/*.vue", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const HERO_PATH = "/src/components/common/ResultHero.vue";

// One entry per calculator route (26 total, see src/router/index.ts).
const CALCULATOR_VIEWS = [
  "SalaryView",
  "InsuranceView",
  "CompareView",
  "RaiseView",
  "BonusView",
  "ComprehensiveTaxView", // also serves /freelancer
  "WithholdingView",
  "FreelanceRateView",
  "InsuranceEmployerView",
  "WeeklyHolidayPayView",
  "WageConverterView",
  "OvertimeView",
  "AnnualLeaveView",
  "QuitView",
  "SeverancePayView",
  "UnemploymentView",
  "ParentalLeaveView",
  "RegionalHealthView",
  "DependentView",
  "UnpaidWageView",
  "YearEndSettlementView",
  "MonthlyRentDeductionView",
  "IrpView",
  "PensionView",
  "EitcView",
  "SalaryLandingView", // /salary/:amount prerendered variant
];

// Resolve `@/...` imports so the hero is found through one or more
// component hops (e.g. SalaryView -> SalaryResultPanel -> ResultHero).
function usesResultHero(path: string, seen = new Set<string>()): boolean {
  if (seen.has(path)) return false;
  seen.add(path);
  const source = vueSources[path];
  if (!source) return false;
  if (/<ResultHero[\s>/]/.test(source)) return true;
  const imports = [...source.matchAll(/from "@\/(components\/[^"]+\.vue)"/g)];
  return imports.some(([, rel]) => usesResultHero(`/src/${rel}`, seen));
}

describe("result hero grammar", () => {
  it("every calculator view renders ResultHero", () => {
    const missing = CALCULATOR_VIEWS.filter(
      (view) => !usesResultHero(`/src/views/${view}.vue`)
    );
    expect(missing).toEqual([]);
  });

  it("text-display is used only by ResultHero.vue", () => {
    const offenders = Object.keys(vueSources)
      .filter((path) => path !== HERO_PATH)
      .filter((path) => vueSources[path].includes("text-display"));
    expect(offenders).toEqual([]);
  });

  it("ResultHero keeps the 5-line grammar", () => {
    const heroSource = vueSources[HERO_PATH];
    expect(heroSource).toBeDefined();
    // only judge the markup, not script comments
    const hero = heroSource.slice(heroSource.indexOf("<template>"));
    // label paragraph must appear before the value paragraph
    const labelIdx = hero.indexOf("text-caption");
    const valueIdx = hero.indexOf("text-display");
    expect(labelIdx).toBeGreaterThan(-1);
    expect(valueIdx).toBeGreaterThan(labelIdx);
    expect(hero).toContain("text-center");
    expect(hero).toContain("tabular-nums");
    expect(hero).toContain("text-primary");
    expect(hero).toContain("font-title");
    expect(hero).toContain("data-result-hero");
  });

  it("stat-grid values stay neutral", () => {
    for (const path of [
      "/src/components/benefits/BenefitStatGrid.vue",
      "/src/components/salary/SalarySummaryStatGrid.vue",
    ]) {
      const source = vueSources[path];
      expect(source, path).toBeDefined();
      expect(source, path).not.toMatch(/text-status-(success|danger|caution)/);
      expect(source, path).not.toContain("text-primary");
    }
    // inline retro-stat grids must not color values either
    for (const [path, source] of Object.entries(vueSources)) {
      for (const match of source.matchAll(/retro-stat-value[^"]*"/g)) {
        expect(match[0], path).not.toMatch(/text-status-|text-primary/);
      }
    }
  });

  it("no count-up animation in result components", () => {
    const offenders = Object.keys(vueSources).filter((path) =>
      vueSources[path].includes("animateInitialMonthlyNet")
    );
    expect(offenders).toEqual([]);
  });
});
