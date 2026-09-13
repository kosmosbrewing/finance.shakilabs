<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from "vue";
import { ThumbsUp, ThumbsDown } from "lucide-vue-next";
import CommentPanelFallback from "@/components/comment/CommentPanelFallback.vue";

type FeedbackState = "none" | "helpful" | "not-helpful";

const MiniCommentPanel = defineAsyncComponent({
  loader: () => import("@/components/comment/MiniCommentPanel.vue"),
  suspensible: false,
  timeout: 10000,
  errorComponent: CommentPanelFallback,
});

const props = defineProps<{
  pageKey: string;
}>();

const feedbackStorageKey = computed(() => `finance-feedback:v1:${props.pageKey}`);
const feedback = ref<FeedbackState>("none");
const isClientReady = ref(false);
const showCommentPanel = ref(false);
let commentPanelTimer: ReturnType<typeof setTimeout> | null = null;

function loadFeedback(): void {
  if (typeof window === "undefined") return;

  feedback.value = "none";
  try {
    const saved = localStorage.getItem(feedbackStorageKey.value);
    if (saved === "helpful" || saved === "not-helpful") {
      feedback.value = saved;
    }
  } catch {
    // 무시
  }
}

function submitFeedback(value: "helpful" | "not-helpful"): void {
  if (feedback.value !== "none") return;
  feedback.value = value;
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(feedbackStorageKey.value, value);
  } catch {
    // 용량 초과·프라이빗 모드 등 무시
  }
}

watch(() => props.pageKey, () => {
  if (!isClientReady.value) return;
  loadFeedback();
});

onMounted(() => {
  isClientReady.value = true;
  loadFeedback();
  commentPanelTimer = window.setTimeout(() => {
    showCommentPanel.value = true;
  }, 300);
});

onUnmounted(() => {
  if (commentPanelTimer) {
    clearTimeout(commentPanelTimer);
    commentPanelTimer = null;
  }
});
</script>

<template>
  <aside class="space-y-4">
    <!-- 피드백 위젯 -->
    <section class="retro-panel overflow-hidden">
      <div
        class="retro-panel-content space-y-3"
        :class="feedback === 'none' ? 'min-h-[150px]' : 'min-h-[126px]'"
      >
        <p class="text-body font-semibold text-foreground">
          이 계산기가 도움이 됐나요?
        </p>

        <!-- 피드백 전 -->
        <div v-if="feedback === 'none'" class="flex gap-2">
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2.5 text-caption font-semibold transition-all duration-200 hover:border-foreground/40 hover:text-foreground hover:scale-[1.02]"
            @click="submitFeedback('helpful')"
          >
            <ThumbsUp class="h-3.5 w-3.5" />
            도움됐어요
          </button>
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2.5 text-caption font-semibold transition-all duration-200 hover:border-destructive/50 hover:text-destructive hover:scale-[1.02]"
            @click="submitFeedback('not-helpful')"
          >
            <ThumbsDown class="h-3.5 w-3.5" />
            아쉬워요
          </button>
        </div>

        <!-- 피드백 후 -->
        <div
          v-else
          class="rounded-xl border border-border bg-muted/60 px-3 py-3 text-caption text-foreground space-y-2"
        >
          <template v-if="feedback === 'helpful'">
            <p>피드백 감사합니다! 더 정확한 계산기를 만들겠습니다.</p>
          </template>
          <template v-else>
            <p>소중한 의견 감사합니다. 개선에 반영하겠습니다.</p>
          </template>
          <p class="text-[0.72rem] leading-5 text-muted-foreground">
            더 남길 내용이 있으면 아래 익명 게시판에 바로 적어주세요.
          </p>
        </div>
      </div>
    </section>

    <!-- 높이 예약은 비동기 청크가 들어오기 전까지만 한다. 패널이 뜬 뒤에도 360px를
         붙잡아 두면, 글이 없을 때 빈 공간만 남는다(감사 §3 High #3 "미사용 시 영역 축소"). -->
    <div :class="showCommentPanel ? '' : 'min-h-[360px]'">
      <MiniCommentPanel
        v-if="showCommentPanel"
        :page-key="props.pageKey"
        title="익명 게시판"
        :max-length="300"
      />
      <section v-else class="retro-panel overflow-hidden h-full">
        <div class="retro-titlebar">
          <h2 class="retro-title">익명 게시판</h2>
          <span class="text-tiny text-muted-foreground">로딩 준비 중</span>
        </div>
        <div class="retro-panel-content space-y-3">
          <div class="h-20 rounded-xl border border-border/60 bg-muted/25" />
          <div class="h-28 rounded-xl border border-border/60 bg-muted/20" />
        </div>
      </section>
    </div>
  </aside>
</template>
