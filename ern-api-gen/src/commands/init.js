import {generateApi} from '../index.js'
export default ({
    command: 'init <apiName>',
    desc: 'Create a new api',
    builder(yargs){
        return yargs.option('modelSchemaPath', {
            alias: 'm',
            describe: 'Path to model schema'
        }).option('npmScope', {
            alias: 'n',
            describe: 'NPM scope of project'
        }).option('apiVersion', {
            alias: 'a',
            describe: 'Initial npm version'
        }).option('apiAuthor', {
            alias: 'u',
            describe: `Author of library default is : ${process.env['EMAIL'] || process.env['USER']}`
        });
    },
    handler: async function (argv, platform) {
        const bridgeDep = platform.getPlugin('@walmart/react-native-electrode-bridge');
        const reactNative = platform.getPlugin('react-native');

        await generateApi({
            bridgeVersion: `${bridgeDep.version}`,
            reactNativeVersion: reactNative.version,
            name: argv.apiName,
            npmScope: argv.npmScope,
            modelSchemaPath: argv.modelSchemaPath,
            apiVersion: argv.apiVersion,
            apiAuthor: argv.apiAuthor
        });
    }
});
