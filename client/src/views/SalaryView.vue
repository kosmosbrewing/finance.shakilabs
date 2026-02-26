<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import TickerBar from "@/components/common/TickerBar.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SalaryInputPanel from "@/components/salary/SalaryInputPanel.vue";
import SalaryResultPanel from "@/components/salary/SalaryResultPanel.vue";
import DeductionTable from "@/components/salary/DeductionTable.vue";
import DeductionChart from "@/components/salary/DeductionChart.vue";
import HealthInsuranceRank from "@/components/salary/HealthInsuranceRank.vue";
import InsuranceDetail from "@/components/salary/InsuranceDetail.vue";
import SalaryCompareTable from "@/components/salary/SalaryCompareTable.vue";
import CalcSourceBox from "@/components/salary/CalcSourceBox.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import VisitorCounter from "@/components/common/VisitorCounter.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import { useUrlParams } from "@/composables/useUrlParams";
import { useShare } from "@/composables/useShare";
import { addEntry } from "@/composables/useRecentCalcs";
import { salaryTickerMessages } from "@/data/tickerMessages";
import { formatManWon, formatWon } from "@/lib/utils";
import { watch } from "vue";

const calc = useSalaryCalc();
useUrlParams(calc);

const popularSalaryChips = [
  { label: "3,000만원", manWon: 3000 },
  { label: "4,000만원", manWon: 4000 },
  { label: "5,000만원", manWon: 5000 },
  { label: "7,000만원", manWon: 7000 },
  { label: "1억원", manWon: 10000 },
] as const;

function applyPopularSalary(manWon: number): void {
  calc.annualGross.value = manWon * 10_000;
}

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
      description="연봉을 입력하면 4대보험과 소득세, 지방소득세를 반영한 월 실수령액을 즉시 계산합니다."
    />

    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-h1 font-title">연봉 실수령액 계산기</h1>
      <FreshBadge />
    </div>

    <TickerBar :messages="salaryTickerMessages" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <div class="retro-panel-muted p-3 sm:p-4 space-y-3">
          <p class="text-caption sm:text-body font-semibold text-foreground">
            연봉 제안이 들어왔을 때, 세전 금액이 아닌 실제 통장 입금액 기준으로 판단해보세요.
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-caption font-semibold text-muted-foreground">빠른 선택</span>
            <button
              v-for="chip in popularSalaryChips"
              :key="chip.manWon"
              type="button"
              class="touch-target rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-caption font-semibold text-primary transition-all duration-200 hover:bg-primary/12 hover:scale-[1.02]"
              @click="applyPopularSalary(chip.manWon)"
            >
              {{ chip.label }}
            </button>
          </div>
        </div>

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

        <AdSlot slot="120001" label="광고 · top" />

        <InsuranceDetail :calc="calc" />
        <DeductionTable :calc="calc" />

        <AdSlot slot="120002" label="광고 · middle" />

        <DeductionChart :calc="calc" />
        <SalaryCompareTable />
        <HealthInsuranceRank :calc="calc" />

        <InternalLink current="salary" />

        <AdSlot slot="120003" label="광고 · bottom" />

        <VisitorCounter />
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
