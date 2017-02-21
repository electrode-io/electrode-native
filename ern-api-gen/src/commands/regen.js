import {generateCode} from '../index.js'
const log = require('console-log-level')();

export default ({
    command: 'regen',
    desc: 'Regenerates an api',
    builder(yargs){
        return yargs;
    },
    handler: async function (argv) {
        await generateCode();
    }
});
