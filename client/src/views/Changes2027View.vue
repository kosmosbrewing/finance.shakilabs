<script setup lang="ts">
// 「2027년 달라지는 세금·지원금」 — 설명문 없이 항목 표로 읽히는 한 페이지(docs/CHANGES_2027_PLAN_2026-09-25.md).
// 문장·순서는 레지스트리(scripts/changes-2027.mjs)에서만 온다 — 프리렌더와 화면이 같은 글을 그린다.
import { computed, ref } from "vue";
import { ShPresetGroup } from "@shakilabs/ui";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import ChangeItem from "@/components/changes/ChangeItem.vue";
import {
  CHANGE_AREAS,
  CHANGES_2027,
  CHANGES_2027_FAQS,
  CHANGES_2027_META,
  CHANGES_2027_VERIFIED_AT,
  changesStatusSummary,
} from "../../scripts/changes-2027.mjs";

const ALL = "all";
const selectedArea = ref<string>(ALL);

const countOf = (areaId: string) => CHANGES_2027.filter((item) => item.area === areaId).length;
const areaOptions = [
  { label: `전체 ${CHANGES_2027.length}`, value: ALL },
  ...CHANGE_AREAS.map((area) => ({ label: `${area.label} ${countOf(area.id)}`, value: area.id })),
];
const visibleAreas = computed(() =>
  CHANGE_AREAS.filter((area) => selectedArea.value === ALL || area.id === selectedArea.value),
);
const itemsOf = (areaId: string) => CHANGES_2027.filter((item) => item.area === areaId);

// 프리렌더(buildChanges2027Meta)와 같은 스키마 — FAQPage는 화면 FAQ와 같은 배열에서 나온다
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: CHANGES_2027_META.heading,
    description: CHANGES_2027_META.description,
    url: `https://shakilabs.com/finance${CHANGES_2027_META.path}`,
    inLanguage: "ko",
    dateModified: CHANGES_2027_VERIFIED_AT,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: CHANGES_2027_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  },
];
</script>

<template>
  <div class="text-resize-layout sh-container sh-container--tool space-y-5 py-6">
    <SEOHead :title="CHANGES_2027_META.title" :description="CHANGES_2027_META.description" :json-ld="jsonLd" />

    <div class="space-y-2">
      <CalculatorPageHeader :title="CHANGES_2027_META.heading" />
      <p class="max-w-[65ch] break-keep text-caption text-muted-foreground">{{ CHANGES_2027_META.intro }}</p>
      <p class="text-tiny font-semibold text-muted-foreground">{{ changesStatusSummary() }}</p>
    </div>

    <ShPresetGroup v-model="selectedArea" :options="areaOptions" label="분야" />

    <section
      v-for="area in visibleAreas"
      :id="`area-${area.id}`"
      :key="area.id"
      class="retro-panel overflow-hidden"
      :aria-labelledby="`area-${area.id}-title`"
    >
      <div class="retro-titlebar rounded-t-2xl">
        <h2 :id="`area-${area.id}-title`" class="retro-title">{{ area.label }}</h2>
      </div>
      <ul class="divide-y divide-border/60">
        <ChangeItem v-for="item in itemsOf(area.id)" :key="item.id" :item="item" />
      </ul>
    </section>

    <section class="retro-panel overflow-hidden" aria-labelledby="changes-faq-title">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 id="changes-faq-title" class="retro-title">자주 묻는 질문</h2>
      </div>
      <div class="retro-panel-content space-y-4">
        <div v-for="faq in CHANGES_2027_FAQS" :key="faq.q" class="space-y-1">
          <h3 class="text-caption font-bold text-foreground">{{ faq.q }}</h3>
          <p class="text-caption text-muted-foreground">{{ faq.a }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
