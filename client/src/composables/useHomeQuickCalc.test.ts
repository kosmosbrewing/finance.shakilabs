import insuranceViewSource from "@/views/InsuranceView.vue?raw";
import { effectScope, nextTick, type EffectScope } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clampHomeAnnualGross,
  HOME_QUICK_CALC_DEBOUNCE_MS,
  HOME_QUICK_CALC_DEFAULTS,
  HOME_QUICK_CALC_MAX_GROSS,
  HOME_QUICK_CALC_MIN_GROSS,
  useHomeQuickCalc,
} from "@/composables/useHomeQuickCalc";
import { calculateSalaryBreakdown } from "@/utils/calculator";

// 홈 간이 계산기와 /salary는 같은 연봉에서 원 단위까지 같은 금액을 내야 한다.
// 홈이 자체 계산식을 갖게 되는 순간 이 테스트가 깨진다.
const SAMPLE_GROSSES = [
  24_000_000, 30_000_000, 37_000_000, 40_000_000, 52_340_000, 68_000_000,
  100_000_000, 137_500_000, 300_000_000,
];

// /salary(InsuranceView.vue)가 forward 모드에서 쓰는 기본 조건 그대로 계산
function calculateSalaryPageBaseline(grossAnnual: number) {
  return calculateSalaryBreakdown({
    grossAnnual,
    nonTaxableMonthly: 200_000,
    dependents: 1,
    children: 0,
    retirementIncluded: false,
  });
}

const scopes: EffectScope[] = [];

function createHomeQuickCalc(): ReturnType<typeof useHomeQuickCalc> {
  const scope = effectScope();
  scopes.push(scope);
  return scope.run(() => useHomeQuickCalc()) as ReturnType<typeof useHomeQuickCalc>;
}

afterEach(() => {
  while (scopes.length) scopes.pop()?.stop();
  vi.useRealTimers();
});

describe("useHomeQuickCalc", () => {
  it("첫 렌더부터 기본 연봉의 결과가 채워져 있다 (빈 화면 금지)", () => {
    const home = createHomeQuickCalc();
    expect(home.appliedAnnualGross.value).toBe(HOME_QUICK_CALC_DEFAULTS.annualGross);
    expect(home.monthlyNet.value).toBeGreaterThan(0);
    expect(home.monthlyNet.value).toBe(
      calculateSalaryPageBaseline(HOME_QUICK_CALC_DEFAULTS.annualGross).monthlyNet
    );
  });

  it.each(SAMPLE_GROSSES)(
    "연봉 %i원의 월 실수령액이 /salary 기본 조건과 원 단위까지 같다",
    (gross) => {
      const home = createHomeQuickCalc();
      home.calc.annualGross.value = gross;

      const baseline = calculateSalaryPageBaseline(gross);
      expect(home.monthlyNet.value).toBe(baseline.monthlyNet);
      expect(home.monthlyDeduction.value).toBe(baseline.totalDeduction);
      expect(home.effectiveTaxRate.value).toBe(baseline.effectiveTaxRate);
      expect(home.calc.annualNet.value).toBe(baseline.annualNet);
      expect(home.calc.totalInsurance.value).toBe(baseline.totalInsurance);
      expect(home.calc.totalTax.value).toBe(baseline.totalTax);
    }
  );

  it("홈 고정 옵션은 /salary의 forward 기본값과 동일하다", () => {
    expect(HOME_QUICK_CALC_DEFAULTS).toEqual({
      annualGross: 40_000_000,
      dependents: 1,
      childrenUnder20: 0,
      nonTaxableMonthly: 200_000,
      retirementIncluded: false,
    });
  });

  // /salary 쪽 기본값이 조용히 바뀌면 홈과 결과가 갈라진다. 소스에서 직접 확인한다.
  it("InsuranceView.vue의 forward 기본값이 홈 고정 옵션과 어긋나지 않는다", () => {
    const forwardOptions = insuranceViewSource.match(
      /const forwardCalc = useSalaryCalc\(\{([\s\S]*?)\}\);/
    )?.[1];

    expect(forwardOptions).toBeTruthy();
    expect(forwardOptions).toContain("initialAnnualGross: 40_000_000");
    expect(forwardOptions).toContain("initialDependents: 1");
    expect(forwardOptions).toContain("initialChildrenUnder20: 0");
    expect(forwardOptions).toContain("initialNonTaxableMonthly: 200_000");
    // 퇴직금 포함 옵션은 지정하지 않는다 = useSalaryCalc 기본값(false)
    expect(forwardOptions).not.toContain("initialRetirementIncluded");
  });

  it("입력 300ms 뒤 계산 버튼 없이 자동으로 재계산한다", async () => {
    vi.useFakeTimers();
    const home = createHomeQuickCalc();

    home.setAnnualGross(60_000_000);
    await nextTick();
    expect(home.appliedAnnualGross.value).toBe(HOME_QUICK_CALC_DEFAULTS.annualGross);

    vi.advanceTimersByTime(HOME_QUICK_CALC_DEBOUNCE_MS);
    expect(home.appliedAnnualGross.value).toBe(60_000_000);
    expect(home.monthlyNet.value).toBe(
      calculateSalaryPageBaseline(60_000_000).monthlyNet
    );
  });

  it("입력값은 계산기 허용 범위로 보정된다", () => {
    expect(clampHomeAnnualGross(0)).toBe(HOME_QUICK_CALC_MIN_GROSS);
    expect(clampHomeAnnualGross(9_999_999_999)).toBe(HOME_QUICK_CALC_MAX_GROSS);
    expect(clampHomeAnnualGross(Number.NaN)).toBe(HOME_QUICK_CALC_DEFAULTS.annualGross);
    expect(clampHomeAnnualGross(41_234_567.8)).toBe(41_234_567);
  });
});
