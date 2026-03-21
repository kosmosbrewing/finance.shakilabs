<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { Moon, Sun } from "lucide-vue-next";
import { RouterLink, useRoute } from "vue-router";
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

const THEME_STORAGE_KEY = "salary-calc:theme:v1";
type ThemeMode = "light" | "dark";

const route = useRoute();
const theme = ref<ThemeMode>("light");

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
  if (route.path === "/all") return allCalculatorsTickerMessages;
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
          <div class="flex h-full w-full items-center gap-2 sm:gap-4">
            <RouterLink
              to="/"
              aria-label="ShakiLabs 홈"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center gap-1 px-0.5 text-muted-foreground transition-colors hover:text-foreground sm:w-auto sm:justify-start sm:gap-1.5"
            >
              <span
                class="inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted/60 ring-1 ring-border/60"
                aria-hidden="true"
              >
                <img src="/logo.png" alt="" width="16" height="16" class="h-4 w-4 shrink-0" />
              </span>
              <span class="hidden sm:inline font-brand text-tiny font-semibold tracking-wide text-foreground/90">
                ShakiLabs
              </span>
            </RouterLink>
            <div class="flex min-w-0 flex-1 items-center justify-center overflow-hidden px-1 text-center font-brand text-caption tracking-[-0.01em] sm:h-full sm:px-0 sm:text-body sm:tracking-[0.01em]">
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
