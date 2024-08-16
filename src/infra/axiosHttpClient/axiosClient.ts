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

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { IHTTPClient, ILogger, THttpClientDeps, THttpRequestOptions, THttpResponse, TJson } from '../../domain';

export class AxiosHTTPClient implements IHTTPClient {
    private readonly axios: AxiosInstance;
    private readonly logger: ILogger;

    constructor(deps: THttpClientDeps) {
        this.axios = axios.create(deps.options); // todo: move to deps
        this.logger = deps.logger.child({ context: this.constructor.name });
    }

    async get<R = unknown>(url: string, options?: THttpRequestOptions): Promise<THttpResponse<R>> {
        const res = await this.axios.get<R>(url, options);
        return this.responseDto(res);
    }

    async post<D extends TJson, R = unknown>(
        url: string,
        data: D,
        options?: THttpRequestOptions,
    ): Promise<THttpResponse<R>> {
        const res = await this.axios.post<R>(url, data, options);
        return this.responseDto(res);
    }

    async put<D extends TJson, R = unknown>(
        url: string,
        data: D,
        options?: THttpRequestOptions,
    ): Promise<THttpResponse<R>> {
        const res = await this.axios.put<R>(url, data, options);
        return this.responseDto(res);
    }

    async send<R = unknown>(options: AxiosRequestConfig): Promise<THttpResponse<R>> {
        const res = await this.axios.request<R>(options);
        return this.responseDto(res);
    }

    private responseDto(rawResponse: AxiosResponse) {
        const { data, status } = rawResponse;
        const json = Object.freeze({
            data,
            statusCode: status,
        });
        this.logger.info('Received response:', json);
        return json;
    }
}
