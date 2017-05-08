import {explodeNapSelector, cauldron} from '@walmart/ern-util';

exports.command = 'nativeapp <napSelector> [platformVersion]';
exports.desc = 'Add a native application to the cauldron';

exports.builder = function (yargs) {
  return yargs
      .option('platformVersion', {
          alias: 'v',
          describe: 'Platform version'
      });
};

exports.handler = async function (argv) {
  await cauldron.addNativeApp(
      argv.platformVersion ? argv.platformVersion.toString().replace('v', '') : undefined,
      ...explodeNapSelector(argv.napSelector));
};
