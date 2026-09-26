<script setup lang="ts">
import { Button } from "@/components/ui/button";
import ResultHero from "@/components/common/ResultHero.vue";
import OvertimeBreakdown from "@/components/overtime/OvertimeBreakdown.vue";
import { formatWon } from "@/lib/utils";
import type { OvertimeResult } from "@/utils/scenarioCalculator";

// 결과 카드만 뷰에서 뺐다 — 입력·결과를 두 카드로 나누면 뷰가 200줄을 넘는다.
// 공유 버튼은 뷰의 퍼널 추적 래퍼 안에 그대로 있다(뷰가 이 카드를 래퍼 안에 둔다).
defineProps<{
  result: OvertimeResult;
}>();

const emit = defineEmits<{
  shareRequest: [];
}>();
</script>

<template>
  <section class="retro-panel overflow-hidden" aria-labelledby="overtime-result-title">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 id="overtime-result-title" class="retro-title">추가 수당 예상 결과</h2>
    </div>
    <div class="retro-panel-content space-y-4">
      <ResultHero label="추가 세전 수당" :value="formatWon(result.totalExtraGross)" />
      <div class="retro-stat-grid">
        <div class="retro-stat">
          <p class="retro-stat-label">월 실수령 증가</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">+{{ formatWon(result.totalExtraNet) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">통상 시급</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.hourlyRate) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label"><span class="sm:hidden">수당 반영</span><span class="hidden sm:inline">추가 수당 반영 월급</span></p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.after.monthlyGross) }}</p>
        </div>
      </div>

      <div class="retro-panel-muted retro-panel-content space-y-3">
        <OvertimeBreakdown :result="result" />
        <!-- lg에서도 3열로 둔다 — 1열로 쌓으면 결과 카드가 1366×768 창(붙일 수 있는 높이 632px)을 넘어
             입력이 500px 가까이 더 긴데도 결과가 옆에 붙지 않는다(ShCalculatorSplit 자동 판정). -->
        <div class="grid gap-3 sm:grid-cols-3">
          <div>
            <p class="text-tiny uppercase tracking-wide text-muted-foreground">연장</p>
            <p class="mt-1 text-body font-semibold tabular-nums">{{ formatWon(result.overtimePay) }}</p>
          </div>
          <div>
            <p class="text-tiny uppercase tracking-wide text-muted-foreground">야간 가산</p>
            <p class="mt-1 text-body font-semibold tabular-nums">{{ formatWon(result.nightPay) }}</p>
          </div>
          <div>
            <p class="text-tiny uppercase tracking-wide text-muted-foreground">휴일</p>
            <p class="mt-1 text-body font-semibold tabular-nums">{{ formatWon(result.holidayPay) }}</p>
          </div>
        </div>
        <p class="text-caption leading-6 text-muted-foreground">
          기본 월 실수령 <span class="tabular-nums">{{ formatWon(result.before.monthlyNet) }}</span>에서
          <span class="font-semibold text-foreground tabular-nums">{{ formatWon(result.after.monthlyNet) }}</span>
          으로 올라갑니다.
        </p>
        <Button class="w-full" @click="emit('shareRequest')">결과 공유</Button>
      </div>
    </div>
  </section>
</template>
