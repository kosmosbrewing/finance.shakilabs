export type ChangeAreaId = "pay" | "deduction" | "family" | "youth" | "asset" | "car";
export type ChangeStatusId = "passed" | "review";
export type ChangeSourceId = "taxReform" | "minWage" | "childcare" | "budget" | "youthBudget" | "marriageBudget";
export type ChangeApp = "finance" | "baby" | "house" | "invest" | "car";

export interface ChangeSource {
  title: string;
  url: string;
  /** YYYY-MM-DD — 출처 게시일 */
  date: string;
}

export interface Change2027Item {
  id: string;
  area: ChangeAreaId;
  status: ChangeStatusId;
  source: ChangeSourceId;
  title: string;
  /** 한 문장, 30~60자 */
  line: string;
  before: string;
  after: string;
  target: string;
  effective: string;
  calc?: { app: ChangeApp; path: string; label: string };
  details?: readonly string[];
}

export const CHANGES_2027_VERIFIED_AT: string;
export const CHANGES_2027_META: {
  path: "/2027";
  heading: string;
  intro: string;
  title: string;
  description: string;
};
export const CHANGE_AREAS: ReadonlyArray<{ id: ChangeAreaId; label: string }>;
export const CHANGE_STATUSES: Record<ChangeStatusId, { label: string; tone: "success" | "warning" }>;
export const CHANGE_SOURCES: Record<ChangeSourceId, ChangeSource>;
export const CHANGES_2027: readonly Change2027Item[];
export const CHANGES_2027_FAQS: ReadonlyArray<{ q: string; a: string }>;
export function changeCalcHref(item: Change2027Item): string | null;
export function formatChangeDate(date: string): string;
export function changesStatusSummary(): string;
