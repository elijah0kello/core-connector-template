import { TUpdateTransferDeps } from '../src/domain/SDKClient';
import { TFineractGetAccountResponse, TFineractTransactionResponse } from '../src/domain/CBSClient';
import * as crypto from 'node:crypto';

type TransferAcceptInputDto = {
    fineractAccountId?: number;
    totalAmount?: number;
    sdkTransferId?: number;
};

export const transferAcceptDto = ({
    fineractAccountId = 1,
    totalAmount = 123.45,
    sdkTransferId = 999,
}: TransferAcceptInputDto = {}): TUpdateTransferDeps =>
    ({
        fineractTransaction: {
            fineractAccountId,
            totalAmount,
            routingCode: 'routingCode',
            receiptNumber: 'receiptNumber',
            bankNumber: 'bankNumber',
        },
        sdkTransferId,
    }) as const;

// todo: make it configurable, add all required fields
export const fineractGetAccountResponseDto = (): Partial<TFineractGetAccountResponse> =>
    ({
        id: 'id',
        accountNo: 'accountNo',
        clientId: 123,
        clientName: 'clientName',
    }) as const;

// todo: make it configurable,
export const fineractTransactionResponseDto = (): TFineractTransactionResponse =>
    ({
        officeId: 1,
        clientId: 2,
        savingsId: 3,
        resourceId: 4,
        changes: {
            accountNumber: 'accountNumber',
            routingCode: 'routingCode',
            receiptNumber: 'receiptNumber',
            bankNumber: 'bankNumber',
        },
    }) as const;

export const fineractLookUpPartyResponseDto = () =>
    ({
        displayName: 'Dove Love',
        firstname: 'Dove',
        lastname: 'Love',
    }) as const;

export const fineractVerifyBeneficiaryResponseDto = () =>
    ({
        currency: 'UGX',
        amount: '100',
        quoteId: crypto.randomUUID(),
        transactionId: crypto.randomUUID(),
    }) as const;

export const fineractGetAccountIdResponseDto = () => ({
    accountId: 1,
});

export const fineractReceiveTransferResponseDto = () => true;

export const fineractGetSavingsAccountResponseDto = (
    credit: boolean,
    debit: boolean,
    balance: number,
    active: boolean,
) => ({
    status: {
        active: active,
    },
    subStatus: {
        blockCredit: credit,
        blockDebit: debit,
    },
    summary: {
        availableBalance: balance,
    },
});

export const sdkInitiateTransferResponseDto = (
    payeeFspCommissionAmount: string | undefined,
    payeeFspFeeAmount: string | undefined,
) => ({
    quoteResponse: {
        body: {
            payeeFspCommission: {
                amount: payeeFspCommissionAmount,
            },
            payeeFspFee: {
                amount: payeeFspFeeAmount,
            },
        },
    },
});

export const fineractCalculateWithdrawQuoteResponseDto = (feeAmount: number) => feeAmount;
