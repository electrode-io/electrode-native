import {
  createTmpDir,
  PackagePath,
  AppVersionDescriptor,
  reactnative,
  CodePushPackage,
  getCodePushSdk,
  log,
  kax,
  SourceMapStoreSdk,
} from 'ern-core'
import { generateComposite } from 'ern-composite-gen'
import {
  CauldronCodePushMetadata,
  CauldronCodePushEntry,
  getActiveCauldron,
} from 'ern-cauldron-api'
import * as compatibility from './compatibility'
import _ from 'lodash'
import path from 'path'
import shell from 'shelljs'
import fs from 'fs'
import semver from 'semver'

export async function performCodePushPatch(
  napDescriptor: AppVersionDescriptor,
  deploymentName: string,
  label: string,
  {
    description,
    isDisabled,
    isMandatory,
    rollout,
  }: {
    description?: string
    isDisabled?: boolean
    isMandatory?: boolean
    rollout?: number
  } = {}
) {
  let cauldron
  try {
    cauldron = await getActiveCauldron()
    await cauldron.beginTransaction()
    const appName = await getCodePushAppName(napDescriptor)
    const codePushSdk = getCodePushSdk()
    description = description || ''
    await codePushSdk.patch(appName, deploymentName, {
      description,
      isDisabled,
      isMandatory,
      label,
      rollout,
    })
    await cauldron.updateCodePushEntry(napDescriptor, {
      deploymentName,
      description,
      isDisabled,
      isMandatory,
      label,
      rollout,
    })
    await cauldron.commitTransaction(
      `CodePush patched ${napDescriptor.toString()} ${deploymentName} ${label}`
    )
  } catch (e) {
    if (cauldron) {
      await cauldron.discardTransaction()
    }
    log.error(`[performCodePushPatch] ${e}`)
    throw e
  }
}

