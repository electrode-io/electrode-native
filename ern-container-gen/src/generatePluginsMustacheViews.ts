import { log, manifest, PackagePath } from 'ern-core'

export async function generatePluginsMustacheViews(
  plugins: PackagePath[],
  platform: string
) {
  const pluginsViews: any[] = []
  log.debug('Generating plugins mustache views')
  for (const plugin of plugins) {
    if (plugin.basePath === 'react-native') {
      continue
    }
    const pluginConfig = await manifest.getPluginConfig(plugin)
    if (!pluginConfig[platform]) {
      log.warn(
        `${
          plugin.basePath
        } does not have any injection configuration for ${platform} platform`
      )
      continue
    }
    const pluginHook = pluginConfig[platform].pluginHook
    const containerHeader = pluginConfig[platform].containerPublicHeader

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

    pluginView.customRepos = []
    if (pluginConfig.android && pluginConfig.android.repositories) {
      pluginView.customRepos.push(...pluginConfig.android.repositories)
    }

    pluginView.customPermissions = []
    if (pluginConfig.android && pluginConfig.android.permissions) {
      pluginView.customPermissions.push(...pluginConfig.android.permissions)
    }

    if (containerHeader) {
      pluginView.containerHeader = containerHeader
    }

    pluginsViews.push(pluginView)
  }
  return pluginsViews
}
