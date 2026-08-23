<script setup lang="ts">
import { computed, onMounted } from "vue";
import { History, Trash2 } from "lucide-vue-next";
import { useRecentCalcs, type RecentCalcEntry } from "@/composables/useRecentCalcs";
import { showDestructiveConfirm } from "@/composables/useAlert";

const { entries, hydrated, hydrate, clearAll } = useRecentCalcs();

// Record<string, …>이면 누락돼도 타입 검사를 통과해 슬러그가 그대로 노출된다.
// 저장 스키마의 유니온으로 키를 고정해, 계산기를 추가하면 여기서 컴파일 에러가 나게 한다.
const TYPE_CONFIG: Record<RecentCalcEntry["type"], { label: string; class: string }> = {
  salary: { label: "연봉", class: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
  insurance: { label: "건보", class: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" },
  "comprehensive-tax": { label: "종합", class: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400" },
  // ComprehensiveTaxView가 프리랜서 모드에서 기록하는 키. 기존 "freelance"는 저장 스키마에 없는 死키였다.
  freelancer: { label: "프리", class: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400" },
  "freelance-rate": { label: "단가", class: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300" },
  raise: { label: "인상", class: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400" },
  bonus: { label: "보너스", class: "bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400" },
  overtime: { label: "수당", class: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400" },
  compare: { label: "비교", class: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400" },
  quit: { label: "퇴사", class: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
  withholding: { label: "원천", class: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400" },
  "severance-pay": { label: "퇴직", class: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  "wage-converter": { label: "시급", class: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300" },
  "weekly-holiday-pay": { label: "주휴", class: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400" },
};

// 매핑이 없을 때 라우트 슬러그(wage-converter 등)가 그대로 노출되던 문제를 막는다.
const FALLBACK_BADGE = { label: "계산", class: "bg-muted text-muted-foreground" };

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

onMounted(() => {
  hydrate();
});

async function handleClear(): Promise<void> {
  const confirmed = await showDestructiveConfirm("최근 계산 기록을 모두 삭제할까요?", {
    confirmText: "삭제",
  });
  if (confirmed) clearAll();
}
</script>

<template>
  <!--
    빈 패널은 렌더하지 않는다.

    이 패널은 26개 뷰의 우측 레일에 있지만 기록을 쌓는 계산기는 14개뿐이라, 나머지 12개
    (연차·피부양자·근로장려금·IRP·연금·육아휴직·실업급여·체불임금·연말정산·월세·지역건보·사업주
    4대보험)에서는 "계산 결과를 확인하면 저장됩니다"라는 안내가 그 페이지에서 영원히 지켜지지
    않는 약속이었다. 저장소는 앱 전역 키 하나라서 어느 계산기든 한 번 쓰면 26개 뷰 모두에서
    패널이 살아난다 — 즉 비었을 때만 감추면 교차 이동 가치는 그대로 두고 거짓 안내만 사라진다.
    하이드레이션 전에는 스켈레톤을 유지해, 기록이 있는 사용자에게 빈 화면이 깜빡이지 않게 한다.
  -->
  <section v-if="!hydrated || hasEntries" class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <div class="flex items-center gap-1.5">
        <History class="h-3.5 w-3.5" />
        <h2 class="retro-title">최근 계산</h2>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-destructive transition-colors"
        :disabled="!hasEntries"
        @click="handleClear"
      >
        <Trash2 class="h-3 w-3" />
        지우기
      </button>
    </div>
    <div v-if="!hydrated" class="space-y-3 px-4 py-4 sm:px-5 sm:py-4">
      <div class="h-4 w-20 rounded bg-muted/70" />
      <div class="space-y-2">
        <div class="h-12 rounded-xl border border-border/50 bg-muted/35" />
        <div class="h-12 rounded-xl border border-border/50 bg-muted/25" />
      </div>
    </div>

    <div v-else class="divide-y divide-border/50 min-h-[144px]">
      <RouterLink
        v-for="entry in entries"
        :key="`${entry.type}-${entry.timestamp}`"
        :to="entry.path"
        class="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted/40"
      >
        <span
          class="shrink-0 rounded-md px-1.5 py-0.5 text-tiny font-semibold"
          :class="(TYPE_CONFIG[entry.type] ?? FALLBACK_BADGE).class"
        >
          {{ (TYPE_CONFIG[entry.type] ?? FALLBACK_BADGE).label }}
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
