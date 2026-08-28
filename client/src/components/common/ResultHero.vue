<script setup lang="ts">
// Single grammar for every calculator's primary result (docs: RESULT_DESIGN_BACKLOG):
// label above (13px muted) -> amount (text-display, brand color, tabular-nums)
// -> optional secondary line (14px muted), all centered inside the white panel.
// Brand color is reserved for this hero amount only; stat-grid values stay neutral.
// No count-up animation: the static prerendered value must never be blanked on mount.
defineProps<{
  label: string;
  value: string;
}>();
</script>

<template>
  <div data-result-hero class="text-center py-3">
    <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">{{ label }}</p>
    <p class="text-display font-bold font-title text-primary tabular-nums">{{ value }}</p>
    <p v-if="$slots.secondary" class="text-body text-muted-foreground mt-1.5">
      <slot name="secondary" />
    </p>
  </div>
</template>
