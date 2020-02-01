import {
  PackagePath,
  yarn,
  log,
  readPackageJson,
  readPackageJsonSync,
  writePackageJsonSync,
} from 'ern-core'
import { ApiGenUtils } from 'ern-api-gen'
import _ from 'lodash'
import chalk from 'chalk'
import path from 'path'
import ApiImplAndroidGenerator from './android/ApiImplAndroidGenerator'
import ApiImplIosGenerator from './ios/ApiImplIosGenerator'
import ApiImplJsGenerator from './js/ApiImplJsGenerator'
import NullApiImplGenerator from './NullApiImplGenerator'
import { ApiImplGeneratable } from '../ApiImplGeneratable'

export default class ApiImplGen {
  public async generateApiImplementation(
    apiPackagePath: PackagePath,
    paths: {
      apiImplHull: string
      outDirectory: string
    },
    reactNativeVersion: string,
    platforms: string[],
    regen: boolean = false
  ) {
    log.debug(
      `Inside generateApiImplementation for api:${apiPackagePath.toString()},  platforms:${platforms.toString()}`
    )

    const schemaJson = path.join(
      paths.outDirectory,
      'node_modules',
      apiPackagePath.basePath,
      'schema.json'
    )

    const apis: any[] = await ApiGenUtils.extractApiEventsAndRequests(
      schemaJson
    )

    this.updatePackageJsonWithApiNames(paths.outDirectory, apis)

    const reactNativeElectrodeBridge: any = await readPackageJson(
      path.join(
        paths.outDirectory,
        'node_modules',
        'react-native-electrode-bridge'
      )
    )

    const generators: ApiImplGeneratable[] = this.getGenerators(platforms)
    for (const generator of generators) {
      try {
        if (generator) {
          await generator.generate(
            apiPackagePath,
            paths,
            reactNativeVersion,
            [
              apiPackagePath,
              PackagePath.fromString(`react-native@${reactNativeVersion}`),
              PackagePath.fromString(
                `react-native-electrode-bridge@${reactNativeElectrodeBridge.version}`
              ),
            ],
            apis,
            regen
          )
        }
      } catch (e) {
        throw new Error(`API implementation project generation failed: ${e}`)
      }
    }

    log.info(
      chalk.green(
        `API implementation project was successfully generated in ${paths.outDirectory}`
      )
    )
  }

  public async getDependencies(
    apiPackagePath: PackagePath
  ): Promise<PackagePath[]> {
    try {
      log.info('Looking for peerDependencies')
      const { dependencies, peerDependencies } = await yarn.info(apiPackagePath)

      const pluginsNames = []

      if (peerDependencies) {
        this.pushDependencyNames(peerDependencies, pluginsNames)
      }

      if (dependencies) {
        this.pushDependencyNames(dependencies, pluginsNames)
      }

      if (pluginsNames.length === 0) {
        log.info(`no other dependencies found for ${apiPackagePath.basePath}`)
      }

      return _.map(pluginsNames, PackagePath.fromString)
    } catch (e) {
      throw new Error(`getDependencies: ${e}`)
    }
  }

  public pushDependencyNames(
    dependencies: any,
    pluginsNames: string[]
  ): string[] {
    for (const dependency of Object.keys(dependencies)) {
      pluginsNames.push(`${dependency}@${dependencies[dependency]}`)
    }
    return pluginsNames
  }

  public getGenerators(platforms: string[]): ApiImplGeneratable[] {
    return _.map(platforms, (platform: string) => {
      switch (platform) {
        case 'android':
          return new ApiImplAndroidGenerator()
        case 'ios':
          return new ApiImplIosGenerator()
        case 'js':
          return new ApiImplJsGenerator()
        default:
          return new NullApiImplGenerator()
      }
    })
  }

  public updatePackageJsonWithApiNames(
    outputDirectoryPath: string,
    apis: any[]
  ) {
    const packageJson = readPackageJsonSync(outputDirectoryPath)
    packageJson.ern.containerGen.apiNames = _.map(apis, api => api.apiName)
    writePackageJsonSync(outputDirectoryPath, packageJson)
  }
}
