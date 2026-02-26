<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { Moon, Sun } from "lucide-vue-next";
import { useRoute } from "vue-router";
import TickerBar from "@/components/common/TickerBar.vue";
import {
  insuranceTickerMessages,
  salaryTickerMessages,
  compareTickerMessages,
  quitTickerMessages,
} from "@/data/tickerMessages";

const THEME_STORAGE_KEY = "salary-calc:theme:v1";
type ThemeMode = "light" | "dark";

const route = useRoute();
const theme = ref<ThemeMode>("light");

const tickerMessages = computed(() => {
  if (route.path.startsWith("/insurance")) return insuranceTickerMessages;
  if (route.path.startsWith("/salary")) return salaryTickerMessages;
  if (route.path.startsWith("/compare")) return compareTickerMessages;
  if (route.path.startsWith("/quit")) return quitTickerMessages;
  return salaryTickerMessages;
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
    <div class="container grid grid-cols-[2rem_1fr_2rem] items-center gap-2 py-2">
      <div></div>
      <TickerBar :key="route.path" :messages="tickerMessages" />
      <button
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        :aria-label="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
        @click="toggleTheme"
      >
        <Moon v-if="theme === 'dark'" class="h-3.5 w-3.5" />
        <Sun v-else class="h-3.5 w-3.5" />
      </button>
    </div>
  </header>
</template>
