// Type surface for the prerender calc engine, consumed by src/utils/calcEngineParity.test.ts.
// Only the exports the parity gate compares are declared — the engine itself stays plain .mjs
// because prerender scripts run under bare node with no build step.
export function severanceIncomeTax(severancePay: number, years: number): number;
export function severanceYearDeduction(years: number): number;
export function severancePayEstimate(years: number): {
  avgWage: number;
  severance: number;
  yearDeduction: number;
  estimatedTax: number;
  netSeverance: number;
};
export function calcEarnedIncomeDeduction(annualSalary: number): number;
export function calcIncomeTax(taxableIncome: number): number;
export function calcInsuranceDeduction(taxableMonthly: number): {
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentInsurance: number;
  totalInsurance: number;
};
export function calculateSalaryBreakdown(input: {
  grossAnnual: number;
  nonTaxableMonthly: number;
  dependents: number;
  children: number;
  retirementIncluded: boolean;
}): Record<string, number>;

// --- exports the digest recalculation gate (src/utils/digestFigures.test.ts) reads ---
export const RATES_2026: {
  nationalPension: { total: number; employee: number; employer: number; minMonthlyIncome: number; maxMonthlyIncome: number };
  healthInsurance: { total: number; employee: number; employer: number };
  longTermCare: { rateOfHealth: number };
  employmentInsurance: { employee: number; employer: number };
};
export const UNEMPLOYMENT_DAILY_MAX: number;
export const UNEMPLOYMENT_DAILY_MIN: number;
export const MONTHLY_HOURS_WITH_HOLIDAY: number;
export const WEEKS_PER_MONTH: number;
export function formatWon(value: number): string;
export function parentalLeavePay(monthlyWage: number): {
  pay1_3: number;
  pay4_6: number;
  pay7_12: number;
  total: number;
};
export const VOLUNTARY_CONTINUATION_REDUCTION: number;
export const REGIONAL_HEALTH_MIN_MONTHLY: number;
export function regionalHealthEstimate(monthlyIncome: number): {
  regionalIncomeOnly: number;
  voluntaryGross: number;
  formerEmployed: number;
};
export function unpaidWageInterest(amount: number, rate: number, days: number): number;
export function wageConversion(hourly: number): {
  dailyWage: number;
  weeklyBase: number;
  weeklyTotal: number;
  monthlyTotal: number;
  annualTotal: number;
};
export function yearEndStandardScenario(grossAnnual: number): {
  breakdown: Record<string, number>;
  determinedTax: number;
  extraDeduction: number;
  bracket: { limit: number; rate: number; progressiveTax: number; baseIncome: number };
  marginalRate: number;
  uncappedRefund: number;
  refund: number;
};
export type EitcBracket = {
  label: string;
  phaseInEnd: number;
  plateauEnd: number;
  phaseOutEnd: number;
  maxAmount: number;
};
export const EITC_BRACKET_TABLE: Record<"single" | "single-income" | "double-income", EitcBracket>;
export function eitcAmountFor(income: number, bracket: EitcBracket): number;

// --- 연금계좌·국민연금 (digestFigures.test.ts / hub-digests-retirement.mjs) ---
export function calcIrpTaxCredit(input: {
  annualSalary: number;
  pensionSavings: number;
  irpContribution: number;
}): {
  taxCreditRate: number;
  recognizedPensionSavings: number;
  recognizedIrp: number;
  recognizedContribution: number;
  overflowAmount: number;
  taxCredit: number;
  taxCreditWithLocalTax: number;
};
export function calcPensionEstimate(input: {
  averageMonthlyIncome: number;
  insuredYears: number;
  claimAge: number;
}): {
  ageFactor: number;
  recognizedYears: number;
  eligible: boolean;
  contributionBase: number;
  cappedByStandardIncomeLimit: boolean;
  estimatedMonthlyPension: number;
  estimatedAnnualPension: number;
  /** 사업장가입자 기여금(본인 부담, 2026년 4.75%) */
  employeeContribution: number;
  /** 기여금 + 사용자 부담금(2026년 9.5%). 지역가입자는 이 금액 전부를 본인이 부담한다. */
  totalContribution: number;
};
export function withLocalIncomeTax(incomeTaxCredit: number): number;
export const PENSION_AGE_FACTORS: Record<number, number>;
export const SIMPLE_EXPENSE_RATE_BASE: number;

// --- 가이드/비교 승격 산문이 인용하는 나머지 표면 (src/utils/guideDigestFigures.test.ts) ---
export function calcIncomeTaxBundle(input: {
  annualTaxableIncome: number;
  dependents: number;
  children: number;
  monthlyInsuranceTotal: number;
}): Record<string, number>;
export function unemploymentDailyAllowance(monthlyWage: number): {
  avgDailyWage: number;
  rawDaily: number;
  dailyAmount: number;
};
export function weeklyHolidayPayForHours(
  hourlyWage: number,
  weeklyHours: number,
): {
  weeklyHours: number;
  isEligible: boolean;
  weeklyHolidayPay: number;
  weeklyWage: number;
  effectiveHourlyWage: number;
  estimatedMonthlyPay: number;
  monthlyPayWithout: number;
  monthlyDifference: number;
};
export function getAnnualLeaveDays(monthsWorked: number): number;
export function calcAnnualLeavePay(input: {
  monthlySalary: number;
  fixedAllowance: number;
  monthsWorked: number;
  unusedLeaveDays: number;
}): {
  ordinaryMonthly: number;
  dailyOrdinaryWage: number;
  accruedLeaveDays: number;
  payableDays: number;
  totalAllowance: number;
};
export function calcMonthlyRentDeduction(input: {
  annualSalary: number;
  monthlyRent: number;
  paidMonths: number;
}): {
  deductionRate: number;
  yearlyRent: number;
  recognizedRent: number;
  taxCredit: number;
  taxCreditWithLocalTax: number;
  monthlyRefundEffect: number;
  eligible: boolean;
};
export function calcRaiseImpact(input: { currentAnnual: number; raisePercent: number }): {
  current: Record<string, number>;
  next: Record<string, number>;
  raiseAmount: number;
  monthlyNetDiff: number;
  annualNetDiff: number;
  insuranceDelta: number;
  taxDelta: number;
};
export function calcBonusImpact(input: { annualSalary: number; bonusAmount: number }): {
  base: Record<string, number>;
  withBonus: Record<string, number>;
  netBonus: number;
  effectiveBonusRate: number;
  bonusTax: number;
};
export function formatPercent(value: number, digits?: number): string;
