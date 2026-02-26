import { computed, toValue, type MaybeRefOrGetter } from "vue";
import {
  calcInsuranceDeduction,
  type InsuranceDeduction,
} from "@/utils/calculator";

// 월 과세급여 기준 4대보험 계산 composable
export function useInsuranceCalc(
  taxableMonthly: MaybeRefOrGetter<number>
): { result: Readonly<{ value: InsuranceDeduction }> } {
  const result = computed(() =>
    calcInsuranceDeduction(Math.max(0, Math.floor(toValue(taxableMonthly))))
  );

  return { result };
}
