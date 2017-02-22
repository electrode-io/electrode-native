import MiniApp from '../../../lib/miniapp';
exports.command = 'android';
exports.desc = 'Run miniapp in android runner project';

exports.builder = function (yargs) {
    return yargs
        .option('verbose', {
            type: 'bool',
            describe: 'Verbose output'
        });
};

exports.handler = async function (argv) {
    await MiniApp.fromCurrentPath().runInAndroidRunner(argv.verbose);
};
