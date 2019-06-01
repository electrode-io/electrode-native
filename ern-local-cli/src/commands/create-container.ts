import {
  PackagePath,
  AppVersionDescriptor,
  NativePlatform,
  kax,
  Platform,
  createTmpDir,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  runLocalContainerGen,
  runLocalCompositeGen,
  runCauldronContainerGen,
  runCauldronCompositeGen,
} from 'ern-orchestrator'
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
import { parseJsonFromStringOrFile } from 'ern-orchestrator'

export const command = 'create-container'
export const desc = 'Create a Container locally'

export const builder = (argv: Argv) => {
  return argv
    .option('baseComposite', {
      describe: 'Base Composite',
      type: 'string',
    })
    .coerce('baseComposite', d => PackagePath.fromString(d))
    .option('dependencies', {
      alias: 'deps',
      describe:
        'A list of one or more extra native dependencies to include in this container',
      type: 'array',
    })
    .option('compositeDir', {
      describe: 'Directory in which to generate the Composite',
      type: 'string',
    })
    .coerce('dependencies', d => d.map(PackagePath.fromString))
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
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
      // DEPRECATED IN 0.31.0 TO BE REMOVED IN 0.35.0
      alias: 'js',
      describe: 'Generates JS only (composite app) [DEPRECATED]',
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
  baseComposite,
  compositeDir,
  dependencies,
  descriptor,
  extra,
  fromGitBranches,
  ignoreRnpmAssets,
  jsApiImpls,
  jsOnly,
  miniapps,
  outDir,
  platform,
}: {
  baseComposite?: PackagePath
  compositeDir?: string
  dependencies?: PackagePath[]
  descriptor?: AppVersionDescriptor
  extra?: string
  fromGitBranches?: boolean
  ignoreRnpmAssets?: boolean
  jsApiImpls?: PackagePath[]
  jsOnly?: boolean
  miniapps?: PackagePath[]
  outDir?: string
  platform?: NativePlatform
} = {}) => {
  if (jsOnly) {
    throw new Error(`--jsOnly/--js option flag has been deprecated in 0.31.0.
To create a JS composite, you can now use 'ern create-composite' command.`)
  }

  if (outDir && fs.existsSync(outDir)) {
    if (fs.readdirSync(outDir).length > 0) {
      throw new Error(
        `${outDir} directory exists and is not empty.
Output directory should either not exist (it will be created) or should be empty.`
      )
    }
  }

  compositeDir = compositeDir || createTmpDir()

  await logErrorAndExitIfNotSatisfied({
    noGitOrFilesystemPath: {
      extraErrorMessage:
        'You cannot provide dependencies using git or file scheme for this command. Only the form miniapp@version is allowed.',
      obj: dependencies,
    },
  })

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
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      descriptor
    )
    baseComposite =
      baseComposite || (compositeGenConfig && compositeGenConfig.baseComposite)
  }

  if (dependencies && descriptor) {
    throw new Error(
      `You cannot provide extra native dependencies, when creating a Container from Cauldron`
    )
  }

  if (!descriptor && miniapps) {
    platform = platform || (await askUserToSelectAPlatform())

    const composite = await kax.task('Generating Composite locally').run(
      runLocalCompositeGen(miniapps, {
        baseComposite,
        jsApiImpls,
        outDir: compositeDir,
      })
    )

    outDir = outDir || Platform.getContainerGenOutDirectory(platform)
    await kax.task('Generating Container locally').run(
      runLocalContainerGen(platform, composite, {
        extra: extraObj,
        extraNativeDependencies: dependencies || [],
        ignoreRnpmAssets,
        outDir,
      })
    )
  } else if (descriptor) {
    const composite = await kax.task('Generating Composite from Cauldron').run(
      runCauldronCompositeGen(descriptor, {
        baseComposite,
        favorGitBranches: !!fromGitBranches,
        outDir: compositeDir,
      })
    )

    outDir =
      outDir || Platform.getContainerGenOutDirectory(descriptor.platform!)
    await kax.task('Generating Container from Cauldron').run(
      runCauldronContainerGen(descriptor, composite, {
        outDir,
      })
    )
  }
  log.info(
    `Container successfully generated in ${outDir}\nComposite generated in ${compositeDir}`
  )
}

export const handler = tryCatchWrap(commandHandler)
