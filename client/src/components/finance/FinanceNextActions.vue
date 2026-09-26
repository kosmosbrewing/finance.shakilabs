<script setup lang="ts">
// 건보료(/insurance)·실수령액(/salary) 결과 아래의 "이어서 계산하기" 카드 3개.
//
// 왜 분기가 필요한가: 이 페이지가 사이트 트래픽의 대부분인데, 들어온 사람이 숫자 하나를 보고
// 나간다. 고정 3개는 "관련 링크"일 뿐이고, 지금 화면에 찍힌 결과와 이어지는 질문이어야 다음
// 계산으로 넘어간다. 분기 규칙과 문장은 scripts/next-calculators.mjs 한 벌에서 나온다 —
// 프리렌더가 같은 문장을 써야 크롤러와 독자가 같은 본문을 본다.
//
// 카드는 패키지 ShNextActions가 그린다(제목 한 줄 + 값 + 짧은 조건). 여기서는 항목과 추적만 만든다.
// 미리 계산 값은 화면에서만 붙인다. 엔진을 직접 호출해 채우고, 그 값의 가정을 note에 적는다 —
// 값만 두면 약속처럼 읽힌다.
import { computed, watch } from "vue";
import { RouterLink } from "vue-router";
import { ShNextActions, type NextActionItem } from "@shakilabs/ui";
import { trackEvent } from "@/lib/analytics";
import { formatWon } from "@/lib/utils";
import { calculateRegionalHealth } from "@/utils/benefitCalculators";
import { normalizeRegionalHealthInput } from "@/lib/benefitValidators";
import {
  NEXT_CALCULATOR_CARDS,
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
// 이 가정은 note에 그대로 적는다 — 적지 않으면 재산이 있는 사람에게 거짓이 된다.
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

type Preview = { value: string; note: string } | null;

// note는 값의 조건·가정이다. "하한액"·"~ 기준" 같은 말을 빼면 값이 약속처럼 읽힌다.
function previewOf(key: NextCalculatorKey): Preview {
  switch (key) {
    case "regional-health":
      return {
        value: `약 ${formatWon(quitScenario.value.regionalMonthly)}`,
        note: "지역가입 · 재산·자동차 없을 때 하한액",
      };
    case "regional-health-voluntary":
      return {
        value: `약 ${formatWon(quitScenario.value.voluntaryMonthly)}`,
        note: `임의계속 · 보수월액 ${formatWon(props.taxableMonthly)}에 50% 경감`,
      };
    case "salary":
      return {
        value: `약 ${formatWon(props.monthlyNet)}`,
        note: `비과세 월 ${formatWon(props.nonTaxableMonthly)} · 부양가족 ${props.dependents}명 기준`,
      };
    case "insurance":
      return {
        value: `약 ${formatWon(props.monthlyHealthInsurance)}`,
        note: "건강보험 본인부담 · 장기요양보험료 제외",
      };
    default:
      // 피부양자·종합소득세·연말정산은 이 화면에 없는 입력(가족 소득, 부수입, 카드 사용액)이
      // 있어야 답이 나온다. 없는 값을 추정해 적으면 그 자리에서 거짓말이 된다.
      return null;
  }
}

const items = computed<NextActionItem[]>(() =>
  keys.value.map((key) => {
    const card = NEXT_CALCULATOR_CARDS[key];
    const preview = previewOf(key);
    return {
      key,
      title: card.title,
      to: card.route,
      value: preview?.value,
      note: preview?.note ?? card.note,
    };
  }),
);

watch(
  items,
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
function trackNextClick(item: NextActionItem): void {
  trackEvent("next_calculator_click", {
    from: fromCalculator.value,
    to: (item.to ?? "").replace(/^\//, ""),
    card_key: item.key,
    placement: "after_result",
  });
}
</script>

<template>
  <ShNextActions
    :items="items"
    :link-component="RouterLink"
    data-next-calculators
    @select="trackNextClick"
  />
</template>
