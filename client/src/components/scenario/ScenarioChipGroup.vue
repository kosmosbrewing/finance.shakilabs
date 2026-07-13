<script setup lang="ts">
import { ShPresetGroup, type PresetValue } from "@shakilabs/ui";

type ScenarioChipOption = {
  label: string;
  value: string;
};

const props = defineProps<{
  label: string;
  modelValue: string;
  options: readonly ScenarioChipOption[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function updateValue(value: PresetValue): void {
  if (typeof value === "string") emit("update:modelValue", value);
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-body font-semibold text-foreground">{{ label }}</p>
    <ShPresetGroup
      :model-value="props.modelValue"
      :options="props.options"
      :label="props.label"
      @update:model-value="updateValue"
    />
  </div>
</template>
