import chalk from 'chalk'
import kax from './kax'

export default class ColoredLog {
  private log: any
  private pLevel: string

  constructor(level: string = 'info') {
    this.pLevel = level
    this.log = require('console-log-level')({
      level,
    })
  }

  public setLogLevel(level: string) {
    this.pLevel = level
    this.log = require('console-log-level')({
      level,
    })
  }

  get level(): string {
    return this.pLevel
  }

  public trace(msg: string) {
    this.log.trace(chalk.gray(msg))
  }

  public debug(msg: string) {
    this.log.debug(chalk.green(msg))
  }

  public info(msg: string) {
    kax.info(msg)
  }

  public warn(msg: string) {
    kax.warn(msg)
  }

  public error(msg: string) {
    kax.error(msg)
  }
}
