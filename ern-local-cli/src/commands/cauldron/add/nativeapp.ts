import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils,
  log,
  kax,
} from 'ern-core'
import { CauldronHelper, getActiveCauldron } from 'ern-cauldron-api'
import inquirer from 'inquirer'
import _ from 'lodash'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'nativeapp <descriptor>'
export const desc = 'Add a native application to the cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('copyFromVersion', {
      alias: 'c',
      describe: 'Copy Cauldron data from a previous native application version',
      type: 'string',
    })
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .option('platformVersion', {
      alias: 'v',
      describe: 'Use specified platform version',
    })
    .epilog(epilog(exports))
}

export const handler = async ({
  copyFromVersion,
  descriptor,
}: {
  copyFromVersion?: string
  descriptor: NativeApplicationDescriptor
}) => {
  let cauldron
  try {
    await logErrorAndExitIfNotSatisfied({
      napDescritorDoesNotExistsInCauldron: {
        descriptor,
        extraErrorMessage:
          'This version of the native application already exist in Cauldron.',
      },
    })

    cauldron = await getActiveCauldron()
    await cauldron.beginTransaction()

    const nativeApplicationDescriptor = new NativeApplicationDescriptor(
      descriptor.name,
      descriptor.platform
    )

    let previousApps
    if (await cauldron.isDescriptorInCauldron(nativeApplicationDescriptor)) {
      previousApps = await cauldron.getDescriptor(nativeApplicationDescriptor)
    }

    await kax
      .task(`Adding ${descriptor}`)
      .run(cauldron.addDescriptor(descriptor))

    if (previousApps && previousApps.versions.length > 0) {
      const latestVersion: any = _.last(previousApps.versions)
      const latestVersionName = latestVersion.name

      if (copyFromVersion) {
        if (copyFromVersion === 'latest') {
          await kax
            .task(`Copying data over from latest version ${latestVersionName}`)
            .run(
              copyOverPreviousVersionData(descriptor, latestVersion, cauldron)
            )
        } else if (copyFromVersion === 'none') {
          log.info(
            `Skipping copy over from previous version as 'none' was specified`
          )
        } else {
          const version = _.find(
            previousApps.versions,
            v => v.name === copyFromVersion
          )
          if (!version) {
            throw new Error(
              `Could not resolve native application version to copy Cauldron data from.\nExamine current value : ${copyFromVersion}`
            )
          }
          await kax
            .task(`Copying data over from version ${copyFromVersion}`)
            .run(copyOverPreviousVersionData(descriptor, version, cauldron))
        }
      } else if (await askUserCopyPreviousVersionData(latestVersionName)) {
        await kax
          .task('Copying data over from previous version')
          .run(copyOverPreviousVersionData(descriptor, latestVersion, cauldron))
      }
    }

    await kax
      .task('Updating Cauldron')
      .run(cauldron.commitTransaction(`Add ${descriptor} native application`))
    log.info(`${descriptor} successfully added to the the Cauldron`)
  } catch (e) {
    if (cauldron) {
      await cauldron.discardTransaction()
    }
    coreUtils.logErrorAndExitProcess(e)
  }
}

async function copyOverPreviousVersionData(
  napDescriptor: NativeApplicationDescriptor,
  nativeAppVersion: any,
  cauldron: CauldronHelper
) {
  // Copy over previous native application version native dependencies
  for (const nativeDep of nativeAppVersion.container.nativeDeps) {
    await cauldron.addContainerNativeDependency(
      napDescriptor,
      PackagePath.fromString(nativeDep)
    )
  }
  // Copy over previous native application version container MiniApps
  for (const containerMiniApp of nativeAppVersion.container.miniApps) {
    await cauldron.addContainerMiniApp(
      napDescriptor,
      PackagePath.fromString(containerMiniApp)
    )
  }
  // Copy over previous yarn lock if any
  if (nativeAppVersion.yarnLocks) {
    await cauldron.setYarnLocks(napDescriptor, nativeAppVersion.yarnLocks)
  }
  // Copy over container version
  if (nativeAppVersion.containerVersion) {
    await cauldron.updateContainerVersion(
      napDescriptor,
      nativeAppVersion.containerVersion
    )
  }
  // Copy over ern version
  if (nativeAppVersion.container.ernVersion) {
    await cauldron.updateContainerErnVersion(
      napDescriptor,
      nativeAppVersion.container.ernVersion
    )
  }
}

async function askUserCopyPreviousVersionData(
  version: string
): Promise<string> {
  const { userCopyPreviousVersionData } = await inquirer.prompt(<
    inquirer.Question
  >{
    message: `Do you want to copy data from the previous version (${version}) ?`,
    name: 'userCopyPreviousVersionData',
    type: 'confirm',
  })

  return userCopyPreviousVersionData
}
