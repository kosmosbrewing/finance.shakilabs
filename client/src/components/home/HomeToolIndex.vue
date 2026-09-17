<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ArrowRight } from "lucide-vue-next";
import {
  HOME_ALL_LINK,
  HOME_HUB_GROUPS,
} from "../../../scripts/home-content.mjs";

// 홈의 뼈대는 도구 인덱스다(loan `/loan/` 패턴). 개편 전에는 "대표 계산기 바로가기"가
// 산문 두 덩어리 뒤 세 번째 자리에서 15개만 보여줘 나머지 11개로 가는 길이 본문에 없었다.
// 목록·묶음·순서는 scripts/home-content.mjs 한 곳에서 오고, 프리렌더 링크 목록과
// ItemList 스키마도 같은 배열에서 파생된다.
defineProps<{
  heading: string;
  intro: string;
}>();
</script>

<template>
  <section class="retro-panel" aria-labelledby="home-hub-title">
    <div class="retro-titlebar">
      <h2 id="home-hub-title" class="retro-title">{{ heading }}</h2>
    </div>
    <div class="retro-panel-content space-y-4">
      <p class="break-keep text-caption text-muted-foreground">{{ intro }}</p>

      <!-- 26줄이라 카드가 아니라 행이다. 카드 그리드로 깔면 한 화면에 5~6개밖에 안 들어와
           "전체 목록"이라는 약속을 화면이 못 지킨다. 행 끝 화살표가 카드의 "계산하기 →"와
           같은 어포던스를 맡는다. -->
      <div class="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="group in HOME_HUB_GROUPS" :key="group.id">
          <h3 class="mb-1.5 text-body font-bold text-foreground">
            <span class="mr-1" aria-hidden="true">{{ group.icon }}</span>{{ group.title }}
          </h3>
          <ul class="border-y border-border/60">
            <li
              v-for="item in group.items"
              :key="item.to"
              class="border-t border-border/40 first:border-t-0"
            >
              <RouterLink
                :to="item.to"
                data-tool-link
                class="group flex min-h-11 items-center gap-2 px-1 py-2 no-underline transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span class="min-w-0 flex-1">
                  <span class="block break-keep text-caption font-semibold text-foreground">
                    {{ item.label }}
                  </span>
                  <span class="mt-0.5 block break-keep text-tiny text-muted-foreground">
                    {{ item.desc }}
                  </span>
                </span>
                <span
                  class="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <RouterLink :to="HOME_ALL_LINK.to" class="pill-link sh-pill">
        {{ HOME_ALL_LINK.label }}
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </RouterLink>
    </div>
  </section>
</template>
