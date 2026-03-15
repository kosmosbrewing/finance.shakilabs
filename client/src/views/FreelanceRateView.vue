<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { Button } from "@/components/ui/button";
import ScenarioChipGroup from "@/components/scenario/ScenarioChipGroup.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import { useShare } from "@/composables/useShare";
import { addEntry } from "@/composables/useRecentCalcs";
import {
  FREELANCE_INDUSTRIES,
  type IndustryKey,
} from "@/data/freelanceTaxRates";
import { normalizeFreelanceRateInput } from "@/lib/validators";
import { buildAbsoluteUrl, buildQuery, parseQueryInt, queryFirst } from "@/lib/routeState";
import { formatPercent, formatWon } from "@/lib/utils";
import { calculateFreelanceRateImpact } from "@/utils/scenarioCalculator";

const route = useRoute();
const targetMonthlyNet = ref(4_000_000);
const workDaysMonthly = ref(18);
const billableHoursDaily = ref(6);
const dependents = ref(1);
const incomeType = ref<"business" | "other_income">("business");
const industryKey = ref<IndustryKey>("it");

watch(
  () => route.query,
  (query) => {
    const nextTarget = parseQueryInt(query.net);
    const nextDays = parseQueryInt(query.days);
    const nextHours = parseQueryInt(query.hours);
    const nextDependents = parseQueryInt(query.dep);
    const nextType = queryFirst(query.type);
    const nextIndustry = queryFirst(query.ind);
    if (nextTarget !== null) targetMonthlyNet.value = nextTarget;
    if (nextDays !== null) workDaysMonthly.value = nextDays;
    if (nextHours !== null) billableHoursDaily.value = nextHours;
    if (nextDependents !== null) dependents.value = nextDependents;
    if (nextType === "other_income") incomeType.value = "other_income";
    if (nextIndustry && nextIndustry in FREELANCE_INDUSTRIES) {
      industryKey.value = nextIndustry as IndustryKey;
    }
  },
  { immediate: true }
);

const input = computed(() =>
  normalizeFreelanceRateInput({
    targetMonthlyNet: targetMonthlyNet.value,
    workDaysMonthly: workDaysMonthly.value,
    billableHoursDaily: billableHoursDaily.value,
    dependents: dependents.value,
    incomeType: incomeType.value,
    industryKey: industryKey.value,
  })
);
const result = computed(() => calculateFreelanceRateImpact(input.value));
const seoTitle = computed(() => "프리랜서 세후 단가 역산 계산기 | 2026 finance.shakilabs");
const seoDescription = computed(
  () =>
    `월 세후 목표 ${formatWon(input.value.targetMonthlyNet)}를 만들기 위해 필요한 청구액은 월 ${formatWon(
      result.value.monthlyInvoice
    )} 수준입니다.`
);

function buildShareState(): { path: string; query: Record<string, string> } {
  return {
    path: "/freelance-rate",
    query: buildQuery({
      net: input.value.targetMonthlyNet,
      days: input.value.workDaysMonthly !== 18 ? input.value.workDaysMonthly : null,
      hours: input.value.billableHoursDaily !== 6 ? input.value.billableHoursDaily : null,
      dep: input.value.dependents !== 1 ? input.value.dependents : null,
      type: input.value.incomeType !== "business" ? input.value.incomeType : null,
      ind: input.value.industryKey !== "it" ? input.value.industryKey : null,
    }),
  };
}

const { showShareModal, kakaoBusy, shareSummary, openShare, closeShare, shareKakao, copyLink } = useShare(null, {
  getCalc: () => result.value,
  getShareUrl: () => {
    const state = buildShareState();
    return buildAbsoluteUrl(state.path, state.query);
  },
  getShareText: () => `세후 월 ${formatWon(input.value.targetMonthlyNet)} 목표라면 월 청구 ${formatWon(result.value.monthlyInvoice)}`,
  getShareSummary: () => `${input.value.workDaysMonthly}일 · 하루 ${input.value.billableHoursDaily}시간 · 일 ${formatWon(result.value.dailyRate)} · 시 ${formatWon(result.value.hourlyRate)}`,
  getDescription: () => seoDescription.value,
  getButtonTitle: () => "단가 결과 보기",
});

