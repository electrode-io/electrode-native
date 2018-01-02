// @flow

import chalk from 'chalk'

export default class ColoredLog {
  _log: Object

  constructor (level: string = 'info') {
    this._log = require('console-log-level')({
      level
    })
  }

  trace (msg: string) {
    this._log.trace(chalk.gray(msg))
  }

  debug (msg: string) {
    this._log.debug(chalk.green(msg))
  }

  info (msg: string) {
    this._log.info(chalk.cyan(msg))
  }

  warn (msg: string) {
    this._log.warn(chalk.yellow(msg))
  }

  error (msg: string) {
    this._log.error(chalk.red(msg))
  }
}
