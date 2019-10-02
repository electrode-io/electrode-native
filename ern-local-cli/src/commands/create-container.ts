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
import untildify from 'untildify'

export const command = 'create-container'
export const desc = 'Create a Container locally'

export const builder = (argv: Argv) => {
  return argv
    .option('baseComposite', {
      describe: 'Base Composite',
      type: 'string',
    })
    .coerce('baseComposite', d => PackagePath.fromString(d))
    .option('compositeDir', {
      describe: 'Directory in which to generate the Composite',
      type: 'string',
    })
    .coerce('compositeDir', p => untildify(p))
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
    .coerce('outDir', p => untildify(p))
    .option('sourceMapOutput', {
      describe: 'Path to source map file to generate for this container bundle',
      type: 'string',
    })
    .coerce('sourceMapOutput', p => untildify(p))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  baseComposite,
  compositeDir,
  descriptor,
  extra,
  fromGitBranches,
  ignoreRnpmAssets,
  jsApiImpls,
  miniapps,
  outDir,
  platform,
  sourceMapOutput,
}: {
  baseComposite?: PackagePath
  compositeDir?: string
  descriptor?: AppVersionDescriptor
  extra?: string
  fromGitBranches?: boolean
  ignoreRnpmAssets?: boolean
  jsApiImpls?: PackagePath[]
  miniapps?: PackagePath[]
  outDir?: string
  platform?: NativePlatform
  sourceMapOutput?: string
} = {}) => {
  if (outDir && fs.existsSync(outDir)) {
    if (fs.readdirSync(outDir).length > 0) {
      throw new Error(
        `${outDir} directory exists and is not empty.
Output directory should either not exist (it will be created) or should be empty.`
      )
    }
  }

  compositeDir = compositeDir || createTmpDir()

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
        ignoreRnpmAssets,
        outDir,
        sourceMapOutput,
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
        sourceMapOutput,
      })
    )
  }
  log.info(
    `Container successfully generated in ${outDir}\nComposite generated in ${compositeDir}`
  )
}

export const handler = tryCatchWrap(commandHandler)
