<script setup lang="ts">
import { computed } from "vue";
import { formatWon } from "@/lib/utils";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";

type WelfareInput = {
  bonusAnnual: number;
  welfareMonthly: number;
};

const props = defineProps<{
  calcA: SalaryCalcResult;
  calcB: SalaryCalcResult;
  welfareA: WelfareInput;
  welfareB: WelfareInput;
}>();

const monthlyNetDiff = computed(
  () => props.calcB.monthlyNet.value - props.calcA.monthlyNet.value
);
const annualNetDiff = computed(
  () => props.calcB.annualNet.value - props.calcA.annualNet.value
);

const monthlyBonusA = computed(() => Math.floor(props.welfareA.bonusAnnual / 12));
const monthlyBonusB = computed(() => Math.floor(props.welfareB.bonusAnnual / 12));

const realMonthlyA = computed(
  () => props.calcA.monthlyNet.value + monthlyBonusA.value + props.welfareA.welfareMonthly
);
const realMonthlyB = computed(
  () => props.calcB.monthlyNet.value + monthlyBonusB.value + props.welfareB.welfareMonthly
);
const realMonthlyDiff = computed(() => realMonthlyB.value - realMonthlyA.value);

const diffClass = computed(() => {
  if (monthlyNetDiff.value > 0) return "text-status-success";
  if (monthlyNetDiff.value < 0) return "text-status-danger";
  return "text-muted-foreground";
});

const realMonthlyDiffClass = computed(() => {
  if (realMonthlyDiff.value > 0) return "text-status-success";
  if (realMonthlyDiff.value < 0) return "text-status-danger";
  return "";
});
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">비교 결과</h2>
      <span class="retro-kbd">RESULT</span>
    </div>

    <div class="retro-panel-content space-y-4">
      <p class="text-h2 font-title" :class="diffClass">
        이직 시 월 {{ formatWon(Math.abs(monthlyNetDiff)) }}
        <span v-if="monthlyNetDiff > 0">더 받습니다</span>
        <span v-else-if="monthlyNetDiff < 0">덜 받습니다</span>
        <span v-else>차이 없습니다</span>
      </p>

      <p class="scroll-hint">표를 좌우로 스크롤하세요 →</p>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-body">
          <thead class="sticky top-0 z-10 bg-muted/70 text-foreground backdrop-blur">
            <tr>
              <th class="px-3 py-2.5 text-left">항목</th>
              <th class="px-3 py-2.5 text-right">현재(A)</th>
              <th class="px-3 py-2.5 text-right">이직(B)</th>
              <th class="px-3 py-2.5 text-right">차이</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-border/60 even:bg-muted/20">
              <td class="px-3 py-2.5">월 실수령</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calcA.monthlyNet.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calcB.monthlyNet.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums" :class="diffClass">{{ formatWon(monthlyNetDiff) }}</td>
            </tr>
            <tr class="border-t border-border/60 even:bg-muted/20">
              <td class="px-3 py-2.5">연 실수령</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calcA.annualNet.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calcB.annualNet.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums" :class="diffClass">{{ formatWon(annualNetDiff) }}</td>
            </tr>
            <tr class="border-t border-border/60 even:bg-muted/20">
              <td class="px-3 py-2.5">총 공제(월)</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calcA.totalDeduction.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calcB.totalDeduction.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calcB.totalDeduction.value - calcA.totalDeduction.value) }}</td>
            </tr>
            <tr class="border-t border-border/60 even:bg-muted/20">
              <td class="px-3 py-2.5">복지포인트(월)</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(welfareA.welfareMonthly) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(welfareB.welfareMonthly) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(welfareB.welfareMonthly - welfareA.welfareMonthly) }}</td>
            </tr>
            <tr class="border-t border-border/60 even:bg-muted/20">
              <td class="px-3 py-2.5">성과급 월환산</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(monthlyBonusA) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(monthlyBonusB) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(monthlyBonusB - monthlyBonusA) }}</td>
            </tr>
            <tr class="border-t border-border font-semibold even:bg-muted/20">
              <td class="px-3 py-2.5">실질 월소득</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(realMonthlyA) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(realMonthlyB) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums" :class="realMonthlyDiffClass">{{ formatWon(realMonthlyDiff) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
