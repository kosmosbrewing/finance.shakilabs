<script setup lang="ts">
import { RouterLink } from "vue-router";

const year = new Date().getFullYear();

const services = [
  { to: "/salary", label: "연봉 실수령 계산기" },
  { to: "/insurance", label: "건강보험료 계산기" },
  { to: "/compare", label: "이직 연봉 비교" },
  { to: "/quit", label: "퇴사 시뮬레이션" },
  { to: "/comprehensive-tax", label: "종합소득세 계산기" },
  { to: "/withholding", label: "원천징수 역산 계산기" },
];
</script>

<template>
  <footer class="mt-8 border-t border-border/60 bg-muted/20">
    <div class="container py-8">
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <!-- 브랜드 -->
        <div class="space-y-2">
          <p class="text-caption font-bold text-foreground">finance.shakilabs.com</p>
          <p class="text-tiny text-muted-foreground leading-relaxed">
            2026년 최신 세율 기준<br />무료 급여·세금 계산 서비스
          </p>
          <p class="text-tiny text-muted-foreground">
            본 계산기는 참고용 추정값이며<br />법적 효력이 없습니다.
          </p>
        </div>

        <!-- 서비스 -->
        <div class="space-y-2">
          <p class="text-tiny font-semibold text-foreground uppercase tracking-wide">서비스</p>
          <ul class="space-y-1.5">
            <li v-for="item in services" :key="item.to">
              <RouterLink
                :to="item.to"
                class="text-tiny text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- 사이트 정보 -->
        <div class="space-y-2">
          <p class="text-tiny font-semibold text-foreground uppercase tracking-wide">사이트</p>
          <ul class="space-y-1.5">
            <li>
              <RouterLink to="/about" class="text-tiny text-muted-foreground hover:text-foreground transition-colors">
                사이트 안내
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/privacy" class="text-tiny text-muted-foreground hover:text-foreground transition-colors">
                개인정보 처리방침
              </RouterLink>
            </li>
            <li>
              <a href="mailto:skdba1313@gmail.com" class="text-tiny text-muted-foreground hover:text-foreground transition-colors">
                문의: skdba1313@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-8 border-t border-border/40 pt-4">
        <p class="text-tiny text-muted-foreground">Copyright © {{ year }} shakilabs.com · All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
