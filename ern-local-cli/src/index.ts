import chalk from 'chalk'
import { execSync } from 'child_process'
import fs from 'fs'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  config,
  kax,
  log,
  LogLevel,
  Manifest,
  ManifestOverrideConfig,
  Platform,
  shell,
} from 'ern-core'
import {
  KaxAdvancedRenderer,
  KaxRenderer,
  KaxSimpleRenderer,
  KaxTask,
} from 'kax'
import path from 'path'
import yargs from 'yargs'

// ==============================================================================
// Geeky eye candy
// ==============================================================================

function showBanner() {
  console.log(
    chalk.yellow(' ___ _        _               _      ') +
      chalk.green(' _  _      _   _         ')
  )
  console.log(
    chalk.yellow('| __| |___ __| |_ _ _ ___  __| |___  ') +
      chalk.green('| \\| |__ _| |_(_)_ _____ ')
  )
  console.log(
    chalk.yellow("| _|| / -_) _|  _| '_/ _ \\/ _` / -_) ") +
      chalk.green('| .` / _` |  _| \\ V / -_)')
  )
  console.log(
    chalk.yellow('|___|_\\___\\__|\\__|_| \\___/\\__,_\\___| ') +
      chalk.green('|_|\\_\\__,_|\\__|_|\\_/\\___|')
  )
}

function showInfo() {
  const currentCauldronRepo = config.get('cauldronRepoInUse') || '-NONE-'
  const bundleStoreId = config.get('bundlestore-id')
  const l = bundleStoreId ? chalk.cyan(` [BundleStore: ${bundleStoreId}]`) : ''
  console.log(
    chalk.cyan(`[v${Platform.currentVersion}]`) +
      chalk.cyan(` [Cauldron: ${currentCauldronRepo}]`) +
      l
  )
  console.log('')
}

function showVersion() {
  let packageInfo
  try {
    const pkg = path.join(
      execSync('yarn global dir')
        .toString()
        .trim(),
      'node_modules',
      'electrode-native',
      'package.json'
    )
    packageInfo = fs.existsSync(pkg) ? require(pkg) : ''
  } catch (err) {
    log.trace(err)
  }

  if (!packageInfo) {
    try {
      packageInfo = JSON.parse(
        execSync('npm ls -g electrode-native --json').toString()
      ).dependencies['electrode-native']
    } catch (err) {
      log.trace(err)
    }
  }

  const globalVersion = packageInfo ? packageInfo.version : ''
  log.info(`electrode-native: ${globalVersion ? globalVersion : '-UNKNOWN-'}`)

  const localVersion = config.get('platformVersion')
  log.info(`ern platform: ${localVersion ? localVersion : '-UNKNOWN-'}`)
}

Manifest.getOverrideManifestConfig = async (): Promise<ManifestOverrideConfig | void> => {
  const cauldronInstance = await getActiveCauldron({
    throwIfNoActiveCauldron: false,
  })
  const manifestConfig =
    config.get('manifest', undefined) ??
    (cauldronInstance && (await cauldronInstance.getManifestConfig()))
  if (
    manifestConfig &&
    manifestConfig.override &&
    manifestConfig.override.url
  ) {
    return {
      type: manifestConfig.override.type || 'partial',
      url: manifestConfig.override.url,
    }
  }
}

const kaxRendererConfig = {
  colorScheme: {
    error: 'red',
    info: 'cyan',
    task: 'white',
    warning: 'yellow',
  },
  shouldLogTime: true,
  symbolScheme: {
    error: 'error',
    info: 'info',
    taskFailure: 'error',
    taskRunning: 'dots',
    taskSuccess: 'success',
    warning: 'warning',
  },
  symbolizeMultiLine: true,
}

class KaxNullRenderer implements KaxRenderer {
  public renderWarning(msg: string) {
    // noop
  }
  public renderInfo(msg: string) {
    // noop
  }
  public renderError(msg: string) {
    // noop
  }
  public renderRaw(msg: string) {
    // noop
  }
  public renderTask<T>(msg: string, task: KaxTask<T>) {
    // noop
  }
}

const logLevelStringToEnum = (level: string) => {
    switch (level) {
      case 'trace':
        return LogLevel.Trace
      case 'debug':
        return LogLevel.Debug
      case 'info':
        return LogLevel.Info
      case 'warn':
        return LogLevel.Warn
      case 'error':
        return LogLevel.Error
      case 'off':
        return LogLevel.Off
      default:
        throw new Error(`Invalid log level ${level}`)
    }
  }

  // ==============================================================================
  // Entry point
  // =============================================================================
;(function run() {
  const hasJsonOpt = process.argv.slice(1).includes('--json')
  const logLevel: LogLevel = hasJsonOpt
    ? LogLevel.Off
    : process.env.ERN_LOG_LEVEL
    ? logLevelStringToEnum(process.env.ERN_LOG_LEVEL)
    : logLevelStringToEnum(config.get('logLevel', 'info'))

  log.setLogLevel(logLevel)
  shell.config.fatal = true
  shell.config.verbose = logLevel === LogLevel.Trace
  shell.config.silent = !(
    logLevel === LogLevel.Trace || logLevel === LogLevel.Debug
  )

  kax.renderer =
    logLevel === LogLevel.Trace || logLevel === LogLevel.Debug
      ? new KaxSimpleRenderer(kaxRendererConfig)
      : logLevel === LogLevel.Off
      ? new KaxNullRenderer()
      : new KaxAdvancedRenderer(kaxRendererConfig)

  if (!hasJsonOpt) {
    if (config.get('showBanner', true)) {
      showBanner()
    }
    showInfo()
  }

  if (process.argv.slice(1).includes('--version')) {
    return showVersion()
  }

  return yargs
    .commandDir('commands', {
      extensions: process.env.ERN_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand()
    .help()
    .strict()
    .version(false)
    .wrap(yargs.terminalWidth()).argv
})()
