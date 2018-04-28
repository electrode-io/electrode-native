import fs from 'fs'
import inquirer from 'inquirer'
import path from 'path'
import {
  PackagePath,
  shell,
  fileUtils,
  ModuleTypes,
  yarn,
  Platform,
  log,
} from 'ern-core'
import ApiImplGen from './generators/ApiImplGen'

export default async function generateApiImpl({
  apiDependency,
  apiImplName,
  outputDirectory,
  nativeOnly,
  forceGenerate = false,
  reactNativeVersion,
  hasConfig = false,
  packageName,
  scope,
  paths,
}: {
  apiDependency: PackagePath
  apiImplName: string
  outputDirectory: string
  nativeOnly: boolean
  forceGenerate?: boolean
  reactNativeVersion: string
  hasConfig?: boolean
  packageName: string
  scope?: string
  paths: {
    workingDirectory: string
    pluginsDownloadDirectory: string
    apiImplHull: string
    outDirectory: string
  }
}) {
  log.debug('Entering generate API IMPL')
  try {
    // get the directory to output the generated project.
    paths.outDirectory = outputDirectory = formOutputDirectoryName(
      apiImplName,
      outputDirectory
    )
    await createOutputDirectory(outputDirectory, forceGenerate)
    await createNodePackage(
      outputDirectory,
      apiDependency,
      apiImplName,
      packageName,
      nativeOnly,
      hasConfig,
      scope
    )

    const platforms = getPlatforms(nativeOnly)

    // Creates a working directory to collect all the necessary files/directories for the api-impl generation.
    createWorkingDirectory(paths.workingDirectory)
    createPluginsDownloadDirectory(paths.pluginsDownloadDirectory)

    await new ApiImplGen().generateApiImplementation(
      apiDependency,
      paths,
      reactNativeVersion,
      platforms
    )
  } catch (e) {
    log.debug('command failed performing cleanup.')
    throw new Error(e)
  }
}

async function createOutputDirectory(
  outputDirectoryPath: string,
  forceGenerate: boolean
) {
  if (!forceGenerate && fs.existsSync(outputDirectoryPath)) {
    const { shouldRegenerate } = await inquirer.prompt(<inquirer.Question>{
      default: false,
      message: `An implementation directory already exists in ${outputDirectoryPath}. Do you want to delete this and regenerate this project?`,
      name: 'shouldRegenerate',
      type: 'confirm',
    })

    if (!shouldRegenerate) {
      throw Error('An implementation directory already exists')
    } else {
      forceGenerate = true
    }
  }

  if (forceGenerate && fs.existsSync(outputDirectoryPath)) {
    log.info(
      `Deleting the existing directory and recreating a new one in ${outputDirectoryPath}`
    )
    fileUtils.chmodr('777', outputDirectoryPath)
    shell.rm('-Rf', outputDirectoryPath)
  } else {
    log.debug(`creating output dir: ${outputDirectoryPath}`)
  }
  shell.mkdir('-p', outputDirectoryPath)
}

async function createNodePackage(
  outputDirectoryPath: string,
  apiDependency: PackagePath,
  apiImplName: string,
  packageName: string,
  nativeOnly: boolean,
  hasConfig: boolean,
  scope?: string
) {
  const currentDirectory = process.cwd()
  shell.cd(outputDirectoryPath)
  await yarn.init()
  await yarn.add(apiDependency)
  shell.cp(
    path.join(
      Platform.currentPlatformVersionPath,
      'ern-api-impl-gen',
      'resources',
      'gitignore'
    ),
    path.join(outputDirectoryPath, '.gitignore')
  )
  ernifyPackageJson(
    outputDirectoryPath,
    apiImplName,
    packageName,
    nativeOnly,
    hasConfig,
    scope
  )
  shell.cd(currentDirectory)
}

function createWorkingDirectory(workingDirectoryPath: string) {
  shell.rm('-rf', workingDirectoryPath)
  shell.mkdir('-p', workingDirectoryPath)
  log.debug(`Working directory created: ${workingDirectoryPath}`)
}

function createPluginsDownloadDirectory(pluginsDownloadPath: string) {
  shell.rm('-rf', pluginsDownloadPath)
  shell.mkdir('-p', pluginsDownloadPath)
}

function formOutputDirectoryName(
  apiImplName: string,
  outputDirectoryPath: string
) {
  return outputDirectoryPath
    ? path.join(outputDirectoryPath, apiImplName)
    : path.join(process.cwd(), apiImplName)
}

function getPlatforms(nativeOnly: boolean): string[] {
  return nativeOnly ? ['android', 'ios'] : ['js']
}

function ernifyPackageJson(
  outputDirectoryPath: string,
  apiImplName: string,
  packageName: string,
  nativeOnly: boolean,
  hasConfig: boolean,
  scope?: string
) {
  const packageJsonPath = path.join(outputDirectoryPath, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const moduleType = nativeOnly
    ? ModuleTypes.NATIVE_API_IMPL
    : ModuleTypes.JS_API_IMPL
  const containerGen = {
    hasConfig,
    moduleName: apiImplName,
  }
  packageJson.name = scope ? `@${scope}/${packageName}` : packageName
  packageJson.ern = {
    containerGen,
    moduleType,
  }
  packageJson.keywords
    ? packageJson.keywords.push(moduleType)
    : (packageJson.keywords = [moduleType])
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
}
