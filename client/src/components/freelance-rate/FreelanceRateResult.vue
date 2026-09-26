<script setup lang="ts">
import { Button } from "@/components/ui/button";
import ResultHero from "@/components/common/ResultHero.vue";
import { formatPercent, formatWon } from "@/lib/utils";
import type { FreelanceRateResult } from "@/utils/scenarioCalculator";

// 결과 카드만 뷰에서 뺐다 — 입력·결과를 두 카드로 나누면 뷰가 200줄을 넘는다.
// 공유 버튼은 뷰의 퍼널 추적 래퍼 안에 그대로 있다(뷰가 이 카드를 래퍼 안에 둔다).
defineProps<{
  result: FreelanceRateResult;
  targetMonthlyNet: number;
}>();

const emit = defineEmits<{
  shareRequest: [];
}>();
</script>

<template>
  <section class="retro-panel overflow-hidden" aria-labelledby="freelance-rate-result-title">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 id="freelance-rate-result-title" class="retro-title">단가 역산 결과</h2>
    </div>
    <div class="retro-panel-content space-y-4">
      <ResultHero label="월 청구액" :value="formatWon(result.monthlyInvoice)" />
      <div class="retro-stat-grid">
        <div class="retro-stat">
          <p class="retro-stat-label">일 단가</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.dailyRate) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">시간당 단가</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.hourlyRate) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">실효 세율</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatPercent(result.tax.effectiveTaxRate, 1) }}</p>
        </div>
      </div>

      <div class="retro-panel-muted retro-panel-content space-y-3">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <p class="text-tiny uppercase tracking-wide text-muted-foreground">원천징수 후 현금흐름</p>
            <p class="mt-1 text-body font-semibold tabular-nums">{{ formatWon(result.cashAfterWithholdingMonthly) }}/월</p>
          </div>
          <div>
            <p class="text-tiny uppercase tracking-wide text-muted-foreground">정산 차이</p>
            <p class="mt-1 text-body font-semibold tabular-nums">{{ result.settlementDelta >= 0 ? "추가 납부" : "환급 예상" }} {{ formatWon(Math.abs(result.settlementDelta)) }}</p>
          </div>
        </div>
        <p class="text-caption leading-6 text-muted-foreground">
          목표 세후 <span class="tabular-nums">{{ formatWon(targetMonthlyNet) }}</span>를 위해 연간 청구액은
          <span class="font-semibold text-foreground tabular-nums">{{ formatWon(result.annualGross) }}</span> 수준이 필요합니다.
        </p>
        <Button class="w-full" @click="emit('shareRequest')">결과 공유</Button>
      </div>
    </div>
  </section>
</template>
