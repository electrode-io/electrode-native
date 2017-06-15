import MavenGenerator from '../../../../ern-container-gen/src/generators/android/MavenGenerator'
import shell from 'shelljs'
import {
  Dependency, Utils
} from '@walmart/ern-util'

import {
  getPluginConfig
} from '../../../../ern-container-gen/src/utils.js'

import ApiImplGeneratable from '../../ApiImplGeneratable'

export const ROOT_DIR = shell.pwd()

export default class ApiImplMavenGenerator extends MavenGenerator implements ApiImplGeneratable {
  get name (): string {
    return 'ApiImplMavenGenerator'
  }

  async generate (api: string,
                  paths: Object,
                  plugins: Array<Dependency>) {
    log.debug(`Starting project generation for ${this.platform}`)

    this.fillHull(api, paths, plugins)
  }

  async fillHull (api: string,
                  paths: Object,
                  plugins: Array<Dependency>) {
    try {
      log.debug(`[=== Starting hull filling for api impl gen for ${this.platform} ===]`)

      shell.cd(`${ROOT_DIR}`)
      Utils.throwIfShellCommandFailed()

      const outputFolder = `${paths.outFolder}/android/`
      log.debug(`Creating out folder(${log.debug(outputFolder)}) for android and copying container hull to it.`)
      shell.mkdir(outputFolder)
      Utils.throwIfShellCommandFailed()

      shell.cp(`-R`, `${paths.apiImplHull}/android/*`, outputFolder)
      Utils.throwIfShellCommandFailed()

      for (let plugin: Dependency of plugins) {
        log.debug(plugin)
        let pluginConfig = await getPluginConfig(plugin, paths.pluginsConfigPath)
        log.debug(pluginConfig)
      }
    } catch (e) {
      Utils.logErrorAndExitProcess(`Error while generating api impl hull for android: ${e}`)
    }
  }
}
