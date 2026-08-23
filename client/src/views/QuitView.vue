<script setup lang="ts">
import { computed, onUnmounted, ref, watch, watchEffect } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";


import QuitInput from "@/components/quit/QuitInput.vue";
import QuitReceivables from "@/components/quit/QuitReceivables.vue";
import QuitExpenses from "@/components/quit/QuitExpenses.vue";
import SurvivalSimulation from "@/components/quit/SurvivalSimulation.vue";
import QuitChecklist from "@/components/quit/QuitChecklist.vue";
import ShareModal from "@/components/share/ShareModal.vue";

import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import { useRetirementCalc } from "@/composables/useRetirementCalc";
import { useUnemploymentCalc } from "@/composables/useUnemploymentCalc";
import { useSurvivalCalc } from "@/composables/useSurvivalCalc";
import { useShare } from "@/composables/useShare";

import { formatManWon, formatWon } from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { addEntry } from "@/composables/useRecentCalcs";
import type { QuitReason } from "@/data/unemploymentTable";
import { useRoute, useRouter } from "vue-router";
import {
  buildAbsoluteUrl,
  buildQuery,
  isSameQuery,
  parseQueryInt,
  queryFirst,
} from "@/lib/routeState";

const props = defineProps<{
  initialYears?: number;
}>();
const route = useRoute();
const router = useRouter();

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function subtractYears(baseDateInput: string, years: number): string {
  const date = new Date(`${baseDateInput}T00:00:00`);
  date.setFullYear(date.getFullYear() - years);
  return toDateInput(date);
}

const todayInput = toDateInput(new Date());

const startDate = ref(subtractYears(todayInput, 3));
const endDate = ref(todayInput);
const monthlySalary = ref(3_500_000);
const nonTaxableMonthly = ref(200_000);
const age = ref(35);
const quitReason = ref<QuitReason>("voluntary");
const dependents = ref(1);
const childrenUnder20 = ref(0);
const unusedLeaveDays = ref(12);
const annualBonus = ref(4_000_000);
const monthlyLivingCost = ref(2_500_000);
const isRangeUpdating = ref(false);
const initialized = ref(false);
const applyingRoute = ref(false);
let rangeUpdatingTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  [() => route.query, () => props.initialYears],
  ([query, initialYears]) => {
    applyingRoute.value = true;

    // 날짜 검증: YYYY-MM-DD 형식만 허용 (비정상 문자열 방지)
    const start = queryFirst(query.start);
    if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) startDate.value = start;

    const end = queryFirst(query.end);
    if (end && /^\d{4}-\d{2}-\d{2}$/.test(end)) endDate.value = end;

    const salary = parseQueryInt(query.salary);
    if (salary !== null && salary > 0) {
      monthlySalary.value = Math.max(1_000_000, Math.min(100_000_000, salary * 10_000));
    }

    const reason = queryFirst(query.reason) as QuitReason | null;
    if (
      reason &&
      ["layoff", "dismissal", "contract_end", "voluntary"].includes(reason)
    ) {
      quitReason.value = reason;
    }

    const nontax = parseQueryInt(query.nontax);
    if (nontax !== null && nontax >= 0) {
      nonTaxableMonthly.value = Math.max(0, Math.min(5_000_000, nontax * 10_000));
    }

    const ageFromQuery = parseQueryInt(query.age);
    if (ageFromQuery !== null) age.value = Math.max(20, Math.min(80, ageFromQuery));

    const dep = parseQueryInt(query.dep);
    if (dep !== null) dependents.value = Math.max(1, Math.min(20, dep));

    const child = parseQueryInt(query.child);
    if (child !== null) {
      const maxChildren = Math.max(0, dependents.value - 1);
      childrenUnder20.value = Math.max(0, Math.min(maxChildren, child));
    }

    const leave = parseQueryInt(query.leave);
    if (leave !== null) unusedLeaveDays.value = Math.max(0, Math.min(60, leave));

    const bonus = parseQueryInt(query.bonus);
    if (bonus !== null && bonus >= 0) {
      annualBonus.value = Math.max(0, Math.min(1_000_000_000, bonus * 10_000));
    }

    const living = parseQueryInt(query.living);
    if (living !== null && living >= 0) {
      monthlyLivingCost.value = Math.max(1_000_000, Math.min(100_000_000, living * 10_000));
    }

    if (
      (!start || !end) &&
      typeof initialYears === "number" &&
      Number.isFinite(initialYears) &&
      initialYears > 0
    ) {
      startDate.value = subtractYears(endDate.value, Math.floor(initialYears));
    }

    initialized.value = true;
    applyingRoute.value = false;
  },
  { immediate: true }
);

