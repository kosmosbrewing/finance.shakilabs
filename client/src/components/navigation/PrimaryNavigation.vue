<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { trackEvent } from "@/lib/analytics";
import { getPageGroup } from "@/utils/pageTracking";

interface NavigationItem {
  key: string;
  label: string;
  to: string;
  matchPaths: readonly string[];
}

const route = useRoute();

const navigationItems: readonly NavigationItem[] = [
  { key: "insurance", label: "건보료", to: "/insurance", matchPaths: ["/insurance"] },
  { key: "salary", label: "연봉 실수령", to: "/salary", matchPaths: ["/salary"] },
  {
    key: "comprehensive-tax",
    label: "종합소득세",
    to: "/comprehensive-tax",
    matchPaths: ["/comprehensive-tax", "/freelancer"],
  },
  {
    key: "year-end-settlement",
    label: "연말정산",
    to: "/year-end-settlement",
    matchPaths: ["/year-end-settlement"],
  },
  { key: "severance-pay", label: "퇴직금", to: "/severance-pay", matchPaths: ["/severance-pay"] },
  { key: "unemployment", label: "실업급여", to: "/unemployment", matchPaths: ["/unemployment"] },
  {
    key: "weekly-holiday-pay",
    label: "주휴수당",
    to: "/weekly-holiday-pay",
    matchPaths: ["/weekly-holiday-pay"],
  },
  {
    key: "parental-leave",
    label: "육아휴직",
    to: "/parental-leave",
    matchPaths: ["/parental-leave"],
  },
  {
    key: "wage-converter",
    label: "시급 환산",
    to: "/wage-converter",
    matchPaths: ["/wage-converter"],
  },
  { key: "all", label: "전체 보기", to: "/all", matchPaths: ["/all"] },
];

const mobileDefaultKeys = [
  "insurance",
  "salary",
  "comprehensive-tax",
  "year-end-settlement",
  "severance-pay",
  "all",
] as const;

function isActive(item: NavigationItem): boolean {
  return item.matchPaths.some(
    (path) => route.path === path || route.path.startsWith(`${path}/`),
  );
}

const activeItem = computed(() => navigationItems.find(isActive));
const mobileItems = computed(() => {
  const keys = [...mobileDefaultKeys];
  const current = activeItem.value;

  if (current && !keys.includes(current.key as (typeof mobileDefaultKeys)[number])) {
    keys[4] = current.key as (typeof mobileDefaultKeys)[number];
  }

  return keys
    .map((key) => navigationItems.find((item) => item.key === key))
    .filter((item): item is NavigationItem => Boolean(item));
});

function trackNavigation(item: NavigationItem): void {
  trackEvent("nav_click", {
    from_tool: getPageGroup(route.path),
    to_tool: item.key,
    placement: "primary_nav",
  });
}
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-primary/20 bg-primary shadow-sm" aria-label="주요 계산기">
    <div class="container px-3 py-1.5 sm:px-4 sm:py-0">
      <div class="grid grid-cols-3 gap-1 sm:hidden">
        <RouterLink
          v-for="item in mobileItems"
          :key="item.key"
          :to="item.to"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="[
            'flex min-h-[44px] items-center justify-center rounded-lg px-1 py-1.5 text-center text-[0.7rem] font-medium leading-tight transition-colors',
            isActive(item)
              ? 'bg-white/20 font-semibold text-white'
              : 'text-primary-foreground/75 active:bg-white/10',
          ]"
          @click="trackNavigation(item)"
        >
          <span class="break-keep">{{ item.label }}</span>
        </RouterLink>
      </div>

      <div class="tab-scroll hidden h-12 items-center gap-2 overflow-x-auto sm:flex">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.key"
          :to="item.to"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="[
            'relative flex h-12 shrink-0 items-center justify-center px-3 text-body font-semibold transition-colors',
            isActive(item) ? 'text-primary-foreground' : 'text-primary-foreground/70 hover:text-primary-foreground',
          ]"
          @click="trackNavigation(item)"
        >
          {{ item.label }}
          <span
            v-if="isActive(item)"
            class="absolute inset-x-1 bottom-0 h-[3px] rounded-full bg-white"
            aria-hidden="true"
          />
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.tab-scroll {
  scrollbar-width: none;
}

.tab-scroll::-webkit-scrollbar {
  display: none;
}
</style>
