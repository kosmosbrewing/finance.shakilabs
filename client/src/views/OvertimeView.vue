<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { Button } from "@/components/ui/button";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
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
const seoTitle = computed(() => "연장·야간·휴일수당 계산기 | 2026 finance.shakilabs");
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
  },
  { immediate: true }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <div class="space-y-1">
              <h1 class="retro-title">연장·야간·휴일수당 계산기</h1>
              <p class="text-caption text-muted-foreground [text-wrap:balance]">월급에 포함되지 않은 추가 수당 기준으로 세전·세후 차이를 계산합니다.</p>
            </div>
            <FreshBadge message="2026 세율 반영" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="space-y-4">
              <ScenarioField v-model="monthlySalary" label="월 기본급" unit="원" :min="2_000_000" :max="10_000_000" :step="10_000" format="currency" :presets="[{ label: '280만원', value: 2_800_000 }, { label: '320만원', value: 3_200_000 }, { label: '450만원', value: 4_500_000 }]" />
              <ScenarioField v-model="overtimeHours" label="연장근로 시간" unit="시간" :min="0" :max="60" :presets="[{ label: '8시간', value: 8 }, { label: '12시간', value: 12 }, { label: '20시간', value: 20 }]" />
              <ScenarioField v-model="nightHours" label="야간 가산 시간" unit="시간" :min="0" :max="40" :presets="[{ label: '0시간', value: 0 }, { label: '6시간', value: 6 }, { label: '12시간', value: 12 }]" />
              <ScenarioField v-model="holidayHours" label="휴일근로 시간" unit="시간" :min="0" :max="40" :presets="[{ label: '0시간', value: 0 }, { label: '8시간', value: 8 }, { label: '16시간', value: 16 }]" />
              <ScenarioField v-model="monthlyBaseHours" label="월 통상근로시간" unit="시간" description="기본값 209시간을 사용합니다." :min="180" :max="240" :presets="[{ label: '209시간', value: 209 }, { label: '226시간', value: 226 }]" />
            </div>

            <div class="space-y-4">
              <div class="retro-stat-grid sm:grid-cols-2">
                <div class="retro-stat">
                  <p class="retro-stat-label">추가 세전 수당</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.totalExtraGross) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">월 실수령 증가</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading text-status-success">+{{ formatWon(result.totalExtraNet) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">통상 시급</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.hourlyRate) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label"><span class="sm:hidden">수당 반영</span><span class="hidden sm:inline">추가 수당 반영 월급</span></p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.after.monthlyGross) }}</p>
                </div>
              </div>

              <div class="retro-panel-muted retro-panel-content space-y-3">
                <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <div>
                    <p class="text-tiny uppercase tracking-wide text-muted-foreground">연장</p>
                    <p class="mt-1 text-body font-semibold tabular-nums">{{ formatWon(result.overtimePay) }}</p>
                  </div>
                  <div>
                    <p class="text-tiny uppercase tracking-wide text-muted-foreground">야간 가산</p>
                    <p class="mt-1 text-body font-semibold tabular-nums">{{ formatWon(result.nightPay) }}</p>
                  </div>
                  <div>
                    <p class="text-tiny uppercase tracking-wide text-muted-foreground">휴일</p>
                    <p class="mt-1 text-body font-semibold tabular-nums">{{ formatWon(result.holidayPay) }}</p>
                  </div>
                </div>
                <p class="text-caption leading-6 text-muted-foreground">
                  기본 월 실수령 <span class="tabular-nums">{{ formatWon(result.before.monthlyNet) }}</span>에서
                  <span class="font-semibold text-foreground tabular-nums">{{ formatWon(result.after.monthlyNet) }}</span>
                  으로 올라갑니다.
                </p>
                <Button class="w-full" @click="openShare">결과 공유</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="overtime-main" @share-request="openShare" />
        <RecentCalcPanel />
      </div>
    </section>

    <ShareModal :show="showShareModal" :kakao-busy="kakaoBusy" :summary-text="shareSummary" @close="closeShare" @share-kakao="shareKakao" @copy-link="copyLink" />
  </div>
</template>
