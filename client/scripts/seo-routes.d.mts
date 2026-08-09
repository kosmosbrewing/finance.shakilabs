// Types for the build-time route manifest so src tests can import it as the source of truth
// instead of restating the route lists (a copy would defeat the drift test that needs them).
export declare const SEO_ROUTES: string[];
export declare const SITEMAP_ROUTES: string[];
export declare const PARAM_ROUTES: string[];
export declare function canonicalPathFor(route: string): string;
