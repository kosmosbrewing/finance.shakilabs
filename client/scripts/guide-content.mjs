// 상황별 가이드(/guide/*) 프리렌더 심화 본문
// 왜: 가이드 2종(연말정산·알바)이 계산기 링크 나열 + 일반론뿐이라 "가이드" 표방 대비 고유 본문이
// 500자대에 그쳤다. 검증된 2026 상수(src/data/yearEndSettlement.ts·laborFaqs.ts 미러)와 계산
// 엔진 출력만으로 수치·표 중심의 본문을 만들어 붙인다. 화면(SPA)은 기존 체인 UI를 유지하고,
// 이 본문은 크롤러가 보는 정적 HTML에만 들어간다(다른 계산기 상세 페이지와 같은 패턴).
import { calculateSalaryBreakdown, formatPercent, formatWon } from "./calc-engine.mjs";

const H2 = "font-size:20px;line-height:1.35;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid #10b98133;color:#0f172a;";
const P = "margin:0 0 10px;";
const TABLE = "width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:14px;";
const TH = "padding:8px 10px;background:#f1f5f9;text-align:left;border:1px solid #cbd5e1;color:#334155;font-weight:600;";
const TD = "padding:8px 10px;border:1px solid #cbd5e1;";

const MIN_WAGE_HOURLY = 10_320;
const WEEKS_PER_MONTH = 4.345;

// --- 연말정산 준비 (/guide/year-end) ---
function buildYearEndDeepDive() {
  // 총급여 5,000만원 예시 — 부양가족 1인·비과세 월 20만원·퇴직금 별도 표준 시나리오
  const example = calculateSalaryBreakdown({
    grossAnnual: 50_000_000,
    nonTaxableMonthly: 200_000,
    dependents: 1,
    children: 0,
    retirementIncluded: false,
  });

  const limitRows = [
    ["신용카드 등 소득공제", "총급여 25% 초과 사용분", "신용 15%·체크/현금영수증 30%, 한도 300만원(총급여 7천만원 이하)·250만원(초과)"],
    ["연금저축·IRP 세액공제", "납입액 × 공제율", "연금저축 600만원·IRP 합산 900만원, 총급여 5,500만원 이하 15%·초과 12%"],
    ["월세 세액공제", "연간 월세액 × 공제율", "한도 1,000만원, 총급여 5,500만원 이하 17%·8,000만원 이하 15%"],
    ["보장성보험료 세액공제", "납입액 × 12%", "연 100만원 한도"],
    ["의료비 세액공제", "총급여 3% 초과분 × 15%", "연 700만원 한도"],
    ["교육비 세액공제", "지출액 × 15%", "본인 한도 없음, 자녀 300만원(대학생 900만원)"],
    ["기부금 세액공제", "기부액 × 15%", "1,000만원 초과분은 30%"],
    ["인적공제(부양가족)", "1인당 150만원 소득공제", "소득·나이 요건 판정 필요"],
    ["자녀세액공제", "자녀 수 기준 정액", "1명 25만원·2명 55만원·셋째부터 1명당 40만원 추가"],
  ]
    .map(
      ([item, method, limit]) => `
          <tr>
            <td style="${TD}">${item}</td>
            <td style="${TD}">${method}</td>
            <td style="${TD}">${limit}</td>
          </tr>`
    )
    .join("");

  return `
      <h2 style="${H2}">2026 연말정산 주요 공제 한도표</h2>
      <p style="${P}">
        공제는 "무엇을 먼저 채우느냐"로 환급이 갈립니다. 한도가 크고 공제율이 높은 항목부터 점검할 수
        있도록 2026년 기준 주요 공제를 한 표로 정리했습니다. 소득공제는 과세표준을 줄이고, 세액공제는
        계산된 세금에서 바로 빼는 항목입니다.
      </p>
      <table style="${TABLE}">
        <thead>
          <tr>
            <th style="${TH}">항목</th>
            <th style="${TH}">계산 방식</th>
            <th style="${TH}">한도·요율 (2026)</th>
          </tr>
        </thead>
        <tbody>${limitRows}
        </tbody>
      </table>

      <h2 style="${H2}">총급여 5,000만원 예시 — 결정세액이 나오는 과정</h2>
      <p style="${P}">
        연말정산의 뼈대는 "총급여 → 과세표준 → 산출세액 → 결정세액" 순서입니다. 부양가족 1인(본인)·
        비과세 식대 월 20만원 기준으로 총급여 5,000만원 직장인의 흐름을 계산 엔진 그대로 따라가면
        다음과 같습니다.
      </p>
      <table style="${TABLE}">
        <tbody>
          <tr>
            <td style="${TD}">연간 과세 급여</td>
            <td style="${TD}">${formatWon(example.annualTaxableIncome)}</td>
          </tr>
          <tr>
            <td style="${TD}">근로소득공제</td>
            <td style="${TD}">-${formatWon(example.earnedIncomeDeduction)}</td>
          </tr>
          <tr>
            <td style="${TD}">인적공제 (본인 1인)</td>
            <td style="${TD}">-${formatWon(example.personalDeduction)}</td>
          </tr>
          <tr>
            <td style="${TD}">4대보험료 공제 (연간)</td>
            <td style="${TD}">-${formatWon(example.annualInsuranceDeduction)}</td>
          </tr>
          <tr style="background:#ecfdf5;">
            <td style="${TD}"><strong>과세표준</strong></td>
            <td style="${TD}"><strong>${formatWon(example.taxableBase)}</strong></td>
          </tr>
          <tr>
            <td style="${TD}">산출세액 (누진세율 적용)</td>
            <td style="${TD}">${formatWon(example.calculatedTax)}</td>
          </tr>
          <tr>
            <td style="${TD}">근로소득세액공제</td>
            <td style="${TD}">-${formatWon(example.taxCredit)}</td>
          </tr>
          <tr>
            <td style="${TD}">표준세액공제</td>
            <td style="${TD}">-${formatWon(example.standardTaxCredit)}</td>
          </tr>
          <tr style="background:#ecfdf5;">
            <td style="${TD}"><strong>결정세액 (지방소득세 별도)</strong></td>
            <td style="${TD}"><strong>${formatWon(example.determinedTax)} (+지방 ${formatWon(example.annualLocalTax)})</strong></td>
          </tr>
        </tbody>
      </table>
      <p style="${P}">
        위 표는 추가 공제를 하나도 넣지 않은 기본값입니다. 여기에 카드 공제·연금계좌·월세 같은 공제를
        얹을수록 과세표준과 결정세액이 내려갑니다. 예를 들어 이 예시에서 과세표준은 소득세 15% 구간에
        있으므로, 소득공제 100만원을 추가로 인정받으면 지방소득세를 포함해 세금이 약
        ${formatWon(Math.floor(1_000_000 * 0.15 * 1.1))} 줄어드는 효과가 있습니다.
      </p>

      <h2 style="${H2}">환급과 추가 납부가 갈리는 지점</h2>
      <p style="${P}">
        회사는 매달 간이세액표 기준으로 소득세를 원천징수합니다. 연말정산은 이렇게 미리 낸 세금의 1년
        합계와 위에서 계산한 결정세액을 비교하는 절차입니다. 미리 낸 세금이 더 많으면 차액이 환급되고,
        적으면 추가 납부가 나옵니다. 즉 "환급 = 보너스"가 아니라 내 돈을 돌려받는 정산이므로, 공제를
        늘려 결정세액 자체를 낮추는 것이 실제 절세입니다. 내 조건의 예상 환급·추납은
        <a href="/finance/year-end-settlement">연말정산 계산기</a>에서, 매달 떼이는 원천세가 적정한지는
        <a href="/finance/withholding">원천세 역산 계산기</a>에서 확인할 수 있습니다.
      </p>
      <p style="${P}">
        일정도 공제만큼 중요합니다. 간소화 자료는 1월 중순 열리고 회사 제출은 보통 1~2월에 마감되는데,
        연금저축·IRP처럼 "납입 시점"이 기준인 공제는 12월 31일까지 넣은 금액만 인정됩니다. 반대로
        부양가족 등록이나 월세 계약 요건 정리는 서류 준비만 하면 되므로 마감 직전에도 챙길 수 있습니다.
      </p>`;
}

