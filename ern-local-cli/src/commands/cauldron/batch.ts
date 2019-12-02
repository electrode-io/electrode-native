import { PackagePath, AppVersionDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { syncCauldronContainer } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  tryCatchWrap,
  emptyContainerIfSingleMiniApp,
} from '../../lib'
import _ from 'lodash'
import { Argv } from 'yargs'

export const command = 'batch'
export const desc =
  'Cauldron command to batch many operations as a single Cauldron update'

export const builder = (argv: Argv) => {
  return argv
    .option('addMiniapps', {
      describe: 'Adds one or more MiniApps to a native application version',
      type: 'array',
    })
    .coerce('addMiniapps', d => d.map(PackagePath.fromString))
    .option('containerVersion', {
      alias: 'v',
      describe:
        'Version to use for generated container. If none provided, current container version will be patch bumped.',
      type: 'string',
    })
    .option('delMiniapps', {
      describe: 'Remove one or more MiniApps from a native application version',
      type: 'array',
    })
    .coerce('delMiniapps', d => d.map(PackagePath.fromString))
    .option('descriptor', {
      alias: 'd',
      describe:
        'A complete native application descriptor target of the operation',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('updateMiniapps', {
      describe:
        'Update one or more MiniApps versions in a native appplication version',
      type: 'array',
    })
    .coerce('updateMiniapps', d => d.map(PackagePath.fromString))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  addMiniapps = [],
  containerVersion,

  delMiniapps = [],
  descriptor,

  updateMiniapps = [],
}: {
  addMiniapps: PackagePath[]
  containerVersion?: string

  delMiniapps: PackagePath[]
  descriptor?: AppVersionDescriptor

  updateMiniapps: PackagePath[]
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
    isSupportedMiniAppVersion: {
      obj: [...updateMiniapps, ...addMiniapps],
    },
    isValidContainerVersion: containerVersion
      ? { containerVersion }
      : undefined,
    miniAppIsInNativeApplicationVersionContainer: {
      descriptor,
      extraErrorMessage:
        'This command cannot remove MiniApp(s) that do not exist in Cauldron.',
      miniApp: [...delMiniapps, ...updateMiniapps],
    },
    miniAppIsInNativeApplicationVersionContainerWithDifferentVersion: {
      descriptor,
      extraErrorMessage:
        'It seems like you are trying to update a MiniApp to a version that is already the one in use.',
      miniApp: updateMiniapps,
    },
    miniAppNotInNativeApplicationVersionContainer: {
      descriptor,
      extraErrorMessage:
        'You cannot add MiniApp(s) that already exist yet in Cauldron. Please consider using update instead.',
      miniApp: addMiniapps,
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot work on a non existing native application version',
    },
  })

  const cauldronCommitMessage = [
    `Batch operation on ${descriptor} native application`,
  ]

  const cauldron = await getActiveCauldron()
  await syncCauldronContainer(
    async () => {
      // Del MiniApps
      for (const delMiniApp of delMiniapps) {
        if (!(await emptyContainerIfSingleMiniApp(descriptor!))) {
          await cauldron.removeMiniAppFromContainer(descriptor!, delMiniApp)
        }
        cauldronCommitMessage.push(`- Remove ${delMiniApp} MiniApp`)
      }
      // Update MiniApps
      for (const updatedMiniApp of updateMiniapps) {
        cauldronCommitMessage.push(
          `- Update ${updatedMiniApp.basePath} MiniApp version to v${
            updatedMiniApp.version
          }`
        )
      }
      // Add MiniApps
      for (const addedMiniApp of addMiniapps) {
        cauldronCommitMessage.push(`-Add ${addedMiniApp.basePath} MiniApp`)
      }

      await cauldron.syncContainerMiniApps(descriptor!, [
        ...addMiniapps,
        ...updateMiniapps,
      ])
    },
    descriptor,
    cauldronCommitMessage,
    { containerVersion }
  )
  log.info(`Batch operations were succesfully performed for ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)
