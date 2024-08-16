/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.


 - Okello Ivan Elijah <elijahokello90@gmail.com>

 --------------
 ******/

'use strict';

import { randomUUID } from 'crypto';
import {
    IFineractClient,
    IdType,
    PartyType,
    TFineractConfig,
    TFineractTransactionPayload,
    TFineractTransferDeps,
    TFineractGetAccountResponse,
} from './CBSClient';
import {
    ILogger,
    TLookupPartyInfoResponse,
    TQuoteResponse,
    TQuoteRequest,
    TtransferResponse,
    TtransferRequest,
    ValidationError,
} from './interfaces';
import {
    ISDKClient,
    SDKClientError,
    TFineractOutboundTransferRequest,
    TFineractOutboundTransferResponse,
    TSDKOutboundTransferRequest,
    TtransferContinuationResponse,
    TUpdateTransferDeps,
} from './SDKClient';
import { FineractError } from './CBSClient';

export class CoreConnectorAggregate {
    public IdType: string;
    private logger: ILogger;
    DATE_FORMAT = 'dd MM yy';

    constructor(
        private readonly fineractConfig: TFineractConfig,
        private readonly fineractClient: IFineractClient,
        private readonly sdkClient: ISDKClient,
        logger: ILogger,
    ) {
        this.IdType = fineractConfig.FINERACT_ID_TYPE;
        this.logger = logger;
    }

    async getParties(IBAN: string): Promise<TLookupPartyInfoResponse> {
        this.logger.info(`Get Parties for IBAN ${IBAN}`);
        const accountNo = this.extractAccountFromIBAN(IBAN);
        const lookupRes = await this.fineractClient.lookupPartyInfo(accountNo);
        const party = {
            data: {
                displayName: lookupRes.data.displayName,
                firstName: lookupRes.data.firstname,
                idType: IdType.IBAN,
                idValue: accountNo,
                lastName: lookupRes.data.lastname,
                middleName: lookupRes.data.firstname,
                type: PartyType.CONSUMER,
                kycInformation: `${JSON.stringify(lookupRes.data)}`,
            },
            statusCode: lookupRes.status,
        };
        this.logger.info(`Party found`, { party });
        return party;
    }

    async quoteRequest(quoteRequest: TQuoteRequest): Promise<TQuoteResponse> {
        this.logger.info(`Get Parties for ${this.IdType} ${quoteRequest.to.idValue}`);
        if (quoteRequest.to.idType !== this.IdType) {
            throw ValidationError.unsupportedIdTypeError();
        }
        const accountNo = this.extractAccountFromIBAN(quoteRequest.to.idValue);
        await this.fineractClient.verifyBeneficiary(accountNo);

        return {
            expiration: new Date().toJSON(),
            payeeFspCommissionAmount: '0',
            payeeFspCommissionAmountCurrency: quoteRequest.currency,
            payeeFspFeeAmount: '0',
            payeeFspFeeAmountCurrency: quoteRequest.currency,
            payeeReceiveAmount: quoteRequest.amount,
            payeeReceiveAmountCurrency: quoteRequest.currency,
            quoteId: quoteRequest.quoteId,
            transactionId: quoteRequest.transactionId,
            transferAmount: quoteRequest.amount,
            transferAmountCurrency: quoteRequest.currency,
        };
    }

    async receiveTransfer(transfer: TtransferRequest): Promise<TtransferResponse> {
        this.logger.info(`Transfer for  ${this.IdType} ${transfer.to.idValue}`);
        if (transfer.to.idType != this.IdType) {
            throw ValidationError.unsupportedIdTypeError();
        }

        const accountNo = this.extractAccountFromIBAN(transfer.to.idValue);
        const res = await this.fineractClient.getAccountId(accountNo);
        const date = new Date();
        const transaction: TFineractTransactionPayload = {
            locale: this.fineractConfig.FINERACT_LOCALE,
            dateFormat: this.DATE_FORMAT,
            transactionDate: `${date.getDate()} ${date.getMonth() + 1} ${date.getFullYear()}`,
            transactionAmount: transfer.amount,
            paymentTypeId: this.fineractConfig.FINERACT_PAYMENT_TYPE_ID,
            accountNumber: accountNo,
            routingCode: randomUUID(),
            receiptNumber: randomUUID(),
            bankNumber: this.fineractConfig.FINERACT_BANK_ID,
        };

        await this.fineractClient.receiveTransfer({
            accountId: res.accountId as number,
            transaction: transaction,
        });
        return {
            completedTimestamp: new Date().toJSON(),
            homeTransactionId: transfer.transferId,
            transferState: 'COMMITTED',
        };
    }

    async sendTransfer(transfer: TFineractOutboundTransferRequest): Promise<TFineractOutboundTransferResponse> {
        this.logger.info(`Transfer from fineract account with ID${transfer.from.fineractAccountId}`);
        const accountData = await this.getSavingsAccount(transfer.from.fineractAccountId);
        if (accountData.subStatus.blockCredit || accountData.subStatus.blockDebit) {
            const errMessage = 'Account blocked from credit or debit';
            this.logger.warn(errMessage, accountData);
            throw FineractError.accountDebitOrCreditBlockedError(errMessage);
        }
        const sdkOutboundTransfer: TSDKOutboundTransferRequest = this.getSDKTransferRequest(transfer);
        const transferRes = await this.sdkClient.initiateTransfer(sdkOutboundTransfer);
        if (
            !transferRes.data.quoteResponse ||
            !transferRes.data.quoteResponse.body.payeeFspCommission ||
            !transferRes.data.quoteResponse.body.payeeFspFee
        ) {
            throw SDKClientError.noQuoteReturnedError();
        }
        const totalFineractFee = await this.fineractClient.calculateWithdrawQuote({
            amount: this.getAmountSum([
                parseFloat(transferRes.data.amount),
                parseFloat(transferRes.data.quoteResponse.body.payeeFspFee.amount),
                parseFloat(transferRes.data.quoteResponse.body.payeeFspCommission.amount),
            ]),
        });
        if (!this.checkAccountBalance(totalFineractFee.feeAmount, accountData.summary.availableBalance)) {
            this.logger.warn('Payer account does not have sufficient funds for transfer', accountData);
            throw FineractError.accountInsufficientBalanceError();
        }

        return {
            totalAmountFromFineract: totalFineractFee.feeAmount,
            transferResponse: transferRes.data,
        };
    }

