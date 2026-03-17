<script setup lang="ts">
import { computed, ref, watch } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";
import { useRoute, useRouter } from "vue-router";

import InsuranceInput from "@/components/insurance/InsuranceInput.vue";
import InsuranceResult from "@/components/insurance/InsuranceResult.vue";
import InsuranceTable from "@/components/insurance/InsuranceTable.vue";
import InsuranceDetail from "@/components/salary/InsuranceDetail.vue";
import DeductionTable from "@/components/salary/DeductionTable.vue";
import DeductionChart from "@/components/salary/DeductionChart.vue";
import SalaryCompareTable from "@/components/salary/SalaryCompareTable.vue";
import HealthInsuranceRank from "@/components/salary/HealthInsuranceRank.vue";
import ShareModal from "@/components/share/ShareModal.vue";

import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import RelatedServices from "@/components/common/RelatedServices.vue";
import CalcSourceBox from "@/components/salary/CalcSourceBox.vue";
import { useInsuranceReverse } from "@/composables/useInsuranceReverse";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { useShare } from "@/composables/useShare";
import { DEFAULT_INSURANCE_PRESET } from "@/data/insurancePresets";

import { formatManWon, formatWon } from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { addEntry } from "@/composables/useRecentCalcs";
import {
  buildAbsoluteUrl,
  buildQuery,
  isSameQuery,
  parseQueryBoolean,
  parseQueryInt,
  queryFirst,
} from "@/lib/routeState";

const props = defineProps<{
  initialHealthInsuranceFee?: number;
  initialMode?: "reverse" | "forward";
}>();

const route = useRoute();
const router = useRouter();

const defaultMode = computed<"reverse" | "forward">(() => {
  if (props.initialMode) return props.initialMode;
  return route.path.startsWith("/salary") ? "forward" : "reverse";
});

const mode = ref<"reverse" | "forward">(defaultMode.value);
const healthInsuranceFee = ref(DEFAULT_INSURANCE_PRESET);
const dependents = ref(1);
const childrenUnder20 = ref(0);
const nonTaxableMonthly = ref(200_000);
const initialized = ref(false);
const applyingRoute = ref(false);

watch(
  () => props.initialMode,
  (next) => {
    if (next === "reverse" || next === "forward") {
      mode.value = next;
    }
  }
);

watch(
  () => props.initialHealthInsuranceFee,
  (next) => {
    if (typeof next === "number" && Number.isFinite(next) && next >= 0) {
      healthInsuranceFee.value = Math.floor(next);
    }
  },
  { immediate: true }
);

const reverse = useInsuranceReverse({
  healthInsuranceFee,
  dependents,
  childrenUnder20,
  nonTaxableMonthly,
});

const forwardCalc = useSalaryCalc({
  initialAnnualGross: 40_000_000,
  initialDependents: 1,
  initialChildrenUnder20: 0,
  initialNonTaxableMonthly: 200_000,
});

const {
  showShareModal,
  kakaoBusy,
  shareSummary,
  openShare,
  closeShare,
  shareKakao,
  copyLink,
} = useShare(forwardCalc, {
  getCalc: () => activeCalc.value,
  getShareUrl: () => getShareUrl(),
  getShareText: (calc) => {
    const currentCalc = calc as SalaryCalcResult;
    if (isForwardMode.value) {
      const retireLabel = currentCalc.retirementIncluded.value ? "· 퇴직금 포함" : "";
      return `연봉 ${formatManWon(currentCalc.annualGross.value)} 실수령액: 월 ${formatWon(currentCalc.monthlyNet.value)} ${retireLabel} (2026년 기준)`;
    }

    return `건보료 ${formatWon(healthInsuranceFee.value)} 기준 추정 연봉: ${formatManWon(reverse.estimatedAnnualGross.value)} · 월 실수령 ${formatWon(reverse.calc.monthlyNet.value)} (2026년 기준)`;
  },
  getShareSummary: (calc) => {
    const currentCalc = calc as SalaryCalcResult;
    if (isForwardMode.value) {
      const parts = [
        `연봉 ${formatManWon(currentCalc.annualGross.value)}`,
        `부양가족 ${currentCalc.dependents.value}명`,
        `자녀 ${currentCalc.childrenUnder20.value}명`,
      ];

      if (currentCalc.nonTaxableMonthly.value > 0) {
        parts.push(`비과세 월 ${formatWon(currentCalc.nonTaxableMonthly.value)}`);
      }
      if (currentCalc.retirementIncluded.value) {
        parts.push("퇴직금 포함");
      }

      parts.push(`월 실수령 ${formatWon(currentCalc.monthlyNet.value)}`);
      return parts.join(" · ");
    }

    const parts = [
      `건보료 ${formatWon(healthInsuranceFee.value)}`,
      `추정 연봉 ${formatManWon(reverse.estimatedAnnualGross.value)}`,
      `부양가족 ${dependents.value}명`,
      `자녀 ${childrenUnder20.value}명`,
    ];

    if (nonTaxableMonthly.value > 0) {
      parts.push(`비과세 월 ${formatWon(nonTaxableMonthly.value)}`);
    }

    parts.push(`월 실수령 ${formatWon(reverse.calc.monthlyNet.value)}`);
    return parts.join(" · ");
  },
  getDescription: () =>
    isForwardMode.value
      ? "2026년 최신 세율 기준 연봉 실수령액 계산기"
      : "2026년 최신 요율 기준 건강보험료로 추정 연봉과 월 실수령액을 계산합니다",
  getButtonTitle: () =>
    isForwardMode.value ? "내 연봉 계산하기" : "내 건보료로 계산하기",
});

