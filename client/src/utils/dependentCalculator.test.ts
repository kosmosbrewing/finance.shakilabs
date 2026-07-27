import { describe, expect, it } from "vitest";
import { evaluateDependentEligibility } from "./dependentCalculator";

const base = {
  annualIncome: 10_000_000,
  propertyTaxBase: 300_000_000,
  hasBusinessRegistration: false,
  businessIncome: 0,
};

describe("evaluateDependentEligibility", () => {
  it("기본 시나리오는 자격을 유지한다", () => {
    const result = evaluateDependentEligibility(base);
    expect(result.isEligible).toBe(true);
    expect(result.failReasons).toHaveLength(0);
    expect(result.appliedIncomeLimit).toBe(20_000_000);
  });

  it("합산소득 2,000만원 정확히는 유지, 1원 초과는 탈락", () => {
    expect(evaluateDependentEligibility({ ...base, annualIncome: 20_000_000 }).isEligible).toBe(true);
    expect(evaluateDependentEligibility({ ...base, annualIncome: 20_000_001 }).isEligible).toBe(false);
  });

  it("재산과표 9억원 정확히는 유지, 초과는 소득과 무관하게 탈락", () => {
    expect(
      evaluateDependentEligibility({ ...base, annualIncome: 0, propertyTaxBase: 900_000_000 }).isEligible,
    ).toBe(true);
    expect(
      evaluateDependentEligibility({ ...base, annualIncome: 0, propertyTaxBase: 900_000_001 }).isEligible,
    ).toBe(false);
  });

  it("재산과표 5.4억 초과 구간은 소득 1,000만원 기준을 적용한다", () => {
    const midProperty = { ...base, propertyTaxBase: 600_000_000 };
    expect(evaluateDependentEligibility({ ...midProperty, annualIncome: 10_000_000 }).isEligible).toBe(true);
    expect(evaluateDependentEligibility({ ...midProperty, annualIncome: 10_000_001 }).isEligible).toBe(false);
    expect(evaluateDependentEligibility(midProperty).appliedIncomeLimit).toBe(10_000_000);
  });

  it("사업자등록이 있으면 사업소득 1원에도 탈락한다", () => {
    expect(
      evaluateDependentEligibility({ ...base, hasBusinessRegistration: true, businessIncome: 1 }).isEligible,
    ).toBe(false);
    expect(
      evaluateDependentEligibility({ ...base, hasBusinessRegistration: true, businessIncome: 0 }).isEligible,
    ).toBe(true);
  });

  it("미등록 사업소득은 500만원 정확히는 유지, 초과는 탈락", () => {
    expect(evaluateDependentEligibility({ ...base, businessIncome: 5_000_000 }).isEligible).toBe(true);
    expect(evaluateDependentEligibility({ ...base, businessIncome: 5_000_001 }).isEligible).toBe(false);
  });

  it("여유 마진을 계산한다", () => {
    const result = evaluateDependentEligibility(base);
    expect(result.incomeMargin).toBe(10_000_000);
    expect(result.propertyMargin).toBe(240_000_000);
    expect(result.nextPropertyThreshold).toBe(540_000_000);
  });
});
