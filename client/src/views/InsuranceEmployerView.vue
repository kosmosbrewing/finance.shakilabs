<script setup lang="ts">
import { computed, ref } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
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
const seoTitle = computed(() => "사업주 4대보험 부담금 계산기 | 2026 finance.shakilabs");
const seoDescription = computed(
  () => `월급 ${formatWon(input.value.monthlySalary)} 기준 사업주 월 부담금은 ${formatWon(result.value.totalMonthlyBurden)}입니다.`
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(employerInsuranceFaqs)" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <div class="space-y-1">
              <h1 class="retro-title">사업주 4대보험 부담금</h1>
              <p class="text-caption text-muted-foreground">근로자 1인 기준 사업주가 추가로 부담하는 보험료를 월·연 단위로 확인합니다.</p>
            </div>
            <FreshBadge message="국민연금·건강보험 2026 요율 반영" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="space-y-4">
              <ScenarioField v-model="monthlySalary" label="과세 월급" unit="원" :min="1_000_000" :max="10_000_000" :step="50_000" format="currency" :presets="[{ label: '250만원', value: 2_500_000 }, { label: '320만원', value: 3_200_000 }, { label: '500만원', value: 5_000_000 }]" />
              <ScenarioField v-model="employmentRatePercent" label="사업주 고용보험률" unit="%" :min="0.9" :max="3" :step="0.1" format="decimal" :presets="[{ label: '0.9%', value: 0.9 }, { label: '1.15%', value: 1.15 }, { label: '1.55%', value: 1.55 }]" />
              <ScenarioField v-model="accidentRatePercent" label="산재보험률" unit="%" :min="0.5" :max="10" :step="0.1" format="decimal" :presets="[{ label: '0.8%', value: 0.8 }, { label: '1.5%', value: 1.5 }, { label: '3.0%', value: 3 }]" />
            </div>

            <div class="space-y-4">
              <BenefitStatGrid :items="[
                { label: '월 총 부담금', value: formatWon(result.totalMonthlyBurden), tone: 'success' },
                { label: '연 총 부담금', value: formatWon(result.totalAnnualBurden) },
                { label: '사업주 부담률', value: formatPercent(result.employerRate, 1) },
                { label: '산재보험', value: formatWon(result.industrialAccident), tone: 'danger' },
              ]" />

              <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
                <p>국민연금, 건강보험, 장기요양보험은 2026 상수를 적용했습니다.</p>
                <p>고용보험과 산재보험은 업종과 기업 규모에 따라 차이가 커 직접 조정형 입력값으로 두었습니다.</p>
              </div>
            </div>
          </div>
        </div>

        <BenefitFaqPanel :items="employerInsuranceFaqs" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="insurance-employer-main" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
