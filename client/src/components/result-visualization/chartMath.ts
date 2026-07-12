export type ChartSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type NormalizedChartSegment = ChartSegment & {
  ratio: number;
  offset: number;
};

export type ComparisonMetric = {
  key: string;
  label: string;
  before: number;
  after: number;
};

export function normalizeChartSegments(
  segments: readonly ChartSegment[],
): NormalizedChartSegment[] {
  const validSegments = segments
    .filter((segment) => Number.isFinite(segment.value) && segment.value > 0)
    .map((segment) => ({ ...segment, value: Math.max(0, segment.value) }));
  const total = validSegments.reduce((sum, segment) => sum + segment.value, 0);

  if (total <= 0) return [];

  let offset = 0;
  return validSegments.map((segment) => {
    const ratio = segment.value / total;
    const normalized = { ...segment, ratio, offset };
    offset += ratio;
    return normalized;
  });
}

export function comparisonScale(metrics: readonly ComparisonMetric[]): number {
  return metrics.reduce(
    (maximum, metric) => Math.max(maximum, metric.before, metric.after),
    0,
  );
}
