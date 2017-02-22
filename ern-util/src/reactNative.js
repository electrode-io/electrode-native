import {exec} from 'child_process';
import fs from 'fs';
import path from 'path'

export default async function reactNativeInit(appName, rnVersion) {
    return new Promise((resolve, reject) => {
        const dir = path.join(process.cwd(), appName);
        if (fs.existsSync(dir)) {
            return reject(new Error(`Path already exists will not override ${dir}`));
        }
        exec(`react-native init ${appName} --version react-native@${rnVersion} --skip-jest`,
            (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                resolve(stdout);
            });
    });
}
