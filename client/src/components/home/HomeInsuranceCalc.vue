<script setup lang="ts">
// 홈 첫 화면 계산기 (사용자 결정 2026-09-24, B안): 도구만 나열하던 인덱스 대신 가장 많이 쓰는
// 건보료 계산기를 첫 화면에 둔다. /insurance와 같은 입력·결과 컴포넌트, 같은 계산 엔진이라
// 같은 값을 넣으면 1원 단위까지 같은 금액이 나온다. 연봉 모드도 같은 자리에서 고를 수 있어
// 이 자리에 있던 연봉 퀵계산기(유입 상위 질의 "연봉 실수령액")의 역할도 그대로 이어받는다.
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { ShCalculatorSplit, ShToggleGroup } from "@shakilabs/ui";
import { ArrowRight } from "lucide-vue-next";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import InsuranceInput from "@/components/insurance/InsuranceInput.vue";
import InsuranceResult from "@/components/insurance/InsuranceResult.vue";
import { useInsuranceReverse } from "@/composables/useInsuranceReverse";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import {
  DEFAULT_INSURANCE_PRESET,
  INSURANCE_MODE_OPTIONS,
  type InsuranceCalcMode,
} from "@/data/insurancePresets";
import { buildQuery } from "@/lib/routeState";

const props = defineProps<{ heading: string; note: string }>();

const DEFAULT_ANNUAL_GROSS = 40_000_000;
const DEFAULT_NON_TAXABLE = 200_000;

const mode = ref<InsuranceCalcMode>("reverse");
const healthInsuranceFee = ref(DEFAULT_INSURANCE_PRESET);
const dependents = ref(1);
const childrenUnder20 = ref(0);
const nonTaxableMonthly = ref(DEFAULT_NON_TAXABLE);

const reverse = useInsuranceReverse({ healthInsuranceFee, dependents, childrenUnder20, nonTaxableMonthly });
const forwardCalc = useSalaryCalc({
  initialAnnualGross: DEFAULT_ANNUAL_GROSS,
  initialDependents: 1,
  initialChildrenUnder20: 0,
  initialNonTaxableMonthly: DEFAULT_NON_TAXABLE,
});

// 가족·비과세 입력은 두 모드가 공유한다 — /insurance(InsuranceView)와 같은 동기화
watch(
  [dependents, childrenUnder20, nonTaxableMonthly],
  ([nextDependents, nextChildren, nextNonTaxable]) => {
    forwardCalc.dependents.value = nextDependents;
    forwardCalc.childrenUnder20.value = nextChildren;
    forwardCalc.nonTaxableMonthly.value = nextNonTaxable;
  },
  { immediate: true },
);

const activeCalc = computed(() => (mode.value === "reverse" ? reverse.calc : forwardCalc));

// 상세 화면이 읽는 쿼리 키(health·gross·dep·child·nontax·retire)로 넘긴다. 기본값은 싣지 않는다 —
// 상세 화면이 곧바로 URL을 정리하며 깜빡이기 때문이다.
const detailRoute = computed(() => {
  const shared = {
    dep: dependents.value !== 1 ? dependents.value : null,
    child: childrenUnder20.value !== 0 ? childrenUnder20.value : null,
    nontax: nonTaxableMonthly.value !== DEFAULT_NON_TAXABLE ? nonTaxableMonthly.value : null,
  };
  if (mode.value === "reverse") {
    return {
      path: "/insurance",
      query: buildQuery({
        health: healthInsuranceFee.value !== DEFAULT_INSURANCE_PRESET ? healthInsuranceFee.value : null,
        ...shared,
      }),
    };
  }
  return {
    path: "/salary",
    query: buildQuery({
      gross: forwardCalc.annualGross.value !== DEFAULT_ANNUAL_GROSS ? forwardCalc.annualGross.value : null,
      retire: forwardCalc.retirementIncluded.value ? true : null,
      ...shared,
    }),
  };
});
</script>

<template>
  <!-- 입력·결과가 각자 패널이라 이 섹션은 패널로 감싸지 않는다(카드 안 카드 금지) -->
  <section class="space-y-3" aria-labelledby="home-quick-calc-title">
    <!-- 제목과 모드 전환을 한 줄에 — 계산기 위에 글줄이 겹겹이 쌓이지 않게 한다(좁으면 두 줄로 접힌다) -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <h2 id="home-quick-calc-title" class="text-heading font-bold text-foreground">{{ props.heading }}</h2>
      <ShToggleGroup v-model="mode" label="계산 방식" :options="INSURANCE_MODE_OPTIONS" />
    </div>

    <ShCalculatorSplit>
      <template #input>
        <CalculatorInteractionTracker>
          <InsuranceInput
            :mode="mode"
            v-model:health-insurance-fee="healthInsuranceFee"
            v-model:annual-gross="forwardCalc.annualGross.value"
            v-model:retirement-included="forwardCalc.retirementIncluded.value"
            v-model:dependents="dependents"
            v-model:children-under20="childrenUnder20"
            v-model:non-taxable-monthly="nonTaxableMonthly"
          />
        </CalculatorInteractionTracker>
      </template>

      <template #result>
        <InsuranceResult
          :mode="mode"
          :health-insurance-fee="healthInsuranceFee"
          :estimated-taxable-monthly="reverse.estimatedTaxableMonthly.value"
          :estimated-annual-gross="reverse.estimatedAnnualGross.value"
          :calc="activeCalc"
          :shareable="false"
          deduction-collapsed
        />
      </template>

      <!-- 결과 패널이 입력보다 훨씬 길어 비는 왼쪽 칸을 상세 링크·설명이 채운다 -->
      <template #below-input>
        <RouterLink :to="detailRoute" class="pill-link sh-pill">
          공제 내역·연봉 구간표까지 자세히 보기
          <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </RouterLink>

        <p class="break-keep text-caption leading-relaxed text-muted-foreground">{{ props.note }}</p>
      </template>
    </ShCalculatorSplit>
  </section>
</template>
