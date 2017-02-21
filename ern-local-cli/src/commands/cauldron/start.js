import child_process from 'child_process';
const execSync = child_process.execSync;
import {platform} from '@walmart/ern-util';

exports.command = 'start'
exports.desc = 'Start the cauldron service locally'

exports.builder = {}

exports.handler =  function (argv) {
    process.chdir(`${platform.currentPlatformVersionPath}/ern-cauldron-api`);
    execSync('npm start');
}
