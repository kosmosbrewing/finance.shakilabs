<script setup lang="ts">
import { RouterLink } from "vue-router";
import { SCENARIO_CHAINS as scenarioChains } from "../../../scripts/scenario-chains.mjs";

// 상황별 계산 순서는 도구 인덱스 "다음"이다. 계산기 하나로 끝나지 않는 사건(퇴사·이직 등)을
// 순서로 푸는 보조 경로라서, 인덱스보다 위에 두면 "무엇이 있는지"보다 "어떻게 읽는지"를
// 먼저 설명하게 된다 — 개편 전 홈이 그 상태였다.
defineProps<{
  heading: string;
  body: string;
}>();
</script>

<template>
  <section class="retro-panel" aria-labelledby="home-guides-title">
    <div class="retro-titlebar">
      <h2 id="home-guides-title" class="retro-title">{{ heading }}</h2>
    </div>
    <div class="retro-panel-content space-y-3">
      <p class="break-keep text-caption text-muted-foreground">{{ body }}</p>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RouterLink
          v-for="chain in scenarioChains"
          :key="chain.slug"
          :to="chain.route"
          class="group block rounded-lg border border-border/40 bg-background p-3 transition-colors hover:border-foreground/30 hover:bg-muted/40"
        >
          <p class="text-caption font-semibold text-foreground">
            {{ chain.name }}
          </p>
          <p class="mt-0.5 text-tiny text-muted-foreground">
            {{ chain.steps.length }}단계 · {{ chain.steps[0].label }}부터
          </p>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
