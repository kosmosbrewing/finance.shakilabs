<script setup lang="ts">
import { computed } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import {
  HEALTH_INSURANCE_EXAMPLES,
  estimateAnnualRemuneration,
} from "@/lib/health-insurance-tiers";
import { formatManWon, formatWon } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    calc: SalaryCalcResult;
    mode?: "salary" | "insurance";
  }>(),
  { mode: "salary" }
);

const myPremium = computed(() => props.calc.healthInsurance.value);
const isSalaryMode = computed(() => props.mode === "salary");
const annualRemuneration = computed(() =>
  estimateAnnualRemuneration(myPremium.value)
);

const subtitle = computed(() =>
  isSalaryMode.value
    ? `연봉 ${formatManWon(props.calc.annualGross.value)} 기준`
    : `건보료 ${formatWon(myPremium.value)} 기준`
);

const nearestAnnualRemuneration = computed(() => {
  return HEALTH_INSURANCE_EXAMPLES.reduce((nearest, example) => {
    const currentGap = Math.abs(
      example.annualRemuneration - annualRemuneration.value
    );
    const nearestGap = Math.abs(
      nearest.annualRemuneration - annualRemuneration.value
    );
    return currentGap < nearestGap ? example : nearest;
  }).annualRemuneration;
});
</script>

<template>
  <Transition name="fade">
  <section v-if="myPremium > 0" class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">건강보험료 환산 기준</h2>
    </div>
    <div class="retro-panel-content space-y-3">
      <div class="text-center py-3 space-y-2">
        <p class="text-caption text-muted-foreground">{{ subtitle }}</p>
        <p class="text-display font-bold font-title text-primary tabular-nums">
          {{ formatManWon(annualRemuneration) }}
        </p>
        <p class="text-caption text-muted-foreground">
          근로자 부담률 3.595%로 역산한 연간 보수 추정값
        </p>
      </div>

      <!-- 티어 비교 테이블 -->
      <details class="retro-details">
        <summary class="retro-details-summary">
          <span>연간 보수별 보험료 예시</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <table class="w-full text-caption tabular-nums">
          <thead>
            <tr class="text-muted-foreground border-b border-border/50">
              <th class="py-1.5 pl-3 text-left font-medium">연간 보수</th>
              <th class="py-1.5 pr-3 text-right font-medium">건보료</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="example in HEALTH_INSURANCE_EXAMPLES"
              :key="example.annualRemuneration"
              class="border-b border-border/30 last:border-b-0"
              :class="example.annualRemuneration === nearestAnnualRemuneration ? 'bg-primary/5 text-primary font-semibold' : ''"
            >
              <td class="py-2 pl-3">
                {{ formatManWon(example.annualRemuneration) }}
                <span v-if="example.annualRemuneration === nearestAnnualRemuneration"> (가까운 예시)</span>
              </td>
              <td class="py-2 pr-3 text-right" :class="example.annualRemuneration === nearestAnnualRemuneration ? '' : 'text-muted-foreground'">{{ formatWon(example.monthlyPremium) }}</td>
            </tr>
          </tbody>
        </table>
      </details>

      <p class="text-tiny text-muted-foreground">
        실제 연봉 순위가 아닙니다. 비과세 보수, 보수월액 정산, 상·하한과 개인별 공제는 이 단순 환산에 반영하지 않습니다.
      </p>
    </div>
  </section>
  </Transition>
</template>
