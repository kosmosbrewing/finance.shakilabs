import { computed, watch } from "vue";
import { RATES_2026 } from "@/data/taxRates2026";
import { useSalaryCalc, type SalaryCalcResult } from "@/composables/useSalaryCalc";

type InsuranceReverseInput = {
  healthInsuranceFee: { value: number };
  dependents: { value: number };
  childrenUnder20: { value: number };
  nonTaxableMonthly: { value: number };
};

export type InsuranceReverseResult = {
  normalizedHealthInsuranceFee: Readonly<{ value: number }>;
  estimatedTaxableMonthly: Readonly<{ value: number }>;
  estimatedMonthlyGross: Readonly<{ value: number }>;
  estimatedAnnualGross: Readonly<{ value: number }>;
  calc: SalaryCalcResult;
};

// 건보료(근로자 부담분) 입력값으로 연봉을 계산
export function useInsuranceReverse(input: InsuranceReverseInput): InsuranceReverseResult {
  const normalizedHealthInsuranceFee = computed(() =>
    Math.max(0, Math.floor(input.healthInsuranceFee.value || 0))
  );

  const estimatedTaxableMonthly = computed(() => {
    const fee = normalizedHealthInsuranceFee.value;
    const rate = RATES_2026.healthInsurance.employee;
    const base = Math.floor(fee / rate);
    // Math.floor 역산 시 1원 오차 보정: base+1이 동일 건보료를 생성하면 채택
    if (Math.floor((base + 1) * rate) === fee) {
      return base + 1;
    }
    return base;
  });

  const estimatedMonthlyGross = computed(
    () => estimatedTaxableMonthly.value + Math.max(0, input.nonTaxableMonthly.value || 0)
  );

  const estimatedAnnualGross = computed(() => estimatedMonthlyGross.value * 12);

  const calc = useSalaryCalc({
    initialAnnualGross: estimatedAnnualGross.value,
    initialDependents: input.dependents.value,
    initialChildrenUnder20: input.childrenUnder20.value,
    initialNonTaxableMonthly: input.nonTaxableMonthly.value,
    initialRetirementIncluded: false,
  });

  // 계산값 변경 시 정방향 계산기에 동기화
  watch(
    [estimatedAnnualGross, () => input.dependents.value, () => input.childrenUnder20.value, () => input.nonTaxableMonthly.value],
    ([annualGross, dependents, childrenUnder20, nonTaxableMonthly]) => {
      calc.annualGross.value = annualGross;
      calc.dependents.value = dependents;
      calc.childrenUnder20.value = childrenUnder20;
      calc.nonTaxableMonthly.value = nonTaxableMonthly;
    },
    { immediate: true }
  );

  return {
    normalizedHealthInsuranceFee,
    estimatedTaxableMonthly,
    estimatedMonthlyGross,
    estimatedAnnualGross,
    calc,
  };
}
