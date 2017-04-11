import _ from 'lodash'
import child_process from 'child_process'
import fs from 'fs'
import Mustache from 'mustache'
import Ora from 'ora'
import path from 'path'
import shell from 'shelljs'

import {reactNative} from '@walmart/ern-util'

const exec = child_process.exec
const gitFolderRe = /.*\/(.*).git/
const npmScopeModuleRe = /(@.*)\/(.*)/
const npmModuleRe = /(.*)@(.*)/
const pluginConfigFileName = 'config.json'

//=============================================================================
// GENERATOR utils
//=============================================================================

//
// Get the generation config of a given plugin
// plugin: A plugin object
// pluginsConfigPath : Path to plugins config
// Sample plugin object :
// {
//   name: "react-native-code-push",
//   version: "1.2.3"
// }
export async function getPluginConfig(plugin, pluginsConfigPath) {
  let result = {}
  const pluginConfigPath = getPluginConfigPath(plugin, pluginsConfigPath)

  // If there is a base file (common to all versions) use it and optionally
  // patch it with specific version config (if present)
  if (fs.existsSync(`${pluginConfigPath}/${pluginConfigFileName}`)) {
    result = await readFile(`${pluginConfigPath}/${pluginConfigFileName}`)
        .then(JSON.parse)

    // Add default value (convention) for Android subsection for missing fields
    if (result.android) {
      if (!result.android.root) {
        result.android.root = "android"
      }

      if (!result.android.pluginHook) {
        result.android.pluginHook = {}
        const matchedFiles =
          shell.find(pluginConfigPath).filter(function(file) { return file.match(/\.java$/); })
        if (matchedFiles && matchedFiles.length === 1) {
          const pluginHookClass = path.basename(matchedFiles[0], '.java')
          result.android.pluginHook.name = pluginHookClass
          if (fs.readFileSync(matchedFiles[0], 'utf-8').includes('public static class Config')) {
            result.android.pluginHook.configurable = true
          }
        }
      }
    }
  }

  // No config, assume apigen module (temporary)
  // we need to patch the build.gradle file accordingly to update
  // birdge dependency compile statement with platform version
  else {
    console.log(`No config.json file for ${plugin.name}. Assuming apigen module`)
    result = {
      android: {
        root: 'android',
        moduleName: 'lib',
        transform: [
          {file: 'android/lib/build.gradle'}
        ]
      }
    }
  }

  if (!result.origin) {
    if (npmScopeModuleRe.test(plugin.name)) {
      result.origin = {
        type: 'npm',
        scope: `${npmScopeModuleRe.exec(`${plugin.name}`)[1]}`,
        name: `${npmScopeModuleRe.exec(`${plugin.name}`)[2]}`
      }
    } else {
       result.origin = {
        type: 'npm',
        name: plugin.name
      }
    }
  }

  // If there is no specified version, assume plugin version by default
  if (!result.origin.version) {
    result.origin.version = plugin.version
  }

  return result
}

// Returns the base path of a given plugin generation config
export function getPluginConfigPath(plugin, pluginsConfigPath) {
  return `${pluginsConfigPath}/${plugin.name}`
}

export async function bundleMiniApps(miniapps, paths, plugins, platform) {
  try {
    console.log(`[=== Starting mini apps bundling ===]`)

    // Specific case where we use container gen to generate
    // container for runner and we want to bundle the local miniapp
    if ((miniapps.length === 1) && (miniapps[0].localPath)) {
      shell.cd(miniapps[0].localPath)
    }
    // Generic case
    else {
      await generateMiniAppsComposite(miniapps, paths.compositeMiniApp, {plugins})
    }

    // Clear react packager cache beforehand to avoid surprises ...
    clearReactPackagerCache()

    if (platform === 'android') {
      await spin(`Bundling miniapp(s) for Android`, reactNativeBundleAndroid(paths))
    } else if (platform === 'ios') {
      await spin(`Bundling miniapp(s) for iOS`, reactNativeBundleIos(paths))
    }

    console.log(`[=== Completed mini apps bundling ===]`)
  } catch (e) {
      console.log("[bundleMiniApps] Something went wrong: " + e)
  }
}

