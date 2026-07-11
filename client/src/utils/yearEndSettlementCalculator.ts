import {
  calcEarnedIncomeDeduction,
  calcEarnedIncomeTaxCredit,
  calcChildTaxCredit,
  calcIncomeTax,
  calcInsuranceDeduction,
} from "@/utils/calculator";
import {
  PERSONAL_DEDUCTION_PER_PERSON,
  LOCAL_INCOME_TAX_RATE,
  STANDARD_TAX_CREDIT,
} from "@/data/taxRates2026";
import { CARD_DEDUCTION, TAX_CREDITS } from "@/data/yearEndSettlement";
import { calculateIrpTaxCredit } from "@/utils/benefitCalculators";

export type YearEndSettlementInput = {
  annualSalary: number;
  dependents: number;
  children: number;
  // 신용카드 등 소득공제
  creditCardSpend: number;
  debitCardSpend: number;
  // 세액공제 항목
  insurancePremium: number;
  medicalExpense: number;
  educationExpense: number;
  donationAmount: number;
  pensionSavings: number;
  irpContribution: number;
  monthlyRent: number;
  rentMonths: number;
};

export type YearEndSettlementResult = {
  // 소득공제
  earnedIncomeDeduction: number;
  personalDeduction: number;
  insuranceDeduction: number;
  cardDeduction: number;
  totalIncomeDeduction: number;
  // 과세표준 + 산출세액
  taxableBase: number;
  calculatedTax: number;
  // 세액공제
  earnedIncomeTaxCredit: number;
  childTaxCredit: number;
  standardTaxCredit: number;
  insurancePremiumCredit: number;
  medicalExpenseCredit: number;
  educationExpenseCredit: number;
  donationCredit: number;
  pensionAccountCredit: number;
  monthlyRentCredit: number;
  totalTaxCredit: number;
  // 결정세액
  determinedTax: number;
  localTax: number;
  totalTax: number;
  // 기납부세액
  withheldTax: number;
  withheldLocalTax: number;
  // 정산
  settlementAmount: number;
  isRefund: boolean;
};

/** 신용카드 등 소득공제 계산 */
export function calcCardDeduction(
  annualSalary: number,
  creditCardSpend: number,
  debitCardSpend: number
): number {
  const minimumSpend = Math.floor(annualSalary * CARD_DEDUCTION.minimumSpendRate);
  const totalSpend = creditCardSpend + debitCardSpend;
  if (totalSpend <= minimumSpend) return 0;

  // 최소사용금액은 공제율 낮은 신용카드부터 차감
  let remainMinimum = minimumSpend;
  const creditAfterMinimum = Math.max(0, creditCardSpend - remainMinimum);
  remainMinimum = Math.max(0, remainMinimum - creditCardSpend);
  const debitAfterMinimum = Math.max(0, debitCardSpend - remainMinimum);

  const deduction =
    Math.floor(creditAfterMinimum * CARD_DEDUCTION.creditCardRate) +
    Math.floor(debitAfterMinimum * CARD_DEDUCTION.debitCardRate);

  // 공제한도
  const limitEntry = CARD_DEDUCTION.limits.find(
    (l) => annualSalary <= l.salaryLimit
  );
  const limit = limitEntry?.deductionLimit ?? 2_500_000;

  return Math.min(deduction, limit);
}

/** 보험료 세액공제 */
function calcInsurancePremiumCredit(premium: number): number {
  const recognized = Math.min(premium, TAX_CREDITS.insurancePremiumLimit);
  return Math.floor(recognized * TAX_CREDITS.insurancePremiumRate);
}

/** 의료비 세액공제 */
function calcMedicalExpenseCredit(
  annualSalary: number,
  expense: number
): number {
  const threshold = Math.floor(annualSalary * TAX_CREDITS.medicalThresholdRate);
  const excess = Math.max(0, expense - threshold);
  const recognized = Math.min(excess, TAX_CREDITS.medicalLimit);
  return Math.floor(recognized * TAX_CREDITS.medicalRate);
}

/** 교육비 세액공제 (본인 기준 — 한도 없음으로 단순화) */
function calcEducationExpenseCredit(expense: number): number {
  return Math.floor(expense * TAX_CREDITS.educationRate);
}

/** 기부금 세액공제 */
function calcDonationCredit(amount: number): number {
  if (amount <= 0) return 0;
  if (amount <= TAX_CREDITS.donationHighThreshold) {
    return Math.floor(amount * TAX_CREDITS.donationBaseRate);
  }
  const base = Math.floor(
    TAX_CREDITS.donationHighThreshold * TAX_CREDITS.donationBaseRate
  );
  const high = Math.floor(
    (amount - TAX_CREDITS.donationHighThreshold) * TAX_CREDITS.donationHighRate
  );
  return base + high;
}

/** 월세 세액공제 */
function calcRentCredit(
  annualSalary: number,
  monthlyRent: number,
  months: number
): number {
  if (annualSalary > 80_000_000) return 0;
  const rate = annualSalary <= 55_000_000 ? 0.17 : 0.15;
  const yearlyRent = monthlyRent * months;
  const recognized = Math.min(10_000_000, yearlyRent);
  return Math.floor(recognized * rate);
}

