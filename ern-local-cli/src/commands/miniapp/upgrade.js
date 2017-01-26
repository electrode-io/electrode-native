import { upgradeMiniAppToPlatformVersion } from '../../util/miniapp.js';

exports.command = 'upgrade <platformVersion>'
exports.desc = 'Upgrade the mini app to a specific platform version'

exports.builder = function(yargs) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      describe: 'Platform version to check compatibility with'
    });
}

exports.handler = async function (argv) {
  await upgradeMiniAppToPlatformVersion(argv.platformVersion.toString().replace('v',''));
}