export async function performCodePushPromote(
  sourceNapDescriptor: AppVersionDescriptor,
  targetNapDescriptors: AppVersionDescriptor[],
  sourceDeploymentName: string,
  targetDeploymentName: string,
  {
    description,
    disableDuplicateReleaseError = false,
    force = false,
    label,
    mandatory,
    rollout,
    reuseReleaseBinaryVersion,
    targetBinaryVersion,
  }: {
    description?: string
    disableDuplicateReleaseError?: boolean
    force?: boolean
    label?: string
    mandatory?: boolean
    rollout?: number
    reuseReleaseBinaryVersion?: boolean
    targetBinaryVersion?: string
  } = {}
) {
  let cauldron
  try {
    if (reuseReleaseBinaryVersion && targetBinaryVersion) {
      throw new Error(
        `sameBinaryVersionAsRelease and targetBinaryVersion options are mutually exclusive`
      )
    }

    const codePushSdk = getCodePushSdk()
    cauldron = await getActiveCauldron()
    await cauldron.beginTransaction()
    const cauldronCommitMessage = [
      `CodePush release promotion of ${sourceNapDescriptor.toString()} ${sourceDeploymentName} to ${targetDeploymentName} of`,
    ]

    for (const targetNapDescriptor of targetNapDescriptors) {
      if (!targetNapDescriptor.version) {
        throw new Error(`Missing version in ${targetNapDescriptor.toString()}`)
      }

      let codePushEntrySource: CauldronCodePushEntry
      try {
        codePushEntrySource = await cauldron.getCodePushEntry(
          sourceNapDescriptor,
          sourceDeploymentName,
          { label }
        )
      } catch (e) {
        throw new Error(
          `No CodePush entry found in Cauldron matching [desc: ${sourceNapDescriptor} dep: ${sourceDeploymentName} label: ${label ||
            'latest'}`
        )
      }

      const miniApps = _.map(codePushEntrySource.miniapps, miniapp =>
        PackagePath.fromString(miniapp)
      )
      const jsApiImpls = _.map(codePushEntrySource.jsApiImpls, jsapiimpl =>
        PackagePath.fromString(jsapiimpl)
      )

      const nativeDependenciesVersionAligned = await compatibility.areCompatible(
        miniApps,
        targetNapDescriptor
      )

      if (!nativeDependenciesVersionAligned && force) {
        log.warn(
          'Native dependencies versions are not aligned but ignoring due to the use of force flag'
        )
      } else if (!nativeDependenciesVersionAligned && !force) {
        throw new Error(
          'Native dependencies versions of MiniApps are not aligned. Relaunch the operation with the force flag if you wish to ignore.'
        )
      }

      const appName = await getCodePushAppName(sourceNapDescriptor)
      targetBinaryVersion = targetBinaryVersion
        ? targetBinaryVersion
        : reuseReleaseBinaryVersion
        ? codePushEntrySource.metadata.appVersion
        : await buildCodePushTargetBinaryVersion(
            targetNapDescriptor,
            targetDeploymentName
          )

      description = description || ''
      const codePushResponse: CodePushPackage | void = await kax
        .task(`Promoting release to ${targetBinaryVersion}`)
        .run(
          codePushSdk.promote(
            appName,
            sourceDeploymentName,
            targetDeploymentName,
            {
              appVersion: targetBinaryVersion,
              description,
              isMandatory: !!mandatory,
              label,
              rollout,
            },
            disableDuplicateReleaseError
          )
        )

      if (codePushResponse) {
        const sourceYarnLockId = await cauldron.getYarnLockId(
          sourceNapDescriptor,
          sourceDeploymentName
        )
        if (!sourceYarnLockId) {
          log.error(
            `No yarn.lock was found in source deployment [${sourceDeploymentName} for ${sourceNapDescriptor.toString()}]`
          )
          log.error(`Skipping promotion to ${targetNapDescriptor.toString()}`)
          continue
        }
        await cauldron.updateYarnLockId(
          targetNapDescriptor,
          targetDeploymentName,
          sourceYarnLockId
        )

        await cauldron.addCodePushEntry(
          targetNapDescriptor,
          {
            appVersion: codePushResponse.appVersion,
            deploymentName: targetDeploymentName,
            description: codePushResponse.description,
            isMandatory: codePushResponse.isMandatory,
            label: codePushResponse.label,
            promotedFromLabel: codePushEntrySource.metadata.label,
            releaseMethod: codePushResponse.releaseMethod,
            releasedBy: codePushResponse.releasedBy,
            rollout: codePushResponse.rollout,
            size: codePushResponse.size,
          },
          miniApps,
          jsApiImpls || []
        )

        // Copy source map if a source map store server is configured
        const sourcemapStoreConfig = await cauldron.getSourceMapStoreConfig()
        if (sourcemapStoreConfig) {
          try {
            const sdk = new SourceMapStoreSdk(sourcemapStoreConfig.url)
            await kax
              .task(
                `Copying source map in source map store [${
                  sourcemapStoreConfig.url
                }]`
              )
              .run(
                sdk.copyCodePushSourceMap({
                  deploymentName: sourceDeploymentName,
                  descriptor: sourceNapDescriptor,
                  label: codePushEntrySource.metadata.label!,
                  toDeploymentName: targetDeploymentName,
                  toLabel: codePushResponse.label!,
                  toVersion: targetNapDescriptor.version,
                })
              )
          } catch (e) {
            log.error(`Source map copy failed : ${e}`)
          }
        }

        cauldronCommitMessage.push(`- ${targetNapDescriptor.toString()}`)
      }
      await kax
        .task('Updating Cauldron')
        .run(cauldron.commitTransaction(cauldronCommitMessage))
    }
  } catch (e) {
    if (cauldron) {
      await cauldron.discardTransaction()
    }
    log.error(`[performCodePushPromote] ${e}`)
    throw e
  }
}

