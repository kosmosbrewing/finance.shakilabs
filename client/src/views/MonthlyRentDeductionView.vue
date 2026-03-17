<script setup lang="ts">
import { computed, ref } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import { monthlyRentFaqs } from "@/data/benefitFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { normalizeMonthlyRentDeductionInput } from "@/lib/benefitValidators";
import { formatPercent, formatWon } from "@/lib/utils";
import { calculateMonthlyRentDeduction } from "@/utils/benefitCalculators";

const annualSalary = ref(48_000_000);
const monthlyRent = ref(700_000);
const paidMonths = ref(12);

const input = computed(() =>
  normalizeMonthlyRentDeductionInput({
    annualSalary: annualSalary.value,
    monthlyRent: monthlyRent.value,
    paidMonths: paidMonths.value,
  })
);
const result = computed(() => calculateMonthlyRentDeduction(input.value));
const seoTitle = computed(() => "월세 세액공제 계산기 | 2026 finance.shakilabs");
const seoDescription = computed(
  () => `연 월세 ${formatWon(result.value.yearlyRent)} 기준 예상 세액공제 환급액은 ${formatWon(result.value.taxCredit)}입니다.`
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(monthlyRentFaqs)" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <div class="space-y-1">
              <h1 class="retro-title">월세 세액공제 계산기</h1>
              <p class="text-caption text-muted-foreground">총급여와 월세 납부액을 기준으로 연말정산 환급 가능 금액을 간단히 계산합니다.</p>
            </div>
            <FreshBadge message="총급여 5,500만원·8,000만원 구간 반영" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="space-y-4">
              <ScenarioField v-model="annualSalary" label="총급여" unit="원" :min="10_000_000" :max="100_000_000" :step="100_000" format="currency" :presets="[{ label: '4,000만원', value: 40_000_000 }, { label: '4,800만원', value: 48_000_000 }, { label: '7,000만원', value: 70_000_000 }]" />
              <ScenarioField v-model="monthlyRent" label="월세" unit="원" :min="100_000" :max="2_000_000" :step="10_000" format="currency" :presets="[{ label: '50만원', value: 500_000 }, { label: '70만원', value: 700_000 }, { label: '100만원', value: 1_000_000 }]" />
              <ScenarioField v-model="paidMonths" label="납부 개월 수" unit="개월" :min="1" :max="12" :presets="[{ label: '6개월', value: 6 }, { label: '10개월', value: 10 }, { label: '12개월', value: 12 }]" />
            </div>

            <div class="space-y-4">
              <BenefitStatGrid :items="[
                { label: '예상 세액공제', value: formatWon(result.taxCredit), tone: 'success' },
                { label: '공제율', value: formatPercent(result.deductionRate, 0) },
                { label: '공제 인정 월세', value: formatWon(result.recognizedRent) },
                { label: '월 환급 체감', value: formatWon(result.monthlyRefundEffect) },
              ]" />

              <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
                <p>이 계산기는 무주택 세대주, 주민등록 주소 일치, 국민주택규모 또는 기준시가 요건 충족을 가정합니다.</p>
                <p>총급여가 8,000만원을 넘으면 현재 입력 기준에서는 월세 세액공제 환급액을 0원으로 계산합니다.</p>
              </div>
            </div>
          </div>
        </div>

        <BenefitFaqPanel :items="monthlyRentFaqs" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="monthly-rent-main" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
