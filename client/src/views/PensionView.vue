<script setup lang="ts">
import { computed, ref } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import { pensionFaqs } from "@/data/benefitFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { normalizePensionInput } from "@/lib/benefitValidators";
import { formatPercent, formatWon } from "@/lib/utils";
import { calculatePensionEstimate } from "@/utils/benefitCalculators";

const averageMonthlyIncome = ref(3_200_000);
const insuredYears = ref(20);
const claimAge = ref(65);

const input = computed(() =>
  normalizePensionInput({
    averageMonthlyIncome: averageMonthlyIncome.value,
    insuredYears: insuredYears.value,
    claimAge: claimAge.value,
  })
);
const result = computed(() => calculatePensionEstimate(input.value));
const seoTitle = computed(() => "국민연금 예상 수령액 계산기 | 2026 finance.shakilabs");
const seoDescription = computed(
  () => `가입 ${input.value.insuredYears}년 기준 예상 국민연금 월수령액은 ${formatWon(result.value.estimatedMonthlyPension)}입니다.`
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(pensionFaqs)" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <div class="space-y-1">
              <h1 class="retro-title">국민연금 예상 수령액</h1>
              <p class="text-caption text-muted-foreground">평균소득과 가입기간, 청구 나이를 기준으로 월연금과 연간 수령액을 간이 추정합니다.</p>
            </div>
            <FreshBadge message="국민연금공단 구조 반영 간이 추정" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="space-y-4">
              <ScenarioField v-model="averageMonthlyIncome" label="평균 기준소득월액" unit="원" :min="400_000" :max="6_370_000" :step="10_000" format="currency" :presets="[{ label: '200만원', value: 2_000_000 }, { label: '320만원', value: 3_200_000 }, { label: '500만원', value: 5_000_000 }]" />
              <ScenarioField v-model="insuredYears" label="가입 기간" unit="년" :min="1" :max="40" :presets="[{ label: '10년', value: 10 }, { label: '20년', value: 20 }, { label: '30년', value: 30 }]" />
              <ScenarioField v-model="claimAge" label="청구 나이" unit="세" :min="60" :max="70" :presets="[{ label: '63세', value: 63 }, { label: '65세', value: 65 }, { label: '68세', value: 68 }]" />
            </div>

            <div class="space-y-4">
              <BenefitStatGrid :items="[
                { label: '예상 월연금', value: formatWon(result.estimatedMonthlyPension), tone: 'success' },
                { label: '예상 연수령액', value: formatWon(result.estimatedAnnualPension) },
                { label: '나이 보정률', value: formatPercent(result.ageFactor, 1) },
                { label: '월 납부 보험료 추정', value: formatWon(result.employeeContribution), tone: 'danger' },
              ]" />

              <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
                <p>가입기간이 10년 이상이면 일반적인 노령연금 수급 가능 대상으로 보고, 10년 미만이면 참고용 추정치로 표시합니다.</p>
                <p>조기 청구는 감액, 연기 청구는 가산 구조를 반영했습니다. 정확한 확정액은 국민연금공단 조회가 필요합니다.</p>
                <p v-if="!result.eligible" class="font-semibold text-status-danger">현재 입력은 일반 노령연금 10년 요건에 미달합니다.</p>
              </div>
            </div>
          </div>
        </div>

        <BenefitFaqPanel :items="pensionFaqs" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="pension-main" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
