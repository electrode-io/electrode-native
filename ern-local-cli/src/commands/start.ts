import {
  epilog,
  askUserToChooseANapDescriptorFromCauldron,
  tryCatchWrap,
} from '../lib'
import { start } from 'ern-orchestrator'
import _ from 'lodash'
import { PackagePath, NativeApplicationDescriptor } from 'ern-core'
import { Argv } from 'yargs'

export const command = 'start'
export const desc = 'Start a composite MiniApp'

export const builder = (argv: Argv) => {
  return argv
    .option('activityName', {
      alias: 'a',
      describe: 'Android Activity to launch',
      type: 'string',
    })
    .option('bundleId', {
      alias: 'b',
      describe: 'iOS Bundle Identifier',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application selector',
      type: 'string',
    })
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .option('extraJsDependencies', {
      alias: 'e',
      describe:
        'Additional JavaScript dependencies to add to the composite JavaScript bundle',
      type: 'array',
    })
    .coerce('extraJsDependencies', d => d.map(PackagePath.fromString))
    .option('jsApiImpls', {
      describe: 'A list of one or more JS API Implementation(s)',
      type: 'array',
    })
    .coerce('jsApiImpls', d => d.map(PackagePath.fromString))
    .option('flavor', {
      describe: 'Custom binary flavor',
    })
    .option('launchArgs', {
      describe: '[iOS] Arguments to pass to the application when launching it',
      type: 'string',
    })
    .option('launchEnvVars', {
      describe:
        '[iOS] Environment variables to pass to the application when launching it (space separated key=value pairs)',
    })
    .option('launchFlags', {
      describe: '[Android] Flags to pass to the application when launching it',
      type: 'string',
    })
    .option('miniapps', {
      alias: 'm',
      describe: 'A list of one or more MiniApp(s)',
      type: 'array',
    })
    .coerce('miniapps', d => d.map(PackagePath.fromString))
    .option('packageName', {
      alias: 'p',
      describe: 'Android application package name',
      type: 'string',
    })
    .option('watchNodeModules', {
      alias: 'w',
      describe:
        'A list of one or more directory name from node_modules that should be watched for changes',
      type: 'array',
    })
    .option('disableBinaryStore', {
      describe:
        'Disable automatic retrieval of the binary from the Binary Store',
      type: 'boolean',
    })
    .group(
      ['activityName', 'launchFlags', 'packageName'],
      'Android binary launch options:'
    )
    .group(
      ['bundleId', 'launchEnvVars', 'launchArgs'],
      'iOS binary launch options:'
    )
    .group(['disableBinaryStore', 'flavor'], 'Binary store specific options:')
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  activityName,
  bundleId,
  descriptor,
  extraJsDependencies = [],
  flavor,
  jsApiImpls,
  launchArgs,
  launchEnvVars,
  launchFlags,
  miniapps,
  packageName,
  watchNodeModules,
  disableBinaryStore,
}: {
  activityName?: string
  bundleId?: string
  descriptor?: NativeApplicationDescriptor
  extraJsDependencies?: PackagePath[]
  flavor?: string
  jsApiImpls?: PackagePath[]
  launchArgs?: string
  launchEnvVars?: string
  launchFlags?: string
  miniapps?: PackagePath[]
  packageName?: string
  watchNodeModules?: string[]
  disableBinaryStore?: boolean
} = {}) => {
  if (!miniapps && !descriptor) {
    descriptor = await askUserToChooseANapDescriptorFromCauldron()
  }

  await start({
    activityName,
    bundleId,
    descriptor,
    disableBinaryStore,
    extraJsDependencies,
    flavor,
    jsApiImpls,
    launchArgs,
    launchEnvVars,
    launchFlags,
    miniapps,
    packageName,
    watchNodeModules,
  })
}

export const handler = tryCatchWrap(commandHandler)
