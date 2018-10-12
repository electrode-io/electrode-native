import { MiniApp, Platform, log } from 'ern-core'
import { epilog, tryCatchWrap } from '../lib'
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

export const commandHandler = async ({
  version = Platform.currentVersion,
}: {
  version: string
}) => {
  const miniApp = MiniApp.fromCurrentPath()
  const versionWithoutPrefix = version.toString().replace('v', '')
  miniApp.upgradeToPlatformVersion(versionWithoutPrefix)
  log.info('MiniApp upgraded successfully')
}

export const handler = tryCatchWrap(commandHandler)
