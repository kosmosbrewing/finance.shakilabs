import { watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { SalaryCalcResult } from "./useSalaryCalc";
import {
  buildQuery,
  isSameQuery,
  parseQueryBoolean,
  parseQueryInt,
} from "@/lib/routeState";

// URL 쿼리파라미터와 계산기 입력값 동기화
// ?gross=50000000&dep=2&child=1&nontax=200000&retire=1
export function useUrlParams(calc: SalaryCalcResult): void {
  const route = useRoute();
  const router = useRouter();
  const initialized = ref(false);
  const applyingRoute = ref(false);

  // URL → 입력값 복원 (초기 + 라우트 변경 시)
  watch(
    () => route.query,
    (query) => {
      applyingRoute.value = true;

      const gross = parseQueryInt(query.gross);
      if (gross !== null && gross > 0 && gross <= 10_000_000_000) {
        calc.annualGross.value = gross;
      }

      const dep = parseQueryInt(query.dep);
      if (dep !== null && dep >= 1 && dep <= 20) {
        calc.dependents.value = dep;
      }

      const child = parseQueryInt(query.child);
      if (child !== null && child >= 0 && child <= 20) {
        calc.childrenUnder20.value = child;
      }

      const nonTax = parseQueryInt(query.nontax);
      if (nonTax !== null && nonTax >= 0 && nonTax <= 5_000_000) {
        calc.nonTaxableMonthly.value = nonTax;
      }

      calc.retirementIncluded.value = parseQueryBoolean(query.retire, false);

      // 자녀 수는 부양가족(본인 포함) - 1을 초과할 수 없음
      const maxChildren = Math.max(0, calc.dependents.value - 1);
      if (calc.childrenUnder20.value > maxChildren) {
        calc.childrenUnder20.value = maxChildren;
      }

      initialized.value = true;
      applyingRoute.value = false;
    },
    { immediate: true }
  );

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
      if (!initialized.value || applyingRoute.value) return;

      const nextQuery = buildQuery({
        gross: gross !== 30_000_000 ? gross : null,
        dep: dep !== 1 ? dep : null,
        child: child !== 0 ? child : null,
        nontax: nontax !== 200_000 ? nontax : null,
        retire: retire ? 1 : null,
      });

      if (isSameQuery(route.query, nextQuery)) return;
      router.replace({ query: nextQuery });
    },
    { flush: "post" }
  );
}
