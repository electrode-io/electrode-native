// @flow

import chalk from 'chalk'
const _log = require('console-log-level')({
  level: process.env['ERN_LOG_LEVEL']
})

export default {
  trace (msg: string) {
    _log.trace(chalk.gray(msg))
  },
  debug (msg: string) {
    _log.debug(chalk.green(msg))
  },
  info (msg: string) {
    _log.info(chalk.cyan(msg))
  },
  warn (msg: string) {
    _log.warn(chalk.yellow(msg))
  },
  error (msg: string) {
    _log.error(chalk.red(msg))
  }
}
