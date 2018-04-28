import {
  createTmpDir,
  findNativeDependencies,
  yarn,
  shell,
  PackagePath,
} from 'ern-core'
import utils from '../../lib/utils'
import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'
import { Argv } from 'yargs'

export const command = 'dependencies [module]'
export const desc = 'List the native dependencies of an Electrode Native module'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async ({ module }: { module?: string }) => {
  try {
    let pathToModule = process.cwd()
    if (module) {
      pathToModule = createTmpDir()
      shell.cd(pathToModule)
      await yarn.add(PackagePath.fromString(module))
    }
    const dependencies = await findNativeDependencies(
      path.join(pathToModule, 'node_modules')
    )

    console.log(chalk.bold.yellow('Native dependencies :'))
    logDependencies(dependencies.apis, 'APIs')
    logDependencies(dependencies.nativeApisImpl, 'Native API Implementations')
    logDependencies(
      dependencies.thirdPartyInManifest,
      'Third party declared in Manifest'
    )
    logDependencies(
      dependencies.thirdPartyNotInManifest,
      'Third party not declared in Manifest'
    )
  } catch (e) {
    throw e
  }
}

function logDependencies(dependencies: PackagePath[], type: string) {
  if (!_.isEmpty(dependencies)) {
    console.log(chalk.blue.bold(`=== ${type} ===`))
    for (const d of dependencies) {
      console.log(d.toString())
    }
  }
}
