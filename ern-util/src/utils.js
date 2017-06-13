import shell from 'shelljs'
import chalk from 'chalk'

export default class Utils {
  // Shell error helper
  static throwIfShellCommandFailed () {
    const shellError = shell.error()
    if (shellError) {
      throw new Error(shellError)
    }
  }

  static logErrorAndExitProcess (message: string) {
    log.error(chalk.red(message))
    process.exit(1)
  }
}
