<script setup lang="ts">
import { computed, ref, watch } from "vue";
import SEOHead from "@/components/common/SEOHead.vue";


import InsuranceInput from "@/components/insurance/InsuranceInput.vue";
import InsuranceResult from "@/components/insurance/InsuranceResult.vue";
import InsuranceTable from "@/components/insurance/InsuranceTable.vue";

import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import CalcSourceBox from "@/components/salary/CalcSourceBox.vue";
import { useInsuranceReverse } from "@/composables/useInsuranceReverse";
import { useSalaryCalc } from "@/composables/useSalaryCalc";
import {
  DEFAULT_INSURANCE_PRESET,
  INSURANCE_PRESETS,
} from "@/data/insurancePresets";

import { formatManWon, formatWon, copyUsingExecCommand } from "@/lib/utils";
import { showAlert } from "@/composables/useAlert";
import { addEntry } from "@/composables/useRecentCalcs";

const props = defineProps<{
  initialHealthInsuranceFee?: number;
}>();

const mode = ref<"reverse" | "forward">("reverse");
const healthInsuranceFee = ref(DEFAULT_INSURANCE_PRESET);
const dependents = ref(1);
const childrenUnder20 = ref(0);
const nonTaxableMonthly = ref(200_000);

watch(
  () => props.initialHealthInsuranceFee,
  (next) => {
    if (typeof next === "number" && Number.isFinite(next) && next > 0) {
      healthInsuranceFee.value = Math.floor(next);
    }
  },
  { immediate: true }
);

const reverse = useInsuranceReverse({
  healthInsuranceFee,
  dependents,
  childrenUnder20,
  nonTaxableMonthly,
});

const forwardCalc = useSalaryCalc({
  initialAnnualGross: 40_000_000,
  initialDependents: 1,
  initialChildrenUnder20: 0,
  initialNonTaxableMonthly: 200_000,
});

watch(
  [dependents, childrenUnder20, nonTaxableMonthly],
  ([nextDependents, nextChildren, nextNonTaxable]) => {
    forwardCalc.dependents.value = nextDependents;
    forwardCalc.childrenUnder20.value = nextChildren;
    forwardCalc.nonTaxableMonthly.value = nextNonTaxable;
  },
  { immediate: true }
);

const activeCalc = computed(() =>
  mode.value === "reverse" ? reverse.calc : forwardCalc
);

const seoTitle = computed(() => {
  if (mode.value === "reverse") {
    return `건보료 ${formatWon(healthInsuranceFee.value)}면 연봉 얼마? | 2026 건보료로 연봉 추정 계산기`;
  }

  return `연봉 ${formatManWon(forwardCalc.annualGross.value)} 건보료 계산 | 2026 4대보험 계산기`;
});

const seoDescription = computed(() => {
  if (mode.value === "reverse") {
    return `월 건강보험료 ${formatWon(healthInsuranceFee.value)}를 입력하면 추정 연봉 ${formatManWon(reverse.estimatedAnnualGross.value)}과 월 실수령액을 계산합니다.`;
  }

  return `연봉 ${formatManWon(forwardCalc.annualGross.value)} 기준 월 건보료와 4대보험, 소득세, 실수령액을 계산합니다.`;
});

function getShareUrl(): string {
  const params = new URLSearchParams();
  if (mode.value === "reverse") {
    params.set("health", String(healthInsuranceFee.value));
  } else {
    params.set("gross", String(forwardCalc.annualGross.value));
  }
  if (dependents.value !== 1) params.set("dep", String(dependents.value));
  if (nonTaxableMonthly.value !== 200_000) params.set("nontax", String(nonTaxableMonthly.value));
  const qs = params.toString();
  return qs
    ? `${window.location.origin}/insurance?${qs}`
    : `${window.location.origin}/insurance`;
}

async function copyInsuranceLink(): Promise<void> {
  try {
    const link = getShareUrl();
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
    } else if (!copyUsingExecCommand(link)) {
      throw new Error("clipboard unavailable");
    }
    showAlert("링크를 복사했습니다");
  } catch {
    showAlert("링크 복사에 실패했습니다", { type: "error" });
  }
}

async function shareInsurance(): Promise<void> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: seoTitle.value,
        text: seoDescription.value,
        url: getShareUrl(),
      });
      return;
    } catch {
      // 사용자가 공유를 취소한 경우
    }
  }
  await copyInsuranceLink();
}

// 최근 계산 자동 저장 (2초 디바운스)
let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => activeCalc.value.monthlyNet.value,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      if (mode.value === "reverse") {
        addEntry({
          type: "insurance",
          label: `건보료 ${formatWon(healthInsuranceFee.value)}`,
          path: "/insurance",
          summary: `추정 연봉 ${formatManWon(reverse.estimatedAnnualGross.value)}`,
        });
      } else {
        if (forwardCalc.annualGross.value <= 0) return;
        addEntry({
          type: "insurance",
          label: `연봉 ${formatManWon(forwardCalc.annualGross.value)}`,
          path: "/insurance",
          summary: `월 실수령 ${formatWon(forwardCalc.monthlyNet.value)}`,
        });
      }
    }, 2000);
  }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" />

    <h1 class="text-h1 font-title">건보료로 연봉 추정 계산기</h1>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <div class="space-y-4">
          <InsuranceInput
            v-model:mode="mode"
            v-model:health-insurance-fee="healthInsuranceFee"
            v-model:annual-gross="forwardCalc.annualGross.value"
            v-model:dependents="dependents"
            v-model:children-under20="childrenUnder20"
            v-model:non-taxable-monthly="nonTaxableMonthly"
            :presets="INSURANCE_PRESETS"
          />

          <InsuranceResult
            :mode="mode"
            :health-insurance-fee="healthInsuranceFee"
            :estimated-taxable-monthly="reverse.estimatedTaxableMonthly.value"
            :estimated-annual-gross="reverse.estimatedAnnualGross.value"
            :calc="activeCalc"
          />
        </div>

        <button type="button" class="retro-button-subtle" @click="shareInsurance">공유</button>

        <AdSlot slot="110001" label="광고 · top" />

        <InsuranceTable />

        <AdSlot slot="110002" label="광고 · middle" />

        <CalcSourceBox />
        <InternalLink current="insurance" />

        <AdSlot slot="110003" label="광고 · bottom" />

      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar page-key="insurance-main" @share-request="shareInsurance" />
        <RecentCalcPanel />
      </div>
    </section>
  </div>
</template>
