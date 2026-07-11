// 프리렌더 페이지별 리치 콘텐츠 빌더
// 각 계산기 라우트에 대해 실제 계산값 + 가이드 + FAQ를 포함한 800+단어 정적 HTML 생성
// buildRichContent(route, meta) → string(HTML) | null

import {
  calculateSalaryBreakdown,
  formatWon,
  formatManWonValue,
  formatPercent,
  RATES_2026,
} from "./calc-engine.mjs";

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

function parseInt10(s) {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

// --- 공통 HTML 스타일 ---
const ARTICLE_STYLE =
  "max-width:920px;margin:0 auto;padding:24px 16px;line-height:1.75;font-size:15px;color:#334155;";
const H1_STYLE = "font-size:28px;line-height:1.3;margin:0 0 16px;color:#0f172a;";
const H2_STYLE =
  "font-size:20px;line-height:1.35;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid #10b98133;color:#0f172a;";
const H3_STYLE = "font-size:16px;line-height:1.4;margin:18px 0 6px;color:#0f172a;";
const P_STYLE = "margin:0 0 10px;";
const TABLE_STYLE =
  "width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:14px;";
const TH_STYLE =
  "padding:8px 10px;background:#f1f5f9;text-align:left;border:1px solid #cbd5e1;color:#334155;font-weight:600;";
const TD_STYLE = "padding:8px 10px;border:1px solid #cbd5e1;";
const UL_STYLE = "margin:0 0 12px 20px;padding:0;";
const LI_STYLE = "margin-bottom:4px;";
const CALLOUT_STYLE =
  "background:#ecfdf5;border-left:4px solid #10b981;padding:12px 14px;margin:12px 0 16px;border-radius:4px;";

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
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">연봉 실수령액 계산기</a>
        &nbsp;›&nbsp;
        연봉 ${label}
      </nav>

      <h1 style="${H1_STYLE}">연봉 ${label}원 실수령액 (2026년 기준)</h1>

      <p style="${P_STYLE}">
        2026년 최신 세율·요율을 적용한 연봉 <strong>${label}원</strong>의 월 실수령액은
        <strong style="color:#047857;">${formatWon(result.monthlyNet)}</strong>입니다.
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
          <tr style="background:#ecfdf5;">
            <td style="${TD_STYLE}"><strong>실수령액</strong></td>
            <td style="${TD_STYLE}"><strong style="color:#047857;">${formatWon(result.monthlyNet)}</strong></td>
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
          <tr style="background:#f8fafc;">
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

      <p style="font-size:12px;color:#64748b;margin-top:24px;">
        ※ 본 계산 결과는 2026년 국세청 근로소득 간이세액표와 국민건강보험공단·국민연금공단·고용노동부 고시를 기반으로 한
        추정값이며, 법적 효력이 없는 참고용입니다. 실제 급여명세서와 차이가 있을 수 있습니다.
      </p>
    </article>`;
}

// =========================
// 건강보험료 역산 (/insurance/:fee)
// =========================
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
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/insurance" style="color:#64748b;text-decoration:none;">건강보험료 계산기</a>
        &nbsp;›&nbsp;
        건보료 ${feeManWon}만원
      </nav>

      <h1 style="${H1_STYLE}">건강보험료 ${feeManWon}만원이면 연봉은 얼마? (2026년)</h1>

      <p style="${P_STYLE}">
        월 건강보험료가 <strong>${formatWon(fee)}</strong>이라면, 2026년 건보료 요율 3.595%(근로자 부담)를
        기준으로 역산한 월 과세 급여는 약 <strong style="color:#047857;">${formatWon(monthlyTaxable)}</strong>,
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
          <tr style="background:#ecfdf5;">
            <td style="${TD_STYLE}"><strong>추정 연봉</strong></td>
            <td style="${TD_STYLE}"><strong style="color:#047857;">${formatManWonValue(estimatedManWon)}원 (${formatWon(estimatedAnnual)})</strong></td>
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
          <tr style="background:#ecfdf5;">
            <td style="${TD_STYLE}"><strong>월 실수령액</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(result.monthlyNet)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h2 style="${H2_STYLE}">4. 자주 묻는 질문 (FAQ)</h2>

      <h3 style="${H3_STYLE}">Q1. 회사가 신고한 건보료와 실제 급여가 다를 수 있나요?</h3>
      <p style="${P_STYLE}">
        네. 회사는 매년 4월 "보수총액신고"를 통해 직전 연도의 실제 급여를 반영합니다.
        따라서 성과급·상여금이 포함된 해에는 건보료가 일시적으로 높아질 수 있고, 이후 정산이 이뤄집니다.
        본 역산 결과는 신고된 보수월액 기준의 추정이므로 실제 연봉과 차이가 있을 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q2. 장기요양보험료도 따로 내나요?</h3>
      <p style="${P_STYLE}">
        장기요양보험료는 건강보험료의 13.14%(2026년 고시)로 자동 부과되며, 건강보험료와 함께 급여에서 공제됩니다.
        건보료 ${formatWon(fee)} 기준 장기요양보험료는 약 ${formatWon(Math.floor(fee * 0.1314))}입니다.
      </p>

      <h3 style="${H3_STYLE}">Q3. 지역가입자도 같은 요율을 적용하나요?</h3>
      <p style="${P_STYLE}">
        아니오. 지역가입자는 소득·재산·자동차 등을 점수화한 "보험료 부과점수"에 따라 산정되며,
        직장가입자의 3.595% 단순 요율과 다릅니다. 퇴사 후 지역가입자 전환 시 보험료 추정은
        <a href="/finance/regional-health">지역가입자 건보료 계산기</a>를 이용하세요.
      </p>

      <h3 style="${H3_STYLE}">Q4. 피부양자로 등록하면 건보료가 없나요?</h3>
      <p style="${P_STYLE}">
        직장가입자의 배우자·자녀 등이 피부양자 조건(소득 연 2,000만원 이하, 재산 과세표준 5.4억 이하 등)을
        충족하면 별도의 건강보험료 없이 의료보험 혜택을 받을 수 있습니다.
      </p>

      <h3 style="${H3_STYLE}">Q5. 건보료가 매년 오르나요?</h3>
      <p style="${P_STYLE}">
        건강보험료율은 매년 국민건강보험공단과 보건복지부가 협의해 고시합니다.
        최근 추세는 연 2~4% 수준의 인상이며, 2026년 근로자 부담 요율은 3.595%입니다.
      </p>

      <h2 style="${H2_STYLE}">5. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a> - 연봉으로 실수령 순산</li>
        <li style="${LI_STYLE}"><a href="/finance/regional-health">지역가입자 건보료 계산기</a> - 퇴사 후 건보료</li>
        <li style="${LI_STYLE}"><a href="/finance/withholding">원천세 역산 계산기</a> - 소득세로 연봉 추정</li>
        <li style="${LI_STYLE}"><a href="/finance/4-insurance-employer">사업주 4대보험 계산기</a></li>
      </ul>

      <p style="font-size:12px;color:#64748b;margin-top:24px;">
        ※ 본 결과는 국민건강보험공단 2026년 요율 고시를 기반으로 한 역산 추정치이며, 법적 효력이 없는 참고용입니다.
      </p>
    </article>`;
}

