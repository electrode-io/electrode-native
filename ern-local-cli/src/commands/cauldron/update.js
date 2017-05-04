exports.command = 'update';
exports.desc = 'Update objects in the Cauldron';
exports.builder = function (yargs) {
    return yargs.commandDir('update').demandCommand(1, 'Need a command')
};
exports.handler = function (argv) {
};
