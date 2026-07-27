import { UNPAID_WAGE_2026, type UnpaidWageStage } from "@/data/unpaidWage";

export type UnpaidWageInput = {
  unpaidAmount: number;
  overdueDays: number;
  stage: UnpaidWageStage;
};

export type UnpaidWageResult = {
  annualRate: number;
  effectiveDays: number;
  dailyInterest: number;
  totalInterest: number;
  totalWithPrincipal: number;
  monthlyEquivalent: number;
};

export function calculateUnpaidWageInterest(input: UnpaidWageInput): UnpaidWageResult {
  const amount = Math.max(0, input.unpaidAmount);
  const days = Math.max(0, Math.floor(input.overdueDays));
  const annualRate = UNPAID_WAGE_2026.rates[input.stage];
  // 퇴직 단계는 금품청산 유예 14일을 제외한 날부터 이자가 발생한다
  const effectiveDays = input.stage === "retired"
    ? Math.max(0, days - UNPAID_WAGE_2026.retiredGraceDays)
    : days;

  const dailyInterest = Math.floor((amount * annualRate) / 365);
  const totalInterest = Math.floor((amount * annualRate * effectiveDays) / 365);

  return {
    annualRate,
    effectiveDays,
    dailyInterest,
    totalInterest,
    totalWithPrincipal: amount + totalInterest,
    monthlyEquivalent: Math.floor((amount * annualRate) / 12),
  };
}
