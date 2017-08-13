// @flow

import {
  spin,
  Dependency,
  DependencyPath,
  Utils,
  coloredLog
} from 'ern-util'
import {
  yarn
} from 'ern-core'
import shell from 'shelljs'
import _ from 'lodash'
import chalk from 'chalk'
import ApiImplMavenGenerator from './android/ApiImplMavenGenerator'
import ApiImplGithubGenerator from './ios/ApiImplGithubGenerator'
import { ApiImplGeneratable } from '../ApiImplGeneratable'

const log = coloredLog
let plugins: Array<Dependency>

export default class ApiImplGen {
  async generateApiImplementation (
    apiDependencyPath: DependencyPath,
    paths: {
      workingFolder: string,
      pluginsDownloadFolder: string,
      apiImplHull: string,
      reactNativeAarsPath: string,
      outFolder: string
    },
    reactNativeVersion: string,
    platforms: Array<string>) {
    log.debug(`Inside generateApiImplementation for api:${apiDependencyPath.toString()},  platforms:${platforms.toString()}`)

    await this.downloadApiAndDependencies(apiDependencyPath, paths.pluginsDownloadFolder)

    const generators: Array<ApiImplGeneratable> = this.getGenerators(platforms)
    for (let generator of generators) {
      try {
        if (generator) {
          await generator.generate(paths, reactNativeVersion, plugins)
        }
      } catch (e) {
        Utils.logErrorAndExitProcess(`Error executing generators, error: ${e}, generator: ${generator.name.toString()}`)
      }
    }

    log.info(chalk.green(`API implementation project was successfully generated in ${paths.outFolder}`))
  }

  async downloadApiAndDependencies (apiDependencyPath: DependencyPath, path: string) {
    try {
      shell.cd(path)
      Utils.throwIfShellCommandFailed()
      await this.spinAndDownload(apiDependencyPath)
      plugins = await this.getDependencies(apiDependencyPath)
      plugins.push(Dependency.fromPath(apiDependencyPath))// Also add the api as a plugin so it's src files will get copied.
      if (plugins) {
        log.info('Downloading dependencies')
        for (let dependency of plugins) {
          await this.spinAndDownload(DependencyPath.fromString(dependency.toString()))
        }
      }
    } catch (e) {
      Utils.logErrorAndExitProcess(`Error while retrieving API: ${e}`)
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
      Utils.logErrorAndExitProcess(`Error while retrieving dependencies: ${e}`)
      throw e
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
