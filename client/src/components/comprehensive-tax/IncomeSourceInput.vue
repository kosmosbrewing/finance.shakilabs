<script setup lang="ts">
import { computed } from "vue";
import {
  FREELANCE_INDUSTRIES,
  type IndustryKey,
} from "@/data/freelanceTaxRates";
import { formatNumber, getSliderWindow } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    sourceType: "business" | "rental" | "other";
    enabled: boolean;
    revenue: number;
    industryKey?: IndustryKey;
    registered?: boolean;
    customExpenseRate?: number | null;
    preferSeparate?: boolean;
  }>(),
  {
    industryKey: "it",
    registered: true,
    customExpenseRate: null,
    preferSeparate: false,
  }
);

const emit = defineEmits<{
  "update:enabled": [value: boolean];
  "update:revenue": [value: number];
  "update:industryKey": [value: IndustryKey];
  "update:registered": [value: boolean];
  "update:customExpenseRate": [value: number | null];
  "update:preferSeparate": [value: boolean];
}>();

const industries = computed(() =>
  Object.entries(FREELANCE_INDUSTRIES).map(([key, value]) => ({
    key: key as IndustryKey,
    label: value.label,
    baseRate: value.baseRate,
    excessRate: value.excessRate,
  }))
);

const title = computed(() => {
  if (props.sourceType === "business") return "사업소득";
  if (props.sourceType === "rental") return "임대소득";
  return "기타소득";
});

const rangeConfig = computed(() => {
  if (props.sourceType === "business") {
    return { min: 100, max: 50000, step: 100 };
  }
  if (props.sourceType === "rental") {
    return { min: 100, max: 30000, step: 100 };
  }
  return { min: 50, max: 10000, step: 50 };
});

const sliderWindowSize = computed(() => {
  if (props.sourceType === "business") return 8_000;
  if (props.sourceType === "rental") return 4_000;
  return 2_000;
});

const revenueSliderBounds = computed(() =>
  getSliderWindow(
    props.revenue,
    rangeConfig.value.min,
    rangeConfig.value.max,
    sliderWindowSize.value
  )
);

const inputIds = computed(() => {
  const prefix = `comprehensive-${props.sourceType}`;
  return {
    enabled: `${prefix}-enabled`,
    revenue: `${prefix}-revenue`,
    revenueRange: `${prefix}-revenue-range`,
    industry: `${prefix}-industry`,
    registered: `${prefix}-registered`,
    preferSeparate: `${prefix}-prefer-separate`,
    customExpenseRate: `${prefix}-custom-expense-rate`,
  };
});

// 원 단위로 표시 (내부 데이터는 만원)
const formattedRevenue = computed(() => formatNumber(props.revenue * 10_000));

function onRevenueInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    updateRevenue(Math.round(value / 10_000));
  }
}

function updateRevenue(value: number): void {
  const config = rangeConfig.value;
  const safe = Math.max(config.min, Math.min(config.max, Math.floor(value || 0)));
  emit("update:revenue", safe);
}

function updateCustomExpenseRate(value: string): void {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    emit("update:customExpenseRate", null);
    return;
  }

  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) return;
  emit("update:customExpenseRate", Math.max(0, Math.min(95, parsed)));
}

