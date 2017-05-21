import chalk from 'chalk'
const _log = require('console-log-level')({
  level: process.env['LOG_LEVEL']
})

export default {
  trace (msg) {
    _log.trace(chalk.gray(msg))
  },
  debug (msg) {
    _log.debug(chalk.green(msg))
  },
  info (msg) {
    _log.info(chalk.cyan(msg))
  },
  warn (msg) {
    _log.warn(chalk.yellow(msg))
  },
  error (msg) {
    _log.error(chalk.red(msg))
  }
}
