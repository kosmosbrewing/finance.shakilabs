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
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import ResultHero from "@/components/common/ResultHero.vue";
import { irpFaqs } from "@/data/benefitFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { normalizeIrpInput } from "@/lib/benefitValidators";
import { formatPercent, formatWon } from "@/lib/utils";
import { calculateIrpTaxCredit } from "@/utils/benefitCalculators";

const annualSalary = ref(52_000_000);
const pensionSavings = ref(4_000_000);
const irpContribution = ref(3_000_000);

const input = computed(() =>
  normalizeIrpInput({
    annualSalary: annualSalary.value,
    pensionSavings: pensionSavings.value,
    irpContribution: irpContribution.value,
  })
);
const result = computed(() => calculateIrpTaxCredit(input.value));
const seoTitle = computed(() => "2026 IRP 세액공제 계산기 | 개인형 퇴직연금 절세 효과");
const seoDescription = computed(
  () =>
    `연금저축과 IRP 납입액 기준 소득세 세액공제는 ${formatWon(result.value.taxCredit)}, 지방소득세까지 포함한 절세 총액은 ${formatWon(result.value.taxCreditWithLocalTax)}입니다.`
);
</script>

<template>
  <div class="sh-container sh-container--tool space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(irpFaqs)" />

    <CalculatorPageHeader title="IRP·퇴직연금 세액공제" />

    <!-- 퍼널 추적은 입력·결과 두 카드를 함께 감싼다 — 한 패널이던 때와 같은 범위라야 이벤트가 그대로다
         (래퍼에 overflow를 걸면 결과 칸 sticky가 죽는다). -->
    <CalculatorInteractionTracker>
      <ShCalculatorSplit>
        <template #input>
          <section class="retro-panel overflow-hidden" aria-labelledby="irp-input-title">
            <div class="retro-titlebar rounded-t-2xl">
              <h2 id="irp-input-title" class="retro-title">세액공제 조건 입력</h2>
            </div>
            <div class="retro-panel-content space-y-4">
              <ScenarioField v-model="annualSalary" label="총급여" unit="원" :min="10_000_000" :max="120_000_000" :step="100_000" format="currency" :presets="[{ label: '4,500만원', value: 45_000_000 }, { label: '5,200만원', value: 52_000_000 }, { label: '7,500만원', value: 75_000_000 }]" />
              <ScenarioField v-model="pensionSavings" label="연금저축 납입액" unit="원" :min="0" :max="10_000_000" :step="50_000" format="currency" :presets="[{ label: '300만원', value: 3_000_000 }, { label: '400만원', value: 4_000_000 }, { label: '600만원', value: 6_000_000 }]" />
              <ScenarioField v-model="irpContribution" label="IRP 납입액" unit="원" :min="0" :max="10_000_000" :step="50_000" format="currency" :presets="[{ label: '200만원', value: 2_000_000 }, { label: '300만원', value: 3_000_000 }, { label: '500만원', value: 5_000_000 }]" />
            </div>
          </section>
        </template>
        <template #result>
          <section class="retro-panel overflow-hidden" aria-labelledby="irp-result-title">
            <div class="retro-titlebar rounded-t-2xl">
              <h2 id="irp-result-title" class="retro-title">세액공제 예상 결과</h2>
            </div>
            <div class="retro-panel-content space-y-4">
              <ResultHero label="세액공제 (소득세)" :value="formatWon(result.taxCredit)">
                <template #secondary>
                  지방소득세 포함 절세액 {{ formatWon(result.taxCreditWithLocalTax) }}
                </template>
              </ResultHero>
              <BenefitStatGrid :items="[
                { label: '적용 공제율 (소득세)', value: formatPercent(result.taxCreditRate, 0) },
                { label: '인정 납입액', value: formatWon(result.recognizedContribution) },
                { label: '한도 초과분', value: formatWon(result.overflowAmount) },
              ]" />

              <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
                <p>연금저축은 최대 600만원까지만 우선 반영하고, IRP는 합산 900만원 한도 안에서만 추가 인정합니다.</p>
                <p>세액공제율은 총급여 구간에 따라 15% 또는 12%를 적용했습니다.</p>
                <p>세액공제액은 소득세 산출세액에서 빼는 금액이고, 절세액은 이 공제로 개인지방소득세까지 줄어든 뒤의 실제 절감액입니다. 두 값의 차이가 지방소득세 감소분입니다.</p>
              </div>
            </div>
          </section>
        </template>
      </ShCalculatorSplit>
    </CalculatorInteractionTracker>

    <BenefitFaqPanel :items="irpFaqs" />
    <InternalLink current="irp" />

    <CalculatorFeedbackRow page-key="irp-main" />
  </div>
</template>