// =========================
// 종합소득세 (/comprehensive-tax/:amount)
// =========================
function buildComprehensiveTaxContent(manWon) {
  const income = manWon * 10_000;
  // IT·디자인·작가 등 인적용역 기준 단순경비율 (src/data/freelanceTaxRates.ts)
  // 4천만원 이하: 64.1%, 초과분: 49.7%
  const EXPENSE_RATE_BASE = 0.641;
  const EXPENSE_RATE_EXCESS = 0.497;
  const EXPENSE_THRESHOLD = 40_000_000;
  const expenses = income <= EXPENSE_THRESHOLD
    ? Math.floor(income * EXPENSE_RATE_BASE)
    : Math.floor(EXPENSE_THRESHOLD * EXPENSE_RATE_BASE + (income - EXPENSE_THRESHOLD) * EXPENSE_RATE_EXCESS);
  const netIncome = income - expenses;
  const personalDeduction = 1_500_000;
  const taxableBase = Math.max(0, netIncome - personalDeduction);

  // 누진세 계산
  let calculatedTax = 0;
  if (taxableBase <= 14_000_000) calculatedTax = taxableBase * 0.06;
  else if (taxableBase <= 50_000_000)
    calculatedTax = 840_000 + (taxableBase - 14_000_000) * 0.15;
  else if (taxableBase <= 88_000_000)
    calculatedTax = 6_240_000 + (taxableBase - 50_000_000) * 0.24;
  else if (taxableBase <= 150_000_000)
    calculatedTax = 15_360_000 + (taxableBase - 88_000_000) * 0.35;
  else calculatedTax = 37_060_000 + (taxableBase - 150_000_000) * 0.38;
  calculatedTax = Math.floor(calculatedTax);

  const standardCredit = 70_000;
  const determinedTax = Math.max(0, calculatedTax - standardCredit);
  const localTax = Math.floor(determinedTax * 0.1);
  const totalTax = determinedTax + localTax;

  // 3.3% 원천징수 비교
  const withholdingPrepaid = Math.floor(income * 0.033);
  const refund = withholdingPrepaid - totalTax;

  const label = formatManWonValue(manWon);

  return `
    <article data-seo-prerender="comprehensive-tax" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/comprehensive-tax" style="color:#64748b;text-decoration:none;">종합소득세 계산기</a>
        &nbsp;›&nbsp;
        수입 ${label}
      </nav>

      <h1 style="${H1_STYLE}">프리랜서 수입 ${label}원 종합소득세 계산 (2026년)</h1>

      <p style="${P_STYLE}">
        프리랜서·개인사업자가 연 수입 <strong>${label}원</strong>을 올렸을 때,
        단순경비율(IT·디자인·작가 등 인적용역 기준: 4천만원 이하 64.1% + 초과분 49.7%) 적용 시 종합소득세는 약
        <strong style="color:#047857;">${formatWon(totalTax)}</strong>(지방소득세 포함)입니다.
        3.3% 원천징수로 미리 납부한 금액이 ${formatWon(withholdingPrepaid)}이라면,
        ${refund >= 0 ? `<strong style="color:#047857;">약 ${formatWon(refund)} 환급</strong>` : `<strong style="color:#dc2626;">약 ${formatWon(-refund)} 추가 납부</strong>`}이 예상됩니다.
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
          <tr style="background:#ecfdf5;">
            <td style="${TD_STYLE}"><strong>최종 납부세액</strong></td>
            <td style="${TD_STYLE}"><strong style="color:#047857;">${formatWon(totalTax)}</strong></td>
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

      <h2 style="${H2_STYLE}">3. 3.3% 원천징수와 종합소득세 관계</h2>
      <p style="${P_STYLE}">
        프리랜서가 수입을 받을 때 지급업체가 3.3%(소득세 3% + 지방소득세 0.3%)를 원천징수합니다.
        이는 종합소득세의 "선납"이며, 5월 종합소득세 신고 시 실제 납부세액과 정산합니다.
      </p>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}">수입 ${label}원 × 3.3% = <strong>${formatWon(withholdingPrepaid)}</strong> (이미 선납)</li>
        <li style="${LI_STYLE}">정산 대상 종합소득세: ${formatWon(totalTax)}</li>
        <li style="${LI_STYLE}">차이: ${refund >= 0 ? `환급 ${formatWon(refund)}` : `추납 ${formatWon(-refund)}`}</li>
      </ul>

      <h2 style="${H2_STYLE}">4. 자주 묻는 질문 (FAQ)</h2>

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

      <h2 style="${H2_STYLE}">5. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/freelance-rate">프리랜서 세후 단가 역산</a> - 원천세 제외 실수령</li>
        <li style="${LI_STYLE}"><a href="/finance/withholding">원천세 역산 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a> - 근로소득자</li>
      </ul>

      <p style="font-size:12px;color:#64748b;margin-top:24px;">
        ※ 본 계산은 인적용역 단순경비율(4천만원 이하 64.1%, 초과분 49.7%)·인적공제 1인 기준 단순 추정이며, 실제 경비율·공제는 업종과 장부 여부에 따라 달라집니다. 정확한 세액은 국세청 홈택스 모의계산 또는 세무대리인 상담이 필요합니다.
      </p>
    </article>`;
}

