// @flow

import * as ernUtil from 'ern-util'
import {
  exec
} from 'child_process'
import fs from 'fs'
import shell from 'shelljs'
import _ from 'lodash'
import path from 'path'
const {
  Dependency,
  DependencyPath,
  ReactNativeCommands
} = ernUtil

const gitFolderRe = /.*\/(.*).git/

export async function bundleMiniApps (
  miniapps: Array<any>,
  paths: any,
  platform: 'android' | 'ios', {
    pathToYarnLock
  } : {
    pathToYarnLock?: string
  } = {}) {
  try {
    log.debug(`[=== Starting mini apps bundling ===]`)

    // Specific case where we use container gen to generate
    // container for runner and we want to bundle the local miniapp
    if ((miniapps.length === 1) && (miniapps[0].localPath)) {
      shell.cd(miniapps[0].localPath)
      throwIfShellCommandFailed()
    } else {
      let miniAppsPaths : Array<DependencyPath> = []
      for (const miniapp of miniapps) {
        if (miniapp.packagePath) {
          miniAppsPaths.push(miniapp.packagePath)
        } else {
          miniAppsPaths.push(new DependencyPath(new Dependency(miniapp.name, {
            scope: miniapp.scope,
            version: miniapp.version
          }).toString()))
        }
      }
      await generateMiniAppsComposite(miniAppsPaths, paths.compositeMiniApp, {pathToYarnLock})
    }

    // Clear react packager cache beforehand to avoid surprises ...
    clearReactPackagerCache()

    if (platform === 'android') {
      await ernUtil.spin(`Bundling miniapp(s) for Android`, reactNativeBundleAndroid(paths))
    } else if (platform === 'ios') {
      await ernUtil.spin(`Bundling miniapp(s) for iOS`, reactNativeBundleIos(paths))
    }

    log.debug(`[=== Completed mini apps bundling ===]`)
  } catch (e) {
    log.error('[bundleMiniApps] Something went wrong: ' + e)
  }
}

export async function reactNativeBundleAndroid (paths: any) {
  const reactNativeCommands = new ReactNativeCommands(paths.reactNativeBinary)
  return reactNativeCommands.bundle({
    entryFile: 'index.android.js',
    dev: false,
    bundleOutput: `${paths.outFolder}/android/lib/src/main/assets/index.android.bundle`,
    platform: 'android',
    assetsDest: `${paths.outFolder}/android/lib/src/main/res`
  })
}

export async function reactNativeBundleIos (paths: any) {
  const miniAppOutFolder = `${paths.outFolder}/ios/ElectrodeContainer/Libraries/MiniApp`
  const reactNativeCommands = new ReactNativeCommands(paths.reactNativeBinary)

  if (!fs.existsSync(miniAppOutFolder)) {
    shell.mkdir('-p', miniAppOutFolder)
    throwIfShellCommandFailed()
  }

  return reactNativeCommands.bundle({
    entryFile: 'index.ios.js',
    dev: false,
    bundleOutput: `${miniAppOutFolder}/MiniApp.jsbundle`,
    platform: 'ios',
    assetsDest: `${miniAppOutFolder}`
  })
}

