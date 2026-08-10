// 상황별 가이드(/guide/*) 프리렌더 심화 본문
// 왜: 가이드 2종(연말정산·알바)이 계산기 링크 나열 + 일반론뿐이라 "가이드" 표방 대비 고유 본문이
// 500자대에 그쳤다. 검증된 2026 상수(src/data/yearEndSettlement.ts·laborFaqs.ts 미러)와 계산
// 엔진 출력만으로 수치·표 중심의 본문을 만들어 붙인다. 화면(SPA)은 기존 체인 UI를 유지하고,
// 이 본문은 크롤러가 보는 정적 HTML에만 들어간다(다른 계산기 상세 페이지와 같은 패턴).
import { calculateSalaryBreakdown, formatPercent, formatWon } from "./calc-engine.mjs";

const H2 = "font-size:20px;line-height:1.35;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid hsl(var(--highlight) / 0.3);color:hsl(var(--foreground));";
const P = "margin:0 0 10px;";
const TABLE = "width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:14px;";
const TH = "padding:8px 10px;background:hsl(var(--muted));text-align:left;border:1px solid hsl(var(--border));color:hsl(var(--foreground));font-weight:600;";
const TD = "padding:8px 10px;border:1px solid hsl(var(--border));";

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
          <tr style="background:hsl(var(--accent));">
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
          <tr style="background:hsl(var(--accent));">
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

// --- 이직 준비 (/guide/job-change) ---
// 체인은 "어느 계산기를 순서대로 열지"만 안내한다. 이직 판단에 실제로 필요한 것은 제안 연봉의
// 세후 증가액과 이직 과정에서 생기는 공백 비용이라, 두 가지를 수치로 보여준다.
function buildJobChangeDeepDive() {
  const pairs = [
    [4_000, 4_500],
    [5_000, 6_000],
    [6_000, 7_500],
    [8_000, 10_000],
  ];

  const rows = pairs
    .map(([from, to]) => {
      const a = calculateSalaryBreakdown({
        grossAnnual: from * 10_000,
        nonTaxableMonthly: 200_000,
        dependents: 1,
        children: 0,
        retirementIncluded: false,
      });
      const b = calculateSalaryBreakdown({
        grossAnnual: to * 10_000,
        nonTaxableMonthly: 200_000,
        dependents: 1,
        children: 0,
        retirementIncluded: false,
      });
      const nominal = (to - from) / from;
      const afterTax = (b.annualNet - a.annualNet) / a.annualNet;
      return `
          <tr>
            <td style="${TD}">${from.toLocaleString("ko-KR")}만 → ${to.toLocaleString("ko-KR")}만</td>
            <td style="${TD}">${formatPercent(nominal)}</td>
            <td style="${TD}"><strong>${formatPercent(afterTax)}</strong></td>
            <td style="${TD}">${formatWon(b.monthlyNet - a.monthlyNet)}</td>
          </tr>`;
    })
    .join("");

  return `
      <h2 style="${H2}">제안 연봉의 명목 인상률과 세후 인상률</h2>
      <p style="${P}">
        이직 제안을 받으면 인상률(%)부터 보게 되지만, 실제로 통장에 더 들어오는 돈은 그보다 적습니다.
        연봉이 오르면 소득세가 누진 구간을 따라 올라가고 4대보험료도 함께 늘기 때문입니다. 자주 있는
        네 가지 이직 구간에 대해 명목 인상률과 세후 인상률을 나란히 계산했습니다.
      </p>
      <table style="${TABLE}">
        <thead>
          <tr>
            <th style="${TH}">연봉 이동</th>
            <th style="${TH}">명목 인상률</th>
            <th style="${TH}">세후 인상률</th>
            <th style="${TH}">월 실수령 증가</th>
          </tr>
        </thead>
        <tbody>${rows}
        </tbody>
      </table>
      <p style="${P}">
        부양가족 1인·비과세 식대 월 20만원 기준입니다. 표에서 보듯 명목과 세후의 격차는 연봉이 높아질수록
        벌어집니다. 제안을 비교할 때는 인상률이 아니라 <strong>월 실수령 증가액(원)</strong>으로 환산해
        보아야 두 회사의 조건을 같은 잣대로 볼 수 있습니다.
      </p>

      <h2 style="${H2}">이직 과정에서 새는 돈</h2>
      <p style="${P}">
        연봉만 비교하면 놓치는 비용이 있습니다. 이직 시점에 따라 아래 항목에서 수백만 원 단위의 차이가
        생기므로, 최종 결정 전에 함께 계산하세요.
      </p>
      <ul style="margin:0 0 12px 20px;padding:0;">
        <li style="margin-bottom:4px;"><strong>퇴직금</strong> — 근속 1년을 채우지 못하고 옮기면 퇴직금이 발생하지 않습니다. 입사 기념일이 가깝다면 며칠 차이로 한 달치 평균임금이 갈립니다.</li>
        <li style="margin-bottom:4px;"><strong>연차수당</strong> — 남은 연차는 퇴사 시 수당으로 정산됩니다. 회계연도 기준으로 관리해 온 회사라면 입사일 기준으로 재계산해 더 유리한 쪽으로 받아야 합니다.</li>
        <li style="margin-bottom:4px;"><strong>성과급 지급 시점</strong> — 지급 기준일 전에 퇴사하면 전년도 성과급을 받지 못하는 경우가 많습니다. 취업규칙의 지급 요건을 확인하세요.</li>
        <li style="margin-bottom:4px;"><strong>공백 기간 건강보험</strong> — 퇴사와 입사 사이에 공백이 있으면 그 기간은 지역가입자가 됩니다. 하루라도 공백이 있으면 한 달치 보험료가 부과될 수 있습니다.</li>
        <li style="margin-bottom:4px;"><strong>연말정산 합산</strong> — 한 해에 두 회사에서 급여를 받으면 이전 회사의 원천징수영수증을 새 회사에 제출해 합산 정산해야 합니다. 누락하면 다음 해 5월에 종합소득세로 따로 신고해야 합니다.</li>
      </ul>
      <p style="${P}">
        특히 마지막 항목은 놓치기 쉽습니다. 두 회사 소득이 합산되면 누진 구간이 올라가 추가 납부가 나오는
        경우가 많으므로, <a href="/finance/year-end-settlement">연말정산 계산기</a>로 합산 기준 세액을
        미리 확인해 두면 2월에 당황하지 않습니다.
      </p>

      <h2 style="${H2}">연봉 협상에서 숫자로 말하는 법</h2>
      <p style="${P}">
        협상에서 "얼마를 원하느냐"는 질문을 받으면 대부분 희망 연봉을 말합니다. 하지만 상대가 듣고 싶은
        것은 <strong>근거</strong>입니다. 아래 세 가지를 미리 계산해 두면 대화의 축이 달라집니다.
      </p>
      <ul style="margin:0 0 12px 20px;padding:0;">
        <li style="margin-bottom:4px;"><strong>현재 총보상</strong> — 기본급뿐 아니라 성과급, 복리후생, 퇴직급여 적립분까지 합산한 금액입니다. 기본급만 비교하면 실제로는 손해인 이직을 이득으로 착각할 수 있습니다.</li>
        <li style="margin-bottom:4px;"><strong>세후 기준 목표액</strong> — 원하는 월 실수령액을 먼저 정하고 거꾸로 세전 연봉을 구합니다. 세전 금액만 놓고 협상하면 합의한 뒤에 기대와 다른 실수령을 받게 됩니다.</li>
        <li style="margin-bottom:4px;"><strong>비과세 구성</strong> — 같은 인건비라면 식대·자가운전보조금 한도를 채우는 쪽이 4대보험과 소득세를 함께 줄여 실수령이 더 늘어납니다. 연봉 인상이 어렵다는 답을 들었을 때 꺼낼 수 있는 대안입니다.</li>
      </ul>
      <p style="${P}">
        <a href="/finance/compare">이직 연봉 비교 계산기</a>에 현재 연봉과 제안 연봉을 넣으면 위 표와 같은
        방식으로 두 조건의 월 실수령 차이가 바로 나옵니다. 협상 자리에서 인상률이 아니라 금액으로
        이야기하면 논의가 훨씬 빨리 정리됩니다.
      </p>`;
}

