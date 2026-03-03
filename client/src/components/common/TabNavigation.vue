<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();

const tabs = [
  { key: "insurance", label: "건보료 계산", to: "/insurance" },
  { key: "salary", label: "연봉 계산", to: "/salary" },
  { key: "compare", label: "이직 비교", to: "/compare" },
  { key: "quit", label: "퇴사 계산", to: "/quit" },
  { key: "withholding", label: "원천세 계산", to: "/withholding" },
  { key: "comprehensive-tax", label: "종합소득세 계산", to: "/comprehensive-tax" },
] as const;

const activePath = computed(() => route.path);

function isActiveTab(key: (typeof tabs)[number]["key"]): boolean {
  if (key === "insurance") return activePath.value.startsWith("/insurance");
  if (key === "salary") return activePath.value.startsWith("/salary");
  if (key === "compare") return activePath.value.startsWith("/compare");
  if (key === "quit") return activePath.value.startsWith("/quit");
  if (key === "withholding") return activePath.value.startsWith("/withholding");
  return activePath.value.startsWith("/comprehensive-tax");
}
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-primary/20 bg-primary shadow-sm" aria-label="주요 메뉴">
    <div class="container">
      <div class="flex h-12 items-center gap-2 overflow-x-auto" style="scrollbar-width: none">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="tab.to"
          :class="[
            'touch-target inline-flex h-11 shrink-0 items-center rounded-lg px-3 text-body font-semibold transition-all duration-200',
            isActiveTab(tab.key)
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
