import { computed, ref, type ComputedRef, type Ref } from "vue";
import {
  calculateSalaryBreakdown,
  type SalaryBreakdown,
} from "@/utils/calculator";

export type UseSalaryCalcOptions = {
  initialAnnualGross?: number;
  initialDependents?: number;
  initialChildrenUnder20?: number;
  initialNonTaxableMonthly?: number;
  initialRetirementIncluded?: boolean;
};

export type SalaryCalcResult = {
  // 입력
  annualGross: Ref<number>;
  dependents: Ref<number>;
  childrenUnder20: Ref<number>;
  nonTaxableMonthly: Ref<number>;
  retirementIncluded: Ref<boolean>;

  // 핵심 결과
  monthlyGross: ComputedRef<number>;
  taxableMonthly: ComputedRef<number>;
  monthlyNet: ComputedRef<number>;
  annualNet: ComputedRef<number>;
  effectiveTaxRate: ComputedRef<number>;

  // 4대보험 (월)
  nationalPension: ComputedRef<number>;
  healthInsurance: ComputedRef<number>;
  longTermCare: ComputedRef<number>;
  employmentInsurance: ComputedRef<number>;
  totalInsurance: ComputedRef<number>;

  // 세금 (월)
  monthlyIncomeTax: ComputedRef<number>;
  monthlyLocalTax: ComputedRef<number>;
  totalTax: ComputedRef<number>;

  // 공제/중간계산
  childTaxCredit: ComputedRef<number>;
  standardTaxCredit: ComputedRef<number>;
  totalDeduction: ComputedRef<number>;
  annualTaxableIncome: ComputedRef<number>;
  earnedIncomeDeduction: ComputedRef<number>;
  personalDeduction: ComputedRef<number>;
  annualInsuranceDeduction: ComputedRef<number>;
  taxableBase: ComputedRef<number>;
  calculatedTax: ComputedRef<number>;
  taxCredit: ComputedRef<number>;
  determinedTax: ComputedRef<number>;
  annualLocalTax: ComputedRef<number>;

  // 사업주 부담액
  employerCost: ComputedRef<SalaryBreakdown["employerCost"]>;
};

// 기존 화면과 호환되는 실수령액 계산 composable
export function useSalaryCalc(options: UseSalaryCalcOptions = {}): SalaryCalcResult {
  const annualGross = ref(options.initialAnnualGross ?? 30_000_000);
  const dependents = ref(options.initialDependents ?? 1);
  const childrenUnder20 = ref(options.initialChildrenUnder20 ?? 0);
  const nonTaxableMonthly = ref(options.initialNonTaxableMonthly ?? 200_000);
  const retirementIncluded = ref(options.initialRetirementIncluded ?? false);

  const result = computed(() =>
    calculateSalaryBreakdown({
      grossAnnual: annualGross.value,
      nonTaxableMonthly: nonTaxableMonthly.value,
      dependents: dependents.value,
      children: childrenUnder20.value,
      retirementIncluded: retirementIncluded.value,
    })
  );

  return {
    annualGross,
    dependents,
    childrenUnder20,
    nonTaxableMonthly,
    retirementIncluded,
    monthlyGross: computed(() => result.value.monthlyGross),
    taxableMonthly: computed(() => result.value.taxableMonthly),
    monthlyNet: computed(() => result.value.monthlyNet),
    annualNet: computed(() => result.value.annualNet),
    effectiveTaxRate: computed(() => result.value.effectiveTaxRate),
    nationalPension: computed(() => result.value.nationalPension),
    healthInsurance: computed(() => result.value.healthInsurance),
    longTermCare: computed(() => result.value.longTermCare),
    employmentInsurance: computed(() => result.value.employmentInsurance),
    totalInsurance: computed(() => result.value.totalInsurance),
    monthlyIncomeTax: computed(() => result.value.monthlyIncomeTax),
    monthlyLocalTax: computed(() => result.value.monthlyLocalTax),
    totalTax: computed(() => result.value.totalTax),
    childTaxCredit: computed(() => result.value.childTaxCredit),
    standardTaxCredit: computed(() => result.value.standardTaxCredit),
    totalDeduction: computed(() => result.value.totalDeduction),
    annualTaxableIncome: computed(() => result.value.annualTaxableIncome),
    earnedIncomeDeduction: computed(() => result.value.earnedIncomeDeduction),
    personalDeduction: computed(() => result.value.personalDeduction),
    annualInsuranceDeduction: computed(() => result.value.annualInsuranceDeduction),
    taxableBase: computed(() => result.value.taxableBase),
    calculatedTax: computed(() => result.value.calculatedTax),
    taxCredit: computed(() => result.value.taxCredit),
    determinedTax: computed(() => result.value.determinedTax),
    annualLocalTax: computed(() => result.value.annualLocalTax),
    employerCost: computed(() => result.value.employerCost),
  };
}
