// @flow

import {
  MiniApp
} from 'ern-core'
import {
  Utils
} from 'ern-util'
import utils from '../lib/utils'

exports.command = 'link'
exports.desc = 'Link a MiniApp'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = async function () {
  try {
    MiniApp.fromCurrentPath().link()
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}
