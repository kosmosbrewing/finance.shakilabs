<script setup lang="ts">
import { computed, ref } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import { annualLeaveFaqs } from "@/data/benefitFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { normalizeAnnualLeaveInput } from "@/lib/benefitValidators";
import { formatWon } from "@/lib/utils";
import { calculateAnnualLeavePay } from "@/utils/benefitCalculators";

const monthlySalary = ref(3_600_000);
const fixedAllowance = ref(200_000);
const monthsWorked = ref(24);
const unusedLeaveDays = ref(5);

const input = computed(() =>
  normalizeAnnualLeaveInput({
    monthlySalary: monthlySalary.value,
    fixedAllowance: fixedAllowance.value,
    monthsWorked: monthsWorked.value,
    unusedLeaveDays: unusedLeaveDays.value,
  })
);
const result = computed(() => calculateAnnualLeavePay(input.value));
const seoTitle = computed(() => "연차 수당 계산기 | 2026 finance.shakilabs");
const seoDescription = computed(
  () =>
    `미사용 연차 ${result.value.payableDays}일 기준 예상 연차수당은 ${formatWon(
      result.value.totalAllowance
    )}입니다.`
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(annualLeaveFaqs)" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <div class="space-y-1">
              <h1 class="retro-title">연차 수당 계산기</h1>
              <p class="text-caption text-muted-foreground">월급과 미사용 연차일수를 넣으면 간이 정산 금액을 바로 확인할 수 있습니다.</p>
            </div>
            <FreshBadge message="근로기준법 기준 간이 계산" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="space-y-4">
              <ScenarioField v-model="monthlySalary" label="세전 월급" unit="원" :min="1_000_000" :max="15_000_000" :step="50_000" format="currency" :presets="[{ label: '280만원', value: 2_800_000 }, { label: '360만원', value: 3_600_000 }, { label: '500만원', value: 5_000_000 }]" />
              <ScenarioField v-model="fixedAllowance" label="고정수당" unit="원" :min="0" :max="2_000_000" :step="10_000" format="currency" :presets="[{ label: '0원', value: 0 }, { label: '20만원', value: 200_000 }, { label: '50만원', value: 500_000 }]" />
              <ScenarioField v-model="monthsWorked" label="근속 개월 수" unit="개월" :min="1" :max="120" :presets="[{ label: '11개월', value: 11 }, { label: '24개월', value: 24 }, { label: '60개월', value: 60 }]" />
              <ScenarioField v-model="unusedLeaveDays" label="미사용 연차" unit="일" :min="0" :max="25" :presets="[{ label: '3일', value: 3 }, { label: '5일', value: 5 }, { label: '10일', value: 10 }]" />
            </div>

            <div class="space-y-4">
              <BenefitStatGrid :items="[
                { label: '예상 연차수당', value: formatWon(result.totalAllowance), tone: 'success' },
                { label: '1일 통상임금', value: formatWon(result.dailyOrdinaryWage) },
                { label: '발생 연차', value: `${result.accruedLeaveDays}일` },
                { label: '정산 반영 일수', value: `${result.payableDays}일` },
              ]" />

              <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
                <p>연차수당은 월급과 고정수당을 209시간 기준 시급으로 환산해 1일 8시간으로 계산했습니다.</p>
                <p>1년 미만은 월 개근 1일, 1년 이상은 기본 15일과 2년마다 1일 추가 규칙을 반영했습니다.</p>
              </div>
            </div>
          </div>
        </div>

        <BenefitFaqPanel :items="annualLeaveFaqs" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="annual-leave-main" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
