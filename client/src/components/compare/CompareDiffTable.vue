<script setup lang="ts">
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatWon } from "@/lib/utils";

const props = defineProps<{
  calcA: SalaryCalcResult;
  calcB: SalaryCalcResult;
}>();

const items = [
  { label: "국민연금", a: "nationalPension", b: "nationalPension" },
  { label: "건강보험", a: "healthInsurance", b: "healthInsurance" },
  { label: "장기요양보험", a: "longTermCare", b: "longTermCare" },
  { label: "고용보험", a: "employmentInsurance", b: "employmentInsurance" },
  { label: "소득세", a: "monthlyIncomeTax", b: "monthlyIncomeTax" },
  { label: "지방소득세", a: "monthlyLocalTax", b: "monthlyLocalTax" },
] as const;

function diffClass(delta: number): string {
  if (delta > 0) return "text-status-danger";
  if (delta < 0) return "text-status-success";
  return "";
}
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">공제 항목 차이</h2>
      <span class="retro-kbd">DIFF</span>
    </div>

    <div class="retro-panel-content">
      <div class="retro-board-list">
        <div v-for="item in items" :key="item.label" class="retro-board-item">
          <span>{{ item.label }}</span>
          <div class="text-right tabular-nums space-x-2">
            <span class="text-muted-foreground">A {{ formatWon(calcA[item.a].value) }}</span>
            <span class="text-muted-foreground">B {{ formatWon(calcB[item.b].value) }}</span>
            <strong
              :class="diffClass(calcB[item.b].value - calcA[item.a].value)"
            >
              Δ {{ formatWon(calcB[item.b].value - calcA[item.a].value) }}
            </strong>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
