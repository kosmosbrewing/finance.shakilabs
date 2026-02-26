<script setup lang="ts">
import { Link, MessageCircle } from "lucide-vue-next";

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
  if (action === "kakao") emit("shareKakao");
  else emit("copyLink");
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="props.show"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div class="absolute inset-0 bg-black/60" @click="emit('close')" />
        <div class="relative z-10 w-full max-w-sm mx-4 retro-panel border border-border">
          <div class="retro-titlebar flex items-center justify-between">
            <h3 id="share-modal-title" class="retro-title text-body">공유하기</h3>
            <button class="retro-kbd text-tiny" aria-label="공유 모달 닫기" @click="emit('close')">ESC</button>
          </div>

          <div class="p-4 space-y-3">
            <div class="retro-panel-muted border border-border/40 px-3 py-2">
              <p class="text-caption text-muted-foreground">현재 계산 조건</p>
              <p class="text-caption font-semibold mt-1 break-words">{{ props.summaryText }}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <!-- 카카오톡 공유 -->
              <button
              class="flex flex-col items-center gap-2 retro-panel-muted border border-border/40 p-3 hover:border-primary/60 transition-colors disabled:opacity-50"
              :disabled="props.kakaoBusy"
              aria-label="카카오톡 공유"
              @click="handleAction('kakao')"
            >
              <MessageCircle class="h-6 w-6 text-status-warning" />
              <span class="text-tiny font-bold text-center leading-tight whitespace-nowrap">카카오톡 공유</span>
              </button>

              <!-- 링크 복사 -->
              <button
              class="flex flex-col items-center gap-2 retro-panel-muted border border-border/40 p-3 hover:border-border/80 transition-colors"
              aria-label="공유 링크 복사"
              @click="handleAction('link')"
            >
              <Link class="h-6 w-6 text-muted-foreground" />
              <span class="text-tiny font-bold text-center leading-tight whitespace-nowrap">링크 복사</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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
