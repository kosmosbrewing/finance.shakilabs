<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import {
  getScenarioChainBySlug,
  SCENARIO_CHAINS,
} from "../../scripts/scenario-chains.mjs";

const props = defineProps<{ slug: string }>();

const chain = computed(() => getScenarioChainBySlug(props.slug));
const relatedChains = computed(() =>
  chain.value
    ? SCENARIO_CHAINS.filter((candidate) => chain.value!.related.includes(candidate.slug))
    : [],
);

const jsonLd = computed(() => chain.value
  ? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: chain.value.seoTitle,
    description: chain.value.seoDescription,
    inLanguage: "ko",
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: chain.value.steps.map((step, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: step.label,
        url: `https://shakilabs.com/finance${step.to}`,
      })),
    },
  }
  : undefined);
</script>

<template>
  <div v-if="chain" class="container space-y-4 py-6">
    <SEOHead :title="chain.seoTitle" :description="chain.seoDescription" :json-ld="jsonLd" />

    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <div class="space-y-1">
          <h1 class="retro-title">{{ chain.heading }}</h1>
          <p class="text-caption text-muted-foreground">{{ chain.intro }}</p>
        </div>
      </div>

      <div class="retro-panel-content">
        <ol class="space-y-3">
          <li v-for="(step, index) in chain.steps" :key="step.to">
            <RouterLink
              :to="step.to"
              class="group block rounded-lg border border-border/40 bg-background p-3.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <p class="text-caption font-semibold text-foreground transition-colors group-hover:text-primary">
                <span class="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-tiny font-bold text-primary">{{ index + 1 }}</span>
                {{ step.label }}
              </p>
              <p class="text-tiny text-muted-foreground mt-1.5 leading-5">{{ step.why }}</p>
            </RouterLink>
          </li>
        </ol>

        <div class="mt-6 border-t border-border/40 pt-4">
          <h2 class="text-body font-bold text-foreground mb-2">다른 상황 가이드</h2>
          <ul class="space-y-1.5">
            <li v-for="linked in relatedChains" :key="linked.slug">
              <RouterLink :to="linked.route" class="text-caption font-semibold text-primary hover:underline">
                {{ linked.heading }} →
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/all" class="text-caption font-semibold text-primary hover:underline">
                전체 계산기 모음 →
              </RouterLink>
            </li>
          </ul>
          <p class="text-tiny text-muted-foreground mt-4">계산 기준: 2026년 세율·요율. 최종 신고·급여 정산 전에는 관계 기관과 회사 기준을 확인하세요.</p>
        </div>
      </div>
    </div>
  </div>
</template>
