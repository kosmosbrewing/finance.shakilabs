import { describe, expect, it } from "vitest";
import {
  calcChildTaxCredit,
  calcEarnedIncomeDeduction,
  calcEarnedIncomeTaxCredit,
  calcIncomeTax,
  calcIncomeTaxBundle,
  calcInsuranceDeduction,
  calculateSalaryBreakdown,
  clampNumber,
} from "@/utils/calculator";

describe("calculator core", () => {
  it("clampNumber는 최소값 아래 입력을 보정한다", () => {
    expect(clampNumber(-5, 0, 10)).toBe(0);
  });

  it("clampNumber는 최대값 위 입력을 보정한다", () => {
    expect(clampNumber(15, 0, 10)).toBe(10);
  });

  it("근로소득공제는 첫 구간 공식을 따른다", () => {
    expect(calcEarnedIncomeDeduction(4_000_000)).toBe(2_800_000);
  });

  it("근로소득공제는 법정 한도를 넘지 않는다", () => {
    expect(calcEarnedIncomeDeduction(400_000_000)).toBe(20_000_000);
  });

  it("종합소득세는 과세표준이 0 이하이면 0이다", () => {
    expect(calcIncomeTax(0)).toBe(0);
  });

  it("종합소득세는 누진공제 구간 식을 적용한다", () => {
    expect(calcIncomeTax(30_000_000)).toBe(3_240_000);
  });

  it("근로소득세액공제는 130만원 이하 구간을 계산한다", () => {
    expect(calcEarnedIncomeTaxCredit(1_000_000, 30_000_000)).toBe(550_000);
  });

  it("근로소득세액공제는 총급여 한도에 맞춰 상한을 적용한다", () => {
    expect(calcEarnedIncomeTaxCredit(3_000_000, 30_000_000)).toBe(740_000);
  });

  it("자녀세액공제는 자녀가 없으면 0이다", () => {
    expect(calcChildTaxCredit(0)).toBe(0);
  });

  it("자녀세액공제는 3명 초과 규칙을 반영한다", () => {
    expect(calcChildTaxCredit(4)).toBe(1_350_000);
  });

  it("보험 공제는 과세 금액이 0이면 모두 0이다", () => {
    expect(calcInsuranceDeduction(0)).toEqual({
      nationalPension: 0,
      healthInsurance: 0,
      longTermCare: 0,
      employmentInsurance: 0,
      totalInsurance: 0,
    });
  });

  it("보험 공제는 국민연금 상한을 적용한다", () => {
    const result = calcInsuranceDeduction(10_000_000);
    expect(result.nationalPension).toBe(302_575);
    expect(result.totalInsurance).toBe(
      result.nationalPension +
        result.healthInsurance +
        result.longTermCare +
        result.employmentInsurance
    );
  });

  it("소득세 번들은 부양가족과 자녀 수를 허용 범위로 보정한다", () => {
    const bundle = calcIncomeTaxBundle({
      annualTaxableIncome: 50_000_000,
      dependents: 0,
      children: 7,
      monthlyInsuranceTotal: 300_000,
    });

    expect(bundle.personalDeduction).toBe(1_500_000);
    expect(bundle.childTaxCredit).toBe(0);
    expect(bundle.monthlyIncomeTax).toBeGreaterThanOrEqual(0);
    expect(bundle.monthlyLocalTax).toBeGreaterThanOrEqual(0);
  });

  it("실수령 계산은 월급에서 공제합계를 뺀 값을 유지한다", () => {
    const result = calculateSalaryBreakdown({
      grossAnnual: 36_000_000,
      nonTaxableMonthly: 200_000,
      dependents: 2,
      children: 1,
      retirementIncluded: false,
    });

    expect(result.monthlyGross - result.totalDeduction).toBe(result.monthlyNet);
    expect(result.annualNet).toBe(result.monthlyNet * 12);
    expect(result.totalTax).toBe(result.monthlyIncomeTax + result.monthlyLocalTax);
  });

  it("퇴직금 포함 옵션은 13개월 기준 월 급여를 계산한다", () => {
    const result = calculateSalaryBreakdown({
      grossAnnual: 39_000_000,
      nonTaxableMonthly: 0,
      dependents: 1,
      children: 3,
      retirementIncluded: true,
    });

    expect(result.monthlyGross).toBe(3_000_000);
    expect(result.children).toBe(0);
  });

  it("사업주 부담액 total은 각 항목 합과 같다", () => {
    const result = calculateSalaryBreakdown({
      grossAnnual: 60_000_000,
      nonTaxableMonthly: 100_000,
      dependents: 1,
      children: 0,
      retirementIncluded: false,
    });

    expect(result.employerCost.total).toBe(
      result.employerCost.nationalPension +
        result.employerCost.healthInsurance +
        result.employerCost.employmentInsurance
    );
  });
});
