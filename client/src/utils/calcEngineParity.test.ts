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
});
