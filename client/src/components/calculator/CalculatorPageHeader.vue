<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <header data-calculator-page-header>
    <h1 class="break-keep text-h1 font-brand">{{ title }}</h1>
  </header>
</template>
