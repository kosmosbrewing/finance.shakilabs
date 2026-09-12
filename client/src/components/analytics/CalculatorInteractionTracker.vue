<script setup lang="ts">
// 계산기 퍼널 배선 지점. 계산기 입력 영역을 이 래퍼로 감싸면
// calculator_start / calculator_submit / result_view가 나간다.
//
// calculator_id·page_path는 라우트에서 파생한다 — 뷰가 손으로 이름을 지으면
// 뷰마다 다른 작명이 되고(이전 4개가 실제로 그랬다), URL 값 세그먼트가 그대로
// 파라미터에 실려 카디널리티가 터진다. 게이트:
// scripts/verify-calculator-analytics.mjs
import { computed, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { trackEvent } from "@/lib/analytics";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { createCalculatorAnalytics } from "@/utils/calculatorAnalytics";
import { resolveCalculatorId } from "@/utils/calculatorIds";
import { buildPublicPagePath } from "@/utils/pageTracking";

const props = withDefaults(defineProps<{ canViewResult?: boolean }>(), {
  canViewResult: true,
});

const route = useRoute();
const basePath = new URL(DEFAULT_SITE_URL).pathname.replace(/\/+$/, "");

const calculatorId = computed(() => resolveCalculatorId(route.path));
const pagePath = computed(() => buildPublicPagePath(basePath, route.path));

const analytics = createCalculatorAnalytics({
  calculatorId: () => calculatorId.value,
  pagePath: () => pagePath.value,
  track: trackEvent,
  // 계산기 라우트가 아니면(있을 수 없지만) 빈 id로 이벤트를 흘리지 않는다.
  canViewResult: () => props.canViewResult && calculatorId.value !== "",
});
onBeforeUnmount(analytics.dispose);

function recordInteraction(): void {
  if (!calculatorId.value) return;
  analytics.recordInteraction();
}

function recordButton(event: MouseEvent): void {
  if ((event.target as HTMLElement).closest("button")) {
    recordInteraction();
  }
}
</script>

<template>
  <div
    data-calculator-tracker
    @input="recordInteraction"
    @change="recordInteraction"
    @click="recordButton"
  >
    <slot />
  </div>
</template>
