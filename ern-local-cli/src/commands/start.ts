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
    .group(['packageName', 'activityName'], 'Android binary specific options:')
    .group(['bundleId'], 'iOS binary specific options:')
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  activityName,
  bundleId,
  descriptor,
  extraJsDependencies = [],
  jsApiImpls,
  miniapps,
  packageName,
  watchNodeModules,
}: {
  activityName?: string
  bundleId?: string
  descriptor?: NativeApplicationDescriptor
  extraJsDependencies?: PackagePath[]
  jsApiImpls?: PackagePath[]
  miniapps?: PackagePath[]
  packageName?: string
  watchNodeModules?: string[]
} = {}) => {
  if (!miniapps && !descriptor) {
    descriptor = await askUserToChooseANapDescriptorFromCauldron()
  }

  await start({
    activityName,
    bundleId,
    descriptor,
    extraJsDependencies,
    jsApiImpls,
    miniapps,
    packageName,
    watchNodeModules,
  })
}

export const handler = tryCatchWrap(commandHandler)
