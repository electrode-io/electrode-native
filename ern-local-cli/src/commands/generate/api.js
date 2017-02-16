exports.command = 'api'
exports.desc = 'Commands to execute api';
exports.builder = function (yargs) {
    return yargs.commandDir('api').strict()
};
exports.handler = function (argv) {
};
