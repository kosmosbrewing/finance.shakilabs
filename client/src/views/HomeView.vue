<script setup lang="ts">
import { computed } from "vue";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import RelatedServices from "@/components/common/RelatedServices.vue";
import HomeQuickCalc from "@/components/home/HomeQuickCalc.vue";
import HomeToolIndex from "@/components/home/HomeToolIndex.vue";
import HomeScenarioChains from "@/components/home/HomeScenarioChains.vue";
import { DEFAULT_SITE_URL } from "@/lib/site";
import {
  HOME_DESCRIPTION,
  HOME_H1,
  HOME_INTRO,
  HOME_LINKS_H2,
  HOME_LINKS_INTRO,
  HOME_SECTIONS,
} from "../../scripts/home-content.mjs";

// 제목·본문은 프리렌더(scripts/home-content.mjs)와 같은 소스를 쓴다.
// 크롤러가 보는 정적 HTML과 사용자가 보는 화면이 갈라지지 않게 하는 것이 이 화면의 존재 이유다.
const seoTitle = "2026 연봉 실수령액 계산기 | 건보료 계산·4대보험·종합소득세";
const seoDescription =
  "2026년 최신 세율 반영. 연봉 실수령액, 건보료 연봉 계산, 종합소득세, 이직 비교, 퇴사 시뮬레이션을 무료로 계산하세요.";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: DEFAULT_SITE_URL },
  ],
};

const EMPTY_SECTION = { id: "", h2: "", body: "" };

function findSection(id: string): { id: string; h2: string; body: string } {
  return HOME_SECTIONS.find((entry) => entry.id === id) ?? EMPTY_SECTION;
}

const quickCalcSection = computed(() => findSection("quick-calc"));
const situationSection = computed(() => findSection("situations"));
// 허브 아래로 내려가는 안내 문단 (요율 기준·근거·운영 방침·프리셋 페이지)
const noteSections = computed(() =>
  HOME_SECTIONS.filter((entry) => !["quick-calc", "situations"].includes(entry.id))
);
</script>

<template>
  <div class="text-resize-layout container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="jsonLd" />

    <div class="space-y-2">
      <CalculatorPageHeader :title="HOME_H1" />
      <p class="break-keep text-caption text-muted-foreground">{{ HOME_INTRO }}</p>
      <p class="break-keep text-caption text-muted-foreground">{{ HOME_DESCRIPTION }}</p>
    </div>

    <HomeQuickCalc :heading="quickCalcSection.h2" :note="quickCalcSection.body" />

    <!-- 읽기 순서: 답 → 전체 인덱스 → 상황별 순서 → 기준·근거.
         퀵계산기를 맨 위에 남긴 이유는 유입 1위 질의("연봉 실수령액")의 답이 첫 화면에
         있어야 하기 때문이다(연봉 한 칸 → 월 실수령액). 26줄짜리 인덱스를 그 위에 두면
         모바일에서 답이 화면 밖으로 밀린다. 프리렌더도 HOME_LINKS_AFTER_SECTION = 1로
         같은 순서를 쓴다. -->
    <HomeToolIndex :heading="HOME_LINKS_H2" :intro="HOME_LINKS_INTRO" />

    <HomeScenarioChains
      :heading="situationSection.h2"
      :body="situationSection.body"
    />

    <AdSlot unit="home-top" label="광고 · top" />

    <section class="retro-panel">
      <div class="retro-panel-content space-y-5">
        <div v-for="section in noteSections" :key="section.id" class="space-y-1.5">
          <h2 class="text-body font-bold text-foreground">{{ section.h2 }}</h2>
          <p class="break-keep text-caption text-muted-foreground">{{ section.body }}</p>
        </div>
      </div>
    </section>

    <RelatedServices />

    <AdSlot unit="home-bottom" label="광고 · bottom" />
  </div>
</template>
