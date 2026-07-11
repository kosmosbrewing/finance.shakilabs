// 연말정산 관련 상수 (2026년 기준)
export const YEAR_END_TAX_YEAR = 2026;

// 신용카드 등 소득공제 (소득세법 제126조의2)
export const CARD_DEDUCTION = {
  /** 최소사용 비율 (총급여의 25%) */
  minimumSpendRate: 0.25,
  /** 신용카드 공제율 */
  creditCardRate: 0.15,
  /** 체크카드/현금영수증 공제율 */
  debitCardRate: 0.3,
  /** 공제한도 (총급여 구간별) */
  limits: [
    { salaryLimit: 70_000_000, deductionLimit: 3_000_000 },
    { salaryLimit: Number.POSITIVE_INFINITY, deductionLimit: 2_500_000 },
  ],
} as const;

// 세액공제 상수
export const TAX_CREDITS = {
  /** 보장성보험료 세액공제: 연 100만원 한도 × 12% */
  insurancePremiumLimit: 1_000_000,
  insurancePremiumRate: 0.12,
  /** 의료비 세액공제: 총급여 3% 초과분 × 15%, 연 700만원 한도 */
  medicalThresholdRate: 0.03,
  medicalRate: 0.15,
  medicalLimit: 7_000_000,
  /** 교육비 세액공제: 본인 한도 없음, 자녀 300만/900만 × 15% */
  educationRate: 0.15,
  /** 기부금 세액공제: 15% (1천만 초과분 30%) */
  donationBaseRate: 0.15,
  donationHighRate: 0.3,
  donationHighThreshold: 10_000_000,
} as const;

// 프리셋 (만원 단위)
export const YEAR_END_SALARY_PRESETS = [
  { label: "3,000만원", value: 30_000_000 },
  { label: "4,500만원", value: 45_000_000 },
  { label: "5,200만원", value: 52_000_000 },
  { label: "7,500만원", value: 75_000_000 },
];

export const YEAR_END_AMOUNTS = [3000, 4500, 5200, 6000, 7500, 10000];

export const YEAR_END_UPDATED = "2026.07";

export const YEAR_END_FAQS = [
  {
    question: "연말정산은 언제 하나요?",
    answer: "매년 1~2월에 회사를 통해 진행합니다. 국세청 홈택스에서 간소화 자료를 다운받아 회사에 제출하면, 회사가 정산 후 환급 또는 추가 징수합니다.",
  },
  {
    question: "신용카드 소득공제는 어떻게 계산되나요?",
    answer: "총급여의 25%를 초과 사용한 금액에 대해 신용카드 15%, 체크카드·현금영수증 30% 공제율을 적용합니다. 기본 공제한도는 총급여 7천만원 이하 300만원, 7천만원 초과 250만원입니다.",
  },
  {
    question: "연금저축과 IRP 세액공제는 중복 적용되나요?",
    answer: "네. 연금저축 최대 600만원, 연금저축+IRP 합산 최대 900만원까지 세액공제 대상입니다. 총급여 5,500만원 이하는 15%, 초과 시 12%를 적용합니다.",
  },
  {
    question: "월세 세액공제 조건은 무엇인가요?",
    answer: "총급여 8,000만원 이하 무주택 세대주(또는 세대원)로서 전용 85㎡ 이하 주택에 거주해야 합니다. 연 1,000만원 한도 내에서 5,500만원 이하 17%, 8,000만원 이하 15%를 공제합니다.",
  },
];

export const YEAR_END_SOURCES = [
  {
    name: "국세청",
    basis: "연말정산 안내 (2025년 귀속)",
    url: "https://g.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7794&mi=2469",
  },
  {
    name: "소득세법",
    basis: "제126조의2 (신용카드 등 소득공제)",
    url: "https://law.go.kr/법령/소득세법",
  },
];
