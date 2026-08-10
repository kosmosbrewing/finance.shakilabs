// 프리렌더 페이지별 리치 콘텐츠 빌더
// 각 계산기 라우트에 대해 실제 계산값 + 가이드 + FAQ를 포함한 800+단어 정적 HTML 생성
// buildRichContent(route, meta) → string(HTML) | null

import {
  calculateSalaryBreakdown,
  comprehensiveTotalTaxOf,
  computeComprehensiveTax,
  EITC_BRACKET_TABLE,
  eitcAmountFor,
  formatWon,
  formatManWonValue,
  formatPercent,
  INCOME_TAX_BRACKETS,
  parentalLeavePay,
  RATES_2026,
  SEVERANCE_ASSUMED_MONTHLY,
  SIMPLE_EXPENSE_THRESHOLD,
  regionalHealthEstimate,
  severancePayEstimate,
  unemploymentDailyAllowance,
  UNPAID_WAGE_RATE_TABLE,
  unpaidWageInterest,
  wageConversion,
  weeklyHolidayPay,
  withholdingReverse,
} from "./calc-engine.mjs";
import {
  COMPARE_PAIRS,
  COMPREHENSIVE_TAX_AMOUNTS,
  FREELANCER_AMOUNTS,
  INSURANCE_AMOUNTS,
  SALARY_AMOUNTS,
  UNPAID_WAGE_AMOUNTS,
} from "./seo-routes.mjs";
import { buildHubContent } from "./hub-content.mjs";
import {
  HOME_DESCRIPTION,
  HOME_H1,
  HOME_INTRO,
  HOME_LINKS_AFTER_SECTION,
  HOME_LINKS_H2,
  HOME_PRERENDER_LINKS,
  HOME_SECTIONS,
} from "./home-content.mjs";

// --- 라우트 파서 ---
const SALARY_RE = /^\/salary\/(\d+)$/;
const INSURANCE_RE = /^\/insurance\/(\d+)$/;
const COMPREHENSIVE_TAX_RE = /^\/comprehensive-tax\/(\d+)$/;
const COMPARE_RE = /^\/compare\/(\d+)-vs-(\d+)$/;
const QUIT_RE = /^\/quit\/(\d+)years$/;
const WITHHOLDING_RE = /^\/withholding\/(\d+)$/;
const YEAR_END_RE = /^\/year-end-settlement\/(\d+)$/;
const PARENTAL_LEAVE_RE = /^\/parental-leave\/(\d+)$/;
const UNEMPLOYMENT_RE = /^\/unemployment\/(\d+)$/;
const REGIONAL_HEALTH_RE = /^\/regional-health\/(\d+)$/;
const WEEKLY_HOLIDAY_PAY_RE = /^\/weekly-holiday-pay\/(\d+)$/;
const WAGE_CONVERTER_RE = /^\/wage-converter\/(\d+)$/;
const SEVERANCE_PAY_RE = /^\/severance-pay\/(\d+)$/;
const UNPAID_WAGE_RE = /^\/unpaid-wage\/(\d+)$/;
const EITC_RE = /^\/eitc\/(single|single-income|double-income)$/;
const FREELANCER_RE = /^\/freelancer\/(\d+)$/;

