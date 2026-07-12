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
  <div class="retro-stat-grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]">
    <div v-for="item in props.items" :key="item.label" class="retro-stat">
      <p class="retro-stat-label">{{ item.label }}</p>
      <p class="retro-stat-value whitespace-nowrap text-[0.95rem] sm:text-heading" :class="valueClass(item.tone)">
        {{ item.value }}
      </p>
    </div>
  </div>
</template>