export function calculateYearEndSettlement(
  input: YearEndSettlementInput
): YearEndSettlementResult {
  const salary = Math.max(0, Math.floor(input.annualSalary));
  const deps = Math.max(1, Math.floor(input.dependents));
  const kids = Math.min(Math.max(0, deps - 1), Math.max(0, Math.floor(input.children)));

  // ── 소득공제 ──
  const earnedIncomeDeduction = calcEarnedIncomeDeduction(salary);
  const personalDeduction = deps * PERSONAL_DEDUCTION_PER_PERSON;

  // 4대보험 (월 과세 기준)
  const monthlyTaxable = Math.floor(salary / 12);
  const monthlyIns = calcInsuranceDeduction(monthlyTaxable);
  const insuranceDeduction = monthlyIns.totalInsurance * 12;

  const cardDeduction = calcCardDeduction(
    salary,
    Math.max(0, input.creditCardSpend),
    Math.max(0, input.debitCardSpend)
  );

  const totalIncomeDeduction =
    earnedIncomeDeduction + personalDeduction + insuranceDeduction + cardDeduction;

  // ── 과세표준 + 산출세액 ──
  const taxableBase = Math.max(0, salary - totalIncomeDeduction);
  const calculatedTax = calcIncomeTax(taxableBase);

  // ── 세액공제 ──
  const earnedIncomeTaxCredit = calcEarnedIncomeTaxCredit(calculatedTax, salary);
  const childTaxCredit = calcChildTaxCredit(kids);
  const standardTaxCredit = STANDARD_TAX_CREDIT;

  const insurancePremiumCredit = calcInsurancePremiumCredit(
    Math.max(0, input.insurancePremium)
  );
  const medicalExpenseCredit = calcMedicalExpenseCredit(
    salary,
    Math.max(0, input.medicalExpense)
  );
  const educationExpenseCredit = calcEducationExpenseCredit(
    Math.max(0, input.educationExpense)
  );
  const donationCredit = calcDonationCredit(Math.max(0, input.donationAmount));

  const irpResult = calculateIrpTaxCredit({
    annualSalary: salary,
    pensionSavings: Math.max(0, input.pensionSavings),
    irpContribution: Math.max(0, input.irpContribution),
  });
  const pensionAccountCredit = irpResult.taxCredit;

  const monthlyRentCredit = calcRentCredit(
    salary,
    Math.max(0, input.monthlyRent),
    Math.max(0, Math.min(12, input.rentMonths))
  );

  const totalTaxCredit =
    earnedIncomeTaxCredit +
    childTaxCredit +
    standardTaxCredit +
    insurancePremiumCredit +
    medicalExpenseCredit +
    educationExpenseCredit +
    donationCredit +
    pensionAccountCredit +
    monthlyRentCredit;

  // ── 결정세액 ──
  const determinedTax = Math.max(0, calculatedTax - totalTaxCredit);
  const localTax = Math.floor(determinedTax * LOCAL_INCOME_TAX_RATE);
  const totalTax = determinedTax + localTax;

  // ── 기납부세액 (원천징수) ──
  // 기존 calcIncomeTaxBundle로 원천징수 추정
  const withheldMonthlyIncome = Math.floor(determinedTaxFromWithholding(salary, deps, kids, monthlyIns.totalInsurance) / 12);
  const withheldTax = withheldMonthlyIncome * 12;
  const withheldLocalTax = Math.floor(withheldTax * LOCAL_INCOME_TAX_RATE);

  // ── 정산 ──
  const settlementAmount = totalTax - (withheldTax + withheldLocalTax);

  return {
    earnedIncomeDeduction,
    personalDeduction,
    insuranceDeduction,
    cardDeduction,
    totalIncomeDeduction,
    taxableBase,
    calculatedTax,
    earnedIncomeTaxCredit,
    childTaxCredit,
    standardTaxCredit,
    insurancePremiumCredit,
    medicalExpenseCredit,
    educationExpenseCredit,
    donationCredit,
    pensionAccountCredit,
    monthlyRentCredit,
    totalTaxCredit,
    determinedTax,
    localTax,
    totalTax,
    withheldTax,
    withheldLocalTax,
    settlementAmount,
    isRefund: settlementAmount < 0,
  };
}

/**
 * 원천징수 결정세액 추정
 * 회사에서 매월 원천징수 시에는 신용카드/의료비 등 특별공제가 반영되지 않음.
 * 기본적인 근로소득공제, 인적공제, 4대보험만 반영하여 원천징수세액 산출.
 */
function determinedTaxFromWithholding(
  salary: number,
  dependents: number,
  children: number,
  monthlyInsurance: number
): number {
  const earned = calcEarnedIncomeDeduction(salary);
  const personal = dependents * PERSONAL_DEDUCTION_PER_PERSON;
  const insurance = monthlyInsurance * 12;
  const base = Math.max(0, salary - earned - personal - insurance);
  const tax = calcIncomeTax(base);
  const credit = calcEarnedIncomeTaxCredit(tax, salary);
  const childCredit = calcChildTaxCredit(children);
  return Math.max(0, tax - credit - STANDARD_TAX_CREDIT - childCredit);
}