export async function reactNativeBundleAndroid(paths) {
  return reactNative.bundle({
    entryFile: 'index.android.js',
    dev: false,
    bundleOutput: `${paths.outFolder}/android/lib/src/main/assets/index.android.bundle`,
    platform: 'android',
    assetsDest: `${paths.outFolder}/android/lib/src/main/res`
  })
}

export async function reactNativeBundleIos(paths) {
  const miniAppOutFolder = `${paths.outFolder}/ios/ElectrodeContainer/Libraries/MiniApp`

  if (!fs.existsSync(miniAppOutFolder)) {
    shell.mkdir('-p', miniAppOutFolder)
  }

  return reactNative.bundle({
    entryFile: 'index.ios.js',
    dev: false,
    bundleOutput: `${miniAppOutFolder}/MiniApp.jsbundle`,
    platform: 'ios',
    assetsDest: `${miniAppOutFolder}`
  })
}

export async function generateMiniAppsComposite(miniapps, folder, {verbose, plugins}) {
  shell.mkdir('-p', folder)
  shell.cd(folder)

  let content = ""
  for (const miniapp of miniapps) {
    const miniAppName = miniapp.scope ? `@${miniapp.scope}/${miniapp.name}`
        : miniapp.name
    content += `import '${miniAppName}'\n`
    await spin(`Retrieving and installing ${miniAppName}@${miniapp.version}`,
        yarnAdd(miniAppName, miniapp.version))
  }

  // REWORK
  // If code push plugin is present we need to do some additional work
  /*if (plugins) {
    const codePushPlugin = _.find(plugins, p => p.name === 'react-native-code-push')
    if (codePushPlugin) {
      await yarnAdd(codePushPlugin.name, codePushPlugin.version)
      content += `import codePush from "react-native-code-push"\n`
      content += `codePush.sync()`

      // We need to add some info to package.json for CodePush
      // In order to run, code push needs to find the following in package.json
      // - name & version
      // - react-native in the dependency block
      // TODO :For now we hardcode these values for demo purposes. That being said it
      // might not be needed to do something better because it seems like
      // code push is not making a real use of this data
      // Investigate further.
      // https://github.com/Microsoft/code-push/blob/master/cli/script/command-executor.ts#L1246
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
      packageJson.dependencies['react-native'] =
          _.find(plugins, p => p.name === 'react-native').version
      packageJson.name = "container"
      packageJson.version = "0.0.1"
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))
    }
  }*/

  console.log(`writing index.android.js`)
  await writeFile('./index.android.js', content)
  console.log(`writing index.ios.js`)
  await writeFile('./index.ios.js', content)
}

