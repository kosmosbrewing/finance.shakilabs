<script setup lang="ts">
import { computed } from "vue";
import {
  comparisonScale,
  type ComparisonMetric,
} from "@/components/result-visualization/chartMath";

const props = withDefaults(
  defineProps<{
    metrics: readonly ComparisonMetric[];
    beforeLabel: string;
    afterLabel: string;
    formatValue: (value: number) => string;
    beforeColor?: string;
    afterColor?: string;
  }>(),
  {
    beforeColor: "hsl(var(--chart-pension))",
    afterColor: "hsl(var(--chart-net))",
  },
);

const validMetrics = computed(() =>
  props.metrics.map((metric) => ({
    ...metric,
    before: Number.isFinite(metric.before) ? Math.max(0, metric.before) : 0,
    after: Number.isFinite(metric.after) ? Math.max(0, metric.after) : 0,
  })),
);
const scale = computed(() => comparisonScale(validMetrics.value));

function width(value: number): number {
  return scale.value > 0 ? (value / scale.value) * 100 : 0;
}
</script>

<template>
  <div class="retro-chart">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
      <span class="flex items-center gap-1.5">
        <svg viewBox="0 0 10 10" class="h-2.5 w-2.5" aria-hidden="true">
          <rect width="10" height="10" rx="2" :fill="beforeColor" />
        </svg>
        {{ beforeLabel }}
      </span>
      <span class="flex items-center gap-1.5">
        <svg viewBox="0 0 10 10" class="h-2.5 w-2.5" aria-hidden="true">
          <rect width="10" height="10" rx="2" :fill="afterColor" />
        </svg>
        {{ afterLabel }}
      </span>
    </div>

    <ul class="space-y-3">
      <li v-for="metric in validMetrics" :key="metric.key" class="space-y-1.5">
        <p class="text-caption font-semibold text-foreground">{{ metric.label }}</p>
        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div class="h-2 overflow-hidden rounded-full bg-background/70">
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" class="block h-full w-full" aria-hidden="true">
              <rect :width="width(metric.before)" height="8" :fill="beforeColor" />
            </svg>
          </div>
          <span class="text-tiny tabular-nums text-muted-foreground">{{ formatValue(metric.before) }}</span>
          <div class="h-2 overflow-hidden rounded-full bg-background/70">
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" class="block h-full w-full" aria-hidden="true">
              <rect :width="width(metric.after)" height="8" :fill="afterColor" />
            </svg>
          </div>
          <span class="text-tiny font-semibold tabular-nums text-foreground">{{ formatValue(metric.after) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>
