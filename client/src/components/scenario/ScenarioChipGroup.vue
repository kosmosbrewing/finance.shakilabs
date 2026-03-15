<script setup lang="ts">
type ScenarioChipOption = {
  label: string;
  value: string;
};

defineProps<{
  label: string;
  modelValue: string;
  options: readonly ScenarioChipOption[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="space-y-3">
    <p class="text-body font-semibold text-foreground">{{ label }}</p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="retro-chip"
        :class="{ 'border-primary text-primary': modelValue === option.value }"
        @click="emit('update:modelValue', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
