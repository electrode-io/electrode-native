import platform from '../../../util/platform.js'
import {generateApi} from '../../../../../ern-api-gen/index.js'
const log = require('console-log-level')();

exports.command = 'init <apiName>';
exports.desc = 'Create a new api';

exports.builder = function (yargs) {
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
    })
};

exports.handler = async function (argv) {
    try {
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
    } catch (e) {
        log.error(`Initing project failed:`, e.message);
        process.exit(1);

    }
};
