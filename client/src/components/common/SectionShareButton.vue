<script setup lang="ts">
import { Share2 } from "lucide-vue-next";

defineProps<{
  label?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded border border-border/70 bg-background/70 px-2.5 py-1 text-caption font-semibold text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
    @click="emit('click')"
  >
    <Share2 class="h-3.5 w-3.5" />
    <span>{{ label || "공유" }}</span>
  </button>
</template>
