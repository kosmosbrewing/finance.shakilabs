<script setup lang="ts">
// v3 §3.2 — 전역 검정 헤더. 셸 마크업은 패키지가 소유하고 앱은 링크와 유틸 슬롯만 채운다.
//
// 왜 앱 자체 헤더를 버리는가: 이전 헤더는 로고 + 중앙 팁 티커 + 테마 토글 박스를 한 줄에
// 담아 65px였고, 팁 문구 길이에 따라 페이지마다 높이가 달랐다(BL-005). 포털 `/`는 같은
// 사이트인데 56px 검정 헤더라 수화 전후·앱 간 셸이 갈라져 보였다.
// 0.3.38 "순수 내비게이션"(2026-09-25): 헤더는 위치(로고 / 앱 이름)와 이동(블로그·소개·☰)만 싣는다.
// 가운데 회전 팁은 정보라 뺐다 — 내비가 할 일이 아니다.
import { computed, onMounted, ref } from "vue";
import { Moon, Sun } from "lucide-vue-next";
import { RouterLink, useRoute } from "vue-router";
import { ShGlobalHeader, type GlobalHeaderLink } from "@shakilabs/ui";
import {
  PRIMARY_NAV_ITEMS,
  findActiveNavItem,
} from "../../../scripts/primary-nav-items.mjs";

const THEME_STORAGE_KEY = "salary-calc:theme:v1";
type ThemeMode = "light" | "dark";

// 블로그는 루트 앱이라 절대 경로(href), 소개는 이 앱 라우트라 RouterLink(to).
const links: GlobalHeaderLink[] = [
  { href: "/blog", label: "블로그" },
  { to: "/about", label: "소개" },
];

// 모바일 전체 메뉴(☰). 목록은 2차 내비와 같은 모듈에서 온다(복제 금지).
// 비우면 패키지가 드로어 자체를 렌더하지 않으므로, 여기서 넘기는 것이 유일한 배선이다.
const route = useRoute();
const navActiveKey = computed(() => findActiveNavItem(route.path)?.key ?? "");

const theme = ref<ThemeMode>("light");

function applyTheme(next: ThemeMode): void {
  theme.value = next;
  document.documentElement.classList.toggle("dark", next === "dark");
  localStorage.setItem(THEME_STORAGE_KEY, next);
}

function toggleTheme(): void {
  applyTheme(theme.value === "dark" ? "light" : "dark");
}

onMounted(() => {
  theme.value = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
});
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
      <!-- 패키지 헤더 링크 스타일을 그대로 쓴다 — 검정 위 밝은 글자·hover 10% 흰 배경·
           밝은 포커스 링이 전부 .sh-global-header 규칙에서 온다. 별도 박스(ShButton
           secondary)를 쓰면 검정 헤더 위에 흰 상자가 떠 보인다(재검수 §1). -->
      <button
        type="button"
        class="sh-global-header__link"
        :aria-label="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
        @click="toggleTheme"
      >
        <Moon v-if="theme === 'dark'" class="h-4 w-4" aria-hidden="true" />
        <Sun v-else class="h-4 w-4" aria-hidden="true" />
      </button>
    </template>
  </ShGlobalHeader>
</template>
