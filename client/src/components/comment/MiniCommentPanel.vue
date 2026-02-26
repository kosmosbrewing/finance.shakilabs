<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { MessageCircle, Send, EyeOff } from "lucide-vue-next";

type SortTab = "latest" | "popular";

type Comment = {
  id: string;
  text: string;
  timestamp: number;
  hidden: boolean;
};

const props = withDefaults(
  defineProps<{
    pageKey: string;
    title?: string;
    maxLength?: number;
    showSortTabs?: boolean;
  }>(),
  { title: "익명 게시판", maxLength: 300, showSortTabs: false }
);

const storageKey = computed(() => `finance-comments:v1:${props.pageKey}`);
const inputText = ref("");
const sortTab = ref<SortTab>("latest");

function loadComments(): Comment[] {
  try {
    const raw = localStorage.getItem(storageKey.value);
    if (!raw) return [];
    return JSON.parse(raw) as Comment[];
  } catch {
    return [];
  }
}

function saveComments(list: Comment[]): void {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(list));
  } catch {
    // storage full
  }
}

const comments = ref<Comment[]>(loadComments());

watch(() => props.pageKey, () => {
  comments.value = loadComments();
});

const sortedComments = computed(() => {
  const visible = comments.value.filter((c) => !c.hidden);
  if (sortTab.value === "popular") {
    return [...visible].sort((a, b) => b.timestamp - a.timestamp);
  }
  return [...visible].sort((a, b) => b.timestamp - a.timestamp);
});

function addComment(): void {
  const text = inputText.value.trim();
  if (!text || text.length > props.maxLength) return;

  const entry: Comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text,
    timestamp: Date.now(),
    hidden: false,
  };

  comments.value = [entry, ...comments.value].slice(0, 50);
  saveComments(comments.value);
  inputText.value = "";
}

function hideComment(id: string): void {
  comments.value = comments.value.map((c) =>
    c.id === id ? { ...c, hidden: true } : c
  );
  saveComments(comments.value);
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">{{ title }}</h2>
      <span class="retro-kbd">
        <MessageCircle class="h-3 w-3" />
        {{ sortedComments.length }}
      </span>
    </div>

    <div class="retro-panel-content space-y-3">
      <div v-if="showSortTabs" class="flex gap-1">
        <button
          v-for="tab in (['latest', 'popular'] as const)"
          :key="tab"
          type="button"
          class="rounded-lg px-2.5 py-1 text-tiny font-semibold transition-colors"
          :class="sortTab === tab ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'"
          @click="sortTab = tab"
        >
          {{ tab === 'latest' ? '최신' : '인기' }}
        </button>
      </div>

      <form class="flex gap-2" @submit.prevent="addComment">
        <input
          v-model="inputText"
          type="text"
          :maxlength="maxLength"
          :placeholder="`예: 건보료 14만원이면 연봉 얼마일까?`"
          class="flex-1 rounded-lg border border-border/80 bg-background px-3 py-2 text-caption text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
        />
        <button
          type="submit"
          :disabled="!inputText.trim()"
          class="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-primary transition-all duration-200 hover:bg-primary/12 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send class="h-3.5 w-3.5" />
        </button>
      </form>

      <ul v-if="sortedComments.length" class="space-y-2 max-h-64 overflow-y-auto">
        <li
          v-for="comment in sortedComments"
          :key="comment.id"
          class="group rounded-lg border border-border/40 bg-muted/10 px-3 py-2 text-caption"
        >
          <p class="text-foreground break-words">{{ comment.text }}</p>
          <div class="mt-1 flex items-center justify-between text-tiny text-muted-foreground">
            <span>{{ formatTime(comment.timestamp) }}</span>
            <button
              type="button"
              class="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
              title="이 댓글 숨기기"
              @click="hideComment(comment.id)"
            >
              <EyeOff class="h-3 w-3" />
              이 댓글 숨기기
            </button>
          </div>
        </li>
      </ul>

      <p v-else class="text-center text-caption text-muted-foreground py-4">
        아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
      </p>
    </div>
  </section>
</template>
