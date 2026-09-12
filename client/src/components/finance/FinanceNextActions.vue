<script setup lang="ts">
// 건보료(/insurance)·실수령액(/salary) 결과 아래의 "다음에 할 계산" 카드 3개.
//
// 왜 분기가 필요한가: 이 페이지가 사이트 트래픽의 대부분인데, 들어온 사람이 숫자 하나를 보고
// 나간다. 고정 3개는 "관련 링크"일 뿐이고, 지금 화면에 찍힌 결과와 이어지는 질문이어야 다음
// 계산으로 넘어간다. 분기 규칙과 문장은 scripts/next-calculators.mjs 한 벌에서 나온다 —
// 프리렌더가 같은 문장을 써야 크롤러와 독자가 같은 본문을 본다.
//
// 미리 계산 값은 화면에서만 붙인다. 엔진을 직접 호출해 채우고, 가정을 같은 줄에 적는다.
import { computed, watch } from "vue";
import { ArrowRight } from "lucide-vue-next";
import { RouterLink } from "vue-router";
import { ShSurface, ShText } from "@shakilabs/ui";
import { trackEvent } from "@/lib/analytics";
import { formatWon } from "@/lib/utils";
import { calculateRegionalHealth } from "@/utils/benefitCalculators";
import { normalizeRegionalHealthInput } from "@/lib/benefitValidators";
import {
  NEXT_CALCULATOR_CARDS,
  NEXT_CALCULATORS_HEADING,
  NEXT_CALCULATORS_INTRO,
  pickNextCalculators,
  type NextCalculatorKey,
} from "../../../scripts/next-calculators.mjs";

const props = defineProps<{
  mode: "salary" | "insurance";
  /** 보수월액(월 과세급여). 지역가입자·임의계속 미리 계산의 기준값. */
  taxableMonthly: number;
  monthlyNet: number;
  monthlyHealthInsurance: number;
  nonTaxableMonthly: number;
  dependents: number;
  healthInsuranceFee: number;
  annualGross: number;
}>();

const heading = NEXT_CALCULATORS_HEADING;
const intro = NEXT_CALCULATORS_INTRO;

const fromCalculator = computed(() => (props.mode === "salary" ? "salary" : "insurance"));

const keys = computed(() =>
  pickNextCalculators({
    mode: props.mode,
    healthInsuranceFee: props.healthInsuranceFee,
    annualGross: props.annualGross,
    dependents: props.dependents,
  }),
);

// 퇴사 시나리오: 근로소득이 끊긴 상태이므로 소득·재산·자동차를 0으로 두고 계산한다.
// 이 가정은 카드 문장에 그대로 적는다 — 적지 않으면 재산이 있는 사람에게 거짓이 된다.
const quitScenario = computed(() =>
  calculateRegionalHealth(
    normalizeRegionalHealthInput({
      monthlySalary: Math.max(0, Math.round(props.taxableMonthly)),
      financialIncome: 0,
      propertyTaxBase: 0,
      carTaxBase: 0,
    }),
  ),
);

type Preview = { value: string; assumption: string } | null;

function previewOf(key: NextCalculatorKey): Preview {
  switch (key) {
    case "regional-health":
      return {
        value: `퇴사 시 지역가입 보험료 약 ${formatWon(quitScenario.value.regionalMonthly)}`,
        assumption: "퇴사 후 근로소득·재산·자동차가 없다고 본 하한액이며, 재산이 있으면 올라갑니다.",
      };
    case "regional-health-voluntary":
      return {
        value: `임의계속가입 보험료 약 ${formatWon(quitScenario.value.voluntaryMonthly)}`,
        assumption: `보수월액 ${formatWon(props.taxableMonthly)}에 50% 경감을 적용한 값으로, 지금 내는 금액과 같습니다.`,
      };
    case "salary":
      return {
        value: `월 실수령 약 ${formatWon(props.monthlyNet)}`,
        assumption: `비과세 월 ${formatWon(props.nonTaxableMonthly)}·부양가족 ${props.dependents}명 기준입니다.`,
      };
    case "insurance":
      return {
        value: `건강보험료 본인부담 약 ${formatWon(props.monthlyHealthInsurance)}`,
        assumption: "장기요양보험료는 뺀 건강보험 본인부담분입니다.",
      };
    default:
      // 피부양자·종합소득세·연말정산은 이 화면에 없는 입력(가족 소득, 부수입, 카드 사용액)이
      // 있어야 답이 나온다. 없는 값을 추정해 적으면 그 자리에서 거짓말이 된다.
      return null;
  }
}

const actions = computed(() =>
  keys.value.map((key) => ({
    key,
    ...NEXT_CALCULATOR_CARDS[key],
    preview: previewOf(key),
  })),
);

watch(
  actions,
  (list) => {
    for (const item of list) {
      trackEvent("related_tool_impression", {
        app_id: "finance",
        from_tool: fromCalculator.value,
        to_tool: item.key,
        placement: "after_result",
      });
    }
  },
  { immediate: true },
);

// 성공 지표 "건보료 -> 다음 계산 이동률"의 분자. 분모는 같은 화면의 result_view.
function trackNextClick(key: NextCalculatorKey, route: string): void {
  trackEvent("next_calculator_click", {
    from: fromCalculator.value,
    to: route.replace(/^\//, ""),
    card_key: key,
    placement: "after_result",
  });
}
</script>

<template>
  <section data-next-calculators aria-labelledby="finance-next-actions-title">
    <ShText id="finance-next-actions-title" as="h2" variant="heading">
      {{ heading }}
    </ShText>
    <ShText variant="caption" tone="muted" class="mb-3 mt-1">{{ intro }}</ShText>
    <div class="grid gap-3 md:grid-cols-3">
      <RouterLink
        v-for="item in actions"
        :key="item.key"
        :to="item.route"
        class="no-underline"
        @click="trackNextClick(item.key, item.route)"
      >
        <ShSurface
          variant="outlined"
          padding="md"
          class="flex h-full flex-col transition-colors hover:border-primary"
        >
          <ShText as="h3" variant="heading">{{ item.title }}</ShText>
          <ShText variant="caption" tone="muted" class="mt-2">{{ item.question }}</ShText>
          <template v-if="item.preview">
            <p class="mt-3 text-body font-semibold tabular-nums text-primary">
              {{ item.preview.value }}
            </p>
            <ShText variant="caption" tone="muted" class="mt-1">
              {{ item.preview.assumption }}
            </ShText>
          </template>
          <span
            class="mt-auto pt-4 inline-flex items-center gap-1 text-caption font-semibold text-primary"
            aria-hidden="true"
          >
            계산하러 가기 <ArrowRight class="h-4 w-4" />
          </span>
        </ShSurface>
      </RouterLink>
    </div>
  </section>
</template>
