import fs from 'fs';
import child_process from 'child_process';
const execSync = child_process.execSync;

import * as yargs from 'yargs';
import chalk from 'chalk';
import platform from './util/platform.js';

const CACHE_PATH = `${__dirname}/cache`;

//==============================================================================
// Geeky eye candy
//==============================================================================

function showBanner() {
  console.log(chalk.yellow(" ___ _        _               _    " + chalk.green(" ___             _   _  _      _   _         ")));
  console.log(chalk.yellow("| __| |___ __| |_ _ _ ___  __| |___" + chalk.green("| _ \\___ __ _ __| |_| \\| |__ _| |_(_)_ _____")));
  console.log(chalk.yellow("| _|| / -_) _|  _| '_/ _ \\/ _` / -_" + chalk.green(")   / -_) _` / _|  _| .` / _` |  _| \\ V / -_)")));
  console.log(chalk.yellow('|___|_\\___\\__|\\__|_| \\___/\\__,_\\___' + chalk.green("|_|_\\___\\__,_\\__|\\__|_|\\_\\__,_|\\__|_|\\_/\\___|" + chalk.cyan(`  [v${platform.currentVersion}]`))));
  console.log("");
}

//==============================================================================
// Entry point
//==============================================================================
export default function run() {
  showBanner();

  require('yargs')
    .commandDir('commands')
    .demandCommand(1)
    .help()
    .wrap(yargs.terminalWidth())
    .argv
}
