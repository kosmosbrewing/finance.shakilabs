<script setup lang="ts">
import { computed, ref, watch } from "vue";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import { Button } from "@/components/ui/button";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import { useShare } from "@/composables/useShare";
import { addEntry } from "@/composables/useRecentCalcs";
import { buildAbsoluteUrl } from "@/lib/routeState";
import { severancePayFaqs } from "@/data/laborFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { formatWon } from "@/lib/utils";
import { calculateSeverancePay } from "@/utils/laborCalculator";

const props = defineProps<{ initialYears?: number }>();

const averageMonthlySalary = ref(3_500_000);
const yearsOfService = ref(props.initialYears ?? 3);

const result = computed(() =>
  calculateSeverancePay({
    yearsOfService: yearsOfService.value,
    averageMonthlySalary: averageMonthlySalary.value,
  }),
);

const seoTitle = computed(() =>
  props.initialYears
    ? `${props.initialYears}년 근속 퇴직금 계산기 | 2026`
    : "2026 퇴직금 계산기 | 퇴직소득세·실수령 퇴직금",
);
const seoDescription = computed(() =>
  props.initialYears
    ? `${props.initialYears}년 근속 기준 퇴직금과 퇴직소득세를 계산합니다.`
    : "월급과 근속연수를 입력하면 퇴직금, 퇴직소득세, 실수령 퇴직금을 계산합니다.",
);

const { showShareModal, kakaoBusy, shareSummary, openShare, closeShare, shareKakao, copyLink } =
  useShare(null, {
    getCalc: () => result.value,
    getShareUrl: () => buildAbsoluteUrl("/severance-pay"),
    getShareText: () => `${yearsOfService.value}년 근속 퇴직금 ${formatWon(result.value.severancePay)}`,
    getShareSummary: () =>
      `월급 ${formatWon(averageMonthlySalary.value)} · ${yearsOfService.value}년 근속 · 퇴직금 ${formatWon(result.value.severancePay)} · 실수령 ${formatWon(result.value.netSeverancePay)}`,
    getDescription: () => seoDescription.value,
    getButtonTitle: () => "퇴직금 계산하기",
  });

let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => result.value.severancePay,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      addEntry({
        type: "severance-pay",
        label: `${yearsOfService.value}년 근속 퇴직금`,
        path: "/severance-pay",
        summary: `퇴직금 ${formatWon(result.value.severancePay)} · 실수령 ${formatWon(result.value.netSeverancePay)}`,
      });
    }, 1200);
  },
  { immediate: true },
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(severancePayFaqs)" />

    <CalculatorPageHeader
      title="2026 퇴직금 계산기"
      description="최근 3개월 평균 월급과 근속연수를 입력하면 퇴직금, 퇴직소득세, 실수령액을 계산합니다."
      freshness="2026 퇴직소득세 반영"
    />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <section class="retro-panel overflow-hidden" aria-labelledby="severance-input-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="severance-input-title" class="retro-title">퇴직 조건 입력</h2>
          </div>
          <div class="retro-panel-content space-y-5">
            <ScenarioField
              v-model="averageMonthlySalary"
              label="최근 3개월 평균 월급"
              unit="원"
              :min="1_000_000"
              :max="30_000_000"
              :step="100_000"
              format="currency"
              :presets="[
                { label: '250만', value: 2_500_000 },
                { label: '350만', value: 3_500_000 },
                { label: '500만', value: 5_000_000 },
                { label: '800만', value: 8_000_000 },
              ]"
            />
            <ScenarioField
              v-model="yearsOfService"
              label="근속연수"
              unit="년"
              :min="0"
              :max="40"
              :presets="[
                { label: '1년', value: 1 },
                { label: '3년', value: 3 },
                { label: '5년', value: 5 },
                { label: '10년', value: 10 },
                { label: '20년', value: 20 },
              ]"
            />
          </div>
        </section>

        <section class="retro-panel overflow-hidden" aria-labelledby="severance-result-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="severance-result-title" class="retro-title">퇴직금 예상 결과</h2>
          </div>
          <div class="retro-panel-content space-y-4">
            <BenefitStatGrid
              class="min-[360px]:!grid-cols-2"
              :items="[
                { label: '퇴직금', value: formatWon(result.severancePay), tone: result.isEligible ? 'success' : undefined },
                { label: '퇴직소득세', value: formatWon(result.severanceTax), tone: result.severanceTax > 0 ? 'danger' : undefined },
                { label: '실수령 퇴직금', value: formatWon(result.netSeverancePay), tone: result.isEligible ? 'success' : undefined },
                { label: '1일 평균임금', value: formatWon(result.dailyAvgWage) },
              ]"
            />

            <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
              <p v-if="!result.isEligible" class="font-semibold text-status-danger">
                근속기간 1년 미만은 퇴직금 수급 요건을 충족하지 않습니다.
              </p>
              <template v-else>
                <p>총 근속일수: {{ result.totalDays.toLocaleString() }}일</p>
                <p v-if="result.severanceTax > 0">
                  퇴직소득세 {{ formatWon(result.severanceTax) }} 공제 후
                  <span class="font-semibold text-foreground tabular-nums">{{ formatWon(result.netSeverancePay) }}</span>을 수령합니다.
                </p>
              </template>
              <Button class="w-full" @click="openShare">결과 공유</Button>
            </div>

            <div v-if="result.isEligible" class="retro-panel-muted p-3">
              <p class="mb-2 text-caption font-semibold text-foreground">근속연수별 퇴직금 비교</p>
              <div class="overflow-x-auto">
                <table aria-label="근속연수별 퇴직금 비교" class="w-full text-[11px] text-muted-foreground">
                  <thead>
                    <tr class="border-b border-border/40">
                      <th scope="col" class="py-1 text-left">근속연수</th>
                      <th scope="col" class="py-1 text-right">퇴직금</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in result.comparisonData"
                      :key="row.years"
                      class="border-b border-border/20"
                      :class="{ 'bg-primary/5 font-semibold': row.years === yearsOfService }"
                    >
                      <td class="py-1">{{ row.years }}년</td>
                      <td class="py-1 text-right tabular-nums">{{ formatWon(row.amount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <BenefitFaqPanel :items="severancePayFaqs" />
        <InternalLink current="severance-pay" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="severance-pay-main" @share-request="openShare" />
        <RecentCalcPanel />
      </div>
    </section>

    <ShareModal :show="showShareModal" :kakao-busy="kakaoBusy" :summary-text="shareSummary" @close="closeShare" @share-kakao="shareKakao" @copy-link="copyLink" />
  </div>
</template>
