<script setup lang="ts">
import { computed } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatWon } from "@/lib/utils";

const props = defineProps<{
  calcA: SalaryCalcResult;
  calcB: SalaryCalcResult;
  embedded?: boolean;
}>();

const items = [
  { label: "국민연금", key: "nationalPension" },
  { label: "건강보험", key: "healthInsurance" },
  { label: "장기요양보험", key: "longTermCare" },
  { label: "고용보험", key: "employmentInsurance" },
  { label: "소득세", key: "monthlyIncomeTax" },
  { label: "지방소득세", key: "monthlyLocalTax" },
] as const;

type CalcKey = (typeof items)[number]["key"];

const rows = computed(() =>
  items.map((item) => {
    const a = props.calcA[item.key as CalcKey].value;
    const b = props.calcB[item.key as CalcKey].value;
    const delta = b - a;
    return { label: item.label, a, b, delta };
  })
);

function diffClass(delta: number): string {
  if (delta > 0) return "text-status-danger";
  if (delta < 0) return "text-status-success";
  return "text-muted-foreground";
}
</script>

<template>
  <component :is="props.embedded ? 'div' : 'section'" :class="props.embedded ? '' : 'retro-panel overflow-hidden'">
    <div v-if="!props.embedded" class="retro-titlebar">
      <h2 class="retro-title">공제 항목 차이</h2>
    </div>

    <div :class="props.embedded ? '' : 'retro-panel-content'">
      <div class="overflow-x-auto">
        <table class="w-full text-caption border-collapse">
          <thead>
            <tr class="border-b-2 border-primary/20 bg-muted/40">
              <th class="px-2 py-2 text-left font-semibold md:px-3 md:py-2.5">항목</th>
              <th class="hidden px-3 py-2.5 text-right font-semibold md:table-cell">현재 회사</th>
              <th class="hidden px-3 py-2.5 text-right font-semibold md:table-cell">이직 회사</th>
              <th class="px-2 py-2 text-right font-semibold md:px-3 md:py-2.5">차이</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.label"
              class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors"
            >
              <td class="px-2 py-2 whitespace-nowrap md:px-3 md:py-2.5">{{ row.label }}</td>
              <td class="hidden px-3 py-2.5 text-right tabular-nums whitespace-nowrap md:table-cell">{{ formatWon(row.a) }}</td>
              <td class="hidden px-3 py-2.5 text-right tabular-nums whitespace-nowrap md:table-cell">{{ formatWon(row.b) }}</td>
              <td class="px-2 py-2 text-right tabular-nums whitespace-nowrap font-semibold md:px-3 md:py-2.5" :class="diffClass(row.delta)">
                {{ formatWon(row.delta) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="retro-details md:hidden">
        <summary class="retro-details-summary">
          <span>회사별 값 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <ul class="space-y-2 p-2">
          <li
            v-for="row in rows"
            :key="`${row.label}-mobile-values`"
            class="rounded-lg border border-border/60 bg-muted/10 p-2"
          >
            <p class="text-caption font-semibold text-foreground">{{ row.label }}</p>
            <div class="mt-1 flex items-center justify-between text-tiny text-muted-foreground">
              <span>현재 회사</span>
              <span class="tabular-nums">{{ formatWon(row.a) }}</span>
            </div>
            <div class="mt-0.5 flex items-center justify-between text-tiny text-muted-foreground">
              <span>이직 회사</span>
              <span class="tabular-nums">{{ formatWon(row.b) }}</span>
            </div>
          </li>
        </ul>
      </details>
    </div>
  </component>
</template>
