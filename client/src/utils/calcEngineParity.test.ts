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
  calculatePensionEstimate,
  calculateRegionalHealth,
  REGIONAL_HEALTH_MIN_MONTHLY,
  VOLUNTARY_CONTINUATION_REDUCTION,
} from "./benefitCalculators";
import { normalizePensionInput } from "@/lib/benefitValidators";
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
  // 왜 이 게이트가 생겼나: calcInsuranceDeduction과 calcEmployerInsuranceBurden은 기준소득월액
  // 상한을 적용하는데 calcPensionEstimate만 빠져 있어, 상한 위 소득이 예상 연금액과 보험료를
  // 함께 부풀리고 있었다(659만 -> 759만에서 연금이 월 165,000원 더 나왔다). 두 사본 모두에
  // 같은 상한을 넣었으니, 한쪽만 다시 풀리면 여기서 먼저 깨진다.
  it("국민연금 예상 수령액: 프리렌더 엔진과 화면 계산기가 원 단위까지 같다", () => {
    // 상한(659만) 위·아래를 모두 지나가도록 고른 구간
    for (const income of [410_000, 2_000_000, 5_000_000, 6_590_000, 7_590_000, 12_000_000]) {
      for (const years of [9, 10, 20, 30, 40]) {
        for (const age of [60, 65, 70]) {
          const input = { averageMonthlyIncome: income, insuredYears: years, claimAge: age };
          expect(
            engine.calcPensionEstimate(input),
            `pension @ ${income}/${years}/${age}`,
          ).toEqual(calculatePensionEstimate(input));
        }
      }
    }
  });

  // 리터럴 앵커. 엔진에서 다시 계산하면 페이지와 기대값이 같은 상수를 따라 함께 움직여 절대
  // 깨지지 않으므로, 아래 숫자는 손으로 적어 둔다.
  //   국민연금법 제3조제1항제5호 - 기준소득월액은 "연금보험료와 급여를 산정하기 위하여" 정하는 금액
  //   같은 법 시행령 제5조제5항 - 신고 소득월액이 상한액보다 많으면 그 상한액을 기준소득월액으로 한다
  //   같은 법 제51조제1항제2호 - 기본연금액의 소득비례분은 그 기준소득월액을 재평가해 평균한 값
  // 따라서 상한 위 소득은 보험료에도 연금액에도 반영되지 않는다.
  it("국민연금 상한: 659만원 위의 소득은 연금액도 보험료도 늘리지 않는다", () => {
    const at = (averageMonthlyIncome: number) =>
      engine.calcPensionEstimate({ averageMonthlyIncome, insuredYears: 30, claimAge: 65 });

    // 상한 그 자체 (6,590,000 x 9.5% = 626,050)
    expect(at(6_590_000).estimatedMonthlyPension).toBe(1_357_350);
    expect(at(6_590_000).employeeContribution).toBe(626_050);
    // 상한 위: 같은 값에서 멈춘다. 고치기 전에는 각각 1,522,350원과 721,050원이었다.
    expect(at(7_590_000).estimatedMonthlyPension).toBe(1_357_350);
    expect(at(7_590_000).employeeContribution).toBe(626_050);
    // 두 배 가까이 넣어도 마찬가지. 고치기 전에는 2,250,000원과 1,140,000원이었다.
    expect(at(12_000_000).estimatedMonthlyPension).toBe(1_357_350);
    expect(at(12_000_000).employeeContribution).toBe(626_050);
    expect(at(12_000_000).cappedByStandardIncomeLimit).toBe(true);
    // 상한 아래는 그대로 소득에 반응해야 한다 - 상한을 잘못 낮춰 잡으면 여기서 깨진다.
    expect(at(5_000_000).estimatedMonthlyPension).toBe(1_095_000);
    expect(at(5_000_000).employeeContribution).toBe(475_000);
    expect(at(5_000_000).cappedByStandardIncomeLimit).toBe(false);
  });

  // 슬라이더는 어포던스일 뿐 보증이 아니다. 저장된 상태·URL 쿼리는 슬라이더를 거치지 않으므로
  // 검증 계층이 범위를 지켜야 하고, 범위 밖 값은 기본값이 아니라 경계값으로 잘라야 한다.
  it("국민연금 입력 검증: 범위 밖 값을 기본값이 아니라 경계값으로 자른다", () => {
    // Zod salarySchema는 3억까지 통과시키므로 여기가 유일한 방어선이었다
    expect(normalizePensionInput({ averageMonthlyIncome: 12_000_000 }).averageMonthlyIncome).toBe(
      6_590_000,
    );
    expect(normalizePensionInput({ averageMonthlyIncome: 300_000_000 }).averageMonthlyIncome).toBe(
      6_590_000,
    );
    // 슬라이더 하한(41만)은 예전 salarySchema의 min(100만)에 걸려 3,200,000원으로 되돌아갔다
    expect(normalizePensionInput({ averageMonthlyIncome: 500_000 }).averageMonthlyIncome).toBe(
      500_000,
    );
    expect(normalizePensionInput({ averageMonthlyIncome: 100_000 }).averageMonthlyIncome).toBe(
      410_000,
    );
    // 자를 대상이 없는 값(숫자가 아님·NaN)만 기본값으로 돌아간다
    expect(normalizePensionInput({ averageMonthlyIncome: Number.NaN }).averageMonthlyIncome).toBe(
      3_200_000,
    );
    expect(normalizePensionInput({}).averageMonthlyIncome).toBe(3_200_000);
  });
});
