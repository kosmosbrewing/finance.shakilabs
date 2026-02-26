<script setup lang="ts">
import { computed } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { HEALTH_INSURANCE_TIERS, findPercentile } from "@/lib/health-insurance-tiers";
import { formatManWon, formatWon } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const props = defineProps<{
  calc: SalaryCalcResult;
}>();

const result = computed(() => findPercentile(props.calc.healthInsurance.value));

const myPremium = computed(() => props.calc.healthInsurance.value);

// 보간된 백분위에서 가장 가까운 티어를 찾아 하이라이트
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

const rankComment = computed(() => {
  const p = result.value.percentile;
  if (p <= 5) return "상위권입니다. 건보료도 만만치 않겠네요.";
  if (p <= 10) return "상위 10% 안에 드는 고소득 구간입니다.";
  if (p <= 25) return "평균보다 확실히 위. 나쁘지 않은 위치.";
  if (p <= 50) return "직장인 중간 이상 구간입니다.";
  if (p <= 75) return "평균 근처. 대한민국 직장인의 흔한 위치.";
  return "아직 초반 구간. 앞으로가 기대되는 자리.";
});

function tierSalaryLabel(salary: number): string {
  return `연봉 ${formatManWon(salary)}+`;
}
</script>

<template>
  <section v-if="myPremium > 0" class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">직장인 소득 랭킹</h2>
    </div>
    <div class="retro-panel-content space-y-3">
      <!-- 요약 -->
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <div class="retro-stat">
            <p class="retro-stat-label">내 건보료</p>
            <p class="retro-stat-value tabular-nums">{{ formatWon(myPremium) }}</p>
          </div>
          <div class="retro-stat">
            <p class="retro-stat-label">소득 랭킹</p>
            <p class="retro-stat-value tabular-nums">{{ result.label }}</p>
          </div>
        </div>
        <p class="text-caption text-muted-foreground">{{ rankComment }}</p>
      </div>

      <!-- 전체 분포 (접이식) -->
      <Accordion type="single" collapsible>
        <AccordionItem value="distribution">
          <AccordionTrigger class="text-caption">
            전체 랭킹 보기
          </AccordionTrigger>
          <AccordionContent>
            <div class="retro-board-list">
              <div
                v-for="(tier, index) in HEALTH_INSURANCE_TIERS"
                :key="tier.percentile"
                class="retro-board-item"
                :class="{
                  'bg-accent/20': tier.percentile === nearestTierPercentile,
                }"
              >
                <span class="retro-kbd w-6 shrink-0 justify-center">{{ index + 1 }}</span>
                <span class="font-semibold tabular-nums w-20 shrink-0">
                  상위 {{ tier.percentile }}%
                </span>
                <span class="text-muted-foreground flex-1 text-right sm:text-left truncate">
                  {{ tierSalaryLabel(tier.annualSalary) }}
                </span>
                <span class="tabular-nums font-medium w-24 text-right">
                  {{ formatWon(tier.monthlyPremium) }}
                </span>
                <span
                  v-if="tier.percentile === nearestTierPercentile"
                  class="text-caption font-bold text-primary shrink-0"
                >
                  &larr; 나
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <!-- 출처 -->
      <p class="text-caption text-muted-foreground">
        출처: 2024 건강보험 통계연보 | 직장가입자 근로자 부담분 기준 추정
      </p>
    </div>
  </section>
</template>
