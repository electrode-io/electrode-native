const chalk = require('chalk');
const path = require('path');

const run = require('../utils/run');

console.log(chalk.bold.blue(`Working directory: ${process.cwd()}`));

const miniAppName = 'BasicMiniApp';
run(`create-miniapp ${miniAppName} --packageName basic-miniapp --skipNpmCheck --skipInstall`);

const miniAppPath = path.join(process.cwd(), miniAppName);

// Escape backslashes on Windows
const miniApp = `file:${
  process.platform === 'win32'
    ? miniAppPath.replace(/\\/g, '\\\\')
    : miniAppPath
}`;

run(`create-container -m ${miniApp} -p android`);
run(`create-container -m ${miniApp} -p ios --skipInstall`);
