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
import { weeklyHolidayPayFaqs } from "@/data/laborFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { formatWon } from "@/lib/utils";
import { calculateWeeklyHolidayPay } from "@/utils/laborCalculator";

const props = defineProps<{ initialHourlyWage?: number }>();

const hourlyWage = ref(props.initialHourlyWage ?? 10_320);
const workDaysPerWeek = ref(5);
const hoursPerDay = ref(8);

const result = computed(() =>
  calculateWeeklyHolidayPay({
    hourlyWage: hourlyWage.value,
    workDaysPerWeek: workDaysPerWeek.value,
    hoursPerDay: hoursPerDay.value,
  }),
);

const seoTitle = computed(() =>
  props.initialHourlyWage
    ? `시급 ${props.initialHourlyWage.toLocaleString()}원 주휴수당 계산 | 2026`
    : "2026 주휴수당 계산기 | 아르바이트 주휴수당·실질 시급",
);
const seoDescription = computed(() =>
  props.initialHourlyWage
    ? `시급 ${props.initialHourlyWage.toLocaleString()}원 기준 주휴수당과 실질 시급을 계산합니다.`
    : "시급과 주 근무시간을 입력하면 주휴수당, 실질 시급, 예상 월급을 계산합니다. 2026 최저시급 반영.",
);

const { showShareModal, kakaoBusy, shareSummary, openShare, closeShare, shareKakao, copyLink } =
  useShare(null, {
    getCalc: () => result.value,
    getShareUrl: () => buildAbsoluteUrl("/weekly-holiday-pay"),
    getShareText: () => `시급 ${formatWon(hourlyWage.value)} 주휴수당 ${formatWon(result.value.weeklyHolidayPay)}`,
    getShareSummary: () =>
      `시급 ${formatWon(hourlyWage.value)} · 주${workDaysPerWeek.value}일 ${hoursPerDay.value}시간 · 주휴수당 ${formatWon(result.value.weeklyHolidayPay)}`,
    getDescription: () => seoDescription.value,
    getButtonTitle: () => "주휴수당 계산하기",
  });

let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => result.value.weeklyHolidayPay,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      addEntry({
        type: "weekly-holiday-pay",
        label: `시급 ${formatWon(hourlyWage.value)} 주휴수당`,
        path: "/weekly-holiday-pay",
        summary: `주휴수당 ${formatWon(result.value.weeklyHolidayPay)} · 실질시급 ${formatWon(result.value.effectiveHourlyWage)}`,
      });
    }, 1200);
  },
  { immediate: true },
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(weeklyHolidayPayFaqs)" />

    <CalculatorPageHeader title="주휴수당 계산기" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <section class="retro-panel overflow-hidden" aria-labelledby="weekly-pay-input-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="weekly-pay-input-title" class="retro-title">근무 조건 입력</h2>
          </div>
          <div class="retro-panel-content space-y-5">
              <ScenarioField
                v-model="hourlyWage"
                label="시급"
                unit="원"
                :min="10_320"
                :max="100_000"
                :step="100"
                format="currency"
                :presets="[
                  { label: '최저 10,320', value: 10_320 },
                  { label: '12,000', value: 12_000 },
                  { label: '15,000', value: 15_000 },
                  { label: '20,000', value: 20_000 },
                ]"
              />
              <ScenarioField
                v-model="workDaysPerWeek"
                label="주 근무일수"
                unit="일"
                :min="1"
                :max="6"
                :presets="[
                  { label: '3일', value: 3 },
                  { label: '4일', value: 4 },
                  { label: '5일', value: 5 },
                  { label: '6일', value: 6 },
                ]"
              />
              <ScenarioField
                v-model="hoursPerDay"
                label="일 근무시간"
                unit="시간"
                :min="1"
                :max="12"
                :presets="[
                  { label: '4시간', value: 4 },
                  { label: '6시간', value: 6 },
                  { label: '8시간', value: 8 },
                ]"
              />
          </div>
        </section>

        <section class="retro-panel overflow-hidden" aria-labelledby="weekly-pay-result-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="weekly-pay-result-title" class="retro-title">주휴수당 예상 결과</h2>
          </div>
          <div class="retro-panel-content space-y-4">
            <BenefitStatGrid
              class="min-[360px]:!grid-cols-2"
              :items="[
                { label: '주휴수당', value: formatWon(result.weeklyHolidayPay), tone: result.isEligible ? 'success' : undefined },
                { label: '실질 시급', value: formatWon(result.effectiveHourlyWage), tone: result.isEligible ? 'success' : undefined },
                { label: '예상 월급', value: formatWon(result.estimatedMonthlyPay) },
                { label: '주 근무시간', value: `${result.weeklyHours}시간` },
              ]"
            />

            <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
              <p v-if="!result.isEligible" class="font-semibold text-status-danger">
                주 {{ result.weeklyHours }}시간 근무로 15시간 미만이므로 주휴수당이 발생하지 않습니다.
              </p>
              <template v-else>
                <p>
                  주휴수당 포함 시 월급은
                  <span class="font-semibold text-foreground tabular-nums">{{ formatWon(result.estimatedMonthlyPay) }}</span>이며,
                  미포함 대비 매월
                  <span class="font-semibold text-status-success tabular-nums">+{{ formatWon(result.monthlyDifference) }}</span>
                  차이가 납니다.
                </p>
                <p>주급(주휴수당 미포함): {{ formatWon(result.weeklyWage) }}</p>
              </template>
              <p>* 월급 = (주급 + 주휴수당) × 4.345주 기준 간이 계산입니다.</p>
              <Button class="w-full" @click="openShare">결과 공유</Button>
            </div>
          </div>
        </section>

        <BenefitFaqPanel :items="weeklyHolidayPayFaqs" />
        <InternalLink current="weekly-holiday-pay" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="weekly-holiday-pay-main" @share-request="openShare" />
        <RecentCalcPanel />
      </div>
    </section>

    <ShareModal :show="showShareModal" :kakao-busy="kakaoBusy" :summary-text="shareSummary" @close="closeShare" @share-kakao="shareKakao" @copy-link="copyLink" />
  </div>
</template>
