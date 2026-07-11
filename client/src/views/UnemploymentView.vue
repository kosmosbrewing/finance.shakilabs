<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ShButton,
  ShTable,
  ShTableBody,
  ShTableCell,
  ShTableHead,
  ShTableHeader,
  ShTableRow,
} from "@shakilabs/ui";
import SEOHead from "@/components/common/SEOHead.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import { unemploymentFaqs } from "@/data/benefitFaqs";
import { UNEMPLOYMENT_2026, type QuitReason } from "@/data/unemploymentTable";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { formatManWon, formatWon } from "@/lib/utils";
import { useUnemploymentCalc } from "@/composables/useUnemploymentCalc";

const props = defineProps<{ initialSalary?: number }>();

const monthlySalary = ref(props.initialSalary ?? 3_500_000);
const age = ref(35);
const insuranceYears = ref(3);
const quitReason = ref<QuitReason>("layoff");

function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const today = toDateInput(new Date());

const result = useUnemploymentCalc(
  computed(() => ({
    monthlySalary: monthlySalary.value,
    age: age.value,
    insuranceYears: insuranceYears.value,
    quitReason: quitReason.value,
    quitDate: today,
  })),
);

const salaryLabel = computed(() =>
  props.initialSalary ? formatManWon(props.initialSalary / 10000) : null,
);

const seoTitle = computed(() =>
  salaryLabel.value
    ? `월급 ${salaryLabel.value} 실업급여 계산기 | 2026 구직급여`
    : "2026 실업급여 계산기 | 구직급여 수급액·수급기간 계산",
);
const seoDescription = computed(() =>
  salaryLabel.value
    ? `월급 ${salaryLabel.value}원 기준 실업급여 일 수급액과 총 수급액을 계산합니다.`
    : "월급과 고용보험 가입기간을 입력하면 실업급여 일 수급액, 수급기간, 총 예상 수급액을 계산합니다.",
);

const quitReasonOptions = [
  { label: "권고사직", value: "layoff" as const },
  { label: "해고", value: "dismissal" as const },
  { label: "계약만료", value: "contract_end" as const },
  { label: "자발적 퇴사", value: "voluntary" as const },
];
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(unemploymentFaqs)" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <div class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <div class="space-y-1">
              <h1 class="retro-title">실업급여 계산기</h1>
              <p class="text-caption text-muted-foreground">월급과 고용보험 가입기간을 입력하면 구직급여 수급액과 수급기간을 계산합니다.</p>
            </div>
            <FreshBadge message="2026년 상한액 68,100원 반영" />
          </div>
          <div class="retro-panel-content grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="min-w-0 space-y-4">
              <ScenarioField
                v-model="monthlySalary"
                label="퇴직 전 월급 (세전)"
                unit="원"
                :min="1_000_000"
                :max="20_000_000"
                :step="100_000"
                format="currency"
                :presets="[
                  { label: '250만', value: 2_500_000 },
                  { label: '350만', value: 3_500_000 },
                  { label: '500만', value: 5_000_000 },
                ]"
              />
              <ScenarioField
                v-model="insuranceYears"
                label="고용보험 가입기간"
                unit="년"
                :min="0"
                :max="30"
                :presets="[
                  { label: '1년', value: 1 },
                  { label: '3년', value: 3 },
                  { label: '5년', value: 5 },
                  { label: '10년', value: 10 },
                ]"
              />
              <ScenarioField v-model="age" label="나이" unit="세" :min="20" :max="70" :presets="[{ label: '30세', value: 30 }, { label: '45세', value: 45 }, { label: '55세', value: 55 }]" />

              <div class="space-y-1.5">
                <label class="text-caption font-semibold text-foreground">퇴사 사유</label>
                <div class="flex flex-wrap gap-2">
                  <ShButton
                    v-for="opt in quitReasonOptions"
                    :key="opt.value"
                    :variant="quitReason === opt.value ? 'primary' : 'secondary'"
                    size="sm"
                    type="button"
                    @click="quitReason = opt.value"
                  >
                    {{ opt.label }}
                  </ShButton>
                </div>
              </div>
            </div>

            <div class="min-w-0 space-y-4">
              <BenefitStatGrid
                :items="[
                  { label: '일 수급액', value: formatWon(result.dailyBenefit), tone: result.isEligible ? 'success' : undefined },
                  { label: '수급 기간', value: result.isEligible ? `${result.durationDays}일` : '-' },
                  { label: '총 예상 수급액', value: formatWon(result.totalBenefit), tone: result.isEligible ? 'success' : undefined },
                  { label: '수급 종료일', value: result.endDateLabel },
                ]"
              />

              <div class="retro-panel-muted retro-panel-content space-y-3 text-caption leading-6 text-muted-foreground">
                <p v-if="!result.isEligible" class="font-semibold text-status-danger">
                  자발적 퇴사는 원칙적으로 실업급여 수급 대상이 아닙니다. 정당한 사유가 있으면 고용센터에 문의하세요.
                </p>
                <p>2026년 구직급여 일 상한액 {{ formatWon(UNEMPLOYMENT_2026.dailyMax) }}, 하한액 {{ formatWon(UNEMPLOYMENT_2026.dailyMin) }}이 적용됩니다.</p>
                <p>실제 수급액은 이직확인서 기준 평균임금과 고용센터 심사에 따라 달라질 수 있습니다.</p>
              </div>

              <!-- 수급기간 참고표 -->
              <div class="retro-panel-muted min-w-0 p-3">
                <p class="text-caption font-semibold text-foreground mb-2">수급기간 참고표 (일)</p>
                <ShTable
                  aria-label="고용보험 가입기간별 실업급여 수급기간"
                  density="compact"
                  min-width="13rem"
                >
                  <ShTableHeader>
                    <ShTableRow>
                      <ShTableHead>가입기간</ShTableHead>
                      <ShTableHead numeric>50세 미만</ShTableHead>
                      <ShTableHead numeric>50세 이상</ShTableHead>
                    </ShTableRow>
                  </ShTableHeader>
                  <ShTableBody>
                    <ShTableRow v-for="(_, bucket) in UNEMPLOYMENT_2026.durationTable.under50" :key="bucket">
                      <ShTableCell>
                          {{ bucket === 0 ? '1년 미만' : bucket === 1 ? '1~3년' : bucket === 3 ? '3~5년' : bucket === 5 ? '5~10년' : '10년 이상' }}
                      </ShTableCell>
                      <ShTableCell numeric>{{ UNEMPLOYMENT_2026.durationTable.under50[bucket] }}일</ShTableCell>
                      <ShTableCell numeric>{{ UNEMPLOYMENT_2026.durationTable.over50[bucket] }}일</ShTableCell>
                    </ShTableRow>
                  </ShTableBody>
                </ShTable>
              </div>
            </div>
          </div>
        </div>

        <BenefitFaqPanel :items="unemploymentFaqs" />
        <InternalLink current="unemployment" />
      </div>

      <div class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="unemployment-main" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
