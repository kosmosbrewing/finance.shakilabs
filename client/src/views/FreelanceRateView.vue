<script setup lang="ts">
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ShCalculatorSplit } from "@shakilabs/ui";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import CalculatorFeedbackRow from "@/components/calculator/CalculatorFeedbackRow.vue";
import ScenarioChipGroup from "@/components/scenario/ScenarioChipGroup.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import FreelanceRateResult from "@/components/freelance-rate/FreelanceRateResult.vue";
import { useShare } from "@/composables/useShare";
import { addEntry } from "@/composables/useRecentCalcs";
import {
  FREELANCE_INDUSTRIES,
  type IndustryKey,
} from "@/data/freelanceTaxRates";
import { normalizeFreelanceRateInput } from "@/lib/validators";
import { buildAbsoluteUrl, buildQuery, parseQueryInt, queryFirst } from "@/lib/routeState";
import { formatWon } from "@/lib/utils";
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
const seoTitle = computed(() => "2026 프리랜서 세후 단가 역산 계산기 | 원천세 제외 실수령");
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
  }
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
  <div class="sh-container sh-container--tool space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" />

    <CalculatorPageHeader title="프리랜서 세후 단가 역산 계산기" />

    <!-- 퍼널 추적은 입력·결과 두 카드를 함께 감싼다 — 한 패널이던 때와 같은 범위라야 결과 공유 클릭까지
         이벤트가 그대로다. 입력이 결과보다 길어 결과 칸은 ShCalculatorSplit이 스스로 붙인다(래퍼에 overflow 금지). -->
    <CalculatorInteractionTracker>
      <ShCalculatorSplit>
        <template #input>
          <section class="retro-panel overflow-hidden" aria-labelledby="freelance-rate-input-title">
            <div class="retro-titlebar rounded-t-2xl">
              <h2 id="freelance-rate-input-title" class="retro-title">역산 조건 입력</h2>
            </div>
            <div class="retro-panel-content space-y-4">
              <ScenarioField v-model="targetMonthlyNet" label="목표 세후 월수입" unit="원" :min="1_000_000" :max="10_000_000" :step="10_000" format="currency" :presets="[{ label: '300만원', value: 3_000_000 }, { label: '400만원', value: 4_000_000 }, { label: '600만원', value: 6_000_000 }]" />
              <ScenarioField v-model="workDaysMonthly" label="월 작업일수" unit="일" :min="8" :max="25" :presets="[{ label: '16일', value: 16 }, { label: '18일', value: 18 }, { label: '20일', value: 20 }]" />
              <ScenarioField v-model="billableHoursDaily" label="하루 청구시간" unit="시간" :min="2" :max="10" :step="0.5" format="decimal" :presets="[{ label: '4시간', value: 4 }, { label: '6시간', value: 6 }, { label: '8시간', value: 8 }]" />
              <ScenarioField v-model="dependents" label="부양가족 수" unit="명" :min="1" :max="6" :presets="[{ label: '1명', value: 1 }, { label: '2명', value: 2 }, { label: '4명', value: 4 }]" />
              <ScenarioChipGroup v-model="incomeType" label="소득 유형" :options="incomeTypeOptions" />
              <ScenarioChipGroup v-if="incomeType === 'business'" v-model="industryKey" label="업종 경비율" :options="industryOptions" />
            </div>
          </section>
        </template>
        <template #result>
          <FreelanceRateResult :result="result" :target-monthly-net="input.targetMonthlyNet" @share-request="openShare" />
        </template>
      </ShCalculatorSplit>
    </CalculatorInteractionTracker>
    <InternalLink current="freelance-rate" />

    <CalculatorFeedbackRow page-key="freelance-rate-main" />
    <ShareModal :show="showShareModal" :kakao-busy="kakaoBusy" :summary-text="shareSummary" @close="closeShare" @share-kakao="shareKakao" @copy-link="copyLink" />
  </div>
</template>
