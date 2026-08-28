<script setup lang="ts">
import { computed } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatKrwAuto, formatWon, formatPercent } from "@/lib/utils";
import { RATES_2026 } from "@/data/taxRates2026";
import ResultHero from "@/components/common/ResultHero.vue";
import SectionShareButton from "@/components/common/SectionShareButton.vue";
import SalaryDeductionBar from "@/components/salary/SalaryDeductionBar.vue";
import SalarySummaryStatGrid from "@/components/salary/SalarySummaryStatGrid.vue";

const props = defineProps<{
  mode: "reverse" | "forward";
  healthInsuranceFee: number;
  estimatedTaxableMonthly: number;
  estimatedAnnualGross: number;
  calc: SalaryCalcResult;
}>();

const emit = defineEmits<{
  shareRequest: [];
}>();

const displayedHealthInsurance = computed(() =>
  props.mode === "reverse" ? props.healthInsuranceFee : props.calc.healthInsurance.value
);

const displayedTotalInsurance = computed(() =>
  props.calc.nationalPension.value +
  displayedHealthInsurance.value +
  props.calc.longTermCare.value +
  props.calc.employmentInsurance.value
);
const displayedTotalDeduction = computed(
  () => displayedTotalInsurance.value + props.calc.totalTax.value
);

const title = computed(() => {
  if (props.mode === "reverse") {
    return `건보료 ${formatWon(props.healthInsuranceFee)} 기준`;
  }
  return `연봉 ${formatKrwAuto(props.calc.annualGross.value)} 기준`;
});

// Count-up animation removed on purpose (fleet-wide policy): 23 of 26 calculators
// were already static, and animating from 0 would blank the prerendered value.
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="insurance-result-title retro-title-brand">{{ title }}</h2>
      <SectionShareButton class="min-h-[44px]" @click="emit('shareRequest')" />
    </div>

    <div class="retro-panel-content space-y-3">
      <ResultHero
        :label="mode === 'reverse' ? '추정 월 실수령액' : '월 실수령액'"
        :value="formatWon(calc.monthlyNet.value)"
      >
        <template #secondary>
          {{ mode === 'reverse' ? '추정 연봉' : '연 실수령액' }}
          <strong class="tabular-nums text-foreground font-semibold">{{ formatKrwAuto(mode === 'reverse' ? estimatedAnnualGross : calc.annualNet.value) }}</strong>
        </template>
      </ResultHero>

      <SalarySummaryStatGrid
        :monthly-gross="calc.monthlyGross.value"
        :total-deduction="calc.totalDeduction.value"
        :effective-tax-rate="calc.effectiveTaxRate.value"
      />

      <!-- 공제 내역 통합 섹션 -->
      <div class="retro-board-list text-caption">
        <!-- 총공제 헤더 -->
        <div class="retro-board-item bg-primary/5 text-body font-bold text-foreground">
          <span>공제 내역</span>
          <strong class="tabular-nums">{{ formatWon(displayedTotalDeduction) }}</strong>
        </div>

        <div class="px-3 py-1.5">
          <SalaryDeductionBar :calc="calc" :health-insurance="displayedHealthInsurance" />
        </div>

        <!-- 4대보험 그룹 -->
        <div class="retro-board-item bg-muted/30 font-semibold">
          <span>4대보험</span>
          <strong class="tabular-nums">{{ formatWon(displayedTotalInsurance) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-pension" />국민연금</span>
          <strong class="tabular-nums">{{ formatWon(calc.nationalPension.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-health" />건강보험</span>
          <strong class="tabular-nums">{{ formatWon(displayedHealthInsurance) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-care" />장기요양</span>
          <strong class="tabular-nums">{{ formatWon(calc.longTermCare.value) }}</strong>
        </div>
        <div class="retro-board-item">
          <span class="flex items-center gap-1.5"><span class="retro-chart-dot bg-chart-employment" />고용보험</span>
          <strong class="tabular-nums">{{ formatWon(calc.employmentInsurance.value) }}</strong>
        </div>

        <!-- 세금 그룹 -->
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

      <!-- 추정 근거 (reverse 모드) -->
      <Transition name="fade">
      <div v-if="mode === 'reverse'" class="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-caption space-y-1.5">
        <p class="font-semibold">추정 근거</p>
        <ol class="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>건강보험료 <strong class="tabular-nums text-foreground">{{ formatWon(healthInsuranceFee) }}</strong> ÷ 근로자 부담률 {{ formatPercent(RATES_2026.healthInsurance.employee, 3) }}</li>
          <li>= 과세 기준 월급 <strong class="tabular-nums text-foreground">{{ formatWon(estimatedTaxableMonthly) }}</strong></li>
          <li>+ 비과세 {{ formatWon(calc.nonTaxableMonthly.value) }}, 연봉 환산 = <strong class="tabular-nums text-foreground">{{ formatKrwAuto(estimatedAnnualGross) }}</strong></li>
        </ol>
      </div>
      </Transition>
    </div>
  </section>
</template>
