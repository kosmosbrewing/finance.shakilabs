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
          <AccordionContent class="text-caption leading-6 text-muted-foreground">
            {{ item.answer }}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </section>
</template>
