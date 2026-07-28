import { DEPENDENT_2026 } from "@/data/dependentEligibility";

export type DependentInput = {
  annualIncome: number;
  propertyTaxBase: number;
  hasBusinessRegistration: boolean;
  businessIncome: number;
};

export type DependentResult = {
  isEligible: boolean;
  failReasons: string[];
  appliedIncomeLimit: number;
  incomeMargin: number;
  nextPropertyThreshold: number;
  propertyMargin: number;
};

// 피부양자 자격 간이 판정 — 소득·재산·사업소득 3계열 요건만 검사한다.
// 부양요건(가족관계)·형제자매 특례는 범위 밖이므로 화면에서 전제를 명시한다.
export function evaluateDependentEligibility(input: DependentInput): DependentResult {
  const income = Math.max(0, input.annualIncome);
  const property = Math.max(0, input.propertyTaxBase);
  const businessIncome = Math.max(0, input.businessIncome);
  const failReasons: string[] = [];

  if (input.hasBusinessRegistration && businessIncome > 0) {
    failReasons.push("사업자등록이 있으면 사업소득이 있을 때 자격을 잃습니다.");
  } else if (
    !input.hasBusinessRegistration
    && businessIncome > DEPENDENT_2026.unregisteredBusinessIncomeLimit
  ) {
    failReasons.push("사업자등록이 없어도 연 사업소득 500만원을 초과하면 자격을 잃습니다.");
  }

  if (income > DEPENDENT_2026.incomeLimit) {
    failReasons.push("연 합산소득이 2,000만원을 초과했습니다.");
  }

  if (property > DEPENDENT_2026.propertyHighThreshold) {
    failReasons.push("재산세 과세표준이 9억원을 초과하면 소득과 무관하게 자격을 잃습니다.");
  } else if (
    property > DEPENDENT_2026.propertyMidThreshold
    && income > DEPENDENT_2026.midPropertyIncomeLimit
  ) {
    failReasons.push("재산세 과세표준 5억4천만원 초과 구간에서는 연 소득 1,000만원까지만 자격이 유지됩니다.");
  }

  const appliedIncomeLimit = property > DEPENDENT_2026.propertyMidThreshold
    ? DEPENDENT_2026.midPropertyIncomeLimit
    : DEPENDENT_2026.incomeLimit;
  const nextPropertyThreshold = property <= DEPENDENT_2026.propertyMidThreshold
    ? DEPENDENT_2026.propertyMidThreshold
    : DEPENDENT_2026.propertyHighThreshold;

  return {
    isEligible: failReasons.length === 0,
    failReasons,
    appliedIncomeLimit,
    incomeMargin: appliedIncomeLimit - income,
    nextPropertyThreshold,
    propertyMargin: nextPropertyThreshold - property,
  };
}
