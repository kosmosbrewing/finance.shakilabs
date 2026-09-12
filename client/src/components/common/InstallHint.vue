<script setup lang="ts">
// "홈 화면에 추가" 안내 — 한 줄. 배너·팝업·모달을 만들지 않는다.
// 브라우저가 설치 가능하다고 판단했을 때(beforeinstallprompt)만 나타나고,
// 이미 설치된 앱 안에서는 아예 그리지 않는다.
import { Download } from "lucide-vue-next";
import { usePwaInstall } from "@/composables/usePwaInstall";

const { canInstall, installed, promptInstall } = usePwaInstall();
</script>

<template>
  <p
    v-if="canInstall && !installed"
    data-install-hint
    class="flex items-center justify-center gap-1.5 text-caption text-muted-foreground"
  >
    <Download class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    <span>자주 쓰신다면</span>
    <button type="button" class="font-semibold text-primary underline" @click="promptInstall">
      홈 화면에 추가
    </button>
    <span>해 두면 앱처럼 바로 열립니다.</span>
  </p>
</template>
