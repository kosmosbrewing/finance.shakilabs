<script setup lang="ts">
// 옛 우측 레일(피드백 + 최근 계산)을 본문 맨 아래 한 줄로 내린 자리.
// 모바일에서는 레일이 원래 본문 뒤(order-2)에 있었으므로 모바일 읽기 순서는 그대로다.
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";

defineProps<{ pageKey: string }>();
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
    <CommunitySidebar :page-key="pageKey" />
    <!-- 기록이 없으면 스스로 렌더하지 않는다 — 그때는 피드백만 왼쪽 반 칸에 남는다 -->
    <RecentCalcPanel />
  </div>
</template>
