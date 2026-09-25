<script setup lang="ts">
// 원천세 역산 검산 — 입력한 월 소득세와 역산 연봉으로 다시 계산한 소득세의 차이.
// 결과 칸(WithholdingResult)에서 떼어 입력 아래 왼쪽 칸에 둔다: 입력값을 확인하는 블록이고,
// 결과 칸에 두면 결과가 입력보다 557px 길어져 왼쪽이 빈다(1440px 실측, 1×2 틀 규칙 2).
import { computed } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatWon } from "@/lib/utils";

const props = defineProps<{
  monthlyIncomeTax: number;
  calc: SalaryCalcResult;
}>();

// 검산: 계산된 소득세와 입력 소득세의 차이
const calculatedIncomeTax = computed(() => props.calc.monthlyIncomeTax.value);
const taxDiff = computed(() => Math.abs(calculatedIncomeTax.value - props.monthlyIncomeTax));
// ±5,000원 이상 차이 시 안내 문구 표시
const showDiffWarning = computed(() => taxDiff.value >= 5_000 && props.monthlyIncomeTax > 0);
</script>

<template>
  <section class="retro-panel overflow-hidden" aria-label="계산 검산">
    <div class="retro-panel-content space-y-1.5 text-caption">
      <p class="font-semibold">계산 검산</p>
      <div class="space-y-1 text-muted-foreground">
        <div class="flex justify-between">
          <span>입력한 소득세</span>
          <strong class="tabular-nums text-foreground">{{ formatWon(monthlyIncomeTax) }}</strong>
        </div>
        <div class="flex justify-between">
          <span>계산된 소득세</span>
          <strong class="tabular-nums text-foreground">{{ formatWon(calculatedIncomeTax) }}</strong>
        </div>
        <div class="flex justify-between">
          <span>오차</span>
          <strong
            class="tabular-nums"
            :class="taxDiff <= 5_000 ? 'text-status-success' : 'text-status-danger'"
          >
            {{ formatWon(taxDiff) }}
          </strong>
        </div>
      </div>
      <Transition name="fade">
        <p v-if="showDiffWarning" class="text-status-warning text-caption">
          비과세 조건, 8~20세 자녀 세액공제, 학자금대출 공제로 인해 차이가 커질 수 있습니다.
        </p>
      </Transition>
      <p class="text-caption text-muted-foreground">
        이 결과는 급여명세서의 월 소득세만으로 역산한 추정치입니다. 상여, 중도입사·퇴사,
        추가 세액공제 반영 여부에 따라 실제 연봉과 달라질 수 있습니다.
      </p>
    </div>
  </section>
</template>
