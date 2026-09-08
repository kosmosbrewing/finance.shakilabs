// Tax-credit vocabulary gate.
//
// NOTE: comments here are intentionally ASCII-only. scripts/ is scanned by
// font-subset-config.mjs, so a non-ASCII character would change the shipped font
// subset and force a fonts:subset regeneration.
//
// WHAT WENT WRONG
// ---------------------------------------------------------------------------
// A tax credit produces TWO true numbers and they are 10% apart:
//   taxCredit             - what is subtracted from income tax (the statutory credit)
//   taxCreditWithLocalTax - what the taxpayer actually stops paying, because the
//                           local income tax falls with it
//                           (지방세특례제한법 제167조의2제1항: the local tax is reduced by
//                            100분의 10 of whatever the income tax credit is)
// /irp shipped a table whose rate cell advertised the local-inclusive rate (16.5%)
// while the amount cell next to it held the income-tax-only credit (1,350,000), and
// the digest prose four screens down quoted 1,485,000 for the same scenario. One
// page, one scenario, two numbers, no label saying which was which.
//
// WHY THE ANCHORS ARE LITERAL
// ---------------------------------------------------------------------------
// The obvious gate - recompute both figures from the engine and compare them to the
// page - cannot fail: page and expectation would come from the same constant and
// move together. So the expected strings below are typed out by hand. Changing a
// rate, a cap, or the local surcharge makes the page and the engine agree with each
// other and disagree with this file, which is the point.
//
// FOUR ASSERTIONS PER ANCHOR
//   1. both literals are on the page (never one alone);
//   2. the two literals are 1.1x of each other, re-derived from the digits in the
//      strings themselves - so a typo in either one is caught without the engine;
//   3. the engine still produces exactly those two numbers for the documented
//      scenario, so the page and the calculator cannot drift apart silently;
//   4. LABEL RULES, which are the actual defect:
//      a. no table row may pair the local-inclusive RATE with the income-tax-only
//         AMOUNT unless the local-inclusive amount is in that same row. This is the
//         shipped bug: a row reading "15% (16.5%) | 1,350,000원";
//      b. columns must not lie about their basis. A cell holding the income-tax-only
//         amount may not sit under a header that says 지방소득세, and a cell holding
//         the local-inclusive amount may not sit under a header that says 소득세
//         without 지방소득세;
//      c. the local-inclusive amount may never be introduced as "공제 대상" - the
//         amount ELIGIBLE for the credit is the contribution (9,000,000원), not the
//         saving it produces. That phrasing is what put 1,485,000 on the page under a
//         label that belonged to a third number;
//      d. the page has to state the canonical label at least once, so a reader who
//         meets either figure can find out which basis it is on.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { calcIrpTaxCredit, calcMonthlyRentDeduction } from "./calc-engine.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(projectRoot, "dist");

const LOCAL_TAX_WORD = "지방소득세"; // "local income tax"
const INCOME_TAX_WORD = "소득세"; // "income tax" - a substring of the word above, so order matters
const CANONICAL_LABEL = "지방소득세 포함"; // "local income tax included"
const ELIGIBLE_AMOUNT_PHRASE = "공제 대상"; // "amount eligible for the credit" - never the saving
const PHRASE_WINDOW = 40;

// Hand-typed expectations. Do not compute these.
const ANCHORS = [
  {
    route: "/irp",
    label: "연금계좌 세액공제", // 연금계좌 세액공제
    // 소득세법 제59조의3제1항 - 총급여 5,500만원 이하 15%, 한도 900만원
    scenario: { annualSalary: 50_000_000, pensionSavings: 6_000_000, irpContribution: 3_000_000 },
    engine: (input) => calcIrpTaxCredit(input),
    incomeTax: "1,350,000원",
    withLocal: "1,485,000원",
    rate: "15%",
    rateWithLocal: "16.5%",
  },
  {
    route: "/monthly-rent-deduction",
    label: "월세액 세액공제", // 월세액 세액공제
    // 조세특례제한법 제95조의2제1항 - 총급여 5,500만원 이하 17%, 한도 1,000만원
    scenario: { annualSalary: 48_000_000, monthlyRent: 700_000, paidMonths: 12 },
    engine: (input) => calcMonthlyRentDeduction(input),
    incomeTax: "1,428,000원",
    withLocal: "1,570,800원",
    rate: "17%",
    rateWithLocal: "18.7%",
  },
];

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const digitsOf = (won) => Number(won.replace(/[^\d]/g, ""));

// Mirrors the statute: the local reduction is 10% OF THE CREDIT, floored to the won.
const expectedWithLocal = (incomeTax) => incomeTax + Math.floor(incomeTax * 0.1);

function prerenderedBody(html) {
  return [
    ...html.matchAll(/<(article|section)[^>]*\bdata-seo-prerender\b[^>]*>([\s\S]*?)<\/\1>/gi),
  ]
    .map(([, , inner]) => inner)
    .join("\n");
}

function textOf(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
}

function occurrences(haystack, needle) {
  const found = [];
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    found.push(index);
    index = haystack.indexOf(needle, index + needle.length);
  }
  return found;
}

