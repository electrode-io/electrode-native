import { Composite, GeneratedComposite } from 'ern-composite-gen';
import {
  AppVersionDescriptor,
  createTmpDir,
  kax,
  log,
  PackagePath,
  YarnLockParser,
} from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import treeify from 'treeify';
import * as constants from './constants';
import path from 'path';

export async function runLocalCompositeGen(
  miniappPackagesPaths: PackagePath[],
  {
    baseComposite,
    jsApiImpls,
    outDir,
    resolutions,
  }: {
    baseComposite?: PackagePath;
    jsApiImpls?: PackagePath[];
    outDir?: string;
    resolutions?: { [pkg: string]: string };
  },
): Promise<GeneratedComposite> {
  try {
    const composite = await kax.task('Generating Composite').run(
      GeneratedComposite.generate({
        baseComposite,
        jsApiImplDependencies: jsApiImpls,
        miniApps: miniappPackagesPaths,
        outDir: outDir || createTmpDir(),
        resolutions,
      }),
    );

    await validateCompositeNativeDependencies(composite);

    return composite;
  } catch (e) {
    log.error(`runLocalCompositeGen failed: ${e}`);
    throw e;
  }
}

// Run container generator using the Cauldron, given a native application descriptor
export async function runCauldronCompositeGen(
  napDescriptor: AppVersionDescriptor,
  {
    baseComposite,
    outDir,
    favorGitBranches,
  }: {
    baseComposite?: PackagePath;
    outDir?: string;
    favorGitBranches?: boolean;
  } = {},
): Promise<GeneratedComposite> {
  try {
    const cauldron = await getActiveCauldron();
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      napDescriptor,
    );
    baseComposite =
      baseComposite ||
      (compositeGenConfig?.baseComposite &&
        PackagePath.fromString(compositeGenConfig.baseComposite));
    const miniapps = await cauldron.getContainerMiniApps(napDescriptor, {
      favorGitBranches,
    });
    const jsApiImpls = await cauldron.getContainerJsApiImpls(napDescriptor);

    // bypassYarnLock to move into compositeGen config
    const containerGenConfig = await cauldron.getContainerGeneratorConfig(
      napDescriptor,
    );
    let pathToYarnLock;

    if (!containerGenConfig || !containerGenConfig.bypassYarnLock) {
      pathToYarnLock = await cauldron.getPathToYarnLock(
        napDescriptor,
        constants.CONTAINER_YARN_KEY,
      );
    } else {
      log.debug(
        'Bypassing yarn.lock usage as bypassYarnLock flag is set in Cauldron config',
      );
    }

    const composite = await kax.task('Generating Composite').run(
      GeneratedComposite.generate({
        baseComposite,
        jsApiImplDependencies: jsApiImpls,
        miniApps: miniapps,
        outDir: outDir || createTmpDir(),
        pathToYarnLock,
        resolutions: compositeGenConfig && compositeGenConfig.resolutions,
      }),
    );

    await validateCompositeNativeDependencies(composite);

    return composite;
  } catch (e) {
    log.error(`runCauldronCompositeGen failed: ${e}`);
    throw e;
  }
}

export async function validateCompositeNativeDependencies(
  composite: Composite,
) {
  // Validate composite native dependencies
  const resolution = await composite.getResolvedNativeDependencies();
  if (resolution.pluginsWithMismatchingVersions.length > 0) {
    logMismatchingDependenciesTree(composite, resolution);
    throw new Error(`The following plugins are using incompatible versions:
     ${resolution.pluginsWithMismatchingVersions.toString()}`);
  }
  try {
    logResolvedDependenciesTree(composite, resolution);
  } catch (e) {
    log.error(e);
  }
}

export function logResolvedAndMismatchingDependenciesTree(
  composite: Composite,
  resolution: {
    pluginsWithMismatchingVersions: string[];
    resolved: PackagePath[];
  },
) {
  logResolvedDependenciesTree(composite, resolution);
  if (resolution.pluginsWithMismatchingVersions.length > 0) {
    logMismatchingDependenciesTree(composite, resolution);
  }
}

export function logResolvedDependenciesTree(
  composite: Composite,
  resolution: {
    pluginsWithMismatchingVersions: string[];
    resolved: PackagePath[];
  },
) {
  const parser = YarnLockParser.fromPath(
    path.join(composite.path, 'yarn.lock'),
  );
  log.debug('[ == RESOLVED NATIVE DEPENDENCIES ==]');
  logDependenciesTree(
    parser,
    resolution.resolved.map((x) => PackagePath.fromString(x.name!)),
    'debug',
  );
}

export function logMismatchingDependenciesTree(
  composite: Composite,
  resolution: {
    pluginsWithMismatchingVersions: string[];
    resolved: PackagePath[];
  },
) {
  const parser = YarnLockParser.fromPath(
    path.join(composite.path, 'yarn.lock'),
  );
  log.error('[ == MISMATCHING NATIVE DEPENDENCIES ==]');
  logDependenciesTree(
    parser,
    resolution.pluginsWithMismatchingVersions.map(PackagePath.fromString),
    'error',
  );
}

export function logDependenciesTree(
  parser: YarnLockParser,
  deps: PackagePath[],
  logLevel: 'debug' | 'error',
) {
  for (const dep of deps) {
    const depTree = parser.buildDependencyTree(dep);
    logLevel === 'debug'
      ? log.debug(treeify.asTree(depTree, true, true))
      : log.error(treeify.asTree(depTree, true, true));
  }
}
