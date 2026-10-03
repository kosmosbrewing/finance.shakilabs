<script setup lang="ts">
import { Link } from "lucide-vue-next";

const props = defineProps<{
  show: boolean;
  kakaoBusy: boolean;
  summaryText: string;
}>();

const emit = defineEmits<{
  close: [];
  shareKakao: [];
  copyLink: [];
}>();

function handleAction(action: "kakao" | "link"): void {
  emit("close");
  if (action === "kakao") emit("shareKakao");
  else emit("copyLink");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="props.show"
        class="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div class="absolute inset-0 bg-black/60" @click="emit('close')" />
        <div class="relative z-10 mx-4 w-full max-w-sm translate-y-[10vh] retro-panel border border-border sm:translate-y-0">
          <div class="retro-titlebar">
            <h3 id="share-modal-title" class="retro-title-brand text-[1rem]!">공유하기</h3>
            <button class="retro-kbd text-xs" aria-label="공유 모달 닫기" @click="emit('close')">ESC</button>
          </div>

          <div class="space-y-3 p-4">
            <div
              v-if="props.summaryText"
              class="retro-panel-muted border border-border/40 px-3 py-2"
            >
              <p class="text-caption text-muted-foreground">현재 계산 조건</p>
              <p class="mt-1 break-words text-caption font-semibold">{{ props.summaryText }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button
                class="flex flex-col items-center gap-2 retro-panel-muted border border-border/40 p-3 transition-colors hover:border-yellow-400/60 disabled:opacity-50"
                :disabled="props.kakaoBusy"
                aria-label="카카오톡 공유"
                @click="handleAction('kakao')"
              >
                <img
                  src="/images/icons/kakaotalk-sharing-medium.png?v=1"
                  alt=""
                  aria-hidden="true"
                  class="h-6 w-6 object-contain"
                />
                <!-- v8 결함 수정(2026-10-03): 0.72rem(11.52px)였다 — 13px 토큰(text-caption)으로.
                     모달 폭(max-w-sm)·2열 그리드에서 "카카오톡 공유" 6자가 줄바꿈 없이 들어간다. -->
                <span class="text-center text-caption font-bold leading-tight whitespace-nowrap">카카오톡 공유</span>
              </button>

              <button
                class="flex flex-col items-center gap-2 retro-panel-muted border border-border/40 p-3 transition-colors hover:border-border/80"
                aria-label="공유 링크 복사"
                @click="handleAction('link')"
              >
                <Link class="h-6 w-6 text-muted-foreground" />
                <span class="text-center text-caption font-bold leading-tight whitespace-nowrap">링크 복사</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.retro-title {
  font-size: 1rem !important;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
