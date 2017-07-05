// @flow

import Ora from 'ora'

// promisify ora spinner
// there is already a promise method on ora spinner, unfortunately it does
// not return the wrapped promise so that's a bit useless.
export default async function spin<T> (
  msg: string,
  prom: Promise<T>,
  options: any) : Promise<T> {
  const spinner = new Ora(options || msg)
  spinner.start()

  try {
    let result = await prom
    spinner.succeed()
    return result
  } catch (e) {
    spinner.fail(e)
    throw e
  }
}
