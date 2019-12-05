import {
  createTmpDir,
  findNativeDependencies,
  yarn,
  shell,
  PackagePath,
} from 'ern-core'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib'
import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'
import { Argv } from 'yargs'

export const command = 'dependencies [module]'
export const desc = 'List the native dependencies of an Electrode Native module'

export const builder = (argv: Argv) => {
  return argv
    .option('json', {
      describe: 'Output dependencies as a single line JSON record',
      type: 'boolean',
    })
    .option('manifestId', {
      describe: 'Id of the Manifest entry to use',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  module,
  manifestId,
  json,
}: {
  module?: string
  manifestId?: string
  json?: boolean
}) => {
  if (manifestId) {
    await logErrorAndExitIfNotSatisfied({
      manifestIdExists: {
        id: manifestId,
      },
    })
  }

  let pathToModule = process.cwd()
  if (module) {
    pathToModule = createTmpDir()
    shell.pushd(pathToModule)
    try {
      await yarn.init()
      await yarn.add(PackagePath.fromString(module))
    } finally {
      shell.popd()
    }
  }
  const dependencies = await findNativeDependencies(
    path.join(pathToModule, 'node_modules'),
    { manifestId }
  )

  if (json) {
    process.stdout.write(JSON.stringify(dependencies))
  } else {
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
  }
}

function logDependencies(dependencies: PackagePath[], type: string) {
  if (!_.isEmpty(dependencies)) {
    console.log(chalk.blue.bold(`=== ${type} ===`))
    for (const d of dependencies) {
      console.log(`${d.name}@${d.version}`)
    }
  }
}

export const handler = tryCatchWrap(commandHandler)
