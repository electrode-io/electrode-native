exports.command = 'generate api';
exports.desc = 'Commands to execute api';
exports.builder = function (yargs) {
    return yargs.commandDir('api').demandCommand(1, 'Need a command')
};
