<script setup lang="ts">
import { computed } from "vue";
import { formatManWon } from "@/lib/utils";

defineProps<{
  availableFund: number;
  monthlyFixedCost: number;
  monthlyLivingCost: number;
  scenarios: Array<{ livingCost: number; spend: number; months: number }>;
}>();

function formatMonths(value: number): string {
  return `${Math.max(0, value).toFixed(1)}개월`;
}

const colorByMonths = computed(() => (months: number) => {
  if (months >= 18) return "text-status-success";
  if (months >= 12) return "text-status-warning";
  if (months >= 9) return "text-status-caution";
  return "text-status-danger";
});
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">생존 시뮬레이션</h2>
      <span class="retro-kbd">SURVIVAL</span>
    </div>

    <div class="retro-panel-content space-y-3 text-caption">
      <p class="text-muted-foreground">
        가용자금 {{ formatManWon(availableFund) }} / 월 고정비 {{ formatManWon(monthlyFixedCost) }} / 현재 생활비 {{ formatManWon(monthlyLivingCost) }}
      </p>

      <div class="retro-board-list">
        <div v-for="scenario in scenarios" :key="scenario.livingCost" class="retro-board-item">
          <span>월 생활비 {{ formatManWon(scenario.livingCost) }}</span>
          <span class="tabular-nums" :class="colorByMonths(scenario.months)">
            {{ formatMonths(scenario.months) }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