export async function performCodePushOtaUpdate(
  napDescriptor: AppVersionDescriptor,
  deploymentName: string,
  miniApps: PackagePath[],
  jsApiImpls: PackagePath[],
  {
    baseComposite,
    codePushIsMandatoryRelease = false,
    codePushRolloutPercentage,
    description,
    disableDuplicateReleaseError = false,
    force = false,
    pathToYarnLock,
    sourceMapOutput,
    targetBinaryVersion,
  }: {
    baseComposite?: PackagePath
    codePushIsMandatoryRelease?: boolean
    codePushRolloutPercentage?: number
    description?: string
    disableDuplicateReleaseError?: boolean
    force?: boolean
    pathToYarnLock?: string
    sourceMapOutput?: string
    targetBinaryVersion?: string
  } = {}
) {
  let cauldron
  try {
    const codePushSdk = getCodePushSdk()
    cauldron = await getActiveCauldron()
    const plugins = await cauldron.getNativeDependencies(napDescriptor)
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      napDescriptor
    )
    baseComposite =
      baseComposite || (compositeGenConfig && compositeGenConfig.baseComposite)
    await cauldron.beginTransaction()
    const codePushPlugin = _.find(
      plugins,
      p => p.basePath === 'react-native-code-push'
    )
    if (!codePushPlugin) {
      throw new Error('react-native-code-push plugin is not in native app !')
    }

    const tmpWorkingDir = createTmpDir()

    const miniAppsNativeDependenciesVersionAligned = await compatibility.areCompatible(
      miniApps,
      napDescriptor
    )

    if (!miniAppsNativeDependenciesVersionAligned && force) {
      log.warn(
        'Native dependencies versions of MiniApps are not aligned but ignoring due to the use of force flag'
      )
    } else if (!miniAppsNativeDependenciesVersionAligned && !force) {
      throw new Error(
        'Native dependencies versions of MiniApps are not aligned. Relaunch the operation with the force flag if you wish to ignore.'
      )
    }

    const latestCodePushedMiniApps = await cauldron.getCodePushMiniApps(
      napDescriptor,
      deploymentName
    )
    const latestCodePushedJsApiImpls = await cauldron.getCodePushJsApiImpls(
      napDescriptor,
      deploymentName
    )

    // We need to include, in this CodePush bundle, all the MiniApps and JS API implementations that were part
    // of the previous CodePush. We will override versions of the MiniApps and JS API implementations with
    // the one provided to this function, and keep other ones intact.
    // For example, if previous CodePush bundle was containing MiniAppOne@1.0.0 and
    // MiniAppTwo@1.0.0 and this method is called to CodePush MiniAppOne@2.0.0, then
    // the bundle we will push will container MiniAppOne@2.0.0 and MiniAppTwo@1.0.0.
    // If this the first ever CodePush bundle for this specific native application version
    // then the reference miniapp versions are the one from the container.
    let referenceMiniAppsToCodePush = latestCodePushedMiniApps
    if (
      !referenceMiniAppsToCodePush ||
      referenceMiniAppsToCodePush.length === 0
    ) {
      referenceMiniAppsToCodePush = await cauldron.getContainerMiniApps(
        napDescriptor
      )
    }

    let referenceJsApiImplsToCodePush = latestCodePushedJsApiImpls
    if (
      !referenceJsApiImplsToCodePush ||
      referenceJsApiImplsToCodePush.length === 0
    ) {
      referenceJsApiImplsToCodePush = await cauldron.getContainerJsApiImpls(
        napDescriptor
      )
    }

    const miniAppsToBeCodePushed = _.unionBy(
      miniApps,
      referenceMiniAppsToCodePush,
      x => x.basePath
    )

    const jsApiImplsToBeCodePushed = _.unionBy(
      jsApiImpls,
      referenceJsApiImplsToCodePush,
      x => x.basePath
    )

    const pathsToMiniAppsToBeCodePushed = _.map(miniAppsToBeCodePushed, m =>
      PackagePath.fromString(m.toString())
    )
    const pathToJsApiImplsToBeCodePushed = _.map(jsApiImplsToBeCodePushed, j =>
      PackagePath.fromString(j.toString())
    )

    const codePushConfig = await cauldron.getCodePushConfig(napDescriptor)
    if (codePushConfig && codePushConfig.bypassYarnLock) {
      pathToYarnLock = undefined
      log.debug(
        'Bypassing yarn.lock usage as bypassYarnLock flag is set in Cauldron config'
      )
    }

    await kax.task('Generating composite module').run(
      generateComposite({
        baseComposite,
        jsApiImplDependencies: pathToJsApiImplsToBeCodePushed,
        miniApps: pathsToMiniAppsToBeCodePushed,
        outDir: tmpWorkingDir,
        pathToYarnLock,
        resolutions: compositeGenConfig && compositeGenConfig.resolutions,
      })
    )

    const bundleOutputDirectory = path.join(tmpWorkingDir, 'bundleOut')
    shell.mkdir('-p', bundleOutputDirectory)
    const platform = napDescriptor.platform || ''
    const bundleOutputPath =
      platform === 'android'
        ? path.join(bundleOutputDirectory, 'index.android.bundle')
        : path.join(bundleOutputDirectory, 'MiniApp.jsbundle')

    sourceMapOutput = sourceMapOutput || path.join(createTmpDir(), 'index.map')
    await kax.task('Generating composite bundle for miniapps').run(
      reactnative.bundle({
        assetsDest: bundleOutputDirectory,
        bundleOutput: bundleOutputPath,
        dev: false,
        entryFile: `index.${platform}.js`,
        platform,
        sourceMapOutput,
        workingDir: tmpWorkingDir,
      })
    )

    const appName = await getCodePushAppName(napDescriptor)

    targetBinaryVersion =
      targetBinaryVersion ||
      (await buildCodePushTargetBinaryVersion(napDescriptor, deploymentName))

    log.info(`Target Binary version : ${targetBinaryVersion}`)
    description = description || ''
    const codePushResponse: CodePushPackage | void = await kax
      .task('Releasing bundle through CodePush')
      .run(
        codePushSdk.releaseReact(
          appName,
          deploymentName,
          bundleOutputDirectory,
          targetBinaryVersion,
          {
            description,
            isMandatory: codePushIsMandatoryRelease,
            rollout: codePushRolloutPercentage,
          },
          disableDuplicateReleaseError
        )
      )
    if (codePushResponse) {
      await cauldron.addCodePushEntry(
        napDescriptor,
        {
          appVersion: codePushResponse.appVersion,
          deploymentName,
          description: codePushResponse.description,
          isMandatory: codePushResponse.isMandatory,
          label: codePushResponse.label,
          releaseMethod: codePushResponse.releaseMethod,
          releasedBy: codePushResponse.releasedBy,
          rollout: codePushResponse.rollout,
          size: codePushResponse.size,
        },
        miniAppsToBeCodePushed,
        jsApiImplsToBeCodePushed
      )

      const pathToNewYarnLock = path.join(tmpWorkingDir, 'yarn.lock')
      if (fs.existsSync(pathToNewYarnLock)) {
        await kax
          .task('Adding yarn.lock to Cauldron')
          .run(
            cauldron.addOrUpdateYarnLock(
              napDescriptor,
              deploymentName,
              pathToNewYarnLock
            )
          )
      }

      // Upload source map if a source map store server is configured
      const sourcemapStoreConfig = await cauldron.getSourceMapStoreConfig()
      if (sourcemapStoreConfig) {
        try {
          const sdk = new SourceMapStoreSdk(sourcemapStoreConfig.url)
          await kax
            .task(
              `Uploading source map to source map store [${
                sourcemapStoreConfig.url
              }]`
            )
            .run(
              sdk.uploadCodePushSourceMap({
                deploymentName,
                descriptor: napDescriptor,
                label: codePushResponse.label!,
                sourceMapPath: sourceMapOutput,
              })
            )
        } catch (e) {
          log.error(`Source map upload failed : ${e}`)
        }
      }

      await cauldron.commitTransaction(
        `CodePush release for ${napDescriptor.toString()} ${deploymentName}`
      )
    }
  } catch (e) {
    if (cauldron) {
      await cauldron.discardTransaction()
    }
    log.error(`performCodePushOtaUpdate {e}`)

    throw e
  }
}

