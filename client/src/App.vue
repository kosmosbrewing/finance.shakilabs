<script setup lang="ts">
import { computed } from "vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import AlertHost from "@/components/ui/alert/AlertHost.vue";
import { clearRuntimeError, useRuntimeError } from "@/lib/runtimeError";
import { getPageGroup } from "@/utils/pageTracking";

const { runtimeError } = useRuntimeError();
const showBlockingRuntimeError = computed(
  () => runtimeError.hasError && runtimeError.blocking
);
const showInlineRuntimeError = computed(
  () => runtimeError.hasError && !runtimeError.blocking
);

function reloadPage(): void {
  clearRuntimeError();
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}
</script>

<template>
  <AppLayout>
    <section v-if="showInlineRuntimeError" class="container py-4">
      <div class="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1">
            <p class="font-semibold">일부 연결이 불안정합니다</p>
            <p>{{ runtimeError.message }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg border border-amber-400/70 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900"
            @click="clearRuntimeError"
          >
            닫기
          </button>
        </div>
      </div>
    </section>
    <section v-if="showBlockingRuntimeError" class="container py-6">
      <div class="retro-panel overflow-hidden">
        <div class="retro-titlebar">
          <h2 class="retro-title">화면을 불러오지 못했습니다</h2>
          <span class="text-tiny text-destructive">runtime error</span>
        </div>
        <div class="retro-panel-content space-y-3">
          <p class="text-body text-foreground">{{ runtimeError.message }}</p>
          <p class="text-caption text-muted-foreground">
            운영환경에서 본문이 비어 보일 때 원인 추적을 위해 상세 메시지를 함께 노출합니다.
          </p>
          <details class="retro-details">
            <summary class="retro-details-summary">
              <span>상세 오류 보기</span>
              <span class="retro-details-chevron" aria-hidden="true">▾</span>
            </summary>
            <div class="space-y-2 p-3 text-caption">
              <p><strong>context:</strong> {{ runtimeError.context || "-" }}</p>
              <p><strong>message:</strong> {{ runtimeError.detail || "-" }}</p>
              <p><strong>time:</strong> {{ runtimeError.updatedAt || "-" }}</p>
            </div>
          </details>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-xl border border-primary bg-primary px-3 py-2 text-caption font-semibold text-primary-foreground"
              @click="reloadPage"
            >
              새로고침
            </button>
            <button
              type="button"
              class="rounded-xl border border-border bg-background px-3 py-2 text-caption font-semibold text-foreground"
              @click="clearRuntimeError"
            >
              패널 닫기
            </button>
          </div>
        </div>
      </div>
    </section>
    <RouterView v-else v-slot="{ Component, route }">
      <Transition name="page-fade" mode="out-in">
        <component :is="Component" :key="getPageGroup(route.path)" />
      </Transition>
    </RouterView>
    <AlertHost />
  </AppLayout>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