const separateHint = computed(() => {
  if (props.sourceType === "rental") {
    return "연수입 2,000만원 이하일 때 분리과세 선택 가능";
  }
  if (props.sourceType === "other") {
    return "소득금액 300만원 이하일 때 분리과세 선택 가능";
  }
  return "";
});
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <div class="flex items-center gap-2">
        <h2 class="retro-title">{{ title }}</h2>
        <span class="retro-kbd">연수입 기준</span>
      </div>
      <label :for="inputIds.enabled" class="inline-flex items-center gap-1.5 text-caption font-semibold">
        <input
          :id="inputIds.enabled"
          type="checkbox"
          class="retro-checkbox"
          :checked="enabled"
          @change="emit('update:enabled', ($event.target as HTMLInputElement).checked)"
        />
        사용
      </label>
    </div>

    <div v-show="enabled" class="retro-panel-content space-y-4">
      <label :for="inputIds.revenue" class="mb-0.5 block text-caption font-semibold text-foreground">
        연 수입 (원)
      </label>
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            :aria-label="`${rangeConfig.step * 10_000}원 감소`"
            @click="updateRevenue(revenue - rangeConfig.step)"
          >
            −
          </button>
          <input
            :id="inputIds.revenue"
            :value="formattedRevenue"
            type="text"
            inputmode="numeric"
            class="retro-input min-w-0 flex-1 text-center text-heading font-bold tabular-nums"
            @input="onRevenueInput"
          />
          <button
            type="button"
            class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            :aria-label="`${rangeConfig.step * 10_000}원 증가`"
            @click="updateRevenue(revenue + rangeConfig.step)"
          >
            +
          </button>
        </div>
        <input
          :id="inputIds.revenueRange"
          :value="revenue"
          type="range"
          class="retro-range"
          :min="revenueSliderBounds.min"
          :max="revenueSliderBounds.max"
          :step="rangeConfig.step"
          :aria-label="`${title} 연수입 슬라이더`"
          @input="updateRevenue(parseInt(($event.target as HTMLInputElement).value, 10))"
        />
      </div>

      <div v-if="sourceType === 'business'" class="space-y-1">
        <label :for="inputIds.industry" class="text-caption text-muted-foreground">업종 (단순경비율)</label>
        <select
          :id="inputIds.industry"
          :value="industryKey"
          class="retro-input"
          @change="emit('update:industryKey', ($event.target as HTMLSelectElement).value as IndustryKey)"
        >
          <option
            v-for="item in industries"
            :key="item.key"
            :value="item.key"
          >
            {{ item.label }} ({{ Math.round(item.baseRate * 1000) / 10 }}% / {{ Math.round(item.excessRate * 1000) / 10 }}%)
          </option>
        </select>
        <p class="text-tiny text-muted-foreground">
          인적용역(프리랜서) 기준 단순경비율입니다. 음식업·도소매 등 일반 자영업은 별도 계산이 필요합니다.
        </p>
      </div>

      <div v-if="sourceType === 'rental'" class="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
        <label :for="inputIds.registered" class="inline-flex items-center gap-2 text-caption">
          <input
            :id="inputIds.registered"
            type="checkbox"
            class="retro-checkbox"
            :checked="registered"
            @change="emit('update:registered', ($event.target as HTMLInputElement).checked)"
          />
          임대사업자 등록
        </label>

        <label :for="inputIds.preferSeparate" class="inline-flex items-center gap-2 text-caption">
          <input
            :id="inputIds.preferSeparate"
            type="checkbox"
            class="retro-checkbox"
            :checked="preferSeparate"
            @change="emit('update:preferSeparate', ($event.target as HTMLInputElement).checked)"
          />
          분리과세 우선 적용
        </label>
        <p class="text-tiny text-muted-foreground">{{ separateHint }}</p>
      </div>

      <div v-if="sourceType === 'other'" class="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
        <label :for="inputIds.preferSeparate" class="inline-flex items-center gap-2 text-caption">
          <input
            :id="inputIds.preferSeparate"
            type="checkbox"
            class="retro-checkbox"
            :checked="preferSeparate"
            @change="emit('update:preferSeparate', ($event.target as HTMLInputElement).checked)"
          />
          분리과세 우선 적용
        </label>
        <p class="text-tiny text-muted-foreground">{{ separateHint }}</p>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label :for="inputIds.customExpenseRate" class="space-y-1">
          <span class="text-caption text-muted-foreground">커스텀 필요경비율(%)</span>
          <input
            :id="inputIds.customExpenseRate"
            :value="customExpenseRate ?? ''"
            type="number"
            min="0"
            max="95"
            step="0.1"
            inputmode="decimal"
            class="retro-input"
            placeholder="기본값 사용"
            @input="updateCustomExpenseRate(($event.target as HTMLInputElement).value)"
          />
        </label>
        <button
          type="button"
          class="retro-button-subtle"
          @click="emit('update:customExpenseRate', null)"
        >
          기본값으로 복원
        </button>
      </div>
    </div>
  </section>
</template>
