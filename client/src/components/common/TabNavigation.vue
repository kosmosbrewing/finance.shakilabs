<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();

const tabs = [
  { label: "건보료 역산", to: "/insurance", startsWith: "/insurance" },
  { label: "실수령액", to: "/salary", startsWith: "/salary" },
  { label: "이직 비교", to: "/compare", startsWith: "/compare" },
  { label: "퇴사 시뮬레이터", to: "/quit", startsWith: "/quit" },
] as const;

const activePath = computed(() => route.path);
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-primary/20 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/65 shadow-sm" aria-label="주요 메뉴">
    <div class="container">
      <div class="flex h-12 items-center gap-2 overflow-x-auto" style="scrollbar-width: none">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          :class="[
            'touch-target inline-flex h-11 shrink-0 items-center rounded-lg px-3 text-body font-semibold transition-all duration-200',
            activePath.startsWith(tab.startsWith)
              ? 'bg-white/20 text-primary-foreground shadow-sm'
              : 'text-primary-foreground/90 hover:bg-white/15 hover:text-primary-foreground',
          ]"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
