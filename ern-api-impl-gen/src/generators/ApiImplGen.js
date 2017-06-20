// @flow

import {
  yarn,
  spin,
  Dependency,
  Utils,
  coloredLog
} from '@walmart/ern-util'
import shell from 'shelljs'
import _ from 'lodash'
import chalk from 'chalk'
import ApiImplMavenGenerator from './android/ApiImplMavenGenerator'
import ApiImplGithubGenerator from './ios/ApiImplGithubGenerator'
import { ApiImplGeneratable } from '../ApiImplGeneratable'

const log = coloredLog
const {yarnAdd, yarnInfo} = yarn
let plugins: Array<Dependency>

export default class ApiImplGen {
  async generateApiImplementation (
    api: string, // npm package || git location || file path file:/Users/x/y/z
    paths: {
      workingFolder: string,
      pluginsDownloadFolder: string,
      pluginsConfigPath: string,
      apiImplHull: string,
      reactNativeAarsPath: string,
      outFolder: string
    },
    reactNativeVersion: string,
    platforms: Array<string>) {
    log.debug(`inside generateApiImplementation for api:${api},  platforms:${platforms.toString()}`)

    await this.downloadApiAndDependencies(api, paths.pluginsDownloadFolder)

    const generators: Array<ApiImplGeneratable> = this.getGenerators(platforms)
    for (let generator of generators) {
      try {
        if (generator) {
          await generator.generate(api, paths, reactNativeVersion, plugins)
        }
      } catch (e) {
        Utils.logErrorAndExitProcess(`Error executing generators, error: ${e}, generator: ${generator.name.toString()}`)
      }
    }

    log.info(chalk.green(`Successfully generated, location: ${paths.outFolder}`))
    log.info(chalk.green(`Done!.`))
  }

  async downloadApiAndDependencies (api: string, path: string) {
    try {
      shell.cd(path)
      Utils.throwIfShellCommandFailed()
      await this.spinAndDownload(api)
      plugins = await this.getDependencies(api)
      plugins.push(Dependency.fromString(api))// Also add the api as a plugin so it's src files will get copied.
      if (plugins) {
        log.info('Downloading dependencies')
        for (let dependency of plugins) {
          await this.spinAndDownload(dependency)
        }
      }
    } catch (e) {
      Utils.logErrorAndExitProcess(`Error while downloading API: ${e}`)
    }
  }

  async spinAndDownload (dependency: string | Dependency) {
    await spin(`Downloading ${dependency.toString()}`, yarnAdd(dependency))
  }

  async getDependencies (api: string) : Promise<Array<Dependency>> {
    try {
      log.info(`Looking for peerDependencies`)
      const apiPackageInfo = await yarnInfo(api, {json: true})

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
      Utils.logErrorAndExitProcess(`Error while downloading dependencies: ${e}`)
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
    api: string,
    paths: Object,
    reactNativeVersion: string,
    plugins: Array<Dependency>) {
    log.debug('NullApiImplGenerator generate - noop')
  }
}
