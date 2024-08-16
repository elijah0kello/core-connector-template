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

import { CoreConnectorAggregate, ILogger } from '../domain';
import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import OpenAPIBackend, { Context } from 'openapi-backend';
import { TFineractOutboundTransferRequest, TFineractTransferContinuationRequest } from '../domain/SDKClient';
import { BaseRoutes } from './BaseRoutes';

const API_SPEC_FILE = './src/api-spec/core-connector-api-spec-dfsp.yml';

export class DFSPCoreConnectorRoutes extends BaseRoutes {
    private readonly aggregate: CoreConnectorAggregate;
    private readonly routes: ServerRoute[] = [];
    private readonly logger: ILogger;

    constructor(aggregate: CoreConnectorAggregate, logger: ILogger) {
        super();
        this.aggregate = aggregate;
        this.logger = logger.child({ context: 'MCC Routes' });
    }

    async init() {
        const api = new OpenAPIBackend({
            definition: API_SPEC_FILE,
            handlers: {
                transfers: this.initiateTransfer.bind(this),
                updateTransfer: this.updateInitiatedTransfer.bind(this),
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

    private async initiateTransfer(context: Context, request: Request, h: ResponseToolkit) {
        const transfer = request.payload as TFineractOutboundTransferRequest;
        try {
            const result = await this.aggregate.sendTransfer(transfer);
            return this.handleResponse(result, h);
        } catch (error: unknown) {
            return this.handleError(error, h);
        }
    }

    private async updateInitiatedTransfer(context: Context, request: Request, h: ResponseToolkit) {
        const { params } = context.request;
        const transferAccept = request.payload as TFineractTransferContinuationRequest;
        try {
            const updateTransferRes = await this.aggregate.updateSentTransfer({
                fineractTransaction: transferAccept.fineractTransaction,
                sdkTransferId: params.transferId as string,
            });
            return this.handleResponse(updateTransferRes, h);
        } catch (error: unknown) {
            return this.handleError(error, h);
        }
    }
}
