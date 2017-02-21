export default ({
    command: 'generate api',
    desc: 'Commands to execute api',
    builder(yargs){
        return yargs.commandDir('commands');
    }
})
