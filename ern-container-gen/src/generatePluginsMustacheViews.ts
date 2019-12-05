import { log, manifest, PackagePath } from 'ern-core'

export async function generatePluginsMustacheViews(
  plugins: PackagePath[],
  platform: 'android' | 'ios'
) {
  const pluginsViews: any[] = []
  log.debug('Generating plugins mustache views')
  for (const plugin of plugins) {
    if (plugin.name === 'react-native') {
      continue
    }
    const pluginConfig = await manifest.getPluginConfig(plugin)
    if (!pluginConfig) {
      continue
    }
    if (!pluginConfig[platform]) {
      log.warn(
        `${plugin.name} does not have any injection configuration for ${platform} platform`
      )
      continue
    }
    const pluginHook = pluginConfig[platform]!.pluginHook
    let containerHeader
    if (platform === 'ios') {
      containerHeader = pluginConfig[platform]!.containerPublicHeader
    }

    if (!pluginHook && !containerHeader) {
      continue
    }

    const pluginView: any = {}
    if (pluginHook) {
      pluginView.name = pluginHook.name
      pluginView.lcname =
        pluginHook.name &&
        pluginHook.name.charAt(0).toLowerCase() + pluginHook.name.slice(1)
      pluginView.configurable = pluginHook.configurable
    }

    if (containerHeader) {
      pluginView.containerHeader = containerHeader
    }

    pluginsViews.push(pluginView)
  }
  return pluginsViews
}
