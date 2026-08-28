<script setup lang="ts">
// Stat-grid values are always neutral bold (result grammar, 2026-08 decision):
// brand/status colors on grid values diluted the single brand hook of the hero.
const props = defineProps<{
  items: {
    label: string;
    value: string;
  }[];
}>();
</script>

<template>
  <div class="benefit-stat-layout">
    <div
      class="benefit-stat-grid retro-stat-grid"
      :class="{
        'benefit-stat-grid--2': props.items.length === 2,
        'benefit-stat-grid--3': props.items.length === 3,
        'benefit-stat-grid--4': props.items.length >= 4,
      }"
    >
      <div v-for="item in props.items" :key="item.label" class="retro-stat">
        <p class="retro-stat-label">{{ item.label }}</p>
        <p class="retro-stat-value text-[0.95rem] sm:text-heading text-foreground">
          {{ item.value }}
        </p>
      </div>
    </div>
  </div>
</template>
