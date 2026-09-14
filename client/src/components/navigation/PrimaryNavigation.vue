<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  ShPrimaryNavigation,
  type PrimaryNavigationItem,
} from "@shakilabs/ui";
import { trackEvent } from "@/lib/analytics";
import { getPageGroup } from "@/utils/pageTracking";

interface FinanceNavigationItem extends PrimaryNavigationItem {
  matchPaths: readonly string[];
}

const route = useRoute();

const navigationItems: readonly FinanceNavigationItem[] = [
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
  { key: "all", label: "전체 계산기", to: "/all", matchPaths: ["/all"] },
];

function isActive(item: FinanceNavigationItem): boolean {
  return item.matchPaths.some(
    (path) => route.path === path || route.path.startsWith(`${path}/`),
  );
}

const activeItem = computed(() => navigationItems.find(isActive));

function trackNavigation(item: PrimaryNavigationItem): void {
  trackEvent("nav_click", {
    from_tool: getPageGroup(route.path),
    to_tool: item.key,
    placement: "primary_nav",
  });
}
</script>

<template>
  <!-- v3 §3.3 — 모바일은 가로 스크롤 1행이다(2~3행 그리드 금지). 그리드였을 때는
       6칸 2행 = 105px가 스티키로 고정돼 검정 헤더 56px과 합쳐 모바일 chrome을 먹었고,
       10개 중 6개만 보여 주느라 "현재 탭을 5번 칸에 끼워 넣는" 로직이 필요했다.
       1행이 되면 항목을 자를 이유가 없으므로 mobile-items를 넘기지 않는다. -->
  <ShPrimaryNavigation
    :items="navigationItems"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
    aria-label="주요 계산기"
    @select="trackNavigation"
  />
</template>
