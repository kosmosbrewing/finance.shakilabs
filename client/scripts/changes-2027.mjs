// 2027년 달라지는 세금·지원금 — 항목 레지스트리 (화면·프리렌더·테스트가 같은 모듈을 쓴다)
//
// 규칙 (docs/CHANGES_2027_PLAN_2026-09-25.md §2):
//  - 숫자는 1차 출처(부처 보도자료·세제개편안 상세본·정책브리핑)에서만 옮긴다. 언론 기사는 출처가 아니다.
//  - "안"은 확정처럼 쓰지 않는다: status로 확정/국회 심의 중을 가르고, 문장은 "~한다(개정안)" 수준에 둔다.
//  - 모르는 것도 적는다: 지방국립대 명단처럼 미발표면 미발표라고 쓴다. 추측 목록 금지.
//  - 현행 수치가 finance 계산기 상수와 겹치는 항목은 src/data 상수와 같아야 한다(테스트가 대조한다).
// 12월 국회 의결 뒤 status·수치를 갱신하고 CHANGES_2027_VERIFIED_AT을 올린다.

export const CHANGES_2027_VERIFIED_AT = "2026-09-25";

export const CHANGES_2027_META = {
  path: "/2027",
  heading: "2027년 달라지는 세금·지원금",
  intro: "2026년 세제개편안과 2027년 예산안, 확정된 고시를 전후 숫자로 모았습니다.",
  title: "2027년 달라지는 세금·지원금 한눈에 | 세법개정안·예산안 정리",
  description:
    "최저임금·근로장려금·월세 공제·아이맞이지원금·지방국립대 등록금 등 2027년 달라지는 26가지를 확정·심의 중으로 나눠 전후 숫자로 정리.",
};

export const CHANGE_AREAS = [
  { id: "pay", label: "급여·근로" },
  { id: "deduction", label: "연말정산" },
  { id: "family", label: "출산·육아·결혼" },
  { id: "youth", label: "청년·교육" },
  { id: "asset", label: "주거·자산" },
  { id: "car", label: "자동차" },
];

export const CHANGE_STATUSES = {
  passed: { label: "확정", tone: "success" },
  review: { label: "국회 심의 중", tone: "warning" },
};

export const CHANGE_SOURCES = {
  taxReform: {
    title: "재정경제부 「2026년 세제개편안」 상세본",
    url: "https://mofe.go.kr/nw/nes/detailNesDtaView.do?searchBbsId1=MOSFBBS_000000000028&searchNttId1=MOSF_000000000078809&menuNo=4010100",
    date: "2026-08-03",
  },
  minWage: {
    title: "고용노동부 2027년 적용 최저임금",
    url: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19659",
    date: "2026-07-14",
  },
  childcare: {
    title: "보건복지부 양육지원급여 개편 보도참고자료",
    url: "https://www.korea.kr/briefing/pressReleaseView.do?newsId=156775938",
    date: "2026-08-28",
  },
  budget: {
    title: "정책브리핑 2027년 예산안",
    url: "https://www.korea.kr/news/policyNewsView.do?newsId=148970973",
    date: "2026-09-01",
  },
  youthBudget: {
    title: "정책브리핑 2027년 청년정책 예산",
    url: "https://www.korea.kr/news/policyNewsView.do?newsId=148970791",
    date: "2026-08-28",
  },
  budgetCard: {
    title: "정책브리핑 '나에게 올 2027년 예산안' 카드뉴스",
    url: "https://www.korea.kr/multi/visualNewsView.do?newsId=148971392",
    date: "2026-09-07",
  },
  marriageBudget: {
    title: "정책브리핑 2027년 성평등가족부 예산",
    url: "https://www.korea.kr/news/policyFocusView.do?newsId=148971059&pkgId=49500845",
    date: "2026-09-02",
  },
};

const FINANCE = "finance";
const calc = (app, path, label) => ({ app, path, label });

