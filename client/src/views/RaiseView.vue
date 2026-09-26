<script setup lang="ts">
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ShCalculatorSplit } from "@shakilabs/ui";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import CalculatorFeedbackRow from "@/components/calculator/CalculatorFeedbackRow.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import RaiseResult from "@/components/raise/RaiseResult.vue";
import { useShare } from "@/composables/useShare";
import { addEntry } from "@/composables/useRecentCalcs";
import { normalizeRaiseInput } from "@/lib/validators";
import { buildAbsoluteUrl, buildQuery, parseQueryFloat, parseQueryInt } from "@/lib/routeState";
import { formatManWon, formatPercent, formatWon } from "@/lib/utils";
import { calculateRaiseImpact } from "@/utils/scenarioCalculator";

const route = useRoute();
const currentAnnual = ref(52_000_000);
const raisePercent = ref(8);
const dependents = ref(1);
const children = ref(0);
const nonTaxableMonthly = ref(200_000);

watch(
  () => route.query,
  (query) => {
    const nextCurrent = parseQueryInt(query.current);
    const nextRaise = parseQueryFloat(query.raise);
    const nextDependents = parseQueryInt(query.dep);
    const nextChildren = parseQueryInt(query.child);
    const nextNonTaxable = parseQueryInt(query.nontax);
    if (nextCurrent !== null) currentAnnual.value = nextCurrent;
    if (nextRaise !== null) raisePercent.value = nextRaise;
    if (nextDependents !== null) dependents.value = nextDependents;
    if (nextChildren !== null) children.value = nextChildren;
    if (nextNonTaxable !== null) nonTaxableMonthly.value = nextNonTaxable;
  },
  { immediate: true }
);

const input = computed(() =>
  normalizeRaiseInput({
    currentAnnual: currentAnnual.value,
    raisePercent: raisePercent.value,
    dependents: dependents.value,
    children: children.value,
    nonTaxableMonthly: nonTaxableMonthly.value,
  })
);
const result = computed(() => calculateRaiseImpact(input.value));
const seoTitle = computed(() => "2026 연봉 인상률 계산기 | 연봉 협상 실수령액 비교");
const seoDescription = computed(
  () =>
    `${formatManWon(input.value.currentAnnual)}에서 ${formatPercent(
      input.value.raisePercent / 100,
      1
    )} 인상 시 월 실수령 증가는 ${formatWon(result.value.monthlyNetDiff)}입니다.`
);

function buildShareState(): { path: string; query: Record<string, string> } {
  return {
    path: "/raise",
    query: buildQuery({
      current: input.value.currentAnnual,
      raise: input.value.raisePercent !== 8 ? input.value.raisePercent : null,
      dep: input.value.dependents !== 1 ? input.value.dependents : null,
      child: input.value.children !== 0 ? input.value.children : null,
      nontax: input.value.nonTaxableMonthly !== 200_000 ? input.value.nonTaxableMonthly : null,
    }),
  };
}

const { showShareModal, kakaoBusy, shareSummary, openShare, closeShare, shareKakao, copyLink } =
  useShare(null, {
    getCalc: () => result.value,
    getShareUrl: () => {
      const state = buildShareState();
      return buildAbsoluteUrl(state.path, state.query);
    },
    getShareText: () => `연봉 ${formatPercent(input.value.raisePercent / 100, 1)} 인상 시 월 실수령 +${formatWon(result.value.monthlyNetDiff)}`,
    getShareSummary: () => `${formatManWon(input.value.currentAnnual)} → ${formatManWon(input.value.currentAnnual + result.value.raiseAmount)} · 월 실수령 +${formatWon(result.value.monthlyNetDiff)}`,
    getDescription: () => seoDescription.value,
    getButtonTitle: () => "인상률 결과 보기",
  });

let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => result.value.monthlyNetDiff,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      const state = buildShareState();
      const queryString = new URLSearchParams(state.query).toString();
      addEntry({
        type: "raise",
        label: `연봉 ${formatPercent(input.value.raisePercent / 100, 1)} 인상`,
        path: queryString ? `${state.path}?${queryString}` : state.path,
        summary: `월 실수령 +${formatWon(result.value.monthlyNetDiff)}`,
      });
    }, 1200);
  }
);
</script>

<template>
  <div class="sh-container sh-container--tool space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" />

    <CalculatorPageHeader title="연봉 협상 인상률 실수령 계산기" />

    <!-- 퍼널 추적은 입력·결과 두 카드를 함께 감싼다 — 한 패널이던 때와 같은 범위라야 결과 공유 클릭까지
         이벤트가 그대로다(래퍼에 overflow를 걸면 결과 칸 sticky가 죽는다). -->
    <CalculatorInteractionTracker>
      <ShCalculatorSplit>
        <template #input>
          <section class="retro-panel overflow-hidden" aria-labelledby="raise-input-title">
            <div class="retro-titlebar rounded-t-2xl">
              <h2 id="raise-input-title" class="retro-title">연봉 조건 입력</h2>
            </div>
            <div class="retro-panel-content space-y-4">
              <ScenarioField v-model="currentAnnual" label="현재 연봉" unit="원" :min="12_000_000" :max="300_000_000" :step="100_000" format="currency" :presets="[{ label: '4,000만원', value: 40_000_000 }, { label: '5,200만원', value: 52_000_000 }, { label: '7,000만원', value: 70_000_000 }]" />
              <ScenarioField v-model="raisePercent" label="인상률" unit="%" description="성과급 제외, 기본 연봉만 반영합니다." :min="0" :max="30" :step="0.5" format="decimal" :presets="[{ label: '3%', value: 3 }, { label: '5%', value: 5 }, { label: '8%', value: 8 }, { label: '10%', value: 10 }]" />
              <ScenarioField v-model="dependents" label="부양가족 수" unit="명" :min="1" :max="6" :presets="[{ label: '1명', value: 1 }, { label: '2명', value: 2 }, { label: '4명', value: 4 }]" />
              <ScenarioField v-model="children" label="20세 이하 자녀" unit="명" :min="0" :max="4" :presets="[{ label: '0명', value: 0 }, { label: '1명', value: 1 }, { label: '2명', value: 2 }]" />
              <ScenarioField v-model="nonTaxableMonthly" label="비과세 월급" unit="원" :min="0" :max="1_000_000" :step="10_000" format="currency" :presets="[{ label: '0원', value: 0 }, { label: '20만원', value: 200_000 }, { label: '30만원', value: 300_000 }]" />
            </div>
          </section>
        </template>
        <template #result>
          <RaiseResult :result="result" @share-request="openShare" />
        </template>
      </ShCalculatorSplit>
    </CalculatorInteractionTracker>
    <InternalLink current="raise" />

    <CalculatorFeedbackRow page-key="raise-main" />

    <ShareModal :show="showShareModal" :kakao-busy="kakaoBusy" :summary-text="shareSummary" @close="closeShare" @share-kakao="shareKakao" @copy-link="copyLink" />
  </div>
</template>
