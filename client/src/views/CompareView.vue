<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import TickerBar from "@/components/common/TickerBar.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import CompareInput from "@/components/compare/CompareInput.vue";
import CompareResult from "@/components/compare/CompareResult.vue";
import CompareDiffTable from "@/components/compare/CompareDiffTable.vue";
import VisitorCounter from "@/components/common/VisitorCounter.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import { compareTickerMessages } from "@/data/tickerMessages";
import { COMPARE_PRESETS } from "@/data/comparePresets";
import { formatManWon, formatWon, copyUsingExecCommand } from "@/lib/utils";
import { showAlert } from "@/composables/useAlert";
import { addEntry } from "@/composables/useRecentCalcs";

type CompanyState = {
  annualGross: number;
  nonTaxableMonthly: number;
  bonusAnnual: number;
  welfareMonthly: number;
  retirementIncluded: boolean;
};

const props = defineProps<{
  initialAManWon?: number;
  initialBManWon?: number;
}>();

const route = useRoute();
const router = useRouter();
const initialized = ref(false);

const companyA = ref<CompanyState>({
  annualGross: 40_000_000,
  nonTaxableMonthly: 200_000,
  bonusAnnual: 0,
  welfareMonthly: 0,
  retirementIncluded: false,
});

const companyB = ref<CompanyState>({
  annualGross: 50_000_000,
  nonTaxableMonthly: 200_000,
  bonusAnnual: 0,
  welfareMonthly: 0,
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

function parseIntSafe(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

onMounted(() => {
  if (props.initialAManWon && props.initialBManWon) {
    companyA.value.annualGross = props.initialAManWon * 10_000;
    companyB.value.annualGross = props.initialBManWon * 10_000;
  }

  const q = route.query;

  if (q.a) companyA.value.annualGross = parseIntSafe(q.a, 4000) * 10_000;
  if (q.b) companyB.value.annualGross = parseIntSafe(q.b, 5000) * 10_000;
  if (q.na) companyA.value.nonTaxableMonthly = parseIntSafe(q.na, 20) * 10_000;
  if (q.nb) companyB.value.nonTaxableMonthly = parseIntSafe(q.nb, 20) * 10_000;
  if (q.ba) companyA.value.bonusAnnual = parseIntSafe(q.ba, 0) * 10_000;
  if (q.bb) companyB.value.bonusAnnual = parseIntSafe(q.bb, 0) * 10_000;
  if (q.wa) companyA.value.welfareMonthly = parseIntSafe(q.wa, 0) * 10_000;
  if (q.wb) companyB.value.welfareMonthly = parseIntSafe(q.wb, 0) * 10_000;
  if (q.ra) companyA.value.retirementIncluded = String(q.ra) === "1";
  if (q.rb) companyB.value.retirementIncluded = String(q.rb) === "1";

  dependents.value = parseIntSafe(q.dep, 1);
  childrenUnder20.value = parseIntSafe(q.child, 0);

  initialized.value = true;
});

watch(
  [companyA, companyB, dependents, childrenUnder20],
  ([a, b, dep, child]) => {
    if (!initialized.value) return;

    const query: Record<string, string> = {
      a: String(Math.floor(a.annualGross / 10_000)),
      b: String(Math.floor(b.annualGross / 10_000)),
    };

    if (a.nonTaxableMonthly !== 200_000) query.na = String(Math.floor(a.nonTaxableMonthly / 10_000));
    if (b.nonTaxableMonthly !== 200_000) query.nb = String(Math.floor(b.nonTaxableMonthly / 10_000));
    if (a.bonusAnnual !== 0) query.ba = String(Math.floor(a.bonusAnnual / 10_000));
    if (b.bonusAnnual !== 0) query.bb = String(Math.floor(b.bonusAnnual / 10_000));
    if (a.welfareMonthly !== 0) query.wa = String(Math.floor(a.welfareMonthly / 10_000));
    if (b.welfareMonthly !== 0) query.wb = String(Math.floor(b.welfareMonthly / 10_000));
    if (a.retirementIncluded) query.ra = "1";
    if (b.retirementIncluded) query.rb = "1";
    if (dep !== 1) query.dep = String(dep);
    if (child !== 0) query.child = String(child);

    router.replace({ query });
  },
  { deep: true, flush: "post" }
);

const monthlyNetDiff = computed(() => calcB.monthlyNet.value - calcA.monthlyNet.value);

const seoTitle = computed(
  () => `연봉 ${Math.floor(companyA.value.annualGross / 10_000).toLocaleString()} vs ${Math.floor(companyB.value.annualGross / 10_000).toLocaleString()} 이직 비교 | 실수령 차이 계산`
);

const seoDescription = computed(
  () => `현재 ${formatManWon(companyA.value.annualGross)}에서 ${formatManWon(companyB.value.annualGross)}로 이직 시 월 실수령 차이는 ${formatWon(monthlyNetDiff.value)}입니다.`
);

function applyPreset(a: number, b: number): void {
  companyA.value.annualGross = a * 10_000;
  companyB.value.annualGross = b * 10_000;
}

function compareShareUrl(): string {
  const params = new URLSearchParams(route.query as Record<string, string>);
  const query = params.toString();
  return query
    ? `${window.location.origin}${route.path}?${query}`
    : `${window.location.origin}${route.path}`;
}

async function copyCompareLink(): Promise<void> {
  try {
    const link = compareShareUrl();
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
    } else if (!copyUsingExecCommand(link)) {
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
        label: `${aManWon.toLocaleString()}만원 vs ${bManWon.toLocaleString()}만원`,
        path: `/compare?a=${aManWon}&b=${bManWon}`,
        summary: `차이 월 ${formatWon(Math.abs(monthlyNetDiff.value))}`,
      });
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" />

    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-h1 font-title">이직 연봉 비교기</h1>
      <FreshBadge />
    </div>

    <TickerBar :messages="compareTickerMessages" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <div class="retro-panel-muted p-3 sm:p-4 space-y-3">
          <p class="text-caption sm:text-body font-semibold text-foreground">
            A사와 B사의 실수령 차이를 한 화면에서 비교하세요. 복지/성과급까지 반영해 실질 월소득을 보여줍니다.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in COMPARE_PRESETS"
              :key="`${preset.a}-${preset.b}`"
              type="button"
              class="touch-target rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-caption font-semibold text-primary transition-all duration-200 hover:bg-primary/12 hover:scale-[1.02]"
              @click="applyPreset(preset.a, preset.b)"
            >
              {{ preset.a.toLocaleString() }} vs {{ preset.b.toLocaleString() }}
            </button>
          </div>
        </div>

        <CompareInput
          v-model:company-a="companyA"
          v-model:company-b="companyB"
          v-model:dependents="dependents"
          v-model:children-under20="childrenUnder20"
        />

        <div class="flex flex-wrap gap-2">
          <button type="button" class="retro-button" @click="shareCompare">공유</button>
          <button type="button" class="retro-button-subtle" @click="copyCompareLink">링크 복사</button>
          <RouterLink class="retro-button-subtle" to="/salary">연봉 단일 계산으로 이동</RouterLink>
        </div>

        <AdSlot slot="130001" label="광고 · top" />

        <CompareResult
          :calc-a="calcA"
          :calc-b="calcB"
          :welfare-a="{ bonusAnnual: companyA.bonusAnnual, welfareMonthly: companyA.welfareMonthly }"
          :welfare-b="{ bonusAnnual: companyB.bonusAnnual, welfareMonthly: companyB.welfareMonthly }"
        />

        <CompareDiffTable :calc-a="calcA" :calc-b="calcB" />

        <AdSlot slot="130002" label="광고 · middle" />

        <InternalLink current="compare" />

        <AdSlot slot="130003" label="광고 · bottom" />

        <VisitorCounter />
      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="compare-main" @share-request="shareCompare" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
