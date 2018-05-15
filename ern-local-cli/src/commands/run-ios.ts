import utils from '../lib/utils'
import { utils as coreUtils, deviceConfig, log } from 'ern-core'
import { Argv } from 'yargs'

export const command = 'run-ios'
export const desc = 'Run one or more MiniApps in the iOS Runner application'

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
    .epilog(utils.epilog(exports))
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
  descriptor?: string
  mainMiniAppName?: string
  dev?: boolean
  usePreviousDevice?: boolean
  host?: string
  port?: string
}) => {
  try {
    if (process.platform !== 'darwin') {
      return log.error('This command can only be used on Mac OS X')
    }
    deviceConfig.updateDeviceConfig('ios', usePreviousDevice)

    await utils.runMiniApp('ios', {
      dependencies,
      descriptor,
      dev,
      host,
      mainMiniAppName,
      miniapps,
      port,
    })
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
