import { generateMiniAppsComposite } from 'ern-container-gen'
import {
  createTmpDir,
  CodePushSdk,
  PackagePath,
  config,
  NativeApplicationDescriptor,
  reactnative,
  CodePushPackage,
  CodePushInitConfig,
  log,
  MiniApp,
  kax,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import * as compatibility from './compatibility'
import inquirer from 'inquirer'
import _ from 'lodash'
import path from 'path'
import fs from 'fs'
import shell from 'shelljs'

export async function performCodePushPatch(
  napDescriptor: NativeApplicationDescriptor,
  deploymentName: string,
  label: string,
  {
    isDisabled,
    isMandatory,
    rollout,
  }: {
    isDisabled?: boolean
    isMandatory?: boolean
    rollout?: number
  }
) {
  let cauldron
  try {
    cauldron = await getActiveCauldron()
    const codePushSdk = getCodePushSdk()
    await cauldron.beginTransaction()
    const appName = await getCodePushAppName(napDescriptor)
    await codePushSdk.patch(appName, deploymentName, label, {
      isDisabled,
      isMandatory,
      rollout,
    })
    await cauldron.updateCodePushEntry(napDescriptor, deploymentName, label, {
      isDisabled,
      isMandatory,
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
  sourceNapDescriptor: NativeApplicationDescriptor,
  targetNapDescriptors: NativeApplicationDescriptor[],
  sourceDeploymentName: string,
  targetDeploymentName: string,
  {
    force = false,
    mandatory,
    rollout,
    label,
    targetBinaryVersion,
  }: {
    force?: boolean
    mandatory?: boolean
    rollout?: number
    label?: string
    targetBinaryVersion?: string
  } = {}
) {
  let cauldron
  try {
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

      const codePushEntrySource = await cauldron.getCodePushEntry(
        sourceNapDescriptor,
        sourceDeploymentName,
        { label }
      )
      if (!codePushEntrySource) {
        throw new Error(
          `No CodePush entry found in Cauldron matching [desc: ${sourceNapDescriptor.toString()} dep: ${sourceDeploymentName} label: ${label ||
            'latest'}`
        )
      }

      const miniApps = _.map(codePushEntrySource.miniapps, miniapp =>
        PackagePath.fromString(miniapp)
      )
      const jsApiImpls = _.map(codePushEntrySource.jsApiImpls, jsapiimpl =>
        PackagePath.fromString(jsapiimpl)
      )
      if (
        (!miniApps || miniApps.length === 0) &&
        (!jsApiImpls || jsApiImpls.length === 0)
      ) {
        log.error(
          `No MiniApps or JS API Implementations were found in source release [${sourceDeploymentName} for ${sourceNapDescriptor.toString()}] `
        )
        throw new Error(`Aborting CodePush promotion`)
      }

      const nativeDependenciesVersionAligned = await areMiniAppsNativeDependenciesAlignedWithTargetApplicationVersion(
        miniApps,
        targetNapDescriptor
      )

      if (!nativeDependenciesVersionAligned && force) {
        log.warn(
          'Native dependencies versions are not aligned but ignoring due to the use of force flag'
        )
      } else if (!nativeDependenciesVersionAligned && !force) {
        if (!(await askUserToForceCodePushPublication())) {
          return log.info('CodePush promotion aborted')
        }
      }

      const appName = await getCodePushAppName(sourceNapDescriptor)
      const appVersion =
        targetBinaryVersion ||
        (await getCodePushTargetVersionName(
          targetNapDescriptor,
          targetDeploymentName
        ))
      const result = await kax.task(`Promoting release to ${appVersion}`).run(
        codePushSdk.promote(
          appName,
          sourceDeploymentName,
          targetDeploymentName,
          {
            appVersion,
            isMandatory: mandatory,
            label,
            rollout,
          }
        )
      )

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
          appVersion: result.appVersion,
          deploymentName: targetDeploymentName,
          isMandatory: result.isMandatory,
          label: result.label,
          promotedFromLabel: codePushEntrySource.metadata.label,
          releaseMethod: result.releaseMethod,
          releasedBy: result.releasedBy,
          rollout: result.rollout,
          size: result.size,
        },
        miniApps,
        jsApiImpls || []
      )

      cauldronCommitMessage.push(`- ${targetNapDescriptor.toString()}`)
    }
    await kax
      .task('Updating Cauldron')
      .run(cauldron.commitTransaction(cauldronCommitMessage))
  } catch (e) {
    if (cauldron) {
      await cauldron.discardTransaction()
    }
    log.error(`[performCodePushPromote] ${e}`)
    throw e
  }
}

export async function performCodePushOtaUpdate(
  napDescriptor: NativeApplicationDescriptor,
  deploymentName: string,
  miniApps: PackagePath[],
  jsApiImpls: PackagePath[],
  {
    force = false,
    codePushIsMandatoryRelease = false,
    codePushRolloutPercentage,
    pathToYarnLock,
    skipConfirmation = false,
    targetBinaryVersion,
  }: {
    force: boolean
    codePushIsMandatoryRelease?: boolean
    codePushRolloutPercentage?: number
    pathToYarnLock?: string
    skipConfirmation?: boolean
    targetBinaryVersion?: string
  }
) {
  let cauldron
  try {
    const codePushSdk = getCodePushSdk()
    cauldron = await getActiveCauldron()
    const plugins = await cauldron.getNativeDependencies(napDescriptor)
    await cauldron.beginTransaction()
    const codePushPlugin = _.find(
      plugins,
      p => p.basePath === 'react-native-code-push'
    )
    if (!codePushPlugin) {
      throw new Error('react-native-code-push plugin is not in native app !')
    }

    const tmpWorkingDir = createTmpDir()

    const miniAppsNativeDependenciesVersionAligned = await areMiniAppsNativeDependenciesAlignedWithTargetApplicationVersion(
      miniApps,
      napDescriptor
    )

    if (!miniAppsNativeDependenciesVersionAligned && force) {
      log.warn(
        'Native dependencies versions of MiniApps are not aligned but ignoring due to the use of force flag'
      )
    } else if (!miniAppsNativeDependenciesVersionAligned && !force) {
      if (!(await askUserToForceCodePushPublication())) {
        throw new Error('CodePush publication aborted')
      }
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

    // If force or skipFinalConfirmation was not provided as option, we ask user for confirmation before proceeding
    // with code-push publication
    const userConfirmedCodePushPublication =
      force ||
      skipConfirmation ||
      (await askUserToConfirmCodePushPublication(
        miniAppsToBeCodePushed,
        jsApiImplsToBeCodePushed
      ))

    if (!userConfirmedCodePushPublication) {
      return log.info('CodePush publication aborted')
    } else {
      log.info('Getting things ready for CodePush publication')
    }

    const pathsToMiniAppsToBeCodePushed = _.map(miniAppsToBeCodePushed, m =>
      PackagePath.fromString(m.toString())
    )
    const pathToJsApiImplsToBeCodePushed = _.map(jsApiImplsToBeCodePushed, j =>
      PackagePath.fromString(j.toString())
    )

    await kax
      .task('Generating composite module')
      .run(
        generateMiniAppsComposite(
          pathsToMiniAppsToBeCodePushed,
          tmpWorkingDir,
          { pathToYarnLock },
          pathToJsApiImplsToBeCodePushed
        )
      )

    const bundleOutputDirectory = path.join(tmpWorkingDir, 'bundleOut')
    shell.mkdir('-p', bundleOutputDirectory)
    const platform = napDescriptor.platform || ''
    const bundleOutputPath =
      platform === 'android'
        ? path.join(bundleOutputDirectory, 'index.android.bundle')
        : path.join(bundleOutputDirectory, 'MiniApp.jsbundle')

    await kax.task('Generating composite bundle for miniapps').run(
      reactnative.bundle({
        assetsDest: bundleOutputDirectory,
        bundleOutput: bundleOutputPath,
        dev: false,
        entryFile: `index.${platform}.js`,
        platform,
      })
    )

    const appName = await getCodePushAppName(napDescriptor)

    const targetVersionName =
      targetBinaryVersion ||
      (await getCodePushTargetVersionName(napDescriptor, deploymentName))

    log.info(`Target Binary version : ${targetVersionName}`)

    const codePushResponse: CodePushPackage = await kax
      .task('Releasing bundle through CodePush')
      .run(
        codePushSdk.releaseReact(
          appName,
          deploymentName,
          bundleOutputDirectory,
          targetVersionName,
          {
            isMandatory: codePushIsMandatoryRelease,
            rollout: codePushRolloutPercentage,
          }
        )
      )

    await cauldron.addCodePushEntry(
      napDescriptor,
      {
        appVersion: codePushResponse.appVersion,
        deploymentName,
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
    await kax
      .task('Adding yarn.lock to Cauldron')
      .run(
        cauldron.addOrUpdateYarnLock(
          napDescriptor,
          deploymentName,
          pathToNewYarnLock
        )
      )
    await cauldron.commitTransaction(
      `CodePush release for ${napDescriptor.toString()} ${deploymentName}`
    )
  } catch (e) {
    if (cauldron) {
      await cauldron.discardTransaction()
    }
    log.error(`performCodePushOtaUpdate {e}`)
    throw e
  }
}

export async function getCodePushTargetVersionName(
  napDescriptor: NativeApplicationDescriptor,
  deploymentName: string
) {
  if (!napDescriptor.version) {
    throw new Error(
      `Native application descriptor ${napDescriptor.toString()} does not contain a version !`
    )
  }
  let result = napDescriptor.version
  const cauldron = await getActiveCauldron()
  const codePushConfig = await cauldron.getCodePushConfig(
    napDescriptor.withoutVersion()
  )
  if (codePushConfig && codePushConfig.versionModifiers) {
    const versionModifier = _.find(
      codePushConfig.versionModifiers,
      m => m.deploymentName === deploymentName
    )
    if (versionModifier) {
      result = result.replace(/(.+)/, versionModifier.modifier)
    }
  }
  return result
}

async function getCodePushAppName(
  napDescriptor: NativeApplicationDescriptor
): Promise<string> {
  let result = napDescriptor.name
  const cauldron = await getActiveCauldron()
  const codePushConfig = await cauldron.getCodePushConfig(
    napDescriptor.withoutVersion()
  )
  if (codePushConfig && codePushConfig.appName) {
    result = codePushConfig.appName
  } else {
    result = `${napDescriptor.name}${
      napDescriptor.platform === 'ios' ? 'Ios' : 'Android'
    }`
  }
  return result
}

export function getCodePushInitConfig(): CodePushInitConfig {
  const codePushConfigFilePath = path.join(
    process.env.LOCALAPPDATA || process.env.HOME || '',
    '.code-push.config'
  )
  let codePushInitConfig: CodePushInitConfig
  if (fs.existsSync(codePushConfigFilePath)) {
    codePushInitConfig = JSON.parse(
      fs.readFileSync(codePushConfigFilePath, 'utf-8')
    )
  } else {
    codePushInitConfig = {
      accessKey: config.getValue('codePushAccessKey'),
      customHeaders: config.getValue('codePushCustomHeaders'),
      customServerUrl: config.getValue('codePushCustomServerUrl'),
      proxy: config.getValue('codePushproxy'),
    }
  }
  return codePushInitConfig
}

export function getCodePushSdk() {
  const codePushInitConfig = getCodePushInitConfig()
  if (!codePushInitConfig || !codePushInitConfig.accessKey) {
    throw new Error('Unable to get the CodePush config to use')
  }
  return new CodePushSdk(codePushInitConfig)
}

async function askUserToConfirmCodePushPublication(
  miniAppsToBeCodePushed: PackagePath[],
  jsApiImplsToBeCodePushed: PackagePath[]
): Promise<boolean> {
  if (miniAppsToBeCodePushed && miniAppsToBeCodePushed.length > 0) {
    log.info(
      `The following MiniApp versions will get shipped in this CodePush OTA update :`
    )
    miniAppsToBeCodePushed.forEach(m => log.info(m.toString()))
  }
  if (jsApiImplsToBeCodePushed && jsApiImplsToBeCodePushed.length > 0) {
    log.info(
      `The following JS API implementation versions will get shipped in this CodePush OTA update :`
    )
    jsApiImplsToBeCodePushed.forEach(m => log.info(m.toString()))
  }

  const { userCodePushPublicationConfirmation } = await inquirer.prompt(<
    inquirer.Question
  >{
    message: 'Do you want to continue with CodePush publication ?',
    name: 'userCodePushPublicationConfirmation',
    type: 'confirm',
  })

  return userCodePushPublicationConfirmation
}

async function askUserToForceCodePushPublication(): Promise<boolean> {
  const { userCodePushForcePublication } = await inquirer.prompt(<
    inquirer.Question
  >{
    message:
      'At least one native dependency version is not properly aligned. Do you want to force CodePush anyway ?',
    name: 'userCodePushForcePublication',
    type: 'confirm',
  })

  return userCodePushForcePublication
}

export async function askUserForCodePushDeploymentName(
  napDescriptor: NativeApplicationDescriptor,
  message?: string
): Promise<string> {
  const cauldron = await getActiveCauldron()
  const conf = await cauldron.getConfig(napDescriptor)
  const hasCodePushDeploymentsConfig =
    conf && conf.codePush && conf.codePush.deployments
  const choices = hasCodePushDeploymentsConfig
    ? conf && conf.codePush.deployments
    : undefined

  const { userSelectedDeploymentName } = await inquirer.prompt(<
    inquirer.Question
  >{
    choices,
    message: message || 'Deployment name',
    name: 'userSelectedDeploymentName',
    type: choices ? 'list' : 'input',
  })

  return userSelectedDeploymentName
}

async function areMiniAppsNativeDependenciesAlignedWithTargetApplicationVersion(
  miniApps: PackagePath[],
  targetDescriptor: NativeApplicationDescriptor
): Promise<boolean> {
  for (const miniApp of miniApps) {
    const miniAppInstance = await kax
      .task(
        `Checking native dependencies version alignment of ${miniApp.toString()} with ${targetDescriptor.toString()}`
      )
      .run(MiniApp.fromPackagePath(new PackagePath(miniApp.toString())))
    const report = await compatibility.checkCompatibilityWithNativeApp(
      miniAppInstance,
      targetDescriptor.name,
      targetDescriptor.platform || undefined,
      targetDescriptor.version || undefined
    )
    if (!report.isCompatible) {
      log.warn('At least one native dependency version is not aligned !')
      return false
    } else {
      log.info(
        `${miniApp.toString()} native dependencies versions are aligned with ${targetDescriptor.toString()}`
      )
    }
  }
  return true
}
