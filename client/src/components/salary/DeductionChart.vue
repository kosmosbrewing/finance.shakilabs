<script setup lang="ts">
import { computed } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import BreakdownDonut from "@/components/result-visualization/BreakdownDonut.vue";
import { buildSalaryDeductionSegments } from "@/components/salary/salaryChartSegments";
import { formatWon } from "@/lib/utils";

const props = defineProps<{
  calc: SalaryCalcResult;
}>();

const segments = computed(() => {
  if (props.calc.monthlyGross.value <= 0) return [];

  return [
    {
      key: "net",
      label: "실수령액",
      value: props.calc.monthlyNet.value,
      color: "hsl(var(--chart-net))",
    },
    ...buildSalaryDeductionSegments({
      nationalPension: props.calc.nationalPension.value,
      healthInsurance: props.calc.healthInsurance.value,
      longTermCare: props.calc.longTermCare.value,
      employmentInsurance: props.calc.employmentInsurance.value,
      incomeTax: props.calc.monthlyIncomeTax.value,
      localTax: props.calc.monthlyLocalTax.value,
    }),
  ];
});
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">월 급여 구성</h2>
    </div>
    <div class="retro-panel-content">
      <BreakdownDonut
        :segments="segments"
        label="월 급여 구성 도넛 차트"
        center-label="월 급여"
        :center-value="formatWon(calc.monthlyGross.value)"
        empty-message="연봉을 입력하면 차트가 표시됩니다."
      />
    </div>
  </section>
</template>
