// @flow

import {
  Dependency,
  DependencyPath,
  ReactNativeCommands,
  yarn
} from 'ern-util'
import {
  exec
} from 'child_process'
import fs from 'fs'
import Ora from 'ora'
import shell from 'shelljs'
const { yarnAdd } = yarn
const gitFolderRe = /.*\/(.*).git/

export async function bundleMiniApps (
  miniapps: Array<any>,
  paths: any,
  platform: 'android' | 'ios') {
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
      await generateMiniAppsComposite(miniAppsPaths, paths.compositeMiniApp)
    }

    // Clear react packager cache beforehand to avoid surprises ...
    clearReactPackagerCache()

    if (platform === 'android') {
      await spin(`Bundling miniapp(s) for Android`, reactNativeBundleAndroid(paths))
    } else if (platform === 'ios') {
      await spin(`Bundling miniapp(s) for iOS`, reactNativeBundleIos(paths))
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
  folder: string) {
  shell.mkdir('-p', folder)
  shell.cd(folder)
  throwIfShellCommandFailed()

  let content = ''
  for (const miniappPath of miniappsPaths) {
    await spin(`Retrieving and installing ${miniappPath.toString()}`, yarnAdd(miniappPath))
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
  for (const dependency of Object.keys(packageJson.dependencies)) {
    content += `import '${dependency}'\n`
  }

  const codePushNodeModuleFolder = `${folder}/node_modules/react-native-code-push`
  const reactNativeNodeModuleFolder = `${folder}/node_modules/react-native`
  // If code push plugin is present we need to do some additional work
  if (fs.existsSync(codePushNodeModuleFolder)) {
    const reactNativePackageJson = JSON.parse(fs.readFileSync(`${reactNativeNodeModuleFolder}/package.json`, 'utf-8'))

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
    packageJson.dependencies['react-native'] = reactNativePackageJson.version
    packageJson.name = 'container'
    packageJson.version = '0.0.1'
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))
  }

  log.debug(`Removing .babelrc files from all modules`)
  shell.rm('-rf', 'node_modules/**/.babelrc')
  throwIfShellCommandFailed()

  log.debug(`Creating .babelrc`)
  const compositeBabelRc = { 'presets': ['react-native'] }
  await writeFile('.babelrc', JSON.stringify(compositeBabelRc, null, 2))

  log.debug(`Creating index.android.js`)
  await writeFile('index.android.js', content)
  log.debug(`Creating index.ios.js`)
  await writeFile('index.ios.js', content)
}

export function clearReactPackagerCache () {
  const TMPDIR = process.env['TMPDIR']
  if (TMPDIR) {
    shell.rm('-rf', `${TMPDIR}/react-*`)
    throwIfShellCommandFailed()
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
    await yarnAdd(DependencyPath.fromString(dependency.toString()))
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

// Promisify ora spinner
// there is already a promise method on ora spinner, unfortunately it does
// not return the wrapped promise so that's utterly useless !
export async function spin (
  msg: string,
  prom: Promise<*>,
  options: any) : Promise<*> {
  const spinner = new Ora(options || msg)
  spinner.start()

  try {
    let result = await prom
    spinner.succeed()
    return result
  } catch (e) {
    spinner.fail(e)
    throw e
  }
}

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
