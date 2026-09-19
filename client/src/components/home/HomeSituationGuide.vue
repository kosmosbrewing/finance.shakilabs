<script setup lang="ts">
import { RouterLink } from "vue-router";
import {
  HOME_GUIDE,
  HOME_GUIDE_LINKS_H3,
  HOME_GUIDE_LINKS_INTRO,
} from "../../../scripts/home-content.mjs";
import { SCENARIO_CHAINS as scenarioChains } from "../../../scripts/scenario-chains.mjs";

// 홈의 종합 가이드 — loan 홈 SeoRichGuide와 같은 자리(맨 아래)와 같은 형식(h2 하나 + h3 절)이다.
//
// 왜 h3인가: 개편 전 홈은 안내 문단마다 h2를 하나씩 달아 h2가 10개였다. 상황별 안내는
// 서로 다른 절이 아니라 한 덩어리의 가이드이므로 h2 하나 아래 h3로 묶는다. 홈이 길어 보였던
// 원인은 총 자수가 아니라 같은 위계의 제목이 열 번 반복된 것이었다.
//
// 왜 맨 아래인가: 인덱스 화면의 약속은 "무엇이 있는지"를 먼저 보여주는 것이다. 읽는 법은
// 목록을 본 다음에 필요해진다.
</script>

<template>
  <section class="retro-panel" aria-labelledby="home-guide-title">
    <div class="retro-titlebar">
      <h2 id="home-guide-title" class="retro-title">{{ HOME_GUIDE.h2 }}</h2>
    </div>
    <div class="retro-panel-content space-y-4">
      <p class="max-w-[70ch] break-keep text-caption leading-relaxed text-muted-foreground">
        {{ HOME_GUIDE.intro }}
      </p>

      <div class="grid gap-4 md:grid-cols-3">
        <div v-for="section in HOME_GUIDE.sections" :key="section.h3" class="space-y-1.5">
          <h3 class="text-caption font-bold text-foreground">{{ section.h3 }}</h3>
          <p class="break-keep text-tiny leading-relaxed text-muted-foreground">
            {{ section.body }}
          </p>
        </div>
      </div>

      <!-- 가이드 4개는 카드가 아니라 알약 한 줄이다. 카드로 깔면 인덱스 화면 맨 아래에
           또 하나의 카드 그리드가 생겨 "목록이 두 번" 나온다(실측 128px → 95px). -->
      <div class="space-y-2 border-t border-border/40 pt-4">
        <h3 class="text-caption font-bold text-foreground">{{ HOME_GUIDE_LINKS_H3 }}</h3>
        <p class="break-keep text-tiny text-muted-foreground">{{ HOME_GUIDE_LINKS_INTRO }}</p>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="chain in scenarioChains"
            :key="chain.slug"
            :to="chain.route"
            class="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 text-caption font-semibold text-foreground no-underline transition-colors hover:border-foreground/30 hover:bg-muted/40"
          >
            {{ chain.name }}
            <span class="text-tiny font-normal text-muted-foreground">{{ chain.steps.length }}단계</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
