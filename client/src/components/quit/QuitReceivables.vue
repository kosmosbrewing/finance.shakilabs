<script setup lang="ts">
import { formatWon } from "@/lib/utils";

defineProps<{
  servicePeriodLabel: string;
  retirementGross: number;
  retirementTax: number;
  retirementNet: number;
  unemploymentEligible: boolean;
  unemploymentDailyBenefit: number;
  unemploymentDurationDays: number;
  unemploymentTotal: number;
  unpaidLeaveAllowance: number;
  finalMonthlyNet: number;
  totalReceivables: number;
  unemploymentEndDateLabel: string;
}>();
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">받을 돈</h2>
    </div>

    <div class="retro-panel-content space-y-3 text-caption">
      <p class="text-muted-foreground">근속기간: {{ servicePeriodLabel }}</p>

      <div class="retro-board-list">
        <div class="retro-board-item flex-col items-start gap-1">
          <span>① 퇴직금</span>
          <div class="w-full flex items-center justify-between tabular-nums">
            <span class="text-muted-foreground">총액</span><strong>{{ formatWon(retirementGross) }}</strong>
          </div>
          <div class="w-full flex items-center justify-between tabular-nums">
            <span class="text-muted-foreground">퇴직소득세(추정)</span><span>{{ formatWon(retirementTax) }}</span>
          </div>
          <div class="w-full flex items-center justify-between tabular-nums font-semibold">
            <span>세후 수령</span><span>{{ formatWon(retirementNet) }}</span>
          </div>
        </div>

        <div class="retro-board-item flex-col items-start gap-1">
          <span>② 실업급여</span>
          <p class="text-caption" :class="unemploymentEligible ? 'text-status-success' : 'text-status-danger'">
            {{ unemploymentEligible ? '수급 가능' : '수급 불가 가능성 높음' }}
          </p>
          <div class="w-full flex items-center justify-between tabular-nums">
            <span class="text-muted-foreground">1일 수급액</span><span>{{ formatWon(unemploymentDailyBenefit) }}</span>
          </div>
          <div class="w-full flex items-center justify-between tabular-nums">
            <span class="text-muted-foreground">수급 기간</span><span>{{ unemploymentDurationDays }}일</span>
          </div>
          <div class="w-full flex items-center justify-between tabular-nums font-semibold">
            <span>총 수급액</span><span>{{ formatWon(unemploymentTotal) }}</span>
          </div>
          <div class="w-full flex items-center justify-between tabular-nums">
            <span class="text-muted-foreground">종료일</span><span>{{ unemploymentEndDateLabel }}</span>
          </div>
        </div>

        <div class="retro-board-item flex items-center justify-between">
          <span>③ 미사용 연차수당</span>
          <strong class="tabular-nums">{{ formatWon(unpaidLeaveAllowance) }}</strong>
        </div>

        <div class="retro-board-item flex items-center justify-between">
          <span>④ 마지막 월 급여(실수령)</span>
          <strong class="tabular-nums">{{ formatWon(finalMonthlyNet) }}</strong>
        </div>
      </div>

      <div class="border-t border-border pt-2 flex items-center justify-between text-body font-semibold tabular-nums">
        <span>받을 돈 합계</span>
        <span>{{ formatWon(totalReceivables) }}</span>
      </div>
    </div>
  </section>
</template>
