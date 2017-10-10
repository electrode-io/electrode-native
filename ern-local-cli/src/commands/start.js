// @flow

import utils from '../lib/utils'
import start from '../lib/start'

exports.command = 'start'
exports.desc = 'Start a composite MiniApp'

exports.builder = function (yargs: any) {
  return yargs
    .option('descriptor', {
      type: 'string',
      alias: 'n',
      describe: 'Full native application selector'
    })
    .option('miniapps', {
      type: 'array',
      alias: 'm',
      describe: 'A list of one or more miniapps'
    })
    .option('watchNodeModules', {
      type: 'array',
      alias: 'w',
      describe: 'A list of one or more folder name from node_modules that should be watched for changes'
    })
    .group(['packageName', 'activityName'], 'Android binary specific options:')
    .option('packageName', {
      type: 'string',
      alias: 'p',
      describe: 'Android application package name'
    })
    .option('activityName', {
      type: 'string',
      alias: 'a',
      describe: 'Android Activity to launch'
    })
    .group(['bundleId'], 'iOS binary specific options:')
    .option('bundleId', {
      type: 'string',
      alias: 'b',
      describe: 'iOS Bundle Identifier'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  descriptor,
  miniapps,
  watchNodeModules,
  packageName,
  activityName,
  bundleId
} : {
  descriptor?: string,
  miniapps?: Array<string>,
  watchNodeModules?: Array<string>,
  packageName?: string,
  activityName?: string,
  bundleId?: string
}) {
  try {
    await start({
      miniapps,
      descriptor,
      watchNodeModules,
      packageName,
      activityName,
      bundleId
    })
  } catch (e) {
    log.error(e.message)
  }
}
