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
// 프리렌더 스크립트가 "이 구간은 Vue 뷰가 화면에 똑같이 그린다"고 표시해 둔 블록.
const MIRROR_SELECTOR = "[data-prerender-mirror]";

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

// 제목 대조로는 못 잡는 중복을 표식으로 걷어낸다.
//
// 왜 필요한가: dedupePrerenderArticle은 h2~h4로 시작하는 "구간"만 지운다. 그래서 제목 앞에 놓인
// 도입 문단과, 프리렌더에만 제목이 달린(뷰는 같은 문장을 <p>로 그리는) 목록은 둘 다 통과해
// 화면에 두 번 나왔다 — /guide/* 4개 라우트 전부. 문구 비교는 한 글자만 달라도 무너지므로
// 판정은 발행처(프리렌더 스크립트)가 붙인 표식으로 한다.
export function dropMirroredSections(article: HTMLElement): number {
  const mirrored = article.querySelectorAll(MIRROR_SELECTOR);
  mirrored.forEach((node) => node.remove());
  return mirrored.length;
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

const CONTAINER_CLASS = "sh-container";
const CONTAINER_WIDTH_PREFIX = "sh-container--";

// 호스트 폭을 진입 뷰의 컨테이너 폭에 맞춘다.
//
// 왜: 호스트는 AppLayout에 고정 폭(--page 1024)으로 박혀 있는데 뷰마다 컨테이너 폭이 다르다.
// /guide/*는 --prose(672)를 써서 입양된 본문이 뷰 본문보다 124px 넓게, 즉 왼쪽으로 삐져나온
// 채 그려졌다(라이브에서 로고-본문 어긋남으로 보인 증상). 폭 결정권은 뷰에 있으므로 뷰가 고른
// 폭 변종을 그대로 가져온다 — --tool(1152)·--page(1024)처럼 920px보다 넓은 쪽에서는 위의
// max-width 920px가 계속 이겨서 보이는 폭이 달라지지 않는다.
export function matchHostWidthToView(host: Element, root: ParentNode = document): void {
  const containers = [...root.querySelectorAll(`main .${CONTAINER_CLASS}`)];
  const view = containers.find((node) => node !== host);
  if (!view) return;

  const width = [...view.classList].find((name) => name.startsWith(CONTAINER_WIDTH_PREFIX));
  if (!width) return;

  // 스냅샷을 뜨고 지운다 — 살아있는 classList를 순회하면서 지우면 항목을 건너뛴다.
  for (const name of [...host.classList]) {
    if (name.startsWith(CONTAINER_WIDTH_PREFIX)) host.classList.remove(name);
  }
  host.classList.add(width);
}

export function adoptPrerenderArticle(
  article: HTMLElement | null,
  root: ParentNode = document,
): boolean {
  if (!article) return false;
  const host = root.querySelector(PRERENDER_HOST_SELECTOR);
  if (!host) return false;

  const main = host.closest("main") ?? root;
  dropMirroredSections(article);
  dedupePrerenderArticle(article, main);

  const remaining = (article.textContent ?? "").replace(/\s+/g, "").length;
  if (remaining < MIN_ADOPTED_CHARS) return false;

  matchHostWidthToView(host, root);
  // 본문은 첫 페인트용 자기 프레임(인라인 max-width·가운데 정렬·좌우 여백)을 들고 온다. 호스트가 이미
  // 프레임이므로 그대로 두면 여백이 두 번 들어가고, 0.3.34까지의 920px 가운데 정렬은 본문만 108px
  // 안쪽(x=276)에서 시작하게 했다. 걷어내서 호스트 콘텐츠 시작선(제목·계산기와 같은 x)에 붙이고,
  // 줄 길이는 prose 규칙(글줄 42rem)에 맡긴다 — 계산기 뷰(--tool)에 입양돼도 읽는 폭은 같다.
  article.style.maxWidth = "none";
  article.style.marginInline = "0";
  article.style.paddingInline = "0";
  article.classList.add("sh-container--prose");
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
