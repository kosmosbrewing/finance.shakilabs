<script setup lang="ts">
import { computed } from "vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import ResultHero from "@/components/common/ResultHero.vue";
import { formatWon } from "@/lib/utils";
import type { calculateRegionalHealth } from "@/utils/benefitCalculators";

// 결과 카드만 뷰에서 뺐다 — 입력·결과를 두 카드로 나누면 뷰가 200줄을 넘는다.
const props = defineProps<{
  result: ReturnType<typeof calculateRegionalHealth>;
}>();

const cheapestLabel = computed(() => {
  if (props.result.cheapestOption === "dependent") return "피부양자 등록";
  if (props.result.cheapestOption === "regional") return "지역가입자";
  return "임의계속가입";
});
</script>

<template>
  <section class="retro-panel overflow-hidden" aria-labelledby="regional-health-result-title">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 id="regional-health-result-title" class="retro-title">건보료 비교 결과</h2>
    </div>
    <div class="retro-panel-content space-y-4">
      <ResultHero label="지역가입자 추정" :value="formatWon(result.regionalMonthly)" />
      <BenefitStatGrid
        :items="[
          { label: '현재 근로자 부담', value: formatWon(result.currentMonthly) },
          { label: '임의계속가입 (경감 후)', value: formatWon(result.voluntaryMonthly) },
          { label: '추천', value: cheapestLabel },
        ]"
      />

      <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
        <p v-if="result.dependentEligible" class="font-semibold text-foreground">
          피부양자 등록 요건을 충족할 수 있습니다. 배우자 등 직장가입자가 있다면 보험료 0원이 가능합니다.
        </p>
        <p>지역가입자 보험료는 소득·재산·자동차를 기반으로 한 간이 추정입니다. 실제 보험료는 건강보험공단 고지 기준으로 달라질 수 있습니다.</p>
        <p>
          <strong class="text-foreground">소득 기준이 다릅니다.</strong>
          임의계속가입료는 <strong class="text-foreground">퇴직 전 월급</strong>(보수월액)으로 계산하고,
          지역가입자 소득분은 퇴사 후에 남는 <strong class="text-foreground">금융소득</strong>만 봅니다.
          퇴사 후에도 근로소득이 이어진다면 지역가입자 금액은 이 추정보다 높아집니다.
        </p>
        <p>
          임의계속가입자는 보수월액보험료 <strong class="text-foreground">전액</strong>을 본인이 부담하지만(국민건강보험법 제110조 제5항),
          같은 조 제4항이 위임한 보험료 경감고시 제9조가 <strong class="text-foreground">그 100분의 50을 경감</strong>합니다.
          그래서 실제 고지액은 재직 중 본인부담분과 같은 금액이 됩니다.
        </p>
        <p>임의계속가입은 퇴사 후 2개월 이내 신청해야 하며, 최대 36개월간 유지 가능합니다.</p>
      </div>

      <!-- 비교표 -->
      <div class="retro-panel-muted p-3">
        <p class="text-caption font-semibold text-foreground mb-2">월 보험료 비교</p>
        <p class="text-tiny text-muted-foreground mb-2">모두 장기요양보험료를 포함한 합계입니다. 건강보험료만 적힌 자료와 비교할 때는 아래 분해 금액을 보세요.</p>
        <ul class="space-y-2 text-caption text-muted-foreground">
          <li class="flex justify-between">
            <span>현재 (근로자 부담)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.currentMonthly) }}</span>
          </li>
          <li class="flex justify-between" :class="{ 'text-foreground font-semibold': result.cheapestOption === 'voluntary' }">
            <span>임의계속가입 (경감 후)</span>
            <span class="tabular-nums">{{ formatWon(result.voluntaryMonthly) }}</span>
          </li>
          <li class="flex justify-between text-tiny">
            <span>└ 건강보험 {{ formatWon(result.voluntaryHealth) }} + 장기요양 {{ formatWon(result.voluntaryLongTerm) }}</span>
            <span class="tabular-nums">경감 전 전액 {{ formatWon(result.voluntaryGrossMonthly) }}</span>
          </li>
          <li class="flex justify-between" :class="{ 'text-foreground font-semibold': result.cheapestOption === 'regional' }">
            <span>지역가입자</span>
            <span class="tabular-nums">{{ formatWon(result.regionalMonthly) }}</span>
          </li>
          <li v-if="result.dependentEligible" class="flex justify-between text-foreground font-semibold">
            <span>피부양자 등록</span>
            <span class="tabular-nums">0원</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
