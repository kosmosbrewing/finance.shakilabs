<script setup lang="ts">
import { computed } from "vue";
import { formatPercent, formatWon } from "@/lib/utils";

import type {
  ComprehensiveTaxResult,
  SourceResult,
} from "@/composables/useComprehensiveTaxCalc";

const props = defineProps<{
  result: ComprehensiveTaxResult;
}>();

const hasSources = computed(() => props.result.sources.length > 0);
const hasTax = computed(() => props.result.totalTax > 0 || props.result.totalWithheld > 0);
const isRefund = computed(() => props.result.netPayable < 0);
const netAmountAbs = computed(() => Math.abs(props.result.netPayable));

const toneClass = computed(() => {
  if (!hasTax.value || props.result.netPayable === 0) return "text-muted-foreground";
  return isRefund.value ? "text-status-success" : "text-status-danger";
});

const netLabel = computed(() => {
  if (!hasTax.value || props.result.netPayable === 0) return "추가 납부/환급 없음";
  return isRefund.value ? "환급 예상" : "추가 납부 예상";
});

function sourceLabel(source: SourceResult): string {
  if (source.type === "business") return "사업소득";
  if (source.type === "rental") return "임대소득";
  return "기타소득";
}

function taxationLabel(source: SourceResult): string {
  return source.taxation === "separate" ? "분리과세" : "종합과세";
}
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">종합소득세 계산 결과</h2>
      <span class="retro-kbd">공제 비율 {{ formatPercent(result.effectiveRate, 1) }}</span>
    </div>

    <div class="retro-panel-content space-y-3">

      <!-- 핵심 배너 -->
      <div class="text-center py-3">
        <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">종합소득세 정산 결과</p>
        <p class="text-display font-bold font-title tabular-nums" :class="toneClass">
          {{ formatWon(netAmountAbs) }}
        </p>
        <p class="text-body font-semibold mt-1.5" :class="toneClass">{{ netLabel }}</p>
      </div>

      <div v-if="hasSources" class="space-y-2 text-caption">

        <!-- 소득원 현황 -->
        <div class="rounded-xl border border-border/70 bg-background overflow-hidden">
          <div class="px-3 py-2 bg-muted/30">
            <p class="font-semibold text-foreground">소득원 현황</p>
          </div>
          <div class="divide-y divide-border/40">
            <div
              v-for="source in result.sources"
              :key="source.type"
              class="px-3 py-2 flex items-center justify-between gap-2"
            >
              <div class="flex items-center gap-2">
                <span class="text-foreground">{{ sourceLabel(source) }}</span>
                <span
                  class="text-tiny px-1.5 py-0.5 rounded-full font-medium"
                  :class="source.taxation === 'separate'
                    ? 'bg-muted/60 text-muted-foreground'
                    : 'bg-primary/10 text-primary'"
                >{{ taxationLabel(source) }}</span>
              </div>
              <strong class="tabular-nums shrink-0">{{ formatWon(source.incomeAmount) }}</strong>
            </div>
          </div>
        </div>

        <!-- STEP 1: 과세표준 계산 -->
        <div class="rounded-xl border border-border/70 bg-background overflow-hidden">
          <div class="px-3 py-2 bg-muted/30 flex items-center gap-2">
            <span class="text-tiny font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">STEP 1</span>
            <p class="font-semibold text-foreground">과세표준 계산</p>
          </div>
          <div class="divide-y divide-border/40">
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>종합과세 소득금액 합계</span>
              <span class="tabular-nums">{{ formatWon(result.comprehensiveIncome) }}</span>
            </div>
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>인적공제</span>
              <span class="tabular-nums text-status-danger">− {{ formatWon(result.personalDeduction) }}</span>
            </div>
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>연금보험료 공제</span>
              <span class="tabular-nums text-status-danger">− {{ formatWon(result.pensionDeduction) }}</span>
            </div>
            <div class="px-3 py-2 flex items-center justify-between font-semibold text-foreground bg-muted/20">
              <span>과세표준</span>
              <strong class="tabular-nums">{{ formatWon(result.taxableBase) }}</strong>
            </div>
          </div>
        </div>

        <!-- STEP 2: 세액 계산 -->
        <div class="rounded-xl border border-border/70 bg-background overflow-hidden">
          <div class="px-3 py-2 bg-muted/30 flex items-center gap-2">
            <span class="text-tiny font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">STEP 2</span>
            <p class="font-semibold text-foreground">세액 계산</p>
          </div>
          <div class="divide-y divide-border/40">
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>산출세액</span>
              <span class="tabular-nums">{{ formatWon(result.calculatedTax) }}</span>
            </div>
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>표준세액공제</span>
              <span class="tabular-nums text-status-danger">− {{ formatWon(result.taxCredit) }}</span>
            </div>
            <div class="px-3 py-2 flex items-center justify-between font-semibold text-foreground bg-muted/20">
              <span>결정세액 (국세)</span>
              <strong class="tabular-nums">{{ formatWon(result.determinedTax) }}</strong>
            </div>
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>지방소득세</span>
              <span class="tabular-nums">{{ formatWon(result.localTax) }}</span>
            </div>
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>분리과세 합계</span>
              <span class="tabular-nums">{{ formatWon(result.separateTaxTotal) }}</span>
            </div>
            <div class="px-3 py-2 flex items-center justify-between font-semibold text-foreground bg-muted/20">
              <span>총세액</span>
              <strong class="tabular-nums">{{ formatWon(result.totalTax) }}</strong>
            </div>
          </div>
        </div>

        <!-- STEP 3: 최종 정산 -->
        <div class="rounded-xl border border-border/70 bg-background overflow-hidden">
          <div class="px-3 py-2 bg-muted/30 flex items-center gap-2">
            <span class="text-tiny font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">STEP 3</span>
            <p class="font-semibold text-foreground">최종 정산</p>
          </div>
          <div class="divide-y divide-border/40">
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>총세액</span>
              <span class="tabular-nums">{{ formatWon(result.totalTax) }}</span>
            </div>
            <div class="px-3 py-1.5 flex items-center justify-between text-muted-foreground">
              <span>기납부세액 (원천징수)</span>
              <span class="tabular-nums text-status-danger">− {{ formatWon(result.totalWithheld) }}</span>
            </div>
          </div>
        </div>

        <!-- 최종 결과 강조 블록 -->
        <div
          class="rounded-xl border px-4 py-3 flex items-center justify-between"
          :class="isRefund
            ? 'bg-status-success/8 border-status-success/30'
            : hasTax && result.netPayable !== 0
              ? 'bg-status-danger/8 border-status-danger/30'
              : 'bg-muted/20 border-border/60'"
        >
          <span class="text-body font-bold text-foreground">납부 / 환급 세액</span>
          <span class="text-body font-bold tabular-nums" :class="toneClass">
            {{ isRefund ? '환급 ' : result.netPayable > 0 ? '납부 ' : '' }}{{ formatWon(netAmountAbs) }}
          </span>
        </div>

      </div>

      <p v-else class="text-caption text-muted-foreground">
        최소 1개 소득원을 활성화하고 수입을 입력하세요.
      </p>
    </div>
  </section>
</template>
