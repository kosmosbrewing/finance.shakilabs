<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

type CalcKey =
  | "insurance" | "salary" | "raise" | "bonus" | "compare"
  | "comprehensive-tax" | "freelancer" | "withholding" | "freelance-rate" | "4-insurance-employer"
  | "weekly-holiday-pay" | "wage-converter" | "overtime" | "annual-leave"
  | "quit" | "severance-pay" | "unemployment" | "parental-leave" | "regional-health"
  | "year-end-settlement" | "monthly-rent-deduction" | "irp" | "pension"
  | "dependent" | "unpaid-wage";

const props = defineProps<{ current: CalcKey }>();

type Link = { to: string; label: string };

const linkMap: Record<CalcKey, Link[]> = {
  // ── 급여·연봉 ──
  "insurance": [
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/dependent", label: "피부양자 자격 판정기" },
    { to: "/compare", label: "이직 연봉 비교" },
    { to: "/year-end-settlement", label: "연말정산 계산기" },
  ],
  "salary": [
    { to: "/insurance", label: "건보료 역산 계산기" },
    { to: "/compare", label: "이직 연봉 비교" },
    { to: "/comprehensive-tax", label: "종합소득세 계산기" },
    { to: "/year-end-settlement", label: "연말정산 계산기" },
  ],
  "raise": [
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/compare", label: "이직 연봉 비교" },
    { to: "/bonus", label: "성과급 실수령 계산기" },
    { to: "/year-end-settlement", label: "연말정산 계산기" },
  ],
  "bonus": [
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/raise", label: "연봉 인상률 계산기" },
    { to: "/comprehensive-tax", label: "종합소득세 계산기" },
    { to: "/year-end-settlement", label: "연말정산 계산기" },
  ],
  "compare": [
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/raise", label: "연봉 인상률 계산기" },
    { to: "/quit", label: "퇴사 계산기" },
    { to: "/comprehensive-tax", label: "종합소득세 계산기" },
  ],

  // ── 세금·신고 ──
  "comprehensive-tax": [
    { to: "/freelance-rate", label: "프리랜서 단가 역산" },
    { to: "/withholding", label: "원천세 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/year-end-settlement", label: "연말정산 계산기" },
  ],
  "withholding": [
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/insurance", label: "건보료 역산 계산기" },
    { to: "/comprehensive-tax", label: "종합소득세 계산기" },
    { to: "/compare", label: "이직 연봉 비교" },
  ],
  "freelancer": [
    { to: "/freelance-rate", label: "프리랜서 단가 역산" },
    { to: "/comprehensive-tax", label: "종합소득세 계산기" },
    { to: "/withholding", label: "원천세 계산기" },
    { to: "/irp", label: "IRP 세액공제 계산기" },
  ],
  "freelance-rate": [
    { to: "/freelancer", label: "프리랜서 세금 계산기" },
    { to: "/comprehensive-tax", label: "종합소득세 계산기" },
    { to: "/withholding", label: "원천세 계산기" },
    { to: "/4-insurance-employer", label: "사업주 4대보험" },
  ],
  "4-insurance-employer": [
    { to: "/insurance", label: "건보료 역산 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/freelance-rate", label: "프리랜서 단가 역산" },
    { to: "/severance-pay", label: "퇴직금 계산기" },
  ],

  // ── 수당·시급 ──
  "weekly-holiday-pay": [
    { to: "/wage-converter", label: "시급↔월급 환산기" },
    { to: "/overtime", label: "연장·야간수당 계산기" },
    { to: "/severance-pay", label: "퇴직금 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
  ],
  "wage-converter": [
    { to: "/weekly-holiday-pay", label: "주휴수당 계산기" },
    { to: "/overtime", label: "연장·야간수당 계산기" },
    { to: "/annual-leave", label: "연차수당 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
  ],
  "overtime": [
    { to: "/weekly-holiday-pay", label: "주휴수당 계산기" },
    { to: "/wage-converter", label: "시급↔월급 환산기" },
    { to: "/annual-leave", label: "연차수당 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
  ],
  "annual-leave": [
    { to: "/overtime", label: "연장·야간수당 계산기" },
    { to: "/weekly-holiday-pay", label: "주휴수당 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/severance-pay", label: "퇴직금 계산기" },
  ],

  // ── 퇴직·구직 ──
  "quit": [
    { to: "/severance-pay", label: "퇴직금 계산기" },
    { to: "/unemployment", label: "실업급여 계산기" },
    { to: "/regional-health", label: "지역가입자 건보료" },
    { to: "/parental-leave", label: "육아휴직 급여 계산기" },
  ],
  "severance-pay": [
    { to: "/quit", label: "퇴사 계산기" },
    { to: "/unpaid-wage", label: "임금체불 지연이자" },
    { to: "/unemployment", label: "실업급여 계산기" },
    { to: "/weekly-holiday-pay", label: "주휴수당 계산기" },
  ],
  "unpaid-wage": [
    { to: "/severance-pay", label: "퇴직금 계산기" },
    { to: "/unemployment", label: "실업급여 계산기" },
    { to: "/quit", label: "퇴사 계산기" },
    { to: "/wage-converter", label: "시급↔월급 환산기" },
  ],
  "unemployment": [
    { to: "/quit", label: "퇴사 계산기" },
    { to: "/severance-pay", label: "퇴직금 계산기" },
    { to: "/regional-health", label: "지역가입자 건보료" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
  ],
  "parental-leave": [
    { to: "/quit", label: "퇴사 계산기" },
    { to: "/unemployment", label: "실업급여 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/year-end-settlement", label: "연말정산 계산기" },
  ],
  "regional-health": [
    { to: "/insurance", label: "건보료 역산 계산기" },
    { to: "/dependent", label: "피부양자 자격 판정기" },
    { to: "/unemployment", label: "실업급여 계산기" },
    { to: "/pension", label: "국민연금 수령액 계산기" },
  ],
  "dependent": [
    { to: "/regional-health", label: "지역가입자 건보료 계산기" },
    { to: "/insurance", label: "건보료 역산 계산기" },
    { to: "/pension", label: "국민연금 수령액 계산기" },
    { to: "/quit", label: "퇴사 계산기" },
  ],

  // ── 절세·공제 ──
  "year-end-settlement": [
    { to: "/monthly-rent-deduction", label: "월세 세액공제 계산기" },
    { to: "/irp", label: "IRP 세액공제 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/comprehensive-tax", label: "종합소득세 계산기" },
  ],
  "monthly-rent-deduction": [
    { to: "/year-end-settlement", label: "연말정산 계산기" },
    { to: "/irp", label: "IRP 세액공제 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/insurance", label: "건보료 역산 계산기" },
  ],
  "irp": [
    { to: "/year-end-settlement", label: "연말정산 계산기" },
    { to: "/monthly-rent-deduction", label: "월세 세액공제 계산기" },
    { to: "/pension", label: "국민연금 수령액 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
  ],
  "pension": [
    { to: "/irp", label: "IRP 세액공제 계산기" },
    { to: "/year-end-settlement", label: "연말정산 계산기" },
    { to: "/salary", label: "연봉 실수령액 계산기" },
    { to: "/regional-health", label: "지역가입자 건보료" },
  ],
};

const suggestions = computed(() => linkMap[props.current]);
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <RouterLink
      v-for="item in suggestions"
      :key="item.label"
      :to="item.to"
      class="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-caption font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      {{ item.label }}
    </RouterLink>
  </div>
</template>
