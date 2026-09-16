<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <!-- v3 §7.3 — 제목과 보조 컨트롤(MemoryControl)은 한 그룹이다.
       보조 슬롯은 하나뿐이고, 없으면 비워 둔다(다른 링크를 끼우지 않는다). -->
  <header data-calculator-page-header class="finance-page-header">
    <h1 class="break-keep text-h1 font-brand">{{ title }}</h1>
    <div v-if="$slots.control" class="finance-page-header__control">
      <slot name="control" />
    </div>
  </header>
</template>
