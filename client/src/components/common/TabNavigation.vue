<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();

const tabs = [
  { key: "insurance", label: "건보료 계산", to: "/insurance" },
  { key: "salary", label: "연봉 계산", to: "/salary" },
  { key: "raise", label: "연봉 인상률", to: "/raise" },
  { key: "bonus", label: "성과급", to: "/bonus" },
  { key: "annual-leave", label: "연차수당", to: "/annual-leave" },
  { key: "overtime", label: "추가 수당", to: "/overtime" },
  { key: "pension", label: "국민연금", to: "/pension" },
  { key: "monthly-rent-deduction", label: "월세공제", to: "/monthly-rent-deduction" },
  { key: "irp", label: "IRP 절세", to: "/irp" },
  { key: "4-insurance-employer", label: "사업주4보험", to: "/4-insurance-employer" },
  { key: "compare", label: "이직 비교", to: "/compare" },
  { key: "quit", label: "퇴사 계산", to: "/quit" },
  { key: "withholding", label: "원천세 계산", to: "/withholding" },
  { key: "comprehensive-tax", label: "종합소득세 계산", to: "/comprehensive-tax" },
  { key: "freelance-rate", label: "프리랜서 단가", to: "/freelance-rate" },
] as const;

const activePath = computed(() => route.path);

function isActiveTab(key: (typeof tabs)[number]["key"]): boolean {
  if (key === "insurance") return activePath.value.startsWith("/insurance");
  if (key === "salary") return activePath.value.startsWith("/salary");
  if (key === "raise") return activePath.value.startsWith("/raise");
  if (key === "bonus") return activePath.value.startsWith("/bonus");
  if (key === "annual-leave") return activePath.value.startsWith("/annual-leave");
  if (key === "overtime") return activePath.value.startsWith("/overtime");
  if (key === "pension") return activePath.value.startsWith("/pension");
  if (key === "monthly-rent-deduction") return activePath.value.startsWith("/monthly-rent-deduction");
  if (key === "irp") return activePath.value.startsWith("/irp");
  if (key === "4-insurance-employer") return activePath.value.startsWith("/4-insurance-employer");
  if (key === "compare") return activePath.value.startsWith("/compare");
  if (key === "quit") return activePath.value.startsWith("/quit");
  if (key === "withholding") return activePath.value.startsWith("/withholding");
  if (key === "freelance-rate") return activePath.value.startsWith("/freelance-rate");
  return activePath.value.startsWith("/comprehensive-tax");
}
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-primary/20 bg-primary shadow-sm" aria-label="주요 메뉴">
    <div class="container">
      <div class="grid grid-cols-4 gap-x-1 sm:flex sm:h-12 sm:items-center sm:gap-2 sm:overflow-x-auto" style="scrollbar-width: none">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="tab.to"
          :class="[
            'touch-target relative inline-flex min-w-0 items-center justify-center px-2 py-3 text-center text-[0.82rem] font-semibold leading-tight transition-all duration-200 sm:h-12 sm:shrink-0 sm:justify-start sm:px-3 sm:py-0 sm:text-body',
            isActiveTab(tab.key)
              ? 'text-primary-foreground'
              : 'text-primary-foreground/70 hover:text-primary-foreground/90',
          ]"
        >
          <span class="break-keep">{{ tab.label }}</span>
          <span
            v-if="isActiveTab(tab.key)"
            class="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-white sm:inset-x-1"
          />
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
