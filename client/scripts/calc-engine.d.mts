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
