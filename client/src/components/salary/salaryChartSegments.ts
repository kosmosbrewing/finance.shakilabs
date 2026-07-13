import type { BreakdownSegment } from "@shakilabs/ui";

export type SalaryChartSegment = BreakdownSegment & { color: string };

export type SalaryDeductionValues = {
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentInsurance: number;
  incomeTax: number;
  localTax: number;
};

export function buildSalaryDeductionSegments(
  values: SalaryDeductionValues,
): SalaryChartSegment[] {
  return [
    { key: "pension", label: "국민연금", value: values.nationalPension, color: "hsl(var(--chart-pension))" },
    { key: "health", label: "건강보험", value: values.healthInsurance, color: "hsl(var(--chart-health))" },
    { key: "care", label: "장기요양", value: values.longTermCare, color: "hsl(var(--chart-care))" },
    { key: "employment", label: "고용보험", value: values.employmentInsurance, color: "hsl(var(--chart-employment))" },
    { key: "income-tax", label: "소득세", value: values.incomeTax, color: "hsl(var(--chart-tax))" },
    { key: "local-tax", label: "지방소득세", value: values.localTax, color: "hsl(var(--chart-local-tax))" },
  ];
}
