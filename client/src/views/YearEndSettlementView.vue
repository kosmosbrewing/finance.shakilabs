<script setup lang="ts">
import { computed } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import { useYearEndSettlement } from "@/composables/useYearEndSettlement";
import {
  YEAR_END_FAQS,
  YEAR_END_SALARY_PRESETS,
  YEAR_END_UPDATED,
} from "@/data/yearEndSettlement";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { formatWon } from "@/lib/utils";

const props = defineProps<{ initialSalary?: number }>();

const calc = useYearEndSettlement(props.initialSalary);
const r = calc.result;

const seoTitle = computed(() =>
  props.initialSalary
    ? `연봉 ${Math.floor(props.initialSalary / 10_000).toLocaleString()}만원 연말정산 환급액 | 2026`
    : "2026 연말정산 계산기 | 환급액·세액공제 통합 시뮬레이터",
);
const seoDesc = computed(() =>
  r.value.isRefund
    ? `예상 환급액은 ${formatWon(Math.abs(r.value.settlementAmount))}입니다.`
    : `예상 추가 납부액은 ${formatWon(r.value.settlementAmount)}입니다.`,
);

const summaryItems = computed(() => [
  {
    label: r.value.isRefund ? "예상 환급액" : "추가 납부액",
    value: formatWon(Math.abs(r.value.settlementAmount)),
    tone: r.value.isRefund ? ("success" as const) : ("danger" as const),
  },
  { label: "결정세액", value: formatWon(r.value.totalTax) },
  { label: "기납부세액", value: formatWon(r.value.withheldTax + r.value.withheldLocalTax) },
  { label: "총 세액공제", value: formatWon(r.value.totalTaxCredit), tone: "success" as const },
]);

