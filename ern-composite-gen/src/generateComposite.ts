import { gitCli, log, PackagePath, shell, yarn, kax } from 'ern-core'
import { cleanupCompositeDir } from './cleanupCompositeDir'
import fs from 'fs-extra'
import path from 'path'
import semver from 'semver'
import _ from 'lodash'
import { CompositeGeneratorConfig } from './types'
import uuidv4 from 'uuid/v4'
import { addRNDepToPjson } from './addRNDepToPjson'
import { getNodeModuleVersion } from './getNodeModuleVersion'
import { addRNStartScriptToPjson } from './addRNStartScriptToPjson'
import { createIndexJs } from './createIndexJs'
import { createBaseCompositeImports } from './createBaseCompositeImports'
import { patchMetroBabelRcRoots } from './patchMetroBabelRcRoots'
import { patchMetro51AssetsBug } from './patchMetro51AssetsBug'
import { patchMetroBabelEnv } from './patchMetroBabelEnv'
import { createBabelRc } from './createBabelRc'
import { applyYarnResolutions } from './applyYarnResolutions'
import { createMetroConfig } from './createMetroConfig'
import { createRNCliConfig } from './createRNCliConfig'
import { installPackages } from './installPackages'
import { installPackagesWithoutYarnLock } from './installPackagesWithoutYarnLock'
import { installExtraPackages } from './installExtraPackages'

export async function generateComposite(config: CompositeGeneratorConfig) {
  log.debug(`generateComposite config : ${JSON.stringify(config, null, 2)}`)

  // Set env var ERN_BUGSNAG_CODE_BUNDLE_ID as a unique code bundle id for bugsnag
  process.env.ERN_BUGSNAG_CODE_BUNDLE_ID =
    process.env.ERN_BUGSNAG_CODE_BUNDLE_ID ?? uuidv4()

  if (
    config.miniApps.length === 0 &&
    (config.jsApiImplDependencies || []).length === 0
  ) {
    throw new Error(
      `At least one MiniApp or JS API implementation is needed to generate a composite`
    )
  }

  return config.baseComposite
    ? generateCompositeFromBase(
        config.miniApps,
        config.outDir,
        config.baseComposite,
        {
          extraJsDependencies: config.extraJsDependencies,
          jsApiImplDependencies: config.jsApiImplDependencies,
        }
      )
    : generateFullComposite(config.miniApps, config.outDir, {
        extraJsDependencies: config.extraJsDependencies,
        jsApiImplDependencies: config.jsApiImplDependencies,
        pathToYarnLock: config.pathToYarnLock,
        resolutions: config.resolutions,
      })
}

async function generateCompositeFromBase(
  miniApps: PackagePath[],
  outDir: string,
  baseComposite: PackagePath,
  {
    extraJsDependencies = [],
    jsApiImplDependencies,
  }: {
    extraJsDependencies?: PackagePath[]
    jsApiImplDependencies?: PackagePath[]
  } = {}
) {
  if (baseComposite.isRegistryPath) {
    throw new Error(
      `baseComposite can only be a file or git path (${baseComposite})`
    )
  }

  if ((await fs.pathExists(outDir)) && (await fs.readdir(outDir)).length > 0) {
    throw new Error(
      `${outDir} directory exists and is not empty.
Composite output directory should either not exist (it will be created) or should be empty.`
    )
  } else {
    shell.mkdir('-p', outDir)
  }

  if (baseComposite.isGitPath) {
    await gitCli().clone(baseComposite.basePath, outDir)
    if (baseComposite.version) {
      await gitCli(outDir).checkout(baseComposite.version)
    }
  } else {
    shell.cp('-Rf', path.join(baseComposite.basePath, '{.*,*}'), outDir)
  }

  const jsPackages = jsApiImplDependencies
    ? [...miniApps, ...jsApiImplDependencies]
    : miniApps

  shell.pushd(outDir)
  try {
    await installPackagesWithoutYarnLock({ cwd: outDir, jsPackages })
    await createBaseCompositeImports({ cwd: outDir })
    if (extraJsDependencies) {
      await installExtraPackages({ cwd: outDir, extraJsDependencies })
    }
  } finally {
    shell.popd()
  }
}

async function generateFullComposite(
  miniApps: PackagePath[],
  outDir: string,
  {
    extraJsDependencies = [],
    jsApiImplDependencies,
    pathToYarnLock,
    resolutions,
  }: {
    extraJsDependencies?: PackagePath[]
    jsApiImplDependencies?: PackagePath[]
    pathToYarnLock?: string
    resolutions?: { [pkg: string]: string }
  } = {}
) {
  if (await fs.pathExists(outDir)) {
    await kax
      .task('Cleaning up existing composite directory')
      .run(cleanupCompositeDir(outDir))
  } else {
    shell.mkdir('-p', outDir)
  }

  shell.pushd(outDir)

  try {
    await installPackages({
      cwd: outDir,
      jsApiImplDependencies,
      miniApps,
      pathToYarnLock,
    })
    await addRNStartScriptToPjson({ cwd: outDir })
    await createIndexJs({ cwd: outDir })
    if (extraJsDependencies) {
      await installExtraPackages({
        cwd: outDir,
        extraJsDependencies: [
          PackagePath.fromString('ern-bundle-store-metro-asset-plugin'),
          ...extraJsDependencies,
        ],
      })
    }
    if (resolutions) {
      // This function should be be called prior to applying
      // any file patches in node_modules, as it will run
      // `yarn install`, thus potentially clearing any previously
      // applied patches
      await applyYarnResolutions({ cwd: outDir, resolutions })
    }
    await patchMetroBabelRcRoots({ cwd: outDir })
    await createBabelRc({ cwd: outDir })
    await createMetroConfig({ cwd: outDir })
    const rnVersion = await getNodeModuleVersion({
      cwd: outDir,
      name: 'react-native',
    })
    if (semver.gte(rnVersion, '0.57.0')) {
      await createRNCliConfig({ cwd: outDir })
    }
    await addRNDepToPjson(outDir, rnVersion)
    if (semver.lt(rnVersion, '0.60.0')) {
      await patchMetro51AssetsBug({ cwd: outDir })
    }
    await patchMetroBabelEnv({ cwd: outDir })
  } finally {
    shell.popd()
  }
}
