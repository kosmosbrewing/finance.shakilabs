<script setup lang="ts">
import { RouterLink } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import RecentCalcStorageNote from "@/components/finance/RecentCalcStorageNote.vue";

const seoTitle = "2026 세금·연봉·수당 계산기 모음 | 23개 계산기";
const seoDescription = "연봉 실수령액, 종합소득세, 프리랜서 세금, 연말정산, 퇴직금, 실업급여, 주휴수당 등 23개 계산기를 한곳에서 이용하세요. 2026년 기준 반영.";
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: seoTitle,
  description: seoDescription,
  inLanguage: "ko",
};

const categories = [
  {
    title: "급여·연봉",
    icon: "📊",
    items: [
      { to: "/salary", label: "연봉 실수령액 계산기", desc: "4대보험·소득세 공제 후 월 실수령액" },
      { to: "/insurance", label: "건보료 역산 계산기", desc: "건강보험료로 연봉·월급 추정" },
      { to: "/compare", label: "이직 연봉 비교", desc: "현 연봉 vs 이직 연봉 실수령 차이" },
      { to: "/raise", label: "연봉 인상률 계산기", desc: "인상 전후 실수령 변화" },
      { to: "/bonus", label: "성과급 실수령 계산기", desc: "보너스 세후 실수령액" },
    ],
  },
  {
    title: "세금·신고",
    icon: "💰",
    items: [
      { to: "/comprehensive-tax", label: "종합소득세 계산기", desc: "프리랜서·사업소득 세금 계산" },
      { to: "/freelancer", label: "프리랜서 세금 계산기", desc: "3.3% 원천징수 후 종합소득세 정산" },
      { to: "/withholding", label: "원천세 계산기", desc: "소득세로 연봉 추정" },
      { to: "/freelance-rate", label: "프리랜서 단가 역산", desc: "세후 목표 수입에서 단가 계산" },
      { to: "/4-insurance-employer", label: "사업주 4대보험", desc: "직원 1인당 사업주 부담금" },
    ],
  },
  {
    title: "수당·시급",
    icon: "⏰",
    items: [
      { to: "/weekly-holiday-pay", label: "주휴수당 계산기", desc: "시급별 주휴수당·실질 시급" },
      { to: "/wage-converter", label: "시급↔월급↔연봉 환산기", desc: "주휴수당 포함·미포함 양방향 환산" },
      { to: "/overtime", label: "연장·야간·휴일수당", desc: "추가 수당 계산" },
      { to: "/annual-leave", label: "연차수당 계산기", desc: "미사용 연차 정산금" },
    ],
  },
  {
    title: "퇴직·구직",
    icon: "🏠",
    items: [
      { to: "/quit", label: "퇴사 계산기", desc: "퇴직금·실업급여·생존기간 종합" },
      { to: "/severance-pay", label: "퇴직금 계산기", desc: "퇴직소득세·실수령 퇴직금" },
      { to: "/unemployment", label: "실업급여 계산기", desc: "구직급여 수급액·수급기간" },
      { to: "/parental-leave", label: "육아휴직 급여", desc: "6+6 부모육아휴직제 급여" },
      { to: "/regional-health", label: "지역가입자 건보료", desc: "퇴사 후 건강보험료 비교" },
    ],
  },
  {
    title: "절세·공제",
    icon: "🛡️",
    items: [
      { to: "/year-end-settlement", label: "연말정산 계산기", desc: "환급액·세액공제 시뮬레이터" },
      { to: "/monthly-rent-deduction", label: "월세 세액공제", desc: "월세 공제 환급액" },
      { to: "/irp", label: "IRP 세액공제", desc: "개인형 퇴직연금 절세 효과" },
      { to: "/pension", label: "국민연금 수령액", desc: "예상 월 수령액 계산" },
    ],
  },
];
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="jsonLd" />

    <RecentCalcStorageNote />

    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <div class="space-y-1">
          <h1 class="retro-title">전체 계산기</h1>
          <p class="text-caption text-muted-foreground">급여·세금·수당·퇴직·절세까지, 23개 계산기를 한곳에서 확인하세요.</p>
        </div>
      </div>

      <div class="retro-panel-content grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="cat in categories" :key="cat.title">
          <h2 class="text-body font-bold text-foreground mb-2">
            <span class="mr-1">{{ cat.icon }}</span>{{ cat.title }}
          </h2>
          <ul class="space-y-1.5">
            <li v-for="item in cat.items" :key="item.to">
              <RouterLink
                :to="item.to"
                class="group block rounded-lg border border-border/40 bg-background p-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <p class="text-caption font-semibold text-foreground group-hover:text-primary transition-colors">{{ item.label }}</p>
                <p class="text-tiny text-muted-foreground mt-0.5">{{ item.desc }}</p>
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
