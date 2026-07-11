<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { SALARY_TABLE_PRESETS } from "@/data/insurancePresets";
import { calculateSalaryBreakdown } from "@/utils/calculator";
import { formatKrwCompact, formatManWon, formatPercent, formatWon, deductionToneClass } from "@/lib/utils";

function formatMobileSalary(amount: number): string {
  return formatManWon(amount).replace("억원", "억").replace("만원", "만");
}

const rows = computed(() =>
  SALARY_TABLE_PRESETS.map((annualSalary) => {
    const breakdown = calculateSalaryBreakdown({
      grossAnnual: annualSalary,
      dependents: 1,
      children: 0,
      nonTaxableMonthly: 200_000,
      retirementIncluded: false,
    });

    return {
      annualSalary,
      manWon: Math.round(annualSalary / 10_000),
      deductionRate:
        breakdown.monthlyGross > 0
          ? 1 - breakdown.monthlyNet / breakdown.monthlyGross
          : 0,
      ...breakdown,
    };
  })
);
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">2026 연봉별 월 공제 합계·실수령·공제비율 표</h2>
    </div>

    <div class="px-2 pb-1 pt-2 md:px-0 md:pb-0 md:pt-0">
      <table aria-label="2026 연봉별 공제와 실수령액 비교" class="w-full table-fixed border-separate border-spacing-0 text-[10px] sm:text-[11px] md:text-caption">
        <colgroup>
          <col class="w-[29%] md:w-auto" />
          <col class="w-[24%] md:w-auto" />
          <col class="w-[27%] md:w-auto" />
          <col class="w-[20%] md:w-auto" />
        </colgroup>
        <thead>
          <tr class="bg-muted/45">
            <th scope="col" class="sticky left-0 z-20 border-b-2 border-primary/20 bg-muted/60 pl-2.5 pr-1.5 py-2 text-left font-semibold sm:px-3 md:px-3 md:py-2.5">
              연봉
            </th>
            <th scope="col" class="border-b-2 border-primary/20 px-1.5 py-2 text-right font-semibold sm:px-3 md:px-3 md:py-2.5">
              <span class="md:hidden">공제</span>
              <span class="hidden md:inline">월 공제 합계</span>
            </th>
            <th scope="col" class="border-b-2 border-primary/20 px-1.5 py-2 text-right font-semibold sm:px-3 md:px-3 md:py-2.5">
              <span class="md:hidden">실수령</span>
              <span class="hidden md:inline">월 실수령</span>
            </th>
            <th scope="col" class="border-b-2 border-primary/20 pl-1 pr-3 py-2 text-right font-semibold sm:px-3 md:px-3 md:py-2.5">
              <span class="md:hidden">비율</span>
              <span class="hidden md:inline">공제 비율</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.annualSalary"
            class="group even:bg-muted/10 transition-colors hover:bg-primary/5"
          >
            <td class="sticky left-0 z-10 border-t border-border/40 bg-card pl-2.5 pr-1.5 py-2 group-even:bg-muted/10 sm:px-3 md:px-3 md:py-2.5">
              <RouterLink
                :to="`/salary/${row.manWon}`"
                class="whitespace-nowrap font-semibold text-primary hover:underline"
              >
                <span class="md:hidden">{{ formatMobileSalary(row.annualSalary) }}</span>
                <span class="hidden md:inline">{{ formatManWon(row.annualSalary) }}</span>
              </RouterLink>
            </td>
            <td class="border-t border-border/40 px-1.5 py-2 text-right tabular-nums whitespace-nowrap sm:px-3 md:px-3 md:py-2.5">
              <span class="md:hidden">{{ formatKrwCompact(row.totalDeduction) }}</span>
              <span class="hidden md:inline">{{ formatWon(row.totalDeduction) }}</span>
            </td>
            <td class="border-t border-border/40 px-1.5 py-2 text-right tabular-nums font-semibold whitespace-nowrap sm:px-3 md:px-3 md:py-2.5">
              <span class="md:hidden">{{ formatKrwCompact(row.monthlyNet) }}</span>
              <span class="hidden md:inline">{{ formatWon(row.monthlyNet) }}</span>
            </td>
            <td class="border-t border-border/40 pl-1 pr-3 py-2 text-right tabular-nums sm:px-3 md:px-3 md:py-2.5">
              <span
                class="inline-flex min-w-[52px] items-center justify-center rounded-full border px-1 py-0.5 text-[9.5px] font-semibold sm:min-w-[60px] sm:px-2 sm:text-[10.5px] md:min-w-[72px] md:text-[11px]"
                :class="deductionToneClass(row.deductionRate)"
              >
                {{ formatPercent(row.deductionRate, 1) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="border-t border-border/60 px-4 py-3 text-caption text-muted-foreground">
      부양가족 1명, 비과세 20만원, 퇴직금 별도 기준의 참고값입니다.
    </div>
  </section>
</template>
