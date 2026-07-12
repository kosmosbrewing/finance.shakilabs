<script setup lang="ts">
import { computed, useId } from "vue";
import { ShPresetGroup, ShSlider } from "@shakilabs/ui";
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

const fieldId = useId();

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

</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <div>
        <label :for="fieldId" class="text-body font-semibold text-foreground">{{ label }}</label>
        <p v-if="description" class="mt-1 text-caption text-muted-foreground">
          {{ description }}
        </p>
      </div>
      <span class="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-border/60 bg-muted/25 px-3 py-1 text-caption font-semibold tabular-nums">
        {{ displayValue }}{{ unit }}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <input
        :id="fieldId"
        :value="displayValue"
        :inputmode="format === 'decimal' ? 'decimal' : 'numeric'"
        type="text"
        class="retro-input min-w-0 tabular-nums"
        @input="onTextInput"
      />
      <span v-if="unit" class="inline-flex shrink-0 whitespace-nowrap text-caption font-semibold text-muted-foreground">{{ unit }}</span>
    </div>

    <ShSlider
      :id="`${fieldId}-range`"
      :aria-label="`${label} 범위`"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :value-text="`${label} ${displayValue}${unit}`"
      @update:model-value="updateValue"
    />

    <ShPresetGroup
      v-if="presets.length"
      :model-value="modelValue"
      :options="presets"
      :label="`${label} 빠른 선택`"
      @update:model-value="updateValue"
    />
  </div>
</template>
