<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import WithholdingInput from "@/components/withholding/WithholdingInput.vue";
import WithholdingResult from "@/components/withholding/WithholdingResult.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import CalcSourceBox from "@/components/salary/CalcSourceBox.vue";
import { useWithholdingReverse } from "@/composables/useWithholdingReverse";
import { formatManWon, formatWon } from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { showAlert } from "@/composables/useAlert";
import { addEntry } from "@/composables/useRecentCalcs";
import {
  buildAbsoluteUrl,
  buildQuery,
  copyToClipboard,
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
const nonTaxableMonthly = ref(200_000);
const initialized = ref(false);
const applyingRoute = ref(false);

// URL 파라미터 → 초기값
watch(
  () => props.initialAmountWon,
  (v) => {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
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
      initialAmount > 0;

    const taxFromQuery = parseQueryInt(query.tax);
    if (!hasPathAmount && taxFromQuery !== null && taxFromQuery > 0) {
      monthlyIncomeTax.value = Math.min(taxFromQuery, 10_000_000);
    }

    const depFromQuery = parseQueryInt(query.dep);
    if (depFromQuery !== null) {
      dependents.value = Math.max(1, Math.min(20, depFromQuery));
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
  nonTaxableMonthly,
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
    path: `/withholding/${Math.max(1, Math.floor(monthlyIncomeTax.value))}`,
    query: buildQuery({
      dep: dependents.value !== 1 ? dependents.value : null,
      nontax: nonTaxableMonthly.value !== 200_000 ? nonTaxableMonthly.value : null,
    }),
  };
}

watch(
  [monthlyIncomeTax, dependents, nonTaxableMonthly],
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

async function copyWithholdingLink(): Promise<void> {
  try {
    const link = getShareUrl();
    const copied = await copyToClipboard(link);
    if (!copied) {
      throw new Error("clipboard unavailable");
    }
    showAlert("링크를 복사했습니다");
  } catch {
    showAlert("링크 복사에 실패했습니다", { type: "error" });
  }
}

async function shareWithholding(): Promise<void> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: seoTitle.value,
        text: seoDescription.value,
        url: getShareUrl(),
      });
      return;
    } catch {
      // 사용자가 공유를 취소한 경우
    }
  }
  await copyWithholdingLink();
}

// 최근 계산 자동 저장 (2초 디바운스)
let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => calc.monthlyNet.value,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      if (monthlyIncomeTax.value <= 0) return;
      addEntry({
        type: "withholding",
        label: `소득세 ${formatWon(monthlyIncomeTax.value)}`,
        path: "/withholding",
        summary: `추정 연봉 ${formatManWon(estimatedAnnualGross.value)}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="breadcrumbJsonLd" />

    <h1 class="text-h1 font-title">2026 원천세 계산기 — 소득세로 연봉 추정</h1>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <WithholdingInput
          v-model:monthly-income-tax="monthlyIncomeTax"
          v-model:dependents="dependents"
          v-model:non-taxable-monthly="nonTaxableMonthly"
        />

        <WithholdingResult
          :monthly-income-tax="monthlyIncomeTax"
          :estimated-annual-gross="estimatedAnnualGross"
          :calc="calc"
        />

        <AdSlot slot="160001" label="광고 · top" />

        <CalcSourceBox />
        <InternalLink current="withholding" />

        <AdSlot slot="160002" label="광고 · bottom" />
      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="withholding-main" @share-request="shareWithholding" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
