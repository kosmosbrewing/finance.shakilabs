import { watch, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { SalaryCalcResult } from "./useSalaryCalc";

// URL 쿼리파라미터와 계산기 입력값 동기화
// ?gross=50000000&dep=2&child=1&nontax=200000&retire=1
export function useUrlParams(calc: SalaryCalcResult): void {
  const route = useRoute();
  const router = useRouter();
  const initialized = ref(false);

  // URL → 입력값 복원 (마운트 시 1회)
  onMounted(() => {
    const q = route.query;

    if (q.gross) {
      const v = parseInt(String(q.gross), 10);
      if (!Number.isNaN(v) && v > 0 && v <= 10_000_000_000) {
        calc.annualGross.value = v;
      }
    }
    if (q.dep) {
      const v = parseInt(String(q.dep), 10);
      if (!Number.isNaN(v) && v >= 1 && v <= 20) {
        calc.dependents.value = v;
      }
    }
    if (q.child) {
      const v = parseInt(String(q.child), 10);
      if (!Number.isNaN(v) && v >= 0 && v <= 20) {
        calc.childrenUnder20.value = v;
      }
    }
    if (q.nontax) {
      const v = parseInt(String(q.nontax), 10);
      if (!Number.isNaN(v) && v >= 0 && v <= 5_000_000) {
        calc.nonTaxableMonthly.value = v;
      }
    }
    if (q.retire) {
      const v = String(q.retire);
      calc.retirementIncluded.value = v === "1" || v === "true";
    }

    // 자녀 수는 부양가족(본인 포함) - 1을 초과할 수 없음
    const maxChildren = Math.max(0, calc.dependents.value - 1);
    if (calc.childrenUnder20.value > maxChildren) {
      calc.childrenUnder20.value = maxChildren;
    }

    initialized.value = true;
  });

  // 입력값 변경 → URL 업데이트 (기본값은 생략)
  watch(
    [
      calc.annualGross,
      calc.dependents,
      calc.childrenUnder20,
      calc.nonTaxableMonthly,
      calc.retirementIncluded,
    ],
    ([gross, dep, child, nontax, retire]) => {
      if (!initialized.value) return;

      const query: Record<string, string> = {};

      if (gross !== 30_000_000) query.gross = String(gross);
      if (dep !== 1) query.dep = String(dep);
      if (child !== 0) query.child = String(child);
      if (nontax !== 200_000) query.nontax = String(nontax);
      if (retire) query.retire = "1";

      router.replace({ query });
    },
    { flush: "post" }
  );
}
