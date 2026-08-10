<script setup lang="ts">
import { ShSurface } from "@shakilabs/ui";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import PrimaryNavigation from "@/components/navigation/PrimaryNavigation.vue";
</script>

<template>
  <ShSurface
    as="div"
    variant="plain"
    padding="none"
    class="design-system-shell min-h-screen flex flex-col bg-background"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:text-caption focus:font-semibold"
    >
      본문 바로가기
    </a>
    <AppHeader />
    <PrimaryNavigation />
    <main id="main-content" tabindex="-1" class="flex-1 relative">
      <slot />
      <!-- 프리렌더 본문이 하이드레이션 직후 이 안으로 옮겨진다 (utils/prerenderFallback.ts).
           템플릿상 자식이 없어 Vue가 패치하지 않으므로 외부 노드를 넣어도 안전하다. -->
      <div data-prerender-host class="container"></div>
    </main>
    <AppFooter />
  </ShSurface>
</template>

<style scoped>
/* 본문이 실제로 인수됐을 때만 구분선을 그린다 — 비어 있으면 흔적이 남으면 안 된다 */
[data-prerender-host]:not(:empty) {
  margin-top: 2rem;
  padding-top: 0.5rem;
  border-top: 1px solid hsl(var(--border));
}
</style>
