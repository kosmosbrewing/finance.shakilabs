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
import {
  parentalStaircaseDigest,
  parentalVariantFlatDigest,
  regionalHealthDependentCliffDigest,
  regionalHealthRatioDigest,
  unemploymentDaysDigest,
  unemploymentFlatBandDigest,
  unpaidWageEquivalenceDigest,
  unpaidWageStartDateDigest,
} from "./hub-digests-benefits.mjs";
import {
  wageNetHourlyDigest,
  wageRoundTripDigest,
  yearEndDeductionValueDigest,
  yearEndTimingDigest,
} from "./hub-digests-settlement.mjs";
import {
  eitcCurveShapeDigest,
  eitcDoubleIncomeCombinedDigest,
  eitcDoubleIncomeJointTestDigest,
  eitcEffectiveRateDigest,
  eitcSingleIncomeBoundaryDigest,
  eitcSingleIncomeDoubleTaperDigest,
  eitcSingleMarginDigest,
  eitcSinglePartTimeDigest,
} from "./hub-digests-eitc.mjs";
import {
  dependentCliffCostDigest,
  dependentUnitConversionDigest,
  irpBindingLimitDigest,
  irpBoundaryReversalDigest,
} from "./hub-digests-retirement.mjs";

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
  "/unemployment": [unemploymentFlatBandDigest, unemploymentDaysDigest],
  "/parental-leave": [parentalStaircaseDigest, parentalVariantFlatDigest],
  "/regional-health": [regionalHealthRatioDigest, regionalHealthDependentCliffDigest],
  "/unpaid-wage": [unpaidWageEquivalenceDigest, unpaidWageStartDateDigest],
  "/year-end-settlement": [yearEndDeductionValueDigest, yearEndTimingDigest],
  "/wage-converter": [wageRoundTripDigest, wageNetHourlyDigest],
  "/eitc": [eitcCurveShapeDigest, eitcEffectiveRateDigest],
  // 가구 유형 변종은 사이트맵에 남아 있는 유일한 변종 가족이라, 세 페이지가 서로 다른 결론에
  // 도달하는지를 이 게이트가 직접 검사한다.
  "/eitc/single": [eitcSinglePartTimeDigest, eitcSingleMarginDigest],
  "/eitc/single-income": [eitcSingleIncomeDoubleTaperDigest, eitcSingleIncomeBoundaryDigest],
  "/eitc/double-income": [eitcDoubleIncomeCombinedDigest, eitcDoubleIncomeJointTestDigest],
  "/irp": [irpBindingLimitDigest, irpBoundaryReversalDigest],
  "/dependent": [dependentCliffCostDigest, dependentUnitConversionDigest],
};

// Prose only - headings, paragraphs, table notes and callouts. Table cells are numbers and would
// only add noise to a similarity score either way. Blocks (an h3 finding plus its paragraphs) count
// too: a templated digest would template its headings first, so leaving them out would blind the gate.
export function digestProse(digest) {
  const blockProse = (digest.blocks ?? []).flatMap((block) => [
    block.h3,
    ...[block.body].flat(),
    block.tableNote,
  ]);
  return [digest.h2, ...digest.body, ...blockProse, digest.tableNote, digest.callout]
    .filter(Boolean)
    .join(" ");
}
