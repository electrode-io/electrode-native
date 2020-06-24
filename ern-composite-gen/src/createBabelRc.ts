import fs from 'fs-extra';
import path from 'path';
import uuidv4 from 'uuid/v4';
import semver from 'semver';
import { log, readPackageJson, writePackageJson } from 'ern-core';
import { getNodeModuleVersion } from './getNodeModuleVersion';

export async function createBabelRc({
  cwd,
  extraPaths = [],
}: {
  cwd: string;
  extraPaths?: string[];
}) {
  log.debug('Creating top level composite .babelrc');
  const compositePackageJson = await readPackageJson(cwd);
  const compositeNodeModulesPath = path.join(cwd, 'node_modules');
  const compositeReactNativeVersion = await getNodeModuleVersion({
    cwd,
    name: 'react-native',
  });

  const compositeBabelRc: { plugins: any[]; presets?: string[] } = {
    plugins: [],
  };

  const paths = [
    ...Object.keys(compositePackageJson.dependencies).map((d) =>
      path.join(compositeNodeModulesPath, d),
    ),
    ...extraPaths,
  ];

  // Ugly hacky way of handling module-resolver babel plugin
  // At least it has some guarantees to make it safer but its just a temporary
  // solution until we figure out a more proper way of handling this plugin
  log.debug(
    'Taking care of potential Babel module-resolver plugins used by MiniApps',
  );
  let moduleResolverAliases: { [k: string]: any } = {};
  for (const p of paths) {
    let miniAppPackageJson;
    try {
      miniAppPackageJson = await readPackageJson(p);
    } catch (e) {
      // swallow (for test. to be fixed)
      continue;
    }
    const miniAppName = miniAppPackageJson.name;
    if (miniAppPackageJson.babel) {
      if (miniAppPackageJson.babel.plugins) {
        for (const babelPlugin of miniAppPackageJson.babel.plugins) {
          if (Array.isArray(babelPlugin)) {
            if (babelPlugin.includes('module-resolver')) {
              // Add unique name to this composite top level module-resolver to avoid
              // it messing with other module-resolver plugin configurations that could
              // be defined in the .babelrc config of individual MiniApps
              // https://babeljs.io/docs/en/options#plugin-preset-merging
              babelPlugin.push(uuidv4());
              // Copy over module-resolver plugin & config to top level composite .babelrc
              log.debug(
                `Taking care of module-resolver Babel plugin for ${miniAppName} MiniApp`,
              );
              if (compositeBabelRc.plugins.length === 0) {
                // First MiniApp to add module-resolver plugin & config
                // easy enough, we just copy over the plugin & config
                compositeBabelRc.plugins.push(<any>babelPlugin);
                for (const x of babelPlugin) {
                  if (x instanceof Object && x.alias) {
                    moduleResolverAliases = x.alias;
                    break;
                  }
                }
              } else {
                // Another MiniApp  has already declared module-resolver
                // plugin & config. If we have conflicts for aliases, we'll just abort
                // bundling as of now to avoid generating a potentially unstable bundle
                for (const item of babelPlugin) {
                  if (item instanceof Object && item.alias) {
                    for (const aliasKey of Object.keys(item.alias)) {
                      if (
                        moduleResolverAliases[aliasKey] &&
                        moduleResolverAliases[aliasKey] !== item.alias[aliasKey]
                      ) {
                        throw new Error('Babel module-resolver alias conflict');
                      } else if (!moduleResolverAliases[aliasKey]) {
                        moduleResolverAliases[aliasKey] = item.alias[aliasKey];
                      }
                    }
                  }
                }
              }
            } else {
              log.warn(
                `Unsupported Babel plugin type ${babelPlugin.toString()} in ${miniAppName} MiniApp`,
              );
            }
          } else {
            log.warn(
              `Unsupported Babel plugin type ${babelPlugin.toString()} in ${miniAppName} MiniApp`,
            );
          }
        }
      }
      log.debug(
        `Removing babel object from ${miniAppName} MiniApp package.json`,
      );
      delete miniAppPackageJson.babel;
      await writePackageJson(p, miniAppPackageJson);
    }
  }

  if (semver.gte(compositeReactNativeVersion, '0.57.0')) {
    compositeBabelRc.presets = ['module:metro-react-native-babel-preset'];
  } else {
    compositeBabelRc.presets = ['react-native'];
  }

  return fs.writeFile(
    path.join(cwd, '.babelrc'),
    JSON.stringify(compositeBabelRc, null, 2),
  );
}
