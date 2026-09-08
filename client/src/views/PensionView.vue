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
import { pensionFaqs } from "@/data/benefitFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import {
  normalizePensionInput,
  PENSION_INCOME_MAX,
  PENSION_INCOME_MIN,
} from "@/lib/benefitValidators";
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

// 입력이 범위 밖이어서 잘렸다면 그 사실을 말해 준다. 조용히 자르면 화면의 입력값과 결과가
// 서로 다른 소득을 가리키게 되고, 어느 쪽이 답인지 알 수 없다.
const clampedIncome = computed(() =>
  input.value.averageMonthlyIncome !== averageMonthlyIncome.value
    ? input.value.averageMonthlyIncome
    : null
);
const seoTitle = computed(() => "2026 국민연금 수령액 계산기 | 예상 연금액·납부액 조회");
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
              <ScenarioField v-model="averageMonthlyIncome" label="평균 기준소득월액" unit="원" :min="PENSION_INCOME_MIN" :max="PENSION_INCOME_MAX" :step="10_000" format="currency" :presets="[{ label: '200만원', value: 2_000_000 }, { label: '320만원', value: 3_200_000 }, { label: '500만원', value: 5_000_000 }]" />
              <p v-if="clampedIncome !== null" class="text-caption leading-6 text-status-warning">
                입력한 금액이 기준소득월액 범위를 벗어나 {{ formatWon(clampedIncome) }}으로 계산했습니다. 국민연금법 시행령 제5조에 따라 상한액을 넘는 소득은 보험료와 연금액 어느 쪽에도 반영되지 않습니다.
              </p>
              <ScenarioField v-model="insuredYears" label="가입 기간" unit="년" :min="1" :max="40" :presets="[{ label: '10년', value: 10 }, { label: '20년', value: 20 }, { label: '30년', value: 30 }]" />
              <ScenarioField v-model="claimAge" label="청구 나이" unit="세" :min="60" :max="70" :presets="[{ label: '63세', value: 63 }, { label: '65세', value: 65 }, { label: '68세', value: 68 }]" />
            </div>

            <div class="space-y-4">
              <ResultHero label="예상 월연금" :value="formatWon(result.estimatedMonthlyPension)" />
              <BenefitStatGrid :items="[
                { label: '예상 연수령액', value: formatWon(result.estimatedAnnualPension) },
                { label: '나이 보정률', value: formatPercent(result.ageFactor, 1) },
                { label: '월 보험료 (직장 본인부담)', value: formatWon(result.employeeContribution) },
                { label: '월 보험료 (노사 합산)', value: formatWon(result.totalContribution) },
              ]" />

              <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
                <p>가입기간이 10년 이상이면 일반적인 노령연금 수급 가능 대상으로 보고, 10년 미만이면 참고용 추정치로 표시합니다.</p>
                <p>조기 청구는 감액, 연기 청구는 가산 구조를 반영했습니다. 정확한 확정액은 국민연금공단 조회가 필요합니다.</p>
                <p>보험료율 9.5% 가운데 직장가입자(사업장가입자)는 회사가 절반을 내므로 본인부담은 4.75%입니다. 위 두 칸은 같은 보험료를 다른 관점에서 본 값이고, 지역가입자·임의가입자는 노사 합산과 같은 9.5% 전액을 본인이 냅니다. 근거는 국민연금법 제88조제3항·제4항과 같은 법 부칙(2025.4.2.) 제4조입니다.</p>
                <p v-if="!result.eligible" class="font-semibold text-status-danger">현재 입력은 일반 노령연금 10년 요건에 미달합니다.</p>
              </div>
            </div>
          </div>
        </div>

        <BenefitFaqPanel :items="pensionFaqs" />
        <InternalLink current="pension" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="pension-main" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
