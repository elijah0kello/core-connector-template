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

import { FineractClientFactory, TFineractConfig } from '../../src/domain/CBSClient';
import { loggerFactory } from '../../src/infra/logger';
import config from '../../src/config';
import { AxiosClientFactory } from '../../src/infra/axiosHttpClient';

const logger = loggerFactory({ context: 'Mifos Core Connector Tests' });
const fineractConfig = config.get('fineract') as TFineractConfig;

const httpClient = AxiosClientFactory.createAxiosClientInstance();
const fineractClient = FineractClientFactory.createClient({
    fineractConfig,
    httpClient,
    logger,
});

describe('fineract_client', () => {
    test('fineract client - test get account id from account No : should pass', async () => {
        const account = await fineractClient.getAccountId('000000006');
        expect(account).toBeTruthy();
    });

    test('fineract client - test get account id from non existent account No: should fail ', async () => {
        const account = fineractClient.getAccountId('sbhsf');
        await expect(account).rejects.toThrow();
    });

    test('fineract client - test perform account lookup. Should pass if account exists should pass', async () => {
        const res = await fineractClient.lookupPartyInfo('000000006');
        expect(res.data.accountNo).toContain('Head Offic000000010');
    });

    test('fineract client - test calculate quote - should pass with correct dependencies', async () => {
        const res = fineractClient.calculateWithdrawQuote({
            amount: 200,
        });

        await expect(res).resolves;
    });

    test('fineract client - test verify beneficiary - should pass with valid beneficiary account', async () => {
        const res = await fineractClient.verifyBeneficiary('000000006');

        expect(res.data.accountNo).toEqual('Head Offic000000010');
    });

    test.skip('fineract client - test recieve payment - should pass with properly configure transaction', async () => {
        const date = new Date();
        const res = await fineractClient.receiveTransfer({
            accountId: 1,
            transaction: {
                locale: 'en',
                dateFormat: 'dd MM yy',
                transactionDate: `${date.getDate()} ${date.getMonth() + 1} ${date.getFullYear()}`,
                transactionAmount: '1000',
                paymentTypeId: '1',
                accountNumber: '000000001',
                routingCode: 'ROUT124',
                receiptNumber: '5672',
                bankNumber: 'BNK273',
            },
        });
        expect(res.statusCode).toEqual(200);
    });

    test.skip('fineract client - test send transfer : should pass with properly configured transfer', async () => {
        const date = new Date();
        const res = await fineractClient.sendTransfer({
            accountId: 4,
            transaction: {
                locale: 'en',
                dateFormat: 'dd MM yy',
                transactionDate: `${date.getDate()} ${date.getMonth() + 1} ${date.getFullYear()}`,
                transactionAmount: '1000',
                paymentTypeId: '1',
                accountNumber: '000000002',
                routingCode: 'ROUT124',
                receiptNumber: '5672',
                bankNumber: 'BNK273',
            },
        });

        expect(res.statusCode).toEqual(200);
    });
});
