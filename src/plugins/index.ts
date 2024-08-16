import { ServerRegisterPluginObject } from '@hapi/hapi';
import { PluginsOptions } from './types';
import { loggingPlugin } from './loggingPlugin';

export const createPlugins = (options: PluginsOptions): ServerRegisterPluginObject<PluginsOptions>[] => [
    {
        plugin: loggingPlugin,
        options,
    },
    // pass any other plugins here, if needed
];