export async function generateMiniAppsComposite (
  miniappsPaths: Array<DependencyPath>,
  outDir: string, {
    pathToYarnLock
  } : {
    pathToYarnLock?: string
  } = {}) {
  shell.mkdir('-p', outDir)
  shell.cd(outDir)
  throwIfShellCommandFailed()

  let compositePackageJson = {}

  if (pathToYarnLock) {
    if (_.some(miniappsPaths, p => p.isAFileSystemPath || p.isAGitPath)) {
      throw new Error('[generateMiniAppsComposite] When providing a yarn lock you cannot pass MiniApps paths with file or git scheme')
    }

    const miniAppsPackages = _.map(miniappsPaths, p => Dependency.fromPath(p))
    if (_.some(miniAppsPackages, m => !m.isVersioned)) {
      throw new Error('[generateMiniAppsComposite] When providing a yarn lock you cannot pass MiniApps without an explicit version')
    }

    if (!fs.existsSync(pathToYarnLock)) {
      throw new Error(`[generateMiniAppsComposite] Path to yarn.lock does not exists (${pathToYarnLock})`)
    }

    log.debug(`Copying yarn.lock to ${outDir}`)
    shell.cp(pathToYarnLock, outDir)
    throwIfShellCommandFailed()

    const yarnLock = fs.readFileSync(pathToYarnLock, 'utf8')
    const miniAppsDeltas = getMiniAppsDeltas(miniAppsPackages, yarnLock)

    log.debug(`[generateMiniAppsComposite] miniAppsDeltas: ${JSON.stringify(miniAppsDeltas)}`)

    // Create initial package.json
    compositePackageJson.dependencies = getPackageJsonDependenciesUsingMiniAppDeltas(miniAppsDeltas, yarnLock)
    fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(compositePackageJson, null, 2), 'utf8')

    // Now that the composite package.json is similar to the one used to generated yarn.lock
    // we can run yarn install to get back to the exact same dependency graph as the previously
    // generated composite
    await ernUtil.spin(`Installing initial MiniApps`, ernUtil.yarn.yarnInstall())
    await runYarnUsingMiniAppDeltas(miniAppsDeltas)
  } else {
    // No yarn.lock path was provided, just add miniapps one by one
    log.debug(`[generateMiniAppsComposite] no yarn lock provided`)
    for (const miniappPath of miniappsPaths) {
      await ernUtil.spin(`Retrieving and installing ${miniappPath.toString()}`, ernUtil.yarn.yarnAdd(miniappPath))
    }
  }

  let entryIndexJsContent = ''

  compositePackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  for (const dependency of Object.keys(compositePackageJson.dependencies)) {
    entryIndexJsContent += `import '${dependency}'\n`
  }

  const pathToCodePushNodeModuleDir = `${outDir}/node_modules/react-native-code-push`
  const pathToReactNativeNodeModuleDir = `${outDir}/node_modules/react-native`
  // If code push plugin is present we need to do some additional work
  if (fs.existsSync(pathToCodePushNodeModuleDir)) {
    const reactNativePackageJson = JSON.parse(fs.readFileSync(`${pathToReactNativeNodeModuleDir}/package.json`, 'utf8'))

    //
    // The following code will need to be uncommented and properly reworked or included
    // in a different way, once Cart and TYP don't directly depend on code push directly
    // We will work with Cart team in that direction
    //
    // await yarnAdd(codePushPlugin.name, codePushPlugin.version)
    // content += `import codePush from "react-native-code-push"\n`
    // content += `codePush.sync()`

    // We need to add some info to package.json for CodePush
    // In order to run, code push needs to find the following in package.json
    // - name & version
    // - react-native in the dependency block
    // TODO :For now we hardcode these values for demo purposes. That being said it
    // might not be needed to do something better because it seems like
    // code push is not making a real use of this data
    // Investigate further.
    // https://github.com/Microsoft/code-push/blob/master/cli/script/command-executor.ts#L1246
    compositePackageJson.dependencies['react-native'] = reactNativePackageJson.version
    compositePackageJson.name = 'container'
    compositePackageJson.version = '0.0.1'
    fs.writeFileSync('package.json', JSON.stringify(compositePackageJson, null, 2))
  }

  log.debug(`Removing .babelrc files from all modules`)
  shell.rm('-rf', 'node_modules/**/.babelrc')
  throwIfShellCommandFailed()

  log.debug(`Creating .babelrc`)
  const compositeBabelRc = { 'presets': ['react-native'] }
  await writeFile('.babelrc', JSON.stringify(compositeBabelRc, null, 2))

  log.debug(`Creating index.android.js`)
  await writeFile('index.android.js', entryIndexJsContent)
  log.debug(`Creating index.ios.js`)
  await writeFile('index.ios.js', entryIndexJsContent)
}

export function clearReactPackagerCache () {
  const TMPDIR = process.env['TMPDIR']
  if (TMPDIR) {
    shell.rm('-rf', `${TMPDIR}/react-*`)
    throwIfShellCommandFailed()
  }
}

// Using a yarn.lock file content as reference to figure out deltas, group the MiniApps as follow :
// 'new' : The MiniApp is a new one (it was not part of previously generated composite)
// 'same' : The MiniApp is the same (it was part of previously generated composite, with same version)
// 'upgraded' : The MiniApp has a new version (it was part of previously generated composite, but with a different version)
export function getMiniAppsDeltas (
  miniApps: Array<Dependency>,
  yarnlock: string) {
  return _.groupBy(miniApps, m => {
    const re = new RegExp(`\n${m.withoutVersion().toString()}@(.+):`)
    const match = re.exec(yarnlock)
    if (match === null) {
      return 'new'
    } else {
      return (match[1] === m.version) ? 'same' : 'upgraded'
    }
  })
}

// Generate package.json dependencies object based on MiniApp deltas
// The  object will contain the same MiniApps at the same versions that were
// used to generate the provided yarn.lock, so that we get back to original state
// conforming with yarn.lock
// It only contains 'same' and 'upgrade' MiniApps (not new ones)
export function getPackageJsonDependenciesUsingMiniAppDeltas (
  miniAppsDeltas: Object,
  yarnlock: string) {
  let result = {}

  if (miniAppsDeltas.same) {
    for (const m of miniAppsDeltas.same) {
      result[`${m.name}`] = m.version
    }
  }

  if (miniAppsDeltas.upgraded) {
    for (const m of miniAppsDeltas.upgraded) {
      const re = new RegExp(`\n${m.name.toString()}@(.+):`)
      const initialVersion = re.exec(yarnlock)[1]
      result[`${m.name}`] = initialVersion
    }
  }

  return result
}

export async function runYarnUsingMiniAppDeltas (miniAppsDeltas: Object) {
  // Now we can `yarn add` new MiniApps and `yarn upgrade` the ones that have new versions
  if (miniAppsDeltas.new) {
    for (const m of miniAppsDeltas.new) {
      const miniappPackage = Dependency.fromObject(m)
      await ernUtil.spin(`Adding new MiniApp ${miniappPackage.toString()}`, ernUtil.yarn.yarnAdd(miniappPackage.path))
    }
  }

  if (miniAppsDeltas.upgraded) {
    for (const m of miniAppsDeltas.upgraded) {
      const miniappPackage = Dependency.fromObject(m)
      await ernUtil.spin(`Upgrading MiniApp ${miniappPackage.toString()}`, ernUtil.yarn.yarnUpgrade(miniappPackage.path))
    }
  }
}

