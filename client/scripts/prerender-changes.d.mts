export function buildChanges2027Html(route: string): string | null;
export function buildChanges2027Meta(
  siteUrl: string,
  buildBreadcrumb: (items: Array<{ name: string; url?: string }>) => unknown,
): {
  title: string;
  description: string;
  canonical: string;
  jsonLd: Array<Record<string, unknown>>;
  breadcrumb: unknown;
};
