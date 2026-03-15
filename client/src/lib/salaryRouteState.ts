import type { LocationQuery, LocationQueryRaw } from "vue-router";
import {
  buildQuery,
  parseQueryBoolean,
  parseQueryInt,
} from "@/lib/routeState";

type SalaryRouteQuery = LocationQuery | LocationQueryRaw;

export type SalaryRouteState = {
  annualGross: number;
  dependents: number;
  childrenUnder20: number;
  nonTaxableMonthly: number;
  retirementIncluded: boolean;
};

const DEFAULT_SALARY_ROUTE_STATE: SalaryRouteState = {
  annualGross: 30_000_000,
  dependents: 1,
  childrenUnder20: 0,
  nonTaxableMonthly: 200_000,
  retirementIncluded: false,
};

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function readClampedInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = parseQueryInt(value);
  return parsed === null ? fallback : clampInt(parsed, min, max);
}

export function parseSalaryRouteState(query: SalaryRouteQuery): SalaryRouteState {
  const dependents = readClampedInt(
    query.dep,
    DEFAULT_SALARY_ROUTE_STATE.dependents,
    1,
    20
  );
  const maxChildren = Math.max(0, dependents - 1);

  return {
    annualGross: readClampedInt(
      query.gross,
      DEFAULT_SALARY_ROUTE_STATE.annualGross,
      1,
      300_000_000
    ),
    dependents,
    childrenUnder20: readClampedInt(
      query.child,
      DEFAULT_SALARY_ROUTE_STATE.childrenUnder20,
      0,
      maxChildren
    ),
    nonTaxableMonthly: readClampedInt(
      query.nontax,
      DEFAULT_SALARY_ROUTE_STATE.nonTaxableMonthly,
      0,
      5_000_000
    ),
    retirementIncluded: parseQueryBoolean(
      query.retire,
      DEFAULT_SALARY_ROUTE_STATE.retirementIncluded
    ),
  };
}

export function buildSalaryRouteQuery(
  state: SalaryRouteState
): Record<string, string> {
  const normalizedDependents = clampInt(state.dependents, 1, 20);
  const maxChildren = Math.max(0, normalizedDependents - 1);

  return buildQuery({
    gross:
      clampInt(state.annualGross, 1, 300_000_000) !==
      DEFAULT_SALARY_ROUTE_STATE.annualGross
        ? clampInt(state.annualGross, 1, 300_000_000)
        : null,
    dep:
      normalizedDependents !== DEFAULT_SALARY_ROUTE_STATE.dependents
        ? normalizedDependents
        : null,
    child:
      clampInt(state.childrenUnder20, 0, maxChildren) !==
      DEFAULT_SALARY_ROUTE_STATE.childrenUnder20
        ? clampInt(state.childrenUnder20, 0, maxChildren)
        : null,
    nontax:
      clampInt(state.nonTaxableMonthly, 0, 5_000_000) !==
      DEFAULT_SALARY_ROUTE_STATE.nonTaxableMonthly
        ? clampInt(state.nonTaxableMonthly, 0, 5_000_000)
        : null,
    retire: state.retirementIncluded ? 1 : null,
  });
}
