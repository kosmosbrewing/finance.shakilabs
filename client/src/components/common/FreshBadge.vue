<script setup lang="ts">
import { computed } from "vue";
import { CheckCircle2 } from "lucide-vue-next";
import { RATES_2026, TAX_YEAR } from "@/data/taxRates2026";

const props = defineProps<{
  message?: string;
}>();

const defaultMessage = computed(
  () =>
    `${TAX_YEAR}년 기준 (국민연금 ${(RATES_2026.nationalPension.total * 100).toFixed(1)}%, 건강보험 ${(RATES_2026.healthInsurance.total * 100).toFixed(2)}%)`
);
</script>

<template>
  <span class="inline-flex items-center gap-2 rounded border border-primary/35 bg-primary/10 px-2.5 py-1 text-caption font-bold text-primary">
    <CheckCircle2 class="h-3.5 w-3.5" />
    {{ props.message ?? defaultMessage }}
  </span>
</template>
