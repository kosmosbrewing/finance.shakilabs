import { computed, toValue, type MaybeRefOrGetter } from "vue";

export type SurvivalInput = {
  availableFund: number;
  monthlyFixedCost: number;
  monthlyLivingCost: number;
};

const LIVING_COST_SCENARIOS = [2_000_000, 2_500_000, 3_000_000, 4_000_000] as const;

// 퇴사 후 버틸 수 있는 기간 계산
export function useSurvivalCalc(input: MaybeRefOrGetter<SurvivalInput>) {
  return computed(() => {
    const resolved = toValue(input);

    const availableFund = Math.max(0, Math.floor(resolved.availableFund));
    const monthlyFixedCost = Math.max(0, Math.floor(resolved.monthlyFixedCost));
    const monthlyLivingCost = Math.max(0, Math.floor(resolved.monthlyLivingCost));

    const monthlySpend = monthlyLivingCost + monthlyFixedCost;
    const survivalMonths = monthlySpend > 0 ? availableFund / monthlySpend : 0;

    const scenarios = LIVING_COST_SCENARIOS.map((livingCost) => {
      const spend = livingCost + monthlyFixedCost;
      const months = spend > 0 ? availableFund / spend : 0;
      return {
        livingCost,
        spend,
        months,
      };
    });

    return {
      availableFund,
      monthlyFixedCost,
      monthlyLivingCost,
      monthlySpend,
      survivalMonths,
      scenarios,
    };
  });
}
