import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// 숫자 포맷: 1000 → "1,000"
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return "-";
  return num.toLocaleString("ko-KR");
}

// 원화 원단위 포맷: 2345678 → "2,345,678원"
function formatWonExact(amount: number): string {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

// 기본 원화 포맷: 2345678 → "2,345,678원"
export function formatWon(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return formatWonExact(amount);
}

function formatCompactManWon(roundedManWon: number): string {
  const sign = roundedManWon < 0 ? "-" : "";
  const absolute = Math.abs(roundedManWon);

  if (absolute >= 10_000) {
    const eok = Math.floor(absolute / 10_000);
    const restManWon = absolute % 10_000;
    if (restManWon === 0) {
      return `${sign}${eok.toLocaleString("ko-KR")}억원`;
    }
    return `${sign}${eok.toLocaleString("ko-KR")}억 ${restManWon.toLocaleString("ko-KR")}만원`;
  }

  return `${sign}${absolute.toLocaleString("ko-KR")}만원`;
}

// 만원 단위 포맷: 240 -> "240만원", 10000 -> "1억원", 12500 -> "1억 2,500만원"
export function formatManWonValue(manWon: number | null | undefined): string {
  if (manWon == null) return "-";
  return formatCompactManWon(Math.round(manWon));
}

// 축약 KRW 포맷: 1,000,000 -> "100만원", 100,000,000 -> "1억원"
export function formatKrwCompact(amount: number | null | undefined): string {
  if (amount == null) return "-";
  const roundedManWon = Math.round(amount / 10_000);
  return formatCompactManWon(roundedManWon);
}

// 만원 포맷: 50000000 → "5,000만원", 100000000 -> "1억원"
export function formatManWon(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return formatKrwCompact(amount);
}

// 자동 KRW 포맷 규칙:
// - 전역 정책: 축약 없이 "천단위 콤마 + 원"
export function formatKrwAuto(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return formatWonExact(amount);
}

// 퍼센트 포맷: 0.1234 → "12.34%"
export function formatPercent(rate: number | null | undefined, decimals = 2): string {
  if (rate == null) return "-";
  return `${(rate * 100).toFixed(decimals)}%`;
}

// 통화 포맷: (14900, "KRW") → "₩14,900"
export function formatCurrency(amount: number | null | undefined, currency: string): string {
  if (amount == null) return "-";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(amount);
}

// execCommand 기반 클립보드 복사 (Clipboard API 미지원 환경 폴백)
export function copyUsingExecCommand(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}

// 슬라이더 가변 윈도우: 현재값 중심으로 조작 가능한 구간만 노출
export function getSliderWindow(
  current: number,
  absoluteMin: number,
  absoluteMax: number,
  windowSize: number
): { min: number; max: number } {
  const normalizedMin = Math.min(absoluteMin, absoluteMax);
  const normalizedMax = Math.max(absoluteMin, absoluteMax);
  const size = Math.max(1, Math.floor(windowSize));
  const totalRange = normalizedMax - normalizedMin;

  if (totalRange <= size) {
    return { min: normalizedMin, max: normalizedMax };
  }

  const center = Math.max(normalizedMin, Math.min(normalizedMax, Math.round(current)));
  const half = Math.floor(size / 2);
  let min = Math.max(normalizedMin, center - half);
  let max = Math.min(normalizedMax, min + size);
  min = Math.max(normalizedMin, max - size);

  return { min, max };
}