watch(
  [dependents, childrenUnder20, nonTaxableMonthly],
  ([nextDependents, nextChildren, nextNonTaxable]) => {
    forwardCalc.dependents.value = nextDependents;
    forwardCalc.childrenUnder20.value = nextChildren;
    forwardCalc.nonTaxableMonthly.value = nextNonTaxable;
  },
  { immediate: true }
);

watch(
  [() => route.query, () => props.initialHealthInsuranceFee, defaultMode],
  ([query, initialHealth, routeDefaultMode]) => {
    applyingRoute.value = true;

    const hasPathHealth =
      typeof initialHealth === "number" &&
      Number.isFinite(initialHealth) &&
      initialHealth > 0;

    const modeRaw = queryFirst(query.mode);
    if (modeRaw === "reverse" || modeRaw === "forward") {
      mode.value = modeRaw;
    } else if (hasPathHealth) {
      mode.value = "reverse";
    } else {
      mode.value = routeDefaultMode;
    }

    const healthFromQuery = parseQueryInt(query.health);
    if (!hasPathHealth && healthFromQuery !== null && healthFromQuery > 0) {
      healthInsuranceFee.value = Math.max(0, Math.min(1_000_000, healthFromQuery));
    }

    const grossFromQuery = parseQueryInt(query.gross);
    if (grossFromQuery !== null && grossFromQuery > 0) {
      forwardCalc.annualGross.value = Math.max(
        0,
        Math.min(300_000_000, grossFromQuery)
      );
    }

    const depFromQuery = parseQueryInt(query.dep);
    if (depFromQuery !== null) {
      dependents.value = Math.max(1, Math.min(20, depFromQuery));
    }

    const childFromQuery = parseQueryInt(query.child);
    if (childFromQuery !== null) {
      childrenUnder20.value = Math.max(0, Math.min(20, childFromQuery));
    }

    const nonTaxFromQuery = parseQueryInt(query.nontax);
    if (nonTaxFromQuery !== null) {
      nonTaxableMonthly.value = Math.max(0, Math.min(5_000_000, nonTaxFromQuery));
    }

    forwardCalc.retirementIncluded.value = parseQueryBoolean(query.retire, false);

    const maxChildren = Math.max(0, dependents.value - 1);
    if (childrenUnder20.value > maxChildren) {
      childrenUnder20.value = maxChildren;
    }

    initialized.value = true;
    applyingRoute.value = false;
  },
  { immediate: true }
);

function buildInsuranceRouteState(): {
  path: string;
  query: Record<string, string>;
} {
  if (mode.value === "reverse") {
    return {
      path: `/insurance/${Math.max(0, Math.floor(healthInsuranceFee.value))}`,
      query: buildQuery({
        dep: dependents.value !== 1 ? dependents.value : null,
        child: childrenUnder20.value !== 0 ? childrenUnder20.value : null,
        nontax: nonTaxableMonthly.value !== 200_000 ? nonTaxableMonthly.value : null,
      }),
    };
  }

  return {
    path: "/salary",
    query: buildQuery({
      gross:
        forwardCalc.annualGross.value !== 40_000_000
          ? Math.max(0, Math.floor(forwardCalc.annualGross.value))
          : null,
      dep: dependents.value !== 1 ? dependents.value : null,
      child: childrenUnder20.value !== 0 ? childrenUnder20.value : null,
      nontax: nonTaxableMonthly.value !== 200_000 ? nonTaxableMonthly.value : null,
      retire: forwardCalc.retirementIncluded.value ? 1 : null,
    }),
  };
}

watch(
  [
    mode,
    healthInsuranceFee,
    () => forwardCalc.annualGross.value,
    () => forwardCalc.retirementIncluded.value,
    dependents,
    childrenUnder20,
    nonTaxableMonthly,
  ],
  () => {
    if (!initialized.value || applyingRoute.value) return;

    const nextRoute = buildInsuranceRouteState();
    if (route.path === nextRoute.path && isSameQuery(route.query, nextRoute.query)) {
      return;
    }

    router.replace(nextRoute);
  },
  { flush: "post" }
);

