import _ from 'lodash';
import cauldron from '../../util/cauldron.js';
import platform from '../../util/platform.js';
import explodeNapSelector from '../../util/explodeNapSelector.js';
import { logError } from '../../util/log.js';
import ernConfig from '../../util/config.js'
import generateContainer from '../../../../ern-container-gen/index.js';

exports.command = 'container <napSelector> <containerVersion>'
exports.desc = 'Run the container generator for a specified native application'

exports.builder = {}

exports.handler = async function (argv) {
  try {
    const nativeApp =
      await cauldron.getNativeApp(...explodeNapSelector(argv.napSelector));
    const plugins =
      await cauldron.getNativeDependencies(...explodeNapSelector(argv.napSelector));
    const reactNativePlugin = _.find(plugins, p => p.name === 'react-native');
    const miniapps =
      await cauldron.getReactNativeApps(...explodeNapSelector(argv.napSelector));
    let versionBeforeSwitch;

    if (platform.currentVersion !== nativeApp.ernPlatformVersion) {
      versionBeforeSwitch = platform.currentVersion;
      platform.switchToVersion(nativeApp.ernPlatformVersion);
    }

    const platformName = explodeNapSelector(argv.napSelector)[1];

    if (platformName === 'android') {
      let generator = ernConfig.obj.libgen.android.generator;
      generator.containerPomVersion = argv.containerVersion;
      await generateContainer({
        nativeAppName: explodeNapSelector(argv.napSelector)[0],
        platformPath: platform.currentPlatformVersionPath,
        generator,
        pluginNames: _.map(plugins, p => p.name),
        miniapps
      });

    } else {
      throw new Error(`${platformName} not supported yet`);
    }

    if (versionBeforeSwitch) {
      platform.switchToVersion(versionBeforeSwitch);
    }
  } catch(e) {
    logError(`[ern libgen] ${e}`);
  }
}
