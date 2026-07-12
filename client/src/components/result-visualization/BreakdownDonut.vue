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
    centerLabel?: string;
    centerValue?: string;
    emptyMessage?: string;
    formatValue?: (value: number) => string;
  }>(),
  {
    centerLabel: "",
    centerValue: "",
    emptyMessage: "표시할 구성 항목이 없습니다.",
    formatValue: undefined,
  },
);

const titleId = `breakdown-donut-title-${useId()}`;
const descriptionId = `breakdown-donut-desc-${useId()}`;
const normalizedSegments = computed(() => normalizeChartSegments(props.segments));
const description = computed(() =>
  normalizedSegments.value
    .map((segment) => `${segment.label} ${(segment.ratio * 100).toFixed(1)}%`)
    .join(", "),
);

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 78;
const STROKE_WIDTH = 30;

const arcs = computed(() =>
  normalizedSegments.value.map((segment) => {
    const startAngle = segment.offset * 360 - 90;
    const endAngle = startAngle + segment.ratio * 360;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = CENTER + RADIUS * Math.cos(startRad);
    const y1 = CENTER + RADIUS * Math.sin(startRad);
    const x2 = CENTER + RADIUS * Math.cos(endRad);
    const y2 = CENTER + RADIUS * Math.sin(endRad);

    return {
      ...segment,
      fullCircle: segment.ratio >= 0.999999,
      d: `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${segment.ratio > 0.5 ? 1 : 0} 1 ${x2} ${y2}`,
    };
  }),
);
</script>

<template>
  <div v-if="arcs.length" class="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
    <svg
      :viewBox="`0 0 ${SIZE} ${SIZE}`"
      class="h-auto w-[176px] max-w-full shrink-0"
      role="img"
      :aria-labelledby="`${titleId} ${descriptionId}`"
    >
      <title :id="titleId">{{ label }}</title>
      <desc :id="descriptionId">{{ description }}</desc>
      <template v-for="arc in arcs" :key="arc.key">
        <circle
          v-if="arc.fullCircle"
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          fill="none"
          :stroke="arc.color"
          :stroke-width="STROKE_WIDTH"
        />
        <path
          v-else
          :d="arc.d"
          fill="none"
          :stroke="arc.color"
          :stroke-width="STROKE_WIDTH"
        />
      </template>
      <text
        v-if="centerLabel"
        :x="CENTER"
        :y="centerValue ? CENTER - 5 : CENTER + 3"
        text-anchor="middle"
        class="fill-muted-foreground text-[10px]"
      >
        {{ centerLabel }}
      </text>
      <text
        v-if="centerValue"
        :x="CENTER"
        :y="CENTER + 12"
        text-anchor="middle"
        class="fill-foreground text-[11px] font-bold tabular-nums"
      >
        {{ centerValue }}
      </text>
    </svg>

    <div class="grid w-full gap-x-4 gap-y-2 sm:grid-cols-1 md:grid-cols-2">
      <div
        v-for="arc in arcs"
        :key="`${arc.key}-legend`"
        class="flex min-w-0 items-center justify-between gap-2 text-caption"
      >
        <span class="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <svg viewBox="0 0 10 10" class="h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <rect width="10" height="10" rx="2" :fill="arc.color" />
          </svg>
          <span class="truncate">{{ arc.label }}</span>
        </span>
        <span class="shrink-0 font-semibold tabular-nums">
          {{ formatValue ? formatValue(arc.value) : `${(arc.ratio * 100).toFixed(1)}%` }}
        </span>
      </div>
    </div>
  </div>

  <p v-else class="py-6 text-center text-caption text-muted-foreground">
    {{ emptyMessage }}
  </p>
</template>
