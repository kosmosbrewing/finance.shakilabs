<script setup lang="ts">
import { computed } from "vue";
import { useSEO } from "@/composables/useSEO";

const props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    jsonLd?: Record<string, unknown>;
    noindex?: boolean;
  }>(),
  {
    noindex: false,
  }
);

useSEO({
  title: computed(() => props.title),
  description: computed(() => props.description),
  jsonLd: computed(() => props.jsonLd),
  noindex: computed(() => props.noindex),
});
</script>

<template></template>
