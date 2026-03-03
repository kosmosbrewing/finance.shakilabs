<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";


import CompareInput from "@/components/compare/CompareInput.vue";
import CompareResult from "@/components/compare/CompareResult.vue";

import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { useSalaryCalc } from "@/composables/useSalaryCalc";

import {
  formatManWon,
  formatManWonValue,
  formatWon,
} from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { showAlert } from "@/composables/useAlert";
import { addEntry } from "@/composables/useRecentCalcs";
import {
  buildAbsoluteUrl,
  buildQuery,
  copyToClipboard,
  isSameQuery,
  parseQueryBoolean,
  parseQueryInt,
} from "@/lib/routeState";

type CompanyState = {
  annualGross: number;
  nonTaxableMonthly: number;
  retirementIncluded: boolean;
};

const props = defineProps<{
  initialAManWon?: number;
  initialBManWon?: number;
}>();

const route = useRoute();
const router = useRouter();
const initialized = ref(false);
const applyingRoute = ref(false);

const companyA = ref<CompanyState>({
  annualGross: 40_000_000,
  nonTaxableMonthly: 200_000,
  retirementIncluded: false,
});

const companyB = ref<CompanyState>({
  annualGross: 50_000_000,
  nonTaxableMonthly: 200_000,
  retirementIncluded: false,
});

const dependents = ref(1);
const childrenUnder20 = ref(0);

const calcA = useSalaryCalc({
  initialAnnualGross: companyA.value.annualGross,
  initialNonTaxableMonthly: companyA.value.nonTaxableMonthly,
  initialDependents: 1,
  initialChildrenUnder20: 0,
});

const calcB = useSalaryCalc({
  initialAnnualGross: companyB.value.annualGross,
  initialNonTaxableMonthly: companyB.value.nonTaxableMonthly,
  initialDependents: 1,
  initialChildrenUnder20: 0,
});

watch(
  [companyA, dependents, childrenUnder20],
  ([nextA, dep, child]) => {
    calcA.annualGross.value = nextA.annualGross;
    calcA.nonTaxableMonthly.value = nextA.nonTaxableMonthly;
    calcA.retirementIncluded.value = nextA.retirementIncluded;
    calcA.dependents.value = dep;
    calcA.childrenUnder20.value = child;
  },
  { deep: true, immediate: true }
);

watch(
  [companyB, dependents, childrenUnder20],
  ([nextB, dep, child]) => {
    calcB.annualGross.value = nextB.annualGross;
    calcB.nonTaxableMonthly.value = nextB.nonTaxableMonthly;
    calcB.retirementIncluded.value = nextB.retirementIncluded;
    calcB.dependents.value = dep;
    calcB.childrenUnder20.value = child;
  },
  { deep: true, immediate: true }
);

watch(
  [
    () => route.query,
    () => props.initialAManWon,
    () => props.initialBManWon,
  ],
  ([query, initialA, initialB]) => {
    applyingRoute.value = true;

    if (
      typeof initialA === "number" &&
      Number.isFinite(initialA) &&
      initialA > 0 &&
      typeof initialB === "number" &&
      Number.isFinite(initialB) &&
      initialB > 0
    ) {
      companyA.value.annualGross = Math.floor(initialA * 10_000);
      companyB.value.annualGross = Math.floor(initialB * 10_000);
    }

    const a = parseQueryInt(query.a);
    if (a !== null && a > 0) {
      companyA.value.annualGross = Math.floor(a * 10_000);
    }

    const b = parseQueryInt(query.b);
    if (b !== null && b > 0) {
      companyB.value.annualGross = Math.floor(b * 10_000);
    }

    const na = parseQueryInt(query.na);
    if (na !== null && na >= 0) {
      companyA.value.nonTaxableMonthly = Math.max(
        0,
        Math.min(5_000_000, Math.floor(na * 10_000))
      );
    }

    const nb = parseQueryInt(query.nb);
    if (nb !== null && nb >= 0) {
      companyB.value.nonTaxableMonthly = Math.max(
        0,
        Math.min(5_000_000, Math.floor(nb * 10_000))
      );
    }

    companyA.value.retirementIncluded = parseQueryBoolean(query.ra, false);
    companyB.value.retirementIncluded = parseQueryBoolean(query.rb, false);

    const dep = parseQueryInt(query.dep);
    if (dep !== null) {
      dependents.value = Math.max(1, Math.min(20, dep));
    }

    const child = parseQueryInt(query.child);
    if (child !== null) {
      childrenUnder20.value = Math.max(0, Math.min(20, child));
    }

    const maxChildren = Math.max(0, dependents.value - 1);
    if (childrenUnder20.value > maxChildren) {
      childrenUnder20.value = maxChildren;
    }

    initialized.value = true;
    applyingRoute.value = false;
  },
  { immediate: true }
);

