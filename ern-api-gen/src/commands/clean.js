import {cleanGenerated} from '../index.js'

export default ({
    command: 'clean',
    desc: 'Remove generated artifacts',
    handler: async function () {
        await cleanGenerated();
    }
})
