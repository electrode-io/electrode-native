// @flow

import {Utils} from '@walmart/ern-util'

exports.command = 'add <name> [dev]'
exports.desc = 'Add a dependency to this miniapp'

exports.builder = function (yargs: any) {
  return yargs
        .option('dev', {
          type: 'bool',
          alias: 'd',
          describe: 'Add this dependency as a devDependency'
        })
}

exports.handler = async function ({
  name,
  dev = false
} : {
  name: string,
  dev: boolean
}) {
  Utils.logErrorAndExitProcess(`We have made it simple for you, simply run 'ern add ${name}' to add this dependency to your miniapp`)
}