// --- 알바·단기 근로 (/guide/part-time) ---
function buildPartTimeDeepDive() {
  const hourly = MIN_WAGE_HOURLY;
  const weeklyHoursRows = [15, 20, 25, 30, 35, 40]
    .map((hours) => {
      const baseMonthly = Math.round(hourly * hours * WEEKS_PER_MONTH);
      // 주휴수당: 주 15시간 이상 개근 시 시급 × (주 근무시간 ÷ 40) × 8
      const weeklyHolidayMonthly = hours >= 15 ? Math.round(hourly * (hours / 40) * 8 * WEEKS_PER_MONTH) : 0;
      return `
          <tr>
            <td style="${TD}">주 ${hours}시간</td>
            <td style="${TD}">${formatWon(baseMonthly)}</td>
            <td style="${TD}">${formatWon(weeklyHolidayMonthly)}</td>
            <td style="${TD}"><strong>${formatWon(baseMonthly + weeklyHolidayMonthly)}</strong></td>
          </tr>`;
    })
    .join("");

  const overtimeBase = hourly * 10;
  const overtimePremium = Math.round(hourly * 10 * 0.5);

  return `
      <h2 style="${H2}">주휴수당 — 조건과 계산 공식</h2>
      <p style="${P}">
        주휴수당은 옵션이 아니라 근로기준법 제55조의 법정 의무입니다. 조건은 두 가지입니다. 주 15시간
        이상 일하기로 정해져 있고, 그 주의 소정 근로일을 모두 개근하면 하루치 유급 주휴가 발생합니다.
        주 15시간 미만 초단시간 근로자는 대상이 아닙니다. 금액은
        <strong>시급 × (주 근무시간 ÷ 40) × 8시간</strong>으로 계산합니다. 2026년 최저시급
        ${formatWon(hourly)} 기준, 주 40시간 근무라면 주휴수당을 포함한 실질 시급은 약 12,384원이
        됩니다.
      </p>

      <h2 style="${H2}">2026 최저시급 ${formatWon(hourly)} 기준 — 근무시간별 월급 조견표</h2>
      <p style="${P}">
        월 평균 4.345주(365일 ÷ 12개월 ÷ 7일) 기준으로 근무시간별 기본급과 주휴수당을 계산한 표입니다.
        구인공고의 "월급"이 주휴수당 포함인지 아닌지 이 표와 비교해 보세요.
      </p>
      <table style="${TABLE}">
        <thead>
          <tr>
            <th style="${TH}">주 근무시간</th>
            <th style="${TH}">기본 월급</th>
            <th style="${TH}">주휴수당(월)</th>
            <th style="${TH}">합계</th>
          </tr>
        </thead>
        <tbody>${weeklyHoursRows}
        </tbody>
      </table>
      <p style="${P}">
        주 14시간처럼 일부러 15시간 아래로 계약하는 "쪼개기 근무"는 주휴수당이 발생하지 않는 구조라는
        뜻입니다. 계약서의 소정 근로시간을 반드시 확인하고, 내 시급이 맞는지는
        <a href="/finance/wage-converter">시급·월급 환산 계산기</a>로, 주휴수당 금액은
        <a href="/finance/weekly-holiday-pay">주휴수당 계산기</a>로 검산하세요.
      </p>
      <p style="${P}">
        월급으로 받는 알바라면 역방향 검산이 필요합니다. 월급을 주휴 포함 월 환산 시간으로 나눠 시급을
        구하는 방식입니다. 예를 들어 주 40시간 근무에 월급 200만원이라면 월 환산 시간은 48시간 ×
        4.345주 ≈ 208.6시간이고, 시급은 2,000,000 ÷ 208.6 ≈ ${formatWon(9_590)}으로 2026년 최저시급
        ${formatWon(MIN_WAGE_HOURLY)}에 미달합니다. 이 경우 차액은 청구 대상입니다.
      </p>

      <h2 style="${H2}">연장·야간·휴일 가산수당 — 50%가 붙는 경우</h2>
      <p style="${P}">
        5인 이상 사업장이라면 연장·야간(22시~06시)·휴일 근로에 통상임금의 50% 가산이 붙습니다.
        최저시급 ${formatWon(hourly)} 알바가 한 달에 연장근로를 10시간 했다면, 기본
        ${formatWon(overtimeBase)}에 가산 ${formatWon(overtimePremium)}을 더한
        ${formatWon(overtimeBase + overtimePremium)}을 받아야 합니다. 야간이면서 연장이면 가산이 중복
        적용됩니다. 스케줄 기준 가산액은 <a href="/finance/overtime">연장·야간·휴일수당 계산기</a>에서
        계산할 수 있습니다.
      </p>

      <h2 style="${H2}">그만둘 때 정산 체크 — 연차수당과 밀린 임금</h2>
      <p style="${P}">
        1년 미만이라도 한 달을 개근하면 연차 1일이 생기고, 못 쓴 연차는 수당으로 청구할 수 있습니다.
        그리고 마지막 급여·주휴수당·연차수당은 퇴직 후 14일 안에 지급돼야 하며, 늦어지면 연 20%
        지연이자가 붙습니다. 못 받은 금액이 있다면 <a href="/finance/annual-leave">연차수당 계산기</a>와
        <a href="/finance/unpaid-wage">임금체불 지연이자 계산기</a>로 청구 금액을 정리한 뒤, 고용노동부
        노동포털에 진정을 제기할 수 있습니다. 표에서 계산한 "받아야 할 돈"과 실제 입금액의 차액이 그대로
        청구 근거가 됩니다.
      </p>`;
}

const GUIDE_DEEP_DIVES = {
  "/guide/year-end": buildYearEndDeepDive,
  "/guide/part-time": buildPartTimeDeepDive,
};

// 체인 HTML의 "다른 상황 가이드" 앞에 심화 본문을 끼워 넣는다. 마커가 사라지면 빌드를 세운다.
export function appendGuideDeepDive(html, route) {
  const builder = GUIDE_DEEP_DIVES[route];
  if (!builder) return html;
  const marker = "<h2>다른 상황 가이드</h2>";
  if (!html.includes(marker)) {
    throw new Error(`[guide-content] Missing insertion marker for ${route}`);
  }
  return html.replace(marker, `${builder()}\n      ${marker}`);
}
