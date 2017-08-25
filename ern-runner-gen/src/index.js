// @flow

import {
  generateContainer,
  IosGenerator,
  AndroidGenerator
} from 'ern-container-gen'
import {
  Dependency,
  mustacheUtils
} from 'ern-util'
import {
  ContainerGeneratorConfig
} from 'ern-core'
import readDir from 'fs-readdir-recursive'
import shell from 'shelljs'

let log

// ==============================================================================
// Misc utitlities
// ==============================================================================

// Given a string returns the same string with its first letter capitalized
function pascalCase (str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

// =============================================================================
// Main
// =============================================================================

const RUNNER_CONTAINER_VERSION = '1.0.0'

// Generate the runner project
// platformPath : Path to the ern-platform to use
// plugins : Array containing all plugins to be included in the generated container
// miniapp : The miniapp to attach to this runner. Needs to have localPath set !
// outFolder : Where the generated project will be outputed
export async function generateRunner ({
  platformPath,
  plugins,
  miniapp,
  outDir,
  platform,
  containerGenWorkingDir,
  reactNativeAarsPath
} : {
  platformPath: string,
  plugins: Array<Object>,
  miniapp: Object,
  outDir: string,
  platform: 'android' | 'ios',
  containerGenWorkingDir: string,
  reactNativeAarsPath: string
}) {
  try {
    if (!miniapp.localPath) {
      throw new Error('Miniapp must come with a local path !')
    }

    const mustacheView = {
      miniAppName: miniapp.name,
      pascalCaseMiniAppName: pascalCase(miniapp.name)
    }

    shell.mkdir(outDir)

    if (platform === 'android') {
      await generateAndroidRunnerProject(platformPath, outDir, mustacheView)
    } else if (platform === 'ios') {
      await generateIosRunnerProject(platformPath, outDir, mustacheView, containerGenWorkingDir)
    }

    await generateContainerForRunner({
      platformPath,
      plugins,
      miniapp,
      platform,
      containerGenWorkingDir,
      reactNativeAarsPath
    })
  } catch (e) {
    log.error('Something went wrong: ' + e)
    throw e
  }
}

export async function generateAndroidRunnerProject (
  platformPath: string,
  outDir: string,
  mustacheView: Object) {
  shell.cp('-R', `${platformPath}/ern-runner-gen/runner-hull/android/*`, outDir)
  const files = readDir(`${platformPath}/ern-runner-gen/runner-hull/android`,
            (f) => (!f.endsWith('.jar') && !f.endsWith('.png')))
  for (const file of files) {
    await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
                `${outDir}/${file}`, mustacheView, `${outDir}/${file}`)
  }
}

export async function generateIosRunnerProject (
  platformPath: string,
  outDir: string,
  mustacheView: Object,
  containerGenWorkingDir: string) {
  // Enhance mustacheView with iOS specifics
  mustacheView.pathToElectrodeContainerXcodeProj = `${containerGenWorkingDir}/out/ios`

  shell.cp('-R', `${platformPath}/ern-runner-gen/runner-hull/ios/*`, outDir)
  const files = readDir(`${platformPath}/ern-runner-gen/runner-hull/ios`)
  for (const file of files) {
    await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
                `${outDir}/${file}`, mustacheView, `${outDir}/${file}`)
  }
}

export async function generateContainerForRunner ({
  platformPath,
  plugins,
  miniapp,
  platform,
  containerGenWorkingDir,
  reactNativeAarsPath
} : {
  platformPath: string,
  plugins: Array<Dependency>,
  miniapp: Object,
  platform: 'android' | 'ios',
  containerGenWorkingDir: string,
  reactNativeAarsPath: string
}) {
  const generatorConfig = new ContainerGeneratorConfig(platform)
  const generator = (platform === 'android')
    ? new AndroidGenerator({containerGeneratorConfig: generatorConfig})
    : new IosGenerator(generatorConfig)

  await generateContainer({
    containerVersion: RUNNER_CONTAINER_VERSION,
    nativeAppName: miniapp.name,
    generator,
    platformPath,
    plugins,
    miniapps: [miniapp],
    workingFolder: containerGenWorkingDir,
    reactNativeAarsPath
  })
}
