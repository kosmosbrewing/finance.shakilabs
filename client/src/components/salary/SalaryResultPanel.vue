<script setup lang="ts">
import { onMounted, onUnmounted, ref, watchEffect } from "vue";
import { formatKrwAuto, formatKrwCompact, formatWon, formatPercent, deductionTextClass } from "@/lib/utils";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import SectionShareButton from "@/components/common/SectionShareButton.vue";
import SalaryDeductionBar from "@/components/salary/SalaryDeductionBar.vue";

const props = defineProps<{
  calc: SalaryCalcResult;
}>();

const emit = defineEmits<{
  shareRequest: [];
}>();

const displayedMonthlyNet = ref(0);
const hasAnimatedInitial = ref(false);
let rafId: number | null = null;

function animateInitialMonthlyNet(target: number): void {
  const durationMs = 600;
  const start = performance.now();
  const sign = target < 0 ? -1 : 1;
  const absTarget = Math.abs(target);

  const step = (timestamp: number): void => {
    const progress = Math.min(1, (timestamp - start) / durationMs);
    displayedMonthlyNet.value = Math.round(absTarget * progress) * sign;

    if (progress < 1) {
      rafId = requestAnimationFrame(step);
      return;
    }

    hasAnimatedInitial.value = true;
    displayedMonthlyNet.value = props.calc.monthlyNet.value;
    rafId = null;
  };

  rafId = requestAnimationFrame(step);
}

watchEffect(() => {
  if (hasAnimatedInitial.value) {
    displayedMonthlyNet.value = props.calc.monthlyNet.value;
  }
});

onMounted(() => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    hasAnimatedInitial.value = true;
    displayedMonthlyNet.value = props.calc.monthlyNet.value;
    return;
  }

  animateInitialMonthlyNet(props.calc.monthlyNet.value);
});

onUnmounted(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
});
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title-brand">계산 결과</h2>
      <SectionShareButton @click="emit('shareRequest')" />
    </div>
    <div class="retro-panel-content space-y-3">
      <!-- 월 실수령액 (메인) -->
      <div class="text-center py-3">
        <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">월 실수령액</p>
        <p class="text-display font-bold font-title text-primary tabular-nums">
          {{ formatWon(displayedMonthlyNet) }}
        </p>
        <p class="text-body text-muted-foreground mt-1.5">
          연 실수령액
          <strong class="tabular-nums text-foreground font-semibold">{{ formatKrwAuto(props.calc.annualNet.value) }}</strong>
        </p>
      </div>

      <!-- 요약 stat-grid (3열) -->
      <div class="grid grid-cols-3 gap-1.5">
        <div class="retro-stat flex min-h-[74px] flex-col justify-center p-2 text-center sm:min-h-0 sm:p-2.5">
          <p class="retro-stat-label">월 급여</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">
            <span class="sm:hidden">{{ formatKrwCompact(props.calc.monthlyGross.value) }}</span>
            <span class="hidden sm:inline">{{ formatWon(props.calc.monthlyGross.value) }}</span>
          </p>
        </div>
        <div class="retro-stat flex min-h-[74px] flex-col justify-center p-2 text-center sm:min-h-0 sm:p-2.5">
          <p class="retro-stat-label">공제 합계</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading" :class="deductionTextClass(props.calc.effectiveTaxRate.value)">
            <span class="sm:hidden">{{ formatKrwCompact(props.calc.totalDeduction.value) }}</span>
            <span class="hidden sm:inline">{{ formatWon(props.calc.totalDeduction.value) }}</span>
          </p>
        </div>
        <div class="retro-stat flex min-h-[74px] flex-col justify-center p-2 text-center sm:min-h-0 sm:p-2.5">
          <p class="retro-stat-label">공제 비율</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading" :class="deductionTextClass(props.calc.effectiveTaxRate.value)">{{ formatPercent(props.calc.effectiveTaxRate.value, 1) }}</p>
        </div>
      </div>

      <!-- 공제 내역 통합 섹션 -->
      <div class="retro-board-list text-caption">
        <div class="retro-board-item bg-primary/5 text-body font-bold text-foreground">
          <span>공제 내역</span>
          <strong class="tabular-nums text-primary">{{ formatWon(props.calc.totalDeduction.value) }}</strong>
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
