// 프리렌더 계산 엔진 ↔ 인터랙티브 계산기 동일성 게이트.
//
// 왜 생겼나: scripts/calc-engine.mjs는 빌드 시점에 정적 HTML 본문에 숫자를 찍고, src/utils의
// 계산기는 같은 입력을 화면에서 계산한다. 두 값이 다르면 사용자가 같은 페이지에서 서로 다른 답
// 두 개를 본다. 실제로 퇴직소득세가 환산급여공제를 빼먹은 간이식이라 근속 3년 기준 414,000원
// (정답 129,360원의 3.2배)을 본문에 찍고 있었다. 미러 구현은 주석으로 "미러"라고 적어 두는
// 것만으로는 지켜지지 않으므로, 숫자를 직접 비교해 드리프트를 빌드에서 잡는다.
import { describe, expect, it } from "vitest";
import {
  calcEarnedIncomeDeduction,
  calcIncomeTax,
  calcInsuranceDeduction,
  calculateSalaryBreakdown,
} from "./calculator";
import { calculateSeveranceTax } from "./laborCalculator";
import {
  calculateRegionalHealth,
  REGIONAL_HEALTH_MIN_MONTHLY,
  VOLUNTARY_CONTINUATION_REDUCTION,
} from "./benefitCalculators";
import { RATES_2026 } from "@/data/taxRates2026";
import * as engine from "../../scripts/calc-engine.mjs";

const SEVERANCE_CASES: Array<[number, number]> = [
  [3_300_000, 1],
  [9_900_000, 3],
  [16_500_000, 5],
  [33_000_000, 10],
  [49_500_000, 15],
  [66_000_000, 20],
  [120_000_000, 25],
  [8_000_000, 2],
  [250_000_000, 30],
  [0, 5],
  [10_000_000, 0],
];

