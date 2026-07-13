<script setup lang="ts">
import { computed } from "vue";
import { ShBreakdownBar } from "@shakilabs/ui";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { buildSalaryDeductionSegments } from "@/components/salary/salaryChartSegments";

const props = defineProps<{
  calc: SalaryCalcResult;
  healthInsurance?: number;
}>();

const segments = computed(() =>
  buildSalaryDeductionSegments({
    nationalPension: props.calc.nationalPension.value,
    healthInsurance: props.healthInsurance ?? props.calc.healthInsurance.value,
    longTermCare: props.calc.longTermCare.value,
    employmentInsurance: props.calc.employmentInsurance.value,
    incomeTax: props.calc.monthlyIncomeTax.value,
    localTax: props.calc.monthlyLocalTax.value,
  }),
);
</script>

<template>
  <ShBreakdownBar label="월 공제 구성" :segments="segments" />
</template>
