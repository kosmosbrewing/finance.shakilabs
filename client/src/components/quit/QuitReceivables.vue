<script setup lang="ts">
import { formatKrwAuto, formatWon } from "@/lib/utils";

import type { QuitReason } from "@/data/unemploymentTable";

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
  quitReason: QuitReason;
}>();

const eligibleLabel: Record<string, string> = {
  layoff: "수급 가능 (권고사직)",
  dismissal: "수급 가능 (해고)",
  contract_end: "수급 가능 (계약만료)",
};

</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">받을 돈</h2>
      <span class="retro-kbd">{{ servicePeriodLabel }}</span>
    </div>

    <div class="retro-panel-content space-y-3">
      <!-- 핵심 배너 -->
      <div class="text-center py-3">
        <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">퇴사 시 총 수령 예상액</p>
        <p class="text-display font-bold font-title text-primary tabular-nums">
          {{ formatKrwAuto(totalReceivables) }}
        </p>
        <p class="text-body text-muted-foreground mt-1.5">
          퇴직금 + 실업급여 + 연차수당 + 마지막 급여
        </p>
      </div>

      <!-- 항목 상세 -->
      <div class="space-y-2 text-caption">

        <!-- ① 퇴직금 -->
        <div class="rounded-xl border border-border/70 bg-background overflow-hidden">
          <div class="px-3 py-2 bg-muted/30 flex items-center justify-between">
            <span class="font-semibold text-foreground">① 퇴직금</span>
            <span class="tabular-nums font-bold text-primary">{{ formatKrwAuto(retirementNet) }}</span>
          </div>
          <div class="divide-y divide-border/40">
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>세전 총액</span>
              <span class="tabular-nums">{{ formatKrwAuto(retirementGross) }}</span>
            </div>
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>퇴직소득세 (추정)</span>
              <span class="tabular-nums text-status-danger">− {{ formatWon(retirementTax) }}</span>
            </div>
            <div class="px-3 py-2 flex items-center justify-between font-semibold text-foreground">
              <span>세후 수령</span>
              <span class="tabular-nums">{{ formatKrwAuto(retirementNet) }}</span>
            </div>
          </div>
        </div>

        <!-- ② 실업급여 -->
        <div class="rounded-xl border border-border/70 bg-background overflow-hidden">
          <div class="px-3 py-2 bg-muted/30 flex items-center justify-between gap-2">
            <span class="font-semibold text-foreground">② 실업급여</span>
            <span
              class="text-tiny font-semibold px-2 py-0.5 rounded-full shrink-0"
              :class="unemploymentEligible
                ? 'bg-status-success/15 text-status-success'
                : 'bg-status-caution/15 text-status-caution'"
            >
              {{ unemploymentEligible ? eligibleLabel[quitReason] ?? '수급 가능' : '자발적 퇴사 · 수급 제한' }}
            </span>
          </div>
          <div class="divide-y divide-border/40">
            <template v-if="unemploymentEligible">
              <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
                <span>1일 수급액</span>
                <span class="tabular-nums">{{ formatWon(unemploymentDailyBenefit) }}</span>
              </div>
              <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
                <span>수급 기간</span>
                <span class="tabular-nums">{{ unemploymentDurationDays }}일</span>
              </div>
              <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
                <span>수급 종료일</span>
                <span class="tabular-nums">{{ unemploymentEndDateLabel }}</span>
              </div>
              <div class="px-3 py-2 flex items-center justify-between font-semibold text-foreground">
                <span>총 수급액</span>
                <span class="tabular-nums">{{ formatKrwAuto(unemploymentTotal) }}</span>
              </div>
            </template>
            <div v-else class="px-3 py-2.5 text-caption text-muted-foreground space-y-1">
              <p>자발적 퇴사는 원칙적으로 실업급여 대상이 아닙니다.</p>
              <p class="text-tiny">임금체불·직장 내 괴롭힘 등 정당한 사유가 있으면 수급 가능할 수 있습니다. 퇴사 사유를 변경하면 예상 금액을 확인할 수 있습니다.</p>
            </div>
          </div>
        </div>

        <!-- ③ 미사용 연차수당 + ④ 마지막 월급 -->
        <div class="rounded-xl border border-border/70 bg-background overflow-hidden">
          <div class="divide-y divide-border/40">
            <div class="px-3 py-2.5 flex items-center justify-between">
              <span class="text-foreground">③ 미사용 연차수당</span>
              <strong class="tabular-nums">{{ formatWon(unpaidLeaveAllowance) }}</strong>
            </div>
            <div class="px-3 py-2.5 flex items-center justify-between">
              <span class="text-foreground">④ 마지막 월급 (실수령)</span>
              <strong class="tabular-nums">{{ formatWon(finalMonthlyNet) }}</strong>
            </div>
          </div>
        </div>

      </div>

      <!-- 합계 -->
      <div class="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 flex items-center justify-between">
        <span class="text-body font-bold text-foreground">총 합계</span>
        <span class="text-body font-bold tabular-nums text-primary">{{ formatKrwAuto(totalReceivables) }}</span>
      </div>
    </div>
  </section>
</template>
