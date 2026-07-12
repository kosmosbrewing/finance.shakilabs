<script setup lang="ts">
import {
  deductionTextClass,
  formatKrwCompact,
  formatPercent,
  formatWon,
} from "@/lib/utils";

const props = defineProps<{
  monthlyGross: number;
  totalDeduction: number;
  effectiveTaxRate: number;
}>();
</script>

<template>
  <div class="result-stat-grid">
    <div class="result-stat-card retro-stat">
      <p class="retro-stat-label">월 급여</p>
      <p class="retro-stat-value text-[0.95rem] sm:text-heading">
        <span class="sm:hidden">{{ formatKrwCompact(props.monthlyGross) }}</span>
        <span class="hidden sm:inline">{{ formatWon(props.monthlyGross) }}</span>
      </p>
    </div>
    <div class="result-stat-card retro-stat">
      <p class="retro-stat-label">공제 합계</p>
      <p
        class="retro-stat-value text-[0.95rem] sm:text-heading"
        :class="deductionTextClass(props.effectiveTaxRate)"
      >
        <span class="sm:hidden">{{ formatKrwCompact(props.totalDeduction) }}</span>
        <span class="hidden sm:inline">{{ formatWon(props.totalDeduction) }}</span>
      </p>
    </div>
    <div class="result-stat-card retro-stat">
      <p class="retro-stat-label">공제 비율</p>
      <p
        class="retro-stat-value text-[0.95rem] sm:text-heading"
        :class="deductionTextClass(props.effectiveTaxRate)"
      >
        {{ formatPercent(props.effectiveTaxRate, 1) }}
      </p>
    </div>
  </div>
</template>
