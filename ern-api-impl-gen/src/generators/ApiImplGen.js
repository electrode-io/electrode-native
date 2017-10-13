// @flow

import {
  spin,
  Dependency,
  DependencyPath,
  shell
} from 'ern-util'
import {
  yarn
} from 'ern-core'
import _ from 'lodash'
import chalk from 'chalk'
import ApiImplMavenGenerator from './android/ApiImplMavenGenerator'
import ApiImplGithubGenerator from './ios/ApiImplGithubGenerator'
import { ApiImplGeneratable } from '../ApiImplGeneratable'

let plugins: Array<Dependency>

export default class ApiImplGen {
  async generateApiImplementation (
    apiDependencyPath: DependencyPath,
    paths: {
      workingDirectory: string,
      pluginsDownloadDirectory: string,
      apiImplHull: string,
      outDirectory: string
    },
    reactNativeVersion: string,
    platforms: Array<string>) {
    log.debug(`Inside generateApiImplementation for api:${apiDependencyPath.toString()},  platforms:${platforms.toString()}`)

    await this.downloadApiAndDependencies(apiDependencyPath, paths.pluginsDownloadDirectory, reactNativeVersion)

    const generators: Array<ApiImplGeneratable> = this.getGenerators(platforms)
    for (let generator of generators) {
      try {
        if (generator) {
          await generator.generate(paths, reactNativeVersion, plugins)
        }
      } catch (e) {
        throw new Error(`API implementation project generation failed: ${e}`)
      }
    }

    log.info(chalk.green(`API implementation project was successfully generated in ${paths.outDirectory}`))
  }

  async downloadApiAndDependencies (apiDependencyPath: DependencyPath, path: string, reactNativeVersion: string) {
    try {
      shell.cd(path)

      await this.spinAndDownload(apiDependencyPath)
      plugins = await this.getDependencies(apiDependencyPath)
      plugins.push(Dependency.fromPath(apiDependencyPath))// Also add the api as a plugin so it's src files will get copied.
      if (plugins) {
        log.info('Downloading dependencies')
        for (let dependency of plugins) {
          await this.spinAndDownload(DependencyPath.fromString(dependency.toString()))
        }
      }
      log.debug('Downloading react-native dependency')
      await this.spinAndDownload(DependencyPath.fromString(`react-native@${reactNativeVersion}`))
    } catch (e) {
      throw new Error(`Api dependency download failed: ${e}`)
    }
  }

  async spinAndDownload (dependencyPath: DependencyPath) {
    await spin(`Downloading ${dependencyPath.toString()}`, yarn.add(dependencyPath))
  }

  async getDependencies (apiDependencyPath: DependencyPath) : Promise<Array<Dependency>> {
    try {
      log.info(`Looking for peerDependencies`)
      const apiPackageInfo = await yarn.info(apiDependencyPath, {json: true})

      let dependencies = []
      if (apiPackageInfo.data.peerDependencies) {
        let pluginsNames = []
        for (let dependency in apiPackageInfo.data.peerDependencies) {
          pluginsNames.push(`${dependency}@${apiPackageInfo.data.peerDependencies[dependency]}`)
        }
        dependencies = _.map(pluginsNames, Dependency.fromString)
      } else {
        log.warn('no peer dependencies found.')
      }
      return dependencies
    } catch (e) {
      throw new Error(`getDependencies: ${e}`)
    }
  }

  getGenerators (platforms: Array<string>): Array<ApiImplGeneratable> {
    return _.map(platforms, (platform: string) => {
      switch (platform) {
        case 'android' :
          return new ApiImplMavenGenerator()
        case 'ios' :
          return new ApiImplGithubGenerator()
        default:
          return new NullApiImplGenerator()
      }
    })
  }
}

class NullApiImplGenerator implements ApiImplGeneratable {
  get name () : string {
    return 'NullApiImplGenerator'
  }

  async generate (
    paths: Object,
    reactNativeVersion: string,
    plugins: Array<Dependency>) {
    log.debug('NullApiImplGenerator generate - noop')
  }
}
