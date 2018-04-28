import { getActiveCauldron } from 'ern-cauldron-api'
import {
  NativeApplicationDescriptor,
  PackagePath,
  dependencyLookup,
  log,
  utils as coreUtils,
} from 'ern-core'
import utils from '../lib/utils'
import { Argv } from 'yargs'

export const command = 'why <dependency> <completeNapDescriptor>'
export const desc =
  'Why is a given native dependency included in a native application version ?'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async ({
  dependency,
  completeNapDescriptor,
}: {
  dependency: string
  completeNapDescriptor: string
}) => {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
    })

    const napDescriptor = NativeApplicationDescriptor.fromString(
      completeNapDescriptor
    )
    const cauldron = await getActiveCauldron()
    const miniApps = await cauldron.getContainerMiniApps(napDescriptor)
    log.info(`This might take a while. The more MiniApps, the longer.`)
    const result = await dependencyLookup.getMiniAppsUsingNativeDependency(
      miniApps,
      PackagePath.fromString(dependency)
    )
    if (!result || result.length === 0) {
      log.info(`${dependency} dependency is not directly used by any MiniApps`)
    } else {
      log.info(`The following MiniApp(s) are using ${dependency} dependency :`)
      for (const miniApp of result) {
        log.info(`=> ${miniApp.name}`)
      }
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
