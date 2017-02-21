import MiniApp from '../../lib/miniapp';

exports.command = 'upgrade <platformVersion> [force]'
exports.desc = 'Upgrade the mini app to a specific platform version'

exports.builder = function (yargs) {
    return yargs
        .option('force', {
            alias: 'f',
            type: 'bool',
            describe: 'Force upgrade'
        }).demandCommand(1, 'upgrade needs a platformVersion');
}

exports.handler = async function (argv) {
    return await MiniApp.fromCurrentPath().upgradeToPlatformVersion(
        argv.platformVersion.toString().replace('v', ''), argv.force);
};