//
// Download the plugin source given a plugin origin
// pluginOrigin: A plugin origin object
// Sample plugin origin objects :
// {
//  "type": "git",
//  "url": "https://github.com/aoriani/ReactNative-StackTracer.git",
//  "version": "0.1.1"
// }
//
// {
//  "type": "npm",
//  "name": "react-native-code-push",
//  "version": "1.16.1-beta"
// }
//
// Note: The plugin will be downloaded locally to the current folder
// For npm origin it will be put in node_modules folder
// For git origin it will be put directly at the root in a folder named after
// the git repo as one would expect
//
// Returns: Absolute path to where the plugin was installed
export async function downloadPluginSource (pluginOrigin: any) : Promise<string> {
  let downloadPath = ''
  if (pluginOrigin.type === 'npm') {
    const dependency = new Dependency(pluginOrigin.name, { scope: pluginOrigin.scope, version: pluginOrigin.version })
    await ernUtil.yarn.yarnAdd(DependencyPath.fromString(dependency.toString()))
    if (pluginOrigin.scope) {
      downloadPath = `node_modules/@${pluginOrigin.scope}/${pluginOrigin.name}`
    } else {
      downloadPath = `node_modules/${pluginOrigin.name}`
    }
  } else if (pluginOrigin.type === 'git') {
    if (pluginOrigin.version) {
      await gitClone(pluginOrigin.url, { branch: pluginOrigin.version })
      downloadPath = gitFolderRe.exec(`${pluginOrigin.url}`)[1]
    }
  } else {
    throw new Error(`Unsupported plugin origin type : ${pluginOrigin.type}`)
  }

  return Promise.resolve(`${shell.pwd()}/${downloadPath}`)
}

// =============================================================================
// MISC utils
// =============================================================================

// Given a string returns the same string with its first letter capitalized
export function capitalizeFirstLetter (str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

// =============================================================================
// GIT utils
// =============================================================================

export async function gitClone (
  url: string,
  {
    branch,
    destFolder
  } : {
    branch?: string,
    destFolder?: string
  } = {}) {
  let cmd = branch
    ? `git clone --branch ${branch} --depth 1 ${url}`
    : `git clone ${url}`

  if (destFolder) {
    cmd += ` ${destFolder}`
  }

  return new Promise((resolve, reject) => {
    exec(cmd,
      (err, stdout, stderr) => {
        // Git seems to send stuff to stderr :(
        if (err) {
          log.error(err)
          reject(err)
        } else {
          log.debug(stdout || stderr)
          resolve(stdout || stderr)
        }
      })
  })
}

export async function gitAdd () {
  return new Promise((resolve, reject) => {
    exec('git add .',
      (err, stdout, stderr) => {
        // Git seems to send stuff to stderr :(
        if (err) {
          log.error(err)
          reject(err)
        } else {
          log.debug(stdout || stderr)
          resolve(stdout || stderr)
        }
      })
  })
}

export async function gitCommit (message: string) {
  let cmd = message
          ? `git commit -m '${message}'`
          : `git commit -m 'no message'`

  return new Promise((resolve, reject) => {
    exec(cmd,
      (err, stdout, stderr) => {
        // Git seems to send stuff to stderr :(
        if (err) {
          log.error(err)
          reject(err)
        } else {
          log.debug(stdout || stderr)
          resolve(stdout || stderr)
        }
      })
  })
}

export async function gitTag (tag: string) {
  return new Promise((resolve, reject) => {
    exec(`git tag ${tag}`,
      (err, stdout, stderr) => {
        // Git seems to send stuff to stderr :(
        if (err) {
          log.error(err)
          reject(err)
        } else {
          log.debug(stdout || stderr)
          resolve(stdout || stderr)
        }
      })
  })
}

export async function gitPush ({
  remote = 'origin',
  branch = 'master',
  force = false,
  tags = false
} : {
  remote?: string,
  branch?: string,
  force: boolean,
  tags: boolean
} = {}) {
  let cmd = `git push ${remote} ${branch} ${force ? '--force' : ''} ${tags ? '--tags' : ''}`

  return new Promise((resolve, reject) => {
    exec(cmd,
      (err, stdout, stderr) => {
        // Git seems to send stuff to stderr :(
        if (err) {
          log.error(err)
          reject(err)
        } else {
          log.debug(stdout || stderr)
          resolve(stdout || stderr)
        }
      })
  })
}

// =============================================================================
// Async wrappers
// =============================================================================

async function writeFile (
  filename: string,
  data: any) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

// =============================================================================
// Shell error helper
// =============================================================================

export function throwIfShellCommandFailed () {
  const shellError = shell.error()
  if (shellError) {
    throw new Error(shellError)
  }
}
