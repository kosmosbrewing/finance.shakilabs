<script setup lang="ts">
import { computed } from "vue";
import { History, Trash2 } from "lucide-vue-next";
import { useRecentCalcs } from "@/composables/useRecentCalcs";
import { showDestructiveConfirm } from "@/composables/useAlert";

const { entries, clearAll } = useRecentCalcs();

const TYPE_BADGE: Record<string, string> = {
  salary: "연봉",
  insurance: "건보",
  compare: "비교",
  quit: "퇴사",
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

const hasEntries = computed(() => entries.value.length > 0);

async function handleClear(): Promise<void> {
  const confirmed = await showDestructiveConfirm("최근 계산 기록을 모두 삭제할까요?", {
    confirmText: "삭제",
  });
  if (confirmed) clearAll();
}
</script>

<template>
  <section v-if="hasEntries" class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <div class="flex items-center gap-1.5">
        <History class="h-3.5 w-3.5" />
        <h2 class="retro-title">최근 계산</h2>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-destructive transition-colors"
        @click="handleClear"
      >
        <Trash2 class="h-3 w-3" />
        지우기
      </button>
    </div>
    <ul class="retro-board-list">
      <li v-for="entry in entries" :key="`${entry.type}-${entry.timestamp}`">
        <RouterLink
          :to="entry.path"
          class="flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50"
        >
          <span class="retro-kbd shrink-0 mt-0.5">{{ TYPE_BADGE[entry.type] ?? entry.type }}</span>
          <div class="min-w-0 flex-1">
            <p class="text-caption font-semibold text-foreground truncate">{{ entry.label }}</p>
            <p class="text-caption text-muted-foreground truncate">{{ entry.summary }}</p>
          </div>
          <span class="shrink-0 text-caption text-muted-foreground/60 mt-0.5">{{ relativeTime(entry.timestamp) }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
