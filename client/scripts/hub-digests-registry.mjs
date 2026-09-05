// Registry of every cross-band digest, keyed by the route whose hub renders it.
//
// Why a registry: the digests are the one kind of prose this site writes in volume, and prose
// written in volume is exactly what a spam reviewer tests for templating. verify-digest-similarity
// walks this table so each new digest is checked against every other one automatically — a digest
// that is wired into a hub but missing here fails the build.

import {
  compareRetentionDigest,
  comprehensiveTaxGapDigest,
  comprehensiveTaxSeparateDigest,
  freelancerExpenseCliffDigest,
  freelancerPrepaidGapDigest,
  insuranceBracketDigest,
  insuranceCrossoverDigest,
  quitFundingMixDigest,
  quitSeveranceTaxDigest,
  salaryDependentDigest,
  salaryPensionCapDigest,
} from "./hub-digests.mjs";
import {
  severanceTaxFreeLineDigest,
  severanceWindowDaysDigest,
  withholdingRefundCeilingDigest,
  withholdingSensitivityDigest,
} from "./hub-digests-payroll.mjs";
import {
  annualLeaveDenominatorDigest,
  annualLeaveStaircaseDigest,
  bonusInvariantsDigest,
  bonusRetentionCurveDigest,
  employerBudgetDigest,
  employerCapCurveDigest,
  freelanceRateFlipDigest,
  freelanceRateVersusEmployeeDigest,
  overtimeNetHourDigest,
  overtimeStackingDigest,
  partTimeNetDigest,
  pensionClaimAgeDigest,
  pensionRedistributionDigest,
  raiseRetentionBandsDigest,
  raiseStructureDigest,
  rentCreditCapDigest,
  rentCreditCliffsDigest,
  weeklyHolidayNetHourlyDigest,
  weeklyHolidayThresholdDigest,
} from "./hub-digests-tools.mjs";

export const DIGEST_SOURCES = {
  "/insurance": [insuranceBracketDigest, insuranceCrossoverDigest],
  "/salary": [salaryDependentDigest, salaryPensionCapDigest],
  "/comprehensive-tax": [comprehensiveTaxGapDigest, comprehensiveTaxSeparateDigest],
  "/compare": [compareRetentionDigest],
  "/quit": [quitSeveranceTaxDigest, quitFundingMixDigest],
  "/freelancer": [freelancerExpenseCliffDigest, freelancerPrepaidGapDigest],
  "/withholding": [withholdingSensitivityDigest, withholdingRefundCeilingDigest],
  "/severance-pay": [severanceTaxFreeLineDigest, severanceWindowDaysDigest],
  "/weekly-holiday-pay": [weeklyHolidayThresholdDigest, weeklyHolidayNetHourlyDigest],
  "/pension": [pensionRedistributionDigest, pensionClaimAgeDigest],
  "/annual-leave": [annualLeaveStaircaseDigest, annualLeaveDenominatorDigest],
  "/guide/part-time": [partTimeNetDigest],
  "/freelance-rate": [freelanceRateFlipDigest, freelanceRateVersusEmployeeDigest],
  "/bonus": [bonusRetentionCurveDigest, bonusInvariantsDigest],
  "/monthly-rent-deduction": [rentCreditCliffsDigest, rentCreditCapDigest],
  "/4-insurance-employer": [employerCapCurveDigest, employerBudgetDigest],
  "/raise": [raiseRetentionBandsDigest, raiseStructureDigest],
  "/overtime": [overtimeNetHourDigest, overtimeStackingDigest],
};

// Prose only — headings, paragraphs, table notes and callouts. Table cells are numbers and would
// only add noise to a similarity score either way.
export function digestProse(digest) {
  return [digest.h2, ...digest.body, digest.tableNote, digest.callout]
    .filter(Boolean)
    .join(" ");
}
