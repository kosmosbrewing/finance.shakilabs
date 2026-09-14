<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    messages: readonly string[];
    intervalMs?: number;
  }>(),
  {
    intervalMs: 4000,
  }
);

const currentIndex = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
let mediaQuery: MediaQueryList | null = null;
const prefersReducedMotion = ref(false);

const safeMessages = computed(() =>
  props.messages.length > 0
    ? props.messages
    : ["세율과 보험료율은 해마다 달라질 수 있어요."]
);

const currentMessage = computed(
  () => safeMessages.value[currentIndex.value % safeMessages.value.length]
);

function rotateMessage(): void {
  currentIndex.value = (currentIndex.value + 1) % safeMessages.value.length;
}

function stopTimer(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

function startTimer(): void {
  if (prefersReducedMotion.value || document.visibilityState === "hidden" || timer) {
    return;
  }
  timer = setInterval(rotateMessage, props.intervalMs);
}

function handleVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    stopTimer();
    return;
  }
  startTimer();
}

function handleMotionPreferenceChange(event: MediaQueryListEvent): void {
  prefersReducedMotion.value = event.matches;
  if (event.matches) {
    stopTimer();
    return;
  }
  startTimer();
}

function addMotionListener(): void {
  if (!mediaQuery) return;
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleMotionPreferenceChange);
    return;
  }
  mediaQuery.addListener(handleMotionPreferenceChange);
}

function removeMotionListener(): void {
  if (!mediaQuery) return;
  if (typeof mediaQuery.removeEventListener === "function") {
    mediaQuery.removeEventListener("change", handleMotionPreferenceChange);
    return;
  }
  mediaQuery.removeListener(handleMotionPreferenceChange);
}

watch(
  () => [props.intervalMs, safeMessages.value.length] as const,
  () => {
    currentIndex.value = currentIndex.value % safeMessages.value.length;
    stopTimer();
    startTimer();
  }
);

onMounted(() => {
  if (typeof window === "undefined") return;
  mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  prefersReducedMotion.value = mediaQuery.matches;
  addMotionListener();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  startTimer();
});

onUnmounted(() => {
  stopTimer();
  removeMotionListener();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  mediaQuery = null;
});
</script>

<template>
  <div role="status" aria-live="polite" aria-atomic="true" class="w-full min-w-0">
    <Transition name="ticker-fade" mode="out-in">
      <!-- 본문 eyebrow로 내려온 뒤로는 폭이 컨테이너 전체라 문구가 잘리지 않는다.
           2줄까지 허용해 긴 고시 문구도 요점이 남게 한다(BL-005). -->
      <p :key="currentMessage" class="line-clamp-2 w-full min-w-0 text-left text-caption leading-snug">
        {{ currentMessage }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.ticker-fade-enter-active,
.ticker-fade-leave-active {
  transition: opacity 0.2s ease;
}

.ticker-fade-enter-from,
.ticker-fade-leave-to {
  opacity: 0;
}
</style>
