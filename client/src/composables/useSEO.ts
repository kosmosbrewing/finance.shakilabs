import { useHead } from "@unhead/vue";
import { toValue, type MaybeRefOrGetter } from "vue";

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
    return url.toString();
  } catch {
    return href.split("#")[0].split("?")[0];
  }
}

export function useSEO({
  title,
  description,
  ogImage,
  noindex = false,
  jsonLd,
}: SEOOptions): void {
  useHead(() => {
    const resolvedTitle = toValue(title);
    const resolvedDescription = toValue(description);
    const resolvedNoindex = Boolean(toValue(noindex));
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
      script: resolvedJsonLdArray.map((entry, index) => ({
        key: `json-ld-${index}`,
        type: "application/ld+json",
        children: JSON.stringify(entry),
      })),
    };
  });
}
