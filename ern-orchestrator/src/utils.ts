import {
  log,
  MiniApp,
  Platform,
  reactnative,
  android,
  ios,
  PackagePath,
  NativeApplicationDescriptor,
  shell,
  NativePlatform,
  kax,
} from 'ern-core'
import { publishContainer } from 'ern-container-publisher'

import { getActiveCauldron } from 'ern-cauldron-api'
import { RunnerGenerator, RunnerGeneratorConfig } from 'ern-runner-gen'
import { AndroidRunnerGenerator } from 'ern-runner-gen-android'
import { IosRunnerGenerator } from 'ern-runner-gen-ios'
import { runLocalContainerGen, runCauldronContainerGen } from './container'
import { spawn, spawnSync } from 'child_process'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import os from 'os'

const { runAndroidProject } = android

const getDefaultMavenLocalDirectory = () => {
  const pathToRepository = path.join(os.homedir(), '.m2', 'repository')
  return `file://${pathToRepository}`
}

async function runMiniApp(
  platform: NativePlatform,
  {
    mainMiniAppName,
    miniapps,
    jsApiImpls,
    dependencies,
    descriptor,
    dev,
    host,
    port,
  }: {
    mainMiniAppName?: string
    miniapps?: string[]
    jsApiImpls?: string[]
    dependencies?: string[]
    descriptor?: string
    dev?: boolean
    host?: string
    port?: string
  } = {}
) {
  const cwd = process.cwd()

  let napDescriptor: NativeApplicationDescriptor | void

  if (miniapps && !mainMiniAppName) {
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
    if (cauldron == null) {
      throw new Error('[runMiniApp] No cauldron instance found')
    }
    napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
  }

  let entryMiniAppName = mainMiniAppName || ''
  let dependenciesObjs: PackagePath[] = []
  let miniAppsPaths: PackagePath[] = []
  if (miniapps) {
    if (MiniApp.existInPath(cwd)) {
      const miniapp = MiniApp.fromPath(cwd)
      miniAppsPaths = [PackagePath.fromString(`file:${cwd}`)]
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
    dependenciesObjs = _.map(dependencies, d => PackagePath.fromString(d))
    miniAppsPaths = miniAppsPaths.concat(
      _.map(miniapps, m => PackagePath.fromString(m))
    )
  } else if (!miniapps && !descriptor) {
    entryMiniAppName = MiniApp.fromCurrentPath().name
    log.debug(
      `This command is being run from the ${entryMiniAppName} MiniApp directory.`
    )
    log.debug(`Initializing Runner`)
    dependenciesObjs = _.map(dependencies, d => PackagePath.fromString(d))
    miniAppsPaths = [PackagePath.fromString(`file:${cwd}`)]
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
    miniAppsPaths =
      (cauldron &&
        napDescriptor &&
        (await cauldron.getContainerMiniApps(napDescriptor))) ||
      []
  }

  let jsApiImplsPaths: PackagePath[] = []

  if (jsApiImpls) {
    jsApiImplsPaths = _.map(jsApiImpls, j => PackagePath.fromString(j))
  }
  if (descriptor) {
    jsApiImplsPaths =
      (cauldron &&
        napDescriptor &&
        (await cauldron.getContainerJsApiImpls(napDescriptor))) ||
      []
  }

  const outDir = path.join(
    Platform.rootDirectory,
    'containergen',
    'out',
    platform
  )
  await generateContainerForRunner(platform, {
    dependenciesObjs,
    jsApiImplsPaths,
    miniAppsPaths,
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

  await launchRunner({
    host,
    pathToRunner,
    platform,
    port,
  })
}

function getRunnerGeneratorForPlatform(platform: string): RunnerGenerator {
  switch (platform) {
    case 'android':
      return new AndroidRunnerGenerator()
    case 'ios':
      return new IosRunnerGenerator()
    default:
      throw new Error(`Unsupported platform : ${platform}`)
  }
}

async function generateContainerForRunner(
  platform: NativePlatform,
  {
    napDescriptor,
    dependenciesObjs = [],
    miniAppsPaths = [],
    jsApiImplsPaths = [],
    outDir,
  }: {
    napDescriptor?: NativeApplicationDescriptor
    dependenciesObjs: PackagePath[]
    miniAppsPaths: PackagePath[]
    jsApiImplsPaths: PackagePath[]
    outDir: string
  }
) {
  if (napDescriptor) {
    await runCauldronContainerGen(napDescriptor, {
      outDir,
    })
  } else {
    await runLocalContainerGen(miniAppsPaths, jsApiImplsPaths, platform, {
      extraNativeDependencies: dependenciesObjs,
      outDir,
    })
  }
}

async function launchRunner({
  platform,
  pathToRunner,
  host,
  port,
}: {
  platform: string
  pathToRunner: string
  host?: string
  port?: string
}) {
  if (platform === 'android') {
    return launchAndroidRunner(pathToRunner)
  } else if (platform === 'ios') {
    return launchIosRunner(pathToRunner)
  }
}

async function launchAndroidRunner(pathToAndroidRunner: string) {
  return runAndroidProject({
    packageName: 'com.walmartlabs.ern',
    projectPath: pathToAndroidRunner,
  })
}

async function launchIosRunner(pathToIosRunner: string) {
  const iosDevices = ios.getiPhoneRealDevices()
  if (iosDevices && iosDevices.length > 0) {
    launchOnDevice(pathToIosRunner, iosDevices)
  } else {
    launchOnSimulator(pathToIosRunner)
  }
}

async function launchOnDevice(pathToIosRunner: string, devices) {
  const iPhoneDevice = await ios.askUserToSelectAniPhoneDevice(devices)
  shell.pushd(pathToIosRunner)

  try {
    await kax
      .task('Building iOS Runner project')
      .run(buildIosRunner(pathToIosRunner, iPhoneDevice.udid))

    const kaxDeployTask = kax.task(
      `Installing iOS Runner on ${iPhoneDevice.name}`
    )
    try {
      const iosDeployInstallArgs = [
        '--bundle',
        `${pathToIosRunner}/build/Debug-iphoneos/ErnRunner.app`,
        '--id',
        iPhoneDevice.udid,
        '--justlaunch',
      ]
      const iosDeployOutput = spawnSync('ios-deploy', iosDeployInstallArgs, {
        encoding: 'utf8',
      })
      if (iosDeployOutput.error) {
        kaxDeployTask.fail(
          `Installation failed. Make sure you have run 'npm install -g ios-deploy'.`
        )
      } else {
        kaxDeployTask.succeed()
      }
    } catch (e) {
      kaxDeployTask.fail(e.message)
      throw e
    }
  } finally {
    shell.popd()
  }
}

async function launchOnSimulator(pathToIosRunner: string) {
  const iPhoneSim = await ios.askUserToSelectAniPhoneSimulator()
  await kax
    .task('Killing all running Simulators')
    .run(ios.killAllRunningSimulators())
  await kax
    .task('Booting iOS Simulator')
    .run(ios.launchSimulator(iPhoneSim.udid))
  shell.pushd(pathToIosRunner)
  try {
    await kax
      .task('Building iOS Runner project')
      .run(buildIosRunner(pathToIosRunner, iPhoneSim.udid))
    await kax
      .task('Installing iOS Runner on Simulator')
      .run(
        ios.installApplicationOnSimulator(
          iPhoneSim.udid,
          `${pathToIosRunner}/build/Debug-iphonesimulator/ErnRunner.app`
        )
      )
    await kax
      .task('Launching Runner')
      .run(ios.launchApplication(iPhoneSim.udid, 'com.yourcompany.ernrunner'))
  } finally {
    shell.popd()
  }
}

async function buildIosRunner(pathToIosRunner: string, udid: string) {
  return new Promise((resolve, reject) => {
    const xcodebuildProc = spawn(
      'xcodebuild',
      [
        `-scheme`,
        'ErnRunner',
        'build',
        `-destination`,
        `id=${udid}`,
        `SYMROOT=${pathToIosRunner}/build`,
      ],
      { cwd: pathToIosRunner }
    )

    xcodebuildProc.stdout.on('data', data => {
      log.debug(data.toString())
    })
    xcodebuildProc.stderr.on('data', data => {
      log.debug(data.toString())
    })
    xcodebuildProc.on('close', code => {
      code === 0
        ? resolve()
        : reject(
            new Error(`XCode xcbuild command failed with exit code ${code}`)
          )
    })
  })
}

export default {
  runMiniApp,
}
