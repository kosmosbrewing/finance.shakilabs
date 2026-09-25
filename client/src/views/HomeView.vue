<script setup lang="ts">
import { computed } from "vue";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import RelatedServices from "@/components/common/RelatedServices.vue";
import HomeInsuranceCalc from "@/components/home/HomeInsuranceCalc.vue";
import HomeToolIndex from "@/components/home/HomeToolIndex.vue";
import HomeFaqPanel from "@/components/home/HomeFaqPanel.vue";
import HomeSituationGuide from "@/components/home/HomeSituationGuide.vue";
import { DEFAULT_SITE_URL } from "@/lib/site";
import {
  HOME_FAQS,
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

// FAQPage는 화면 아코디언과 같은 배열에서 나온다. 스키마에만 있고 화면에 없는 문답은
// 구조화 데이터 위반이므로, 두 곳이 갈라질 수 없게 소스를 하나로 묶어 둔다.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: DEFAULT_SITE_URL },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  },
];

const EMPTY_SECTION = { id: "", h2: "", body: "" };

function findSection(id: string): { id: string; h2: string; body: string } {
  return HOME_SECTIONS.find((entry) => entry.id === id) ?? EMPTY_SECTION;
}

const quickCalcSection = computed(() => findSection("quick-calc"));
</script>

<template>
  <!-- 홈은 도구 인덱스 화면이다(loan `/loan/` 패턴): 답 하나 → 26개 목록 → FAQ → 종합 가이드.
       요율 기준·근거·운영 방침·프리셋 안내처럼 "읽는 글"은 /all로 옮겼다 — 홈에 두면 h2가
       열 개로 불어나 인덱스가 산문 사이에 끼인 한 절이 된다(개편 전 상태). -->
  <div class="text-resize-layout sh-container sh-container--page space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="jsonLd" />

    <div class="space-y-1.5">
      <CalculatorPageHeader :title="HOME_H1" />
      <p class="max-w-[42rem] break-keep text-caption text-muted-foreground">{{ HOME_INTRO }}</p>
    </div>

    <!-- 첫 화면은 계산기다(사용자 결정 2026-09-24, B안) — 도구만 나열하던 인덱스를 첫 화면에서
         내리고 가장 많이 쓰는 건보료 계산기를 올렸다. 연봉 모드도 같은 자리에서 고를 수 있어
         "연봉 실수령액" 답도 첫 화면에 남는다. 26줄짜리 인덱스는 그 아래에 둔다 — 위에 두면
         모바일에서 답이 화면 밖으로 밀린다. 프리렌더도 HOME_LINKS_AFTER_SECTION = 1로 같은 순서다. -->
    <HomeInsuranceCalc :heading="quickCalcSection.h2" :note="quickCalcSection.body" />

    <HomeToolIndex :heading="HOME_LINKS_H2" :intro="HOME_LINKS_INTRO" />

    <AdSlot unit="home-top" label="광고 · top" />

    <HomeFaqPanel />

    <RelatedServices />

    <HomeSituationGuide />

    <AdSlot unit="home-bottom" label="광고 · bottom" />
  </div>
</template>
