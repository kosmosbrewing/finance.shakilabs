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
import { normalizeBonusInput } from "@/lib/validators";
import { buildAbsoluteUrl, buildQuery, parseQueryInt } from "@/lib/routeState";
import { formatManWon, formatPercent, formatWon } from "@/lib/utils";
import { calculateBonusImpact } from "@/utils/scenarioCalculator";

const route = useRoute();
const annualSalary = ref(52_000_000);
const bonusAmount = ref(5_000_000);
const dependents = ref(1);
const children = ref(0);
const nonTaxableMonthly = ref(200_000);

watch(
  () => route.query,
  (query) => {
    const nextSalary = parseQueryInt(query.salary);
    const nextBonus = parseQueryInt(query.bonus);
    const nextDependents = parseQueryInt(query.dep);
    const nextChildren = parseQueryInt(query.child);
    const nextNonTaxable = parseQueryInt(query.nontax);
    if (nextSalary !== null) annualSalary.value = nextSalary;
    if (nextBonus !== null) bonusAmount.value = nextBonus;
    if (nextDependents !== null) dependents.value = nextDependents;
    if (nextChildren !== null) children.value = nextChildren;
    if (nextNonTaxable !== null) nonTaxableMonthly.value = nextNonTaxable;
  },
  { immediate: true }
);

const input = computed(() =>
  normalizeBonusInput({
    annualSalary: annualSalary.value,
    bonusAmount: bonusAmount.value,
    dependents: dependents.value,
    children: children.value,
    nonTaxableMonthly: nonTaxableMonthly.value,
  })
);
const result = computed(() => calculateBonusImpact(input.value));
const seoTitle = computed(() => "성과급 실수령 계산기 | 2026 finance.shakilabs");
const seoDescription = computed(
  () =>
    `연봉 ${formatManWon(input.value.annualSalary)}에서 성과급 ${formatWon(
      input.value.bonusAmount
    )} 지급 시 실제 손에 남는 금액은 ${formatWon(result.value.netBonus)}입니다.`
);

function buildShareState(): { path: string; query: Record<string, string> } {
  return {
    path: "/bonus",
    query: buildQuery({
      salary: input.value.annualSalary,
      bonus: input.value.bonusAmount !== 5_000_000 ? input.value.bonusAmount : null,
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
    getShareText: () => `성과급 ${formatWon(input.value.bonusAmount)} 실수령 ${formatWon(result.value.netBonus)}`,
    getShareSummary: () => `${formatWon(input.value.bonusAmount)} 지급 시 실수령 ${formatWon(result.value.netBonus)} · 실효 수령률 ${formatPercent(result.value.effectiveBonusRate, 1)}`,
    getDescription: () => seoDescription.value,
    getButtonTitle: () => "성과급 결과 보기",
  });

let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => result.value.netBonus,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      const state = buildShareState();
      const queryString = new URLSearchParams(state.query).toString();
      addEntry({
        type: "bonus",
        label: `성과급 ${formatWon(input.value.bonusAmount)}`,
        path: queryString ? `${state.path}?${queryString}` : state.path,
        summary: `실수령 ${formatWon(result.value.netBonus)}`,
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
              <h1 class="retro-title">성과급 실수령 계산기</h1>
              <p class="text-caption text-muted-foreground">보너스 공제 후 실제 입금액과 체감 수령률을 한 번에 확인합니다.</p>
            </div>
            <FreshBadge message="2026 세율 반영" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="space-y-4">
              <ScenarioField v-model="annualSalary" label="기본 연봉" unit="원" :min="12_000_000" :max="300_000_000" :step="100_000" format="currency" :presets="[{ label: '4,000만원', value: 40_000_000 }, { label: '5,200만원', value: 52_000_000 }, { label: '8,000만원', value: 80_000_000 }]" />
              <ScenarioField v-model="bonusAmount" label="성과급 금액" unit="원" :min="0" :max="20_000_000" :step="100_000" format="currency" :presets="[{ label: '200만원', value: 2_000_000 }, { label: '500만원', value: 5_000_000 }, { label: '1,000만원', value: 10_000_000 }]" />
              <ScenarioField v-model="dependents" label="부양가족 수" unit="명" :min="1" :max="6" :presets="[{ label: '1명', value: 1 }, { label: '2명', value: 2 }, { label: '4명', value: 4 }]" />
              <ScenarioField v-model="children" label="20세 이하 자녀" unit="명" :min="0" :max="4" :presets="[{ label: '0명', value: 0 }, { label: '1명', value: 1 }, { label: '2명', value: 2 }]" />
              <ScenarioField v-model="nonTaxableMonthly" label="비과세 월급" unit="원" :min="0" :max="1_000_000" :step="10_000" format="currency" :presets="[{ label: '0원', value: 0 }, { label: '20만원', value: 200_000 }, { label: '30만원', value: 300_000 }]" />
            </div>

            <div class="space-y-4">
              <div class="retro-stat-grid sm:grid-cols-2">
                <div class="retro-stat">
                  <p class="retro-stat-label">성과급 실수령</p>
                  <p class="retro-stat-value text-status-success">{{ formatWon(result.netBonus) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">실효 수령률</p>
                  <p class="retro-stat-value">{{ formatPercent(result.effectiveBonusRate, 1) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">성과급 반영 월 실수령</p>
                  <p class="retro-stat-value">{{ formatWon(result.withBonus.monthlyNet) }}</p>
                </div>
                <div class="retro-stat">
                  <p class="retro-stat-label">추가 공제 추정</p>
                  <p class="retro-stat-value text-status-danger">{{ formatWon(result.bonusTax) }}</p>
                </div>
              </div>

              <div class="retro-panel-muted retro-panel-content space-y-3">
                <p class="text-body font-semibold text-foreground">핵심 해석</p>
                <p class="text-caption leading-6 text-muted-foreground">
                  보너스 {{ formatWon(input.bonusAmount) }} 중 실제 손에 남는 금액은
                  <span class="font-semibold text-foreground">{{ formatWon(result.netBonus) }}</span>
                  입니다.
                </p>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p class="text-tiny uppercase tracking-wide text-muted-foreground">기본 월 실수령</p>
                    <p class="mt-1 text-body font-semibold">{{ formatWon(result.base.monthlyNet) }}</p>
                  </div>
                  <div>
                    <p class="text-tiny uppercase tracking-wide text-muted-foreground">보너스 반영 후</p>
                    <p class="mt-1 text-body font-semibold">{{ formatWon(result.withBonus.monthlyNet) }}</p>
                  </div>
                </div>
                <Button class="w-full" @click="openShare">결과 공유</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="bonus-main" @share-request="openShare" />
        <RecentCalcPanel />
      </div>
    </section>

    <ShareModal :show="showShareModal" :kakao-busy="kakaoBusy" :summary-text="shareSummary" @close="closeShare" @share-kakao="shareKakao" @copy-link="copyLink" />
  </div>
</template>
