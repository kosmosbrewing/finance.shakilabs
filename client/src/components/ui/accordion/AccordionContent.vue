<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { AccordionContent, type AccordionContentProps } from "radix-vue";
import { cn } from "@/lib/utils";

const props = defineProps<AccordionContentProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

// forceMount는 radix에서 "항상 렌더"만 의미한다 — 닫힘 상태를 숨기는 건 소비자 몫이라
// 이 클래스를 같이 걸어야 접힌 답변이 화면에 펼쳐진 채로 남지 않는다.
// 왜 굳이 항상 렌더하나: 기본 동작은 닫힌 항목을 언마운트해서 innerHTML에서도 사라진다.
// FAQPage 스키마가 신고한 답변이 DOM에 아예 없으면 크롤러가 받은 문장을 사람은 볼 수 없다.
const contentClass = computed(() =>
  cn(
    "overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    props.forceMount && "data-[state=closed]:hidden",
  ),
);
</script>

<template>
  <AccordionContent v-bind="delegatedProps" :class="contentClass">
    <div :class="cn('pb-3 pt-0 text-caption text-muted-foreground whitespace-pre-line leading-relaxed', props.class)">
      <slot />
    </div>
  </AccordionContent>
</template>
