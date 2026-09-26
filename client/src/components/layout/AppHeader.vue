<script setup lang="ts">
// v3 §3.2 — 전역 검정 헤더. 셸 마크업은 패키지가 소유하고 앱은 링크와 유틸 슬롯만 채운다.
//
// 왜 앱 자체 헤더를 버리는가: 이전 헤더는 로고 + 중앙 팁 티커 + 테마 토글 박스를 한 줄에
// 담아 65px였고, 팁 문구 길이에 따라 페이지마다 높이가 달랐다(BL-005). 포털 `/`는 같은
// 사이트인데 56px 검정 헤더라 수화 전후·앱 간 셸이 갈라져 보였다.
// 0.3.38 "순수 내비게이션"(2026-09-25): 헤더는 위치(로고 / 앱 이름)와 이동(블로그·소개·☰)만 싣는다.
// 가운데 회전 팁은 정보라 뺐다 — 내비가 할 일이 아니다.
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { ShGlobalHeader, ShThemeToggle, type GlobalHeaderLink } from "@shakilabs/ui";
import {
  PRIMARY_NAV_ITEMS,
  findActiveNavItem,
} from "../../../scripts/primary-nav-items.mjs";

// 블로그는 루트 앱이라 절대 경로(href), 소개는 이 앱 라우트라 RouterLink(to).
const links: GlobalHeaderLink[] = [
  { href: "/blog", label: "블로그" },
  { to: "/about", label: "소개" },
];

// 모바일 전체 메뉴(☰). 목록은 2차 내비와 같은 모듈에서 온다(복제 금지).
// 비우면 패키지가 드로어 자체를 렌더하지 않으므로, 여기서 넘기는 것이 유일한 배선이다.
const route = useRoute();
const navActiveKey = computed(() => findActiveNavItem(route.path)?.key ?? "");
</script>

<template>
  <ShGlobalHeader
    app="finance"
    home-href="/"
    brand="ShakiLabs"
    logo-src="/finance/logo.png"
    :links="links"
    :nav-items="PRIMARY_NAV_ITEMS"
    :nav-active-key="navActiveKey"
    :link-component="RouterLink"
  >
    <template #utility>
      <ShThemeToggle storage-key="salary-calc:theme:v1" />
    </template>
  </ShGlobalHeader>
</template>
