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

import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import OpenAPIBackend, { Context } from 'openapi-backend';
import { CoreConnectorAggregate } from 'src/domain/coreConnectorAgg';
import { ILogger, TQuoteRequest, TtransferRequest } from '../domain';
import { BaseRoutes } from './BaseRoutes';

const API_SPEC_FILE = './src/api-spec/core-connector-api-spec.-sdk.yml';

export class CoreConnectorRoutes extends BaseRoutes {
    private readonly aggregate: CoreConnectorAggregate;
    private readonly routes: ServerRoute[] = [];
    private readonly logger: ILogger;

    constructor(aggregate: CoreConnectorAggregate, logger: ILogger) {
        super();
        this.aggregate = aggregate;
        this.logger = logger.child({ context: 'MCC Routes' });
    }

    async init() {
        // initialise openapi backend with validation
        const api = new OpenAPIBackend({
            definition: API_SPEC_FILE,
            handlers: {
                getParties: this.getParties.bind(this),
                quoteRequests: this.quoteRequests.bind(this),
                transfers: this.transfers.bind(this),
                validationFail: async (context, req, h) => h.response({ error: context.validation.errors }).code(412),
                notFound: async (context, req, h) => h.response({ error: 'Not found' }).code(404),
            },
        });

        await api.init();

        this.routes.push({
            method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            path: '/{path*}',
            handler: (req: Request, h: ResponseToolkit) =>
                api.handleRequest(
                    {
                        method: req.method,
                        path: req.path,
                        body: req.payload,
                        query: req.query,
                        headers: req.headers,
                    },
                    req,
                    h,
                ),
        });

        this.routes.push({
            method: ['GET'],
            path: '/health',
            handler: async (req: Request, h: ResponseToolkit) => {
                const success = true; // todo: think about better healthCheck logic
                return h.response({ success }).code(success ? 200 : 503);
            },
        });
    }

    getRoutes(): ServerRoute[] {
        return this.routes;
    }

    private async getParties(context: Context, request: Request, h: ResponseToolkit) {
        try {
            const { params } = context.request;
            const IBAN = params['ID'] as string;
            const result = await this.aggregate.getParties(IBAN);
            return this.handleResponse(result.data, h);
        } catch (error) {
            return this.handleError(error, h);
        }
    }

    private async quoteRequests(context: Context, request: Request, h: ResponseToolkit) {
        try {
            const quoteRequest = request.payload as TQuoteRequest;
            const quote = await this.aggregate.quoteRequest(quoteRequest);
            return this.handleResponse(quote, h);
        } catch (error: unknown) {
            return this.handleError(error, h);
        }
    }

    private async transfers(context: Context, request: Request, h: ResponseToolkit) {
        const transfer = request.payload as TtransferRequest;
        try {
            const result = await this.aggregate.receiveTransfer(transfer);
            return this.handleResponse(result, h, 201);
        } catch (error: unknown) {
            return this.handleError(error, h);
        }
    }
}
