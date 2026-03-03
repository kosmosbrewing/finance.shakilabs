<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import { DEFAULT_SITE_URL } from "@/lib/site";

const route = useRoute();

const breadcrumbJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${DEFAULT_SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "서비스 소개",
      item: `${DEFAULT_SITE_URL}${route.path}`,
    },
  ],
}));
</script>

<template>
  <div class="container py-8 space-y-4">
    <SEOHead
      title="서비스 안내 | 2026 연봉·건보료 계산기"
      description="연봉 실수령액, 건보료 계산, 이직 비교, 퇴사 시뮬레이션, 종합소득세, 원천징수 역산을 제공하는 무료 계산기. 2026 최신 세율 반영."
      :json-ld="breadcrumbJsonLd"
    />

    <!-- 헤더 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h1 class="retro-title">사이트 안내</h1>
      </div>
      <div class="retro-panel-content">
        <p class="text-body text-muted-foreground leading-relaxed">
          finance.shakilabs.com은 2026년 최신 세율 기준으로 급여·세금을 빠르게 계산할 수 있는 무료 서비스입니다.
          회원가입 없이 이용 가능하며, 입력한 급여 정보는 서버에 저장되지 않습니다.
        </p>
      </div>
    </section>

    <!-- 제공 서비스 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h2 class="retro-title">제공 서비스</h2>
      </div>
      <div class="retro-panel-content">
        <div class="retro-board-list text-caption">
          <RouterLink to="/salary" class="retro-board-item hover:bg-primary/5 transition-colors">
            <span class="font-semibold text-foreground">연봉 실수령 계산기</span>
            <span class="text-muted-foreground text-tiny">연봉 → 월 실수령·공제 항목 상세</span>
          </RouterLink>
          <RouterLink to="/insurance" class="retro-board-item hover:bg-primary/5 transition-colors">
            <span class="font-semibold text-foreground">건강보험료 계산기</span>
            <span class="text-muted-foreground text-tiny">건보료 → 연봉 역산 / 연봉 → 건보료 순산</span>
          </RouterLink>
          <RouterLink to="/withholding" class="retro-board-item hover:bg-primary/5 transition-colors">
            <span class="font-semibold text-foreground">원천징수 역산 계산기</span>
            <span class="text-muted-foreground text-tiny">소득세 → 추정 연봉·실수령 역산</span>
          </RouterLink>
          <RouterLink to="/compare" class="retro-board-item hover:bg-primary/5 transition-colors">
            <span class="font-semibold text-foreground">이직 연봉 비교</span>
            <span class="text-muted-foreground text-tiny">현재 vs 이직 연봉 월·연 실수령 비교</span>
          </RouterLink>
          <RouterLink to="/comprehensive-tax" class="retro-board-item hover:bg-primary/5 transition-colors">
            <span class="font-semibold text-foreground">종합소득세 계산기</span>
            <span class="text-muted-foreground text-tiny">사업·임대·기타소득 종합과세 정산</span>
          </RouterLink>
          <RouterLink to="/quit" class="retro-board-item hover:bg-primary/5 transition-colors">
            <span class="font-semibold text-foreground">퇴사 시뮬레이션</span>
            <span class="text-muted-foreground text-tiny">퇴직금·실업급여·생존 기간 계산</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 계산 기준 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h2 class="retro-title">계산 기준</h2>
      </div>
      <div class="retro-panel-content space-y-2">
        <div class="retro-board-list text-caption">
          <div class="retro-board-item">
            <span class="text-muted-foreground">기준 연도</span>
            <strong>2026년</strong>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">국민연금</span>
            <strong>9.5% (근로자 4.5%)</strong>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">건강보험</span>
            <strong>7.19% (근로자 3.595%)</strong>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">장기요양</span>
            <strong>건보료의 12.95%</strong>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">고용보험</span>
            <strong>1.8% (근로자 0.9%)</strong>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">소득세</span>
            <strong>국세청 간이세액표 적용</strong>
          </div>
        </div>
        <p class="text-tiny text-muted-foreground px-1">
          부양가족 수·비과세 항목 등 입력값에 따라 결과가 달라질 수 있습니다.
        </p>
      </div>
    </section>

    <!-- 주의사항 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h2 class="retro-title">이용 시 주의사항</h2>
      </div>
      <div class="retro-panel-content">
        <ul class="space-y-2 text-caption text-muted-foreground">
          <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>결과는 참고용 추정값이며 법적 효력이 없습니다.</li>
          <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>실제 급여명세·납부 세액과 차이가 있을 수 있습니다.</li>
          <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>최종 신고·납부 금액은 급여 담당자 또는 세무 전문가 확인이 필요합니다.</li>
          <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>세법 개정 시 계산 기준은 업데이트됩니다.</li>
        </ul>
      </div>
    </section>

    <!-- 운영 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h2 class="retro-title">운영 정보</h2>
      </div>
      <div class="retro-panel-content">
        <div class="retro-board-list text-caption">
          <div class="retro-board-item">
            <span class="text-muted-foreground">운영</span>
            <strong>Shakilabs</strong>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">문의</span>
            <a href="mailto:skdba1313@gmail.com" class="underline underline-offset-2">skdba1313@gmail.com</a>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">개인정보 처리방침</span>
            <RouterLink to="/privacy" class="underline underline-offset-2">바로가기</RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
