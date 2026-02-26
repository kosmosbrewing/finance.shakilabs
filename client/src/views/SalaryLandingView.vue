<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import TickerBar from "@/components/common/TickerBar.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SalaryInputPanel from "@/components/salary/SalaryInputPanel.vue";
import SalaryResultPanel from "@/components/salary/SalaryResultPanel.vue";
import DeductionTable from "@/components/salary/DeductionTable.vue";
import DeductionChart from "@/components/salary/DeductionChart.vue";
import InsuranceDetail from "@/components/salary/InsuranceDetail.vue";
import SalaryCompareTable from "@/components/salary/SalaryCompareTable.vue";
import HealthInsuranceRank from "@/components/salary/HealthInsuranceRank.vue";
import SalaryRangeContent from "@/components/salary/SalaryRangeContent.vue";
import CalcSourceBox from "@/components/salary/CalcSourceBox.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import VisitorCounter from "@/components/common/VisitorCounter.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import { useShare } from "@/composables/useShare";
import { addEntry } from "@/composables/useRecentCalcs";
import { salaryTickerMessages } from "@/data/tickerMessages";
import { formatWon } from "@/lib/utils";

const route = useRoute();
const calc = useSalaryCalc();
const MAX_ROUTE_MANWON = 1_000_000;

const amountManWon = computed(() => {
  const raw = parseInt(String(route.params.amount), 10);
  if (Number.isNaN(raw) || raw <= 0) return 3000;
  return Math.min(raw, MAX_ROUTE_MANWON);
});

watch(
  amountManWon,
  (next) => {
    calc.annualGross.value = next * 10_000;
  },
  { immediate: true }
);

const amountLabel = computed(() => {
  const value = amountManWon.value;
  if (value >= 10000) return `${value / 10000}억`;
  return `${value.toLocaleString()}만`;
});

const pageTitle = computed(
  () => `연봉 ${amountLabel.value}원 실수령액 · 2026 4대보험 계산기`
);
const pageDesc = computed(
  () => `2026년 기준 연봉 ${amountLabel.value}원의 월 실수령액은 ${formatWon(calc.monthlyNet.value)}입니다.`
);

const {
  showShareModal,
  kakaoBusy,
  shareSummary,
  openShare,
  closeShare,
  shareKakao,
  copyLink,
} = useShare(calc);

// 최근 계산 자동 저장 (2초 디바운스)
let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => calc.monthlyNet.value,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      if (calc.annualGross.value <= 0) return;
      addEntry({
        type: "salary",
        label: `연봉 ${amountLabel.value}원`,
        path: `/salary/${amountManWon.value}`,
        summary: `월 실수령 ${formatWon(calc.monthlyNet.value)}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="pageTitle" :description="pageDesc" />

    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-h1 font-title">연봉 {{ amountLabel }}원 실수령액</h1>
      <FreshBadge />
    </div>

    <TickerBar :messages="salaryTickerMessages" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <VisitorCounter />

        <SalaryRangeContent :amount="amountManWon" :calc="calc" />
        <CalcSourceBox />

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SalaryInputPanel
            v-model:annual-gross="calc.annualGross.value"
            v-model:dependents="calc.dependents.value"
            v-model:children-under20="calc.childrenUnder20.value"
            v-model:non-taxable-monthly="calc.nonTaxableMonthly.value"
            v-model:retirement-included="calc.retirementIncluded.value"
          />
          <SalaryResultPanel :calc="calc" @share="openShare" />
        </div>

        <AdSlot slot="120101" label="광고 · top" />

        <InsuranceDetail :calc="calc" />
        <DeductionTable :calc="calc" />

        <AdSlot slot="120102" label="광고 · middle" />

        <DeductionChart :calc="calc" />
        <SalaryCompareTable />
        <HealthInsuranceRank :calc="calc" />

        <InternalLink current="salary" />

        <AdSlot slot="120103" label="광고 · bottom" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar :page-key="`salary-${amountManWon}`" @share-request="openShare" />
        <RecentCalcPanel />
      </div>
    </section>

    <ShareModal
      :show="showShareModal"
      :kakao-busy="kakaoBusy"
      :summary-text="shareSummary"
      @close="closeShare"
      @share-kakao="shareKakao"
      @copy-link="copyLink"
    />
  </div>
</template>
