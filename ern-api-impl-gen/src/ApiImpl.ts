import fs from 'fs-extra'
import inquirer from 'inquirer'
import path from 'path'
import {
  fileUtils,
  log,
  ModuleTypes,
  PackagePath,
  Platform,
  readPackageJsonSync,
  shell,
  writePackageJsonSync,
  yarn,
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
    apiImplHull: string
    outDirectory: string
  }
}) {
  log.debug('Entering generate API IMPL')
  try {
    // get the directory to output the generated project.
    paths.outDirectory = outputDirectory = formOutputDirectoryName(
      packageName,
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
      reactNativeVersion,
      scope
    )

    const platforms = getPlatforms(nativeOnly)

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
  if (!forceGenerate && (await fs.pathExists(outputDirectoryPath))) {
    const { shouldRegenerate } = await inquirer.prompt([
      <inquirer.Question>{
        default: false,
        message: `An implementation directory already exists in ${outputDirectoryPath}. Do you want to delete this and regenerate this project?`,
        name: 'shouldRegenerate',
        type: 'confirm',
      },
    ])

    if (!shouldRegenerate) {
      throw Error('An implementation directory already exists')
    } else {
      forceGenerate = true
    }
  }

  if (forceGenerate && (await fs.pathExists(outputDirectoryPath))) {
    log.info(
      `Deleting the existing directory and recreating a new one in ${outputDirectoryPath}`
    )
    fileUtils.chmodr('755', outputDirectoryPath)
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
  reactNativeVersion: string,
  scope?: string
) {
  shell.pushd(outputDirectoryPath)
  try {
    await yarn.init()
    await yarn.add(
      PackagePath.fromString(`react-native@${reactNativeVersion}`),
      { dev: true }
    )
    await yarn.add(apiDependency)
    shell.cp(
      path.join(
        Platform.currentPlatformVersionPath,
        'ern-api-impl-gen/resources/gitignore'
      ),
      path.join(outputDirectoryPath, '.gitignore')
    )
    ernifyPackageJson(
      outputDirectoryPath,
      apiImplName,
      packageName,
      nativeOnly,
      hasConfig,
      reactNativeVersion,
      scope
    )
  } finally {
    shell.popd()
  }
}

function formOutputDirectoryName(outputName: string, outputPath: string) {
  return path.join(outputPath ? outputPath : process.cwd(), outputName)
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
  reactNativeVersion: string,
  scope?: string
) {
  const packageJson = readPackageJsonSync(outputDirectoryPath)
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

  if (nativeOnly) {
    packageJson.ern.pluginConfig = {
      android: {
        root: 'android/lib',
      },
      ios: {
        copy: [
          {
            dest: '{{{projectName}}}/APIImpls',
            source: 'ios/ElectrodeApiImpl/APIImpls/*',
          },
        ],
        pbxproj: {
          addSource: [
            {
              from: 'ios/ElectrodeApiImpl/APIImpls/*.swift',
              group: 'APIImpls',
              path: 'APIImpls',
            },
          ],
        },
        requiresManualLinking: true,
      },
    }
  }

  packageJson.keywords
    ? packageJson.keywords.push(moduleType)
    : (packageJson.keywords = [moduleType])
  writePackageJsonSync(outputDirectoryPath, packageJson)
}
