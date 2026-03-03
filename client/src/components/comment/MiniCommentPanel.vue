<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Loader2, ThumbsUp } from "lucide-vue-next";
import { apiFetch } from "@/api/helpers";
import type { Comment } from "@/api/types";

const props = withDefaults(
  defineProps<{
    pageKey: string;
    title?: string;
    maxLength?: number;
  }>(),
  { title: "익명 게시판", maxLength: 300 }
);

type Tab = "recent" | "popular";

const LIKED_STORAGE_KEY = "finance-liked-comments:v1";

const inputText = ref("");
const recentComments = ref<Comment[]>([]);
const popularComments = ref<Comment[]>([]);
const activeTab = ref<Tab>("recent");
const isLoading = ref(false);
const isSubmitting = ref(false);
const error = ref("");

// 좋아요한 댓글 ID 세트 (중복 방지)
const likedIds = ref<Set<string>>(loadLikedIds());

// 탭별 30초 캐시
let recentFetchedAt = 0;
let popularFetchedAt = 0;

const PAGE_LABELS: Record<string, string> = {
  "salary-calc": "연봉계산",
  "insurance-main": "건보료계산",
  "compare-main": "이직비교",
  "comprehensive-tax-main": "종합소득세",
  "quit-main": "퇴사시뮬",
  "withholding-main": "원천징수",
};

function getPageLabel(key: string): string {
  if (key.startsWith("salary-")) return "연봉계산";
  return PAGE_LABELS[key] ?? key;
}

function loadLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKED_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveLikedId(id: string): void {
  likedIds.value.add(id);
  try {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...likedIds.value]));
  } catch {
    // 용량 초과·프라이빗 모드 무시
  }
}

async function fetchRecent(force = false): Promise<void> {
  const now = Date.now();
  if (!force && recentFetchedAt && now - recentFetchedAt < 30_000) return;

  isLoading.value = true;
  error.value = "";
  try {
    const data = await apiFetch<{ comments: Comment[] }>(`/comments?limit=20`);
    recentComments.value = data.comments;
    recentFetchedAt = now;
  } catch {
    error.value = "댓글을 불러올 수 없습니다.";
  } finally {
    isLoading.value = false;
  }
}

async function fetchPopular(force = false): Promise<void> {
  const now = Date.now();
  if (!force && popularFetchedAt && now - popularFetchedAt < 30_000) return;

  isLoading.value = true;
  error.value = "";
  try {
    const data = await apiFetch<{ comments: Comment[] }>(`/comments?sort=popular&limit=20`);
    popularComments.value = data.comments;
    popularFetchedAt = now;
  } catch {
    error.value = "댓글을 불러올 수 없습니다.";
  } finally {
    isLoading.value = false;
  }
}

function switchTab(tab: Tab): void {
  activeTab.value = tab;
  if (tab === "recent") fetchRecent();
  else fetchPopular();
}

async function addComment(): Promise<void> {
  const content = inputText.value.trim();
  if (!content || content.length > props.maxLength || isSubmitting.value) return;

  isSubmitting.value = true;
  error.value = "";
  try {
    const created = await apiFetch<Comment>("/comments", {
      method: "POST",
      body: JSON.stringify({ pageKey: props.pageKey, content }),
    });
    // 최근 탭 선두에 즉시 반영 (인기 탭은 좋아요 0이라 상단 노출 불필요)
    recentComments.value = [created, ...recentComments.value];
    inputText.value = "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : "댓글 등록에 실패했습니다.";
  } finally {
    isSubmitting.value = false;
  }
}

