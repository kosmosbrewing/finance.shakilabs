<script setup lang="ts">
import { RouterLink } from "vue-router";

const year = new Date().getFullYear();
</script>

<template>
  <footer class="mt-8 border-t border-border/60 bg-muted/20">
    <div class="container py-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p class="text-caption font-bold text-foreground">finance.shakilabs.com</p>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-tiny">
          <RouterLink to="/about" class="text-muted-foreground hover:text-foreground transition-colors">
            사이트 안내
          </RouterLink>
          <RouterLink to="/privacy" class="text-muted-foreground hover:text-foreground transition-colors">
            개인정보 처리방침
          </RouterLink>
          <a
            href="mailto:skdba1313@gmail.com"
            class="text-muted-foreground hover:text-foreground transition-colors"
          >
            문의
          </a>
        </div>
      </div>

      <div class="mt-3 border-t border-border/40 pt-3 space-y-1">
        <p class="text-tiny text-muted-foreground">
          본 계산 결과는 참고용 추정치이며, 실제 납부액·환급액은 다를 수 있습니다.
        </p>
        <p class="text-tiny text-muted-foreground">
          Copyright © {{ year }} shakilabs.com
        </p>
      </div>
    </div>
  </footer>
</template>
