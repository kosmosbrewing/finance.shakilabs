<script setup lang="ts">
import { computed, ref } from "vue";
import { ShButton } from "@shakilabs/ui";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import { eitcFaqs } from "@/data/benefitFaqs";
import {
  EITC_2026,
  EITC_HOUSEHOLD_SLUGS,
  EITC_PROPERTY_2026,
  type EitcHousehold,
} from "@/data/eitc";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { formatWon } from "@/lib/utils";
import { useEitcCalc } from "@/composables/useEitcCalc";

const props = defineProps<{ initialHousehold?: string }>();

const resolvedInitial: EitcHousehold =
  (props.initialHousehold && EITC_HOUSEHOLD_SLUGS[props.initialHousehold]) || "singleIncome";

const household = ref<EitcHousehold>(resolvedInitial);
const annualIncome = ref(20_000_000);
const childCount = ref(1);
const totalProperty = ref(100_000_000);

const result = useEitcCalc(
  computed(() => ({
    household: household.value,
    annualIncome: annualIncome.value,
    childCount: childCount.value,
    totalProperty: totalProperty.value,
  })),
);

const householdLabel = computed(() =>
  props.initialHousehold ? EITC_2026[resolvedInitial].label : null,
);

const seoTitle = computed(() =>
  householdLabel.value
    ? `${householdLabel.value} 근로장려금 계산기 | 2026 지급액 조회`
    : "2026 근로장려금·자녀장려금 계산기 | 가구 유형별 지급액",
);
const seoDescription = computed(() =>
  householdLabel.value
    ? `${householdLabel.value} 기준 근로장려금 지급액을 소득 구간별로 계산합니다. 최대 ${formatWon(EITC_2026[resolvedInitial].maxAmount)}.`
    : "가구 유형과 총급여를 입력하면 근로장려금(최대 330만원)과 자녀장려금 예상 지급액을 계산합니다. 9월 반기 신청 대비.",
);

const householdOptions = (Object.keys(EITC_2026) as EitcHousehold[]).map((key) => ({
  value: key,
  label: EITC_2026[key].label,
}));

const statItems = computed(() => [
  {
    label: "근로장려금",
    value: formatWon(result.value.eitcAfterProperty),
    tone: "success" as const,
  },
  {
    label: "자녀장려금",
    value: formatWon(result.value.ctcAfterProperty),
  },
  {
    label: "합계 (예상)",
    value: formatWon(result.value.total),
    tone: result.value.total > 0 ? ("success" as const) : ("danger" as const),
  },
  {
    label: "재산 요건",
    value: result.value.isExcludedByProperty
      ? "2.4억 이상 · 지급 제외"
      : result.value.isHalfReduced
        ? "1.7억 이상 · 50% 감액"
        : "충족",
    tone: result.value.isExcludedByProperty ? ("danger" as const) : ("default" as const),
  },
]);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(eitcFaqs)" />

    <CalculatorPageHeader title="근로장려금·자녀장려금 계산기" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <section class="retro-panel overflow-hidden" aria-labelledby="eitc-input-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="eitc-input-title" class="retro-title">가구·소득 조건 입력</h2>
          </div>
          <div class="retro-panel-content min-w-0 space-y-5">
            <CalculatorInteractionTracker
              calculator-id="eitc"
              page-path="/finance/eitc"
            >
              <div class="space-y-5">
                <div class="space-y-1.5">
                  <label class="text-caption font-semibold text-foreground">가구 유형</label>
                  <div class="flex flex-wrap gap-2">
                    <ShButton
                      v-for="opt in householdOptions"
                      :key="opt.value"
                      :variant="household === opt.value ? 'primary' : 'secondary'"
                      size="sm"
                      @click="household = opt.value"
                    >
                      {{ opt.label }}
                    </ShButton>
                  </div>
                  <p class="text-caption leading-relaxed text-muted-foreground">
                    맞벌이: 부부 모두 총급여 300만원 이상 · 홑벌이: 배우자 소득 300만원 미만이거나 부양자녀·70세 이상 직계존속이 있는 가구
                  </p>
                </div>
                <ScenarioField
                  v-model="annualIncome"
                  label="연간 총급여 (부부 합산)"
                  unit="원"
                  :min="0"
                  :max="50_000_000"
                  :step="500_000"
                  format="currency"
                  :presets="[
                    { label: '1,000만', value: 10_000_000 },
                    { label: '2,000만', value: 20_000_000 },
                    { label: '3,000만', value: 30_000_000 },
                  ]"
                />
                <ScenarioField
                  v-model="childCount"
                  label="부양자녀 수 (18세 미만)"
                  unit="명"
                  :min="0"
                  :max="6"
                  :presets="[
                    { label: '0명', value: 0 },
                    { label: '1명', value: 1 },
                    { label: '2명', value: 2 },
                  ]"
                />
                <ScenarioField
                  v-model="totalProperty"
                  label="가구원 재산 합계 (주택·예금·전세보증금 등)"
                  unit="원"
                  :min="0"
                  :max="400_000_000"
                  :step="10_000_000"
                  format="currency"
                  :presets="[
                    { label: '1억', value: 100_000_000 },
                    { label: '1.7억', value: 170_000_000 },
                    { label: '2.4억', value: 240_000_000 },
                  ]"
                />
              </div>
            </CalculatorInteractionTracker>
          </div>
        </section>

        <BenefitStatGrid :items="statItems" />

        <section class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 class="retro-title">산정 기준과 한계</h2>
          </div>
          <div class="retro-panel-content space-y-2 text-caption leading-relaxed text-muted-foreground">
            <p><strong class="text-foreground">소득 상한:</strong> 단독 2,200만 / 홑벌이 3,200만 / 맞벌이 4,400만원 미만. 최대 지급액은 각각 165만 / 285만 / 330만원입니다.</p>
            <p><strong class="text-foreground">재산 요건:</strong> 가구원 재산 합계 {{ formatWon(EITC_PROPERTY_2026.exclusionLimit) }} 이상은 지급 제외, {{ formatWon(EITC_PROPERTY_2026.halfReductionThreshold) }} 이상은 50% 감액됩니다. 부채는 차감하지 않습니다.</p>
            <p><strong class="text-foreground">신청 시기:</strong> 정기 신청 5월, 근로소득자는 반기 신청(상반기분 9월, 하반기분 다음 해 3월)이 가능합니다.</p>
            <p><strong class="text-foreground">한계:</strong> 실제 산정표는 총급여 구간 단위와 단수 조정, 사업소득의 업종별 조정률, 국민연금 수급 등 제외 요건이 있어 이 간이 계산과 소액 차이가 날 수 있습니다. 확정 금액은 홈택스 모의계산으로 확인하세요.</p>
          </div>
        </section>

        <InternalLink current="eitc" />
        <BenefitFaqPanel :items="eitcFaqs" />
      </div>

      <div class="space-y-4">
        <RecentCalcPanel />
        <CommunitySidebar page-key="eitc-main" />
      </div>
    </section>
  </div>
</template>
