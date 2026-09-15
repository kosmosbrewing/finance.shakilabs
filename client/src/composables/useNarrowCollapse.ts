import { ref, type Ref } from "vue";

// 좁은 화면에서만 기본 접힘인 disclosure의 초기 상태.
//
// 왜 필요한가: 결과 카드의 공제 상세는 모바일 결과 영역 세로의 대부분을 차지해서,
// 핵심 숫자(월 실수령액)와 다음 행동이 한 화면에 같이 들어오지 않는다. PC는 그런 압박이
// 없으므로 펼친 채로 둔다 — 없던 클릭을 새로 만들 이유가 없다.
//
// 왜 v-if가 아니라 <details>와 함께 쓰는가: 접어도 노드는 DOM에 남아야 한다. 이 사이트는
// 애드센스 심사 이력이 있고 심사자는 JS를 실행한 DOM을 본다 — v-if로 지우면 심사자와
// 크롤러가 받는 본문이 실제로 줄어든다. <details>는 display:none일 뿐 노드는 살아 있다.
//
// 왜 onMounted가 아니라 setup에서 바로 읽는가: 이 앱의 프리렌더는 문자열 빌드라 Vue SSR이
// 없다. 마운트 후로 미루면 모바일에서 긴 블록이 펼쳐졌다 접히는 것이 눈에 보인다.
const NARROW_QUERY = "(max-width: 640px)";

export function useNarrowCollapse(query: string = NARROW_QUERY): Ref<boolean> {
  const narrow =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;
  return ref(!narrow);
}
