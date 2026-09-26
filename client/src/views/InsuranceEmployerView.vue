<script setup lang="ts">
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import { computed, ref } from "vue";
import { ShCalculatorSplit } from "@shakilabs/ui";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import CalculatorFeedbackRow from "@/components/calculator/CalculatorFeedbackRow.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import ResultHero from "@/components/common/ResultHero.vue";
import BreakdownDonut from "@/components/result-visualization/BreakdownDonut.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import { employerInsuranceFaqs } from "@/data/benefitFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { normalizeEmployerInsuranceInput } from "@/lib/benefitValidators";
import { formatPercent, formatWon } from "@/lib/utils";
import { calculateEmployerInsuranceBurden } from "@/utils/benefitCalculators";

const monthlySalary = ref(3_200_000);
const employmentRatePercent = ref(0.9);
const accidentRatePercent = ref(1.5);

const input = computed(() =>
  normalizeEmployerInsuranceInput({
    monthlySalary: monthlySalary.value,
    employmentRatePercent: employmentRatePercent.value,
    accidentRatePercent: accidentRatePercent.value,
  })
);
const result = computed(() => calculateEmployerInsuranceBurden(input.value));
const burdenSegments = computed(() => [
  { key: "pension", label: "국민연금", value: result.value.nationalPension, color: "hsl(var(--chart-pension))" },
  { key: "health", label: "건강보험", value: result.value.healthInsurance, color: "hsl(var(--chart-health))" },
  { key: "care", label: "장기요양", value: result.value.longTermCare, color: "hsl(var(--chart-care))" },
  { key: "employment", label: "고용보험", value: result.value.employmentInsurance, color: "hsl(var(--chart-employment))" },
  { key: "accident", label: "산재보험", value: result.value.industrialAccident, color: "hsl(var(--chart-tax))" },
]);
const seoTitle = computed(() => "2026 사업주 4대보험 계산기 | 고용주 부담금·인건비 계산");
const seoDescription = computed(
  () => `월급 ${formatWon(input.value.monthlySalary)} 기준 사업주 월 부담금은 ${formatWon(result.value.totalMonthlyBurden)}입니다.`
);
</script>

<template>
  <div class="sh-container sh-container--tool space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(employerInsuranceFaqs)" />

    <CalculatorPageHeader title="사업주 4대보험 부담금" />

    <!-- 퍼널 추적은 입력·결과 두 카드를 함께 감싼다 — 한 패널이던 때와 같은 범위라야 이벤트가 그대로다
         (래퍼에 overflow를 걸면 결과 칸 sticky가 죽는다). -->
    <CalculatorInteractionTracker>
      <ShCalculatorSplit>
        <template #input>
          <section class="retro-panel overflow-hidden" aria-labelledby="insurance-employer-input-title">
            <div class="retro-titlebar rounded-t-2xl">
              <h2 id="insurance-employer-input-title" class="retro-title">급여·보험률 조건 입력</h2>
            </div>
            <div class="retro-panel-content space-y-4">
              <ScenarioField v-model="monthlySalary" label="과세 월급" unit="원" :min="1_000_000" :max="10_000_000" :step="50_000" format="currency" :presets="[{ label: '250만원', value: 2_500_000 }, { label: '320만원', value: 3_200_000 }, { label: '500만원', value: 5_000_000 }]" />
              <ScenarioField v-model="employmentRatePercent" label="사업주 고용보험률" unit="%" :min="0.9" :max="3" :step="0.1" format="decimal" :presets="[{ label: '0.9%', value: 0.9 }, { label: '1.15%', value: 1.15 }, { label: '1.55%', value: 1.55 }]" />
              <ScenarioField v-model="accidentRatePercent" label="산재보험률" unit="%" :min="0.5" :max="10" :step="0.1" format="decimal" :presets="[{ label: '0.8%', value: 0.8 }, { label: '1.5%', value: 1.5 }, { label: '3.0%', value: 3 }]" />
            </div>
          </section>
        </template>
        <template #result>
          <section class="retro-panel overflow-hidden" aria-labelledby="insurance-employer-result-title">
            <div class="retro-titlebar rounded-t-2xl">
              <h2 id="insurance-employer-result-title" class="retro-title">사업주 부담금 예상 결과</h2>
            </div>
            <div class="retro-panel-content space-y-4">
              <ResultHero label="월 총 부담금" :value="formatWon(result.totalMonthlyBurden)" />
              <BenefitStatGrid :items="[
                { label: '연 총 부담금', value: formatWon(result.totalAnnualBurden) },
                { label: '사업주 부담률', value: formatPercent(result.employerRate, 1) },
                { label: '산재보험', value: formatWon(result.industrialAccident) },
              ]" />

              <div class="retro-panel-muted retro-panel-content space-y-3">
                <!-- 결과 카드 제목(h2) 아래 소제목이 됐으므로 h3 -->
                <h3 class="text-body font-semibold text-foreground">월 부담금 구성</h3>
                <BreakdownDonut
                  :segments="burdenSegments"
                  label="사업주 월 보험료 구성"
                  center-label="월 합계"
                  :center-value="formatWon(result.totalMonthlyBurden)"
                  :format-value="formatWon"
                  half-width-at-lg
                />
              </div>

              <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
                <p>국민연금, 건강보험, 장기요양보험은 2026 상수를 적용했습니다.</p>
                <p>고용보험과 산재보험은 업종과 기업 규모에 따라 차이가 커 직접 조정형 입력값으로 두었습니다.</p>
              </div>
            </div>
          </section>
        </template>
      </ShCalculatorSplit>
    </CalculatorInteractionTracker>

    <BenefitFaqPanel :items="employerInsuranceFaqs" />
    <InternalLink current="4-insurance-employer" />

    <CalculatorFeedbackRow page-key="insurance-employer-main" />
  </div>
</template>
