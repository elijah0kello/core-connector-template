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

import { ResponseToolkit } from '@hapi/hapi';
import { ResponseValue } from 'hapi';
import { BasicError, TJson } from '../domain';

type ErrorResponseDetails = {
    message: string;
    status: string; // mlCode
    httpCode: number;
    details?: TJson;
};
const getErrorDetails = (error: unknown): ErrorResponseDetails => {
    if (error instanceof BasicError) {
        const { message, mlCode = '2000', httpCode = 500, details } = error;
        return {
            message,
            status: mlCode,
            httpCode,
            details,
        };
    }

    return {
        message: error instanceof Error ? error.message : 'Unknown Error',
        status: '2000',
        httpCode: 500,
    };
};

export class BaseRoutes {
    protected handleResponse(data: unknown, h: ResponseToolkit, statusCode: number = 200) {
        return h.response(data as ResponseValue).code(statusCode);
    }

    protected handleError(error: unknown, h: ResponseToolkit) {
        const { message, status, httpCode, details } = getErrorDetails(error);
        return h.response({ status, message, details }).code(httpCode);
    }
}