export const CHANGES_2027 = [
  // ── 급여·근로 ──
  {
    id: "min-wage", area: "pay", status: "passed", source: "minWage",
    title: "최저임금 시간당 10,700원",
    line: "2027년 최저임금이 시간당 10,700원으로 380원(3.7%) 오릅니다.",
    before: "시간당 10,320원 · 월 2,156,880원",
    after: "시간당 10,700원 · 월 2,236,300원",
    target: "모든 근로자",
    effective: "2027년 1월 1일",
    calc: calc(FINANCE, "/wage-converter", "시급·월급 환산"),
    details: ["월 금액은 주 40시간, 주휴 포함 월 209시간 기준입니다."],
  },
  {
    id: "eitc", area: "pay", status: "review", source: "taxReform",
    title: "근로장려금 기준·지급액 상향",
    line: "근로장려금을 받을 수 있는 소득 기준과 최대 지급액이 가구 유형별로 오릅니다.",
    before: "단독 2,200만 원 미만·최대 165만 원 · 홑벌이 3,200만·285만 · 맞벌이 4,400만·330만",
    after: "단독 2,600만 원 미만·최대 180만 원 · 홑벌이 3,700만·310만 · 맞벌이 5,200만·360만",
    target: "근로·사업소득이 있는 저소득 가구",
    effective: "2027년 소득분부터 (2028년 신청)",
    calc: calc(FINANCE, "/eitc", "근로장려금 계산"),
    details: ["맞벌이 가구는 최대액을 받는 소득 구간도 800만~1,700만 원에서 800만~1,800만 원으로 넓어집니다."],
  },
  {
    id: "withholding-rate", area: "pay", status: "review", source: "taxReform",
    title: "배달·강연 원천징수 3% → 2%",
    line: "배달·강연 같은 인적용역 소득에서 미리 떼는 원천징수 세율이 3%에서 2%로 내려갑니다.",
    before: "3% (지방소득세 포함 3.3%)",
    after: "2% (지방소득세 포함 2.2%)",
    target: "배달라이더·강사 등 인적용역 사업자",
    effective: "2027년 1월 1일 이후 받는 소득",
    calc: calc(FINANCE, "/freelancer", "프리랜서 세금 계산"),
    details: [
      "보험설계사·방문판매원처럼 연말정산 대상인 인적용역은 3%를 유지합니다.",
      "원천징수는 미리 내는 세금이라 최종 세액은 5월 종합소득세 신고에서 정산됩니다.",
    ],
  },
  {
    id: "sme-youth", area: "pay", status: "review", source: "taxReform",
    title: "중소기업 취업 청년 감면, 지방은 더 길게",
    line: "중소기업에 취업한 청년의 소득세 90% 감면 기간이 근무지에 따라 최대 10년까지 늘어납니다.",
    before: "청년 5년간 90% 감면 (지역 구분 없음)",
    after: "수도권 5년 · 지역에 따라 6년·7년·10년 (모두 90%)",
    target: "중소기업에 취업한 15~34세 청년",
    effective: "2027년 1월 1일 이후 취업자 (감면 기한 2029년 말까지 연장)",
    details: [
      "고령자·장애인·경력단절 근로자도 근무지에 따라 3년간 70~90%로 우대됩니다.",
      "지역 구분은 행정안전부 지방우대지수를 반영해 시행령으로 정합니다.",
    ],
  },
  {
    id: "birth-bonus", area: "pay", status: "review", source: "taxReform",
    title: "회사 출산지원금 비과세, 임신 때부터",
    line: "회사가 주는 출산지원금의 비과세 범위가 임신 중에 받은 돈까지 넓어집니다.",
    before: "자녀 출생일 이후 2년 이내 받은 금액 비과세",
    after: "임신일부터 출생일 이후 2년 이내 받은 금액 비과세 (자녀당 2회까지)",
    target: "회사에서 출산지원금을 받는 근로자",
    effective: "2027년 1월 1일 이후 받는 금액",
  },

  // ── 연말정산 ──
  {
    id: "rent-credit", area: "deduction", status: "review", source: "taxReform",
    title: "월세 세액공제 한도 1,200만 원",
    line: "월세 세액공제를 받을 수 있는 연간 월세 한도가 1,000만 원에서 1,200만 원으로 늘어납니다.",
    before: "연 월세 1,000만 원까지 · 공제율 15% (총급여 5,500만 원 이하 17%)",
    after: "연 월세 1,200만 원까지 · 15~34세 청년은 총급여 5,500만 원을 넘어도 17%",
    target: "총급여 8,000만 원 이하 무주택 근로자",
    effective: "2027년 1월 1일 이후 내는 월세",
    calc: calc(FINANCE, "/monthly-rent-deduction", "월세 세액공제 계산"),
    details: ["청년 17% 특례는 2029년 말까지 적용됩니다."],
  },
  {
    id: "dependent-income", area: "deduction", status: "review", source: "taxReform",
    title: "부양가족 소득 기준 100만 → 300만 원",
    line: "배우자·부양가족을 기본공제에 올릴 수 있는 소득 기준이 연 100만 원에서 300만 원으로 오릅니다.",
    before: "연 소득금액 100만 원 이하 (근로소득만 있으면 총급여 500만 원 이하)",
    after: "연 소득금액 300만 원 이하 (근로소득만 있으면 총급여 750만 원 이하)",
    target: "배우자·부양가족이 있는 근로자·사업자",
    effective: "2027년 소득분부터 (2028년 초 연말정산)",
    calc: calc(FINANCE, "/year-end-settlement", "연말정산 계산"),
    details: [
      "기본공제는 1인당 150만 원 소득공제입니다.",
      "건강보험 피부양자 기준(연 소득 2,000만 원)과는 다른 제도입니다.",
    ],
  },
  {
    id: "youth-irp", area: "deduction", status: "review", source: "taxReform",
    title: "청년 IRP 세액공제 15%",
    line: "15~34세 청년은 총급여와 관계없이 IRP 납입액의 15%를 세액공제받습니다.",
    before: "12% (총급여 5,500만 원 이하 15%)",
    after: "15~34세 청년은 소득과 관계없이 15%",
    target: "IRP에 납입하는 15~34세",
    effective: "2027년 1월 1일 이후 납입분",
    calc: calc(FINANCE, "/irp", "IRP 세액공제 계산"),
    details: ["세액공제 한도는 연금저축 포함 연 900만 원으로 같습니다."],
  },
  {
    id: "card-transit", area: "deduction", status: "review", source: "taxReform",
    title: "대중교통 추가공제 종료",
    line: "신용카드 소득공제에서 대중교통 40% 추가공제가 끝나고 교통비 재정지원으로 바뀝니다.",
    before: "대중교통·전통시장 40% · 도서·공연 등 30% (총급여 7,000만 원 이하만)",
    after: "대중교통 추가공제 종료 (전통시장 40% 유지) · 도서·공연 등 30%는 소득 제한 없음",
    target: "신용카드 소득공제를 받는 근로자",
    effective: "2027년 소득분부터",
    calc: calc(FINANCE, "/year-end-settlement", "연말정산 계산"),
    details: ["추가공제 한도는 100만 원씩 낮아집니다: 총급여 7,000만 원 이하 300만 → 200만 원, 초과 200만 → 100만 원."],
  },
  {
    id: "birth-marriage-credit", area: "deduction", status: "review", source: "taxReform",
    title: "출산·혼인 세액공제 → 현금 지원",
    line: "출산·입양·혼인 세액공제가 없어지고 아이맞이지원금·혼인지원금 같은 현금 지원으로 바뀝니다.",
    before: "출산·입양 첫째 30만·둘째 50만·셋째 이상 70만 원 · 혼인 1인당 50만 원 세액공제",
    after: "세액공제 종료 → 아이맞이지원금·혼인지원금(가칭)",
    target: "출산·입양·혼인신고를 하는 사람",
    effective: "혼인 세액공제는 2026년 혼인신고까지 · 출산·입양은 법안 확정 때 적용 시기 확인",
  },
  {
    id: "preschool-academy", area: "deduction", status: "review", source: "taxReform",
    title: "취학 전 학원비 공제 축소",
    line: "취학 전 아이의 교육비 세액공제에서 예능 학원이 아닌 학원비는 빠집니다.",
    before: "유치원·어린이집·학원·체육시설 교육비 15%",
    after: "학원비는 음악·미술·무용 학원만 인정",
    target: "취학 전 자녀를 둔 부모",
    effective: "2027년 1월 1일 이후 내는 교육비",
    calc: calc(FINANCE, "/year-end-settlement", "연말정산 계산"),
  },
  {
    id: "mortgage-residence", area: "deduction", status: "review", source: "taxReform",
    title: "주담대 이자 소득공제, 실거주만",
    line: "장기주택저당차입금 이자 소득공제는 그 집에 실제로 사는 경우에만 적용됩니다.",
    before: "무주택·1주택자면 거주와 관계없이 공제",
    after: "세대원 전원이 그 집에 살아야 공제 (취학·요양 등은 예외)",
    target: "장기 주택담보대출 이자를 공제받는 사람",
    effective: "2027년 1월 1일 이후 내는 이자 (2026년까지 받은 대출은 2029년까지 현행)",
  },
  {
    id: "hometown-donation", area: "deduction", status: "review", source: "taxReform",
    title: "고향사랑기부금 지방 우대",
    line: "고향사랑기부금 10만 원 초과분의 세액공제율이 기부한 지역에 따라 올라갑니다.",
    before: "10만~20만 원 40% · 20만 원 초과 15%",
    after: "지역에 따라 10만~20만 원 최대 50% · 20만 원 초과 최대 25%",
    target: "고향사랑기부금을 내는 사람",
    effective: "2027년 1월 1일 이후 기부분",
    details: [
      "10만 원까지는 현행처럼 전액(110분의 100) 공제됩니다.",
      "지역 구분은 행정안전부 지방우대지수를 반영해 시행령으로 정합니다.",
    ],
  },
  {
    id: "subscription-savings", area: "deduction", status: "review", source: "taxReform",
    title: "청약저축 소득공제 상시화",
    line: "무주택 세대주의 주택청약종합저축 소득공제가 끝나는 기한 없이 계속됩니다.",
    before: "2028년 말까지 (납입액 연 300만 원 한도 40%)",
    after: "기한 없이 상시 적용 (조건 같음)",
    target: "총급여 7,000만 원 이하 무주택 세대주·배우자",
    effective: "2027년 1월 1일 이후 소득분",
    calc: calc(FINANCE, "/year-end-settlement", "연말정산 계산"),
  },

  // ── 출산·육아·결혼 ──
  {
    id: "baby-welcome", area: "family", status: "review", source: "childcare",
    title: "아이맞이지원금 첫째 1,000만 원",
    line: "첫만남이용권과 부모급여를 합친 아이맞이지원금을 출생 후 1년 동안 현금으로 나눠 줍니다.",
    before: "첫만남이용권 200만 원(둘째부터 300만, 바우처) + 부모급여 월 100만(0세)·50만(1세)",
    after: "첫째 1,000만 · 둘째 1,200만 · 셋째 이상 1,500만 원, 분기마다 4번 현금",
    target: "2027년 7월 1일 이후 태어난 아이",
    effective: "2027년 7월 1일 이후 출생아 (6월 30일 출생아까지는 현행 제도)",
    calc: calc("baby", "/first-meeting", "첫만남이용권 계산(현행)"),
    details: [
      "우대지역은 500만 원을 더해 첫째 1,500만 · 둘째 1,700만 · 셋째 이상 2,000만 원입니다.",
      "수도권 가정보육 첫째 기준 0~12세 누계는 현행 3,560만 원에서 4,840만 원으로 1,280만 원 늘어납니다.",
      "시행 전에 「아동수당법」 개정이 필요합니다.",
    ],
  },
  {
    id: "child-basic", area: "family", status: "review", source: "childcare",
    title: "아동기본수당 월 20만 원",
    line: "아동수당이 아동기본수당으로 바뀌어 0~12세에게 매달 20만 원(우대지역 30만 원)을 줍니다.",
    before: "아동수당 월 10만 원 (비수도권 10.5만, 인구감소지역 11만~12만)",
    after: "월 20만 원 (현금 10만 + 지역사랑상품권 10만) · 우대지역 30만 원",
    target: "2027년 7월 1일 이후 태어난 0~12세",
    effective: "2027년 7월 1일 이후 출생아",
    calc: calc("baby", "/child-allowance", "아동수당 계산(현행)"),
    details: [
      "0~1세를 어린이집에 보내지 않고 가정에서 키우면 월 30만 원을 더 줍니다.",
      "2027년 6월 30일까지 태어난 아이는 현행 아동수당·부모급여를 그대로 받습니다.",
    ],
  },
  {
    id: "child-allowance-age", area: "family", status: "passed", source: "childcare",
    title: "아동수당 10세 미만까지",
    line: "아동수당 대상 연령이 2027년 10세 미만으로 오르고 해마다 1세씩 늘어납니다.",
    before: "9세 미만 (2026년)",
    after: "10세 미만 (2027년) → 2030년 13세 미만",
    target: "아동수당을 받는 아이",
    effective: "2027년",
    calc: calc("baby", "/child-allowance", "아동수당 계산"),
  },
  {
    id: "marriage-grant", area: "family", status: "review", source: "marriageBudget",
    alsoSources: ["budget"],
    title: "혼인지원금 부부당 100만 원",
    line: "혼인 세액공제 대신 부부당 100만 원을 생애 한 번 주는 혼인지원금이 새로 생깁니다.",
    before: "혼인 세액공제 1인당 최대 50만 원 (2026년 혼인신고까지)",
    after: "부부당 100만 원 (개인별 50만 원) · 생애 1회",
    target: "혼인신고한 부부",
    effective: "2027년 (대상 혼인신고 시점·지급 방법은 추후 안내)",
    details: [
      "이름은 가칭입니다(성평등가족부 2027년 예산).",
      "대상 혼인신고 시점과 신청 방법은 아직 발표되지 않았습니다(2026년 9월 25일 확인).",
    ],
  },

  // ── 청년·교육 ──
  {
    id: "national-univ", area: "youth", status: "review", source: "budget",
    alsoSources: ["budgetCard", "youthBudget"],
    title: "지방국립대 등록금 0원",
    line: "2027학년도 신입생부터 지방국립대 30곳의 등록금을 4년 동안 전액 장학금으로 지원합니다.",
    before: "신설 (지금은 소득 구간별 국가장학금)",
    after: "등록금 전액 4년 · 30개교 · 의대·치대·약대·수의대 제외",
    target: "2027학년도 지방국립대 신입생",
    effective: "2027학년도 신입생부터",
    details: [
      "대상 30개교 명단은 아직 발표되지 않았습니다(2026년 9월 25일 확인).",
      "지방 사립대 학생 대상 지역인재장학금은 4,000명에서 1만 명으로 늘립니다.",
    ],
  },
  {
    id: "first-pension", area: "youth", status: "passed", source: "childcare",
    title: "18세 첫 국민연금 보험료 지원",
    line: "2027년에 18세가 되는 청년부터 첫 국민연금 보험료 1개월분을 나라가 내줍니다.",
    before: "없음",
    after: "1개월분 약 4만 2천 원 (18~26세에 신청)",
    target: "2009년생부터, 연금 납부 이력이 없는 18세",
    effective: "2027년 1월 1일 (국민연금법 개정 2026년 5월 공포)",
    calc: calc(FINANCE, "/pension", "국민연금 계산"),
    details: [
      "이미 낸 이력이 있으면 보험료 대신 가입 기간 1개월을 더 인정합니다.",
      "첫 납부 이력이 생기면 학업·군복무 기간 보험료를 나중에 추후납부할 수 있습니다.",
    ],
  },

  // ── 주거·자산 ──
  {
    id: "productive-isa", area: "asset", status: "review", source: "taxReform",
    title: "생산적금융 ISA 신설",
    line: "국내 주식·펀드에 투자하는 ISA를 새로 만들어 이자·배당을 전액 비과세합니다.",
    before: "일반 ISA: 200만 원(서민 400만)까지 비과세, 초과분 9% · 총 1억 원",
    after: "이자·배당 전액 비과세 · 연 2,000만·총 2억 원 · 청년은 납입금 10% 소득공제",
    target: "19세 이상(근로자 15세 이상) · 청년 공제는 15~34세, 총급여 7,500만 원 이하",
    effective: "2027년 1월 1일 이후 새로 가입",
    calc: calc("invest", "/isa", "ISA 계산(현행)"),
    details: [
      "투자 대상은 국내 상장주식·국내주식형 펀드·국민성장펀드·BDC 등입니다.",
      "직전 3년 중 금융소득종합과세 대상이었던 사람은 가입할 수 없습니다.",
      "3년 안에 원금을 넘게 빼면 해지로 보고 비과세분을 추징합니다.",
    ],
  },
  {
    id: "holding-tax-deduction", area: "asset", status: "review", source: "taxReform",
    title: "1주택 종부세 공제, 거주 14억·비거주 9억",
    line: "1세대 1주택자의 종부세 기본공제가 실제로 살면 14억 원, 살지 않으면 9억 원으로 갈립니다.",
    before: "1세대 1주택자 12억 원",
    after: "거주 14억 원 · 비거주 9억 원 (공시가격 기준)",
    target: "종부세를 내는 1세대 1주택자",
    effective: "2027년분 종부세부터",
    calc: calc("house", "/holding-tax", "보유세 계산(현행)"),
    details: ["다주택자 기본공제는 9억 원에서 거주 주택 비중에 따라 4억~9억 원으로 바뀝니다."],
  },
  {
    id: "holding-tax-ratio", area: "asset", status: "review", source: "taxReform",
    title: "종부세 공정시장가액비율 70%",
    line: "주택분 종부세 과세표준을 정하는 공정시장가액비율이 60%에서 70%로 오릅니다.",
    before: "60%",
    after: "70% (1세대 1주택·지방 1~2주택) · 3주택 이상 등은 2028년부터 80%",
    target: "종부세를 내는 주택 보유자",
    effective: "2027년분 종부세부터",
    calc: calc("house", "/holding-tax", "보유세 계산(현행)"),
    details: [
      "과세표준 6억~12억 원 구간 세율도 1.0%에서 1.3%로 오릅니다(1·2주택).",
      "1주택자 고령·보유 세액공제에 한도가 생깁니다: 2027년 800만 원, 2028년부터 600만 원.",
    ],
  },
  {
    id: "long-term-residence", area: "asset", status: "review", source: "taxReform",
    title: "장기보유특별공제 → 장기거주공제",
    line: "양도세 장기보유특별공제가 2028년부터 거주 기간 중심으로 바뀌고 공제액 한도가 생깁니다.",
    before: "1주택 보유 연 4% + 거주 연 4% (최대 80%) · 한도 없음",
    after: "2028년 거주 6%+보유 2% → 2029년부터 거주 연 8% (최대 80%) · 한도 20억 → 10억 원",
    target: "주택을 파는 1세대 1주택자·다주택자",
    effective: "2028년 1월 1일 이후 양도분 (2027년은 현행)",
    calc: calc("house", "/capital-gains-tax", "양도세 계산(현행)"),
  },

  // ── 자동차 ──
  {
    id: "ev-excise", area: "car", status: "review", source: "taxReform",
    title: "전기·수소차 개소세 감면 축소",
    line: "전기차 개별소비세 감면 한도가 300만 원에서 2027년 200만 원으로 줄고 2029년에 끝납니다.",
    before: "전기차 300만 원 · 수소차 400만 원 감면",
    after: "2027년 200만·300만 원 → 2028년 100만·150만 원 → 2029년 종료",
    target: "전기차·수소차를 사는 사람",
    effective: "2027년 1월 1일 이후 출고분",
    calc: calc("car", "/ev-vs-gas", "전기차·내연기관 비교"),
    details: ["줄어드는 감면은 재정지원으로 전환한다고 발표됐습니다."],
  },
  {
    id: "hybrid-excise", area: "car", status: "review", source: "taxReform",
    title: "하이브리드차 개소세 감면 종료",
    line: "하이브리드차 개별소비세 감면(대당 최대 70만 원)이 2026년 말로 끝납니다.",
    before: "대당 최대 70만 원 감면",
    after: "감면 종료",
    target: "하이브리드차를 사는 사람",
    effective: "2026년 12월 31일 종료",
  },
];

