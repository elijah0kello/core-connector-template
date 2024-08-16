export const CHARGE_TIME_TYPES = {
    Disbursement: 1,
    SpecifiedDueDate: 2,
    SavingsActivation: 3,
    Withdrawal: 5,
    AnnualFee: 6,
    MonthlyFee: 7,
} as const;

export const CHARGE_APPLIES_TO = {
    Loans: 1,
    Savings: 2,
    Client: 3,
} as const;
