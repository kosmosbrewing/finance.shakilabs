<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps<{
  current: "insurance" | "salary" | "comprehensive-tax" | "compare" | "quit" | "withholding";
}>();

const suggestions = computed(() => {
  if (props.current === "insurance") {
    return [
      { to: "/salary", label: "연봉 실수령액 계산기" },
      { to: "/comprehensive-tax", label: "종합소득세 계산기" },
      { to: "/compare", label: "이직 연봉 비교 계산기" },
      { to: "/quit", label: "퇴사 계산기" },
      { to: "/withholding", label: "원천세 계산기" },
    ];
  }

  if (props.current === "salary") {
    return [
      { to: "/comprehensive-tax", label: "종합소득세 계산기" },
      { to: "/compare", label: "이직 연봉 비교 계산기" },
      { to: "/quit", label: "퇴사 계산기" },
      { to: "/insurance", label: "건강보험료 연봉 계산기" },
      { to: "/withholding", label: "원천세 계산기" },
    ];
  }

  if (props.current === "comprehensive-tax") {
    return [
      { to: "/salary", label: "연봉 실수령액 계산기" },
      { to: "/insurance", label: "건강보험료 연봉 계산기" },
      { to: "/quit", label: "퇴사 계산기" },
      { to: "/withholding", label: "원천세 계산기" },
    ];
  }

  if (props.current === "compare") {
    return [
      { to: "/comprehensive-tax", label: "종합소득세 계산기" },
      { to: "/quit", label: "퇴사 계산기" },
      { to: "/insurance", label: "건강보험료 연봉 계산기" },
      { to: "/salary", label: "연봉 실수령액 계산기" },
      { to: "/withholding", label: "원천세 계산기" },
    ];
  }

  if (props.current === "withholding") {
    return [
      { to: "/insurance", label: "건강보험료 연봉 계산기" },
      { to: "/salary", label: "연봉 실수령액 계산기" },
      { to: "/comprehensive-tax", label: "종합소득세 계산기" },
      { to: "/compare", label: "이직 연봉 비교 계산기" },
    ];
  }

  return [
    { to: "/comprehensive-tax", label: "종합소득세 계산기" },
    { to: "/insurance", label: "건강보험료 연봉 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/compare", label: "이직 연봉 비교 계산기" },
    { to: "/withholding", label: "원천세 계산기" },
  ];
});
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <RouterLink
      v-for="item in suggestions"
      :key="item.label"
      :to="item.to"
      class="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-caption font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      {{ item.label }}
    </RouterLink>
  </div>
</template>
