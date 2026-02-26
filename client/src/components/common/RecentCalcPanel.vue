<script setup lang="ts">
import { computed } from "vue";
import { History, Trash2 } from "lucide-vue-next";
import { useRecentCalcs } from "@/composables/useRecentCalcs";
import { showDestructiveConfirm } from "@/composables/useAlert";

const { entries, clearAll } = useRecentCalcs();

const TYPE_CONFIG: Record<string, { label: string; class: string }> = {
  salary: { label: "연봉", class: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
  insurance: { label: "건보", class: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" },
  compare: { label: "비교", class: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400" },
  quit: { label: "퇴사", class: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
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
    <div class="divide-y divide-border/50">
      <RouterLink
        v-for="entry in entries"
        :key="`${entry.type}-${entry.timestamp}`"
        :to="entry.path"
        class="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted/40"
      >
        <span
          class="shrink-0 rounded-md px-1.5 py-0.5 text-tiny font-semibold"
          :class="TYPE_CONFIG[entry.type]?.class ?? 'bg-muted text-muted-foreground'"
        >
          {{ TYPE_CONFIG[entry.type]?.label ?? entry.type }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-caption font-semibold text-foreground truncate leading-snug">{{ entry.label }}</p>
          <p class="text-tiny text-muted-foreground truncate leading-snug">{{ entry.summary }}</p>
        </div>
        <span class="shrink-0 text-tiny text-muted-foreground">{{ relativeTime(entry.timestamp) }}</span>
      </RouterLink>
    </div>
  </section>
</template>
