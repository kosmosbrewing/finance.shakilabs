// scripts/primary-nav-items.mjs(단일 소스)를 src에서 타입과 함께 쓰기 위한 선언
export interface PrimaryNavItem {
  key: string;
  label: string;
  to: string;
  /** 활성 판정에 쓰는 경로들. 서브 라우트가 같은 탭에 속할 수 있다 */
  matchPaths: readonly string[];
}

export const PRIMARY_NAV_ITEMS: readonly PrimaryNavItem[];
export function findActiveNavItem(path: string): PrimaryNavItem | undefined;
