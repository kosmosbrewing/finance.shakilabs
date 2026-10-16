import { useHead } from "@unhead/vue";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  filterDuplicateJsonLd,
  prerenderedJsonLdTypesForCurrentPath,
} from "@/utils/prerenderedJsonLd";
import { consolidateCanonicalUrl } from "@/utils/canonicalConsolidation";
import { brandTitle } from "../../scripts/page-titles.mjs";
import { useRoute } from "vue-router";
import { PARAM_ROUTES } from "../../scripts/seo-routes.mjs";

// 통합 변형(canonical → 기본 계산기) 집합 — seo-routes.mjs의 PARAM_ROUTES가 단일 소스
const PARAM_ROUTE_SET = new Set<string>(PARAM_ROUTES);

type SEOOptions = {
  title: MaybeRefOrGetter<string>;
  description: MaybeRefOrGetter<string>;
  ogImage?: MaybeRefOrGetter<string | undefined>;
  noindex?: MaybeRefOrGetter<boolean | undefined>;
  jsonLd?: MaybeRefOrGetter<
    Record<string, unknown> | Record<string, unknown>[] | undefined
  >;
};

// canonical·og:url용 주소 정규화.
// vercel.json이 trailingSlash:false라 끝 슬래시 주소는 308 대상이다. 라우터 base가 "/finance/"인
// 탓에 홈에서 슬래시가 남으면 canonical이 리다이렉트되는 주소를 가리키게 되므로 여기서 잘라낸다.
export function normalizeCanonicalUrl(href: string): string {
  try {
    const url = new URL(href);
    url.search = "";
    url.hash = "";
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    }
    // Doorway variants (/salary/5000 …) fold into their base calculator, matching the canonical
    // the prerender pass already wrote. Without this, hydration would re-point canonical at the
    // variant and undo the consolidation for any crawler that executes JS.
    return consolidateCanonicalUrl(url.toString());
  } catch {
    return href.split("#")[0].split("?")[0];
  }
}

// unhead v2 renders a script body from `textContent`/`innerHTML` only (see
// TagConfigKeys in unhead/dist/shared/unhead.yem5I2v_.mjs). Any other key — `children`, which
// this file used to pass — is normalized into `tag.props` and ends up as an HTML attribute, so
// the browser gets `<script type="application/ld+json" children="{...}">` with an empty body.
// `textContent` is also the XSS-safe field, and it is what the other apps in this monorepo use.
export function buildJsonLdScripts(
  entries: Record<string, unknown>[]
): { key: string; type: string; textContent: string }[] {
  return entries.map((entry, index) => ({
    key: `json-ld-${index}`,
    type: "application/ld+json",
    textContent: JSON.stringify(entry),
  }));
}

export function useSEO({
  title,
  description,
  ogImage,
  noindex = false,
  jsonLd,
}: SEOOptions): void {
  const route = useRoute();
  useHead(() => {
    // 뷰는 접미사 없는 페이지 제목을 넘긴다. 프리렌더(applyMeta)와 같은 brandTitle로 붙여야
    // 하이드레이션 뒤에도 `<페이지 제목> | ShakiLabs`가 정확히 한 번 남는다.
    const resolvedTitle = brandTitle(toValue(title));
    const resolvedDescription = toValue(description);
    // 색인 소거(2026-10-16): noindex는 self-canonical 페이지에만 — 통합 변형(/compare/3000-vs-4000 등)은 프리렌더가
    // canonical을 기본 페이지로 두므로 런타임 head가 noindex로 그 신호와 충돌하지 않게 한다(변형은 Googlebot robots 차단).
    const resolvedNoindex = Boolean(toValue(noindex)) && !PARAM_ROUTE_SET.has(route.path);
    const resolvedOgImage = toValue(ogImage);
    const resolvedJsonLd = toValue(jsonLd);
    const resolvedJsonLdArray = Array.isArray(resolvedJsonLd)
      ? resolvedJsonLd.filter(
          (entry): entry is Record<string, unknown> =>
            Boolean(entry) && typeof entry === "object"
        )
      : resolvedJsonLd && typeof resolvedJsonLd === "object"
        ? [resolvedJsonLd]
        : [];
    const currentUrl =
      typeof window !== "undefined"
        ? normalizeCanonicalUrl(window.location.href)
        : undefined;

    return {
      title: resolvedTitle,
      link: currentUrl ? [{ rel: "canonical", href: currentUrl }] : [],
      meta: [
        { name: "description", content: resolvedDescription },
        { property: "og:title", content: resolvedTitle },
        { property: "og:description", content: resolvedDescription },
        { name: "twitter:title", content: resolvedTitle },
        { name: "twitter:description", content: resolvedDescription },
        ...(currentUrl ? [{ property: "og:url", content: currentUrl }] : []),
        ...(resolvedNoindex ? [{ name: "robots", content: "noindex,nofollow" }] : []),
        ...(resolvedOgImage
          ? [
              { property: "og:image", content: resolvedOgImage },
              { name: "twitter:image", content: resolvedOgImage },
            ]
          : []),
      ],
      script: buildJsonLdScripts(
        filterDuplicateJsonLd(
          resolvedJsonLdArray,
          prerenderedJsonLdTypesForCurrentPath()
        )
      ),
    };
  });
}
