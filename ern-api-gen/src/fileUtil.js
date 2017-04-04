import fs from 'fs';
/**
 * ==============================================================================
 * Async wrappers around node fs
 * ==============================================================================
 */
export async function readFile(filename, encoding = 'utf8') {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, encoding, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}
export async function readJSON(filename) {
    const content = await readFile(filename);
    return JSON.parse(content);
}
export async function writeFile(filename, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}
