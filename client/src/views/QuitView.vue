<script setup lang="ts">
import { computed, onUnmounted, ref, watch, watchEffect } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";


import QuitInput from "@/components/quit/QuitInput.vue";
import QuitReceivables from "@/components/quit/QuitReceivables.vue";
import QuitExpenses from "@/components/quit/QuitExpenses.vue";
import SurvivalSimulation from "@/components/quit/SurvivalSimulation.vue";
import QuitChecklist from "@/components/quit/QuitChecklist.vue";

import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import { useRetirementCalc } from "@/composables/useRetirementCalc";
import { useUnemploymentCalc } from "@/composables/useUnemploymentCalc";
import { useSurvivalCalc } from "@/composables/useSurvivalCalc";

import { formatManWon, formatWon } from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { showAlert } from "@/composables/useAlert";
import { addEntry } from "@/composables/useRecentCalcs";
import type { QuitReason } from "@/data/unemploymentTable";
import { useRoute, useRouter } from "vue-router";
import {
  buildAbsoluteUrl,
  buildQuery,
  copyToClipboard,
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

    const start = queryFirst(query.start);
    if (start) startDate.value = start;

    const end = queryFirst(query.end);
    if (end) endDate.value = end;

    const salary = parseQueryInt(query.salary);
    if (salary !== null && salary > 0) {
      monthlySalary.value = Math.floor(salary * 10_000);
    }

    const reason = queryFirst(query.reason) as QuitReason | null;
    if (
      reason &&
      ["layoff", "dismissal", "contract_end", "voluntary"].includes(reason)
    ) {
      quitReason.value = reason;
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
    salary: Math.max(1, Math.floor(monthlySalary.value / 10_000)),
    reason: quitReason.value,
  });
}

watch(
  [startDate, endDate, monthlySalary, quitReason],
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

async function copyQuitLink(): Promise<void> {
  try {
    const link = getShareUrl();
    const copied = await copyToClipboard(link);
    if (!copied) {
      throw new Error("clipboard unavailable");
    }
    showAlert("퇴사 시뮬레이션 링크를 복사했습니다");
  } catch {
    showAlert("링크 복사에 실패했습니다", { type: "error" });
  }
}

// 최근 계산 자동 저장 (2초 디바운스)
let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => retirement.value.severanceNet,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      addEntry({
        type: "quit",
        label: `${insuranceYears.value}년 근속 퇴사`,
        path: "/quit",
        summary: `퇴직금 ${formatWon(retirement.value.severanceNet)}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="breadcrumbJsonLd" />

    <div class="flex items-center justify-between gap-2">
      <h1 class="text-h1 font-title">2026 퇴사 계산기 — 퇴직금·실업급여·생존기간</h1>
      <span
        v-if="isRangeUpdating"
        class="text-caption text-muted-foreground"
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
        <CommunitySidebar page-key="quit-main" @share-request="copyQuitLink" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
