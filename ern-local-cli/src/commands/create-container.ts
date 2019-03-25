import { generateMiniAppsComposite } from 'ern-container-gen'
import {
  PackagePath,
  NativeApplicationDescriptor,
  Platform,
  log,
  NativePlatform,
  kax,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { runLocalContainerGen, runCauldronContainerGen } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
  askUserToChooseANapDescriptorFromCauldron,
  askUserToSelectAPlatform,
} from '../lib'
import _ from 'lodash'
import { Argv } from 'yargs'
import fs from 'fs'
import path from 'path'
import { parseJsonFromStringOrFile } from 'ern-orchestrator'

export const command = 'create-container'
export const desc = 'Create a container locally'

export const builder = (argv: Argv) => {
  return argv
    .option('dependencies', {
      alias: 'deps',
      describe:
        'A list of one or more extra native dependencies to include in this container',
      type: 'array',
    })
    .coerce('dependencies', d => d.map(PackagePath.fromString))
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra run configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
    .option('fromGitBranches', {
      describe:
        'Create Container based on MiniApps branches rather than current MiniApps SHAs',
      type: 'boolean',
    })
    .option('ignoreRnpmAssets', {
      describe: 'Ignore rnpm assets from the MiniApps',
      type: 'boolean',
    })
    .option('jsApiImpls', {
      describe: 'A list of one or more JS API implementation',
      type: 'array',
    })
    .coerce('jsApiImpls', d => d.map(PackagePath.fromString))
    .option('jsOnly', {
      alias: 'js',
      describe: 'Generates JS only (composite app)',
      type: 'boolean',
    })
    .option('miniapps', {
      alias: 'm',
      describe: 'A list of one or more miniapps',
      type: 'array',
    })
    .coerce('miniapps', d => d.map(PackagePath.fromString))
    .option('platform', {
      alias: 'p',
      choices: ['android', 'ios', undefined],
      describe: 'The platform for which to generate the container',
      type: 'string',
    })
    .option('outDir', {
      alias: 'out',
      describe: 'Directory to output the generated container to',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  dependencies = [],
  descriptor,
  extra,
  fromGitBranches,
  ignoreRnpmAssets,
  jsApiImpls = [],
  jsOnly,
  miniapps,
  outDir,
  platform,
}: {
  dependencies: PackagePath[]
  descriptor?: NativeApplicationDescriptor
  extra?: string
  fromGitBranches?: boolean
  ignoreRnpmAssets?: boolean
  jsApiImpls: PackagePath[]
  jsOnly?: boolean
  miniapps?: PackagePath[]
  outDir?: string
  platform?: NativePlatform
}) => {
  if (outDir && fs.existsSync(outDir)) {
    if (fs.readdirSync(outDir).length > 0) {
      throw new Error(
        `${outDir} directory exists and is not empty.
Output directory should either not exist (it will be created) or should be empty.`
      )
    }
  }

  await logErrorAndExitIfNotSatisfied({
    noGitOrFilesystemPath: {
      extraErrorMessage:
        'You cannot provide dependencies using git or file scheme for this command. Only the form miniapp@version is allowed.',
      obj: dependencies,
    },
  })

  if (dependencies.length > 0 && (jsOnly || descriptor)) {
    throw new Error(
      `You can only provide extra native dependencies, when generating a non-JS-only / non-Cauldron based container`
    )
  }

  const cauldron = await getActiveCauldron({ throwIfNoActiveCauldron: false })
  if (!cauldron && !miniapps) {
    throw new Error(
      "A Cauldron must be active, if you don't explicitly provide miniapps"
    )
  }

  const extraObj = (extra && (await parseJsonFromStringOrFile(extra))) || {}

  // Full native application selector was not provided.
  // Ask the user to select a completeNapDescriptor from a list
  // containing all the native applications versions in the cauldron
  // Not needed if miniapps are directly provided
  if (!descriptor && !miniapps) {
    descriptor = await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    })
  }

  if (descriptor) {
    await logErrorAndExitIfNotSatisfied({
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'You cannot create a container for a non-existing native application version.',
      },
    })
  }

  // --jsOnly switch
  // Ony generates the composite miniapp to a provided output directory
  if (jsOnly) {
    if (!miniapps) {
      if (!descriptor) {
        return log.error(
          'You need to provide a native application descriptor, if not providing miniapps'
        )
      }
      miniapps = await cauldron.getContainerMiniApps(descriptor, {
        favorGitBranches: !!fromGitBranches,
      })
      jsApiImpls = await cauldron.getContainerJsApiImpls(descriptor)
    }

    let pathToYarnLock
    if (descriptor) {
      const containerGenConfig = await cauldron.getContainerGeneratorConfig(
        descriptor
      )
      if (!containerGenConfig || !containerGenConfig.bypassYarnLock) {
        pathToYarnLock = await cauldron.getPathToYarnLock(
          descriptor,
          'container'
        )
      } else {
        log.debug(
          'Bypassing yarn.lock usage as bypassYarnLock flag is set in config'
        )
      }
    }

    await generateMiniAppsComposite(
      miniapps,
      outDir || path.join(Platform.rootDirectory, 'miniAppsComposite'),
      pathToYarnLock ? { pathToYarnLock } : {},
      jsApiImpls
    )
  } else {
    if (!descriptor && miniapps) {
      platform = platform || (await askUserToSelectAPlatform())

      await kax.task('Generating Container locally').run(
        runLocalContainerGen(miniapps, jsApiImpls, platform, {
          extra: extraObj,
          extraNativeDependencies: dependencies,
          ignoreRnpmAssets,
          outDir,
        })
      )
    } else if (descriptor) {
      await runCauldronContainerGen(descriptor, { outDir })
    }
  }
}

export const handler = tryCatchWrap(commandHandler)
