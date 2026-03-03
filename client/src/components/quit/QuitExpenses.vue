<script setup lang="ts">
import { formatWon } from "@/lib/utils";

defineProps<{
  regionalHealthMonthly: number;
  voluntaryContinuationMonthly: number;
  pensionMonthly: number;
  monthlyFixedCost: number;
}>();
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">퇴사 후 내야 할 돈 (월)</h2>
    </div>

    <div class="retro-panel-content space-y-3">
      <div class="retro-board-list text-caption">
        <div class="retro-board-item">
          <div class="min-w-0">
            <span>건강보험 (지역가입자 추정)</span>
            <p class="text-tiny text-muted-foreground mt-0.5">
              임의계속가입 시 약 {{ formatWon(voluntaryContinuationMonthly) }}으로 유지 가능
            </p>
          </div>
          <strong class="shrink-0 tabular-nums">{{ formatWon(regionalHealthMonthly) }}</strong>
        </div>

        <div class="retro-board-item">
          <span>국민연금 (임의가입 가정)</span>
          <strong class="shrink-0 tabular-nums">{{ formatWon(pensionMonthly) }}</strong>
        </div>

        <div class="retro-board-item bg-primary/5 font-semibold text-body">
          <span>월 고정비 합계</span>
          <strong class="shrink-0 tabular-nums text-primary">{{ formatWon(monthlyFixedCost) }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>
