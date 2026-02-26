<script setup lang="ts">
import { computed } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatManWon, formatWon } from "@/lib/utils";

const props = defineProps<{
  mode: "reverse" | "forward";
  healthInsuranceFee: number;
  estimatedTaxableMonthly: number;
  estimatedAnnualGross: number;
  calc: SalaryCalcResult;
}>();

const title = computed(() => {
  if (props.mode === "reverse") {
    return `건보료 ${formatWon(props.healthInsuranceFee)}이면...`;
  }
  return `연봉 ${formatManWon(props.calc.annualGross.value)} 기준 결과`;
});
</script>

<template>
  <section class="retro-panel">
    <div class="retro-titlebar">
      <h2 class="retro-title">{{ title }}</h2>
    </div>

    <div class="retro-panel-content space-y-3">
      <p class="text-h1 font-title text-primary">
        추정 연봉 {{ formatManWon(mode === 'reverse' ? estimatedAnnualGross : calc.annualGross.value) }}
      </p>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
          <p class="text-caption text-muted-foreground">월급(세전)</p>
          <p class="text-heading font-bold tabular-nums">{{ formatWon(calc.monthlyGross.value) }}</p>
        </div>
        <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
          <p class="text-caption text-muted-foreground">월 실수령</p>
          <p class="text-heading font-bold tabular-nums">{{ formatWon(calc.monthlyNet.value) }}</p>
        </div>
      </div>

      <div v-if="mode === 'reverse'" class="rounded-xl border border-border/60 bg-muted/20 p-3 text-caption space-y-2">
        <p class="font-semibold">추정 근거</p>
        <ol class="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>건강보험료 <strong class="tabular-nums text-foreground">{{ formatWon(healthInsuranceFee) }}</strong> ÷ 3.595%</li>
          <li>= 과세월급 <strong class="tabular-nums text-foreground">{{ formatWon(estimatedTaxableMonthly) }}</strong></li>
          <li>비과세 반영 후 연봉 환산 = <strong class="tabular-nums text-foreground">{{ formatManWon(estimatedAnnualGross) }}</strong></li>
        </ol>
      </div>

      <div class="retro-board-list text-caption">
        <div class="retro-board-item"><span>국민연금</span><strong class="tabular-nums">{{ formatWon(calc.nationalPension.value) }}</strong></div>
        <div class="retro-board-item"><span>건강보험</span><strong class="tabular-nums">{{ formatWon(calc.healthInsurance.value) }}</strong></div>
        <div class="retro-board-item"><span>장기요양</span><strong class="tabular-nums">{{ formatWon(calc.longTermCare.value) }}</strong></div>
        <div class="retro-board-item"><span>고용보험</span><strong class="tabular-nums">{{ formatWon(calc.employmentInsurance.value) }}</strong></div>
        <div class="retro-board-item"><span>소득세</span><strong class="tabular-nums">{{ formatWon(calc.monthlyIncomeTax.value) }}</strong></div>
        <div class="retro-board-item"><span>지방소득세</span><strong class="tabular-nums">{{ formatWon(calc.monthlyLocalTax.value) }}</strong></div>
        <div class="retro-board-item bg-primary/5 text-body font-bold text-foreground"><span>총 공제</span><strong class="tabular-nums text-primary">{{ formatWon(calc.totalDeduction.value) }}</strong></div>
      </div>
    </div>
  </section>
</template>
