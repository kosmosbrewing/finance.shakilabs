import type { SiteFooterLink, SiteFooterSection } from "@shakilabs/ui";

/** 푸터 계산기 목록 — 26개 전 계산기를 5개 카테고리로 노출 */
export const FOOTER_SECTIONS: readonly SiteFooterSection[] = [
  {
    title: "급여·연봉",
    links: [
      { to: "/salary", label: "연봉 실수령액" },
      { to: "/insurance", label: "건보료 역산" },
      { to: "/compare", label: "이직 비교" },
      { to: "/raise", label: "연봉 인상률" },
      { to: "/bonus", label: "성과급" },
    ],
  },
  {
    title: "세금·신고",
    links: [
      { to: "/comprehensive-tax", label: "종합소득세" },
      { to: "/freelancer", label: "프리랜서 세금" },
      { to: "/withholding", label: "원천세" },
      { to: "/freelance-rate", label: "프리랜서 단가" },
      { to: "/4-insurance-employer", label: "사업주 4대보험" },
    ],
  },
  {
    title: "수당·시급",
    links: [
      { to: "/weekly-holiday-pay", label: "주휴수당" },
      { to: "/wage-converter", label: "시급↔월급 환산" },
      { to: "/overtime", label: "연장·야간수당" },
      { to: "/annual-leave", label: "연차수당" },
    ],
  },
  {
    title: "퇴직·구직",
    links: [
      { to: "/quit", label: "퇴사 계산기" },
      { to: "/severance-pay", label: "퇴직금" },
      { to: "/unemployment", label: "실업급여" },
      { to: "/parental-leave", label: "육아휴직" },
      { to: "/regional-health", label: "지역가입자 건보" },
      { to: "/dependent", label: "피부양자 판정" },
      { to: "/unpaid-wage", label: "임금체불 이자" },
    ],
  },
  {
    title: "절세·공제",
    links: [
      { to: "/year-end-settlement", label: "연말정산" },
      { to: "/monthly-rent-deduction", label: "월세 세액공제" },
      { to: "/irp", label: "IRP 세액공제" },
      { to: "/pension", label: "국민연금" },
      { to: "/eitc", label: "근로장려금" },
    ],
  },
];

export const FOOTER_ALL_LINK: SiteFooterLink = {
  to: "/all",
  label: "전체 계산기 보기 →",
};
