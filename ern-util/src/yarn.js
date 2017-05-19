import tagOneLine from './tagoneline.js';
const log = require('console-log-level')();
import child_process from 'child_process';

const exec = child_process.exec;
const execSync = child_process.execSync;

// Yarn add a given dependency
export async function yarnAdd(dependency, {dev} = {}) {
    return new Promise((resolve, reject) => {
        let _package = typeof(dependency) === 'string'
            ? dependency
            : `${dependency.scope ? `@${dependency.scope}/` : ``}${dependency.name}@${dependency.version}`
        exec(`yarn add ${_package} --exact ${dev ? '--dev' : ''}`,
            (err, stdout, stderr) => {
                if (err) {
                    log.error(err);
                    reject(err);
                } else {
                    resolve(stdout);
                }
            });
    });
}

export async function yarnInstall() {
    return new Promise((resolve, reject) => {
        exec(`yarn install`,
            (err, stdout, stderr) => {
                if (err) {
                    log.error(err);
                    reject(err);
                } else {
                    resolve(stdout);
                }
            });
    });
}

export function isYarnInstalled() {
    try {
        execSync('yarn --version');
        return true;
    } catch (e) {
        return false;
    }
}

export default ({
    isYarnInstalled,
    yarnInstall,
    yarnAdd
})
