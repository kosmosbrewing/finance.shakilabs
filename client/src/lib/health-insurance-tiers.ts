export const EMPLOYEE_HEALTH_INSURANCE_RATE = 0.03595;

export const HEALTH_INSURANCE_EXAMPLES = [
  { annualRemuneration: 24_000_000, monthlyPremium: 71_900 },
  { annualRemuneration: 36_000_000, monthlyPremium: 107_850 },
  { annualRemuneration: 48_000_000, monthlyPremium: 143_800 },
  { annualRemuneration: 60_000_000, monthlyPremium: 179_750 },
  { annualRemuneration: 72_000_000, monthlyPremium: 215_700 },
  { annualRemuneration: 100_000_000, monthlyPremium: 299_583 },
] as const;

export function estimateAnnualRemuneration(monthlyPremium: number): number {
  if (!Number.isFinite(monthlyPremium) || monthlyPremium <= 0) return 0;
  const estimate = (monthlyPremium / EMPLOYEE_HEALTH_INSURANCE_RATE) * 12;
  return Math.round(estimate / 10_000) * 10_000;
}
