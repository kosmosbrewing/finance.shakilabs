// Types for the build-time route manifest so src tests can import it as the source of truth
// instead of restating the route lists (a copy would defeat the drift test that needs them).
export declare const SEO_ROUTES: string[];
export declare const SITEMAP_ROUTES: string[];
export declare const PARAM_ROUTES: string[];
/** 프리렌더되는 /salary/{금액}(만원) — 표의 연봉 링크를 이 집합으로 제한한다 */
export declare const SALARY_AMOUNTS: number[];
export declare const CALCULATOR_ROUTES: string[];
export declare const COMPARE_PAIRS: readonly (readonly [number, number])[];
export declare function canonicalPathFor(route: string): string;
