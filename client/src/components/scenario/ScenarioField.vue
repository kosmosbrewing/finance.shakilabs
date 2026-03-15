<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "@/lib/utils";

type ScenarioPreset = {
  label: string;
  value: number;
};

const props = withDefaults(
  defineProps<{
    label: string;
    modelValue: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    description?: string;
    presets?: readonly ScenarioPreset[];
    format?: "currency" | "number" | "decimal";
  }>(),
  {
    step: 1,
    unit: "",
    description: "",
    presets: () => [],
    format: "number",
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

const displayValue = computed(() => {
  if (props.format === "decimal") {
    return props.modelValue.toFixed(1).replace(/\.0$/, "");
  }

  return formatNumber(Math.round(props.modelValue));
});

function clamp(value: number): number {
  return Math.min(props.max, Math.max(props.min, value));
}

function parseRawValue(raw: string): number {
  const normalized =
    props.format === "decimal"
      ? raw.replace(/[^0-9.]/g, "")
      : raw.replace(/[^0-9]/g, "");
  const parsed =
    props.format === "decimal"
      ? Number.parseFloat(normalized)
      : Number.parseInt(normalized, 10);

  if (!Number.isFinite(parsed)) return props.min;
  return clamp(parsed);
}

function updateValue(next: number): void {
  emit("update:modelValue", clamp(next));
}

function onTextInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  updateValue(parseRawValue(target.value));
}

function onRangeInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  const parsed = Number.parseFloat(target.value);
  updateValue(Number.isFinite(parsed) ? parsed : props.min);
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <div>
        <label class="text-body font-semibold text-foreground">{{ label }}</label>
        <p v-if="description" class="mt-1 text-caption text-muted-foreground">
          {{ description }}
        </p>
      </div>
      <span class="rounded-full border border-border/60 bg-muted/25 px-3 py-1 text-caption font-semibold tabular-nums">
        {{ displayValue }}{{ unit }}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <input
        :value="displayValue"
        :inputmode="format === 'decimal' ? 'decimal' : 'numeric'"
        type="text"
        class="retro-input tabular-nums"
        @input="onTextInput"
      />
      <span v-if="unit" class="text-caption font-semibold text-muted-foreground">{{ unit }}</span>
    </div>

    <input
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      type="range"
      class="retro-range"
      @input="onRangeInput"
    />

    <div v-if="presets.length" class="flex flex-wrap gap-2">
      <button
        v-for="preset in presets"
        :key="`${label}-${preset.label}`"
        type="button"
        class="retro-chip"
        @click="updateValue(preset.value)"
      >
        {{ preset.label }}
      </button>
    </div>
  </div>
</template>
