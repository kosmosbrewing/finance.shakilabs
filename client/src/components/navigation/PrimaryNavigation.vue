<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { ShPrimaryNavigation, type PrimaryNavigationItem } from "@shakilabs/ui";
import {
  PRIMARY_NAV_ITEMS,
  findActiveNavItem,
} from "../../../scripts/primary-nav-items.mjs";
import { trackEvent } from "@/lib/analytics";
import { getPageGroup } from "@/utils/pageTracking";

const route = useRoute();

const activeItem = computed(() => findActiveNavItem(route.path));

function trackNavigation(item: PrimaryNavigationItem): void {
  trackEvent("nav_click", {
    from_tool: getPageGroup(route.path),
    to_tool: item.key,
    placement: "primary_nav",
  });
}
</script>

<template>
  <!-- v3 §3.3-1 — 모바일(<48rem)에서는 이 인라인 내비를 숨기고 헤더의 좌측 드로어가
       같은 목록을 대신 연다. 10개 탭을 가로 스크롤 1행에 넣어도 첫 화면 밖 비율이
       절반에 가까웠고, 그 1행이 모바일 chrome을 57px 더 먹었다.
       드로어는 링크를 항상 DOM에 렌더하므로 크롤 경로는 끊기지 않는다. -->
  <ShPrimaryNavigation
    class="primary-navigation--desktop-only"
    :items="PRIMARY_NAV_ITEMS"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
    aria-label="주요 계산기"
    @select="trackNavigation"
  />
</template>

<style scoped>
@media (max-width: 47.99rem) {
  .primary-navigation--desktop-only {
    display: none;
  }
}
</style>
