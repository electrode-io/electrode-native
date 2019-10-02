import { AppVersionDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { syncCauldronContainer } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  tryCatchWrap,
} from '../../lib'
import _ from 'lodash'
import { Argv } from 'yargs'
import untildify from 'untildify'

export const command = 'regen-container'
export const desc = 'Triggers the regeneration of a Container from the Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('containerVersion', {
      alias: 'v',
      describe:
        'Version to use for generated container. If none provided, version will be patched bumped by default.',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe: 'A complete native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('fullRegen', {
      describe: 'Perform complete regeneration',
      type: 'boolean',
    })
    .option('sourceMapOutput', {
      describe: 'Path to source map file to generate for this container bundle',
      type: 'string',
    })
    .coerce('sourceMapOutput', p => untildify(p))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  containerVersion,
  descriptor,
  fullRegen,
  sourceMapOutput,
}: {
  containerVersion?: string
  descriptor?: AppVersionDescriptor
  fullRegen?: boolean
  sourceMapOutput?: string
}) => {
  descriptor =
    descriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    }))

  await logErrorAndExitIfNotSatisfied({
    isNewerContainerVersion: containerVersion
      ? {
          containerVersion,
          descriptor,
          extraErrorMessage:
            'To avoid conflicts with previous versions, you can only use container version newer than the current one',
        }
      : undefined,
    isValidContainerVersion: containerVersion
      ? { containerVersion }
      : undefined,
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot work on a non existing native application version',
    },
  })

  const cauldron = await getActiveCauldron()

  // Figure out the list of all git MiniApps that have been updated (new HEAD sha)
  const updatedGitMiniApps = await cauldron.getLatestShasForMiniAppsBranches(
    descriptor
  )

  if (updatedGitMiniApps.length === 0) {
    log.info('No Changes ...')
    if (fullRegen) {
      log.info('Performing regen anyway [--fullRegen]')
    } else {
      log.info('Skipping regen. To regenerate use the --fullRegen option.')
      return
    }
  }

  await syncCauldronContainer(
    async () => {
      for (const updatedGitMiniApp of updatedGitMiniApps) {
        await cauldron.updateMiniAppVersionInContainer(
          descriptor!,
          updatedGitMiniApp,
          { keepBranch: true }
        )
      }
    },
    descriptor,
    `Regenerate Container of ${descriptor} native application`,
    {
      containerVersion,
      sourceMapOutput,
    }
  )
  log.info(`${descriptor} container was successfully regenerated`)
}

export const handler = tryCatchWrap(commandHandler)
