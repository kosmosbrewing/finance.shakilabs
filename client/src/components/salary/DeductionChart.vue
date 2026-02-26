<script setup lang="ts">
import { computed } from "vue";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";

const props = defineProps<{
  calc: SalaryCalcResult;
}>();

type Segment = {
  label: string;
  value: number;
  color: string;
};

const segments = computed<Segment[]>(() => {
  const gross = props.calc.monthlyGross.value;
  if (gross <= 0) return [];

  return [
    { label: "실수령액", value: props.calc.monthlyNet.value, color: "hsl(var(--chart-net))" },
    { label: "국민연금", value: props.calc.nationalPension.value, color: "hsl(var(--chart-pension))" },
    { label: "건강보험", value: props.calc.healthInsurance.value, color: "hsl(var(--chart-health))" },
    { label: "장기요양", value: props.calc.longTermCare.value, color: "hsl(var(--chart-care))" },
    { label: "고용보험", value: props.calc.employmentInsurance.value, color: "hsl(var(--chart-employment))" },
    { label: "소득세", value: props.calc.monthlyIncomeTax.value, color: "hsl(var(--chart-tax))" },
    { label: "지방소득세", value: props.calc.monthlyLocalTax.value, color: "hsl(var(--chart-local-tax))" },
  ].filter((s) => s.value > 0);
});

// SVG 도넛 차트 경로 계산
const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 80;
const STROKE_WIDTH = 32;

const arcs = computed(() => {
  const total = segments.value.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return [];

  let cumAngle = -90; // 12시 방향부터 시작
  return segments.value.map((seg) => {
    const angle = (seg.value / total) * 360;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = CENTER + RADIUS * Math.cos(startRad);
    const y1 = CENTER + RADIUS * Math.sin(startRad);
    const x2 = CENTER + RADIUS * Math.cos(endRad);
    const y2 = CENTER + RADIUS * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const isFullCircle = angle >= 359.999;

    return {
      ...seg,
      percent: ((seg.value / total) * 100).toFixed(1),
      fullCircle: isFullCircle,
      d: `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`,
    };
  });
});

const chartDescription = computed(() =>
  arcs.value.map((arc) => `${arc.label} ${arc.percent}%`).join(", ")
);
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">공제 비율</h2>
    </div>
    <div class="retro-panel-content">
      <div v-if="arcs.length > 0" class="flex flex-col sm:flex-row items-center gap-6">
        <!-- 도넛 차트 -->
        <svg
          :viewBox="`0 0 ${SIZE} ${SIZE}`"
          class="w-48 h-48 shrink-0"
          role="img"
          aria-labelledby="deduction-chart-title deduction-chart-desc"
        >
          <title id="deduction-chart-title">공제 비율 도넛 차트</title>
          <desc id="deduction-chart-desc">{{ chartDescription }}</desc>
          <template v-for="(arc, i) in arcs" :key="i">
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
              stroke-linecap="butt"
            />
          </template>
        </svg>

        <!-- 범례 -->
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <div
            v-for="arc in arcs"
            :key="arc.label"
            class="flex items-center gap-1.5 text-caption"
          >
            <span
              class="w-3 h-3 rounded-sm shrink-0"
              :style="{ backgroundColor: arc.color }"
            />
            <span class="text-muted-foreground">{{ arc.label }}</span>
            <span class="font-semibold tabular-nums">{{ arc.percent }}%</span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <p class="text-caption text-muted-foreground">연봉을 입력하면 차트가 표시됩니다.</p>
      </div>
    </div>
  </section>
</template>
