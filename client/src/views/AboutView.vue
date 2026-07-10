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

const CALCULATOR_GROUPS = [
  {
    title: "급여·연봉 (5종)",
    items: [
      { path: "/salary", name: "연봉 실수령액 계산기", desc: "연봉 → 월 실수령·공제 상세" },
      { path: "/insurance", name: "건강보험료 역산 계산기", desc: "건보료 → 연봉 추정" },
      { path: "/compare", name: "이직 연봉 비교", desc: "두 연봉의 실수령 차이 비교" },
      { path: "/raise", name: "연봉 인상률 계산기", desc: "협상 시 적정 인상률 산출" },
      { path: "/bonus", name: "성과급 실수령 계산기", desc: "상여금 세금·4대보험 공제" },
    ],
  },
  {
    title: "세금·신고 (4종)",
    items: [
      { path: "/comprehensive-tax", name: "종합소득세 계산기", desc: "사업·임대·기타소득 종합과세" },
      { path: "/withholding", name: "원천세 역산 계산기", desc: "소득세로 연봉 추정" },
      { path: "/freelance-rate", name: "프리랜서 단가 역산", desc: "원천세 제외 실수령 단가" },
      { path: "/4-insurance-employer", name: "사업주 4대보험 계산기", desc: "고용주 부담금·인건비" },
    ],
  },
  {
    title: "수당·시급 (4종)",
    items: [
      { path: "/weekly-holiday-pay", name: "주휴수당 계산기", desc: "아르바이트 주휴수당·실질 시급" },
      { path: "/wage-converter", name: "시급↔월급↔연봉 환산기", desc: "주휴수당 포함·미포함 환산" },
      { path: "/overtime", name: "연장·야간·휴일수당 계산기", desc: "초과근무 1.5배·2배 할증" },
      { path: "/annual-leave", name: "연차수당 계산기", desc: "미사용 연차 보상금" },
    ],
  },
  {
    title: "퇴직·구직 (5종)",
    items: [
      { path: "/quit", name: "퇴사 종합 시뮬레이션", desc: "퇴직금+실업급여+생존기간" },
      { path: "/severance-pay", name: "퇴직금 계산기", desc: "퇴직소득세·실수령 퇴직금" },
      { path: "/unemployment", name: "실업급여 계산기", desc: "구직급여 수급액·수급기간" },
      { path: "/parental-leave", name: "육아휴직 급여", desc: "6+6 부모육아휴직제" },
      { path: "/regional-health", name: "지역가입자 건보료", desc: "퇴사 후 건보 비교" },
    ],
  },
  {
    title: "절세·공제 (4종)",
    items: [
      { path: "/year-end-settlement", name: "연말정산 계산기", desc: "환급액·세액공제 시뮬레이터" },
      { path: "/monthly-rent-deduction", name: "월세 세액공제 계산기", desc: "연말정산 월세 환급" },
      { path: "/irp", name: "IRP 세액공제 계산기", desc: "개인형 퇴직연금 절세" },
      { path: "/pension", name: "국민연금 수령액 계산기", desc: "예상 연금액·납부액" },
    ],
  },
];

const RATE_REFERENCES = [
  { item: "국민연금", rate: "근로자 4.75% (2026.7.1부터 상·하한 659만/41만)", source: "국민연금공단 고시" },
  { item: "건강보험", rate: "근로자 3.595%", source: "국민건강보험공단 고시" },
  { item: "장기요양보험", rate: "건보료의 13.14%", source: "국민건강보험공단 고시" },
  { item: "고용보험", rate: "근로자 0.9%", source: "고용노동부 고시" },
  { item: "소득세", rate: "누진세율 6~45% (8구간)", source: "소득세법 제55조" },
  { item: "최저시급", rate: "10,320원", source: "최저임금위원회 2025.8 고시" },
  { item: "실업급여 상한", rate: "68,100원/일", source: "고용노동부 2026 고시" },
  { item: "자녀세액공제", rate: "1자녀 25만/2자녀 55만/추가 40만원", source: "소득세법 제59조의2" },
];
</script>

