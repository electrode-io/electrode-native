import chalk from 'chalk';

export function logDebug(msg) {
  console.log(chalk.green(`${msg}`));
}

export function logInfo(msg) {
  console.log(chalk.cyan(`${msg}`));
}

export function logWarn(msg) {
  console.log(chalk.yellow(`${msg}`));
}

export function logError(msg) {
  console.log(chalk.red(`${msg}`));
}
