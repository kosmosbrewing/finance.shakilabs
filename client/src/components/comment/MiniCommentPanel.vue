<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { MessageSquare, Send, ThumbsUp, Trash2, EyeOff } from "lucide-vue-next";
import { showAlert } from "@/composables/useAlert";
import { isApiConfigured } from "@/api/helpers";
import { fetchComments, createComment } from "@/api/comments";
import type { Comment } from "@/api/types";
import WittyState from "@/components/common/WittyState.vue";

type LocalCommentMeta = {
  likes: number;
  hideVotes: number;
  reaction: "like" | "hide" | "none";
  hidden: boolean;
};

type SortMode = "latest" | "popular";

const props = withDefaults(
  defineProps<{
    pageKey: string;
    title?: string;
    showSortTabs?: boolean;
    initialSortMode?: SortMode;
    maxLength?: number;
  }>(),
  {
    title: "익명 한마디",
    showSortTabs: false,
    initialSortMode: "latest",
    maxLength: 100,
  }
);

const comments = ref<Comment[]>([]);
const loading = ref(false);
const submitting = ref(false);
const loadError = ref(false);
const content = ref("");
const activeSort = ref<SortMode>(props.initialSortMode);
const localMeta = ref<Record<string, LocalCommentMeta>>({});

const configured = isApiConfigured();
const charCount = computed(() => content.value.length);
const canSubmit = computed(
  () =>
    content.value.trim().length > 0 &&
    content.value.length <= props.maxLength &&
    !submitting.value
);

const storageKey = computed(() => `comment-meta:v1:${props.pageKey}`);

function defaultMeta(): LocalCommentMeta {
  return {
    likes: 0,
    hideVotes: 0,
    reaction: "none",
    hidden: false,
  };
}

function readMeta(commentId: string): LocalCommentMeta {
  return localMeta.value[commentId] || defaultMeta();
}

function saveLocalMeta(): void {
  localStorage.setItem(storageKey.value, JSON.stringify(localMeta.value));
}

