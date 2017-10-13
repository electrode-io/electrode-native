import chalk from 'chalk'

export default class Utils {
  static logErrorAndExitProcess (message: string) {
    log.error(chalk.red(message))
    process.exit(1)
  }
}
