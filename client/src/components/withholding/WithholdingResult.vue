<script setup lang="ts">
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatKrwAuto, formatWon } from "@/lib/utils";
import ResultHero from "@/components/common/ResultHero.vue";
import SectionShareButton from "@/components/common/SectionShareButton.vue";
import SalaryDeductionBar from "@/components/salary/SalaryDeductionBar.vue";
import SalarySummaryStatGrid from "@/components/salary/SalarySummaryStatGrid.vue";

defineProps<{
  monthlyIncomeTax: number;       // 사용자 입력 소득세
  estimatedAnnualGross: number;
  calc: SalaryCalcResult;
}>();

const emit = defineEmits<{
  shareRequest: [];
}>();

// Count-up animation removed on purpose (fleet-wide policy): 23 of 26 calculators
// were already static, and animating from 0 would blank the prerendered value.
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title-brand">소득세 {{ formatWon(monthlyIncomeTax) }} 기준 계산 결과</h2>
      <SectionShareButton @click="emit('shareRequest')" />
    </div>

    <div class="retro-panel-content space-y-3">
      <!-- 핵심 배너: 추정 연봉 -->
      <ResultHero label="추정 연봉" :value="formatKrwAuto(estimatedAnnualGross)">
        <template #secondary>
          추정 월 실수령액
          <strong class="tabular-nums text-foreground font-semibold">{{ formatWon(calc.monthlyNet.value) }}</strong>
        </template>
      </ResultHero>

      <SalarySummaryStatGrid
        :monthly-gross="calc.monthlyGross.value"
        :total-deduction="calc.totalDeduction.value"
        :effective-tax-rate="calc.effectiveTaxRate.value"
      />

      <!-- 공제 내역 통합 섹션 -->
      <div class="retro-board-list text-caption">
        <div class="retro-board-item bg-muted/60 text-body font-bold text-foreground">
          <span>공제 내역</span>
          <strong class="tabular-nums text-foreground">{{ formatWon(calc.totalDeduction.value) }}</strong>
        </div>
        <div class="px-3 py-1.5">
          <SalaryDeductionBar :calc="calc" />
        </div>
        <div class="retro-board-item bg-muted/30 font-semibold">
          <span>4대보험</span>
          <strong class="tabular-nums">{{ formatWon(calc.totalInsurance.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-pension" />국민연금</span>
          <strong class="tabular-nums">{{ formatWon(calc.nationalPension.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-health" />건강보험</span>
          <strong class="tabular-nums">{{ formatWon(calc.healthInsurance.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-care" />장기요양</span>
          <strong class="tabular-nums">{{ formatWon(calc.longTermCare.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-employment" />고용보험</span>
          <strong class="tabular-nums">{{ formatWon(calc.employmentInsurance.value) }}</strong>
        </div>
        <div class="retro-board-item bg-muted/30 font-semibold">
          <span>세금</span>
          <strong class="tabular-nums">{{ formatWon(calc.totalTax.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-tax" />소득세</span>
          <strong class="tabular-nums">{{ formatWon(calc.monthlyIncomeTax.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-localTax" />지방소득세</span>
          <strong class="tabular-nums">{{ formatWon(calc.monthlyLocalTax.value) }}</strong>
        </div>
      </div>

    </div>
  </section>
</template>
