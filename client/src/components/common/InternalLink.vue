<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps<{
  current: "insurance" | "salary" | "compare" | "quit";
}>();

const suggestions = computed(() => {
  if (props.current === "insurance") {
    return [
      { to: "/salary", label: "실수령액 계산" },
      { to: "/compare", label: "이직 비교" },
      { to: "/quit", label: "퇴사 시뮬레이션" },
    ];
  }

  if (props.current === "salary") {
    return [
      { to: "/compare", label: "이직 비교" },
      { to: "/quit", label: "퇴사 시뮬레이션" },
      { to: "/insurance", label: "건보료 연봉 추정" },
    ];
  }

  if (props.current === "compare") {
    return [
      { to: "/quit", label: "퇴사 시뮬레이션" },
      { to: "/insurance", label: "건보료 연봉 추정" },
      { to: "/salary", label: "실수령액 계산" },
    ];
  }

  return [
    { to: "/insurance", label: "건보료 연봉 추정" },
    { to: "/salary", label: "실수령액 계산" },
    { to: "/compare", label: "이직 비교" },
  ];
});
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <RouterLink
      v-for="item in suggestions"
      :key="item.to"
      :to="item.to"
      class="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-caption font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      {{ item.label }}
    </RouterLink>
  </div>
</template>
