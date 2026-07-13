<script setup lang="ts">
import { computed } from "vue";
import { ShBreakdownBar } from "@shakilabs/ui";
import { formatWon } from "@/lib/utils";
import type { OvertimeResult } from "@/utils/scenarioCalculator";

const props = defineProps<{
  result: OvertimeResult;
}>();

const segments = computed(() => [
  { key: "overtime", label: "연장", value: props.result.overtimePay, color: "hsl(var(--chart-pension))" },
  { key: "night", label: "야간 가산", value: props.result.nightPay, color: "hsl(var(--chart-care))" },
  { key: "holiday", label: "휴일", value: props.result.holidayPay, color: "hsl(var(--chart-employment))" },
]);
</script>

<template>
  <div class="space-y-2">
    <ShBreakdownBar
      :segments="segments"
      label="연장 야간 휴일수당 구성"
      :format-value="formatWon"
    />
  </div>
</template>