export function clearReactPackagerCache() {
  shell.rm('-rf', `${process.env['TMPDIR']}/react-*`)
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
export async function downloadPluginSource(pluginOrigin) {
  let downloadPath
  if (pluginOrigin.type === 'npm') {
    if (pluginOrigin.scope) {
      await yarnAdd(`${pluginOrigin.scope}/${pluginOrigin.name}`, pluginOrigin.version)
      downloadPath = `node_modules/${pluginOrigin.scope}/${pluginOrigin.name}`
    } else {
      await yarnAdd(pluginOrigin.name, pluginOrigin.version)
      downloadPath = `node_modules/${pluginOrigin.name}`
    }
  } else if (pluginOrigin.type === 'git') {
      if (pluginOrigin.version) {
        await gitClone(pluginOrigin.url, { branch: pluginOrigin.version })
        downloadPath = gitFolderRe.exec(`${pluginOrigin.url}`)[1]
      }
  }

  return Promise.resolve(`${shell.pwd()}/${downloadPath}`)
}

export function handleCopyDirective(sourceRoot, destRoot, arr) {
  for (const cp of arr) {
    const sourcePath = `${sourceRoot}/${cp.source}`
    const destPath = `${destRoot}/${cp.dest}`
    if (!fs.existsSync(destPath)) {
      shell.mkdir('-p', destPath)
    }
    shell.cp('-R', sourcePath, destPath)
  }
}

//=============================================================================
// MISC utils
//=============================================================================

// Promisify ora spinner
// there is already a promise method on ora spinner, unfortunately it does
// not return the wrapped promise so that's utterly useless !
export async function spin(msg, prom, options) {
  const spinner = new Ora(options ? options : msg)
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
export function capitalizeFirstLetter(string) {
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`
}

//=============================================================================
// YARN utils
//=============================================================================

export async function yarnAdd(name, version) {
  return new Promise((resolve, reject) => {
    exec(version ? `yarn add ${name}@${version}` : `yarn add ${name}`,
      (err, stdout, stderr) => {
        if (err) {
          console.log(err)
          reject(err)
        }
        if (stderr) {
          if (!stderr.startsWith('warning')) {
            console.log(stderr)
          }
        }
        if (stdout) {
          console.log(stdout)
          resolve(stdout)
        }
      })
  })
}

//=============================================================================
// Mustache related utilities
//=============================================================================

// Mustache render using a template file
// filename: Path to the template file
// view: Mustache view to apply to the template
// returns: Rendered string output
export async function mustacheRenderUsingTemplateFile(filename, view) {
  return readFile(filename, 'utf8')
      .then(template => Mustache.render(template, view))
}

// Mustache render to an output file using a template file
// templateFilename: Path to the template file
// view: Mustache view to apply to the template
// outputFile: Path to the output file
export async function mustacheRenderToOutputFileUsingTemplateFile(templateFilename, view, outputFile) {
  return mustacheRenderUsingTemplateFile(templateFilename, view).then(output => {
    return writeFile(outputFile, output)
  })
}

//=============================================================================
// GIT utils
//=============================================================================

export async function gitClone(url, { branch, destFolder } = {}) {
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
          console.log(err)
          reject(err)
        } else {
          console.log(stdout ? stdout : stderr)
          resolve(stdout ? stdout : stderr)
        }
      })
  })
}

export async function gitAdd() {
  return new Promise((resolve, reject) => {
    exec('git add .',
      (err, stdout, stderr) => {
        // Git seems to send stuff to stderr :(
        if (err) {
          console.log(err)
          reject(err)
        } else {
          console.log(stdout ? stdout : stderr)
          resolve(stdout ? stdout : stderr)
        }
      })
  })
}

export async function gitCommit(message) {
  let cmd = message
          ? `git commit -m '${message}'`
          : `git commit -m 'no message'`

  return new Promise((resolve, reject) => {
    exec(cmd,
      (err, stdout, stderr) => {
        // Git seems to send stuff to stderr :(
        if (err) {
          console.log(err)
          reject(err)
        } else {
          console.log(stdout ? stdout : stderr)
          resolve(stdout ? stdout : stderr)
        }
      })
  })
}

export async function gitTag(tag) {
  return new Promise((resolve, reject) => {
    exec(`git tag ${tag}`,
      (err, stdout, stderr) => {
        // Git seems to send stuff to stderr :(
        if (err) {
          console.log(err)
          reject(err)
        } else {
          console.log(stdout ? stdout : stderr)
          resolve(stdout ? stdout : stderr)
        }
      })
  })
}

export async function gitPush({
  remote = 'origin',
  branch = 'master',
  force = false,
  tags = false
} = {}) {
  let cmd = `git push ${remote} ${branch} ${force?'--force':''} ${tags?'--tags':''}`

  return new Promise((resolve, reject) => {
    exec(cmd,
      (err, stdout, stderr) => {
        // Git seems to send stuff to stderr :(
        if (err) {
          console.log(err)
          reject(err)
        } else {
          console.log(stdout ? stdout : stderr)
          resolve(stdout ? stdout : stderr)
        }
      })
  })
}

//=============================================================================
// Async wrappers
//=============================================================================

async function readFile(filename, enc) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, enc, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

async function writeFile(filename, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}