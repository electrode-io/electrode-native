import {
  getDefaultMavenLocalDirectory,
  kax,
  log,
  MiniApp,
  NativePlatform,
  PackagePath,
  Platform,
  reactnative,
  shell,
  utils,
  AppVersionDescriptor,
  YarnLockParser,
} from 'ern-core'
import { publishContainer } from 'ern-container-publisher'
import { getActiveCauldron } from 'ern-cauldron-api'
import { RunnerGeneratorConfig } from 'ern-runner-gen'
import { getRunnerGeneratorForPlatform } from './getRunnerGeneratorForPlatform'
import { generateContainerForRunner } from './generateContainerForRunner'
import { launchRunner } from './launchRunner'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'

export async function runMiniApp(
  platform: NativePlatform,
  {
    baseComposite,
    mainMiniAppName,
    miniapps,
    jsApiImpls,
    dependencies,
    descriptor,
    dev,
    host,
    port,
    extra,
    cwd,
  }: {
    baseComposite?: PackagePath
    mainMiniAppName?: string
    miniapps?: PackagePath[]
    jsApiImpls?: PackagePath[]
    dependencies?: PackagePath[]
    descriptor?: string | AppVersionDescriptor
    dev?: boolean
    host?: string
    port?: string
    extra?: any
    cwd?: string
  } = {}
) {
  cwd = cwd || process.cwd()

  let napDescriptor: AppVersionDescriptor | void

  if (miniapps && !MiniApp.existInPath(cwd) && !mainMiniAppName) {
    throw new Error(
      'If you run multiple MiniApps you need to provide the name of the MiniApp to launch'
    )
  }

  let jsMainModuleName
  if (MiniApp.existInPath(cwd)) {
    jsMainModuleName = fs.existsSync(path.join(cwd, `index.${platform}.js`))
      ? `index.${platform}`
      : 'index'
  }

  if (miniapps && dev) {
    dev = false
    log.warn(
      'Turning off dev mode since you are running multiple MiniApps. \nIf you want to start a packager, execute `ern start` command with all the miniapps in a separate terminal.\nCheck this link for more details: https://native.electrode.io/cli-commands/start'
    )
  }

  if (dependencies && dependencies.length > 0 && descriptor) {
    throw new Error(
      'You cannot pass extra native dependencies when using a Native Application Descriptor'
    )
  }

  if (jsApiImpls && jsApiImpls.length > 0 && descriptor) {
    throw new Error(
      'You cannot pass Javascript API implementations when using a Native Application Descriptor'
    )
  }

  if (miniapps && descriptor) {
    throw new Error('You cannot use miniapps and descriptor at the same time')
  }

  let cauldron
  if (descriptor) {
    cauldron = await getActiveCauldron()
    napDescriptor = utils.coerceToAppVersionDescriptor(descriptor)
  }

  const compositeGenConfig =
    cauldron && (await cauldron.getCompositeGeneratorConfig(napDescriptor))
  baseComposite =
    baseComposite || (compositeGenConfig && compositeGenConfig.baseComposite)

  let entryMiniAppName = mainMiniAppName || ''
  if (miniapps) {
    if (MiniApp.existInPath(cwd)) {
      const miniapp = MiniApp.fromPath(cwd)
      miniapps = miniapps.concat(PackagePath.fromString(`file:${cwd}`))
      log.debug(
        `This command is being run from the ${miniapp.name} MiniApp directory.`
      )
      log.info(
        `All extra MiniApps will be included in the Runner container along with ${
          miniapp.name
        }`
      )
      if (!mainMiniAppName) {
        log.info(`${miniapp.name} will be set as the main MiniApp`)
        log.info(
          `You can select another one instead through '--mainMiniAppName' option`
        )
        entryMiniAppName = miniapp.name
      }
    }
  } else if (!miniapps && !descriptor) {
    entryMiniAppName = MiniApp.fromCurrentPath().name
    miniapps = [PackagePath.fromString(`file:${cwd}`)]
    log.debug(
      `This command is being run from the ${entryMiniAppName} MiniApp directory.`
    )
    log.debug(`Initializing Runner`)

    if (dev) {
      await reactnative.startPackagerInNewWindow({
        cwd,
        host,
        port,
      })
    } else {
      log.info('Dev mode not enabled, will not start the packager.')
    }
  } else {
    miniapps =
      (cauldron &&
        napDescriptor &&
        (await cauldron.getContainerMiniApps(napDescriptor))) ||
      []
  }

  if (descriptor) {
    jsApiImpls =
      (cauldron &&
        napDescriptor &&
        (await cauldron.getContainerJsApiImpls(napDescriptor))) ||
      []
  }

  const outDir = Platform.getContainerGenOutDirectory(platform)
  const containerGenResult = await generateContainerForRunner(platform, {
    baseComposite,
    dependencies,
    extra, // JavaScript object to pass extras e.x. androidConfig
    jsApiImpls,
    jsMainModuleName,
    miniApps: miniapps,
    napDescriptor: napDescriptor || undefined,
    outDir,
  })

  if (platform === 'android') {
    await publishContainer({
      containerPath: outDir,
      containerVersion: '1.0.0',
      extra: {
        artifactId: 'runner-ern-container',
        groupId: 'com.walmartlabs.ern',
      },
      platform: 'android',
      publisher: PackagePath.fromString('ern-container-publisher-maven'),
      url: getDefaultMavenLocalDirectory(),
    })
  }

  const pathToRunner = path.join(cwd, platform)

  const compositeNativeDeps = await containerGenResult.config.composite.getNativeDependencies()
  const reactNativeDep = _.find(
    compositeNativeDeps.all,
    p => p.packagePath.basePath === 'react-native'
  )

  const hasErnNavigation =
    YarnLockParser.fromPath(
      path.join(containerGenResult.config.composite.path, 'yarn.lock')
    ).findPackage(PackagePath.fromString('ern-navigation')).length > 0

  const runnerGeneratorConfig: RunnerGeneratorConfig = {
    extra: {
      androidConfig: (extra && extra.androidConfig) || {},
      containerGenWorkingDir: Platform.containerGenDirectory,
      hullPath: hasErnNavigation ? 'hullx' : 'hull',
    },
    mainMiniAppName: entryMiniAppName,
    outDir: pathToRunner,
    reactNativeDevSupportEnabled: dev,
    reactNativePackagerHost: host,
    reactNativePackagerPort: port,
    reactNativeVersion: reactNativeDep!.packagePath.version!,
    targetPlatform: platform,
  }

  if (!fs.existsSync(pathToRunner)) {
    shell.mkdir('-p', pathToRunner)
    await kax
      .task(`Generating ${platform} Runner project`)
      .run(
        getRunnerGeneratorForPlatform(platform).generate(runnerGeneratorConfig)
      )
  } else {
    await kax
      .task(`Regenerating ${platform} Runner Configuration`)
      .run(
        getRunnerGeneratorForPlatform(platform).regenerateRunnerConfig(
          runnerGeneratorConfig
        )
      )
  }

  await launchRunner({
    pathToRunner,
    platform,
  })
}
