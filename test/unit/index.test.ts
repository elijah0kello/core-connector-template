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
import { randomUUID } from 'crypto';
import { AxiosClientFactory } from '../../src/infra/axiosHttpClient';
import config from '../../src/config';
import { FineractClientFactory } from '../../src/domain/CBSClient';
import { TFineractConfig } from '../../src/domain/CBSClient';
import { loggerFactory } from '../../src/infra/logger';
import { CoreConnectorAggregate, TQuoteRequest, TtransferRequest } from '../../src/domain';
import { SDKClientFactory } from '../../src/domain/SDKClient';

const logger = loggerFactory({ context: 'Mifos Core Connector Tests' });
const fineractConfig = config.get('fineract') as TFineractConfig;

const httpClient = AxiosClientFactory.createAxiosClientInstance();
const fineractClient = FineractClientFactory.createClient({
    fineractConfig,
    httpClient,
    logger,
});

const sdkClient = SDKClientFactory.getSDKClientInstance(logger, httpClient, 'http://localhost:4040');
const coreConnectorAggregate = new CoreConnectorAggregate(fineractConfig, fineractClient, sdkClient, logger);

const IBAN = 'UG680720000289000000006';

jest.setTimeout(20_000);

describe('Core Connector Aggregate Unit Tests', () => {
    test('Aggregate Get Parties. Should return status code 200 for an existent account', async () => {
        const res = await coreConnectorAggregate.getParties(IBAN);
        expect(res?.statusCode).toEqual(200);
    });
    test('Aggregate Get Parties with short IBAN. Should throw error because IBAN is too short', async () => {
        const res = coreConnectorAggregate.getParties('UG680720000289');
        await expect(res).rejects.toThrow();
    });
    test('Aggregate Qoute Request for withdraw. Should pass if account is active ', async () => {
        const quoteRequest: TQuoteRequest = {
            homeR2PTransactionId: 'string',
            amount: '5.6',
            amountType: 'SEND',
            currency: 'AED',
            expiration: '6000-02-29T20:02:59.152Z',
            extensionList: [
                {
                    key: 'string',
                    value: 'string',
                },
            ],
            feesAmount: '0.02',
            feesCurrency: 'AED',
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
            geoCode: {
                latitude: '52',
                longitude: '+180',
            },
            initiator: 'PAYER',
            initiatorType: 'CONSUMER',
            note: 'string',
            quoteId: 'adbdb5be-d359-300a-bbcf-60d25a2ef3f9',
            subScenario: 'string',
            to: {
                dateOfBirth: '2800-02-29',
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
                idType: fineractConfig.FINERACT_ID_TYPE,
                idValue: IBAN,
                lastName: 'string',
                merchantClassificationCode: 'string',
                middleName: 'string',
                type: 'CONSUMER',
            },
            transactionId: randomUUID(),
            transactionType: 'TRANSFER',
            transactionRequestId: randomUUID(),
        };
        const res = await coreConnectorAggregate.quoteRequest(quoteRequest);
        expect(res).toBeTruthy();
    });

    test('Aggregate Transfer Request. Should return truthy response if account is active', async () => {
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
        const res = await coreConnectorAggregate.receiveTransfer(transfer);
        expect(res).toBeTruthy();
    });
});
