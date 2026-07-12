<script setup lang="ts">
import { computed, useId } from "vue";
import {
  normalizeChartSegments,
  type ChartSegment,
} from "@/components/result-visualization/chartMath";

const props = withDefaults(
  defineProps<{
    segments: readonly ChartSegment[];
    label: string;
    emptyMessage?: string;
    showLegend?: boolean;
    formatValue?: (value: number) => string;
  }>(),
  {
    emptyMessage: "표시할 구성 항목이 없습니다.",
    showLegend: false,
    formatValue: undefined,
  },
);

const titleId = `breakdown-bar-title-${useId()}`;
const descriptionId = `breakdown-bar-desc-${useId()}`;
const normalizedSegments = computed(() => normalizeChartSegments(props.segments));
const description = computed(() =>
  normalizedSegments.value
    .map((segment) => `${segment.label} ${(segment.ratio * 100).toFixed(1)}%`)
    .join(", "),
);
</script>

<template>
  <div v-if="normalizedSegments.length" class="space-y-2.5">
    <div class="h-5 overflow-hidden rounded-lg border border-border/40 bg-background/60">
      <svg
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        class="block h-full w-full"
        role="img"
        :aria-labelledby="`${titleId} ${descriptionId}`"
      >
        <title :id="titleId">{{ label }}</title>
        <desc :id="descriptionId">{{ description }}</desc>
        <rect
          v-for="segment in normalizedSegments"
          :key="segment.key"
          :x="segment.offset * 100"
          y="0"
          :width="segment.ratio * 100"
          height="20"
          :fill="segment.color"
        >
          <title>{{ segment.label }} {{ (segment.ratio * 100).toFixed(1) }}%</title>
        </rect>
      </svg>
    </div>

    <div v-if="showLegend" class="grid gap-x-4 gap-y-2 sm:grid-cols-2">
      <div
        v-for="segment in normalizedSegments"
        :key="`${segment.key}-legend`"
        class="flex min-w-0 items-center justify-between gap-2 text-caption"
      >
        <span class="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <svg viewBox="0 0 10 10" class="h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <rect width="10" height="10" rx="2" :fill="segment.color" />
          </svg>
          <span class="truncate">{{ segment.label }}</span>
        </span>
        <span class="shrink-0 font-semibold tabular-nums">
          {{ formatValue ? formatValue(segment.value) : `${(segment.ratio * 100).toFixed(1)}%` }}
        </span>
      </div>
    </div>
  </div>

  <p v-else class="py-3 text-center text-caption text-muted-foreground">
    {{ emptyMessage }}
  </p>
</template>
