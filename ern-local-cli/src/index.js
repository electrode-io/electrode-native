// @flow

import 'babel-polyfill'
import {
  Platform
} from 'ern-core'
import {
  ColoredLog,
  config as ernConfig
} from 'ern-util'
import chalk from 'chalk'
import yargs from 'yargs'

// ==============================================================================
// Geeky eye candy
// ==============================================================================

function showBanner () {
  console.log(chalk.yellow(' ___ _        _               _    ') + chalk.green(' ___             _   _  _      _   _         '))
  console.log(chalk.yellow('| __| |___ __| |_ _ _ ___  __| |___') + chalk.green('| _ \\___ __ _ __| |_| \\| |__ _| |_(_)_ _____'))
  console.log(chalk.yellow("| _|| / -_) _|  _| '_/ _ \\/ _` / -_") + chalk.green(')   / -_) _` / _|  _| .` / _` |  _| \\ V / -_)'))
  console.log(chalk.yellow('|___|_\\___\\__|\\__|_| \\___/\\__,_\\___') + chalk.green('|_|_\\___\\__,_\\__|\\__|_|\\_\\__,_|\\__|_|\\_/\\___|'))
  console.log(chalk.cyan(`[v${Platform.currentVersion}]`) + chalk.gray(`[${Platform.currentGitCommitSha}]`))
  console.log('')
}

// ==============================================================================
// Entry point
// ==============================================================================
export default function run () {
  global.log = new ColoredLog(ernConfig.getValue('loglevel', 'info'))

  if (ernConfig.getValue('banner', true)) {
    showBanner()
  }

  const argv = yargs.argv
  if (argv['show-banner']) {
    ernConfig.setValue('banner', true)
    return log.info(`Banner is now enabled`)
  } else if (argv['hide-banner']) {
    ernConfig.setValue('banner', false)
    return log.info(`Banner is now disabled`)
  } else if (argv['log-level']) {
    ernConfig.setValue('loglevel', argv['log-level'])
    return log.info(`Log level is now set to ${argv['log-level']}`)
  }

  return yargs
    .commandDir('commands')
    .demandCommand(1, 'Need a command')
    .help('help')
    .wrap(yargs.terminalWidth())
    .strict()
    .argv
}
