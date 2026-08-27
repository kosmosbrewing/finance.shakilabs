<script setup lang="ts">
import type { FaqItem } from "@/data/benefitFaqs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const props = defineProps<{
  items: FaqItem[];
}>();
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 class="retro-title">자주 묻는 질문</h2>
    </div>
    <div class="retro-panel-content">
      <Accordion type="single" collapsible>
        <AccordionItem
          v-for="item in props.items"
          :key="item.question"
          :value="item.question"
        >
          <AccordionTrigger class="text-body text-left">{{ item.question }}</AccordionTrigger>
          <!-- force-mount: 이 답변들은 FAQPage 스키마가 신고하는 텍스트다. 접었을 때 언마운트되면
               스키마에는 있고 DOM에는 없는 상태가 되므로(라이브 /severance-pay 4문항 실측),
               항상 렌더하고 닫힘 상태는 CSS로만 감춘다. -->
          <AccordionContent force-mount class="text-caption leading-6 text-muted-foreground">
            {{ item.answer }}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </section>
</template>
