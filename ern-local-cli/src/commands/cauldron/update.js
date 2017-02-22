exports.command = 'update <command>';
exports.desc = 'Update stuff in the Cauldron';
exports.builder = function (yargs) {
    return yargs.commandDir('update');
};
exports.handler = function (argv) {
};
