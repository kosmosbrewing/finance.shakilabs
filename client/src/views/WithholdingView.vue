<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import WithholdingInput from "@/components/withholding/WithholdingInput.vue";
import WithholdingResult from "@/components/withholding/WithholdingResult.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import CalcSourceBox from "@/components/salary/CalcSourceBox.vue";
import { useWithholdingReverse } from "@/composables/useWithholdingReverse";
import { useShare } from "@/composables/useShare";
import { formatManWon, formatWon } from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { addEntry } from "@/composables/useRecentCalcs";
import {
  buildAbsoluteUrl,
  buildQuery,
  isSameQuery,
  parseQueryInt,
} from "@/lib/routeState";

const props = defineProps<{
  initialAmountWon?: number;
}>();

const route = useRoute();
const router = useRouter();

const monthlyIncomeTax = ref(100_000);
const dependents = ref(1);
const childrenUnder20 = ref(0);
const nonTaxableMonthly = ref(200_000);
const initialized = ref(false);
const applyingRoute = ref(false);

// URL 파라미터 → 초기값
watch(
  () => props.initialAmountWon,
  (v) => {
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      monthlyIncomeTax.value = Math.min(v, 10_000_000);
    }
  },
  { immediate: true }
);

watch(
  [() => route.query, () => props.initialAmountWon],
  ([query, initialAmount]) => {
    applyingRoute.value = true;

    const hasPathAmount =
      typeof initialAmount === "number" &&
      Number.isFinite(initialAmount) &&
      initialAmount >= 0;

    const taxFromQuery = parseQueryInt(query.tax);
    if (!hasPathAmount && taxFromQuery !== null && taxFromQuery >= 0) {
      monthlyIncomeTax.value = Math.min(taxFromQuery, 10_000_000);
    }

    const depFromQuery = parseQueryInt(query.dep);
    if (depFromQuery !== null) {
      dependents.value = Math.max(1, Math.min(20, depFromQuery));
    }

    const childFromQuery = parseQueryInt(query.child);
    if (childFromQuery !== null) {
      const maxChildren = Math.max(0, dependents.value - 1);
      childrenUnder20.value = Math.max(0, Math.min(maxChildren, childFromQuery));
    }

    const nonTaxFromQuery = parseQueryInt(query.nontax);
    if (nonTaxFromQuery !== null) {
      nonTaxableMonthly.value = Math.max(0, Math.min(5_000_000, nonTaxFromQuery));
    }

    initialized.value = true;
    applyingRoute.value = false;
  },
  { immediate: true }
);

const { estimatedAnnualGross, calc } = useWithholdingReverse({
  monthlyIncomeTax,
  dependents,
  childrenUnder20,
  nonTaxableMonthly,
});

const {
  showShareModal,
  kakaoBusy,
  shareSummary,
  openShare,
  closeShare,
  shareKakao,
  copyLink,
} = useShare(calc, {
  getShareUrl: () => getShareUrl(),
  getShareText: () => seoTitle.value,
  getShareSummary: () =>
    [
      `소득세 ${formatWon(monthlyIncomeTax.value)}`,
      `추정 연봉 ${formatManWon(estimatedAnnualGross.value)}`,
      `월 실수령 ${formatWon(calc.monthlyNet.value)}`,
    ].join(" · "),
  getDescription: () => seoDescription.value,
  getButtonTitle: () => "원천세 계산 결과 보기",
});

const seoTitle = computed(() =>
  `소득세 ${formatWon(monthlyIncomeTax.value)} → 연봉 계산 | 2026 원천세 계산기`
);

const seoDescription = computed(() =>
  `월 소득세 ${formatWon(monthlyIncomeTax.value)} 기준 추정 연봉은 ${formatManWon(estimatedAnnualGross.value)}. 4대보험과 월 실수령액을 함께 계산합니다.`
);

const breadcrumbJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${DEFAULT_SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "원천세 계산",
      item: `${DEFAULT_SITE_URL}${route.path}`,
    },
  ],
}));

function buildWithholdingRouteState(): {
  path: string;
  query: Record<string, string>;
} {
  return {
    path: `/withholding/${Math.max(0, Math.floor(monthlyIncomeTax.value))}`,
    query: buildQuery({
      dep: dependents.value !== 1 ? dependents.value : null,
      child: childrenUnder20.value !== 0 ? childrenUnder20.value : null,
      nontax: nonTaxableMonthly.value !== 200_000 ? nonTaxableMonthly.value : null,
    }),
  };
}

watch(
  [monthlyIncomeTax, dependents, childrenUnder20, nonTaxableMonthly],
  () => {
    if (!initialized.value || applyingRoute.value) return;

    const nextRoute = buildWithholdingRouteState();
    if (route.path === nextRoute.path && isSameQuery(route.query, nextRoute.query)) {
      return;
    }

    router.replace(nextRoute);
  },
  { flush: "post" }
);

function getShareUrl(): string {
  const nextRoute = buildWithholdingRouteState();
  return buildAbsoluteUrl(nextRoute.path, nextRoute.query);
}

// 최근 계산 자동 저장 (2초 디바운스)
let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => calc.monthlyNet.value,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      if (monthlyIncomeTax.value <= 0) return;
      const nextRoute = buildWithholdingRouteState();
      const qs = new URLSearchParams(nextRoute.query).toString();
      const routePath = qs ? `${nextRoute.path}?${qs}` : nextRoute.path;
      addEntry({
        type: "withholding",
        label: `소득세 ${formatWon(monthlyIncomeTax.value)}`,
        path: routePath,
        summary: `추정 연봉 ${formatManWon(estimatedAnnualGross.value)}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="breadcrumbJsonLd" />

    <h1 class="text-h1 font-brand">2026 원천세 계산기 — 소득세로 연봉 추정</h1>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <WithholdingInput
          v-model:monthly-income-tax="monthlyIncomeTax"
          v-model:dependents="dependents"
          v-model:children-under20="childrenUnder20"
          v-model:non-taxable-monthly="nonTaxableMonthly"
        />

        <WithholdingResult
          :monthly-income-tax="monthlyIncomeTax"
          :estimated-annual-gross="estimatedAnnualGross"
          :calc="calc"
          @share-request="openShare"
        />

        <AdSlot slot="160001" label="광고 · top" />

        <CalcSourceBox />
        <InternalLink current="withholding" />

        <AdSlot slot="160002" label="광고 · bottom" />
      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="withholding-main" />
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
