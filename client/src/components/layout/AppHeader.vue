<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Moon, Sun } from "lucide-vue-next";
import { useRoute } from "vue-router";

const THEME_STORAGE_KEY = "salary-calc:theme:v1";
type ThemeMode = "light" | "dark";

const route = useRoute();
const theme = ref<ThemeMode>("light");

const routeLabel = computed(() => {
  if (route.path.startsWith("/insurance")) return "건보료 역산";
  if (route.path.startsWith("/salary")) return "연봉 실수령";
  if (route.path.startsWith("/compare")) return "이직 비교";
  if (route.path.startsWith("/quit")) return "퇴사 시뮬레이터";
  return "금융 계산";
});

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
  <header class="border-b border-border/80 bg-background">
    <div class="container flex items-center justify-between gap-3 py-3">
      <div>
        <p class="text-caption uppercase tracking-wide text-muted-foreground">finance.shakilabs.com</p>
        <p class="text-body font-title text-foreground">2026 연봉·건보료·4대보험 계산기</p>
      </div>

      <div class="flex items-center gap-2">
        <span class="hidden sm:inline text-caption text-muted-foreground">{{ routeLabel }}</span>
        <button
          type="button"
          class="inline-flex touch-target h-11 w-11 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary hover:scale-[1.02]"
          :aria-label="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
          @click="toggleTheme"
        >
          <Moon v-if="theme === 'dark'" class="h-4 w-4" />
          <Sun v-else class="h-4 w-4" />
        </button>
      </div>
    </div>
  </header>
</template>
