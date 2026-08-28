<script setup lang="ts">
// Stat-grid values are always neutral bold (result grammar, 2026-08 decision):
// rate-based status colors here competed with the brand-colored hero amount.
import {
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
      <p class="retro-stat-value text-[0.95rem] sm:text-heading text-foreground">
        <span class="sm:hidden">{{ formatKrwCompact(props.totalDeduction) }}</span>
        <span class="hidden sm:inline">{{ formatWon(props.totalDeduction) }}</span>
      </p>
    </div>
    <div class="result-stat-card retro-stat">
      <p class="retro-stat-label">공제 비율</p>
      <p class="retro-stat-value text-[0.95rem] sm:text-heading text-foreground">
        {{ formatPercent(props.effectiveTaxRate, 1) }}
      </p>
    </div>
  </div>
</template>
