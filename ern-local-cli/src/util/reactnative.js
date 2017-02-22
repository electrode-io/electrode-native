import {exec} from 'child_process';
import fs from 'fs';
import path from 'path'
const log = require('console-log-level')();

export async function reactNativeInit(appName, rnVersion) {
    return new Promise((resolve, reject) => {
        const dir = path.join(process.cwd(), appName);
        if (fs.existsSync(dir)) {
            return reject(new Error(`Path already exists will not override ${dir}`));
        }
        exec(`react-native init ${appName} --version react-native@${rnVersion} --skip-jest`,
            (err, stdout, stderr) => {
                if (err) {
                    log.error(err);
                    reject(err);
                } else if (stdout) {
                    resolve(stdout);
                }
            });
    });
}
