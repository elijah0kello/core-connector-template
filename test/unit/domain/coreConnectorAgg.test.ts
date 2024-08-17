/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Eugen Klymniuk <eugen.klymniuk@infitx.com>
 --------------
 **********/

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { CoreConnectorAggregate, TtransferRequest, ValidationError } from '../../../src/domain';
import { FineractClientFactory, FineractError, IFineractClient } from '../../../src/domain/CBSClient';
import {
    ISDKClient,
    SDKClientError,
    SDKClientFactory,
    TFineractOutboundTransferRequest,
} from '../../../src/domain/SDKClient';
import { AxiosClientFactory } from '../../../src/infra/axiosHttpClient';
import { loggerFactory } from '../../../src/infra/logger';
import config from '../../../src/config';
import * as fixtures from '../../fixtures';
import * as crypto from 'node:crypto';
import { randomUUID } from 'crypto';
import {
    fineractCalculateWithdrawQuoteResponseDto,
    fineractGetSavingsAccountResponseDto,
    sdkInitiateTransferResponseDto,
} from '../../fixtures';

const mockAxios = new MockAdapter(axios);
const logger = loggerFactory({ context: 'ccAgg tests' });
const fineractConfig = config.get('fineract');
const SDK_URL = 'http://localhost:4040';
const IBAN = 'UG680720000289000000006';

