// @flow

import ora from 'ora'

let spinner
let isSpinning = false

// promisify ora spinner
// there is already a promise method on ora spinner, unfortunately it does
// not return the wrapped promise so that's a bit useless.
export default async function spin<T> (
  text: string,
  prom: Promise<T>) : Promise<T> {
  if (spinner) {
    spinner.text = text
  } else {
    spinner = ora({
      text,
      enabled: global.ernLogLevel !== 'debug' &&
               global.ernLogLevel !== 'trace' &&
               !process.env.__ERN_TEST__
    })
  }

  if (!isSpinning) {
    spinner.start()
    isSpinning = true
  }

  try {
    let result = await prom
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
