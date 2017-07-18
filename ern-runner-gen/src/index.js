// @flow

import {
  generateContainer,
  GithubGenerator,
  MavenGenerator
} from '@walmart/ern-container-gen'
import {
  Dependency,
  mustacheUtils
} from '@walmart/ern-util'
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

// Given a string returns the same string with its first letter in lower case
function camelCase (str: string) {
  return `${str.charAt(0).toLowerCase()}${str.slice(1)}`
}

// =============================================================================
// Main
// =============================================================================

const RUNNER_CONTAINER_VERSION = '1.0.0'

// Generate the runner project (Android only as of now)
// platformPath : Path to the ern-platform to use
// plugins : Array containing all plugins to be included in the generated container
// miniapp : The miniapp to attach to this runner. Needs to have localPath set !
// outFolder : Where the generated project will be outputed
export async function generateRunner ({
  platformPath,
  plugins,
  miniapp,
  outFolder,
  headless,
  platform,
  containerGenWorkingFolder,
  pluginsConfigurationDirectory,
  reactNativeAarsPath
} : {
  platformPath: string,
  plugins: Array<Object>,
  miniapp: Object,
  outFolder: string,
  headless: boolean,
  platform: 'android' | 'ios',
  containerGenWorkingFolder: string,
  pluginsConfigurationDirectory: string,
  reactNativeAarsPath: string
}) {
  try {
    if (!miniapp.localPath) {
      throw new Error('Miniapp must come with a local path !')
    }

    const view = {
      miniAppName: miniapp.name,
      pathToElectrodeContainerXcodeProj: `${containerGenWorkingFolder}/out/ios`,
      pascalCaseMiniAppName: pascalCase(miniapp.name),
      camelCaseMiniAppName: camelCase(miniapp.name),
      headless
    }

    shell.mkdir(outFolder)

    if (platform === 'android') {
      shell.cp('-R', `${platformPath}/ern-runner-gen/runner-hull/android/*`, outFolder)
      const files = readDir(`${platformPath}/ern-runner-gen/runner-hull/android`,
                (f) => (!f.endsWith('.jar') && !f.endsWith('.png')))
      for (const file of files) {
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
                    `${outFolder}/${file}`, view, `${outFolder}/${file}`)
      }
    } else if (platform === 'ios') {
      shell.cp('-R', `${platformPath}/ern-runner-gen/runner-hull/ios/*`, outFolder)
      const files = readDir(`${platformPath}/ern-runner-gen/runner-hull/ios`)
      for (const file of files) {
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
                    `${outFolder}/${file}`, view, `${outFolder}/${file}`)
      }
    }

    await generateContainerForRunner({
      platformPath,
      plugins,
      miniapp,
      platform,
      containerGenWorkingFolder,
      outFolder,
      pluginsConfigurationDirectory,
      reactNativeAarsPath
    })
  } catch (e) {
    log.error('Something went wrong: ' + e)
    throw e
  }
}

export async function generateContainerForRunner ({
  platformPath,
  plugins,
  miniapp,
  platform,
  containerGenWorkingFolder,
  outFolder,
  pluginsConfigurationDirectory,
  reactNativeAarsPath
} : {
  platformPath: string,
  plugins: Array<Dependency>,
  miniapp: Object,
  platform: 'android' | 'ios',
  containerGenWorkingFolder: string,
  outFolder: string,
  pluginsConfigurationDirectory: string,
  reactNativeAarsPath: string
}) {
  const generator = (platform === 'android')
        ? new MavenGenerator()
        : new GithubGenerator()

  await generateContainer({
    containerVersion: RUNNER_CONTAINER_VERSION,
    nativeAppName: miniapp.name,
    generator,
    platformPath,
    plugins,
    miniapps: [miniapp],
    workingFolder: containerGenWorkingFolder,
    pluginsConfigurationDirectory,
    reactNativeAarsPath
  })
}
