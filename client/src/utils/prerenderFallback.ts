import type { Router } from "vue-router";

// 프리렌더 본문을 하이드레이션 이후에도 화면에 남긴다.
//
// 배경: 2026-07-10 커밋 86053a8은 body 직계의 [data-seo-prerender]를 전부 제거했다. 당시
// 프리렌더는 Vue 출력의 사본이라 중복 제거가 옳았다. 그러나 PR #67·#68이 프리렌더 스크립트에만
// 본문을 추가하면서 프리렌더가 Vue의 상위집합이 됐고, 같은 제거 로직이 이제는 그 페이지에만
// 존재하는 콘텐츠를 파괴한다. 실측으로 /guide/year-end는 1,730자 → 429자(25%)까지 떨어졌다.
//
// 왜 "숨김 해제"가 아니라 "이동"인가: 프리렌더 블록은 <div id="app">의 형제로 주입되는데 Vue의
// 푸터는 #app 안에 있다. 그대로 노출하면 본문이 푸터 아래에 붙는다. 그래서 헤더·푸터(= Vue
// 내비/푸터와 완전히 중복)는 제거하고, 본문 article만 레이아웃의 <main> 안으로 옮긴다.
//
// 왜 중요한가: 크롤러에게만 보이는 텍스트는 은닉 텍스트/클로킹이다. 사람이 보는 화면과 크롤러가
// 받는 HTML이 같아야 한다.

const ARTICLE_SELECTOR =
  "body > article[data-seo-prerender], body > section[data-seo-prerender]";
const CHROME_SELECTOR =
  "body > header[data-seo-prerender], body > footer[data-seo-prerender]";
export const PRERENDER_HOST_SELECTOR = "[data-prerender-host]";
const ADOPTED_ATTRIBUTE = "data-prerender-adopted";

// Vue 내비/푸터가 같은 내용을 렌더하므로 프리렌더 크롬은 하이드레이션 시점에 버린다.
export function removePrerenderChrome(root: ParentNode = document): number {
  const chrome = root.querySelectorAll(CHROME_SELECTOR);
  chrome.forEach((node) => node.remove());
  return chrome.length;
}

// 본문 블록을 body에서 떼어내 반환한다. mount 전에 호출해야 푸터 아래에 잠깐 보이는 일이 없다.
export function capturePrerenderArticle(
  root: ParentNode = document,
): HTMLElement | null {
  const article = root.querySelector<HTMLElement>(ARTICLE_SELECTOR);
  if (!article) return null;

  article.remove();
  // h1은 Vue 뷰가 이미 렌더한다 — 그대로 두면 문서에 h1이 2개가 된다.
  article.querySelector("h1")?.remove();
  article.setAttribute(ADOPTED_ATTRIBUTE, "");
  return article;
}

// "1. 수집하는 정보"와 "수집하는 정보", "자주 묻는 질문 (FAQ)"와 "자주 묻는 질문"을 같은 제목으로 본다.
function normalizeHeading(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\d+[.)]\s*/, "")
    .replace(/\s*\((?:FAQ|faq)\)\s*$/, "")
    .toLowerCase();
}

// 프리렌더 본문에서 Vue가 이미 렌더한 구간을 걷어낸다.
//
// 왜 필요한가: 프리렌더는 Vue의 상위집합이라 겹치는 구간이 있다. 그대로 붙이면 사용자가 같은 FAQ
// 질문과 같은 섹션을 두 번 보게 된다(실측: 23개 라우트에서 제목 중복, /privacy·/terms·/about·/는
// 전 구간 중복). 제목이 같은 구간을 통째로 버려 화면에는 Vue에 없는 내용만 남긴다.
export function dedupePrerenderArticle(
  article: HTMLElement,
  main: ParentNode,
): { total: number; removed: number } {
  const rendered = new Set(
    [...main.querySelectorAll("h1, h2, h3, h4")]
      .map((heading) => normalizeHeading(heading.textContent ?? ""))
      .filter(Boolean),
  );

  const headings = [...article.querySelectorAll("h2, h3, h4")];
  let removed = 0;

  for (const heading of headings) {
    // 앞선 구간을 지우면서 같이 떨어져 나갔을 수 있다.
    // isConnected를 쓰면 안 된다 — 이 시점의 article은 document에서 떼어낸 상태라 항상 false다.
    if (!article.contains(heading)) continue;
    if (!rendered.has(normalizeHeading(heading.textContent ?? ""))) continue;

    const level = Number(heading.tagName.slice(1));
    const doomed: Element[] = [heading];
    let sibling = heading.nextElementSibling;
    // 같은 레벨 이상의 다음 제목 직전까지가 이 구간이다
    while (sibling) {
      const match = /^H([1-6])$/.exec(sibling.tagName);
      if (match && Number(match[1]) <= level) break;
      doomed.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    doomed.forEach((node) => node.remove());
    removed += 1;
  }

  return { total: headings.length, removed };
}

// AppLayout이 <main> 끝에 렌더해 둔 빈 호스트로 옮긴다. 호스트는 Vue 템플릿상 자식이 없어
// 패치 대상이 아니므로, 안에 넣은 외부 노드를 Vue가 지우지 않는다.
//
// 남는 본문이 거의 없으면(전 구간이 Vue와 중복) 아예 붙이지 않는다 — 고아가 된 도입 문단만
// 남기는 것은 중복을 줄이는 게 아니라 어중간한 잔해를 남기는 것이다.
const MIN_ADOPTED_CHARS = 200;

export function adoptPrerenderArticle(
  article: HTMLElement | null,
  root: ParentNode = document,
): boolean {
  if (!article) return false;
  const host = root.querySelector(PRERENDER_HOST_SELECTOR);
  if (!host) return false;

  const main = host.closest("main") ?? root;
  dedupePrerenderArticle(article, main);

  const remaining = (article.textContent ?? "").replace(/\s+/g, "").length;
  if (remaining < MIN_ADOPTED_CHARS) return false;

  host.appendChild(article);
  return true;
}

// 본문은 진입 라우트의 것이다. SPA로 다른 라우트에 가면 더는 맞지 않으므로 버린다.
export function installPrerenderArticleCleanup(
  router: Router,
  entryPath: string,
  root: ParentNode = document,
): void {
  router.afterEach((to) => {
    if (to.path === entryPath) return;
    root.querySelector(`[${ADOPTED_ATTRIBUTE}]`)?.remove();
  });
}
