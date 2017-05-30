// @flow

import {
  generateContainer,
  GithubGenerator,
  MavenGenerator
} from '@walmart/ern-container-gen'
import {
  Platform
} from '@walmart/ern-util'
import {
  execSync
} from 'child_process'
import fs from 'fs'
import Mustache from 'mustache'
import readDir from 'fs-readdir-recursive'
import shell from 'shelljs'

let log

const CONTAINER_GEN_OUT_FOLDER = `${Platform.rootDirectory}/containergen/out`

// =============================================================================
// fs async wrappers
// =============================================================================

async function readFile (filename: string, enc: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, enc, (err, res) => {
      err ? reject(err) : resolve(res)
    })
  })
}

async function writeFile (filename: string, data: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err, res) => {
      err ? reject(err) : resolve(res)
    })
  })
}

// =============================================================================
// Mustache related utilities
// =============================================================================

// Mustache render using a template file
// filename: Path to the template file
// view: Mustache view to apply to the template
// returns: Rendered string output
async function mustacheRenderUsingTemplateFile (
  filename: string,
  view: Object) {
  return readFile(filename, 'utf8')
        .then(template => Mustache.render(template, view))
}

// Mustache render to an output file using a template file
// templateFilename: Path to the template file
// view: Mustache view to apply to the template
// outputFile: Path to the output file
async function mustacheRenderToOutputFileUsingTemplateFile (
  templateFilename: string,
  view: Object,
  outputFile: string) {
  return mustacheRenderUsingTemplateFile(templateFilename, view).then(output => {
    return writeFile(outputFile, output)
  })
}

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
  platform
} : {
  platformPath: string,
  plugins: Array<Object>,
  miniapp: Object,
  outFolder: string,
  headless: boolean,
  platform: 'android' | 'ios'
}) {
  try {
    if (!miniapp.localPath) {
      throw new Error('Miniapp must come with a local path !')
    }

    const view = {
      miniAppName: miniapp.name,
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
        await mustacheRenderToOutputFileUsingTemplateFile(
                    `${outFolder}/${file}`, view, `${outFolder}/${file}`)
      }
    } else if (platform === 'ios') {
      shell.cp('-R', `${platformPath}/ern-runner-gen/runner-hull/ios/*`, outFolder)
      const files = readDir(`${platformPath}/ern-runner-gen/runner-hull/ios`)
      for (const file of files) {
        await mustacheRenderToOutputFileUsingTemplateFile(
                    `${outFolder}/${file}`, view, `${outFolder}/${file}`)
      }
    }

    await generateContainerForRunner({
      platformPath,
      plugins,
      miniapp,
      platform,
      outFolder
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
  outFolder
} : {
  platformPath: string,
  plugins: Array<Object>,
  miniapp: Object,
  platform: 'android' | 'ios',
  outFolder: string
}) {
  const generator = (platform === 'android')
        ? new MavenGenerator()
        : new GithubGenerator()

  await generateContainer({
    containerVersion: RUNNER_CONTAINER_VERSION,
    nativeAppName: camelCase(miniapp.name),
    generator,
    platformPath,
    plugins,
    miniapps: [miniapp]
  })

    // For iOS we need to build the container xcodeproj so that it builds
    // the ElectrodeContainer.framework that we need to inject in the
    // runner project
  if (platform === 'ios') {
    shell.cd(`${CONTAINER_GEN_OUT_FOLDER}/ios`)
    execSync(`xcodebuild -scheme ElectrodeContainer -destination 'platform=iOS Simulator,name=iPhone 7,OS=latest' SYMROOT="${CONTAINER_GEN_OUT_FOLDER}/ios/build" build`)
    shell.cp('-rf', `${CONTAINER_GEN_OUT_FOLDER}/ios/build/Debug-iphonesimulator/ElectrodeContainer.framework`, `${outFolder}/ErnRunner/Frameworks`)
  }
}
