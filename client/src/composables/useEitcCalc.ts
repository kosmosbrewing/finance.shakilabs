import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { calculateEitc, type EitcInput } from "@/utils/eitcCalculator";

export function useEitcCalc(input: MaybeRefOrGetter<EitcInput>) {
  return computed(() => calculateEitc(toValue(input)));
}
