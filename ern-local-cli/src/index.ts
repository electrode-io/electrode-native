import chalk from 'chalk'
import { execSync } from 'child_process'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  config,
  log,
  Manifest,
  ManifestOverrideConfig,
  shell,
  Platform,
} from 'ern-core'
import * as yargs from 'yargs'

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
  const currentCauldronRepo = config.getValue('cauldronRepoInUse') || '-NONE-'
  console.log(
    chalk.cyan(`[v${Platform.currentVersion}]`) +
      chalk.cyan(` [Cauldron: ${currentCauldronRepo}]`)
  )
  console.log('')
}

function showVersion() {
  // get electrode-native local-cli version
  if (config.getValue('platformVersion')) {
    log.info(`ern-local-cli : ${config.getValue('platformVersion')}`)
  }
  // get electrode-native global-cli version
  const packageInfo = JSON.parse(
    execSync('npm ls -g electrode-native --json').toString()
  )
  if (packageInfo && packageInfo.dependencies) {
    log.info(
      `electrode-native : ${
        packageInfo.dependencies['electrode-native'].version
      }`
    )
  }
}

Manifest.getOverrideManifestConfig = async (): Promise<ManifestOverrideConfig | void> => {
  const cauldronInstance = await getActiveCauldron()
  const manifestConfig =
    cauldronInstance && (await cauldronInstance.getManifestConfig())
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

// ==============================================================================
// Entry point
// =============================================================================
export default function run() {
  const logLevel = process.env.ERN_LOG_LEVEL
    ? process.env.ERN_LOG_LEVEL
    : config.getValue('logLevel', 'info')
  log.setLogLevel(logLevel)
  shell.config.fatal = true
  shell.config.verbose = logLevel === 'trace'

  if (config.getValue('showBanner', true)) {
    showBanner()
  }
  showInfo()

  if (yargs.argv._.length === 0 && yargs.argv.version) {
    return showVersion()
  }

  return yargs
    .commandDir('commands', {
      extensions:
        process.env.NODE_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .demandCommand(1, 'Need a command')
    .help('help')
    .wrap(yargs.terminalWidth())
    .strict().argv
}
