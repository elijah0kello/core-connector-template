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
import MockAdapter from 'axios-mock-adapter';
import {
    ISDKClient,
    SDKClientFactory,
    TSDKOutboundTransferRequest,
    TSDKTransferContinuationRequest,
} from '../../src/domain/SDKClient';
import { AxiosClientFactory } from '../../src/infra/axiosHttpClient';
import { loggerFactory } from '../../src/infra/logger';

const mockAxios = new MockAdapter(axios);
const SDK_URL = 'http://localhost:4040';
const logger = loggerFactory({ context: 'sdk client tests' });

describe('SDK Scheme Adapter Unit Tests', () => {
    let sdkClient: ISDKClient;

    beforeEach(() => {
        mockAxios.reset();
        const httpClient = AxiosClientFactory.createAxiosClientInstance();
        sdkClient = SDKClientFactory.getSDKClientInstance(logger, httpClient, SDK_URL);
    });

    test('SDK-Scheme Adapter initiate receiveTransfer - should pass when given a receiveTransfer', async () => {
        // arrange
        const transfer: TSDKOutboundTransferRequest = {
            homeTransactionId: 'string',
            amount: '0.347',
            amountType: 'SEND',
            currency: 'AED',
            from: {
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
                merchantClassificationCode: 'string',
                middleName: 'string',
                type: 'CONSUMER',
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
                merchantClassificationCode: 'string',
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
            subScenario: 'string',
            transactionType: 'TRANSFER',
        };

        // act
        mockAxios.onAny().reply(200, {});
        const res = await sdkClient.initiateTransfer(transfer);

        //assert
        expect(res.statusCode).toEqual(200);
    });

    test('SDK Scheme Adapter update receiveTransfer - should pass when given an Id and continuation object', async () => {
        // arrange
        const continueTransfer: TSDKTransferContinuationRequest = {
            acceptQuote: true,
        };

        //act
        mockAxios.onAny().reply(200, {});
        const res = await sdkClient.updateTransfer(continueTransfer, 1);

        // assert
        expect(res.statusCode).toEqual(200);
    });
    // todo add tests for all failure scenarios
});
