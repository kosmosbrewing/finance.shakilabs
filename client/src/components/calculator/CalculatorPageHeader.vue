<script setup lang="ts">
import FreshBadge from "@/components/common/FreshBadge.vue";

defineProps<{
  title: string;
  description?: string;
  freshness?: string;
}>();
</script>

<template>
  <header class="space-y-2" data-calculator-page-header>
    <h1 class="break-keep text-h1 font-brand">{{ title }}</h1>
    <div
      v-if="description || freshness"
      class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <p v-if="description" class="max-w-2xl text-caption leading-5 text-muted-foreground">
        {{ description }}
      </p>
      <FreshBadge v-if="freshness" :message="freshness" class="shrink-0" />
    </div>
  </header>
</template>
