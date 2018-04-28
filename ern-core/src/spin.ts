import ora from 'ora'
import log from './log'

let spinner
let isSpinning = false

// promisify ora spinner
// there is already a promise method on ora spinner, unfortunately it does
// not return the wrapped promise so that's a bit useless.
export default async function spin<T>(
  text: string,
  prom: Promise<T>
): Promise<T> {
  if (spinner) {
    spinner.text = text
  } else {
    spinner = ora({
      enabled:
        log.level !== 'debug' &&
        log.level !== 'trace' &&
        !process.env.__ERN_TEST__,
      text,
    })
  }

  if (!isSpinning) {
    spinner.start()
    isSpinning = true
  }

  try {
    const result = await prom
    if (isSpinning) {
      spinner.succeed()
    }
    return result
  } catch (e) {
    if (isSpinning) {
      spinner.fail(e.message)
    }
    throw e
  } finally {
    isSpinning = false
  }
}
