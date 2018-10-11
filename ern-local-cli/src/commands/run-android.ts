import { epilog } from '../lib'
import {
  deviceConfig,
  utils as coreUtils,
  NativeApplicationDescriptor,
} from 'ern-core'
import { runMiniApp } from 'ern-orchestrator'
import { Argv } from 'yargs'

export const command = 'run-android'
export const desc = 'Run one or more MiniApps in the Android Runner application'

export const builder = (argv: Argv) => {
  return argv
    .option('dev', {
      default: true,
      describe: 'Enable or disable React Native dev support',
      type: 'boolean',
    })
    .option('miniapps', {
      alias: 'm',
      describe: 'One or more MiniApps to combine in the Runner Container',
      type: 'array',
    })
    .option('dependencies', {
      alias: 'deps',
      describe:
        'One or more additional native dependencies to add to the Runner Container',
      type: 'array',
    })
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .option('mainMiniAppName', {
      describe:
        'Name of the MiniApp to launch when starting the Runner application',
      type: 'string',
    })
    .option('usePreviousDevice', {
      alias: 'u',
      describe: 'Use the previously selected device to avoid prompt',
      type: 'boolean',
    })
    .option('host', {
      default: 'localhost',
      describe: 'Host/IP to use for the local packager',
      type: 'string',
    })
    .option('port', {
      default: '8081',
      describe: 'Port to use for the local package',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const handler = async ({
  miniapps,
  dependencies = [],
  descriptor,
  mainMiniAppName,
  dev,
  usePreviousDevice,
  host,
  port,
}: {
  miniapps?: string[]
  dependencies: string[]
  descriptor?: NativeApplicationDescriptor
  mainMiniAppName?: string
  dev?: boolean
  usePreviousDevice?: boolean
  host?: string
  port?: string
}) => {
  try {
    deviceConfig.updateDeviceConfig('android', usePreviousDevice)

    await runMiniApp('android', {
      dependencies,
      descriptor,
      dev,
      host,
      mainMiniAppName,
      miniapps,
      port,
    })
    process.exit(0)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
