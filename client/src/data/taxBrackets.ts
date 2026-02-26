// 근로소득공제 구간
export const EARNED_INCOME_DEDUCTION_BRACKETS = [
  { limit: 5_000_000, rate: 0.7, baseDeduction: 0, baseSalary: 0 },
  { limit: 15_000_000, rate: 0.4, baseDeduction: 3_500_000, baseSalary: 5_000_000 },
  { limit: 45_000_000, rate: 0.15, baseDeduction: 7_500_000, baseSalary: 15_000_000 },
  { limit: 100_000_000, rate: 0.05, baseDeduction: 12_000_000, baseSalary: 45_000_000 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.02, baseDeduction: 14_750_000, baseSalary: 100_000_000 },
] as const;

// 종합소득세 세율 구간
export const INCOME_TAX_BRACKETS = [
  { limit: 14_000_000, rate: 0.06, progressiveTax: 0, baseIncome: 0 },
  { limit: 50_000_000, rate: 0.15, progressiveTax: 840_000, baseIncome: 14_000_000 },
  { limit: 88_000_000, rate: 0.24, progressiveTax: 6_240_000, baseIncome: 50_000_000 },
  { limit: 150_000_000, rate: 0.35, progressiveTax: 15_360_000, baseIncome: 88_000_000 },
  { limit: 300_000_000, rate: 0.38, progressiveTax: 37_060_000, baseIncome: 150_000_000 },
  { limit: 500_000_000, rate: 0.4, progressiveTax: 94_060_000, baseIncome: 300_000_000 },
  { limit: 1_000_000_000, rate: 0.42, progressiveTax: 174_060_000, baseIncome: 500_000_000 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.45, progressiveTax: 384_060_000, baseIncome: 1_000_000_000 },
] as const;
