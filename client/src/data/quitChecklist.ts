export interface ChecklistItem {
  id: string;
  label: string;
  tip: string;
}

export interface ChecklistCategory {
  title: string;
  items: ChecklistItem[];
}

export const QUIT_CHECKLIST: ChecklistCategory[] = [
  {
    title: "퇴사 전",
    items: [
      { id: "irp", label: "퇴직금 수령 계좌(IRP) 개설 여부 확인", tip: "IRP로 받으면 퇴직소득세 30% 감면" },
      { id: "leave", label: "미사용 연차 잔여일수 확인", tip: "연차수당으로 정산되는지 인사팀에 확인" },
      { id: "docs", label: "경력증명서·재직증명서 발급", tip: "퇴사 후에도 발급 가능하지만 재직 중이 빠름" },
      { id: "health-cont", label: "건강보험 임의계속가입 신청 기한 확인", tip: "퇴사일로부터 36개월 이내, 직장가입자 요율 유지" },
      { id: "pension", label: "국민연금 임의가입·추납 여부 검토", tip: "소득 공백 기간에도 가입 유지 가능" },
    ],
  },
  {
    title: "퇴사 후",
    items: [
      { id: "4ins-loss", label: "4대보험 상실신고 처리 확인", tip: "회사가 처리, 건보공단에서 자격상실 안내 수신 확인" },
      { id: "unemp-apply", label: "고용센터 실업급여 신청", tip: "퇴사일 다음날부터 12개월 이내 신청" },
      { id: "unemp-class", label: "온라인 구직활동 교육 수강", tip: "워크넷 등록 + 수급자격 인정 교육 필수" },
      { id: "health-switch", label: "지역가입 전환 or 피부양자 등록", tip: "직장가입 상실 후 자동 지역가입 전환" },
      { id: "tax-settle", label: "종합소득세 신고 대비 (다음해 5월)", tip: "퇴사 연도 근로소득 + 기타소득 합산 신고" },
    ],
  },
  {
    title: "이직 시 추가 확인",
    items: [
      { id: "non-compete", label: "경업금지 조항 확인", tip: "근로계약서 내 경쟁사 이직 제한 기간·범위 확인" },
      { id: "new-contract", label: "새 회사 근로계약서 검토", tip: "연봉·수습기간·퇴직금 산정 기준일 꼼꼼히 확인" },
      { id: "4ins-gap", label: "4대보험 공백 없이 연속 가입 확인", tip: "퇴사일 → 입사일 사이 공백 시 지역가입 전환됨" },
      { id: "irp-decision", label: "퇴직금 IRP 유지 vs 일시금 수령 결정", tip: "이직 시에도 IRP 유지가 퇴직소득세 이연에 유리" },
    ],
  },
] as const;

// 전체 항목 수 (프로그레스 계산용)
export const TOTAL_ITEMS = QUIT_CHECKLIST.reduce(
  (sum, cat) => sum + cat.items.length,
  0,
);