onUnmounted(() => {
  if (rangeUpdatingTimer) {
    clearTimeout(rangeUpdatingTimer);
  }
});

const salaryCalc = useSalaryCalc({
  initialAnnualGross: monthlySalary.value * 12,
  initialDependents: dependents.value,
  initialChildrenUnder20: childrenUnder20.value,
  initialNonTaxableMonthly: nonTaxableMonthly.value,
  initialRetirementIncluded: false,
});

const annualGross = computed(() => monthlySalary.value * 12);
watchEffect(() => {
  salaryCalc.annualGross.value = annualGross.value;
  salaryCalc.nonTaxableMonthly.value = nonTaxableMonthly.value;
  salaryCalc.dependents.value = dependents.value;
  salaryCalc.childrenUnder20.value = childrenUnder20.value;
});

const retirement = useRetirementCalc(
  computed(() => ({
    startDate: startDate.value,
    endDate: endDate.value,
    monthlySalary: monthlySalary.value,
    annualBonus: annualBonus.value,
  }))
);

const insuranceYears = computed(() =>
  Math.max(1, Math.floor(retirement.value.serviceDays / 365))
);

const unemployment = useUnemploymentCalc(
  computed(() => ({
    monthlySalary: monthlySalary.value,
    age: age.value,
    insuranceYears: insuranceYears.value,
    quitReason: quitReason.value,
    quitDate: endDate.value,
  }))
);

const unpaidLeaveAllowance = computed(() => {
  const hourlyWage = monthlySalary.value / 209;
  return Math.floor(hourlyWage * 8 * unusedLeaveDays.value);
});

const regionalHealthMonthly = computed(() => {
  // 지역가입 전환 시 30% 가산한 간이 추정
  const current = salaryCalc.healthInsurance.value + salaryCalc.longTermCare.value;
  return Math.floor(current * 1.3);
});

const voluntaryContinuationMonthly = computed(
  () => salaryCalc.healthInsurance.value + salaryCalc.longTermCare.value
);

const pensionMonthly = computed(() => salaryCalc.nationalPension.value);

const monthlyFixedCost = computed(
  () => regionalHealthMonthly.value + pensionMonthly.value
);

const totalReceivables = computed(
  () =>
    retirement.value.severanceNet +
    unemployment.value.totalBenefit +
    unpaidLeaveAllowance.value +
    salaryCalc.monthlyNet.value
);

const survival = useSurvivalCalc(
  computed(() => ({
    availableFund: totalReceivables.value,
    monthlyFixedCost: monthlyFixedCost.value,
    monthlyLivingCost: monthlyLivingCost.value,
  }))
);

const seoTitle = computed(
  () => `2026 ${insuranceYears.value}년 근속 퇴사 계산기 | 퇴직금·실업급여·생존기간`
);

const seoDescription = computed(
  () =>
    `퇴사하면 얼마나 버틸 수 있을까? 받을 돈 총 ${formatManWon(totalReceivables.value)}, 월 고정비 ${formatManWon(monthlyFixedCost.value)}. 실업급여·생존기간까지 한 번에 계산합니다.`
);

const {
  showShareModal,
  kakaoBusy,
  shareSummary,
  openShare,
  closeShare,
  shareKakao,
  copyLink,
} = useShare(salaryCalc, {
  getShareUrl: () => getShareUrl(),
  getShareText: () => seoTitle.value,
  getShareSummary: () =>
    [
      `${insuranceYears.value}년 근속`,
      `퇴직금 ${formatWon(retirement.value.severanceNet)}`,
      `실업급여 ${formatWon(unemployment.value.totalBenefit)}`,
      `총 수령액 ${formatWon(totalReceivables.value)}`,
    ].join(" · "),
  getDescription: () => seoDescription.value,
  getButtonTitle: () => "퇴사 계산 결과 보기",
});

const breadcrumbJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${DEFAULT_SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "퇴사 계산기",
      item: `${DEFAULT_SITE_URL}${route.path}`,
    },
  ],
}));

function buildQuitQuery(): Record<string, string> {
  return buildQuery({
    start: startDate.value,
    end: endDate.value,
    salary: Math.floor(monthlySalary.value / 10_000),
    reason: quitReason.value,
    nontax: nonTaxableMonthly.value !== 200_000 ? Math.floor(nonTaxableMonthly.value / 10_000) : null,
    age: age.value !== 35 ? age.value : null,
    dep: dependents.value !== 1 ? dependents.value : null,
    child: childrenUnder20.value !== 0 ? childrenUnder20.value : null,
    leave: unusedLeaveDays.value !== 12 ? unusedLeaveDays.value : null,
    bonus: annualBonus.value !== 4_000_000 ? Math.floor(annualBonus.value / 10_000) : null,
    living: monthlyLivingCost.value !== 2_500_000 ? Math.floor(monthlyLivingCost.value / 10_000) : null,
  });
}

