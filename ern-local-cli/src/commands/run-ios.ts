import { epilog, tryCatchWrap } from '../lib';
import {
  AppVersionDescriptor,
  deviceConfig,
  getLocalIp,
  log,
  PackagePath,
  readPackageJson,
} from 'ern-core';
import { parseJsonFromStringOrFile, runMiniApp } from 'ern-orchestrator';
import { Argv } from 'yargs';

export const command = 'run-ios';
export const desc = 'Run one or more MiniApps in the iOS Runner application';

export const builder = (argv: Argv) => {
  return argv
    .option('baseComposite', {
      describe: 'Base Composite',
      type: 'string',
    })
    .coerce('baseComposite', (d) => PackagePath.fromString(d))
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', (d) => AppVersionDescriptor.fromString(d))
    .option('dev', {
      default: true,
      describe: 'Enable or disable React Native dev support',
      type: 'boolean',
    })
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra run configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
    .option('host', {
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
    .coerce('miniapps', (d) => d.map(PackagePath.fromString))
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
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  baseComposite,
  descriptor,
  dev,
  extra,
  host,
  launchArgs,
  launchEnvVars,
  mainMiniAppName,
  miniapps,
  port,
  usePreviousDevice,
}: {
  baseComposite?: PackagePath;
  descriptor?: AppVersionDescriptor;
  dev?: boolean;
  extra?: string;
  host?: string;
  launchArgs?: string;
  launchEnvVars?: string;
  mainMiniAppName?: string;
  miniapps?: PackagePath[];
  port?: string;
  usePreviousDevice?: boolean;
}) => {
  if (process.platform !== 'darwin') {
    return log.error('This command is only supported on macOS');
  }
  deviceConfig.updateDeviceConfig('ios', usePreviousDevice);

  if (!host && dev) {
    try {
      host = getLocalIp();
    } catch (e) {
      // Swallow
      log.debug(e);
    }
  }

  const miniAppPackageJson = await readPackageJson(process.cwd());

  let extraObj;
  try {
    extraObj = extra && (await parseJsonFromStringOrFile(extra));
  } catch (e) {
    throw new Error('(--extra/-e option): Invalid input');
  }
  extraObj = extraObj ?? (miniAppPackageJson.ern ? miniAppPackageJson.ern : {});

  await runMiniApp('ios', {
    baseComposite,
    descriptor,
    dev,
    extra: extraObj,
    host: host || 'localhost',
    launchArgs,
    launchEnvVars,
    mainMiniAppName,
    miniapps,
    port,
  });
};

export const handler = tryCatchWrap(commandHandler);
