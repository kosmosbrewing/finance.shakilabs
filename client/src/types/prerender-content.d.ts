// scripts/prerender-content.mjs를 테스트에서 직접 호출하기 위한 최소 선언
declare module "*prerender-content.mjs" {
  export function buildRichContent(
    route: string,
    meta: Record<string, unknown> | null
  ): string | null;
}
