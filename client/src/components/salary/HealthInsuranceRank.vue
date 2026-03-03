<script setup lang="ts">
import { computed } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { HEALTH_INSURANCE_TIERS, findPercentile } from "@/lib/health-insurance-tiers";
import { formatManWon, formatWon } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    calc: SalaryCalcResult;
    mode?: "salary" | "insurance";
  }>(),
  { mode: "salary" }
);

const result = computed(() => findPercentile(props.calc.healthInsurance.value));
const myPremium = computed(() => props.calc.healthInsurance.value);
const isSalaryMode = computed(() => props.mode === "salary");

const subtitle = computed(() =>
  isSalaryMode.value
    ? `연봉 ${formatManWon(props.calc.annualGross.value)} 기준`
    : `건보료 ${formatWon(myPremium.value)} 기준`
);

const nearestTierPercentile = computed(() => {
  const p = result.value.percentile;
  let nearest: number = HEALTH_INSURANCE_TIERS[0].percentile;
  let minDiff = Math.abs(p - nearest);
  for (const tier of HEALTH_INSURANCE_TIERS) {
    const diff = Math.abs(p - tier.percentile);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = tier.percentile;
    }
  }
  return nearest;
});

// 게이지 퍼센트 (상위 1% = 99%, 상위 90% = 10%)
const gaugePercent = computed(() => Math.max(2, 100 - result.value.percentile));

const rankComment = computed(() => {
  const p = result.value.percentile;
  if (p <= 5) return "직장인 상위 5% 이내의 고소득 구간이에요.";
  if (p <= 10) return "직장인 상위 10% 이내에 해당해요.";
  if (p <= 25) return "평균보다 높은 소득 구간이에요.";
  if (p <= 50) return "직장인 평균 이상의 소득 구간이에요.";
  if (p <= 75) return "직장인 평균 근처의 소득 구간이에요.";
  return "소득이 아직 낮은 구간이지만, 앞으로의 성장이 기대돼요.";
});
</script>

<template>
  <Transition name="fade">
  <section v-if="myPremium > 0" class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">직장인 소득 랭킹</h2>
    </div>
    <div class="retro-panel-content space-y-3">
      <!-- 히어로: 백분위 + 게이지 -->
      <div class="text-center py-3 space-y-2">
        <p class="text-caption text-muted-foreground">{{ subtitle }}</p>
        <p class="text-display font-bold font-title text-primary tabular-nums">
          {{ result.label }}
        </p>
        <div class="mx-auto max-w-xs space-y-1">
          <div class="relative h-3 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
              :style="{ width: `${gaugePercent}%` }"
            />
          </div>
          <div class="flex justify-between text-tiny text-muted-foreground tabular-nums">
            <span>상위 90%</span>
            <span>상위 1%</span>
          </div>
        </div>
        <p class="text-caption text-muted-foreground">{{ rankComment }}</p>
      </div>

      <!-- 티어 비교 테이블 -->
      <details class="retro-details">
        <summary class="retro-details-summary">
          <span>전체 랭킹 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <table class="w-full text-caption tabular-nums">
          <thead>
            <tr class="text-muted-foreground border-b border-border/50">
              <th class="py-1.5 pl-3 text-left font-medium">구간</th>
              <th class="py-1.5 text-right font-medium">연봉</th>
              <th class="py-1.5 pr-3 text-right font-medium">건보료</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tier in HEALTH_INSURANCE_TIERS"
              :key="tier.percentile"
              class="border-b border-border/30 last:border-b-0"
              :class="tier.percentile === nearestTierPercentile ? 'bg-primary/5 text-primary font-semibold' : ''"
            >
              <td class="py-2 pl-3">
                상위 {{ tier.percentile }}%
                <span v-if="tier.percentile === nearestTierPercentile"> (나)</span>
              </td>
              <td class="py-2 text-right">{{ formatManWon(tier.annualSalary) }}+</td>
              <td class="py-2 pr-3 text-right" :class="tier.percentile === nearestTierPercentile ? '' : 'text-muted-foreground'">{{ formatWon(tier.monthlyPremium) }}</td>
            </tr>
          </tbody>
        </table>
      </details>

      <p class="text-tiny text-muted-foreground">
        소득 분위 기준: 2024 건강보험 통계연보 추정 · 건보료: 2026년 요율(3.595%) 적용
      </p>
    </div>
  </section>
  </Transition>
</template>
