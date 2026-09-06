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
export function regionalHealthEstimate(monthlyIncome: number): {
  regionalIncomeOnly: number;
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
