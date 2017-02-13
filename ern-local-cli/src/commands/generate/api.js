exports.command = 'api'
exports.desc = 'Commands to execute api';
exports.builder = function (yargs) {
    return yargs.commandDir('api')
};
exports.handler = function (argv) {
};
