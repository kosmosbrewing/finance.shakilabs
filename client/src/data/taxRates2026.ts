// 2026년 4대보험 요율 상수
export const TAX_YEAR = 2026;

export const RATES_2026 = {
  nationalPension: {
    total: 0.095,
    employee: 0.0475,
    employer: 0.0475,
    minMonthlyIncome: 400_000,
    maxMonthlyIncome: 6_370_000,
  },
  healthInsurance: {
    total: 0.0719,
    employee: 0.03595,
    employer: 0.03595,
  },
  longTermCare: {
    rateOfHealth: 0.1314,
  },
  employmentInsurance: {
    employee: 0.009,
    employer: 0.009,
  },
} as const;

// 근로소득세액공제 한도 (소득세법 제59조②)
// 근거: https://law.go.kr/법령/소득세법/제59조
// ×1/2 적용으로 7,032만·1.206억 부근에서 하한에 급도달(cliff) — 법 조문 원문 그대로임
// 검증: 3,300만→74만, 4,300만→66만(floor), 7,032만→50만(floor), 1.206억→20만(floor)
export function getEarnedIncomeTaxCreditLimit(totalSalary: number): number {
  if (totalSalary <= 33_000_000) return 740_000;
  if (totalSalary <= 70_000_000) {
    // 74만 - (총급여 - 3,300만) × 8/1000, 하한 66만
    return Math.max(660_000, 740_000 - (totalSalary - 33_000_000) * 0.008);
  }
  if (totalSalary <= 120_000_000) {
    // 66만 - (총급여 - 7,000만) × 1/2, 하한 50만
    return Math.max(500_000, 660_000 - Math.floor((totalSalary - 70_000_000) / 2));
  }
  // 50만 - (총급여 - 1.2억) × 1/2, 하한 20만
  return Math.max(200_000, 500_000 - Math.floor((totalSalary - 120_000_000) / 2));
}

// 인적공제/지방소득세/표준세액공제
export const PERSONAL_DEDUCTION_PER_PERSON = 1_500_000;
export const LOCAL_INCOME_TAX_RATE = 0.1;
export const STANDARD_TAX_CREDIT = 130_000;

export const CHILD_TAX_CREDIT = {
  oneChild: 250_000,
  twoChildren: 550_000,
  extraPerChildOverTwo: 400_000,
} as const;
