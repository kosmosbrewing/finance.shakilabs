<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";


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

import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import { useShare } from "@/composables/useShare";
import { addEntry } from "@/composables/useRecentCalcs";

import { formatManWonValue, formatPercent, formatWon } from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { parseQueryBoolean, parseQueryInt } from "@/lib/routeState";

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

// 공유 URL 쿼리 파라미터 복원 (dep, nontax, retire)
// gross는 경로 파라미터(/salary/:amount)를 primary로 유지
watch(
  () => route.query,
  (query) => {
    const dep = parseQueryInt(query.dep);
    if (dep !== null) calc.dependents.value = Math.max(1, Math.min(20, dep));

    const child = parseQueryInt(query.child);
    if (child !== null) {
      const maxChildren = Math.max(0, calc.dependents.value - 1);
      calc.childrenUnder20.value = Math.max(0, Math.min(maxChildren, child));
    }

    const nontax = parseQueryInt(query.nontax);
    if (nontax !== null) calc.nonTaxableMonthly.value = Math.max(0, Math.min(5_000_000, nontax));

    calc.retirementIncluded.value = parseQueryBoolean(query.retire, false);
  },
  { immediate: true }
);

const amountLabel = computed(() => {
  return formatManWonValue(amountManWon.value);
});

const pageTitle = computed(
  () => `연봉 ${amountLabel.value} 실수령액 | 2026 월급 실수령 계산기`
);
const pageDesc = computed(
  () => `2026년 연봉 ${amountLabel.value} 월 실수령액은 ${formatWon(calc.monthlyNet.value)}입니다. 4대보험·소득세 공제 내역과 부양가족별 계산도 확인하세요.`
);

const faqItems = computed(() => [
  {
    q: `연봉 ${amountLabel.value}의 월 실수령액은 얼마인가요?`,
    a: `2026년 기준 연봉 ${amountLabel.value}(부양가족 ${calc.dependents.value}인, 비과세 월 ${formatWon(calc.nonTaxableMonthly.value)})의 월 실수령액은 약 ${formatWon(calc.monthlyNet.value)}입니다. 4대보험 ${formatWon(calc.totalInsurance.value)}과 세금 ${formatWon(calc.totalTax.value)}이 공제됩니다.`,
  },
  {
    q: `연봉 ${amountLabel.value}의 4대보험료는 얼마인가요?`,
    a: `월 기준 국민연금 ${formatWon(calc.nationalPension.value)}, 건강보험 ${formatWon(calc.healthInsurance.value)}, 장기요양보험 ${formatWon(calc.longTermCare.value)}, 고용보험 ${formatWon(calc.employmentInsurance.value)}으로 총 ${formatWon(calc.totalInsurance.value)}입니다.`,
  },
  {
    q: `연봉 ${amountLabel.value}의 실효세율은 얼마인가요?`,
    a: `4대보험과 세금을 합산한 실효세율은 약 ${formatPercent(calc.effectiveTaxRate.value, 1)}입니다.`,
  },
]);

const faqJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.value.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
}));

const breadcrumbJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${DEFAULT_SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "연봉 실수령액 계산기",
      item: `${DEFAULT_SITE_URL}${route.path}`,
    },
  ],
}));

const seoJsonLd = computed(() => [faqJsonLd.value, breadcrumbJsonLd.value]);

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
        label: `연봉 ${amountLabel.value}`,
        path: `/salary/${amountManWon.value}`,
        summary: `월 실수령 ${formatWon(calc.monthlyNet.value)}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="pageTitle" :description="pageDesc" :json-ld="seoJsonLd" />

    <h1 class="text-h1 font-title">연봉 {{ amountLabel }} 실수령액 (2026년 기준)</h1>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <SalaryRangeContent :amount="amountManWon" :calc="calc" />

        <div class="space-y-4">
          <SalaryInputPanel
            v-model:annual-gross="calc.annualGross.value"
            v-model:dependents="calc.dependents.value"
            v-model:children-under20="calc.childrenUnder20.value"
            v-model:non-taxable-monthly="calc.nonTaxableMonthly.value"
            v-model:retirement-included="calc.retirementIncluded.value"
          />
          <SalaryResultPanel :calc="calc" />
        </div>

        <HealthInsuranceRank :calc="calc" />

        <AdSlot slot="120101" label="광고 · top" />

        <InsuranceDetail :calc="calc" />
        <DeductionTable :calc="calc" />

        <AdSlot slot="120102" label="광고 · middle" />

        <DeductionChart :calc="calc" />
        <SalaryCompareTable />

        <CalcSourceBox />
        <InternalLink current="salary" />

        <AdSlot slot="120103" label="광고 · bottom" />

      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
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
