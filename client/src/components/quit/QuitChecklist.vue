<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { QUIT_CHECKLIST, TOTAL_ITEMS } from "@/data/quitChecklist";

const STORAGE_KEY = "salary-calc:quit-checklist:v1";

// 유효한 id 집합 (localStorage 복원 시 검증용)
const VALID_IDS = new Set(
  QUIT_CHECKLIST.flatMap((cat) => cat.items.map((item) => item.id)),
);

const checkedIds = ref<Set<string>>(new Set());

// localStorage에서 복원 + 유효 id만 필터
onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const ids: unknown[] = JSON.parse(saved);
      checkedIds.value = new Set(
        ids.filter((id): id is string => typeof id === "string" && VALID_IDS.has(id)),
      );
    }
  } catch {
    // 손상된 데이터 무시
  }
});

// 변경 시 자동 저장
watch(
  checkedIds,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...val]));
    } catch {
      // 용량 초과·프라이빗 모드 등 무시
    }
  },
  { deep: true },
);

const completedCount = computed(() => checkedIds.value.size);
const isAllDone = computed(() => completedCount.value === TOTAL_ITEMS);
const progressPercent = computed(
  () => `${(completedCount.value / TOTAL_ITEMS) * 100}%`,
);

function toggle(id: string) {
  const next = new Set(checkedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  checkedIds.value = next;
}

function resetAll() {
  checkedIds.value = new Set();
}
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">퇴사 체크리스트</h2>
      <span class="retro-kbd">{{ completedCount }}/{{ TOTAL_ITEMS }}</span>
    </div>

    <!-- 프로그레스 바 -->
    <div class="h-1 bg-muted">
      <div
        class="h-full transition-all duration-300 ease-out"
        :class="isAllDone ? 'bg-[hsl(var(--status-success))]' : 'bg-primary'"
        :style="{ width: progressPercent }"
      />
    </div>

    <div class="retro-panel-content space-y-4">
      <div v-for="category in QUIT_CHECKLIST" :key="category.title">
        <h3 class="text-caption font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {{ category.title }}
        </h3>

        <ul class="retro-board-list">
          <li
            v-for="item in category.items"
            :key="item.id"
            class="retro-board-item flex-col items-start gap-1 cursor-pointer touch-target select-none"
            @click="toggle(item.id)"
          >
            <label class="flex items-center gap-2 w-full pointer-events-none">
              <input
                type="checkbox"
                :checked="checkedIds.has(item.id)"
                class="size-4 shrink-0 rounded accent-[hsl(var(--primary))] pointer-events-auto"
                tabindex="0"
                @click.stop="toggle(item.id)"
                @keydown.enter.prevent="toggle(item.id)"
              />
              <span
                class="text-body transition-all duration-200"
                :class="checkedIds.has(item.id) ? 'line-through opacity-60' : ''"
              >
                {{ item.label }}
              </span>
            </label>
            <p class="text-tiny text-muted-foreground ml-6">
              {{ item.tip }}
            </p>
          </li>
        </ul>
      </div>

      <!-- 초기화 버튼: 1개 이상 체크 시 표시 -->
      <button
        v-if="completedCount > 0"
        class="retro-button-subtle text-caption text-muted-foreground"
        @click.stop="resetAll"
      >
        초기화
      </button>
    </div>
  </section>
</template>
