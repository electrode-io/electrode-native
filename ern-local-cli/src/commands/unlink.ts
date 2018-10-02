import { MiniApp, utils as coreUtils } from 'ern-core'
import { epilog } from '../lib'
import { Argv } from 'yargs'

export const command = 'unlink'
export const desc = 'Unlink a MiniApp'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const handler = async () => {
  try {
    MiniApp.fromCurrentPath().unlink()
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
