<script setup lang="ts">
import { RouterLink } from "vue-router";

const year = new Date().getFullYear();

const footerNav = [
  {
    title: "급여·연봉",
    links: [
      { to: "/salary", label: "연봉 실수령액" },
      { to: "/insurance", label: "건보료 역산" },
      { to: "/compare", label: "이직 비교" },
      { to: "/raise", label: "연봉 인상률" },
      { to: "/bonus", label: "성과급" },
    ],
  },
  {
    title: "세금·신고",
    links: [
      { to: "/comprehensive-tax", label: "종합소득세" },
      { to: "/freelancer", label: "프리랜서 세금" },
      { to: "/withholding", label: "원천세" },
      { to: "/freelance-rate", label: "프리랜서 단가" },
      { to: "/4-insurance-employer", label: "사업주 4대보험" },
    ],
  },
  {
    title: "수당·시급",
    links: [
      { to: "/weekly-holiday-pay", label: "주휴수당" },
      { to: "/wage-converter", label: "시급↔월급 환산" },
      { to: "/overtime", label: "연장·야간수당" },
      { to: "/annual-leave", label: "연차수당" },
    ],
  },
  {
    title: "퇴직·구직",
    links: [
      { to: "/quit", label: "퇴사 계산기" },
      { to: "/severance-pay", label: "퇴직금" },
      { to: "/unemployment", label: "실업급여" },
      { to: "/parental-leave", label: "육아휴직" },
      { to: "/regional-health", label: "지역가입자 건보" },
    ],
  },
  {
    title: "절세·공제",
    links: [
      { to: "/year-end-settlement", label: "연말정산" },
      { to: "/monthly-rent-deduction", label: "월세 세액공제" },
      { to: "/irp", label: "IRP 세액공제" },
      { to: "/pension", label: "국민연금" },
    ],
  },
];
</script>

<template>
  <footer class="mt-8 border-t border-border/60 bg-muted/20">
    <div class="container py-5">
      <!-- 카테고리별 계산기 링크 -->
      <nav aria-label="전체 계산기" class="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
        <div v-for="group in footerNav" :key="group.title">
          <p class="text-caption font-bold text-foreground mb-1.5">{{ group.title }}</p>
          <ul class="space-y-0">
            <li v-for="link in group.links" :key="link.to">
              <RouterLink
                :to="link.to"
                class="inline-block w-full py-1.5 text-[0.75rem] text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>

      <!-- 기존 하단 -->
      <div class="mt-4 border-t border-border/40 pt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p class="text-caption font-bold text-foreground">shakilabs.com/finance</p>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem]">
          <RouterLink to="/all" class="text-muted-foreground hover:text-foreground transition-colors">
            전체 계산기
          </RouterLink>
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