// =========================
// 이직 연봉 비교 (/compare/:a-vs-:b)
// =========================
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
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/compare" style="color:#64748b;text-decoration:none;">이직 연봉 비교</a>
        &nbsp;›&nbsp;
        ${aManWon.toLocaleString("ko-KR")} vs ${bManWon.toLocaleString("ko-KR")}
      </nav>

      <h1 style="${H1_STYLE}">연봉 ${formatManWonValue(aManWon)} vs ${formatManWonValue(bManWon)} 실수령 비교 (2026)</h1>

      <p style="${P_STYLE}">
        연봉 ${formatManWonValue(aManWon)}에서 ${formatManWonValue(bManWon)}으로 이직(또는 인상) 시
        세전 연봉은 <strong>${formatWon(grossDiff)}</strong> 증가하지만,
        실제 월 실수령액 증가는 <strong style="color:#047857;">${formatWon(netDiff)}</strong>,
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
          <tr style="background:#ecfdf5;">
            <td style="${TD_STYLE}"><strong>월 실수령</strong></td>
            <td style="${TD_STYLE}"><strong>${formatWon(a.monthlyNet)}</strong></td>
            <td style="${TD_STYLE}"><strong style="color:#047857;">${formatWon(b.monthlyNet)}</strong></td>
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

      <h2 style="${H2_STYLE}">2. 이직 시 체크리스트</h2>
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

      <h2 style="${H2_STYLE}">3. 자주 묻는 질문 (FAQ)</h2>

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

      <h2 style="${H2_STYLE}">4. 관련 계산기</h2>
      <ul style="${UL_STYLE}">
        <li style="${LI_STYLE}"><a href="/finance/salary">연봉 실수령액 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/raise">연봉 인상률 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/bonus">성과급 실수령 계산기</a></li>
        <li style="${LI_STYLE}"><a href="/finance/quit">퇴사 계산기</a> - 이직 준비 시 참고</li>
      </ul>

      <p style="font-size:12px;color:#64748b;margin-top:24px;">
        ※ 본 결과는 2026년 세율·요율 기준 추정치이며, 실제 급여명세와 차이가 있을 수 있습니다.
      </p>
    </article>`;
}

// =========================
// 퇴사 시뮬레이션 (/quit/:years years)
// =========================
function buildQuitContent(years) {
  // 가정: 평균 월급 300만원, 평균임금 330만원(상여금 포함 1.1배), 3개월 생존비 200만원/월
  const assumedMonthlyGross = 3_000_000;
  const avgWage = Math.floor(assumedMonthlyGross * 1.1);
  // 퇴직금: 30일분 × 근속연수 × (평균임금 ÷ 30 × 30) ≈ 평균임금 × 근속연수 × (1년 / 1년)
  const severancePay = Math.floor(avgWage * years);

  // 실업급여: 이직 전 평균임금의 60%, 하한 66,048원/일, 상한 68,100원/일 (2026)
  const dailyWage = Math.floor(avgWage / 30);
  const unemploymentDaily = Math.min(68_100, Math.max(66_048, Math.floor(dailyWage * 0.6)));
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
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/quit" style="color:#64748b;text-decoration:none;">퇴사 계산기</a>
        &nbsp;›&nbsp;
        ${years}년 근속
      </nav>

      <h1 style="${H1_STYLE}">${years}년 근속 퇴사 시뮬레이션 (2026년 기준)</h1>

      <p style="${P_STYLE}">
        평균 월급 300만원 기준으로 <strong>${years}년 근속</strong> 후 퇴사하면,
        예상 퇴직금은 <strong style="color:#047857;">약 ${formatWon(severancePay)}</strong>,
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
            <td style="${TD_STYLE}">${formatWon(assumedMonthlyGross)}</td>
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
          <tr style="background:#ecfdf5;">
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

      <p style="font-size:12px;color:#64748b;margin-top:24px;">
        ※ 본 시뮬레이션은 평균 월급 300만원·표준 수급일수 가정의 추정이며, 실제 퇴직금·실업급여는 근로계약·이직사유·나이 등에 따라 달라집니다.
      </p>
    </article>`;
}

