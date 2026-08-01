import { computed, onScopeDispose, ref, watch, type ComputedRef, type Ref } from "vue";
import { useSalaryCalc, type SalaryCalcResult } from "@/composables/useSalaryCalc";
import { clampNumber } from "@/utils/calculator";

// 홈 간이 계산기는 새 계산식을 두지 않는다. /salary(InsuranceView.vue)의 forward 모드가 쓰는
// useSalaryCalc를 같은 기본값으로 호출해, 같은 연봉이면 원 단위까지 같은 실수령액이 나오게 한다.
// 이 값이 /salary와 어긋나면 useHomeQuickCalc.test.ts가 실패한다.
export const HOME_QUICK_CALC_DEFAULTS = {
  annualGross: 40_000_000,
  dependents: 1,
  childrenUnder20: 0,
  nonTaxableMonthly: 200_000,
  retirementIncluded: false,
} as const;

export const HOME_QUICK_CALC_MIN_GROSS = 10_000_000;
export const HOME_QUICK_CALC_MAX_GROSS = 300_000_000;
export const HOME_QUICK_CALC_STEP = 1_000_000;
// 별도 계산 버튼 없이 입력이 멎으면 자동 재계산 (BOILERPLATE_FRONTEND.md UX 원칙)
export const HOME_QUICK_CALC_DEBOUNCE_MS = 300;

export type HomeQuickCalcResult = {
  // 사용자가 조작하는 즉시값 (입력창·슬라이더 표시용)
  annualGrossInput: Ref<number>;
  // 디바운스 후 계산에 반영된 값
  appliedAnnualGross: ComputedRef<number>;
  calc: SalaryCalcResult;
  monthlyNet: ComputedRef<number>;
  monthlyDeduction: ComputedRef<number>;
  effectiveTaxRate: ComputedRef<number>;
  setAnnualGross: (value: number) => void;
};

export function clampHomeAnnualGross(value: number): number {
  if (!Number.isFinite(value)) return HOME_QUICK_CALC_DEFAULTS.annualGross;
  return Math.floor(
    clampNumber(value, HOME_QUICK_CALC_MIN_GROSS, HOME_QUICK_CALC_MAX_GROSS)
  );
}

export function useHomeQuickCalc(): HomeQuickCalcResult {
  const annualGrossInput = ref<number>(HOME_QUICK_CALC_DEFAULTS.annualGross);

  const calc = useSalaryCalc({
    initialAnnualGross: HOME_QUICK_CALC_DEFAULTS.annualGross,
    initialDependents: HOME_QUICK_CALC_DEFAULTS.dependents,
    initialChildrenUnder20: HOME_QUICK_CALC_DEFAULTS.childrenUnder20,
    initialNonTaxableMonthly: HOME_QUICK_CALC_DEFAULTS.nonTaxableMonthly,
    initialRetirementIncluded: HOME_QUICK_CALC_DEFAULTS.retirementIncluded,
  });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  watch(annualGrossInput, (next) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      calc.annualGross.value = clampHomeAnnualGross(next);
      debounceTimer = null;
    }, HOME_QUICK_CALC_DEBOUNCE_MS);
  });

  onScopeDispose(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  function setAnnualGross(value: number): void {
    annualGrossInput.value = clampHomeAnnualGross(value);
  }

  return {
    annualGrossInput,
    appliedAnnualGross: computed(() => calc.annualGross.value),
    calc,
    monthlyNet: computed(() => calc.monthlyNet.value),
    // 보조 수치: 월 공제 합계(4대보험 + 소득세·지방소득세)도 엔진 값을 그대로 쓴다
    monthlyDeduction: computed(() => calc.totalDeduction.value),
    effectiveTaxRate: computed(() => calc.effectiveTaxRate.value),
    setAnnualGross,
  };
}
