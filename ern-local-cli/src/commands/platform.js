exports.command = 'platform <command>'
exports.desc = 'Platform related commands'
exports.builder = function (yargs) {
    return yargs.commandDir('platform').demandCommand(1, 'platform needs a command');
};
