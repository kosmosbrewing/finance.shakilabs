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
import {
  calcCardDeduction,
  calculateYearEndSettlement,
} from "@/utils/yearEndSettlementCalculator";
import { calculateParentalLeave } from "@/utils/parentalLeaveCalculator";
import { estimateAnnualRemuneration } from "@/lib/health-insurance-tiers";

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
    expect(result.nationalPension).toBe(313_025);
    expect(result.totalInsurance).toBe(
      result.nationalPension +
        result.healthInsurance +
        result.longTermCare +
        result.employmentInsurance
    );
  });

  it("국민연금은 2026년 7월 하한 41만원을 적용한다", () => {
    expect(calcInsuranceDeduction(1).nationalPension).toBe(19_475);
    expect(calcInsuranceDeduction(410_000).nationalPension).toBe(19_475);
  });

  it("국민연금은 2026년 7월 상한 659만원을 적용한다", () => {
    expect(calcInsuranceDeduction(6_590_000).nationalPension).toBe(313_025);
    expect(calcInsuranceDeduction(6_590_001).nationalPension).toBe(313_025);
  });

  it("건강보험료 환산은 소득 순위가 아닌 연간 보수 추정값을 반환한다", () => {
    expect(estimateAnnualRemuneration(107_850)).toBe(36_000_000);
    expect(estimateAnnualRemuneration(0)).toBe(0);
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

describe("yearEndSettlementCalculator", () => {
  const baseInput = {
    annualSalary: 52_000_000,
    dependents: 1,
    children: 0,
    creditCardSpend: 0,
    debitCardSpend: 0,
    insurancePremium: 0,
    medicalExpense: 0,
    educationExpense: 0,
    donationAmount: 0,
    pensionSavings: 0,
    irpContribution: 0,
    monthlyRent: 0,
    rentMonths: 12,
  };

  describe("calcCardDeduction", () => {
    it("최소사용금액 이하면 공제가 0이다", () => {
      // 52,000,000 × 25% = 13,000,000 → 총 사용 10,000,000 < 13,000,000
      expect(calcCardDeduction(52_000_000, 5_000_000, 5_000_000)).toBe(0);
    });

    it("신용카드부터 최소사용금액을 차감하고 공제율을 적용한다", () => {
      // 최소사용 13,000,000, 신용카드 15,000,000 → 초과 2,000,000 × 15% = 300,000
      // 체크카드 5,000,000 × 30% = 1,500,000 → 총 1,800,000
      expect(calcCardDeduction(52_000_000, 15_000_000, 5_000_000)).toBe(1_800_000);
    });

    it("공제한도를 초과하지 않는다", () => {
      // 총급여 7천만 이하 → 300만원 한도
      const result = calcCardDeduction(52_000_000, 30_000_000, 20_000_000);
      expect(result).toBe(3_000_000);
    });

    it("총급여 7천만원 초과 구간은 250만원 한도를 적용한다", () => {
      const result = calcCardDeduction(150_000_000, 80_000_000, 20_000_000);
      expect(result).toBe(2_500_000);
    });
  });

  describe("calculateYearEndSettlement", () => {
    it("공제 항목이 없으면 기납부세액과 결정세액이 같아 정산 0이다", () => {
      const result = calculateYearEndSettlement(baseInput);
      // 추가 공제 없이 기본 원천징수와 동일 → 정산 0
      expect(result.settlementAmount).toBe(0);
      expect(result.determinedTax).toBeGreaterThan(0);
    });

    it("연금저축·IRP 공제로 환급이 발생한다", () => {
      const result = calculateYearEndSettlement({
        ...baseInput,
        pensionSavings: 4_000_000,
        irpContribution: 3_000_000,
      });
      // 연금계좌 세액공제 반영 → 결정세액 < 원천징수 → 환급
      expect(result.pensionAccountCredit).toBeGreaterThan(0);
      expect(result.isRefund).toBe(true);
      expect(result.settlementAmount).toBeLessThan(0);
    });

    it("totalTax = determinedTax + localTax", () => {
      const result = calculateYearEndSettlement({
        ...baseInput,
        creditCardSpend: 20_000_000,
        medicalExpense: 3_000_000,
        pensionSavings: 6_000_000,
      });
      expect(result.totalTax).toBe(result.determinedTax + result.localTax);
    });

    it("월세 세액공제는 총급여 8천만 초과 시 0이다", () => {
      const result = calculateYearEndSettlement({
        ...baseInput,
        annualSalary: 90_000_000,
        monthlyRent: 700_000,
        rentMonths: 12,
      });
      expect(result.monthlyRentCredit).toBe(0);
    });
  });
});

describe("parentalLeaveCalculator", () => {
  it("일반 육아휴직 12개월 급여를 월별로 계산한다", () => {
    const result = calculateParentalLeave({
      monthlyWage: 3_000_000,
      months: 12,
      leaveType: "general",
    });
    expect(result.monthlyDetails).toHaveLength(12);
    // 1~3개월: min(3,000,000, 2,500,000) = 2,500,000
    expect(result.monthlyDetails[0].benefit).toBe(2_500_000);
    // 4~6개월: min(3,000,000, 2,000,000) = 2,000,000
    expect(result.monthlyDetails[3].benefit).toBe(2_000_000);
    // 7~12개월: min(3,000,000 × 0.8 = 2,400,000, 1,600,000) = 1,600,000
    expect(result.monthlyDetails[6].benefit).toBe(1_600_000);
  });

  it("6+6 부모육아휴직제는 6개월까지 월별 상한이 다르다", () => {
    const result = calculateParentalLeave({
      monthlyWage: 5_000_000,
      months: 6,
      leaveType: "parent66",
    });
    expect(result.monthlyDetails[0].benefit).toBe(2_500_000); // 1개월 상한
    expect(result.monthlyDetails[2].benefit).toBe(3_000_000); // 3개월 상한
    expect(result.monthlyDetails[5].benefit).toBe(4_500_000); // 6개월 상한
  });

  it("통상임금이 하한 미만이면 하한액을 지급한다", () => {
    const result = calculateParentalLeave({
      monthlyWage: 500_000,
      months: 3,
      leaveType: "general",
    });
    expect(result.monthlyDetails[0].benefit).toBe(700_000);
  });

  it("소득대체율은 총수령 / 총통상임금이다", () => {
    const result = calculateParentalLeave({
      monthlyWage: 3_000_000,
      months: 6,
      leaveType: "general",
    });
    const expectedRate = result.totalBenefit / (3_000_000 * 6);
    expect(result.incomeReplacementRate).toBeCloseTo(expectedRate, 8);
  });
});
