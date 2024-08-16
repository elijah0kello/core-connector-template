import { IHTTPClient, ILogger, THttpResponse } from '../interfaces';

export enum IdType {
    MSISDN = 'MSISDN',
    IBAN = 'IBAN',
    ACCOUNT_NO = 'ACCOUNT_NO',
    EMAIL = 'EMAIL',
    PERSONAL_ID = 'PERSONAL_ID',
    BUSINESS = 'BUSINESS',
    DEVICE = 'DEVICE',
    ACCOUNT_ID = 'ACCOUNT_ID',
    ALIAS = 'ALIAS',
}

export enum PartyType {
    CONSUMER = 'CONSUMER',
    AGENT = 'AGENT',
    BUSINESS = 'BUSINESS',
    DEVICE = 'DEVICE',
}

// maybe, we can remove prefix FINERACT_ from all fileds?
export type TFineractConfig = {
    FINERACT_BASE_URL: string;
    FINERACT_TENANT_ID: string;
    FINERACT_AUTH_MODE: string;
    FINERACT_USERNAME: string;
    FINERACT_PASSWORD: string;
    FINERACT_BANK_ID: string;
    FINERACT_ACCOUNT_PREFIX: string;
    FINERACT_BANK_COUNTRY_CODE: string;
    FINERACT_CHECK_DIGITS: string;
    FINERACT_ID_TYPE: IdType;
    FINERACT_LOCALE: string;
    FINERACT_PAYMENT_TYPE_ID: string;
};

export enum FineractLookupStage {
    SEARCH = 'search',
    SAVINGSACCOUNT = 'savingsaccount',
    CLIENT = 'client',
}

export type TLookupResponseInfo = {
    data: TFineractGetClientResponse;
    status: number;
    currency: string;
    accountId: number;
};

export type TAccountEntity = {
    entityId: number;
    entityAccountNo: string;
    entityName: string;
    entityType: string;
    parentId: number;
    parentName: string;
    entityStatus: unknown;
    parentType: string;
    subEntityType: string;
};

export type TFineractSearchResponse = TAccountEntity[];

export type TFineractAccountStatus = {
    id: number;
    code: string;
    value: string;
    submittedAndPendingApproval: boolean;
    approved: boolean;
    rejected: boolean;
    withdrawnByApplicant: boolean;
    active: boolean;
    closed: boolean;
    prematureClosed: boolean;
    transferInProgress: boolean;
    transferOnHold: boolean;
    matured: boolean;
};

// todo: are all fields required?
export type TFineractGetAccountResponse = {
    id: string;
    accountNo: string;
    depositType: unknown;
    clientId: number;
    clientName: string;
    savingsProductId: number;
    savingsProductName: string;
    fieldOfficerId: number;
    status: TFineractAccountStatus;
    subStatus: {
        id: number;
        code: string;
        value: string;
        none: boolean;
        inactive: boolean;
        dormant: boolean;
        escheat: boolean;
        block: boolean;
        blockCredit: boolean;
        blockDebit: boolean;
    };
    timeline: unknown;
    currency: {
        code: string;
        name: string;
        decimalPlaces: number;
        inMultiplesOf: number;
        nameCode: number;
        displayLabel: number;
    };
    nominalAnnualInterestRate: number;
    interestCompoundingPeriodType: unknown;
    interestPostingPeriodType: unknown;
    interestCalculationType: unknown;
    interestCalculationDaysInYearType: unknown;
    withdrawalFeeForTransfers: boolean;
    allowOverdraft: boolean;
    enforceMinRequiredBalance: boolean;
    withHoldTax: boolean;
    lastActiveTransactionDate: [];
    isDormancyTrackingActive: boolean;
    daysToInactive: number;
    daysToDormancy: number;
    daysToEscheat: number;
    summary: {
        currency: {
            code: string;
            name: string;
            decimalPlaces: number;
            displaySymbol: string;
            nameCode: string;
            displayLabel: string;
        };
        accountBalance: number;
        availableBalance: number;
    };
};

export type TFineractGetClientResponse = {
    id: number;
    accountNo: string;
    status: {
        id: number;
        code: string;
        value: string;
    };
    subStatus: {
        active: boolean;
        mandatory: boolean;
    };
    active: boolean;
    activationDate: [];
    firstname: string;
    lastname: string;
    displayName: string;
    gender: {
        active: boolean;
        mandatory: boolean;
    };
    clientType: {
        active: boolean;
        mandatory: boolean;
    };
    clientClassification: {
        active: boolean;
        mandatory: boolean;
    };
    isStaff: boolean;
    officeId: number;
    officeName: string;
    staffId: number;
    staffName: string;
    timeline: {
        submittedOnDate: [];
        submittedByUsername: string;
        submittedByFirstname: string;
        submittedByLastname: string;
        activatedOnDate: [];
        activatedByUsername: string;
        activatedByFirstname: string;
        activatedByLastname: string;
    };
    clientCollateralManagements: [];
    groups: [];
    clientNonPersonDetails: {
        constitution: {
            active: boolean;
            mandatory: boolean;
        };
        mainBusinessLine: {
            active: boolean;
            mandatory: boolean;
        };
    };
};

export interface IFineractClient {
    fineractConfig: TFineractConfig;
    httpClient: IHTTPClient;
    logger: ILogger;
    lookupPartyInfo(accountNo: string): Promise<TLookupResponseInfo>;
    verifyBeneficiary(accountNo: string): Promise<TLookupResponseInfo>;
    receiveTransfer(transferDeps: TFineractTransferDeps): Promise<THttpResponse<TFineractTransactionResponse>>;
    getAccountId(accountNo: string): Promise<TLookupResponseInfo>;
    calculateWithdrawQuote(quoteDeps: TCalculateQuoteDeps): Promise<TCalculateQuoteResponse>;
    getSavingsAccount(accountId: number): Promise<THttpResponse<TFineractGetAccountResponse>>;
    sendTransfer(transactionPayload: TFineractTransferDeps): Promise<THttpResponse<TFineractTransactionResponse>>;
}

export type TFineractClientFactoryDeps = {
    fineractConfig: TFineractConfig;
    httpClient: IHTTPClient;
    logger: ILogger;
};

export type TCalculateQuoteDeps = {
    amount: number;
};

export type TCalculateQuoteResponse = {
    feeAmount: number;
};

export type TFineractTransactionPayload = {
    locale: string;
    dateFormat: string;
    transactionDate: string;
    transactionAmount: string;
    paymentTypeId: string;
    accountNumber: string;
    routingCode: string;
    receiptNumber: string;
    bankNumber: string;
};

export type TFineractTransferDeps = {
    accountId: number;
    transaction: TFineractTransactionPayload;
};

export type TFineractTransactionResponse = {
    officeId: number;
    clientId: number;
    savingsId: number;
    resourceId: number;
    changes: {
        accountNumber: string;
        routingCode: string;
        receiptNumber: string;
        bankNumber: string;
    };
};

export type TFineractCharge = {
    id: number;
    name: string;
    active: boolean;
    penalty: boolean;
    currency: {
        code: string;
        name: string;
        decimalPlaces: number;
        displaySymbol: string;
        nameCode: string;
        displayLabel: string;
    };
    amount: number;
    chargeTimeType: {
        id: number;
        code: string;
        value: string;
    };
    chargeAppliesTo: {
        id: number;
        code: string;
        value: string;
    };
    chargeCalculationType: {
        id: number;
        code: string;
        value: string;
    };
    chargePaymentMode: {
        id: number;
        code: string;
        value: string;
    };
};

export type TFineractGetChargeResponse = TFineractCharge[];
