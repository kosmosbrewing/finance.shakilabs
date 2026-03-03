<script setup lang="ts">
import { computed } from "vue";
import CompareDiffTable from "@/components/compare/CompareDiffTable.vue";
import { formatKrwAuto, formatWon } from "@/lib/utils";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";

const props = defineProps<{
  calcA: SalaryCalcResult;
  calcB: SalaryCalcResult;
  embedded?: boolean;
}>();

const monthlyNetDiff = computed(
  () => props.calcB.monthlyNet.value - props.calcA.monthlyNet.value
);
const annualNetDiff = computed(
  () => props.calcB.annualNet.value - props.calcA.annualNet.value
);

const monthlyGapAbs = computed(() => Math.abs(monthlyNetDiff.value));

const diffClass = computed(() => {
  if (monthlyNetDiff.value > 0) return "text-status-success";
  if (monthlyNetDiff.value < 0) return "text-status-danger";
  return "text-muted-foreground";

});

const diffSign = computed(() => {
  if (monthlyNetDiff.value > 0) return "+";
  if (monthlyNetDiff.value < 0) return "-";
  return "";
});

</script>

<template>
  <component :is="props.embedded ? 'div' : 'section'" :class="props.embedded ? 'space-y-4' : 'retro-panel overflow-hidden'">
    <div v-if="!props.embedded" class="retro-titlebar">
      <h2 class="retro-title">비교 결과</h2>
    </div>

    <div :class="props.embedded ? 'space-y-3' : 'retro-panel-content space-y-3'">
      <div v-if="props.embedded" class="flex items-center justify-between">
        <h3 class="text-caption font-semibold text-foreground">비교 결과</h3>
      </div>

      <!-- 히어로: 차이 금액 -->
      <div class="text-center py-3 space-y-0.5">
        <p class="text-caption text-muted-foreground">월 실수령 차이</p>
        <p class="text-display font-bold font-title tabular-nums" :class="diffClass">
          {{ diffSign }}{{ formatWon(monthlyGapAbs) }}
        </p>
      </div>

      <!-- 현재 vs 이직 카드 -->
      <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] md:items-stretch">
        <div class="rounded-xl border-2 border-status-info/35 bg-status-info/10 p-2.5 space-y-2">
          <div class="rounded-lg border border-status-info/35 bg-background/60 px-2.5 py-1.5">
            <p class="text-caption font-semibold text-status-info">현재 회사</p>
          </div>
          <div class="rounded-lg border border-status-info/25 bg-background/60 px-2.5 py-2.5 text-center">
            <p class="text-h2 font-bold tabular-nums">{{ formatWon(calcA.monthlyNet.value) }}</p>
          </div>
        </div>

        <div class="flex md:hidden items-center justify-center -my-1">
          <div class="h-px flex-1 bg-border/60" />
          <span class="retro-kbd mx-3 px-3 py-1 font-extrabold">결과</span>
          <div class="h-px flex-1 bg-border/60" />
        </div>
        <div class="hidden md:flex items-center justify-center">
          <span class="retro-kbd px-3 py-1 font-extrabold">결과</span>
        </div>

        <div class="rounded-xl border-2 border-status-success/35 bg-status-success/10 p-2.5 space-y-2">
          <div class="rounded-lg border border-status-success/35 bg-background/60 px-2.5 py-1.5">
            <p class="text-caption font-semibold text-status-success">이직 회사</p>
          </div>
          <div class="rounded-lg border border-status-success/25 bg-background/60 px-2.5 py-2.5 text-center">
            <p class="text-h2 font-bold tabular-nums">{{ formatWon(calcB.monthlyNet.value) }}</p>
          </div>
        </div>
      </div>

      <!-- 요약 행: 연 실수령 + 총 공제 -->
      <div class="retro-board-list text-caption">
        <div class="retro-board-item">
          <span>연 실수령 차이</span>
          <strong class="tabular-nums" :class="diffClass">{{ formatKrwAuto(annualNetDiff) }}</strong>
        </div>
        <div class="retro-board-item">
          <span>총 공제 차이 (월)</span>
          <strong class="tabular-nums">{{ formatWon(calcB.totalDeduction.value - calcA.totalDeduction.value) }}</strong>
        </div>
      </div>

      <!-- 공제 상세 -->
      <details class="retro-details">
        <summary class="retro-details-summary">
          <span>공제 항목 상세 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <div class="p-3">
          <CompareDiffTable embedded :calc-a="calcA" :calc-b="calcB" />
        </div>
      </details>
    </div>
  </component>
</template>
