import child_process from 'child_process';
const execSync = child_process.execSync;
import platform from '../../util/platform.js';

exports.command = 'start'
exports.desc = 'Start the cauldron service locally'

exports.builder = {}

exports.handler = async function (argv) {
  try {
    process.chdir(`${platform.currentPlatformVersionPath}/ern-cauldron-api`);
    execSync('npm start');
  } catch(e) {
    logError(`[ern cauldron start] ${e}`);
  }
}