function loadLocalMeta(): void {
  try {
    const raw = localStorage.getItem(storageKey.value);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, LocalCommentMeta>;
    localMeta.value = parsed;
  } catch {
    localMeta.value = {};
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR");
}

function getLikeCount(comment: Comment): number {
  return Math.max(0, (comment.likeCount || 0) + readMeta(comment.id).likes);
}

function getHideCount(comment: Comment): number {
  return Math.max(0, (comment.dislikeCount || 0) + readMeta(comment.id).hideVotes);
}

const hiddenCount = computed(
  () => comments.value.filter((comment) => readMeta(comment.id).hidden).length
);

const visibleComments = computed(() =>
  comments.value.filter((comment) => !readMeta(comment.id).hidden)
);

const sortedVisibleComments = computed(() => {
  const rows = [...visibleComments.value];
  if (activeSort.value === "popular") {
    return rows.sort((a, b) => {
      const likeGap = getLikeCount(b) - getLikeCount(a);
      if (likeGap !== 0) return likeGap;
      const hideGap = getHideCount(a) - getHideCount(b);
      if (hideGap !== 0) return hideGap;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  return rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

async function loadComments(): Promise<void> {
  if (!configured) return;
  loading.value = true;
  loadError.value = false;
  try {
    comments.value = await fetchComments(props.pageKey);
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

async function handleSubmit(): Promise<void> {
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    const newComment = await createComment({
      content: content.value.trim(),
      pageKey: props.pageKey,
    });
    comments.value.unshift(newComment);
    content.value = "";
    showAlert("한마디가 등록됐습니다");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "댓글 등록에 실패했습니다";
    showAlert(message, { type: "error" });
  } finally {
    submitting.value = false;
  }
}

function applyLike(commentId: string): void {
  const current = readMeta(commentId);
  if (current.reaction === "like") return;

  const next: LocalCommentMeta = { ...current };
  if (next.reaction === "hide" && next.hideVotes > 0) {
    next.hideVotes -= 1;
  }
  next.likes += 1;
  next.reaction = "like";
  next.hidden = false;

  localMeta.value = {
    ...localMeta.value,
    [commentId]: next,
  };
  saveLocalMeta();
}

function applyHide(commentId: string): void {
  const current = readMeta(commentId);
  if (current.reaction === "hide" && current.hidden) return;

  const next: LocalCommentMeta = { ...current };
  if (next.reaction === "like" && next.likes > 0) {
    next.likes -= 1;
  }
  next.hideVotes += 1;
  next.reaction = "hide";
  next.hidden = true;

  localMeta.value = {
    ...localMeta.value,
    [commentId]: next,
  };
  saveLocalMeta();
}

function hideComment(commentId: string): void {
  const current = readMeta(commentId);
  localMeta.value = {
    ...localMeta.value,
    [commentId]: {
      ...current,
      hidden: true,
    },
  };
  saveLocalMeta();
}

function restoreHiddenComments(): void {
  const next: Record<string, LocalCommentMeta> = {};

  Object.entries(localMeta.value).forEach(([commentId, meta]) => {
    next[commentId] = {
      ...meta,
      hidden: false,
      reaction: meta.reaction === "hide" ? "none" : meta.reaction,
    };
  });

  localMeta.value = next;
  saveLocalMeta();
}

onMounted(() => {
  loadLocalMeta();
  loadComments();
});

watch(
  () => props.pageKey,
  () => {
    loadLocalMeta();
    loadComments();
  }
);

watch(
  () => props.initialSortMode,
  (next) => {
    activeSort.value = next;
  }
);
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">
        <MessageSquare class="inline h-3.5 w-3.5 mr-1" />
        {{ props.title }}
      </h2>
      <span class="retro-kbd">{{ sortedVisibleComments.length }}개</span>
    </div>

    <div class="retro-panel-content space-y-3">
      <div v-if="props.showSortTabs" class="flex gap-2">
        <button
          type="button"
          class="touch-target inline-flex items-center rounded-lg border px-3 py-1.5 text-caption font-semibold transition-all duration-200 hover:scale-[1.02]"
          :class="activeSort === 'latest' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:text-foreground'"
          @click="activeSort = 'latest'"
        >
          최신글
        </button>
        <button
          type="button"
          class="touch-target inline-flex items-center rounded-lg border px-3 py-1.5 text-caption font-semibold transition-all duration-200 hover:scale-[1.02]"
          :class="activeSort === 'popular' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:text-foreground'"
          @click="activeSort = 'popular'"
        >
          인기글
        </button>
      </div>

      <WittyState
        v-if="!configured"
        type="empty"
        title="댓글 API 미설정"
        description="VITE_API_BASE를 설정하면 익명 댓글이 열립니다."
      />

      <template v-else>
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <input
              v-model="content"
              type="text"
              class="retro-input pr-14"
              placeholder="예: 건보료 14만원이면 연봉 얼마일까?"
              :maxlength="props.maxLength"
              aria-label="댓글 내용 입력"
              @keyup.enter="handleSubmit"
            />
            <span class="absolute right-2 top-1/2 -translate-y-1/2 text-caption text-muted-foreground tabular-nums">
              {{ charCount }}/{{ props.maxLength }}
            </span>
          </div>
          <button
            type="button"
            class="retro-button touch-target px-3"
            :disabled="!canSubmit"
            aria-label="댓글 전송"
            @click="handleSubmit"
          >
            <Send class="h-4 w-4" />
          </button>
        </div>

        <div v-if="loading">
          <WittyState type="loading" title="댓글 불러오는 중" description="잠깐만요, 한마디들을 모으는 중입니다." />
        </div>

        <div v-else-if="loadError">
          <WittyState type="error" title="댓글 로딩 실패" description="네트워크 상태를 확인하고 다시 시도해주세요." />
        </div>

        <div v-else-if="sortedVisibleComments.length === 0">
          <WittyState type="empty" title="첫 댓글의 주인공을 기다리는 중" description="분위기를 여는 한마디를 남겨보세요." />
        </div>

        <div v-else class="retro-board-list">
          <div
            v-for="comment in sortedVisibleComments"
            :key="comment.id"
            class="retro-board-item flex-col items-start gap-2"
          >
            <div class="flex items-center gap-2 w-full">
              <span class="text-caption font-semibold text-primary">{{ comment.nickname || '익명' }}</span>
              <span class="text-caption text-muted-foreground">{{ formatDate(comment.createdAt) }}</span>
            </div>

            <p class="text-caption text-foreground break-all w-full">
              {{ comment.content }}
            </p>

            <div class="flex w-full flex-wrap items-center gap-2 text-caption">
              <button
                type="button"
                class="inline-flex touch-target min-h-11 items-center gap-1 rounded border border-border/60 px-3 py-1.5 hover:border-primary/50"
                @click="applyLike(comment.id)"
              >
                <ThumbsUp class="h-3 w-3" />
                좋아요 {{ getLikeCount(comment) }}
              </button>

              <button
                type="button"
                class="inline-flex touch-target min-h-11 items-center gap-1 rounded border border-status-caution/40 px-3 py-1.5 text-status-caution hover:bg-status-caution/10"
                @click="applyHide(comment.id)"
              >
                <EyeOff class="h-3 w-3" />
                지워버려 {{ getHideCount(comment) }}
              </button>

              <button
                type="button"
                class="inline-flex touch-target min-h-11 items-center gap-1 rounded border border-status-danger/40 px-3 py-1.5 text-status-danger hover:bg-status-danger/10"
                @click="hideComment(comment.id)"
              >
                <Trash2 class="h-3 w-3" />
                숨김
              </button>
            </div>
          </div>
        </div>

        <div v-if="hiddenCount > 0" class="flex items-center justify-between border border-border/60 bg-muted/20 px-3 py-2 text-caption">
          <span>숨긴 댓글 {{ hiddenCount }}개</span>
          <button type="button" class="retro-button-subtle" @click="restoreHiddenComments">다시 보기</button>
        </div>
      </template>
    </div>
  </section>
</template>
