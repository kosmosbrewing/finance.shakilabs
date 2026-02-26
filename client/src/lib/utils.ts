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

// 원화 포맷: 2345678 → "2,345,678원"
export function formatWon(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

// 만원 단위 포맷: 240 -> "240만원", 10000 -> "1억원", 12500 -> "1억 2,500만원"
export function formatManWonValue(manWon: number | null | undefined): string {
  if (manWon == null) return "-";

  const rounded = Math.round(manWon);
  const sign = rounded < 0 ? "-" : "";
  const absolute = Math.abs(rounded);

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

// 만원 포맷: 50000000 → "5,000만원", 100000000 -> "1억원"
export function formatManWon(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return formatManWonValue(amount / 10_000);
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
