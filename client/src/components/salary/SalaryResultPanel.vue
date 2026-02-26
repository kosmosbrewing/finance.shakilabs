<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue";
import { Share2 } from "lucide-vue-next";
import { formatWon, formatPercent } from "@/lib/utils";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";

const props = defineProps<{
  calc: SalaryCalcResult;
}>();

const emit = defineEmits<{
  share: [];
}>();

const displayedMonthlyNet = ref(0);
const hasAnimatedInitial = ref(false);
const monthlyNetDiff = ref(0);
let previousMonthlyNet: number | null = null;
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
  const next = props.calc.monthlyNet.value;
  if (previousMonthlyNet !== null) {
    monthlyNetDiff.value = next - previousMonthlyNet;
  }
  previousMonthlyNet = next;

  if (hasAnimatedInitial.value) {
    displayedMonthlyNet.value = next;
  }
});

const showDiff = computed(() =>
  hasAnimatedInitial.value && monthlyNetDiff.value !== 0
);
const diffLabel = computed(() => {
  const sign = monthlyNetDiff.value > 0 ? "+" : "-";
  return `${sign}${formatWon(Math.abs(monthlyNetDiff.value))}`;
});
const diffClass = computed(() =>
  monthlyNetDiff.value > 0
    ? "text-status-success"
    : "text-status-danger"
);

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
      <h2 class="retro-title">계산 결과</h2>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="retro-kbd hover:border-primary hover:text-primary transition-colors cursor-pointer"
          @click="emit('share')"
        >
          <Share2 class="h-3 w-3 mr-1 inline" />
          공유
        </button>
        <span class="retro-kbd">RESULT</span>
      </div>
    </div>
    <div class="retro-panel-content space-y-4">
      <!-- 월 실수령액 (메인) -->
      <div class="text-center py-4">
        <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">월 실수령액</p>
        <p class="text-3xl sm:text-4xl font-bold font-title text-primary tabular-nums">
          {{ formatWon(displayedMonthlyNet) }}
        </p>
        <p class="text-caption text-muted-foreground mt-1">
          연 실수령액: {{ formatWon(props.calc.annualNet.value) }}
        </p>
        <p
          v-if="showDiff"
          class="text-caption mt-1 font-semibold"
          :class="diffClass"
        >
          직전 입력 대비 {{ diffLabel }}
        </p>
      </div>

      <!-- 요약 그리드 -->
      <div class="retro-stat-grid">
        <div class="retro-stat">
          <p class="retro-stat-label">월 급여</p>
          <p class="retro-stat-value text-body">{{ formatWon(props.calc.monthlyGross.value) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">공제합계</p>
          <p class="retro-stat-value text-body text-deduction">{{ formatWon(props.calc.totalDeduction.value) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">4대보험</p>
          <p class="retro-stat-value text-body">{{ formatWon(props.calc.totalInsurance.value) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">실효세율</p>
          <p class="retro-stat-value text-body">{{ formatPercent(props.calc.effectiveTaxRate.value, 1) }}</p>
        </div>
      </div>

      <!-- 공제 항목 바 -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-caption">
          <span class="text-muted-foreground">4대보험</span>
          <span class="font-semibold tabular-nums">{{ formatWon(props.calc.totalInsurance.value) }}</span>
        </div>
        <div class="flex gap-0.5 h-2 rounded-full overflow-hidden bg-muted">
          <div
            class="bg-chart-pension transition-all duration-200"
            :style="{ width: props.calc.monthlyGross.value > 0 ? `${(props.calc.nationalPension.value / props.calc.monthlyGross.value) * 100}%` : '0%' }"
            title="국민연금"
          />
          <div
            class="bg-chart-health transition-all duration-200"
            :style="{ width: props.calc.monthlyGross.value > 0 ? `${(props.calc.healthInsurance.value / props.calc.monthlyGross.value) * 100}%` : '0%' }"
            title="건강보험"
          />
          <div
            class="bg-chart-care transition-all duration-200"
            :style="{ width: props.calc.monthlyGross.value > 0 ? `${(props.calc.longTermCare.value / props.calc.monthlyGross.value) * 100}%` : '0%' }"
            title="장기요양"
          />
          <div
            class="bg-chart-employment transition-all duration-200"
            :style="{ width: props.calc.monthlyGross.value > 0 ? `${(props.calc.employmentInsurance.value / props.calc.monthlyGross.value) * 100}%` : '0%' }"
            title="고용보험"
          />
        </div>
        <div class="flex flex-wrap gap-x-3 gap-y-1 text-caption">
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-chart-pension" />국민연금</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-chart-health" />건강보험</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-chart-care" />장기요양</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-chart-employment" />고용보험</span>
        </div>
      </div>

      <!-- 세금 -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-caption">
          <span class="text-muted-foreground">세금</span>
          <span class="font-semibold tabular-nums">{{ formatWon(props.calc.totalTax.value) }}</span>
        </div>
        <div class="flex gap-0.5 h-2 rounded-full overflow-hidden bg-muted">
          <div
            class="bg-chart-tax transition-all duration-200"
            :style="{ width: props.calc.monthlyGross.value > 0 ? `${(props.calc.monthlyIncomeTax.value / props.calc.monthlyGross.value) * 100}%` : '0%' }"
            title="소득세"
          />
          <div
            class="bg-chart-localTax transition-all duration-200"
            :style="{ width: props.calc.monthlyGross.value > 0 ? `${(props.calc.monthlyLocalTax.value / props.calc.monthlyGross.value) * 100}%` : '0%' }"
            title="지방소득세"
          />
        </div>
        <div class="flex flex-wrap gap-x-3 gap-y-1 text-caption">
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-chart-tax" />소득세</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-chart-localTax" />지방소득세</span>
        </div>
      </div>
    </div>
  </section>
</template>
