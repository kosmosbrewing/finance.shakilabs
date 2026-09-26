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
import OvertimeResult from "@/components/overtime/OvertimeResult.vue";
import { useShare } from "@/composables/useShare";
import { addEntry } from "@/composables/useRecentCalcs";
import { normalizeOvertimeInput } from "@/lib/validators";
import { buildAbsoluteUrl, buildQuery, parseQueryInt } from "@/lib/routeState";
import { formatWon } from "@/lib/utils";
import { calculateOvertimeImpact } from "@/utils/scenarioCalculator";
const route = useRoute();
const monthlySalary = ref(3_200_000);
const overtimeHours = ref(12);
const nightHours = ref(6);
const holidayHours = ref(8);
const monthlyBaseHours = ref(209);
const dependents = ref(1);
const children = ref(0);
const nonTaxableMonthly = ref(200_000);
watch(
  () => route.query,
  (query) => {
    const nextSalary = parseQueryInt(query.salary);
    const nextOvertime = parseQueryInt(query.ot);
    const nextNight = parseQueryInt(query.night);
    const nextHoliday = parseQueryInt(query.holiday);
    const nextBase = parseQueryInt(query.base);
    const nextDependents = parseQueryInt(query.dep);
    const nextChildren = parseQueryInt(query.child);
    const nextNonTaxable = parseQueryInt(query.nontax);
    if (nextSalary !== null) monthlySalary.value = nextSalary;
    if (nextOvertime !== null) overtimeHours.value = nextOvertime;
    if (nextNight !== null) nightHours.value = nextNight;
    if (nextHoliday !== null) holidayHours.value = nextHoliday;
    if (nextBase !== null) monthlyBaseHours.value = nextBase;
    if (nextDependents !== null) dependents.value = nextDependents;
    if (nextChildren !== null) children.value = nextChildren;
    if (nextNonTaxable !== null) nonTaxableMonthly.value = nextNonTaxable;
  },
  { immediate: true }
);

const input = computed(() =>
  normalizeOvertimeInput({
    monthlySalary: monthlySalary.value,
    overtimeHours: overtimeHours.value,
    nightHours: nightHours.value,
    holidayHours: holidayHours.value,
    monthlyBaseHours: monthlyBaseHours.value,
    dependents: dependents.value,
    children: children.value,
    nonTaxableMonthly: nonTaxableMonthly.value,
  })
);
const result = computed(() => calculateOvertimeImpact(input.value));
const seoTitle = computed(() => "2026 연장·야간·휴일수당 계산기 | 초과근무 수당 계산");
const seoDescription = computed(
  () =>
    `추가 수당 총액 ${formatWon(result.value.totalExtraGross)} 중 월 실수령 증가는 ${formatWon(
      result.value.totalExtraNet
    )}입니다.`
);

function buildShareState(): { path: string; query: Record<string, string> } {
  return {
    path: "/overtime",
    query: buildQuery({
      salary: input.value.monthlySalary,
      ot: input.value.overtimeHours !== 12 ? input.value.overtimeHours : null,
      night: input.value.nightHours !== 6 ? input.value.nightHours : null,
      holiday: input.value.holidayHours !== 8 ? input.value.holidayHours : null,
      base: input.value.monthlyBaseHours !== 209 ? input.value.monthlyBaseHours : null,
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
    getShareText: () => `추가 수당 월 실수령 +${formatWon(result.value.totalExtraNet)}`,
    getShareSummary: () => `연장 ${input.value.overtimeHours}h · 야간 ${input.value.nightHours}h · 휴일 ${input.value.holidayHours}h · 월 실수령 +${formatWon(result.value.totalExtraNet)}`,
    getDescription: () => seoDescription.value,
    getButtonTitle: () => "수당 결과 보기",
  });

let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => result.value.totalExtraNet,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      const state = buildShareState();
      const queryString = new URLSearchParams(state.query).toString();
      addEntry({
        type: "overtime",
        label: `추가 수당 ${formatWon(result.value.totalExtraGross)}`,
        path: queryString ? `${state.path}?${queryString}` : state.path,
        summary: `월 실수령 +${formatWon(result.value.totalExtraNet)}`,
      });
    }, 1200);
  }
);
</script>
<template>
  <div class="sh-container sh-container--tool space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" />

    <CalculatorPageHeader title="연장·야간·휴일수당 계산기" />

    <!-- 퍼널 추적은 입력·결과 두 카드를 함께 감싼다 — 한 패널이던 때와 같은 범위라야 결과 공유 클릭까지
         이벤트가 그대로다. 입력이 결과보다 길어 결과 칸은 ShCalculatorSplit이 스스로 붙인다(래퍼에 overflow 금지). -->
    <CalculatorInteractionTracker>
      <ShCalculatorSplit>
        <template #input>
          <section class="retro-panel overflow-hidden" aria-labelledby="overtime-input-title">
            <div class="retro-titlebar rounded-t-2xl">
              <h2 id="overtime-input-title" class="retro-title">근무 조건 입력</h2>
            </div>
            <div class="retro-panel-content space-y-4">
              <ScenarioField v-model="monthlySalary" label="월 기본급" unit="원" :min="2_000_000" :max="10_000_000" :step="10_000" format="currency" :presets="[{ label: '280만원', value: 2_800_000 }, { label: '320만원', value: 3_200_000 }, { label: '450만원', value: 4_500_000 }]" />
              <ScenarioField v-model="overtimeHours" label="연장근로 시간" unit="시간" :min="0" :max="60" :presets="[{ label: '8시간', value: 8 }, { label: '12시간', value: 12 }, { label: '20시간', value: 20 }]" />
              <ScenarioField v-model="nightHours" label="야간 가산 시간" unit="시간" :min="0" :max="40" :presets="[{ label: '0시간', value: 0 }, { label: '6시간', value: 6 }, { label: '12시간', value: 12 }]" />
              <ScenarioField v-model="holidayHours" label="휴일근로 시간" unit="시간" :min="0" :max="40" :presets="[{ label: '0시간', value: 0 }, { label: '8시간', value: 8 }, { label: '16시간', value: 16 }]" />
              <ScenarioField v-model="monthlyBaseHours" label="월 통상근로시간" unit="시간" description="기본값 209시간을 사용합니다." :min="180" :max="240" :presets="[{ label: '209시간', value: 209 }, { label: '226시간', value: 226 }]" />
            </div>
          </section>
        </template>
        <template #result>
          <OvertimeResult :result="result" @share-request="openShare" />
        </template>
      </ShCalculatorSplit>
    </CalculatorInteractionTracker>
    <InternalLink current="overtime" />

    <CalculatorFeedbackRow page-key="overtime-main" />

    <ShareModal :show="showShareModal" :kakao-busy="kakaoBusy" :summary-text="shareSummary" @close="closeShare" @share-kakao="shareKakao" @copy-link="copyLink" />
  </div>
</template>