for (const anchor of ANCHORS) {
  const file = resolve(distRoot, anchor.route.slice(1), "index.html");
  if (!existsSync(file)) {
    failures.push(`${anchor.route}: no static output - run the build first`);
    continue;
  }
  const html = readFileSync(file, "utf8");
  const body = prerenderedBody(html);
  const text = textOf(body);

  // 1. both literals present
  assert(
    text.includes(anchor.incomeTax),
    `${anchor.route}: income-tax credit ${anchor.incomeTax} is missing from the page`,
  );
  assert(
    text.includes(anchor.withLocal),
    `${anchor.route}: local-tax-inclusive saving ${anchor.withLocal} is missing from the page` +
      ` - a page that prints only one of the two makes the other unfindable`,
  );

  // 2. the two literals agree with each other
  const literalIncome = digitsOf(anchor.incomeTax);
  const literalWithLocal = digitsOf(anchor.withLocal);
  assert(
    literalWithLocal === expectedWithLocal(literalIncome),
    `${anchor.route}: anchors disagree - ${anchor.incomeTax} + 10% is` +
      ` ${expectedWithLocal(literalIncome).toLocaleString("en-US")} but the anchor says ${anchor.withLocal}`,
  );
  const rateNumber = Number(anchor.rate.replace("%", ""));
  const rateWithLocalNumber = Number(anchor.rateWithLocal.replace("%", ""));
  assert(
    Math.abs(rateWithLocalNumber - rateNumber * 1.1) < 0.05,
    `${anchor.route}: rate anchors disagree - ${anchor.rate} + 10% is not ${anchor.rateWithLocal}`,
  );

  // 3. the engine still produces the anchored numbers
  const engineResult = anchor.engine(anchor.scenario);
  assert(
    engineResult.taxCredit === literalIncome,
    `${anchor.route}: engine now returns taxCredit ${engineResult.taxCredit.toLocaleString("en-US")}` +
      ` but the anchor is ${anchor.incomeTax} - update ${anchor.label} anchors deliberately`,
  );
  assert(
    engineResult.taxCreditWithLocalTax === literalWithLocal,
    `${anchor.route}: engine now returns taxCreditWithLocalTax` +
      ` ${engineResult.taxCreditWithLocalTax.toLocaleString("en-US")} but the anchor is ${anchor.withLocal}`,
  );

  // 4a. no row may advertise the local-inclusive rate beside the income-tax-only amount
  for (const [row] of body.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)) {
    const rowText = textOf(row);
    if (!rowText.includes(anchor.rateWithLocal)) continue;
    if (!rowText.includes(anchor.incomeTax)) continue;
    assert(
      rowText.includes(anchor.withLocal),
      `${anchor.route}: a table row shows the local-inclusive rate ${anchor.rateWithLocal}` +
        ` next to the income-tax-only amount ${anchor.incomeTax} without the` +
        ` local-inclusive amount ${anchor.withLocal}. Row: ${rowText.trim().slice(0, 160)}`,
    );
  }

  // 4b. a column header must describe the basis of the cells under it
  for (const [table] of body.matchAll(/<table\b[\s\S]*?<\/table>/gi)) {
    const headers = [...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(([, cell]) =>
      textOf(cell).trim(),
    );
    if (headers.length === 0) continue;
    for (const [row] of table.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)) {
      const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(([, cell]) =>
        textOf(cell).trim(),
      );
      for (const [column, cell] of cells.entries()) {
        const header = headers[column] ?? "";
        const localHeader = header.includes(LOCAL_TAX_WORD);
        // "소득세" outside of "지방소득세" means the column is on the income-tax basis
        const incomeHeader = header.replace(LOCAL_TAX_WORD, "").includes(INCOME_TAX_WORD);
        if (cell.includes(anchor.incomeTax)) {
          assert(
            !localHeader,
            `${anchor.route}: the income-tax-only amount ${anchor.incomeTax} sits under the` +
              ` column "${header}", which claims the local income tax is included`,
          );
        }
        if (cell.includes(anchor.withLocal)) {
          assert(
            localHeader || !incomeHeader,
            `${anchor.route}: the local-tax-inclusive amount ${anchor.withLocal} sits under the` +
              ` column "${header}", which claims an income-tax-only basis`,
          );
        }
      }
    }
  }

  // 4c. the saving is never called the amount eligible for the credit
  for (const index of occurrences(text, anchor.withLocal)) {
    const lead = text.slice(Math.max(0, index - PHRASE_WINDOW), index);
    assert(
      !lead.includes(ELIGIBLE_AMOUNT_PHRASE),
      `${anchor.route}: "${anchor.withLocal}" is introduced as "${ELIGIBLE_AMOUNT_PHRASE}", but the` +
        ` amount eligible for the credit is the contribution, not the saving.` +
        ` Context: ...${lead.trim()}[${anchor.withLocal}]`,
    );
  }

  // 4d. the distinction is stated in words somewhere on the page
  assert(
    text.includes(CANONICAL_LABEL),
    `${anchor.route}: the page never uses the canonical label "${CANONICAL_LABEL}", so neither` +
      ` figure is identifiable`,
  );
}

if (failures.length > 0) {
  console.error(`\nTax-credit vocabulary gate: ${failures.length} failure(s)\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error("");
  process.exit(1);
}

console.log(`Tax-credit vocabulary gate: ${ANCHORS.length} anchored routes OK`);
