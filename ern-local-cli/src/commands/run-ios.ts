import { epilog, tryCatchWrap } from '../lib'
import {
  deviceConfig,
  log,
  NativeApplicationDescriptor,
  PackagePath,
} from 'ern-core'
import { runMiniApp } from 'ern-orchestrator'
import { Argv } from 'yargs'

export const command = 'run-ios'
export const desc = 'Run one or more MiniApps in the iOS Runner application'

export const builder = (argv: Argv) => {
  return argv
    .option('dependencies', {
      alias: 'deps',
      describe:
        'One or more additional native dependencies to add to the Runner Container',
      type: 'array',
    })
    .coerce('dependencies', d => d.map(PackagePath.fromString))
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .option('dev', {
      default: true,
      describe: 'Enable or disable React Native dev support',
      type: 'boolean',
    })
    .option('host', {
      default: 'localhost',
      describe: 'Host/IP to use for the local packager',
      type: 'string',
    })
    .option('launchArgs', {
      describe: 'Arguments to pass to the application when launching it',
      type: 'string',
    })
    .option('launchEnvVars', {
      describe:
        'Environment variables to pass to the application when launching it (space separated key=value pairs)',
    })
    .option('mainMiniAppName', {
      describe:
        'Name of the MiniApp to launch when starting the Runner application',
      type: 'string',
    })
    .option('miniapps', {
      alias: 'm',
      describe: 'One or more MiniApps to combine in the Runner Container',
      type: 'array',
    })
    .coerce('miniapps', d => d.map(PackagePath.fromString))
    .option('port', {
      default: '8081',
      describe: 'Port to use for the local package',
      type: 'string',
    })
    .option('usePreviousDevice', {
      alias: 'u',
      describe: 'Use the previously selected device to avoid prompt',
      type: 'boolean',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  dependencies = [],
  descriptor,
  dev,
  host,
  launchArgs,
  launchEnvVars,
  mainMiniAppName,
  miniapps,
  port,
  usePreviousDevice,
}: {
  dependencies: PackagePath[]
  descriptor?: NativeApplicationDescriptor
  dev?: boolean
  host?: string
  launchArgs?: string
  launchEnvVars?: string
  mainMiniAppName?: string
  miniapps?: PackagePath[]
  port?: string
  usePreviousDevice?: boolean
}) => {
  if (process.platform !== 'darwin') {
    return log.error('This command can only be used on Mac OS X')
  }
  deviceConfig.updateDeviceConfig('ios', usePreviousDevice)

  await runMiniApp('ios', {
    dependencies,
    descriptor,
    dev,
    host: host || 'localhost',
    launchArgs,
    launchEnvVars,
    mainMiniAppName,
    miniapps,
    port,
  })
}

export const handler = tryCatchWrap(commandHandler)
