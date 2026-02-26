<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

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
let motionChangeHandler: ((event: MediaQueryListEvent) => void) | null = null;

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

onMounted(() => {
  mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  prefersReducedMotion.value = mediaQuery.matches;
  motionChangeHandler = (event: MediaQueryListEvent) => {
    prefersReducedMotion.value = event.matches;
    if (event.matches) {
      stopTimer();
      return;
    }
    startTimer();
  };
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", motionChangeHandler);
  } else {
    mediaQuery.addListener(motionChangeHandler);
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);
  startTimer();
});

onUnmounted(() => {
  stopTimer();
  if (mediaQuery && motionChangeHandler) {
    if (typeof mediaQuery.removeEventListener === "function") {
      mediaQuery.removeEventListener("change", motionChangeHandler);
    } else {
      mediaQuery.removeListener(motionChangeHandler);
    }
  }
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <div class="border-y border-border bg-muted/40 px-3 py-2" role="status" aria-live="polite" aria-atomic="true">
    <Transition name="ticker-fade" mode="out-in">
      <p :key="currentMessage" class="text-body text-foreground/85">
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
