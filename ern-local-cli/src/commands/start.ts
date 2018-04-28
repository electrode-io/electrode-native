import utils from '../lib/utils'
import start from '../lib/start'
import _ from 'lodash'
import { PackagePath, utils as coreUtils } from 'ern-core'
import { Argv } from 'yargs'

export const command = 'start'
export const desc = 'Start a composite MiniApp'

export const builder = (argv: Argv) => {
  return argv
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application selector',
      type: 'string',
    })
    .option('miniapps', {
      alias: 'm',
      describe: 'A list of one or more miniapps',
      type: 'array',
    })
    .option('watchNodeModules', {
      alias: 'w',
      describe:
        'A list of one or more directory name from node_modules that should be watched for changes',
      type: 'array',
    })
    .option('extraJsDependencies', {
      alias: 'e',
      describe:
        'Additional JavaScript dependencies to add to the composite JavaScript bundle',
      type: 'array',
    })
    .group(['packageName', 'activityName'], 'Android binary specific options:')
    .option('packageName', {
      alias: 'p',
      describe: 'Android application package name',
      type: 'string',
    })
    .option('activityName', {
      alias: 'a',
      describe: 'Android Activity to launch',
      type: 'string',
    })
    .group(['bundleId'], 'iOS binary specific options:')
    .option('bundleId', {
      alias: 'b',
      describe: 'iOS Bundle Identifier',
      type: 'string',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  descriptor,
  miniapps,
  watchNodeModules,
  packageName,
  activityName,
  bundleId,
  extraJsDependencies = [],
}: {
  descriptor?: string
  miniapps?: string[]
  watchNodeModules?: string[]
  packageName?: string
  activityName?: string
  bundleId?: string
  extraJsDependencies?: string[]
} = {}) => {
  try {
    await start({
      activityName,
      bundleId,
      descriptor,
      extraJsDependencies: _.map(extraJsDependencies, jsDep =>
        PackagePath.fromString(jsDep)
      ),
      miniapps,
      packageName,
      watchNodeModules,
    })
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
