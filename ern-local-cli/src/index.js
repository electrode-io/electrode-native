// @flow

import './lib/log-noop.js'
import {
  Platform,
  ColoredLog,
  config as ernConfig,
  shell,
  Manifest,
  utils as coreUtils
} from 'ern-core'
import type {
  ManifestOverrideConfig
} from 'ern-core'
import chalk from 'chalk'
import yargs from 'yargs'
import { execSync } from 'child_process'

// ==============================================================================
// Geeky eye candy
// ==============================================================================

function showBanner () {
  console.log(chalk.yellow(' ___ _        _               _      ') + chalk.green(' _  _      _   _         '))
  console.log(chalk.yellow('| __| |___ __| |_ _ _ ___  __| |___  ') + chalk.green('| \\| |__ _| |_(_)_ _____ '))
  console.log(chalk.yellow('| _|| / -_) _|  _| \'_/ _ \\/ _` / -_) ') + chalk.green('| .` / _` |  _| \\ V / -_)'))
  console.log(chalk.yellow('|___|_\\___\\__|\\__|_| \\___/\\__,_\\___| ') + chalk.green('|_|\\_\\__,_|\\__|_|\\_/\\___|'))
}

function showInfo () {
  const currentCauldronRepo = ernConfig.getValue('cauldronRepoInUse') || '-NONE-'
  console.log(chalk.cyan(`[v${Platform.currentVersion}]`) + chalk.cyan(` [Cauldron: ${currentCauldronRepo}]`))
  console.log('')
}

function showVersion () {
  // get electrode-native local-cli version
  if (ernConfig.getValue('platformVersion')) {
    log.info(`ern-local-cli : ${ernConfig.getValue('platformVersion')}`)
  }
  // get electrode-native global-cli version
  const packageInfo = JSON.parse(execSync(`npm ls -g electrode-native --json`).toString())
  if (packageInfo && packageInfo.dependencies) {
    log.info(`electrode-native : ${packageInfo.dependencies['electrode-native'].version}`)
  }
}

Manifest.getOverrideManifestConfig = async () : Promise<?ManifestOverrideConfig> => {
  const cauldronInstance = await coreUtils.getCauldronInstance()
  const manifestConfig = cauldronInstance && await cauldronInstance.getManifestConfig()
  if (manifestConfig && manifestConfig.override && manifestConfig.override.url) {
    return {
      url: manifestConfig.override.url,
      type: manifestConfig.override.type || 'partial'
    }
  }
}

// ==============================================================================
// Entry point
// ==============================================================================
export default function run () {
  const logLevel = process.env['ERN_LOG_LEVEL'] ? process.env['ERN_LOG_LEVEL'] : ernConfig.getValue('logLevel', 'info')
  global.log = new ColoredLog(logLevel)
  global.ernLogLevel = logLevel
  shell.config.fatal = true
  shell.config.verbose = (logLevel === 'trace')

  if (ernConfig.getValue('showBanner', true)) { showBanner() }
  showInfo()

  if (yargs.argv._.length === 0 && yargs.argv['version']) {
    return showVersion()
  }

  return yargs
    .commandDir('commands')
    .demandCommand(1, 'Need a command')
    .help('help')
    .wrap(yargs.terminalWidth())
    .strict()
    .argv
}