describe("calc-engine ↔ 인터랙티브 계산기 동일성", () => {
  it("퇴직소득세: severanceIncomeTax가 calculateSeveranceTax와 같은 값을 낸다", () => {
    for (const [pay, years] of SEVERANCE_CASES) {
      expect(engine.severanceIncomeTax(pay, years)).toBe(
        calculateSeveranceTax(pay, years),
      );
    }
  });

  // 회귀 고정: QA가 실측한 입력과 정답. 산식을 다시 간이화하면 여기서 먼저 깨진다.
  it("퇴직소득세: 근속 3년·퇴직금 990만원은 129,360원이다", () => {
    expect(engine.severanceIncomeTax(9_900_000, 3)).toBe(129_360);
    expect(engine.severancePayEstimate(3).estimatedTax).toBe(129_360);
  });

  it("근로소득공제·소득세·4대보험 공제가 일치한다", () => {
    for (const annual of [12_000_000, 30_000_000, 50_000_000, 78_000_000, 150_000_000]) {
      expect(engine.calcEarnedIncomeDeduction(annual)).toBe(
        calcEarnedIncomeDeduction(annual),
      );
      expect(engine.calcIncomeTax(annual)).toBe(calcIncomeTax(annual));
    }
    // 국민연금 상한(659만) 위·아래를 모두 지나가도록 고른 구간
    for (const monthly of [1_000_000, 2_500_000, 4_000_000, 6_590_000, 9_000_000]) {
      expect(engine.calcInsuranceDeduction(monthly)).toEqual(
        calcInsuranceDeduction(monthly),
      );
    }
  });

  it("연봉 실수령 breakdown의 핵심 항목이 일치한다", () => {
    const inputs = [
      { grossAnnual: 30_000_000, nonTaxableMonthly: 200_000, dependents: 1, children: 0, retirementIncluded: false },
      { grossAnnual: 50_000_000, nonTaxableMonthly: 200_000, dependents: 1, children: 0, retirementIncluded: false },
      { grossAnnual: 80_000_000, nonTaxableMonthly: 200_000, dependents: 3, children: 2, retirementIncluded: false },
      { grossAnnual: 120_000_000, nonTaxableMonthly: 300_000, dependents: 2, children: 1, retirementIncluded: true },
    ];
    for (const input of inputs) {
      const fromEngine = engine.calculateSalaryBreakdown(input);
      const fromApp = calculateSalaryBreakdown(input);
      for (const key of [
        "monthlyGross",
        "taxableMonthly",
        "totalInsurance",
        "monthlyIncomeTax",
        "monthlyLocalTax",
        "totalDeduction",
        "monthlyNet",
        "annualNet",
      ] as const) {
        expect(
          { key, value: fromEngine[key] },
          `${key} @ ${input.grossAnnual}`,
        ).toEqual({ key, value: (fromApp as Record<string, unknown>)[key] });
      }
    }
  });

  // 왜 이 게이트가 생겼나: /regional-health가 임의계속가입료를 화면에서는 보수월액의 7.19%
  // (경감 전 전액), 프리렌더 산문에서는 3.595%(경감 후)로 찍어 같은 라우트에서 2.3배 어긋난
  // 두 값을 동시에 보여주고 있었다. 경감 규정(보험료 경감고시 제9조)을 양쪽 모두에 명시해
  // 넣었으니, 한쪽만 다시 바뀌면 여기서 먼저 깨진다.
  it("지역가입자 건보료: 프리렌더 엔진과 화면 계산기가 원 단위까지 같다", () => {
    const ltc = (health: number) => Math.floor(health * RATES_2026.longTermCare.rateOfHealth);
    for (const monthly of [1_000_000, 2_500_000, 3_500_000, 5_000_000, 9_000_000]) {
      const fromEngine = engine.regionalHealthEstimate(monthly);
      // 화면 계산기에 "퇴사 후에도 같은 소득이 이어진다"는 엔진의 시나리오를 그대로 준다
      const fromApp = calculateRegionalHealth({
        monthlySalary: monthly,
        financialIncome: monthly * 12,
        propertyTaxBase: 0,
        carTaxBase: 0,
      });
      expect(fromApp.voluntaryHealth).toBe(fromEngine.formerEmployed);
      expect(fromApp.voluntaryGrossMonthly).toBe(
        fromEngine.voluntaryGross + ltc(fromEngine.voluntaryGross),
      );
      expect(fromApp.voluntaryMonthly).toBe(
        fromEngine.formerEmployed + ltc(fromEngine.formerEmployed),
      );
      expect(fromApp.regionalBase).toBe(fromEngine.regionalIncomeOnly);
      expect(fromApp.regionalMonthly).toBe(
        fromEngine.regionalIncomeOnly + ltc(fromEngine.regionalIncomeOnly),
      );
      // 임의계속가입은 경감 후 금액이므로 재직 중 본인부담분과 같아야 한다
      expect(fromApp.voluntaryMonthly).toBe(fromApp.currentMonthly);
    }
  });

  it("지역가입자 건보료: 경감률과 소득분 하한 상수가 양쪽에서 같다", () => {
    expect(engine.VOLUNTARY_CONTINUATION_REDUCTION).toBe(VOLUNTARY_CONTINUATION_REDUCTION);
    expect(engine.REGIONAL_HEALTH_MIN_MONTHLY).toBe(REGIONAL_HEALTH_MIN_MONTHLY);
    // 보험료 경감고시 제9조: 보수월액보험료의 100분의 50 경감
    expect(VOLUNTARY_CONTINUATION_REDUCTION).toBe(0.5);
    // 소득이 0원이면 양쪽 모두 하한에 붙는다
    expect(engine.regionalHealthEstimate(0).regionalIncomeOnly).toBe(REGIONAL_HEALTH_MIN_MONTHLY);
    expect(
      calculateRegionalHealth({
        monthlySalary: 3_500_000,
        financialIncome: 0,
        propertyTaxBase: 0,
        carTaxBase: 0,
      }).regionalBase,
    ).toBe(REGIONAL_HEALTH_MIN_MONTHLY);
  });
});
