// llms.txt 생성 — 계산기 수와 URL 목록은 카탈로그에서만 파생한다.
//
// 왜 생성하나: 손으로 적어 둔 동안 "23개 계산기"가 두 번 박혀 있었고 실제로는 26개였다.
// 수익 스프린트가 /dependent·/unpaid-wage·/eitc를 추가했을 때 이 파일만 갱신되지 않았기
// 때문이다. 숫자를 고치는 것으로는 다음 계산기 추가 때 같은 일이 다시 일어난다.
//
// sitemap.xml과 같은 취급이다: public/에도 쓰고(리뷰에서 내용이 보이도록) dist/에도 쓴다.
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { CALCULATOR_CATALOG, CALCULATOR_ITEMS } from "./calculator-catalog.mjs";

const SITE_URL = "https://shakilabs.com/finance";
const DIST_DIR = resolve(import.meta.dirname, "../dist");
const PUBLIC_DIR = resolve(import.meta.dirname, "../public");

// 개수는 여기서 단 한 번 계산되고, 아래 본문에서는 이 변수만 쓴다.
const count = CALCULATOR_ITEMS.length;

const sections = CALCULATOR_CATALOG.map(
  ({ category, items }) =>
    `### ${category}\n` +
    items
      .map((item) => `- [${item.label}](${SITE_URL}${item.route}): ${item.summary}`)
      .join("\n"),
).join("\n\n");

// 갱신 주기를 약속하지 않는다: 이 저장소에는 스케줄 워크플로가 없고, 요율 변경을 감지하는
// 자동 수집 수단도 없다. 실제로 하는 일(사람이 고시를 확인해 반영)과 마지막으로 반영한
// 사실만 적는다.
const llmsTxt = `# 연봉·세금·수당 계산기 — shakilabs.com/finance

> 2026년 법령 기준 연봉 실수령액, 4대보험, 종합소득세, 퇴직금, 실업급여 등 ${count}개 계산기를 제공하는 무료 서비스입니다. 입력한 급여·세금 정보는 서버로 전송되지 않고 브라우저 안에서 계산합니다.

## 사이트 정보

- URL: ${SITE_URL}
- 언어: 한국어
- 데이터 기준: 2026년 법령·요율
- 갱신 방식: 요율 변동을 자동으로 수집하는 수단이 없어, 법령 개정·정부 고시를 사람이 확인해 계산 로직과 안내 문구를 함께 고칩니다 (가장 최근 반영: 2026년 7월 국민연금 기준소득월액 상한 659만원)
- 계산기 수: ${count}개
- 전체 목록 페이지: ${SITE_URL}/all

## 계산기 목록

${sections}

## 데이터 출처

- 4대보험 요율: 국민건강보험공단, 국민연금공단, 고용노동부 고시 (2026년)
- 소득세 누진세율: 소득세법 제55조 (6%~45%, 8구간)
- 퇴직소득세: 소득세법 제48조 (근속연수공제·환산급여공제)
- 최저임금: 고용노동부 고시 10,320원 (2026년)
- 실업급여 상한: 68,100원/일 (2026년 고시)
- 임금체불 지연이자: 근로기준법 제37조·시행령 제17조 (퇴직 후 연 20%)
- 근로장려금·자녀장려금: 조세특례제한법 제100조의5, 제100조의30

## 한계

- 모든 결과는 법적 효력이 없는 참고용 추정값입니다. 비과세 항목, 중도 입·퇴사, 성과급 지급 시점에 따라 실제 급여명세서와 차이가 날 수 있습니다.

## 연락처

- 이메일: skdba1313@gmail.com
`;

if (!existsSync(PUBLIC_DIR)) {
  mkdirSync(PUBLIC_DIR, { recursive: true });
}
writeFileSync(resolve(PUBLIC_DIR, "llms.txt"), llmsTxt, "utf-8");

if (existsSync(DIST_DIR)) {
  writeFileSync(resolve(DIST_DIR, "llms.txt"), llmsTxt, "utf-8");
}

console.log(`[llms.txt] Generated with ${count} calculators`);
