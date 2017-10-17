// @flow

import utils from '../lib/utils'
import { config as ernConfig } from 'ern-util'

exports.command = 'run-android'
exports.desc = 'Run one or more MiniApps in the Android Runner application'

exports.builder = function (yargs: any) {
  return yargs
    .option('dev', {
      type: 'bool',
      describe: 'Enable or disable React Native dev support'
    })
    .option('miniapps', {
      type: 'array',
      alias: 'm',
      describe: 'One or more MiniApps to combine in the Runner Container'
    })
    .option('dependencies', {
      type: 'array',
      alias: 'deps',
      describe: 'One or more additional native dependencies to add to the Runner Container'
    })
    .option('descriptor', {
      type: 'string',
      alias: 'd',
      describe: 'Full native application descriptor'
    })
    .option('mainMiniAppName', {
      type: 'string',
      describe: 'Name of the MiniApp to launch when starting the Runner application'
    })
    .option('usePreviousEmulator', {
      type: 'bool',
      alias: 'u',
      describe: 'Use the previously selected emulator to avoid prompt'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  miniapps,
  dependencies = [],
  descriptor,
  mainMiniAppName,
  dev,
  usePreviousEmulator
} : {
  miniapps?: Array<string>,
  dependencies: Array<string>,
  descriptor?: string,
  mainMiniAppName?: string,
  dev?: boolean,
  usePreviousEmulator?: boolean
}) {
  let emulatorConfig = ernConfig.getValue('emulatorConfig', {
    android: {usePreviousEmulator: false, emulatorName: ''},
    ios: {usePreviousEmulator: false, simulatorUdid: ''}
  })
  usePreviousEmulator ? emulatorConfig.android.usePreviousEmulator = true : emulatorConfig.android.usePreviousEmulator = false
  ernConfig.setValue('emulatorConfig', emulatorConfig)

  try {
    await utils.runMiniApp('android', {
      mainMiniAppName,
      miniapps,
      dependencies,
      descriptor,
      dev
    })
    process.exit(0)
  } catch (e) {
    log.error(`${e}`)
  }
}
