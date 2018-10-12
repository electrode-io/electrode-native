import { MiniApp, Platform, utils as coreUtils, log } from 'ern-core'
import { epilog } from '../lib'
import { Argv } from 'yargs'

export const command = 'upgrade-miniapp'
export const desc = 'Upgrade a MiniApp to current or specific platform version'

export const builder = (argv: Argv) => {
  return argv
    .option('version', {
      alias: 'v',
      describe: 'Specific platform version to upgrade MiniApp to',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const handler = ({
  version = Platform.currentVersion,
  force = false,
}: {
  version: string
  force: boolean
}) => {
  try {
    const miniApp = MiniApp.fromCurrentPath()
    const versionWithoutPrefix = version.toString().replace('v', '')
    miniApp.upgradeToPlatformVersion(versionWithoutPrefix)
    log.info('MiniApp upgraded successfully')
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
