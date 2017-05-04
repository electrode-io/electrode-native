import {config as ernConfig, cauldron, explodeNapSelector, platform} from '@walmart/ern-util';

import {
  generateContainer,
  generateMiniAppsComposite,
  MavenGenerator,
  GithubGenerator
} from '@walmart/ern-container-gen';

import _ from 'lodash'
import inquirer from 'inquirer';

const log = require('console-log-level')();

exports.command = 'container'
exports.desc = 'Run the container generator'

exports.builder = function (yargs) {
  return yargs
    .option('verbose', {
      type: 'bool',
      describe: 'verbose output'
    })
    .option('fullNapSelector', {
      type: 'string',
      alias: 'n',
      describe: 'Full native application selector'
    })
    .option('containerVersion', {
      type: 'string',
      alias: 'v',
      describe: 'Version of the generated container'
    })
    .option('jsOnly', {
      type: 'bool',
      alias: 'js',
      describe: 'Generates JS only (composite app)'
    })
    .option('outputFolder', {
      type: 'string',
      alias: 'out',
      describe: 'Output folder path (only used with jsOnly flag)'
    });
};

exports.handler = async function (argv) {
  let fullNapSelector = argv.fullNapSelector
  let containerVersion = argv.containerVersion;

  if (!fullNapSelector) {
    const nativeApps = await cauldron.getAllNativeApps()

    let result = _.flattenDeep(
                  _.map(nativeApps, nativeApp => 
                    _.map(nativeApp.platforms, platform => 
                      _.map(platform.versions, version  => 
                       `${nativeApp.name}:${platform.name}:${version.name}`))))

     const { userSelectedFullNapSelector } = await inquirer.prompt([{
        type: 'list',
        name: 'userSelectedFullNapSelector',
        message: `Choose a native application version for which to generate container`,
        choices: result
    }])

    fullNapSelector = userSelectedFullNapSelector
  }

  if (!containerVersion && !argv.jsOnly) {
     const { userSelectedContainerVersion } = await inquirer.prompt([{
        type: 'input',
        name: 'userSelectedContainerVersion',
        message: `Enter version for the generated container`
    }]);

    containerVersion = userSelectedContainerVersion
  }

  const miniapps =
    await cauldron.getReactNativeApps(...explodeNapSelector(fullNapSelector));
  const plugins =
    await cauldron.getNativeDependencies(...explodeNapSelector(fullNapSelector));

  if (argv.jsOnly) {
    let outputFolder = argv.outputFolder

    if (!outputFolder) {
      const { userSelectedOutputFolder } = await inquirer.prompt([{
        type: 'input',
        name: 'userSelectedOutputFolder',
        message: `Enter output folder path`
      }]);

      outputFolder = userSelectedOutputFolder
    }

    await generateMiniAppsComposite(miniapps, outputFolder, {plugins});
  } else {
    const nativeApp =
      await cauldron.getNativeApp(...explodeNapSelector(fullNapSelector));

    const platformName = explodeNapSelector(fullNapSelector)[1];

    const generator = (platformName === 'android') 
      ? new MavenGenerator({ 
          mavenRepositoryUrl: ernConfig.obj.libgen.android.generator.mavenRepositoryUrl,
          namespace: ernConfig.obj.libgen.android.generator.namespace
        })
      : new GithubGenerator({
          targetRepoUrl: ernConfig.obj.libgen.ios.generator.targetRepoUrl
        })

    await generateContainer({
      containerVersion:  containerVersion,
      nativeAppName: explodeNapSelector(fullNapSelector)[0],
      platformPath: platform.currentPlatformVersionPath,
      generator,
      plugins,
      miniapps,
      verbose: argv.verbose
    });
  }
};