const deductionItems = computed(() => [
  { label: "신용카드 등 공제", value: formatWon(r.value.cardDeduction) },
  { label: "보험료 공제", value: formatWon(r.value.insurancePremiumCredit) },
  { label: "의료비 공제", value: formatWon(r.value.medicalExpenseCredit) },
  { label: "연금계좌 공제", value: formatWon(r.value.pensionAccountCredit) },
]);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDesc" :json-ld="buildFaqJsonLd(YEAR_END_FAQS)" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <!-- 헤더 -->
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <div class="space-y-1">
              <h1 class="retro-title">연말정산 환급액 계산기</h1>
              <p class="text-caption text-muted-foreground">
                연봉과 공제 항목을 입력하면 예상 환급액 또는 추가 납부액을 계산합니다.
              </p>
            </div>
            <FreshBadge :message="`${YEAR_END_UPDATED} 기준`" />
          </div>

          <div class="retro-panel-content space-y-6">
            <!-- 결과 요약 -->
            <div class="rounded-xl border-2 p-4 text-center" :class="r.isRefund ? 'border-status-success/30 bg-status-success/5' : 'border-status-danger/30 bg-status-danger/5'">
              <p class="text-caption text-muted-foreground">{{ r.isRefund ? '예상 환급액' : '추가 납부 예상' }}</p>
              <p class="text-display font-bold tabular-nums" :class="r.isRefund ? 'text-status-success' : 'text-status-danger'">
                {{ formatWon(Math.abs(r.settlementAmount)) }}
              </p>
            </div>

            <BenefitStatGrid :items="summaryItems" />

            <!-- 기본 정보 -->
            <div class="space-y-1">
              <h2 class="text-body font-semibold">기본 정보</h2>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ScenarioField v-model="calc.annualSalary.value" label="총급여(연봉)" unit="원" :min="12_000_000" :max="300_000_000" :step="1_000_000" format="currency" :presets="YEAR_END_SALARY_PRESETS" />
                <ScenarioField v-model="calc.dependents.value" label="부양가족 수 (본인 포함)" unit="명" :min="1" :max="10" :step="1" />
                <ScenarioField v-model="calc.children.value" label="8세 이상 자녀 수" unit="명" :min="0" :max="5" :step="1" />
              </div>
            </div>

            <!-- 신용카드 -->
            <div class="space-y-1">
              <h2 class="text-body font-semibold">신용카드 등 소득공제</h2>
              <div class="grid gap-4 sm:grid-cols-2">
                <ScenarioField v-model="calc.creditCardSpend.value" label="신용카드 사용액" unit="원" :min="0" :max="100_000_000" :step="500_000" format="currency" :presets="[{ label: '500만원', value: 5_000_000 }, { label: '1,000만원', value: 10_000_000 }, { label: '2,000만원', value: 20_000_000 }]" />
                <ScenarioField v-model="calc.debitCardSpend.value" label="체크카드·현금영수증" unit="원" :min="0" :max="50_000_000" :step="500_000" format="currency" :presets="[{ label: '300만원', value: 3_000_000 }, { label: '500만원', value: 5_000_000 }, { label: '1,000만원', value: 10_000_000 }]" />
              </div>
            </div>

            <!-- 세액공제 항목 -->
            <div class="space-y-1">
              <h2 class="text-body font-semibold">세액공제 항목</h2>
              <div class="grid gap-4 sm:grid-cols-2">
                <ScenarioField v-model="calc.insurancePremium.value" label="보장성보험료" unit="원" :min="0" :max="3_000_000" :step="100_000" format="currency" :presets="[{ label: '50만원', value: 500_000 }, { label: '100만원', value: 1_000_000 }]" />
                <ScenarioField v-model="calc.medicalExpense.value" label="의료비 지출" unit="원" :min="0" :max="50_000_000" :step="100_000" format="currency" :presets="[{ label: '100만원', value: 1_000_000 }, { label: '300만원', value: 3_000_000 }, { label: '500만원', value: 5_000_000 }]" />
                <ScenarioField v-model="calc.educationExpense.value" label="교육비" unit="원" :min="0" :max="20_000_000" :step="100_000" format="currency" :presets="[{ label: '200만원', value: 2_000_000 }, { label: '500만원', value: 5_000_000 }]" />
                <ScenarioField v-model="calc.donationAmount.value" label="기부금" unit="원" :min="0" :max="50_000_000" :step="100_000" format="currency" :presets="[{ label: '100만원', value: 1_000_000 }, { label: '500만원', value: 5_000_000 }]" />
              </div>
            </div>

            <!-- 연금·월세 -->
            <div class="space-y-1">
              <h2 class="text-body font-semibold">연금 · 월세</h2>
              <div class="grid gap-4 sm:grid-cols-2">
                <ScenarioField v-model="calc.pensionSavings.value" label="연금저축 납입액" unit="원" :min="0" :max="10_000_000" :step="100_000" format="currency" :presets="[{ label: '400만원', value: 4_000_000 }, { label: '600만원', value: 6_000_000 }]" />
                <ScenarioField v-model="calc.irpContribution.value" label="IRP 납입액" unit="원" :min="0" :max="10_000_000" :step="100_000" format="currency" :presets="[{ label: '200만원', value: 2_000_000 }, { label: '300만원', value: 3_000_000 }]" />
                <ScenarioField v-model="calc.monthlyRent.value" label="월세" unit="원" :min="0" :max="2_000_000" :step="50_000" format="currency" :presets="[{ label: '50만원', value: 500_000 }, { label: '70만원', value: 700_000 }]" />
                <ScenarioField v-model="calc.rentMonths.value" label="월세 납부 개월" unit="개월" :min="0" :max="12" :step="1" />
              </div>
            </div>

            <!-- 공제 항목 상세 -->
            <div class="space-y-2">
              <h2 class="text-body font-semibold">주요 공제 내역</h2>
              <BenefitStatGrid :items="deductionItems" />

              <div class="retro-panel-muted retro-panel-content space-y-2 text-caption leading-6 text-muted-foreground">
                <p>기납부세액은 매월 원천징수(기본 소득공제만 적용) 기준으로 추정한 값입니다. 실제 원천징수 내역과 다를 수 있습니다.</p>
                <p>의료비 공제는 총급여의 3% 초과분, 연 700만원 한도 기준입니다. 본인·65세이상·장애인 의료비는 한도가 다릅니다.</p>
              </div>
            </div>
          </div>
        </div>

        <BenefitFaqPanel :items="YEAR_END_FAQS" />
        <InternalLink current="year-end-settlement" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="year-end-settlement" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