<template>
  <div class="container py-8 space-y-4">
    <SEOHead
      title="서비스 소개 | 2026 연봉·세금 계산기"
      description="ShakiLabs 연봉·세금 계산기는 2026년 최신 세율 기준으로 22종의 무료 금융 계산 도구를 제공합니다. 국세청·건보공단·고용부 공식 고시 기반의 정확한 계산."
      :json-ld="breadcrumbJsonLd"
    />

    <!-- 헤더 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h1 class="retro-title">서비스 소개</h1>
      </div>
      <div class="retro-panel-content space-y-3">
        <p class="text-body text-muted-foreground leading-relaxed">
          <strong class="text-foreground">ShakiLabs 연봉·세금 계산기</strong>는 2026년 최신 세율·요율을 기반으로
          대한민국 근로자·프리랜서·사업자·구직자를 위한 <strong>22종의 무료 금융 계산 도구</strong>를 제공합니다.
          회원가입 없이 즉시 이용 가능하며, 입력한 급여·세금 정보는 서버에 전송되지 않고 브라우저 내에서만 계산됩니다.
        </p>
        <p class="text-body text-muted-foreground leading-relaxed">
          복잡한 한국의 세법·노동법·사회보험 제도를 누구나 이해하기 쉽게 풀어내는 것을 목표로 하며,
          국세청 근로소득 간이세액표, 국민건강보험공단 요율 고시, 국민연금공단 상·하한 기준액,
          고용노동부 실업급여·육아휴직 고시, 근로기준법 등 공식 법령에 기반해 계산합니다.
        </p>
      </div>
    </section>

    <!-- 제공 계산기 -->
    <section
      v-for="group in CALCULATOR_GROUPS"
      :key="group.title"
      class="retro-panel overflow-hidden"
    >
      <div class="retro-titlebar">
        <h2 class="retro-title">{{ group.title }}</h2>
      </div>
      <div class="retro-panel-content">
        <div class="retro-board-list text-caption">
          <RouterLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="retro-board-item hover:bg-primary/5 transition-colors"
          >
            <span class="font-semibold text-foreground">{{ item.name }}</span>
            <span class="text-muted-foreground text-tiny">{{ item.desc }}</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 2026 계산 기준 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h2 class="retro-title">2026년 적용 기준 및 법령 근거</h2>
      </div>
      <div class="retro-panel-content space-y-2">
        <p class="text-caption text-muted-foreground leading-relaxed">
          본 서비스는 아래 공식 고시와 법령에 기반해 계산 엔진을 구성합니다. 세법·요율 개정이 있을 때마다
          신속히 반영하며, 주요 정책값은 2026년 7월 공식 자료와 다시 대조했습니다.
        </p>
        <div class="retro-board-list text-caption">
          <div
            v-for="ref in RATE_REFERENCES"
            :key="ref.item"
            class="retro-board-item"
          >
            <span class="font-semibold text-foreground">{{ ref.item }}</span>
            <span class="text-muted-foreground text-tiny">{{ ref.rate }} · {{ ref.source }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 운영 원칙 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h2 class="retro-title">서비스 운영 원칙</h2>
      </div>
      <div class="retro-panel-content">
        <ul class="space-y-2 text-caption text-muted-foreground">
          <li class="flex gap-2">
            <span class="text-primary shrink-0">▸</span>
            <span><strong class="text-foreground">회원가입 불필요</strong> — 개인정보를 수집하지 않으며, 즉시 사용 가능합니다.</span>
          </li>
          <li class="flex gap-2">
            <span class="text-primary shrink-0">▸</span>
            <span><strong class="text-foreground">클라이언트 연산</strong> — 입력한 급여·세금 정보는 서버로 전송되지 않고 브라우저 내에서만 처리됩니다.</span>
          </li>
          <li class="flex gap-2">
            <span class="text-primary shrink-0">▸</span>
            <span><strong class="text-foreground">법령 기반</strong> — 모든 계산은 국세청·건보공단·고용부 공식 고시에 기반합니다.</span>
          </li>
          <li class="flex gap-2">
            <span class="text-primary shrink-0">▸</span>
            <span><strong class="text-foreground">정기 업데이트</strong> — 매년 1월 세법·요율 개정을 즉시 반영합니다.</span>
          </li>
          <li class="flex gap-2">
            <span class="text-primary shrink-0">▸</span>
            <span><strong class="text-foreground">오류 제보 환영</strong> — 이메일로 계산 오류 제보 시 빠르게 수정합니다.</span>
          </li>
          <li class="flex gap-2">
            <span class="text-primary shrink-0">▸</span>
            <span><strong class="text-foreground">무료 사용</strong> — 광고 수익을 통해 운영되며, 사용자 과금이 없습니다.</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- 이용 시 주의사항 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h2 class="retro-title">이용 시 주의사항</h2>
      </div>
      <div class="retro-panel-content space-y-2">
        <p class="text-caption text-muted-foreground leading-relaxed">
          본 서비스의 계산 결과는 <strong class="text-foreground">참고용 추정값</strong>이며 법적 효력이 없습니다.
          실제 급여명세서·세금 고지서와 차이가 있을 수 있으며, 최종 신고·납부 금액은 회사 급여담당자,
          국세청 홈택스, 세무대리인 또는 공단 고객센터의 확인이 필요합니다.
        </p>
        <ul class="space-y-2 text-caption text-muted-foreground">
          <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>비과세 항목, 회사 복리후생, 부양가족 특수 사정은 계산기에서 반영되지 않을 수 있습니다.</li>
          <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>고소득자(국민연금 상한 초과), 일용직, 건설·운수업 특수 케이스는 별도 확인이 필요합니다.</li>
          <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>세법 개정 시 계산 기준이 업데이트되며, 과거 연도 계산은 해당 시점 버전을 이용하세요.</li>
        </ul>
      </div>
    </section>

    <!-- 운영자 정보 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h2 class="retro-title">운영자 정보</h2>
      </div>
      <div class="retro-panel-content">
        <div class="retro-board-list text-caption">
          <div class="retro-board-item">
            <span class="text-muted-foreground">운영</span>
            <strong>Shakilabs</strong>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">서비스 URL</span>
            <strong>shakilabs.com/finance</strong>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">이메일 문의</span>
            <a href="mailto:skdba1313@gmail.com" class="underline underline-offset-2">skdba1313@gmail.com</a>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">응답 시간</span>
            <span>영업일 기준 24~48시간 이내</span>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">개인정보처리방침</span>
            <RouterLink to="/privacy" class="underline underline-offset-2">바로가기</RouterLink>
          </div>
          <div class="retro-board-item">
            <span class="text-muted-foreground">이용약관</span>
            <RouterLink to="/terms" class="underline underline-offset-2">바로가기</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- 업데이트 이력 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h2 class="retro-title">업데이트 이력</h2>
      </div>
      <div class="retro-panel-content">
        <ul class="space-y-2 text-caption text-muted-foreground">
          <li class="flex gap-2">
            <span class="text-primary shrink-0 font-mono">2026.07</span>
            <span>연말정산 신용카드 소득공제 한도와 공식 출처 재검증</span>
          </li>
          <li class="flex gap-2">
            <span class="text-primary shrink-0 font-mono">2026.03</span>
            <span>사이트 구조 개편 — 9탭 네비게이션, 전체 계산기 허브 페이지 추가</span>
          </li>
          <li class="flex gap-2">
            <span class="text-primary shrink-0 font-mono">2026.01</span>
            <span>2026년 세법·요율 전면 반영 (자녀세액공제, 실업급여 상한 68,100원, 최저시급 10,320원)</span>
          </li>
          <li class="flex gap-2">
            <span class="text-primary shrink-0 font-mono">2025.12</span>
            <span>연말정산 계산기, 월세 세액공제, IRP 계산기 추가</span>
          </li>
          <li class="flex gap-2">
            <span class="text-primary shrink-0 font-mono">2025.11</span>
            <span>지역가입자 건보료·임의계속가입 비교 기능 추가</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
