<script setup lang="ts">
import { onMounted } from "vue";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const props = defineProps<{
  slot: string;
  label?: string;
}>();

const publisherId = (import.meta.env.VITE_ADSENSE_PUBLISHER_ID || "").trim();

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

onMounted(() => {
  ensureAdsenseScript();
  if (!publisherId) return;

  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    // no-op
  }
});
</script>

<template>
  <section class="retro-panel border border-border/70 p-3">
    <p class="mb-2 text-caption text-muted-foreground">
      {{ label || "광고 영역" }}
    </p>

    <div v-if="publisherId" class="min-h-[80px]">
      <ins
        class="adsbygoogle"
        style="display:block"
        :data-ad-client="publisherId"
        :data-ad-slot="slot"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>

    <div v-else class="flex min-h-[80px] items-center justify-center border border-dashed border-border/60 text-caption text-muted-foreground">
      AdSense 미설정 (VITE_ADSENSE_PUBLISHER_ID)
    </div>
  </section>
</template>