let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => result.value.monthlyInvoice,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      const state = buildShareState();
      const queryString = new URLSearchParams(state.query).toString();
      addEntry({
        type: "freelance-rate",
        label: `세후 목표 ${formatWon(input.value.targetMonthlyNet)}`,
        path: queryString ? `${state.path}?${queryString}` : state.path,
        summary: `월 청구 ${formatWon(result.value.monthlyInvoice)}`,
      });
    }, 1200);
  },
  { immediate: true }
);

const industryOptions = computed<{ value: IndustryKey; label: string }[]>(() =>
  Object.entries(FREELANCE_INDUSTRIES).map(([key, value]) => ({
    value: key as IndustryKey,
    label: value.label,
  }))
);
const incomeTypeOptions = [
  { label: "사업소득 3.3%", value: "business" },
  { label: "기타소득 8.8%", value: "other_income" },
] as const;
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <div class="space-y-1">
              <h1 class="retro-title">프리랜서 세후 단가 역산 계산기</h1>
              <p class="text-caption text-muted-foreground [text-wrap:balance]">목표 실수령을 기준으로 월 청구액, 일 단가, 시급을 역산합니다.</p>
            </div>
            <FreshBadge message="2026 종소세 기준" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="space-y-4">
              <ScenarioField v-model="targetMonthlyNet" label="목표 세후 월수입" unit="원" :min="1_000_000" :max="10_000_000" :step="10_000" format="currency" :presets="[{ label: '300만원', value: 3_000_000 }, { label: '400만원', value: 4_000_000 }, { label: '600만원', value: 6_000_000 }]" />
              <ScenarioField v-model="workDaysMonthly" label="월 작업일수" unit="일" :min="8" :max="25" :presets="[{ label: '16일', value: 16 }, { label: '18일', value: 18 }, { label: '20일', value: 20 }]" />
              <ScenarioField v-model="billableHoursDaily" label="하루 청구시간" unit="시간" :min="2" :max="10" :step="0.5" format="decimal" :presets="[{ label: '4시간', value: 4 }, { label: '6시간', value: 6 }, { label: '8시간', value: 8 }]" />
              <ScenarioField v-model="dependents" label="부양가족 수" unit="명" :min="1" :max="6" :presets="[{ label: '1명', value: 1 }, { label: '2명', value: 2 }, { label: '4명', value: 4 }]" />
              <ScenarioChipGroup v-model="incomeType" label="소득 유형" :options="incomeTypeOptions" />
              <ScenarioChipGroup v-if="incomeType === 'business'" v-model="industryKey" label="업종 경비율" :options="industryOptions" />
            </div>
            <div class="space-y-4">
              <div class="retro-stat-grid sm:grid-cols-2">
                <div class="retro-stat">
                  <p class="retro-stat-label">월 청구액</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.monthlyInvoice) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">일 단가</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.dailyRate) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">시간당 단가</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.hourlyRate) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">실효 세율</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatPercent(result.tax.effectiveTaxRate, 1) }}</p>
                </div>
              </div>

              <div class="retro-panel-muted retro-panel-content space-y-3">
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <p class="text-tiny uppercase tracking-wide text-muted-foreground">원천징수 후 현금흐름</p>
                    <p class="mt-1 text-body font-semibold tabular-nums">{{ formatWon(result.cashAfterWithholdingMonthly) }}/월</p>
                  </div>
                  <div>
                    <p class="text-tiny uppercase tracking-wide text-muted-foreground">정산 차이</p>
                    <p class="mt-1 text-body font-semibold tabular-nums">{{ result.settlementDelta >= 0 ? "추가 납부" : "환급 예상" }} {{ formatWon(Math.abs(result.settlementDelta)) }}</p>
                  </div>
                </div>
                <p class="text-caption leading-6 text-muted-foreground">
                  목표 세후 <span class="tabular-nums">{{ formatWon(input.targetMonthlyNet) }}</span>를 위해 연간 청구액은
                  <span class="font-semibold text-foreground tabular-nums">{{ formatWon(result.annualGross) }}</span> 수준이 필요합니다.
                </p>
                <Button class="w-full" @click="openShare">결과 공유</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="freelance-rate-main" @share-request="openShare" />
        <RecentCalcPanel />
      </div>
    </section>
    <ShareModal :show="showShareModal" :kakao-busy="kakaoBusy" :summary-text="shareSummary" @close="closeShare" @share-kakao="shareKakao" @copy-link="copyLink" />
  </div>
</template>