function parseInt10(s) {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

// --- 공통 HTML 스타일 ---
const ARTICLE_STYLE =
  "max-width:920px;margin:0 auto;padding:24px 16px;line-height:1.75;font-size:15px;color:hsl(var(--foreground));";
const H1_STYLE = "font-size:28px;line-height:1.3;margin:0 0 16px;color:hsl(var(--foreground));";
const H2_STYLE =
  "font-size:20px;line-height:1.35;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid hsl(var(--highlight) / 0.3);color:hsl(var(--foreground));";
const H3_STYLE = "font-size:16px;line-height:1.4;margin:18px 0 6px;color:hsl(var(--foreground));";
const P_STYLE = "margin:0 0 10px;";
const TABLE_STYLE =
  "width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:14px;";
const TH_STYLE =
  "padding:8px 10px;background:hsl(var(--muted));text-align:left;border:1px solid hsl(var(--border));color:hsl(var(--foreground));font-weight:600;";
const TD_STYLE = "padding:8px 10px;border:1px solid hsl(var(--border));";
const UL_STYLE = "margin:0 0 12px 20px;padding:0;";
const LI_STYLE = "margin-bottom:4px;";
const CALLOUT_STYLE =
  "background:hsl(var(--accent));border-left:4px solid hsl(var(--highlight));padding:12px 14px;margin:12px 0 16px;border-radius:4px;";

// =========================
// 연봉 실수령액 (/salary/:amount)
// =========================
function buildSalaryContent(manWon) {
  const gross = manWon * 10_000;
  const result = calculateSalaryBreakdown({
    grossAnnual: gross,
    nonTaxableMonthly: 200_000,
    dependents: 1,
    children: 0,
    retirementIncluded: false,
  });

  const label = formatManWonValue(manWon);

  // 부양가족 시나리오
  const s2 = calculateSalaryBreakdown({
    grossAnnual: gross,
    nonTaxableMonthly: 200_000,
    dependents: 2,
    children: 0,
    retirementIncluded: false,
  });
  const s4 = calculateSalaryBreakdown({
    grossAnnual: gross,
    nonTaxableMonthly: 200_000,
    dependents: 4,
    children: 2,
    retirementIncluded: false,
  });

  return `
    <article data-seo-prerender="salary" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">연봉 실수령액 계산기</a>
        &nbsp;›&nbsp;
        연봉 ${label}
      </nav>

      <h1 style="${H1_STYLE}">연봉 ${label}원 실수령액 (2026년 기준)</h1>

      <p style="${P_STYLE}">
        2026년 최신 세율·요율을 적용한 연봉 <strong>${label}원</strong>의 월 실수령액은
        <strong style="color:hsl(var(--primary));">${formatWon(result.monthlyNet)}</strong>입니다.
        세전 월급 ${formatWon(result.monthlyGross)}에서 4대보험 ${formatWon(result.totalInsurance)}과
        소득세·지방소득세 ${formatWon(result.totalTax)}이 공제되며, 연간 실수령액은 약
        ${formatWon(result.annualNet)}, 실효세율은 ${formatPercent(result.effectiveTaxRate)}입니다.
      </p>

      <p style="${P_STYLE}">
        본 결과는 부양가족 1인·비과세 월 20만원·퇴직금 별도 기준의 표준 시나리오이며,
        실제 급여명세서는 회사의 수당·복리후생·비과세 식대·상여금 구조에 따라 달라질 수 있습니다.
        아래에서 공제 항목별 계산 근거와 부양가족별 차이, 자주 묻는 질문을 확인하세요.
      </p>

      <h2 style="${H2_STYLE}">1. 월 실수령액 요약</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">항목</th>
            <th style="${TH_STYLE}">월 금액</th>
            <th style="${TH_STYLE}">연 금액</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">세전 급여 (월 총 지급액)</td>
            <td style="${TD_STYLE}">${formatWon(result.monthlyGross)}</td>
            <td style="${TD_STYLE}">${formatWon(result.grossAnnual)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">4대보험 합계</td>
            <td style="${TD_STYLE}">-${formatWon(result.totalInsurance)}</td>
            <td style="${TD_STYLE}">-${formatWon(result.totalInsurance * 12)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">소득세 + 지방소득세</td>
            <td style="${TD_STYLE}">-${formatWon(result.totalTax)}</td>
            <td style="${TD_STYLE}">-${formatWon(result.determinedTax + result.annualLocalTax)}</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>실수령액</strong></td>
            <td style="${TD_STYLE}"><strong style="color:hsl(var(--primary));">${formatWon(result.monthlyNet)}</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(result.annualNet)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">2. 4대보험 공제 상세 (2026년 요율)</h2>
      <p style="${P_STYLE}">
        근로자는 국민연금 4.75%, 건강보험 3.595%, 장기요양보험(건보료의 13.14%), 고용보험 0.9%를 부담합니다.
        사업주도 동일 요율을 추가 부담하므로 총 부담액은 약 2배입니다.
      </p>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">보험 항목</th>
            <th style="${TH_STYLE}">근로자 요율</th>
            <th style="${TH_STYLE}">월 공제액</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">국민연금</td>
            <td style="${TD_STYLE}">4.75%</td>
            <td style="${TD_STYLE}">${formatWon(result.nationalPension)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">건강보험</td>
            <td style="${TD_STYLE}">3.595%</td>
            <td style="${TD_STYLE}">${formatWon(result.healthInsurance)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">장기요양보험</td>
            <td style="${TD_STYLE}">건보료의 13.14%</td>
            <td style="${TD_STYLE}">${formatWon(result.longTermCare)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">고용보험</td>
            <td style="${TD_STYLE}">0.9%</td>
            <td style="${TD_STYLE}">${formatWon(result.employmentInsurance)}</td>
          </tr>
          <tr style="background:hsl(var(--muted));">
            <td style="${TD_STYLE}"><strong>합계</strong></td>
            <td style="${TD_STYLE}"><strong>약 9.24%</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(result.totalInsurance)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div style="${CALLOUT_STYLE}">
        <strong>국민연금 상한 주의</strong> — 국민연금은 월 기준소득 659만원(2026년 7월 시행) 초과분에 대해서는
        추가 부담하지 않습니다. 월 기준소득 659만원 이상인 경우 근로자 부담액은 313,025원으로 고정됩니다.
      </div>

      <h2 style="${H2_STYLE}">3. 소득세·지방소득세 계산 근거</h2>
      <p style="${P_STYLE}">
        본 계산기는 국세청 근로소득 간이세액표(2026년 개정)를 기준으로 월 소득세를 산출하며,
        지방소득세는 소득세의 10%로 자동 계산합니다. 연봉 ${label}원에 적용된 세액은 다음과 같습니다.
      </p>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">과세표준 산출: 총 급여 - 근로소득공제 ${formatWon(result.earnedIncomeDeduction)} - 인적공제 ${formatWon(result.personalDeduction)} - 4대보험공제 ${formatWon(result.annualInsuranceDeduction)} = <strong>${formatWon(result.taxableBase)}</strong></li>
        <li style="${LI_STYLE}">산출세액(누진세율 적용): ${formatWon(result.calculatedTax)}</li>
        <li style="${LI_STYLE}">근로소득세액공제: -${formatWon(result.taxCredit)}</li>
        <li style="${LI_STYLE}">표준세액공제: -${formatWon(result.standardTaxCredit)}</li>
        <li style="${LI_STYLE}">결정세액(연간): <strong>${formatWon(result.determinedTax)}</strong></li>
        <li style="${LI_STYLE}">지방소득세(연간): ${formatWon(result.annualLocalTax)}</li>
        <li style="${LI_STYLE}">월 소득세: ${formatWon(result.monthlyIncomeTax)} / 월 지방소득세: ${formatWon(result.monthlyLocalTax)}</li>
      </ul>

      <h2 style="${H2_STYLE}">4. 부양가족 수에 따른 실수령 변화</h2>
      <p style="${P_STYLE}">
        부양가족이 많을수록 인적공제(1인당 150만원)와 자녀세액공제가 추가되어 소득세 부담이 줄어듭니다.
        연봉 ${label}원 기준 부양가족 시나리오별 월 실수령액을 비교한 표입니다.
      </p>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">시나리오</th>
            <th style="${TH_STYLE}">월 소득세+지방세</th>
            <th style="${TH_STYLE}">월 실수령액</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">1인 (본인만)</td>
            <td style="${TD_STYLE}">${formatWon(result.totalTax)}</td>
            <td style="${TD_STYLE}">${formatWon(result.monthlyNet)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">배우자 포함 2인</td>
            <td style="${TD_STYLE}">${formatWon(s2.totalTax)}</td>
            <td style="${TD_STYLE}">${formatWon(s2.monthlyNet)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">부부+자녀 2인 (4인 가족)</td>
            <td style="${TD_STYLE}">${formatWon(s4.totalTax)}</td>
            <td style="${TD_STYLE}">${formatWon(s4.monthlyNet)}</td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">5. 자주 묻는 질문 (FAQ)</h2>

      <h3 style="${H3_STYLE}">Q1. 연봉 ${label}원의 월 실수령액은 정확히 얼마인가요?</h3>
      <p style="${P_STYLE}">
        2026년 기준(부양가족 1인, 비과세 월 20만원)의 월 실수령액은 <strong>${formatWon(result.monthlyNet)}</strong>입니다.
        이는 세전 월급 ${formatWon(result.monthlyGross)}에서 4대보험 ${formatWon(result.totalInsurance)}과
        세금 ${formatWon(result.totalTax)}을 제외한 값입니다.
      </p>

      <h3 style="${H3_STYLE}">Q2. 왜 세전 연봉의 12분의 1이 월 실수령이 아닌가요?</h3>
      <p style="${P_STYLE}">
        세전 연봉 ${label}원을 단순히 12로 나누면 월 ${formatWon(Math.floor(gross / 12))}이지만,
        여기에서 4대보험(약 9.24%)과 소득세·지방소득세가 추가로 공제되기 때문에 실수령은 약
        ${formatPercent(1 - result.effectiveTaxRate, 1)} 수준입니다.
      </p>

      <h3 style="${H3_STYLE}">Q3. 비과세 항목이 있으면 실수령이 더 늘어나나요?</h3>
      <p style="${P_STYLE}">
        네. 식대(월 20만원 한도), 자가운전보조금(월 20만원 한도), 육아수당 등 비과세 항목은
        과세표준에서 제외되므로 4대보험과 소득세 모두 감면됩니다. 본 계산은 식대 월 20만원 비과세를 가정했습니다.
      </p>

      <h3 style="${H3_STYLE}">Q4. 퇴직금이 연봉에 포함되어 있으면 어떻게 계산하나요?</h3>
      <p style="${P_STYLE}">
        퇴직금 포함 연봉(연봉계약서에 "퇴직금 포함"으로 명시)의 경우, 월 지급액은 연봉을 13으로 나누어
        계산합니다. 즉 연봉 ${label}원 · 퇴직금 포함이면 월 세전 급여는 ${formatWon(Math.floor(gross / 13))}
        가 됩니다. 계산기에서 "퇴직금 포함" 옵션을 선택해 비교할 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q5. 사업주가 부담하는 4대보험은 얼마인가요?</h3>
      <p style="${P_STYLE}">
        사업주는 근로자와 동일 요율(국민연금 4.75%, 건강보험 3.595%, 고용보험 0.9% + 산재·고안부담)을 부담합니다.
        연봉 ${label}원 기준 사업주 부담은 월 약 ${formatWon(Math.floor(result.totalInsurance * 1.0))}
        (산재보험 별도)이며, 실제 인건비는 세전 연봉의 약 110% 수준입니다.
      </p>

      <h3 style="${H3_STYLE}">Q6. 계산 결과가 실제 급여명세서와 다른 이유는?</h3>
      <p style="${P_STYLE}">
        간이세액표 기준 계산과 실제 원천징수액은 회사 정책, 부양가족 신고 내역, 연말정산 환급 여부,
        상여금/성과급 포함 여부에 따라 달라질 수 있습니다. 본 결과는 참고용 추정치이며,
        정확한 금액은 회사 급여담당자 또는 국세청 홈택스에서 확인해야 합니다.
      </p>

      <h2 style="${H2_STYLE}">6. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/insurance">건강보험료 역산 계산기</a> - 건보료로 연봉 추정</li>
        <li style="${LI_STYLE}"><a href="/finance/compare">이직 연봉 비교 계산기</a> - 두 연봉의 실수령 차이</li>
        <li style="${LI_STYLE}"><a href="/finance/comprehensive-tax">종합소득세 계산기</a> - 프리랜서·사업소득</li>
        <li style="${LI_STYLE}"><a href="/finance/year-end-settlement">연말정산 계산기</a> - 예상 환급액</li>
        <li style="${LI_STYLE}"><a href="/finance/bonus">성과급 실수령 계산기</a> - 상여금 세금 공제</li>
      </ul>

      <h2 style="${H2_STYLE}">7. 공식 출처</h2>
      <p style="${P_STYLE}">
        본 계산에 적용한 세율·요율의 원문 고시와 공식 계산 기준은 아래 정부·공공기관 사이트에서
        확인할 수 있습니다. 최종 신고·납부 전에는 공식 자료와 교차 확인하세요.
      </p>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="https://www.nts.go.kr" target="_blank" rel="noopener noreferrer">국세청</a> — 근로소득 간이세액표·소득세 세율</li>
        <li style="${LI_STYLE}"><a href="https://www.nhis.or.kr" target="_blank" rel="noopener noreferrer">국민건강보험공단</a> — 건강보험·장기요양보험 요율 고시</li>
        <li style="${LI_STYLE}"><a href="https://www.nps.or.kr" target="_blank" rel="noopener noreferrer">국민연금공단</a> — 국민연금 요율·기준소득월액 상·하한</li>
      </ul>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 계산 결과는 2026년 국세청 근로소득 간이세액표와 국민건강보험공단·국민연금공단·고용노동부 고시를 기반으로 한
        추정값이며, 법적 효력이 없는 참고용입니다. 실제 급여명세서와 차이가 있을 수 있습니다.
      </p>
    </article>`;
}

// =========================
// 프리랜서 수입별 (/freelancer/:amount)
// =========================
// These six URLs shipped as 67-character stubs (a title and a "open the calculator" link) — thin
// enough to be the exact thing an AdSense reviewer flags, and thin enough that consolidating them
// into /freelancer would have been folding nothing into nothing.
//
// The angle is deliberately NOT the one /comprehensive-tax/:amount uses. Both families run the
// same engine on the same income, so repeating the tax breakdown here would create a genuine
// cross-family duplicate. This page answers the freelancer's cash-flow question instead — how
// much of each payment to set aside, and what changes besides income tax — while the
// comprehensive-tax page walks the statutory computation.
function buildFreelancerContent(manWon) {
  const income = manWon * 10_000;
  const calc = computeComprehensiveTax(income);
  const label = formatManWonValue(manWon);
  const monthlyGross = Math.floor(income / 12);
  const monthlyWithheld = Math.floor(monthlyGross * 0.033);
  const monthlyNet = monthlyGross - monthlyWithheld;
  // 수입 대비 확정세액 비율 — 매달 따로 떼어둘 비율의 근거
  const effectiveRate = calc.totalTax / income;
  const reserveMonthly = Math.max(0, Math.floor((calc.totalTax - calc.withholdingPrepaid) / 12));
  const overThreshold = income > SIMPLE_EXPENSE_THRESHOLD;

  const otherLinks = FREELANCER_AMOUNTS.filter((value) => value !== manWon)
    .map((value) => `<a href="/finance/freelancer/${value}">${formatManWonValue(value)}원</a>`)
    .join(" · ");

  return `
    <article data-seo-prerender="freelancer" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/freelancer" style="color:hsl(var(--muted-foreground));text-decoration:none;">프리랜서 세금 계산기</a>
        &nbsp;›&nbsp;
        연 수입 ${label}
      </nav>

      <h1 style="${H1_STYLE}">프리랜서 연 수입 ${label}원 세금과 월 현금흐름 (2026)</h1>

      <p style="${P_STYLE}">
        연 수입 <strong>${label}원</strong>을 12개월로 나누면 월 ${formatWon(monthlyGross)}이고, 여기서 3.3%인
        ${formatWon(monthlyWithheld)}이 원천징수되어 실제 입금액은 월 <strong>${formatWon(monthlyNet)}</strong>입니다.
        1년간 미리 낸 세금은 ${formatWon(calc.withholdingPrepaid)}이고, 5월 신고로 확정되는 세액은
        <strong>${formatWon(calc.totalTax)}</strong>(수입 대비 ${formatPercent(effectiveRate)})입니다.
      </p>

      <p style="${P_STYLE}">
        ${calc.refund >= 0
          ? `확정세액이 기납부액보다 적으므로 <strong style="color:hsl(var(--primary));">약 ${formatWon(calc.refund)}을 환급</strong>받게 됩니다. 이 구간에서는 3.3%가 실제 세부담보다 크게 떼이고 있다는 뜻입니다.`
          : `확정세액이 기납부액을 넘어 <strong style="color:hsl(var(--destructive));">약 ${formatWon(Math.abs(calc.refund))}을 추가로 납부</strong>해야 합니다. 매달 ${formatWon(reserveMonthly)}씩 따로 모아두면 5월에 목돈을 마련하지 않아도 됩니다.`}
      </p>

      <h2 style="${H2_STYLE}">1. 월 현금흐름 요약</h2>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr><td style="${TD_STYLE}">월 청구액(세전)</td><td style="${TD_STYLE}">${formatWon(monthlyGross)}</td></tr>
          <tr><td style="${TD_STYLE}">3.3% 원천징수</td><td style="${TD_STYLE}">-${formatWon(monthlyWithheld)}</td></tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>월 실입금액</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(monthlyNet)}</strong></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">5월 신고 시 정산</td>
            <td style="${TD_STYLE}">${calc.refund >= 0 ? `+${formatWon(calc.refund)} 환급` : `-${formatWon(Math.abs(calc.refund))} 추가 납부`}</td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">2. 이 수입에서 실제로 인정되는 경비</h2>
      <p style="${P_STYLE}">
        장부를 쓰지 않으면 인적용역 단순경비율이 적용되어 ${formatWon(calc.expenses)}이 필요경비로 인정됩니다.
        ${overThreshold
          ? `수입이 4,000만원을 넘으므로 4,000만원까지는 64.1%, 초과분 ${formatWon(income - SIMPLE_EXPENSE_THRESHOLD)}에는 49.7%가 적용된 결과입니다. 추가 수입 1원당 인정 경비가 0.497원으로 낮아진 구간이라, 실제 경비가 이보다 크다면 장부 작성이 유리합니다.`
          : `수입이 4,000만원 이하이므로 전액에 64.1%가 적용됩니다. 실제 지출이 수입의 64.1%를 넘지 않는다면 장부를 쓰지 않는 편이 오히려 유리합니다.`}
      </p>
      <p style="${P_STYLE}">
        여기에 기본공제 150만원을 빼면 과세표준은 ${formatWon(calc.taxableBase)}이 되고, 누진세율을 적용한 산출세액에서
        표준세액공제 7만원을 뺀 뒤 지방소득세 10%를 더해 ${formatWon(calc.totalTax)}이 나옵니다.
      </p>

      <h2 style="${H2_STYLE}">3. 세금 말고 함께 늘어나는 부담</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>건강보험료</strong> — 프리랜서는 지역가입자입니다. 5월 신고 소득이 그해 11월 보험료 재산정에 반영되므로, 수입이 늘어난 다음 해에 보험료가 함께 오릅니다.</li>
        <li style="${LI_STYLE}"><strong>국민연금</strong> — 지역가입자 보험료는 신고 소득의 9.5%를 본인이 전액 부담합니다. 직장가입자가 절반인 4.75%만 내는 것과 대비됩니다.</li>
        <li style="${LI_STYLE}"><strong>부가가치세</strong> — 인적용역은 면세라 대체로 해당이 없지만, 사업자등록을 내고 용역을 공급하면 과세 대상이 될 수 있습니다.</li>
        ${overThreshold
          ? `<li style="${LI_STYLE}"><strong>기장 의무</strong> — 직전 연도 수입이 일정 기준을 넘으면 복식부기 의무자가 되며, 추계신고 시 무기장가산세 20%가 부과됩니다.</li>`
          : `<li style="${LI_STYLE}"><strong>기장 의무</strong> — 이 수입대에서는 간편장부 대상이지만, 장부를 쓰면 기장세액공제(산출세액의 20%, 한도 100만원)를 받을 수 있습니다.</li>`}
      </ul>

      <h2 style="${H2_STYLE}">4. 다른 수입 구간과 비교</h2>
      <p style="${P_STYLE}">다른 수입 금액으로 보기: ${otherLinks}</p>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/freelancer">프리랜서 세금 계산기</a> - 수입 직접 입력</li>
        <li style="${LI_STYLE}"><a href="/finance/comprehensive-tax/${manWon}">종합소득세 ${label}원 상세 계산</a> - 구간별 산출세액</li>
        <li style="${LI_STYLE}"><a href="/finance/freelance-rate">세후 단가 역산 계산기</a> - 목표 실수령 기준 견적</li>
        <li style="${LI_STYLE}"><a href="/finance/regional-health">지역가입자 건보료 계산기</a></li>
      </ul>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 단순경비율 적용 인적용역 기준 추정치입니다. 업종 코드·장부 작성 여부·다른 소득·부양가족에 따라 실제 세액이
        달라지며, 확정 금액은 국세청 홈택스 신고 화면에서 확인하세요.
      </p>
    </article>`;
}

// =========================
// 근로장려금 (/eitc/:household)
// =========================
// src/data/eitc.ts · src/utils/eitcCalculator.ts 미러 — 점증·평탄·점감 산식
const EITC_BRACKETS = EITC_BRACKET_TABLE;

// Household-specific copy. These three routes stay independently indexable (they are the one
// family excluded from the canonical consolidation) because household type changes the statutory
// ceiling and the payout — but that only justifies three URLs if the three pages actually read
// differently. Sharing one template made them 0.96+ similar, so the qualifying rules, the failure
// modes and the decision each household actually faces are written out per slug here.
const EITC_HOUSEHOLD_DETAIL = {
  single: {
    lead: "혼자 사는 근로자가 아르바이트·단시간 근로로 번 소득에 대해 받을 수 있는 근로장려금을 계산합니다. 단독 가구는 세 유형 중 기준선이 가장 낮게 설정돼 있어, 소득이 조금만 늘어도 점감 구간에 들어간다는 점이 판단의 핵심입니다.",
    tableNote:
      "단독 가구는 구간 폭이 좁아 총급여 200만원 차이로도 지급액이 크게 달라집니다. 표는 산식 기준 간이 추정치이며 국세청 산정표의 구간 단위·단수 조정에 따라 소액 차이가 날 수 있습니다.",
    callout:
      "<strong>1인 가구가 특히 확인할 것</strong> — 전세보증금은 재산에 포함되고 부채는 차감되지 않습니다. 소득이 적어도 보증금이 큰 원룸·오피스텔에 살면 재산 1억7,000만원 기준에 걸려 50% 감액될 수 있습니다.",
    relatedLinks: [
      ["/finance/weekly-holiday-pay", "주휴수당 계산기", "주 15시간 이상 근무 시 필수 확인"],
      ["/finance/wage-converter", "시급 월급 환산기", "아르바이트 소득의 연간 총급여 환산"],
      ["/finance/regional-health", "지역가입자 건보료", "1인 가구 건강보험료 확인"],
    ],
    exampleH2: "월 100만원을 버는 단독 가구는 얼마를 받나",
    example: [
      "월 100만원씩 12개월을 일해 연간 총급여가 1,200만원이라면, 이 금액은 평탄 구간(400만~900만원)을 지나 <strong>점감 구간</strong>에 들어와 있습니다. 최대액 165만원을 그대로 받는 것이 아니라 상한 2,200만원을 향해 줄어드는 중인 금액을 받습니다.",
      "역설적이지만 단독 가구가 최대액을 받는 지점은 연 400만~900만원 구간입니다. 월 33만~75만원 수준의 소득으로, 주 15~20시간 정도의 단시간 근로에 해당합니다. 그보다 적게 벌면 점증 구간이라 장려금도 함께 줄어듭니다.",
      "따라서 단독 가구는 '많이 벌수록 유리'도 '적게 벌수록 유리'도 아닙니다. 위 표에서 본인의 연간 총급여에 가장 가까운 행을 찾아 어느 구간에 있는지부터 확인하는 편이 정확합니다.",
    ],
    faq: [
      {
        q: "부모님과 함께 사는데 단독 가구인가요?",
        a: "부모가 70세 미만이거나 본인이 부양하지 않는다면 단독 가구입니다. 70세 이상 직계존속을 부양하고 있다면 홑벌이 가구로 분류되어 소득 상한과 최대액이 모두 올라갑니다.",
      },
      {
        q: "20대인데 나이 때문에 안 되나요?",
        a: "연령 요건은 폐지되었습니다. 과거에는 30세 이상만 단독 가구로 신청할 수 있었지만 지금은 소득·재산 요건만 충족하면 20대도 신청할 수 있습니다.",
      },
      {
        q: "자녀장려금도 같이 받을 수 있나요?",
        a: "받을 수 없습니다. 자녀장려금은 부양자녀가 있어야 하는데, 부양자녀가 있으면 단독 가구가 아니라 홑벌이 가구로 분류되기 때문입니다.",
      },
    ],
    definitionH2: "단독 가구로 분류되는 조건",
    definition: [
      "단독 가구는 <strong>배우자·부양자녀·70세 이상 직계존속이 모두 없는</strong> 가구입니다. 셋 중 하나라도 있으면 홑벌이 이상으로 분류되므로, 단독은 사실상 1인 가구를 뜻합니다.",
      "세 유형 중 소득 상한이 가장 낮고 최대 지급액도 가장 적습니다. 대신 요건이 단순해 판정이 쉽고, 아르바이트·단시간 근로로 소득이 적은 청년층과 고령 단신 가구가 주된 대상입니다.",
      "부모와 같은 집에 살아도 부모가 70세 미만이거나 본인이 부양하지 않는다면 단독 가구입니다. 주민등록상 세대 분리 여부가 아니라 부양 관계로 판단합니다.",
    ],
    pitfallH2: "단독 가구에서 자주 놓치는 지점",
    pitfalls: [
      "<strong>연령 제한은 없습니다.</strong> 과거에는 30세 이상만 단독 가구로 신청할 수 있었지만 이 요건은 폐지되어, 20대 1인 가구도 소득·재산 요건만 맞으면 신청할 수 있습니다.",
      "<strong>자녀장려금은 받을 수 없습니다.</strong> 자녀장려금은 부양자녀가 있어야 하는데, 부양자녀가 있으면 단독 가구가 아니게 되므로 정의상 대상에서 제외됩니다.",
      "<strong>가구 유형은 매년 다시 판정합니다.</strong> 결혼하거나 자녀가 생기면 다음 신청부터 홑벌이·맞벌이 기준이 적용되어 소득 상한과 최대액이 모두 올라갑니다.",
    ],
  },
  "single-income": {
    lead: "배우자가 소득이 거의 없거나, 혼자 아이를 키우며 일하는 가구가 받을 수 있는 근로장려금을 계산합니다. 홑벌이 가구는 자녀장려금과 중복 수급이 가능해, 부양자녀가 있으면 실제 수령 총액이 근로장려금만 볼 때보다 크게 늘어납니다.",
    tableNote:
      "표의 금액은 근로장려금만입니다. 부양자녀가 있으면 자녀 1인당 최대 100만원의 자녀장려금이 별도로 더해지므로, 실제 입금액은 이 표보다 큽니다. 국세청 산정표의 구간 단위·단수 조정에 따라 소액 차이가 날 수 있습니다.",
    callout:
      "<strong>부양가족 중복 신청 주의</strong> — 같은 부양자녀를 다른 가구(예: 조부모)가 함께 올리면 양쪽 모두 정정 대상이 됩니다. 연말정산 인적공제와 근로장려금 가구원 판정에 같은 자녀를 중복으로 올리지 않았는지 확인하세요.",
    relatedLinks: [
      ["/finance/year-end-settlement", "연말정산 계산기", "자녀세액공제와 함께 확인"],
      ["/finance/parental-leave", "육아휴직 급여 계산기", "휴직 기간 소득 변화 확인"],
      ["/finance/dependent", "건보 피부양자 판정기", "배우자 피부양자 자격 확인"],
    ],
    exampleH2: "자녀 한 명을 키우는 홑벌이 가구의 실제 수령 총액",
    example: [
      "연간 총급여 2,000만원에 18세 미만 자녀가 한 명 있는 홑벌이 가구를 가정해 봅니다. 총급여 2,000만원은 평탄 구간(700만~1,400만원)을 지난 <strong>점감 구간</strong>이므로 근로장려금은 최대액 285만원보다 줄어든 금액이 됩니다.",
      "여기에 <strong>자녀장려금</strong>이 더해집니다. 총급여 2,100만원까지는 자녀 1인당 100만원 전액이 지급되므로, 이 가구는 근로장려금과 별도로 100만원을 더 받습니다. 두 제도를 합치면 실제 수령액은 위 표의 금액에 100만원을 더한 값입니다.",
      "총급여가 2,100만원을 넘어서면 자녀장려금도 점감이 시작돼 7,000만원까지 줄어들며 최소 50만원이 지급됩니다. 즉 홑벌이 가구는 2,100만원 언저리에서 근로장려금과 자녀장려금이 <strong>동시에</strong> 줄기 시작합니다.",
    ],
    faq: [
      {
        q: "배우자가 파트타임으로 일하는데 홑벌이인가요?",
        a: "배우자의 연간 총급여가 300만원 미만이면 홑벌이 가구입니다. 300만원 이상이면 맞벌이 가구로 분류되어 소득 판정이 부부 합산으로 바뀝니다.",
      },
      {
        q: "한부모 가구도 홑벌이인가요?",
        a: "배우자가 없어도 부양자녀 또는 70세 이상 직계존속이 있으면 홑벌이 가구로 분류됩니다. 단독 가구보다 소득 상한과 최대 지급액이 모두 높습니다.",
      },
      {
        q: "자녀가 아르바이트를 하면 어떻게 되나요?",
        a: "부양자녀는 18세 미만이면서 연간 소득금액 100만원 이하여야 인정됩니다. 자녀 소득이 이를 넘으면 부양자녀에서 제외되어 가구 유형 자체가 바뀔 수 있습니다.",
      },
    ],
    definitionH2: "홑벌이 가구로 분류되는 조건",
    definition: [
      "홑벌이 가구는 ① 배우자의 총급여가 <strong>300만원 미만</strong>이거나, ② 배우자는 없지만 부양자녀 또는 70세 이상 직계존속이 있는 가구입니다.",
      "즉 배우자가 있어도 소득이 거의 없으면 홑벌이이고, 한부모 가구도 홑벌이로 분류됩니다. 단독보다 소득 상한과 최대 지급액이 모두 큽니다.",
      "부양자녀는 18세 미만이면서 연간 소득금액이 100만원 이하여야 인정됩니다. 자녀가 아르바이트로 소득을 올렸다면 부양자녀에서 빠질 수 있어 가구 유형이 바뀔 수 있습니다.",
    ],
    pitfallH2: "배우자 총급여 300만원이 만드는 분기점",
    pitfalls: [
      "<strong>300만원을 넘으면 맞벌이가 됩니다.</strong> 배우자 총급여가 300만원 이상이 되는 순간 맞벌이 기준으로 넘어가, 최대 지급액은 올라가지만 소득 판정이 부부 합산으로 바뀝니다.",
      "<strong>합산으로 바뀌면 오히려 불리할 수 있습니다.</strong> 최대액이 커져도 부부 소득을 합쳐 점감 구간에 더 빨리 진입하면 실제 수령액은 줄어들 수 있으므로, 경계 근처라면 두 유형을 모두 계산해 비교해야 합니다.",
      "<strong>자녀장려금과 중복 수급이 가능합니다.</strong> 부양자녀가 있는 홑벌이 가구는 근로장려금과 별도로 자녀 1인당 최대 100만원의 자녀장려금을 함께 받을 수 있습니다.",
    ],
  },
  "double-income": {
    lead: "부부가 모두 일하는 가구가 받을 수 있는 근로장려금을 계산합니다. 맞벌이 가구는 최대 지급액이 세 유형 중 가장 크지만 소득을 부부 합산으로 판정하므로, 각자의 급여가 낮아도 합치면 지급 대상에서 벗어나는 경우가 많습니다.",
    tableNote:
      "표의 '연간 총급여'는 <strong>부부 합산</strong> 금액입니다. 본인 급여만으로 행을 찾으면 실제보다 훨씬 큰 금액을 기대하게 되니, 배우자 급여를 더한 뒤 확인하세요. 국세청 산정표의 구간 단위·단수 조정에 따라 소액 차이가 날 수 있습니다.",
    callout:
      "<strong>재산도 부부 합산</strong> — 재산 1억7,000만원(50% 감액)·2억4,000만원(지급 제외) 기준 역시 가구원 전체 재산을 합쳐 판단합니다. 부부가 각각 주택이나 자동차를 보유하면 소득 요건을 통과해도 재산에서 걸리는 경우가 많습니다.",
    relatedLinks: [
      ["/finance/year-end-settlement", "연말정산 계산기", "부부 각각의 환급액 비교"],
      ["/finance/compare", "연봉 비교 계산기", "부부 합산 실수령액 확인"],
      ["/finance/salary", "연봉 실수령액 계산기", "총급여 기준 확인"],
    ],
    exampleH2: "부부가 각각 월 150만원을 벌면 대상이 되나",
    example: [
      "부부가 각각 월 150만원씩 벌면 1인당 연 1,800만원, <strong>합산 3,600만원</strong>입니다. 맞벌이 가구의 소득 상한은 4,400만원이므로 아직 대상이지만, 평탄 구간(800만~1,700만원)을 한참 지난 점감 구간이라 최대액 330만원에는 크게 못 미칩니다.",
      "각자 기준으로 보면 1,800만원은 평탄 구간을 살짝 넘긴 수준이라 상당한 금액을 받을 것처럼 보입니다. 하지만 판정은 <strong>합산</strong>으로 하므로 실제 산정액은 위 표의 3,600만원 행을 보아야 합니다. 맞벌이 가구가 가장 많이 오해하는 지점입니다.",
      "부부가 각각 월 190만원(합산 4,560만원)을 넘어서면 상한 4,400만원을 초과해 지급 대상에서 제외됩니다. 맞벌이 가구의 최대액이 가장 크다는 사실과 실제로 받을 확률이 낮다는 사실이 동시에 성립하는 이유입니다.",
    ],
    faq: [
      {
        q: "부부가 각각 신청해야 하나요?",
        a: "아닙니다. 근로장려금은 가구 단위 제도이므로 부부 중 한 사람만 신청합니다. 둘 다 신청하면 국세청이 한 명을 신청자로 확정해 한 건만 지급합니다.",
      },
      {
        q: "누가 신청하느냐에 따라 금액이 달라지나요?",
        a: "달라지지 않습니다. 부부 합산 소득으로 산정하므로 신청자가 누구든 금액은 같으며, 지급 계좌와 안내 통지만 신청자 기준으로 처리됩니다.",
      },
      {
        q: "한쪽 소득이 300만원 아래로 떨어지면 어떻게 되나요?",
        a: "홑벌이 가구로 재분류됩니다. 최대액은 330만원에서 285만원으로 낮아지지만 소득 판정 기준도 함께 바뀌므로, 경계 근처라면 두 유형을 모두 계산해 비교하는 편이 정확합니다.",
      },
    ],
    definitionH2: "맞벌이 가구로 분류되는 조건",
    definition: [
      "맞벌이 가구는 부부 <strong>모두</strong> 총급여가 300만원 이상인 가구입니다. 한쪽이라도 300만원 미만이면 홑벌이로 분류됩니다.",
      "세 유형 중 소득 상한이 가장 높고 최대 지급액도 가장 큽니다. 맞벌이로 소득이 늘어난 만큼 기준선도 함께 올려둔 구조입니다.",
      "다만 소득 판정은 <strong>부부 합산</strong>입니다. 개인 소득이 아니라 둘을 더한 금액으로 구간을 정하므로, 각자의 소득이 낮아도 합치면 점감 구간에 들어갈 수 있습니다.",
    ],
    pitfallH2: "부부 합산 판정과 신청자 지정",
    pitfalls: [
      "<strong>신청은 부부 중 한 사람만 합니다.</strong> 근로장려금은 가구 단위 제도이므로 부부가 각각 신청해도 한 건만 인정됩니다. 둘 다 신청하면 국세청이 한 명을 신청자로 확정합니다.",
      "<strong>누가 신청해도 금액은 같습니다.</strong> 가구 합산 소득으로 계산하므로 신청자를 누구로 하든 산정액은 동일하며, 지급 계좌와 안내 통지만 신청자 기준으로 처리됩니다.",
      "<strong>상한 도달이 빠릅니다.</strong> 최대액이 가장 크지만 합산 소득 기준이라, 부부가 각각 평균 임금을 받으면 점감 구간을 지나 지급 대상에서 벗어나는 경우가 많습니다.",
    ],
  },
};

function buildEitcContent(householdSlug) {
  const bracket = EITC_BRACKETS[householdSlug];
  const detail = EITC_HOUSEHOLD_DETAIL[householdSlug];
  if (!bracket || !detail) return null;

  const incomeRows = [];
  for (let income = 2_000_000; income < bracket.phaseOutEnd; income += 2_000_000) {
    incomeRows.push(income);
  }
  const tableRows = incomeRows
    .map((income) => {
      const amount = eitcAmountFor(income, bracket);
      const zone = income < bracket.phaseInEnd ? "점증" : income <= bracket.plateauEnd ? "평탄(최대)" : "점감";
      return `
          <tr${amount === bracket.maxAmount ? ' style="background:hsl(var(--accent));"' : ""}>
            <td style="${TD_STYLE}">${formatWon(income)}</td>
            <td style="${TD_STYLE}">${zone}</td>
            <td style="${TD_STYLE}"><strong>${formatWon(amount)}</strong></td>
          </tr>`;
    })
    .join("");

  const otherLinks = Object.entries(EITC_BRACKETS)
    .filter(([slug]) => slug !== householdSlug)
    .map(([slug, item]) => `<a href="/finance/eitc/${slug}">${item.label}</a>`)
    .join(" · ");

  return `
    <article data-seo-prerender="eitc" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/eitc" style="color:hsl(var(--muted-foreground));text-decoration:none;">근로장려금 계산기</a>
        &nbsp;›&nbsp;
        ${bracket.label}
      </nav>

      <h1 style="${H1_STYLE}">${bracket.label} 근로장려금 — 소득별 지급액 (2026)</h1>

      <p style="${P_STYLE}">${detail.lead}</p>

      <p style="${P_STYLE}">
        ${bracket.label}는 연간 총급여 <strong>${formatWon(bracket.phaseOutEnd)}</strong> 미만일 때 신청할 수 있고,
        최대 <strong style="color:hsl(var(--primary));">${formatWon(bracket.maxAmount)}</strong>까지 받을 수 있습니다.
        총급여 ${formatWon(bracket.phaseInEnd)}까지는 소득에 비례해 늘어나는 점증 구간,
        ${formatWon(bracket.plateauEnd)}까지는 최대액을 유지하는 평탄 구간,
        그 이후는 상한에서 0원이 되는 점감 구간입니다.
      </p>

      <h2 style="${H2_STYLE}">1. ${bracket.label} 소득 구간별 예상 지급액</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">연간 총급여</th>
            <th style="${TH_STYLE}">구간</th>
            <th style="${TH_STYLE}">예상 근로장려금</th>
          </tr>
        </thead>
        <tbody>${tableRows}
        </tbody>
      </table>
      <p style="${P_STYLE}">${detail.tableNote}</p>

      <div style="${CALLOUT_STYLE}">${detail.callout}</div>

      <h2 style="${H2_STYLE}">2. ${detail.definitionH2}</h2>
      ${detail.definition.map((text) => `<p style="${P_STYLE}">${text}</p>`).join("")}

      <h2 style="${H2_STYLE}">3. ${detail.pitfallH2}</h2>
      <ul style="${UL_STYLE}">
        ${detail.pitfalls.map((text) => `<li style="${LI_STYLE}">${text}</li>`).join("")}
      </ul>

      <h2 style="${H2_STYLE}">4. ${detail.exampleH2}</h2>
      ${detail.example.map((text) => `<p style="${P_STYLE}">${text}</p>`).join("")}

      <h2 style="${H2_STYLE}">5. 자주 묻는 질문 (FAQ)</h2>
      ${detail.faq
        .map(
          (item, index) => `
      <h3 style="${H3_STYLE}">Q${index + 1}. ${item.q}</h3>
      <p style="${P_STYLE}">${item.a}</p>`,
        )
        .join("")}

      <h2 style="${H2_STYLE}">6. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/eitc">근로장려금 계산기</a> - 조건 직접 입력</li>
        ${detail.relatedLinks
          .map(([href, label, note]) => `<li style="${LI_STYLE}"><a href="${href}">${label}</a> - ${note}</li>`)
          .join("")}
      </ul>
      <p style="${P_STYLE}">다른 가구 유형으로 보기: ${otherLinks}</p>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 조세특례제한법 산식 기준 간이 추정치이며, 국세청 산정표·단수 조정, 국민연금 수급 등 제외 요건에 따라
        실제 지급액과 차이가 있을 수 있습니다. 확정 금액은 홈택스 모의계산을 이용하세요.
      </p>
    </article>`;
}

// =========================
// 임금체불 지연이자 (/unpaid-wage/:amount)
// =========================
// src/utils/unpaidWageCalculator.ts 미러 — 체불액 × 연이율 × 일수 ÷ 365
const UNPAID_WAGE_RATES = UNPAID_WAGE_RATE_TABLE;
const UNPAID_WAGE_PERIODS = [30, 90, 180, 365];

function buildUnpaidWageContent(manWon) {
  const amount = manWon * 10_000;
  const label = formatManWonValue(manWon);
  const dailyRetired = Math.floor((amount * 0.2) / 365);
  const monthlyRetired = Math.floor((amount * 0.2) / 12);

  const tableRows = UNPAID_WAGE_PERIODS.map((days) => {
    const cells = UNPAID_WAGE_RATES.map(
      (item) => `<td style="${TD_STYLE}">${formatWon(unpaidWageInterest(amount, item.rate, days))}</td>`,
    ).join("");
    return `
          <tr>
            <td style="${TD_STYLE}"><strong>${days}일</strong></td>${cells}
          </tr>`;
  }).join("");

  const otherAmountLinks = UNPAID_WAGE_AMOUNTS.filter((value) => value !== manWon)
    .map((value) => `<a href="/finance/unpaid-wage/${value}">${formatManWonValue(value)}원</a>`)
    .join(" · ");

  return `
    <article data-seo-prerender="unpaid-wage" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/unpaid-wage" style="color:hsl(var(--muted-foreground));text-decoration:none;">임금체불 지연이자 계산기</a>
        &nbsp;›&nbsp;
        체불액 ${label}원
      </nav>

      <h1 style="${H1_STYLE}">체불임금 ${label}원 지연이자 — 퇴직 후 연 20% 기준 (2026)</h1>

      <p style="${P_STYLE}">
        밀린 임금·퇴직금 <strong>${formatWon(amount)}</strong>은 퇴직일부터 14일(금품청산 기한)이 지난
        다음 날부터 근로기준법 제37조에 따라 <strong style="color:hsl(var(--primary));">연 20%</strong>의 지연이자가 붙습니다.
        하루 약 ${formatWon(dailyRetired)}, 한 달 기준 약 ${formatWon(monthlyRetired)}씩 늘어나는 셈입니다.
        재직 중 체불이나 소송 단계에서는 민법 5%·상법 6%·소송촉진법 12%가 적용됩니다.
      </p>

      <h2 style="${H2_STYLE}">1. 체불액 ${label}원의 기간·이율별 지연이자</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">이자 발생일수</th>
            ${UNPAID_WAGE_RATES.map((item) => `<th style="${TH_STYLE}">${item.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${tableRows}
        </tbody>
      </table>
      <p style="${P_STYLE}">
        퇴직 단계(연 20%)의 이자 발생일수는 퇴직일부터 경과한 날에서 금품청산 기한 14일을 제외하고 계산해야 합니다.
        예를 들어 퇴직 후 104일이 지났다면 이자 발생일수는 90일입니다.
      </p>

      <div style="${CALLOUT_STYLE}">
        <strong>계산식</strong> — 지연이자 = 체불액 × 연이율 × 이자 발생일수 ÷ 365
        <br>예) ${formatWon(amount)} × 20% × 90일 ÷ 365 = ${formatWon(Math.floor((amount * 0.2 * 90) / 365))}
      </div>

      <h2 style="${H2_STYLE}">2. 어떤 이율이 적용되나</h2>
      <p style="${P_STYLE}">
        연 20%는 <strong>퇴직·사망 근로자의 임금과 퇴직금</strong>에 적용되는 특칙입니다(근로기준법 제37조, 시행령 제17조).
        재직 중 밀린 임금은 민법상 연 5%, 회사(상인)를 상대로 상사채권 이율을 적용하면 연 6%가 일반적이며,
        소송에서는 소장이 송달된 다음 날부터 소송촉진법상 연 12%를 검토합니다.
        회사가 도산·회생 절차 중이면 시행령 제18조에 따라 연 20% 적용이 제외될 수 있습니다.
      </p>

      <h2 style="${H2_STYLE}">3. 못 받은 ${label}원, 실무 대응 순서</h2>
      <p style="${P_STYLE}">
        먼저 급여명세서·근로계약서·통장 내역으로 체불 사실을 정리한 뒤 회사에 지급을 요구하고,
        응하지 않으면 고용노동부 노동포털에서 임금체불 진정을 제기합니다.
        회사가 지급 능력이 없다면 간이대지급금 제도로 국가가 일정 한도까지 먼저 지급받을 수 있습니다.
        진정·소송 단계에서는 위 표의 지연이자를 함께 청구하는 것이 원칙입니다.
      </p>

      <h2 style="${H2_STYLE}">4. 자주 묻는 질문 (FAQ)</h2>

      <h3 style="${H3_STYLE}">Q1. 체불임금 ${label}원을 6개월(이자 발생 180일) 못 받으면 이자가 얼마인가요?</h3>
      <p style="${P_STYLE}">
        퇴직 후 연 20% 기준 약 ${formatWon(Math.floor((amount * 0.2 * 180) / 365))}입니다.
        재직 중 민법 5% 기준이라면 약 ${formatWon(Math.floor((amount * 0.05 * 180) / 365))}로 차이가 큽니다.
      </p>

      <h3 style="${H3_STYLE}">Q2. 지연이자도 소멸시효가 있나요?</h3>
      <p style="${P_STYLE}">
        임금채권의 소멸시효는 3년입니다. 체불이 오래될수록 청구 가능 범위가 줄어들 수 있으므로
        체불액 ${label}원의 지급 요구와 진정 절차를 미루지 않는 것이 안전합니다.
      </p>

      <h2 style="${H2_STYLE}">5. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/unpaid-wage">임금체불 지연이자 계산기</a> - 조건 직접 입력</li>
        <li style="${LI_STYLE}"><a href="/finance/severance-pay">퇴직금 계산기</a> - 퇴직금 예상액</li>
        <li style="${LI_STYLE}"><a href="/finance/unemployment">실업급여 계산기</a> - 구직급여 수급액</li>
        <li style="${LI_STYLE}"><a href="/finance/quit">퇴사 계산기</a> - 퇴사 전 종합 점검</li>
      </ul>
      <p style="${P_STYLE}">다른 체불액으로 보기: ${otherAmountLinks}</p>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 근로기준법·민법·상법·소송촉진법의 법정이율을 단순 적용한 참고용 추정치입니다.
        일부 변제, 지연이자 적용 제외 사유, 판결 주문에 따라 실제 금액은 달라질 수 있습니다.
      </p>
    </article>`;
}

// =========================
// 건강보험료 역산 (/insurance/:fee)
// =========================

// 인접 건보료 구간의 역산 결과 행 — 페이지별 고유 수치를 만들고 구간 페이지 간 크롤 경로를 잇는다
function buildInsuranceNeighborRows(fee) {
  const offsets = [-20_000, -10_000, 0, 10_000, 20_000];
  return offsets
    .map((offset) => fee + offset)
    .filter((neighborFee) => neighborFee >= 10_000)
    .map((neighborFee) => {
      const taxable = Math.floor(neighborFee / RATES_2026.healthInsurance.employee);
      const annual = (taxable + 200_000) * 12;
      const breakdown = calculateSalaryBreakdown({
        grossAnnual: annual,
        nonTaxableMonthly: 200_000,
        dependents: 1,
        children: 0,
        retirementIncluded: false,
      });
      const isCurrent = neighborFee === fee;
      const hasPage = !isCurrent && INSURANCE_AMOUNTS.includes(neighborFee);
      const feeCell = hasPage
        ? `<a href="/finance/insurance/${neighborFee}">${formatWon(neighborFee)}</a>`
        : `${formatWon(neighborFee)}${isCurrent ? " (현재 페이지)" : ""}`;
      return `
          <tr${isCurrent ? ' style="background:hsl(var(--accent));"' : ""}>
            <td style="${TD_STYLE}">${feeCell}</td>
            <td style="${TD_STYLE}">${formatManWonValue(Math.round(annual / 10_000))}원</td>
            <td style="${TD_STYLE}">${formatWon(breakdown.monthlyNet)}</td>
          </tr>`;
    })
    .join("");
}

// --- 건보료 구간 해석용 파생 상수 (전부 검증된 2026 수치·엔진 상수에서 파생) ---
const MIN_WAGE_HOURLY_2026 = 10_320;
// 주휴 포함 월 209시간 환산 — 전일제 최저임금 월급
const MIN_WAGE_MONTHLY_2026 = MIN_WAGE_HOURLY_2026 * 209;
const MIN_WAGE_FEE = Math.floor(MIN_WAGE_MONTHLY_2026 * RATES_2026.healthInsurance.employee);
const PENSION_CAP_TAXABLE = RATES_2026.nationalPension.maxMonthlyIncome;
const PENSION_CAP_FEE = Math.floor(PENSION_CAP_TAXABLE * RATES_2026.healthInsurance.employee);
const PENSION_CAP_DEDUCTION = Math.floor(
  PENSION_CAP_TAXABLE * RATES_2026.nationalPension.employee
);
// 피부양자 소득요건 — 기존 검증 문구(연 2,000만원 이하)와 동일 상수
const DEPENDENT_INCOME_CEILING = 20_000_000;

// 연봉 천만 단위 밴드 + 밴드 내 위치 — 인접 금액 페이지 간 서술이 실제로 갈리게 하는 파생 워딩
function salaryBandLabel(annual) {
  if (annual >= 100_000_000) {
    return `${formatManWonValue(Math.round(annual / 10_000))}원`;
  }
  const tenMillions = Math.floor(annual / 10_000_000);
  const position = (annual % 10_000_000) / 10_000_000;
  const suffix = position < 0.34 ? "초반" : position < 0.67 ? "중반" : "후반";
  return `${tenMillions}천만원대 ${suffix}`;
}

// 과세표준이 속한 소득세 구간 (calc-engine의 누진 구간 상수 사용)
function findIncomeTaxBracket(taxableBase) {
  return INCOME_TAX_BRACKETS.find((bracket) => taxableBase <= bracket.limit);
}

// 금액 구간별 해석 문단 — 저(5~9만)/중(10~25만)/고(26만+) 조건 분기 + 페이지별 파생 수치
function buildInsuranceBracketInterpretation(fee, monthlyTaxable, estimatedAnnual, result) {
  const estimatedManWon = Math.round(estimatedAnnual / 10_000);
  const bracket = findIncomeTaxBracket(result.taxableBase);
  const paragraphs = [];

  if (fee < 100_000) {
    const belowMinWage = fee < MIN_WAGE_FEE;
    paragraphs.push(`
      이 구간의 역산 보수월액 ${formatWon(monthlyTaxable)}은 2026년 최저시급 10,320원을
      주 40시간(주휴 포함 월 209시간)으로 환산한 월급 ${formatWon(MIN_WAGE_MONTHLY_2026)}${
        belowMinWage
          ? `보다 낮습니다. 전일제 근무라면 나오기 어려운 금액이므로 주 40시간 미만 단시간 근로,
      휴직·복직이 낀 달, 입사 첫 달 일할 계산일 가능성이 큽니다. 단시간 근로라면
      <a href="/finance/wage-converter">시급·월급 환산</a>과 <a href="/finance/weekly-holiday-pay">주휴수당 충족 여부</a>를 함께 확인해 보세요.`
          : ` 부근이거나 그보다 높은 수준입니다. 전일제 최저임금 언저리 급여대로, 상여·수당 반영
      여부에 따라 실제 월급과 차이가 날 수 있습니다.`
      }`);
    if (estimatedAnnual <= DEPENDENT_INCOME_CEILING) {
      paragraphs.push(`
      역산 연소득 약 ${formatManWonValue(estimatedManWon)}원은 건강보험 피부양자 소득요건(연 2,000만원 이하)
      안쪽입니다. 퇴사하게 되면 가족 중 직장가입자가 있는 경우 지역가입 전환 대신
      <a href="/finance/dependent">피부양자 등록</a>을 검토할 수 있는 경계 구간입니다.`);
    } else {
      paragraphs.push(`
      역산 연소득 약 ${formatManWonValue(estimatedManWon)}원은 피부양자 소득요건(연 2,000만원)을
      약 ${formatWon(estimatedAnnual - DEPENDENT_INCOME_CEILING)} 넘습니다. 퇴사 후 피부양자 등록은
      소득요건에서 막히므로, <a href="/finance/regional-health">지역가입 전환 보험료</a>를 미리 확인해
      두는 편이 안전합니다.`);
    }
  } else if (fee < 260_000) {
    // 연봉 5,000만원 선 통과 여부로 해석 각도가 갈린다 — 인접 페이지 간 실제 서술 차이의 원천
    const fiftyMillionFee = Math.floor(
      (50_000_000 / 12 - 200_000) * RATES_2026.healthInsurance.employee
    );
    paragraphs.push(`
      역산 연봉 약 ${formatManWonValue(estimatedManWon)}원은 ${salaryBandLabel(estimatedAnnual)} 밴드입니다.
      이 추정 연봉의 과세표준 ${formatWon(result.taxableBase)}은 소득세 ${formatPercent(bracket.rate, 0)}
      구간에 속하고, 4대보험까지 합친 체감 공제율은 ${formatPercent(result.effectiveTaxRate)} 수준이라
      세전 월 ${formatWon(monthlyTaxable + 200_000)} 가운데 ${formatWon(result.monthlyNet)}이 통장에 남는 구조입니다.
      ${
        estimatedAnnual >= 50_000_000
          ? `연봉 5,000만원 선을 넘어선 구간이라 소득세·지방소득세(월 ${formatWon(result.totalTax)})가
      4대보험 합계(월 ${formatWon(result.totalInsurance)})의 ${formatPercent(result.totalTax / result.totalInsurance)}까지
      올라와, 공제의 무게중심이 보험료에서 세금 쪽으로 옮겨가기 시작합니다.`
          : `연봉 5,000만원 선은 건보료 기준 약 ${formatWon(fiftyMillionFee)}부터로, 지금 고지액에서
      ${formatWon(fiftyMillionFee - fee)} 남았습니다. 그 전까지는 공제에서 세금(월 ${formatWon(result.totalTax)})보다
      4대보험(월 ${formatWon(result.totalInsurance)})의 비중이 훨씬 큰 구간입니다.`
      }`);
    paragraphs.push(`
      회사가 매년 4월 보수총액을 신고해 정산하면 보수월액이 달라질 수 있습니다. 정산으로 보수월액이
      10% 오르면 건보료도 ${formatWon(fee)}에서 약 ${formatWon(Math.floor(fee * 1.1))}으로 같은 비율로
      오르고, 장기요양보험료(현재 약 ${formatWon(Math.floor(fee * RATES_2026.longTermCare.rateOfHealth))})도
      함께 늘어납니다. 고지 금액이 몇 달 사이 바뀌었다면 연봉 변동보다 정산 반영일 가능성부터 의심해 보세요.`);
    if (fee >= PENSION_CAP_FEE) {
      paragraphs.push(`
      보수월액 ${formatWon(monthlyTaxable)}은 국민연금 기준소득월액 상한(${formatWon(PENSION_CAP_TAXABLE)})을
      이미 넘어섰습니다. 국민연금 공제는 ${formatWon(PENSION_CAP_DEDUCTION)}으로 고정되고, 급여가 더
      올라도 건강보험·장기요양·고용보험과 소득세만 비례해서 늘어납니다.`);
    } else {
      paragraphs.push(`
      국민연금 상한(보수월액 ${formatWon(PENSION_CAP_TAXABLE)})까지는 보수월액 기준
      ${formatWon(PENSION_CAP_TAXABLE - monthlyTaxable)} 여유가 있어, 급여가 올라도 아직 4대보험
      전 항목이 비례해서 늘어나는 구간입니다.`);
    }
  } else {
    paragraphs.push(`
      역산 연봉 약 ${formatManWonValue(estimatedManWon)}원(${salaryBandLabel(estimatedAnnual)})의 보수월액
      ${formatWon(monthlyTaxable)}은 국민연금 기준소득월액 상한(${formatWon(PENSION_CAP_TAXABLE)})을
      ${formatWon(monthlyTaxable - PENSION_CAP_TAXABLE)} 초과합니다. 국민연금 공제는 상한 기준
      ${formatWon(PENSION_CAP_DEDUCTION)}에서 멈추므로, 이 구간부터 급여 인상분에는 건강보험 3.595%·
      장기요양·고용보험 0.9%와 소득세만 붙습니다. 추정 과세표준의 소득세 한계 구간은
      ${formatPercent(bracket.rate, 0)}이고 체감 공제율은 ${formatPercent(result.effectiveTaxRate)}입니다.`);
    paragraphs.push(`
      월 건보료가 ${Math.round(fee / 10_000)}만원대인데 역산 연봉이 실제 연봉과 크게 다르다면, 보수 외
      소득에 부과되는 소득월액 보험료가 섞여 있을 수 있습니다. 이자·배당·임대 같은 보수 외 소득이
      연 2,000만원을 초과하면 초과분에 대해 보수월액 보험료와 별도로 부과되므로, 고지서 합계만 보고
      연봉을 역산하면 실제보다 높게 추정됩니다.`);
  }

  const minWageRatio = (fee / MIN_WAGE_FEE).toFixed(2);
  const capShare = formatPercent(monthlyTaxable / PENSION_CAP_TAXABLE);

  return `
      <h2 style="${H2_STYLE}">4. 건보료 ${formatWon(fee)}의 위치 해석</h2>
      <p style="${P_STYLE}">
        월 ${formatWon(fee)}은 연간 ${formatWon(fee * 12)}을 본인이 부담하는 수준입니다.
        전일제 최저임금 근로자의 건보료(약 ${formatWon(MIN_WAGE_FEE)})의 ${minWageRatio}배이며,
        역산 보수월액이 국민연금 기준소득월액 상한(${formatWon(PENSION_CAP_TAXABLE)})에서 차지하는
        비율은 ${capShare}입니다.
      </p>
      ${paragraphs.map((body) => `<p style="${P_STYLE}">${body.trim()}</p>`).join("\n      ")}
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">건보료 ${formatWon(fee)} 기준 파생 지표</th>
            <th style="${TH_STYLE}">값</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">연간 본인 부담 건강보험료</td>
            <td style="${TD_STYLE}">${formatWon(fee * 12)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">장기요양 포함 월 부담</td>
            <td style="${TD_STYLE}">${formatWon(fee + Math.floor(fee * RATES_2026.longTermCare.rateOfHealth))}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">사업주 부담 포함 월 총액 (건강보험만)</td>
            <td style="${TD_STYLE}">${formatWon(fee * 2)} (연 ${formatWon(fee * 24)})</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">보수월액의 국민연금 상한 대비 비율</td>
            <td style="${TD_STYLE}">${capShare}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">전일제 최저임금 건보료 대비 배율</td>
            <td style="${TD_STYLE}">${minWageRatio}배</td>
          </tr>
        </tbody>
      </table>`;
}

// 페이지별 추가 분석 렌즈 — 프리셋 인덱스로 로테이션해 인접 금액 페이지가 같은 문단을
// 반복하지 않게 한다. 각 렌즈는 계산 엔진 출력에서 파생한 서로 다른 실제 분석이다.
function buildInsuranceAngleBlock(fee, estimatedAnnual, result) {
  const index = INSURANCE_AMOUNTS.indexOf(fee);
  const angle = ((index % 3) + 3) % 3;

  if (angle === 0) {
    // 렌즈 A: 부양가족 수에 따른 실수령 변화 — 건보료는 그대로인데 통장 금액이 달라진다
    const s2 = calculateSalaryBreakdown({
      grossAnnual: estimatedAnnual,
      nonTaxableMonthly: 200_000,
      dependents: 2,
      children: 0,
      retirementIncluded: false,
    });
    const s4 = calculateSalaryBreakdown({
      grossAnnual: estimatedAnnual,
      nonTaxableMonthly: 200_000,
      dependents: 4,
      children: 2,
      retirementIncluded: false,
    });
    return `
      <h3 style="${H3_STYLE}">부양가족이 달라지면 — 건보료는 그대로, 실수령만 달라진다</h3>
      <p style="${P_STYLE}">
        건강보험료는 부양가족 수와 무관하게 보수월액으로만 정해지므로 이 페이지의 ${formatWon(fee)}은
        그대로입니다. 달라지는 것은 소득세입니다. 같은 추정 연봉에서 부양가족이 2인(배우자 포함)이면
        월 실수령이 ${formatWon(s2.monthlyNet)}으로 기본(1인) 대비 ${formatWon(s2.monthlyNet - result.monthlyNet)}
        늘고, 4인(자녀 2명 포함)이면 ${formatWon(s4.monthlyNet)}으로 ${formatWon(s4.monthlyNet - result.monthlyNet)}
        늘어납니다. ${
          s4.monthlyNet - result.monthlyNet < 5_000
            ? `이 연봉대는 근로소득·표준세액공제만으로 소득세가 거의 상쇄되어, 부양가족을 더 등록해도
        줄어들 세금 자체가 얼마 남아 있지 않습니다.`
            : `인적공제·자녀세액공제가 소득세를 줄이기 때문입니다.`
        }
      </p>`;
  }

  if (angle === 1) {
    // 렌즈 B: 건보료 1만원 상승을 연봉 인상으로 환산 — 고지서 변화를 연봉 언어로 읽는다
    const nextFeeTaxable = Math.floor((fee + 10_000) / RATES_2026.healthInsurance.employee);
    const nextFeeAnnual = (nextFeeTaxable + 200_000) * 12;
    const salaryStep = nextFeeAnnual - estimatedAnnual;
    const nextResult = calculateSalaryBreakdown({
      grossAnnual: nextFeeAnnual,
      nonTaxableMonthly: 200_000,
      dependents: 1,
      children: 0,
      retirementIncluded: false,
    });
    return `
      <h3 style="${H3_STYLE}">건보료 1만원 차이를 연봉으로 환산하면</h3>
      <p style="${P_STYLE}">
        월 건보료가 ${formatWon(fee)}에서 ${formatWon(fee + 10_000)}으로 오르려면 연봉이 약
        ${formatWon(salaryStep)} 올라야 합니다. 그렇게 연봉 ${formatManWonValue(Math.round(nextFeeAnnual / 10_000))}원이
        되면 월 실수령은 ${formatWon(result.monthlyNet)}에서 ${formatWon(nextResult.monthlyNet)}으로
        ${formatWon(nextResult.monthlyNet - result.monthlyNet)} 늘어납니다. 고지서의 건보료 변화폭을 보면
        연봉 협상 결과가 급여에 실제 반영됐는지 역으로 검증할 수 있습니다.
      </p>`;
  }

  // 렌즈 C: 누적 부담 — 연·10년 단위로 보는 건보+장기요양 총액
  const monthlyWithCare = fee + Math.floor(fee * RATES_2026.longTermCare.rateOfHealth);
  const yearlyWithCare = monthlyWithCare * 12;
  return `
      <h3 style="${H3_STYLE}">누적으로 보면 — 건보+장기요양 연간·10년 부담</h3>
      <p style="${P_STYLE}">
        장기요양보험까지 합친 월 부담 ${formatWon(monthlyWithCare)}은 연간 ${formatWon(yearlyWithCare)},
        같은 급여가 10년 유지된다고 가정하면 ${formatWon(yearlyWithCare * 10)}에 이릅니다. 이 연간 부담은
        추정 연 실수령액 ${formatWon(result.annualNet)}의 ${formatPercent(yearlyWithCare / result.annualNet)}에
        해당합니다. 사업주 부담분까지 계산에 넣으면 이 급여 자리 하나에 걷히는 건강보험 재원은 그 두 배가
        됩니다.
      </p>`;
}

// 두 번째 로테이션(홀짝) — 3렌즈와 주기가 달라 어떤 인접 쌍에서도 두 블록이 동시에 겹치지 않는다
function buildInsuranceParityBlock(fee, monthlyTaxable, result) {
  const index = INSURANCE_AMOUNTS.indexOf(fee);

  if (index % 2 === 0) {
    // 짝수: 비과세 가정을 바꾸면 역산 결과가 어떻게 달라지는가
    const annualWith300k = (monthlyTaxable + 300_000) * 12;
    const resultWith300k = calculateSalaryBreakdown({
      grossAnnual: annualWith300k,
      nonTaxableMonthly: 300_000,
      dependents: 1,
      children: 0,
      retirementIncluded: false,
    });
    return `
      <h3 style="${H3_STYLE}">비과세가 다르면 — 식대 30만원 가정으로 다시 역산</h3>
      <p style="${P_STYLE}">
        건강보험료는 과세 보수에만 붙습니다. 그래서 회사의 비과세 항목이 월 30만원(식대에 자가운전보조금
        등이 더해진 경우)이라면, 같은 건보료 ${formatWon(fee)}로 추정하는 연봉은 약
        ${formatManWonValue(Math.round(annualWith300k / 10_000))}원으로 올라가고 월 실수령도
        ${formatWon(resultWith300k.monthlyNet)}으로 달라집니다. 이 페이지 기본 가정(비과세 20만원)과의
        차이가 곧 비과세 설계의 효과입니다.
      </p>`;
  }

  // 홀수: 원천세(소득세)로 교차 검증
  return `
      <h3 style="${H3_STYLE}">소득세로 교차 검증하기</h3>
      <p style="${P_STYLE}">
        역산이 맞는지 확인하는 가장 쉬운 방법은 급여명세서의 소득세와 대조하는 것입니다. 추정 연봉
        기준 이 페이지의 월 소득세+지방소득세는 ${formatWon(result.totalTax)}입니다. 실제 명세서 소득세가
        이보다 크게 높다면 부양가족 등록이 빠졌거나 상여가 그 달에 몰렸을 가능성이 있고, 반대로 크게
        낮다면 비과세 항목이 많다는 신호입니다. 소득세에서 연봉을 거꾸로 확인하려면
        <a href="/finance/withholding">원천세 역산 계산기</a>를 이용하세요.
      </p>`;
}

// 같은 건보료의 직장가입 vs 지역가입 구조 차이 — 페이지 금액을 그대로 대입한 1문단
function buildInsuranceRegionalCompare(fee) {
  return `
      <h2 style="${H2_STYLE}">5. 직장가입 ${formatWon(fee)} vs 지역가입 — 같은 금액의 다른 구조</h2>
      <p style="${P_STYLE}">
        직장가입자의 ${formatWon(fee)}은 절반 구조입니다. 사업주가 같은 금액을 함께 내므로 이 급여에
        실제 걷히는 건강보험료는 월 ${formatWon(fee * 2)}(연 ${formatWon(fee * 24)})이고 본인 부담은 그
        절반입니다. 반면 지역가입자는 사업주 부담 없이 소득·재산·자동차를 점수화해 세대 단위로
        부과하므로, 퇴사 후에는 같은 소득이라도 재산이 있으면 월 부담이 ${formatWon(fee)}보다 커지는
        경우가 많습니다. 퇴사를 앞두고 있다면 <a href="/finance/regional-health">지역가입 예상 보험료</a>를
        먼저 계산해 보고, 퇴사 후 2개월 안에 임의계속가입(최대 36개월 직장 수준 유지)을 신청할지
        판단하세요.
      </p>`;
}

function buildInsuranceContent(fee) {
  // 건보료 → 월 과세급여 역산
  const monthlyTaxable = Math.floor(fee / RATES_2026.healthInsurance.employee);
  const estimatedAnnual = (monthlyTaxable + 200_000) * 12;
  const estimatedManWon = Math.round(estimatedAnnual / 10_000);

  const result = calculateSalaryBreakdown({
    grossAnnual: estimatedAnnual,
    nonTaxableMonthly: 200_000,
    dependents: 1,
    children: 0,
    retirementIncluded: false,
  });

  const feeManWon = Math.round(fee / 10_000);

  return `
    <article data-seo-prerender="insurance" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/insurance" style="color:hsl(var(--muted-foreground));text-decoration:none;">건강보험료 계산기</a>
        &nbsp;›&nbsp;
        건보료 ${feeManWon}만원
      </nav>

      <h1 style="${H1_STYLE}">건강보험료 ${feeManWon}만원이면 연봉은 얼마? (2026년)</h1>

      <p style="${P_STYLE}">
        월 건강보험료가 <strong>${formatWon(fee)}</strong>이라면, 2026년 건보료 요율 3.595%(근로자 부담)를
        기준으로 역산한 월 과세 급여는 약 <strong style="color:hsl(var(--primary));">${formatWon(monthlyTaxable)}</strong>,
        비과세 식대(월 20만원) 포함 월 총 지급액은 약 ${formatWon(monthlyTaxable + 200_000)}이며,
        연봉으로 환산하면 <strong>약 ${formatManWonValue(estimatedManWon)}원</strong>입니다.
      </p>

      <p style="${P_STYLE}">
        건강보험료는 보수월액(= 세전 월 과세급여)에 3.595%를 곱하여 산정하므로,
        건보료를 알면 역으로 본인의 세전 급여 수준을 추정할 수 있습니다.
        다만 회사가 신고한 "보수월액"과 실제 월급이 다를 수 있어(성과급 일시 포함 등) 참고용으로 활용하시기 바랍니다.
      </p>

      <h2 style="${H2_STYLE}">1. 역산 결과 요약</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">항목</th>
            <th style="${TH_STYLE}">금액</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">입력: 월 건강보험료(근로자 부담)</td>
            <td style="${TD_STYLE}">${formatWon(fee)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">역산: 월 과세 급여(보수월액)</td>
            <td style="${TD_STYLE}">${formatWon(monthlyTaxable)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">추정 월 세전 급여 (비과세 20만원 포함)</td>
            <td style="${TD_STYLE}">${formatWon(monthlyTaxable + 200_000)}</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>추정 연봉</strong></td>
            <td style="${TD_STYLE}"><strong style="color:hsl(var(--primary));">${formatManWonValue(estimatedManWon)}원 (${formatWon(estimatedAnnual)})</strong></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">예상 월 실수령액</td>
            <td style="${TD_STYLE}">${formatWon(result.monthlyNet)}</td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">2. 2026년 건강보험료 요율</h2>
      <p style="${P_STYLE}">
        국민건강보험공단의 2026년 건강보험료 요율은 다음과 같이 고시되었습니다.
      </p>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">구분</th>
            <th style="${TH_STYLE}">요율</th>
            <th style="${TH_STYLE}">부담자</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">건강보험 (근로자)</td>
            <td style="${TD_STYLE}">3.595%</td>
            <td style="${TD_STYLE}">근로자</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">건강보험 (사업주)</td>
            <td style="${TD_STYLE}">3.595%</td>
            <td style="${TD_STYLE}">사업주</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">건강보험 (총)</td>
            <td style="${TD_STYLE}">7.19%</td>
            <td style="${TD_STYLE}">합계</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">장기요양보험</td>
            <td style="${TD_STYLE}">건보료의 13.14%</td>
            <td style="${TD_STYLE}">근로자+사업주</td>
          </tr>
        </tbody>
      </table>

      <div style="${CALLOUT_STYLE}">
        <strong>역산 공식</strong> — 월 과세급여 = 월 건강보험료 ÷ 0.03595
        <br>예) 건보료 ${formatWon(fee)} ÷ 0.03595 = ${formatWon(monthlyTaxable)}
      </div>

      <h2 style="${H2_STYLE}">3. 추정 연봉 기준 전체 공제 항목</h2>
      <p style="${P_STYLE}">
        추정 연봉 ${formatManWonValue(estimatedManWon)}원 기준 월 4대보험·세금 공제 내역입니다.
      </p>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr>
            <td style="${TD_STYLE}">국민연금 (4.75%)</td>
            <td style="${TD_STYLE}">${formatWon(result.nationalPension)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">건강보험 (3.595%)</td>
            <td style="${TD_STYLE}">${formatWon(result.healthInsurance)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">장기요양보험</td>
            <td style="${TD_STYLE}">${formatWon(result.longTermCare)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">고용보험 (0.9%)</td>
            <td style="${TD_STYLE}">${formatWon(result.employmentInsurance)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">소득세+지방소득세</td>
            <td style="${TD_STYLE}">${formatWon(result.totalTax)}</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>월 실수령액</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(result.monthlyNet)}</strong></td>
          </tr>
        </tbody>
      </table>
      ${buildInsuranceBracketInterpretation(fee, monthlyTaxable, estimatedAnnual, result)}
      ${buildInsuranceAngleBlock(fee, estimatedAnnual, result)}
      ${buildInsuranceParityBlock(fee, monthlyTaxable, result)}
      ${buildInsuranceRegionalCompare(fee)}

      <h2 style="${H2_STYLE}">6. 인접 건보료 구간 비교</h2>
      <p style="${P_STYLE}">
        월 건강보험료가 1~2만원 차이 나면 역산 연봉은 얼마나 달라질까요?
        건보료 ${formatWon(fee)} 전후 구간의 추정 연봉과 월 실수령액을 비교한 표입니다.
        보수월액 신고 반올림이나 성과급 반영 시점에 따라 실제 급여는 인접 구간에 걸쳐 있을 수 있습니다.
      </p>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">월 건강보험료</th>
            <th style="${TH_STYLE}">추정 연봉</th>
            <th style="${TH_STYLE}">예상 월 실수령액</th>
          </tr>
        </thead>
        <tbody>${buildInsuranceNeighborRows(fee)}
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">7. 자주 묻는 질문 (FAQ)</h2>

      <h3 style="${H3_STYLE}">Q1. 건보료 ${feeManWon}만원이면 연봉이 얼마인가요?</h3>
      <p style="${P_STYLE}">
        2026년 요율 3.595%로 역산한 보수월액은 ${formatWon(monthlyTaxable)}이고, 비과세 식대 월 20만원을
        더해 연봉으로 환산하면 약 ${formatManWonValue(estimatedManWon)}원(${formatWon(estimatedAnnual)})입니다.
        비과세 항목이 더 많은 회사라면 실제 연봉은 이 추정치보다 높을 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q2. 건보료 ${feeManWon}만원이면 월 실수령액은 얼마인가요?</h3>
      <p style="${P_STYLE}">
        부양가족 1인 기준 약 ${formatWon(result.monthlyNet)}입니다. 국민연금 ${formatWon(result.nationalPension)},
        건강보험·장기요양 ${formatWon(result.healthInsurance + result.longTermCare)}, 고용보험
        ${formatWon(result.employmentInsurance)}, 소득세·지방소득세 ${formatWon(result.totalTax)}을 공제한
        값이며, 부양가족이 늘면 소득세가 줄어 실수령이 커집니다.
      </p>

      <h3 style="${H3_STYLE}">Q3. 회사가 신고한 건보료와 실제 급여가 다를 수 있나요?</h3>
      <p style="${P_STYLE}">
        네. 회사는 매년 4월 "보수총액신고"를 통해 직전 연도의 실제 급여를 반영합니다.
        따라서 성과급·상여금이 포함된 해에는 건보료가 일시적으로 높아질 수 있고, 이후 정산이 이뤄집니다.
        본 역산 결과는 신고된 보수월액 기준의 추정이므로 실제 연봉과 차이가 있을 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q4. 장기요양보험료도 따로 내나요?</h3>
      <p style="${P_STYLE}">
        장기요양보험료는 건강보험료의 13.14%(2026년 고시)로 자동 부과되며, 건강보험료와 함께 급여에서 공제됩니다.
        건보료 ${formatWon(fee)} 기준 장기요양보험료는 약 ${formatWon(Math.floor(fee * 0.1314))}입니다.
      </p>

      <h3 style="${H3_STYLE}">Q5. 지역가입자도 같은 요율을 적용하나요?</h3>
      <p style="${P_STYLE}">
        아니오. 지역가입자는 소득·재산·자동차 등을 점수화한 "보험료 부과점수"에 따라 산정되며,
        직장가입자의 3.595% 단순 요율과 다릅니다. 퇴사 후 지역가입자 전환 시 보험료 추정은
        <a href="/finance/regional-health">지역가입자 건보료 계산기</a>를 이용하세요.
      </p>

      <h3 style="${H3_STYLE}">Q6. 피부양자로 등록하면 건보료가 없나요?</h3>
      <p style="${P_STYLE}">
        직장가입자의 배우자·자녀 등이 피부양자 조건(소득 연 2,000만원 이하, 재산 과세표준 5.4억 이하 등)을
        충족하면 별도의 건강보험료 없이 의료보험 혜택을 받을 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q7. 건보료가 매년 오르나요?</h3>
      <p style="${P_STYLE}">
        건강보험료율은 매년 국민건강보험공단과 보건복지부가 협의해 고시합니다.
        최근 추세는 연 2~4% 수준의 인상이며, 2026년 근로자 부담 요율은 3.595%입니다.
      </p>

      <h2 style="${H2_STYLE}">8. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a> - 연봉으로 실수령 순산</li>
        <li style="${LI_STYLE}"><a href="/finance/regional-health">지역가입자 건보료 계산기</a> - 퇴사 후 건보료</li>
        <li style="${LI_STYLE}"><a href="/finance/withholding">원천세 역산 계산기</a> - 소득세로 연봉 추정</li>
        <li style="${LI_STYLE}"><a href="/finance/4-insurance-employer">사업주 4대보험 계산기</a></li>
      </ul>

      <h2 style="${H2_STYLE}">9. 공식 출처</h2>
      <p style="${P_STYLE}">
        건강보험 요율 고시 원문과 본인의 실제 보수월액·납부 내역은 아래 공공기관 사이트에서
        직접 확인할 수 있습니다. 역산 결과는 참고용이므로 공식 자료와 교차 확인하세요.
      </p>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="https://www.nhis.or.kr" target="_blank" rel="noopener noreferrer">국민건강보험공단</a> — 보험료율 고시·개인별 보험료 조회</li>
        <li style="${LI_STYLE}"><a href="https://www.4insure.or.kr" target="_blank" rel="noopener noreferrer">4대사회보험 정보연계센터</a> — 사업장 가입 내역·보수월액 확인</li>
      </ul>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 국민건강보험공단 2026년 요율 고시를 기반으로 한 역산 추정치이며, 법적 효력이 없는 참고용입니다.
      </p>
    </article>`;
}

// =========================
// 종합소득세 (/comprehensive-tax/:amount)
// =========================
// 종합소득세 누진 산출세액 — 프리셋 본계산과 "경비를 더 인정받으면" 시뮬레이션이 공유
// 누진 구간을 사람이 읽는 라벨로 (calc-engine INCOME_TAX_BRACKETS 기준)
function incomeTaxBracketLabel(bracket) {
  const limitLabel = Number.isFinite(bracket.limit)
    ? `${formatManWonValue(Math.round(bracket.limit / 10_000))}원`
    : null;
  const baseLabel = `${formatManWonValue(Math.round(bracket.baseIncome / 10_000))}원`;
  if (bracket.baseIncome === 0) return `${limitLabel} 이하`;
  if (!limitLabel) return `${baseLabel} 초과`;
  return `${baseLabel}~${limitLabel}`;
}

// 과세표준 위치 해석 — 한계세율 vs 실효세율, 다음 구간까지의 거리, 추가 수입 100만원의 세부담
function buildComprehensiveTaxBracketSection(label, calc) {
  const bracket = findIncomeTaxBracket(calc.taxableBase);
  const bracketIndex = INCOME_TAX_BRACKETS.indexOf(bracket);
  const nextBracket = INCOME_TAX_BRACKETS[bracketIndex + 1] ?? null;
  const excessOverBase = calc.taxableBase - bracket.baseIncome;
  const effectiveOnIncome = calc.totalTax / calc.income;
  // 추가 수입 100만원: 경비율 인정 후 남는 과세표준 증가분에 한계세율·지방소득세 10% 가산
  const marginalTaxablePerMillion = Math.floor(1_000_000 * (1 - calc.marginalExpenseRate));
  const deltaPerMillion = Math.floor(marginalTaxablePerMillion * bracket.rate * 1.1);

  return `
      <h2 style="${H2_STYLE}">3. 과세표준 위치 — 한계세율 vs 실효세율</h2>
      <p style="${P_STYLE}">
        수입 ${label}원에서 경비 ${formatWon(calc.expenses)}과 인적공제를 뺀 과세표준
        ${formatWon(calc.taxableBase)}은 누진세율표의 <strong>${incomeTaxBracketLabel(bracket)} 구간
        (세율 ${formatPercent(bracket.rate, 0)})</strong>에 있습니다. 구간 하단(${formatWon(bracket.baseIncome)})을
        ${formatWon(excessOverBase)} 넘긴 위치${
          nextBracket
            ? `이고, 다음 구간(세율 ${formatPercent(nextBracket.rate, 0)})까지는 과세표준 기준
        ${formatWon(bracket.limit - calc.taxableBase)} 남았습니다`
            : `로, 최고 세율 구간입니다`
        }.
      </p>
      <p style="${P_STYLE}">
        이 구간의 한계세율은 ${formatPercent(bracket.rate, 0)}이지만 총수입 대비 실제 세부담(실효세율)은
        ${formatPercent(effectiveOnIncome)}입니다. 격차가 큰 이유는 두 가지입니다. 누진 구조라 과세표준의
        앞부분에는 낮은 구간 세율이 먼저 적용되고, 수입의 ${formatPercent(calc.expenses / calc.income)}가
        경비로 인정돼 과세표준 자체가 수입보다 훨씬 작기 때문입니다.
      </p>
      <p style="${P_STYLE}">
        같은 이유로 지금 수입에서 100만원을 더 벌면 세금은 약 ${formatWon(deltaPerMillion)}만 늘어납니다.
        추가 수입 100만원 중 경비 ${formatPercent(calc.marginalExpenseRate)} 인정 후 남는
        ${formatWon(marginalTaxablePerMillion)}에 한계세율 ${formatPercent(bracket.rate, 0)}과 지방소득세
        10%가 붙는 구조입니다.
      </p>`;
}

// 페이지별 추가 분석 렌즈 — 프리셋 인덱스 로테이션으로 인접 수입 페이지의 문단 반복을 막는다
function buildComprehensiveTaxAngleBlock(manWon, calc) {
  const index = COMPREHENSIVE_TAX_AMOUNTS.indexOf(manWon);
  const angle = ((index % 3) + 3) % 3;

  if (angle === 0) {
    // 렌즈 A: 장부 기장 시뮬레이션 — 실제 경비를 500만원 더 인정받으면
    const reducedBase = Math.max(0, calc.taxableBase - 5_000_000);
    const reducedTotal = comprehensiveTotalTaxOf(reducedBase);
    const saving = calc.totalTax - reducedTotal;
    return `
      <h3 style="${H3_STYLE}">장부를 쓰면 얼마나 달라질까 — 경비 500만원 추가 인정 시뮬레이션</h3>
      <p style="${P_STYLE}">
        실제 지출한 경비가 단순경비율 ${formatWon(calc.expenses)}보다 500만원 더 많다는 것을 장부로
        입증하면, 과세표준이 ${formatWon(calc.taxableBase)}에서 ${formatWon(reducedBase)}으로 내려가
        세금은 ${formatWon(reducedTotal)}이 됩니다. 지금 추정치보다 ${formatWon(saving)}이 줄어드는
        셈입니다. 여기에 복식부기 기장 시 기장세액공제(20%)까지 더해질 수 있으므로, 장비·외주비 지출이
        큰 해에는 장부 기장을 검토할 가치가 있습니다.
      </p>`;
  }

  if (angle === 1) {
    // 렌즈 B: 캐시플로 — 월 단위로 나눠 본 수입·원천징수·정산
    const monthlyIncome = Math.round(calc.income / 12);
    const monthlyWithholding = Math.round(calc.withholdingPrepaid / 12);
    return `
      <h3 style="${H3_STYLE}">월 단위 캐시플로로 보면</h3>
      <p style="${P_STYLE}">
        연 수입 ${formatManWonValue(manWon)}원은 월평균 ${formatWon(monthlyIncome)}이고, 지급처가 매달
        3.3%씩 떼는 원천징수는 월평균 ${formatWon(monthlyWithholding)}입니다. 이렇게 1년간 선납한
        ${formatWon(calc.withholdingPrepaid)}과 실제 세액 ${formatWon(calc.totalTax)}의 차이가 다음 해
        5월 정산에서 ${calc.refund >= 0 ? `약 ${formatWon(calc.refund)} 환급` : `약 ${formatWon(-calc.refund)} 추가 납부`}으로
        돌아옵니다. 환급이 예상되더라도 신고를 해야 받을 수 있다는 점이 핵심입니다.
      </p>`;
  }

  // 렌즈 C: 사회보험 — 세금 밖에서 함께 늘어나는 부담
  return `
      <h3 style="${H3_STYLE}">세금 밖의 부담 — 프리랜서의 건보·연금</h3>
      <p style="${P_STYLE}">
        종합소득세가 전부는 아닙니다. 프리랜서는 직장가입자가 아니므로 지역가입자 건강보험료와
        국민연금(지역가입)을 별도로 부담하며, 지역 건보료는 이 페이지의 소득금액
        ${formatWon(calc.netIncome)} 같은 소득 자료에 재산·자동차까지 반영해 산정됩니다. 수입 증가는
        이듬해 보험료에 반영되는 시차가 있어 소득이 늘어난 해에는 미리 대비해 둘 필요가 있습니다.
        예상 보험료는
        <a href="/finance/regional-health">지역가입자 건보료 계산기</a>로 미리 확인해 두세요.
      </p>`;
}

// 두 번째 로테이션(홀짝) — 3렌즈와 주기가 달라 인접 페이지에서 두 블록이 동시에 겹치지 않는다
function buildComprehensiveTaxParityBlock(manWon, calc) {
  const index = COMPREHENSIVE_TAX_AMOUNTS.indexOf(manWon);
  const bracket = findIncomeTaxBracket(calc.taxableBase);

  if (index % 2 === 0) {
    // 짝수: 소득공제 400만원 추가 인정 시뮬레이션 (연금보험료 등 전액 공제 항목)
    const reducedBase = Math.max(0, calc.taxableBase - 4_000_000);
    const reducedTotal = comprehensiveTotalTaxOf(reducedBase);
    const reducedBracket = findIncomeTaxBracket(reducedBase);
    return `
      <h3 style="${H3_STYLE}">공제 400만원의 효과 — 이 수입 기준 시뮬레이션</h3>
      <p style="${P_STYLE}">
        국민연금 보험료나 노란우산공제 부금처럼 전액 소득공제되는 항목으로 400만원을 인정받으면,
        과세표준이 ${formatWon(calc.taxableBase)}에서 ${formatWon(reducedBase)}으로 내려가 세금은
        ${formatWon(calc.totalTax)}에서 ${formatWon(reducedTotal)}으로 ${formatWon(calc.totalTax - reducedTotal)}
        줄어듭니다.${
          reducedBracket !== bracket
            ? ` 이 페이지 수입에서는 공제로 과세표준이 ${formatPercent(bracket.rate, 0)} 구간에서
        ${formatPercent(reducedBracket.rate, 0)} 구간으로 내려가는 효과까지 있어 공제 1원의 가치가 특히 큽니다.`
            : ` 한계세율 ${formatPercent(bracket.rate, 0)} 구간에 그대로 머물지만, 공제액에 지방소득세까지
        곱해진 만큼 세금이 줄어드는 구조입니다.`
        }
      </p>`;
  }

  // 홀수: 무신고 가산세 리스크 — 이 페이지 세액 기준 금액 환산
  return `
      <h3 style="${H3_STYLE}">신고를 놓치면 — 이 세액 기준 가산세 환산</h3>
      <p style="${P_STYLE}">
        5월 신고를 하지 않으면 무신고가산세가 납부세액의 20%로 붙습니다. 이 페이지 추정 세액
        ${formatWon(calc.totalTax)} 기준으로 약 ${formatWon(Math.floor(calc.determinedTax * 0.2))}(국세분
        기준)이 더해지는 셈이고, 납부가 늦어지는 기간만큼 납부지연가산세도 별도로 쌓입니다. 환급
        대상이라도 신고를 해야 돌려받으므로, 수입 규모와 무관하게 5월 신고 자체가 최우선입니다.
      </p>`;
}

// 분리과세 임계 — 수치는 src/data/comprehensiveTaxRules.ts 검증 상수의 미러
function buildComprehensiveTaxSeparateSection(calc) {
  const bracket = findIncomeTaxBracket(calc.taxableBase);
  const separateFavorable = bracket.rate > 0.14;
  // 구체 예시: 미등록 임대수입 1,000만원을 얹었을 때 — 분리과세 기본공제(200만원)는
  // "분리과세 임대소득 외 종합소득금액 2,000만원 이하"에서만 적용되어 페이지마다 결론 수치가 갈린다
  const rentalRevenue = 10_000_000;
  const rentalIncome = Math.floor(rentalRevenue * 0.5);
  const rentalBasicDeduction = calc.netIncome <= 20_000_000 ? 2_000_000 : 0;
  const rentalSeparateTax = Math.floor((rentalIncome - rentalBasicDeduction) * 0.14 * 1.1);
  const rentalComprehensiveTax = Math.floor(rentalIncome * bracket.rate * 1.1);
  return `
      <h2 style="${H2_STYLE}">4. 분리과세 선택이 갈리는 임계점</h2>
      <p style="${P_STYLE}">
        종합소득에 합산하지 않고 따로 끝낼 수 있는 소득이 있습니다. 주택임대 수입은 연 2,000만원
        이하일 때 14% 분리과세를 선택할 수 있고(등록임대 소득율 40%·기본공제 400만원, 미등록 50%·
        기본공제 200만원 — 기본공제는 분리과세 임대소득 외 종합소득금액이 2,000만원 이하일 때),
        기타소득은 필요경비 60% 인정 후 소득금액 300만원 이하면 분리과세로 종결할 수 있습니다.
      </p>
      <p style="${P_STYLE}">
        ${
          separateFavorable
            ? `이 페이지 기준 과세표준의 한계세율 ${formatPercent(bracket.rate, 0)}는 분리과세율 14%보다
        높습니다. 임대·기타소득을 종합에 합산하면 그 소득에 ${formatPercent(bracket.rate, 0)} 이상이
        적용되므로, 분리과세 요건이 되는 소득은 분리 선택이 유리할 가능성이 큽니다.`
            : `이 페이지 기준 과세표준의 한계세율 ${formatPercent(bracket.rate, 0)}는 분리과세율 14%보다
        낮습니다. 이 수입 규모에서는 임대·기타소득을 종합과세로 합산하는 쪽이 오히려 세부담이 작을 수
        있으므로, 분리과세가 항상 유리하다고 단정하지 말고 두 방식을 비교해 보세요.`
        }
        정확한 판단은 <a href="/finance/comprehensive-tax">종합소득세 계산기</a>의 분리과세 비교 기능으로
        본인 수치를 넣어 확인할 수 있습니다.
      </p>
      <p style="${P_STYLE}">
        구체 예시로, 이 수입에 미등록 주택임대 수입 1,000만원(소득율 50% → 소득금액 ${formatWon(rentalIncome)})이
        더해진다고 해 보겠습니다. ${
          rentalBasicDeduction > 0
            ? `이 페이지의 사업소득금액 ${formatWon(calc.netIncome)}은 기본공제 요건(2,000만원 이하)을
        충족해 분리과세 시 기본공제 200만원을 뺀 ${formatWon(rentalIncome - rentalBasicDeduction)}에
        14%가 적용되어 약 ${formatWon(rentalSeparateTax)}(지방세 포함)로 끝납니다.`
            : `이 페이지의 사업소득금액 ${formatWon(calc.netIncome)}은 2,000만원을 넘어 분리과세
        기본공제(200만원)를 받을 수 없으므로, ${formatWon(rentalIncome)} 전액에 14%가 적용되어 약
        ${formatWon(rentalSeparateTax)}(지방세 포함)입니다.`
        }
        같은 소득을 종합에 합산하면 한계세율 ${formatPercent(bracket.rate, 0)} 기준 약
        ${formatWon(rentalComprehensiveTax)}이 붙어, 이 경우 ${
          rentalSeparateTax < rentalComprehensiveTax
            ? `분리과세가 약 ${formatWon(rentalComprehensiveTax - rentalSeparateTax)} 유리합니다`
            : `종합과세가 약 ${formatWon(rentalSeparateTax - rentalComprehensiveTax)} 유리합니다`
        }.
      </p>`;
}

// 인접 수입 프리셋 대비 세부담 델타 — 페이지마다 이웃이 달라 표·문장이 함께 달라진다
function buildComprehensiveTaxNeighborSection(manWon, calc) {
  const index = COMPREHENSIVE_TAX_AMOUNTS.indexOf(manWon);
  const neighbors = [
    COMPREHENSIVE_TAX_AMOUNTS[index - 1] ?? null,
    manWon,
    COMPREHENSIVE_TAX_AMOUNTS[index + 1] ?? null,
  ].filter((amount) => amount !== null);

  const rows = neighbors
    .map((amount) => {
      const neighborCalc = amount === manWon ? calc : computeComprehensiveTax(amount * 10_000);
      const isCurrent = amount === manWon;
      const amountCell = isCurrent
        ? `${formatManWonValue(amount)}원 (현재 페이지)`
        : `<a href="/finance/comprehensive-tax/${amount}">${formatManWonValue(amount)}원</a>`;
      const diff = neighborCalc.totalTax - calc.totalTax;
      const diffCell = isCurrent
        ? "기준"
        : `${diff >= 0 ? "+" : "-"}${formatWon(Math.abs(diff))}`;
      return `
          <tr${isCurrent ? ' style="background:hsl(var(--accent));"' : ""}>
            <td style="${TD_STYLE}">${amountCell}</td>
            <td style="${TD_STYLE}">${formatWon(neighborCalc.totalTax)}</td>
            <td style="${TD_STYLE}">${formatPercent(neighborCalc.totalTax / neighborCalc.income)}</td>
            <td style="${TD_STYLE}">${diffCell}</td>
          </tr>`;
    })
    .join("");

  const next = COMPREHENSIVE_TAX_AMOUNTS[index + 1] ?? null;
  const prev = COMPREHENSIVE_TAX_AMOUNTS[index - 1] ?? null;
  const sentences = [];
  if (next) {
    const nextCalc = computeComprehensiveTax(next * 10_000);
    const incomeDelta = (next - manWon) * 10_000;
    const taxDelta = nextCalc.totalTax - calc.totalTax;
    sentences.push(`
        수입이 ${formatManWonValue(next - manWon)}원 늘어 ${formatManWonValue(next)}원이 되면 세금은
        ${formatWon(taxDelta)} 늘어난 ${formatWon(nextCalc.totalTax)}이 됩니다. 늘어난 수입 대비 세부담
        증가율은 ${formatPercent(taxDelta / incomeDelta)}입니다.`);
  }
  if (prev) {
    const prevCalc = computeComprehensiveTax(prev * 10_000);
    sentences.push(`
        반대로 수입이 ${formatManWonValue(prev)}원이었다면 세금은 ${formatWon(prevCalc.totalTax)}으로
        지금보다 ${formatWon(calc.totalTax - prevCalc.totalTax)} 적습니다.`);
  }

  return `
      <h2 style="${H2_STYLE}">5. 인접 수입 구간과의 세부담 비교</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">연 수입</th>
            <th style="${TH_STYLE}">종합소득세 (지방세 포함)</th>
            <th style="${TH_STYLE}">실효세율</th>
            <th style="${TH_STYLE}">이 페이지 대비</th>
          </tr>
        </thead>
        <tbody>${rows}
        </tbody>
      </table>
      <p style="${P_STYLE}">${sentences.map((sentence) => sentence.trim()).join(" ")}</p>`;
}

function buildComprehensiveTaxContent(manWon) {
  const income = manWon * 10_000;
  const calc = computeComprehensiveTax(income);
  const {
    expenses,
    netIncome,
    personalDeduction,
    taxableBase,
    calculatedTax,
    standardCredit,
    determinedTax,
    localTax,
    totalTax,
    withholdingPrepaid,
    refund,
  } = calc;

  const label = formatManWonValue(manWon);

  return `
    <article data-seo-prerender="comprehensive-tax" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/comprehensive-tax" style="color:hsl(var(--muted-foreground));text-decoration:none;">종합소득세 계산기</a>
        &nbsp;›&nbsp;
        수입 ${label}
      </nav>

      <h1 style="${H1_STYLE}">프리랜서 수입 ${label}원 종합소득세 계산 (2026년)</h1>

      <p style="${P_STYLE}">
        프리랜서·개인사업자가 연 수입 <strong>${label}원</strong>을 올렸을 때,
        단순경비율(IT·디자인·작가 등 인적용역 기준: 4천만원 이하 64.1% + 초과분 49.7%) 적용 시 종합소득세는 약
        <strong style="color:hsl(var(--primary));">${formatWon(totalTax)}</strong>(지방소득세 포함)입니다.
        3.3% 원천징수로 미리 납부한 금액이 ${formatWon(withholdingPrepaid)}이라면,
        ${refund >= 0 ? `<strong style="color:hsl(var(--primary));">약 ${formatWon(refund)} 환급</strong>` : `<strong style="color:hsl(var(--destructive));">약 ${formatWon(-refund)} 추가 납부</strong>`}이 예상됩니다.
      </p>

      <p style="${P_STYLE}">
        실제 종합소득세는 업종별 단순경비율·기준경비율, 공제 항목(국민연금·건강보험·노란우산공제·기부금·의료비 등),
        종합소득공제·세액공제 적용 여부에 따라 크게 달라집니다. 본 결과는 인적용역 단순경비율·인적공제 1인 기준의 단순 추정이며,
        정확한 계산은 홈택스 모의계산 또는 세무대리인 상담을 권장합니다.
      </p>

      <h2 style="${H2_STYLE}">1. 계산 과정 요약</h2>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr>
            <td style="${TD_STYLE}">총 수입 금액</td>
            <td style="${TD_STYLE}">${formatWon(income)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">필요 경비 (단순경비율 64.1%/49.7%)</td>
            <td style="${TD_STYLE}">-${formatWon(expenses)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">소득 금액</td>
            <td style="${TD_STYLE}">${formatWon(netIncome)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">종합소득공제 (본인 1인)</td>
            <td style="${TD_STYLE}">-${formatWon(personalDeduction)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">과세표준</td>
            <td style="${TD_STYLE}">${formatWon(taxableBase)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">산출세액 (누진세율)</td>
            <td style="${TD_STYLE}">${formatWon(calculatedTax)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">표준세액공제</td>
            <td style="${TD_STYLE}">-${formatWon(standardCredit)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">지방소득세 (결정세액의 10%)</td>
            <td style="${TD_STYLE}">+${formatWon(localTax)}</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>최종 납부세액</strong></td>
            <td style="${TD_STYLE}"><strong style="color:hsl(var(--primary));">${formatWon(totalTax)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">2. 2026년 종합소득세 누진세율</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">과세표준</th>
            <th style="${TH_STYLE}">세율</th>
            <th style="${TH_STYLE}">누진공제</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="${TD_STYLE}">1,400만원 이하</td><td style="${TD_STYLE}">6%</td><td style="${TD_STYLE}">-</td></tr>
          <tr><td style="${TD_STYLE}">1,400만~5,000만원</td><td style="${TD_STYLE}">15%</td><td style="${TD_STYLE}">126만원</td></tr>
          <tr><td style="${TD_STYLE}">5,000만~8,800만원</td><td style="${TD_STYLE}">24%</td><td style="${TD_STYLE}">576만원</td></tr>
          <tr><td style="${TD_STYLE}">8,800만~1억 5천만원</td><td style="${TD_STYLE}">35%</td><td style="${TD_STYLE}">1,544만원</td></tr>
          <tr><td style="${TD_STYLE}">1억 5천만~3억원</td><td style="${TD_STYLE}">38%</td><td style="${TD_STYLE}">1,994만원</td></tr>
          <tr><td style="${TD_STYLE}">3억~5억원</td><td style="${TD_STYLE}">40%</td><td style="${TD_STYLE}">2,594만원</td></tr>
          <tr><td style="${TD_STYLE}">5억~10억원</td><td style="${TD_STYLE}">42%</td><td style="${TD_STYLE}">3,594만원</td></tr>
          <tr><td style="${TD_STYLE}">10억원 초과</td><td style="${TD_STYLE}">45%</td><td style="${TD_STYLE}">6,594만원</td></tr>
        </tbody>
      </table>
      ${buildComprehensiveTaxBracketSection(label, calc)}
      ${buildComprehensiveTaxAngleBlock(manWon, calc)}
      ${buildComprehensiveTaxParityBlock(manWon, calc)}
      ${buildComprehensiveTaxSeparateSection(calc)}
      ${buildComprehensiveTaxNeighborSection(manWon, calc)}

      <h2 style="${H2_STYLE}">6. 3.3% 원천징수와 종합소득세 관계</h2>
      <p style="${P_STYLE}">
        프리랜서가 수입을 받을 때 지급업체가 3.3%(소득세 3% + 지방소득세 0.3%)를 원천징수합니다.
        이는 종합소득세의 "선납"이며, 5월 종합소득세 신고 시 실제 납부세액과 정산합니다.
      </p>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">수입 ${label}원 × 3.3% = <strong>${formatWon(withholdingPrepaid)}</strong> (이미 선납)</li>
        <li style="${LI_STYLE}">정산 대상 종합소득세: ${formatWon(totalTax)}</li>
        <li style="${LI_STYLE}">차이: ${refund >= 0 ? `환급 ${formatWon(refund)}` : `추납 ${formatWon(-refund)}`}</li>
      </ul>

      <h2 style="${H2_STYLE}">7. 자주 묻는 질문 (FAQ)</h2>

      <h3 style="${H3_STYLE}">Q1. 단순경비율 64.1%는 어떻게 정해지나요?</h3>
      <p style="${P_STYLE}">
        국세청은 업종별로 "단순경비율"과 "기준경비율"을 고시합니다.
        수입금액이 일정 기준 미만(일반적으로 연 7,500만원)이면 단순경비율을 적용할 수 있으며,
        IT·디자인·번역·교육 등 인적용역의 단순경비율은 4천만원 이하분 약 64.1%, 초과분 약 49.7% 수준입니다(국세청 2026 고시).
      </p>

      <h3 style="${H3_STYLE}">Q2. 장부를 쓰면 세금이 줄어드나요?</h3>
      <p style="${P_STYLE}">
        실제 경비가 단순경비율보다 높다면 장부 기장(복식부기)을 통해 실제 경비를 공제받을 수 있습니다.
        수입이 큰 프리랜서일수록 장부 기장이 유리하며, 기장세액공제(20%)도 받을 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q3. 국민연금·건강보험료도 공제되나요?</h3>
      <p style="${P_STYLE}">
        네. 사업소득자가 납부한 국민연금·건강보험료·노란우산공제 부금은 종합소득공제(소득공제) 항목으로 전액 공제됩니다.
        이는 과세표준을 줄이는 효과가 커서 절세의 핵심입니다.
      </p>

      <h3 style="${H3_STYLE}">Q4. 5월에 꼭 신고해야 하나요?</h3>
      <p style="${P_STYLE}">
        프리랜서·개인사업자는 매년 5월 1일~5월 31일 동안 전년도 귀속 종합소득세를 신고해야 합니다.
        무신고 시 무신고가산세 20%와 납부지연가산세가 부과됩니다.
      </p>

      <h3 style="${H3_STYLE}">Q5. 저소득 프리랜서도 세금이 있나요?</h3>
      <p style="${P_STYLE}">
        수입이 낮고 단순경비율을 최대 적용받더라도 과세표준이 0원을 초과하면 6% 최저 세율부터 적용됩니다.
        다만 3.3% 원천징수로 이미 선납한 금액이 산출세액보다 많다면 종합소득세 신고 시 차액을 환급받을 수 있으니
        5월 신고를 반드시 해야 합니다.
      </p>

      <h3 style="${H3_STYLE}">Q6. 수입 ${label}원은 3.3% 떼였으면 끝난 것 아닌가요?</h3>
      <p style="${P_STYLE}">
        아닙니다. 3.3%는 선납일 뿐이고 확정은 5월 신고에서 이뤄집니다. 수입 ${label}원 기준 선납액은
        ${formatWon(withholdingPrepaid)}, 이 페이지 추정 세액은 ${formatWon(totalTax)}이므로
        ${
          refund >= 0
            ? `신고를 해야 차액 약 ${formatWon(refund)}을 환급받습니다. 신고하지 않으면 돌려받을 돈을
        그대로 두는 셈입니다.`
            : `약 ${formatWon(-refund)}을 추가로 납부해야 합니다. 신고를 미루면 무신고가산세까지 붙어
        부담이 커집니다.`
        }
      </p>

      <h2 style="${H2_STYLE}">8. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/freelance-rate">프리랜서 세후 단가 역산</a> - 원천세 제외 실수령</li>
        <li style="${LI_STYLE}"><a href="/finance/withholding">원천세 역산 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a> - 근로소득자</li>
      </ul>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 계산은 인적용역 단순경비율(4천만원 이하 64.1%, 초과분 49.7%)·인적공제 1인 기준 단순 추정이며, 실제 경비율·공제는 업종과 장부 여부에 따라 달라집니다. 정확한 세액은 국세청 홈택스 모의계산 또는 세무대리인 상담이 필요합니다.
      </p>
    </article>`;
}

// =========================
// 이직 연봉 비교 (/compare/:a-vs-:b)
// =========================

// 인상분이 항목별로 어디로 가는지 분해 — 쌍마다 금액·비중이 모두 달라진다
function buildCompareBreakdownSection(a, b) {
  const monthlyGrossDiff = b.monthlyGross - a.monthlyGross;
  const annualGrossDiff = monthlyGrossDiff * 12;
  const rows = [
    ["국민연금 (4.75%)", (b.nationalPension - a.nationalPension) * 12],
    ["건강보험+장기요양", (b.healthInsurance + b.longTermCare - a.healthInsurance - a.longTermCare) * 12],
    ["고용보험 (0.9%)", (b.employmentInsurance - a.employmentInsurance) * 12],
    ["소득세+지방소득세", (b.totalTax - a.totalTax) * 12],
    ["실수령 증가 (통장에 남는 몫)", (b.monthlyNet - a.monthlyNet) * 12],
  ];

  const rowsHtml = rows
    .map(([label, amount], index) => {
      const isNet = index === rows.length - 1;
      const share = annualGrossDiff > 0 ? formatPercent(amount / annualGrossDiff) : "-";
      return `
          <tr${isNet ? ' style="background:hsl(var(--accent));"' : ""}>
            <td style="${TD_STYLE}">${isNet ? `<strong>${label}</strong>` : label}</td>
            <td style="${TD_STYLE}">${isNet ? "+" : "-"}${formatWon(amount)}</td>
            <td style="${TD_STYLE}">${share}</td>
          </tr>`;
    })
    .join("");

  return `
      <h2 style="${H2_STYLE}">2. 인상분 ${formatWon(annualGrossDiff)}은 어디로 가나</h2>
      <p style="${P_STYLE}">
        월 세전 증가분 ${formatWon(monthlyGrossDiff)}(연 ${formatWon(annualGrossDiff)})을 공제 항목별로
        분해한 표입니다. 어느 항목이 인상분을 얼마나 가져가는지 비중으로 확인할 수 있습니다.
      </p>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">항목</th>
            <th style="${TH_STYLE}">연간 증가액</th>
            <th style="${TH_STYLE}">인상분 대비 비중</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}
        </tbody>
      </table>`;
}

// 국민연금 상한·소득세 구간 통과 여부 — 이 쌍이 제도 경계선을 건너는지 판정
function buildCompareThresholdSection(bManWon, a, b) {
  const paragraphs = [];

  const aCapped = a.taxableMonthly >= PENSION_CAP_TAXABLE;
  const bCapped = b.taxableMonthly >= PENSION_CAP_TAXABLE;
  if (!aCapped && !bCapped) {
    paragraphs.push(`
      두 연봉 모두 보수월액(A ${formatWon(a.taxableMonthly)}, B ${formatWon(b.taxableMonthly)})이 국민연금
      기준소득월액 상한 ${formatWon(PENSION_CAP_TAXABLE)} 아래입니다. 이 구간에서는 국민연금도 인상분에
      4.75%로 비례해 월 ${formatWon(b.nationalPension - a.nationalPension)} 늘어나며, 상한까지는 보수월액
      기준 ${formatWon(PENSION_CAP_TAXABLE - b.taxableMonthly)} 여유가 있습니다.`);
  } else if (!aCapped && bCapped) {
    paragraphs.push(`
      이 쌍은 국민연금 상한선을 건넙니다. 연봉 ${formatManWonValue(bManWon)}의 보수월액
      ${formatWon(b.taxableMonthly)}은 기준소득월액 상한 ${formatWon(PENSION_CAP_TAXABLE)}을 넘어 국민연금이
      ${formatWon(PENSION_CAP_DEDUCTION)}에 고정됩니다. 상한 초과분에는 연금 보험료가 붙지 않으므로,
      이후 인상부터는 건강보험·소득세만 늘어나 체감 유지율이 소폭 개선되는 효과가 있습니다.`);
  } else {
    paragraphs.push(`
      두 연봉 모두 보수월액이 국민연금 상한 ${formatWon(PENSION_CAP_TAXABLE)}을 넘어, 국민연금은 양쪽 다
      ${formatWon(PENSION_CAP_DEDUCTION)}으로 동일합니다. 인상분에 연금 부담 증가가 없는 구간입니다.`);
  }

  const aBracket = findIncomeTaxBracket(a.taxableBase);
  const bBracket = findIncomeTaxBracket(b.taxableBase);
  if (aBracket === bBracket) {
    const nextBracket = INCOME_TAX_BRACKETS[INCOME_TAX_BRACKETS.indexOf(bBracket) + 1] ?? null;
    paragraphs.push(`
      소득세는 두 연봉 모두 과세표준 ${incomeTaxBracketLabel(bBracket)} 구간(세율
      ${formatPercent(bBracket.rate, 0)})에 머뭅니다(A ${formatWon(a.taxableBase)} → B
      ${formatWon(b.taxableBase)}).${
        nextBracket
          ? ` 다음 구간(${formatPercent(nextBracket.rate, 0)})까지는 과세표준 기준
      ${formatWon(bBracket.limit - b.taxableBase)} 남았습니다.`
          : ""
      }`);
  } else {
    paragraphs.push(`
      이 쌍은 소득세 구간도 건너갑니다. 과세표준이 A ${formatWon(a.taxableBase)}
      (${formatPercent(aBracket.rate, 0)} 구간)에서 B ${formatWon(b.taxableBase)}
      (${formatPercent(bBracket.rate, 0)} 구간)로 올라가, 인상분 일부에 더 높은 세율이 적용됩니다.
      유지율이 다른 쌍보다 낮게 나오는 주된 이유입니다.`);
  }

  paragraphs.push(`
      건강보험은 구간 없이 보수월액에 3.595% 정률이라, 인상분에 대해 월
      ${formatWon(b.healthInsurance - a.healthInsurance)}이 그대로 비례해 늘어납니다(장기요양보험은 그
      건보료의 13.14%가 추가).`);

  return `
      <h2 style="${H2_STYLE}">3. 이 쌍이 건너는 경계선 — 연금 상한·세율 구간</h2>
      ${paragraphs.map((body) => `<p style="${P_STYLE}">${body.trim()}</p>`).join("\n      ")}`;
}

// 협상 관점 — 세전/세후 인상률 괴리와 목표 실수령 역산
function buildCompareNegotiationSection(bManWon, a, b) {
  const grossDiff = b.grossAnnual - a.grossAnnual;
  const netAnnualDiff = b.annualNet - a.annualNet;
  const grossRaiseRate = grossDiff / a.grossAnnual;
  const netRaiseRate = netAnnualDiff / a.annualNet;
  const retention = grossDiff > 0 ? netAnnualDiff / grossDiff : 0;
  const grossNeededPerNet100k = retention > 0 ? Math.round(1_200_000 / retention) : 0;

  return `
      <h2 style="${H2_STYLE}">4. 협상 테이블에서 쓰는 법</h2>
      <p style="${P_STYLE}">
        제안서의 ${formatManWonValue(bManWon)}은 세전 기준 ${formatPercent(grossRaiseRate)} 인상이지만,
        통장 기준으로는 ${formatPercent(netRaiseRate)} 인상입니다. 협상에서는 이 괴리를 근거로 쓸 수
        있습니다. 예컨대 월 실수령을 10만원 더 늘리려면 이 구간 유지율(${formatPercent(retention)})
        기준으로 세전 연봉을 약 ${formatWon(grossNeededPerNet100k)} 더 올려 받아야 합니다.
        기본급 인상 여지가 막혔다면 비과세 항목(식대·자가운전보조금)이나 퇴직연금 매칭처럼 공제가
        붙지 않는 보상을 대안으로 요구하는 편이 유지율 면에서 유리합니다.
      </p>`;
}

// 페이지별 추가 분석 렌즈 — 쌍 인덱스 로테이션으로 인접 비교 페이지의 문단 반복을 막는다
function buildCompareAngleBlock(aManWon, bManWon, a, b) {
  const index = COMPARE_PAIRS.findIndex(([pa, pb]) => pa === aManWon && pb === bManWon);
  const angle = ((index % 3) + 3) % 3;
  const grossDiff = b.grossAnnual - a.grossAnnual;

  if (angle === 0) {
    // 렌즈 A: 부양가족 2인 기준 재계산 — 가구 조건이 유지율을 얼마나 바꾸나
    const a2 = calculateSalaryBreakdown({
      grossAnnual: a.grossAnnual,
      nonTaxableMonthly: 200_000,
      dependents: 2,
      children: 0,
      retirementIncluded: false,
    });
    const b2 = calculateSalaryBreakdown({
      grossAnnual: b.grossAnnual,
      nonTaxableMonthly: 200_000,
      dependents: 2,
      children: 0,
      retirementIncluded: false,
    });
    const netDiff2 = b2.annualNet - a2.annualNet;
    return `
      <h3 style="${H3_STYLE}">부양가족 2인이라면 — 같은 이직, 다른 유지율</h3>
      <p style="${P_STYLE}">
        위 표는 부양가족 1인(본인) 기준입니다. 배우자를 포함해 부양가족 2인으로 다시 계산하면 월 실수령은
        A ${formatWon(a2.monthlyNet)} → B ${formatWon(b2.monthlyNet)}, 연간 실수령 증가는
        ${formatWon(netDiff2)}(유지율 ${formatPercent(netDiff2 / grossDiff)})입니다. 인적공제가 늘어
        양쪽 세금이 함께 줄기 때문에 절대 실수령은 커지고, 유지율은 소폭 달라집니다. 가구 조건을 바꾼
        비교는 <a href="/finance/compare">비교 계산기</a>에서 직접 입력해 확인하세요.
      </p>`;
  }

  if (angle === 1) {
    // 렌즈 B: 하루·한 달 단위 환산 — 인상분의 체감 크기
    const netAnnualDiff = b.annualNet - a.annualNet;
    const perDay = Math.floor(netAnnualDiff / 365);
    const monthlyGrossDiff = b.monthlyGross - a.monthlyGross;
    return `
      <h3 style="${H3_STYLE}">체감 크기로 환산하면 — 하루 ${formatWon(perDay)}</h3>
      <p style="${P_STYLE}">
        연간 실수령 증가 ${formatWon(netAnnualDiff)}을 일상 단위로 나누면 하루 ${formatWon(perDay)},
        한 달 ${formatWon(b.monthlyNet - a.monthlyNet)}입니다. 세전으로는 월 ${formatWon(monthlyGrossDiff)}이
        오르지만 통장에서 체감하는 변화는 이 숫자입니다. 이직에 드는 비용(공백기, 통근 변화, 복지 차이)을
        하루 단위 증가분과 견줘 보면 제안의 실질 가치를 판단하기 쉬워집니다.
      </p>`;
  }

  // 렌즈 C: 역제안 시뮬레이션 — 500만원을 더 받아내면
  const bPlus = calculateSalaryBreakdown({
    grossAnnual: b.grossAnnual + 5_000_000,
    nonTaxableMonthly: 200_000,
    dependents: 1,
    children: 0,
    retirementIncluded: false,
  });
  return `
      <h3 style="${H3_STYLE}">역제안 시뮬레이션 — ${formatManWonValue(bManWon + 500)}을 부르면</h3>
      <p style="${P_STYLE}">
        제안 ${formatManWonValue(bManWon)}에서 500만원을 더 받아 ${formatManWonValue(bManWon + 500)}이
        되면 월 실수령은 ${formatWon(b.monthlyNet)}에서 ${formatWon(bPlus.monthlyNet)}으로
        ${formatWon(bPlus.monthlyNet - b.monthlyNet)} 더 늘어납니다. 추가 500만원의 유지율은
        ${formatPercent((bPlus.annualNet - b.annualNet) / 5_000_000)}로, 협상 여지가 있다면 세전 숫자보다
        이 실수령 증가분을 기준으로 판단하는 것이 정확합니다.
      </p>`;
}

function buildCompareContent(aManWon, bManWon) {
  const aGross = aManWon * 10_000;
  const bGross = bManWon * 10_000;

  const a = calculateSalaryBreakdown({
    grossAnnual: aGross,
    nonTaxableMonthly: 200_000,
    dependents: 1,
    children: 0,
    retirementIncluded: false,
  });
  const b = calculateSalaryBreakdown({
    grossAnnual: bGross,
    nonTaxableMonthly: 200_000,
    dependents: 1,
    children: 0,
    retirementIncluded: false,
  });

  const grossDiff = bGross - aGross;
  const netDiff = b.monthlyNet - a.monthlyNet;
  const netAnnualDiff = b.annualNet - a.annualNet;
  const retentionRate = grossDiff !== 0 ? (netAnnualDiff / grossDiff) * 100 : 0;

  return `
    <article data-seo-prerender="compare" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/compare" style="color:hsl(var(--muted-foreground));text-decoration:none;">이직 연봉 비교</a>
        &nbsp;›&nbsp;
        ${aManWon.toLocaleString("ko-KR")} vs ${bManWon.toLocaleString("ko-KR")}
      </nav>

      <h1 style="${H1_STYLE}">연봉 ${formatManWonValue(aManWon)} vs ${formatManWonValue(bManWon)} 실수령 비교 (2026)</h1>

      <p style="${P_STYLE}">
        연봉 ${formatManWonValue(aManWon)}에서 ${formatManWonValue(bManWon)}으로 이직(또는 인상) 시
        세전 연봉은 <strong>${formatWon(grossDiff)}</strong> 증가하지만,
        실제 월 실수령액 증가는 <strong style="color:hsl(var(--primary));">${formatWon(netDiff)}</strong>,
        연간 실수령 증가는 <strong>${formatWon(netAnnualDiff)}</strong>입니다.
        즉, 연봉 인상분의 약 <strong>${retentionRate.toFixed(1)}%</strong>만 실제 통장에 남습니다.
      </p>

      <p style="${P_STYLE}">
        이는 소득세가 누진세율(6~45%)로 증가분에 더 높은 세율이 적용되고, 4대보험도 비례 증가하기 때문입니다.
        이직 시 세전 연봉만이 아니라 실수령액 기준으로 비교해야 정확한 경제적 효과를 판단할 수 있습니다.
      </p>

      <h2 style="${H2_STYLE}">1. 월 실수령 비교</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">항목</th>
            <th style="${TH_STYLE}">A: 연봉 ${formatManWonValue(aManWon)}</th>
            <th style="${TH_STYLE}">B: 연봉 ${formatManWonValue(bManWon)}</th>
            <th style="${TH_STYLE}">차이</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">월 세전 급여</td>
            <td style="${TD_STYLE}">${formatWon(a.monthlyGross)}</td>
            <td style="${TD_STYLE}">${formatWon(b.monthlyGross)}</td>
            <td style="${TD_STYLE}">+${formatWon(b.monthlyGross - a.monthlyGross)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">4대보험</td>
            <td style="${TD_STYLE}">-${formatWon(a.totalInsurance)}</td>
            <td style="${TD_STYLE}">-${formatWon(b.totalInsurance)}</td>
            <td style="${TD_STYLE}">-${formatWon(b.totalInsurance - a.totalInsurance)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">소득세+지방세</td>
            <td style="${TD_STYLE}">-${formatWon(a.totalTax)}</td>
            <td style="${TD_STYLE}">-${formatWon(b.totalTax)}</td>
            <td style="${TD_STYLE}">-${formatWon(b.totalTax - a.totalTax)}</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>월 실수령</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(a.monthlyNet)}</strong></td>
            <td style="${TD_STYLE}"><strong style="color:hsl(var(--primary));">${formatWon(b.monthlyNet)}</strong></td>
            <td style="${TD_STYLE}"><strong>+${formatWon(netDiff)}</strong></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">연간 실수령</td>
            <td style="${TD_STYLE}">${formatWon(a.annualNet)}</td>
            <td style="${TD_STYLE}">${formatWon(b.annualNet)}</td>
            <td style="${TD_STYLE}"><strong>+${formatWon(netAnnualDiff)}</strong></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">실효세율</td>
            <td style="${TD_STYLE}">${formatPercent(a.effectiveTaxRate)}</td>
            <td style="${TD_STYLE}">${formatPercent(b.effectiveTaxRate)}</td>
            <td style="${TD_STYLE}">+${((b.effectiveTaxRate - a.effectiveTaxRate) * 100).toFixed(2)}%p</td>
          </tr>
        </tbody>
      </table>

      <div style="${CALLOUT_STYLE}">
        <strong>핵심 지표 — 인상분 유지율</strong><br>
        세전 인상 ${formatWon(grossDiff)} 중 실제 실수령 증가는 ${formatWon(netAnnualDiff)} → 유지율 <strong>${retentionRate.toFixed(1)}%</strong>.
        연봉 구간이 높아질수록 누진세율로 인해 유지율이 점점 떨어집니다.
      </div>
      ${buildCompareBreakdownSection(a, b)}
      ${buildCompareThresholdSection(bManWon, a, b)}
      ${buildCompareNegotiationSection(bManWon, a, b)}
      ${buildCompareAngleBlock(aManWon, bManWon, a, b)}

      <h2 style="${H2_STYLE}">5. 이직 시 체크리스트</h2>
      <p style="${P_STYLE}">
        실수령 기준 비교 외에도 이직 전에 반드시 확인해야 할 항목이 있습니다.
      </p>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>상여금 구조</strong>: 기본급 vs 성과급 비율 (성과급이 많으면 보장성이 낮음)</li>
        <li style="${LI_STYLE}"><strong>퇴직금 포함 여부</strong>: "퇴직금 별도"와 "퇴직금 포함" 연봉은 약 8% 차이</li>
        <li style="${LI_STYLE}"><strong>비과세 항목</strong>: 식대·자가운전보조금·연구활동비 등은 4대보험·세금이 면제</li>
        <li style="${LI_STYLE}"><strong>복리후생</strong>: 점심 제공, 교통비 지원, 주택·교육비 지원 등</li>
        <li style="${LI_STYLE}"><strong>연차·휴가</strong>: 연 휴가 일수와 장기근속자 특별휴가</li>
        <li style="${LI_STYLE}"><strong>퇴직금 지급 방식</strong>: IRP 강제 가입, DC형, DB형</li>
      </ul>

      <h2 style="${H2_STYLE}">6. 자주 묻는 질문 (FAQ)</h2>

      <h3 style="${H3_STYLE}">Q1. 연봉이 ${formatWon(grossDiff)} 오르는데 왜 실수령은 ${formatWon(netAnnualDiff)}만 오르나요?</h3>
      <p style="${P_STYLE}">
        소득세 누진세율 구조 때문입니다. 연봉이 오를수록 증가분에 더 높은 세율이 적용되며,
        4대보험도 비례 증가합니다. 연봉 구간이 ${formatManWonValue(aManWon)}에서 ${formatManWonValue(bManWon)}으로 올라가면서
        한계세율(증가분에 적용되는 세율)이 약 ${(((b.determinedTax - a.determinedTax) / grossDiff) * 100).toFixed(1)}% 수준으로 적용됩니다.
      </p>

      <h3 style="${H3_STYLE}">Q2. 이직 시 퇴직금이 손해인가요?</h3>
      <p style="${P_STYLE}">
        중간 정산은 퇴직금 누적 기회를 잃는 손실입니다. 장기 근속 시 퇴직금은 평균임금 기준으로 산정되어
        마지막 연도 급여가 높을수록 퇴직금도 높아지기 때문에, 이직이 잦으면 퇴직금 복리효과를 잃을 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q3. 연봉 협상 시 ${formatManWonValue(bManWon)}이 한계인가요?</h3>
      <p style="${P_STYLE}">
        연봉 협상에서는 "타겟 연봉 - 10%" 수준부터 시작하는 것이 일반적입니다.
        ${formatManWonValue(bManWon)}을 원한다면 시작 제안을 ${formatManWonValue(Math.round(bManWon * 1.1))}으로 하는 것이 효과적입니다.
      </p>

      <h2 style="${H2_STYLE}">7. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/raise">연봉 인상률 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/bonus">성과급 실수령 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/quit">퇴사 계산기</a> - 이직 준비 시 참고</li>
      </ul>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 2026년 세율·요율 기준 추정치이며, 실제 급여명세와 차이가 있을 수 있습니다.
      </p>
    </article>`;
}

// =========================
// 퇴사 시뮬레이션 (/quit/:years years)
// =========================
function buildQuitContent(years) {
  // 가정: 평균 월급 300만원, 평균임금 330만원(상여금 포함 1.1배), 3개월 생존비 200만원/월
  // 퇴직금·실업급여 모두 /severance-pay·/unemployment와 같은 공용 산식을 쓴다 — 퇴사 시뮬레이션이
  // 개별 계산기와 다른 금액을 내면 사용자는 어느 쪽을 믿어야 할지 알 수 없다.
  const { avgWage, severance: severancePay } = severancePayEstimate(years);
  const { avgDailyWage: dailyWage, dailyAmount: unemploymentDaily } =
    unemploymentDailyAllowance(avgWage);
  // 나이·가입기간별 수급일수 (40세 미만·가입 3~5년 = 180일 가정)
  let totalDays = 120;
  if (years >= 5 && years < 10) totalDays = 210;
  else if (years >= 10) totalDays = 240;
  else if (years >= 3) totalDays = 180;
  else if (years >= 1) totalDays = 150;
  const unemploymentTotal = unemploymentDaily * totalDays;

  // 생존기간: (퇴직금 + 실업급여) ÷ 월 200만원 생활비
  const monthlyLiving = 2_000_000;
  const survivalMonths = Math.floor((severancePay + unemploymentTotal) / monthlyLiving);

  return `
    <article data-seo-prerender="quit" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/quit" style="color:hsl(var(--muted-foreground));text-decoration:none;">퇴사 계산기</a>
        &nbsp;›&nbsp;
        ${years}년 근속
      </nav>

      <h1 style="${H1_STYLE}">${years}년 근속 퇴사 시뮬레이션 (2026년 기준)</h1>

      <p style="${P_STYLE}">
        평균 월급 300만원 기준으로 <strong>${years}년 근속</strong> 후 퇴사하면,
        예상 퇴직금은 <strong style="color:hsl(var(--primary));">약 ${formatWon(severancePay)}</strong>,
        실업급여 총액은 <strong>약 ${formatWon(unemploymentTotal)}</strong>(${totalDays}일간)이며,
        월 200만원 생활비 기준 <strong>약 ${survivalMonths}개월</strong>의 생존 기간을 확보할 수 있습니다.
      </p>

      <p style="${P_STYLE}">
        퇴사는 경제적 준비뿐만 아니라 건강보험(지역가입자 전환) · 국민연금 · 경력 단절 리스크를 종합 고려해야 합니다.
        아래에서 퇴직금 계산 공식, 실업급여 수급 조건, 퇴사 전 체크리스트를 확인하세요.
      </p>

      <h2 style="${H2_STYLE}">1. 퇴사 재무 시뮬레이션 요약</h2>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr>
            <td style="${TD_STYLE}">근속연수</td>
            <td style="${TD_STYLE}">${years}년</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">가정 월 급여 (3개월 평균)</td>
            <td style="${TD_STYLE}">${formatWon(SEVERANCE_ASSUMED_MONTHLY)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">평균임금 (상여금 포함 1.1배)</td>
            <td style="${TD_STYLE}">${formatWon(avgWage)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">예상 퇴직금 (퇴직소득세 전)</td>
            <td style="${TD_STYLE}">${formatWon(severancePay)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">실업급여 일액 (상한 68,100원)</td>
            <td style="${TD_STYLE}">${formatWon(unemploymentDaily)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">수급 일수</td>
            <td style="${TD_STYLE}">${totalDays}일</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">실업급여 총액</td>
            <td style="${TD_STYLE}">${formatWon(unemploymentTotal)}</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>총 재원 (퇴직금 + 실업급여)</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(severancePay + unemploymentTotal)}</strong></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">월 200만원 기준 생존 기간</td>
            <td style="${TD_STYLE}"><strong>${survivalMonths}개월</strong></td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">2. 퇴직금 계산 공식 (근로자퇴직급여보장법)</h2>
      <p style="${P_STYLE}">
        퇴직금은 다음 공식으로 계산합니다.
      </p>
      <div style="${CALLOUT_STYLE}">
        <strong>퇴직금 = 1일 평균임금 × 30일 × (근속일수 ÷ 365)</strong><br>
        평균임금 = 퇴직일 이전 3개월 총 임금 ÷ 해당 기간 총 일수<br>
        ※ 상여금·연차수당은 연 단위로 안분하여 포함
      </div>
      <p style="${P_STYLE}">
        근속 ${years}년 × 평균임금 ${formatWon(avgWage)} = 약 ${formatWon(severancePay)}이 예상 퇴직금이며,
        실제 수령액은 근속연수에 따른 퇴직소득세를 공제한 후 확정됩니다.
      </p>

      <h2 style="${H2_STYLE}">3. 실업급여 수급 조건 (2026년)</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>가입 기간</strong>: 이직일 이전 18개월 중 180일 이상 고용보험 피보험 자격 보유</li>
        <li style="${LI_STYLE}"><strong>이직 사유</strong>: 권고사직·계약만료·임신·출산·부당대우 등 비자발적 사유 (자발적 이직은 원칙적 불가)</li>
        <li style="${LI_STYLE}"><strong>재취업 의사</strong>: 적극적 구직활동 의사와 능력 있어야 함</li>
        <li style="${LI_STYLE}"><strong>수급액</strong>: 이직 전 평균임금의 60% (하한 66,048원/일, 상한 68,100원/일)</li>
        <li style="${LI_STYLE}"><strong>수급 기간</strong>: 나이·가입기간에 따라 120~270일</li>
      </ul>

      <h2 style="${H2_STYLE}">4. 퇴사 전 체크리스트</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">비상금 <strong>6개월치 생활비</strong> 이상 확보</li>
        <li style="${LI_STYLE}">건강보험 지역가입자 전환 예상 금액 확인 (임의계속가입 또는 피부양자 등록 검토)</li>
        <li style="${LI_STYLE}">국민연금 납부 중단 기간 영향 평가 (임의가입·임의계속가입 선택 가능)</li>
        <li style="${LI_STYLE}">이직 사유가 실업급여 수급 요건을 충족하는지 확인 (권고사직·계약만료 등)</li>
        <li style="${LI_STYLE}">연차수당·상여금 정산 및 4대보험 상실신고 확인</li>
        <li style="${LI_STYLE}">퇴직연금(DC형/DB형/IRP) 수령 방식 결정 - IRP 이체 시 세금 이연 가능</li>
        <li style="${LI_STYLE}">건강검진·치과·안과 등 회사 지원 복지 이용 마무리</li>
      </ul>

      <h2 style="${H2_STYLE}">5. 자주 묻는 질문 (FAQ)</h2>

      <h3 style="${H3_STYLE}">Q1. 자발적 퇴사도 실업급여를 받을 수 있나요?</h3>
      <p style="${P_STYLE}">
        원칙적으로 자발적 이직은 실업급여 대상이 아니지만, 이직 전 1년 이내 2개월 이상 임금체불, 사업장 이전, 부당대우,
        질병·가족간병 등 정당한 사유가 있으면 예외적으로 인정됩니다.
      </p>

      <h3 style="${H3_STYLE}">Q2. 퇴직금과 실업급여를 동시에 받을 수 있나요?</h3>
      <p style="${P_STYLE}">
        네. 퇴직금은 근로기준법상 퇴직급여이고, 실업급여는 고용보험법상 구직급여이므로 별개입니다.
        다만 퇴직금을 한 번에 수령한 경우 실업급여 수급에 영향이 없습니다.
      </p>

      <h3 style="${H3_STYLE}">Q3. 퇴직소득세는 얼마나 나오나요?</h3>
      <p style="${P_STYLE}">
        퇴직소득세는 근속연수에 따른 공제(12년 초과 시 크게 감면)와 연분연승법(연평균 과세표준 × 12)으로 계산됩니다.
        근속 ${years}년 기준 퇴직금 ${formatWon(severancePay)}의 퇴직소득세는 약 ${formatWon(Math.floor(severancePay * 0.03))}
        수준(근속이 길수록 낮음)이며, 정확한 계산은 <a href="/finance/severance-pay">퇴직금 계산기</a>를 이용하세요.
      </p>

      <h3 style="${H3_STYLE}">Q4. 퇴사 후 건강보험은 어떻게 되나요?</h3>
      <p style="${P_STYLE}">
        퇴사 다음 달부터 지역가입자로 자동 전환되며, 소득·재산에 따라 보험료가 산정됩니다.
        부담이 큰 경우 "임의계속가입"(최대 36개월 직장 요율 유지) 또는 "피부양자 등록"(배우자·자녀가 직장가입자일 때)을 선택할 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q5. ${years}년 근속이면 자발적 이직도 손해인가요?</h3>
      <p style="${P_STYLE}">
        ${years}년 근속이면 퇴직금이 약 ${formatWon(severancePay)}으로 적지 않지만,
        자발적 이직 시 실업급여 ${formatWon(unemploymentTotal)}을 받지 못해 총 재원이 퇴직금만 남습니다.
        가능하면 권고사직·계약만료 등으로 처리해 실업급여도 함께 받는 것이 경제적으로 유리합니다.
      </p>

      <h2 style="${H2_STYLE}">6. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/severance-pay">퇴직금 계산기</a> - 퇴직소득세 포함</li>
        <li style="${LI_STYLE}"><a href="/finance/unemployment">실업급여 계산기</a> - 월급별 수급액</li>
        <li style="${LI_STYLE}"><a href="/finance/regional-health">지역가입자 건보료 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a> - 재취업 시 참고</li>
      </ul>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 시뮬레이션은 평균 월급 300만원·표준 수급일수 가정의 추정이며, 실제 퇴직금·실업급여는 근로계약·이직사유·나이 등에 따라 달라집니다.
      </p>
    </article>`;
}

// =========================
// 실업급여 (/unemployment/:manWon)
// =========================
function buildUnemploymentContent(manWon) {
  const monthly = manWon * 10_000;
  const { rawDaily, dailyAmount } = unemploymentDailyAllowance(monthly);
  // 시나리오: 40세 미만, 가입 3년 미만 = 120일
  const scenarios = [
    { label: "50세 미만, 가입 1년 미만", days: 120 },
    { label: "50세 미만, 가입 3년 미만", days: 150 },
    { label: "50세 미만, 가입 5년 미만", days: 180 },
    { label: "50세 미만, 가입 10년 미만", days: 210 },
    { label: "50세 이상, 가입 10년 이상", days: 270 },
  ];

  return `
    <article data-seo-prerender="unemployment" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/unemployment" style="color:hsl(var(--muted-foreground));text-decoration:none;">실업급여 계산기</a>
        &nbsp;›&nbsp;
        월급 ${formatManWonValue(manWon)}
      </nav>

      <h1 style="${H1_STYLE}">월급 ${formatManWonValue(manWon)}원 실업급여 (2026년 구직급여)</h1>

      <p style="${P_STYLE}">
        월급 <strong>${formatManWonValue(manWon)}원</strong> 기준으로 실업급여(구직급여)의 일 수급액은
        평균임금의 60%인 <strong>${formatWon(rawDaily)}</strong>이지만, 2026년 고시 상한액 68,100원과 하한액 66,048원이 적용되어
        실제 수급액은 <strong style="color:hsl(var(--primary));">${formatWon(dailyAmount)}/일</strong>입니다.
      </p>

      <p style="${P_STYLE}">
        수급 가능 일수는 나이와 고용보험 가입 기간에 따라 120일(4개월)부터 최대 270일(9개월)까지 차등 적용됩니다.
        아래 표에서 본인의 상황에 맞는 총 수급액을 확인하세요.
      </p>

      <h2 style="${H2_STYLE}">1. 수급 일수별 실업급여 총액</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">구분</th>
            <th style="${TH_STYLE}">수급일수</th>
            <th style="${TH_STYLE}">총 수급액</th>
          </tr>
        </thead>
        <tbody>
          ${scenarios
            .map(
              (s) =>
                `<tr><td style="${TD_STYLE}">${s.label}</td><td style="${TD_STYLE}">${s.days}일</td><td style="${TD_STYLE}">${formatWon(dailyAmount * s.days)}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">2. 2026년 실업급여 상·하한액</h2>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr>
            <td style="${TD_STYLE}">일 상한액</td>
            <td style="${TD_STYLE}">68,100원</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">일 하한액 (최저임금 80%)</td>
            <td style="${TD_STYLE}">66,048원</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">원칙</td>
            <td style="${TD_STYLE}">평균임금 × 60%</td>
          </tr>
        </tbody>
      </table>

      <div style="${CALLOUT_STYLE}">
        <strong>2026년 실업급여 인상</strong> — 상한액이 6년 만에 66,000원 → 68,100원으로 인상되었습니다.
        월 기준 최대 수급액은 약 204만원입니다.
      </div>

      <h2 style="${H2_STYLE}">3. 실업급여 수급 조건</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">이직일 이전 18개월 동안 피보험 단위기간 <strong>180일 이상</strong></li>
        <li style="${LI_STYLE}">근로 의사와 능력이 있음에도 취업하지 못한 상태</li>
        <li style="${LI_STYLE}">이직 사유가 권고사직·계약만료·임금체불·사업장 이전 등 <strong>정당한 사유</strong></li>
        <li style="${LI_STYLE}">적극적 구직활동 수행 (2주에 1회 이상 구직활동 증명)</li>
        <li style="${LI_STYLE}">고용센터에 수급자격 신청 및 구직등록</li>
      </ul>

      <h2 style="${H2_STYLE}">4. 신청 절차</h2>
      <ol style="${UL_STYLE}">
        <li style="${LI_STYLE}">퇴사 직후 회사에서 "이직확인서" 발급 요청</li>
        <li style="${LI_STYLE}">워크넷(work.go.kr) 구직등록</li>
        <li style="${LI_STYLE}">거주지 관할 고용센터 방문 또는 온라인 수급자격 신청</li>
        <li style="${LI_STYLE}">수급자격 인정 교육(1~2회) 이수</li>
        <li style="${LI_STYLE}">첫 실업인정일 방문, 이후 1~4주 단위로 실업인정</li>
        <li style="${LI_STYLE}">지정 계좌로 구직급여 지급</li>
      </ol>

      <h2 style="${H2_STYLE}">5. 자주 묻는 질문 (FAQ)</h2>

      <h3 style="${H3_STYLE}">Q1. 월급 ${formatManWonValue(manWon)}원인데 왜 상한액 68,100원만 받나요?</h3>
      <p style="${P_STYLE}">
        실업급여는 월급이 높아도 일 상한액 68,100원(월 약 204만원)을 초과할 수 없습니다.
        이는 실업급여의 취지(생계 유지 + 재취업 유도)를 고려한 정책적 상한선입니다.
      </p>

      <h3 style="${H3_STYLE}">Q2. 실업급여 수급 중 알바해도 되나요?</h3>
      <p style="${P_STYLE}">
        일부 가능합니다. 주 15시간 미만 소정근로 또는 일용직은 소득 신고 후 수급액 조정을 받을 수 있습니다.
        단, 신고 없이 일하면 부정수급으로 2배 이상 반환 + 형사처벌 대상이 됩니다.
      </p>

      <h3 style="${H3_STYLE}">Q3. 실업급여 기간 중 재취업하면?</h3>
      <p style="${P_STYLE}">
        조기재취업수당을 받을 수 있습니다. 수급일수의 절반 이상 남긴 상태에서 재취업해 12개월 이상 계속 근무하면
        남은 구직급여의 50%를 일시금으로 받을 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q4. 실업급여 받는 동안 건강보험은?</h3>
      <p style="${P_STYLE}">
        퇴사 즉시 지역가입자로 전환되지만, 구직급여 수급 기간에도 보험료는 부과됩니다.
        소득·재산이 적으면 월 2~3만원 수준이지만, 재산이 많으면 부담이 클 수 있어 임의계속가입 검토를 권합니다.
      </p>

      <h3 style="${H3_STYLE}">Q5. 실업급여도 세금이 부과되나요?</h3>
      <p style="${P_STYLE}">
        아니오. 실업급여는 소득세법상 비과세 소득이므로 소득세·지방소득세가 부과되지 않습니다.
      </p>

      <h2 style="${H2_STYLE}">6. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/quit">퇴사 계산기</a> - 종합 시뮬레이션</li>
        <li style="${LI_STYLE}"><a href="/finance/severance-pay">퇴직금 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/regional-health">지역가입자 건보료 계산기</a></li>
      </ul>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 고용노동부 2026년 실업급여 고시 기준 추정이며, 실제 수급액은 고용센터 심사를 거쳐 확정됩니다.
      </p>
    </article>`;
}

// =========================
// 퇴직금 (/severance-pay/:years)
// =========================
function buildSeverancePayContent(years) {
  // 가정: 평균 월급 300만원, 상여금 포함 평균임금 330만원 (calc-engine 공용 산식)
  const { avgWage, severance, yearDeduction, estimatedTax, netSeverance } =
    severancePayEstimate(years);

  return `
    <article data-seo-prerender="severance" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/severance-pay" style="color:hsl(var(--muted-foreground));text-decoration:none;">퇴직금 계산기</a>
        &nbsp;›&nbsp;
        ${years}년 근속
      </nav>

      <h1 style="${H1_STYLE}">${years}년 근속 퇴직금 계산 (2026년 기준)</h1>

      <p style="${P_STYLE}">
        평균 월급 300만원·상여금 포함 평균임금 ${formatWon(avgWage)} 기준으로
        <strong>${years}년 근속</strong> 시 세전 퇴직금은 약 <strong style="color:hsl(var(--primary));">${formatWon(severance)}</strong>,
        근속연수 공제 ${formatWon(yearDeduction)} 적용 후 예상 퇴직소득세는 약 ${formatWon(estimatedTax)},
        실수령 퇴직금은 <strong>약 ${formatWon(netSeverance)}</strong>입니다.
      </p>

      <p style="${P_STYLE}">
        퇴직금은 근로자퇴직급여보장법에 따라 1년 이상 근속한 근로자에게 지급되며,
        근속연수가 길수록 퇴직소득세 공제가 커져 세부담이 줄어드는 구조입니다.
      </p>

      <h2 style="${H2_STYLE}">1. 퇴직금 계산 공식</h2>
      <div style="${CALLOUT_STYLE}">
        <strong>퇴직금 = 1일 평균임금 × 30일 × (총 근속일수 ÷ 365)</strong><br>
        평균임금 = 퇴직 전 3개월 총 임금 ÷ 해당 기간 총 일수 (상여금 연 단위 안분 포함)
      </div>

      <h2 style="${H2_STYLE}">2. 퇴직소득세 구조</h2>
      <p style="${P_STYLE}">
        퇴직소득세는 근속연수공제를 먼저 차감하고, 남은 금액을 "연분연승법"(× 12 ÷ 근속연수)으로
        1년치 환산급여로 바꾼 뒤 <strong>환산급여공제</strong>까지 뺀 과세표준에 세율을 적용하고
        다시 근속연수를 곱해 산출합니다. 아래 표의 세액은 이 순서를 그대로 적용하고 지방소득세 10%를
        더한 금액이라 계산기 결과와 같습니다. 근속연수가 길수록 두 공제가 모두 커져 세부담이 줄어듭니다.
      </p>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">근속연수</th>
            <th style="${TH_STYLE}">공제 금액</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="${TD_STYLE}">5년 이하</td><td style="${TD_STYLE}">100만원 × 근속연수</td></tr>
          <tr><td style="${TD_STYLE}">5년~10년</td><td style="${TD_STYLE}">500만원 + 200만원 × (근속-5)</td></tr>
          <tr><td style="${TD_STYLE}">10년~20년</td><td style="${TD_STYLE}">1,500만원 + 250만원 × (근속-10)</td></tr>
          <tr><td style="${TD_STYLE}">20년 초과</td><td style="${TD_STYLE}">4,000만원 + 300만원 × (근속-20)</td></tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">3. ${years}년 근속 퇴직금 상세</h2>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr>
            <td style="${TD_STYLE}">근속연수</td>
            <td style="${TD_STYLE}">${years}년</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">평균임금 (월)</td>
            <td style="${TD_STYLE}">${formatWon(avgWage)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">세전 퇴직금</td>
            <td style="${TD_STYLE}">${formatWon(severance)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">근속연수 공제</td>
            <td style="${TD_STYLE}">-${formatWon(yearDeduction)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">예상 퇴직소득세(추정)</td>
            <td style="${TD_STYLE}">-${formatWon(estimatedTax)}</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>실수령 퇴직금</strong></td>
            <td style="${TD_STYLE}"><strong style="color:hsl(var(--primary));">${formatWon(netSeverance)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">4. IRP 이체 시 세금 이연</h2>
      <p style="${P_STYLE}">
        55세 이전에 퇴사하면 퇴직금은 의무적으로 IRP(개인형 퇴직연금) 계좌로 이체됩니다.
        IRP로 이체하면 퇴직소득세 납부가 연기되고, 55세 이후 연금 형태로 받으면
        퇴직소득세가 30% 감면되어 실질 세부담이 줄어듭니다.
      </p>

      <h2 style="${H2_STYLE}">5. 자주 묻는 질문 (FAQ)</h2>

      <h3 style="${H3_STYLE}">Q1. 1년 미만 근속도 퇴직금을 받나요?</h3>
      <p style="${P_STYLE}">
        원칙적으로 1년 이상 계속 근로자에게만 퇴직금 지급 의무가 있습니다. 11개월 근속 후 퇴사 시 퇴직금은 발생하지 않습니다.
      </p>

      <h3 style="${H3_STYLE}">Q2. 월급에 "퇴직금 포함"이라고 적혀있으면?</h3>
      <p style="${P_STYLE}">
        근로기준법상 퇴직금 포함 월급 지급은 원칙적으로 무효입니다. 퇴직금은 퇴직 시에만 지급할 수 있으며,
        월급에 포함된 경우에도 퇴직 시 별도로 청구할 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q3. 평균임금에는 상여금이 포함되나요?</h3>
      <p style="${P_STYLE}">
        네. 정기적·일률적 상여금은 퇴직 전 12개월 수령액의 3/12을 평균임금에 포함시킵니다.
        경영성과급·일시금은 대법원 판례상 포함 여부가 사안별로 다를 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q4. 중간정산을 받은 적이 있으면?</h3>
      <p style="${P_STYLE}">
        중간정산은 주택 구입·의료비·학비 등 법정 사유가 있을 때만 가능하며, 정산 이후 기간만 퇴직금 산정 대상이 됩니다.
        불법 중간정산은 무효이며 다시 청구할 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q5. DB·DC·IRP 차이는?</h3>
      <p style="${P_STYLE}">
        DB형(확정급여형)은 회사가 운용하고 평균임금 기반으로 지급, DC형(확정기여형)은 매달 회사 적립 후 근로자가 운용,
        IRP는 개인이 추가 납입 가능한 연금계좌로 퇴직 시 의무 이체 대상입니다.
      </p>

      <h2 style="${H2_STYLE}">6. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/quit">퇴사 계산기</a> - 퇴직금+실업급여 종합</li>
        <li style="${LI_STYLE}"><a href="/finance/irp">IRP 세액공제 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/pension">국민연금 수령액 계산기</a></li>
      </ul>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 평균 월급 300만원 가정의 단순 추정이며, 실제 퇴직금·퇴직소득세는 급여 구조와 근속연수에 따라 달라집니다.
      </p>
    </article>`;
}

// =========================
// 연말정산 (/year-end-settlement/:manWon)
// =========================
function buildYearEndContent(manWon) {
  const gross = manWon * 10_000;
  const result = calculateSalaryBreakdown({
    grossAnnual: gross,
    nonTaxableMonthly: 200_000,
    dependents: 1,
    children: 0,
    retirementIncluded: false,
  });
  // 표준 공제 시나리오 가정
  const extraDeduction = Math.min(3_000_000, Math.floor(gross * 0.05));
  const refundEstimate = Math.floor(extraDeduction * 0.15);
  const label = formatManWonValue(manWon);

  return `
    <article data-seo-prerender="year-end" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a> ›
        <a href="/finance/year-end-settlement" style="color:hsl(var(--muted-foreground));text-decoration:none;">연말정산 계산기</a> ›
        연봉 ${label}
      </nav>

      <h1 style="${H1_STYLE}">연봉 ${label}원 연말정산 예상 환급액 (2026년)</h1>

      <p style="${P_STYLE}">
        연봉 <strong>${label}원</strong> 기준 원천징수된 소득세는 연간 약 ${formatWon(result.determinedTax)}이며,
        신용카드·의료비·교육비·월세·연금저축 등 공제 항목을 모두 적용할 경우 예상 환급액은
        <strong style="color:hsl(var(--primary));">약 ${formatWon(refundEstimate)}</strong> 수준입니다. (표준 시나리오 기준)
      </p>

      <p style="${P_STYLE}">
        실제 환급액은 본인의 공제 항목(신용카드 사용액, 의료비, 자녀 교육비, 주택마련저축, IRP 납입 등)에
        따라 크게 달라집니다. 본 결과는 일반적인 공제 항목을 평균값으로 가정한 단순 추정이며,
        정확한 환급액은 국세청 홈택스 "연말정산 미리보기"를 이용하세요.
      </p>

      <h2 style="${H2_STYLE}">1. 연말정산 구조 이해</h2>
      <p style="${P_STYLE}">
        연말정산은 이미 납부한 원천징수 소득세와 실제 결정세액을 비교해 차액을 환급/추납하는 절차입니다.
      </p>
      <div style="${CALLOUT_STYLE}">
        <strong>환급액 = 기납부세액(연간 원천징수) - 결정세액</strong><br>
        공제 항목이 많을수록 결정세액이 줄어들어 환급액이 커집니다.
      </div>

      <h2 style="${H2_STYLE}">2. 주요 공제 항목</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>인적공제</strong>: 본인·배우자·부양가족 1인당 150만원 (연 소득 100만원 이하)</li>
        <li style="${LI_STYLE}"><strong>신용카드 등 사용액 공제</strong>: 총급여 25% 초과 사용분의 15~40% 공제 (한도 300만원)</li>
        <li style="${LI_STYLE}"><strong>의료비 세액공제</strong>: 총급여 3% 초과분의 15% (난임·미숙아 20~30%)</li>
        <li style="${LI_STYLE}"><strong>교육비 세액공제</strong>: 본인·자녀 교육비의 15% (고등학생 한도 300만원)</li>
        <li style="${LI_STYLE}"><strong>연금저축·IRP</strong>: 연 700~900만원 한도 12~15% 세액공제</li>
        <li style="${LI_STYLE}"><strong>주택자금 공제</strong>: 주택담보대출 이자, 주택청약종합저축, 월세 세액공제</li>
        <li style="${LI_STYLE}"><strong>기부금 세액공제</strong>: 정치자금 10만원 100% + 초과분 15%, 지정기부금 15%</li>
      </ul>

      <h2 style="${H2_STYLE}">3. 환급 시나리오 (연봉 ${label}원)</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">시나리오</th>
            <th style="${TH_STYLE}">예상 환급액</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">표준 공제만 (미혼·공제 없음)</td>
            <td style="${TD_STYLE}">0원 또는 소액 추납</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">인적공제 2인 + 신용카드 평균</td>
            <td style="${TD_STYLE}">${formatWon(Math.floor(refundEstimate * 0.5))}</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>표준 시나리오 (본 페이지 기준)</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(refundEstimate)}</strong></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">IRP 700만원 + 의료비 + 월세</td>
            <td style="${TD_STYLE}">${formatWon(Math.floor(refundEstimate * 2.2))}</td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">4. 연말정산 절세 팁</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">신용카드는 연 총급여의 25% 초과 사용분부터 공제 대상 → 체크카드·현금영수증 활용 시 공제율 높음</li>
        <li style="${LI_STYLE}">IRP·연금저축 연 납입으로 세액공제 최대 115만원 환급 (12% + 3% 추가)</li>
        <li style="${LI_STYLE}">맞벌이 부부는 소득이 높은 배우자 쪽으로 카드 사용·의료비 집중 시 유리</li>
        <li style="${LI_STYLE}">월세 세액공제 연 90만원 한도 (총급여 7,000만원 이하 무주택 세대주)</li>
        <li style="${LI_STYLE}">자녀세액공제: 1자녀 25만, 2자녀 55만, 추가 자녀 40만원씩</li>
      </ul>

      <h2 style="${H2_STYLE}">5. 자주 묻는 질문 (FAQ)</h2>
      <h3 style="${H3_STYLE}">Q1. 연말정산은 언제 하나요?</h3>
      <p style="${P_STYLE}">
        회사는 매년 1월 중순~2월 말까지 직원의 연말정산 서류를 수취해 3월 10일까지 신고합니다.
        근로자는 1월 15일 전후 국세청 홈택스 "연말정산 간소화 서비스"에서 자료를 다운받아 회사에 제출합니다.
      </p>
      <h3 style="${H3_STYLE}">Q2. 놓친 공제 항목이 있으면?</h3>
      <p style="${P_STYLE}">
        5월 종합소득세 신고 기간에 경정청구를 통해 환급받을 수 있습니다. 5년 이내 과거 연도도 소급 청구 가능합니다.
      </p>
      <h3 style="${H3_STYLE}">Q3. 환급 대신 추납이 나오면?</h3>
      <p style="${P_STYLE}">
        3월 급여에서 일괄 공제되거나 최대 3회 분납 신청 가능합니다. 부양가족 변경 신고 누락·연봉 상승이 주요 원인입니다.
      </p>

      <h2 style="${H2_STYLE}">6. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/monthly-rent-deduction">월세 세액공제 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/irp">IRP 세액공제 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a></li>
      </ul>
      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 표준 공제 시나리오 기준 추정이며, 정확한 환급액은 국세청 홈택스 연말정산 미리보기로 확인하세요.
      </p>
    </article>`;
}

// =========================
// 육아휴직 (/parental-leave/:manWon)
// =========================
function buildParentalLeaveContent(manWon) {
  const wage = manWon * 10_000;
  // 2026 기준 일반 육아휴직 (src/data/parentalLeave.ts):
  //   1~3개월: 통상임금 100%, 상한 250만원
  //   4~6개월: 통상임금 100%, 상한 200만원
  //   7~12개월: 통상임금 80%, 상한 160만원 / 하한 70만원
  const { pay1_3, pay4_6, pay7_12, total } = parentalLeavePay(wage); // 12개월 가정

  return `
    <article data-seo-prerender="parental-leave" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a> ›
        <a href="/finance/parental-leave" style="color:hsl(var(--muted-foreground));text-decoration:none;">육아휴직 급여</a> ›
        월급 ${formatManWonValue(manWon)}
      </nav>

      <h1 style="${H1_STYLE}">월 통상임금 ${formatManWonValue(manWon)}원 육아휴직 급여 (2026)</h1>

      <p style="${P_STYLE}">
        월 통상임금이 <strong>${formatManWonValue(manWon)}원</strong>인 근로자가 12개월 일반 육아휴직을 사용할 경우,
        1~3개월 동안 월 <strong>${formatWon(pay1_3)}</strong>(통상임금 100%·상한 250만원),
        4~6개월 동안 월 <strong>${formatWon(pay4_6)}</strong>(통상임금 100%·상한 200만원),
        7~12개월 동안 월 <strong>${formatWon(pay7_12)}</strong>(통상임금 80%·상한 160만원)을 받으며,
        총 수령액은 약 <strong style="color:hsl(var(--primary));">${formatWon(total)}</strong>입니다.
      </p>

      <p style="${P_STYLE}">
        2024년 육아휴직급여 인상으로 1~6개월 통상임금 100% 지급(구조별 상한 차등)이 적용되었습니다.
        이 외에 "6+6 부모육아휴직제"(맞벌이 부모 각각 6개월 순차 사용 시 상한 450만원까지 상향)와
        한부모 특례(1~3개월 상한 300만원)도 별도 적용됩니다.
      </p>

      <h2 style="${H2_STYLE}">1. 육아휴직 급여 기본 구조 (2026년)</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">기간</th>
            <th style="${TH_STYLE}">지급률</th>
            <th style="${TH_STYLE}">상한</th>
            <th style="${TH_STYLE}">하한</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="${TD_STYLE}">1~3개월</td><td style="${TD_STYLE}">통상임금 100%</td><td style="${TD_STYLE}">250만원</td><td style="${TD_STYLE}">70만원</td></tr>
          <tr><td style="${TD_STYLE}">4~6개월</td><td style="${TD_STYLE}">통상임금 100%</td><td style="${TD_STYLE}">200만원</td><td style="${TD_STYLE}">70만원</td></tr>
          <tr><td style="${TD_STYLE}">7~12개월</td><td style="${TD_STYLE}">통상임금 80%</td><td style="${TD_STYLE}">160만원</td><td style="${TD_STYLE}">70만원</td></tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">2. 월별·총 수령액 (통상임금 ${formatManWonValue(manWon)}원)</h2>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr><td style="${TD_STYLE}">1~3개월 (100% 지급)</td><td style="${TD_STYLE}">월 ${formatWon(pay1_3)}</td></tr>
          <tr><td style="${TD_STYLE}">3개월 합계</td><td style="${TD_STYLE}">${formatWon(pay1_3 * 3)}</td></tr>
          <tr><td style="${TD_STYLE}">4~6개월 (100% 지급)</td><td style="${TD_STYLE}">월 ${formatWon(pay4_6)}</td></tr>
          <tr><td style="${TD_STYLE}">3개월 합계</td><td style="${TD_STYLE}">${formatWon(pay4_6 * 3)}</td></tr>
          <tr><td style="${TD_STYLE}">7~12개월 (80% 지급)</td><td style="${TD_STYLE}">월 ${formatWon(pay7_12)}</td></tr>
          <tr><td style="${TD_STYLE}">6개월 합계</td><td style="${TD_STYLE}">${formatWon(pay7_12 * 6)}</td></tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>12개월 총 수령</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(total)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">3. 6+6 부모육아휴직제 (2026년)</h2>
      <p style="${P_STYLE}">
        부모가 각각 6개월씩 육아휴직을 사용하면, 각 부모의 첫 6개월에 한해 월 상한 250만원 → <strong>최대 450만원</strong>까지 상향됩니다.
        맞벌이 부부가 순차 휴직하면 경제적 부담을 크게 줄일 수 있습니다.
      </p>

      <h2 style="${H2_STYLE}">4. 육아휴직 수급 조건</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">만 8세 이하 또는 초등학교 2학년 이하 자녀 대상</li>
        <li style="${LI_STYLE}">고용보험 피보험 단위기간 180일 이상</li>
        <li style="${LI_STYLE}">사업주에게 30일 이상 휴직 신청 (부모 각자 1년, 동시/순차 가능)</li>
        <li style="${LI_STYLE}">휴직 중 사후지급분(급여의 25%)은 복직 후 6개월 유지 시 일괄 지급</li>
      </ul>

      <h2 style="${H2_STYLE}">5. 자주 묻는 질문 (FAQ)</h2>
      <h3 style="${H3_STYLE}">Q1. 사후지급분 25%는 언제 받나요?</h3>
      <p style="${P_STYLE}">
        육아휴직 종료 후 같은 직장에 6개월 이상 복귀 근무해야 일괄 지급됩니다. 복직 조건 미충족 시 미지급됩니다.
      </p>
      <h3 style="${H3_STYLE}">Q2. 자영업자·프리랜서도 받을 수 있나요?</h3>
      <p style="${P_STYLE}">
        고용보험 임의가입자는 조건 충족 시 수급 가능합니다. 다만 조건이 까다로우므로 고용센터에 별도 문의가 필요합니다.
      </p>
      <h3 style="${H3_STYLE}">Q3. 육아기 근로시간 단축제도와 병행 가능한가요?</h3>
      <p style="${P_STYLE}">
        네. 육아휴직 대신 또는 휴직 후 근로시간 단축제도로 전환해 임금의 일부를 보전받을 수 있습니다.
      </p>

      <h2 style="${H2_STYLE}">6. 관련 정보</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/year-end-settlement">연말정산 계산기</a></li>
      </ul>
      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 2026년 고용노동부 육아휴직급여 고시 기준 추정이며, 사후지급분·특례 적용 여부에 따라 달라질 수 있습니다.
      </p>
    </article>`;
}

// =========================
// 원천세 역산 (/withholding/:amount)
// =========================
function buildWithholdingContent(amount) {
  // 월 원천징수 소득세 → 연봉 추정 (단순화: 간이세액표 근사 역산)
  // 실제는 간이세액표이지만 prerender에서는 대략적 추정으로
  const monthlyTax = amount;
  const annualTax = monthlyTax * 12;
  // 간이세액표 근사 역산 (calc-engine 공용 산식)
  const { estimatedAnnual, estimatedManWon } = withholdingReverse(monthlyTax);

  return `
    <article data-seo-prerender="withholding" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a> ›
        <a href="/finance/withholding" style="color:hsl(var(--muted-foreground));text-decoration:none;">원천세 계산기</a> ›
        월 소득세 ${formatWon(amount)}
      </nav>

      <h1 style="${H1_STYLE}">월 원천징수 ${formatWon(amount)} 추정 연봉 (2026)</h1>

      <p style="${P_STYLE}">
        매월 소득세 <strong>${formatWon(amount)}</strong>이 원천징수되고 있다면,
        국세청 근로소득 간이세액표(2026년 개정) 기준 추정 연봉은 약 <strong style="color:hsl(var(--primary));">${formatManWonValue(estimatedManWon)}원</strong> 수준입니다.
        (부양가족 1인, 비과세 식대 월 20만원 가정)
      </p>

      <p style="${P_STYLE}">
        원천징수는 회사가 매월 급여 지급 시 간이세액표에 따라 소득세를 미리 징수하는 제도입니다.
        부양가족 수, 비과세 항목, 연봉 수준에 따라 월 원천징수액이 달라지므로,
        이 값을 역산하면 대략적인 세전 연봉을 추정할 수 있습니다.
      </p>

      <h2 style="${H2_STYLE}">1. 간이세액표 원리</h2>
      <p style="${P_STYLE}">
        간이세액표는 월 급여·부양가족 수에 따른 소득세 원천징수액을 구간별로 정한 표입니다.
        실제 세액과 다를 수 있으므로 연말정산에서 최종 정산됩니다.
      </p>
      <div style="${CALLOUT_STYLE}">
        <strong>역산 공식(근사)</strong>: 연봉 ≈ (월 원천징수액 × 12 + 누진공제) ÷ 실효 한계세율
      </div>

      <h2 style="${H2_STYLE}">2. 원천징수 vs 연말정산</h2>
      <p style="${P_STYLE}">
        매월 원천징수된 금액은 "미리 낸 세금"이고, 연말정산에서 공제 항목을 반영해 최종 결정세액을 계산합니다.
        결정세액이 더 적으면 환급, 더 많으면 추납됩니다.
      </p>

      <h2 style="${H2_STYLE}">3. 부양가족 수가 바뀌면?</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">부양가족이 늘면 인적공제(1인 150만원) 적용으로 원천징수액 감소</li>
        <li style="${LI_STYLE}">결혼·출산·부모 부양 시 회사에 "근로소득자 소득·세액 공제신고서" 제출로 즉시 반영 가능</li>
        <li style="${LI_STYLE}">자녀세액공제(1자녀 25만원)도 함께 반영</li>
      </ul>

      <h2 style="${H2_STYLE}">4. 자주 묻는 질문 (FAQ)</h2>
      <h3 style="${H3_STYLE}">Q1. 원천징수액과 실제 세금이 다른 이유?</h3>
      <p style="${P_STYLE}">
        간이세액표는 평균적인 공제 구조를 가정한 근사치입니다. 실제 공제(의료비·교육비·기부금 등)는
        연말정산에서 반영되므로 정산 시 차액이 환급·추납됩니다.
      </p>
      <h3 style="${H3_STYLE}">Q2. 월 소득세 ${formatWon(amount)}인데 실수령은 얼마?</h3>
      <p style="${P_STYLE}">
        추정 연봉 ${formatManWonValue(estimatedManWon)}원 기준으로 <a href="/finance/salary?gross=${estimatedAnnual}">연봉 실수령액 계산기</a>에서 정확한 월 실수령을 확인할 수 있습니다.
      </p>
      <h3 style="${H3_STYLE}">Q3. 원천징수액을 조정할 수 있나요?</h3>
      <p style="${P_STYLE}">
        네. 회사에 요청해 간이세액표의 80%·100%·120% 중 선택할 수 있습니다.
        80% 선택 시 매월 실수령은 많아지지만 연말정산 환급이 줄고, 120%는 반대입니다.
      </p>

      <h2 style="${H2_STYLE}">5. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/insurance">건보료 역산 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/year-end-settlement">연말정산 계산기</a></li>
      </ul>
      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 국세청 근로소득 간이세액표를 기준으로 한 역산 추정치이며, 실제 연봉은 회사 급여 구조에 따라 달라집니다.
      </p>
    </article>`;
}

// =========================
// 주휴수당 (/weekly-holiday-pay/:hourly)
// =========================
function buildWeeklyHolidayPayContent(hourly) {
  const { weeklyBase, weeklyHoliday, weeklyTotal, monthlyTotal, effectiveHourly } =
    weeklyHolidayPay(hourly);

  return `
    <article data-seo-prerender="weekly-holiday-pay" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a> ›
        <a href="/finance/weekly-holiday-pay" style="color:hsl(var(--muted-foreground));text-decoration:none;">주휴수당 계산기</a> ›
        시급 ${hourly.toLocaleString("ko-KR")}원
      </nav>

      <h1 style="${H1_STYLE}">시급 ${hourly.toLocaleString("ko-KR")}원 주휴수당 계산 (2026)</h1>

      <p style="${P_STYLE}">
        시급 <strong>${hourly.toLocaleString("ko-KR")}원</strong>으로 주 40시간을 일하면 기본 주급은 ${formatWon(weeklyBase)},
        추가로 지급되는 주휴수당은 <strong style="color:hsl(var(--primary));">${formatWon(weeklyHoliday)}</strong>(8시간분),
        주휴수당 포함 실질 시급은 <strong>${formatWon(effectiveHourly)}</strong>입니다.
      </p>

      <p style="${P_STYLE}">
        주휴수당은 근로기준법 제55조에 따라 주 15시간 이상 일하는 근로자에게 의무적으로 지급되는 "유급휴일 수당"입니다.
        정규직·계약직·아르바이트 모두 적용되며, 조건 충족 시 지급하지 않으면 체불임금에 해당합니다.
      </p>

      <h2 style="${H2_STYLE}">1. 주휴수당 계산 공식</h2>
      <div style="${CALLOUT_STYLE}">
        <strong>주휴수당 = (주 소정근로시간 ÷ 40) × 8 × 시급</strong><br>
        주 40시간 풀타임: 8시간 × 시급 = 주 1일분 유급 휴일수당
      </div>

      <h2 style="${H2_STYLE}">2. 주급·월급 환산</h2>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr>
            <td style="${TD_STYLE}">주 기본 근로 (40시간)</td>
            <td style="${TD_STYLE}">${formatWon(weeklyBase)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">주휴수당 (8시간분)</td>
            <td style="${TD_STYLE}">+${formatWon(weeklyHoliday)}</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>주급 (주휴 포함)</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(weeklyTotal)}</strong></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">월급 (주 4.345 × 주급)</td>
            <td style="${TD_STYLE}">${formatWon(monthlyTotal)}</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">실질 시급 (주휴 포함)</td>
            <td style="${TD_STYLE}">${formatWon(effectiveHourly)}</td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">3. 주휴수당 지급 조건</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>주 소정근로시간 15시간 이상</strong> 계약자</li>
        <li style="${LI_STYLE}">1주일 소정근로일을 <strong>개근</strong>한 경우</li>
        <li style="${LI_STYLE}">다음 주 근로가 예정되어 있어야 함 (마지막 주 개근 후 퇴사 시 제외)</li>
        <li style="${LI_STYLE}">정규직·계약직·일용직·아르바이트 모두 적용</li>
      </ul>

      <h2 style="${H2_STYLE}">4. 2026년 최저임금 기준</h2>
      <p style="${P_STYLE}">
        2026년 최저시급은 <strong>10,320원</strong>이며, 주 40시간 기준 주휴수당 포함 월급은 약 215만 7천원입니다.
        최저임금 미달 여부는 실질 시급(주휴 포함) 기준으로 판단해야 합니다.
      </p>

      <h2 style="${H2_STYLE}">5. 자주 묻는 질문 (FAQ)</h2>
      <h3 style="${H3_STYLE}">Q1. 주 15시간 미만이면 안 받나요?</h3>
      <p style="${P_STYLE}">
        네. 초단시간 근로자(주 15시간 미만)는 주휴수당 지급 대상에서 제외됩니다. 사업주가 "주 14시간"으로 계약을 체결하는 이유입니다.
      </p>
      <h3 style="${H3_STYLE}">Q2. 지각·결근 시 주휴수당은?</h3>
      <p style="${P_STYLE}">
        지각·조퇴는 개근에 영향을 주지 않지만, 결근(무단 또는 병가 미제출)은 해당 주 주휴수당이 미지급됩니다.
      </p>
      <h3 style="${H3_STYLE}">Q3. 주 20시간 일하면?</h3>
      <p style="${P_STYLE}">
        주 20시간 기준 주휴수당 = (20 ÷ 40) × 8 × 시급 = 4시간분 시급입니다.
        시급 ${hourly.toLocaleString("ko-KR")}원 기준 주휴수당은 ${formatWon(hourly * 4)}입니다.
      </p>

      <h2 style="${H2_STYLE}">6. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/wage-converter">시급↔월급↔연봉 환산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/overtime">연장·야간·휴일수당 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/annual-leave">연차수당 계산기</a></li>
      </ul>
      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 근로기준법 제55조 주휴수당 규정 기준 계산이며, 실제 지급은 근로계약서와 사업장 정책에 따라 달라질 수 있습니다.
      </p>
    </article>`;
}

// =========================
// 시급 환산 (/wage-converter/:hourly)
// =========================
function buildWageConverterContent(hourly) {
  const { dailyWage, weeklyBase, weeklyTotal, monthlyTotal, annualTotal } = wageConversion(hourly);

  return `
    <article data-seo-prerender="wage-converter" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a> ›
        <a href="/finance/wage-converter" style="color:hsl(var(--muted-foreground));text-decoration:none;">시급 환산기</a> ›
        시급 ${hourly.toLocaleString("ko-KR")}원
      </nav>

      <h1 style="${H1_STYLE}">시급 ${hourly.toLocaleString("ko-KR")}원 월급·연봉 환산 (2026)</h1>

      <p style="${P_STYLE}">
        시급 <strong>${hourly.toLocaleString("ko-KR")}원</strong>으로 주 40시간·월 4.345주 근무 시
        주휴수당을 포함한 월급은 <strong style="color:hsl(var(--primary));">${formatWon(monthlyTotal)}</strong>,
        연봉은 <strong>${formatWon(annualTotal)}</strong>으로 환산됩니다.
      </p>

      <h2 style="${H2_STYLE}">1. 환산 결과 요약</h2>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr><td style="${TD_STYLE}">시급</td><td style="${TD_STYLE}">${formatWon(hourly)}</td></tr>
          <tr><td style="${TD_STYLE}">일급 (8시간)</td><td style="${TD_STYLE}">${formatWon(dailyWage)}</td></tr>
          <tr><td style="${TD_STYLE}">주급 (40시간 기본)</td><td style="${TD_STYLE}">${formatWon(weeklyBase)}</td></tr>
          <tr><td style="${TD_STYLE}">주급 (주휴수당 포함)</td><td style="${TD_STYLE}">${formatWon(weeklyTotal)}</td></tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>월급 (주휴 포함)</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(monthlyTotal)}</strong></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">연봉 (월급 × 12)</td>
            <td style="${TD_STYLE}">${formatWon(annualTotal)}</td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">2. 월 환산의 기준</h2>
      <p style="${P_STYLE}">
        1개월 평균 주수는 365 ÷ 7 ÷ 12 = 약 <strong>4.345주</strong>입니다.
        따라서 월급 = 주급 × 4.345로 계산합니다. 일부 기업은 4.34 또는 4.33을 사용하기도 합니다.
      </p>

      <h2 style="${H2_STYLE}">3. 주휴수당 포함/미포함 차이</h2>
      <p style="${P_STYLE}">
        근로기준법에 따라 주 15시간 이상 근로자는 주휴수당을 받을 권리가 있습니다.
        주휴수당을 포함하면 실질 시급이 20% 증가하는 효과가 있습니다.
      </p>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">구분</th>
            <th style="${TH_STYLE}">월급</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">주휴수당 미포함 (시급 × 209시간)</td>
            <td style="${TD_STYLE}">${formatWon(hourly * 209)}</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>주휴수당 포함 (시급 × 주 48시간 환산)</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(monthlyTotal)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">4. 2026년 최저시급 기준</h2>
      <p style="${P_STYLE}">
        2026년 법정 최저시급은 <strong>10,320원</strong>이며,
        주 40시간·주휴수당 포함 월급 약 2,156,880원, 연봉 약 25,882,560원입니다.
      </p>

      <h2 style="${H2_STYLE}">5. 자주 묻는 질문 (FAQ)</h2>
      <h3 style="${H3_STYLE}">Q1. 월 209시간의 의미는?</h3>
      <p style="${P_STYLE}">
        주 40시간 + 주휴수당 8시간 = 주 48시간을 월 평균 4.345주로 환산하면 약 209시간입니다.
        대부분의 기업이 이 기준으로 월급을 환산합니다.
      </p>
      <h3 style="${H3_STYLE}">Q2. 야간·연장근로 수당은 포함되나요?</h3>
      <p style="${P_STYLE}">
        아니오. 본 환산은 기본 근로시간 기준이며, 야간근무(22시~6시)·연장근무(40시간 초과)는 1.5배 할증이 별도로 계산됩니다.
        <a href="/finance/overtime">연장·야간·휴일수당 계산기</a>에서 확인하세요.
      </p>
      <h3 style="${H3_STYLE}">Q3. 주 5일이 아닌 주 6일 근무는?</h3>
      <p style="${P_STYLE}">
        주 6일 총 44시간 근로 시에도 주휴수당 기준은 40시간(8시간분)으로 고정됩니다.
        초과 4시간은 연장근로로 별도 1.5배 할증이 적용됩니다.
      </p>

      <h2 style="${H2_STYLE}">6. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/weekly-holiday-pay">주휴수당 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/overtime">연장·야간·휴일수당</a></li>
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a></li>
      </ul>
      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 환산은 근로기준법 주휴수당 포함·주 40시간 기본 근로 기준이며, 실제 월급은 근로계약에 따라 달라질 수 있습니다.
      </p>
    </article>`;
}

// =========================
// 지역 건강보험 (/regional-health/:manWon)
// =========================
function buildRegionalHealthContent(manWon) {
  const monthlyIncome = manWon * 10_000;
  // 지역가입자 실제 산식과 다르므로 건강보험 총 요율로 소득분만 단순 추정
  // 재산·자동차 점수는 개인별로 편차가 커서 프리렌더에서는 제외
  const { regionalIncomeOnly: estimatedRegionalIncomeOnly, formerEmployed } =
    regionalHealthEstimate(monthlyIncome);
  const maxContinued = formerEmployed; // 임의계속가입: 직전 부담분 유지

  return `
    <article data-seo-prerender="regional-health" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a> ›
        <a href="/finance/regional-health" style="color:hsl(var(--muted-foreground));text-decoration:none;">지역가입자 건보료</a> ›
        월급 ${formatManWonValue(manWon)}
      </nav>

      <h1 style="${H1_STYLE}">월급 ${formatManWonValue(manWon)}원 퇴사 후 지역 건보료 (2026)</h1>

      <p style="${P_STYLE}">
        월급 <strong>${formatManWonValue(manWon)}원</strong>으로 근무 중이던 근로자가 퇴사할 경우,
        <strong>지역가입자</strong>(소득 점수만 반영) 월 건강보험료는 약 <strong style="color:hsl(var(--destructive));">${formatWon(estimatedRegionalIncomeOnly)}</strong>,
        <strong>임의계속가입</strong>(최대 36개월) 시 직전 근무 때와 동일한 <strong style="color:hsl(var(--primary));">${formatWon(formerEmployed)}</strong>으로
        유지할 수 있습니다. (재산·자동차 점수는 개인별 편차가 커서 제외한 최소 추정)
      </p>

      <p style="${P_STYLE}">
        지역가입자 건강보험료는 소득뿐 아니라 <strong>재산(주택·토지·전월세 보증금)과 자동차</strong>를 점수화해 합산 부과됩니다.
        따라서 소득이 적어도 재산·자동차가 있으면 실제 보험료는 월 30~50만원 이상 나올 수 있어,
        정확한 금액은 국민건강보험공단(1577-1000) 또는 공단 홈페이지의 "지역보험료 모의계산"에서 확인하세요.
      </p>

      <h2 style="${H2_STYLE}">1. 퇴사 후 건강보험 3가지 옵션</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">옵션</th>
            <th style="${TH_STYLE}">조건</th>
            <th style="${TH_STYLE}">예상 월 보험료</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">지역가입자 전환</td>
            <td style="${TD_STYLE}">기본 (무조건 적용)</td>
            <td style="${TD_STYLE}">약 ${formatWon(estimatedRegionalIncomeOnly)}~${formatWon(Math.floor(estimatedRegionalIncomeOnly * 2.5))} (소득+재산 편차 큼)</td>
          </tr>
          <tr style="background:hsl(var(--accent));">
            <td style="${TD_STYLE}"><strong>임의계속가입</strong></td>
            <td style="${TD_STYLE}">퇴사 2개월 내 신청, 이전 1년 중 1개월 이상 근무</td>
            <td style="${TD_STYLE}"><strong>${formatWon(maxContinued)} (직전 부담 유지)</strong></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">피부양자 등록</td>
            <td style="${TD_STYLE}">소득 연 2,000만원 이하, 재산 과세표준 5.4억 이하, 가족 중 직장가입자 존재</td>
            <td style="${TD_STYLE}">0원 (무료)</td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">2. 임의계속가입 주의사항</h2>
      <p style="${P_STYLE}">
        임의계속가입은 퇴사 <strong>2개월 이내</strong>에 국민건강보험공단에 신청해야 하며,
        최대 36개월(3년) 동안 직장가입자 시절과 동일한 보험료로 유지할 수 있습니다.
      </p>
      <div style="${CALLOUT_STYLE}">
        <strong>신청 방법</strong> — 국민건강보험공단 지사 방문 또는 홈페이지·모바일 앱에서 신청 가능.
        전화(1577-1000)로도 가능하며, 신청 즉시 다음 달부터 적용됩니다.
      </div>

      <h2 style="${H2_STYLE}">3. 지역가입자 보험료 산정 방식</h2>
      <p style="${P_STYLE}">
        지역가입자는 다음 3가지 요소를 점수화해 보험료를 산정합니다.
      </p>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>소득 점수</strong>: 종합소득·사업소득·연금소득 등</li>
        <li style="${LI_STYLE}"><strong>재산 점수</strong>: 주택·토지·전월세 보증금</li>
        <li style="${LI_STYLE}"><strong>자동차 점수</strong>: 배기량·연식 기준 (4000cc 이상 고급차량 가중)</li>
      </ul>

      <h2 style="${H2_STYLE}">4. 피부양자 등록 조건</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">배우자·직계존비속·형제자매 중 직장가입자가 있어야 함</li>
        <li style="${LI_STYLE}">소득 요건: 연 2,000만원 이하 (이자·배당·근로·연금·사업소득 합산)</li>
        <li style="${LI_STYLE}">재산 요건: 재산세 과세표준 5.4억 이하 + 연 1,000만원 초과 소득 없을 것</li>
      </ul>

      <h2 style="${H2_STYLE}">5. 자주 묻는 질문 (FAQ)</h2>
      <h3 style="${H3_STYLE}">Q1. 임의계속가입과 지역가입자 중 뭐가 유리한가요?</h3>
      <p style="${P_STYLE}">
        재산·자동차가 많으면 임의계속가입이 유리하고, 소득·재산이 거의 없으면 지역가입자가 더 쌀 수 있습니다.
        예상 보험료를 비교한 뒤 선택하세요.
      </p>
      <h3 style="${H3_STYLE}">Q2. 피부양자 등록 후 소득이 생기면?</h3>
      <p style="${P_STYLE}">
        연 2,000만원을 초과하는 소득이 발생하면 피부양자 자격을 상실하고 지역가입자로 전환됩니다.
      </p>
      <h3 style="${H3_STYLE}">Q3. 퇴사하자마자 보험료가 부과되나요?</h3>
      <p style="${P_STYLE}">
        네. 퇴사 다음 달 1일부터 지역가입자 또는 임의계속가입자로 전환되며 즉시 보험료가 부과됩니다.
        이때 기존 직장가입자 자격은 자동 상실됩니다.
      </p>

      <h2 style="${H2_STYLE}">6. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/quit">퇴사 종합 시뮬레이션</a></li>
        <li style="${LI_STYLE}"><a href="/finance/insurance">건강보험료 역산 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/unemployment">실업급여 계산기</a></li>
      </ul>
      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 결과는 소득 기준 단순 추정이며, 실제 지역가입자 건보료는 재산·자동차 포함 종합 산정이 필요합니다.
      </p>
    </article>`;
}

// =========================
// About 페이지
// =========================
function buildAboutContent() {
  return `
    <article data-seo-prerender="about" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a> › 서비스 소개
      </nav>

      <h1 style="${H1_STYLE}">서비스 소개 — ShakiLabs 연봉·세금 계산기</h1>

      <p style="${P_STYLE}">
        ShakiLabs 연봉·세금 계산기는 2026년 최신 세율·요율을 기반으로 대한민국 근로자·프리랜서·사업자·구직자를 위한
        22종의 무료 금융 계산 도구를 제공하는 서비스입니다. 회원가입 없이 즉시 이용 가능하며,
        입력한 급여·세금 정보는 서버에 전송되지 않고 브라우저 내에서만 계산됩니다.
      </p>

      <p style="${P_STYLE}">
        본 서비스는 복잡한 한국의 세법·노동법·사회보험 제도를 누구나 이해하기 쉽게 풀어내는 것을 목표로 합니다.
        국세청 근로소득 간이세액표, 국민건강보험공단 요율 고시, 국민연금공단 상·하한 기준액,
        고용노동부 실업급여·육아휴직 고시, 근로기준법 등 2026년 최신 법령을 기반으로 계산합니다.
      </p>

      <h2 style="${H2_STYLE}">1. 제공 계산기 (22종)</h2>
      <h3 style="${H3_STYLE}">급여·연봉 (5종)</h3>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a> — 연봉 → 월 실수령·공제 상세</li>
        <li style="${LI_STYLE}"><a href="/finance/insurance">건강보험료 역산 계산기</a> — 건보료 → 연봉 추정</li>
        <li style="${LI_STYLE}"><a href="/finance/compare">이직 연봉 비교</a> — 두 연봉의 실수령 차이</li>
        <li style="${LI_STYLE}"><a href="/finance/raise">연봉 인상률 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/bonus">성과급 실수령 계산기</a></li>
      </ul>

      <h3 style="${H3_STYLE}">세금·신고 (4종)</h3>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/comprehensive-tax">종합소득세 계산기</a> — 사업·임대·기타소득</li>
        <li style="${LI_STYLE}"><a href="/finance/withholding">원천세 역산 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/freelance-rate">프리랜서 단가 역산</a></li>
        <li style="${LI_STYLE}"><a href="/finance/4-insurance-employer">사업주 4대보험 계산기</a></li>
      </ul>

      <h3 style="${H3_STYLE}">수당·시급 (4종)</h3>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/weekly-holiday-pay">주휴수당 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/wage-converter">시급↔월급↔연봉 환산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/overtime">연장·야간·휴일수당</a></li>
        <li style="${LI_STYLE}"><a href="/finance/annual-leave">연차수당 계산기</a></li>
      </ul>

      <h3 style="${H3_STYLE}">퇴직·구직 (5종)</h3>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/quit">퇴사 종합 시뮬레이션</a></li>
        <li style="${LI_STYLE}"><a href="/finance/severance-pay">퇴직금 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/unemployment">실업급여 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/parental-leave">육아휴직 급여</a></li>
        <li style="${LI_STYLE}"><a href="/finance/regional-health">지역가입자 건보료</a></li>
      </ul>

      <h3 style="${H3_STYLE}">절세·공제 (4종)</h3>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/year-end-settlement">연말정산 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/monthly-rent-deduction">월세 세액공제</a></li>
        <li style="${LI_STYLE}"><a href="/finance/irp">IRP 세액공제 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/pension">국민연금 수령액</a></li>
      </ul>

      <h2 style="${H2_STYLE}">2. 2026년 적용 기준</h2>
      <table style="${TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">항목</th>
            <th style="${TH_STYLE}">2026년 기준</th>
            <th style="${TH_STYLE}">근거</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${TD_STYLE}">국민연금</td>
            <td style="${TD_STYLE}">근로자 4.75% (2026.7.1부터 상·하한 659만/41만)</td>
            <td style="${TD_STYLE}">국민연금공단 고시</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">건강보험</td>
            <td style="${TD_STYLE}">근로자 3.595%</td>
            <td style="${TD_STYLE}">국민건강보험공단 고시</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">장기요양보험</td>
            <td style="${TD_STYLE}">건보료의 13.14%</td>
            <td style="${TD_STYLE}">국민건강보험공단 고시</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">고용보험</td>
            <td style="${TD_STYLE}">근로자 0.9%</td>
            <td style="${TD_STYLE}">고용노동부 고시</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">소득세</td>
            <td style="${TD_STYLE}">누진세율 6~45% (8구간)</td>
            <td style="${TD_STYLE}">소득세법 제55조</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">최저시급</td>
            <td style="${TD_STYLE}">10,320원</td>
            <td style="${TD_STYLE}">최저임금위원회 2025.8 고시</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">실업급여 상한</td>
            <td style="${TD_STYLE}">68,100원/일</td>
            <td style="${TD_STYLE}">고용노동부 2026 고시</td>
          </tr>
        </tbody>
      </table>

      <p style="${P_STYLE}">
        주요 세율·요율의 원문 고시는 <a href="https://www.nts.go.kr" target="_blank" rel="noopener noreferrer">국세청</a>과
        <a href="https://www.nhis.or.kr" target="_blank" rel="noopener noreferrer">국민건강보험공단</a>
        공식 사이트에서 직접 확인할 수 있습니다.
      </p>

      <h2 style="${H2_STYLE}">3. 서비스 운영 원칙</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>회원가입 불필요</strong> — 개인정보를 수집하지 않으며, 즉시 사용 가능</li>
        <li style="${LI_STYLE}"><strong>클라이언트 연산</strong> — 입력한 급여·세금 정보는 서버로 전송되지 않음</li>
        <li style="${LI_STYLE}"><strong>법령 기반</strong> — 모든 계산은 국세청·건보공단·고용부 공식 고시에 기반</li>
        <li style="${LI_STYLE}"><strong>정기 업데이트</strong> — 매년 1월 세법·요율 개정 즉시 반영 (최근: 2026년 1월)</li>
        <li style="${LI_STYLE}"><strong>오류 제보 환영</strong> — 이메일로 계산 오류 제보 시 빠른 수정 진행</li>
        <li style="${LI_STYLE}"><strong>무료 사용</strong> — 광고 수익을 통해 운영되며, 사용자 과금 없음</li>
      </ul>

      <h2 style="${H2_STYLE}">4. 이용 시 주의사항</h2>
      <p style="${P_STYLE}">
        본 서비스의 계산 결과는 참고용 추정값이며 법적 효력이 없습니다. 실제 급여명세서·세금 고지서와 차이가 있을 수 있으며,
        최종 신고·납부 금액은 회사 급여담당자, 국세청 홈택스, 세무대리인 또는 공단 고객센터 확인이 필요합니다.
      </p>
      <p style="${P_STYLE}">
        비과세 항목, 회사 복리후생, 부양가족 특수 사정 등 개별 사항은 계산기에서 반영되지 않을 수 있으며,
        특히 고소득자(국민연금 상한 초과), 일용직, 건설·운수업 특수 케이스는 별도 확인이 필요합니다.
      </p>

      <h2 style="${H2_STYLE}">5. 운영자 정보</h2>
      <p style="${P_STYLE}">
        본 서비스는 개발 스튜디오 <strong>ShakiLabs</strong>가 직접 기획·개발·운영합니다.
        ShakiLabs는 shakilabs.com에서 금융·생활 분야의 무료 웹 계산기를 만들고 있으며,
        모든 계산 로직을 공식 고시·법령과 대조해 관리합니다.
        <strong>운영: ShakiLabs · 문의: skdba1313@gmail.com</strong>
      </p>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr>
            <td style="${TD_STYLE}">운영</td>
            <td style="${TD_STYLE}">ShakiLabs</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">서비스 URL</td>
            <td style="${TD_STYLE}">https://shakilabs.com/finance</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">이메일 문의</td>
            <td style="${TD_STYLE}"><a href="mailto:skdba1313@gmail.com">skdba1313@gmail.com</a></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">응답 시간</td>
            <td style="${TD_STYLE}">영업일 기준 24~48시간 이내</td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">개인정보처리방침</td>
            <td style="${TD_STYLE}"><a href="/finance/privacy">바로가기</a></td>
          </tr>
          <tr>
            <td style="${TD_STYLE}">이용약관</td>
            <td style="${TD_STYLE}"><a href="/finance/terms">바로가기</a></td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">6. 업데이트 이력</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>2026.03</strong> — 사이트 구조 개편 (9탭 네비게이션, 전체 계산기 허브 페이지)</li>
        <li style="${LI_STYLE}"><strong>2026.01</strong> — 2026년 세법·요율 전면 반영 (자녀세액공제, 실업급여 상한 68,100원, 최저시급 10,320원)</li>
        <li style="${LI_STYLE}"><strong>2025.12</strong> — 연말정산 계산기, 월세 세액공제, IRP 계산기 추가</li>
        <li style="${LI_STYLE}"><strong>2025.11</strong> — 지역가입자 건보료·임의계속가입 비교 기능 추가</li>
      </ul>

      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        본 서비스는 대한민국 근로자·프리랜서의 세금·연봉 이해도 향상을 목표로 비영리 개인 프로젝트로 운영되며,
        Google AdSense 광고 수익을 통해 운영비를 충당합니다.
      </p>
    </article>`;
}

// =========================
// Privacy policy (/privacy)
// =========================
// Mirrors src/views/PrivacyView.vue. The prerendered article is the canonical static body:
// AdSense review and crawlers read this HTML, not the SPA render, so the Google-required
// disclosures (third-party ad cookies, personalized ads, opt-out links) must live here too.
function buildPrivacyContent() {
  return `
    <article data-seo-prerender="privacy" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a> › 개인정보처리방침
      </nav>

      <h1 style="${H1_STYLE}">개인정보 처리방침</h1>
      <p style="${P_STYLE}">시행 2026.03.03 · 개정 2026.08.05</p>

      <p style="${P_STYLE}">
        shakilabs.com/finance(이하 "서비스")는 이용자의 개인정보를 소중히 여기며, 개인정보 보호법 등
        관련 법령을 준수합니다. 본 방침은 서비스 이용 과정에서 수집·이용되는 정보의 항목과 목적,
        보관 기간, 광고 게재에 따른 쿠키 사용, 이용자의 권리와 행사 방법을 안내합니다.
      </p>

      <h2 style="${H2_STYLE}">1. 수집하는 정보</h2>
      <p style="${P_STYLE}">
        본 서비스는 별도의 회원가입 없이 이용할 수 있으며, 이름·연락처 같은 직접적인 개인정보를
        입력받지 않습니다. 다만 서비스 운영 과정에서 아래 정보가 자동으로, 또는 기능 이용 시 수집될 수 있습니다.
      </p>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>자동 수집</strong> — 접속 IP, User-Agent(브라우저·운영체제 정보), 접속 시간, 방문 페이지</li>
        <li style="${LI_STYLE}"><strong>광고·통계 쿠키</strong> — Google Analytics·Google AdSense가 발급하는 쿠키 식별자</li>
        <li style="${LI_STYLE}"><strong>익명 댓글</strong> — 작성 내용, 자동 생성 닉네임, 접속 IP, User-Agent</li>
        <li style="${LI_STYLE}"><strong>좋아요 중복 방지</strong> — 접속 IP(원문 저장, 해당 좋아요 기록과 함께 보관)</li>
        <li style="${LI_STYLE}"><strong>브라우저 저장(localStorage)</strong> — 계산기 피드백 상태, 좋아요 기록(기기 내 저장, 서버 미전송)</li>
      </ul>
      <p style="${P_STYLE}">
        이용자가 계산기에 입력하는 연봉·건강보험료·부양가족 수 등 급여·세금 정보는 본 서비스 고유의
        처리 방식에 따라 <strong>서버로 전송되거나 저장되지 않으며, 이용자의 브라우저 안에서만 연산된 뒤
        페이지를 떠나면 사라집니다.</strong> 따라서 운영자는 개별 이용자의 소득 정보를 알 수 없습니다.
      </p>

      <h2 style="${H2_STYLE}">2. 수집 정보의 이용 목적</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>IP 주소·User-Agent</strong> — 서비스 통계, 악성 이용 방지, 좋아요·댓글 중복 방지</li>
        <li style="${LI_STYLE}"><strong>방문 기록</strong> — 서비스 개선을 위한 익명 통계 분석</li>
        <li style="${LI_STYLE}"><strong>광고 쿠키</strong> — Google AdSense 광고 게재 및 광고 성과 측정</li>
        <li style="${LI_STYLE}"><strong>댓글 내용</strong> — 익명 게시판 운영</li>
      </ul>
      <p style="${P_STYLE}">
        수집한 정보는 위 목적 외의 용도로 이용하지 않으며, 법령에 근거한 요청이 있는 경우를 제외하고
        제3자에게 제공하지 않습니다.
      </p>

      <h2 style="${H2_STYLE}">3. 이용하는 제3자 서비스</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>Google Analytics 4</strong> — 익명화 방문 통계 수집
          (<a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">수집 거부 애드온</a>)</li>
        <li style="${LI_STYLE}"><strong>Google AdSense</strong> — 맞춤 광고 제공(쿠키 사용)</li>
        <li style="${LI_STYLE}"><strong>Supabase (PostgreSQL)</strong> — 댓글·좋아요 데이터 저장(EU 서버)</li>
        <li style="${LI_STYLE}"><strong>Sentry</strong> — 오류 진단 로그 수집(운영 환경에 설정된 경우)</li>
      </ul>

      <h2 style="${H2_STYLE}">4. Google AdSense 광고와 쿠키</h2>
      <p style="${P_STYLE}">
        본 서비스는 Google AdSense를 통해 광고를 게재하고, 광고 수익으로 무료 서비스를 운영합니다.
        광고 게재와 관련해 다음 사항을 안내합니다.
      </p>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">Google을 포함한 제3자 광고 사업자는 쿠키를 사용해 이용자의 본 서비스 및 다른
          웹사이트 방문 기록을 기반으로 광고를 게재합니다.</li>
        <li style="${LI_STYLE}">Google은 광고 쿠키를 통해 이용자의 이전 방문 기록에 따라 관심사 기반
          맞춤 광고를 표시할 수 있습니다.</li>
        <li style="${LI_STYLE}">이용자는 <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google 광고 설정</a>에서
          맞춤 광고를 언제든지 해제할 수 있습니다.</li>
        <li style="${LI_STYLE}">Google 외 제3자 광고 사업자의 맞춤 광고 쿠키는
          <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer">www.aboutads.info/choices</a>에서
          일괄 거부할 수 있습니다.</li>
      </ul>
      <p style="${P_STYLE}">
        맞춤 광고를 해제해도 광고 자체는 계속 표시될 수 있으며, 이 경우 이용자의 관심사와 무관한
        일반 광고가 노출됩니다.
      </p>

      <h2 style="${H2_STYLE}">5. 쿠키 및 브라우저 저장소</h2>
      <p style="${P_STYLE}">
        본 서비스는 통계 분석 및 광고 제공을 위해 쿠키를 사용할 수 있습니다.
        브라우저 설정에서 쿠키 저장을 거부하거나 저장된 쿠키를 삭제할 수 있으나, 일부 기능이 제한될 수 있습니다.
        피드백 상태와 좋아요 기록은 브라우저 localStorage에만 저장되며 서버로 전송되지 않습니다.
      </p>

      <h2 style="${H2_STYLE}">6. 개인정보의 보관 및 파기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><strong>댓글·닉네임·IP·User-Agent</strong> — 서비스 운영 기간 보관, 삭제 요청 시 운영자가 해당 기록을 파기</li>
        <li style="${LI_STYLE}"><strong>좋아요 IP</strong> — 중복 방지를 위해 좋아요 기록과 함께 보관, 기록 삭제 시 함께 파기</li>
        <li style="${LI_STYLE}"><strong>방문 로그(GA)</strong> — Google 정책에 따라 보관(기본 26개월)</li>
        <li style="${LI_STYLE}"><strong>광고 쿠키</strong> — Google 광고 쿠키 정책에 따른 유효 기간 후 만료</li>
      </ul>
      <p style="${P_STYLE}">댓글·좋아요 기록에 포함된 접속 IP와 User-Agent는 해당 기록이 삭제될 때 함께 파기되며, 그 외 별도의 자동 파기 주기는 두고 있지 않습니다. 파기할 때는 복구할 수 없는 방법으로 지체 없이 처리합니다.</p>

      <h2 style="${H2_STYLE}">7. 이용자의 권리와 행사 방법</h2>
      <p style="${P_STYLE}">
        이용자는 본인이 작성한 댓글 등 자신과 관련된 정보에 대해 열람·정정·삭제·처리정지를
        요청할 수 있습니다. 아래 문의 이메일로 요청하시면 본인 확인 후 영업일 기준 10일 이내에
        처리 결과를 회신합니다. 본 서비스는 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.
      </p>
      <p style="${P_STYLE}">
        본 방침이 변경되는 경우 이 페이지에 개정일과 함께 게시하며, 수집 항목이 늘어나는 등
        중요한 변경은 시행 7일 전부터 공지합니다.
      </p>

      <h2 style="${H2_STYLE}">8. 문의</h2>
      <p style="${P_STYLE}">
        운영: ShakiLabs · 문의: <a href="mailto:skdba1313@gmail.com">skdba1313@gmail.com</a>
      </p>
    </article>`;
}

// =========================
// Terms of service (/terms)
// =========================
// Mirrors src/views/TermsView.vue for the same reason as buildPrivacyContent.
function buildTermsContent() {
  return `
    <article data-seo-prerender="terms" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:hsl(var(--muted-foreground));margin-bottom:10px;">
        <a href="/finance/salary" style="color:hsl(var(--muted-foreground));text-decoration:none;">홈</a> › 이용약관
      </nav>

      <h1 style="${H1_STYLE}">이용약관</h1>
      <p style="${P_STYLE}">시행 2026.03.21 · 개정 2026.08.05</p>

      <p style="${P_STYLE}">
        본 약관은 shakilabs.com/finance(이하 "서비스")가 제공하는 급여·세금·수당 계산 기능의 이용 조건과
        운영자·이용자의 권리와 의무를 정합니다. 서비스를 이용하는 경우 본 약관에 동의한 것으로 봅니다.
        약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있으며, 이용 중단에 따른 불이익은 없습니다.
      </p>

      <h2 style="${H2_STYLE}">1. 서비스의 성격</h2>
      <p style="${P_STYLE}">
        서비스는 연봉 실수령액, 건강보험료, 종합소득세, 퇴직금, 실업급여 등 급여·세금 관련 계산 기능과
        해설 콘텐츠를 무료로 제공합니다. 별도의 회원가입 없이 누구나 이용할 수 있으며, 모든 계산은
        2026년 공식 세율·요율 고시를 기반으로 하되 결과는 참고용 추정치입니다.
      </p>

      <h2 style="${H2_STYLE}">2. 정보 제공 목적의 한계</h2>
      <p style="${P_STYLE}">
        서비스가 제공하는 계산 결과와 해설은 일반적인 정보 제공만을 목적으로 하며,
        <strong>세무 상담·법률 자문·노무 상담이 아닙니다.</strong>
        개인의 구체적인 사정(비과세 항목, 감면 요건, 특수 고용 형태 등)에 따라 실제 금액은 달라질 수
        있으므로, 신고·납부·계약 등 법적 효과가 있는 의사결정 전에는 반드시 세무사·노무사 등
        자격 있는 전문가 또는 관할 기관(국세청, 국민건강보험공단, 고용노동부)의 확인을 받아야 합니다.
      </p>

      <h2 style="${H2_STYLE}">3. 면책 조항</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">계산 결과는 참고용 추정치이며 실제 지급액·납부액과 다를 수 있습니다. 운영자는 계산 결과에 근거한 의사결정으로 발생한 손해에 대해 책임을 지지 않습니다.</li>
        <li style="${LI_STYLE}">세율, 보험요율, 공제 조건은 관계 기관의 고시 변경에 따라 달라질 수 있으며, 개정 반영에는 시차가 있을 수 있습니다.</li>
        <li style="${LI_STYLE}">천재지변, 통신 장애, 호스팅 사업자의 사정 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
        <li style="${LI_STYLE}">이용자가 작성한 익명 댓글의 내용에 대한 책임은 작성자 본인에게 있습니다.</li>
      </ul>

      <h2 style="${H2_STYLE}">4. 광고 게재</h2>
      <p style="${P_STYLE}">
        서비스는 Google AdSense를 통한 광고를 게재하며, 광고 수익으로 무료 서비스를 운영합니다.
        광고는 콘텐츠와 구분되도록 표시되며, 광고 게재 위치와 노출 여부는 운영자가 조정할 수 있습니다.
        광고를 통해 연결되는 외부 사이트의 정보, 상품, 거래에 대한 책임은 해당 광고주와 외부
        사이트 운영자에게 있으며, 본 서비스는 광고주와 이용자 간 거래에 관여하지 않습니다.
      </p>

      <h2 style="${H2_STYLE}">5. 지식재산권</h2>
      <p style="${P_STYLE}">
        서비스의 계산 로직, 해설 콘텐츠, 화면 디자인 등 제작물에 대한 권리는 운영자에게 있습니다.
        개인적 이용, 링크 공유, 출처를 밝힌 인용은 자유롭게 할 수 있으나, 콘텐츠를 무단으로 복제해
        상업적으로 재배포하거나 자동화 수단으로 대량 수집하는 행위는 금지됩니다.
        법령·고시 등 공공 정보 자체에는 별도의 권리를 주장하지 않습니다.
      </p>

      <h2 style="${H2_STYLE}">6. 이용자의 의무</h2>
      <p style="${P_STYLE}">
        이용자는 서비스를 본래 목적에 맞게 이용해야 하며, 서버에 비정상적인 부하를 일으키는 행위,
        취약점을 악용하는 행위, 타인의 권리를 침해하거나 법령에 위반되는 내용을 게시하는 행위를
        해서는 안 됩니다. 위반 시 해당 이용이 제한될 수 있습니다.
      </p>

      <h2 style="${H2_STYLE}">7. 서비스 변경 및 중단</h2>
      <p style="${P_STYLE}">
        운영자는 계산 기준, 화면 구성, 제공 기능을 사전 공지 없이 변경하거나 중단할 수 있습니다.
        무료 서비스 특성상 변경·중단으로 인한 별도의 보상은 제공되지 않습니다.
        약관이 변경되는 경우 본 페이지에 개정일과 함께 게시합니다.
      </p>

      <h2 style="${H2_STYLE}">8. 준거법 및 분쟁 해결</h2>
      <p style="${P_STYLE}">
        본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련해 분쟁이 발생한 경우
        운영자와 이용자는 우선 성실히 협의해 해결합니다. 협의로 해결되지 않는 분쟁은
        민사소송법에 따른 관할 법원에 제기할 수 있습니다.
      </p>

      <h2 style="${H2_STYLE}">9. 계산 결과의 성격과 책임 범위</h2>
      <p style="${P_STYLE}">
        본 서비스가 제공하는 모든 계산 결과는 <strong>참고용 추정치</strong>이며 세무·노무 자문이 아닙니다.
        계산은 공개된 법령과 공공기관 고시를 기준으로 하지만, 실제 세액과 급여는 개인별 공제 항목,
        회사의 급여 규정, 관계 기관의 확정 판단에 따라 달라집니다. 따라서 계산 결과만을 근거로 한
        신고·납부·계약·소송 등의 의사결정에 대해 운영자는 법적 책임을 지지 않습니다.
      </p>
      <p style="${P_STYLE}">
        특히 세금 신고와 급여 정산은 최종적으로 국세청 홈택스, 국민건강보험공단, 국민연금공단,
        고용노동부 등 소관 기관의 확정 자료를 따라야 합니다. 본 서비스의 결과와 공식 자료가 다를 경우
        <strong>공식 자료가 우선</strong>합니다.
      </p>

      <h2 style="${H2_STYLE}">10. 계산 기준의 갱신</h2>
      <p style="${P_STYLE}">
        세율·요율은 법령 개정과 정부 고시에 따라 매년, 때로는 연중에도 바뀝니다. 운영자는 개정 사항을
        확인해 계산 로직과 안내 문구를 함께 갱신하며, 각 계산기 하단에 적용 기준과 시행일을 표시합니다.
        다만 개정 직후에는 반영에 시간이 걸릴 수 있으므로, 시행일 전후의 계산은 원문 고시와 교차
        확인하시기 바랍니다.
      </p>
      <p style="${P_STYLE}">
        이용자가 계산 결과의 오류를 발견한 경우 아래 문의처로 알려주시면 확인 후 수정합니다.
        오류 신고는 서비스 품질 유지에 큰 도움이 됩니다.
      </p>

      <h2 style="${H2_STYLE}">11. 문의</h2>
      <p style="${P_STYLE}">
        운영: ShakiLabs · 문의: <a href="mailto:skdba1313@gmail.com">skdba1313@gmail.com</a>
      </p>
    </article>`;
}

// =========================
// 루트 랜딩 페이지 리치 콘텐츠
// =========================

// 연봉 구간 표 — /salary 대표 페이지가 자기 변종들의 결과를 요약해 보여준다.
// 변종이 사이트맵에서 빠졌으므로 이 표의 링크가 크롤러의 유일한 진입 경로다.
function buildSalaryBandTable() {
  const rows = SALARY_AMOUNTS.map((amount) => {
    const result = calculateSalaryBreakdown({
      grossAnnual: amount * 10_000,
      nonTaxableMonthly: 200_000,
      dependents: 1,
      children: 0,
      retirementIncluded: false,
    });
    return `<tr>
      <td style="${TD_STYLE}"><a href="/finance/salary/${amount}">${formatManWonValue(amount)}원</a></td>
      <td style="${TD_STYLE}"><strong>${formatWon(result.monthlyNet)}</strong></td>
      <td style="${TD_STYLE}">${formatWon(result.totalDeduction)}</td>
      <td style="${TD_STYLE}">${formatPercent(result.effectiveTaxRate)}</td>
    </tr>`;
  }).join("");

  return `<table style="${TABLE_STYLE}">
      <thead><tr>
        <th style="${TH_STYLE}">연봉</th>
        <th style="${TH_STYLE}">월 실수령액</th>
        <th style="${TH_STYLE}">월 공제 합계</th>
        <th style="${TH_STYLE}">실효세율</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="${P_STYLE}">부양가족 1인·비과세 식대 월 20만원 기준입니다. 연봉이 오를수록 실효세율이 함께 오르는 누진 구조가 그대로 드러나며, 연봉을 클릭하면 해당 금액의 공제 항목별 상세 계산으로 이동합니다.</p>`;
}

// 건보료 구간 표 — 역산 결과를 구간별로 미리 보여주고 변종 31개로 가는 경로를 연다.
function buildInsuranceBandTable() {
  const rows = INSURANCE_AMOUNTS.map((fee) => {
    const monthlyTaxable = Math.floor(fee / RATES_2026.healthInsurance.employee);
    const estimatedAnnual = Math.round(((monthlyTaxable + 200_000) * 12) / 10_000);
    return `<tr>
      <td style="${TD_STYLE}"><a href="/finance/insurance/${fee}">${formatWon(fee)}</a></td>
      <td style="${TD_STYLE}">${formatWon(monthlyTaxable)}</td>
      <td style="${TD_STYLE}"><strong>약 ${formatManWonValue(estimatedAnnual)}원</strong></td>
    </tr>`;
  }).join("");

  return `<table style="${TABLE_STYLE}">
      <thead><tr>
        <th style="${TH_STYLE}">월 건강보험료(근로자 부담)</th>
        <th style="${TH_STYLE}">추정 월 과세급여</th>
        <th style="${TH_STYLE}">추정 세전 연봉</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="${P_STYLE}">비과세 식대 월 20만원을 더해 연봉으로 환산한 값입니다. 건보료를 클릭하면 해당 금액의 상세 역산 페이지로 이동합니다.</p>`;
}

const LANDING_CONTENT = {
  // App home. Copy lives in home-content.mjs because src/views/HomeView.vue renders the exact
  // same H1, H2 order and body text — the home no longer redirects to /salary, so a crawler and
  // a visitor must land on the same page. It still shares no body text with /salary (how
  // take-home pay is computed), /insurance (fee-to-salary reverse math) or /all (a bare index).
  "/": {
    h1: HOME_H1,
    intro: HOME_INTRO,
    description: HOME_DESCRIPTION,
    sections: HOME_SECTIONS,
    linksH2: HOME_LINKS_H2,
    linksAfterSection: HOME_LINKS_AFTER_SECTION,
    links: HOME_PRERENDER_LINKS,
  },
  "/salary": {
    h1: "2026 연봉 실수령액 계산기 | 월급·4대보험·소득세 자동 계산",
    intro:
      "2026년 최신 세율을 반영한 연봉 실수령액 계산기입니다. 세전 연봉을 입력하면 국민연금·건강보험·장기요양보험·고용보험 4대보험과 소득세·지방소득세를 자동 계산해 월 실수령액을 즉시 보여줍니다.",
    description:
      "본 계산기는 국세청 근로소득 간이세액표와 건보·연금·고용 공단 공식 고시 기반으로 동작합니다. 부양가족 수, 자녀세액공제, 비과세 식대·자가운전보조금을 반영해 실제 급여명세서에 가까운 결과를 산출합니다.",
    sections: [
      {
        h2: "월 실수령액이란?",
        body: "월 실수령액은 세전 월급에서 4대보험과 소득세·지방소득세를 공제한 후 통장에 실제 입금되는 금액입니다. 연봉만으로는 실제 받는 돈을 알 수 없으며, 공제 항목을 모두 차감해야 정확한 금액을 파악할 수 있습니다. 대한민국 직장인의 평균 실효세율은 약 14~17% 수준입니다.",
      },
      {
        h2: "4대보험 공제 항목 (2026년 요율)",
        body: "국민연금 근로자 부담 4.75% (2026년 7월 1일부터 상·하한 659만/41만), 건강보험 3.595%, 장기요양보험(건보료의 13.14%), 고용보험 0.9%를 적용합니다. 국민연금은 월 기준소득 659만원 초과분에 대해서는 추가 부담하지 않습니다.",
      },
      {
        h2: "소득세 계산 원리",
        body: "소득세는 누진세율 6~45%(8구간) 구조입니다. 과세표준은 (연봉 - 근로소득공제 - 인적공제 - 4대보험공제)로 산출되며, 여기에 해당 구간 세율을 적용한 뒤 근로소득세액공제·자녀세액공제·표준세액공제를 차감해 최종 결정세액이 나옵니다. 지방소득세는 결정세액의 10%가 자동 부과됩니다.",
      },
      {
        h2: "비과세 항목 활용",
        body: "월 20만원 식대 비과세는 과세표준에서 제외되어 4대보험과 소득세 모두 감면됩니다. 자가운전보조금(월 20만원 한도), 연구활동비(월 20만원 한도), 육아수당(월 10만원 한도) 등도 비과세 대상이므로 회사에 해당 항목 지급을 요청하면 실수령이 늘어날 수 있습니다.",
      },
      {
        h2: "연봉 구간별 월 실수령액 한눈에 보기",
        body: "아래 표는 이 계산기가 다루는 연봉 2,000만원~5억원 구간의 계산 결과를 요약한 것입니다. 각 구간의 상세 페이지에는 4대보험 항목별 공제액, 소득세 산출 과정, 부양가족 수에 따른 차이가 들어 있습니다.",
        extra: buildSalaryBandTable(),
      },
      {
        h2: "같은 인상률이라도 체감이 달라지는 이유",
        body: "표의 실효세율 열을 보면 연봉이 오를수록 세부담 비율이 함께 올라갑니다. 소득세가 6~45% 누진 구조이기 때문인데, 국민연금은 기준소득월액 상한 659만원(2026.7.1 시행)에서 멈추므로 고연봉 구간에서는 보험료 증가가 둔화되는 반대 효과도 있습니다. 두 힘이 겹쳐 실수령 증가폭은 연봉대마다 다르며, 이직 제안을 비교할 때는 인상률(%)이 아니라 월 실수령 증가액(원)으로 환산해 보아야 합니다.",
      },
    ],
    links: [
      { path: "/finance/salary/3000", label: "연봉 3000만원 실수령액" },
      { path: "/finance/salary/4000", label: "연봉 4000만원 실수령액" },
      { path: "/finance/salary/5000", label: "연봉 5000만원 실수령액" },
      { path: "/finance/salary/6000", label: "연봉 6000만원 실수령액" },
      { path: "/finance/salary/7000", label: "연봉 7000만원 실수령액" },
      { path: "/finance/salary/8000", label: "연봉 8000만원 실수령액" },
      { path: "/finance/salary/10000", label: "연봉 1억원 실수령액" },
      { path: "/finance/insurance", label: "건강보험료 역산 계산기" },
      { path: "/finance/compare", label: "이직 연봉 비교" },
    ],
  },
  "/insurance": {
    h1: "2026 건강보험료 역산 계산기 | 건보료로 연봉 추정",
    intro:
      "월 건강보험료를 입력하면 2026년 건강보험 요율 3.595%(근로자 부담) 기준으로 월 과세 급여와 연봉을 역산해주는 계산기입니다. 본인의 급여명세서나 건보공단에서 확인한 건보료로 추정 연봉을 확인할 수 있습니다.",
    description:
      "직장가입자의 건강보험료는 보수월액(세전 월 과세급여)에 3.595%를 곱해 산정하므로, 건보료를 알면 역으로 추정 연봉을 계산할 수 있습니다. 회사가 신고한 보수월액과 실제 월급이 다를 수 있으니 참고용으로 활용하세요.",
    sections: [
      {
        h2: "2026년 건강보험 요율",
        body: "국민건강보험공단 고시 기준 2026년 근로자 부담 건강보험 요율은 3.595%(사업주도 동일), 총 7.19%입니다. 장기요양보험은 건보료의 13.14%가 자동 부과됩니다. 건보료율은 매년 보건복지부가 고시하며, 최근 추세는 연 2~4% 수준 인상입니다.",
      },
      {
        h2: "역산 공식",
        body: "월 과세급여 = 월 건강보험료(근로자 부담) ÷ 0.03595. 예를 들어 월 건보료가 140,000원이면 월 과세급여는 약 3,894,000원이며, 비과세 식대 20만원 포함 월 세전 급여 약 4,094,000원, 연봉 약 4,912만원 수준입니다.",
      },
      {
        h2: "역산의 한계",
        body: "회사가 4월에 보수총액신고를 하므로, 성과급·상여금이 많았던 해에는 건보료가 일시적으로 높아질 수 있습니다. 또한 회사 신고 보수월액과 실제 월급이 다를 경우 역산 결과는 부정확할 수 있습니다. 정확한 연봉은 회사 급여명세서 또는 근로소득 원천징수영수증에서 확인하세요.",
      },
      {
        h2: "지역가입자 vs 직장가입자",
        body: "지역가입자는 직장가입자와 달리 소득·재산·자동차를 점수화해 보험료를 산정합니다. 퇴사 후 지역가입자로 전환 시 월 보험료는 소득보다는 재산·자동차에 크게 영향받으므로, 임의계속가입 제도를 활용하면 최대 36개월간 직장 요율을 유지할 수 있습니다.",
      },
      {
        h2: "피부양자 등록 요건",
        body: "직장가입자의 배우자·자녀·부모 등은 소득 연 2,000만원 이하, 재산 과세표준 5.4억 이하 요건을 충족하면 피부양자로 등록해 건보료를 면제받을 수 있습니다. 금융소득·연금소득·근로소득·사업소득의 합계로 판단합니다.",
      },
      {
        h2: "건보료 구간별 추정 연봉 표",
        body: "아래 표는 이 계산기가 다루는 월 건보료 5만원~50만원 구간의 역산 결과입니다. 본인 급여명세서의 건강보험 항목(근로자 부담분)과 가장 가까운 금액을 찾아 상세 페이지로 이동하면, 해당 구간의 4대보험 총액과 추정 실수령액까지 확인할 수 있습니다.",
        extra: buildInsuranceBandTable(),
      },
    ],
    links: [
      { path: "/finance/insurance/100000", label: "건보료 10만원 연봉 계산" },
      { path: "/finance/insurance/140000", label: "건보료 14만원 연봉 계산" },
      { path: "/finance/insurance/200000", label: "건보료 20만원 연봉 계산" },
      { path: "/finance/insurance/280000", label: "건보료 28만원 연봉 계산" },
      { path: "/finance/regional-health", label: "지역가입자 건보료 계산기" },
      { path: "/finance/salary", label: "연봉 실수령액 계산기" },
    ],
  },
};

function buildLandingContent(route) {
  const data = LANDING_CONTENT[route];
  if (!data) return null;

  const linksHtml = data.links
    .map(
      (l) =>
        `<li style="${LI_STYLE}"><a href="${l.path}">${l.label}</a></li>`
    )
    .join("");

  const sectionsHtml = data.sections.map(
    (s) =>
      `<h2 style="${H2_STYLE}">${s.h2}</h2><p style="${P_STYLE}">${s.body}</p>${s.extra ?? ""}`
  );

  const linksBlock = `<h2 style="${H2_STYLE}">${data.linksH2 ?? "관련 계산기 바로가기"}</h2><ul style="${UL_STYLE}">${linksHtml}</ul>`;
  // Routes may splice the link block mid-body so the static heading order matches the rendered
  // page (the home puts its hub right after the "which situation" section). Default: at the end.
  const linksIndex = Math.min(
    Number.isInteger(data.linksAfterSection) ? data.linksAfterSection : sectionsHtml.length,
    sectionsHtml.length
  );
  const bodyHtml = [
    ...sectionsHtml.slice(0, linksIndex),
    linksBlock,
    ...sectionsHtml.slice(linksIndex),
  ].join("");

  return `
    <article data-seo-prerender="landing" style="${ARTICLE_STYLE}">
      <h1 style="${H1_STYLE}">${data.h1}</h1>
      <p style="${P_STYLE}">${data.intro}</p>
      <p style="${P_STYLE}">${data.description}</p>
      ${bodyHtml}
      <p style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;">
        ※ 본 계산기는 2026년 공식 세율·요율 기반 추정치를 제공합니다. 법적 효력이 없는 참고용입니다.
      </p>
    </article>`;
}

// =========================
// 메인 엔트리
// =========================
export function buildRichContent(route, _meta) {
  if (route === "/about") return buildAboutContent();
  if (route === "/privacy") return buildPrivacyContent();
  if (route === "/terms") return buildTermsContent();
  const landing = buildLandingContent(route);
  if (landing) return landing;

  // Base calculator hubs. Checked before the amount-variant matchers below because "/salary" and
  // "/salary/5000" are different routes, and before prerender.mjs falls back to buildPrerenderGuide
  // — the hub replaces that 4-heading template with a body written for this specific calculator.
  const hub = buildHubContent(route);
  if (hub) return hub;

  const salaryMatch = route.match(SALARY_RE);
  if (salaryMatch) {
    const amount = parseInt10(salaryMatch[1]);
    if (amount !== null && amount > 0) return buildSalaryContent(amount);
  }

  const insuranceMatch = route.match(INSURANCE_RE);
  if (insuranceMatch) {
    const fee = parseInt10(insuranceMatch[1]);
    if (fee !== null && fee > 0) return buildInsuranceContent(fee);
  }

  const unpaidWageMatch = route.match(UNPAID_WAGE_RE);
  if (unpaidWageMatch) {
    const amount = parseInt10(unpaidWageMatch[1]);
    if (amount !== null && amount > 0) return buildUnpaidWageContent(amount);
  }

  const freelancerMatch = route.match(FREELANCER_RE);
  if (freelancerMatch) {
    const amount = parseInt10(freelancerMatch[1]);
    if (amount !== null && amount > 0) return buildFreelancerContent(amount);
  }

  const eitcMatch = route.match(EITC_RE);
  if (eitcMatch) {
    return buildEitcContent(eitcMatch[1]);
  }

  const compTaxMatch = route.match(COMPREHENSIVE_TAX_RE);
  if (compTaxMatch) {
    const amount = parseInt10(compTaxMatch[1]);
    if (amount !== null && amount > 0) return buildComprehensiveTaxContent(amount);
  }

  const compareMatch = route.match(COMPARE_RE);
  if (compareMatch) {
    const a = parseInt10(compareMatch[1]);
    const b = parseInt10(compareMatch[2]);
    if (a !== null && b !== null && a > 0 && b > 0) return buildCompareContent(a, b);
  }

  const quitMatch = route.match(QUIT_RE);
  if (quitMatch) {
    const years = parseInt10(quitMatch[1]);
    if (years !== null && years > 0) return buildQuitContent(years);
  }

  const unemploymentMatch = route.match(UNEMPLOYMENT_RE);
  if (unemploymentMatch) {
    const amount = parseInt10(unemploymentMatch[1]);
    if (amount !== null && amount > 0) return buildUnemploymentContent(amount);
  }

  const severanceMatch = route.match(SEVERANCE_PAY_RE);
  if (severanceMatch) {
    const years = parseInt10(severanceMatch[1]);
    if (years !== null && years > 0) return buildSeverancePayContent(years);
  }

  const yearEndMatch = route.match(YEAR_END_RE);
  if (yearEndMatch) {
    const amount = parseInt10(yearEndMatch[1]);
    if (amount !== null && amount > 0) return buildYearEndContent(amount);
  }

  const parentalMatch = route.match(PARENTAL_LEAVE_RE);
  if (parentalMatch) {
    const amount = parseInt10(parentalMatch[1]);
    if (amount !== null && amount > 0) return buildParentalLeaveContent(amount);
  }

  const withholdingMatch = route.match(WITHHOLDING_RE);
  if (withholdingMatch) {
    const amount = parseInt10(withholdingMatch[1]);
    if (amount !== null && amount > 0) return buildWithholdingContent(amount);
  }

  const weeklyHolidayMatch = route.match(WEEKLY_HOLIDAY_PAY_RE);
  if (weeklyHolidayMatch) {
    const amount = parseInt10(weeklyHolidayMatch[1]);
    if (amount !== null && amount > 0) return buildWeeklyHolidayPayContent(amount);
  }

  const wageConverterMatch = route.match(WAGE_CONVERTER_RE);
  if (wageConverterMatch) {
    const amount = parseInt10(wageConverterMatch[1]);
    if (amount !== null && amount > 0) return buildWageConverterContent(amount);
  }

  const regionalHealthMatch = route.match(REGIONAL_HEALTH_RE);
  if (regionalHealthMatch) {
    const amount = parseInt10(regionalHealthMatch[1]);
    if (amount !== null && amount > 0) return buildRegionalHealthContent(amount);
  }

  return null;
}
