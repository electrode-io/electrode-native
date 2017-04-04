exports.command = 'message';
exports.desc = 'Commands to execute message';
exports.builder = function (yargs) {
    return yargs.commandDir('message').demandCommand(1, 'Need a command')
};
