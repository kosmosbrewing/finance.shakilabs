<script setup lang="ts">
import { computed, ref } from "vue";
import { ShButton } from "@shakilabs/ui";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import ScenarioField from "@/components/scenario/ScenarioField.vue";
import BenefitFaqPanel from "@/components/benefits/BenefitFaqPanel.vue";
import BenefitStatGrid from "@/components/benefits/BenefitStatGrid.vue";
import ResultHero from "@/components/common/ResultHero.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import { unpaidWageFaqs } from "@/data/benefitFaqs";
import {
  UNPAID_WAGE_2026,
  UNPAID_WAGE_STAGE_OPTIONS,
  type UnpaidWageStage,
} from "@/data/unpaidWage";
import { buildFaqJsonLd } from "@/lib/faqSeo";
import { formatManWon, formatWon } from "@/lib/utils";
import { useUnpaidWageCalc } from "@/composables/useUnpaidWageCalc";

const props = defineProps<{ initialAmount?: number }>();

const unpaidAmount = ref(props.initialAmount ?? 3_000_000);
const overdueDays = ref(90);
const stage = ref<UnpaidWageStage>("retired");

const result = useUnpaidWageCalc(
  computed(() => ({
    unpaidAmount: unpaidAmount.value,
    overdueDays: overdueDays.value,
    stage: stage.value,
  })),
);

const amountLabel = computed(() =>
  props.initialAmount ? formatManWon(props.initialAmount / 10000) : null,
);

const seoTitle = computed(() =>
  amountLabel.value
    ? `체불임금 ${amountLabel.value} 지연이자 계산기 | 연 20% 기준`
    : "임금체불 지연이자 계산기 | 퇴직 후 연 20%·재직 5~6%",
);
const seoDescription = computed(() =>
  amountLabel.value
    ? `밀린 임금 ${amountLabel.value}원의 지연이자를 퇴직 후 연 20%, 민법 5%, 상법 6%, 소송촉진법 12% 단계별로 계산합니다.`
    : "밀린 월급·퇴직금의 지연이자를 계산합니다. 퇴직 후 14일이 지나면 근로기준법상 연 20% 이자가 붙습니다.",
);

const selectedStageNote = computed(
  () => UNPAID_WAGE_STAGE_OPTIONS.find((opt) => opt.value === stage.value)?.note ?? "",
);

// The interest amount is promoted to the ResultHero above the grid.
const statItems = computed(() => [
  {
    label: "적용 연이율",
    value: `${(result.value.annualRate * 100).toFixed(0)}%`,
  },
  {
    label: "이자 발생일수",
    value: `${result.value.effectiveDays}일`,
  },
  {
    label: "원금+이자 합계",
    value: formatWon(result.value.totalWithPrincipal),
  },
]);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="buildFaqJsonLd(unpaidWageFaqs)" />

    <CalculatorPageHeader title="임금체불 지연이자 계산기" />

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4">
        <section class="retro-panel overflow-hidden" aria-labelledby="unpaid-wage-input-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="unpaid-wage-input-title" class="retro-title">체불 조건 입력</h2>
          </div>
          <div class="retro-panel-content min-w-0 space-y-5">
            <CalculatorInteractionTracker
              calculator-id="unpaid_wage_interest"
              page-path="/finance/unpaid-wage"
            >
              <div class="space-y-5">
                <ScenarioField
                  v-model="unpaidAmount"
                  label="못 받은 임금·퇴직금 합계"
                  unit="원"
                  :min="0"
                  :max="100_000_000"
                  :step="100_000"
                  format="currency"
                  :presets="[
                    { label: '300만', value: 3_000_000 },
                    { label: '500만', value: 5_000_000 },
                    { label: '1,000만', value: 10_000_000 },
                  ]"
                />
                <ScenarioField
                  v-model="overdueDays"
                  label="지연 일수 (퇴직 단계는 퇴직일부터 경과일)"
                  unit="일"
                  :min="0"
                  :max="1095"
                  :presets="[
                    { label: '30일', value: 30 },
                    { label: '90일', value: 90 },
                    { label: '180일', value: 180 },
                  ]"
                />
                <div class="space-y-1.5">
                  <label class="text-caption font-semibold text-foreground">적용 단계 선택</label>
                  <div class="flex flex-wrap gap-2">
                    <ShButton
                      v-for="opt in UNPAID_WAGE_STAGE_OPTIONS"
                      :key="opt.value"
                      :variant="stage === opt.value ? 'primary' : 'secondary'"
                      size="sm"
                      @click="stage = opt.value"
                    >
                      {{ opt.label }}
                    </ShButton>
                  </div>
                  <p class="text-caption leading-relaxed text-muted-foreground">{{ selectedStageNote }}</p>
                </div>
              </div>
            </CalculatorInteractionTracker>
          </div>
        </section>

        <ResultHero label="예상 지연이자" :value="formatWon(result.totalInterest)" />
        <BenefitStatGrid :items="statItems" />

        <section class="retro-panel overflow-hidden">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 class="retro-title">적용 순서와 계산 한계</h2>
          </div>
          <div class="retro-panel-content space-y-2 text-caption leading-relaxed text-muted-foreground">
            <p><strong class="text-foreground">계산식:</strong> 체불액 × 연이율 × 이자 발생일수 ÷ 365</p>
            <p><strong class="text-foreground">연 20% 대상:</strong> 근로기준법 제37조에 따라 퇴직·사망 근로자의 임금과 퇴직금에 적용됩니다. 퇴직일부터 {{ UNPAID_WAGE_2026.retiredGraceDays }}일(금품청산 기한)이 지난 다음 날부터 이자가 붙습니다.</p>
            <p><strong class="text-foreground">재직 중 체불:</strong> 연 20%가 아니라 민법상 5% 또는 회사(상인)를 상대로 한 상법상 6%가 적용되는 것이 일반적이며, 소송에서는 소장 송달 다음 날부터 소송촉진법상 12%를 검토합니다.</p>
            <p><strong class="text-foreground">미지원:</strong> 도산·회생 등 지연이자 적용 제외 사유(시행령 제18조), 일부 변제 충당 순서, 판결 주문별 이율 변경은 계산하지 않습니다.</p>
            <p><strong class="text-foreground">신고·구제:</strong> 고용노동부 노동포털 임금체불 진정, 회사가 지급 능력이 없으면 간이대지급금 제도를 함께 확인하세요.</p>
          </div>
        </section>

        <InternalLink current="unpaid-wage" />
        <BenefitFaqPanel :items="unpaidWageFaqs" />
      </div>

      <div class="space-y-4">
        <RecentCalcPanel />
        <CommunitySidebar page-key="unpaid-wage-main" />
      </div>
    </section>
  </div>
</template>