describe('CoreConnectorAggregate Tests -->', () => {
    let ccAggregate: CoreConnectorAggregate;
    let fineractClient: IFineractClient;
    let sdkClient: ISDKClient;

    beforeEach(() => {
        mockAxios.reset();
        const httpClient = AxiosClientFactory.createAxiosClientInstance();
        sdkClient = SDKClientFactory.getSDKClientInstance(logger, httpClient, SDK_URL);
        fineractClient = FineractClientFactory.createClient({
            fineractConfig,
            httpClient,
            logger,
        });
        ccAggregate = new CoreConnectorAggregate(fineractConfig, fineractClient, sdkClient, logger);
    });

    describe('updateSentTransfer Method Tests -->', () => {
        beforeEach(() => {
            fineractClient.getSavingsAccount = jest.fn().mockResolvedValue({
                statusCode: 200,
                data: fixtures.fineractGetAccountResponseDto(),
            });
            fineractClient.sendTransfer = jest.fn().mockResolvedValue({
                statusCode: 200,
                data: fixtures.fineractTransactionResponseDto(),
            });
        });

        test('should re-throw SDKClientError if sdkClient.updateTransfer() fails', async () => {
            fineractClient.receiveTransfer = jest.fn().mockResolvedValue({
                statusCode: 200,
            });
            const httpCode = 500;
            mockAxios.onAny().reply(httpCode, {}); // mocking sdkClient.updateTransfer() failure

            try {
                await ccAggregate.updateSentTransfer(fixtures.transferAcceptDto());
                throw new Error('Test failed');
            } catch (err) {
                expect(err).toBeInstanceOf(SDKClientError);
                expect((err as SDKClientError)?.httpCode).toBe(httpCode);
            }
        });

        test('should re-throw refundFailedError if fineractClient.receiveTransfer() fails', async () => {
            fineractClient.receiveTransfer = jest.fn().mockResolvedValue({
                statusCode: 500,
            });

            const transferAccept = fixtures.transferAcceptDto();
            try {
                await ccAggregate.updateSentTransfer(transferAccept);
                throw new Error('Test failed');
            } catch (err: unknown) {
                expect(err).toBeInstanceOf(ValidationError);
                const refundFailedError = ValidationError.refundFailedError({
                    amount: transferAccept.fineractTransaction.totalAmount,
                    fineractAccountId: transferAccept.fineractTransaction.fineractAccountId,
                });
                expect(err).toEqual(refundFailedError);
            }
        });
    });

    describe('getParties Method Tests -->', () => {
        beforeEach(() => {
            fineractClient.lookupPartyInfo = jest.fn().mockResolvedValue({
                statusCode: 200,
                data: fixtures.fineractLookUpPartyResponseDto(),
            });
        });

        test('should pass if data fineract.lookUpParty resolves', async () => {
            const lookupRes = await ccAggregate.getParties('UG0000000008892343');
            expect(lookupRes.data.firstName).toEqual('Dova');
        });
    });

    describe('quoteRequest Method Tests', () => {
        beforeEach(() => {
            fineractClient.verifyBeneficiary = jest.fn().mockResolvedValue({
                statusCode: 200,
                data: fixtures.fineractVerifyBeneficiaryResponseDto(),
            });
        });

        test('test quoteRequest should pass', async () => {
            const quoteRes = await ccAggregate.quoteRequest({
                amount: '1000',
                amountType: 'SEND',
                currency: 'UGX',
                from: {
                    dateOfBirth: '2036-10-31',
                    displayName: 'string',
                    extensionList: [
                        {
                            key: 'string',
                            value: 'string',
                        },
                    ],
                    firstName: 'string',
                    fspId: 'string',
                    idSubValue: 'string',
                    idType: 'MSISDN',
                    idValue: 'string',
                    lastName: 'string',
                    merchantClassificationCode: 'string',
                    middleName: 'string',
                    type: 'CONSUMER',
                },
                initiator: 'PAYER',
                initiatorType: 'CONSUMER',
                note: 'string',
                quoteId: 'adbdb5be-d359-300a-bbcf-60d25a2ef3f9',
                subScenario: 'string',
                to: {
                    dateOfBirth: '2036-10-31',
                    displayName: 'string',
                    extensionList: [
                        {
                            key: 'string',
                            value: 'string',
                        },
                    ],
                    firstName: 'string',
                    fspId: 'string',
                    idSubValue: 'string',
                    idType: 'IBAN',
                    idValue: IBAN,
                    lastName: 'string',
                    merchantClassificationCode: 'string',
                    middleName: 'string',
                    type: 'CONSUMER',
                },
                transactionId: crypto.randomUUID(),
                transactionType: 'TRANSFER',
            });
            expect(quoteRes.payeeFspFeeAmount).toEqual('0');
        });
    });

    describe('receiveTransfer method tests', () => {
        beforeEach(() => {
            fineractClient.getAccountId = jest.fn().mockResolvedValue({
                statusCode: 200,
                data: fixtures.fineractGetAccountIdResponseDto(),
            });
            fineractClient.receiveTransfer = jest.fn().mockResolvedValue({
                statusCode: 200,
                data: fixtures.fineractReceiveTransferResponseDto(),
            });
        });

        test('test receive transfer should resolve', async () => {
            const transfer: TtransferRequest = {
                homeR2PTransactionId: 'string',
                amount: '500',
                amountType: 'SEND',
                currency: 'NGN',
                from: {
                    dateOfBirth: '5704-02-29',
                    displayName: 'string',
                    extensionList: [
                        {
                            key: 'string',
                            value: 'string',
                        },
                    ],
                    firstName: 'string',
                    fspId: 'string',
                    idSubValue: 'string',
                    idType: 'MSISDN',
                    idValue: 'string',
                    lastName: 'string',
                    merchantClassificationCode: 'string',
                    middleName: 'string',
                    type: 'CONSUMER',
                },
                ilpPacket: {
                    data: {
                        amount: {
                            amount: '500',
                            currency: 'NGN',
                        },
                        payee: {
                            partyIdInfo: {
                                partyIdType: 'IBAN',
                                partyIdentifier: IBAN,
                            },
                        },
                        payer: {
                            partyIdInfo: {
                                partyIdType: 'MSISDN',
                                partyIdentifier: '820323232',
                            },
                        },
                        quoteId: '27653e60-e21c-1414-8a35-0b5b97d5abc7',
                        transactionId: '9fe8c410-5b31-188f-858f-67cb6b308198',
                        transactionType: {
                            initiator: 'PAYER',
                            initiatorType: 'CONSUMER',
                            scenario: 'TRANSFER',
                            subScenario: 'string',
                        },
                    },
                },
                note: 'string',
                quote: {
                    expiration: '5200-02-29T21:42:06.649-09:08',
                    extensionList: [
                        {
                            key: 'string',
                            value: 'string',
                        },
                    ],
                    geoCode: {
                        latitude: '90',
                        longitude: '+6.06',
                    },
                    payeeFspCommissionAmount: '0.97',
                    payeeFspCommissionAmountCurrency: 'NGN',
                    payeeFspFeeAmount: '0',
                    payeeFspFeeAmountCurrency: 'NGN',
                    payeeReceiveAmount: '0',
                    payeeReceiveAmountCurrency: 'NGN',
                    quoteId: randomUUID(),
                    transactionId: randomUUID(),
                    transferAmount: '500',
                    transferAmountCurrency: 'NGN',
                },
                quoteRequestExtensions: [
                    {
                        key: 'string',
                        value: 'string',
                    },
                ],
                subScenario: 'string',
                to: {
                    dateOfBirth: '3956-02-29',
                    displayName: 'string',
                    extensionList: [
                        {
                            key: 'string',
                            value: 'string',
                        },
                    ],
                    firstName: 'string',
                    fspId: 'string',
                    idSubValue: 'string',
                    idType: 'IBAN',
                    idValue: IBAN,
                    lastName: 'string',
                    merchantClassificationCode: 'string',
                    middleName: 'string',
                    type: 'CONSUMER',
                },
                transactionType: 'TRANSFER',
                transferId: randomUUID(),
                transactionRequestId: randomUUID(),
            };
            const res = await ccAggregate.receiveTransfer(transfer);
            expect(res.transferState).toEqual('COMMITTED');
        });
    });

    describe('sendTransfer method tests', () => {
        beforeEach(() => {
            fineractClient.getSavingsAccount = jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: fineractGetSavingsAccountResponseDto(false, false, 10000, true),
            });
            sdkClient.initiateTransfer = jest.fn().mockResolvedValue({
                statusCode: 200,
                data: sdkInitiateTransferResponseDto('100', '100'),
            });
            fineractClient.calculateWithdrawQuote = jest.fn().mockResolvedValue({
                feeAmount: fineractCalculateWithdrawQuoteResponseDto(200),
            });
        });

        test('test sendTransfer happy path', async () => {
            const transferRequest: TFineractOutboundTransferRequest = {
                homeTransactionId: 'string',
                amount: '100',
                amountType: 'SEND',
                currency: 'AED',
                from: {
                    fineractAccountId: 2,
                    payer: {
                        dateOfBirth: '8477-05-21',
                        displayName: 'string',
                        extensionList: [
                            {
                                key: 'string',
                                value: 'string',
                            },
                        ],
                        firstName: 'string',
                        fspId: 'string',
                        idSubValue: 'string',
                        idType: 'IBAN',
                        idValue: 'string',
                        lastName: 'string',
                        merchantClassificationCode: '1234',
                        middleName: 'string',
                        type: 'CONSUMER',
                    },
                },
                to: {
                    dateOfBirth: '8477-05-21',
                    displayName: 'string',
                    extensionList: [
                        {
                            key: 'string',
                            value: 'string',
                        },
                    ],
                    firstName: 'string',
                    fspId: 'string',
                    idSubValue: 'string',
                    idType: 'MSISDN',
                    idValue: 'string',
                    lastName: 'string',
                    merchantClassificationCode: '1234',
                    middleName: 'string',
                    type: 'CONSUMER',
                },
                note: 'string',
                quoteRequestExtensions: [
                    {
                        key: 'string',
                        value: 'string',
                    },
                ],
                subScenario: 'HELLO',
                transactionType: 'TRANSFER',
            };
            const res = await ccAggregate.sendTransfer(transferRequest);
            expect(res.totalAmountFromFineract).toEqual(200);
        });

        test('test sendTransfer with blockedCredit or Debit. Should throw accountDebitOrCreditBlockedError', async () => {
            fineractClient.getSavingsAccount = jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: fineractGetSavingsAccountResponseDto(true, false, 10000, true),
            });
            const transferRequest: TFineractOutboundTransferRequest = {
                homeTransactionId: 'string',
                amount: '100',
                amountType: 'SEND',
                currency: 'AED',
                from: {
                    fineractAccountId: 2,
                    payer: {
                        dateOfBirth: '8477-05-21',
                        displayName: 'string',
                        extensionList: [
                            {
                                key: 'string',
                                value: 'string',
                            },
                        ],
                        firstName: 'string',
                        fspId: 'string',
                        idSubValue: 'string',
                        idType: 'IBAN',
                        idValue: 'string',
                        lastName: 'string',
                        merchantClassificationCode: '1234',
                        middleName: 'string',
                        type: 'CONSUMER',
                    },
                },
                to: {
                    dateOfBirth: '8477-05-21',
                    displayName: 'string',
                    extensionList: [
                        {
                            key: 'string',
                            value: 'string',
                        },
                    ],
                    firstName: 'string',
                    fspId: 'string',
                    idSubValue: 'string',
                    idType: 'MSISDN',
                    idValue: 'string',
                    lastName: 'string',
                    merchantClassificationCode: '1234',
                    middleName: 'string',
                    type: 'CONSUMER',
                },
                note: 'string',
                quoteRequestExtensions: [
                    {
                        key: 'string',
                        value: 'string',
                    },
                ],
                subScenario: 'HELLO',
                transactionType: 'TRANSFER',
            };
            try {
                await ccAggregate.sendTransfer(transferRequest);
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(FineractError);
                expect((error as FineractError).mlCode).toEqual('4400');
            }
        });

        test('test sendTransfer with undefined fees should throw SDKClientError No Quote', async () => {
            sdkClient.initiateTransfer = jest.fn().mockResolvedValue({
                statusCode: 200,
                data: sdkInitiateTransferResponseDto('100', undefined),
            });
            const transferRequest: TFineractOutboundTransferRequest = {
                homeTransactionId: 'string',
                amount: '100',
                amountType: 'SEND',
                currency: 'AED',
                from: {
                    fineractAccountId: 2,
                    payer: {
                        dateOfBirth: '8477-05-21',
                        displayName: 'string',
                        extensionList: [
                            {
                                key: 'string',
                                value: 'string',
                            },
                        ],
                        firstName: 'string',
                        fspId: 'string',
                        idSubValue: 'string',
                        idType: 'IBAN',
                        idValue: 'string',
                        lastName: 'string',
                        merchantClassificationCode: '1234',
                        middleName: 'string',
                        type: 'CONSUMER',
                    },
                },
                to: {
                    dateOfBirth: '8477-05-21',
                    displayName: 'string',
                    extensionList: [
                        {
                            key: 'string',
                            value: 'string',
                        },
                    ],
                    firstName: 'string',
                    fspId: 'string',
                    idSubValue: 'string',
                    idType: 'MSISDN',
                    idValue: 'string',
                    lastName: 'string',
                    merchantClassificationCode: '1234',
                    middleName: 'string',
                    type: 'CONSUMER',
                },
                note: 'string',
                quoteRequestExtensions: [
                    {
                        key: 'string',
                        value: 'string',
                    },
                ],
                subScenario: 'HELLO',
                transactionType: 'TRANSFER',
            };
            try {
                await ccAggregate.sendTransfer(transferRequest);
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(SDKClientError);
                expect((error as SDKClientError).mlCode).toEqual('3200');
            }
        });

        test('test sendTransfer with amount greater than available balance', async () => {
            fineractClient.calculateWithdrawQuote = jest.fn().mockResolvedValue({
                feeAmount: fineractCalculateWithdrawQuoteResponseDto(20000),
            });
            const transferRequest: TFineractOutboundTransferRequest = {
                homeTransactionId: 'string',
                amount: '100',
                amountType: 'SEND',
                currency: 'AED',
                from: {
                    fineractAccountId: 2,
                    payer: {
                        dateOfBirth: '8477-05-21',
                        displayName: 'string',
                        extensionList: [
                            {
                                key: 'string',
                                value: 'string',
                            },
                        ],
                        firstName: 'string',
                        fspId: 'string',
                        idSubValue: 'string',
                        idType: 'IBAN',
                        idValue: 'string',
                        lastName: 'string',
                        merchantClassificationCode: '1234',
                        middleName: 'string',
                        type: 'CONSUMER',
                    },
                },
                to: {
                    dateOfBirth: '8477-05-21',
                    displayName: 'string',
                    extensionList: [
                        {
                            key: 'string',
                            value: 'string',
                        },
                    ],
                    firstName: 'string',
                    fspId: 'string',
                    idSubValue: 'string',
                    idType: 'MSISDN',
                    idValue: 'string',
                    lastName: 'string',
                    merchantClassificationCode: '1234',
                    middleName: 'string',
                    type: 'CONSUMER',
                },
                note: 'string',
                quoteRequestExtensions: [
                    {
                        key: 'string',
                        value: 'string',
                    },
                ],
                subScenario: 'HELLO',
                transactionType: 'TRANSFER',
            };
            try {
                await ccAggregate.sendTransfer(transferRequest);
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(FineractError);
                expect((error as FineractError).mlCode).toEqual('4001');
            }
        });
    });
});
