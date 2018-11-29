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
    if (level !== 'off') {
      this.log = require('console-log-level')({
        level,
      })
    }
  }

  get level(): string {
    return this.pLevel
  }

  public trace(msg: string) {
    if (this.pLevel !== 'off') {
      this.log.trace(chalk.gray(msg))
    }
  }

  public debug(msg: string) {
    if (this.pLevel !== 'off') {
      this.log.debug(chalk.green(msg))
    }
  }

  public info(msg: string) {
    if (this.pLevel !== 'off') {
      kax.info(msg)
    }
  }

  public warn(msg: string) {
    if (this.pLevel !== 'off') {
      kax.warn(msg)
    }
  }

  public error(msg: string) {
    if (this.pLevel !== 'off') {
      kax.error(msg)
    }
  }
}
