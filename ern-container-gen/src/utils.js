// @flow

import {
  Dependency,
  ReactNativeCommands,
  yarn
} from '@walmart/ern-util'
import {
  exec
} from 'child_process'
import fs from 'fs'
import Mustache from 'mustache'
import Ora from 'ora'
import path from 'path'
import shell from 'shelljs'
import _ from 'lodash'

const { yarnAdd } = yarn
const gitFolderRe = /.*\/(.*).git/
const npmScopeModuleRe = /@(.*)\/(.*)/
const pluginConfigFileName = 'config.json'

export type PluginConfig = {
  android: Object,
  ios: Object,
  origin?: Object,
  path?: string
}

// =============================================================================
// GENERATOR utils
// =============================================================================

//
// Get the generation config of a given plugin
// plugin: A plugin object
// pluginsConfigPath : Path to plugins config
// Sample plugin object :
// {
//   name: "react-native-code-push",
//   version: "1.2.3"
// }
export async function getPluginConfig (plugin: Dependency, pluginsConfigPath: string) : Promise<PluginConfig> {
  let result = {}
  const pluginConfigPath = getPluginConfigPath(plugin, pluginsConfigPath)

  // If there is a base file (common to all versions) use it and optionally
  // patch it with specific version config (if present)
  if (pluginConfigPath && fs.existsSync(`${pluginConfigPath}/${pluginConfigFileName}`)) {
    result = await readFile(`${pluginConfigPath}/${pluginConfigFileName}`, 'utf-8')
        .then(JSON.parse)

    // Add default value (convention) for Android subsection for missing fields
    if (result.android) {
      if (result.android.root === undefined) {
        result.android.root = 'android'
      }

      if (!result.android.pluginHook) {
        result.android.pluginHook = {}
        const matchedFiles =
          shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.java$/) })
        throwIfShellCommandFailed()
        if (matchedFiles && matchedFiles.length === 1) {
          const pluginHookClass = path.basename(matchedFiles[0], '.java')
          result.android.pluginHook.name = pluginHookClass
          if (fs.readFileSync(matchedFiles[0], 'utf-8').includes('public static class Config')) {
            result.android.pluginHook.configurable = true
          }
        }
      }
    }

    result.path = pluginConfigPath
  } else {
    log.debug(`No config.json file for ${plugin.name}. Will use default config`)
    result = getApiPluginDefaultConfig()
  }

  if (!result.origin) {
    if (npmScopeModuleRe.test(plugin.scopedName)) {
      result.origin = {
        type: 'npm',
        scope: `${npmScopeModuleRe.exec(`${plugin.scopedName}`)[1]}`,
        name: `${npmScopeModuleRe.exec(`${plugin.scopedName}`)[2]}`,
        version: plugin.version
      }
    } else {
      result.origin = {
        type: 'npm',
        name: plugin.name,
        version: plugin.version
      }
    }
  } else if (!result.origin.version) {
    result.origin.version = plugin.version
  }

  return result
}

function getApiPluginDefaultConfig () : PluginConfig {
  return {
    android: {
      root: 'android',
      moduleName: 'lib',
      transform: [
        { file: 'android/lib/build.gradle' }
      ]
    },
    ios: {
      copy: [
        {
          source: 'IOS/IOS/Classes/SwaggersAPIs/*',
          dest: 'ElectrodeContainer/APIs'
        }
      ],
      pbxproj: {
        addSource: [
          {
            from: 'IOS/IOS/Classes/SwaggersAPIs/*.swift',
            path: 'APIs',
            group: 'APIs'
          }
        ]
      }
    }
  }
}

// Returns the base path of a given plugin generation config
export function getPluginConfigPath (plugin: Dependency, pluginsConfigPath: string) : ?string {
   // Folder names cannot contain '/' so it's replaced by ':'
  const pluginScopeAndName = plugin.scopedName.replace(/\//g, ':')

  const pluginVersions = _.map(
      fs.readdirSync(pluginsConfigPath).filter(f => f.startsWith(pluginScopeAndName)),
      s => /_v(.+)\+/.exec(s)[1])

  const matchingVersion = _.find(pluginVersions.sort().reverse(), d => plugin.version >= d)
  if (matchingVersion) {
    return `${pluginsConfigPath}/${pluginScopeAndName}_v${matchingVersion}+`
  }
}

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
      let miniAppStrings = []
      for (const miniapp of miniapps) {
        if (miniapp.packagePath) {
          miniAppStrings.push(miniapp.packagePath)
        } else {
          miniAppStrings.push(new Dependency(miniapp.name, {
            scope: miniapp.scope,
            version: miniapp.version
          }).toString())
        }
      }
      await generateMiniAppsComposite(miniAppStrings, paths.compositeMiniApp)
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

//
// miniapps should be strings that can be provided to `yarn add`
// this way we can generate a miniapp composite from different miniapp sources
// (git, local file system, npm ...)
export async function generateMiniAppsComposite (
  miniapps: Array<any>,
  folder: string) {
  shell.mkdir('-p', folder)
  shell.cd(folder)
  throwIfShellCommandFailed()

  let content = ''
  for (const miniapp of miniapps) {
    await spin(`Retrieving and installing ${miniapp}`, yarnAdd(miniapp))
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

  log.debug(`writing index.android.js`)
  await writeFile('./index.android.js', content)
  log.debug(`writing index.ios.js`)
  await writeFile('./index.ios.js', content)
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
    await yarnAdd(pluginOrigin)
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

export function handleCopyDirective (
  sourceRoot: string,
  destRoot: string,
  arr: Array<any>) {
  for (const cp of arr) {
    const sourcePath = `${sourceRoot}/${cp.source}`
    const destPath = `${destRoot}/${cp.dest}`
    if (!fs.existsSync(destPath)) {
      shell.mkdir('-p', destPath)
      throwIfShellCommandFailed()
    }
    shell.cp('-R', sourcePath, destPath)
    throwIfShellCommandFailed()
  }
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
// Mustache related utilities
// =============================================================================

// Mustache render using a template file
// filename: Path to the template file
// view: Mustache view to apply to the template
// returns: Rendered string output
export async function mustacheRenderUsingTemplateFile (
  filename: string,
  view: any) {
  return readFile(filename, 'utf8')
      .then(template => Mustache.render(template, view))
}

// Mustache render to an output file using a template file
// templateFilename: Path to the template file
// view: Mustache view to apply to the template
// outputFile: Path to the output file
export async function mustacheRenderToOutputFileUsingTemplateFile (
  templateFilename: string,
  view: any,
  outputFile: string) {
  return mustacheRenderUsingTemplateFile(templateFilename, view).then(output => {
    return writeFile(outputFile, output)
  })
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

async function readFile (
  filename: string,
  enc: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, enc, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

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
