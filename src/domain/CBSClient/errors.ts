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

import { BasicError } from '../interfaces';

export class FineractError extends BasicError {
    static withdrawFailedError(message: string) {
        return new FineractError(message, {
            httpCode: 500,
            mlCode: '4000',
        });
    }

    static searchAccountError(message: string) {
        return new FineractError(message, {
            httpCode: 500,
            mlCode: '3200',
        });
    }

    static noAccountFoundError() {
        return new FineractError('Fineract Account Not Found', {
            httpCode: 404,
            mlCode: '3200',
        });
    }

    static accountNotActiveError() {
        return new FineractError('Fineract Account not active', {
            httpCode: 500,
            mlCode: '4000',
        });
    }

    static getClientWithIdError() {
        return new FineractError('Failed to get client by clientId ', {
            httpCode: 500,
            mlCode: '4000',
        });
    }

    static depositFailedError() {
        return new FineractError('Fineract Deposit Failed', {
            httpCode: 500,
            mlCode: '4000',
        });
    }

    static getChargesError() {
        return new FineractError('Fineract Get charges error', {
            httpCode: 500,
            mlCode: '4000',
        });
    }

    static accountInsufficientBalanceError() {
        return new FineractError('Fineract Account Insufficient Balance', {
            httpCode: 500,
            mlCode: '4001',
        });
    }

    static accountDebitOrCreditBlockedError(message: string) {
        return new FineractError(message, {
            httpCode: 500,
            mlCode: '4400', // todo: or 5400
        });
    }
}
