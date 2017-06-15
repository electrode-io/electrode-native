// @flow

import 'babel-polyfill'
import {
  coloredLog,
  Platform
} from '@walmart/ern-util'
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
  global.log = coloredLog
  showBanner()
  return yargs.commandDir('commands')
        .demandCommand(1, 'Need a command')
        .help()
        .wrap(yargs.terminalWidth())
        .argv
}
