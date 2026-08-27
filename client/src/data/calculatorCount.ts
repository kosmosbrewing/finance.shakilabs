import { FOOTER_SECTIONS } from "./footerNav";

/**
 * 화면에서 "N개 계산기"라고 말할 때 쓰는 유일한 숫자.
 *
 * 왜 파생시키나: 이 숫자가 네 군데에 손으로 적혀 있었고 llms.txt는 26개가 된 지 3주가 지나도록
 * 23개라고 말했다. 푸터 목록은 화면에 실제로 링크가 걸리는 전체 계산기 목록이므로, 계산기를
 * 추가하면 이 숫자가 같이 움직인다. 푸터 목록이 사이트맵과 어긋나면 빌드가 실패한다
 * (scripts/calculator-catalog.mjs).
 */
export const CALCULATOR_COUNT = FOOTER_SECTIONS.reduce(
  (total, section) => total + section.links.length,
  0,
);
