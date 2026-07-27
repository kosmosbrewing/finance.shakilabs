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
import { dependentFaqs } from "@/data/benefitFaqs";
import { DEPENDENT_2026 } from "@/data/dependentEligibility";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { formatWon } from "@/lib/utils";
import { useDependentEligibility } from "@/composables/useDependentEligibility";

const seoTitle = "2026 건보 피부양자 자격 판정기 | 소득·재산 기준";
const seoDescription =
  "연 합산소득 2,000만원, 재산세 과세표준 5억4천만·9억원 기준으로 건강보험 피부양자 유지 가능 여부를 판정합니다. 탈락 시 지역가입자 보험료 계산으로 이어집니다.";

const annualIncome = ref(12_000_000);
const propertyTaxBase = ref(300_000_000);
const hasBusinessRegistration = ref(false);
const businessIncome = ref(0);

const result = useDependentEligibility(
  computed(() => ({
    annualIncome: annualIncome.value,
    propertyTaxBase: propertyTaxBase.value,
    hasBusinessRegistration: hasBusinessRegistration.value,
    businessIncome: businessIncome.value,
  })),
);

const statItems = computed(() => [
  {
    label: "판정 결과",
    value: result.value.isEligible ? "피부양자 유지 가능" : "탈락 예상",
    tone: result.value.isEligible ? ("success" as const) : ("danger" as const),
  },
  {
    label: "적용 소득 상한",
    value: formatWon(result.value.appliedIncomeLimit),
  },
  {
    label: "소득 여유",
    value: result.value.incomeMargin >= 0
      ? formatWon(result.value.incomeMargin)
      : `${formatWon(-result.value.incomeMargin)} 초과`,
    tone: result.value.incomeMargin >= 0 ? ("default" as const) : ("danger" as const),
  },
  {
    label: "다음 재산 기준까지",
    value: result.value.propertyMargin >= 0
      ? formatWon(result.value.propertyMargin)
      : `${formatWon(-result.value.propertyMargin)} 초과`,
    tone: result.value.propertyMargin >= 0 ? ("default" as const) : ("danger" as const),
  },
]);

const registrationOptions = [
  { label: "사업자등록 없음", value: false },
  { label: "사업자등록 있음", value: true },
];
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(dependentFaqs)" />

    <CalculatorPageHeader title="건강보험 피부양자 자격 판정기" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <section class="retro-panel overflow-hidden" aria-labelledby="dependent-input-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="dependent-input-title" class="retro-title">소득·재산 조건 입력</h2>
          </div>
          <div class="retro-panel-content min-w-0 space-y-5">
            <CalculatorInteractionTracker
              calculator-id="dependent_eligibility"
              page-path="/finance/dependent"
            >
              <div class="space-y-5">
                <ScenarioField
                  v-model="annualIncome"
                  label="연 합산소득 (이자·배당·사업·근로·연금·기타)"
                  unit="원"
                  :min="0"
                  :max="60_000_000"
                  :step="1_000_000"
                  format="currency"
                  :presets="[
                    { label: '1,000만', value: 10_000_000 },
                    { label: '1,900만', value: 19_000_000 },
                    { label: '2,400만', value: 24_000_000 },
                  ]"
                />
                <ScenarioField
                  v-model="propertyTaxBase"
                  label="재산세 과세표준 (주택은 대략 공시가격의 60%)"
                  unit="원"
                  :min="0"
                  :max="2_000_000_000"
                  :step="10_000_000"
                  format="currency"
                  :presets="[
                    { label: '3억', value: 300_000_000 },
                    { label: '5.4억', value: 540_000_000 },
                    { label: '9억', value: 900_000_000 },
                  ]"
                />
                <div class="space-y-1.5">
                  <label class="text-caption font-semibold text-foreground">사업자등록 여부</label>
                  <div class="flex flex-wrap gap-2">
                    <ShButton
                      v-for="opt in registrationOptions"
                      :key="String(opt.value)"
                      :variant="hasBusinessRegistration === opt.value ? 'primary' : 'secondary'"
                      size="sm"
                      @click="hasBusinessRegistration = opt.value"
                    >
                      {{ opt.label }}
                    </ShButton>
                  </div>
                </div>
                <ScenarioField
                  v-model="businessIncome"
                  label="연 사업소득 (합산소득 중 사업소득분)"
                  unit="원"
                  :min="0"
                  :max="30_000_000"
                  :step="500_000"
                  format="currency"
                  :presets="[
                    { label: '0원', value: 0 },
                    { label: '300만', value: 3_000_000 },
                    { label: '600만', value: 6_000_000 },
                  ]"
                />
              </div>
            </CalculatorInteractionTracker>
          </div>
        </section>

        <BenefitStatGrid :items="statItems" />

        <section v-if="!result.isEligible" class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 class="retro-title">탈락 사유</h2>
          </div>
          <div class="retro-panel-content space-y-2">
            <ul class="ml-4 list-disc space-y-1 text-caption text-muted-foreground">
              <li v-for="reason in result.failReasons" :key="reason">{{ reason }}</li>
            </ul>
            <p class="text-caption leading-relaxed text-muted-foreground">
              피부양자에서 제외되면 지역가입자로 전환되어 소득·재산 기준 보험료가 부과됩니다.
              <RouterLink to="/regional-health" class="font-semibold text-primary underline">
                지역가입자 건보료 계산기
              </RouterLink>로 예상 보험료를 미리 확인해 보세요.
            </p>
          </div>
        </section>

        <section class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 class="retro-title">판정 기준과 한계</h2>
          </div>
          <div class="retro-panel-content space-y-2 text-caption leading-relaxed text-muted-foreground">
            <p><strong class="text-foreground">소득 요건:</strong> 연 합산소득 {{ formatWon(DEPENDENT_2026.incomeLimit) }} 이하. 이자·배당·사업·근로·연금·기타소득을 모두 합산합니다.</p>
            <p><strong class="text-foreground">재산 요건:</strong> 재산세 과세표준 {{ formatWon(DEPENDENT_2026.propertyHighThreshold) }} 초과는 즉시 제외, {{ formatWon(DEPENDENT_2026.propertyMidThreshold) }} 초과~9억 이하는 연 소득 {{ formatWon(DEPENDENT_2026.midPropertyIncomeLimit) }} 이하일 때만 유지됩니다.</p>
            <p><strong class="text-foreground">사업소득 요건:</strong> 사업자등록이 있으면 사업소득이 없어야 하고, 미등록(프리랜서 등)은 연 {{ formatWon(DEPENDENT_2026.unregisteredBusinessIncomeLimit) }} 이하까지 허용됩니다.</p>
            <p><strong class="text-foreground">미반영:</strong> 부양요건(가족관계), 형제자매 특례(30세 미만·65세 이상 등), 주택임대소득 유무에 따른 예외는 이 간이 판정에 반영되지 않습니다. 최종 판정은 국민건강보험공단 확인이 필요합니다.</p>
          </div>
        </section>

        <InternalLink current="dependent" />
        <BenefitFaqPanel :items="dependentFaqs" />
      </div>

      <div class="space-y-4">
        <RecentCalcPanel />
        <CommunitySidebar page-key="dependent-main" />
      </div>
    </section>
  </div>
</template>
