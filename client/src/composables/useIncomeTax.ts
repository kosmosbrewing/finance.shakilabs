import { computed, toValue, type MaybeRefOrGetter } from "vue";
import {
  calcIncomeTaxBundle,
  type IncomeTaxBundle,
} from "@/utils/calculator";

export type IncomeTaxInput = {
  annualTaxableIncome: number;
  dependents: number;
  children: number;
  monthlyInsuranceTotal: number;
};

// 세액 계산 결과를 반응형으로 제공
export function useIncomeTax(
  input: MaybeRefOrGetter<IncomeTaxInput>
): { result: Readonly<{ value: IncomeTaxBundle }> } {
  const result = computed(() => calcIncomeTaxBundle(toValue(input)));
  return { result };
}
