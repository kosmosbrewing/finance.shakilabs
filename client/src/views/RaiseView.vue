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
const seoTitle = computed(() => "연봉 협상 인상률 실수령 계산기 | 2026 finance.shakilabs");
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
              <h1 class="retro-title">연봉 협상 인상률 실수령 계산기</h1>
              <p class="text-caption text-muted-foreground [text-wrap:balance]">세전 인상률보다 실제 체감 월급이 얼마나 늘어나는지 바로 계산합니다.</p>
            </div>
            <FreshBadge message="2026 세율 반영" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="space-y-4">
              <ScenarioField v-model="currentAnnual" label="현재 연봉" unit="원" :min="12_000_000" :max="300_000_000" :step="100_000" format="currency" :presets="[{ label: '4,000만원', value: 40_000_000 }, { label: '5,200만원', value: 52_000_000 }, { label: '7,000만원', value: 70_000_000 }]" />
              <ScenarioField v-model="raisePercent" label="인상률" unit="%" description="성과급 제외, 기본 연봉만 반영합니다." :min="0" :max="30" :step="0.5" format="decimal" :presets="[{ label: '3%', value: 3 }, { label: '5%', value: 5 }, { label: '8%', value: 8 }, { label: '10%', value: 10 }]" />
              <ScenarioField v-model="dependents" label="부양가족 수" unit="명" :min="1" :max="6" :presets="[{ label: '1명', value: 1 }, { label: '2명', value: 2 }, { label: '4명', value: 4 }]" />
              <ScenarioField v-model="children" label="20세 이하 자녀" unit="명" :min="0" :max="4" :presets="[{ label: '0명', value: 0 }, { label: '1명', value: 1 }, { label: '2명', value: 2 }]" />
              <ScenarioField v-model="nonTaxableMonthly" label="비과세 월급" unit="원" :min="0" :max="1_000_000" :step="10_000" format="currency" :presets="[{ label: '0원', value: 0 }, { label: '20만원', value: 200_000 }, { label: '30만원', value: 300_000 }]" />
            </div>

            <div class="space-y-4">
              <div class="retro-stat-grid sm:grid-cols-2">
                <div class="retro-stat">
                  <p class="retro-stat-label">현재 월 실수령</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.current.monthlyNet) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">협상 후 월 실수령</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading">{{ formatWon(result.next.monthlyNet) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">월 체감 증가</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading text-status-success">+{{ formatWon(result.monthlyNetDiff) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">연간 실수령 증가</p>
                  <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading text-status-success">+{{ formatWon(result.annualNetDiff) }}</p>
                </div>
              </div>

              <div class="retro-panel-muted retro-panel-content space-y-3">
                <p class="text-body font-semibold text-foreground">핵심 해석</p>
                <p class="text-caption leading-6 text-muted-foreground">
                  세전으로는 <span class="tabular-nums">{{ formatWon(result.raiseAmount) }}</span> 인상이지만, 월 실수령 증가는
                  <span class="font-semibold text-foreground tabular-nums">{{ formatWon(result.monthlyNetDiff) }}</span>
                  입니다.
                </p>
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div>
                    <p class="text-tiny uppercase tracking-wide text-muted-foreground">추가 보험료</p>
                    <p class="mt-1 text-body font-semibold tabular-nums">+{{ formatWon(result.insuranceDelta) }}/월</p>
                  </div>
                  <div>
                    <p class="text-tiny uppercase tracking-wide text-muted-foreground">추가 세금</p>
                    <p class="mt-1 text-body font-semibold tabular-nums">+{{ formatWon(result.taxDelta) }}/월</p>
                  </div>
                </div>
                <Button class="w-full" @click="openShare">결과 공유</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="raise-main" @share-request="openShare" />
        <RecentCalcPanel />
      </div>
    </section>

    <ShareModal :show="showShareModal" :kakao-busy="kakaoBusy" :summary-text="shareSummary" @close="closeShare" @share-kakao="shareKakao" @copy-link="copyLink" />
  </div>
</template>