export async function buildCodePushTargetBinaryVersion(
  napDescriptor: AppVersionDescriptor,
  deploymentName: string
) {
  if (!napDescriptor.version) {
    throw new Error(
      `Native application descriptor ${napDescriptor} does not contain a version !`
    )
  }
  let targetBinaryVersion = napDescriptor.version
  const cauldron = await getActiveCauldron()
  const codePushConfig = await cauldron.getCodePushConfig(napDescriptor)
  if (codePushConfig) {
    const { versionModifiers, trimZeroPatchDigit } = codePushConfig
    targetBinaryVersion = versionModifiers
      ? applyVersionModifiers({
          deploymentName,
          targetBinaryVersion,
          versionModifiers,
        })
      : targetBinaryVersion
    targetBinaryVersion =
      trimZeroPatchDigit &&
      semver.valid(targetBinaryVersion) &&
      semver.patch(targetBinaryVersion) === 0
        ? removeZeroPatchDigit({
            targetBinaryVersion,
          })
        : targetBinaryVersion
  }

  return targetBinaryVersion
}

export function applyVersionModifiers({
  deploymentName,
  targetBinaryVersion,
  versionModifiers,
}: {
  deploymentName: string
  targetBinaryVersion: string
  versionModifiers: Array<{ deploymentName: string; modifier: string }>
}): string {
  const versionModifier = _.find(
    versionModifiers,
    m => m.deploymentName === deploymentName
  )
  return versionModifier
    ? targetBinaryVersion.replace(/(.+)/, versionModifier.modifier)
    : targetBinaryVersion
}

export function removeZeroPatchDigit({
  targetBinaryVersion,
}: {
  targetBinaryVersion: string
}) {
  return semver.prerelease(targetBinaryVersion)
    ? `${semver.major(targetBinaryVersion)}.${semver.minor(
        targetBinaryVersion
      )}-${semver.prerelease(targetBinaryVersion)!.join('.')}`
    : `${semver.major(targetBinaryVersion)}.${semver.minor(
        targetBinaryVersion
      )}`
}

export async function getCodePushAppName(
  napDescriptor: AppVersionDescriptor
): Promise<string> {
  let result = napDescriptor.name
  const cauldron = await getActiveCauldron()
  const codePushConfig = await cauldron.getCodePushConfig(napDescriptor)
  if (codePushConfig && codePushConfig.appName) {
    result = codePushConfig.appName
  } else {
    result = `${napDescriptor.name}${
      napDescriptor.platform === 'ios' ? 'Ios' : 'Android'
    }`
  }
  return result
}
