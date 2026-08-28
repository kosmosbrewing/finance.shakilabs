<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { ShPresetGroup, ShSlider } from "@shakilabs/ui";
import { ArrowRight } from "lucide-vue-next";
import {
  clampHomeAnnualGross,
  HOME_QUICK_CALC_DEFAULTS,
  HOME_QUICK_CALC_MAX_GROSS,
  HOME_QUICK_CALC_MIN_GROSS,
  HOME_QUICK_CALC_STEP,
  useHomeQuickCalc,
} from "@/composables/useHomeQuickCalc";
import { readClampedNumber } from "@/utils/numericInput";
import { formatKrwCompact, formatNumber, formatPercent, formatWon } from "@/lib/utils";
import ResultHero from "@/components/common/ResultHero.vue";

const props = defineProps<{ heading: string; note: string }>();

const {
  annualGrossInput,
  appliedAnnualGross,
  monthlyNet,
  monthlyDeduction,
  effectiveTaxRate,
  setAnnualGross,
} = useHomeQuickCalc();

const formattedGross = computed(() => formatNumber(annualGrossInput.value));

// 빠른 선택 프리셋 6개 — 검색 유입이 많은 연봉 구간
const grossPresets = [
  { label: "3,000만", value: 30_000_000 },
  { label: "4,000만", value: 40_000_000 },
  { label: "5,000만", value: 50_000_000 },
  { label: "6,000만", value: 60_000_000 },
  { label: "8,000만", value: 80_000_000 },
  { label: "1억", value: 100_000_000 },
];

const inputIds = {
  gross: "home-quick-annual-gross",
  grossRange: "home-quick-annual-gross-range",
} as const;

function onGrossInput(event: Event): void {
  const clamped = readClampedNumber(
    event.target as HTMLInputElement,
    clampHomeAnnualGross
  );
  if (clamped !== null) setAnnualGross(clamped);
}

// 상세 화면으로 넘길 때 기본값이면 쿼리를 붙이지 않는다(/salary가 곧바로 URL을 정리하며 깜빡임)
const detailRoute = computed(() =>
  appliedAnnualGross.value === HOME_QUICK_CALC_DEFAULTS.annualGross
    ? { path: "/salary" }
    : { path: "/salary", query: { gross: String(appliedAnnualGross.value) } }
);
</script>

<template>
  <section class="retro-panel" aria-labelledby="home-quick-calc-title">
    <div class="retro-titlebar">
      <h2 id="home-quick-calc-title" class="retro-title">{{ props.heading }}</h2>
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="space-y-2">
        <label :for="inputIds.gross" class="block text-caption font-semibold text-foreground">
          세전 연봉 (원)
        </label>
        <div class="amount-stepper flex items-center gap-2">
          <button
            type="button"
            class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label="100만원 감소"
            @click="setAnnualGross(annualGrossInput - HOME_QUICK_CALC_STEP)"
          >
            −
          </button>
          <input
            :id="inputIds.gross"
            :value="formattedGross"
            type="text"
            inputmode="numeric"
            class="retro-input min-w-0 flex-1 text-center text-heading font-bold tabular-nums"
            @input="onGrossInput"
          />
          <button
            type="button"
            class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label="100만원 증가"
            @click="setAnnualGross(annualGrossInput + HOME_QUICK_CALC_STEP)"
          >
            +
          </button>
        </div>
        <ShSlider
          :id="inputIds.grossRange"
          :model-value="annualGrossInput"
          :min="HOME_QUICK_CALC_MIN_GROSS"
          :max="HOME_QUICK_CALC_MAX_GROSS"
          :step="HOME_QUICK_CALC_STEP"
          :value-text="`연봉 ${formattedGross}원`"
          aria-label="연봉 슬라이더"
          @update:model-value="setAnnualGross"
        />
        <ShPresetGroup
          :model-value="annualGrossInput"
          :options="grossPresets"
          label="연봉 빠른 선택"
          @update:model-value="setAnnualGross"
        />
      </div>

      <div class="retro-panel-muted space-y-3 p-4">
        <ResultHero
          :label="`연봉 ${formatKrwCompact(appliedAnnualGross)} · 월 실수령액`"
          :value="formatWon(monthlyNet)"
        />
        <div class="result-stat-grid">
          <div class="result-stat-card retro-stat">
            <p class="retro-stat-label whitespace-nowrap">월 공제 합계</p>
            <p class="retro-stat-value">{{ formatWon(monthlyDeduction) }}</p>
          </div>
          <div class="result-stat-card retro-stat">
            <p class="retro-stat-label whitespace-nowrap">공제 비율</p>
            <p class="retro-stat-value">{{ formatPercent(effectiveTaxRate, 1) }}</p>
          </div>
        </div>
        <p class="text-tiny text-muted-foreground">
          부양가족 본인 1명 · 비과세 월 20만원 · 퇴직금 별도 기준입니다.
        </p>
      </div>

      <RouterLink
        :to="detailRoute"
        class="inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline"
      >
        부양가족·비과세까지 넣어 자세히 보기
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </RouterLink>

      <p class="break-keep text-caption text-muted-foreground">{{ props.note }}</p>
    </div>
  </section>
</template>