function buildCompareRouteState(): {
  path: string;
  query: Record<string, string>;
} {
  const aManWon = Math.max(1, Math.floor(companyA.value.annualGross / 10_000));
  const bManWon = Math.max(1, Math.floor(companyB.value.annualGross / 10_000));

  return {
    path: `/compare/${aManWon}-vs-${bManWon}`,
    query: buildQuery({
      na:
        companyA.value.nonTaxableMonthly !== 200_000
          ? Math.floor(companyA.value.nonTaxableMonthly / 10_000)
          : null,
      nb:
        companyB.value.nonTaxableMonthly !== 200_000
          ? Math.floor(companyB.value.nonTaxableMonthly / 10_000)
          : null,
      ra: companyA.value.retirementIncluded ? 1 : null,
      rb: companyB.value.retirementIncluded ? 1 : null,
      dep: dependents.value !== 1 ? dependents.value : null,
      child: childrenUnder20.value !== 0 ? childrenUnder20.value : null,
    }),
  };
}

watch(
  [companyA, companyB, dependents, childrenUnder20],
  () => {
    if (!initialized.value || applyingRoute.value) return;

    const nextRoute = buildCompareRouteState();
    if (route.path === nextRoute.path && isSameQuery(route.query, nextRoute.query)) {
      return;
    }

    router.replace(nextRoute);
  },
  { deep: true, flush: "post" }
);

const monthlyNetDiff = computed(() => calcB.monthlyNet.value - calcA.monthlyNet.value);

const seoTitle = computed(
  () =>
    `2026 연봉 ${formatManWonValue(Math.floor(companyA.value.annualGross / 10_000))} vs ${formatManWonValue(Math.floor(companyB.value.annualGross / 10_000))} 이직 비교 | 실수령 차이 계산`
);

const seoDescription = computed(
  () => `연봉 ${formatManWon(companyA.value.annualGross)}에서 ${formatManWon(companyB.value.annualGross)}로 이직하면 월 실수령은 ${formatWon(monthlyNetDiff.value)} 차이. 4대보험·세금 반영 실수령 비교를 즉시 확인하세요.`
);

const breadcrumbJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${DEFAULT_SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "이직 연봉 비교 계산기",
      item: `${DEFAULT_SITE_URL}${route.path}`,
    },
  ],
}));

function compareShareUrl(): string {
  const nextRoute = buildCompareRouteState();
  return buildAbsoluteUrl(nextRoute.path, nextRoute.query);
}

async function copyCompareLink(): Promise<void> {
  try {
    const link = compareShareUrl();
    const copied = await copyToClipboard(link);
    if (!copied) {
      throw new Error("clipboard unavailable");
    }
    showAlert("비교 링크를 복사했습니다");
  } catch {
    showAlert("링크 복사에 실패했습니다", { type: "error" });
  }
}

async function shareCompare(): Promise<void> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: seoTitle.value,
        text: seoDescription.value,
        url: compareShareUrl(),
      });
      return;
    } catch {
      // 사용자가 공유를 취소한 경우도 여기로 들어올 수 있음
    }
  }

  await copyCompareLink();
}

// 최근 계산 자동 저장 (2초 디바운스)
let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  monthlyNetDiff,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      const aManWon = Math.floor(companyA.value.annualGross / 10_000);
      const bManWon = Math.floor(companyB.value.annualGross / 10_000);
      addEntry({
        type: "compare",
        label: `${formatManWonValue(aManWon)} vs ${formatManWonValue(bManWon)}`,
        path: `/compare?a=${aManWon}&b=${bManWon}`,
        summary: `차이 월 ${formatWon(Math.abs(monthlyNetDiff.value))}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="breadcrumbJsonLd" />

    <h1 class="text-h1 font-title">2026 이직 연봉 비교 계산기</h1>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <CompareInput
          v-model:company-a="companyA"
          v-model:company-b="companyB"
          v-model:dependents="dependents"
          v-model:children-under20="childrenUnder20"
        >
          <template #result>
            <CompareResult
              embedded
              :calc-a="calcA"
              :calc-b="calcB"
            />
          </template>
        </CompareInput>

        <AdSlot slot="130001" label="광고 · top" />

        <AdSlot slot="130002" label="광고 · middle" />

        <InternalLink current="compare" />

        <AdSlot slot="130003" label="광고 · bottom" />

      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="compare-main" @share-request="shareCompare" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