async function likeComment(comment: Comment): Promise<void> {
  if (likedIds.value.has(comment.id)) return;

  // 낙관적 업데이트 — 서버 응답 전 즉시 반영
  comment.likes += 1;
  saveLikedId(comment.id);

  try {
    await apiFetch(`/comments/${comment.id}/like`, { method: "POST" });
  } catch {
    // 실패 시 롤백
    comment.likes -= 1;
    likedIds.value.delete(comment.id);
  }
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

const contentLength = computed(() => inputText.value.length);
const activeComments = computed(() =>
  activeTab.value === "recent" ? recentComments.value : popularComments.value
);
const commentsCountLabel = computed(() => {
  const label = activeTab.value === "recent" ? "최근" : "인기";
  if (isLoading.value && activeComments.value.length === 0) {
    return `${label} 불러오는 중`;
  }
  return `${label} ${activeComments.value.length}개`;
});

// pageKey 변경 시 캐시 무효화 (다른 도메인 이동 시 최신 데이터 보장)
watch(() => props.pageKey, () => {
  recentFetchedAt = 0;
  fetchRecent(true);
});

// 초기 로드
fetchRecent();
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">{{ title }}</h2>
      <span class="text-tiny text-muted-foreground tabular-nums">{{ commentsCountLabel }}</span>
    </div>

    <!-- 탭 -->
    <div class="flex border-b border-border/70">
      <button
        type="button"
        class="flex-1 py-2 text-caption font-semibold transition-colors"
        :class="
          activeTab === 'recent'
            ? 'text-primary border-b-2 border-primary -mb-px bg-primary/5'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="switchTab('recent')"
      >
        최근
      </button>
      <button
        type="button"
        class="flex-1 py-2 text-caption font-semibold transition-colors"
        :class="
          activeTab === 'popular'
            ? 'text-primary border-b-2 border-primary -mb-px bg-primary/5'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="switchTab('popular')"
      >
        인기
      </button>
    </div>

    <div class="retro-panel-content space-y-2.5">
      <!-- 글쓰기 영역 -->
      <form @submit.prevent="addComment">
        <label class="mb-1 block text-tiny text-muted-foreground">익명 글쓰기</label>
        <div class="rounded-xl border border-input bg-card dark:bg-background">
          <textarea
            v-model="inputText"
            rows="3"
            :maxlength="maxLength"
            :disabled="isSubmitting"
            placeholder="한 줄 의견을 익명으로 남겨보세요"
            class="w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-caption text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div class="flex items-center justify-between border-t border-border/60 px-3 py-1.5">
            <span class="text-tiny tabular-nums text-muted-foreground">
              {{ contentLength }}/{{ maxLength }}
            </span>
            <button
              type="submit"
              :disabled="!inputText.trim() || isSubmitting"
              class="text-tiny font-semibold text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
            >
              <Loader2 v-if="isSubmitting" class="inline h-3 w-3 animate-spin" />
              <span v-else>등록</span>
            </button>
          </div>
        </div>
        <p v-if="error" class="mt-1 text-tiny text-destructive">{{ error }}</p>
      </form>

      <!-- 로딩 -->
      <div v-if="isLoading" class="flex items-center justify-center py-6">
        <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
      </div>

      <!-- 댓글 목록 -->
      <ul
        v-else-if="activeComments.length"
        class="max-h-72 overflow-y-auto divide-y divide-border/80 rounded-xl border border-border/70 bg-background"
      >
        <li
          v-for="comment in activeComments"
          :key="comment.id"
          class="px-4 py-2.5"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5 text-tiny text-muted-foreground">
              <span class="font-semibold text-foreground">{{ comment.nickname }}</span>
              <span>&middot;</span>
              <span>{{ formatTime(comment.createdAt) }}</span>
              <span>&middot;</span>
              <span class="rounded-full bg-primary/10 px-1.5 py-px text-primary font-medium">
                {{ getPageLabel(comment.pageKey) }}
              </span>
            </div>
            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors"
              :class="
                likedIds.has(comment.id)
                  ? 'text-primary border-primary/30 bg-primary/10 cursor-default'
                  : 'text-muted-foreground border-border/70 bg-background hover:text-primary hover:border-primary/40'
              "
              :disabled="likedIds.has(comment.id)"
              :aria-label="`댓글 좋아요 ${comment.likes}`"
              @click="likeComment(comment)"
            >
              <ThumbsUp class="h-3 w-3" />
              <span class="tabular-nums">{{ comment.likes }}</span>
            </button>
          </div>
          <p class="mt-0.5 text-caption text-foreground break-words leading-relaxed">
            {{ comment.content }}
          </p>
        </li>
      </ul>

      <!-- 빈 상태 -->
      <p v-else class="text-center text-caption text-muted-foreground py-4">
        첫 댓글을 남겨보세요
      </p>
    </div>
  </section>
</template>
