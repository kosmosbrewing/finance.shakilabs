<script setup lang="ts">
import { computed, ref } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import ResultHero from "@/components/common/ResultHero.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import { regionalHealthFaqs } from "@/data/benefitFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { normalizeRegionalHealthInput } from "@/lib/benefitValidators";
import { formatManWon, formatWon } from "@/lib/utils";
import { calculateRegionalHealth } from "@/utils/benefitCalculators";

const props = defineProps<{ initialSalary?: number }>();

const monthlySalary = ref(props.initialSalary ?? 3_500_000);
const financialIncome = ref(0);
const propertyTaxBase = ref(0);
const carTaxBase = ref(0);

const input = computed(() =>
  normalizeRegionalHealthInput({
    monthlySalary: monthlySalary.value,
    financialIncome: financialIncome.value,
    propertyTaxBase: propertyTaxBase.value,
    carTaxBase: carTaxBase.value,
  }),
);
const result = computed(() => calculateRegionalHealth(input.value));

const salaryLabel = computed(() =>
  props.initialSalary ? formatManWon(props.initialSalary / 10000) : null,
);

const seoTitle = computed(() =>
  salaryLabel.value
    ? `2026 월급 ${salaryLabel.value} 지역가입자 건강보험료 | 퇴사 후 건보`
    : "2026 지역가입자 건강보험료 계산기 | 퇴사 후 건보·임의계속가입 비교",
);
const seoDescription = computed(() =>
  salaryLabel.value
    ? `월급 ${salaryLabel.value}원 기준 퇴사 후 지역가입자 건보료와 임의계속가입 보험료를 비교합니다.`
    : "퇴사 후 지역가입자 건강보험료, 임의계속가입, 피부양자 등록 세 가지 옵션을 비교해 가장 저렴한 방법을 찾습니다.",
);

const cheapestLabel = computed(() => {
  if (result.value.cheapestOption === "dependent") return "피부양자 등록";
  if (result.value.cheapestOption === "regional") return "지역가입자";
  return "임의계속가입";
});
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(regionalHealthFaqs)" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <div class="space-y-1">
              <h1 class="retro-title">지역가입자 건강보험료</h1>
              <p class="text-caption text-muted-foreground">퇴사 후 건보료 옵션(지역가입, 임의계속, 피부양자)을 비교합니다.</p>
            </div>
            <FreshBadge message="2026년 건보율 7.19% 반영" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="space-y-4">
              <ScenarioField
                v-model="monthlySalary"
                label="퇴직 전 월급 (세전)"
                unit="원"
                :min="1_000_000"
                :max="20_000_000"
                :step="100_000"
                format="currency"
                :presets="[
                  { label: '250만', value: 2_500_000 },
                  { label: '350만', value: 3_500_000 },
                  { label: '500만', value: 5_000_000 },
                ]"
              />
              <ScenarioField
                v-model="financialIncome"
                label="연간 금융소득 (이자·배당)"
                unit="원"
                :min="0"
                :max="100_000_000"
                :step="1_000_000"
                format="currency"
                :presets="[
                  { label: '없음', value: 0 },
                  { label: '500만', value: 5_000_000 },
                  { label: '2000만', value: 20_000_000 },
                ]"
              />
              <ScenarioField
                v-model="propertyTaxBase"
                label="부동산 과세표준 (공시가격)"
                unit="원"
                :min="0"
                :max="5_000_000_000"
                :step="10_000_000"
                format="currency"
                :presets="[
                  { label: '없음', value: 0 },
                  { label: '2억', value: 200_000_000 },
                  { label: '5억', value: 500_000_000 },
                ]"
              />
              <ScenarioField
                v-model="carTaxBase"
                label="자동차 과세표준"
                unit="원"
                :min="0"
                :max="200_000_000"
                :step="5_000_000"
                format="currency"
                :presets="[
                  { label: '없음', value: 0 },
                  { label: '2000만', value: 20_000_000 },
                  { label: '5000만', value: 50_000_000 },
                ]"
              />
            </div>

            <div class="space-y-4">
              <ResultHero label="지역가입자 추정" :value="formatWon(result.regionalMonthly)" />
              <BenefitStatGrid
                :items="[
                  { label: '현재 근로자 부담', value: formatWon(result.currentMonthly) },
                  { label: '임의계속가입', value: formatWon(result.voluntaryMonthly) },
                  { label: '추천', value: cheapestLabel },
                ]"
              />

              <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
                <p v-if="result.dependentEligible" class="font-semibold text-primary">
                  피부양자 등록 요건을 충족할 수 있습니다. 배우자 등 직장가입자가 있다면 보험료 0원이 가능합니다.
                </p>
                <p>지역가입자 보험료는 소득·재산·자동차를 기반으로 한 간이 추정입니다. 실제 보험료는 건강보험공단 고지 기준으로 달라질 수 있습니다.</p>
                <p>임의계속가입은 퇴사 후 2개월 이내 신청해야 하며, 최대 36개월간 유지 가능합니다.</p>
              </div>

              <!-- 비교표 -->
              <div class="retro-panel-muted p-3">
                <p class="text-caption font-semibold text-foreground mb-2">월 보험료 비교</p>
                <ul class="space-y-2 text-caption text-muted-foreground">
                  <li class="flex justify-between">
                    <span>현재 (근로자 부담)</span>
                    <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.currentMonthly) }}</span>
                  </li>
                  <li class="flex justify-between" :class="{ 'text-primary font-semibold': result.cheapestOption === 'voluntary' }">
                    <span>임의계속가입</span>
                    <span class="tabular-nums">{{ formatWon(result.voluntaryMonthly) }}</span>
                  </li>
                  <li class="flex justify-between" :class="{ 'text-primary font-semibold': result.cheapestOption === 'regional' }">
                    <span>지역가입자</span>
                    <span class="tabular-nums">{{ formatWon(result.regionalMonthly) }}</span>
                  </li>
                  <li v-if="result.dependentEligible" class="flex justify-between text-primary font-semibold">
                    <span>피부양자 등록</span>
                    <span class="tabular-nums">0원</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <BenefitFaqPanel :items="regionalHealthFaqs" />
        <InternalLink current="regional-health" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="regional-health-main" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
