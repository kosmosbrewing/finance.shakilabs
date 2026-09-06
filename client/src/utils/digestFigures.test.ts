// 승격 산문이 인용한 수치의 재계산 일치 게이트.
//
// 왜 필요한가: 다이제스트 문장은 엔진 호출 결과를 그대로 문자열에 끼워 넣는다. 그래서 문장 자체는
// 절대 "틀리지" 않지만, 엔진이 틀리면 문장도 같이 틀린 채로 조용히 배포된다. 여기서는 같은 숫자를
// 산식으로 다시 손계산해 문장 안에 그 값이 실제로 들어 있는지 확인한다 — 엔진과 산문이 동시에
// 어긋나야만 통과하는 구조라, 한쪽만 바뀌면 여기서 먼저 깨진다.
import { describe, expect, it } from "vitest";
import * as engine from "../../scripts/calc-engine.mjs";
import { calculateWageConversion } from "./laborCalculator";
import { calculateSalaryBreakdown } from "./calculator";
import {
  parentalStaircaseDigest,
  parentalVariantFlatDigest,
  regionalHealthRatioDigest,
  unemploymentFlatBandDigest,
  unpaidWageEquivalenceDigest,
} from "../../scripts/hub-digests-benefits.mjs";
import {
  wageRoundTripDigest,
  yearEndDeductionValueDigest,
} from "../../scripts/hub-digests-settlement.mjs";
import {
  eitcCurveShapeDigest,
  eitcEffectiveRateDigest,
} from "../../scripts/hub-digests-eitc.mjs";
import {
  dependentCliffCostDigest,
  dependentUnitConversionDigest,
  irpBindingLimitDigest,
  irpBoundaryReversalDigest,
} from "../../scripts/hub-digests-retirement.mjs";
import { digestProse } from "../../scripts/hub-digests-registry.mjs";
import type { Digest } from "../../scripts/hub-digest-types.d.mts";

const prose = (digest: Digest) => digestProse(digest).replace(/<[^>]+>/g, "");
const won = (value: number) => engine.formatWon(value);

