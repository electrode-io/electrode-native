import { PackagePath, AppVersionDescriptor, log, utils } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { syncCauldronContainer } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  tryCatchWrap,
} from '../../../lib'
import _ from 'lodash'
import { Argv } from 'yargs'

export const command = 'miniapps <miniapps..>'
export const desc =
  'Update the version(s) of one or more MiniApp(s) in the Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('containerVersion', {
      alias: 'v',
      describe:
        'Version to use for generated container. If none provided, patch version will be bumped by default.',
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
    .coerce('miniapps', d => d.map(PackagePath.fromString))
    .option('targetVersion', {
      describe:
        'Target version to update all MiniApps to. Can only be used if `all` is used for MiniApps.',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  containerVersion,
  descriptor,
  fullRegen,
  miniapps,
  targetVersion,
}: {
  containerVersion?: string
  descriptor?: AppVersionDescriptor
  fullRegen?: boolean
  miniapps: PackagePath[]
  targetVersion?: string
}) => {
  descriptor =
    descriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    }))

  const cauldron = await getActiveCauldron()

  if (miniapps.length === 1 && miniapps[0].basePath === 'all') {
    if (!targetVersion) {
      throw new Error(`missing --targetVersion option`)
    }
    const x = await cauldron.getContainerMiniApps(descriptor)
    miniapps = x.map(p =>
      p.isGitPath
        ? PackagePath.fromString(`${p.basePath}#${targetVersion}`)
        : PackagePath.fromString(`${p.basePath}@${targetVersion}`)
    )
    log.info(
      `Updating all MiniApps from ${descriptor} Container to target version ${targetVersion}`
    )
  }

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
      obj: miniapps,
    },
    isValidContainerVersion: containerVersion
      ? { containerVersion }
      : undefined,
    miniAppIsInNativeApplicationVersionContainer: {
      descriptor,
      extraErrorMessage:
        'If you want to add a new MiniApp(s), use -ern cauldron add miniapps- instead',
      miniApp: miniapps,
    },
    miniAppIsInNativeApplicationVersionContainerWithDifferentVersion: {
      descriptor,
      extraErrorMessage:
        'It seems like you are trying to update a MiniApp to a version that is already the one in use.',
      miniApp: miniapps,
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot work on a non existing native application version',
    },
  })

  // Special handling for git based MiniApps
  // Indeed, if only the branch or tag a MiniApp has been updated, but the head commit SHA
  // is still the same, then we shouldn't consider the MiniApp as an updated MiniApp
  // given that it will not contain any changes at all. We should just update the branch
  // in the Cauldron, but not go through complete handling.
  const updatedMiniApps: PackagePath[] = []
  const containerMiniApps = await cauldron.getContainerMiniApps(descriptor)
  for (const miniapp of miniapps) {
    if ((await utils.isGitBranch(miniapp)) || (await utils.isGitTag(miniapp))) {
      const headCommitSha = await utils.getCommitShaOfGitBranchOrTag(miniapp)
      if (
        !containerMiniApps.some(
          m => m.basePath === miniapp.basePath && m.version === headCommitSha
        )
      ) {
        updatedMiniApps.push(miniapp)
      }
    } else {
      updatedMiniApps.push(miniapp)
    }
  }

  const cauldronCommitMessage = [
    `${
      miniapps.length === 1
        ? `Update ${miniapps[0]} MiniApp version in ${descriptor}`
        : `Update multiple MiniApps versions in ${descriptor}`
    }`,
  ]

  if (updatedMiniApps.length === 0) {
    log.info(
      'No changes to MiniApps resolved SHAs (pointing to same commit(s))'
    )
    if (fullRegen) {
      log.info('Performing regen anyway [--fullRegen]')
    } else {
      log.info(
        `Skipping Container regen.
Only updating Cauldron with new MiniApps versions.
To regenerate anyway use the --fullRegen option.`
      )
      await cauldron.beginTransaction()
      await cauldron.syncContainerMiniApps(descriptor!, miniapps)
      await cauldron.commitTransaction(cauldronCommitMessage)
      return
    }
  }

  await syncCauldronContainer(
    async () => {
      for (const miniApp of miniapps) {
        cauldronCommitMessage.push(
          `- Update ${miniApp.basePath} MiniApp version to v${miniApp.version}`
        )
      }
      await cauldron.syncContainerMiniApps(descriptor!, miniapps)
    },
    descriptor,
    cauldronCommitMessage,
    {
      containerVersion,
    }
  )
  log.info(`MiniApp(s) version(s) successfully updated in ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)
