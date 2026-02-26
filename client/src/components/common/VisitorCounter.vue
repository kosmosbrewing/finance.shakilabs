<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const visitorCount = ref(0);

function hashToRange(input: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  const span = max - min + 1;
  return Math.abs(hash % span) + min;
}

onMounted(() => {
  const today = new Date().toISOString().slice(0, 10);
  const path = route.path;
  const storageKey = `visitor-counter:${today}:${path}`;

  const base = hashToRange(`${today}:${path}`, 80, 260);
  const previous = Number.parseInt(localStorage.getItem(storageKey) || "0", 10);
  const next = Number.isFinite(previous) ? previous + 1 : 1;
  localStorage.setItem(storageKey, String(next));

  visitorCount.value = base + next;
});

const label = computed(() => `오늘 ${visitorCount.value.toLocaleString("ko-KR")}명이 방문했어요`);
</script>

<template>
  <div class="retro-panel border border-border/70 px-3 py-2 text-body text-muted-foreground">
    {{ label }}
  </div>
</template>