describe("승격 산문의 수치 재계산", () => {
  it("실업급여: 비례 구간 경계를 닫힌 식으로 다시 구해도 같은 값이 나온다", () => {
    // 하한/상한을 만족하는 최소·최대 월급을 직접 역산한다. rawDaily = floor(floor(m/30) * 0.6)
    const lower = (() => {
      for (let m = 3_000_000; m <= 3_500_000; m += 1_000) {
        if (Math.floor(Math.floor(m / 30) * 0.6) >= engine.UNEMPLOYMENT_DAILY_MIN) return m;
      }
      return 0;
    })();
    const upper = (() => {
      let last = 0;
      for (let m = 3_000_000; m <= 3_600_000; m += 1_000) {
        if (Math.floor(Math.floor(m / 30) * 0.6) <= engine.UNEMPLOYMENT_DAILY_MAX) last = m;
      }
      return last;
    })();
    expect(lower).toBe(3_303_000);
    expect(upper).toBe(3_405_000);
    const text = prose(unemploymentFlatBandDigest());
    expect(text).toContain(won(lower));
    expect(text).toContain(won(upper));
    expect(text).toContain(won(upper - lower));
  });

  it("실업급여: 하한액은 최저시급 × 8 × 80%이고, 상한을 넘는 시급도 같은 식으로 나온다", () => {
    expect(10_320 * 8 * 0.8).toBe(engine.UNEMPLOYMENT_DAILY_MIN);
    const crossover = Math.ceil(engine.UNEMPLOYMENT_DAILY_MAX / 6.4);
    expect(crossover).toBe(10_641);
    expect(prose(unemploymentFlatBandDigest())).toContain(won(crossover));
  });

  it("육아휴직: 12개월 총액을 구간별로 손계산해도 같다", () => {
    // 하한 70만 ~ 상한 구간: 3w + 3w + 6 × 0.8w = 10.8w
    for (const wage of [1_000_000, 1_500_000, 2_000_000]) {
      expect(engine.parentalLeavePay(wage).total).toBe(Math.round(wage * 10.8));
    }
    // 상한 위: 250만 × 3 + 200만 × 3 + 160만 × 6
    const ceiling = 2_500_000 * 3 + 2_000_000 * 3 + 1_600_000 * 6;
    expect(engine.parentalLeavePay(5_000_000).total).toBe(ceiling);
    expect(ceiling).toBe(23_100_000);
    expect(prose(parentalVariantFlatDigest())).toContain(won(ceiling));
    // 대체율 90% 고정 구간
    expect(prose(parentalStaircaseDigest())).toContain("90.0%");
  });

  it("지역가입자: 두 금액의 비율은 요율비와 같은 2.000이다", () => {
    const ratio =
      engine.RATES_2026.healthInsurance.total / engine.RATES_2026.healthInsurance.employee;
    expect(ratio).toBeCloseTo(2, 10);
    for (const monthly of [2_500_000, 3_500_000, 5_000_000]) {
      const estimate = engine.regionalHealthEstimate(monthly);
      expect(estimate.regionalIncomeOnly).toBe(estimate.formerEmployed * 2);
    }
    expect(prose(regionalHealthRatioDigest())).toContain("2.000");
  });

  it("임금체불: 20%와 5%의 등가 일수, 3년 시효 상한을 손계산으로 확인한다", () => {
    expect(Math.round(365 / (0.2 / 0.05))).toBe(91);
    // 91일치 20% 이자가 1년치 5% 이자와 원 단위 오차(일할 절사) 안에서 같다
    expect(
      Math.abs(
        engine.unpaidWageInterest(10_000_000, 0.2, 91) -
          engine.unpaidWageInterest(10_000_000, 0.05, 365),
      ),
    ).toBeLessThan(1_500);
    // 3년(1,095일) × 20% = 원금의 60%
    expect(engine.unpaidWageInterest(10_000_000, 0.2, 1095)).toBe(6_000_000);
    expect(prose(unpaidWageEquivalenceDigest())).toContain(won(6_000_000));
  });

  it("시급 환산: 프리렌더 엔진과 화면 계산기의 월급이 원 단위까지 같다", () => {
    for (const hourly of [10_320, 12_000, 15_000, 20_000]) {
      const fromEngine = engine.wageConversion(hourly);
      const fromApp = calculateWageConversion({
        base: "hourly",
        amount: hourly,
        weeklyWorkHours: 40,
        includeWeeklyHoliday: true,
      });
      expect(fromEngine.monthlyTotal).toBe(fromApp.monthly);
      expect(fromEngine.annualTotal).toBe(fromApp.annual);
      expect(fromApp.monthlyHours).toBe(engine.MONTHLY_HOURS_WITH_HOLIDAY);
    }
    // 왕복 복원: 208.6으로 나누면 원래 시급이 돌아온다
    expect(Math.round(engine.wageConversion(10_320).monthlyTotal / 208.6)).toBe(10_320);
    expect(prose(wageRoundTripDigest())).toContain(won(10_320 * 209));
  });

  it("연말정산: 표준 시나리오 환급액은 한계세율 × 1.1이고 결정세액에서 잘린다", () => {
    const cases: Array<[number, number]> = [
      [30_000_000, 0.165],
      [45_000_000, 0.165],
      [75_000_000, 0.264],
      [100_000_000, 0.264],
    ];
    for (const [gross, rate] of cases) {
      const scenario = engine.yearEndStandardScenario(gross);
      const deduction = Math.min(3_000_000, Math.floor(gross * 0.05));
      expect(scenario.extraDeduction).toBe(deduction);
      expect(scenario.marginalRate).toBeCloseTo(rate, 10);
      expect(scenario.refund).toBe(Math.min(scenario.determinedTax, Math.floor(deduction * rate)));
    }
    // 결정세액에서 잘리는 저연봉 구간이 실재한다
    const low = engine.yearEndStandardScenario(20_000_000);
    expect(low.refund).toBe(low.determinedTax);
    expect(low.refund).toBeLessThan(low.uncappedRefund);
    const text = prose(yearEndDeductionValueDigest());
    expect(text).toContain(won(Math.floor(1_000_000 * 0.264)));
    expect(text).toContain(won(low.determinedTax));
  });

  it("근로장려금: 구간 기울기와 배우자 300만원 경계의 차액을 손계산으로 확인한다", () => {
    const single = engine.EITC_BRACKET_TABLE.single;
    const singleIncome = engine.EITC_BRACKET_TABLE["single-income"];
    const doubleIncome = engine.EITC_BRACKET_TABLE["double-income"];
    expect(single.maxAmount / single.phaseInEnd).toBeCloseTo(0.4125, 6);
    expect(singleIncome.maxAmount / (singleIncome.phaseOutEnd - singleIncome.plateauEnd)).toBeCloseTo(
      0.158333,
      5,
    );
    // 단독 곡선이 홑벌이를 앞서는 구간이 실제로 존재한다
    expect(engine.eitcAmountFor(400_000, single)).toBeGreaterThan(
      engine.eitcAmountFor(400_000, singleIncome),
    );
    // 배우자 급여 2만원 차이가 만드는 계단
    const asSingleIncome = engine.eitcAmountFor(32_990_000, singleIncome);
    const asDoubleIncome = engine.eitcAmountFor(33_010_000, doubleIncome);
    expect(asSingleIncome).toBe(0);
    expect(asDoubleIncome).toBe(
      Math.floor(
        (doubleIncome.maxAmount * (doubleIncome.phaseOutEnd - 33_010_000)) /
          (doubleIncome.phaseOutEnd - doubleIncome.plateauEnd),
      ),
    );
    expect(prose(eitcCurveShapeDigest())).toContain("41.25%");
    expect(prose(eitcEffectiveRateDigest())).toContain(won(asDoubleIncome));
  });

  it("IRP: 환급 상한은 한도가 아니라 결정세액이고, 그 교차 연봉을 다시 찾아도 같다", () => {
    // 한도를 꽉 채웠을 때의 공제 대상 금액 = 900만 × 16.5%
    const full = engine.calcIrpTaxCredit({
      annualSalary: 50_000_000,
      pensionSavings: 6_000_000,
      irpContribution: 3_000_000,
    });
    expect(full.recognizedContribution).toBe(9_000_000);
    const credit = Math.floor(9_000_000 * 0.15 * 1.1);
    expect(credit).toBe(1_485_000);
    // 결정세액이 그 금액을 처음 덮는 연봉
    let crossing = 0;
    for (let manWonValue = 2_000; manWonValue <= 9_000; manWonValue += 10) {
      const determined = calculateSalaryBreakdown({
        grossAnnual: manWonValue * 10_000,
        nonTaxableMonthly: 200_000,
        dependents: 1,
        children: 0,
        retirementIncluded: false,
      }).determinedTax;
      if (determined >= credit) {
        crossing = manWonValue;
        break;
      }
    }
    expect(crossing).toBe(4_290);
    const text = prose(irpBindingLimitDigest());
    expect(text).toContain("4,290만원");
    // 연금저축 한 계좌에 900만을 넣으면 600만만 인정된다
    const lopsided = engine.calcIrpTaxCredit({
      annualSalary: 50_000_000,
      pensionSavings: 9_000_000,
      irpContribution: 0,
    });
    expect(lopsided.recognizedContribution).toBe(6_000_000);
    expect(lopsided.overflowAmount).toBe(3_000_000);
    expect(text).toContain(won(credit - Math.floor(6_000_000 * 0.15 * 1.1)));
  });

  it("IRP: 5,500만 경계의 손실과 세후 회복폭을 손계산으로 확인한다", () => {
    const under = Math.floor(9_000_000 * 0.15 * 1.1);
    const over = Math.floor(9_000_000 * 0.12 * 1.1);
    expect(under - over).toBe(297_000);
    const net = (gross: number) =>
      calculateSalaryBreakdown({
        grossAnnual: gross,
        nonTaxableMonthly: 200_000,
        dependents: 1,
        children: 0,
        retirementIncluded: false,
      }).annualNet;
    const step = net(55_010_000) - net(55_000_000);
    expect(step).toBe(7_632);
    let recover = 0;
    for (let gross = 55_010_000; gross <= 58_000_000; gross += 10_000) {
      if (net(gross) - net(55_000_000) >= under - over) {
        recover = gross;
        break;
      }
    }
    expect(recover).toBe(55_390_000);
    const text = prose(irpBoundaryReversalDigest());
    expect(text).toContain(won(recover));
    expect(text).toContain(won(under - over - step));
  });

  it("피부양자: 소득 상한 1원 초과의 연 비용과 역전 구간을 다시 계산한다", () => {
    const ceiling = 20_000_000;
    const monthly = Math.floor((ceiling / 12) * engine.RATES_2026.healthInsurance.total);
    expect(engine.regionalHealthEstimate(ceiling / 12).regionalIncomeOnly).toBe(monthly);
    expect(monthly * 12).toBe(1_437_996);
    const text = prose(dependentCliffCostDigest());
    expect(text).toContain(won(monthly * 12));
    expect(text).toContain(won(ceiling + monthly * 12));
  });

  it("피부양자: 요건 단위 환산(사업소득·재산과표·연금)을 다시 계산한다", () => {
    // 사업소득금액 500만 → 단순경비율 64.1% 기준 수입
    const revenue = Math.round(5_000_000 / (1 - 0.641));
    expect(revenue).toBe(13_927_577);
    // 재산세 과세표준 → 공정시장가액비율 60% 역산
    expect(Math.round(540_000_000 / 0.6)).toBe(900_000_000);
    expect(Math.round(900_000_000 / 0.6)).toBe(1_500_000_000);
    // 국민연금 단독으로는 가입 30년·상한 소득이어도 2,000만원에 못 미친다
    const thirty = engine.calcPensionEstimate({
      averageMonthlyIncome: engine.RATES_2026.nationalPension.maxMonthlyIncome,
      insuredYears: 30,
      claimAge: 65,
    });
    expect(thirty.estimatedAnnualPension).toBeLessThan(20_000_000);
    // 연기수령 계수가 자격을 깨는 나이
    const at65 = engine.calcPensionEstimate({
      averageMonthlyIncome: 5_000_000,
      insuredYears: 40,
      claimAge: 65,
    });
    const at67 = engine.calcPensionEstimate({
      averageMonthlyIncome: 5_000_000,
      insuredYears: 40,
      claimAge: 67,
    });
    expect(at65.estimatedAnnualPension).toBeLessThan(20_000_000);
    expect(at67.estimatedAnnualPension).toBeGreaterThan(20_000_000);
    const text = prose(dependentUnitConversionDigest());
    expect(text).toContain(won(revenue));
    expect(text).toContain(won(at67.estimatedAnnualPension));
  });
});
