<script setup lang="ts">
import { computed } from "vue";
import { ShPresetGroup, type PresetValue } from "@shakilabs/ui";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import { useParentalLeave } from "@/composables/useParentalLeave";
import {
  PARENTAL_LEAVE_FAQS,
  PARENTAL_LEAVE_SALARY_PRESETS,
  PARENTAL_LEAVE_TYPE_LABELS,
  type ParentalLeaveType,
} from "@/data/parentalLeave";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { formatPercent, formatWon } from "@/lib/utils";

const props = defineProps<{ initialWage?: number }>();

const calc = useParentalLeave(props.initialWage);
const r = calc.result;

const typeOptions: { value: ParentalLeaveType; label: string }[] = [
  { value: "general", label: PARENTAL_LEAVE_TYPE_LABELS.general },
  { value: "parent66", label: PARENTAL_LEAVE_TYPE_LABELS.parent66 },
  { value: "singleParent", label: PARENTAL_LEAVE_TYPE_LABELS.singleParent },
];

function updateLeaveType(value: PresetValue): void {
  if (value === "general" || value === "parent66" || value === "singleParent") {
    calc.leaveType.value = value;
  }
}

const seoTitle = computed(() =>
  props.initialWage
    ? `통상임금 ${Math.floor(props.initialWage / 10_000)}만원 육아휴직 급여 | 2026`
    : "2026 육아휴직 급여 계산기 | 6+6 부모육아휴직제 반영",
);
const seoDesc = computed(() =>
  `육아휴직 ${calc.months.value}개월 예상 총 급여는 ${formatWon(r.value.totalBenefit)}입니다.`,
);

const summaryItems = computed(() => [
  { label: "총 수령액", value: formatWon(r.value.totalBenefit), tone: "success" as const },
  { label: "월 평균 급여", value: formatWon(r.value.averageMonthly) },
  { label: "소득대체율", value: formatPercent(r.value.incomeReplacementRate, 1) },
  { label: "휴직 기간", value: `${calc.months.value}개월` },
]);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDesc" :json-ld="buildFaqJsonLd(PARENTAL_LEAVE_FAQS)" />

    <CalculatorPageHeader title="육아휴직 급여 계산기" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <section class="retro-panel overflow-hidden" aria-labelledby="parental-leave-input-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="parental-leave-input-title" class="retro-title">육아휴직 조건 입력</h2>
          </div>
          <div class="retro-panel-content space-y-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <ScenarioField v-model="calc.monthlyWage.value" label="통상임금 (월)" unit="원" :min="700_000" :max="10_000_000" :step="100_000" format="currency" :presets="PARENTAL_LEAVE_SALARY_PRESETS" />
              <ScenarioField v-model="calc.months.value" label="휴직 기간" unit="개월" :min="1" :max="12" :step="1" />
            </div>

            <div class="space-y-1">
              <p class="text-caption font-medium text-muted-foreground">적용 제도</p>
              <ShPresetGroup
                :model-value="calc.leaveType.value"
                :options="typeOptions"
                label="육아휴직 적용 제도"
                @update:model-value="updateLeaveType"
              />
            </div>
          </div>
        </section>

        <section class="retro-panel overflow-hidden" aria-labelledby="parental-leave-result-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="parental-leave-result-title" class="retro-title">육아휴직 예상 결과</h2>
          </div>
          <div class="retro-panel-content space-y-5">
            <BenefitStatGrid :items="summaryItems" class="min-[360px]:!grid-cols-2" />

            <div class="space-y-2">
              <h2 class="text-body font-semibold">월별 급여 상세</h2>
              <div class="overflow-x-auto rounded-xl border">
                <table aria-label="육아휴직 월별 급여 상세" class="w-max min-w-full whitespace-nowrap text-caption">
                  <thead>
                    <tr class="border-b bg-muted/50">
                      <th scope="col" class="px-3 py-2 text-left font-medium">월</th>
                      <th scope="col" class="px-3 py-2 text-right font-medium">지급률</th>
                      <th scope="col" class="px-3 py-2 text-right font-medium">상한</th>
                      <th scope="col" class="px-3 py-2 text-right font-medium">수령액</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="d in r.monthlyDetails"
                      :key="d.month"
                      class="border-b last:border-0"
                    >
                      <td class="px-3 py-2">{{ d.month }}개월</td>
                      <td class="px-3 py-2 text-right">{{ Math.round(d.rate * 100) }}%</td>
                      <td class="px-3 py-2 text-right text-muted-foreground">{{ formatWon(d.cap) }}</td>
                      <td class="px-3 py-2 text-right font-medium">{{ formatWon(d.benefit) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="border-t bg-muted/30">
                      <td class="px-3 py-2 font-semibold" colspan="3">합계</td>
                      <td class="px-3 py-2 text-right font-bold text-status-success">{{ formatWon(r.totalBenefit) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div class="retro-panel-muted retro-panel-content space-y-2 text-caption leading-6 text-muted-foreground">
              <p>6+6 부모육아휴직제는 자녀 출생 후 18개월 이내에 부모가 모두 휴직을 사용할 때 적용됩니다.</p>
              <p>실제 급여는 고용보험 가입기간, 지급 심사 결과에 따라 달라질 수 있습니다.</p>
            </div>
          </div>
        </section>

        <BenefitFaqPanel :items="PARENTAL_LEAVE_FAQS" />
        <InternalLink current="parental-leave" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="parental-leave" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
