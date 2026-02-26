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
  <section class="retro-panel border border-border/70">
    <div class="retro-titlebar">
      <h2 class="retro-title">{{ title }}</h2>
      <span class="retro-kbd">RESULT</span>
    </div>

    <div class="retro-panel-content space-y-3">
      <p class="text-h2 font-title text-primary">
        추정 연봉 {{ formatManWon(mode === 'reverse' ? estimatedAnnualGross : calc.annualGross.value) }}
      </p>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div class="border border-border/60 bg-muted/20 p-3">
          <p class="text-caption text-muted-foreground">월급(세전)</p>
          <p class="text-heading font-bold tabular-nums">{{ formatWon(calc.monthlyGross.value) }}</p>
        </div>
        <div class="border border-border/60 bg-muted/20 p-3">
          <p class="text-caption text-muted-foreground">월 실수령</p>
          <p class="text-heading font-bold tabular-nums">{{ formatWon(calc.monthlyNet.value) }}</p>
        </div>
      </div>

      <div v-if="mode === 'reverse'" class="space-y-1 border border-border/60 bg-muted/20 p-3 text-caption">
        <p class="font-semibold">역산 근거</p>
        <p>건강보험료 {{ formatWon(healthInsuranceFee) }} ÷ 3.595% = 과세월급 {{ formatWon(estimatedTaxableMonthly) }}</p>
        <p>과세월급 + 비과세 반영 후 연봉 환산 = {{ formatManWon(estimatedAnnualGross) }}</p>
      </div>

      <div class="space-y-1 border border-border/60 p-3 text-caption">
        <p class="flex items-center justify-between"><span>국민연금</span><strong>{{ formatWon(calc.nationalPension.value) }}</strong></p>
        <p class="flex items-center justify-between"><span>건강보험</span><strong>{{ formatWon(calc.healthInsurance.value) }}</strong></p>
        <p class="flex items-center justify-between"><span>장기요양</span><strong>{{ formatWon(calc.longTermCare.value) }}</strong></p>
        <p class="flex items-center justify-between"><span>고용보험</span><strong>{{ formatWon(calc.employmentInsurance.value) }}</strong></p>
        <p class="flex items-center justify-between"><span>소득세</span><strong>{{ formatWon(calc.monthlyIncomeTax.value) }}</strong></p>
        <p class="flex items-center justify-between"><span>지방소득세</span><strong>{{ formatWon(calc.monthlyLocalTax.value) }}</strong></p>
        <p class="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-foreground"><span>총 공제</span><strong>{{ formatWon(calc.totalDeduction.value) }}</strong></p>
      </div>
    </div>
  </section>
</template>
