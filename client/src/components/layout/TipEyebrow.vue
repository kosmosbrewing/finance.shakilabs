<script setup lang="ts">
// BL-005 — 팁/고시 문구를 헤더 밖으로.
//
// 같은 문구가 이전에는 글로벌 헤더 한가운데에 있었다. 그래서 (1) 헤더 높이가 문구 길이에
// 따라 페이지마다 달랐고 (2) 팁이 스크롤해도 사라지지 않아 모바일 첫 화면 chrome을 먹었다.
// 여기서는 본문 <main> 최상단 eyebrow로 렌더한다 — 셸이 아니라 콘텐츠이므로 스크롤과 함께
// 사라지고, 헤더 높이는 문구와 무관하게 56px로 고정된다.
import { computed } from "vue";
import { useRoute } from "vue-router";
import TickerBar from "@/components/common/TickerBar.vue";
import {
  annualLeaveTickerMessages,
  insuranceTickerMessages,
  salaryTickerMessages,
  raiseTickerMessages,
  bonusTickerMessages,
  overtimeTickerMessages,
  pensionTickerMessages,
  monthlyRentTickerMessages,
  irpTickerMessages,
  employerInsuranceTickerMessages,
  compareTickerMessages,
  quitTickerMessages,
  withholdingTickerMessages,
  comprehensiveTaxTickerMessages,
  freelanceRateTickerMessages,
  yearEndSettlementTickerMessages,
  severancePayTickerMessages,
  unemploymentTickerMessages,
  weeklyHolidayPayTickerMessages,
  parentalLeaveTickerMessages,
  wageConverterTickerMessages,
  allCalculatorsTickerMessages,
} from "@/data/tickerMessages";

const route = useRoute();

const tickerMessages = computed(() => {
  if (route.path.startsWith("/insurance")) return insuranceTickerMessages;
  if (route.path.startsWith("/salary")) return salaryTickerMessages;
  if (route.path.startsWith("/raise")) return raiseTickerMessages;
  if (route.path.startsWith("/bonus")) return bonusTickerMessages;
  if (route.path.startsWith("/annual-leave")) return annualLeaveTickerMessages;
  if (route.path.startsWith("/overtime")) return overtimeTickerMessages;
  if (route.path.startsWith("/pension")) return pensionTickerMessages;
  if (route.path.startsWith("/monthly-rent-deduction")) return monthlyRentTickerMessages;
  if (route.path.startsWith("/irp")) return irpTickerMessages;
  if (route.path.startsWith("/4-insurance-employer")) return employerInsuranceTickerMessages;
  if (route.path.startsWith("/compare")) return compareTickerMessages;
  if (route.path.startsWith("/quit")) return quitTickerMessages;
  if (route.path.startsWith("/withholding")) return withholdingTickerMessages;
  if (route.path.startsWith("/freelance-rate")) return freelanceRateTickerMessages;
  if (route.path.startsWith("/freelancer")) return comprehensiveTaxTickerMessages;
  if (route.path.startsWith("/comprehensive-tax")) return comprehensiveTaxTickerMessages;
  if (route.path.startsWith("/year-end-settlement")) return yearEndSettlementTickerMessages;
  if (route.path.startsWith("/severance-pay")) return severancePayTickerMessages;
  if (route.path.startsWith("/unemployment")) return unemploymentTickerMessages;
  if (route.path.startsWith("/weekly-holiday-pay")) return weeklyHolidayPayTickerMessages;
  if (route.path.startsWith("/parental-leave")) return parentalLeaveTickerMessages;
  if (route.path.startsWith("/wage-converter")) return wageConverterTickerMessages;
  if (route.path.startsWith("/regional-health")) return insuranceTickerMessages;
  if (route.path.startsWith("/dependent")) return insuranceTickerMessages;
  if (route.path.startsWith("/unpaid-wage")) return severancePayTickerMessages;
  if (route.path.startsWith("/eitc")) return yearEndSettlementTickerMessages;
  if (route.path === "/all") return allCalculatorsTickerMessages;
  return salaryTickerMessages;
});
</script>

<template>
  <!-- 헤더 가운데 슬롯에 실린다. 바깥 여백·경계는 패키지의 .sh-global-header__tip이
       소유하므로 여기서는 내용만 그린다 — 자체 컨테이너를 두면 헤더 높이가 흔들린다. -->
  <span data-tip-eyebrow class="inline-flex items-center whitespace-nowrap">
    <TickerBar :key="route.path" :messages="tickerMessages" />
  </span>
</template>
