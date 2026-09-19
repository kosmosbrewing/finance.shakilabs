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
    <!-- SkipLink는 ShGlobalHeader가 렌더한다(v3 §3.1 골격: SkipLink → GlobalHeader).
         앱이 자체 스킵 링크를 하나 더 두면 탭 순서 맨 앞에 같은 링크가 두 번 나온다. -->
    <AppHeader />
    <PrimaryNavigation />
    <main id="main-content" tabindex="-1" class="flex-1 relative">
      <slot />
      <!-- 프리렌더 본문이 하이드레이션 직후 이 안으로 옮겨진다 (utils/prerenderFallback.ts).
           템플릿상 자식이 없어 Vue가 패치하지 않으므로 외부 노드를 넣어도 안전하다.
           폭은 --page(1024)다: 주입되는 article 자체가 max-width 920px이라 이보다 좁은
           --prose(672)를 주면 표가 눌리고, --tool(1152)을 줘도 보이는 폭은 920px로 같다. -->
      <div data-prerender-host class="sh-container sh-container--page"></div>
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