// --- 퇴사 준비 (/guide/resignation) ---
// 퇴사는 "받을 돈"과 "새로 나갈 돈"이 동시에 생기는 상황이라, 체인 링크만으로는 판단이 안 된다.
// 퇴직금·실업급여·건강보험을 한 표에 놓고 순서와 기한을 못 박아 준다.
function buildResignationDeepDive() {
  const timeline = [
    ["퇴사 당일", "4대보험 상실 신고", "회사가 다음 달 15일까지 신고. 이 시점부터 직장가입자 자격이 끝난다."],
    ["퇴사 후 14일 이내", "금품 청산", "마지막 급여·퇴직금·연차수당 전부. 넘기면 연 20% 지연이자가 발생한다."],
    ["퇴사 후 즉시", "이직확인서 요청", "회사가 고용센터에 제출해야 실업급여 신청이 가능하다. 미제출 시 처리 지연의 가장 흔한 원인."],
    ["첫 고지서 후 2개월 내", "임의계속가입 신청", "직장 시절 보험료를 최대 36개월 유지. 이 기한을 놓치면 다시 신청할 수 없다."],
    ["퇴사 다음 날부터 12개월", "실업급여 수급 기간", "이 기간 안에 수급을 마쳐야 한다. 늦게 신청하면 남은 일수를 못 받는다."],
  ]
    .map(
      ([when, what, why]) => `
          <tr>
            <td style="${TD}"><strong>${when}</strong></td>
            <td style="${TD}">${what}</td>
            <td style="${TD}">${why}</td>
          </tr>`
    )
    .join("");

  return `
      <h2 style="${H2}">퇴사 후 놓치면 안 되는 기한</h2>
      <p style="${P}">
        퇴사와 관련된 권리는 대부분 <strong>기한이 지나면 사라집니다</strong>. 특히 임의계속가입과
        이직확인서는 며칠 차이로 수백만 원이 갈리는데도 아무도 먼저 알려주지 않습니다. 순서대로 정리했습니다.
      </p>
      <table style="${TABLE}">
        <thead>
          <tr>
            <th style="${TH}">시점</th>
            <th style="${TH}">할 일</th>
            <th style="${TH}">놓치면</th>
          </tr>
        </thead>
        <tbody>${timeline}
        </tbody>
      </table>

      <h2 style="${H2}">자발적 퇴사와 실업급여</h2>
      <p style="${P}">
        가장 많이 오해하는 지점입니다. 실업급여(구직급여)는 <strong>비자발적 이직</strong>이 원칙이라,
        스스로 사표를 낸 경우에는 원칙적으로 받을 수 없습니다. 다만 아래처럼 "정당한 이직 사유"로
        인정되면 자발적 퇴사여도 수급 자격이 생깁니다.
      </p>
      <ul style="margin:0 0 12px 20px;padding:0;">
        <li style="margin-bottom:4px;">2개월 이상 임금이 체불되었거나 최저임금에 미달한 경우</li>
        <li style="margin-bottom:4px;">사업장 이전·전근으로 통근에 왕복 3시간 이상 걸리게 된 경우</li>
        <li style="margin-bottom:4px;">질병·부상으로 업무 수행이 어렵고 회사가 배치 전환을 해 주지 못한 경우</li>
        <li style="margin-bottom:4px;">직장 내 괴롭힘·성희롱, 차별 대우가 있었던 경우</li>
        <li style="margin-bottom:4px;">임신·출산·육아로 계속 근무가 곤란하고 휴직이 허용되지 않은 경우</li>
      </ul>
      <p style="${P}">
        인정 여부는 고용센터가 사실관계로 판단하므로 <strong>증빙이 관건</strong>입니다. 체불이라면 급여
        명세서와 이체 내역, 괴롭힘이라면 메신저·이메일 기록을 퇴사 전에 확보해 두어야 합니다. 퇴사한
        뒤에는 회사 시스템에 접근할 수 없다는 점을 기억하세요.
      </p>
      <p style="${P}">
        받을 금액은 <a href="/finance/unemployment">실업급여 계산기</a>에서, 퇴사 후 건강보험 부담은
        <a href="/finance/regional-health">지역가입자 건보료 계산기</a>에서 미리 확인할 수 있습니다.
        두 금액을 합쳐 보면 다음 직장을 구할 때까지 버틸 수 있는 기간이 나옵니다.
      </p>

      <h2 style="${H2}">퇴사 후 건강보험, 세 가지 선택지</h2>
      <p style="${P}">
        퇴사하면 직장가입자 자격이 사라지고 자동으로 지역가입자가 됩니다. 보험료가 갑자기 오르는 이유는
        회사가 내던 절반이 사라지고, 소득뿐 아니라 재산과 자동차까지 점수로 환산해 부과되기 때문입니다.
        선택지는 세 가지이며 유리한 순서는 사람마다 다릅니다.
      </p>
      <ul style="margin:0 0 12px 20px;padding:0;">
        <li style="margin-bottom:4px;"><strong>피부양자 등재</strong> — 배우자나 자녀가 직장가입자라면 그 밑으로 들어가는 것이 가장 유리합니다. 요건을 충족하면 보험료가 0원입니다. 다만 연 합산소득 2,000만원과 재산 기준을 넘으면 등재할 수 없습니다.</li>
        <li style="margin-bottom:4px;"><strong>임의계속가입</strong> — 직전 18개월 중 직장가입 기간이 1년 이상이면 최대 36개월간 직장 시절 본인 부담분만 낼 수 있습니다. 신청 기한이 첫 지역보험료 납부기한에서 2개월 이내로 짧습니다.</li>
        <li style="margin-bottom:4px;"><strong>지역가입자 유지</strong> — 재산과 자동차가 거의 없고 소득도 없다면 오히려 지역가입자 보험료가 더 쌀 수 있습니다. 첫 고지서를 받아 본 뒤 임의계속가입과 비교해 결정하세요.</li>
      </ul>
      <p style="${P}">
        순서를 정리하면 <strong>피부양자 등재 가능 여부를 먼저 확인하고</strong>, 안 되면 첫 지역보험료
        고지서를 받아 임의계속가입 보험료와 비교한 뒤 2개월 안에 결정하는 흐름이 안전합니다.
        <a href="/finance/dependent">건보 피부양자 판정기</a>로 자격부터 확인해 보세요.
      </p>`;
}

const GUIDE_DEEP_DIVES = {
  "/guide/year-end": buildYearEndDeepDive,
  "/guide/part-time": buildPartTimeDeepDive,
  "/guide/job-change": buildJobChangeDeepDive,
  "/guide/resignation": buildResignationDeepDive,
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
