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

    <div class="retro-panel-content space-y-3 text-caption">
      <div class="retro-board-list">
        <div class="retro-board-item flex-col items-start gap-1">
          <span>① 건강보험(지역가입자 추정)</span>
          <strong class="tabular-nums">{{ formatWon(regionalHealthMonthly) }}</strong>
          <p class="text-caption text-muted-foreground">
            임의계속가입 선택 시 약 {{ formatWon(voluntaryContinuationMonthly) }} 수준으로 유지 가능
          </p>
        </div>

        <div class="retro-board-item flex items-center justify-between">
          <span>② 국민연금(임의가입 가정)</span>
          <strong class="tabular-nums">{{ formatWon(pensionMonthly) }}</strong>
        </div>
      </div>

      <div class="border-t border-border pt-2 flex items-center justify-between text-body font-semibold tabular-nums">
        <span>월 고정비 합계</span>
        <span>{{ formatWon(monthlyFixedCost) }}</span>
      </div>
    </div>
  </section>
</template>
