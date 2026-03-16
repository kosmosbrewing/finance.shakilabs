<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

defineProps<{
  slot: string;
  label?: string;
}>();

const publisherId = (import.meta.env.VITE_ADSENSE_PUBLISHER_ID || "").trim();
const isDev = import.meta.env.DEV;
const slotRef = ref<HTMLElement | null>(null);
const isActivated = ref(false);
let observer: IntersectionObserver | null = null;

function ensureAdsenseScript(): void {
  if (!publisherId) return;

  const existing = document.querySelector('script[data-adsense="true"]');
  if (existing) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.crossOrigin = "anonymous";
  script.dataset.adsense = "true";
  document.head.appendChild(script);
}

const reserveHeightClass = computed(() =>
  publisherId
    ? "min-h-[250px] sm:min-h-[180px] lg:min-h-[160px]"
    : "min-h-[96px]"
);

async function activateSlot(): Promise<void> {
  if (isActivated.value) return;
  isActivated.value = true;

  ensureAdsenseScript();
  if (!publisherId) return;

  await nextTick();
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    // no-op
  }
}

onMounted(() => {
  if (!publisherId) return;

  if (typeof window.IntersectionObserver !== "function" || !slotRef.value) {
    void activateSlot();
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (!entry?.isIntersecting) return;
      void activateSlot();
      observer?.disconnect();
      observer = null;
    },
    { rootMargin: "300px 0px" }
  );

  observer.observe(slotRef.value);
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <section
    v-if="publisherId || isDev"
    ref="slotRef"
    class="retro-panel p-3"
  >
    <p class="mb-2 text-caption text-muted-foreground">
      {{ label || "광고 영역" }}
    </p>

    <div
      v-if="publisherId"
      class="overflow-hidden rounded-lg border border-border/50 bg-muted/20"
      :class="reserveHeightClass"
    >
      <ins
        v-if="isActivated"
        class="adsbygoogle"
        style="display:block"
        :data-ad-client="publisherId"
        :data-ad-slot="slot"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-caption text-muted-foreground"
      >
        광고 로딩 준비 중
      </div>
    </div>

    <div
      v-else-if="isDev"
      class="flex items-center justify-center border border-dashed border-border/60 rounded-lg text-caption text-muted-foreground"
      :class="reserveHeightClass"
    >
      광고 영역 (개발 모드)
    </div>
  </section>
</template>
