<script setup lang="ts">
// 「관련 서비스」 — 다른 앱 계산기로 가는 링크. 「이어서 계산하기」와 같은 문법(@shakilabs/ui ShNextActions):
// 카드 전체가 링크, 제목 한 줄 + 한 줄 요약. 소개 문단·아이콘·"바로 가기" 줄은 두지 않는다(사용자 피드백
// "텍스트가 너무 많고 밋밋함"). 제목·요약은 도착 계산기가 실제로 받는 입력 기준으로 적는다.
// 다른 앱이라 href(문서 이동) — 이전과 같은 주소다.
import { ShNextActions, type NextActionItem } from "@shakilabs/ui";

const items: readonly NextActionItem[] = [
  { key: "card-fuel", title: "주유 카드 비교", href: "/card/fuel-card", note: "월 주유비 기준 카드별 연간 순혜택" },
  { key: "biz-individual-vs-corp", title: "개인 vs 법인 비교", href: "/biz/individual-vs-corp", note: "사업자 유형별 세후소득 차이" },
  { key: "invest-dividend-tax", title: "배당소득세 계산", href: "/invest/dividend-tax", note: "배당 원천징수와 세후 수령액" },
];
</script>

<template>
  <ShNextActions heading="관련 서비스" :items="items" />
</template>