export const CHANGES_2027_FAQS = [
  {
    q: "여기 있는 내용은 모두 확정인가요?",
    a: "아닙니다. 최저임금, 생애 첫 국민연금 보험료, 아동수당 연령 상향만 확정이고 나머지는 2026년 9월 국회에 낸 정부안이라 12월 의결 때 바뀔 수 있습니다.",
  },
  {
    q: "아이맞이지원금은 2027년 6월에 태어난 아이도 받나요?",
    a: "아닙니다. 2027년 7월 1일 이후 출생아부터 적용되고, 6월 30일 출생아까지는 첫만남이용권·부모급여·아동수당을 현행대로 받습니다.",
  },
  {
    q: "지방국립대 등록금 무료 대상 학교는 어디인가요?",
    a: "정부는 비수도권 국립대 30곳이라고 발표했지만 학교 명단은 아직 공개되지 않았습니다. 의대·치대·약대·수의대는 제외됩니다.",
  },
  {
    q: "근로장려금 상향은 언제부터 받나요?",
    a: "2027년 소득분부터 적용되므로 2028년 신청·지급분부터 달라집니다.",
  },
];

/** 계산 링크 — 같은 앱이면 라우터 경로, 다른 앱이면 절대 URL */
export function changeCalcHref(item) {
  if (!item.calc) return null;
  return item.calc.app === FINANCE ? item.calc.path : `https://shakilabs.com/${item.calc.app}${item.calc.path}`;
}

/** 표시용 날짜: 2026-08-03 → 2026.08.03 */
export function formatChangeDate(date) {
  return date.replaceAll("-", ".");
}

/** 항목의 근거 출처(주 출처 + 보조 출처) — 화면·프리렌더가 같은 순서로 쓴다 */
export function changeSourcesOf(item) {
  return [item.source, ...(item.alsoSources ?? [])].map((id) => CHANGE_SOURCES[id]);
}

/** 머리말 한 줄 — 화면과 프리렌더가 같은 문장을 쓴다 */
export function changesStatusSummary() {
  const passed = CHANGES_2027.filter((item) => item.status === "passed").length;
  return `마지막 확인 ${formatChangeDate(CHANGES_2027_VERIFIED_AT)} · 확정 ${passed}개 · 국회 심의 중 ${CHANGES_2027.length - passed}개`;
}
