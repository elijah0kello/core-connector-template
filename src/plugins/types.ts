import { LoggingPluginOptions } from './loggingPlugin';

export type ReqAppState = {
    context: {
        id: string;
        remoteAddress: string;
        path: string;
        method: string;
        received: number;
    };
};

export type PluginsOptions = LoggingPluginOptions; // & AnotherOptions
