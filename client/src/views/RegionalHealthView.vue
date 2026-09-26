<script setup lang="ts">
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import { computed, ref } from "vue";
import { ShCalculatorSplit } from "@shakilabs/ui";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import CalculatorFeedbackRow from "@/components/calculator/CalculatorFeedbackRow.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import RegionalHealthResult from "@/components/regional-health/RegionalHealthResult.vue";
import { regionalHealthFaqs } from "@/data/benefitFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { normalizeRegionalHealthInput } from "@/lib/benefitValidators";
import { formatManWon } from "@/lib/utils";
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
</script>

<template>
  <div class="sh-container sh-container--tool space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(regionalHealthFaqs)" />

    <CalculatorPageHeader title="지역가입자 건강보험료" />

    <!-- 퍼널 추적은 입력·결과 두 카드를 함께 감싼다 — 한 패널이던 때와 같은 범위라야 이벤트가 그대로다
         (래퍼에 overflow를 걸면 결과 칸 sticky가 죽는다). -->
    <CalculatorInteractionTracker>
      <ShCalculatorSplit>
        <template #input>
          <section class="retro-panel overflow-hidden" aria-labelledby="regional-health-input-title">
            <div class="retro-titlebar rounded-t-2xl">
              <h2 id="regional-health-input-title" class="retro-title">소득·재산 조건 입력</h2>
            </div>
            <div class="retro-panel-content space-y-4">
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
                label="퇴사 후 연간 금융소득 (이자·배당)"
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
          </section>
        </template>
        <template #result>
          <RegionalHealthResult :result="result" />
        </template>
      </ShCalculatorSplit>
    </CalculatorInteractionTracker>

    <BenefitFaqPanel :items="regionalHealthFaqs" />
    <InternalLink current="regional-health" />

    <CalculatorFeedbackRow page-key="regional-health-main" />
  </div>
</template>