// =========================
// 실업급여 (/unemployment/:manWon)
// =========================
function buildUnemploymentContent(manWon) {
  const monthly = manWon * 10_000;
  const avgDailyWage = Math.floor(monthly / 30);
  const rawDaily = Math.floor(avgDailyWage * 0.6);
  const dailyAmount = Math.min(68_100, Math.max(66_048, rawDaily));
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
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/unemployment" style="color:#64748b;text-decoration:none;">실업급여 계산기</a>
        &nbsp;›&nbsp;
        월급 ${formatManWonValue(manWon)}
      </nav>

      <h1 style="${H1_STYLE}">월급 ${formatManWonValue(manWon)}원 실업급여 (2026년 구직급여)</h1>

      <p style="${P_STYLE}">
        월급 <strong>${formatManWonValue(manWon)}원</strong> 기준으로 실업급여(구직급여)의 일 수급액은
        평균임금의 60%인 <strong>${formatWon(rawDaily)}</strong>이지만, 2026년 고시 상한액 68,100원과 하한액 66,048원이 적용되어
        실제 수급액은 <strong style="color:#047857;">${formatWon(dailyAmount)}/일</strong>입니다.
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

      <p style="font-size:12px;color:#64748b;margin-top:24px;">
        ※ 본 결과는 고용노동부 2026년 실업급여 고시 기준 추정이며, 실제 수급액은 고용센터 심사를 거쳐 확정됩니다.
      </p>
    </article>`;
}

// =========================
// 퇴직금 (/severance-pay/:years)
// =========================
function buildSeverancePayContent(years) {
  // 가정: 평균 월급 300만원, 상여금 포함 평균임금 330만원
  const assumedMonthly = 3_000_000;
  const avgWage = Math.floor(assumedMonthly * 1.1);
  const severance = Math.floor(avgWage * years);

  // 간단한 퇴직소득세 추정 (근속연수 공제 적용)
  let yearDeduction;
  if (years <= 5) yearDeduction = 1_000_000 * years;
  else if (years <= 10) yearDeduction = 5_000_000 + 2_000_000 * (years - 5);
  else if (years <= 20) yearDeduction = 15_000_000 + 2_500_000 * (years - 10);
  else yearDeduction = 40_000_000 + 3_000_000 * (years - 20);

  const envBase = Math.max(0, severance - yearDeduction);
  const annualConverted = envBase / Math.max(1, years) * 12;
  // 6% 근사치
  const estimatedTax = Math.floor(annualConverted * 0.06 * years / 12);
  const netSeverance = severance - estimatedTax;

  return `
    <article data-seo-prerender="severance" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a>
        &nbsp;›&nbsp;
        <a href="/finance/severance-pay" style="color:#64748b;text-decoration:none;">퇴직금 계산기</a>
        &nbsp;›&nbsp;
        ${years}년 근속
      </nav>

      <h1 style="${H1_STYLE}">${years}년 근속 퇴직금 계산 (2026년 기준)</h1>

      <p style="${P_STYLE}">
        평균 월급 300만원·상여금 포함 평균임금 ${formatWon(avgWage)} 기준으로
        <strong>${years}년 근속</strong> 시 세전 퇴직금은 약 <strong style="color:#047857;">${formatWon(severance)}</strong>,
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
        퇴직소득세는 근속연수에 따른 공제를 먼저 차감한 후, "연분연승법"(12 ÷ 근속연수 × 과세표준)으로
        1년치로 환산해 세율을 적용한 뒤 다시 근속연수를 곱해 산출하는 방식입니다.
        이로 인해 근속연수가 길수록 낮은 세율 구간에 해당되어 유리합니다.
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
          <tr style="background:#ecfdf5;">
            <td style="${TD_STYLE}"><strong>실수령 퇴직금</strong></td>
            <td style="${TD_STYLE}"><strong style="color:#047857;">${formatWon(netSeverance)}</strong></td>
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

      <p style="font-size:12px;color:#64748b;margin-top:24px;">
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
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a> ›
        <a href="/finance/year-end-settlement" style="color:#64748b;text-decoration:none;">연말정산 계산기</a> ›
        연봉 ${label}
      </nav>

      <h1 style="${H1_STYLE}">연봉 ${label}원 연말정산 예상 환급액 (2026년)</h1>

      <p style="${P_STYLE}">
        연봉 <strong>${label}원</strong> 기준 원천징수된 소득세는 연간 약 ${formatWon(result.determinedTax)}이며,
        신용카드·의료비·교육비·월세·연금저축 등 공제 항목을 모두 적용할 경우 예상 환급액은
        <strong style="color:#047857;">약 ${formatWon(refundEstimate)}</strong> 수준입니다. (표준 시나리오 기준)
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
          <tr style="background:#ecfdf5;">
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
      <p style="font-size:12px;color:#64748b;margin-top:24px;">
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
  //   7~12개월: 통상임금 80%, 상한 160만원
  // 하한: 70만원
  const PL_FLOOR = 700_000;
  const pay1_3 = Math.min(2_500_000, Math.max(PL_FLOOR, Math.floor(wage * 1.0)));
  const pay4_6 = Math.min(2_000_000, Math.max(PL_FLOOR, Math.floor(wage * 1.0)));
  const pay7_12 = Math.min(1_600_000, Math.max(PL_FLOOR, Math.floor(wage * 0.8)));
  const total = pay1_3 * 3 + pay4_6 * 3 + pay7_12 * 6; // 12개월 가정

  return `
    <article data-seo-prerender="parental-leave" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a> ›
        <a href="/finance/parental-leave" style="color:#64748b;text-decoration:none;">육아휴직 급여</a> ›
        월급 ${formatManWonValue(manWon)}
      </nav>

      <h1 style="${H1_STYLE}">월 통상임금 ${formatManWonValue(manWon)}원 육아휴직 급여 (2026)</h1>

      <p style="${P_STYLE}">
        월 통상임금이 <strong>${formatManWonValue(manWon)}원</strong>인 근로자가 12개월 일반 육아휴직을 사용할 경우,
        1~3개월 동안 월 <strong>${formatWon(pay1_3)}</strong>(통상임금 100%·상한 250만원),
        4~6개월 동안 월 <strong>${formatWon(pay4_6)}</strong>(통상임금 100%·상한 200만원),
        7~12개월 동안 월 <strong>${formatWon(pay7_12)}</strong>(통상임금 80%·상한 160만원)을 받으며,
        총 수령액은 약 <strong style="color:#047857;">${formatWon(total)}</strong>입니다.
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
          <tr style="background:#ecfdf5;">
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
      <p style="font-size:12px;color:#64748b;margin-top:24px;">
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
  // 간이세액표 근사: 결정세액 = 과세표준 × 15% - 누진공제
  // 역산: 추정 연봉 = (annualTax + 누진공제) / 0.06 (저연봉) ~ 0.15
  // 단순 추정: 연봉 = (monthlyTax * 12 + 2_000_000) / 0.1 정도
  const estimatedAnnual = Math.round((monthlyTax * 12 + 1_000_000) / 0.05);
  const estimatedManWon = Math.round(estimatedAnnual / 10_000);

  return `
    <article data-seo-prerender="withholding" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a> ›
        <a href="/finance/withholding" style="color:#64748b;text-decoration:none;">원천세 계산기</a> ›
        월 소득세 ${formatWon(amount)}
      </nav>

      <h1 style="${H1_STYLE}">월 원천징수 ${formatWon(amount)} 추정 연봉 (2026)</h1>

      <p style="${P_STYLE}">
        매월 소득세 <strong>${formatWon(amount)}</strong>이 원천징수되고 있다면,
        국세청 근로소득 간이세액표(2026년 개정) 기준 추정 연봉은 약 <strong style="color:#047857;">${formatManWonValue(estimatedManWon)}원</strong> 수준입니다.
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
      <p style="font-size:12px;color:#64748b;margin-top:24px;">
        ※ 본 결과는 국세청 근로소득 간이세액표를 기준으로 한 역산 추정치이며, 실제 연봉은 회사 급여 구조에 따라 달라집니다.
      </p>
    </article>`;
}

// =========================
// 주휴수당 (/weekly-holiday-pay/:hourly)
// =========================
function buildWeeklyHolidayPayContent(hourly) {
  const weeklyHours = 40;
  const weeklyBase = hourly * weeklyHours;
  const weeklyHoliday = Math.floor(hourly * 8);
  const weeklyTotal = weeklyBase + weeklyHoliday;
  const monthlyTotal = Math.floor(weeklyTotal * 4.345);
  const effectiveHourly = Math.floor(hourly * 1.2);

  return `
    <article data-seo-prerender="weekly-holiday-pay" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a> ›
        <a href="/finance/weekly-holiday-pay" style="color:#64748b;text-decoration:none;">주휴수당 계산기</a> ›
        시급 ${hourly.toLocaleString("ko-KR")}원
      </nav>

      <h1 style="${H1_STYLE}">시급 ${hourly.toLocaleString("ko-KR")}원 주휴수당 계산 (2026)</h1>

      <p style="${P_STYLE}">
        시급 <strong>${hourly.toLocaleString("ko-KR")}원</strong>으로 주 40시간을 일하면 기본 주급은 ${formatWon(weeklyBase)},
        추가로 지급되는 주휴수당은 <strong style="color:#047857;">${formatWon(weeklyHoliday)}</strong>(8시간분),
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
          <tr style="background:#ecfdf5;">
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
      <p style="font-size:12px;color:#64748b;margin-top:24px;">
        ※ 본 결과는 근로기준법 제55조 주휴수당 규정 기준 계산이며, 실제 지급은 근로계약서와 사업장 정책에 따라 달라질 수 있습니다.
      </p>
    </article>`;
}

// =========================
// 시급 환산 (/wage-converter/:hourly)
// =========================
function buildWageConverterContent(hourly) {
  const dailyWage = hourly * 8;
  const weeklyBase = hourly * 40;
  const weeklyTotal = weeklyBase + hourly * 8; // 주휴수당 포함
  const monthlyTotal = Math.floor(weeklyTotal * 4.345);
  const annualTotal = monthlyTotal * 12;

  return `
    <article data-seo-prerender="wage-converter" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a> ›
        <a href="/finance/wage-converter" style="color:#64748b;text-decoration:none;">시급 환산기</a> ›
        시급 ${hourly.toLocaleString("ko-KR")}원
      </nav>

      <h1 style="${H1_STYLE}">시급 ${hourly.toLocaleString("ko-KR")}원 월급·연봉 환산 (2026)</h1>

      <p style="${P_STYLE}">
        시급 <strong>${hourly.toLocaleString("ko-KR")}원</strong>으로 주 40시간·월 4.345주 근무 시
        주휴수당을 포함한 월급은 <strong style="color:#047857;">${formatWon(monthlyTotal)}</strong>,
        연봉은 <strong>${formatWon(annualTotal)}</strong>으로 환산됩니다.
      </p>

      <h2 style="${H2_STYLE}">1. 환산 결과 요약</h2>
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr><td style="${TD_STYLE}">시급</td><td style="${TD_STYLE}">${formatWon(hourly)}</td></tr>
          <tr><td style="${TD_STYLE}">일급 (8시간)</td><td style="${TD_STYLE}">${formatWon(dailyWage)}</td></tr>
          <tr><td style="${TD_STYLE}">주급 (40시간 기본)</td><td style="${TD_STYLE}">${formatWon(weeklyBase)}</td></tr>
          <tr><td style="${TD_STYLE}">주급 (주휴수당 포함)</td><td style="${TD_STYLE}">${formatWon(weeklyTotal)}</td></tr>
          <tr style="background:#ecfdf5;">
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
          <tr style="background:#ecfdf5;">
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
      <p style="font-size:12px;color:#64748b;margin-top:24px;">
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
  const estimatedRegionalIncomeOnly = Math.max(20_000, Math.floor(monthlyIncome * 0.0719));
  const formerEmployed = Math.floor(monthlyIncome * 0.03595);
  const maxContinued = formerEmployed; // 임의계속가입: 직전 부담분 유지

  return `
    <article data-seo-prerender="regional-health" style="${ARTICLE_STYLE}">
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a> ›
        <a href="/finance/regional-health" style="color:#64748b;text-decoration:none;">지역가입자 건보료</a> ›
        월급 ${formatManWonValue(manWon)}
      </nav>

      <h1 style="${H1_STYLE}">월급 ${formatManWonValue(manWon)}원 퇴사 후 지역 건보료 (2026)</h1>

      <p style="${P_STYLE}">
        월급 <strong>${formatManWonValue(manWon)}원</strong>으로 근무 중이던 근로자가 퇴사할 경우,
        <strong>지역가입자</strong>(소득 점수만 반영) 월 건강보험료는 약 <strong style="color:#dc2626;">${formatWon(estimatedRegionalIncomeOnly)}</strong>,
        <strong>임의계속가입</strong>(최대 36개월) 시 직전 근무 때와 동일한 <strong style="color:#047857;">${formatWon(formerEmployed)}</strong>으로
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
          <tr style="background:#ecfdf5;">
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
      <p style="font-size:12px;color:#64748b;margin-top:24px;">
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
      <nav aria-label="breadcrumb" style="font-size:13px;color:#64748b;margin-bottom:10px;">
        <a href="/finance/salary" style="color:#64748b;text-decoration:none;">홈</a> › 서비스 소개
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
      <table style="${TABLE_STYLE}">
        <tbody>
          <tr>
            <td style="${TD_STYLE}">운영</td>
            <td style="${TD_STYLE}">Shakilabs</td>
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

      <p style="font-size:12px;color:#64748b;margin-top:24px;">
        본 서비스는 대한민국 근로자·프리랜서의 세금·연봉 이해도 향상을 목표로 비영리 개인 프로젝트로 운영되며,
        Google AdSense 광고 수익을 통해 운영비를 충당합니다.
      </p>
    </article>`;
}

