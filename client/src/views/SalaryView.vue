<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";


import SalaryInputPanel from "@/components/salary/SalaryInputPanel.vue";
import SalaryResultPanel from "@/components/salary/SalaryResultPanel.vue";
import DeductionTable from "@/components/salary/DeductionTable.vue";
import DeductionChart from "@/components/salary/DeductionChart.vue";
import HealthInsuranceRank from "@/components/salary/HealthInsuranceRank.vue";
import InsuranceDetail from "@/components/salary/InsuranceDetail.vue";
import SalaryCompareTable from "@/components/salary/SalaryCompareTable.vue";
import CalcSourceBox from "@/components/salary/CalcSourceBox.vue";
import ShareModal from "@/components/share/ShareModal.vue";

import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import { useUrlParams } from "@/composables/useUrlParams";
import { useShare } from "@/composables/useShare";
import { addEntry } from "@/composables/useRecentCalcs";

import { formatManWon, formatWon } from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { computed, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const calc = useSalaryCalc();
useUrlParams(calc);

const {
  showShareModal,
  kakaoBusy,
  shareSummary,
  openShare,
  closeShare,
  shareKakao,
  copyLink,
} = useShare(calc);

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
        label: `연봉 ${formatManWon(calc.annualGross.value)}`,
        path: `/salary?gross=${calc.annualGross.value}`,
        summary: `월 실수령 ${formatWon(calc.monthlyNet.value)}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead
      title="2026 연봉 실수령액 계산기 | 4대보험 + 소득세 자동 계산"
      description="2026년 연봉 실수령액을 즉시 계산하세요. 국민연금·건보료·소득세 공제 후 실제 통장에 들어오는 월급을 확인합니다."
      :json-ld="breadcrumbJsonLd"
    />

    <h1 class="text-h1 font-title">2026 연봉 실수령액 계산기</h1>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
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

        <AdSlot slot="120001" label="광고 · top" />

        <InsuranceDetail :calc="calc" />
        <DeductionTable :calc="calc" />

        <AdSlot slot="120002" label="광고 · middle" />

        <DeductionChart :calc="calc" />
        <SalaryCompareTable />

        <CalcSourceBox />
        <InternalLink current="salary" />

        <AdSlot slot="120003" label="광고 · bottom" />

      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="salary-calc" @share-request="openShare" />
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
