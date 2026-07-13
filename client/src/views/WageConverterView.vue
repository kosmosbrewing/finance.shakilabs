<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ShPresetGroup, type PresetValue } from "@shakilabs/ui";
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
import { wageConverterFaqs } from "@/data/laborFaqs";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { formatWon } from "@/lib/utils";
import { calculateWageConversion, type WageConverterInput } from "@/utils/laborCalculator";

const props = defineProps<{ initialHourlyWage?: number }>();
const base = ref<WageConverterInput["base"]>("hourly");
const amount = ref(props.initialHourlyWage ?? 10_320);
const weeklyWorkHours = ref(40);
const includeWeeklyHoliday = ref(true);
const result = computed(() =>
  calculateWageConversion({
    base: base.value, amount: amount.value,
    weeklyWorkHours: weeklyWorkHours.value,
    includeWeeklyHoliday: includeWeeklyHoliday.value,
  }),
);
const baseOptions = [{ label: "시급", value: "hourly" as const }, { label: "월급", value: "monthly" as const }, { label: "연봉", value: "annual" as const }];
function onBaseChange(newBase: WageConverterInput["base"]) {
  base.value = newBase;
  if (newBase === "hourly") amount.value = 10_320;
  else if (newBase === "monthly") amount.value = 3_000_000;
  else amount.value = 36_000_000;
}

function updateBasePreset(value: PresetValue): void {
  if (value === "hourly" || value === "monthly" || value === "annual") onBaseChange(value);
}

function updateWeeklyHolidayPreset(value: PresetValue): void {
  if (typeof value === "boolean") includeWeeklyHoliday.value = value;
}

const seoTitle = computed(() =>
  props.initialHourlyWage
    ? `시급 ${props.initialHourlyWage.toLocaleString()}원 월급·연봉 환산 | 2026`
    : "2026 시급 월급 연봉 환산기 | 주휴수당 포함·미포함",
);
const seoDescription = computed(() =>
  props.initialHourlyWage
    ? `시급 ${props.initialHourlyWage.toLocaleString()}원을 월급·일급·연봉으로 환산합니다.`
    : "시급↔월급↔연봉을 주휴수당 포함·미포함으로 양방향 환산합니다. 2026 최저시급 반영.",
);

const baseLabel = computed(() => (base.value === "hourly" ? "시급" : base.value === "monthly" ? "월급" : "연봉"));

const { showShareModal, kakaoBusy, shareSummary, openShare, closeShare, shareKakao, copyLink } =
  useShare(null, {
    getCalc: () => result.value,
    getShareUrl: () => buildAbsoluteUrl("/wage-converter"),
    getShareText: () => `${baseLabel.value} ${formatWon(amount.value)} → 월급 ${formatWon(result.value.monthly)}`,
    getShareSummary: () =>
      `${baseLabel.value} ${formatWon(amount.value)} · 주${weeklyWorkHours.value}시간 · 월급 ${formatWon(result.value.monthly)} · 연봉 ${formatWon(result.value.annual)}`,
    getDescription: () => seoDescription.value,
    getButtonTitle: () => "시급↔월급↔연봉 환산하기",
  });

let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => result.value.monthly,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      addEntry({
        type: "wage-converter",
        label: `${baseLabel.value} ${formatWon(amount.value)} 환산`,
        path: "/wage-converter",
        summary: `시급 ${formatWon(result.value.hourly)} · 월급 ${formatWon(result.value.monthly)} · 연봉 ${formatWon(result.value.annual)}`,
      });
    }, 1200);
  },
  { immediate: true },
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(wageConverterFaqs)" />

    <CalculatorPageHeader title="시급·월급·연봉 환산기" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <section class="retro-panel overflow-hidden" aria-labelledby="wage-converter-input-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="wage-converter-input-title" class="retro-title">환산 조건 입력</h2>
          </div>
          <div class="retro-panel-content space-y-5">
            <div class="space-y-1.5">
              <label class="text-caption font-semibold text-foreground">입력 기준</label>
              <ShPresetGroup
                :model-value="base"
                :options="baseOptions"
                label="입력 기준 선택"
                @update:model-value="updateBasePreset"
              />
            </div>

            <ScenarioField
              v-model="amount"
              :label="base === 'hourly' ? '시급' : base === 'monthly' ? '월급' : '연봉'"
              unit="원"
              :min="base === 'hourly' ? 1_000 : base === 'monthly' ? 500_000 : 10_000_000"
              :max="base === 'hourly' ? 200_000 : base === 'monthly' ? 50_000_000 : 600_000_000"
              :step="base === 'hourly' ? 100 : base === 'monthly' ? 100_000 : 1_000_000"
              format="currency"
              :presets="
                base === 'hourly'
                  ? [{ label: '최저 10,320', value: 10_320 }, { label: '15,000', value: 15_000 }, { label: '20,000', value: 20_000 }]
                  : base === 'monthly'
                    ? [{ label: '250만', value: 2_500_000 }, { label: '300만', value: 3_000_000 }, { label: '400만', value: 4_000_000 }]
                    : [{ label: '3000만', value: 30_000_000 }, { label: '3600만', value: 36_000_000 }, { label: '5000만', value: 50_000_000 }]
              "
            />

            <ScenarioField v-model="weeklyWorkHours" label="주 근무시간" unit="시간" :min="15" :max="52" :presets="[{ label: '20시간', value: 20 }, { label: '35시간', value: 35 }, { label: '40시간', value: 40 }]" />

            <div class="space-y-1.5">
              <label class="text-caption font-semibold text-foreground">주휴수당 포함</label>
              <ShPresetGroup
                :model-value="includeWeeklyHoliday"
                :options="[{ label: '포함', value: true }, { label: '미포함', value: false }]"
                label="주휴수당 포함 여부"
                @update:model-value="updateWeeklyHolidayPreset"
              />
            </div>
          </div>
        </section>

        <section class="retro-panel overflow-hidden" aria-labelledby="wage-converter-result-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="wage-converter-result-title" class="retro-title">임금 환산 결과</h2>
          </div>
          <div class="retro-panel-content space-y-4">
            <BenefitStatGrid
              class="min-[360px]:!grid-cols-2"
              :items="[
                { label: '시급', value: formatWon(result.hourly), tone: base === 'hourly' ? undefined : 'success' },
                { label: '일급 (8시간)', value: formatWon(result.daily) },
                { label: '월급', value: formatWon(result.monthly), tone: base === 'monthly' ? undefined : 'success' },
                { label: '연봉', value: formatWon(result.annual), tone: base === 'annual' ? undefined : 'success' },
              ]"
            />

            <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
              <p>
                유효 주 시간: <span class="font-semibold text-foreground">{{ result.effectiveWeeklyHours }}시간</span>
                <span v-if="includeWeeklyHoliday"> (근무 {{ weeklyWorkHours }} + 주휴 8)</span>
              </p>
              <p>월 환산 시간: <span class="font-semibold text-foreground">{{ result.monthlyHours }}시간</span></p>
              <p>* 1개월 = 4.345주 (365 ÷ 12 ÷ 7) 기준 간이 계산입니다.</p>
              <Button class="w-full" @click="openShare">결과 공유</Button>
            </div>
          </div>
        </section>

        <BenefitFaqPanel :items="wageConverterFaqs" />
        <InternalLink current="wage-converter" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="wage-converter-main" @share-request="openShare" />
        <RecentCalcPanel />
      </div>
    </section>

    <ShareModal :show="showShareModal" :kakao-busy="kakaoBusy" :summary-text="shareSummary" @close="closeShare" @share-kakao="shareKakao" @copy-link="copyLink" />
  </div>
</template>
