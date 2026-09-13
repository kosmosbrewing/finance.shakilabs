<script setup lang="ts">
defineProps<{
  message: string;
  backTo?: string;
  backLabel?: string;
}>();
</script>

<template>
  <div class="text-center py-20">
    <p class="text-destructive text-body mb-4">{{ message }}</p>
    <RouterLink
      v-if="backTo"
      :to="backTo"
      class="text-link text-body"
    >
      {{ backLabel || '돌아가기' }}
    </RouterLink>
  </div>
</template>
