// 임금체불 지연이자 상수 (2026년 적용 기준)
// 근거: 근로기준법 제37조·시행령 제17조(연 20%, 퇴직자 금품청산 14일 경과 후),
//       민법 제379조(연 5%), 상법 제54조(연 6%), 소송촉진 등에 관한 특례법(연 12%)
// 검증일: 2026-07-27
export type UnpaidWageStage = "retired" | "civil" | "commercial" | "litigation";

export const UNPAID_WAGE_2026 = {
  rates: {
    retired: 0.2,
    civil: 0.05,
    commercial: 0.06,
    litigation: 0.12,
  } as Record<UnpaidWageStage, number>,
  // 퇴직·사망 근로자의 임금·퇴직금은 퇴직일부터 14일 이내 지급 의무(금품청산),
  // 그 다음 날부터 연 20% 지연이자가 붙는다
  retiredGraceDays: 14,
} as const;

export const UNPAID_WAGE_STAGE_OPTIONS: { value: UnpaidWageStage; label: string; note: string }[] = [
  {
    value: "retired",
    label: "퇴직 후 (연 20%)",
    note: "퇴직·사망 근로자의 임금과 퇴직금 — 퇴직일부터 14일이 지난 다음 날부터 적용",
  },
  {
    value: "civil",
    label: "재직 중·일반 (연 5%)",
    note: "약정이 없는 민사채무의 법정이율",
  },
  {
    value: "commercial",
    label: "재직 중·상사 (연 6%)",
    note: "회사(상인)를 상대로 한 임금채권에 상사이율을 적용하는 경우",
  },
  {
    value: "litigation",
    label: "소송 진행 (연 12%)",
    note: "소장 또는 이에 준하는 서면이 송달된 다음 날부터",
  },
];
