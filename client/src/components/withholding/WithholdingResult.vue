<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatKrwAuto, formatWon, formatPercent } from "@/lib/utils";

const props = defineProps<{
  monthlyIncomeTax: number;       // 사용자 입력 소득세
  estimatedAnnualGross: number;
  calc: SalaryCalcResult;
}>();

// 검산: 계산된 소득세와 입력 소득세의 차이
const calculatedIncomeTax = computed(() => props.calc.monthlyIncomeTax.value);
const taxDiff = computed(() => Math.abs(calculatedIncomeTax.value - props.monthlyIncomeTax));
// ±5,000원 이상 차이 시 안내 문구 표시
const showDiffWarning = computed(() => taxDiff.value >= 5_000 && props.monthlyIncomeTax > 0);

// 애니메이션 카운트업 (InsuranceResult 동일 패턴)
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
  if (rafId !== null) cancelAnimationFrame(rafId);
});
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">소득세 {{ formatWon(monthlyIncomeTax) }} 기준 계산 결과</h2>
    </div>

    <div class="retro-panel-content space-y-3">
      <!-- 핵심 배너: 추정 연봉 -->
      <div class="text-center py-3">
        <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">추정 연봉</p>
        <p class="text-display font-bold font-title text-primary tabular-nums">
          {{ formatKrwAuto(estimatedAnnualGross) }}
        </p>
        <p class="text-body text-muted-foreground mt-1.5">
          추정 월 실수령액
          <strong class="tabular-nums text-foreground font-semibold">{{ formatWon(displayedMonthlyNet) }}</strong>
        </p>
      </div>

      <!-- 요약 stat-grid (3열) -->
      <div class="grid grid-cols-3 gap-1.5">
        <div class="retro-stat p-2.5">
          <p class="retro-stat-label">월 급여</p>
          <p class="retro-stat-value">{{ formatWon(calc.monthlyGross.value) }}</p>
        </div>
        <div class="retro-stat p-2.5">
          <p class="retro-stat-label">공제 합계</p>
          <p class="retro-stat-value text-deduction">{{ formatWon(calc.totalDeduction.value) }}</p>
        </div>
        <div class="retro-stat p-2.5">
          <p class="retro-stat-label">공제 비율</p>
          <p class="retro-stat-value">{{ formatPercent(calc.effectiveTaxRate.value, 1) }}</p>
        </div>
      </div>

      <!-- 공제 내역 통합 섹션 -->
      <div class="retro-board-list text-caption">
        <div class="retro-board-item bg-primary/5 text-body font-bold text-foreground">
          <span>공제 내역</span>
          <strong class="tabular-nums text-primary">{{ formatWon(calc.totalDeduction.value) }}</strong>
        </div>
        <div class="px-3 py-1.5">
          <div class="retro-chart-bar">
            <div class="bg-chart-pension retro-chart-segment" :style="{ width: calc.totalDeduction.value > 0 ? `${(calc.nationalPension.value / calc.totalDeduction.value) * 100}%` : '0%' }" title="국민연금" />
            <div class="bg-chart-health retro-chart-segment" :style="{ width: calc.totalDeduction.value > 0 ? `${(calc.healthInsurance.value / calc.totalDeduction.value) * 100}%` : '0%' }" title="건강보험" />
            <div class="bg-chart-care retro-chart-segment" :style="{ width: calc.totalDeduction.value > 0 ? `${(calc.longTermCare.value / calc.totalDeduction.value) * 100}%` : '0%' }" title="장기요양" />
            <div class="bg-chart-employment retro-chart-segment" :style="{ width: calc.totalDeduction.value > 0 ? `${(calc.employmentInsurance.value / calc.totalDeduction.value) * 100}%` : '0%' }" title="고용보험" />
            <div class="bg-chart-tax retro-chart-segment" :style="{ width: calc.totalDeduction.value > 0 ? `${(calc.monthlyIncomeTax.value / calc.totalDeduction.value) * 100}%` : '0%' }" title="소득세" />
            <div class="bg-chart-localTax retro-chart-segment" :style="{ width: calc.totalDeduction.value > 0 ? `${(calc.monthlyLocalTax.value / calc.totalDeduction.value) * 100}%` : '0%' }" title="지방소득세" />
          </div>
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

      <!-- 검산 row -->
      <div class="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-caption space-y-1.5">
        <p class="font-semibold">계산 검산</p>
        <div class="space-y-1 text-muted-foreground">
          <div class="flex justify-between">
            <span>입력한 소득세</span>
            <strong class="tabular-nums text-foreground">{{ formatWon(monthlyIncomeTax) }}</strong>
          </div>
          <div class="flex justify-between">
            <span>계산된 소득세</span>
            <strong class="tabular-nums text-foreground">{{ formatWon(calculatedIncomeTax) }}</strong>
          </div>
          <div class="flex justify-between">
            <span>오차</span>
            <strong
              class="tabular-nums"
              :class="taxDiff <= 5_000 ? 'text-status-success' : 'text-status-danger'"
            >
              {{ formatWon(taxDiff) }}
            </strong>
          </div>
        </div>
        <Transition name="fade">
          <p v-if="showDiffWarning" class="text-status-warning text-caption">
            비과세 조건, 8~20세 자녀 세액공제, 학자금대출 공제로 인해 차이가 있을 수 있습니다.
          </p>
        </Transition>
      </div>
    </div>
  </section>
</template>
