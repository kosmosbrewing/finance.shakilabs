<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();

// CPC × 검색량 내림차순 (S tier → A tier → 허브)
const tabs = [
  { key: "salary", label: "연봉 실수령", to: "/salary" },
  { key: "comprehensive-tax", label: "종합소득세", to: "/comprehensive-tax" },
  { key: "year-end-settlement", label: "연말정산", to: "/year-end-settlement" },
  { key: "severance-pay", label: "퇴직금", to: "/severance-pay" },
  { key: "unemployment", label: "실업급여", to: "/unemployment" },
  { key: "weekly-holiday-pay", label: "주휴수당", to: "/weekly-holiday-pay" },
  { key: "parental-leave", label: "육아휴직", to: "/parental-leave" },
  { key: "wage-converter", label: "시급 환산", to: "/wage-converter" },
  { key: "all", label: "전체 →", to: "/all" },
] as const;

const activePath = computed(() => route.path);

function isActiveTab(key: (typeof tabs)[number]["key"]): boolean {
  if (key === "all") return activePath.value === "/all";
  // /freelancer는 종합소득세 탭에 포함
  if (key === "comprehensive-tax" && activePath.value.startsWith("/freelancer")) return true;
  return activePath.value.startsWith(`/${key}`);
}

const scrollEl = ref<HTMLElement | null>(null);
const showFade = ref(true);

function checkScroll() {
  const el = scrollEl.value;
  if (!el) return;
  // 우측 끝에 8px 이내로 도달하면 fade 숨김
  showFade.value = el.scrollWidth - el.scrollLeft - el.clientWidth > 8;
}

onMounted(() => {
  const el = scrollEl.value;
  if (el) {
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
  }
});

onBeforeUnmount(() => {
  scrollEl.value?.removeEventListener("scroll", checkScroll);
});
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-primary/20 bg-primary shadow-sm" aria-label="주요 메뉴">
    <div class="container relative">
      <div ref="scrollEl" class="flex h-12 items-center gap-2 overflow-x-auto" style="scrollbar-width: none">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="tab.to"
          :aria-current="isActiveTab(tab.key) ? 'page' : undefined"
          :class="[
            'touch-target relative inline-flex h-12 shrink-0 items-center justify-center px-3 text-center text-[0.82rem] font-semibold leading-tight transition-all duration-200 sm:text-body',
            isActiveTab(tab.key)
              ? 'text-primary-foreground'
              : 'text-primary-foreground/70 hover:text-primary-foreground/90',
          ]"
        >
          <span class="break-keep">{{ tab.label }}</span>
          <span
            v-if="isActiveTab(tab.key)"
            class="absolute inset-x-1 bottom-0 h-[3px] rounded-full bg-white"
          />
        </RouterLink>
      </div>
      <!-- 스크롤 힌트: 우측 그라디언트 fade -->
      <div
        v-show="showFade"
        class="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-primary to-transparent"
        aria-hidden="true"
      />
    </div>
  </nav>
</template>
