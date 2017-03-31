import {config as ernConfig, cauldron, explodeNapSelector, platform} from '@walmart/ern-util';

import {
  generateContainer,
  MavenGenerator,
  GithubGenerator
} from '@walmart/ern-container-gen';

const log = require('console-log-level')();

exports.command = 'container <fullNapSelector> <containerVersion>'
exports.desc = 'Run the container generator for a specified native application'

exports.builder = function (yargs) {
  return yargs
    .option('verbose', {
      type: 'bool',
      describe: 'verbose output'
    });
};

exports.handler = async function (argv) {
  const nativeApp =
    await cauldron.getNativeApp(...explodeNapSelector(argv.fullNapSelector));
  const plugins =
    await cauldron.getNativeDependencies(...explodeNapSelector(argv.fullNapSelector));
  const miniapps =
    await cauldron.getReactNativeApps(...explodeNapSelector(argv.fullNapSelector));
  let versionBeforeSwitch;

  if (platform.currentVersion !== nativeApp.ernPlatformVersion) {
    versionBeforeSwitch = platform.currentVersion;
    platform.switchToVersion(nativeApp.ernPlatformVersion);
  }

  const platformName = explodeNapSelector(argv.fullNapSelector)[1];

  const generator = (platformName === 'android') 
    ? new MavenGenerator({ 
        mavenRepositoryUrl: ernConfig.obj.libgen.android.generator.mavenRepositoryUrl,
        namespace: ernConfig.obj.libgen.android.generator.namespace
      })
    : new GithubGenerator({
        targetRepoUrl: ernConfig.obj.libgen.ios.generator.targetRepoUrl
      })

  await generateContainer({
    containerVersion:  argv.containerVersion,
    nativeAppName: explodeNapSelector(argv.fullNapSelector)[0],
    platformPath: platform.currentPlatformVersionPath,
    generator,
    plugins,
    miniapps,
    verbose: argv.verbose
  });

  if (versionBeforeSwitch) {
    platform.switchToVersion(versionBeforeSwitch);
  }
};
