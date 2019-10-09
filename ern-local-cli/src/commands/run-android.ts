import { epilog, tryCatchWrap } from '../lib'
import {
  deviceConfig,
  NativeApplicationDescriptor,
  PackagePath,
} from 'ern-core'
import { runMiniApp } from 'ern-orchestrator'
import { Argv } from 'yargs'
import { parseJsonFromStringOrFile } from 'ern-orchestrator'

export const command = 'run-android'
export const desc = 'Run one or more MiniApps in the Android Runner application'

export const builder = (argv: Argv) => {
  return argv
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra run configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
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
    .option('launchFlags', {
      describe: 'Flags to pass to the application when launching it',
      type: 'string',
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
  extra,
  dependencies = [],
  descriptor,
  dev,
  host,
  launchFlags,
  mainMiniAppName,
  miniapps,
  port,
  usePreviousDevice,
}: {
  extra?: string
  dependencies: PackagePath[]
  descriptor?: NativeApplicationDescriptor
  dev?: boolean
  host?: string
  launchFlags?: string
  mainMiniAppName?: string
  miniapps?: PackagePath[]
  port?: string
  usePreviousDevice?: boolean
}) => {
  deviceConfig.updateDeviceConfig('android', usePreviousDevice)

  const extraObj = (extra && (await parseJsonFromStringOrFile(extra))) || {}

  await runMiniApp('android', {
    dependencies,
    descriptor,
    dev,
    extra: extraObj,
    host,
    launchFlags,
    mainMiniAppName,
    miniapps,
    port,
  })
  process.exit(0)
}

export const handler = tryCatchWrap(commandHandler)
