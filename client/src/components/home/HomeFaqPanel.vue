<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import { HOME_FAQ_INTRO, HOME_FAQS } from "../../../scripts/home-content.mjs";

// 홈 FAQ는 접힌 상태로 시작한다. 인덱스 화면에서 문답 네 개를 펼쳐 두면 도구 목록이
// 화면 밖으로 밀리고, 그 순간 홈은 다시 "읽는 페이지"가 된다. <details>는 DOM에 텍스트가
// 그대로 남으므로 크롤러가 받는 본문은 줄지 않는다(은닉 텍스트가 아니라 점진적 공개).
//
// 질문·답은 scripts/home-content.mjs 한 곳에서 오고, 같은 배열이 프리렌더 본문과
// FAQPage 스키마도 만든다 — 화면·정적 HTML·구조화 데이터가 갈라질 수 없다.
</script>

<template>
  <section class="retro-panel" aria-labelledby="home-faq-title">
    <div class="retro-titlebar">
      <h2 id="home-faq-title" class="retro-title">자주 묻는 질문</h2>
    </div>
    <div class="retro-panel-content space-y-2">
      <p class="break-keep text-caption text-muted-foreground">{{ HOME_FAQ_INTRO }}</p>

      <details
        v-for="faq in HOME_FAQS"
        :key="faq.q"
        class="group retro-panel-muted px-4 py-2.5"
      >
        <summary
          class="flex cursor-pointer list-none items-start justify-between gap-3 text-caption font-semibold leading-snug text-foreground"
        >
          <span class="break-keep">{{ faq.q }}</span>
          <ChevronDown
            aria-hidden="true"
            class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </summary>
        <p class="mt-2 max-w-[65ch] break-keep pr-6 text-caption leading-relaxed text-muted-foreground">
          {{ faq.a }}
        </p>
      </details>
    </div>
  </section>
</template>
