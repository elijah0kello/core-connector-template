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

import axios from 'axios';
import { randomUUID } from 'crypto';
import { Service } from '../../src/core-connector-svc';
import config from '../../src/config';
import { loggerFactory } from '../../src/infra/logger';
import { TQuoteRequest, TtransferRequest } from '../../src/domain';
import { TFineractOutboundTransferRequest, TFineractTransferContinuationRequest } from '../../src/domain/SDKClient';

const logger = loggerFactory({ context: 'Core Connector Tests' });
const IBAN = 'SK680720000289000000002';
const IdType = 'IBAN';

const baseurl = `http://${config.get('server').SDK_SERVER_HOST}:${config.get('server').SDK_SERVER_PORT}`;
const dfsp_baseurl = `http://${config.get('server').DFSP_SERVER_HOST}:${config.get('server').DFSP_SERVER_PORT}`;

describe('Mifos Core Connector Functional Tests', () => {
    beforeAll(async () => {
        await Service.start();
    });

    afterAll(async () => {
        await Service.stop();
    });

    test('GET /parties/IBAN/{ID}: sdk-server - Should return party info if it exists in fineract', async () => {
        const url = `${baseurl}/parties/IBAN/${IBAN}`;
        const res = await axios.get(url);
        logger.info(res.data);

        expect(res.data['idValue']).toEqual('000000002');
    });

    test('POST /quoterequests: sdk-server - Should return quote if party info exists', async () => {
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
                idType: IdType,
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
        const url = `${baseurl}/quoterequests`;
        const res = await axios.post(url, JSON.stringify(quoteRequest), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        expect(res.status).toEqual(200);
    });

    test('POST /transfers: sdk-server - Should return receiveTransfer if party in fineract', async () => {
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
        const url = `${baseurl}/transfers`;
        const res = await axios.post(url, JSON.stringify(transfer), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        expect(res.status).toEqual(201);
    });

    test('GET /health Should return 200', async () => {
        const url = `${dfsp_baseurl}/health`;
        const res = await axios.get(url);
        logger.info(res.data);

        expect(res.status).toEqual(200);
    });

    test('POST /transfers: dfsp server - Should return 200', async () => {
        const url = `${dfsp_baseurl}/transfers`;
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

        const res = await axios.post(url, JSON.stringify(transferRequest), {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        expect(res.status).toEqual(200);
    });

    test('POST /transfers/{transferId}: dfsp server - Should return 200 with structurally compliant body', async () => {
        const url = `${dfsp_baseurl}/transfers/38b7313b-2be4-418d-8164-b32c989f0ee1`;
        const transferContinuationBody: TFineractTransferContinuationRequest = {
            fineractTransaction: {
                fineractAccountId: 2,
                totalAmount: 50.0,
                routingCode: 'routing123',
                receiptNumber: '1',
                bankNumber: 'BNK123',
            },
            transferContinuationAccept: {
                acceptQuote: true,
            },
        };

        const res = await axios.put(url, JSON.stringify(transferContinuationBody), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        expect(res.status).toEqual(200);
    });
});
