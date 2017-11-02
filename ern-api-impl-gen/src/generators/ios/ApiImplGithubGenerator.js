
import {
  IosUtil
} from 'ern-core'

import {
  Dependency,
  shell
} from 'ern-util'

import ApiImplGeneratable from '../../ApiImplGeneratable'
import fs from 'fs'
import path from 'path'
import xcode from 'xcode-ern'

export const ROOT_DIR = shell.pwd()

export default class ApiImplGithubGenerator implements ApiImplGeneratable {
  get name () : string {
    return 'ApiImplGithubGenerator'
  }

  get platform (): string {
    return 'ios'
  }

  async generate (apiDependency: Dependency,
                  paths : Object,
                  reactNativeVersion: string,
                  plugins : Array<Dependency>,
                  apis: Array<Object>,
                  regen: boolean) {
    log.debug(`Starting project generation for ${this.platform}`)
    await this.fillHull(paths, reactNativeVersion, plugins)
  }

  async fillHull (paths: Object,
                  reactNativeVersion: string,
                  plugins: Array<Dependency>) {
    try {
      const pathSpec = {
        rootDir: ROOT_DIR,
        projectHullDir: path.join(paths.apiImplHull, 'ios', '*'),
        outputDir: path.join(paths.outDirectory, 'ios'),
        pluginsDownloadDirectory: paths.pluginsDownloadDirectory
      }

      const projectSpec = {
        projectName: 'ElectrodeApiImpl'
      }

      this.injectReactNativeToPlugins(reactNativeVersion, plugins)

      const {iosProject, projectPath} = await IosUtil.fillProjectHull(pathSpec, projectSpec, plugins)

      fs.writeFileSync(projectPath, iosProject.writeSync())

      log.debug('[=== Completed api-impl hull filling ===]')
    } catch (e) {
      log.error('Error while generating api impl hull for ios')
      throw e
    }
  }

  injectReactNativeToPlugins (reactNativeVersion, plugins) {
    const reactNativePlugin = new Dependency('react-native', {
      version: reactNativeVersion
    })

    log.debug(`Manually injecting react-native(${reactNativePlugin}) plugin to dependencies.`)
    plugins.push(reactNativePlugin)
  }

  // Code to keep backward compatibility
  switchToOldDirectoryStructure (pluginSourcePath: string, tail: string): boolean {
    // This is to check if the api referenced during container generation is created using the old or new directory structure to help keep the backward compatibility.
    const pathToSwaggersAPIs = path.join('IOS', 'IOS', 'Classes', 'SwaggersAPIs')
    if (path.dirname(tail) === `IOS` && fs.existsSync(path.join(pluginSourcePath, path.dirname(pathToSwaggersAPIs)))) {
      return true
    }
    return false
  }

  async getIosApiImplProject (apiImplProjectPath: string) : Promise<*> {
    log.debug(apiImplProjectPath)

    const containerProject = xcode.project(apiImplProjectPath)

    return new Promise((resolve, reject) => {
      containerProject.parse(function (err) {
        if (err) {
          reject(err)
        }
        resolve(containerProject)
      })
    })
  }
}
