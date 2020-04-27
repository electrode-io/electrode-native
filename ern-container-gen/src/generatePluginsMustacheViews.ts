import { log, manifest, PackagePath, PluginConfig } from 'ern-core';

export async function generatePluginsMustacheViews(
  plugins: PackagePath[],
  platform: 'android' | 'ios',
) {
  const pluginsViews: any[] = [];
  log.debug('Generating plugins mustache views');
  for (const plugin of plugins) {
    if (plugin.name === 'react-native') {
      continue;
    }

    let pluginConfig: PluginConfig<'android' | 'ios'> | undefined;
    if (platform === 'android') {
      pluginConfig = await manifest.getPluginConfig(plugin, 'android');
    } else {
      pluginConfig = await manifest.getPluginConfig(plugin, 'ios');
    }
    if (!pluginConfig) {
      log.warn(
        `${plugin.name} does not have any injection configuration for ${platform} platform`,
      );
      continue;
    }

    const pluginHook = pluginConfig.pluginHook;
    let containerHeader;
    if (platform === 'ios') {
      containerHeader = (pluginConfig as PluginConfig<'ios'>)
        .containerPublicHeader;
    }

    if (!pluginHook && !containerHeader) {
      continue;
    }

    const pluginView: any = {};
    if (pluginHook) {
      pluginView.name = pluginHook.name;
      pluginView.lcname =
        pluginHook.name &&
        pluginHook.name.charAt(0).toLowerCase() + pluginHook.name.slice(1);
      pluginView.configurable = pluginHook.configurable;
    }

    if (containerHeader) {
      pluginView.containerHeader = containerHeader;
    }

    pluginsViews.push(pluginView);
  }
  return pluginsViews;
}