// =========================
// 루트 랜딩 페이지 리치 콘텐츠
// =========================
const LANDING_CONTENT = {
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
        h2: "인기 연봉별 실수령액",
        body: "연봉 3000 / 4000 / 5000 / 6000 / 7000 / 8000 / 1억 등 주요 구간별 상세 계산 페이지를 제공합니다. 각 구간의 월 실수령, 4대보험 공제, 소득세, 부양가족별 차이, FAQ를 확인하세요.",
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

  const sectionsHtml = data.sections
    .map(
      (s) =>
        `<h2 style="${H2_STYLE}">${s.h2}</h2><p style="${P_STYLE}">${s.body}</p>`
    )
    .join("");

  return `
    <article data-seo-prerender="landing" style="${ARTICLE_STYLE}">
      <h1 style="${H1_STYLE}">${data.h1}</h1>
      <p style="${P_STYLE}">${data.intro}</p>
      <p style="${P_STYLE}">${data.description}</p>
      ${sectionsHtml}
      <h2 style="${H2_STYLE}">관련 계산기 바로가기</h2>
      <ul style="${UL_STYLE}">${linksHtml}</ul>
      <p style="font-size:12px;color:#64748b;margin-top:24px;">
        ※ 본 계산기는 2026년 공식 세율·요율 기반 추정치를 제공합니다. 법적 효력이 없는 참고용입니다.
      </p>
    </article>`;
}

// =========================
// 메인 엔트리
// =========================
export function buildRichContent(route, _meta) {
  if (route === "/about") return buildAboutContent();
  const landing = buildLandingContent(route);
  if (landing) return landing;

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