    async updateSentTransfer(transferAccept: TUpdateTransferDeps): Promise<TtransferContinuationResponse> {
        this.logger.info(
            `Continuing transfer with id ${transferAccept.sdkTransferId} and account with id ${transferAccept.fineractTransaction.fineractAccountId}`,
        );
        let transaction: TFineractTransferDeps | null = null;

        try {
            transaction = await this.getTransaction(transferAccept);
            const withdrawRes = await this.fineractClient.sendTransfer(transaction);
            if (withdrawRes.statusCode != 200) {
                throw FineractError.withdrawFailedError(`Withdraw failed with status code ${withdrawRes.statusCode}`);
            }

            const updateTransferRes = await this.sdkClient.updateTransfer(
                { acceptQuote: true },
                transferAccept.sdkTransferId as number,
            );

            return updateTransferRes.data;
        } catch (error: unknown) {
            if (transaction) return await this.processUpdateSentTransferError(error, transaction);
            throw error;
        }
    }

    extractAccountFromIBAN(IBAN: string): string {
        // todo: think how to validate account numbers
        const accountNo = IBAN.slice(
            this.fineractConfig.FINERACT_BANK_COUNTRY_CODE.length +
                this.fineractConfig.FINERACT_CHECK_DIGITS.length +
                this.fineractConfig.FINERACT_BANK_ID.length +
                this.fineractConfig.FINERACT_ACCOUNT_PREFIX.length,
        );
        this.logger.debug('extracted account number from IBAN:', { accountNo, IBAN });
        if (accountNo.length < 1) {
            throw ValidationError.invalidAccountNumberError();
        }

        return accountNo;
    }

    private getSDKTransferRequest(transfer: TFineractOutboundTransferRequest): TSDKOutboundTransferRequest {
        return {
            homeTransactionId: transfer.homeTransactionId,
            from: transfer.from.payer,
            to: transfer.to,
            amountType: transfer.amountType,
            currency: transfer.currency,
            amount: transfer.amount,
            transactionType: transfer.transactionType,
            subScenario: transfer.subScenario,
            note: transfer.note,
            quoteRequestExtensions: transfer.quoteRequestExtensions,
            transferRequestExtensions: transfer.transferRequestExtensions,
            skipPartyLookup: transfer.skipPartyLookup,
        };
    }

    private getAmountSum(amounts: number[]): number {
        let sum = 0;
        for (const amount of amounts) {
            sum = amount + sum;
        }
        return sum;
    }

    private checkAccountBalance(totalAmount: number, accountBalance: number): boolean {
        return accountBalance > totalAmount;
    }

    private async getSavingsAccount(accountId: number): Promise<TFineractGetAccountResponse> {
        this.logger.debug('getting active savingsAccount...', { accountId });
        const account = await this.fineractClient.getSavingsAccount(accountId);

        if (!account.data.status.active) {
            throw ValidationError.accountVerificationError();
        }

        return account.data;
    }

    private async getTransaction(transferAccept: TUpdateTransferDeps): Promise<TFineractTransferDeps> {
        this.logger.info('Getting fineract transaction');
        const accountRes = await this.fineractClient.getSavingsAccount(
            transferAccept.fineractTransaction.fineractAccountId,
        );

        const date = new Date();
        return {
            accountId: transferAccept.fineractTransaction.fineractAccountId,
            transaction: {
                locale: this.fineractConfig.FINERACT_LOCALE,
                dateFormat: this.DATE_FORMAT,
                transactionDate: `${date.getDate()} ${date.getMonth() + 1} ${date.getFullYear()}`,
                transactionAmount: transferAccept.fineractTransaction.totalAmount.toString(),
                paymentTypeId: this.fineractConfig.FINERACT_PAYMENT_TYPE_ID,
                accountNumber: accountRes.data.accountNo,
                routingCode: transferAccept.fineractTransaction.routingCode,
                receiptNumber: transferAccept.fineractTransaction.receiptNumber,
                bankNumber: transferAccept.fineractTransaction.bankNumber,
            },
        };
    }

    // think of better way to handle refunding
    private async processUpdateSentTransferError(error: unknown, transaction: TFineractTransferDeps): Promise<never> {
        let needRefund = error instanceof SDKClientError;
        try {
            const errMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`error in updateSentTransfer: ${errMessage}`, { error, needRefund, transaction });
            if (!needRefund) throw error;
            //Refund the money
            const depositRes = await this.fineractClient.receiveTransfer(transaction);
            if (depositRes.statusCode != 200) {
                const logMessage = `Invalid statusCode from fineractClient.receiveTransfer: ${depositRes.statusCode}`;
                this.logger.warn(logMessage);
                throw new Error(logMessage);
            }
            needRefund = false;
            this.logger.info('Refund successful', { needRefund });
            throw error;
        } catch (err: unknown) {
            if (!needRefund) throw error;

            const details = {
                amount: parseFloat(transaction.transaction.transactionAmount),
                fineractAccountId: transaction.accountId,
            };
            this.logger.error('refundFailedError', { details, transaction });
            throw ValidationError.refundFailedError(details);
        }
    }
}
