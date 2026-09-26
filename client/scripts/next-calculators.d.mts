// Type surface for the shared "next calculator" card copy, consumed by
// src/components/finance/FinanceNextActions.vue and the prerender content builder.
export type NextCalculatorKey =
  | "regional-health"
  | "regional-health-voluntary"
  | "dependent"
  | "salary"
  | "insurance"
  | "comprehensive-tax"
  | "year-end-settlement";

export interface NextCalculatorCard {
  route: string;
  title: string;
  /** 미리 계산 값이 없는 카드의 한 줄 요약(값이 있는 카드는 화면이 값의 가정을 note로 붙인다). */
  note?: string;
}

export interface NextCalculatorState {
  mode: "insurance" | "salary";
  healthInsuranceFee?: number;
  annualGross?: number;
  dependents?: number;
}

export const NEXT_CALCULATORS_HEADING: string;
export const NEXT_CALCULATOR_CARDS: Record<NextCalculatorKey, NextCalculatorCard>;
export const HIGH_FEE_THRESHOLD: number;
export const HIGH_GROSS_THRESHOLD: number;
export function pickNextCalculators(state: NextCalculatorState): NextCalculatorKey[];
export const INSURANCE_DEFAULT_STATE: NextCalculatorState;
