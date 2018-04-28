import { Argv } from 'yargs'

import { Platform, utils as coreUtils } from 'ern-core'
import utils from '../../lib/utils'

export const command = 'uninstall <version>'
export const desc = 'Uninstall a given platform version'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = ({ version }: { version: string }) => {
  try {
    Platform.uninstallPlatform(version.toString().replace('v', ''))
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
