<script setup lang="ts">
import { computed } from "vue";
import { formatManWonValue, formatPercent, formatWon } from "@/lib/utils";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { getBracketInsights } from "@/data/bracketInsights";

const props = defineProps<{
  amount: number; // 만원 단위
  calc: SalaryCalcResult;
}>();

const amountLabel = computed(() => {
  return formatManWonValue(props.amount);
});

const insights = computed(() =>
  getBracketInsights(props.amount * 10_000, props.calc)
);

const faqItems = computed(() => [
  {
    q: `연봉 ${amountLabel.value}의 월 실수령액은 얼마인가요?`,
    a: `2026년 기준 연봉 ${amountLabel.value}(부양가족 ${props.calc.dependents.value}인, 비과세 월 ${formatWon(props.calc.nonTaxableMonthly.value)})의 월 실수령액은 약 ${formatWon(props.calc.monthlyNet.value)}입니다. 4대보험 ${formatWon(props.calc.totalInsurance.value)}과 세금 ${formatWon(props.calc.totalTax.value)}이 공제됩니다.`,
  },
  {
    q: `연봉 ${amountLabel.value}의 4대보험료는 얼마인가요?`,
    a: `월 기준 국민연금 ${formatWon(props.calc.nationalPension.value)}, 건강보험 ${formatWon(props.calc.healthInsurance.value)}, 장기요양보험 ${formatWon(props.calc.longTermCare.value)}, 고용보험 ${formatWon(props.calc.employmentInsurance.value)}으로 총 ${formatWon(props.calc.totalInsurance.value)}입니다.`,
  },
  {
    q: `연봉 ${amountLabel.value}의 실효세율은 얼마인가요?`,
    a: `4대보험과 세금을 합산한 실효세율은 약 ${formatPercent(props.calc.effectiveTaxRate.value, 1)}입니다.`,
  },
]);
</script>

<template>
  <div class="space-y-6">
    <div class="retro-panel retro-panel-content">
      <h2 class="text-h1 mb-3">연봉 {{ amountLabel }} 실수령액 요약</h2>
      <p class="text-body text-muted-foreground leading-relaxed">
        2026년 최신 세율 기준으로 연봉 {{ amountLabel }}의 월 실수령액은
        <strong class="text-primary">{{ formatWon(calc.monthlyNet.value) }}</strong>입니다.
        월 급여 {{ formatWon(calc.monthlyGross.value) }}에서 4대보험 {{ formatWon(calc.totalInsurance.value) }}과
        세금 {{ formatWon(calc.totalTax.value) }}이 공제됩니다.
        연간 실수령액은 {{ formatWon(calc.annualNet.value) }}이며, 실효세율은 {{ formatPercent(calc.effectiveTaxRate.value, 1) }}입니다.
      </p>
    </div>

    <!-- 인사이트 -->
    <div v-if="insights.length" class="retro-panel-muted p-3 sm:p-4 space-y-2">
      <h3 class="text-caption font-semibold text-foreground">연봉 {{ amountLabel }} 세금 인사이트</h3>
      <ul class="space-y-1.5">
        <li
          v-for="(item, i) in insights"
          :key="i"
          class="flex items-start gap-2 text-caption text-muted-foreground"
        >
          <span class="shrink-0">{{ item.icon }}</span>
          <span>{{ item.text }}</span>
        </li>
      </ul>
    </div>

    <!-- FAQ -->
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h2 class="retro-title">자주 묻는 질문</h2>
      </div>
      <div class="retro-panel-content space-y-4">
        <div v-for="(item, i) in faqItems" :key="i" class="space-y-1">
          <h3 class="text-caption font-semibold text-foreground">Q. {{ item.q }}</h3>
          <p class="text-caption text-muted-foreground">A. {{ item.a }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
