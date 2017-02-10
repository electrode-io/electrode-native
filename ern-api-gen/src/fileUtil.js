import fs from 'fs';
/**
 * ==============================================================================
 * Async wrappers around node fs
 * ==============================================================================
 */
export async function readFile(filename, encoding) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, encoding, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}
export async function readJSON(filename) {
    return readFile(filename, 'utf8').then(JSON.parse);
}
export async function writeFile(filename, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}
