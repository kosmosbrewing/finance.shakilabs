// 프리렌더 공통 레이아웃: header nav + footer
// 모든 프리렌더 페이지에 정적 HTML로 주입되어 크롤러의 사이트 항해를 가능하게 함

const CALCULATORS = {
  "급여·연봉": [
    { href: "/finance/salary", label: "연봉 실수령액 계산기" },
    { href: "/finance/insurance", label: "건강보험료 역산 계산기" },
    { href: "/finance/compare", label: "이직 연봉 비교" },
    { href: "/finance/raise", label: "연봉 인상률 계산기" },
    { href: "/finance/bonus", label: "성과급 실수령 계산기" },
  ],
  "세금·신고": [
    { href: "/finance/comprehensive-tax", label: "종합소득세 계산기" },
    { href: "/finance/withholding", label: "원천세 역산 계산기" },
    { href: "/finance/freelance-rate", label: "프리랜서 단가 역산" },
    { href: "/finance/4-insurance-employer", label: "사업주 4대보험" },
  ],
  "수당·시급": [
    { href: "/finance/weekly-holiday-pay", label: "주휴수당 계산기" },
    { href: "/finance/wage-converter", label: "시급↔월급↔연봉 환산기" },
    { href: "/finance/overtime", label: "연장·야간·휴일수당" },
    { href: "/finance/annual-leave", label: "연차수당 계산기" },
  ],
  "퇴직·구직": [
    { href: "/finance/quit", label: "퇴사 계산기" },
    { href: "/finance/severance-pay", label: "퇴직금 계산기" },
    { href: "/finance/unemployment", label: "실업급여 계산기" },
    { href: "/finance/parental-leave", label: "육아휴직 급여" },
    { href: "/finance/regional-health", label: "지역가입자 건보료" },
  ],
  "절세·공제": [
    { href: "/finance/year-end-settlement", label: "연말정산 계산기" },
    { href: "/finance/monthly-rent-deduction", label: "월세 세액공제" },
    { href: "/finance/irp", label: "IRP 세액공제" },
    { href: "/finance/pension", label: "국민연금 수령액" },
  ],
};

/**
 * 모든 프리렌더 페이지 최상단에 삽입되는 정적 header/nav HTML
 * - 로고
 * - 주요 5개 카테고리 대표 링크 (중복 최소화)
 * - About/전체계산기
 */
export function buildPrerenderHeader() {
  return `
    <header data-seo-prerender="header" style="max-width:1120px;margin:0 auto;padding:14px 16px;border-bottom:1px solid #e2e8f0;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <a href="/finance/salary" style="font-weight:700;font-size:18px;color:#065f46;text-decoration:none;">ShakiLabs 연봉계산기</a>
        <nav aria-label="주요 계산기" style="display:flex;gap:16px;flex-wrap:wrap;font-size:14px;">
          <a href="/finance/salary" style="color:#334155;text-decoration:none;">연봉 실수령</a>
          <a href="/finance/insurance" style="color:#334155;text-decoration:none;">건강보험료</a>
          <a href="/finance/comprehensive-tax" style="color:#334155;text-decoration:none;">종합소득세</a>
          <a href="/finance/year-end-settlement" style="color:#334155;text-decoration:none;">연말정산</a>
          <a href="/finance/quit" style="color:#334155;text-decoration:none;">퇴사 계산</a>
          <a href="/finance/all" style="color:#334155;text-decoration:none;">전체 계산기</a>
          <a href="/finance/about" style="color:#334155;text-decoration:none;">서비스 소개</a>
        </nav>
      </div>
    </header>`;
}

/**
 * 모든 프리렌더 페이지 최하단에 삽입되는 정적 footer HTML
 * - 22개 전체 계산기 링크 (5 카테고리)
 * - 운영자·문의·법적 고지
 */
export function buildPrerenderFooter() {
  const categoryBlocks = Object.entries(CALCULATORS)
    .map(([category, items]) => {
      const links = items
        .map(
          (item) =>
            `<li style="margin-bottom:4px;"><a href="${item.href}" style="color:#64748b;text-decoration:none;font-size:13px;">${item.label}</a></li>`
        )
        .join("");
      return `
      <div>
        <h3 style="font-size:13px;font-weight:700;color:#334155;margin:0 0 8px;">${category}</h3>
        <ul style="list-style:none;padding:0;margin:0;">${links}</ul>
      </div>`;
    })
    .join("");

  return `
    <footer data-seo-prerender="footer" style="max-width:1120px;margin:40px auto 0;padding:24px 16px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <nav aria-label="전체 계산기" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;margin-bottom:20px;">
        ${categoryBlocks}
      </nav>
      <div style="padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.8;">
        <p style="margin:0 0 6px;">운영 <strong>Shakilabs</strong> · 문의 <a href="mailto:skdba1313@gmail.com" style="color:#64748b;">skdba1313@gmail.com</a></p>
        <p style="margin:0 0 6px;">
          <a href="/finance/about" style="color:#64748b;margin-right:12px;">서비스 소개</a>
          <a href="/finance/privacy" style="color:#64748b;margin-right:12px;">개인정보처리방침</a>
          <a href="/finance/terms" style="color:#64748b;">이용약관</a>
        </p>
        <p style="margin:0;">본 계산기는 2026년 최신 세율·요율을 기반으로 하며, 국세청 근로소득 간이세액표·국민건강보험공단 고시·고용노동부 고시를 참고합니다. 결과는 법적 효력이 없는 참고용 추정값입니다.</p>
      </div>
    </footer>`;
}
