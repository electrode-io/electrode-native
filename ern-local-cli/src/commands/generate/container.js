import _ from 'lodash';
import cauldron from '../../util/cauldron.js';
import platform from '../../util/platform.js';
import explodeNapSelector from '../../util/explodeNapSelector.js';
const log = require('console-log-level')();
import ernConfig from '../../util/config.js'
import generateContainer from '../../../../ern-container-gen/index.js';

exports.command = 'container <fullNapSelector> <containerVersion>'
exports.desc = 'Run the container generator for a specified native application'

exports.builder = function(yargs) {
  return yargs
    .option('verbose', {
      type: 'bool',
      describe: 'verbose output'
    });
}

exports.handler = async function (argv) {
  try {
    const nativeApp =
      await cauldron.getNativeApp(...explodeNapSelector(argv.fullNapSelector));
    const plugins =
      await cauldron.getNativeDependencies(...explodeNapSelector(argv.fullNapSelector));
    const reactNativePlugin = _.find(plugins, p => p.name === 'react-native');
    const miniapps =
      await cauldron.getReactNativeApps(...explodeNapSelector(argv.fullNapSelector));
    let versionBeforeSwitch;

    if (platform.currentVersion !== nativeApp.ernPlatformVersion) {
      versionBeforeSwitch = platform.currentVersion;
      platform.switchToVersion(nativeApp.ernPlatformVersion);
    }

    const platformName = explodeNapSelector(argv.fullNapSelector)[1];

    if (platformName === 'android') {
      let generator = ernConfig.obj.libgen.android.generator;
      generator.containerPomVersion = argv.containerVersion;
      await generateContainer({
        nativeAppName: explodeNapSelector(argv.fullNapSelector)[0],
        platformPath: platform.currentPlatformVersionPath,
        generator,
        plugins,
        miniapps,
        verbose: argv.verbose
      });

    } else {
      throw new Error(`${platformName} not supported yet`);
    }

    if (versionBeforeSwitch) {
      platform.switchToVersion(versionBeforeSwitch);
    }
  } catch(e) {
    log.error(e);
  }
}
