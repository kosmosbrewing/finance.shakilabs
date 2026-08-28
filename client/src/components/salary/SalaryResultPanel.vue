<script setup lang="ts">
import { formatKrwAuto, formatWon } from "@/lib/utils";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import ResultHero from "@/components/common/ResultHero.vue";
import SectionShareButton from "@/components/common/SectionShareButton.vue";
import SalaryDeductionBar from "@/components/salary/SalaryDeductionBar.vue";
import SalarySummaryStatGrid from "@/components/salary/SalarySummaryStatGrid.vue";

// Count-up animation is provided by ResultHero itself (single shared
// implementation) - views must not add a local rAF copy (gate: resultHeroGrammar).
const props = defineProps<{
  calc: SalaryCalcResult;
}>();

const emit = defineEmits<{
  shareRequest: [];
}>();
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title-brand">계산 결과</h2>
      <SectionShareButton @click="emit('shareRequest')" />
    </div>
    <div class="retro-panel-content space-y-3">
      <!-- 월 실수령액 (메인) -->
      <ResultHero label="월 실수령액" :value="formatWon(props.calc.monthlyNet.value)">
        <template #secondary>
          연 실수령액
          <strong class="tabular-nums text-foreground font-semibold">{{ formatKrwAuto(props.calc.annualNet.value) }}</strong>
        </template>
      </ResultHero>

      <SalarySummaryStatGrid
        :monthly-gross="props.calc.monthlyGross.value"
        :total-deduction="props.calc.totalDeduction.value"
        :effective-tax-rate="props.calc.effectiveTaxRate.value"
      />

      <!-- 공제 내역 통합 섹션 -->
      <div class="retro-board-list text-caption">
        <div class="retro-board-item bg-primary/5 text-body font-bold text-foreground">
          <span>공제 내역</span>
          <strong class="tabular-nums">{{ formatWon(props.calc.totalDeduction.value) }}</strong>
        </div>
        <div class="px-3 py-1.5">
          <SalaryDeductionBar :calc="props.calc" />
        </div>
        <div class="retro-board-item bg-muted/30 font-semibold">
          <span>4대보험</span>
          <strong class="tabular-nums">{{ formatWon(props.calc.totalInsurance.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-pension" />국민연금</span>
          <strong class="tabular-nums">{{ formatWon(props.calc.nationalPension.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-health" />건강보험</span>
          <strong class="tabular-nums">{{ formatWon(props.calc.healthInsurance.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-care" />장기요양</span>
          <strong class="tabular-nums">{{ formatWon(props.calc.longTermCare.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-employment" />고용보험</span>
          <strong class="tabular-nums">{{ formatWon(props.calc.employmentInsurance.value) }}</strong>
        </div>
        <div class="retro-board-item bg-muted/30 font-semibold">
          <span>세금</span>
          <strong class="tabular-nums">{{ formatWon(props.calc.totalTax.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-tax" />소득세</span>
          <strong class="tabular-nums">{{ formatWon(props.calc.monthlyIncomeTax.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-localTax" />지방소득세</span>
          <strong class="tabular-nums">{{ formatWon(props.calc.monthlyLocalTax.value) }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>
