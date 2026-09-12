// 광고 유닛 원장 — 애드센스 슬롯 ID와 애드핏 유닛 ID를 한곳에서 짝지운다.
//
// 왜 앱에 두는가: 유닛 ID는 공개값이지만 앱마다 다르다. 패키지에 넣으면
// 유닛 하나 바꿀 때마다 13앱 vendor tarball을 다시 돌려야 한다. 태그 모양과
// 로더 중복 판정만 패키지(@shakilabs/ui ShAdSlot)가 갖고, 원장은 여기 남는다.
//
// 왜 슬롯 ID를 뷰에 직접 쓰지 않는가: 그러면 provider가 늘 때 21곳을 손대야
// 한다. 뷰는 이제 의미 있는 키("insurance-top")만 알고, 네트워크별 ID는 이
// 파일이 안다.
//
// 애드핏 제약(배포 SDK ad-fit-web@4.41.3에서 확인):
//   - 한 페이지에 유닛 4개까지. 초과분은 SDK가 버린다.
//   - 반응형 유닛이 없다. 사이즈는 160x600 / 250x250 / 300x250 / 320x100 /
//     320x50 / 728x90 6종 고정이므로 유닛마다 크기를 적어둔다.
//   - 유닛은 등록한 매체 URL에서만 나간다.
import { resolveAdProvider, type AdProvider } from "@shakilabs/ui";

/**
 * 지금 켜져 있는 네트워크. Vercel 환경변수 하나로 바뀐다.
 *
 * 값을 비우거나 오타를 내면 "none"으로 떨어진다 — 잘못된 네트워크 태그가
 * 나가는 것보다 광고가 안 나오는 쪽이 낫다. 기본값을 "adsense"로 둔 것은
 * 이 PR이 회귀 0을 목표로 하기 때문이다. 애드핏 전환 시점에
 * VITE_AD_PROVIDER=adfit 하나만 바꾸면 된다.
 */
export const adProvider: AdProvider = resolveAdProvider(
  import.meta.env.VITE_AD_PROVIDER || "adsense",
);

export const adsensePublisherId: string = (
  import.meta.env.VITE_ADSENSE_PUBLISHER_ID || ""
).trim();

/** 애드핏이 지원하는 고정 사이즈. 그 외 값은 유닛 발급 자체가 안 된다. */
export type AdfitSize =
  | [160, 600]
  | [250, 250]
  | [300, 250]
  | [320, 100]
  | [320, 50]
  | [728, 90];

export interface AdUnit {
  /** 애드센스 data-ad-slot. 기존 뷰에 박혀 있던 숫자를 그대로 옮겼다. */
  adsense: string;
  /** 애드핏 data-ad-unit (DAN-…). 매체·광고단위 등록 후 사용자가 채운다. */
  adfit: string;
  /** 애드핏 고정 사이즈. adfit이 빈 값이면 쓰이지 않는다. */
  adfitSize: AdfitSize;
}

/**
 * 슬롯 키 → 네트워크별 ID.
 *
 * 애드핏 값이 전부 빈 문자열인 것은 의도된 상태다. ShAdSlot은 유닛 ID가
 * 없으면 아무것도 렌더하지 않으므로, provider를 adfit으로 바꿔도 채워 넣은
 * 슬롯만 나간다 — 빈 프레임이 생기지 않는다.
 *
 * 페이지당 애드핏 유닛 4개 제한: 현재 최대 밀도는 페이지당 3개(insurance·
 * salary·compare)라 여유가 있다.
 */
export const adUnits = {
  // HomeView는 예전부터 insurance 슬롯 ID(110001·110003)를 그대로 재사용해 왔다.
  // 애드센스 쪽은 회귀 0을 위해 그 숫자를 유지하되, 애드핏에서는 홈과 보험
  // 페이지가 서로 다른 유닛을 쓸 수 있도록 키를 갈라 둔다.
  "home-top": { adsense: "110001", adfit: "", adfitSize: [728, 90] },
  "home-bottom": { adsense: "110003", adfit: "", adfitSize: [300, 250] },
  "insurance-top": { adsense: "110001", adfit: "", adfitSize: [728, 90] },
  "insurance-middle": { adsense: "110002", adfit: "", adfitSize: [300, 250] },
  "insurance-bottom": { adsense: "110003", adfit: "", adfitSize: [300, 250] },
  "salary-top": { adsense: "120001", adfit: "", adfitSize: [728, 90] },
  "salary-middle": { adsense: "120002", adfit: "", adfitSize: [300, 250] },
  "salary-bottom": { adsense: "120003", adfit: "", adfitSize: [300, 250] },
  "salary-landing-top": { adsense: "120101", adfit: "", adfitSize: [728, 90] },
  "salary-landing-middle": { adsense: "120102", adfit: "", adfitSize: [300, 250] },
  "salary-landing-bottom": { adsense: "120103", adfit: "", adfitSize: [300, 250] },
  "compare-top": { adsense: "130001", adfit: "", adfitSize: [728, 90] },
  "compare-middle": { adsense: "130002", adfit: "", adfitSize: [300, 250] },
  "compare-bottom": { adsense: "130003", adfit: "", adfitSize: [300, 250] },
  "retirement-top": { adsense: "140001", adfit: "", adfitSize: [728, 90] },
  "retirement-middle": { adsense: "140002", adfit: "", adfitSize: [300, 250] },
  "retirement-bottom": { adsense: "140003", adfit: "", adfitSize: [300, 250] },
  "comprehensive-top": { adsense: "150001", adfit: "", adfitSize: [728, 90] },
  "comprehensive-middle": { adsense: "150002", adfit: "", adfitSize: [300, 250] },
  "withholding-top": { adsense: "160001", adfit: "", adfitSize: [728, 90] },
  "withholding-bottom": { adsense: "160002", adfit: "", adfitSize: [300, 250] },
} as const satisfies Record<string, AdUnit>;

export type AdUnitKey = keyof typeof adUnits;

/** 지금 provider에서 이 슬롯이 쓸 ID. 없으면 빈 문자열 → 렌더 안 함. */
export function unitIdFor(key: AdUnitKey, provider: AdProvider = adProvider): string {
  const unit = adUnits[key];
  if (provider === "adsense") return unit.adsense;
  if (provider === "adfit") return unit.adfit;
  return "";
}
