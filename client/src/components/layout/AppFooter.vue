<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <footer class="mt-8 border-t border-border bg-background">
    <div class="container py-5">
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <RouterLink to="/insurance" class="retro-button-subtle">건보료 역산</RouterLink>
          <RouterLink to="/salary" class="retro-button-subtle">실수령액 계산</RouterLink>
          <RouterLink to="/about" class="retro-button-subtle">서비스 소개</RouterLink>
          <RouterLink to="/privacy" class="retro-button-subtle">개인정보 처리방침</RouterLink>
        </div>
        <p class="text-caption text-muted-foreground">
          본 계산기는 참고용이며, 실제 급여와 차이가 있을 수 있습니다.
        </p>
        <span class="text-caption text-muted-foreground">Copyright © shakilabs.com</span>
      </div>
    </div>
  </footer>
</template>
