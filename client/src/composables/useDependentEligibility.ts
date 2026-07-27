import { computed, toValue, type MaybeRefOrGetter } from "vue";
import {
  evaluateDependentEligibility,
  type DependentInput,
} from "@/utils/dependentCalculator";

export function useDependentEligibility(input: MaybeRefOrGetter<DependentInput>) {
  return computed(() => evaluateDependentEligibility(toValue(input)));
}
