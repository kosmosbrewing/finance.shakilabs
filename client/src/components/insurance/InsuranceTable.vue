<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { SALARY_TABLE_PRESETS } from "@/data/insurancePresets";
import { calculateSalaryBreakdown } from "@/utils/calculator";
import { formatManWon, formatPercent, formatWon } from "@/lib/utils";

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

function deductionToneClass(rate: number): string {
  if (rate >= 0.32) return "bg-status-danger/10 text-status-danger border-status-danger/20";
  if (rate >= 0.24) return "bg-status-caution/10 text-status-caution border-status-caution/20";
  return "bg-status-success/10 text-status-success border-status-success/20";
}
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">2026 연봉별 월 공제 합계·실수령·공제비율 표</h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[460px] border-separate border-spacing-0 text-[12px] md:min-w-0 md:text-caption">
        <thead>
          <tr class="bg-muted/45">
            <th class="sticky left-0 z-20 border-b-2 border-primary/20 bg-muted/60 px-2 py-2 text-left font-semibold md:px-3 md:py-2.5">
              연봉
            </th>
            <th class="border-b-2 border-primary/20 px-2 py-2 text-right font-semibold md:px-3 md:py-2.5">
              월 공제 합계
            </th>
            <th class="border-b-2 border-primary/20 px-2 py-2 text-right font-semibold md:px-3 md:py-2.5">
              월 실수령
            </th>
            <th class="border-b-2 border-primary/20 px-2 py-2 text-right font-semibold md:px-3 md:py-2.5">
              공제 비율
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.annualSalary"
            class="group even:bg-muted/10 transition-colors hover:bg-primary/5"
          >
            <td class="sticky left-0 z-10 border-t border-border/40 bg-card px-2 py-2 group-even:bg-muted/10 md:px-3 md:py-2.5">
              <RouterLink
                :to="`/salary/${row.manWon}`"
                class="font-semibold text-primary whitespace-nowrap hover:underline"
              >
                {{ formatManWon(row.annualSalary) }}
              </RouterLink>
            </td>
            <td class="border-t border-border/40 px-2 py-2 text-right tabular-nums whitespace-nowrap md:px-3 md:py-2.5">
              {{ formatWon(row.totalDeduction) }}
            </td>
            <td class="border-t border-border/40 px-2 py-2 text-right tabular-nums font-semibold whitespace-nowrap md:px-3 md:py-2.5">
              {{ formatWon(row.monthlyNet) }}
            </td>
            <td class="border-t border-border/40 px-2 py-2 text-right tabular-nums md:px-3 md:py-2.5">
              <span
                class="inline-flex min-w-[64px] items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold md:min-w-[72px]"
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
