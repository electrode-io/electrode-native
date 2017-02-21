import {config as ernConfig, cauldron, explodeNapSelector} from '@walmart/ern-util';

import {generateContainer} from '@walmart/ern-container-gen';

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

};
