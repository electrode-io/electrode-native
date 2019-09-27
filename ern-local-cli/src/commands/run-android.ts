import { epilog, tryCatchWrap } from '../lib'
import {
  deviceConfig,
  readPackageJson,
  AppVersionDescriptor,
  PackagePath,
} from 'ern-core'
import { runMiniApp } from 'ern-orchestrator'
import { Argv } from 'yargs'
import { parseJsonFromStringOrFile } from 'ern-orchestrator'

export const command = 'run-android'
export const desc = 'Run one or more MiniApps in the Android Runner application'

export const builder = (argv: Argv) => {
  return argv
    .option('baseComposite', {
      describe: 'Base Composite',
      type: 'string',
    })
    .coerce('baseComposite', d => PackagePath.fromString(d))
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra run configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
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
  baseComposite,
  extra,
  descriptor,
  dev,
  host,
  mainMiniAppName,
  miniapps,
  port,
  usePreviousDevice,
}: {
  baseComposite?: PackagePath
  extra?: string
  descriptor?: AppVersionDescriptor
  dev?: boolean
  host?: string
  mainMiniAppName?: string
  miniapps?: PackagePath[]
  port?: string
  usePreviousDevice?: boolean
}) => {
  deviceConfig.updateDeviceConfig('android', usePreviousDevice)

  const miniAppPackageJson = await readPackageJson(process.cwd())
  const extraObj =
    (extra && (await parseJsonFromStringOrFile(extra))) ||
    miniAppPackageJson.ern
      ? miniAppPackageJson.ern
      : {}

  await runMiniApp('android', {
    baseComposite,
    descriptor,
    dev,
    extra: extraObj,
    host,
    mainMiniAppName,
    miniapps,
    port,
  })
  process.exit(0)
}

export const handler = tryCatchWrap(commandHandler)
