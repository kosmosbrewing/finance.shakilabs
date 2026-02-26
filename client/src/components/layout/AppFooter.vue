<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <footer class="mt-8 border-t border-border bg-background">
    <div class="container py-5">
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-4">
          <RouterLink to="/about" class="text-tiny text-muted-foreground hover:text-foreground transition-colors">사이트 안내</RouterLink>
          <RouterLink to="/privacy" class="text-tiny text-muted-foreground hover:text-foreground transition-colors">개인정보 처리방침</RouterLink>
        </div>
        <span class="text-tiny text-muted-foreground">Copyright © shakilabs.com</span>
      </div>
    </div>
  </footer>
</template>
