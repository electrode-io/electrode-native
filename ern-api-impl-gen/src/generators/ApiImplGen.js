// @flow

import {
  spin,
  Dependency,
  shell
} from 'ern-util'
import {
  yarn
} from 'ern-core'
import {
  ApiGenUtils
} from 'ern-api-gen'
import _ from 'lodash'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import ApiImplAndroidGenerator from './android/ApiImplAndroidGenerator'
import ApiImplGithubGenerator from './ios/ApiImplGithubGenerator'
import ApiImplJsGenerator from './js/ApiImplJsGenerator'
import { ApiImplGeneratable } from '../ApiImplGeneratable'

let plugins: Array<Dependency>

export default class ApiImplGen {
  async generateApiImplementation (
    apiDependency: Dependency,
    paths: {
      workingDirectory: string,
      pluginsDownloadDirectory: string,
      apiImplHull: string,
      outDirectory: string
    },
    reactNativeVersion: string,
    platforms: Array<string>,
    regen: boolean = false) {
    log.debug(`Inside generateApiImplementation for api:${apiDependency.toString()},  platforms:${platforms.toString()}`)

    await this.downloadApiAndDependencies(apiDependency, paths.pluginsDownloadDirectory, reactNativeVersion)

    const schemaJson = path.join(paths.pluginsDownloadDirectory, 'node_modules', apiDependency.scopedName, 'schema.json')
    const apis:Array<Object> = await ApiGenUtils.extractApiEventsAndRequests(schemaJson)
    this.updatePackageJsonWithApiNames(paths.outDirectory, apis)

    const generators: Array<ApiImplGeneratable> = this.getGenerators(platforms)
    for (let generator of generators) {
      try {
        if (generator) {
          await generator.generate(apiDependency, paths, reactNativeVersion, plugins, apis, regen)
        }
      } catch (e) {
        throw new Error(`API implementation project generation failed: ${e}`)
      }
    }

    log.info(chalk.green(`API implementation project was successfully generated in ${paths.outDirectory}`))
  }

  async downloadApiAndDependencies (apiDependency: Dependency, path: string, reactNativeVersion: string) {
    try {
      shell.cd(path)

      await this.spinAndDownload(apiDependency)
      plugins = await this.getDependencies(apiDependency)
      plugins.push(apiDependency)// Also add the api as a plugin so it's src files will get copied.
      if (plugins) {
        log.info('Downloading dependencies')
        for (let dependency of plugins) {
          await this.spinAndDownload(dependency)
        }
      }
      log.debug('Downloading react-native dependency')
      await this.spinAndDownload(Dependency.fromString(`react-native@${reactNativeVersion}`))
    } catch (e) {
      throw new Error(`Api dependency download failed: ${e}`)
    }
  }

  async spinAndDownload (dependency: Dependency) {
    await spin(`Downloading ${dependency.toString()}`, yarn.add(dependency.path))
  }

  async getDependencies (apiDependency: Dependency): Promise<Array<Dependency>> {
    try {
      log.info('Looking for peerDependencies')
      const apiPackageInfo = await yarn.info(apiDependency.path, {json: true})

      let pluginsNames = []

      if (apiPackageInfo.data.peerDependencies) {
        this.pushDependencyNames(apiPackageInfo.data.peerDependencies, pluginsNames)
      }

      if (apiPackageInfo.data.dependencies) {
        this.pushDependencyNames(apiPackageInfo.data.dependencies, pluginsNames)
      }

      if (pluginsNames.length === 0) {
        log.info(`no other dependencies found for ${apiDependency.name}`)
      }
      return _.map(pluginsNames, Dependency.fromString)
    } catch (e) {
      throw new Error(`getDependencies: ${e}`)
    }
  }

  pushDependencyNames (dependencies: Object, pluginsNames: Array<string>) : Array<string> {
    for (const dependency of Object.keys(dependencies)) {
      pluginsNames.push(`${dependency}@${dependencies[dependency]}`)
    }
    return pluginsNames
  }

  getGenerators (platforms: Array<string>): Array<ApiImplGeneratable> {
    return _.map(platforms, (platform: string) => {
      switch (platform) {
        case 'android' :
          return new ApiImplAndroidGenerator()
        case 'ios' :
          return new ApiImplGithubGenerator()
        case 'js' :
          return new ApiImplJsGenerator()
        default:
          return new NullApiImplGenerator()
      }
    })
  }

  updatePackageJsonWithApiNames (outputDirectoryPath: string, apis: Array<Object>) {
    const packageJsonPath = path.join(outputDirectoryPath, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    packageJson.ern.containerGen.apiNames = _.map(apis, api => api.apiName)
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  }
}

class NullApiImplGenerator implements ApiImplGeneratable {
  get name () : string {
    return 'NullApiImplGenerator'
  }

  async generate (
    apiDependency: Dependency,
    paths: Object,
    reactNativeVersion: string,
    plugins: Array<Dependency>,
    apis: Array<Object>,
    regen: boolean) {
    log.debug('NullApiImplGenerator generate - noop')
  }
}
