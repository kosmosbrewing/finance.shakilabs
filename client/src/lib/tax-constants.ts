// 2026년 세율/요율 — UI 컴포넌트용 친화적 상수
import {
  TAX_YEAR,
  RATES_2026,
  LOCAL_INCOME_TAX_RATE,
} from "@/data/taxRates2026";

export { TAX_YEAR, LOCAL_INCOME_TAX_RATE };

export const NATIONAL_PENSION = {
  totalRate: RATES_2026.nationalPension.total,
  employeeRate: RATES_2026.nationalPension.employee,
  cap: RATES_2026.nationalPension.maxMonthlyIncome,
  floor: RATES_2026.nationalPension.minMonthlyIncome,
} as const;

export const HEALTH_INSURANCE = {
  totalRate: RATES_2026.healthInsurance.total,
  employeeRate: RATES_2026.healthInsurance.employee,
} as const;

export const LONG_TERM_CARE = {
  rateOfHealth: RATES_2026.longTermCare.rateOfHealth,
} as const;

export const EMPLOYMENT_INSURANCE = {
  employeeRate: RATES_2026.employmentInsurance.employee,
} as const;
