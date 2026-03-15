import { watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { SalaryCalcResult } from "./useSalaryCalc";
import { isSameQuery } from "@/lib/routeState";
import {
  buildSalaryRouteQuery,
  parseSalaryRouteState,
} from "@/lib/salaryRouteState";

export function useUrlParams(calc: SalaryCalcResult): void {
  const route = useRoute();
  const router = useRouter();
  const initialized = ref(false);
  const applyingRoute = ref(false);

  watch(
    () => route.query,
    (query) => {
      applyingRoute.value = true;
      const nextState = parseSalaryRouteState(query);

      calc.annualGross.value = nextState.annualGross;
      calc.dependents.value = nextState.dependents;
      calc.childrenUnder20.value = nextState.childrenUnder20;
      calc.nonTaxableMonthly.value = nextState.nonTaxableMonthly;
      calc.retirementIncluded.value = nextState.retirementIncluded;

      initialized.value = true;
      applyingRoute.value = false;
    },
    { immediate: true }
  );

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

      const nextQuery = buildSalaryRouteQuery({
        annualGross: gross,
        dependents: dep,
        childrenUnder20: child,
        nonTaxableMonthly: nontax,
        retirementIncluded: retire,
      });

      if (isSameQuery(route.query, nextQuery)) return;
      router.replace({ query: nextQuery });
    },
    { flush: "post" }
  );
}
