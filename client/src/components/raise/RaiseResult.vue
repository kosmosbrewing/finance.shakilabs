<script setup lang="ts">
import { computed } from "vue";
import { ShMetricBars, type MetricBarGroup } from "@shakilabs/ui";
import { Button } from "@/components/ui/button";
import ResultHero from "@/components/common/ResultHero.vue";
import { formatWon } from "@/lib/utils";
import type { RaiseResult } from "@/utils/scenarioCalculator";

// 결과 카드만 뷰에서 뺐다 — 입력·결과를 두 카드로 나누면 뷰가 200줄을 넘는다.
// 공유 버튼은 뷰의 퍼널 추적 래퍼 안에 그대로 있다(뷰가 이 카드를 래퍼 안에 둔다).
const props = defineProps<{
  result: RaiseResult;
}>();

const emit = defineEmits<{
  shareRequest: [];
}>();

// 협상 후(after)를 highlight로 둬 비교 기준을 시각적으로 고정한다.
const comparisonMetrics = computed<MetricBarGroup[]>(() =>
  [
    { key: "gross", label: "월 급여", before: props.result.current.monthlyGross, after: props.result.next.monthlyGross },
    { key: "net", label: "월 실수령", before: props.result.current.monthlyNet, after: props.result.next.monthlyNet },
    { key: "deduction", label: "월 공제", before: props.result.current.totalDeduction, after: props.result.next.totalDeduction },
  ].map((metric) => ({
    key: metric.key,
    label: metric.label,
    values: [
      { key: "before", label: "현재", value: metric.before },
      { key: "after", label: "협상 후", value: metric.after, highlight: true },
    ],
  })),
);
</script>

<template>
  <section class="retro-panel overflow-hidden" aria-labelledby="raise-result-title">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 id="raise-result-title" class="retro-title">연봉 인상 예상 결과</h2>
    </div>
    <div class="retro-panel-content space-y-4">
      <ResultHero label="월 체감 증가" :value="`+${formatWon(result.monthlyNetDiff)}`" />
      <div class="retro-stat-grid">
        <div class="retro-stat">
          <p class="retro-stat-label">현재 월 실수령</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.current.monthlyNet) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">협상 후 월 실수령</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.next.monthlyNet) }}</p>
        </div>
        <div class="retro-stat">
          <p class="retro-stat-label">연간 실수령 증가</p>
          <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">+{{ formatWon(result.annualNetDiff) }}</p>
        </div>
      </div>

      <ShMetricBars :metrics="comparisonMetrics" :format-value="formatWon" />

      <div class="retro-panel-muted retro-panel-content space-y-3">
        <p class="text-body font-semibold text-foreground">핵심 해석</p>
        <p class="text-caption leading-6 text-muted-foreground">
          세전으로는 <span class="tabular-nums">{{ formatWon(result.raiseAmount) }}</span> 인상이지만, 월 실수령 증가는
          <span class="font-semibold text-foreground tabular-nums">{{ formatWon(result.monthlyNetDiff) }}</span>
          입니다.
        </p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <p class="text-tiny uppercase tracking-wide text-muted-foreground">추가 보험료</p>
            <p class="mt-1 text-body font-semibold tabular-nums">+{{ formatWon(result.insuranceDelta) }}/월</p>
          </div>
          <div>
            <p class="text-tiny uppercase tracking-wide text-muted-foreground">추가 세금</p>
            <p class="mt-1 text-body font-semibold tabular-nums">+{{ formatWon(result.taxDelta) }}/월</p>
          </div>
        </div>
        <Button class="w-full" @click="emit('shareRequest')">결과 공유</Button>
      </div>
    </div>
  </section>
</template>
