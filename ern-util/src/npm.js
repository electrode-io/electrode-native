const child_process = require('child_process');
const exec = child_process.exec;
const log = require('console-log-level')();

import inquirer from 'inquirer';

export function npm(cmd, args = [], options = {
    cwd: process.cwd()
}) {
    return new Promise((resolve, reject) => {
        exec(`npm ${cmd} ${args.join(' ')}`, options,
            (err, stdout, stderr) => {
                if (err) {
                    log.error(stderr);
                    return reject(err);
                }
                return resolve(stdout);
            });
    });
}
export default ({
    npm
})