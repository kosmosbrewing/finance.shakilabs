<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ThumbsUp, ThumbsDown, Share2 } from "lucide-vue-next";
import MiniCommentPanel from "@/components/comment/MiniCommentPanel.vue";

type FeedbackState = "none" | "helpful" | "not-helpful";

const props = defineProps<{
  pageKey: string;
}>();

const emit = defineEmits<{ 'share-request': [] }>();

const feedbackStorageKey = computed(() => `finance-feedback:v1:${props.pageKey}`);
const feedback = ref<FeedbackState>("none");

function loadFeedback(): void {
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
  try {
    localStorage.setItem(feedbackStorageKey.value, value);
  } catch {
    // 용량 초과·프라이빗 모드 등 무시
  }
}

watch(() => props.pageKey, () => loadFeedback(), { immediate: true });
</script>

<template>
  <aside class="space-y-4">
    <!-- 피드백 위젯 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-panel-content space-y-3">
        <p class="text-body font-semibold text-foreground">
          이 계산기가 도움이 됐나요?
        </p>

        <!-- 피드백 전 -->
        <div v-if="feedback === 'none'" class="flex gap-2">
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2.5 text-caption font-semibold transition-all duration-200 hover:border-primary/50 hover:text-primary hover:scale-[1.02]"
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
        <div v-else class="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-caption text-foreground space-y-2">
          <template v-if="feedback === 'helpful'">
            <p>피드백 감사합니다! 더 정확한 계산기를 만들겠습니다.</p>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-background px-3 py-2 text-caption font-semibold text-primary transition-all duration-200 hover:bg-primary/10 hover:scale-[1.02] w-full justify-center"
              @click="emit('share-request')"
            >
              <Share2 class="h-3.5 w-3.5" />
              친구에게도 공유해보세요
            </button>
          </template>
          <template v-else>
            소중한 의견 감사합니다. 개선에 반영하겠습니다.
          </template>
        </div>
      </div>
    </section>

    <MiniCommentPanel
      :page-key="props.pageKey"
      show-sort-tabs
      title="익명 게시판"
      :max-length="300"
    />
  </aside>
</template>
