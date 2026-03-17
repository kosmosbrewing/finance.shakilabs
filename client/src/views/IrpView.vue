<script setup lang="ts">
import { computed, ref } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
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
const seoTitle = computed(() => "IRP 세액공제 계산기 | 2026 finance.shakilabs");
const seoDescription = computed(
  () => `연금저축과 IRP 납입액 기준 예상 세액공제는 ${formatWon(result.value.taxCredit)}입니다.`
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(irpFaqs)" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <div class="space-y-1">
              <h1 class="retro-title">IRP·퇴직연금 세액공제</h1>
              <p class="text-caption text-muted-foreground">연금저축과 IRP 납입 계획을 입력하면 올해 세액공제 한도와 예상 절세액을 계산합니다.</p>
            </div>
            <FreshBadge message="연금저축 600만원 + 합산 900만원 기준" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="space-y-4">
              <ScenarioField v-model="annualSalary" label="총급여" unit="원" :min="10_000_000" :max="120_000_000" :step="100_000" format="currency" :presets="[{ label: '4,500만원', value: 45_000_000 }, { label: '5,200만원', value: 52_000_000 }, { label: '7,500만원', value: 75_000_000 }]" />
              <ScenarioField v-model="pensionSavings" label="연금저축 납입액" unit="원" :min="0" :max="10_000_000" :step="50_000" format="currency" :presets="[{ label: '300만원', value: 3_000_000 }, { label: '400만원', value: 4_000_000 }, { label: '600만원', value: 6_000_000 }]" />
              <ScenarioField v-model="irpContribution" label="IRP 납입액" unit="원" :min="0" :max="10_000_000" :step="50_000" format="currency" :presets="[{ label: '200만원', value: 2_000_000 }, { label: '300만원', value: 3_000_000 }, { label: '500만원', value: 5_000_000 }]" />
            </div>

            <div class="space-y-4">
              <BenefitStatGrid :items="[
                { label: '예상 세액공제', value: formatWon(result.taxCredit), tone: 'success' },
                { label: '적용 공제율', value: formatPercent(result.taxCreditRate, 0) },
                { label: '인정 납입액', value: formatWon(result.recognizedContribution) },
                { label: '한도 초과분', value: formatWon(result.overflowAmount), tone: 'danger' },
              ]" />

              <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
                <p>연금저축은 최대 600만원까지만 우선 반영하고, IRP는 합산 900만원 한도 안에서만 추가 인정합니다.</p>
                <p>세액공제율은 총급여 구간에 따라 15% 또는 12%를 적용했습니다.</p>
              </div>
            </div>
          </div>
        </div>

        <BenefitFaqPanel :items="irpFaqs" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="irp-main" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
