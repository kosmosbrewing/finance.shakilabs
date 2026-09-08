import { describe, expect, it } from "vitest";
import {
  calculateAnnualLeavePay,
  calculateEmployerInsuranceBurden,
  calculateIrpTaxCredit,
  calculateMonthlyRentDeduction,
  withLocalIncomeTax,
  calculatePensionEstimate,
  getAnnualLeaveDays,
} from "@/utils/benefitCalculators";

describe("benefitCalculators", () => {
  it("1년 미만 근속은 개근 월수만큼 연차가 발생한다", () => {
    expect(getAnnualLeaveDays(11)).toBe(11);
  });

  it("1년 이상 근속은 기본 15일을 반영한다", () => {
    expect(getAnnualLeaveDays(24)).toBe(15);
  });

  it("연차수당은 정산 반영 일수만 계산한다", () => {
    const result = calculateAnnualLeavePay({
      monthlySalary: 3_600_000,
      fixedAllowance: 200_000,
      monthsWorked: 24,
      unusedLeaveDays: 20,
    });
    expect(result.payableDays).toBe(15);
    expect(result.totalAllowance).toBe(result.dailyOrdinaryWage * 15);
  });

  it("국민연금은 청구 나이가 늦을수록 늘어난다", () => {
    const age65 = calculatePensionEstimate({
      averageMonthlyIncome: 3_200_000,
      insuredYears: 20,
      claimAge: 65,
    });
    const age68 = calculatePensionEstimate({
      averageMonthlyIncome: 3_200_000,
      insuredYears: 20,
      claimAge: 68,
    });
    expect(age68.estimatedMonthlyPension).toBeGreaterThan(age65.estimatedMonthlyPension);
  });

  it("가입기간 10년 미만은 일반 노령연금 대상 아님으로 표시한다", () => {
    expect(
      calculatePensionEstimate({
        averageMonthlyIncome: 3_000_000,
        insuredYears: 9,
        claimAge: 65,
      }).eligible
    ).toBe(false);
  });

  it("월세 세액공제는 1천만원 한도를 적용한다", () => {
    const result = calculateMonthlyRentDeduction({
      annualSalary: 48_000_000,
      monthlyRent: 1_200_000,
      paidMonths: 12,
    });
    expect(result.recognizedRent).toBe(10_000_000);
  });

  it("총급여 8천만원 초과는 월세 공제가 0원이다", () => {
    expect(
      calculateMonthlyRentDeduction({
        annualSalary: 81_000_000,
        monthlyRent: 700_000,
        paidMonths: 12,
      }).taxCredit
    ).toBe(0);
  });

  it("IRP 세액공제는 연금저축 600만원 한도를 먼저 반영한다", () => {
    const result = calculateIrpTaxCredit({
      annualSalary: 52_000_000,
      pensionSavings: 7_000_000,
      irpContribution: 5_000_000,
    });
    expect(result.recognizedPensionSavings).toBe(6_000_000);
    expect(result.recognizedContribution).toBe(9_000_000);
  });

  it("세액공제액과 지방소득세 포함 절세액을 각각 반환한다", () => {
    // 지방세특례제한법 제167조의2제1항 — 소득세 세액공제액의 100분의 10만큼 개인지방소득세도 공제된다.
    // 리터럴로 못 박는다: 두 값을 같은 상수에서 파생시키면 함께 움직여 아무것도 잡지 못한다.
    const irp = calculateIrpTaxCredit({
      annualSalary: 50_000_000,
      pensionSavings: 6_000_000,
      irpContribution: 3_000_000,
    });
    expect(irp.taxCredit).toBe(1_350_000);
    expect(irp.taxCreditWithLocalTax).toBe(1_485_000);

    const rent = calculateMonthlyRentDeduction({
      annualSalary: 48_000_000,
      monthlyRent: 700_000,
      paidMonths: 12,
    });
    expect(rent.taxCredit).toBe(1_428_000);
    expect(rent.taxCreditWithLocalTax).toBe(1_570_800);
  });

  it("지방소득세 포함 절세액은 곱셈이 아니라 정수 연산이라 원 단위로 어긋나지 않는다", () => {
    // 조문 문언은 "공제되는 금액의 100분의 10"이므로 소득세 공제액(정수)에서 파생해야 한다.
    for (const credit of [1_350_000, 1_428_000, 1_224_000, 1_080_000, 999_999, 7]) {
      expect(withLocalIncomeTax(credit)).toBe(credit + Math.floor(credit / 10));
    }
  });

  it("IRP 세액공제는 한도 초과분을 따로 집계한다", () => {
    expect(
      calculateIrpTaxCredit({
        annualSalary: 80_000_000,
        pensionSavings: 6_000_000,
        irpContribution: 6_000_000,
      }).overflowAmount
    ).toBe(3_000_000);
  });

  it("사업주 부담금 total은 각 항목 합과 같다", () => {
    const result = calculateEmployerInsuranceBurden({
      monthlySalary: 3_200_000,
      employmentRatePercent: 0.9,
      accidentRatePercent: 1.5,
    });
    expect(result.totalMonthlyBurden).toBe(
      result.nationalPension +
        result.healthInsurance +
        result.longTermCare +
        result.employmentInsurance +
        result.industrialAccident
    );
  });
});
