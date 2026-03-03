<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { Moon, Sun } from "lucide-vue-next";
import { RouterLink, useRoute } from "vue-router";
import TickerBar from "@/components/common/TickerBar.vue";
import {
  insuranceTickerMessages,
  salaryTickerMessages,
  compareTickerMessages,
  quitTickerMessages,
  withholdingTickerMessages,
  comprehensiveTaxTickerMessages,
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
  if (route.path.startsWith("/withholding")) return withholdingTickerMessages;
  if (route.path.startsWith("/comprehensive-tax")) return comprehensiveTaxTickerMessages;
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
  <header class="border-b border-border bg-primary/8">
    <div class="container pt-2.5 pb-2.5">
      <div class="overflow-hidden">
        <div class="retro-titlebar h-11 border-b-0 px-2 bg-transparent">
          <div class="flex h-full w-full items-center gap-4">
            <RouterLink
              to="/"
              aria-label="ShakiLabs 홈"
              class="inline-flex h-8 w-8 sm:w-auto shrink-0 items-center justify-center sm:justify-start gap-1.5 px-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <span
                class="inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted/60 ring-1 ring-border/60"
                aria-hidden="true"
              >
                <img src="/logo.png" alt="" class="h-4 w-4 shrink-0" />
              </span>
              <span class="hidden sm:inline text-tiny font-semibold tracking-wide text-foreground/90">
                ShakiLabs
              </span>
            </RouterLink>
            <div class="flex h-full flex-1 items-center justify-center text-center font-title text-caption sm:text-body overflow-hidden">
              <TickerBar :key="route.path" :messages="tickerMessages" />
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border/70 bg-transparent text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              :aria-label="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
              @click="toggleTheme"
            >
              <Moon v-if="theme === 'dark'" class="h-4 w-4" />
              <Sun v-else class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
