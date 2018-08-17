import { utils as coreUtils, log, Platform } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'
import semver from 'semver'

export const command = 'ernversion'
export const desc =
  'Update the Electrode Native version enforced by this Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('version', {
      default: Platform.currentVersion,
      describe: 'Version of Electrode Native to be enforced by the Cauldron',
      type: 'string',
    })
    .option('force', {
      default: false,
      describe: 'Force version update',
      type: 'boolean',
    })
}

export const handler = async ({
  version,
  force,
}: {
  version: string
  force: boolean
}) => {
  try {
    const cauldron = await getActiveCauldron({
      ignoreElectrodeNativeVersionMismatch: true,
    })
    if (!cauldron) {
      throw new Error('A Cauldron must be active in order to use this command')
    }

    if (version === 'none') {
      await cauldron.setElectrodeNativeVersion()
      return log.info(
        'Removed Electrode Native version enforcement from Cauldron'
      )
    }

    if (!Platform.isPlatformVersionAvailable(version) && !force) {
      throw new Error(
        `${version} is not an available Electrode Native version.
If you know what you're doing and want to use this version anyway, you can run the command again with the --force flag`
      )
    }

    const currentErnVersionEnforcedByCauldron = await cauldron.getElectrodeNativeVersion()
    if (
      currentErnVersionEnforcedByCauldron &&
      semver.lt(version, currentErnVersionEnforcedByCauldron) &&
      !force
    ) {
      throw new Error(
        `${version} is lower than current version ${currentErnVersionEnforcedByCauldron}.
  It is only possible to update the enforced version to a version greater than the current one.
  If you know what you're doing and want to use this version anyway, you can run the command again with the --force flag`
      )
    }

    await cauldron.setElectrodeNativeVersion(version)
    log.info(
      `Updated Electrode Native version enforced by the Cauldron to ${version}`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
