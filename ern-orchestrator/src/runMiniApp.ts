import {
  getDefaultMavenLocalDirectory,
  kax,
  log,
  MiniApp,
  NativeApplicationDescriptor,
  NativePlatform,
  PackagePath,
  Platform,
  reactnative,
  shell,
  utils,
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
import { LaunchRunnerConfig } from 'ern-runner-gen/src/types/LaunchRunnerConfig'

export async function runMiniApp(
  platform: NativePlatform,
  {
    mainMiniAppName,
    miniapps,
    jsApiImpls,
    dependencies,
    descriptor,
    dev,
    extra,
    host,
    launchArgs,
    launchEnvVars,
    launchFlags,
    port,
  }: {
    dependencies?: PackagePath[]
    descriptor?: string | NativeApplicationDescriptor
    dev?: boolean
    extra?: any
    host?: string
    jsApiImpls?: PackagePath[]
    launchArgs?: string
    launchEnvVars?: string
    launchFlags?: string
    mainMiniAppName?: string
    miniapps?: PackagePath[]
    port?: string
  } = {}
) {
  const cwd = process.cwd()

  let napDescriptor: NativeApplicationDescriptor | void

  if (miniapps && !MiniApp.existInPath(cwd) && !mainMiniAppName) {
    throw new Error(
      'If you run multiple MiniApps you need to provide the name of the MiniApp to launch'
    )
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
    napDescriptor = utils.coerceToNativeApplicationDescriptor(descriptor)
  }

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
      const args: string[] = []
      if (host) {
        args.push(`--host ${host}`)
      }
      if (port) {
        args.push(`--port ${port}`)
      }
      await reactnative.startPackagerInNewWindow(cwd, args)
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
  await generateContainerForRunner(platform, {
    dependencies,
    extra, // JavaScript object to pass extras e.x. androidConfig
    jsApiImpls,
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
      publisher: 'maven',
      url: getDefaultMavenLocalDirectory(),
    })
  }

  const pathToRunner = path.join(cwd, platform)

  const runnerGeneratorConfig: RunnerGeneratorConfig = {
    extra: {
      androidConfig: (extra && extra.androidConfig) || {},
      containerGenWorkingDir: Platform.containerGenDirectory,
    },
    mainMiniAppName: entryMiniAppName,
    outDir: pathToRunner,
    reactNativeDevSupportEnabled: dev,
    reactNativePackagerHost: host,
    reactNativePackagerPort: port,
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

  const launchRunnerConfig: LaunchRunnerConfig = {
    extra: {
      launchArgs,
      launchEnvVars,
      launchFlags,
    },
    pathToRunner,
    platform,
  }

  await launchRunner(launchRunnerConfig)
}
