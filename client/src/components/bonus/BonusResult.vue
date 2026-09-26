<script setup lang="ts">
import { computed } from "vue";
import { ShBreakdownBar } from "@shakilabs/ui";
import { Button } from "@/components/ui/button";
import ResultHero from "@/components/common/ResultHero.vue";
import { formatPercent, formatWon } from "@/lib/utils";
import type { BonusResult } from "@/utils/scenarioCalculator";

// 결과 카드만 뷰에서 뺐다 — 입력·결과를 두 카드로 나누면 뷰가 200줄에 닿는다.
// 공유 버튼은 뷰의 퍼널 추적 래퍼 안에 그대로 있다(뷰가 이 카드를 래퍼 안에 둔다).
const props = defineProps<{
  result: BonusResult;
  bonusAmount: number;
}>();

const emit = defineEmits<{
  shareRequest: [];
}>();

const bonusSegments = computed(() => [
  { key: "net", label: "실수령", value: props.result.netBonus, color: "hsl(var(--chart-net))" },
  { key: "deduction", label: "추가 공제", value: props.result.bonusTax, color: "hsl(var(--chart-tax))" },
]);
</script>

<template>
  <section class="retro-panel overflow-hidden" aria-labelledby="bonus-result-title">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 id="bonus-result-title" class="retro-title">성과급 예상 결과</h2>
    </div>
    <div class="retro-panel-content space-y-4">
      <ResultHero label="성과급 실수령" :value="formatWon(result.netBonus)" />
      <div class="retro-stat-grid">
        <div class="retro-stat">
          <p class="retro-stat-label">실효 수령률</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatPercent(result.effectiveBonusRate, 1) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label"><span class="sm:hidden">반영 월 실수령</span><span class="hidden sm:inline">성과급 반영 월 실수령</span></p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.withBonus.monthlyNet) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">추가 공제 추정</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.bonusTax) }}</p>
        </div>
      </div>

      <div class="retro-panel-muted retro-panel-content space-y-3">
        <ShBreakdownBar
          :segments="bonusSegments"
          label="성과급 실수령과 추가 공제 구성"
          :format-value="formatWon"
        />
        <p class="text-body font-semibold text-foreground">핵심 해석</p>
        <p class="text-caption leading-6 text-muted-foreground">
          보너스 <span class="tabular-nums">{{ formatWon(bonusAmount) }}</span> 중 실제 손에 남는 금액은
          <span class="font-semibold text-foreground tabular-nums">{{ formatWon(result.netBonus) }}</span>
          입니다.
        </p>
        <!-- lg에서도 2열로 둔다 — 1열로 쌓으면 결과 카드가 1366×768 창(붙일 수 있는 높이 632px)을 넘어
             입력이 500px 더 긴데도 결과가 옆에 붙지 않는다(ShCalculatorSplit 자동 판정). -->
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <p class="text-tiny uppercase tracking-wide text-muted-foreground">기본 월 실수령</p>
            <p class="mt-1 text-body font-semibold tabular-nums">{{ formatWon(result.base.monthlyNet) }}</p>
          </div>
          <div>
            <p class="text-tiny uppercase tracking-wide text-muted-foreground">보너스 반영 후</p>
            <p class="mt-1 text-body font-semibold tabular-nums">{{ formatWon(result.withBonus.monthlyNet) }}</p>
          </div>
        </div>
        <Button class="w-full" @click="emit('shareRequest')">결과 공유</Button>
      </div>
    </div>
  </section>
</template>
