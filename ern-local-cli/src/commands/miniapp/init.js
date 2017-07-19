// @flow

import {Utils} from '@walmart/ern-util'

exports.command = 'init <appName> [platformVersion] [scope]'
exports.desc = 'Create a new ern application'

exports.builder = function (yargs: any) {
  return yargs
        .option('platformVersion', {
          alias: 'v',
          type: 'string',
          describe: 'Force version of ern platform to use'
        })
        .option('scope', {
          describe: 'npm scope to use for this app'
        })
        .option('headless', {
          type: 'bool',
          describe: 'Creates a headless (without ui) miniapp'
        })
}

exports.handler = async function ({
  appName,
  platformVersion = '',
  scope = ''
} : {
  appName: string,
  platformVersion: string,
  scope?: string,
}) {
  Utils.logErrorAndExitProcess(`This command is deprecated, run the following command instead: ern create-miniapp ${appName} ${platformVersion} ${scope}`)
}
