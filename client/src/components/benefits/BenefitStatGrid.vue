<script setup lang="ts">
const props = defineProps<{
  items: {
    label: string;
    value: string;
    tone?: "default" | "success" | "danger";
  }[];
}>();

function valueClass(tone?: "default" | "success" | "danger"): string {
  if (tone === "success") return "text-status-success";
  if (tone === "danger") return "text-status-danger";
  return "text-foreground";
}
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
        <p class="retro-stat-value text-[0.95rem] sm:text-heading" :class="valueClass(item.tone)">
          {{ item.value }}
        </p>
      </div>
    </div>
  </div>
</template>
