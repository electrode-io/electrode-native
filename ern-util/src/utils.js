export default class Utils {
  static logErrorAndExitProcess (e: Error, code?: number = 1) {
    log.error(`An error occurred: ${e.message}`)
    log.debug(e)
    process.exit(code)
  }
}
