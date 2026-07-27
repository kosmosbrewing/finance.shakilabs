import { computed, toValue, type MaybeRefOrGetter } from "vue";
import {
  calculateUnpaidWageInterest,
  type UnpaidWageInput,
} from "@/utils/unpaidWageCalculator";

export function useUnpaidWageCalc(input: MaybeRefOrGetter<UnpaidWageInput>) {
  return computed(() => calculateUnpaidWageInterest(toValue(input)));
}