const activeCalc = computed(() =>
  mode.value === "reverse" ? reverse.calc : forwardCalc
);

const isForwardMode = computed(() => mode.value === "forward");
const pageTitle = computed(() =>
  isForwardMode.value
    ? "2026 연봉 실수령액 계산기"
    : "2026 건강보험료 연봉 계산기"
);

const seoTitle = computed(() => {
  if (!isForwardMode.value) {
    return `건보료 ${formatWon(healthInsuranceFee.value)} 연봉 계산 | 2026 건강보험료 계산기`;
  }

  return "2026 연봉 실수령액 계산기 | 4대보험 + 소득세 자동 계산";
});

const seoDescription = computed(() => {
  if (!isForwardMode.value) {
    return `건보료 ${formatWon(healthInsuranceFee.value)}이면 추정 연봉 ${formatManWon(reverse.estimatedAnnualGross.value)}. 2026 최신 요율로 4대보험·소득세·월 실수령액을 즉시 확인하세요.`;
  }

  return `연봉 ${formatManWon(forwardCalc.annualGross.value)} 기준 4대보험·소득세 공제 후 월 실수령액을 계산합니다. 퇴직금 포함 여부도 함께 확인할 수 있습니다.`;
});

const breadcrumbJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${DEFAULT_SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: isForwardMode.value ? "연봉 계산기" : "건보료 계산",
      item: `${DEFAULT_SITE_URL}${route.path}`,
    },
  ],
}));

const communityPageKey = computed(() =>
  isForwardMode.value ? "salary-calc" : "insurance-main"
);

const internalLinkCurrent = computed<
  "insurance" | "salary" | "comprehensive-tax" | "compare" | "quit" | "withholding"
>(() => (isForwardMode.value ? "salary" : "insurance"));

function getShareUrl(): string {
  const nextRoute = buildInsuranceRouteState();
  return buildAbsoluteUrl(nextRoute.path, nextRoute.query);
}

function handleSidebarShare(): void {
  openShare();
}

// 최근 계산 자동 저장 (2초 디바운스)
let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => activeCalc.value.monthlyNet.value,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      const nextRoute = buildInsuranceRouteState();
      const qs = new URLSearchParams(nextRoute.query).toString();
      const routePath = qs ? `${nextRoute.path}?${qs}` : nextRoute.path;

      if (!isForwardMode.value) {
        addEntry({
          type: "insurance",
          label: `건보료 ${formatWon(healthInsuranceFee.value)}`,
          path: routePath,
          summary: `추정 연봉 ${formatManWon(reverse.estimatedAnnualGross.value)}`,
        });
        return;
      }

      if (forwardCalc.annualGross.value <= 0) return;
      addEntry({
        type: "salary",
        label: `연봉 ${formatManWon(forwardCalc.annualGross.value)}`,
        path: routePath,
        summary: `월 실수령 ${formatWon(forwardCalc.monthlyNet.value)}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="breadcrumbJsonLd" />

    <h1 class="text-h1 font-brand">{{ pageTitle }}</h1>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <div class="space-y-4">
          <InsuranceInput
            :mode="mode"
            v-model:health-insurance-fee="healthInsuranceFee"
            v-model:annual-gross="forwardCalc.annualGross.value"
            v-model:retirement-included="forwardCalc.retirementIncluded.value"
            v-model:dependents="dependents"
            v-model:children-under20="childrenUnder20"
            v-model:non-taxable-monthly="nonTaxableMonthly"
          />

          <InsuranceResult
            :mode="mode"
            :health-insurance-fee="healthInsuranceFee"
            :estimated-taxable-monthly="reverse.estimatedTaxableMonthly.value"
            :estimated-annual-gross="reverse.estimatedAnnualGross.value"
            :calc="activeCalc"
            @share-request="handleSidebarShare"
          />
        </div>

        <HealthInsuranceRank :calc="activeCalc" :mode="isForwardMode ? 'salary' : 'insurance'" />

        <AdSlot slot="110001" label="광고 · top" />

        <template v-if="isForwardMode">
          <InsuranceDetail :calc="forwardCalc" />
          <DeductionTable :calc="forwardCalc" />
          <DeductionChart :calc="forwardCalc" />
          <SalaryCompareTable />
        </template>
        <InsuranceTable v-else />

        <AdSlot slot="110002" label="광고 · middle" />

        <CalcSourceBox />
        <InternalLink :current="internalLinkCurrent" />
        <RelatedServices />

        <AdSlot slot="110003" label="광고 · bottom" />
      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar :page-key="communityPageKey" @share-request="handleSidebarShare" />
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