watch(
  [startDate, endDate, monthlySalary, quitReason, nonTaxableMonthly, age, dependents, childrenUnder20, unusedLeaveDays, annualBonus, monthlyLivingCost],
  () => {
    if (!initialized.value || applyingRoute.value) return;

    const nextQuery = buildQuitQuery();
    if (isSameQuery(route.query, nextQuery)) return;
    router.replace({ path: "/quit", query: nextQuery });
  },
  { flush: "post" }
);

function getShareUrl(): string {
  return buildAbsoluteUrl("/quit", buildQuitQuery());
}

function handleRangeApply(range: { startDate: string; endDate: string }): void {
  if (startDate.value === range.startDate && endDate.value === range.endDate) return;
  isRangeUpdating.value = true;
  if (rangeUpdatingTimer) {
    clearTimeout(rangeUpdatingTimer);
  }
  rangeUpdatingTimer = setTimeout(() => {
    isRangeUpdating.value = false;
  }, 500);
}

// 최근 계산 자동 저장 (2초 디바운스)
let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => retirement.value.severanceNet,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      const nextQuery = buildQuitQuery();
      const qs = new URLSearchParams(nextQuery).toString();
      const routePath = qs ? `/quit?${qs}` : "/quit";
      addEntry({
        type: "quit",
        label: `${insuranceYears.value}년 근속 퇴사`,
        path: routePath,
        summary: `퇴직금 ${formatWon(retirement.value.severanceNet)}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="breadcrumbJsonLd" />

    <div class="flex items-start justify-between gap-2 sm:items-center">
      <h1 class="min-w-0 flex-1 font-brand text-[1.22rem] leading-[1.2] sm:text-h1">
        <span class="sm:hidden">2026 퇴사 계산기</span>
        <span class="hidden sm:inline">2026 퇴사 계산기 — 퇴직금·실업급여·생존기간</span>
      </h1>
      <span
        v-if="isRangeUpdating"
        class="shrink-0 pt-0.5 text-caption text-muted-foreground sm:pt-0"
        role="status"
        aria-live="polite"
      >
        업데이트 중
      </span>
    </div>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <QuitInput
          v-model:start-date="startDate"
          v-model:end-date="endDate"
          v-model:monthly-salary="monthlySalary"
          v-model:non-taxable-monthly="nonTaxableMonthly"
          v-model:age="age"
          v-model:quit-reason="quitReason"
          v-model:dependents="dependents"
          v-model:children-under20="childrenUnder20"
          v-model:unused-leave-days="unusedLeaveDays"
          v-model:annual-bonus="annualBonus"
          v-model:monthly-living-cost="monthlyLivingCost"
          @range-apply="handleRangeApply"
        />

        <AdSlot slot="140001" label="광고 · top" />

        <QuitReceivables
          :service-period-label="retirement.servicePeriodLabel"
          :retirement-gross="retirement.severanceGross"
          :retirement-tax="retirement.retirementTax"
          :retirement-net="retirement.severanceNet"
          :unemployment-eligible="unemployment.isEligible"
          :unemployment-daily-benefit="unemployment.dailyBenefit"
          :unemployment-duration-days="unemployment.durationDays"
          :unemployment-total="unemployment.totalBenefit"
          :unpaid-leave-allowance="unpaidLeaveAllowance"
          :final-monthly-net="salaryCalc.monthlyNet.value"
          :total-receivables="totalReceivables"
          :unemployment-end-date-label="unemployment.endDateLabel"
          :quit-reason="quitReason"
          @share-request="openShare"
        />

        <AdSlot slot="140002" label="광고 · middle" />

        <QuitExpenses
          :regional-health-monthly="regionalHealthMonthly"
          :voluntary-continuation-monthly="voluntaryContinuationMonthly"
          :pension-monthly="pensionMonthly"
          :monthly-fixed-cost="monthlyFixedCost"
        />

        <SurvivalSimulation
          :available-fund="survival.availableFund"
          :monthly-fixed-cost="survival.monthlyFixedCost"
          :monthly-living-cost="survival.monthlyLivingCost"
          :scenarios="survival.scenarios"
        />

        <QuitChecklist />

        <InternalLink current="quit" />

        <AdSlot slot="140003" label="광고 · bottom" />

      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="quit-main" />
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
